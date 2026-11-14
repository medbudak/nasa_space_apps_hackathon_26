// K2 tests for src/systems/survival.js. Run with: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createSurvivalState, step, spendEnergy, spendO2, spendTime, val,
} from '../src/systems/survival.js';

const data = JSON.parse(readFileSync(new URL('./fixtures/survival_data.json', import.meta.url)));

// Test doubles for K1's engineering.js. Rough shapes only, so the simulation can be
// exercised before the real formulas land. Replace with the real module when K1 publishes it.
const eng = {
  // Sun up from 06:00 to 18:00 local (solFraction 0.25..0.75), peak at noon.
  sunCos: (f) => (f >= 0.25 && f <= 0.75 ? Math.sin(Math.PI * (f - 0.25) / 0.5) : 0),
  solarPower: ({ irradiance, area, efficiency, cosZ, dust }) => irradiance * area * efficiency * cosZ * (1 - dust),
  // Coldest just before dawn, warmest early afternoon.
  surfaceTemp: ({ minC, maxC, solFraction }) =>
    (minC + maxC) / 2 - ((maxC - minC) / 2) * Math.cos(2 * Math.PI * (solFraction - 0.1)),
  heatingPower: ({ insideC, outsideC, insulation }) =>
    Math.max(0, insideC - outsideC) * (insulation === 'thick' ? 10 : 20),
};
const ctx = { data, eng };

const design = { site: 'meridiani', panelAreaM2: 100, panelEfficiency: 0.25, batteryKWh: 40, insulation: 'thin' };

function newState(overrides = {}) {
  const s = createSurvivalState({ ...design, ...overrides }, data);
  s.design = { ...design, ...overrides };
  return s;
}

/** Run one full sol in 0.5 s real-time steps, sampling at every step. */
function runOneSol(state) {
  const samples = [];
  const steps = val(data.time.solRealSeconds) / 0.5;
  for (let i = 0; i < steps; i++) {
    step(state, 0.5, ctx);
    samples.push({
      f: state.time.solFraction,
      gen: state.power.generationW,
      batt: state.power.batteryWh,
      temp: state.env.outsideC,
    });
  }
  return samples;
}

test('one sol of real time advances the sol counter by one', () => {
  const s = newState();
  runOneSol(s);
  assert.equal(s.time.sol, 2);
  assert.ok(Math.abs(s.time.solFraction - val(data.time.startSolFraction)) < 1e-9);
});

test('panels produce power only in daytime', () => {
  const samples = runOneSol(newState());
  const night = samples.filter((x) => x.f < 0.25 || x.f > 0.75);
  const noon = samples.filter((x) => x.f > 0.45 && x.f < 0.55);
  assert.ok(night.every((x) => x.gen === 0));
  assert.ok(noon.every((x) => x.gen > 0));
});

test('outside temperature stays inside the site range and swings day to night', () => {
  const samples = runOneSol(newState());
  const site = data.sites.meridiani;
  const temps = samples.map((x) => x.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  assert.ok(min >= val(site.nightMinC) - 1e-9 && max <= val(site.dayMaxC) + 1e-9);
  assert.ok(max - min > 80, `swing was only ${max - min} °C`);
});

test('battery drains at night and charges in the day', () => {
  // The run starts at dawn, so one sol ends at the next dawn: the night low.
  const s = newState();
  const samples = runOneSol(s);
  const evening = samples.find((x) => x.f > 0.76);
  const dawn = samples.at(-1);
  assert.ok(dawn.batt < evening.batt, 'battery should fall overnight');
  // Keep going until the next noon: the panels should refill it.
  while (s.time.solFraction < 0.5) step(s, 0.5, ctx);
  assert.ok(s.power.batteryWh > dawn.batt, 'battery should recover after sunrise');
});

test('a small battery runs empty at night and reports a deficit', () => {
  const s = newState({ batteryKWh: 5 });
  let sawDeficit = false;
  for (let i = 0; i < 240; i++) {
    step(s, 0.5, ctx);
    if (s.power.deficitW > 0) sawDeficit = true;
  }
  assert.ok(sawDeficit);
  assert.ok(s.power.batteryWh >= 0);
});

test('thick insulation needs less night heating than thin', () => {
  const thin = newState({ insulation: 'thin' });
  const thick = newState({ insulation: 'thick' });
  runOneSol(thin);
  runOneSol(thick);
  assert.ok(thick.power.batteryWh > thin.power.batteryWh);
});

test('O2 is consumed over a sol at the crew rate', () => {
  const s = newState();
  const start = s.life.o2Kg;
  runOneSol(s);
  const expected = val(data.life.o2KgPerCrewPerSol) * val(data.life.crew);
  assert.ok(Math.abs(start - s.life.o2Kg - expected) < 1e-6);
});

test('spend helpers refuse when there is not enough', () => {
  const s = newState();
  assert.equal(spendEnergy(s, s.power.batteryWh + 1), false);
  assert.equal(spendO2(s, s.life.o2Kg + 1), false);
  const o2 = s.life.o2Kg;
  assert.equal(spendO2(s, 1), true);
  assert.equal(s.life.o2Kg, o2 - 1);
});

test('spendTime advances the clock by the requested game hours', () => {
  const s = newState();
  const half = val(data.time.solHours) / 2;
  spendTime(s, half, ctx);
  assert.ok(Math.abs(s.time.solFraction - (val(data.time.startSolFraction) + 0.5)) < 1e-6);
});
