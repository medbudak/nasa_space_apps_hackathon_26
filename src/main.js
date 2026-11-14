// Entry point and scene router. Owner: K1.
//
// A scene is a module whose default export is { enter(ctx), exit?() }.
// ctx = { state, data, bus, t, goTo, canvas, ui }. Call ctx.goTo('surface') to move on.
// A scene that is not built yet shows a placeholder, so the flow always runs end to end.
//
// URL options: ?scene=surface jumps to a scene · ?seed=123 fixes the random seed.
//
// Shared UI that lives across scenes is mounted once here: K3's decision cards, mini-game host
// and TR/EN switch. K3's HUD is mounted over the surface scene.

import { bus } from './core/bus.js';
import { loadNasaData, getData } from './core/nasaData.js';
import { loadStory, t, getLang, setLang } from './core/i18n.js';
import { getState, newGame, load, save } from './core/state.js';
import { evaluateDesign } from './core/engineering.js';
import { backdrop } from './core/backdrop.js';

const locale = () => (getLang() === 'tr' ? 'tr-TR' : 'en-US');
const shared = []; // mounted shared panels, refreshed after a language switch

const SCENES = {
  design: { path: './scenes/design.js', owner: 'K3', next: 'surface' },
  surface: { path: './scenes/surface.js', owner: 'K2', next: 'ending' },
  ending: { path: './scenes/ending.js', owner: 'K1', next: 'title' },
};

const canvas = document.getElementById('game');
const ui = document.getElementById('ui');
let current = null;

function button(label, onClick) {
  const el = document.createElement('button');
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}

function panel(...children) {
  const el = document.createElement('div');
  el.className = 'core-panel';
  el.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
  el.append(...children);
  return el;
}

const titleScene = {
  enter({ goTo }) {
    const heading = document.createElement('h1');
    heading.textContent = t('title.name');
    heading.style.cssText = 'font-size:48px;margin:0;text-shadow:0 2px 12px rgba(0,0,0,.8);';
    const start = button(t('title.newMission'), () => {
      newGame(seedFromUrl());
      goTo('design');
    });
    start.className = 'btn';
    const items = [heading, start];
    if (load()) {
      const resume = button(t('title.continue'), () => goTo(getState().scene === 'title' ? 'design' : getState().scene));
      resume.className = 'btn ghost';
      items.push(resume);
    }
    ui.append(backdrop('assets/ending/cover_thumbnail.png', 0.25), panel(...items));
  },
};

// Launch and transit cutscene between Sol 0 and Sol 1 (C1: the cruise is not playable).
// Each slide shows K4's artwork for a few seconds; a click, Enter or Space moves on.
const SLIDE_MS = 3500;
const launchScene = {
  timer: 0,
  onKey: null,
  enter({ state, data, t, goTo, ui }) {
    const rocket = data.launchVehicles.find((r) => r.id === state.design.rocketId);
    const slides = [
      { path: 'assets/screens/scr_launch.png', text: t('cutscene.launch', { rocket: rocket?.realName ?? '' }) },
      { path: 'assets/screens/scr_transit.png', text: t('cutscene.transit', { days: state.designSummary?.transitDays ?? '' }) },
    ];
    let i = -1;
    const next = () => {
      clearTimeout(this.timer);
      i += 1;
      if (i >= slides.length) {
        goTo('surface');
        return;
      }
      const caption = document.createElement('p');
      caption.textContent = slides[i].text;
      caption.style.cssText = 'position:absolute;left:0;right:0;bottom:8%;margin:0;text-align:center;font-size:22px;text-shadow:0 2px 8px #000;';
      const skip = button(t('cutscene.skip'), (e) => {
        e.stopPropagation();
        i = slides.length - 1;
        next();
      });
      skip.className = 'btn ghost';
      skip.style.cssText = 'position:absolute;right:16px;bottom:16px;';
      const slide = backdrop(slides[i].path, 0.15);
      slide.addEventListener('click', next);
      ui.replaceChildren(slide, caption, skip);
      this.timer = setTimeout(next, SLIDE_MS);
    };
    this.onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') next();
    };
    window.addEventListener('keydown', this.onKey);
    next();
  },
  exit() {
    clearTimeout(this.timer);
    window.removeEventListener('keydown', this.onKey);
  },
};

