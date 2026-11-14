/**
 * SOL 14: RED HORIZON — Ana Menü, Sol 0 Görev Tasarım Konsolu (5 ekran + M8 SPOF), Duraklatma, Kayıp (K3)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const DS = { step: 1 };

  /* ================================================================ */
  /* ANA MENÜ                                                           */
  /* ================================================================ */
  DS.showMenu = function (h) {
    const html =
      '<div class="screen menu" style="--bg:url(\'' + S.Sprites.screen('cover_thumbnail') + '\')"><div class="menu-dim"></div>' +
      '<div class="menu-box"><div class="menu-logo">' + S.UI.brand() + '</div>' +
      '<p class="menu-tag">' + t('menu.tagline') + '</p>' +
      '<div class="menu-btns">' +
      (S.hasSave() ? '<button class="btn btn-primary btn-lg" data-m="continue">' + I('play') + t('menu.continue') + '</button>' : '') +
      '<button class="btn ' + (S.hasSave() ? 'btn-ghost' : 'btn-primary') + ' btn-lg" data-m="new">' + I('rocket') + t('menu.new') + '</button>' +
      '<button class="btn btn-ghost btn-lg" data-m="demo">' + I('clock') + t('menu.demo') + '</button>' +
      '<div class="menu-row"><button class="btn btn-ghost" data-m="lang">' + I('globe') + t('menu.lang') + '</button>' +
      '<button class="btn btn-ghost" data-m="sound">' + I(S.Audio.isMuted() ? 'mute' : 'sound') + t(S.Audio.isMuted() ? 'menu.sound_off' : 'menu.sound_on') + '</button>' +
      '<button class="btn btn-ghost" data-m="help">' + I('doc') + t('menu.help') + '</button></div></div>' +
      '<p class="menu-foot">' + t('menu.footer') + '</p></div>' +
      '<p class="lt-fiction">' + t('lt.fiction') + '</p></div>';
    const root = S.UI.showScreen(html, 'scene-menu');
    S.UI.bindClicks(root, {
      '[data-m="continue"]': () => h.continueGame(),
      '[data-m="new"]': () => h.newGame(false),
      '[data-m="demo"]': () => h.newGame(true),
      '[data-m="lang"]': () => h.toggleLang(),
      '[data-m="sound"]': () => {
        S.Audio.toggleMute();
        DS.showMenu(h);
      },
      '[data-m="help"]': () => DS.openHelp()
    });
  };

  DS.openHelp = function () {
    const keys = [
      ['A / D · ← →', 'help.move'],
      ['W · Space · ↑', 'help.jump'],
      ['E', 'help.interact'],
      ['L', 'help.downlink'],
      ['P', 'help.power'],
      ['J', 'help.log'],
      ['Esc', 'help.pause']
    ];
    const html =
      '<div class="panel action-modal help-modal"><div class="modal-head"><h3>' + I('doc') + t('menu.help') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="help-keys">' + keys.map(([k, d]) => '<div><kbd>' + k + '</kbd><span>' + t(d) + '</span></div>').join('') + '</div>' +
      '<div class="help-loop">' + ['help.loop1', 'help.loop2', 'help.loop3'].map((k, i) => '<div><b>' + (i + 1) + '</b><span>' + t(k) + '</span></div>').join('') + '</div>' +
      '<p class="pv-desc">' + t('help.ponr') + '</p>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-close>' + t('ui.close') + '</button></div></div>';
    S.UI.openModal('help', html, {});
  };

  /* ================================================================ */
  /* SOL 0 TASARIM KONSOLU                                              */
  /* ================================================================ */
  function card(field, value, selected, title, body, extra = '') {
    return (
      '<button class="d-card' + (selected ? ' sel' : '') + '" data-f="' + field + '" data-v="' + value + '">' +
      '<span class="d-radio"></span><b>' + title + '</b>' + (body ? '<p>' + body + '</p>' : '') + extra + '</button>'
    );
  }

  function budgetBar(icon, label, valueText, pct, tone, sub) {
    return (
      '<div class="budget ' + tone + '"><div class="b-head">' + I(icon) + '<span>' + label + '</span><b>' + valueText + '</b></div>' +
      S.UI.bar(pct, tone === 'over' ? 'red' : tone === 'warn' ? 'amber' : 'cyan') + '<small>' + sub + '</small></div>'
    );
  }

  DS.stepHtml = function (d, tot) {
    const D = S.DATA;
    if (DS.step === 1) {
      return (
        '<h3>' + t('design.s1') + '</h3><p class="d-help">' + t('design.s1_help') + '</p><div class="d-cards">' +
        D.objectives.map((o) =>
          card('objectiveFocus', o.id, d.objectiveFocus === o.id, t('obj.' + o.id + '.name'), t('obj.' + o.id + '.desc'),
            '<div class="d-crit"><span>' + t('design.min_success', { f: o.minSuccess.forensicsSent, e: o.minSuccess.experimentsSent }) + '</span><span>' + t('design.full_success', { f: o.fullSuccess.forensicsSent, e: o.fullSuccess.experimentsSent }) + '</span></div>')
        ).join('') + '</div>'
      );
    }
    if (DS.step === 2) {
      return (
        '<h3>' + t('design.s2') + '</h3><p class="d-help">' + t('design.s2_help') + '</p>' +
        '<h4>' + t('design.rocket') + '</h4><div class="d-cards c3">' +
        D.rockets.map((r) => card('rocketId', r.id, d.rocketId === r.id, r.name, t('design.rocket_spec', { kg: r.payloadMarsKg, m: r.costM }))).join('') +
        '</div><h4>' + t('design.orbit') + '</h4><div class="d-cards c2">' +
        D.orbits.map((o) => card('orbitType', o.id, d.orbitType === o.id, t('orbit.' + o.id + '.name'),
          t('design.orbit_spec', { days: o.transitDays, dose: Math.round(o.transitDays * D.constants.radiation.transitDailyMsv), kg: o.payloadPenaltyKg, m: o.costPenaltyM }))).join('') +
        '</div><h4>' + t('design.window') + '</h4><div class="d-cards c2">' +
        card('launchWindowCaught', 'true', d.launchWindowCaught, t('window.caught'), t('window.caught_desc', { months: D.constants.synodicPeriod.months })) +
        card('launchWindowCaught', 'false', !d.launchWindowCaught, t('window.missed'), t('window.missed_desc', { m: D.constants.synodicPeriod.missedWindowCostM })) +
        '</div>'
      );
    }
    if (DS.step === 3) {
      return (
        '<h3>' + t('design.s3') + '</h3><p class="d-help">' + t('design.s3_help') + '</p>' +
        '<h4>' + t('design.site') + '</h4><div class="d-cards c3">' +
        D.landingSites.map((x) => card('landingSiteId', x.id, d.landingSiteId === x.id, t('site.' + x.id + '.name'),
          t('site.' + x.id + '.desc'), '<div class="d-spec">' + x.coords + ' · ' + x.dayMaxC + '/' + x.nightMinC + ' °C · cosZ ' + x.cosZNoon + '</div>')).join('') +
        '</div><h4>' + t('design.power') + '</h4><div class="d-cards c2">' +
        ['solar_only', 'solar_rtg'].map((p) => card('powerSource', p, d.powerSource === p, t('pwr.' + p + '.name'), t('pwr.' + p + '.desc'))).join('') +
        '</div><div class="d-split"><div><h4>' + t('design.battery') + '</h4><div class="d-cards c3">' +
        D.habitat.batteries.map((b) => card('batteryKwh', b.kwh, d.batteryKwh === b.kwh, b.kwh + ' kWh', b.massKg + ' kg · $' + b.costM + 'M')).join('') +
        '</div></div><div><h4>' + t('design.insulation') + '</h4><div class="d-cards c2">' +
        ['thin', 'thick'].map((k) => card('insulation', k, d.insulation === k, t('ins.' + k + '.name'), t('ins.' + k + '.desc', { ua: D.habitat.insulation[k].uaWPerK }))).join('') +
        '</div></div></div>'
      );
    }
    if (DS.step === 4) {
      return (
        '<h3>' + t('design.s4', { n: d.instruments.length }) + '</h3><p class="d-help">' + t('design.s4_help') + '</p><div class="inst-grid">' +
        D.instruments.map((inst) => {
          const on = d.instruments.includes(inst.id);
          return (
            '<button class="inst' + (on ? ' sel' : '') + '" data-inst="' + inst.id + '"><span class="d-check">' + (on ? I('check') : '') + '</span>' +
            '<b>' + t('inst.' + inst.id + '.name') + '</b><span class="inst-spec">' + inst.massKg + ' kg · ' + inst.powerW + ' W · ' + inst.dataMbit + ' Mbit · $' + inst.costM + 'M</span>' +
            '<p>' + t('inst.' + inst.id + '.desc') + '</p><p class="inst-miss">' + I('alert') + t('inst.' + inst.id + '.missing') + '</p></button>'
          );
        }).join('') + '</div>'
      );
    }
    return (
      '<h3>' + t('design.s5') + '</h3><p class="d-help">' + t('design.s5_help') + '</p>' +
      '<h4>' + t('design.comms') + '</h4><div class="d-cards c2">' +
      ['relay_only', 'relay_xband'].map((c) => {
        const cap = D.habitat.relayPasses.filter((p) => !p.requires || p.requires === c).reduce((a, p) => a + p.capacityMbit, 0);
        return card('commArchitecture', c, d.commArchitecture === c, t('comm.' + c + '.name'), t('comm.' + c + '.desc', { mbit: cap }));
      }).join('') +
      '</div><h4>' + t('design.kits') + '</h4><div class="d-cards c3">' +
      [0, 1, 2].map((k) => card('repairKits', k, d.repairKits === k, t('design.kit_n', { n: k }), '+' + k * D.habitat.repairKit.massKg + ' kg · $' + k * D.habitat.repairKit.costM + 'M')).join('') +
      '</div><div class="d-summary">' + I('doc') + t('design.summary', { margin: tot.massMarginPct, dose: tot.transitDoseMsv, days: tot.transitDays }) + '</div>'
    );
  };

  DS.showDesign = function (h) {
    const s = S.getState();
    const d = s.design;
    const tot = S.Engineering.calcDesignTotals(d);
    const moneyPct = (tot.moneyUsed / tot.moneyMax) * 100;
    const massPct = (tot.massUsed / tot.massMax) * 100;
    const nightPct = (tot.nightNeedKwh / d.batteryKwh) * 100;
    const steps = [1, 2, 3, 4, 5]
      .map((n) => '<button class="d-step' + (DS.step === n ? ' sel' : '') + (n < DS.step ? ' done' : '') + '" data-step="' + n + '"><b>' + String(n).padStart(2, '0') + '</b><span>' + t('design.tab' + n) + '</span></button>')
      .join('');
    const spof = tot.spof.length
      ? '<ul class="spof-list">' + tot.spof.map((k) => '<li>' + I('alert') + '<span>' + t(k) + '</span></li>').join('') + '</ul>'
      : '<p class="spof-ok">' + I('check') + t('design.spof_ok') + '</p>';
    const errs = tot.errors.map((k) => '<li>' + I('x') + '<span>' + t(k) + '</span></li>').join('');

    const html =
      '<div class="screen design" style="--bg:url(\'' + S.Sprites.screen('scr_launch') + '\')"><div class="design-dim"></div>' +
      S.UI.header('<span class="bp-num">00</span><span>' + t('design.section') + '</span>', '<span class="status-pill"><span>' + I('calendar') + '<b>SOL 0</b></span><i></i><span>' + I('target') + '<b>' + (s.demoMode ? t('design.mode_demo') : t('design.mode_full')) + '</b></span></span>') +
      '<div class="budgets">' +
      budgetBar('target', t('budget.money'), '$' + tot.moneyUsed + 'M / $' + tot.moneyMax + 'M', moneyPct, tot.moneyUsed > tot.moneyMax ? 'over' : moneyPct > 92 ? 'warn' : 'ok', t('budget.money_sub')) +
      budgetBar('weight', t('budget.mass'), tot.massUsed + ' / ' + tot.massMax + ' kg', massPct, tot.massUsed > tot.massMax ? 'over' : tot.massMarginPct < 10 ? 'warn' : 'ok', t('budget.margin', { pct: tot.massMarginPct })) +
      budgetBar('power', t('budget.power'), tot.nightNeedKwh + ' / ' + d.batteryKwh + ' kWh', nightPct, tot.batteryNightSafe ? 'ok' : 'over', t('budget.power_sub', { w: Math.round(tot.solarNoonW), rtg: tot.rtgW })) +
      budgetBar('signal', t('budget.data'), tot.dataPerSolMbit + ' Mbit/sol', (tot.dataPerSolMbit / 80) * 100, tot.dataPerSolMbit < 60 ? 'warn' : 'ok', t('budget.data_sub')) +
      '</div>' +
      '<div class="design-main"><nav class="d-steps">' + steps + '</nav>' +
      '<section class="panel d-content">' + DS.stepHtml(d, tot) + '</section>' +
      '<aside class="panel d-side"><h4>' + I('alert') + t('design.spof_title') + '</h4>' + spof +
      (errs ? '<ul class="err-list">' + errs + '</ul>' : '') +
      '<div class="d-actions">' +
      (DS.step > 1 ? '<button class="btn btn-ghost" data-nav="-1">' + I('arrowL') + t('ui.back') + '</button>' : '<button class="btn btn-ghost" data-menu>' + I('home') + t('ui.menu') + '</button>') +
      (DS.step < 5 ? '<button class="btn btn-primary" data-nav="1">' + t('ui.next') + I('arrowR') + '</button>' : '') +
      '</div><button class="btn btn-launch btn-lg btn-block" data-launch ' + (tot.canLaunch ? '' : 'disabled') + '>' + I('rocket') + t('design.launch') + '</button>' +
      '<button class="btn btn-ghost btn-block btn-sm" data-preset>' + t('design.preset') + '</button></aside></div></div>';

    const root = S.UI.showScreen(html, 'scene-design');
    const rerender = () => DS.showDesign(h);
    root.querySelectorAll('[data-f]').forEach((b) =>
      b.addEventListener('click', () => {
        const f = b.dataset.f;
        let v = b.dataset.v;
        if (f === 'batteryKwh' || f === 'repairKits') v = Number(v);
        if (f === 'launchWindowCaught') v = v === 'true';
        s.design[f] = v;
        S.bus.emit('audio:play', 'click');
        rerender();
      })
    );
    root.querySelectorAll('[data-inst]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.dataset.inst;
        const list = s.design.instruments;
        if (list.includes(id)) s.design.instruments = list.filter((x) => x !== id);
        else if (list.length < 5) s.design.instruments = list.concat(id);
        else S.UI.toast(t('design.err_too_many'), 'warn');
        S.bus.emit('audio:play', 'click');
        rerender();
      })
    );
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { DS.step = Number(b.dataset.step); S.bus.emit('audio:play', 'click'); rerender(); }));
    root.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => { DS.step = Math.max(1, Math.min(5, DS.step + Number(b.dataset.nav))); S.bus.emit('audio:play', 'click'); rerender(); }));
    const menuBtn = root.querySelector('[data-menu]');
    if (menuBtn) menuBtn.addEventListener('click', () => h.menu());
    root.querySelector('[data-preset]').addEventListener('click', () => {
      s.design = S.util.deepClone(S.State.DEFAULT_DESIGN);
      S.bus.emit('audio:play', 'click');
      rerender();
    });
    root.querySelector('[data-launch]').addEventListener('click', () => h.launch());
  };

  /* ================================================================ */
  /* DURAKLATMA / KAYIP                                                 */
  /* ================================================================ */
  DS.openPause = function (h) {
    const html =
      '<div class="panel action-modal pause-modal"><div class="modal-head"><h3>' + I('pause') + t('pause.title') + '</h3></div>' +
      '<div class="pause-btns">' +
      '<button class="btn btn-primary btn-lg" data-close>' + I('play') + t('pause.resume') + '</button>' +
      '<button class="btn btn-ghost" data-p="help">' + I('doc') + t('menu.help') + '</button>' +
      '<button class="btn btn-ghost" data-p="lang">' + I('globe') + t('menu.lang') + '</button>' +
      '<button class="btn btn-ghost" data-p="sound">' + I(S.Audio.isMuted() ? 'mute' : 'sound') + t(S.Audio.isMuted() ? 'menu.sound_off' : 'menu.sound_on') + '</button>' +
      '<button class="btn btn-ghost" data-p="menu">' + I('home') + t('pause.to_menu') + '</button></div>' +
      (S.getState() && S.getState().sol >= 1 ? S.UI.checklistHtml(S.getState()) : '') +
      '<p class="pv-note">' + I('check') + t('pause.saved') + '</p></div>';
    S.saveGame(); // RIT-10: menü açılınca ilerleme hemen kaydedilir; oyuncu buradan güvenle çıkabilir
    S.UI.openModal('pause', html, {
      onMount: (box) => {
        S.UI.bindClicks(box, {
          '[data-p="help"]': () => DS.openHelp(),
          '[data-p="lang"]': () => { h.toggleLang(); S.UI.closeModal('pause', true); DS.openPause(h); },
          '[data-p="sound"]': () => { S.Audio.toggleMute(); S.UI.closeModal('pause', true); DS.openPause(h); },
          '[data-p="menu"]': () => { S.UI.closeAll(); h.menu(); }
        });
      }
    });
  };

  DS.showGameOver = function (h) {
    const s = S.getState();
    const go = s.gameOver;
    // Plan §6: başarısızlıkta son güvenli kayıttan dönüş + neden açıklaması (gameover.*.desc)
    const cp = S.checkpointInfo();
    const html =
      '<div class="screen gameover" style="--bg:url(\'' + S.Sprites.screen('bg_jezero_night') + '\')"><div class="menu-dim"></div>' +
      '<div class="go-box panel"><div class="cc-head">' + I('alert') + '<h3>' + t('gameover.title') + '</h3></div>' +
      '<h2>' + t('gameover.' + go.reason) + '</h2><p>' + t('gameover.' + go.reason + '.desc') + '</p>' +
      '<div class="pv-row">' + I('calendar') + '<span>SOL</span><b>' + go.sol + ' · ' + go.time + '</b></div>' +
      (cp
        ? '<p class="pv-note">' + I('alert') + t('gameover.retry_note', { sol: cp.sol }) + '</p>' +
          '<button class="btn btn-primary btn-lg btn-block" data-retry>' + I('play') + t('gameover.retry', { sol: cp.sol }) + '</button>'
        : '') +
      '<button class="btn ' + (cp ? 'btn-ghost' : 'btn-primary') + ' btn-lg btn-block" data-report>' + t('lt.to_report') + '</button></div></div>';
    const root = S.UI.showScreen(html, 'scene-gameover');
    root.querySelector('[data-report]').addEventListener('click', () => h.report());
    const retry = root.querySelector('[data-retry]');
    if (retry) retry.addEventListener('click', () => h.retry());
  };

  S.DesignScreens = DS;
})((window.SOL14 = window.SOL14 || {}));
