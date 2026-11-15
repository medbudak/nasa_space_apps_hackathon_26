/**
 * SOL 14: RED HORIZON — Açılış iniş sahnesi: mekik üssün iniş alanına sert iner (K4, D-012)
 *  0–2.5 sn  alçalma ve frenleme: 3 nozulda alev + basınç dalgası, hafif yalpalama, ayaklar açılıp kilitlenir
 *  2.5–3.3   toz bulutu ve SERT temas: taş/kıvılcım saçılır, güçlü sarsıntı
 *  3.3–4.2   gövde ~10 px toprağa gömülür, sol ön ayak bükülür ve mekik sola yatar (hasar: yırtık panel,
 *            kopuk sağ çanak anten, çatlak pencere, ezik + çatlak, sol yan bölmeden duman)
 *  4.0–5.5   motor kapatma: alevler söner, beyaz buhar, nozullar kızıl soğur; ışıklar yanar
 *  5.5+      kapak açılır, merdiven yere uzanır; astronot merdivenden iner, sonra kontrol oyuncuya geçer
 * Mantık (zaman çizelgesi) DOM'suzdur ve testlerde çalışır; çizim yalnızca draw* fonksiyonlarındadır.
 * Prosedürel piksel çizim (referans: docs/design/references/lander-reference.png). Boy ≈ 290 px ≈ astronotun ~5 katı
 * (640×360 tasarım alanına sığsın diye). Gövde ekran dışı bir tuvale çizilir, sonra satır bantlarıyla
 * kaydırılarak (shear) eğilir ve zemin çizgisinde kırpılır: pikseller keskin kalır, gömülen kısım görünmez.
 */
