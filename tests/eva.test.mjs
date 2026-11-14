// K2 tests for the EVA / point-of-no-return part of survival.js and its card (M4).
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceHours, endEva, gameSecondsPerRealSecond, setEvaPosition, spendTime, startEva, step,
} from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { data, eng, fakeBus, newState, realSeconds } from './helpers/k2_env.mjs';

const o2PerHour = data.life.evaO2KgPerHour.value;
const safety = data.rules.noReturnSafetyFactor.value;
const walk = data.life.walkSpeedMs.value;
const freeze = data.life.jointFreezeSpeedFactor.value;
const TINY = 0.001; // real seconds: refreshes the EVA numbers without moving the clock much
const NOON = 0.5;
const PRE_DAWN = 0.24; // coldest time in K1's surfaceTemp model is sunrise

function setup() {
  const bus = fakeBus();
  const s = newState();
  // These tests run on cold nights; keep the engine-freeze card out of the way.
  s.events.fired.engineFreeze = { sol: 0, solFraction: 0 };
  return { s, bus, ctx: { data, eng, bus } };
}

/** Put the run at a time of sol and refresh. */
function at(s, ctx, solFraction) {
  s.time.solFraction = solFraction;
  step(s, TINY, ctx);
}

/** Expected O2 to walk back, with the safety factor. */
function need(distanceM, speedFactor = 1) {
  return (distanceM / (walk * speedFactor)) * (o2PerHour / 3600) * safety;
}

test('the notch is zero at the airlock and grows with distance', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  step(s, TINY, ctx);
  assert.equal(s.life.eva.requiredO2Kg, 0);
  setEvaPosition(s, { distanceM: 900 });
  step(s, TINY, ctx);
  assert.ok(Math.abs(s.life.eva.requiredO2Kg - need(900)) < 1e-9);
});

test('outside, the suit supplies O2 and the habitat tank is not used', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  const habitat = s.life.o2Kg;
  const suit = s.life.eva.suitO2Kg;
  advanceHours(s, 1, ctx); // one game hour
  assert.equal(s.life.o2Kg, habitat);
  assert.ok(Math.abs(suit - s.life.eva.suitO2Kg - o2PerHour) < 1e-9);
  endEva(s);
  step(s, 1, ctx);
  assert.ok(s.life.o2Kg < habitat, 'back inside the habitat tank is used again');
});

test('D-008: outside, one real second is one game minute; inside, a sol lasts solRealSeconds', () => {
  const { s, ctx } = setup();
  const inside = gameSecondsPerRealSecond(s, data);
  assert.ok(Math.abs(inside - (data.mars.solHours.value * 3600) / data.time.solRealSeconds.value) < 1e-9);
  at(s, ctx, NOON);
  startEva(s, data);
  assert.equal(gameSecondsPerRealSecond(s, data), data.time.evaGameSecondsPerRealSecond.value);
  const f0 = s.time.solFraction;
  step(s, 1, ctx); // one real second outside
  const gameSec = (s.time.solFraction - f0) * data.mars.solHours.value * 3600;
  assert.ok(Math.abs(gameSec - data.time.evaGameSecondsPerRealSecond.value) < 1e-6);
});

test('D-008: work measured in game hours costs the same inside or outside', () => {
  const a = setup();
  at(a.s, a.ctx, NOON);
  const fa = a.s.time.solFraction;
  spendTime(a.s, 2, a.ctx);

  const b = setup();
  at(b.s, b.ctx, NOON);
  startEva(b.s, data);
  const fb = b.s.time.solFraction;
  spendTime(b.s, 2, b.ctx);

  assert.ok(Math.abs((a.s.time.solFraction - fa) - (b.s.time.solFraction - fb)) < 1e-9);
});

test('deep cold freezes the joints: speed drops and the notch moves up', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  setEvaPosition(s, { distanceM: 900 });
  step(s, TINY, ctx);
  assert.equal(s.life.eva.jointsFrozen, false);
  at(s, ctx, PRE_DAWN);
  assert.ok(s.env.outsideC <= data.thermal.actuatorMinC.value);
  assert.equal(s.life.eva.jointsFrozen, true);
  assert.equal(s.life.eva.speedFactor, freeze);
  assert.ok(Math.abs(s.life.eva.requiredO2Kg - need(900, freeze)) < 1e-9);
});

/** Frozen, far out, with suit O2 at a share of the notch. */
function frozenFarOut(s, ctx, { suitFractionOfNeed, nearWreck = false }) {
  at(s, ctx, NOON);
  startEva(s, data);
  setEvaPosition(s, { distanceM: 900, nearWreck });
  at(s, ctx, PRE_DAWN);
  s.life.eva.suitO2Kg = s.life.eva.requiredO2Kg * suitFractionOfNeed;
  step(s, TINY, ctx);
}

