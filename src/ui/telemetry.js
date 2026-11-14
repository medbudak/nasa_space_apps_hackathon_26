// Telemetry (owner: K3): charts of the last few sols for the HUD "Telemetry" tab.
// Also the place where the player checks a suspicious alarm against the real reading.
//
//   const tm = createTelemetry({ maxSols: 3 });   // once per run
//   tm.sample(state);                              // K2's surface loop, every step (cheap; thins itself)
//   mountTelemetry(el, { telemetry: tm, t, locale, refreshMs: 1000 });
//
// History is kept here, not in gameState (no new state field), so a page reload starts the charts empty.
//
// Channels read from K1/K2's gameState:
//   batteryKWh   state.power.batteryWh / 1000
//   insideC      state.env.insideC
//   outsideC     state.env.outsideC
//   radiationMSv state.life.radiationMSv (cumulative dose)
//   deltaVKms    opts.readDeltaV(state) — Δv left for the return; no state field exists yet, so the chart says "no data"

const COLORS = { primary: '#3987e5', second: '#d95926' }; // dataviz dark steps, validated on #141b2d

export function createTelemetry(opts = {}) {
  const maxSols = opts.maxSols ?? 3;
  const minStep = opts.minStepSol ?? 0.005; // ~7 game minutes between samples
  const readDeltaV = opts.readDeltaV || (() => undefined);
  const points = [];

  return {
    points,
    sample(state) {
      if (!state?.time) return false;
      const T = state.time.sol + state.time.solFraction;
      const last = points.at(-1);
      if (last && T - last.T < minStep) return false;
      points.push({
        T,
        batteryKWh: state.power ? state.power.batteryWh / 1000 : undefined,
        insideC: state.env?.insideC,
        outsideC: state.env?.outsideC,
        radiationMSv: state.life?.radiationMSv,
        deltaVKms: readDeltaV(state),
      });
      while (points.length && points[0].T < T - maxSols) points.shift();
      return true;
    },
    latest() { return points.at(-1) || null; },
    clear() { points.length = 0; },
  };
}

/** Pure: "nice" axis bounds and ticks for a value range. */
export function niceTicks(min, max, count = 3) {
  if (!(isFinite(min) && isFinite(max))) return { lo: 0, hi: 1, ticks: [0, 0.5, 1] };
  if (min === max) { min -= 1; max += 1; }
  const raw = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, ticks };
}

const CHARTS = [
  { id: 'battery', unit: 'kWh', series: [{ key: 'batteryKWh', color: COLORS.primary }], digits: 1, zero: true },
  { id: 'temp', unit: '°C', series: [{ key: 'insideC', color: COLORS.primary, labelKey: 'telemetry.inside' },
    { key: 'outsideC', color: COLORS.second, labelKey: 'telemetry.outside' }], digits: 0 },
  { id: 'deltaV', unit: 'km/s', series: [{ key: 'deltaVKms', color: COLORS.primary }], digits: 2, zero: true },
  { id: 'radiation', unit: 'mSv', series: [{ key: 'radiationMSv', color: COLORS.primary }], digits: 2, zero: true },
];

const W = 320;
const H = 130;
const PAD = { l: 40, r: 44, t: 10, b: 22 };

