/**
 * SOL 14: RED HORIZON — Ara Sahneler (K3 + K4)
 *  1) Açılış / transit (Sol 0 -> Sol 1): yazısız kalkış açılışı (K2 Sude, src/fx/opening.js) → mekik güvertesinde serbest
 *     yürüyüş (K3 Medine; görev yok, gün sayacı akar, kokpit koltuğunda E varışı başlatır) → kesintisiz Dünya→Mars uçuşu
 *     ve daktilo "GEZEGENE YAKLAŞILIYOR..." → varış. İniş sonra oyun dünyasında oynar (src/fx/lander.js).
 *     Yolculuk boyunca Mars bilgi kartları döner.
 *  2) Sol geçişi (M6): mavi Mars gün batımı, SOL X -> SOL X+1 telemetri özeti
 *  3) Final: MAV kalkışı -> ufukta anomali -> SON İLETİM (satır satır inen foto + Güneş Kavuşumu)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const CS = {};

  /* ================================================================ */
  /* 1) AÇILIŞ + TRANSIT                                                */
  /* ================================================================ */
  // Mekik kesiti (scr_ship_interior) üzerindeki yerler, görselin oranı olarak (K3 Medine'nin ölçümü)
  const DECK = {
    floorFrac: 0.695, // güverte zemini, görsel yüksekliğinin oranı
    minX: 0.2, // yürünebilir bölüm, görsel genişliğinin oranı
    maxX: 0.93,
    startX: 0.5,
    seatX: 0.255, // kokpit koltuğu: burada E varışı başlatır
    seatReach: 0.07,
    crewFrac: 0.19, // mürettebat boyu, görsel yüksekliğinin oranı
    speed: 0.11, // saniyede görsel genişliği
    zoom: 1.32, // görsel ekran yüksekliğinin bu katı kadar çizilir
    stepHz: 1.9
  };
  const TYPE_MS = 60; // daktilo: harf başına
  const KEY_GUARD_MS = 700; // "Fırlatmayı başlat"tan taşan Enter basışını yut
  const FACT_MS = 6000; // Mars bilgi kartı başına

  /** Mars bilgi kartları (K3 Medine): her sayı nasa_data.json'dan, kaynağıyla */
  function marsFacts() {
    const C = S.DATA.constants;
    const r1 = (v, d) => Number(v).toFixed(d);
    const solH = Math.floor(C.sol.hours);
    return [
      { key: 'fact.rad', vars: { d: r1(C.radiation.surfaceDailyMsv, 2), t: r1(C.radiation.transitDailyMsv, 2) }, src: C.radiation.src },
      { key: 'fact.sun', vars: { pct: r1((C.solarIrradiance.mean / C.solarIrradiance.earthMean) * 100, 0), w: r1(C.solarIrradiance.mean, 0) }, src: C.solarIrradiance.src },
      {
        key: 'fact.air',
        vars: { kpa: r1(C.atmosphere.surfacePressureKpa, 3), pct: r1((C.atmosphere.surfacePressureKpa / C.atmosphere.earthPressureKpa) * 100, 1), co2: r1(C.atmosphere.co2FractionPct, 0) },
        src: C.atmosphere.src
      },
      { key: 'fact.temp', vars: { mean: C.temperature.globalMeanC, max: C.temperature.equatorDayMaxC, min: C.temperature.equatorNightMinC }, src: C.temperature.src },
      { key: 'fact.sol', vars: { h: solH, m: Math.floor((C.sol.hours - solH) * 60) }, src: C.sol.src },
      { key: 'fact.sound', vars: { m: C.speedOfSound.marsMs, e: C.speedOfSound.earthMs }, src: C.speedOfSound.src },
      {
        key: 'fact.gravity',
        arrive: true,
        vars: { g: r1(C.marsGravity.value, 2), pct: r1((C.marsGravity.value / C.marsGravity.earthValue) * 100, 0), x: r1(C.marsGravity.earthValue / C.marsGravity.value, 1) },
        src: C.marsGravity.src
      }
    ];
  }
  CS.marsFacts = marsFacts;
  const hostOf = (url) => String(url).replace(/^https?:\/\//, '').split('/')[0];

  CS.playTransit = function (onDone) {
    const s = S.getState();
    const O = S.Opening;
    const orbit = S.Engineering.findById(S.DATA.orbits, s.design.orbitType);
    const rocket = S.Engineering.findById(S.DATA.rockets, s.design.rocketId);
    const dailyMsv = S.DATA.constants.radiation.transitDailyMsv;
    const deckSeconds = S.DATA.gameplay.transit.deckSeconds;
    const html =
      '<div class="cutscene transit"><canvas class="op-cv" width="' + O.W + '" height="' + O.H + '" data-r="cv"></canvas>' +
      '<canvas class="tr-deck" data-r="deck" hidden></canvas>' +
      UI_header() +
      '<div class="transit-track"><span class="tt-earth">' + t('transit.earth') + '</span><div class="tt-line"><div class="tt-fill"></div>' +
      '<span class="tt-ship">' + I('rocket') + '</span></div><span class="tt-mars">' + t('transit.mars') + '</span></div>' +
      '<div class="cs-panel tk-card" data-r="card"></div>' +
      '<div class="tk-side"><button class="btn btn-ghost btn-sm tk-skip" data-skip>' + t('transit.skip') + ' <kbd>Esc</kbd></button>' +
      '<aside class="cs-ship"><div class="cs-tlm"><div><span>' + t('transit.day') + '</span><b data-r="day"></b></div>' +
      '<div><span>' + t('transit.dose') + '</span><b data-r="dose"></b></div>' +
      '<div><span>' + t('transit.orbit') + '</span><b>' + t('orbit.' + orbit.id + '.name') + '</b></div></div></aside></div>' +
      // Görünmez tam metin kutuyu baştan genişletir: harfler eklenirken yazı kaymaz
      '<div class="cs-type" data-r="type" hidden><span class="cs-type-ghost">' + t('transit.approach') + '<i class="cs-caret"></i></span>' +
      '<span><span data-r="typetext"></span><i class="cs-caret"></i></span></div>' +
      '<p class="tr-hint" data-r="hint" hidden></p>' +
      '<div class="cs-fact fade" data-r="fact" role="status"></div></div>';
    const root = S.UI.showScreen(html, 'scene-transit');
    const R = (n) => root.querySelector('[data-r="' + n + '"]');
    const g = R('cv').getContext('2d');
    const deck = R('deck');
    const dc = deck.getContext('2d');
    const card = R('card');
    const deckImg = S.Sprites.get('ship_interior');
    const crewImg = S.Sprites.get('astronaut_indoor');
    // Varışta açılacak renk = oyun dünyasının ilk karesindeki gökyüzü (iniş alanı, Sol 1 sabahı)
    const skyTo = S.Art ? S.Art.palette(s.design.landingSiteId, S.DATA.gameplay.solStartMinute).skyTop : null;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let phase = 'liftoff'; // liftoff | deck | flight | arrive
    let done = false;
    let raf = 0;
    let ts = 0; // açılış tuvalinin zamanı (sn)
    let last = performance.now();
    let deckT = 0; // güvertede geçen süre (sn)
    let flightAt = 0;
    let crewX = DECK.startX;
    let dir = -1;
    let moveDir = 0;
    let moveV = 0; // W/S: ağırlıksız ortamda yukarı / aşağı süzülme
    let crewY = 0.35; // zeminden yükseklik (figür boyu oranında, 0..1)
    let stepPh = 0;
    let camL = null;
    let deckW = 0; // çizilen kesitin genişliği (tıklama için)
    let guardUntil = performance.now() + KEY_GUARD_MS;

    // Yol çubuğu: güverte süresi yolculuğun %85'i, son uçuş kalanı
    const progress = () =>
      phase === 'liftoff' ? 0 : phase === 'deck' ? Math.min(0.85, (deckT / deckSeconds) * 0.85) : phase === 'flight' ? 0.85 + 0.15 * O.travel(ts) : 1;
    const setProgress = (f) => {
      root.querySelector('.tt-fill').style.width = f * 100 + '%';
      root.querySelector('.tt-ship').style.left = f * 100 + '%';
      R('day').textContent = Math.round(f * orbit.transitDays) + ' / ' + orbit.transitDays;
      R('dose').textContent = (f * orbit.transitDays * dailyMsv).toFixed(0) + ' mSv';
    };
    const showCard = (badge, title, body) => {
      card.hidden = false;
      card.innerHTML = '<span class="cs-badge">' + badge + '</span><h2>' + title + '</h2><p>' + body + '</p>';
      card.classList.remove('tk-in');
      void card.offsetWidth;
      card.classList.add('tk-in');
    };

    /* --- Mars bilgi kartları: yolculuk boyunca döner; varışta yerçekimi kartı kalır --- */
    const facts = marsFacts();
    const cruiseFacts = facts.filter((f) => !f.arrive);
    let factI = -1;
    let factNext = 0;
    const showFact = (f, headKey, cls) => {
      const el = R('fact');
      el.classList.add('fade');
      later(() => {
        el.className = 'cs-fact ' + (cls || '');
        el.innerHTML = '<b>' + t(headKey) + '</b><span>' + t(f.key, f.vars) + '</span><small>' + t('fact.src', { src: hostOf(f.src) }) + '</small>';
      }, factI < 0 ? 0 : 350);
    };
    const factTick = () => {
      if (done) return;
      const now = performance.now();
      if (phase === 'arrive') {
        if (!R('fact').classList.contains('cf-arrive')) showFact(facts.find((f) => f.arrive), 'fact.head_arrive', 'cf-arrive');
      } else if (phase !== 'liftoff' && now >= factNext) {
        factI++;
        showFact(cruiseFacts[factI % cruiseFacts.length], 'fact.head');
        factNext = now + FACT_MS;
      }
      later(factTick, 250);
    };

    /* --- Güverte: kesit ekrandan geniş çizilir, kamera mürettebatı izler --- */
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
      if (!deckImg) return;
      const ih = Math.max(H * DECK.zoom, (W * 1.25 * deckImg.height) / deckImg.width);
      const iw = (ih * deckImg.width) / deckImg.height;
      deckW = iw;
      const top = Math.max(H - ih, Math.min(0, H * 0.78 - ih * DECK.floorFrac)); // zemin ekranın %78'inde, altta boşluk yok
      const want = Math.max(W - iw, Math.min(0, W * 0.45 - crewX * iw));
      camL = camL === null || !dt ? want : camL + (want - camL) * Math.min(1, dt * 6);
      dc.imageSmoothingEnabled = false;
      dc.drawImage(deckImg, Math.round(camL), Math.round(top), Math.round(iw), Math.round(ih));
      const floorY = top + ih * DECK.floorFrac;
      // Kokpit koltuğunun üstünde zıplayan etiket; yanındayken E ipucu
      const seatSX = camL + DECK.seatX * iw;
      const near = Math.abs(crewX - DECK.seatX) <= DECK.seatReach;
      const ly = floorY - ih * 0.25 + Math.sin(performance.now() / 260) * 3;
      const label = (near ? 'E  ' : '') + t('transit.seat');
      dc.font = Math.max(14, Math.round(H * 0.03)) + 'px "VT323", monospace';
      dc.textAlign = 'center';
      const lw = dc.measureText(label).width + 16;
      dc.fillStyle = 'rgba(15,16,21,0.92)';
      dc.fillRect(Math.round(seatSX - lw / 2), Math.round(ly - 14), Math.round(lw), 22);
      dc.strokeStyle = near ? '#ffc233' : '#3fe0e6';
      dc.lineWidth = 1;
      dc.strokeRect(Math.round(seatSX - lw / 2) + 0.5, Math.round(ly - 14) + 0.5, Math.round(lw) - 1, 21);
      dc.fillStyle = dc.strokeStyle;
      dc.fillText(label, Math.round(seatSX), Math.round(ly + 2));
      dc.fillRect(Math.round(seatSX - 3), Math.round(ly + 10), 6, 3);
      // Ağırlıksız ortam: takımın süzülme GIF'i (4 kare); boyu güvertedeki ayakta figürle aynı (şerit 132 px ölçeğinde)
      const fl = S.Sprites.get('astro_indoor_float') || S.Sprites.get('astro_float'); // mekiğin içi: kasksız
      if (fl) {
        const crewH = ih * DECK.crewFrac;
        const k = crewH / 132;
        const fw = fl.width / 4;
        const dw = Math.round(fw * k);
        const dh = Math.round(fl.height * k);
        const f = Math.floor(performance.now() / 300) % 4;
        const bob = Math.sin(stepPh * Math.PI * 2) * crewH * 0.04;
        const cx = Math.round(camL + crewX * iw);
        const by = Math.round(floorY - crewY * crewH * 0.9 - crewH * 0.08 + bob);
        dc.save();
        dc.imageSmoothingEnabled = false;
        if (dir < 0) {
          dc.translate(cx + Math.round(dw / 2), by - dh);
          dc.scale(-1, 1);
          dc.drawImage(fl, f * fw, 0, fw, fl.height, 0, 0, dw, dh);
        } else {
          dc.drawImage(fl, f * fw, 0, fw, fl.height, cx - Math.round(dw / 2), by - dh, dw, dh);
        }
        dc.restore();
      } else {
        S.FX.drawCrew(dc, crewImg, camL + crewX * iw, floorY, ih * DECK.crewFrac, dir, stepPh, moveDir !== 0);
      }
    }

    /* --- Akış: kalkış -> güverte -> uçuş + daktilo -> varış --- */
    const finish = (skipped) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      onDone({ skipped: Boolean(skipped) });
    };
    const enterDeck = () => {
      phase = 'deck';
      ts = O.T.cruise;
      root.classList.remove('op-intro'); // yolculuk arayüzü açılışın sonunda görünür
      deck.hidden = false;
      R('hint').hidden = false;
      R('hint').innerHTML = t('transit.deck_hint');
      showCard(t('transit.badge'), t('transit.deck_title'), t('transit.deck_body'));
      later(() => phase === 'deck' && (card.hidden = true), 7000); // kart kokpiti kapatmasın
      camL = null;
      guardUntil = performance.now() + KEY_GUARD_MS;
      S.bus.emit('audio:play', 'scan');
    };
    const startFlight = () => {
      if (phase !== 'deck') return;
      phase = 'flight';
      flightAt = performance.now();
      deck.hidden = true;
      R('hint').hidden = true;
      showCard(t('transit.badge'), t('transit.title_cruise'), t('transit.status_cruise', { rocket: rocket.name }));
      // Daktilo satırı uçuşun son kısmında yazılır, varıştan hemen önce biter
      const chars = Array.from(t('transit.approach'));
      let n = 0;
      const typeNext = () => {
        if (done) return;
        n++;
        R('typetext').textContent = chars.slice(0, n).join('');
        if (chars[n - 1] !== ' ') S.bus.emit('audio:play', { name: 'tick', freq: 1100 });
        if (n < chars.length) later(typeNext, TYPE_MS);
      };
      later(() => {
        if (done) return;
        R('type').hidden = false;
        typeNext();
      }, Math.max(0, (O.T.arrive - O.T.cruise) * 1000 - chars.length * TYPE_MS - 900));
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
        const prev = ts;
        ts += dt;
        // Yazısız açılışın ses işaretleri (kalabalık, geri sayım, kükreme, alkış)
        for (const c of O.cues) if (c.at > prev && c.at <= ts) S.bus.emit('audio:play', c.name);
        if (ts >= O.T.cruise) enterDeck();
        else O.draw(g, ts, { skyTo });
      } else if (phase === 'deck') {
        deckT += dt;
        if (moveDir) crewX = Math.max(DECK.minX, Math.min(DECK.maxX, crewX + moveDir * DECK.speed * dt));
        if (moveV) crewY = Math.max(0.05, Math.min(1, crewY + moveV * 0.9 * dt));
        stepPh = (stepPh + dt * 0.35) % 1; // süzülme salınımı
        drawDeck(dt);
        if (deckT >= deckSeconds) startFlight();
      } else {
        ts = O.T.cruise + (now - flightAt) / 1000;
        if (phase === 'flight' && ts >= O.T.arrive) arrive();
        if (ts >= O.T.end) {
          setProgress(1);
          finish(false);
          return;
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
      if (phase === 'liftoff') {
        // Enter açılışı geçer, yolculuk güvertede başlar
        if (e.key === 'Enter' && !e.repeat && performance.now() >= guardUntil) {
          e.preventDefault();
          enterDeck();
        }
        return;
      }
      if (phase !== 'deck') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir = dir = -1;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir = dir = 1;
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') moveV = 1;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') moveV = -1;
      else if ((e.code === 'KeyE' || e.key === 'Enter') && !e.repeat && performance.now() >= guardUntil) {
        if (Math.abs(crewX - DECK.seatX) <= DECK.seatReach) startFlight();
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && moveV === 1) moveV = 0;
      if ((e.code === 'ArrowDown' || e.code === 'KeyS') && moveV === -1) moveV = 0;
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    root.querySelector('[data-skip]').addEventListener('click', () => finish(phase !== 'arrive'));
    // Koltuk etiketine tıklamak = koltuğa git ve varışa hazırlan
    deck.addEventListener('click', (e) => {
      const r = deck.getBoundingClientRect();
      if (phase === 'deck' && deckW && Math.abs(e.clientX - r.left - (camL + DECK.seatX * deckW)) < 80) startFlight();
    });

    setProgress(0);
    showCard(t('transit.badge_launch'), t('transit.title_launch'), t('transit.status_launch', { rocket: rocket.name }));
    root.classList.add('op-intro'); // açılış boyunca ekranda yazı yok (styles/main.css)
    factTick();
    raf = requestAnimationFrame(draw);
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
        S.UI.showScreen(slide('ufo_liftoff', t(end.fuelOk ? 'end.liftoff' : 'end.liftoff_low'), t(end.fuelOk ? 'end.liftoff_sub' : end.damaged ? 'end.liftoff_damaged_sub' : 'end.liftoff_low_sub', { fuel: Math.round(s.res.mavFuel) })), 'scene-end');
        S.bus.emit('audio:play', 'launch');
        return 4200;
      },
      // D-014: göktaşından sonra kurulan istasyon sonraki ekibe kalır; hangi modüllerin durduğu sonu söyler
      ...(S.Station && S.Station.impacted(s) ? [() => CS.stationSlide(s, slide)] : []),
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

  CS.stationSlide = function (s, slide) {
    const id = S.Station.endingId(s);
    const built = S.DATA.station.modules.filter((m) => s.station.built[m]).map((m) => t('station.mod.' + m));
    const list = built.length ? t('station.end.built', { list: built.join(', ') }) : t('station.end.none');
    S.UI.showScreen(slide('bg_jezero_sunset', t('station.end.' + id + '.title'), t('station.end.' + id + '.body') + ' ' + list), 'scene-end');
    S.bus.emit('audio:play', id === 'pioneer' ? 'success' : 'scan');
    return 5200;
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
