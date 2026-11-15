/**
 * SOL 14: RED HORIZON — Açılış iniş sahnesi: mekik üssün iniş alanına sert iner (K4, D-012)
 *  0–2.5 sn  alçalma ve frenleme: 3 nozulda alev + basınç dalgası, hafif yalpalama, ayaklar açılıp kilitlenir
 *  2.5–3.3   toz bulutu ve SERT temas: taş/kıvılcım saçılır, güçlü sarsıntı
 *  3.3–4.2   gövde ~10 px toprağa gömülür, sol ön ayak bükülür ve mekik sola yatar (hasar: yırtık panel,
 *            kopuk sağ çanak anten, çatlak pencere, ezik + çatlak, sol yan bölmeden duman)
 *  4.0–5.5   motor kapatma: alevler söner, beyaz buhar, nozullar kızıl soğur; ışıklar yanar
 *  5.5+      kapak açılır, merdiven yere uzanır; astronot merdivenden iner, sonra kontrol oyuncuya geçer
 * Mantık (zaman çizelgesi) DOM'suzdur ve testlerde çalışır; çizim yalnızca draw* fonksiyonlarındadır.
 * Prosedürel piksel çizim (referans: docs/design/references/lander-reference.png). Boy ≈ 270 px ≈ astronotun ~5 katı
 * (640×360 tasarım alanına sığsın diye). Gövde ekran dışı bir tuvale çizilir, sonra satır bantlarıyla
 * kaydırılarak (shear) eğilir ve zemin çizgisinde kırpılır: pikseller keskin kalır, gömülen kısım görünmez.
 */
