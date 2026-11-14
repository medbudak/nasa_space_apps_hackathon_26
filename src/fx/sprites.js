export class SpriteManager {
  constructor() {
    this.images = {};
  }

  load(key, src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.images[key] = img; resolve(img); };
      img.onerror = () => { console.warn('Gorsel bekleniyor:', src); resolve(null); };
      img.src = src;
    });
  }

  drawFrame(ctx, key, frameIndex, frameW, frameH, x, y, flipX = false) {
    const img = this.images[key];
    if (!img) {
      ctx.fillStyle = '#C85A32';
      ctx.fillRect(x, y, frameW, frameH);
      return;
    }
    ctx.save();
    if (flipX) {
      ctx.translate(x + frameW, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, frameIndex * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
    } else {
      ctx.drawImage(img, frameIndex * frameW, 0, frameW, frameH, x, y, frameW, frameH);
    }
    ctx.restore();
  }
}
