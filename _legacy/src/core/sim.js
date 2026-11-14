/**
 * SOL 14: RED HORIZON — Simülasyon Motoru (K2)
 * Gündüz/Gece döngüsü, 0.38g yüzey hareketi, Güç Yükü (M3), Dönüşsüzlük Noktası (M4) ve Sol geçişleri.
 */

import {
  NASA_DATA,
  calcSolarPower,
  calcPointOfNoReturnO2,
  calcDesignTotals,
  getHorizonsForSol
} from './engineering.js';
import { getState, updateState, bus, logDecision, t } from './state.js';
import { pickAndTriggerSolEvent } from './events.js';

/**
 * Sol 0 tasarımını tamamlayıp görevi başlatır (Sol 1'e geçiş)
 */
export function launchMissionFromDesign() {
  const state = getState();
  const totals = calcDesignTotals(state.design);
  if (!totals.canLaunch) {
    return { ok: false, reason: 'limits_exceeded' };
  }

  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];
  const orbit =
    NASA_DATA.orbits.find((o) => o.id === state.design.orbitType) ||
    NASA_DATA.orbits[0];
  const ins =
    NASA_DATA.habitatOptions.insulation[state.design.insulation] ||
    NASA_DATA.habitatOptions.insulation.thick;

  updateState((s) => {
    s.sol = 1;
    s.phase = 'surface';
    s.activeTab = 'surface';
    s.timeOfDay = 'day';
    s.gameOverReason = null;
    s.budgets = {
      ...totals,
      dataUsedThisSol: 0
    };

    s.resources.o2 = 100;
    s.resources.energyKwh = s.design.batteryKwh;
    s.resources.suitTempC = site.dayTempC;
    s.resources.radiationMsv = orbit.transitRadiationMsv;
    s.resources.sanity = s.design.launchWindowCaught ? 100 : 88;
    s.resources.waterLiters = Math.round(
      80 * (1 + orbit.initialSuppliesBonusPct / 100) * (0.7 + site.iceAccessibility * 0.5)
    );
    s.resources.mavFuelPct = s.design.orbitType === 'fast_transfer' ? 88 : 95;
    s.resources.panelDust = 0.06;
    s.resources.evaDistanceM = 200;
    s.resources.jointFrozen = false;
    s.resources.greenhouseFrozen = false;

    s.inventory.repairKits = s.design.repairKits;
    s.inventory.rhuUnits = s.design.powerSource === 'solar_rtg' ? 2 : 0;
    s.inventory.spareAntenna = s.design.commArchitecture === 'relay_xband';

    // Isıtma gücünü yalıtım seçimine göre güncelle
    const heatItem = s.powerPriorities.find((p) => p.id === 'heating');
    if (heatItem) heatItem.powerW = ins.nightHeatingPowerW;

    // MOXIE ve Veggie seçilmediyse güç listesinden pasifleştir
    const moxieItem = s.powerPriorities.find((p) => p.id === 'moxie');
    if (moxieItem) moxieItem.active = s.design.instruments.includes('moxie');

    const ghItem = s.powerPriorities.find((p) => p.id === 'greenhouse');
    if (ghItem) ghItem.active = s.design.instruments.includes('veggie');

    logDecision({
      sol: 0,
      category: 'design',
      title: 'Sol 0 Görev Tasarımı',
      choice: `${site.id.toUpperCase()} | ${s.design.batteryKwh}kWh | ${s.design.instruments.length} Alet`,
      costText: `${totals.massUsed}/${totals.massMax} kg (%${totals.massMarginPct} Marj), $${totals.moneyUsed}M`,
      consequence:
        totals.spofWarnings.length === 0
          ? 'Yedekli NASA standardı tasarım'
          : `${totals.spofWarnings.length} adet SPOF riski mevcut`,
      scoreImpact: totals.massMarginPct >= 10 ? 50 : 0
    });
  });

  bus.emit('audio:play', 'launch');
  bus.emit('fx:weather', { type: 'clear', timeOfDay: 'day' });
  return { ok: true };
}

