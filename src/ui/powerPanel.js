// Power panel (owner: K3). M3: the player orders the habitat loads; when the battery runs out,
// K2's power.js switches loads off from the bottom of the list (load shedding).
//
// This module does not import K2's files. K2/K1 pass two functions in:
//   getStatus()    -> K2 power.getPowerStatus(state, ctx):
//                     { generationW, loadW, deficitW, batteryWh, batteryCapacityWh,
//                       loads: [{ id, watts, on, pinned }] }   // in priority order, top first
//   setOrder(ids)  -> K2 power.setOrder(state, ids): true if accepted
// and the bus, to hear `power:shed` { sol, shed: [ids], generationW, loadW }.
//
//   const panel = mountPowerPanel(el, { t, locale, bus, getStatus, setOrder, refreshMs: 500 });
//
// Load names come from t(`power.load.<id>`). Pinned loads (life support) cannot move and are never shed.

// ---- pure helpers ---------------------------------------------------------------

/**
 * New order after moving `id` to `toIndex`, or null when the move is not allowed
 * (a pinned load moves, or a load would go above a pinned one).
 */
export function moveLoad(loads, id, toIndex) {
  const order = loads.map((l) => l.id);
  const from = order.indexOf(id);
  const pinnedCount = loads.filter((l) => l.pinned).length;
  if (from < 0 || loads[from].pinned) return null;
  const to = Math.max(pinnedCount, Math.min(order.length - 1, toIndex));
  if (to === from) return null;
  order.splice(from, 1);
  order.splice(to, 0, id);
  return order;
}

/**
 * Preview: which loads would be switched off if the battery ran out now.
 * Mirrors K2's rule in power.updateShedding (bottom first, pinned and 0 W loads skipped,
 * until the loads that stay on fit the generation).
 */
export function shedPreview(loads, generationW) {
  const on = loads.map((l) => ({ ...l }));
  const total = () => on.reduce((s, l) => s + (l.on ? l.watts : 0), 0);
  const shed = [];
  for (let i = on.length - 1; i >= 0 && total() > generationW; i--) {
    const l = on[i];
    if (!l.on || l.pinned || l.watts === 0) continue;
    l.on = false;
    shed.push(l.id);
  }
  return shed;
}

/** Hours the battery lasts at the current net draw, or null when it is charging or level. */
export function hoursLeft(batteryWh, loadW, generationW) {
  const net = loadW - generationW;
  return net > 0 ? batteryWh / net : null;
}

// ---- panel -----------------------------------------------------------------------

