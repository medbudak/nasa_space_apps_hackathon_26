/**
 * SOL 14: RED HORIZON — Yüzey HUD'u (K3)
 * Sakin düzen: sol üstte O₂ + elbise bataryası (M4 Dönüşsüzlük Noktası çentiği O₂ çubuğunda) ve habitata uzaklık,
 * üst ortada tek satır hedef + mesafe (tıklanınca ipucu), sağ üstte Sol/saat/yer/sıcaklık, dünyada habitat ve hedef
 * işaretleri, altta habitat→hedef çizgisi (dönüş menzili) ve kısayollar. Yalnızca sorun varsa uyarı bandı görünür.
 */
(function (S) {
  'use strict';
  const UI = () => S.UI;
  const t = (k, v) => S.t(k, v);
  const HUD = { refs: {}, mode: null, lastFrozen: false, lastNotch: 0, prompt: null };
  /** [E] balonunun üst kenarı, 640×360 tasarım alanında (zemin y=300'ün 174 px üstü; 16:9'da sahnenin %35'i) */
  const PROMPT_BASE_Y = 126;
  /** Dünya işaretlerinin y'si (640×360 tasarım alanı): habitat çatısının ve enkazların üstü */
  const MARK_HOME_Y = 150;
  const MARK_TARGET_Y = 212;
  /** Habitat yapısının ortası (surface.js STRUCTURES: px = sol kenar) */
  const HAB = () => S.Surface.STRUCTURES.find((x) => x.id === 'habitat');

  function ref(name) {
    return HUD.refs[name];
  }

  const DOME =
    '<svg class="hz-logo" viewBox="0 0 64 40" aria-hidden="true"><path d="M6 32a26 26 0 0 1 52 0z" fill="#e8592a"/>' +
    '<path d="M2 36l14-10 8 5 10-9 10 7 8-4 10 11z" fill="#7a2a17"/><rect x="0" y="35" width="64" height="3" fill="#e8592a"/></svg>';

  HUD.build = function (mode) {
    HUD.mode = mode;
    const layer = UI().hudLayer();
    const I = UI().icon;
    const surface = mode === 'surface';
    layer.hidden = false;
    layer.className = 'hud-layer mode-' + mode;
    const navBtn = (q, key, label) => '<button class="hz-key" data-q="' + q + '"><kbd>' + key + '</kbd><span>' + label + '</span></button>';
    layer.innerHTML =
      // Sol üst: yaşamsallar
      (surface
        ? '<section class="hz-card hz-vitals">' +
          '<div class="hz-row"><div class="hz-v"><div class="hz-vh">' + I('o2') + '<b>' + t('hud.o2_short') + ' <span data-ref="o2"></span></b></div>' +
          '<div class="hz-bar ponr-bar"><div class="bar-fill" data-ref="o2fill"></div>' +
          '<div class="ponr-ghost" data-ref="ghost" hidden></div><div class="ponr-jump" data-ref="jump" hidden><span data-ref="jumplbl"></span></div>' +
          '<div class="ponr-notch" data-ref="notch"></div></div></div><i class="hz-div"></i>' +
          '<div class="hz-v"><div class="hz-vh">' + I('battery') + '<b data-ref="sbat"></b></div><div class="hz-bar amber"><div class="bar-fill" data-ref="sbatfill"></div></div></div></div>' +
          '<div class="hz-home" data-ref="home"></div></section>'
        : '<section class="hz-card hz-vitals hab"><div class="hz-v"><div class="hz-vh">' + I('power') + '<b data-ref="hbat"></b></div>' +
          '<div class="hz-bar amber"><div class="bar-fill" data-ref="hbatfill"></div></div></div></section>') +
      // Üst orta: hedef (RIT-02) + ipucu (RIT-12) + uyarılar
      '<div class="hz-center"><button class="hz-goal" data-ref="goal" hidden title="' + t('goal.hint_btn') + '"><span class="hz-dia"></span>' +
      '<b data-ref="goaltxt"></b><span class="hz-dist" data-ref="goaldist"></span></button>' +
      '<div class="hz-hint" data-ref="goalhint" hidden></div>' +
      '<div class="hud-alerts" data-ref="alerts"></div></div>' +
      // Sağ üst: Sol / saat / yer / sıcaklık
      '<div class="hz-time"><b data-ref="sol"></b><span data-ref="place"></span></div>' +
      (surface
        ? '<div class="hz-mark" data-ref="mkhome">' + I('home') + '</div><div class="hz-mark tgt" data-ref="mktgt" hidden><span class="hz-dia"></span></div>' +
          '<div class="world-prompt" data-ref="prompt" hidden></div>' +
          '<div class="hotbar" data-ref="hotbar"></div>' +
          '<footer class="hz-foot"><div class="hz-brand">' + DOME + '<b>SOL 14</b></div><i class="hz-sep"></i>' +
          '<span class="hz-walk"><kbd>A</kbd>/<kbd>D</kbd>' + t('hud.walk') + '</span>' +
          '<div class="hz-track"><div class="hz-t-line">' +
          '<div class="hz-t-reach" data-ref="mmreach"></div><span class="hz-t-home in" data-ref="mmhome">' + I('home') + '</span>' +
          '<span class="hz-t-tube" data-ref="mmtube"></span><span class="hz-dia hz-t-tgt" data-ref="mmtgt" hidden></span>' +
          '<span class="hz-t-me" data-ref="mmme"></span></div></div></footer>'
        : '') +
      '<nav class="hz-nav">' +
      navBtn('downlink', 'L', t('hud.q_data')) + '<i class="hz-sep"></i>' +
      navBtn('log', 'J', t('hud.q_log')) + '<i class="hz-sep"></i>' +
      navBtn('power', 'P', t('hud.q_systems')) + '<i class="hz-sep"></i>' +
      navBtn('pause', 'Esc', t('hud.q_menu')) +
      '</nav>' +
      '<div class="touch-controls">' +
      '<button class="tc" data-tc="left">' + I('arrowL') + '</button><button class="tc" data-tc="right">' + I('arrowR') + '</button>' +
      '<button class="tc tc-act" data-tc="act">E</button>' +
      (surface ? '<button class="tc tc-act" data-tc="jump">' + I('up') + '</button>' : '') +
      '</div>';
    HUD.refs = {};
    layer.querySelectorAll('[data-ref]').forEach((el) => (HUD.refs[el.dataset.ref] = el));
    layer.querySelectorAll('[data-q]').forEach((b) =>
      b.addEventListener('click', () => {
        S.bus.emit('audio:play', 'click');
        S.Game.openPanel(b.dataset.q);
      })
    );
    // Dokunmatik kontroller -> S.Input
    layer.querySelectorAll('[data-tc]').forEach((b) => {
      const k = b.dataset.tc;
      const down = (e) => {
        e.preventDefault();
        if (k === 'act') S.Game.interact();
        else S.Input.touch[k] = true;
      };
      const up = () => {
        if (k !== 'act') S.Input.touch[k] = false;
      };
      b.addEventListener('pointerdown', down);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointerleave', up);
      b.addEventListener('pointercancel', up);
    });
    if (ref('prompt')) ref('prompt').addEventListener('click', () => S.Game.interact());
    ref('goal').addEventListener('click', () => {
      const h = ref('goalhint');
      h.hidden = !h.hidden;
      S.bus.emit('audio:play', 'click');
      if (!h.hidden) S.bus.emit('goal:hint', { id: HUD.goalId });
    });
    HUD.lastFrozen = false;
    HUD._goalHtml = null;
    HUD._alertsHtml = null;
  };

  HUD.hide = function () {
    const layer = UI().hudLayer();
    layer.hidden = true;
    layer.innerHTML = '';
    HUD.mode = null;
  };

  /* ------------------------------------------------------------------ */
  HUD.update = function (s) {
    if (!HUD.mode) return;
    const site = S.Sim.site(s);
    const amb = S.Sim.ambient(s);
    const inHab = HUD.mode === 'habitat';
    if (!inHab) S.Hotbar.render(ref('hotbar'), s);
    ref('sol').textContent = 'SOL ' + s.sol + ' / ' + s.maxSols + ' · ' + S.util.clock(S.Sim.clockMinute(s));
    const zone = !inHab && S.Explore && s.explore ? S.Explore.zoneAt(s) : null;
    ref('place').textContent = inHab
      ? t('hud.place_hab', { temp: Math.round(s.res.habTempC) })
      : zone === 'cave'
        ? t('hud.place_cave', { temp: Math.round(S.Explore.deepTemp(s)) }) // D-012: kurgusal tünel etiketi her an görünür
        : t('hud.place_zone', { site: t('site.' + site.id + '.short'), temp: Math.round(amb), zone: zone ? t('zone.' + zone) : '' });
    // Bölgeye ilk girişte kısa bölge bandı
    if (zone && s.explore && !s.explore.zonesSeen[zone]) {
      s.explore.zonesSeen[zone] = true;
      if (zone !== 'base') UI().toast(UI().icon('map') + t('toast.zone', { zone: t('zone.' + zone) }), 'info', 2600);
    }
    HUD.updateAlerts(s, amb);
    HUD.updateGoal(s);
    if (inHab) {
      ref('hbat').textContent = s.res.energyKwh.toFixed(1) + ' / ' + s.res.batteryKwh + ' kWh';
      ref('hbatfill').style.width = (s.res.energyKwh / s.res.batteryKwh) * 100 + '%';
      return;
    }

    // Yaşamsallar
    const suit = s.suit;
    const ponr = S.Sim.ponr(s);
    ref('o2').textContent = Math.round(suit.o2) + '%';
    ref('o2fill').style.width = suit.o2 + '%';
    ref('o2fill').parentElement.classList.toggle('critical', ponr.critical);
    const notch = ref('notch');
    notch.style.left = Math.min(99, ponr.requiredO2) + '%';
    notch.classList.toggle('frozen', suit.frozen);
    notch.hidden = ponr.requiredO2 <= 0.2;
    // Eklem donunca: hayalet çentik (normal hız) -> gerçek çentik (%40 hız) sıçrama oku
    const ghost = ref('ghost');
    const jump = ref('jump');
    if (suit.frozen && ponr.requiredNormal > 0) {
      ghost.hidden = false;
      jump.hidden = false;
      ghost.style.left = ponr.requiredNormal + '%';
      jump.style.left = ponr.requiredNormal + '%';
      jump.style.width = Math.max(0, Math.min(99, ponr.requiredO2) - ponr.requiredNormal) + '%';
      ref('jumplbl').textContent = '×' + ponr.jumpFactor;
    } else {
      ghost.hidden = true;
      jump.hidden = true;
    }
    if (suit.frozen && !HUD.lastFrozen) {
      notch.classList.remove('jumped');
      void notch.offsetWidth;
      notch.classList.add('jumped');
    }
    HUD.lastFrozen = suit.frozen;

    const heat = HUD.suitHeat(s, amb);
    ref('sbat').textContent = Math.round(suit.battery) + '%';
    ref('sbatfill').style.width = suit.battery + '%';
    ref('sbatfill').parentElement.classList.toggle('critical', heat.state !== 'heater');

    // Habitata uzaklık (dönüş yönüyle); dönüş O₂'si sınırdaysa kırmızı
    const home = ref('home');
    const m = Math.round(S.Sim.distanceFromHab(s));
    const inCave = S.Sim.inCave(s);
    const homeHtml = !S.Sim.isOutside(s)
      ? UI().icon('home') + '<span>' + t('hud.home_here') + '</span>'
      : inCave
        ? UI().icon('home') + '<span>' + t('hud.cave_line', { lm: Math.max(0, Math.round(s.player.cx - S.DATA.explore.cave.ladderM)), m }) + '</span>'
        : UI().icon('home') + '<span>' + t('hud.home_line', { dir: s.player.x > 0 ? '←' : '→', m }) + '</span>';
    if (home._html !== homeHtml) {
      home.innerHTML = homeHtml;
      home._html = homeHtml;
    }
    home.classList.toggle('danger', ponr.critical || ponr.beyond);

    HUD.updateMinimap(s, ponr);
    HUD.updatePrompt(s);
  };

  /**
   * Dünyaya bağlı öğelerin KONUMU (habitat/hedef işaretleri, [E] balonu, alt çizgideki oyuncu noktası).
   * main.js bunu her karede FX.render'dan hemen sonra çağırır: kamera (FX.camX) o karede nereye kaydıysa işaret de
   * oraya gider. x, tuvaldeki çizimle aynı yuvarlamayla (FX.worldToScreen = Math.round(px − camX)) tuval pikseline
   * oturtulur, sonra tuvalin CSS ölçeğiyle tam CSS pikseline çevrilir. Yumuşatma/transition yok: işaret nesneye kilitli.
   * İçerik ve görünürlük (hangi nesne yakın, metin) HUD.update'te 10 Hz'de kalır.
   */
  HUD.syncWorld = function (s) {
    if (HUD.mode !== 'surface' || !ref('mkhome')) return;
    const FX = S.FX;
    const v = FX.view;
    // .stage pencereyi kaplar (position: fixed; inset: 0) ve tuval %100 uzatılır: ölçek = pencere / tuval
    const kx = window.innerWidth / v.w;
    const ky = window.innerHeight / v.h;
    const sx = FX.shakeX || 0;
    const sy = FX.shakeY || 0;
    const cssX = (canvasX) => Math.round((canvasX + sx) * kx);
    const cssY = (yBase) => Math.round((yBase + v.offY + sy) * ky);
    const put = (el, canvasX, yBase) => {
      const on = canvasX > -40 && canvasX < v.w + 40;
      if (el.hidden === on) el.hidden = !on;
      if (on) el.style.transform = 'translate3d(' + cssX(canvasX) + 'px,' + cssY(yBase) + 'px,0) translate(-50%,-100%)';
    };
    const hab = HAB();
    const inCave = S.Sim.inCave(s);
    // Mağarada ev işareti merdivenin üstünde durur (çıkış yolu)
    if (inCave) put(ref('mkhome'), FX.worldToScreen(S.Surface.caveMToPx(S.DATA.explore.cave.ladderM)), MARK_HOME_Y);
    else put(ref('mkhome'), FX.worldToScreen(hab.px) + hab.w / 2, MARK_HOME_Y);
    const tgt = ref('mktgt');
    const tg = HUD.target;
    const tgPx = !tg ? null : inCave ? (tg.cx !== undefined ? S.Surface.caveMToPx(tg.cx) : null) : tg.m !== undefined ? S.Surface.mToPx(tg.m) : null;
    if (tgPx === null || (S.Lander && S.Lander.active)) {
      if (!tgt.hidden) tgt.hidden = true;
    } else put(tgt, FX.worldToScreen(tgPx), MARK_TARGET_Y);

    // [E] balonu: nesnenin üstünde, pencere kenarına taşmadan (genişlik içerik değişince önbelleğe alınır)
    const el = ref('prompt');
    if (HUD.prompt && !el.hidden) {
      const half = (el._w || 0) / 2;
      const gap = 8;
      const x = Math.max(half + gap, Math.min(window.innerWidth - half - gap, cssX(FX.worldToScreen(HUD.prompt.px))));
      el.style.left = x + 'px';
      el.style.top = cssY(PROMPT_BASE_Y) + 'px';
    }

    // Alt çizgideki oyuncu noktası (mağarada tünel ağzında)
    ref('mmme').style.left = HUD.trackPct(inCave ? S.DATA.terrain.map.tubeMouthM : s.player.x) + '%';
  };

  /** Alt çizgi ölçeği (D-012, iki yönlü): sol sınır (−450 m) → habitat (0 m) → lav tüneli ağzı (+600 m) */
  HUD.trackPct = function (m) {
    const map = S.DATA.terrain.map;
    return Math.max(0, Math.min(100, ((m - map.leftLimitM) / (map.eastEndM - map.leftLimitM)) * 100));
  };

  /** Oyun dakikası → "3 sa 20 dk" / "45 dk" (geri sayım tahminleri; aşağı yuvarlanır) */
  HUD.duration = function (minutes) {
    const total = Math.max(0, Math.floor(minutes));
    if (total < 60) return t('hud.dur_m', { m: total });
    return t('hud.dur_hm', { h: Math.floor(total / 60), m: total % 60 });
  };

  /**
   * Elbise sıcaklığı durumu: sıcaklığın NEDENİNİ verir (ısıtıcı bataryadan çalışıyor / batarya azalıyor /
   * batarya bitti, elbise soğuyor). Süreler o anki dış sıcaklıkla hesaplanan tahminlerdir (S.Sim.suitThermal).
   */
  HUD.suitHeat = function (s, amb) {
    const th = S.Sim.suitThermal(s, amb);
    const dur = HUD.duration;
    if (th.state === 'heater') return { state: th.state, tone: '', text: t('hud.heat_on', { time: dur(th.batteryMinutes) }) };
    if (th.state === 'low') return { state: th.state, tone: 'warn', text: t('hud.heat_low', { time: dur(th.batteryMinutes) }) };
    if (th.state === 'cooling') {
      const text = isFinite(th.freezeMinutes) ? t('hud.heat_cooling', { time: dur(th.freezeMinutes) }) : t('hud.heat_cooling_mild');
      return { state: th.state, tone: 'danger', text };
    }
    if (s.suit.battery > 0) return { state: th.state, tone: 'warn', text: t('hud.heat_thawing') };
    const text = isFinite(th.hypothermiaMinutes) ? t('hud.heat_hypothermia', { time: dur(th.hypothermiaMinutes) }) : t('hud.heat_cooling_mild');
    return { state: th.state, tone: 'danger', text };
  };

  /**
   * Hedefin konumu — hedef motoru (Objectives) her hedefe { m } (yüzey) ya da { cx } (tünel) ekler.
   * Habitat içindeyken dünya hedefi gösterilmez. Mağaradayken yüzey hedefine giden yol merdivenden geçer.
   */
  HUD.goalTarget = function (s, g) {
    const tg = g.main.target;
    if (!tg || !S.Sim.isOutside(s)) return null;
    if (S.Sim.inCave(s)) return tg.cx !== undefined ? tg : { cx: S.DATA.explore.cave.ladderM };
    return tg.m !== undefined ? tg : null;
  };
  /** Geriye uyumluluk: yüzey hedefinin metresi (yoksa null) */
  HUD.goalTargetM = function (s, g) {
    const tg = HUD.goalTarget(s, g);
    return tg && tg.m !== undefined ? tg.m : null;
  };

  /** RIT-02 — Tek satır hedef + mesafe. Ana hedef değişince 'goal:changed' yayınlanır (oyuncu testi günlüğü + kısa vurgu) */
  HUD.updateGoal = function (s) {
    const card = ref('goal');
    if (!card) return;
    const g = S.Objectives.compute(s);
    card.hidden = !g;
    if (!g) {
      ref('goalhint').hidden = true;
      return;
    }
    const p = g.progress;
    const target = HUD.goalTarget(s, g);
    HUD.target = target;
    HUD.targetM = target && target.m !== undefined ? target.m : null;
    // Yalnızca aktif hedefin yönü ve mesafesi (D-012 minimalist navigasyon)
    const d = !target ? 0 : Math.round(target.cx !== undefined ? target.cx - s.player.cx : target.m - s.player.x);
    const distTxt = target && Math.abs(d) >= 3 ? (d > 0 ? '→ ' : '← ') + Math.abs(d) + ' m' : '';
    const mainTxt = S.util.escape(t('goal.short.' + g.main.id, g.main.vars));
    const hint = S.util.escape(t(g.main.hintKey, g.main.vars));
    const optTxt = g.optional ? S.util.escape(t(g.optional.key, g.optional.vars)) : '';
    const progTxt = S.util.escape(t('goal.progress', { f: p.forensicsSent, fr: p.full.forensicsSent, e: p.experimentsSent, er: p.full.experimentsSent, fuel: p.fuel }));
    const sig = [mainTxt, distTxt, hint, optTxt, progTxt, S.lang].join('\u0001');
    if (sig === HUD._goalHtml) return;
    HUD._goalHtml = sig;
    ref('goaltxt').innerHTML = mainTxt;
    ref('goaldist').textContent = distTxt;
    ref('goalhint').innerHTML =
      '<b>' + S.util.escape(t(g.main.key, g.main.vars)) + '</b><p>' + hint + '</p>' +
      (optTxt ? '<p class="hz-opt"><span>' + t('goal.label_opt') + '</span> ' + optTxt + '</p>' : '') +
      '<p class="hz-prog">' + progTxt + '</p>';
    card.classList.toggle('danger', ['return', 'return_cold', 'return_night'].includes(g.main.id));
    if (HUD.goalId !== g.main.id) {
      S.bus.emit('goal:changed', { from: HUD.goalId || null, to: g.main.id, sol: s.sol });
      HUD.goalId = g.main.id;
      ref('goalhint').hidden = true;
      card.classList.remove('pulse');
      void card.offsetWidth;
      card.classList.add('pulse');
    }
  };

  /** Sera durumu (sağlıklı / çimlenme bonusu / güçsüz / donmuş) — Adım 3.2; habitat paneli kullanır */
  HUD.greenhouseStatus = function (s) {
    const gh = s.greenhouse;
    if (!gh.installed) return null;
    if (gh.frozen) return { tone: 'danger', text: t('hud.gh_frozen') + ' · SOL ' + gh.frozenSol };
    const load = s.loads.find((l) => l.id === 'greenhouse');
    if (load && (load.shed || !load.on)) return { tone: 'warn', text: t('hud.gh_unpowered') };
    if (gh.yieldPct > 100) return { tone: 'ok', text: t('hud.gh_boost', { pct: gh.yieldPct }) };
    return { tone: 'ok', text: t('hud.gh_ok', { pct: gh.yieldPct }) };
  };

  HUD.updateAlerts = function (s, amb) {
    const list = [];
    const ponr = S.Sim.ponr(s);
    // Plan §6: kritik kaynak için tek öncelikli uyarı — en fazla 2 bant, önce en acil olan
    if (ponr.beyond) list.push(['danger', 'alert', t('hud.alert_ponr_beyond'), 'ponr_beyond']);
    else if (ponr.critical) list.push(['danger', 'alert', t('hud.alert_ponr'), 'ponr']);
    if (s.suit.frozen && HUD.mode === 'surface') list.push(['cold', 'temp', t('hud.alert_frozen'), 'frozen']);
    const heat = HUD.mode === 'surface' && S.Sim.isOutside(s) ? S.Sim.suitThermal(s, amb).state : null;
    if (heat === 'cooling') list.push(['cold', 'battery', t('hud.alert_suit_cooling'), 'suit_cooling']);
    if (s.suit.leak) list.push(['danger', 'suit', t('hud.alert_leak'), 'leak']);
    if (heat === 'low') list.push(['warn', 'battery', t('hud.alert_suit_battery_low'), 'suit_battery_low']);
    if (s.weather.stormTau > 0) list.push(['warn', 'alert', t('hud.alert_storm', { tau: s.weather.stormTau, sols: s.weather.stormSolsLeft }), 'storm']);
    for (const w of s.weather.warnings || []) {
      if (w.sol === s.sol + 1 || (w.sol === s.sol && S.Sim.clockMinute(s) < w.minute)) {
        list.push(['info', 'sat', t('warn.' + w.id, { inst: t('inst.' + w.instrument + '.short'), sol: w.sol }), 'warn_' + w.id]);
      }
    }
    // RIT-07: uyarı aleti olmasa da görülebilen ön işaret (ör. ufukta toz duvarı) kısa süre önceden
    for (const u of S.Events.upcoming(s, S.DATA.gameplay.threatPreSignalMinutes)) {
      const hasInstrument = u.def && u.def.warnInstrument && S.Sim.has(s, u.def.warnInstrument);
      if (u.def && u.def.preSignalKey && !hasInstrument) list.push(['warn', 'alert', t(u.def.preSignalKey), 'pre_' + u.ev.id]);
    }
    if (S.Sim.horizons(s).conjunction) list.push(['warn', 'signal', t('hud.alert_conjunction'), 'conjunction']);
    if (s.loads.some((l) => l.shed)) list.push(['warn', 'power', t('hud.alert_shed'), 'shed']);
    if (s.sol >= s.maxSols) list.push(['info', 'rocket', t('hud.alert_final_sol'), 'final_sol']);
    const shown = list.slice(0, 2);
    const html = shown
      .map(([tone, ico, txt]) => '<div class="alert ' + tone + '">' + UI().icon(ico) + '<span>' + txt + '</span></div>')
      .join('');
    if (html !== HUD._alertsHtml) {
      ref('alerts').innerHTML = html;
      HUD._alertsHtml = html;
      // Bildirimler (toast) uyarı bantlarının altından başlasın: üst üste binmesinler (styles: --hud-alerts-h)
      UI().hudLayer().parentElement.style.setProperty('--hud-alerts-h', ref('alerts').offsetHeight + 'px');
      const ids = new Set(shown.map((a) => a[3]));
      for (const id of ids) if (!HUD._alertIds || !HUD._alertIds.has(id)) S.bus.emit('warning:shown', { id, sol: s.sol });
      HUD._alertIds = ids;
    }
  };

  /** Alt çizgi (10 Hz): O₂'nin izin verdiği dönüş menzili ve hedef. Oyuncu noktası her karede HUD.syncWorld'de */
  HUD.updateMinimap = function (s, ponr) {
    const map = S.DATA.terrain.map;
    const eva = S.DATA.constants.eva;
    const v = eva.speedMPerMin * (s.suit.frozen ? eva.frozenSpeedFactor : 1);
    const rate = eva.suitO2PctPerMin * (s.suit.leak ? eva.suitLeakO2Multiplier : 1) * eva.pointOfNoReturnSafetyFactor;
    const reach = Math.max(0, (s.suit.o2 / rate) * v);
    // Dönüş menzili habitatın iki yanına uzanır (sol buz rotası / sağ enkaz rotası)
    const r = ref('mmreach');
    const l = HUD.trackPct(Math.max(map.leftLimitM, -reach));
    r.style.left = l + '%';
    r.style.width = HUD.trackPct(Math.min(map.eastEndM, reach)) - l + '%';
    r.title = t('hud.mm_legend', { reach: Math.round(reach), dist: ponr.distanceM });
    ref('mmhome').style.left = HUD.trackPct(0) + '%';
    ref('mmtube').style.left = HUD.trackPct(map.tubeMouthM) + '%';
    const tg = ref('mmtgt');
    const tgM = HUD.target ? (HUD.target.m !== undefined ? HUD.target.m : map.tubeMouthM) : null;
    tg.hidden = tgM === null;
    if (tgM !== null) tg.style.left = HUD.trackPct(tgM) + '%';
    ref('mmme').classList.toggle('beyond', ponr.beyond);
  };

  /* ---------------- Etkileşim balonu ---------------- */
  HUD.promptText = function (s, it) {
    const X = S.Explore;
    if (it.kind === 'ice_cluster') return t('prompt.ice.' + X.iceStep(s, it.id));
    if (it.kind === 'tube') return t('prompt.descend');
    // Kazı: gerçek ve sahte tümsek aynı yazıyı gösterir (ayırt eden yalnızca elbise tarayıcısı / RIMFAX)
    if (it.kind === 'dig') {
      const st = X.site(it.id);
      const hits = X.siteHits(s, st);
      return t(st.kind === 'rubble' ? 'prompt.dig_rubble' : hits ? 'prompt.dig_more' : 'prompt.dig.' + st.kind, { n: hits, total: st.hits });
    }
    // Kişi 5: maden noktası (yüzey: kaz, tünel: matkapla del); vuruş sayısı balonda
    if (it.kind === 'mineral') {
      const st = X.mineralSite(it.id);
      const hits = X.mineralHits(s, st);
      if (!X.hasTool(s, st.tool)) return t('mineral.need_' + st.tool);
      return t(hits ? 'prompt.dig_more' : st.tool ? 'prompt.mineral_drill' : 'prompt.mineral', { n: hits, total: st.hits });
    }
    if (it.kind === 'scout') {
      const shot = s.explore.cave.scout[it.id];
      return t(shot !== null && shot !== undefined ? 'prompt.scout_done' : 'prompt.scout', { what: t('scout.' + it.id + '.name') });
    }
    if (it.kind === 'part') return t('prompt.pick_part', { what: t('salvage.part.' + it.partId) });
    if (it.action === 'ascend') return t('prompt.ascend');
    if (it.action === 'relay') {
      const rep = s.explore.reports.cave_survey;
      if (s.explore.cave.temp.entrance === null) return t('prompt.relay_temp');
      if (rep.queued || rep.sent) return t('prompt.relay_done');
      const p = X.caveProgress(s);
      return t('prompt.relay', { n: p.done, total: p.total });
    }
    if (it.kind === 'cave_find') return t(s.explore.cave.finds[it.id] ? 'prompt.cave_done' : 'prompt.cave_find', { what: t('cave.find.' + it.id) });
    if (it.kind === 'cave_study') return t(X.studyDone(s, it.id) ? 'prompt.cave_result' : 'prompt.cave_study', { what: t('cave.study.' + it.id) });
    if (it.kind === 'wreck') {
      const c = S.Forensics.get(it.id);
      return t(s.forensics[it.id].queued ? 'prompt.wreck_done' : 'prompt.wreck', { name: c.name });
    }
    if (it.action === 'clean_panels') return t('prompt.solar', { pct: Math.round(s.res.panelDust * 100) });
    if (it.action === 'sabatier') return t('prompt.isru', { fuel: Math.round(s.res.mavFuel) });
    if (it.action === 'mav') return t(S.Sim.canLaunchMav(s) ? 'prompt.mav_launch' : 'prompt.mav', { fuel: Math.round(s.res.mavFuel) });
    if (it.action === 'greenhouse') return t(s.greenhouse.installed ? (s.greenhouse.frozen ? 'prompt.greenhouse_frozen' : 'prompt.greenhouse') : 'prompt.greenhouse_empty');
    return t('prompt.' + it.action);
  };

  HUD.updatePrompt = function (s) {
    const el = ref('prompt');
    if (!el) return;
    const it = S.Lander && S.Lander.active ? null : S.Surface.nearest(s);
    HUD.prompt = it;
    if (!it) {
      el.hidden = true;
      HUD.syncWorld(s);
      return;
    }
    // Kişi 5: ilk maden noktasında bir kez ipucu (tarayıcı neden öttü, ne yapılır)
    if (it.kind === 'mineral' && s.explore && !s.explore.mineralHint) {
      s.explore.mineralHint = true;
      S.UI.toast(S.UI.icon('target') + t('mineral.hint'), 'info', 7000);
    }
    const wasHidden = el.hidden;
    el.hidden = false;
    const html = '<kbd>E</kbd><span>' + S.util.escape(HUD.promptText(s, it)) + '</span>';
    if (el._html !== html) {
      el.innerHTML = html;
      el._html = html;
      el._w = 0;
    }
    el.classList.toggle('wreck', it.kind === 'wreck');
    // Genişlik yalnızca içerik/görünürlük değişince ölçülür (her karede layout okuması yapılmasın); konum HUD.syncWorld'de
    if (!el._w || wasHidden) el._w = el.offsetWidth;
    HUD.syncWorld(s);
  };

  S.HUD = HUD;
})((window.SOL14 = window.SOL14 || {}));
