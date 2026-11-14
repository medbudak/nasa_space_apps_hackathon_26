// survival.js — K2: surface simulation step (time, day/night, energy, temperature, O2).
//
// This module does NOT import K1's files yet (state.js, engineering.js, nasa_data.json
// were not published when it was written). Everything it needs is passed in:
//
//   ctx.data  — rows from nasa_data.json, each shaped { value, unit, src, verified }
//   ctx.eng   — formulas from engineering.js (D-003: formulas live only there)
//   ctx.bus   — optional event bus; not used by this file yet
//
// Formulas K2 expects from K1's engineering.js (pure functions):
//   eng.sunCos(solFraction)                                  -> cos of solar zenith, 0 at night
//   eng.solarPower({ irradiance, area, efficiency, cosZ, dust }) -> W
//   eng.surfaceTemp({ minC, maxC, solFraction })             -> outside temperature, °C
//   eng.heatingPower({ insideC, outsideC, insulation })      -> heater draw, W
//
// No gameplay numbers are written in this file. They all come from ctx.data or the design.

/** Read the number out of a nasa_data.json row ({ value, src, ... }) or a plain number. */
export function val(row) {
  if (row && typeof row === 'object' && 'value' in row) return row.value;
  if (typeof row === 'number') return row;
  throw new Error(`survival: missing data value (${JSON.stringify(row)})`);
}

/**
 * Build the survival part of gameState from the Sol 0 design.
 * K1 merges these fields into the central gameState.
 *
 * design: { site, panelAreaM2, panelEfficiency, batteryKWh, insulation }
 */
export function createSurvivalState(design, data) {
  const batteryWh = design.batteryKWh * 1000;
  return {
    time: { sol: 1, solFraction: val(data.time.startSolFraction) },
    power: {
      batteryWh,                 // start full
      batteryCapacityWh: batteryWh,
      generationW: 0,
      loadW: 0,
      deficitW: 0,               // > 0 when the battery is empty and loads are not covered
      dust: 0,                   // 0..1, panel coverage
    },
    env: { outsideC: 0, insideC: val(data.thermal.habitatTargetC) },
    life: { o2Kg: val(data.life.o2StartKg) },
  };
}

/** Real seconds -> fraction of a sol. */
export function realSecondsToSol(seconds, data) {
  return seconds / val(data.time.solRealSeconds);
}

/** Fraction of a sol -> game hours (a sol is longer than an Earth day). */
export function solToGameHours(solAmount, data) {
  return solAmount * val(data.time.solHours);
}

/**
 * Advance the simulation by realDt seconds of real time.
 * Mutates state.time / state.power / state.env / state.life and returns state.
 */
export function step(state, realDt, ctx) {
  const { data, eng } = ctx;
  const dSol = realSecondsToSol(realDt, data);
  advanceTime(state, dSol);
  updateEnvironment(state, ctx);
  updatePower(state, solToGameHours(dSol, data), ctx);
  updateLife(state, dSol, data);
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
  const site = data.sites[state.design.site];
  state.env.outsideC = eng.surfaceTemp({
    minC: val(site.nightMinC),
    maxC: val(site.dayMaxC),
    solFraction: state.time.solFraction,
  });
}

function updatePower(state, dtHours, { data, eng }) {
  const p = state.power;
  const d = state.design;

  p.generationW = eng.solarPower({
    irradiance: val(data.solar.irradianceWm2),
    area: d.panelAreaM2,
    efficiency: d.panelEfficiency,
    cosZ: eng.sunCos(state.time.solFraction),
    dust: p.dust,
  });

  const heaterW = eng.heatingPower({
    insideC: state.env.insideC,
    outsideC: state.env.outsideC,
    insulation: d.insulation,
  });
  p.loadW = val(data.power.lifeSupportW) + heaterW;

  // Battery bookkeeping: surplus charges, shortfall drains, clamp to [0, capacity].
  const netWh = (p.generationW - p.loadW) * dtHours;
  const next = p.batteryWh + netWh;
  if (next < 0) {
    p.batteryWh = 0;
    p.deficitW = p.loadW - p.generationW; // power.js (M3) will shed loads from this
  } else {
    p.batteryWh = Math.min(next, p.batteryCapacityWh);
    p.deficitW = 0;
  }
}

function updateLife(state, dSol, data) {
  const use = val(data.life.o2KgPerCrewPerSol) * val(data.life.crew) * dSol;
  state.life.o2Kg = Math.max(0, state.life.o2Kg - use);
}

// ---------------------------------------------------------------------------
// Spend helpers for K6 (experiments, forensics). Each returns false and changes
// nothing if there is not enough of the resource.

/** Spend game time measured in game hours (advances the clock and the simulation). */
export function spendTime(state, gameHours, ctx) {
  const realSeconds = (gameHours / val(ctx.data.time.solHours)) * val(ctx.data.time.solRealSeconds);
  const stepSeconds = 1;
  let left = realSeconds;
  while (left > 0) {
    const dt = Math.min(stepSeconds, left);
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

/** Spend oxygen in kg. */
export function spendO2(state, kg) {
  if (state.life.o2Kg < kg) return false;
  state.life.o2Kg -= kg;
  return true;
}
