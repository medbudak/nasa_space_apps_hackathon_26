/**
 * SOL 14: RED HORIZON — İstasyon çizimleri (K3 Medine'nin prototipinden; D-014 önerisi)
 * Göktaşı izi + parlama + toz bulutu, taze krater, yerde ve kayaların üstünde saçılmış kargo, modül kuruldukça
 * büyüyen istasyon. Dünya katmanında, kazı noktalarından sonra çizilir (effects.js). Prosedürel piksel çizim.
 */
(function (S) {
  'use strict';
  const SF = { impactAt: 0 };
  const IMPACT_FALL_S = 1.2;
  const IMPACT_FLASH_S = 2.2;

  S.bus.on('station:impact', () => (SF.impactAt = 0));
  /** Kart açılınca göktaşı ekranda düşer (sarsıntı ve ses kartla aynı anda) */
  SF.playImpact = () => (SF.impactAt = performance.now());

  const night = (light) => (c) => S.DigFx.hexMix(c, '#141019', Math.min(0.65, light.dark * 0.65));

  function drawItem(ctx, item, x, y, light, now) {
    if (item === 'cable_spool') {
      ctx.fillStyle = '#3a3d42';
      ctx.fillRect(x - 5, y - 4, 10, 4);
      ctx.fillStyle = '#e8742e';
      ctx.fillRect(x - 4, y - 3, 8, 1);
      ctx.fillRect(x - 4, y - 1, 8, 1);
      ctx.fillStyle = '#c9a23a';
      ctx.fillRect(x + 5, y - 2, 3, 1);
    } else if (item === 'solar_kit') {
      ctx.fillStyle = '#22335c';
      ctx.fillRect(x - 8, y - 4, 16, 4);
      ctx.fillStyle = '#5b77b3';
      for (let i = 0; i < 4; i++) ctx.fillRect(x - 7 + i * 4, y - 3, 3, 1);
    } else {
      ctx.fillStyle = '#c9ccd2'; // kargo sandığı
      ctx.fillRect(x - 7, y - 5, 14, 5);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(x - 7, y - 5, 14, 1);
      ctx.fillStyle = '#8d939b';
      ctx.fillRect(x - 7, y - 1, 14, 1);
      ctx.fillRect(x - 2, y - 4, 4, 2);
    }
    // gündüz arada bir parıltı: oyuncu parçayı uzaktan görsün
    if (light.dark < 0.7) {
      const ph = (now / 1000 + x * 0.013) % 2;
      if (ph < 0.3) {
        ctx.save();
        ctx.globalAlpha = (1 - ph / 0.3) * 0.9;
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(x + 3, y - 11, 1, 7);
        ctx.fillRect(x, y - 8, 7, 1);
        ctx.restore();
      }
    }
  }

  function drawCrater(ctx, x, gy, N) {
    ctx.fillStyle = N('#2a1410');
    ctx.fillRect(x - 18, gy, 36, 3);
    ctx.fillRect(x - 12, gy + 3, 24, 2);
    ctx.fillStyle = N('#b06a48');
    ctx.fillRect(x - 24, gy - 2, 8, 2);
    ctx.fillRect(x + 16, gy - 2, 8, 2);
    ctx.fillStyle = N('#3a1d16');
    for (const [dx, sz] of [[-34, 3], [-29, 2], [30, 3], [37, 2], [44, 2]]) ctx.fillRect(x + dx, gy - sz + 1, sz + 1, sz);
  }

  /** İstasyon zemini; kurulan modüller üstüne eklenir (kabuk, regolit kalkanı, ısıtıcı, panel, anten) */
  function drawStation(ctx, built, x, gy, N, now) {
    ctx.fillStyle = N('#8a8f96');
    ctx.fillRect(x - 48, gy - 3, 96, 3);
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(x - 48, gy - 10, 2, 7);
    ctx.fillRect(x + 46, gy - 10, 2, 7);
    const shellH = (dx) => Math.round(30 * Math.sqrt(Math.max(0, 1 - (dx / 40) * (dx / 40))));
    if (built.shell) {
      for (let dx = -40; dx <= 40; dx += 2) {
        const hh = shellH(dx);
        ctx.fillStyle = N(dx % 12 === 0 ? '#9aa0a8' : '#d6d9de');
        ctx.fillRect(x + dx, gy - 3 - hh, dx % 12 === 0 ? 1 : 2, hh);
      }
      ctx.fillStyle = N('#2a3a52');
      ctx.fillRect(x - 4, gy - 15, 8, 12);
    } else {
      ctx.fillStyle = N('#9aa0a8'); // boş iskelet
      ctx.fillRect(x - 40, gy - 24, 2, 21);
      ctx.fillRect(x + 38, gy - 24, 2, 21);
      ctx.fillRect(x - 40, gy - 24, 80, 2);
    }
    if (built.shield) {
      for (let dx = -44; dx <= 44; dx += 2) {
        const hh = Math.round(34 * Math.sqrt(Math.max(0, 1 - (dx / 44) * (dx / 44))));
        const inner = Math.abs(dx) <= 40 ? shellH(dx) : 0;
        ctx.fillStyle = N('#a4603e'); // kabuğun üstüne yığılmış regolit (kapak açık kalır)
        ctx.fillRect(x + dx, gy - 3 - hh, 2, Math.max(2, hh - inner));
      }
    }
    if (built.heat) {
      ctx.fillStyle = N('#5a5f66');
      ctx.fillRect(x - 36, gy - 9, 9, 6);
      ctx.fillStyle = Math.floor(now / 600) % 2 ? '#ff9a3c' : '#c4682a';
      ctx.fillRect(x - 34, gy - 7, 2, 2);
    }
    if (built.power) {
      ctx.fillStyle = N('#6c727a');
      ctx.fillRect(x + 56, gy - 14, 2, 11);
      ctx.fillRect(x + 80, gy - 14, 2, 11);
      ctx.fillStyle = N('#22335c');
      ctx.fillRect(x + 50, gy - 20, 38, 6);
      ctx.fillStyle = N('#5b77b3');
      for (let i = 0; i < 9; i++) ctx.fillRect(x + 51 + i * 4, gy - 19, 3, 1);
    }
    if (built.comms) {
      ctx.fillStyle = N('#9aa0a8');
      ctx.fillRect(x + 24, gy - 52, 2, 22);
      ctx.fillStyle = N('#e3e0d8');
      ctx.fillRect(x + 18, gy - 58, 14, 3);
      ctx.fillRect(x + 21, gy - 60, 8, 2);
      if (Math.floor(now / 500) % 3 === 0) {
        ctx.fillStyle = '#3fe0e6';
        ctx.fillRect(x + 24, gy - 63, 2, 2);
      }
    }
  }

  /** Göktaşı: gökten çapraz iz, sonra parlama ve toz bulutu (kart açıldığında bir kez) */
  function drawFall(ctx, cx, gy, w, now) {
    const e = (now - SF.impactAt) / 1000;
    if (e < IMPACT_FALL_S) {
      const k = e / IMPACT_FALL_S;
      const x0 = cx + 560;
      const y0 = -30 - ((S.FX.view && S.FX.view.offY) || 0);
      ctx.save();
      for (let i = 0; i < 16; i++) {
        const kk = Math.max(0, k - i * 0.016);
        ctx.globalAlpha = (1 - i / 16) * 0.9;
        ctx.fillStyle = i < 3 ? '#fff6d8' : i < 8 ? '#ffb347' : '#a0522d';
        const sz = i < 8 ? 5 : 3;
        ctx.fillRect(Math.round(x0 + (cx - x0) * kk) - 2, Math.round(y0 + (gy - 8 - y0) * kk) - 2, sz, sz);
      }
      ctx.restore();
      return;
    }
    const k = (e - IMPACT_FALL_S) / IMPACT_FLASH_S;
    if (k >= 1) return;
    const v = S.FX.view || { w, h: 360, offY: 0 };
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.85 * (1 - k * 2));
    ctx.fillStyle = '#fff1d6';
    ctx.fillRect(0, -v.offY, v.w, v.h);
    ctx.globalAlpha = Math.max(0, 0.75 * (1 - k));
    ctx.fillStyle = '#b0643a';
    const r = 20 + k * 90;
    ctx.beginPath();
    ctx.ellipse(cx, gy - r * 0.4, r, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Yüzeyde (mekik ve tünel dışında) dünya katmanına çizer */
  SF.drawWorld = function (ctx, s, camX, w, gy, light) {
    if (!S.Station || s.player.inside || s.player.zone === 'cave') return;
    const cfg = S.DATA.station;
    const now = performance.now();
    const toScreen = (m) => Math.round(S.Surface.mToPx(m) - camX);
    const N = night(light);
    const craterX = toScreen(cfg.craterM);
    if (SF.impactAt) drawFall(ctx, craterX, gy, w, now);
    if (!S.Station.impacted(s)) return;
    if (craterX > -60 && craterX < w + 60) drawCrater(ctx, craterX, gy, N);
    for (const p of S.Station.pickupsLeft(s)) {
      const x = toScreen(p.m);
      if (x > -40 && x < w + 40) drawItem(ctx, p.item, x, gy - S.Station.liftPx(p), light, now);
    }
    const sx = toScreen(cfg.siteM);
    if (sx > -140 && sx < w + 140) drawStation(ctx, S.Station.state(s).built, sx, gy, N, now);
  };

  S.StationFx = SF;
})((window.SOL14 = window.SOL14 || {}));
