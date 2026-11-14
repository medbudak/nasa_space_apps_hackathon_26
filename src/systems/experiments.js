// src/systems/experiments.js
import config from '../data/experiments_config.json' with { type: 'json' };
import { getState, logDecision } from '../core/state.js';
import { gravityFromPendulum_ms2 } from '../core/engineering.js';

export function initExperimentsState() {
  const state = getState();
  if (!state.experiments) {
    state.experiments = {
      completed: {},
      activeBonuses: []
    };
  }
}

/**
 * Deney 1: Sarkaç ile Yerçekimi Ölçümü
 */
export function evaluatePendulumExperiment({ lengthM, tenSwingsDurationSec, hasControlGroup = false }) {
  initExperimentsState();
  const periodT = tenSwingsDurationSec / 10;
  const measuredG = gravityFromPendulum_ms2(lengthM, periodT);
  const actualG = config.marsGravity;

  const errorRatio = Math.abs(measuredG - actualG) / actualG;
  const success = errorRatio <= config.toleranceRatio;
  const points = success ? (hasControlGroup ? 90 : 60) : 15;

  return finalizeExperiment('pendulum', {
    success,
    measuredValue: Number(measuredG.toFixed(2)),
    expectedValue: actualG,
    unit: 'm/s²',
    points,
    mbit: 5
  });
}

/**
 * Deney 2: Serbest Düşüş (2 metreden bırakma -> g = 2h / t^2)
 */
export function evaluateFreeFallExperiment({ dropTimeSec, hasControlGroup = false }) {
  initExperimentsState();
  const h = config.experiments.freefall.dropHeightM;
  const measuredG = dropTimeSec > 0 ? (2 * h) / (dropTimeSec * dropTimeSec) : 0;
  const actualG = config.marsGravity;

  const errorRatio = Math.abs(measuredG - actualG) / actualG;
  const success = errorRatio <= config.toleranceRatio;
  const points = success ? (hasControlGroup ? 90 : 60) : 15;

  return finalizeExperiment('freefall', {
    success,
    measuredValue: Number(measuredG.toFixed(2)),
    expectedValue: actualG,
    unit: 'm/s²',
    points,
    mbit: 5
  });
}

/**
 * Deney 3: Tohum Çimlenmesi (Grup A: Dünya, B: Yıkanmamış Regolit, C: Yıkanmış + Gübreli)
 */
export function evaluateSeedExperiment({ soilGroup, environment }) {
  initExperimentsState();
  const state = getState();
  const instruments = state.design?.selectedInstruments || state.instruments || [];
  const hasVeggie = instruments.includes('veggie');
  const success = hasVeggie && environment === 'indoor' && soilGroup === 'C';
  const points = success ? 100 : 20;

  return finalizeExperiment('seed_germination', {
    success,
    measuredValue: success ? '88% Çimlenme' : '0% (Perklorat/Donma)',
    expectedValue: '85-95% Çimlenme',
    unit: '%',
    points,
    mbit: 8
  });
}

/**
 * Deney 4-5-6: Suyun Kaynaması, Ses Hızı ve MOXIE Verimi
 */
export function evaluateLabExperiment(expId, { hypothesisChoice, measuredValue, hasControlGroup = false }) {
  initExperimentsState();
  const spec = config.experiments[expId];
  if (!spec) return { ok: false };

  let success = false;
  if (expId === 'water_boiling') {
    success = hypothesisChoice === 'boils_and_freezes';
  } else if (expId === 'speed_of_sound') {
    const err = Math.abs(measuredValue - spec.expectedMarsSpeedMs) / spec.expectedMarsSpeedMs;
    success = err <= config.toleranceRatio;
  } else if (expId === 'moxie_efficiency') {
    success = hypothesisChoice === 'higher_at_night_dense_air';
  }

  const basePts = success ? 80 : 20;
  const points = hasControlGroup ? Math.round(basePts * 1.5) : basePts;

  return finalizeExperiment(expId, {
    success,
    measuredValue,
    expectedValue: spec.expectedMarsSpeedMs || spec.triplePointPressureKpa || '6-12 g/saat',
    unit: '',
    points,
    mbit: 6
  });
}

function finalizeExperiment(expId, result) {
  const state = getState();
  const spec = config.experiments[expId];
  state.experiments.completed[expId] = result;

  if (result.success && spec.unlockBonus && !state.experiments.activeBonuses.includes(spec.unlockBonus)) {
    state.experiments.activeBonuses.push(spec.unlockBonus);
  }

  if (!state.dataBudget) state.dataBudget = { queue: [] };
  state.dataBudget.queue.push({
    type: 'experiment',
    id: `exp_${expId}`,
    expId,
    mbit: result.mbit,
    points: result.points
  });

  if (typeof logDecision === 'function') {
    logDecision(
      state.sol,
      `experiment:${expId}`,
      result.success ? 'success' : 'failed',
      `Ölçülen: ${result.measuredValue} ${result.unit} (+${result.points} puan)`
    );
  }

  return { ok: true, result };
}