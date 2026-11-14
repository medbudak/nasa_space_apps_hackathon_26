// events.js — K2: event engine and decision-card logic (M2).
//
// Event shape (D-003): { id, once?, trigger(state, ctx), effect?(state, ctx), decision?(state, ctx) }
//   trigger   -> true when the event should fire now
//   effect    -> applied immediately when it fires (optional)
//   decision  -> returns a card (optional)
//
// A card is { titleKey, bodyKey, vars?, options[] }; vars fills {name} slots in the texts.
// A card option is { id, labelKey, effects[], disabled?, disabledKey? }. The same effects[] list is
//   1) shown to the player before choosing (every cost is visible up front),
//   2) applied when chosen,
//   3) written to state.decisionLog so the report card can explain the outcome.
//
// Effect types:
//   { type: 'resource', stat: 'batteryWh' | 'o2Kg' | 'radiationMSv', delta }
//                         // batteryWh -> state.power, o2Kg and radiationMSv -> state.life
//   { type: 'wait', sols, hours?, estimate: {...} }  // runs the simulation forward; sols is
//                                                     // always set (for display), hours wins if given
//   { type: 'flag', key, value }                      // state.events.flags
//   { type: 'eva', set: { speedFactor, jointsFrozen, thawed } } // changes state.life.eva
//   { type: 'hold', load, untilT, estimate: { savedW } } // keep a load off until game time T
//   { type: 'estimate', ...numbers }                  // shown on the card only, applies nothing
//
// decision:open payload (agreed with K3's src/ui/decisionCard.js):
//   { eventId, sol, titleKey, bodyKey, vars, options[], unavailable[], choose(choiceId) }
// Disabled options are left out of options[] and listed in unavailable[] ({ id, labelKey, disabledKey }).
//
// Text is never written here: the keys are in K5's content/story.json.
// Numbers come from nasa_data.json (events.<eventId>, life, rules, ...).

import { val, rowVal, designRows } from './simData.js';
import { spendTime, isNight } from './survival.js';
import { holdLoad, instrumentWatts } from './power.js';

/**
 * Create state.events. Call after createSurvivalState().
 *   active{}  crises still going on: { storm: { untilT }, conjunction: { untilT, perSol } }
 *   finale    see finale.js
 */
export function createEventState(state) {
  state.events = { fired: {}, pending: null, flags: {}, active: {}, finale: null };
  return state;
}

const nowT = (state) => state.time.sol + state.time.solFraction;

/**
 * True while a scheduled event's moment has come: on its sol at its time of sol, or any later
 * sol (so a long wait cannot skip it). An event with no schedule in nasa_data.json yet never
 * comes, instead of stopping the game.
 */
function due(state, cfg, path) {
  if (!cfg) return false;
  const sol = val(cfg.sol, `${path}.sol`);
  const at = val(cfg.atSolFraction, `${path}.atSolFraction`);
  return state.time.sol > sol || (state.time.sol === sol && state.time.solFraction >= at);
}

const hasInstrument = (state, id) => (state.design.instrumentIds ?? []).includes(id);

/**
 * A crisis that needs no choice still goes in the decision log (choice null), so the report
 * card's timeline shows that it happened and what it did.
 */
function logEvent(state, eventId, effects = []) {
  state.decisionLog.push({ sol: state.time.sol, eventId, choice: null, effects });
}

/** End the crises whose time is up (called before the triggers on every check). */
function endExpired(state, ctx) {
  const active = (state.events.active ??= {});
  const T = nowT(state);
  if (active.storm && T >= active.storm.untilT) {
    // The dust in the air settles, but some stays on the panels until wind cleans them.
    state.power.dust = val(ctx.data.events.storm.residualDust, 'events.storm.residualDust');
    delete active.storm;
    ctx.bus?.emit('storm', { intensity: 0 });
    logEvent(state, 'stormEnd', [{ type: 'estimate', dust: state.power.dust }]);
  }
  if (active.conjunction && T >= active.conjunction.untilT) {
    state.dataBudget.perSol = active.conjunction.perSol;
    delete active.conjunction;
    logEvent(state, 'conjunctionEnd');
  }
}

