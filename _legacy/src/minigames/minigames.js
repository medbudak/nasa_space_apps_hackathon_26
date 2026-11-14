/**
 * SOL 14: RED HORIZON — 4 Yeniden Kullanılabilir Mini-Oyun Şablonu (K3)
 * Şablonlar: 1. wires (Kablo/Boru) · 2. align (Açı/Frekans) · 3. qte (Zamanlama/Sarkaç) · 4. converter (Dönüştürücü)
 * Sözleşme: export async function runMinigame(type, config) -> { success, score, timeUsed }
 */

import { bus } from '../core/state.js';

export function runMinigame(type = 'qte', config = {}) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const modal = document.getElementById('minigame-modal');
    if (!modal) {
      resolve({ success: true, score: 1.0, timeUsed: 1.0 });
      return;
    }

    const title = config.title || 'Mühendislik Kalibrasyonu';
    const subtitle = config.subtitle || 'Ölçümü tamamlamak için hedefi yakalayın (ESC: Hızlı Geç)';

    let cleanup = () => {};
    const finish = (success, score) => {
      cleanup();
      modal.classList.add('hidden');
      modal.innerHTML = '';
      const timeUsed = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;
      bus.emit('audio:play', success ? 'scan' : 'alarm');
      resolve({ success, score, timeUsed });
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        finish(true, 0.85);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    if (type === 'wires') {
      // Şablon 1: Kara Kutu Telemetri / Radyatör Kablo Eşleştirme
      const colors = [
        { code: 'PWR-28V', color: '#F85149', matched: false },
        { code: 'TLM-BUS', color: '#58A6FF', matched: false },
        { code: 'GND-ISO', color: '#3FB950', matched: false }
      ];
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>🔌 [ŞABLON 1: KABLO & TELEMETRİ HATTI] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Bağla (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle}</p>
          <div class="mg-wires-grid">
            ${colors
              .map(
                (c, i) => `
              <button class="wire-node" data-idx="${i}" style="border-color:${c.color}; color:${c.color}">
                🔌 ${c.code} Hattını Birleştir [Tıkla]
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
      modal.classList.remove('hidden');

      let connected = 0;
      modal.querySelectorAll('.wire-node').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          btn.disabled = true;
          btn.textContent = '✅ HAT BAĞLANDI';
          btn.style.background = 'rgba(63, 185, 80, 0.25)';
          bus.emit('audio:play', 'click');
          connected++;
          if (connected >= colors.length) {
            setTimeout(() => finish(true, 1.0), 220);
          }
        });
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else if (type === 'align') {
      // Şablon 2: Anten / Spektrometre / Ses Hızı Frekans Hizalama
      const target = 68;
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>📡 [ŞABLON 2: FREKANS & AÇI HİZALAMA] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Hizala (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle} — Hedef Frekans: <strong>${target} Hz</strong></p>
          <div class="mg-slider-wrap">
            <input type="range" id="mg-align-slider" min="0" max="100" value="25" class="mg-slider" />
            <div class="mg-readout">Güncel: <span id="mg-align-val">25</span> Hz (Hedef: ${target}±8 Hz)</div>
          </div>
          <button class="btn-primary" id="mg-align-lock">🎯 SİNYALİ KİLİTLE</button>
        </div>
      `;
      modal.classList.remove('hidden');
      const slider = modal.querySelector('#mg-align-slider');
      const valSpan = modal.querySelector('#mg-align-val');
      slider?.addEventListener('input', () => {
        valSpan.textContent = slider.value;
      });
      modal.querySelector('#mg-align-lock')?.addEventListener('click', () => {
        const diff = Math.abs(Number(slider.value) - target);
        const score = diff <= 10 ? 1.0 : diff <= 25 ? 0.85 : 0.75;
        finish(true, score);
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else if (type === 'converter') {
      // Şablon 4: Regolit Perklorat Yıkama / MOXIE Akış Dönüştürücü
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>⚗️ [ŞABLON 4: KAYNAK & REAKTÖR DÖNÜŞTÜRÜCÜ] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Hızlı Tamamla (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle}</p>
          <div class="mg-conv-steps">
            <button class="btn-secondary conv-step" data-step="1">1. Basınç ve Valfleri Dengele (0.63 kPa -> 101 kPa)</button>
            <button class="btn-secondary conv-step" data-step="2">2. Perklorat (ClO4⁻) Filtrele / Elektroliz Başlat</button>
            <button class="btn-primary conv-step" data-step="3">3. Numune Çıktısını Kaydet</button>
          </div>
        </div>
      `;
      modal.classList.remove('hidden');
      let doneSteps = 0;
      modal.querySelectorAll('.conv-step').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          btn.disabled = true;
          btn.textContent = `✅ ${btn.textContent}`;
          bus.emit('audio:play', 'click');
          doneSteps++;
          if (doneSteps >= 3) {
            setTimeout(() => finish(true, 1.0), 200);
          }
        });
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else {
      // Şablon 3: QTE / 0.38g Sarkaç & Serbest Düşüş Kronometre Zamanlama
      let pos = 10;
      let dir = 2.4;
      let anim = null;
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>⏱️ [ŞABLON 3: 0.38g KRONOMETRE & QTE ZAMANLAMA] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Ölç (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle} — Yeşil bölgede (40%–75%) durdurun!</p>
          <div class="qte-track">
            <div class="qte-zone"></div>
            <div class="qte-cursor" id="qte-cursor" style="left:10%"></div>
          </div>
          <button class="btn-primary" id="qte-hit">⏱️ KRONOMETREYİ DURDUR / YAKALA</button>
        </div>
      `;
      modal.classList.remove('hidden');
      const cursor = modal.querySelector('#qte-cursor');
      const step = () => {
        pos += dir;
        if (pos >= 94 || pos <= 4) dir = -dir;
        if (cursor) cursor.style.left = `${pos}%`;
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);

      modal.querySelector('#qte-hit')?.addEventListener('click', () => {
        const inZone = pos >= 38 && pos <= 78;
        finish(true, inZone ? 1.0 : 0.82);
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.92));
      cleanup = () => {
        if (anim) cancelAnimationFrame(anim);
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  });
}
