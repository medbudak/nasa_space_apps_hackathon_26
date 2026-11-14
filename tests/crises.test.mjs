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
 * Run until game time `untilT`, the way surface.js does: time stands still while a card or a
 * mini-game is open. Cards are answered with `choose(card)` (an option id, or null to stop at
 * the first card); mini-games with `minigame`. Small steps in game hours, so the test does not
 * depend on the real-time rate.
 */
function runTo(s, ctx, untilT, choose = () => null, minigame = { success: true, score: 100 }) {
  for (let i = 0; i < 20000 && T(s) < untilT && !s.life.loss; i++) {
    if (s.events.pending) {
      const id = choose(s.events.pending);
      if (!id) return s.events.pending;
      resolveDecision(s, id, ctx);
      continue;
    }
    if (s.events.minigame) {
      const open = ctx.bus.emitted.findLast((e) => e.name === 'minigame:open');
      open.payload.onDone(minigame);
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

// ---- solar particle event (RAD) -------------------------------------------------------------

const spe = data.events.spe;
const speStartT = spe.sol.value + spe.atSolFraction.value;
const speLen = spe.durationHours.value / solHours;

/** Extra dose from the SPE only: total dose minus the normal surface dose over the same time. */
function speDose(s, ctx, untilT, choose) {
  const before = s.life.radiationMSv;
  const t0 = T(s);
  runTo(s, ctx, untilT, choose);
  const normal = (data.radiation.surfaceMSvPerDay.value * (T(s) - t0) * solHours) / 24;
  return s.life.radiationMSv - before - normal;
}

test('SPE with RAD: a warning before it, and the shelter halves the extra dose', () => {
  const { s, ctx } = setup({ instrumentIds: ['rad'] });
  const card = runTo(s, ctx, speStartT, (p) => (p.eventId === 'speWarning' ? null : firstAvailable(p)));
  assert.equal(card.eventId, 'speWarning');
  assert.ok(T(s) < speStartT, 'the warning should come before the event');
  resolveDecision(s, 'shelter', ctx);
  const dose = speDose(s, ctx, speStartT + speLen + 0.02, firstAvailable);
  const expected = spe.extraMSvPerHour.value * spe.durationHours.value * spe.shelterFactor.value;
  assert.ok(Math.abs(dose - expected) < expected * 0.1, `dose ${dose}, expected about ${expected}`);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'spe' && d.choice === null), 'the event itself is logged');
  assert.ok(s.decisionLog.some((d) => d.eventId === 'speEnd'));
});

test('SPE without RAD: the first hours of dose are taken before the crew even knows', () => {
  const { s, ctx } = setup();
  runTo(s, ctx, speStartT - 0.01, firstAvailable);
  const before = s.life.radiationMSv;
  const card = runTo(s, ctx, speStartT + speLen);
  assert.equal(card.eventId, 'spe');
  const unnoticed = spe.extraMSvPerHour.value * spe.unnoticedHours.value;
  assert.ok(s.life.radiationMSv - before >= unnoticed - 1e-9, 'the unnoticed dose was not applied');
  assert.equal(card.card.vars.takenMSv, Math.round(unnoticed * 100) / 100);
});

test('SPE: keeping on working takes the full extra dose', () => {
  const sheltered = setup({ instrumentIds: ['rad'] });
  const working = setup({ instrumentIds: ['rad'] });
  const a = speDose(sheltered.s, sheltered.ctx, speStartT + speLen + 0.02, (p) => (p.eventId === 'speWarning' ? 'shelter' : firstAvailable(p)));
  const b = speDose(working.s, working.ctx, speStartT + speLen + 0.02, (p) => (p.eventId === 'speWarning' ? 'keepWorking' : firstAvailable(p)));
  assert.ok(b > a * 1.5, `working ${b} vs sheltered ${a}`);
});

// ---- quake (SEIS) -------------------------------------------------------------------------

const quake = data.events.quake;
const quakeT = quake.sol.value + quake.atSolFraction.value;

test('quake without SEIS: no warning, the shake and the catch mini-game in Mars gravity', () => {
  const { s, bus, ctx } = setup();
  runTo(s, ctx, quakeT - 0.01, firstAvailable);
  for (let i = 0; i < 400 && !s.events.minigame; i++) {
    advanceHours(s, 0.05, ctx);
    checkEvents(s, ctx);
  }
  assert.ok(s.events.minigame, 'no mini-game opened');
  assert.ok(!s.decisionLog.some((d) => d.eventId === 'quakeWarning'));
  assert.ok(bus.emitted.some((e) => e.name === 'quake' && e.payload.duration === quake.shakeSeconds.value), 'K4 got no shake');
  const cfg = bus.emitted.findLast((e) => e.name === 'minigame:open').payload;
  assert.equal(cfg.template, 'qte');
  assert.equal(cfg.config.mode, 'catch');
  const marsFall = Math.sqrt((2 * quake.shelfHeightM.value) / data.mars.gravity.value);
  assert.ok(Math.abs(cfg.config.eventSeconds - marsFall) < 1e-9);
  assert.ok(cfg.config.eventSeconds > cfg.config.compareSeconds, 'a fall on Mars is slower than on Earth');
  assert.equal(cfg.config.delaysSeconds.length, quake.rounds.value);
});

test('a missed catch breaks equipment; without SEIS it is blamed on the instrument choice', () => {
  const { s, ctx } = setup();
  runTo(s, ctx, quakeT + 0.05, firstAvailable, { success: false, score: 0 });
  const hit = s.score.entries.find((e) => e.reason === 'consequence.quakeDamage');
  assert.equal(hit.category, 'lostSystems');
  assert.equal(hit.cause, 'design.instrumentIds');
  assert.equal(hit.points, data.rules.quakeDamagePoints.value);
});

test('a caught tool costs nothing', () => {
  const { s, ctx } = setup();
  runTo(s, ctx, quakeT + 0.05, firstAvailable, { success: true, score: 100 });
  assert.ok(!s.score.entries.some((e) => e.reason === 'consequence.quakeDamage'));
  assert.ok(s.decisionLog.some((d) => d.eventId === 'quake'));
});

test('quake with SEIS: strapping the shelves down in time means no mini-game and no damage', () => {
  const { s, bus, ctx } = setup({ instrumentIds: ['seis'] });
  const card = runTo(s, ctx, quakeT + 0.05, (p) => (p.eventId === 'quakeWarning' ? null : firstAvailable(p)));
  assert.equal(card.eventId, 'quakeWarning');
  resolveDecision(s, 'secure', ctx);
  runTo(s, ctx, quakeT + 0.05, firstAvailable, { success: false, score: 0 });
  assert.ok(!bus.emitted.some((e) => e.name === 'minigame:open'));
  assert.ok(!s.score.entries.some((e) => e.reason === 'consequence.quakeDamage'));
});

test('quake with SEIS ignored: the mini-game comes, and a miss is blamed on that choice', () => {
  const { s, ctx } = setup({ instrumentIds: ['seis'] });
  runTo(s, ctx, quakeT + 0.05, (p) => (p.eventId === 'quakeWarning' ? 'ignore' : firstAvailable(p)), { success: false, score: 0 });
  assert.equal(s.score.entries.find((e) => e.reason === 'consequence.quakeDamage').cause, 'decision.quakeWarning');
});

test('a crisis mini-game open at a reload counts as not done, so the run does not hang', async () => {
  const { reopenPending } = await import('../src/systems/events.js');
  const { s, ctx } = setup();
  runTo(s, ctx, quakeT - 0.01, firstAvailable);
  for (let i = 0; i < 400 && !s.events.minigame; i++) {
    advanceHours(s, 0.05, ctx);
    checkEvents(s, ctx);
  }
  const reloaded = JSON.parse(JSON.stringify(s)); // as after a save and a page reload
  reopenPending(reloaded, { data, eng, bus: fakeBus() });
  assert.equal(reloaded.events.minigame, null);
  assert.ok(reloaded.score.entries.some((e) => e.reason === 'consequence.quakeDamage'));
});

// ---- radiator failure -----------------------------------------------------------------------

const radiator = data.events.radiator;
const radiatorT = radiator.sol.value + radiator.atSolFraction.value;

test('radiator: cleaning it costs EVA O2 and time', () => {
  const { s, ctx } = setup();
  const card = runTo(s, ctx, radiatorT + 0.05, (p) => (p.eventId === 'radiator' ? null : firstAvailable(p)));
  assert.equal(card.eventId, 'radiator');
  const o2 = s.life.o2Kg;
  const t0 = T(s);
  resolveDecision(s, 'cleanRadiator', ctx);
  const hours = radiator.cleanEvaHours.value;
  assert.ok(Math.abs((T(s) - t0) * solHours - hours) < 0.01);
  const evaO2 = data.life.evaO2KgPerHour.value * hours;
  assert.ok(o2 - s.life.o2Kg >= evaO2 - 1e-6, 'the EVA O2 was not charged');
});

test('radiator: running with less heat keeps MOXIE and the experiments off to the end', () => {
  const { s, ctx } = setup({ instrumentIds: ['moxie', 'meda'] });
  runTo(s, ctx, radiatorT + 0.05, (p) => (p.eventId === 'radiator' ? 'reduceLoad' : firstAvailable(p)));
  runTo(s, ctx, data.rules.totalSols.value + 0.9, firstAvailable);
  assert.equal(isHeld(s, 'moxie'), true);
  assert.equal(isHeld(s, 'experiments'), true);
});

test('over a run every scheduled crisis shows up in the decision log (report card timeline)', () => {
  const { s, ctx } = setup({ instrumentIds: ['meda', 'rad', 'seis'] });
  runTo(s, ctx, data.rules.totalSols.value - 1, firstAvailable);
  assert.equal(s.life.loss, null, `died: ${s.life.loss?.reasonKey}`);
  const ids = new Set(s.decisionLog.map((d) => d.eventId));
  for (const id of [
    'stormWarning', 'storm', 'stormEnd', 'speWarning', 'spe', 'speEnd', 'dustDevil',
    'conjunction', 'conjunctionEnd', 'quakeWarning', 'quake', 'radiator',
  ]) {
    assert.ok(ids.has(id), `${id} missing from the log`);
  }
  // Rough check that game time was really spent (and the loop did not stall).
  assert.ok(s.time.sol >= data.rules.totalSols.value - 1, `stopped at sol ${s.time.sol}`);
  assert.ok(solHours > 0);
});
