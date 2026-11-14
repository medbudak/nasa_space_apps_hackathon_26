/**
 * SOL 14: RED HORIZON — M2: Kriz Karar Kartı ve M7: Gecikmeli Görev Kontrol UI (K3)
 */

import { getState, t } from '../core/state.js';
import { resolveCrisisOption, consultMissionControl } from '../core/events.js';

export function renderDecisionCardModal() {
  const modal = document.getElementById('crisis-modal');
  if (!modal) return;

  const state = getState();
  const crisis = state.activeCrisis;
  if (!crisis) {
    modal.classList.add('hidden');
    modal.innerHTML = '';
    return;
  }

  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="crisis-card">
      <div class="crisis-header">
        <span class="crisis-sol-tag">SOL ${state.sol} MÜHENDİSLİK KRİZ KARTI (M2)</span>
        <span class="crisis-delay-tag">📡 Tek Yön Işık Gecikmesi: ${crisis.lightDelayFormatted}</span>
      </div>

      <h3>${t(crisis.titleKey)}</h3>
      <p class="crisis-desc">${t(crisis.descKey)}</p>

      <div class="crisis-telemetry-strip">
        <span>🫧 O₂: <strong>${state.resources.o2}%</strong></span>
        <span>🔋 Batarya: <strong>${state.resources.energyKwh}/${state.design.batteryKwh} kWh</strong></span>
        <span>🌡️ Elbise Isısı: <strong>${state.resources.suitTempC}°C</strong></span>
        <span>🧠 Akıl Sağlığı: <strong>${state.resources.sanity}%</strong></span>
        <span>🔧 Tamir Kiti: <strong>${state.inventory.repairKits}</strong> | RHU: <strong>${state.inventory.rhuUnits}</strong></span>
      </div>

      <div class="crisis-options">
        ${crisis.options
          .map(
            (opt) => `
          <button class="crisis-opt-btn" data-opt="${opt.id}">
            <div class="opt-title">${t(opt.labelKey)}</div>
            <div class="opt-cost">Sayısal Etki: ${opt.costSummary}</div>
          </button>
        `
          )
          .join('')}
      </div>

      <div class="mission-control-box">
        ${
          crisis.missionControlConsulted
            ? `<div class="mc-advice"><strong>🌍 HOUSTON / GÖREV KONTROL YANITI (${crisis.roundTripMin} dk çift yönlü ışık gecikmesi sonrası ulaştı):</strong><br/>${t(
                crisis.adviceKey
              )}</div>`
            : `<button class="btn-secondary" id="btn-consult-mc">
                📡 Görev Kontrol'e Danış (M7: 2× Işık Gecikmesi = ${crisis.roundTripMin} dk bekleme, -3% O₂)
              </button>`
        }
      </div>
    </div>
  `;

  modal.querySelectorAll('.crisis-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-opt');
      resolveCrisisOption(optId);
    });
  });

  modal.querySelector('#btn-consult-mc')?.addEventListener('click', () => {
    consultMissionControl();
  });
}
