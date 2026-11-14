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

import { val, rowVal, designRows, recordScore } from './simData.js';
import { initPower, computeLoads, sumOn, updateShedding, isOn } from './power.js';
import { createSanityState, updateSanity } from './sanity.js';

const hasInstrument = (state, id) => (state.design.instrumentIds ?? []).includes(id);

/**
 * Fill state.time / power / env / life for a new surface run, after Sol 0.
 * Call once when the surface scene starts a new run (not on a reload: they exist then).
 */
export function createSurvivalState(state, data) {
  const { battery, comms } = designRows(state, data);
  const capacityWh = rowVal(battery, 'capacityKWh') * 1000;

  // Data that can reach Earth per sol, from the comms choice made on Sol 0 (D-003 dataBudget).
  // An unresearched figure stays null so the HUD shows "?" instead of a false 0.
  if (state.dataBudget) {
    const perSol = comms?.mbitPerSol?.value;
    state.dataBudget.perSol = typeof perSol === 'number' ? perSol : null;
    state.dataBudget.used = 0;
  }

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
    // Plant chamber (only with the plantChamber instrument): growth 0..1 to the next harvest.
    greenhouse: hasInstrument(state, 'plantChamber') ? { growth: 0, harvests: 0, dead: false } : null,
  };
  initPower(state);
  createSanityState(state, data);
  return state;
}

/**
 * Game seconds that pass per real second right now (D-008).
 * Inside: a sol lasts time.solRealSeconds of real time. Outside (EVA): time runs slower,
 * time.evaGameSecondsPerRealSecond, so a walk takes visible time and the O2 notch matters.
 * There is one game clock: the Sun, heat, battery and O2 all follow this same rate.
 */
export function gameSecondsPerRealSecond(state, data) {
  if (state?.life?.eva?.outside) return val(data.time.evaGameSecondsPerRealSecond, 'time.evaGameSecondsPerRealSecond');
  return (val(data.mars.solHours, 'mars.solHours') * 3600) / val(data.time.solRealSeconds, 'time.solRealSeconds');
}

/** Real seconds -> game hours at the current rate (inside or outside). */
export function realSecondsToHours(seconds, data, state = null) {
  return (seconds * gameSecondsPerRealSecond(state, data)) / 3600;
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
  if (!(realDt > 0)) return state; // no time passed (never run backwards)
  return advanceHours(state, realSecondsToHours(realDt, ctx.data, state), ctx);
}

/**
 * Advance the simulation by game hours, whatever the real-time rate.
 * One call is one simulation step: keep dtHours small (spendTime splits long spans).
 */
export function advanceHours(state, dtHours, ctx) {
  if (state.life.loss || !(dtHours > 0)) return state;
  const solBefore = state.time.sol;
  advanceTime(state, dtHours / val(ctx.data.mars.solHours, 'mars.solHours'));
  // Every sol lived through scores survival points (scored as it happens, so the report card
  // can show when; amount from nasa_data.json, D-009).
  for (let sol = solBefore; sol < state.time.sol; sol++) {
    recordScore(state, {
      category: 'survival',
      pointsEntry: ctx.data.rules.survivalPointsPerSol,
      path: 'rules.survivalPointsPerSol',
      reason: 'consequence.solSurvived',
      sol,
    });
  }
  updateEnvironment(state, ctx);
  updatePower(state, dtHours, ctx);
  updateHabitatTemp(state, dtHours, ctx);
  updateRadiation(state, dtHours, ctx.data);
  updateLife(state, dtHours, ctx.data);
  updateEva(state, dtHours, ctx);
  updateBody(state, dtHours, ctx.data);
  const daylight = !isNight(state, ctx);
  updateMoxie(state, dtHours, ctx, daylight);
  updateGreenhouse(state, dtHours, ctx, daylight);
  updateSanity(state, dtHours, ctx, { daylight });
  updateStats(state, dtHours);
  checkLoss(state, ctx);
  return state;
}

// ---------------------------------------------------------------------------
// MOXIE: makes O2 from the CO2 atmosphere while it is installed, switched on and powered.
// It runs when the other instruments do (rules.instrumentsAtNight, as the Sol 0 estimate assumes).
// Its real output (instruments.moxie.o2GramsPerHour) is a small share of what one person
// breathes: the player sees that it helps, but cannot replace the O2 reserve.

function updateMoxie(state, dtHours, { data }, daylight) {
  if (!hasInstrument(state, 'moxie') || !isOn(state, 'moxie') || state.power.deficitW > 0) return;
  if (!daylight && !data.rules.instrumentsAtNight?.value) return;
  const moxie = designRows(state, data).instruments.find((r) => r.id === 'moxie');
  const kg = (rowVal(moxie, 'o2GramsPerHour') / 1000) * dtHours;
  state.life.o2Kg += kg;
  if (state.stats) state.stats.oxygenProducedKg += kg;
}

// ---------------------------------------------------------------------------
// Greenhouse (plant chamber). Plants grow while the chamber is on and lit; a full grow cycle is
// a harvest, which lifts sanity. Plants die of cold if the habitat air drops below
// greenhouse.frostC, or on a night when the player cut the greenhouse heating (engineFreeze card,
// option A). A dead greenhouse is a lost system on the report card, linked to its cause.

