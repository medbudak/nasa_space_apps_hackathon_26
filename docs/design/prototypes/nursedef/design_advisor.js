(function (S) {
  'use strict';

  const INST_ROLES = {
    mastcam_z: {
      tr: 'Enkazları ve final sahnesini yüksek çözünürlükle fotoğraflar. Olmazsa el kamerası kullanılır ve puan/bütçe %50 düşer.',
      en: 'Captures high-res wreck and final photos. Without it, hand camera reduces photo score/budget by 50%.'
    },
    meda: {
      tr: 'Toz fırtınalarını 90 dk önceden haber verir; panelleri koruma ve enerji planlama şansı tanır.',
      en: 'Warns 90 min before dust storms so you can shield panels and manage power.'
    },
    seis: {
      tr: 'Mars depremlerini önceden algılar; habitat ve sera boruları hasar almadan önlem almanı sağlar.',
      en: 'Detects marsquakes early so you can brace habitat and greenhouse systems.'
    },
    rad: {
      tr: 'Güneş patlaması (SPE) radyasyon fırtınasını önceden bildirir; sığınağa girip 45 mSv yerine 3 mSv doz alırsın.',
      en: 'Predicts Solar Particle Events so sheltering cuts radiation from 45 mSv to 3 mSv.'
    },
    rimfax: {
      tr: 'Yer altı radar taramasıyla 260m ilerideki su buzu yatağını bulur; kazıp eriterek su ve roket yakıtı üretirsin.',
      en: 'Subsurface radar locates water ice at 260m; dig and melt it for water and MAV fuel.'
    },
    supercam: {
      tr: 'Kayaç ve enkaz malzemelerini lazerle analiz eder; bilimsel deney ve teşhis hızını artırır.',
      en: 'Laser spectrometer analyzes rocks and wrecks, boosting experiment and diagnosis yield.'
    },
    moxie: {
      tr: 'Mars atmosferindeki %95 CO₂ gazından saatte 6–10g saf oksijen üretir; O₂ krizinde hayat kurtarır.',
      en: 'Produces 6–10g/h of O₂ directly from Mars CO₂ atmosphere; prevents oxygen depletion.'
    },
    veggie: {
      tr: 'Habitat içinde sera kurar; bitkileri sulayıp büyüterek mürettebat moralini her Sol yükseltir.',
      en: 'Builds an indoor greenhouse; watering and growing crops boosts crew morale every Sol.'
    },
    ingenuity: {
      tr: 'Keşif dronu haritadaki tüm gizli enkazların yerini anında açığa çıkarır ve yürüyüş süresini kısaltır.',
      en: 'Scout helicopter reveals all hidden wrecks across the map, saving EVA oxygen and time.'
    }
  };

  function buildImpactHtml(d, tot) {
    const D = S.DATA;
    const rocket = S.Engineering.findById(D.rockets, d.rocketId);
    const orbit = S.Engineering.findById(D.orbits, d.orbitType);
    const site = S.Engineering.findById(D.landingSites, d.landingSiteId);
    const lang = S.lang === 'en' ? 'en' : 'tr';

    const cargoBonus = tot.massMarginPct >= 15;
    const rocketTxt =
      lang === 'en'
        ? rocket.name + ' carries ' + tot.massMax + ' kg (' + (cargoBonus ? '+4 kg O₂ & +10 L water cargo bonus active!' : 'keep ≥15% free mass for extra O₂/water cargo') + ').'
        : rocket.name + ' toplam ' + tot.massMax + ' kg yük taşır (' + (cargoBonus ? '+4 kg O₂ ve +10 L su ek ikmal bonusu aktif!' : '%15+ boş yük bırakırsan ekstra O₂/su taşır') + ').';

    const orbitTxt =
      lang === 'en'
        ? (orbit.id === 'fast_transfer'
            ? 'Fast Trajectory (180 days): Lower radiation (' + tot.transitDoseMsv + ' mSv) & faster arrival, but starts with ' + orbit.mavFuelStartPct + '% MAV fuel.'
            : 'Hohmann Orbit (259 days): Higher MAV starting fuel (' + orbit.mavFuelStartPct + '%) & +180 kg payload, but ' + tot.transitDoseMsv + ' mSv radiation.')
        : (orbit.id === 'fast_transfer'
            ? 'Hızlı Yörünge (180 gün): Daha düşük radyasyon (' + tot.transitDoseMsv + ' mSv) ve erken varış; ancak inişte MAV yakıtı %' + orbit.mavFuelStartPct + ' başlar.'
            : 'Hohmann Yörüngesi (259 gün): İnişte yüksek MAV yakıtı (%' + orbit.mavFuelStartPct + ') ve +180 kg yük kapasitesi; ancak ' + tot.transitDoseMsv + ' mSv radyasyon.');

    const siteTxt =
      lang === 'en'
        ? 'Landing at ' + site.coords + ': Day ' + site.dayMaxC + '°C / Night ' + site.nightMinC + '°C · Starting Water: ' + site.waterStartL + ' L.'
        : 'İniş Konumu (' + site.coords + '): Gündüz ' + site.dayMaxC + '°C / Gece ' + site.nightMinC + '°C · Başlangıç Suyu: ' + site.waterStartL + ' L.';

    return (
      '<div id="design-impact-box" style="margin-top:6px;padding:7px 9px;border-radius:8px;background:rgba(63,224,230,0.08);border:1px solid rgba(63,224,230,0.35);font-size:0.74em;line-height:1.32;">' +
      '<div style="color:#3fe0e6;font-weight:700;margin-bottom:5px;letter-spacing:0.04em;">' +
      (lang === 'en' ? '⚡ LIVE MISSION IMPACT' : '⚡ SEÇİMLERİN GÖREVE ETKİSİ') +
      '</div>' +
      '<div style="margin-bottom:4px;"><b>🚀 Roket & Yük:</b> ' + rocketTxt + '</div>' +
      '<div style="margin-bottom:4px;"><b>🛸 Hız & Yakıt:</b> ' + orbitTxt + '</div>' +
      '<div><b>📍 İniş Bölgesi:</b> ' + siteTxt + '</div>' +
      '</div>'
    );
  }

  function enhanceDesignScreen(root) {
    if (!root || root.dataset.advisorBound === '1') return;
    root.dataset.advisorBound = '1';

    const s = S.getState();
    if (!s || !s.design) return;
    const tot = S.Engineering.calcDesignTotals(s.design);

    // 1. Sag panele canli etki ozeti ekle
    const side = root.querySelector('.d-side');
    if (side) {
      side.style.overflowY = 'auto';
      side.style.maxHeight = 'calc(100vh - 13.5rem)';
      side.style.paddingBottom = '12px';
    }
    const actions = side ? side.querySelector('.d-actions') : null;
    if (side && actions && !side.querySelector('#design-impact-box')) {
      actions.insertAdjacentHTML('beforebegin', buildImpactHtml(s.design, tot));
    }

    // 2. Adim 4'te (Alet Secimi) her aletin gorevdeki somut faydasini vurgula
    const lang = S.lang === 'en' ? 'en' : 'tr';
    root.querySelectorAll('.inst[data-inst]').forEach((card) => {
      const id = card.dataset.inst;
      if (INST_ROLES[id] && !card.querySelector('.inst-role-tip')) {
        const tip = document.createElement('p');
        tip.className = 'inst-role-tip';
        tip.style.cssText = 'color:#7ce8ff;font-size:0.84em;margin-top:4px;border-top:1px dashed rgba(124,232,255,0.25);padding-top:4px;';
        tip.textContent = '★ ' + INST_ROLES[id][lang];
        card.appendChild(tip);
      }
    });
  }

  // Sol 1 basladiginda agir roket / yuksek yuk marji secildiyse gercek ikmal bonusu uygula
  let cargoBonusAppliedForMission = null;
  function checkCargoBonus() {
    const s = S.getState();
    if (!s || s.sol < 1 || !s.design || !s.habitat) return;
    const key = s.missionId || (s.design.rocketId + '_' + s.design.landingSiteId + '_' + s.sol);
    if (cargoBonusAppliedForMission === key) return;
    if (s.sol === 1 && !s._rocketCargoBonusGiven) {
      const tot = S.Engineering.calcDesignTotals(s.design);
      if (tot.massMarginPct >= 15) {
        s.habitat.o2Kg = Math.round((s.habitat.o2Kg + 4) * 10) / 10;
        s.habitat.waterL = Math.round((s.habitat.waterL + 10) * 10) / 10;
        s._rocketCargoBonusGiven = true;
        if (S.UI && S.UI.toast) {
          S.UI.toast(
            S.lang === 'en'
              ? 'Rocket payload bonus: +4 kg O₂ & +10 L water unloaded!'
              : 'Roket yük kapasitesi bonusu: +4 kg O₂ ve +10 L su habitata yüklendi!',
            'info',
            4000
          );
        }
      }
      cargoBonusAppliedForMission = key;
    }
  }

  const obs = new MutationObserver(() => {
    const ds = document.querySelector('.screen.design');
    if (ds) enhanceDesignScreen(ds);
    checkCargoBonus();
  });

  if (document.body) { obs.observe(document.body, { childList: true, subtree: true }); const ds0 = document.querySelector('.screen.design'); if (ds0) enhanceDesignScreen(ds0); }
  else window.addEventListener('DOMContentLoaded', () => obs.observe(document.body, { childList: true, subtree: true }));
})((window.SOL14 = window.SOL14 || {}));


