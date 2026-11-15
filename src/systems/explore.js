/**
 * SOL 14: RED HORIZON — Keşif rotaları (D-012, 2026-11-15 birleştirmesiyle genişletildi) (K6)
 *  Kazı: araçlar hazır görünmez. Gömülü araçlar (doğuda Opportunity ve InSight, batıda Spirit, Phoenix, Beagle 2)
 *        kazı noktasında E ile kazılarak ortaya çıkar; sahte tümsekler boş çıkar (elbise tarayıcısı yalnızca gerçek
 *        bir şeyin yanında tepki verir, RIMFAX daha uzaktan sezer). Doğunun sonunda çökmüş tünel penceresi kazılarak açılır.
 *  Sol rota (buzul): buzu incele -> kır -> (kalıntı varsa) fotoğrafla -> topla; kalıntısız buz bilimsel örnek verir.
 *            Toplanan kalıntılar ve batı buluntuları (kargo aracı parçaları, Deep Space 2 sondası) habitata girince
 *            "bulgu raporu" olarak downlink kuyruğuna girer.
 *  Lav tüneli (ayrı alt harita): 3 bulgu + kurgusal İZCİ-1 rover'ının 5 parçası + son odada 3 kısa çalışma;
 *            rapor yalnızca merdiven tabanındaki röleden.
 *  Mineraller (Kişi 5): yüzeyde maden noktaları (tarayıcı öter, E ile kazılır), tünelde matkapla delinen damarlar;
 *            bulunan mineral inventory.minerals{ad: adet} içine girer (mineralCount / spendMinerals).
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
  X.scoutParts = () => cfg().cave.scout.parts;

  /* ---------------- Kazı: gömülü araçlar, sahte tümsekler, tünel penceresi ---------------- */
  X.digCfg = () => cfg().dig;
  X.digSites = () => cfg().dig.sites;
  X.site = (id) => X.digSites().find((st) => st.id === id);
  /** Kazı noktasının konumu (m): araçlı noktalar vakanın distanceM'sinde durur (tek kaynak) */
  X.siteAt = (st) => (st.case ? S.Forensics.get(st.case).distanceM : st.atM);
  X.siteSide = (st) => (X.siteAt(st) < 0 ? 'west' : 'east');
  X.siteHits = (s, st) => (s.explore && s.explore.dig[st.id]) || 0;
  // D-014: çarpmadan sonra sahte tümsekte gömülü kit varsa tümsek yeniden kazılabilir
  X.siteDone = (s, st) => X.siteHits(s, st) >= st.hits && !(S.Station && S.Station.moundItem(s, st.id));
  /** Altında bir şey var mı (araç ya da tünel)? Sahte tümsek boş çıkar */
  X.siteReal = (st) => Boolean(st.case || st.opens);
  X.tubeOpen = (s) => Boolean(s.explore && s.explore.tubeOpen);

  /** Bölgede henüz kazılmamış gerçek nokta (hedef motoru yalnızca yönü bilir, yeri söylemez) */
  X.hiddenLeft = (s, side) => X.digSites().filter((st) => X.siteReal(st) && X.siteSide(st) === side && !X.siteDone(s, st));

  /**
   * Elbise tarayıcısı: yakında gerçek bir gömülü nokta var mı? Sahte tümsek tepki vermez.
   * RIMFAX (yer radarı) varsa sinyal daha uzaktan gelir. Dönüş: { site, d, close } | null
   */
  X.scannerPing = function (s) {
    if (!s.explore || s.player.inside || s.player.zone === 'cave') return null;
    const dc = X.digCfg();
    const range = S.Sim.has(s, 'rimfax') ? dc.rimfaxRangeM : dc.reactRangeM;
    let best = null;
    for (const st of X.digSites()) {
      if (!X.siteReal(st) || X.siteDone(s, st)) continue;
      const d = Math.abs(X.siteAt(st) - s.player.x);
      if (d <= range && (!best || d < best.d)) best = { site: st, d, close: d <= dc.reactRangeM };
    }
    // Kişi 5: yüzeydeki maden noktaları da tarayıcıyı öttürür (site.atM; X.siteAt ile okunur)
    for (const st of X.mineralSites('surface')) {
      if (X.mineralDone(s, st)) continue;
      const d = Math.abs(st.atM - s.player.x);
      if (d <= range && (!best || d < best.d)) best = { site: st, d, close: d <= dc.reactRangeM, mineral: st.mineral };
    }
    return best;
  };

  /* ---------------- Mineraller (Kişi 5): tarayıcı sinyali -> diz çökme -> E ile kazma -> envanter ---------------- */
  const MC = () => cfg().minerals || { types: [], sites: [] };
  X.mineralTypes = () => MC().types;
  X.mineralType = (id) => MC().types.find((m) => m.id === id);
  /** zone: 'surface' | 'cave' | undefined (hepsi) */
  X.mineralSites = (zone) => MC().sites.filter((st) => !zone || st.zone === zone);
  X.mineralSite = (id) => MC().sites.find((st) => st.id === id);
  X.mineralHits = (s, st) => (s.explore && s.explore.minerals && s.explore.minerals[st.id]) || 0;
  /** Bitmiş nokta bir daha kazılamaz: aynı yerden mineral iki kez alınmaz */
  X.mineralDone = (s, st) => X.mineralHits(s, st) >= st.hits;
  /** Envanterdeki adet (Kişi 4 tamir, Kişi 6 yükseltme bunu okur) */
  X.mineralCount = (s, id) => (s.inventory && s.inventory.minerals && s.inventory.minerals[id]) || 0;
  /** Malzemeyi harca: { hematite: 1, ... }; yetmezse hiçbirine dokunmaz ve false döner */
  X.spendMinerals = function (s, need) {
    const inv = (s.inventory.minerals = s.inventory.minerals || {});
    if (!Object.entries(need || {}).every(([id, n]) => (inv[id] || 0) >= n)) return false;
    for (const [id, n] of Object.entries(need)) inv[id] -= n;
    S.bus.emit('inventory:minerals', { spent: need });
    return true;
  };
  /**
   * Alet kontrolü (matkap: Kişi 4). Kişi 4'ün S.Workshop.hasTool'u (inventory.tools) varsa o karar verir;
   * yoksa toolPlaceholder açıkken alet var sayılır (PLACEHOLDER, Kişi 4'ün aletleri main'e girince devre dışı kalır).
   */
  X.hasTool = function (s, tool) {
    if (!tool) return true;
    if (S.Workshop && S.Workshop.hasTool) return S.Workshop.hasTool(s, tool);
    if (MC().toolPlaceholder) return true;
    const inv = s.inventory || {};
    return Boolean(inv.tools && inv.tools[tool]);
  };
  /** Kişi 4 kuralı: kazma yoksa her vuruş tools.noPickaxeDigFactor kat uzun sürer (aletler yoksa 1) */
  X.digFactor = function (s) {
    const tc = D().tools;
    if (!tc || !(S.Workshop && S.Workshop.hasTool)) return 1;
    return S.Workshop.hasTool(s, 'pickaxe') ? 1 : tc.noPickaxeDigFactor;
  };

  /** Bir kazma/delme vuruşu: oyun dakikası harcar; son vuruşta mineral envantere girer */
  X.digMineral = function (s, id) {
    const st = X.mineralSite(id);
    if (!st || X.mineralDone(s, st)) return { ok: false };
    if (!X.hasTool(s, st.tool)) return { ok: false, errKey: 'mineral.need_' + st.tool };
    s.explore.minerals = s.explore.minerals || {};
    s.explore.minerals[id] = X.mineralHits(s, st) + 1;
    S.Sim.advance(s, st.minutesPerHit * X.digFactor(s));
    const hits = s.explore.minerals[id];
    const out = { ok: true, id, mineral: st.mineral, hits, total: st.hits, done: hits >= st.hits };
    S.bus.emit('dig:hit', { id, m: st.atM, hits, total: st.hits, kind: 'mineral', zone: st.zone });
    if (!out.done) {
      S.bus.emit('audio:play', 'land');
      return out;
    }
    const inv = (s.inventory.minerals = s.inventory.minerals || {});
    inv[st.mineral] = (inv[st.mineral] || 0) + st.amount;
    out.amount = st.amount;
    // İlk buluşta bilgi kartı (her tür için bir kez)
    const seen = (s.explore.mineralsSeen = s.explore.mineralsSeen || {});
    out.first = !seen[st.mineral];
    seen[st.mineral] = true;
    S.bus.emit('explore:mineral', { id, mineral: st.mineral, amount: st.amount, first: out.first });
    S.bus.emit('audio:play', 'success');
    return out;
  };

  /** Bir kazma vuruşu: oyun dakikası harcar (O₂, batarya, soğuk sürer); yeterli vuruşta araç çıkar / tünel açılır */
  X.dig = function (s, id) {
    const st = X.site(id);
    if (!st || X.siteDone(s, st)) return { ok: false };
    if (X.siteHits(s, st) >= st.hits) s.explore.dig[id] = 0; // çarpmadan önce boş kazılmıştı
    s.explore.dig[id] = X.siteHits(s, st) + 1;
    S.Sim.advance(s, st.minutesPerHit);
    const hits = s.explore.dig[id];
    const out = { ok: true, id, hits, total: st.hits, done: hits >= st.hits, kind: st.kind };
    S.bus.emit('dig:hit', { id, m: X.siteAt(st), hits, total: st.hits, kind: st.kind });
    if (!out.done) {
      S.bus.emit('audio:play', 'land');
      return out;
    }
    if (st.case) {
      S.Forensics.uncover(s, st.case);
      out.caseId = st.case;
    } else if (st.opens === 'tube') {
      s.explore.tubeOpen = true;
      out.tube = true;
      S.bus.emit('explore:tube_open', {});
    } else {
      out.item = S.Station ? S.Station.takeMoundItem(s, id) : null;
      out.empty = !out.item;
    }
    S.bus.emit('audio:play', out.empty ? 'fail' : 'quake');
    return out;
  };

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
    // Batı buluntuları (K2 Sude): kargo aracının üç parçası tamamlanınca ve Deep Space 2 sondası
    const wf = cfg().westFinds;
    const sv = s.salvage || { found: [] };
    const west = D().terrain.westRegion;
    const landerParts = west ? west.parts.map((pt) => pt.id) : [];
    const fileWest = (refId, ok, item, mbit, points) => {
      const rep = s.explore.reports[refId];
      if (!ok || !rep || rep.queued || rep.sent) return;
      rep.score = points;
      rep.queued = true;
      S.Sim.queuePacket(s, { kind: 'report', refId, titleKey: 'packet.' + refId, vars: {}, sizeMbit: mbit, points });
      S.logDecision({ category: 'science', titleKey: 'log.' + refId + '.title', choiceKey: 'log.' + refId + '.choice', resultKey: 'log.' + refId + '.result', vars: {}, score: points }, s);
      filed.push(item);
    };
    if (wf) {
      fileWest('west_lander', landerParts.length > 0 && landerParts.every((id) => sv.found.includes(id)), 'west_lander', wf.landerReportMbit, wf.landerPointsPerPart * landerParts.length);
      fileWest('west_probe', sv.found.includes('ds2_probe'), 'west_probe', wf.probeReportMbit, wf.probePoints);
    }
    return filed;
  };

  /* ---------------- Lav tüneli ---------------- */
  X.caveLength = () => cfg().cave.lengthM;

  X.descend = function (s) {
    if (s.player.zone === 'cave' || !X.tubeOpen(s)) return { ok: false }; // pencere önce kazılarak açılır
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

  /** İZCİ-1 parçası fotoğrafla (FIELD CAM sonucu kalite 0..1) */
  X.scoutDone = (s) => X.scoutParts().filter((pt) => s.explore.cave.scout[pt.id] !== null && s.explore.cave.scout[pt.id] !== undefined).length;
  X.photoScout = function (s, id, quality) {
    const pt = X.scoutParts().find((x) => x.id === id);
    if (!pt || (s.explore.cave.scout[id] !== null && s.explore.cave.scout[id] !== undefined)) return { ok: false };
    s.explore.cave.scout[id] = Math.round(Math.max(0.3, quality === undefined ? 1 : quality) * 100) / 100;
    S.Sim.advance(s, cfg().cave.scout.minutes);
    S.bus.emit('audio:play', 'scan');
    const n = X.scoutDone(s);
    return { ok: true, n, total: X.scoutParts().length, complete: n === X.scoutParts().length };
  };

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

  /** Mağara araştırmasının tamamlanma sayısı (bulgu + İZCİ-1 parçası + çalışma) */
  X.caveProgress = function (s) {
    const c = s.explore.cave;
    const finds = Object.values(c.finds).filter(Boolean).length;
    const scout = X.scoutDone(s);
    const studies = X.caveStudies().filter((st) => X.studyDone(s, st.id)).length;
    return { finds, scout, studies, total: X.caveFinds().length + X.scoutParts().length + X.caveStudies().length, done: finds + scout + studies };
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
    // Tünel boyunca sırayla: bulgular ve İZCİ-1 parçaları; son odaya varınca (room) ölçümler
    const todo = X.caveFinds()
      .filter((x) => !c.finds[x.id])
      .map((x) => ({ kind: 'find', id: x.id, atM: x.atM }))
      .concat(X.scoutParts().filter((x) => c.scout[x.id] === null || c.scout[x.id] === undefined).map((x) => ({ kind: 'scout', id: x.id, atM: x.atM })));
    if (c.finds.room) for (const x of X.caveStudies()) if (!X.studyDone(s, x.id)) todo.push({ kind: 'study', id: x.id, atM: x.atM });
    if (todo.length) return todo.sort((a, b) => a.atM - b.atM)[0];
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
