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

import { val, rowVal, designRows, recordScore, missionSols, scheduledSol, scheduledSpan } from './simData.js';
import { spendTime, isNight } from './survival.js';
import { holdLoad, instrumentWatts } from './power.js';
import { createRng } from '../core/rng.js';

/**
 * Create state.events. Call after createSurvivalState().
 *   active{}   crises still going on: { storm: { untilT }, conjunction: { untilT, perSol },
 *              spe: { untilT } } (the SPE dose itself: survival.updateRadiation)
 *   minigame   { eventId } while a crisis mini-game is open (the simulation waits)
 *   finale     see finale.js
 */
export function createEventState(state) {
  state.events = { fired: {}, pending: null, flags: {}, active: {}, minigame: null, finale: null };
  return state;
}

/** True while a crisis mini-game is open: the surface loop stands still. */
export function minigameOpen(state) {
  return Boolean(state.events?.minigame);
}

/**
 * Open a K3 mini-game for a crisis (D-003 minigame:open). The simulation waits until onDone;
 * the result goes to MINIGAME_RESULTS[eventId]. Without a bus (tests) nothing opens.
 */
function openMinigame(state, ctx, eventId, template, config) {
  if (!ctx.bus) return false;
  state.events.minigame = { eventId };
  ctx.bus.emit('minigame:open', {
    template,
    config,
    onDone: (result) => finishMinigame(state, ctx, eventId, result),
  });
  return true;
}

function finishMinigame(state, ctx, eventId, result) {
  if (state.events.minigame?.eventId !== eventId) return;
  state.events.minigame = null;
  MINIGAME_RESULTS[eventId]?.(state, ctx, result ?? { success: false, score: 0 });
}

const nowT = (state) => state.time.sol + state.time.solFraction;

/**
 * True while a scheduled event's moment has come: on its sol at its time of sol, or any later
 * sol (so a long wait cannot skip it). An event with no schedule in nasa_data.json yet never
 * comes, instead of stopping the game.
 */
