// surface.js — K2: the surface scene (Sol 1 to the last sol).
//
// Runs the game loop: survival.step() + events.checkEvents() every frame, pauses while a
// decision card is open, saves at each new sol, and moves to the ending on a loss or when
// the last sol is over. Draws K4's images (wired by K1), with plain shapes as a fallback.
//
// For K3's HUD (mounted over this scene by main.js): the loop samples the telemetry and runs
// the relay passes (K3's downlink logic), and hudOptions() hands the HUD the telemetry, the
// passes and the power panel hooks. Relay passes come from nasa_data.json `relayPasses`
// (requested from K1: rows { id, name, atSolFraction, mbit }); none means no passes yet.
//
// Controls: ← / → (or A / D) walk, E at the habitat door: go out / come back in.
//
// Dev options (URL):
//   ?devData=k2  fill values still missing in nasa_data.json with K2's TEST values
//                (tests/fixtures/k2_requested.json). Shown on screen. Never for a real run.
//   ?debug=1     text panel with the simulation numbers, and buttons to answer decision cards.
//   ?demo        quick mission for judges and the live demo (D-005 M9): rules.demoSols sols, every
//                crisis and the departure still come, on a schedule scaled onto it.
//
// Time (D-008): inside, 1 sol is about 2 minutes; outside, 1 real second = 1 game minute, so a
// 900 m walk takes about 15 s on screen. Walking uses the real suit speed in game time, so the
// O2 maths stays honest. survival.gameSecondsPerRealSecond() gives the current rate (for the HUD).

import * as engineering from '../core/engineering.js';
import { save } from '../core/state.js';
import {
  createSurvivalState, step, startEva, endEva, setEvaPosition, walkSpeedMs, realSecondsToHours,
  gameSecondsPerRealSecond,
} from '../systems/survival.js';
import {
  createEventState, checkEvents, reopenPending, resolveDecision, commsBlackout, minigameOpen, lightDelaySeconds,
} from '../systems/events.js';
import { getPowerStatus, setOrder } from '../systems/power.js';
import { finaleDue, startFinale, updateFinale, finalePaused, finaleDone } from '../systems/finale.js';
import { onDownlinkSent, resolveAlarm } from '../systems/sanity.js';
import { val, withRequested } from '../systems/simData.js';
import { createTelemetry } from '../ui/telemetry.js';
import { runDuePasses, connectDownlink } from '../ui/downlink.js';

// Engine settings (not gameplay values): frame cap after a tab switch, view and door size.
const MAX_FRAME_SEC = 0.25;
const VIEW_WIDTH_M = 200; // metres of ground across the canvas
const DOOR_RADIUS_M = 3; // how close to the habitat door E works

const params = new URLSearchParams(location.search);
const DEV_DATA = params.get('devData') === 'k2';
const DEBUG = params.get('debug') === '1';
// ?demo: the quick mission (D-005 M9) lasts rules.demoSols, with the crisis schedule scaled onto it.
const DEMO = params.has('demo');

let scene = null; // everything the running scene needs, cleared on exit

