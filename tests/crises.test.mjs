// K2 tests for the scheduled crises in src/systems/events.js: dust storm (with and without MEDA),
// dust devil and solar conjunction. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step, advanceHours } from '../src/systems/survival.js';
import { checkEvents, resolveDecision, commsBlackout } from '../src/systems/events.js';
import { isOn, isHeld } from '../src/systems/power.js';
import { data as baseData, eng, fakeBus, newState } from './helpers/k2_env.mjs';

// These tests check the crisis mechanics, so they run a generous design (double panel area, a
// milder storm) that lives through every crisis.
// BALANCE ISSUE for K1 (D-009), found here: with the 12 kW habitat (life support, cannot be shed),
// 250 m2 of panels and b300 + thick insulation, the day leaves only about 25 % over the night's
// need. Any lasting dust above about 25 % drains the battery a little every sol and the crew
// freezes a few sols later (thermal.cabinMinC 18 C is reached about 1 h after power is lost);
// an 80 % storm kills on its first night whatever the player chooses, which defeats the card.
const data = structuredClone(baseData);
data.events.storm.dustLoss.value = 0.3;
for (const row of data.powerSources) if (row.panelAreaM2?.value) row.panelAreaM2.value *= 2;

const storm = data.events.storm;
const stormStart = storm.sol.value + storm.atSolFraction.value;
const stormEnd = stormStart + storm.durationSols.value;
const solHours = data.mars.solHours.value;
const T = (s) => s.time.sol + s.time.solFraction;

function setup(design = {}) {
  const bus = fakeBus();
  // A design that survives the nights, so the test is about the crises.
  const s = newState({ batteryId: 'b300', insulationId: 'thick', ...design }, data);
  return { s, bus, ctx: { data, eng, bus } };
}

/**
 * Run until game time `untilT`. Cards: answered with `choose(card)` (an option id, or null to stop
 * at the first card). Small steps in game hours, so the test does not depend on the real-time rate.
 */
function runTo(s, ctx, untilT, choose = () => null) {
  for (let i = 0; i < 20000 && T(s) < untilT && !s.life.loss; i++) {
    if (s.events.pending) {
      const id = choose(s.events.pending);
      if (!id) return s.events.pending;
      resolveDecision(s, id, ctx);
      continue;
    }
    advanceHours(s, 0.25, ctx);
    checkEvents(s, ctx);
  }
  return s.events.pending;
}

const firstAvailable = (pending) => pending.card.options.find((o) => !o.disabled).id;

test('without MEDA the storm arrives unannounced: the card opens at its start', () => {
  const { s, bus, ctx } = setup({ instrumentIds: ['plantChamber'] });
  const card = runTo(s, ctx, stormEnd);
  assert.equal(card.eventId, 'storm');
  assert.ok(T(s) >= stormStart && T(s) < stormStart + 0.02, 'card should open right at the start');
  assert.equal(s.power.dust, storm.dustLoss.value);
  assert.ok(bus.emitted.some((e) => e.name === 'storm' && e.payload.intensity === storm.dustLoss.value));
  // Only installed loads can be switched off; "keep everything on" is always there.
  const opts = Object.fromEntries(card.card.options.map((o) => [o.id, o]));
  assert.equal(opts.holdGreenhouse.disabled, false);
  assert.equal(opts.holdMoxie.disabled, true);
  assert.equal(opts.keepAll.disabled, undefined);
  assert.ok(opts.holdGreenhouse.effects[0].estimate.savedW > 0, 'the saving is shown before choosing');
});

test('the storm cuts panel output by its dust share', () => {
  const { s, ctx } = setup();
  s.time.sol = storm.sol.value;
  s.time.solFraction = 0.5; // noon
  step(s, 0.001, ctx);
  const clear = s.power.generationW;
  s.power.dust = storm.dustLoss.value;
  step(s, 0.001, ctx);
  assert.ok(Math.abs(s.power.generationW - clear * (1 - storm.dustLoss.value)) < clear * 0.01);
});

test('a load switched off for the storm stays off until the storm ends, then comes back', () => {
  const { s, ctx } = setup({ instrumentIds: ['plantChamber'] });
  runTo(s, ctx, stormStart + 0.05, (p) => (p.eventId === 'storm' ? 'holdGreenhouse' : firstAvailable(p)));
  // Mid-storm the battery is far above the restore line, yet the greenhouse stays off.
  runTo(s, ctx, stormStart + (stormEnd - stormStart) / 2, firstAvailable);
  assert.ok(s.power.batteryWh > data.rules.powerRestoreFraction.value * s.power.batteryCapacityWh);
  assert.equal(isHeld(s, 'greenhouse'), true);
  assert.equal(isOn(s, 'greenhouse'), false);
  runTo(s, ctx, stormEnd + 0.05, firstAvailable);
  assert.equal(isHeld(s, 'greenhouse'), false);
  assert.equal(isOn(s, 'greenhouse'), true, 'greenhouse did not come back after the storm');
});

