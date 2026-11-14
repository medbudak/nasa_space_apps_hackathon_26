// K2 tests for src/systems/events.js. Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, val } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const cfg = data.events.engineFreeze;

function setup() {
  const bus = fakeBus();
  return { s: newState(), bus, ctx: { data, eng, bus } };
}

/** Step the simulation (0.5 s at a time) until a card opens. */
function runUntilCard(state, ctx, maxSteps = 1000) {
  for (let i = 0; i < maxSteps; i++) {
    step(state, 0.5, ctx);
    if (checkEvents(state, ctx)) return true;
  }
  return false;
}

test('engine-freeze card opens on a cold night, not in the day', () => {
  const { s, bus, ctx } = setup();
  assert.ok(runUntilCard(s, ctx), 'card never opened');
  assert.equal(eng.sunCosZenith(s.timeOfSol), 0, 'should be night');
  assert.ok(s.sim.outside_C <= val(cfg.triggerBelow_C));

  const open = bus.emitted.find((e) => e.name === 'decision:open');
  assert.equal(open.payload.eventId, 'engineFreeze');
  assert.equal(open.payload.options.length, 3);
  assert.equal(typeof open.payload.choose, 'function');
});

test('every option shows its numeric costs before the choice', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  for (const option of s.sim.events.pending.card.options) {
    const numeric = option.effects.filter((e) => e.type === 'resource' || e.type === 'wait');
    assert.ok(numeric.length > 0, `${option.id} has no visible cost`);
  }
});

test('battery heating costs energy, cuts greenhouse heat and is logged', () => {
  const { s, bus, ctx } = setup();
  runUntilCard(s, ctx);
  const before = s.resources.energy_kWh;

  const entry = resolveDecision(s, 'batteryHeat', ctx);

  assert.ok(Math.abs(before - s.resources.energy_kWh - val(cfg.batteryHeat_kWh)) < 1e-9);
  assert.equal(s.sim.events.flags.greenhouseHeatingCut, true);
  assert.equal(s.sim.events.flags.engineFrozen, false);
  assert.equal(s.sim.events.pending, null);
  assert.deepEqual(s.decisionLog, [entry]);
  assert.equal(entry.eventId, 'engineFreeze');
  assert.equal(entry.choice, 'batteryHeat');
  assert.ok(bus.emitted.some((e) => e.name === 'decision:made'));
});

test('manual heating costs O2 and radiation', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  const o2 = s.resources.oxygen_kg;
  const dose = s.resources.radiation_mSv; // surface dose so far
  resolveDecision(s, 'manualHeat', ctx);
  assert.ok(Math.abs(o2 - s.resources.oxygen_kg - val(cfg.manualOxygen_kg)) < 1e-9);
  assert.ok(Math.abs(s.resources.radiation_mSv - dose - val(cfg.manualRadiation_mSv)) < 1e-9);
});

test('waiting moves the clock forward one sol and uses a sol of O2', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  const sol = s.sol;
  const o2 = s.resources.oxygen_kg;
  resolveDecision(s, 'wait', ctx);
  assert.equal(s.sol, sol + 1);
  const perSol = val(data.life.oxygenPerCrewPerSol_kg) * val(data.life.crew);
  assert.ok(Math.abs(o2 - s.resources.oxygen_kg - perSol) < 1e-3);
});

test('the choose callback in the card payload resolves the decision', () => {
  const { s, bus, ctx } = setup();
  runUntilCard(s, ctx);
  bus.emitted.find((e) => e.name === 'decision:open').payload.choose('manualHeat');
  assert.equal(s.decisionLog.at(-1).choice, 'manualHeat');
});

test('no new card opens while one is pending, and a once-event fires only once', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  assert.equal(checkEvents(s, ctx), null, 'second card opened while one was pending');
  resolveDecision(s, 'batteryHeat', ctx);
  assert.equal(runUntilCard(s, ctx, 500), false, 'engineFreeze fired twice');
});

test('energy from an effect never goes above battery capacity or below zero', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  s.resources.energy_kWh = 1;
  resolveDecision(s, 'batteryHeat', ctx);
  assert.equal(s.resources.energy_kWh, 0);
});

test('a life-threatening EVA card wins over the engine card when both trigger', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx); // engineFreeze is now open: resolve it and set up the clash again
  resolveDecision(s, 'batteryHeat', ctx);
  delete s.sim.events.fired.engineFreeze;
  s.sim.eva.outside = true;
  s.sim.eva.noReturn = true;
  s.sim.eva.cardShown = false;
  assert.equal(checkEvents(s, ctx), 'noReturn');
});

test('unknown choice throws instead of silently doing nothing', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  assert.throws(() => resolveDecision(s, 'nope', ctx));
});
