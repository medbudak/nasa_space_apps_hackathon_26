/**
 * SOL 14: RED HORIZON — Olay Motoru, Kriz Kartları (M2) ve Gecikmeli Görev Kontrol (M7 - K2)
 */

import { getState, updateState, bus, logDecision, t } from './state.js';
import { getHorizonsForSol } from './engineering.js';

export const CRISIS_CATALOG = [
  {
    id: 'joint_freeze',
    fxType: 'frost',
    titleKey: 'crisis.joint_freeze.title',
    descKey: 'crisis.joint_freeze.desc',
    adviceKey: 'crisis.joint_freeze.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.joint_freeze.optA',
        costSummary: '-28% O2, -10°C Isı',
        apply(s) {
          s.resources.o2 = Math.max(0, s.resources.o2 - 28);
          s.resources.suitTempC -= 10;
          s.resources.evaDistanceM = 0;
          s.resources.jointFrozen = false;
          return { consequence: 'Yavaş yürüyüşle habitata dönüldü, O2 rezervi azaldı.', scoreImpact: -20 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.joint_freeze.optB',
        costSummary: '-8 kWh Batarya, -12% O2',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 8);
          s.resources.o2 = Math.max(0, s.resources.o2 - 12);
          s.resources.suitTempC = 16;
          s.resources.evaDistanceM = 0;
          s.resources.jointFrozen = false;
          return { consequence: 'Elbise ısıtıcısıyla eklemler çözüldü ve güvenle dönüldü.', scoreImpact: 25 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.joint_freeze.optC',
        costSummary: '-8% O2, RHU Atık Isısı',
        apply(s) {
          s.resources.o2 = Math.max(0, s.resources.o2 - 8);
          s.resources.suitTempC = 18;
          s.resources.evaDistanceM = 150;
          s.resources.jointFrozen = false;
          return { consequence: 'Enkazdaki RHU radyoizotop ısısıyla eklemler çözüldü!', scoreImpact: 40 };
        }
      }
    ]
  },
  {
    id: 'dust_storm',
    fxType: 'storm',
    titleKey: 'crisis.dust_storm.title',
    descKey: 'crisis.dust_storm.desc',
    adviceKey: 'crisis.dust_storm.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.dust_storm.optA',
        costSummary: '-10% Akıl Sağlığı, +6 kWh Koruma',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 10);
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 6);
          s.resources.panelDust = Math.min(0.85, s.resources.panelDust + 0.25);
          return { consequence: 'Sera geçici kapatılarak yaşam desteği bataryası korundu.', scoreImpact: 15 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.dust_storm.optB',
        costSummary: '-15 Mbit Veri Bütçesi, Batarya Korunur',
        apply(s) {
          s.budgets.dataUsedThisSol = Math.min(
            s.budgets.dataPerSolMax,
            s.budgets.dataUsedThisSol + 15
          );
          s.resources.panelDust = Math.min(0.85, s.resources.panelDust + 0.2);
          return { consequence: 'Laboratuvar ve iletişim yükü kesilerek fırtına atlatıldı.', scoreImpact: 20 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.dust_storm.optC',
        costSummary: '-18% O2 Rezervi, +9 kWh Koruma',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 18);
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 9);
          return { consequence: 'MOXIE(300W) kapatıldı, yedek O2 tüpüyle fırtına geçildi.', scoreImpact: 10 };
        }
      }
    ]
  },
  {
    id: 'frozen_valve',
    fxType: 'frost',
    titleKey: 'crisis.frozen_valve.title',
    descKey: 'crisis.frozen_valve.desc',
    adviceKey: 'crisis.frozen_valve.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.frozen_valve.optA',
        costSummary: '-10 kWh Enerji',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 10);
          return { consequence: 'MAV valfi batarya gücüyle ısıtıldı.', scoreImpact: 10 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.frozen_valve.optB',
        costSummary: '-12% O2, +4 mSv Radyasyon',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 12);
          s.resources.radiationMsv += 4;
          return { consequence: 'Gece EVA çıkışı ile donmuş valf manuel olarak çözüldü.', scoreImpact: 20 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.frozen_valve.optC',
        costSummary: 'Tamir Kiti / RHU Kullanımı',
        apply(s) {
          if (s.inventory.rhuUnits > 0) {
            return { consequence: 'Sökülen RHU ısıtıcı ünitesi valfi enerji harcamadan korudu!', scoreImpact: 45 };
          }
          if (s.inventory.repairKits > 0) {
            s.inventory.repairKits -= 1;
            return { consequence: 'Tamir kiti kullanılarak valf izole edildi.', scoreImpact: 35 };
          }
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 12);
          return { consequence: 'Yedek kit olmadığı için acil batarya gücü çekildi.', scoreImpact: -15 };
        }
      }
    ]
  },
  {
    id: 'radiator_overheat',
    fxType: 'clear',
    titleKey: 'crisis.radiator_overheat.title',
    descKey: 'crisis.radiator_overheat.desc',
    adviceKey: 'crisis.radiator_overheat.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.radiator_overheat.optA',
        costSummary: '-10% O2 (EVA Radyatör Temizliği)',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 10);
          return { consequence: 'Radyatör kanatlarındaki toz temizlendi, ısı atımı normale döndü.', scoreImpact: 30 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.radiator_overheat.optB',
        costSummary: '-14% O2, -4 kWh',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 14);
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 4);
          return { consequence: 'MOXIE gücü kısılarak kabin aşırı ısınması durduruldu.', scoreImpact: 10 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.radiator_overheat.optC',
        costSummary: '-15 Litre Su',
        apply(s) {
          s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 15);
          return { consequence: 'Yedek soğutma suyu pompalanarak sistem soğutuldu.', scoreImpact: 15 };
        }
      }
    ]
  },
  {
    id: 'marsquake_landslide',
    fxType: 'quake',
    titleKey: 'crisis.marsquake_landslide.title',
    descKey: 'crisis.marsquake_landslide.desc',
    adviceKey: 'crisis.marsquake_landslide.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.marsquake_landslide.optA',
        costSummary: '-8% Akıl Sağlığı, O2 Korunur',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 8);
          return { consequence: 'O2 hattı korundu, devrilen sera rafı yeniden toplandı.', scoreImpact: 15 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.marsquake_landslide.optB',
        costSummary: '-14% O2 Sızıntısı, Deneyler Korunur',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 14);
          return { consequence: 'Deney tüpleri kurtarıldı ancak hava kilidinden O2 sızdı.', scoreImpact: 10 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.marsquake_landslide.optC',
        costSummary: 'SEIS Sismometresi / Tamir Kiti',
        apply(s) {
          if (s.design.instruments.includes('seis')) {
            return { consequence: 'SEIS 30 sn önceden uyardı! Tüm raflar sıfır kayıpla kilitlendi.', scoreImpact: 50 };
          }
          if (s.inventory.repairKits > 0) {
            s.inventory.repairKits -= 1;
            return { consequence: 'Tamir kitiyle sarsıntı hasarı anında onarıldı.', scoreImpact: 30 };
          }
          s.resources.o2 = Math.max(5, s.resources.o2 - 16);
          return { consequence: 'SEIS olmadığı için sarsıntı hazırlıksız yakaladı (-16% O2).', scoreImpact: -20 };
        }
      }
    ]
  },
  {
    id: 'solar_flare_spe',
    fxType: 'hallucination',
    titleKey: 'crisis.solar_flare_spe.title',
    descKey: 'crisis.solar_flare_spe.desc',
    adviceKey: 'crisis.solar_flare_spe.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.solar_flare_spe.optA',
        costSummary: '+2 mSv Minimal Doz (Su Kalkanı)',
        apply(s) {
          s.resources.radiationMsv += 2;
          s.resources.evaDistanceM = 0;
          return { consequence: 'Su tanklı sığınakta güneş patlaması güvenle atlatıldı.', scoreImpact: 35 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.solar_flare_spe.optB',
        costSummary: '+38 mSv Radyasyon, -15% Akıl Sağlığı',
        apply(s) {
          s.resources.radiationMsv += 38;
          s.resources.sanity = Math.max(5, s.resources.sanity - 15);
          return { consequence: 'Açık yüzeyde yüksek enerjili proton dozuna maruz kalındı!', scoreImpact: -35 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.solar_flare_spe.optC',
        costSummary: '-5 kWh Enerji, +4 mSv Doz',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 5);
          s.resources.radiationMsv += 4;
          return { consequence: 'Sığınaktan çıkmadan otonom drone ile veri toplandı.', scoreImpact: 25 };
        }
      }
    ]
  },
  {
    id: 'data_congestion',
    fxType: 'clear',
    titleKey: 'crisis.data_congestion.title',
    descKey: 'crisis.data_congestion.desc',
    adviceKey: 'crisis.data_congestion.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.data_congestion.optA',
        costSummary: '-8% Akıl Sağlığı, Adli Rapor Gönderilir',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 8);
          const unsent = s.downlinkQueue.find((p) => !p.sent);
          if (unsent) {
            unsent.sent = true;
            if (unsent.type === 'forensic' && s.forensics[unsent.refId]) {
              s.forensics[unsent.refId].sent = true;
            }
          }
          return { consequence: 'MRO rölesinden bilimsel adli rapor öncelikli gönderildi.', scoreImpact: 30 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.data_congestion.optB',
        costSummary: '-4 kWh X-Band Gücü, Deney Gönderilir',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 4);
          const unsentExp = s.downlinkQueue.find((p) => p.type === 'experiment' && !p.sent);
          if (unsentExp) {
            unsentExp.sent = true;
            if (s.experiments[unsentExp.refId]) s.experiments[unsentExp.refId].sent = true;
          }
          return { consequence: 'Yüksek güçlü X-Band ile deney paketi Dünya’ya ulaştırıldı.', scoreImpact: 30 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.data_congestion.optC',
        costSummary: '-18 Mbit Veri, +22% Akıl Sağlığı',
        apply(s) {
          s.budgets.dataUsedThisSol = Math.min(
            s.budgets.dataPerSolMax,
            s.budgets.dataUsedThisSol + 18
          );
          s.resources.sanity = Math.min(100, s.resources.sanity + 22);
          return { consequence: 'Aileden gelen video mesajı izlendi, moral ve odak yenilendi!', scoreImpact: 20 };
        }
      }
    ]
  },
  {
    id: 'dust_devil_bonus',
    fxType: 'dust_devil',
    titleKey: 'crisis.dust_devil_bonus.title',
    descKey: 'crisis.dust_devil_bonus.desc',
    adviceKey: 'crisis.dust_devil_bonus.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.dust_devil_bonus.optA',
        costSummary: 'ÖDÜL: Panel Tozu %0, +12 kWh, +10% Sanity',
        apply(s) {
          s.resources.panelDust = 0.0;
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 12);
          s.resources.sanity = Math.min(100, s.resources.sanity + 10);
          return { consequence: 'Toz şeytanı güneş panellerini tertemiz yaptı, bataryalar doldu!', scoreImpact: 45 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.dust_devil_bonus.optB',
        costSummary: 'ÖDÜL: Panel Temizlenir + 35 Puanlık Fotoğraf',
        apply(s) {
          s.resources.panelDust = 0.0;
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 8);
          s.downlinkQueue.push({
            id: `photo_dd_${s.sol}`,
            type: 'photo',
            refId: 'dust_devil',
            title: 'Toz Şeytanı (Dust Devil) Meteoroloji Fotoğrafı',
            sizeMbit: 12,
            points: 35,
            sent: false
          });
          return { consequence: 'Paneller temizlendi ve nadir meteoroloji fotoğrafı kuyruğa eklendi!', scoreImpact: 55 };
        }
      }
    ]
  }
];