(function (S) {
  'use strict';
  const L = { active: false, t: 0, particles: [], touched: false, cut: false };

  // 3.3 → 6.4: toz bulutu yatışır (temas tozunun ömrü ≤ 3 sn), sonra kapak açılır
  L.T = { touchStart: 2.5, touch: 3.3, shutdown: 4.0, lightsOn: 4.6, hatch: 6.4, walkStart: 6.9, climbEnd: 8.5, end: 9.6 };
  const START_ALT = 340;
  const LEG_FOLDED = 44;
  const LEG_RANGE = 22; // fully open legs: skirt bottom 66 px above the footpads (as in the reference)
  const SINK = 10; // toprağa gömülme (px)
  const TILT = -0.07; // ≈ 4° sola yatma (satır başına kayma)
  const SILL = 25; // hatch sill above the skirt bottom
  // the three bells under the skirt (h: exit below the skirt bottom, r0/r1: half width at top/exit)
  const NOZZLES = [
    { x: -25, h: 26, r0: 5, r1: 10 },
    { x: 0, h: 32, r0: 8, r1: 14 },
    { x: 25, h: 26, r0: 5, r1: 10 }
  ];
  // Ekran dışı tuval: CX gövde merkezi, BB gövde alt satırı (etek altı)
  const OFF_W = 220;
  const OFF_H = 300;
  const CX = 110;
  const BB = 230;
  const FINAL_T = 1e3;
  const STEAM_LIFE = 2.2;
  const HOLD = 0.35; // sahne sonundaki duruş (sn)
  /** Ekran dışı çizim alanının ölçüleri (açılış sahnesi aynı mekiği çizmek için kullanır) */
  L.SHIP = {
    W: OFF_W,
    H: OFF_H,
    CX,
    BB,
    FEET: BB + LEG_FOLDED + LEG_RANGE, // footpad bottom with the legs fully open
    BASE: BB + NOZZLES[1].h, // bottom of the centre bell
    NOZ: NOZZLES.map((n) => ({ x: CX + n.x, y: BB + n.h, w: n.r1 * 2 - 4 }))
  };
  const DEFAULT_PAL = { ground: '#a24a2c', groundDark: '#7c3520', groundLight: '#c26a42', rock: '#5a261a' };

  const easeOut = (f) => 1 - (1 - f) * (1 - f);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const hsh = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  L.padPx = () => S.Surface.mToPx(S.DATA.terrain.map.landingPadM);
  /** Astronotun yürüyüp durduğu nokta (Sim.land: landingPadM + landingExitM) */
  L.exitPx = () => S.Surface.mToPx(S.DATA.terrain.map.landingPadM + S.DATA.terrain.map.landingExitM);

  L.start = function () {
    L.active = true;
    L.t = 0;
    L.particles = [];
    L.touched = false;
    L.cut = false;
  };

  /** Space / Esc: doğrudan son kareye — gömülü mekik, açık kapak, astronot yüzeyde */
  L.skip = function () {
    if (!L.active) return;
    L.t = L.T.end;
    L.particles = [];
    L.touched = true;
    L.cut = true;
    L.active = false;
  };

  L.done = () => !L.active;

  L.phase = function (t = L.t) {
    if (t < L.T.touchStart) return 'descent';
    if (t < L.T.shutdown) return 'touchdown';
    if (t < L.T.hatch) return 'shutdown';
    if (t < L.T.end) return 'disembark';
    return 'done';
  };

  /** Ayak tabanlarının yerden yüksekliği (px) */
  L.altitude = function (t = L.t) {
    if (t >= L.T.touch) return 0;
    if (t < L.T.touchStart) return Math.round(START_ALT - (START_ALT - 40) * easeOut(t / L.T.touchStart));
    const f = (t - L.T.touchStart) / (L.T.touch - L.T.touchStart);
    return Math.round(40 * (1 - f) * (1 - f * 0.4));
  };
  /** Ayak açılımı 0 (yarı katlı) → 1 (kilitli) */
  L.legDeploy = (t = L.t) => clamp01((t - 1.6) / 0.8);
  /** Temas sonrası süspansiyon sıkışması (px) */
  L.compress = function (t = L.t) {
    if (t < L.T.touch) return 0;
    const k = t - L.T.touch;
    return Math.max(0, Math.round(4 * Math.exp(-k * 4) * Math.cos(k * 14) + 0.4));
  };
  L.thrust = function (t = L.t) {
    if (t >= L.T.shutdown) return 0;
    if (t > L.T.touch) return 0.35 * (1 - (t - L.T.touch) / (L.T.shutdown - L.T.touch));
    return 1;
  };
  L.hatchOpen = (t = L.t) => clamp01((t - L.T.hatch) / 0.45);
  /** Toprağa gömülme (px) */
  L.sink = (t = L.t) => (t < L.T.touch ? 0 : Math.round(SINK * easeOut(clamp01((t - L.T.touch) / 0.8))));
  /** Eğilme (satır başına yatay kayma; negatif = sola). İnişte hafif yalpa, temastan sonra kalıcı yatma */
  L.tilt = function (t = L.t) {
    if (t < L.T.touch) return 0.012 * Math.sin(t * 4.2) * (1 - t / L.T.touch);
    return TILT * easeOut(clamp01((t - L.T.touch) / 0.9));
  };
  L.damage = (t = L.t) => (t >= L.T.touch ? 1 : 0);
  /** Nozul ısısı: yanarken 1, kapandıktan sonra 3 sn'de soğur */
  L.heat = (t = L.t) => (L.thrust(t) > 0 ? 1 : clamp01(1 - (t - L.T.shutdown) / 3));
  /** Gövde altının ayak tabanına uzaklığı (px) */
  L.legDrop = (t = L.t) => LEG_FOLDED + Math.round(LEG_RANGE * L.legDeploy(t)) - L.compress(t);

  /** Astronotun konumu: null = henüz içeride; { px, y } yüzey px + yerden yükseklik */
  L.astronaut = function (t = L.t) {
    if (t < L.T.walkStart) return null;
    const pad = L.padPx();
    const sink = L.sink(t);
    const tilt = L.tilt(t);
    const at = (h) => pad + Math.round((h + sink + 28) * tilt); // merdivenin o yükseklikteki x'i
    if (t < L.T.climbEnd) {
      // Kapak eşiğinden merdivenle basamak basamak (5 px) iner
      const sill = L.legDrop(t) - sink + SILL;
      const f = (t - L.T.walkStart) / (L.T.climbEnd - L.T.walkStart);
      const h = Math.max(0, Math.round((sill * (1 - f)) / 5) * 5);
      return { px: at(h), y: h, walking: false, climbing: true };
    }
    // Yürüyüş sahne bitmeden biter; son karelerde astronot çıkış noktasında durur → oyuna geçişte poz/konum sıçraması yok
    const f = clamp01((t - L.T.climbEnd) / (L.T.end - HOLD - L.T.climbEnd));
    const x0 = at(0);
    return { px: x0 + (L.exitPx() - x0) * f, y: 0, walking: f < 1 };
  };

  L.update = function (dt) {
    if (!L.active) return;
    const prev = L.t;
    L.t += dt;
    const t = L.t;
    if (!L.touched && t >= L.T.touch) {
      L.touched = true;
      S.bus.emit('audio:play', 'land');
      if (S.FX) S.FX.shake = 1.1;
      impactBurst();
    }
    if (prev < L.T.hatch && t >= L.T.hatch) S.bus.emit('audio:play', 'door');
    spawn(dt, t);
    for (const p of L.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'dust') p.vx *= 1 - Math.min(0.9, dt * 1.4);
      if (p.kind === 'steam') p.vx *= 0.98;
      if (p.kind === 'rock' || p.kind === 'spark') {
        p.vy += 140 * dt;
        if (p.y > 0) {
          p.y = 0;
          p.vy = 0;
          p.vx *= 0.4;
        }
      }
    }
    L.particles = L.particles.filter((p) => p.life > 0);
    if (t >= L.T.end) L.active = false;
  };

  function rnd() {
    return Math.random();
  }

  function impactBurst() {
    const pad = L.padPx();
    for (let i = 0; i < 90; i++) {
      const dir = rnd() < 0.5 ? -1 : 1;
      L.particles.push({ kind: 'dust', x: pad + dir * (30 + rnd() * 40), y: -(1 + rnd() * 8), vx: dir * (40 + rnd() * 160), vy: -(rnd() * 30), life: 1.2 + rnd() * 1.8, max: 3, s: rnd() < 0.4 ? 3 : 2 });
    }
    for (let i = 0; i < 22; i++) {
      const dir = rnd() < 0.5 ? -1 : 1;
      L.particles.push({ kind: 'rock', x: pad + dir * (40 + rnd() * 30), y: -2, vx: dir * (30 + rnd() * 90), vy: -(50 + rnd() * 80), life: 1.4 + rnd(), max: 2.4 });
    }
    for (let i = 0; i < 16; i++) {
      L.particles.push({ kind: 'spark', x: pad + (rnd() - 0.5) * 120, y: -(4 + rnd() * 30), vx: (rnd() - 0.5) * 120, vy: -(30 + rnd() * 60), life: 0.4 + rnd() * 0.4, max: 0.8 });
    }
  }

  function spawn(dt, t) {
    const pad = L.padPx();
    const alt = L.altitude(t);
    const th = L.thrust(t);
    const drop = L.legDrop(t);
    const sink = L.sink(t);
    if (th > 0) {
      for (const n of NOZZLES) {
        const exitH = alt - sink + drop - n.h - 1;
        const k = Math.round(34 * th * dt + rnd());
        for (let i = 0; i < k; i++) {
          L.particles.push({ kind: rnd() < 0.15 ? 'spark' : 'fire', x: pad + n.x + (rnd() - 0.5) * n.r1 * 1.4, y: -(exitH - 12), vx: (rnd() - 0.5) * 18, vy: 60 + rnd() * 50, life: 0.18 + rnd() * 0.22, max: 0.4 });
        }
      }
      // Yere yaklaşınca toz bulutu iki yana savrulur
      if (alt < 120) {
        const k = (1 - alt / 120) * th;
        const n = Math.round(130 * k * dt + rnd() * k);
        for (let i = 0; i < n; i++) {
          const dir = rnd() < 0.5 ? -1 : 1;
          L.particles.push({ kind: 'dust', x: pad + dir * (6 + rnd() * 30), y: -(1 + rnd() * 6), vx: dir * (70 + rnd() * 140), vy: -(rnd() * 18), life: 1 + rnd() * 1.6, max: 2.6, s: rnd() < 0.3 ? 3 : 2 });
        }
      }
    } else if (t < Math.min(L.T.hatch + 1.5, L.T.end - STEAM_LIFE)) {
      // Motor soğuma buharı — sahne bitmeden tamamen söner (kontrol devrinde parçacık bir anda kaybolmasın)
      if (rnd() < dt * 18) {
        const n = NOZZLES[Math.floor(rnd() * 3)];
        L.particles.push({ kind: 'steam', x: pad + n.x + (rnd() - 0.5) * 10, y: -(drop - sink - n.h + rnd() * 4), vx: (rnd() - 0.5) * 8, vy: -(6 + rnd() * 8), life: 1.2 + rnd() * (STEAM_LIFE - 1.2), max: STEAM_LIFE });
      }
    }
  }

  /* ---------------- Çizim ---------------- */
  let off = null;
  function offCanvas() {
    if (off) return off;
    if (typeof document === 'undefined') return null;
    off = document.createElement('canvas');
    off.width = OFF_W;
    off.height = OFF_H;
    return off;
  }

  /*
   * The vehicle, drawn to match docs/design/references/lander-reference.png part by part: black egg-shaped
   * nose with an orange ring and blue windows, orange shoulders with a dish and a whip antenna, white
   * riveted hull with a grey and a copper pipe, orange side pods with thrusters, hazard stripes, the small
   * hatch with its status lights and the long ladder, the wide orange skirt, three bells (centre one
   * larger) and four hydraulic legs with round pads (front pair bright, rear pair dark).
   * Shapes are given in the reference image's pixel coordinates and scaled by RK, so the vehicle stands
   * ~290 px tall (5x the 58 px astronaut). Filled row by row (no anti-aliasing) with a dark outline.
   */
  const RK = 0.3;
  const RCX = 472; // centre line in the reference image
  const RBB = 764; // skirt bottom in the reference image = canvas row BB
  const qx = (x) => Math.round((x - RCX) * RK + CX);
  const qy = (y) => Math.round(BB + (y - RBB) * RK);
  const mir = (p) => p.map(([x, y]) => [2 * RCX - x, y]);
  const same = (p) => p;
  const quad = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  /** Scanline polygon fill in canvas pixels; pts in reference coordinates */
  function pfill(c, col, pts, ox = 0, oy = 0) {
    const P = pts.map(([x, y]) => [(x - RCX) * RK + CX + ox, BB + (y - RBB) * RK + oy]);
    let y0 = Infinity;
    let y1 = -Infinity;
    for (const p of P) {
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
    c.fillStyle = col;
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + 0.5;
      const xs = [];
      for (let i = 0; i < P.length; i++) {
        const [ax, ay] = P[i];
        const [bx, by] = P[(i + 1) % P.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) * (bx - ax)) / (by - ay));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.round(xs[i]);
        const b = Math.round(xs[i + 1]);
        if (b > a) c.fillRect(a, y, b - a, 1);
      }
    }
  }
  function box(c, col, x0, y0, x1, y1) {
    const X = qx(x0);
    const Y = qy(y0);
    c.fillStyle = col;
    c.fillRect(X, Y, Math.max(1, qx(x1) - X), Math.max(1, qy(y1) - Y));
  }
  /** Thick bar between two points (w in reference px) */
  function bar(x0, y0, x1, y1, w) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / len) * (w / 2);
    const ny = ((x1 - x0) / len) * (w / 2);
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  }
  function ellipse(cx, cy, rx, ry, rot) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  }
  function hazardBox(c, x0, y0, x1, y1, a, b) {
    const X0 = qx(x0);
    const Y0 = qy(y0);
    const X1 = Math.max(X0 + 1, qx(x1));
    const Y1 = Math.max(Y0 + 1, qy(y1));
    for (let y = Y0; y < Y1; y++) {
      for (let x = X0; x < X1; x++) {
        c.fillStyle = ((x + y) >> 1) & 1 ? a : b;
        c.fillRect(x, y, 1, 1);
      }
    }
  }
  /** Kalın çizgi (tuval koordinatı) */
  function line(c, col, x1, y1, x2, y2, w) {
    c.fillStyle = col;
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    const o = Math.floor(w / 2);
    for (let i = 0; i <= n; i++) {
      const f = n ? i / n : 0;
      c.fillRect(Math.round(x1 + (x2 - x1) * f) - o, Math.round(y1 + (y2 - y1) * f) - o, w, w);
    }
  }

  /**
   * Mekiği ekran dışı tuvale çizer (eğilmemiş, yerden bağımsız).
   * o: { deploy, compress, lights, hatch, dark, time, damage, heat, sink, ladder? }. ladder: 'full' reaches the
   * ground whatever the hatch does, 'none' hides it; otherwise it slides down as the hatch opens.
   * Dönüş: ayak tabanının tuval y'si ve ön/arka ayak tabanlarının merkezden uzaklığı.
   */
  L.drawShip = function (c, o) {
    c.clearRect(0, 0, OFF_W, OFF_H);
    const dk = o.dark || 0;
    const sh = (col, k = 0.55) => (dk > 0 && S.Art ? S.Art.mix(col, '#0b0c14', dk * k) : col);
    const K = {
      W1: sh('#efece6', 0.6), W2: sh('#d2cdc4', 0.6), W3: sh('#a39d94', 0.6), W4: sh('#7a756d', 0.6), WS: sh('#bdb8af', 0.6),
      OR: sh('#e8692a'), ORL: sh('#f08a4a'), OR2: sh('#b84a18'), OR3: sh('#7a3010'),
      BK: '#2a2b31', BK2: '#3d3f48', BK3: '#17181c', BKL: '#4e505a',
      MET: sh('#8d8f96'), METL: sh('#c4c6cc'), MET2: sh('#5c5e66'), LEG: sh('#a5a7ae'), LEGL: sh('#cfd1d6'), LEGD: sh('#4a4c54'),
      PAD: sh('#6a6c74'), CU: sh('#b5622a'), CUL: sh('#e08a4a'), YEL: sh('#f2c230'),
      DOOR: sh('#b8b196', 0.6), DOOR2: sh('#8c866f', 0.6), SEAM: sh('#6a644e', 0.6), GLASS: sh('#3aa8e8', 0.3), OUT: '#1b1622'
    };
    const pout = (col, pts) => {
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pfill(c, K.OUT, pts, ox, oy);
      pfill(c, col, pts);
    };
    const time = o.time || 0;
    const blink = Math.floor(time * 3) % 2 === 0;
    const dmg = o.damage || 0;
    const lights = o.lights || 0;
    const drop = LEG_FOLDED + Math.round(LEG_RANGE * (o.deploy || 0)) - (o.compress || 0);
    const FY = BB + drop; // ayak tabanı (tuval y)
    const fy = RBB + drop / RK; // the same in reference coordinates

    // --- rear legs (dark, behind the hull) ---
    for (const m of [same, mir]) {
      const ky = fy - 55;
      pout(K.LEGD, m(bar(392, 760, 322, ky, 18)));
      const mx = (392 + 322) / 2;
      const my = (760 + ky) / 2;
      pout(K.OR3, m(bar(mx + 8, my - 20, mx - 8, my + 20, 26)));
      pout('#3b3d45', m(quad(282, fy - 59, 360, fy - 39)));
      pfill(c, K.OR2, m(quad(286, fy - 59, 356, fy - 55)));
    }
    // --- engine bay and the three bells (centre one larger), glowing while hot ---
    pout(K.BK2, quad(338, 752, 606, 796));
    const bells = [
      [[372, 794], [408, 794], [425, 850], [355, 850]],
      [[446, 794], [498, 794], [520, 872], [424, 872]],
      [[536, 794], [572, 794], [589, 850], [519, 850]]
    ];
    for (const b of bells) {
      pout(K.BK, b);
      pfill(c, K.BKL, [b[0], [b[0][0] + 8, b[0][1]], [b[3][0] + 12, b[3][1]], b[3]]);
      pfill(c, K.BK3, [[b[1][0] - 8, b[1][1]], b[1], b[2], [b[2][0] - 12, b[2][1]]]);
      pfill(c, K.MET2, quad(b[3][0], b[3][1] - 8, b[2][0], b[2][1]));
      if (o.heat > 0) {
        c.globalAlpha = o.heat * 0.7;
        const yMid = (b[0][1] + b[3][1]) / 2;
        const f = 0.5;
        pfill(c, '#ff5a1a', [[b[0][0] + (b[3][0] - b[0][0]) * f + 6, yMid], [b[1][0] + (b[2][0] - b[1][0]) * f - 6, yMid], [b[2][0] - 6, b[2][1] - 8], [b[3][0] + 6, b[3][1] - 8]]);
        c.globalAlpha = 1;
      }
    }
    // --- ladder from the hatch sill down to the ground ---
    const sillY = BB - SILL + 1;
    const groundY = FY - (o.sink || 0);
    const full = groundY - sillY;
    const lad = o.ladder === 'full' ? full : o.ladder === 'none' ? 0 : Math.round(8 + (full - 8) * clamp01(o.hatch || 0));
    if (lad > 0) {
      c.fillStyle = K.MET2;
      c.fillRect(qx(461), sillY, 2, lad);
      c.fillRect(qx(489), sillY, 2, lad);
      c.fillStyle = K.W3;
      for (let y = sillY + 3; y < sillY + lad; y += 5) c.fillRect(qx(461), y, qx(496) - qx(461), 1);
    }
    // --- skirt: wide orange band, darker lower edge, leg mounts, hazard stripes ---
    pout(K.OR, [[296, 678], [648, 678], [656, 742], [640, 764], [304, 764], [288, 742]]);
    pfill(c, K.OR2, [[288, 742], [656, 742], [640, 764], [304, 764]]);
    pfill(c, K.ORL, quad(300, 682, 330, 738));
    hazardBox(c, 384, 686, 560, 698, K.BK, K.YEL);
    for (let x = 392; x < 560; x += 28) box(c, K.OR2, x, 708, x + 6, 736);
    for (const m of [same, mir]) {
      pout(K.MET, m(quad(298, 696, 362, 748)));
      pfill(c, K.METL, m(quad(302, 700, 312, 744)));
      pfill(c, K.MET2, m(quad(350, 700, 362, 748)));
    }
    // soot from the entry burn on the skirt
    c.globalAlpha = 0.16;
    for (let x = 296; x < 648; x += 7) {
      const h = 4 + Math.floor(hsh(x) * (dmg ? 24 : 14));
      pfill(c, '#2a1a12', quad(x, 764 - h, x + 7, 764));
    }
    c.globalAlpha = 1;
    // --- front legs (bright): upper strut, orange collar, piston, round pad; the left one buckles on impact ---
    for (const [m, lit] of [[same, true], [mir, false]]) {
      const G = lit ? K.LEG : K.MET;
      pout(G, m(bar(352, 722, 256, 830, 34)));
      pfill(c, lit ? K.LEGL : K.LEG, m(bar(346, 712, 250, 820, 8)));
      pout(lit ? K.OR : K.OR2, m(bar(282, 800, 246, 842, 46)));
      pfill(c, K.OR3, m(bar(272, 812, 256, 832, 10)));
      if (dmg && lit) {
        pout(K.MET2, bar(254, 836, 236, 880, 22));
        pout(K.MET2, bar(236, 880, 220, fy - 30, 22));
        pfill(c, G, bar(232, 880, 216, fy - 34, 8));
      } else {
        pout(K.MET2, m(bar(254, 836, 226, fy - 26, 22)));
        pfill(c, G, m(bar(250, 836, 222, fy - 30, 8)));
      }
      pout(lit ? K.OR : K.OR2, m([[176, fy - 30], [260, fy - 30], [270, fy - 14], [166, fy - 14]]));
      pout(K.PAD, m(quad(164, fy - 14, 272, fy)));
    }

    // --- hull: white body, grey side panels (lit from the left) ---
    pout(K.W2, [[430, 288], [514, 288], [514, 334], [644, 334], [650, 680], [294, 680], [300, 334], [430, 334]]);
    pfill(c, K.W1, [[440, 296], [506, 296], [506, 342], [600, 342], [604, 672], [330, 672], [326, 342], [440, 342]]);
    pfill(c, K.WS, quad(300, 334, 326, 680));
    pfill(c, K.W3, quad(612, 334, 650, 680));
    pfill(c, K.W4, quad(640, 334, 650, 680));
    for (const y of [454, 470, 560]) box(c, K.W3, 326, y, 612, y + 3);
    for (const x of [424, 520]) box(c, K.W3, x, 342, x + 3, 454);
    for (const y of [352, 420, 500, 540, 640]) {
      box(c, K.W4, 336, y, 340, y + 4);
      box(c, K.W4, 600, y, 604, y + 4);
    }
    // the square access panel and the small vent
    pout(K.W2, quad(440, 362, 510, 446));
    pfill(c, K.W1, quad(446, 368, 502, 438));
    pfill(c, K.W3, quad(446, 432, 504, 440));
    for (let i = 0; i < 3; i++) box(c, K.BK2, 466 + i * 9, 484, 471 + i * 9, 498);
    // hazard stripes across the hull
    hazardBox(c, 396, 568, 560, 584, K.BK, K.OR);
    hazardBox(c, 326, 584, 384, 596, K.BK, K.YEL);
    hazardBox(c, 560, 584, 612, 596, K.BK, K.YEL);
    // orange side pods with vent slots, and the side thrusters
    for (const [m, lit] of [[same, true], [mir, false]]) {
      pout(lit ? K.OR : K.OR2, m(quad(318, 488, 364, 604)));
      pfill(c, lit ? K.ORL : K.OR, m(quad(322, 492, 330, 600)));
      pfill(c, K.OR3, m(quad(334, 506, 350, 586)));
      for (let y = 512; y < 584; y += 12) pfill(c, lit ? K.OR : K.OR2, m(quad(334, y, 350, y + 4)));
      for (const ty of [532, 584]) {
        pout(K.MET, m(quad(292, ty, 318, ty + 18)));
        pout(K.BK, m(quad(282, ty + 2, 292, ty + 16)));
      }
    }
    // pipes: grey on the left, copper on the right
    box(c, K.MET, 384, 352, 398, 632);
    box(c, K.METL, 384, 352, 388, 632);
    box(c, K.MET, 364, 348, 398, 360);
    box(c, K.MET, 384, 620, 436, 634);
    for (const y of [420, 520]) box(c, K.MET2, 380, y, 402, y + 5);
    box(c, K.CU, 546, 346, 560, 684);
    box(c, K.CUL, 546, 346, 550, 684);
    box(c, K.CU, 532, 344, 560, 356);
    for (const y of [430, 610]) box(c, K.OR3, 542, y, 564, y + 5);
    // grille with LEDs, lower right
    pout(K.W3, quad(564, 624, 598, 668));
    for (let i = 0; i < 4; i++) box(c, K.BK2, 568, 630 + i * 8, 594, 634 + i * 8);
    box(c, lights > 0 && blink ? '#3fe08a' : '#1a5e3c', 568, 660, 576, 666);
    box(c, lights > 0 ? '#ff5a3c' : '#6a2418', 582, 660, 590, 666);
    // --- the hatch: two leaves slide apart; warm light inside once the lights are on ---
    pout(K.MET2, quad(448, 612, 508, 684));
    pfill(c, '#121318', quad(454, 618, 502, 682));
    const hatch = clamp01(o.hatch || 0);
    if (hatch > 0 && lights > 0) {
      for (let i = 0; i < 4; i++) {
        c.globalAlpha = (0.42 - i * 0.09) * lights;
        pfill(c, '#ffe6a8', quad(456, 620 + i * 16, 500, 636 + i * 16));
      }
      c.globalAlpha = 1;
    }
    const dw = 24 * (1 - hatch);
    if (dw > 0.5) {
      pfill(c, K.DOOR, quad(454, 618, 454 + dw, 682));
      pfill(c, K.DOOR, quad(502 - dw, 618, 502, 682));
      pfill(c, K.DOOR2, quad(496, 618, 502, 682));
      if (hatch === 0) box(c, K.SEAM, 476, 624, 480, 678);
    }
    box(c, lights > 0 && blink ? '#3fe08a' : '#1a5e3c', 460, 598, 472, 608);
    box(c, lights > 0 ? '#ffc233' : '#6a5418', 484, 598, 496, 608);

    // --- shoulders: orange, sloping out, with vents ---
    for (const [m, lit] of [[same, true], [mir, false]]) {
      pout(lit ? K.OR : K.OR2, m([[366, 256], [432, 256], [432, 336], [298, 336]]));
      pfill(c, lit ? K.ORL : K.OR, m([[366, 256], [376, 256], [310, 330], [300, 330]]));
      pfill(c, K.OR3, m(quad(364, 286, 386, 316)));
      for (let y = 290; y < 314; y += 7) pfill(c, lit ? K.OR2 : K.OR, m(quad(366, y, 384, y + 3)));
    }
    // --- black band with the blue windows and the dark front panel ---
    pout(K.BK, [[360, 216], [584, 216], [590, 262], [514, 262], [514, 296], [430, 296], [430, 262], [354, 262]]);
    pfill(c, K.BK2, quad(362, 220, 382, 258));
    [[358, 382], [446, 498], [562, 586]].forEach(([x0, x1], i) => {
      const cracked = dmg && i === 0;
      pout(cracked ? '#2d6f99' : K.GLASS, quad(x0, 230, x1, 254));
      pfill(c, lights > 0 && !cracked ? '#dff8ff' : '#bff0ff', quad(x0 + 3, 233, x0 + 9, 238));
      pfill(c, '#2d6f99', quad(x0, 248, x1, 254));
      if (cracked) {
        c.fillStyle = '#e9f4ff';
        for (const [px, py] of [[1, 3], [2, 2], [3, 1], [4, 2], [5, 3]]) c.fillRect(qx(x0) + px, qy(230) + py, 1, 1);
      }
    });
    pout(K.BK2, quad(450, 260, 496, 294));
    box(c, lights > 0 && blink ? '#3fe08a' : '#1a5e3c', 482, 266, 488, 272);
    box(c, lights > 0 ? '#ffc233' : '#6a5418', 482, 278, 488, 284);
    for (let i = 0; i < 3; i++) box(c, K.BK3, 456, 268 + i * 8, 476, 270 + i * 8);
    // orange ring under the nose
    pout(K.OR, quad(360, 210, 584, 218));
    // --- nose cone: black, egg-shaped, vertical panel seams, a soft highlight on the left ---
    const nTop = 28;
    const nBot = 210;
    const prof = (y) => 110 * Math.pow(Math.max(0, 1 - Math.pow((nBot - y) / (nBot - nTop), 1.8)), 1 / 1.8);
    const nose = [];
    for (let y = nTop; y <= nBot; y += 6) nose.push([RCX - prof(y), y]);
    for (let y = nBot; y >= nTop; y -= 6) nose.push([RCX + prof(y), y]);
    pout(K.BK, nose);
    for (let Y = qy(nTop) + 1; Y < qy(nBot); Y++) {
      const y = (Y - BB) / RK + RBB;
      const hw = prof(y) * RK;
      c.fillStyle = K.BK2;
      c.fillRect(Math.round(CX - hw * 0.86), Y, Math.max(1, Math.round(hw * 0.36)), 1);
      if (y < 150) {
        c.fillStyle = K.BKL;
        c.fillRect(Math.round(CX - hw * 0.72), Y, Math.max(1, Math.round(hw * 0.12)), 1);
      }
      c.fillStyle = K.BK3;
      c.fillRect(Math.round(CX + hw * 0.62), Y, Math.max(1, Math.round(hw * 0.38)), 1);
      for (const f of [-0.42, 0, 0.42]) c.fillRect(Math.round(CX + hw * f), Y, 1, 1);
    }
    for (const y of [120, 172]) {
      const hw = prof(y) * RK;
      c.fillStyle = K.BK3;
      c.fillRect(Math.round(CX - hw), qy(y), Math.round(hw * 2), 1);
    }
    // --- antennas: whip left of the nose, a dish on the left shoulder, one by the nose on the right ---
    box(c, K.W3, 350, 150, 354, 232);
    box(c, lights > 0 && blink ? '#ff5a3c' : '#5e2015', 349, 146, 355, 152);
    pout(K.W2, ellipse(316, 300, 20, 10, -0.6));
    pfill(c, K.W3, ellipse(318, 302, 12, 5, -0.6));
    pout(K.MET, bar(326, 306, 344, 318, 6));
    if (!dmg) {
      pout(K.W2, ellipse(598, 202, 20, 10, 0.6));
      pfill(c, K.W3, ellipse(596, 204, 12, 5, 0.6));
      pout(K.MET, bar(590, 208, 578, 222, 6));
    } else {
      // the right dish snapped off its mast and hangs on the shoulder
      pout(K.MET, bar(584, 214, 578, 222, 6));
      pout(K.W2, ellipse(604, 236, 16, 7, 1.5));
      pfill(c, K.W3, ellipse(603, 236, 9, 3, 1.5));
    }

    // --- damage: torn left pod panel with wires and sparks, dent and cracks, a dented skirt ---
    if (dmg) {
      pout('#1a1b20', quad(320, 500, 352, 542));
      pfill(c, K.W3, quad(312, 494, 330, 500));
      box(c, '#e8692a', 328, 506, 332, 536);
      box(c, '#ffc233', 336, 504, 340, 538);
      box(c, '#3fa0e0', 344, 510, 348, 534);
      if (Math.floor(time * 9) % 5 === 0) {
        c.fillStyle = '#fff6c8';
        c.fillRect(qx(340), qy(498), 1, 1);
        c.fillRect(qx(330), qy(492), 1, 1);
        c.fillStyle = '#ffd35a';
        c.fillRect(qx(346), qy(494), 1, 1);
      }
      pfill(c, K.W2, quad(338, 372, 378, 404));
      pfill(c, K.W3, quad(342, 376, 356, 400));
      const crack = (pts) => {
        for (let i = 1; i < pts.length; i++) line(c, '#55504a', qx(pts[i - 1][0]), qy(pts[i - 1][1]), qx(pts[i][0]), qy(pts[i][1]), 1);
      };
      crack([[336, 360], [352, 380], [364, 374], [378, 396], [372, 412], [388, 430]]);
      crack([[600, 610], [610, 630], [604, 650], [616, 672]]);
      pfill(c, K.OR3, quad(316, 744, 356, 756));
    }
    return { feetY: FY, front: 76, rear: 45 };
  };

  /** Tuvali satır bantlarıyla kaydırarak (eğim) ekrana koyar; clipY'nin altı (toprağa gömülen kısım) çizilmez */
  function blit(ctx, img, sx, feetScreenY, feetY, tilt, clipY) {
    const ox = sx - CX;
    const oy = feetScreenY - feetY;
    const maxRow = Math.min(OFF_H, clipY - oy + 1);
    let y0 = 0;
    while (y0 < maxRow) {
      const shift = Math.round((feetY - y0) * tilt);
      let y1 = y0 + 1;
      while (y1 < maxRow && Math.round((feetY - y1) * tilt) === shift) y1++;
      ctx.drawImage(img, 0, y0, OFF_W, y1 - y0, ox + shift, oy + y0, OFF_W, y1 - y0);
      y0 = y1;
    }
  }

  /** İniş izi: yanık zemin + saçılmış taşlar (mekiğin arkasında, zeminde) */
  function drawScar(ctx, sx, gy, k, p) {
    ctx.globalAlpha = 0.45 * k;
    ctx.fillStyle = '#24130d';
    for (let i = 0; i < 4; i++) {
      const hw = 70 - i * 16;
      ctx.fillRect(sx - hw, gy + i, hw * 2, 1);
    }
    ctx.globalAlpha = k;
    for (let j = 0; j < 16; j++) {
      const off = Math.round((hsh(j + 7) - 0.5) * 240);
      if (Math.abs(off) < 14) continue;
      const x = sx + off;
      const y = gy + 2 + Math.floor(hsh(j + 21) * 10);
      const big = hsh(j + 3) > 0.6;
      ctx.fillStyle = p.rock;
      ctx.fillRect(x, y, big ? 4 : 3, big ? 3 : 2);
      ctx.fillStyle = p.groundLight;
      ctx.fillRect(x + 1, y, big ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  /** Ayak tabanlarının üstüne yığılan toprak tümseği */
  function mound(ctx, cx, gy, w, h, p) {
    if (h <= 0) return;
    for (let i = 0; i < h; i++) {
      const hw = Math.max(1, Math.round((w / 2) * Math.sqrt(1 - i / h)));
      ctx.fillStyle = i === h - 1 ? p.groundLight : p.ground;
      ctx.fillRect(cx - hw, gy - i, hw * 2, 1);
      if (i < h - 1) {
        ctx.fillStyle = p.groundLight;
        ctx.fillRect(cx - hw, gy - i, 1, 1);
        ctx.fillStyle = p.groundDark;
        ctx.fillRect(cx + hw - 2, gy - i, 2, 1);
      }
    }
    ctx.fillStyle = p.groundDark;
    ctx.fillRect(cx - Math.round(w / 2) - 1, gy + 2, w + 2, 1);
  }

  /** Hasarlı sol yan bölmeden yükselen duman (rüzgârla sağa sürüklenir) */
  function drawSmoke(ctx, x, y, t) {
    for (let i = 0; i < 9; i++) {
      const ph = (t * 0.32 + i / 9) % 1;
      const sz = 2 + Math.round(ph * 6);
      const dx = Math.round(ph * ph * 34 + Math.sin(ph * 7 + i) * 3);
      const dy = Math.round(ph * 80);
      ctx.globalAlpha = 0.65 * (1 - ph) * Math.min(1, ph * 8);
      ctx.fillStyle = ph < 0.35 ? '#3a3431' : '#6e6560';
      ctx.fillRect(x + dx - (sz >> 1), y - dy - (sz >> 1), sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  /** Alevler, basınç dalgası, toz, taş ve buhar (dünya px → ekran: worldToScreen) */
  L.drawFx = function (ctx, gy, worldToScreen, t) {
    const pad = worldToScreen(L.padPx());
    const alt = L.altitude();
    const th = L.thrust();
    const feet = gy - alt + L.sink();
    const drop = L.legDrop();
    if (th > 0) {
      for (const n of NOZZLES) {
        const y0 = feet - drop + n.h + 1;
        const len = Math.round(((n.x === 0 ? 26 : 20) + Math.sin(t * 40 + n.x) * 5) * th + 5);
        for (let i = 0; i < len; i++) {
          const w = Math.max(1, Math.round((n.r1 * 2 - 3) * (1 - (i / len) * 0.85)));
          ctx.fillStyle = i < 4 ? '#fff6c8' : i < len * 0.5 ? '#ffc233' : '#ff7a2a';
          ctx.fillRect(pad + n.x - Math.floor(w / 2), y0 + i, w, 1);
        }
      }
      if (alt < 140) {
        const k = (t * 3) % 1;
        ctx.globalAlpha = (1 - k) * 0.35 * th;
        ctx.fillStyle = '#ffe2b0';
        const r = Math.round(16 + k * 60);
        ctx.fillRect(pad - r, gy - 1, r * 2, 1);
        ctx.globalAlpha = 1;
      }
    }
    for (const p of L.particles) {
      const a = Math.max(0, p.life / p.max);
      const x = worldToScreen(p.x);
      const y = Math.round(gy + p.y);
      if (p.kind === 'fire') {
        ctx.globalAlpha = a;
        ctx.fillStyle = a > 0.6 ? '#ffd35a' : '#ff6a22';
        ctx.fillRect(x, y, 2, 2);
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = a;
        ctx.fillStyle = '#fff6c8';
        ctx.fillRect(x, y, 1, 1);
      } else if (p.kind === 'rock') {
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.fillStyle = '#5a261a';
        ctx.fillRect(x, y - 2, 3, 2);
        ctx.fillStyle = '#c26a42';
        ctx.fillRect(x, y - 2, 1, 1);
      } else if (p.kind === 'dust') {
        ctx.globalAlpha = Math.min(0.85, a * 1.1);
        ctx.fillStyle = a > 0.5 ? '#c9845a' : '#a8603e';
        ctx.fillRect(x, y - (p.s || 2), p.s || 2, p.s || 2);
      } else {
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = '#eef0f4';
        ctx.fillRect(x, y, 3, 2);
      }
    }
    ctx.globalAlpha = 1;
  };

  /** Sahne sırasında ya da sonrasında mekiği çizer (iniş alanında kalıcı, gömülü ve hasarlı dekor) */
  /**
   * Bir an için tüm çizim parametreleri. Sahnenin son karesi (t = T.end) ile sahne bittikten sonraki
   * kalıcı dekor (FINAL_T) aynı değerleri vermelidir: kontrol devrinde görsel sıçrama olmaz (testte denetlenir).
   */
  L.drawParams = function (tt) {
    return {
      alt: L.altitude(tt),
      sink: L.sink(tt),
      tilt: L.tilt(tt),
      damage: L.damage(tt),
      deploy: L.legDeploy(tt),
      compress: L.compress(tt),
      lights: clamp01((tt - L.T.lightsOn) / 0.5),
      hatch: L.hatchOpen(tt),
      heat: L.heat(tt),
      legDrop: L.legDrop(tt)
    };
  };
  L.FINAL_T = FINAL_T;

  L.draw = function (ctx, gy, worldToScreen, t, dark, pal) {
    const sx = worldToScreen(L.padPx());
    if (sx < -160 || sx > ctx.canvas.width + 160) return;
    const tt = L.active ? L.t : FINAL_T;
    const p = pal || DEFAULT_PAL;
    const P = L.drawParams(tt);
    const { alt, sink, tilt } = P;
    const dmg = P.damage;
    const k = sink / SINK;
    if (sink > 0) drawScar(ctx, sx, gy, k, p);

    const sprite = S.Sprites && S.Sprites.get('lander');
    let legs = { front: 64, rear: 44 };
    if (sprite) ctx.drawImage(sprite, Math.round(sx - sprite.width / 2), gy - alt + sink - sprite.height + 2);
    else {
      const img = offCanvas();
      if (!img) return;
      const o = { deploy: P.deploy, compress: P.compress, lights: P.lights, hatch: P.hatch, dark, time: t, damage: dmg, heat: P.heat, sink };
      legs = L.drawShip(img.getContext('2d'), o);
      blit(ctx, img, sx, gy - alt + sink, legs.feetY, tilt, gy);
    }

    if (sink > 0) {
      mound(ctx, sx - legs.rear, gy, 16, Math.round(4 * k), p);
      mound(ctx, sx + legs.rear, gy, 16, Math.round(4 * k), p);
      mound(ctx, sx - legs.front, gy, 28, Math.round(7 * k), p);
      mound(ctx, sx + legs.front, gy, 22, Math.round(5 * k), p);
    }
    if (dmg) {
      const h = P.legDrop - sink + 65; // sol yan bölmenin yerden yüksekliği
      drawSmoke(ctx, sx - 42 + Math.round((h + sink) * tilt), gy - h, t);
    }
  };

  S.Lander = L;
})((window.SOL14 = window.SOL14 || {}));
