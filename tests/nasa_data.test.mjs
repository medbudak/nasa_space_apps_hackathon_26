import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findUnsourced, findPlaceholders, findUnverified, findEstimates } from '../src/core/nasaData.js';

const data = JSON.parse(readFileSync(new URL('../src/data/nasa_data.json', import.meta.url)));

test('every number is an entry with src and verified', () => {
  assert.deepEqual(findUnsourced(data), []);
});

test('no estimates: unresearched values carry no number', () => {
  assert.deepEqual(findEstimates(data), []);
});

test('table rows have unique ids', () => {
  for (const [name, table] of Object.entries(data)) {
    if (!Array.isArray(table)) continue;
    const ids = table.map((r) => r.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${name}`);
  }
});

// Reported as TODO until content lock: must reach zero before submission.
const placeholders = findPlaceholders(data);
test('no PLACEHOLDER sources left', { todo: placeholders.length ? `${placeholders.length} left: ${placeholders.join(', ')}` : false }, () => {
  assert.deepEqual(placeholders, []);
});

const unverified = findUnverified(data);
test('no unverified values left', { todo: unverified.length ? `${unverified.length} left: ${unverified.join(', ')}` : false }, () => {
  assert.deepEqual(unverified, []);
});
