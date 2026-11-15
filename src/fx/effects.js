/**
 * SOL 14: RED HORIZON — Dünya Oluşturucu ve Görsel Efektler (K4)
 * Kamera + parallax, üs yapıları, enkazlar, astronot, gece aydınlatması, hava olayları,
 * vizör buzlanması, sarsıntı, halüsinasyon. Simülasyondan yalnızca bus olaylarıyla haber alır.
 */
(function (S) {
  'use strict';
  /** Tasarım alanı: tüm dünya koordinatları (zemin y=300, habitat kesiti) 640×360 içinde çizilir */
  const BASE_W = 640;
  const BASE_H = 360;
  /** Kamera, oyuncuyu ekran genişliğinin bu oranında tutar */
  const CAM_LEAD = 0.42;
  /**
   * Gerçek tuval boyutu (main.js fitStage pencere oranına göre ayarlar; en az 640×360).
   * Geniş pencerede W büyür (yanlarda daha fazla dünya), uzun pencerede H büyür: fazlası üstte gökyüzü olur,
   * yani dünya OFF_Y kadar aşağı kayar ve zemin/HUD ilişkisi 16:9'daki gibi kalır.
   */
  let W = BASE_W;
  let H = BASE_H;
  let OFF_Y = 0;
  const FX = {
    BASE_W,
    BASE_H,
    view: { w: BASE_W, h: BASE_H, offY: 0 },
    camX: -300,
    shake: 0,
    stormVis: 0,
    dustDevil: 0,
    toxic: 0,
    glitch: 0,
    flare: 0,
    heat: 0,
    leakPuffT: 0,
    hallucT: 0,
    particles: [],
    windDust: []
  };

  function initWindDust() {
    FX.windDust = [];
    for (let i = 0; i < 70; i++) {
      FX.windDust.push({ x: Math.random() * W, y: 120 + Math.random() * 200, v: 20 + Math.random() * 40, s: Math.random() < 0.2 ? 2 : 1 });
    }
  }

  FX.init = function () {
    initWindDust();
    S.bus.on('fx:weather', (p) => {
      if (!p) return;
      if (p.type === 'quake') {
        FX.shake = 3.2;
        S.bus.emit('audio:play', 'quake');
      } else if (p.type === 'dust_devil') FX.dustDevil = 25;
      else if (p.type === 'toxic') FX.toxic = 12;
      else if (p.type === 'glitch') {
        FX.glitch = 6;
        S.bus.emit('audio:play', 'glitch');
      } else if (p.type === 'flare') FX.flare = 1;
      else if (p.type === 'heat') FX.heat = 10;
      else if (p.type === 'leak') S.bus.emit('audio:play', 'leak');
      else if (p.type === 'frost') S.bus.emit('audio:play', 'freeze');
    });
    S.bus.on('fx:puff', (p) => {
      const n = p.size === 2 ? 10 : p.size === 1 ? 6 : 2;
      for (let i = 0; i < n; i++) {
        FX.particles.push({
          x: p.px + (Math.random() - 0.5) * 12,
          y: S.Surface.GROUND_Y - 1,
          vx: (Math.random() - 0.5) * 30,
          vy: -Math.random() * 14,
          life: 0.6 + Math.random() * 0.6,
          max: 1.2,
          c: 'dust'
        });
      }
    });
    S.bus.on('eva:frozen', () => S.bus.emit('audio:play', 'freeze'));
    // RIT-04: eylem sonucu dünyada yükselen yazı
    S.bus.on('fx:float', (p) => {
      if (!p || !p.text) return;
      FX.floats.push({ text: String(p.text), px: p.px, y: 0, life: 2.2, tone: p.tone || 'ok' });
    });
  };

  FX.floats = [];

  FX.drawFloats = function (ctx, dt, groundY) {
    if (!FX.floats.length) return;
    ctx.save();
    ctx.font = 'bold 9px "VT323", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of FX.floats) {
      f.life -= dt;
      f.y += dt * 14;
      const x = FX.worldToScreen(f.px);
      const y = Math.round(groundY - 78 - f.y);
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.6));
      ctx.fillStyle = 'rgba(8,10,14,0.75)';
      const w = ctx.measureText(f.text).width + 8;
      ctx.fillRect(Math.round(x - w / 2), y - 7, Math.round(w), 14);
      ctx.fillStyle = f.tone === 'ok' ? '#3fe08a' : '#ffc233';
      ctx.fillText(f.text, x, y);
    }
    ctx.restore();
    FX.floats = FX.floats.filter((f) => f.life > 0);
  };

  FX.worldToScreen = (px) => Math.round(px - FX.camX);

  /** main.js fitStage: tuvalin iç çözünürlüğü değişti */
  FX.setView = function (w, h) {
    W = Math.max(BASE_W, Math.round(w));
    H = Math.max(BASE_H, Math.round(h));
    OFF_Y = H - BASE_H;
    FX.view = { w: W, h: H, offY: OFF_Y };
  };

  /** Kamerayı oyuncuya anında hizala (sahneye giriş / habitattan çıkış) */
  FX.focusCamera = function (px) {
    FX.camX = px - W * CAM_LEAD;
  };

  /**
   * Tasarım alanındaki bir ekran noktasını (x: tuval pikseli, y: 640×360 tasarım y'si) sahnenin yüzdesine çevirir.
   * DOM'daki dünya-bağlı öğeler (ör. [E] etkileşim balonu) tuvalle hizalı kalsın diye.
   */
  FX.toStagePct = function (x, yBase) {
    return { left: (x / W) * 100, top: ((yBase + OFF_Y) / H) * 100 };
  };

  /** Tam tuval kaplaması (dünya OFF_Y kadar ötelenmişken de üst şeridi örter) */
  function fillView(ctx) {
    ctx.fillRect(0, -OFF_Y, W, H);
  }

  /** Görüntüyü tuvali kaplayacak şekilde, en-boy oranını bozmadan ortalayarak çizer (CSS object-fit: cover; tuval koordinatı) */
  function drawCover(ctx, img) {
    const k = Math.max(W / img.width, H / img.height);
    const dw = Math.round(img.width * k);
    const dh = Math.round(img.height * k);
    ctx.drawImage(img, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
  }

  /* ------------------------------------------------------------------ */
  function drawSprite(ctx, key, x, y, flip, alpha) {
    const img = S.Sprites.get(key);
    if (!img) return null;
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(Math.round(x) + img.width, Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
    } else {
      ctx.drawImage(img, Math.round(x), Math.round(y));
    }
    ctx.restore();
    return img;
  }

  /** Yürüme döngüsü: astronaut_walk_sheet yatay şeridi (6 kare, kaynak GIF'te kare başına 140 ms). Şerit yoksa false */
  const WALK_FRAMES = 6;
  const WALK_FPS = 1 / 0.14;
  function drawWalk(ctx, cx, bottomY, flip, t, rate) {
    const img = S.Sprites.get('astronaut_walk_sheet');
    if (!img) return false;
    const fw = img.width / WALK_FRAMES;
    const f = Math.floor(t * WALK_FPS * rate) % WALK_FRAMES;
    const x = Math.round(cx - fw / 2);
    const y = Math.round(bottomY - img.height);
    ctx.save();
    if (flip) {
      ctx.translate(x + fw, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, f * fw, 0, fw, img.height, 0, 0, fw, img.height);
    } else {
      ctx.drawImage(img, f * fw, 0, fw, img.height, x, y, fw, img.height);
    }
    ctx.restore();
    return true;
  }

  function drawOnGround(ctx, key, leftPx, groundY, flip) {
    const img = S.Sprites.get(key);
    if (!img) return null;
    drawSprite(ctx, key, leftPx - FX.camX, groundY - img.height + 2, flip);
    return img;
  }

  /* ------------------------------------------------------------------ */
  FX.render = function (ctx, s, dt, t) {
    ctx.imageSmoothingEnabled = false;
    if (s.player.inside) {
      FX.renderInterior(ctx, s, dt, t);
      return;
    }
    if (s.player.zone === 'cave') {
      FX.renderCave(ctx, s, dt, t);
      FX.drawFade(ctx, dt);
      return;
    }
    const Surf = S.Surface;
    const body = Surf.body;
    const GY = Surf.GROUND_Y;
    const site = s.design.landingSiteId;
    const minute = s.minute;
    const light = S.Art.lighting(minute);
    const L = S.Lander;
    const landingAstro = L && L.active ? L.astronaut() : null;

    // Kamera (iniş sahnesinde önce iniş alanı, sonra kapaktan inen astronot)
    const focusPx = L && L.active ? (landingAstro ? landingAstro.px : L.padPx()) : body.px;
    const target = Math.max(Surf.worldLeftPx() - 20, Math.min(Surf.worldRightPx() - W + 60, focusPx - W * CAM_LEAD));
    FX.camX += (target - FX.camX) * Math.min(1, dt * 6);
    if (Math.abs(target - FX.camX) > 400) FX.camX = target;

    ctx.save();
    FX.shakeX = 0;
    FX.shakeY = 0;
    if (FX.shake > 0) {
      FX.shake -= dt;
      // Sarsıntı kayması saklanır: HUD'un dünyaya bağlı işaretleri aynı karede aynı miktarda kayar
      FX.shakeX = Math.round((Math.random() - 0.5) * 6 * Math.min(1, FX.shake));
      FX.shakeY = Math.round((Math.random() - 0.5) * 4 * Math.min(1, FX.shake));
      ctx.translate(FX.shakeX, FX.shakeY);
    }

    // Gökyüzü tuvalin tamamını kaplar; geri kalan her şey tasarım koordinatında, OFF_Y kadar aşağıda çizilir
    S.Art.drawSky(ctx, site, minute, W, H, { horizonY: 250 + OFF_Y });
    ctx.save();
    ctx.translate(0, OFF_Y);

    // Sırtlar + zemin
    S.Art.drawRidges(ctx, site, minute, FX.camX, W);
    // Doğu rotasının bölge manzarası (göl yatağı, kum tepeleri, krater alanı, lav ovası)
    if (S.DigFx) S.DigFx.drawBackdrop(ctx, s, FX.camX, W, minute);
    const map = S.DATA.terrain.map;
    const west = S.DATA.terrain.westRegion;
    // Zeminde metre işareti yok: yön ve uzaklık HUD'daki hedef kartında ve rota şeridinde
    const markers = [];
    const sandPits = S.DATA.terrain.sandPits.map((p) => ({ x0: Surf.mToPx(p.fromM), x1: Surf.mToPx(p.toM) }));
    S.Art.drawGround(ctx, site, minute, FX.camX, W, BASE_H, GY, {
      markers,
      sandPits,
      revealSand: S.Sim.has(s, 'ingenuity'),
      // Buzlanma batı buz alanının kırağı çizgisinden başlar (westRegion, K2 Sude)
      iceFromPx: Surf.mToPx(west ? -west.frostStartM : map.baseLeftM + 20),
      iceFullPx: Surf.mToPx(west ? -west.iceFullM : map.leftLimitM + 100)
    });
    if (S.DigFx) S.DigFx.drawGroundDetail(ctx, s, FX.camX, W, BASE_H, GY, minute);
    FX.drawRoute(ctx, s, t, GY, light);
    // Batı buz alanı (K2 Sude): zemin batıya doğru buza döner; izler ve kraterler enkazlara götürür
    if (S.Westlands) S.Westlands.drawLand(ctx, s, FX.camX, W, BASE_H, GY, t);

    // Buz yatağı (RIMFAX)
    if (S.Sim.has(s, 'rimfax')) {
      const ix = FX.worldToScreen(Surf.mToPx(S.DATA.terrain.iceDepositM));
      ctx.fillStyle = 'rgba(170,220,255,0.55)';
      ctx.fillRect(ix - 14, GY + 3, 28, 4);
      ctx.fillStyle = '#9fd8ff';
      ctx.fillRect(ix - 10, GY + 4, 4, 1);
      ctx.fillRect(ix + 4, GY + 5, 6, 1);
      ctx.fillStyle = '#3fe0e6';
      ctx.fillRect(ix, GY - 16, 1, 16);
      ctx.fillRect(ix + 1, GY - 16, 6, 4);
    }

    // Üs yapıları
    for (const st of Surf.STRUCTURES) {
      if (st.id === 'habitat') continue; // astronot iniş mekiğinde yaşar (mekik ayrıca çizilir)
      let key = st.sprite;
      if (st.id === 'solar') key = s.res.panelDust > 0.35 ? 'solar_dusty' : 'solar_clean';
      if (st.id === 'greenhouse') {
        if (!s.greenhouse.installed && S.Sim.deployed(s, 'greenhouse')) continue;
        key = s.greenhouse.frozen ? 'greenhouse_frozen' : 'greenhouse_ok';
      }
      // MOXIE seçilmediyse ISRU ünitesi hiç kurulmaz (Sabatier yakıt partisi yok)
      if (!Surf.structureBuilt(s, st)) continue;
      // Üs sistemi mekikteki atölyede üretilip kurulana kadar dışarıda yok
      if (!S.Sim.deployed(s, st.id)) continue;
      drawOnGround(ctx, key, st.px, GY);
      if (st.id === 'greenhouse' && !s.greenhouse.frozen && light.dark > 0.3) {
        ctx.globalAlpha = 0.25 * light.dark;
        ctx.fillStyle = '#ff7ad9';
        ctx.fillRect(FX.worldToScreen(st.px + 20), GY - 70, 110, 66);
        ctx.globalAlpha = 1;
      }
    }

    // Kazı noktaları (tümsek, buz, moloz), yoldaki döküntü, RIMFAX sinyali
    if (S.DigFx) S.DigFx.drawSites(ctx, s, FX.camX, W, GY, t, light);

    // Enkazlar: hazır görünmez; yalnızca kazılıp ortaya çıkarılınca çizilir (sinyal halkası / soluk siluet yok)
    for (const c of S.Forensics.cases()) {
      if (!S.Forensics.identified(s, c)) continue;
      const px = Surf.mToPx(c.distanceM);
      const sx = FX.worldToScreen(px);
      if (sx < -140 || sx > W + 140) continue;
      const rec = s.forensics[c.id];
      const img = S.Sprites.get(c.sprite);
      if (img) drawSprite(ctx, c.sprite, sx - img.width / 2, GY - img.height + 4);
      if (rec.queued) {
        ctx.fillStyle = '#3fe08a';
        ctx.fillRect(sx + 2, GY - (img ? img.height : 40) - 12, 1, 12);
        ctx.fillRect(sx + 3, GY - (img ? img.height : 40) - 12, 6, 4);
      }
    }

    // Mekik (iniş sahnesi ya da iniş alanında kalıcı dekor)
    if (L && (L.active || (s.lander && s.lander.landed))) {
      L.draw(ctx, GY, FX.worldToScreen, t, light.dark, S.Art.palette(site, minute));
      if (L.active) L.drawFx(ctx, GY, FX.worldToScreen, t);
    }
    // Batı buz alanı (K2 Sude): moloz, kayıp kargo aracı ve parçaları, buz blokları, sonda
    if (S.Westlands) S.Westlands.drawObjects(ctx, s, FX.camX, W, GY, t);

    // Ingenuity
    if (S.Sim.has(s, 'ingenuity') && !(L && L.active)) {
      const dx = body.px - 30 * s.player.facing;
      FX.droneX = FX.droneX === undefined ? dx : FX.droneX + (dx - FX.droneX) * Math.min(1, dt * 1.5);
      const hover = Math.sin(t * 3) * 3;
      const night = light.dark > 0.6;
      const img = S.Sprites.get('drone_ingenuity');
      if (img) {
        const dyx = night ? Surf.STRUCTURES[4].px + 60 : FX.droneX;
        const dyy = night ? GY - 78 - img.height : GY - 120 + hover;
        drawSprite(ctx, 'drone_ingenuity', FX.worldToScreen(dyx) - img.width / 2, dyy);
      }
    }

    // Parçacıklar (ayak tozu)
    for (const p of FX.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 6 * dt;
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.8;
      ctx.fillStyle = p.c === 'leak' ? '#f2f6ff' : '#d79a6a';
      ctx.fillRect(FX.worldToScreen(p.x), Math.round(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;
    FX.particles = FX.particles.filter((p) => p.life > 0);

    // Astronot (iniş sahnesinde kapak açılana kadar içeride, sonra rampadan iner)
    const hideAstro = L && L.active && !landingAstro;
    const pose = landingAstro ? (landingAstro.walking ? 'walk' : 'idle') : Surf.pose(s);
    const key = 'astronaut_' + pose;
    const img = S.Sprites.get(key) || S.Sprites.get('astronaut_idle');
    const ax = FX.worldToScreen(landingAstro ? landingAstro.px : body.px);
    let ay = GY + 2 - (landingAstro ? landingAstro.y : body.y);
    if (img && !hideAstro) {
      // Kum çukurunda adımlar yavaşlar (hareket hızıyla uyumlu)
      const walked = pose === 'walk' && drawWalk(ctx, ax, ay, s.player.facing < 0, t, Surf.inSandPit(s.player.x) ? 0.5 : 1);
      if (!walked) {
        if (pose === 'walk') ay -= Math.abs(Math.sin(t * 9)) > 0.5 ? 1 : 0;
        drawSprite(ctx, img === S.Sprites.get(key) ? key : 'astronaut_idle', ax - img.width / 2, ay - img.height, s.player.facing < 0);
      }
      // Gölge (kayanın üstündeyken kaya yüzeyine düşer)
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      const floorH = landingAstro ? 0 : Surf.groundAt(body.px);
      const sh = Math.max(6, 20 - (body.y - floorH) * 0.2);
      ctx.fillRect(ax - sh / 2, GY + 1 - floorH, sh, 2);
      ctx.globalAlpha = 1;
      // Elbise tarayıcısı: gerçek bir gömülü noktanın yanında "!" (sahte tümsek tepki vermez)
      if (S.DigFx && !landingAstro) S.DigFx.drawScanner(ctx, s, ax, ay - img.height, t);
    }
    // Kayaya takılınca kısa zıplama ipucu
    if (body.blockedT > 0 && !hideAstro) {
      ctx.save();
      ctx.font = 'bold 8px "VT323", "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(8,10,14,0.75)';
      const txt = S.t('hint.jump');
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillRect(Math.round(ax - tw / 2), ay - 80, Math.round(tw), 12);
      ctx.fillStyle = '#ffc233';
      ctx.fillText(txt, ax, ay - 74);
      ctx.restore();
    }
    // Sızıntı puf'ları
    if (s.suit.leak) {
      FX.leakPuffT -= dt;
      if (FX.leakPuffT <= 0) {
        FX.leakPuffT = 0.15;
        FX.particles.push({ x: body.px - s.player.facing * 8, y: ay - 40, vx: -s.player.facing * 20 + (Math.random() - 0.5) * 10, vy: -8, life: 0.7, max: 0.7, c: 'leak' });
      }
    }

    // Toz şeytanı
    if (FX.dustDevil > 0) {
      FX.dustDevil -= dt;
      const dd = S.Sprites.get('vfx_dust_devil');
      if (dd) {
        const ddx = W * 0.7 + Math.sin(t * 0.6) * 140;
        drawSprite(ctx, 'vfx_dust_devil', ddx - dd.width / 2, GY - dd.height + 6, false, Math.min(1, FX.dustDevil / 3));
      }
    }

    // Rüzgâr tozu / fırtına
    const storm = s.weather.stormTau > 0;
    FX.stormVis += ((storm ? 1 : 0) - FX.stormVis) * Math.min(1, dt * 0.8);
    const windK = 0.25 + FX.stormVis * 2.5;
    ctx.fillStyle = '#e6a477';
    for (const d of FX.windDust) {
      d.x += d.v * windK * dt;
      if (d.x > W) {
        d.x = -4;
        d.y = 100 + Math.random() * 220;
      }
      ctx.globalAlpha = 0.25 + FX.stormVis * 0.5;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.s * (1 + FX.stormVis * 2), d.s);
    }
    ctx.globalAlpha = 1;
    if (FX.stormVis > 0.02) {
      ctx.fillStyle = 'rgba(176, 82, 38,' + FX.stormVis * 0.45 + ')';
      fillView(ctx);
      const sv = S.Sprites.get('vfx_dust_storm');
      if (sv) {
        // Toz dokusu tuval yüksekliğine ölçeklenir ve yatayda döşenir (oran korunur, uzatma yok)
        const tw = Math.max(1, Math.round((sv.width * H) / sv.height));
        const off = (t * 120) % tw;
        ctx.globalAlpha = FX.stormVis * 0.55;
        for (let x = -off; x < W; x += tw) ctx.drawImage(sv, Math.round(x), -OFF_Y, tw, H);
        ctx.globalAlpha = 1;
      }
    }

    // Gece karartması + ışıklar
    if (light.dark > 0.02) {
      ctx.fillStyle = 'rgba(6, 8, 22,' + light.dark * 0.5 + ')';
      fillView(ctx);
      // Kask lambası konisi
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 * light.dark;
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      const hx = ax + s.player.facing * 6;
      const hy = ay - 48;
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + s.player.facing * 140, GY - 4);
      ctx.lineTo(hx + s.player.facing * 50, GY + 6);
      ctx.fill();
      ctx.restore();
    }
    if (light.dusk > 0.05) {
      ctx.fillStyle = 'rgba(80, 130, 200,' + light.dusk * 0.12 + ')';
      fillView(ctx);
    }

    // Halüsinasyon (moral düşük)
    if (s.res.morale < 35) {
      FX.hallucT += dt;
      const show = Math.sin(FX.hallucT * 0.9) > 0.75;
      if (show) drawSprite(ctx, 'vfx_shadow_hallucination', W - 70, GY - 64, true, 0.35 + Math.random() * 0.2);
    }

    // Kriz efektleri
    if (FX.toxic > 0) {
      FX.toxic -= dt;
      ctx.fillStyle = 'rgba(190, 210, 60,' + Math.min(0.22, FX.toxic * 0.03) + ')';
      fillView(ctx);
    }
    if (FX.heat > 0) {
      FX.heat -= dt;
      ctx.fillStyle = 'rgba(255, 60, 30,' + Math.min(0.15, FX.heat * 0.02) + ')';
      fillView(ctx);
    }
    if (FX.flare > 0) {
      FX.flare = Math.max(0, FX.flare - dt * 0.4);
      ctx.fillStyle = 'rgba(255, 250, 220,' + FX.flare * 0.6 + ')';
      fillView(ctx);
    }
    FX.drawFloats(ctx, dt, GY);
    ctx.restore(); // dünya ötelemesi (OFF_Y) biter; vizör ve parazit tüm tuvale çizilir
    FX.drawVisorFrost(ctx, s);
    if (S.Westlands) S.Westlands.drawScreenFrost(ctx, s, W, H);
    FX.drawGlitch(ctx, dt);
    ctx.restore();
    FX.drawFade(ctx, dt);
  };

  /** Tünel iniş/çıkış geçişinde kısa kararma */
  FX.fade = 0;
  FX.drawFade = function (ctx, dt) {
    if (FX.fade <= 0) return;
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, FX.fade) + ')';
    ctx.fillRect(0, 0, W, H);
    FX.fade = Math.max(0, FX.fade - dt * 2.2);
  };

  /* ------------------------------------------------------------------ */
  /* D-012 rota dekoru: buz kümeleri, kayalık yaklaşım, lav tüneli ağzı  */
  /* ------------------------------------------------------------------ */
  function px1(ctx, c, x, y, w, h) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  /** Buz kütlesi: boyut 1–3 (uzaklaştıkça büyür); kırılınca parçalar + ortaya çıkan kalıntı */
  function drawIce(ctx, s, c, sx, GY, t, dark) {
    const rec = s.explore.ice[c.id];
    const step = S.Explore.iceStep(s, c.id);
    const w = 14 + c.size * 12;
    const h = 10 + c.size * 11;
    const shade = (col) => S.Art.mix(col, '#101626', dark * 0.6);
    if (!rec.broken) {
      // Üst üste binmiş buz blokları
      const blocks = [
        [-w / 2, -h * 0.55, w * 0.55, h * 0.55],
        [-w * 0.05, -h * 0.75, w * 0.5, h * 0.75],
        [-w * 0.3, -h, w * 0.45, h * 0.5]
      ];
      for (const [bx, by, bw, bh] of blocks) {
        px1(ctx, shade('#9fc9dc'), sx + bx, GY + by, Math.round(bw), Math.round(bh));
        px1(ctx, shade('#d8f0fa'), sx + bx, GY + by, Math.round(bw), 2);
        px1(ctx, shade('#6f9fb8'), sx + bx + bw - 2, GY + by + 2, 2, Math.round(bh) - 2);
      }
      px1(ctx, shade('#eaf8ff'), sx - w * 0.2, GY - h * 0.6, 3, 1);
      // İpuçları: siluet / metal parıltısı / zayıf sinyal (yalnızca kalıntılı buzda)
      const hint = S.Explore.iceHint(s, c.id);
      if (hint === 'silhouette' || (hint === 'signal' && c.hint === 'silhouette')) {
        ctx.globalAlpha = 0.45;
        px1(ctx, '#3a3f4a', sx - 4, GY - h * 0.45, 9, 5);
        px1(ctx, '#3a3f4a', sx - 1, GY - h * 0.45 - 4, 3, 4);
        ctx.globalAlpha = 1;
      }
      if (hint === 'glint' || hint === 'signal') {
        if (Math.sin(t * 5 + c.atM) > 0.6) {
          px1(ctx, '#ffffff', sx + 2, GY - h * 0.35, 1, 3);
          px1(ctx, '#ffffff', sx + 1, GY - h * 0.35 + 1, 3, 1);
        }
      }
      if (hint === 'signal') {
        const pulse = (t * 1.1) % 1;
        ctx.strokeStyle = 'rgba(63,224,230,' + (1 - pulse) * 0.8 + ')';
        ctx.beginPath();
        ctx.arc(sx, GY - h / 2, 5 + pulse * 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (!rec.inspected) {
        // Öğretici: ilk küme daha kolay fark edilsin
        if (c.id === S.Explore.clusters()[0].id && Math.sin(t * 3) > 0) px1(ctx, '#ffc233', sx - 1, GY - h - 8, 3, 3);
      }
      return;
    }
    // Kırılmış: dağınık parçalar
    for (let i = 0; i < 6 + c.size * 2; i++) {
      const ox = Math.round((((i * 37) % 23) / 23 - 0.5) * w * 1.3);
      const sz = 2 + (i % 3);
      px1(ctx, shade(i % 2 ? '#a9d3e6' : '#cfeaf6'), sx + ox, GY - sz + 1, sz + 1, sz);
    }
    if (c.relic && !rec.collected) {
      if (c.relic === 'cable') {
        px1(ctx, '#e8692a', sx - 6, GY - 4, 12, 2);
        px1(ctx, '#e8692a', sx - 7, GY - 6, 3, 3);
        px1(ctx, '#b84a18', sx + 3, GY - 7, 4, 3);
      } else {
        px1(ctx, '#3b3f4a', sx - 5, GY - 8, 10, 7);
        px1(ctx, '#5c616e', sx - 5, GY - 8, 10, 1);
        px1(ctx, Math.sin(t * 4) > 0 ? '#3fe08a' : '#1a5e3c', sx + 2, GY - 6, 2, 1);
      }
      if (Math.sin(t * 6) > 0.3) px1(ctx, '#ffffff', sx - 2, GY - 10, 1, 1);
    }
    if (step === 'done' || rec.sampled) {
      px1(ctx, '#2b1a14', sx + w / 2, GY - 12, 1, 12);
      px1(ctx, '#3fe08a', sx + w / 2 + 1, GY - 12, 5, 3);
    }
  }

  /** Zıplanacak kaya: üst yüzeyi groundAt ile aynı (heightPx), gövdesi yuvarlatılmış katmanlı bazalt */
  function drawBoulder(ctx, sx, GY, b, pal) {
    const w = b.widthPx;
    const h = b.heightPx;
    const base = S.Art.mix(pal.rock, '#8a6a5a', 0.35);
    const hi = S.Art.mix(base, '#ffd9b0', 0.25);
    const lo = S.Art.mix(base, '#000000', 0.35);
    for (let i = 0; i < h; i++) {
      const inset = i < 3 ? 3 - i : 0;
      px1(ctx, base, sx - w / 2 + inset, GY - h + i, w - inset * 2, 1);
    }
    px1(ctx, hi, sx - w / 2 + 3, GY - h, w - 6, 2);
    px1(ctx, hi, sx - w / 2, GY - h + 3, 2, h - 4);
    px1(ctx, lo, sx + w / 2 - 3, GY - h + 3, 3, h - 2);
    px1(ctx, lo, sx - w / 2 + 3, GY - Math.round(h * 0.45), w - 6, 1);
    px1(ctx, base, sx - w / 2 - 4, GY - 5, 5, 6);
    px1(ctx, lo, sx + w / 2, GY - 4, 4, 5);
  }

  /** Lav tüneli ağzı: zemindeki açıklık, merdiven başı, işaret direği ve iletişim rölesi (uzaktan belirgin siluet) */
  function drawTubeMouth(ctx, sx, GY, t, pal, dark) {
    const hw = 26;
    px1(ctx, '#0d0709', sx - hw, GY, hw * 2, 40);
    px1(ctx, '#1d0f10', sx - hw + 3, GY, hw * 2 - 6, 3);
    px1(ctx, pal.rock, sx - hw - 8, GY - 4, 10, 6);
    px1(ctx, pal.rock, sx + hw - 2, GY - 5, 12, 7);
    px1(ctx, S.Art.mix(pal.rock, '#ffd9b0', 0.15), sx - hw - 7, GY - 4, 8, 1);
    // Merdiven başı (iki dikme + tutamak)
    px1(ctx, '#cfc7bb', sx - 6, GY - 14, 2, 30);
    px1(ctx, '#cfc7bb', sx + 4, GY - 14, 2, 30);
    for (let y = GY - 10; y < GY + 16; y += 5) px1(ctx, '#a39c91', sx - 4, y, 8, 1);
    px1(ctx, '#e8692a', sx - 7, GY - 15, 14, 2);
    // İşaret direği (yanıp sönen ışık, uzaktan görünür)
    px1(ctx, '#2b1a14', sx - hw - 14, GY - 46, 2, 46);
    px1(ctx, '#e8e2d8', sx - hw - 14, GY - 46, 2, 6);
    px1(ctx, '#e8692a', sx - hw - 14, GY - 40, 2, 6);
    const on = Math.sin(t * 4) > 0;
    px1(ctx, on ? '#ff5a3c' : '#5e2015', sx - hw - 15, GY - 50, 4, 4);
    if (on) {
      ctx.globalAlpha = 0.25 + dark * 0.4;
      px1(ctx, '#ff5a3c', sx - hw - 19, GY - 54, 12, 12);
      ctx.globalAlpha = 1;
    }
    // İletişim rölesi: anten + çanak
    px1(ctx, '#8d8f96', sx + hw + 10, GY - 30, 2, 30);
    px1(ctx, '#cfc7bb', sx + hw + 5, GY - 34, 12, 3);
    px1(ctx, '#cfc7bb', sx + hw + 7, GY - 37, 8, 3);
    px1(ctx, '#3b3d45', sx + hw + 7, GY - 8, 8, 8);
    px1(ctx, on ? '#3fe08a' : '#1a5e3c', sx + hw + 9, GY - 6, 2, 2);
  }

  FX.drawRoute = function (ctx, s, t, GY, light) {
    const Surf = S.Surface;
    const pal = S.Art.palette(s.design.landingSiteId, s.minute);
    const vis = (sx) => sx > -80 && sx < W + 80;
    if (S.Explore && s.explore) {
      for (const c of S.Explore.clusters()) {
        const sx = FX.worldToScreen(Surf.mToPx(c.atM));
        if (vis(sx)) drawIce(ctx, s, c, sx, GY, t, light.dark);
      }
    }
    // Kayalık yaklaşım: dekor taşları + zıplanacak kayalar
    for (let m = S.DATA.terrain.map.zones.find((z) => z.id === 'rocky_approach').fromM; m < S.DATA.terrain.map.tubeMouthM - 20; m += 17) {
      const sx = FX.worldToScreen(Surf.mToPx(m));
      if (!vis(sx)) continue;
      const k = (m * 7) % 5;
      px1(ctx, pal.rock, sx, GY - 2 - k, 4 + k, 3 + k);
    }
    for (const b of S.DATA.terrain.boulders || []) {
      const sx = FX.worldToScreen(Surf.mToPx(b.atM));
      if (vis(sx)) drawBoulder(ctx, sx, GY, b, pal);
    }
    // Tünel ağzı (merdiven, işaret, röle) yalnızca çökmüş pencere kazılıp açılınca görünür
    const tx = FX.worldToScreen(Surf.mToPx(S.DATA.terrain.map.tubeMouthM));
    if (vis(tx) && S.Explore.tubeOpen(s)) drawTubeMouth(ctx, tx, GY, t, pal, light.dark);
  };

  /* ------------------------------------------------------------------ */
  /* Lav tüneli alt haritası (kurgusal; D-012)                          */
  /* ------------------------------------------------------------------ */
  function caveBand(x, seed, amp) {
    return Math.round(amp * (0.6 * Math.sin(x * 0.021 + seed) + 0.3 * Math.sin(x * 0.057 + seed * 2.1) + 0.1 * Math.sin(x * 0.13 + seed)));
  }

  FX.renderCave = function (ctx, s, dt, t) {
    const Surf = S.Surface;
    const body = Surf.body;
    const cc = S.DATA.explore.cave;
    const GY = Surf.GROUND_Y;
    const endPx = Surf.caveMToPx(cc.lengthM);
    const roomPx = Surf.caveMToPx(cc.finds.find((f) => f.id === 'room').atM - 8);
    const ladderPx = Surf.caveMToPx(cc.ladderM);

    const target = Math.max(-60, Math.min(endPx - W + 80, body.cpx - W * CAM_LEAD));
    FX.camX += (target - FX.camX) * Math.min(1, dt * 6);
    if (Math.abs(target - FX.camX) > 400) FX.camX = target;

    ctx.save();
    FX.shakeX = 0;
    FX.shakeY = 0;
    if (FX.shake > 0) {
      FX.shake -= dt;
      FX.shakeX = Math.round((Math.random() - 0.5) * 6 * Math.min(1, FX.shake));
      FX.shakeY = Math.round((Math.random() - 0.5) * 4 * Math.min(1, FX.shake));
      ctx.translate(FX.shakeX, FX.shakeY);
    }
    // Arka plan: mor-kahve bazalt (referans: docs/design/references/lava-tube-reference.png)
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = S.Art.mix('#1c1319', '#2e2028', i / 11);
      ctx.fillRect(0, Math.floor((i * H) / 12), W, Math.ceil(H / 12) + 1);
    }
    ctx.translate(0, OFF_Y);
    // Uzak duvar: katmanlı bazalt (parallax), aşağı indikçe açılan tonlar ve turuncu kenar ışığı
    const layers = [
      { c: '#3a2a35', par: 0.3, y: 78, amp: 14, seed: 1.2 },
      { c: '#46323c', par: 0.35, y: 122, amp: 12, seed: 2.7 },
      { c: '#523a41', par: 0.42, y: 168, amp: 10, seed: 4.4 },
      { c: '#5e4245', par: 0.6, y: 212, amp: 9, seed: 6.1 }
    ];
    for (const Ly of layers) {
      ctx.fillStyle = Ly.c;
      for (let x = 0; x < W; x += 2) {
        const wx = x + FX.camX * Ly.par;
        const y = Ly.y + caveBand(wx, Ly.seed, Ly.amp);
        ctx.fillRect(x, y, 2, GY - y + 4);
      }
      ctx.fillStyle = S.Art.mix(Ly.c, '#c58b5f', 0.28);
      for (let x = 0; x < W; x += 2) {
        const wx = x + FX.camX * Ly.par;
        ctx.fillRect(x, Ly.y + caveBand(wx, Ly.seed, Ly.amp), 2, 1);
      }
      // Katman içi kırık blok dokusu
      ctx.fillStyle = S.Art.mix(Ly.c, '#000000', 0.22);
      for (let x = 0; x < W; x += 6) {
        const wx = Math.floor(x + FX.camX * Ly.par);
        if ((((wx * 2654435761) >>> 0) % 7) === 0) ctx.fillRect(x, Ly.y + caveBand(wx, Ly.seed, Ly.amp) + 6 + (wx % 9), 5, 1);
      }
    }
    // Tavan: girintili kaya kütlesi; son odada yükselir; merdivenin üstünde açıklık
    for (let x = 0; x < W; x += 2) {
      const wx = x + FX.camX;
      const roomK = Math.max(0, Math.min(1, (wx - roomPx) / 80));
      const base = 70 - roomK * 34 + caveBand(wx, 9.3, 10);
      const skyHole = Math.abs(wx - ladderPx) < 22;
      if (skyHole) continue;
      ctx.fillStyle = '#2a1c25';
      ctx.fillRect(x, -OFF_Y, 2, base + OFF_Y);
      ctx.fillStyle = '#3d2a33';
      ctx.fillRect(x, base - 10, 2, 7);
      // Açıklığa yakın kenarlar sıcak ışık alır
      const near = Math.max(0, 1 - Math.abs(wx - ladderPx) / 140);
      ctx.fillStyle = S.Art.mix('#4a3239', '#c47a4e', near * 0.8);
      ctx.fillRect(x, base - 3, 2, 3);
    }
    // Tavandaki açıklık + sıcak ışık huzmesi (merdivenin üstü)
    const lx = FX.worldToScreen(ladderPx);
    ctx.fillStyle = '#d99a6c';
    ctx.fillRect(lx - 20, -OFF_Y, 40, 40 + OFF_Y);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffcf9a';
    ctx.beginPath();
    ctx.moveTo(lx - 18, 40);
    ctx.lineTo(lx + 18, 40);
    ctx.lineTo(lx + 46, GY);
    ctx.lineTo(lx - 46, GY);
    ctx.fill();
    ctx.restore();
    // Zemin
    ctx.fillStyle = '#6e3a28';
    ctx.fillRect(0, GY, W, BASE_H - GY);
    ctx.fillStyle = '#9a5436';
    ctx.fillRect(0, GY, W, 2);
    ctx.fillStyle = '#4e281c';
    ctx.fillRect(0, GY + 2, W, 1);
    const startTile = Math.floor(FX.camX / 9) - 1;
    for (let i = startTile; i < startTile + W / 9 + 2; i++) {
      const r = Math.abs(Math.sin(i * 127.1) * 43758.5453) % 1;
      const sx = Math.round(i * 9 - FX.camX);
      if (r > 0.7) px1(ctx, '#2a1a1c', sx, GY - 3 + Math.round(r * 2), 5 + Math.round(r * 4), 4);
      if (r < 0.3) px1(ctx, '#41231b', sx, GY + 6 + Math.round(r * 30), 3, 1);
    }
    // Merdiven
    for (const side of [-6, 5]) px1(ctx, '#cfc7bb', lx + side, 30, 2, GY - 30);
    for (let y = 36; y < GY; y += 8) px1(ctx, '#a39c91', lx - 4, y, 9, 1);
    // Aydınlatma tripodları: kademeli sıcak ışık halesi
    for (const off of [20, 70, 190]) {
      const x = lx + off;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [r, a] of [[26, 0.05], [16, 0.07], [8, 0.1]]) {
        ctx.globalAlpha = a;
        ctx.fillStyle = '#ffb070';
        ctx.fillRect(x - r, GY - 16 - r, r * 2, r * 2);
      }
      ctx.restore();
      px1(ctx, '#e8692a', x - 4, GY - 12, 1, 12);
      px1(ctx, '#e8692a', x + 3, GY - 12, 1, 12);
      px1(ctx, '#e8692a', x, GY - 12, 1, 12);
      px1(ctx, '#3b3d45', x - 4, GY - 19, 9, 7);
      px1(ctx, '#fff1d0', x - 3, GY - 18, 7, 5);
    }
    // İletişim rölesi (merdiven tabanı): kutu + anten + durum ışığı
    const rx = FX.worldToScreen(Surf.caveMToPx(cc.relayM));
    px1(ctx, '#9da0a8', rx - 8, GY - 16, 16, 16);
    px1(ctx, '#c9ccd2', rx - 8, GY - 16, 16, 2);
    px1(ctx, '#6c6f78', rx + 5, GY - 14, 3, 14);
    px1(ctx, '#e8692a', rx - 8, GY - 6, 16, 2);
    px1(ctx, '#8d8f96', rx + 2, GY - 40, 2, 24);
    px1(ctx, '#cfc7bb', rx - 4, GY - 42, 12, 2);
    px1(ctx, '#cfc7bb', rx - 2, GY - 45, 8, 2);
    const rep = s.explore.reports.cave_survey;
    const lit = rep.queued || rep.sent ? '#3fe08a' : Math.sin(t * 4) > 0 ? '#ffc233' : '#5e4a15';
    px1(ctx, lit, rx - 5, GY - 12, 3, 3);
    px1(ctx, '#1b1d22', rx - 1, GY - 12, 5, 3);
    // Bulgular
    const done = s.explore.cave.finds;
    const fpx = (id) => FX.worldToScreen(Surf.caveMToPx(cc.finds.find((f) => f.id === id).atM));
    // İlk geçit: duvardaki dallanan kaya çatlağı
    const cx1 = fpx('crack');
    for (let y = 150; y < GY - 2; y += 5) {
      const x = cx1 + (((y * 7) % 9) - 4); // çatlak dikey ekseni etrafında zikzak
      px1(ctx, '#0d080b', x, y, 2, 6);
      px1(ctx, '#7a5450', x + 2, y + 1, 1, 4);
      if (y % 25 === 0) px1(ctx, '#0d080b', x - 7, y + 3, 7, 1);
      if (y % 35 === 0) px1(ctx, '#0d080b', x + 2, y + 4, 6, 1);
    }
    const bx = fpx('basalt');
    for (let i = 0; i < 5; i++) px1(ctx, i % 2 ? '#4a3434' : '#5e403a', bx - 22, GY - 34 + i * 7, 44 - i * 3, 6);
    px1(ctx, '#7a5248', bx - 22, GY - 34, 40, 1);
    for (const f of cc.finds) {
      const fx = fpx(f.id);
      if (done[f.id]) {
        px1(ctx, '#2b1a14', fx + 10, GY - 14, 1, 14);
        px1(ctx, '#3fe08a', fx + 11, GY - 14, 5, 3);
      } else if (Math.sin(t * 3 + f.atM) > 0) px1(ctx, '#ffc233', fx - 1, GY - 46, 3, 3);
    }
    // Kurgusal İZCİ-1 rover'ının parçaları (fotoğraflananlara kanıt etiketi)
    for (const pt of cc.scout.parts) {
      const x = FX.worldToScreen(Surf.caveMToPx(pt.atM));
      if (x < -80 || x > W + 80) continue;
      const shot = s.explore.cave.scout[pt.id] !== null && s.explore.cave.scout[pt.id] !== undefined;
      if (S.DigFx) S.DigFx.drawPart(ctx, pt.id, x, GY + 1, pt.id === 'body' ? 1.6 : 1, shot);
      if (!shot && Math.sin(t * 3 + pt.atM) > 0) px1(ctx, '#ffc233', x - 1, GY - 46, 3, 3);
    }
    // Son kaya odası: ölçüm noktaları ve cihazlar
    for (const st of cc.studies) {
      const x = FX.worldToScreen(Surf.caveMToPx(st.atM));
      const ok = S.Explore.studyDone(s, st.id);
      if (st.id === 'temp') {
        px1(ctx, '#cfc7bb', x, GY - 18, 1, 18);
        px1(ctx, '#ff5a3c', x - 1, GY - 6, 3, 4);
      } else if (st.id === 'distance') {
        px1(ctx, '#e8692a', x - 4, GY - 12, 1, 12);
        px1(ctx, '#e8692a', x + 3, GY - 12, 1, 12);
        px1(ctx, '#d6b23a', x - 3, GY - 17, 7, 5);
        if (ok) {
          ctx.globalAlpha = 0.6;
          px1(ctx, '#ff3c3c', x + 4, GY - 15, Math.round(endPx - FX.camX - x - 4), 1);
          ctx.globalAlpha = 1;
        }
      } else {
        for (const o of [-8, 0, 8]) px1(ctx, '#8d8f96', x + o, GY - 6, 2, 6);
        if (ok) px1(ctx, '#3fe08a', x - 1, GY - 10, 3, 2);
      }
      px1(ctx, ok ? '#3fe08a' : '#ffc233', x - 1, GY - 24, 3, 3);
    }
    // Geçilemeyen son duvar
    const ex = FX.worldToScreen(endPx);
    for (let y = -OFF_Y; y < GY + 2; y += 4) {
      const edge = ex + caveBand(y * 3, 3.3, 7); // düzensiz kaya yüzü
      px1(ctx, '#3a2830', edge, y, W, 4);
      px1(ctx, '#6a4a4a', edge, y, 2, 4);
    }
    for (let y = 40; y < GY; y += 14) {
      const edge = ex + caveBand(y * 3, 3.3, 7);
      px1(ctx, '#2a1c24', edge + 6, y + 6, 22 + ((y * 5) % 17), 1);
    }
    px1(ctx, '#4e3638', ex - 10, GY - 14, 14, 14);
    px1(ctx, '#6a4a4a', ex - 10, GY - 14, 12, 2);

    // Tünelin başı: merdivenin solunda kaya duvarı
    const sx0 = FX.worldToScreen(0);
    for (let y = -OFF_Y; y < GY + 2; y += 4) {
      const edge = sx0 - 6 - caveBand(y * 3, 7.7, 5);
      if (edge > 0) {
        px1(ctx, '#3a2830', 0, y, edge, 4);
        px1(ctx, '#6a4a4a', edge - 2, y, 2, 4);
      }
    }

    // Ayak tozu / zıplama-iniş puf'ları (yüzeyle aynı parçacık sistemi; px = tünel pikseli)
    for (const p of FX.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 6 * dt;
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.8;
      ctx.fillStyle = p.c === 'leak' ? '#f2f6ff' : '#a8603e';
      ctx.fillRect(FX.worldToScreen(p.x), Math.round(p.y), 2, 2);
    }
    ctx.globalAlpha = 1;
    FX.particles = FX.particles.filter((p) => p.life > 0);

    // Astronot: yüzeyle aynı poz mantığı (yürü / zıpla / eylem / donmuş) ve 0.38g zıplama yüksekliği
    const pose = Surf.pose(s);
    const key = 'astronaut_' + pose;
    const img = S.Sprites.get(key) || S.Sprites.get('astronaut_idle');
    const ax = FX.worldToScreen(body.cpx);
    let ay = GY + 2 - body.y;
    if (img) {
      const walked = pose === 'walk' && drawWalk(ctx, ax, ay, s.player.facing < 0, t, 1);
      if (!walked) {
        if (pose === 'walk') ay -= Math.abs(Math.sin(t * 9)) > 0.5 ? 1 : 0;
        drawSprite(ctx, S.Sprites.get(key) ? key : 'astronaut_idle', ax - img.width / 2, ay - img.height, s.player.facing < 0);
      }
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      const sh = Math.max(6, 20 - body.y * 0.2);
      ctx.fillRect(ax - sh / 2, GY + 1, sh, 2);
      ctx.globalAlpha = 1;
    }
    if (s.suit.leak) {
      FX.leakPuffT -= dt;
      if (FX.leakPuffT <= 0) {
        FX.leakPuffT = 0.15;
        FX.particles.push({ x: body.cpx - s.player.facing * 8, y: ay - 40, vx: -s.player.facing * 20 + (Math.random() - 0.5) * 10, vy: -8, life: 0.7, max: 0.7, c: 'leak' });
      }
    }
    // Karanlık + kask feneri konisi
    ctx.fillStyle = 'rgba(4,3,8,0.22)';
    ctx.fillRect(0, -OFF_Y, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    const hx = ax + s.player.facing * 6;
    const hy = ay - 48;
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + s.player.facing * 160, GY - 40);
    ctx.lineTo(hx + s.player.facing * 120, GY + 4);
    ctx.fill();
    ctx.restore();
    FX.drawFloats(ctx, dt, GY);
    ctx.restore();
    FX.drawVisorFrost(ctx, s);
    FX.drawGlitch(ctx, dt);
  };

  FX.drawVisorFrost = function (ctx, s) {
    if (S.Westlands && S.Westlands.ownsVisor(s)) return; // K2 trial: the ice field draws its own visor frost
    const eva = S.DATA.constants.eva;
    let a = 0;
    if (s.suit.frozen) a = 0.9;
    else if (s.suit.tempC < eva.suitNominalC - 8) a = Math.min(0.7, (eva.suitNominalC - 8 - s.suit.tempC) / 18);
    if (a <= 0.01) return;
    const img = S.Sprites.get(s.suit.frozen ? 'vfx_frost_2' : 'vfx_frost_1');
    if (img) {
      ctx.globalAlpha = a;
      drawCover(ctx, img);
      ctx.globalAlpha = 1;
    }
  };

  FX.drawGlitch = function (ctx, dt) {
    if (FX.glitch <= 0) return;
    FX.glitch -= dt;
    if (Math.random() < 0.5) return;
    for (let i = 0; i < 6; i++) {
      const y = Math.floor(Math.random() * H);
      const h = 2 + Math.floor(Math.random() * 10);
      const dx = Math.floor((Math.random() - 0.5) * 30);
      try {
        ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
      } catch (e) {
        /* yok say */
      }
    }
    ctx.fillStyle = 'rgba(63,224,230,0.08)';
    ctx.fillRect(0, 0, W, H);
  };

  /* ---------------- Habitat içi ---------------- */
  FX.renderInterior = function (ctx, s, dt, t) {
    const st = S.Surface.nearestStation();
    // 640 px'lik kesit geniş tuvalde ortalanır; uzun tuvalde yüzeydeki gibi OFF_Y kadar aşağı iner,
    // böylece alttaki habitat paneliyle (em ölçülü) ilişkisi her pencere oranında 16:9'daki gibi kalır.
    const ox = Math.round((W - BASE_W) / 2);
    const I = S.Surface.INTERIOR;
    const body = S.Surface.body;
    // Mekik kesiti (K4 Sedef): 640 px genişliğe ölçeklenir, güverte zemini (görselin %75.5'i) floorY'ye oturur
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);
    const ship = S.Sprites.get('ship_interior');
    if (ship) {
      const sh = Math.round((BASE_W * ship.height) / ship.width);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ship, ox, Math.round(OFF_Y + I.floorY - sh * 0.755), BASE_W, sh);
      ctx.imageSmoothingEnabled = false;
    } else {
      S.Art.drawInterior(ctx, s, st ? st.id : null, t, { w: W, h: H, ox, oy: OFF_Y });
    }
    // Yakındaki istasyonun işareti
    if (st) {
      const label = S.t('station.' + st.id);
      ctx.font = 'bold 9px "VT323", "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      const tw = Math.ceil(ctx.measureText(label).width) + 8;
      const lx = Math.round(ox + st.x);
      const ly = Math.round(OFF_Y + I.floorY - 78 + Math.sin(t * 4) * 1.5);
      ctx.fillStyle = 'rgba(15,16,21,0.9)';
      ctx.fillRect(lx - tw / 2, ly - 9, tw, 12);
      ctx.strokeStyle = '#3fe0e6';
      ctx.strokeRect(lx - tw / 2 + 0.5, ly - 8.5, tw - 1, 11);
      ctx.fillStyle = '#3fe0e6';
      ctx.fillText(label, lx, ly);
      ctx.fillRect(lx - 1, ly + 4, 3, 3);
      ctx.textAlign = 'left';
    }
    // Kasksız mürettebat (mekik içinde): yürürken adım sallanması
    const crew = S.Sprites.get('astronaut_indoor');
    if (crew) {
      const ch = 66;
      const cw = Math.round((crew.width * ch) / crew.height);
      const bob = body.moving ? (Math.floor(t * 7) % 2) * 1.5 : 0;
      const x = Math.round(ox + body.ix);
      const y = Math.round(OFF_Y + I.floorY + 1 - ch - bob);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (s.player.facing < 0) {
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(crew, -Math.round(cw / 2), y, cw, ch);
      } else ctx.drawImage(crew, x - Math.round(cw / 2), y, cw, ch);
      ctx.restore();
    }
    if (FX.shake > 0) FX.shake -= dt;
    FX.drawGlitch(ctx, dt);
  };

  S.FX = FX;
})((window.SOL14 = window.SOL14 || {}));
