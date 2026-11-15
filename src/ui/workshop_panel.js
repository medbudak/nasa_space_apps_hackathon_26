/**
 * SOL 14: RED HORIZON — Atölye ve Envanter pencereleri (K3; S.Workshop'un arayüzü)
 * Atölye: solda tarifler (hazır / kilitli + neden / kurulu), sağda seçili tarif: ne olduğu, neden gerektiği,
 * malzemeler (var/gerekli), mühendislik seçimi ve "ne değişir?" (önce → sonra). Üretince "ne işe yaradı?" kartı.
 * Envanter (I): kitler, enkaz parçaları, stoklar ve buluntular; her birinin nereden geldiği ve hangi tarifte kullanıldığı.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const WP = { sel: null, opt: {} };
  const W = () => S.Workshop;

  const ICON = { solar_array: 'power', solar_extend: 'power', isru_unit: 'o2', mav_line: 'rocket', greenhouse: 'leaf', antenna: 'signal', repair_kit: 'wrench',
    station_shell: 'home', station_shield: 'shield', station_heat_rhu: 'heat', station_heat_heater: 'heat', station_power_panel: 'power', station_power_kit: 'power', station_comms_antenna: 'signal', station_comms_relay: 'signal',
    greenhouse_l2: 'leaf', greenhouse_l3: 'leaf', station_l2: 'home', station_l3: 'home', rocket_l2: 'rocket', rocket_l3: 'rocket' };

  function fxRows(rows) {
    return (
      '<div class="ws-fx">' +
      rows
        .map((r) => {
          const b = r.bool ? t(r.before ? 'ws.yes' : 'ws.no') : r.before;
          const a = r.bool ? t(r.after ? 'ws.yes' : 'ws.no') : r.after;
          const up = r.bool ? r.after > r.before : r.after !== r.before;
          return '<div class="ws-fx-row"><span>' + t('ws.fx.' + r.key) + '</span><b>' + b + '</b><i>→</i><b class="' + (up ? 'up' : '') + '">' + a + '</b></div>';
        })
        .join('') +
      '</div>'
    );
  }

  function detailHtml(s, id) {
    const r = W().recipe(id);
    const st = W().status(s, id);
    const opt = W().option(r, WP.opt[id]);
    const needs = Object.entries(r.needs || {});
    const mats = needs.length
      ? needs.map(([item, n]) => {
          const have = W().count(s, item);
          return '<li class="' + (have >= n ? 'ok' : 'miss') + '">' + I(have >= n ? 'check' : 'x') + '<span>' + t('item.' + item + '.name') + '</span><b>' + have + ' / ' + n + '</b></li>';
        }).join('')
      : '<li class="ok">' + I('check') + '<span>' + t('ws.no_materials') + '</span></li>';
    const opts = r.options
      ? '<h5>' + t('ws.choice') + '</h5><div class="ws-opts" role="radiogroup">' +
        r.options
          .map((o) => '<button type="button" role="radio" aria-checked="' + (opt.id === o.id) + '" class="ws-opt' + (opt.id === o.id ? ' sel' : '') + '" data-opt="' + o.id + '"' + (st.state !== 'ready' ? ' disabled' : '') + '>' +
            '<b>' + t('ws.' + id + '.opt.' + o.id + '.name') + '</b><small>' + t('ws.' + id + '.opt.' + o.id + '.desc', { min: o.minutes }) + '</small></button>')
          .join('') + '</div>'
      : '';
    const state =
      st.state === 'built'
        ? '<p class="ws-state built">' + I('check') + t('ws.state_built') + '</p>'
        : st.state === 'locked'
          ? '<p class="ws-state locked">' + I('alert') + t(st.reasonKey, st.vars) + '</p>'
          : '';
    return (
      '<div class="ws-detail">' +
      '<h3>' + I(ICON[id] || 'wrench') + t('ws.' + id + '.name') + '</h3>' +
      '<p class="ws-what"><b>' + t('ws.lbl_what') + '</b> ' + t('ws.' + id + '.what') + '</p>' +
      '<p class="ws-why"><b>' + t('ws.lbl_why') + '</b> ' + t('ws.' + id + '.why') + '</p>' +
      '<h5>' + t('ws.materials') + '</h5><ul class="ws-mats">' + mats + '</ul>' +
      opts +
      (st.state !== 'built' ? '<h5>' + t('ws.changes') + '</h5>' + fxRows(W().effects(s, id, opt && opt.id)) : '') +
      state +
      (st.state === 'ready'
        ? '<button class="btn btn-primary btn-block" data-build>' + I('wrench') + t('ws.build', { min: W().minutes(id, opt && opt.id) }) + '</button>'
        : '') +
      '</div>'
    );
  }

  WP.html = function (s) {
    const recipes = W().recipes().filter((r) => {
      const st = W().status(s, r.id).state;
      return st !== 'hidden' && (st !== 'built' || r.builds || r.once || r.module || r.upgrade);
    });
    if (!WP.sel || !W().recipe(WP.sel)) WP.sel = (recipes.find((r) => W().status(s, r.id).state === 'ready') || recipes[0]).id;
    const list = recipes
      .map((r) => {
        const st = W().status(s, r.id).state;
        return '<button type="button" class="ws-item ' + st + (WP.sel === r.id ? ' sel' : '') + '" data-recipe="' + r.id + '">' + I(ICON[r.id] || 'wrench') +
          '<span>' + t('ws.' + r.id + '.name') + '</span><em>' + t('ws.st_' + st) + '</em></button>';
      })
      .join('');
    return (
      '<div class="panel big-panel ws-panel">' +
      '<div class="fr2-head"><span class="fr2-tag">' + I('wrench') + t('ws.tag') + '</span><h2>' + t('ws.title') + '</h2>' +
      '<button class="btn btn-ghost btn-sm" data-inv>' + I('doc') + t('inv.title') + ' <kbd>I</kbd></button>' +
      '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<p class="fr2-brief">' + t('ws.intro') + '</p>' +
      '<div class="ws-grid"><div class="ws-list">' + list + '</div>' + detailHtml(s, WP.sel) + '</div></div>'
    );
  };

  /** Üretimden sonra: ne işe yaradı (gerçekleşen önce → sonra) */
  function resultHtml(res) {
    return (
      '<div class="panel big-panel ws-panel ws-result">' +
      '<div class="fr2-head"><span class="fr2-tag">' + I('check') + t('ws.done_tag') + '</span><h2>' + t('ws.' + res.id + '.name') + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<p class="fr2-brief">' + t(res.option ? 'ws.' + res.id + '.opt.' + res.option : 'ws.' + res.id + '.result') + '</p>' +
      '<h5>' + t('ws.what_it_did') + '</h5>' + fxRows(res.rows) +
      '<p class="pv-note">' + I('clock') + t('ws.took', { min: res.minutes }) + '</p>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-back>' + I('arrowL') + t('ws.back') + '</button><button class="btn btn-primary" data-close>' + t('ui.continue') + '</button></div></div>'
    );
  }

  WP.open = function () {
    const mount = (box) => {
      box.querySelectorAll('[data-recipe]').forEach((b) =>
        b.addEventListener('click', () => {
          WP.sel = b.dataset.recipe;
          S.bus.emit('audio:play', 'click');
          S.UI.updateModal('workshop', WP.html(S.getState()), mount);
        })
      );
      box.querySelectorAll('[data-opt]').forEach((b) =>
        b.addEventListener('click', () => {
          WP.opt[WP.sel] = b.dataset.opt;
          S.bus.emit('audio:play', 'click');
          S.UI.updateModal('workshop', WP.html(S.getState()), mount);
        })
      );
      const inv = box.querySelector('[data-inv]');
      if (inv) inv.addEventListener('click', () => WP.openInventory());
      const bld = box.querySelector('[data-build]');
      if (bld)
        bld.addEventListener('click', () => {
          const s = S.getState();
          const res = W().build(s, WP.sel, WP.opt[WP.sel]);
          if (!res.ok) return S.UI.toast(t(res.errKey, res.vars), 'warn');
          S.UI.closeModal('workshop', true);
          S.UI.toast(I('check') + t('ws.toast_built', { what: t('ws.' + res.id + '.name') }), 'ok', 4500);
          S.Game.afterAction(() => {
            S.UI.openModal('workshop', resultHtml(res), {
              cls: 'modal-wide',
              onMount: (b2) => {
                const back = b2.querySelector('[data-back]');
                if (back) back.addEventListener('click', () => WP.open());
              }
            });
          });
        });
    };
    S.UI.openModal('workshop', WP.html(S.getState()), { cls: 'modal-wide', onMount: mount });
  };

  WP.inventoryHtml = function (s) {
    const list = W().inventoryList(s);
    const cards = list.length
      ? list
          .map((it) => {
            const key = it.kind === 'find' ? 'item.' + it.id : 'item.' + it.id;
            const used = it.kind === 'item' ? W().usedIn(it.id) : [];
            return (
              '<div class="inv-card"><div class="inv-head"><b>' + t(key + '.name') + '</b><span class="inv-n">×' + it.n + '</span></div>' +
              '<p>' + t(key + '.desc') + '</p>' +
              '<small>' + I('map') + t(key + '.from') + '</small>' +
              (used.length ? '<small class="inv-use">' + I('wrench') + t('inv.used_in', { list: used.map((r) => t('ws.' + r + '.name')).join(', ') }) + '</small>' : '') +
              '</div>'
            );
          })
          .join('')
      : '<p class="pv-note">' + t('inv.empty') + '</p>';
    return (
      '<div class="panel big-panel ws-panel">' +
      '<div class="fr2-head"><span class="fr2-tag">' + I('doc') + t('inv.tag') + '</span><h2>' + t('inv.title') + '</h2>' +
      (s.player.inside ? '<button class="btn btn-ghost btn-sm" data-ws>' + I('wrench') + t('ws.title') + '</button>' : '') +
      '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<p class="fr2-brief">' + t('inv.intro') + '</p><div class="inv-grid">' + cards + '</div></div>'
    );
  };

  WP.openInventory = function () {
    S.UI.closeModal('workshop', true);
    S.UI.openModal('inventory', WP.inventoryHtml(S.getState()), {
      cls: 'modal-wide',
      onMount: (box) => {
        const ws = box.querySelector('[data-ws]');
        if (ws)
          ws.addEventListener('click', () => {
            S.UI.closeModal('inventory', true);
            WP.open();
          });
      }
    });
  };

  S.WorkshopPanel = WP;
})((window.SOL14 = window.SOL14 || {}));
