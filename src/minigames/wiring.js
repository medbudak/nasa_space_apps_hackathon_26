// Wiring mini-game template (owner: K3): reconnect a junction box. Pick a cable end on the left, then the
// device it belongs to on the right. A wrong pair is a short circuit: one mistake, with a line that explains why.
//
// config (the caller shuffles `rightOrder` with the seeded RNG; this file holds no gameplay numbers):
//   {
//     titleKey, introKey,
//     pairs: [{ id: 'uhf', leftKey, rightKey, hintKey? }],   // story.json keys; hintKey explains a wrong match
//     rightOrder: ['xband', 'data', 'uhf', 'power'],         // order of the devices on the right
//     maxMistakes: 2,                                         // one more mistake fails the repair
//     timeLimitSeconds?: 40,
//   }
// done({ success, score, detail: { connected, mistakes } })

/** Pure: result of joining left `a` to right `b`. */
export function tryConnect(state, a, b) {
  if (state.connected.includes(a)) return { ok: false, reason: 'used' };
  if (a === b) return { ok: true };
  return { ok: false, reason: 'short' };
}

/** Pure: score for a finished repair. */
export function wiringScore(mistakes, secondsUsed, config) {
  const timePart = config.timeLimitSeconds ? Math.max(0, 1 - secondsUsed / config.timeLimitSeconds) : 1;
  return Math.max(10, Math.round(100 - mistakes * 25 - (1 - timePart) * 30));
}

