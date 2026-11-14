/**
 * SOL 14: RED HORIZON — Yüzey Operasyon HUD, Dönüşsüzlük Noktası (M4), Keşif Haritası ve Laboratuvar UI (K3)
 */

import { NASA_DATA } from '../core/engineering.js';
import { getState, updateState, t, bus } from '../core/state.js';
import {
  getPointOfNoReturnStatus,
  performEvaStep,
  cleanSolarPanels,
  runSabatierIsru,
  tendGreenhouse,
  advanceSol
} from '../core/sim.js';
import { pickAndTriggerSolEvent } from '../core/events.js';
import {
  DIAGNOSIS_CATEGORIES,
  discoverWreck,
  collectForensicEvidence,
  submitForensicDiagnosis,
  salvageWreckPart
} from '../systems/forensics.js';
import {
  EXPERIMENT_HYPOTHESES,
  configureExperiment,
  completeExperiment
} from '../systems/experiments.js';
import { runMinigame } from '../minigames/minigames.js';
import { renderDownlinkPanel } from './downlink.js';
import { renderPowerPanel } from './power_panel.js';
import {
  startSurfaceCanvasLoop,
  stopSurfaceCanvasLoop,
  triggerAstronautJump,
  triggerAstronautMove,
  triggerAstronautAction
} from '../fx/effects.js';

export function renderSurfaceHud(container) {
  const state = getState();
  const ponr = getPointOfNoReturnStatus(state);
  const hasRadDetector = state.design.instruments.includes('rad');

  container.innerHTML = `
    <div class="hud-layout">
      <!-- Üst Telemetri ve Dönüşsüzlük Noktası (M4) Çubuğu -->
      <div class="hud-top-bar">
        <div class="sol-badge">
          <strong>SOL ${state.sol} / ${state.maxSols}</strong>
          <span class="time-pill">${state.timeOfDay.toUpperCase()}</span>
        </div>

        <!-- M4: O2 Çubuğu + Kırmızı Dönüşsüzlük Noktası Çentiği -->
        <div class="hud-stat-box o2-box ${ponr.isCritical ? 'critical-pulse' : ''}">
          <div class="stat-head">
            <span>🫧 O₂: <strong>${state.resources.o2}%</strong></span>
            <span class="ponr-text" title="${t('hud.ponr_label')}">Çentik: ${ponr.requiredO2}%</span>
          </div>
          <div class="o2-bar-container">
            <div class="o2-bar-fill" style="width:${state.resources.o2}%"></div>
            <div class="ponr-notch" style="left:${Math.min(96, ponr.requiredO2)}%" title="Dönüşsüzlük Noktası: Habitata dönmek için gereken minimum O2 (${ponr.requiredO2}%)"></div>
          </div>
        </div>

        <div class="hud-stat-box">
          <span>🔋 Enerji: <strong>${state.resources.energyKwh} / ${state.design.batteryKwh} kWh</strong></span>
          <small>Panel Tozu: %${Math.round(state.resources.panelDust * 100)}</small>
        </div>

        <div class="hud-stat-box">
          <span>🌡️ Elbise: <strong>${state.resources.suitTempC}°C</strong></span>
          <small>${state.resources.jointFrozen ? '❄️ EKLEM DONDU (%40 Hız)' : 'Normal Hareket'}</small>
        </div>

        <div class="hud-stat-box">
          <span>☢️ Doz: <strong>${hasRadDetector ? `${state.resources.radiationMsv} / 150 mSv` : '??? (RAD Yok)'}</strong></span>
          <small>🧠 Akıl Sağlığı: <strong>${state.resources.sanity}%</strong></small>
        </div>

        <div class="hud-stat-box">
          <span>💧 Su: <strong>${state.resources.waterLiters}L</strong> | 🚀 MAV: <strong>${state.resources.mavFuelPct}%</strong></span>
          <small>📡 Veri: <strong>${state.budgets.dataUsedThisSol}/${state.budgets.dataPerSolMax} Mbit</strong></small>
        </div>
      </div>

      ${
        ponr.isCritical
          ? `<div class="ponr-banner">${t('hud.ponr_warning')} (Mesafe: ${state.resources.evaDistanceM}m, Gerekli O₂: %${ponr.requiredO2})</div>`
          : ''
      }

      <!-- 5 Operasyon Sekmesi -->
      <div class="hud-tabs-nav">
        <button class="tab-btn ${state.activeTab === 'surface' ? 'active' : ''}" data-tab="surface">${t('hud.tab_surface')}</button>
        <button class="tab-btn ${state.activeTab === 'map' ? 'active' : ''}" data-tab="map">${t('hud.tab_map')}</button>
        <button class="tab-btn ${state.activeTab === 'lab' ? 'active' : ''}" data-tab="lab">${t('hud.tab_lab')}</button>
        <button class="tab-btn ${state.activeTab === 'downlink' ? 'active' : ''}" data-tab="downlink">${t('hud.tab_downlink')} (${state.downlinkQueue.filter((p) => !p.sent).length})</button>
        <button class="tab-btn ${state.activeTab === 'power' ? 'active' : ''}" data-tab="power">${t('hud.tab_power')}</button>
        <button class="btn-next-sol" id="btn-advance-sol">${t('hud.btn_next_sol')}</button>
      </div>

      <!-- Sekme İçerik Alanı -->
      <div id="hud-tab-Viewport" class="hud-viewport"></div>
    </div>
  `;

  // Sekme Geçişleri
  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      stopSurfaceCanvasLoop();
      updateState((s) => {
        s.activeTab = tab;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelector('#btn-advance-sol')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    advanceSol();
  });

  const viewport = container.querySelector('#hud-tab-Viewport');
  if (state.activeTab === 'surface') {
    renderSurfaceCanvasTab(viewport);
  } else if (state.activeTab === 'map') {
    stopSurfaceCanvasLoop();
    renderForensicsMapTab(viewport);
  } else if (state.activeTab === 'lab') {
    stopSurfaceCanvasLoop();
    renderScienceLabTab(viewport);
  } else if (state.activeTab === 'downlink') {
    stopSurfaceCanvasLoop();
    renderDownlinkPanel(viewport);
  } else if (state.activeTab === 'power') {
    stopSurfaceCanvasLoop();
    renderPowerPanel(viewport);
  }
}

