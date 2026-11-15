/**
 * SOL 14: RED HORIZON — Derleme Aracı (K1 + K4)
 *
 *   node tools/build.js          -> veri + görseller
 *   node tools/build.js data     -> yalnızca data/nasa_data.json + content/story.json -> src/data/*.js
 *   node tools/build.js assets   -> yalnızca görseller -> assets/processed/*
 *
 * Neden?  Oyun `index.html`'e çift tıklanarak (file://) da çalışmalı. Tarayıcılar file:// altında
 * ne JSON fetch'ine ne de canvas piksel okumaya (getImageData) izin verir. Bu yüzden:
 *   1) JSON verileri klasik <script> dosyalarına gömülür,
 *   2) #FFFFFF beyaz zeminli sprite'lar ÖNCEDEN kenardan flood-fill ile şeffaflaştırılır,
 *      küçültülür ve kırpılır (çalışma anında piksel işlemi gerekmez).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { decodePng, encodePng } = require('./png.js');

const ROOT = path.resolve(__dirname, '..');
const rel = (...p) => path.join(ROOT, ...p);

/* ------------------------------------------------------------------ */
/* 1. VERİ                                                              */
/* ------------------------------------------------------------------ */
function buildData() {
  const readJson = (...p) => JSON.parse(fs.readFileSync(rel(...p), 'utf8'));
  const nasa = readJson('data', 'nasa_data.json');
  nasa.forensics = readJson('data', 'forensics_cases.json');
  nasa.experimentsCfg = readJson('data', 'experiments_config.json');
  nasa.events = readJson('data', 'events_catalog.json');
  nasa.explore = readJson('data', 'explore_config.json');
  const story = readJson('content', 'story.json');
  fs.mkdirSync(rel('src', 'data'), { recursive: true });
  const header = (src) =>
    `/* OTOMATİK ÜRETİLDİ — elle düzenlemeyin. Kaynak: ${src}  (node tools/build.js data) */\n`;
  fs.writeFileSync(
    rel('src', 'data', 'nasa_data.js'),
    header('data/nasa_data.json') +
      'window.SOL14 = window.SOL14 || {};\nwindow.SOL14.DATA = ' +
      JSON.stringify(nasa, null, 1) +
      ';\n'
  );
  fs.writeFileSync(
    rel('src', 'data', 'story.js'),
    header('content/story.json') +
      'window.SOL14 = window.SOL14 || {};\nwindow.SOL14.STORY = ' +
      JSON.stringify(story, null, 1) +
      ';\n'
  );
  console.log(`[data] nasa_data.js + story.js üretildi (${Object.keys(story.tr).length} metin anahtarı)`);
}

/* ------------------------------------------------------------------ */
/* 2. GÖRSEL İŞLEME                                                     */
/* ------------------------------------------------------------------ */
const WHITE_THRESHOLD = 236;

/** Kenarlardan içe flood-fill: yalnızca DIŞ beyaz zemine bağlı pikseller silinir. */
function chromaBorderFlood(img) {
  const { width: w, height: h, data } = img;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const isBg = (i) =>
    data[i * 4] >= WHITE_THRESHOLD &&
    data[i * 4 + 1] >= WHITE_THRESHOLD &&
    data[i * 4 + 2] >= WHITE_THRESHOLD;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    if (isBg(i)) queue[tail++] = i;
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  let removed = 0;
  while (head < tail) {
    const i = queue[head++];
    data[i * 4 + 3] = 0;
    removed++;
    const x = i % w;
    const y = (i - x) / w;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  // Kenar halesi: şeffaf komşusu olan, neredeyse beyaz VE renksiz pikseller (2 tur)
  for (let pass = 0; pass < 2; pass++) {
    const kill = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (data[i * 4 + 3] === 0) continue;
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        const mn = Math.min(r, g, b);
        const mx = Math.max(r, g, b);
        if (mn < 214 || mx - mn > 22) continue;
        if (
          data[(i - 1) * 4 + 3] === 0 ||
          data[(i + 1) * 4 + 3] === 0 ||
          data[(i - w) * 4 + 3] === 0 ||
          data[(i + w) * 4 + 3] === 0
        ) {
          kill.push(i);
        }
      }
    }
    for (const i of kill) data[i * 4 + 3] = 0;
    removed += kill.length;
  }
  // QA: içeride korunan saf beyaz piksel sayısı (astronot giysisi / kubbe çerçevesi)
  let keptWhite = 0;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] !== 0 && isBg(i)) keptWhite++;
  }
  return { removed, keptWhite };
}