export default {
  async enter({ state, data, bus, t, goTo, canvas, ui }) {
    const runData = DEV_DATA ? await loadDevData(data) : data;
    const ctx = { data: runData, eng: engineering, bus, demo: DEMO };

    try {
      if (DEV_DATA) fillDevDesign(state, runData);
      if (!state.time) {
        createSurvivalState(state, runData);
        createEventState(state);
        save();
      }
    } catch (err) {
      console.error('[surface] cannot start', err);
      showMessage(ui, t('surface.error.cannotStart', { detail: err.message }), err.message);
      return;
    }

    const keys = new Set();
    const onKeyDown = (e) => {
      keys.add(e.key);
      if (e.key === 'e' || e.key === 'E') toggleEva(state, runData);
      if (e.key === ' ') startJump(state, ctx);
    };
    const onKeyUp = (e) => keys.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    scene = {
      state, ctx, t, goTo, canvas, ui, keys, onKeyDown, onKeyUp,
      g: canvas.getContext('2d'),
      astronautX: 0, // metres from the habitat door; negative = left of it
      lastSol: state.time.sol,
      last: performance.now(),
      raf: 0,
      telemetry: createTelemetry({ maxSols: 3 }), // in memory: starts empty after a reload
      passes: relayPasses(runData),
      debugEl: DEBUG ? addDebugPanel(ui) : null,
      devNote: DEV_DATA ? addDevNote(ui, t) : null,
    };

    // Packets (photos, reports, experiment results, family messages) join the downlink queue
    // through K3's connectDownlink; every packet is made during the surface run, so it is wired
    // here, once, and removed on exit (main.js must not call it too: packets would queue twice).
    scene.offQueue = bus?.on ? connectDownlink(bus, () => state) : null;
    // A packet that reached Earth: a family message lifts sanity (sanity.js).
    scene.onSent = (packet) => onDownlinkSent(state, ctx, packet);
    bus?.on?.('downlink:sent', scene.onSent);

    reopenPending(state, ctx); // a card that was open before a reload
    scene.raf = requestAnimationFrame(frame);
  },

  /**
   * Extra options for K3's mountHud(), which main.js mounts over this scene:
   * the telemetry history, the relay passes for the Downlink tab, and the power panel hooks.
   * Call after enter(); returns {} if the scene did not start.
   */
  hudOptions() {
    if (!scene) return {};
    const { state, ctx, telemetry, passes } = scene;
    return {
      telemetry,
      downlink: { passes, lightDelaySec: () => lightDelaySeconds(ctx) }, // null until the distance is in the data
      power: { getStatus: () => getPowerStatus(state, ctx), setOrder: (ids) => setOrder(state, ids) },
      // The player's answer on K3's alarm band: sanity +/- for a false alarm (sanity.js).
      onAlarmResolve: (result) => resolveAlarm(state, ctx, result),
    };
  },

  exit() {
    if (!scene) return;
    cancelAnimationFrame(scene.raf);
    scene.ctx.bus?.off?.('downlink:sent', scene.onSent);
    scene.offQueue?.();
    window.removeEventListener('keydown', scene.onKeyDown);
    window.removeEventListener('keyup', scene.onKeyUp);
    scene = null;
  },
};

function frame(now) {
  if (!scene) return;
  const s = scene;
  const { state, ctx } = s;
  // Clamp both ways: the first frame's timestamp can be a little before performance.now() at
  // enter (negative dt would run the simulation backwards), and a background tab returns a huge gap.
  const dt = Math.min(Math.max((now - s.last) / 1000, 0), MAX_FRAME_SEC);
  s.last = now;

  // Stand still while a decision card is open or the player is in a mini-game.
  const paused = Boolean(state.events.pending) || finalePaused(state) || minigameOpen(state);
  if (!paused) {
    const fromT = state.time.sol + state.time.solFraction;
    walk(dt);
    step(state, dt, ctx);
    const toT = state.time.sol + state.time.solFraction;
    // Relay passes due in this step send the downlink queue (K3's M1 logic); nothing goes out
    // during a solar conjunction.
    if (s.passes.length && !commsBlackout(state)) runDuePasses(state, s.passes, fromT, toT, ctx.bus);
    s.telemetry.sample(state);
    if (finaleDue(state, ctx)) startFinale(state); // morning of the last sol: departure sequence
    checkEvents(state, ctx);
    updateFinale(state, ctx);
    if (state.time.sol !== s.lastSol) {
      s.lastSol = state.time.sol;
      state.dataBudget.used = 0; // "used this sol" starts again with each new sol
      save();
    }
  }

  draw();
  if (s.debugEl) updateDebugPanel();

  // finale.js decides when the run ends (launch, or the window closing at sunset). Waiting a
  // sol on the engine card can legitimately carry the run past the mission length.
  if (state.life.loss || finaleDone(state)) {
    finish();
    return;
  }
  s.raf = requestAnimationFrame(frame);
}

// The run is over: a loss (state.outcome = 'lost') or the finale set the outcome
// (hero / explorer / colonist, see finale.js).
function finish() {
  const { goTo } = scene;
  save();
  goTo('ending');
}

// ---------------------------------------------------------------------------
// Walking and EVA

function walk(dt) {
  const { state, ctx, keys } = scene;
  const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
  const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D');
  if (!state.life.eva.outside || left === right) return;

  // Real suit speed in game time; outside, game time runs slower (D-008).
  const gameSeconds = realSecondsToHours(dt, ctx.data, state) * 3600;
  const metres = walkSpeedMs(state, ctx.data) * gameSeconds;
  scene.astronautX += right ? metres : -metres;
  scene.facing = right ? 1 : -1;
  // A lander with RHUs close by can shelter the astronaut (K2's no-return card, option C).
  const nearWreck = (ctx.data.wrecks ?? []).some(
    (w) => w.salvage === 'rhu' && Math.abs((w.corridorM?.value ?? Infinity) - scene.astronautX) <= WRECK_RADIUS_M,
  );
  setEvaPosition(state, { distanceM: Math.abs(scene.astronautX), nearWreck });
}

