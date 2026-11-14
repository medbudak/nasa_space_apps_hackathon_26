// Shared test setup for K2's tests: K1's real state, formulas and data, plus K2's requested values.
import { readFileSync } from 'node:fs';
import * as engineering from '../../src/core/engineering.js';
import { createState } from '../../src/core/state.js';
import { createSurvivalState } from '../../src/systems/survival.js';
import { createEventState } from '../../src/systems/events.js';

const read = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url)));
const realData = read('../../src/data/nasa_data.json');
const requested = read('../fixtures/k2_requested.json');

const isEntry = (o) => o && typeof o === 'object' && 'value' in o;

/** Add entries that do not exist; never overwrite a value K1 has already filled in. */
function addMissing(target, extra) {
  for (const [key, v] of Object.entries(extra)) {
    if (key.startsWith('_')) continue;
    if (isEntry(v)) {
      if (target[key]?.value == null) target[key] = v;
    } else {
      target[key] ??= {};
      addMissing(target[key], v);
    }
  }
}

function withRequested(base) {
  const data = structuredClone(base);
  addMissing(data, requested.add);
  addMissing(data, { life: requested.fill.life });
  for (const [table, rows] of Object.entries(requested.fill.rows)) {
    for (const [id, fields] of Object.entries(rows)) {
      const row = data[table].find((r) => r.id === id);
      addMissing(row, fields);
    }
  }
  return data;
}

export const data = withRequested(realData);

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

/** Game hours -> real seconds at the data's time scale. */
export function realSeconds(hours, d = data) {
  return (hours / d.time.solHours.value) * d.time.solRealSeconds.value;
}