/**
 * M4: Dönüşsüzlük Noktası (Point of No Return) canlı durumunu hesaplar
 */
export function getPointOfNoReturnStatus(state = getState()) {
  const requiredO2 = calcPointOfNoReturnO2({
    distanceMeters: state.resources.evaDistanceM,
    jointFrozen: state.resources.jointFrozen
  });
  const currentO2 = state.resources.o2;
  const marginO2 = Math.round((currentO2 - requiredO2) * 10) / 10;
  const isCritical = currentO2 <= requiredO2 + 5;
  return {
    requiredO2,
    currentO2,
    marginO2,
    isCritical
  };
}

/**
 * M3: Güç Yük Önceliklendirme (Load Shedding) — Güç yetmediğinde en alttaki sistemleri otomatik kapatır
 */
export function applyPowerLoadShedding(state = getState()) {
  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];
  const hab = NASA_DATA.habitatOptions.baseHabitat;
  const pwr =
    NASA_DATA.habitatOptions.powerSource[state.design.powerSource] ||
    NASA_DATA.habitatOptions.powerSource.solar_only;

  const isStorm = state.activeCrisis?.id === 'dust_storm';
  const effectiveDust = isStorm
    ? Math.max(0.8, state.resources.panelDust)
    : state.resources.panelDust;

  const solarW = calcSolarPower({
    area: hab.solarAreaM2,
    efficiency: hab.solarEfficiency,
    cosZ: state.timeOfDay === 'night' ? 0.15 : site.cosZ,
    dustFactor: effectiveDust
  });

  // Günlük ortalama kullanılabilir güç (Gündüz solar + 24 saat RTG + Batarya tamponu)
  const rtgW = pwr.rtgContinuousW + state.inventory.rhuUnits * 3;
  const batterySupportW = state.resources.energyKwh * 12;
  const availablePowerW = Math.round(solarW * 0.18 + rtgW + batterySupportW);

  let usedW = 0;
  const shedSystems = [];

  for (const item of state.powerPriorities) {
    // Eğer alet Sol 0'da hiç alınmadıysa kapalı kalır
    if (item.id === 'moxie' && !state.design.instruments.includes('moxie')) {
      item.active = false;
      continue;
    }
    if (usedW + item.powerW <= availablePowerW || item.id === 'life_support') {
      item.active = true;
      usedW += item.powerW;
    } else {
      item.active = false;
      shedSystems.push(item.id);
    }
  }

  state.budgets.powerProdW = availablePowerW;
  state.budgets.powerConsW = usedW;
  return { availablePowerW, usedW, shedSystems };
}

/**
 * Güç Yük Öncelik Sırasını Değiştirir (Yukarı / Aşağı)
 */
export function movePowerPriority(index, direction) {
  updateState((s) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= s.powerPriorities.length) return;
    const temp = s.powerPriorities[index];
    s.powerPriorities[index] = s.powerPriorities[targetIdx];
    s.powerPriorities[targetIdx] = temp;
    applyPowerLoadShedding(s);
  });
  bus.emit('audio:play', 'click');
}

/**
 * Yüzeyde EVA Mesafesini Değiştirme / Yürüme ve 0.38g Zıplama
 */
