// Align mini-game template (owner: K3): turn a dial until the signal peaks, then hold it.
// Used for pointing the antenna, tilting a solar panel and framing a photo.
//
// The target is hidden; only the signal bar says "warmer" or "colder". Success: keep the signal at or
// above `successPct` for `holdSeconds`. With a time limit, running out of time is a failure.
//
// config (every number comes from the caller, which reads nasa_data.json or rolls the target with the
// seeded RNG; this file holds no gameplay numbers):
//   {
//     mode: 'panel' | 'antenna' | 'photo',   // icon and wording only
//     titleKey, introKey,                    // story.json keys
//     response: 'cos' | 'beam',              // 'cos': power = cos(error), real for a flat solar panel
//                                            // 'beam': Gaussian main lobe, a simplified antenna/lens model
//     beamWidthDeg,                          // 'beam' only: full width where the signal is half (HPBW)
//     targetDeg, startDeg,                   // hidden target and where the dial starts
//     minDeg, maxDeg,                        // dial range; a 360° range wraps around
//     stepDeg,                               // one key press (Shift = 5 steps)
//     successPct, holdSeconds,               // e.g. 90 and 1
//     timeLimitSeconds?,                     // optional
//   }
//
// done({ success, score, detail: { finalDeg, errorDeg, signalPct } })
// score: 0..100, higher when solved faster (100 without a time limit).

const DEG = Math.PI / 180;

/** Pure: angle between the dial and the target, in degrees (wraps on a full circle). */
export function angleError(config, deg) {
  const range = config.maxDeg - config.minDeg;
  let err = Math.abs(deg - config.targetDeg);
  if (range >= 360) err = Math.min(err % 360, 360 - (err % 360));
  return err;
}

/** Pure: signal 0..1 at a dial angle. */
export function signalAt(config, deg) {
  const err = angleError(config, deg);
  if (config.response === 'beam') {
    const w = config.beamWidthDeg;
    return Math.exp(-4 * Math.LN2 * (err / w) ** 2); // 0.5 at err = w / 2
  }
  return Math.max(0, Math.cos(err * DEG));
}

/** Pure: score for a solved alignment. */
export function alignScore(config, secondsUsed) {
  if (!config.timeLimitSeconds) return 100;
  return Math.max(10, Math.round(100 * (1 - secondsUsed / config.timeLimitSeconds)));
}

const ICON = { panel: '☀', antenna: '📡', photo: '📷' };