/** Buz çerçevesi: merkez elips şeffaf, kenarlar opak (vizör buzlanması) */
function chromaVignette(img) {
  const { width: w, height: h, data } = img;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      const d = Math.sqrt(nx * nx * 0.9 + ny * ny * 1.1);
      const a = Math.max(0, Math.min(1, (d - 0.35) / 0.45));
      data[(y * w + x) * 4 + 3] = Math.round(a * 235);
    }
  }
  return { removed: 0, keptWhite: 0 };
}

/** Beyazdan alfaya: beyaz zemin tamamen kaybolur, renkli toz yarı saydam kalır */
function chromaUnwhite(img) {
  const { width: w, height: h, data } = img;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = Math.min(1, ((255 - Math.min(r, g, b)) / 255) * 1.8);
    if (a <= 0.02) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
    data[i * 4] = un(r);
    data[i * 4 + 1] = un(g);
    data[i * 4 + 2] = un(b);
    data[i * 4 + 3] = Math.round(a * 255);
  }
  return { removed: 0, keptWhite: 0 };
}

function cropToContent(img, pad = 2) {
  const { width: w, height: h, data } = img;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad);
  y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + cw) * 4), y * cw * 4);
  }
  return { width: cw, height: ch, data: out };
}

/** Alan-ortalamalı küçültme (premultiplied alfa). crisp=true ise alfa 0/255'e keskinleştirilir. */
function resizeArea(img, tw, th, crisp) {
  const { width: w, height: h, data } = img;
  const out = new Uint8Array(tw * th * 4);
  const sx = w / tw;
  const sy = h / th;
  for (let ty = 0; ty < th; ty++) {
    const y0 = Math.floor(ty * sy);
    const y1 = Math.max(y0 + 1, Math.floor((ty + 1) * sy));
    for (let tx = 0; tx < tw; tx++) {
      const x0 = Math.floor(tx * sx);
      const x1 = Math.max(x0 + 1, Math.floor((tx + 1) * sx));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          const al = data[i + 3];
          r += data[i] * al;
          g += data[i + 1] * al;
          b += data[i + 2] * al;
          a += al;
          n++;
        }
      }
      const o = (ty * tw + tx) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      const avgA = a / n;
      out[o + 3] = crisp ? (avgA >= 110 ? 255 : 0) : Math.round(avgA);
    }
  }
  return { width: tw, height: th, data: out };
}

/**
 * Varlık manifestosu. size: { h } | { w } | { w, h }.  mode: flood | vignette | unwhite | none
 * Hedef boyutlar oyunun 640x360 iç çözünürlüğüne göre seçilmiştir (1 sprite pikseli = 1 oyun pikseli).
 */
