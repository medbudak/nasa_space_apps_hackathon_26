// QTE mini-game template (owner: K3): timing in low gravity. Two modes.
//
// mode 'catch' — a tool slips off a shelf and falls; press Space when it reaches the hand.
//   config: { mode: 'catch', titleKey, introKey,
//             eventSeconds,        // fall time on Mars, from engineering.fallTime(height, mars.gravity)
//             compareSeconds?,     // the same fall on Earth, shown for comparison
//             catchWindow,         // share of the drop height counted as "in the hand", e.g. 0.15
//             rounds, needed,      // e.g. 3 drops, 2 catches to win
//             delaysSeconds }      // pause before each drop, one per round (caller rolls them with the seeded RNG)
//   done({ success, score, detail: { caught, rounds } })
//
// mode 'stopwatch' — measure a real event with a stopwatch (K6's experiments).
//   config: { mode: 'stopwatch', titleKey, introKey,
//             scene: 'pendulum' | 'drop' | 'sound',
//             eventSeconds,        // one swing period / one fall / one sound delay, from engineering.js
//             cycles?,             // pendulum: how many swings to time (e.g. 10); others: 1
//             trials,              // how many measurements to average
//             tolerance,           // e.g. 0.1 for ±10 % (rules.experimentTolerance)
//             delaysSeconds? }     // drop/sound: pause before each event
//   Space (or the big button) starts the stopwatch, Space again stops it.
//   done({ success, score, detail: { measuredSeconds, expectedSeconds, errorPct, trials: [...] } })
//   measuredSeconds is the average; K6 turns it into g or a speed with engineering.js.
//
// The template holds no physics numbers; it only animates the durations it is given
// (free fall: height share = (t / tFall)², pendulum: angle = A · cos(2π t / T)).

/** Pure: catch result for a press at time t into a fall of tFall seconds. */
export function catchResult(t, tFall, window) {
  const share = Math.min(1, (t / tFall) ** 2);
  return { share, caught: share >= 1 - window && share <= 1 };
}

/** Pure: compare an averaged measurement with the expected value. */
export function measureResult(trialsSeconds, expectedSeconds, tolerance) {
  const measured = trialsSeconds.reduce((s, x) => s + x, 0) / trialsSeconds.length;
  const err = Math.abs(measured - expectedSeconds) / expectedSeconds;
  const success = err <= tolerance;
  return {
    success,
    score: success ? Math.round(100 - 50 * (err / tolerance)) : 0,
    measuredSeconds: Math.round(measured * 1000) / 1000,
    expectedSeconds,
    errorPct: Math.round(err * 1000) / 10,
  };
}

export const qte = {
  mount(el, { config, t, locale, done }) {
    return config.mode === 'stopwatch' ? mountStopwatch(el, config, t, locale, done) : mountCatch(el, config, t, locale, done);
  },
};

const fmtS = (n, locale, d = 2) => Number(n).toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });

function shell(el, c, t, kickerKey) {
  el.classList.add('qte');
  el.innerHTML = `
    <header class="mg-head">
      <span class="kicker">${t(kickerKey)}</span>
      <h2>${t(c.titleKey)}</h2>
      ${c.introKey ? `<p class="mg-intro">${t(c.introKey)}</p>` : ''}
    </header>
    <div class="qte-stage"><svg class="qte-scene" viewBox="0 0 300 220" aria-hidden="true"></svg><div class="qte-side"></div></div>
    <p class="conv-msg" data-msg aria-live="polite"></p>
    <footer class="mg-foot">
      <button class="btn ghost" data-cancel>${t('minigame.cancel')}</button>
      <button class="btn qte-action" data-action></button>
      <button class="btn" data-ok hidden>${t('minigame.ok')}</button>
    </footer>`;
  return {
    svg: el.querySelector('.qte-scene'), side: el.querySelector('.qte-side'), msg: el.querySelector('[data-msg]'),
    action: el.querySelector('[data-action]'), ok: el.querySelector('[data-ok]'), cancel: el.querySelector('[data-cancel]'),
  };
}

// Space anywhere in the mini-game presses the action button (a focused button already clicks on Space).
function onSpace(el, ui, fn) {
  const h = (e) => {
    if ((e.key === ' ' || e.code === 'Space') && e.target !== ui.action && !e.repeat) { e.preventDefault(); fn(); }
  };
  el.addEventListener('keydown', h);
  ui.action.addEventListener('click', fn);
  return () => el.removeEventListener('keydown', h);
}

function finishUi(ui, t, success, text) {
  ui.msg.className = `conv-msg ${success ? 'ok' : 'warn'}`;
  ui.msg.textContent = text;
  ui.action.hidden = true;
  ui.cancel.hidden = true;
  ui.ok.hidden = false;
  ui.ok.focus();
}

// ---- catch ----------------------------------------------------------------------

