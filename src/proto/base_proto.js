/**
 * SOL 14: RED HORIZON — BASE + MAP PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * Runtime patches, loaded before src/main.js; ?proto=0 turns every prototype file off.
 *  - No ready-made base: main's H-01 habitat and the cargo crates (solar array, greenhouse, ISRU, MAV) are gone.
 *    The crew lander is the shelter (E at its ladder goes inside) and gives the power its solar wings make
 *    (the base's solar flag is on from landing). The player builds the station from what they find (world_proto.js).
 *  - No MAV at all: the meteorite (world_proto.js) hits the lander and cuts the way home.
 *  - No 100 m flags or metre labels on the ground.
 *  - The east route goes on past the lava-tube skylight to eastEndM: a second dune field, yardang ridges and
 *    layered buttes (procedural art, no images). The map is FICTIONAL and compressed (as in D-012 / D-013).
 *  - Dust storms: the tiled storm texture (it showed seams and hard bands) is replaced by moving dust streaks
 *    over the game's own orange haze, and the storm builds up and clears slowly (stormFadeSeconds).
 * Rules here (no habitat, no MAV) change the game: a team decision before any of it goes to main.
 */
(function (S) {
  'use strict';
  if (!S.Surface || !S.FX || !S.Art || !S.Sim) return; // tests load only the core scripts
  if (new URLSearchParams(window.location.search).get('proto') === '0') return;

  const Surf = S.Surface;
  const MAP = () => S.DATA.terrain.map;
  /* Prototype settings (game values) */
  const B = {
    eastEndM: 3000, // the east route now ends here (was the skylight at +1400 m)
    // extra zones east of the skylight. 'dunes' is drawn by main's dig_fx.js, the other two here.
    extraZones: [
      { id: 'dunes', fromM: 1430, toM: 1850 },
      { id: 'yardangs', fromM: 1850, toM: 2450, own: true, ground: 'layered' },
      { id: 'buttes', fromM: 2450, toM: 99999, own: true, ground: 'bedrock' }
    ],
    blendM: 120, // soft band at a zone border (m on the ground)
    doorRangePx: 40,
    stormFadeSeconds: 10 // a dust storm builds up over this long and clears over this long
  };
  S.BaseProto = B;
  const shelterM = () => MAP().landingPadM;
  B.shelterM = shelterM;

  const TEXT = {
    tr: {
      'prompt.door': 'Sığınağa gir (iniş aracı)',
      'world.door': 'İniş aracı',
      'hud.place_hab': 'Sığınak · {temp} °C',
      'hud.home_line': 'Sığınak {dir} {m} m',
      'hud.home_here': 'Sığınağın yakınında',
      // prototype-only keys in main's namespaces are added at runtime (template keys: not part of story.json)
      [`zone.yardangs`]: 'Yardang Sırtları',
      [`zone.buttes`]: 'Katmanlı Tepeler'
    },
    en: {
      'prompt.door': 'Enter the shelter (lander)',
      'world.door': 'Crew lander',
      'hud.place_hab': 'Shelter · {temp} °C',
      'hud.home_line': 'Shelter {dir} {m} m',
      'hud.home_here': 'Near the shelter',
      [`zone.yardangs`]: 'Yardang Ridges',
      [`zone.buttes`]: 'Layered Buttes'
    }
  };
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }

  /* ---------------- helpers ---------------- */
  const sat = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => x * x * (3 - 2 * x);
  function rnd(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function hexMix(a, b, k) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  const atNight = (col, minute) => hexMix(col, '#120c10', S.Art.lighting(minute).dark * 0.85);
  const view = () => S.FX.view || { w: 640, h: 360, offY: 0 };

  /* ================================================================ */
  /* 1) No ready-made base: the lander is the shelter                   */
  /* ================================================================ */
  // Main draws the habitat and lets E open its door from Surf.STRUCTURES. The habitat entry moves onto the
  // lander's ladder (HUD home marker, door prompt and the drone's night spot follow it); every other base
  // structure is no longer built, so neither it nor its cargo crate is drawn or offered.
  const hab = Surf.STRUCTURES.find((x) => x.id === 'habitat');
  function placeShelter() {
    if (!hab) return;
    const px = Surf.mToPx(shelterM());
    hab.w = 40;
    hab.px = px - hab.w / 2;
    hab.interactPx = px;
  }
  placeShelter();
  Surf.structureBuilt = (s, st) => st.id === 'habitat';
  S.Art.drawHabitat = function () {}; // the H-01 module is not drawn
  S.Sim.airlockX = shelterM(); // distances home and the point of no return are measured to the lander
  const origInteractables = Surf.interactables;
  Surf.interactables = function (s) {
    const list = origInteractables.apply(this, arguments);
    const door = list.find((it) => it.id === 'habitat');
    if (door) door.range = B.doorRangePx;
    return list;
  };

  // The lander's solar wings power the shelter from landing (main starts with the array packed in a crate).
  // Greenhouse, ISRU and MAV stay packed for good: they are never delivered in this version.
  function baseFlags(s) {
    if (!s || !s.base) return;
    if (!s.base.solar) s.base.solar = true;
    s.base.mav = false;
    s.base.isru = false;
    s.base.greenhouse = false;
  }
  const origLand = S.Sim.land;
  S.Sim.land = function (s) {
    const r = origLand.apply(this, arguments);
    baseFlags(s);
    return r;
  };

  // Leaving the shelter puts the astronaut at the lander's ladder, not at main's habitat door (0 m)
  const origExit = Surf.exitHabitat;
  Surf.exitHabitat = function (s) {
    const r = origExit.apply(this, arguments);
    s.player.x = shelterM() + 4;
    Surf.syncFromState(s);
    return r;
  };
  const origEnter = Surf.enterHabitat;
  Surf.enterHabitat = function (s) {
    const r = origEnter.apply(this, arguments);
    s.player.x = shelterM();
    return r;
  };

  // Goals: "home" is the lander; goals for crates, the MAV and fuel are gone (no MAV in this version).
  const NO_MAV = ['deploy_solar', 'deploy_mav', 'mav_fuel', 'mav_launch', 'isru'];
  const sleepGoal = { id: 'sleep', key: 'goal.sleep', vars: {}, hintKey: 'goal.hint.sleep', target: null };
  if (S.Objectives) {
    const O = S.Objectives;
    const prevMain = O.mainGoal;
    O.mainGoal = function (s) {
      let g = prevMain.apply(this, arguments);
      if (g && NO_MAV.includes(g.id)) g = sleepGoal;
      if (g && g.target && g.target.m === 0) g = Object.assign({}, g, { target: { m: shelterM() } });
      return g;
    };
    const prevOpt = O.optionalGoal;
    O.optionalGoal = function () {
      const g = prevOpt.apply(this, arguments);
      return g && ['opt_deploy', 'opt_sabatier', 'opt_clean', 'opt_greenhouse'].includes(g.id) ? null : g;
    };
  }

  /* ================================================================ */
  /* 2) The map goes on east of the skylight                           */
  /* ================================================================ */
  for (const z of B.extraZones) if (!MAP().zones.some((x) => x.id === z.id && x.fromM === z.fromM)) MAP().zones.push({ id: z.id, fromM: z.fromM, toM: z.toM });
  Surf.worldRightPx = () => Surf.mToPx(B.eastEndM) + 24;
  if (S.HUD) {
    // bottom strip: from the ice wall to the new east end
    S.HUD.trackPct = (m) => Math.max(0, Math.min(100, ((m - MAP().leftLimitM) / (B.eastEndM - MAP().leftLimitM)) * 100));
  }

  // Zones drawn here: each into an offscreen layer cut with a soft horizontal mask at its borders.
  let layer = null;
  function zoneLayers(ctx, camX, w, h, fn) {
    const band = Surf.mToPx(B.blendM) - Surf.mToPx(0);
    for (const z of B.extraZones) {
      if (!z.own) continue;
      const a = Surf.mToPx(z.fromM) - camX;
      const b = Surf.mToPx(z.toM) - camX;
      if (b + band / 2 <= 0 || a - band / 2 >= w) continue;
      if (a + band / 2 <= 0 && b - band / 2 >= w) {
        ctx.save();
        fn(ctx, z);
        ctx.restore();
        continue;
      }
      if (!layer) layer = document.createElement('canvas');
      if (layer.width !== w || layer.height !== h) {
        layer.width = w;
        layer.height = h;
      }
      const l = layer.getContext('2d');
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = 'source-over';
      l.globalAlpha = 1;
      l.clearRect(0, 0, w, h);
      l.save();
      fn(l, z);
      l.restore();
      const g = l.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 24; i++) {
        const x = (i / 24) * w;
        const al = smooth(sat((x - a) / band + 0.5)) * smooth(sat((b - x) / band + 0.5));
        g.addColorStop(i / 24, 'rgba(0,0,0,' + al.toFixed(3) + ')');
      }
      l.globalCompositeOperation = 'destination-in';
      l.fillStyle = g;
      l.fillRect(0, 0, w, h);
      l.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, 0, 0);
    }
  }

  // Yardangs: long streamlined ridges carved by the wind (blunt head upwind, long tapering tail), layered flanks.
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
  }
  // Layered buttes: flat-topped stepped hills of stacked sedimentary rock, a far row and a nearer row.
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
  }
  // Pale, finely layered soft rock with wind-scoured grooves (yardang floor).
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
  }
  // Pale layered bedrock with cracks between slabs (butte country).
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

  // Ground layer of the surface: no 100 m flags or labels; the new zones' hills behind, their ground on top.
  const origGround = S.Art.drawGround;
  S.Art.drawGround = function (ctx, siteId, minute, camX, w, h, groundY, opts) {
    if (!opts || !opts.markers) return origGround.apply(this, arguments); // habitat interior and other calls
    zoneLayers(ctx, camX, w, 362, (c, z) => (z.id === 'yardangs' ? drawYardangs(c, minute, camX, w) : drawButtes(c, minute, camX, w)));
    const args = Array.prototype.slice.call(arguments);
    args[7] = Object.assign({}, opts, { markers: [] });
    const r = origGround.apply(this, args);
    zoneLayers(ctx, camX, w, h, (c, z) => (z.ground === 'layered' ? drawLayeredGround(c, minute, camX, w, h, groundY) : drawBedrock(c, minute, camX, w, h, groundY)));
    return r;
  };

  /* ================================================================ */
  /* 3) Dust storm: moving streaks, slow build-up and clearing          */
  /* ================================================================ */
  const origGet = S.Sprites.get;
  S.Sprites.get = function (key) {
    return key === 'vfx_dust_storm' ? null : origGet.apply(this, arguments); // no tiled texture (no seams)
  };
  // effects.js eases FX.stormVis with a fast exponential (rate 0.8/s). Its level is steered so that after
  // that step it equals an even, smoothstepped ramp over stormFadeSeconds.
  let stormRamp = 0;
  function steerStorm(s, dt) {
    if (!(dt > 0) || !s.weather) return;
    const target = s.weather.stormTau > 0 && s.player.zone !== 'cave' ? 1 : 0;
    const diff = target - stormRamp;
    stormRamp += Math.sign(diff) * Math.min(Math.abs(diff), dt / B.stormFadeSeconds);
    const want = smooth(sat(stormRamp));
    const r = Math.min(1, dt * 0.8);
    if (r < 1) S.FX.stormVis = (want - target * r) / (1 - r);
  }
  B.stormLevel = () => smooth(sat(stormRamp));
  const streaks = Array.from({ length: 190 }, (_, i) => ({ x: rnd(i * 1.7) * 960, y: rnd(i * 2.9), v: 260 + rnd(i * 4.3) * 360, len: 6 + Math.round(rnd(i * 6.1) * 26) }));
  const puffs = Array.from({ length: 14 }, (_, i) => ({ x: rnd(i * 9.1) * 960, y: 0.15 + rnd(i * 3.7) * 0.75, r: 30 + rnd(i * 5.3) * 60, v: 60 + rnd(i * 7.7) * 80 }));
  let lastT = 0;
  function drawStorm(ctx, k, now) {
    const v = view();
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
    lastT = now;
    if (k <= 0.01) return;
    ctx.save();
    // thick dust: the light drops and turns orange-brown
    ctx.globalAlpha = 0.5 * k;
    ctx.fillStyle = '#6a2c14';
    ctx.fillRect(0, 0, v.w, v.h);
    ctx.globalAlpha = 0.18 * k;
    ctx.fillStyle = '#2a120a';
    ctx.fillRect(0, 0, v.w, v.h);
    // big soft dust clouds rolling through
    for (const p of puffs) {
      p.x += p.v * (0.5 + 0.5 * k) * dt;
      if (p.x - p.r > v.w + 40) p.x = -p.r - 40;
      const g = ctx.createRadialGradient(p.x, p.y * v.h, 0, p.x, p.y * v.h, p.r);
      g.addColorStop(0, 'rgba(196,120,70,' + (0.32 * k).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(196,120,70,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.r, p.y * v.h - p.r, p.r * 2, p.r * 2);
    }
    // fine streaks driven by the wind; fewer at the start and end of the storm
    ctx.fillStyle = '#d0905e';
    const shown = Math.round(streaks.length * (0.15 + 0.85 * k));
    const speed = 0.45 + 0.55 * k;
    for (let i = 0; i < streaks.length; i++) {
      const d = streaks[i];
      d.x += d.v * speed * dt;
      if (d.x > v.w + 20) d.x = -40;
      if (i >= shown) continue;
      const y = Math.round(d.y * v.h + Math.sin((d.x + d.y * 1000) * 0.02) * 6);
      ctx.globalAlpha = 0.7 * k;
      ctx.fillRect(Math.round(d.x), y, d.len, 1);
    }
    ctx.restore();
  }

  const origRender = S.FX.render;
  S.FX.render = function (ctx, s, dt) {
    if (s && !s.player.inside) steerStorm(s, dt);
    baseFlags(s);
    const r = origRender.apply(this, arguments);
    if (s && !s.player.inside && s.player.zone !== 'cave') drawStorm(ctx, S.FX.stormVis || 0, performance.now());
    else lastT = performance.now();
    return r;
  };
})((window.SOL14 = window.SOL14 || {}));
