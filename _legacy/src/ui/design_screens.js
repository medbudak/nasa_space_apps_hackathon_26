/**
 * SOL 14: RED HORIZON — Sol 0: 5 Aşamalı Görev Tasarım Konsolu ve SPOF Uyarısı (M8 - K3)
 */

import { NASA_DATA, calcDesignTotals } from '../core/engineering.js';
import { getState, updateState, resetState, t, bus } from '../core/state.js';
import { launchMissionFromDesign } from '../core/sim.js';

export function renderDesignScreen(container) {
  const state = getState();
  const d = state.design;
  const totals = calcDesignTotals(d);

  const moneyPct = Math.min(100, Math.round((totals.moneyUsed / totals.moneyMax) * 100));
  const massPct = Math.min(100, Math.round((totals.massUsed / totals.massMax) * 100));
  const powerPct = Math.min(
    100,
    Math.round((totals.powerConsW / Math.max(1, totals.powerProdW)) * 100)
  );

  container.innerHTML = `
    <div class="design-wrapper" style="background-image: linear-gradient(rgba(8,12,24,0.88), rgba(8,12,24,0.95)), url('assets/screens/scr_launch.png');">
      <!-- Üst 4 Mühendislik Bütçe Çubuğu -->
      <div class="budget-bars-grid">
        <div class="budget-card ${totals.moneyUsed > totals.moneyMax ? 'over' : ''}">
          <div class="b-head">
            <span>💰 ${t('budget.money')}</span>
            <strong>$${totals.moneyUsed}M / $${totals.moneyMax}M</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${totals.moneyUsed > totals.moneyMax ? 'danger' : 'ok'}" style="width:${moneyPct}%"></div>
          </div>
        </div>

        <div class="budget-card ${totals.massUsed > totals.massMax ? 'over' : ''}">
          <div class="b-head">
            <span>⚖️ ${t('budget.mass')}</span>
            <strong>${totals.massUsed} / ${totals.massMax} kg (${totals.massMarginPct}% Marj)</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${totals.massUsed > totals.massMax ? 'danger' : totals.massMarginPct >= 10 ? 'ok' : 'warn'}" style="width:${massPct}%"></div>
          </div>
          <small class="b-sub">${totals.massMarginPct >= 10 ? '✅ ' + t('budget.margin_ok') : '⚠️ ' + t('budget.margin_low')}</small>
        </div>

        <div class="budget-card ${!totals.batteryNightSafe ? 'over' : ''}">
          <div class="b-head">
            <span>⚡ ${t('budget.power')}</span>
            <strong>Üretim: ${totals.powerProdW}W | Yük: ${totals.powerConsW}W</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${!totals.batteryNightSafe ? 'danger' : 'ok'}" style="width:${powerPct}%"></div>
          </div>
          <small class="b-sub">Gece İhtiyacı: ${totals.nightEnergyNeededKwh} kWh vs Batarya: ${d.batteryKwh} kWh</small>
        </div>

        <div class="budget-card">
          <div class="b-head">
            <span>📡 ${t('budget.data')} & Δv</span>
            <strong>${totals.dataPerSolMax} Mbit/Sol | Δv: ${totals.deltaVAvailableMs} m/s</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ok" style="width:${Math.min(100, (totals.dataPerSolMax / 80) * 100)}%"></div>
          </div>
          <small class="b-sub">Seçilen Bilimsel Alet: ${d.instruments.length} / 5</small>
        </div>
      </div>

      <div class="design-main-grid">
        <div class="design-steps-col">
          <!-- EKRAN 1: Görev Hedefi -->
          <section class="design-card">
            <h3>🎯 ${t('design.step1_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.objectives
                .map(
                  (obj) => `
                <button class="choice-card ${d.objectiveFocus === obj.id ? 'selected' : ''}" data-field="objectiveFocus" data-val="${obj.id}">
                  <strong>${t(`obj.${obj.id}.name`)}</strong>
                  <p>${t(`obj.${obj.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- EKRAN 2: Roket, Yörünge ve Fırlatma Penceresi -->
          <section class="design-card">
            <h3>🚀 ${t('design.step2_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.rockets
                .map(
                  (r) => `
                <button class="choice-card ${d.rocketId === r.id ? 'selected' : ''}" data-field="rocketId" data-val="${r.id}">
                  <strong>${r.name}</strong>
                  <p>Kapasite: <b>${r.payloadMarsKg} kg</b> | Maliyet: <b>$${r.costM}M</b> | Isp: ${r.ispSec}s</p>
                </button>
              `
                )
                .join('')}
            </div>
            <div class="choice-row mt-8">
              ${NASA_DATA.orbits
                .map(
                  (o) => `
                <button class="choice-card ${d.orbitType === o.id ? 'selected' : ''}" data-field="orbitType" data-val="${o.id}">
                  <strong>${t(`orbit.${o.id}.name`)}</strong>
                  <p>${t(`orbit.${o.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>
            <div class="choice-row mt-8">
              <button class="choice-card ${d.launchWindowCaught ? 'selected' : ''}" data-window="true">
                <strong>🗓️ ${t('window.caught')}</strong>
              </button>
              <button class="choice-card ${!d.launchWindowCaught ? 'selected' : ''}" data-window="false">
                <strong>⏳ ${t('window.missed')}</strong>
              </button>
            </div>
          </section>

          <!-- EKRAN 3: İniş Bölgesi, Güç, Batarya ve Yalıtım -->
          <section class="design-card">
            <h3>🌍 ${t('design.step3_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.landingSites
                .map(
                  (s) => `
                <button class="choice-card ${d.landingSiteId === s.id ? 'selected' : ''}" data-field="landingSiteId" data-val="${s.id}">
                  <strong>${t(`site.${s.id}.name`)}</strong>
                  <p>${t(`site.${s.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>

            <div class="choice-row mt-8">
              <button class="choice-card ${d.powerSource === 'solar_only' ? 'selected' : ''}" data-field="powerSource" data-val="solar_only">
                <strong>☀️ ${t('pwr.solar_only.name')}</strong>
                <p>${t('pwr.solar_only.desc')}</p>
              </button>
              <button class="choice-card ${d.powerSource === 'solar_rtg' ? 'selected' : ''}" data-field="powerSource" data-val="solar_rtg">
                <strong>☢️ ${t('pwr.solar_rtg.name')}</strong>
                <p>${t('pwr.solar_rtg.desc')}</p>
              </button>
            </div>

            <div class="choice-row mt-8">
              ${NASA_DATA.habitatOptions.batteries
                .map(
                  (b) => `
                <button class="choice-card ${d.batteryKwh === b.kwh ? 'selected' : ''}" data-battery="${b.kwh}">
                  <strong>🔋 Batarya: ${b.kwh} kWh</strong>
                  <p>Kütle: ${b.massKg} kg | Maliyet: $${b.costM}M</p>
                </button>
              `
                )
                .join('')}
              <button class="choice-card ${d.insulation === 'thin' ? 'selected' : ''}" data-field="insulation" data-val="thin">
                <strong>🧊 ${t('ins.thin.name')}</strong>
              </button>
              <button class="choice-card ${d.insulation === 'thick' ? 'selected' : ''}" data-field="insulation" data-val="thick">
                <strong>🛡️ ${t('ins.thick.name')}</strong>
              </button>
            </div>
          </section>

          <!-- EKRAN 4: 9 Bilimsel Aletten En Fazla 5 Seçim -->
          <section class="design-card">
            <h3>🔬 ${t('design.step4_title')} (${d.instruments.length} / 5)</h3>
            <div class="instruments-grid">
              ${NASA_DATA.instruments
                .map((inst) => {
                  const active = d.instruments.includes(inst.id);
                  return `
                  <button class="inst-card ${active ? 'selected' : ''}" data-inst="${inst.id}">
                    <div class="inst-top">
                      <strong>${active ? '✅' : '⬜'} ${t(`inst.${inst.id}.name`)}</strong>
                      <span class="inst-cost">$${inst.costM}M</span>
                    </div>
                    <div class="inst-specs">${inst.massKg} kg | ${inst.powerW} W | ${inst.dataMbit} Mbit</div>
                    <p>${t(`inst.${inst.id}.desc`)}</p>
                  </button>
                `;
                })
                .join('')}
            </div>
          </section>

          <!-- EKRAN 5: İletişim Mimarisi & Yedek Parça Kiti -->
          <section class="design-card">
            <h3>📡 ${t('design.step5_title')}</h3>
            <div class="choice-row">
              <button class="choice-card ${d.commArchitecture === 'relay_only' ? 'selected' : ''}" data-field="commArchitecture" data-val="relay_only">
                <strong>📡 ${t('comm.relay_only.name')}</strong>
              </button>
              <button class="choice-card ${d.commArchitecture === 'relay_xband' ? 'selected' : ''}" data-field="commArchitecture" data-val="relay_xband">
                <strong>📡 ${t('comm.relay_xband.name')}</strong>
              </button>
            </div>
            <div class="choice-row mt-8">
              ${[0, 1, 2]
                .map(
                  (k) => `
                <button class="choice-card ${d.repairKits === k ? 'selected' : ''}" data-kits="${k}">
                  <strong>🔧 Yedek Parça / Tamir Kiti: ${k} Adet</strong>
                  <p>+${k * 22} kg | +$${k * 30}M (Her kit 1 krizi bedelsiz çözer)</p>
                </button>
              `
                )
                .join('')}
            </div>
          </section>
        </div>

        <!-- Sağ Sütun: SPOF Uyarıları (M8) ve Fırlatma Butonları -->
        <aside class="design-sidebar">
          <div class="spof-box">
            <h3>${t('design.spof_header')} (M8)</h3>
            ${
              totals.spofWarnings.length === 0
                ? `<div class="spof-ok">✅ Kritik Tek Nokta Arıza (SPOF) riski tespit edilmedi! Tasarımınız NASA yedeklilik standartlarına uygun.</div>`
                : `<ul class="spof-list">
                    ${totals.spofWarnings.map((wKey) => `<li>⚠️ ${t(wKey)}</li>`).join('')}
                  </ul>`
            }
          </div>

          <div class="launch-actions">
            <button class="btn-launch ${!totals.canLaunch ? 'disabled' : ''}" id="btn-start-mission" ${
              !totals.canLaunch ? 'disabled' : ''
            }>
              ${t('design.btn_launch')} (${state.demoMode ? '5 SOL HIZLI MOD' : '14 SOL TAM GÖREV'})
            </button>

            <button class="btn-secondary full-w" id="btn-demo-mode-launch">
              ${t('app.btn_demo_mission')}
            </button>

            <button class="btn-sm full-w" id="btn-reset-preset">
              🔄 ${t('design.btn_preset_balanced')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `;

  // Olay Dinleyicileri
  container.querySelectorAll('[data-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-field');
      const val = btn.getAttribute('data-val');
      updateState((s) => {
        s.design[field] = val;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-window]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caught = btn.getAttribute('data-window') === 'true';
      updateState((s) => {
        s.design.launchWindowCaught = caught;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-battery]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kwh = Number(btn.getAttribute('data-battery'));
      updateState((s) => {
        s.design.batteryKwh = kwh;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-kits]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kits = Number(btn.getAttribute('data-kits'));
      updateState((s) => {
        s.design.repairKits = kits;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-inst]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const instId = btn.getAttribute('data-inst');
      updateState((s) => {
        const list = s.design.instruments;
        if (list.includes(instId)) {
          if (list.length > 1) {
            s.design.instruments = list.filter((x) => x !== instId);
          }
        } else if (list.length < 5) {
          s.design.instruments = [...list, instId];
        }
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelector('#btn-start-mission')?.addEventListener('click', () => {
    launchMissionFromDesign();
  });

  container.querySelector('#btn-demo-mode-launch')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: true });
    launchMissionFromDesign();
  });

  container.querySelector('#btn-reset-preset')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: state.demoMode });
    bus.emit('audio:play', 'click');
  });
}