function updateGreenhouse(state, dtHours, ctx, daylight) {
  const gh = state.life.greenhouse;
  const g = ctx.data.greenhouse;
  if (!gh || gh.dead || !g) return;
  const flags = state.events?.flags ?? {};

  // A night without greenhouse heating kills the plants; by daylight the cut is over.
  if (flags.greenhouseHeatingCut && daylight) flags.greenhouseHeatingCut = false;
  const heatingCut = flags.greenhouseHeatingCut && !daylight;
  const tooCold = state.env.insideC < val(g.frostC, 'greenhouse.frostC');
  if (heatingCut || tooCold) {
    gh.dead = true;
    const cause = heatingCut ? 'decision.engineFreeze' : 'design.batteryId';
    recordScore(state, {
      category: 'lostSystems',
      pointsEntry: ctx.data.rules.greenhouseLostPoints,
      path: 'rules.greenhouseLostPoints',
      reason: 'consequence.greenhouseFroze',
      cause,
    });
    state.lostSystems?.push?.('greenhouse');
    state.decisionLog.push({ sol: state.time.sol, eventId: 'greenhouseFroze', choice: null, effects: [{ type: 'estimate', cause }] });
    return;
  }

  if (!daylight || !isOn(state, 'greenhouse') || state.power.deficitW > 0) return;
  gh.growth += dtHours / val(g.growHours, 'greenhouse.growHours');
  if (gh.growth >= 1) {
    gh.growth -= 1;
    gh.harvests += 1;
    if (typeof state.life.sanity === 'number') {
      state.life.sanity = Math.min(100, state.life.sanity + val(g.harvestSanityGain, 'greenhouse.harvestSanityGain'));
    }
    state.decisionLog.push({ sol: state.time.sol, eventId: 'harvest', choice: null, effects: [] });
  }
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

// While the habitat is fully powered and its heating is on, it holds its set point (simplified:
// it snaps back as soon as power returns). With heating shed, or loads left unpowered
// (deficitW > 0), it cools toward the outside temperature with the insulation's time constant.
function updateHabitatTemp(state, dtHours, { data, eng }) {
  const env = state.env;
  if (isOn(state, 'heating') && !(state.power.deficitW > 0)) {
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
    coolingTimeH: rowVal(designRows(state, data).insulation, 'coolingTimeH'),
  });
}

// Surface dose accumulates all the time (inside and outside; simplified, no habitat shielding).
// The source value is per Earth day (24 h).
function updateRadiation(state, dtHours, data) {
  state.life.radiationMSv += (val(data.radiation.surfaceMSvPerDay, 'radiation.surfaceMSvPerDay') * dtHours) / 24;
  state.life.radiationMSv += speDoseRate(state, data) * dtHours;
}

/**
 * Extra dose rate in mSv per game hour from a solar particle event going on (events.js 'spe').
 * In the shelter behind the water tanks it is cut by events.spe.shelterFactor; outside on an EVA
 * there is no shelter.
 */
export function speDoseRate(state, data) {
  if (!state.events?.active?.spe) return 0;
  const rate = val(data.events.spe.extraMSvPerHour, 'events.spe.extraMSvPerHour');
  const sheltered = state.events.flags.speShelter && !state.life.eva.outside;
  return sheltered ? rate * val(data.events.spe.shelterFactor, 'events.spe.shelterFactor') : rate;
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
    : state.env.insideC <= val(data.thermal.cabinMinC, 'thermal.cabinMinC');
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
    suitO2Kg: val(data.life.suitO2Kg, 'life.suitO2Kg'),
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
  return val(data.life.walkSpeedMs, 'life.walkSpeedMs') * state.life.eva.speedFactor;
}

function updateEva(state, dtHours, { data, eng }) {
  const eva = state.life.eva;
  if (!eva.outside) return;

  const o2PerHour = val(data.life.evaO2KgPerHour, 'life.evaO2KgPerHour');
  eva.suitO2Kg = Math.max(0, eva.suitO2Kg - o2PerHour * dtHours);

  if (!eva.jointsFrozen && !eva.thawed && state.env.outsideC <= val(data.thermal.actuatorMinC, 'thermal.actuatorMinC')) {
    eva.jointsFrozen = true;
    eva.speedFactor = val(data.life.jointFreezeSpeedFactor, 'life.jointFreezeSpeedFactor');
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
  } else if (life.body.coldHours >= val(data.loss.coldHours, 'loss.coldHours')) {
    reasonKey = 'loss.cold';
    values = { coldHours: val(data.loss.coldHours, 'loss.coldHours'), insideC: Math.round(state.env.insideC) };
  } else if (life.radiationMSv > val(data.loss.radiationLimitMSv, 'loss.radiationLimitMSv')) {
    reasonKey = 'loss.radiation';
    values = { doseMSv: Math.round(life.radiationMSv), limitMSv: val(data.loss.radiationLimitMSv, 'loss.radiationLimitMSv') };
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

// Longest single step spendTime takes, as a share of a sol (simulation accuracy, not gameplay):
// about 12 game minutes, the same size as one real second inside.
const MAX_STEP_SOL = 1 / 120;

/**
 * Spend game time in game hours; runs the simulation forward.
 * Counted in game hours, so it costs the same inside or outside (D-008).
 */
export function spendTime(state, hours, ctx) {
  const maxStep = MAX_STEP_SOL * val(ctx.data.mars.solHours, 'mars.solHours');
  let left = hours;
  while (left > 1e-12 && !state.life.loss) {
    const dt = Math.min(maxStep, left);
    advanceHours(state, dt, ctx);
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
