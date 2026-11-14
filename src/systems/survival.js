// survival.js — K2: surface simulation step (time, day/night, energy, temperature, O2).
//
// Works on K1's gameState (src/core/state.js on the `enes` branch):
//   state.sol, state.timeOfSol (0..1)
//   state.design.landingSiteId, state.design.power.{solarArea_m2, battery_kWh}, state.design.insulation
//   state.resources.{oxygen_kg, energy_kWh, radiation_mSv}
// Fields K1's schema does not have yet live in one K2 sub-object, state.sim (requested from K1):
//   state.sim.{generation_W, load_W, deficit_W, dustLoss, outside_C, inside_C, events}
//
// Nothing is imported from K1's files, so this module and its tests run on their own.
// The game passes in:
//   ctx.data — parsed src/data/nasa_data.json (every number { value, unit, src, verified })
//   ctx.eng  — src/core/engineering.js
//
// From engineering.js this file uses solarPower_W (exists) and three formulas requested from K1:
//   eng.sunCosZenith(timeOfSol)                              -> cos of solar zenith, 0 at night
//   eng.surfaceTemp_C({ min_C, max_C, timeOfSol })           -> outside temperature, °C
//   eng.heatingPower_W({ inside_C, outside_C, insulation })  -> heater draw, W
// and for the point of no return (M4), K1's existing formula:
//   eng.oxygenToReturn({ distanceM, speedMs, o2KgPerSec, safetyFactor }) -> kg
// and one more requested from K1, for the habitat cooling down when its heating is shed:
//   eng.habitatTemp_C({ inside_C, outside_C, dtHours, coolingTime_h }) -> new inside °C
//     (Newton's law of cooling: inside moves toward outside with time constant coolingTime_h)
//
// No gameplay numbers are written in this file.

import { val, landingSite } from './simData.js';
import { initPower, computeLoads, sumOn, updateShedding, isOn } from './power.js';

export { val, landingSite };

/**
 * Prepare the surface run after Sol 0: start the clock, fill the battery and O2,
 * and create state.sim. Call once when the surface scene starts a new run.
 */
export function initSurvival(state, data) {
  if (state.sol < 1) state.sol = 1;
  state.timeOfSol = val(data.tuning.startTimeOfSol);
  state.resources.energy_kWh = state.design.power.battery_kWh;
  state.resources.oxygen_kg = val(data.life.oxygenStart_kg);
  state.sim = {
    generation_W: 0,
    load_W: 0,
    deficit_W: 0, // > 0 when the battery is empty and the loads are not covered
    dustLoss: 0, // 0..1 share of panel output lost to dust
    outside_C: 0,
    inside_C: val(data.habitat.target_C),
    events: null, // filled by events.js
    power: null, // filled by power.js
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
    loss: null, // set once by checkLoss(): { reasonKey, sol, timeOfSol, values }
  };
  initPower(state);
  return state;
}

/** Real seconds -> fraction of a sol. */
export function realSecondsToSol(seconds, data) {
  return seconds / val(data.tuning.solDuration);
}

/** Fraction of a sol -> game hours (a sol is longer than an Earth day). */
export function solToHours(solAmount, data) {
  return solAmount * val(data.mars.solLength);
}

/**
 * Advance the simulation by realDt seconds of real time.
 * Changes state.sol, state.timeOfSol, state.resources and state.sim.
 */
export function step(state, realDt, ctx) {
  if (state.sim.loss) return state; // the mission is over: nothing moves any more
  const dSol = realSecondsToSol(realDt, ctx.data);
  const dtHours = solToHours(dSol, ctx.data);
  advanceTime(state, dSol);
  updateEnvironment(state, ctx);
  updatePower(state, dtHours, ctx);
  updateHabitatTemp(state, dtHours, ctx);
  updateRadiation(state, dtHours, ctx.data);
  updateLife(state, dSol, ctx.data);
  updateEva(state, dtHours, ctx);
  updateBody(state, dtHours, ctx.data);
  checkLoss(state, ctx);
  return state;
}

