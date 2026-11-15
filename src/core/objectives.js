/**
 * SOL 14: RED HORIZON — Görev Hedefi Motoru (K1 + K2)
 * Oyun Ritmi Planı RIT-02 / RIT-09 / RIT-12: HUD her an TEK ana hedef ve en fazla BİR isteğe bağlı hedef gösterir.
 * Hedefler durumdan türetilir (ayrı görev durumu saklanmaz — sözleşme #1). DOM'a dokunmaz; Node testlerinde çalışır.
 *
 * Dönüş: { main: Goal, optional: Goal|null, progress }
 *   Goal = { id, key, vars, hintKey }   (metinler content/story.json → goal.*)
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const O = {};

  /** Başarı eşikleri (demo modunda kısa görev eşikleri) */
  O.thresholds = function (s) {
    if (s.demoMode) return D().demoSuccess;
    return S.Engineering.findById(D().objectives, s.design.objectiveFocus);
  };

  /** RIT-09 — Görev durumu / MAV kontrol listesi: finalden önce bilinen tüm koşullar */
  O.progress = function (s) {
    const th = O.thresholds(s);
    const f = S.Score.reportRecords(s).map(([, r]) => r); // D-012: enkaz + kalıntı + mağara raporları
    const e = Object.values(s.experiments);
    return {
      forensicsSent: f.filter((r) => r.sent).length,
      forensicsQueued: f.filter((r) => r.queued).length,
      experimentsSent: e.filter((r) => r.sent).length,
      experimentsDone: e.filter((r) => r.done).length,
      min: th.minSuccess,
      full: th.fullSuccess,
      fuel: Math.round(s.res.mavFuel),
      fuelOk: s.res.mavFuel >= 100,
      // MOXIE yoksa ISRU ünitesi yok: yakıt artırılamaz, hedefler Sabatier istemez
      canFuel: S.Sim.hasIsru(s),
      launchSol: s.maxSols
    };
  };

  /** Kontrol listesi satırları: { key, vars, done } */
  O.checklist = function (s) {
    const p = O.progress(s);
    return [
      { key: 'status.reports', vars: { n: p.forensicsSent, req: p.full.forensicsSent }, done: p.forensicsSent >= p.full.forensicsSent },
      { key: 'status.experiments', vars: { n: p.experimentsSent, req: p.full.experimentsSent }, done: p.experimentsSent >= p.full.experimentsSent },
      { key: p.canFuel || p.fuelOk ? 'status.fuel' : 'status.fuel_no_isru', vars: { fuel: p.fuel }, done: p.fuelOk },
      { key: 'status.sol', vars: { sol: p.launchSol, now: s.sol }, done: s.sol >= p.launchSol }
    ];
  };

  /** target: { m } yüzey metresi ya da { cx } tünel metresi — HUD yön/mesafe ve dünya işaretini buradan alır */
  const goal = (id, vars = {}, target = null) => ({ id, key: 'goal.' + id, vars, hintKey: 'goal.hint.' + id, target });

  /** Kazılıp ortaya çıkarılmış, raporu henüz kuyruğa girmemiş en yakın araç (bulunmamış aracın yeri bilinmez) */
  function nextWreck(s) {
    const open = S.Forensics.cases().filter((c) => S.Forensics.identified(s, c) && !s.forensics[c.id].queued);
    if (!open.length) return null;
    return open.slice().sort((a, b) => Math.abs(a.distanceM - s.player.x) - Math.abs(b.distanceM - s.player.x))[0];
  }

  const inCave = (s) => s.player.zone === 'cave';
  /** Habitata dönüş hedefi: mağaradaysa önce merdiven */
  const homeTarget = (s) => (inCave(s) ? { cx: S.DATA.explore.cave.ladderM } : { m: 0 });

  /**
   * Sıradaki rapor kaynağı (en yakın): bulunmuş araç, kalıntılı buz kümesi, lav tüneli; henüz bulunmamış araçlar için
   * keşif hedefi. Araçlar hazır görünmez: keşif hedefi yeri söylemez, yalnızca rotayı gösterir (doğu: izleri takip et
   * ve kaz, rota tünel penceresinde biter; batı: buzula ilerle). Doğudaki araçlar bulununca sıra tünel penceresine gelir.
   * Dönüş: { kind: 'wreck'|'ice'|'cave'|'tube_dig'|'explore_east'|'explore_west', atM (hedef), sortM (uzaklık), ref }
   */
  function nextReportSource(s) {
    const list = [];
    const map = S.DATA.terrain.map;
    const w = nextWreck(s);
    if (w) list.push({ kind: 'wreck', atM: w.distanceM, ref: w });
    const X = S.Explore;
    if (X && s.explore) {
      for (const c of X.openRelicClusters(s)) if (!s.explore.ice[c.id].collected) list.push({ kind: 'ice', atM: c.atM, ref: c });
      const eastHidden = X.hiddenLeft(s, 'east').filter((st) => st.case);
      const zoneFrom = (id) => (map.zones.find((z) => z.id === id) || { fromM: 0 }).fromM;
      // Doğu: rota başı (göl yatağı) uzaklığıyla sıralanır, hedef rotanın sonu (tünel penceresi)
      if (eastHidden.length) list.push({ kind: 'explore_east', atM: map.tubeMouthM, sortM: zoneFrom('lakebed'), ref: null });
      else if (!X.tubeOpen(s) && X.caveOpen(s)) list.push({ kind: 'tube_dig', atM: map.tubeMouthM, ref: null });
      if (X.tubeOpen(s) && X.caveOpen(s)) list.push({ kind: 'cave', atM: map.tubeMouthM, ref: null });
      const west = S.DATA.terrain.westRegion;
      if (west && X.hiddenLeft(s, 'west').length) list.push({ kind: 'explore_west', atM: zoneFrom('glacier'), sortM: -west.frostStartM, ref: null });
    }
    if (!list.length) return null;
    const here = inCave(s) ? map.tubeMouthM : s.player.x;
    const key = (e) => Math.abs((e.sortM !== undefined ? e.sortM : e.atM) - here);
    return list.sort((a, b) => key(a) - key(b))[0];
  }

  /** Toplanmış ama henüz üsse raporlanmamış kalıntı var mı? */
  function unfiledRelic(s) {
    if (!S.Explore || !s.explore) return false;
    return S.Explore.clusters().some((c) => c.relic && s.explore.ice[c.id].collected && !s.explore.reports['relic_' + c.id].queued && !s.explore.reports['relic_' + c.id].sent);
  }

  function sourceGoal(s, src) {
    const dist = Math.round(Math.abs(src.atM - s.player.x));
    if (src.kind === 'wreck') return goal('wreck_go', { name: src.ref.name, dist }, { m: src.atM });
    if (src.kind === 'explore_east' || src.kind === 'explore_west' || src.kind === 'tube_dig') return goal(src.kind, { dist }, { m: src.atM });
    if (src.kind === 'ice') {
      const step = S.Explore.iceStep(s, src.ref.id);
      return step === 'inspect' ? goal('ice_go', { dist }, { m: src.atM }) : goal('ice_work', { step: S.t('ice.step.' + step) }, { m: src.atM });
    }
    return goal('cave_go', { dist }, { m: src.atM });
  }

  /** Mağara içindeki sıradaki iş */
  function caveGoal(s) {
    const task = S.Explore.nextCaveTask(s);
    const p = S.Explore.caveProgress(s);
    const vars = { n: p.done, total: p.total };
    if (task.kind === 'entrance') return goal('cave_entrance', vars, { cx: task.atM });
    if (task.kind === 'find') return goal('cave_find', Object.assign({ what: S.t('cave.find.' + task.id) }, vars), { cx: task.atM });
    if (task.kind === 'study') return goal('cave_study', Object.assign({ what: S.t('cave.study.' + task.id) }, vars), { cx: task.atM });
    if (task.kind === 'report') return goal('cave_report', vars, { cx: task.atM });
    return goal('cave_exit', {}, { cx: task.atM });
  }

  function wreckInProgress(s) {
    return S.Forensics.cases().find((c) => {
      const r = s.forensics[c.id];
      return !r.diagnosis && S.Forensics.evidenceCount(r) > 0;
    });
  }

  function nextExperiment(s) {
    return S.Experiments.list().find((e) => !s.experiments[e.id].done && S.Experiments.availability(s, e.id).ok) || null;
  }

  O.mainGoal = function (s) {
    const p = O.progress(s);
    const outside = S.Sim.isOutside(s);
    const g = D().gameplay;
    const clock = S.Sim.clockMinute(s);
    const late = clock >= g.sunsetStartMinute || clock < g.sunriseMinute;

    // 1) Hayati: dönüş O₂'si sınırda
    if (outside) {
      const ponr = S.Sim.ponr(s);
      if (ponr.critical || s.suit.leak) return goal('return', { m: ponr.distanceM }, homeTarget(s));
      // Elbise bataryası bitti: ısıtıcı durdu, eklem donmasına kadar uyarılı bir pencere var
      if (s.suit.battery <= 0) return goal('return_cold', { m: ponr.distanceM }, homeTarget(s));
    } else if (s.suit.leak) return goal('repair_suit');

    // Üs sistemleri kargo sandıklarında iner (ux-plan #8): önce güneş paneli (enerji olmadan üs yaşamaz)
    const structM = (id) => {
      const st = S.Surface && S.Surface.STRUCTURES.find((x) => x.id === id);
      return st ? { m: S.Surface.pxToM(st.px + st.w / 2) } : null;
    };
    if (!S.Sim.deployed(s, 'solar') && !inCave(s)) return goal('deploy_solar', {}, structM('solar'));

    // 2) Son Sol: MAV
    if (s.sol >= s.maxSols) {
      if (outside && inCave(s)) return goal('cave_exit', {}, homeTarget(s));
      if (!S.Sim.deployed(s, 'mav')) return goal('deploy_mav', {}, structM('mav'));
      return p.fuelOk || !p.canFuel ? goal('mav_launch') : goal('mav_fuel', { fuel: p.fuel });
    }

    // 3) Yarım kalan enkaz incelemesi
    const wip = wreckInProgress(s);
    if (wip) {
      const n = S.Forensics.evidenceCount(s.forensics[wip.id]);
      const enough = n >= D().forensics.minEvidenceForDiagnosis;
      return goal(enough ? 'wreck_diagnose' : 'wreck_finish', { name: wip.name, n, total: D().forensics.evidenceTypes.length }, { m: wip.distanceM });
    }

    // 3b) D-012: mağaradaysan (gece değilse) tüneldeki işi bitir, sonra röleden raporla ve çık
    if (outside && inCave(s) && S.Explore) {
      const clockLate = clock >= g.sunsetStartMinute || clock < g.sunriseMinute;
      if (clockLate) return goal('return_night', { temp: Math.round(S.Sim.site(s).nightMinC) }, homeTarget(s));
      return caveGoal(s);
    }
    // 3c) Yarım kalan buz kümesi (kırıldı ama kalıntı alınmadı)
    if (outside && S.Explore && s.explore) {
      const half = S.Explore.clusters().find((c) => s.explore.ice[c.id].inspected && S.Explore.iceStep(s, c.id) !== 'done');
      if (half && Math.abs(half.atM - s.player.x) < 60) return goal('ice_work', { step: S.t('ice.step.' + S.Explore.iceStep(s, half.id)) }, { m: half.atM });
    }

    // 4) Veri yolu tıkalıysa (iletişim kapalı / duraklatılmış) önce onu çöz
    const waiting = s.downlink.queue.some((q) => q.status === 'queued' || q.status === 'sending');
    const comms = s.loads.find((l) => l.id === 'comms');
    if (waiting && (s.downlink.paused || (comms && !comms.on))) return goal('downlink_blocked');

    // D-012: rapor = enkaz + kalıntı + mağara; sıradaki kaynak en yakın olandır
    const needF = p.forensicsQueued < p.full.forensicsSent ? nextReportSource(s) : null;
    const needE = p.experimentsDone < p.full.experimentsSent ? nextExperiment(s) : null;
    const expVars = { n: p.experimentsDone, total: p.full.experimentsSent };

    // 5) Akşam/gece: dışarıdaysan dön, içerideysen deney ya da uyku
    if (late) {
      if (outside) return goal('return_night', { temp: Math.round(S.Sim.site(s).nightMinC) }, homeTarget(s));
      if (needE) return goal('lab', expVars);
      return goal('sleep');
    }

    // Toplanan kalıntı üsse götürülünce rapor olur
    if (outside && unfiledRelic(s)) return goal('relic_file', {}, homeTarget(s));

    if (!outside) {
      if (needF && (s.suit.o2 < 60 || s.suit.battery < 60)) {
        return goal('prep_suit', { o2: Math.round(s.suit.o2), bat: Math.round(s.suit.battery) });
      }
      if (needE && !needF) return goal('lab', expVars);
      if (needF) return sourceGoal(s, needF);
      if (needE) return goal('lab', expVars);
    } else {
      if (needF) return sourceGoal(s, needF);
      if (needE) return goal('lab_go', expVars, homeTarget(s));
    }
    if (!p.fuelOk && S.Sim.isruReady(s)) return goal('isru', { fuel: p.fuel });
    return goal('sleep');
  };

  O.optionalGoal = function (s, main) {
    const opts = [];
    const gh = s.greenhouse;
    const ghCfg = D().habitat.greenhouse;
    // Kurulmayı bekleyen üs sistemleri (MAV, ISRU, sera)
    const packed = ['mav', 'isru', 'greenhouse'].find((id) => !S.Sim.deployed(s, id) && S.Sim.deployAvailable(s, id));
    if (packed) opts.push(goal('opt_deploy', { what: S.t('deploy.' + packed + '.name') }));
    if (s.res.panelDust >= 0.3 && S.Sim.deployed(s, 'solar')) opts.push(goal('opt_clean', { pct: Math.round(s.res.panelDust * 100) }));
    if (gh.installed && !gh.frozen && gh.tendedSol !== s.sol && s.res.waterL >= ghCfg.tendWaterL) opts.push(goal('opt_greenhouse'));
    if (S.Sim.has(s, 'rimfax') && s.iceDugSol !== s.sol && s.res.waterL < 30) opts.push(goal('opt_ice', { l: Math.round(s.res.waterL) }));
    if (s.res.mavFuel < 100 && s.sol < s.maxSols && S.Sim.isruReady(s)) opts.push(goal('opt_sabatier', { fuel: Math.round(s.res.mavFuel) }));
    // Ana hedefle aynı işi isteğe bağlı olarak tekrar gösterme
    const same = { isru: 'opt_sabatier', mav_fuel: 'opt_sabatier' };
    return opts.find((o) => !main || same[main.id] !== o.id) || null;
  };

  O.compute = function (s) {
    if (!s || s.sol < 1 || s.ending || s.gameOver) return null;
    const main = O.mainGoal(s);
    const critical = ['return', 'return_cold', 'repair_suit', 'mav_fuel', 'mav_launch', 'return_night', 'cave_exit', 'deploy_mav'].includes(main.id);
    return { main, optional: critical ? null : O.optionalGoal(s, main), progress: O.progress(s) };
  };

  S.Objectives = O;
})((window.SOL14 = window.SOL14 || {}));
