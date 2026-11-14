/**
 * SOL 14: RED HORIZON — Dünya Oluşturucu ve Görsel Efektler (K4)
 * Kamera + parallax, üs yapıları, enkazlar, astronot, gece aydınlatması, hava olayları,
 * vizör buzlanması, sarsıntı, halüsinasyon. Simülasyondan yalnızca bus olaylarıyla haber alır.
 */
(function (S) {
  'use strict';
  const W = 640;
  const H = 360;
  const FX = {
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
    ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
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
    const Surf = S.Surface;
    const body = Surf.body;
    const GY = Surf.GROUND_Y;
    const site = s.design.landingSiteId;
    const minute = s.minute;
    const light = S.Art.lighting(minute);

    // Kamera
    const target = Math.max(Surf.worldLeftPx(), Math.min(Surf.worldRightPx() - W + 60, body.px - W * 0.42));
    FX.camX += (target - FX.camX) * Math.min(1, dt * 6);
    if (Math.abs(target - FX.camX) > 400) FX.camX = target;

    ctx.save();
    if (FX.shake > 0) {
      FX.shake -= dt;
      ctx.translate(Math.round((Math.random() - 0.5) * 6 * Math.min(1, FX.shake)), Math.round((Math.random() - 0.5) * 4 * Math.min(1, FX.shake)));
    }

    // Gökyüzü + sırtlar + zemin
    S.Art.drawSky(ctx, site, minute, W, H);
    S.Art.drawRidges(ctx, site, minute, FX.camX, W);
    const markers = [];
    for (let m = 100; m <= S.DATA.gameplay.maxEvaRangeM; m += 100) markers.push({ px: Surf.mToPx(m), label: m + 'm' });
    const sandPits = S.DATA.terrain.sandPits.map((p) => ({ x0: Surf.mToPx(p.fromM), x1: Surf.mToPx(p.toM) }));
    S.Art.drawGround(ctx, site, minute, FX.camX, W, H, GY, { markers, sandPits, revealSand: S.Sim.has(s, 'ingenuity') });

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
      if (st.id === 'habitat') {
        S.Art.drawHabitat(ctx, Math.round(st.px - FX.camX), GY, minute, s);
        continue;
      }
      let key = st.sprite;
      if (st.id === 'solar') key = s.res.panelDust > 0.35 ? 'solar_dusty' : 'solar_clean';
      if (st.id === 'greenhouse') {
        if (!s.greenhouse.installed) continue;
        key = s.greenhouse.frozen ? 'greenhouse_frozen' : 'greenhouse_ok';
      }
      if (st.id === 'isru' && !S.Sim.has(s, 'moxie')) {
        drawOnGround(ctx, key, st.px, GY);
        continue;
      }
      drawOnGround(ctx, key, st.px, GY);
      if (st.id === 'greenhouse' && !s.greenhouse.frozen && light.dark > 0.3) {
        ctx.globalAlpha = 0.25 * light.dark;
        ctx.fillStyle = '#ff7ad9';
        ctx.fillRect(FX.worldToScreen(st.px + 20), GY - 70, 110, 66);
        ctx.globalAlpha = 1;
      }
    }

    // Enkazlar
    for (const c of S.Forensics.cases()) {
      const px = Surf.mToPx(c.distanceM);
      const sx = FX.worldToScreen(px);
      if (sx < -140 || sx > W + 140) continue;
      const rec = s.forensics[c.id];
      const img = S.Sprites.get(c.sprite);
      if (S.Forensics.identified(s, c)) {
        if (img) drawSprite(ctx, c.sprite, sx - img.width / 2, GY - img.height + 4);
        if (rec.queued) {
          ctx.fillStyle = '#3fe08a';
          ctx.fillRect(sx + 2, GY - (img ? img.height : 40) - 12, 1, 12);
          ctx.fillRect(sx + 3, GY - (img ? img.height : 40) - 12, 6, 4);
        }
      } else {
        const pulse = (t * 1.2) % 1;
        ctx.strokeStyle = 'rgba(63,224,230,' + (1 - pulse) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, GY - 20, 6 + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#3fe0e6';
        ctx.fillRect(sx - 1, GY - 22, 3, 3);
        if (img) drawSprite(ctx, c.sprite, sx - img.width / 2, GY - img.height + 4, false, 0.15);
      }
    }

    // Ingenuity
    if (S.Sim.has(s, 'ingenuity')) {
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

    // Astronot
    const pose = Surf.pose(s);
    const key = 'astronaut_' + pose;
    const img = S.Sprites.get(key) || S.Sprites.get('astronaut_idle');
    const ax = FX.worldToScreen(body.px);
    let ay = GY + 2 - body.y;
    if (pose === 'walk') ay -= Math.abs(Math.sin(t * 9)) > 0.5 ? 1 : 0;
    if (img) {
      drawSprite(ctx, img === S.Sprites.get(key) ? key : 'astronaut_idle', ax - img.width / 2, ay - img.height, s.player.facing < 0);
      // Gölge
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      const sh = Math.max(6, 20 - body.y * 0.2);
      ctx.fillRect(ax - sh / 2, GY + 1, sh, 2);
      ctx.globalAlpha = 1;
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
      ctx.fillRect(0, 0, W, H);
      const sv = S.Sprites.get('vfx_dust_storm');
      if (sv) {
        const off = (t * 120) % W;
        ctx.globalAlpha = FX.stormVis * 0.55;
        ctx.drawImage(sv, -off, 0, W, H);
        ctx.drawImage(sv, W - off, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    // Gece karartması + ışıklar
    if (light.dark > 0.02) {
      ctx.fillStyle = 'rgba(6, 8, 22,' + light.dark * 0.5 + ')';
      ctx.fillRect(0, 0, W, H);
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
      ctx.fillRect(0, 0, W, H);
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
      ctx.fillRect(0, 0, W, H);
    }
    if (FX.heat > 0) {
      FX.heat -= dt;
      ctx.fillStyle = 'rgba(255, 60, 30,' + Math.min(0.15, FX.heat * 0.02) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (FX.flare > 0) {
      FX.flare = Math.max(0, FX.flare - dt * 0.4);
      ctx.fillStyle = 'rgba(255, 250, 220,' + FX.flare * 0.6 + ')';
      ctx.fillRect(0, 0, W, H);
    }
    FX.drawFloats(ctx, dt, GY);
    FX.drawVisorFrost(ctx, s);
    FX.drawGlitch(ctx, dt);
    ctx.restore();
  };

  FX.drawVisorFrost = function (ctx, s) {
    const eva = S.DATA.constants.eva;
    let a = 0;
    if (s.suit.frozen) a = 0.9;
    else if (s.suit.tempC < eva.suitNominalC - 8) a = Math.min(0.7, (eva.suitNominalC - 8 - s.suit.tempC) / 18);
    if (a <= 0.01) return;
    const img = S.Sprites.get(s.suit.frozen ? 'vfx_frost_2' : 'vfx_frost_1');
    if (img) {
      ctx.globalAlpha = a;
      ctx.drawImage(img, 0, 0, W, H);
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
    S.Art.drawInterior(ctx, s, st ? st.id : null, t);
    const body = S.Surface.body;
    const pose = body.moving ? 'walk' : 'idle';
    const img = S.Sprites.get('astronaut_' + pose);
    if (img) {
      let y = S.Surface.INTERIOR.floorY + 1 - img.height;
      if (body.moving && Math.abs(Math.sin(t * 9)) > 0.5) y -= 1;
      drawSprite(ctx, 'astronaut_' + pose, body.ix - img.width / 2, y, s.player.facing < 0);
    }
    if (FX.shake > 0) FX.shake -= dt;
    FX.drawGlitch(ctx, dt);
  };

  S.FX = FX;
})((window.SOL14 = window.SOL14 || {}));
