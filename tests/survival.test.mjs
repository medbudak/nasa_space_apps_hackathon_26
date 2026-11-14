// K2 tests for src/systems/survival.js: time, day/night, power, temperature, O2.
// Uses K1's real state, formulas and data (tests/helpers/k2_env.mjs). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, spendEnergy, spendO2, spendTime } from '../src/systems/survival.js';
import { data, eng, newState, realSeconds } from './helpers/k2_env.mjs';

const ctx = { data, eng };
const STEP = 0.5; // real seconds per simulation step in these tests
const solHours = data.mars.solHours.value;
const site = data.landingSites.find((r) => r.id === 'meridiani');

/** Run one full sol, sampling after every step. */
function runOneSol(state) {
  const samples = [];
  const steps = data.time.solRealSeconds.value / STEP;
  for (let i = 0; i < steps; i++) {
    step(state, STEP, ctx);
    samples.push({
      f: state.time.solFraction,
      gen: state.power.generationW,
      batt: state.power.batteryWh,
      temp: state.env.outsideC,
    });
  }
  return samples;
}

test('a new surface run starts on sol 1 at the data start time, battery full', () => {
  const s = newState({ batteryId: 'b200' });
  assert.equal(s.time.sol, 1);
  assert.equal(s.time.solFraction, data.time.startSolFraction.value);
  assert.equal(s.power.batteryWh, 200 * 1000);
  assert.equal(s.power.batteryCapacityWh, 200 * 1000);
  assert.equal(s.life.o2Kg, data.life.o2StartKg.value);
  assert.equal(s.env.insideC, data.thermal.habitatTargetC.value);
});

test('landing sets the data budget per sol from the comms choice', () => {
  const relay = data.comms.find((r) => r.id === 'relay');
  const s = newState({ commsId: 'relay' });
  assert.equal(s.dataBudget.perSol, relay.mbitPerSol.value);
  assert.equal(s.dataBudget.used, 0);
});

test('an unresearched comms figure leaves the data budget unknown, not zero', () => {
  const noFigure = structuredClone(data);
  noFigure.comms.find((r) => r.id === 'relay').mbitPerSol.value = null;
  const s = newState({ commsId: 'relay' }, noFigure);
  assert.equal(s.dataBudget.perSol, null);
});

test('one sol of real time advances the sol counter by one', () => {
  const s = newState();
  runOneSol(s);
  assert.equal(s.time.sol, 2);
  assert.ok(Math.abs(s.time.solFraction - data.time.startSolFraction.value) < 1e-9);
});

test('solar panels produce power only in daytime', () => {
  const samples = runOneSol(newState());
  const night = samples.filter((x) => x.f < 0.24 || x.f > 0.76);
  const noon = samples.filter((x) => x.f > 0.45 && x.f < 0.55);
  assert.ok(night.every((x) => x.gen === 0));
  assert.ok(noon.every((x) => x.gen > 0));
});

test('an RTG keeps producing at night', () => {
  const s = newState({ powerId: 'solarRtg' });
  s.time.solFraction = 0.0; // midnight
  step(s, 0.001, ctx);
  const rtg = data.powerSources.find((r) => r.id === 'solarRtg');
  assert.ok(Math.abs(s.power.generationW - rtg.continuousW.value) < 1e-9);
});

test('outside temperature stays inside the site range and swings day to night', () => {
  const temps = runOneSol(newState()).map((x) => x.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  assert.ok(min >= site.nightMinC.value - 1e-9 && max <= site.dayMaxC.value + 1e-9);
  assert.ok(max - min > 0.9 * (site.dayMaxC.value - site.nightMinC.value));
});

test('battery drains at night and charges in the day', () => {
  // The run starts at dawn, so one sol ends at the next dawn: the night low.
  const s = newState();
  const samples = runOneSol(s);
  const evening = samples.find((x) => x.f > 0.76);
  const dawn = samples.at(-1);
  assert.ok(dawn.batt < evening.batt, 'battery should fall overnight');
  for (let i = 0; i < 1000 && s.time.solFraction < 0.5; i++) step(s, STEP, ctx);
  assert.ok(s.power.batteryWh > dawn.batt, 'battery should recover after sunrise');
});

test('a small battery runs empty at night and reports a deficit', () => {
  const s = newState({ batteryId: 'b150', insulationId: 'thin' });
  let sawDeficit = false;
  for (let i = 0; i < 240 && !s.life.loss; i++) {
    step(s, STEP, ctx);
    if (s.power.deficitW > 0) sawDeficit = true;
  }
  assert.ok(sawDeficit);
  assert.ok(s.power.batteryWh >= 0);
});

test('thick insulation keeps an unpowered habitat warm for longer', () => {
  const thin = newState({ insulationId: 'thin' });
  const thick = newState({ insulationId: 'thick' });
  for (const s of [thin, thick]) {
    s.time.solFraction = 0.8; // after sunset
    s.power.batteryWh = 0;
    for (let i = 0; i < Math.ceil(realSeconds(2) / STEP); i++) step(s, STEP, ctx);
  }
  assert.ok(thick.env.insideC > thin.env.insideC, `thick ${thick.env.insideC} vs thin ${thin.env.insideC}`);
});

test('habitat O2 is used at the BVAD rate per Earth day', () => {
  const s = newState();
  const start = s.life.o2Kg;
  step(s, realSeconds(24), ctx);
  const expected = data.life.o2KgPerCrewPerDay.value * data.life.crew.value;
  assert.ok(Math.abs(start - s.life.o2Kg - expected) < 1e-9);
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
  spendTime(s, solHours / 2, ctx);
  assert.ok(Math.abs(s.time.solFraction - (data.time.startSolFraction.value + 0.5)) < 1e-6);
});

test('stats for the report card follow the run', () => {
  const s = newState();
  runOneSol(s);
  assert.equal(s.stats.solsSurvived, 1);
  assert.ok(s.stats.energyUsedKWh > 0);
});

test('a missing data value is a clear error, not a silent zero', () => {
  const broken = structuredClone(data);
  broken.life.o2StartKg.value = null;
  assert.throws(() => newState({}, broken), /life\.o2StartKg/);
});
