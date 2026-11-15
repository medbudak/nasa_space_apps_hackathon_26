/**
 * SOL 14: RED HORIZON — Merkezi gameState, kayıt/yükleme ve karar günlüğü (K1)
 * Sözleşme #1: Tüm oyun durumu yalnızca burada tutulur. UI okur (getState), eylemler günceller.
 */
(function (S) {
  'use strict';
  const SAVE_KEY = 'sol14_red_horizon_v3';

  const DEFAULT_DESIGN = {
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

  let gameState = null;

  /**
   * D-012 keşif kaydı: kırılan buz, toplanan kalıntı, kazı ilerlemesi (gömülü araçlar, tünel penceresi),
   * mağara bulguları, İZCİ-1 parça fotoğrafları ve bulgu raporları.
   * Kalıcıdır (kayıtla birlikte saklanır): bölgeye gidip gelince yeniden oluşmaz.
   */
  function blankExplore(D) {
    const cfg = D.explore;
    const ice = {};
    for (const c of cfg.ice.clusters) ice[c.id] = { inspected: false, broken: false, photo: null, collected: false, sampled: false };
    const reports = {};
    for (const c of cfg.ice.clusters) if (c.relic) reports['relic_' + c.id] = { queued: false, sent: false, score: 0 };
    reports.cave_survey = { queued: false, sent: false, score: 0 };
    reports.west_lander = { queued: false, sent: false, score: 0 };
    reports.west_probe = { queued: false, sent: false, score: 0 };
    const finds = {};
    for (const f of cfg.cave.finds) finds[f.id] = false;
    const scout = {};
    for (const p of cfg.cave.scout.parts) scout[p.id] = null; // fotoğraf kalitesi (null = çekilmedi)
    const dig = {};
    for (const st of cfg.dig.sites) dig[st.id] = 0; // vuruş sayısı
    return {
      ice,
      reports,
      dig,
      tubeOpen: false,
      minerals: {}, // Kişi 5: maden noktası vuruş sayısı
      mineralsSeen: {}, // bilgi kartı gösterilen mineral türleri
      cave: { finds, scout, storyShown: false, temp: { entrance: null, deep: null }, distance: null, vibration: null, visited: false },
      zonesSeen: {}
    };
  }

  /** Eski kayıtlara (D-012 öncesi) eksik alanları ekler; mevcut ilerlemeye dokunmaz */
  S.ensureExploreState = function (s) {
    if (!s || !S.DATA.explore) return s;
    const blank = blankExplore(S.DATA);
    if (!s.explore) s.explore = blank;
    else {
      for (const k of ['ice', 'reports', 'dig']) {
        s.explore[k] = s.explore[k] || {};
        for (const id of Object.keys(blank[k])) if (!s.explore[k][id]) s.explore[k][id] = blank[k][id];
      }
      if (!s.explore.cave) s.explore.cave = blank.cave;
      for (const id of Object.keys(blank.cave.finds)) if (s.explore.cave.finds[id] === undefined) s.explore.cave.finds[id] = false;
      s.explore.cave.scout = s.explore.cave.scout || {};
      for (const id of Object.keys(blank.cave.scout)) if (s.explore.cave.scout[id] === undefined) s.explore.cave.scout[id] = null;
      // Kazı öncesi kayıtlar: tünele zaten inilmişse pencere açık sayılır
      if (typeof s.explore.tubeOpen !== 'boolean') s.explore.tubeOpen = Boolean(s.explore.cave.visited);
      if (!s.explore.zonesSeen) s.explore.zonesSeen = {};
    }
    if (s.player) {
      if (!s.player.zone) s.player.zone = 'surface';
      if (typeof s.player.cx !== 'number') s.player.cx = 0;
    }
    if (!s.lander) s.lander = { landed: s.sol >= 1 };
    // Kurulum öncesi kayıtlarda tüm yapılar hazırdı
    if (!s.base) s.base = { solar: true, isru: true, greenhouse: true, mav: true, solarFrac: 1 };
    if (typeof s.base.solarFrac !== 'number') s.base.solarFrac = 1;
    if (!s.station && S.Station) s.station = S.Station.blank();
    if (s.inventory && !s.inventory.tools) s.inventory.tools = Object.assign({}, S.DATA.tools.start);
    if (!s.rocket) s.rocket = { damage: {} };
    if (s.inventory && !s.inventory.items) s.inventory.items = {};
    if (s.inventory && !s.inventory.minerals) s.inventory.minerals = {};
    if (s.explore && !s.explore.minerals) s.explore.minerals = {};
    if (s.explore && !s.explore.mineralsSeen) s.explore.mineralsSeen = {};
    return s;
  };

  function createState({ lang = S.lang || 'tr', demoMode = false, design = null, seed = 20261114 } = {}) {
    const D = S.DATA;
    const forensics = {};
    for (const c of D.forensics.cases) {
      forensics[c.id] = {
        discovered: false,
        evidence: { photo: null, telemetry: null, env: null },
        diagnosis: null,
        correct: false,
        queued: false,
        sent: false,
        score: 0,
        salvaged: false
      };
    }
    const experiments = {};
    for (const e of D.experimentsCfg.experiments) {
      experiments[e.id] = {
        done: false,
        hypothesis: null,
        env: e.preferredEnv,
        control: true,
        success: false,
        score: 0,
        queued: false,
        sent: false
      };
    }
    return {
      version: 3,
      lang,
      demoMode,
      seed,
      scene: 'menu',
      sol: 0,
      maxSols: demoMode ? 5 : 14,
      minute: D.gameplay.solStartMinute,
      totalMinutes: 0,
      design: S.util.deepClone(design || DEFAULT_DESIGN),
      totals: null,
      res: {
        energyKwh: 0,
        batteryKwh: 0,
        o2ReserveKg: 0,
        waterL: 0,
        mavFuel: 0,
        foodRations: 0,
        morale: 90,
        radiationMsv: 0,
        panelDust: 0.04,
        habTempC: D.gameplay.habitatTargetC
      },
      // İhtiyaçlar (Kişi 2): 0 = iyi, 100 = kritik. Akıl sağlığı ayrı alan değil, res.morale kullanılır.
      needs: S.util.deepClone(D.gameplay.needs.start),
      suit: {
        o2: 100,
        battery: 100,
        tempC: D.constants.eva.suitNominalC,
        integrity: 100,
        leak: false,
        frozen: false,
        coldMinutes: 0
      },
      player: { x: -40, inside: true, facing: 1, zone: 'surface', cx: 0 },
      explore: blankExplore(D),
      // Üs sistemleri kargo sandıklarında iner; oyuncu kurar (ux-plan #8). Habitat ve iniş aracı hazırdır.
      base: { solar: false, isru: false, greenhouse: false, mav: false, solarFrac: 1 },
      lander: { landed: false },
      loads: [
        { id: 'life_support', on: true, shed: false },
        { id: 'heating', on: true, shed: false },
        { id: 'comms', on: true, shed: false },
        { id: 'greenhouse', on: true, shed: false },
        { id: 'experiments', on: true, shed: false },
        { id: 'moxie', on: true, shed: false }
      ],
      power: { solarW: 0, rtgW: 0, demandW: 0, suppliedW: 0, deficitW: 0 },
      disabledLoads: {},
      greenhouse: { installed: false, frozen: false, frozenSol: null, cause: null, unpoweredMinutes: 0, yieldPct: 100 },
      weather: { stormTau: 0, stormSolsLeft: 0, warnings: [] },
      downlink: { queue: [], passUsedMbit: {}, extraMbit: 0, lossMbit: 0, nextId: 1, paused: false, familySol: 0 },
      forensics,
      experiments,
      rewards: {},
      // items: atölye malzemeleri (kitler, enkaz parçaları) — S.Workshop
      inventory: { repairKits: 0, rhuUnits: 0, spareAntenna: false, roboticArmPart: false, wheelPart: false, items: {}, minerals: {} },
      crisis: { active: null, fired: {}, pending: [] },
      decisionLog: [],
      solHistory: [],
      stats: { maxDistanceM: 0, minutesOutside: 0 },
      ending: null,
      gameOver: null
    };
  }

  S.State = {
    DEFAULT_DESIGN,
    create: createState,
    reset(opts) {
      gameState = createState(opts);
      S.bus.emit('state:changed', gameState);
      return gameState;
    },
    set(state) {
      gameState = state;
    }
  };

  S.getState = () => gameState;

  /** Sözleşme: updateState(patch | fn) */
  S.updateState = function (patch) {
    if (typeof patch === 'function') patch(gameState);
    else if (patch && typeof patch === 'object') Object.assign(gameState, patch);
    S.bus.emit('state:changed', gameState);
    return gameState;
  };

  /**
   * M2 / M5 — Karar günlüğü. Metinler anahtar olarak saklanır ki dil değişince karne de çevrilsin.
   * entry: { category: 'design'|'crisis'|'science'|'system', titleKey, choiceKey, resultKey, vars, cost, score }
   */
  S.logDecision = function (entry, state) {
    const s = state || gameState;
    s.decisionLog.push(
      Object.assign({ sol: s.sol, minute: Math.round(s.minute), category: 'crisis', vars: {}, cost: null, score: 0 }, entry)
    );
  };

  S.saveGame = function () {
    try {
      if (gameState && typeof localStorage !== 'undefined') {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      }
    } catch (e) {
      /* kota / gizli mod — oyun devam eder */
    }
  };

  S.loadGame = function () {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 3 && parsed.sol >= 1 && !parsed.gameOver && !parsed.ending) {
        gameState = S.ensureExploreState(parsed);
        return parsed;
      }
    } catch (e) {
      /* bozuk kayıt */
    }
    return null;
  };

  S.hasSave = function () {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const p = JSON.parse(raw);
      return Boolean(p && p.version === 3 && p.sol >= 1 && !p.gameOver && !p.ending);
    } catch (e) {
      return false;
    }
  };

  /**
   * RIT-10 — Güvenli geri dönüş noktası: her Sol sabahının (iniş + her Sol geçişi) kopyası.
   * Görev kaybında oyuncu o sabaha döner; bellek içinde de tutulur ki Node testlerinde de çalışsın.
   */
  const CHECKPOINT_KEY = 'sol14_red_horizon_v3_checkpoint';
  let checkpointRaw = null;

  S.saveCheckpoint = function (state) {
    const s = state || gameState;
    if (!s || s.sol < 1 || s.gameOver || s.ending) return;
    checkpointRaw = JSON.stringify(s);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CHECKPOINT_KEY, checkpointRaw);
    } catch (e) {
      /* kota — bellek kopyası yeterli */
    }
  };

  S.checkpointInfo = function () {
    try {
      const raw = checkpointRaw || (typeof localStorage !== 'undefined' && localStorage.getItem(CHECKPOINT_KEY));
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p && p.version === 3 && p.sol >= 1 ? { sol: p.sol, raw } : null;
    } catch (e) {
      return null;
    }
  };

  S.loadCheckpoint = function () {
    const info = S.checkpointInfo();
    if (!info) return null;
    gameState = S.ensureExploreState(JSON.parse(info.raw));
    gameState.checkpointRetries = (gameState.checkpointRetries || 0) + 1;
    // "Güvenli" dönüş: Sol sabahı habitatın içinde başla (gece EVA'sında / mağarada kaydedilmiş olsa bile)
    gameState.player.inside = true;
    gameState.player.x = 0;
    gameState.player.zone = 'surface';
    gameState.player.cx = 0;
    gameState.crisis.active = null;
    S.bus.emit('state:changed', gameState);
    return gameState;
  };

  S.clearCheckpoint = function () {
    checkpointRaw = null;
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(CHECKPOINT_KEY);
    } catch (e) {
      /* yok say */
    }
  };

  S.clearSave = function () {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* yok say */
    }
  };
})((window.SOL14 = window.SOL14 || {}));
