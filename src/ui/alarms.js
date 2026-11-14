// Alarms (owner: K3): real and false (hallucinated) alarms look exactly the same. The player can check
// the reading on the Telemetry tab before deciding whether to act.
//
// Fake alarms ride on the D-003 effect event `hallucination` (K4 already draws its vignette from `alpha`):
//   bus.emit('hallucination', { alpha: 0.6, alarm: { id: 'h1', stat: 'o2', value: 2, unit: '%' } })
// Real alarms are raised by K2 through the HUD (no new event name):
//   hud.alarm({ id: 'o2-low', stat: 'o2', value: 8, unit: '%', real: true })
//
// When the player answers, onResolve({ id, stat, fake, answer: 'fake' | 'real', verified, correct }) is called.
// K2 decides the consequence (e.g. sanity +/−, or the cost of an emergency procedure for nothing).
//
// readStat(stat) -> { value, unit, note? } gives the real reading shown after "check telemetry".

/** Pure: was the player's answer right? */
export function judge(alarm, answer) {
  return (answer === 'fake') === Boolean(alarm.fake);
}

export function mountAlarms(root, opts) {
  const { bus, t } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const fmt = (n, d = 1) => Number(n).toLocaleString(locale(), { maximumFractionDigits: d });
  const queue = [];
  let current = null;

  const el = document.createElement('div');
  el.className = 'alarm-layer';
  root.appendChild(el);

  function show(alarm) {
    const a = { ...alarm, fake: !alarm.real, verified: false };
    if (current?.id === a.id || queue.some((q) => q.id === a.id)) return;
    queue.push(a);
    if (!current) next();
  }

  function next() {
    current = queue.shift() || null;
    render();
    if (current) el.querySelector('[data-verify]')?.focus();
  }

  const valueText = (value, unit) => (unit === '%'
    ? (locale().startsWith('tr') ? `%${fmt(value, 0)}` : `${fmt(value, 0)}%`)
    : `${fmt(value)} ${unit || ''}`.trim());

  function render() {
    if (!current) { el.innerHTML = ''; return; }
    const a = current;
    const reading = a.verified ? opts.readStat?.(a.stat) : null;
    el.innerHTML = `
      <section class="alarm" role="alertdialog" aria-labelledby="alarm-title" aria-describedby="alarm-text">
        <h2 id="alarm-title">⚠ ${t(`alarm.stat.${a.stat}`)} ${valueText(a.value, a.unit)}!</h2>
        <p id="alarm-text">${t(`alarm.text.${a.stat}`)}</p>
        ${a.verified ? `<p class="alarm-reading">${reading
          ? `${t('alarm.reading')} ${t(`alarm.stat.${a.stat}`)}: <b>${valueText(reading.value, reading.unit)}</b>${reading.note ? ` · ${reading.note}` : ''}`
          : t('alarm.noReading')}</p>` : ''}
        <div class="alarm-actions">
          ${a.verified ? '' : `<button class="btn ghost" data-verify>📈 ${t('alarm.verify')}</button>`}
          <button class="btn ghost" data-answer="fake">${t('alarm.saidFake')}</button>
          <button class="btn" data-answer="real">${t('alarm.saidReal')}</button>
        </div>
      </section>`;
    el.querySelector('[data-verify]')?.addEventListener('click', () => {
      a.verified = true;
      opts.onVerify?.(a.stat);
      render();
      el.querySelector('[data-answer="fake"]')?.focus();
    });
    el.querySelectorAll('[data-answer]').forEach((b) => b.addEventListener('click', () => answer(b.dataset.answer)));
  }

  function answer(ans) {
    const a = current;
    opts.onResolve?.({ id: a.id, stat: a.stat, fake: a.fake, answer: ans, verified: a.verified, correct: judge(a, ans) });
    next();
  }

  const onHallucination = (p) => { if (p?.alarm) show({ ...p.alarm, real: false }); };
  bus?.on('hallucination', onHallucination);

  return {
    show,
    isOpen: () => Boolean(current),
    refresh: render,
    destroy() { bus?.off?.('hallucination', onHallucination); el.remove(); },
  };
}