function mountCatch(el, c, t, locale, done) {
  const ui = shell(el, c, t, 'minigame.qte');
  const SHELF = 30;
  const HAND = 180;
  let round = 0;
  let caught = 0;
  let phase = 'wait'; // wait -> fall -> result
  let t0 = performance.now();
  let raf = 0;
  let result = null;
  let pressedShare = null;

  ui.svg.innerHTML = `
    <rect x="60" y="${SHELF - 6}" width="90" height="6" class="qte-shelf"></rect>
    <rect x="0" y="${HAND - (HAND - SHELF) * c.catchWindow}" width="300" height="${(HAND - SHELF) * c.catchWindow + 4}" class="qte-zone"></rect>
    <text x="230" y="${HAND + 4}" class="qte-hand">✋</text>
    <rect x="0" y="206" width="300" height="14" class="qte-ground"></rect>
    <text x="96" y="${SHELF - 10}" class="qte-obj" data-obj>🔧</text>`;
  ui.action.textContent = t('qte.catch.now');

  function side() {
    ui.side.innerHTML = `
      <div class="al-row"><span>${t('qte.round')}</span><b>${Math.min(round + 1, c.rounds)} / ${c.rounds}</b></div>
      <div class="al-row"><span>${t('qte.caught')}</span><b>${caught} / ${c.needed}</b></div>
      <div class="al-row"><span>${t('qte.fallMars')}</span><b>${fmtS(c.eventSeconds, locale)} s</b></div>
      ${c.compareSeconds ? `<div class="al-row"><span>${t('qte.fallEarth')}</span><b>${fmtS(c.compareSeconds, locale)} s</b></div>` : ''}
      <p class="al-model">${t('qte.catch.hint')}</p>`;
  }

  function press() {
    if (phase !== 'fall') return;
    const r = catchResult((performance.now() - t0) / 1000, c.eventSeconds, c.catchWindow);
    pressedShare = r.share;
    endRound(r.caught);
  }

  function endRound(ok) {
    phase = 'result';
    if (ok) caught++;
    ui.msg.className = `conv-msg ${ok ? 'ok' : 'warn'}`;
    ui.msg.textContent = ok ? t('qte.catch.ok') : pressedShare == null ? t('qte.catch.dropped') : t('qte.catch.early');
    round++;
    side();
    // Decided (won, out of rounds, or can no longer win): finish now so the result is never empty.
    if (round >= c.rounds || caught >= c.needed || c.rounds - round < c.needed - caught) return finish();
    setTimeout(() => {
      phase = 'wait';
      pressedShare = null;
      t0 = performance.now();
      ui.msg.textContent = '';
    }, 900);
  }

  function finish() {
    const success = caught >= c.needed;
    result = { success, score: success ? Math.round((caught / c.rounds) * 100) : 0, detail: { caught, rounds: round } };
    finishUi(ui, t, success, `${ui.msg.textContent} ${success ? t('qte.catch.win') : t('qte.catch.lose')}`);
  }

  function frame(now) {
    const obj = el.querySelector('[data-obj]');
    const s = (now - t0) / 1000;
    const delay = (c.delaysSeconds || [])[round] ?? 1;
    if (phase === 'wait') {
      obj.setAttribute('y', SHELF - 10);
      if (s >= delay) { phase = 'fall'; t0 = now; }
    } else if (phase === 'fall') {
      const share = Math.min(1, (s / c.eventSeconds) ** 2);
      obj.setAttribute('y', SHELF - 10 + (206 - SHELF + 4) * share);
      if (share >= 1) endRound(false);
    } else if (phase === 'result' && pressedShare != null) {
      obj.setAttribute('y', SHELF - 10 + (206 - SHELF + 4) * pressedShare);
    }
    raf = requestAnimationFrame(frame);
  }

  const off = onSpace(el, ui, press);
  ui.cancel.addEventListener('click', () => done({ success: false, score: 0, detail: { cancelled: true } }));
  ui.ok.addEventListener('click', () => { if (result) done(result); });
  side();
  ui.action.focus();
  raf = requestAnimationFrame(frame);
  return { destroy() { cancelAnimationFrame(raf); off(); } };
}

// ---- stopwatch ------------------------------------------------------------------

