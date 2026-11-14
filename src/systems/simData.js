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
    instruments: (d.instrumentIds ?? []).map((id) => rowOf(data, 'instruments', id)),
  };
}
