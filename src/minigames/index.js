// Mini-game host (owner: K3). One overlay that runs the reusable templates.
//
// K1 wires it once from main.js:
//
//   import { mountMinigames } from './minigames/index.js';
//   mountMinigames(rootEl, { bus, t, locale });
//
// Anyone opens a mini-game with the D-003 call:
//
//   bus.emit('minigame:open', { template: 'converter', config: {...}, onDone });
//
// `onDone` is called exactly once with { success, score, timeUsed, detail? }.
//   timeUsed: real seconds the player spent in the mini-game.
//   detail:   template-specific result (for the converter: amounts in and out, energy, game minutes).
// Closing with Esc counts as { success: false, score: 0 }.
//
// Template interface: { mount(el, { config, t, locale, done }) -> { destroy() } }

import { converter } from './converter.js';
import { align } from './align.js';
import { qte } from './qte.js';

const TEMPLATES = { converter, align, qte };

export function registerTemplate(name, template) {
  TEMPLATES[name] = template;
}

export function mountMinigames(root, opts) {
  const { bus, t } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const now = opts.now || (() => performance.now());
  const queue = [];
  let active = null;

  const layer = document.createElement('div');
  layer.className = 'minigame-layer';
  root.appendChild(layer);

  function onOpen(req) {
    if (!req || typeof req.onDone !== 'function') {
      console.warn('[minigames] minigame:open needs an onDone callback', req);
      return;
    }
    queue.push(req);
    if (!active) startNext();
  }

  function startNext() {
    const req = queue.shift();
    if (!req) return;
    const template = TEMPLATES[req.template];
    if (!template) {
      console.warn(`[minigames] unknown template "${req.template}"`);
      req.onDone({ success: false, score: 0, timeUsed: 0, detail: { error: 'unknownTemplate' } });
      startNext();
      return;
    }
    const lastFocus = document.activeElement;
    layer.innerHTML = `<div class="minigame-backdrop"></div>
      <section class="minigame" role="dialog" aria-modal="true" aria-label="${t(`minigame.${req.template}`)}"></section>`;
    const el = layer.querySelector('.minigame');
    const started = now();
    let finished = false;

    const done = (result) => {
      if (finished) return;
      finished = true;
      const timeUsed = Math.round((now() - started) / 100) / 10;
      active.instance?.destroy?.();
      layer.innerHTML = '';
      active = null;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      req.onDone({ success: false, score: 0, ...result, timeUsed });
      startNext();
    };

    active = { req, done, instance: null };
    active.instance = template.mount(el, { config: req.config || {}, t, locale: locale(), done });
  }

  function onKey(e) {
    if (active && e.key === 'Escape') {
      e.preventDefault();
      active.done({ success: false, score: 0, detail: { cancelled: true } });
    }
  }

  document.addEventListener('keydown', onKey);
  bus.on('minigame:open', onOpen);

  return {
    isOpen: () => Boolean(active),
    destroy: () => {
      bus.off?.('minigame:open', onOpen);
      document.removeEventListener('keydown', onKey);
      layer.remove();
    },
  };
}
