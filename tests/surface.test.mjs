// K2 tests for src/scenes/surface.js: the game loop with a fake browser (frames are driven by hand).
// Run with: npm test
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/core/state.js';
import { data, DEFAULT_DESIGN, fakeBus, jumpTo } from './helpers/k2_env.mjs';

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

async function enterScene(design = {}, runData = data) {
  const { default: surface } = await import('../src/scenes/surface.js');
  const state = createState(1);
  Object.assign(state.design, DEFAULT_DESIGN, design);
  const bus = fakeBus();
  const scenes = [];
  await surface.enter({
    state, data: runData, bus, t: (k) => k, goTo: (name) => scenes.push(name), canvas: fakeCanvas, ui: fakeEl(),
  });
  return { surface, state, bus, scenes };
}

test('hudOptions gives K3\'s HUD the telemetry, the relay passes and the power hooks', async () => {
  const { surface, state } = await enterScene();
  try {
    for (let i = 0; i < 20; i++) tick(100);
    const opts = surface.hudOptions();
    assert.ok(opts.telemetry.points.length > 0, 'telemetry was not sampled');
    assert.ok(Array.isArray(opts.downlink.passes));
    const status = opts.power.getStatus();
    assert.equal(status.batteryWh, state.power.batteryWh);
    assert.equal(status.loads[0].id, 'lifeSupport');
    const order = ['lifeSupport', 'comms', 'heating', 'greenhouse', 'moxie', 'experiments'];
    assert.equal(opts.power.setOrder(order), true);
    assert.deepEqual(state.power.order, order);
  } finally {
    surface.exit();
  }
  assert.deepEqual(surface.hudOptions(), {}, 'after exit there is nothing to hand over');
});

test('a relay pass in the data sends the queued packet when its time comes', async () => {
  const withPass = structuredClone(data);
  withPass.relayPasses = [{ id: 'mro', name: 'MRO', atSolFraction: { value: 0.3 }, mbit: { value: 100 } }];
  const { surface, state, bus } = await enterScene({}, withPass);
  try {
    state.dataBudget.queue.push({ type: 'photo', id: 'p1', mbit: 40, points: 10 });
    for (let i = 0; i < 400 && state.time.solFraction < 0.31; i++) tick(100);
    const sent = bus.emitted.filter((e) => e.name === 'downlink:sent');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].payload.id, 'p1');
    assert.equal(sent[0].payload.passId, 'mro');
  } finally {
    surface.exit();
  }
});

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
  // The engine card comes the night before departure: start the sol before, it freezes after midnight.
  jumpTo(state, data.events.engineFreeze.earliestSol.value - 1);
  for (let i = 0; i < 4000 && !state.events.pending; i++) tick(100);
  assert.ok(state.events.pending, 'no card opened');
  assert.equal(state.events.pending.eventId, 'engineFreeze');
  assert.equal(state.events.finale, null, 'the departure sequence started before the night card');
  const frozenAt = state.time.solFraction;
  for (let i = 0; i < 20; i++) tick(100);
  assert.equal(state.time.solFraction, frozenAt, 'time moved while the card was open');
  bus.emitted.findLast((e) => e.name === 'decision:open').payload.choose('batteryHeat');
  tick(100);
  assert.ok(state.time.solFraction !== frozenAt, 'time did not resume after the choice');
  surface.exit();
});

function release(key) {
  for (const fn of listeners.keyup ?? []) fn({ key });
}

test('E at the door goes out and comes back in; walking moves the astronaut away', async () => {
  const { surface, state } = await enterScene();
  try {
    state.time.solFraction = 0.5; // midday
    tick(16);
    press('e');
    assert.equal(state.life.eva.outside, true);
    press('ArrowRight');
    for (let i = 0; i < 10; i++) tick(100); // 1 real second
    release('ArrowRight');
    assert.ok(state.life.eva.distanceM > 3, 'astronaut did not leave the door');
    press('e'); // away from the door: nothing happens
    assert.equal(state.life.eva.outside, true);
  } finally {
    surface.exit();
  }
});

test('D-008: outside, time runs slower, so a 900 m walk takes about 15 real seconds', async () => {
  const { surface, state } = await enterScene();
  try {
    state.time.solFraction = 0.5;
    tick(16);
    press('e');
    const t0 = state.time.solFraction;
    press('ArrowRight');
    let ms = 0;
    while (state.life.eva.distanceM < 900 && ms < 60000) {
      tick(100);
      ms += 100;
    }
    release('ArrowRight');
    const expectedSec = 900 / data.life.walkSpeedMs.value / data.time.evaGameSecondsPerRealSecond.value;
    assert.ok(Math.abs(ms / 1000 - expectedSec) <= 0.2, `walk took ${ms / 1000} s, expected about ${expectedSec} s`);
    // The one game clock moved by the walk's game time (15 game minutes), not by a 2-minute-sol rate.
    const gameMinutes = (state.time.solFraction - t0) * data.mars.solHours.value * 60;
    assert.ok(Math.abs(gameMinutes - 900 / data.life.walkSpeedMs.value / 60) < 0.5, `clock moved ${gameMinutes} game min`);
  } finally {
    surface.exit();
  }
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