test('the no-return card opens once when suit O2 drops below the notch', () => {
  const { s, bus, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  assert.equal(s.life.eva.noReturn, true);
  assert.equal(checkEvents(s, ctx), 'noReturn');
  const open = bus.emitted.find((e) => e.name === 'decision:open');
  assert.equal(open.payload.vars.distanceM, 900);
  assert.equal(open.payload.vars.speedPct, Math.round(freeze * 100));
  resolveDecision(s, 'suitHeater', ctx);
  s.life.eva.suitO2Kg = 0.0001;
  step(s, TINY, ctx);
  assert.notEqual(checkEvents(s, ctx), 'noReturn', 'card came back during the same EVA');
});

test('slow walk is allowed only when O2 covers the walk without the safety margin', () => {
  const a = setup();
  frozenFarOut(a.s, a.ctx, { suitFractionOfNeed: 0.9 }); // 0.9 > 1/1.2: risky but possible
  checkEvents(a.s, a.ctx);
  assert.equal(a.s.events.pending.card.options.find((o) => o.id === 'slowWalk').disabled, false);

  const b = setup();
  frozenFarOut(b.s, b.ctx, { suitFractionOfNeed: 0.5 }); // below the bare need: impossible
  checkEvents(b.s, b.ctx);
  assert.equal(b.s.events.pending.card.options.find((o) => o.id === 'slowWalk').disabled, true);
  assert.throws(() => resolveDecision(b.s, 'slowWalk', b.ctx));
});

test('suit heater restores speed, costs habitat energy, and the joints stay thawed', () => {
  const { s, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  checkEvents(s, ctx);
  const battery = s.power.batteryWh;
  resolveDecision(s, 'suitHeater', ctx);
  assert.equal(s.life.eva.speedFactor, 1);
  assert.ok(Math.abs(battery - s.power.batteryWh - data.events.noReturn.suitHeaterKWh.value * 1000) < 1e-6);
  step(s, TINY, ctx); // still pre-dawn cold
  assert.equal(s.life.eva.jointsFrozen, false, 'joints refroze right after thawing');
  assert.ok(Math.abs(s.life.eva.requiredO2Kg - need(900)) < 1e-9);
});

test('sheltering at a wreck needs a wreck nearby, and costs suit O2 while waiting', () => {
  const far = setup();
  frozenFarOut(far.s, far.ctx, { suitFractionOfNeed: 0.9, nearWreck: false });
  checkEvents(far.s, far.ctx);
  assert.equal(far.s.events.pending.card.options.find((o) => o.id === 'shelterWreck').disabled, true);

  const near = setup();
  frozenFarOut(near.s, near.ctx, { suitFractionOfNeed: 0.9, nearWreck: true });
  near.s.life.eva.suitO2Kg = 0.4; // enough for the hour of shelter
  checkEvents(near.s, near.ctx);
  const suit = near.s.life.eva.suitO2Kg;
  resolveDecision(near.s, 'shelterWreck', near.ctx);
  const hours = data.events.noReturn.shelterHours.value;
  assert.ok(Math.abs((suit - near.s.life.eva.suitO2Kg) - o2PerHour * hours) < 1e-3);
  assert.equal(near.s.life.eva.speedFactor, 1);
  assert.equal(near.s.life.eva.thawed, true);
});

test('the UI only receives options it may choose; the rest are listed as unavailable', () => {
  const { s, bus, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.5, nearWreck: false });
  checkEvents(s, ctx);
  const payload = bus.emitted.find((e) => e.name === 'decision:open').payload;
  assert.deepEqual(payload.options.map((o) => o.id), ['suitHeater']);
  assert.deepEqual(payload.unavailable.map((o) => o.id), ['slowWalk', 'shelterWreck']);
  assert.ok(payload.unavailable.every((o) => o.disabledKey));
});

test('an hours-long wait also says how many sols it is, for display', () => {
  const { s, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9, nearWreck: true });
  checkEvents(s, ctx);
  const wait = s.events.pending.card.options
    .find((o) => o.id === 'shelterWreck').effects.find((e) => e.type === 'wait');
  assert.ok(Math.abs(wait.sols - data.events.noReturn.shelterHours.value / data.mars.solHours.value) < 1e-12);
});

test('a new EVA resets the card and the thaw', () => {
  const { s, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  checkEvents(s, ctx);
  resolveDecision(s, 'suitHeater', ctx);
  endEva(s);
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  assert.equal(s.life.eva.thawed, false);
  assert.equal(checkEvents(s, ctx), 'noReturn');
});
