/**
 * SOL 14: RED HORIZON — M3: Güç Yük Önceliklendirme Paneli (Load Shedding) UI (K3)
 */

import { getState, t } from '../core/state.js';
import { movePowerPriority, applyPowerLoadShedding } from '../core/sim.js';

export function renderPowerPanel(container) {
  const state = getState();
  const status = applyPowerLoadShedding(state);

  container.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.85), rgba(11,16,33,0.94)), url('assets/screens/scr_habitat_cutaway.png');">
      <div class="panel-header-row">
        <div>
          <h2>⚡ ${t('power.title')}</h2>
          <p class="muted">${t('power.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>☀️ Kullanılabilir Güç: <strong>${status.availablePowerW} W</strong></div>
          <div>🔌 Aktif Tüketim: <strong>${status.usedW} W</strong></div>
          <div>🔋 Batarya Rezervi: <strong>${state.resources.energyKwh} / ${state.design.batteryKwh} kWh</strong></div>
          <div>☢️ Sökülen RHU Isıtıcı: <strong>${state.inventory.rhuUnits} Adet</strong></div>
        </div>
      </div>

      <div class="power-priority-list">
        ${state.powerPriorities
          .map(
            (item, idx) => `
          <div class="power-item ${item.active ? 'active' : 'shed'}">
            <div class="p-rank">#${idx + 1}</div>
            <div class="p-details">
              <strong>${t(item.labelKey)}</strong>
              <span class="p-watt">${item.powerW} W</span>
            </div>
            <div class="p-status">
              ${
                item.active
                  ? `<span class="badge-ok">⚡ AKTİF (BESLENİYOR)</span>`
                  : `<span class="badge-shed">⚠️ YÜK KESİLDİ (LOAD SHED)</span>`
              }
            </div>
            <div class="p-controls">
              <button class="btn-sm btn-prio-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲ Yukarı</button>
              <button class="btn-sm btn-prio-down" data-idx="${idx}" ${
                idx === state.powerPriorities.length - 1 ? 'disabled' : ''
              }>▼ Aşağı</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-prio-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      movePowerPriority(Number(btn.getAttribute('data-idx')), -1);
    });
  });

  container.querySelectorAll('.btn-prio-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      movePowerPriority(Number(btn.getAttribute('data-idx')), 1);
    });
  });
}
