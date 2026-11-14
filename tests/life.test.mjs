// K2 tests for sanity (src/systems/sanity.js), MOXIE and the greenhouse (src/systems/survival.js).
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceHours } from '../src/systems/survival.js';
import { onDownlinkSent, FALSE_ALARMS } from '../src/systems/sanity.js';
import { holdLoad } from '../src/systems/power.js';
import { data, eng, fakeBus, newState } from './helpers/k2_env.mjs';

const sanity = data.sanity;
const gh = data.greenhouse;
const NOON = 0.5;
const MIDNIGHT = 0.0;

function setup(design = {}, d = data) {
  const bus = fakeBus();
  const s = newState({ batteryId: 'b300', insulationId: 'thick', ...design }, d);
  return { s, bus, ctx: { data: d, eng, bus } };
}

/** Run `hours` game hours in small steps from a given time of sol. */
function runHours(s, ctx, hours, from = null) {
  if (from != null) s.time.solFraction = from;
  const steps = Math.round(hours / 0.05);
  for (let i = 0; i < steps && !s.life.loss; i++) advanceHours(s, 0.05, ctx);
}

// ---- sanity ---------------------------------------------------------------------------------

test('sanity starts full and drifts down slowly from isolation', () => {
  const { s, ctx } = setup();
  assert.equal(s.life.sanity, sanity.start.value);
  runHours(s, ctx, 2, NOON);
  assert.ok(Math.abs(s.life.sanity - (sanity.start.value - 2 * sanity.drainPerHour.value)) < 1e-6);
});

test('cold and darkness make it fall faster', () => {
  const { s, ctx } = setup();
  s.life.sanity = 50;
  s.life.body.cold = true; // forced for one step
  s.power.deficitW = 1;
  const before = s.life.sanity;
  // One tiny step: cold/dark are read before survival recomputes them next step.
  advanceHours(s, 0.0001, ctx);
  const expected = (sanity.drainPerHour.value + sanity.coldDrainPerHour.value + sanity.darkDrainPerHour.value) * 0.0001;
  assert.ok(before - s.life.sanity <= expected + 1e-9);
});

test('a working greenhouse in daylight lifts sanity', () => {
  const plants = setup({ instrumentIds: ['plantChamber'] });
  const none = setup();
  plants.s.life.sanity = 50;
  none.s.life.sanity = 50;
  runHours(plants.s, plants.ctx, 2, NOON);
  runHours(none.s, none.ctx, 2, NOON);
  assert.ok(plants.s.life.sanity > none.s.life.sanity);
});

test('a family message reaching Earth lifts sanity; other packets do not', () => {
  const { s, ctx } = setup();
  s.life.sanity = 30;
  onDownlinkSent(s, ctx, { type: 'photo', id: 'p1' });
  assert.equal(s.life.sanity, 30);
  onDownlinkSent(s, ctx, { type: 'family', id: 'f1' });
  assert.equal(s.life.sanity, 30 + sanity.familyMessageGain.value);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'familyMessage'));
});

test('low sanity brings false alarms on the hallucination event, and they end', () => {
  const { s, bus, ctx } = setup();
  s.life.sanity = 5;
  runHours(s, ctx, 12, NOON);
  const alarms = bus.emitted.filter((e) => e.name === 'hallucination' && e.payload.kind === 'falseAlarm');
  assert.ok(alarms.length > 0, 'no false alarm in 12 h at sanity 5');
  const a = alarms[0].payload;
  assert.ok(FALSE_ALARMS.includes(a.alarm));
  assert.equal(a.alpha, a.intensity, 'K4 reads alpha, K3 reads intensity: the same value');
  assert.ok(a.intensity > 0 && a.intensity <= 1);
  assert.ok(bus.emitted.some((e) => e.name === 'hallucination' && e.payload.kind === 'end' && e.payload.alpha === 0));
  assert.ok(s.decisionLog.some((d) => d.eventId === 'falseAlarm'));
});

test('no false alarms while sanity is above the line', () => {
  const { s, bus, ctx } = setup();
  s.life.sanity = sanity.falseAlarmBelow.value + 20;
  runHours(s, ctx, 12, NOON);
  assert.equal(bus.emitted.filter((e) => e.name === 'hallucination').length, 0);
});

test('false alarms come from the seeded RNG: the same seed gives the same alarms', () => {
  const runOnce = () => {
    const { s, bus, ctx } = setup();
    s.life.sanity = 5;
    runHours(s, ctx, 12, NOON);
    return bus.emitted.filter((e) => e.name === 'hallucination').map((e) => `${e.payload.kind}:${e.payload.alarm ?? ''}`);
  };
  assert.deepEqual(runOnce(), runOnce());
});

