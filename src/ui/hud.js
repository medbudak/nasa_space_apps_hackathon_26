/**
 * SOL 14: RED HORIZON — Yüzey HUD'u (K3)
 * Üst bar, yaşamsal değerler, M4 Dönüşsüzlük Noktası çentiği (eklem donunca sıçrama), mini harita
 * (dönüş menzili), uyarı bantları, [E] etkileşim balonu, hızlı erişim ve dokunmatik kontroller.
 */
(function (S) {
  'use strict';
  const UI = () => S.UI;
  const t = (k, v) => S.t(k, v);
  const HUD = { refs: {}, mode: null, lastFrozen: false, lastNotch: 0, prompt: null };
  /** [E] balonunun üst kenarı, 640×360 tasarım alanında (zemin y=300'ün 174 px üstü; 16:9'da sahnenin %35'i) */
  const PROMPT_BASE_Y = 126;

  function ref(name) {
    return HUD.refs[name];
  }

  HUD.build = function (mode) {
    HUD.mode = mode;
    const layer = UI().hudLayer();
    const I = UI().icon;
    layer.hidden = false;
    layer.className = 'hud-layer mode-' + mode;
    layer.innerHTML =
      UI().header(
        '<span class="loc-ico">' + I(mode === 'habitat' ? 'home' : 'walk') + '</span><span data-ref="loc"></span>',
        '<div class="status-pill">' +
          '<span>' + I('calendar') + '<b data-ref="sol"></b></span><i></i>' +
          '<span>' + I('clock') + '<b data-ref="clock"></b></span><i></i>' +
          '<span>' + I('temp') + '<b data-ref="temp"></b></span></div>'
      ) +
      '<div class="hud-alerts" data-ref="alerts"></div>' +
      // RIT-02: tek ana hedef + en fazla bir isteğe bağlı hedef; RIT-12: istenirse ipucu
      '<section class="panel goal-card" data-ref="goal" hidden>' +
      '<div class="goal-main"><span class="goal-tag">' + I('target') + t('goal.label_main') + '</span>' +
      '<button class="goal-hint-btn" data-ref="hintbtn" title="' + t('goal.hint_btn') + '">?</button></div>' +
      '<b class="goal-text" data-ref="goaltxt"></b>' +
      '<p class="goal-hint" data-ref="goalhint" hidden></p>' +
      '<div class="goal-opt" data-ref="goalopt"></div>' +
      '<div class="goal-prog" data-ref="goalprog"></div></section>' +
      (mode === 'surface'
        ? '<section class="panel vitals">' +
          '<div class="vital"><div class="vital-head">' + I('o2') + '<span>' + t('hud.suit_o2') + '</span><b data-ref="o2"></b></div>' +
          '<div class="bar cyan ponr-bar"><div class="bar-fill" data-ref="o2fill"></div>' +
          '<div class="ponr-ghost" data-ref="ghost"></div><div class="ponr-jump" data-ref="jump"><span data-ref="jumplbl"></span></div>' +
          '<div class="ponr-notch" data-ref="notch"></div></div>' +
          '<div class="vital-sub" data-ref="ponrtxt"></div></div>' +
          '<div class="vital"><div class="vital-head">' + I('battery') + '<span>' + t('hud.suit_battery') + '</span><b data-ref="sbat"></b></div>' +
          '<div class="bar amber"><div class="bar-fill" data-ref="sbatfill"></div></div></div>' +
          '<div class="vital"><div class="vital-head">' + I('suit') + '<span>' + t('hud.suit_temp') + '</span><b data-ref="stemp"></b></div>' +
          '<div class="vital-sub" data-ref="heat"></div>' +
          '<div class="vital-sub" data-ref="speed"></div></div>' +
          '<div class="vital"><div class="vital-head">' + I('power') + '<span>' + t('hud.hab_battery') + '</span><b data-ref="hbat"></b></div>' +
          '<div class="bar amber"><div class="bar-fill" data-ref="hbatfill"></div></div></div>' +
          '<div class="vital vital-gh" data-ref="ghrow" hidden><div class="vital-head">' + I('leaf') + '<span>' + t('hud.greenhouse') + '</span></div>' +
          '<div class="vital-sub" data-ref="gh"></div></div>' +
          '</section>' +
          '<div class="minimap"><div class="mm-track" data-ref="mm"></div><div class="mm-legend" data-ref="mmleg"></div></div>' +
          '<div class="world-prompt" data-ref="prompt" hidden></div>'
        : '') +
      '<nav class="quickbar">' +
      '<button class="qb" data-q="downlink" title="L">' + I('signal') + '<span>' + t('hud.q_downlink') + '</span><kbd>L</kbd></button>' +
      '<button class="qb" data-q="power" title="P">' + I('power') + '<span>' + t('hud.q_power') + '</span><kbd>P</kbd></button>' +
      '<button class="qb" data-q="log" title="J">' + I('log') + '<span>' + t('hud.q_log') + '</span><kbd>J</kbd></button>' +
      '<button class="qb" data-q="pause" title="Esc">' + I('pause') + '<span>' + t('hud.q_menu') + '</span><kbd>Esc</kbd></button>' +
      '</nav>' +
      '<div class="touch-controls">' +
      '<button class="tc" data-tc="left">' + I('arrowL') + '</button><button class="tc" data-tc="right">' + I('arrowR') + '</button>' +
      '<button class="tc tc-act" data-tc="act">E</button>' +
      (mode === 'surface' ? '<button class="tc tc-act" data-tc="jump">' + I('up') + '</button>' : '') +
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
    ref('hintbtn').addEventListener('click', () => {
      const h = ref('goalhint');
      h.hidden = !h.hidden;
      S.bus.emit('audio:play', 'click');
      if (!h.hidden) S.bus.emit('goal:hint', { id: HUD.goalId });
    });
    HUD.lastFrozen = false;
    HUD._goalHtml = null;
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
    ref('loc').textContent = HUD.mode === 'habitat' ? t('hud.loc_habitat') : t('hud.loc_surface', { site: t('site.' + site.id + '.short') });
    ref('sol').textContent = 'SOL ' + s.sol + ' / ' + s.maxSols;
    ref('clock').textContent = S.util.clock(S.Sim.clockMinute(s));
    ref('temp').textContent = (HUD.mode === 'habitat' ? Math.round(s.res.habTempC) : Math.round(amb)) + ' °C';
    HUD.updateAlerts(s, amb);
    HUD.updateGoal(s);
    if (HUD.mode !== 'surface') return;

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
    ref('ponrtxt').innerHTML = S.Sim.isOutside(s)
      ? t(ponr.beyond ? 'hud.ponr_beyond' : 'hud.ponr_line', { pct: ponr.requiredO2, m: ponr.distanceM, speed: ponr.speedPct })
      : '';
    ref('ponrtxt').classList.toggle('danger', ponr.critical);

    const heat = HUD.suitHeat(s, amb);
    ref('sbat').textContent = Math.round(suit.battery) + '%';
    ref('sbatfill').style.width = suit.battery + '%';
    ref('sbatfill').parentElement.classList.toggle('critical', heat.state !== 'heater');
    ref('stemp').textContent = Math.round(suit.tempC) + ' °C';
    ref('stemp').classList.toggle('danger', suit.frozen || suit.battery <= 0);
    const heatHtml = '<span class="' + heat.tone + '">' + S.util.escape(heat.text) + '</span>';
    if (ref('heat')._html !== heatHtml) {
      ref('heat').innerHTML = heatHtml;
      ref('heat')._html = heatHtml;
    }
    ref('speed').innerHTML = suit.frozen
      ? '<span class="danger">' + t('hud.joints_frozen', { pct: ponr.speedPct }) + '</span>'
      : S.Surface.inSandPit(s.player.x)
        ? S.Surface.sandPitAvoided(s)
          ? t('hud.sand_pit_routed')
          : '<span class="warn">' + t('hud.sand_pit') + '</span>'
        : t('hud.speed_normal');
    ref('hbat').textContent = s.res.energyKwh.toFixed(1) + ' / ' + s.res.batteryKwh + ' kWh';
    ref('hbatfill').style.width = (s.res.energyKwh / s.res.batteryKwh) * 100 + '%';
    HUD.updateGreenhouse(s);

    HUD.updateMinimap(s, ponr);
    HUD.updatePrompt(s);
  };

  /** Oyun dakikası → "3 sa 20 dk" / "45 dk" (geri sayım tahminleri; aşağı yuvarlanır) */
  HUD.duration = function (minutes) {
    const total = Math.max(0, Math.floor(minutes));
    if (total < 60) return t('hud.dur_m', { m: total });
    return t('hud.dur_hm', { h: Math.floor(total / 60), m: total % 60 });
  };

  /**
   * Elbise sıcaklığı satırı: sıcaklığın NEDENİNİ gösterir (ısıtıcı bataryadan çalışıyor / batarya azalıyor /
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

  /** RIT-02 — Hedef kartı. Ana hedef değişince 'goal:changed' yayınlanır (oyuncu testi günlüğü + kısa vurgu) */
  HUD.updateGoal = function (s) {
    const card = ref('goal');
    if (!card) return;
    const g = S.Objectives.compute(s);
    card.hidden = !g;
    if (!g) return;
    const p = g.progress;
    const mainTxt = S.util.escape(t(g.main.key, g.main.vars));
    const optTxt = g.optional ? S.util.escape(t(g.optional.key, g.optional.vars)) : '';
    const progTxt = t('goal.progress', { f: p.forensicsSent, fr: p.full.forensicsSent, e: p.experimentsSent, er: p.full.experimentsSent, fuel: p.fuel });
    const sig = [mainTxt, optTxt, progTxt, S.lang].join('\u0001');
    if (sig === HUD._goalHtml) return;
    HUD._goalHtml = sig;
    ref('goaltxt').innerHTML = mainTxt;
    ref('goalopt').innerHTML = optTxt ? '<span class="goal-tag opt">' + t('goal.label_opt') + '</span>' + optTxt : '';
    ref('goalprog').textContent = progTxt;
    ref('goalhint').textContent = t(g.main.hintKey, g.main.vars);
    if (HUD.goalId !== g.main.id) {
      S.bus.emit('goal:changed', { from: HUD.goalId || null, to: g.main.id, sol: s.sol });
      HUD.goalId = g.main.id;
      ref('goalhint').hidden = true;
      card.classList.remove('pulse');
      void card.offsetWidth;
      card.classList.add('pulse');
    }
  };

  /** Sera durumu (sağlıklı / çimlenme bonusu / güçsüz / donmuş) — Adım 3.2 */
  HUD.greenhouseStatus = function (s) {
    const gh = s.greenhouse;
    if (!gh.installed) return null;
    if (gh.frozen) return { tone: 'danger', text: t('hud.gh_frozen') + ' · SOL ' + gh.frozenSol };
    const load = s.loads.find((l) => l.id === 'greenhouse');
    if (load && (load.shed || !load.on)) return { tone: 'warn', text: t('hud.gh_unpowered') };
    if (gh.yieldPct > 100) return { tone: 'ok', text: t('hud.gh_boost', { pct: gh.yieldPct }) };
    return { tone: 'ok', text: t('hud.gh_ok', { pct: gh.yieldPct }) };
  };

  HUD.updateGreenhouse = function (s) {
    const row = ref('ghrow');
    if (!row) return;
    const st = HUD.greenhouseStatus(s);
    row.hidden = !st;
    if (!st) return;
    const html = '<span class="' + st.tone + '">' + S.util.escape(st.text) + '</span>';
    if (ref('gh')._html !== html) {
      ref('gh').innerHTML = html;
      ref('gh')._html = html;
    }
  };

  HUD.updateAlerts = function (s, amb) {
    const list = [];
    const ponr = S.Sim.ponr(s);
    // Plan §6: kritik kaynak için tek öncelikli uyarı — en fazla 3 bant, önce en acil olan
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
    const shown = list.slice(0, 3);
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

  /** Mini harita: üs, enkazlar, buz, oyuncu ve O2'nin izin verdiği dönüş menzili */
  HUD.updateMinimap = function (s, ponr) {
    const maxM = S.DATA.gameplay.maxEvaRangeM;
    const minM = -140;
    const pos = (m) => ((m - minM) / (maxM - minM)) * 100;
    const eva = S.DATA.constants.eva;
    const v = eva.speedMPerMin * (s.suit.frozen ? eva.frozenSpeedFactor : 1);
    const rate = eva.suitO2PctPerMin * (s.suit.leak ? eva.suitLeakO2Multiplier : 1) * eva.pointOfNoReturnSafetyFactor;
    const reach = Math.max(0, Math.min(maxM, (s.suit.o2 / rate) * v));
    let h = '<div class="mm-reach" style="left:' + pos(0) + '%;width:' + (pos(reach) - pos(0)) + '%"></div>';
    h += '<div class="mm-base" style="left:' + pos(minM) + '%;width:' + (pos(0) - pos(minM)) + '%"></div>';
    for (const c of S.Forensics.cases()) {
      const rec = s.forensics[c.id];
      const known = S.Forensics.identified(s, c);
      h += '<div class="mm-mark ' + (rec.queued ? 'done' : known ? 'wreck' : 'unknown') + '" style="left:' + pos(c.distanceM) + '%" title="' + (known ? S.util.escape(c.name) : '?') + '">' + (known ? '' : '?') + '</div>';
    }
    if (S.Sim.has(s, 'rimfax')) h += '<div class="mm-mark ice" style="left:' + pos(S.DATA.terrain.iceDepositM) + '%"></div>';
    h += '<div class="mm-player' + (ponr.beyond ? ' beyond' : '') + '" style="left:' + pos(s.player.x) + '%"></div>';
    ref('mm').innerHTML = h;
    ref('mmleg').innerHTML = t('hud.mm_legend', { reach: Math.round(reach), dist: ponr.distanceM });
  };

  /* ---------------- Etkileşim balonu ---------------- */
  HUD.promptText = function (s, it) {
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
    const it = S.Surface.nearest(s, S.Surface.body.px);
    HUD.prompt = it;
    if (!it) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const html = '<kbd>E</kbd><span>' + S.util.escape(HUD.promptText(s, it)) + '</span>';
    if (el._html !== html) {
      el.innerHTML = html;
      el._html = html;
    }
    el.classList.toggle('wreck', it.kind === 'wreck');
    // Tuval pencere oranına göre genişler/uzar: konum tuval → sahne yüzdesi olarak çevrilir, balon nesnenin üstünde kalır.
    // Yatayda pencere kenarına ve aynı yükseklikteki yan panellere (yaşamsallar / hedef kartı) taşmayacak şekilde sınırlanır.
    const pos = S.FX.toStagePct(S.FX.worldToScreen(it.px), PROMPT_BASE_Y);
    el.style.top = pos.top + '%';
    const stageW = el.offsetParent ? el.offsetParent.clientWidth : 0;
    const half = el.offsetWidth / 2;
    const gap = 8;
    let minX = half + gap;
    let maxX = stageW - half - gap;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    const overlapsY = (p) => p && !p.hidden && p.offsetTop < bottom && p.offsetTop + p.offsetHeight > top;
    const vit = el.parentElement.querySelector('.vitals');
    const goalCard = ref('goal');
    if (overlapsY(vit)) minX = Math.max(minX, vit.offsetLeft + vit.offsetWidth + gap + half);
    if (overlapsY(goalCard)) maxX = Math.min(maxX, goalCard.offsetLeft - gap - half);
    const x = (pos.left / 100) * stageW;
    el.style.left = (minX <= maxX ? Math.max(minX, Math.min(maxX, x)) : (minX + maxX) / 2) + 'px';
  };

  S.HUD = HUD;
})((window.SOL14 = window.SOL14 || {}));