function advanceTime(state, dSol) {
  state.timeOfSol += dSol;
  while (state.timeOfSol >= 1) {
    state.timeOfSol -= 1;
    state.sol += 1;
  }
}

function updateEnvironment(state, { data, eng }) {
  const site = landingSite(data, state.design.landingSiteId);
  state.sim.outside_C = eng.surfaceTemp_C({
    min_C: site.nightMin_C,
    max_C: site.dayMax_C,
    timeOfSol: state.timeOfSol,
  });
}

function updatePower(state, dtHours, ctx) {
  const { data, eng } = ctx;
  const sim = state.sim;
  const res = state.resources;
  const power = state.design.power;

  sim.generation_W = eng.solarPower_W({
    irradiance_Wm2: val(data.mars.solarIrradiance),
    area_m2: power.solarArea_m2,
    efficiency: val(data.power.panelEfficiency),
    cosZenith: eng.sunCosZenith(state.timeOfSol),
    dustLoss: sim.dustLoss,
  });

  // Only loads that are switched on draw power (power.js decides which).
  sim.load_W = sumOn(computeLoads(state, ctx));

  // Battery bookkeeping: surplus charges, shortfall drains, clamp to [0, capacity].
  const next = res.energy_kWh + ((sim.generation_W - sim.load_W) * dtHours) / 1000;
  res.energy_kWh = Math.min(Math.max(next, 0), power.battery_kWh);

  // Shed or restore loads for the next step; sets sim.load_W and sim.deficit_W.
  updateShedding(state, ctx);
}

// With its heating on, the habitat holds its set point (simplified: it snaps back as soon as
// heating returns). With heating shed, it cools toward the outside temperature.
function updateHabitatTemp(state, dtHours, { data, eng }) {
  const sim = state.sim;
  if (isOn(state, 'heating')) {
    sim.inside_C = val(data.habitat.target_C);
    return;
  }
  sim.inside_C = eng.habitatTemp_C({
    inside_C: sim.inside_C,
    outside_C: sim.outside_C,
    dtHours,
    coolingTime_h: val(data.habitat.coolingTime_h),
  });
}

// Surface dose accumulates all the time (inside and outside; simplified, no habitat shielding).
// The source value is per Earth day (24 h).
function updateRadiation(state, dtHours, data) {
  state.resources.radiation_mSv += (val(data.radiation.surfaceMSvPerDay) * dtHours) / 24;
}

function updateLife(state, dSol, data) {
  if (state.sim.eva.outside) return; // outside, the astronaut breathes from the suit
  const use = val(data.life.oxygenPerCrewPerSol_kg) * val(data.life.crew) * dSol;
  state.resources.oxygen_kg = Math.max(0, state.resources.oxygen_kg - use);
}

// Body cold (simplified): inside, the habitat air is below the danger line;
// outside, the suit joints are frozen. Counts game hours of cold in a row.
function updateBody(state, dtHours, data) {
  const { sim } = state;
  sim.body.cold = sim.eva.outside
    ? sim.eva.jointsFrozen
    : sim.inside_C <= val(data.body.coldBelow_C);
  sim.body.coldHours = sim.body.cold ? sim.body.coldHours + dtHours : 0;
}

// ---------------------------------------------------------------------------
// Loss conditions (D-006). The report card is still shown after a loss.

/**
 * Check the loss conditions once; on the first one met, record it in state.sim.loss,
 * set state.outcome = 'lost', and return it. Returns null while the mission goes on.
 * Order matters only when two happen in the same step: the first listed is reported.
 * Called by step(); surface.js reads state.sim.loss and moves to the ending scene.
 */
