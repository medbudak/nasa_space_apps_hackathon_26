/**
 * QA Botu — TESTING.md'deki tasarım profillerini başsız oynar.
 * Gerçek oyun kodunu (Sim, Events, Forensics, Experiments) çağırır; yalnızca oyuncu girdisini taklit eder.
 */
'use strict';

const { loadCore } = require('./load_core.js');

function bestOption(S, s) {
  const def = S.Events.def(s.crisis.active.id);
  let best = null;
  for (const o of def.options) {
    if (!S.Events.optionAvailable(S.getState(), o)) continue;
    const v = S.Events.resolveVariant(s, def.id, o, { minigame: { success: true, score: 0.95 } });
    if (!best || v.score > best.score) best = { id: o.id, score: v.score };
  }
  return best.id;
}

function handleCrisis(S, s, log) {
  let guard = 0;
  while (s.crisis.active && guard++ < 5) {
    const id = s.crisis.active.id;
    const opt = bestOption(S, s);
    S.Events.resolve(s, opt, { minigame: { success: true, score: 0.95 } });
    log.push(`Sol ${s.sol} kriz ${id} -> ${opt}`);
  }
}

/** Oyuncuyu hedef x konumuna yürütür (dakika bazında) */
function walkTo(S, s, targetX, log) {
  const eva = S.DATA.constants.eva;
  let guard = 0;
  s.player.inside = false;
  while (Math.abs(s.player.x - targetX) > 1 && !s.gameOver && !s.ending && guard++ < 4000) {
    handleCrisis(S, s, log);
    let speed = eva.speedMPerMin * (s.suit.frozen ? eva.frozenSpeedFactor : 1);
    for (const pit of S.DATA.terrain.sandPits) {
      if (s.player.x >= pit.fromM && s.player.x <= pit.toM && !S.Sim.has(s, 'ingenuity')) speed *= S.DATA.terrain.sandPitSpeedFactor;
    }
    const step = Math.min(speed, Math.abs(targetX - s.player.x));
    s.player.x += Math.sign(targetX - s.player.x) * step;
    S.Sim.step(s, step / speed);
    S.Forensics.updateDiscovery(s);
  }
}

function enterHabitat(S, s, log) {
  walkTo(S, s, S.Sim.airlockX, log);
  s.player.inside = true;
}

function play(design, { demoMode = false, policy = {} } = {}) {
  const S = loadCore();
  const s = S.State.reset({ demoMode, design });
  const log = [];
  const launch = S.Sim.launch(s);
  if (!launch.ok) return { S, s, log, launchErrors: launch.errors };
  // Transit: dört seyir görevi de iyi oynandı (Sim.transitOutcome -> nominal iniş)
  const good = { success: true, score: 0.95, skipped: false };
  S.Sim.land(s, Object.fromEntries(S.DATA.gameplay.transit.tasks.map((tk) => [tk.id, good])));

  const mg = { success: true, score: 0.95 };
  const casesByDistance = S.Forensics.cases().slice().sort((a, b) => a.distanceM - b.distanceM);
  const exps = S.Experiments.list();
  let safety = 0;

  while (!s.gameOver && !s.ending && safety++ < 60) {
    const sol = s.sol;
    handleCrisis(S, s, log);

    // 1) Sabah: elbiseyi hazırla
    s.player.inside = true;
    S.Sim.doAction(s, 'refill_suit');
    S.Sim.doAction(s, 'charge_suit');
    if (s.suit.leak || s.suit.integrity < 70) S.Sim.doAction(s, 'repair_suit');
    handleCrisis(S, s, log);

    // 2) Bir enkazı incele (öğleden önce)
    const target = casesByDistance.find((c) => !s.forensics[c.id].queued);
    if (target && S.Sim.clockMinute(s) < 900 && policy.forensics !== false) {
      walkTo(S, s, target.distanceM, log);
      for (const ev of ['photo', 'telemetry', 'env']) {
        handleCrisis(S, s, log);
        if (s.gameOver) break;
        S.Forensics.collectEvidence(s, target.id, ev, mg);
      }
      handleCrisis(S, s, log);
      if (!s.gameOver) {
        S.Forensics.diagnose(s, target.id, target.correctCategory);
        S.Forensics.salvage(s, target.id);
      }
      enterHabitat(S, s, log);
    } else {
      enterHabitat(S, s, log);
    }
    handleCrisis(S, s, log);

    // 3) Panel temizliği ve ISRU
    if (policy.cleanPanels !== false && s.res.panelDust > 0.15) {
      s.player.inside = false;
      S.Sim.doAction(s, 'clean_panels');
      s.player.inside = true;
    }
    if (s.res.mavFuel < 100) S.Sim.doAction(s, 'sabatier');
    handleCrisis(S, s, log);

    // 4) Bir deney
    const exp = exps.find((e) => !s.experiments[e.id].done && S.Experiments.availability(s, e.id).ok);
    if (exp && policy.experiments !== false) {
      S.Experiments.run(s, exp.id, { hypothesis: exp.correctHypothesis, env: exp.preferredEnv, control: true }, mg);
    }
    S.Sim.doAction(s, 'tend_greenhouse');
    handleCrisis(S, s, log);

    // 5) Makul oyuncu: batarya düşükse gece MOXIE'yi kapat, doluysa aç (M3)
    if (policy.manageMoxie !== false) {
      const moxie = s.loads.find((l) => l.id === 'moxie');
      const frac = s.res.energyKwh / s.res.batteryKwh;
      if (moxie.on && frac < 0.6) S.Sim.toggleLoad(s, 'moxie');
      else if (!moxie.on && frac > 0.85) S.Sim.toggleLoad(s, 'moxie');
    }

    // 6) Röle geçişleri gece yarısına kadar akar; uyu
    let sleepGuard = 0;
    while (s.sol === sol && !s.gameOver && !s.ending && sleepGuard++ < 10) {
      S.Sim.sleep(s);
      handleCrisis(S, s, log);
    }
    if (s.sol >= s.maxSols && !s.ending && !s.gameOver) {
      // Son Sol: geçiş pencerelerini kaçırmadan bekle, sonra MAV
      S.Sim.doAction(s, 'sabatier');
      S.Sim.doAction(s, 'sabatier');
      S.Sim.advance(s, 120);
      handleCrisis(S, s, log);
      S.Sim.launchMav(s, { auto: false });
    }
  }
  return { S, s, log, score: S.Score.calc(s), chains: S.Score.chains(s) };
}

module.exports = { play };
