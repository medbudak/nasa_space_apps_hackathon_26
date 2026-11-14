export class VFXManager {
  constructor(bus = null) {
    this.shakeTime = 0;
    this.frostLevel = 0;
    this.stormIntensity = 0;
    this.hallucinationAlpha = 0;
    this.particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      speed: 4 + Math.random() * 8,
      size: 2 + Math.random() * 3
    }));

    // UFO Final Sahnesi Durumu (40 sn sekans)
    this.ufoActive = false;
    this.ufoElapsed = 0;
    this.ufoDuration = 40;
    this.ufoClearPhoto = false;
    this.ufoImages = {};
    this._preloadUfoAssets();

    if (bus && typeof bus.on === 'function') {
      this.bindBus(bus);
    }
  }

  _preloadUfoAssets() {
    const paths = {
      liftoff: 'assets/ending/ufo_liftoff.png',
      sky: 'assets/ending/ufo_sky.png',
      clear: 'assets/ending/ufo_photo_clear.png',
      blur: 'assets/ending/ufo_photo_blur.png'
    };
    Object.entries(paths).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      this.ufoImages[key] = img;
    });
  }

  bindBus(bus) {
    bus.on('storm', ({ intensity = 0 } = {}) => {
      this.stormIntensity = intensity;
    });
    bus.on('quake', ({ duration = 0 } = {}) => {
      if (duration > 0) this.triggerQuake(duration);
      else this.shakeTime = 0;
    });
    bus.on('frost', ({ level = 0 } = {}) => {
      this.frostLevel = level;
    });
    bus.on('hallucination', ({ alpha = 0 } = {}) => {
      this.hallucinationAlpha = alpha;
    });
    bus.on('ufo', ({ active = true, quality = 0.8 } = {}) => {
      if (active) this.startUfoSequence(quality);
      else this.ufoActive = false;
    });
  }

  triggerQuake(duration = 1.5) {
    this.shakeTime = duration;
  }

  startUfoSequence(quality = 0.8) {
    this.ufoActive = true;
    this.ufoElapsed = 0;
    this.ufoClearPhoto = quality >= 0.8;
  }

  applyCameraShake(ctx, dt) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const dx = (Math.random() - 0.5) * 12;
      const dy = (Math.random() - 0.5) * 12;
      ctx.translate(dx, dy);
    }
  }

  update(dt) {
    if (this.ufoActive) {
      this.ufoElapsed += dt;
      if (this.ufoElapsed >= this.ufoDuration) {
        this.ufoActive = false;
      }
    }
  }

  renderOverlays(ctx, width, height, dt = 0.016) {
    this.update(dt);

    // 1. Kum Fırtınası
    if (this.stormIntensity > 0) {
      ctx.fillStyle = `rgba(180, 75, 35, ${this.stormIntensity * 0.45})`;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = `rgba(235, 160, 110, ${this.stormIntensity * 0.8})`;
      this.particles.forEach(p => {
        p.x -= p.speed * (1 + this.stormIntensity * 2);
        if (p.x < 0) p.x = width;
        ctx.fillRect(p.x, p.y, p.size * 2, p.size);
      });
    }

    // 2. Vizör Buzlanması
    if (this.frostLevel > 0) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.6);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, `rgba(186, 230, 253, ${this.frostLevel * 0.65})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Akıl Sağlığı Halüsinasyon & Glitch Katmanı
    if (this.hallucinationAlpha > 0) {
      const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.65);
      vignette.addColorStop(0, 'rgba(15, 23, 42, 0)');
      vignette.addColorStop(1, `rgba(88, 28, 135, ${this.hallucinationAlpha * 0.55})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (Math.random() < this.hallucinationAlpha * 0.4) {
        ctx.fillStyle = `rgba(239, 68, 68, ${this.hallucinationAlpha * 0.25})`;
        ctx.fillRect(0, Math.random() * height, width, 4 + Math.random() * 10);
      }
    }

    // 4. Final UFO Sahnesi (40 sn sekans)
    if (this.ufoActive) {
      this._renderUfoSequence(ctx, width, height);
    }
  }

  _renderUfoSequence(ctx, width, height) {
    const t = this.ufoElapsed;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // 0-10 sn: MAV Kalkışı
    if (t < 10) {
      const img = this.ufoImages.liftoff;
      if (img && img.complete) ctx.drawImage(img, 0, 0, width, height);
    }
    // 10-22 sn: Gökyüzünde ışık + ani açı + sönmeden önce 3 kez yanıp sönme
    else if (t < 22) {
      const img = this.ufoImages.sky;
      if (img && img.complete) ctx.drawImage(img, 0, 0, width, height);

      const blinkPhase = t - 18; // Son 4 saniyede 3 kez yanıp sönme
      let lightAlpha = 1;
      if (blinkPhase > 0 && blinkPhase < 3) {
        lightAlpha = Math.sin(blinkPhase * Math.PI * 2) > 0 ? 1 : 0.1;
      } else if (blinkPhase >= 3) {
        lightAlpha = 0;
      }

      if (lightAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(186, 230, 253, ${lightAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(width * 0.72, height * 0.24, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    // 22-36 sn: Görev Kontrol ekranında fotoğrafın satır satır (scanline) inmesi
    else if (t < 36) {
      const photo = this.ufoClearPhoto ? this.ufoImages.clear : this.ufoImages.blur;
      const progress = Math.min(1, (t - 22) / 12);
      const boxW = width * 0.5;
      const boxH = height * 0.55;
      const boxX = (width - boxW) / 2;
      const boxY = (height - boxH) / 2;

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX - 4, boxY - 4, boxW + 8, boxH + 8);

      if (photo && photo.complete && photo.naturalWidth > 0) {
        const srcH = photo.naturalHeight * progress;
        const dstH = boxH * progress;
        ctx.drawImage(photo, 0, 0, photo.naturalWidth, srcH, boxX, boxY, boxW, dstH);
      }
    }
    // 36-40 sn: Siyah ekran
  }
}