function mountStopwatch(el, c, t, locale, done) {
  const ui = shell(el, c, t, 'minigame.stopwatch');
  const cycles = c.cycles || 1;
  const expected = c.eventSeconds * cycles;
  const trials = [];
  let running = false;
  let swStart = 0;
  let sceneT0 = performance.now();
  let raf = 0;
  let result = null;

  const scenes = {
    pendulum: `<line x1="150" y1="20" x2="150" y2="160" class="qte-string" data-string></line>
               <circle cx="150" cy="160" r="12" class="qte-bob" data-bob></circle>
               <line x1="150" y1="20" x2="150" y2="200" class="qte-mid"></line>
               <rect x="110" y="14" width="80" height="6" class="qte-shelf"></rect>`,
    drop: `<rect x="60" y="24" width="60" height="6" class="qte-shelf"></rect>
           <text x="80" y="20" class="qte-obj" data-obj>🪨</text>
           <rect x="0" y="206" width="300" height="14" class="qte-ground"></rect>`,
    sound: `<text x="14" y="130" class="qte-obj">🧨</text><text x="250" y="130" class="qte-obj">🎧</text>
            <circle cx="40" cy="120" r="0" class="qte-wave" data-wave></circle>
            <circle cx="40" cy="120" r="0" class="qte-flash" data-flash></circle>
            <text x="230" y="90" class="qte-bang" data-bang></text>`,
  };
  ui.svg.innerHTML = scenes[c.scene] || '';

  function side() {
    const live = running ? (performance.now() - swStart) / 1000 : (trials.at(-1) ?? 0);
    ui.side.innerHTML = `
      <div class="qte-clock" data-clock>${fmtS(live, locale)} s</div>
      <div class="al-row"><span>${t('qte.trial')}</span><b>${Math.min(trials.length + 1, c.trials)} / ${c.trials}</b></div>
      ${cycles > 1 ? `<div class="al-row"><span>${t('qte.cycles')}</span><b>${cycles}</b></div>` : ''}
      ${trials.map((x, i) => `<div class="al-row"><span>#${i + 1}</span><b>${fmtS(x, locale)} s</b></div>`).join('')}
      <p class="al-model">${t(`qte.stopwatch.hint.${c.scene}`).replace('{n}', cycles)}</p>`;
    ui.action.textContent = running ? t('qte.stop') : t('qte.start');
  }

  function press() {
    if (result) return;
    const now = performance.now();
    if (!running) {
      running = true;
      swStart = now;
    } else {
      running = false;
      trials.push((now - swStart) / 1000);
      if (trials.length >= c.trials) return finish();
      if (c.scene !== 'pendulum') sceneT0 = now; // next drop / bang
    }
    side();
  }

  function finish() {
    const r = measureResult(trials, expected, c.tolerance);
    result = {
      success: r.success,
      score: r.score,
      detail: { measuredSeconds: r.measuredSeconds, expectedSeconds: Math.round(expected * 1000) / 1000,
        errorPct: r.errorPct, trials: trials.map((x) => Math.round(x * 1000) / 1000) },
    };
    side();
    finishUi(ui, t, r.success, (r.success ? t('qte.measure.ok') : t('qte.measure.off'))
      .replace('{measured}', fmtS(r.measuredSeconds, locale)).replace('{expected}', fmtS(expected, locale))
      .replace('{err}', fmtS(r.errorPct, locale, 1)));
  }

  function frame(now) {
    const s = (now - sceneT0) / 1000;
    if (c.scene === 'pendulum') {
      const a = 0.35 * Math.cos((2 * Math.PI * s) / c.eventSeconds);
      const x = 150 + 140 * Math.sin(a);
      const y = 20 + 140 * Math.cos(a);
      el.querySelector('[data-string]').setAttribute('x2', x);
      el.querySelector('[data-string]').setAttribute('y2', y);
      el.querySelector('[data-bob]').setAttribute('cx', x);
      el.querySelector('[data-bob]').setAttribute('cy', y);
    } else {
      const delay = (c.delaysSeconds || [])[trials.length] ?? 1.5;
      const e = s - delay; // time since the event started
      if (c.scene === 'drop') {
        const share = e <= 0 ? 0 : Math.min(1, (e / c.eventSeconds) ** 2);
        el.querySelector('[data-obj]').setAttribute('y', 20 + 186 * share);
      } else if (c.scene === 'sound') {
        const share = e <= 0 ? 0 : Math.min(1, e / c.eventSeconds);
        el.querySelector('[data-flash]').setAttribute('r', e > 0 && e < 0.12 ? 26 : 0);
        el.querySelector('[data-wave]').setAttribute('r', e > 0 && share < 1 ? 215 * share : 0);
        el.querySelector('[data-bang]').textContent = share >= 1 && e < c.eventSeconds + 0.4 ? t('qte.bang') : '';
      }
    }
    if (running) { const clock = el.querySelector('[data-clock]'); if (clock) clock.textContent = `${fmtS((now - swStart) / 1000, locale)} s`; }
    raf = requestAnimationFrame(frame);
  }

  const off = onSpace(el, ui, press);
  ui.cancel.addEventListener('click', () => done({ success: false, score: 0, detail: { cancelled: true } }));
  ui.ok.addEventListener('click', () => { if (result) done(result); });
  side();
  ui.action.focus();
  raf = requestAnimationFrame(frame);
  return { destroy() { cancelAnimationFrame(raf); off(); } };
}
