// sanity.js — K2: the astronaut's mental state (loneliness, stress) and false alarms.
//
// state.life.sanity, 0..100 (K3's HUD bar reads it; 0 is a loss, survival.checkLoss).
// Per game hour it drifts down from isolation; faster in the cold and in the dark (habitat
// unpowered); a working greenhouse slowly brings it back (plant care), and a family message from
// Earth lifts it at once. The design doc bases this on the Mars-500 and HI-SEAS isolation studies;
// those studies give no point scale, so every rate is a game value (nasa_data.json `sanity`, D-009).
//
// Below sanity.falseAlarmBelow, false alarms start (design doc: "fake alarm"). One is announced
// on the bus as D-003's `hallucination` event, agreed with K3 (alarm UI) and K4 (effect):
//   { kind: 'falseAlarm', alarm: 'o2Leak' | 'powerFail' | 'radiation', intensity, alpha, sanity }
// and ends with { kind: 'end', alpha: 0, intensity: 0 }. The player can check a suspicious alarm
// against the real reading in K3's telemetry. Rolls use the seeded RNG (D-002).

import { val } from './simData.js';
import { isOn } from './power.js';
import { createRng } from '../core/rng.js';

export const FALSE_ALARMS = Object.freeze(['o2Leak', 'powerFail', 'radiation']);

/** True if this run has the sanity model (its data is in nasa_data.json). */
function enabled(data) {
  return Boolean(data.sanity);
}

/** Fill life.sanity at landing. Without sanity data the model stays off (no bar, no loss). */
export function createSanityState(state, data) {
  if (!enabled(data)) return state;
  state.life.sanity = val(data.sanity.start, 'sanity.start');
  state.life.hallucination = null; // { alarm, untilT } while a false alarm is on screen
  state.life.sanityRolls = 0;
  return state;
}

const nowT = (state) => state.time.sol + state.time.solFraction;

/** Next number from the run's seeded RNG; the roll counter keeps the sequence going across saves. */
function roll(state) {
  state.life.sanityRolls = (state.life.sanityRolls ?? 0) + 1;
  return createRng((state.seed + Math.imul(0x9e3779b1, state.life.sanityRolls)) >>> 0)();
}

/**
 * One simulation step of dtHours game hours. Called by survival.advanceHours().
 * daylight: the Sun is up (a greenhouse only helps while its plants get light).
 */
export function updateSanity(state, dtHours, ctx, { daylight }) {
  const { data, bus } = ctx;
  const life = state.life;
  if (!enabled(data) || typeof life.sanity !== 'number') return;
  const s = data.sanity;

  let rate = -val(s.drainPerHour, 'sanity.drainPerHour');
  if (life.body.cold) rate -= val(s.coldDrainPerHour, 'sanity.coldDrainPerHour');
  if (state.power.deficitW > 0) rate -= val(s.darkDrainPerHour, 'sanity.darkDrainPerHour');
  const greenhouseWorks = (state.design.instrumentIds ?? []).includes('plantChamber')
    && isOn(state, 'greenhouse') && daylight && !life.greenhouse?.dead;
  if (greenhouseWorks) rate += val(s.greenhouseGainPerHour, 'sanity.greenhouseGainPerHour');
  setSanity(state, life.sanity + rate * dtHours);

  // A false alarm on screen ends after its time.
  if (life.hallucination && nowT(state) >= life.hallucination.untilT) {
    life.hallucination = null;
    bus?.emit('hallucination', { kind: 'end', alpha: 0, intensity: 0, sanity: Math.round(life.sanity) });
  }

  // Low sanity: a chance of a false alarm, spread evenly over time (per-hour chance -> per step).
  const below = val(s.falseAlarmBelow, 'sanity.falseAlarmBelow');
  if (!life.hallucination && life.sanity < below) {
    const perHour = val(s.falseAlarmPerHour, 'sanity.falseAlarmPerHour');
    const chance = 1 - (1 - perHour) ** dtHours;
    if (roll(state) < chance) startFalseAlarm(state, ctx, below);
  }
}

function startFalseAlarm(state, ctx, below) {
  const { data, bus } = ctx;
  const life = state.life;
  const alarm = FALSE_ALARMS[Math.floor(roll(state) * FALSE_ALARMS.length)];
  // Stronger the further below the line: 0 at the line, 1 at sanity 0.
  const intensity = Math.min(1, Math.max(0, (below - life.sanity) / below));
  const hours = val(data.sanity.falseAlarmHours, 'sanity.falseAlarmHours');
  life.hallucination = { alarm, untilT: nowT(state) + hours / val(data.mars.solHours, 'mars.solHours') };
  bus?.emit('hallucination', { kind: 'falseAlarm', alarm, intensity, alpha: intensity, sanity: Math.round(life.sanity) });
  state.decisionLog.push({ sol: state.time.sol, eventId: 'falseAlarm', choice: null, effects: [{ type: 'estimate', alarm }] });
}

function setSanity(state, value) {
  state.life.sanity = Math.min(100, Math.max(0, value));
}

/**
 * The player answered an alarm on K3's alarm band (hud.js onAlarmResolve):
 *   { id, stat, fake, answer: 'fake' | 'real', verified, correct }
 * Seeing through a false alarm steadies the astronaut (sanity.alarmSeenThroughGain); running an
 * emergency procedure for a false alarm costs nerves (sanity.alarmBelievedLoss). Real alarms are
 * only logged here. Every answer goes in the decision log, with whether the reading was checked.
 */
export function resolveAlarm(state, ctx, result) {
  const { data } = ctx;
  if (!result) return;
  if (enabled(data) && typeof state.life.sanity === 'number' && result.fake) {
    const delta = result.correct
      ? val(data.sanity.alarmSeenThroughGain, 'sanity.alarmSeenThroughGain')
      : -val(data.sanity.alarmBelievedLoss, 'sanity.alarmBelievedLoss');
    setSanity(state, state.life.sanity + delta);
  }
  state.decisionLog.push({
    sol: state.time.sol,
    eventId: result.fake ? 'falseAlarm' : 'alarm',
    choice: result.answer ?? null,
    effects: [{ type: 'estimate', correct: Boolean(result.correct), verified: Boolean(result.verified) }],
  });
}

/**
 * A packet reached Earth (K3's downlink:sent). A family message coming back lifts sanity.
 * surface.js forwards downlink:sent here.
 */
export function onDownlinkSent(state, ctx, packet) {
  if (!enabled(ctx.data) || packet?.type !== 'family' || typeof state.life.sanity !== 'number') return;
  setSanity(state, state.life.sanity + val(ctx.data.sanity.familyMessageGain, 'sanity.familyMessageGain'));
  state.decisionLog.push({ sol: state.time.sol, eventId: 'familyMessage', choice: null, effects: [] });
}
