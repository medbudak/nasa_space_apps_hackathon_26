// K2 tests for src/systems/power.js (M3 load shedding). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/systems/survival.js';
import {
  LOAD_IDS, computeLoads, getPowerStatus, isOn, setExperimentLoad, setOrder,
} from '../src/systems/power.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const ALL = ['meda', 'seis', 'rad', 'moxie', 'plantChamber'];
const watt = (id) => data.instruments.find((r) => r.id === id).powerW.value;

function setup(design = {}, d = data) {
  const bus = fakeBus();
  return { s: newState({ instrumentIds: ALL, ...design }, d), bus, ctx: { data: d, eng, bus } };
}

function sheds(bus) {
  return bus.emitted.filter((e) => e.name === 'power:shed').map((e) => e.payload);
}

/** Step until the first power:shed, or give up. */
function runUntilShed(s, ctx, bus, maxSteps = 2000) {
  for (let i = 0; i < maxSteps && !s.life.loss; i++) {
    step(s, 0.5, ctx);
    if (sheds(bus).length) return true;
  }
  return false;
}

const byId = (loads) => Object.fromEntries(loads.map((l) => [l.id, l.watts]));

test('by day, instrument power goes to the right load', () => {
  const { s, ctx } = setup();
  s.time.solFraction = 0.5;
  const w = byId(computeLoads(s, ctx));
  assert.equal(w.moxie, watt('moxie'));
  assert.equal(w.greenhouse, watt('plantChamber'));
  assert.equal(w.experiments, watt('meda') + watt('seis') + watt('rad'));
  assert.equal(w.lifeSupport, data.rules.habitatPowerW.value);
});

test('at night instruments are off, as in the Sol 0 estimate (rules.instrumentsAtNight)', () => {
  const { s, ctx } = setup();
  s.time.solFraction = 0.0;
  const w = byId(computeLoads(s, ctx));
  assert.equal(data.rules.instrumentsAtNight.value, false);
  assert.equal(w.moxie, 0);
  assert.equal(w.greenhouse, 0);
  assert.equal(w.experiments, 0);
});

test('without the instrument the load draws nothing', () => {
  const { s, ctx } = setup({ instrumentIds: [] });
  s.time.solFraction = 0.5;
  const w = byId(computeLoads(s, ctx));
  assert.equal(w.moxie, 0);
  assert.equal(w.greenhouse, 0);
});

test('an empty battery at night sheds from the bottom of the list and never sheds life support', () => {
  const { s, bus, ctx } = setup({ batteryId: 'b150', insulationId: 'thin' });
  assert.ok(runUntilShed(s, ctx, bus), 'nothing was shed');
  const first = sheds(bus)[0];
  assert.ok(!first.shed.includes('lifeSupport'));
  assert.ok(isOn(s, 'lifeSupport'));
  // At night with no generation, only life support is left drawing power.
  assert.equal(s.power.loadW, data.rules.habitatPowerW.value);
  assert.equal(s.power.deficitW, data.rules.habitatPowerW.value);
});

/** An empty battery after sunset: the loads cannot be covered and shedding starts. */
function emptyAtNight(s) {
  s.time.solFraction = 0.8;
  s.power.batteryWh = 0;
}

test('the player order decides what goes first', () => {
  // Midday in a total dust-out: instruments are running, the panels give nothing, the battery is empty.
  const { s, bus, ctx } = setup({ batteryId: 'b150', insulationId: 'thin' });
  assert.ok(setOrder(s, ['lifeSupport', 'heating', 'greenhouse', 'experiments', 'comms', 'moxie']));
  s.time.solFraction = 0.5;
  s.power.batteryWh = 0;
  s.power.dust = 1;
  runUntilShed(s, ctx, bus);
  assert.equal(sheds(bus)[0].shed[0], 'moxie');
});

test('setOrder rejects a list that moves life support or misses a load, and keeps the same array', () => {
  const { s } = setup();
  const order = s.power.order;
  const before = [...order];
  assert.equal(setOrder(s, ['heating', 'lifeSupport', 'greenhouse', 'moxie', 'experiments', 'comms']), false);
  assert.equal(setOrder(s, ['lifeSupport', 'heating']), false);
  assert.equal(setOrder(s, ['lifeSupport', 'heating', 'heating', 'moxie', 'experiments', 'comms']), false);
  assert.deepEqual(s.power.order, before);
  assert.ok(setOrder(s, ['lifeSupport', 'comms', 'heating', 'greenhouse', 'moxie', 'experiments']));
  assert.equal(s.power.order, order, 'order array was replaced instead of updated in place');
});

test('shed loads come back after the battery refills, and do not flicker overnight', () => {
  // This test is about restoring loads, not about freezing: a habitat that cools very slowly
  // keeps the astronaut alive through a night with the heating shed.
  const slowCooling = structuredClone(data);
  slowCooling.insulation.find((r) => r.id === 'thin').coolingTimeH.value = 1e9;
  const { s, bus, ctx } = setup({ batteryId: 'b150', insulationId: 'thin' }, slowCooling);
  emptyAtNight(s);
  runUntilShed(s, ctx, bus);
  const shedSol = s.time.sol;
  const restoreAt = data.rules.powerRestoreFraction.value * s.power.batteryCapacityWh;
  for (let i = 0; i < 1000 && (s.time.solFraction > 0.5 || s.time.solFraction < 0.25); i++) {
    step(s, 0.5, ctx);
    if (s.power.batteryWh < restoreAt) {
      for (const id of sheds(bus)[0].shed) assert.ok(!isOn(s, id), `${id} came back before the battery recovered`);
    }
  }
  for (let i = 0; i < 1000 && (s.time.sol === shedSol || s.time.solFraction < 0.6); i++) step(s, 0.5, ctx);
  assert.equal(s.life.loss, null);
  for (const id of LOAD_IDS) assert.ok(isOn(s, id), `${id} still off in the afternoon`);
});

test('a large battery gets through the night without shedding', () => {
  const { s, bus, ctx } = setup({ batteryId: 'b300', insulationId: 'thick' });
  for (let i = 0; i < 240; i++) step(s, 0.5, ctx);
  assert.equal(sheds(bus).length, 0);
});

test('a running experiment adds to the experiments load', () => {
  const { s, ctx } = setup({ instrumentIds: [] });
  setExperimentLoad(s, 250);
  assert.equal(byId(computeLoads(s, ctx)).experiments, 250);
  setExperimentLoad(s, 0);
});

test('getPowerStatus gives the power panel everything in one object', () => {
  const { s, ctx } = setup({ batteryId: 'b200' });
  step(s, 0.5, ctx);
  const st = getPowerStatus(s, ctx);
  assert.equal(st.batteryCapacityWh, 200 * 1000);
  assert.equal(st.loads.length, LOAD_IDS.length);
  assert.equal(st.loads[0].id, 'lifeSupport');
  assert.equal(st.loads[0].pinned, true);
  assert.equal(typeof st.generationW, 'number');
});