export function performEvaStep(deltaMeters = 150) {
  const state = getState();
  if (state.phase !== 'surface') return;

  updateState((s) => {
    const prevDist = s.resources.evaDistanceM;
    const nextDist = Math.max(0, Math.min(1150, prevDist + deltaMeters));
    const moved = Math.abs(nextDist - prevDist);
    s.resources.evaDistanceM = nextDist;

    // Deney 2 bonusu varsa %25 daha az O2 harcar
    const jumpBonus = s.experiments.free_fall_jump?.bonusUnlocked ? 0.75 : 1.0;
    const freezePenalty = s.resources.jointFrozen ? 1.6 : 1.0;
    const o2Cost = Math.round(((moved / 100) * 2.2 * jumpBonus * freezePenalty) * 10) / 10;
    s.resources.o2 = Math.max(0, Math.round((s.resources.o2 - o2Cost) * 10) / 10);

    // 800m ötesinde soğukta eklem donması riski
    if (nextDist >= 800 && !s.resources.jointFrozen && s.resources.suitTempC < 0) {
      s.resources.jointFrozen = true;
    } else if (nextDist === 0) {
      s.resources.jointFrozen = false;
    }
  });

  const ponr = getPointOfNoReturnStatus();
  if (ponr.isCritical && !getState().activeCrisis) {
    pickAndTriggerSolEvent('joint_freeze');
  }
}

/**
 * Güneş Panellerini Temizle (O2 harcar, panel tozunu sıfırlar)
 */
export function cleanSolarPanels() {
  updateState((s) => {
    if (s.resources.o2 <= 8) return;
    s.resources.o2 = Math.max(0, Math.round((s.resources.o2 - 6) * 10) / 10);
    s.resources.panelDust = 0.02;
    s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 6);
    applyPowerLoadShedding(s);
  });
  bus.emit('audio:play', 'scan');
}

/**
 * Sabatier ISRU Reaktörü (CO2 + 4H2 -> CH4 + 2H2O) ve Elektroliz ile O2 + MAV Yakıtı Üretimi
 */
export function runSabatierIsru() {
  updateState((s) => {
    if (s.resources.energyKwh < 5 || s.resources.waterLiters < 6) return;
    s.resources.energyKwh = Math.max(0, Math.round((s.resources.energyKwh - 5) * 10) / 10);
    s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 6);
    const moxieBonus = s.experiments.moxie_efficiency?.bonusUnlocked ? 18 : 14;
    s.resources.o2 = Math.min(100, Math.round((s.resources.o2 + moxieBonus) * 10) / 10);
    s.resources.mavFuelPct = Math.min(100, s.resources.mavFuelPct + 5);
  });
  bus.emit('audio:play', 'scan');
}

/**
 * Sera Bakımı ve Hasat Filizi (Akıl Sağlığı + O2 desteği)
 */
export function tendGreenhouse() {
  updateState((s) => {
    if (s.resources.greenhouseFrozen || s.resources.waterLiters < 4) return;
    s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 4);
    const yieldBonus = s.experiments.seed_germination?.bonusUnlocked ? 16 : 12;
    s.resources.sanity = Math.min(100, s.resources.sanity + yieldBonus);
    s.resources.o2 = Math.min(100, Math.round((s.resources.o2 + 5) * 10) / 10);
  });
  bus.emit('audio:play', 'click');
}

/**
 * M1: Downlink Kuyruğundaki Bir Veri Paketini Dünya'ya Gönderir
 */
