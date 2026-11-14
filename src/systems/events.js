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
//   3) written to decisionLog so the report card can explain the outcome.
//
// Effect types:
//   { type: 'resource', stat: 'batteryWh' | 'o2Kg' | 'radiationMSv', delta }
//   { type: 'wait', sols, estimate: { o2Kg } }   // runs the simulation forward
//   { type: 'flag', key, value }                 // stored in state.events.flags
//
// Text is never written here: titleKey / bodyKey / labelKey are keys in K5's story.json.
// Numbers come from ctx.data.events.<eventId>.

import { val, spendTime } from './survival.js';

/** Event-engine part of gameState. K1 merges it into the central gameState. */
export function createEventState() {
  return { fired: {}, pending: null, flags: {} };
}

/**
 * Check every event once. Call it from the game loop after survival.step().
 * Opens at most one decision card at a time; while a card is open nothing else fires.
 */
export function checkEvents(state, ctx) {
  const ev = state.events;
  if (ev.pending) return null;
  const list = ctx.events ?? EVENTS;

  for (const event of list) {
    if (event.once !== false && ev.fired[event.id]) continue;
    if (!event.trigger(state, ctx)) continue;

    ev.fired[event.id] = { sol: state.time.sol, solFraction: state.time.solFraction };
    event.effect?.(state, ctx);

    if (event.decision) {
      const card = event.decision(state, ctx);
      ev.pending = { eventId: event.id, sol: state.time.sol, card };
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

/**
 * Apply the chosen option of the open card, log it, and close the card.
 * Returns the decisionLog entry.
 */
export function resolveDecision(state, choiceId, ctx) {
  const pending = state.events.pending;
  if (!pending) throw new Error('events: no decision is open');
  const option = pending.card.options.find((o) => o.id === choiceId);
  if (!option) throw new Error(`events: unknown choice "${choiceId}" for ${pending.eventId}`);

  for (const effect of option.effects) applyEffect(state, effect, ctx);

  const entry = { sol: pending.sol, eventId: pending.eventId, choice: choiceId, effects: option.effects };
  (state.decisionLog ??= []).push(entry);
  state.events.pending = null;
  ctx.bus?.emit('decision:made', entry);
  return entry;
}

export function applyEffect(state, effect, ctx) {
  switch (effect.type) {
    case 'resource': {
      if (effect.stat === 'batteryWh') {
        const p = state.power;
        p.batteryWh = clamp(p.batteryWh + effect.delta, 0, p.batteryCapacityWh);
      } else if (effect.stat === 'o2Kg') {
        state.life.o2Kg = Math.max(0, state.life.o2Kg + effect.delta);
      } else if (effect.stat === 'radiationMSv') {
        state.life.radiationMSv = (state.life.radiationMSv ?? 0) + effect.delta;
      } else {
        throw new Error(`events: unknown resource "${effect.stat}"`);
      }
      break;
    }
    case 'wait':
      spendTime(state, effect.sols * val(ctx.data.time.solHours), ctx);
      break;
    case 'flag':
      state.events.flags[effect.key] = effect.value;
      break;
    default:
      throw new Error(`events: unknown effect type "${effect.type}"`);
  }
}

function clamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

function isNight(state, ctx) {
  return ctx.eng.sunCos(state.time.solFraction) === 0;
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
        state.time.sol >= val(cfg.earliestSol) &&
        isNight(state, ctx) &&
        state.env.outsideC <= val(cfg.triggerBelowC)
      );
    },
    effect: (state) => {
      state.events.flags.engineFrozen = true;
    },
    decision: (state, ctx) => {
      const cfg = ctx.data.events.engineFreeze;
      const o2PerSol = val(ctx.data.life.o2KgPerCrewPerSol) * val(ctx.data.life.crew);
      return {
        titleKey: 'event.engineFreeze.title',
        bodyKey: 'event.engineFreeze.body',
        options: [
          {
            // A: heat with the battery; the greenhouse heater is cut tonight.
            id: 'batteryHeat',
            labelKey: 'event.engineFreeze.option.batteryHeat',
            effects: [
              { type: 'resource', stat: 'batteryWh', delta: -val(cfg.batteryHeatWh) },
              { type: 'flag', key: 'greenhouseHeatingCut', value: true },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
          {
            // B: go outside and heat it by hand; radiation and O2 cost.
            id: 'manualHeat',
            labelKey: 'event.engineFreeze.option.manualHeat',
            effects: [
              { type: 'resource', stat: 'o2Kg', delta: -val(cfg.manualO2Kg) },
              { type: 'resource', stat: 'radiationMSv', delta: val(cfg.manualRadiationMSv) },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
          {
            // C: miss the window and wait; costs a sol of consumables.
            id: 'wait',
            labelKey: 'event.engineFreeze.option.wait',
            effects: [
              { type: 'wait', sols: val(cfg.waitSols), estimate: { o2Kg: -o2PerSol * val(cfg.waitSols) } },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
        ],
      };
    },
  },
];
