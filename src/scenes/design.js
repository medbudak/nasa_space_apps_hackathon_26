// Sol 0 — mission design screens (owner: K3).
//
// Scene for src/main.js (D-003): the default export is { enter(ctx), exit() }.
// It can also be mounted on its own (dev page, tests) with mountDesign(root, opts):
//
//   mountDesign(rootEl, {
//     data,        // parsed nasa_data.json (K1's format: table rows with mass_kg, cost_musd, ..., src)
//     t,           // text lookup: t('design.title') -> string
//     evaluate,    // engineering.js evaluateDesign(design, data) -> { cost, budget, mass, capacity, nightNeedKWh, batteryKWh }
//     design,      // optional: gameState.design to resume from
//     onChange,    // optional: (design) => void, called on every pick with the new gameState.design fields
//     onLaunch,    // (design, summary) => void
//     locale,      // optional: 'tr-TR' | 'en-US' for number formatting
//   });
//
// `design` here is always K1's gameState.design shape (src/core/state.js):
//   { objective, rocketId, trajectoryId, landingSiteId, power: { solarArea_m2, rtg, battery_kWh },
//     insulation, instruments: [], comms, spareKits, totalMass_kg, totalCost_musd }
// Inside the screen the player's picks are kept as option ids per group; toStateDesign() and
// picksFromState() convert between the two.

// Objective ids come from the gameState.design schema (state.js); they carry no numbers.
export const OBJECTIVES = ['forensics', 'experiments', 'balanced'];

// Each group: where its options come from in nasa_data.json, and whether it is multi-pick.
export const GROUPS = {
  objectives: {},
  rockets: { table: 'rockets' },
  trajectories: { table: 'trajectories' },
  landingSites: { table: 'landingSites' },
  powerOptions: { table: 'powerOptions' },
  batteries: { table: 'batteries' },
  insulation: { table: 'insulation' },
  instruments: { table: 'instruments', multi: true },
  commsOptions: { table: 'commsOptions' },
  spareKits: { table: 'spareKits' },
};

const STEPS = [
  { id: 'objective', groups: ['objectives'] },
  { id: 'launch', groups: ['rockets', 'trajectories'] },
  { id: 'site', groups: ['landingSites', 'powerOptions', 'batteries', 'insulation'] },
  { id: 'instruments', groups: ['instruments'] },
  { id: 'comms', groups: ['commsOptions', 'spareKits'] },
];

export function options(group, data) {
  if (group === 'objectives') return OBJECTIVES.map((id) => ({ id }));
  return data[GROUPS[group].table] || [];
}

const rowOf = (data, group, id) => options(group, data).find((o) => o.id === id);
const maxInstruments = (data) => data.tuning.maxInstruments.value;

export function emptyPicks() {
  const p = {};
  for (const [g, def] of Object.entries(GROUPS)) p[g] = def.multi ? [] : null;
  return p;
}

// Pure: the player's picks -> K1's gameState.design fields (totals are added at launch).
export function toStateDesign(picks, data) {
  const power = rowOf(data, 'powerOptions', picks.powerOptions);
  const battery = rowOf(data, 'batteries', picks.batteries);
  const kit = rowOf(data, 'spareKits', picks.spareKits);
  return {
    objective: picks.objectives,
    rocketId: picks.rockets,
    trajectoryId: picks.trajectories,
    landingSiteId: picks.landingSites,
    power: {
      solarArea_m2: power ? power.solarArea_m2 : 0,
      rtg: power ? Boolean(power.rtg) : false,
      battery_kWh: battery ? battery.capacity_kWh : 0,
    },
    insulation: picks.insulation,
    instruments: [...picks.instruments],
    comms: picks.commsOptions,
    spareKits: kit ? kit.count : 0,
  };
}

// Pure: K1's gameState.design -> picks, to resume a saved run. Unset fields stay unpicked.
export function picksFromState(design, data) {
  const picks = emptyPicks();
  if (!design) return picks;
  const has = (group, id) => (id != null && rowOf(data, group, id) ? id : null);
  picks.objectives = OBJECTIVES.includes(design.objective) ? design.objective : null;
  picks.rockets = has('rockets', design.rocketId);
  picks.trajectories = has('trajectories', design.trajectoryId);
  picks.landingSites = has('landingSites', design.landingSiteId);
  picks.insulation = has('insulation', design.insulation);
  picks.commsOptions = has('commsOptions', design.comms);
  picks.instruments = (design.instruments || []).filter((id) => rowOf(data, 'instruments', id));
  const p = design.power || {};
  if (p.solarArea_m2 > 0 || p.rtg) {
    picks.powerOptions = options('powerOptions', data)
      .find((o) => Boolean(o.rtg) === Boolean(p.rtg) && o.solarArea_m2 === p.solarArea_m2)?.id ?? null;
  }
  if (p.battery_kWh > 0) picks.batteries = options('batteries', data).find((o) => o.capacity_kWh === p.battery_kWh)?.id ?? null;
  // spareKits 0 is a real choice, so it only counts as picked once the comms screen was filled in.
  if (design.comms != null) picks.spareKits = options('spareKits', data).find((o) => o.count === design.spareKits)?.id ?? null;
  return picks;
}