export function checkLoss(state, { data }) {
  const { sim, resources } = state;
  if (sim.loss) return sim.loss;

  let reasonKey = null;
  let values = {};
  if (sim.eva.outside && sim.eva.suitO2Kg <= 0) {
    reasonKey = 'loss.suitOxygen';
    values = { distanceM: Math.round(sim.eva.distanceM) };
  } else if (!sim.eva.outside && resources.oxygen_kg <= 0) {
    reasonKey = 'loss.oxygen';
  } else if (sim.body.coldHours >= val(data.loss.coldHours)) {
    reasonKey = 'loss.cold';
    values = { coldHours: val(data.loss.coldHours), inside_C: Math.round(sim.inside_C) };
  } else if (resources.radiation_mSv > val(data.loss.radiationLimit_mSv)) {
    reasonKey = 'loss.radiation';
    values = { dose_mSv: Math.round(resources.radiation_mSv), limit_mSv: val(data.loss.radiationLimit_mSv) };
  } else if (typeof sim.sanity === 'number' && sim.sanity <= 0) {
    reasonKey = 'loss.sanity'; // sim.sanity is created by sanity.js (not written yet)
  }
  if (!reasonKey) return null;

  sim.loss = { reasonKey, sol: state.sol, timeOfSol: state.timeOfSol, values };
  state.outcome = 'lost';
  return sim.loss;
}

// ---------------------------------------------------------------------------
// EVA and the point of no return (M4).
// While outside: the suit uses O2, joints freeze in deep cold (speed drops), and every step
// recomputes the O2 needed to walk back. When suit O2 falls below that notch, events.js
// opens the "not enough to reach the habitat" card.

/** Leave the habitat with a full suit. */
export function startEva(state, data) {
  const eva = state.sim.eva;
  Object.assign(eva, {
    outside: true,
    distanceM: 0,
    suitO2Kg: val(data.eva.suitO2_kg),
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
  Object.assign(state.sim.eva, { outside: false, distanceM: 0, noReturn: false, requiredO2Kg: 0 });
}

/** surface.js reports where the astronaut is. */
export function setEvaPosition(state, { distanceM, nearWreck = false }) {
  state.sim.eva.distanceM = Math.max(0, distanceM);
  state.sim.eva.nearWreck = nearWreck;
}

/** Current walking speed in m/s (normal speed × freeze factor). */
export function walkSpeedMs(state, data) {
  return val(data.eva.walkSpeed_ms) * state.sim.eva.speedFactor;
}

function updateEva(state, dtHours, { data, eng }) {
  const eva = state.sim.eva;
  if (!eva.outside) return;

  const o2PerHour = val(data.eva.oxygenPerHour_kg);
  eva.suitO2Kg = Math.max(0, eva.suitO2Kg - o2PerHour * dtHours);

  if (!eva.jointsFrozen && !eva.thawed && state.sim.outside_C <= val(data.eva.jointFreezeBelow_C)) {
    eva.jointsFrozen = true;
    eva.speedFactor = val(data.eva.jointFreezeSpeedFactor);
  }

  eva.requiredO2Kg = eng.oxygenToReturn({
    distanceM: eva.distanceM,
    speedMs: walkSpeedMs(state, data),
    o2KgPerSec: o2PerHour / 3600,
    safetyFactor: val(data.eva.noReturnSafetyFactor),
  });
  eva.noReturn = eva.suitO2Kg < eva.requiredO2Kg;
}

// ---------------------------------------------------------------------------
// Spend helpers for K6 (experiments, forensics). Each returns false and changes
// nothing if there is not enough of the resource.

/** Spend game time in game hours; runs the simulation forward. */
export function spendTime(state, hours, ctx) {
  let left = (hours / val(ctx.data.mars.solLength)) * val(ctx.data.tuning.solDuration);
  while (left > 0) {
    const dt = Math.min(1, left);
    step(state, dt, ctx);
    left -= dt;
  }
  return true;
}

/** Spend battery energy in kWh. */
export function spendEnergy(state, kWh) {
  if (state.resources.energy_kWh < kWh) return false;
  state.resources.energy_kWh -= kWh;
  return true;
}

/** Spend oxygen in kg. */
export function spendO2(state, kg) {
  if (state.resources.oxygen_kg < kg) return false;
  state.resources.oxygen_kg -= kg;
  return true;
}
