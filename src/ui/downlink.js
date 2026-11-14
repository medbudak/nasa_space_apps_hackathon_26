// Downlink queue (owner: K3). M1: only data that reaches Earth counts.
//
// Three parts, none of them imports K1's core files:
//
// 1. connectDownlink(bus, getState) — K1 calls it once in main.js. Listens for `downlink:queue`
//    and adds the packet to gameState.dataBudget.queue. Packet (D-003): { type, id, mbit, points }.
//    type: 'photo' | 'report' | 'experiment' | 'family' (anything else shows a generic icon).
//
// 2. runDuePasses(state, passes, fromT, toT, bus) — K2's surface loop calls it each step with the
//    previous and current time (T = sol + solFraction). Every relay pass that starts in (fromT, toT]
//    sends the queue in the player's order up to the pass capacity. A packet that does not fit is
//    sent in part and continues on the next pass. Each finished packet is removed from the queue and
//    announced with `downlink:sent` { ...packet, sol, passId }. Owners add score on that event.
//
// 3. mountDownlink(el, opts) — the panel (HUD "Downlink" tab): queue on the left, this sol's passes on
//    the right, light delay to Earth. The player reorders the queue by drag and drop or ↑/↓.
//
// passes: [{ id: 'mro', name: 'MRO', atSolFraction: 0.3, mbit: 221.2 }, ...] built by the caller from
// nasa_data.json (each number with its src). This file holds no numbers.

// ---- pure queue logic -------------------------------------------------------

/** Add a packet unless one with the same id is already queued. Mutates and returns the queue. */
export function enqueue(queue, packet) {
  if (!packet || !packet.id || !(packet.mbit >= 0)) throw new Error('downlink: packet needs id and mbit');
  if (!queue.some((p) => p.id === packet.id)) queue.push({ ...packet, sentMbit: 0 });
  return queue;
}

/** Move a packet to a new index. Mutates the queue in place (gameState arrays are never replaced). */
export function movePacket(queue, id, toIndex) {
  const from = queue.findIndex((p) => p.id === id);
  if (from < 0) return queue;
  const [p] = queue.splice(from, 1);
  queue.splice(Math.max(0, Math.min(queue.length, toIndex)), 0, p);
  return queue;
}

/**
 * Send the queue in order through one pass of `capacityMbit`. Mutates the queue.
 * Returns { sent: [finished packets], usedMbit }.
 */
export function sendPass(queue, capacityMbit) {
  let cap = Math.max(0, capacityMbit);
  const sent = [];
  let used = 0;
  while (queue.length && cap > 1e-9) {
    const p = queue[0];
    const step = Math.min(p.mbit - (p.sentMbit || 0), cap);
    p.sentMbit = round((p.sentMbit || 0) + step);
    cap -= step;
    used += step;
    if (p.sentMbit >= p.mbit - 1e-9) {
      queue.shift();
      const { sentMbit, ...packet } = p;
      sent.push(packet);
    }
  }
  return { sent, usedMbit: round(used) };
}

/**
 * Preview without sending: on which upcoming pass each packet finishes (null = not today).
 * upcoming: passes still ahead, in time order. Returns { [packetId]: passId | null }.
 */
export function planQueue(queue, upcoming) {
  const copy = queue.map((p) => ({ ...p }));
  const plan = Object.fromEntries(queue.map((p) => [p.id, null]));
  for (const pass of upcoming) {
    for (const p of sendPass(copy, pass.mbit).sent) plan[p.id] = pass.id;
  }
  return plan;
}

