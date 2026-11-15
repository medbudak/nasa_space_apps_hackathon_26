/**
 * SOL 14: RED HORIZON — Alt envanter çubuğu (hotbar)
 * Yüzeyde ekranın altında 9 kare slot: önce aletler, sonra malzemeler, stok ve buluntular; ikon + adet.
 * Dışarıda I çubuğu aşağıdan kaydırarak açar/kapar; açıkken seçilen eşya astronotun elinde görünür (effects.js)
 * ve F ile kullanılır (main.js Game.useItem). 1–9 slot seçer. Çubuktaki "Tümü" tam envanteri açar.
 */
(function (S) {
  'use strict';
  const HB = { sel: 0, open: false, lastHtml: '' };
  const SLOTS = 9;
  const I = (n) => S.UI.icon(n);

  // Envanter ekranı da bu eşlemeyi kullanır (tek kaynak)
  const ICON = {
    pickaxe: 'wrench', drill: 'grip', scanner: 'target', repair_kit: 'wrench', rhu: 'heat',
    panel_kit: 'power', solar_kit: 'power', insight_panel: 'power', cable_spool: 'signal', umbilical_kit: 'rocket',
    moxie_kit: 'o2', seed_kit: 'leaf', drill_kit: 'grip', spare_parts: 'wrench', cargo_crate: 'home',
    regolith_bag: 'weight', rhu_pack: 'heat', heater_kit: 'heat', relay_kit: 'signal', spare_antenna: 'sat', robotic_arm: 'grip',
    bottle_empty: 'drop', bottle_full: 'drop'
  };
  HB.icon = (it) => ICON[it.id] || (it.kind === 'find' ? 'camera' : 'doc');
  HB.nameKey = (it) => (it.kind === 'tool' ? 'tool.' : 'item.') + it.id + '.name';

  HB.swingStart = 0;
  HB.swingMs = 0;
  /** Alet vuruşunun ilerlemesi 0..1 (0: vuruş yok) */
  HB.swingK = () => {
    const k = HB.swingMs ? (performance.now() - HB.swingStart) / HB.swingMs : 1;
    return k > 0 && k < 1 ? k : 0;
  };
  HB.selected = (s) => (HB.open ? S.Workshop.inventoryList(s).slice(0, SLOTS)[HB.sel] || null : null);
  /** Su şişesi elde mi (hotbar'da seçili); değilse envanterde durur, elde çizilmez */
  HB.holdsBottle = (s) => {
    const it = HB.selected(s);
    return Boolean(it && it.id.startsWith('bottle_'));
  };
  /** Şişenin hotbar slot numarası (1..9), yoksa null */
  HB.bottleSlot = (s) => {
    const i = S.Workshop.inventoryList(s).slice(0, SLOTS).findIndex((it) => it.id.startsWith('bottle_'));
    return i < 0 ? null : i + 1;
  };

  HB.toggle = function (open = !HB.open) {
    HB.open = open;
    S.bus.emit('audio:play', 'click');
  };

  HB.select = function (i) {
    HB.open = true;
    HB.sel = i;
    HB.lastHtml = '';
    S.bus.emit('audio:play', 'click');
  };

  HB.render = function (host, s) {
    if (!host) return;
    host.classList.toggle('open', HB.open);
    const list = S.Workshop.inventoryList(s).slice(0, SLOTS);
    const picked = list[HB.sel];
    let html = '<div class="hb-name">' + (picked ? S.t(HB.nameKey(picked)) + ' <kbd>F</kbd> ' + S.t('use.hint') : '') + '</div><div class="hb-row">';
    for (let i = 0; i < SLOTS; i++) {
      const it = list[i];
      html +=
        '<div class="hb-slot' + (i === HB.sel ? ' sel' : '') + (it ? ' ' + it.kind : '') + '"' + (it ? ' title="' + S.util.escape(S.t(HB.nameKey(it))) + '"' : '') + '>' +
        '<i class="hb-key">' + (i + 1) + '</i>' +
        (it ? I(HB.icon(it)) + (it.n > 1 ? '<b class="hb-n">' + it.n + '</b>' : '') : '') +
        '</div>';
    }
    html += '<button type="button" class="hb-all" data-inv>' + S.t('hb.all') + ' <kbd>I</kbd></button></div>';
    if (html === HB.lastHtml) return;
    HB.lastHtml = html;
    host.innerHTML = html;
    host.querySelector('[data-inv]').addEventListener('click', () => S.Game.openPanel('inventory'));
  };

  S.Hotbar = HB;
})((window.SOL14 = window.SOL14 || {}));
