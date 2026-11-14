import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookup } from '../src/core/i18n.js';

const block = {
  'storm.warning': 'Storm in {hours} h',
  wrecks: { opportunity: { title: 'Opportunity (June 2018)', evidence: ['Dust on panels', 'Tau 10.8'] } },
};

test('flat keys and nested paths both resolve', () => {
  assert.equal(lookup(block, 'storm.warning'), 'Storm in {hours} h');
  assert.equal(lookup(block, 'wrecks.opportunity.title'), 'Opportunity (June 2018)');
  assert.equal(lookup(block, 'wrecks.opportunity.evidence.1'), 'Tau 10.8');
  assert.deepEqual(lookup(block, 'wrecks.opportunity.evidence'), ['Dust on panels', 'Tau 10.8']);
});

test('missing keys and blocks give undefined', () => {
  assert.equal(lookup(block, 'wrecks.spirit.title'), undefined);
  assert.equal(lookup(undefined, 'storm.warning'), undefined);
});
