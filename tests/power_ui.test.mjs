// Tests for the power panel and telemetry (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveLoad, shedPreview, hoursLeft } from '../src/ui/powerPanel.js';
import { createTelemetry, niceTicks } from '../src/ui/telemetry.js';

const loads = [
  { id: 'lifeSupport', watts: 3000, on: true, pinned: true },
  { id: 'heating', watts: 1800, on: true, pinned: false },
  { id: 'greenhouse', watts: 900, on: true, pinned: false },
  { id: 'moxie', watts: 300, on: true, pinned: false },
  { id: 'comms', watts: 0, on: true, pinned: false },
];

test('a load moves within the list but never above or onto the pinned life support', () => {
  assert.deepEqual(moveLoad(loads, 'moxie', 1), ['lifeSupport', 'moxie', 'heating', 'greenhouse', 'comms']);
  assert.deepEqual(moveLoad(loads, 'heating', 0), null, 'cannot go above life support (no change)');
  assert.equal(moveLoad(loads, 'lifeSupport', 3), null);
  assert.deepEqual(moveLoad(loads, 'greenhouse', 99), ['lifeSupport', 'heating', 'moxie', 'comms', 'greenhouse']);
});

test('the shed preview drops loads from the bottom until the rest fit, skipping pinned and 0 W ones', () => {
  assert.deepEqual(shedPreview(loads, 5000), ['moxie', 'greenhouse']);
  assert.deepEqual(shedPreview(loads, 9999), []);
  assert.deepEqual(shedPreview(loads, 0), ['moxie', 'greenhouse', 'heating'], 'life support stays even with no generation');
});

test('the order decides what is lost: moving the greenhouse up protects it', () => {
  const order = moveLoad(loads, 'greenhouse', 1);
  const reordered = order.map((id) => loads.find((l) => l.id === id));
  assert.ok(!shedPreview(reordered, 5000).includes('greenhouse'));
  assert.ok(shedPreview(reordered, 5000).includes('heating'));
});

test('battery hours left at the net draw; null while charging', () => {
  assert.equal(hoursLeft(10000, 3000, 1000), 5);
  assert.equal(hoursLeft(10000, 1000, 3000), null);
});

test('telemetry keeps the last 3 sols and thins close samples', () => {
  const tm = createTelemetry({ maxSols: 3, minStepSol: 0.01 });
  const state = { time: { sol: 1, solFraction: 0 }, power: { batteryWh: 5000 }, env: { insideC: 20, outsideC: -60 }, life: { radiationMSv: 1 } };
  assert.equal(tm.sample(state), true);
  state.time.solFraction = 0.001;
  assert.equal(tm.sample(state), false, 'too close to the previous sample');
  for (let T = 1.02; T <= 6; T += 0.02) {
    state.time.sol = Math.floor(T);
    state.time.solFraction = T - Math.floor(T);
    tm.sample(state);
  }
  const span = tm.points.at(-1).T - tm.points[0].T;
  assert.ok(span <= 3 + 1e-9, `kept ${span} sols`);
  assert.equal(tm.latest().batteryKWh, 5);
  assert.equal(tm.latest().deltaVKms, undefined, 'no Δv source yet');
});

test('telemetry does nothing before landing', () => {
  assert.equal(createTelemetry().sample({ time: null }), false);
});

test('axis ticks are round numbers that cover the data', () => {
  const { lo, hi, ticks } = niceTicks(-83, 18);
  assert.ok(lo <= -83 && hi >= 18);
  assert.ok(ticks.every((v) => Number.isInteger(v / 10) || Number.isInteger(v / 25)));
  assert.deepEqual(niceTicks(5, 5).ticks.length > 1, true, 'a flat line still gets an axis');
});
