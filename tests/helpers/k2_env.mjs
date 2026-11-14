// Shared test setup for K2's tests (survival, events).
import { readFileSync } from 'node:fs';
import { createSurvivalState } from '../../src/systems/survival.js';
import { createEventState } from '../../src/systems/events.js';

export const data = JSON.parse(
  readFileSync(new URL('../fixtures/survival_data.json', import.meta.url)),
);

// Test doubles for K1's engineering.js. Rough shapes only, so the simulation can be
// exercised before the real formulas land. Replace with the real module when K1 publishes it.
export const eng = {
  // Sun up from 06:00 to 18:00 local (solFraction 0.25..0.75), peak at noon.
  sunCos: (f) => (f >= 0.25 && f <= 0.75 ? Math.sin(Math.PI * (f - 0.25) / 0.5) : 0),
  solarPower: ({ irradiance, area, efficiency, cosZ, dust }) => irradiance * area * efficiency * cosZ * (1 - dust),
  // Coldest just before dawn, warmest early afternoon.
  surfaceTemp: ({ minC, maxC, solFraction }) =>
    (minC + maxC) / 2 - ((maxC - minC) / 2) * Math.cos(2 * Math.PI * (solFraction - 0.1)),
  heatingPower: ({ insideC, outsideC, insulation }) =>
    Math.max(0, insideC - outsideC) * (insulation === 'thick' ? 10 : 20),
};

/** Minimal stand-in for K1's bus.js: records every emit. */
export function fakeBus() {
  const emitted = [];
  return { emitted, emit: (name, payload) => emitted.push({ name, payload }) };
}

export const design = {
  site: 'meridiani', panelAreaM2: 100, panelEfficiency: 0.25, batteryKWh: 40, insulation: 'thin',
};

export function newState(overrides = {}) {
  const d = { ...design, ...overrides };
  const s = createSurvivalState(d, data);
  s.design = d;
  s.events = createEventState();
  s.decisionLog = [];
  return s;
}
