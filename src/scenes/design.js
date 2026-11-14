// Sol 0 — mission design screens (owner: K3).
//
// This module does not import K1's core files. K1 wires it from main.js:
//
//   import { mountDesign } from './scenes/design.js';
//   mountDesign(rootEl, {
//     data,        // the parsed nasa_data.json (see src/ui/dev/stub_data.js for the expected shape)
//     t,           // text lookup: t('design.title') -> string (content/story.json)
//     evaluate,    // engineering.js: evaluateDesign(design, data) -> { cost, budget, mass, capacity, ... }
//     design,      // optional: an existing gameState.design to resume
//     onChange,    // optional: (design) => void, called on every pick (K1 can save to gameState)
//     onLaunch,    // (design, summary) => void, called when the player launches
//   });
//
// The design object written here is gameState.design (D-003):
//   { objectiveId, rocketId, trajectoryId, siteId, powerId, batteryId, insulationId,
//     instrumentIds: [], commsId, spareKitsId }

import { icon, hasIcon, watchIconErrors } from '../ui/icons.js';

// Icon file name per data group (K4's assets/ui/). Groups K4 has not drawn yet simply show no icon.
const ICON_PREFIX = {
  instruments: 'instr_', objectives: 'obj_', launchVehicles: 'lv_', trajectories: 'traj_',
  powerSources: 'pwr_', comms: 'comms_', insulation: 'ins_',
};
const iconName = (g, id) => (ICON_PREFIX[g] ? `${ICON_PREFIX[g]}${id}` : null);

const STEPS = [
  { id: 'objective', groups: ['objectives'] },
  { id: 'launch', groups: ['launchVehicles', 'trajectories'] },
  { id: 'site', groups: ['landingSites', 'powerSources', 'batteries', 'insulation'] },
  { id: 'instruments', groups: ['instruments'] },
  { id: 'comms', groups: ['comms', 'spareKits'] },
];

// Which design field each data group fills. Instruments are a multi-pick list.
const FIELD = {
  objectives: 'objectiveId',
  launchVehicles: 'rocketId',
  trajectories: 'trajectoryId',
  landingSites: 'siteId',
  powerSources: 'powerId',
  batteries: 'batteryId',
  insulation: 'insulationId',
  instruments: 'instrumentIds',
  comms: 'commsId',
  spareKits: 'spareKitsId',
};

export function emptyDesign() {
  return {
    objectiveId: null, rocketId: null, trajectoryId: null, siteId: null, powerId: null,
    batteryId: null, insulationId: null, instrumentIds: [], commsId: null, spareKitsId: null,
  };
}

// Pure: which problems block the launch. Used by the screen and by tests.
// `summary` is the result of evaluate(design, data).
export function launchBlockers(design, data, summary) {
  const out = [];
  for (const [group, field] of Object.entries(FIELD)) {
    if (field === 'instrumentIds') continue;
    if (!design[field]) out.push({ code: 'missing', group });
  }
  const max = data.rules.maxInstruments.value;
  if (design.instrumentIds.length > max) out.push({ code: 'tooManyInstruments', max });
  // A limit that is still unresearched (null in nasa_data.json, so 0 here) cannot be checked:
  // the bar shows "?" instead of blocking every design.
  if (summary.budget > 0 && summary.cost > summary.budget) out.push({ code: 'overBudget' });
  if (summary.capacity > 0 && summary.mass > summary.capacity) out.push({ code: 'overMass' });
  if (summary.nightNeedKWh > summary.batteryKWh) out.push({ code: 'nightPower' });
  return out;
}

// The step the player was on, so a remount (e.g. after a language switch) does not send them back to step 1.
let lastStep = 0;