function toggleEva(state, data) {
  if (!scene || state.events.pending || state.life.loss) return;
  if (Math.abs(scene.astronautX) > DOOR_RADIUS_M) return; // only at the door
  if (state.life.eva.outside) {
    endEva(state);
    scene.astronautX = 0;
  } else {
    startEva(state, data);
  }
}

// ---------------------------------------------------------------------------
// Drawing: K4's images (assets/), with plain shapes while an image is loading or missing.

// Background per landing site, and on-screen sizes in px from K4's assets/sprites/sprites.json.
const BACKGROUNDS = {
  meridiani: 'assets/backgrounds/bg_meridiani_day.png',
  jezero: 'assets/backgrounds/bg_jezero_sunset.png',
  arcadia: 'assets/backgrounds/bg_arcadia_day.png',
  storm: 'assets/backgrounds/bg_storm.png',
  jezeroNight: 'assets/backgrounds/bg_jezero_night.png',
};
const SCREENS = { habitat: 'assets/screens/scr_habitat_cutaway.png' };
const VFX = { storm: 'assets/vfx/vfx_dust_storm.png', frost: 'assets/vfx/vfx_frost_1.png' };
const STORM_DUST = 0.5; // panel dust share drawn as a storm (display only, no game rule)
const WRECK_RADIUS_M = 10; // how close counts as "at the wreck" (shelter by its RHUs)
const WRECK_SPRITES = {
  opportunity: { file: 'assets/sprites/rover_opportunity.png', w: 96, h: 64 },
  spirit: { file: 'assets/sprites/rover_spirit.png', w: 96, h: 64 },
  phoenix: { file: 'assets/sprites/lander_phoenix.png', w: 96, h: 64 },
  insight: { file: 'assets/sprites/lander_insight.png', w: 96, h: 64 },
  beagle2: { file: 'assets/sprites/lander_beagle2.png', w: 48, h: 48 },
};
const SPRITES = {
  idle: { file: 'assets/sprites/astronaut_idle.png', w: 48, h: 64 },
  walk: { file: 'assets/sprites/astronaut_walk.png', w: 48, h: 64 },
  habitat: { file: 'assets/structures/habitat_main.png', w: 192, h: 144 },
  frozen: { file: 'assets/sprites/astronaut_frozen.png', w: 48, h: 64 },
  solarClean: { file: 'assets/structures/solar_clean.png', w: 144, h: 108 },
  solarDusty: { file: 'assets/structures/solar_dusty.png', w: 144, h: 108 },
  greenhouse: { file: 'assets/structures/greenhouse_ok.png', w: 144, h: 96 },
  mav: { file: 'assets/structures/mav_rocket.png', w: 96, h: 192 },
};
const images = {};

/** The loaded image for an asset path, or null while it loads (and always in Node tests). */
function image(path) {
  if (typeof Image === 'undefined') return null;
  if (!images[path]) {
    images[path] = new Image();
    images[path].src = new URL(`../../${path}`, import.meta.url).href;
  }
  const img = images[path];
  return img.complete && img.naturalWidth ? img : null;
}

/** Draws a sprite standing on the ground at screen x (its centre). Returns false if not loaded. */
function drawSprite(g, sprite, x, groundY, flip = false) {
  const img = image(sprite.file);
  if (!img) return false;
  g.save();
  g.translate(x, groundY - sprite.h); // origin: top edge, horizontal centre
  if (flip) g.scale(-1, 1); // mirror around the centre line
  g.drawImage(img, -sprite.w / 2, 0, sprite.w, sprite.h);
  g.restore();
  return true;
}

function draw() {
  if (scene.state.life.eva.outside) drawOutside();
  else drawInside();
}

