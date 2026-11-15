/**
 * SOL 14: RED HORIZON — Kazı ve doğu rotası çizimleri (K4; K3 Medine'nin dünya prototipinden taşındı)
 *  - Doğu bölgeleri (terrain.map.zones): kurumuş göl yatağı (çamur çatlakları), karanlık kum tepeleri, krater alanı,
 *    lav ovası (bazalt akıntıları, tümülüsler, çökme çukurları). Bölge zemine bağlıdır: kamera ilerledikçe yumuşak
 *    bir bantla kayarak gelir.
 *  - Kazı noktaları (explore.dig): toz/kum/kırağı tümseği, buz kütlesi, buz saçağı altı, tünel penceresini kapatan moloz.
 *    Gerçek tümsek daha büyük ve arada metal parlar; sahte tümsek düz topraktır. Araç kazılmadan çizilmez.
 *  - İpuçları: doğudaki gömülü araçların yolunda döküntü (rover: tekerlek, panel, kablo; iniş aracı: paraşüt,
 *    arka kabuk, ısı kalkanı). Elbise tarayıcısı gerçek noktanın yanında "!" gösterir; RIMFAX uzaktan sinyal halkası.
 *  - İZCİ-1 parçaları (lav tüneli + FIELD CAM vizörü).
 * DOM yok; effects.js çağırır. Dekor piksel konumları çizime aittir; oyun değerleri data/*.json'dadır.
 */
