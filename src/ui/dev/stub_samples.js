// DEV STUB (owner: K3) — sample payloads for the decision card and converter dev page.
// Every number is a placeholder. The real decision cards come from K2 (events.js) and the
// real converter numbers from K1's nasa_data.json, each with its `src`. `hint` says where
// the real value should come from.

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
        { type: 'resource', stat: 'batteryWh', delta: -4000 },
        { type: 'flag', key: 'greenhouseHeatingCut', value: true },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
    { id: 'manualHeat', labelKey: 'event.engineFreeze.option.manualHeat', resultKey: 'event.engineFreeze.result.manualHeat',
      effects: [
        { type: 'resource', stat: 'o2Kg', delta: -0.5 },
        { type: 'resource', stat: 'radiationMSv', delta: 0.3 },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
    { id: 'wait', labelKey: 'event.engineFreeze.option.wait', resultKey: 'event.engineFreeze.result.wait',
      effects: [
        { type: 'wait', sols: 1, estimate: { o2Kg: -1.68 } },
        { type: 'flag', key: 'engineFrozen', value: false },
      ] },
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
