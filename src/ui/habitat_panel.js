/**
 * SOL 14: RED HORIZON — Habitat Kontrol Paneli (mockup 05) + eylem önizleme kartları (K3)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const HP = { selected: 'refill_suit', lastHtml: '' };

  const CARDS = [
    { id: 'refill_suit', icon: 'tank', station: 'locker' },
    { id: 'charge_suit', icon: 'battery', station: 'charger' },
    { id: 'repair_suit', icon: 'wrench', station: 'workbench' },
    { id: 'sleep', icon: 'bed', station: 'bunk' },
    { id: 'lab', icon: 'flask', station: 'lab' },
    { id: 'comms', icon: 'signal', station: 'comms' },
    { id: 'power', icon: 'power', station: 'power' },
    { id: 'log', icon: 'log', station: null }
  ];
  const PANEL_ACTIONS = { lab: 'lab', comms: 'downlink', power: 'power', log: 'log' };

  HP.stationToAction = (stationId) => {
    const c = CARDS.find((x) => x.station === stationId);
    return c ? c.id : null;
  };

  /** Önizleme verisi (mockup: SÜRE, değer değişimi, kaynak notu, zaman uyarısı) */
  HP.preview = function (s, id) {
    if (PANEL_ACTIONS[id]) {
      return { title: t('action.' + id), lines: ['<p class="pv-desc">' + t('action.' + id + '.desc') + '</p>'], button: t('action.open'), can: null };
    }
    if (id === 'sleep') {
      const target = S.DATA.gameplay.solStartMinute + S.DATA.constants.sol.minutes;
      const mins = Math.max(0, target - s.minute);
      return {
        title: t('action.sleep'),
        lines: [
          row('clock', t('pv.duration'), S.util.duration(mins)),
          row('calendar', 'SOL', s.sol + ' → ' + (s.sol >= s.maxSols ? t('pv.mav_launch') : s.sol + 1)),
          row('morale', t('pv.morale'), '+' + S.DATA.gameplay.actions.sleepMorale),
          '<p class="pv-note">' + I('alert') + t(s.sol >= s.maxSols ? 'pv.sleep_final' : 'pv.sleep_note') + '</p>'
        ],
        button: t('action.start'),
        can: null
      };
    }
    const act = S.Sim.actions[id];
    if (!act) return null;
    const p = act.preview(s);
    const unit = { refill_suit: '%', charge_suit: '%', repair_suit: '%', tend_greenhouse: '', clean_panels: '%', sabatier: '%', dig_ice: ' L' }[id] || '';
    const label = { refill_suit: 'O₂', charge_suit: t('pv.suit_battery'), repair_suit: t('pv.integrity'), tend_greenhouse: t('pv.morale'), clean_panels: t('pv.dust'), sabatier: t('pv.mav_fuel'), dig_ice: t('pv.water') }[id];
    return {
      title: t('action.' + id),
      lines: [
        row('clock', t('pv.duration'), S.util.duration(act.minutes(s))),
        row(id === 'refill_suit' ? 'o2' : 'target', label, (unit === '%' ? '%' : '') + p.from + ' → ' + (unit === '%' ? '%' : '') + p.to + (unit === ' L' ? ' L' : '')),
        '<p class="pv-cost">' + I('tank') + t(p.costKey, p.costVars) + '</p>',
        '<p class="pv-note">' + I('alert') + t('pv.time_note') + '</p>'
      ],
      button: t('action.start'),
      can: act.can(s)
    };
  };

  function row(icon, label, value) {
    return '<div class="pv-row">' + I(icon) + '<span>' + label + '</span><b>' + value + '</b></div>';
  }

  function statusRow(icon, label, pct, tone, valText) {
    return (
      '<div class="st-row">' + I(icon) + '<div class="st-main"><div class="st-head"><span>' + label + '</span><b>' + (valText || '%' + Math.round(pct)) + '</b></div>' +
      S.UI.bar(pct, tone) + '</div></div>'
    );
  }

  /* ---------------- Habitat alt paneli ---------------- */
  HP.render = function (s) {
    const host = document.getElementById('habitat-panel');
    if (!host) return;
    const near = S.Surface.nearestStation();
    if (near && HP.lastStation !== near.id) {
      HP.lastStation = near.id;
      const a = HP.stationToAction(near.id);
      if (a) HP.selected = a;
    }
    const pv = HP.preview(s, HP.selected) || { title: '', lines: [], button: '', can: null };
    const gh = S.HUD.greenhouseStatus(s);
    const html =
      '<section class="panel hp-status"><h4>' + t('hp.status') + '</h4>' +
      statusRow('o2', 'O₂', s.suit.o2, 'cyan') +
      statusRow('battery', t('hp.suit_battery'), s.suit.battery, 'amber') +
      statusRow('suit', t('hp.suit'), s.suit.integrity, s.suit.leak ? 'red' : 'cyan') +
      statusRow('morale', t('hp.morale'), s.res.morale, 'cyan') +
      '<div class="hp-res"><span>' + I('tank') + s.res.o2ReserveKg.toFixed(1) + ' kg O₂</span><span>' + I('power') + s.res.energyKwh.toFixed(1) + ' kWh</span><span>💧 ' + Math.round(s.res.waterL) + ' L</span>' +
      (gh ? '<span class="hp-gh ' + gh.tone + '" title="' + S.util.escape(t('hp.greenhouse') + ': ' + gh.text) + '">' + I('leaf') + (s.greenhouse.frozen ? '✗' : '%' + s.greenhouse.yieldPct) + '</span>' : '') +
      '</div></section>' +
      '<section class="panel hp-actions">' +
      CARDS.map(
        (c) =>
          '<button class="act-card' + (HP.selected === c.id ? ' sel' : '') + (near && near.id === c.station ? ' near' : '') + '" data-act="' + c.id + '">' +
          '<span class="act-ico">' + I(c.icon) + '</span><span class="act-name">' + t('action.' + c.id) + '</span></button>'
      ).join('') +
      '</section>' +
      '<section class="panel hp-preview"><h4>' + t('hp.preview') + '</h4>' +
      '<div class="pv-title">' + I(CARDS.find((c) => c.id === HP.selected).icon) + '<span>' + pv.title + '</span></div>' +
      pv.lines.join('') +
      (pv.can ? '<p class="pv-err">' + I('x') + t(pv.can) + '</p>' : '') +
      '<button class="btn btn-primary btn-block" data-run ' + (pv.can ? 'disabled' : '') + '>' + pv.button + '</button></section>' +
      '<button class="btn btn-exit" data-exit>' + I('arrowL') + t('hp.exit') + '</button>';
    if (html === HP.lastHtml) return;
    HP.lastHtml = html;
    host.innerHTML = html;
    host.querySelectorAll('[data-act]').forEach((b) =>
      b.addEventListener('click', () => {
        HP.selected = b.dataset.act;
        HP.lastHtml = '';
        S.bus.emit('audio:play', 'click');
        HP.render(S.getState());
      })
    );
    host.querySelector('[data-run]').addEventListener('click', () => HP.run(HP.selected));
    host.querySelector('[data-exit]').addEventListener('click', () => S.Game.exitHabitat());
  };

  HP.run = function (id) {
    const s = S.getState();
    S.bus.emit('audio:play', 'click');
    if (PANEL_ACTIONS[id]) {
      S.Game.openPanel(PANEL_ACTIONS[id]);
      return;
    }
    if (id === 'sleep') {
      S.Game.sleep();
      return;
    }
    const res = S.Sim.doAction(s, id);
    if (!res.ok) S.UI.toast(t(res.errKey), 'warn');
    else S.UI.toast(I('check') + t('action.done.' + id), 'ok');
    HP.lastHtml = '';
    S.Game.afterAction();
  };

  HP.show = function () {
    let host = document.getElementById('habitat-panel');
    if (!host) {
      host = document.createElement('div');
      host.id = 'habitat-panel';
      host.className = 'habitat-panel';
      S.UI.hudLayer().appendChild(host);
    }
    HP.lastHtml = '';
    HP.lastStation = null;
    HP.render(S.getState());
  };

  /* ---------------- Dış etkileşim önizleme modali ---------------- */
  HP.openActionModal = function (id, extraHtml = '') {
    const s = S.getState();
    const draw = () => {
      const pv = HP.preview(s, id);
      return (
        '<div class="panel action-modal"><div class="modal-head"><h3>' + I('target') + pv.title + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
        extraHtml +
        pv.lines.join('') +
        (pv.can ? '<p class="pv-err">' + I('x') + t(pv.can) + '</p>' : '') +
        '<div class="modal-actions"><button class="btn btn-ghost" data-close>' + t('ui.cancel') + '</button>' +
        '<button class="btn btn-primary" data-run ' + (pv.can ? 'disabled' : '') + '>' + pv.button + '</button></div></div>'
      );
    };
    S.UI.openModal('action', draw(), {
      onMount: (box) => {
        const btn = box.querySelector('[data-run]');
        if (btn)
          btn.addEventListener('click', () => {
            S.UI.closeModal('action', true);
            S.Surface.body.actionT = 0.8;
            const before = { dust: s.res.panelDust, water: s.res.waterL };
            const res = S.Sim.doAction(s, id);
            if (!res.ok) S.UI.toast(t(res.errKey), 'warn');
            else {
              S.UI.toast(I('check') + t('action.done.' + id), 'ok');
              HP.worldFeedback(s, id, before);
            }
            S.Game.afterAction();
          });
      }
    });
  };

  /**
   * RIT-04 — Dünyada görünen sonuç: eylemin değiştirdiği sistem değeri oyuncunun üstünde yükselen yazı olarak
   * gösterilir (yalnızca puan değil, panel üretimi / yakıt / su gibi gerçek değişim).
   */
  HP.worldFeedback = function (s, id, before) {
    let text = null;
    if (id === 'clean_panels') {
      const cosZ = S.Sim.site(s).cosZNoon;
      const gain = S.Engineering.calcSolarPower({ cosZ, dustFactor: 0 }) - S.Engineering.calcSolarPower({ cosZ, dustFactor: before.dust });
      text = t('fb.clean_panels', { w: Math.round(gain) });
    } else if (id === 'sabatier') text = t('fb.sabatier', { fuel: Math.round(s.res.mavFuel) });
    else if (id === 'dig_ice') text = t('fb.dig_ice', { l: Math.round(s.res.waterL - before.water) });
    else if (id === 'tend_greenhouse') text = t('fb.tend_greenhouse', { pct: s.greenhouse.yieldPct });
    if (text) S.bus.emit('fx:float', { text, px: S.Surface.body.px, tone: 'ok' });
  };

  HP.openGreenhouse = function () {
    const s = S.getState();
    const gh = s.greenhouse;
    let info;
    if (!gh.installed) info = '<p class="pv-desc">' + t('gh.not_installed') + '</p>';
    else if (gh.frozen) info = '<div class="alert danger">' + I('temp') + '<span>' + t('gh.frozen_info', { sol: gh.frozenSol, cause: t('gh.cause_' + gh.cause) }) + '</span></div>';
    else info = '<div class="pv-row">' + I('leaf') + '<span>' + t('gh.yield') + '</span><b>%' + gh.yieldPct + '</b></div>' + (gh.yieldPct > 100 ? '<p class="pv-note ok">' + I('check') + t('gh.boosted') + '</p>' : '');
    HP.openActionModal('tend_greenhouse', info);
  };

  HP.openMav = function () {
    const s = S.getState();
    const final = S.Sim.canLaunchMav(s);
    const fuel = Math.round(s.res.mavFuel);
    const isru = S.Sim.hasIsru(s); // MOXIE yoksa ISRU ünitesi yok: yakıt üretilemez
    const html =
      '<div class="panel action-modal"><div class="modal-head"><h3>' + I('rocket') + t('mav.title') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="pv-row">' + I('rocket') + '<span>' + t('pv.mav_fuel') + '</span><b>%' + fuel + '</b></div>' +
      S.UI.bar(fuel, fuel >= 100 ? 'cyan' : 'amber') +
      '<p class="pv-desc">' + t(final ? (fuel >= 100 ? 'mav.ready' : 'mav.lowfuel') : isru ? 'mav.not_yet' : 'mav.not_yet_no_isru', { sol: s.maxSols }) + '</p>' +
      S.UI.checklistHtml(s) +
      '<p class="pv-cost">' + I('flask') + (isru ? t('mav.sabatier_hint') : t('mav.no_isru_hint', { fuel })) + '</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-close>' + t('ui.close') + '</button>' +
      (final ? '<button class="btn btn-primary" data-launch>' + I('rocket') + t('mav.launch') + '</button>' : '') +
      '</div></div>';
    S.UI.openModal('mav', html, {
      onMount: (box) => {
        const b = box.querySelector('[data-launch]');
        if (b)
          b.addEventListener('click', () => {
            S.UI.closeModal('mav', true);
            S.Game.launchMav();
          });
      }
    });
  };

  S.HabitatPanel = HP;
})((window.SOL14 = window.SOL14 || {}));