// Pure: which problems block the launch. `summary` is evaluate(design, data).
export function launchBlockers(picks, data, summary) {
  const out = [];
  for (const [group, def] of Object.entries(GROUPS)) {
    if (!def.multi && !picks[group]) out.push({ code: 'missing', group });
  }
  const max = maxInstruments(data);
  if (picks.instruments.length > max) out.push({ code: 'tooManyInstruments', max });
  if (summary.cost > summary.budget) out.push({ code: 'overBudget' });
  if (summary.mass > summary.capacity) out.push({ code: 'overMass' });
  if (summary.nightNeedKWh > summary.batteryKWh) out.push({ code: 'nightPower' });
  return out;
}

export function mountDesign(root, opts) {
  const { data, t, evaluate, onLaunch } = opts;
  const onChange = opts.onChange || (() => {});
  const picks = Object.assign(emptyPicks(), picksFromState(opts.design, data));
  const design = () => toStateDesign(picks, data);
  let step = 0;

  // Text with a fallback: proper nouns (rocket and site names) come from data when story.json has no entry.
  const tx = (key, fallback = '') => { const s = t(key); return s === key ? fallback : s; };

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
    const d = design();
    const summary = evaluate(d, data);
    if (launchBlockers(picks, data, summary).length === 0) {
      onLaunch({ ...d, totalMass_kg: summary.mass, totalCost_musd: summary.cost }, summary);
    }
  });

  function go(i) {
    step = Math.max(0, Math.min(STEPS.length - 1, i));
    render();
    el.body.scrollTop = 0;
    el.body.focus({ preventScroll: true });
  }

  function pick(group, id) {
    if (GROUPS[group].multi) {
      const list = picks[group];
      const at = list.indexOf(id);
      if (at >= 0) list.splice(at, 1);
      else if (list.length < maxInstruments(data)) list.push(id);
    } else {
      picks[group] = id;
    }
    onChange(design());
    render();
  }

  // ---- rendering ---------------------------------------------------------

  function render() {
    const summary = evaluate(design(), data);
    renderBars(summary);
    renderSteps();
    renderBody();
    renderFoot(summary);
  }

  function renderBars(s) {
    const margin = s.capacity > 0 ? (s.capacity - s.mass) / s.capacity : 0;
    const marginPct = Math.round(margin * 100);
    el.bars.innerHTML = [
      bar('budget', s.cost, s.budget, `${fmt(s.cost)} / ${fmt(s.budget)} ${t('unit.musd')}`, s.cost > s.budget),
      bar('mass', s.mass, s.capacity,
        s.capacity ? `${fmt(s.mass)} / ${fmt(s.capacity)} kg · ${t('design.margin')} ${marginPct}%` : `${fmt(s.mass)} kg · ${t('design.pickRocket')}`,
        s.capacity > 0 && s.mass > s.capacity, s.capacity > 0 && margin >= data.tuning.massMarginBonusThreshold.value),
      picks.batteries
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
      const done = s.groups.every((g) => (GROUPS[g].multi ? picks[g].length > 0 : picks[g]));
      return `<button class="step ${i === step ? 'on' : ''} ${done ? 'done' : ''}" data-step="${i}">
        <span class="step-n">${i + 1}</span>${t(`design.step.${s.id}`)}</button>`;
    }).join('');
    el.steps.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.step)));
  }

  function renderBody() {
    const s = STEPS[step];
    el.body.innerHTML = `<p class="step-intro">${t(`design.step.${s.id}.intro`)}</p>` +
      s.groups.map(group).join('');
    el.body.setAttribute('tabindex', '-1');
    el.body.querySelectorAll('[data-pick]').forEach((card) => {
      card.addEventListener('click', () => pick(card.dataset.group, card.dataset.pick));
    });
  }

  function group(g) {
    const multi = Boolean(GROUPS[g].multi);
    const max = maxInstruments(data);
    const head = multi
      ? `${t(`design.group.${g}`)} <span class="count ${picks[g].length >= max ? 'full' : ''}">${picks[g].length} / ${max}</span>`
      : t(`design.group.${g}`);
    const cards = options(g, data).map((opt) => {
      const on = multi ? picks[g].includes(opt.id) : picks[g] === opt.id;
      const locked = multi && !on && picks[g].length >= max;
      const desc = tx(`${g}.${opt.id}.desc`);
      const name = tx(`${g}.${opt.id}.name`, opt.name || opt.id);
      // Real hardware name under the game name: instruments have realCounterpart, rockets and sites a name.
      const real = opt.realCounterpart || (opt.name && opt.name !== name ? opt.name : '');
      return `<button class="card ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-group="${g}" data-pick="${opt.id}"
          aria-pressed="${on}" ${locked ? 'aria-disabled="true"' : ''}>
        <span class="card-name">${name}</span>
        ${real ? `<span class="card-real">${real}</span>` : ''}
        <span class="card-stats">${stats(opt)}</span>
        ${desc ? `<span class="card-desc">${desc}</span>` : ''}
        ${multi ? `<span class="card-gain"><b>${t('design.unlocks')}</b> ${t(`${g}.${opt.id}.gain`)}</span>
                   <span class="card-loss"><b>${t('design.without')}</b> ${t(`${g}.${opt.id}.loss`)}</span>` : ''}
        ${opt.src === 'PLACEHOLDER' ? `<span class="flag" title="src: PLACEHOLDER">${t('design.placeholder')}</span>` : ''}
      </button>`;
    }).join('');
    // A table missing from nasa_data.json shows a visible note instead of an empty row.
    const body = cards || `<p class="flag">${t('design.noData')} (nasa_data.json: ${GROUPS[g].table})</p>`;
    return `<section class="group"><h2>${head}</h2><div class="cards ${multi ? 'cards-wide' : ''}">${body}</div></section>`;
  }

  // The numbers that matter for each kind of choice, always with a unit. Every number comes from data.
  function stats(o) {
    const c = [];
    const has = (k) => typeof o[k] === 'number';
    if (has('cost_musd')) c.push(chip('$', `${fmt(o.cost_musd)} ${t('unit.musd')}`));
    if (has('mass_kg')) c.push(chip('kg', `${fmt(o.mass_kg, o.mass_kg < 10 ? 1 : 0)} kg`));
    if (has('capacityToMars_kg')) c.push(chip('↑', `${fmt(o.capacityToMars_kg)} kg ${t('design.toMars')}`));
    if (has('transit_days')) c.push(chip('⏱', `${fmt(o.transit_days)} ${t('unit.days')}`));
    if (has('power_W')) c.push(chip('⚡', `${fmt(o.power_W)} W`));
    if (has('solarArea_m2')) c.push(chip('☀', `${fmt(o.solarArea_m2)} m²`));
    if (o.rtg && data.power?.rtgOutput) c.push(chip('⚡', `+${fmt(data.power.rtgOutput.value)} W ${t('design.dayNight')}`));
    if (has('capacity_kWh')) c.push(chip('🔋', `${fmt(o.capacity_kWh)} kWh`));
    if (has('data_Mbit') && o.data_Mbit > 0) c.push(chip('📡', `${fmt(o.data_Mbit)} Mbit`));
    if (has('dataPerSol_Mbit')) c.push(chip('📡', `${fmt(o.dataPerSol_Mbit)} Mbit/sol`));
    if (has('latitude_deg')) c.push(chip('°', `${fmt(o.latitude_deg, 1)}°`));
    if (has('nightMin_C')) c.push(chip('❄', `${fmt(o.nightMin_C)} °C`));
    return c.join('');
  }

  function chip(icon, text) { return `<span class="chip"><i aria-hidden="true">${icon}</i>${text}</span>`; }

  function renderFoot(summary) {
    const blockers = launchBlockers(picks, data, summary);
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
    getDesign: design,
    destroy: () => { root.innerHTML = ''; root.classList.remove('design'); },
  };
}

