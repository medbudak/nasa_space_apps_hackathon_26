// survival.js — K2: surface simulation (time, day/night, energy, heat, O2, radiation, EVA, loss).
//
// State (K1's src/core/state.js, D-003). This file creates and updates:
//   state.time  { sol, solFraction }
//   state.power { batteryWh, batteryCapacityWh, generationW, loadW, deficitW, dust,
//                 order[], off{}, experimentW }            (the last three: power.js)
//   state.env   { outsideC, insideC }
//   state.life  { o2Kg, radiationMSv, eva{}, body{}, loss }
//     eva, body and loss are not in K1's schema yet (requested); they live under life until then.
//   state.outcome = 'lost' on a loss; state.stats.{energyUsedKWh, solsSurvived}
// Design choices are ids in state.design (siteId, powerId, batteryId, insulationId, ...).
//
// The game passes ctx = { data, eng, bus? }:
//   data — parsed src/data/nasa_data.json
//   eng  — src/core/engineering.js (sunCos, solarPower, surfaceTemp, heatingPower, oxygenToReturn)
//          plus habitatTemp, requested from K1 (Newton cooling toward outside). Until K1 adds it,
//          the habitat simply does not cool when its heating is shed (a warning is logged once).
//
// No gameplay numbers are written in this file: they all come from nasa_data.json.

import { val, rowVal, designRows } from './simData.js';
import { initPower, computeLoads, sumOn, updateShedding, isOn } from './power.js';

/**
 * Fill state.time / power / env / life for a new surface run, after Sol 0.
 * Call once when the surface scene starts a new run (not on a reload: they exist then).
 */
export function createSurvivalState(state, data) {
  const { battery } = designRows(state, data);
  const capacityWh = rowVal(battery, 'capacityKWh') * 1000;

  state.time = { sol: 1, solFraction: val(data.time.startSolFraction, 'time.startSolFraction') };
  state.power = {
    batteryWh: capacityWh, // start full
    batteryCapacityWh: capacityWh,
    generationW: 0,
    loadW: 0,
    deficitW: 0, // > 0 when the battery is empty and the loads are not covered
    dust: 0, // 0..1 share of panel output lost to dust
  };
  state.env = { outsideC: 0, insideC: val(data.thermal.habitatTargetC, 'thermal.habitatTargetC') };
  state.life = {
    o2Kg: val(data.life.o2StartKg, 'life.o2StartKg'),
    radiationMSv: 0,
    eva: {
      outside: false,
      distanceM: 0, // from the habitat airlock; set by surface.js as the astronaut walks
      suitO2Kg: 0,
      jointsFrozen: false,
      thawed: false, // joints were thawed (suit heater or wreck RHU): no refreeze this EVA (simplified)
      speedFactor: 1, // share of normal walking speed
      requiredO2Kg: 0, // O2 needed to walk back, with safety factor: the red notch on the HUD
      noReturn: false, // suit O2 is below the notch
      nearWreck: false, // set by surface.js: a wreck with RHUs is close enough to shelter at
      cardShown: false, // the no-return card opens at most once per EVA
    },
    body: {
      cold: false, // the astronaut is in dangerous cold right now
      coldHours: 0, // game hours of cold in a row; resets when warm
    },
    loss: null, // set once by checkLoss(): { reasonKey, sol, solFraction, values }
  };
  initPower(state);
  return state;
}

/** Real seconds -> game hours. */
export function realSecondsToHours(seconds, data) {
  return (seconds / val(data.time.solRealSeconds, 'time.solRealSeconds')) * val(data.mars.solHours, 'mars.solHours');
}

/** True while the Sun is down at the landing site. */
export function isNight(state, { data, eng }) {
  const { site } = designRows(state, data);
  return eng.sunCos(state.time.solFraction, rowVal(site, 'latitudeDeg')) === 0;
}

/**
 * Advance the simulation by realDt seconds of real time.
 * Does nothing once the mission is lost.
 */
export function step(state, realDt, ctx) {
  if (state.life.loss) return state;
  const dtHours = realSecondsToHours(realDt, ctx.data);
  advanceTime(state, dtHours / val(ctx.data.mars.solHours, 'mars.solHours'));
  updateEnvironment(state, ctx);
  updatePower(state, dtHours, ctx);
  updateHabitatTemp(state, dtHours, ctx);
  updateRadiation(state, dtHours, ctx.data);
  updateLife(state, dtHours, ctx.data);
  updateEva(state, dtHours, ctx);
  updateBody(state, dtHours, ctx.data);
  updateStats(state, dtHours);
  checkLoss(state, ctx);
  return state;
}

