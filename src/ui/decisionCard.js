// Decision cards (owner: K3). M2: the player sees what each choice costs before choosing.
//
// This module does not import K1's core files. K1 wires it once from main.js:
//
//   import { mountDecisionCards } from './ui/decisionCard.js';
//   mountDecisionCards(document.body, { bus, t, locale });
//
// It shows the card K2's events.js sends with `decision:open` (format: top of src/systems/events.js):
//   {
//     eventId, sol, titleKey, bodyKey, vars?,          // vars fill {name} slots: t(key, vars)
//     options: [{ id, labelKey, resultKey?, effects: [
//       { type: 'resource', stat, delta }              // shown
//       { type: 'wait', sols, hours?, estimate? }      // shown: hours if given, else sols, plus the estimate
//       { type: 'estimate', ...numbers }               // shown as "≈", applies nothing
//       { type: 'flag' | 'eva', ... }                  // internal, not shown
//     ]}],
//     unavailable?: [{ id, labelKey, disabledKey }],   // shown greyed out with the reason, cannot be chosen
//     choose(choiceId),                                // K2 applies the effects, logs and emits decision:made
//   }
// This module never emits decision:made and changes no state; it only calls choose().
// If choose() throws, the card stays open. `resultKey` is optional: a short result line after the choice.

// How each stat is shown. `scale` converts the value to the display unit.
// `worseWhenUp` marks stats where a rise is bad (used for colouring only).
// Units are SI symbols and stay the same in both languages; words come from t(`effect.<stat>`).
// Both K2's current names (energy_kWh, ...) and the older ones are listed until the names are final.
import { icon, watchIconErrors } from './icons.js';

export const STATS = {
  energy_kWh: { icon: '⚡', ico: 'fx_energy', unit: 'kWh' },
  oxygen_kg: { icon: 'O₂', ico: 'fx_o2', unit: 'kg' },
  suitO2Kg: { icon: '🧑‍🚀O₂', ico: 'fx_suitO2', unit: 'kg' },
  water_kg: { icon: '💧', unit: 'kg' },
  food_kg: { icon: '🥫', unit: 'kg' },
  radiation_mSv: { icon: '☢', ico: 'fx_radiation', unit: 'mSv', worseWhenUp: true },
  batteryWh: { icon: '⚡', ico: 'fx_energy', unit: 'kWh', scale: 1 / 1000 },
  o2Kg: { icon: 'O₂', ico: 'fx_o2', unit: 'kg' },
  waterKg: { icon: '💧', unit: 'kg' },
  foodKg: { icon: '🥫', unit: 'kg' },
  radiationMSv: { icon: '☢', ico: 'fx_radiation', unit: 'mSv', worseWhenUp: true },
  sanity: { icon: '🧠', unit: '%' },
  dataMbit: { icon: '📡', unit: 'Mbit' },
  score: { icon: '★', ico: 'fx_score', unitKey: 'unit.points' },
};
const UNKNOWN_STAT = { icon: '•', unit: '' };

const num = (v, locale) => Math.abs(v).toLocaleString(locale, { maximumFractionDigits: 2 });
const signOf = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±');

function amountText(v, stat, t, locale) {
  const n = num(v, locale);
  const s = signOf(v);
  if (stat.unit === '%') return locale.startsWith('tr') ? `${s}%${n}` : `${s}${n}%`;
  if (stat.unitKey) return `${s}${n} ${t(stat.unitKey)}`;
  return `${s}${n}${stat.unit ? ' ' + stat.unit : ''}`;
}

function toneOf(v, stat) {
  if (v === 0) return 'neutral';
  return (v > 0) !== Boolean(stat.worseWhenUp) ? 'good' : 'bad';
}

function statPart(key, value, { t, locale, approx = false }) {
  const stat = STATS[key] || UNKNOWN_STAT;
  const v = (Number(value) || 0) * (stat.scale ?? 1);
  return {
    icon: stat.icon,
    ico: stat.ico,
    amount: `${approx ? '≈ ' : ''}${amountText(v, stat, t, locale)}`,
    tone: toneOf(v, stat),
    label: t(`effect.${key}`),
    approx,
  };
}

// Pure: turn one K2 effect into the chips the player sees (an empty list for internal effects).
// Each chip: { icon, amount, tone, label, approx, note? }.
export function effectParts(effect, { t = (k) => k, locale = 'tr-TR' } = {}) {
  const o = { t, locale };
  if (effect.type === 'resource') return [statPart(effect.stat, effect.delta, o)];
  if (effect.type === 'estimate') {
    return Object.entries(effect)
      .filter(([k, v]) => k !== 'type' && typeof v === 'number')
      .map(([k, v]) => statPart(k, v, { ...o, approx: true }));
  }
  if (effect.type === 'wait') {
    const amount = effect.hours != null
      ? `+${num(effect.hours, locale)} h`
      : `+${num(Number(effect.sols) || 0, locale)} sol`;
    const note = Object.entries(effect.estimate || {})
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => { const p = statPart(k, v, o); return `≈ ${p.icon} ${p.amount}`; })
      .join(' ');
    return [{ icon: '⏱', ico: 'fx_time', amount, tone: 'bad', label: t('effect.wait'), approx: false, note }];
  }
  return []; // flag, eva and unknown types are internal
}

/** Pure: the first chip of an effect, or null when it is internal. */
export function formatEffect(effect, opts) {
  return effectParts(effect, opts)[0] ?? null;
}

