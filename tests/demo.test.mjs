// K2 tests for the ?demo quick mission (D-005 M9): the crisis schedule scaled onto rules.demoSols.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/systems/survival.js';
import { checkEvents, resolveDecision } from '../src/systems/events.js';
import { finaleDue, startFinale, updateFinale, finaleDone, finalePaused } from '../src/systems/finale.js';
import { missionSols, scheduledSol, scheduledSpan } from '../src/systems/simData.js';
import { data, eng, newState } from './helpers/k2_env.mjs';

const total = data.rules.totalSols.value;
const demoSols = data.rules.demoSols.value;

/** The surface loop without drawing; cards answered by `pick`, mini-games succeed. */
function play(design, ctxExtra, pick) {
  const s = newState(design);
  for (let i = 0; i < 2; i++) {
    s.forensics[`w${i}`] = { sent: true };
    s.experiments[`e${i}`] = { sent: true };
  }
  const emitted = [];
  const ctx = { data, eng, bus: { emit: (n, p) => emitted.push({ n, p }) }, ...ctxExtra };
  const order = [];
  for (let i = 0; i < 40000 && !finaleDone(s) && !s.life.loss; i++) {
    if (s.events.pending) {
      order.push(s.events.pending.eventId);
      resolveDecision(s, pick(s.events.pending), ctx);
      continue;
    }
    const mg = emitted.find((e) => e.n === 'minigame:open' && !e.done);
    if (mg) {
      mg.done = true;
      mg.p.onDone({ success: true, score: 100 });
      continue;
    }
    if (!finalePaused(s)) step(s, 0.5, ctx);
    if (finaleDue(s, ctx)) startFinale(s);
    checkEvents(s, ctx);
    updateFinale(s, ctx);
  }
  return { s, order };
}

const careful = (p) =>
  p.card.options.find((o) => !o.disabled && !['askEarth', 'keepAll', 'ignore', 'keepWorking', 'wait'].includes(o.id))?.id
  ?? p.card.options.find((o) => !o.disabled).id;
const GOOD = { siteId: 'meridiani', batteryId: 'b300', insulationId: 'thick', instrumentIds: ['meda', 'rad', 'seis'] };

test('the schedule maps the full mission onto the demo: first and last sol stay, the rest scale', () => {
  const ctx = { data, demo: true };
  assert.equal(missionSols(ctx), demoSols);
  assert.equal(missionSols({ data }), total);
  assert.equal(scheduledSol(ctx, 1), 1);
  assert.equal(scheduledSol(ctx, total), demoSols);
  assert.equal(scheduledSol({ data }, 7), 7, 'the full mission is unchanged');
  assert.ok(Math.abs(scheduledSpan(ctx, total - 1) - (demoSols - 1)) < 1e-9);
});

test('the demo ends on its last sol with an outcome, and every crisis still comes, in order', () => {
  const { s } = play(GOOD, { demo: true }, careful);
  assert.equal(s.life.loss, null, `died: ${s.life.loss?.reasonKey}`);
  assert.equal(s.outcome, 'hero');
  assert.ok(s.time.sol <= demoSols, `ended on sol ${s.time.sol}`);
  const ids = s.decisionLog.map((d) => d.eventId);
  for (const id of ['stormWarning', 'storm', 'speWarning', 'spe', 'dustDevil', 'conjunction', 'quakeWarning', 'quake', 'radiator', 'engineFreeze']) {
    assert.ok(ids.includes(id), `${id} missing in the demo`);
  }
  const first = (id) => ids.indexOf(id);
  assert.ok(first('storm') < first('spe') && first('spe') < first('conjunction') && first('conjunction') < first('engineFreeze'));
});

test('in the demo, choices still decide the outcome (a small battery does not make it)', () => {
  const { s } = play({ siteId: 'meridiani', batteryId: 'b150', insulationId: 'thin', instrumentIds: [] }, { demo: true }, careful);
  assert.equal(s.outcome, 'lost');
});

test('the full mission is unchanged without ?demo: it ends on the last sol', () => {
  const { s } = play(GOOD, {}, careful);
  assert.equal(s.outcome, 'hero');
  assert.equal(s.time.sol, total);
});