function advanceTime(state, dSol) {
  const t = state.time;
  t.solFraction += dSol;
  while (t.solFraction >= 1) {
    t.solFraction -= 1;
    t.sol += 1;
  }
}

function updateEnvironment(state, { data, eng }) {
  const { site } = designRows(state, data);
  state.env.outsideC = eng.surfaceTemp({
    minC: rowVal(site, 'nightMinC'),
    maxC: rowVal(site, 'dayMaxC'),
    solFraction: state.time.solFraction,
  });
}

/** Panel output at this moment, plus any continuous source (RTG). */
export function generationW(state, { data, eng }) {
  const { site, powerSource } = designRows(state, data);
  let w = rowVal(powerSource, 'continuousW', { optional: true });
  if (powerSource.panelEfficiency) {
    w += eng.solarPower({
      irradiance: val(data.mars.solarIrradianceWm2, 'mars.solarIrradianceWm2'),
      area: rowVal(powerSource, 'panelAreaM2'),
      efficiency: rowVal(powerSource, 'panelEfficiency'),
      cosZ: eng.sunCos(state.time.solFraction, rowVal(site, 'latitudeDeg')),
      dust: state.power.dust,
    });
  }
  return w;
}

function updatePower(state, dtHours, ctx) {
  const p = state.power;
  p.generationW = generationW(state, ctx);

  // Only loads that are switched on draw power (power.js decides which).
  p.loadW = sumOn(computeLoads(state, ctx));

  // Battery bookkeeping: surplus charges, shortfall drains, clamp to [0, capacity].
  const next = p.batteryWh + (p.generationW - p.loadW) * dtHours;
  p.batteryWh = Math.min(Math.max(next, 0), p.batteryCapacityWh);

  // Shed or restore loads for the next step; sets loadW and deficitW.
  updateShedding(state, ctx);
}

let warnedNoHabitatTemp = false;

// With its heating on, the habitat holds its set point (simplified: it snaps back as soon as
// heating returns). With heating shed, it cools toward the outside temperature.
function updateHabitatTemp(state, dtHours, { data, eng }) {
  const env = state.env;
  if (isOn(state, 'heating')) {
    env.insideC = val(data.thermal.habitatTargetC, 'thermal.habitatTargetC');
    return;
  }
  if (typeof eng.habitatTemp !== 'function') {
    if (!warnedNoHabitatTemp) console.warn('[survival] engineering.habitatTemp is missing: the habitat will not cool');
    warnedNoHabitatTemp = true;
    return;
  }
  env.insideC = eng.habitatTemp({
    insideC: env.insideC,
    outsideC: env.outsideC,
    dtHours,
    coolingHours: val(data.thermal.habitatCoolingHours, 'thermal.habitatCoolingHours'),
  });
}

// Surface dose accumulates all the time (inside and outside; simplified, no habitat shielding).
// The source value is per Earth day (24 h).
function updateRadiation(state, dtHours, data) {
  state.life.radiationMSv += (val(data.radiation.surfaceMSvPerDay, 'radiation.surfaceMSvPerDay') * dtHours) / 24;
}

// Habitat O2 use. The source value is per crew member per Earth day (24 h).
function updateLife(state, dtHours, data) {
  if (state.life.eva.outside) return; // outside, the astronaut breathes from the suit
  const perHour = val(data.life.o2KgPerCrewPerDay, 'life.o2KgPerCrewPerDay') / 24;
  const use = perHour * val(data.life.crew, 'life.crew') * dtHours;
  state.life.o2Kg = Math.max(0, state.life.o2Kg - use);
}

// Body cold (simplified): inside, the habitat air is below the danger line;
// outside, the suit joints are frozen. Counts game hours of cold in a row.
function updateBody(state, dtHours, data) {
  const { eva, body } = state.life;
  body.cold = eva.outside
    ? eva.jointsFrozen
    : state.env.insideC <= val(data.thermal.bodyColdBelowC, 'thermal.bodyColdBelowC');
  body.coldHours = body.cold ? body.coldHours + dtHours : 0;
}

// Run totals for K1's report card.
function updateStats(state, dtHours) {
  if (!state.stats) return;
  state.stats.energyUsedKWh += (state.power.loadW * dtHours) / 1000;
  state.stats.solsSurvived = state.time.sol - 1;
}

// ---------------------------------------------------------------------------
// EVA and the point of no return (M4).
// While outside: the suit uses O2, joints freeze in deep cold (speed drops), and every step
// recomputes the O2 needed to walk back. When suit O2 falls below that notch, events.js
// opens the "not enough to reach the habitat" card.