(function (S) {
  'use strict';
  const L = { active: false, t: 0, particles: [], touched: false, cut: false };

  // 3.3 → 6.4: toz bulutu yatışır (temas tozunun ömrü ≤ 3 sn), sonra kapak açılır
  L.T = { touchStart: 2.5, touch: 3.3, shutdown: 4.0, lightsOn: 4.6, hatch: 6.4, walkStart: 6.9, climbEnd: 8.5, end: 9.6 };
  const START_ALT = 340;
  const LEG_FOLDED = 34;
  const LEG_RANGE = 16; // tam açık ayak: gövde altı yerden 50 px yukarıda
  const SINK = 10; // toprağa gömülme (px)
  const TILT = -0.07; // ≈ 4° sola yatma (satır başına kayma)
  const SILL = 18; // kapak eşiği, gövde altından yükseklik
  const HATCH_H = 60;
  const NOZZLES = [
    { x: -26, h: 20, r0: 5, r1: 8 },
    { x: 0, h: 24, r0: 7, r1: 11 },
    { x: 26, h: 20, r0: 5, r1: 8 }
  ];
  // Ekran dışı tuval: CX gövde merkezi, BB gövde alt satırı
  const OFF_W = 240;
  const OFF_H = 300;
  const CX = 120;
  const BB = 236;
  const FINAL_T = 1e3;
  const STEAM_LIFE = 2.2;
  const HOLD = 0.35; // sahne sonundaki duruş (sn)
  /** Ekran dışı çizim alanının ölçüleri (açılış sahnesi aynı mekiği çizmek için kullanır) */
  L.SHIP = { W: OFF_W, H: OFF_H, CX, BB };
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

  /** Yerden yukarı koordinatla dikdörtgen: x gövde merkezine göre, y gövde altından yukarı, h yukarı doğru */
  function mk(c) {
    const r = (col, x, y, w, h) => {
      c.fillStyle = col;
      c.fillRect(CX + Math.round(x), BB - Math.round(y) - h + 1, w, h);
    };
    const row = (col, y, x0, x1) => {
      c.fillStyle = col;
      c.fillRect(CX + x0, BB - y, x1 - x0, 1);
    };
    return { r, row };
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

  function hazard(r, y, x0, x1, yel, blk) {
    r(yel, x0, y, x1 - x0, 1);
    for (let x = x0; x < x1; x++) if (((x + y + 400) >> 2) % 2 === 0) r(blk, x, y, 1, 1);
  }

  /** Gövde yarı genişliği (gövde altından yükseklik y'de) */
  function halfW(y) {
    if (y < 16) return 56 - (y >> 2);
    if (y < 96) return 48 - Math.floor((y - 16) / 27);
    if (y < 146) return 45 - Math.round(((y - 96) * 9) / 49);
    if (y < 156) return 36 - Math.floor((y - 146) / 3);
    if (y < 172) return 33 - Math.floor((y - 156) / 8);
    if (y < 174) return 32;
    const f = (y - 174) / 44;
    return Math.max(1, Math.round(31 * Math.sqrt(Math.max(0, 1 - Math.pow(f, 2.4)))));
  }

  /**
   * Mekiği ekran dışı tuvale çizer (eğilmemiş, yerden bağımsız).
   * o: { deploy, compress, lights, hatch, dark, time, damage, heat, sink }. Dönüş: ayak tabanının tuval y'si ve ayak x'leri.
   */
  L.drawShip = function (c, o) {
    c.clearRect(0, 0, OFF_W, OFF_H);
    const { r, row } = mk(c);
    const dk = o.dark || 0;
    const shade = (col, k) => (S.Art ? S.Art.mix(col, '#0b0c14', k) : col);
    const W1 = shade('#ece9e2', dk * 0.6);
    const W2 = shade('#cbc6bd', dk * 0.6);
    const W3 = shade('#9d978e', dk * 0.6);
    const W4 = shade('#7a756d', dk * 0.6);
    const OR = shade('#e8692a', dk * 0.5);
    const OR2 = shade('#b84a18', dk * 0.5);
    const OR3 = shade('#7a3010', dk * 0.5);
    const BK = '#26272d';
    const BK2 = '#3b3d45';
    const BK3 = '#17181c';
    const MET = shade('#8d8f96', dk * 0.5);
    const MET2 = shade('#5c5e66', dk * 0.5);
    const METL = shade('#b4b6bc', dk * 0.5);
    const YEL = shade('#f2c230', dk * 0.5);
    const CU = shade('#b5622a', dk * 0.5);
    const CUL = shade('#e08a4a', dk * 0.5);
    const time = o.time || 0;
    const blink = Math.floor(time * 3) % 2 === 0;
    const dmg = o.damage || 0;

    const drop = LEG_FOLDED + Math.round(LEG_RANGE * o.deploy) - (o.compress || 0);
    const FY = BB + drop; // ayak tabanı (tuval y)
    const spread = 40 + Math.round(24 * o.deploy);
    const rear = 30 + Math.round(14 * o.deploy);

    // --- Arka ayaklar (koyu: derinlik) ---
    for (const s of [-1, 1]) {
      const fx = CX + s * rear;
      const fy = FY - 3;
      const ky = fy - 10;
      line(c, MET2, CX + s * 26, BB + 2, fx, ky, 3);
      line(c, OR3, CX + s * 36, BB - 6, CX + s * Math.round((26 + rear) / 2 + 3), Math.round((BB + ky) / 2), 2);
      c.fillStyle = OR3;
      c.fillRect(fx - 2, ky - 2, 5, 5);
      c.fillStyle = MET2;
      c.fillRect(fx - 1, ky + 2, 3, fy - ky - 2);
      c.fillRect(fx - 6, fy - 2, 12, 3);
    }

    // --- Nozullar (orta büyük) + soğuma kızıllığı ---
    for (const n of NOZZLES) {
      for (let i = 0; i < n.h; i++) {
        const hw = n.r0 + Math.round((i * (n.r1 - n.r0)) / (n.h - 1));
        const y = BB + 1 + i;
        c.fillStyle = i < 2 ? MET2 : i >= n.h - 2 ? '#55575f' : BK;
        c.fillRect(CX + n.x - hw, y, hw * 2, 1);
        if (i >= 2 && i < n.h - 2) {
          c.fillStyle = BK2;
          c.fillRect(CX + n.x - hw + 1, y, 2, 1);
          c.fillStyle = BK3;
          c.fillRect(CX + n.x + hw - 2, y, 2, 1);
        }
        if (o.heat > 0 && i >= n.h / 3) {
          c.globalAlpha = o.heat * 0.75 * ((i - n.h / 3) / (n.h * 0.67));
          c.fillStyle = '#ff5a1a';
          c.fillRect(CX + n.x - hw + 2, y, hw * 2 - 4, 1);
          c.globalAlpha = 1;
        }
      }
    }

    // --- Gövde satırları ---
    for (let y = 0; y < 219; y++) {
      const hw = halfW(y);
      if (y < 16) {
        row(y < 3 ? OR3 : OR, y, -hw, hw);
        row(OR2, y, hw - 4, hw);
        if (y >= 3) row(OR2, y, -hw, -hw + 1);
      } else if (y < 146) {
        row(W2, y, -hw, hw);
        row(W1, y, -hw + 2, hw - 6);
        row(W3, y, hw - 5, hw);
        row(W4, y, hw - 1, hw);
      } else if (y < 156) {
        row(W2, y, -hw, hw);
        row(W1, y, -hw + 3, hw - 7);
      } else if (y < 172) {
        row(BK, y, -hw, hw);
        row(BK2, y, -hw + 3, -hw + 6);
        row(BK3, y, hw - 3, hw);
      } else if (y < 174) {
        row(y === 172 ? OR2 : OR, y, -hw, hw);
      } else {
        row(y > 215 ? BK2 : BK, y, -hw, hw);
        if (hw > 7) row('#4a4c56', y, -hw + 3, -hw + 5);
        if (hw > 4) row(BK3, y, hw - 2, hw);
        if (hw > 3) row(BK3, y, 0, 1);
        if (y === 190 || y === 205) row(BK3, y, -hw, hw);
      }
    }
    // Etek: eklemler + uyarı şeridi
    for (let x = -50; x < 50; x += 12) r(OR2, x, 3, 1, 7);
    for (let y = 11; y < 15; y++) hazard(r, y, -halfW(y) + 2, halfW(y) - 2, YEL, BK);
    // Gövde dikişleri ve perçinler
    for (const y of [40, 66, 100, 138]) row(W3, y, -halfW(y) + 2, halfW(y) - 5);
    r(W3, -22, 16, 1, 70);
    r(W3, 22, 16, 1, 70);
    for (const y of [20, 46, 72, 104, 132]) {
      r(W4, -halfW(y) + 4, y, 1, 1);
      r(W4, halfW(y) - 7, y, 1, 1);
    }
    for (let y = 86; y < 90; y++) hazard(r, y, -halfW(y), halfW(y), YEL, BK);
    // Üst modül kare panel
    r(W3, -12, 106, 24, 24);
    r(W2, -11, 107, 22, 22);
    r(W1, -10, 109, 17, 19);
    for (const [px, py] of [[-10, 108], [8, 108], [-10, 127], [8, 127]]) r(W4, px, py, 1, 1);
    r(W3, -4, 140, 8, 3);

    // Kirli/yanık izleri (atmosfer girişi): etek ve alt gövdede is lekeleri
    c.globalAlpha = 0.3;
    for (let x = -55; x < 55; x += 2) {
      const h = 4 + Math.floor(hsh(x) * (dmg ? 30 : 20));
      r('#2a1a12', x, 0, 2, Math.min(h, 40));
    }
    c.globalAlpha = 1;

    // Yan turuncu bölmeler + havalandırma + yan iticiler
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -54 : 44;
      r(OR2, x0, 38, 10, 44);
      r(s < 0 ? OR : OR2, x0 + 1, 39, 8, 42);
      for (let vy = 46; vy < 78; vy += 6) r(OR3, x0 + 3, vy, 4, 3);
      r(MET2, s < 0 ? -58 : 54, 58, 4, 6);
      r(BK, s < 0 ? -60 : 58, 59, 2, 4);
    }
    // Omuz bölmeleri (turuncu, eğimli)
    for (let y = 128; y < 160; y++) {
      const k = Math.round((y - 128) * 0.45);
      row(OR, y, -46 + k, -33 + k);
      row(OR2, y, -46 + k, -44 + k);
      row(OR2, y, 33 - k, 46 - k);
      row(OR3, y, 44 - k, 46 - k);
    }
    for (const vy of [134, 140, 146]) {
      const k = Math.round((vy - 128) * 0.45);
      r(OR3, -42 + k, vy, 6, 2);
      r(OR3, 37 - k, vy, 6, 2);
    }

    // Borular: sol gri, sağ bakır
    r(MET, -31, 22, 2, 120);
    r(METL, -31, 22, 1, 120);
    r(MET, -31, 22, 14, 2);
    r(CU, 29, 20, 2, 132);
    r(CUL, 29, 20, 1, 132);
    r(CU, 17, 20, 14, 2);
    for (const y of [50, 90, 125]) {
      r(MET2, -32, y, 4, 1);
      r(MET2, 28, y, 4, 1);
    }
    // Sağ alt ızgara + LED
    r(W3, 34, 24, 9, 14);
    for (let i = 0; i < 4; i++) r('#2a2b31', 35, 26 + i * 3, 7, 1);
    if (o.lights > 0) {
      r(blink ? '#3fe08a' : '#1a5e3c', 35, 39, 2, 1);
      r('#ff5a3c', 39, 39, 2, 1);
    }

    // Pencereler (siyah bant)
    for (const [wx, ww, broken] of [[-27, 6, true], [-6, 12, false], [21, 6, false]]) {
      r('#55575f', wx - 1, 159, ww + 2, 7);
      r(broken && dmg ? '#2d6f99' : shade('#3aa8e8', dk * 0.3), wx, 160, ww, 5);
      r(o.lights > 0 && !(broken && dmg) ? '#bff0ff' : '#7fc8ee', wx, 164, Math.min(3, ww), 1);
      if (broken && dmg) {
        r('#e9f4ff', wx + 1, 163, 1, 1);
        r('#e9f4ff', wx + 2, 162, 1, 1);
        r('#e9f4ff', wx + 3, 161, 1, 1);
        r('#e9f4ff', wx + 4, 162, 1, 1);
      }
    }
    // Antenler: sol kamçı + sol çanak; sağ çanak hasarla kopar
    r(W3, -36, 156, 1, 30);
    r(blink ? '#ff5a3c' : '#5e2015', -36, 186, 1, 1);
    r(MET, -52, 150, 6, 1);
    r(W2, -56, 146, 2, 9);
    r(W1, -54, 147, 1, 7);
    r(MET2, -58, 150, 2, 1);
    if (!dmg) {
      r(MET, 46, 150, 6, 1);
      r(W2, 54, 146, 2, 9);
      r(W1, 53, 147, 1, 7);
      r(MET2, 56, 150, 2, 1);
    } else {
      r(MET, 46, 150, 3, 1);
      r(MET, 48, 143, 1, 7);
      r(W2, 45, 140, 7, 2);
      r(W1, 46, 142, 5, 1);
      r(MET2, 47, 137, 2, 3);
    }

    // Kapak (iki kanat yana kayar) + üstte durum ışıkları
    r(W4, -17, SILL - 1, 34, HATCH_H + 2);
    r(MET2, -18, SILL - 1, 36, 1);
    const dw = Math.round(15 * (1 - o.hatch));
    if (o.hatch > 0) {
      r('#121318', -15, SILL, 30, HATCH_H);
      if (o.lights > 0) {
        // İç ışık: tavandaki lambadan aşağı doğru sönükleşir
        for (let i = 0; i < 4; i++) {
          c.globalAlpha = (0.42 - i * 0.09) * o.lights;
          r('#ffe6a8', -14, SILL + HATCH_H - 2 - (i + 1) * 14, 28, 14);
        }
        c.globalAlpha = 0.8 * o.lights;
        r('#fff3cf', -8, SILL + HATCH_H - 3, 16, 2);
        c.globalAlpha = 1;
      }
    }
    const DOOR = shade('#b8b196', dk * 0.6);
    const DOOR2 = shade('#8c866f', dk * 0.6);
    if (dw > 0) {
      r(DOOR, -15, SILL, dw, HATCH_H);
      r(DOOR, 15 - dw, SILL, dw, HATCH_H);
      r(DOOR2, -15 + dw - 1, SILL, 1, HATCH_H);
      r(DOOR2, 15 - dw, SILL, 1, HATCH_H);
      if (dw === 15) {
        r('#2f3a4a', -11, SILL + 38, 6, 12);
        r('#2f3a4a', 5, SILL + 38, 6, 12);
        r(DOOR2, -2, SILL + 24, 4, 2);
      }
    }
    if (o.lights > 0) {
      c.globalAlpha = o.lights;
      r(blink ? '#3fe08a' : '#1a5e3c', -6, 81, 3, 2);
      r('#ffc233', 3, 81, 3, 2);
      c.globalAlpha = 1;
    } else {
      r('#1a5e3c', -6, 81, 3, 2);
      r('#6a5418', 3, 81, 3, 2);
    }

    // --- Hasar ---
    if (dmg) {
      // Yırtık panel (sol alt, dumanın çıktığı taraf) + açıkta kablolar + kıvılcım
      r('#1a1b20', -43, 44, 11, 14);
      r(W3, -44, 56, 4, 2);
      r(W1, -36, 42, 4, 2);
      r(W2, -34, 50, 2, 4);
      r(W4, -44, 44, 1, 6);
      r('#e8692a', -41, 47, 1, 7);
      r('#ffc233', -38, 45, 1, 9);
      r('#3fa0e0', -35, 48, 1, 6);
      if (Math.floor(time * 9) % 5 === 0) {
        r('#fff6c8', -39, 44, 1, 1);
        r('#ffd35a', -37, 42, 1, 1);
        r('#fff6c8', -41, 41, 1, 1);
      }
      // Ezik + çatlak (üst sol), çatlak (alt sol)
      r(W2, -38, 112, 12, 10);
      r(W3, -37, 113, 4, 8);
      r(W4, -33, 116, 2, 3);
      const crack = (pts) => {
        for (let i = 1; i < pts.length; i++) {
          line(c, '#55504a', CX + pts[i - 1][0], BB - pts[i - 1][1], CX + pts[i][0], BB - pts[i][1], 1);
        }
      };
      crack([[-40, 126], [-35, 120], [-31, 122], [-27, 115], [-29, 110], [-24, 105]]);
      crack([[38, 44], [41, 50], [39, 56], [43, 64], [42, 70]]);
      // Etekte ezik
      r(OR3, -40, 4, 10, 3);
    }

    // --- Merdiven: kapak eşiğinden zemine uzanır ---
    const sillY = BB - SILL + 1;
    const groundY = FY - (o.sink || 0);
    const full = groundY - sillY;
    const len = Math.round(8 + (full - 8) * clamp01(o.hatch));
    c.fillStyle = BK2;
    c.fillRect(CX - 6, sillY, 2, len);
    c.fillRect(CX + 4, sillY, 2, len);
    c.fillStyle = MET;
    for (let y = sillY + 3; y < sillY + len; y += 5) c.fillRect(CX - 4, y, 8, 1);
    c.fillStyle = MET2;
    c.fillRect(CX - 7, sillY, 14, 2);

    // --- Ön ayaklar (açık ton) + hidrolik piston + taban pedi; sol ön ayak hasarla bükülür ---
    for (const s of [-1, 1]) {
      const hipX = CX + s * 40;
      const hipY = BB - 1;
      const fx = CX + s * spread;
      const fy = FY;
      const bent = dmg && s < 0;
      const kx = fx + (bent ? -4 : 0);
      const ky = fy - 14 + (bent ? 5 : 0);
      line(c, MET, hipX, hipY, kx, ky, 4);
      line(c, MET2, hipX, hipY + 2, kx, ky + 2, 1);
      line(c, MET2, CX + s * 24, BB + 1, kx, ky, 2);
      const mx = Math.round((hipX + kx) / 2) + s * 3;
      const my = Math.round((hipY + ky) / 2);
      line(c, OR, CX + s * 48, BB - 10, Math.round((CX + s * 48 + mx) / 2), Math.round((BB - 10 + my) / 2), 3);
      line(c, METL, Math.round((CX + s * 48 + mx) / 2), Math.round((BB - 10 + my) / 2), mx, my, 2);
      c.fillStyle = OR2;
      c.fillRect(kx - 4, ky - 4, 8, 8);
      c.fillStyle = OR;
      c.fillRect(kx - 3, ky - 3, 6, 6);
      c.fillStyle = BK2;
      c.fillRect(kx - 1, ky - 1, 2, 2);
      if (bent) line(c, MET, kx, ky + 3, fx, fy - 3, 3);
      else {
        c.fillStyle = MET;
        c.fillRect(fx - 2, ky + 4, 4, fy - 3 - ky - 4);
      }
      c.fillStyle = MET;
      c.fillRect(fx - 8, fy - 3, 16, 3);
      c.fillStyle = MET2;
      c.fillRect(fx - 7, fy, 14, 1);
      c.fillStyle = OR;
      c.fillRect(fx - 3, fy - 5, 6, 2);
    }
    return { feetY: FY, front: spread, rear };
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
      const h = P.legDrop - sink + 70; // sol yan bölmenin yerden yüksekliği
      drawSmoke(ctx, sx - 50 + Math.round((h + sink) * tilt), gy - h, t);
    }
  };

  S.Lander = L;
})((window.SOL14 = window.SOL14 || {}));
