/**
 * TESTING.md §1.6–1.7 — Veri ve dil bütünlüğü
 *  - data/*.json: her sayısal kaydın kendisinde ya da üst nesnesinde resmi bir `src` URL'i olmalı (RULES §2.3)
 *  - content/story.json: tr ve en birebir aynı anahtarlar + aynı {yer tutucular} (RULES §2.4)
 *  - Kodda ve veri kataloglarında kullanılan her metin anahtarı story.json'da tanımlı olmalı
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { readJson, ROOT } = require('./helpers/load_core.js');

/** Resmi kaynak alan adları: NASA (+ alt alan adları), ESA ve NASA liderliğindeki Space Apps (oyun dengesi blokları) */
const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*(nasa\.gov|esa\.int|spaceappschallenge\.org)(\/|$)/;

const DATA_FILES = ['nasa_data.json', 'forensics_cases.json', 'experiments_config.json', 'events_catalog.json'];

/** Doğrudan sayısal alanı olan her nesne için en yakın src'yi kontrol eder; ihlal yollarını döndürür */
function findUnsourced(node, pathStr, inheritedSrc, out) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => findUnsourced(v, pathStr + '[' + i + ']', inheritedSrc, out));
    return out;
  }
  if (!node || typeof node !== 'object') return out;
  const own = typeof node.src === 'string' ? node.src : null;
  const src = own || inheritedSrc;
  const hasNumber = Object.values(node).some((v) => typeof v === 'number');
  if (hasNumber && !src) out.push(pathStr || '(kök)');
  for (const [k, v] of Object.entries(node)) {
    if (k !== 'src') findUnsourced(v, pathStr ? pathStr + '.' + k : k, src, out);
  }
  return out;
}

function collectSrc(node, out = []) {
  if (Array.isArray(node)) node.forEach((v) => collectSrc(v, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'src') out.push(v);
      else collectSrc(v, out);
    }
  }
  return out;
}

for (const file of DATA_FILES) {
  test(`data/${file}: her sayısal kayıt bir src kaynağına bağlı`, () => {
    const json = readJson('data', file);
    const unsourced = findUnsourced(json, '', null, []);
    assert.deepEqual(unsourced, [], 'src alanı olmayan sayısal kayıtlar: ' + unsourced.join(', '));
  });

  test(`data/${file}: tüm src alanları resmi NASA/ESA URL'i`, () => {
    const bad = collectSrc(readJson('data', file)).filter((u) => typeof u !== 'string' || !OFFICIAL.test(u));
    assert.deepEqual(bad, []);
  });
}

test('nasa_data.json: alet, roket, iniş bölgesi, yörünge ve vaka kayıtlarının her biri kendi src alanına sahip', () => {
  const d = readJson('data', 'nasa_data.json');
  const f = readJson('data', 'forensics_cases.json');
  const x = readJson('data', 'experiments_config.json');
  const lists = { instruments: d.instruments, rockets: d.rockets, landingSites: d.landingSites, orbits: d.orbits, cases: f.cases, experiments: x.experiments };
  for (const [name, list] of Object.entries(lists)) {
    for (const item of list) assert.match(item.src || '', OFFICIAL, `${name}.${item.id} src eksik/geçersiz`);
  }
});

test('nasa_data.json: bilimsel doğruluk sabitleri (RULES §1)', () => {
  const c = readJson('data', 'nasa_data.json').constants;
  assert.equal(c.marsGravity.value, 3.71);
  assert.equal(c.solarIrradiance.mean, 590);
  assert.equal(c.temperature.equatorNightMinC, -80);
  assert.ok(c.atmosphere.surfacePressureKpa > 0.6 && c.atmosphere.surfacePressureKpa < 0.7);
  assert.equal(c.marsquake.largestRecordedMagnitude, 4.7);
  assert.equal(c.rhu.thermalW, 1);
  assert.equal(c.sabatier.equation, 'CO2 + 4H2 -> CH4 + 2H2O');
});

/* ------------------------------------------------------------------ */
/* Dil bütünlüğü                                                       */
/* ------------------------------------------------------------------ */
const story = readJson('content', 'story.json');
const placeholders = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');

test('story.json: tr ve en birebir aynı anahtarlara sahip', () => {
  const tr = Object.keys(story.tr);
  const en = Object.keys(story.en);
  assert.ok(tr.length > 0, 'tr sözlüğü boş');
  assert.deepEqual(tr.filter((k) => !(k in story.en)), [], 'en sözlüğünde eksik');
  assert.deepEqual(en.filter((k) => !(k in story.tr)), [], 'tr sözlüğünde eksik');
});

test('story.json: boş metin yok ve {yer tutucular} iki dilde aynı', () => {
  const problems = [];
  for (const k of Object.keys(story.tr)) {
    if (!String(story.tr[k]).trim() || !String(story.en[k] || '').trim()) problems.push('boş: ' + k);
    else if (placeholders(story.tr[k]) !== placeholders(story.en[k])) problems.push('yer tutucu: ' + k);
  }
  assert.deepEqual(problems, []);
});

