// power.js — K2: load prioritisation and load shedding (M3).
//
// Every load the habitat can power, in the player's priority order (top = most important).
// When the battery is empty and generation cannot cover the loads, loads are switched off
// from the bottom of the list until the rest fit (real-world "load shedding", what
// Opportunity did in the 2018 storm). When the battery has refilled to
// rules.powerRestoreFraction of capacity, shed loads come back one per step, top first.
//
// Life support is pinned to the top and is never shed.
//
// State, in K1's state.power (D-003):
//   order[]      load ids, top first
//   off{}        id -> true while that load is shed
//   experimentW  extra draw set by K6 while an experiment runs
//
// For K3's power panel: getPowerStatus(state, ctx) and setOrder(state, order).
// Other systems ask isOn(state, id) before using a load (e.g. MOXIE output, greenhouse heat).

import { val, rowVal, designRows } from './simData.js';

export const LOAD_IDS = Object.freeze(['lifeSupport', 'heating', 'greenhouse', 'moxie', 'experiments', 'comms']);
const PINNED = new Set(['lifeSupport']);

// Which load each instrument from nasa_data.json feeds. Instruments not listed here
// (camera, rimfax, spectrometer, drone) draw power only while used; K6 adds that via experimentW.
const INSTRUMENT_LOAD = Object.freeze({
  plantChamber: 'greenhouse',
  moxie: 'moxie',
  meda: 'experiments',
  seis: 'experiments',
  rad: 'experiments',
});

export function initPower(state) {
  Object.assign(state.power, { order: [...LOAD_IDS], off: {}, experimentW: 0 });
  return state;
}

function sunUp(state, { data, eng }, site) {
  return eng.sunCos(state.time.solFraction, rowVal(site, 'latitudeDeg')) > 0;
}

/** Draw of every load in W, in priority order: [{ id, watts, on, pinned }]. */
export function computeLoads(state, ctx) {
  const { data, eng } = ctx;
  const d = designRows(state, data);
  const watts = Object.fromEntries(LOAD_IDS.map((id) => [id, 0]));

  // DRA 5.0's 12 kWe habitat figure already includes thermal control (K1 decision), so heating
  // draws nothing extra. Shedding it, or running out of power, lets the habitat cool (survival.js).
  watts.lifeSupport = val(data.rules.habitatPowerW, 'rules.habitatPowerW');
  watts.heating = 0;
  // The relay radio is always listening: Electra-Lite standby draw.
  watts.comms = rowVal(d.comms, 'standbyW', { optional: true });

  // Same rule as the Sol 0 estimate (evaluateDesign): instruments run at night only if
  // rules.instrumentsAtNight is set, so the night the player lives matches the night the design screen promised.
  const instrumentsRun = sunUp(state, ctx, d.site) || Boolean(data.rules.instrumentsAtNight?.value);
  if (instrumentsRun) {
    for (const inst of d.instruments) {
      const load = INSTRUMENT_LOAD[inst.id];
      if (load) watts[load] += rowVal(inst, 'powerW', { optional: true });
    }
  }
  watts.experiments += state.power.experimentW;

  return state.power.order.map((id) => ({
    id,
    watts: watts[id],
    on: !state.power.off[id],
    pinned: PINNED.has(id),
  }));
}

export function sumOn(loads) {
  return loads.reduce((sum, l) => sum + (l.on ? l.watts : 0), 0);
}

/**
 * Called by survival.step() after the battery update.
 * Sheds loads (bottom first) when the battery is empty and generation < load;
 * restores one shed load per step (top first) once the battery is back above the threshold.
 * Updates state.power.loadW / deficitW to match. Emits power:shed when loads are switched off.
 */
export function updateShedding(state, ctx) {
  const p = state.power;
  const loads = computeLoads(state, ctx);
  const gen = p.generationW;

  if (p.batteryWh <= 0 && sumOn(loads) > gen) {
    const shed = [];
    for (let i = loads.length - 1; i >= 0 && sumOn(loads) > gen; i--) {
      const l = loads[i];
      if (!l.on || l.pinned || l.watts === 0) continue;
      l.on = false;
      p.off[l.id] = true;
      shed.push(l.id);
    }
    if (shed.length) {
      ctx.bus?.emit('power:shed', {
        sol: state.time.sol,
        solFraction: state.time.solFraction,
        shed,
        generationW: gen,
        loadW: sumOn(loads),
      });
    }
  } else {
    const restoreAt = val(ctx.data.rules.powerRestoreFraction, 'rules.powerRestoreFraction') * p.batteryCapacityWh;
    if (p.batteryWh >= restoreAt) {
      const next = loads.find((l) => !l.on);
      if (next) {
        next.on = true;
        delete p.off[next.id];
      }
    }
  }

  p.loadW = sumOn(loads);
  p.deficitW = p.batteryWh <= 0 ? Math.max(0, p.loadW - gen) : 0;
}

/** True unless the load is currently shed. */
export function isOn(state, id) {
  return !state.power.off[id];
}

/**
 * Player reorders the list (K3's drag-and-drop). Must contain every load id exactly once,
 * and pinned loads must stay at the top. Returns false and changes nothing otherwise.
 */
export function setOrder(state, order) {
  const valid =
    order.length === LOAD_IDS.length &&
    new Set(order).size === LOAD_IDS.length &&
    order.every((id) => LOAD_IDS.includes(id)) &&
    [...PINNED].every((id, i) => order[i] === id);
  if (!valid) return false;
  state.power.order.splice(0, LOAD_IDS.length, ...order); // in place: others may hold this array
  return true;
}

/** K6: set the extra draw of a running experiment in W (0 when it stops). */
export function setExperimentLoad(state, watts) {
  state.power.experimentW = Math.max(0, watts);
}

/** Snapshot for K3's power panel and HUD. */
export function getPowerStatus(state, ctx) {
  const p = state.power;
  return {
    generationW: p.generationW,
    loadW: p.loadW,
    deficitW: p.deficitW,
    batteryWh: p.batteryWh,
    batteryCapacityWh: p.batteryCapacityWh,
    loads: computeLoads(state, ctx),
  };
}