export function transmitDownlinkPacket(packetId) {
  const state = getState();
  const horizons = getHorizonsForSol(state.sol);

  // Güneş Kavuşumu (Solar Conjunction) kontrolü (Sol 14 öncesi veya iletişim kapalıysa)
  const commsActive =
    state.powerPriorities.find((p) => p.id === 'comms')?.active ?? true;
  if (!commsActive) {
    return { ok: false, reason: 'comms_powered_off' };
  }

  const pkt = state.downlinkQueue.find((p) => p.id === packetId);
  if (!pkt || pkt.sent) return { ok: false, reason: 'not_found' };

  const remainingMbit = state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol;
  if (pkt.sizeMbit > remainingMbit) {
    return { ok: false, reason: 'bandwidth_exceeded' };
  }

  updateState((s) => {
    const target = s.downlinkQueue.find((p) => p.id === packetId);
    if (!target) return;
    target.sent = true;
    target.lightDelayText = horizons.formatted;
    s.budgets.dataUsedThisSol += target.sizeMbit;

    if (target.type === 'forensic' && s.forensics[target.refId]) {
      s.forensics[target.refId].sent = true;
    }
    if (target.type === 'experiment' && s.experiments[target.refId]) {
      s.experiments[target.refId].sent = true;
    }
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true };
}

/**
 * Günü Tamamla (SOL X -> SOL X+1 Geçişi, Gece Soğuğu, Kaynak Dengesi ve Kriz Tetiklemesi)
 */
export function advanceSol() {
  const state = getState();
  if (state.phase !== 'surface') return;

  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];

  updateState((s) => {
    // 1. Günlük toz birikimi ve enerji/O2 döngüsü
    s.resources.panelDust = Math.min(0.85, Math.round((s.resources.panelDust + 0.05) * 100) / 100);
    s.budgets.dataUsedThisSol = 0;

    applyPowerLoadShedding(s);

    const moxieOn = s.powerPriorities.find((p) => p.id === 'moxie')?.active;
    const heatingOn = s.powerPriorities.find((p) => p.id === 'heating')?.active;
    const ghOn = s.powerPriorities.find((p) => p.id === 'greenhouse')?.active;

    // O2 tüketimi vs MOXIE üretimi
    const dailyO2Use = 9;
    const dailyMoxieGain = moxieOn
      ? s.experiments.moxie_efficiency?.bonusUnlocked
        ? 11
        : 8
      : 0;
    s.resources.o2 = Math.max(
      0,
      Math.min(100, Math.round((s.resources.o2 - dailyO2Use + dailyMoxieGain) * 10) / 10)
    );

    // Gece -80°C ısı ve batarya dengesi
    const netPowerDeltaKwh = Math.round(
      ((s.budgets.powerProdW - s.budgets.powerConsW) * 0.04) * 10
    ) / 10;
    s.resources.energyKwh = Math.max(
      2,
      Math.min(s.design.batteryKwh, Math.round((s.resources.energyKwh + netPowerDeltaKwh) * 10) / 10)
    );

    if (!heatingOn && s.design.insulation === 'thin') {
      s.resources.suitTempC = Math.max(-25, s.resources.suitTempC - 14);
      s.resources.greenhouseFrozen = true;
    } else {
      s.resources.suitTempC = site.dayTempC;
    }

    if (!ghOn && site.nightTempC < -85 && s.design.insulation === 'thin') {
      s.resources.greenhouseFrozen = true;
    }

    // Günlük radyasyon ve akıl sağlığı
    s.resources.radiationMsv = Math.round(
      (s.resources.radiationMsv + NASA_DATA.constants.radiation.surfaceDailyMsv) * 10
    ) / 10;
    const sanityDelta = ghOn && !s.resources.greenhouseFrozen ? -1 : -5;
    s.resources.sanity = Math.max(0, Math.min(100, s.resources.sanity + sanityDelta));

    // Kayıp koşullarını kontrol et (4 Kayıp Koşulu)
    if (s.resources.o2 <= 0) {
      s.gameOverReason = 'o2_depleted';
    } else if (s.resources.suitTempC <= NASA_DATA.constants.temperatureC.suitCriticalMin) {
      s.gameOverReason = 'hypothermia';
    } else if (s.resources.radiationMsv >= NASA_DATA.constants.radiation.missionLimitMsv) {
      s.gameOverReason = 'radiation_limit';
    } else if (s.resources.sanity <= 0) {
      s.gameOverReason = 'sanity_zero';
    }

    if (s.gameOverReason) {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
      return;
    }

    // Son Sol tamamlandıysa UFO Stinger sahnesine geç!
    if (s.sol >= s.maxSols) {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
      return;
    }

    s.sol += 1;
  });

  bus.emit('sol:advance', { sol: getState().sol });
  bus.emit('audio:play', 'scan');

  // Yeni Sol kriz veya olumlu olayını tetikle
  if (getState().phase === 'surface') {
    pickAndTriggerSolEvent();
  }
}
