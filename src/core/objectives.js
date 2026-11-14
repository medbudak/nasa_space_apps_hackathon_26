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
    const f = Object.values(s.forensics);
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
      launchSol: s.maxSols
    };
  };

  /** Kontrol listesi satırları: { key, vars, done } */
  O.checklist = function (s) {
    const p = O.progress(s);
    return [
      { key: 'status.reports', vars: { n: p.forensicsSent, req: p.full.forensicsSent }, done: p.forensicsSent >= p.full.forensicsSent },
      { key: 'status.experiments', vars: { n: p.experimentsSent, req: p.full.experimentsSent }, done: p.experimentsSent >= p.full.experimentsSent },
      { key: 'status.fuel', vars: { fuel: p.fuel }, done: p.fuelOk },
      { key: 'status.sol', vars: { sol: p.launchSol, now: s.sol }, done: s.sol >= p.launchSol }
    ];
  };

  const goal = (id, vars = {}) => ({ id, key: 'goal.' + id, vars, hintKey: 'goal.hint.' + id });

  function nextWreck(s) {
    const open = S.Forensics.cases().filter((c) => !s.forensics[c.id].queued);
    if (!open.length) return null;
    // Önce bilinen/keşfedilmiş ve yakın olanlar
    return open.slice().sort((a, b) => Math.abs(a.distanceM - s.player.x) - Math.abs(b.distanceM - s.player.x))[0];
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
      if (ponr.critical || s.suit.leak) return goal('return', { m: ponr.distanceM });
    } else if (s.suit.leak) return goal('repair_suit');

    // 2) Son Sol: MAV
    if (s.sol >= s.maxSols) return p.fuelOk ? goal('mav_launch') : goal('mav_fuel', { fuel: p.fuel });

    // 3) Yarım kalan enkaz incelemesi
    const wip = wreckInProgress(s);
    if (wip) {
      const n = S.Forensics.evidenceCount(s.forensics[wip.id]);
      const enough = n >= D().forensics.minEvidenceForDiagnosis;
      return goal(enough ? 'wreck_diagnose' : 'wreck_finish', { name: wip.name, n, total: D().forensics.evidenceTypes.length });
    }

    // 4) Veri yolu tıkalıysa (iletişim kapalı / duraklatılmış) önce onu çöz
    const waiting = s.downlink.queue.some((q) => q.status === 'queued' || q.status === 'sending');
    const comms = s.loads.find((l) => l.id === 'comms');
    if (waiting && (s.downlink.paused || (comms && !comms.on))) return goal('downlink_blocked');

    const needF = p.forensicsQueued < p.full.forensicsSent ? nextWreck(s) : null;
    const needE = p.experimentsDone < p.full.experimentsSent ? nextExperiment(s) : null;
    const expVars = { n: p.experimentsDone, total: p.full.experimentsSent };

    // 5) Akşam/gece: dışarıdaysan dön, içerideysen deney ya da uyku
    if (late) {
      if (outside) return goal('return_night', { temp: Math.round(S.Sim.site(s).nightMinC) });
      if (needE) return goal('lab', expVars);
      return goal('sleep');
    }

    if (!outside) {
      if (needF && (s.suit.o2 < 60 || s.suit.battery < 60)) {
        return goal('prep_suit', { o2: Math.round(s.suit.o2), bat: Math.round(s.suit.battery) });
      }
      if (needE && !needF) return goal('lab', expVars);
      if (needF) {
        const dist = Math.round(Math.abs(needF.distanceM - s.player.x));
        return S.Forensics.identified(s, needF) ? goal('wreck_go', { name: needF.name, dist }) : goal('wreck_signal', { dist });
      }
      if (needE) return goal('lab', expVars);
    } else {
      if (needF) {
        const dist = Math.round(Math.abs(needF.distanceM - s.player.x));
        return S.Forensics.identified(s, needF) ? goal('wreck_go', { name: needF.name, dist }) : goal('wreck_signal', { dist });
      }
      if (needE) return goal('lab_go', expVars);
    }
    if (!p.fuelOk) return goal('isru', { fuel: p.fuel });
    return goal('sleep');
  };

  O.optionalGoal = function (s, main) {
    const opts = [];
    const gh = s.greenhouse;
    const ghCfg = D().habitat.greenhouse;
    if (s.res.panelDust >= 0.3) opts.push(goal('opt_clean', { pct: Math.round(s.res.panelDust * 100) }));
    if (gh.installed && !gh.frozen && gh.tendedSol !== s.sol && s.res.waterL >= ghCfg.tendWaterL) opts.push(goal('opt_greenhouse'));
    if (S.Sim.has(s, 'rimfax') && s.iceDugSol !== s.sol && s.res.waterL < 30) opts.push(goal('opt_ice', { l: Math.round(s.res.waterL) }));
    if (s.res.mavFuel < 100 && s.sol < s.maxSols) opts.push(goal('opt_sabatier', { fuel: Math.round(s.res.mavFuel) }));
    // Ana hedefle aynı işi isteğe bağlı olarak tekrar gösterme
    const same = { isru: 'opt_sabatier', mav_fuel: 'opt_sabatier' };
    return opts.find((o) => !main || same[main.id] !== o.id) || null;
  };

  O.compute = function (s) {
    if (!s || s.sol < 1 || s.ending || s.gameOver) return null;
    const main = O.mainGoal(s);
    const critical = ['return', 'repair_suit', 'mav_fuel', 'mav_launch', 'return_night'].includes(main.id);
    return { main, optional: critical ? null : O.optionalGoal(s, main), progress: O.progress(s) };
  };

  S.Objectives = O;
})((window.SOL14 = window.SOL14 || {}));