/**
 * SEKME 1: 2D 16-Bit Pixel Art Yüzey Canvas Sahnesi & EVA Kontrolleri
 */
function renderSurfaceCanvasTab(viewport) {
  const state = getState();
  viewport.innerHTML = `
    <div class="surface-stage-grid">
      <div class="canvas-holder">
        <canvas id="surface-canvas" width="960" height="440"></canvas>
        <div class="canvas-controls-bar">
          <button class="btn-sm" id="btn-eva-left">◀ Habitata Dön (-200m)</button>
          <button class="btn-sm" id="btn-eva-jump">⏫ 0.38g Sıçra (Space)</button>
          <button class="btn-sm" id="btn-eva-right">▶ Keşfe Yürü (+200m)</button>
          <button class="btn-sm" id="btn-time-day">☀️ Gündüz</button>
          <button class="btn-sm" id="btn-time-sunset">🌅 Mavi Gün Batımı</button>
          <button class="btn-sm" id="btn-time-night">🌌 Gece (-80°C)</button>
        </div>
      </div>

      <div class="surface-actions-panel">
        <h3>🛠️ Yüzey & Üs Operasyonları</h3>
        <button class="action-card-btn" id="act-clean-panels">
          <strong>${t('hud.btn_clean_panels')}</strong>
          <small>Panel tozunu %2'ye indirir, güneş üretimini ve şarjı artırır.</small>
        </button>

        <button class="action-card-btn" id="act-sabatier">
          <strong>${t('hud.btn_sabatier')}</strong>
          <small>CO₂ + 4H₂ → CH₄ + 2H₂O reaksiyonuyla +O₂ ve +MAV yakıtı üretir.</small>
        </button>

        <button class="action-card-btn" id="act-greenhouse">
          <strong>${t('hud.btn_greenhouse_care')}</strong>
          <small>Basınçlı seradaki filizleri sular, moral ve O₂ sağlar.</small>
        </button>

        <button class="action-card-btn" id="act-trigger-crisis">
          <strong>⚡ Kriz Kartı Simüle Et (Test / M2)</strong>
          <small>Sıradaki mühendislik kriz kartını anında açar.</small>
        </button>

        <div class="mini-log-box">
          <h4>📋 Son Mühendislik Kararları</h4>
          <ul>
            ${
              state.decisionLog.length === 0
                ? `<li class="muted">Henüz kayıt yok.</li>`
                : state.decisionLog
                    .slice(-3)
                    .reverse()
                    .map((l) => `<li><b>Sol ${l.sol}:</b> ${l.title} → ${l.choice}</li>`)
                    .join('')
            }
          </ul>
        </div>
      </div>
    </div>
  `;

  const canvas = viewport.querySelector('#surface-canvas');
  startSurfaceCanvasLoop(canvas);

  viewport.querySelector('#btn-eva-left')?.addEventListener('click', () => {
    triggerAstronautMove(-1);
    performEvaStep(-200);
  });
  viewport.querySelector('#btn-eva-right')?.addEventListener('click', () => {
    triggerAstronautMove(1);
    performEvaStep(200);
  });
  viewport.querySelector('#btn-eva-jump')?.addEventListener('click', () => {
    triggerAstronautJump();
  });

  viewport.querySelector('#btn-time-day')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'day';
    });
  });
  viewport.querySelector('#btn-time-sunset')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'sunset';
    });
  });
  viewport.querySelector('#btn-time-night')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'night';
    });
  });

  viewport.querySelector('#act-clean-panels')?.addEventListener('click', () => {
    triggerAstronautAction();
    cleanSolarPanels();
  });
  viewport.querySelector('#act-sabatier')?.addEventListener('click', () => {
    triggerAstronautAction();
    runSabatierIsru();
  });
  viewport.querySelector('#act-greenhouse')?.addEventListener('click', () => {
    tendGreenhouse();
  });
  viewport.querySelector('#act-trigger-crisis')?.addEventListener('click', () => {
    pickAndTriggerSolEvent();
  });
}

