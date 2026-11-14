// Tests for decision cards and the converter mini-game (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatEffect, effectParts, STATS } from '../src/ui/decisionCard.js';
import { computeConversion } from '../src/minigames/converter.js';
import { sampleEngineFreeze, sampleNoReturn, sampleConverters, sampleRows } from '../src/ui/dev/stub_samples.js';

// ---- decision cards (K2's effect format) ----

const res = (stat, delta) => ({ type: 'resource', stat, delta });

test('battery Wh is shown as kWh with a sign and a bad tone', () => {
  const f = formatEffect(res('batteryWh', -4000), { locale: 'en-US' });
  assert.equal(f.amount, '−4 kWh');
  assert.equal(f.tone, 'bad');
  assert.equal(f.icon, '⚡');
});

test('decimals follow the language', () => {
  assert.equal(formatEffect(res('o2Kg', -0.5), { locale: 'tr-TR' }).amount, '−0,5 kg');
  assert.equal(formatEffect(res('o2Kg', -0.5), { locale: 'en-US' }).amount, '−0.5 kg');
});

test('percent goes before the number in Turkish and after it in English', () => {
  assert.equal(formatEffect(res('sanity', -10), { locale: 'tr-TR' }).amount, '−%10');
  assert.equal(formatEffect(res('sanity', -10), { locale: 'en-US' }).amount, '−10%');
});

test('a rise in radiation dose is bad, a rise in battery is good', () => {
  assert.equal(formatEffect(res('radiationMSv', 0.3)).tone, 'bad');
  assert.equal(formatEffect(res('batteryWh', 500)).tone, 'good');
});

test('waiting shows the sols and the estimated cost', () => {
  const f = formatEffect({ type: 'wait', sols: 1, estimate: { o2Kg: -1.68 } }, { locale: 'en-US' });
  assert.equal(f.amount, '+1 sol');
  assert.equal(f.note, '≈ O₂ −1.68 kg');
});

test('flags are internal and not shown to the player', () => {
  assert.equal(formatEffect({ type: 'flag', key: 'engineFrozen', value: false }), null);
});

test("K2's current stat names are shown with icons and units", () => {
  assert.equal(formatEffect(res('energy_kWh', -4), { locale: 'en-US' }).amount, '−4 kWh');
  assert.equal(formatEffect(res('oxygen_kg', -0.5), { locale: 'en-US' }).amount, '−0.5 kg');
  assert.equal(formatEffect(res('radiation_mSv', 0.3)).tone, 'bad');
});

test('an estimate is shown as "≈" chips and ignores non-numbers', () => {
  const parts = effectParts({ type: 'estimate', suitO2Kg: -0.05, safetyMarginLeft: false }, { locale: 'en-US' });
  assert.equal(parts.length, 1);
  assert.equal(parts[0].amount, '≈ −0.05 kg');
  assert.equal(parts[0].approx, true);
  assert.equal(parts[0].tone, 'bad');
});

test('a wait in hours shows hours; otherwise sols', () => {
  assert.equal(formatEffect({ type: 'wait', hours: 2, sols: 0.08 }, { locale: 'en-US' }).amount, '+2 h');
  assert.equal(formatEffect({ type: 'wait', sols: 0.04 }, { locale: 'en-US' }).amount, '+0.04 sol');
});

test('eva and flag effects stay hidden', () => {
  assert.deepEqual(effectParts({ type: 'eva', set: { speedFactor: 1 } }), []);
  assert.deepEqual(effectParts({ type: 'flag', key: 'x', value: true }), []);
});

test('every option in the sample cards shows at least one cost, and every stat has a display rule', () => {
  for (const card of [sampleEngineFreeze, sampleNoReturn]) {
    for (const o of card.options) {
      const parts = o.effects.flatMap((e) => effectParts(e));
      assert.ok(parts.length > 0, `${card.eventId}.${o.id} would show "no cost"`);
      for (const e of o.effects) if (e.type === 'resource') assert.ok(STATS[e.stat], `no display rule for stat ${e.stat}`);
    }
  }
});

// ---- converter ----

test('electrolysis output follows the ratios in config', () => {
  const r = computeConversion(sampleConverters.electrolysis, 2);
  assert.deepEqual(r.outputs.map((o) => o.amount), [1.776, 0.224]);
  assert.equal(r.energyWh, 12000);
  assert.equal(r.gameMinutes, 120);
  assert.equal(r.blocker, null);
});

test('the amount is clamped to what is available and rounded to the step', () => {
  assert.equal(computeConversion(sampleConverters.ice, 99).input.amount, 6);
  assert.equal(computeConversion(sampleConverters.ice, 2.7).input.amount, 2.5);
  assert.equal(computeConversion(sampleConverters.ice, -3).input.amount, 0);
});

test('zero input and too little energy block the start', () => {
  assert.equal(computeConversion(sampleConverters.ice, 0).blocker, 'nothing');
  assert.equal(computeConversion(sampleConverters.electrolysis, 3).blocker, 'energy');
});

test('every sample converter number has a src', () => {
  for (const [group, rows] of Object.entries(sampleRows)) {
    for (const [field, row] of Object.entries(rows)) assert.ok(row.src, `${group}.${field} has no src`);
  }
});

