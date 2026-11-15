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
  // K2 trial: west of the base (past the MAV) lies a fictional ice field, drawn at corridor
  // scale like the east (data: terrain.westRegion). Without that data the world ends at the MAV.
  const West = () => S.DATA.terrain.westRegion || null;
  const baseEdgePx = () => -(West() ? West().baseEdgeM : 140) / G().baseAreaMetersPerPixel;
  Surf.mToPx = function (m) {
    if (m >= 0) return m / G().metersPerPixel;
    const edgeM = West() ? West().baseEdgeM : Infinity;
    if (-m <= edgeM) return m / G().baseAreaMetersPerPixel;
    return baseEdgePx() - (-m - edgeM) / G().metersPerPixel; // the ice field, corridor scale
  };
  Surf.pxToM = function (px) {
    if (px >= 0) return px * G().metersPerPixel;
    if (!West() || px >= baseEdgePx()) return px * G().baseAreaMetersPerPixel;
    return -(West().baseEdgeM + (baseEdgePx() - px) * G().metersPerPixel);
  };
  Surf.worldLeftPx = () => (West() ? Surf.mToPx(-West().endM) : -700);
  // The player stops at the face of the ice wall; the camera may still look past it (worldLeftPx).
  Surf.playerLeftPx = (s) => {
    let lim = West() && West().iceWallFromM ? Surf.mToPx(-West().iceWallFromM) + 6 : Surf.worldLeftPx();
    // an ice block not yet dug through stops the player on its east side
    if (s && West() && West().iceBarriers) {
      const open = Surf.salvage(s).barriersOpen || [];
      West().iceBarriers.forEach((b, i) => {
        const face = Surf.barrierFacePx(b);
        if (!open.includes(i) && body.px >= face - 2) lim = Math.max(lim, face);
      });
    }
    return lim;
  };
  Surf.barrierFacePx = (b) => Surf.mToPx(-b.atM) + 14;
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
    // the ice sealing the lost lander: break it with repeated E presses
    const w = West();
    if (w && w.iceCave && !Surf.salvage(s).iceBroken) {
      list.push({
        id: 'ice_seal',
        kind: 'ice_seal',
        px: Surf.mToPx(-w.iceCave.atM),
        action: 'break_ice',
        labelKey: 'prompt.break_ice',
        range: w.iceCave.breakRangeM / G().metersPerPixel
      });
    }
    // the Deep Space 2 probe frozen in at the foot of the mountain
    if (w && w.finalProbe && !Surf.salvage(s).probeFound) {
      list.push({
        id: 'probe',
        kind: 'probe',
        px: Surf.mToPx(-w.finalProbe.atM),
        action: 'dig_probe',
        labelKey: 'prompt.dig_probe',
        range: w.finalProbe.rangeM / G().metersPerPixel
      });
    }
    // ice blocks across the glacier path
    if (w && w.iceBarriers) {
      const open = Surf.salvage(s).barriersOpen || [];
      w.iceBarriers.forEach((b, i) => {
        if (open.includes(i)) return;
        list.push({
          id: 'barrier' + i,
          kind: 'ice_barrier',
          index: i,
          px: Surf.barrierFacePx(b),
          // the words appear only until the first block is dug through; after that just a pickaxe
          action: open.length === 0 ? 'dig_barrier' : 'dig_barrier_again',
          labelKey: open.length === 0 ? 'prompt.dig_barrier' : 'prompt.dig_barrier_again',
          range: w.barrierRangeM / G().metersPerPixel
        });
      });
    }
    return list;
  };

  /** One hit on an ice block: costs game time (suit O2, and the cold keeps biting); enough hits open the way. */
  Surf.digBarrier = function (s, i) {
    const w = West();
    const b = w.iceBarriers[i];
    const sv = Surf.salvage(s);
    sv.barriersOpen = sv.barriersOpen || [];
    sv.barrierHits = sv.barrierHits || {};
    if (!b || sv.barriersOpen.includes(i)) return;
    sv.barrierHits[i] = (sv.barrierHits[i] || 0) + 1;
    body.actionT = 0.4;
    S.Sim.advance(s, w.barrierMinutesPerHit);
    const n = sv.barrierHits[i];
    S.bus.emit('ice:hit', { px: Surf.mToPx(-b.atM), hits: n, total: b.hits, barrier: true });
    if (n >= b.hits) {
      sv.barriersOpen.push(i);
      S.bus.emit('audio:play', 'quake');
      // no notice: the tunnel opening is the feedback
    } else {
      S.bus.emit('audio:play', 'land');
    }
  };

  /** Digging the probe out of the ice: same cost per hit as an ice block. */
  Surf.digProbe = function (s) {
    const w = West();
    const p = w.finalProbe;
    const sv = Surf.salvage(s);
    if (sv.probeFound) return;
    sv.probeHits = (sv.probeHits || 0) + 1;
    body.actionT = 0.4;
    S.Sim.advance(s, w.barrierMinutesPerHit);
    S.bus.emit('ice:hit', { px: Surf.mToPx(-p.atM) - 12, hits: sv.probeHits, total: p.hits, barrier: true });
    if (sv.probeHits >= p.hits) {
      sv.probeFound = true;
      if (!sv.found.includes('ds2_probe')) sv.found.push('ds2_probe');
      S.bus.emit('audio:play', 'bonus');
      messages.queue.unshift({ key: 'west.notice', px: Surf.mToPx(-p.atM), sound: 'success', tone: 'ok' });
    } else {
      S.bus.emit('audio:play', 'land');
    }
  };

  /** One hit on the ice: costs game time (and so suit O2); enough hits break it open. */
  Surf.breakIce = function (s) {
    const cave = West().iceCave;
    const sv = Surf.salvage(s);
    if (sv.iceBroken) return;
    sv.iceHits = (sv.iceHits || 0) + 1;
    body.actionT = 0.4;
    S.Sim.advance(s, cave.minutesPerHit);
    S.bus.emit('ice:hit', { px: Surf.mToPx(-cave.atM), hits: sv.iceHits, total: cave.hitsToBreak });
    if (sv.iceHits >= cave.hitsToBreak) {
      sv.iceBroken = true;
      S.bus.emit('audio:play', 'quake');
      // no notice: the lander showing through the broken ice is the feedback
    } else {
      S.bus.emit('audio:play', 'land');
    }
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
    // K2 trial: the blizzard (FICTIONAL) slows a walker heading west into it, a little heading home
    const bz = Surf.blizzard(s);
    if (bz.k > 0) {
      const cfg = West().blizzard;
      const into = s.player.facing < 0 ? cfg.headwindSpeedFactor : cfg.tailwindSpeedFactor;
      f *= 1 - (1 - into) * bz.k * bz.gust;
    }
    return f;
  };

  /**
   * Blizzard strength where the player stands. k: 0 east of blizzard.fromM, rising to 1 at fullM.
   * gust: 0.55..1, slow waves in real time, so the storm comes and goes while you push through.
   */
  let stormClock = 0;
  Surf.blizzard = function (s) {
    const w = West();
    if (!w || !w.blizzard || s.player.inside) return { k: 0, gust: 0 };
    const d = -s.player.x;
    const x = Math.min(1, Math.max(0, (d - w.blizzard.fromM) / (w.blizzard.fullM - w.blizzard.fromM)));
    const g = 0.5 + 0.5 * Math.sin(stormClock * 0.7) * Math.sin(stormClock * 0.23 + 1.1);
    return { k: x * x * (3 - 2 * x), gust: 0.55 + 0.45 * g };
  };

  /** Dış dünya güncellemesi. input: { dir: -1|0|1, jump: bool } */
  Surf.update = function (s, dt, input) {
    stormClock += dt;
    body.moving = input.dir !== 0;
    if (input.dir !== 0) s.player.facing = input.dir;
    const speed = G().walkPxPerSecond * Surf.speedFactor(s);
    body.px = Math.max(Surf.playerLeftPx(s), Math.min(Surf.worldRightPx(), body.px + input.dir * speed * dt));

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
    Surf.updateWest(s, dt);
  };

  /* ---------------- K2 trial: the western ice field ---------------- */
  /** How icy the ground is at x metres: 0 (dust) to 1 (ice field), rising smoothly westwards. */
  Surf.iciness = function (m) {
    const w = West();
    if (!w || m >= 0) return 0;
    const k = Math.min(1, Math.max(0, (-m - w.frostStartM) / (w.iceFullM - w.frostStartM)));
    return k * k * (3 - 2 * k);
  };

  /** Salvage found so far, kept in the saved run. */
  Surf.salvage = function (s) {
    s.salvage = s.salvage || { found: [], seen: [] };
    return s.salvage;
  };

  // Trail messages wait their turn, so two never sit on top of each other (real seconds).
  const MESSAGE_GAP_S = 2.6;
  const messages = { queue: [], wait: 0 };

  /** Pick up parts on the way, and say once what the trail shows as the astronaut walks west. */
  Surf.updateWest = function (s, dt = 0) {
    const w = West();
    if (!w || s.player.inside) return;
    const sv = Surf.salvage(s);
    const dist = -s.player.x; // metres west of the airlock
    const say = (id, key, sound, tone, px) => {
      if (sv.seen.includes(id)) return;
      sv.seen.push(id);
      messages.queue.push({ key, sound, tone: tone || 'warn', px });
    };
    // discoveries show only a "!" over the thing found; danger keeps its words
    const notice = (id, px) => say(id, 'west.notice', 'scan', 'warn', px);
    messages.wait = Math.max(0, messages.wait - dt);
    if (messages.queue.length && messages.wait === 0) {
      const m = messages.queue.shift();
      S.bus.emit('fx:float', { text: S.t(m.key), px: m.px !== undefined ? m.px : body.px, tone: m.tone });
      if (m.sound) S.bus.emit('audio:play', m.sound);
      messages.wait = MESSAGE_GAP_S;
    }
    // Only what matters gets a message: a vehicle in sight, a find, and danger. The trail signs
    // (tracks, craters, polygons, ...) speak for themselves on screen.
    if (dist >= w.iceCave.atM - 50 && !sv.iceBroken) notice('cave', Surf.mToPx(-w.iceCave.atM));
    if (dist >= w.cold.deepColdFromM) say('deepcold', 'west.notice', 'freeze', 'bad');
    if (s.suit.frozen && dist >= w.cold.deepColdFromM) say('frozen', 'west.notice', 'freeze', 'bad');
    if (dist >= w.iceWallFromM - 25) say('wall', 'west.notice', 'alarm', 'bad');
    if (w.finalProbe && dist >= w.finalProbe.atM - 50 && !sv.probeFound) notice('probe', Surf.mToPx(-w.finalProbe.atM));
    if (w.blizzard && dist >= w.blizzard.fromM + 60) say('blizzard', 'west.notice', 'alarm', 'bad');
    if (w.iceBarriers) {
      // one notice for the first ice block only: after that the player knows to dig
      const b0 = w.iceBarriers[0];
      if (dist >= b0.atM - 30) notice('barrier0', Surf.barrierFacePx(b0));
    }
    // western wrecks: a "!" over the wreck instead of a text toast when it is first identified
    for (const c of S.Forensics.cases()) {
      if (c.distanceM < 0 && Math.abs(dist + c.distanceM) < 120) notice('wreck_' + c.id, Surf.mToPx(c.distanceM));
    }
    for (const part of w.parts) {
      if (sv.found.includes(part.id) || Math.abs(dist - part.atM) > w.pickupRangeM) continue;
      if (part.hiddenIn === 'cave' && !sv.iceBroken) continue; // still sealed in the ice
      sv.found.push(part.id);
      body.actionT = 0.5;
      // a find goes to the front of the queue: it is what the player just did
      messages.queue.unshift({ key: 'west.notice', px: Surf.mToPx(-part.atM), sound: 'bonus', tone: 'ok' });
    }
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
