/**
 * SOL 14: RED HORIZON — Alt envanter çubuğu (hotbar)
 * Yüzeyde ekranın altında 9 kare slot: önce aletler, sonra malzemeler, stok ve buluntular; ikon + adet.
 * 1–9 slot seçer (seçilenin adı çubuğun üstünde görünür), I tam envanteri açar. Veri S.Workshop.inventoryList.
 */
(function (S) {
  'use strict';
  const HB = { sel: 0, lastHtml: '' };
  const SLOTS = 9;
  const I = (n) => S.UI.icon(n);

  // Envanter ekranı da bu eşlemeyi kullanır (tek kaynak)
  const ICON = {
    pickaxe: 'wrench', drill: 'grip', scanner: 'target', repair_kit: 'wrench', rhu: 'heat',
    panel_kit: 'power', solar_kit: 'power', insight_panel: 'power', cable_spool: 'signal', umbilical_kit: 'rocket',
    moxie_kit: 'o2', seed_kit: 'leaf', drill_kit: 'grip', spare_parts: 'wrench', cargo_crate: 'home',
    regolith_bag: 'weight', rhu_pack: 'heat', heater_kit: 'heat', relay_kit: 'signal', spare_antenna: 'sat', robotic_arm: 'grip'
  };
  HB.icon = (it) => ICON[it.id] || (it.kind === 'find' ? 'camera' : 'doc');
  HB.nameKey = (it) => (it.kind === 'tool' ? 'tool.' : 'item.') + it.id + '.name';

  HB.select = function (i) {
    HB.sel = i;
    HB.lastHtml = '';
    S.bus.emit('audio:play', 'click');
  };

  HB.render = function (host, s) {
    if (!host) return;
    const list = S.Workshop.inventoryList(s).slice(0, SLOTS);
    const picked = list[HB.sel];
    let html = '<div class="hb-name">' + (picked ? S.t(HB.nameKey(picked)) : '') + '</div><div class="hb-row">';
    for (let i = 0; i < SLOTS; i++) {
      const it = list[i];
      html +=
        '<div class="hb-slot' + (i === HB.sel ? ' sel' : '') + (it ? ' ' + it.kind : '') + '"' + (it ? ' title="' + S.util.escape(S.t(HB.nameKey(it))) + '"' : '') + '>' +
        '<i class="hb-key">' + (i + 1) + '</i>' +
        (it ? I(HB.icon(it)) + (it.n > 1 ? '<b class="hb-n">' + it.n + '</b>' : '') : '') +
        '</div>';
    }
    html += '</div>';
    if (html === HB.lastHtml) return;
    HB.lastHtml = html;
    host.innerHTML = html;
  };

  S.Hotbar = HB;
})((window.SOL14 = window.SOL14 || {}));
