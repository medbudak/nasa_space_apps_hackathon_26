// Tests for the Sol 0 launch rules (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDesign, launchBlockers } from '../src/scenes/design.js';
import { stubData } from '../src/ui/dev/stub_data.js';
import { evaluateDesign } from '../src/ui/dev/stub_evaluate.js';

const full = (over = {}) => Object.assign(emptyDesign(), {
  objectiveId: 'balanced', rocketId: 'falconHeavy', trajectoryId: 'hohmann', siteId: 'meridiani',
  powerId: 'solar', batteryId: 'b40', insulationId: 'thin', instrumentIds: ['camera', 'meda'],
  commsId: 'relay', spareKitsId: 'k1',
}, over);

const codes = (d) => launchBlockers(d, stubData, evaluateDesign(d, stubData)).map((b) => b.code);

test('an empty design is blocked for every missing choice', () => {
  const c = codes(emptyDesign());
  assert.equal(c.filter((x) => x === 'missing').length, 9);
});

test('a reasonable design can launch', () => {
  assert.deepEqual(codes(full()), []);
});

test('the medium rocket cannot carry a crewed base', () => {
  assert.ok(codes(full({ rocketId: 'atlas5' })).includes('overMass'));
});

test('a cold site with a small battery fails the night', () => {
  assert.ok(codes(full({ siteId: 'arcadia', batteryId: 'b20' })).includes('nightPower'));
});

test('thick insulation lowers the night energy need', () => {
  const thin = evaluateDesign(full({ siteId: 'arcadia' }), stubData).nightNeedKWh;
  const thick = evaluateDesign(full({ siteId: 'arcadia', insulationId: 'thick' }), stubData).nightNeedKWh;
  assert.ok(thick < thin);
});

test('more than the allowed number of instruments is blocked', () => {
  const ids = stubData.instruments.slice(0, 6).map((i) => i.id);
  assert.ok(codes(full({ instrumentIds: ids })).includes('tooManyInstruments'));
});

test('every option in the stub data has a src on each number', () => {
  for (const [key, list] of Object.entries(stubData)) {
    const rows = Array.isArray(list) ? list : [list];
    for (const row of rows) {
      for (const [field, v] of Object.entries(row)) {
        if (v && typeof v === 'object' && 'value' in v) assert.ok(v.src, `${key}.${row.id ?? ''}.${field} has no src`);
      }
    }
  }
});

test('an unresearched budget or capacity (null -> 0) does not block the launch', () => {
  const d = full();
  const summary = { ...evaluateDesign(d, stubData), budget: 0 };
  assert.ok(!launchBlockers(d, stubData, summary).some((b) => b.code === 'overBudget'));
  const noCap = { ...evaluateDesign(d, stubData), capacity: 0 };
  assert.ok(!launchBlockers(d, stubData, noCap).some((b) => b.code === 'overMass'));
});