/** Passes that start in (fromT, toT], where T = sol + solFraction. Each pass repeats every sol. */
export function duePasses(passes, fromT, toT) {
  const out = [];
  for (let sol = Math.floor(fromT); sol <= Math.floor(toT); sol++) {
    for (const pass of passes) {
      const at = sol + pass.atSolFraction;
      if (at > fromT && at <= toT) out.push({ ...pass, sol, at });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Run every pass due between two times. Mutates state.dataBudget and emits downlink:sent. */
export function runDuePasses(state, passes, fromT, toT, bus) {
  const db = state.dataBudget;
  const results = [];
  for (const pass of duePasses(passes, fromT, toT)) {
    const { sent, usedMbit } = sendPass(db.queue, pass.mbit);
    db.used = round((db.used || 0) + usedMbit);
    for (const p of sent) {
      const event = { ...p, sol: pass.sol, passId: pass.id };
      bus?.emit('downlink:sent', event);
      results.push(event);
    }
  }
  return results;
}

/** Seconds -> { min, sec } for "14 min 22 s", or null when the delay is not known yet (never a fake 0). */
export function splitDelay(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
  const s = Math.round(Math.max(0, seconds));
  return { min: Math.floor(s / 60), sec: s % 60 };
}

/** Sol fraction -> Mars local clock "hh:mm" (LMST: a sol divided into 24 Mars hours). */
export function marsClock(solFraction) {
  const mins = Math.floor((((solFraction % 1) + 1) % 1) * 24 * 60);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function round(x) { return Math.round(x * 1000) / 1000; }

// ---- bus wiring -----------------------------------------------------------

/** Listen for downlink:queue and add packets to gameState.dataBudget.queue. Returns an unsubscribe function. */
export function connectDownlink(bus, getState) {
  const onQueue = (packet) => {
    try {
      enqueue(getState().dataBudget.queue, packet);
    } catch (err) {
      console.warn('[downlink] ignored packet', packet, err);
    }
  };
  bus.on('downlink:queue', onQueue);
  return () => bus.off?.('downlink:queue', onQueue);
}

// ---- panel ------------------------------------------------------------------

import { icon, watchIconErrors } from './icons.js';

const ICONS = { photo: '📷', report: '📄', experiment: '🧪', family: '✉' }; // fallbacks for K4's pkt_* icons
const pktIcon = (type, size) => icon(`pkt_${type}`, { size, fallback: ICONS[type] || '•' });

/**
 * opts: { state, bus, t, passes, lightDelaySec, locale?, now?() -> T }
 *   now(): current time as sol + solFraction; defaults to state.time.
 * Returns { refresh(), destroy() }.
 */
export function mountDownlink(el, opts) {
  const { state, bus, t, passes } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const now = opts.now || (() => (state.time ? state.time.sol + state.time.solFraction : 0));
  const queue = () => state.dataBudget.queue;
  const fmt = (n, d = 1) => Number(n).toLocaleString(locale(), { maximumFractionDigits: d });
  let lastSent = [];
  let dragId = null;

  el.classList.add('downlink');
  watchIconErrors(el);

  function upcoming() {
    const T = now();
    const sol = Math.floor(T);
    return passes
      .map((p) => ({ ...p, at: sol + p.atSolFraction }))
      .filter((p) => p.at > T)
      .sort((a, b) => a.at - b.at);
  }

  function render() {
    const q = queue();
    const ahead = upcoming();
    const plan = planQueue(q, ahead);
    const passName = Object.fromEntries(passes.map((p) => [p.id, p.name]));
    const T = now();
    const delay = splitDelay(typeof opts.lightDelaySec === 'function' ? opts.lightDelaySec() : opts.lightDelaySec);
    const delayText = delay ? t('downlink.delay').replace('{min}', delay.min).replace('{sec}', delay.sec) : t('downlink.delayUnknown');
    const queuedMbit = q.reduce((s, p) => s + p.mbit - (p.sentMbit || 0), 0);
    const aheadMbit = ahead.reduce((s, p) => s + p.mbit, 0);

    el.innerHTML = `
      <header class="dl-head">
        <h2>${t('downlink.title')}</h2>
        <span class="dl-delay" title="${t('downlink.delay.help')}">🛰 ${delayText}</span>
      </header>
      <div class="dl-cols">
        <section class="dl-queue" aria-label="${t('downlink.queue')}">
          <h3>${t('downlink.queue')} <span class="dl-sum">${fmt(queuedMbit)} / ${fmt(aheadMbit)} Mbit</span></h3>
          ${q.length === 0 ? `<p class="dl-empty">${t('downlink.empty')}</p>` : ''}
          <ol class="dl-list">
            ${q.map((p, i) => {
              const goes = plan[p.id];
              const pct = p.mbit > 0 ? Math.round(((p.sentMbit || 0) / p.mbit) * 100) : 0;
              return `<li class="dl-item ${goes ? '' : 'late'}" draggable="true" data-id="${p.id}">
                <span class="dl-grip" aria-hidden="true">⋮⋮</span>
                <span class="dl-icon" aria-hidden="true">${pktIcon(p.type, 24)}</span>
                <span class="dl-name">${t(`downlink.type.${p.type}`)}<small>${p.labelKey ? t(p.labelKey) : p.id}</small></span>
                <span class="chip">${fmt(p.mbit)} Mbit</span>
                ${p.points ? `<span class="chip">★ ${fmt(p.points, 0)}</span>` : ''}
                <span class="dl-when">${goes ? t('downlink.goesOn').replace('{pass}', passName[goes]) : t('downlink.notToday')}</span>
                ${pct > 0 ? `<span class="dl-progress" title="${pct}%"><span style="width:${pct}%"></span></span>` : ''}
                <span class="dl-move">
                  <button class="dl-btn" data-up="${p.id}" ${i === 0 ? 'disabled' : ''} aria-label="${t('downlink.up')}">↑</button>
                  <button class="dl-btn" data-down="${p.id}" ${i === q.length - 1 ? 'disabled' : ''} aria-label="${t('downlink.down')}">↓</button>
                </span>
              </li>`;
            }).join('')}
          </ol>
        </section>
        <section class="dl-passes" aria-label="${t('downlink.passes')}">
          <h3>${t('downlink.passes')} · SOL ${Math.floor(T)}</h3>
          <ul class="dl-pass-list">
            ${[...passes].sort((a, b) => a.atSolFraction - b.atSolFraction).map((p) => {
              const done = Math.floor(T) + p.atSolFraction <= T;
              const next = ahead[0] && ahead[0].id === p.id;
              return `<li class="dl-pass ${done ? 'done' : ''} ${next ? 'next' : ''}">
                <b>${p.name}</b>
                <span>${marsClock(p.atSolFraction)}</span>
                <span class="chip">${fmt(p.mbit)} Mbit</span>
                <span class="dl-pass-state">${done ? t('downlink.passed') : next ? t('downlink.next') : t('downlink.later')}</span>
              </li>`;
            }).join('')}
          </ul>
          ${lastSent.length ? `<p class="dl-sent">✔ ${t('downlink.sentNow')} ${lastSent.map((p) => `${pktIcon(p.type, 16)} ${p.labelKey ? t(p.labelKey) : p.id}`).join(', ')}</p>` : ''}
          <p class="dl-rule">${t('downlink.rule')}</p>
        </section>
      </div>`;
    wire();
  }

  function wire() {
    el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => move(b.dataset.up, -1)));
    el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => move(b.dataset.down, +1)));
    el.querySelectorAll('.dl-item').forEach((li) => {
      li.addEventListener('dragstart', (e) => { dragId = li.dataset.id; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      li.addEventListener('dragend', () => { dragId = null; li.classList.remove('dragging'); });
      li.addEventListener('dragover', (e) => { e.preventDefault(); li.classList.add('over'); });
      li.addEventListener('dragleave', () => li.classList.remove('over'));
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!dragId || dragId === li.dataset.id) return;
        movePacket(queue(), dragId, queue().findIndex((p) => p.id === li.dataset.id));
        render();
      });
    });
  }

  function move(id, delta) {
    const i = queue().findIndex((p) => p.id === id);
    movePacket(queue(), id, i + delta);
    render();
    el.querySelector(`[data-${delta < 0 ? 'up' : 'down'}="${id}"]:not(:disabled)`)?.focus()
      || el.querySelector(`[data-id="${id}"] .dl-btn:not(:disabled)`)?.focus();
  }

  const onQueue = () => setTimeout(render, 0); // after connectDownlink has added the packet
  const onSent = (p) => { lastSent = [...lastSent.filter((x) => x.sol === p.sol), p]; render(); };
  bus.on('downlink:queue', onQueue);
  bus.on('downlink:sent', onSent);
  render();

  return {
    refresh: render,
    destroy() {
      bus.off?.('downlink:queue', onQueue);
      bus.off?.('downlink:sent', onSent);
      el.innerHTML = '';
      el.classList.remove('downlink');
    },
  };
}
