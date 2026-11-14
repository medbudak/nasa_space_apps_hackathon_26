// K2 tests for src/systems/finale.js (last-sol departure and the outcome) and the score entries.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import {
  antennaConfig, finaleDone, finaleDue, finalePaused, startFinale, updateFinale,
} from '../src/systems/finale.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const lastSol = data.rules.totalSols.value;
const dawn = data.time.startSolFraction.value;

function setup(design = {}) {
  const bus = fakeBus();
  const s = newState(design);
  return { s, bus, ctx: { data, eng, bus } };
}

/** The loop surface.js runs, without the drawing. Answers mini-games with `minigame`. */
function run(s, ctx, { maxSteps = 4000, minigame = { success: true, score: 100 }, card = null } = {}) {
  for (let i = 0; i < maxSteps && !finaleDone(s) && !s.life.loss; i++) {
    if (s.events.pending) {
      if (!card) return 'card';
      resolveDecision(s, card, ctx);
      continue;
    }
    if (!finalePaused(s)) step(s, 0.5, ctx);
    if (finaleDue(s, ctx)) startFinale(s);
    checkEvents(s, ctx);
    updateFinale(s, ctx);
    const open = ctx.bus.emitted.find((e) => e.name === 'minigame:open' && !e.answered);
    if (open) {
      open.answered = true;
      open.payload.onDone(minigame);
    }
  }
  return finaleDone(s) ? 'done' : 'running';
}

/** Put the run on the evening of the sol before departure. */
function eveOfDeparture(s, ctx) {
  s.time.sol = lastSol - 1;
  s.time.solFraction = 0.8;
  step(s, 0.001, ctx);
}

function sendScience(s, reports, experiments) {
  for (let i = 0; i < reports; i++) s.forensics[`w${i}`] = { sent: true };
  for (let i = 0; i < experiments; i++) s.experiments[`e${i}`] = { sent: true };
}

test('the departure sequence starts on the morning of the last sol, not before', () => {
  const { s, ctx } = setup();
  s.time.sol = lastSol - 1;
  s.time.solFraction = 0.9;
  assert.equal(finaleDue(s, ctx), false);
  s.time.sol = lastSol;
  s.time.solFraction = dawn - 0.01;
  assert.equal(finaleDue(s, ctx), false, 'before dawn');
  s.time.solFraction = dawn;
  assert.equal(finaleDue(s, ctx), true);
  startFinale(s);
  assert.equal(finaleDue(s, ctx), false, 'only once');
});

test('the engine card comes the night before; heating it launches the MAV at dawn', () => {
  const { s, ctx } = setup();
  eveOfDeparture(s, ctx);
  assert.equal(run(s, ctx), 'card');
  assert.equal(s.events.pending.eventId, 'engineFreeze');
  assert.equal(s.time.sol, lastSol);
  assert.equal(run(s, ctx, { card: 'batteryHeat' }), 'done');
  assert.equal(s.time.sol, lastSol);
  assert.ok(['hero', 'explorer'].includes(s.outcome));
});

test('outcome: explorer without minimum science, hero with it (D-006 thresholds)', () => {
  const a = setup();
  eveOfDeparture(a.s, a.ctx);
  run(a.s, a.ctx, { card: 'batteryHeat' });
  assert.equal(a.s.outcome, 'explorer');

  const b = setup();
  sendScience(b.s, data.rules.minimumSuccessReports.value, data.rules.minimumSuccessExperiments.value);
  eveOfDeparture(b.s, b.ctx);
  run(b.s, b.ctx, { card: 'batteryHeat' });
  assert.equal(b.s.outcome, 'hero');
});

test('heating needs the energy: with an empty battery the battery option is unavailable', () => {
  const { s, ctx } = setup();
  eveOfDeparture(s, ctx);
  run(s, ctx);
  s.events.pending = null;
  delete s.events.fired.engineFreeze;
  s.power.batteryWh = 0;
  checkEvents(s, ctx);
  const opt = s.events.pending.card.options.find((o) => o.id === 'batteryHeat');
  assert.equal(opt.disabled, true);
});