export function mountDesign(root, opts) {
  const { data, t, evaluate, onLaunch } = opts;
  const onChange = opts.onChange || (() => {});
  const design = Object.assign(emptyDesign(), opts.design || {});
  const started = Object.values(design).some((v) => (Array.isArray(v) ? v.length : v));
  let step = started ? lastStep : 0; // a new game starts at step 1

  root.classList.add('design');
  watchIconErrors(root);
  root.innerHTML = `
    <header class="design-head">
      <div class="design-title">
        <span class="kicker">${t('design.kicker')}</span>
        <h1>${t('design.title')}</h1>
        <span class="flag" data-unresearched hidden></span>
      </div>
      <div class="bars" data-bars></div>
    </header>
    <nav class="steps" data-steps></nav>
    <main class="design-body" data-body></main>
    <footer class="design-foot">
      <button class="btn ghost" data-prev>${t('design.prev')}</button>
      <div class="blockers" data-blockers aria-live="polite"></div>
      <button class="btn" data-next>${t('design.next')}</button>
      <button class="btn launch" data-launch hidden>${t('design.launch')}</button>
    </footer>`;

  const $ = (sel) => root.querySelector(sel);
  const el = { bars: $('[data-bars]'), steps: $('[data-steps]'), body: $('[data-body]'),
    blockers: $('[data-blockers]'), prev: $('[data-prev]'), next: $('[data-next]'), launch: $('[data-launch]') };

  el.prev.addEventListener('click', () => go(step - 1));
  el.next.addEventListener('click', () => go(step + 1));
  el.launch.addEventListener('click', () => {
    const summary = evaluate(design, data);
    if (launchBlockers(design, data, summary).length === 0) onLaunch(structuredClone(design), summary);
  });

  function go(i) {
    step = Math.max(0, Math.min(STEPS.length - 1, i));
    lastStep = step;
    render();
    el.body.scrollTop = 0;
    el.body.focus({ preventScroll: true });
  }

  function pick(group, id) {
    const field = FIELD[group];
    if (field === 'instrumentIds') {
      const list = design.instrumentIds;
      const at = list.indexOf(id);
      if (at >= 0) list.splice(at, 1);
      else if (list.length < data.rules.maxInstruments.value) list.push(id);
    } else {
      design[field] = id;
    }
    onChange(structuredClone(design));
    render();
  }

  // ---- rendering ---------------------------------------------------------

  function render() {
    const summary = evaluate(design, data);
    renderBars(summary);
    renderSteps();
    renderBody(summary);
    renderFoot(summary);
  }

  function renderBars(s) {
    const marginPct = s.capacity > 0 ? Math.round(((s.capacity - s.mass) / s.capacity) * 100) : 0;
    // Unresearched values count as 0 in the totals; say how many, so the numbers are not oversold.
    const unknown = s.unresearched?.length || 0;
    const flag = root.querySelector('[data-unresearched]');
    flag.hidden = unknown === 0;
    flag.textContent = t('design.unresearched').replace('{n}', unknown);
    flag.title = (s.unresearched || []).join(', ');
    el.bars.innerHTML = [
      s.budget > 0
        ? bar('budget', s.cost, s.budget, `${fmt(s.cost)} / ${fmt(s.budget)} ${t('unit.musd')}`, s.cost > s.budget)
        : bar('budget', 0, 0, `${fmt(s.cost)} / ? ${t('unit.musd')}`, false),
      bar('mass', s.mass, s.capacity,
        s.capacity ? `${fmt(s.mass)} / ${fmt(s.capacity)} kg · ${t('design.margin')} ${marginPct}%` : `${fmt(s.mass)} kg · ${t('design.pickRocket')}`,
        s.capacity > 0 && s.mass > s.capacity, s.capacity > 0 && marginPct >= data.rules.massMarginBonusPct.value),
      design.batteryId
        ? bar('night', s.nightNeedKWh, s.batteryKWh,
          `${fmt(s.nightNeedKWh, 1)} / ${fmt(s.batteryKWh, 1)} kWh`, s.nightNeedKWh > s.batteryKWh)
        : bar('night', 0, 0, `${fmt(s.nightNeedKWh, 1)} kWh · ${t('design.pickBattery')}`, false),
    ].join('');
  }

  function bar(key, value, max, label, over, good = false) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : (value > 0 ? 100 : 0);
    const cls = over ? 'over' : good ? 'good' : '';
    return `<div class="bar ${cls}" title="${t(`design.bar.${key}.help`)}">
      <div class="bar-label"><span>${t(`design.bar.${key}`)}</span><span class="num">${label}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }

  function renderSteps() {
    el.steps.innerHTML = STEPS.map((s, i) => {
      const done = s.groups.every((g) => FIELD[g] === 'instrumentIds' ? design.instrumentIds.length > 0 : design[FIELD[g]]);
      return `<button class="step ${i === step ? 'on' : ''} ${done ? 'done' : ''}" data-step="${i}">
        <span class="step-n">${i + 1}</span>${t(`design.step.${s.id}`)}</button>`;
    }).join('');
    el.steps.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.step)));
  }

  function renderBody(summary) {
    const s = STEPS[step];
    el.body.innerHTML = `<p class="step-intro">${t(`design.step.${s.id}.intro`)}</p>` +
      s.groups.map((g) => group(g, summary)).join('');
    el.body.setAttribute('tabindex', '-1');
    el.body.querySelectorAll('[data-pick]').forEach((card) => {
      card.addEventListener('click', () => pick(card.dataset.group, card.dataset.pick));
    });
  }

  function group(g, summary) {
    const field = FIELD[g];
    const multi = field === 'instrumentIds';
    const max = data.rules.maxInstruments.value;
    const head = multi
      ? `${t(`design.group.${g}`)} <span class="count ${design.instrumentIds.length >= max ? 'full' : ''}">${design.instrumentIds.length} / ${max}</span>`
      : t(`design.group.${g}`);
    const cards = (data[g] || []).map((opt) => {
      const on = multi ? design.instrumentIds.includes(opt.id) : design[field] === opt.id;
      const locked = multi && !on && design.instrumentIds.length >= max;
      const ico = iconName(g, opt.id);
      const withIco = ico && hasIcon(ico);
      return `<button class="card ${on ? 'on' : ''} ${locked ? 'locked' : ''} ${withIco ? 'has-ico' : ''}" data-group="${g}" data-pick="${opt.id}"
          aria-pressed="${on}" ${locked ? 'aria-disabled="true"' : ''}>
        ${withIco ? icon(ico, { size: 48, className: 'card-ico' }) : ''}
        <span class="card-name">${t(`${g}.${opt.id}.name`)}</span>
        ${opt.realName ? `<span class="card-real">${opt.realName}</span>` : ''}
        <span class="card-stats">${stats(g, opt, summary)}</span>
        <span class="card-desc">${t(`${g}.${opt.id}.desc`)}</span>
        ${multi ? `<span class="card-gain"><b>${t('design.unlocks')}</b> ${t(`${g}.${opt.id}.gain`)}</span>
                   <span class="card-loss"><b>${t('design.without')}</b> ${t(`${g}.${opt.id}.loss`)}</span>` : ''}
        ${placeholderFlag(opt)}
      </button>`;
    }).join('');
    // A table missing from nasa_data.json shows a visible note instead of an empty row.
    const body = cards || `<p class="flag">${t('design.noData')} (nasa_data.json: ${g})</p>`;
    return `<section class="group"><h2>${head}</h2><div class="cards ${multi ? 'cards-wide' : ''}">${body}</div></section>`;
  }

  // Shows the numbers that matter for each kind of choice, always with a unit. Every number comes
  // from data. A value that is still unresearched (null) shows as "?" instead of a made-up 0.
  function stats(g, o) {
    const chips = [];
    const has = (k) => Boolean(o[k] && typeof o[k] === 'object' && 'value' in o[k]);
    const v = (k) => o[k].value;
    const n = (k, digits = 0) => (v(k) == null ? '?' : fmt(v(k), digits));
    const add = (k, icon, text) => { if (has(k)) chips.push(chip(icon, text(), v(k) == null)); };
    add('costMUSD', '$', () => `${n('costMUSD')} ${t('unit.musd')}`);
    add('massKg', 'kg', () => `${n('massKg', v('massKg') != null && v('massKg') < 10 ? 1 : 0)} kg`);
    add('rtgMassKg', 'kg', () => `+${n('rtgMassKg')} kg RTG`);
    add('capacityKg', '↑', () => `${n('capacityKg')} kg ${t('design.toMars')}`);
    add('transitDays', '⏱', () => `${n('transitDays')} ${t('unit.days')}`);
    add('powerW', '⚡', () => `${n('powerW', 1)} W`);
    if (has('continuousW') && v('continuousW') !== 0) add('continuousW', '⚡', () => `+${n('continuousW')} W ${t('design.dayNight')}`);
    add('capacityKWh', '🔋', () => `${n('capacityKWh')} kWh`);
    add('mbitPerUse', '📡', () => `${n('mbitPerUse', 2)} Mbit`);
    add('mbitPerSol', '📡', () => `${n('mbitPerSol')} Mbit/sol`);
    add('latitudeDeg', '°', () => `${n('latitudeDeg', 1)}°`);
    add('nightMinC', '❄', () => `${n('nightMinC')} °C`);
    add('scoreMultiplier', '×', () => `×${v('scoreMultiplier') ?? '?'}`);
    return chips.join('');
  }

  function chip(icon, text, unknown = false) {
    return `<span class="chip ${unknown ? 'unknown' : ''}" ${unknown ? `title="${t('design.placeholder')}"` : ''}>`
      + `<i aria-hidden="true">${icon}</i>${text}</span>`;
  }

  function placeholderFlag(o) {
    const anyPlaceholder = Object.values(o).some((x) => x && typeof x === 'object' && x.src === 'PLACEHOLDER');
    return anyPlaceholder ? `<span class="flag" title="src: PLACEHOLDER">${t('design.placeholder')}</span>` : '';
  }

  function renderFoot(summary) {
    const blockers = launchBlockers(design, data, summary);
    const last = step === STEPS.length - 1;
    el.prev.disabled = step === 0;
    el.next.hidden = last;
    el.launch.hidden = !last;
    el.launch.disabled = blockers.length > 0;
    el.blockers.innerHTML = blockers.length === 0
      ? `<span class="ok">${t('design.ready')}</span>`
      : blockers.slice(0, 3).map((b) => `<span class="warn">${t(`design.block.${b.code}`)
          .replace('{group}', b.group ? t(`design.group.${b.group}`) : '')
          .replace('{max}', b.max ?? '')}</span>`).join('');
  }

  function fmt(n, digits = 0) {
    return Number(n || 0).toLocaleString(opts.locale || 'tr-TR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }

  render();
  return {
    getDesign: () => structuredClone(design),
    destroy: () => { root.innerHTML = ''; root.classList.remove('design'); },
  };
}
