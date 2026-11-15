/**
 * SOL 14: RED HORIZON — Ortak UI kiti (K3)
 * Modal yığını (açık modal simülasyonu duraklatır), bildirimler, ikonlar, çubuklar, marka logosu.
 */
(function (S) {
  'use strict';
  const UI = {};
  const esc = (x) => S.util.escape(x);

  UI.root = () => document.getElementById('ui');
  UI.screenLayer = () => document.getElementById('screen-layer');
  UI.hudLayer = () => document.getElementById('hud-layer');
  UI.modalLayer = () => document.getElementById('modal-layer');

  /* ---------------- SVG ikonlar (çizgi stil, mockup'lardaki gibi) ---------------- */
  const P = {
    o2: '<path d="M7 4c-3 1-4 5-4 9 0 4 1 7 4 7s3-3 3-6V8M17 4c3 1 4 5 4 9 0 4-1 7-4 7s-3-3-3-6V8M12 3v7M10 10l2 2 2-2"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M8 9l-2 4h4l-2 4"/>',
    suit: '<circle cx="12" cy="8" r="5"/><path d="M9 8h6M5 21c0-4 3-7 7-7s7 3 7 7"/>',
    morale: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.5 2.2 2 3.5 2s2.5-.5 3.5-2M9 9.5h.01M15 9.5h.01"/>',
    temp: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    signal: '<path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.5"/><path d="M12 14v7"/>',
    power: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 15h10"/>',
    bed: '<path d="M3 18V8M3 14h18v4M7 11h4M21 14v-2a3 3 0 0 0-3-3h-6v5"/>',
    wrench: '<path d="M14 7a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3l8-8a4 4 0 0 0-2-2z"/>',
    tank: '<rect x="7" y="6" width="10" height="15" rx="4"/><path d="M10 6V3h4v3M7 13h10"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l2-3h4l2 3"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    weight: '<path d="M6 8h12l2 13H4z"/><circle cx="12" cy="5" r="2"/>',
    rocket: '<path d="M12 2c3 3 4 7 4 11l-4 3-4-3c0-4 1-8 4-11zM8 13l-3 3v4l3-2M16 13l3 3v4l-3-2"/><circle cx="12" cy="9" r="1.5"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    log: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="m9 21 2-6 3 3v3M7 12l3-4 4 1 3 4M10 8l-1 5"/>',
    heat: '<path d="M8 4c-2 3 2 5 0 8s2 5 0 8M12 4c-2 3 2 5 0 8s2 5 0 8M16 4c-2 3 2 5 0 8s2 5 0 8"/>',
    home: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    sat: '<path d="m13 7 4 4M4 14l6-6 6 6-6 6z"/><path d="M17 3l4 4M14 17a3 3 0 0 0 3 3"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    globe2: '<circle cx="12" cy="12" r="9"/><path d="M5 8h5l2 3-2 3H6M14 5l2 3h3M15 16l2-2h3"/>',
    // emoji yerine aynı çizgi tarzında (retro arayüzde sistem emoji yazı tipi görünmesin)
    drop: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
    food: '<circle cx="12" cy="13" r="6"/><circle cx="12" cy="13" r="2.5"/><path d="M3 4v6M5 4v6M3 7h2M4 10v10M21 4c-2 1-2 4-2 6h2v10"/>',
    wc: '<circle cx="7" cy="5" r="2"/><circle cx="17" cy="5" r="2"/><path d="M5 9h4v6H5zM6 15v5M8 15v5M14 9h6l-1 7h-4zM16 16v4M18 16v4M12 3v18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7"/>',
    snow: '<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 4l3 2 3-2M9 20l3-2 3 2"/>',
    pick: '<path d="M4 7c5-4 11-4 16 0"/><path d="M12 5l-7 16"/>'
  };
  // Veri dosyalarındaki emoji ikonlar (ör. kriz kartı seçenekleri) -> çizgi ikon
  const EMOJI = {
    '🔋': 'battery', '🧹': 'wrench', '🚀': 'rocket', '📶': 'signal', '🌍': 'globe', '🧑': 'suit', '☀': 'sun', '☀️': 'sun',
    '🌪': 'wind', '🌪️': 'wind', '🌀': 'wind', '🌬': 'wind', '🌬️': 'wind', '💨': 'wind', '🎙': 'signal', '🎙️': 'signal',
    '❄': 'snow', '❄️': 'snow', '🧊': 'snow', '🗑': 'x', '🗑️': 'x', '📡': 'sat', '☣': 'alert', '☣️': 'alert', '☢': 'alert', '☢️': 'alert',
    '⚠': 'alert', '⚠️': 'alert', '📄': 'doc', '💌': 'doc', '💾': 'doc', '🚁': 'target', '📷': 'camera', '🌙': 'moon',
    '🛡': 'shield', '🛡️': 'shield', '🏠': 'home', '🔌': 'power', '⚡': 'power', '🩹': 'heart', '🌡': 'temp', '🌡️': 'temp',
    '📦': 'weight', '♨': 'heat', '♨️': 'heat', '🔧': 'wrench', '⚙': 'wrench', '⚙️': 'wrench', '🚶': 'walk', '✂': 'grip', '✂️': 'grip',
    '🧪': 'flask', '📈': 'up', '💧': 'drop', '🍽': 'food', '🍽️': 'food', '🚻': 'wc', '⛏': 'pick', '⛏️': 'pick', '🧑‍🚀': 'suit', '〰': 'wind'
  };
  UI.isEmoji = (x) => Boolean(x && EMOJI[x]);
  /** Bir veri ikonunu çiz: emoji ise eşleşen çizgi ikon, değilse olduğu gibi metin (ör. seçenek harfi) */
  UI.dataIcon = (x) => (EMOJI[x] ? UI.icon(EMOJI[x]) : esc(String(x)));
  UI.icon = (name, cls = '') =>
    '<svg class="ico ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (P[name] || P.alert) +
    '</svg>';

  /* ---------------- Marka ---------------- */
  UI.brand = () =>
    '<div class="brand"><svg class="brand-mark" viewBox="0 0 64 40" aria-hidden="true">' +
    '<path d="M6 32a26 26 0 0 1 52 0z" fill="#e8592a"/><path d="M2 36l14-10 8 5 10-9 10 7 8-4 10 11z" fill="#7a2a17"/>' +
    '<rect x="0" y="35" width="64" height="3" fill="#e8592a"/></svg>' +
    '<div><div class="brand-title">SOL 14</div><div class="brand-sub">RED HORIZON</div></div></div>';

  UI.header = (sectionHtml, rightHtml = '') =>
    '<header class="topbar">' + UI.brand() + '<div class="topbar-sep"></div><div class="topbar-section">' + sectionHtml + '</div>' +
    '<div class="topbar-right">' + rightHtml + '</div></header>';

  /* ---------------- Çubuklar ---------------- */
  UI.bar = (pct, tone = 'cyan', extra = '') =>
    '<div class="bar ' + tone + '"><div class="bar-fill" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></div>' + extra + '</div>';

  UI.segBar = (pct, segments = 20, tone = 'cyan') => {
    let h = '<div class="segbar ' + tone + '">';
    const on = Math.round((pct / 100) * segments);
    for (let i = 0; i < segments; i++) h += '<i class="' + (i < on ? 'on' : '') + '"></i>';
    return h + '</div>';
  };

  /** Etki listesi -> bedel çipleri */
  UI.costChips = (list) =>
    (list || [])
      .map((c) => {
        const vars = Object.assign({}, c.vars);
        if (vars.load) vars.load = S.t('load.' + vars.load);
        const txt = S.t(c.key, vars);
        return '<span class="chip ' + (c.bad ? 'neg' : 'pos') + '">' + esc(txt) + '</span>';
      })
      .join('');

  /* ---------------- Modal yığını ---------------- */
  const stack = [];
  UI.modalOpen = () => stack.length > 0;
  UI.topModal = () => stack[stack.length - 1] || null;

  /**
   * openModal(id, html, { cls, onClose, closable = true, onMount })
   */
  UI.openModal = function (id, html, opts = {}) {
    UI.closeModal(id, true);
    UI.hideTip();
    const layer = UI.modalLayer();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap ' + (opts.cls || '');
    wrap.dataset.id = id;
    wrap.innerHTML = '<div class="modal-backdrop"></div><div class="modal-box">' + html + '</div>';
    layer.appendChild(wrap);
    const entry = { id, el: wrap, opts };
    stack.push(entry);
    if (opts.closable !== false) {
      wrap.querySelector('.modal-backdrop').addEventListener('click', () => UI.closeModal(id));
      wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal(id)));
    }
    if (opts.onMount) opts.onMount(wrap.querySelector('.modal-box'), entry);
    if (!opts.silent) S.bus.emit('audio:play', 'open');
    S.bus.emit('ui:modal', { id, open: true });
    return wrap.querySelector('.modal-box');
  };

  UI.updateModal = function (id, html, onMount) {
    const entry = stack.find((e) => e.id === id);
    if (!entry) return null;
    const box = entry.el.querySelector('.modal-box');
    box.innerHTML = html;
    if (entry.opts.closable !== false) box.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => UI.closeModal(id)));
    if (onMount) onMount(box, entry);
    return box;
  };

  UI.closeModal = function (id, silent) {
    const i = stack.findIndex((e) => e.id === id);
    if (i < 0) return false;
    const [entry] = stack.splice(i, 1);
    entry.el.remove();
    S.bus.emit('ui:modal', { id, open: false });
    if (!silent) {
      S.bus.emit('audio:play', 'close');
      if (entry.opts.onClose) entry.opts.onClose();
    }
    return true;
  };

  UI.closeTop = function () {
    const top = UI.topModal();
    if (top && top.opts.closable !== false) UI.closeModal(top.id);
    return Boolean(top);
  };

  UI.closeAll = function () {
    while (stack.length) {
      const e = stack.pop();
      e.el.remove();
      S.bus.emit('ui:modal', { id: e.id, open: false });
    }
  };

  UI.isOpen = (id) => stack.some((e) => e.id === id);

  /* ---------------- Bildirimler ---------------- */
  /**
   * Bildirimler sıraya girer: aynı anda en fazla 2 görünür, aynı metin tekrar gösterilmez,
   * acil olanlar (danger / warn) sıranın önüne geçer, sıra uzarsa eski bilgi bildirimleri düşer.
   */
  const TQ = { queue: [], shown: 0, recent: new Map() };
  const TOAST_MAX = 2;
  /** Ara sahneler (yolculuk, göktaşı, final) oynarken bildirimler bekler; sahne bitince gösterilir */
  const toastBlocked = () => {
    const sc = S.Game && S.Game.scene;
    const top = UI.topModal && UI.topModal();
    return sc === 'transit' || sc === 'ending' || sc === 'report' || Boolean(top && top.id === 'impact-scene');
  };
  if (typeof setInterval === 'function' && typeof document !== 'undefined') setInterval(() => {
    const host = document.getElementById('toast-layer');
    if (!host) return;
    const b = toastBlocked();
    host.style.visibility = b ? 'hidden' : '';
    if (!b && TQ.queue.length) toastNext();
  }, 300);
  function toastNext() {
    const host = document.getElementById('toast-layer');
    if (!host || toastBlocked()) return;
    while (TQ.shown < TOAST_MAX && TQ.queue.length) {
      const it = TQ.queue.shift();
      const el = document.createElement('div');
      el.className = 'toast ' + it.tone;
      el.innerHTML = it.text;
      host.appendChild(el);
      TQ.shown++;
      setTimeout(() => el.classList.add('out'), it.ms);
      setTimeout(() => {
        el.remove();
        TQ.shown = Math.max(0, TQ.shown - 1);
        toastNext();
      }, it.ms + 400);
    }
  }
  UI.toast = function (text, tone = 'info', ms = 2800) {
    const now = Date.now();
    const last = TQ.recent.get(text);
    if (last && now - last < 8000) return; // aynı bildirim kısa sürede tekrar etmez
    TQ.recent.set(text, now);
    const urgent = tone === 'danger' || tone === 'warn';
    const it = { text, tone, ms };
    if (urgent) TQ.queue.unshift(it);
    else TQ.queue.push(it);
    // sıra uzarsa en eski bilgi bildirimlerini at (acil olanlar kalır)
    while (TQ.queue.length > 3) {
      const i = TQ.queue.findIndex((x) => x.tone !== 'danger' && x.tone !== 'warn');
      if (i < 0) break;
      TQ.queue.splice(i, 1);
    }
    toastNext();
  };

  /* ---------------- Ekran (tam sayfa DOM sahneleri) ---------------- */
  UI.showScreen = function (html, cls = '') {
    UI.hideTip(); // eski öğeye bağlı bilgi balonu kalmasın
    const layer = UI.screenLayer();
    layer.className = 'screen-layer ' + cls;
    layer.innerHTML = html;
    layer.hidden = false;
    return layer;
  };
  UI.hideScreen = function () {
    UI.hideTip();
    const layer = UI.screenLayer();
    layer.innerHTML = '';
    layer.hidden = true;
  };

  UI.bindClicks = function (root, map) {
    for (const [sel, fn] of Object.entries(map)) {
      root.querySelectorAll(sel).forEach((el) =>
        el.addEventListener('click', (e) => {
          S.bus.emit('audio:play', 'click');
          fn(el, e);
        })
      );
    }
  };

  UI.pct = (v) => Math.round(v) + '%';

  /** RIT-09 — Görev durumu / MAV kontrol listesi (finalden önce bilinen koşullar) */
  UI.checklistHtml = function (s) {
    const p = S.Objectives.progress(s);
    const rows = S.Objectives.checklist(s)
      .map((c) => '<li class="' + (c.done ? 'done' : '') + '">' + UI.icon(c.done ? 'check' : 'x') + '<span>' + esc(S.t(c.key, c.vars)) + '</span></li>')
      .join('');
    return (
      '<div class="checklist"><h4>' + UI.icon('rocket') + S.t('status.title') + '</h4><ul>' + rows + '</ul>' +
      '<p class="pv-note">' + esc(S.t('status.min', { f: p.min.forensicsSent, e: p.min.experimentsSent })) + '</p>' +
      '<p class="pv-note">' + esc(S.t('status.note')) + '</p></div>'
    );
  };

  /* ---------------- Bilgi balonu (tooltip) ---------------- */
  // Herhangi bir öğeye UI.tipAttr(html) ile data-tip verilir. Balon fareyle üzerine gelince, klavye odağında
  // (:focus-visible) ve dokunmatikte basılı tutunca (ya da .tip-i rozetine dokununca) açılır. Dinleyiciler bir kez
  // kurulur; balon #ui içinde (em ölçeği) öğenin altına, sığmazsa üstüne yerleşir ve pencereden taşmaz.
  const tip = { el: null, anchor: null, mode: null, timer: 0, start: null, suppressClick: false };
  const TIP_GAP = 6;
  const LONG_PRESS_MS = 450;

  /** rows: [[etiket, metin, ton]] — ton: 'what' | 'why' | 'fx' (etiket rengi) */
  UI.tipHtml = (title, rows) =>
    (title ? '<div class="tip-title">' + title + '</div>' : '') +
    rows
      .filter((r) => r && r[1])
      .map(([label, text, tone]) => '<p class="tip-row ' + (tone || '') + '"><b>' + label + '</b><span>' + text + '</span></p>')
      .join('');
  UI.tipAttr = (html) => (html ? ' data-tip="' + esc(html) + '"' : '');
  /** Dokunmatik ve fare için küçük "i" rozeti (dokununca seçim yapmadan balonu açar) */
  UI.tipBadge = () => '<span class="tip-i" aria-hidden="true">i</span>';

  function tipBox() {
    if (!tip.el || !tip.el.isConnected) {
      tip.el = document.createElement('div');
      tip.el.className = 'ui-tip';
      tip.el.id = 'ui-tip';
      tip.el.setAttribute('role', 'tooltip');
      tip.el.hidden = true;
      UI.root().appendChild(tip.el);
    }
    return tip.el;
  }

  function placeTip() {
    const box = tip.el;
    const a = tip.anchor;
    if (!box || !a || !a.isConnected) return UI.hideTip();
    const root = UI.root().getBoundingClientRect();
    const r = a.getBoundingClientRect();
    box.style.left = '0px';
    box.style.top = '0px';
    const w = box.offsetWidth;
    const h = box.offsetHeight;
    let left = r.left - root.left + r.width / 2 - w / 2;
    left = Math.max(TIP_GAP, Math.min(root.width - w - TIP_GAP, left));
    let top = r.bottom - root.top + TIP_GAP;
    let above = false;
    if (top + h > root.height - TIP_GAP) {
      const up = r.top - root.top - TIP_GAP - h;
      if (up >= TIP_GAP) {
        top = up;
        above = true;
      } else {
        // Ne altına ne üstüne sığıyor: öğenin yanına (sağ, yoksa sol) geç ve dikeyde pencereye sığdır
        top = Math.max(TIP_GAP, Math.min(root.height - h - TIP_GAP, r.top - root.top));
        const right = r.right - root.left + TIP_GAP;
        const leftSide = r.left - root.left - TIP_GAP - w;
        if (right + w <= root.width - TIP_GAP) left = right;
        else if (leftSide >= TIP_GAP) left = leftSide;
      }
    }
    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
    box.classList.toggle('above', above);
  }

  UI.showTip = function (anchor, mode = 'hover') {
    const html = anchor && anchor.getAttribute('data-tip');
    if (!html || !UI.root()) return;
    const box = tipBox();
    if (tip.anchor && tip.anchor !== anchor) tip.anchor.removeAttribute('aria-describedby');
    tip.anchor = anchor;
    tip.mode = mode;
    box.innerHTML = html;
    box.hidden = false;
    anchor.setAttribute('aria-describedby', 'ui-tip');
    placeTip();
  };

  UI.hideTip = function () {
    clearTimeout(tip.timer);
    if (tip.anchor) tip.anchor.removeAttribute('aria-describedby');
    tip.anchor = null;
    tip.mode = null;
    if (tip.el) tip.el.hidden = true;
  };

  function tipTarget(e) {
    const el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    const root = UI.root();
    return el && root && root.contains(el) ? el : null;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const el = tipTarget(e);
      if (el) {
        if (el !== tip.anchor) UI.showTip(el, 'hover');
      } else if (tip.mode === 'hover') UI.hideTip();
    });
    document.addEventListener('pointerleave', () => {
      if (tip.mode === 'hover') UI.hideTip();
    });
    document.addEventListener('focusin', (e) => {
      const el = tipTarget(e);
      if (el && el.matches(':focus-visible')) UI.showTip(el, 'focus');
      else if (tip.mode === 'focus') UI.hideTip();
    });
    document.addEventListener('focusout', (e) => {
      if (tip.mode === 'focus' && e.target === tip.anchor) UI.hideTip();
    });
    document.addEventListener('pointerdown', (e) => {
      clearTimeout(tip.timer);
      tip.suppressClick = false;
      const el = tipTarget(e);
      // "i" rozeti: seçim yapmadan balonu aç (dokunmatik + fare)
      if (el && e.target.closest('.tip-i')) {
        UI.showTip(el, 'touch');
        tip.suppressClick = true;
        return;
      }
      if (e.pointerType !== 'touch') return;
      if (tip.anchor && tip.anchor !== el) UI.hideTip();
      if (!el) return;
      tip.start = { x: e.clientX, y: e.clientY };
      tip.timer = setTimeout(() => {
        UI.showTip(el, 'touch');
        tip.suppressClick = true; // basılı tutma = bilgi; parmak kalkınca seçim yapılmaz
      }, LONG_PRESS_MS);
    });
    document.addEventListener('pointermove', (e) => {
      if (tip.start && Math.hypot(e.clientX - tip.start.x, e.clientY - tip.start.y) > 10) clearTimeout(tip.timer);
    });
    ['pointerup', 'pointercancel'].forEach((ev) =>
      document.addEventListener(ev, () => {
        clearTimeout(tip.timer);
        tip.start = null;
      })
    );
    document.addEventListener(
      'click',
      (e) => {
        if (!tip.suppressClick) return;
        tip.suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
    document.addEventListener('contextmenu', (e) => {
      if (tipTarget(e)) e.preventDefault(); // uzun basışta tarayıcı menüsü açılmasın
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tip.anchor) UI.hideTip();
    });
    document.addEventListener('scroll', () => tip.anchor && UI.hideTip(), true);
    window.addEventListener('resize', () => tip.anchor && UI.hideTip());
  }

  S.UI = UI;
})((window.SOL14 = window.SOL14 || {}));
