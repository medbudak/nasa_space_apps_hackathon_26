/**
 * SOL 14: RED HORIZON — Ara Sahneler (K3 + K4)
 *  1) Açılış / transit (Sol 0 -> Sol 1): Dünya'dan kalkış (tuval: src/fx/opening.js) → yolculukta sıralı görev zinciri
 *     (paneller, O₂ sızıntısı, TCM, ısı dengesi). Her görevden önce mekik güvertesi (K4 Sedef): astronot mekik kesitinde
 *     yürür, sıradaki görevin istasyonuna gidip E ile görev kartını açar; kart o istasyonun görseliyle gelir → daktilo "GEZEGENE YAKLAŞILIYOR..."
 *     → Mars'a varış. İniş sonra oyun dünyasında oynar (src/fx/lander.js). Yolculuk boyunca Mars bilgi kartları döner.
 *  2) Sol geçişi (M6): mavi Mars gün batımı, SOL X -> SOL X+1 telemetri özeti
 *  3) Final: MAV kalkışı -> ufukta anomali -> SON İLETİM (satır satır inen foto + Güneş Kavuşumu)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const CS = {};

  /* ================================================================ */
  /* 1) AÇILIŞ + TRANSIT — sıralı mühendislik görevleri (ux-plan #6)    */
  /* ================================================================ */
  // Tuval zamanı (ts, sn): kalkış gerçek zamanda oynar; seyir evresinde mekiğin yörüngedeki yeri görev ilerlemesini
  // izler (çubuk, gün ve doz zamanla değil, yalnızca bir görev bitince ilerler); son görevden sonra daktilo alt yazısı,
  // ardından varış yine gerçek zamanda oynar ve ekran iniş alanının gökyüzü rengine açılır.
  // Görevler gameplay.transit.tasks'tan gelir: sorun kartı -> mini oyun -> gemi durumu.
  const TASK_ICON = { arrays: 'power', leak: 'o2', tcm: 'target', thermal: 'temp' };
  // K4 mekik içi görselleri (nursedef, Sedef): görev kartı açıkken istasyonun görseli arka plandır
  const TASK_BG = { arrays: 'shuttle_engineering_bay', leak: 'scr_ship_o2_leak', tcm: 'shuttle_cockpit_interior', thermal: 'scr_ship_reactor' };
  // Mekik kesiti (scr_ship_interior) üzerinde istasyonların yatay konumu (% genişlik; görselin yerleşimi) ve yürüme sınırları
  const STATION_X = { tcm: 22, leak: 46, arrays: 61, thermal: 71 };
  // Güverte bir "dünya"dır: mekik kesiti görselin kendi oranında (1672×941) ekrandan büyük çizilir, kamera astronotu izler.
  // Tüm konumlar görselin yüzdesidir (ekranın değil): pencere oranı ne olursa olsun astronot gövdenin içinde kalır.
  const DECK = { minX: 15, maxX: 73, startX: 24, speedPctPerSec: 16, reachPct: 5, aspect: 1672 / 941, zoom: 1.35, minWidthFrac: 1.3, focusX: 0.42, floorFrom: 0.8 };
  const TASK_MG = { thermal: { theme: 'thermal' } };
  const ADVANCE_MS = 1400; // görev sonrası çubuk/gün/doz animasyonu
  const TYPE_MS = 75; // daktilo: harf başına
  const KEY_GUARD_MS = 700; // mini oyundan taşan Enter/Esc basışlarını yut
  const SKIP_ARM_MS = 4000; // "emin misin?" penceresi
  const FACT_MS = 6000; // Mars bilgi kartı başına (mini oyun açıkken bekler)

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
    const tasks = S.DATA.gameplay.transit.tasks;
    const dailyMsv = S.DATA.constants.radiation.transitDailyMsv;
    const results = {};
    const marks = tasks.map((tk, i) => '<i class="tt-mark" data-m="' + i + '" style="left:' + ((i + 1) / tasks.length) * 100 + '%"></i>').join('');
    const html =
      '<div class="cutscene transit"><canvas class="op-cv" width="' + O.W + '" height="' + O.H + '" data-r="cv"></canvas>' +
      // Mekik güvertesi (K4 Sedef): kesit görseli, sıradaki istasyonun işareti, yürüyen astronot, [E] balonu
      '<div class="sw-deck" data-r="deck" hidden><div class="sw-station" data-r="station"></div>' +
      '<div class="sw-world" data-r="world" style="background-image:url(&quot;' + S.Sprites.screen('scr_ship_interior') + '&quot;)">' +
      '<button type="button" class="sw-mark" data-r="mark"><span data-r="marklbl"></span><i>▼</i></button>' +
      '<img class="sw-crew" data-r="crew" alt="" src="assets/processed/sprites/astronaut_indoor.png">' +
      '<button type="button" class="world-prompt sw-prompt" data-r="swprompt" hidden></button></div>' +
      '<p class="sw-hint" data-r="swhint"></p></div>' +
      UI_header() +
      '<div class="transit-track"><span class="tt-earth">' + t('transit.earth') + '</span><div class="tt-line"><div class="tt-fill"></div>' + marks +
      '<span class="tt-ship">' + I('rocket') + '</span></div><span class="tt-mars">' + t('transit.mars') + '</span></div>' +
      '<div class="cs-panel tk-card" data-r="card"></div>' +
      '<div class="tk-side"><button class="btn btn-ghost btn-sm tk-skip" data-skip></button><small class="tk-skipnote" data-r="skipnote"></small>' +
      '<aside class="cs-ship"><h4>' + I('rocket') + t('transit.ship') + '</h4><div class="tk-sys" data-r="ship"></div>' +
      '<div class="cs-tlm"><div><span>' + t('transit.day') + '</span><b data-r="day"></b></div>' +
      '<div><span>' + t('transit.dose') + '</span><b data-r="dose"></b></div>' +
      '<div><span>' + t('transit.orbit') + '</span><b>' + t('orbit.' + orbit.id + '.name') + '</b></div></div></aside></div>' +
      // Görünmez tam metin kutuyu baştan genişletir: harfler eklenirken yazı kaymaz
      '<div class="cs-type" data-r="type" hidden><span class="cs-type-ghost">' + t('transit.approach') + '<i class="cs-caret"></i></span>' +
      '<span><span data-r="typetext"></span><i class="cs-caret"></i></span></div>' +
      '<div class="cs-fact fade" data-r="fact" role="status"></div>' +
      '<div class="cs-flash" data-r="flash"></div></div>';
    const root = S.UI.showScreen(html, 'scene-transit');
    const R = (n) => root.querySelector('[data-r="' + n + '"]');
    const g = R('cv').getContext('2d');
    // Varışta açılacak renk = oyun dünyasının ilk karesindeki gökyüzü (iniş alanı, Sol 1 sabahı)
    const skyTo = S.Art ? S.Art.palette(s.design.landingSiteId, S.DATA.gameplay.solStartMinute).skyTop : null;
    const card = R('card');
    const skipBtn = root.querySelector('[data-skip]');
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let idx = 0; // sıradaki görev
    let shown = 0; // gösterilen yolculuk oranı 0..1
    let phase = 'liftoff'; // liftoff | card | mg | anim | approach | arrive
    let done = false;
    let raf = 0;
    let guardUntil = 0;
    let armedUntil = 0;
    let ts = 0; // tuval zamanı (sn)
    let crewX = DECK.startX; // mekik güvertesinde astronotun yeri (%)
    let moveDir = 0;
    let arriveAt = 0; // varışın başladığı an (performance.now)
    let last = performance.now();

    // Metin değişkenleri: kart ve gemi paneli Sim.land'in uygulayacağı sayıların aynısını gösterir
    const vars = () => Object.assign({ rocket: rocket.name }, S.Sim.transitVars(s, S.Sim.transitOutcome(results)));
    const dayAt = (n) => Math.round((n / tasks.length) * orbit.transitDays);

    const setProgress = (f) => {
      root.querySelector('.tt-fill').style.width = f * 100 + '%';
      root.querySelector('.tt-ship').style.left = f * 100 + '%';
      R('day').textContent = Math.round(f * orbit.transitDays) + ' / ' + orbit.transitDays;
      R('dose').textContent = (f * orbit.transitDays * dailyMsv).toFixed(0) + ' mSv';
    };
    const animateTo = (target, then) => {
      const from = shown;
      const t0 = performance.now();
      const step = () => {
        if (done) return;
        const k = Math.min(1, (performance.now() - t0) / ADVANCE_MS);
        shown = from + (target - from) * (1 - Math.pow(1 - k, 3));
        setProgress(shown);
        if (k < 1) timers.push(setTimeout(step, 16));
        else then();
      };
      step();
    };

    /* --- Tuval: tek döngü; zaman kaynağı evreye göre değişir --- */
    const draw = () => {
      if (done) return;
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (phase === 'liftoff') {
        ts += dt;
        if (ts >= O.T.cruise) startCruise();
      } else if (phase === 'arrive') {
        ts = O.T.arrive + (now - arriveAt) / 1000;
        if (ts >= O.T.end) {
          finish(false);
          return;
        }
      } else {
        // Seyir: mekik yörüngede gösterilen ilerleme kadar yol alır (varış evresine girmeden)
        ts = O.T.cruise + shown * (O.T.arrive - O.T.cruise - 0.01);
        if (phase === 'deck') updateDeck(dt);
      }
      O.draw(g, ts, { skyTo });
      raf = requestAnimationFrame(draw);
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
      if (phase === 'arrive' || phase === 'approach') {
        if (!R('fact').classList.contains('cf-arrive')) showFact(facts.find((f) => f.arrive), 'fact.head_arrive', 'cf-arrive');
      } else if (phase === 'card' || phase === 'deck' || phase === 'mg' || S.isMinigameOpen()) {
        // Görev kartı ya da mini oyun açıkken kart gizlenir; görev bitince kaldığı yerden döner
        R('fact').classList.add('fade');
        factNext = Math.min(factNext, now + 900);
      } else if (now >= factNext) {
        factI++;
        showFact(cruiseFacts[factI % cruiseFacts.length], 'fact.head');
        factNext = now + FACT_MS;
      }
      later(factTick, 250);
    };

    const shipHtml = () => {
      const out = S.Sim.transitOutcome(results);
      const v = vars();
      return tasks
        .map((tk) => {
          const st = out.status[tk.id];
          const chip = st === 'ok' ? ' pos' : st === 'degraded' ? ' neg' : '';
          return (
            '<div class="tk-sys-row ' + st + '">' + I(TASK_ICON[tk.id]) + '<span>' + t('transit.' + tk.id + '.sys') + '</span>' +
            '<em class="chip' + chip + '">' + t('transit.st_' + st) + '</em>' +
            '<small>' + (st === 'pending' ? '—' : t('transit.' + tk.id + '.fx', v)) + '</small></div>'
          );
        })
        .join('');
    };
    const resultNote = (tk, r) => {
      const ok = S.Sim.transitOutcome(results).status[tk.id] === 'ok';
      const v = Object.assign({ pct: Math.round((r.skipped ? 0 : r.score) * 100) }, vars());
      return (
        '<div class="alert ' + (ok ? 'info' : 'danger') + ' tk-result">' + I(ok ? 'check' : 'alert') +
        '<span>' + t('transit.' + tk.id + (ok ? '.ok' : '.degraded'), v) + '</span></div>'
      );
    };
    const cardHtml = (note) => {
      const tk = tasks[idx];
      const v = vars();
      const k = 'transit.' + tk.id + '.';
      const row = (lbl, txt) => '<div class="tk-row"><span>' + t('transit.lbl_' + lbl) + '</span><p>' + txt + '</p></div>';
      return (
        note +
        '<span class="cs-badge">' + t('transit.task_badge', { n: idx + 1, total: tasks.length, day: dayAt(idx) }) + '</span>' +
        '<h2>' + I(TASK_ICON[tk.id]) + t(k + 'title') + '</h2>' +
        row('what', t(k + 'what', v)) + row('why', t(k + 'why', v)) + row('do', t(k + 'do', v)) +
        '<div class="alert warn tk-stake">' + I('alert') + '<span><b>' + t('transit.lbl_stake') + ':</b> ' + t(k + 'stake', v) + '</span></div>' +
        '<div class="tk-btns"><button class="btn btn-primary tk-start" data-start>' + I('play') + t('transit.start') + ' <kbd>Enter</kbd></button>' +
        '<button class="btn btn-ghost btn-sm" data-deck>' + t('transit.deck_back') + '</button></div>'
      );
    };
    const popCard = () => {
      card.classList.remove('tk-in');
      void card.offsetWidth;
      card.classList.add('tk-in');
    };

    /* --- Geç: görev varken iki adımlı (bedeli yazılı), görevler bitince tek basış --- */
    const remaining = () => tasks.filter((tk) => !results[tk.id]);
    const updateSkip = () => {
      const rest = remaining();
      const armed = rest.length > 0 && performance.now() < armedUntil;
      skipBtn.innerHTML = t(!rest.length ? 'transit.skip' : armed ? 'transit.skip_confirm' : 'transit.skip_tasks') + ' <kbd>Esc</kbd>';
      skipBtn.classList.toggle('armed', armed);
      const note = R('skipnote');
      note.hidden = !rest.length;
      note.textContent = armed
        ? t('transit.skip_list', { list: rest.map((tk) => t('transit.' + tk.id + '.sys')).join(', ') })
        : t('transit.skip_cost', { n: rest.length });
    };
    /** skipped: oyuncu açılışı geçti → oyun inmiş durumda başlar (iniş sahnesi oynamaz) */
    const finish = (skipped) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      // Geçilen görevler BOZUK sayılır (otomatik sistem); Sim.land cezaları uygular
      for (const tk of tasks) if (!results[tk.id]) results[tk.id] = { success: false, score: 0, timeUsed: 0, skipped: true };
      onDone(results, { skipped: Boolean(skipped) });
    };
    const skip = () => {
      if (done || phase === 'mg') return;
      // Görevler bitti: yaklaşma/varış beklenmez, iniş sahnesi oyun dünyasında başlar (orada da geçilebilir)
      if (!remaining().length) return finish(false);
      if (performance.now() < armedUntil) return finish(true);
      armedUntil = performance.now() + SKIP_ARM_MS;
      updateSkip();
      later(updateSkip, SKIP_ARM_MS + 50);
    };

    /* --- Akış: kalkış -> kart -> mini oyun -> sonuç + ilerleme -> sonraki kart / yaklaşma -> varış --- */
    const showLiftoff = () => {
      card.innerHTML =
        '<span class="cs-badge">' + t('transit.badge_launch') + '</span><h2>' + t('transit.title_launch') + '</h2>' +
        '<p>' + t('transit.status_launch', { rocket: rocket.name }) + '</p>';
      popCard();
    };
    const startCruise = () => {
      if (phase !== 'liftoff') return;
      ts = O.T.cruise;
      enterDeck('');
    };
    /* --- Mekik güvertesi (K4 Sedef): sıradaki görevin istasyonuna yürü, E ile kartı aç --- */
    const deck = R('deck');
    const setStationBg = (key) => (R('station').style.backgroundImage = "url('" + S.Sprites.screen(key) + "')");
    let camLeft = null; // güverte dünyasının ekrandaki sol kenarı (px), yumuşak takip
    /** Dünyanın boyu ve yeri: görsel oranında, ekrandan geniş; zemin ekranın alt kısmında; kamera astronotu izler */
    function layoutDeck(dt) {
      const w = R('world');
      const W = deck.clientWidth;
      const H = deck.clientHeight;
      if (!W || !H) return;
      const wh = Math.max(H * DECK.zoom, (W * DECK.minWidthFrac) / DECK.aspect);
      const ww = wh * DECK.aspect;
      w.style.height = Math.round(wh) + 'px';
      w.style.width = Math.round(ww) + 'px';
      // Zemin (görselin %75.5'i) ekranın floorFrom oranına gelsin, dünya ekranın dışına boşluk bırakmasın
      const top = Math.max(H - wh, Math.min(0, H * DECK.floorFrom - wh * 0.755));
      w.style.top = Math.round(top) + 'px';
      const target = Math.max(W - ww, Math.min(0, W * DECK.focusX - (crewX / 100) * ww));
      camLeft = camLeft === null || !dt ? target : camLeft + (target - camLeft) * Math.min(1, dt * 6);
      w.style.left = Math.round(camLeft) + 'px';
    }
    const nearStation = () => idx < tasks.length && Math.abs(crewX - STATION_X[tasks[idx].id]) <= DECK.reachPct;
    function placeDeck() {
      const tk = tasks[idx];
      const crew = R('crew');
      crew.style.left = crewX + '%';
      if (moveDir) crew.style.transform = 'translateX(-50%) scaleX(' + moveDir + ')';
      const mark = R('mark');
      mark.style.left = STATION_X[tk.id] + '%';
      R('marklbl').textContent = t('transit.station.' + tk.id);
      const pr = R('swprompt');
      pr.hidden = !nearStation();
      pr.style.left = STATION_X[tk.id] + '%';
    }
    function updateDeck(dt) {
      if (moveDir) {
        crewX = Math.max(DECK.minX, Math.min(DECK.maxX, crewX + moveDir * DECK.speedPctPerSec * dt));
        placeDeck();
      }
      layoutDeck(dt); // kamera astronotla birlikte sağa sola kayar (pencere boyutu değişirse de uyar)
    }
    const enterDeck = (note) => {
      phase = 'deck';
      pendingNote = note;
      card.hidden = true;
      deck.hidden = false;
      deck.classList.remove('show-card');
      root.classList.add('on-deck');
      const tk = tasks[idx];
      R('swprompt').innerHTML = '<kbd>E</kbd><span>' + t('transit.' + tk.id + '.title') + '</span>';
      R('swhint').innerHTML = t('transit.deck_hint', { n: idx + 1, total: tasks.length, station: t('transit.station.' + tk.id) });
      placeDeck();
      camLeft = null;
      layoutDeck(0);
      guardUntil = performance.now() + KEY_GUARD_MS;
      updateSkip();
      S.bus.emit('audio:play', 'scan');
    };
    let pendingNote = '';
    const openStation = () => {
      if (phase !== 'deck' || done) return;
      crewX = STATION_X[tasks[idx].id];
      showCard(pendingNote);
    };
    R('mark').addEventListener('click', openStation);
    R('swprompt').addEventListener('click', openStation);

    const showCard = (note) => {
      phase = 'card';
      card.hidden = false;
      deck.hidden = false;
      deck.classList.add('show-card'); // istasyonun görseli arkada, güverte işaretleri gizli
      root.classList.add('on-deck');
      setStationBg(TASK_BG[tasks[idx].id] || 'scr_ship_interior');
      card.innerHTML = cardHtml(note);
      card.querySelector('[data-start]').addEventListener('click', startTask);
      card.querySelector('[data-deck]').addEventListener('click', () => enterDeck(note));
      popCard();
      guardUntil = performance.now() + KEY_GUARD_MS;
      updateSkip();
      if (tasks[idx].id === 'leak') {
        const fl = R('flash');
        fl.classList.remove('on');
        void fl.offsetWidth;
        fl.classList.add('on');
        root.classList.add('shake');
        later(() => root.classList.remove('shake'), 950);
        S.bus.emit('audio:play', 'meteor');
        S.bus.emit('audio:play', 'alarm');
      } else {
        S.bus.emit('audio:play', 'scan');
      }
    };
    const startTask = async () => {
      if (phase !== 'card' || done) return;
      phase = 'mg';
      armedUntil = 0;
      const tk = tasks[idx];
      const cfg = { titleKey: 'transit.' + tk.id + '.mg_title', descKey: 'transit.' + tk.id + '.mg_desc', timeLimitSec: tk.timeLimitSec };
      const r = await S.runMinigame(tk.minigame, Object.assign(cfg, TASK_MG[tk.id]));
      if (done) return;
      results[tk.id] = r;
      const m = root.querySelector('.tt-mark[data-m="' + idx + '"]');
      m.classList.add(S.Sim.transitOutcome(results).status[tk.id]);
      idx++;
      phase = 'anim';
      deck.hidden = true; // görev aralarında yörüngedeki mekik görünür
      root.classList.remove('on-deck');
      R('ship').innerHTML = shipHtml();
      const note = resultNote(tk, r);
      card.innerHTML = note;
      updateSkip();
      animateTo(idx / tasks.length, () => (idx < tasks.length ? enterDeck(note) : approach(note)));
    };
    const approach = (note) => {
      phase = 'approach';
      deck.hidden = true;
      root.classList.remove('on-deck');
      card.hidden = false;
      const out = S.Sim.transitOutcome(results);
      card.innerHTML =
        note + '<span class="cs-badge">' + t('transit.badge') + '</span><h2 data-r="title">' + t('transit.title_done') + '</h2>' +
        '<p data-r="status">' + t('transit.status_done', { ok: out.okCount, total: tasks.length }) + '</p>';
      popCard();
      updateSkip();
      guardUntil = performance.now() + KEY_GUARD_MS;
      const chars = Array.from(t('transit.approach'));
      let n = 0;
      R('type').hidden = false;
      const typeNext = () => {
        n++;
        R('typetext').textContent = chars.slice(0, n).join('');
        if (chars[n - 1] !== ' ') S.bus.emit('audio:play', { name: 'tick', freq: 1100 });
        later(n < chars.length ? typeNext : arrive, n < chars.length ? TYPE_MS : 1500);
      };
      later(typeNext, 450);
    };
    const arrive = () => {
      phase = 'arrive';
      arriveAt = performance.now();
      R('type').hidden = true;
      card.innerHTML =
        '<span class="cs-badge">' + t('transit.badge') + '</span><h2>' + t('transit.title_arrive') + '</h2><p>' + t('transit.status_arrive') + '</p>';
      popCard();
    };

    const onKey = (e) => {
      if (done || phase === 'mg' || S.isMinigameOpen()) return;
      // Mekik güvertesi: A/D ya da oklarla yürü, istasyonun yanında E (ya da Enter) kartı açar
      if (phase === 'deck') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir = -1;
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir = 1;
        else if ((e.code === 'KeyE' || e.key === 'Enter') && !e.repeat && performance.now() >= guardUntil) {
          if (nearStation()) openStation();
        }
        if (e.code !== 'Escape' && e.key !== 'Escape') {
          if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'KeyE', 'Enter'].includes(e.code) || e.key === 'Enter') e.preventDefault();
          return;
        }
      }
      if (e.key !== 'Enter' && e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      // e.repeat: "Fırlatmayı başlat" düğmesinden basılı kalan Enter açılışı hemen geçmesin
      if (e.repeat || performance.now() < guardUntil) return;
      if (e.key === 'Enter' && phase === 'liftoff') startCruise();
      else if (e.key === 'Enter' && phase === 'card') startTask();
      else if (e.key === 'Escape' || phase === 'approach' || phase === 'arrive') skip();
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    skipBtn.addEventListener('click', skip);

    setProgress(0);
    R('ship').innerHTML = shipHtml();
    updateSkip();
    showLiftoff();
    guardUntil = performance.now() + KEY_GUARD_MS;
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