function due(state, cfg, path, ctx) {
  if (!cfg) return false;
  const sol = scheduledSol(ctx, val(cfg.sol, `${path}.sol`));
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
  if (active.spe && T >= active.spe.untilT) {
    delete active.spe;
    state.events.flags.speShelter = false;
    logEvent(state, 'speEnd');
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
  if (ev.pending || ev.minigame || state.life.loss) return null;
  endExpired(state, ctx);

  for (const event of ctx.events ?? EVENTS) {
    if (event.once !== false && ev.fired[event.id]) continue;
    if (!event.trigger(state, ctx)) continue;

    ev.fired[event.id] = { sol: state.time.sol, solFraction: state.time.solFraction };
    event.effect?.(state, ctx);

    // decision() may return null: this time the event needs no choice (e.g. the storm was announced).
    const card = buildCard(state, event, ctx);
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
  // A crisis mini-game open at the reload cannot be resumed: it counts as not done, so the run
  // does not wait forever.
  if (state.events?.minigame) finishMinigame(state, ctx, state.events.minigame.eventId, { success: false, score: 0 });
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
// ---------------------------------------------------------------------------
// Delayed Mission Control (M7). A crisis card can offer "ask Mission Control": the question and
// the answer each travel at the speed of light, so the answer comes 2 x the one-way light delay
// later (engineering.lightDelaySec over telecom.earthMarsDistanceKm). That much game time passes
// while the crew waits, and the crisis goes on (suit O2, cold, battery). Then the card opens
// again with Mission Control's advice marked. The lesson of the design doc: on Mars the crew
// has to decide for itself. Not offered during a solar conjunction, or without the distance.

/** One-way light delay Earth–Mars in seconds, or null while the distance is not in the data. */
export function lightDelaySeconds(ctx) {
  const d = ctx.data.telecom?.earthMarsDistanceKm?.value;
  if (typeof d !== 'number') return null;
  return ctx.eng.lightDelaySec(d, val(ctx.data.constants.speedOfLightKms, 'constants.speedOfLightKms'));
}

function askEarthOption(state, ctx) {
  const oneWay = lightDelaySeconds(ctx);
  if (oneWay == null || commsBlackout(state)) return null;
  const hours = (2 * oneWay) / 3600;
  return {
    id: 'askEarth',
    labelKey: 'missionControl.ask',
    effects: [{ type: 'wait', hours, sols: hours / val(ctx.data.mars.solHours, 'mars.solHours'), estimate: { minutes: Math.round(hours * 60) } }],
  };
}

/** The event's card, with the "ask Mission Control" option when the event can be advised. */
function buildCard(state, event, ctx, { asked = false } = {}) {
  const card = event.decision?.(state, ctx);
  if (!card) return null;
  if (event.advise && !asked) {
    const ask = askEarthOption(state, ctx);
    if (ask) card.options = [...card.options, ask];
  }
  return card;
}

function findEvent(id, ctx) {
  return (ctx.events ?? EVENTS).find((e) => e.id === id);
}

/** The crew asked: wait for the answer, then reopen the card with the advice marked. */
function askMissionControl(state, ctx, pending, option) {
  for (const effect of option.effects) applyEffect(state, effect, ctx); // the round-trip wait
  const entry = { sol: pending.sol, eventId: pending.eventId, choice: 'askEarth', effects: option.effects };
  state.decisionLog.push(entry);
  ctx.bus?.emit('decision:made', entry);
  if (state.life.loss) {
    state.events.pending = null; // the answer came too late
    return entry;
  }
  const event = findEvent(pending.eventId, ctx);
  const card = buildCard(state, event, ctx, { asked: true });
  if (!card) {
    state.events.pending = null;
    return entry;
  }
  card.advice = { optionId: event.advise(state, ctx), key: 'missionControl.advice' };
  state.events.pending = { eventId: pending.eventId, sol: state.time.sol, card, asked: true };
  ctx.bus?.emit('decision:open', cardPayload(state, pending.eventId, card, ctx));
  return entry;
}

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
  if (choiceId === 'askEarth') return askMissionControl(state, ctx, pending, option);

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

function stormWindow(state, ctx) {
  const cfg = ctx.data.events.storm;
  const start = scheduledSol(ctx, val(cfg.sol, 'events.storm.sol')) + val(cfg.atSolFraction, 'events.storm.atSolFraction');
  const end = start + scheduledSpan(ctx, val(cfg.durationSols, 'events.storm.durationSols'));
  return { start, end: state.events.active?.storm?.untilT ?? end };
}

/** Mission Control's storm advice: switch off the installed load that saves the most power. */
function stormAdvice(state, ctx) {
  const choices = [['holdGreenhouse', 'greenhouse'], ['holdExperiments', 'experiments'], ['holdMoxie', 'moxie']]
    .map(([id, load]) => ({ id, w: instrumentWatts(state, ctx.data, load) }))
    .filter((c) => c.w > 0)
    .sort((a, b) => b.w - a.w);
  return choices[0]?.id ?? 'keepAll';
}

function stormCard(state, ctx, { warning }) {
  const { data } = ctx;
  const { start, end } = stormWindow(state, ctx);
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
      lastsSols: Math.round(scheduledSpan(ctx, val(data.events.storm.durationSols, 'events.storm.durationSols')) * 10) / 10,
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
// Solar particle event (SPE). For durationHours the surface dose rate rises by extraMSvPerHour
// (survival.updateRadiation adds speDoseRate). The shelter behind the water tanks cuts it by
// shelterFactor. With RAD the card comes warnHours before; without it the player only notices
// after unnoticedHours of dose already taken (design doc: "dose hidden, shelter too late").

function speStart(ctx) {
  const cfg = ctx.data.events.spe;
  return scheduledSol(ctx, val(cfg.sol, 'events.spe.sol')) + val(cfg.atSolFraction, 'events.spe.atSolFraction');
}

function speCard(state, ctx, { warning }) {
  const { data } = ctx;
  const cfg = data.events.spe;
  const rate = val(cfg.extraMSvPerHour, 'events.spe.extraMSvPerHour');
  const unnoticed = warning ? 0 : val(cfg.unnoticedHours, 'events.spe.unnoticedHours');
  const hoursLeft = val(cfg.durationHours, 'events.spe.durationHours') - unnoticed;
  const factor = val(cfg.shelterFactor, 'events.spe.shelterFactor');
  return {
    titleKey: warning ? 'event.speWarning.title' : 'event.spe.title',
    bodyKey: warning ? 'event.speWarning.body' : 'event.spe.body',
    vars: { hours: Math.round(hoursLeft), takenMSv: round2(rate * unnoticed) },
    options: [
      {
        id: 'shelter',
        labelKey: 'event.spe.option.shelter',
        effects: [
          { type: 'flag', key: 'speShelter', value: true },
          { type: 'estimate', radiationMSv: round2(rate * hoursLeft * factor) },
        ],
      },
      {
        id: 'keepWorking',
        labelKey: 'event.spe.option.keepWorking',
        effects: [{ type: 'estimate', radiationMSv: round2(rate * hoursLeft) }],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Quake (marsquake or a nearby impact; InSight's largest was about M4.7). Shelves shake and a
// tool falls: K3's QTE "catch" mini-game, timed with the real fall in Mars gravity
// (engineering.fallTime) next to the same fall on Earth. With SEIS a warning comes first and
// the shelves can be strapped down. A missed catch damages equipment (a lost system).

function quakeConfig(state, ctx) {
  const { data, eng } = ctx;
  const q = data.events.quake;
  const height = val(q.shelfHeightM, 'events.quake.shelfHeightM');
  const rounds = val(q.rounds, 'events.quake.rounds');
  const minDelay = val(q.minDelaySeconds, 'events.quake.minDelaySeconds');
  const maxDelay = val(q.maxDelaySeconds, 'events.quake.maxDelaySeconds');
  const rng = createRng((state.seed ^ 0x5e15) >>> 0); // the same seed gives the same quake
  return {
    mode: 'catch',
    titleKey: 'event.quake.qte.title',
    introKey: 'event.quake.qte.intro',
    eventSeconds: eng.fallTime(height, val(data.mars.gravity, 'mars.gravity')),
    compareSeconds: eng.fallTime(height, val(data.constants.g0, 'constants.g0')),
    catchWindow: val(q.catchWindow, 'events.quake.catchWindow'),
    rounds,
    needed: val(q.needed, 'events.quake.needed'),
    delaysSeconds: Array.from({ length: rounds }, () => rng.between(minDelay, maxDelay)),
  };
}

function quakeResult(state, ctx, result) {
  if (result.success) {
    logEvent(state, 'quake', [{ type: 'estimate', caught: true }]);
    return;
  }
  // Without SEIS the shake came unannounced; with it, the warning was ignored.
  const cause = hasInstrument(state, 'seis') ? 'decision.quakeWarning' : 'design.instrumentIds';
  recordScore(state, {
    category: 'lostSystems',
    pointsEntry: ctx.data.rules.quakeDamagePoints,
    path: 'rules.quakeDamagePoints',
    reason: 'consequence.quakeDamage',
    cause,
  });
  logEvent(state, 'quake', [{ type: 'estimate', caught: false, cause }]);
}

/** What to do when a crisis mini-game reports back (K3's onDone result). */
const MINIGAME_RESULTS = { quake: quakeResult };

function quakeStart(ctx) {
  const q = ctx.data.events.quake;
  return scheduledSol(ctx, val(q.sol, 'events.quake.sol')) + val(q.atSolFraction, 'events.quake.atSolFraction');
}

// ---------------------------------------------------------------------------
// Event catalogue, in priority order: when two events trigger in the same step,
// the earlier one opens its card first (life-threatening ones on top).

export const EVENTS = [
  {
    // Design doc M4 / operations card 1: "Joints froze outside, speed 40%, O2 31%, habitat 900 m".
    // Opens when suit O2 drops below the O2 needed to walk back (with the safety factor).
    id: 'noReturn',
    advise: () => 'suitHeater', // keeps the safety margin
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
    advise: (state, ctx) =>
      state.power.batteryWh >= val(ctx.data.events.engineFreeze.batteryHeatKWh, 'events.engineFreeze.batteryHeatKWh') * 1000
        ? 'batteryHeat'
        : 'manualHeat',
    trigger: (state, ctx) => {
      const cfg = ctx.data.events.engineFreeze;
      return (
        state.time.sol >= scheduledSol(ctx, val(cfg.earliestSol, 'events.engineFreeze.earliestSol')) &&
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
    advise: (state, ctx) => stormAdvice(state, ctx),
    trigger: (state, ctx) => {
      if (!hasInstrument(state, 'meda') || !ctx.data.events?.storm) return false;
      const { start } = stormWindow(state, ctx);
      const warn = scheduledSpan(ctx, val(ctx.data.events.storm.warnSols, 'events.storm.warnSols'));
      return nowT(state) >= start - warn && nowT(state) < start;
    },
    decision: (state, ctx) => stormCard(state, ctx, { warning: true }),
  },

  {
    id: 'storm',
    advise: (state, ctx) => stormAdvice(state, ctx),
    trigger: (state, ctx) => due(state, ctx.data.events?.storm, 'events.storm', ctx),
    effect: (state, ctx) => {
      const cfg = ctx.data.events.storm;
      const dustLoss = val(cfg.dustLoss, 'events.storm.dustLoss');
      state.power.dust = Math.max(state.power.dust, dustLoss);
      state.events.active.storm = { untilT: nowT(state) + scheduledSpan(ctx, val(cfg.durationSols, 'events.storm.durationSols')) };
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
    trigger: (state, ctx) => due(state, ctx.data.events?.conjunction, 'events.conjunction', ctx),
    effect: (state, ctx) => {
      const cfg = ctx.data.events.conjunction;
      state.events.active.conjunction = {
        untilT: nowT(state) + scheduledSpan(ctx, val(cfg.durationSols, 'events.conjunction.durationSols')),
        perSol: state.dataBudget.perSol,
      };
      state.dataBudget.perSol = 0;
      logEvent(state, 'conjunction', [{ type: 'estimate', dataMbit: 0 }]);
    },
  },

  {
    // RAD sees the solar particle event coming.
    id: 'speWarning',
    advise: () => 'shelter',
    trigger: (state, ctx) => {
      if (!hasInstrument(state, 'rad') || !ctx.data.events?.spe) return false;
      const start = speStart(ctx);
      const warn = val(ctx.data.events.spe.warnHours, 'events.spe.warnHours') / val(ctx.data.mars.solHours, 'mars.solHours');
      return nowT(state) >= start - warn && nowT(state) < start;
    },
    decision: (state, ctx) => speCard(state, ctx, { warning: true }),
  },

  {
    id: 'spe',
    advise: () => 'shelter',
    trigger: (state, ctx) => due(state, ctx.data.events?.spe, 'events.spe', ctx),
    effect: (state, ctx) => {
      const { data } = ctx;
      const cfg = data.events.spe;
      const solHours = val(data.mars.solHours, 'mars.solHours');
      const warned = Boolean(state.events.fired.speWarning);
      // Without RAD the dose of the first hours is already taken when the crew notices.
      const unnoticed = warned ? 0 : val(cfg.unnoticedHours, 'events.spe.unnoticedHours');
      state.life.radiationMSv += val(cfg.extraMSvPerHour, 'events.spe.extraMSvPerHour') * unnoticed;
      const hoursLeft = val(cfg.durationHours, 'events.spe.durationHours') - unnoticed;
      state.events.active.spe = { untilT: nowT(state) + hoursLeft / solHours };
    },
    decision: (state, ctx) => {
      if (state.events.fired.speWarning) {
        logEvent(state, 'spe', [{ type: 'estimate', sheltered: Boolean(state.events.flags.speShelter) }]);
        return null;
      }
      return speCard(state, ctx, { warning: false });
    },
  },

  {
    // SEIS feels the first tremor: a moment to strap the shelves down.
    id: 'quakeWarning',
    advise: () => 'secure',
    trigger: (state, ctx) => {
      if (!hasInstrument(state, 'seis') || !ctx.data.events?.quake) return false;
      const start = quakeStart(ctx);
      const warn = val(ctx.data.events.quake.warnHours, 'events.quake.warnHours') / val(ctx.data.mars.solHours, 'mars.solHours');
      return nowT(state) >= start - warn && nowT(state) < start;
    },
    decision: (state, ctx) => {
      const hours = val(ctx.data.events.quake.secureHours, 'events.quake.secureHours');
      return {
        titleKey: 'event.quakeWarning.title',
        bodyKey: 'event.quakeWarning.body',
        options: [
          {
            id: 'secure',
            labelKey: 'event.quakeWarning.option.secure',
            effects: [
              { type: 'wait', hours, sols: hours / val(ctx.data.mars.solHours, 'mars.solHours') },
              { type: 'flag', key: 'quakeSecured', value: true },
            ],
          },
          { id: 'ignore', labelKey: 'event.quakeWarning.option.ignore', effects: [] },
        ],
      };
    },
  },

  {
    id: 'quake',
    trigger: (state, ctx) => due(state, ctx.data.events?.quake, 'events.quake', ctx),
    effect: (state, ctx) => {
      ctx.bus?.emit('quake', { duration: val(ctx.data.events.quake.shakeSeconds, 'events.quake.shakeSeconds') }); // K4
    },
    decision: (state, ctx) => {
      if (state.events.flags.quakeSecured) {
        logEvent(state, 'quake', [{ type: 'estimate', secured: true }]);
      } else if (!openMinigame(state, ctx, 'quake', 'qte', quakeConfig(state, ctx))) {
        logEvent(state, 'quake', [{ type: 'estimate', played: false }]);
      }
      return null;
    },
  },

  {
    // Heat rejection failure (design doc: Mars has no "hot weather"; the real problem is that
    // thin air carries little heat away, so a clogged radiator overheats the electronics).
    // Clean it on an EVA (O2 and time), or run with less heat: MOXIE and the experiments off
    // for the rest of the mission.
    id: 'radiator',
    advise: () => 'cleanRadiator',
    trigger: (state, ctx) => due(state, ctx.data.events?.radiator, 'events.radiator', ctx),
    decision: (state, ctx) => {
      const { data } = ctx;
      const hours = val(data.events.radiator.cleanEvaHours, 'events.radiator.cleanEvaHours');
      const o2 = val(data.life.evaO2KgPerHour, 'life.evaO2KgPerHour') * hours;
      const untilT = missionSols(ctx) + 2; // past the departure
      const hold = (load) => ({ type: 'hold', load, untilT, estimate: { savedW: instrumentWatts(state, data, load) } });
      return {
        titleKey: 'event.radiator.title',
        bodyKey: 'event.radiator.body',
        options: [
          {
            id: 'cleanRadiator',
            labelKey: 'event.radiator.option.clean',
            effects: [
              { type: 'resource', stat: 'o2Kg', delta: -round2(o2) },
              { type: 'wait', hours, sols: hours / val(data.mars.solHours, 'mars.solHours') },
            ],
          },
          {
            id: 'reduceLoad',
            labelKey: 'event.radiator.option.reduceLoad',
            effects: [hold('moxie'), hold('experiments')],
          },
        ],
      };
    },
  },

  {
    // Dust devil (good news): a whirlwind cleans the panels, as it did for Spirit and Opportunity.
    // Only once there is dust to clean.
    id: 'dustDevil',
    trigger: (state, ctx) =>
      state.power.dust > 0 && !state.events.active.storm && due(state, ctx.data.events?.dustDevil, 'events.dustDevil', ctx),
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
