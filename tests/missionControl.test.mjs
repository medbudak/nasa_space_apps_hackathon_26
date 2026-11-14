// K2 tests for the delayed Mission Control (M7) on crisis cards, in src/systems/events.js.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, startEva, setEvaPosition } from '../src/systems/survival.js';
import { checkEvents, resolveDecision, lightDelaySeconds } from '../src/systems/events.js';
import { data, eng, fakeBus, jumpTo, newState } from './helpers/k2_env.mjs';

const solHours = data.mars.solHours.value;
const T = (s) => s.time.sol + s.time.solFraction;
const oneWay = data.telecom.earthMarsDistanceKm.value / data.constants.speedOfLightKms.value;

function engineCard() {
  const bus = fakeBus();
  const s = newState();
  const ctx = { data, eng, bus };
  jumpTo(s, data.events.engineFreeze.earliestSol.value);
  for (let i = 0; i < 2000 && !s.events.pending; i++) {
    step(s, 0.5, ctx);
    checkEvents(s, ctx);
  }
  return { s, bus, ctx };
}

test('the light delay comes from the distance and the speed of light', () => {
  assert.ok(Math.abs(lightDelaySeconds({ data, eng }) - oneWay) < 1e-9);
  assert.ok(oneWay > 3 * 60 && oneWay < 22 * 60, 'between 3 and 22 minutes, as the design doc says');
  const noDistance = structuredClone(data);
  delete noDistance.telecom.earthMarsDistanceKm;
  assert.equal(lightDelaySeconds({ data: noDistance, eng }), null);
});

test('a crisis card offers to ask Mission Control, with the round trip shown as its cost', () => {
  const { s } = engineCard();
  const ask = s.events.pending.card.options.find((o) => o.id === 'askEarth');
  assert.ok(ask, 'no ask option');
  const wait = ask.effects[0];
  assert.equal(wait.type, 'wait');
  assert.ok(Math.abs(wait.hours - (2 * oneWay) / 3600) < 1e-9);
  assert.equal(wait.estimate.minutes, Math.round((2 * oneWay) / 60));
});

test('asking costs the round trip in game time, then the card comes back with the advice', () => {
  const { s, bus, ctx } = engineCard();
  const t0 = T(s);
  resolveDecision(s, 'askEarth', ctx);
  assert.ok(Math.abs((T(s) - t0) * solHours - (2 * oneWay) / 3600) < 0.01, 'the wait was not the round trip');
  assert.equal(s.events.pending.eventId, 'engineFreeze');
  assert.equal(s.events.pending.asked, true);
  assert.equal(s.events.pending.card.advice.optionId, 'batteryHeat');
  assert.ok(!s.events.pending.card.options.some((o) => o.id === 'askEarth'), 'cannot ask twice');
  const reopened = bus.emitted.filter((e) => e.name === 'decision:open').at(-1).payload;
  assert.equal(reopened.advice.optionId, 'batteryHeat');
  assert.ok(s.decisionLog.some((d) => d.choice === 'askEarth'));
  // The crew still decides: the card is answered as usual.
  resolveDecision(s, 'manualHeat', ctx);
  assert.equal(s.events.pending, null);
});

test('while waiting for Earth the crisis goes on: outside, the suit keeps using O2', () => {
  const bus = fakeBus();
  const s = newState();
  const ctx = { data, eng, bus };
  s.events.fired.engineFreeze = { sol: 0, solFraction: 0 };
  s.time.solFraction = 0.5;
  step(s, 0.001, ctx);
  startEva(s, data);
  setEvaPosition(s, { distanceM: 900 });
  s.time.solFraction = 0.24; // pre-dawn: joints freeze
  step(s, 0.001, ctx);
  s.life.eva.suitO2Kg = s.life.eva.requiredO2Kg * 0.9;
  step(s, 0.001, ctx);
  checkEvents(s, ctx);
  assert.equal(s.events.pending.eventId, 'noReturn');
  const suit = s.life.eva.suitO2Kg;
  resolveDecision(s, 'askEarth', ctx);
  const used = data.life.evaO2KgPerHour.value * ((2 * oneWay) / 3600);
  assert.ok(suit - s.life.eva.suitO2Kg >= Math.min(suit, used) - 1e-6, 'the wait cost no suit O2');
});

test('no asking during a solar conjunction: the signal cannot get through', () => {
  const { s, ctx } = engineCard();
  s.events.pending = null;
  delete s.events.fired.engineFreeze;
  s.events.active.conjunction = { untilT: T(s) + 1, perSol: 0 };
  checkEvents(s, ctx);
  assert.ok(!s.events.pending.card.options.some((o) => o.id === 'askEarth'));
});

test('cards without advice, and runs without the distance, do not offer it', () => {
  const noDistance = structuredClone(data);
  delete noDistance.telecom.earthMarsDistanceKm;
  const bus = fakeBus();
  const s = newState({}, noDistance);
  const ctx = { data: noDistance, eng, bus };
  jumpTo(s, noDistance.events.engineFreeze.earliestSol.value);
  for (let i = 0; i < 2000 && !s.events.pending; i++) {
    step(s, 0.5, ctx);
    checkEvents(s, ctx);
  }
  assert.ok(!s.events.pending.card.options.some((o) => o.id === 'askEarth'));
});

test('storm advice: switch off the installed load that saves the most', () => {
  const bus = fakeBus();
  const s = newState({ instrumentIds: ['plantChamber', 'moxie'] });
  const ctx = { data, eng, bus };
  const st = data.events.storm;
  jumpTo(s, st.sol.value, st.atSolFraction.value - 0.001);
  delete s.events.fired.storm;
  delete s.events.fired.stormWarning;
  for (let i = 0; i < 50 && !s.events.pending; i++) {
    step(s, 0.5, ctx);
    checkEvents(s, ctx);
  }
  assert.equal(s.events.pending.eventId, 'storm');
  resolveDecision(s, 'askEarth', ctx);
  assert.equal(s.events.pending.card.advice.optionId, 'holdMoxie'); // MOXIE 300 W > plant chamber
});
