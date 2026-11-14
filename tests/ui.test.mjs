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
