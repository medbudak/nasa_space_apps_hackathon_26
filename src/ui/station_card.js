/**
 * SOL 14: RED HORIZON — Göktaşı kartı (K3 Medine'nin prototipinden; D-014 önerisi)
 * Alarm şeridi, durum tablosu (MAV sağlam, kargo saçıldı), yeni iş üç adımda: topla → kaz → atölyede kur.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const SC = {};

  /**
   * Göktaşı sahnesi: oyuncu nerede olursa olsun (mekikte de) kısa, atlanabilir bir sinematik oynar,
   * sonra kart açılır. 640×360 tuval, prosedürel piksel çizim (kurgusal olay, D-014).
   * Akış: gökte bir parıltı → ateşli kuyrukla iniş → flaş + şok dalgası + toz bulutu, savrulan sandıklar → kart.
   */
  const SCENE_S = 4.6;
  const HIT_S = 2.3;
  SC.showImpact = function (s) {
    S.bus.emit('audio:play', 'alarm');
    if (S.StationFx && !s.player.inside) S.StationFx.playImpact();
    SC.playScene(s, () => SC.openCard(s));
  };

  SC.playScene = function (s, onDone) {
    const W = 640;
    const H = 360;
    const pal = S.Art && S.Art.palette ? S.Art.palette(s.design.landingSiteId, s.minute) : null;
    const sky0 = (pal && pal.skyTop) || '#c08a6a';
    const sky1 = (pal && pal.skyLow) || '#e0b48c';
    const ground = (pal && pal.ground) || '#9a4a2a';
    const groundD = (pal && pal.groundDark) || '#6e3220';
    const box = S.UI.openModal(
      'impact-scene',
      '<div class="imp-scene"><canvas width="' + W + '" height="' + H + '"></canvas>' +
        '<button type="button" class="btn btn-ghost btn-sm imp-skip">' + t('transit.skip') + ' <kbd>Esc</kbd></button></div>',
      { closable: false, cls: 'modal-scene' }
    );
    const cv = box.querySelector('canvas');
    const c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    const t0 = performance.now();
    let done = false;
    let boomed = false;
    const rnd = (k) => {
      const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', onKey, true);
      S.UI.closeModal('impact-scene', true);
      onDone();
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    };
    window.addEventListener('keydown', onKey, true);
    box.querySelector('.imp-skip').addEventListener('click', finish);
    const GY = 290;
    // iniş aracının görüntüsü bir kez çizilir (ayaklar açık, merdiven yerde)
    let shipImg = null;
    if (S.Lander && S.Lander.drawShip && S.Lander.SHIP) {
      shipImg = document.createElement('canvas');
      shipImg.width = S.Lander.SHIP.W;
      shipImg.height = S.Lander.SHIP.H;
      S.Lander.drawShip(shipImg.getContext('2d'), { deploy: 1, compress: 0, lights: 1, hatch: 0, dark: 0, time: 0, damage: 0, heat: 0, sink: 0, ladder: 'full' });
    }
    const hitX = 250; // çarpma noktası: mekiğin solunda
    const landerX = 500;
    const crates = [...Array(7).keys()].map((i) => ({ vx: (rnd(i) - 0.35) * 260, vy: -120 - rnd(i * 3) * 160, sz: 6 + Math.round(rnd(i * 7) * 6), col: i % 3 ? '#c9a23a' : '#7d858f' }));
    const R = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    };
    const frame = (now) => {
      if (done) return;
      const e = (now - t0) / 1000;
      const shake = e > HIT_S && e < HIT_S + 0.8 ? (1 - (e - HIT_S) / 0.8) * 6 : e > 1.2 && e < HIT_S ? 1 : 0;
      c.save();
      c.translate(Math.round((rnd(e * 50) - 0.5) * shake * 2), Math.round((rnd(e * 70) - 0.5) * shake * 2));
      // gökyüzü (iniş alanının rengi) + yıldız tozları
      const g = c.createLinearGradient(0, 0, 0, GY);
      g.addColorStop(0, sky0);
      g.addColorStop(1, sky1);
      c.fillStyle = g;
      c.fillRect(-10, -10, W + 20, GY + 10);
      // uzak tepeler
      for (let x = -10; x < W + 10; x += 4) {
        const h1 = 30 + Math.sin(x * 0.012) * 14 + Math.sin(x * 0.031) * 6;
        R(x, GY - h1, 4, h1, (pal && pal.far) || '#8a4a34');
      }
      for (let x = -10; x < W + 10; x += 4) {
        const h2 = 14 + Math.sin(x * 0.02 + 2) * 8;
        R(x, GY - h2, 4, h2, (pal && pal.mid) || '#7a3e2a');
      }
      R(-10, GY, W + 20, H - GY + 10, ground);
      for (let i = 0; i < 60; i++) R(rnd(i) * W, GY + 4 + rnd(i * 3) * (H - GY - 8), 3, 2, groundD);
      // iniş aracı (oyundaki çizimin aynısı, S.Lander.drawShip), sağda
      if (shipImg) {
        const LS = S.Lander.SHIP;
        const sc = 0.62;
        c.drawImage(shipImg, Math.round(landerX - LS.CX * sc), Math.round(GY + 2 - LS.FEET * sc), Math.round(LS.W * sc), Math.round(LS.H * sc));
      }
      if (e < HIT_S) {
        // gökte parıltı, sonra ateşli iniş
        const k = Math.max(0, (e - 0.4) / (HIT_S - 0.4));
        const sx = 610;
        const sy = 30;
        const x = sx + (hitX - sx) * k * k;
        const y = sy + (GY - 10 - sy) * k * k;
        if (e < 0.4) {
          c.globalAlpha = Math.sin(e * 30) * 0.5 + 0.5;
          R(sx - 1, sy - 1, 3, 3, '#fff6d8');
          c.globalAlpha = 1;
        } else {
          for (let i = 0; i < 28; i++) {
            const kk = Math.max(0, k - i * 0.012);
            const tx = sx + (hitX - sx) * kk * kk;
            const ty = sy + (GY - 10 - sy) * kk * kk;
            c.globalAlpha = (1 - i / 28) * 0.9;
            const sz = Math.max(2, 9 - i * 0.28);
            R(tx - sz / 2, ty - sz / 2, sz, sz, i < 4 ? '#fff6d8' : i < 12 ? '#ffb347' : i < 20 ? '#e0682a' : '#6e3a24');
          }
          c.globalAlpha = 0.35;
          c.fillStyle = '#ffd27a';
          c.beginPath();
          c.arc(x, y, 10 + k * 14, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
          R(x - 4, y - 4, 8, 8, '#fff6d8');
        }
      } else {
        if (!boomed) {
          boomed = true;
          S.bus.emit('audio:play', 'quake');
        }
        const k = e - HIT_S;
        // taze krater
        R(hitX - 34, GY - 2, 68, 6, '#3a1a12');
        R(hitX - 24, GY - 4, 48, 3, '#5a2a1c');
        c.globalAlpha = Math.max(0, 1 - k * 0.5);
        R(hitX - 10, GY - 2, 20, 3, '#ff8a3a');
        c.globalAlpha = 1;
        // şok dalgası halkası
        c.globalAlpha = Math.max(0, 0.7 - k * 0.5);
        c.strokeStyle = '#ffe2b8';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(hitX, GY - 4, 20 + k * 260, 6 + k * 40, 0, Math.PI, Math.PI * 2);
        c.stroke();
        c.globalAlpha = 1;
        // toz bulutu
        for (let i = 0; i < 26; i++) {
          const a = rnd(i) * Math.PI;
          const d = (20 + rnd(i * 2) * 90) * Math.min(1, k * 1.6);
          const r = 8 + rnd(i * 5) * 16 + k * 10;
          c.globalAlpha = Math.max(0, 0.75 - k * 0.3);
          c.fillStyle = i % 2 ? '#b0643a' : '#8a4a30';
          c.beginPath();
          c.arc(hitX + Math.cos(a) * d * (rnd(i * 9) < 0.5 ? -1 : 1), GY - 10 - Math.sin(a) * d * 0.6, r, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        // havaya savrulan kargo sandıkları
        for (const cr of crates) {
          const x = hitX + cr.vx * k;
          const y = Math.min(GY - cr.sz, GY - 10 + cr.vy * k + 190 * k * k);
          R(x - cr.sz / 2 - 1, y - 1, cr.sz + 2, cr.sz + 2, '#0b0d10');
          R(x - cr.sz / 2, y, cr.sz, cr.sz, cr.col);
          R(x - cr.sz / 2, y, cr.sz, 2, '#f2e0a8');
        }
        // beyaz flaş
        if (k < 0.5) {
          c.globalAlpha = 0.9 * (1 - k / 0.5);
          R(-10, -10, W + 20, H + 20, '#fff6e0');
          c.globalAlpha = 1;
        }
      }
      c.restore();
      if (e >= SCENE_S) finish();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  SC.openCard = function (s) {
    const row = (k, cls) => '<div class="imp-row"><span>' + t('station.imp.' + k) + '</span><b class="' + cls + '">' + t('station.imp.' + k + '_v') + '</b></div>';
    const step = (n) => '<div class="imp-step"><b><i>0' + n + '</i>' + t('station.imp.s' + n + '_t') + '</b>' + t('station.imp.s' + n) + '</div>';
    const html =
      '<div class="imp-card" role="alertdialog">' +
      '<div class="imp-head"><span class="imp-led"></span><div><small>' + t('station.imp.alarm', { sol: s.sol }) + '</small><h2>' + t('station.imp.title') + '</h2></div></div>' +
      '<div class="imp-rows">' + row('mav', 'warn') + row('lander', 'ok') + row('cargo', 'warn') + '</div>' +
      '<p class="imp-text">' + t('station.imp.text') + '</p>' +
      '<div class="imp-mission">▶ ' + t('station.imp.mission') + '</div>' +
      '<div class="imp-steps">' + step(1) + step(2) + step(3) + '</div>' +
      '<div class="imp-foot"><small>' + t('station.imp.fiction') + '</small><button class="btn btn-primary" data-close>' + t('station.imp.go') + '</button></div></div>';
    S.UI.openModal('station-impact', html, { cls: 'modal-wide', onClose: () => S.Game.afterAction() });
    S.bus.emit('audio:play', 'alarm');
  };

  S.StationCard = SC;
})((window.SOL14 = window.SOL14 || {}));
