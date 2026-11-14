// Shared test setup for K2's tests (survival, events).
import { readFileSync } from 'node:fs';
import { initSurvival } from '../../src/systems/survival.js';
import { initEvents } from '../../src/systems/events.js';

export const data = JSON.parse(
  readFileSync(new URL('../fixtures/survival_data.json', import.meta.url)),
);

// Test doubles for K1's engineering.js. solarPower_W matches K1's real signature;
// the other three are requested from K1 and only have rough shapes here.
export const eng = {
  solarPower_W: ({ irradiance_Wm2, area_m2, efficiency, cosZenith, dustLoss = 0 }) =>
    irradiance_Wm2 * area_m2 * efficiency * Math.max(0, cosZenith) * (1 - dustLoss),
  // Requested: sun up from 06:00 to 18:00 local (timeOfSol 0.25..0.75), peak at noon.
  sunCosZenith: (f) => (f >= 0.25 && f <= 0.75 ? Math.sin(Math.PI * (f - 0.25) / 0.5) : 0),
  // Requested: coldest just before dawn, warmest early afternoon.
  surfaceTemp_C: ({ min_C, max_C, timeOfSol }) =>
    (min_C + max_C) / 2 - ((max_C - min_C) / 2) * Math.cos(2 * Math.PI * (timeOfSol - 0.1)),
  // Requested: heater draw grows with the inside/outside gap; thick insulation halves it.
  heatingPower_W: ({ inside_C, outside_C, insulation }) =>
    Math.max(0, inside_C - outside_C) * (insulation === 'thick' ? 10 : 20),
};

/** Minimal stand-in for K1's bus.js: records every emit. */
export function fakeBus() {
  const emitted = [];
  return { emitted, emit: (name, payload) => emitted.push({ name, payload }) };
}

/**
 * The parts of K1's createState() (src/core/state.js, enes branch) that K2 touches.
 * Replace with the real createState() once K1's files are on main.
 */
function k1State() {
  return {
    sol: 0,
    timeOfSol: 0,
    design: {
      landingSiteId: null,
      power: { solarArea_m2: 0, rtg: false, battery_kWh: 0 },
      insulation: null,
    },
    resources: { oxygen_kg: 0, energy_kWh: 0, radiation_mSv: 0 },
    decisionLog: [],
  };
}

export function newState({ landingSiteId = 'meridiani', solarArea_m2 = 100, battery_kWh = 40, insulation = 'thin' } = {}) {
  const s = k1State();
  s.design.landingSiteId = landingSiteId;
  s.design.power.solarArea_m2 = solarArea_m2;
  s.design.power.battery_kWh = battery_kWh;
  s.design.insulation = insulation;
  initSurvival(s, data);
  initEvents(s);
  return s;
}
