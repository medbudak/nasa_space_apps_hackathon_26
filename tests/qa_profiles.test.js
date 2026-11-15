/**
 * TESTING.md §2 — 3 QA tasarım profili (K6)
 * tests/helpers/bot.js gerçek oyun kodunu (Sim, Events, Forensics, Experiments, Score) başsız oynar;
 * yalnızca oyuncu girdisini taklit eder ve mini-oyunlarda %95 kalite varsayar.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { play, tendNeeds } = require('./helpers/bot.js');
const { loadCore } = require('./helpers/load_core.js');

const GOLDEN = {
  objectiveFocus: 'balanced',
  rocketId: 'vulcan_centaur',
  orbitType: 'hohmann',
  launchWindowCaught: true,
  landingSiteId: 'jezero',
  powerSource: 'solar_rtg',
  batteryKwh: 40,
  insulation: 'thick',
  instruments: ['mastcam_z', 'meda', 'seis', 'moxie', 'veggie'],
  commArchitecture: 'relay_xband',
  repairKits: 1
};

/** Profil 2 — Açgözlü bilim: Arcadia, yalnızca güneş, 20 kWh, ince yalıtım, kit yok, sıfıra yakın kütle marjı */
const FRAGILE = Object.assign({}, GOLDEN, {
  rocketId: 'falcon_heavy',
  orbitType: 'fast_transfer',
  landingSiteId: 'arcadia',
  powerSource: 'solar_only',
  batteryKwh: 20,
  insulation: 'thin',
  repairKits: 0,
  instruments: ['mastcam_z', 'meda', 'seis', 'supercam', 'veggie']
});

/** Profil 3 — Mastcam-Z yok (el kamerası) + yalnızca UHF röle */
const LOW_CAM = Object.assign({}, GOLDEN, {
  commArchitecture: 'relay_only',
  instruments: ['meda', 'seis', 'moxie', 'veggie', 'rad']
});

const golden = play(GOLDEN);
const fragile = play(FRAGILE);
const lowCam = play(LOW_CAM);

const chainKeys = (run) => run.chains.map((c) => c.causeKey + '>' + c.effectKey);

test('Profil 1 — Altın Yol: fırlatılabilir, SPOF yok, kütle marjı ≥ %10', () => {
  assert.equal(golden.launchErrors, undefined);
  assert.equal(golden.s.totals.spof.length, 0, 'SPOF: ' + golden.s.totals.spof.join(', '));
  assert.ok(golden.s.totals.massMarginPct >= 10);
});

test('Profil 1 — Altın Yol: TAM BAŞARI, güvenli dönüş ve %80 net UFO karesi', () => {
  const { s, score } = golden;
  assert.equal(s.gameOver, null);
  assert.equal(score.tier, 'FULL_SUCCESS');
  assert.equal(score.safeReturn, true);
  assert.equal(score.ufoPct, 80);
  assert.equal(s.ending.cameraTier, 'high');
  assert.ok(score.sentForensics >= 4 && score.sentExperiments >= 4, '4 rapor + 4 deney Dünya\'ya ulaşmalı');
});

test('Profil 1 — Altın Yol: MEDA fırtınayı 1 Sol önceden haber verir, sera hiç donmaz, yük kesilmez', () => {
  const S = loadCore();
  const s = S.State.reset({ design: GOLDEN });
  S.Sim.launch(s);
  S.Sim.land(s);
  s.player.inside = true;
  const stormSol = S.DATA.events.schedule.full.find((e) => e.id === 'dust_storm').sol;
  let guard = 0;
  while (s.sol < stormSol - 1 && !s.gameOver && guard++ < 50) {
    tendNeeds(S, s);
    S.Sim.sleep(s);
    if (s.crisis.active) S.Events.resolve(s, 'A');
  }
  assert.equal(s.sol, stormSol - 1);
  assert.ok(s.weather.warnings.some((w) => w.id === 'dust_storm' && w.sol === stormSol), 'MEDA uyarısı fırtınadan önceki Sol\'de görünmeli');

  assert.equal(golden.s.greenhouse.frozen, false);
  assert.equal(golden.s.solHistory.filter((h) => h.shed.length).length, 0);
  assert.ok(chainKeys(golden).includes('chain.rtg_thick.cause>chain.rtg_thick.effect'));
});

test('Profil 1 — Tohum çimlenme deneyi sera verimini +%30 artırır', () => {
  const bonus = golden.S.DATA.habitat.greenhouse.germinationYieldBonusPct;
  assert.equal(golden.s.experiments.seed_germination.success, true);
  assert.equal(golden.s.greenhouse.yieldPct, 100 + bonus);
});