/** Veri kataloglarından türetilen (dinamik) anahtarlar */
function expectedDynamicKeys() {
  const d = readJson('data', 'nasa_data.json');
  const f = readJson('data', 'forensics_cases.json');
  const x = readJson('data', 'experiments_config.json');
  const ev = readJson('data', 'events_catalog.json');
  const keys = [];
  const add = (...k) => keys.push(...k);
  for (const o of d.objectives) add(`obj.${o.id}.name`, `obj.${o.id}.desc`);
  for (const o of d.orbits) add(`orbit.${o.id}.name`);
  for (const s of d.landingSites) add(`site.${s.id}.name`, `site.${s.id}.short`, `site.${s.id}.desc`);
  for (const p of Object.keys(d.habitat.powerSource)) add(`pwr.${p}.name`, `pwr.${p}.desc`);
  for (const i of Object.keys(d.habitat.insulation)) add(`ins.${i}.name`, `ins.${i}.desc`);
  for (const c of Object.keys(d.habitat.comms)) add(`comm.${c}.name`, `comm.${c}.desc`);
  for (const i of d.instruments) add(`inst.${i.id}.name`, `inst.${i.id}.short`, `inst.${i.id}.desc`, `inst.${i.id}.missing`);
  for (const l of ['life_support', 'heating', 'comms', 'greenhouse', 'experiments', 'moxie']) add(`load.${l}`);
  for (const n of [1, 2, 3, 4, 5]) add(`design.tab${n}`);
  for (const t of ['FULL_SUCCESS', 'MIN_SUCCESS', 'PARTIAL', 'FAILED']) add(`tier.${t}`);
  for (const r of ['suit_o2', 'o2_reserve', 'hypothermia', 'radiation', 'morale']) add(`gameover.${r}`, `gameover.${r}.desc`);
  for (const c of ['heating', 'greenhouse_shed', 'greenhouse_off']) add(`gh.cause_${c}`, `log.greenhouse_frozen.cause_${c}`, `chain.gh_lost.effect_${c}`);
  for (const m of ['wires', 'align', 'qte', 'converter']) add(`mg.${m}.title`, `mg.${m}.desc`, `mg.${m}.label`, `mg.${m}.hint`, `cc.minigame.${m}`);
  for (const th of ['sabatier', 'perchlorate', 'moxie']) add(...[1, 2, 3].map((n) => `mg.converter.${th}.s${n}`), `mg.converter.${th}.eq`);
  for (const env of ['habitat', 'surface']) add(`lab.env_${env}`);

  // Adli inceleme
  for (const cat of f.categories) add(`cat.${cat}`);
  for (const e of f.evidenceTypes) {
    add(`ev.${e.id}`, `ev.${e.id}.desc`, `ev.${e.id}.mg_title`, `ev.${e.id}.mg_desc`);
    if (e.instrumentBonus) add(`ev.missing_${e.id}`);
  }
  for (const c of f.cases) {
    add(`case.${c.id}.brief`, `case.${c.id}.finding`, `case.${c.id}.lesson`, `salvage.${c.id}`);
    for (const e of f.evidenceTypes) add(`clue.${c.id}.${e.id}`);
  }

  // Deneyler
  for (const e of x.experiments) {
    add(`exp.${e.id}.name`, `exp.${e.id}.question`, `exp.${e.id}.result`, `exp.${e.id}.reward`, `exp.${e.id}.mg_title`, `exp.${e.id}.mg_desc`);
    for (const h of e.hypotheses) add(`exp.${e.id}.h.${h}`);
    // experiments.js: bu iki deney alet yoksa tamamen engellenir, diğerleri düşük verimle çalışır
    if (e.requiredInstrument && (e.id === 'moxie_night' || e.id === 'sound_speed')) add(`exp.blocked_${e.requiredInstrument}`);
    else if (e.requiredInstrument) add('exp.warn_missing');
  }

  // Kriz kartları
  const fxKeys = new Set();
  for (const c of ev.crises) {
    add(`crisis.${c.id}.title`, `crisis.${c.id}.short`, `crisis.${c.id}.desc`, `crisis.${c.id}.advice`);
    if (c.warnInstrument) add(`warn.${c.id}`);
    for (const o of c.options) {
      add(`crisis.${c.id}.${o.id}.label`, `crisis.${c.id}.${o.id}.sub`, `crisis.${c.id}.${o.id}.res`);
      if (o.minigame) add(`crisis.${c.id}.mg_title`, `crisis.${c.id}.mg_desc`);
      if (o.requires) {
        const [type, what] = Object.entries(o.requires)[0];
        add(`cc.requires.${type}`, `req.${what}`);
      }
      for (const alt of o.alts || []) {
        add(alt.resultKey);
        Object.keys(alt.effects || {}).forEach((k) => fxKeys.add(k));
      }
      Object.keys(o.effects || {}).forEach((k) => fxKeys.add(k));
    }
  }
  for (const k of fxKeys) add(k === 'suitLeak' ? 'fx.fixLeak' : `fx.${k}`);
  return keys;
}

test('story.json: veri kataloglarından türeyen tüm anahtarlar tanımlı (kriz, vaka, deney, alet…)', () => {
  const missing = [...new Set(expectedDynamicKeys())].filter((k) => !(k in story.tr));
  assert.deepEqual(missing, []);
});

/** Kaynak kodundaki sabit anahtar dizgeleri ('ns.key' biçiminde, ardından + gelmeyen) */
function literalKeysInSource() {
  const namespaces = new Set(Object.keys(story.tr).map((k) => k.split('.')[0]));
  const found = new Map();
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) {
        if (name !== 'data') walk(p); // src/data/* build çıktısıdır
        continue;
      }
      if (!name.endsWith('.js')) continue;
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/'([a-z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+)'(\s*\+)?/g)) {
        if (m[2] || m[1].endsWith('_')) continue; // önek birleştirme: 'mg.' + type
        if (!namespaces.has(m[1].split('.')[0])) continue;
        found.set(m[1], path.relative(ROOT, p));
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  return found;
}

test('story.json: kaynak kodda geçen her metin anahtarı tanımlı', () => {
  const missing = [];
  for (const [key, file] of literalKeysInSource()) if (!(key in story.tr)) missing.push(`${key} (${file})`);
  assert.deepEqual(missing, []);
});
