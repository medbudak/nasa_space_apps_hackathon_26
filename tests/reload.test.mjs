// K2 tests: a saved run (localStorage holds it as JSON) can be reloaded at any moment and played on.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { step } from '../src/systems/survival.js';
import { checkEvents, resolveDecision, reopenPending } from '../src/systems/events.js';
import { finaleDue, startFinale, updateFinale, finaleDone, finalePaused } from '../src/systems/finale.js';
import { isHeld } from '../src/systems/power.js';
import { data, eng, newState } from './helpers/k2_env.mjs';

const T = (s) => s.time.sol + s.time.solFraction;
const careful = (p) =>
  p.card.options.find((o) => !o.disabled && !['askEarth', 'keepAll', 'ignore', 'keepWorking', 'wait'].includes(o.id))?.id
  ?? p.card.options.find((o) => !o.disabled).id;
const DESIGN = { siteId: 'meridiani', batteryId: 'b300', insulationId: 'thick', instrumentIds: ['meda', 'rad', 'seis', 'plantChamber'] };

function newCtx() {
  const emitted = [];
  return { data, eng, bus: { emit: (n, p) => emitted.push({ n, p }) }, emitted };
}

/** The surface loop without drawing. Stops at `until(state)` or the end. Cards: `pick`. */
function play(s, ctx, { until = () => false, pick = careful } = {}) {
  for (let i = 0; i < 40000 && !finaleDone(s) && !s.life.loss && !until(s); i++) {
    if (s.events.pending) {
      resolveDecision(s, pick(s.events.pending), ctx);
      continue;
    }
    const mg = ctx.emitted.find((e) => e.n === 'minigame:open' && !e.done);
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
  return s;
}

/** As localStorage does: the run becomes JSON and comes back; the UI is gone. */
function reload(s) {
  const back = JSON.parse(JSON.stringify(s));
  const ctx = newCtx();
  reopenPending(back, ctx);
  return { s: back, ctx };
}

test('reloading with a crisis card open shows the card again, and the run plays on to the end', () => {
  const ctx = newCtx();
  const s = play(newState(DESIGN), ctx, { until: (x) => x.events.pending?.eventId === 'stormWarning', pick: (p) => (p.eventId === 'stormWarning' ? null : careful(p)) });
  assert.equal(s.events.pending.eventId, 'stormWarning');
  const r = reload(s);
  const reopened = r.ctx.emitted.find((e) => e.n === 'decision:open');
  assert.equal(reopened.p.eventId, 'stormWarning');
  assert.equal(typeof reopened.p.choose, 'function', 'the reopened card can be answered');
  play(r.s, r.ctx);
  // No science was sent in this run, so the launch ends as explorer (D-010).
  assert.equal(r.s.outcome, 'explorer');
});

test('reloading mid-storm keeps the storm, its end and a load held off for it', () => {
  const ctx = newCtx();
  const s = play(newState(DESIGN), ctx, { until: (x) => Boolean(x.events.active?.storm) && T(x) > x.events.active.storm.untilT - 0.2 });
  assert.ok(s.events.active.storm, 'not mid-storm');
  assert.equal(isHeld(s, 'greenhouse'), true);
  const r = reload(s);
  assert.equal(isHeld(r.s, 'greenhouse'), true, 'the held load came back on after the reload');
  play(r.s, r.ctx, { until: (x) => !x.events.active.storm });
  assert.ok(r.s.decisionLog.some((d) => d.eventId === 'stormEnd'), 'the storm never ended after the reload');
  assert.equal(r.s.power.dust, data.events.storm.residualDust.value);
});

test('reloading during the departure sequence still ends the run with an outcome', () => {
  const ctx = newCtx();
  const s = play(newState(DESIGN), ctx, { until: (x) => x.events.finale?.step === 'engine' || x.events.finale?.step === 'launch' });
  const r = reload(s);
  play(r.s, r.ctx);
  assert.ok(['hero', 'explorer', 'colonist'].includes(r.s.outcome), `outcome ${r.s.outcome}`);
});

test('a save from before today\'s fields (no active, minigame, held, greenhouse, sanity) plays on', () => {
  const ctx = newCtx();
  const s = play(newState(DESIGN), ctx, { until: (x) => x.time.sol >= 2 });
  const old = JSON.parse(JSON.stringify(s));
  delete old.events.active;
  delete old.events.minigame;
  delete old.events.finale;
  delete old.power.held;
  delete old.life.greenhouse;
  delete old.life.sanity;
  delete old.life.hallucination;
  const octx = newCtx();
  reopenPending(old, octx);
  play(old, octx);
  assert.equal(old.life.loss, null, `died: ${old.life.loss?.reasonKey}`);
  assert.ok(['hero', 'explorer'].includes(old.outcome), `outcome ${old.outcome}`);
});
