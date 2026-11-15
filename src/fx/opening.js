/**
 * SOL 14: RED HORIZON — Açılış: Dünya'dan kalkış + Dünya–Mars yolculuğu (transit ekranının tuvali)
 *  0–4.6 sn    kalkış: ateşleme, duman bulutu, roket kuleden yükselir, kamera izler, gökyüzü kararır
 *  4.6–11.2    yolculuk: Dünya → kesikli yörünge → Mars; mekik yörünge boyunca ilerler (meteor olayı ortada)
 *  11.2–12.4   varış: Mars yaklaşır, ekran Mars gökyüzü rengine açılır
 * Ardından oyun dünyasında mevcut iniş sahnesi (S.Lander) başlar: alçalma ve iniş yalnızca orada oynar.
 * Mekik, docs/design/references/lander-reference.png'ye göre burada çizilir (drawRefShip). Zaman çizelgesi DOM'suzdur.
 */
(function (S) {
  'use strict';
  const O = {};
  // K2 trial: a text-free prelude (crowds, news, close-up, countdown lamps) runs before ignition, and the
  // climb ends in an ascent shot where the Earth shrinks. All later times shift by the prelude.
  // liftoff (0) .. ignite: prelude · ignite .. ascent: launch from the pad · ascent .. cruise: Earth falls away
  O.T = { liftoff: 0, ignite: 7.5, rise: 8.7, ascent: 11.6, cruise: 14.5, meteor: 17.1, arrive: 21.1, end: 22.3 };
  /** Sound cues on the opening timeline (fired by the transit cutscene as the clock passes them). */
  O.cues = [
    { at: 0.05, name: 'intro_music' },
    { at: 0.1, name: 'crowd' },
    { at: 2.4, name: 'static' },
    { at: 4.6, name: 'heartbeat' },
    { at: 5.3, name: 'countdown' },
    { at: 5.4, name: 'heartbeat' },
    { at: 6.1, name: 'countdown' },
    { at: 6.2, name: 'heartbeat' },
    { at: 6.9, name: 'countdown' },
    { at: 7.5, name: 'launch' },
    { at: 7.5, name: 'roar' },
    { at: 8.9, name: 'cheer' }
  ];
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
  // drawLiftoff works in its own local time (0 = ignition); its rise curve is the same, shifted
  const riseLocal = (lt) => O.rise(lt + O.T.ignite);

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

  /*
   * K2 trial: the opening's vehicle, drawn to match docs/design/references/lander-reference.png part by
   * part (black nose with an orange ring and blue windows, orange shoulders with a dish and a whip antenna,
   * white riveted hull with a grey and a copper pipe, orange side pods with thrusters, hazard stripes, the
   * small hatch with its status lights and the long ladder, the wide orange skirt, three bells with the
   * centre one larger, and four hydraulic legs with round pads, front pair bright and rear pair dark).
   * Shapes are given in the reference image's pixel coordinates and scaled by RK, so the vehicle stands
   * ~290 px tall, 5x the 58 px astronaut. Filled row by row (no anti-aliasing) with a dark outline.
   */
  const RK = 0.3;
  const RCX = 472; // the vehicle's centre line in the reference image
  const SH = { W: 204, H: 292, CX: 102 };
  const qx = (x) => Math.round((x - RCX) * RK + SH.CX);
  const qy = (y) => Math.round((y - 25) * RK);
  SH.FEET = qy(985); // footpad bottom
  SH.BASE = qy(872); // bottom of the centre bell
  SH.NOZ = [[390, 850, 50], [472, 872, 70], [554, 850, 50]].map(([x, y, w]) => ({ x: qx(x), y: qy(y), w: Math.max(4, Math.round(w * RK)) }));
  SH.LADDER = { x0: qx(462), x1: qx(495), top: qy(682) };
  O.SHIP = SH;
  const OUT = '#1b1622';
  const mir = (p) => p.map(([x, y]) => [2 * RCX - x, y]);
  /** Scanline polygon fill in canvas pixels; pts in reference coordinates. */
  function pfill(c, col, pts, ox = 0, oy = 0) {
    const P = pts.map(([x, y]) => [(x - RCX) * RK + SH.CX + ox, (y - 25) * RK + oy]);
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
  /** The same, with a 1 px dark outline around the shape */
  function pout(c, col, pts) {
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) pfill(c, OUT, pts, ox, oy);
    pfill(c, col, pts);
  }
  const quad = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  function box(c, col, x0, y0, x1, y1) {
    const X = qx(x0);
    const Y = qy(y0);
    c.fillStyle = col;
    c.fillRect(X, Y, Math.max(1, qx(x1) - X), Math.max(1, qy(y1) - Y));
  }
  /** Thick bar between two points (w in reference px) */
  function bar(x0, y0, x1, y1, w) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const nx = (-(y1 - y0) / L) * (w / 2);
    const ny = ((x1 - x0) / L) * (w / 2);
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

  function drawRefShip(c, ladder) {
    const W1 = '#efece6';
    const W2 = '#d2cdc4';
    const W3 = '#a39d94';
    const W4 = '#7a756d';
    const OR = '#e8692a';
    const OR2 = '#b84a18';
    const OR3 = '#7a3010';
    const BK = '#2a2b31';
    const BK2 = '#3d3f48';
    const BK3 = '#17181c';
    const MET = '#8d8f96';
    const METL = '#c4c6cc';
    const MET2 = '#5c5e66';
    const CU = '#b5622a';
    const CUL = '#e08a4a';
    c.clearRect(0, 0, SH.W, SH.H);

    // rear legs (dark, behind the hull)
    for (const m of [(p) => p, mir]) {
      pout(c, '#4a4c54', m(bar(392, 760, 322, 930, 18)));
      pout(c, OR3, m(bar(366, 820, 348, 862, 26)));
      pout(c, '#3b3d45', m(quad(282, 926, 360, 946)));
      pfill(c, OR2, m(quad(286, 926, 356, 930)));
    }
    // engine bay and the three bells (centre one larger)
    pout(c, BK2, quad(338, 752, 606, 796));
    const bells = [
      [[372, 794], [408, 794], [425, 850], [355, 850]],
      [[446, 794], [498, 794], [520, 872], [424, 872]],
      [[536, 794], [572, 794], [589, 850], [519, 850]]
    ];
    for (const b of bells) {
      pout(c, BK, b);
      pfill(c, '#4a4c56', [b[0], [b[0][0] + 8, b[0][1]], [b[3][0] + 12, b[3][1]], b[3]]);
      pfill(c, BK3, [[b[1][0] - 8, b[1][1]], b[1], b[2], [b[2][0] - 12, b[2][1]]]);
      pfill(c, MET2, quad(b[3][0], b[3][1] - 8, b[2][0], b[2][1]));
    }
    // ladder from the hatch to the ground
    if (ladder) {
      box(c, '#5c5e66', 461, 682, 468, 985);
      box(c, '#5c5e66', 489, 682, 496, 985);
      for (let y = 692; y < 980; y += 17) box(c, '#a39d94', 461, y, 496, y + 4);
    }
    // skirt: wide orange band, darker lower edge, leg mounts, hazard stripes
    pout(c, OR, [[296, 678], [648, 678], [656, 742], [640, 764], [304, 764], [288, 742]]);
    pfill(c, OR2, [[288, 742], [656, 742], [640, 764], [304, 764]]);
    pfill(c, '#f08a4a', quad(300, 682, 330, 738));
    hazardBox(c, 384, 686, 560, 698, BK, '#f2c230');
    for (let x = 392; x < 560; x += 28) box(c, OR2, x, 708, x + 6, 736);
    for (const m of [(p) => p, mir]) {
      pout(c, MET, m(quad(298, 696, 362, 748)));
      pfill(c, METL, m(quad(302, 700, 312, 744)));
      pfill(c, MET2, m(quad(350, 700, 362, 748)));
    }
    // front legs (bright): upper strut, orange collar, piston, round pad
    for (const [m, lit] of [[(p) => p, true], [mir, false]]) {
      const G = lit ? '#a5a7ae' : '#8d8f96';
      pout(c, G, m(bar(352, 722, 256, 830, 34)));
      pfill(c, lit ? '#cfd1d6' : '#a5a7ae', m(bar(346, 712, 250, 820, 8)));
      pout(c, lit ? OR : OR2, m(bar(282, 800, 246, 842, 46)));
      pfill(c, OR3, m(bar(272, 812, 256, 832, 10)));
      pout(c, MET2, m(bar(254, 836, 226, 956, 22)));
      pfill(c, G, m(bar(250, 836, 222, 952, 8)));
      pout(c, lit ? OR : OR2, m([[176, 956], [260, 956], [270, 972], [166, 972]]));
      pout(c, '#6a6c74', m(quad(164, 972, 272, 986)));
    }

    // hull: white body, grey side panels (lit from the left)
    const hull = [[430, 288], [514, 288], [514, 334], [644, 334], [650, 680], [294, 680], [300, 334], [430, 334]];
    pout(c, W2, hull);
    pfill(c, W1, [[440, 296], [506, 296], [506, 342], [600, 342], [604, 672], [330, 672], [326, 342], [440, 342]]);
    pfill(c, '#bdb8af', quad(300, 334, 326, 680));
    pfill(c, W3, quad(612, 334, 650, 680));
    pfill(c, W4, quad(640, 334, 650, 680));
    for (const y of [454, 470, 560]) box(c, W3, 326, y, 612, y + 3);
    for (const x of [424, 520]) box(c, W3, x, 342, x + 3, 454);
    for (const y of [352, 420, 500, 540, 640]) {
      box(c, W4, 336, y, 340, y + 4);
      box(c, W4, 600, y, 604, y + 4);
    }
    // the square access panel and the small vent
    pout(c, W2, quad(440, 362, 510, 446));
    pfill(c, W1, quad(446, 368, 502, 438));
    pfill(c, W3, quad(446, 432, 504, 440));
    for (let i = 0; i < 3; i++) box(c, BK2, 466 + i * 9, 484, 471 + i * 9, 498);
    // hazard stripes across the hull
    hazardBox(c, 396, 568, 560, 584, BK, OR);
    hazardBox(c, 326, 584, 384, 596, BK, '#f2c230');
    hazardBox(c, 560, 584, 612, 596, BK, '#f2c230');
    // orange side pods with vent slots, and the side thrusters
    for (const [m, lit] of [[(p) => p, true], [mir, false]]) {
      pout(c, lit ? OR : OR2, m(quad(318, 488, 364, 604)));
      pfill(c, lit ? '#f08a4a' : OR, m(quad(322, 492, 330, 600)));
      pfill(c, OR3, m(quad(334, 506, 350, 586)));
      for (let y = 512; y < 584; y += 12) pfill(c, lit ? OR : OR2, m(quad(334, y, 350, y + 4)));
      for (const ty of [532, 584]) {
        pout(c, MET, m(quad(292, ty, 318, ty + 18)));
        pout(c, BK, m(quad(282, ty + 2, 292, ty + 16)));
      }
    }
    // pipes: grey on the left, copper on the right
    box(c, MET, 384, 352, 398, 632);
    box(c, METL, 384, 352, 388, 632);
    box(c, MET, 364, 348, 398, 360);
    box(c, MET, 384, 620, 436, 634);
    for (const y of [420, 520]) box(c, MET2, 380, y, 402, y + 5);
    box(c, CU, 546, 346, 560, 684);
    box(c, CUL, 546, 346, 550, 684);
    box(c, CU, 532, 344, 560, 356);
    for (const y of [430, 610]) box(c, OR3, 542, y, 564, y + 5);
    // grille with LEDs, lower right
    pout(c, W3, quad(564, 624, 598, 668));
    for (let i = 0; i < 4; i++) box(c, BK2, 568, 630 + i * 8, 594, 634 + i * 8);
    box(c, '#3fe08a', 568, 660, 576, 666);
    box(c, '#ff5a3c', 582, 660, 590, 666);
    // the hatch, its frame and the two status lights
    pout(c, MET2, quad(448, 612, 508, 684));
    pfill(c, '#b8b196', quad(454, 618, 502, 682));
    pfill(c, '#8c866f', quad(496, 618, 502, 682));
    box(c, '#6a644e', 476, 624, 480, 678);
    box(c, '#3fe08a', 460, 598, 472, 608);
    box(c, '#ffc233', 484, 598, 496, 608);

    // shoulders: orange, sloping out, with vents
    for (const [m, lit] of [[(p) => p, true], [mir, false]]) {
      pout(c, lit ? OR : OR2, m([[366, 256], [432, 256], [432, 336], [298, 336]]));
      pfill(c, lit ? '#f08a4a' : OR, m([[366, 256], [376, 256], [310, 330], [300, 330]]));
      pfill(c, OR3, m(quad(364, 286, 386, 316)));
      for (let y = 290; y < 314; y += 7) pfill(c, lit ? OR2 : OR, m(quad(366, y, 384, y + 3)));
    }
    // black band with the blue windows and the dark front panel
    pout(c, BK, [[360, 216], [584, 216], [590, 262], [514, 262], [514, 296], [430, 296], [430, 262], [354, 262]]);
    pfill(c, BK2, quad(362, 220, 382, 258));
    for (const [x0, x1] of [[358, 382], [446, 498], [562, 586]]) {
      pout(c, '#3aa8e8', quad(x0, 230, x1, 254));
      pfill(c, '#bff0ff', quad(x0 + 3, 233, x0 + 9, 238));
      pfill(c, '#2d6f99', quad(x0, 248, x1, 254));
    }
    pout(c, BK2, quad(450, 260, 496, 294));
    box(c, '#3fe08a', 482, 266, 488, 272);
    box(c, '#ffc233', 482, 278, 488, 284);
    for (let i = 0; i < 3; i++) box(c, BK3, 456, 268 + i * 8, 476, 270 + i * 8);
    // orange ring under the nose
    pout(c, OR, quad(360, 210, 584, 218));
    // nose cone: black, rounded, vertical panel seams, a soft highlight on the left
    const nTop = 28;
    const nBot = 210;
    const prof = (y) => 110 * Math.pow(Math.max(0, 1 - Math.pow((nBot - y) / (nBot - nTop), 1.8)), 1 / 1.8);
    const nose = [];
    for (let y = nTop; y <= nBot; y += 6) nose.push([RCX - prof(y), y]);
    for (let y = nBot; y >= nTop; y -= 6) nose.push([RCX + prof(y), y]);
    pout(c, BK, nose);
    for (let Y = qy(nTop) + 1; Y < qy(nBot); Y++) {
      const y = Y / RK + 25;
      const hw = prof(y) * RK;
      const X = SH.CX;
      c.fillStyle = BK2;
      c.fillRect(Math.round(X - hw * 0.86), Y, Math.max(1, Math.round(hw * 0.36)), 1);
      if (y < 150) {
        c.fillStyle = '#4e505a';
        c.fillRect(Math.round(X - hw * 0.72), Y, Math.max(1, Math.round(hw * 0.12)), 1);
      }
      c.fillStyle = BK3;
      c.fillRect(Math.round(X + hw * 0.62), Y, Math.max(1, Math.round(hw * 0.38)), 1);
      for (const f of [-0.42, 0, 0.42]) c.fillRect(Math.round(X + hw * f), Y, 1, 1);
    }
    for (const y of [120, 172]) {
      const hw = prof(y) * RK;
      c.fillStyle = BK3;
      c.fillRect(Math.round(SH.CX - hw), qy(y), Math.round(hw * 2), 1);
    }
    // antennas: whip on the left of the nose, a dish on the left shoulder and one by the nose on the right
    box(c, W3, 350, 150, 354, 232);
    box(c, '#ff5a3c', 349, 146, 355, 152);
    pout(c, W2, ellipse(316, 300, 20, 10, -0.6));
    pfill(c, W3, ellipse(318, 302, 12, 5, -0.6));
    pout(c, MET, bar(326, 306, 344, 318, 6));
    pout(c, W2, ellipse(598, 202, 20, 10, 0.6));
    pfill(c, W3, ellipse(596, 204, 12, 5, 0.6));
    pout(c, MET, bar(590, 208, 578, 222, 6));
  }

  const shipCvs = {};
  /** The vehicle's image: with the pad ladder (on the ground) or without it (in flight). Cached. */
  function shipImage(ladder) {
    if (typeof document === 'undefined') return null;
    const k = ladder ? 'l' : 'f';
    if (!shipCvs[k]) {
      const cv = document.createElement('canvas');
      cv.width = SH.W;
      cv.height = SH.H;
      drawRefShip(cv.getContext('2d'), ladder);
      shipCvs[k] = cv;
    }
    return shipCvs[k];
  }
  /** Draws the vehicle standing with its footpads on (cx, feetY) at scale sc */
  function drawShipAt(g, cx, feetY, sc, ladder) {
    const img = shipImage(ladder);
    if (img) g.drawImage(img, Math.round(cx - SH.CX * sc), Math.round(feetY - SH.FEET * sc), Math.round(SH.W * sc), Math.round(SH.H * sc));
  }

  /* ---------------- 1) Kalkış ---------------- */
  function drawLiftoff(g, t) {
    const W = O.W;
    const H = O.H;
    const rise = riseLocal(t);
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
    const tx = 150;
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
    for (const ay of [gy - 200, gy - 150, gy - 110]) rect(g, OR, tx + 25, ay, 92 * (1 - arm) + 4, 3);

    const rx = 320;
    const feet = gy - 4 - rise; // the vehicle stands on its own four legs on the pad
    const top = feet - SH.FEET;
    // Duman bulutu (ateşlemeden sonra büyür, rokete eşlik etmez)
    const smoke = clamp01(t / 1.6);
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1;
      const spread = (20 + hsh(i) * 120) * smoke + (t > O.T.rise - O.T.ignite ? (t - (O.T.rise - O.T.ignite)) * 16 : 0);
      const cx = rx + side * spread * (0.4 + hsh(i + 9) * 0.6);
      const cy = gy - 6 - hsh(i + 5) * 26 * smoke;
      const r = (8 + hsh(i + 2) * 16) * smoke;
      disc(g, i % 3 ? '#e9e4de' : '#cfc8c0', cx, cy, r);
    }
    // the pad's ladder stays on the ground when the vehicle leaves
    const lx0 = rx - SH.CX + SH.LADDER.x0;
    const lx1 = rx - SH.CX + SH.LADDER.x1;
    const ltop = gy - 4 - SH.FEET + SH.LADDER.top;
    rect(g, '#5c5e66', lx0, ltop, 2, gy - 4 - ltop);
    rect(g, '#5c5e66', lx1 - 2, ltop, 2, gy - 4 - ltop);
    for (let y = ltop + 3; y < gy - 4; y += 5) rect(g, '#a39d94', lx0, y, lx1 - lx0, 1);
    // flames from the three bells (centre one larger)
    if (t > 0.4) {
      const grow = clamp01(t - 0.4);
      SH.NOZ.forEach((n, j) => {
        const fl = (j === 1 ? 34 : 24) + Math.sin(t * 45 + j * 2) * 4 + grow * (j === 1 ? 40 : 28);
        for (let i = 0; i < fl; i++) {
          const w = Math.max(2, Math.round(n.w * (1 - (i / fl) * 0.75)));
          rect(g, i < 5 ? '#fff6c8' : i < fl * 0.5 ? '#ffc233' : '#ff7a2a', rx - SH.CX + n.x - w / 2, top + n.y + i, w, 1);
        }
      });
    }
    drawShipAt(g, rx, feet, 1, false);
  }

  /* ---------------- 0) K2 trial: prelude, no text (crowds, news, close-up, countdown) ---------------- */
  /*
   * Pixel people in the game's sprite style: a 16x46 cell grid per figure, filled part by part (hair,
   * face, clothes, arms, legs), then lit from the left (lighter left edges, darker right edges) and
   * wrapped in a dark 1-cell outline, like the astronaut sprites. Each figure is built once per
   * (kind, seed, dark) and cached. Rows 0-15 leave room for a child on the shoulders, a raised phone
   * or a flag; the adult's head top is row 16. kinds: back | phone | child | cheer | flag | front
   */
  const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a0662f'];
  const HAIR = ['#2b1d14', '#4a3020', '#16120f', '#c99a4a', '#8a8a8a', '#7a2f1a', '#5a3a24'];
  const CLOTH = ['#d9472b', '#3b6fb6', '#3fae6a', '#e8b23a', '#8a4fb0', '#e9e6e0', '#3a3a46', '#e8722c', '#5bc0f0', '#c9342a', '#2f6b5a'];
  const PANTS = ['#2a3348', '#3b3f46', '#4a3b2a', '#22252b', '#5a6478', '#6b4a3a'];
  const FIG_W = 16;
  const FIG_H = 46;
  const OY = 16;
  const figCache = {};
  function tone(c, k) {
    const n = parseInt(c.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
    return '#' + ((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
  }
  function buildFigure(kind, seed, dark) {
    const key = kind + '|' + seed + '|' + dark;
    if (figCache[key]) return figCache[key];
    const pick = (arr, n) => arr[Math.floor(hsh(seed * 7 + n) * arr.length)];
    const pal = {
      H: pick(HAIR, 1), S: pick(SKIN, 2), C: pick(CLOTH, 3), P: pick(PANTS, 4), O: '#1f1d24',
      Q: pick(CLOTH, 5), h: pick(HAIR, 6), q: pick(PANTS, 7), K: '#26262e', L: '#bfe6ff', G: '#9aa0a8',
      E: '#16120f', M: '#a8443a', W: '#f2f2ee', T: '#c9342a', J: '#1f2a44', A: pick(CLOTH, 8)
    };
    const hairStyle = Math.floor(hsh(seed * 7 + 9) * 5); // short | long | bun | cap | grey ring
    const top = Math.floor(hsh(seed * 7 + 10) * 3); // tee | jacket | hoodie
    const grid = [];
    for (let y = 0; y < FIG_H; y++) grid.push(new Array(FIG_W).fill(null));
    const set = (x, y, k) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x >= 0 && x < FIG_W && y >= 0 && y < FIG_H) grid[y][x] = k;
    };
    const fill = (x0, y0, x1, y1, k) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, k);
    };
    const ell = (cx, cy, rx, ry, k) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, k);
        }
      }
    };
    const front = kind === 'front';
    if (!front) {
      fill(4, OY + 22, 7, OY + 28, 'P'); // legs
      fill(8, OY + 22, 11, OY + 28, 'P');
      fill(4, OY + 29, 7, OY + 29, 'O'); // shoes
      fill(8, OY + 29, 11, OY + 29, 'O');
    }
    fill(3, OY + 11, 12, OY + 11, front ? 'J' : 'C'); // torso, rounded shoulders
    fill(2, OY + 12, 13, OY + 21, front ? 'J' : 'C');
    if (front) {
      fill(7, OY + 11, 8, OY + 17, 'W'); // shirt and tie
      fill(7, OY + 12, 8, OY + 16, 'T');
    } else if (top === 1) {
      fill(7, OY + 12, 8, OY + 21, 'A'); // jacket stripe down the back
    } else if (top === 2) {
      ell(7.5, OY + 10.5, 3.5, 1.6, 'C'); // hoodie hood
    }
    const tee = !front && top === 0;
    const armDown = (x) => {
      fill(x, OY + 12, x + 1, OY + 20, front ? 'J' : 'C');
      if (tee) fill(x, OY + 16, x + 1, OY + 20, 'S');
      fill(x, OY + 21, x + 1, OY + 22, 'S');
    };
    const armUp = (x, dir) => {
      for (let y = OY - 1; y <= OY + 12; y++) {
        const xx = x + Math.round(((OY + 12 - y) / 13) * dir * 1.5);
        fill(xx, y, xx + 1, y, tee && y < OY + 5 ? 'S' : 'C');
      }
      fill(x + Math.round(dir * 1.5), OY - 3, x + Math.round(dir * 1.5) + 1, OY - 2, 'S');
    };
    if (kind === 'cheer') {
      armUp(0, -1);
      armUp(14, 1);
    } else if (kind === 'phone') {
      armDown(0);
      armUp(13, 0);
      fill(12, OY - 8, 15, OY - 3, 'K'); // phone, screen towards the viewer
      fill(13, OY - 7, 14, OY - 4, 'L');
    } else if (kind === 'flag') {
      armDown(0);
      armUp(13, 0);
      fill(14, OY - 15, 14, OY - 3, 'G'); // pole; the cloth is drawn waving by the crowd
    } else {
      armDown(0);
      armDown(14);
    }
    fill(6, OY + 9, 9, OY + 10, 'S'); // neck
    if (front) {
      ell(7.5, OY + 5, 4, 4.8, 'S');
      ell(7.5, OY + 1.5, 4.4, 2.2, 'H');
      fill(3, OY + 2, 3, OY + 6, 'H');
      fill(12, OY + 2, 12, OY + 6, 'H');
      set(5, OY + 5, 'E');
      set(10, OY + 5, 'E');
      fill(6, OY + 8, 9, OY + 8, 'M');
    } else {
      ell(7.5, OY + 5, 4, 4.8, 'H'); // from behind the head is mostly hair
      set(3, OY + 5, 'S');
      set(12, OY + 5, 'S'); // ears
      if (hairStyle === 1) fill(4, OY + 6, 11, OY + 13, 'H'); // long hair
      if (hairStyle === 2) ell(7.5, OY - 0.5, 2.2, 2, 'H'); // bun
      if (hairStyle === 3) {
        ell(7.5, OY + 2, 4.4, 2.6, 'A'); // cap
        fill(5, OY + 4, 10, OY + 4, 'A');
      }
      if (hairStyle === 4) {
        ell(7.5, OY + 4, 3.8, 3.8, 'S'); // bald top, grey ring: an older fan
        fill(4, OY + 6, 11, OY + 8, 'G');
      }
    }
    if (kind === 'child') {
      // a child on the shoulders, arms up
      fill(4, OY - 2, 5, OY + 3, 'q');
      fill(10, OY - 2, 11, OY + 3, 'q');
      fill(4, OY - 8, 11, OY - 1, 'Q');
      ell(7.5, OY - 11, 3, 3.4, 'h');
      for (let y = OY - 15; y <= OY - 7; y++) {
        set(2 - Math.round((OY - 7 - y) / 6), y, 'Q');
        set(13 + Math.round((OY - 7 - y) / 6), y, 'Q');
      }
      set(1, OY - 16, 'S');
      set(14, OY - 16, 'S');
    }
    // colour with light from the left, then a dark outline around the silhouette
    const cv = document.createElement('canvas');
    cv.width = FIG_W + 2;
    cv.height = FIG_H + 2;
    const g = cv.getContext('2d');
    const at = (x, y) => (y >= 0 && y < FIG_H && x >= 0 && x < FIG_W ? grid[y][x] : null);
    const night = (c) => (dark ? mix(c, '#0a1024', dark) : c);
    for (let y = 0; y < FIG_H; y++) {
      for (let x = 0; x < FIG_W; x++) {
        const k = grid[y][x];
        if (!k) continue;
        let c = pal[k];
        if (k !== 'L' && k !== 'E') {
          if (at(x + 1, y) !== k) c = tone(c, -0.3);
          else if (at(x - 1, y) !== k) c = tone(c, 0.22);
          else if (x >= 10) c = tone(c, -0.12);
          if (k === 'H' && (x + y) % 3 === 0) c = tone(c, 0.14); // hair strands
        }
        g.fillStyle = night(c);
        g.fillRect(x + 1, y + 1, 1, 1);
      }
    }
    g.fillStyle = night('#1b1622');
    for (let y = -1; y <= FIG_H; y++) {
      for (let x = -1; x <= FIG_W; x++) {
        if (at(x, y)) continue;
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
      }
    }
    figCache[key] = cv;
    return cv;
  }
  /** Draws a figure with its adult head top at (x, y), scale s. */
  function person(g, kind, x, y, s, seed, dark = 0) {
    const cv = buildFigure(kind, seed, Math.round(dark * 10) / 10);
    g.drawImage(cv, Math.round(x - s), Math.round(y - (OY + 1) * s), cv.width * s, cv.height * s);
  }
  const FLAGS = [['#3b6fb6', '#f2f2ee'], ['#d9472b', '#f2f2ee'], ['#3fae6a', '#e8b23a'], ['#e8722c', '#1f2a44'], ['#8a4fb0', '#ffc233']];
  function crowd(g, t, y0, cheer, seed, dark) {
    [{ y: y0, n: 32, s: 1 }, { y: y0 + 18, n: 21, s: 2 }, { y: y0 + 52, n: 13, s: 3 }].forEach((row, ri) => {
      for (let i = 0; i < row.n; i++) {
        const k = seed + ri * 100 + i;
        const h = hsh(k);
        const kind = cheer ? (h > 0.2 ? 'cheer' : h > 0.1 ? 'flag' : 'child') : h > 0.9 ? 'child' : h > 0.82 ? 'flag' : h > 0.6 ? 'phone' : 'back';
        const x = (i + 0.5) * (O.W / row.n) - 8 * row.s + (h - 0.5) * 10;
        const bob = cheer ? Math.round(Math.abs(Math.sin(t * 7 + h * 6)) * 2 * row.s) : Math.round(Math.sin(t * 1.5 + h * 6) * 0.5 * row.s);
        const y = row.y - bob;
        const dk = dark * (1 - ri * 0.3);
        if (kind === 'flag') {
          const fc = FLAGS[Math.floor(hsh(k + 3) * FLAGS.length)];
          for (let c = 0; c < 9; c++) {
            const wy = Math.round(Math.sin(t * 6 + c * 0.7) * 1.2);
            rect(g, mix(c < 4 ? fc[0] : fc[1], '#0a1024', dk), x + (15 + c) * row.s, y + (-15 + wy) * row.s, row.s, 5 * row.s);
          }
        }
        person(g, kind, x, y, row.s, k, dk);
        if (kind === 'phone' && hsh(Math.floor(t * 4) + k) > 0.93) {
          g.globalAlpha = 0.85;
          disc(g, '#ffffff', x + 14 * row.s, y - 6 * row.s, 3 * row.s); // camera flash
          g.globalAlpha = 1;
        }
      }
    });
  }
  /** A small live picture of the vehicle on its pad, for the giant screen, the TV and the phone. */
  function feed(g, x, y, w, h, t, lit) {
    const sky = ['#2b4a7a', '#5a5a8a', '#c9785a', '#f2b47a'];
    for (let i = 0; i < 4; i++) rect(g, sky[i], x, y + (i * h * 0.8) / 4, w, h * 0.2 + 1);
    rect(g, '#3d4a3a', x, y + h * 0.8, w, h * 0.2);
    const sc = (h * 0.7) / SH.H;
    const fy = y + h * 0.84;
    if (lit) rect(g, '#ffb84a', x + w / 2 - 3, fy - (SH.FEET - SH.BASE) * sc, 6, h * 0.08 + hsh(Math.floor(t * 20)) * 3);
    drawShipAt(g, x + w / 2, fy, sc, true);
    rect(g, '#d8262b', x + 3, y + 3, Math.max(8, w * 0.1), Math.max(4, h * 0.07)); // the red "live" tag, no letters
    if (Math.floor(t * 2) % 2) rect(g, '#ffffff', x + 5, y + 5, 2, 2);
  }

  function drawPrelude(g, t) {
    const W = O.W;
    const H = O.H;
    if (t < 2.4) {
      // 1) The crowd at the launch site at dawn, a giant screen, the stack on the pad far away
      const pan = Math.round(t * 6);
      for (let y = 0; y < 230; y += 4) rect(g, mix('#26406e', '#f0a46c', (y / 230) ** 1.6), 0, y, W, 4);
      disc(g, '#ffe9b0', 120, 214, 12);
      rect(g, '#28425e', 0, 222, W, 10);
      rect(g, '#3d4a3a', 0, 230, W, H - 230);
      // the stack, small, at the pad on the right
      const px = 470 - pan;
      rect(g, '#8a3412', px - 44, 100, 3, 130);
      rect(g, '#8a3412', px - 36, 100, 3, 130);
      drawShipAt(g, px, 230, 0.42, true);
      // the giant screen on a truss
      rect(g, '#2a2e36', 60 - pan, 46, 4, 150);
      rect(g, '#2a2e36', 236 - pan, 46, 4, 150);
      rect(g, '#0b0d12', 54 - pan, 40, 192, 112);
      feed(g, 60 - pan, 46, 180, 100, t, false);
      rect(g, '#4a4a50', 0, 246, W, 2); // fence
      for (let x = 0; x < W; x += 16) rect(g, '#4a4a50', x, 236, 2, 12);
      crowd(g, t, 250, false, 11, 0.35);
    } else if (t < 3.6) {
      // 2) The news at home: the family on the sofa, the TV showing the launch, lamp light
      const k = t - 2.4;
      rect(g, '#33232a', 0, 0, W, 240);
      rect(g, '#2a1d1a', 0, 240, W, H - 240);
      for (let x = 0; x < W; x += 16) rect(g, '#30221e', x, 240, 8, H - 240);
      rect(g, '#0f1830', 50, 36, 120, 88);
      rect(g, '#5a4448', 108, 36, 4, 88);
      disc(g, 'rgba(242,213,138,0.12)', 572, 120, 64);
      rect(g, '#f2d58a', 556, 84, 32, 16);
      rect(g, '#5a4448', 570, 100, 4, 120);
      const zx = Math.round(k * 6);
      rect(g, '#0a0a0e', 230 - zx, 56 - zx, 180 + zx * 2, 112 + zx);
      feed(g, 236 - zx, 62 - zx, 168 + zx * 2, 98 + zx, t, false);
      // the anchor in a corner box of the broadcast
      rect(g, '#14223f', 352 + zx, 66 - zx, 44, 40);
      g.save();
      g.beginPath();
      g.rect(352 + zx, 66 - zx, 44, 40);
      g.clip();
      person(g, 'front', 358 + zx, 70 - zx, 2, 7);
      g.restore();
      rect(g, '#3a2620', 240, 178, 160, 60);
      g.globalAlpha = 0.07 + 0.03 * Math.sin(t * 11);
      rect(g, '#8cb4ff', 0, 0, W, H);
      g.globalAlpha = 1;
      [146, 232, 314, 398].forEach((x, i) => person(g, i === 2 ? 'child' : 'back', x, 158 + (i === 2 ? 16 : 0), 3, 400 + i * 7, 0.25));
      rect(g, '#6a4442', 110, 214, 420, 30);
      rect(g, '#7a5452', 110, 214, 420, 3);
      rect(g, '#5a3a38', 120, 244, 400, 60);
    } else if (t < 4.6) {
      // 3) A phone held up in a busy street, streaming live, hearts floating up
      const k = t - 3.6;
      rect(g, '#1b2233', 0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        g.globalAlpha = 0.25;
        disc(g, hsh(i) > 0.5 ? '#f2b45a' : '#7aa8e8', hsh(i + 2) * W, hsh(i + 3) * H, 10 + hsh(i + 4) * 24);
      }
      g.globalAlpha = 1;
      crowd(g, t, 250, false, 77, 0.55);
      const x = 250;
      const y = 22 - Math.round(k * 6);
      rect(g, '#c48c6c', x - 18, y + 240, 56, 120);
      rect(g, '#2a2a30', x - 4, y - 4, 148, 276);
      rect(g, '#0a0a0e', x, y, 140, 268);
      feed(g, x + 8, y + 30, 124, 184, t, false);
      for (let i = 0; i < 7; i++) {
        const hy = y + 200 - ((t * 60 + i * 26) % 160);
        const hx = x + 108 + Math.round(Math.sin(t * 3 + i) * 5);
        const c = i % 2 ? '#ff5a7a' : '#ffc233';
        rect(g, c, hx, hy, 3, 2);
        rect(g, c, hx + 4, hy, 3, 2);
        rect(g, c, hx, hy + 2, 7, 2);
        rect(g, c, hx + 2, hy + 4, 3, 2);
      }
      rect(g, '#e8ecf2', x + 8, y + 226, 90, 4);
      rect(g, '#e8ecf2', x + 8, y + 236, 60, 4);
    } else {
      // 4) The camera closes in on the stack; three countdown lamps go red, then green; engines start to glow
      const k = (t - 4.6) / (O.T.ignite - 4.6);
      const z = 1 + 0.6 * ease(Math.min(1, k * 1.3));
      g.save();
      g.translate(320, 40);
      g.scale(z, z);
      g.translate(-320, -40);
      drawLiftoff(g, 0);
      g.restore();
      // vapour boiling off the stack
      for (let i = 0; i < 6; i++) {
        g.globalAlpha = 0.5;
        rect(g, '#f4f6fa', 300 + ((t * 40 + i * 37) % 120), 120 + i * 30 + Math.round(Math.sin(t * 3 + i) * 3), 10 + (i % 3) * 6, 3);
      }
      g.globalAlpha = 1;
      // countdown lamps, top right (no numbers): lit one by one, all green just before ignition
      const lamps = [5.3, 6.1, 6.9];
      lamps.forEach((at, i) => {
        const on = t >= at;
        const go = t >= 7.25;
        rect(g, '#10141c', 520 + i * 30, 24, 24, 24);
        disc(g, go ? '#3fe08a' : on ? '#ff4a3c' : '#3a2020', 532 + i * 30, 36, 8);
        if (on || go) disc(g, '#ffffff', 529 + i * 30, 33, 2);
      });
      // heartbeat: the frame darkens at the edges with each beat
      const beat = Math.max(0, 1 - ((t - 4.6) % 0.8) / 0.25);
      g.globalAlpha = 0.25 * beat;
      rect(g, '#2a0000', 0, 0, W, 18);
      rect(g, '#2a0000', 0, H - 18, W, 18);
      rect(g, '#2a0000', 0, 0, 18, H);
      rect(g, '#2a0000', W - 18, 0, 18, H);
      g.globalAlpha = 1;
    }
  }

  /** The climb above the atmosphere: the Earth's limb shrinks below, the booster falls away. */
  function drawAscent(g, k, t) {
    const W = O.W;
    const H = O.H;
    rect(g, '#03050b', 0, 0, W, H);
    for (let i = 0; i < 120; i++) rect(g, '#ffffff', hsh(i + 5) * W, hsh(i + 9) * H, 1, 1);
    const r = 560 - 420 * ease(k);
    const cy = H + r * 0.62 + 40 * k;
    // the Earth below: ocean, small continents and cloud bands (no polar cap: we see the limb, not a pole)
    const ex = W / 2 - 40 * k;
    disc(g, '#2f7bd8', ex, cy, r);
    for (let i = 0; i < 40; i++) {
      const a = Math.PI + hsh(i + 61) * Math.PI;
      const d = (0.55 + hsh(i + 62) * 0.42) * r;
      disc(g, i % 4 === 0 ? '#f2f4f8' : i % 3 ? '#3f9a4a' : '#9a7a4a', ex + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.03 + hsh(i + 63) * 0.05));
    }
    // thin blue atmosphere band on the limb
    g.globalAlpha = 0.35;
    g.strokeStyle = '#7fc0ff';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(W / 2 - 40 * k, cy, r + 5, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
    const x = 300 + k * 90;
    const y = 190 - k * 120;
    const img = shipImage(false);
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.rotate(0.45);
    const sc = 0.3;
    // engine plume from the bells (local y = 0 is the bottom of the centre bell)
    const fl = 18 + hsh(Math.floor(t * 20)) * 8;
    for (let i = 0; i < fl; i++) {
      const w = Math.max(2, Math.round(16 * sc * 2 * (1 - (i / fl) * 0.7)));
      rect(g, i < 4 ? '#fff6c8' : i < fl * 0.5 ? '#ffc233' : '#ff7a2a', -w / 2, i - 2, w, 1);
    }
    if (img) g.drawImage(img, Math.round(-SH.CX * sc), Math.round(-SH.BASE * sc), Math.round(SH.W * sc), Math.round(SH.H * sc));
    g.restore();
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
    const img = shipImage(false);
    if (img && arr < 0.7) {
      const p = curve(u);
      const q = curve(Math.min(1, u + 0.01));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const sc = 0.2 * (1 - arr * 0.8);
      g.save();
      g.translate(Math.round(p.x), Math.round(p.y));
      g.rotate(ang + Math.PI / 2);
      // local y = 0 is the bottom of the centre bell; the engine glow trails behind it
      const glow = 10 + Math.sin(t * 30) * 2;
      for (let i = 0; i < glow; i++) {
        g.fillStyle = i < 3 ? '#ffffff' : i < glow / 2 ? '#9fe6ff' : '#3f7fd8';
        const w = Math.max(1, Math.round(8 * (1 - i / glow)));
        g.fillRect(-Math.floor(w / 2), i, w, 1);
      }
      g.drawImage(img, Math.round(-SH.CX * sc), Math.round(-SH.BASE * sc), Math.round(SH.W * sc), Math.round(SH.H * sc));
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
    if (t < O.T.ignite) drawPrelude(g, t);
    else if (t < O.T.ascent) {
      const lt = t - O.T.ignite;
      drawLiftoff(g, lt);
      // the crowd in the foreground: watching at ignition, arms up and cheering once it rises;
      // they slide down out of frame as the camera follows the rocket
      const cam = Math.max(0, riseLocal(lt) - 150) * 0.55;
      crowd(g, t, 326 + cam, lt > O.T.rise - O.T.ignite + 0.2, 91, 0.45);
    }
    else if (t < O.T.cruise) {
      drawAscent(g, (t - O.T.ascent) / (O.T.cruise - O.T.ascent), t);
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