export function mountTelemetry(el, opts) {
  const { telemetry, t } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const fmt = (n, d) => Number(n).toLocaleString(locale(), { maximumFractionDigits: d, minimumFractionDigits: d });
  let timer = 0;
  el.classList.add('telemetry');

  function chart(def) {
    const pts = telemetry.points;
    const has = def.series.some((s) => pts.some((p) => typeof p[s.key] === 'number'));
    const title = `<h3 class="tm-title">${t(`telemetry.${def.id}`)} <span>(${def.unit})</span></h3>`;
    if (!has) return `<figure class="tm-chart">${title}<p class="tm-empty">${t('telemetry.noData')}</p></figure>`;

    const vals = def.series.flatMap((s) => pts.map((p) => p[s.key]).filter((v) => typeof v === 'number'));
    const { lo, hi, ticks } = niceTicks(def.zero ? Math.min(0, ...vals) : Math.min(...vals), Math.max(...vals));
    const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
    const tickDigits = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
    const T1 = pts.at(-1).T;
    const T0 = Math.min(pts[0].T, T1 - 0.25);
    const x = (T) => PAD.l + ((T - T0) / (T1 - T0 || 1)) * (W - PAD.l - PAD.r);
    const y = (v) => PAD.t + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD.t - PAD.b);
    const solTicks = [];
    for (let s = Math.ceil(T0); s <= T1; s++) solTicks.push(s);

    const lines = def.series.map((s) => {
      const d = pts.filter((p) => typeof p[s.key] === 'number')
        .map((p, i) => `${i ? 'L' : 'M'}${x(p.T).toFixed(1)},${y(p[s.key]).toFixed(1)}`).join('');
      const last = [...pts].reverse().find((p) => typeof p[s.key] === 'number');
      const label = s.labelKey
        ? `<text x="${x(last.T) + 4}" y="${y(last[s.key]) + 4}" class="tm-label">${t(s.labelKey)}</text>` : '';
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>${label}`;
    }).join('');

    const legend = def.series.length > 1
      ? `<div class="tm-legend">${def.series.map((s) => `<span><i style="background:${s.color}"></i>${t(s.labelKey)}</span>`).join('')}</div>` : '';

    return `<figure class="tm-chart" data-chart="${def.id}">${title}${legend}
      <svg viewBox="0 0 ${W} ${H}" class="tm-svg" role="img" aria-label="${t(`telemetry.${def.id}`)}">
        ${ticks.map((v) => `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}" class="tm-grid"></line>
          <text x="${PAD.l - 6}" y="${y(v) + 4}" class="tm-axis" text-anchor="end">${fmt(v, tickDigits)}</text>`).join('')}
        ${solTicks.map((s) => `<line x1="${x(s)}" x2="${x(s)}" y1="${PAD.t}" y2="${H - PAD.b}" class="tm-grid sol"></line>
          <text x="${x(s)}" y="${H - 6}" class="tm-axis" text-anchor="middle">Sol ${s}</text>`).join('')}
        ${lines}
        <g class="tm-hover" visibility="hidden"><line class="tm-cross" x1="0" x2="0" y1="${PAD.t}" y2="${H - PAD.b}"></line></g>
        <rect x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}" class="tm-hit"></rect>
      </svg>
      <div class="tm-tip" hidden></div>
    </figure>`;
  }

  function render() {
    el.innerHTML = `<header class="dl-head"><h2>${t('telemetry.title')}</h2>
      <span class="dl-delay">${t('telemetry.window').replace('{n}', 3)}</span></header>
      <div class="tm-grid-wrap">${CHARTS.map(chart).join('')}</div>`;
    el.querySelectorAll('[data-chart]').forEach(hover);
  }

  // Crosshair + tooltip with the nearest sample.
  function hover(fig) {
    const def = CHARTS.find((c) => c.id === fig.dataset.chart);
    const svg = fig.querySelector('svg');
    const hit = fig.querySelector('.tm-hit');
    const g = fig.querySelector('.tm-hover');
    const cross = fig.querySelector('.tm-cross');
    const tip = fig.querySelector('.tm-tip');
    const pts = telemetry.points;
    const T1 = pts.at(-1).T;
    const T0 = Math.min(pts[0].T, T1 - 0.25);
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width) * W;
      const T = T0 + ((sx - PAD.l) / (W - PAD.l - PAD.r)) * (T1 - T0);
      const p = pts.reduce((b, q) => (Math.abs(q.T - T) < Math.abs(b.T - T) ? q : b), pts[0]);
      const px = PAD.l + ((p.T - T0) / (T1 - T0 || 1)) * (W - PAD.l - PAD.r);
      cross.setAttribute('x1', px);
      cross.setAttribute('x2', px);
      g.setAttribute('visibility', 'visible'); // SVG ignores the hidden attribute
      const h = Math.floor(((p.T % 1) * 24));
      const m = Math.floor((((p.T % 1) * 24) % 1) * 60);
      tip.innerHTML = `<b>Sol ${Math.floor(p.T)} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b>`
        + def.series.filter((s) => typeof p[s.key] === 'number')
          .map((s) => `<span><i style="background:${s.color}"></i>${s.labelKey ? t(s.labelKey) + ': ' : ''}${fmt(p[s.key], def.digits)} ${def.unit}</span>`).join('');
      tip.hidden = false;
      tip.style.left = `${(px / W) * 100}%`;
    });
    hit.addEventListener('pointerleave', () => { g.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  }

  render();
  if (opts.refreshMs) timer = setInterval(() => { if (!el.querySelector('.tm-tip:not([hidden])')) render(); }, opts.refreshMs);

  return {
    refresh: render,
    destroy() { clearInterval(timer); el.innerHTML = ''; el.classList.remove('telemetry'); },
  };
}