// Inside: K4's habitat cutaway. Lights dim when the habitat is unpowered, blue tint when it is cold.
function drawInside() {
  const { g, canvas, state, ctx } = scene;
  const W = canvas.width;
  const H = canvas.height;
  const cutaway = image(SCREENS.habitat);
  if (cutaway) g.drawImage(cutaway, 0, 0, W, H);
  else {
    g.fillStyle = '#2a2230';
    g.fillRect(0, 0, W, H);
  }
  if (state.power.deficitW > 0) {
    g.fillStyle = 'rgba(0, 0, 0, 0.55)';
    g.fillRect(0, 0, W, H);
  }
  if (state.env.insideC <= val(ctx.data.thermal.cabinMinC, 'thermal.cabinMinC')) {
    g.fillStyle = 'rgba(120, 170, 255, 0.25)';
    g.fillRect(0, 0, W, H);
  }
  drawSprite(g, SPRITES.idle, W * 0.5, H * 0.9 - jumpOffsetPx(SPRITES.idle), scene.facing < 0);
  if (!state.events.pending) hint(scene.t('surface.hint.exit'), W / 2, H * 0.97);
}

function hint(text, x, y) {
  const { g } = scene;
  g.font = '16px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillStyle = 'rgba(0, 0, 0, 0.6)';
  const w = (g.measureText(text)?.width ?? 0) + 20;
  g.fillRect(x - w / 2, y - 18, w, 26);
  g.fillStyle = '#f2e8e4';
  g.fillText(text, x, y);
}

function drawOutside() {
  const { g, canvas, state, ctx, astronautX } = scene;
  const W = canvas.width;
  const H = canvas.height;
  const groundY = H * 0.75;
  const pxPerM = W / VIEW_WIDTH_M;
  const cameraX = astronautX; // keep the astronaut in the middle
  const toScreen = (m) => W / 2 + (m - cameraX) * pxPerM;
  const dust = state.power.dust ?? 0;

  // Sky and ground: K4's background for the site (or the storm sky), darkened at night.
  const site = ctx.data.landingSites.find((r) => r.id === state.design.siteId);
  const sun = ctx.eng.sunCos(state.time.solFraction, site?.latitudeDeg?.value ?? 0);
  const night = sun === 0;
  const bgKey = dust > STORM_DUST ? 'storm' : night && state.design.siteId === 'jezero' ? 'jezeroNight' : state.design.siteId;
  const bg = image(BACKGROUNDS[bgKey] ?? BACKGROUNDS.meridiani);
  if (bg) {
    g.drawImage(bg, 0, 0, W, H);
    g.fillStyle = `rgba(8, 6, 20, ${(0.75 * (1 - Math.min(1, sun * 2))).toFixed(3)})`;
    g.fillRect(0, 0, W, H);
  } else {
    g.fillStyle = `rgb(${Math.round(20 + 180 * sun)}, ${Math.round(12 + 120 * sun)}, ${Math.round(16 + 80 * sun)})`;
    g.fillRect(0, 0, W, groundY);
    g.fillStyle = '#7a3b22';
    g.fillRect(0, groundY, W, H - groundY);
  }

  // Lost landers along the corridor (nasa_data.json wrecks[].corridorM), named when close.
  for (const wreck of ctx.data.wrecks ?? []) {
    const x = wreck.corridorM?.value;
    const sprite = WRECK_SPRITES[wreck.id];
    if (x == null || !sprite || Math.abs(x - cameraX) > VIEW_WIDTH_M) continue;
    drawSprite(g, sprite, toScreen(x), groundY);
    if (Math.abs(x - astronautX) <= WRECK_RADIUS_M * 3) hint(wreck.realName, toScreen(x), groundY - sprite.h - 12);
  }

  // Base layout: panels and greenhouse left of the habitat, the ascent vehicle (MAV) to the right.
  const dusty = dust > 0.3;
  if (state.design.powerId !== 'fission') drawSprite(g, dusty ? SPRITES.solarDusty : SPRITES.solarClean, toScreen(-30), groundY);
  if (state.design.instrumentIds?.includes('plantChamber')) drawSprite(g, SPRITES.greenhouse, toScreen(-55), groundY);
  drawSprite(g, SPRITES.mav, toScreen(40), groundY);

  // Habitat with its door at x = 0.
  if (!drawSprite(g, SPRITES.habitat, toScreen(0) - SPRITES.habitat.w / 2, groundY)) {
    g.fillStyle = state.power.off.heating ? '#5b6b7a' : '#d9d2c5';
    g.fillRect(toScreen(-12), groundY - 6 * pxPerM, 12 * pxPerM, 6 * pxPerM);
    g.fillStyle = '#222';
    g.fillRect(toScreen(-0.6), groundY - 2.2 * pxPerM, 0.6 * pxPerM, 2.2 * pxPerM);
  }

  // Astronaut.
  const eva = state.life.eva;
  const moving = ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].some((k) => scene.keys.has(k));
  const sprite = eva.jointsFrozen ? SPRITES.frozen : moving ? SPRITES.walk : SPRITES.idle;
  const feetY = groundY - jumpOffsetPx(sprite); // off the ground while jumping
  if (!drawSprite(g, sprite, toScreen(astronautX), feetY, scene.facing < 0)) {
    g.fillStyle = eva.jointsFrozen ? '#9fd3ff' : '#f2e8e4';
    g.fillRect(toScreen(astronautX) - 0.4 * pxPerM, feetY - 1.8 * pxPerM, 0.8 * pxPerM, 1.8 * pxPerM);
  }

  // K4's effects: blowing dust in a storm, frost on the visor when the suit joints freeze.
  const storm = dust > STORM_DUST ? image(VFX.storm) : null;
  if (storm) {
    g.globalAlpha = Math.min(1, dust);
    g.drawImage(storm, 0, 0, W, H);
    g.globalAlpha = 1;
  }
  const frost = eva.jointsFrozen ? image(VFX.frost) : null;
  if (frost) g.drawImage(frost, 0, 0, W, H);

  // EVA prompt at the door.
  if (Math.abs(astronautX) <= DOOR_RADIUS_M && !state.events.pending) {
    hint(scene.t('surface.hint.enter'), W / 2, groundY - SPRITES.walk.h - 16);
  }
}

