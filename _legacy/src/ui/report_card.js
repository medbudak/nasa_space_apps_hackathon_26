/**
 * SOL 14: RED HORIZON — UFO Stinger Final Sahnesi (~40 sn) ve M5: Neden-Sonuç Karnesi UI (K1, K3, K4)
 */

import { getState, updateState, resetState, t, bus } from '../core/state.js';
import { calcMissionScore, buildCauseEffectChains } from '../core/score.js';
import { getHorizonsForSol } from '../core/engineering.js';
import { renderUfoScanlineCanvas } from '../fx/effects.js';

/**
 * 1. UFO Stinger Sahnesi (Kalkış -> Ufuktaki Işık -> Satır Satır İnen Foto -> Güneş Kavuşumu Kesintisi)
 */
export function renderUfoStingerScreen(container) {
  const state = getState();
  const scoreData = calcMissionScore(state);
  const horizons = getHorizonsForSol(14);
  const isHighRes = scoreData.cameraTier === 'high';
  const maxPct = scoreData.ufoDownloadPct;

  container.innerHTML = `
    <div class="ufo-screen">
      <div class="ufo-stage-grid">
        <div class="ufo-visual-col">
          <div class="ufo-story-slides">
            <img src="assets/ending/ufo_liftoff.png" alt="MAV Liftoff" class="ufo-slide-img" />
            <img src="assets/ending/ufo_sky.png" alt="UFO Sky Anomaly" class="ufo-slide-img" />
          </div>
          <div class="ufo-scanline-box">
            <canvas id="ufo-scanline-canvas" width="640" height="340"></canvas>
            <div id="ufo-conjunction-banner" class="conjunction-overlay hidden">
              <div class="blink-three">✦ ✦ ✦</div>
              <h3>${t('ufo.stage4_cut')}</h3>
              <p>İndirme %${maxPct} seviyesinde kesildi (JPL Horizons Güneş Kavuşumu)</p>
            </div>
          </div>
        </div>

        <div class="ufo-telemetry-col">
          <span class="badge-ufo">SOL 14 — SON TELEMETRİ KAYDI</span>
          <h2>🛸 BİLİNMEYEN OPTİK ANOMALİ (STINGER)</h2>
          <p class="ufo-step-text">1️⃣ ${t('ufo.stage1')}</p>
          <p class="ufo-step-text">2️⃣ ${t('ufo.stage2')} <strong>(Işık Gecikmesi: ${horizons.formatted})</strong></p>
          <p class="ufo-step-text highlight">3️⃣ ${isHighRes ? t('ufo.stage3_high') : t('ufo.stage3_low')}</p>

          <div class="analyst-note-card">
            <p>${t('ufo.analyst_note')}</p>
          </div>

          <button class="btn-launch full-w" id="btn-go-report">
            ${t('ufo.btn_to_report')}
          </button>
        </div>
      </div>
    </div>
  `;

  bus.emit('audio:play', 'ufo_ping');

  const scanCanvas = container.querySelector('#ufo-scanline-canvas');
  const conjBanner = container.querySelector('#ufo-conjunction-banner');
  renderUfoScanlineCanvas(scanCanvas, {
    highRes: isHighRes,
    maxPct,
    onComplete: () => {
      conjBanner?.classList.remove('hidden');
      bus.emit('audio:play', 'alarm');
    }
  });

  container.querySelector('#btn-go-report')?.addEventListener('click', () => {
    updateState((s) => {
      s.phase = 'report';
    });
    bus.emit('audio:play', 'click');
  });
}

/**
 * 2. M5: Neden-Sonuç Karnesi (Cause-and-Effect Report Card) ve NASA Karşılaştırma Tablosu
 */
