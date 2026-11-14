/**
 * SOL 14: RED HORIZON — Ana Görev 2: Mars Laboratuvarı 6 Bilimsel Deney Sistemi (K6)
 * Döngü: 1. Hipotez Seç -> 2. Ortam Seç (Habitat vs Dış Yüzey) -> 3. Kontrol Grubu (+%50 Puan) ->
 *        4. Çalıştır & Ölç (Mini-Oyun) -> 5. Sonuç Kartı, Hayatta Kalma Ödülü & Downlink (M1)
 */

import { NASA_DATA } from '../core/engineering.js';
import { getState, updateState, bus, logDecision, t } from '../core/state.js';

export const EXPERIMENT_HYPOTHESES = {
  pendulum_gravity: [
    { id: 'slower_163', labelKey: 'exp.pendulum_gravity.h1' },
    { id: 'faster_125', labelKey: 'exp.pendulum_gravity.h2' },
    { id: 'same_201', labelKey: 'exp.pendulum_gravity.h3' }
  ],
  free_fall_jump: [
    { id: 'fall_104s', labelKey: 'exp.free_fall_jump.h1' },
    { id: 'fall_064s', labelKey: 'exp.free_fall_jump.h2' },
    { id: 'fall_260s', labelKey: 'exp.free_fall_jump.h3' }
  ],
  seed_germination: [
    { id: 'washed_pressurized_only', labelKey: 'exp.seed_germination.h1' },
    { id: 'raw_soil_direct', labelKey: 'exp.seed_germination.h2' },
    { id: 'open_mars_air', labelKey: 'exp.seed_germination.h3' }
  ],
  water_boiling: [
    { id: 'boil_and_freeze_triple', labelKey: 'exp.water_boiling.h1' },
    { id: 'stay_liquid', labelKey: 'exp.water_boiling.h2' },
    { id: 'turn_to_acid', labelKey: 'exp.water_boiling.h3' }
  ],
  sound_speed: [
    { id: 'slower_240ms', labelKey: 'exp.sound_speed.h1' },
    { id: 'faster_480ms', labelKey: 'exp.sound_speed.h2' },
    { id: 'no_sound', labelKey: 'exp.sound_speed.h3' }
  ],
  moxie_efficiency: [
    { id: 'denser_cold_air_variation', labelKey: 'exp.moxie_efficiency.h1' },
    { id: 'daylight_only', labelKey: 'exp.moxie_efficiency.h2' },
    { id: 'constant_output', labelKey: 'exp.moxie_efficiency.h3' }
  ]
};

/**
 * Deney ayarlarını (hipotez, ortam, kontrol grubu) günceller
 */
export function configureExperiment(expId, { hypothesis, environment, controlGroup }) {
  updateState((s) => {
    const rec = s.experiments[expId];
    if (!rec) return;
    if (hypothesis !== undefined) rec.hypothesis = hypothesis;
    if (environment !== undefined) rec.environment = environment;
    if (controlGroup !== undefined) rec.controlGroup = Boolean(controlGroup);
  });
}

/**
 * Deneyi çalıştırır, ölçüm sonucunu hesaplar, hayatta kalma ödülünü açar ve Downlink kuyruğuna ekler
 */
export function completeExperiment(expId, minigameQuality = 1.0) {
  const expCfg = NASA_DATA.experiments.find((e) => e.id === expId);
  if (!expCfg) return { ok: false };

  let earnedScore = 0;
  let hypothesisCorrect = false;
  let envCorrect = false;

  updateState((s) => {
    const rec = s.experiments[expId];
    if (!rec) return;

    const energyCost =
      expCfg.energyCostKwh + (rec.controlGroup ? 1.5 : 0);
    s.resources.energyKwh = Math.max(1, Math.round((s.resources.energyKwh - energyCost) * 10) / 10);

    hypothesisCorrect = rec.hypothesis === expCfg.correctHypothesis;
    envCorrect = rec.environment === expCfg.preferredEnv;
    const hasReqInst =
      !expCfg.requiredInstrument ||
      s.design.instruments.includes(expCfg.requiredInstrument);

    let factor = 0.6;
    if (hypothesisCorrect) factor += 0.3;
    if (envCorrect) factor += 0.1;
    if (!hasReqInst) factor *= 0.55; // Gerekli alet yoksa açık havada/el yordamıyla düşük puan

    const controlMult = rec.controlGroup
      ? NASA_DATA.scoring.controlGroupBonusMultiplier
      : 1.0;

    earnedScore = Math.round(expCfg.basePoints * factor * controlMult * Math.max(0.7, minigameQuality));

    rec.completed = true;
    rec.measuredValue = expCfg.expectedMarsValue;
    rec.score = earnedScore;
    rec.bonusUnlocked = true;
    rec.queued = true;

    // Bulgu ödüllerini anında uygula
    if (expId === 'seed_germination') {
      s.inventory.perchlorateWashed = true;
      s.resources.sanity = Math.min(100, s.resources.sanity + 10);
    } else if (expId === 'water_boiling') {
      s.resources.waterLiters += 10;
    } else if (expId === 'moxie_efficiency') {
      s.resources.o2 = Math.min(100, s.resources.o2 + 10);
    }

    const pktId = `exp_${expId}`;
    const existing = s.downlinkQueue.find((p) => p.id === pktId);
    if (!existing) {
      s.downlinkQueue.push({
        id: pktId,
        type: 'experiment',
        refId: expId,
        title: `${t(`exp.${expId}.name`)} (${expCfg.expectedMarsValue} ${expCfg.unit})`,
        sizeMbit: expCfg.dataMbit,
        points: earnedScore,
        sent: false
      });
    } else {
      existing.points = earnedScore;
    }

    logDecision({
      sol: s.sol,
      category: 'science',
      title: t(`exp.${expId}.name`),
      choice: `${hypothesisCorrect ? 'Hipotez Doğrulandı' : 'Hipotez Yanlışlandı'} ${rec.controlGroup ? '(+Kontrol Grubu)' : ''}`,
      costText: `-${energyCost} kWh, ${expCfg.dataMbit} Mbit`,
      consequence: t(`exp.${expId}.result`),
      scoreImpact: earnedScore
    });
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true, earnedScore, hypothesisCorrect, envCorrect };
}
