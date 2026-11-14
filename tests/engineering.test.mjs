import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as eng from '../src/core/engineering.js';

const data = JSON.parse(readFileSync(new URL('../src/data/nasa_data.json', import.meta.url)));
const g = data.mars.gravity.value;
const gEarth = data.constants.g0.value;
const c = data.constants.speedOfLightKms.value;

const close = (actual, expected, tol = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected}, got ${actual}`);

test('sun is up 06:00–18:00 at the equator and highest at noon', () => {
  assert.equal(eng.sunCos(0), 0);
  assert.equal(eng.sunCos(0.2), 0);
  close(eng.sunCos(0.5), 1);
  assert.ok(eng.sunCos(0.3) > 0 && eng.sunCos(0.7) > 0);
  assert.equal(eng.sunCos(0.8), 0);
});

test('higher latitude gets a lower noon Sun', () => {
  close(eng.sunCos(0.5, 41), Math.cos((41 * Math.PI) / 180));
  assert.ok(eng.sunCos(0.5, 41) < eng.sunCos(0.5, 18.44));
});

test('solar power: full sun on 1 m² at Mars', () => {
  const p = eng.solarPower({ irradiance: 586.2, area: 1, efficiency: 0.3, cosZ: 1 });
  close(p, 175.86);
});

test('solar power: dust and night', () => {
  const base = { irradiance: 586.2, area: 10, efficiency: 0.3, cosZ: 1 };
  close(eng.solarPower({ ...base, dust: 0.8 }), 586.2 * 10 * 0.3 * 0.2);
  assert.equal(eng.solarPower({ ...base, cosZ: -0.5 }), 0);
});

test('surface temperature: coldest at sunrise, warmest at noon', () => {
  const at = (solFraction) => eng.surfaceTemp({ minC: -83, maxC: -23, solFraction });
  close(at(0.25), -83);
  close(at(0.5), -23);
  assert.ok(at(0) > -83 && at(0) < -23);
  for (let f = 0; f < 1; f += 0.01) assert.ok(at(f) >= -83 - 1e-9 && at(f) <= -23 + 1e-9);
});

test('heating power follows the temperature difference', () => {
  close(eng.heatingPower({ insideC: 20, outsideC: -80, conductanceWK: 10 }), 1000);
  close(eng.heatingPower({ insideC: 20, outsideC: -80, conductanceWK: 10, factor: 0.5 }), 500);
  assert.equal(eng.heatingPower({ insideC: 20, outsideC: 25, conductanceWK: 10 }), 0);
  assert.equal(eng.heatingPower({ insideC: 20, outsideC: -80, conductanceWK: null }), 0, 'unresearched conductance adds nothing');
});

test('rocket equation: mass ratio e gives Isp · g0', () => {
  close(eng.deltaV({ isp: 300, g0: gEarth, wetMass: Math.E, dryMass: 1 }), 300 * gEarth);
  assert.throws(() => eng.deltaV({ isp: 300, g0: gEarth, wetMass: 1, dryMass: 2 }));
});

test('light delay spans about 3 to 22 minutes', () => {
  close(eng.lightDelaySec(data.mars.minDistanceFromEarthKm.value, c) / 60, 3.035, 0.01);
  close(eng.lightDelaySec(data.mars.maxDistanceFromEarthKm.value, c) / 60, 22.32, 0.01);
});

test('pendulum swings about 1.62 times slower on Mars', () => {
  const ratio = eng.pendulumPeriod(1, g) / eng.pendulumPeriod(1, gEarth);
  close(ratio, Math.sqrt(gEarth / g));
  close(ratio, 1.62, 0.01);
  close(eng.gravityFromPendulum(1, eng.pendulumPeriod(1, g)), g);
});

test('a 2 m drop takes about 1.04 s on Mars', () => {
  const t = eng.fallTime(2, g);
  close(t, 1.035, 0.01);
  close(eng.gravityFromFall(2, t), g);
});

test('point of no return', () => {
  const walk = { distanceM: 900, o2KgPerSec: 0.001, safetyFactor: 1.2 };
  close(eng.oxygenToReturn({ ...walk, speedMs: 1 }), 1.08);
  // Frozen joints halve the speed, so the walk back needs twice the oxygen.
  close(eng.oxygenToReturn({ ...walk, speedMs: 0.5 }), 2.16);
  assert.equal(eng.oxygenToReturn({ ...walk, speedMs: 0 }), Infinity);
});

test('mass margin and tolerance', () => {
  close(eng.massMargin(1000, 900), 0.1);
  assert.ok(eng.massMargin(1000, 1100) < 0);
  assert.ok(eng.withinTolerance(3.5, g, 0.1));
  assert.ok(!eng.withinTolerance(3.0, g, 0.1));
});

test('night energy: only the hours without Sun count', () => {
  const kwh = eng.nightEnergyKWh({
    latitudeDeg: 0, minC: -70, maxC: 0, insideC: 20, loadW: 1000,
    conductanceWK: 0, factor: 1, continuousW: 0, solHours: 24,
  });
  close(kwh, 12, 0.01); // 1 kW for the 12 dark hours of an equinox sol
  const withRtg = eng.nightEnergyKWh({
    latitudeDeg: 0, minC: -70, maxC: 0, insideC: 20, loadW: 1000,
    conductanceWK: 0, factor: 1, continuousW: 110, solHours: 24,
  });
  close(withRtg, 12 * 0.89, 0.01);
});

test('evaluateDesign sums the chosen rows and flags unresearched values', () => {
  const design = {
    objectiveId: 'balanced', rocketId: 'sls', trajectoryId: 'hohmann', siteId: 'jezero',
    powerId: 'solarRtg', batteryId: 'b40', insulationId: 'thick',
    instrumentIds: ['camera', 'moxie'], commsId: 'relay', spareKitsId: 'k0',
  };
  const s = eng.evaluateDesign(design, data);
  assert.equal(s.capacity, data.launchVehicles.find((r) => r.id === 'sls').capacityKg.value);
  close(s.instrumentDayW, 17.4 + 300);
  assert.equal(s.batteryKWh, 40);
  assert.equal(s.transitDays, 288);
  assert.ok(s.mass >= 45 + 266.7, 'RTG and battery mass are counted');
  assert.ok(s.nightNeedKWh > 0);
  assert.ok(s.unresearched.includes('rules.baseMassKg'), 'base mass is still unresearched');
});
