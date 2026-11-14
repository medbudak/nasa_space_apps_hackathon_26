// K2 tests for src/systems/survival.js. Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, spendEnergy, spendO2, spendTime, val, landingSite } from '../src/systems/survival.js';
import { data, eng, newState } from './helpers/k2_env.mjs';

const ctx = { data, eng };
const STEP = 0.5; // real seconds per simulation step in these tests

/** Run one full sol, sampling after every step. */
function runOneSol(state) {
  const samples = [];
  const steps = val(data.tuning.solDuration) / STEP;
  for (let i = 0; i < steps; i++) {
    step(state, STEP, ctx);
    samples.push({
      t: state.timeOfSol,
      gen: state.sim.generation_W,
      energy: state.resources.energy_kWh,
      temp: state.sim.outside_C,
    });
  }
  return samples;
}

test('initSurvival starts on sol 1 with a full battery and the starting O2', () => {
  const s = newState({ battery_kWh: 40 });
  assert.equal(s.sol, 1);
  assert.equal(s.timeOfSol, val(data.tuning.startTimeOfSol));
  assert.equal(s.resources.energy_kWh, 40);
  assert.equal(s.resources.oxygen_kg, val(data.life.oxygenStart_kg));
});

test('one sol of real time advances the sol counter by one', () => {
  const s = newState();
  runOneSol(s);
  assert.equal(s.sol, 2);
  assert.ok(Math.abs(s.timeOfSol - val(data.tuning.startTimeOfSol)) < 1e-9);
});

test('panels produce power only in daytime', () => {
  const samples = runOneSol(newState());
  const night = samples.filter((x) => x.t < 0.25 || x.t > 0.75);
  const noon = samples.filter((x) => x.t > 0.45 && x.t < 0.55);
  assert.ok(night.every((x) => x.gen === 0));
  assert.ok(noon.every((x) => x.gen > 0));
});

test('outside temperature stays inside the site range and swings day to night', () => {
  const samples = runOneSol(newState());
  const site = landingSite(data, 'meridiani');
  const temps = samples.map((x) => x.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  assert.ok(min >= site.nightMin_C - 1e-9 && max <= site.dayMax_C + 1e-9);
  assert.ok(max - min > 80, `swing was only ${max - min} °C`);
});

test('battery drains at night and charges in the day', () => {
  // The run starts at dawn, so one sol ends at the next dawn: the night low.
  const s = newState();
  const samples = runOneSol(s);
  const evening = samples.find((x) => x.t > 0.76);
  const dawn = samples.at(-1);
  assert.ok(dawn.energy < evening.energy, 'battery should fall overnight');
  // Keep going until the next noon: the panels should refill it.
  while (s.timeOfSol < 0.5) step(s, STEP, ctx);
  assert.ok(s.resources.energy_kWh > dawn.energy, 'battery should recover after sunrise');
});

test('a small battery runs empty at night and reports a deficit', () => {
  const s = newState({ battery_kWh: 5 });
  let sawDeficit = false;
  for (let i = 0; i < 240; i++) {
    step(s, STEP, ctx);
    if (s.sim.deficit_W > 0) sawDeficit = true;
  }
  assert.ok(sawDeficit);
  assert.ok(s.resources.energy_kWh >= 0);
});

test('thick insulation needs less night heating than thin', () => {
  const thin = newState({ insulation: 'thin' });
  const thick = newState({ insulation: 'thick' });
  runOneSol(thin);
  runOneSol(thick);
  assert.ok(thick.resources.energy_kWh > thin.resources.energy_kWh);
});

test('O2 is consumed over a sol at the crew rate', () => {
  const s = newState();
  const start = s.resources.oxygen_kg;
  runOneSol(s);
  const expected = val(data.life.oxygenPerCrewPerSol_kg) * val(data.life.crew);
  assert.ok(Math.abs(start - s.resources.oxygen_kg - expected) < 1e-6);
});

test('spend helpers refuse when there is not enough', () => {
  const s = newState();
  assert.equal(spendEnergy(s, s.resources.energy_kWh + 1), false);
  assert.equal(spendO2(s, s.resources.oxygen_kg + 1), false);
  const o2 = s.resources.oxygen_kg;
  assert.equal(spendO2(s, 1), true);
  assert.equal(s.resources.oxygen_kg, o2 - 1);
});

test('spendTime advances the clock by the requested game hours', () => {
  const s = newState();
  spendTime(s, val(data.mars.solLength) / 2, ctx);
  assert.ok(Math.abs(s.timeOfSol - (val(data.tuning.startTimeOfSol) + 0.5)) < 1e-6);
});
