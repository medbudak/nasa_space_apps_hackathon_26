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
  if (summary.cost > summary.budget) out.push({ code: 'overBudget' });
  if (summary.mass > summary.capacity) out.push({ code: 'overMass' });
  if (summary.nightNeedKWh > summary.batteryKWh) out.push({ code: 'nightPower' });
  return out;
}

export function mountDesign(root, opts) {
  const { data, t, evaluate, onLaunch } = opts;
  const onChange = opts.onChange || (() => {});
  const design = Object.assign(emptyDesign(), opts.design || {});
  let step = 0;

  root.classList.add('design');
  root.innerHTML = `
    <header class="design-head">
      <div class="design-title">
        <span class="kicker">${t('design.kicker')}</span>
        <h1>${t('design.title')}</h1>
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
    el.bars.innerHTML = [
      bar('budget', s.cost, s.budget, `${fmt(s.cost)} / ${fmt(s.budget)} ${t('unit.musd')}`, s.cost > s.budget),
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
    const cards = data[g].map((opt) => {
      const on = multi ? design.instrumentIds.includes(opt.id) : design[field] === opt.id;
      const locked = multi && !on && design.instrumentIds.length >= max;
      return `<button class="card ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-group="${g}" data-pick="${opt.id}"
          aria-pressed="${on}" ${locked ? 'aria-disabled="true"' : ''}>
        <span class="card-name">${t(`${g}.${opt.id}.name`)}</span>
        ${opt.realName ? `<span class="card-real">${opt.realName}</span>` : ''}
        <span class="card-stats">${stats(g, opt, summary)}</span>
        <span class="card-desc">${t(`${g}.${opt.id}.desc`)}</span>
        ${multi ? `<span class="card-gain"><b>${t('design.unlocks')}</b> ${t(`${g}.${opt.id}.gain`)}</span>
                   <span class="card-loss"><b>${t('design.without')}</b> ${t(`${g}.${opt.id}.loss`)}</span>` : ''}
        ${placeholderFlag(opt)}
      </button>`;
    }).join('');
    return `<section class="group"><h2>${head}</h2><div class="cards ${multi ? 'cards-wide' : ''}">${cards}</div></section>`;
  }

  // Shows the numbers that matter for each kind of choice. Every number comes from data.
  function stats(g, o) {
    const chips = [];
    const v = (k) => (o[k] ? o[k].value : undefined);
    if (v('costMUSD') !== undefined) chips.push(chip('$', `${fmt(v('costMUSD'))} ${t('unit.musd')}`));
    if (v('massKg') !== undefined) chips.push(chip('kg', `${fmt(v('massKg'), v('massKg') < 10 ? 1 : 0)} kg`));
    if (v('capacityKg') !== undefined) chips.push(chip('↑', `${fmt(v('capacityKg'))} kg ${t('design.toMars')}`));
    if (v('transitDays') !== undefined) chips.push(chip('⏱', `${fmt(v('transitDays'))} ${t('unit.days')}`));
    if (v('powerW') !== undefined) chips.push(chip('⚡', `${fmt(v('powerW'))} W`));
    if (v('continuousW') !== undefined) chips.push(chip('⚡', `+${fmt(v('continuousW'))} W ${t('design.dayNight')}`));
    if (v('capacityKWh') !== undefined) chips.push(chip('🔋', `${fmt(v('capacityKWh'))} kWh`));
    if (v('mbitPerUse') !== undefined) chips.push(chip('📡', `${fmt(v('mbitPerUse'))} Mbit`));
    if (v('mbitPerSol') !== undefined) chips.push(chip('📡', `${fmt(v('mbitPerSol'))} Mbit/sol`));
    if (v('latitudeDeg') !== undefined) chips.push(chip('°', `${fmt(v('latitudeDeg'))}°`));
    if (v('nightMinC') !== undefined) chips.push(chip('❄', `${fmt(v('nightMinC'))} °C`));
    if (v('scoreMultiplier') !== undefined) chips.push(chip('×', `×${v('scoreMultiplier')}`));
    return chips.join('');
  }

  function chip(icon, text) { return `<span class="chip"><i aria-hidden="true">${icon}</i>${text}</span>`; }

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