export const wiring = {
  mount(el, { config, t, locale, done }) {
    const c = config;
    const st = { connected: [], mistakes: 0 };
    const leftIds = c.pairs.map((p) => p.id);
    const rightIds = c.rightOrder || leftIds;
    const byId = Object.fromEntries(c.pairs.map((p) => [p.id, p]));
    const COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#9085e9']; // dataviz dark steps
    let picked = null;
    let result = null;
    let t0 = performance.now();
    let timer = 0;

    el.classList.add('wiring');
    el.innerHTML = `
      <header class="mg-head">
        <span class="kicker">${t('minigame.wiring')}</span>
        <h2>${t(c.titleKey)}</h2>
        ${c.introKey ? `<p class="mg-intro">${t(c.introKey)}</p>` : ''}
      </header>
      <div class="wr-board">
        <div class="wr-col" data-left>${leftIds.map((id, i) => `
          <button class="wr-end" data-l="${id}" style="--wire:${COLORS[i % COLORS.length]}">
            <span class="wr-dot" aria-hidden="true"></span>${t(byId[id].leftKey)}</button>`).join('')}</div>
        <svg class="wr-wires" aria-hidden="true"></svg>
        <div class="wr-col" data-right>${rightIds.map((id) => `
          <button class="wr-dev" data-r="${id}"><span class="wr-dot" aria-hidden="true"></span>${t(byId[id].rightKey)}</button>`).join('')}</div>
      </div>
      <div class="wr-status"><span data-mistakes></span>${c.timeLimitSeconds ? '<span data-time></span>' : ''}</div>
      <p class="conv-msg" data-msg aria-live="polite"></p>
      <footer class="mg-foot">
        <button class="btn ghost" data-cancel>${t('minigame.cancel')}</button>
        <button class="btn" data-ok hidden>${t('minigame.ok')}</button>
      </footer>`;
    const $ = (s) => el.querySelector(s);
    const svg = $('.wr-wires');

    function status() {
      $('[data-mistakes]').textContent = t('wiring.mistakes').replace('{n}', st.mistakes).replace('{max}', c.maxMistakes);
      if (c.timeLimitSeconds) {
        const left = Math.max(0, c.timeLimitSeconds - (performance.now() - t0) / 1000);
        $('[data-time]').textContent = `⏱ ${Math.ceil(left)} s`;
        if (left <= 0 && !result) finish(false, t('wiring.timeout'));
      }
    }

    function drawWires() {
      const box = svg.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = st.connected.map((id) => {
        const a = el.querySelector(`[data-l="${id}"]`).getBoundingClientRect();
        const b = el.querySelector(`[data-r="${id}"]`).getBoundingClientRect();
        const y1 = a.top + a.height / 2 - box.top;
        const y2 = b.top + b.height / 2 - box.top;
        const color = getComputedStyle(el.querySelector(`[data-l="${id}"]`)).getPropertyValue('--wire');
        return `<path d="M0,${y1} C${box.width / 2},${y1} ${box.width / 2},${y2} ${box.width},${y2}"
          fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"></path>`;
      }).join('');
    }

    function pickLeft(id) {
      if (result || st.connected.includes(id)) return;
      picked = id;
      el.querySelectorAll('[data-l]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === id)));
      $('[data-msg]').className = 'conv-msg';
      $('[data-msg]').textContent = t('wiring.pickDevice').replace('{end}', t(byId[id].leftKey));
      el.querySelector(`[data-r]:not(.done)`)?.focus();
    }

    function pickRight(id) {
      if (result) return;
      if (el.querySelector(`[data-r="${id}"]`).classList.contains('done')) {
        $('[data-msg]').className = 'conv-msg';
        $('[data-msg]').textContent = t('wiring.alreadyDone');
        return;
      }
      if (!picked) {
        $('[data-msg]').className = 'conv-msg';
        $('[data-msg]').textContent = t('wiring.pickEndFirst');
        return;
      }
      const r = tryConnect(st, picked, id);
      const msg = $('[data-msg]');
      if (r.ok) {
        st.connected.push(picked);
        el.querySelector(`[data-l="${picked}"]`).classList.add('done');
        el.querySelector(`[data-r="${id}"]`).classList.add('done');
        el.querySelector(`[data-r="${id}"]`).style.setProperty('--wire', getComputedStyle(el.querySelector(`[data-l="${picked}"]`)).getPropertyValue('--wire'));
        msg.className = 'conv-msg ok';
        msg.textContent = t('wiring.connected');
        drawWires();
      } else {
        st.mistakes++;
        const hint = byId[picked].hintKey ? ` ${t(byId[picked].hintKey)}` : '';
        msg.className = 'conv-msg warn';
        msg.textContent = `⚡ ${t('wiring.short')}${hint}`;
        el.querySelector(`[data-r="${id}"]`).classList.add('spark');
        setTimeout(() => el.querySelector(`[data-r="${id}"]`)?.classList.remove('spark'), 400);
      }
      picked = null;
      el.querySelectorAll('[data-l]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      status();
      if (st.connected.length === leftIds.length) return finish(true, t('wiring.done'));
      if (st.mistakes > c.maxMistakes) return finish(false, t('wiring.fail'));
      el.querySelector('[data-l]:not(.done)')?.focus();
    }

    function finish(success, text) {
      clearInterval(timer);
      const secs = (performance.now() - t0) / 1000;
      result = { success, score: success ? wiringScore(st.mistakes, secs, c) : 0,
        detail: { connected: st.connected.length, mistakes: st.mistakes } };
      const msg = $('[data-msg]');
      msg.className = `conv-msg ${success ? 'ok' : 'warn'}`;
      msg.textContent = text;
      $('[data-cancel]').hidden = true;
      $('[data-ok]').hidden = false;
      $('[data-ok]').focus();
    }

    el.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => pickLeft(b.dataset.l)));
    el.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => pickRight(b.dataset.r)));
    $('[data-cancel]').addEventListener('click', () => done({ success: false, score: 0, detail: { cancelled: true } }));
    $('[data-ok]').addEventListener('click', () => { if (result) done(result); });
    status();
    if (c.timeLimitSeconds) timer = setInterval(status, 250);
    el.querySelector('[data-l]')?.focus();
    return { destroy() { clearInterval(timer); } };
  },
};