// ---------------------------------------------------------------------------
// Jumping in Mars gravity (Space). Display only: it changes no resource.
// With the same take-off speed as a jump of life.jumpHeightEarthM on Earth, the jump on Mars goes
// g0 / g ≈ 2.6 times higher and lasts longer: the same g the pendulum and drop experiments
// measure (K6). The air time comes from engineering.fallTime; the height ratio is the one line
// of kinematics here (could move to engineering.js). It plays in real seconds, like K3's QTE fall,
// because at the game clock's speed a jump would be over before it could be seen.

const ASTRONAUT_HEIGHT_M = 1.8; // drawing scale only: metres the sprite's height stands for

/** Height of a jump on Mars, in m: same take-off speed as the Earth jump (h_mars = h_earth · g0 / g). */
export function marsJumpHeightM(data) {
  const g = val(data.mars.gravity, 'mars.gravity');
  const g0 = val(data.constants.g0, 'constants.g0');
  return val(data.life.jumpHeightEarthM, 'life.jumpHeightEarthM') * (g0 / g);
}

/** Air time of that jump in s: up and down, each a free fall from the top (engineering.fallTime). */
export function marsJumpAirTimeS(data, eng) {
  return 2 * eng.fallTime(marsJumpHeightM(data), val(data.mars.gravity, 'mars.gravity'));
}

function startJump(state, ctx) {
  if (!scene || scene.jump || state.events.pending || minigameOpen(state) || finalePaused(state)) return;
  if (!ctx.data.life?.jumpHeightEarthM) return; // no jump until the data is there
  if (state.life.eva.jointsFrozen) return; // frozen joints: no jumping
  scene.jump = { start: performance.now(), airS: marsJumpAirTimeS(ctx.data, ctx.eng), heightM: marsJumpHeightM(ctx.data) };
}

/** How far above the ground to draw the astronaut now, in px of the sprite's scale. */
function jumpOffsetPx(sprite) {
  const j = scene?.jump;
  if (!j) return 0;
  const t = (performance.now() - j.start) / 1000;
  if (t >= j.airS) {
    scene.jump = null;
    return 0;
  }
  const half = j.airS / 2;
  const share = 1 - ((t - half) / half) ** 2; // 0 at take-off and landing, 1 at the top
  return share * j.heightM * (sprite.h / ASTRONAUT_HEIGHT_M);
}

// ---------------------------------------------------------------------------
// Relay passes

/** Relay passes from nasa_data.json `relayPasses` (rows of entries), in K3's downlink shape. */
function relayPasses(data) {
  const rows = Array.isArray(data.relayPasses) ? data.relayPasses : [];
  return rows
    .filter((r) => typeof r.atSolFraction?.value === 'number' && typeof r.mbit?.value === 'number')
    .map((r) => ({ id: r.id, name: r.name ?? r.id, atSolFraction: r.atSolFraction.value, mbit: r.mbit.value }));
}

// ---------------------------------------------------------------------------
// Dev helpers

async function loadDevData(data) {
  try {
    const res = await fetch(new URL('../../tests/fixtures/k2_requested.json', import.meta.url));
    const requested = await res.json();
    console.warn('[surface] ?devData=k2: missing nasa_data.json values filled with K2 TEST values');
    return withRequested(data, requested);
  } catch (err) {
    console.error('[surface] could not load K2 dev data', err);
    return data;
  }
}

