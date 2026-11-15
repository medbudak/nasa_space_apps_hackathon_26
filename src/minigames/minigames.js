/**
 * SOL 14: RED HORIZON — 4 Mini-Oyun Şablonu (K3)
 * Sözleşme #5: await runMinigame(type, config) -> { success, score (0..1), timeUsed (sn), skipped }
 *   wires     : kara kutu / radyatör / kurtarma kablo eşleştirme
 *   align     : anten / spektrometre / ses hızı frekans hizalama
 *   qte       : 0.38g sarkaç & serbest düşüş kronometre zamanlama (denge noktası geçişleri)
 *   converter : perklorat yıkama & Sabatier / MOXIE akış dönüştürücü (basılı tut - doğru bantta bırak)
 * RULES §2.6: Her mini-oyunda ESC ile kaçış vardır; oyun döngüsü asla kilitlenmez.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const DEFAULT_TIME = { wires: 25, align: 20, qte: 25, converter: 30 };
  const ICON = { wires: 'power', align: 'signal', qte: 'clock', converter: 'flask' };
  let active = null;

  S.isMinigameOpen = () => Boolean(active) || Boolean(S.FieldCam && S.FieldCam.open);

  S.runMinigame = function runMinigame(type = 'qte', config = {}) {
    return new Promise((resolve) => {
      if (!document.getElementById('modal-layer')) {
        resolve({ success: true, score: 1, timeUsed: 0, skipped: true });
        return;
      }
      // FIELD CAM (K3 Medine): kendi vizör ekranı olan fotoğraf mini oyunu (src/ui/field_cam.js)
      if (type === 'fieldcam' && S.FieldCam) {
        S.FieldCam.run(config).then(resolve);
        return;
      }
      if (active) active.finish(false, 0, true);
      const start = performance.now();
      const limit = config.timeLimitSec || DEFAULT_TIME[type] || 20;
      const title = config.titleKey ? t(config.titleKey) : config.title || t('mg.' + type + '.title');
      const desc = config.descKey ? t(config.descKey) : t('mg.' + type + '.desc');
      const disposers = [];
      let finished = false;
      let timeoutHandler = null;
      let keyHandler = null;

      const html =
        '<div class="mg mg-' + type + '">' +
        '<div class="mg-head"><span class="mg-tag">' + S.UI.icon(ICON[type]) + t('mg.' + type + '.label') + '</span>' +
        '<h3>' + S.util.escape(title) + '</h3>' +
        '<button class="btn btn-ghost btn-sm" data-mg-skip>' + t('mg.skip') + '</button></div>' +
        '<p class="mg-desc">' + S.util.escape(desc) + '</p>' +
        '<div class="mg-timer"><div class="mg-timer-fill"></div></div>' +
        '<div class="mg-body"></div>' +
        '<div class="mg-hint">' + t('mg.' + type + '.hint') + '</div>' +
        '<div class="mg-result" hidden></div></div>';

      const box = S.UI.openModal('minigame', html, { closable: false, cls: 'modal-minigame' });
      const body = box.querySelector('.mg-body');
      const timerFill = box.querySelector('.mg-timer-fill');

      const finish = (success, score, skipped = false) => {
        if (finished) return;
        finished = true;
        disposers.forEach((fn) => {
          try {
            fn();
          } catch (e) {
            /* yok say */
          }
        });
        window.removeEventListener('keydown', onKey, true);
        const timeUsed = Math.round(((performance.now() - start) / 1000) * 10) / 10;
        const result = { success, score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100, timeUsed, skipped };
        const res = box.querySelector('.mg-result');
        res.hidden = false;
        res.className = 'mg-result ' + (success ? 'ok' : 'bad');
        res.innerHTML =
          S.UI.icon(success ? 'check' : 'x') +
          '<b>' + t(skipped ? 'mg.result_skipped' : success ? 'mg.result_ok' : 'mg.result_fail') + '</b>' +
          '<span>' + t('mg.result_quality', { pct: Math.round(result.score * 100) }) + '</span>';
        S.bus.emit('audio:play', success ? 'success' : 'fail');
        setTimeout(() => {
          S.UI.closeModal('minigame', true);
          active = null;
          resolve(result);
        }, skipped ? 250 : 750);
      };

      const onKey = (e) => {
        if (finished) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          finish(true, 0.6, true);
          return;
        }
        if (keyHandler) {
          const used = keyHandler(e);
          if (used) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      };
      window.addEventListener('keydown', onKey, true);
      box.querySelector('[data-mg-skip]').addEventListener('click', () => finish(true, 0.6, true));

      // Zamanlayıcı
      let raf = 0;
      const tick = () => {
        if (finished) return;
        const el = (performance.now() - start) / 1000;
        const frac = Math.max(0, 1 - el / limit);
        timerFill.style.width = frac * 100 + '%';
        timerFill.classList.toggle('low', frac < 0.25);
        if (el >= limit) {
          if (timeoutHandler) timeoutHandler();
          else finish(false, 0.3);
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      disposers.push(() => cancelAnimationFrame(raf));

      const ctx = {
        body,
        config,
        finish,
        elapsed: () => (performance.now() - start) / 1000,
        limit,
        onKey: (fn) => (keyHandler = fn),
        onTimeout: (fn) => (timeoutHandler = fn),
        dispose: (fn) => disposers.push(fn),
        sfx: (name, payload) => {
          S.bus.emit('audio:play', payload ? Object.assign({ name }, payload) : name);
          // Mobil dokunsal geri bildirim (destekleyen cihazlarda): hata = kısa titreşim, bağlantı = tık
          if ((name === 'fail' || name === 'wire') && navigator.vibrate) {
            try {
              navigator.vibrate(name === 'fail' ? 60 : 15);
            } catch (e) {
              /* yok say */
            }
          }
        }
      };
      active = { finish };
      try {
        (TEMPLATES[type] || TEMPLATES.qte)(ctx);
      } catch (err) {
        console.error('[minigame]', err);
        finish(true, 0.7, true);
      }
    });
  };

  const TEMPLATES = {};

  /* ================================================================ */
  /* 1) WIRES — renkli uçları eşleştir                                */
  /* ================================================================ */
  TEMPLATES.wires = function (ctx) {
    const N = ctx.config.pairs || 4;
    const PALETTE = ['#e8423b', '#3fa9f5', '#3fe08a', '#ffc233', '#c77dff'];
    // config.match = [{ left, right }]: soldaki uç sağdaki farklı bir etikete bağlanır (ör. telemetri kanalı → alt sistem)
    const CODES = ctx.config.match
      ? ctx.config.match.map((m, i) => ({ code: m.left, right: m.right, color: PALETTE[i % PALETTE.length] }))
      : [
          { code: 'PWR 28V', color: '#e8423b' },
          { code: 'TLM BUS', color: '#3fa9f5' },
          { code: 'GND ISO', color: '#3fe08a' },
          { code: 'RS-422', color: '#ffc233' },
          { code: 'HTR LOOP', color: '#c77dff' }
        ].slice(0, N);
    // Eşleme modunda sağ uçlar renk ipucu vermez: bağlantıyı bilgiyle kurarsın
    const rightColor = (c) => (ctx.config.match ? '#8a8f9a' : c.color);
    const right = CODES.map((c, i) => i);
    for (let i = right.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [right[i], right[j]] = [right[j], right[i]];
    }
    if (right.every((v, i) => v === i)) right.reverse();

    ctx.body.innerHTML =
      '<div class="wires">' +
      '<div class="wires-col left">' +
      CODES.map((c, i) => '<button class="wire-node" data-side="L" data-i="' + i + '" style="--wc:' + c.color + '"><kbd>' + (i + 1) + '</kbd><span>' + c.code + '</span><i class="plug"></i></button>').join('') +
      '</div><svg class="wires-svg"></svg>' +
      '<div class="wires-col right">' +
      right.map((ci, k) => '<button class="wire-node" data-side="R" data-i="' + ci + '" data-k="' + k + '" style="--wc:' + rightColor(CODES[ci]) + '"><i class="plug"></i><span>' + (CODES[ci].right || CODES[ci].code) + '</span><kbd>' + String.fromCharCode(65 + k) + '</kbd></button>').join('') +
      '</div></div><div class="wires-status"></div>';

    const wrap = ctx.body.querySelector('.wires');
    const svg = ctx.body.querySelector('.wires-svg');
    const status = ctx.body.querySelector('.wires-status');
    let selected = null;
    let mistakes = 0;
    const done = new Set();

    const center = (el, side) => {
      const wr = wrap.getBoundingClientRect();
      const r = el.querySelector('.plug').getBoundingClientRect();
      return { x: r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top, side };
    };
    const redraw = () => {
      const wr = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);
      let h = '';
      for (const i of done) {
        const a = center(wrap.querySelector('[data-side="L"][data-i="' + i + '"]'));
        const b = center(wrap.querySelector('[data-side="R"][data-i="' + i + '"]'));
        const mx = (a.x + b.x) / 2;
        h += '<path class="wire-line" d="M' + a.x + ',' + a.y + ' C' + mx + ',' + a.y + ' ' + mx + ',' + b.y + ' ' + b.x + ',' + b.y + '" stroke="' + CODES[i].color + '"/>';
      }
      svg.innerHTML = h;
    };
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    ctx.dispose(() => window.removeEventListener('resize', onResize));

    const updateStatus = () => {
      status.innerHTML = t('mg.wires.status', { n: done.size, total: N, err: mistakes });
    };
    updateStatus();

    const pick = (side, i) => {
      if (done.has(i) && side === 'L') return;
      if (side === 'L') {
        selected = i;
        wrap.querySelectorAll('[data-side="L"]').forEach((b) => b.classList.toggle('sel', Number(b.dataset.i) === i));
        ctx.sfx('tick', { freq: 520 + i * 80 });
        return;
      }
      if (selected === null) {
        ctx.sfx('fail');
        return;
      }
      const target = wrap.querySelector('[data-side="R"][data-i="' + i + '"]');
      if (i === selected && !done.has(i)) {
        done.add(i);
        wrap.querySelector('[data-side="L"][data-i="' + i + '"]').classList.add('done');
        target.classList.add('done');
        ctx.sfx('wire');
        selected = null;
        wrap.querySelectorAll('.sel').forEach((b) => b.classList.remove('sel'));
        redraw();
        updateStatus();
        if (done.size === N) {
          const timePen = (ctx.elapsed() / ctx.limit) * 0.25;
          setTimeout(() => ctx.finish(true, 1 - mistakes * 0.12 - timePen), 250);
        }
      } else {
        mistakes++;
        target.classList.add('spark');
        setTimeout(() => target.classList.remove('spark'), 400);
        ctx.sfx('fail');
        updateStatus();
      }
    };

    wrap.querySelectorAll('.wire-node').forEach((b) =>
      b.addEventListener('click', () => pick(b.dataset.side, Number(b.dataset.i)))
    );
    ctx.onKey((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= N) {
        pick('L', n - 1);
        return true;
      }
      const k = e.key.toUpperCase().charCodeAt(0) - 65;
      if (e.key.length === 1 && k >= 0 && k < N) {
        pick('R', right[k]);
        return true;
      }
      return false;
    });
    ctx.onTimeout(() => ctx.finish(done.size >= N - 1, 0.25 + (done.size / N) * 0.4));
  };

  /* ================================================================ */
  /* 2) ALIGN — hedef dalga ile sinyali çakıştır                      */
  /* ================================================================ */
  TEMPLATES.align = function (ctx) {
    const target = ctx.config.targetValue !== undefined ? ctx.config.targetValue : 22 + Math.floor(Math.random() * 60);
    const tol = 5;
    let value = target > 50 ? 12 : 88;
    let attempts = 0;
    ctx.body.innerHTML =
      '<div class="align">' +
      '<canvas class="align-cv" width="520" height="150"></canvas>' +
      '<div class="align-meter"><span>' + t('mg.align.signal') + '</span><div class="bar cyan"><div class="bar-fill"></div></div><b class="align-val"></b></div>' +
      '<div class="align-ctrl"><button class="btn btn-ghost" data-d="-1">' + S.UI.icon('arrowL') + '</button>' +
      '<input type="range" min="0" max="100" step="1" value="' + value + '" class="align-range"/>' +
      '<button class="btn btn-ghost" data-d="1">' + S.UI.icon('arrowR') + '</button></div>' +
      '<button class="btn btn-primary btn-lg align-lock">' + S.UI.icon('target') + t('mg.align.lock') + '</button></div>';
    const cv = ctx.body.querySelector('.align-cv');
    const g = cv.getContext('2d');
    const range = ctx.body.querySelector('.align-range');
    const fill = ctx.body.querySelector('.align-meter .bar-fill');
    const valEl = ctx.body.querySelector('.align-val');
    let lastTick = 0;

    const set = (v) => {
      value = Math.max(0, Math.min(100, v));
      range.value = value;
      const now = performance.now();
      if (now - lastTick > 70) {
        lastTick = now;
        ctx.sfx('tick', { freq: 300 + value * 7 });
      }
    };
    range.addEventListener('input', () => set(Number(range.value)));
    ctx.body.querySelectorAll('[data-d]').forEach((b) => {
      let iv = null;
      const step = () => set(value + Number(b.dataset.d));
      b.addEventListener('pointerdown', () => {
        step();
        iv = setInterval(step, 70);
      });
      const stop = () => clearInterval(iv);
      b.addEventListener('pointerup', stop);
      b.addEventListener('pointerleave', stop);
      ctx.dispose(stop);
    });

    let raf = 0;
    const draw = () => {
      const tt = performance.now() / 1000;
      const diff = Math.abs(value - target);
      const strength = Math.max(0, 1 - diff / 45);
      g.fillStyle = '#071017';
      g.fillRect(0, 0, 520, 150);
      g.strokeStyle = 'rgba(63,224,230,0.12)';
      g.lineWidth = 1;
      for (let x = 0; x < 520; x += 26) {
        g.beginPath();
        g.moveTo(x + 0.5, 0);
        g.lineTo(x + 0.5, 150);
        g.stroke();
      }
      for (let y = 0; y < 150; y += 25) {
        g.beginPath();
        g.moveTo(0, y + 0.5);
        g.lineTo(520, y + 0.5);
        g.stroke();
      }
      const wave = (freq, phase, amp, color, dash) => {
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.setLineDash(dash || []);
        g.beginPath();
        for (let x = 0; x <= 520; x += 3) {
          const y = 75 + Math.sin((x / 520) * Math.PI * 2 * freq + phase) * amp + (dash ? 0 : (Math.random() - 0.5) * (1 - strength) * 14);
          if (x === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
        g.setLineDash([]);
      };
      wave(2 + target / 12, tt * 2, 40, 'rgba(63,224,230,0.55)', [6, 5]);
      wave(2 + value / 12, tt * 2, 40 * (0.5 + strength / 2), diff <= tol ? '#3fe08a' : '#ffb347');
      fill.style.width = Math.round(strength * 100) + '%';
      valEl.textContent = Math.round(strength * 100) + '%';
      ctx.body.querySelector('.align-meter').classList.toggle('locked', diff <= tol);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    ctx.dispose(() => cancelAnimationFrame(raf));

    const lock = () => {
      const diff = Math.abs(value - target);
      attempts++;
      if (diff <= tol) {
        ctx.finish(true, 1 - (diff / tol) * 0.12 - (attempts - 1) * 0.1);
      } else if (diff <= tol * 3) {
        ctx.finish(true, 0.72 - (attempts - 1) * 0.1);
      } else {
        ctx.sfx('fail');
        cv.classList.add('shake');
        setTimeout(() => cv.classList.remove('shake'), 350);
        if (attempts >= 3) ctx.finish(false, 0.35);
      }
    };
    ctx.body.querySelector('.align-lock').addEventListener('click', lock);
    ctx.onKey((e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        set(value - (e.shiftKey ? 5 : 1));
        return true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        set(value + (e.shiftKey ? 5 : 1));
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        lock();
        return true;
      }
      return false;
    });
    ctx.onTimeout(() => {
      const diff = Math.abs(value - target);
      ctx.finish(diff <= tol * 2, diff <= tol * 2 ? 0.6 : 0.3);
    });
  };

  /* ================================================================ */
  /* 3) QTE — sarkaç denge noktasından geçerken kronometreyi yakala    */
  /* ================================================================ */
  TEMPLATES.qte = function (ctx) {
    const needed = ctx.config.hits || 3;
    const maxTries = needed + 2;
    const period = ctx.config.periodSec || S.Engineering.calcPendulumPeriod(1) * 0.6;
    const zone = 0.2;
    let hits = 0;
    let tries = 0;
    let lastHitT = null;
    const stamps = [];
    ctx.body.innerHTML =
      '<div class="qte">' +
      '<canvas class="qte-cv" width="520" height="190"></canvas>' +
      '<div class="qte-dots">' + Array.from({ length: needed }, () => '<i></i>').join('') + '</div>' +
      '<div class="qte-readout"></div>' +
      '<button class="btn btn-primary btn-lg qte-hit">' + S.UI.icon('clock') + t('mg.qte.hit') + '</button></div>';
    const cv = ctx.body.querySelector('.qte-cv');
    const g = cv.getContext('2d');
    const t0 = performance.now();
    let flash = 0;
    let flashOk = true;

    const phase = () => (((performance.now() - t0) / 1000) * 2 * Math.PI) / period;
    const pos = () => Math.sin(phase());

    let raf = 0;
    const draw = () => {
      const p = pos();
      g.fillStyle = '#0b0f17';
      g.fillRect(0, 0, 520, 190);
      // Bölge
      g.fillStyle = 'rgba(63,224,138,0.18)';
      g.fillRect(260 - zone * 230, 150, zone * 460, 26);
      g.strokeStyle = '#3fe08a';
      g.strokeRect(260 - zone * 230 + 0.5, 150.5, zone * 460, 26);
      g.fillStyle = '#2a3140';
      g.fillRect(30, 162, 460, 2);
      // Sarkaç
      const ang = p * 0.75;
      const bx = 260 + Math.sin(ang) * 130;
      const by = 18 + Math.cos(ang) * 120;
      g.strokeStyle = '#9aa3ad';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(260, 18);
      g.lineTo(bx, by);
      g.stroke();
      g.fillStyle = '#d9d2c8';
      g.fillRect(Math.round(bx) - 8, Math.round(by) - 8, 16, 16);
      g.fillStyle = '#8a8178';
      g.fillRect(Math.round(bx) - 8, Math.round(by) + 4, 16, 4);
      g.fillStyle = '#5c636e';
      g.fillRect(200, 10, 120, 8);
      // İmleç
      const cx = 260 + p * 230;
      g.fillStyle = Math.abs(p) <= zone ? '#3fe08a' : '#ffb347';
      g.fillRect(Math.round(cx) - 3, 146, 6, 34);
      if (flash > 0) {
        g.fillStyle = flashOk ? 'rgba(63,224,138,' + flash + ')' : 'rgba(232,66,59,' + flash + ')';
        g.fillRect(0, 0, 520, 190);
        flash = Math.max(0, flash - 0.06);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    ctx.dispose(() => cancelAnimationFrame(raf));

    const readout = ctx.body.querySelector('.qte-readout');
    const hit = () => {
      tries++;
      const p = pos();
      const ok = Math.abs(p) <= zone;
      flash = 0.5;
      flashOk = ok;
      if (ok) {
        hits++;
        const now = performance.now() / 1000;
        if (lastHitT !== null) stamps.push(now - lastHitT);
        lastHitT = now;
        ctx.body.querySelectorAll('.qte-dots i')[hits - 1].classList.add('on');
        ctx.sfx('tick', { freq: 880 });
        if (stamps.length) {
          const avg = stamps.reduce((a, b) => a + b, 0) / stamps.length;
          readout.textContent = t('mg.qte.readout', { s: avg.toFixed(2) });
        }
      } else {
        ctx.sfx('fail');
      }
      if (hits >= needed) ctx.finish(true, 1 - (tries - hits) * 0.12);
      else if (tries >= maxTries) ctx.finish(hits >= needed - 1, 0.35 + (hits / needed) * 0.35);
    };
    ctx.body.querySelector('.qte-hit').addEventListener('click', hit);
    cv.addEventListener('pointerdown', hit);
    ctx.onKey((e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!e.repeat) hit();
        return true;
      }
      return false;
    });
    ctx.onTimeout(() => ctx.finish(hits >= needed - 1, 0.3 + (hits / needed) * 0.3));
  };

  /* ================================================================ */
  /* 4) CONVERTER — basılı tut, akışı hedef banda getir, bırak          */
  /* ================================================================ */
  TEMPLATES.converter = function (ctx) {
    const theme = ctx.config.theme || 'sabatier';
    const stages = [1, 2, 3].map((n) => 'mg.converter.' + theme + '.s' + n);
    let stage = 0;
    let level = 0;
    let holding = false;
    let mistakes = 0;
    const band = () => {
      const lo = 48 + stage * 8;
      return [lo, lo + 16];
    };
    ctx.body.innerHTML =
      '<div class="conv">' +
      '<div class="conv-steps">' + stages.map((k, i) => '<div class="conv-step" data-s="' + i + '"><b>' + (i + 1) + '</b>' + t(k) + '</div>').join('') + '</div>' +
      '<div class="conv-main"><div class="conv-tank"><div class="conv-band"></div><div class="conv-fill"></div><div class="conv-bubbles"></div></div>' +
      '<div class="conv-info"><div class="conv-label"></div><div class="conv-pct">0%</div><div class="conv-eq">' + t('mg.converter.' + theme + '.eq') + '</div></div></div>' +
      '<button class="btn btn-primary btn-lg conv-hold">' + S.UI.icon('power') + t('mg.converter.hold') + '</button></div>';
    const fill = ctx.body.querySelector('.conv-fill');
    const bandEl = ctx.body.querySelector('.conv-band');
    const pctEl = ctx.body.querySelector('.conv-pct');
    const label = ctx.body.querySelector('.conv-label');
    const tank = ctx.body.querySelector('.conv-tank');
    const btn = ctx.body.querySelector('.conv-hold');

    const paintStage = () => {
      const [lo, hi] = band();
      bandEl.style.bottom = lo + '%';
      bandEl.style.height = hi - lo + '%';
      label.textContent = t(stages[stage]);
      ctx.body.querySelectorAll('.conv-step').forEach((el, i) => {
        el.classList.toggle('active', i === stage);
        el.classList.toggle('done', i < stage);
      });
    };
    paintStage();

    let last = performance.now();
    let raf = 0;
    let humT = 0;
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (holding) {
        level = Math.min(100, level + dt * (38 + stage * 8));
        humT -= dt;
        if (humT <= 0) {
          humT = 0.12;
          ctx.sfx('tick', { freq: 200 + level * 6 });
        }
      } else level = Math.max(0, level - dt * 6);
      fill.style.height = level + '%';
      pctEl.textContent = Math.round(level) + '%';
      const [lo, hi] = band();
      tank.classList.toggle('inband', level >= lo && level <= hi);
      tank.classList.toggle('over', level > hi);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    ctx.dispose(() => cancelAnimationFrame(raf));

    const release = () => {
      if (!holding) return;
      holding = false;
      btn.classList.remove('pressed');
      const [lo, hi] = band();
      if (level >= lo && level <= hi) {
        ctx.sfx('wire');
        stage++;
        level = 0;
        if (stage >= stages.length) {
          ctx.finish(true, 1 - mistakes * 0.12 - (ctx.elapsed() / ctx.limit) * 0.2);
          return;
        }
        paintStage();
      } else if (level > hi) {
        mistakes++;
        ctx.sfx('fail');
        tank.classList.add('shake');
        setTimeout(() => tank.classList.remove('shake'), 350);
        level = 0;
        if (mistakes >= 4) ctx.finish(false, 0.3);
      }
    };
    const press = () => {
      holding = true;
      btn.classList.add('pressed');
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      press();
    });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    const onUp = (e) => {
      if (e.key === ' ' || e.key === 'Enter') release();
    };
    window.addEventListener('keyup', onUp, true);
    ctx.dispose(() => window.removeEventListener('keyup', onUp, true));
    ctx.onKey((e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (!e.repeat) press();
        return true;
      }
      return false;
    });
    ctx.onTimeout(() => ctx.finish(stage >= 2, 0.25 + stage * 0.15));
  };
})((window.SOL14 = window.SOL14 || {}));