// ---- align ----
import { angleError, signalAt, alignScore } from '../src/minigames/align.js';
import { sampleAligns, alignRows } from '../src/ui/dev/stub_samples.js';

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('panel power follows cos(angle error): full on target, half at 60°', () => {
  const c = sampleAligns.panel;
  assert.ok(near(signalAt(c, c.targetDeg), 1));
  assert.ok(near(signalAt({ ...c, targetDeg: 60 }, 0), 0.5));
});

test('the antenna beam is half strength at half its width and weak far away', () => {
  const c = { ...sampleAligns.antenna, targetDeg: 100, beamWidthDeg: 12 };
  assert.ok(near(signalAt(c, 106), 0.5));
  assert.ok(signalAt(c, 130) < 0.01);
});

test('on a full circle the error wraps: 350° is 20° from 10°', () => {
  const c = { ...sampleAligns.antenna, targetDeg: 10 };
  assert.equal(angleError(c, 350), 20);
  assert.equal(angleError({ ...sampleAligns.photo, targetDeg: 10 }, -50), 60, 'a partial range does not wrap');
});

test('faster solves score higher; no time limit scores 100', () => {
  const c = sampleAligns.antenna;
  assert.ok(alignScore(c, 3) > alignScore(c, 15));
  assert.equal(alignScore(sampleAligns.photo, 50), 100);
  assert.ok(alignScore(c, 999) >= 10);
});

test('every sample align is solvable inside its dial range', () => {
  for (const [name, c] of Object.entries(sampleAligns)) {
    assert.ok(c.targetDeg >= c.minDeg && c.targetDeg <= c.maxDeg, `${name}: target outside the dial`);
    assert.ok(signalAt(c, c.startDeg) * 100 < c.successPct, `${name}: already solved at the start`);
  }
  for (const [k, row] of Object.entries(alignRows)) assert.ok(row.src, `${k} has no src`);
});

// ---- qte ----
import { catchResult, measureResult } from '../src/minigames/qte.js';
import { sampleQtes, qteRows } from '../src/ui/dev/stub_samples.js';

test('a catch counts only inside the hand window, at the end of the fall', () => {
  const tf = 1;
  assert.equal(catchResult(0.5, tf, 0.15).caught, false, 'halfway in time is only a quarter of the height');
  assert.equal(catchResult(0.95, tf, 0.15).caught, true);
  assert.equal(catchResult(0.9, tf, 0.15).caught, false);
});

test('things fall slower on Mars than on Earth in the catch sample', () => {
  const c = sampleQtes.catch;
  assert.ok(c.eventSeconds > c.compareSeconds * 1.5);
  assert.ok(near(c.eventSeconds, Math.sqrt((2 * 1.5) / 3.73), 1e-9));
});

test('a measurement within ±10% passes and is scored by closeness', () => {
  const ok = measureResult([1.0, 1.1, 1.05], 1.05, 0.1);
  assert.equal(ok.success, true);
  assert.equal(ok.measuredSeconds, 1.05);
  assert.equal(ok.score, 100);
  const off = measureResult([1.3], 1.0, 0.1);
  assert.equal(off.success, false);
  assert.equal(off.errorPct, 30);
  assert.equal(off.score, 0);
});

test('the pendulum sample times 10 swings of T = 2π√(L/g)', () => {
  const c = sampleQtes.pendulum;
  assert.ok(near(c.eventSeconds * c.cycles, 10 * 2 * Math.PI * Math.sqrt(1 / 3.73), 1e-9));
  for (const [k, row] of Object.entries(qteRows)) assert.ok(row.src, `${k} has no src`);
});

// ---- wiring ----
import { tryConnect, wiringScore } from '../src/minigames/wiring.js';
import { sampleWiring } from '../src/ui/dev/stub_samples.js';

test('a cable end connects only to its own device; a wrong pair is a short circuit', () => {
  const st = { connected: [], mistakes: 0 };
  assert.deepEqual(tryConnect(st, 'uhf', 'uhf'), { ok: true });
  assert.deepEqual(tryConnect(st, 'uhf', 'xband'), { ok: false, reason: 'short' });
  st.connected.push('uhf');
  assert.equal(tryConnect(st, 'uhf', 'uhf').reason, 'used');
});

test('mistakes and time lower the wiring score', () => {
  const c = sampleWiring;
  assert.ok(wiringScore(0, 5, c) > wiringScore(1, 5, c));
  assert.ok(wiringScore(0, 5, c) > wiringScore(0, 35, c));
  assert.ok(wiringScore(9, 40, c) >= 10);
});

test('the sample box has every device on the right exactly once, shuffled', () => {
  const ids = sampleWiring.pairs.map((p) => p.id);
  assert.deepEqual([...sampleWiring.rightOrder].sort(), [...ids].sort());
  assert.notDeepEqual(sampleWiring.rightOrder, ids);
});

test('a wait with estimate.minutes is shown in minutes, and minutes are not repeated as a note', () => {
  const t = (k) => ({ 'unit.minutes': 'min' }[k] ?? k);
  const f = formatEffect({ type: 'wait', hours: 0.4, sols: 0.016, estimate: { minutes: 24 } }, { t, locale: 'en-US' });
  assert.equal(f.amount, '+24 min');
  assert.equal(f.note, '');
  const g = formatEffect({ type: 'wait', hours: 2, estimate: { minutes: 120, oxygen_kg: -0.1 } }, { t, locale: 'en-US' });
  assert.equal(g.amount, '+120 min');
  assert.equal(g.note, '≈ O₂ −0.1 kg');
});
