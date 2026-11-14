// Loads src/data/nasa_data.json and hands out its values.
// Every real-world number in the game comes through here, so each one keeps its source.
//
// Two shapes live in the file:
//   scalar entry: { "value": 3.73, "unit": "m/s^2", "src": "<url>", "verified": true }
//   table row:    { "id": "moxie", ...fields, "src": "<url>", "verified": false }
// "src": "PLACEHOLDER" marks a number that still needs a real source. None may remain at content lock.

export const PLACEHOLDER = 'PLACEHOLDER';

let data = null;

export async function loadNasaData(url = new URL('../data/nasa_data.json', import.meta.url)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`nasa_data.json failed to load (${res.status})`);
  data = await res.json();
  const placeholders = findPlaceholders(data);
  if (placeholders.length) console.info(`[nasaData] ${placeholders.length} values still have src PLACEHOLDER`, placeholders);
  return data;
}

/** The whole parsed file, for code that needs a full table. */
export function getData() {
  if (!data) throw new Error('nasa_data.json is not loaded yet: await loadNasaData() first');
  return data;
}

/** Value of a scalar entry by dotted path, e.g. value('mars.gravity'). Throws on a typo. */
export function value(path) {
  const entry = path.split('.').reduce((node, key) => node?.[key], getData());
  if (!entry || !('value' in entry)) throw new Error(`nasa_data.json has no entry "${path}"`);
  return entry.value;
}

/** All rows of a table, e.g. rows('instruments'). */
export function rows(table) {
  const list = getData()[table];
  if (!Array.isArray(list)) throw new Error(`nasa_data.json has no table "${table}"`);
  return list;
}

/** One row by id, e.g. row('instruments', 'moxie'). */
export function row(table, id) {
  const found = rows(table).find((r) => r.id === id);
  if (!found) throw new Error(`nasa_data.json table "${table}" has no row "${id}"`);
  return found;
}

// Walks every scalar entry and table row, calling visit(item, path).
function walk(node, path, visit) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      visit(item, `${path}[${item?.id ?? i}]`);
    });
    return;
  }
  if (node && typeof node === 'object') {
    if ('value' in node) {
      visit(node, path);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('_')) walk(child, path ? `${path}.${key}` : key, visit);
    }
  }
}

/** Entries or rows missing a src string or a verified boolean. Must be empty. */
export function findUnsourced(json) {
  const problems = [];
  walk(json, '', (item, path) => {
    if (typeof item?.src !== 'string' || !item.src) problems.push(`${path}: missing src`);
    if (typeof item?.verified !== 'boolean') problems.push(`${path}: missing verified`);
  });
  return problems;
}

/** Paths whose src is still PLACEHOLDER. */
export function findPlaceholders(json) {
  const found = [];
  walk(json, '', (item, path) => {
    if (item?.src === PLACEHOLDER) found.push(path);
  });
  return found;
}

/** Paths that are sourced but not yet checked against the source (verified: false). */
export function findUnverified(json) {
  const found = [];
  walk(json, '', (item, path) => {
    if (item?.verified === false && item.src !== PLACEHOLDER) found.push(path);
  });
  return found;
}