(function (S) {
  'use strict';
  const DF = {};

  function rnd(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  DF.rnd = rnd;
  DF.seedOf = (str) => [...String(str)].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 10007;
  function hexMix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  DF.hexMix = hexMix;
  const atNight = (col, minute) => hexMix(col, '#120c10', S.Art.lighting(minute).dark * 0.85);
  const sat = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => x * x * (3 - 2 * x);

  /* ---------------- Doğu bölgeleri: zemine bağlı, yumuşak geçişli katmanlar ---------------- */
  const SCENERY = {
    lakebed: { ground: 'lakebed' },
    dunes: { back: 'dunes', ground: 'sand' },
    dunes_east: { back: 'dunes', ground: 'sand' },
    rocky_approach: { back: 'craters', ground: 'blocky' },
    lava_plain: { back: 'lava', ground: 'basalt' },
    tube_mouth: { back: 'lava', ground: 'basalt' },
    yardangs: { back: 'yardangs', ground: 'layered' },
    buttes: { back: 'buttes', ground: 'bedrock' }
  };
  const BLEND_M = 120; // bölge sınırındaki yumuşak bandın genişliği (m, zeminde)
  let layer = null;

  function zones() {
    return S.DATA.terrain.map.zones.filter((z) => SCENERY[z.id]);
  }
  function zoneCover(z, camX, w) {
    const Surf = S.Surface;
    const band = Surf.mToPx(BLEND_M) - Surf.mToPx(0);
    const a = Surf.mToPx(z.fromM) - camX;
    const b = Surf.mToPx(z.toM) - camX;
    if (b + band / 2 <= 0 || a - band / 2 >= w) return null;
    return { a, b, band, full: a + band / 2 <= 0 && b - band / 2 >= w };
  }
  /** Her bölgeyi kendi katmanına çizer ve yatay maskeyle keser (sınırda yumuşak geçiş) */
  function drawZoneLayers(ctx, camX, w, h, drawFn) {
    for (const z of zones()) {
      const cov = zoneCover(z, camX, w);
      if (!cov) continue;
      if (cov.full) {
        ctx.save();
        drawFn(ctx, z);
        ctx.restore();
        continue;
      }
      if (typeof document === 'undefined') continue;
      if (!layer) layer = document.createElement('canvas');
      if (layer.width !== w || layer.height !== h) {
        layer.width = w;
        layer.height = h;
      }
      const lctx = layer.getContext('2d');
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = 'source-over';
      lctx.globalAlpha = 1;
      lctx.clearRect(0, 0, w, h);
      lctx.save();
      drawFn(lctx, z);
      lctx.restore();
      const g = lctx.createLinearGradient(0, 0, w, 0);
      const alphaAt = (x) => smooth(sat((x - cov.a) / cov.band + 0.5)) * smooth(sat((cov.b - x) / cov.band + 0.5));
      for (let i = 0; i <= 24; i++) g.addColorStop(i / 24, 'rgba(0,0,0,' + alphaAt((i / 24) * w).toFixed(3) + ')');
      lctx.globalCompositeOperation = 'destination-in';
      lctx.fillStyle = g;
      lctx.fillRect(0, 0, w, h);
      lctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, 0, 0);
    }
  }

  function drawDunes(ctx, minute, camX, w) {
    const layers = [
      { par: 0.1, base: 262, amp: 30, len: 210, col: '#6e4c40' },
      { par: 0.25, base: 282, amp: 20, len: 130, col: '#57392f' },
      { par: 0.5, base: 300, amp: 11, len: 74, col: '#442c26' }
    ];
    for (const L of layers) {
      const body = atNight(L.col, minute);
      const crest = atNight(hexMix(L.col, '#e9b98c', 0.4), minute);
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        const ph = (((wx / L.len) % 1) + 1) % 1;
        // uzun rüzgârüstü yamaç, kısa dik rüzgâraltı yüzü
        const shape = ph < 0.75 ? Math.sin(((ph / 0.75) * Math.PI) / 2) : Math.cos((((ph - 0.75) / 0.25) * Math.PI) / 2);
        const n = 0.75 + 0.25 * Math.sin(Math.floor(wx / L.len) * 1.7);
        const top = Math.round(L.base - L.amp * shape * n);
        ctx.fillStyle = body;
        ctx.fillRect(x, top, 2, 370 - top);
        if (ph > 0.6 && ph < 0.78) {
          ctx.fillStyle = crest;
          ctx.fillRect(x, top, 2, 1);
        }
      }
    }
  }

  function drawCraterRims(ctx, minute, camX, w) {
    ctx.fillStyle = atNight('#9a6450', minute);
    ctx.fillRect(0, 276, w, 30);
    const rows = [
      { par: 0.12, base: 282, spacing: 260, minW: 120, maxW: 220, minH: 10, maxH: 22, rim: '#b98066', bowl: '#5a3530', seed: 5 },
      { par: 0.32, base: 298, spacing: 340, minW: 160, maxW: 280, minH: 12, maxH: 26, rim: '#a46e57', bowl: '#4a2b27', seed: 17 }
    ];
    for (const R of rows) {
      const rim = atNight(R.rim, minute);
      const rimLight = atNight(hexMix(R.rim, '#f0c9a6', 0.35), minute);
      const bowl = atNight(R.bowl, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const cw = R.minW + Math.round(rnd(i * 2.3 + R.seed) * (R.maxW - R.minW));
        const chh = R.minH + Math.round(rnd(i * 4.1 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.9 + R.seed) * 70);
        for (let x = 0; x < cw; x += 2) {
          const u = x / cw;
          const lip = Math.sin(u * Math.PI);
          const edge = Math.pow(Math.abs(u - 0.5) * 2, 3);
          const top = Math.round(R.base - chh * (0.35 * lip + 0.65 * edge));
          ctx.fillStyle = rim;
          ctx.fillRect(x0 + x, top, 2, R.base - top + 2);
          if (Math.abs(u - 0.5) < 0.36) {
            ctx.fillStyle = bowl;
            ctx.fillRect(x0 + x, top, 2, Math.max(1, Math.round(chh * 0.25 * (1 - edge))));
          }
          if (edge > 0.6) {
            ctx.fillStyle = rimLight;
            ctx.fillRect(x0 + x, top, 2, 1);
          }
        }
        ctx.fillStyle = bowl;
        for (let k = 0; k < 5; k++) {
          const bx = x0 - 20 + Math.round(rnd(i * 7 + k + R.seed) * (cw + 40));
          const bs = 2 + Math.round(rnd(i * 11 + k) * 4);
          ctx.fillRect(bx, R.base - bs + 1, bs + 2, bs);
        }
      }
    }
  }

  function drawLavaPlain(ctx, minute, camX, w) {
    const far = atNight('#7a5650', minute);
    for (let x = 0; x < w; x += 2) {
      const wx = x + camX * 0.06;
      const u = (((wx % 1400) + 1400) % 1400) / 1400; // uzakta alçak bir kalkan volkan
      const shield = Math.max(0, Math.cos((u - 0.5) * Math.PI)) ** 1.6;
      const top = Math.round(270 - 34 * shield);
      ctx.fillStyle = far;
      ctx.fillRect(x, top, 2, 310 - top);
    }
    const lobes = [
      { par: 0.22, base: 290, h: 9, len: 150, body: '#4a3438', top: '#86584a' },
      { par: 0.45, base: 300, h: 7, len: 96, body: '#3a2a2e', top: '#73493f' }
    ];
    for (const L of lobes) {
      const body = atNight(L.body, minute);
      const top = atNight(L.top, minute);
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        const i = Math.floor(wx / L.len);
        const u = wx / L.len - i;
        const hh = L.h * (0.6 + rnd(i * 2.7) * 0.6) * Math.min(1, Math.sin(u * Math.PI) * 2.2);
        const y = Math.round(L.base - hh);
        ctx.fillStyle = body;
        ctx.fillRect(x, y, 2, 362 - y);
        ctx.fillStyle = top;
        ctx.fillRect(x, y, 2, 1);
      }
    }
  }

  function drawMudCracks(ctx, minute, camX, w, gy) {
    const pal = S.Art.palette('meridiani', minute);
    ctx.fillStyle = pal.groundLight;
    ctx.globalAlpha *= 0.55;
    for (let y = gy + 10; y < gy + 60; y += 13) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = pal.groundDark;
    const cell = 22;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 3; row++) {
        const y = gy + 6 + row * 17 + Math.round(rnd(i * 3 + row) * 5);
        ctx.fillRect(x + Math.round(rnd(i + row * 7) * 6), y, cell - 4, 1);
        ctx.fillRect(x + Math.round(rnd(i * 5 + row) * 10), y - 5, 1, 6);
      }
    }
  }

  function drawSandGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#4f342b', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#7a5444', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#6a4638', minute);
    for (let y = gy + 6; y < h; y += 6) {
      const off = Math.round((((camX * 0.9 + y * 7) % 14) + 14) % 14);
      for (let x = -off; x < w; x += 14) ctx.fillRect(x, y + Math.round(Math.sin((x + camX + y) * 0.08)), 8, 1);
    }
  }

  function drawBlockyGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#7e4e3e', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#a8705a', minute);
    ctx.fillRect(0, gy, w, 2);
    const cell = 26;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 4; row++) {
        const r = rnd(i * 3.7 + row * 13);
        if (r < 0.45) continue;
        const sz = 2 + Math.round(r * 4);
        const y = gy + 4 + row * 12 + Math.round(rnd(i + row) * 6);
        const bx = x + Math.round(rnd(i * 5 + row) * 16);
        ctx.fillStyle = atNight('#4a2e28', minute);
        ctx.fillRect(bx, y, sz + 2, sz);
        ctx.fillStyle = atNight('#b07a62', minute);
        ctx.fillRect(bx, y, sz + 2, 1);
      }
    }
  }

  function drawBasaltGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#3e2e30', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#7a5248', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#57403e', minute);
    for (let row = 0; row < 6; row++) {
      const y0 = gy + 6 + row * 9;
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX;
        const rope = Math.sin(wx * 0.11 + row * 1.7) * 2 + Math.sin(wx * 0.031 + row) * 2; // ip gibi kıvrımlı pahoehoe kabuğu
        ctx.fillRect(x, Math.round(y0 + rope), 2, 1);
      }
    }
    ctx.fillStyle = atNight('#8a5a46', minute);
    const cell = 40;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      if (rnd(i * 4.4) < 0.5) continue;
      ctx.fillRect(Math.round(i * cell - camX + rnd(i) * 20), gy + 10 + Math.round(rnd(i * 2) * 30), 10, 2);
    }
  }

  // Yardang sırtları: rüzgârın oyduğu uzun, akıcı sırtlar (rüzgâra bakan kör baş, uzayan kuyruk), katmanlı yanlar
  function drawYardangs(ctx, minute, camX, w) {
    const rows = [
      { par: 0.1, base: 284, spacing: 300, minL: 160, maxL: 260, minH: 18, maxH: 34, body: '#b98a68', band: '#a27454', lit: '#e3bc96', seed: 23 },
      { par: 0.28, base: 300, spacing: 240, minL: 120, maxL: 200, minH: 12, maxH: 24, body: '#a87a5a', band: '#8f6347', lit: '#d8ad86', seed: 41 }
    ];
    for (const R of rows) {
      const body = atNight(R.body, minute);
      const band = atNight(R.band, minute);
      const lit = atNight(R.lit, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const L = R.minL + Math.round(rnd(i * 3.3 + R.seed) * (R.maxL - R.minL));
        const H = R.minH + Math.round(rnd(i * 6.1 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.7 + R.seed) * 80);
        for (let x = 0; x < L; x += 2) {
          const u = x / L;
          const prof = u < 0.12 ? Math.sin(((u / 0.12) * Math.PI) / 2) : Math.pow(1 - (u - 0.12) / 0.88, 1.6);
          const hh = Math.round(H * prof);
          if (hh <= 0) continue;
          const top = R.base - hh;
          ctx.fillStyle = body;
          ctx.fillRect(x0 + x, top, 2, hh + 2);
          ctx.fillStyle = band;
          for (let y = top + 3; y < R.base; y += 4) ctx.fillRect(x0 + x, y, 2, 1);
          ctx.fillStyle = lit;
          ctx.fillRect(x0 + x, top, 2, 1);
        }
      }
    }
  }  // Katmanlı tepeler: üst üste tortul kaya bantlarından düz tepeli basamaklı tepeler
  function drawButtes(ctx, minute, camX, w) {
    const rows = [
      { par: 0.1, base: 286, spacing: 230, minW: 90, maxW: 170, minH: 40, maxH: 78, light: '#c79a74', dark: '#9c6a4c', seed: 3 },
      { par: 0.3, base: 300, spacing: 170, minW: 50, maxW: 110, minH: 20, maxH: 44, light: '#b5835f', dark: '#875538', seed: 11 }
    ];
    for (const R of rows) {
      const light = atNight(R.light, minute);
      const dark = atNight(R.dark, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const bw = R.minW + Math.round(rnd(i * 3.1 + R.seed) * (R.maxW - R.minW));
        const bh = R.minH + Math.round(rnd(i * 5.7 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.3 + R.seed) * 60);
        const top = R.base - bh;
        for (let y = top; y < R.base; y += 3) {
          const band = Math.floor((y - top) / 3);
          const inset = Math.max(0, 8 - band * 2) + (band % 4 === 3 ? 2 : 0);
          ctx.fillStyle = band % 2 ? dark : light;
          ctx.fillRect(x0 + inset, y, bw - inset * 2, 3);
        }
        ctx.fillStyle = dark;
        ctx.fillRect(x0 - 10, R.base - 3, bw + 20, 3);
      }
    }
  }  // Yardang zemini: ince katmanlı, rüzgârın oluk açtığı açık renkli yumuşak kaya
  function drawLayeredGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#c49a76', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#e1bb95', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#a87e5e', minute);
    for (let y = gy + 5; y < h; y += 5) {
      const off = Math.round((((camX + y * 31) % 90) + 90) % 90);
      for (let x = -off; x < w; x += 90) ctx.fillRect(x, y, 60 + Math.round(rnd(y + x) * 20), 1);
    }
  }  // Tepe ülkesi zemini: levhalar arasında çatlaklar olan açık katmanlı ana kaya
  function drawBedrock(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#b48a64', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#d4ab84', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#946a4a', minute);
    for (let y = gy + 8; y < h; y += 9) ctx.fillRect(0, y, w, 1);
    const cell = 34;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 4; row++) ctx.fillRect(x + Math.round(rnd(i * 2 + row) * 12), gy + 4 + row * 9, 1, 8);
    }
  }
  /** Lav ovasında tümülüsler ve çökme çukurları (tünel tavanının çöktüğü yerler); m = tünel penceresine uzaklık */
  const LAVA_FEATURES = [
    { m: -230, kind: 'tumulus', w: 64, h: 13 },
    { m: -170, kind: 'pit', w: 46, h: 9 },
    { m: -110, kind: 'tumulus', w: 40, h: 8 },
    { m: -60, kind: 'pit', w: 30, h: 6 }
  ];
  function drawLavaFeature(ctx, f, x, gy, minute) {
    const half = Math.round(f.w / 2);
    const seed = f.m * 1.37;
    if (f.kind === 'pit') {
      const wall = atNight('#2e2224', minute);
      const floor = atNight('#1c1416', minute);
      for (let dx = -half; dx <= half; dx += 2) {
        const u = dx / half;
        const d = Math.round(f.h * Math.sqrt(Math.max(0, 1 - u * u)) + (rnd(seed + dx) - 0.5) * 2);
        ctx.fillStyle = wall;
        ctx.fillRect(x + dx, gy - 1, 2, Math.max(1, d));
        ctx.fillStyle = floor;
        ctx.fillRect(x + dx, gy - 1 + Math.max(1, d) - 2, 2, 3);
      }
      ctx.fillStyle = atNight('#6a5048', minute);
      ctx.fillRect(x - half - 6, gy - 2, 7, 2);
      ctx.fillRect(x + half - 1, gy - 2, 7, 2);
      return;
    }
    const body = atNight('#3e2e30', minute);
    const lit = atNight('#86584a', minute);
    const crack = atNight('#160f11', minute);
    for (let dx = -half; dx <= half; dx += 2) {
      const u = dx / half;
      const hh = Math.round(f.h * Math.pow(Math.max(0, 1 - u * u), 0.6) + (rnd(seed + dx) - 0.5) * 1.5);
      if (hh <= 0) continue;
      ctx.fillStyle = body;
      ctx.fillRect(x + dx, gy - hh, 2, hh + 1);
      ctx.fillStyle = lit;
      ctx.fillRect(x + dx, gy - hh, 2, 1);
      if (Math.abs(u) < 0.22) {
        ctx.fillStyle = crack; // şişerken yarılan kabuğun tepe çatlağı
        ctx.fillRect(x + dx, gy - hh, 2, Math.max(2, Math.round(hh * 0.45)));
      }
    }
  }

  /** Sırtların üstüne bölge manzarası (kum tepeleri, krater ağızları, lav ovası) */
  DF.drawBackdrop = function (ctx, s, camX, w, minute) {
    drawZoneLayers(ctx, camX, w, 362, (c, z) => {
      const sc = SCENERY[z.id];
      if (sc.back === 'dunes') drawDunes(c, minute, camX, w);
      else if (sc.back === 'craters') drawCraterRims(c, minute, camX, w);
      else if (sc.back === 'lava') drawLavaPlain(c, minute, camX, w);
      else if (sc.back === 'yardangs') drawYardangs(c, minute, camX, w);
      else if (sc.back === 'buttes') drawButtes(c, minute, camX, w);
    });
  };

  /** Zeminin üstüne bölge dokusu */
  DF.drawGroundDetail = function (ctx, s, camX, w, h, gy, minute) {
    drawZoneLayers(ctx, camX, w, h, (c, z) => {
      const sc = SCENERY[z.id];
      if (sc.ground === 'lakebed') drawMudCracks(c, minute, camX, w, gy);
      else if (sc.ground === 'sand') drawSandGround(c, minute, camX, w, h, gy);
      else if (sc.ground === 'blocky') drawBlockyGround(c, minute, camX, w, h, gy);
      else if (sc.ground === 'basalt') drawBasaltGround(c, minute, camX, w, h, gy);
      else if (sc.ground === 'layered') drawLayeredGround(c, minute, camX, w, h, gy);
      else if (sc.ground === 'bedrock') drawBedrock(c, minute, camX, w, h, gy);
    });
    const tube = S.DATA.terrain.map.tubeMouthM;
    for (const f of LAVA_FEATURES) {
      const x = Math.round(S.Surface.mToPx(tube + f.m) - camX);
      if (x > -80 && x < w + 80) drawLavaFeature(ctx, f, x, gy, minute);
    }
  };

  /* ---------------- İpuçları: gömülü araçların yolundaki döküntü ---------------- */
  const isRover = (c) => /^rover_/.test(c.sprite);
  /** Doğudaki gömülü aracın yolunda üç döküntü (yalnızca bilgi verir, etkileşim yok) */
  function debrisFor(c) {
    const kinds = isRover(c) ? ['wheel', 'panel', 'cable'] : c.id === 'beagle2' ? ['airbag', 'parachute', 'panel'] : ['parachute', 'backshell', 'heatshield'];
    const base = DF.seedOf(c.id);
    return kinds.map((kind, i) => ({ kind, m: c.distanceM - (120 - i * 38) - Math.round(rnd(base + i) * 12), seed: base + i }));
  }
  DF.debrisFor = debrisFor;

  function drawDebris(ctx, kind, x, gy, seed) {
    const flip = rnd(seed) < 0.5 ? -1 : 1;
    const R = (dx, dy, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x + dx, gy + dy, w, h);
    };
    if (kind === 'wheel') {
      R(-4, -5, 8, 6, '#3b3430');
      R(-3, -4, 6, 1, '#7a706a');
      R(-1, -5, 2, 5, '#7a706a');
    } else if (kind === 'panel') {
      R(-6, -2, 12, 3, '#2c3e6b');
      for (let i = -5; i < 6; i += 3) R(i, -2, 1, 1, '#9fb3d9');
    } else if (kind === 'cable') {
      for (let i = 0; i < 10; i++) R(-5 + i, -1 - ((i * flip) % 3 === 0 ? 1 : 0), 1, 1, '#c9a23a');
    } else if (kind === 'parachute') {
      R(-8, -2, 16, 3, '#e8e2d8');
      R(-8 + (flip > 0 ? 0 : 10), -2, 6, 3, '#d0603a');
    } else if (kind === 'backshell') {
      R(-5, -4, 10, 4, '#b8b3ab');
      R(-3, -6, 6, 2, '#b8b3ab');
      R(-5, -1, 10, 1, '#6e6a64');
    } else if (kind === 'heatshield') {
      R(-7, -2, 14, 3, '#4a2c22');
      R(-5, -3, 10, 1, '#6d4334');
    } else if (kind === 'airbag') {
      for (let i = 0; i < 3; i++) R(-7 + i * 5, -3 - (i % 2), 4, 4, '#d9c9a3');
    }
  }

  /* ---------------- Kazı noktaları ---------------- */
  const KIND_PAL = {
    dust: { fresh: '#d9925f' },
    sand: { fresh: '#c99a6a' },
    frost: { fresh: '#e8eef5', tint: '#cfd9e6' },
    ice: { fresh: '#cfeaff', tint: '#9fd0f0' },
    overhang: { fresh: '#dff1ff', tint: '#a8d4ee' },
    rubble: { fresh: '#5a4446' }
  };

  /** Toprak/kırağı tümseği. Gerçek olan daha büyüktür, çevresinde topak ve taş olur, arada metal parlar */
  function drawMound(ctx, x, gy, pal, kind, dug, total, seed, real, light, now) {
    const kp = KIND_PAL[kind] || KIND_PAL.dust;
    const wid = real ? 26 : 13;
    const steps = Math.max(1, Math.round((real ? 4 : 2) * (1 - (dug / Math.max(1, total)) * 0.6)));
    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = i % 2 ? kp.tint || pal.groundLight : kp.fresh;
      ctx.fillRect(x - wid + i * 5, gy - 2 - i * 2, (wid - i * 5) * 2, 2);
    }
    ctx.fillStyle = kp.tint ? hexMix(kp.tint, '#6b7a8c', 0.4) : pal.groundDark;
    for (let i = 0; i < (real ? 9 : 3); i++) ctx.fillRect(x - wid + Math.round(rnd(seed + i) * wid * 2), gy - 1 - Math.round(rnd(seed + i * 3) * 4), 2, 2);
    if (real) {
      ctx.fillStyle = pal.rock;
      ctx.fillRect(x - wid - 5, gy - 3, 5, 4);
      ctx.fillRect(x + wid + 1, gy - 2, 4, 3);
      if (dug < 2) {
        ctx.fillStyle = '#8f949c'; // kumdan taşan bir metal köşesi
        ctx.fillRect(x + 4, gy - 12, 5, 4);
        ctx.fillRect(x + 7, gy - 14, 2, 2);
        ctx.fillStyle = '#4a4f57';
        ctx.fillRect(x + 4, gy - 9, 5, 1);
      }
    }
    if (dug > 0) {
      ctx.fillStyle = '#2a140d';
      ctx.fillRect(x - 3 - dug * 2, gy - 1, 6 + dug * 4, 4);
      if (dug >= 2 && real) {
        ctx.fillStyle = '#9a9690';
        ctx.fillRect(x - 2, gy - 5, 7, 4);
      }
    }
    if (real && light.dark < 0.6) {
      const phase = (now + rnd(seed) * 2) % 1.8;
      if (phase < 0.35) {
        ctx.save();
        ctx.globalAlpha = (1 - phase / 0.35) * (1 - light.dark);
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(x + 7, gy - 19, 1, 9);
        ctx.fillRect(x + 3, gy - 15, 9, 1);
        ctx.restore();
      }
    }
  }

  /** Tünel penceresini kapatan moloz: bazalt blokları; her vuruşta biraz azalır, sonunda tünel ağzı görünür */
  function drawRubble(ctx, x, gy, dug, total, minute) {
    const left = 1 - dug / Math.max(1, total);
    const body = atNight('#3a2a2e', minute);
    const lit = atNight('#86584a', minute);
    const n = Math.max(2, Math.round(9 * left));
    for (let i = 0; i < n; i++) {
      const bw = 8 + Math.round(rnd(i * 3.1) * 12);
      const bh = 5 + Math.round(rnd(i * 5.3) * 8);
      const bx = x - 34 + Math.round(rnd(i * 1.7) * 60);
      const by = gy - bh - Math.round(rnd(i * 2.9) * 10 * left);
      ctx.fillStyle = body;
      ctx.fillRect(bx, by, bw, bh + 1);
      ctx.fillStyle = lit;
      ctx.fillRect(bx, by, bw, 1);
    }
    ctx.fillStyle = atNight('#ffcf3f', minute); // uyarı direği: burası çökmüş bir tavan penceresi
    ctx.fillRect(x + 32, gy - 30, 1, 30);
    ctx.fillRect(x + 33, gy - 30, 5, 3);
  }

  /** Kazı noktaları + döküntü + tarayıcı tepkisi + RIMFAX sinyali (effects.js, dünya katmanında) */
  DF.drawSites = function (ctx, s, camX, w, gy, t, light) {
    const X = S.Explore;
    if (!X || !s.explore) return;
    const pal = S.Art.palette(s.design.landingSiteId, s.minute);
    const vis = (sx) => sx > -80 && sx < w + 80;
    // Döküntü: doğudaki henüz kazılmamış araçların yolunda
    for (const c of S.Forensics.cases()) {
      if (c.distanceM < 0) continue;
      for (const d of debrisFor(c)) {
        const sx = Math.round(S.Surface.mToPx(d.m) - camX);
        if (vis(sx)) drawDebris(ctx, d.kind, sx, gy, d.seed);
      }
    }
    for (const st of X.digSites()) {
      const done = X.siteDone(s, st);
      const sx = Math.round(S.Surface.mToPx(X.siteAt(st)) - camX);
      if (!vis(sx)) continue;
      const hits = X.siteHits(s, st);
      if (st.kind === 'rubble') {
        if (!done) drawRubble(ctx, sx, gy, hits, st.hits, s.minute);
        continue;
      }
      if (done) {
        // kazılmış çukur: araç (effects.js çizer) ya da boş çukur
        ctx.fillStyle = '#2a140d';
        ctx.fillRect(sx - 12, gy - 1, 24, 3);
        continue;
      }
      drawMound(ctx, sx, gy, pal, st.kind, hits, st.hits, DF.seedOf(st.id), X.siteReal(st), light, t);
    }
    // Kişi 5: yüzeydeki maden noktaları (yarı gömülü parlak taş; kazıldıkça küçülür)
    if (X.mineralSites) {
      for (const st of X.mineralSites('surface')) {
        const sx = Math.round(S.Surface.mToPx(st.atM) - camX);
        if (vis(sx)) DF.drawMineral(ctx, s, st, sx, gy, t, light, false);
      }
    }
    // RIMFAX (yer radarı): menzildeki gerçek noktanın üstünde sinyal halkası
    const ping = X.scannerPing(s);
    if (ping && S.Sim.has(s, 'rimfax')) {
      const sx = Math.round(S.Surface.mToPx(X.siteAt(ping.site)) - camX);
      const pulse = (t * 0.9) % 1;
      ctx.strokeStyle = 'rgba(63,224,230,' + (0.8 * (1 - pulse)).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, gy + 2, 6 + pulse * 22, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  };

  /**
   * Kişi 5: maden noktası, kazı tümseklerinin çizim diliyle: bölge renginde alçak bir tümsek, içinden taşan mineral
   * parçası (gerçek tümseklerdeki metal köşesi gibi), aynı parıltı ve gece kararması. Tünelde: duvarda düz renkli
   * damar + tünel buluntularının yanıp sönen sarı işareti. Her vuruşta biraz küçülür; bitince çukur / boş iz kalır.
   */
  DF.drawMineral = function (ctx, s, st, x, gy, t, light, cave) {
    const m = S.Explore.mineralType(st.mineral);
    const hits = S.Explore.mineralHits(s, st);
    const done = hits >= st.hits;
    const left = 1 - hits / Math.max(1, st.hits);
    const R = (dx, dy, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x + dx), Math.round(gy + dy), w, h);
    };
    const seed = DF.seedOf(st.id);
    if (cave) {
      // duvardaki damar: tünel katmanları gibi düz renk, üstte 1 px açık ton
      const col = m ? m.color : '#9a9690';
      const len = done ? 0 : Math.max(6, Math.round(22 * (0.4 + 0.6 * left)));
      for (let i = 0; i < len; i++) {
        const y = -7 - Math.round(i * 0.3) + (i % 7 === 3 ? 1 : 0); // duvarın dibinde, diz hizası (astronot diz çöküp deler)
        R(-11 + i, y, 1, 3, col);
        R(-11 + i, y, 1, 1, hexMix(col, '#ffffff', 0.35));
      }
      if (done) R(-8, -9, 16, 2, '#1a1214');
      else if (Math.sin(t * 3 + st.atM) > 0) R(-1, -46, 3, 3, '#ffc233');
      return;
    }
    const minute = s.minute;
    if (done) {
      R(-8, -1, 16, 3, '#2a140d');
      return;
    }
    // alçak tümsek (gerçek tümseklerle aynı basamaklar, daha küçük)
    const pal = S.Art.palette(s.design.landingSiteId, minute);
    const kp = KIND_PAL.dust;
    const wid = 14;
    const steps = Math.max(1, Math.round(3 * (1 - (hits / st.hits) * 0.6)));
    for (let i = 0; i < steps; i++) R(-wid + i * 5, -2 - i * 2, (wid - i * 5) * 2, 2, i % 2 ? pal.groundLight : kp.fresh);
    ctx.fillStyle = pal.groundDark;
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x - wid + rnd(seed + i) * wid * 2), Math.round(gy - 1 - rnd(seed + i * 3) * 3), 2, 2);
    // içinden taşan mineral parçası
    const col = atNight(m ? m.color : '#9a9690', minute);
    const lit = atNight(hexMix(m ? m.color : '#9a9690', '#ffffff', 0.35), minute);
    const dk = atNight(hexMix(m ? m.color : '#9a9690', '#000000', 0.4), minute);
    const up = Math.round(3 * left);
    if (st.mineral === 'hematite') {
      for (const [dx, dy] of [[1, -7], [5, -8], [3, -10]]) {
        R(dx, dy - up, 3, 3, col);
        R(dx, dy - up, 1, 1, lit);
      }
    } else {
      R(2, -9 - up, 7, 4 + up, col);
      R(4, -11 - up, 3, 2, col);
      R(2, -9 - up, 7, 1, lit);
      R(2, -5, 7, 1, dk);
      if (st.mineral === 'gypsum') R(3, -8 - up, 5, 1, atNight('#f4efe4', minute));
      if (st.mineral === 'olivine') R(5, -8 - up, 2, 1, atNight('#8fb33c', minute));
    }
    if (hits > 0) R(-3 - hits * 2, -1, 6 + hits * 4, 3, '#2a140d');
    // parıltı: gerçek tümseklerle aynı (gece söner)
    if (light.dark < 0.6) {
      const phase = (t + rnd(seed) * 2) % 1.8;
      if (phase < 0.35) {
        ctx.save();
        ctx.globalAlpha = (1 - phase / 0.35) * (1 - light.dark);
        R(7, -19, 1, 9, '#fff6d8');
        R(3, -15, 9, 1, '#fff6d8');
        ctx.restore();
      }
    }
  };

  /** Elbise tarayıcısı: gerçek noktanın yanında astronotun üstünde "!" (sahte tümsek tepki vermez) */
  DF.drawScanner = function (ctx, s, sx, topY, t) {
    const ping = S.Explore && s.explore ? S.Explore.scannerPing(s) : null;
    if (!ping || !ping.close) return;
    const blink = (t * 2.2) % 1 < 0.6;
    if (!blink) return;
    ctx.fillStyle = '#ffcf3f';
    ctx.fillRect(sx - 1, topY - 16, 3, 8);
    ctx.fillRect(sx - 1, topY - 6, 3, 3);
  };

  /* ---------------- İZCİ-1 parçaları (kurgusal rover; lav tüneli ve FIELD CAM) ---------------- */
  DF.drawPart = function (c, kind, x, gy, k, tagged) {
    const R = (dx, dy, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x + dx * k), Math.round(gy + dy * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
    };
    const metal = '#8d939b';
    const light = '#c3c8cf';
    const dark = '#3a3d42';
    if (kind === 'wheel') {
      R(-6, -11, 12, 10, metal);
      R(-5, -12, 10, 1, light);
      R(-7, -10, 1, 8, dark);
      R(6, -10, 1, 8, dark);
      for (let i = 0; i < 4; i++) R(-6 + i * 4, -11, 1, 10, '#6c727a');
      R(-2, -8, 4, 4, dark);
      R(-1, -7, 2, 2, '#c9a23a');
      R(5, -3, 6, 2, '#6c727a');
    } else if (kind === 'panel') {
      R(-13, -4, 26, 4, '#22335c');
      for (let i = 0; i < 6; i++) R(-12 + i * 4, -4, 3, 1, '#5b77b3');
      R(-13, 0, 26, 1, light);
      R(10, -6, 5, 2, '#22335c');
      R(4, -4, 1, 4, '#9fb3d9');
    } else if (kind === 'mast') {
      R(-1, -2, 14, 2, metal);
      R(-8, -8, 9, 7, '#d6cfc2');
      R(-7, -6, 2, 2, '#14161a');
      R(-3, -6, 2, 2, '#14161a');
      R(-8, -8, 9, 1, '#efe9de');
      R(12, -3, 2, 3, dark);
    } else if (kind === 'antenna') {
      R(-9, -4, 18, 2, '#d8d4cc');
      R(-7, -6, 14, 2, '#cfcac0');
      R(-4, -7, 8, 1, '#bdb8ae');
      R(0, -11, 1, 5, metal);
      R(-1, -12, 3, 1, metal);
      R(2, -6, 1, 4, dark);
      R(9, -2, 6, 2, metal);
    } else if (kind === 'body') {
      R(-34, -12, 12, 12, '#2c1d1c');
      R(-24, -16, 48, 3, '#22335c');
      R(-22, -13, 44, 8, '#b9b2a6');
      R(-22, -13, 44, 1, '#d8d2c6');
      R(-20, -5, 8, 5, dark);
      R(12, -5, 8, 5, dark);
      R(-3, -4, 6, 3, '#6c727a'); // boş tekerlek yuvası (tekerlek tünelin başında bulundu)
      R(14, -20, 2, 4, metal);
      R(-8, -34, 30, 18, '#2c1d1c'); // tavandan düşüp aracı sıkıştıran blok
      R(-8, -34, 30, 1, '#4a302b');
      R(22, -14, 12, 14, '#2c1d1c');
    }
    if (tagged) {
      R(8, -16, 4, 6, '#ffcc33'); // kanıt etiketi
      R(9, -15, 2, 1, '#1a1a1a');
    }
  };

  S.DigFx = DF;
})((window.SOL14 = window.SOL14 || {}));
