// Seeded random numbers, so the same seed replays the same run (D-002).
// Use createRng(state.seed) instead of Math.random() for anything that affects gameplay.

/** mulberry32: small, fast, good enough for a game. Returns () => float in [0, 1). */
export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.between = (min, max) => min + (max - min) * next();
  next.chance = (p) => next() < p;
  next.pick = (list) => list[Math.floor(next() * list.length)];
  return next;
}
