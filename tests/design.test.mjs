// Tests for the Sol 0 design screen rules (owner: K3). Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyPicks, launchBlockers, toStateDesign, picksFromState, GROUPS } from '../src/scenes/design.js';
import { stubData } from '../src/ui/dev/stub_data.js';
import { evaluateDesign } from '../src/ui/dev/stub_evaluate.js';

const full = (over = {}) => Object.assign(emptyPicks(), {
  objectives: 'balanced', rockets: 'falconHeavy', trajectories: 'hohmann', landingSites: 'meridiani',
  powerOptions: 'solar', batteries: 'b40', insulation: 'thin', instruments: ['cameraHires', 'weather'],
  commsOptions: 'relay', spareKits: 'k1',
}, over);

const codes = (picks) => launchBlockers(picks, stubData, evaluateDesign(toStateDesign(picks, stubData), stubData)).map((b) => b.code);
const night = (picks) => evaluateDesign(toStateDesign(picks, stubData), stubData).nightNeedKWh;

// K1's gameState.design fields (src/core/state.js), without the totals that are added at launch.
const K1_FIELDS = ['objective', 'rocketId', 'trajectoryId', 'landingSiteId', 'power', 'insulation', 'instruments', 'comms', 'spareKits'];

test('picks are written in K1 gameState.design shape', () => {
  const d = toStateDesign(full({ powerOptions: 'solarRtg', spareKits: 'k2' }), stubData);
  assert.deepEqual(Object.keys(d).sort(), [...K1_FIELDS].sort());
  assert.equal(d.landingSiteId, 'meridiani');
  assert.deepEqual(d.power, { solarArea_m2: 60, rtg: true, battery_kWh: 40 });
  assert.equal(d.spareKits, 2);
  assert.equal(d.comms, 'relay');
  assert.deepEqual(d.instruments, ['cameraHires', 'weather']);
});

test('a saved design comes back as the same picks', () => {
  for (const p of [full(), full({ powerOptions: 'solarRtg', batteries: 'b60', spareKits: 'k0', commsOptions: 'relayDte' })]) {
    assert.deepEqual(picksFromState(toStateDesign(p, stubData), stubData), p);
  }
});

test('a fresh gameState.design gives no picks, not "0 kits"', () => {
  const fresh = { objective: null, rocketId: null, trajectoryId: null, landingSiteId: null,
    power: { solarArea_m2: 0, rtg: false, battery_kWh: 0 }, insulation: null, instruments: [], comms: null, spareKits: 0 };
  assert.deepEqual(picksFromState(fresh, stubData), emptyPicks());
});

test('an empty design is blocked for every missing choice', () => {
  const single = Object.values(GROUPS).filter((g) => !g.multi).length;
  assert.equal(codes(emptyPicks()).filter((x) => x === 'missing').length, single);
});

test('a reasonable design can launch', () => {
  assert.deepEqual(codes(full()), []);
});

test('the medium rocket cannot carry a crewed base', () => {
  assert.ok(codes(full({ rockets: 'atlas5' })).includes('overMass'));
});

test('a cold site with a small battery fails the night', () => {
  assert.ok(codes(full({ landingSites: 'arcadia', batteries: 'b20' })).includes('nightPower'));
});

test('thick insulation and an RTG lower the night energy need', () => {
  const base = night(full({ landingSites: 'arcadia' }));
  assert.ok(night(full({ landingSites: 'arcadia', insulation: 'thick' })) < base);
  assert.ok(night(full({ landingSites: 'arcadia', powerOptions: 'solarRtg' })) < base);
});

test('more than the allowed number of instruments is blocked', () => {
  const ids = stubData.instruments.slice(0, 6).map((i) => i.id);
  assert.ok(codes(full({ instruments: ids })).includes('tooManyInstruments'));
});

test('every row and scalar in the stub data has a src', () => {
  const walk = (node, path) => {
    if (Array.isArray(node)) node.forEach((r) => assert.ok(r.src, `${path}.${r.id} has no src`));
    else if (node && typeof node === 'object') {
      if ('value' in node) assert.ok(node.src, `${path} has no src`);
      else for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    }
  };
  walk(stubData, 'data');
});
