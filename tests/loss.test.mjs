// K2 tests for the loss conditions (D-006), habitat cooling and surface radiation in survival.js.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLoss, setEvaPosition, startEva, step } from '../src/systems/survival.js';
import { data, eng, newState, realSeconds } from './helpers/k2_env.mjs';

const ctx = { data, eng };
const solHours = data.mars.solHours.value;

/** Step for a number of game hours in 0.5 s real-time steps (stops early on a loss). */
function runHours(s, hours) {
  const steps = Math.ceil(realSeconds(hours) / 0.5);
  for (let i = 0; i < steps && !s.life.loss; i++) step(s, 0.5, ctx);
}

test('a well-designed run survives two sols with no loss', () => {
  const s = newState({ batteryId: 'b300', insulationId: 'thick' });
  runHours(s, 2 * solHours);
  assert.equal(s.life.loss, null);
  assert.equal(checkLoss(s, ctx), null);
  assert.equal(s.outcome, null);
});

test('surface radiation builds up at the RAD rate (per Earth day)', () => {
  const s = newState();
  step(s, realSeconds(24), ctx);
  assert.ok(Math.abs(s.life.radiationMSv - data.radiation.surfaceMSvPerDay.value) < 1e-9);
});

test('running out of habitat O2 ends the mission', () => {
  const s = newState();
  s.life.o2Kg = 0.001;
  runHours(s, 1);
  assert.equal(s.life.loss.reasonKey, 'loss.oxygen');
  assert.equal(s.outcome, 'lost');
});

test('running out of suit O2 outside ends the mission, even with a full habitat tank', () => {
  const s = newState();
  s.time.solFraction = 0.5; // midday: no joint freeze
  startEva(s, data);
  setEvaPosition(s, { distanceM: 300 });
  s.life.eva.suitO2Kg = 0.001;
  runHours(s, 1);
  assert.equal(s.life.loss.reasonKey, 'loss.suitOxygen');
  assert.equal(s.life.loss.values.distanceM, 300);
  assert.ok(s.life.o2Kg > 0);
});

// Heating is part of the habitat load (D-009), so the habitat cools when that load goes unpowered.
function powerlessNight(design) {
  const s = newState(design);
  s.time.solFraction = 0.8; // after sunset
  s.power.batteryWh = 0;
  return s;
}

test('without power the habitat cools toward the outside air', () => {
  const s = powerlessNight({ insulationId: 'thin' });
  step(s, 0.5, ctx); // the deficit shows up
  const before = s.env.insideC;
  step(s, realSeconds(0.5), ctx);
  assert.ok(s.env.insideC < before, 'habitat did not cool');
  assert.ok(s.env.insideC > s.env.outsideC, 'habitat cooled past the outside air');
});

test('a habitat left without power at night freezes the astronaut', () => {
  const s = powerlessNight({ insulationId: 'thin' });
  runHours(s, 6);
  assert.ok(s.life.loss, 'astronaut survived a night with no power');
  assert.equal(s.life.loss.reasonKey, 'loss.cold');
  assert.ok(s.env.insideC <= data.thermal.cabinMinC.value);
});

test('cold hours reset when the astronaut warms up', () => {
  const s = newState();
  s.life.body.coldHours = data.loss.coldHours.value - 0.1;
  step(s, 0.5, ctx); // heating on: habitat at its set point, not cold
  assert.equal(s.life.body.cold, false);
  assert.equal(s.life.body.coldHours, 0);
});

test('frozen suit joints count as cold outside', () => {
  const s = newState();
  s.time.solFraction = 0.5;
  startEva(s, data);
  s.time.solFraction = 0.24; // pre-dawn: joints freeze
  step(s, 0.001, ctx);
  assert.equal(s.life.eva.jointsFrozen, true);
  assert.equal(s.life.body.cold, true);
});

test('a dose over the mission limit ends the mission', () => {
  const s = newState();
  s.life.radiationMSv = data.loss.radiationLimitMSv.value + 1;
  step(s, 0.5, ctx);
  assert.equal(s.life.loss.reasonKey, 'loss.radiation');
});

test('sanity at zero ends the mission once sanity.js provides it', () => {
  const s = newState();
  step(s, 0.5, ctx);
  assert.equal(s.life.loss, null, 'no sanity value yet: no loss');
  s.life.sanity = 0;
  step(s, 0.5, ctx);
  assert.equal(s.life.loss.reasonKey, 'loss.sanity');
});

test('after a loss the simulation stops and the first reason is kept', () => {
  const s = newState();
  s.life.o2Kg = 0;
  step(s, 0.5, ctx);
  const t = s.time.solFraction;
  const loss = s.life.loss;
  s.life.radiationMSv = 1e6;
  step(s, 0.5, ctx);
  assert.equal(s.time.solFraction, t, 'clock kept running after the loss');
  assert.equal(s.life.loss, loss);
  assert.equal(s.life.loss.reasonKey, 'loss.oxygen');
});