/**
 * Belirli bir krizi veya Sol numarasına göre sıradaki olayı tetikler
 */
export function pickAndTriggerSolEvent(forcedId = null) {
  const state = getState();
  let chosen = null;

  if (forcedId) {
    chosen = CRISIS_CATALOG.find((c) => c.id === forcedId);
  } else {
    // Sol bazlı dengeli ve öğretici olay dizisi
    const order = state.demoMode
      ? ['joint_freeze', 'dust_storm', 'dust_devil_bonus', 'marsquake_landslide']
      : [
          'joint_freeze',
          'radiator_overheat',
          'dust_devil_bonus',
          'marsquake_landslide',
          'dust_storm',
          'frozen_valve',
          'solar_flare_spe',
          'data_congestion'
        ];
    const idx = (state.sol - 2 + order.length) % order.length;
    const id = order[idx];
    chosen = CRISIS_CATALOG.find((c) => c.id === id) || CRISIS_CATALOG[0];
  }

  if (!chosen) return;

  const horizons = getHorizonsForSol(state.sol);

  updateState((s) => {
    s.activeCrisis = {
      id: chosen.id,
      fxType: chosen.fxType,
      titleKey: chosen.titleKey,
      descKey: chosen.descKey,
      adviceKey: chosen.adviceKey,
      options: chosen.options.map((o) => ({
        id: o.id,
        labelKey: o.labelKey,
        costSummary: o.costSummary
      })),
      missionControlConsulted: false,
      lightDelayFormatted: horizons.formatted,
      roundTripMin: Math.round(horizons.minutes * 2 * 10) / 10
    };
  });

  bus.emit('fx:weather', { type: chosen.fxType });
  bus.emit('audio:play', chosen.id === 'dust_devil_bonus' ? 'scan' : 'alarm');
}

