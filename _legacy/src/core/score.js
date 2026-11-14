/**
 * SOL 14: RED HORIZON — Görev Başarı Puanı (GBP) ve Neden-Sonuç Karnesi (M5 - K1)
 */

import { NASA_DATA } from './engineering.js';

export function calcMissionScore(state) {
  const objCfg =
    NASA_DATA.objectives.find((o) => o.id === state.design.objectiveFocus) ||
    NASA_DATA.objectives[2];
  const sc = NASA_DATA.scoring;

  // Sadece Dünya'ya gönderilmiş (Downlink = sent) adli raporlar ve deneyler puan sayılır!
  const sentForensics = Object.values(state.forensics || {}).filter((f) => f.sent);
  const sentExperiments = Object.values(state.experiments || {}).filter((e) => e.sent);
  const sentPhotos = (state.downlinkQueue || []).filter(
    (item) => item.type === 'photo' && item.sent
  );

  const rawForensicsScore = sentForensics.reduce((sum, f) => sum + (f.score || 0), 0);
  const rawExperimentsScore = sentExperiments.reduce((sum, e) => sum + (e.score || 0), 0);
  const photosScore = sentPhotos.reduce((sum, p) => sum + (p.points || 0), 0);

  const forensicsScore = Math.round(rawForensicsScore * objCfg.forensicsMultiplier);
  const experimentsScore = Math.round(
    rawExperimentsScore * objCfg.experimentsMultiplier + photosScore
  );

  const survivedAllSols = !state.gameOverReason && state.sol >= state.maxSols;
  const survivalScore =
    state.sol * sc.survivalPerSolPoints +
    (survivedAllSols ? sc.safeReturnBonusPoints : 0);

  const marginBonus =
    state.budgets.massMarginPct >= sc.massMarginBonusThresholdPct
      ? sc.massMarginBonusPoints
      : 0;

  let lostSystemsCount = 0;
  if (state.resources.greenhouseFrozen) lostSystemsCount += 1;
  if (state.resources.o2 <= 0) lostSystemsCount += 1;
  if (state.resources.energyKwh <= 0) lostSystemsCount += 1;

  const penalties = lostSystemsCount * sc.lostSystemPenaltyPoints;

  const total = Math.max(
    0,
    forensicsScore + experimentsScore + survivalScore + marginBonus - penalties
  );

  // Asgari Başarı vs Tam Başarı Eşikleri (Demo modda ölçekli)
  const minReqF = state.demoMode ? 1 : objCfg.minSuccess.forensicsSent;
  const minReqE = state.demoMode ? 1 : objCfg.minSuccess.experimentsSent;
  const fullReqF = state.demoMode ? 2 : objCfg.fullSuccess.forensicsSent;
  const fullReqE = state.demoMode ? 2 : objCfg.fullSuccess.experimentsSent;

  let tier = 'PARTIAL';
  if (state.gameOverReason) {
    tier = 'FAILED';
  } else if (
    sentForensics.length >= fullReqF &&
    sentExperiments.length >= fullReqE &&
    survivedAllSols
  ) {
    tier = 'FULL_SUCCESS';
  } else if (sentForensics.length >= minReqF && sentExperiments.length >= minReqE) {
    tier = 'MIN_SUCCESS';
  }

  // UFO Stinger kamera ve kalan veri bütçesi çözünürlük hesabı
  const hasHighResCam = state.design.instruments.includes('mastcam_z');
  const remainingDataMbit = Math.max(
    0,
    state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol
  );
  const ufoDownloadPct = hasHighResCam && remainingDataMbit >= 15 ? 80 : 30;

  return {
    total,
    forensicsScore,
    experimentsScore,
    survivalScore,
    marginBonus,
    penalties,
    sentForensicsCount: sentForensics.length,
    sentExperimentsCount: sentExperiments.length,
    tier,
    ufoDownloadPct,
    cameraTier: hasHighResCam ? 'high' : 'low'
  };
}

/**
 * M5: Neden-Sonuç Karnesi (Cause-and-Effect Chains) Üretici
 */
