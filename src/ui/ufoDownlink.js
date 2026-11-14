// UFO epilogue downlink (owner: K3). FICTIONAL scene, labelled as such on screen (CLAUDE.md, D-006).
// The anomaly photo comes down line by line; at the share the remaining data budget allows, solar conjunction
// cuts the signal. Then "Design the next mission" goes back to Sol 0.
//
//   mountUfoDownlink(el, {
//     t, locale,
//     photo: { clear: 'assets/ending/ufo_photo_clear.jpeg', blur: 'assets/ending/ufo_photo_blur.jpeg' },  // K4
//     cameraTier: state.flags.cameraTier,      // 'hires' -> clear photo, 'hand' -> blurred photo
//     photoMbit, remainingMbit,                // from the downlink budget (K1/K2 rule, see ufoStopPct)
//     seconds: 8,                              // real seconds for a full photo
//     stopAtPct?,                              // overrides ufoStopPct when K2 computes it differently
//     onRestart: () => { newGame(); goTo('design'); },
//   });
// Emits nothing; onRestart is the only way out.

/** Pure: how much of the photo arrives, in %, with the data budget that is left (proposal for the D-006 rule). */
export function ufoStopPct(remainingMbit, photoMbit) {
  if (!(photoMbit > 0)) return 0;
  return Math.max(0, Math.min(100, Math.floor((remainingMbit / photoMbit) * 100)));
}

export function mountUfoDownlink(el, opts) {
  const { t } = opts;
  const locale = () => (typeof opts.locale === 'function' ? opts.locale() : opts.locale || 'tr-TR');
  const fmt = (n, d = 0) => Number(n).toLocaleString(locale(), { maximumFractionDigits: d });
  const stopAt = opts.stopAtPct ?? ufoStopPct(opts.remainingMbit, opts.photoMbit);
  const tier = opts.cameraTier === 'hires' ? 'hires' : 'hand';
  const ms = (opts.seconds ?? 8) * 1000;
  let pct = 0;
  let raf = 0;
  let t0 = 0;
  let img = null;
  let done = false;

  el.classList.add('ufo');
  el.innerHTML = `
    <p class="ufo-fiction">${t('ufo.fiction')}</p>
    <h2>${t('ufo.title')}</h2>
    <canvas class="ufo-photo" width="320" height="200" role="img" aria-label="${t('ufo.photoAlt')}"></canvas>
    <div class="ufo-meta"><span>📡 ${t('ufo.sending')}</span><b data-mbit></b></div>
    <div class="bar-track ufo-track"><div class="bar-fill" data-fill></div><i class="ufo-stop" style="left:${stopAt}%"></i></div>
    <p class="ufo-tier">${t(`ufo.tier.${tier}`)}</p>
    <div class="ufo-end" data-end hidden>
      <p class="ufo-lost" role="alert" data-lost></p>
      <p class="ufo-why" data-why></p>
      <button class="btn launch" data-restart>${t('ufo.restart')}</button>
    </div>`;
  const $ = (s) => el.querySelector(s);
  const canvas = $('canvas');
  const ctx = canvas.getContext('2d');

  // Static noise for the rows that have not arrived (seeded so it does not flicker between frames).
  let noise = null;
  function makeNoise() {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    noise = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < noise.data.length; i += 4) {
      const v = 20 + rnd() * 40;
      noise.data[i] = v; noise.data[i + 1] = v * 0.9; noise.data[i + 2] = v * 1.2; noise.data[i + 3] = 255;
    }
  }
  makeNoise();

  function placeholder() {
    // Drawn only if K4's image cannot be loaded: a dusky sky with a bright smudge.
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#2b3756'); g.addColorStop(1, '#8e3a20');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(220,240,255,.85)';
    ctx.beginPath(); ctx.ellipse(200, 70, 26, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    if (tier === 'hand') ctx.filter = 'blur(3px)';
  }

  function draw() {
    const rows = Math.round((canvas.height * pct) / 100);
    ctx.putImageData(noise, 0, 0);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, canvas.width, rows); ctx.clip();
    if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    else placeholder();
    ctx.restore();
    ctx.filter = 'none';
    if (rows > 0 && rows < canvas.height) { ctx.fillStyle = '#7fa7d6'; ctx.fillRect(0, rows - 1, canvas.width, 2); } // scan line
    $('[data-fill]').style.width = `${pct}%`;
    $('[data-mbit]').textContent = `${fmt((opts.photoMbit * pct) / 100)} / ${fmt(opts.photoMbit)} Mbit · ${locale().startsWith('tr') ? `%${Math.floor(pct)}` : `${Math.floor(pct)}%`}`;
  }

  function tick(now) {
    if (!t0) t0 = now;
    pct = Math.min(stopAt, ((now - t0) / ms) * 100);
    draw();
    if (pct >= stopAt) return end();
    raf = requestAnimationFrame(tick);
  }

  function end() {
    done = true;
    $('[data-end]').hidden = false;
    $('[data-lost]').textContent = stopAt >= 100 ? t('ufo.arrived') : t('ufo.lost');
    $('[data-why]').textContent = stopAt >= 100 ? t('ufo.whyFull') : t('ufo.why').replace('{pct}', stopAt);
    $('[data-restart]').focus();
  }

  $('[data-restart]').addEventListener('click', () => opts.onRestart?.());

  const src = opts.photo?.[tier === 'hires' ? 'clear' : 'blur'];
  const start = () => { raf = requestAnimationFrame(tick); };
  if (src) {
    img = new Image();
    img.onload = () => {
      // Keep the photo's own aspect ratio (K4's photos are 16:9).
      canvas.height = Math.round((canvas.width * img.naturalHeight) / img.naturalWidth);
      makeNoise();
      start();
    };
    img.onerror = () => { img = null; start(); };
    img.src = src;
  } else start();

  return {
    isDone: () => done,
    destroy() { cancelAnimationFrame(raf); el.innerHTML = ''; el.classList.remove('ufo'); },
  };
}
