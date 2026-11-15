// src/systems/audio.js · Owner: K5
// Sound effects for SOL 14. All sounds are CC0 and listed in REFERENCES.md.
//
// Wiring (K1, src/main.js, once after start):
//   import { initAudio } from './systems/audio.js';
//   initAudio(bus);
//
// Other parts can also call the helpers directly:
//   import { audio } from './systems/audio.js';
//   audio.loop('wind'); audio.stop('wind'); audio.play('shutter');
//
// Browsers only allow sound after the player clicks or presses a key, so the
// audio engine starts on the first user gesture. A missing file only logs a
// warning (404); the game keeps running.

const BASE = new URL('../../assets/audio/', import.meta.url);

// mars: true → heard through thin Martian air: low-pass filtered and quieter.
// Perseverance's microphones showed that Mars weakens sound strongly, high pitches most.
const SOUNDS = {
  wind: { file: 'wind_loop', loop: true, volume: 0.35, mars: true },
  storm: { file: 'storm_loop', loop: true, volume: 0.6, mars: true },
  alarm: { file: 'alarm', volume: 0.5, mars: false, maxSeconds: 2.5 },
  quake: { file: 'quake_rumble', volume: 0.8, mars: true },
  footsteps: { file: 'footsteps', loop: true, volume: 0.4, mars: true },
  static: { file: 'radio_static', loop: true, volume: 0.25, mars: false },
  rocket: { file: 'rocket_rumble', volume: 0.7, mars: true, maxSeconds: 10 },
  drone: { file: 'drone_ambience', loop: true, volume: 0.4, mars: false },
  shutter: { file: 'camera_shutter', volume: 0.6, mars: false },
  tick: { file: 'data_tick', volume: 0.3, mars: false, maxSeconds: 0.5 },
};

const MARS_CUTOFF_HZ = 1200; // game choice (simplified), not a measured value
const MARS_GAIN = 0.6;

let ctx = null;
let master = null;
const buffers = new Map(); // name → AudioBuffer | null (null = failed to load)
const playing = new Map(); // name → { source, gain }
let muted = false;

function ensureContext() {
  if (ctx || typeof window === 'undefined') return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  return ctx;
}

async function fetchBuffer(file) {
  // Try .mp3 first, then .wav, so either format in assets/audio/ works.
  for (const ext of ['mp3', 'wav', 'ogg']) {
    try {
      const res = await fetch(new URL(`${file}.${ext}`, BASE));
      if (!res.ok) continue;
      return await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      // try the next format
    }
  }
  console.warn(`[audio] assets/audio/${file}.mp3 (or .wav) not found`);
  return null;
}

async function load(name) {
  if (buffers.has(name)) return buffers.get(name);
  const spec = SOUNDS[name];
  if (!spec || !ensureContext()) return null;
  const buffer = await fetchBuffer(spec.file);
  buffers.set(name, buffer);
  return buffer;
}

async function start(name, { loop } = {}) {
  const spec = SOUNDS[name];
  if (!spec) {
    console.warn(`[audio] unknown sound "${name}"`);
    return;
  }
  if (!ensureContext()) return;
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  const isLoop = loop ?? spec.loop ?? false;
  if (isLoop && playing.has(name)) return; // already looping

  const buffer = await load(name);
  if (!buffer) return;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = isLoop;

  const gain = ctx.createGain();
  gain.gain.value = spec.volume * (spec.mars ? MARS_GAIN : 1);

  let node = source;
  if (spec.mars) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = MARS_CUTOFF_HZ;
    node.connect(filter);
    node = filter;
  }
  node.connect(gain);
  gain.connect(master);

  source.start();
  if (!isLoop && spec.maxSeconds) source.stop(ctx.currentTime + spec.maxSeconds);
  if (isLoop) {
    playing.set(name, { source, gain });
  }
  source.onended = () => {
    if (playing.get(name)?.source === source) playing.delete(name);
  };
}

/** Play a sound once. */
export function play(name) {
  return start(name, { loop: false });
}

/** Start a looping sound (does nothing if it is already looping). */
export function loop(name) {
  return start(name, { loop: true });
}

/** Stop a looping sound, fading it out over `fadeSeconds`. */
export function stop(name, fadeSeconds = 0.8) {
  const entry = playing.get(name);
  if (!entry || !ctx) return;
  playing.delete(name);
  const now = ctx.currentTime;
  entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
  entry.gain.gain.linearRampToValueAtTime(0, now + fadeSeconds);
  entry.source.stop(now + fadeSeconds + 0.05);
}

export function stopAll(fadeSeconds = 0.5) {
  for (const name of [...playing.keys()]) stop(name, fadeSeconds);
}

export function setMuted(value) {
  muted = Boolean(value);
  if (master) master.gain.value = muted ? 0 : 1;
}

export function isMuted() {
  return muted;
}

// UFO finale, timed to docs/ufo_storyboard.md (about 40 s).
// Scene 1 launch 0–10 s · 2 light 10–18 s · 3 Earth downlink 18–30 s · 4 cut 30–40 s.
function playUfoSequence() {
  stopAll(1);
  const at = (seconds, fn) => setTimeout(fn, seconds * 1000);
  play('rocket'); // fades out by itself after ~10 s
  at(13, () => play('shutter'));
  at(18, () => {
    loop('drone');
    loop('static');
  });
  for (let s = 19; s < 30; s += 1.5) at(s, () => play('tick'));
  at(30, () => stop('static', 0.05)); // signal lost: hard cut
  at(32, () => stop('drone', 0.1)); // 2–3 s of silence
  at(35, () => loop('drone')); // ambience returns under the black screen
}

/**
 * Connects sounds to game events (event names from src/core/bus.js, D-003).
 * Call once from main.js.
 */
export function initAudio(bus) {
  if (typeof window === 'undefined') return;

  // Unlock audio on the first click or key press.
  const unlock = () => {
    ensureContext();
    ctx?.resume?.();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  const { EVENTS } = bus;

  // Storm: payload { active: false } or { end: true } stops it; anything else starts it.
  bus.on(EVENTS.FX_STORM, (p) => {
    if (p?.active === false || p?.end) {
      stop('storm', 2);
    } else {
      loop('storm');
    }
  });
  bus.on(EVENTS.FX_QUAKE, () => play('quake'));
  bus.on(EVENTS.DECISION_OPEN, () => play('alarm'));
  bus.on(EVENTS.DOWNLINK_SENT, () => play('tick'));
  bus.on(EVENTS.FORENSICS_DIAGNOSED, () => play('shutter'));
  bus.on(EVENTS.UFO_START, playUfoSequence);
}

export const audio = { play, loop, stop, stopAll, setMuted, isMuted, initAudio, SOUNDS };
