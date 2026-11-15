/**
 * SOL 14: RED HORIZON — Yüzey Oynanışı: dünya yerleşimi, 0.38g fizik ve etkileşimler (K2)
 * Dünya koordinatı: x metre (hava kilidi = 0). D-012 haritası üs merkezli ve iki yönlüdür:
 *   x ≥ 0            sağ rota (enkazlar → kayalık yaklaşım → +600 m lav tüneli ağzı), 1 px = metersPerPixel
 *   baseLeftM ≤ x < 0 üs alanı: yapılar sprite ölçeğinde, baseLeftM → baseLeftPx
 *   x < baseLeftM    sol buz rotası (−450 m sınırı), 1 px = metersPerPixel
 * Lav tüneli ayrı bir alt haritadır: s.player.zone === 'cave', konum s.player.cx (tünel metresi).
 */
(function (S) {
  'use strict';
  const G = () => S.DATA.gameplay;
  const MAP = () => S.DATA.terrain.map;
  const CAVE = () => S.DATA.explore.cave;
  const Surf = {};

  Surf.GROUND_Y = 300;
  const baseMpp = () => MAP().baseLeftM / MAP().baseLeftPx;
  Surf.mToPx = function (m) {
    if (m >= 0) return m / G().metersPerPixel;
    if (m >= MAP().baseLeftM) return m / baseMpp();
    return MAP().baseLeftPx + (m - MAP().baseLeftM) / G().metersPerPixel;
  };
  Surf.pxToM = function (px) {
    if (px >= 0) return px * G().metersPerPixel;
    if (px >= MAP().baseLeftPx) return px * baseMpp();
    return MAP().baseLeftM + (px - MAP().baseLeftPx) * G().metersPerPixel;
  };
  Surf.worldLeftPx = () => Surf.mToPx(MAP().leftLimitM);
  Surf.worldRightPx = () => Surf.mToPx(MAP().eastEndM) + 24;

  /* Lav tüneli alt haritası: yüzeyle aynı ölçek (gameplay.metersPerPixel) → aynı ekran hızı */
  Surf.caveMToPx = (m) => m / G().metersPerPixel;
  Surf.cavePxToM = (px) => px * G().metersPerPixel;
  Surf.inCave = (s) => s.player.zone === 'cave';

  /** Zemin yüksekliği (px, yukarı pozitif): kayalık yaklaşımdaki kayaların üstü */
  Surf.groundAt = function (px) {
    for (const b of S.DATA.terrain.boulders || []) {
      const c = Surf.mToPx(b.atM);
      if (px >= c - b.widthPx / 2 && px <= c + b.widthPx / 2) return b.heightPx;
    }
    return 0;
  };

  // Batı buz alanı (K2 Sude, data terrain.westRegion): koridor ölçeğinde, harita sınırı leftLimitM
  const West = () => S.DATA.terrain.westRegion || null;
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

  /** Üs yapıları (piksel konumu = yapının sol kenarı) */
  Surf.STRUCTURES = [
    { id: 'mav', sprite: 'mav_rocket', px: -668, w: 110, action: 'mav', labelKey: 'world.mav' },
    { id: 'isru', sprite: 'moxie_unit', px: -540, w: 78, action: 'sabatier', labelKey: 'world.isru' },
    { id: 'solar', sprite: 'solar_clean', px: -444, w: 104, action: 'clean_panels', labelKey: 'world.solar' },
    { id: 'greenhouse', sprite: 'greenhouse_ok', px: -324, w: 150, action: 'greenhouse', labelKey: 'world.greenhouse' },
    // Astronot iniş mekiğinde yaşar: kapı mekiğin merdiveni (hava kilidi = 0 m); ayrı habitat binası yok
    { id: 'habitat', sprite: null, px: -40, w: 80, action: 'door', labelKey: 'world.door', interactPx: 0 }
  ];

  /** Lav tüneli içindeki etkileşimler (px: tünel pikseli) */
  Surf.caveInteractables = function (s) {
    const cc = CAVE();
    const r = cc.interactRangeM / G().metersPerPixel;
    const list = [
      { id: 'ladder', kind: 'cave', action: 'ascend', px: Surf.caveMToPx(cc.ladderM), range: r },
      { id: 'relay', kind: 'cave', action: 'relay', px: Surf.caveMToPx(cc.relayM), range: r }
    ];
    for (const f of cc.finds) list.push({ id: f.id, kind: 'cave_find', action: 'cave_find', px: Surf.caveMToPx(f.atM), range: r });
    for (const st of cc.studies) list.push({ id: st.id, kind: 'cave_study', action: 'cave_study', px: Surf.caveMToPx(st.atM), range: r * 0.8 });
    // Kurgusal İZCİ-1 rover'ının parçaları: E ile FIELD CAM fotoğrafı
    for (const pt of cc.scout.parts) list.push({ id: pt.id, kind: 'scout', action: 'scout', px: Surf.caveMToPx(pt.atM), range: r * 0.8 });
    // Kişi 5: tünel duvarındaki maden damarları (matkapla delinir; bitenler listeden çıkar)
    if (S.Explore && S.Explore.mineralSites) {
      const mr = S.DATA.explore.minerals.interactRangeM / G().metersPerPixel;
      for (const st of S.Explore.mineralSites('cave')) {
        if (!S.Explore.mineralDone(s, st)) list.push({ id: st.id, kind: 'mineral', action: 'mineral', px: Surf.caveMToPx(st.atM), range: mr });
      }
    }
    return list;
  };

  /** Oyuncunun bulunduğu alt haritadaki pikseli */
  Surf.playerPx = (s) => (Surf.inCave(s) ? body.cpx : body.px);

  /** Yapı bu tasarımda kurulu mu? ISRU ünitesi yalnızca MOXIE seçildiyse vardır */
  Surf.structureBuilt = (s, st) => st.id !== 'isru' || S.Sim.hasIsru(s);

  Surf.interactables = function (s) {
    if (Surf.inCave(s)) return Surf.caveInteractables(s);
    // Üs sistemleri mekikteki atölyede üretilip kurulunca dışarıda görünür ve etkileşime açılır
    const list = Surf.STRUCTURES.filter((st) => Surf.structureBuilt(s, st) && (st.id === 'habitat' || S.Sim.deployed(s, st.id))).map((st) => {
      const px = st.interactPx !== undefined ? st.interactPx : st.px + st.w / 2;
      // D-016 (K2 Sude): elde dolu şişeyle sera suyu alır (E sulamayı oynatır)
      if (st.id === 'greenhouse' && S.Sim.bottle(s) === 'full' && s.greenhouse.installed && !s.greenhouse.frozen)
        return { id: st.id, kind: 'structure', px, action: 'water_gh', range: 34 };
      return { id: st.id, kind: 'structure', px, action: st.action, labelKey: st.labelKey, range: 34 };
    });
    if (S.Sim.has(s, 'rimfax')) {
      list.push({ id: 'ice', kind: 'ice', px: Surf.mToPx(S.DATA.terrain.iceDepositM), action: 'dig_ice', labelKey: 'world.ice', range: 26 });
    }
    // Araçlar hazır görünmez: yalnızca kazılıp ortaya çıkarılmış enkaz etkileşime açılır
    for (const c of S.Forensics.cases()) {
      if (!S.Forensics.identified(s, c)) continue;
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
    // D-012 sol rota: buz kümeleri (kalıcı durum s.explore.ice); tamamlananlar listeden çıkar
    if (S.Explore && s.explore) {
      const ir = S.DATA.explore.ice.interactRangeM / G().metersPerPixel;
      for (const c of S.Explore.clusters()) {
        if (S.Explore.iceStep(s, c.id) === 'done') continue;
        list.push({ id: c.id, kind: 'ice_cluster', action: 'ice_cluster', px: Surf.mToPx(c.atM), range: ir + c.size * 3 });
      }
    }
    // Kazı noktaları: gömülü araçlar, sahte tümsekler ve çökmüş tünel penceresi (bitenler listeden çıkar)
    if (S.Explore && s.explore) {
      const dr = S.DATA.explore.dig.interactRangeM / G().metersPerPixel;
      for (const st of S.Explore.digSites()) {
        if (S.Explore.siteDone(s, st)) continue;
        list.push({ id: st.id, kind: 'dig', action: 'dig', px: Surf.mToPx(S.Explore.siteAt(st)), range: dr });
      }
    }
    // Kişi 5: yüzeydeki maden noktaları (tarayıcı yanında öter; bitenler listeden çıkar)
    if (S.Explore && s.explore && S.Explore.mineralSites) {
      const mr = S.DATA.explore.minerals.interactRangeM / G().metersPerPixel;
      for (const st of S.Explore.mineralSites('surface')) {
        if (!S.Explore.mineralDone(s, st)) list.push({ id: st.id, kind: 'mineral', action: 'mineral', px: Surf.mToPx(st.atM), range: mr });
      }
    }
    // Lav tüneli ağzı (merdiven + röle): pencere kazılıp açılınca
    if (S.Explore && S.Explore.tubeOpen(s)) list.push({ id: 'tube', kind: 'tube', action: 'descend', px: Surf.mToPx(MAP().tubeMouthM), range: 20 });
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
    // D-016: the clean ice at the back of the glacier ice cave fills the bottle
    if (w && w.shelterCave) {
      const b = S.Sim.bottle(s);
      list.push({
        id: 'ice_vein',
        kind: 'ice_vein',
        px: Surf.mToPx(-w.shelterCave.veinM),
        action: b === 'empty' ? 'fill_bottle' : b === 'full' ? 'fill_bottle_full' : 'fill_bottle_none',
        range: w.shelterCave.fillRangeM / G().metersPerPixel
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
    // Kargo aracının parçaları: görünür olunca E ile alınır (yürürken kendiliğinden toplanmaz)
    if (w && w.parts) {
      const sv = Surf.salvage(s);
      for (const part of w.parts) {
        if (sv.found.includes(part.id) || (part.hiddenIn === 'cave' && !sv.iceBroken)) continue;
        list.push({ id: 'part_' + part.id, kind: 'part', partId: part.id, action: 'pick_part', px: Surf.mToPx(-part.atM), range: w.pickupRangeM / G().metersPerPixel });
      }
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

  /** Kargo aracı parçasını al: oyun dakikası harcar */
  Surf.pickPart = function (s, partId) {
    const w = West();
    const sv = Surf.salvage(s);
    const part = w && w.parts.find((pt) => pt.id === partId);
    if (!part || sv.found.includes(partId)) return { ok: false };
    sv.found.push(partId);
    body.actionT = 0.5;
    S.Sim.advance(s, S.DATA.explore.westFinds.pickMinutes);
    S.bus.emit('audio:play', 'bonus');
    const parts = w.parts.map((pt) => pt.id);
    return { ok: true, n: parts.filter((id) => sv.found.includes(id)).length, total: parts.length };
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
    if (px === undefined) px = Surf.playerPx(s);
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

  /** Ingenuity kum tuzaklarını önceden işaretler ve yürüyüşü sert zeminden geçirir (terrain.droneRoutesAroundSandPits) */
  Surf.sandPitAvoided = (s) => Boolean(S.Sim.has(s, 'ingenuity') && S.DATA.terrain.droneRoutesAroundSandPits);

  /* ---------------- Oyuncu fiziği (gerçek zaman, saniye) ---------------- */
  const body = { px: 0, cpx: 0, y: 0, vy: 0, onGround: true, moving: false, actionT: 0, stepT: 0, landedT: 0, ix: 560, crouchK: 0, crouching: false };
  Surf.body = body;

  Surf.gravityPx = () => S.DATA.constants.marsGravity.value * G().spritePxPerMeter;
  /** 0.38g'de zıplama yüksekliği ≈ Dünya'nın 2.6 katı: h_mars = h_dünya · g_dünya / g_mars */
  Surf.jumpVelocityPx = function () {
    const c = S.DATA.constants.marsGravity;
    const hMars = G().earthJumpHeightM * (c.earthValue / c.value);
    return Math.sqrt(2 * Surf.gravityPx() * hMars * G().spritePxPerMeter);
  };

  Surf.syncFromState = function (s) {
    // Eski kayıtlarda (D-012 öncesi 1600 m'lik koridor) konum yeni sınırlara kırpılır
    const minM = MAP().leftLimitM;
    const maxM = Surf.pxToM(Surf.worldRightPx());
    if (s.player.x > maxM || s.player.x < minM) s.player.x = Math.max(minM, Math.min(maxM, s.player.x));
    body.px = Surf.mToPx(s.player.x);
    body.cpx = Surf.caveMToPx(Math.max(0, Math.min(CAVE().lengthM, s.player.cx || 0)));
    body.y = Surf.inCave(s) ? 0 : Surf.groundAt(body.px);
    body.vy = 0;
    body.onGround = true;
    if (typeof s.player.ix === 'number') body.ix = s.player.ix;
  };

  /**
   * Ekrandaki yürüme hızı ayrı bir sayı değildir, veriden türetilir:
   * px/s = eva.speedMPerMin [m/oyun dk] × oyun saati [oyun dk/gerçek s] ÷ metersPerPixel [m/px]
   * Böylece koridorda yürünen metre / oyun dakikası her modda eva.speedMPerMin'e eşittir (O₂-metre hesabı dürüst kalır).
   */
  Surf.walkPxPerSecond = (s) => (S.DATA.constants.eva.speedMPerMin * S.Sim.gameMinutesPerRealSecond(s)) / G().metersPerPixel;

  Surf.speedFactor = function (s) {
    let f = s.suit.frozen ? S.DATA.constants.eva.frozenSpeedFactor : 1;
    f *= S.Sim.needsSpeedFactor(s); // kritik açlık/susuzluk/yorgunluk yavaşlatır
    // Sarkaç deneyi ödülü: 0.38g yürüyüş kalibrasyonu kum tuzağındaki hız kaybını azaltır (kum çukurları yalnızca yüzeyde;
    // Ingenuity rotayı önceden keşfettiyse çukurun çevresinden dolaşılır)
    if (!Surf.inCave(s) && Surf.inSandPit(s.player.x) && !Surf.sandPitAvoided(s)) f *= s.rewards.sandPitSpeedFactor || S.DATA.terrain.sandPitSpeedFactor;
    // D-016: a full water bottle slows the walk (same factor as the M4 notch)
    f *= S.Sim.carrySpeedFactor(s);
    // Çömelerek yürümek yavaştır (gameplay.crouch)
    f *= 1 - (1 - G().crouch.speedFactor) * body.crouchK;
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
   * Açılmış buz bloklarının tünelleri (westlands.js çizer): astronot ayakta sığmaz, ancak çömelerek geçer.
   * px: yüzey pikseli. Tünel bloğun ortasında ±TUNNEL_HALF_PX genişliğindedir.
   */
  Surf.TUNNEL_HALF_PX = 15;
  Surf.inTunnel = function (s, px) {
    const w = West();
    if (!w || !w.iceBarriers || s.player.inside) return false;
    const open = Surf.salvage(s).barriersOpen || [];
    return w.iceBarriers.some((b, i) => open.includes(i) && Math.abs(px - Surf.mToPx(-b.atM)) <= Surf.TUNNEL_HALF_PX);
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
    // D-016: the glacier ice cave keeps the blizzard out (fades over its mouths)
    return { k: x * x * (3 - 2 * x) * (1 - S.Sim.shelterK(s)), gust: 0.55 + 0.45 * g };
  };

  /**
   * Yüzey ve lav tüneli AYNI hareket kodunu kullanır (yürüme hızı, 0.38g zıplama, iniş, adım sesi, ayak tozu).
   * Yalnızca konum alanı ve sınırlar farklıdır: yüzeyde body.px (kayalar dahil), tünelde body.cpx (0 … son duvar).
   * Tünel de yüzeyle aynı metre/piksel ölçeğindedir, bu yüzden ekrandaki hız iki yerde de aynıdır.
   */
  Surf.update = function (s, dt, input) {
    stormClock += dt;
    const cave = Surf.inCave(s);
    const key = cave ? 'cpx' : 'px';
    const minPx = cave ? 0 : Surf.playerLeftPx(s); // buz duvarı ve kazılmamış buz blokları geçilmez
    const maxPx = cave ? Surf.caveMToPx(CAVE().lengthM) : Surf.worldRightPx(); // tünelde son kaya odasının duvarı geçilmez
    const groundAt = cave ? () => 0 : Surf.groundAt;
    const speed = Surf.walkPxPerSecond(s) * Surf.speedFactor(s);
    body.moving = input.dir !== 0;
    if (input.dir !== 0) s.player.facing = input.dir;
    // Çömelme: S / ↓ basılıyken (zıplama W / ↑ gibi; ← / → ile birlikte çömelerek yürür); havadayken çömelinmez
    // Tünelin içinde ayağa kalkılmaz: tavan alçak (içeri çömelerek girildi)
    body.crouching = body.onGround && (Boolean(input.crouch) || (!cave && Surf.inTunnel(s, body.px)));
    const ck = dt / G().crouch.seconds;
    body.crouchK = body.crouching ? Math.min(1, body.crouchK + ck) : Math.max(0, body.crouchK - ck);
    let nx = Math.max(minPx, Math.min(maxPx, body[key] + input.dir * speed * dt));
    // Kayalık yaklaşım: yerdeyken yüksek kayaya yürüyerek çıkılmaz (zıpla); kayanın üstünde durulabilir
    const stepUp = groundAt(nx) - body.y;
    body.blockHint = null;
    if (stepUp > 3) {
      nx = body[key];
      body.blockedT = 0.6;
    }
    // Açılmış buz bloğu tüneli alçak: ayakta girilmez, ↓ ile eğilip sürünerek geçilir
    if (!cave && Surf.inTunnel(s, nx) && !Surf.inTunnel(s, body[key]) && body.crouchK < 0.9) {
      nx = body[key];
      body.blockedT = 0.6;
      body.blockHint = 'hint.crouch';
    }
    body[key] = nx;
    const floor = groundAt(body[key]);
    if (body.onGround && body.y > floor) body.onGround = false; // kayadan düştü

    if (input.jump && body.onGround && !s.suit.frozen && body.crouchK < 0.3) {
      body.vy = Surf.jumpVelocityPx();
      body.onGround = false;
      S.bus.emit('audio:play', 'jump');
      S.bus.emit('surface:jump', {});
      S.bus.emit('fx:puff', { px: body[key], size: 1 });
    }
    if (body.blockedT > 0) body.blockedT -= dt;
    if (!body.onGround) {
      body.y += body.vy * dt;
      body.vy -= Surf.gravityPx() * dt;
      if (body.y <= floor) {
        body.y = floor;
        body.vy = 0;
        body.onGround = true;
        body.landedT = 0.25;
        S.bus.emit('audio:play', 'land');
        S.bus.emit('fx:puff', { px: body[key], size: 2 });
      }
    }
    if (body.moving && body.onGround) {
      body.stepT -= dt;
      if (body.stepT <= 0) {
        body.stepT = s.suit.frozen ? 0.6 : body.crouching ? 0.55 : 0.32; // çömelikken sürünür: seyrek, hafif ses
        S.bus.emit('audio:play', 'step');
        if (Math.random() < 0.5) S.bus.emit('fx:puff', { px: body[key] - s.player.facing * 6, size: 0 });
      }
    }
    if (body.actionT > 0) body.actionT -= dt;
    if (body.landedT > 0) body.landedT -= dt;
    if (cave) {
      s.player.cx = Surf.cavePxToM(body.cpx);
      return;
    }
    s.player.x = Surf.pxToM(body.px);
    if (S.Station) S.Station.collect(s, body.y);
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
  let lastShelter = false;

  /** Say once what the trail shows as the astronaut walks west (danger keeps its words; finds get a "!"). */
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
    // D-016: walking into the glacier ice cave (every time) and seeing its mouth (once)
    const shel = S.Sim.inShelter(s);
    if (shel && !lastShelter) messages.queue.unshift({ key: 'shelter.enter', tone: 'ok', sound: 'scan' });
    lastShelter = shel;
    if (w.shelterCave && dist >= w.shelterCave.fromM - 60) notice('shelter', Surf.mToPx(-w.shelterCave.fromM));
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
    // Buried wrecks get no notice here: they show only once dug out (S.Explore.dig); the suit scanner reacts near them.
  };

  Surf.pose = function (s) {
    if (body.actionT > 0) return 'action';
    if (s.suit.frozen) return 'frozen';
    if (!body.onGround) return 'jump';
    if (body.crouchK > 0.05) return 'crouch';
    if (body.moving) return 'walk';
    // Elbise tarayıcısı gerçek bir gömülü noktanın yanında öter: astronot diz çöker (sahte tümsekte tepki yok)
    if (S.Explore && s.explore && !Surf.inCave(s)) {
      const ping = S.Explore.scannerPing(s);
      if (ping && ping.close) return 'action';
    }
    return 'idle';
  };

  /* ---------------- Habitat içi (kesit görünüm) ---------------- */
  /* Mekik içi (K4 Sedef'in mekik kesiti, scr_ship_interior): istasyonlar görseldeki yerlerinde (640 px genişlikte) */
  Surf.INTERIOR = {
    left: 112,
    right: 612,
    floorY: 186,
    stations: [
      { id: 'comms', x: 140, action: 'comms' },
      { id: 'power', x: 205, action: 'power' },
      { id: 'charger', x: 270, action: 'charge_suit' },
      { id: 'locker', x: 340, action: 'refill_suit' },
      { id: 'lab', x: 418, action: 'lab' },
      { id: 'workshop', x: 478, action: 'workshop' },
      { id: 'workbench', x: 528, action: 'repair_suit' },
      { id: 'bunk', x: 572, action: 'sleep' },
      { id: 'bottles', x: 592, action: 'bottle' }, // D-016 (K2 Sude): su şişesi rafı hava kilidinin yanında
      { id: 'airlock', x: 612, action: 'exit' }
    ]
  };

  Surf.updateInterior = function (s, dt, input) {
    const I = Surf.INTERIOR;
    body.moving = input.dir !== 0;
    if (input.dir !== 0) s.player.facing = input.dir;
    body.ix = Math.max(I.left, Math.min(I.right, body.ix + input.dir * G().interiorWalkPxPerSecond * dt));
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
    // D-012: üs = bulgu raporlama merkezi; toplanan kalıntılar rapor paketi olur
    if (S.Explore && s.explore) {
      const filed = S.Explore.fileRelicReports(s);
      if (filed.length) S.bus.emit('explore:filed', { relics: filed });
    }
    s.player.x = 0;
    s.player.zone = 'surface';
    body.ix = Surf.INTERIOR.right - 10;
    s.player.ix = body.ix;
    s.player.facing = -1;
    S.bus.emit('audio:play', 'door');
  };

  Surf.exitHabitat = function (s) {
    s.player.inside = false;
    s.player.zone = 'surface';
    s.player.x = 4;
    s.player.facing = 1;
    Surf.syncFromState(s);
    S.bus.emit('audio:play', 'door');
  };

  S.Surface = Surf;
})((window.SOL14 = window.SOL14 || {}));
