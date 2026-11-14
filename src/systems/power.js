// power.js — K2: load prioritisation and load shedding (M3).
//
// Every load the habitat can power, in the player's priority order (top = most important).
// When the battery is empty and the panels cannot cover the loads, loads are switched off
// from the bottom of the list until the rest fit (real-world "load shedding", what
// Opportunity did in the 2018 storm). When the battery has refilled to
// tuning.powerRestoreFraction of capacity, shed loads come back one per step, top first.
//
// Life support is pinned to the top and is never shed.
//
// State (K2's part of gameState, under state.sim.power):
//   order[]   load ids, top first
//   off{}     id -> true while that load is shed
//   experiment_W  extra draw set by K6 while an experiment runs
//
// For K3's power panel: getPowerStatus(state, ctx) and setOrder(state, order).
// Other systems ask isOn(state, id) before using a load (e.g. MOXIE output, greenhouse heat).

import { val, tableRow } from './simData.js';

export const LOAD_IDS = Object.freeze(['lifeSupport', 'heating', 'greenhouse', 'moxie', 'experiments', 'comms']);
const PINNED = new Set(['lifeSupport']);

// Which load each instrument from nasa_data.json feeds. Instruments not listed here
// (camera, radar, spectrometer, drone) draw power only while used; K6 adds that via experiment_W.
const INSTRUMENT_LOAD = Object.freeze({
  plantChamber: 'greenhouse',
  moxie: 'moxie',
  weather: 'experiments',
  seismometer: 'experiments',
  radiation: 'experiments',
});

export function initPower(state) {
  state.sim.power = { order: [...LOAD_IDS], off: {}, experiment_W: 0 };
  return state;
}

/** Draw of every load in W, in priority order: [{ id, watts, on, pinned }]. */
export function computeLoads(state, { data, eng }) {
  const watts = Object.fromEntries(LOAD_IDS.map((id) => [id, 0]));
  watts.lifeSupport = val(data.power.lifeSupport_W);
  watts.heating = eng.heatingPower_W({
    inside_C: state.sim.inside_C,
    outside_C: state.sim.outside_C,
    insulation: state.design.insulation,
  });
  watts.comms = val(data.power.comms_W);
  for (const id of state.design.instruments ?? []) {
    const load = INSTRUMENT_LOAD[id];
    if (load) watts[load] += tableRow(data, 'instruments', id).power_W;
  }
  watts.experiments += state.sim.power.experiment_W;

  return state.sim.power.order.map((id) => ({
    id,
    watts: watts[id],
    on: !state.sim.power.off[id],
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
 * Updates state.sim.load_W / deficit_W to match. Emits power:shed when loads are switched off.
 */
export function updateShedding(state, ctx) {
  const sim = state.sim;
  const off = sim.power.off;
  const loads = computeLoads(state, ctx);
  const gen = sim.generation_W;

  if (state.resources.energy_kWh <= 0 && sumOn(loads) > gen) {
    const shed = [];
    for (let i = loads.length - 1; i >= 0 && sumOn(loads) > gen; i--) {
      const l = loads[i];
      if (!l.on || l.pinned || l.watts === 0) continue;
      l.on = false;
      off[l.id] = true;
      shed.push(l.id);
    }
    if (shed.length) {
      ctx.bus?.emit('power:shed', {
        sol: state.sol,
        timeOfSol: state.timeOfSol,
        shed,
        generation_W: gen,
        load_W: sumOn(loads),
      });
    }
  } else {
    const restoreAt = val(ctx.data.tuning.powerRestoreFraction) * state.design.power.battery_kWh;
    if (state.resources.energy_kWh >= restoreAt) {
      const next = loads.find((l) => !l.on);
      if (next) {
        next.on = true;
        delete off[next.id];
      }
    }
  }

  sim.load_W = sumOn(loads);
  sim.deficit_W = state.resources.energy_kWh <= 0 ? Math.max(0, sim.load_W - gen) : 0;
}

/** True unless the load is currently shed. */
export function isOn(state, id) {
  return !state.sim.power.off[id];
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
  state.sim.power.order = [...order];
  return true;
}

/** K6: set the extra draw of a running experiment in W (0 when it stops). */
export function setExperimentLoad(state, watts) {
  state.sim.power.experiment_W = Math.max(0, watts);
}

/** Snapshot for K3's power panel and HUD. */
export function getPowerStatus(state, ctx) {
  return {
    generation_W: state.sim.generation_W,
    load_W: state.sim.load_W,
    deficit_W: state.sim.deficit_W,
    energy_kWh: state.resources.energy_kWh,
    capacity_kWh: state.design.power.battery_kWh,
    loads: computeLoads(state, ctx),
  };
}
