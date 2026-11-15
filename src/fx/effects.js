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
    stormRamp: 0,
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
    ctx.font = '9px \"VT323\", monospace';
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

  /**
   * Takımın GIF astronotu (astro_surface_idle / astro_surface_walk: 4 karelik şeritler, boy şimdiki sprite'la aynı).
   * Pozlar: walk = yürüme şeridi; idle = bekleme şeridi (350 ms); jump = yürümenin adım karesi;
   * action (diz çökme / kazı) = bekleme karesi biraz çömelmiş; frozen = bekleme karesi buz mavisi.
   * Dönüş: { fw, fh, hand: [x, y] (karedeki eldiven), left, top } ya da şerit yoksa null (eski sprite'lara düşülür).
   */
  const ASTRO = {
    idle: { key: 'astro_surface_idle', frames: 4, ms: 350, hands: [[24, 33], [24, 31], [25, 31], [24, 33]] },
    walk: { key: 'astro_surface_walk', frames: 4, ms: 140, hands: [[30, 28], [28, 27], [30, 27], [29, 28]] },
    // diz çökme (kazı, tarayıcı): yeni karakter için çizilen 2 kare; kazarken iner-kalkar
    kneel: { key: 'astro_surface_kneel', frames: 2, ms: 260, hands: [[27, 30], [28, 31]] },
    // çömelme (K2 Sude, takımın GIF'i): 4 kare ayakta → tam çömelme; kare Surface.body.crouchK'den, ilerlerken sabit
    crouch: { key: 'astronaut_crouch_sheet', frames: 4, ms: 180, hands: [[24, 33], [24, 37], [25, 40], [25, 44]] }
  };
  let frostCv = null;
  let capCv = null;
  /**
   * Buzlanma (K2 Sude): batı buz alanında elbise buz tutar. 0..1: zeminin buzlanmasıyla aynı eğri (Surface.iciness),
   * elbise soğudukça artar; tam donunca (frozen) 1. Mekik içinde ve lav tünelinde yok.
   */
  function astroFrost() {
    const s = S.getState && S.getState();
    if (!s || s.player.inside || s.player.zone === 'cave') return 0;
    const eva = S.DATA.constants.eva;
    const cold = Math.max(0, Math.min(1, (eva.suitNominalC - 4 - s.suit.tempC) / 18));
    return Math.min(1, Math.max(S.Surface.iciness(s.player.x) * 0.75, cold));
  }
  /**
   * Kareyi buzlu boyar: buz mavisi ton + üst kenarlarda (kask, omuz, sırt çantası) beyaz kırağı.
   * Piksel okumadan, yalnızca tuval birleştirme ile (file:// altında da çalışır): kırağı = siluet − 2 px aşağı kaymış siluet.
   */
  function frostFrame(img, sx, fw, fh, k) {
    frostCv = frostCv || document.createElement('canvas');
    capCv = capCv || document.createElement('canvas');
    frostCv.width = capCv.width = fw;
    frostCv.height = capCv.height = fh;
    const c = frostCv.getContext('2d');
    c.clearRect(0, 0, fw, fh);
    c.drawImage(img, sx, 0, fw, fh, 0, 0, fw, fh);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(110, 175, 240, ' + (0.55 * k).toFixed(3) + ')';
    c.fillRect(0, 0, fw, fh);
    // kırağı: üst kenarlar beyaz
    const m = capCv.getContext('2d');
    m.clearRect(0, 0, fw, fh);
    m.drawImage(img, sx, 0, fw, fh, 0, 0, fw, fh);
    m.globalCompositeOperation = 'source-in';
    m.fillStyle = '#f2f9ff';
    m.fillRect(0, 0, fw, fh);
    m.globalCompositeOperation = 'destination-out';
    m.drawImage(img, sx, 0, fw, fh, 0, 3, fw, fh); // 3 px kalın kırağı kenarı
    m.globalCompositeOperation = 'source-over';
    c.globalAlpha = Math.min(1, 0.95 * k);
    c.drawImage(capCv, 0, 0);
    // kırağı benekleri: sabit desen (titreşmez), yalnızca karakterin üstünde (source-atop)
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(245, 251, 255, ' + (0.85 * k).toFixed(3) + ')';
    const n = Math.round(((fw * fh) / 18) * k);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * fw);
      const y = Math.floor(((Math.sin(i * 78.233) * 12345.678) % 1 + 1) % 1 * fh);
      c.fillRect(x, y, i % 3 ? 1 : 2, 1);
    }
    c.globalCompositeOperation = 'source-over';
    return frostCv;
  }
  function drawAstro(ctx, pose, cx, bottomY, flip, t, rate) {
    const set =
      pose === 'crouch' && S.Sprites.get(ASTRO.crouch.key) ? ASTRO.crouch
        : pose === 'walk' || pose === 'jump' ? ASTRO.walk
          : pose === 'action' && S.Sprites.get(ASTRO.kneel.key) ? ASTRO.kneel : ASTRO.idle;
    const img = S.Sprites.get(set.key);
    if (!img) return null;
    const fw = img.width / set.frames;
    const fh = img.height;
    let f = Math.floor((t * 1000 * (rate || 1)) / set.ms) % set.frames;
    if (pose === 'jump') f = 0; // uzun adım karesi
    if (set === ASTRO.crouch) {
      const b = S.Surface.body;
      f = Math.min(3, Math.round(b.crouchK * 3)); // çömelerek ilerlerken de son karede sabit kalır (sürünür, adım atmaz)
    }
    if (pose === 'frozen') f = 0;
    if (pose === 'action' && set !== ASTRO.kneel) f = 0;
    if (pose === 'action' && set === ASTRO.kneel && !(S.Surface.body.actionT > 0)) f = 0; // tarayıcı: sabit diz çökme
    const sy = pose === 'action' && set !== ASTRO.kneel ? 0.84 : 1; // şerit yoksa eski çömelme
    const dh = Math.round(fh * sy);
    const left = Math.round(cx - fw / 2);
    const top = Math.round(bottomY - dh);
    let src = img;
    let sx = f * fw;
    const frost = pose === 'frozen' ? 1 : astroFrost();
    if (frost > 0.02) {
      src = frostFrame(img, sx, fw, fh, frost);
      sx = 0;
    }
    ctx.save();
    if (flip) {
      ctx.translate(left + fw, top);
      ctx.scale(-1, 1);
      ctx.drawImage(src, sx, 0, fw, fh, 0, 0, fw, dh);
    } else {
      ctx.drawImage(src, sx, 0, fw, fh, left, top, fw, dh);
    }
    ctx.restore();
    const hand = set.hands[f];
    return { fw, fh: dh, left, top, hand: [hand[0], Math.round(hand[1] * sy)] };
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
      const stImg = drawOnGround(ctx, key, st.px, GY);
      // Seviye 1-2-3 göstergesi: yapının üstünde 3 küçük kutu, seviye kadarı dolu (atölyede yükseltilir)
      const upg = { solar: 'solar', isru: 'isru', greenhouse: 'greenhouse', mav: 'rocket' }[st.id];
      if (stImg && upg) {
        const lv = S.Sim.upgradeLevel(s, upg);
        const cx = Math.round(FX.worldToScreen(st.px) + stImg.width / 2);
        const top = Math.round(GY - stImg.height - 6);
        ctx.fillStyle = 'rgba(10,12,16,0.75)';
        ctx.fillRect(cx - 9, top - 1, 19, 6);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i < lv ? '#3fe0e6' : '#3a4049';
          ctx.fillRect(cx - 8 + i * 6, top, 5, 4);
        }
      }
      if (st.id === 'greenhouse' && !s.greenhouse.frozen && light.dark > 0.3) {
        ctx.globalAlpha = 0.25 * light.dark;
        ctx.fillStyle = '#ff7ad9';
        ctx.fillRect(FX.worldToScreen(st.px + 20), GY - 70, 110, 66);
        ctx.globalAlpha = 1;
      }
    }

    // Kazı noktaları (tümsek, buz, moloz), yoldaki döküntü, RIMFAX sinyali
    if (S.DigFx) S.DigFx.drawSites(ctx, s, FX.camX, W, GY, t, light);
    // D-014: göktaşı, krater, saçılan kargo ve istasyon
    if (S.StationFx) S.StationFx.drawWorld(ctx, s, FX.camX, W, GY, light);

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
    let astro = null;
    if (img && !hideAstro) {
      // Kum çukurunda adımlar yavaşlar (hareket hızıyla uyumlu)
      const walkRate = Surf.inSandPit(s.player.x) ? 0.5 : 1;
      astro = drawAstro(ctx, pose, ax, ay, s.player.facing < 0, t, pose === 'walk' ? walkRate : 1);
      const walked = !astro && pose === 'walk' && drawWalk(ctx, ax, ay, s.player.facing < 0, t, walkRate);
      if (!astro && !walked) {
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
      // Seçili envanter eşyası eldivende (hotbar açıkken; zıplarken ve diz çökerken çizilmez)
      if (S.Hotbar && !landingAstro && astro && (pose === 'walk' || pose === 'idle')) {
        const hx = s.player.facing < 0 ? astro.left + astro.fw - astro.hand[0] : astro.left + astro.hand[0];
        drawHeld(ctx, S.Hotbar.selected(s), hx, astro.top + astro.hand[1], s.player.facing, S.Hotbar.swingK());
      } else if (S.Hotbar && !landingAstro && !astro && (walked || pose === 'idle')) {
        const sheet = S.Sprites.get('astronaut_walk_sheet');
        const fw = walked ? sheet.width / WALK_FRAMES : img.width;
        const hand = walked ? HAND_WALK[Math.floor(t * WALK_FPS * walkRate) % WALK_FRAMES] : HAND_IDLE;
        const left = Math.round(ax - fw / 2);
        const hx = s.player.facing < 0 ? left + fw - hand[0] : left + hand[0];
        drawHeld(ctx, S.Hotbar.selected(s), hx, ay - (walked ? sheet.height : img.height) + hand[1], s.player.facing, S.Hotbar.swingK());
      }
      // Elbise tarayıcısı: gerçek bir gömülü noktanın yanında "!" (sahte tümsek tepki vermez)
      if (S.DigFx && !landingAstro) S.DigFx.drawScanner(ctx, s, ax, astro ? astro.top : ay - img.height, t);
    }
    // D-016 (K2 Sude): glacier ice cave front layer, the water bottle in hand and the pour into the greenhouse
    if (S.Westlands && S.Westlands.drawFront && !hideAstro) S.Westlands.drawFront(ctx, s, FX.camX, W, GY, t, landingAstro ? null : { x: ax, y: ay, pose });
    // Kayaya takılınca kısa zıplama ipucu
    if (body.blockedT > 0 && !hideAstro) {
      ctx.save();
      ctx.font = '8px \"VT323\", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(8,10,14,0.75)';
      const txt = S.t(body.blockHint || 'hint.jump'); // tünel: ↓ ile eğil
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

    // Rüzgâr tozu / fırtına: fırtına STORM_FADE_S boyunca düzgünce yükselir ve aynı hızla diner
    const storm = s.weather.stormTau > 0;
    FX.stormRamp = Math.max(0, Math.min(1, FX.stormRamp + ((storm ? 1 : -1) * dt) / STORM_FADE_S));
    FX.stormVis = FX.stormRamp * FX.stormRamp * (3 - 2 * FX.stormRamp);
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
    if (FX.stormVis > 0.01) drawStorm(ctx, FX.stormVis, dt);

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
    // Kişi 5: tünel duvarındaki maden damarları (matkapla delinir)
    if (S.DigFx && S.Explore.mineralSites) {
      for (const st of S.Explore.mineralSites('cave')) {
        const x = FX.worldToScreen(Surf.caveMToPx(st.atM));
        if (x > -40 && x < W + 40) S.DigFx.drawMineral(ctx, s, st, x, GY, t, { dark: 0 }, true);
      }
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
    const ay = GY + 2 - body.y;
    if (img) {
      const astro = drawAstro(ctx, pose, ax, ay, s.player.facing < 0, t, 1);
      const walked = !astro && pose === 'walk' && drawWalk(ctx, ax, ay, s.player.facing < 0, t, 1);
      if (!astro && !walked) {
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
  /**
   * Kasksız mürettebatın yürüyüşü (K3 Medine): gövde hafifçe sallanır; bacaklar (figürün alt %44'ü) sol ve sağ yarı
   * olarak ileri geri salınıp sırayla kalkar, ayaklar kaymaz. Görsel sola bakar; dir = +1 aynalar. footY: zemin çizgisi.
   */
  /* Toz fırtınası (K3 Medine): koyulaşan turuncu ışık, yuvarlanan toz bulutları, rüzgârın sürdüğü ince çizgiler.
     Desenli doku yok (dikiş ve sert bantlar veriyordu). Koordinatlar dünya katmanında: üst kenar −OFF_Y. */
  const STORM_FADE_S = 10;
  const stormHash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const STORM_STREAKS = Array.from({ length: 190 }, (_, i) => ({ x: stormHash(i * 1.7) * 960, y: stormHash(i * 2.9), v: 260 + stormHash(i * 4.3) * 360, len: 6 + Math.round(stormHash(i * 6.1) * 26) }));
  const STORM_PUFFS = Array.from({ length: 14 }, (_, i) => ({ x: stormHash(i * 9.1) * 960, y: 0.15 + stormHash(i * 3.7) * 0.75, r: 30 + stormHash(i * 5.3) * 60, v: 60 + stormHash(i * 7.7) * 80 }));
  function drawStorm(ctx, k, dt) {
    const top = -OFF_Y;
    ctx.save();
    ctx.globalAlpha = 0.5 * k;
    ctx.fillStyle = '#6a2c14';
    ctx.fillRect(0, top, W, H);
    ctx.globalAlpha = 0.18 * k;
    ctx.fillStyle = '#2a120a';
    ctx.fillRect(0, top, W, H);
    ctx.globalAlpha = 1;
    for (const p of STORM_PUFFS) {
      p.x += p.v * (0.5 + 0.5 * k) * dt;
      if (p.x - p.r > W + 40) p.x = -p.r - 40;
      const cy = top + p.y * H;
      const g = ctx.createRadialGradient(p.x, cy, 0, p.x, cy, p.r);
      g.addColorStop(0, 'rgba(196,120,70,' + (0.32 * k).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(196,120,70,0)');
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.r, cy - p.r, p.r * 2, p.r * 2);
    }
    // fırtınanın başında ve sonunda daha az çizgi
    ctx.fillStyle = '#d0905e';
    ctx.globalAlpha = 0.7 * k;
    const shown = Math.round(STORM_STREAKS.length * (0.15 + 0.85 * k));
    for (let i = 0; i < STORM_STREAKS.length; i++) {
      const d = STORM_STREAKS[i];
      d.x += d.v * (0.45 + 0.55 * k) * dt;
      if (d.x > W + 20) d.x = -40;
      if (i < shown) ctx.fillRect(Math.round(d.x), Math.round(top + d.y * H + Math.sin((d.x + d.y * 1000) * 0.02) * 6), d.len, 1);
    }
    ctx.restore();
  }

  // Öndeki eldivenin ortası (sağa bakan kare, px; sprite piksellerinden ölçüldü): yürüme sayfasının 6 karesi ve duruş
  const HAND_WALK = [[26, 28], [25, 28], [23, 31], [22, 29], [22, 30], [23, 30]];
  const HAND_IDLE = [28, 29];

  /** Elde tutulan eşya, tutma noktası eldivende (hx, hy): aletler küçük piksel çizimi, diğerleri küçük bir paket */
  // swing: 0..1 vuruş ilerlemesi (kazma ileri iner, matkap titrer, tarayıcı kalkar); eldiven etrafında döner
  function drawHeld(ctx, it, hx, hy, dir, swing = 0) {
    if (!it) return;
    ctx.save();
    ctx.translate(hx, hy);
    if (swing > 0) {
      if (it.id === 'pickaxe') ctx.rotate(dir * 1.6 * Math.sin(Math.PI * swing));
      else if (it.id === 'drill') ctx.translate(dir * Math.round(Math.sin(swing * 40)), 0);
      else ctx.rotate(-dir * 0.5 * Math.sin(Math.PI * swing));
    }
    const px = (dx, dy, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(dir < 0 ? -dx - w : dx, dy, w, h);
    };
    if (it.id === 'pickaxe') {
      px(-1, -9, 2, 12, '#8a5a32'); // sap eldivenden yukarı
      px(-5, -11, 10, 2, '#b8bec6'); // kafa
      px(-6, -10, 2, 2, '#8d939b');
      px(4, -10, 2, 2, '#8d939b');
    } else if (it.id === 'drill') {
      px(-1, -1, 3, 4, '#2a2d33'); // kabza eldivende
      px(-1, -5, 8, 4, '#e8742e'); // gövde
      px(7, -4, 4, 2, '#b8bec6'); // uç
    } else if (it.id === 'scanner') {
      px(-1, -5, 5, 7, '#2a2d33');
      px(0, -4, 3, 3, Math.floor(performance.now() / 400) % 2 ? '#3fe0e6' : '#1d6f73'); // ekran
    } else {
      px(-2, -2, 6, 5, '#c9ccd2'); // paket
      px(-2, -2, 6, 1, '#ff7a1a');
    }
    if (swing > 0 && it.id === 'drill' && Math.sin(swing * 40) > 0) px(12, -4, 1, 1, '#ffd27a');
    ctx.restore();
  }

  /* ---------------- Mürettebat (lander içi + transit güvertesi) ---------------- */
  // tools/build.js her GIF'i tek satırlık şeride çevirir (kareler yan yana, sprite'lar sağa bakar); kare süreleri GIF'lerden
  const CREW_ANIM = {
    idle: { frames: 4, ms: 350 },
    walk: { frames: 4, ms: 140 },
    float: { frames: 4, ms: 300 },
    eat: { frames: 4, ms: 240 },
    drink: { frames: 4, ms: 320 },
    sleep_bunk: { frames: 3, ms: 120 }
  };
  const CREW_ACT_LOOPS = 2; // yemek/içme animasyonu kaç tur oynar
  const SLEEP_CLOSEUP_S = 3; // ranza yakın planı (sn)

  const crewFrame = (pose, t) => Math.floor((t * 1000) / CREW_ANIM[pose].ms) % CREW_ANIM[pose].frames;
  // Şeritler takımın GIF'leri (astro_*, ~130 px boy; Medine'nin işlemesi); lander içi ve transit ~60 px çizer
  const CREW_SPRITE = { idle: 'astro_indoor_idle', walk: 'astro_indoor_walk', float: 'astro_indoor_float', eat: 'astro_eat', drink: 'astro_drink' };
  const CREW_HEIGHT_PX = 60;
  const crewStrip = (pose) => S.Sprites.get(CREW_SPRITE[pose]);
  const crewScale = (img) => CREW_HEIGHT_PX / img.height;

  /** pose karesini ayak hizası (x, footY) üzerine çizer; dir < 0 sola bakar. scale yalnız transit güvertesinde 1'den farklı. */
  FX.drawCrew = function (c, pose, x, footY, dir, t, scale = 1) {
    FX.drawCrewFrame(c, pose, crewFrame(pose, t), x, footY, dir, scale);
  };

  /*
   * Mekik içi süzülme pozu: transit güvertesi ve lander içi birebir aynı sistemi kullanır (kullanıcı kararı 2026-11-15:
   * mekik içi her zaman Sol 0'daki gibi ağırlıksız; lander Mars'ta 0.38g'de olduğu için orada oyun basitleştirmesi,
   * oyunda etiketli). Hız S.util.easeVelocity ile yumuşar; burada görünüş üretilir. speedNorm: hız / azami hız (-1..1).
   * Zeminin üstünde katmanlı sinüs salınımı (dikey, yatay), ilerlerken kolla itme kareleri (crew_float), hareket
   * yönüne eğilme ve hafif gövde dönmesi. Birimler kesit pikseli, açılar radyan.
   */
  const CREW_MOTION = {
    movingAbove: 0.15, // |speedNorm| bunun üstündeyse kolla itme pozu
    leanMax: 0.128, // tam hızda hareket yönüne eğilme (Sol 0 güvertesinin ilk ayarı)
    tilt: [0.035, 0.63], // gövde dönmesi: [genlik, açısal hız]
    hover: 12, // zeminden ortalama yükseklik
    bob: [[3, 0.55], [1.4, 1.37]], // dikey salınım katmanları: [genlik px, açısal hız rad/sn]
    sway: [1.6, 0.41], // yatay mikro kayma
    reducedMotion: 0.3 // "hareketi azalt" açıkken salınım katsayısı (design-rules.md §11)
  };

  /** Salınım genliği: sistemde "hareketi azalt" açıksa küçülür */
  FX.motionAmp = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? CREW_MOTION.reducedMotion : 1;

  /** @returns {{ sprite, lift, dx, angle }} sprite: crew şeridi; lift: zeminden yükseklik; dx: yatay kayma */
  FX.crewMotionPose = function (tSec, speedNorm, amp = 1, airborne = false) {
    const M = CREW_MOTION;
    const moving = airborne || Math.abs(speedNorm) > M.movingAbove;
    const bob = M.bob.reduce((sum, [a, w], i) => sum + a * Math.sin(tSec * w + i * 1.9), 0);
    return {
      sprite: moving ? 'float' : 'idle',
      lift: M.hover + amp * bob,
      dx: amp * M.sway[0] * Math.sin(tSec * M.sway[1] + 0.7),
      angle: Math.max(-M.leanMax, Math.min(M.leanMax, speedNorm * M.leanMax)) + amp * M.tilt[0] * Math.sin(tSec * M.tilt[1] + 2.3)
    };
  };

  // Mekik içi serbest eşyalar, asenkron: her birinin evresi, hızı ve genliği farklı (sabit tohumlu S.makeRng)
  // Serbest eşyalar: [tür, x (kesit px), zeminden yükseklik (px)]; piksel çizimleri FLOATER_ART'ta
  const FLOATERS = [
    ['pen', 128, 70],
    ['pouch', 300, 52],
    ['bolt', 362, 82],
    ['tablet', 470, 66],
    ['food', 548, 46]
  ];
  // Her satır bir piksel sırası; harf → renk. Ortası dönme ekseni.
  const FLOATER_ART = {
    pen: { rows: ['k', 'o', 'o', 'o', 'o', 'o', 'w'], colors: { k: '#2a2320', o: '#e0632a', w: '#f2e8d4' } },
    pouch: { rows: ['.bb.', 'ssss', 'sSSs', 'sSSs', 'ssss', 'ssss', '.ss.'], colors: { b: '#3f8fd6', s: '#c9ccd2', S: '#e9ecf0' } },
    bolt: { rows: ['ggg', 'gdg', 'ggg', '.g.', '.g.'], colors: { g: '#8f949c', d: '#4a4e55' } },
    tablet: { rows: ['kkkkkkk', 'kCcccck', 'kcCccck', 'kccccck', 'kkkkkkk'], colors: { k: '#23252b', c: '#2f8f95', C: '#82cfc8' } },
    food: { rows: ['bbbbbb', 'boooob', 'bbbbbb', 'bbbbbb'], colors: { b: '#e8dcc0', o: '#cc5728' } }
  };

  function makeFloaters() {
    const rng = S.makeRng(1407);
    const vary = (base, spread) => base * (1 - spread + rng() * 2 * spread);
    return FLOATERS.map(([kind, x, y]) => ({
      kind,
      x,
      y,
      ax: vary(3, 0.4),
      ay: vary(4, 0.4),
      fx: vary(0.35, 0.25),
      fy: vary(0.5, 0.25),
      fr: vary(0.45, 0.3),
      spin: (rng() - 0.5) * 0.5, // yavaş sürekli dönme (rad/sn)
      ra: vary(0.25, 0.4),
      phase: [0, 1, 2, 3, 4].map(() => rng() * Math.PI * 2),
      r0: rng() * Math.PI * 2
    }));
  }

  const FLOATER_STATE = makeFloaters();

  /**
   * Serbest süzülen eşyalar (mekik içi, transit ve lander aynı). layer 'back' mürettebatın arkasındakiler, 'front' son
   * eşya: mürettebatın önünde kalır (derinlik). ox, floorY: kesitin sol kenarı ve zemini (tuval px), scale: kesit ölçeği.
   */
  FX.drawFloaters = function (dc, layer, ox, floorY, scale, tSec, amp) {
    const list = layer === 'front' ? FLOATER_STATE.slice(-1) : FLOATER_STATE.slice(0, -1);
    list.forEach((f) => drawFloater(dc, f, ox, floorY, scale, tSec, amp));
  };

  function drawFloater(dc, f, ox, floorY, scale, tSec, amp) {
    const p = f.phase;
    const x = f.x + amp * (f.ax * Math.sin(tSec * f.fx + p[0]) + 0.4 * f.ax * Math.sin(tSec * f.fx * 0.43 + p[1]));
    const y = f.y + amp * (f.ay * Math.sin(tSec * f.fy + p[2]) + 0.5 * f.ay * Math.sin(tSec * f.fy * 0.61 + p[3]));
    const rot = f.r0 + amp * (f.spin * tSec + f.ra * Math.sin(tSec * f.fr + p[4]));
    const art = FLOATER_ART[f.kind];
    const w = art.rows[0].length;
    const h = art.rows.length;
    dc.save();
    dc.translate(ox + x * scale, floorY - y * scale);
    dc.rotate(rot);
    dc.scale(scale, scale);
    art.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const c = art.colors[row[rx]];
        if (!c) continue;
        dc.fillStyle = c;
        dc.fillRect(rx - w / 2, ry - h / 2, 1.02, 1.02); // 1.02: döndürülmüş pikseller arasında ince boşluk kalmasın
      }
    });
    dc.restore();
  }

  /** Pozu çizer: gövdenin ortası etrafında döner, lift kadar yükselir (x, footY: zemindeki ayak noktası) */
  FX.drawCrewPosed = function (c, pose, x, footY, dir, tSec, scale = 1) {
    const img = crewStrip(pose.sprite);
    if (!img) return;
    const h = img.height * scale * crewScale(img);
    c.save();
    c.translate(x + pose.dx * scale, footY - pose.lift * scale - h / 2);
    c.rotate(pose.angle);
    FX.drawCrew(c, pose.sprite, 0, h / 2, dir, tSec, scale);
    c.restore();
  };

  /* ---------------- Mekik içi etkinlik animasyonları (takımın GIF'leri: yemek, su içme, uyku) ---------------- */
  // Şeritler 132 px ölçeğinde (ayakta duran figür = 132); mekikte figür 66 px çizildiği için yarı ölçek.
  const ACTIVITY = {
    eat: { key: 'astro_eat', frames: 4, ms: 240, secs: 2.6 },
    drink: { key: 'astro_drink', frames: 4, ms: 320, secs: 2.6 },
    sleep: { key: 'astro_sleep', frames: 4, ms: 450, secs: 3.2, at: 'bunk' },
    toilet: { key: null, frames: 1, ms: 1000, secs: 2.6 } // GIF yok: kodla çizilen kabin (dolu lambası)
  };
  FX.activity = null;
  /** Bir etkinlik animasyonu başlat; bitince (ya da oyuncu yürüyünce) onDone çağrılır */
  FX.playActivity = function (kind, onDone) {
    const a = ACTIVITY[kind];
    if (!a || (a.key && !S.Sprites.get(a.key))) {
      if (onDone) onDone();
      return false;
    }
    FX.activity = { kind, t: 0, onDone: onDone || null };
    return true;
  };
  function endActivity() {
    const cb = FX.activity && FX.activity.onDone;
    FX.activity = null;
    if (cb) cb();
  }
  /** Tuvalet molası: astronotun yerinde katlanır gizlilik kabini; kapı kapanır, "dolu" lambası kırmızı,
   *  sonunda yeşile döner, kapı açılır (karakter yeniden görünür). Prosedürel piksel çizim. */
  function drawToilet(ctx, x, footY, t, secs) {
    const open = Math.min(1, t / 0.35, (secs - t) / 0.35); // 0 açık .. 1 kapalı
    const w = 30;
    const h = 72;
    const left = x - w / 2;
    const top = footY - h;
    const R = (dx, dy, ww, hh, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(left + dx), Math.round(top + dy), Math.round(ww), Math.round(hh));
    };
    R(-1, -1, w + 2, h + 1, '#0b0d10'); // kabin
    R(0, 0, w, h, '#5d6570');
    R(0, 0, w, 3, '#8a939f');
    R(2, 6, w - 4, 4, '#3a4049'); // havalandırma
    R(5, 7, w - 10, 1, '#1b1f25');
    // kapı paneli: kapanırken soldan sağa kayar
    const dw = Math.round((w - 6) * open);
    R(3, 14, dw, h - 16, '#7d858f');
    R(3, 14, dw, 2, '#aab2bb');
    if (open > 0.9) R(w - 8, 40, 2, 6, '#2b3038'); // kapı kolu
    // WC işareti (piksel insan figürleri)
    R(9, 20, 12, 10, '#e9eef2');
    R(11, 21, 2, 2, '#22335c');
    R(10, 23, 4, 5, '#22335c');
    R(17, 21, 2, 2, '#b5622a');
    R(16, 23, 4, 5, '#b5622a');
    // dolu / boş lambası
    const busy = t < secs - 0.45;
    R(w / 2 - 3, -6, 6, 5, '#0b0d10');
    R(w / 2 - 2, -5, 4, 3, busy ? '#ff3b2f' : '#3fe08a');
    // sonda kısa su sesi damlacıkları
    if (t > secs - 0.9 && t < secs - 0.45) for (let i = 0; i < 3; i++) R(w / 2 - 6 + i * 5, h - 10 - ((t * 40 + i * 5) % 8), 2, 2, '#9fd8ff');
  }

  /** Çizildiyse true (o karede normal mürettebat çizilmez) */
  FX.drawActivity = function (ctx, s, dt, t, ox, footY) {
    const act = FX.activity;
    if (!act) return false;
    const a = ACTIVITY[act.kind];
    const body = S.Surface.body;
    act.t += dt;
    if (act.t >= a.secs || (body.moving && act.kind !== 'sleep')) {
      endActivity();
      return false;
    }
    if (act.kind === 'toilet') {
      drawToilet(ctx, Math.round(ox + body.ix), footY, act.t, a.secs);
      return true;
    }
    const img = S.Sprites.get(a.key);
    const fw = img.width / a.frames;
    const k = 66 / 132;
    const dw = Math.round(fw * k);
    const dh = Math.round(img.height * k);
    const f = Math.floor((act.t * 1000) / a.ms) % a.frames;
    const st = a.at && S.Surface.INTERIOR.stations.find((x) => x.id === a.at);
    const x = Math.round(ox + (st ? st.x : body.ix));
    const flip = s.player.facing < 0;
    if (act.kind === 'sleep') {
      // ışıklar kısılır; uyku tulumu yatağın önünde, üstünde yükselen "z" işaretleri (kodla çizilir)
      const fade = Math.min(1, act.t / 0.6, (a.secs - act.t) / 0.6);
      ctx.fillStyle = 'rgba(4, 6, 14,' + (0.3 * fade).toFixed(3) + ')'; // ışıklar hafifçe kısılır (ekran kararmaz)
      ctx.fillRect(0, 0, W, H);
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // uyku tulumu yavaşça belirir / kaybolur (aniden ortaya çıkmaz)
    if (act.kind === 'sleep') ctx.globalAlpha = Math.min(1, act.t / 0.5, (a.secs - act.t) / 0.5);
    if (flip) {
      ctx.translate(x + Math.round(dw / 2), footY - dh);
      ctx.scale(-1, 1);
      ctx.drawImage(img, f * fw, 0, fw, img.height, 0, 0, dw, dh);
    } else {
      ctx.drawImage(img, f * fw, 0, fw, img.height, x - Math.round(dw / 2), footY - dh, dw, dh);
    }
    ctx.restore();
    if (act.kind === 'sleep') {
      ctx.fillStyle = '#e8eef5';
      for (let i = 0; i < 3; i++) {
        const ph = (act.t * 0.7 + i / 3) % 1;
        const zx = x + 8 + Math.round(ph * 10);
        const zy = Math.round(footY - dh - 4 - ph * 22);
        const sz = 2 + i % 2;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        // piksel "z": üst çizgi, çapraz, alt çizgi
        ctx.fillRect(zx, zy, sz * 2, 1);
        for (let j = 0; j < sz * 2; j++) ctx.fillRect(zx + sz * 2 - 1 - j, zy + 1 + Math.floor((j * (sz * 2 - 1)) / (sz * 2)), 1, 1);
        ctx.fillRect(zx, zy + sz * 2, sz * 2, 1);
      }
      ctx.globalAlpha = 1;
    }
    return true;
  };
  /** Şeridin belirli bir karesi (zıplama gibi zamana değil fiziğe bağlı pozlar için) */
  FX.drawCrewFrame = function (c, pose, frame, x, footY, dir, scale = 1) {
    const img = crewStrip(pose);
    if (!img) return;
    const fw = img.width / CREW_ANIM[pose].frames;
    const k = scale * crewScale(img);
    const w = Math.round(fw * k);
    const h = Math.round(img.height * k);
    c.save();
    c.translate(Math.round(x), Math.round(footY));
    if (dir < 0) c.scale(-1, 1);
    c.imageSmoothingEnabled = false;
    c.drawImage(img, frame * fw, 0, fw, img.height, -Math.round(w / 2), -h, w, h);
    c.restore();
  };

  // Lander kesiti tam ekran (transit güvertesi gibi): zemin çizgisi alttaki istasyon çekmecesinin hemen üstünde
  // (tabandan 74 px: 5.9em panel + 0.9em boşluk, 1em = 10.67 oyun pikseli), kesit üst kenara kadar uzanır, üst HUD üstünde
  // yüzer. Ölçek tam sayıdır (mürettebat pikselleri kare kalır); kesit ekrandan genişse kamera mürettebatı izler.
  const INTERIOR_VIEW = { bottomGap: 74, floorGap: 4, aspect: 520 / 2172 };
  const interiorCam = { x: null, lastT: -1 };
  // Her girişte kamera mürettebata oturur
  S.bus.on('habitat:enter', () => {
    interiorCam.x = null;
  });

  /** Zeminin tuvaldeki y'si ve kesitin tam sayı ölçeği (lander içi ve transit güvertesi aynı değerleri kullanır) */
  function interiorScale(I) {
    const floorScreenY = OFF_Y + BASE_H - INTERIOR_VIEW.bottomGap - INTERIOR_VIEW.floorGap;
    return { floorScreenY, k: Math.max(1, Math.floor(floorScreenY / I.floorY)) };
  }

  /**
   * Transit güvertesi (DOM tuvali, CSS pikseli) lander içiyle birebir aynı boyutta çizilsin diye: kesit pikseli başına
   * CSS pikseli ve zemin çizgisinin CSS y'si. Oyun tuvali pencereyi doldurur (main.js fitStage).
   */
  FX.interiorScreenMetrics = function (cssHeight) {
    const { floorScreenY, k } = interiorScale(S.Surface.INTERIOR);
    const cssPerPx = cssHeight / H;
    return { scale: k * cssPerPx, floorY: floorScreenY * cssPerPx };
  };

  /** Kesitin ekran yerleşimi: k ölçeği ve sol üst köşe. İç mekân koordinatları 640 px genişlikteki kesite göredir. */
  function interiorLayout(I, bodyIx, dt, t) {
    const localH = BASE_W * INTERIOR_VIEW.aspect;
    const { floorScreenY, k } = interiorScale(I);
    const shipW = I.width * k;
    let x = (W - shipW) / 2;
    if (shipW > W) {
      const want = Math.max(W - shipW, Math.min(0, W / 2 - bodyIx * k));
      // Habitata yeni girildiyse (çizim arası boşluk) kamera kaymadan yerine oturur
      const snap = interiorCam.x === null || t - interiorCam.lastT > 0.3;
      interiorCam.x = snap ? want : interiorCam.x + (want - interiorCam.x) * Math.min(1, dt * 6);
      x = interiorCam.x;
    }
    interiorCam.lastT = t;
    return { k, localH, floorScreenY, x: Math.round(x), y: Math.round(floorScreenY - I.floorY * k) };
  }

  /*
   * Spor bölmesi: kesit laboratuvar–ranza direğinden (gym.atX) ikiye ayrılır, aradaki boşluğa ilk bölmenin düz duvar
   * şeridi döşenir (tavan ışıkları ve zemin dahil) ve iki yanına direk gelir; üstüne ISS'teki gibi koşu bandı (T2),
   * bisiklet (CEVIS) ve duvara bağlı direnç aleti (ARED) çizilir. Kesitin piksel boyutunda bir kez kurulur.
   */
  const GYM_WALL = { x0: 88, x1: 157 }; // ilk bölmenin düz duvarı, panel ekinden panel ekine (yerel px): döşeyince ek görünmez
  let cutaway = null;
  function landerCutaway(I) {
    const img = S.Sprites.get('lander_interior');
    if (!img) return null;
    if (cutaway && cutaway.src === img) return cutaway.cv;
    const r = img.width / BASE_W; // kaynak px / yerel px
    const { atX, w } = I.gym;
    const cv = document.createElement('canvas');
    cv.width = Math.round(I.width * r);
    cv.height = img.height;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const PIL = 8; // direğin yarı genişliği (yerel px)
    const at = (v) => Math.round(v * r);
    g.drawImage(img, 0, 0, at(atX + PIL), img.height, 0, 0, at(atX + PIL), img.height);
    g.drawImage(img, at(atX - PIL), 0, img.width - at(atX - PIL), img.height, at(atX - PIL + w), 0, img.width - at(atX - PIL), img.height);
    const strip = GYM_WALL.x1 - GYM_WALL.x0;
    for (let x = atX + PIL; x < atX - PIL + w; x += strip) {
      const sw = Math.min(strip, atX - PIL + w - x);
      g.drawImage(img, at(GYM_WALL.x0), 0, at(sw), img.height, at(x), 0, at(sw), img.height);
    }
    g.save();
    g.scale(r, r);
    drawGym(g, atX + PIL, I.floorY, w - 2 * PIL);
    g.restore();
    cutaway = { src: img, cv };
    return cv;
  }

  /*
   * Spor aletleri, kesitteki dolaplarla aynı 3/4 bakış: üstten görünen açık yüz, ön yüz, sağda koyu yan yüz, koyu kontur;
   * renkler kesitin kendi paletinden (sıcak krem/kahve, koyu metal, turuncu şerit). Yerel px; x0 bölmenin sol kenarı.
   */
  const GYM_PAL = {
    out: '#202028', metal: '#484048', metalHi: '#5c5260', metalLo: '#2c2834',
    top: '#f0d0a8', front: '#d8a878', side: '#b07e58', dark: '#403848', belt: '#28242c',
    orange: '#e0682c', orangeLo: '#a8481c', screen: '#58d0c8', screenLo: '#2a7a78', mat: '#3a3a4e', matTop: '#4a4a60'
  };
  function drawGym(g, x0, floorY, bw) {
    const P = GYM_PAL;
    const R = (x, y, w, h, c) => {
      g.fillStyle = c;
      g.fillRect(x0 + x, floorY + y, w, h);
    };
    /** 3/4 blok: (x, y) ön yüzün sol üstü, d üst yüzün derinliği; sağdaki yan yüz s px */
    const block = (x, y, w, h, d, c, sd = 2) => {
      R(x - 1, y - d - 1, w + sd + 2, h + d + 2, P.out);
      R(x, y - d, w, d, c.top); // üst yüz
      R(x + 1, y - d, w - 2, 1, '#fff0d8'); // üst kenar parlaması
      R(x, y, w, h, c.front); // ön yüz
      R(x + w, y - d + 1, sd, h + d - 1, c.side); // sağ yan yüz
      R(x, y + h - 1, w, 1, c.side);
    };
    const CREAM = { top: P.top, front: P.front, side: P.side };
    const METAL = { top: P.metalHi, front: P.metal, side: P.metalLo };
    const shadow = (x, w) => {
      g.fillStyle = 'rgba(16,12,20,0.35)';
      g.fillRect(x0 + x - 2, floorY - 1, w + 6, 3);
    };

    // Zemin minderi (bisiklet ve direnç aletinin altında)
    R(60, -2, bw - 58, 3, P.out);
    R(61, -3, bw - 60, 2, P.matTop);
    R(61, -1, bw - 60, 1, P.mat);

    // Duvar ekranı: nabız eğrisi (yalnız çizgi, yazı yok), emniyet askısının sağında
    block(52, -92, 30, 16, 3, METAL);
    R(54, -90, 26, 12, P.screenLo);
    const pulse = [0, 0, 0, -1, 2, -5, 4, 0, 0, 0, -1, 0, 0, 0, -1, 2, -5, 4, 0, 0, 0, -1, 0, 0];
    pulse.forEach((dy, i) => R(55 + i, -85 + dy, 1, 1, P.screen));
    // Havlu askısı (sol kenar)
    R(2, -78, 8, 2, P.metal);
    R(3, -76, 6, 12, P.orange);
    R(3, -65, 6, 1, P.orangeLo);

    // Koşu bandı (T2): uzun 3/4 gövde, koyu bant, yan tutamaklar, ön konsol; emniyet askısı tavana bağlı
    shadow(4, 58);
    block(4, -9, 56, 8, 5, CREAM, 3);
    R(6, -14, 52, 4, P.belt); // bant (üst yüzde)
    for (let i = 0; i < 52; i += 6) R(6 + i, -13, 3, 1, '#3a3440');
    R(4, -2, 56, 1, P.orange);
    block(50, -40, 4, 30, METAL, 2); // ön dikme
    block(44, -50, 18, 10, 3, CREAM, 2); // konsol
    R(46, -49, 14, 6, P.screenLo);
    R(47, -48, 6, 2, P.screen);
    R(47, -45, 10, 1, P.screen);
    R(14, -30, 38, 2, P.metal); // tutamak
    R(14, -30, 2, 18, P.metal);
    R(14, -31, 38, 1, P.metalHi);
    R(16, -98, 30, 2, P.metal); // tavan askısı
    R(18, -96, 2, 40, P.orange); // emniyet bungee'leri
    R(42, -96, 2, 40, P.orange);
    R(18, -57, 26, 2, P.orangeLo);

    // Bisiklet ergometresi (CEVIS): krem volan kapağı, koyu volan, sele, gidon, küçük ekran
    const bx = 74;
    shadow(bx - 2, 26);
    block(bx, -18, 18, 16, 3, CREAM, 2);
    R(bx + 3, -15, 10, 10, P.out);
    R(bx + 4, -14, 8, 8, P.dark);
    R(bx + 6, -12, 4, 4, P.metalHi);
    R(bx + 7, -11, 2, 2, P.orange);
    R(bx + 1, -24, 3, 7, P.metal); // sele borusu
    block(bx - 3, -27, 10, 2, 2, METAL, 1); // sele
    R(bx + 17, -36, 3, 18, P.metal); // gidon borusu
    R(bx + 13, -39, 12, 2, P.out);
    R(bx + 13, -40, 12, 1, P.metalHi);
    block(bx + 16, -46, 8, 5, 2, CREAM, 1);
    R(bx + 17, -45, 6, 3, P.screen);
    R(bx + 4, -3, 4, 2, P.orange); // pedal

    // Direnç aleti (ARED): koyu kaide, iki dikme, krem kaldırma barı ve turuncu uçlar, iki vakum silindiri
    const ax = bw - 40;
    shadow(ax - 4, 42);
    block(ax - 4, -6, 42, 5, 3, METAL, 2); // kaide
    block(ax, -84, 4, 78, 2, METAL, 2);
    block(ax + 28, -84, 4, 78, 2, METAL, 2);
    block(ax - 2, -88, 36, 3, 2, METAL, 2); // üst kiriş
    block(ax + 7, -72, 6, 22, 2, { top: P.metalHi, front: P.dark, side: P.out }, 1); // silindirler
    block(ax + 20, -72, 6, 22, 2, { top: P.metalHi, front: P.dark, side: P.out }, 1);
    R(ax + 8, -66, 3, 10, P.metalHi);
    R(ax + 21, -66, 3, 10, P.metalHi);
    block(ax - 8, -44, 48, 3, 2, CREAM, 1); // bar
    R(ax - 10, -47, 4, 8, P.orange);
    R(ax + 38, -47, 4, 8, P.orange);
    R(ax - 10, -40, 4, 1, P.orangeLo);
    R(ax + 38, -40, 4, 1, P.orangeLo);
  }


  /** Yakındaki istasyonun adı, mürettebatın başının üstünde (ekran koordinatı, kesit ölçeğinden bağımsız boyut) */
  function drawStationLabel(ctx, label, x, y) {
    ctx.font = 'bold 9px "VT323", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    const tw = Math.ceil(ctx.measureText(label).width) + 8;
    const lx = Math.round(x);
    const ly = Math.round(y);
    ctx.fillStyle = 'rgba(15,16,21,0.9)';
    ctx.fillRect(lx - tw / 2, ly - 9, tw, 12);
    ctx.strokeStyle = '#3fe0e6';
    ctx.strokeRect(lx - tw / 2 + 0.5, ly - 8.5, tw - 1, 11);
    ctx.fillStyle = '#3fe0e6';
    ctx.fillText(label, lx, ly);
    ctx.fillRect(lx - 1, ly + 4, 3, 3);
    ctx.textAlign = 'left';
  }

  FX.renderInterior = function (ctx, s, dt, t) {
    const st = S.Surface.nearestStation();
    const I = S.Surface.INTERIOR;
    const body = S.Surface.body;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);
    const ship = landerCutaway(I);
    const view = interiorLayout(I, body.ix, dt, t);
    let crewLift = 0;
    ctx.save();
    ctx.translate(view.x, view.y);
    ctx.scale(view.k, view.k);
    if (ship) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(ship, 0, 0, I.width, view.localH);
      ctx.imageSmoothingEnabled = false;
    } else {
      // Görsel yüklenemedi (RULES §2.6: eksik görsel oyunu kilitlemez): yalnız zemin çizgisi, oynanış sürer
      ctx.fillStyle = '#2a2320';
      ctx.fillRect(0, I.floorY, I.width, 4);
    }
    // D-016 (K2 Sude): hava kilidinin yanındaki su şişesi rafı. Rafın kendi [E] yazısı kesitle birlikte büyüdüğü için
    // verilmez (nearId null): eylem alttaki çekmecede, ad istasyon etiketinde görünür.
    if (S.Westlands && S.Westlands.drawInteriorRack) S.Westlands.drawInteriorRack(ctx, s, 0, 0, t, null);
    // Transit güvertesiyle birebir aynı ortam: serbest eşyalar her zaman süzülür (biri mürettebatın önünde)
    const amp = FX.motionAmp();
    FX.drawFloaters(ctx, 'back', 0, I.floorY, 1, t, amp);
    // Yemek / su / uyku: takımın GIF animasyonu (FX.drawActivity); yoksa ağırlıksız süzülme (transit güvertesiyle aynı)
    const acting = FX.drawActivity(ctx, s, dt, t, 0, I.floorY + 1);
    if (!acting) {
      const pose = FX.crewMotionPose(t, body.im.v / S.DATA.gameplay.interiorWalkPxPerSecond, amp, !body.onGround);
      const footY = I.floorY + 1 - body.y;
      FX.drawCrewPosed(ctx, pose, body.ix, footY, s.player.facing, t);
      crewLift = body.y + pose.lift;
      if (S.Westlands && S.Westlands.drawInteriorCarry) S.Westlands.drawInteriorCarry(ctx, s, body.ix, footY - pose.lift, t, body.moving);
    }
    FX.drawFloaters(ctx, 'front', 0, I.floorY, 1, t, amp);
    ctx.restore();
    if (st && !acting) {
      const headY = view.floorScreenY - (64 + crewLift) * view.k; // mürettebat ~60 px boyunda; etiket süzülmeyle yükselir
      drawStationLabel(ctx, S.t('station.' + st.id), view.x + st.x * view.k, headY - 12 + Math.sin(t * 4) * 1.5);
    }
    if (FX.shake > 0) FX.shake -= dt;
    FX.drawGlitch(ctx, dt);
  };

  S.FX = FX;
})((window.SOL14 = window.SOL14 || {}));