export function mountPowerPanel(el, opts) {
  const { t, bus, getStatus, setOrder } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const fmt = (n, d = 0) => Number(n).toLocaleString(locale(), { maximumFractionDigits: d });
  let shedIds = null; // loads switched off by the last power:shed; the note is built at render time (language)
  let dragId = null;
  let timer = 0;

  el.classList.add('power-panel');

  function render() {
    const s = getStatus();
    if (!s) { el.innerHTML = `<p class="dl-empty">${t('power.noData')}</p>`; return; }
    const loads = s.loads || [];
    const preview = new Set(shedPreview(loads, s.generationW));
    const pct = s.batteryCapacityWh > 0 ? Math.round((s.batteryWh / s.batteryCapacityWh) * 100) : 0;
    const left = hoursLeft(s.batteryWh, s.loadW, s.generationW);
    const net = s.generationW - s.loadW;
    const pinnedCount = loads.filter((l) => l.pinned).length;
    if (shedIds && loads.every((l) => l.on)) shedIds = null; // everything is back on: drop the note
    const shedNote = shedIds ? t('power.shedNow').replace('{loads}', shedIds.map((id) => t(`power.load.${id}`)).join(', ')) : null;
    const leftText = s.batteryWh <= 0 && s.loadW > s.generationW ? t('power.empty')
      : left == null ? t('power.charging') : t('power.hoursLeft').replace('{h}', fmt(left, 1));

    el.innerHTML = `
      <header class="dl-head">
        <h2>${t('power.title')}</h2>
        ${s.deficitW > 0 ? `<span class="pw-alert" role="alert">⚠ ${t('power.deficit').replace('{w}', fmt(s.deficitW))}</span>` : ''}
      </header>
      <div class="pw-summary">
        <div class="pw-stat"><span>${t('power.generation')}</span><b>${fmt(s.generationW)} W</b></div>
        <div class="pw-stat"><span>${t('power.load')}</span><b>${fmt(s.loadW)} W</b></div>
        <div class="pw-stat ${net < 0 ? 'neg' : 'pos'}"><span>${t('power.net')}</span><b>${net >= 0 ? '+' : '−'}${fmt(Math.abs(net))} W</b></div>
      </div>
      <div class="pw-battery">
        <div class="bar-label"><span>🔋 ${t('power.battery')}</span>
          <span class="num">${fmt(s.batteryWh / 1000, 1)} / ${fmt(s.batteryCapacityWh / 1000, 1)} kWh · ${locale().startsWith('tr') ? `%${pct}` : `${pct}%`}</span></div>
        <div class="bar-track"><div class="bar-fill ${pct <= 20 ? 'low' : ''}" style="width:${pct}%"></div></div>
        <p class="pw-left">${leftText}</p>
      </div>
      ${shedNote ? `<p class="pw-shed" role="alert">${shedNote}</p>` : ''}
      <h3 class="pw-h">${t('power.order')}</h3>
      <ol class="dl-list pw-list">
        ${loads.map((l, i) => `
          <li class="dl-item pw-item ${l.on ? '' : 'off'} ${l.pinned ? 'pinned' : ''}" ${l.pinned ? '' : 'draggable="true"'} data-id="${l.id}">
            <span class="dl-grip" aria-hidden="true">${l.pinned ? '🔒' : '⋮⋮'}</span>
            <span class="pw-rank">${i + 1}</span>
            <span class="dl-name">${t(`power.load.${l.id}`)}<small>${l.pinned ? t('power.pinned') : !l.on ? t('power.shed') : preview.has(l.id) ? t('power.wouldShed') : t('power.on')}</small></span>
            <span class="chip">${fmt(l.watts)} W</span>
            <span class="dl-move">${l.pinned ? '' : `
              <button class="dl-btn" data-up="${l.id}" ${i <= pinnedCount ? 'disabled' : ''} aria-label="${t('downlink.up')}">↑</button>
              <button class="dl-btn" data-down="${l.id}" ${i === loads.length - 1 ? 'disabled' : ''} aria-label="${t('downlink.down')}">↓</button>`}
            </span>
          </li>`).join('')}
      </ol>
      <p class="dl-rule">${t('power.rule')}</p>`;
    wire(loads);
  }

  function apply(order, focusSel) {
    if (order && setOrder(order)) {
      render();
      if (focusSel) el.querySelector(focusSel)?.focus();
    }
  }

  function wire(loads) {
    el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => {
      const i = loads.findIndex((l) => l.id === b.dataset.up);
      apply(moveLoad(loads, b.dataset.up, i - 1), `[data-up="${b.dataset.up}"]:not(:disabled), [data-down="${b.dataset.up}"]`);
    }));
    el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => {
      const i = loads.findIndex((l) => l.id === b.dataset.down);
      apply(moveLoad(loads, b.dataset.down, i + 1), `[data-down="${b.dataset.down}"]:not(:disabled), [data-up="${b.dataset.down}"]`);
    }));
    el.querySelectorAll('.pw-item').forEach((li) => {
      li.addEventListener('dragstart', (e) => { dragId = li.dataset.id; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragend', () => { dragId = null; li.classList.remove('dragging'); });
      li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('over'); });
      li.addEventListener('dragleave', () => li.classList.remove('over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!dragId || dragId === li.dataset.id) return;
        apply(moveLoad(loads, dragId, loads.findIndex((l) => l.id === li.dataset.id)));
      });
    });
  }

  const onShed = (ev) => {
    shedIds = [...(ev.shed || [])];
    render();
  };
  bus?.on('power:shed', onShed);
  render();
  // Live refresh: skipped while dragging; keyboard focus survives the redraw.
  const tick = () => {
    if (dragId) return;
    const a = document.activeElement;
    const key = a && el.contains(a) ? ['data-up', 'data-down'].find((k) => a.hasAttribute(k)) : null;
    const sel = key ? `[${key}="${a.getAttribute(key)}"]` : null;
    render();
    if (sel) el.querySelector(sel)?.focus();
  };
  if (opts.refreshMs) timer = setInterval(tick, opts.refreshMs);

  return {
    refresh: render,
    destroy() {
      clearInterval(timer);
      bus?.off?.('power:shed', onShed);
      el.innerHTML = '';
      el.classList.remove('power-panel');
    },
  };
}
