// K2 tests for src/systems/power.js (M3 load shedding). Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, val } from '../src/systems/survival.js';
import {
  LOAD_IDS, computeLoads, getPowerStatus, isOn, setExperimentLoad, setOrder,
} from '../src/systems/power.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const ALL = ['weather', 'seismometer', 'radiation', 'moxie', 'plantChamber'];

function setup(opts = {}) {
  const bus = fakeBus();
  return { s: newState({ instruments: ALL, ...opts }), bus, ctx: { data, eng, bus } };
}

function sheds(bus) {
  return bus.emitted.filter((e) => e.name === 'power:shed').map((e) => e.payload);
}

/** Step until the first power:shed, or give up. */
function runUntilShed(s, ctx, bus, maxSteps = 2000) {
  for (let i = 0; i < maxSteps; i++) {
    step(s, 0.5, ctx);
    if (sheds(bus).length) return true;
  }
  return false;
}

test('instrument power goes to the right load', () => {
  const { s, ctx } = setup();
  const w = Object.fromEntries(computeLoads(s, ctx).map((l) => [l.id, l.watts]));
  const p = (id) => data.instruments.find((r) => r.id === id).power_W;
  assert.equal(w.moxie, p('moxie'));
  assert.equal(w.greenhouse, p('plantChamber'));
  assert.equal(w.experiments, p('weather') + p('seismometer') + p('radiation'));
  assert.equal(w.lifeSupport, val(data.power.lifeSupport_W));
  assert.equal(w.comms, val(data.power.comms_W));
});

test('without the instrument the load draws nothing', () => {
  const { s, ctx } = setup({ instruments: [] });
  const w = Object.fromEntries(computeLoads(s, ctx).map((l) => [l.id, l.watts]));
  assert.equal(w.moxie, 0);
  assert.equal(w.greenhouse, 0);
});

test('an empty battery at night sheds from the bottom of the list and never sheds life support', () => {
  const { s, bus, ctx } = setup({ battery_kWh: 5 });
  assert.ok(runUntilShed(s, ctx, bus), 'nothing was shed');
  const first = sheds(bus)[0];
  assert.equal(first.shed[0], 'comms', 'bottom of the default list goes first');
  assert.ok(!first.shed.includes('lifeSupport'));
  assert.ok(isOn(s, 'lifeSupport'));
  // At night only life support is left drawing power.
  assert.equal(s.sim.load_W, val(data.power.lifeSupport_W));
  assert.equal(s.sim.deficit_W, val(data.power.lifeSupport_W));
});

test('the player order decides what goes first', () => {
  const { s, bus, ctx } = setup({ battery_kWh: 5 });
  assert.ok(setOrder(s, ['lifeSupport', 'heating', 'greenhouse', 'comms', 'experiments', 'moxie']));
  runUntilShed(s, ctx, bus);
  assert.equal(sheds(bus)[0].shed[0], 'moxie');
});

test('setOrder rejects a list that moves life support or misses a load', () => {
  const { s } = setup();
  const before = [...s.sim.power.order];
  assert.equal(setOrder(s, ['heating', 'lifeSupport', 'greenhouse', 'moxie', 'experiments', 'comms']), false);
  assert.equal(setOrder(s, ['lifeSupport', 'heating']), false);
  assert.equal(setOrder(s, ['lifeSupport', 'heating', 'heating', 'moxie', 'experiments', 'comms']), false);
  assert.deepEqual(s.sim.power.order, before);
});

test('shed loads come back after the battery refills, and do not flicker overnight', () => {
  const { s, bus, ctx } = setup({ battery_kWh: 5 });
  runUntilShed(s, ctx, bus);
  const shedSol = s.sol;
  // Rest of the night: loads must stay off until the battery passes the restore threshold.
  while (s.timeOfSol > 0.5 || s.timeOfSol < 0.25) {
    step(s, 0.5, ctx);
    if (s.resources.energy_kWh < val(data.tuning.powerRestoreFraction) * 5) {
      assert.ok(!isOn(s, 'comms'), 'comms came back before the battery recovered');
    }
  }
  // Next day: run to noon, everything should be back on.
  while (s.sol === shedSol || s.timeOfSol < 0.5) step(s, 0.5, ctx);
  for (const id of LOAD_IDS) assert.ok(isOn(s, id), `${id} still off at noon`);
});

test('a large battery gets through the night without shedding', () => {
  const { s, bus, ctx } = setup({ battery_kWh: 60, insulation: 'thick' });
  for (let i = 0; i < 240; i++) step(s, 0.5, ctx);
  assert.equal(sheds(bus).length, 0);
});

test('a running experiment adds to the experiments load', () => {
  const { s, ctx } = setup({ instruments: [] });
  setExperimentLoad(s, 250);
  const exp = computeLoads(s, ctx).find((l) => l.id === 'experiments');
  assert.equal(exp.watts, 250);
  setExperimentLoad(s, 0);
});

test('getPowerStatus gives the power panel everything in one object', () => {
  const { s, ctx } = setup();
  step(s, 0.5, ctx);
  const st = getPowerStatus(s, ctx);
  assert.equal(st.capacity_kWh, 40);
  assert.equal(st.loads.length, LOAD_IDS.length);
  assert.equal(st.loads[0].id, 'lifeSupport');
  assert.equal(st.loads[0].pinned, true);
  assert.equal(typeof st.generation_W, 'number');
});
