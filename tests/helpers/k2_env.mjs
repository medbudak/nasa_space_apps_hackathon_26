// Shared test setup for K2's tests: K1's real state, formulas and data, plus K2's requested values.
import { readFileSync } from 'node:fs';
import * as engineering from '../../src/core/engineering.js';
import { createState } from '../../src/core/state.js';
import { createSurvivalState } from '../../src/systems/survival.js';
import { createEventState } from '../../src/systems/events.js';
import { withRequested } from '../../src/systems/simData.js';

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url)));

export const data = withRequested(read('../../src/data/nasa_data.json'), read('../fixtures/k2_requested.json'));

// K1's real formulas, plus the one K2 still waits for. The double goes away once K1 adds it.
export const eng = {
  ...engineering,
  habitatTemp:
    engineering.habitatTemp ??
    (({ insideC, outsideC, dtHours, coolingHours }) => outsideC + (insideC - outsideC) * Math.exp(-dtHours / coolingHours)),
};

/** Minimal stand-in for K1's bus.js: records every emit. */
export function fakeBus() {
  const emitted = [];
  return { emitted, emit: (name, payload) => emitted.push({ name, payload }) };
}

export const DEFAULT_DESIGN = {
  siteId: 'meridiani',
  powerId: 'solar',
  batteryId: 'b300',
  insulationId: 'thick',
  commsId: 'relay',
  instrumentIds: [],
};

/** K1's real createState() with a Sol 0 design, then K2's surface state on top. */
export function newState(design = {}, d = data) {
  const s = createState(1);
  Object.assign(s.design, DEFAULT_DESIGN, design);
  createSurvivalState(s, d);
  createEventState(s);
  return s;
}

// Crises on a fixed schedule (events.js). A test that jumps the clock forward counts them as
// already lived through, as they would be in a real run.
const SCHEDULED = [
  'stormWarning', 'storm', 'speWarning', 'spe', 'dustDevil', 'conjunction', 'quakeWarning', 'quake', 'radiator',
];

/** Jump the clock to a sol and time of sol, marking the scheduled crises before it as done. */
export function jumpTo(s, sol, solFraction = s.time.solFraction) {
  s.time.sol = sol;
  s.time.solFraction = solFraction;
  for (const id of SCHEDULED) s.events.fired[id] ??= { sol: 0, solFraction: 0, skipped: true };
}

/** Game hours -> real seconds at the data's time scale. */
export function realSeconds(hours, d = data) {
  return (hours / d.time.solHours.value) * d.time.solRealSeconds.value;
}