test('without sanity data the model is off: no bar, no loss', () => {
  const noSanity = structuredClone(data);
  delete noSanity.sanity;
  const { s, ctx } = setup({}, noSanity);
  runHours(s, ctx, 4, NOON);
  assert.equal(s.life.sanity, undefined);
  assert.equal(s.life.loss, null);
});

// ---- MOXIE ----------------------------------------------------------------------------------

const moxieGph = data.instruments.find((r) => r.id === 'moxie').o2GramsPerHour.value;

test('MOXIE makes O2 by day at its real rate, and counts it for the report card', () => {
  const with_ = setup({ instrumentIds: ['moxie'] });
  const without = setup();
  runHours(with_.s, with_.ctx, 2, NOON);
  runHours(without.s, without.ctx, 2, NOON);
  const made = with_.s.life.o2Kg - without.s.life.o2Kg;
  assert.ok(Math.abs(made - (moxieGph / 1000) * 2) < 1e-6, `made ${made} kg`);
  assert.ok(Math.abs(with_.s.stats.oxygenProducedKg - made) < 1e-9);
});

test('MOXIE makes nothing at night (instruments off) or while switched off for a storm', () => {
  const night = setup({ instrumentIds: ['moxie'] });
  runHours(night.s, night.ctx, 2, MIDNIGHT);
  assert.equal(night.s.stats.oxygenProducedKg, 0);

  const held = setup({ instrumentIds: ['moxie'] });
  held.s.time.solFraction = NOON;
  holdLoad(held.s, 'moxie', held.s.time.sol + 1);
  runHours(held.s, held.ctx, 2);
  assert.equal(held.s.stats.oxygenProducedKg, 0);
});

test('MOXIE covers only a small share of what one person breathes', () => {
  const perDayMade = (moxieGph / 1000) * 12; // about a day's worth of daylight
  const perDayUsed = data.life.o2KgPerCrewPerDay.value;
  assert.ok(perDayMade < perDayUsed / 3);
});

// ---- greenhouse ------------------------------------------------------------------------------

test('the greenhouse grows in daylight and gives a harvest that lifts sanity', () => {
  const { s, ctx } = setup({ instrumentIds: ['plantChamber'] });
  s.life.sanity = 40;
  // Grow only in daylight: run noon-to-afternoon slices until the harvest.
  for (let i = 0; i < 200 && s.life.greenhouse.harvests === 0; i++) runHours(s, ctx, 4, 0.4);
  assert.equal(s.life.greenhouse.harvests, 1);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'harvest'));
  assert.ok(s.life.sanity > 40);
});

test('cutting the greenhouse heating at night (engine card, option A) kills the plants', () => {
  const { s, ctx } = setup({ instrumentIds: ['plantChamber'] });
  s.time.solFraction = MIDNIGHT;
  s.events.flags.greenhouseHeatingCut = true;
  runHours(s, ctx, 0.5);
  assert.equal(s.life.greenhouse.dead, true);
  const entry = s.score.entries.find((e) => e.reason === 'consequence.greenhouseFroze');
  assert.equal(entry.cause, 'decision.engineFreeze');
  assert.equal(entry.points, data.rules.greenhouseLostPoints.value);
  assert.ok(s.decisionLog.some((d) => d.eventId === 'greenhouseFroze'));
});

test('a habitat gone cold kills the plants too, blamed on the battery choice', () => {
  const { s, ctx } = setup({ instrumentIds: ['plantChamber'] });
  s.env.insideC = gh.frostC.value - 1;
  s.time.solFraction = MIDNIGHT;
  holdLoad(s, 'heating', s.time.sol + 1); // keep the heating off, so the habitat stays cold
  advanceHours(s, 0.01, ctx);
  assert.equal(s.life.greenhouse.dead, true);
  assert.equal(s.score.entries.find((e) => e.reason === 'consequence.greenhouseFroze').cause, 'design.batteryId');
});

test('a dead greenhouse stays dead and does not help sanity', () => {
  const { s, ctx } = setup({ instrumentIds: ['plantChamber'] });
  s.life.greenhouse.dead = true;
  s.life.sanity = 50;
  runHours(s, ctx, 2, NOON);
  assert.ok(s.life.sanity < 50);
  assert.equal(s.life.greenhouse.harvests, 0);
});
