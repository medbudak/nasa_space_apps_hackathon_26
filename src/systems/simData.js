// simData.js — K2: small readers for nasa_data.json, shared by K2's systems.

/** The number in a nasa_data.json scalar entry ({ value, src, ... }). */
export function val(entry) {
  if (entry && typeof entry === 'object' && 'value' in entry) return entry.value;
  throw new Error(`K2: missing data entry (${JSON.stringify(entry)})`);
}

/** One row of a nasa_data.json table by id, e.g. tableRow(data, 'landingSites', 'meridiani'). */
export function tableRow(data, table, id) {
  const row = data[table]?.find((r) => r.id === id);
  if (!row) throw new Error(`K2: no row "${id}" in nasa_data.json table "${table}"`);
  return row;
}

export function landingSite(data, id) {
  return tableRow(data, 'landingSites', id);
}