// ---- scene for src/main.js ------------------------------------------------

let screen = null;

export default {
  // ctx = { state, data, bus, t, goTo, canvas, ui } (D-003)
  async enter(ctx) {
    const { state, data, t, goTo, ui } = ctx;
    // Loaded here, not at the top, so tests can import this file without K1's core files.
    const eng = await import('../core/engineering.js');
    let evaluate = eng.evaluateDesign;
    if (!evaluate) {
      // TEMPORARY until K1 adds evaluateDesign to engineering.js (D-003: formulas live there).
      console.warn('[design] engineering.js has no evaluateDesign yet: using the K3 dev stub');
      evaluate = (await import('../ui/dev/stub_evaluate.js')).evaluateDesign;
    }
    let locale = 'en-US';
    try { locale = (await import('../core/i18n.js')).getLang() === 'tr' ? 'tr-TR' : 'en-US'; } catch { /* keep en-US */ }

    const host = document.createElement('div');
    ui.appendChild(host);
    screen = mountDesign(host, {
      data, t, evaluate, locale,
      design: state.design,
      // state.js: change values, never replace sub-objects.
      onChange: (d) => {
        const { power, ...rest } = d;
        Object.assign(state.design, rest);
        Object.assign(state.design.power, power);
      },
      onLaunch: (d) => {
        const { power, ...rest } = d;
        Object.assign(state.design, rest);
        Object.assign(state.design.power, power);
        goTo('surface');
      },
    });
  },
  exit() {
    screen?.destroy();
    screen = null;
  },
};
