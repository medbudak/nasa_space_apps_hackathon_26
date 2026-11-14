// DEV STUB (owner: K3) — sample payloads for the decision card and converter dev page.
// Every number is a placeholder. The real decision cards come from K2 (events.js) and the
// real converter numbers from K1's nasa_data.json, each with its `src`. `hint` says where
// the real value should come from.

import { fallTime, pendulumPeriod } from '../../core/engineering.js';

const P = (value, hint = '') => ({ value, src: 'PLACEHOLDER', verified: false, hint });
const v = (row) => row.value;

// A `decision:open` card in K2's format (src/systems/events.js on the sude branch, engineFreeze).
// `resultKey` is the one field K3 asked K2 to add.
export const sampleEngineFreeze = {
  eventId: 'engineFreeze',
  sol: 3,
  titleKey: 'event.engineFreeze.title',
  bodyKey: 'event.engineFreeze.body',
  options: [
    { id: 'batteryHeat', labelKey: 'event.engineFreeze.option.batteryHeat', resultKey: 'event.engineFreeze.result.batteryHeat',
      effects: [
        { type: 'resource', stat: 'energy_kWh', delta: -4 },
        { type: 'flag', key: 'greenhouseHeatingCut', value: true },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
    { id: 'manualHeat', labelKey: 'event.engineFreeze.option.manualHeat', resultKey: 'event.engineFreeze.result.manualHeat',
      effects: [
        { type: 'resource', stat: 'oxygen_kg', delta: -0.5 },
        { type: 'resource', stat: 'radiation_mSv', delta: 0.3 },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
    { id: 'wait', labelKey: 'event.engineFreeze.option.wait', resultKey: 'event.engineFreeze.result.wait',
      effects: [
        { type: 'wait', sols: 1, estimate: { oxygen_kg: -1.68 } },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
  ],
};

// K2's noReturn card (M4) as events.js sends it: vars for the texts, an estimate-only option,
// a wait in hours, and an option that cannot be chosen (moved to `unavailable`).
export const sampleNoReturn = {
  eventId: 'noReturn',
  sol: 5,
  titleKey: 'event.noReturn.title',
  bodyKey: 'event.noReturn.body',
  vars: { suitO2Kg: 0.42, requiredO2Kg: 0.55, distanceM: 640, speedPct: 60 },
  options: [
    { id: 'slowWalk', labelKey: 'event.noReturn.option.slowWalk',
      effects: [{ type: 'estimate', suitO2Kg: -0.38, safetyMarginLeft: false }, { type: 'flag', key: 'walkedWithoutMargin', value: true }] },
    { id: 'suitHeater', labelKey: 'event.noReturn.option.suitHeater',
      effects: [
        { type: 'eva', set: { speedFactor: 1, jointsFrozen: false, thawed: true } },
        { type: 'resource', stat: 'energy_kWh', delta: -1.2 },
        { type: 'estimate', suitO2Kg: -0.23 },
      ] },
  ],
  unavailable: [
    { id: 'shelterWreck', labelKey: 'event.noReturn.option.shelterWreck', disabledKey: 'event.noReturn.option.shelterWreck.disabled' },
  ],
};

// Mimics K2's resolveDecision(): builds the log entry and emits decision:made.
export function withChoose(card, bus) {
  return {
    ...card,
    choose(choiceId) {
      const option = card.options.find((o) => o.id === choiceId);
      bus.emit('decision:made', { sol: card.sol, eventId: card.eventId, choice: choiceId, effects: option.effects });
    },
  };
}

// Converter numbers, in the nasa_data.json row shape.
const conv = {
  iceMelt: {
    waterPerKg: P(1, 'mass is conserved when ice melts'),
    whPerKg: P(130, 'K1: latent heat of fusion 334 kJ/kg + warming from about −60 °C'),
    minutesPerKg: P(20, 'game tuning'),
  },
  electrolysis: {
    o2PerKg: P(0.888, 'K1: 2 H2O -> 2 H2 + O2, molar masses (O2 32.00 / 2 H2O 36.03)'),
    h2PerKg: P(0.112, 'K1: same reaction (2 H2 4.03 / 2 H2O 36.03)'),
    whPerKg: P(6000, 'K1: real electrolyser energy per kg water'),
    minutesPerKg: P(60, 'game tuning'),
  },
  soilWash: {
    soilPerKg: P(0.9, 'game tuning: some fines are lost when washing'),
    whPerKg: P(40, 'game tuning: pump and heater'),
    minutesPerKg: P(10, 'game tuning'),
  },
};

// `minigame:open` configs built from those rows, the way a caller would build them.
export const sampleConverters = {
  ice: {
    titleKey: 'converter.ice.title', introKey: 'converter.ice.intro',
    input: { key: 'ice', unit: 'kg', available: 6, step: 0.5 },
    outputs: [{ key: 'water', unit: 'kg', perUnit: v(conv.iceMelt.waterPerKg) }],
    whPerUnit: v(conv.iceMelt.whPerKg), minutesPerUnit: v(conv.iceMelt.minutesPerKg),
    energyAvailableWh: 2000, runSeconds: 3,
  },
  electrolysis: {
    titleKey: 'converter.electrolysis.title', introKey: 'converter.electrolysis.intro',
    input: { key: 'water', unit: 'kg', available: 4, step: 0.25 },
    outputs: [
      { key: 'o2', unit: 'kg', perUnit: v(conv.electrolysis.o2PerKg) },
      { key: 'h2', unit: 'kg', perUnit: v(conv.electrolysis.h2PerKg) },
    ],
    whPerUnit: v(conv.electrolysis.whPerKg), minutesPerUnit: v(conv.electrolysis.minutesPerKg),
    energyAvailableWh: 12000, runSeconds: 4,
  },
  soil: {
    titleKey: 'converter.soil.title', introKey: 'converter.soil.intro',
    input: { key: 'regolith', unit: 'kg', available: 20, step: 1 },
    outputs: [{ key: 'washedSoil', unit: 'kg', perUnit: v(conv.soilWash.soilPerKg) }],
    whPerUnit: v(conv.soilWash.whPerKg), minutesPerUnit: v(conv.soilWash.minutesPerKg),
    runSeconds: 3,
  },
};

export const sampleRows = conv;

// ---- downlink -------------------------------------------------------------
// Relay passes for one sol, in the shape mountDownlink/runDuePasses read. MRO's volume is K1's sourced
// telecom.mroMbitPerPass; the rest is placeholder until K1 adds pass times and MAVEN's volume.
export const downlinkRows = {
  mroMbitPerPass: { value: 221.2, src: 'nasa_data.json telecom.mroMbitPerPass (Discovery 2019 AO, Table 2-1)', verified: true },
  mavenMbitPerPass: P(278.8, 'K1: MAVEN relay volume per pass; dev value = relay 500 Mbit/sol minus MRO'),
  mroAtSolFraction: P(0.3, 'K1: game schedule for the pass time'),
  mavenAtSolFraction: P(0.75, 'K1: game schedule for the pass time'),
  earthDistanceKm: P(258900000, 'K1: Earth-Mars distance during the mission, precomputed from Horizons (scripts/)'),
  speedOfLightKms: { value: 299792.458, src: 'https://physics.nist.gov/cgi-bin/cuu/Value?c', verified: true },
};

export const samplePasses = [
  { id: 'mro', name: 'MRO', atSolFraction: v(downlinkRows.mroAtSolFraction), mbit: v(downlinkRows.mroMbitPerPass) },
  { id: 'maven', name: 'MAVEN', atSolFraction: v(downlinkRows.mavenAtSolFraction), mbit: v(downlinkRows.mavenMbitPerPass) },
];

// downlink:queue packets (D-003 shape { type, id, mbit, points } + optional labelKey). Sizes and points
// are placeholders; the real ones come from K6 (forensics, experiments) and K2.
export const samplePackets = [
  { type: 'photo', id: 'photo-opportunity', mbit: 148, points: 20, labelKey: 'downlink.sample.photoOpportunity' },
  { type: 'report', id: 'report-opportunity', mbit: 12, points: 100, labelKey: 'downlink.sample.reportOpportunity' },
  { type: 'experiment', id: 'exp-pendulum', mbit: 2, points: 60, labelKey: 'downlink.sample.pendulum' },
  { type: 'family', id: 'family-1', mbit: 300, points: 0, labelKey: 'downlink.sample.family' },
];

// ---- align -------------------------------------------------------------------
// `minigame:open` configs for the three uses. The targets would be rolled with the seeded RNG by the
// caller; the rest are game tuning values, to be moved into nasa_data.json by K1.
export const alignRows = {
  antennaBeamWidthDeg: P(12, 'game tuning: simplified beam, wide enough to find by ear'),
  photoBeamWidthDeg: P(20, 'game tuning'),
  successPct: P(90, 'game tuning (K3 draft)'),
  holdSeconds: P(1, 'game tuning (K3 draft)'),
  timeLimitSeconds: P(20, 'game tuning (K3 draft)'),
};

export const sampleAligns = {
  panel: {
    mode: 'panel', titleKey: 'align.panel.title', introKey: 'align.panel.intro', response: 'cos',
    minDeg: 0, maxDeg: 90, startDeg: 5, targetDeg: 62, stepDeg: 1,
    successPct: 98, holdSeconds: v(alignRows.holdSeconds), timeLimitSeconds: v(alignRows.timeLimitSeconds),
  },
  antenna: {
    mode: 'antenna', titleKey: 'align.antenna.title', introKey: 'align.antenna.intro', response: 'beam',
    beamWidthDeg: v(alignRows.antennaBeamWidthDeg), minDeg: 0, maxDeg: 360, startDeg: 0, targetDeg: 217, stepDeg: 1,
    successPct: v(alignRows.successPct), holdSeconds: v(alignRows.holdSeconds), timeLimitSeconds: v(alignRows.timeLimitSeconds),
  },
  photo: {
    mode: 'photo', titleKey: 'align.photo.title', introKey: 'align.photo.intro', response: 'beam',
    beamWidthDeg: v(alignRows.photoBeamWidthDeg), minDeg: -60, maxDeg: 60, startDeg: -50, targetDeg: 18, stepDeg: 1,
    successPct: v(alignRows.successPct), holdSeconds: v(alignRows.holdSeconds),
  },
};

// ---- qte -----------------------------------------------------------------------
// Durations are computed the way a caller (K2, K6) would: with engineering.js and nasa_data.json values.
export const qteRows = {
  marsGravity: { value: 3.73, src: 'nasa_data.json mars.gravity (NSSDCA Mars Fact Sheet)', verified: true },
  earthGravity: { value: 9.80665, src: 'nasa_data.json constants.g0 (NIST)', verified: true },
  tolerance: { value: 0.1, src: 'nasa_data.json rules.experimentTolerance (D-006)', verified: true },
  shelfHeightM: P(1.5, 'game tuning: shelf above the hand'),
  catchWindow: P(0.3, 'game tuning: share of the drop height counted as in the hand (0.3 = about the last 150 ms of a 0.9 s fall)'),
  pendulumLengthM: P(1, 'K6: experiment setting'),
  dropHeightM: { value: 2, src: 'experiments_config.json freefall.dropHeightM (K6)', verified: false },
  soundDistanceM: { value: 50, src: 'experiments_config.json speed_of_sound.distanceM (K6)', verified: false },
  soundSpeedMarsMs: { value: 240, src: 'experiments_config.json speed_of_sound.expectedMarsSpeedMs (K6)', verified: false },
};
const g = v(qteRows.marsGravity);

export const sampleQtes = {
  catch: {
    mode: 'catch', titleKey: 'qte.catch.title', introKey: 'qte.catch.intro',
    eventSeconds: fallTime(v(qteRows.shelfHeightM), g),
    compareSeconds: fallTime(v(qteRows.shelfHeightM), v(qteRows.earthGravity)),
    catchWindow: v(qteRows.catchWindow), rounds: 3, needed: 2, delaysSeconds: [1.2, 0.7, 1.6],
  },
  pendulum: {
    mode: 'stopwatch', scene: 'pendulum', titleKey: 'qte.pendulum.title', introKey: 'qte.pendulum.intro',
    eventSeconds: pendulumPeriod(v(qteRows.pendulumLengthM), g), cycles: 10, trials: 1, tolerance: v(qteRows.tolerance),
  },
  drop: {
    mode: 'stopwatch', scene: 'drop', titleKey: 'qte.drop.title', introKey: 'qte.drop.intro',
    eventSeconds: fallTime(v(qteRows.dropHeightM), g), trials: 3, tolerance: v(qteRows.tolerance), delaysSeconds: [1.5, 1.1, 1.8],
  },
  sound: {
    mode: 'stopwatch', scene: 'sound', titleKey: 'qte.sound.title', introKey: 'qte.sound.intro',
    eventSeconds: v(qteRows.soundDistanceM) / v(qteRows.soundSpeedMarsMs), trials: 3, tolerance: v(qteRows.tolerance),
    delaysSeconds: [1.4, 1.0, 1.7],
  },
};

// ---- wiring -----------------------------------------------------------------------
// Comms junction box. Electra-Lite (UHF relay radio) and the SDST (Small Deep Space Transponder, X-band) are the
// radios on NASA's Mars rovers; K5 checks the wording. `rightOrder` would be shuffled with the seeded RNG.
const pair = (id) => ({ id, leftKey: `wiring.comms.${id}.left`, rightKey: `wiring.comms.${id}.right`, hintKey: `wiring.comms.${id}.hint` });
export const sampleWiring = {
  titleKey: 'wiring.comms.title', introKey: 'wiring.comms.intro',
  pairs: ['uhf', 'xband', 'power', 'data'].map(pair),
  rightOrder: ['xband', 'data', 'uhf', 'power'],
  maxMistakes: 2,
  timeLimitSeconds: 40,
};