// With ?devData=k2 and no Sol 0 design (e.g. ?scene=surface), pick the first option of each group.
function fillDevDesign(state, data) {
  const d = state.design;
  const first = (table) => data[table]?.[0]?.id ?? null;
  d.siteId ??= first('landingSites');
  d.powerId ??= first('powerSources');
  d.batteryId ??= first('batteries');
  d.insulationId ??= first('insulation');
  d.commsId ??= first('comms');
}

// The technical reason is always shown on its own line (developer-facing, so not in story.json):
// without it, a missing story text leaves only the key on screen and the cause is lost.
function showMessage(ui, text, detail) {
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;text-align:center;';
  const p = document.createElement('p');
  p.textContent = text;
  p.style.margin = '0';
  const code = document.createElement('code');
  code.textContent = detail;
  code.style.cssText = 'font:13px monospace;opacity:.75;max-width:90%;';
  box.append(p, code);
  ui.append(box);
}

function addDevNote(ui, t) {
  const el = document.createElement('div');
  // Bottom corners, so neither covers K3's HUD bars at the top.
  el.style.cssText = 'position:absolute;bottom:8px;right:8px;padding:4px 8px;background:#b4232a;color:#fff;font:12px monospace;';
  el.textContent = t('surface.dev.testData');
  ui.append(el);
  return el;
}

function addDebugPanel(ui) {
  const el = document.createElement('pre');
  el.style.cssText = 'position:absolute;bottom:8px;left:8px;margin:0;padding:8px;background:rgba(0,0,0,.65);color:#d6f5d6;font:12px/1.35 monospace;max-width:46%;white-space:pre-wrap;';
  ui.append(el);
  el.addEventListener('click', (e) => {
    const id = e.target?.dataset?.choice;
    if (id && scene?.state.events.pending) resolveDecision(scene.state, id, scene.ctx);
  });
  return el;
}

// Developer text only (not player-facing), so it is not in story.json.
function updateDebugPanel() {
  const { state, debugEl, ctx } = scene;
  const p = state.power;
  const l = state.life;
  const hours = (state.time.solFraction * val(ctx.data.mars.solHours, 'mars.solHours')).toFixed(1);
  const lines = [
    `SOL ${state.time.sol}  ${hours} h  1 s = ${(gameSecondsPerRealSecond(state, ctx.data) / 60).toFixed(1)} game min  ${state.events.pending ? '[PAUSED: card open]' : ''}`,
    `outside ${state.env.outsideC.toFixed(1)} C   inside ${state.env.insideC.toFixed(1)} C`,
    `gen ${(p.generationW / 1000).toFixed(1)} kW   load ${(p.loadW / 1000).toFixed(1)} kW   deficit ${(p.deficitW / 1000).toFixed(1)} kW`,
    `battery ${(p.batteryWh / 1000).toFixed(1)} / ${(p.batteryCapacityWh / 1000).toFixed(0)} kWh`,
    `shed: ${Object.keys(p.off).join(', ') || '-'}`,
    `O2 ${l.o2Kg.toFixed(2)} kg   dose ${l.radiationMSv.toFixed(2)} mSv   cold ${l.body.coldHours.toFixed(2)} h`,
    l.eva.outside
      ? `EVA ${l.eva.distanceM.toFixed(0)} m  suit O2 ${l.eva.suitO2Kg.toFixed(3)} kg  notch ${l.eva.requiredO2Kg.toFixed(3)} kg  speed ${Math.round(l.eva.speedFactor * 100)}%${l.eva.noReturn ? '  NO RETURN' : ''}`
      : 'inside',
    l.loss ? `LOSS: ${l.loss.reasonKey}` : '',
  ];
  let html = escapeHtml(lines.filter(Boolean).join('\n'));
  const pending = state.events.pending;
  if (pending) {
    html += `\n\ncard: ${escapeHtml(pending.eventId)}\n`;
    for (const o of pending.card.options) {
      const label = `${o.id}${o.disabled ? ' (unavailable)' : ''}`;
      html += o.disabled
        ? `  ${escapeHtml(label)}\n`
        : `  <button data-choice="${escapeHtml(o.id)}">${escapeHtml(label)}</button>\n`;
    }
  }
  if (debugEl.innerHTML !== html) debugEl.innerHTML = html;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