/**
 * SEKME 2: Kayıp Araçların Adli İncelemesi (Opportunity, Spirit, Phoenix, InSight, Beagle 2)
 */
function renderForensicsMapTab(viewport) {
  const state = getState();
  const hasDrone = state.design.instruments.includes('ingenuity');
  const hasSpec = state.design.instruments.includes('supercam');

  viewport.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.84), rgba(11,16,33,0.94)), url('assets/screens/scr_map_corridor.png');">
      <div class="panel-header-row">
        <div>
          <h2>🔍 ${t('forensics.title')}</h2>
          <p class="muted">${t('forensics.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>🚁 Ingenuity Drone: <strong>${hasDrone ? 'AKTİF' : 'ALINMADI'}</strong></div>
          <div>🔬 Spektrometre: <strong>${hasSpec ? 'AKTİF' : 'ALINMADI'}</strong></div>
        </div>
      </div>

      <div class="cases-grid">
        ${NASA_DATA.forensicsCases
          .map((c) => {
            const rec = state.forensics[c.id];
            const evCount =
              (rec.evidence.photo ? 1 : 0) +
              (rec.evidence.telemetry ? 1 : 0) +
              (rec.evidence.env ? 1 : 0);

            return `
            <div class="case-card ${rec.sent ? 'case-sent' : ''}">
              <div class="case-top">
                <img src="${c.sprite}" alt="${c.name}" class="case-sprite" />
                <div>
                  <h3>${c.name} <small>(${c.agency})</small></h3>
                  <div class="case-meta">Son Temas: ${c.lastContact} | Mesafe: <b>${c.distanceMeters} m</b></div>
                  <div class="case-coords">Gerçek Konum: ${c.realCoords}</div>
                </div>
              </div>

              ${
                !rec.discovered
                  ? `
                <div class="case-discover-row">
                  <button class="btn-secondary btn-disc-eva" data-case="${c.id}">${t('forensics.btn_eva')} (${c.distanceMeters}m)</button>
                  ${
                    hasDrone
                      ? `<button class="btn-primary btn-disc-drone" data-case="${c.id}">${t('forensics.btn_drone')}</button>`
                      : ''
                  }
                </div>
              `
                  : `
                <div class="evidence-row">
                  <button class="ev-btn ${rec.evidence.photo ? 'done' : ''}" data-case="${c.id}" data-ev="photo">
                    ${rec.evidence.photo ? '✅' : '📷'} ${t('forensics.ev_photo')}
                  </button>
                  <button class="ev-btn ${rec.evidence.telemetry ? 'done' : ''}" data-case="${c.id}" data-ev="telemetry">
                    ${rec.evidence.telemetry ? '✅' : '🔌'} ${t('forensics.ev_telemetry')}
                  </button>
                  <button class="ev-btn ${rec.evidence.env ? 'done' : ''}" data-case="${c.id}" data-ev="env">
                    ${rec.evidence.env ? '✅' : '🔬'} ${t('forensics.ev_env')}
                  </button>
                </div>

                <div class="telemetry-readout">
                  📊 Kara Kutu Verisi: <code>${
                    evCount > 0 ? JSON.stringify(c.telemetryData) : 'Kanıt toplayarak telemetriyi açın...'
                  }</code>
                </div>

                <div class="diag-row">
                  <select class="diag-select" id="diag-sel-${c.id}">
                    ${DIAGNOSIS_CATEGORIES.map(
                      (cat) => `
                      <option value="${cat.id}" ${(rec.diagnosis || c.correctCategory) === cat.id ? 'selected' : ''}>
                        ${t(cat.labelKey)}
                      </option>
                    `
                    ).join('')}
                  </select>
                  <button class="btn-primary btn-submit-diag" data-case="${c.id}">
                    ${rec.queued ? '✅ Kuyrukta (' + rec.score + 'p)' : t('forensics.btn_submit')}
                  </button>
                </div>

                ${
                  rec.diagnosis
                    ? `
                  <div class="finding-box">
                    <p><strong>📘 ${t(`case.${c.id}.finding`)}</strong></p>
                    <p class="lesson-text">💡 ${t(`case.${c.id}.lesson`)}</p>
                    ${
                      !rec.salvaged
                        ? `<button class="btn-sm btn-salvage" data-case="${c.id}">${t('forensics.btn_salvage')}</button>`
                        : `<span class="badge-ok">🔧 Parça Söküldü & Envantere Eklendi</span>`
                    }
                  </div>
                `
                    : ''
                }
              `
              }
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.btn-disc-eva').forEach((btn) => {
    btn.addEventListener('click', () => {
      discoverWreck(btn.getAttribute('data-case'), 'eva');
    });
  });

  viewport.querySelectorAll('.btn-disc-drone').forEach((btn) => {
    btn.addEventListener('click', () => {
      discoverWreck(btn.getAttribute('data-case'), 'drone');
    });
  });

  viewport.querySelectorAll('.ev-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const caseId = btn.getAttribute('data-case');
      const evType = btn.getAttribute('data-ev');
      const mgType = evType === 'telemetry' ? 'wires' : evType === 'env' ? 'align' : 'qte';
      const res = await runMinigame(mgType, {
        title: `${caseId.toUpperCase()} — ${evType.toUpperCase()} Kanıt Toplama`
      });
      collectForensicEvidence(caseId, evType, res.score);
    });
  });

  viewport.querySelectorAll('.btn-submit-diag').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caseId = btn.getAttribute('data-case');
      const sel = viewport.querySelector(`#diag-sel-${caseId}`);
      if (sel) {
        submitForensicDiagnosis(caseId, sel.value);
      }
    });
  });

  viewport.querySelectorAll('.btn-salvage').forEach((btn) => {
    btn.addEventListener('click', () => {
      salvageWreckPart(btn.getAttribute('data-case'));
    });
  });
}

