/**
 * SOL 14: RED HORIZON — Mekik içi kontrol paneli (K3; düzen Medine'nin prototipinden)
 * Solda durum, ortada odadaki sırayla istasyon şeridi (önünde durduğun istasyon seçilir), sağda seçili istasyonun önizlemesi.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const HP = { selected: 'refill_suit', selStation: null, lastHtml: '' };

  // İstasyon → eylem (hava kilidi çıkış)
  const STATION_ACTION = { locker: 'refill_suit', charger: 'charge_suit', workbench: 'repair_suit', bunk: 'sleep', lab: 'lab', comms: 'comms', power: 'power', workshop: 'workshop', airlock: 'exit' };
  const PANEL_ACTIONS = { lab: 'lab', comms: 'downlink', power: 'power', log: 'log', workshop: 'workshop', inventory: 'inventory' };
  const STATION_ICON = { comms: 'signal', power: 'power', charger: 'battery', locker: 'tank', lab: 'flask', workshop: 'wrench', workbench: 'suit', bunk: 'bed', airlock: 'arrowL' };

  HP.stationToAction = (stationId) => STATION_ACTION[stationId] || null;

  // İhtiyaç eşiği aşılınca uyarı (sarı) / kritik (kırmızı) bildirimi (EVA'da da)
  S.bus.on('needs:warn', (e) => S.UI.toast(t('needs.' + e.level + '_' + e.id), e.level === 'crit' ? 'danger' : 'warn'));

  /** Önizleme verisi (mockup: SÜRE, değer değişimi, kaynak notu, zaman uyarısı) */
  HP.preview = function (s, id) {
    if (id === 'exit') {
      return { title: t('station.airlock'), lines: ['<p class="pv-desc">' + t('hp.exit_desc') + '</p>'], button: t('hp.exit'), can: null };
    }
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
    const unit = { refill_suit: '%', charge_suit: '%', repair_suit: '%', tend_greenhouse: '', harvest_greenhouse: '', clean_panels: '%', sabatier: '%', dig_ice: ' L' }[id] || '';
    const label = { refill_suit: 'O₂', charge_suit: t('pv.suit_battery'), repair_suit: t('pv.integrity'), tend_greenhouse: t('pv.morale'), harvest_greenhouse: t('pv.morale'), clean_panels: t('pv.dust'), sabatier: t('pv.mav_fuel'), dig_ice: t('pv.water') }[id];
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

  function statusRow(icon, label, pct, color, valText) {
    return (
      '<div class="hp-row">' + I(icon) + '<span>' + label + '</span><b>' + (valText || '%' + Math.round(pct)) + '</b>' +
      '<div class="hp-bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%;background:' + color + '"></i></div></div>'
    );
  }
  const levelColor = (v) => (v < 25 ? 'var(--red)' : v < 50 ? 'var(--amber)' : 'var(--green)');

  /* ---------------- İhtiyaç düğmeleri (Kişi 2): Yemek ye / Su iç / Uyu / Tuvalet ---------------- */
  const NEED_BTNS = [
    { id: 'eat', icon: '🍽' },
    { id: 'drink', icon: '💧' },
    { id: 'sleep', icon: null },
    { id: 'toilet', icon: '🚻' }
  ];
  HP.needsHtml = function (s) {
    const btn = (b) => {
      if (b.id === 'sleep') {
        return '<button type="button" class="hp-need" data-need="sleep">' + I('bed') + '<b>' + t('needs.sleep') + '</b><small>' +
          t('needs.cost_sleep', { from: Math.round(S.Sim.needs(s).fatigue) }) + '</small></button>';
      }
      const act = S.Sim.actions[b.id];
      const p = act.preview(s);
      const err = act.can(s);
      return '<button type="button" class="hp-need" data-need="' + b.id + '"' + (err ? ' disabled title="' + S.util.escape(t(err)) + '"' : '') + '>' +
        '<span class="ico">' + b.icon + '</span><b>' + t('needs.' + b.id) + '</b><small>' + t(p.costKey, p.costVars) + '</small></button>';
    };
    return '<section class="panel hp-needs"><h4>' + t('needs.title') + '</h4><div class="hp-need-row">' + NEED_BTNS.map(btn).join('') + '</div>' +
      '<p class="hp-trade">💧 ' + t('needs.trade_note', { l: S.DATA.constants.sabatier.waterL, d: S.Sim.drinkL() }) + '</p></section>';
  };

  /* ---------------- Mekik içi alt paneli ---------------- */
  HP.render = function (s) {
    const host = document.getElementById('habitat-panel');
    if (!host) return;
    const stations = S.Surface.INTERIOR.stations;
    const near = S.Surface.nearestStation();
    if (near && HP.lastStation !== near.id) HP.selStation = near.id; // önüne gelinen istasyon seçilir
    HP.lastStation = near ? near.id : null;
    if (!HP.selStation) HP.selStation = 'locker';
    const sel = HP.selStation;
    HP.selected = HP.stationToAction(sel);
    const pv = HP.preview(s, HP.selected);
    const gh = S.HUD.greenhouseStatus(s);
    const here = near ? t('hp.here', { name: t('station.' + near.id) }) : t('hp.go_station');
    const html =
      '<section class="panel hp-status"><h4>' + t('hp.status') + '</h4>' +
      statusRow('o2', t('hp.suit_o2'), s.suit.o2, levelColor(s.suit.o2)) +
      statusRow('battery', t('hp.suit_battery'), s.suit.battery, levelColor(s.suit.battery)) +
      statusRow('suit', t('hp.suit'), s.suit.integrity, s.suit.leak ? 'var(--red)' : 'var(--cyan)') +
      statusRow('morale', t('hp.morale'), s.res.morale, 'var(--cyan)') +
      '<div class="hp-res"><span>' + I('tank') + s.res.o2ReserveKg.toFixed(1) + ' kg O₂</span><span>' + I('power') + s.res.energyKwh.toFixed(1) + ' kWh</span><span>💧 ' + Math.round(s.res.waterL) + ' L</span>' +
      (gh ? '<span class="hp-gh ' + gh.tone + '" title="' + S.util.escape(t('hp.greenhouse') + ': ' + gh.text) + '">' + I('leaf') + (s.greenhouse.frozen ? '✗' : '%' + s.greenhouse.yieldPct) + '</span>' : '') +
      '</div></section>' +
      '<section class="panel hp-stations"><h4>' + t('hp.stations') + '</h4><div class="hp-strip" style="--n:' + stations.length + '">' +
      stations
        .map(
          (st) =>
            '<button type="button" class="hp-st' + (sel === st.id ? ' sel' : '') + (near && near.id === st.id ? ' near' : '') + '" data-st="' + st.id + '">' +
            I(STATION_ICON[st.id] || 'target') + '<span>' + t('station.' + st.id) + '</span></button>'
        )
        .join('') +
      '</div><p class="hp-hint"><span>' + here + '</span>' +
      '<button type="button" data-panel="inventory">' + I('doc') + t('action.inventory') + ' <kbd>I</kbd></button>' +
      '<button type="button" data-panel="log">' + I('log') + t('action.log') + ' <kbd>J</kbd></button></p></section>' +
      '<section class="panel hp-preview"><div class="pv-title">' + I(STATION_ICON[sel] || 'target') + '<span>' + pv.title + '</span></div>' +
      pv.lines.join('') +
      (pv.can ? '<p class="pv-err">' + I('x') + t(pv.can) + '</p>' : '') +
      '<button type="button" class="hp-go" data-run ' + (pv.can ? 'disabled' : '') + '>' + pv.button + (near && near.id === sel ? ' <kbd>E</kbd>' : '') + '</button></section>' +
      HP.needsHtml(s);
    if (html === HP.lastHtml) return;
    HP.lastHtml = html;
    host.innerHTML = html;
    host.querySelectorAll('[data-st]').forEach((b) =>
      b.addEventListener('click', () => {
        HP.selStation = b.dataset.st;
        HP.lastHtml = '';
        S.bus.emit('audio:play', 'click');
        HP.render(S.getState());
      })
    );
    host.querySelectorAll('[data-panel]').forEach((b) => b.addEventListener('click', () => HP.run(b.dataset.panel)));
    host.querySelector('[data-run]').addEventListener('click', () => HP.run(HP.selected));
    host.querySelectorAll('[data-need]').forEach((b) => b.addEventListener('click', () => HP.run(b.dataset.need)));
  };

  HP.run = function (id) {
    const s = S.getState();
    S.bus.emit('audio:play', 'click');
    if (id === 'exit') {
      S.Game.exitHabitat();
      return;
    }
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
    else if (id === 'harvest_greenhouse') text = t('fb.harvest', { kg: s.res.foodKg });
    if (text) S.bus.emit('fx:float', { text, px: S.Surface.body.px, tone: 'ok' });
  };

  /**
   * Sera paneli (Kişi 6): bitkinin evresi (görsel + 4 adımlı şerit), sonraki evreye ne kaldığı, bugünkü bakım durumu;
   * olgunsa "Hasat et", değilse "Seraya bak". Sıkıştırılmış süre ve bilimsel not her zaman görünür.
   */
  // Evre görseli: genel evre sınıfı (yer tutucu) + bitkiye özel sınıf (Kişi 7'nin görseli buna bağlanır)
  const art = (plant, stage) => '<span class="gh-art gh-art-' + stage + ' gh-art-' + plant + '-' + stage + '"></span>';
  HP.greenhouseInfo = function (s) {
    const gh = s.greenhouse;
    if (!gh.installed) return '<p class="pv-desc">' + t('gh.not_installed') + '</p>';
    if (gh.frozen) return '<div class="alert danger">' + I('temp') + '<span>' + t('gh.frozen_info', { sol: gh.frozenSol, cause: t('gh.cause_' + gh.cause) }) + '</span></div>';
    const plant = S.Sim.ghPlant(s);
    const stages = S.Sim.ghPlantCfg(s).stages;
    const st = S.Sim.ghStage(s);
    // Tohum evresinde ekilecek bitki seçilir (marul / turp / zinya); büyümeye başlayınca değişmez
    const picker = S.Sim.ghCanChoose(s)
      ? '<div class="gh-plants" role="radiogroup">' +
        Object.keys(S.DATA.habitat.greenhouse.growth.plants)
          .map((id) => {
            const last = S.DATA.habitat.greenhouse.growth.plants[id].stages.slice(-1)[0];
            return '<button type="button" role="radio" aria-checked="' + (id === plant) + '" class="gh-plant' + (id === plant ? ' sel' : '') + '" data-plant="' + id + '">' +
              art(id, last) + '<b>' + t('plant.' + id) + '</b><small>' + t('plant.' + id + '.desc') + '</small></button>';
          })
          .join('') + '</div>'
      : '<p class="pv-row">' + I('leaf') + '<span>' + t('gh.plant') + '</span><b>' + t('plant.' + plant) + '</b></p>';
    const strip = stages
      .map((k, i) => '<span class="gh-step' + (i < st ? ' done' : i === st ? ' now' : '') + '">' + art(plant, k) + '<small>' + t('gh.stage.' + k) + '</small></span>')
      .join('');
    let next;
    if (S.Sim.ghMature(s)) next = '<p class="pv-note ok">' + I('check') + t('gh.ready.' + plant) + '</p>';
    else if (gh.tendedSol === s.sol) next = '<p class="pv-note ok">' + I('check') + t('gh.tended_today', { sols: S.Sim.ghSolsLeft(s) - 1 }) + '</p>';
    else next = '<p class="pv-note">' + I('alert') + t('gh.needs_tending', { sols: S.Sim.ghSolsLeft(s) }) + '</p>';
    return (
      picker +
      '<div class="gh-stages">' + strip + '</div>' +
      next +
      '<div class="pv-row">' + I('leaf') + '<span>' + t('gh.yield') + '</span><b>%' + gh.yieldPct + '</b></div>' +
      (gh.yieldPct > 100 ? '<p class="pv-note ok">' + I('check') + t('gh.boosted') + '</p>' : '') +
      '<p class="pv-desc gh-sci">' + t('gh.science') + '</p>'
    );
  };

  HP.openGreenhouse = function () {
    const s = S.getState();
    const ripe = s.greenhouse.installed && !s.greenhouse.frozen && S.Sim.ghMature(s);
    HP.openActionModal(ripe ? 'harvest_greenhouse' : 'tend_greenhouse', HP.greenhouseInfo(s));
    // bitki seçimi: seç, paneli yeniden aç (evre şeridi ve hasat bilgisi yeni bitkiye göre)
    document.querySelectorAll('.action-modal [data-plant]').forEach((b) =>
      b.addEventListener('click', () => {
        if (!S.Sim.choosePlant(s, b.dataset.plant)) return;
        S.bus.emit('audio:play', 'click');
        S.UI.closeModal('action', true);
        HP.openGreenhouse();
      })
    );
  };

  /** D-015: hasarlı parçalar; her biri için gerekli / sende olan, alet, enerji ve EVA süresi */
  function repairHtml(s) {
    const R = S.Rocket;
    if (!R.isDamaged(s)) return '<p class="pv-note ok">' + I('check') + t('rocket.all_ok') + '</p>';
    return (
      '<h5 class="rk-head">' + I('alert') + t('rocket.damaged_title') + '</h5><p class="pv-note">' + I('doc') + t('rocket.how') + '</p>' +
      R.damaged(s)
        .map((id) => {
          const p = R.part(id);
          const c = R.check(s, id);
          // eksik satırın altında nereden bulunacağı yazar
          const have = (ok, label, val, fromKey) => '<li class="' + (ok ? 'ok' : 'miss') + '">' + I(ok ? 'check' : 'x') + '<span>' + label + (ok || !fromKey ? '' : '<small class="rk-from">' + t(fromKey) + '</small>') + '</span><b>' + val + '</b></li>';
          const rows =
            Object.entries(p.needs).map(([item, n]) => have(S.Workshop.count(s, item) >= n, t('item.' + item + '.name'), S.Workshop.count(s, item) + ' / ' + n, 'item.' + item + '.from')).join('') +
            have(S.Workshop.hasTool(s, p.tool), t('rocket.tool'), t('tool.' + p.tool + '.name'), 'tool.' + p.tool + '.from') +
            have(s.res.energyKwh >= p.energyKwh, t('rocket.energy'), p.energyKwh + ' kWh');
          return (
            '<div class="rk-part"><b>' + t('rocket.part.' + id) + '</b><small>' + t('rocket.src.' + R.state(s).damage[id]) + '</small>' +
            '<ul class="ws-mats">' + rows + '</ul>' +
            (c.ok ? '' : '<p class="pv-err">' + I('x') + t(c.errKey, c.vars) + '</p>') +
            '<button class="btn btn-primary btn-sm" data-repair="' + id + '" ' + (c.ok ? '' : 'disabled') + '>' + I('wrench') + t('rocket.repair', { min: p.evaMinutes }) + '</button></div>'
          );
        })
        .join('')
    );
  }

  async function runRepair(id) {
    const s = S.getState();
    S.UI.closeModal('mav', true);
    const mg = await S.runMinigame(S.Rocket.part(id).minigame, {});
    const r = S.Rocket.repair(s, id, mg.success);
    if (!r.ok) S.UI.toast(I('alert') + t(r.errKey, r.vars), 'warn');
    else S.UI.toast(r.repaired ? I('check') + t('rocket.repaired') : I('alert') + t('rocket.failed'), r.repaired ? 'ok' : 'warn', 4000);
    S.Game.afterAction();
  }

  HP.openMav = function () {
    const s = S.getState();
    const final = S.Sim.canLaunchMav(s) && !S.Rocket.isDamaged(s);
    const fuel = Math.round(s.res.mavFuel);
    const isru = S.Sim.hasIsru(s); // MOXIE yoksa ISRU ünitesi yok: yakıt üretilemez
    const html =
      '<div class="panel action-modal"><div class="modal-head"><h3>' + I('rocket') + t('mav.title') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="pv-row">' + I('rocket') + '<span>' + t('pv.mav_fuel') + '</span><b>%' + fuel + '</b></div>' +
      S.UI.bar(fuel, fuel >= 100 ? 'cyan' : 'amber') +
      '<p class="pv-desc">' + t(final ? (fuel >= 100 ? 'mav.ready' : 'mav.lowfuel') : isru ? 'mav.not_yet' : 'mav.not_yet_no_isru', { sol: s.maxSols }) + '</p>' +
      S.UI.checklistHtml(s) +
      repairHtml(s) +
      '<p class="pv-cost">' + I('flask') + (isru ? t('mav.sabatier_hint') : t('mav.no_isru_hint', { fuel })) + '</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-close>' + t('ui.close') + '</button>' +
      (final ? '<button class="btn btn-primary" data-launch>' + I('rocket') + t('mav.launch') + '</button>' : '') +
      '</div></div>';
    S.UI.openModal('mav', html, {
      onMount: (box) => {
        box.querySelectorAll('[data-repair]').forEach((btn) => btn.addEventListener('click', () => runRepair(btn.dataset.repair)));
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
