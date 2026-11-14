// K2 tests for the loss conditions (D-006), habitat cooling and surface radiation in survival.js.
// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLoss, setEvaPosition, startEva, step, val } from '../src/systems/survival.js';
import { data, eng, newState } from './helpers/k2_env.mjs';

const ctx = { data, eng };
const solHours = val(data.mars.solLength);
const realSecPerHour = val(data.tuning.solDuration) / solHours;

/** Step for a number of game hours (bounded, so a stopped clock cannot hang the test). */
function runHours(s, hours, c = ctx) {
  const steps = Math.ceil((hours * realSecPerHour) / 0.5);
  for (let i = 0; i < steps; i++) step(s, 0.5, c);
}

test('a well-supplied run survives its first sol with no loss', () => {
  const s = newState({ battery_kWh: 60, insulation: 'thick' });
  runHours(s, solHours);
  assert.equal(s.sim.loss, null);
  assert.equal(checkLoss(s, ctx), null);
});

test('surface radiation builds up at the RAD rate (per Earth day)', () => {
  const s = newState({ battery_kWh: 60 });
  runHours(s, 24);
  assert.ok(Math.abs(s.resources.radiation_mSv - val(data.radiation.surfaceMSvPerDay)) < 0.01);
});

test('running out of habitat O2 ends the mission', () => {
  const s = newState({ battery_kWh: 60 });
  s.resources.oxygen_kg = 0.001;
  runHours(s, 1);
  assert.equal(s.sim.loss.reasonKey, 'loss.oxygen');
  assert.equal(s.outcome, 'lost');
});

test('running out of suit O2 outside ends the mission, even with a full habitat tank', () => {
  const s = newState({ battery_kWh: 60 });
  s.timeOfSol = 0.5; // midday: no joint freeze
  startEva(s, data);
  setEvaPosition(s, { distanceM: 300 });
  s.sim.eva.suitO2Kg = 0.001;
  runHours(s, 1);
  assert.equal(s.sim.loss.reasonKey, 'loss.suitOxygen');
  assert.equal(s.sim.loss.values.distanceM, 300);
  assert.ok(s.resources.oxygen_kg > 0);
});

test('with heating shed the habitat cools toward the outside air', () => {
  const s = newState({ battery_kWh: 5 });
  // Run into the night until the heating has been shed.
  for (let i = 0; i < 2000 && !s.sim.power.off.heating; i++) step(s, 0.5, ctx);
  assert.equal(s.sim.power.off.heating, true, 'heating was never shed');
  const before = s.sim.inside_C;
  runHours(s, 1);
  assert.ok(s.sim.inside_C < before, 'habitat did not cool');
  assert.ok(s.sim.inside_C > s.sim.outside_C, 'habitat cooled past the outside air');
});

test('a small battery that loses its heating at night freezes the astronaut after 2 cold hours', () => {
  const s = newState({ battery_kWh: 5 });
  runHours(s, solHours);
  assert.ok(s.sim.loss, 'astronaut survived a night with no heating');
  assert.equal(s.sim.loss.reasonKey, 'loss.cold');
  assert.ok(s.sim.inside_C <= val(data.body.coldBelow_C));
});

test('cold hours reset when the astronaut warms up', () => {
  const s = newState({ battery_kWh: 60 });
  s.sim.body.coldHours = val(data.loss.coldHours) - 0.1;
  step(s, 0.5, ctx); // heating on: habitat at its set point, not cold
  assert.equal(s.sim.body.cold, false);
  assert.equal(s.sim.body.coldHours, 0);
});

test('frozen suit joints count as cold outside', () => {
  const s = newState({ battery_kWh: 60 });
  s.timeOfSol = 0.5;
  startEva(s, data);
  s.timeOfSol = 0.1; // pre-dawn: joints freeze
  step(s, 0.001, ctx);
  assert.equal(s.sim.eva.jointsFrozen, true);
  assert.equal(s.sim.body.cold, true);
});

test('a dose over the mission limit ends the mission', () => {
  const s = newState({ battery_kWh: 60 });
  s.resources.radiation_mSv = val(data.loss.radiationLimit_mSv) + 1;
  step(s, 0.5, ctx);
  assert.equal(s.sim.loss.reasonKey, 'loss.radiation');
});

test('sanity at zero ends the mission once sanity.js provides it', () => {
  const s = newState({ battery_kWh: 60 });
  step(s, 0.5, ctx);
  assert.equal(s.sim.loss, null, 'no sanity value yet: no loss');
  s.sim.sanity = 0;
  step(s, 0.5, ctx);
  assert.equal(s.sim.loss.reasonKey, 'loss.sanity');
});

test('after a loss the simulation stops and the first reason is kept', () => {
  const s = newState({ battery_kWh: 60 });
  s.resources.oxygen_kg = 0;
  step(s, 0.5, ctx);
  const t = s.timeOfSol;
  const loss = s.sim.loss;
  s.resources.radiation_mSv = 1e6;
  step(s, 0.5, ctx);
  assert.equal(s.timeOfSol, t, 'clock kept running after the loss');
  assert.equal(s.sim.loss, loss);
  assert.equal(s.sim.loss.reasonKey, 'loss.oxygen');
});