test('Profil 2 — Kırılgan Tasarım: SPOF uyarıları ve düşük kütle marjı', () => {
  const { s } = fragile;
  assert.equal(fragile.launchErrors, undefined);
  for (const k of ['spof.no_rtg', 'spof.no_repair_kit', 'spof.thin_insulation_cold', 'spof.low_mass_margin']) {
    assert.ok(s.totals.spof.includes(k), k + ' bekleniyordu');
  }
  assert.ok(s.totals.massMarginPct < 10);
});

test('Profil 2 — Kırılgan Tasarım: gece güç çöküşü (M3 yük kesme) ve sera donması', () => {
  const { s } = fragile;
  const shedSols = s.solHistory.filter((h) => h.shed.length);
  assert.ok(shedSols.length > 0, 'en az bir Sol\'de yük kesilmeli');
  assert.ok(shedSols.some((h) => h.shed.includes('greenhouse') || h.shed.includes('heating')));
  assert.equal(s.greenhouse.frozen, true);
  assert.ok(s.greenhouse.frozenSol >= 1 && s.greenhouse.frozenSol <= s.maxSols);
});

test('Profil 2 — Karne: "batarya + yalıtım → SOL X sera kaybı (−120 puan)" neden-sonuç zinciri ve günlük kaydı', () => {
  const { S, s, score } = fragile;
  const penalty = S.DATA.scoring.lostSystemPenaltyPoints;
  const chain = fragile.chains.find((c) => c.causeKey === 'chain.gh_lost.cause');
  assert.ok(chain, 'sera kaybı zinciri yok');
  assert.equal(chain.type, 'bad');
  assert.equal(chain.vars.sol, s.greenhouse.frozenSol);
  assert.equal(chain.vars.kwh, 20);
  const text = S.t(chain.causeKey, chain.vars) + ' → ' + S.t(chain.effectKey, chain.vars);
  assert.match(text, /20 kWh/);
  assert.match(text, new RegExp('SOL ' + s.greenhouse.frozenSol));
  assert.match(text, new RegExp('−' + penalty));

  const log = s.decisionLog.find((l) => l.titleKey === 'log.greenhouse_frozen.title');
  assert.ok(log, 'decisionLog sera kaybını kaydetmeli');
  assert.equal(log.sol, s.greenhouse.frozenSol);
  assert.equal(log.score, -penalty);
  assert.ok(score.penalties >= penalty);
});

test('Profil 3 — Düşük Kamera / Bant Genişliği: el kamerası yarım puan, dar downlink, %30 bulanık UFO', () => {
  const { s, score } = lowCam;
  assert.equal(lowCam.launchErrors, undefined);
  assert.ok(s.totals.spof.includes('spof.no_xband'));
  assert.ok(s.totals.dataPerSolMbit < golden.s.totals.dataPerSolMbit, 'UHF-only günlük kapasite daha düşük olmalı');
  assert.ok(score.forensicsScore < golden.score.forensicsScore, 'el kamerası fotoğraf kanıtı puanı düşürmeli');
  assert.equal(score.ufoPct, 30);
  assert.equal(s.ending.cameraTier, 'low');
  assert.ok(chainKeys(lowCam).includes('chain.no_cam.cause>chain.no_cam.effect'));
});

test('Tüm profiller: karne ve günlük metinleri eksiksiz çevrilir (TR + EN)', () => {
  for (const run of [golden, fragile, lowCam]) {
    for (const lang of ['tr', 'en']) {
      run.S.lang = lang;
      run.S.debugMissingKeys = new Set();
      run.s.decisionLog.forEach((l) => run.S.Score.formatLog(l));
      run.chains.forEach((c) => {
        run.S.t(c.causeKey, c.vars);
        run.S.t(c.effectKey, c.vars);
      });
      run.S.t('tier.' + run.score.tier);
      assert.deepEqual([...run.S.debugMissingKeys], [], lang + ' eksik anahtar');
    }
  }
});

test('Demo modu (?demo=1): 5 Sol\'de biter ve karne üretir', () => {
  const demo = play(GOLDEN, { demoMode: true });
  assert.equal(demo.s.maxSols, 5);
  assert.ok(demo.s.ending || demo.s.gameOver);
  assert.ok(['FULL_SUCCESS', 'MIN_SUCCESS', 'PARTIAL', 'FAILED'].includes(demo.score.tier));
});
