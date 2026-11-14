// Converter mini-game template (owner: K3): input -> time -> output.
// Used for ice -> water, water -> O2 + H2, regolith -> washed soil, and by experiments.
//
// The template holds no numbers. Every ratio, duration and energy cost comes in `config`,
// which the caller builds from nasa_data.json (each value there carries its `src`).
//
// config:
//   {
//     titleKey, introKey,                         // story.json keys
//     input:   { key: 'ice', unit: 'kg', available: 6, max: 6, step: 0.5 },
//     outputs: [{ key: 'water', unit: 'kg', perUnit: 1 }],   // output per 1 unit of input
//     minutesPerUnit: 20,                         // game minutes per 1 unit of input
//     whPerUnit: 150,                             // energy per 1 unit of input, Wh
//     energyAvailableWh: 2000,                    // optional: start is blocked above this
//     runSeconds: 3,                              // optional: real seconds of the progress animation
//   }
//
// done({ success, score, detail: { input: {key, amount}, outputs: [{key, amount}], energyWh, gameMinutes } })
// The converter has no skill element, so score is always 0. Effects are applied by the caller.

// Pure: what a given input amount produces. Clamps to what is available and rounds to `step`.
export function computeConversion(config, requested) {
  const inp = config.input;
  const cap = Math.min(inp.available ?? Infinity, inp.max ?? Infinity);
  const step = inp.step || 1;
  let amount = Math.max(0, Math.min(cap, Number(requested) || 0));
  amount = Math.floor(amount / step + 1e-9) * step;
  amount = round(amount);
  const outputs = (config.outputs || []).map((o) => ({ key: o.key, unit: o.unit, amount: round(amount * o.perUnit) }));
  const energyWh = round(amount * (config.whPerUnit || 0));
  const gameMinutes = round(amount * (config.minutesPerUnit || 0));
  let blocker = null;
  if (amount <= 0) blocker = 'nothing';
  else if (config.energyAvailableWh !== undefined && energyWh > config.energyAvailableWh) blocker = 'energy';
  return { input: { key: inp.key, unit: inp.unit, amount }, outputs, energyWh, gameMinutes, cap, blocker };
}

function round(x) { return Math.round(x * 1000) / 1000; }

export const converter = {
  mount(el, { config, t, locale, done }) {
    const inp = config.input;
    const step = inp.step || 1;
    const fmt = (n, d = 1) => Number(n).toLocaleString(locale, { maximumFractionDigits: d });
    const res = (key) => t(`resource.${key}`);
    const first = computeConversion(config, inp.start ?? Math.min(inp.available ?? 0, inp.max ?? Infinity));
    let plan = first;
    let timer = 0;
    let raf = 0;

    el.classList.add('converter');
    el.innerHTML = `
      <header class="mg-head">
        <span class="kicker">${t('minigame.converter')}</span>
        <h2>${t(config.titleKey)}</h2>
        ${config.introKey ? `<p class="mg-intro">${t(config.introKey)}</p>` : ''}
      </header>
      <div class="conv-flow">
        <div class="conv-box">
          <label for="conv-amount">${res(inp.key)}</label>
          <input id="conv-amount" type="range" min="0" max="${first.cap}" step="${step}" value="${first.input.amount}">
          <span class="conv-num" data-in></span>
          <span class="conv-sub">${t('converter.available')} ${fmt(inp.available)} ${inp.unit}</span>
        </div>
        <div class="conv-arrow" aria-hidden="true">→</div>
        <div class="conv-box conv-cost">
          <span class="chip"><i aria-hidden="true">⏱</i><span data-min></span></span>
          <span class="chip"><i aria-hidden="true">⚡</i><span data-wh></span></span>
        </div>
        <div class="conv-arrow" aria-hidden="true">→</div>
        <div class="conv-box conv-out" data-out></div>
      </div>
      <div class="conv-progress" hidden><div class="conv-progress-fill"></div></div>
      <p class="conv-msg" data-msg aria-live="polite"></p>
      <footer class="mg-foot">
        <button class="btn ghost" data-cancel>${t('minigame.cancel')}</button>
        <button class="btn" data-start>${t('converter.start')}</button>
        <button class="btn" data-ok hidden>${t('minigame.ok')}</button>
      </footer>`;

    const $ = (s) => el.querySelector(s);
    const slider = $('#conv-amount');

    function render() {
      $('[data-in]').textContent = `${fmt(plan.input.amount)} ${inp.unit}`;
      $('[data-min]').textContent = `${fmt(plan.gameMinutes, 0)} ${t('unit.minutes')}`;
      $('[data-wh]').textContent = `${fmt(plan.energyWh, 0)} Wh`
        + (config.energyAvailableWh !== undefined ? ` / ${fmt(config.energyAvailableWh, 0)} Wh` : '');
      $('.conv-cost').classList.toggle('over', plan.blocker === 'energy');
      $('[data-out]').innerHTML = plan.outputs.map((o) =>
        `<span class="conv-label">${res(o.key)}</span><span class="conv-num">${fmt(o.amount, 2)} ${o.unit}</span>`).join('');
      $('[data-msg]').textContent = plan.blocker ? t(`converter.block.${plan.blocker}`) : '';
      $('[data-msg]').className = `conv-msg ${plan.blocker ? 'warn' : ''}`;
      $('[data-start]').disabled = Boolean(plan.blocker);
    }

    slider.addEventListener('input', () => { plan = computeConversion(config, slider.value); render(); });
    $('[data-cancel]').addEventListener('click', () => done({ success: false, score: 0, detail: { cancelled: true } }));
    $('[data-start]').addEventListener('click', start);
    $('[data-ok]').addEventListener('click', finish);

    function start() {
      if (plan.blocker) return;
      slider.disabled = true;
      $('[data-start]').hidden = true;
      $('[data-cancel]').disabled = true;
      const bar = $('.conv-progress');
      const fill = $('.conv-progress-fill');
      bar.hidden = false;
      const ms = (config.runSeconds ?? 3) * 1000;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        fill.style.width = `${p * 100}%`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      $('[data-msg]').className = 'conv-msg';
      $('[data-msg]').textContent = t('converter.running');
      timer = setTimeout(() => {
        fill.style.width = '100%';
        $('[data-msg]').className = 'conv-msg ok';
        $('[data-msg]').textContent = t('converter.done');
        $('[data-ok]').hidden = false;
        $('[data-ok]').focus();
      }, ms);
    }

    function finish() {
      done({
        success: true,
        score: 0,
        detail: {
          input: { key: plan.input.key, amount: plan.input.amount },
          outputs: plan.outputs.map((o) => ({ key: o.key, amount: o.amount })),
          energyWh: plan.energyWh,
          gameMinutes: plan.gameMinutes,
        },
      });
    }

    render();
    slider.focus();
    return { destroy() { clearTimeout(timer); cancelAnimationFrame(raf); } };
  },
};
