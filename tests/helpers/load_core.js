/**
 * Çekirdek oyun modüllerini (DOM'suz) bir vm bağlamında yükler.
 * Tarayıcıdaki <script> sırasının aynısını kullanır; böylece testler gerçek oyun kodunu çalıştırır.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');

const CORE_SCRIPTS = [
  'src/core/base.js',
  'src/core/engineering.js',
  'src/core/state.js',
  'src/core/sim.js',
  'src/core/events.js',
  'src/core/score.js',
  'src/systems/forensics.js',
  'src/systems/experiments.js',
  'src/systems/explore.js',
  'src/core/objectives.js',
  'src/core/surface.js',
  'src/fx/lander.js',
  'src/fx/opening.js'
];

function readJson(...p) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, ...p), 'utf8'));
}

function loadCore({ lang = 'tr' } = {}) {
  const context = { console, Math, JSON, Date };
  context.window = context;
  vm.createContext(context);
  const data = readJson('data', 'nasa_data.json');
  data.forensics = readJson('data', 'forensics_cases.json');
  data.experimentsCfg = readJson('data', 'experiments_config.json');
  data.events = readJson('data', 'events_catalog.json');
  data.explore = readJson('data', 'explore_config.json');
  context.SOL14 = { DATA: data, STORY: readJson('content', 'story.json') };
  for (const rel of CORE_SCRIPTS) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }
  context.SOL14.lang = lang;
  return context.SOL14;
}

module.exports = { loadCore, readJson, ROOT, CORE_SCRIPTS };
