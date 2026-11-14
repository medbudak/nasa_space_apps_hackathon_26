import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as eng from '../src/core/engineering.js';

const data = JSON.parse(readFileSync(new URL('../src/data/nasa_data.json', import.meta.url)));
const g = data.mars.gravity.value;
const gEarth = data.constants.g0.value;
const c = data.constants.speedOfLight.value;

const close = (actual, expected, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected}, got ${actual}`);

test('solar power: full sun on 1 m² at Mars', () => {
  const p = eng.solarPower_W({ irradiance_Wm2: 586.2, area_m2: 1, efficiency: 0.3, cosZenith: 1 });
  close(p, 175.86);
});

test('solar power: dust and night', () => {
  const base = { irradiance_Wm2: 586.2, area_m2: 10, efficiency: 0.3, cosZenith: 1 };
  close(eng.solarPower_W({ ...base, dustLoss: 0.8 }), 586.2 * 10 * 0.3 * 0.2);
  assert.equal(eng.solarPower_W({ ...base, cosZenith: -0.5 }), 0);
});

test('rocket equation: mass ratio e gives Isp · g0', () => {
  close(eng.deltaV_ms({ isp_s: 300, g0_ms2: gEarth, wetMass_kg: Math.E, dryMass_kg: 1 }), 300 * gEarth);
  assert.throws(() => eng.deltaV_ms({ isp_s: 300, g0_ms2: gEarth, wetMass_kg: 1, dryMass_kg: 2 }));
});

test('light delay spans about 3 to 22 minutes', () => {
  const min = eng.lightDelay_s(data.mars.minDistanceFromEarth.value, c) / 60;
  const max = eng.lightDelay_s(data.mars.maxDistanceFromEarth.value, c) / 60;
  close(min, 3.035, 0.01);
  close(max, 22.32, 0.01);
});

test('pendulum swings about 1.62 times slower on Mars', () => {
  const ratio = eng.pendulumPeriod_s(1, g) / eng.pendulumPeriod_s(1, gEarth);
  close(ratio, Math.sqrt(gEarth / g));
  close(ratio, 1.62, 0.01);
  close(eng.gravityFromPendulum_ms2(1, eng.pendulumPeriod_s(1, g)), g);
});

test('a 2 m drop takes about 1.04 s on Mars', () => {
  const t = eng.fallTime_s(2, g);
  close(t, 1.035, 0.01);
  close(eng.gravityFromFall_ms2(2, t), g);
});

test('point of no return', () => {
  const o2 = eng.oxygenToReturn_kg({ distance_m: 900, speed_ms: 1, consumption_kgPerS: 0.001, safetyFactor: 1.2 });
  close(o2, 1.08);
  // Frozen joints halve the speed, so the walk back needs twice the oxygen.
  close(eng.oxygenToReturn_kg({ distance_m: 900, speed_ms: 0.5, consumption_kgPerS: 0.001, safetyFactor: 1.2 }), 2.16);
  assert.equal(eng.oxygenToReturn_kg({ distance_m: 900, speed_ms: 0, consumption_kgPerS: 0.001, safetyFactor: 1.2 }), Infinity);
});

test('mass margin', () => {
  close(eng.massMargin(1000, 900), 0.1);
  assert.ok(eng.massMargin(1000, 1100) < 0);
});

test('measurement tolerance', () => {
  assert.ok(eng.withinTolerance(3.5, g, 0.1));
  assert.ok(!eng.withinTolerance(3.0, g, 0.1));
});
