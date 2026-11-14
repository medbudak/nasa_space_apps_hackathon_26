// K2 tests for src/systems/events.js (M2 decision cards). Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, isNight } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { data, eng, fakeBus, jumpTo, newState } from './helpers/k2_env.mjs';

const cfg = data.events.engineFreeze;

function setup() {
  const bus = fakeBus();
  const s = newState();
  // The engine freezes on the departure morning (events.engineFreeze.earliestSol), so start there.
  jumpTo(s, cfg.earliestSol.value);
  return { s, bus, ctx: { data, eng, bus } };
}

/** Step the simulation (0.5 s at a time) until a card opens. */
function runUntilCard(state, ctx, maxSteps = 1000) {
  for (let i = 0; i < maxSteps && !state.life.loss; i++) {
    step(state, 0.5, ctx);
    if (checkEvents(state, ctx)) return true;
  }
  return false;
}

test('engine-freeze card opens on a cold night, not in the day', () => {
  const { s, bus, ctx } = setup();
  assert.ok(runUntilCard(s, ctx), 'card never opened');
  assert.ok(isNight(s, ctx), 'should be night');
  assert.ok(s.env.outsideC <= cfg.triggerBelowC.value);

  const open = bus.emitted.find((e) => e.name === 'decision:open');
  assert.equal(open.payload.eventId, 'engineFreeze');
  assert.equal(open.payload.sol, s.time.sol);
  assert.deepEqual(open.payload.options.map((o) => o.id), ['batteryHeat', 'manualHeat', 'wait', 'askEarth']);
  assert.equal(typeof open.payload.choose, 'function');
});

test('every option shows its numeric costs before the choice', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  for (const option of s.events.pending.card.options) {
    const numeric = option.effects.filter((e) => e.type === 'resource' || e.type === 'wait');
    assert.ok(numeric.length > 0, `${option.id} has no visible cost`);
  }
});

test('resource effects use the names K3\'s card knows (batteryWh, o2Kg, radiationMSv)', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  const stats = s.events.pending.card.options
    .flatMap((o) => o.effects).filter((e) => e.type === 'resource').map((e) => e.stat);
  for (const stat of stats) assert.ok(['batteryWh', 'o2Kg', 'radiationMSv'].includes(stat), stat);
});

test('battery heating costs energy, cuts greenhouse heat and is logged', () => {
  const { s, bus, ctx } = setup();
  runUntilCard(s, ctx);
  const before = s.power.batteryWh;

  const entry = resolveDecision(s, 'batteryHeat', ctx);

  assert.ok(Math.abs(before - s.power.batteryWh - cfg.batteryHeatKWh.value * 1000) < 1e-6);
  assert.equal(s.events.flags.greenhouseHeatingCut, true);
  assert.equal(s.events.flags.engineFrozen, false);
  assert.equal(s.events.pending, null);
  assert.deepEqual(s.decisionLog, [entry]);
  assert.equal(entry.eventId, 'engineFreeze');
  assert.equal(entry.choice, 'batteryHeat');
  assert.ok(bus.emitted.some((e) => e.name === 'decision:made'));
});

test('manual heating costs O2 and radiation', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  const o2 = s.life.o2Kg;
  const dose = s.life.radiationMSv;
  resolveDecision(s, 'manualHeat', ctx);
  assert.ok(Math.abs(o2 - s.life.o2Kg - cfg.manualO2Kg.value) < 1e-9);
  assert.ok(Math.abs(s.life.radiationMSv - dose - cfg.manualRadiationMSv.value) < 1e-9);
});

test('waiting moves the clock forward one sol and uses that much O2', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  const sol = s.time.sol;
  const o2 = s.life.o2Kg;
  const estimate = s.events.pending.card.options.find((o) => o.id === 'wait').effects[0].estimate.o2Kg;
  resolveDecision(s, 'wait', ctx);
  assert.equal(s.time.sol, sol + 1);
  assert.ok(Math.abs(o2 - s.life.o2Kg + estimate) < 0.01, 'card estimate and real use differ');
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

test('a life-threatening EVA card wins over the engine card when both trigger', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  resolveDecision(s, 'batteryHeat', ctx);
  delete s.events.fired.engineFreeze;
  Object.assign(s.life.eva, { outside: true, noReturn: true, cardShown: false });
  assert.equal(checkEvents(s, ctx), 'noReturn');
});

test('battery from an effect never goes below zero', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  s.power.batteryWh = 1;
  resolveDecision(s, 'batteryHeat', ctx);
  assert.equal(s.power.batteryWh, 0);
});

test('unknown choice throws instead of silently doing nothing', () => {
  const { s, ctx } = setup();
  runUntilCard(s, ctx);
  assert.throws(() => resolveDecision(s, 'nope', ctx));
});