test('waiting at a warm site: the day heats the engine and the MAV leaves a sol later', () => {
  const { s, ctx } = setup({ siteId: 'meridiani' });
  eveOfDeparture(s, ctx);
  run(s, ctx, { card: 'wait' });
  assert.equal(s.time.sol, lastSol + 1, 'the wait costs a sol');
  assert.ok(['hero', 'explorer'].includes(s.outcome));
  assert.ok(s.env.outsideC >= data.ascent.mavMinOperatingC.value, 'launched while still too cold');
});

test('waiting at a cold site: the day never gets warm enough, the crew stays on Mars', () => {
  const arcadia = data.landingSites.find((r) => r.id === 'arcadia');
  assert.ok(arcadia.dayMaxC.value < data.ascent.mavMinOperatingC.value, 'test needs a site colder than the MAV limit');
  const { s, ctx } = setup({ siteId: 'arcadia', batteryId: 'b300', insulationId: 'thick' });
  eveOfDeparture(s, ctx);
  const result = run(s, ctx, { card: 'wait', maxSteps: 8000 });
  assert.equal(result, 'done', s.life.loss ? `died: ${s.life.loss.reasonKey}` : 'never finished');
  assert.equal(s.outcome, 'colonist');
  const missed = s.score.entries.find((e) => e.reason === 'consequence.missedLaunch');
  assert.equal(missed?.cause, 'design.siteId');
});

test('a spare kit fixes the antenna without the mini-game', () => {
  const { s, bus, ctx } = setup({ spareKitsId: 'k1' });
  s.time.sol = lastSol;
  s.time.solFraction = dawn;
  s.events.flags.mavHeated = true;
  startFinale(s);
  updateFinale(s, ctx);
  assert.equal(bus.emitted.some((e) => e.name === 'minigame:open'), false);
  assert.equal(s.events.finale.antennaOk, true);
  assert.equal(s.events.finale.kitsUsed, 1);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'finaleAntenna' && d.choice === 'spareKit'));
});

test('without a kit the align mini-game opens; failing it costs points but the MAV still flies', () => {
  const { s, bus, ctx } = setup({ spareKitsId: 'k0' });
  s.time.sol = lastSol;
  s.time.solFraction = dawn;
  s.events.flags.mavHeated = true;
  startFinale(s);
  updateFinale(s, ctx);
  assert.equal(finalePaused(s), true, 'the simulation should wait for the mini-game');
  const open = bus.emitted.find((e) => e.name === 'minigame:open');
  assert.equal(open.payload.template, 'align');
  const before = s.score.total;
  open.payload.onDone({ success: false, score: 0 });
  const lost = s.score.entries.find((e) => e.reason === 'consequence.antennaLost');
  assert.equal(lost.category, 'lostSystems');
  assert.equal(lost.cause, 'design.spareKitsId');
  assert.equal(s.score.total, before + data.rules.antennaLostPoints.value);
  updateFinale(s, ctx);
  assert.equal(finaleDone(s), true);
  assert.notEqual(s.outcome, 'colonist');
});

test('the antenna config uses the data and the seeded RNG, and starts away from the target', () => {
  const a = setup();
  const b = setup();
  const ca = antennaConfig(a.s, data);
  const cb = antennaConfig(b.s, data);
  assert.equal(ca.targetDeg, cb.targetDeg, 'same seed, same antenna fault');
  assert.equal(Math.abs(ca.startDeg - ca.targetDeg), 180);
  assert.equal(ca.beamWidthDeg, data.minigames.antennaAlign.beamWidthDeg.value);
});

test('each sol lived through scores survival points, dated to that sol', () => {
  const { s, ctx } = setup();
  for (let i = 0; i < 2 * data.time.solRealSeconds.value * 2; i++) step(s, 0.5, ctx); // two sols
  const survival = s.score.entries.filter((e) => e.reason === 'consequence.solSurvived');
  assert.deepEqual(survival.map((e) => e.sol), [1, 2]);
  assert.ok(survival.every((e) => e.category === 'survival' && e.points === data.rules.survivalPointsPerSol.value));
});

test('a score value missing from the data is skipped, not a crash', () => {
  const { s } = setup();
  const noPoints = structuredClone(data);
  delete noPoints.rules.survivalPointsPerSol;
  const ctx = { data: noPoints, eng, bus: fakeBus() };
  for (let i = 0; i < 300; i++) step(s, 0.5, ctx);
  assert.equal(s.time.sol, 2);
  assert.equal(s.score.entries.length, 0);
});