const ASSETS = [
  // Astronot pozları
  { src: 'sprites/astronaut_idle.png', mode: 'flood', size: { h: 58 } },
  { src: 'sprites/astronaut_walk.png', mode: 'flood', size: { h: 58 } },
  // 6 karelik yürüme şeridi: kareler kaynakta ortak kutuya hizalı (151x266), kırpılmaz; 6 x 33 = 198 px
  { src: 'sprites/astronaut_walk_sheet.png', mode: 'flood', size: { w: 198, h: 58 }, noCrop: true },
  { src: 'sprites/astronaut_jump.png', mode: 'flood', size: { h: 60 } },
  // Mekik içinde kasksız mürettebat (K4 Sedef): kaynak 2048×2048 şeffaf; içeriğe kırpılıp küçültülür
  { src: 'sprites/astronaut_indoor.png', mode: 'none', size: { h: 132 } },
  { src: 'sprites/astronaut_frozen.png', mode: 'flood', size: { h: 58 } },
  { src: 'sprites/astronaut_action.png', mode: 'flood', size: { h: 48 } },
  { src: 'sprites/drone_ingenuity.png', mode: 'flood', size: { h: 34 } },
  // Kayıp araç enkazları
  { src: 'sprites/rover_opportunity.png', mode: 'flood', size: { w: 92 } },
  { src: 'sprites/rover_spirit.png', mode: 'flood', size: { w: 92 } },
  { src: 'sprites/lander_phoenix.png', mode: 'flood', size: { w: 104 } },
  { src: 'sprites/lander_insight.png', mode: 'flood', size: { w: 104 } },
  { src: 'sprites/lander_beagle2.png', mode: 'flood', size: { w: 84 } },
  // Kişi 5: mineral ikonları (24×24 piksel çizim, kaynak 48×48 = 2× en yakın komşu; envanter + bilgi kartı)
  { src: 'sprites/mineral_hematite.png', mode: 'none', size: { w: 24, h: 24 }, noCrop: true },
  { src: 'sprites/mineral_meteorite.png', mode: 'none', size: { w: 24, h: 24 }, noCrop: true },
  { src: 'sprites/mineral_gypsum.png', mode: 'none', size: { w: 24, h: 24 }, noCrop: true },
  { src: 'sprites/mineral_olivine.png', mode: 'none', size: { w: 24, h: 24 }, noCrop: true },
  { src: 'sprites/mineral_basalt.png', mode: 'none', size: { w: 24, h: 24 }, noCrop: true },
  // Üs yapıları
  { src: 'structures/mav_rocket.png', mode: 'flood', size: { h: 150 } },
  { src: 'structures/greenhouse_ok.png', mode: 'flood', size: { w: 150 } },
  { src: 'structures/greenhouse_frozen.png', mode: 'flood', size: { w: 150 } },
  { src: 'structures/solar_clean.png', mode: 'flood', size: { w: 104 } },
  { src: 'structures/solar_dusty.png', mode: 'flood', size: { w: 104 } },
  { src: 'structures/moxie_unit.png', mode: 'flood', size: { w: 78 } },
  // VFX
  { src: 'vfx/vfx_dust_devil.png', mode: 'flood', size: { h: 130 }, soft: true },
  { src: 'vfx/vfx_shadow_hallucination.png', mode: 'flood', size: { h: 62 } },
  { src: 'vfx/vfx_frost_1.png', mode: 'vignette', size: { w: 640, h: 360 }, noCrop: true, soft: true },
  { src: 'vfx/vfx_frost_2.png', mode: 'vignette', size: { w: 640, h: 360 }, noCrop: true, soft: true },
  // Tam ekran sahneler (menü, ara sahne, panel arka planları) — opak, 960x540
  ...[
    'backgrounds/bg_jezero_day.png',
    'backgrounds/bg_jezero_sunset.png',
    'backgrounds/bg_jezero_night.png',
    'backgrounds/bg_meridiani_day.png',
    'backgrounds/bg_arcadia_day.png',
    'backgrounds/bg_storm.png',
    'screens/scr_launch.png',
    'screens/scr_transit.png',
    'screens/scr_map_corridor.png',
    'screens/scr_lab_desk.png',
    'screens/scr_downlink.png',
    'screens/scr_sol_transition.png',
    'ending/ufo_liftoff.png',
    'ending/ufo_sky.png',
    'ending/ufo_photo_clear.png',
    'ending/ufo_photo_blur.png',
    'ending/cover_thumbnail.png'
  ].map((src) => ({ src, mode: 'none', size: { w: 960, h: 540 }, noCrop: true, opaque: true }))
];

function buildAssets() {
  const report = [];
  for (const spec of ASSETS) {
    const inPath = rel('assets', spec.src);
    const outPath = rel('assets', 'processed', spec.src);
    if (!fs.existsSync(inPath)) {
      console.warn(`[assets] EKSİK: ${spec.src}`);
      continue;
    }
    let img = decodePng(fs.readFileSync(inPath));
    let stats = { removed: 0, keptWhite: 0 };
    if (spec.mode === 'flood') stats = chromaBorderFlood(img);
    else if (spec.mode === 'vignette') stats = chromaVignette(img);
    else if (spec.mode === 'unwhite') stats = chromaUnwhite(img);
    if (!spec.noCrop) img = cropToContent(img);

    let tw;
    let th;
    if (spec.size.w && spec.size.h) {
      tw = spec.size.w;
      th = spec.size.h;
    } else if (spec.size.h) {
      th = spec.size.h;
      tw = Math.max(1, Math.round((img.width * th) / img.height));
    } else {
      tw = spec.size.w;
      th = Math.max(1, Math.round((img.height * tw) / img.width));
    }
    const crisp = spec.mode === 'flood' && !spec.soft;
    const out = resizeArea(img, tw, th, crisp);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, encodePng(out, { opaque: Boolean(spec.opaque) }));
    report.push({
      asset: spec.src,
      size: `${tw}x${th}`,
      mode: spec.mode,
      bgRemovedPx: stats.removed,
      whiteKeptPx: stats.keptWhite
    });
  }
  fs.writeFileSync(rel('assets', 'processed', 'manifest.json'), JSON.stringify(report, null, 2));
  console.table(report);
}

const arg = process.argv[2];
if (!arg || arg === 'data') buildData();
if (!arg || arg === 'assets') buildAssets();