/**
 * SEKME 3: Mars Bilim Laboratuvarı (6 Bilimsel Deney Döngüsü)
 */
function renderScienceLabTab(viewport) {
  const state = getState();

  viewport.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.85), rgba(11,16,33,0.94)), url('assets/screens/scr_lab_desk.png');">
      <div class="panel-header-row">
        <div>
          <h2>🧪 ${t('exp.title')}</h2>
          <p class="muted">${t('exp.subtitle')}</p>
        </div>
      </div>

      <div class="cases-grid">
        ${NASA_DATA.experiments
          .map((exp) => {
            const rec = state.experiments[exp.id];
            const hyps = EXPERIMENT_HYPOTHESES[exp.id] || [];
            const hasInst =
              !exp.requiredInstrument ||
              state.design.instruments.includes(exp.requiredInstrument);

            return `
            <div class="case-card ${rec.sent ? 'case-sent' : ''}">
              <h3>${t(`exp.${exp.id}.name`)}</h3>
              <p class="exp-question">❓ <strong>${t(`exp.${exp.id}.question`)}</strong></p>
              <div class="case-meta">
                Gerekli Alet: <b>${exp.requiredInstrument ? exp.requiredInstrument.toUpperCase() : 'Yok (Temel Fizik)'}</b>
                ${hasInst ? '✅' : '⚠️ (Eksik — Düşük Verim)'} | Enerji: <b>${exp.energyCostKwh} kWh</b> | Veri: <b>${exp.dataMbit} Mbit</b>
              </div>

              <div class="exp-form">
                <label>1. Hipotez Seçimi:</label>
                <select class="diag-select exp-hyp-sel" data-exp="${exp.id}">
                  ${hyps
                    .map(
                      (h) => `
                    <option value="${h.id}" ${rec.hypothesis === h.id ? 'selected' : ''}>
                      ${t(h.labelKey)}
                    </option>
                  `
                    )
                    .join('')}
                </select>

                <div class="exp-env-row">
                  <label>2. Ortam:</label>
                  <select class="diag-select exp-env-sel" data-exp="${exp.id}">
                    <option value="habitat" ${rec.environment === 'habitat' ? 'selected' : ''}>${t('exp.env_habitat')}</option>
                    <option value="surface" ${rec.environment === 'surface' ? 'selected' : ''}>${t('exp.env_surface')}</option>
                  </select>
                </div>

                <label class="ctrl-check">
                  <input type="checkbox" class="exp-ctrl-chk" data-exp="${exp.id}" ${rec.controlGroup ? 'checked' : ''} />
                  3. ${t('exp.control_group')}
                </label>

                <button class="btn-primary btn-run-exp" data-exp="${exp.id}" data-mg="${exp.minigameType}">
                  ${rec.completed ? `✅ Tamamlandı (${rec.score} Puan — Tekrar Ölç)` : t('exp.btn_run')}
                </button>
              </div>

              ${
                rec.completed
                  ? `
                <div class="finding-box">
                  <div>📏 <strong>Mars Ölçümü:</strong> ${exp.expectedMarsValue} ${exp.unit} vs <strong>Dünya Kontrolü:</strong> ${exp.expectedEarthValue} ${exp.unit}</div>
                  <p class="lesson-text">🔬 ${t(`exp.${exp.id}.result`)}</p>
                </div>
              `
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.exp-hyp-sel').forEach((sel) => {
    sel.addEventListener('change', () => {
      configureExperiment(sel.getAttribute('data-exp'), { hypothesis: sel.value });
    });
  });

  viewport.querySelectorAll('.exp-env-sel').forEach((sel) => {
    sel.addEventListener('change', () => {
      configureExperiment(sel.getAttribute('data-exp'), { environment: sel.value });
    });
  });

  viewport.querySelectorAll('.exp-ctrl-chk').forEach((chk) => {
    chk.addEventListener('change', () => {
      configureExperiment(chk.getAttribute('data-exp'), { controlGroup: chk.checked });
    });
  });

  viewport.querySelectorAll('.btn-run-exp').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const expId = btn.getAttribute('data-exp');
      const mgType = btn.getAttribute('data-mg') || 'qte';
      const res = await runMinigame(mgType, {
        title: t(`exp.${expId}.name`)
      });
      completeExperiment(expId, res.score);
    });
  });
}
