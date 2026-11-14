// DEV STUB (owner: K3) — the shape design.js expects from K1's src/data/nasa_data.json.
// Every number is marked src: "PLACEHOLDER". None of them may ship: K1 replaces them with
// sourced values (NSSDCA, ELV Performance, Trajectory Browser, Planetary Fact Sheet) and
// sets verified: true. Notes in `hint` say where the real value should come from.

const P = (value, hint = '') => ({ value, src: 'PLACEHOLDER', verified: false, hint });

export const stubData = {
  rules: {
    maxInstruments: P(5, 'game rule (D-001)'),
    massMarginBonusPct: P(10, 'game rule: margin at or above this earns a bonus'),
    budgetMUSD: P(2400, 'game tuning'),
    baseMassKg: P(14000, 'habitat + ascent vehicle + consumables, simplified; K1 to set'),
    lifeSupportNightW: P(400, 'BVAD-based estimate; K1 to source'),
    nightHours: P(12.3, 'half a sol (24.66 h), Planetary Fact Sheet'),
    instrumentNightDuty: P(0.25, 'game tuning: share of instrument power used at night'),
  },

  objectives: [
    { id: 'forensic', scoreMultiplier: P(1.5, 'game tuning: forensic reports') },
    { id: 'science', scoreMultiplier: P(1.5, 'game tuning: experiments') },
    { id: 'balanced', scoreMultiplier: P(1.2, 'game tuning: both') },
  ],

  launchVehicles: [
    { id: 'atlas5', realName: 'Atlas V 541', costMUSD: P(240, 'K1: public cost estimate'), capacityKg: P(4100, 'ELV Performance, C3 for Mars') },
    { id: 'falconHeavy', realName: 'Falcon Heavy', costMUSD: P(500, 'K1: public cost estimate'), capacityKg: P(16800, 'ELV Performance / SpaceX, Mars') },
    { id: 'sls', realName: 'SLS Block 1', costMUSD: P(2000, 'K1: public cost estimate'), capacityKg: P(27000, 'K1: NASA SLS reference, TMI') },
  ],

  trajectories: [
    { id: 'hohmann', transitDays: P(259, 'Trajectory Browser'), massKg: P(0, 'baseline'), costMUSD: P(0, 'baseline') },
    { id: 'fast', transitDays: P(180, 'Trajectory Browser'), massKg: P(2200, 'extra propellant, rocket equation; K1'), costMUSD: P(60, 'game tuning') },
  ],

  landingSites: [
    { id: 'meridiani', latitudeDeg: P(-2, 'Opportunity landing site, NSSDCA'), nightMinC: P(-80, 'K1: REMS/MEDA range'), heatingNightW: P(900, 'game tuning by night temperature') },
    { id: 'jezero', latitudeDeg: P(18.4, 'Perseverance landing site, NSSDCA'), nightMinC: P(-85, 'K1: MEDA'), heatingNightW: P(1000, 'game tuning') },
    { id: 'arcadia', latitudeDeg: P(40, 'mid-latitude ice, K1 to source'), nightMinC: P(-100, 'K1: source'), heatingNightW: P(1300, 'game tuning') },
  ],

  powerSources: [
    { id: 'solar', massKg: P(600, 'SST SoA panel W/kg; K1'), costMUSD: P(40, 'game tuning'), continuousW: P(0, '') },
    { id: 'solarRtg', massKg: P(645, 'panels + MMRTG ~45 kg, NSSDCA'), costMUSD: P(190, 'game tuning'), continuousW: P(110, 'MMRTG ~110 W at start, NASA RPS'), },
  ],

  batteries: [
    { id: 'b20', capacityKWh: P(20, 'game choice'), massKg: P(133, '150 Wh/kg Li-ion, SST SoA'), costMUSD: P(10, 'game tuning') },
    { id: 'b40', capacityKWh: P(40, 'game choice'), massKg: P(267, '150 Wh/kg Li-ion, SST SoA'), costMUSD: P(20, 'game tuning') },
    { id: 'b60', capacityKWh: P(60, 'game choice'), massKg: P(400, '150 Wh/kg Li-ion, SST SoA'), costMUSD: P(30, 'game tuning') },
  ],

  insulation: [
    { id: 'thin', massKg: P(100, 'game tuning'), costMUSD: P(5, 'game tuning'), heatingFactor: P(1.0, 'game tuning') },
    { id: 'thick', massKg: P(450, 'game tuning'), costMUSD: P(15, 'game tuning'), heatingFactor: P(0.5, 'game tuning: halves night heating') },
  ],

  instruments: [
    { id: 'camera', realName: 'Mastcam-Z', massKg: P(4, 'NSSDCA'), powerW: P(17, 'NSSDCA'), mbitPerUse: P(20, 'game tuning'), costMUSD: P(20, 'game tuning') },
    { id: 'meda', realName: 'MEDA', massKg: P(5.5, 'NSSDCA'), powerW: P(17, 'NSSDCA'), mbitPerUse: P(1, 'game tuning'), costMUSD: P(15, 'game tuning') },
    { id: 'seis', realName: 'SEIS (InSight)', massKg: P(30, 'NSSDCA'), powerW: P(8, 'NSSDCA'), mbitPerUse: P(5, 'game tuning'), costMUSD: P(35, 'game tuning') },
    { id: 'rad', realName: 'RAD', massKg: P(1.6, 'NSSDCA'), powerW: P(4, 'NSSDCA'), mbitPerUse: P(1, 'game tuning'), costMUSD: P(10, 'game tuning') },
    { id: 'rimfax', realName: 'RIMFAX', massKg: P(3, 'NSSDCA'), powerW: P(10, 'NSSDCA'), mbitPerUse: P(10, 'game tuning'), costMUSD: P(15, 'game tuning') },
    { id: 'spectrometer', realName: 'SuperCam / PIXL', massKg: P(11, 'NSSDCA'), powerW: P(18, 'NSSDCA'), mbitPerUse: P(8, 'game tuning'), costMUSD: P(30, 'game tuning') },
    { id: 'moxie', realName: 'MOXIE', massKg: P(17, 'NSSDCA'), powerW: P(300, 'NSSDCA'), mbitPerUse: P(0, ''), costMUSD: P(40, 'game tuning') },
    { id: 'plantChamber', realName: 'Veggie-like', massKg: P(8, 'game value, simplified'), powerW: P(100, 'game value, simplified'), mbitPerUse: P(2, 'game tuning'), costMUSD: P(15, 'game tuning') },
    { id: 'drone', realName: 'Ingenuity-like', massKg: P(1.8, 'NSSDCA'), powerW: P(0, 'charged in daytime only'), mbitPerUse: P(15, 'game tuning'), costMUSD: P(25, 'game tuning') },
  ],

  comms: [
    { id: 'relay', mbitPerSol: P(400, 'K1: MRO/MAVEN UHF pass capacity, simplified'), massKg: P(20, 'game tuning'), costMUSD: P(20, 'game tuning') },
    { id: 'relayX', mbitPerSol: P(550, 'relay + X-band direct-to-Earth, simplified'), massKg: P(60, 'game tuning'), costMUSD: P(70, 'game tuning') },
  ],

  spareKits: [
    { id: 'k0', massKg: P(0, ''), costMUSD: P(0, '') },
    { id: 'k1', massKg: P(150, 'game tuning'), costMUSD: P(10, 'game tuning') },
    { id: 'k2', massKg: P(300, 'game tuning'), costMUSD: P(20, 'game tuning') },
  ],
};