export const align = {
  mount(el, { config, t, locale, done }) {
    const c = config;
    const mode = c.mode || 'antenna';
    const step = c.stepDeg || 1;
    const clamp = (d) => {
      if (c.maxDeg - c.minDeg >= 360) return ((d - c.minDeg) % 360 + 360) % 360 + c.minDeg;
      return Math.max(c.minDeg, Math.min(c.maxDeg, d));
    };
    const fmt = (n, d = 0) => Number(n).toLocaleString(locale, { maximumFractionDigits: d });
    let deg = clamp(c.startDeg ?? c.minDeg);
    let holdMs = 0;
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let over = false;

    el.classList.add('align');
    el.innerHTML = `
      <header class="mg-head">
        <span class="kicker">${t('minigame.align')}</span>
        <h2>${t(c.titleKey)}</h2>
        ${c.introKey ? `<p class="mg-intro">${t(c.introKey)}</p>` : ''}
      </header>
      <div class="al-stage">
        <svg class="al-dial" viewBox="-110 -110 220 220" aria-hidden="true">
          <circle r="96" class="al-ring"></circle>
          ${Array.from({ length: 12 }, (_, i) => `<line class="al-tick" x1="0" y1="-96" x2="0" y2="-84" transform="rotate(${i * 30})"></line>`).join('')}
          <g data-needle><line x1="0" y1="0" x2="0" y2="-78" class="al-needle"></line><circle cy="-78" r="7" class="al-tip"></circle></g>
          <circle r="26" class="al-hub"></circle>
          <text class="al-icon" y="9" text-anchor="middle">${ICON[mode] || '◎'}</text>
        </svg>
        <div class="al-readout">
          <div class="al-row"><span>${t(`align.measure.${mode}`)}</span><b data-pct></b></div>
          <div class="al-bar"><span data-bar></span><i class="al-goal" style="left:${c.successPct}%"></i></div>
          <div class="al-row"><span>${t('align.angle')}</span><b data-deg></b></div>
          <div class="al-row"><span>${t('align.hold')}</span><b data-hold></b></div>
          <div class="al-hold"><span data-holdbar></span></div>
          ${c.timeLimitSeconds ? `<div class="al-row"><span>⏱</span><b data-time></b></div>` : ''}
          <input type="range" class="al-range" min="${c.minDeg}" max="${c.maxDeg}" step="${step}" value="${deg}"
            aria-label="${t('align.angle')}">
        </div>
      </div>
      <p class="mg-intro al-hint">${t('align.hint').replace('{pct}', c.successPct).replace('{s}', fmt(c.holdSeconds, 1))}</p>
      <p class="al-model">${t(c.response === 'beam' ? 'align.model.beam' : 'align.model.cos')}</p>
      <p class="conv-msg" data-msg aria-live="polite"></p>
      <footer class="mg-foot">
        <button class="btn ghost" data-cancel>${t('minigame.cancel')}</button>
        <button class="btn" data-ok hidden>${t('minigame.ok')}</button>
      </footer>`;

    const $ = (s) => el.querySelector(s);
    const range = $('.al-range');
    let result = null;

    function set(d) {
      if (over) return;
      deg = clamp(d);
      range.value = deg;
      draw();
    }

    function draw() {
      const s = signalAt(c, deg);
      const pct = Math.round(s * 100);
      $('[data-needle]').setAttribute('transform', `rotate(${deg})`);
      $('[data-pct]').textContent = locale.startsWith('tr') ? `%${pct}` : `${pct}%`;
      $('[data-bar]').style.width = `${pct}%`;
      $('[data-bar]').className = pct >= c.successPct ? 'hot' : pct >= c.successPct / 2 ? 'warm' : 'cold';
      $('[data-deg]').textContent = `${fmt(deg, 1)}°`;
      $('[data-hold]').textContent = `${fmt(holdMs / 1000, 1)} / ${fmt(c.holdSeconds, 1)} s`;
      $('[data-holdbar]').style.width = `${Math.min(100, (holdMs / (c.holdSeconds * 1000)) * 100)}%`;
      if (c.timeLimitSeconds) $('[data-time]').textContent = `${fmt(Math.max(0, c.timeLimitSeconds - elapsed / 1000), 0)} s`;
    }

    function tick(now) {
      const dt = Math.min(100, now - last);
      last = now;
      if (!over) {
        elapsed += dt;
        holdMs = signalAt(c, deg) * 100 >= c.successPct ? holdMs + dt : 0;
        if (holdMs >= c.holdSeconds * 1000) finish(true);
        else if (c.timeLimitSeconds && elapsed >= c.timeLimitSeconds * 1000) finish(false);
        draw();
      }
      raf = requestAnimationFrame(tick);
    }

    function finish(success) {
      over = true;
      range.disabled = true;
      const s = signalAt(c, deg);
      result = {
        success,
        score: success ? alignScore(c, elapsed / 1000) : 0,
        detail: { finalDeg: deg, errorDeg: Math.round(angleError(c, deg) * 10) / 10, signalPct: Math.round(s * 100) },
      };
      const msg = $('[data-msg]');
      msg.className = `conv-msg ${success ? 'ok' : 'warn'}`;
      msg.textContent = success ? t('align.success') : t('align.timeout');
      $('[data-cancel]').hidden = true;
      $('[data-ok]').hidden = false;
      $('[data-ok]').focus();
    }

    function onKey(e) {
      if (over) return;
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        const dir = k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 1;
        set(deg + dir * step * (e.shiftKey ? 5 : 1));
      }
    }

    range.addEventListener('input', () => set(Number(range.value)));
    el.addEventListener('keydown', onKey);
    $('[data-cancel]').addEventListener('click', () => done({ success: false, score: 0, detail: { cancelled: true } }));
    $('[data-ok]').addEventListener('click', () => done(result));

    draw();
    range.focus();
    raf = requestAnimationFrame(tick);
    return { destroy() { cancelAnimationFrame(raf); el.removeEventListener('keydown', onKey); } };
  },
};
