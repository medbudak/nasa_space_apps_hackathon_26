/**
 * SOL 14: RED HORIZON — 2D 16-Bit Pixel Art Yüzey Sahnesi, 0.38g Fizik ve UFO VFX Motoru (K4)
 */

import { getState, bus } from '../core/state.js';
import { getCachedSprite, loadSprite } from './sprites.js';

let animFrameId = null;
let weatherFx = 'clear';
let shakeTimer = 0;
let particles = [];

// 0.38g (g = 3.71 m/s^2) Astronot Karakter Fiziği
const astronaut = {
  x: 340,
  y: 0, // yerden yükseklik (px)
  vy: 0,
  vx: 0,
  facingRight: true,
  pose: 'idle', // 'idle' | 'walk' | 'jump' | 'frozen' | 'action'
  actionTimer: 0
};

export function initSurfaceFx() {
  particles = Array.from({ length: 48 }, () => ({
    x: Math.random() * 960,
    y: Math.random() * 440,
    speedX: 3 + Math.random() * 5,
    speedY: 0.5 + Math.random() * 1.5,
    size: 2 + Math.floor(Math.random() * 3)
  }));

  bus.on('fx:weather', (payload) => {
    if (payload?.type) {
      weatherFx = payload.type;
      if (payload.type === 'quake') {
        shakeTimer = 45;
      }
    }
  });
}

/**
 * 0.38g Düşük Yerçekimi Zıplaması (Dünya'nın ~2.6 katı yükseğe ve ~1.63x daha uzun havada kalır)
 */
export function triggerAstronautJump() {
  if (astronaut.y <= 0) {
    astronaut.vy = 9.6; // 0.38g ivmeyle uzun parabolik sıçrama
    astronaut.pose = 'jump';
    bus.emit('audio:play', 'jump');
  }
}

export function triggerAstronautMove(dir = 1) {
  astronaut.facingRight = dir >= 0;
  const isFrozen = getState().resources.jointFrozen;
  const speed = isFrozen ? 14 : 34;
  astronaut.x = Math.max(90, Math.min(860, astronaut.x + dir * speed));
  astronaut.pose = isFrozen ? 'frozen' : 'walk';
  astronaut.actionTimer = 18;
}

export function triggerAstronautAction() {
  astronaut.pose = 'action';
  astronaut.actionTimer = 35;
}

/**
 * Yüzey Canvas sahnesini her karede (60 FPS) çizer
 */
