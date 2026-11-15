/**
 * SOL 14: RED HORIZON — Görsel Yükleyici (K4)
 * assets/processed/* görselleri tools/build.js tarafından önceden şeffaflaştırılmış (kenardan flood-fill
 * chroma-key; beyaz giysi ve kubbe içi korunur), kırpılmış ve oyun çözünürlüğüne küçültülmüştür.
 * Çalışma anında piksel okunmadığı için file:// üzerinde de sorunsuz çalışır.
 */
(function (S) {
  'use strict';
  const P = 'assets/processed/';
  const MANIFEST = {
    astronaut_idle: 'sprites/astronaut_idle.png',
    astronaut_walk: 'sprites/astronaut_walk.png',
    astronaut_walk_sheet: 'sprites/astronaut_walk_sheet.png',
    astronaut_jump: 'sprites/astronaut_jump.png',
    astronaut_frozen: 'sprites/astronaut_frozen.png',
    astronaut_action: 'sprites/astronaut_action.png',
    drone_ingenuity: 'sprites/drone_ingenuity.png',
    rover_opportunity: 'sprites/rover_opportunity.png',
    rover_spirit: 'sprites/rover_spirit.png',
    lander_phoenix: 'sprites/lander_phoenix.png',
    lander_insight: 'sprites/lander_insight.png',
    lander_beagle2: 'sprites/lander_beagle2.png',
    mav_rocket: 'structures/mav_rocket.png',
    greenhouse_ok: 'structures/greenhouse_ok.png',
    greenhouse_frozen: 'structures/greenhouse_frozen.png',
    solar_clean: 'structures/solar_clean.png',
    solar_dusty: 'structures/solar_dusty.png',
    moxie_unit: 'structures/moxie_unit.png',
    vfx_dust_devil: 'vfx/vfx_dust_devil.png',
    vfx_shadow_hallucination: 'vfx/vfx_shadow_hallucination.png',
    vfx_frost_1: 'vfx/vfx_frost_1.png',
    vfx_frost_2: 'vfx/vfx_frost_2.png',
    // Mekik içi (K4 Sedef): yaşam alanının arka planı ve kasksız mürettebat
    ship_interior: 'screens/scr_ship_interior.jpeg',
    astronaut_indoor: 'sprites/astronaut_indoor.png',
    // Takımın GIF animasyonları (4 karelik yatay şeritler)
    astro_surface_idle: 'sprites/astro/astro_surface_idle.png',
    astro_surface_walk: 'sprites/astro/astro_surface_walk.png',
    astro_float: 'sprites/astro/astro_float.png',
    astro_eat: 'sprites/astro/astro_eat.png',
    astro_drink: 'sprites/astro/astro_drink.png',
    astro_sleep: 'sprites/astro/astro_sleep.png'
  };

  /** DOM arka planları için (CSS url) yol yardımcıları */
  const SCREENS = {
    bg_jezero_day: 'backgrounds/bg_jezero_day.png',
    bg_jezero_sunset: 'backgrounds/bg_jezero_sunset.png',
    bg_jezero_night: 'backgrounds/bg_jezero_night.png',
    bg_meridiani_day: 'backgrounds/bg_meridiani_day.png',
    bg_arcadia_day: 'backgrounds/bg_arcadia_day.png',
    bg_storm: 'backgrounds/bg_storm.png',
    scr_launch: 'screens/scr_launch.png',
    scr_transit: 'screens/scr_transit.png',
    shuttle_cockpit_interior: 'interior/shuttle_cockpit_interior.jpeg',
    shuttle_engineering_bay: 'interior/shuttle_engineering_bay.jpeg',
    scr_ship_interior: 'screens/scr_ship_interior.jpeg',
    scr_ship_o2_leak: 'screens/scr_ship_o2_leak.jpeg',
    scr_ship_reactor: 'screens/scr_ship_reactor.jpeg',
    scr_map_corridor: 'screens/scr_map_corridor.png',
    scr_lab_desk: 'screens/scr_lab_desk.png',
    scr_downlink: 'screens/scr_downlink.png',
    scr_sol_transition: 'screens/scr_sol_transition.png',
    ufo_liftoff: 'ending/ufo_liftoff.png',
    ufo_sky: 'ending/ufo_sky.png',
    ufo_photo_clear: 'ending/ufo_photo_clear.png',
    ufo_photo_blur: 'ending/ufo_photo_blur.png',
    cover_thumbnail: 'ending/cover_thumbnail.png'
  };

  const cache = new Map();

  function load(key, path) {
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cache.set(key, img);
        resolve(img);
      };
      img.onerror = () => {
        // Sözleşme: eksik görsel oyunu asla kilitlemez (RULES.md §2.6)
        console.warn('[sprites] yüklenemedi:', path);
        cache.set(key, null);
        resolve(null);
      };
      img.src = path;
    });
  }

  S.Sprites = {
    get: (key) => cache.get(key) || null,
    /**
     * CSS değişkenine (--bg:url(...)) konacağı için MUTLAK URL döner: göreli url() değeri var() ile
     * kullanıldığında styles/main.css konumuna göre çözülür ve styles/assets/... olarak 404 verir.
     */
    screen: (key) => {
      const rel = P + (SCREENS[key] || SCREENS.cover_thumbnail);
      try {
        return new URL(rel, document.baseURI).href;
      } catch (e) {
        return rel;
      }
    },
    /** Tüm oyun sprite'larını yükler; onProgress(0..1) */
    preload(onProgress) {
      const entries = Object.entries(MANIFEST);
      let done = 0;
      const extra = ['ufo_photo_clear', 'ufo_photo_blur'];
      const total = entries.length + extra.length;
      const tick = () => {
        done++;
        if (onProgress) onProgress(done / total);
      };
      return Promise.all([
        ...entries.map(([k, p]) => load(k, P + p).then(tick)),
        ...extra.map((k) => load(k, P + SCREENS[k]).then(tick))
      ]);
    }
  };
})((window.SOL14 = window.SOL14 || {}));

