/**
 * SOL 14: RED HORIZON — Keşif rotaları (D-012) (K6)
 *  Sol rota: buzu incele -> kır -> (kalıntı varsa) fotoğrafla -> topla; kalıntısız buz bilimsel örnek verir.
 *            Toplanan kalıntılar habitata girince "bulgu raporu" olarak downlink kuyruğuna girer.
 *  Lav tüneli (ayrı alt harita): 3 bulgu + son odada 3 kısa çalışma; rapor yalnızca merdiven tabanındaki röleden.
 * DOM'a dokunmaz; tüm durum gameState.explore içinde (kalıcı).
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const X = {};

  const cfg = () => D().explore;
  X.clusters = () => cfg().ice.clusters;
  X.cluster = (id) => X.clusters().find((c) => c.id === id);
  X.relic = (id) => cfg().ice.relics.find((r) => r.id === id);
  X.caveFinds = () => cfg().cave.finds;
  X.caveStudies = () => cfg().cave.studies;

  /* ---------------- Sol rota: buz kümeleri ---------------- */

  /** Kümenin bir sonraki adımı: inspect | break | photo | collect | sample | done */
  X.iceStep = function (s, id) {
    const c = X.cluster(id);
    const r = s.explore.ice[id];
    if (!r.inspected) return 'inspect';
    if (!r.broken) return 'break';
    if (c.relic) {
      if (r.photo === null) return 'photo';
      if (!r.collected) return 'collect';
      return 'done';
    }
    return r.sampled ? 'done' : 'sample';
  };

  /** RIMFAX varsa kalıntılı buzda kırmadan önce zayıf sinyal görünür; görsel ipucu (parıltı/siluet) her zaman */
  X.iceHint = function (s, id) {
    const c = X.cluster(id);
    if (!c.relic) return null;
    if (S.Sim.has(s, 'rimfax')) return 'signal';
    return c.hint !== 'none' ? c.hint : null;
  };

  X.iceAction = function (s, id, step) {
    const c = X.cluster(id);
    const r = s.explore.ice[id];
    const ic = cfg().ice;
    if (!c || !r) return { ok: false };
    const want = X.iceStep(s, id);
    if (step !== want) return { ok: false, errKey: 'ice.err_order' };
    let out = { ok: true, step };
    if (step === 'inspect') {
      r.inspected = true;
      S.Sim.advance(s, ic.inspectMin);
      out.hasRelic = Boolean(c.relic);
      out.hint = X.iceHint(s, id);
    } else if (step === 'break') {
      r.broken = true;
      S.Sim.advance(s, ic.breakMin);
      S.bus.emit('audio:play', 'quake');
      S.bus.emit('explore:ice_broken', { id });
      out.relic = c.relic;
    } else if (step === 'photo') {
      const cam = S.Sim.has(s, 'mastcam_z');
      r.photo = cam ? 1 : ic.photoNoCameraFactor;
      S.Sim.advance(s, ic.photoMin);
      S.bus.emit('audio:play', 'scan');
      out.quality = r.photo;
    } else if (step === 'collect') {
      r.collected = true;
      const rel = X.relic(c.relic);
      const rw = rel.reward || {};
      if (rw.repairKits) s.inventory.repairKits += rw.repairKits;
      if (rw.extraMbit) s.downlink.extraMbit += rw.extraMbit;
      S.Sim.advance(s, ic.collectMin);
      S.bus.emit('audio:play', 'success');
      out.relic = c.relic;
    } else if (step === 'sample') {
      r.sampled = true;
      s.res.waterL += ic.sampleWaterL;
      S.Sim.advance(s, ic.sampleMin);
      S.bus.emit('audio:play', 'success');
      out.waterL = ic.sampleWaterL;
    }
    return out;
  };

  /** Habitata girince: toplanmış ama raporlanmamış kalıntılar rapor paketi olur (üs = bulgu raporlama merkezi) */
  X.fileRelicReports = function (s) {
    const filed = [];
    for (const c of X.clusters()) {
      if (!c.relic) continue;
      const r = s.explore.ice[c.id];
      const rep = s.explore.reports['relic_' + c.id];
      if (!r.collected || rep.queued || rep.sent) continue;
      const rel = X.relic(c.relic);
      rep.score = Math.round(rel.points * (r.photo || 0.5));
      rep.queued = true;
      S.Sim.queuePacket(s, { kind: 'report', refId: 'relic_' + c.id, titleKey: 'packet.relic', vars: { item: S.t('relic.' + c.relic) }, sizeMbit: rel.reportMbit, points: rep.score });
      S.logDecision({ category: 'science', titleKey: 'log.relic.title', choiceKey: 'relic.' + c.relic, resultKey: 'relic.' + c.relic + '.use', vars: {}, score: rep.score }, s);
      filed.push(c.relic);
    }
    return filed;
  };

  /* ---------------- Lav tüneli ---------------- */
  X.caveLength = () => cfg().cave.lengthM;

  X.descend = function (s) {
    if (s.player.zone === 'cave') return { ok: false };
    s.player.zone = 'cave';
    s.player.cx = cfg().cave.ladderM;
    s.player.facing = 1;
    s.explore.cave.visited = true;
    S.bus.emit('audio:play', 'door');
    S.bus.emit('explore:cave', { inside: true });
    return { ok: true };
  };

  X.ascend = function (s) {
    if (s.player.zone !== 'cave') return { ok: false };
    s.player.zone = 'surface';
    s.player.x = D().terrain.map.tubeMouthM - 6;
    s.player.facing = -1;
    S.bus.emit('audio:play', 'door');
    S.bus.emit('explore:cave', { inside: false });
    return { ok: true };
  };

  X.entranceTemp = (s) => S.Sim.ambient(s);
  X.deepTemp = (s) => S.Engineering.calcCaveTempC(S.Sim.site(s), S.Sim.clockMinute(s), cfg().cave.skylight.tempSwingFraction);

  X.recordFind = function (s, id) {
    const f = X.caveFinds().find((x) => x.id === id);
    if (!f || s.explore.cave.finds[id]) return { ok: false };
    s.explore.cave.finds[id] = true;
    S.Sim.advance(s, f.minutes);
    S.bus.emit('audio:play', 'scan');
    return { ok: true };
  };

  /** Merdiven tabanında giriş sıcaklığı okunur (sıcaklık karşılaştırmasının ilk yarısı) */
  X.readEntranceTemp = function (s) {
    s.explore.cave.temp.entrance = X.entranceTemp(s);
    S.Sim.advance(s, 2);
    S.bus.emit('audio:play', 'scan');
    return { ok: true, c: s.explore.cave.temp.entrance };
  };

  X.runStudy = function (s, id) {
    const st = X.caveStudies().find((x) => x.id === id);
    const cave = s.explore.cave;
    if (!st) return { ok: false };
    if (id === 'temp') {
      if (cave.temp.entrance === null) return { ok: false, errKey: 'cave.err_need_entrance' };
      if (cave.temp.deep !== null) return { ok: false };
      cave.temp.deep = X.deepTemp(s);
    } else if (id === 'distance') {
      if (cave.distance !== null) return { ok: false };
      cave.distance = cfg().cave.roomSpanM;
    } else if (id === 'vibration') {
      if (cave.vibration !== null) return { ok: false };
      cave.vibration = cfg().cave.vibrationPoints.map((p) => ({ id: p.id, amplitude: p.amplitude }));
    }
    S.Sim.advance(s, st.minutes);
    S.bus.emit('audio:play', 'scan');
    return { ok: true, result: X.studyResult(s, id) };
  };

  X.studyDone = function (s, id) {
    const c = s.explore.cave;
    if (id === 'temp') return c.temp.deep !== null;
    if (id === 'distance') return c.distance !== null;
    return c.vibration !== null;
  };

  /**
   * Çalışma sonucu (metin anahtarı + değişkenler). Titreşim sonucu bilerek yoruma açıktır:
   * "yapı güvenli" diyen bir anahtar yoktur (D-012).
   */
  X.studyResult = function (s, id) {
    const c = s.explore.cave;
    if (id === 'temp') {
      if (c.temp.deep === null) return null;
      return { key: 'cave.res.temp', vars: { a: c.temp.entrance, b: c.temp.deep, d: Math.round(Math.abs(c.temp.entrance - c.temp.deep) * 10) / 10 } };
    }
    if (id === 'distance') return c.distance === null ? null : { key: 'cave.res.distance', vars: { m: c.distance } };
    if (!c.vibration) return null;
    const amps = c.vibration.map((v) => v.amplitude);
    const odd = c.vibration.reduce((a, b) => (Math.abs(b.amplitude - avg(amps)) > Math.abs(a.amplitude - avg(amps)) ? b : a));
    return { key: 'cave.res.vibration', vars: { point: S.t('cave.vp.' + odd.id) } };
  };

  function avg(a) {
    return a.reduce((x, y) => x + y, 0) / a.length;
  }

  /** Mağara araştırmasının tamamlanma sayısı (bulgu + çalışma) */
  X.caveProgress = function (s) {
    const c = s.explore.cave;
    const finds = Object.values(c.finds).filter(Boolean).length;
    const studies = X.caveStudies().filter((st) => X.studyDone(s, st.id)).length;
    return { finds, studies, total: X.caveFinds().length + X.caveStudies().length, done: finds + studies };
  };

  X.nearRelay = (s) => s.player.zone === 'cave' && Math.abs(s.player.cx - cfg().cave.relayM) <= cfg().cave.interactRangeM + 4;

  /** Röle üzerinden üsse rapor (bulgu sayısına göre puan); yalnızca merdiven tabanında */
  X.relayReport = function (s) {
    const rep = s.explore.reports.cave_survey;
    if (!X.nearRelay(s)) return { ok: false, errKey: 'cave.err_relay_far' };
    if (rep.queued || rep.sent) return { ok: false, errKey: 'cave.err_reported' };
    const p = X.caveProgress(s);
    if (p.done < 1) return { ok: false, errKey: 'cave.err_nothing' };
    const cc = cfg().cave;
    rep.score = cc.pointsBase + p.done * cc.pointsPerItem;
    rep.queued = true;
    S.Sim.queuePacket(s, { kind: 'report', refId: 'cave_survey', titleKey: 'packet.cave', vars: { n: p.done, total: p.total }, sizeMbit: cc.reportMbit, points: rep.score });
    S.logDecision({ category: 'science', titleKey: 'log.cave.title', choiceKey: 'log.cave.choice', resultKey: 'log.cave.result', vars: { n: p.done, total: p.total }, score: rep.score }, s);
    S.Sim.advance(s, 5);
    S.bus.emit('audio:play', 'success');
    return { ok: true, score: rep.score, done: p.done, total: p.total };
  };

  /** Mağarada sıradaki iş (hedef motoru için): {kind:'find'|'entrance'|'study'|'report'|'exit', atM, id} */
  X.nextCaveTask = function (s) {
    const c = s.explore.cave;
    const cc = cfg().cave;
    const rep = s.explore.reports.cave_survey;
    if (rep.queued || rep.sent) return { kind: 'exit', atM: cc.ladderM };
    if (c.temp.entrance === null) return { kind: 'entrance', atM: cc.relayM };
    const f = X.caveFinds().find((x) => !c.finds[x.id]);
    if (f) return { kind: 'find', id: f.id, atM: f.atM };
    const st = X.caveStudies().find((x) => !X.studyDone(s, x.id));
    if (st) return { kind: 'study', id: st.id, atM: st.atM };
    return { kind: 'report', atM: cc.relayM };
  };

  /** Açık rapor kaynakları (hedef motoru): kalıntılı buzlar ve mağara */
  X.openRelicClusters = function (s) {
    return X.clusters().filter((c) => c.relic && !s.explore.reports['relic_' + c.id].queued && !s.explore.reports['relic_' + c.id].sent);
  };
  X.caveOpen = (s) => !s.explore.reports.cave_survey.queued && !s.explore.reports.cave_survey.sent;

  /** Mevcut bölge kimliği (HUD bölge bandı) */
  X.zoneAt = function (s) {
    if (s.player.zone === 'cave') return 'cave';
    const z = D().terrain.map.zones.find((zz) => s.player.x >= zz.fromM && s.player.x < zz.toM);
    return z ? z.id : null;
  };

  S.Explore = X;
})((window.SOL14 = window.SOL14 || {}));
