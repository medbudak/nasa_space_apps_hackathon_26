/**
 * SOL 14: RED HORIZON — MINIGAME PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * Main has four templates (wires, align, qte, converter) reused everywhere, so a pendulum timer showed up for a
 * dust measurement and a signal slider for boiling water. Here every task gets its own game about the thing it
 * measures, in the same retro frame as the cable panel (world_proto.js). Same contract as main:
 * runMinigame(type, config) → { success, score 0..1, timeUsed, skipped }, Esc skips.
 *  - Every wiring task (crises, black boxes) uses the cable panel look.
 *  - Experiments: pendulum stopwatch at the centre gate, free fall with a light gate, perchlorate rinsing,
 *    vacuum chamber to Mars pressure, SuperCam laser-spark echo on a scope, MOXIE cell temperature control.
 *  - Third wreck evidence, one per vehicle: Opportunity sun photometer (τ), Spirit sulfate grains under the
 *    microscope (Troy), InSight dust-devil tracks, Phoenix LIDAR on falling snow, Beagle 2 relay listening.
 *  - Suit leak crisis: put a patch on the hissing hole.
 * Values come from data where the game shows them (experiments_config.json marsValue/earthValue, constants);
 * distances, rates and time limits inside the games are game values.
 */
(function (S) {
  'use strict';
  if (!S.UI || !S.Surface) return;
  if (new URLSearchParams(window.location.search).get('proto') === '0') return;

  const t = (k, v) => S.t(k, v);
  const esc = (x) => S.util.escape(String(x));
  const num = (x, d) => Number(x).toLocaleString(S.lang === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const W = 320;
  const H = 176;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  const TEXT = {
    tr: {
      'proto.mg.tag.exp': 'DENEY',
      'proto.mg.tag.env': 'ÖLÇÜM',
      'proto.mg.tag.fix': 'ONARIM',
      'proto.mg.skip': 'Atla',
      'proto.mg.ok': 'ÖLÇÜM TAMAM',
      'proto.mg.fail': 'SÜRE DOLDU',
      'proto.mg.quality': 'Kalite %{pct}',
      // pendulum
      'proto.mg.pend.how': 'Sarkaç ortadaki ışık kapısından her geçtiğinde Space\'e bas ({n} geçiş).',
      'proto.mg.pend.hint': 'Space / Enter / tıkla: kapıdan geçiş',
      'proto.mg.pend.read': 'Periyot ≈ {t} s · Dünya\'da {e} s',
      // free fall
      'proto.mg.fall.how': 'Mıknatıs bırakınca kronometre başlar. Top alttaki ışık kapısına değdiği an Space\'e bas.',
      'proto.mg.fall.hint': 'Space / Enter / tıkla: kronometreyi durdur',
      'proto.mg.fall.read': 'Düşüş {n}/{total}: {t} s (gerçek {real} s)',
      'proto.mg.fall.wait': 'Hazırlan…',
      // perchlorate
      'proto.mg.wash.how': 'Basılı tut: su dök. Bırak: süz. Perkloratı yeşil çizginin altına indir ama besinleri yıkayıp atma.',
      'proto.mg.wash.hint': 'Space / Enter / basılı tut: su dök · bırak: süz',
      'proto.mg.wash.perc': 'Perklorat',
      'proto.mg.wash.nutr': 'Besin',
      'proto.mg.wash.round': 'Yıkama {n}/{total}',
      // vacuum
      'proto.mg.vac.how': 'Basılı tut: pompa havayı çeker. Basıncı Mars bandına indir ve {s} saniye orada tut (oda sızdırıyor).',
      'proto.mg.vac.hint': 'Space / Enter / basılı tut: pompa',
      'proto.mg.vac.read': '{p} kPa',
      'proto.mg.vac.band': 'Mars ≈ {m} kPa',
      // sound
      'proto.mg.snd.how': 'Lazer t = 0\'da ateşlendi. Kayıtta çıtırtının mikrofona ulaştığı ilk anı bul ve Space\'e bas.',
      'proto.mg.snd.hint': '←/→ ya da fare: imleç · Space / tıkla: işaretle',
      'proto.mg.snd.read': 'Atış {n}/{total} · {d} m · {ms} ms → {v} m/s',
      // moxie
      'proto.mg.mox.how': 'Hücreyi ~800 °C bandında tut. Gece soğudukça ısı daha hızlı kaçar. Bantta kaldıkça O₂ birikir.',
      'proto.mg.mox.hint': 'Space / Enter / basılı tut: ısıtıcı',
      'proto.mg.mox.o2': 'O₂',
      // opportunity
      'proto.mg.tau.how': 'Toz perdesi aralanıp Güneş diski netleşince Space\'e bas ({n} okuma).',
      'proto.mg.tau.hint': 'Space / Enter / tıkla: ölç',
      'proto.mg.tau.read': 'Işık %{pct} · okuma {n}/{total}',
      // spirit
      'proto.mg.grain.how': 'Mikroskopta parlak, açık renkli sülfat tanelerini bul ({n} tane). Troy\'da tekerlek bu yumuşak toprağa gömüldü.',
      'proto.mg.grain.hint': 'Fare ya da ok tuşları: nişangâh · Space / tıkla: seç',
      'proto.mg.grain.read': 'Bulunan {n}/{total} · yanlış {err}',
      // insight
      'proto.mg.dd.how': 'Tarama çizgisi koyu bir toz şeytanı izinin üstündeyken Space\'e bas.',
      'proto.mg.dd.hint': 'Space / Enter / tıkla: işaretle',
      'proto.mg.dd.read': 'İz {n}/{total} · yanlış {err}',
      // phoenix
      'proto.mg.lidar.how': 'LIDAR ışınını bulutlardan düşen kar sütununun üstünde tut.',
      'proto.mg.lidar.hint': '←/→ ya da fare: ışın açısı',
      'proto.mg.lidar.read': 'Kar sinyali %{pct}',
      // beagle
      'proto.mg.relay.how': 'Yörünge aracı ufkun üstündeyken alıcıyı beklenen Doppler izinde tut. Bir taşıyıcı sinyali var mı?',
      'proto.mg.relay.hint': '←/→ ya da fare: frekans',
      'proto.mg.relay.read': 'İzde %{pct} · sinyal: yok',
      'proto.mg.title.water_boiling': 'Vakum odası: Mars basıncı',
      'proto.mg.title.sound_speed': 'Lazer çıtırtısı: ses hızı',
      'proto.mg.title.moxie_night': 'MOXIE hücre sıcaklığı',
      'proto.mg.title.phoenix': 'LIDAR: düşen kar',
      // suit leak
      'proto.mg.patch.how': 'Yamayı tıslayan deliğin üstüne getir ve Space\'e basılı tut (kol sallanıyor).',
      'proto.mg.patch.hint': 'Fare ya da ok tuşları: yama · Space / basılı tut: bastır',
      'proto.mg.patch.read': 'Yapışma %{pct}'
    },
    en: {
      'proto.mg.tag.exp': 'EXPERIMENT',
      'proto.mg.tag.env': 'MEASURE',
      'proto.mg.tag.fix': 'REPAIR',
      'proto.mg.skip': 'Skip',
      'proto.mg.ok': 'MEASUREMENT DONE',
      'proto.mg.fail': 'TIME UP',
      'proto.mg.quality': 'Quality {pct}%',
      'proto.mg.pend.how': 'Press Space each time the bob passes the light gate in the middle ({n} passes).',
      'proto.mg.pend.hint': 'Space / Enter / click: gate pass',
      'proto.mg.pend.read': 'Period ≈ {t} s · on Earth {e} s',
      'proto.mg.fall.how': 'The stopwatch starts when the magnet lets go. Press Space the moment the ball reaches the light gate below.',
      'proto.mg.fall.hint': 'Space / Enter / click: stop the stopwatch',
      'proto.mg.fall.read': 'Drop {n}/{total}: {t} s (true {real} s)',
      'proto.mg.fall.wait': 'Get ready…',
      'proto.mg.wash.how': 'Hold: pour water. Release: drain. Bring perchlorate under the green line, but do not wash the nutrients away.',
      'proto.mg.wash.hint': 'Space / Enter / hold: pour · release: drain',
      'proto.mg.wash.perc': 'Perchlorate',
      'proto.mg.wash.nutr': 'Nutrients',
      'proto.mg.wash.round': 'Rinse {n}/{total}',
      'proto.mg.vac.how': 'Hold: the pump draws the air out. Bring the pressure into the Mars band and keep it there for {s} seconds (the chamber leaks).',
      'proto.mg.vac.hint': 'Space / Enter / hold: pump',
      'proto.mg.vac.read': '{p} kPa',
      'proto.mg.vac.band': 'Mars ≈ {m} kPa',
      'proto.mg.snd.how': 'The laser fired at t = 0. Find the first moment the crack reaches the microphone in the recording and press Space.',
      'proto.mg.snd.hint': '←/→ or mouse: cursor · Space / click: mark',
      'proto.mg.snd.read': 'Shot {n}/{total} · {d} m · {ms} ms → {v} m/s',
      'proto.mg.mox.how': 'Keep the cell in the ~800 °C band. As the night cools, heat escapes faster. O₂ builds up while you stay in the band.',
      'proto.mg.mox.hint': 'Space / Enter / hold: heater',
      'proto.mg.mox.o2': 'O₂',
      'proto.mg.tau.how': 'Press Space when the dust veil opens and the Sun\'s disk is sharp ({n} readings).',
      'proto.mg.tau.hint': 'Space / Enter / click: measure',
      'proto.mg.tau.read': 'Light {pct}% · reading {n}/{total}',
      'proto.mg.grain.how': 'Find the bright, pale sulfate grains under the microscope ({n} grains). At Troy the wheel sank into this soft soil.',
      'proto.mg.grain.hint': 'Mouse or arrow keys: reticle · Space / click: pick',
      'proto.mg.grain.read': 'Found {n}/{total} · wrong {err}',
      'proto.mg.dd.how': 'Press Space while the scan line is over a dark dust-devil track.',
      'proto.mg.dd.hint': 'Space / Enter / click: mark',
      'proto.mg.dd.read': 'Track {n}/{total} · wrong {err}',
      'proto.mg.lidar.how': 'Keep the LIDAR beam on the column of snow falling from the clouds.',
      'proto.mg.lidar.hint': '←/→ or mouse: beam angle',
      'proto.mg.lidar.read': 'Snow signal {pct}%',
      'proto.mg.relay.how': 'While the orbiter is above the horizon, keep the receiver on the expected Doppler track. Is there a carrier?',
      'proto.mg.relay.hint': '←/→ or mouse: frequency',
      'proto.mg.relay.read': 'On track {pct}% · signal: none',
      'proto.mg.title.water_boiling': 'Vacuum chamber: Mars pressure',
      'proto.mg.title.sound_speed': 'Laser crack: speed of sound',
      'proto.mg.title.moxie_night': 'MOXIE cell temperature',
      'proto.mg.title.phoenix': 'LIDAR: falling snow',
      'proto.mg.patch.how': 'Bring the patch over the hissing hole and hold Space (the arm is shaking).',
      'proto.mg.patch.hint': 'Mouse or arrow keys: patch · Space / hold: press',
      'proto.mg.patch.read': 'Seal {pct}%'
    }
  };
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }

  const css = document.createElement('style');
  css.textContent =
    '.pmg .pcb-tag{background:#ffc233;box-shadow:2px 2px 0 #5a4410}' +
    '.pmg-how{margin:.45em .9em 0;color:#e9eef2;font-size:.92em}' +
    '.pmg .pcb-stage canvas{cursor:crosshair}';
  document.head.appendChild(css);

  /* ---------------- shared frame ---------------- */
  let openNow = false;
  /**
   * game(api) returns { update(dt, tt), draw(c, tt), act(down), key(e) → handled, move(x, y), click(x, y), timeout() → score }
   * api: { finish(score), status(text), tt() }
   */
  function play(config, tagKey, howText, hintText, limitSec, game) {
    return new Promise((resolve) => {
      const title = config.titleKey ? t(config.titleKey) : '';
      const desc = config.descKey ? t(config.descKey) : '';
      const html =
        '<div class="pcb pmg" role="dialog" aria-label="' + esc(title) + '">' +
        '<div class="pcb-head"><span class="pcb-tag">' + esc(t(tagKey)) + '</span><h3>' + esc(title) + '</h3>' +
        '<button data-mg-skip>Esc ' + esc(t('proto.mg.skip')) + '</button></div>' +
        (desc ? '<p class="pcb-desc">' + esc(desc) + '</p>' : '') +
        '<p class="pmg-how">' + esc(howText) + '</p>' +
        '<div class="pcb-timer"><i></i></div>' +
        '<div class="pcb-stage"><canvas width="' + W + '" height="' + H + '"></canvas></div>' +
        '<div class="pcb-foot"><span class="pcb-status"></span><span>' + esc(hintText) + '</span></div></div>';
      openNow = true;
      const box = S.UI.openModal('minigame', html, { closable: false, cls: 'modal-minigame modal-cb' });
      const cv = box.querySelector('canvas');
      const c = cv.getContext('2d');
      c.imageSmoothingEnabled = false;
      const statusEl = box.querySelector('.pcb-status');
      const timerEl = box.querySelector('.pcb-timer i');
      const start = performance.now();
      let finished = false;
      let g = null;
      const api = {
        status: (txt, cls) => {
          statusEl.className = 'pcb-status ' + (cls || '');
          statusEl.innerHTML = '<b>' + esc(txt) + '</b>';
        },
        tt: () => (performance.now() - start) / 1000,
        finish: (score, skipped) => {
          if (finished) return;
          finished = true;
          window.removeEventListener('keydown', onKey, true);
          window.removeEventListener('keyup', onKeyUp, true);
          const sc = Math.round(clamp(score, 0, 1) * 100) / 100;
          const success = !skipped && sc >= 0.5;
          if (!skipped) api.status((success ? t('proto.mg.ok') : t('proto.mg.fail')) + ' · ' + t('proto.mg.quality', { pct: Math.round(sc * 100) }), success ? 'ok' : 'bad');
          S.bus.emit('audio:play', skipped ? 'click' : success ? 'success' : 'fail');
          setTimeout(
            () => {
              S.UI.closeModal('minigame', true);
              openNow = false;
              resolve({ success: skipped ? true : success, score: skipped ? 0.6 : sc, timeUsed: Math.round(api.tt() * 10) / 10, skipped: Boolean(skipped) });
            },
            skipped ? 150 : 1300
          );
        },
        get done() {
          return finished;
        }
      };
      g = game(api);
      const toInternal = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
      };
      const isAct = (e) => e.code === 'Space' || e.key === 'Enter';
      const onKey = (e) => {
        if (finished) return;
        let used = false;
        if (e.key === 'Escape') {
          api.finish(0.6, true);
          used = true;
        } else if (isAct(e)) {
          if (!e.repeat && g.act) g.act(true);
          used = true;
        } else if (g.key && g.key(e, true)) used = true;
        if (used) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      const onKeyUp = (e) => {
        if (finished) return;
        if (isAct(e) && g.act) g.act(false);
        else if (g.key) g.key(e, false);
      };
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', onKeyUp, true);
      cv.addEventListener('pointerdown', (e) => {
        if (finished) return;
        const p = toInternal(e);
        if (g.move) g.move(p.x, p.y);
        if (g.click) g.click(p.x, p.y);
        else if (g.act) g.act(true);
      });
      cv.addEventListener('pointerup', () => !finished && g.act && !g.click && g.act(false));
      cv.addEventListener('pointermove', (e) => {
        if (finished || !g.move) return;
        const p = toInternal(e);
        g.move(p.x, p.y);
      });
      box.querySelector('[data-mg-skip]').addEventListener('click', () => api.finish(0.6, true));
      let last = performance.now();
      const frame = (now) => {
        if (!cv.isConnected) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tt = api.tt();
        if (!finished) {
          const frac = Math.max(0, 1 - tt / limitSec);
          timerEl.style.width = frac * 100 + '%';
          timerEl.classList.toggle('low', frac < 0.25);
          if (g.update) g.update(dt, tt);
          if (!finished && tt >= limitSec) api.finish(g.timeout ? g.timeout() : 0.3);
        }
        g.draw(c, tt);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  /* ---------------- small drawing helpers ---------------- */
  const R = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const txt = (c, s, x, y, col, align, size) => {
    c.font = (size || 9) + 'px VT323, monospace';
    c.textAlign = align || 'left';
    c.textBaseline = 'middle';
    c.fillStyle = col || '#e9eef2';
    c.fillText(s, Math.round(x), Math.round(y));
  };
  const panelBg = (c, col) => {
    R(c, 0, 0, W, H, col || '#101215');
    for (let y = 0; y < H; y += 3) R(c, 0, y, W, 1, 'rgba(255,255,255,0.018)');
  };
  const rnd = (seed) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const expVal = (id) => (S.Experiments && S.Experiments.get ? S.Experiments.get(id) : null) || {};

  /* ================================================================ */
  /* EXPERIMENTS                                                       */
  /* ================================================================ */
  // Pendulum: real Mars period (marsValue, 1 m string); a pass through the centre gate every T/2.
  function gPendulum(config) {
    const e = expVal('pendulum_gravity');
    const T = e.marsValue || 3.25;
    const need = 4;
    return play(config, 'proto.mg.tag.exp', t('proto.mg.pend.how', { n: need }), t('proto.mg.pend.hint'), T * 3.2 + 4, (api) => {
      const t0 = 0.6; // released at the side at t0
      const presses = [];
      const angle = (tt) => (tt < t0 ? 0.42 : 0.42 * Math.cos(((tt - t0) * 2 * Math.PI) / T));
      const passTimes = Array.from({ length: 8 }, (_, i) => t0 + T / 4 + (i * T) / 2);
      let flash = 0;
      const scoreNow = () => {
        if (!presses.length) return 0;
        const errs = presses.map((p) => Math.min(...passTimes.map((q) => Math.abs(q - p))));
        const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
        return clamp(1 - mean / 0.35, 0, 1) * (presses.length / need);
      };
      api.status(t('proto.mg.pend.read', { t: '—', e: num(e.earthValue || 2.01, 2) }));
      return {
        act(down) {
          if (!down || api.done) return;
          presses.push(api.tt());
          flash = 0.25;
          S.bus.emit('audio:play', 'click');
          if (presses.length >= 2) {
            const per = ((presses[presses.length - 1] - presses[0]) / (presses.length - 1)) * 2;
            api.status(t('proto.mg.pend.read', { t: num(per, 2), e: num(e.earthValue || 2.01, 2) }));
          }
          if (presses.length >= need) setTimeout(() => api.finish(scoreNow()), 400);
        },
        timeout: scoreNow,
        update(dt) {
          flash = Math.max(0, flash - dt);
        },
        draw(c, tt) {
          panelBg(c);
          const px = 160;
          const py = 22;
          const L = 118;
          R(c, 80, 16, 160, 6, '#5c6370');
          R(c, 158, 22, 4, 4, '#9aa0a8');
          // gate
          R(c, 150, py + L - 6, 2, 28, '#5c6370');
          R(c, 168, py + L - 6, 2, 28, '#5c6370');
          c.globalAlpha = 0.5 + flash * 2;
          R(c, 152, py + L + 6, 16, 1, '#ff3b2f');
          c.globalAlpha = 1;
          const a = angle(tt);
          const bx = px + Math.sin(a) * L;
          const by = py + Math.cos(a) * L;
          c.strokeStyle = '#c9c2b8';
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(px, py + 2);
          c.lineTo(bx, by);
          c.stroke();
          R(c, bx - 5, by - 5, 10, 10, '#f2c230');
          R(c, bx - 5, by - 5, 10, 2, '#fff3b0');
          // stopwatch
          R(c, 248, 120, 62, 44, '#1b1e24');
          R(c, 250, 122, 58, 40, '#0b0c0e');
          const run = presses.length ? tt - presses[0] : 0;
          txt(c, num(run, 2) + ' s', 279, 136, '#3fe08a', 'center', 14);
          txt(c, presses.length + '/' + need, 279, 152, '#9aa3ad', 'center', 9);
          txt(c, '1 m', 30, 80, '#9aa3ad');
          R(c, 22, 22, 1, L, '#4a505a');
        }
      };
    });
  }

  // Free fall: true time sqrt(2h/g) from data (marsValue for 2 m); three drops.
  function gFreeFall(config) {
    const e = expVal('free_fall');
    const real = e.marsValue || 1.04;
    const earth = e.earthValue || 0.64;
    const drops = 3;
    return play(config, 'proto.mg.tag.exp', t('proto.mg.fall.how'), t('proto.mg.fall.hint'), 24, (api) => {
      const res = [];
      let releaseAt = 1.4;
      let stopped = null;
      let n = 0;
      const top = 22;
      const bottom = 150;
      const pos = (dtFall, T) => clamp((dtFall / T) ** 2, 0, 1);
      const scoreNow = () => (res.length ? clamp(1 - res.reduce((a, r) => a + Math.abs(r - real), 0) / res.length / 0.25, 0, 1) * (res.length / drops) : 0);
      api.status(t('proto.mg.fall.wait'));
      return {
        act(down) {
          if (!down || api.done) return;
          const tt = api.tt();
          if (tt < releaseAt || stopped !== null) return;
          stopped = tt - releaseAt;
          res.push(stopped);
          n++;
          S.bus.emit('audio:play', 'click');
          api.status(t('proto.mg.fall.read', { n, total: drops, t: num(stopped, 2), real: num(real, 2) }));
          if (n >= drops) setTimeout(() => api.finish(scoreNow()), 600);
          else
            setTimeout(() => {
              releaseAt = api.tt() + 1 + rnd(n * 3.3) * 1.2;
              stopped = null;
            }, 1100);
        },
        timeout: scoreNow,
        draw(c, tt) {
          panelBg(c);
          // tube with height marks
          R(c, 120, top - 6, 2, bottom - top + 12, '#4a505a');
          R(c, 200, top - 6, 2, bottom - top + 12, '#4a505a');
          for (let i = 0; i <= 4; i++) {
            const y = top + ((bottom - top) * i) / 4;
            R(c, 112, y, 8, 1, '#5c6370');
            txt(c, num(2 - i * 0.5, 1) + ' m', 108, y, '#9aa3ad', 'right', 8);
          }
          R(c, 150, top - 12, 20, 6, '#b5622a'); // magnet
          R(c, 122, bottom + 4, 78, 1, '#ff3b2f'); // light gate
          R(c, 118, bottom + 1, 4, 7, '#2a2d33');
          R(c, 200, bottom + 1, 4, 7, '#2a2d33');
          const since = tt - releaseAt;
          let k = since < 0 ? 0 : pos(since, real);
          if (stopped !== null) k = pos(stopped, real);
          const by = top + (bottom - top) * k;
          // Earth ghost: the same drop under Earth gravity, for comparison
          if (since > 0 && stopped === null) {
            const ke = pos(since, earth);
            c.globalAlpha = 0.25;
            R(c, 170, top + (bottom - top) * ke - 4, 8, 8, '#3f8ff5');
            c.globalAlpha = 1;
            txt(c, t('transit.earth'), 214, top + (bottom - top) * ke, '#3f8ff5', 'left', 8);
          }
          R(c, 156, by - 4, 8, 8, '#e8692a');
          R(c, 156, by - 4, 8, 2, '#ffb37a');
          R(c, 236, 70, 70, 40, '#1b1e24');
          R(c, 238, 72, 66, 36, '#0b0c0e');
          const shown = stopped !== null ? stopped : Math.max(0, since);
          txt(c, num(shown, 2) + ' s', 271, 90, stopped !== null ? '#ffc233' : '#3fe08a', 'center', 14);
        }
      };
    });
  }

  // Perchlorate rinse: hold to pour, release to drain; perchlorate and nutrients both leave with the water.
  function gWash(config) {
    const rounds = 3;
    return play(config, 'proto.mg.tag.exp', t('proto.mg.wash.how'), t('proto.mg.wash.hint'), 30, (api) => {
      let perc = 1; // relative to the untreated soil
      let nutr = 1;
      let water = 0; // 0..1 in the beaker
      let pouring = false;
      let draining = 0;
      let round = 0;
      const safe = 0.22;
      const minNutr = 0.55;
      const scoreNow = () => clamp((perc <= safe ? 0.6 : 0.6 * clamp((1 - perc) / (1 - safe), 0, 1)) + (nutr >= minNutr ? 0.4 : 0.4 * clamp(nutr / minNutr, 0, 1)), 0, 1);
      const show = () => api.status(t('proto.mg.wash.round', { n: Math.min(rounds, round + 1), total: rounds }));
      show();
      return {
        act(down) {
          if (api.done || draining) return;
          if (down) pouring = true;
          else if (pouring) {
            pouring = false;
            if (water > 0.05) draining = 1;
          }
        },
        timeout: scoreNow,
        update(dt) {
          if (pouring) water = Math.min(1, water + dt * 0.55);
          if (draining) {
            const out = Math.min(water, dt * 0.9);
            // what leaves with the water: perchlorate dissolves readily, nutrients a little less
            perc *= Math.exp(-out * 2.1);
            nutr *= Math.exp(-out * 0.42);
            water -= out;
            if (water <= 0.001) {
              water = 0;
              draining = 0;
              round++;
              S.bus.emit('audio:play', 'click');
              if (round >= rounds) setTimeout(() => api.finish(scoreNow()), 300);
              else show();
            }
          }
        },
        draw(c, tt) {
          panelBg(c);
          // beaker
          const bx = 70;
          const bw = 90;
          const top = 30;
          const bot = 150;
          R(c, bx - 3, top, 3, bot - top + 3, '#9fd8ff');
          R(c, bx + bw, top, 3, bot - top + 3, '#9fd8ff');
          R(c, bx - 3, bot, bw + 6, 3, '#9fd8ff');
          // soil layer, colour shifts as perchlorate leaves
          const soilTop = bot - 40;
          R(c, bx, soilTop, bw, 40, '#8a4a30');
          for (let i = 0; i < 40; i++) R(c, bx + rnd(i) * (bw - 2), soilTop + rnd(i * 2.7) * 38, 2, 1, i % 3 ? '#a65d3c' : '#6e3a24');
          c.globalAlpha = perc * 0.5;
          for (let i = 0; i < 18; i++) R(c, bx + rnd(i * 5.1) * (bw - 2), soilTop + rnd(i * 7.3) * 38, 2, 2, '#f2f0e8');
          c.globalAlpha = 1;
          // water
          const wy = soilTop - water * 70;
          c.globalAlpha = 0.55;
          R(c, bx, wy, bw, soilTop - wy, '#3f8ff5');
          c.globalAlpha = 1;
          if (pouring) {
            R(c, bx + 40, 8, 10, 6, '#5c6370');
            R(c, bx + 43, 14, 4, wy - 14, '#6fb0ff');
          }
          if (draining) {
            R(c, bx + bw / 2 - 2, bot + 3, 4, 12, '#6fb0ff');
            for (let i = 0; i < 3; i++) R(c, bx + bw / 2 - 1, bot + 16 + ((tt * 60 + i * 9) % 14), 2, 2, '#6fb0ff');
          }
          // meters
          const meter = (x, label, v, col, line, lineCol) => {
            R(c, x, 30, 18, 120, '#1b1e24');
            R(c, x + 2, 32 + 116 * (1 - v), 14, 116 * v, col);
            R(c, x - 3, 32 + 116 * (1 - line), 24, 1, lineCol);
            txt(c, label, x + 9, 160, '#cfd6dc', 'center', 8);
          };
          meter(210, t('proto.mg.wash.perc'), perc, '#e8423b', safe, '#3fe08a');
          meter(262, t('proto.mg.wash.nutr'), nutr, '#3fe08a', minNutr, '#ffc233');
          txt(c, 'ClO₄⁻ + H₂O', 115, 18, '#9fd9db', 'center', 9);
        }
      };
    });
  }

  // Vacuum chamber: pressure falls on a log scale while pumping, leaks back up; hold it in the Mars band.
  function gVacuum(config) {
    const e = expVal('water_boiling');
    const mars = (S.DATA.constants.atmosphere && S.DATA.constants.atmosphere.surfacePressureKpa) || e.marsValue || 0.636;
    const earth = e.earthValue || 101.3;
    const lo = mars * 0.88;
    const hi = mars * 1.12;
    const holdNeed = 3;
    return play(config, 'proto.mg.tag.exp', t('proto.mg.vac.how', { s: holdNeed }), t('proto.mg.vac.hint'), 26, (api) => {
      let p = earth;
      let pump = false;
      let held = 0;
      let overshoot = 0;
      const scoreNow = () => clamp((held / holdNeed) * 0.9 + 0.1 - overshoot * 0.15, 0, 1);
      return {
        act(down) {
          pump = down;
        },
        timeout: scoreNow,
        update(dt) {
          const lp = Math.log10(p);
          const nlp = pump ? lp - dt * 0.75 : lp + dt * 0.055; // the pump pulls hard, the seals leak slowly
          p = clamp(10 ** nlp, mars * 0.5, earth);
          if (p <= mars * 0.55) overshoot += dt;
          if (p >= lo && p <= hi) {
            held += dt;
            api.status(t('proto.mg.vac.read', { p: num(p, 2) }) + ' · ' + num(held, 1) + '/' + holdNeed + ' s', 'ok');
            if (held >= holdNeed) api.finish(scoreNow());
          } else api.status(t('proto.mg.vac.read', { p: num(p, p < 10 ? 2 : 1) }));
        },
        draw(c, tt) {
          panelBg(c);
          // chamber bell jar with a water cup: bubbles grow and ice forms as the pressure nears the band
          R(c, 40, 150, 120, 6, '#5c6370');
          c.strokeStyle = '#9fd8ff';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(48, 150);
          c.lineTo(48, 60);
          c.quadraticCurveTo(100, 18, 152, 60);
          c.lineTo(152, 150);
          c.stroke();
          R(c, 80, 118, 40, 32, '#cfd6dc');
          R(c, 82, 120, 36, 28, '#3f8ff5');
          const near = clamp((Math.log10(earth) - Math.log10(p)) / (Math.log10(earth) - Math.log10(mars)), 0, 1);
          const nb = Math.round(near ** 3 * 14);
          for (let i = 0; i < nb; i++) {
            const ph = (tt * (1 + rnd(i) * 2) + rnd(i * 3.1)) % 1;
            R(c, 84 + rnd(i * 7.7) * 32, 146 - ph * 26, 2, 2, '#d8ecff');
          }
          if (near > 0.92) {
            c.globalAlpha = (near - 0.92) / 0.08;
            R(c, 82, 120, 36, 4, '#f2f8ff'); // ice skin on top: it boils and freezes at once
            c.globalAlpha = 1;
          }
          // log gauge
          const gx = 200;
          const gy0 = 22;
          const gh = 128;
          const yOf = (v) => gy0 + gh * (1 - (Math.log10(v) - Math.log10(mars * 0.5)) / (Math.log10(earth) - Math.log10(mars * 0.5)));
          R(c, gx, gy0, 22, gh, '#1b1e24');
          R(c, gx - 2, yOf(hi), 26, yOf(lo) - yOf(hi), 'rgba(63,224,138,0.35)');
          R(c, gx + 2, yOf(p), 18, gy0 + gh - yOf(p), '#3fe0e6');
          txt(c, num(earth, 1), gx + 28, yOf(earth), '#9aa3ad', 'left', 8);
          txt(c, t('proto.mg.vac.band', { m: num(mars, 2) }), gx + 28, yOf(mars), '#3fe08a', 'left', 8);
          txt(c, 'kPa', gx + 11, 160, '#9aa3ad', 'center', 8);
          if (pump) for (let i = 0; i < 3; i++) R(c, 160 + ((tt * 50 + i * 8) % 24), 152, 3, 1, '#9aa3ad');
        }
      };
    });
  }

  // Sound speed: the crack arrives d / v later (v = marsValue m/s); the player marks the onset on the scope.
  function gSound(config) {
    const e = expVal('sound_speed');
    const v = e.marsValue || 240;
    const shots = [2, 3, 4]; // laser-to-rock distance (m), game values
    return play(config, 'proto.mg.tag.exp', t('proto.mg.snd.how'), t('proto.mg.snd.hint'), 36, (api) => {
      let n = 0;
      let cur = 40; // cursor (ms)
      const maxMs = 25;
      const errs = [];
      let left = false;
      let right = false;
      const arrival = () => (shots[n] / v) * 1000;
      const sig = (ms) => {
        // noise + a sharp pulse at the arrival, ringing a little
        const a = arrival();
        let y = (rnd(Math.floor(ms * 8) + n * 999) - 0.5) * 0.18;
        if (ms >= a) y += Math.exp(-(ms - a) * 1.4) * Math.sin((ms - a) * 9) * 0.9;
        return y;
      };
      const xOf = (ms) => 20 + (ms / maxMs) * 280;
      const msOf = (x) => clamp(((x - 20) / 280) * maxMs, 0, maxMs);
      cur = maxMs / 2;
      const scoreNow = () => (errs.length ? clamp(1 - errs.reduce((a, b) => a + b, 0) / errs.length / 2.5, 0, 1) * (errs.length / shots.length) : 0);
      return {
        key(ev, down) {
          if (ev.key === 'ArrowLeft') left = down;
          else if (ev.key === 'ArrowRight') right = down;
          else return false;
          return true;
        },
        move(x) {
          cur = msOf(x);
        },
        click(x) {
          cur = msOf(x);
          this.act(true);
        },
        act(down) {
          if (!down || api.done || n >= shots.length) return;
          const err = Math.abs(cur - arrival());
          errs.push(err);
          const vv = (shots[n] / (cur / 1000)) | 0;
          api.status(t('proto.mg.snd.read', { n: n + 1, total: shots.length, d: shots[n], ms: num(cur, 1), v: vv }));
          S.bus.emit('audio:play', 'click');
          n++;
          if (n >= shots.length) setTimeout(() => api.finish(scoreNow()), 500);
        },
        timeout: scoreNow,
        update(dt) {
          if (left) cur = clamp(cur - dt * 6, 0, maxMs);
          if (right) cur = clamp(cur + dt * 6, 0, maxMs);
        },
        draw(c) {
          panelBg(c, '#06100c');
          for (let x = 20; x <= 300; x += 28) R(c, x, 20, 1, 124, '#123326');
          for (let y = 20; y <= 144; y += 31) R(c, 20, y, 280, 1, '#123326');
          R(c, xOf(0), 18, 2, 128, '#ff3b2f'); // laser fire
          txt(c, 't=0', xOf(0) + 4, 26, '#ff8a80', 'left', 8);
          if (n < shots.length) {
            c.strokeStyle = '#3fe08a';
            c.lineWidth = 1;
            c.beginPath();
            for (let x = 20; x <= 300; x++) {
              const y = 82 - sig(msOf(x)) * 52;
              if (x === 20) c.moveTo(x, y);
              else c.lineTo(x, y);
            }
            c.stroke();
            txt(c, shots[n] + ' m', 296, 26, '#9fd9db', 'right', 9);
          }
          R(c, xOf(cur), 18, 1, 128, '#ffc233');
          txt(c, num(cur, 1) + ' ms', xOf(cur) + 3, 150, '#ffc233', 'left', 8);
          for (let i = 0; i <= 5; i++) txt(c, i * 5 + '', xOf(i * 5), 160, '#5c8f7a', 'center', 8);
        }
      };
    });
  }

  // MOXIE: cell temperature control around 800 °C while the night cools the box; O₂ builds in the band.
  function gMoxie(config) {
    return play(config, 'proto.mg.tag.exp', t('proto.mg.mox.how'), t('proto.mg.mox.hint'), 18, (api) => {
      let T = 640;
      let heat = false;
      let inBand = 0;
      const lo = 780;
      const hi = 820;
      const scoreNow = () => clamp(inBand / 10, 0, 1);
      return {
        act(down) {
          heat = down;
        },
        timeout: scoreNow,
        update(dt, tt) {
          const night = clamp(tt / 18, 0, 1); // the ambient gets colder: losses grow
          const loss = (T - 200) * (0.05 + night * 0.05);
          T += ((heat ? 140 : 0) - loss) * dt;
          if (T >= lo && T <= hi) inBand += dt;
          api.status(Math.round(T) + ' °C · ' + t('proto.mg.mox.o2') + ' %' + Math.round(scoreNow() * 100), T >= lo && T <= hi ? 'ok' : '');
        },
        draw(c, tt) {
          panelBg(c);
          const night = clamp(tt / 18, 0, 1);
          R(c, 0, 0, W, 14, night > 0.5 ? '#1a1830' : '#a8573a');
          txt(c, night > 0.5 ? '☾' : '☀', 10, 7, '#f2ebe2', 'left', 9);
          // the cell: glows with temperature
          const k = clamp((T - 500) / 400, 0, 1);
          R(c, 40, 40, 110, 90, '#2a2d33');
          R(c, 50, 50, 90, 70, `rgb(${Math.round(80 + k * 175)},${Math.round(30 + k * 90)},${Math.round(20 + k * 20)})`);
          for (let i = 0; i < 6; i++) R(c, 50, 56 + i * 11, 90, 2, '#1b1e24');
          txt(c, '2CO₂ → 2CO + O₂', 95, 140, '#9fd9db', 'center', 9);
          // thermometer
          const yOf = (v) => 150 - ((v - 500) / 400) * 128;
          R(c, 190, 22, 16, 128, '#1b1e24');
          R(c, 186, yOf(hi), 24, yOf(lo) - yOf(hi), 'rgba(63,224,138,0.35)');
          R(c, 194, yOf(clamp(T, 500, 900)), 8, 150 - yOf(clamp(T, 500, 900)), '#e8692a');
          txt(c, '800 °C', 214, yOf(800), '#3fe08a', 'left', 8);
          // O₂ tank filling
          R(c, 262, 40, 30, 100, '#1b1e24');
          R(c, 264, 42 + 96 * (1 - scoreNow()), 26, 96 * scoreNow(), '#3fe0e6');
          txt(c, 'O₂', 277, 150, '#cfd6dc', 'center', 9);
          if (heat) for (let i = 0; i < 4; i++) R(c, 56 + i * 22, 126 + ((tt * 30 + i * 3) % 4), 10, 2, '#ffb347');
        }
      };
    });
  }

  /* ================================================================ */
  /* THIRD WRECK EVIDENCE, one per vehicle                             */
  /* ================================================================ */
  // Opportunity: sun photometer through drifting dust (2018 global storm). Read when the disk is clear.
  function gTau(config) {
    const need = 3;
    return play(config, 'proto.mg.tag.env', t('proto.mg.tau.how', { n: need }), t('proto.mg.tau.hint'), 24, (api) => {
      const reads = [];
      const light = (tt) => clamp(0.18 + 0.82 * Math.max(0, Math.sin(tt * 1.3) * Math.sin(tt * 0.47 + 1)) ** 2, 0, 1);
      const scoreNow = () => (reads.length ? (reads.reduce((a, b) => a + b, 0) / reads.length) * (reads.length / need) : 0);
      return {
        act(down) {
          if (!down || api.done) return;
          const l = light(api.tt());
          reads.push(clamp((l - 0.2) / 0.7, 0, 1));
          S.bus.emit('audio:play', 'click');
          api.status(t('proto.mg.tau.read', { pct: Math.round(l * 100), n: reads.length, total: need }), l > 0.7 ? 'ok' : 'bad');
          if (reads.length >= need) setTimeout(() => api.finish(scoreNow()), 500);
        },
        timeout: scoreNow,
        draw(c, tt) {
          const l = light(tt);
          const sky = c.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, '#5a2a1a');
          sky.addColorStop(1, '#b0643a');
          c.fillStyle = sky;
          c.fillRect(0, 0, W, H);
          // sun disk
          c.fillStyle = 'rgba(255,240,210,' + (0.25 + l * 0.75).toFixed(2) + ')';
          c.beginPath();
          c.arc(110, 70, 18, 0, Math.PI * 2);
          c.fill();
          // dust bands drifting across, thinner when the light is high
          for (let i = 0; i < 6; i++) {
            const y = 40 + i * 12;
            const x = ((tt * (20 + i * 7) + i * 60) % (W + 160)) - 160;
            c.globalAlpha = (1 - l) * 0.75;
            R(c, x, y, 150, 8, i % 2 ? '#7a3f2a' : '#8a4a30');
            c.globalAlpha = 1;
          }
          // ground with the rover's panels (a hint of the case)
          R(c, 0, 140, W, 36, '#6e3a24');
          R(c, 40, 132, 40, 6, '#2c3e6b');
          R(c, 44, 138, 4, 4, '#3b3430');
          R(c, 70, 138, 4, 4, '#3b3430');
          // photometer readout
          R(c, 230, 30, 76, 100, '#1b1e24');
          R(c, 240, 40, 20, 80, '#0b0c0e');
          R(c, 242, 42 + 76 * (1 - l), 16, 76 * l, l > 0.7 ? '#3fe08a' : '#ffc233');
          R(c, 236, 42 + 76 * 0.3, 28, 1, '#3fe08a');
          txt(c, '%' + Math.round(l * 100), 286, 80, '#e9eef2', 'center', 12);
          txt(c, reads.length + '/' + need, 286, 100, '#9aa3ad', 'center', 9);
        }
      };
    });
  }

  // Spirit: sulfate-rich soil churned up at Troy; pick the bright grains under the microscope.
  function gGrains(config) {
    const need = 4;
    return play(config, 'proto.mg.tag.env', t('proto.mg.grain.how', { n: need }), t('proto.mg.grain.hint'), 30, (api) => {
      const grains = [];
      for (let i = 0; i < 140; i++) grains.push({ x: 14 + rnd(i * 1.3) * 292, y: 14 + rnd(i * 2.7) * 148, r: 2 + Math.round(rnd(i * 4.1) * 3), col: ['#6e3a24', '#8a4a30', '#5a2e1e', '#a65d3c'][i % 4] });
      const bright = [];
      for (let i = 0; i < 7; i++) bright.push({ x: 30 + rnd(i * 9.7 + 1) * 260, y: 24 + rnd(i * 5.9 + 2) * 128, r: 3, found: false });
      let rx = W / 2;
      let ry = H / 2;
      let err = 0;
      const keys = {};
      const found = () => bright.filter((b) => b.found).length;
      const scoreNow = () => clamp(found() / need - err * 0.08, 0, 1);
      const pick = () => {
        if (api.done) return;
        const b = bright.find((q) => !q.found && Math.hypot(q.x - rx, q.y - ry) < 9);
        if (b) {
          b.found = true;
          S.bus.emit('audio:play', 'success');
        } else {
          err++;
          S.bus.emit('audio:play', 'fail');
        }
        api.status(t('proto.mg.grain.read', { n: found(), total: need, err }));
        if (found() >= need) setTimeout(() => api.finish(scoreNow()), 400);
      };
      api.status(t('proto.mg.grain.read', { n: 0, total: need, err: 0 }));
      return {
        key(ev, down) {
          if (!ev.key.startsWith('Arrow')) return false;
          keys[ev.key] = down;
          return true;
        },
        move(x, y) {
          rx = x;
          ry = y;
        },
        click(x, y) {
          rx = x;
          ry = y;
          pick();
        },
        act(down) {
          if (down) pick();
        },
        timeout: scoreNow,
        update(dt) {
          const sp = 90 * dt;
          if (keys.ArrowLeft) rx -= sp;
          if (keys.ArrowRight) rx += sp;
          if (keys.ArrowUp) ry -= sp;
          if (keys.ArrowDown) ry += sp;
          rx = clamp(rx, 0, W);
          ry = clamp(ry, 0, H);
        },
        draw(c, tt) {
          R(c, 0, 0, W, H, '#3a1d14');
          for (const g of grains) R(c, g.x - g.r / 2, g.y - g.r / 2, g.r, g.r, g.col);
          for (const b of bright) {
            R(c, b.x - 2, b.y - 2, 4, 4, b.found ? '#3fe08a' : '#f2ead0');
            if (!b.found) R(c, b.x - 1, b.y - 2, 2, 1, '#ffffff');
          }
          // microscope vignette
          c.save();
          c.fillStyle = 'rgba(0,0,0,0.55)';
          c.beginPath();
          c.rect(0, 0, W, H);
          c.arc(W / 2, H / 2, 150, 0, Math.PI * 2, true);
          c.fill();
          c.restore();
          c.strokeStyle = '#3fe0e6';
          c.lineWidth = 1;
          c.beginPath();
          c.arc(rx, ry, 8, 0, Math.PI * 2);
          c.moveTo(rx - 12, ry);
          c.lineTo(rx - 4, ry);
          c.moveTo(rx + 4, ry);
          c.lineTo(rx + 12, ry);
          c.moveTo(rx, ry - 12);
          c.lineTo(rx, ry - 4);
          c.moveTo(rx, ry + 4);
          c.lineTo(rx, ry + 12);
          c.stroke();
          txt(c, '×50', 300, 166, '#9aa3ad', 'right', 8);
        }
      };
    });
  }

  // InSight: a scan line passes over an orbital view; mark the dark dust-devil tracks.
  function gDustDevil(config) {
    const tracks = [0.14, 0.31, 0.47, 0.66, 0.84];
    return play(config, 'proto.mg.tag.env', t('proto.mg.dd.how'), t('proto.mg.dd.hint'), 22, (api) => {
      const hit = tracks.map(() => false);
      let err = 0;
      const speed = 0.055; // of the width per second
      const scan = (tt) => (tt * speed) % 1;
      const trackX = (i, y) => tracks[i] * W + Math.sin(y * 0.05 + i * 2) * 10;
      const scoreNow = () => clamp(hit.filter(Boolean).length / tracks.length - err * 0.1, 0, 1);
      return {
        act(down) {
          if (!down || api.done) return;
          const sx = scan(api.tt()) * W;
          const i = tracks.findIndex((q, k) => !hit[k] && Math.abs(trackX(k, 88) - sx) < 9);
          if (i >= 0) {
            hit[i] = true;
            S.bus.emit('audio:play', 'success');
          } else {
            err++;
            S.bus.emit('audio:play', 'fail');
          }
          api.status(t('proto.mg.dd.read', { n: hit.filter(Boolean).length, total: tracks.length, err }));
          if (hit.every(Boolean)) setTimeout(() => api.finish(scoreNow()), 400);
        },
        timeout: scoreNow,
        draw(c, tt) {
          R(c, 0, 0, W, H, '#a8705a');
          for (let i = 0; i < 90; i++) R(c, rnd(i * 3.1) * W, rnd(i * 1.9) * H, 3 + rnd(i) * 6, 2, i % 2 ? '#b98068' : '#94604c');
          // dust-devil tracks: thin dark curving streaks
          tracks.forEach((q, k) => {
            for (let y = 0; y < H; y += 2) R(c, trackX(k, y), y, 3, 2, hit[k] ? '#2a6f55' : '#5a3426');
          });
          // InSight's site: a small dot and its panels
          R(c, 150, 120, 6, 4, '#e7e4dc');
          R(c, 144, 121, 6, 2, '#2c3e6b');
          R(c, 156, 121, 6, 2, '#2c3e6b');
          const sx = scan(tt) * W;
          R(c, sx, 0, 1, H, '#3fe0e6');
          c.globalAlpha = 0.15;
          R(c, sx - 8, 0, 16, H, '#3fe0e6');
          c.globalAlpha = 1;
        }
      };
    });
  }

  // Phoenix: LIDAR pointed up; snow falls from the cloud layer in a drifting column. Keep the beam on it.
  function gLidar(config) {
    return play(config, 'proto.mg.tag.env', t('proto.mg.lidar.how'), t('proto.mg.lidar.hint'), 16, (api) => {
      let beam = 0; // −1..1 angle
      let on = 0;
      const keys = {};
      const colX = (tt) => 160 + Math.sin(tt * 0.6) * 70 + Math.sin(tt * 1.7) * 18;
      const beamX = (y) => 160 + beam * 0.9 * (150 - y);
      const scoreNow = () => clamp(on / 9, 0, 1);
      return {
        key(ev, down) {
          if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return false;
          keys[ev.key] = down;
          return true;
        },
        move(x) {
          beam = clamp((x - 160) / (0.9 * 110), -1, 1);
        },
        timeout: scoreNow,
        update(dt, tt) {
          if (keys.ArrowLeft) beam = clamp(beam - dt * 0.9, -1, 1);
          if (keys.ArrowRight) beam = clamp(beam + dt * 0.9, -1, 1);
          if (Math.abs(beamX(40) - colX(tt)) < 16) on += dt;
          api.status(t('proto.mg.lidar.read', { pct: Math.round(scoreNow() * 100) }), Math.abs(beamX(40) - colX(tt)) < 16 ? 'ok' : '');
          if (on >= 9) api.finish(1);
        },
        draw(c, tt) {
          const sky = c.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, '#0d0f1e');
          sky.addColorStop(1, '#2a2240');
          c.fillStyle = sky;
          c.fillRect(0, 0, W, H);
          // cloud layer
          for (let i = 0; i < 14; i++) {
            c.globalAlpha = 0.35;
            R(c, ((i * 37 + tt * 6) % (W + 60)) - 30, 18 + (i % 3) * 4, 40, 6, '#8f96b5');
          }
          c.globalAlpha = 1;
          // falling snow column (virga): it fades before reaching the ground
          const cx = colX(tt);
          for (let i = 0; i < 46; i++) {
            const ph = (tt * (0.25 + rnd(i) * 0.2) + rnd(i * 2.2)) % 1;
            const y = 30 + ph * 90;
            c.globalAlpha = 1 - ph;
            R(c, cx - 14 + rnd(i * 4.4) * 28 + ph * 6, y, 1, 2, '#e6f0ff');
          }
          c.globalAlpha = 1;
          // ground, lander, beam
          R(c, 0, 150, W, 26, '#4a3a3c');
          R(c, 150, 140, 20, 10, '#cfd6dc');
          R(c, 128, 144, 22, 3, '#2c3e6b');
          R(c, 170, 144, 22, 3, '#2c3e6b');
          c.strokeStyle = 'rgba(80,255,120,0.85)';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(160, 140);
          c.lineTo(beamX(10), 10);
          c.stroke();
          const hitNow = Math.abs(beamX(40) - colX(tt)) < 16;
          if (hitNow) {
            c.globalAlpha = 0.5;
            R(c, beamX(60) - 4, 40, 8, 40, '#7dff9a');
            c.globalAlpha = 1;
          }
          R(c, 250, 120, 60, 24, '#1b1e24');
          R(c, 252, 122, 56 * scoreNow(), 20, '#3fe08a');
        }
      };
    });
  }

  // Beagle 2: an orbiter pass; keep the receiver on the predicted Doppler track. No carrier ever shows.
  function gRelay(config) {
    return play(config, 'proto.mg.tag.env', t('proto.mg.relay.how'), t('proto.mg.relay.hint'), 18, (api) => {
      let f = 0; // receiver offset −1..1
      let on = 0;
      const keys = {};
      const pass = 16;
      const pred = (tt) => 0.8 * Math.cos((tt / pass) * Math.PI); // Doppler: high → zero overhead → low
      const scoreNow = () => clamp(on / (pass * 0.7), 0, 1);
      return {
        key(ev, down) {
          if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return false;
          keys[ev.key] = down;
          return true;
        },
        move(x) {
          f = clamp((x - 160) / 140, -1, 1);
        },
        timeout: scoreNow,
        update(dt, tt) {
          if (keys.ArrowLeft) f = clamp(f - dt * 0.8, -1, 1);
          if (keys.ArrowRight) f = clamp(f + dt * 0.8, -1, 1);
          if (tt < pass && Math.abs(f - pred(tt)) < 0.12) on += dt;
          api.status(t('proto.mg.relay.read', { pct: Math.round(scoreNow() * 100) }));
          if (tt >= pass) api.finish(scoreNow());
        },
        draw(c, tt) {
          // sky with the orbiter arc
          R(c, 0, 0, W, 70, '#0d0f1e');
          const k = clamp(tt / pass, 0, 1);
          c.strokeStyle = '#2b3150';
          c.beginPath();
          c.arc(160, 120, 110, Math.PI, 0);
          c.stroke();
          const ang = Math.PI * (1 - k);
          R(c, 160 + Math.cos(ang) * 110 - 3, 120 - Math.sin(ang) * 110 - 2, 6, 4, '#e7e4dc');
          R(c, 0, 62, W, 8, '#4a2a22');
          // waterfall spectrum: noise only, with the predicted track drawn
          R(c, 0, 70, W, 106, '#05070a');
          for (let y = 72; y < 172; y += 3)
            for (let x = 10; x < 310; x += 3) {
              const v = rnd(x * 0.37 + y * 1.3 + Math.floor(tt * 10) * 7.1);
              if (v > 0.82) R(c, x, y, 2, 2, v > 0.95 ? '#2f6f9f' : '#18324a');
            }
          c.strokeStyle = 'rgba(255,194,51,0.6)';
          c.setLineDash([3, 3]);
          c.beginPath();
          for (let y = 72; y < 172; y += 4) {
            const ty = tt - (y - 72) * 0.05;
            const x = 160 + pred(clamp(ty, 0, pass)) * 140;
            if (y === 72) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
          c.setLineDash([]);
          R(c, 160 + f * 140 - 1, 70, 2, 106, '#3fe0e6');
        }
      };
    });
  }

  /* ================================================================ */
  /* CRISIS: suit leak                                                 */
  /* ================================================================ */
  function gPatch(config) {
    return play(config, 'proto.mg.tag.fix', t('proto.mg.patch.how'), t('proto.mg.patch.hint'), 14, (api) => {
      let px = 60;
      let py = 120;
      let press = false;
      let seal = 0;
      const keys = {};
      const hole = (tt) => ({ x: 170 + Math.sin(tt * 2.1) * 26, y: 80 + Math.sin(tt * 1.3 + 1) * 16 });
      const scoreNow = () => clamp(seal, 0, 1) * clamp(1 - api.tt() / 28, 0.4, 1);
      return {
        key(ev, down) {
          if (!ev.key.startsWith('Arrow')) return false;
          keys[ev.key] = down;
          return true;
        },
        move(x, y) {
          px = x;
          py = y;
        },
        act(down) {
          press = down;
        },
        timeout: scoreNow,
        update(dt, tt) {
          const sp = 110 * dt;
          if (keys.ArrowLeft) px -= sp;
          if (keys.ArrowRight) px += sp;
          if (keys.ArrowUp) py -= sp;
          if (keys.ArrowDown) py += sp;
          const h = hole(tt);
          const over = Math.hypot(px - h.x, py - h.y) < 10;
          if (press && over) seal += dt / 1.6;
          else seal = Math.max(0, seal - dt * 0.25);
          api.status(t('proto.mg.patch.read', { pct: Math.round(clamp(seal, 0, 1) * 100) }), over ? 'ok' : '');
          if (seal >= 1) api.finish(scoreNow());
        },
        draw(c, tt) {
          R(c, 0, 0, W, H, '#1b1418');
          const h = hole(tt);
          // the suit sleeve
          const ox = h.x - 170;
          const oy = h.y - 80;
          R(c, 60 + ox, 50 + oy, 220, 60, '#e7e4dc');
          R(c, 60 + ox, 50 + oy, 220, 6, '#ffffff');
          R(c, 60 + ox, 104 + oy, 220, 6, '#bdb8ae');
          R(c, 120 + ox, 50 + oy, 6, 60, '#e8692a');
          R(c, 230 + ox, 50 + oy, 6, 60, '#bdb8ae');
          // the hole, hissing gas
          R(c, h.x - 3, h.y - 2, 6, 4, '#1e1a1a');
          if (seal < 1)
            for (let i = 0; i < 10; i++) {
              const ph = (tt * 2 + i / 10) % 1;
              c.globalAlpha = (1 - ph) * 0.8;
              R(c, h.x + ph * 40 + rnd(i) * 6, h.y - ph * 30 + rnd(i * 2) * 6, 2, 2, '#f2f6ff');
            }
          c.globalAlpha = 1;
          // the patch
          c.globalAlpha = press ? 1 : 0.85;
          R(c, px - 9, py - 7, 18, 14, '#c94a2b');
          R(c, px - 7, py - 5, 14, 10, '#e06a48');
          c.globalAlpha = 1;
          R(c, 20, 160, 280, 6, '#2a2d33');
          R(c, 20, 160, 280 * clamp(seal, 0, 1), 6, '#3fe08a');
        }
      };
    });
  }

  /* ---------------- routing ---------------- */
  const EXP = { pendulum_gravity: gPendulum, free_fall: gFreeFall, seed_germination: gWash, water_boiling: gVacuum, sound_speed: gSound, moxie_night: gMoxie };
  const ENV = { opportunity: gTau, spirit: gGrains, insight: gDustDevil, phoenix: gLidar, beagle2: gRelay };
  const CRISIS = { suit_leak: gPatch };
  window.addEventListener('load', () => {
    const prevRun = S.runMinigame;
    S.runMinigame = function (type, config) {
      const cfg = config || {};
      const key = String(cfg.titleKey || '');
      // main's descriptions explain its old mechanics; each game here shows its own instruction instead
      const own = (id) => Object.assign({}, cfg, { descKey: null, titleKey: S.STORY && S.STORY.tr['proto.mg.title.' + id] ? 'proto.mg.title.' + id : cfg.titleKey });
      let m = key.match(/^exp\.([a-z_0-9]+)\.mg_title$/);
      if (m && EXP[m[1]]) return EXP[m[1]](own(m[1]));
      m = key.match(/^ev\.([a-z0-9_]+)\.env\.mg_title$/);
      if (m && ENV[m[1]]) return ENV[m[1]](own(m[1]));
      m = key.match(/^crisis\.([a-z_0-9]+)\.mg_title$/);
      if (m && CRISIS[m[1]]) return CRISIS[m[1]](own(m[1]));
      if (type === 'wires') return prevRun.call(this, 'cablebox', cfg); // every wiring task: the cable panel look
      return prevRun.apply(this, arguments);
    };
    const prevOpen = S.isMinigameOpen;
    S.isMinigameOpen = () => openNow || Boolean(prevOpen && prevOpen());
  });
})((window.SOL14 = window.SOL14 || {}));
