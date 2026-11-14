/**
 * SOL 14: RED HORIZON — M3 Güç Yük Önceliklendirme (mockup 06 "06 / GÜÇ YÖNETİMİ") (K3)
 * Güç yetmediğinde alttaki yükler otomatik kesilir; ilk iki sıra batarya rezervini kullanabilir.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const PP = {};
  const ICON = { life_support: 'o2', heating: 'temp', comms: 'signal', greenhouse: 'leaf', experiments: 'flask', moxie: 'tank' };

  PP.html = function (s) {
    const amb = S.Sim.ambient(s);
    const p = s.power;
    const prod = p.solarW + p.rtgW;
    const rows = s.loads
      .map((l, i) => {
        const demand = S.Sim.loadDemandW(s, l.id, amb);
        let st;
        const disabled = l.id === 'moxie' && s.disabledLoads.moxie !== undefined && s.disabledLoads.moxie >= s.sol;
        const notInstalled = (l.id === 'moxie' && !S.Sim.has(s, 'moxie')) || (l.id === 'greenhouse' && (!s.greenhouse.installed || s.greenhouse.frozen));
        if (notInstalled) st = '<span class="st-chip off">' + t(l.id === 'greenhouse' && s.greenhouse.frozen ? 'pw.frozen' : 'pw.not_installed') + '</span>';
        else if (disabled) st = '<span class="st-chip wait">' + t('pw.standby') + '</span>';
        else if (!l.on) st = '<span class="st-chip off">' + t('pw.off') + '</span>';
        else if (l.shed) st = '<span class="st-chip shed">' + t('pw.shed') + '</span>';
        else st = '<span class="st-chip on">' + t('pw.on') + '</span>';
        return (
          '<div class="pw-row' + (l.shed ? ' shed' : '') + (l.protected ? ' prot' : '') + '"><span class="q-grip">' + I('grip') + '</span>' +
          '<span class="pw-rank">' + (i + 1) + '</span><span class="pw-ico">' + I(ICON[l.id]) + '</span>' +
          '<span class="pw-name">' + t('load.' + l.id) + (l.protected ? '<small>' + t('pw.protected') + '</small>' : '') + '</span>' +
          '<span class="pw-w">' + demand + ' W</span>' + st +
          '<span class="q-move"><button class="icon-btn" data-up="' + l.id + '" ' + (i === 0 ? 'disabled' : '') + '>' + I('up') + '</button>' +
          '<button class="icon-btn" data-down="' + l.id + '" ' + (i === s.loads.length - 1 ? 'disabled' : '') + '>' + I('down') + '</button>' +
          '<button class="toggle ' + (l.on ? 'on' : '') + '" data-toggle="' + l.id + '" ' + (l.id === 'life_support' ? 'disabled' : '') + '><i></i></button></span></div>'
        );
      })
      .join('');
    const demandTotal = s.loads.reduce((a, l) => a + (l.on ? S.Sim.loadDemandW(s, l.id, amb) : 0), 0);
    const gap = Math.max(0, demandTotal - prod);
    return (
      '<div class="panel big-panel pw-panel">' +
      '<div class="bp-head"><span class="bp-num">06</span><h2>' + t('pw.title') + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="pw-top"><div>' + I('target') + '<span>' + t('pw.production') + '</span><b>' + prod + ' W</b><small>☀ ' + p.solarW + ' W · RTG ' + p.rtgW + ' W</small></div>' +
      '<div>' + I('power') + '<span>' + t('pw.demand') + '</span><b>' + demandTotal + ' W</b><small>' + t('pw.ambient', { c: Math.round(amb) }) + '</small></div>' +
      '<div class="' + (gap > 0 ? 'gap' : 'ok') + '">' + I(gap > 0 ? 'alert' : 'check') + '<span>' + t('pw.gap') + '</span><b>' + gap + ' W</b><small>' + t('pw.battery', { e: s.res.energyKwh.toFixed(1), c: s.res.batteryKwh }) + '</small></div></div>' +
      '<div class="pw-list"><div class="pw-head"><span>' + t('pw.system') + '</span><span>' + t('pw.power') + '</span><span>' + t('pw.status') + '</span></div>' + rows +
      '<div class="pw-total"><span>' + t('pw.total') + '</span><b>' + demandTotal + ' W</b></div></div>' +
      '<div class="pw-foot"><span class="alert warn">' + I('alert') + '<span>' + t('pw.rule', { pct: Math.round(S.DATA.gameplay.batteryReserveFrac * 100) }) + '</span></span>' +
      '<button class="btn btn-primary" data-close>' + t('pw.apply') + I('arrowR') + '</button></div></div>'
    );
  };

  PP.open = function () {
    const mount = (box) => {
      box.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { S.Sim.moveLoad(S.getState(), b.dataset.up, -1); S.bus.emit('audio:play', 'click'); PP.refresh(); }));
      box.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => { S.Sim.moveLoad(S.getState(), b.dataset.down, 1); S.bus.emit('audio:play', 'click'); PP.refresh(); }));
      box.querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => { S.Sim.toggleLoad(S.getState(), b.dataset.toggle); S.bus.emit('audio:play', 'click'); PP.refresh(); }));
    };
    PP._mount = mount;
    S.UI.openModal('power', PP.html(S.getState()), { cls: 'modal-wide', onMount: mount });
  };

  PP.refresh = function () {
    if (!S.UI.isOpen('power')) return;
    S.UI.updateModal('power', PP.html(S.getState()), PP._mount);
  };

  S.PowerPanel = PP;
})((window.SOL14 = window.SOL14 || {}));