export function mountDecisionCards(root, opts) {
  const { bus } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const resultMs = opts.resultMs ?? 3500;
  const queue = [];
  let current = null;
  let lastFocus = null;
  let resultTimer = 0;

  const layer = document.createElement('div');
  layer.className = 'decision-layer';
  watchIconErrors(layer);
  root.appendChild(layer);

  function onOpen(card) {
    if (!card || !Array.isArray(card.options) || card.options.length === 0 || typeof card.choose !== 'function') {
      console.warn('[decisionCard] decision:open needs options and a choose() function', card);
      return;
    }
    queue.push(card);
    if (!current) showNext();
  }

  function showNext() {
    current = queue.shift() || null;
    if (!current) return;
    clearResult();
    lastFocus = document.activeElement;
    const card = current;
    const tv = (key) => opts.t(key, localVars(card.vars)); // text with the card's {name} values
    layer.innerHTML = `
      <div class="decision-backdrop"></div>
      <section class="decision" role="dialog" aria-modal="true" aria-labelledby="decision-title" aria-describedby="decision-text">
        <header class="decision-head">
          <span class="kicker">${tv('decision.kicker')}${card.sol !== undefined ? ` · SOL ${card.sol}` : ''}</span>
          <h2 id="decision-title">${tv(card.titleKey)}</h2>
        </header>
        <p id="decision-text" class="decision-text">${tv(card.bodyKey)}</p>
        <div class="decision-options">
          ${card.options.map((o, i) => `
            <button class="decision-option" data-option="${o.id}">
              <span class="decision-key" aria-hidden="true">${i + 1}</span>
              <span class="decision-label">${tv(o.labelKey)}</span>
              <span class="decision-effects">${effectChips(o.effects)}</span>
            </button>`).join('')}
          ${(card.unavailable || []).map((o) => `
            <div class="decision-option unavailable" aria-disabled="true">
              <span class="decision-key" aria-hidden="true">✕</span>
              <span class="decision-label">${tv(o.labelKey)}</span>
              <span class="decision-why">${o.disabledKey ? tv(o.disabledKey) : ''}</span>
            </div>`).join('')}
        </div>
        <p class="decision-error" data-error role="alert" hidden></p>
        <p class="decision-hint">${opts.t('decision.hint', { keys: card.options.map((_, i) => i + 1).join(', ') })}</p>
      </section>`;
    layer.querySelectorAll('[data-option]').forEach((b) => b.addEventListener('click', () => choose(b.dataset.option)));
    layer.querySelector('[data-option]').focus();
  }

  // Numbers in vars follow the language: 0,42 in Turkish, 0.42 in English.
  function localVars(vars = {}) {
    return Object.fromEntries(Object.entries(vars).map(([k, v]) =>
      [k, typeof v === 'number' ? v.toLocaleString(locale(), { maximumFractionDigits: 2 }) : v]));
  }

  function effectChips(effects = []) {
    const parts = effects.flatMap((e) => effectParts(e, { t: opts.t, locale: locale() }));
    if (parts.length === 0) return `<span class="effect neutral">${opts.t('decision.noCost')}</span>`;
    return parts.map((f) => `<span class="effect ${f.tone} ${f.approx ? 'approx' : ''}" title="${f.label}${f.approx ? ` (${opts.t('decision.estimate')})` : ''}">`
      + `${f.ico ? icon(f.ico, { fallback: f.icon }) : `<i aria-hidden="true">${f.icon}</i>`}<span class="sr-only">${f.label} </span>${f.amount}`
      + `${f.note ? ` <small>${f.note}</small>` : ''}</span>`).join('');
  }

  function choose(optionId) {
    if (!current) return;
    const card = current;
    const option = card.options.find((o) => o.id === optionId);
    if (!option) return;
    try {
      card.choose(optionId);
    } catch (err) {
      // The engine refused the choice: keep the card open so the game is not stuck without one.
      console.error('[decisionCard] choose() failed', err);
      const box = layer.querySelector('[data-error]');
      box.textContent = opts.t('decision.failed');
      box.hidden = false;
      return;
    }
    current = null;
    layer.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (queue.length) showNext();
    else if (option.resultKey) showResult(card, option);
  }

  function showResult(card, option) {
    clearResult();
    const line = document.createElement('div');
    line.className = 'decision-result';
    line.setAttribute('role', 'status');
    line.innerHTML = `<span>${opts.t(option.resultKey, localVars(card.vars))}</span><span class="decision-effects">${effectChips(option.effects)}</span>`;
    layer.appendChild(line);
    resultTimer = setTimeout(clearResult, resultMs);
  }

  function clearResult() {
    clearTimeout(resultTimer);
    layer.querySelector('.decision-result')?.remove();
  }

  // Number keys pick an available option; Tab stays inside the card.
  function onKey(e) {
    if (!current) return;
    const buttons = [...layer.querySelectorAll('[data-option]')];
    const n = Number(e.key);
    if (n >= 1 && n <= buttons.length) {
      e.preventDefault();
      choose(buttons[n - 1].dataset.option);
    } else if (e.key === 'Tab') {
      const i = buttons.indexOf(document.activeElement);
      e.preventDefault();
      const next = (i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }
  }

  document.addEventListener('keydown', onKey);
  bus.on('decision:open', onOpen);

  return {
    isOpen: () => Boolean(current),
    destroy: () => {
      bus.off?.('decision:open', onOpen);
      document.removeEventListener('keydown', onKey);
      clearResult();
      layer.remove();
    },
  };
}
