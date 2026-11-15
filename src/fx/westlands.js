/**
 * SOL 14: RED HORIZON — K2 TRIAL (local): the western ice field and the trails to the wrecks.
 * Walking west past the MAV the land turns step by step from rust dust to frost to an ice field,
 * the visor frosts over, and a giant ice wall closes the map. Signs lead to the western wrecks:
 * Spirit's tracks with the furrow of its dragged wheel, Phoenix's heat-shield mark and parachute,
 * Beagle 2's airbag bounces; craters and debris lead to a lost cargo lander (FICTIONAL) whose
 * parts can be picked up. To the east, tracks and craters lead to each eastern wreck.
 * Drawn over K4's sky/ridges/ground, in the same 640x360 pixel grid. Numbers: data terrain.westRegion.
 * Hooked from effects.js (two calls); pick-ups and messages live in core/surface.js.
 */
(function (S) {
  'use strict';
  const West = {};

  // Same tile hash as art.js, so frost lands on K4's rocks exactly where they are drawn.
  function hash(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }
  const cfg = () => S.DATA.terrain.westRegion || null;
  const toScreen = (px, camX) => Math.round(px - camX);

  /* ---------------- Land: the gradual change to ice ---------------- */
  West.drawLand = function (ctx, s, camX, W, H, GY, t) {
    const w = cfg();
    if (!w) return;
    const Surf = S.Surface;
    // Nothing to do while the whole view is east of the frost line.
    if (Surf.iciness(Surf.pxToM(camX)) <= 0 && !hasEastTrailInView(camX, W)) return;

    // 1. Atmosphere and ground, column by column, as iciness rises westwards:
    //    a cold haze that thickens towards the horizon, frosted distant ridges, and frost that
    //    starts as patches over the rust and closes into a pale pink-grey ice crust.
    // one smooth haze from the top of the sky down to the horizon, thickest low down
    const haze = ctx.createLinearGradient(0, 0, 0, GY);
    haze.addColorStop(0, 'rgba(122,150,196,0.10)');
    haze.addColorStop(0.45, 'rgba(140,168,210,0.22)');
    haze.addColorStop(0.78, 'rgba(188,206,230,0.40)');
    haze.addColorStop(1, 'rgba(206,218,236,0.48)');
    for (let x = 0; x < W; x += 2) {
      const wx = x + camX;
      const k = Surf.iciness(Surf.pxToM(wx));
      if (k <= 0) continue;
      // recolour K4's rust ridges and ground towards ice blue, keeping their light and shade
      // ('color' blending takes hue and saturation from the fill, brightness from what is below)
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = Math.min(1, k * 1.15) * 0.8;
      ctx.fillStyle = '#9cc4ea';
      ctx.fillRect(x, 0, 2, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = k;
      ctx.fillStyle = haze;
      ctx.fillRect(x, 0, 2, GY);
      ctx.globalAlpha = 1;
      // patchy at first: a slow noise along the ground decides where frost has settled;
      // the patches grow and join as the ice thickens
      const patch = 0.5 + 0.5 * Math.sin(wx * 0.045) * Math.sin(wx * 0.013 + 1.7);
      const c = Math.min(1, Math.max(0, k * 1.3 + (patch - 0.5) * 0.6 * (1 - k)));
      const cover = c * c * (3 - 2 * c);
      if (cover > 0.01) {
        ctx.fillStyle = 'rgba(221,214,222,' + (0.62 * cover).toFixed(3) + ')';
        ctx.fillRect(x, GY, 2, H - GY);
        ctx.fillStyle = 'rgba(242,246,252,' + (0.8 * cover).toFixed(3) + ')';
        ctx.fillRect(x, GY, 2, 2);
      }
    }

    // 2. Ground texture: frost streaks, blue cracks, frosted rocks, glints, ice chunks.
    const startTile = Math.floor(camX / 8) - 1;
    for (let i = startTile; i < startTile + W / 8 + 2; i++) {
      const k = Surf.iciness(Surf.pxToM(i * 8));
      if (k <= 0) continue;
      const sx = Math.round(i * 8 - camX);
      const r = hash(i);
      if (hash(i + 31) < 0.55 * k) {
        ctx.fillStyle = 'rgba(250,253,255,0.85)';
        ctx.fillRect(sx, GY + 5 + Math.floor(hash(i + 7) * 46), 4 + Math.floor(hash(i + 2) * 6), 1);
      }
      if (hash(i + 41) > 1 - 0.3 * k) {
        ctx.fillStyle = '#7fb3dc';
        const cy = GY + 8 + Math.floor(hash(i + 13) * 40);
        ctx.fillRect(sx, cy, 3, 1);
        ctx.fillRect(sx + 3, cy + 1, 2, 1);
      }
      if (r > 0.86 && k > 0.25) {
        // K4's rock at this tile: give it a frost cap
        const ry = GY + 4 + Math.floor(hash(i + 9) * 40);
        ctx.fillStyle = 'rgba(245,250,255,' + Math.min(1, k * 1.3).toFixed(2) + ')';
        ctx.fillRect(sx, ry - 1, 5, 1);
      }
      if (k > 0.4 && hash(i + 11) > 0.965) {
        const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
        ctx.fillStyle = 'rgba(255,255,255,' + (tw * k).toFixed(2) + ')';
        ctx.fillRect(sx + 3, GY + 3 + Math.floor(hash(i + 17) * 30), 1, 1);
      }
      if (k > 0.55 && hash(i + 21) > 0.94) drawIceChunk(ctx, sx, GY, hash(i + 23), k);
      // close to the wall the ice piles up into hills: the foothills of the ice mountain
      const g = giantness(Surf.pxToM(i * 8));
      if (g > 0 && hash(i + 61) > 0.86 - 0.3 * g) drawIceHill(ctx, sx, GY, hash(i + 67), g);
    }

    // 3. Diamond dust: a few ice crystals drifting in the air over the ice field.
    for (let n = 0; n < 40; n++) {
      const x = Math.floor((hash(n + 101) * W + t * (6 + hash(n + 5) * 10)) % W);
      const k = Surf.iciness(Surf.pxToM(x + camX));
      if (k < 0.45) continue;
      const y = Math.floor(60 + hash(n + 203) * 220 + Math.sin(t * 0.8 + n) * 6);
      ctx.fillStyle = 'rgba(235,246,255,' + (0.6 * (k - 0.45) / 0.55).toFixed(2) + ')';
      ctx.fillRect(x, y, 1, 1);
    }

    // 4. Marks on the ground that lead somewhere: tyre tracks and impact craters.
    drawWestTracks(ctx, camX, W, GY);
    for (const c of w.craters) drawCrater(ctx, toScreen(Surf.mToPx(-c.atM), camX), GY, c.widthPx, Surf.iciness(-c.atM), c.atM);
    // Phoenix: the heat shield hit the ground apart from the lander (HiRISE saw all three pieces)
    const hs = w.phoenixSigns.heatShieldAtM;
    drawCrater(ctx, toScreen(Surf.mToPx(-hs), camX), GY, 22, 1, hs);
    // Beagle 2: airbag bounce dents, closer and closer together until it came to rest
    w.beagleBounces.forEach((m, n) => drawBounce(ctx, toScreen(Surf.mToPx(-m), camX), GY, 16 - n * 3));
    drawEastTrails(ctx, camX, W, GY);

    // 5. Ice landforms (back layer; their front edges are drawn in drawObjects, over what hides in them)
    drawPolygons(ctx, camX, W, H, GY);
    for (const m of w.iceVoids) drawVoidBack(ctx, toScreen(Surf.mToPx(-m), camX), GY);
    drawCaveBack(ctx, toScreen(Surf.mToPx(-w.iceCave.atM), camX), GY);
    drawGlacier(ctx, camX, W, GY);
    drawShelterBack(ctx, camX, W, GY, t);
  };

  /* ---------------- Ice landforms ---------------- */
  function recesses() {
    const w = cfg();
    const list = w.parts.filter((p) => p.hiddenIn === 'overhang').map((p) => ({ atM: p.atM, w: 30, h: 22 }));
    list.push({ atM: w.beagleOverhangM, w: 54, h: 32 });
    return list;
  }

  /** Ice-rich polygons: a net of shallow troughs with frost in them, cells slightly domed. */
  function drawPolygons(ctx, camX, W, H, GY) {
    const p = cfg().polygons;
    const Surf = S.Surface;
    const a = Surf.mToPx(-p.toM);
    const b = Surf.mToPx(-p.fromM);
    if (b < camX - 4 || a > camX + W + 4) return;
    const fade = (px) => Math.min(1, (px - a) / 80, (b - px) / 80);
    const rows = [
      { y0: GY + 3, y1: GY + 16, cw: 26, off: 0 },
      { y0: GY + 16, y1: GY + 34, cw: 36, off: 13 },
      { y0: GY + 34, y1: H, cw: 48, off: 5 }
    ];
    for (const r of rows) {
      const first = Math.floor((Math.max(a, camX - 50) - r.off) / r.cw);
      const last = Math.ceil((Math.min(b, camX + W + 50) - r.off) / r.cw);
      for (let i = first; i <= last; i++) {
        const x0 = i * r.cw + r.off + Math.round((hash(i * 3.1 + r.cw) - 0.5) * 8);
        const x1 = (i + 1) * r.cw + r.off + Math.round((hash((i + 1) * 3.1 + r.cw) - 0.5) * 8);
        const f = fade((x0 + x1) / 2);
        if (f <= 0) continue;
        // domed centre
        ctx.fillStyle = 'rgba(248,252,255,' + (0.35 * f).toFixed(2) + ')';
        ctx.fillRect(Math.round(x0 - camX) + 5, r.y0 + 3, Math.max(2, x1 - x0 - 10), Math.max(1, Math.round((r.y1 - r.y0) * 0.35)));
        // trough along the top of the row
        const wob = Math.round((hash(i + r.cw * 7) - 0.5) * 3);
        ctx.fillStyle = 'rgba(92,128,168,' + (0.75 * f).toFixed(2) + ')';
        ctx.fillRect(Math.round(x0 - camX), r.y0 + wob, x1 - x0, 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * f).toFixed(2) + ')';
        ctx.fillRect(Math.round(x0 - camX), r.y0 + wob + 2, x1 - x0, 1);
        // slanted trough on the left edge of the cell
        const lean = (hash(i * 5.3 + r.off) - 0.5) * 10;
        for (let y = r.y0; y < r.y1; y += 2) {
          const xx = Math.round(x0 - camX + lean * ((y - r.y0) / (r.y1 - r.y0)));
          ctx.fillStyle = 'rgba(92,128,168,' + (0.75 * f).toFixed(2) + ')';
          ctx.fillRect(xx, y, 2, 2);
          ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * f).toFixed(2) + ')';
          ctx.fillRect(xx + 2, y, 1, 2);
        }
      }
    }
  }

  /** A collapse pit: the ice under the ground sublimated away and left a hollow. */
  // Jagged outline of a collapse pit, shared by its back and front halves.
  const VOID_R = 24;
  function voidEdges(sx, x) {
    const e = Math.sqrt(Math.max(0, 1 - Math.pow(x / (VOID_R + 1), 2)));
    const j1 = Math.round((hash(sx * 0.13 + x * 1.7) - 0.5) * 2);
    const j2 = Math.round((hash(sx * 0.29 + x * 2.3) - 0.5) * 3);
    return { e, top: GY_OFF.top + Math.round((1 - e) * 5) + j1, bot: GY_OFF.bot - Math.round((1 - e) * 6) + j2 };
  }
  const GY_OFF = { top: 3, bot: 16 };

  function drawVoidBack(ctx, sx, GY) {
    if (sx < -50 || sx > 690) return;
    // cracks running out from the rim across the frozen ground
    ctx.fillStyle = '#7fb3dc';
    for (let c = 0; c < 4; c++) {
      const side = c % 2 ? 1 : -1;
      const len = 6 + Math.floor(hash(sx + c * 11) * 10);
      const y0 = GY + 5 + Math.floor(hash(sx + c * 5) * 8);
      for (let i = 0; i < len; i++) ctx.fillRect(sx + side * (VOID_R - 2 + i), y0 + Math.round(Math.sin(i * 0.9 + c) * 1.2), 1, 1);
    }
    for (let x = -VOID_R; x <= VOID_R; x += 2) {
      const { e, top, bot } = voidEdges(sx, x);
      if (bot <= top) continue;
      // the dark depth of the hole
      ctx.fillStyle = '#1f3d63';
      ctx.fillRect(sx + x, GY + top, 2, bot - top);
      // the far wall: layered ice, lit from above
      const wall = Math.max(2, Math.round(7 * e));
      for (let y = 0; y < wall; y++) {
        ctx.fillStyle = y % 3 === 0 ? '#d4ecfc' : y % 3 === 1 ? '#9fcbec' : '#6f9fcb';
        ctx.fillRect(sx + x, GY + top + y, 2, 1);
      }
      // snowy rim on the far side
      ctx.fillStyle = '#f6fbff';
      ctx.fillRect(sx + x, GY + top - 1, 2, 1);
    }
    // frosted rubble that broke off the rim
    for (let i = 0; i < 5; i++) {
      const rx = sx + Math.round((hash(sx + i * 3.3) - 0.5) * (VOID_R * 2.6));
      const ry = GY + 2 + Math.floor(hash(sx + i * 7.1) * 14);
      ctx.fillStyle = '#9aa7b5';
      ctx.fillRect(rx, ry, 3, 2);
      ctx.fillStyle = '#f2f8ff';
      ctx.fillRect(rx, ry - 1, 3, 1);
    }
  }
  function drawVoidFront(ctx, sx, GY) {
    if (sx < -50 || sx > 690) return;
    // the near rim, a little overhanging: it hides the lower part of whatever fell in
    for (let x = -VOID_R; x <= VOID_R; x += 2) {
      const { bot } = voidEdges(sx, x);
      ctx.fillStyle = '#5f8db6';
      ctx.fillRect(sx + x, GY + bot - 3, 2, 1);
      ctx.fillStyle = '#e4f1fb';
      ctx.fillRect(sx + x, GY + bot - 2, 2, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + x, GY + bot - 2, 2, 1);
    }
  }

  /*
   * A huge ice bank (FICTIONAL) with the lost lander sealed inside. Until the player breaks it,
   * a thick plug of ice fills the mouth: the lander shows only as a faint shadow, and every hit
   * adds cracks. Back half here (drawLand); the plug, cracks and chips in drawCaveFront.
   */
  const BANK_W = 86;
  const BANK_H = 88;
  const MOUTH_W = 36;
  const MOUTH_H = 48;
  const mouthH = (x) => Math.round(MOUTH_H * Math.sqrt(Math.max(0, 1 - Math.pow(x / (MOUTH_W + 1), 2))));

  function drawCaveBack(ctx, sx, GY) {
    if (sx < -BANK_W - 10 || sx > 640 + BANK_W + 10) return;
    for (let x = -BANK_W; x <= BANK_W; x += 2) {
      const e = 1 - Math.pow(Math.abs(x) / BANK_W, 1.7);
      const h = Math.round(BANK_H * e + Math.sin((x + 9) * 0.21) * 3 * e);
      if (h <= 0) continue;
      ctx.fillStyle = x < -10 ? '#a8cfee' : x < 30 ? '#8fbbe0' : '#7aa6d1';
      ctx.fillRect(sx + x, GY + 2 - h, 2, h);
      ctx.fillStyle = '#f4faff';
      ctx.fillRect(sx + x, GY + 2 - h, 2, 3);
      for (let b = 1; b < 4; b++) {
        ctx.fillStyle = 'rgba(70,110,155,0.3)';
        ctx.fillRect(sx + x, GY + 2 - Math.round(h * b * 0.24) + Math.round(Math.sin(x * 0.1 + b) * 2), 2, 1);
      }
    }
    // the hollow inside: deep blue, darkest at the back
    for (let x = -MOUTH_W; x <= MOUTH_W; x += 2) {
      const h = mouthH(x);
      ctx.fillStyle = '#5d8dbf';
      ctx.fillRect(sx + x, GY + 2 - h - 2, 2, 2);
      ctx.fillStyle = '#2a4d78';
      ctx.fillRect(sx + x, GY + 2 - h, 2, h);
      ctx.fillStyle = '#1d3a60';
      ctx.fillRect(sx + x, GY + 2 - Math.round(h * 0.7), 2, Math.round(h * 0.7));
    }
  }

  /**
   * Ice blocks across the glacier path, each taller than the last. Until dug through they stop the
   * player (core/surface.js); each hit adds cracks on the east face. Once open, a tunnel is cut
   * through at ground level.
   */
  /** Tünelin tavan yüksekliği (px): ortada 48, kenarlarda 42 */
  const tunnelH = (x, half) => 42 + Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(x / (half + 2), 2))) * 6);
  /** Açılmış bloklarda tünelin üstündeki buz, astronotun önünde: çömelen astronot tünelin içinden geçer */
  function drawTunnelFront(ctx, s, camX, W, GY) {
    const open = (s.salvage && s.salvage.barriersOpen) || [];
    cfg().iceBarriers.forEach((b, i) => {
      if (!open.includes(i)) return;
      const cx = toScreen(S.Surface.mToPx(-b.atM), camX);
      if (cx < -60 || cx > W + 60) return;
      const half = 14;
      const tall = 72 + i * 18;
      for (let x = -half; x <= half; x += 2) {
        const h = tall - Math.round(Math.abs(x) * 0.8) + Math.round((hash(b.atM + x) - 0.5) * 10);
        const top = GY + 2 - h;
        const ceil = GY + 2 - tunnelH(x, half);
        ctx.fillStyle = x < -4 ? '#b6d9f3' : x < 6 ? '#93c0e4' : '#6f9fcb';
        ctx.fillRect(cx + x, top, 2, ceil - top);
        ctx.fillStyle = '#f4faff';
        ctx.fillRect(cx + x, top, 2, 2);
        ctx.fillStyle = '#5d8dbf';
        ctx.fillRect(cx + x, ceil - 2, 2, 2);
      }
    });
  }

  function drawBarriers(ctx, s, camX, W, GY) {
    const w = cfg();
    if (!w.iceBarriers) return;
    const sv = s.salvage || {};
    const open = sv.barriersOpen || [];
    const hitsBy = sv.barrierHits || {};
    w.iceBarriers.forEach((b, i) => {
      const cx = toScreen(S.Surface.mToPx(-b.atM), camX);
      if (cx < -60 || cx > W + 60) return;
      const half = 14;
      const tall = 72 + i * 18;
      // the block: jagged top, layered blue ice, lit west / shaded east
      for (let x = -half; x <= half; x += 2) {
        const h = tall - Math.round(Math.abs(x) * 0.8) + Math.round((hash(b.atM + x) - 0.5) * 10);
        const top = GY + 2 - h;
        ctx.fillStyle = x < -4 ? '#b6d9f3' : x < 6 ? '#93c0e4' : '#6f9fcb';
        ctx.fillRect(cx + x, top, 2, h);
        ctx.fillStyle = '#f4faff';
        ctx.fillRect(cx + x, top, 2, 2);
        for (let k = 1; k < 5; k++) {
          ctx.fillStyle = 'rgba(70,110,155,0.3)';
          ctx.fillRect(cx + x, top + Math.round((h * k) / 5), 2, 1);
        }
      }
      // frost drift against both sides
      ctx.fillStyle = '#e6f3fc';
      ctx.fillRect(cx - half - 6, GY - 3, half * 2 + 12, 5);
      if (open.includes(i)) {
        // the tunnel dug through
        for (let x = -half - 1; x <= half; x += 2) {
          const th = tunnelH(x, half); // çömelen astronot (~44 px) sığar, ayakta (58 px) sığmaz
          ctx.fillStyle = '#2e5a8a';
          ctx.fillRect(cx + x, GY + 2 - th, 2, th);
          ctx.fillStyle = '#5d8dbf';
          ctx.fillRect(cx + x, GY + 2 - th, 2, 2);
        }
        ctx.fillStyle = '#d6ecfb';
        ctx.fillRect(cx - half - 1, GY - 1, half * 2 + 2, 3);
        for (let r = 0; r < 6; r++) {
          ctx.fillStyle = r % 2 ? '#c4e3fa' : '#8fbde2'; // dug-out chunks piled to the east
          ctx.fillRect(cx + half + 3 + r * 4, GY - 1 - (r % 3), 4, 3 + (r % 3));
        }
      } else {
        // cracks spreading from the east face with every hit
        const hits = hitsBy[i] || 0;
        ctx.fillStyle = '#3f6d9c';
        for (let c = 0; c < hits * 2; c++) {
          let x = half - 1;
          let y = -6 - Math.floor(hash(c * 4.1 + i) * 40);
          const len = 5 + hits * 2 + Math.floor(hash(c * 2.7 + i) * 6);
          for (let k = 0; k < len; k++) {
            x -= hash(c * 31 + k + i) > 0.5 ? 1 : 0;
            y += hash(c * 17 + k + i) > 0.5 ? 1 : -1;
            if (x < -half) break;
            ctx.fillRect(cx + x, GY + y, 1, 1);
          }
        }
      }
    });
  }

  /*
   * Snow on the wrecks in the ice field. K4 draws the wreck sprites; here, for each sprite, two
   * masks are built once off screen with canvas compositing (no pixel reads, so it also works
   * from file://): a pale frost over the whole silhouette, and a snow cap on every upward-facing
   * edge (the silhouette minus itself moved down a few pixels).
   */
  const snowCache = {};
  function snowMasks(key) {
    if (snowCache[key] !== undefined) return snowCache[key];
    const img = S.Sprites.get(key);
    if (!img || typeof document === 'undefined') return (snowCache[key] = null);
    const make = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      return c;
    };
    const sil = make();
    let g = sil.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#f6fbff';
    g.fillRect(0, 0, sil.width, sil.height);
    const cap = make();
    g = cap.getContext('2d');
    g.drawImage(sil, 0, 0);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(sil, 0, 4);
    const shade = make(); // a thin blue line under the snow, so the cap reads as a layer
    g = shade.getContext('2d');
    g.drawImage(sil, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#9cc4e6';
    g.fillRect(0, 0, shade.width, shade.height);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(sil, 0, 5);
    return (snowCache[key] = { sil, cap, shade, w: img.width, h: img.height });
  }
  function drawWreckSnow(ctx, s, camX, W, GY) {
    if (!S.Forensics || !S.Forensics.cases) return;
    for (const c of S.Forensics.cases()) {
      // Araçlar hazır görünmez: kazılıp ortaya çıkmayan enkazın karlı silueti de çizilmez
      if (!(c.distanceM < 0) || !S.Forensics.identified(s, c)) continue;
      const k = S.Surface.iciness(c.distanceM);
      if (k <= 0) continue;
      const sx = toScreen(S.Surface.mToPx(c.distanceM), camX);
      const m = snowMasks(c.sprite);
      if (!m || sx < -m.w || sx > W + m.w) continue;
      const x = Math.round(sx - m.w / 2);
      const y = GY - m.h + 4;
      const a = Math.min(1, k * 1.2);
      ctx.save();
      ctx.globalAlpha = 0.28 * a;
      ctx.drawImage(m.sil, x, y); // frost over everything
      ctx.globalAlpha = a;
      ctx.drawImage(m.shade, x, y + 1);
      ctx.drawImage(m.cap, x, y);
      ctx.restore();
      // a snow drift banked against the wheels or legs
      ctx.globalAlpha = 0.9 * a;
      ctx.fillStyle = '#eef7ff';
      ctx.fillRect(x - 4, GY - 3, m.w + 8, 5);
      ctx.fillRect(x + 4, GY - 6, Math.round(m.w * 0.4), 3);
      ctx.fillStyle = '#b8d8f0';
      ctx.fillRect(x - 4, GY + 2, m.w + 8, 1);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * A Deep Space 2 microprobe (FICTIONAL placement), frozen in at the foot of the mountain: only
   * its aftbody and whip antenna stick out of a frost mound. From afar nothing shows; within
   * revealM a glint every few seconds gives it away. Dug out, an empty hole is left.
   */
  function drawProbe(ctx, s, camX, W, GY, t) {
    const p = cfg().finalProbe;
    if (!p) return;
    const sx = toScreen(S.Surface.mToPx(-p.atM), camX);
    if (sx < -30 || sx > W + 30) return;
    const sv = s.salvage || {};
    if (sv.probeFound) {
      ctx.fillStyle = '#2a4d78';
      ctx.fillRect(sx - 4, GY - 1, 9, 3);
      ctx.fillStyle = '#e6f3fc';
      ctx.fillRect(sx - 9, GY - 3, 4, 3);
      ctx.fillRect(sx + 6, GY - 2, 5, 2);
      return;
    }
    // frost mound
    ctx.fillStyle = '#e6f3fc';
    ctx.fillRect(sx - 12, GY - 4, 25, 6);
    ctx.fillRect(sx - 7, GY - 7, 15, 3);
    ctx.fillStyle = '#b8d8f0';
    ctx.fillRect(sx - 12, GY + 1, 25, 1);
    // aftbody: a short grey cylinder, a dark band, the whip antenna
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(sx - 2, GY - 13, 5, 7);
    ctx.fillStyle = '#c9d0d8';
    ctx.fillRect(sx - 2, GY - 13, 1, 7);
    ctx.fillStyle = '#4a4f57';
    ctx.fillRect(sx - 2, GY - 10, 5, 1);
    ctx.fillStyle = '#7d858f';
    ctx.fillRect(sx + 1, GY - 21, 1, 8);
    ctx.fillStyle = '#f6fbff'; // frost on its top
    ctx.fillRect(sx - 2, GY - 14, 5, 1);
    // cracks in the mound as it is dug
    const hits = sv.probeHits || 0;
    ctx.fillStyle = '#5f8db6';
    for (let c = 0; c < hits * 2; c++) {
      const cx = sx - 10 + Math.floor(hash(c * 3.7) * 20);
      ctx.fillRect(cx, GY - 5 + Math.floor(hash(c * 5.3) * 5), 2 + Math.floor(hash(c + 9) * 3), 1);
    }
    // the glint that gives it away up close
    const dist = Math.abs(-s.player.x - p.atM);
    if (dist < p.revealM) {
      const ph = (t % 2.6) / 2.6;
      if (ph < 0.25) {
        const a = Math.sin((ph / 0.25) * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
        ctx.fillRect(sx + 1, GY - 25, 1, 7);
        ctx.fillRect(sx - 2, GY - 22, 7, 1);
        ctx.fillRect(sx, GY - 23, 3, 3);
      }
    }
  }

  // ice chips flying off on each hit
  const chips = [];
  let lastT = null;
  if (S.bus) {
    S.bus.on('ice:hit', (p) => {
      const n = 10 + p.hits * 2;
      for (let i = 0; i < n; i++) {
        chips.push({
          x: p.px + (p.barrier ? 12 : MOUTH_W - 4) + Math.random() * 6,
          y: S.Surface.GROUND_Y - 6 - Math.random() * 30,
          vx: 20 + Math.random() * 60,
          vy: -30 - Math.random() * 50,
          life: 0.8 + Math.random() * 0.6
        });
      }
      if (S.FX) S.FX.shake = Math.max(S.FX.shake || 0, p.hits >= p.total ? 1.2 : 0.35);
    });
  }

  function drawCaveFront(ctx, s, sx, GY, t, dt) {
    const sv = s.salvage || {};
    if (sx > -BANK_W - 10 && sx < 640 + BANK_W + 10) {
      if (!sv.iceBroken) {
        // the plug: thick, frosted ice in the mouth, almost opaque
        const hits = sv.iceHits || 0;
        for (let x = -MOUTH_W; x <= MOUTH_W; x += 2) {
          const h = mouthH(x);
          ctx.fillStyle = 'rgba(176,212,240,0.9)';
          ctx.fillRect(sx + x, GY + 2 - h, 2, h);
          if (hash(x * 0.7 + 3) > 0.7) {
            ctx.fillStyle = 'rgba(255,255,255,0.55)'; // frost streaks
            ctx.fillRect(sx + x, GY + 2 - Math.round(h * hash(x + 5)), 2, 3);
          }
        }
        ctx.fillStyle = 'rgba(232,245,255,0.9)';
        ctx.fillRect(sx - MOUTH_W, GY - 2, MOUTH_W * 2 + 2, 4);
        // cracks: more and longer with every hit, starting where the player strikes (east side)
        ctx.fillStyle = '#3f6d9c';
        for (let c = 0; c < hits * 3; c++) {
          let x = MOUTH_W - 4;
          let y = -8 - Math.floor(hash(c * 4.1) * 30);
          const len = 6 + hits * 3 + Math.floor(hash(c * 2.7) * 8);
          for (let i = 0; i < len; i++) {
            x -= 1 + (hash(c * 31 + i) > 0.6 ? 1 : 0);
            y += hash(c * 17 + i) > 0.5 ? 1 : -1;
            if (x < -MOUTH_W + 2 || -y > mouthH(x) - 2) break;
            ctx.fillRect(sx + x, GY + y, 1, 1);
          }
        }
        if (hits > 0) {
          ctx.fillStyle = '#e8f6ff'; // a few loose shards at the foot
          for (let i = 0; i < hits; i++) ctx.fillRect(sx + MOUTH_W + 2 + i * 3, GY - 1 - (i % 2), 2, 2);
        }
      } else {
        // broken open: blue shade inside, icicles on the arch, shards on the ground
        ctx.fillStyle = 'rgba(20,44,80,0.28)';
        for (let x = -MOUTH_W; x <= MOUTH_W; x += 2) ctx.fillRect(sx + x, GY + 2 - mouthH(x), 2, mouthH(x));
        ctx.fillStyle = '#d6ecfb';
        for (let x = -MOUTH_W + 3; x <= MOUTH_W - 3; x += 6) {
          const len = 3 + Math.floor(hash(x + 77) * 8);
          const top = GY + 2 - mouthH(x);
          ctx.fillRect(sx + x, top, 2, len);
          ctx.fillRect(sx + x, top + len, 1, 2);
        }
        for (let i = 0; i < 14; i++) {
          const bx = sx + MOUTH_W - 10 + Math.floor(hash(i * 3.3) * 40);
          const bh = 2 + Math.floor(hash(i * 5.1) * 4);
          ctx.fillStyle = i % 3 ? '#c4e3fa' : '#8fbde2';
          ctx.fillRect(bx, GY + 2 - bh, 3 + Math.floor(hash(i * 7.7) * 4), bh);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bx, GY + 2 - bh, 2, 1);
        }
      }
    }
    // chips
    for (let i = chips.length - 1; i >= 0; i--) {
      const p = chips[i];
      p.life -= dt;
      if (p.life <= 0) {
        chips.splice(i, 1);
        continue;
      }
      p.vy += 90 * dt;
      p.x += p.vx * dt;
      p.y = Math.min(GY + 1, p.y + p.vy * dt);
      ctx.fillStyle = 'rgba(232,246,255,' + Math.min(1, p.life * 1.5).toFixed(2) + ')';
      ctx.fillRect(Math.round(p.x - S.FX.camX), Math.round(p.y), 2, 2);
    }
  }

  /**
   * A debris-covered glacier from its edge to the mountain: ice under a cap of rock and dust.
   * At its eastern edge a steep scarp shows bare blue ice in layers; along it, hollows under the
   * rock cover hide things in shadow.
   */
  function glacierHeight(px, east) {
    const d = east - px;
    if (d < 0) return 0;
    return Math.round(Math.min(1, d / 8) * (54 + Math.min(50, d * 0.12)) + Math.sin(px * 0.045) * 3);
  }
  function drawGlacier(ctx, camX, W, GY) {
    const g = cfg().glacier;
    const Surf = S.Surface;
    const east = Surf.mToPx(-g.fromM);
    const west = Surf.mToPx(-g.toM) - 60;
    if (east < camX - 4 || west > camX + W + 4) return;
    for (let px = Math.floor(Math.max(west, camX - 4) / 2) * 2; px <= Math.min(east, camX + W + 4); px += 2) {
      const sx = Math.round(px - camX);
      const h = glacierHeight(px, east);
      if (h <= 0) continue;
      const top = GY + 2 - h;
      const scarp = east - px < 26; // the exposed ice face
      // the ice body: blue-white ice, layered, with a few grey rocks frozen into it
      ctx.fillStyle = scarp ? '#86b9e2' : px % 4 ? '#a9cbe8' : '#a2c5e3';
      ctx.fillRect(sx, top, 2, h);
      for (let b = 1; b < 5; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(60,100,150,' + (scarp ? 0.45 : 0.25) + ')' : 'rgba(240,248,255,0.5)';
        ctx.fillRect(sx, top + 8 + b * Math.round(h / 6) + Math.round(Math.sin(px * 0.07 + b) * 2), 2, 1);
      }
      if (!scarp && hash(Math.floor(px / 2) + 900) > 0.8) {
        ctx.fillStyle = hash(Math.floor(px / 2) + 901) > 0.5 ? '#6b7380' : '#8d96a3';
        ctx.fillRect(sx, top + 8 + Math.floor(hash(Math.floor(px / 2) + 902) * (h - 10)), 2, 2);
      }
      // the thin cap of ice-cemented rock and dust, frosted and snowed over
      ctx.fillStyle = '#8e9aa8';
      ctx.fillRect(sx, top - 1, 2, 4);
      ctx.fillStyle = '#f2f8ff';
      ctx.fillRect(sx, top - 2, 2, hash(Math.floor(px / 2) + 950) > 0.3 ? 2 : 1);
    }
    // overhang lip sticking out over the scarp
    const ex = Math.round(east - camX);
    ctx.fillStyle = '#8e9aa8';
    ctx.fillRect(ex - 2, GY + 2 - glacierHeight(east - 30, east) - 1, 8, 4);
    // hollows under the rock cover: deep blue ice, darker towards the back
    for (const r of recesses()) {
      const sx = toScreen(Surf.mToPx(-r.atM), camX);
      if (sx < -60 || sx > W + 60) continue;
      ctx.fillStyle = '#6f9fcb';
      ctx.fillRect(sx - r.w / 2 - 2, GY + 2 - r.h - 2, r.w + 4, r.h + 2);
      ctx.fillStyle = '#3d6a9a';
      ctx.fillRect(sx - r.w / 2, GY + 2 - r.h, r.w, r.h);
      ctx.fillStyle = '#2c5482';
      ctx.fillRect(sx - r.w / 2 + 4, GY + 2 - r.h + 4, r.w - 8, r.h - 6);
      ctx.fillStyle = '#cfe6f8'; // frost on the floor of the hollow
      ctx.fillRect(sx - r.w / 2, GY - 1, r.w, 3);
    }
  }
  function drawOverhangFront(ctx, camX, W, GY) {
    for (const r of recesses()) {
      const sx = toScreen(S.Surface.mToPx(-r.atM), camX);
      if (sx < -60 || sx > W + 60) continue;
      ctx.fillStyle = 'rgba(24,52,92,0.3)'; // blue shadow over what lies inside
      ctx.fillRect(sx - r.w / 2, GY + 2 - r.h, r.w, r.h);
      ctx.fillStyle = '#8e9aa8'; // the rock lip, snow on top
      ctx.fillRect(sx - r.w / 2 - 4, GY + 2 - r.h - 4, r.w + 8, 5);
      ctx.fillStyle = '#f2f8ff';
      ctx.fillRect(sx - r.w / 2 - 4, GY + 2 - r.h - 5, r.w + 8, 2);
      for (let x = -r.w / 2; x < r.w / 2; x += 3) {
        if (hash(x + r.atM) < 0.4) continue;
        ctx.fillStyle = '#d6ecfb'; // icicles hanging from the lip
        const len = 3 + Math.floor(hash(x + r.atM + 2) * 6);
        ctx.fillRect(sx + x, GY + 3 - r.h, 2, len);
        ctx.fillRect(sx + x, GY + 3 - r.h + len, 1, 2);
      }
    }
  }

  /** 0 → 1 over the last stretch before the ice wall. */
  function giantness(m) {
    const w = cfg();
    const from = w.iceWallFromM - 200;
    if (-m <= from) return 0;
    const x = Math.min(1, (-m - from) / 200);
    return x * x * (3 - 2 * x);
  }

  /** A small ice hill: a lit western slope, a shaded eastern slope, a snowy crest. */
  function drawIceHill(ctx, sx, GY, r, g) {
    const h = Math.round((8 + r * 22) * (0.5 + g));
    const half = Math.round(h * (1.3 + r * 0.6));
    const peak = Math.round((r - 0.5) * half * 0.4); // the top sits a little off centre
    for (let x = -half; x <= half; x += 2) {
      const side = x < peak ? (x + half) / (peak + half) : (half - x) / (half - peak);
      const hh = Math.round(h * Math.pow(Math.max(0, side), 0.8));
      if (hh <= 0) continue;
      ctx.fillStyle = x < peak ? '#b4d7f1' : '#86b2d8';
      ctx.fillRect(sx + x, GY + 2 - hh, 2, hh);
      ctx.fillStyle = '#eef8ff';
      ctx.fillRect(sx + x, GY + 2 - hh, 2, Math.min(2, hh));
    }
  }

  function drawBounce(ctx, sx, GY, widthPx) {
    if (sx < -30 || sx > 670) return;
    ctx.fillStyle = 'rgba(70,96,128,0.45)';
    ctx.beginPath();
    ctx.ellipse(sx, GY + 2, widthPx / 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eef7ff';
    ctx.fillRect(Math.round(sx - widthPx / 2 - 1), GY, 2, 1);
    ctx.fillRect(Math.round(sx + widthPx / 2 - 1), GY, 2, 1);
  }

  /** A half-buried, faceted ice boulder: lit face, shaded face, snow on the top, a frost skirt. */
  function drawIceChunk(ctx, sx, GY, r, k) {
    const h = 5 + Math.floor(r * 8);
    const w = 9 + Math.floor(hash(r * 91) * 9);
    const peak = Math.floor(w * (0.3 + hash(r * 37) * 0.4));
    ctx.globalAlpha = Math.min(1, k * 1.2);
    for (let x = 0; x < w; x++) {
      const side = x <= peak ? (x + 1) / (peak + 1) : (w - x) / (w - peak);
      const notch = hash(r * 13 + x) > 0.8 ? 1 : 0; // chipped edge
      const hh = Math.max(1, Math.round(h * Math.pow(side, 0.6)) - notch);
      ctx.fillStyle = x <= peak ? '#c4e3fa' : '#7eaed8';
      ctx.fillRect(sx + x, GY + 2 - hh, 1, hh);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + x, GY + 2 - hh, 1, 1);
    }
    // facet line from the top down the lit face
    ctx.fillStyle = '#9cc8ec';
    for (let y = 2; y < h - 1; y++) ctx.fillRect(sx + peak - Math.round(y * 0.4), GY + 2 - h + y, 1, 1);
    // frost skirt where it sinks into the ground
    ctx.fillStyle = '#e8f4fc';
    ctx.fillRect(sx - 2, GY + 1, w + 4, 2);
    ctx.fillStyle = 'rgba(95,141,182,0.6)';
    ctx.fillRect(sx - 1, GY + 3, w + 2, 1);
    ctx.globalAlpha = 1;
  }

  /** A pair of tread lines between two world x positions (px), fading in from `fadeFromPx`. */
  function drawTracks(ctx, camX, W, GY, fromPx, toPx, { fadeNearPx, icy = (px) => 0 } = {}) {
    const a = Math.max(Math.min(fromPx, toPx), camX - 4);
    const b = Math.min(Math.max(fromPx, toPx), camX + W + 4);
    for (let px = Math.floor(a / 3) * 3; px <= b; px += 3) {
      const sx = Math.round(px - camX);
      const wob = Math.round(Math.sin(px * 0.021) * 1.5);
      let alpha = 0.7;
      if (fadeNearPx !== undefined) alpha *= Math.min(1, Math.abs(px - fadeNearPx) / 70);
      const k = icy(px);
      ctx.fillStyle = k > 0.3 ? 'rgba(96,132,170,' + alpha.toFixed(2) + ')' : 'rgba(78,34,22,' + alpha.toFixed(2) + ')';
      ctx.fillRect(sx, GY + 7 + wob, 2, 1);
      ctx.fillRect(sx, GY + 13 + wob, 2, 1);
      if ((px / 3) % 2 === 0) {
        ctx.fillRect(sx, GY + 6 + wob, 1, 1);
        ctx.fillRect(sx, GY + 12 + wob, 1, 1);
      }
    }
  }

  /** Spirit's tracks: two treads, and from dragFromM one of them becomes a furrow (the stuck wheel). */
  function drawWestTracks(ctx, camX, W, GY) {
    const st = cfg().spiritTrack;
    const Surf = S.Surface;
    const icy = (px) => Surf.iciness(Surf.pxToM(px));
    const start = Surf.mToPx(-st.fromM); // where they first show (fade in westwards)
    const end = Surf.mToPx(-st.toM);
    drawTracks(ctx, camX, W, GY, end, start, { fadeNearPx: start, icy });
    const a = Math.max(end, camX - 4);
    const b = Math.min(Surf.mToPx(-st.dragFromM), camX + W + 4);
    for (let px = Math.floor(a / 2) * 2; px <= b; px += 2) {
      const sx = Math.round(px - camX);
      const wob = Math.round(Math.sin(px * 0.021) * 1.5);
      const k = icy(px);
      ctx.fillStyle = k > 0.3 ? 'rgba(52,80,116,0.8)' : 'rgba(48,18,10,0.8)';
      ctx.fillRect(sx, GY + 12 + wob, 2, 3);
      ctx.fillStyle = k > 0.3 ? 'rgba(236,246,255,0.7)' : 'rgba(196,126,84,0.7)';
      ctx.fillRect(sx, GY + 11 + wob, 2, 1); // pushed-up lip
    }
  }

  function drawCrater(ctx, sx, GY, widthPx, k, seed) {
    if (sx < -60 || sx > 700) return;
    const rx = widthPx / 2;
    ctx.save();
    // bowl
    ctx.fillStyle = k > 0.3 ? 'rgba(70,96,128,0.55)' : 'rgba(58,24,14,0.6)';
    ctx.beginPath();
    ctx.ellipse(sx, GY + 3, rx, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = k > 0.3 ? 'rgba(40,62,92,0.5)' : 'rgba(30,10,6,0.55)';
    ctx.beginPath();
    ctx.ellipse(sx, GY + 4, rx * 0.55, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // raised rim
    ctx.fillStyle = k > 0.3 ? '#dfeefa' : '#c27a4c';
    ctx.fillRect(Math.round(sx - rx - 2), GY - 1, 4, 2);
    ctx.fillRect(Math.round(sx + rx - 2), GY - 1, 4, 2);
    // ejecta
    for (let i = 0; i < 6; i++) {
      const d = (hash(seed + i) - 0.5) * widthPx * 2.2;
      ctx.fillStyle = k > 0.3 ? '#b8d6ee' : '#7a3a24';
      ctx.fillRect(Math.round(sx + d), GY + 1 + Math.floor(hash(seed + i + 9) * 4), 2, 1);
    }
    ctx.restore();
  }

  /* ---- East: each real wreck gets a trail (rovers: tracks; landers: impact marks) ---- */
  function eastCases() {
    return S.Forensics && S.Forensics.cases ? S.Forensics.cases().filter((c) => c.distanceM > 0) : [];
  }
  function hasEastTrailInView(camX, W) {
    const w = cfg();
    return eastCases().some((c) => {
      const px = S.Surface.mToPx(c.distanceM);
      const from = S.Surface.mToPx(c.distanceM - w.eastTrailM);
      return px > camX - 60 && from < camX + W + 60;
    });
  }
  function drawEastTrails(ctx, camX, W, GY) {
    const w = cfg();
    const Surf = S.Surface;
    for (const c of eastCases()) {
      const end = Surf.mToPx(c.distanceM - 12);
      const start = Surf.mToPx(c.distanceM - w.eastTrailM);
      if (end < camX - 60 || start > camX + W + 60) continue;
      if (String(c.sprite).startsWith('rover')) {
        drawTracks(ctx, camX, W, GY, start, end, { fadeNearPx: start });
      } else {
        // a lander came down from the sky: two small impact marks of the parachute/backshell drop
        drawCrater(ctx, toScreen(Surf.mToPx(c.distanceM - w.eastTrailM * 0.6), camX), GY, 14, 0, c.distanceM);
        drawCrater(ctx, toScreen(Surf.mToPx(c.distanceM - w.eastTrailM * 0.3), camX), GY, 20, 0, c.distanceM + 7);
      }
    }
  }

  /* ---------------- Objects: debris, the lost lander, the parts ---------------- */
  West.drawObjects = function (ctx, s, camX, W, GY, t) {
    const w = cfg();
    if (!w) return;
    const Surf = S.Surface;
    const found = (s.salvage && s.salvage.found) || [];

    // Scattered metal between the craters and the lander
    const a = Surf.mToPx(-w.vehicleAtM);
    const b = Surf.mToPx(-w.debrisFromM);
    for (let px = Math.floor(a / 9) * 9; px <= b; px += 9) {
      if (px < camX - 10 || px > camX + W + 10) continue;
      const r = hash(px * 0.37);
      if (r < 0.55) continue;
      const sx = Math.round(px - camX);
      const k = Surf.iciness(Surf.pxToM(px));
      ctx.fillStyle = r > 0.8 ? '#e0732a' : '#9aa3ad';
      ctx.fillRect(sx, GY - 1, 3, 2);
      if (r > 0.9) {
        ctx.fillStyle = '#c9d0d8';
        ctx.fillRect(sx + 1, GY - 5, 1, 4); // a strut sticking up
      }
      if (k > 0.5) {
        ctx.fillStyle = 'rgba(240,248,255,0.8)';
        ctx.fillRect(sx, GY - 2, 3, 1);
      }
    }

    drawLander(ctx, toScreen(Surf.mToPx(-w.vehicleAtM), camX), GY, Surf.iciness(-w.vehicleAtM));
    drawChute(ctx, toScreen(Surf.mToPx(-w.phoenixSigns.chuteAtM), camX), GY, t);
    // shreds of Beagle 2's airbag fabric along the bounces
    for (let n = 0; n < w.beagleBounces.length; n++) {
      const sx = toScreen(Surf.mToPx(-w.beagleBounces[n] - 6), camX);
      if (sx < -10 || sx > W + 10) continue;
      ctx.fillStyle = n % 2 ? '#d8c9a0' : '#f0e6c8';
      ctx.fillRect(sx, GY - 2, 4, 2);
      ctx.fillRect(sx + 2, GY - 3, 3, 1);
    }
    drawIceWall(ctx, camX, W, GY, t);

    const dist = -s.player.x;
    for (const part of w.parts) {
      if (found.includes(part.id)) continue;
      const sx = toScreen(Surf.mToPx(-part.atM), camX);
      if (sx < -40 || sx > W + 40) continue;
      const sunk = part.hiddenIn === 'void' ? 9 : 0; // fell into the pit
      drawPart(ctx, part.id, sx, GY + sunk);
      // hidden parts only give themselves away up close: the same pulse K4 uses for wrecks
      if (part.hiddenIn && Math.abs(dist - part.atM) > w.partRevealM) continue;
      if (part.hiddenIn === 'cave' && !(s.salvage && s.salvage.iceBroken)) continue; // sealed in ice
      const pulse = (t * 1.2) % 1;
      ctx.strokeStyle = 'rgba(63,224,230,' + (1 - pulse).toFixed(2) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, GY - 8 + sunk, 5 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // front edges of the hiding places, over the parts and wrecks inside them
    const dt = lastT === null ? 0 : Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;
    drawWreckSnow(ctx, s, camX, W, GY);
    drawBarriers(ctx, s, camX, W, GY);
    drawProbe(ctx, s, camX, W, GY, t);
    drawCaveFront(ctx, s, toScreen(Surf.mToPx(-w.iceCave.atM), camX), GY, t, dt);
    for (const m of w.iceVoids) drawVoidFront(ctx, toScreen(Surf.mToPx(-m), camX), GY);
    drawOverhangFront(ctx, camX, W, GY);
  };

  /** A small cargo lander, tilted, one leg folded, half buried in a frost drift. */
  function drawLander(ctx, sx, GY, k) {
    if (sx < -80 || sx > 720) return;
    ctx.save();
    ctx.translate(sx, GY - 14);
    ctx.rotate(-0.16);
    // legs
    ctx.fillStyle = '#7d858f';
    ctx.fillRect(-22, 8, 2, 10);
    ctx.fillRect(18, 10, 2, 4);
    ctx.fillRect(-24, 17, 6, 2);
    // body
    ctx.fillStyle = '#b9c0c8';
    ctx.fillRect(-20, -10, 40, 20);
    ctx.fillStyle = '#8f98a3';
    ctx.fillRect(-20, 6, 40, 4);
    ctx.fillRect(-6, -10, 2, 16);
    ctx.fillStyle = '#e0732a';
    ctx.fillRect(-20, -4, 40, 2);
    // broken solar wing
    ctx.fillStyle = '#2f4f86';
    ctx.fillRect(20, -8, 14, 5);
    ctx.fillStyle = '#5b7fc0';
    ctx.fillRect(21, -7, 4, 1);
    ctx.fillRect(27, -7, 4, 1);
    // empty engine mount (the engine lies a little further west)
    ctx.fillStyle = '#3b3f46';
    ctx.fillRect(-4, 10, 8, 3);
    if (k > 0.3) {
      // snow lying on the top of the body and the broken wing
      ctx.fillStyle = '#9cc4e6';
      ctx.fillRect(-20, -11, 40, 1);
      ctx.fillRect(20, -9, 14, 1);
      ctx.fillStyle = '#f6fbff';
      ctx.fillRect(-21, -14, 42, 3);
      ctx.fillRect(-14, -16, 20, 2);
      ctx.fillRect(20, -11, 14, 2);
      ctx.fillStyle = 'rgba(240,248,255,0.3)';
      ctx.fillRect(-20, -10, 40, 20);
    }
    ctx.restore();
    // frost drift in front
    ctx.fillStyle = k > 0.3 ? '#e4f1fb' : '#c58a62';
    ctx.fillRect(sx - 26, GY - 4, 52, 5);
    ctx.fillRect(sx - 18, GY - 7, 30, 3);
    if (k > 0.3) {
      ctx.fillStyle = '#a9cdea';
      ctx.fillRect(sx - 26, GY, 52, 1);
    }
  }

  /** Phoenix's parachute lying next to its backshell, half frozen in. */
  function drawChute(ctx, sx, GY, t) {
    if (sx < -60 || sx > 700) return;
    ctx.fillStyle = '#8e959e'; // backshell (a cone on its side)
    ctx.fillRect(sx - 4, GY - 9, 14, 9);
    ctx.fillRect(sx + 10, GY - 6, 4, 6);
    ctx.fillStyle = '#c4cad2';
    ctx.fillRect(sx - 4, GY - 9, 14, 2);
    // canopy spread on the ground, its edge lifting in the thin wind
    const lift = Math.round(Math.sin(t * 1.6));
    ctx.fillStyle = '#f2f2ee';
    ctx.fillRect(sx - 30, GY - 3, 26, 3);
    ctx.fillRect(sx - 34, GY - 4 + lift, 6, 2);
    ctx.fillStyle = '#d9472b';
    ctx.fillRect(sx - 24, GY - 3, 4, 3);
    ctx.fillRect(sx - 14, GY - 3, 4, 3);
    ctx.fillStyle = '#b8bec6'; // suspension lines
    for (let i = 0; i < 3; i++) ctx.fillRect(sx - 4, GY - 4 + i * 2, 1, 1);
    ctx.fillStyle = 'rgba(232,244,252,0.85)';
    ctx.fillRect(sx - 30, GY - 1, 46, 2);
  }

  /**
   * The end of the map: an ice mountain far taller than the astronaut. Its height comes from a
   * smooth ridge line in world coordinates (so it does not shimmer as the camera moves): steep
   * near the foot, then rising to jagged peaks. Slopes facing west (towards the low sun side) are
   * lit, slopes facing east are shaded, and snow sits on the ridge line.
   */
  function mountainHeight(px, face) {
    const d = face - px; // pixels west of the foot of the mountain
    if (d < -14) return 0;
    const rise = Math.min(1, Math.max(0, (d + 14) / 150));
    const base = 40 + 200 * Math.pow(rise, 0.75);
    const ridge = Math.sin(px * 0.031) * 22 + Math.sin(px * 0.083 + 1.3) * 9 + Math.abs(Math.sin(px * 0.017 + 0.4)) * 30;
    return Math.max(0, Math.round((base + ridge * rise) * Math.min(1, (d + 14) / 30)));
  }

  function drawIceWall(ctx, camX, W, GY, t) {
    const w = cfg();
    const face = S.Surface.mToPx(-w.iceWallFromM);
    if (face < camX - 20) return;
    const right = Math.min(face + 16, camX + W);
    const left = Math.floor((camX - 4) / 2) * 2;
    // a paler, taller range further back for depth
    for (let px = left; px <= right; px += 2) {
      const sx = Math.round(px - camX);
      const back = Math.round(mountainHeight(px + 70, face + 40) * 1.12);
      if (back <= 0) continue;
      ctx.fillStyle = '#a7c4e0';
      ctx.fillRect(sx, GY + 2 - back, 2, back);
      ctx.fillStyle = '#f2f9ff';
      ctx.fillRect(sx, GY + 2 - back, 2, 3);
    }
    // the mountain itself
    for (let px = left; px <= right; px += 2) {
      const sx = Math.round(px - camX);
      const h = mountainHeight(px, face);
      if (h <= 0) continue;
      const slope = mountainHeight(px + 2, face) - mountainHeight(px - 2, face); // > 0: going down eastwards
      const top = GY + 2 - h;
      ctx.fillStyle = slope < -1 ? '#8fc0e8' : slope > 1 ? '#4f83b8' : '#6c9fd0';
      ctx.fillRect(sx, top, 2, h);
      // dark outline above the ridge, so the silhouette reads through haze and visor frost
      ctx.fillStyle = '#2f5a88';
      ctx.fillRect(sx, top - 2, 2, 2);
      // snow on the ridge line, thicker on the gentle parts
      ctx.fillStyle = '#f4faff';
      ctx.fillRect(sx, top, 2, Math.abs(slope) < 3 ? 5 : 2);
      // horizontal ice bands deep in the mountain
      const n = Math.floor(px / 2);
      for (let b = 1; b <= 3; b++) {
        const by = top + Math.round(h * b * 0.22 + Math.sin(px * 0.05 + b) * 4);
        if (by < GY - 2) {
          ctx.fillStyle = 'rgba(80,120,165,0.35)';
          ctx.fillRect(sx, by, 2, 1);
        }
      }
      // crevasses
      if (hash(Math.floor(px / 14) + 501) > 0.78 && (px % 14) < 2) {
        const cy = top + 14 + Math.floor(hash(n + 9) * Math.max(1, h - 40));
        ctx.fillStyle = '#4c739c';
        ctx.fillRect(sx, cy, 1, 6 + Math.floor(hash(n + 3) * 10));
      }
      if (hash(n + 13) > 0.985) {
        const tw = 0.5 + 0.5 * Math.sin(t * 2.5 + n);
        ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
        ctx.fillRect(sx, top + 8 + Math.floor(hash(n + 17) * 60), 1, 1);
      }
    }
    // ice rubble at the foot
    const fx = Math.round(face - camX);
    ctx.fillStyle = '#c6e2f6';
    ctx.fillRect(fx + 4, GY - 4, 16, 6);
    ctx.fillRect(fx + 20, GY - 1, 8, 3);
    ctx.fillStyle = '#eaf6ff';
    ctx.fillRect(fx + 4, GY - 4, 16, 1);
  }

  /* ---------------- Screen: the visor frosts over the further west you go ---------------- */
  /**
   * The blizzard (FICTIONAL): a white-out haze and snow driven east by the wind, in gusts. Same
   * strength the walk uses (S.Surface.blizzard), so what you see is what slows you down.
   */
  function drawBlizzard(ctx, s, W, H) {
    const bz = S.Surface.blizzard ? S.Surface.blizzard(s) : { k: 0 };
    if (bz.k <= 0) return;
    const I = bz.k * bz.gust;
    const t = lastT || 0;
    ctx.fillStyle = 'rgba(232,240,250,' + (0.42 * I).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    const n = Math.round(260 * I);
    for (let i = 0; i < n; i++) {
      const sp = (380 + hash(i + 7) * 420) * (0.6 + bz.gust * 0.5);
      const x = ((hash(i) * (W + 80) + t * sp) % (W + 80)) - 40;
      const y = Math.round(((hash(i + 3) * H + t * sp * 0.12) % H) + Math.sin(t * 3 + i) * 3);
      const len = Math.round(5 + hash(i + 11) * 12 * I);
      ctx.fillStyle = 'rgba(250,252,255,' + (0.35 + hash(i + 5) * 0.55).toFixed(2) + ')';
      ctx.fillRect(Math.round(x), y, len, 1);
      if (hash(i + 13) > 0.7) ctx.fillRect(Math.round(x) + len, y + 1, 2, 1); // the flake at the head
    }
    // snow skimming along the ground
    ctx.fillStyle = 'rgba(245,250,255,' + (0.5 * I).toFixed(2) + ')';
    for (let i = 0; i < 40 * I; i++) {
      const x = ((hash(i + 50) * (W + 40) + t * 520) % (W + 40)) - 20;
      ctx.fillRect(Math.round(x), S.Surface.GROUND_Y - 2 - Math.floor(hash(i + 51) * 10), 14, 1);
    }
  }

  West.drawScreenFrost = function (ctx, s, W, H) {
    const w = cfg();
    if (!w || !w.screenFrostFromM || s.player.inside) return;
    drawBlizzard(ctx, s, W, H);
    const d = -s.player.x;
    const ramp = (a, b) => {
      const x = Math.min(1, Math.max(0, (d - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };
    // While walking only the light frost: it creeps in along the road and thickens as the suit
    // cools. The heavy frost is kept for death (see West.holdDeath).
    const eva = S.DATA.constants.eva;
    const road = ramp(w.screenFrostFromM, w.screenFrostFullM || w.screenFrostHeavyFromM);
    const cold = s.suit.frozen ? 1 : Math.max(0, Math.min(1, (eva.suitNominalC - 4 - s.suit.tempC) / 18));
    const light = Math.max(road * 0.75, cold * 0.9);
    const img1 = S.Sprites.get('vfx_frost_1');
    const img2 = S.Sprites.get('vfx_frost_2');
    if (img1 && light > 0.01) {
      ctx.globalAlpha = light;
      ctx.drawImage(img1, 0, 0, W, H);
    }
    if (img2 && death.go === s.gameOver && death.go) {
      // freezing to death: the heavy frost closes over the visor
      const k = Math.min(1, (Date.now() - death.start) / (DEATH_MS * 0.8));
      ctx.globalAlpha = k;
      ctx.drawImage(img2, 0, 0, W, H);
    }
    ctx.globalAlpha = 1;
  };

  /** True while the visor is ours to draw (outside, in the ice field): K4's cold-visor frost steps aside. */
  West.ownsVisor = function (s) {
    const w = cfg();
    return !!w && !s.player.inside && -s.player.x > w.frostStartM;
  };

  /*
   * Death in the ice field: before the game-over screen, the heavy frost closes over the screen.
   * main.js asks holdDeath() while the mission is lost; it says "wait" for DEATH_MS once.
   */
  const DEATH_MS = 2600;
  const death = { go: null, start: 0 };
  West.holdDeath = function (s) {
    if (!s.gameOver || !West.ownsVisor(s)) return false;
    if (death.go !== s.gameOver) {
      death.go = s.gameOver;
      death.start = Date.now();
      S.bus.emit('audio:play', 'freeze');
    }
    return Date.now() - death.start < DEATH_MS;
  };

  function drawPart(ctx, id, sx, GY) {
    if (id === 'engine') {
      // engine bell on its side, copper rim
      ctx.fillStyle = '#4a4f57';
      ctx.fillRect(sx - 9, GY - 9, 12, 9);
      ctx.fillRect(sx + 3, GY - 7, 4, 5);
      ctx.fillStyle = '#c47a3c';
      ctx.fillRect(sx - 10, GY - 10, 2, 11);
      ctx.fillStyle = '#6b717a';
      ctx.fillRect(sx - 7, GY - 8, 8, 2);
    } else if (id === 'wheel') {
      // a round tyre standing on its edge: tread blocks around a grey rim and hub
      const cx = sx;
      const cy = GY - 8;
      ctx.fillStyle = '#2b2e33';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#41454c';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.fillRect(Math.round(cx + Math.cos(a) * 8) - 1, Math.round(cy + Math.sin(a) * 8) - 1, 2, 2);
      }
      ctx.fillStyle = '#9aa3ad';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9d0d8';
      ctx.fillRect(cx - 3, cy - 3, 2, 1);
      ctx.fillStyle = '#4a4f57';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
      ctx.fillStyle = 'rgba(240,248,255,0.85)'; // frost on the top of the tyre
      ctx.fillRect(cx - 5, cy - 8, 10, 1);
    } else {
      // broken solar panel piece
      ctx.fillStyle = '#2f4f86';
      ctx.fillRect(sx - 7, GY - 5, 13, 5);
      ctx.fillStyle = '#5b7fc0';
      ctx.fillRect(sx - 6, GY - 4, 3, 1);
      ctx.fillRect(sx - 1, GY - 4, 3, 1);
      ctx.fillStyle = '#c9d0d8';
      ctx.fillRect(sx + 6, GY - 6, 1, 6);
    }
  }


  /* ---------------- D-016 (proposed): glacier ice cave, water bottle, watering ---------------- */
  const shelter = () => (cfg() && cfg().shelterCave) || null;
  /** Screen span of the cave: x0 west mouth, x1 east mouth. */
  function shelterSpan(camX) {
    const c = shelter();
    return { x0: toScreen(S.Surface.mToPx(-c.toM), camX), x1: toScreen(S.Surface.mToPx(-c.fromM), camX) };
  }
  /** Height of the cave's ceiling above the ground at screen column x (an arch, lowest at the mouths). */
  function archH(x, x0, x1) {
    const half = (x1 - x0) / 2;
    const u = Math.min(1, Math.abs(x - (x0 + half)) / (half + 4));
    return Math.round(30 + 54 * Math.pow(1 - u * u, 0.7));
  }

  /** Back layer: the hollow cut into the glacier, its layered blue walls, icicles and the clean-ice vein. */
  function drawShelterBack(ctx, camX, W, GY, t) {
    const c = shelter();
    if (!c) return;
    const { x0, x1 } = shelterSpan(camX);
    if (x1 < -30 || x0 > W + 30) return;
    // the ice bank the cave is cut into: a rounded hill of layered blue ice, snow on top
    const mid = (x0 + x1) / 2;
    const span = (x1 - x0) / 2 + 12;
    for (let x = x0 - 12; x <= x1 + 12; x += 2) {
      const u = Math.min(1, Math.abs(x - mid) / span);
      const h = Math.round(108 * Math.pow(1 - Math.pow(u, 3), 0.5) + Math.sin((x + camX) * 0.09) * 2);
      if (h <= 2) continue;
      const top = GY + 2 - h;
      ctx.fillStyle = x < mid - 20 ? '#a9cbe8' : x < mid + 20 ? '#9cc4e6' : '#8fbbe0';
      ctx.fillRect(x, top, 2, h);
      for (let b = 1; b < 6; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(60,100,150,0.25)' : 'rgba(240,248,255,0.45)';
        ctx.fillRect(x, top + 6 + Math.round(h * b * 0.16) + Math.round(Math.sin(x * 0.07 + b) * 2), 2, 1);
      }
      ctx.fillStyle = '#8e9aa8';
      ctx.fillRect(x, top - 1, 2, 2);
      ctx.fillStyle = '#f2f8ff';
      ctx.fillRect(x, top - 2, 2, 2);
    }
    for (let x = x0; x < x1; x += 2) {
      const h = archH(x, x0, x1);
      const top = GY + 2 - h;
      // rim of clear ice around the opening, then the dark inside
      ctx.fillStyle = '#6f9fcb';
      ctx.fillRect(x, top - 3, 2, 3);
      ctx.fillStyle = '#2f5a8a';
      ctx.fillRect(x, top, 2, h);
      ctx.fillStyle = '#244a77';
      ctx.fillRect(x, top + 10, 2, h - 10);
      // layers in the back wall (old snow seasons)
      for (let b = 1; b < 5; b++) {
        ctx.fillStyle = b % 2 ? 'rgba(120,170,220,0.35)' : 'rgba(20,40,70,0.35)';
        ctx.fillRect(x, top + 8 + b * 11 + Math.round(Math.sin(x * 0.08 + b * 1.7) * 2), 2, 1);
      }
      // icicles from the ceiling
      const ix = Math.floor((x + camX) / 2);
      if (hash(ix + 777) > 0.62) {
        const len = 3 + Math.floor(hash(ix + 779) * 8);
        ctx.fillStyle = '#cfe6f8';
        ctx.fillRect(x, top, 1, len);
        ctx.fillStyle = '#9cc4ea';
        ctx.fillRect(x + 1, top, 1, Math.max(1, len - 2));
      }
    }
    // frosted floor
    ctx.fillStyle = '#cfe6f8';
    ctx.fillRect(x0, GY - 1, x1 - x0, 3);
    // the clean-ice vein in the back wall: bright, glinting
    const vx = toScreen(S.Surface.mToPx(-c.veinM), camX);
    ctx.fillStyle = '#bfe3ff';
    ctx.fillRect(vx - 7, GY - 34, 14, 33);
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(vx - 5, GY - 31, 4, 26);
    ctx.fillRect(vx + 2, GY - 24, 3, 18);
    ctx.fillStyle = '#7fb3dc';
    ctx.fillRect(vx - 7, GY - 34, 14, 1);
    ctx.fillRect(vx - 1, GY - 30, 1, 22);
    const tw = 0.5 + 0.5 * Math.sin(t * 2.6);
    ctx.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
    ctx.fillRect(vx - 3, GY - 27, 1, 1);
    ctx.fillRect(vx + 3, GY - 15, 1, 1);
    // chips knocked off it lie on the floor
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(vx - 10, GY - 1, 2, 1);
    ctx.fillRect(vx + 9, GY - 1, 3, 1);
  }

  /** Front layer (over the astronaut): blue shade inside and the ice lip at both mouths. */
  function drawShelterFront(ctx, s, camX, W, GY) {
    const c = shelter();
    if (!c) return;
    const { x0, x1 } = shelterSpan(camX);
    if (x1 < -30 || x0 > W + 30) return;
    const k = S.Sim.shelterK(s);
    for (let x = x0; x < x1; x += 2) {
      const h = archH(x, x0, x1);
      // inside, the light is blue and dim; a little stronger while you stand in it
      ctx.fillStyle = 'rgba(30,70,130,' + (0.1 + 0.14 * k).toFixed(3) + ')';
      ctx.fillRect(x, GY + 2 - h, 2, h);
    }
    // the lip at each mouth hangs over the path
    for (const [ax, dir] of [[x0, 1], [x1 - 2, -1]]) {
      for (let i = 0; i < 12; i += 2) {
        const x = ax + dir * i;
        const h = archH(x, x0, x1);
        const drop = Math.round((12 - i) * 0.9);
        ctx.fillStyle = '#86b9e2';
        ctx.fillRect(x, GY + 2 - h - 4, 2, 5 + drop);
        ctx.fillStyle = '#d6ecfb';
        ctx.fillRect(x, GY + 2 - h + drop, 2, 2);
      }
    }
  }

  /* The bottle: drawn in the astronaut's hand; while pouring, tipped with water running out. */
  const pour = { px: null, start: null, dur: 1.6 };
  West.startPour = function (px) {
    pour.px = px;
    pour.start = null;
  };

  function drawBottle(ctx, x, y, full, tilt) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (tilt) ctx.rotate(tilt);
    ctx.fillStyle = '#1b1622';
    ctx.fillRect(-3, -9, 6, 11);
    ctx.fillStyle = '#d9e6f0'; // clear plastic
    ctx.fillRect(-2, -8, 4, 9);
    if (full) {
      ctx.fillStyle = '#3fa4e6';
      ctx.fillRect(-2, -5, 4, 6);
      ctx.fillStyle = '#9fdcff';
      ctx.fillRect(-2, -5, 1, 5);
    }
    ctx.fillStyle = '#e2672c'; // cap
    ctx.fillRect(-1, -11, 2, 2);
    ctx.restore();
  }

  /**
   * Front hook from effects.js, right after the astronaut: the cave's front layer, the bottle in
   * hand and the pour into the greenhouse. a = { x, y (feet), pose } or null (landing scene).
   */
  West.drawFront = function (ctx, s, camX, W, GY, t, a) {
    if (!cfg()) return;
    if (cfg().iceBarriers) drawTunnelFront(ctx, s, camX, W, GY);
    drawShelterFront(ctx, s, camX, W, GY);
    if (!a) return;
    const b = S.Sim.bottle(s);
    const f = s.player.facing < 0 ? -1 : 1;
    if (pour.px !== null) {
      if (pour.start === null) pour.start = t;
      const u = (t - pour.start) / pour.dur;
      if (u >= 1 || u < 0) {
        pour.px = null;
      } else {
        // kneel, tip the bottle towards the greenhouse; water arcs down to its beds
        const hx = a.x + f * 14;
        const hy = a.y - 24;
        const tip = Math.min(1, u * 4);
        drawBottle(ctx, hx, hy, u < 0.8, f * (0.4 + 1.5 * tip));
        if (u > 0.15 && u < 0.85) {
          for (let i = 0; i < 9; i++) {
            const p = (t * 2.4 + i / 9) % 1;
            const dx = f * (6 + p * 22);
            const dy = -2 + p * p * 24;
            ctx.fillStyle = i % 3 ? '#5fb8f0' : '#bfe6ff';
            ctx.fillRect(Math.round(hx + dx), Math.round(hy + dy), 2, 2);
          }
          // splash where it lands
          ctx.fillStyle = 'rgba(191,230,255,' + (0.5 + 0.5 * Math.sin(t * 20)).toFixed(2) + ')';
          ctx.fillRect(Math.round(hx + f * 28) - 3, Math.round(hy + 22), 6, 1);
        }
        return;
      }
    }
    if (!b) return;
    // hand height depends on the pose (sprites face right; walking swings the arm a little)
    const kneel = a.pose === 'action' || a.pose === 'crouch';
    const swing = a.pose === 'walk' ? Math.round(Math.sin(t * 9) * 2) : 0;
    drawBottle(ctx, a.x + f * ((kneel ? 14 : 7) + swing), a.y - 22, b === 'full', 0);
  };

  /** Interior hook: the bottle rack on the wall by the airlock (design coords, offset ox/oy). */
  West.drawInteriorRack = function (ctx, s, ox, oy, t, nearId) {
    if (!shelter()) return;
    const rack = S.Surface.INTERIOR.stations.find((st) => st.id === 'bottles');
    const x = ox + rack.x - 12;
    const y = oy + 66;
    ctx.fillStyle = '#2b2420';
    ctx.fillRect(x, y, 24, 42);
    ctx.fillStyle = '#4a3d35';
    ctx.fillRect(x + 1, y + 1, 22, 40);
    ctx.fillStyle = '#7a6a5c';
    ctx.fillRect(x, y + 19, 24, 2);
    ctx.fillRect(x, y + 39, 24, 2);
    ctx.fillStyle = '#3fa4e6';
    ctx.fillRect(x + 4, y + 3, 16, 2); // blue water stripe
    const left = S.Sim.bottle(s) ? 2 : 3;
    const slots = [[6, 18], [17, 18], [12, 38]];
    for (let i = 0; i < left; i++) drawBottle(ctx, x + slots[i][0], y + slots[i][1], false, 0);
    if (nearId === 'bottles') {
      ctx.save();
      ctx.font = '8px \"VT323\", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const txt = '[E] ' + S.t(S.Sim.bottle(s) ? 'bottle.rack_put' : 'bottle.rack_take');
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillStyle = 'rgba(8,10,14,0.8)';
      // under the rack, above the astronaut's helmet (the HUD shortcut bar covers the wall above it)
      const ly = oy + 116;
      ctx.fillRect(Math.round(x + 12 - tw / 2), ly - 6, Math.round(tw), 12);
      ctx.fillStyle = '#3fe0e6';
      ctx.fillText(txt, x + 12, ly);
      ctx.restore();
    }
  };

  /** Interior hook after the astronaut: the bottle in hand. */
  West.drawInteriorCarry = function (ctx, s, x, floorY, t, moving) {
    const b = S.Sim.bottle(s);
    if (!b) return;
    const f = s.player.facing < 0 ? -1 : 1;
    const swing = moving ? Math.round(Math.sin(t * 9) * 2) : 0;
    drawBottle(ctx, x + f * (7 + swing), floorY - 22, b === 'full', 0);
  };

  S.Westlands = West;
})((window.SOL14 = window.SOL14 || {}));
