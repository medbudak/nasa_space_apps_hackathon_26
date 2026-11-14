/**
 * SOL 14: RED HORIZON — M1: Veri Bütçesi ve Downlink Haberleşme Konsolu UI (K3)
 */

import { getState, t } from '../core/state.js';
import { getHorizonsForSol } from '../core/engineering.js';
import { transmitDownlinkPacket } from '../core/sim.js';

export function renderDownlinkPanel(container) {
  const state = getState();
  const horizons = getHorizonsForSol(state.sol);
  const remainingMbit = Math.max(
    0,
    state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol
  );
  const pctUsed = Math.min(
    100,
    Math.round((state.budgets.dataUsedThisSol / state.budgets.dataPerSolMax) * 100)
  );

  container.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.86), rgba(11,16,33,0.94)), url('assets/screens/scr_downlink.png');">
      <div class="panel-header-row">
        <div>
          <h2>📡 ${t('downlink.title')}</h2>
          <p class="muted">${t('downlink.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>🌍 Dünya–Mars Mesafe: <strong>${horizons.distanceMillionKm} Milyon km</strong></div>
          <div>⏱️ Tek Yön Işık Gecikmesi: <strong>${horizons.formatted}</strong> (JPL Horizons)</div>
          <div>📡 Mimari: <strong>${state.design.commArchitecture === 'relay_xband' ? 'MRO UHF + X-Band (80 Mbit/Sol)' : 'Sadece MRO UHF (45 Mbit/Sol)'}</strong></div>
        </div>
      </div>

      ${
        horizons.solarConjunction
          ? `<div class="alert-banner danger">${t('downlink.conjunction_alert')}</div>`
          : ''
      }

      <div class="bandwidth-meter">
        <div class="bw-label">
          <span>Sol ${state.sol} Kullanılan Veri Bant Genişliği: <strong>${state.budgets.dataUsedThisSol} / ${state.budgets.dataPerSolMax} Mbit</strong></span>
          <span>Kalan Kapasite: <strong>${remainingMbit} Mbit</strong></span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${pctUsed > 85 ? 'danger' : 'ok'}" style="width:${pctUsed}%"></div>
        </div>
      </div>

      <div class="queue-list">
        ${
          state.downlinkQueue.length === 0
            ? `<div class="empty-state">Henüz kuyrukta veri paketi yok. <strong>02 Keşif Koridoru</strong>'ndan adli inceleme yapın veya <strong>03 Bilim Laboratuvarı</strong>'nda deney çalıştırın.</div>`
            : state.downlinkQueue
                .map(
                  (pkt) => `
              <div class="queue-item ${pkt.sent ? 'sent' : ''}">
                <div class="q-info">
                  <span class="q-type-tag ${pkt.type}">${pkt.type.toUpperCase()}</span>
                  <strong>${pkt.title}</strong>
                  <span class="q-meta">${pkt.sizeMbit} Mbit | +${pkt.points} Bilim Puanı</span>
                </div>
                <div class="q-action">
                  ${
                    pkt.sent
                      ? `<span class="badge-sent">${t('downlink.sent_badge')} (${pkt.lightDelayText || horizons.formatted})</span>`
                      : `<button class="btn-primary btn-send-pkt" data-id="${pkt.id}" ${
                          pkt.sizeMbit > remainingMbit ? 'disabled' : ''
                        }>${t('downlink.btn_send')} (-${pkt.sizeMbit} Mbit)</button>`
                  }
                </div>
              </div>
            `
                )
                .join('')
        }
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-send-pkt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      transmitDownlinkPacket(id);
    });
  });
}
