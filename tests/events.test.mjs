// K2 tests for src/systems/events.js. Run with: node --test "tests/**/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, val } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

/** Step the simulation (0.5 s at a time) until the engine-freeze card opens. */
function runUntilCard(state, ctx, maxSteps = 1000) {
  for (let i = 0; i < maxSteps; i++) {
    step(state, 0.5, ctx);
    if (checkEvents(state, ctx)) return true;
  }
  return false;
}

test('engine-freeze card opens on a cold night, not in the day', () => {
  const bus = fakeBus();
  const ctx = { data, eng, bus };
  const s = newState();
  assert.ok(runUntilCard(s, ctx), 'card never opened');
  assert.equal(eng.sunCos(s.time.solFraction), 0, 'should be night');
  assert.ok(s.env.outsideC <= val(data.events.engineFreeze.triggerBelowC));

  const open = bus.emitted.find((e) => e.name === 'decision:open');
  assert.equal(open.payload.eventId, 'engineFreeze');
  assert.equal(open.payload.options.length, 3);
  assert.equal(typeof open.payload.choose, 'function');
});

test('every option shows its numeric costs before the choice', () => {
  const ctx = { data, eng, bus: fakeBus() };
  const s = newState();
  runUntilCard(s, ctx);
  for (const option of s.events.pending.card.options) {
    const numeric = option.effects.filter((e) => e.type === 'resource' || e.type === 'wait');
    assert.ok(numeric.length > 0, `${option.id} has no visible cost`);
  }
});

test('battery heating costs battery, cuts greenhouse heat and is logged', () => {
  const bus = fakeBus();
  const ctx = { data, eng, bus };
  const s = newState();
  runUntilCard(s, ctx);
  const before = s.power.batteryWh;

  const entry = resolveDecision(s, 'batteryHeat', ctx);

  assert.ok(Math.abs(before - s.power.batteryWh - val(data.events.engineFreeze.batteryHeatWh)) < 1e-6);
  assert.equal(s.events.flags.greenhouseHeatingCut, true);
  assert.equal(s.events.flags.engineFrozen, false);
  assert.equal(s.events.pending, null);
  assert.deepEqual(s.decisionLog, [entry]);
  assert.equal(entry.eventId, 'engineFreeze');
  assert.equal(entry.choice, 'batteryHeat');
  assert.ok(bus.emitted.some((e) => e.name === 'decision:made'));
});

test('manual heating costs O2 and radiation', () => {
  const ctx = { data, eng, bus: fakeBus() };
  const s = newState();
  runUntilCard(s, ctx);
  const o2 = s.life.o2Kg;
  resolveDecision(s, 'manualHeat', ctx);
  const cfg = data.events.engineFreeze;
  assert.ok(Math.abs(o2 - s.life.o2Kg - val(cfg.manualO2Kg)) < 1e-6);
  assert.equal(s.life.radiationMSv, val(cfg.manualRadiationMSv));
});

test('waiting moves the clock forward one sol and uses a sol of O2', () => {
  const ctx = { data, eng, bus: fakeBus() };
  const s = newState();
  runUntilCard(s, ctx);
  const sol = s.time.sol;
  const o2 = s.life.o2Kg;
  resolveDecision(s, 'wait', ctx);
  assert.equal(s.time.sol, sol + 1);
  const perSol = val(data.life.o2KgPerCrewPerSol) * val(data.life.crew);
  assert.ok(Math.abs(o2 - s.life.o2Kg - perSol) < 1e-3);
});

test('the choose callback in the card payload resolves the decision', () => {
  const bus = fakeBus();
  const ctx = { data, eng, bus };
  const s = newState();
  runUntilCard(s, ctx);
  const open = bus.emitted.find((e) => e.name === 'decision:open');
  open.payload.choose('manualHeat');
  assert.equal(s.decisionLog.at(-1).choice, 'manualHeat');
});

test('no new card opens while one is pending, and a once-event fires only once', () => {
  const ctx = { data, eng, bus: fakeBus() };
  const s = newState();
  runUntilCard(s, ctx);
  assert.equal(checkEvents(s, ctx), null, 'second card opened while one was pending');
  resolveDecision(s, 'batteryHeat', ctx);
  assert.equal(runUntilCard(s, ctx, 500), false, 'engineFreeze fired twice');
});

test('unknown choice throws instead of silently doing nothing', () => {
  const ctx = { data, eng, bus: fakeBus() };
  const s = newState();
  runUntilCard(s, ctx);
  assert.throws(() => resolveDecision(s, 'nope', ctx));
});
