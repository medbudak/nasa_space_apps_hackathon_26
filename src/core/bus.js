// Event bus shared by every part of the game.
// Event names are fixed in DECISIONS.md (D-003). Ask K1 before adding one.

export const EVENTS = Object.freeze({
  DECISION_OPEN: 'decision:open',
  DECISION_MADE: 'decision:made',
  DOWNLINK_QUEUE: 'downlink:queue',
  DOWNLINK_SENT: 'downlink:sent',
  FORENSICS_DIAGNOSED: 'forensics:diagnosed',
  EXPERIMENT_RESULT: 'experiment:result',
  POWER_SHED: 'power:shed',
  UFO_START: 'ufo:start',
  MINIGAME_OPEN: 'minigame:open',
  // Effect events: K2 emits them, K4 draws them.
  FX_STORM: 'storm',
  FX_QUAKE: 'quake',
  FX_FROST: 'frost',
  FX_HALLUCINATION: 'hallucination',
  FX_UFO: 'ufo',
});

const KNOWN = new Set(Object.values(EVENTS));
const handlers = new Map();

function warnIfUnknown(name) {
  if (!KNOWN.has(name)) console.warn(`[bus] unknown event "${name}". Known events are listed in src/core/bus.js.`);
}

/** Subscribe to an event. Returns a function that unsubscribes. */
export function on(name, handler) {
  warnIfUnknown(name);
  if (!handlers.has(name)) handlers.set(name, new Set());
  handlers.get(name).add(handler);
  return () => off(name, handler);
}

export function off(name, handler) {
  handlers.get(name)?.delete(handler);
}

export function emit(name, payload) {
  warnIfUnknown(name);
  for (const handler of handlers.get(name) ?? []) {
    try {
      handler(payload);
    } catch (err) {
      // One broken listener must not stop the others or freeze the game.
      console.error(`[bus] handler for "${name}" failed`, err);
    }
  }
}

export const bus = { on, off, emit, EVENTS };
