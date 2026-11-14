// The one gameState (D-003). K1 owns the schema: ask before adding a field.
// Systems change values. Once a sub-object exists, nobody replaces it, so references held elsewhere stay valid.

const SAVE_KEY = 'sol14.save.v2';

export const SCORE_CATEGORIES = Object.freeze(['forensics', 'experiments', 'survival', 'massMargin', 'lostSystems']);

export function createState(seed = Math.floor(Math.random() * 2 ** 32)) {
  return {
    version: 2,
    seed,
    scene: 'title',
    // Sol 0 choices, written by K3's design screen. Every id is a row id in nasa_data.json.
    design: {
      objectiveId: null,
      rocketId: null,
      trajectoryId: null,
      siteId: null,
      powerId: null,
      batteryId: null,
      insulationId: null,
      instrumentIds: [], // at most rules.maxInstruments
      commsId: null,
      spareKitsId: null,
    },
    designSummary: null, // evaluateDesign() result at launch: { cost, mass, capacity, nightNeedKWh, ... }
    // Surface simulation, filled by K2 at landing (createSurvivalState / createEventState):
    time: null, // { sol, solFraction }
    power: null, // { batteryWh, batteryCapacityWh, generationW, loadW, deficitW, dust }
    env: null, // { outsideC, insideC }
    life: null, // { o2Kg, radiationMSv, ... }
    events: null, // { fired, pending, flags }
    inventory: { scrap: 0, ice: 0, fertilizer: 0, rhu: 0, roverParts: [] },
    decisionLog: [], // { sol, eventId, choice, effects: [...] }
    dataBudget: { perSol: 0, used: 0, queue: [] }, // queue items: { type, id, mbit, points }
    forensics: {}, // wreckId -> { clues: [], diagnosis: null, sent: false, points: 0 }
    experiments: {}, // experimentId -> { hypothesis: null, measured: null, success: false, sent: false }
    flags: { anomalyPhotos: 0, cameraTier: 'hand' }, // cameraTier: 'hand' | 'hires'
    score: { total: 0, entries: [] }, // entries: { sol, category, points, reason, cause }
    stats: { energyUsedKWh: 0, oxygenProducedKg: 0, dataSentMbit: 0, solsSurvived: 0 }, // for the report card
    lostSystems: [],
    outcome: null, // set by K2's final sequence: 'hero' | 'colonist' | 'explorer' | 'lost'
  };
}

let state = createState();

export function getState() {
  return state;
}

export function newGame(seed) {
  state = createState(seed);
  return state;
}

const currentSol = () => state.time?.sol ?? 0;

/** Append a crisis choice to the decision log. The report card reads these entries. */
export function logDecision({ eventId, choice, effects = [] }) {
  const entry = { sol: currentSol(), eventId, choice, effects };
  state.decisionLog.push(entry);
  return entry;
}

/**
 * The only way to change the score, so the report card can explain every point.
 * reason: story.json key for what happened, e.g. 'consequence.greenhouseFroze'.
 * cause (optional): the choice that led to it, so the report card can link them:
 *   a design field, e.g. 'design.batteryId', or a crisis choice, 'decision.<eventId>'.
 */
export function addScore(category, points, reason, cause = null) {
  if (!SCORE_CATEGORIES.includes(category)) {
    console.warn(`[state] unknown score category "${category}". Use one of: ${SCORE_CATEGORIES.join(', ')}`);
  }
  state.score.entries.push({ sol: currentSol(), category, points, reason, cause });
  state.score.total += points;
}

export function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // private window or blocked storage: the game still runs, it just can't resume
  }
}

/** Load the saved run. Returns null when there is none or it is from an older schema. */
export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || saved.version !== createState().version) return null;
    state = saved;
    return state;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // nothing to clear
  }
}