test('after the storm some dust stays on the panels', () => {
  const { s, bus, ctx } = setup();
  runTo(s, ctx, stormEnd + 0.05, firstAvailable);
  assert.equal(s.power.dust, storm.residualDust.value);
  assert.ok(bus.emitted.some((e) => e.name === 'storm' && e.payload.intensity === 0), 'K4 was not told the storm ended');
  assert.ok(s.decisionLog.some((d) => d.eventId === 'stormEnd'));
});

test('with MEDA the storm is announced a sol early, and the storm itself needs no second card', () => {
  const { s, ctx } = setup({ instrumentIds: ['meda', 'plantChamber'] });
  const warning = runTo(s, ctx, stormEnd);
  assert.equal(warning.eventId, 'stormWarning');
  assert.ok(stormStart - T(s) <= storm.warnSols.value + 1e-9 && stormStart - T(s) > 0.5, 'warning should come about a sol early');
  resolveDecision(s, 'holdGreenhouse', ctx);
  const next = runTo(s, ctx, stormEnd);
  assert.equal(next, null, 'a second card opened for an announced storm');
  assert.ok(s.decisionLog.some((d) => d.eventId === 'storm' && d.choice === null), 'the storm should still be logged');
});

test('switching a load off early saves battery for the storm (MEDA pays off)', () => {
  const warned = setup({ instrumentIds: ['meda', 'plantChamber'] });
  runTo(warned.s, warned.ctx, stormStart, (p) => (p.eventId === 'stormWarning' ? 'holdGreenhouse' : firstAvailable(p)));
  const ignored = setup({ instrumentIds: ['meda', 'plantChamber'] });
  runTo(ignored.s, ignored.ctx, stormStart, (p) => (p.eventId === 'stormWarning' ? 'keepAll' : firstAvailable(p)));
  assert.ok(warned.s.power.batteryWh >= ignored.s.power.batteryWh);
});

test('a dust devil cleans the panels after the storm, not before', () => {
  const dd = data.events.dustDevil;
  const { s, ctx } = setup();
  runTo(s, ctx, dd.sol.value + dd.atSolFraction.value - 0.01, firstAvailable);
  assert.equal(s.power.dust, storm.residualDust.value, 'cleaned too early');
  runTo(s, ctx, dd.sol.value + dd.atSolFraction.value + 0.01, firstAvailable);
  assert.equal(s.power.dust, 0);
  const entry = s.decisionLog.find((d) => d.eventId === 'dustDevil');
  assert.equal(entry.effects[0].dust, -storm.residualDust.value);
});

test('solar conjunction: no data reaches Earth for its duration, then the budget returns', () => {
  const c = data.events.conjunction;
  const start = c.sol.value + c.atSolFraction.value;
  const { s, ctx } = setup();
  const perSol = s.dataBudget.perSol;
  runTo(s, ctx, start + 0.1, firstAvailable);
  assert.equal(commsBlackout(s), true);
  assert.equal(s.dataBudget.perSol, 0);
  runTo(s, ctx, start + c.durationSols.value + 0.05, firstAvailable);
  assert.equal(commsBlackout(s), false);
  assert.equal(s.dataBudget.perSol, perSol);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'conjunction'));
  assert.ok(s.decisionLog.some((d) => d.eventId === 'conjunctionEnd'));
});

test('a crisis with no schedule in the data yet never fires and does not stop the game', () => {
  const noCrises = structuredClone(data);
  delete noCrises.events.storm;
  delete noCrises.events.dustDevil;
  delete noCrises.events.conjunction;
  const s = newState({ batteryId: 'b300', insulationId: 'thick', instrumentIds: ['meda'] }, noCrises);
  const ctx = { data: noCrises, eng, bus: fakeBus() };
  runTo(s, ctx, 12, firstAvailable);
  assert.equal(s.time.sol >= 12, true);
  const ids = new Set(s.decisionLog.map((d) => d.eventId));
  for (const id of ['stormWarning', 'storm', 'dustDevil', 'conjunction']) assert.equal(ids.has(id), false, id);
});

test('over a run every scheduled crisis shows up in the decision log (report card timeline)', () => {
  const { s, ctx } = setup({ instrumentIds: ['meda'] });
  runTo(s, ctx, data.rules.totalSols.value - 1, firstAvailable);
  assert.equal(s.life.loss, null, `died: ${s.life.loss?.reasonKey}`);
  const ids = new Set(s.decisionLog.map((d) => d.eventId));
  for (const id of ['stormWarning', 'storm', 'stormEnd', 'dustDevil', 'conjunction', 'conjunctionEnd']) {
    assert.ok(ids.has(id), `${id} missing from the log`);
  }
  // Rough check that game time was really spent (and the loop did not stall).
  assert.ok(s.time.sol >= data.rules.totalSols.value - 1, `stopped at sol ${s.time.sol}`);
  assert.ok(solHours > 0);
});