/** True while no data can reach Earth (solar conjunction): relay passes send nothing. */
export function commsBlackout(state) {
  return Boolean(state.events?.active?.conjunction);
}

/**
 * Check every event once. Call it from the game loop after survival.step().
 * Opens at most one decision card at a time; while a card is open nothing else fires.
 * Returns the id of the event that opened a card, or null.
 */
export function checkEvents(state, ctx) {
  const ev = state.events;
  if (ev.pending || state.life.loss) return null;
  endExpired(state, ctx);

  for (const event of ctx.events ?? EVENTS) {
    if (event.once !== false && ev.fired[event.id]) continue;
    if (!event.trigger(state, ctx)) continue;

    ev.fired[event.id] = { sol: state.time.sol, solFraction: state.time.solFraction };
    event.effect?.(state, ctx);

    // decision() may return null: this time the event needs no choice (e.g. the storm was announced).
    const card = event.decision?.(state, ctx);
    if (card) {
      ev.pending = { eventId: event.id, sol: state.time.sol, card };
      ctx.bus?.emit('decision:open', cardPayload(state, event.id, card, ctx));
      return event.id;
    }
  }
  return null;
}

/**
 * Show the open card again (after a page reload: the saved state keeps the card,
 * but the UI and the choose() function are gone). Returns true if a card was reopened.
 */
export function reopenPending(state, ctx) {
  const pending = state.events?.pending;
  if (!pending) return false;
  ctx.bus?.emit('decision:open', cardPayload(state, pending.eventId, pending.card, ctx));
  return true;
}

/**
 * What the UI receives with decision:open.
 * Disabled options are left out of `options` so a UI that cannot grey them out never offers
 * a choice that would be refused; they are listed in `unavailable` for a UI that can show why.
 */
function cardPayload(state, eventId, card, ctx) {
  return {
    eventId,
    sol: state.time.sol,
    ...card,
    options: card.options.filter((o) => !o.disabled),
    unavailable: card.options
      .filter((o) => o.disabled)
      .map(({ id, labelKey, disabledKey }) => ({ id, labelKey, disabledKey })),
    choose: (choiceId) => resolveDecision(state, choiceId, ctx),
  };
}

/** Apply the chosen option of the open card, log it, and close the card. Returns the log entry. */
export function resolveDecision(state, choiceId, ctx) {
  const pending = state.events.pending;
  if (!pending) throw new Error('events: no decision is open');
  const option = pending.card.options.find((o) => o.id === choiceId);
  if (!option) throw new Error(`events: unknown choice "${choiceId}" for ${pending.eventId}`);
  if (option.disabled) throw new Error(`events: choice "${choiceId}" is not available right now`);

  for (const effect of option.effects) applyEffect(state, effect, ctx);

  // Same shape as K1's logDecision(); pushed here so it lands in the state passed in.
  const entry = { sol: pending.sol, eventId: pending.eventId, choice: choiceId, effects: option.effects };
  state.decisionLog.push(entry);
  state.events.pending = null;
  ctx.bus?.emit('decision:made', entry);
  return entry;
}

export function applyEffect(state, effect, ctx) {
  switch (effect.type) {
    case 'resource':
      if (effect.stat === 'batteryWh') {
        const p = state.power;
        p.batteryWh = Math.min(Math.max(0, p.batteryWh + effect.delta), p.batteryCapacityWh);
      } else if (effect.stat === 'o2Kg' || effect.stat === 'radiationMSv') {
        state.life[effect.stat] = Math.max(0, state.life[effect.stat] + effect.delta);
      } else {
        throw new Error(`events: unknown resource "${effect.stat}"`);
      }
      break;
    case 'wait': {
      const hours = effect.hours ?? effect.sols * val(ctx.data.mars.solHours, 'mars.solHours');
      spendTime(state, hours, ctx);
      break;
    }
    case 'flag':
      state.events.flags[effect.key] = effect.value;
      break;
    case 'eva':
      Object.assign(state.life.eva, effect.set);
      break;
    case 'hold':
      // Keep a load switched off until game time untilT (power.js); shown with its estimated saving.
      holdLoad(state, effect.load, effect.untilT);
      break;
    case 'estimate':
      break; // display only
    default:
      throw new Error(`events: unknown effect type "${effect.type}"`);
  }
}

