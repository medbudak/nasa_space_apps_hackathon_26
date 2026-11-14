// Tests for the HUD bars (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hudBars, evaBar } from '../src/ui/hud.js';

const data = JSON.parse(readFileSync(new URL('../src/data/nasa_data.json', import.meta.url), 'utf8'));
const bar = (bars, id) => bars.find((b) => b.id === id);

const state = () => ({
  power: { batteryWh: 30000, batteryCapacityWh: 150000 },
  env: { insideC: 21 },
  life: { o2Kg: 1.79, radiationMSv: 2, body: { cold: false, coldHours: 0 }, eva: { outside: false } },
  dataBudget: { perSol: 500, used: 100, queue: [{ id: 'a' }, { id: 'b' }] },
});

test('six bars in a fixed order', () => {
  assert.deepEqual(hudBars(state(), data).map((b) => b.id), ['energy', 'o2', 'heat', 'radiation', 'sanity', 'data']);
});

test('energy is shown in kWh and turns red at a low share', () => {
  const s = state();
  assert.equal(bar(hudBars(s, data), 'energy').value, 30);
  assert.equal(bar(hudBars(s, data), 'energy').level, 'warn');
  s.power.batteryWh = 10000;
  assert.equal(bar(hudBars(s, data), 'energy').level, 'bad');
});

test('oxygen shows days left at the sourced consumption rate', () => {
  const b = bar(hudBars(state(), data), 'o2');
  const perDay = data.life.o2KgPerCrewPerDay.value * data.life.crew.value;
  assert.equal(b.note.key, 'hud.o2Days');
  assert.ok(Math.abs(b.note.vars.days - Math.floor((1.79 / perDay) * 10) / 10) < 1e-9);
  assert.equal(b.level, 'warn', 'about two days left');
});

test('a limit missing from the data is not invented', () => {
  const b = bar(hudBars(state(), data), 'radiation');
  if (data.rules.radiationLimitMSv?.value == null) {
    assert.equal(b.max, null);
    assert.equal(b.fill, null);
  } else {
    assert.equal(b.max, data.rules.radiationLimitMSv.value);
  }
});

test('cold turns the heat bar red with how long it has been cold', () => {
  const s = state();
  s.life.body = { cold: true, coldHours: 1.5 };
  const b = bar(hudBars(s, data), 'heat');
  assert.equal(b.level, 'bad');
  assert.equal(b.note.vars.h, 1.5);
});

test('sanity shows "no data" until sanity.js exists; data shows the waiting packets', () => {
  const bars = hudBars(state(), data);
  assert.equal(bar(bars, 'sanity').value, null);
  assert.equal(bar(bars, 'data').note.vars.n, 2);
});

test('the EVA bar puts the no-return notch at the O2 needed to walk back', () => {
  const s = state();
  assert.equal(evaBar(s), null, 'no bar inside');
  s.life.eva = { outside: true, suitO2Kg: 0.6, requiredO2Kg: 0.2, distanceM: 300, noReturn: false };
  const e = evaBar(s, 0.8);
  assert.ok(Math.abs(e.fill - 0.75) < 1e-9);
  assert.ok(Math.abs(e.notch - 0.25) < 1e-9);
  s.life.eva.noReturn = true;
  assert.equal(evaBar(s, 0.8).noReturn, true);
});

// ---- alarms ----
import { judge } from '../src/ui/alarms.js';

test('a false alarm is answered right only with "fake", a real one only with "real"', () => {
  assert.equal(judge({ fake: true }, 'fake'), true);
  assert.equal(judge({ fake: true }, 'real'), false);
  assert.equal(judge({ fake: false }, 'real'), true);
  assert.equal(judge({ fake: false }, 'fake'), false);
});

// ---- UFO epilogue downlink ----
import { ufoStopPct } from '../src/ui/ufoDownlink.js';

test('the UFO photo stops at the share the remaining data budget can send', () => {
  assert.equal(ufoStopPct(120, 300), 40);
  assert.equal(ufoStopPct(500, 300), 100, 'never more than the whole photo');
  assert.equal(ufoStopPct(0, 300), 0);
  assert.equal(ufoStopPct(50, 0), 0, 'no photo size: nothing to send');
});

import { normalizeAlarm } from '../src/ui/alarms.js';

test("K2's false alarm kind names map to the reading the player can check", () => {
  const a = normalizeAlarm('o2Leak');
  assert.equal(a.kind, 'o2Leak');
  assert.equal(a.stat, 'o2');
  assert.equal(normalizeAlarm('powerFail').stat, 'energy');
  assert.equal(normalizeAlarm('radiation').stat, 'radiation');
  assert.notEqual(normalizeAlarm('o2Leak').id, normalizeAlarm('o2Leak').id, 'two alarms of one kind are two alarms');
  assert.deepEqual(normalizeAlarm({ id: 'x', stat: 'o2', value: 2, unit: '%' }), { id: 'x', stat: 'o2', value: 2, unit: '%' });
});