export function buildCauseEffectChains(state) {
  const chains = [];
  const d = state.design;
  const lang = state.lang || 'tr';

  // 1. Enerji ve Gece Soğuğu Zinciri
  if (d.powerSource === 'solar_rtg' && d.insulation === 'thick') {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? 'Sol 0: MMRTG (+110 W) + Kalın Yalıtım seçildi'
          : 'Sol 0: Selected MMRTG (+110 W) + Thick Insulation',
      outcome:
        lang === 'tr'
          ? 'Kum fırtınasında ve -80°C gecelerde ısıtma kesilmedi; sera ve valfler korundu (+150 Puan Etkisi)'
          : 'Heating survived dust storms and -80°C nights; greenhouse and valves protected (+150 pt impact)'
    });
  } else if (d.batteryKwh === 20 || d.insulation === 'thin') {
    chains.push({
      type: 'negative',
      decision:
        lang === 'tr'
          ? `Sol 0: ${d.batteryKwh} kWh Batarya ve ${d.insulation === 'thin' ? 'İnce' : 'Kalın'} Yalıtım seçildi`
          : `Sol 0: Selected ${d.batteryKwh} kWh Battery & ${d.insulation} Insulation`,
      outcome:
        lang === 'tr'
          ? 'Gece -80°C soğuğunda ısıtma yükü bataryayı zorladı, güç kesintisi (Load Shedding) tetiklendi (-120 Puan Riski)'
          : 'Night -80°C heating load strained battery, forcing emergency Load Shedding (-120 pt risk)'
    });
  }

  // 2. Kamera ve Veri Bütçesi -> UFO ve Adli Kanıt Zinciri
  if (d.instruments.includes('mastcam_z') && d.commArchitecture === 'relay_xband') {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? 'Sol 0: Mastcam-Z Kamera + X-Band (80 Mbit/sol) İletişim seçildi'
          : 'Sol 0: Selected Mastcam-Z + X-Band (80 Mbit/sol) Comms',
      outcome:
        lang === 'tr'
          ? 'Enkaz fotoğrafları tam puan aldı, veri kuyruğu tıkanmadı ve Sol 14 UFO anomalisi %80 net indirildi'
          : 'Forensic photos scored 100%, downlink queue cleared, and Sol 14 UFO anomaly downloaded at 80% clarity'
    });
  } else {
    chains.push({
      type: 'warning',
      decision:
        lang === 'tr'
          ? 'Sol 0: Düşük Kamera veya Sınırlı UHF Röle (45 Mbit/sol) seçildi'
          : 'Sol 0: Hand Camera or Limited UHF Relay (45 Mbit/sol) selected',
      outcome:
        lang === 'tr'
          ? 'Veri darboğazı yaşandı; bazı bulgular Dünya’ya ulaşamadı ve UFO fotoğrafı %30 bulanık indi'
          : 'Bandwidth bottleneck delayed science packets and limited UFO telemetry image to 30% blurry scan'
    });
  }

  // 3. Kütle Marjı Zinciri
  if (state.budgets.massMarginPct >= 10) {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? `Sol 0: %${state.budgets.massMarginPct} Kütle Marjı bırakıldı (NASA Standardı ≥%10)`
          : `Sol 0: Left ${state.budgets.massMarginPct}% Mass Margin (NASA Standard ≥10%)`,
      outcome:
        lang === 'tr'
          ? 'İniş ve MAV kalkış Δv dengesi güvende kaldı (+120 Mühendislik Marj Bonusu)'
          : 'Entry and MAV ascent Δv margin remained safe (+120 Engineering Margin Bonus)'
    });
  }

  // 4. Operasyonel Karar Günlüğü (decisionLog) Kayıtları
  for (const log of state.decisionLog.slice(-4)) {
    chains.push({
      type: log.scoreImpact >= 0 ? 'positive' : 'warning',
      decision: `Sol ${log.sol}: ${log.title} → ${log.choice}`,
      outcome: `${log.costText} ${log.consequence}`.trim()
    });
  }

  return chains;
}
