/**
 * SOL 14: RED HORIZON — TRANSIT PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * Replaces Cutscenes.playTransit at runtime (loaded before src/main.js; ?proto=0 turns it off):
 *  - No tasks on the way to Mars. The cruise plays ONCE: liftoff → the shuttle deck → one continuous
 *    Earth→Mars flight → arrival. (Main stops the flight after each of its four tasks.)
 *  - The deck stays as a calm walk: A/D or ←/→ walk through the shuttle cross-section while the day counter
 *    runs; E at the cockpit seat (or when the days run out) starts the approach.
 *  - The crew member stands on the deck floor (the floor line of scr_ship_interior is at 69.5 % of the image
 *    height; main placed her at 75.5 %, below the floor) and her legs step while she walks (the indoor sprite
 *    is one frame: its legs are drawn as two halves that swing and lift in turn).
 *  - Without tasks the landing gets the nominal transit result (no task penalties).
 * Removing the transit tasks changes the game (scope): a team decision before it goes to main.
 */
(function (S) {
  'use strict';
  if (!S.Cutscenes || !S.Opening) return;
  if (new URLSearchParams(window.location.search).get('proto') === '0') return;

  /* Prototype settings (game values) */
  const T = {
    deckSeconds: 45, // the day counter runs from launch to arrival over this long on the deck
    floorFrac: 0.695, // deck floor line, fraction of the image height
    minX: 0.2, // walkable part of the deck, fractions of the image width
    maxX: 0.93,
    startX: 0.5,
    seatX: 0.255, // cockpit seat: E here starts the approach
    seatReach: 0.07,
    crewFrac: 0.19, // crew height as a fraction of the image height
    speed: 0.11, // image widths per second
    zoom: 1.32, // the deck image is drawn this many screen heights tall
    stepHz: 1.9 // steps per second
  };
  const TEXT = {
    tr: {
      'proto.tr.badge': 'GEZEGENLER ARASI SEYİR',
      'proto.tr.deck_title': 'Mekik güvertesi',
      'proto.tr.deck_body': 'Görev yok: yolculuğun tadını çıkar. Mekikte dolaşabilirsin. Varışa hazır olunca kokpitteki koltukta E\'ye bas; günler dolunca da yaklaşma kendiliğinden başlar.',
      'proto.tr.hint': 'A/D ile yürü · Kokpit koltuğunda E: varışa hazırlan · Esc: geç',
      'proto.tr.seat': 'Varışa hazırlan',
      'proto.tr.flight': 'Dünya → Mars'
    },
    en: {
      'proto.tr.badge': 'INTERPLANETARY CRUISE',
      'proto.tr.deck_title': 'Shuttle deck',
      'proto.tr.deck_body': 'No tasks: enjoy the journey. Walk around the shuttle. When you are ready for arrival press E at the cockpit seat; when the days run out the approach starts by itself.',
      'proto.tr.hint': 'A/D to walk · E at the cockpit seat: prepare for arrival · Esc: skip',
      'proto.tr.seat': 'Prepare for arrival',
      'proto.tr.flight': 'Earth → Mars'
    }
  };
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }
  const t = (k, v) => S.t(k, v);
  const esc = (x) => S.util.escape(String(x));

  const css = document.createElement('style');
  css.textContent =
    '.ptr-deck{position:absolute;inset:0;width:100%;height:100%;z-index:1;background:#05060a;image-rendering:pixelated}' +
    '.ptr-deck[hidden]{display:none}' +
    '.ptr-hint{position:absolute;left:50%;bottom:1.2em;transform:translateX(-50%);z-index:3;margin:0;padding:.45em 1em;border-radius:.4em;' +
    'background:rgba(10,11,16,.88);color:#e9e3d8;font-size:.8em;white-space:nowrap}' +
    '.ptr-hint[hidden]{display:none}.ptr-hint kbd{font:inherit;border:1px solid #6b7280;border-radius:3px;padding:0 .3em;margin:0 .1em}' +
    '.ptr .tk-card{width:24em}' +
    '.ptr .cs-skip{top:4.6em}';
  document.head.appendChild(css);

  // images: the deck cross-section and the indoor crew sprite (bounding box of the figure measured once)
  let deckImg = null;
  let crewImg = null;
  let crewBox = null;
  function loadImages() {
    if (!deckImg) {
      deckImg = new Image();
      deckImg.src = S.Sprites.screen('scr_ship_interior');
    }
    if (!crewImg) {
      crewImg = new Image();
      crewImg.onload = () => {
        // the figure inside the 2048×2048 frame (measured from the file: x 774..1289, y 154..2014)
        crewBox = { x: 774, y: 154, w: 515, h: 1860 };
      };
      crewImg.src = 'assets/processed/sprites/astronaut_indoor.png';
    }
  }

  /**
   * The crew member walking: the body bobs and leans a little, the legs (lower 44 % of the figure) are drawn as
   * a left and a right half that swing forward/back and lift in turn, so the feet step instead of sliding.
   * Facing: the sprite looks to the left; dir = +1 mirrors it.
   */
  function drawCrew(c, x, footY, h, dir, phase, moving) {
    if (!crewImg || !crewImg.complete || !crewBox) return;
    const b = crewBox;
    const k = h / b.h;
    const w = b.w * k;
    const hip = 0.56; // where the legs start (fraction of the figure height)
    const sw = moving ? Math.sin(phase * Math.PI * 2) : 0; // −1..1 leg swing
    const bob = moving ? Math.abs(Math.cos(phase * Math.PI * 2)) * h * 0.012 : 0;
    c.save();
    c.translate(Math.round(x), Math.round(footY));
    if (dir > 0) c.scale(-1, 1);
    c.imageSmoothingEnabled = false;
    // shadow on the floor
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.beginPath();
    c.ellipse(0, -2, w * 0.42, h * 0.02, 0, 0, Math.PI * 2);
    c.fill();
    const legTop = b.y + b.h * hip;
    const legH = b.h * (1 - hip);
    const halfW = b.w / 2;
    const stride = h * 0.07;
    const lift = h * 0.03;
    // back leg first (the one swinging back), then the front one
    const legs = [
      { sx: b.x, off: -sw }, // left half of the sprite
      { sx: b.x + halfW, off: sw } // right half
    ].sort((a, bb) => a.off - bb.off);
    for (const L of legs) {
      const dx = L.off * stride * 0.5;
      const dy = moving ? -Math.max(0, L.off) * lift : 0; // the leg moving forward is lifted
      c.drawImage(crewImg, L.sx, legTop, halfW, legH, -w / 2 + (L.sx - b.x) * k + dx, -legH * k + dy - bob * 0.3, halfW * k, legH * k);
    }
    // upper body over the legs, bobbing with the steps
    c.drawImage(crewImg, b.x, b.y, b.w, b.h * hip + 2, -w / 2, -h - bob, w, (b.h * hip + 2) * k);
    c.restore();
  }

  S.Cutscenes.playTransit = function (onDone) {
    loadImages();
    const s = S.getState();
    const O = S.Opening;
    const orbit = S.Engineering.findById(S.DATA.orbits, s.design.orbitType);
    const rocket = S.Engineering.findById(S.DATA.rockets, s.design.rocketId);
    const dailyMsv = S.DATA.constants.radiation.transitDailyMsv;
    const I = (n) => S.UI.icon(n);
    const html =
      '<div class="cutscene transit ptr"><canvas class="op-cv" width="' + O.W + '" height="' + O.H + '" data-r="cv"></canvas>' +
      '<canvas class="ptr-deck" data-r="deck" hidden></canvas>' +
      S.UI.header('<span class="loc-ico">' + I('rocket') + '</span><span>' + esc(t('transit.section')) + '</span>') +
      '<div class="transit-track"><span class="tt-earth">' + esc(t('transit.earth')) + '</span><div class="tt-line"><div class="tt-fill"></div>' +
      '<span class="tt-ship">' + I('rocket') + '</span></div><span class="tt-mars">' + esc(t('transit.mars')) + '</span></div>' +
      '<div class="cs-panel tk-card" data-r="card"></div>' +
      '<div class="tk-side"><button class="btn btn-ghost btn-sm tk-skip" data-skip>' + esc(t('transit.skip')) + ' <kbd>Esc</kbd></button>' +
      '<aside class="cs-ship"><div class="cs-tlm"><div><span>' + esc(t('transit.day')) + '</span><b data-r="day"></b></div>' +
      '<div><span>' + esc(t('transit.dose')) + '</span><b data-r="dose"></b></div>' +
      '<div><span>' + esc(t('transit.orbit')) + '</span><b>' + esc(t('orbit.' + orbit.id + '.name')) + '</b></div></div></aside></div>' +
      '<div class="cs-type" data-r="type" hidden><span class="cs-type-ghost">' + esc(t('transit.approach')) + '<i class="cs-caret"></i></span>' +
      '<span><span data-r="typetext"></span><i class="cs-caret"></i></span></div>' +
      '<p class="ptr-hint" data-r="hint" hidden></p>' +
      '<div class="cs-fact fade" data-r="fact" role="status"></div></div>';
    const root = S.UI.showScreen(html, 'scene-transit');
    const R = (n) => root.querySelector('[data-r="' + n + '"]');
    const g = R('cv').getContext('2d');
    const deck = R('deck');
    const dc = deck.getContext('2d');
    const card = R('card');
    const skyTo = S.Art ? S.Art.palette(s.design.landingSiteId, S.DATA.gameplay.solStartMinute).skyTop : null;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let phase = 'liftoff'; // liftoff | deck | flight | arrive
    let done = false;
    let raf = 0;
    let ts = 0;
    let last = performance.now();
    let deckT = 0; // seconds spent on the deck
    let crewX = T.startX;
    let dir = -1;
    let moveDir = 0;
    let stepPh = 0;
    let camL = null;
    let lastIw = 0;
    let flightAt = 0;
    let guardUntil = performance.now() + 700;

    // nominal transit: every main task counts as done (there are no tasks in this version)
    const results = {};
    for (const tk of S.DATA.gameplay.transit.tasks) results[tk.id] = { success: true, score: 1, timeUsed: 0 };

    const progress = () => (phase === 'liftoff' ? 0 : phase === 'deck' ? Math.min(0.85, (deckT / T.deckSeconds) * 0.85) : phase === 'flight' ? 0.85 + 0.15 * O.travel(ts) : 1);
    const setProgress = (f) => {
      root.querySelector('.tt-fill').style.width = f * 100 + '%';
      root.querySelector('.tt-ship').style.left = f * 100 + '%';
      R('day').textContent = Math.round(f * orbit.transitDays) + ' / ' + orbit.transitDays;
      R('dose').textContent = (f * orbit.transitDays * dailyMsv).toFixed(0) + ' mSv';
    };
    const showCard = (badge, title, body) => {
      card.hidden = false;
      card.innerHTML = '<span class="cs-badge">' + esc(badge) + '</span><h2>' + esc(title) + '</h2><p>' + esc(body) + '</p>';
      card.classList.remove('tk-in');
      void card.offsetWidth;
      card.classList.add('tk-in');
    };

    /* --- Mars facts, rotating on the left (the gravity card stays at arrival) --- */
    const facts = S.Cutscenes.marsFacts ? S.Cutscenes.marsFacts() : [];
    const cruiseFacts = facts.filter((f) => !f.arrive);
    let factI = -1;
    let factNext = 0;
    const hostOf = (url) => String(url).replace(/^https?:\/\//, '').split('/')[0];
    const showFact = (f, headKey, cls) => {
      if (!f) return;
      const el = R('fact');
      el.classList.add('fade');
      later(() => {
        el.className = 'cs-fact ' + (cls || '');
        el.innerHTML = '<b>' + esc(t(headKey)) + '</b><span>' + esc(t(f.key, f.vars)) + '</span><small>' + esc(t('fact.src', { src: hostOf(f.src) })) + '</small>';
      }, factI < 0 ? 0 : 350);
    };
    const factTick = () => {
      if (done) return;
      const now = performance.now();
      if (phase === 'arrive') {
        if (!R('fact').classList.contains('cf-arrive')) showFact(facts.find((f) => f.arrive), 'fact.head_arrive', 'cf-arrive');
      } else if (now >= factNext && cruiseFacts.length) {
        factI++;
        showFact(cruiseFacts[factI % cruiseFacts.length], 'fact.head');
        factNext = now + 6000;
      }
      later(factTick, 250);
    };

    /* --- the deck --- */
    function drawDeck(dt) {
      const W = deck.clientWidth;
      const H = deck.clientHeight;
      if (!W || !H) return;
      if (deck.width !== W || deck.height !== H) {
        deck.width = W;
        deck.height = H;
      }
      dc.fillStyle = '#05060a';
      dc.fillRect(0, 0, W, H);
      if (!deckImg || !deckImg.complete || !deckImg.naturalWidth) return;
      const aspect = deckImg.naturalWidth / deckImg.naturalHeight;
      const ih = Math.max(H * T.zoom, (W * 1.25) / aspect);
      const iw = ih * aspect;
      lastIw = iw;
      // floor near the bottom of the screen (78 %), no empty band under the image
      const top = Math.max(H - ih, Math.min(0, H * 0.78 - ih * T.floorFrac));
      const want = Math.max(W - iw, Math.min(0, W * 0.45 - crewX * iw));
      camL = camL === null || !dt ? want : camL + (want - camL) * Math.min(1, dt * 6);
      dc.imageSmoothingEnabled = false;
      dc.drawImage(deckImg, Math.round(camL), Math.round(top), Math.round(iw), Math.round(ih));
      const floorY = top + ih * T.floorFrac;
      // seat marker: a small bobbing arrow and label above the cockpit seat
      const seatSX = camL + T.seatX * iw;
      const near = Math.abs(crewX - T.seatX) <= T.seatReach;
      const bobY = Math.sin(performance.now() / 260) * 3;
      dc.font = '700 ' + Math.max(11, Math.round(H * 0.022)) + 'px VT323, monospace';
      dc.textAlign = 'center';
      const label = (near ? 'E  ' : '') + t('proto.tr.seat');
      const lw = dc.measureText(label).width + 16;
      const ly = floorY - ih * 0.25 + bobY;
      dc.fillStyle = 'rgba(15,16,21,0.92)';
      dc.fillRect(Math.round(seatSX - lw / 2), Math.round(ly - 14), Math.round(lw), 22);
      dc.strokeStyle = near ? '#ffc233' : '#3fe0e6';
      dc.lineWidth = 1;
      dc.strokeRect(Math.round(seatSX - lw / 2) + 0.5, Math.round(ly - 14) + 0.5, Math.round(lw) - 1, 21);
      dc.fillStyle = near ? '#ffc233' : '#3fe0e6';
      dc.fillText(label, Math.round(seatSX), Math.round(ly + 2));
      dc.fillRect(Math.round(seatSX - 3), Math.round(ly + 10), 6, 3);
      dc.fillRect(Math.round(seatSX - 1), Math.round(ly + 13), 2, 2);
      // the crew member
      drawCrew(dc, camL + crewX * iw, floorY, ih * T.crewFrac, dir, stepPh, moveDir !== 0);
    }

    /* --- flow --- */
    const finish = (skipped) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      onDone(results, { skipped: Boolean(skipped) });
    };
    const enterDeck = () => {
      phase = 'deck';
      ts = O.T.cruise;
      deck.hidden = false;
      R('hint').hidden = false;
      R('hint').innerHTML = esc(t('proto.tr.hint')).replace(/\b(A\/D|E|Esc)\b/g, '<kbd>$1</kbd>');
      showCard(t('proto.tr.badge'), t('proto.tr.deck_title'), t('proto.tr.deck_body'));
      later(() => phase === 'deck' && (card.hidden = true), 7000); // the card would cover the cockpit
      camL = null;
      guardUntil = performance.now() + 500;
      S.bus.emit('audio:play', 'scan');
    };
    const startFlight = () => {
      if (phase !== 'deck') return;
      phase = 'flight';
      flightAt = performance.now();
      deck.hidden = true;
      R('hint').hidden = true;
      showCard(t('proto.tr.badge'), t('proto.tr.flight'), t('transit.status_cruise', { rocket: rocket.name }));
      // the typed "approaching the planet" line comes in the last part of the flight
      const chars = Array.from(t('transit.approach'));
      let n = 0;
      later(() => {
        if (done) return;
        R('type').hidden = false;
        const typeNext = () => {
          if (done) return;
          n++;
          R('typetext').textContent = chars.slice(0, n).join('');
          if (chars[n - 1] !== ' ') S.bus.emit('audio:play', { name: 'tick', freq: 1100 });
          if (n < chars.length) later(typeNext, 60);
        };
        typeNext();
      }, Math.max(0, (O.T.arrive - O.T.cruise) * 1000 - chars.length * 60 - 900));
    };
    const arrive = () => {
      phase = 'arrive';
      R('type').hidden = true;
      showCard(t('transit.badge'), t('transit.title_arrive'), t('transit.status_arrive'));
    };

    const draw = () => {
      if (done) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (phase === 'liftoff') {
        ts += dt;
        if (ts >= O.T.cruise) enterDeck();
        O.draw(g, ts, { skyTo });
      } else if (phase === 'deck') {
        deckT += dt;
        if (moveDir) {
          crewX = Math.max(T.minX, Math.min(T.maxX, crewX + moveDir * T.speed * dt));
          stepPh = (stepPh + dt * T.stepHz) % 1;
        } else stepPh = 0;
        drawDeck(dt);
        if (deckT >= T.deckSeconds) startFlight();
      } else if (phase === 'flight' || phase === 'arrive') {
        // one continuous Earth → Mars flight, then the arrival, in real time
        ts = O.T.cruise + (now - flightAt) / 1000;
        if (phase === 'flight' && ts >= O.T.arrive) arrive();
        if (ts >= O.T.end) {
          setProgress(1);
          return finish(false);
        }
        O.draw(g, ts, { skyTo });
      }
      setProgress(progress());
      raf = requestAnimationFrame(draw);
    };

    const onKey = (e) => {
      if (done || S.isMinigameOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) finish(phase !== 'arrive');
        return;
      }
      if (phase === 'deck') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          moveDir = -1;
          dir = -1;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          moveDir = 1;
          dir = 1;
        } else if ((e.code === 'KeyE' || e.key === 'Enter') && !e.repeat && performance.now() >= guardUntil) {
          if (Math.abs(crewX - T.seatX) <= T.seatReach) startFlight();
        } else return;
        e.preventDefault();
        e.stopPropagation();
      } else if (phase === 'liftoff' && e.key === 'Enter' && !e.repeat && performance.now() >= guardUntil) {
        e.preventDefault();
        ts = O.T.cruise;
      }
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    root.querySelector('[data-skip]').addEventListener('click', () => finish(phase !== 'arrive'));
    deck.addEventListener('click', (e) => {
      // click on the seat label = go there and prepare
      const r = deck.getBoundingClientRect();
      if (phase === 'deck' && lastIw && Math.abs(e.clientX - r.left - (camL + T.seatX * lastIw)) < 80) startFlight();
    });

    setProgress(0);
    showCard(t('transit.badge_launch'), t('transit.title_launch'), t('transit.status_launch', { rocket: rocket.name }));
    factTick();
    raf = requestAnimationFrame(draw);
  };
})((window.SOL14 = window.SOL14 || {}));
