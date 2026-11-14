import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/data/experiments_config.json' with { type: 'json' };
import nasa from '../src/data/nasa_data.json' with { type: 'json' };

test('Mars yercekimi sabiti ve tolerans kontrolu', () => {
  // Must match the sourced values in nasa_data.json (NASA Mars Fact Sheet, D-006).
  assert.equal(config.marsGravity, nasa.mars.gravity.value);
  assert.equal(config.earthGravity, nasa.constants.g0.value);
  assert.equal(config.toleranceRatio, nasa.rules.experimentTolerance.value);
});

test('Sarkac deneyi Mars yercekimi hesaplamasi (L=1m, T=3.26s)', () => {
  const L = 1.0;
  const T = 3.26;
  const g = (4 * Math.PI * Math.PI * L) / (T * T);
  const error = Math.abs(g - config.marsGravity) / config.marsGravity;
  assert.ok(error <= config.toleranceRatio, `Hesaplanan g (${g.toFixed(2)}) tolerans disinda`);
});

test('Serbest dusus deneyi 2m icin Mars g hesabi (t=1.04s)', () => {
  const h = config.experiments.freefall.dropHeightM;
  const t = config.experiments.freefall.expectedMarsSec;
  const g = (2 * h) / (t * t);
  assert.ok(Math.abs(g - config.marsGravity) < 0.1);
});