/** Leave the habitat with a full suit. */
export function startEva(state, data) {
  Object.assign(state.life.eva, {
    outside: true,
    distanceM: 0,
    suitO2Kg: val(data.eva.suitO2Kg, 'eva.suitO2Kg'),
    jointsFrozen: false,
    thawed: false,
    speedFactor: 1,
    requiredO2Kg: 0,
    noReturn: false,
    nearWreck: false,
    cardShown: false,
  });
}

/** Back inside the airlock. */
export function endEva(state) {
  Object.assign(state.life.eva, { outside: false, distanceM: 0, noReturn: false, requiredO2Kg: 0 });
}

/** surface.js reports where the astronaut is. */
export function setEvaPosition(state, { distanceM, nearWreck = false }) {
  state.life.eva.distanceM = Math.max(0, distanceM);
  state.life.eva.nearWreck = nearWreck;
}

/** Current walking speed in m/s (normal speed × freeze factor). */
export function walkSpeedMs(state, data) {
  return val(data.eva.walkSpeedMs, 'eva.walkSpeedMs') * state.life.eva.speedFactor;
}

function updateEva(state, dtHours, { data, eng }) {
  const eva = state.life.eva;
  if (!eva.outside) return;

  const o2PerHour = val(data.life.evaO2KgPerHour, 'life.evaO2KgPerHour');
  eva.suitO2Kg = Math.max(0, eva.suitO2Kg - o2PerHour * dtHours);

  if (!eva.jointsFrozen && !eva.thawed && state.env.outsideC <= val(data.eva.jointFreezeBelowC, 'eva.jointFreezeBelowC')) {
    eva.jointsFrozen = true;
    eva.speedFactor = val(data.eva.jointFreezeSpeedFactor, 'eva.jointFreezeSpeedFactor');
  }

  eva.requiredO2Kg = eng.oxygenToReturn({
    distanceM: eva.distanceM,
    speedMs: walkSpeedMs(state, data),
    o2KgPerSec: o2PerHour / 3600,
    safetyFactor: val(data.rules.noReturnSafetyFactor, 'rules.noReturnSafetyFactor'),
  });
  eva.noReturn = eva.suitO2Kg < eva.requiredO2Kg;
}

// ---------------------------------------------------------------------------
// Loss conditions (D-006). The report card is still shown after a loss.

/**
 * Check the loss conditions; on the first one met, record it in state.life.loss,
 * set state.outcome = 'lost', and return it. Returns null while the mission goes on.
 * When two happen in the same step, the first listed is reported.
 * Called by step(); surface.js reads state.life.loss and moves to the ending scene.
 */
export function checkLoss(state, { data }) {
  const life = state.life;
  if (life.loss) return life.loss;

  let reasonKey = null;
  let values = {};
  if (life.eva.outside && life.eva.suitO2Kg <= 0) {
    reasonKey = 'loss.suitOxygen';
    values = { distanceM: Math.round(life.eva.distanceM) };
  } else if (!life.eva.outside && life.o2Kg <= 0) {
    reasonKey = 'loss.oxygen';
  } else if (life.body.coldHours >= val(data.rules.coldLossHours, 'rules.coldLossHours')) {
    reasonKey = 'loss.cold';
    values = { coldHours: val(data.rules.coldLossHours, 'rules.coldLossHours'), insideC: Math.round(state.env.insideC) };
  } else if (life.radiationMSv > val(data.rules.radiationLimitMSv, 'rules.radiationLimitMSv')) {
    reasonKey = 'loss.radiation';
    values = { doseMSv: Math.round(life.radiationMSv), limitMSv: val(data.rules.radiationLimitMSv, 'rules.radiationLimitMSv') };
  } else if (typeof life.sanity === 'number' && life.sanity <= 0) {
    reasonKey = 'loss.sanity'; // life.sanity is created by sanity.js (not written yet)
  }
  if (!reasonKey) return null;

  life.loss = { reasonKey, sol: state.time.sol, solFraction: state.time.solFraction, values };
  state.outcome = 'lost';
  return life.loss;
}

// ---------------------------------------------------------------------------
// Spend helpers for K6 (experiments, forensics). Each returns false and changes
// nothing if there is not enough of the resource.

/** Spend game time in game hours; runs the simulation forward. */
export function spendTime(state, hours, ctx) {
  let left = hours / realSecondsToHours(1, ctx.data); // in real seconds
  while (left > 0 && !state.life.loss) {
    const dt = Math.min(1, left);
    step(state, dt, ctx);
    left -= dt;
  }
  return true;
}

/** Spend battery energy in Wh. */
export function spendEnergy(state, wh) {
  if (state.power.batteryWh < wh) return false;
  state.power.batteryWh -= wh;
  return true;
}

/** Spend habitat oxygen in kg. */
export function spendO2(state, kg) {
  if (state.life.o2Kg < kg) return false;
  state.life.o2Kg -= kg;
  return true;
}
