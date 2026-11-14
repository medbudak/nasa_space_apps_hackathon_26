/**
 * SOL 14: RED HORIZON — Merkezi Durum Yönetimi (gameState), Event Bus ve Çeviri (K1)
 */

import storyData from './story_data.js';
import { NASA_DATA, calcDesignTotals } from './engineering.js';

const STORAGE_KEY = 'sol14_save_v2';

// Olay Veri Yolu (Event Bus)
const listeners = new Map();

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => this.off(event, fn);
  },
  off(event, fn) {
    if (listeners.has(event)) listeners.get(event).delete(fn);
  },
  emit(event, payload) {
    if (listeners.has(event)) {
      for (const fn of listeners.get(event)) {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[bus error on ${event}]`, err);
        }
      }
    }
  }
};

export function createInitialState({ lang = 'tr', demoMode = false } = {}) {
  const defaultDesign = {
    objectiveFocus: 'balanced',
    rocketId: 'vulcan_centaur',
    orbitType: 'hohmann',
    launchWindowCaught: true,
    landingSiteId: 'jezero',
    powerSource: 'solar_rtg',
    batteryKwh: 40,
    insulation: 'thick',
    instruments: ['mastcam_z', 'meda', 'seis', 'moxie', 'veggie'],
    commArchitecture: 'relay_xband',
    repairKits: 1
  };

  const totals = calcDesignTotals(defaultDesign);

  const forensics = {};
  for (const c of NASA_DATA.forensicsCases) {
    forensics[c.id] = {
      id: c.id,
      discovered: c.id === 'opportunity' || c.id === 'insight',
      evidence: { photo: false, telemetry: false, env: false },
      diagnosis: null,
      queued: false,
      sent: false,
      score: 0,
      salvaged: false
    };
  }

  const experiments = {};
  for (const exp of NASA_DATA.experiments) {
    experiments[exp.id] = {
      id: exp.id,
      hypothesis: exp.correctHypothesis,
      environment: exp.preferredEnv,
      controlGroup: true,
      completed: false,
      queued: false,
      sent: false,
      measuredValue: null,
      score: 0,
      bonusUnlocked: false
    };
  }

  return {
    lang,
    demoMode,
    sol: 0,
    maxSols: demoMode ? 5 : 14,
    phase: 'design', // 'design' | 'transit' | 'surface' | 'ufo' | 'report'
    activeTab: 'surface', // 'surface' | 'map' | 'lab' | 'downlink' | 'power'
    timeOfDay: 'day', // 'day' | 'sunset' | 'night'
    rngSeed: 20261114,
    gameOverReason: null,

    design: defaultDesign,
    budgets: {
      ...totals,
      dataUsedThisSol: 0
    },

    resources: {
      o2: 96,
      energyKwh: 38,
      suitTempC: 18,
      radiationMsv: 14,
      sanity: 95,
      waterLiters: 85,
      mavFuelPct: 90,
      panelDust: 0.08,
      evaDistanceM: 250,
      jointFrozen: false,
      greenhouseFrozen: false
    },

    powerPriorities: [
      { id: 'life_support', labelKey: 'power.life_support', powerW: 220, active: true },
      { id: 'heating', labelKey: 'power.heating', powerW: 120, active: true },
      { id: 'greenhouse', labelKey: 'power.greenhouse', powerW: 100, active: true },
      { id: 'moxie', labelKey: 'power.moxie', powerW: 300, active: true },
      { id: 'experiments', labelKey: 'power.experiments', powerW: 60, active: true },
      { id: 'comms', labelKey: 'power.comms', powerW: 40, active: true }
    ],

    downlinkQueue: [],
    forensics,
    experiments,

    inventory: {
      repairKits: 1,
      rhuUnits: 0,
      spareAntenna: false,
      roboticArmPart: false,
      wheelPart: false,
      perchlorateWashed: false,
      anomalyPhotos: 0
    },

    activeCrisis: null,
    decisionLog: [],

    ufoEnding: {
      triggered: false,
      stage: 1,
      cameraTier: 'high',
      downloadPct: 80
    }
  };
}

let gameState = createInitialState();

export function getState() {
  return gameState;
}

export function updateState(updater) {
  if (typeof updater === 'function') {
    updater(gameState);
  } else if (updater && typeof updater === 'object') {
    Object.assign(gameState, updater);
  }
  saveStateToStorage();
  bus.emit('state:changed', gameState);
  return gameState;
}

export function resetState(options = {}) {
  gameState = createInitialState({
    lang: options.lang || gameState.lang || 'tr',
    demoMode: Boolean(options.demoMode)
  });
  saveStateToStorage();
  bus.emit('state:changed', gameState);
  return gameState;
}

/**
 * Çift dilli (TR / EN) metin çekici: t('anahtar.yolu')
 */
export function t(key, vars = {}) {
  const lang = gameState?.lang || 'tr';
  const dict = storyData[lang] || storyData.tr;
  let raw = dict[key] ?? storyData.tr[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    raw = raw.replaceAll(`{${k}}`, String(v));
  }
  return raw;
}

export function setLanguage(lang) {
  if (lang === 'tr' || lang === 'en') {
    gameState.lang = lang;
    saveStateToStorage();
    bus.emit('state:changed', gameState);
  }
}

export function logDecision({
  sol = gameState.sol,
  category = 'crisis',
  title,
  choice,
  costText = '',
  consequence = '',
  scoreImpact = 0
}) {
  gameState.decisionLog.push({
    sol,
    category,
    title,
    choice,
    costText,
    consequence,
    scoreImpact
  });
}

export function saveStateToStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  } catch {
    // localStorage mevcut değilse (Node test ortamı) sessizce geç
  }
}

export function loadStateFromStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.sol === 'number' && parsed.design && parsed.resources) {
          gameState = parsed;
          bus.emit('state:changed', gameState);
          return true;
        }
      }
    }
  } catch {
    // Bozuk kayıt varsa sıfırla
  }
  return false;
}