/**
 * M7: Gecikmeli Görev Kontrol'e Danış (2x Işık Gecikmesi bekletir ve tavsiyeyi açar)
 */
export function consultMissionControl() {
  updateState((s) => {
    if (!s.activeCrisis || s.activeCrisis.missionControlConsulted) return;
    s.activeCrisis.missionControlConsulted = true;
    // Bekleme süresinde biraz O2/enerji harcanır (Işık gecikmesinin gerçek bedeli!)
    s.resources.o2 = Math.max(2, Math.round((s.resources.o2 - 3) * 10) / 10);
  });
  bus.emit('audio:play', 'downlink');
}

/**
 * Kriz Kartında Seçilen Seçeneği Uygular ve decisionLog[]'a Yazar (M2)
 */
export function resolveCrisisOption(optionId) {
  const state = getState();
  if (!state.activeCrisis) return;

  const crisisDef = CRISIS_CATALOG.find((c) => c.id === state.activeCrisis.id);
  const optDef = crisisDef?.options.find((o) => o.id === optionId);
  if (!crisisDef || !optDef) return;

  updateState((s) => {
    const res = optDef.apply(s);
    logDecision({
      sol: s.sol,
      category: 'crisis',
      title: t(crisisDef.titleKey),
      choice: t(optDef.labelKey),
      costText: `[${optDef.costSummary}]`,
      consequence: res.consequence,
      scoreImpact: res.scoreImpact
    });
    s.activeCrisis = null;
  });

  bus.emit('fx:weather', { type: 'clear' });
  bus.emit('audio:play', 'click');
}
