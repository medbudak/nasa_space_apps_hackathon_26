// Decision cards (owner: K3). M2: the player sees what each choice costs before choosing.
//
// This module does not import K1's core files. K1 wires it once from main.js:
//
//   import { mountDecisionCards } from './ui/decisionCard.js';
//   mountDecisionCards(document.body, { bus, t, locale });
//
// It shows the card K2's events.js sends with `decision:open`:
//   {
//     eventId, titleKey, bodyKey,
//     sol?,                                  // optional: shown in the card header
//     options: [{ id, labelKey, resultKey?, effects: [
//       { type: 'resource', stat, delta } | { type: 'wait', sols, estimate } | { type: 'flag', key, value }
//     ]}],
//     choose(choiceId),                      // K2 applies the effects, logs and emits decision:made
//   }
// This module never emits decision:made and changes no state; it only calls choose().
// `resultKey` is optional: when present, a short result line is shown after the choice.

// How each resource stat is shown. `scale` converts the delta to the display unit.
// `worseWhenUp` marks stats where a rise is bad (used for colouring only).
// Units are SI symbols and stay the same in both languages; words come from t().
export const STATS = {
  batteryWh: { icon: '⚡', unit: 'kWh', scale: 1 / 1000 },
  o2Kg: { icon: 'O₂', unit: 'kg' },
  waterKg: { icon: '💧', unit: 'kg' },
  foodKg: { icon: '🥫', unit: 'kg' },
  radiationMSv: { icon: '☢', unit: 'mSv', worseWhenUp: true },
  sanity: { icon: '🧠', unit: '%' },
  dataMbit: { icon: '📡', unit: 'Mbit' },
  score: { icon: '★', unitKey: 'unit.points' },
};

const num = (v, locale) => Math.abs(v).toLocaleString(locale, { maximumFractionDigits: 2 });
const signOf = (v) => (v > 0 ? '+' : v < 0 ? '−' : '±');

function amountText(v, stat, t, locale) {
  const n = num(v, locale);
  const s = signOf(v);
  if (stat.unit === '%') return locale.startsWith('tr') ? `${s}%${n}` : `${s}${n}%`;
  if (stat.unitKey) return `${s}${n} ${t(stat.unitKey)}`;
  return `${s}${n} ${stat.unit}`;
}

function toneOf(v, stat) {
  if (v === 0) return 'neutral';
  return (v > 0) !== Boolean(stat.worseWhenUp) ? 'good' : 'bad';
}

// Pure: turn one K2 effect into display parts, or null when the player should not see it (flags).
// Returns { icon, amount, tone, label, note? }.
export function formatEffect(effect, { t = (k) => k, locale = 'tr-TR' } = {}) {
  if (effect.type === 'resource') {
    const stat = STATS[effect.stat] || { icon: '•', unit: '' };
    const v = (Number(effect.delta) || 0) * (stat.scale ?? 1);
    return { icon: stat.icon, amount: amountText(v, stat, t, locale).trim(), tone: toneOf(v, stat), label: t(`effect.${effect.stat}`) };
  }
  if (effect.type === 'wait') {
    const sols = Number(effect.sols) || 0;
    const notes = Object.entries(effect.estimate || {}).map(([k, d]) => {
      const stat = STATS[k] || { icon: '•', unit: '' };
      return `≈ ${stat.icon} ${amountText(d * (stat.scale ?? 1), stat, t, locale)}`;
    });
    return { icon: '⏱', amount: `+${num(sols, locale)} sol`, tone: 'bad', label: t('effect.wait'), note: notes.join(' ') };
  }
  return null; // flags and unknown types are internal
}

export function mountDecisionCards(root, opts) {
  const { bus, t } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const resultMs = opts.resultMs ?? 3500;
  const queue = [];
  let current = null;
  let lastFocus = null;
  let resultTimer = 0;

  const layer = document.createElement('div');
  layer.className = 'decision-layer';
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
    layer.innerHTML = `
      <div class="decision-backdrop"></div>
      <section class="decision" role="dialog" aria-modal="true" aria-labelledby="decision-title" aria-describedby="decision-text">
        <header class="decision-head">
          <span class="kicker">${t('decision.kicker')}${card.sol !== undefined ? ` · SOL ${card.sol}` : ''}</span>
          <h2 id="decision-title">${t(card.titleKey)}</h2>
        </header>
        <p id="decision-text" class="decision-text">${t(card.bodyKey)}</p>
        <div class="decision-options">
          ${card.options.map((o, i) => `
            <button class="decision-option" data-option="${o.id}">
              <span class="decision-key" aria-hidden="true">${i + 1}</span>
              <span class="decision-label">${t(o.labelKey)}</span>
              <span class="decision-effects">${effectChips(o.effects)}</span>
            </button>`).join('')}
        </div>
        <p class="decision-hint">${t('decision.hint')}</p>
      </section>`;
    layer.querySelectorAll('[data-option]').forEach((b) => b.addEventListener('click', () => choose(b.dataset.option)));
    layer.querySelector('[data-option]').focus();
  }

  function effectChips(effects = []) {
    const parts = effects.map((e) => formatEffect(e, { t, locale: locale() })).filter(Boolean);
    if (parts.length === 0) return `<span class="effect neutral">${t('decision.noCost')}</span>`;
    return parts.map((f) => `<span class="effect ${f.tone}" title="${f.label}"><i aria-hidden="true">${f.icon}</i>`
      + `<span class="sr-only">${f.label} </span>${f.amount}${f.note ? ` <small>${f.note}</small>` : ''}</span>`).join('');
  }

  function choose(optionId) {
    if (!current) return;
    const card = current;
    const option = card.options.find((o) => o.id === optionId);
    if (!option) return;
    current = null;
    layer.innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    try {
      card.choose(optionId);
    } catch (err) {
      console.error('[decisionCard] choose() failed', err);
    }
    if (queue.length) showNext();
    else if (option.resultKey) showResult(option);
  }

  function showResult(option) {
    clearResult();
    const line = document.createElement('div');
    line.className = 'decision-result';
    line.setAttribute('role', 'status');
    line.innerHTML = `<span>${t(option.resultKey)}</span><span class="decision-effects">${effectChips(option.effects)}</span>`;
    layer.appendChild(line);
    resultTimer = setTimeout(clearResult, resultMs);
  }

  function clearResult() {
    clearTimeout(resultTimer);
    layer.querySelector('.decision-result')?.remove();
  }

  // Number keys 1–3 pick an option; Tab stays inside the card.
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
