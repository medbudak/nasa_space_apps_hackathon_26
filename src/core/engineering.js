/**
 * SOL 14: RED HORIZON — Mühendislik ve Fizik Formülleri (K1)
 * Tüm sabitler SOL14.DATA (data/*.json) içinden okunur. tests/engineering.test.js ile doğrulanır.
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const { clamp, round1 } = S.util;

  const E = {};

  /** P = S · A · η · cosZ · (1 − d_toz) · e^(−k·τ)   [W] */
  E.calcSolarPower = function ({
    irradiance = D().constants.solarIrradiance.mean,
    area = D().habitat.base.solarAreaM2,
    efficiency = D().habitat.base.solarEfficiency,
    cosZ = 1,
    dustFactor = 0,
    tau = 0
  } = {}) {
    const transmission = Math.exp(-D().constants.dustStorm.solarTransmissionK * Math.max(0, tau));
    const p =
      irradiance * area * efficiency * clamp(cosZ, 0, 1) * (1 - clamp(dustFactor, 0, 0.95)) * transmission;
    return round1(p);
  };

  /** Δv = Isp · g0 · ln(m0 / mf)   [m/s] */
  E.calcDeltaV = function ({ isp, wetMass, dryMass, g0 = D().constants.marsGravity.earthValue }) {
    if (!(wetMass > dryMass) || dryMass <= 0) return 0;
    return Math.round(isp * g0 * Math.log(wetMass / dryMass));
  };

  /** t = d / c */
  E.calcLightDelay = function (distanceKm) {
    const seconds = Math.max(0, Math.round(distanceKm / D().constants.speedOfLight.kms));
    return {
      seconds,
      minutes: Math.round((seconds / 60) * 100) / 100,
      mm: Math.floor(seconds / 60),
      ss: seconds % 60
    };
  };

  E.getHorizons = function (sol, maxSols) {
    const table = D().horizons.bySol;
    const row = table.find((r) => r.sol === sol) || table[table.length - 1];
    const delay = E.calcLightDelay(row.distanceMillionKm * 1e6);
    const conjunction = Boolean(D().horizons.conjunctionOnFinalSol && maxSols && sol >= maxSols);
    return Object.assign({ distanceMillionKm: row.distanceMillionKm, conjunction }, delay);
  };

  /** T = 2π √(L / g) */
  E.calcPendulumPeriod = function (lengthM = 1, g = D().constants.marsGravity.value) {
    if (lengthM <= 0 || g <= 0) return 0;
    return Math.round(2 * Math.PI * Math.sqrt(lengthM / g) * 100) / 100;
  };

  /** t = √(2h / g) */
  E.calcFreeFallTime = function (heightM = 2, g = D().constants.marsGravity.value) {
    if (heightM <= 0 || g <= 0) return 0;
    return Math.round(Math.sqrt((2 * heightM) / g) * 100) / 100;
  };

  /**
   * M4 — Dönüşsüzlük Noktası: O2_gerekli = (mesafe / v_güncel) · ċ · 1.2   [% elbise O2]
   */
  E.calcPointOfNoReturnO2 = function ({
    distanceM,
    jointFrozen = false,
    leak = false,
    speedFactor = 1
  }) {
    const eva = D().constants.eva;
    if (!(distanceM > 0)) return 0;
    const v = eva.speedMPerMin * (jointFrozen ? eva.frozenSpeedFactor : 1) * speedFactor;
    const rate = eva.suitO2PctPerMin * (leak ? eva.suitLeakO2Multiplier : 1);
    return Math.min(100, round1((distanceM / v) * rate * eva.pointOfNoReturnSafetyFactor));
  };

  /**
   * Elbise bataryası tüketimi: (taban + ısıtıcı · max(0, −T_dış) / 100) · bütünlük cezası   [%/dk]
   * Veri, dolu bataryanın −80 °C'de 8 saatlik xEVA çıkışını ısıtacağı şekilde ayarlıdır (D-009 oyun değeri).
   */
  E.calcSuitBatteryDrainPctPerMin = function ({ ambientC, integrity = 100 }) {
    const eva = D().constants.eva;
    const penalty = integrity < eva.suitLowIntegrityPct ? eva.suitLowIntegrityBatteryFactor : 1;
    return (eva.suitBatteryBasePctPerMin + (eva.suitHeaterPctPerMinPer100C * Math.max(0, -ambientC)) / 100) * penalty;
  };

  /**
   * Bataryası bitmiş elbisenin soğuma süresi (Newton soğuması):
   * T(t) = T_dış + (T0 − T_dış) · e^(−k·t)  →  t = ln((T0 − T_dış) / (T_hedef − T_dış)) / k   [oyun dakikası]
   * Dış hava hedeften sıcaksa elbise o sıcaklığa hiç inmez: Infinity.
   */
  E.calcSuitCoolingMinutes = function ({ fromC, toC, ambientC }) {
    const k = D().constants.eva.suitCoolingFracPerMin;
    if (fromC <= toC) return 0;
    if (ambientC >= toC || !(k > 0)) return Infinity;
    return Math.log((fromC - ambientC) / (toC - ambientC)) / k;
  };

  /** Habitat ısıtma ihtiyacı: max(0, UA·(T_hedef − T_dış) − RTG atık ısısı − RHU)   [W] */
  E.calcHeatingW = function ({ uaWPerK, targetC, ambientC, wasteHeatW = 0 }) {
    return Math.max(0, Math.round(uaWPerK * (targetC - ambientC) - wasteHeatW));
  };

  /** Günlük dış sıcaklık eğrisi: min ~05:30, max ~14:00 (Mars gün-gece farkı 70–100 °C) */
  /**
   * Lav tüneli derin bölüm sıcaklığı (basitleştirilmiş, D-012): THEMIS skylight gözlemi — gece-gündüz salınımı
   * çevre yüzeyin yaklaşık 1/3'ü. T_derin = T_ort + (T_yüzey − T_ort) · kesir, T_ort = (gece min + gündüz maks) / 2
   */
  E.calcCaveTempC = function (site, minute, swingFraction) {
    const mean = (site.nightMinC + site.dayMaxC) / 2;
    return round1(mean + (E.ambientTempAt(site, minute) - mean) * swingFraction);
  };

  E.ambientTempAt = function (site, minute) {
    const tMin = site.nightMinC;
    const tMax = site.dayMaxC;
    const minAt = 330;
    const maxAt = 840;
    let m = ((minute % 1480) + 1480) % 1480;
    if (m >= minAt && m < maxAt) {
      const f = (m - minAt) / (maxAt - minAt);
      return round1(tMin + ((tMax - tMin) * (1 - Math.cos(Math.PI * f))) / 2);
    }
    if (m < minAt) m += 1480;
    const f = (m - maxAt) / (minAt + 1480 - maxAt);
    return round1(tMax - ((tMax - tMin) * (1 - Math.cos(Math.PI * f))) / 2);
  };

  /** Güneş zenit kosinüsü (gün doğumu–batımı arası sinüs profili) */
  E.solarCosZAt = function (site, minute) {
    const g = D().gameplay;
    const rise = g.sunriseMinute;
    const set = g.nightStartMinute - 30;
    const m = ((minute % 1480) + 1480) % 1480;
    if (m <= rise || m >= set) return 0;
    return round1(site.cosZNoon * Math.sin((Math.PI * (m - rise)) / (set - rise)) * 100) / 100;
  };

  E.timeOfDay = function (minute) {
    const g = D().gameplay;
    const m = ((minute % 1480) + 1480) % 1480;
    if (m >= g.nightStartMinute || m < g.sunriseMinute - 30) return 'night';
    if (m >= g.sunsetStartMinute) return 'sunset';
    if (m < g.sunriseMinute + 30) return 'dawn';
    return 'day';
  };

  /* ------------------------------------------------------------------ */
  /* Sol 0 Tasarım Toplamları + SPOF (M8)                                */
  /* ------------------------------------------------------------------ */
  E.findById = (list, id) => list.find((x) => x.id === id) || list[0];

  E.calcDesignTotals = function (design) {
    const d = D();
    const rocket = E.findById(d.rockets, design.rocketId);
    const orbit = E.findById(d.orbits, design.orbitType);
    const site = E.findById(d.landingSites, design.landingSiteId);
    const hab = d.habitat.base;
    const pwr = d.habitat.powerSource[design.powerSource] || d.habitat.powerSource.solar_only;
    const bat = d.habitat.batteries.find((b) => b.kwh === design.batteryKwh) || d.habitat.batteries[1];
    const ins = d.habitat.insulation[design.insulation] || d.habitat.insulation.thick;
    const comm = d.habitat.comms[design.commArchitecture] || d.habitat.comms.relay_only;
    const kit = d.habitat.repairKit;
    const insts = (design.instruments || [])
      .map((id) => d.instruments.find((i) => i.id === id))
      .filter(Boolean);
    const kits = clamp(design.repairKits || 0, 0, kit.max);

    const massUsed = round1(
      hab.massKg + pwr.massKg + bat.massKg + ins.massKg + comm.massKg +
        insts.reduce((a, i) => a + i.massKg, 0) + kits * kit.massKg
    );
    const massMax = rocket.payloadMarsKg - orbit.payloadPenaltyKg;
    const massMarginPct = round1(((massMax - massUsed) / massMax) * 100);

    const moneyUsed = Math.round(
      rocket.costM + orbit.costPenaltyM +
        (design.launchWindowCaught ? 0 : d.constants.synodicPeriod.missedWindowCostM) +
        hab.costM + pwr.costM + bat.costM + ins.costM + comm.costM +
        insts.reduce((a, i) => a + i.costM, 0) + kits * kit.costM
    );
    const moneyMax = d.habitat.budgetMaxM;

    // Gün ortası güneş üretimi ve en soğuk gece ısıtma yükü
    const solarNoonW = E.calcSolarPower({ cosZ: site.cosZNoon, dustFactor: 0 });
    const heatingNightW = E.calcHeatingW({
      uaWPerK: ins.uaWPerK,
      targetC: d.gameplay.habitatTargetC,
      ambientC: site.nightMinC,
      wasteHeatW: pwr.rtgWasteHeatW
    });
    const instrumentW = insts.reduce((a, i) => a + i.powerW, 0);
    const nightLoadW = hab.lifeSupportW + hab.commsW + heatingNightW + instrumentW;
    const nightHours = (1480 - (d.gameplay.nightStartMinute - d.gameplay.sunriseMinute)) / 60;
    const nightNeedKwh = round1((Math.max(0, nightLoadW - pwr.rtgW) * nightHours) / 1000);
    const batteryNightSafe = bat.kwh >= nightNeedKwh;

    const dataPerSolMbit = d.habitat.relayPasses
      .filter((p) => !p.requires || p.requires === design.commArchitecture)
      .reduce((a, p) => a + p.capacityMbit, 0);

    const spof = [];
    if (design.powerSource === 'solar_only') spof.push('spof.no_rtg');
    if (design.commArchitecture === 'relay_only') spof.push('spof.no_xband');
    if (kits === 0) spof.push('spof.no_repair_kit');
    if (!batteryNightSafe) spof.push('spof.small_battery');
    if (design.insulation === 'thin' && site.nightMinC <= -90) spof.push('spof.thin_insulation_cold');
    if (!design.instruments.includes('meda')) spof.push('spof.no_meda');
    if (massMarginPct < d.habitat.massMarginGoodPct) spof.push('spof.low_mass_margin');

    const errors = [];
    if (massUsed > massMax) errors.push('design.err_mass');
    if (moneyUsed > moneyMax) errors.push('design.err_money');
    if (insts.length < 1) errors.push('design.err_no_instrument');
    if (insts.length > 5) errors.push('design.err_too_many');

    return {
      massUsed,
      massMax,
      massMarginPct,
      moneyUsed,
      moneyMax,
      solarNoonW,
      rtgW: pwr.rtgW,
      nightLoadW,
      // Breakdown of nightLoadW for the design console's energy details (no new formula)
      heatingNightW,
      instrumentW,
      nightHours: round1(nightHours),
      nightNeedKwh,
      batteryNightSafe,
      dataPerSolMbit,
      transitDays: orbit.transitDays,
      transitDoseMsv: round1(orbit.transitDays * d.constants.radiation.transitDailyMsv),
      spof,
      errors,
      canLaunch: errors.length === 0
    };
  };

  S.Engineering = E;
})((window.SOL14 = window.SOL14 || {}));
