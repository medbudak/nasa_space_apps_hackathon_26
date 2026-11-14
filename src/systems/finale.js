// finale.js — K2: the last sol's departure sequence and the mission outcome.
//
// On the morning of the last sol (rules.totalSols, at time.startSolFraction):
//   1. antenna   The antenna is knocked out of alignment. A spare kit fixes it at once;
//                otherwise the player re-points it in K3's align mini-game. Failing costs points
//                (lostSystems) but does not stop the launch.
//   2. engine    The ascent vehicle (MAV) will not fire below ascent.mavMinOperatingC.
//                The night before, events.js's engineFreeze card (design doc card 2, set by K1
//                to the last sol) lets the player heat the engine (battery or by hand: flag
//                mavHeated) or wait a sol. Not heated, the MAV fires once the day warms it;
//                the launch window closes at sunset, and still too cold means the crew stays.
//   3. launch    The MAV lifts off.
//
// Outcome (DECISIONS.md D-010: it follows the player's choices, never chance):
//   lost      the crew died (survival.checkLoss)
//   colonist  alive, but the MAV did not launch before the window closed
//   explorer  launched, minimum success (D-006) not reached
//   hero      launched, minimum success reached
//
// State: state.events.finale = { step, antennaOk, kitsUsed } (K2's own sub-object).
// Numbers come from nasa_data.json; points through recordScore (D-009).

import { val, rowVal, designRows, recordScore } from './simData.js';
import { isNight } from './survival.js';
import { missionSuccess } from '../scenes/ending.js';
import { createRng } from '../core/rng.js';

/** True from the morning of the last sol until the sequence has started. */
export function finaleDue(state, { data }) {
  if (state.events.finale || state.life.loss) return false;
  return (
    state.time.sol >= val(data.rules.totalSols, 'rules.totalSols') &&
    state.time.solFraction >= val(data.time.startSolFraction, 'time.startSolFraction')
  );
}

export function startFinale(state) {
  state.events.finale = { step: 'antenna', antennaOk: null, kitsUsed: 0, sawDaylight: false };
  return state.events.finale;
}

/** True while the simulation should stand still (the player is in a mini-game). */
export function finalePaused(state) {
  return state.events.finale?.step === 'antennaGame';
}

/** True once the outcome is set and the scene can move to the report card. */
export function finaleDone(state) {
  return state.events.finale?.step === 'done';
}

/** Spare kits left: the chosen kit option's count minus the kits used. */
export function kitsLeft(state, data) {
  const { spareKits } = designRows(state, data);
  return rowVal(spareKits, 'count', { optional: true }) - (state.events.finale?.kitsUsed ?? 0);
}

/**
 * Advance the sequence. Call every frame from the surface scene while the finale runs.
 * The engine step itself is a decision card in events.js (`mavFrozen`); this function only
 * checks its result and the launch window.
 */
export function updateFinale(state, ctx) {
  const f = state.events.finale;
  if (!f || f.step === 'done' || state.life.loss) return;

  if (f.step === 'antenna') runAntenna(state, ctx);
  if (f.step === 'engine') runEngine(state, ctx);
  if (f.step === 'launch') launch(state, ctx);
}

function runAntenna(state, ctx) {
  const f = state.events.finale;
  const { data, bus } = ctx;

  // A spare kit fixes the antenna on the spot (design doc: each kit solves one crisis).
  if (kitsLeft(state, data) > 0) {
    f.kitsUsed += 1;
    f.antennaOk = true;
    f.step = 'engine';
    state.decisionLog.push({ sol: state.time.sol, eventId: 'finaleAntenna', choice: 'spareKit', effects: [] });
    return;
  }

  const config = antennaConfig(state, data);
  if (!config || !bus) {
    // No mini-game data yet (or no UI): skip the step rather than block the ending.
    console.warn('[finale] antenna mini-game not available: step skipped');
    f.antennaOk = null;
    f.step = 'engine';
    return;
  }

  f.step = 'antennaGame';
  bus.emit('minigame:open', {
    template: 'align',
    config,
    onDone: (result) => antennaDone(state, ctx, result),
  });
}

