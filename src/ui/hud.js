// HUD (owner: K3): six status bars, the EVA suit-oxygen bar with the point-of-no-return notch (M4),
// and tabs for Telemetry, Downlink and Power.
//
// K2 mounts it in the surface scene:
//   const hud = mountHud(el, {
//     state, data, t, locale, bus,
//     telemetry,                                   // createTelemetry() from ./telemetry.js
//     downlink: { passes, lightDelaySec },         // see ./downlink.js
//     power: { getStatus, setOrder },              // K2 power.js, see ./powerPanel.js
//     refreshMs: 500,
//   });
//   hud.openTab('telemetry');                      // e.g. from an alarm: "check it on telemetry"
//
// Bars read gameState (K1 schema + K2 sub-objects) and limits from nasa_data.json. A limit that is not
// in the data yet shows as "?" instead of an invented number.

import { mountTelemetry } from './telemetry.js';
import { mountDownlink } from './downlink.js';
import { mountPowerPanel } from './powerPanel.js';

// Display thresholds for bar colour only (share of the bar left). They change no game rule.
const WARN = 0.3;
const BAD = 0.15;

const num = (entry) => (entry && typeof entry.value === 'number' ? entry.value : null);
const levelLeft = (share) => (share == null ? 'ok' : share <= BAD ? 'bad' : share <= WARN ? 'warn' : 'ok');
const levelUsed = (share) => (share == null ? 'ok' : share >= 1 - BAD ? 'bad' : share >= 1 - WARN ? 'warn' : 'ok');

/**
 * Pure: the bars to draw. Each: { id, icon, value, max, unit, digits, fill (0..1 | null), level, note? }.
 * note: { key, vars } for a short line under the bar.
 */
export function hudBars(state, data) {
  const p = state.power || {};
  const life = state.life || {};
  const env = state.env || {};
  const db = state.dataBudget || {};
  const bars = [];

  // Energy
  const capKWh = p.batteryCapacityWh ? p.batteryCapacityWh / 1000 : null;
  const kWh = typeof p.batteryWh === 'number' ? p.batteryWh / 1000 : null;
  const eShare = capKWh && kWh != null ? kWh / capKWh : null;
  bars.push({ id: 'energy', icon: '⚡', value: kWh, max: capKWh, unit: 'kWh', digits: 1, fill: eShare, level: levelLeft(eShare) });

  // Oxygen: shown as days left at the sourced consumption rate.
  const o2 = typeof life.o2Kg === 'number' ? life.o2Kg : null;
  const o2Max = num(data.life?.o2StartKg);
  const perDay = (num(data.life?.o2KgPerCrewPerDay) ?? 0) * (num(data.life?.crew) ?? 1);
  const days = o2 != null && perDay > 0 ? o2 / perDay : null;
  const o2Share = o2 != null && o2Max ? o2 / o2Max : null;
  bars.push({ id: 'o2', icon: 'O₂', value: o2, max: o2Max, unit: 'kg', digits: 1, fill: o2Share,
    level: days != null ? (days < 1 ? 'bad' : days < 3 ? 'warn' : 'ok') : levelLeft(o2Share),
    note: days != null ? { key: 'hud.o2Days', vars: { days: Math.floor(days * 10) / 10 } } : null });

  // Heat: inside temperature between the cold threshold and the habitat target.
  const inside = typeof env.insideC === 'number' ? env.insideC : null;
  const target = num(data.thermal?.habitatTargetC);
  const coldBelow = num(data.thermal?.bodyColdBelowC);
  const heatShare = inside != null && target != null && coldBelow != null
    ? Math.max(0, Math.min(1, (inside - coldBelow) / (target - coldBelow))) : null;
  const coldHours = life.body?.coldHours ?? 0;
  const coldLimit = num(data.rules?.coldLossHours);
  bars.push({ id: 'heat', icon: '🌡', value: inside, max: target, unit: '°C', digits: 0, fill: heatShare,
    level: life.body?.cold ? 'bad' : levelLeft(heatShare),
    note: life.body?.cold ? { key: 'hud.coldFor', vars: { h: Math.round(coldHours * 10) / 10, limit: coldLimit ?? '?' } } : null });

  // Radiation: cumulative dose against the mission limit (a rise is bad).
  const dose = typeof life.radiationMSv === 'number' ? life.radiationMSv : null;
  const limit = num(data.rules?.radiationLimitMSv);
  const rShare = dose != null && limit ? dose / limit : null;
  bars.push({ id: 'radiation', icon: '☢', value: dose, max: limit, unit: 'mSv', digits: 1, fill: rShare, level: levelUsed(rShare) });

  // Sanity: 0..100, created by K2's sanity.js.
  const sanity = typeof life.sanity === 'number' ? life.sanity : null;
  bars.push({ id: 'sanity', icon: '🧠', value: sanity, max: 100, unit: '%', digits: 0,
    fill: sanity != null ? sanity / 100 : null, level: levelLeft(sanity != null ? sanity / 100 : null) });

  // Data: used this sol against the relay capacity, and how much is waiting.
  const used = db.used ?? 0;
  const perSol = db.perSol || null;
  const dShare = perSol ? used / perSol : null;
  bars.push({ id: 'data', icon: '📡', value: used, max: perSol, unit: 'Mbit', digits: 0, fill: dShare, level: 'ok',
    note: db.queue?.length ? { key: 'hud.queued', vars: { n: db.queue.length } } : null });

  return bars;
}

/**
 * Pure: the EVA suit bar with the no-return notch, or null when inside.
 * startKg: suit O2 when this EVA began (the HUD remembers it; gameState has no field for it).
 */
