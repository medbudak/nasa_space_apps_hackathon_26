// K2 tests for src/scenes/surface.js: the game loop with a fake browser (frames are driven by hand).
// Run with: npm test
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/core/state.js';
import { data, DEFAULT_DESIGN, fakeBus } from './helpers/k2_env.mjs';

// --- a tiny fake browser: only what surface.js touches -------------------------------------
let now = 0;
let frames = [];
const listeners = {};
const fakeEl = () => ({ style: {}, append() {}, addEventListener() {}, remove() {} });
const fakeCanvas = {
  width: 960,
  height: 540,
  getContext: () => new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }),
};

before(() => {
  globalThis.location = { search: '' };
  globalThis.performance = { now: () => now };
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  globalThis.cancelAnimationFrame = () => { frames = []; };
  globalThis.window = {
    addEventListener: (type, fn) => ((listeners[type] ??= []).push(fn)),
    removeEventListener: (type, fn) => { listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn); },
  };
  globalThis.document = { createElement: fakeEl };
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
});

/** Advance the fake clock by ms and run the pending animation frame. */
function tick(ms) {
  now += ms;
  const cbs = frames;
  frames = [];
  for (const cb of cbs) cb(now);
}

function press(key) {
  for (const fn of listeners.keydown ?? []) fn({ key });
}

async function enterScene(design = {}) {
  const { default: surface } = await import('../src/scenes/surface.js');
  const state = createState(1);
  Object.assign(state.design, DEFAULT_DESIGN, design);
  const bus = fakeBus();
  const scenes = [];
  await surface.enter({
    state, data, bus, t: (k) => k, goTo: (name) => scenes.push(name), canvas: fakeCanvas, ui: fakeEl(),
  });
  return { surface, state, bus, scenes };
}

test('entering the scene starts a run and the loop moves the clock', async () => {
  const { surface, state } = await enterScene();
  assert.equal(state.time.sol, 1);
  const start = state.time.solFraction;
  for (let i = 0; i < 60; i++) tick(100); // 6 s of real time
  assert.ok(state.time.solFraction > start, 'clock did not move');
  assert.ok(Math.abs(state.time.solFraction - start - 6 / data.time.solRealSeconds.value) < 1e-6);
  surface.exit();
});

test('a frame that arrives "before" the last one does not run time backwards', async () => {
  const { surface, state } = await enterScene();
  const start = state.time.solFraction;
  now -= 50; // first frame timestamp earlier than enter()
  tick(0);
  assert.equal(state.time.solFraction, start);
  assert.equal(state.life.radiationMSv, 0);
  surface.exit();
});

test('the loop pauses while a decision card is open and goes on after the choice', async () => {
  const { surface, state, bus } = await enterScene();
  for (let i = 0; i < 4000 && !state.events.pending; i++) tick(100);
  assert.ok(state.events.pending, 'no card opened');
  const frozenAt = state.time.solFraction;
  for (let i = 0; i < 20; i++) tick(100);
  assert.equal(state.time.solFraction, frozenAt, 'time moved while the card was open');
  bus.emitted.findLast((e) => e.name === 'decision:open').payload.choose('batteryHeat');
  tick(100);
  assert.ok(state.time.solFraction !== frozenAt, 'time did not resume after the choice');
  surface.exit();
});

test('E at the door goes out and comes back in; walking moves the astronaut away', async () => {
  const { surface, state } = await enterScene();
  state.time.solFraction = 0.5; // midday
  tick(16);
  press('e');
  assert.equal(state.life.eva.outside, true);
  for (const fn of listeners.keydown ?? []) fn({ key: 'ArrowRight' });
  tick(16);
  assert.ok(state.life.eva.distanceM > 0, 'astronaut did not move');
  for (const fn of listeners.keyup ?? []) fn({ key: 'ArrowRight' });
  press('e'); // too far from the door: nothing happens
  assert.equal(state.life.eva.outside, true);
  surface.exit();
});

test('a loss ends the scene and goes to the ending', async () => {
  // O2 rather than cold: the scene uses K1's real engineering.js, which has no habitatTemp yet,
  // so in the real game the habitat does not cool (yet) and nobody freezes.
  const { surface, state, scenes } = await enterScene();
  try {
    state.life.o2Kg = 0.0001;
    for (let i = 0; i < 100 && !scenes.length; i++) tick(100);
    assert.deepEqual(scenes, ['ending']);
    assert.equal(state.outcome, 'lost');
    assert.equal(state.life.loss.reasonKey, 'loss.oxygen');
  } finally {
    surface.exit();
  }
});

test('exit stops the loop and removes the key listeners', async () => {
  const { surface, state } = await enterScene();
  surface.exit();
  const t = state.time.solFraction;
  tick(100);
  assert.equal(state.time.solFraction, t);
  assert.equal((listeners.keydown ?? []).length, 0);
});
