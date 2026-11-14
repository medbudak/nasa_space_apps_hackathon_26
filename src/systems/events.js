// events.js — K2: event engine and decision-card logic (M2).
//
// Event shape (D-003): { id, once?, trigger(state, ctx), effect?(state, ctx), decision?(state, ctx) }
//   trigger   -> true when the event should fire now
//   effect    -> applied immediately when it fires (optional)
//   decision  -> returns a card { titleKey, bodyKey, options[] } (optional)
//
// A card option is { id, labelKey, effects[] }. The same effects[] list is
//   1) shown to the player before choosing (every cost is visible up front),
//   2) applied when chosen,
//   3) written to state.decisionLog so the report card can explain the outcome.
//
// Effect types:
//   { type: 'resource', stat: 'energy_kWh' | 'oxygen_kg' | 'radiation_mSv', delta }  // state.resources
//   { type: 'wait', sols, estimate: { oxygen_kg } }   // runs the simulation forward
//   { type: 'flag', key, value }                      // state.sim.events.flags
//
// The decision:open payload is K2's proposal and still has to be agreed with K3.
// Text is never written here: titleKey / bodyKey / labelKey are keys in K5's story.json.
// Numbers come from ctx.data.events.<eventId>.

import { val } from './simData.js';
import { spendTime } from './survival.js';

/** Create the event-engine state under state.sim. Call after initSurvival(). */
export function initEvents(state) {
  state.sim.events = { fired: {}, pending: null, flags: {} };
  return state;
}

/**
 * Check every event once. Call it from the game loop after survival.step().
 * Opens at most one decision card at a time; while a card is open nothing else fires.
 * Returns the id of the event that opened a card, or null.
 */
export function checkEvents(state, ctx) {
  const ev = state.sim.events;
  if (ev.pending) return null;

  for (const event of ctx.events ?? EVENTS) {
    if (event.once !== false && ev.fired[event.id]) continue;
    if (!event.trigger(state, ctx)) continue;

    ev.fired[event.id] = { sol: state.sol, timeOfSol: state.timeOfSol };
    event.effect?.(state, ctx);

    if (event.decision) {
      const card = event.decision(state, ctx);
      ev.pending = { eventId: event.id, sol: state.sol, card };
      ctx.bus?.emit('decision:open', {
        eventId: event.id,
        ...card,
        choose: (choiceId) => resolveDecision(state, choiceId, ctx),
      });
      return event.id;
    }
  }
  return null;
}

/** Apply the chosen option of the open card, log it, and close the card. Returns the log entry. */
export function resolveDecision(state, choiceId, ctx) {
  const pending = state.sim.events.pending;
  if (!pending) throw new Error('events: no decision is open');
  const option = pending.card.options.find((o) => o.id === choiceId);
  if (!option) throw new Error(`events: unknown choice "${choiceId}" for ${pending.eventId}`);

  for (const effect of option.effects) applyEffect(state, effect, ctx);

  // Same shape as K1's logDecision(); pushed here so it lands in the state passed in.
  const entry = { sol: pending.sol, eventId: pending.eventId, choice: choiceId, effects: option.effects };
  state.decisionLog.push(entry);
  state.sim.events.pending = null;
  ctx.bus?.emit('decision:made', entry);
  return entry;
}

const RESOURCE_STATS = new Set(['energy_kWh', 'oxygen_kg', 'radiation_mSv']);

export function applyEffect(state, effect, ctx) {
  switch (effect.type) {
    case 'resource': {
      if (!RESOURCE_STATS.has(effect.stat)) throw new Error(`events: unknown resource "${effect.stat}"`);
      const res = state.resources;
      let next = Math.max(0, res[effect.stat] + effect.delta);
      if (effect.stat === 'energy_kWh') next = Math.min(next, state.design.power.battery_kWh);
      res[effect.stat] = next;
      break;
    }
    case 'wait':
      spendTime(state, effect.sols * val(ctx.data.mars.solLength), ctx);
      break;
    case 'flag':
      state.sim.events.flags[effect.key] = effect.value;
      break;
    default:
      throw new Error(`events: unknown effect type "${effect.type}"`);
  }
}

function isNight(state, ctx) {
  return ctx.eng.sunCosZenith(state.timeOfSol) === 0;
}

// ---------------------------------------------------------------------------
// Event catalogue. More crises (storm, quake, SPE, conjunction, dust devil,
// radiator failure) are added here in S10–14.

export const EVENTS = [
  {
    // Design doc, operations card 2: "Engine froze overnight, morning departure window".
    id: 'engineFreeze',
    trigger: (state, ctx) => {
      const cfg = ctx.data.events.engineFreeze;
      return (
        state.sol >= val(cfg.earliestSol) &&
        isNight(state, ctx) &&
        state.sim.outside_C <= val(cfg.triggerBelow_C)
      );
    },
    effect: (state) => {
      state.sim.events.flags.engineFrozen = true;
    },
    decision: (state, ctx) => {
      const cfg = ctx.data.events.engineFreeze;
      const o2PerSol = val(ctx.data.life.oxygenPerCrewPerSol_kg) * val(ctx.data.life.crew);
      return {
        titleKey: 'event.engineFreeze.title',
        bodyKey: 'event.engineFreeze.body',
        options: [
          {
            // A: heat with the battery; the greenhouse heater is cut tonight.
            id: 'batteryHeat',
            labelKey: 'event.engineFreeze.option.batteryHeat',
            effects: [
              { type: 'resource', stat: 'energy_kWh', delta: -val(cfg.batteryHeat_kWh) },
              { type: 'flag', key: 'greenhouseHeatingCut', value: true },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
          {
            // B: go outside and heat it by hand; O2 and radiation cost.
            id: 'manualHeat',
            labelKey: 'event.engineFreeze.option.manualHeat',
            effects: [
              { type: 'resource', stat: 'oxygen_kg', delta: -val(cfg.manualOxygen_kg) },
              { type: 'resource', stat: 'radiation_mSv', delta: val(cfg.manualRadiation_mSv) },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
          {
            // C: miss the window and wait; costs a sol of consumables.
            id: 'wait',
            labelKey: 'event.engineFreeze.option.wait',
            effects: [
              { type: 'wait', sols: val(cfg.waitSols), estimate: { oxygen_kg: -o2PerSol * val(cfg.waitSols) } },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
        ],
      };
    },
  },
];
