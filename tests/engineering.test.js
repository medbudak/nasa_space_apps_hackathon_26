/**
 * TESTING.md §1 — Mühendislik formülleri (src/core/engineering.js)
 * Gerçek oyun kodu tarayıcıdaki script sırasıyla vm içinde yüklenir (tests/helpers/load_core.js).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

const S = loadCore();
const E = S.Engineering;
const D = S.DATA;

test('calcSolarPower: temiz panel > tozlu panel (d_toz = 0.8)', () => {
  const clean = E.calcSolarPower({ cosZ: 1, dustFactor: 0 });
  const dusty = E.calcSolarPower({ cosZ: 1, dustFactor: 0.8 });
  // P = S·A·η·cosZ → 586.2 · 22 · 0.28 ≈ 3611 W
  const expected = D.constants.solarIrradiance.mean * D.habitat.base.solarAreaM2 * D.habitat.base.solarEfficiency;
  assert.ok(Math.abs(clean - expected) < 1, `temiz panel ${clean} W ≈ ${expected} W olmalı`);
  assert.ok(Math.abs(dusty - expected * 0.2) < 1, `%80 toz → %20 üretim (${dusty} W)`);
});

test('calcSolarPower: Meridiani (ekvator) öğle üretimi Arcadia (~40°K) üretiminden yüksek', () => {
  const site = (id) => D.landingSites.find((x) => x.id === id);
  const meridiani = E.calcSolarPower({ cosZ: site('meridiani').cosZNoon });
  const arcadia = E.calcSolarPower({ cosZ: site('arcadia').cosZNoon });
  assert.ok(meridiani > arcadia);
  assert.ok(Math.abs(meridiani / arcadia - site('meridiani').cosZNoon / site('arcadia').cosZNoon) < 0.01);
});

test('calcSolarPower: toz fırtınası (τ) üretimi üstel olarak düşürür', () => {
  const clear = E.calcSolarPower({ cosZ: 1, tau: 0 });
  const storm = E.calcSolarPower({ cosZ: 1, tau: D.constants.dustStorm.opportunityTau });
  assert.ok(storm < clear * 0.2, `τ=10.8 fırtınasında üretim ${storm} W, temizin %20'sinden az olmalı`);
});

test('calcDeltaV: m0 > mf için pozitif Δv, sınır değerlerde 0', () => {
  const dv = E.calcDeltaV({ isp: 360, wetMass: 3000, dryMass: 1000 });
  // 360 · 9.80665 · ln 3 ≈ 3879 m/s
  assert.ok(Math.abs(dv - 3879) <= 1, `Δv = ${dv}`);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 1000, dryMass: 1000 }), 0);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 500, dryMass: 1000 }), 0);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 500, dryMass: 0 }), 0);
});

test('calcLightDelay: en yakın ~3 dk, en uzak ~22 dk', () => {
  const near = E.calcLightDelay(5.5e7);
  const far = E.calcLightDelay(4.0e8);
  assert.ok(near.minutes > 3 && near.minutes < 3.2, `yakın: ${near.minutes} dk`);
  assert.ok(far.minutes > 22 && far.minutes < 22.5, `uzak: ${far.minutes} dk`);
  assert.equal(near.mm * 60 + near.ss, near.seconds);
});

test('getHorizons: son Sol Güneş Kavuşumu (iletişim kesintisi)', () => {
  assert.equal(E.getHorizons(14, 14).conjunction, true);
  assert.equal(E.getHorizons(5, 14).conjunction, false);
  const d = E.getHorizons(1, 14);
  assert.ok(d.minutes >= 3 && d.minutes <= 22.5, 'tek yön gecikme 3–22 dk aralığında');
});

test('calcPendulumPeriod: 1 m sarkaç Mars ≈ 3.25 s, Dünya ≈ 2.01 s, oran ≈ 1.62', () => {
  const mars = E.calcPendulumPeriod(1);
  const earth = E.calcPendulumPeriod(1, D.constants.marsGravity.earthValue);
  assert.equal(mars, 3.25);
  assert.equal(earth, 2.01);
  assert.ok(Math.abs(mars / earth - 1.62) < 0.01);
});

test('calcFreeFallTime: 2 m düşüş Mars ≈ 1.04 s, Dünya ≈ 0.64 s', () => {
  assert.equal(E.calcFreeFallTime(2), 1.04);
  assert.equal(E.calcFreeFallTime(2, D.constants.marsGravity.earthValue), 0.64);
});

test('calcPointOfNoReturnO2 (M4): 900 m mesafede donmuş eklem çentiği 2.5× sıçrar', () => {
  // 20 minutes of walking at the data's EVA speed (900 m when it was 45 m/min)
  const eva = D.constants.eva;
  const dist = 20 * eva.speedMPerMin;
  const normal = E.calcPointOfNoReturnO2({ distanceM: dist });
  const frozen = E.calcPointOfNoReturnO2({ distanceM: dist, jointFrozen: true });
  // 20 min · 0.5 %/min · 1.2 = 12 %
  assert.equal(normal, 12);
  assert.equal(frozen, 30);
  assert.ok(Math.abs(frozen / normal - 1 / eva.frozenSpeedFactor) < 0.01);
  const leak = E.calcPointOfNoReturnO2({ distanceM: dist, leak: true });
  assert.equal(leak, 24, 'sızıntı O₂ tüketimini 2× yapar');
  assert.equal(E.calcPointOfNoReturnO2({ distanceM: 0 }), 0);
  assert.equal(E.calcPointOfNoReturnO2({ distanceM: 1e6 }), 100, 'çentik %100 ile sınırlı');
});

test('M4: donmuş eklemle uzakta dönüşsüzlük noktası aşılır ve HUD durumu "beyond" olur', () => {
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  s.player.inside = false;
  s.player.x = (1200 / 45) * D.constants.eva.speedMPerMin; // 26.7 min of walking
  s.suit.o2 = 35; // normal hızla gereken %16, donmuş eklemle %40
  s.suit.frozen = false;
  assert.equal(S.Sim.ponr(s).beyond, false);
  s.suit.frozen = true;
  const p = S.Sim.ponr(s);
  assert.equal(p.beyond, true);
  assert.equal(p.speedPct, 40);
  assert.ok(p.jumpFactor >= 2.4);
});

test('ambientTempAt: gece en düşük ≈ nightMinC (−80 °C civarı), gündüz-gece farkı 70–100 °C', () => {
  for (const site of D.landingSites) {
    const night = E.ambientTempAt(site, 330);
    const day = E.ambientTempAt(site, 840);
    assert.equal(night, site.nightMinC);
    assert.equal(day, site.dayMaxC);
    const swing = day - night;
    assert.ok(swing >= 70 && swing <= 100, `${site.id}: fark ${swing} °C`);
  }
  assert.ok(D.landingSites.every((x) => x.nightMinC <= -78), 'gece sıcaklığı −80 °C bandında (RULES §1.1)');
});

test('calcDesignTotals: varsayılan tasarım fırlatılabilir ve SPOF içermez', () => {
  const tot = E.calcDesignTotals(S.State.DEFAULT_DESIGN);
  assert.equal(tot.canLaunch, true);
  assert.equal(tot.spof.length, 0, 'SPOF: ' + tot.spof.join(', '));
  assert.ok(tot.massMarginPct >= D.habitat.massMarginGoodPct);
});

test('calcDesignTotals: kütle aşımı ve 5\'ten fazla alet hata verir', () => {
  const heavy = Object.assign({}, S.State.DEFAULT_DESIGN, {
    rocketId: 'falcon_heavy',
    orbitType: 'fast_transfer',
    batteryKwh: 60,
    instruments: ['seis', 'moxie', 'supercam', 'veggie', 'mastcam_z', 'meda'],
    repairKits: 2
  });
  const tot = E.calcDesignTotals(heavy);
  assert.ok(tot.errors.includes('design.err_too_many'));
  assert.ok(tot.errors.includes('design.err_mass'));
  assert.equal(tot.canLaunch, false);
});