// Shown while a teammate's scene file does not exist yet.
function placeholderScene(name, info, err) {
  return {
    enter({ goTo }) {
      const note = document.createElement('p');
      note.textContent = `Scene "${name}" is not built yet (owner ${info.owner}, file src/${info.path.slice(2)}).`;
      console.warn(`[main] scene "${name}" failed to load`, err);
      ui.append(panel(note, button('Skip →', () => goTo(info.next))));
    },
  };
}

// K3's Sol 0 screen exports mountDesign() instead of a default scene; this adapts it.
function designScene(mountDesign) {
  let mounted = null;
  return {
    enter({ state, data, t, goTo, ui }) {
      mounted = mountDesign(ui, {
        data,
        t,
        evaluate: evaluateDesign,
        design: state.design,
        locale: locale(),
        onChange: (design) => {
          Object.assign(state.design, design);
          save();
        },
        onLaunch: (design, summary) => {
          Object.assign(state.design, design);
          state.designSummary = summary;
          goTo('launch');
        },
      });
    },
    exit() {
      mounted?.destroy?.();
    },
  };
}

// K2's surface scene with K3's HUD over it. The HUD redraws itself every refreshMs.
function withHud(scene) {
  let hud = null;
  return {
    async enter(ctx) {
      await scene.enter(ctx);
      if (!ctx.state.time) return; // the scene could not start and shows its own message
      try {
        const { mountHud } = await import('./ui/hud.js');
        const el = document.createElement('div');
        el.className = 'hud-root';
        ctx.ui.append(el);
        hud = mountHud(el, { state: ctx.state, data: ctx.data, t: ctx.t, bus: ctx.bus, locale, refreshMs: 250 });
      } catch (err) {
        console.warn('[main] HUD not available', err);
      }
    },
    exit() {
      hud?.destroy?.();
      hud = null;
      scene.exit?.();
    },
  };
}

async function loadScene(name) {
  if (name === 'title') return titleScene;
  if (name === 'launch') return launchScene;
  const info = SCENES[name];
  if (!info) throw new Error(`unknown scene "${name}"`);
  try {
    const mod = await import(info.path);
    if (name === 'surface' && mod.default) return withHud(mod.default);
    if (mod.default) return mod.default;
    if (mod.mountDesign) return designScene(mod.mountDesign);
    throw new Error(`${info.path} has no default export`);
  } catch (err) {
    return placeholderScene(name, info, err);
  }
}

// Mounts K3's cross-scene panels once. A missing module only loses that panel.
async function mountShared() {
  const mounts = [
    ['./ui/decisionCard.js', 'mountDecisionCards', () => ({ bus, t, locale })],
    ['./minigames/index.js', 'mountMinigames', () => ({ bus, t, locale })],
    ['./ui/langSwitch.js', 'mountLangSwitch', () => ({
      t, getLang, setLang,
      onChange: () => {
        for (const panel of shared) panel?.refresh?.();
        goTo(getState().scene);
      },
    })],
  ];
  for (const [path, fn, opts] of mounts) {
    try {
      const mod = await import(path);
      shared.push(mod[fn](document.body, opts()));
    } catch (err) {
      console.warn(`[main] ${path} not mounted`, err);
    }
  }
}

export async function goTo(name) {
  current?.exit?.();
  ui.replaceChildren();
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

  const state = getState();
  state.scene = name;
  save();

  current = await loadScene(name);
  current.enter({ state, data: getData(), bus, t, goTo, canvas, ui });
}

function seedFromUrl() {
  const seed = Number(new URLSearchParams(location.search).get('seed'));
  return Number.isInteger(seed) && seed > 0 ? seed : undefined;
}

async function start() {
  try {
    await Promise.all([loadNasaData(), loadStory()]);
  } catch (err) {
    ui.append(panel(Object.assign(document.createElement('p'), { textContent: `Could not start: ${err.message}` })));
    console.error(err);
    return;
  }
  // Handle for the debug console: sol14.state, sol14.goTo('ending'), ...
  window.sol14 = { get state() { return getState(); }, bus, data: getData(), goTo };
  await mountShared();

  const jump = new URLSearchParams(location.search).get('scene');
  if (jump) newGame(seedFromUrl());
  goTo(jump && (jump === 'title' || SCENES[jump]) ? jump : 'title');
}

start();