// ---------------------------------------------------------------------------
// Dust storm (design doc: crisis card 3 "panel output down 80% in the storm").
// Dust in the air cuts the panels (power.dust = events.storm.dustLoss) for durationSols; after it,
// residualDust stays on the panels until a dust devil cleans them. The card lets the player keep
// one load off for the whole storm. With MEDA (weather station) the card comes warnSols early,
// so the battery is saved before the storm; without it the storm arrives unannounced.

function stormWindow(state, data) {
  const cfg = data.events.storm;
  const start = val(cfg.sol, 'events.storm.sol') + val(cfg.atSolFraction, 'events.storm.atSolFraction');
  const end = start + val(cfg.durationSols, 'events.storm.durationSols');
  return { start, end: state.events.active?.storm?.untilT ?? end };
}

function stormCard(state, ctx, { warning }) {
  const { data } = ctx;
  const { start, end } = stormWindow(state, data);
  const untilT = Math.max(end, nowT(state));
  const hold = (id, load) => {
    const savedW = instrumentWatts(state, data, load);
    return {
      id,
      labelKey: `event.storm.option.${id}`,
      disabled: savedW === 0,
      disabledKey: 'event.storm.option.notInstalled',
      effects: [{ type: 'hold', load, untilT, estimate: { savedW } }],
    };
  };
  return {
    titleKey: warning ? 'event.stormWarning.title' : 'event.storm.title',
    bodyKey: warning ? 'event.stormWarning.body' : 'event.storm.body',
    vars: {
      dustLossPct: Math.round(val(data.events.storm.dustLoss, 'events.storm.dustLoss') * 100),
      inHours: Math.max(0, Math.round((start - nowT(state)) * val(data.mars.solHours, 'mars.solHours'))),
      lastsSols: val(data.events.storm.durationSols, 'events.storm.durationSols'),
    },
    options: [
      hold('holdGreenhouse', 'greenhouse'),
      hold('holdExperiments', 'experiments'),
      hold('holdMoxie', 'moxie'),
      { id: 'keepAll', labelKey: 'event.storm.option.keepAll', effects: [] },
    ],
  };
}

// ---------------------------------------------------------------------------
// Event catalogue, in priority order: when two events trigger in the same step,
// the earlier one opens its card first (life-threatening ones on top).
// Still to come: quake (SEIS), solar particle event (RAD), radiator failure.