export function startSurfaceCanvasLoop(canvas) {
  if (!canvas) return;
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const render = () => {
    const state = getState();
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();

    // Sarsıntı (Marsquake ~M4.7) ekran titremesi
    if (shakeTimer > 0) {
      shakeTimer--;
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 6;
      ctx.translate(dx, dy);
    }

    // 1. Arka Plan Seçimi (İniş Bölgesi + Gece/Mavi Gün Batımı/Fırtına)
    let bgKey = 'bg_jezero_day';
    if (weatherFx === 'storm' || state.activeCrisis?.id === 'dust_storm') {
      bgKey = 'bg_storm';
    } else if (state.timeOfDay === 'sunset') {
      bgKey = 'bg_jezero_sunset';
    } else if (state.timeOfDay === 'night') {
      bgKey = 'bg_jezero_night';
    } else if (state.design.landingSiteId === 'meridiani') {
      bgKey = 'bg_meridiani_day';
    } else if (state.design.landingSiteId === 'arcadia') {
      bgKey = 'bg_arcadia_day';
    }

    const bgImg = getCachedSprite(bgKey);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      loadSprite(bgKey);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, state.timeOfDay === 'night' ? '#0B1021' : '#C86D44');
      grad.addColorStop(1, '#6E2614');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    const groundY = h - 56;

    // 2. Üs Yapıları (Habitat, Sera, Güneş Paneli, MOXIE/RTG, MAV Roketi)
    drawSpriteSafe(ctx, 'mav_rocket', 68, groundY - 148, 128, 152);
    drawSpriteSafe(ctx, 'habitat_main', 185, groundY - 120, 155, 124);

    const ghKey = state.resources.greenhouseFrozen ? 'greenhouse_frozen' : 'greenhouse_ok';
    drawSpriteSafe(ctx, ghKey, 345, groundY - 104, 136, 108);

    const solarKey = state.resources.panelDust > 0.35 ? 'solar_dusty' : 'solar_clean';
    drawSpriteSafe(ctx, solarKey, 488, groundY - 88, 124, 92);

    if (
      state.design.powerSource === 'solar_rtg' ||
      state.design.instruments.includes('moxie')
    ) {
      drawSpriteSafe(ctx, 'moxie_unit', 618, groundY - 78, 86, 82);
    }

    // 3. Keşif Koridorundaki Enkaz Önizlemesi & Ingenuity Drone
    drawSpriteSafe(ctx, 'rover_opportunity', 755, groundY - 84, 102, 88);
    if (state.forensics.phoenix?.discovered) {
      drawSpriteSafe(ctx, 'lander_phoenix', 848, groundY - 82, 92, 84);
    }

    if (state.design.instruments.includes('ingenuity')) {
      const hoverOffset = Math.sin(Date.now() * 0.006) * 10;
      drawSpriteSafe(ctx, 'drone_ingenuity', 705, groundY - 185 + hoverOffset, 68, 68);
    }

    // 4. 0.38g Astronot Fizik Güncellemesi ve Çizimi
    if (astronaut.y > 0 || astronaut.vy > 0) {
      astronaut.y += astronaut.vy;
      astronaut.vy -= 0.28; // Mars 0.38g düşük yerçekimi ivmesi!
      if (astronaut.y <= 0) {
        astronaut.y = 0;
        astronaut.vy = 0;
        astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
      }
    } else if (astronaut.actionTimer > 0) {
      astronaut.actionTimer--;
      if (astronaut.actionTimer === 0) {
        astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
      }
    } else {
      astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
    }

    const poseMap = {
      idle: 'astronaut_idle',
      walk: 'astronaut_walk',
      jump: 'astronaut_jump',
      frozen: 'astronaut_frozen',
      action: 'astronaut_action'
    };
    const astroKey = poseMap[astronaut.pose] || 'astronaut_idle';
    const astroY = groundY - 94 - astronaut.y;

    ctx.save();
    if (!astronaut.facingRight) {
      ctx.translate(astronaut.x + 92, 0);
      ctx.scale(-1, 1);
      drawSpriteSafe(ctx, astroKey, 0, astroY, 92, 96);
    } else {
      drawSpriteSafe(ctx, astroKey, astronaut.x, astroY, 92, 96);
    }
    ctx.restore();

    // 5. Atmosfer ve Akıl Sağlığı VFX Katmanları
    // 5a. Toz Şeytanı (Dust Devil)
    if (weatherFx === 'dust_devil' || state.activeCrisis?.id === 'dust_devil_bonus') {
      const ddX = 520 + Math.sin(Date.now() * 0.003) * 90;
      drawSpriteSafe(ctx, 'vfx_dust_devil', ddX, groundY - 165, 115, 165);
    }

    // 5b. Kum Fırtınası Parçacıkları
    if (weatherFx === 'storm' || state.resources.panelDust > 0.45) {
      ctx.fillStyle = 'rgba(218, 104, 52, 0.32)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#F4A261';
      for (const p of particles) {
        p.x += p.speedX * 1.8;
        p.y += p.speedY;
        if (p.x > w) p.x = 0;
        if (p.y > h) p.y = 0;
        ctx.fillRect(p.x, p.y, p.size * 3, p.size);
      }
    }

    // 5c. Akıl Sağlığı (Sanity < 45%) Gölge Halüsinasyonu
    if (state.resources.sanity < 45 || weatherFx === 'hallucination') {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(Date.now() * 0.015) * 0.25;
      drawSpriteSafe(ctx, 'vfx_shadow_hallucination', 825, groundY - 102, 88, 98);
      ctx.restore();
    }

    // 5d. Vizör Buzlanması (-80°C Eklem Donması / Soğuk)
    if (state.resources.jointFrozen || state.resources.suitTempC < 0 || weatherFx === 'frost') {
      const frostKey = state.resources.suitTempC < -10 ? 'vfx_frost_2' : 'vfx_frost_1';
      ctx.save();
      ctx.globalAlpha = 0.65;
      drawSpriteSafe(ctx, frostKey, 0, 0, w, h);
      ctx.restore();
    }

    // 6. Canvas Üst Bilgi Bandı (0.38g Fizik & EVA Mesafe Bilgisi)
    ctx.fillStyle = 'rgba(11, 16, 33, 0.78)';
    ctx.fillRect(12, 12, 410, 32);
    ctx.strokeStyle = '#5B9BD5';
    ctx.strokeRect(12, 12, 410, 32);
    ctx.fillStyle = '#E6EDF3';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `MARS g = 3.71 m/s² (0.38g) | EVA: ${state.resources.evaDistanceM}m | T_dış: ${state.timeOfDay === 'night' ? '-82°C' : '+8°C'}`,
      22,
      32
    );

    ctx.restore();
    animFrameId = requestAnimationFrame(render);
  };

  render();
}

export function stopSurfaceCanvasLoop() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

function drawSpriteSafe(ctx, key, x, y, w, h) {
  const sp = getCachedSprite(key);
  if (sp) {
    ctx.drawImage(sp, x, y, w, h);
  } else {
    loadSprite(key);
  }
}

/**
 * UFO Stinger Sahnesi İçin Satır-Satır (Scanline) Telemetri Fotoğrafı Çizici
 */
export function renderUfoScanlineCanvas(canvas, { highRes = true, maxPct = 80, onComplete }) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const imgKey = highRes ? 'ufo_photo_clear' : 'ufo_photo_blur';
  let currentPct = 0;

  loadSprite(imgKey).then((img) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#070A14';
    ctx.fillRect(0, 0, w, h);

    const step = () => {
      currentPct = Math.min(maxPct, currentPct + 1.2);
      const drawHeight = Math.floor((h * currentPct) / 100);

      ctx.fillStyle = '#070A14';
      ctx.fillRect(0, 0, w, h);

      if (img) {
        const srcH = Math.floor(((img.height || 360) * currentPct) / 100);
        ctx.drawImage(img, 0, 0, img.width || 640, srcH, 0, 0, w, drawHeight);
      }

      // Aktif tarama çizgisi (Scanline)
      ctx.fillStyle = '#3FB950';
      ctx.fillRect(0, drawHeight, w, 3);

      // Alt kısımda henüz inmeyen statik karıncalanma
      for (let y = drawHeight + 4; y < h; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? 'rgba(91, 155, 213, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, y, w, 2);
      }

      // Telemetri damgası
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(10, 10, 360, 28);
      ctx.fillStyle = currentPct >= maxPct ? '#F85149' : '#8BE9FD';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `DSN TELEMETRY [${highRes ? 'MASTCAM-Z HI-RES' : 'LOW-RES CAM'}]: ${Math.floor(currentPct)}% / ${maxPct}%`,
        18,
        28
      );

      if (currentPct < maxPct) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    };

    requestAnimationFrame(step);
  });
}
