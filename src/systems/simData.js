// simData.js — K2: readers for src/data/nasa_data.json, shared by K2's systems.
// A missing or unresearched value (src PLACEHOLDER, value null) throws with its path,
// so a gap in the data shows up as a clear error instead of a silent zero.

/** The number in a scalar entry ({ value, src, ... }). */
export function val(entry, path = '?') {
  const v = entry?.value;
  if (typeof v !== 'number') throw new Error(`K2 needs nasa_data.json "${path}" (missing or null)`);
  return v;
}

/** One row of a table by id. */
export function rowOf(data, table, id) {
  if (id == null) throw new Error(`K2: no Sol 0 choice for "${table}" in state.design (design not finished?)`);
  const row = data[table]?.find((r) => r.id === id);
  if (!row) throw new Error(`K2: no row "${id}" in nasa_data.json table "${table}"`);
  return row;
}

/** A number inside a row. With optional: true a missing or null field reads as 0. */
export function rowVal(row, field, { optional = false } = {}) {
  const v = row?.[field]?.value;
  if (typeof v === 'number') return v;
  if (optional) return 0;
  throw new Error(`K2 needs nasa_data.json "${row?.id}.${field}" (missing or null)`);
}

const isEntry = (o) => o && typeof o === 'object' && 'value' in o;

function addMissing(target, extra) {
  for (const [key, v] of Object.entries(extra ?? {})) {
    if (key.startsWith('_')) continue;
    if (isEntry(v)) {
      if (target[key]?.value == null) target[key] = v;
    } else {
      target[key] ??= {};
      addMissing(target[key], v);
    }
  }
}

/**
 * A copy of nasa_data.json with K2's requested values (tests/fixtures/k2_requested.json) added
 * where the real file has nothing or null. Never overwrites a value K1 has filled in.
 * Used by K2's tests, and by the surface scene only with ?devData=k2.
 */
export function withRequested(data, requested) {
  const out = structuredClone(data);
  addMissing(out, requested.add);
  const { rows, ...scalars } = requested.fill ?? {};
  addMissing(out, scalars);
  for (const [table, byId] of Object.entries(rows ?? {})) {
    for (const [id, fields] of Object.entries(byId)) {
      const row = out[table]?.find((r) => r.id === id);
      if (row) addMissing(row, fields);
    }
  }
  return out;
}

const warnedScore = new Set();

/**
 * Write a score entry into the state passed in, in the shape of K1's addScore() (D-003):
 * { sol, category, points, reason, cause }. reason is a story.json key; cause is the choice
 * behind it ('design.<field>' or 'decision.<eventId>'), so the report card can link them.
 * The points come from nasa_data.json (D-009); a missing entry writes nothing (and warns once),
 * so an unset game value never stops the game.
 */
export function recordScore(state, { category, pointsEntry, path, reason, cause = null, sol = state.time?.sol ?? 0 }) {
  const points = pointsEntry?.value;
  if (typeof points !== 'number') {
    if (!warnedScore.has(path)) console.warn(`[K2] no points in nasa_data.json "${path}": "${reason}" not scored`);
    warnedScore.add(path);
    return null;
  }
  const entry = { sol, category, points, reason, cause };
  state.score.entries.push(entry);
  state.score.total += points;
  return entry;
}

/** The data rows behind the Sol 0 choices in state.design (ids, D-003). */
export function designRows(state, data) {
  const d = state.design;
  return {
    site: rowOf(data, 'landingSites', d.siteId),
    powerSource: rowOf(data, 'powerSources', d.powerId),
    battery: rowOf(data, 'batteries', d.batteryId),
    insulation: rowOf(data, 'insulation', d.insulationId),
    // heatingPower uses the thin layer's conductance times the chosen layer's factor (as evaluateDesign does)
    thinInsulation: rowOf(data, 'insulation', 'thin'),
    comms: d.commsId ? rowOf(data, 'comms', d.commsId) : null,
    spareKits: d.spareKitsId ? rowOf(data, 'spareKits', d.spareKitsId) : null,
    instruments: (d.instrumentIds ?? []).map((id) => rowOf(data, 'instruments', id)),
  };
}
