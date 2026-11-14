/**
 * SOL 14: RED HORIZON — Mühendislik ve Fizik Motoru (K1)
 * Tüm formüller data/nasa_data.json içindeki doğrulanmış NASA sabitlerini kullanır.
 */

import nasaData from './nasa_data.js';

export const NASA_DATA = nasaData;

/**
 * 1. Güneş Paneli Anlık Güç Üretimi (Watt)
 * Formül: P = S * A * eta * cos(Z) * (1 - d_toz)
 */
export function calcSolarPower({
  irradiance = nasaData.constants.solarIrradianceMarsWm2.mean,
  area = nasaData.habitatOptions.baseHabitat.solarAreaM2,
  efficiency = nasaData.habitatOptions.baseHabitat.solarEfficiency,
  cosZ = 0.85,
  dustFactor = 0.08
} = {}) {
  const clampedDust = Math.max(0, Math.min(0.95, dustFactor));
  const clampedCosZ = Math.max(0, Math.min(1, cosZ));
  const power = irradiance * area * efficiency * clampedCosZ * (1 - clampedDust);
  return Math.round(power * 10) / 10;
}

/**
 * 2. Tsiolkovsky Roket Denklemi (m/s)
 * Formül: Δv = I_sp * g_0 * ln(m_0 / m_f)
 */
export function calcDeltaV({
  isp = 365,
  wetMass = 7400,
  dryMass = 1750,
  g0 = nasaData.constants.marsGravityMs2.earthValue
} = {}) {
  if (wetMass <= 0 || dryMass <= 0 || wetMass <= dryMass) {
    return 0;
  }
  const dv = isp * g0 * Math.log(wetMass / dryMass);
  return Math.round(dv);
}

/**
 * 3. Dünya-Mars Tek Yön Işık Gecikmesi
 * Formül: t_gecikme = d_{Dünya-Mars} / c
 */
export function calcLightDelay(distanceKm) {
  const c = nasaData.constants.speedOfLightKms.value;
  const seconds = Math.max(0, Math.round(distanceKm / c));
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return {
    seconds,
    minutes: Math.round((seconds / 60) * 100) / 100,
    roundTripSeconds: seconds * 2,
    formatted: `${minutes} dk ${String(remSec).padStart(2, '0')} sn`,
    formattedEn: `${minutes}m ${String(remSec).padStart(2, '0')}s`
  };
}

/**
 * Sol numarasına göre JPL Horizons mesafe ve ışık gecikmesini döndürür
 */
export function getHorizonsForSol(sol = 1) {
  const table = nasaData.horizonsDistanceTable.bySol;
  const entry = table.find((r) => r.sol === sol) || table[table.length - 1];
  const distanceKm = entry.distanceMillionKm * 1e6;
  const delay = calcLightDelay(distanceKm);
  return {
    ...entry,
    distanceKm,
    ...delay
  };
}

/**
 * 4. Sarkaç Periyodu (Yerçekimi Deneyi)
 * Formül: T = 2 * pi * sqrt(L / g)
 */
export function calcPendulumPeriod(
  lengthMeters = 1.0,
  gravity = nasaData.constants.marsGravityMs2.value
) {
  if (lengthMeters <= 0 || gravity <= 0) return 0;
  const period = 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
  return Math.round(period * 100) / 100;
}

/**
 * 5. Serbest Düşüş Süresi (t = sqrt(2h / g))
 */
export function calcFreeFallTime(
  heightMeters = 2.0,
  gravity = nasaData.constants.marsGravityMs2.value
) {
  if (heightMeters <= 0 || gravity <= 0) return 0;
  const time = Math.sqrt((2 * heightMeters) / gravity);
  return Math.round(time * 100) / 100;
}

/**
 * 6. Dönüşsüzlük Noktası (Point of No Return) Oksijen Hesabı (M4)
 * Formül: O2_gerekli = (mesafe / hiz_guncel) * tuketim * 1.2
 */
export function calcPointOfNoReturnO2({
  distanceMeters = 0,
  jointFrozen = false,
  normalSpeedMPerMin = nasaData.constants.humanLifeSupport.evaNormalSpeedMPerMin,
  frozenFactor = nasaData.constants.humanLifeSupport.evaFrozenSpeedFactor,
  o2PerMinute = 1.08,
  safetyFactor = nasaData.constants.humanLifeSupport.pointOfNoReturnSafetyFactor
} = {}) {
  if (distanceMeters <= 0) return 0;
  const currentSpeed = jointFrozen
    ? normalSpeedMPerMin * frozenFactor
    : normalSpeedMPerMin;
  const travelMinutes = distanceMeters / currentSpeed;
  const requiredO2 = travelMinutes * o2PerMinute * safetyFactor;
  return Math.min(100, Math.round(requiredO2 * 10) / 10);
}

/**
 * 7. Sol 0 Görev Tasarımı Kütle, Bütçe, Güç, Veri ve Δv Hesaplayıcı
 */
