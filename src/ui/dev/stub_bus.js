// DEV STUB (owner: K3) — a minimal event bus until K1 publishes src/core/bus.js.
// K3's modules use only bus.on(name, fn), bus.off(name, fn) and bus.emit(name, payload).

export function createBus({ log } = {}) {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
      return () => this.off(name, fn);
    },
    off(name, fn) { handlers.get(name)?.delete(fn); },
    emit(name, payload) {
      log?.(name, payload);
      for (const fn of handlers.get(name) || []) fn(payload);
    },
  };
}
