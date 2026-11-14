// DEV STUB (owner: K3) — what the Sol 0 screen reads from K1's src/data/nasa_data.json,
// written in K1's format: scalar entries are {value, unit, src, verified}; table rows carry src.
//
// Tables K1's file already has (rockets, trajectories, landingSites, instruments, tuning) use K1's
// field names. Fields and tables K1's file does not have yet are marked "NEW" below: they are
// K3's request to K1. Every number marked src "PLACEHOLDER" is a dev value only; `note` says
// where the real one should come from.

const PH = 'PLACEHOLDER';
const S = (value, unit, note = '') => ({ value, unit, note, src: PH, verified: false });

export const stubData = {
  mars: {
    solLength: { value: 24.6597, unit: 'h', src: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html', verified: true },
  },

  power: {
    rtgOutput: S(110, 'W', 'MMRTG; K1 already has this entry'),
    rtgMass: S(45, 'kg', 'MMRTG; K1 already has this entry'),
  },

  // NEW: mission-level numbers for the Sol 0 bars.
  mission: {
    budget_musd: S(2400, 'M$', 'game tuning'),
    baseMass_kg: S(14000, 'kg', 'habitat + ascent vehicle + consumables, simplified'),
    nightLifeSupport_W: S(400, 'W', 'life support draw at night; BVAD-based estimate'),
    instrumentNightDuty: S(0.25, '', 'game tuning: share of instrument power used at night'),
  },

  tuning: {
    maxInstruments: { value: 5, unit: '', src: 'game: DECISIONS.md D-001', verified: true },
    massMarginBonusThreshold: { value: 0.1, unit: '', src: 'game: design doc v2 (NASA-style margin rule)', verified: true },
  },

  // K1 has rocketA/B/C with 0 values. Dev values below; NEW field: none.
  rockets: [
    { id: 'atlas5', name: 'Atlas V 541', capacityToMars_kg: 4100, cost_musd: 240, note: 'ELV Performance, C3 for Mars', src: PH, verified: false },
    { id: 'falconHeavy', name: 'Falcon Heavy', capacityToMars_kg: 16800, cost_musd: 500, note: 'SpaceX, Mars', src: PH, verified: false },
    { id: 'sls', name: 'SLS Block 1', capacityToMars_kg: 27000, cost_musd: 2000, note: 'NASA SLS reference, TMI', src: PH, verified: false },
  ],

  // K1 fields + NEW: mass_kg (extra propellant), cost_musd.
  trajectories: [
    { id: 'hohmann', transit_days: 240, mass_kg: 0, cost_musd: 0, src: PH, verified: false },
    { id: 'fast', transit_days: 180, mass_kg: 2200, cost_musd: 60, note: 'extra propellant, rocket equation', src: PH, verified: false },
  ],

  // K1 fields + NEW: heatingNight_W.
  landingSites: [
    { id: 'meridiani', name: 'Meridiani Planum', latitude_deg: -2, nightMin_C: -80, heatingNight_W: 900, src: PH, verified: false },
    { id: 'jezero', name: 'Jezero Crater', latitude_deg: 18.4, nightMin_C: -85, heatingNight_W: 1000, src: PH, verified: false },
    { id: 'arcadia', name: 'Arcadia Planitia', latitude_deg: 40, nightMin_C: -100, heatingNight_W: 1300, src: PH, verified: false },
  ],

  // NEW table. solarArea_m2 fills gameState.design.power.solarArea_m2 (the player does not pick an area).
  powerOptions: [
    { id: 'solar', solarArea_m2: 60, rtg: false, mass_kg: 600, cost_musd: 40, src: PH, verified: false },
    { id: 'solarRtg', solarArea_m2: 60, rtg: true, mass_kg: 600, cost_musd: 190, note: 'RTG mass and output come from power.rtgMass / rtgOutput', src: PH, verified: false },
  ],

  // NEW table. capacity_kWh fills gameState.design.power.battery_kWh.
  batteries: [
    { id: 'b20', capacity_kWh: 20, mass_kg: 133, cost_musd: 10, note: '150 Wh/kg Li-ion, SST SoA', src: PH, verified: false },
    { id: 'b40', capacity_kWh: 40, mass_kg: 267, cost_musd: 20, note: '150 Wh/kg Li-ion, SST SoA', src: PH, verified: false },
    { id: 'b60', capacity_kWh: 60, mass_kg: 400, cost_musd: 30, note: '150 Wh/kg Li-ion, SST SoA', src: PH, verified: false },
  ],

  // NEW table. ids match gameState.design.insulation ('thin' | 'thick').
  insulation: [
    { id: 'thin', mass_kg: 100, cost_musd: 5, heatingFactor: 1.0, src: PH, verified: false },
    { id: 'thick', mass_kg: 450, cost_musd: 15, heatingFactor: 0.5, note: 'game tuning: halves night heating', src: PH, verified: false },
  ],

  // K1 fields + NEW: cost_musd.
  instruments: [
    { id: 'cameraHires', realCounterpart: 'Mastcam-Z', mass_kg: 4, power_W: 17, data_Mbit: 20, cost_musd: 20, src: PH, verified: false },
    { id: 'weather', realCounterpart: 'MEDA', mass_kg: 5.5, power_W: 17, data_Mbit: 1, cost_musd: 15, src: PH, verified: false },
    { id: 'seismometer', realCounterpart: 'SEIS (InSight)', mass_kg: 30, power_W: 8, data_Mbit: 5, cost_musd: 35, src: PH, verified: false },
    { id: 'radiation', realCounterpart: 'RAD (Curiosity)', mass_kg: 1.6, power_W: 4, data_Mbit: 1, cost_musd: 10, src: PH, verified: false },
    { id: 'radar', realCounterpart: 'RIMFAX', mass_kg: 3, power_W: 10, data_Mbit: 10, cost_musd: 15, src: PH, verified: false },
    { id: 'spectrometer', realCounterpart: 'SuperCam / PIXL', mass_kg: 11, power_W: 18, data_Mbit: 8, cost_musd: 30, src: PH, verified: false },
    { id: 'moxie', realCounterpart: 'MOXIE', mass_kg: 17, power_W: 300, data_Mbit: 0, cost_musd: 40, src: PH, verified: false },
    { id: 'plantChamber', realCounterpart: 'Veggie-like chamber', mass_kg: 8, power_W: 100, data_Mbit: 2, cost_musd: 15, simplified: true, src: PH, verified: false },
    { id: 'drone', realCounterpart: 'Ingenuity', mass_kg: 1.8, power_W: 0, data_Mbit: 15, cost_musd: 25, src: PH, verified: false },
  ],

  // NEW table. ids match gameState.design.comms ('relay' | 'relayDte').
  commsOptions: [
    { id: 'relay', dataPerSol_Mbit: 400, mass_kg: 20, cost_musd: 20, note: 'MRO/MAVEN UHF passes, simplified', src: PH, verified: false },
    { id: 'relayDte', dataPerSol_Mbit: 550, mass_kg: 60, cost_musd: 70, note: 'relay + X-band direct to Earth, simplified', src: PH, verified: false },
  ],

  // NEW table. count fills gameState.design.spareKits.
  spareKits: [
    { id: 'k0', count: 0, mass_kg: 0, cost_musd: 0, src: 'game: no kit', verified: true },
    { id: 'k1', count: 1, mass_kg: 150, cost_musd: 10, src: PH, verified: false },
    { id: 'k2', count: 2, mass_kg: 300, cost_musd: 20, src: PH, verified: false },
  ],
};
