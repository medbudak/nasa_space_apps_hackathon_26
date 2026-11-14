import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newGame, addScore, logDecision, getState } from '../src/core/state.js';
import { buildReport, missionSuccess, scoreMassMargin } from '../src/scenes/ending.js';

const data = JSON.parse(readFileSync(new URL('../src/data/nasa_data.json', import.meta.url)));

function sendReports(state, n) {
  for (let i = 0; i < n; i++) state.forensics[`wreck${i}`] = { sent: true };
}
function sendExperiments(state, n) {
  for (let i = 0; i < n; i++) state.experiments[`exp${i}`] = { sent: true };
}

test('mission success thresholds follow D-006', () => {
  const state = newGame(1);
  assert.equal(missionSuccess(state, data).level, 'none');
  sendReports(state, 2);
  sendExperiments(state, 2);
  assert.equal(missionSuccess(state, data).level, 'minimum');
  sendReports(state, 4);
  sendExperiments(state, 4);
  assert.equal(missionSuccess(state, data).level, 'minimum', 'full success also needs a safe return');
  state.outcome = 'hero';
  assert.equal(missionSuccess(state, data).level, 'full');
});

test('three different designs give three different explanations', () => {
  // (a) cheap and light: small battery, the greenhouse froze.
  newGame(1);
  getState().design.batteryId = 'b20';
  addScore('survival', -120, 'consequence.greenhouseFroze', 'design.batteryId');
  addScore('forensics', 100, 'consequence.correctDiagnosis', 'decision.wreckOpportunity');
  const cheap = buildReport(getState(), data);

  // (b) balanced: weather station warned of the storm.
  newGame(2);
  addScore('survival', 80, 'consequence.stormPrepared', 'design.instrumentIds');
  const balanced = buildReport(getState(), data);

  // (c) heavy, many instruments: data budget ran out before the reports went home.
  newGame(3);
  logDecision({ eventId: 'dataFull', choice: 'familyVideo', effects: [{ key: 'resources.sanity', delta: 10 }] });
  addScore('experiments', -60, 'consequence.resultsNotSent', 'decision.dataFull');
  const heavy = buildReport(getState(), data);

  const firstCause = (r) => r.topCauses[0].cause;
  assert.deepEqual([firstCause(cheap), firstCause(balanced), firstCause(heavy)], [
    'design.batteryId',
    'design.instrumentIds',
    'decision.dataFull',
  ]);
  assert.equal(cheap.topCauses[0].points, -120, 'biggest effect comes first');
  assert.equal(heavy.timeline.length, 1);
});

test('entries without a cause are grouped by reason', () => {
  newGame(4);
  addScore('survival', 10, 'consequence.solSurvived');
  addScore('survival', 10, 'consequence.solSurvived');
  const report = buildReport(getState(), data);
  assert.equal(report.topCauses.length, 1);
  assert.equal(report.topCauses[0].points, 20);
  assert.equal(report.byCategory.survival, 20);
});

test('mass-margin bonus is added once and only with enough margin', () => {
  const bonus = data.rules.massMarginBonus.value;

  const state = newGame(5);
  state.designSummary = { capacity: 1000, mass: 950 }; // 5% margin: no bonus
  scoreMassMargin(state, data);
  assert.equal(state.score.total, 0);

  state.designSummary = { capacity: 1000, mass: 850 }; // 15% margin
  scoreMassMargin(state, data);
  scoreMassMargin(state, data);
  assert.equal(state.score.total, bonus);
});
