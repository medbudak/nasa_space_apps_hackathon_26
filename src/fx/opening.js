/**
 * SOL 14: RED HORIZON — Açılış: Dünya'dan kalkış + Dünya–Mars yolculuğu (transit ekranının tuvali)
 *  0–4.6 sn    kalkış: ateşleme, duman bulutu, roket kuleden yükselir, kamera izler, gökyüzü kararır
 *  4.6–11.2    yolculuk: Dünya → kesikli yörünge → Mars; mekik yörünge boyunca ilerler (meteor olayı ortada)
 *  11.2–12.4   varış: Mars yaklaşır, ekran Mars gökyüzü rengine açılır
 * Ardından oyun dünyasında mevcut iniş sahnesi (S.Lander) başlar: alçalma ve iniş yalnızca orada oynar.
 * Mekik, oyundaki iniş aracının aynı prosedürel çizimidir (S.Lander.drawShip). Zaman çizelgesi DOM'suzdur.
 */
(function (S) {
  'use strict';
  const O = {};
  O.T = { liftoff: 0, rise: 1.2, cruise: 4.6, meteor: 7.2, arrive: 11.2, end: 12.4 };
  O.W = 640;
  O.H = 360;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const ease = (f) => f * f * (3 - 2 * f);
  const hsh = (n) => {
    const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
    return s - Math.floor(s);
  };

  O.phase = function (t) {
    if (t < O.T.cruise) return 'liftoff';
    if (t < O.T.arrive) return 'cruise';
    if (t < O.T.end) return 'arrive';
    return 'done';
  };
  /** Yolculuk ilerlemesi 0..1 (telemetri ve yörünge çubuğu bununla dolar) */
  O.travel = (t) => clamp01((t - O.T.cruise) / (O.T.arrive - O.T.cruise));
  /** Kalkışta roketin rampadan yüksekliği (px) */
  O.rise = (t) => (t < O.T.rise ? 0 : 46 * Math.pow(t - O.T.rise, 2));

  /* ---------------- Çizim yardımcıları ---------------- */
  function rect(g, c, x, y, w, h) {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  /** Piksel disk (yumuşatmasız) */
  function disc(g, c, cx, cy, r) {
    g.fillStyle = c;
    const R = Math.round(r);
    for (let y = -R; y <= R; y++) {
      const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      g.fillRect(Math.round(cx) - w, Math.round(cy) + y, w * 2, 1);
    }
  }
  function mix(a, b, k) {
    return S.Art ? S.Art.mix(a, b, clamp01(k)) : a;
  }

  let shipCv = null;
  /** Mekiğin görüntüsü (oyundaki iniş aracıyla aynı çizim; ayaklar katlı, hasarsız) */
  function shipImage() {
    if (typeof document === 'undefined' || !S.Lander) return null;
    if (!shipCv) {
      shipCv = document.createElement('canvas');
      shipCv.width = S.Lander.SHIP.W;
      shipCv.height = S.Lander.SHIP.H;
    }
    const geo = S.Lander.drawShip(shipCv.getContext('2d'), { deploy: 0, compress: 0, lights: 1, hatch: 0, dark: 0, time: 0, damage: 0, heat: 0, sink: 0 });
    O.shipFeetY = geo.feetY;
    return shipCv;
  }

  /* ---------------- 1) Kalkış ---------------- */
  function drawLiftoff(g, t) {
    const W = O.W;
    const H = O.H;
    const rise = O.rise(t);
    const cam = Math.max(0, rise - 150) * 0.55; // kamera yukarı izler: dünya aşağı kayar
    const space = clamp01(cam / 260);
    // Gökyüzü: şafak mavisi → uzay
    for (let y = 0; y < H; y += 4) {
      const k = y / H;
      const day = mix('#3d5a8c', '#e8b48a', k * k);
      rect(g, mix(day, '#070a16', space * (1.1 - k * 0.5)), 0, y, W, 4);
    }
    for (let i = 0; i < 40; i++) {
      g.globalAlpha = space * (0.4 + hsh(i) * 0.6);
      rect(g, '#ffffff', hsh(i + 3) * W, hsh(i + 7) * H * 0.8, 1, 1);
    }
    g.globalAlpha = 1;
    // Bulutlar
    for (let i = 0; i < 6; i++) {
      const cx = ((hsh(i + 20) * W + t * 6) % (W + 120)) - 60;
      const cy = 60 + hsh(i + 30) * 120 + cam * 0.4;
      g.globalAlpha = 0.5 * (1 - space);
      rect(g, '#f2e2d6', cx, cy, 50 + hsh(i) * 40, 4);
      rect(g, '#f2e2d6', cx + 10, cy - 3, 26, 3);
      g.globalAlpha = 1;
    }
    const gy = 318 + cam; // zemin
    // Uzak tepeler
    for (let x = 0; x < W; x += 4) {
      const h = 18 + Math.sin(x * 0.013) * 10 + Math.sin(x * 0.041 + 1) * 5;
      rect(g, mix('#4a5878', '#070a16', space), x, gy - h, 4, h);
    }
    rect(g, '#3e4a3c', 0, gy, W, H - gy + 4);
    rect(g, '#59664f', 0, gy, W, 2);
    rect(g, '#8a8f96', 230, gy - 2, 200, 4);
    // Yardımcı bina + çanak anten (sol)
    rect(g, '#9aa0a8', 40, gy - 30, 70, 30);
    rect(g, '#7b818a', 40, gy - 30, 70, 3);
    for (let i = 0; i < 4; i++) rect(g, '#2f3a4a', 48 + i * 15, gy - 22, 8, 5);
    rect(g, '#7b818a', 120, gy - 26, 3, 26);
    disc(g, '#c9ccd2', 121, gy - 34, 9);
    disc(g, '#9aa0a8', 123, gy - 34, 6);
    // Fırlatma kulesi (turuncu kafes)
    const tx = 262;
    const th = 286;
    const OR = '#c8541f';
    const OR2 = '#8a3412';
    rect(g, OR2, tx, gy - th, 3, th);
    rect(g, OR2, tx + 22, gy - th, 3, th);
    for (let y = gy - th; y < gy; y += 14) {
      rect(g, OR, tx, y, 25, 2);
      for (let i = 0; i < 14; i++) rect(g, OR, tx + Math.round((i * 22) / 14), y + i, 3, 1);
    }
    rect(g, '#d9d4cc', tx + 10, gy - th - 18, 1, 18);
    rect(g, '#ff4a3c', tx + 10, gy - th - 19, 1, 1);
    // Servis kolları: ateşlemede geri çekilir
    const arm = clamp01((t - 0.3) / 0.7);
    for (const ay of [gy - 250, gy - 170, gy - 90]) rect(g, OR, tx + 25, ay, 30 * (1 - arm) + 4, 3);

    const rx = 320;
    const base = gy - 4 - rise;
    // Duman bulutu (ateşlemeden sonra büyür, rokete eşlik etmez)
    const smoke = clamp01(t / 1.6);
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1;
      const spread = (20 + hsh(i) * 120) * smoke + (t > O.T.rise ? (t - O.T.rise) * 16 : 0);
      const cx = rx + side * spread * (0.4 + hsh(i + 9) * 0.6);
      const cy = gy - 6 - hsh(i + 5) * 26 * smoke;
      const r = (8 + hsh(i + 2) * 16) * smoke;
      disc(g, i % 3 ? '#e9e4de' : '#cfc8c0', cx, cy, r);
    }
    // Alev
    if (t > 0.4) {
      const fl = 26 + Math.sin(t * 45) * 4 + clamp01(t - 0.4) * 30;
      for (let i = 0; i < fl; i++) {
        const w = Math.max(2, Math.round(16 * (1 - (i / fl) * 0.7)));
        rect(g, i < 6 ? '#fff6c8' : i < fl * 0.5 ? '#ffc233' : '#ff7a2a', rx - w / 2, base + i, w, 1);
      }
    }
    // Ana kademe (beyaz silindir, siyah bantlar, kanatçıklar)
    const bw = 34;
    const bh = 150;
    const by = base - bh;
    rect(g, '#cfcac2', rx - bw / 2, by, bw, bh);
    rect(g, '#efece6', rx - bw / 2 + 3, by, bw - 12, bh);
    rect(g, '#9d978e', rx + bw / 2 - 4, by, 4, bh);
    for (const yy of [by + 20, by + 70, by + 128]) rect(g, '#26272d', rx - bw / 2, yy, bw, 6);
    rect(g, '#e8692a', rx - bw / 2, by + 100, bw, 3);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 16; i++) rect(g, '#3b3d45', rx + s * (bw / 2 + Math.round(i * 0.6)) - (s < 0 ? 2 : 0), base - 18 + i, 2, 1);
    }
    rect(g, '#3b3d45', rx - 10, base, 20, 4);
    // Ara kademe + mekik (oyun içi iniş aracı, yarı ölçek)
    rect(g, '#5c5e66', rx - 20, by - 4, 40, 5);
    const img = shipImage();
    if (img) {
      const sc = 0.5;
      const L = S.Lander.SHIP;
      const top = by - 2 - O.shipFeetY * sc;
      g.drawImage(img, Math.round(rx - L.CX * sc), Math.round(top), Math.round(L.W * sc), Math.round(L.H * sc));
    }
  }

  /* ---------------- 2) Yolculuk + 3) varış ---------------- */
  const EARTH = { x: 112, y: 218, r: 40 };
  const MARS = { x: 534, y: 132, r: 46 };
  const CTRL = { x: 320, y: 70 };
  function curve(u) {
    const a = (1 - u) * (1 - u);
    const b = 2 * (1 - u) * u;
    const c = u * u;
    return {
      x: a * (EARTH.x + EARTH.r + 6) + b * CTRL.x + c * (MARS.x - MARS.r - 8),
      y: a * (EARTH.y - 10) + b * CTRL.y + c * MARS.y
    };
  }

  function planet(g, p, base, dark, spots, cap, t) {
    disc(g, base, p.x, p.y, p.r);
    for (let i = 0; i < spots.n; i++) {
      const a = hsh(i + spots.seed) * Math.PI * 2;
      const d = Math.sqrt(hsh(i + spots.seed + 50)) * p.r * 0.75;
      disc(g, spots.cols[i % spots.cols.length], p.x + Math.cos(a) * d + ((t * spots.spin) % 6), p.y + Math.sin(a) * d * 0.8, p.r * (0.12 + hsh(i + 7) * 0.16));
    }
    if (cap) disc(g, cap, p.x - 2, p.y - p.r + 5, p.r * 0.3);
    // Gece tarafı (sağ alt) gölgesi
    g.globalAlpha = 0.45;
    g.fillStyle = dark;
    const R = Math.round(p.r);
    for (let y = -R; y <= R; y++) {
      const w = Math.round(Math.sqrt(Math.max(0, p.r * p.r - y * y)));
      const cut = Math.round(w * 0.25 - y * 0.25);
      if (w - cut > 0) g.fillRect(Math.round(p.x) + cut, Math.round(p.y) + y, w - cut, 1);
    }
    g.globalAlpha = 1;
    // Atmosfer halesi
    g.globalAlpha = 0.25;
    g.strokeStyle = base;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
  }

  function drawCruise(g, t, skyTo) {
    const W = O.W;
    const H = O.H;
    const u = ease(O.travel(t));
    const arr = clamp01((t - O.T.arrive) / (O.T.end - O.T.arrive));
    rect(g, '#05070f', 0, 0, W, H);
    for (let i = 0; i < 140; i++) {
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + hsh(i) * 3) + i);
      g.globalAlpha = 0.35 + tw * 0.55 * hsh(i + 1);
      const x = (hsh(i + 11) * W - t * (2 + hsh(i) * 6) + W) % W;
      rect(g, hsh(i + 2) > 0.85 ? '#ffd9a8' : '#ffffff', x, hsh(i + 17) * H, hsh(i + 4) > 0.9 ? 2 : 1, 1);
    }
    g.globalAlpha = 0.08;
    for (let i = 0; i < 30; i++) disc(g, '#8f6fd0', 380 + i * 9 - ((t * 3) % 9), 300 - i * 4 + Math.sin(i) * 10, 18);
    g.globalAlpha = 1;

    planet(g, EARTH, '#2f7bd8', '#04122c', { n: 9, seed: 3, spin: 2, cols: ['#3f9a4a', '#6f8f3a', '#9a7a4a'] }, '#e9f2ff', t);
    // Varışta Mars büyüyüp ekranı doldurur
    const mz = ease(arr);
    const mars = { x: MARS.x + (W / 2 - MARS.x) * mz, y: MARS.y + (H * 1.4 - MARS.y) * mz, r: MARS.r + mz * 520 };
    // Yörünge: kesikli eğri, geçilen kısım parlak
    for (let i = 0; i <= 60; i++) {
      const f = i / 60;
      if (Math.floor(i + t * 6) % 2) continue;
      const p = curve(f);
      rect(g, f <= u ? '#9fe6ff' : '#5a6478', p.x, p.y, 2, 2);
    }
    planet(g, mars, '#c4532a', '#2a0c06', { n: 10, seed: 41, spin: 0, cols: ['#8e3a1f', '#a8462a', '#d77a48'] }, '#f1e6de', 0);

    // Mekik: yörünge teğeti boyunca, burnu ileride; arkasında motor ışıması
    const img = shipImage();
    if (img && arr < 0.7) {
      const p = curve(u);
      const q = curve(Math.min(1, u + 0.01));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const sc = 0.2 * (1 - arr * 0.8);
      const L = S.Lander.SHIP;
      g.save();
      g.translate(Math.round(p.x), Math.round(p.y));
      g.rotate(ang + Math.PI / 2);
      // Görüntü, gövde altı yerel y = 0'a gelecek şekilde konur; nozullar ~24 px (ölçekli) aşağıda biter
      const glow = 10 + Math.sin(t * 30) * 2;
      const gy0 = Math.round(26 * sc);
      for (let i = 0; i < glow; i++) {
        g.fillStyle = i < 3 ? '#ffffff' : i < glow / 2 ? '#9fe6ff' : '#3f7fd8';
        const w = Math.max(1, Math.round(8 * (1 - i / glow)));
        g.fillRect(-Math.floor(w / 2), gy0 + i, w, 1);
      }
      g.drawImage(img, Math.round(-L.CX * sc), Math.round(-L.BB * sc), Math.round(L.W * sc), Math.round(L.H * sc));
      g.restore();
    }
    // Varış: Mars gökyüzü rengine aç (oyun dünyasının ilk karesine yumuşak geçiş)
    if (arr > 0.45) {
      g.globalAlpha = clamp01((arr - 0.45) / 0.55);
      rect(g, skyTo || '#c98a64', 0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  /** Açılış karesini 640×360 tuvale çizer. opts.skyTo: varışta açılınacak Mars gökyüzü rengi */
  O.draw = function (g, t, opts = {}) {
    g.imageSmoothingEnabled = false;
    if (t < O.T.cruise) {
      drawLiftoff(g, t);
      // Kalkıştan yolculuğa kısa kararma geçişi
      const k = clamp01((t - (O.T.cruise - 0.5)) / 0.5);
      if (k > 0) {
        g.globalAlpha = k;
        rect(g, '#05070f', 0, 0, O.W, O.H);
        g.globalAlpha = 1;
      }
    } else drawCruise(g, t, opts.skyTo);
  };

  S.Opening = O;
})((window.SOL14 = window.SOL14 || {}));
