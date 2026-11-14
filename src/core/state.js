// The one gameState (D-003). K1 owns the schema: ask before adding a field.
// Systems change values; nobody replaces whole sub-objects, so references held elsewhere stay valid.

const SAVE_KEY = 'sol14.save.v1';

export const SCORE_CATEGORIES = Object.freeze(['forensics', 'experiments', 'survival', 'massMargin', 'lostSystems']);

export function createState(seed = Math.floor(Math.random() * 2 ** 32)) {
  return {
    version: 1,
    seed,
    scene: 'title',
    sol: 0,
    timeOfSol: 0, // 0..1 within the current sol
    design: {
      objective: null, // 'forensics' | 'experiments' | 'balanced'
      rocketId: null,
      trajectoryId: null,
      landingSiteId: null,
      power: { solarArea_m2: 0, rtg: false, battery_kWh: 0 },
      insulation: null, // 'thin' | 'thick'
      instruments: [], // instrument ids from nasa_data.json, at most tuning.maxInstruments
      comms: null, // 'relay' | 'relayDte'
      spareKits: 0,
      totalMass_kg: 0,
      totalCost_musd: 0,
    },
    resources: {
      fuel_kms: 0, // Δv left for the return, km/s
      oxygen_kg: 0,
      energy_kWh: 0,
      water_kg: 0,
      food_kg: 0,
      heat: 100, // body heat / joint condition, 0..100
      sanity: 100, // 0..100
      radiation_mSv: 0, // cumulative dose
    },
    inventory: { scrap: 0, ice: 0, fertilizer: 0, rhu: 0, roverParts: [] },
    decisionLog: [], // { sol, eventId, choice, effects: [...] }
    dataBudget: { perSol: 0, used: 0, queue: [] }, // queue items: { type, id, mbit, points }
    forensics: {}, // wreckId -> { clues: [], diagnosis: null, sent: false, points: 0 }
    experiments: {}, // experimentId -> { hypothesis: null, measured: null, success: false, sent: false }
    flags: { anomalyPhotos: 0, cameraTier: 'hand' }, // cameraTier: 'hand' | 'hires'
    score: { total: 0, entries: [] }, // entries: { sol, category, points, reason, cause }
    stats: { energyUsed_kWh: 0, oxygenProduced_kg: 0, dataSent_Mbit: 0, solsSurvived: 0 }, // for the report card
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

/** Append a crisis choice to the decision log. The report card reads these entries. */
export function logDecision({ eventId, choice, effects = [] }) {
  const entry = { sol: state.sol, eventId, choice, effects };
  state.decisionLog.push(entry);
  return entry;
}

/**
 * The only way to change the score, so the report card can explain every point.
 * reason: story.json key for what happened, e.g. 'consequence.greenhouseFroze'.
 * cause (optional): the choice that led to it, so the report card can link them:
 *   a design field, e.g. 'design.power.battery_kWh', or a crisis choice, 'decision.<eventId>'.
 */
export function addScore(category, points, reason, cause = null) {
  if (!SCORE_CATEGORIES.includes(category)) {
    console.warn(`[state] unknown score category "${category}". Use one of: ${SCORE_CATEGORIES.join(', ')}`);
  }
  state.score.entries.push({ sol: state.sol, category, points, reason, cause });
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