export function evaBar(state, startKg = 0) {
  const eva = state.life?.eva;
  if (!eva?.outside) return null;
  const max = Math.max(startKg, eva.suitO2Kg, eva.requiredO2Kg, 1e-9);
  return {
    value: eva.suitO2Kg,
    required: eva.requiredO2Kg,
    fill: eva.suitO2Kg / max,
    notch: eva.requiredO2Kg / max,
    noReturn: Boolean(eva.noReturn),
    distanceM: eva.distanceM,
  };
}

const TABS = ['telemetry', 'downlink', 'power'];

export function mountHud(el, opts) {
  const { state, data, t, bus } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const fmt = (n, d = 0) => (n == null ? '?' : Number(n).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d }));
  let tab = null; // open tab id, or null when collapsed
  let panel = null; // mounted panel in the open tab
  let timer = 0;
  let evaStart = 0;

  el.classList.add('hud');
  el.innerHTML = `
    <div class="hud-bars" data-bars></div>
    <div class="hud-eva" data-eva></div>
    <div class="hud-tabs" role="tablist" aria-label="${t('hud.tabs')}">
      ${TABS.map((id) => `<button role="tab" class="hud-tab" data-tab="${id}" aria-selected="false" aria-controls="hud-panel">${t(`hud.tab.${id}`)}</button>`).join('')}
    </div>
    <div class="hud-panel" id="hud-panel" role="tabpanel" data-panel hidden></div>`;

  const $ = (s) => el.querySelector(s);

  function renderBars() {
    el.querySelectorAll('[data-tab]').forEach((b) => { b.textContent = t(`hud.tab.${b.dataset.tab}`); }); // follows the language
    $('[data-bars]').innerHTML = hudBars(state, data).map((b) => `
      <div class="hud-bar ${b.level} ${b.fill == null && b.value != null ? 'nomax' : ''}" title="${t(`hud.bar.${b.id}.help`)}">
        <div class="hud-bar-label"><span><i aria-hidden="true">${b.icon}</i> ${t(`hud.bar.${b.id}`)}</span>
          <b>${b.value == null ? '—' : fmt(b.value, b.digits)}${b.max != null ? ` / ${fmt(b.max, b.digits)}` : b.value == null ? '' : ' / ?'} ${b.unit}</b></div>
        <div class="bar-track"><div class="bar-fill" style="width:${b.fill == null ? (b.value == null ? 0 : 100) : Math.round(Math.min(1, b.fill) * 100)}%"></div></div>
        ${b.note ? `<small class="hud-note">${Object.entries(b.note.vars).reduce((s, [k, v]) => s.replace(`{${k}}`, typeof v === 'number' ? fmt(v, Number.isInteger(v) ? 0 : 1) : v), t(b.note.key))}</small>` : ''}
        ${b.level === 'bad' ? `<span class="sr-only">${t('hud.critical')}</span>` : ''}
      </div>`).join('');

    const eva = state.life?.eva;
    evaStart = eva?.outside ? Math.max(evaStart, eva.suitO2Kg) : 0; // remember the full suit; reset inside
    const e = evaBar(state, evaStart);
    $('[data-eva]').innerHTML = e ? `
      <div class="hud-bar eva ${e.noReturn ? 'bad' : ''}" role="group" aria-label="${t('hud.eva')}">
        <div class="hud-bar-label"><span>🧑‍🚀 ${t('hud.eva')}</span>
          <b>${fmt(e.value, 2)} kg · ${t('hud.evaNeed').replace('{kg}', fmt(e.required, 2)).replace('{m}', fmt(e.distanceM))}</b></div>
        <div class="bar-track eva-track"><div class="bar-fill" style="width:${Math.round(e.fill * 100)}%"></div>
          <span class="eva-notch" style="left:${Math.round(e.notch * 100)}%" title="${t('hud.notch')}"></span></div>
        ${e.noReturn ? `<small class="hud-note" role="alert">⚠ ${t('hud.noReturn')}</small>` : ''}
      </div>` : '';
  }

  function openTab(id) {
    if (tab === id) id = null; // clicking the open tab collapses it
    panel?.destroy();
    panel = null;
    tab = id;
    el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    const box = $('[data-panel]');
    box.hidden = !id;
    box.innerHTML = '';
    if (!id) return;
    const host = document.createElement('div');
    box.appendChild(host);
    if (id === 'telemetry' && opts.telemetry) panel = mountTelemetry(host, { telemetry: opts.telemetry, t, locale, refreshMs: 1000 });
    else if (id === 'downlink' && opts.downlink) panel = mountDownlink(host, { state, bus, t, locale, ...opts.downlink });
    else if (id === 'power' && opts.power) panel = mountPowerPanel(host, { t, locale, bus, refreshMs: 500, ...opts.power });
    else host.innerHTML = `<p class="dl-empty">${t('hud.notReady')}</p>`;
  }

  el.querySelectorAll('[data-tab]').forEach((b) => {
    b.addEventListener('click', () => openTab(b.dataset.tab));
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = TABS.indexOf(b.dataset.tab);
      const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
      el.querySelector(`[data-tab="${next}"]`).focus();
    });
  });

  renderBars();
  if (opts.refreshMs) timer = setInterval(renderBars, opts.refreshMs);

  return {
    refresh: () => { renderBars(); panel?.refresh?.(); }, // e.g. after a language switch
    openTab: (id) => { if (tab !== id) openTab(id); },
    closeTabs: () => { if (tab) openTab(tab); },
    destroy() {
      clearInterval(timer);
      panel?.destroy();
      el.innerHTML = '';
      el.classList.remove('hud');
    },
  };
}
