// Entry point and scene router. Owner: K1.
//
// A scene is a module whose default export is { enter(ctx), exit?() }.
// ctx = { state, data, bus, t, goTo, canvas, ui }. Call ctx.goTo('surface') to move on.
// A scene that is not built yet shows a placeholder, so the flow always runs end to end.
//
// URL options: ?scene=surface jumps to a scene · ?seed=123 fixes the random seed.

import { bus } from './core/bus.js';
import { loadNasaData, getData } from './core/nasaData.js';
import { loadStory, t } from './core/i18n.js';
import { getState, newGame, load, save } from './core/state.js';

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
    const start = button(t('title.newMission'), () => {
      newGame(seedFromUrl());
      goTo('design');
    });
    const items = [heading, start];
    if (load()) items.push(button(t('title.continue'), () => goTo(getState().scene === 'title' ? 'design' : getState().scene)));
    ui.append(panel(...items));
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

async function loadScene(name) {
  if (name === 'title') return titleScene;
  const info = SCENES[name];
  if (!info) throw new Error(`unknown scene "${name}"`);
  try {
    const mod = await import(info.path);
    return mod.default;
  } catch (err) {
    return placeholderScene(name, info, err);
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

  const jump = new URLSearchParams(location.search).get('scene');
  if (jump) newGame(seedFromUrl());
  goTo(jump && (jump === 'title' || SCENES[jump]) ? jump : 'title');
}

start();
