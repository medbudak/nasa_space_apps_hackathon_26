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
//
// No gameplay numbers are written in this file.

/** The number in a nasa_data.json scalar entry ({ value, src, ... }). */
export function val(entry) {
  if (entry && typeof entry === 'object' && 'value' in entry) return entry.value;
  throw new Error(`survival: missing data entry (${JSON.stringify(entry)})`);
}

/** One row of a nasa_data.json table by id, e.g. landingSite(data, 'meridiani'). */
export function landingSite(data, id) {
  const site = data.landingSites.find((r) => r.id === id);
  if (!site) throw new Error(`survival: no landing site "${id}" in nasa_data.json`);
  return site;
}

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
  };
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
  const dSol = realSecondsToSol(realDt, ctx.data);
  advanceTime(state, dSol);
  updateEnvironment(state, ctx);
  updatePower(state, solToHours(dSol, ctx.data), ctx);
  updateLife(state, dSol, ctx.data);
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

function updatePower(state, dtHours, { data, eng }) {
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

  const heater_W = eng.heatingPower_W({
    inside_C: sim.inside_C,
    outside_C: sim.outside_C,
    insulation: state.design.insulation,
  });
  sim.load_W = val(data.power.lifeSupport_W) + heater_W;

  // Battery bookkeeping: surplus charges, shortfall drains, clamp to [0, capacity].
  const next = res.energy_kWh + ((sim.generation_W - sim.load_W) * dtHours) / 1000;
  if (next < 0) {
    res.energy_kWh = 0;
    sim.deficit_W = sim.load_W - sim.generation_W; // power.js (M3) sheds loads from this
  } else {
    res.energy_kWh = Math.min(next, power.battery_kWh);
    sim.deficit_W = 0;
  }
}

function updateLife(state, dSol, data) {
  const use = val(data.life.oxygenPerCrewPerSol_kg) * val(data.life.crew) * dSol;
  state.resources.oxygen_kg = Math.max(0, state.resources.oxygen_kg - use);
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
