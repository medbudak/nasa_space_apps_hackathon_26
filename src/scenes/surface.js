// surface.js — K2: the surface scene (Sol 1 to the last sol).
//
// Runs the game loop: survival.step() + events.checkEvents() every frame, pauses while a
// decision card is open, saves at each new sol, and moves to the ending on a loss or when
// the last sol is over. Draws a placeholder view (sky, ground, habitat, astronaut) until
// K4's sprites and K3's HUD are wired in.
//
// Controls: ← / → (or A / D) walk, E at the habitat door: go out / come back in.
//
// Dev options (URL):
//   ?devData=k2  fill values still missing in nasa_data.json with K2's TEST values
//                (tests/fixtures/k2_requested.json). Shown on screen. Never for a real run.
//   ?debug=1     text panel with the simulation numbers, and buttons to answer decision
//                cards while K3's card UI is not wired into main.js yet.
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
import { createEventState, checkEvents, reopenPending, resolveDecision } from '../systems/events.js';
import { val, withRequested } from '../systems/simData.js';

// Engine settings (not gameplay values): frame cap after a tab switch, view and door size.
const MAX_FRAME_SEC = 0.25;
const VIEW_WIDTH_M = 200; // metres of ground across the canvas
const DOOR_RADIUS_M = 3; // how close to the habitat door E works

const params = new URLSearchParams(location.search);
const DEV_DATA = params.get('devData') === 'k2';
const DEBUG = params.get('debug') === '1';

let scene = null; // everything the running scene needs, cleared on exit

export default {
  async enter({ state, data, bus, t, goTo, canvas, ui }) {
    const runData = DEV_DATA ? await loadDevData(data) : data;
    const ctx = { data: runData, eng: engineering, bus };

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
      debugEl: DEBUG ? addDebugPanel(ui) : null,
      devNote: DEV_DATA ? addDevNote(ui, t) : null,
    };

    reopenPending(state, ctx); // a card that was open before a reload
    scene.raf = requestAnimationFrame(frame);
  },

  exit() {
    if (!scene) return;
    cancelAnimationFrame(scene.raf);
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

  const paused = Boolean(state.events.pending);
  if (!paused) {
    walk(dt);
    step(state, dt, ctx);
    checkEvents(state, ctx);
    if (state.time.sol !== s.lastSol) {
      s.lastSol = state.time.sol;
      save();
    }
  }

  draw();
  if (s.debugEl) updateDebugPanel();

  if (state.life.loss || state.time.sol > val(ctx.data.rules.totalSols, 'rules.totalSols')) {
    finish();
    return;
  }
  s.raf = requestAnimationFrame(frame);
}

// The run is over: a loss (state.outcome = 'lost') or the last sol has passed.
// The Sol 14 departure sequence that sets a winning outcome comes later (S21–24).
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
  setEvaPosition(state, { distanceM: Math.abs(scene.astronautX) });
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
// Placeholder drawing (K4's sprites and effects replace this)

function draw() {
  const { g, canvas, state, ctx, astronautX } = scene;
  const W = canvas.width;
  const H = canvas.height;
  const groundY = H * 0.75;
  const pxPerM = W / VIEW_WIDTH_M;
  const cameraX = astronautX; // keep the astronaut in the middle
  const toScreen = (m) => W / 2 + (m - cameraX) * pxPerM;

  // Sky: dark at night, butterscotch by day (brightness follows the Sun).
  const site = ctx.data.landingSites.find((r) => r.id === state.design.siteId);
  const sun = ctx.eng.sunCos(state.time.solFraction, site?.latitudeDeg?.value ?? 0);
  g.fillStyle = `rgb(${Math.round(20 + 180 * sun)}, ${Math.round(12 + 120 * sun)}, ${Math.round(16 + 80 * sun)})`;
  g.fillRect(0, 0, W, groundY);

  g.fillStyle = '#7a3b22';
  g.fillRect(0, groundY, W, H - groundY);

  // Habitat at x = 0 (door), 12 m wide to the left of the door.
  g.fillStyle = state.power.off.heating ? '#5b6b7a' : '#d9d2c5';
  g.fillRect(toScreen(-12), groundY - 6 * pxPerM, 12 * pxPerM, 6 * pxPerM);
  g.fillStyle = '#222';
  g.fillRect(toScreen(-0.6), groundY - 2.2 * pxPerM, 0.6 * pxPerM, 2.2 * pxPerM);

  // Astronaut (inside: drawn at the door, dimmed).
  const eva = state.life.eva;
  g.globalAlpha = eva.outside ? 1 : 0.35;
  g.fillStyle = eva.jointsFrozen ? '#9fd3ff' : '#f2e8e4';
  g.fillRect(toScreen(astronautX) - 0.4 * pxPerM, groundY - 1.8 * pxPerM, 0.8 * pxPerM, 1.8 * pxPerM);
  g.globalAlpha = 1;

  // EVA prompt at the door.
  if (Math.abs(astronautX) <= DOOR_RADIUS_M && !state.events.pending) {
    g.fillStyle = '#f2e8e4';
    g.font = '16px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(scene.t(eva.outside ? 'surface.hint.enter' : 'surface.hint.exit'), W / 2, groundY - 2.6 * pxPerM);
  }
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
  el.style.cssText = 'position:absolute;top:8px;right:8px;padding:4px 8px;background:#b4232a;color:#fff;font:12px monospace;';
  el.textContent = t('surface.dev.testData');
  ui.append(el);
  return el;
}

function addDebugPanel(ui) {
  const el = document.createElement('pre');
  el.style.cssText = 'position:absolute;top:8px;left:8px;margin:0;padding:8px;background:rgba(0,0,0,.65);color:#d6f5d6;font:12px/1.35 monospace;max-width:46%;white-space:pre-wrap;';
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
