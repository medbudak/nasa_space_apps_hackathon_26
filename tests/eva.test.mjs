// K2 tests for the EVA / point-of-no-return part of survival.js and its card (M4).
// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endEva, setEvaPosition, startEva, step, val } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const o2PerHour = val(data.eva.oxygenPerHour_kg);
const safety = val(data.eva.noReturnSafetyFactor);
const walk = val(data.eva.walkSpeed_ms);
const freeze = val(data.eva.jointFreezeSpeedFactor);
const TINY = 0.001; // real seconds: enough to refresh the EVA numbers without moving the clock much

function setup() {
  const bus = fakeBus();
  const s = newState();
  // These tests run on cold nights; keep the engine-freeze card out of the way.
  s.sim.events.fired.engineFreeze = { sol: 0, timeOfSol: 0 };
  return { s, bus, ctx: { data, eng, bus } };
}

/** Put the run at local midday (warm) or pre-dawn (coldest) and refresh. */
function at(s, ctx, timeOfSol) {
  s.timeOfSol = timeOfSol;
  step(s, TINY, ctx);
}
const NOON = 0.5;
const PRE_DAWN = 0.1;

/** Expected O2 to walk back, with the safety factor. */
function need(distanceM, speedFactor = 1) {
  return (distanceM / (walk * speedFactor)) * (o2PerHour / 3600) * safety;
}

test('the notch is zero at the airlock and grows with distance', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  step(s, TINY, ctx);
  assert.equal(s.sim.eva.requiredO2Kg, 0);
  setEvaPosition(s, { distanceM: 900 });
  step(s, TINY, ctx);
  assert.ok(Math.abs(s.sim.eva.requiredO2Kg - need(900)) < 1e-9);
});

test('outside, the suit supplies O2 and the habitat tank is not used', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  const habitat = s.resources.oxygen_kg;
  const suit = s.sim.eva.suitO2Kg;
  step(s, 1, ctx); // 1 real second
  const hours = (1 / val(data.tuning.solDuration)) * val(data.mars.solLength);
  assert.equal(s.resources.oxygen_kg, habitat);
  assert.ok(Math.abs(suit - s.sim.eva.suitO2Kg - o2PerHour * hours) < 1e-9);
  endEva(s);
  step(s, 1, ctx);
  assert.ok(s.resources.oxygen_kg < habitat, 'back inside the habitat tank is used again');
});

test('deep cold freezes the joints: speed drops and the notch moves up', () => {
  const { s, ctx } = setup();
  at(s, ctx, NOON);
  startEva(s, data);
  setEvaPosition(s, { distanceM: 900 });
  step(s, TINY, ctx);
  assert.equal(s.sim.eva.jointsFrozen, false);
  at(s, ctx, PRE_DAWN);
  assert.ok(s.sim.outside_C <= val(data.eva.jointFreezeBelow_C));
  assert.equal(s.sim.eva.jointsFrozen, true);
  assert.equal(s.sim.eva.speedFactor, freeze);
  assert.ok(Math.abs(s.sim.eva.requiredO2Kg - need(900, freeze)) < 1e-9);
});

/** Frozen, far out, with suit O2 just below the notch: the card should open. */
function frozenFarOut(s, ctx, { suitFractionOfNeed, nearWreck = false }) {
  at(s, ctx, NOON);
  startEva(s, data);
  setEvaPosition(s, { distanceM: 900, nearWreck });
  at(s, ctx, PRE_DAWN);
  s.sim.eva.suitO2Kg = s.sim.eva.requiredO2Kg * suitFractionOfNeed;
  step(s, TINY, ctx);
}

test('the no-return card opens once when suit O2 drops below the notch', () => {
  const { s, bus, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  assert.equal(s.sim.eva.noReturn, true);
  assert.equal(checkEvents(s, ctx), 'noReturn');
  const open = bus.emitted.find((e) => e.name === 'decision:open');
  assert.equal(open.payload.vars.distanceM, 900);
  assert.equal(open.payload.vars.speedPct, Math.round(freeze * 100));
  resolveDecision(s, 'suitHeater', ctx);
  // Still in trouble or not, the card does not come back during the same EVA.
  s.sim.eva.suitO2Kg = 0.0001;
  step(s, TINY, ctx);
  assert.equal(checkEvents(s, ctx), null);
});

test('slow walk is allowed only when O2 covers the walk without the safety margin', () => {
  // Between the bare need and the need with margin: risky but possible.
  const a = setup();
  frozenFarOut(a.s, a.ctx, { suitFractionOfNeed: 0.9 }); // 0.9 > 1/1.2
  checkEvents(a.s, a.ctx);
  const slowA = a.s.sim.events.pending.card.options.find((o) => o.id === 'slowWalk');
  assert.equal(slowA.disabled, false);

  // Below the bare need: walking back is impossible.
  const b = setup();
  frozenFarOut(b.s, b.ctx, { suitFractionOfNeed: 0.5 });
  checkEvents(b.s, b.ctx);
  const slowB = b.s.sim.events.pending.card.options.find((o) => o.id === 'slowWalk');
  assert.equal(slowB.disabled, true);
  assert.throws(() => resolveDecision(b.s, 'slowWalk', b.ctx));
});

test('suit heater restores speed, costs habitat energy, and the joints stay thawed', () => {
  const { s, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  checkEvents(s, ctx);
  const energy = s.resources.energy_kWh;
  resolveDecision(s, 'suitHeater', ctx);
  assert.equal(s.sim.eva.speedFactor, 1);
  assert.ok(energy - s.resources.energy_kWh >= val(data.events.noReturn.suitHeater_kWh) - 1e-9);
  step(s, TINY, ctx); // still pre-dawn cold
  assert.equal(s.sim.eva.jointsFrozen, false, 'joints refroze right after thawing');
  assert.ok(Math.abs(s.sim.eva.requiredO2Kg - need(900)) < 1e-9);
});

test('sheltering at a wreck needs a wreck nearby, and costs suit O2 while waiting', () => {
  const far = setup();
  frozenFarOut(far.s, far.ctx, { suitFractionOfNeed: 0.9, nearWreck: false });
  checkEvents(far.s, far.ctx);
  assert.equal(far.s.sim.events.pending.card.options.find((o) => o.id === 'shelterWreck').disabled, true);

  const near = setup();
  frozenFarOut(near.s, near.ctx, { suitFractionOfNeed: 0.9, nearWreck: true });
  checkEvents(near.s, near.ctx);
  const suit = near.s.sim.eva.suitO2Kg;
  resolveDecision(near.s, 'shelterWreck', near.ctx);
  const hours = val(data.events.noReturn.shelterHours);
  // The wait may hit an empty suit before the hour is over (that is the risk of this option).
  assert.ok(Math.abs((suit - near.s.sim.eva.suitO2Kg) - Math.min(suit, o2PerHour * hours)) < 1e-3);
  assert.equal(near.s.sim.eva.speedFactor, 1);
  assert.equal(near.s.sim.eva.thawed, true);
});

test('a new EVA resets the card and the thaw', () => {
  const { s, ctx } = setup();
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  checkEvents(s, ctx);
  resolveDecision(s, 'suitHeater', ctx);
  endEva(s);
  frozenFarOut(s, ctx, { suitFractionOfNeed: 0.9 });
  assert.equal(s.sim.eva.thawed, false);
  assert.equal(checkEvents(s, ctx), 'noReturn');
});
