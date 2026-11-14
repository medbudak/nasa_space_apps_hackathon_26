/**
 * SOL 14: RED HORIZON — Prosedürel 16-bit Pixel Art (K4)
 * Gökyüzü (pas rengi gündüz, MAVİ gün batımı — RULES §1.6), parallax sırtlar, zemin, habitat modülü,
 * habitat iç kesiti (mockup 05). Tüm çizimler 640x360 iç çözünürlükte, tam piksel koordinatlarında.
 */
(function (S) {
  'use strict';
  const Art = {};

  /* ---------------- Renk yardımcıları ---------------- */
  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, k) {
    const A = hex(a);
    const B = hex(b);
    const r = A.map((v, i) => Math.round(v + (B[i] - v) * k));
    return '#' + r.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  Art.mix = mix;

  const PALETTES = {
    rust: { skyTop: '#a8644a', skyLow: '#e0a678', far: '#a85a42', mid: '#8a3f2b', near: '#6b2e20', ground: '#a24a2c', groundDark: '#7c3520', groundLight: '#c26a42', rock: '#5a261a' },
    amber: { skyTop: '#b47a52', skyLow: '#ebb886', far: '#b56a46', mid: '#9a5232', near: '#7a3d24', ground: '#b9653a', groundDark: '#8e4828', groundLight: '#d78a58', rock: '#663020' },
    frost: { skyTop: '#9a6a5c', skyLow: '#d3a98f', far: '#9c6458', mid: '#7f4a40', near: '#653a32', ground: '#8f5444', groundDark: '#6e3e33', groundLight: '#d8cfd2', rock: '#4f2c26' }
  };
  const NIGHT = { skyTop: '#05070f', skyLow: '#1a1830', far: '#2a1c22', mid: '#21161a', near: '#191013', ground: '#3a2019', groundDark: '#2a1611', groundLight: '#4c2a20', rock: '#1d0f0b' };

  /** Saat (dakika) -> karanlık katsayısı 0 (gündüz) .. 1 (gece) ve gün batımı katsayısı */
  Art.lighting = function (minute) {
    const g = S.DATA.gameplay;
    const m = ((minute % 1480) + 1480) % 1480;
    const rise = g.sunriseMinute;
    const sunset = g.sunsetStartMinute;
    const night = g.nightStartMinute;
    let dark = 0;
    let dusk = 0;
    if (m >= night + 40 || m < rise - 40) dark = 1;
    else if (m >= sunset && m < night + 40) {
      const f = (m - sunset) / (night + 40 - sunset);
      dark = Math.min(1, f * f);
      dusk = Math.sin(Math.PI * Math.min(1, f * 1.2));
    } else if (m >= rise - 40 && m < rise + 40) {
      const f = (m - (rise - 40)) / 80;
      dark = 1 - f;
      dusk = Math.sin(Math.PI * f) * 0.7;
    }
    return { dark, dusk };
  };

  Art.palette = function (siteId, minute) {
    const site = S.DATA.landingSites.find((x) => x.id === siteId) || S.DATA.landingSites[1];
    const base = PALETTES[site.palette] || PALETTES.rust;
    const { dark } = Art.lighting(minute);
    const p = {};
    for (const k of Object.keys(base)) p[k] = mix(base[k], NIGHT[k], dark * 0.85);
    return p;
  };

  /* ---------------- Gökyüzü ---------------- */
  const stars = [];
  {
    const rnd = S.makeRng(77);
    for (let i = 0; i < 90; i++) stars.push({ x: rnd() * 640, y: rnd() * 220, b: rnd(), s: rnd() < 0.15 ? 2 : 1 });
  }

  Art.drawSky = function (ctx, siteId, minute, w, h, opts = {}) {
    const pal = Art.palette(siteId, minute);
    const { dark, dusk } = Art.lighting(minute);
    const bands = 24;
    const bandH = Math.ceil(h / bands);
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = mix(pal.skyTop, pal.skyLow, i / (bands - 1));
      ctx.fillRect(0, i * bandH, w, bandH + 1);
    }
    // Güneş konumu
    const g = S.DATA.gameplay;
    const m = ((minute % 1480) + 1480) % 1480;
    const span = g.nightStartMinute - 20 - (g.sunriseMinute - 20);
    const f = (m - (g.sunriseMinute - 20)) / span;
    const horizonY = opts.horizonY || 250;
    if (f > 0 && f < 1) {
      const sx = 40 + f * (w - 80);
      const sy = horizonY - Math.sin(Math.PI * f) * (horizonY - 40);
      // Mavi gün batımı halesi (toz saçılımı ileri yönde mavi ışık)
      if (dusk > 0.05) {
        for (let r = 70; r > 0; r -= 10) {
          ctx.globalAlpha = dusk * 0.12;
          ctx.fillStyle = '#6fa8dc';
          ctx.beginPath();
          ctx.ellipse(sx, sy, r * 1.4, r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = dusk > 0.3 ? '#d6ecff' : '#fff1d0';
      ctx.fillRect(Math.round(sx) - 4, Math.round(sy) - 6, 8, 12);
      ctx.fillRect(Math.round(sx) - 6, Math.round(sy) - 4, 12, 8);
      ctx.fillRect(Math.round(sx) - 5, Math.round(sy) - 5, 10, 10);
    }
    // Yıldızlar ve Phobos
    if (dark > 0.3) {
      const t = performance.now() / 1000;
      for (const st of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 1.3 + st.b * 20);
        ctx.globalAlpha = (dark - 0.3) * (0.4 + 0.6 * tw * st.b);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(st.x), Math.round(st.y), st.s, st.s);
      }
      ctx.globalAlpha = dark;
      const px = ((m * 0.9) % 760) - 60;
      ctx.fillStyle = '#9a8f88';
      ctx.fillRect(Math.round(px), 52, 7, 4);
      ctx.fillRect(Math.round(px) + 1, 51, 5, 6);
      ctx.fillStyle = '#6b625d';
      ctx.fillRect(Math.round(px) + 4, 54, 2, 2);
      ctx.globalAlpha = 1;
    }
  };

  /* ---------------- Parallax sırtlar ---------------- */
  function ridge(x, seed, amp, scale) {
    return (
      amp * 0.55 * Math.sin(x * scale + seed) +
      amp * 0.3 * Math.sin(x * scale * 2.3 + seed * 1.7) +
      amp * 0.15 * Math.sin(x * scale * 5.1 + seed * 0.3) +
      amp
    );
  }
  const LAYERS = [
    { key: 'far', par: 0.08, base: 250, amp: 34, scale: 0.008, seed: 1.3, mesa: true },
    { key: 'mid', par: 0.22, base: 268, amp: 22, scale: 0.014, seed: 4.1, mesa: false },
    { key: 'near', par: 0.5, base: 290, amp: 14, scale: 0.03, seed: 7.7, mesa: false }
  ];

  Art.drawRidges = function (ctx, siteId, minute, camX, w) {
    const pal = Art.palette(siteId, minute);
    for (const L of LAYERS) {
      const color = pal[L.key];
      const hi = mix(color, '#ffd9b0', 0.12);
      ctx.fillStyle = color;
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        let hgt = ridge(wx, L.seed, L.amp, L.scale);
        if (L.mesa) hgt = Math.min(hgt, L.amp * 1.25) + (hgt > L.amp * 1.2 ? 6 : 0);
        hgt = Math.round(hgt / 2) * 2;
        const top = L.base - hgt;
        ctx.fillRect(x, top, 2, 300 - top + 70);
      }
      ctx.fillStyle = hi;
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        let hgt = ridge(wx, L.seed, L.amp, L.scale);
        if (L.mesa) hgt = Math.min(hgt, L.amp * 1.25) + (hgt > L.amp * 1.2 ? 6 : 0);
        hgt = Math.round(hgt / 2) * 2;
        ctx.fillRect(x, L.base - hgt, 2, 2);
      }
    }
  };

  /* ---------------- Zemin ---------------- */
  function hash(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }

  Art.drawGround = function (ctx, siteId, minute, camX, w, h, groundY, opts = {}) {
    const pal = Art.palette(siteId, minute);
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = pal.groundLight;
    ctx.fillRect(0, groundY, w, 2);
    ctx.fillStyle = pal.groundDark;
    ctx.fillRect(0, groundY + 2, w, 1);
    // Zemin dokusu: dünya koordinatına bağlı taşlar (kaydırırken sabit kalır)
    const startTile = Math.floor(camX / 8) - 1;
    for (let tIdx = startTile; tIdx < startTile + w / 8 + 2; tIdx++) {
      const r = hash(tIdx);
      const sx = Math.round(tIdx * 8 - camX);
      if (r < 0.35) {
        ctx.fillStyle = pal.groundDark;
        ctx.fillRect(sx, groundY + 8 + Math.floor(hash(tIdx + 3) * 48), 2 + Math.floor(r * 6), 1);
      }
      if (r > 0.86) {
        const ry = groundY + 4 + Math.floor(hash(tIdx + 9) * 40);
        ctx.fillStyle = pal.rock;
        ctx.fillRect(sx, ry, 5, 3);
        ctx.fillStyle = pal.groundLight;
        ctx.fillRect(sx + 1, ry, 2, 1);
      }
      if (siteId === 'arcadia' && r > 0.6 && r < 0.68) {
        ctx.fillStyle = '#e6e2ea';
        ctx.fillRect(sx, groundY + 3 + Math.floor(hash(tIdx + 5) * 20), 6, 1);
      }
    }
    // Kum çukurları (Spirit dersi)
    if (opts.sandPits) {
      for (const pit of opts.sandPits) {
        const x0 = Math.round(pit.x0 - camX);
        const x1 = Math.round(pit.x1 - camX);
        if (x1 < 0 || x0 > w) continue;
        ctx.fillStyle = mix(pal.ground, '#e8b77d', 0.35);
        ctx.fillRect(x0, groundY - 1, x1 - x0, 10);
        ctx.fillStyle = mix(pal.ground, '#ffffff', 0.15);
        for (let x = x0; x < x1; x += 6) ctx.fillRect(x, groundY + 2 + ((x >> 2) % 3), 4, 1);
        if (opts.revealSand) {
          ctx.fillStyle = '#ffcc33';
          ctx.fillRect(x0, groundY - 14, 1, 13);
          ctx.fillRect(x0 + 1, groundY - 14, 5, 3);
        }
      }
    }
    // 100 m mesafe işaretleri
    if (opts.markers) {
      ctx.font = '7px monospace';
      ctx.textBaseline = 'top';
      for (const mk of opts.markers) {
        const x = Math.round(mk.px - camX);
        if (x < -20 || x > w + 20) continue;
        ctx.fillStyle = '#2b1a14';
        ctx.fillRect(x, groundY - 10, 1, 10);
        ctx.fillStyle = mk.color || '#e8e2d8';
        ctx.fillRect(x + 1, groundY - 10, 4, 3);
        ctx.fillStyle = 'rgba(255,240,220,0.75)';
        ctx.fillText(mk.label, x + 3, groundY + 6);
      }
    }
  };

  /* ---------------- Habitat modülü (dış) ---------------- */
  Art.drawHabitat = function (ctx, x, groundY, minute, state) {
    const { dark } = Art.lighting(minute);
    const W = 160;
    const H = 74;
    const top = groundY - H - 6;
    const shell = mix('#d9d2c8', '#4a4744', dark * 0.7);
    const shade = mix('#a39a90', '#2c2a28', dark * 0.7);
    const stripe = mix('#e2672c', '#6e3016', dark * 0.6);
    // Ayaklar
    ctx.fillStyle = shade;
    for (const lx of [14, 60, 104, 146]) ctx.fillRect(x + lx, groundY - 8, 4, 8);
    // Gövde (yuvarlatılmış silindir)
    ctx.fillStyle = shade;
    ctx.fillRect(x + 4, top + 2, W - 8, H);
    ctx.fillRect(x, top + 8, W, H - 12);
    ctx.fillStyle = shell;
    ctx.fillRect(x + 6, top, W - 12, H - 4);
    ctx.fillRect(x + 2, top + 6, W - 4, H - 14);
    // Panel çizgileri
    ctx.fillStyle = shade;
    for (let px = 30; px < W - 10; px += 32) ctx.fillRect(x + px, top + 2, 1, H - 8);
    ctx.fillRect(x + 4, top + H - 20, W - 8, 1);
    // Turuncu şerit
    ctx.fillStyle = stripe;
    ctx.fillRect(x + 4, top + H - 16, W - 8, 3);
    // Pencereler (gece sıcak ışık)
    const lightOn = state && !(state.loads.find((l) => l.id === 'life_support') || {}).shed;
    const win = lightOn ? mix('#3a5874', '#ffcf7a', 0.25 + dark * 0.7) : '#1b2430';
    for (const wx of [18, 52, 86]) {
      ctx.fillStyle = shade;
      ctx.fillRect(x + wx - 1, top + 15, 22, 16);
      ctx.fillStyle = win;
      ctx.fillRect(x + wx, top + 16, 20, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + wx + 2, top + 18, 6, 2);
      if (dark > 0.4 && lightOn) {
        ctx.globalAlpha = 0.18 * dark;
        ctx.fillStyle = '#ffcf7a';
        ctx.fillRect(x + wx - 4, groundY - 2, 28, 6);
        ctx.globalAlpha = 1;
      }
    }
    // H-01 etiketi
    ctx.fillStyle = mix('#5b5650', '#202020', dark * 0.5);
    ctx.font = 'bold 8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('H-01', x + 118, top + 18);
    // Hava kilidi kapısı (sağ uç)
    ctx.fillStyle = shade;
    ctx.fillRect(x + W - 22, top + 18, 18, H - 24);
    ctx.fillStyle = mix('#8c8279', '#2c2a28', dark * 0.6);
    ctx.fillRect(x + W - 20, top + 20, 14, H - 28);
    ctx.fillStyle = stripe;
    ctx.fillRect(x + W - 20, top + 20, 14, 2);
    ctx.fillStyle = lightOn ? '#3fe08a' : '#e8423b';
    ctx.fillRect(x + W - 14, top + 26, 2, 2);
    // Çatı anteni + çanak
    ctx.fillStyle = shade;
    ctx.fillRect(x + 40, top - 26, 2, 26);
    ctx.fillRect(x + 36, top - 4, 10, 4);
    ctx.fillStyle = shell;
    ctx.fillRect(x + 30, top - 30, 12, 3);
    ctx.fillRect(x + 32, top - 33, 8, 3);
    ctx.fillStyle = (Math.floor(performance.now() / 600) % 2 === 0) ? '#ff4b3a' : '#5a1b14';
    ctx.fillRect(x + 40, top - 28, 2, 2);
    // Kablolar
    ctx.fillStyle = mix('#2a2a2a', '#000000', dark * 0.5);
    ctx.fillRect(x - 12, groundY - 3, 14, 1);
  };

  /* ---------------- Habitat iç kesiti (mockup 05) ---------------- */
  function r(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  }

  Art.drawInterior = function (ctx, state, highlightId, t) {
    const I = S.Surface.INTERIOR;
    const minute = state.minute;
    const { dark } = Art.lighting(minute);
    const lifeShed = (state.loads.find((l) => l.id === 'life_support') || {}).shed;
    const cold = state.res.habTempC < S.DATA.gameplay.habitatComfortMinC;
    const site = state.design.landingSiteId;

    // Dış manzara (kesitin arkası)
    Art.drawSky(ctx, site, minute, 640, 240, { horizonY: 170 });
    ctx.save();
    ctx.translate(0, -70);
    Art.drawRidges(ctx, site, minute, 200, 640);
    ctx.restore();
    Art.drawGround(ctx, site, minute, 0, 640, 240, 200, {});

    // Gövde kabuğu
    const x0 = 44;
    const x1 = 600;
    const y0 = 26;
    const y1 = 200;
    const hull = '#4b4039';
    const hullHi = '#6d5d50';
    r(ctx, x0 + 10, y0, x1 - x0 - 20, 8, hull);
    r(ctx, x0, y0 + 8, x1 - x0, y1 - y0 - 8, hull);
    r(ctx, x0 + 10, y0 + 2, x1 - x0 - 20, 2, hullHi);
    // İç duvar
    const wall = cold ? '#2f3540' : '#3b2f29';
    r(ctx, x0 + 6, y0 + 8, x1 - x0 - 12, y1 - y0 - 18, wall);
    ctx.fillStyle = cold ? '#363e4b' : '#43352e';
    for (let x = x0 + 30; x < x1 - 10; x += 36) ctx.fillRect(x, y0 + 10, 1, y1 - y0 - 24);
    r(ctx, x0 + 6, y0 + 44, x1 - x0 - 12, 1, cold ? '#3c4553' : '#4b3b33');
    // Borular
    r(ctx, x0 + 6, y0 + 12, x1 - x0 - 12, 3, '#5d5047');
    r(ctx, x0 + 6, y0 + 13, x1 - x0 - 12, 1, '#7a6a5d');
    // Tavan lambaları
    for (let lx = 100; lx < 580; lx += 120) {
      r(ctx, lx, y0 + 16, 34, 4, '#2a221e');
      r(ctx, lx + 2, y0 + 19, 30, 2, lifeShed ? '#7a1c16' : '#ffd27a');
      if (!lifeShed) {
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#ffd27a';
        ctx.beginPath();
        ctx.moveTo(lx + 2, y0 + 21);
        ctx.lineTo(lx + 32, y0 + 21);
        ctx.lineTo(lx + 60, y1 - 10);
        ctx.lineTo(lx - 26, y1 - 10);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    // Zemin ızgarası
    r(ctx, x0 + 6, I.floorY, x1 - x0 - 12, 8, '#2a2320');
    ctx.fillStyle = '#463a33';
    for (let x = x0 + 8; x < x1 - 8; x += 6) ctx.fillRect(x, I.floorY + 2, 4, 1);
    // Halı
    r(ctx, 250, I.floorY - 1, 120, 2, '#8a2f24');

    // 1) Ranzalar
    r(ctx, 82, 70, 64, 4, '#6b5c50');
    r(ctx, 82, 120, 64, 4, '#6b5c50');
    r(ctx, 82, 168, 64, 4, '#6b5c50');
    r(ctx, 84, 62, 60, 8, '#b6402e');
    r(ctx, 84, 112, 60, 8, '#b6402e');
    r(ctx, 86, 58, 14, 6, '#e9e3da');
    r(ctx, 86, 108, 14, 6, '#e9e3da');
    r(ctx, 80, 56, 2, 130, '#7b6a5c');
    r(ctx, 146, 56, 2, 130, '#7b6a5c');
    r(ctx, 92, 172, 20, 12, '#5a4a3e');

    // 2) Elbise dolabı (asılı EVA elbisesi)
    r(ctx, 176, 50, 42, 136, '#2b2420');
    r(ctx, 178, 52, 38, 132, '#4a3d35');
    const suitImg = S.Sprites.get('astronaut_idle');
    if (suitImg) ctx.drawImage(suitImg, 182, 82, 30, 51);
    r(ctx, 176, 50, 42, 3, '#8a2f24');

    // 3) Şarj / batarya kabini
    r(ctx, 238, 104, 46, 82, '#5a534d');
    r(ctx, 240, 106, 42, 78, '#3c3733');
    r(ctx, 250, 118, 22, 22, '#22201e');
    ctx.fillStyle = '#ffc233';
    ctx.fillRect(259, 121, 5, 6);
    ctx.fillRect(256, 126, 8, 3);
    ctx.fillRect(258, 129, 5, 7);
    const charge = state.res.energyKwh / Math.max(1, state.res.batteryKwh);
    for (let i = 0; i < 4; i++) r(ctx, 248 + i * 7, 150, 5, 4, i / 4 < charge ? '#3fe08a' : '#2a3a2e');

    // 4) Tezgâh (elbise tamiri) + O2 tankı
    r(ctx, 296, 140, 46, 4, '#7a6a5c');
    r(ctx, 298, 144, 4, 42, '#5a4a3e');
    r(ctx, 336, 144, 4, 42, '#5a4a3e');
    r(ctx, 300, 96, 40, 30, '#2e2724');
    ctx.fillStyle = '#9a8f88';
    for (let i = 0; i < 4; i++) ctx.fillRect(304 + i * 9, 100 + (i % 2) * 8, 3, 14);
    r(ctx, 304, 130, 14, 10, '#c9c2b8');
    // O2 tankı
    r(ctx, 350, 96, 22, 90, '#cfc8be');
    r(ctx, 352, 92, 18, 4, '#cfc8be');
    r(ctx, 350, 140, 22, 6, '#3b82c4');
    ctx.fillStyle = '#2a2a2a';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('O2', 355, 120);
    const o2frac = Math.min(1, state.res.o2ReserveKg / S.DATA.habitat.base.o2ReserveStartKg);
    r(ctx, 374, 100, 3, 80, '#22201e');
    r(ctx, 374, 100 + 80 * (1 - o2frac), 3, 80 * o2frac, o2frac < 0.25 ? '#e8423b' : '#3fe0e6');

    // 5) Güç dağıtım paneli
    r(ctx, 384, 70, 30, 56, '#2a2622');
    for (let i = 0; i < state.loads.length; i++) {
      const L = state.loads[i];
      r(ctx, 388, 76 + i * 8, 6, 5, L.shed ? '#e8423b' : L.on ? '#3fe08a' : '#4a4a4a');
      r(ctx, 396, 77 + i * 8, 14, 3, '#4a423c');
    }

    // 6) Laboratuvar masası + pencere
    r(ctx, 424, 52, 64, 44, '#2b2420');
    r(ctx, 426, 54, 60, 40, dark > 0.5 ? '#1a1830' : '#d38d62');
    ctx.fillStyle = dark > 0.5 ? '#2a1c22' : '#9b4a35';
    ctx.fillRect(426, 80, 60, 14);
    if (cold) {
      ctx.globalAlpha = 0.5;
      r(ctx, 426, 54, 60, 40, '#bfe6f5');
      ctx.globalAlpha = 1;
    }
    r(ctx, 418, 150, 78, 5, '#8a7a6c');
    r(ctx, 422, 155, 4, 31, '#5a4a3e');
    r(ctx, 488, 155, 4, 31, '#5a4a3e');
    // sarkaç
    r(ctx, 428, 118, 2, 32, '#9a8f88');
    r(ctx, 448, 118, 2, 32, '#9a8f88');
    r(ctx, 428, 118, 22, 2, '#9a8f88');
    const sw = Math.sin((t || 0) * (2 * Math.PI) / S.Engineering.calcPendulumPeriod(1)) * 6;
    ctx.fillStyle = '#c9c2b8';
    ctx.fillRect(Math.round(438 + sw), 136, 4, 4);
    ctx.fillStyle = '#6b625d';
    ctx.beginPath();
    ctx.moveTo(439, 120);
    ctx.lineTo(440 + sw, 136);
    ctx.lineTo(441, 120);
    ctx.fill();
    // osiloskop
    r(ctx, 458, 128, 30, 22, '#8c8273');
    r(ctx, 461, 131, 18, 14, '#0f2a18');
    ctx.fillStyle = '#4dff8a';
    for (let i = 0; i < 18; i++) ctx.fillRect(461 + i, 137 + Math.round(Math.sin(i * 0.7 + (t || 0) * 4) * 4), 1, 1);
    // bitki rafı (sera bağlantısı)
    r(ctx, 424, 100, 64, 3, '#6b5c50');
    for (let i = 0; i < 5; i++) {
      const frozen = state.greenhouse.frozen;
      r(ctx, 428 + i * 12, 92, 6, 8, frozen ? '#a9c6d6' : '#4c9a3a');
      r(ctx, 427 + i * 12, 99, 8, 2, '#7a4a2c');
    }

    // 7) İletişim konsolu
    r(ctx, 502, 112, 48, 74, '#3a3430');
    r(ctx, 506, 116, 40, 26, '#0e1a22');
    const pass = S.Sim.activePass(state);
    ctx.fillStyle = pass ? '#3fe0e6' : '#2a6a70';
    for (let i = 0; i < 8; i++) {
      const hh = pass ? 4 + Math.abs(Math.sin(i + (t || 0) * 5)) * 14 : 3;
      ctx.fillRect(509 + i * 4, 138 - hh, 3, hh);
    }
    r(ctx, 508, 148, 36, 4, '#5a524c');
    r(ctx, 514, 160, 8, 8, '#e2672c');
    r(ctx, 528, 160, 8, 8, '#3fe08a');

    // 8) Hava kilidi kapağı
    r(ctx, 560, 70, 34, 116, '#2b2420');
    r(ctx, 562, 74, 30, 110, '#6d5d50');
    ctx.fillStyle = '#4b4039';
    ctx.beginPath();
    ctx.arc(577, 116, 11, 0, Math.PI * 2);
    ctx.fill();
    r(ctx, 566, 115, 22, 2, '#8a7a6c');
    r(ctx, 576, 105, 2, 22, '#8a7a6c');
    r(ctx, 562, 74, 30, 3, '#e2672c');

    // Acil durum / soğuk tonu
    if (lifeShed) {
      ctx.globalAlpha = 0.25 + 0.1 * Math.sin((t || 0) * 6);
      r(ctx, x0, y0, x1 - x0, y1 - y0, '#b3160f');
      ctx.globalAlpha = 1;
    } else if (cold) {
      ctx.globalAlpha = 0.18;
      r(ctx, x0, y0, x1 - x0, y1 - y0, '#6fb7e0');
      ctx.globalAlpha = 1;
    }

    // Seçili istasyon vurgusu
    if (highlightId) {
      const st = I.stations.find((x) => x.id === highlightId);
      if (st) {
        const pulse = 0.5 + 0.5 * Math.sin((t || 0) * 6);
        ctx.globalAlpha = 0.35 + pulse * 0.4;
        ctx.fillStyle = '#3fe0e6';
        ctx.fillRect(st.x - 22, I.floorY + 2, 44, 2);
        ctx.fillRect(st.x - 1, I.floorY - 132, 2, 4);
        ctx.globalAlpha = 1;
      }
    }
  };

  S.Art = Art;
})((window.SOL14 = window.SOL14 || {}));