export const EVENTS = [
  {
    // Design doc M4 / operations card 1: "Joints froze outside, speed 40%, O2 31%, habitat 900 m".
    // Opens when suit O2 drops below the O2 needed to walk back (with the safety factor).
    id: 'noReturn',
    once: false, // can happen on any EVA; eva.cardShown limits it to once per EVA
    trigger: (state) => {
      const eva = state.life.eva;
      return eva.outside && eva.noReturn && !eva.cardShown;
    },
    effect: (state) => {
      state.life.eva.cardShown = true;
    },
    decision: (state, ctx) => {
      const { data } = ctx;
      const eva = state.life.eva;
      const cfg = data.events.noReturn;
      const safety = val(data.rules.noReturnSafetyFactor, 'rules.noReturnSafetyFactor');
      const o2PerHour = val(data.life.evaO2KgPerHour, 'life.evaO2KgPerHour');
      // Without the safety factor: the bare O2 the walk takes at the current speed.
      const bareNeedKg = eva.requiredO2Kg / safety;
      // At normal speed (after thawing the joints).
      const thawedNeedKg = eva.requiredO2Kg * eva.speedFactor;
      const shelterHours = val(cfg.shelterHours, 'events.noReturn.shelterHours');

      return {
        titleKey: 'event.noReturn.title',
        bodyKey: 'event.noReturn.body',
        vars: {
          suitO2Kg: round2(eva.suitO2Kg),
          requiredO2Kg: round2(eva.requiredO2Kg),
          distanceM: Math.round(eva.distanceM),
          speedPct: Math.round(eva.speedFactor * 100),
        },
        options: [
          {
            // A: walk back slowly. Only possible if the O2 covers the walk without the safety margin.
            id: 'slowWalk',
            labelKey: 'event.noReturn.option.slowWalk',
            disabled: eva.suitO2Kg < bareNeedKg,
            disabledKey: 'event.noReturn.option.slowWalk.disabled',
            effects: [
              { type: 'estimate', suitO2Kg: -round2(bareNeedKg), safetyMarginLeft: false },
              { type: 'flag', key: 'walkedWithoutMargin', value: true },
            ],
          },
          {
            // B: suit heater: speed comes back; recharging the suit afterwards costs habitat energy.
            id: 'suitHeater',
            labelKey: 'event.noReturn.option.suitHeater',
            effects: [
              { type: 'eva', set: { speedFactor: 1, jointsFrozen: false, thawed: true } },
              { type: 'resource', stat: 'batteryWh', delta: -val(cfg.suitHeaterKWh, 'events.noReturn.suitHeaterKWh') * 1000 },
              { type: 'estimate', suitO2Kg: -round2(thawedNeedKg / safety) },
            ],
          },
          {
            // C: shelter at a nearby wreck, thaw the joints with its RHU heat, then walk back.
            id: 'shelterWreck',
            labelKey: 'event.noReturn.option.shelterWreck',
            disabled: !eva.nearWreck,
            disabledKey: 'event.noReturn.option.shelterWreck.disabled',
            effects: [
              {
                type: 'wait',
                hours: shelterHours,
                sols: shelterHours / val(data.mars.solHours, 'mars.solHours'),
                estimate: { suitO2Kg: -round2(o2PerHour * shelterHours) },
              },
              { type: 'eva', set: { speedFactor: 1, jointsFrozen: false, thawed: true } },
            ],
          },
        ],
      };
    },
  },

  {
    // Design doc, operations card 2: "Engine froze overnight, morning departure window".
    // The ascent vehicle's engine, before the departure (K1 set earliestSol to the last sol).
    // A and B heat it, so the MAV can fire at dawn (flag mavHeated, read by finale.js).
    // C waits: the MAV then fires only once the day warms it to ascent.mavMinOperatingC, before
    // sunset; where the day never gets that warm (the landing site, design.siteId), the crew stays.
    id: 'engineFreeze',
    trigger: (state, ctx) => {
      const cfg = ctx.data.events.engineFreeze;
      return (
        state.time.sol >= val(cfg.earliestSol, 'events.engineFreeze.earliestSol') &&
        isNight(state, ctx) &&
        state.env.outsideC <= val(cfg.triggerBelowC, 'events.engineFreeze.triggerBelowC')
      );
    },
    effect: (state) => {
      state.events.flags.engineFrozen = true;
    },
    decision: (state, ctx) => {
      const { data } = ctx;
      const cfg = data.events.engineFreeze;
      const waitSols = val(cfg.waitSols, 'events.engineFreeze.waitSols');
      // O2 for the wait: per crew member per Earth day, over the length of the wait in hours.
      const o2PerHour = (val(data.life.o2KgPerCrewPerDay, 'life.o2KgPerCrewPerDay') / 24) * val(data.life.crew, 'life.crew');
      const waitHours = waitSols * val(data.mars.solHours, 'mars.solHours');
      const heatWh = val(cfg.batteryHeatKWh, 'events.engineFreeze.batteryHeatKWh') * 1000;
      const { site } = designRows(state, data);
      return {
        titleKey: 'event.engineFreeze.title',
        bodyKey: 'event.engineFreeze.body',
        // For the text: how cold it is, how warm the engine must be, and how warm the day gets here.
        vars: {
          outsideC: Math.round(state.env.outsideC),
          neededC: val(data.ascent.mavMinOperatingC, 'ascent.mavMinOperatingC'),
          dayMaxC: rowVal(site, 'dayMaxC'),
        },
        options: [
          {
            // A: heat with the battery; the greenhouse heater is cut tonight.
            id: 'batteryHeat',
            labelKey: 'event.engineFreeze.option.batteryHeat',
            disabled: state.power.batteryWh < heatWh,
            disabledKey: 'event.engineFreeze.option.batteryHeat.disabled',
            effects: [
              { type: 'resource', stat: 'batteryWh', delta: -heatWh },
              { type: 'flag', key: 'greenhouseHeatingCut', value: true },
              { type: 'flag', key: 'engineFrozen', value: false },
              { type: 'flag', key: 'mavHeated', value: true },
            ],
          },
          {
            // B: go outside and heat it by hand; O2 and radiation cost.
            id: 'manualHeat',
            labelKey: 'event.engineFreeze.option.manualHeat',
            effects: [
              { type: 'resource', stat: 'o2Kg', delta: -val(cfg.manualO2Kg, 'events.engineFreeze.manualO2Kg') },
              { type: 'resource', stat: 'radiationMSv', delta: val(cfg.manualRadiationMSv, 'events.engineFreeze.manualRadiationMSv') },
              { type: 'flag', key: 'engineFrozen', value: false },
              { type: 'flag', key: 'mavHeated', value: true },
            ],
          },
          {
            // C: miss the window and wait; costs a sol of consumables.
            id: 'wait',
            labelKey: 'event.engineFreeze.option.wait',
            effects: [
              { type: 'wait', sols: waitSols, estimate: { o2Kg: -round2(o2PerHour * waitHours) } },
              { type: 'flag', key: 'engineFrozen', value: false },
            ],
          },
        ],
      };
    },
  },

  {
    // MEDA sees the storm coming: the card opens warnSols before it, so loads can be switched
    // off while the battery is still full.
    id: 'stormWarning',
    trigger: (state, ctx) => {
      if (!hasInstrument(state, 'meda') || !ctx.data.events?.storm) return false;
      const { start } = stormWindow(state, ctx.data);
      const warn = val(ctx.data.events.storm.warnSols, 'events.storm.warnSols');
      return nowT(state) >= start - warn && nowT(state) < start;
    },
    decision: (state, ctx) => stormCard(state, ctx, { warning: true }),
  },

  {
    id: 'storm',
    trigger: (state, ctx) => due(state, ctx.data.events?.storm, 'events.storm'),
    effect: (state, ctx) => {
      const cfg = ctx.data.events.storm;
      const dustLoss = val(cfg.dustLoss, 'events.storm.dustLoss');
      state.power.dust = Math.max(state.power.dust, dustLoss);
      state.events.active.storm = { untilT: nowT(state) + val(cfg.durationSols, 'events.storm.durationSols') };
      ctx.bus?.emit('storm', { intensity: dustLoss }); // K4 draws it
    },
    // Announced by MEDA: the choice was made on the warning card, so the storm just logs.
    decision: (state, ctx) => {
      if (state.events.fired.stormWarning) {
        logEvent(state, 'storm', [{ type: 'estimate', dust: state.power.dust }]);
        return null;
      }
      return stormCard(state, ctx, { warning: false });
    },
  },

  {
    // Solar conjunction: the Sun sits between Earth and Mars, no data can be sent for a while.
    // Predictable (JPL Horizons), so it needs no warning instrument and no choice.
    id: 'conjunction',
    trigger: (state, ctx) => due(state, ctx.data.events?.conjunction, 'events.conjunction'),
    effect: (state, ctx) => {
      const cfg = ctx.data.events.conjunction;
      state.events.active.conjunction = {
        untilT: nowT(state) + val(cfg.durationSols, 'events.conjunction.durationSols'),
        perSol: state.dataBudget.perSol,
      };
      state.dataBudget.perSol = 0;
      logEvent(state, 'conjunction', [{ type: 'estimate', dataMbit: 0 }]);
    },
  },

  {
    // Dust devil (good news): a whirlwind cleans the panels, as it did for Spirit and Opportunity.
    // Only once there is dust to clean.
    id: 'dustDevil',
    trigger: (state, ctx) =>
      state.power.dust > 0 && !state.events.active.storm && due(state, ctx.data.events?.dustDevil, 'events.dustDevil'),
    effect: (state) => {
      const cleaned = state.power.dust;
      state.power.dust = 0;
      logEvent(state, 'dustDevil', [{ type: 'estimate', dust: -cleaned }]);
    },
  },
];

function round2(x) {
  return Math.round(x * 100) / 100;
}
