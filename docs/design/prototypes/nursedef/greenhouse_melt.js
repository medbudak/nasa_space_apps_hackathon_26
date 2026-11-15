(function (S) {
  'use strict';

  const STAGES = [
    { min: 0,  icon: '🌱', tr: '01 · Tohum & Çimlenme',   en: '01 · Seed & Germination' },
    { min: 25, icon: '🌿', tr: '02 · Genç Filiz',         en: '02 · Young Sprout' },
    { min: 55, icon: '🪴', tr: '03 · Yapraklı Gövde',     en: '03 · Leafy Stem' },
    { min: 85, icon: '🍅', tr: '04 · Olgun Hasat Hazır!', en: '04 · Ready to Harvest!' }
  ];

  function ensureMeltState(s) {
    if (!s.greenhouse) return null;
    if (typeof s.greenhouse.growthPct !== 'number') s.greenhouse.growthPct = 15;
    if (typeof s.greenhouse.harvestCount !== 'number') s.greenhouse.harvestCount = 0;
    if (typeof s.res.meltedIceTotalL !== 'number') s.res.meltedIceTotalL = 0;
    return s.greenhouse;
  }

  function getStage(pct) {
    let cur = STAGES[0];
    for (const st of STAGES) {
      if (pct >= st.min) cur = st;
    }
    return cur;
  }

  function getAmbientTemp(s) {
    if (!s || !S.Engineering || !S.Sim || !S.Sim.site) return -40;
    const site = S.Sim.site(s);
    return S.Engineering.ambientTempAt(site, s.minute);
  }

  // 1. Atmosfer sicakligi 0 C uzerine ciktiginda buzun eriyip suya donusmesi + bitki fotosentezi
  let lastCheckedTotalMin = -1;
  let meltAccumulatorL = 0;

  function tickThermalMeltAndGrowth() {
    const s = S.getState();
    if (!s || s.sol < 1 || s.scene === 'menu' || s.gameOver || s.ending) return;
    ensureMeltState(s);

    const curMin = Math.floor(s.totalMinutes || 0);
    if (lastCheckedTotalMin < 0 || curMin < lastCheckedTotalMin) {
      lastCheckedTotalMin = curMin;
      return;
    }
    const deltaMin = curMin - lastCheckedTotalMin;
    if (deltaMin <= 0) return;
    lastCheckedTotalMin = curMin;

    const tempC = getAmbientTemp(s);
    // Mars'ta sicaklik 0 C ustune ciktiginda yuzey buzu erir (oransal hiz)
    if (tempC > 0) {
      const meltRateLPerHour = 0.8 + (tempC / 20) * 1.4; // +20 C'de saatte ~2.2 L erime suyu
      meltAccumulatorL += (meltRateLPerHour / 60) * deltaMin;
      if (meltAccumulatorL >= 0.5) {
        const gained = Math.round(meltAccumulatorL * 10) / 10;
        meltAccumulatorL = 0;
        s.res.waterL = Math.round((s.res.waterL + gained) * 10) / 10;
        s.res.meltedIceTotalL = Math.round((s.res.meltedIceTotalL + gained) * 10) / 10;
        if (S.UI && S.UI.toast && Math.floor(s.res.meltedIceTotalL) !== Math.floor(s.res.meltedIceTotalL - gained)) {
          S.UI.toast(
            S.lang === 'en'
              ? 'Warm Mars air (' + tempC + '°C) melted subsurface ice: +' + gained + ' L water!'
              : 'Atmosfer sıcaklığı (' + tempC + '°C) buzu eritti: +' + gained + ' L su kazanıldı!',
            'info',
            3000
          );
        }
      }
    }

    // Sera kurulu, donmamis ve guc aliyorsa bitkiler yavasca buyur ve O2 uretir
    const gh = s.greenhouse;
    const ghLoad = (s.loads || []).find((l) => l.id === 'greenhouse');
    if (gh && gh.installed && !gh.frozen && ghLoad && ghLoad.on && !ghLoad.shed) {
      gh.growthPct = Math.min(100, Math.round((gh.growthPct + deltaMin * 0.035) * 10) / 10);
      if (gh.growthPct >= 55) {
        s.res.o2ReserveKg = Math.round((s.res.o2ReserveKg + deltaMin * 0.00025) * 100) / 100;
      }
    }
  }

  // 2. Sera penceresini (HP.openGreenhouse) erime suyu + buyume evreleriyle zenginlestir
  function hookGreenhouseModal() {
    if (!S.HabitatPanel || !S.HabitatPanel.openGreenhouse) return;
    const origOpenGh = S.HabitatPanel.openGreenhouse;

    S.HabitatPanel.openGreenhouse = function () {
      const s = S.getState();
      if (!s) return origOpenGh();
      ensureMeltState(s);
      const gh = s.greenhouse;
      const tempC = getAmbientTemp(s);
      const st = getStage(gh.growthPct);
      const lang = S.lang === 'en' ? 'en' : 'tr';
      const meltingNow = tempC > 0;

      const meltBanner =
        '<div style="padding:8px 10px;margin-bottom:8px;border-radius:8px;background:' +
        (meltingNow ? 'rgba(63,224,230,0.12)' : 'rgba(255,255,255,0.05)') +
        ';border:1px solid ' + (meltingNow ? 'rgba(63,224,230,0.4)' : 'rgba(255,255,255,0.15)') + ';font-size:0.84em;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">' +
        '<span>🌡️ ' + (lang === 'en' ? 'Atmosphere Temp:' : 'Atmosfer Sıcaklığı:') + ' <b>' + tempC + ' °C</b></span>' +
        '<span>💧 ' + (lang === 'en' ? 'Water Tank:' : 'Su Tankı:') + ' <b>' + s.res.waterL.toFixed(1) + ' L</b></span>' +
        '</div>' +
        '<div style="color:' + (meltingNow ? '#3fe0e6' : '#9fb0c3') + ';">' +
        (meltingNow
          ? (lang === 'en'
              ? '☀️ Ice is actively melting into water! (Total melted: ' + s.res.meltedIceTotalL.toFixed(1) + ' L)'
              : '☀️ Sıcaklık 0°C üstünde: Buz eriyerek su üretiyor! (Toplam eriyen: ' + s.res.meltedIceTotalL.toFixed(1) + ' L)')
          : (lang === 'en'
              ? '❄️ Below 0°C: Ice is frozen. Wait for midday warmth or dig ice with RIMFAX.'
              : '❄️ 0°C altı: Doğal erime durdu. Öğle sıcağını bekle veya RIMFAX ile buz kaz.')) +
        '</div></div>';

      const growthBox = gh.installed && !gh.frozen
        ? '<div style="padding:8px 10px;margin-bottom:8px;border-radius:8px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.35);font-size:0.85em;">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
          '<span>' + st.icon + ' <b>' + st[lang] + '</b></span>' +
          '<span><b>%' + Math.round(gh.growthPct) + '</b> (Hasat: ' + gh.harvestCount + ')</span>' +
          '</div>' +
          S.UI.bar(gh.growthPct, gh.growthPct >= 85 ? 'cyan' : 'amber') +
          '<div style="display:flex;gap:6px;margin-top:8px;">' +
          '<button type="button" class="btn btn-sm btn-primary" data-gh-water ' + (s.res.waterL < 2 ? 'disabled' : '') + '>' +
          (lang === 'en' ? '💧 Water Plants (-2 L → +25% Growth)' : '💧 Eriyen Suyla Sula (-2 L → +%25 Büyüme)') +
          '</button>' +
          (gh.growthPct >= 85
            ? '<button type="button" class="btn btn-sm btn-primary" style="background:#16a34a;border-color:#22c55e;" data-gh-harvest>' +
              (lang === 'en' ? '🌾 Harvest Crops' : '🌾 Hasat Et (+12 Moral, +1.5 kg O₂)') +
              '</button>'
            : '') +
          '</div></div>'
        : '';

      origOpenGh();

      setTimeout(() => {
        const modal = document.querySelector('.action-modal');
        if (!modal || modal.dataset.ghEnhanced === '1') return;
        modal.dataset.ghEnhanced = '1';
        const head = modal.querySelector('.modal-head');
        if (head) head.insertAdjacentHTML('afterend', meltBanner + growthBox);

        const waterBtn = modal.querySelector('[data-gh-water]');
        if (waterBtn) {
          waterBtn.addEventListener('click', () => {
            if (s.res.waterL < 2) return;
            s.res.waterL = Math.round((s.res.waterL - 2) * 10) / 10;
            gh.growthPct = Math.min(100, Math.round(gh.growthPct + 25));
            gh.yieldPct = Math.min(150, (gh.yieldPct || 100) + 10);
            s.res.morale = Math.min(100, s.res.morale + 4);
            s.minute += 15;
            s.totalMinutes += 15;
            S.UI.toast(
              lang === 'en' ? 'Plants watered! Growth reached %' + gh.growthPct : 'Bitkiler sulandı! Büyüme %' + gh.growthPct + ' oldu.',
              'ok'
            );
            S.UI.closeModal('action', true);
            S.Game.afterAction();
            S.HabitatPanel.openGreenhouse();
          });
        }

        const harvestBtn = modal.querySelector('[data-gh-harvest]');
        if (harvestBtn) {
          harvestBtn.addEventListener('click', () => {
            gh.growthPct = 15;
            gh.harvestCount = (gh.harvestCount || 0) + 1;
            s.res.morale = Math.min(100, s.res.morale + 12);
            s.res.o2ReserveKg = Math.round((s.res.o2ReserveKg + 1.5) * 10) / 10;
            s.res.waterL = Math.round((s.res.waterL + 2.5) * 10) / 10;
            S.UI.toast(
              lang === 'en' ? 'Fresh Mars harvest complete! +12 Morale, +1.5 kg O₂!' : 'Taze Mars hasadı tamamlandı! +12 Moral ve +1.5 kg O₂ kazanıldı!',
              'ok'
            );
            S.UI.closeModal('action', true);
            S.Game.afterAction();
            S.HabitatPanel.openGreenhouse();
          });
        }
      }, 20);
    };
  }

  setInterval(tickThermalMeltAndGrowth, 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hookGreenhouseModal, 250));
  else setTimeout(hookGreenhouseModal, 250);
})((window.SOL14 = window.SOL14 || {}));