export function calcDesignTotals(design) {
  const rocket =
    nasaData.rockets.find((r) => r.id === design.rocketId) || nasaData.rockets[1];
  const orbit =
    nasaData.orbits.find((o) => o.id === design.orbitType) || nasaData.orbits[0];
  const site =
    nasaData.landingSites.find((s) => s.id === design.landingSiteId) ||
    nasaData.landingSites[1];
  const hab = nasaData.habitatOptions.baseHabitat;
  const pwr =
    nasaData.habitatOptions.powerSource[design.powerSource] ||
    nasaData.habitatOptions.powerSource.solar_only;
  const bat =
    nasaData.habitatOptions.batteries.find((b) => b.kwh === design.batteryKwh) ||
    nasaData.habitatOptions.batteries[1];
  const ins =
    nasaData.habitatOptions.insulation[design.insulation] ||
    nasaData.habitatOptions.insulation.thin;
  const comm =
    nasaData.habitatOptions.commSystems[design.commArchitecture] ||
    nasaData.habitatOptions.commSystems.relay_only;
  const kitCfg = nasaData.habitatOptions.repairKit;

  const selectedInstruments = (design.instruments || [])
    .map((id) => nasaData.instruments.find((inst) => inst.id === id))
    .filter(Boolean);

  const instrumentsMassKg = selectedInstruments.reduce((acc, i) => acc + i.massKg, 0);
  const instrumentsCostM = selectedInstruments.reduce((acc, i) => acc + i.costM, 0);
  const instrumentsPowerW = selectedInstruments.reduce((acc, i) => acc + i.powerW, 0);

  const repairKitsCount = Math.max(0, Math.min(2, design.repairKits || 0));
  const kitsMassKg = repairKitsCount * kitCfg.massKgPerKit;
  const kitsCostM = repairKitsCount * kitCfg.costMPerKit;

  const windowMissedCostM = design.launchWindowCaught
    ? 0
    : nasaData.constants.synodicPeriodMonths.missedWindowCostM;

  const massUsed = Math.round(
    (hab.massKg +
      pwr.massKg +
      bat.massKg +
      ins.massKg +
      comm.massKg +
      instrumentsMassKg +
      kitsMassKg) *
      10
  ) / 10;

  const massMax = Math.max(400, rocket.payloadMarsKg - orbit.payloadPenaltyKg);
  const massMarginPct =
    Math.round(((massMax - massUsed) / massMax) * 1000) / 10;

  const moneyUsed = Math.round(
    rocket.costM +
      orbit.costPenaltyM +
      windowMissedCostM +
      hab.costM +
      pwr.costM +
      bat.costM +
      ins.costM +
      comm.costM +
      instrumentsCostM +
      kitsCostM
  );
  const moneyMax = 1000;

  const solarProdW = calcSolarPower({
    area: hab.solarAreaM2,
    efficiency: hab.solarEfficiency,
    cosZ: site.cosZ,
    dustFactor: 0.08
  });
  const powerProdW = Math.round(solarProdW + pwr.rtgContinuousW);
  const powerConsW = Math.round(
    hab.basePowerConsW + ins.nightHeatingPowerW + instrumentsPowerW
  );

  // Gece 12 saatlik net enerji ihtiyacı vs batarya kapasitesi (kWh)
  const nightNetDrainW = Math.max(0, powerConsW - pwr.rtgContinuousW);
  const nightEnergyNeededKwh = Math.round(((nightNetDrainW * 12) / 1000) * 10) / 10;
  const batteryNightSafe = bat.kwh >= nightEnergyNeededKwh;

  // Δv hesabı
  const deltaVAvailableMs = calcDeltaV({
    isp: rocket.ispSec,
    wetMass: rocket.baseWetMassKg,
    dryMass: rocket.baseDryMassKg + (massUsed - 1000) * 0.35
  });

  // Tek Nokta Arıza (SPOF - M8) Uyarıları
  const spofWarnings = [];
  if (design.powerSource === 'solar_only') {
    spofWarnings.push('spof.no_rtg');
  }
  if (design.commArchitecture === 'relay_only') {
    spofWarnings.push('spof.no_xband');
  }
  if (repairKitsCount === 0) {
    spofWarnings.push('spof.no_repair_kit');
  }
  if (!batteryNightSafe || design.batteryKwh === 20) {
    spofWarnings.push('spof.small_battery');
  }
  if (design.insulation === 'thin' && site.id === 'arcadia') {
    spofWarnings.push('spof.thin_insulation_cold');
  }
  if (!design.instruments.includes('meda')) {
    spofWarnings.push('spof.no_meda');
  }
  if (massMarginPct < 10 && massMarginPct >= 0) {
    spofWarnings.push('spof.low_mass_margin');
  }

  const canLaunch =
    massUsed <= massMax &&
    moneyUsed <= moneyMax &&
    selectedInstruments.length >= 1 &&
    selectedInstruments.length <= 5;

  return {
    massUsed,
    massMax,
    massMarginPct,
    moneyUsed,
    moneyMax,
    powerProdW,
    powerConsW,
    solarProdW,
    rtgProdW: pwr.rtgContinuousW,
    nightEnergyNeededKwh,
    batteryNightSafe,
    dataPerSolMax: comm.dataPerSolMbit,
    deltaVAvailableMs,
    deltaVRequiredMs: orbit.deltaVRequiredMs,
    spofWarnings,
    canLaunch
  };
}