/** The antenna mini-game finished (K3's onDone: { success, score, timeUsed, detail }). */
export function antennaDone(state, ctx, result) {
  const f = state.events.finale;
  if (!f || f.step !== 'antennaGame') return;
  f.antennaOk = Boolean(result?.success);
  state.decisionLog.push({
    sol: state.time.sol,
    eventId: 'finaleAntenna',
    choice: f.antennaOk ? 'aligned' : 'failed',
    effects: [],
  });
  if (!f.antennaOk) {
    recordScore(state, {
      category: 'lostSystems',
      pointsEntry: ctx.data.rules.antennaLostPoints,
      path: 'rules.antennaLostPoints',
      reason: 'consequence.antennaLost',
      cause: 'design.spareKitsId',
    });
  }
  f.step = 'engine';
}

/** K3's align config for the antenna, from nasa_data.json minigames.antennaAlign; null if missing. */
export function antennaConfig(state, data) {
  const a = data.minigames?.antennaAlign;
  const num = (k) => (typeof a?.[k]?.value === 'number' ? a[k].value : null);
  const cfg = {
    beamWidthDeg: num('beamWidthDeg'),
    successPct: num('successPct'),
    holdSeconds: num('holdSeconds'),
    timeLimitSeconds: num('timeLimitSeconds'),
  };
  if (Object.values(cfg).some((v) => v == null)) return null;
  // Hidden target from the seeded RNG (D-002): the same seed gives the same antenna fault.
  // The dial starts on the opposite side, so the player always has to search for the signal.
  const rng = createRng((state.seed ^ 0x501a14) >>> 0);
  const targetDeg = Math.floor(rng.between(0, 360));
  return {
    mode: 'antenna',
    titleKey: 'finale.antenna.title',
    introKey: 'finale.antenna.intro',
    response: 'beam',
    minDeg: 0,
    maxDeg: 360,
    stepDeg: 1,
    startDeg: (targetDeg + 180) % 360,
    targetDeg,
    ...cfg,
  };
}

function mavWarmEnough(state, data) {
  return state.env.outsideC >= val(data.ascent.mavMinOperatingC, 'ascent.mavMinOperatingC');
}

function runEngine(state, ctx) {
  const f = state.events.finale;
  const flags = state.events.flags;
  const { data } = ctx;

  if (flags.mavHeated || mavWarmEnough(state, data)) {
    f.step = 'launch';
    return;
  }
  // The launch window is the daylight of the last sol: it closes once the Sun, having risen,
  // sets again. Still too cold by then means the crew stays on Mars.
  if (!isNight(state, ctx)) f.sawDaylight = true;
  else if (f.sawDaylight) stayOnMars(state, ctx);
  // Otherwise events.js shows the mavFrozen card (or the player is waiting for warmth).
}

function launch(state, ctx) {
  const f = state.events.finale;
  const success = missionSuccess(state, ctx.data);
  state.outcome = success.level === 'none' ? 'explorer' : 'hero';
  recordScore(state, {
    category: 'survival',
    pointsEntry: ctx.data.rules.launchPoints,
    path: 'rules.launchPoints',
    reason: 'consequence.launched',
  });
  f.step = 'done';
}

/** The launch window closed with the MAV still too cold: the crew stays on Mars. */
export function stayOnMars(state, ctx) {
  const f = state.events.finale ?? startFinale(state);
  state.outcome = 'colonist';
  recordScore(state, {
    category: 'lostSystems',
    pointsEntry: ctx.data.rules.missedLaunchPoints,
    path: 'rules.missedLaunchPoints',
    reason: 'consequence.missedLaunch',
    cause: 'design.siteId',
  });
  f.step = 'done';
}
