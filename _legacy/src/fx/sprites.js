/**
 * SOL 14: RED HORIZON — 16-Bit Pixel Art Varlık Yükleyici ve Flood-Fill Chroma-Key (K4)
 * #FFFFFF beyaz arka planlı sprite'ları kenarlardan içe doğru şeffaf yapar;
 * astronotun beyaz uzay kıyafetinin iç piksellerini korur.
 */

export const ASSET_PATHS = {
  // Arka Planlar (16:9)
  bg_jezero_day: 'assets/backgrounds/bg_jezero_day.png',
  bg_jezero_sunset: 'assets/backgrounds/bg_jezero_sunset.png',
  bg_jezero_night: 'assets/backgrounds/bg_jezero_night.png',
  bg_storm: 'assets/backgrounds/bg_storm.png',
  bg_meridiani_day: 'assets/backgrounds/bg_meridiani_day.png',
  bg_arcadia_day: 'assets/backgrounds/bg_arcadia_day.png',

  // Astronot, Drone ve Enkaz Sprite'ları (1:1 - #FFFFFF Beyaz Zemin)
  astronaut_idle: 'assets/sprites/astronaut_idle.png',
  astronaut_walk: 'assets/sprites/astronaut_walk.png',
  astronaut_jump: 'assets/sprites/astronaut_jump.png',
  astronaut_frozen: 'assets/sprites/astronaut_frozen.png',
  astronaut_action: 'assets/sprites/astronaut_action.png',
  drone_ingenuity: 'assets/sprites/drone_ingenuity.png',
  rover_opportunity: 'assets/sprites/rover_opportunity.png',
  rover_spirit: 'assets/sprites/rover_spirit.png',
  lander_phoenix: 'assets/sprites/lander_phoenix.png',
  lander_insight: 'assets/sprites/lander_insight.png',
  lander_beagle2: 'assets/sprites/lander_beagle2.png',

  // Üs Yapıları (#FFFFFF Beyaz Zemin)
  habitat_main: 'assets/structures/habitat_main.png',
  mav_rocket: 'assets/structures/mav_rocket.png',
  greenhouse_ok: 'assets/structures/greenhouse_ok.png',
  greenhouse_frozen: 'assets/structures/greenhouse_frozen.png',
  solar_clean: 'assets/structures/solar_clean.png',
  solar_dusty: 'assets/structures/solar_dusty.png',
  moxie_unit: 'assets/structures/moxie_unit.png',

  // Tam Ekran Paneller
  scr_launch: 'assets/screens/scr_launch.png',
  scr_transit: 'assets/screens/scr_transit.png',
  scr_map_corridor: 'assets/screens/scr_map_corridor.png',
  scr_lab_desk: 'assets/screens/scr_lab_desk.png',
  scr_downlink: 'assets/screens/scr_downlink.png',
  scr_habitat_cutaway: 'assets/screens/scr_habitat_cutaway.png',
  scr_sol_transition: 'assets/screens/scr_sol_transition.png',

  // VFX Efektleri
  vfx_frost_1: 'assets/vfx/vfx_frost_1.png',
  vfx_frost_2: 'assets/vfx/vfx_frost_2.png',
  vfx_dust_storm: 'assets/vfx/vfx_dust_storm.png',
  vfx_dust_devil: 'assets/vfx/vfx_dust_devil.png',
  vfx_shadow_hallucination: 'assets/vfx/vfx_shadow_hallucination.png',

  // UFO Stinger Final Görselleri
  ufo_liftoff: 'assets/ending/ufo_liftoff.png',
  ufo_sky: 'assets/ending/ufo_sky.png',
  ufo_photo_clear: 'assets/ending/ufo_photo_clear.png',
  ufo_photo_blur: 'assets/ending/ufo_photo_blur.png',
  cover_thumbnail: 'assets/ending/cover_thumbnail.png'
};

// Beyaz arka planı şeffaf yapılacak varlık anahtarları
const CHROMA_KEY_ASSETS = new Set([
  'astronaut_idle',
  'astronaut_walk',
  'astronaut_jump',
  'astronaut_frozen',
  'astronaut_action',
  'drone_ingenuity',
  'rover_opportunity',
  'rover_spirit',
  'lander_phoenix',
  'lander_insight',
  'lander_beagle2',
  'habitat_main',
  'mav_rocket',
  'greenhouse_ok',
  'greenhouse_frozen',
  'solar_clean',
  'solar_dusty',
  'moxie_unit',
  'vfx_frost_1',
  'vfx_frost_2',
  'vfx_dust_storm',
  'vfx_dust_devil',
  'vfx_shadow_hallucination'
]);

const spriteCache = new Map();

/**
 * Kenarlardan (Border) başlayan Flood-Fill algoritmasıyla #FFFFFF beyaz arka planı şeffaf yapar.
 * Böylece astronotun iç beyaz EVA kıyafeti silinmez!
 */
function applyBorderFloodFillChromaKey(img, threshold = 236) {
  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return img;

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const isWhiteBg = (idx) => {
      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      return r >= threshold && g >= threshold && b >= threshold;
    };

    const enqueueIfBg = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      if (isWhiteBg(idx)) {
        queue[tail++] = idx;
      }
    };

    // 4 dış kenarı kuyruğa ekle
    for (let x = 0; x < w; x++) {
      enqueueIfBg(x, 0);
      enqueueIfBg(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      enqueueIfBg(0, y);
      enqueueIfBg(w - 1, y);
    }

    // Vizör buzlanması (frost) ve fırtına efektlerinde orta alan da beyaz olduğu için merkezi de ekle
    enqueueIfBg(Math.floor(w / 2), Math.floor(h / 2));

    while (head < tail) {
      const curr = queue[head++];
      const p = curr * 4;
      data[p + 3] = 0; // Alpha = 0 (Tam Şeffaf)

      const cx = curr % w;
      const cy = (curr - cx) / w;
      enqueueIfBg(cx + 1, cy);
      enqueueIfBg(cx - 1, cy);
      enqueueIfBg(cx, cy + 1);
      enqueueIfBg(cx, cy - 1);
    }

    ctx.putImageData(imgData, 0, 0);
    return off;
  } catch {
    // file:// protokolünde CORS kısıtı varsa doğrudan orijinal görseli döndür
    return img;
  }
}

export function loadSprite(key) {
  if (spriteCache.has(key)) {
    return Promise.resolve(spriteCache.get(key));
  }
  const path = ASSET_PATHS[key];
  if (!path) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const processed = CHROMA_KEY_ASSETS.has(key)
        ? applyBorderFloodFillChromaKey(img)
        : img;
      spriteCache.set(key, processed);
      resolve(processed);
    };
    img.onerror = () => {
      spriteCache.set(key, null);
      resolve(null);
    };
    img.src = path;
  });
}

export function getCachedSprite(key) {
  return spriteCache.get(key) || null;
}

/**
 * Temel oyun görsellerini arka planda önbelleğe yükler
 */
export async function preloadAllSprites() {
  const keys = Object.keys(ASSET_PATHS);
  await Promise.all(keys.map((k) => loadSprite(k)));
}
