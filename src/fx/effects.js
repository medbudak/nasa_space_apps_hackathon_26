export class VFXManager {
  constructor() {
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
  }

  triggerQuake(duration = 1.5) {
    this.shakeTime = duration;
  }

  applyCameraShake(ctx, dt) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const dx = (Math.random() - 0.5) * 12;
      const dy = (Math.random() - 0.5) * 12;
      ctx.translate(dx, dy);
    }
  }

  renderOverlays(ctx, width, height) {
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

    if (this.frostLevel > 0) {
      const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.6);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, `rgba(186, 230, 253, ${this.frostLevel * 0.65})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
