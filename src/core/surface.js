/**
 * SOL 14: RED HORIZON — Yüzey Oynanışı: dünya yerleşimi, 0.38g fizik ve etkileşimler (K2)
 * Dünya koordinatı: x metre (hava kilidi = 0). Hava kilidinin sağı keşif koridorudur (1 px = 1.2 m),
 * solu üs alanıdır (1 px = 0.2 m) — üs yapıları sprite ölçeğinde, koridor gerçek mesafede gösterilir.
 */
(function (S) {
  'use strict';
  const G = () => S.DATA.gameplay;
  const Surf = {};

  Surf.GROUND_Y = 300;
  Surf.mToPx = (m) => (m >= 0 ? m / G().metersPerPixel : m / G().baseAreaMetersPerPixel);
  Surf.pxToM = (px) => (px >= 0 ? px * G().metersPerPixel : px * G().baseAreaMetersPerPixel);
  Surf.worldLeftPx = () => -700;
  Surf.worldRightPx = () => Surf.mToPx(G().maxEvaRangeM);

  /** Üs yapıları (piksel konumu = yapının sol kenarı) */
  Surf.STRUCTURES = [
    { id: 'mav', sprite: 'mav_rocket', px: -668, w: 110, action: 'mav', labelKey: 'world.mav' },
    { id: 'isru', sprite: 'moxie_unit', px: -540, w: 78, action: 'sabatier', labelKey: 'world.isru' },
    { id: 'solar', sprite: 'solar_clean', px: -444, w: 104, action: 'clean_panels', labelKey: 'world.solar' },
    { id: 'greenhouse', sprite: 'greenhouse_ok', px: -324, w: 150, action: 'greenhouse', labelKey: 'world.greenhouse' },
    { id: 'habitat', sprite: null, px: -162, w: 160, action: 'door', labelKey: 'world.door', interactPx: -10 }
  ];

  Surf.interactables = function (s) {
    const list = Surf.STRUCTURES.map((st) => ({
      id: st.id,
      kind: 'structure',
      px: st.interactPx !== undefined ? st.interactPx : st.px + st.w / 2,
      action: st.action,
      labelKey: st.labelKey,
      range: 34
    }));
    if (S.Sim.has(s, 'rimfax')) {
      list.push({ id: 'ice', kind: 'ice', px: Surf.mToPx(S.DATA.terrain.iceDepositM), action: 'dig_ice', labelKey: 'world.ice', range: 26 });
    }
    for (const c of S.Forensics.cases()) {
      list.push({
        id: c.id,
        kind: 'wreck',
        px: Surf.mToPx(c.distanceM),
        action: 'wreck',
        labelKey: 'world.wreck',
        range: S.DATA.gameplay.wreckInteractRangeM / G().metersPerPixel,
        name: c.name
      });
    }
    return list;
  };

  Surf.nearest = function (s, px) {
    let best = null;
    for (const it of Surf.interactables(s)) {
      const d = Math.abs(px - it.px);
      if (d <= it.range && (!best || d < best.d)) best = { it, d };
    }
    return best ? best.it : null;
  };

  Surf.inSandPit = function (m) {
    return S.DATA.terrain.sandPits.some((p) => m >= p.fromM && m <= p.toM);
  };

  /* ---------------- Oyuncu fiziği (gerçek zaman, saniye) ---------------- */
  const body = { px: 0, y: 0, vy: 0, onGround: true, moving: false, actionT: 0, stepT: 0, landedT: 0, ix: 560 };
  Surf.body = body;

  Surf.gravityPx = () => S.DATA.constants.marsGravity.value * G().spritePxPerMeter;
  /** 0.38g'de zıplama yüksekliği ≈ Dünya'nın 2.6 katı: h_mars = h_dünya · g_dünya / g_mars */
  Surf.jumpVelocityPx = function () {
    const c = S.DATA.constants.marsGravity;
    const hMars = G().earthJumpHeightM * (c.earthValue / c.value);
    return Math.sqrt(2 * Surf.gravityPx() * hMars * G().spritePxPerMeter);
  };

  Surf.syncFromState = function (s) {
    body.px = Surf.mToPx(s.player.x);
    body.y = 0;
    body.vy = 0;
    body.onGround = true;
    if (typeof s.player.ix === 'number') body.ix = s.player.ix;
  };

  Surf.speedFactor = function (s) {
    let f = s.suit.frozen ? S.DATA.constants.eva.frozenSpeedFactor : 1;
    // Sarkaç deneyi ödülü: 0.38g yürüyüş kalibrasyonu kum tuzağındaki hız kaybını azaltır
    if (Surf.inSandPit(s.player.x)) f *= s.rewards.sandPitSpeedFactor || S.DATA.terrain.sandPitSpeedFactor;
    return f;
  };

  /** Dış dünya güncellemesi. input: { dir: -1|0|1, jump: bool } */
  Surf.update = function (s, dt, input) {
    const speed = G().walkPxPerSecond * Surf.speedFactor(s);
    body.moving = input.dir !== 0;
    if (input.dir !== 0) s.player.facing = input.dir;
    body.px = Math.max(Surf.worldLeftPx(), Math.min(Surf.worldRightPx(), body.px + input.dir * speed * dt));

    if (input.jump && body.onGround && !s.suit.frozen) {
      body.vy = Surf.jumpVelocityPx();
      body.onGround = false;
      S.bus.emit('audio:play', 'jump');
      S.bus.emit('fx:puff', { px: body.px, size: 1 });
    }
    if (!body.onGround) {
      body.y += body.vy * dt;
      body.vy -= Surf.gravityPx() * dt;
      if (body.y <= 0) {
        body.y = 0;
        body.vy = 0;
        body.onGround = true;
        body.landedT = 0.25;
        S.bus.emit('audio:play', 'land');
        S.bus.emit('fx:puff', { px: body.px, size: 2 });
      }
    }
    if (body.moving && body.onGround) {
      body.stepT -= dt;
      if (body.stepT <= 0) {
        body.stepT = s.suit.frozen ? 0.6 : 0.32;
        S.bus.emit('audio:play', 'step');
        if (Math.random() < 0.5) S.bus.emit('fx:puff', { px: body.px - s.player.facing * 6, size: 0 });
      }
    }
    if (body.actionT > 0) body.actionT -= dt;
    if (body.landedT > 0) body.landedT -= dt;
    s.player.x = Surf.pxToM(body.px);
    S.Forensics.updateDiscovery(s);
  };

  Surf.pose = function (s) {
    if (body.actionT > 0) return 'action';
    if (s.suit.frozen) return 'frozen';
    if (!body.onGround) return 'jump';
    if (body.moving) return 'walk';
    return 'idle';
  };

  /* ---------------- Habitat içi (kesit görünüm) ---------------- */
  Surf.INTERIOR = {
    left: 70,
    right: 590,
    floorY: 186,
    stations: [
      { id: 'bunk', x: 112, action: 'sleep' },
      { id: 'locker', x: 196, action: 'refill_suit' },
      { id: 'charger', x: 262, action: 'charge_suit' },
      { id: 'workbench', x: 318, action: 'repair_suit' },
      { id: 'power', x: 372, action: 'power' },
      { id: 'lab', x: 448, action: 'lab' },
      { id: 'comms', x: 520, action: 'comms' },
      { id: 'airlock', x: 576, action: 'exit' }
    ]
  };

  Surf.updateInterior = function (s, dt, input) {
    const I = Surf.INTERIOR;
    body.moving = input.dir !== 0;
    if (input.dir !== 0) s.player.facing = input.dir;
    body.ix = Math.max(I.left, Math.min(I.right, body.ix + input.dir * G().walkPxPerSecond * 0.7 * dt));
    s.player.ix = body.ix;
    if (body.moving) {
      body.stepT -= dt;
      if (body.stepT <= 0) {
        body.stepT = 0.36;
        S.bus.emit('audio:play', 'step');
      }
    }
  };

  Surf.nearestStation = function () {
    let best = null;
    for (const st of Surf.INTERIOR.stations) {
      const d = Math.abs(body.ix - st.x);
      if (d < 30 && (!best || d < best.d)) best = { st, d };
    }
    return best ? best.st : null;
  };

  Surf.enterHabitat = function (s) {
    s.player.inside = true;
    // RIT-08: habitata dönüş = güvenli alan; kısa bir süre yeni zorunlu kriz tetiklenmez
    s.calmUntil = s.totalMinutes + G().habitatCalmMinutes;
    S.bus.emit('habitat:enter', { sol: s.sol });
    s.player.x = 0;
    body.ix = Surf.INTERIOR.right - 10;
    s.player.ix = body.ix;
    s.player.facing = -1;
    S.bus.emit('audio:play', 'door');
  };

  Surf.exitHabitat = function (s) {
    s.player.inside = false;
    s.player.x = 4;
    s.player.facing = 1;
    Surf.syncFromState(s);
    S.bus.emit('audio:play', 'door');
  };

  S.Surface = Surf;
})((window.SOL14 = window.SOL14 || {}));
