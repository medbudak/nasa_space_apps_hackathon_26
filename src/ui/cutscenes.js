/**
 * SOL 14: RED HORIZON — Ara Sahneler (K3 + K4)
 *  1) Transit (Sol 0 -> Sol 1): 15 sn yolculuk + mikrometeorit kablo tamiri + EDL; tek tuşla geçilir
 *  2) Sol geçişi (M6): mavi Mars gün batımı, SOL X -> SOL X+1 telemetri özeti
 *  3) Final: MAV kalkışı -> ufukta anomali -> SON İLETİM (satır satır inen foto + Güneş Kavuşumu)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const CS = {};

  /* ================================================================ */
  /* 1) TRANSIT                                                         */
  /* ================================================================ */
  const TRANSIT_MS = 15000;
  const METEOR_AT = 5200;
  const EDL_AT = 11500;

  CS.playTransit = function (onDone) {
    const s = S.getState();
    const orbit = S.Engineering.findById(S.DATA.orbits, s.design.orbitType);
    const rocket = S.Engineering.findById(S.DATA.rockets, s.design.rocketId);
    const html =
      '<div class="cutscene transit" style="--bg:url(\'' + S.Sprites.screen('scr_transit') + '\')"><div class="cs-bg"></div><div class="cs-stars"></div>' +
      UI_header() +
      '<div class="transit-track"><span class="tt-earth">' + t('transit.earth') + '</span><div class="tt-line"><div class="tt-fill"></div><span class="tt-ship">' + I('rocket') + '</span></div><span class="tt-mars">' + t('transit.mars') + '</span></div>' +
      '<div class="cs-panel"><span class="cs-badge">' + t('transit.badge') + '</span><h2 data-r="title">' + t('transit.title_cruise') + '</h2>' +
      '<p data-r="status">' + t('transit.status_cruise', { rocket: rocket.name }) + '</p>' +
      '<div class="cs-tlm"><div><span>' + t('transit.day') + '</span><b data-r="day">0</b></div>' +
      '<div><span>' + t('transit.dose') + '</span><b data-r="dose">0</b></div>' +
      '<div><span>' + t('transit.orbit') + '</span><b>' + t('orbit.' + orbit.id + '.name') + '</b></div></div></div>' +
      '<div class="edl" data-r="edl" hidden><span>' + t('transit.edl') + '</span><b data-r="alt">125 km</b><small data-r="edlphase"></small></div>' +
      '<button class="btn btn-ghost cs-skip" data-skip>' + t('transit.skip') + ' <kbd>Enter</kbd></button>' +
      '<div class="cs-flash" data-r="flash"></div></div>';
    const root = S.UI.showScreen(html, 'scene-transit');
    const R = (n) => root.querySelector('[data-r="' + n + '"]');
    let elapsed = 0;
    let last = performance.now();
    let paused = false;
    let repair = null;
    let meteorDone = false;
    let done = false;
    let raf = 0;

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      onDone(repair || { success: true, score: 0, skipped: true });
    };
    const onKey = (e) => {
      if (paused) return;
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', onKey, true);
    root.querySelector('[data-skip]').addEventListener('click', finish);

    const edlPhases = ['transit.edl_entry', 'transit.edl_chute', 'transit.edl_crane', 'transit.edl_touch'];
    const loop = () => {
      const now = performance.now();
      if (!paused) elapsed += now - last;
      last = now;
      const f = Math.min(1, elapsed / TRANSIT_MS);
      const travel = Math.min(1, elapsed / EDL_AT);
      root.querySelector('.tt-fill').style.width = travel * 100 + '%';
      root.querySelector('.tt-ship').style.left = travel * 100 + '%';
      R('day').textContent = Math.round(travel * orbit.transitDays) + ' / ' + orbit.transitDays;
      R('dose').textContent = (travel * orbit.transitDays * S.DATA.constants.radiation.transitDailyMsv).toFixed(0) + ' mSv';
      root.querySelector('.cs-bg').style.transform = 'scale(' + (1 + f * 0.18) + ')';

      if (!meteorDone && elapsed >= METEOR_AT) {
        meteorDone = true;
        paused = true;
        R('flash').classList.add('on');
        root.classList.add('shake');
        S.bus.emit('audio:play', 'meteor');
        S.bus.emit('audio:play', 'alarm');
        R('title').textContent = t('transit.title_meteor');
        R('status').textContent = t('transit.status_meteor');
        setTimeout(async () => {
          R('flash').classList.remove('on');
          root.classList.remove('shake');
          repair = await S.runMinigame('wires', { titleKey: 'transit.mg_title', descKey: 'transit.mg_desc', timeLimitSec: 25 });
          R('title').textContent = t('transit.title_repaired');
          R('status').textContent = t(repair.skipped ? 'transit.status_auto' : 'transit.status_repaired', { pct: Math.round(repair.score * 100) });
          last = performance.now();
          paused = false;
        }, 900);
      }
      if (elapsed >= EDL_AT) {
        const ef = Math.min(1, (elapsed - EDL_AT) / (TRANSIT_MS - EDL_AT));
        R('edl').hidden = false;
        R('alt').textContent = Math.max(0, Math.round(125 * (1 - ef) * (1 - ef))) + ' km';
        R('edlphase').textContent = t(edlPhases[Math.min(3, Math.floor(ef * 4))]);
        R('title').textContent = t('transit.title_edl');
        R('status').textContent = t('transit.status_edl');
        root.classList.add('edl-on');
      }
      if (elapsed >= TRANSIT_MS) {
        S.bus.emit('audio:play', 'land');
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };

  function UI_header() {
    return S.UI.header('<span class="loc-ico">' + I('rocket') + '</span><span>' + t('transit.section') + '</span>');
  }

  /* ================================================================ */
  /* 2) SOL GEÇİŞİ (M6)                                                 */
  /* ================================================================ */
  CS.showSolTransition = function (sum, onClose) {
    const s = S.getState();
    const delta = (a, b, unit, digits = 0) => {
      const d = b - a;
      return '<b>' + a.toFixed(digits) + ' → ' + b.toFixed(digits) + ' ' + unit + '</b><em class="' + (d >= 0 ? 'pos' : 'neg') + '">' + (d >= 0 ? '+' : '') + d.toFixed(digits) + '</em>';
    };
    const shed = sum.shed.length
      ? '<div class="alert warn">' + I('power') + '<span>' + t('soltrans.shed', { list: sum.shed.map((x) => t('load.' + x)).join(', ') }) + '</span></div>'
      : '';
    const gh = sum.greenhouseFrozen
      ? '<div class="alert danger">' + I('leaf') + '<span>' + t('soltrans.gh_frozen', { cause: t('gh.cause_' + s.greenhouse.cause) }) + '</span></div>'
      : '';
    const events = sum.events.filter((e) => e !== 'greenhouse_frozen');
    const evHtml = events.length ? '<div class="st-events">' + events.map((e) => '<span class="chip">' + t('crisis.' + e + '.short') + '</span>').join('') + '</div>' : '';
    const warns = (s.weather.warnings || []).filter((w) => w.sol === s.sol || w.sol === s.sol + 1);
    const warnHtml = warns.map((w) => '<div class="alert info">' + I('sat') + '<span>' + t('warn.' + w.id, { inst: t('inst.' + w.instrument + '.short'), sol: w.sol }) + '</span></div>').join('');
    const html =
      '<div class="soltrans" style="--bg:url(\'' + S.Sprites.screen('scr_sol_transition') + '\')"><div class="st-bg"></div>' +
      '<div class="st-counter"><span class="from">SOL ' + sum.from + '</span><span class="arrow">' + I('arrowR') + '</span><span class="to">SOL ' + sum.to + '</span></div>' +
      '<p class="st-sub">' + t('soltrans.subtitle') + '</p>' +
      '<div class="panel st-card"><h4>' + t('soltrans.summary', { sol: sum.from }) + '</h4><div class="st-grid">' +
      '<div>' + I('power') + '<span>' + t('soltrans.energy') + '</span>' + delta(sum.energy[0], sum.energy[1], 'kWh', 1) + '</div>' +
      '<div>' + I('tank') + '<span>' + t('soltrans.o2') + '</span>' + delta(sum.o2[0], sum.o2[1], 'kg', 2) + '</div>' +
      '<div>' + I('morale') + '<span>' + t('soltrans.morale') + '</span>' + delta(sum.morale[0], sum.morale[1], '%') + '</div>' +
      '<div>' + I('rocket') + '<span>' + t('soltrans.fuel') + '</span>' + delta(sum.fuel[0], sum.fuel[1], '%') + '</div>' +
      '<div>' + I('signal') + '<span>' + t('soltrans.data') + '</span><b>' + sum.sentMbit + ' Mbit</b></div>' +
      '<div>' + I('temp') + '<span>' + t('soltrans.night') + '</span><b>' + Math.round(S.Sim.site(s).nightMinC) + ' °C</b></div>' +
      '</div>' + evHtml + shed + gh + warnHtml + '</div>' +
      '<button class="btn btn-primary btn-lg" data-close>' + t('soltrans.start', { sol: sum.to }) + ' <kbd>Enter</kbd></button></div>';
    S.UI.openModal('soltrans', html, { cls: 'modal-full', silent: true, onClose });
    S.bus.emit('audio:play', 'sol');
  };

  /* ================================================================ */
  /* 3) FİNAL — MAV + UFO STINGER                                       */
  /* ================================================================ */
  CS.playEnding = function (onDone) {
    const s = S.getState();
    const end = s.ending;
    const h = S.Engineering.getHorizons(s.sol, s.maxSols);
    const slide = (img, cap, sub, cls = '') =>
      '<div class="cutscene end-slide ' + cls + '" style="--bg:url(\'' + S.Sprites.screen(img) + '\')"><div class="cs-bg"></div>' +
      '<div class="end-cap"><h2>' + cap + '</h2><p>' + sub + '</p></div>' +
      '<button class="btn btn-ghost cs-skip" data-skip>' + t('transit.skip') + ' <kbd>Enter</kbd></button></div>';

    let step = 0;
    let timer = null;
    const steps = [
      () => {
        S.UI.showScreen(slide('ufo_liftoff', t(end.fuelOk ? 'end.liftoff' : 'end.liftoff_low'), t(end.fuelOk ? 'end.liftoff_sub' : 'end.liftoff_low_sub', { fuel: Math.round(s.res.mavFuel) })), 'scene-end');
        S.bus.emit('audio:play', 'launch');
        return 4200;
      },
      () => {
        S.UI.showScreen(slide('ufo_sky', t('end.anomaly'), t('end.anomaly_sub'), 'glint'), 'scene-end');
        S.bus.emit('audio:play', 'ufo_ping');
        return 4200;
      },
      () => {
        CS.lastTransmission(s, end, h, onDone);
        return null;
      }
    ];
    const next = () => {
      clearTimeout(timer);
      if (step >= steps.length) return;
      const ms = steps[step++]();
      bindSkip();
      if (ms) timer = setTimeout(next, ms);
    };
    const onKey = (e) => {
      if ((e.key === 'Enter' || e.key === 'Escape') && step < steps.length) {
        e.preventDefault();
        next();
      }
    };
    function bindSkip() {
      const b = S.UI.screenLayer().querySelector('[data-skip]');
      if (b) b.addEventListener('click', next);
      if (step >= steps.length) window.removeEventListener('keydown', onKey, true);
    }
    window.addEventListener('keydown', onKey, true);
    next();
  };

  /** Mockup 01: SON İLETİM */
  CS.lastTransmission = function (s, end, h, onDone) {
    const high = end.cameraTier === 'high';
    const html =
      '<div class="screen last-tx" style="--bg:url(\'' + S.Sprites.screen('bg_jezero_sunset') + '\')"><div class="lt-dim"></div>' +
      S.UI.header('<span class="loc-ico">' + I('camera') + '</span><span>' + t('lt.section') + '</span>', '<span class="lt-title">' + t('lt.title') + ' <i>///</i></span>') +
      '<div class="lt-grid"><div class="lt-main">' +
      '<div class="lt-frame"><canvas width="640" height="300" data-cv></canvas><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i></div>' +
      '<div class="lt-dl"><span>' + t('lt.download') + '</span><b data-pct>%0</b>' + S.UI.bar(0, 'cyan') + '</div>' +
      '<div class="lt-cut" data-cut hidden>' + I('alert') + '<b>' + t('lt.cut') + '</b><i>////</i></div>' +
      '<div class="lt-note" data-note hidden>' + I('doc') + '<b>' + t('lt.note_label') + '</b><span>' + t(high ? 'lt.note_high' : 'lt.note_low') + '</span></div>' +
      '<div class="lt-cta" data-cta hidden><p>' + t('lt.cta') + '</p><div><button class="btn btn-primary btn-lg" data-report>' + t('lt.to_report') + '</button>' +
      '<button class="btn btn-ghost btn-lg" data-menu>' + t('lt.main_menu') + '</button></div></div></div>' +
      '<aside class="panel lt-side"><div>' + I('camera') + '<span>' + t('lt.camera') + '</span><b>' + t(high ? 'lt.cam_high' : 'lt.cam_low') + '</b></div>' +
      '<div>' + I('signal') + '<span>' + t('lt.delay') + '</span><b>' + t('unit.mmss', { m: h.mm, s: h.ss }) + '</b></div>' +
      '<div class="lt-hist" data-hist></div></aside></div>' +
      '<p class="lt-fiction">' + t('lt.fiction') + '</p></div>';
    const root = S.UI.showScreen(html, 'scene-lasttx');
    const cv = root.querySelector('[data-cv]');
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const img = S.Sprites.get(high ? 'ufo_photo_clear' : 'ufo_photo_blur');
    const maxPct = end.ufoPct;
    const fill = root.querySelector('.lt-dl .bar-fill');
    const pctEl = root.querySelector('[data-pct]');
    const hist = root.querySelector('[data-hist]');
    hist.innerHTML = Array.from({ length: 36 }, (_, i) => '<i style="height:' + Math.round(20 + Math.abs(Math.sin(i * 0.7) * 60) * Math.exp(-i / 30) + Math.random() * 20) + '%"></i>').join('');
    let pct = 0;
    let lastStatic = 0;
    const step = () => {
      pct = Math.min(maxPct, pct + 0.35);
      const H = cv.height;
      const W = cv.width;
      g.fillStyle = '#120a08';
      g.fillRect(0, 0, W, H);
      const rows = Math.floor((H * pct) / 100);
      if (img) {
        const srcRows = Math.floor((img.height * pct) / 100);
        g.drawImage(img, 0, 0, img.width, srcRows, 0, 0, W, rows);
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < rows; y += 3) g.fillRect(0, y, W, 1);
      for (let y = rows + 3; y < H; y += 3) {
        g.fillStyle = 'rgba(120,60,40,' + (0.05 + Math.random() * 0.12) + ')';
        g.fillRect(0, y, W, 2);
      }
      g.fillStyle = '#3fe0e6';
      g.fillRect(0, rows, W, 2);
      pctEl.textContent = '%' + Math.floor(pct);
      fill.style.width = (pct / 100) * 100 + '%';
      const now = performance.now();
      if (now - lastStatic > 900) {
        lastStatic = now;
        S.bus.emit('audio:play', 'tick');
      }
      if (pct < maxPct) requestAnimationFrame(step);
      else {
        S.bus.emit('audio:play', 'static');
        S.bus.emit('audio:play', 'alarm');
        root.querySelector('[data-cut]').hidden = false;
        setTimeout(() => (root.querySelector('[data-note]').hidden = false), 900);
        setTimeout(() => (root.querySelector('[data-cta]').hidden = false), 1700);
      }
    };
    requestAnimationFrame(step);
    root.querySelector('[data-report]').addEventListener('click', () => onDone('report'));
    root.querySelector('[data-menu]').addEventListener('click', () => onDone('menu'));
  };

  S.Cutscenes = CS;
})((window.SOL14 = window.SOL14 || {}));