export function renderReportCardScreen(container) {
  const state = getState();
  const score = calcMissionScore(state);
  const chains = buildCauseEffectChains(state);

  container.innerHTML = `
    <div class="report-screen">
      <div class="report-header">
        <div>
          <span class="tier-badge ${score.tier}">${t(`report.tier_${score.tier}`)}</span>
          <h1>📊 ${t('report.title')}</h1>
          <p class="muted">${t('report.subtitle')}</p>
        </div>
        <div class="total-score-box">
          <span>GÖREV BAŞARI PUANI (GBP)</span>
          <strong>${score.total}</strong>
          <small>Adli: ${score.sentForensicsCount}/5 | Deney: ${score.sentExperimentsCount}/6 Gönderildi</small>
        </div>
      </div>

      <!-- Puan Kırılım Kartları -->
      <div class="score-breakdown-grid">
        <div class="sb-card">
          <span>🔍 Adli İnceleme (Downlink)</span>
          <strong>+${score.forensicsScore} Puan</strong>
          <small>${score.sentForensicsCount} Rapor Dünya'ya Ulaştı</small>
        </div>
        <div class="sb-card">
          <span>🧪 Bilimsel Deneyler (Downlink)</span>
          <strong>+${score.experimentsScore} Puan</strong>
          <small>${score.sentExperimentsCount} Deney Dünya'ya Ulaştı</small>
        </div>
        <div class="sb-card">
          <span>🛡️ Hayatta Kalma & Sağ Dönüş</span>
          <strong>+${score.survivalScore} Puan</strong>
          <small>Sol ${state.sol} / ${state.maxSols}</small>
        </div>
        <div class="sb-card">
          <span>⚖️ Kütle Marjı Bonusu (%${state.budgets.massMarginPct})</span>
          <strong>+${score.marginBonus} Puan</strong>
          <small>Sistem Kaybı Cezası: -${score.penalties}</small>
        </div>
      </div>

      <!-- Neden-Sonuç Zincirleri (Her seçim başarıyı nasıl şekillendirdi?) -->
      <section class="report-section">
        <h3>🔗 Karar Analizi: "Her Mühendislik Seçimi Görev Başarısını Nasıl Şekillendirdi?"</h3>
        <div class="chains-list">
          ${chains
            .map(
              (c) => `
            <div class="chain-row ${c.type}">
              <div class="chain-decision">🛠️ <strong>${c.decision}</strong></div>
              <div class="chain-arrow">➔</div>
              <div class="chain-outcome">${c.outcome}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Gerçek NASA Görevleriyle Kıyaslama Tablosu -->
      <section class="report-section">
        <h3>🚀 Gerçek NASA / ESA Mars Görevleriyle Mühendislik Karşılaştırması</h3>
        <table class="nasa-comp-table">
          <thead>
            <tr>
              <th>Parametre</th>
              <th>Sizin Tasarımınız (SOL 14)</th>
              <th>NASA Perseverance (2020)</th>
              <th>NASA Opportunity (2004–2018)</th>
              <th>NASA InSight (2018–2022)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>İniş Bölgesi</strong></td>
              <td>${state.design.landingSiteId.toUpperCase()}</td>
              <td>Jezero Krateri (18.4°K)</td>
              <td>Meridiani Planum (2°G)</td>
              <td>Elysium Planitia (4.5°K)</td>
            </tr>
            <tr>
              <td><strong>Güç Kaynağı</strong></td>
              <td>${state.design.powerSource === 'solar_rtg' ? 'Güneş Paneli + MMRTG (110W)' : 'Sadece Güneş Paneli'}</td>
              <td>MMRTG (110 W Nükleer)</td>
              <td>Güneş Paneli + 8× RHU</td>
              <td>Çift Yuvarlak Güneş Paneli</td>
            </tr>
            <tr>
              <td><strong>İletişim & Veri</strong></td>
              <td>${state.budgets.dataPerSolMax} Mbit/Sol (${state.design.commArchitecture})</td>
              <td>UHF Röle + X-Band Doğrudan</td>
              <td>UHF Röle + X-Band</td>
              <td>UHF Röle + X-Band</td>
            </tr>
            <tr>
              <td><strong>Kritik Ders / Sonuç</strong></td>
              <td><strong>${t(`report.tier_${score.tier}`)} (${score.total} GBP)</strong></td>
              <td>MOXIE, MEDA, RIMFAX ve Ingenuity ile aktif</td>
              <td>Sol 5111 küresel toz fırtınasında (τ=10.8) güç kaybı</td>
              <td>Sol 1440 panel tozlanmasıyla (%92) güç tükenmesi</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="report-footer">
        <button class="btn-launch" id="btn-replay-sol0">${t('report.btn_replay')}</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-replay-sol0')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: false });
    bus.emit('audio:play', 'click');
  });
}
