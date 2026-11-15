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
  /** Piksel-art Mars logosu: 16×16 ızgarada gölgeli disk + krater lekeleri (shape-rendering: crispEdges) */
  function marsLogo() {
    const N = 16;
    const c = (N - 1) / 2;
    const craters = [[5, 5, 1.6], [10, 4, 1.1], [9, 9, 2], [4, 11, 1.2], [12, 11, 1]];
    const tones = ['#f08a4b', '#d9602e', '#b8461f', '#8c3216', '#5e200e'];
    let px = '';
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = x - c;
        const dy = y - c;
        const r = Math.sqrt(dx * dx + dy * dy);
        if (r > N / 2 - 0.2) continue;
        // ışık sol üstten: kenara ve sağ alta doğru koyulaşır
        let shade = Math.floor((dx + dy) / 5 + 1.6 + (r > N / 2 - 1.4 ? 1 : 0));
        if (craters.some(([cx, cy, cr]) => (x - cx) ** 2 + (y - cy) ** 2 <= cr * cr)) shade += 1;
        shade = Math.max(0, Math.min(tones.length - 1, shade));
        px += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + tones[shade] + '"/>';
      }
    }
    return '<svg class="mm-planet" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + px + '</svg>';
  }

  function menuBtn(id, label, sub, opts = {}) {
    return (
      '<button class="mm-btn' + (opts.primary ? ' primary' : '') + '" data-m="' + id + '"' + (opts.disabled ? ' disabled' : '') + '>' +
      '<span class="mm-txt"><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
      (opts.primary ? '<span class="mm-arrow">→</span>' : '') + '</button>'
    );
  }

  DS.showMenu = function (h) {
    const save = S.hasSave();
    const muted = S.Audio.isMuted();
    const html =
      '<div class="screen menu"><div class="mm-art" style="--bg:url(\'' + S.Sprites.screen('cover_thumbnail') + '\')"></div>' +
      '<div class="mm-panel"></div>' +
      '<div class="mm-box"><div class="mm-logo">' + marsLogo() +
      '<div><div class="mm-title">SOL 14</div><div class="mm-sub">RED HORIZON</div></div></div>' +
      '<p class="mm-tag">' + t('menu.tagline') + '</p>' +
      '<div class="mm-btns">' +
      menuBtn('new', t('menu.new'), '', { primary: true }) +
      menuBtn('continue', t('menu.continue'), t(save ? 'menu.continue_sub' : 'menu.continue_none'), { disabled: !save }) +
      menuBtn('demo', t('menu.demo'), t('menu.demo_sub')) +
      menuBtn('settings', t('menu.settings'), '') +
      '</div></div>' +
      '<div class="mm-bottom"><div class="mm-lang">' +
      '<button data-m="lang-tr" class="' + (S.lang === 'tr' ? 'on' : '') + '">TR</button><span>/</span>' +
      '<button data-m="lang-en" class="' + (S.lang === 'en' ? 'on' : '') + '">EN</button></div><i class="mm-sep"></i>' +
      '<button class="mm-sound" data-m="sound" title="' + t(muted ? 'menu.sound_off' : 'menu.sound_on') + '">' + I(muted ? 'mute' : 'sound') + '</button></div>' +
      '<p class="mm-slogan">' + t('menu.slogan') + '</p></div>';
    const root = S.UI.showScreen(html, 'scene-menu');
    const setLang = (l) => {
      if (S.lang !== l) h.toggleLang();
    };
    S.UI.bindClicks(root, {
      '[data-m="continue"]': () => h.continueGame(),
      '[data-m="new"]': () => h.newGame(false),
      '[data-m="demo"]': () => h.newGame(true),
      '[data-m="settings"]': () => DS.openSettings(h),
      '[data-m="lang-tr"]': () => setLang('tr'),
      '[data-m="lang-en"]': () => setLang('en'),
      '[data-m="sound"]': () => {
        S.Audio.toggleMute();
        DS.showMenu(h);
      }
    });
    // İlk açılışta eğitim rehberi bir kez kendiliğinden gelir (K4 Sedef); tarayıcı depolaması yoksa sessizce geçilir
    try {
      if (!localStorage.getItem(HELP_SEEN_KEY)) {
        localStorage.setItem(HELP_SEEN_KEY, '1');
        setTimeout(() => {
          if (S.Game && S.Game.scene === 'menu' && !S.UI.topModal()) DS.openHelp(0);
        }, 500);
      }
    } catch (e) {
      /* depolama kapalı: rehber Ayarlar → Nasıl Oynanır'dan açılır */
    }
  };

  /** Ayarlar: dil, ses, nasıl oynanır + proje künyesi ve kurgu notu */
  DS.openSettings = function (h) {
    const muted = S.Audio.isMuted();
    const html =
      '<div class="panel action-modal settings-modal"><div class="modal-head"><h3>' + t('menu.settings') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="set-rows">' +
      '<button class="btn btn-ghost btn-block" data-s="lang">' + I('globe') + t('menu.lang') + '</button>' +
      '<button class="btn btn-ghost btn-block" data-s="sound">' + I(muted ? 'mute' : 'sound') + t(muted ? 'menu.sound_off' : 'menu.sound_on') + '</button>' +
      '<button class="btn btn-ghost btn-block" data-s="help">' + I('doc') + t('menu.help') + '</button></div>' +
      '<p class="pv-desc">' + t('menu.footer') + '</p><p class="pv-desc"><i>' + t('lt.fiction') + '</i></p>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-close>' + t('ui.close') + '</button></div></div>';
    const root = S.UI.openModal('settings', html, {});
    const reopen = () => {
      S.UI.closeAll();
      DS.showMenu(h);
      DS.openSettings(h);
    };
    S.UI.bindClicks(root, {
      '[data-s="lang"]': () => {
        h.toggleLang();
        reopen();
      },
      '[data-s="sound"]': () => {
        S.Audio.toggleMute();
        reopen();
      },
      '[data-s="help"]': () => DS.openHelp()
    });
  };

  /**
   * Nasıl oynanır: 4 sekmeli eğitim rehberi (K4 Sedef'in nursedef taslağından; metinler story.json → help.*)
   * 1 Kontroller · 2 Roket ve aletler · 3 Keşif: doğu ve batı · 4 Üs, yakıt ve veri
   */
  const HELP_SEEN_KEY = 'sol14_tutorial_seen_v1';
  const HELP_TABS = [
    { id: 'controls' },
    { id: 'design', rows: [['rocket', 'help.design.rocket'], ['map', 'help.design.site'], ['camera', 'help.design.camera'], ['alert', 'help.design.warn'], ['signal', 'help.design.rimfax'], ['o2', 'help.design.life'], ['target', 'help.design.drone']] },
    { id: 'explore', rows: [['target', 'help.explore.east'], ['map', 'help.explore.tube'], ['temp', 'help.explore.west'], ['camera', 'help.explore.photo']] },
    { id: 'base', rows: [['flask', 'help.base.fuel'], ['o2', 'help.base.water'], ['leaf', 'help.base.greenhouse'], ['signal', 'help.base.downlink'], ['rocket', 'help.base.mav']] }
  ];
  DS.openHelp = function (startTab) {
    let tab = Math.max(0, Math.min(HELP_TABS.length - 1, Number(startTab) || 0));
    const keys = [
      ['A / D · ← →', 'help.move'],
      ['W · Space · ↑', 'help.jump'],
      ['E', 'help.interact'],
      ['L', 'help.downlink'],
      ['P', 'help.power'],
      ['J', 'help.log'],
      ['Esc', 'help.pause']
    ];
    const body = () => {
      const tb = HELP_TABS[tab];
      if (tb.id === 'controls') {
        return (
          '<div class="help-keys">' + keys.map(([k, d]) => '<div><kbd>' + k + '</kbd><span>' + t(d) + '</span></div>').join('') + '</div>' +
          '<div class="help-loop">' + ['help.loop1', 'help.loop2', 'help.loop3'].map((k, i) => '<div><b>' + (i + 1) + '</b><span>' + t(k) + '</span></div>').join('') + '</div>' +
          '<p class="pv-desc">' + t('help.ponr') + '</p>'
        );
      }
      const cb = S.DATA.gameplay.cargoBonus || {};
      const vars = { min: cb.minMarginPct };
      return '<div class="help-rows">' + tb.rows.map(([ic, k]) => '<div>' + I(ic) + '<span>' + t(k, vars) + '</span></div>').join('') + '</div>';
    };
    const render = () =>
      '<div class="panel action-modal help-modal"><div class="modal-head"><h3>' + I('doc') + t('help.guide_title') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="help-tabs" role="tablist">' +
      HELP_TABS.map((tb, i) => '<button type="button" role="tab" aria-selected="' + (i === tab) + '" class="btn btn-sm ' + (i === tab ? 'btn-primary' : 'btn-ghost') + '" data-tab="' + i + '">' + t('help.tab.' + tb.id) + '</button>').join('') +
      '</div><div class="help-body">' + body() + '</div>' +
      '<div class="modal-actions help-nav"><button type="button" class="btn btn-ghost" data-prev' + (tab === 0 ? ' disabled' : '') + '>' + I('arrowL') + t('ui.back') + '</button>' +
      '<span class="help-count">' + (tab + 1) + ' / ' + HELP_TABS.length + '</span>' +
      (tab < HELP_TABS.length - 1
        ? '<button type="button" class="btn btn-primary" data-next>' + t('ui.next') + I('arrowR') + '</button>'
        : '<button type="button" class="btn btn-primary" data-close>' + t('help.done') + '</button>') +
      '</div></div>';
    const go = (i) => {
      tab = Math.max(0, Math.min(HELP_TABS.length - 1, i));
      S.UI.updateModal('help', render(), mount);
    };
    const mount = (box) => {
      box.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.tab))));
      const prev = box.querySelector('[data-prev]');
      if (prev) prev.addEventListener('click', () => go(tab - 1));
      const next = box.querySelector('[data-next]');
      if (next) next.addEventListener('click', () => go(tab + 1));
    };
    S.UI.openModal('help', render(), { onMount: mount });
  };

  /* ================================================================ */
  /* SOL 0 MISSION PREP — 5 steps, one shared layout                    */
  /* Header (logo · "Mission prep" · sol count), named step indicator,  */
  /* ~65 % choice area on the left, ~35 % preview/result panel on the   */
  /* right, fixed footer: Back · Budget & mass · one primary action.    */
  /* All numbers come from S.DATA and Engineering.calcDesignTotals.     */
  /* ================================================================ */
  const PAL = {
    w: '#e9e1d3', W: '#bdb4a6', o: '#e0632a', O: '#f2a03d', d: '#2f323b', g: '#8a8f9a', G: '#5fd36a',
    k: '#6f7a52', y: '#ffcf3f', b: '#3b6fb4', B: '#6fb2ea', e: '#4caf6a', r: '#b8461f', R: '#7d3529', c: '#c9e8ff', n: '#5a5d66'
  };
  const ROVER = [
    '...........ggg', '..........g...', '..........g...', '..wwwwwwwwgww.', '.wwwwwwwwwwwww',
    '.woooooooowwww', '.wwwwwwwwwwwww', '..g...g....g..', '.ddd.ddd..ddd.', '.dgd.dgd..dgd.', '.ddd.ddd..ddd.'
  ];
  const TRIPOD = [
    '.wwwwwwwwwwww.', '.wdGGGGGGGGdw.', '.wwwwwwwwwwww.', '......gg......', '.....g..g.....',
    '....g....g....', '....g....g....', '...g......g...', '...g......g...', '..g........g..', '..g........g..'
  ];
  const DISH = ['.wwww.......', 'wgggww......', 'wggggw..g...', 'wggggw.g....', '.wwwwgg.....', '....gg......', '....gg......', '...gggg.....', '..gggggg....'];
  const BOX = ['kkkkkk', 'kGkGkk', 'kkkkkk', 'kkkkkk'];
  const SAT = ['bbb.....bbb', 'bBb.....bBb', 'bbbgwwwgbbb', 'bBb.www.bBb', 'bbb.....bbb'];
  /* Small pixel icons for rows and cards (same palette, same scale) */
  const ICONS = {
    tubes: ['.w..w..........', '.w..w...ddddd..', '.w..w...dGGGd..', '.w..w...dG.Gd..', '.b..o...dGGGd..', '.B..O...ddddd..', '.b..o....ggg...', 'ggggggggggggggg', 'g.............g', 'ggggggggggggggg'],
    clip: ['...dddd......', '.wwwddwww....', '.wGwddddw..w.', '.wwwwwwww..w.', '.wGwddddw.www.', '.wwwwwwww.wow.', '.wGwddddwwooow', '.wwwwwwwwwooow', '..........www.'],
    crater: ['.............', '....rrrrr....', '..rrRRRRRrr..', '.rRRrrrrrRRr.', 'rRrrrrrrrrrRr', '.rrrrrrrrrrr.', '...rrrrrrr...'],
    panel: ['bbbbbbbbbbbb', 'bBbBbBbBbBbB', 'bbbbbbbbbbbb', 'bBbBbBbBbBbB', 'bbbbbbbbbbbb', '.....gg.....', '.....gg.....', '...gggggg...'],
    battery: ['..d......d..', 'dddddddddddd', 'dWWWWWWWWWWd', 'dWWWWyyWWWWd', 'dWWWyyWWWWWd', 'dWWWWWyyWWWd', 'dWWWWyyWWWWd', 'dWWWWWWWWWWd', 'dddddddddddd'],
    layers: ['wwwwwwwwwwww', 'wwwwwwwwwwww', 'gggggggggggg', 'WgWgWgWgWgWg', 'gggggggggggg', 'oooooooooooo', 'rrrrrrrrrrrr'],
    kit: ['....dddd....', '....d..d....', 'oooooooooooo', 'oOOOOOOOOOOo', 'oooooggooooo', 'oOOOOggOOOOo', 'oOOOOOOOOOOo', 'oooooooooooo'],
    mastcam_z: ['...gggg.....', '.wwwwwwwwww.', '.wwwwddddww.', '.wowddBBddw.', '.wwwddBBddw.', '.wwwwddddww.', '.wwwwwwwwww.', '.....gg.....', '....g..g....', '...g....g...', '..g......g..'],
    meda: ['.g.g.g......', '.ggggg......', '...g...www..', '...g...wgw..', '...g...www..', '...ggggg....', '...g........', 'bbbg........', 'bBbg........', 'bbbg........', '...g........', '.ggggg......'],
    seis: ['............', '....wwww....', '...wwwwww...', '..wwwwwwww..', '..WWWWWWWW..', '.oooooooooo.', '.dddddddddd.', '..g......g..', '.gg......gg.'],
    rad: ['.....gg.....', '..wwwwwwww..', '..wyyyyyyw..', '..wyddddyw..', '..wyyddyyw..', '..wydyydyw..', '..wyyyyyyw..', '..wwwwwwww..', '...g....g...', '..g......g..'],
    rimfax: ['...gggggg...', '..gwwwwwwg..', '.dddddddddd.', '.dgd....dgd.', 'rrrrrrrrrrrr', 'rr.B....B.rr', 'r.B......B.r', 'rr.B....B.rr', 'rrrBBBBBBrrr'],
    supercam: ['wwwwww......', 'wddddwOOOOOO', 'wdBBdw......', 'wwwwww......', '..gg........', '..gg........', '..gg........', '.gggg.......', 'gggggg......'],
    moxie: ['.....c..c...', '..c.....c...', '.wwwwwwwwww.', '.wddddddddw.', '.wdcccccddw.', '.wddddddddw.', '.wwwwwwwwww.', '.wooooooooow', '..g......g..'],
    veggie: ['.....cc.....', '...cccccc...', '..cc....cc..', '.c........c.', '.c.e..e..ec.', '.c.ee.ee.ec.', '.c..e..e.ec.', '.cwwwwwwwwc.', '.cwwwwwwwwc.'],
    ingenuity: ['gggggggggggg', '.....gg.....', 'gggggggggggg', '.....gg.....', '....wwww....', '...wwddww...', '...wwwwww...', '...g....g...', '..g......g..']
  };
  const INST_ICON = { mastcam_z: 'mastcam_z', meda: 'meda', seis: 'seis', rad: 'rad', rimfax: 'rimfax', supercam: 'supercam', moxie: 'moxie', veggie: 'veggie', ingenuity: 'ingenuity' };

  const R = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
  function pixRects(rows, ox = 0, oy = 0, s = 1) {
    let px = '';
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const c = PAL[r[x]];
        if (c) px += R(ox + x * s, oy + y * s, s * 1.02, s * 1.02, c);
      }
    });
    return px;
  }
  /** Square pixel icon: rows are centred in a square box so every icon renders at the same pixel scale */
  function pixIcon(rows, cls, box) {
    const w = Math.max(...rows.map((r) => r.length));
    const size = box || Math.max(w, rows.length);
    const ox = (size - w) / 2;
    const oy = size - rows.length; // sit on the bottom edge
    return '<svg class="' + (cls || '') + '" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" aria-hidden="true">' + pixRects(rows, ox, oy) + '</svg>';
  }
  /** One shared box size for each icon family keeps the pixel scale identical */
  const iconRow = (name) => pixIcon(ICONS[name] || ROVER, '', 15);
  const iconInst = (id) => pixIcon(ICONS[INST_ICON[id]] || ICONS.mastcam_z, '', 13);
  function objIcon(id) {
    if (id === 'forensics') return pixIcon(ROVER, '', 15);
    if (id === 'experiments') return iconRow('tubes');
    return iconRow('clip');
  }
  function commIcon(id) {
    return id === 'relay_xband'
      ? '<span class="dz-duo">' + pixIcon(SAT, '', 12) + pixIcon(DISH, '', 12) + '</span>'
      : pixIcon(SAT, '', 15);
  }
  /** Rocket silhouettes (24×34 grid) — generic shapes, no real logos or markings */
  function rocketArt(id) {
    let s = '';
    const body = (x, y, w, h, c) => {
      s += R(x, y, w, h, c);
      for (let k = 1; w - 2 * k > 0; k++) s += R(x + k, y - k, w - 2 * k, 1, c);
    };
    if (id === 'falcon_heavy') {
      body(5, 10, 4, 21, '#e9e1d3');
      body(15, 10, 4, 21, '#e9e1d3');
      body(10, 4, 4, 27, '#f4ece0');
      s += R(10, 6, 4, 1, '#2f323b') + R(5, 12, 4, 1, '#2f323b') + R(15, 12, 4, 1, '#2f323b');
    } else if (id === 'sls_block1b') {
      body(9, 6, 6, 25, '#d9772a');
      s += R(9, 3, 6, 4, '#e9e1d3') + R(10, 2, 4, 1, '#e9e1d3') + R(11, 1, 2, 1, '#e9e1d3');
      body(5, 9, 3, 22, '#f4ece0');
      body(16, 9, 3, 22, '#f4ece0');
    } else {
      body(9, 4, 6, 27, '#f4ece0');
      s += R(9, 14, 6, 2, '#e0632a') + R(9, 22, 6, 1, '#bdb4a6');
      body(7, 23, 2, 8, '#bdb4a6');
      body(15, 23, 2, 8, '#bdb4a6');
    }
    s += R(1, 31, 22, 2, '#7d3529') + R(3, 33, 18, 1, '#5e2a27');
    return '<svg viewBox="0 0 24 34" shape-rendering="crispEdges" aria-hidden="true">' + s + '</svg>';
  }
  function routeIcon(fast) {
    let dots = '';
    for (let i = 0; i < (fast ? 4 : 6); i++) dots += R(9 + i * (fast ? 4 : 2.7), fast ? 6 : 5 - Math.round(Math.sin((i / 5) * Math.PI) * 3), 1.5, 1, '#d8d0c4');
    return (
      '<svg viewBox="0 0 34 12" shape-rendering="crispEdges" aria-hidden="true">' +
      disc(4, 6, 3, (x, y) => (Math.sin(x * 1.3 + y) > 0.4 ? '#4caf6a' : '#3b6fb4')) + dots +
      disc(29, 6, 3, (x, y) => (x + y > 1 ? '#9a3a1e' : '#d0643a')) + '</svg>'
    );
  }

  /* ---------- Preview scenes (160×100 pixel grid) ---------- */
  function sprite(key, x, y, w, h) {
    const im = S.Sprites.get(key);
    return im ? '<image href="' + im.src + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMax meet" style="image-rendering:pixelated"/>' : '';
  }
  function disc(cx, cy, r, colorAt) {
    let s = '';
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.5) s += R(cx + x, cy + y, 1.02, 1.02, colorAt(x, y));
    return s;
  }
  function stars(n, maxY) {
    let s = '';
    let seed = 7;
    for (let i = 0; i < n; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const x = seed % 160;
      seed = (seed * 9301 + 49297) % 233280;
      s += R(x, seed % maxY, 1, 1, i % 4 ? '#58607a' : '#c9cfe0');
    }
    return s;
  }
  function land(top) {
    let s = '';
    for (let x = 0; x < 160; x += 2) {
      const back = Math.round(5 + 3 * Math.sin(x / 13) + 2 * Math.sin(x / 6 + 1));
      const front = Math.round(3 + 2 * Math.sin(x / 9 + 2) + 1.5 * Math.sin(x / 4));
      s += R(x, top - 10 - back, 2, back + 40, '#5e2a27') + R(x, top - front, 2, front + 40, '#7d3529');
    }
    s += R(0, top + 6, 160, 40, '#b9512a') + R(0, top + 6, 160, 2, '#d0643a');
    [[10, top + 14, 6, 2], [52, top + 18, 4, 2], [96, top + 13, 3, 2], [128, top + 17, 7, 3]].forEach(([x, y, w, h]) => (s += R(x, y, w, h, '#4a3a3a')));
    return s;
  }
  /** Habitat: (x, y) = top left, s = scale; height 28·s (legs included) */
  function habitat(x, y, s) {
    return (
      '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      R(2, 0, 40, 2, '#e9e1d3') + R(0, 2, 44, 22, '#e9e1d3') + R(0, 21, 44, 3, '#bdb4a6') + R(0, 12, 44, 3, '#e0632a') +
      R(14, 8, 9, 16, '#8a8f9a') + R(17, 11, 3, 3, '#2f323b') + R(28, 5, 5, 4, '#2f323b') + R(35, 5, 5, 4, '#2f323b') + R(4, 5, 4, 2, '#2f323b') +
      R(2, 24, 3, 4, '#5a5d66') + R(39, 24, 3, 4, '#5a5d66') +
      R(34, -16, 1, 16, '#8a8f9a') + R(33, -18, 3, 2, '#5fd36a') +
      R(21, -6, 1, 6, '#8a8f9a') + R(17, -10, 7, 2, '#d8d0c4') + R(18, -12, 5, 2, '#d8d0c4') +
      '</g>'
    );
  }
  const svgWrap = (inner) => '<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">' + inner + '</svg>';
  /** Full-screen 960×540 art, scaled down with its aspect ratio kept (cover crop, pixelated) */
  const shot = (key) => '<img src="' + S.Sprites.screen(key) + '" alt="" draggable="false">';

  function sceneFor(step, d) {
    if (step === 1) {
      return svgWrap(R(0, 0, 160, 100, '#1a2030') + stars(18, 40) + land(64) + pixRects(TRIPOD, 30, 56, 1.4) + sprite('astronaut_action', 54, 44, 24, 30) + sprite('rover_opportunity', 92, 46, 48, 28));
    }
    if (step === 2) return shot('scr_transit');
    if (step === 3) {
      const rtg = d.powerSource === 'solar_rtg' ? pixRects(BOX, 106, 66, 2) + R(110, 69, 3, 2, '#ffcf3f') : '';
      return svgWrap(R(0, 0, 160, 100, '#1a2030') + stars(10, 30) + disc(136, 16, 6, () => '#ffcf3f') + land(66) + habitat(18, 36, 1.35) + sprite('solar_clean', 108, 50, 46, 24) + rtg);
    }
    if (step === 4) return shot('scr_lab_desk');
    return shot('scr_launch');
  }

  /* ---------- Rules read from existing code/data ---------- */
  // Instrument limits are the ones Engineering.calcDesignTotals enforces (design.err_no_instrument / err_too_many).
  const INST_MIN = 1;
  const INST_MAX = 5;
  /** Which step fixes which problem; crit = launch-blocking error from calcDesignTotals, otherwise an M8 warning */
  const ISSUE = {
    'design.err_money': { cat: 'budget', step: 4 },
    'design.err_mass': { cat: 'mass', step: 2 },
    'spof.low_mass_margin': { cat: 'mass', step: 2 },
    'spof.no_rtg': { cat: 'energy', step: 3 },
    'spof.small_battery': { cat: 'energy', step: 3 },
    'spof.thin_insulation_cold': { cat: 'energy', step: 3 },
    'design.err_no_instrument': { cat: 'inst', step: 4 },
    'design.err_too_many': { cat: 'inst', step: 4 },
    'spof.no_meda': { cat: 'inst', step: 4 },
    'spof.no_xband': { cat: 'comm', step: 5 },
    'spof.no_repair_kit': { cat: 'comm', step: 5 }
  };
  function issuesOf(tot) {
    return tot.errors
      .map((k) => Object.assign({ k, crit: true }, ISSUE[k] || { cat: 'budget', step: 5 }))
      .concat(tot.spof.map((k) => Object.assign({ k, crit: false }, ISSUE[k] || { cat: 'comm', step: 5 })));
  }

  /* ---------------- Bilgi balonları: Nedir? · Neden seçilir? · Oyunda ne değişir? ---------------- */
  // "Ne değişir?" satırı her çizimde veriden üretilir (S.DATA + Engineering.calcDesignTotals + Sim.transitVars):
  // bütçe çubukları, iniş değerleri ve oyun aynı formülleri kullanır, bu yüzden metin sayılarla çelişmez.
  const findById = (list, id) => S.Engineering.findById(list, id);
  const round1 = (v) => S.util.round1(v);
  const join = (parts) => parts.filter(Boolean).join(' · ');
  const TIP_GROUP = { objectiveFocus: 'obj', rocketId: 'rocket', orbitType: 'orbit', landingSiteId: 'site', powerSource: 'pwr', insulation: 'ins', commArchitecture: 'comm' };

  DS.parseValue = (f, v) => (f === 'batteryKwh' || f === 'repairKits' ? Number(v) : f === 'launchWindowCaught' ? v === true || v === 'true' : v);

  /** Bu seçenek seçilseydi tasarım (diğer seçimler aynı kalır) */
  function withChoice(d, f, v) {
    const alt = Object.assign({}, d, { instruments: d.instruments.slice() });
    alt[f] = v;
    return alt;
  }
  /** Nominal transitle iniş değerleri: Sim.land ile aynı kod yolu (yakıt, moral) */
  const landing = (s, design) => S.Sim.transitVars({ demoMode: s.demoMode, design }, S.Sim.transitOutcome(null));

  const moneyText = (tot) =>
    tot.moneyUsed <= tot.moneyMax ? t('tip.money_left', { left: tot.moneyMax - tot.moneyUsed }) : t('tip.money_over', { over: tot.moneyUsed - tot.moneyMax });
  const massText = (tot) =>
    tot.massUsed <= tot.massMax ? t('tip.mass_margin', { pct: tot.massMarginPct }) : t('tip.mass_over', { over: round1(tot.massUsed - tot.massMax) });
  function nightText(tot, design) {
    const bats = S.DATA.habitat.batteries;
    const kwh = (bats.find((b) => b.kwh === design.batteryKwh) || bats[1]).kwh;
    if (tot.batteryNightSafe) return t('tip.night_ok', { need: tot.nightNeedKwh, kwh, left: Math.round(((kwh - tot.nightNeedKwh) / kwh) * 100) });
    return t('tip.night_short', { need: tot.nightNeedKwh, kwh, short: round1(tot.nightNeedKwh - kwh) });
  }
  const dataText = (tot) => t('tip.data_left', { left: tot.reportDataMbit, cap: tot.dataPerSolMbit, inst: tot.instrumentDataMbit });

  DS.optionEffect = function (s, d, f, v) {
    const D = S.DATA;
    const alt = withChoice(d, f, v);
    const tot = S.Engineering.calcDesignTotals(alt);
    if (f === 'objectiveFocus') {
      const o = findById(D.objectives, v);
      const th = s.demoMode ? D.demoSuccess : o;
      return t('tip.fx.obj', {
        fm: o.forensicsMultiplier, em: o.experimentsMultiplier,
        ff: th.fullSuccess.forensicsSent, fe: th.fullSuccess.experimentsSent, mf: th.minSuccess.forensicsSent, me: th.minSuccess.experimentsSent
      });
    }
    if (f === 'rocketId') {
      const cb = D.gameplay.cargoBonus;
      return join([t('tip.fx.rocket', { max: tot.massMax, m: findById(D.rockets, v).costM }), massText(tot), moneyText(tot), cb ? t('tip.cargo_bonus', { min: cb.minMarginPct, o2: cb.o2Kg, w: cb.waterL }) : '']);
    }
    if (f === 'orbitType') {
      const o = findById(D.orbits, v);
      const limit = D.constants.radiation.careerLimitMsv;
      return join([
        t('tip.fx.orbit', { days: o.transitDays, dose: tot.transitDoseMsv, limit, room: Math.round(limit - tot.transitDoseMsv), fuel: landing(s, alt).fuel }),
        o.payloadPenaltyKg || o.costPenaltyM ? t('tip.fx.orbit_cost', { kg: o.payloadPenaltyKg, m: o.costPenaltyM }) : '',
        massText(tot),
        moneyText(tot)
      ]);
    }
    if (f === 'launchWindowCaught') {
      const morale = landing(s, alt).morale;
      return v
        ? t('tip.fx.window_caught', { morale })
        : join([t('tip.fx.window_missed', { m: D.constants.synodicPeriod.missedWindowCostM, morale, perSol: Math.abs(D.gameplay.moralePerSol) }), moneyText(tot)]);
    }
    if (f === 'landingSiteId') {
      const x = findById(D.landingSites, v);
      return join([t('tip.fx.site', { w: Math.round(tot.solarNoonW), day: x.dayMaxC, night: x.nightMinC, water: x.waterStartL }), nightText(tot, alt)]);
    }
    if (f === 'powerSource') {
      const p = D.habitat.powerSource[v];
      const ds = D.constants.dustStorm;
      const head = p.rtgW > 0
        ? t('tip.fx.pwr_rtg', { rtg: p.rtgW, heat: p.rtgWasteHeatW })
        : t('tip.fx.pwr_solar', { storm: Math.round((1 - Math.exp(-ds.solarTransmissionK * ds.gameTau)) * 100) });
      return join([head, nightText(tot, alt), massText(tot), moneyText(tot)]);
    }
    if (f === 'batteryKwh') {
      const b = D.habitat.batteries.find((x) => x.kwh === v) || D.habitat.batteries[1];
      return join([nightText(tot, alt), t('tip.fx.bat', { kg: b.massKg, m: b.costM, pen: D.scoring.lostSystemPenaltyPoints }), massText(tot)]);
    }
    if (f === 'insulation') {
      const site = findById(D.landingSites, alt.landingSiteId);
      return join([t('tip.fx.ins', { ua: D.habitat.insulation[v].uaWPerK, heat: tot.heatingNightW, night: site.nightMinC }), nightText(tot, alt), massText(tot)]);
    }
    if (f === 'commArchitecture') {
      return join([
        dataText(tot),
        t('tip.fx.comm_ufo', { ufo: S.Score.ufoDownloadPct({ design: alt }) }),
        t(v === 'relay_xband' ? 'tip.fx.comm_xband' : 'tip.fx.comm_uhf'),
        moneyText(tot)
      ]);
    }
    if (f === 'repairKits') {
      const A = D.gameplay.actions;
      // Kit isteyen ya da kitle daha iyi sonuçlanan kriz seçenekleri (events_catalog)
      const usesKit = (o) => (o.requires && o.requires.inventory === 'repairKits') || (o.alts || []).some((a) => a.when && a.when.inventory === 'repairKits');
      const list = D.events.crises.filter((c) => c.options.some(usesKit)).map((c) => t('crisis.' + c.id + '.short')).join(', ');
      const head = v > 0
        ? t('tip.fx.kits', { n: v, kitMin: A.repairSuitKitMin, noKitMin: A.repairSuitMin, pct: A.repairSuitIntegrity, list })
        : t('tip.fx.kits_none', { noKitMin: A.repairSuitMin, pct: A.repairSuitIntegrity, list });
      return join([head, massText(tot), moneyText(tot)]);
    }
    return '';
  };

  DS.optionTip = function (s, d, f, v, title) {
    let what;
    let why;
    if (f === 'batteryKwh') {
      what = t('tip.bat.what');
      why = t('tip.bat.why_' + Math.max(0, S.DATA.habitat.batteries.findIndex((b) => b.kwh === v)));
    } else if (f === 'repairKits') {
      what = t('tip.kits.what');
      why = t('tip.kits.why_' + v);
    } else if (f === 'launchWindowCaught') {
      const id = v ? 'caught' : 'missed';
      what = t('tip.window.' + id + '.what', { months: S.DATA.constants.synodicPeriod.months });
      why = t('tip.window.' + id + '.why');
    } else {
      what = t('tip.' + TIP_GROUP[f] + '.' + v + '.what');
      why = t('tip.' + TIP_GROUP[f] + '.' + v + '.why');
    }
    return S.UI.tipHtml(title, [[t('tip.lbl_what'), what, 'what'], [t('tip.lbl_why'), why, 'why'], [t('tip.lbl_fx'), DS.optionEffect(s, d, f, v), 'fx']]);
  };

  /** Alete özgü oynanış etkileri (sayılar veriden) */
  const INST_FX = {
    mastcam_z: (s, d) => t('tip.inst.mastcam_z.fx', { hi: S.Score.ufoDownloadPct({ design: withChoice(d, 'instruments', d.instruments.concat('mastcam_z')) }), lo: S.DATA.ufo.lowResPct }),
    rimfax: () => t('tip.inst.rimfax.fx', { m: S.DATA.terrain.iceDepositM, min: S.DATA.terrain.iceDigMinutes, l: S.DATA.terrain.iceDigWaterL }),
    moxie: (s, d) => {
      const c = S.DATA.constants;
      return t('tip.inst.moxie.fx', {
        day: c.moxie.o2GramsPerHourDay, night: c.moxie.o2GramsPerHourNight, fuel: c.sabatier.mavFuelPctPerBatch,
        kwh: c.sabatier.energyKwh, l: c.sabatier.waterL, start: landing(s, d).fuel, bonus: S.DATA.scoring.safeReturnBonusPoints
      });
    },
    veggie: () => {
      const g = S.DATA.habitat.greenhouse;
      return t('tip.inst.veggie.fx', { m: g.moralePerSolHealthy, tend: g.tendMorale, l: g.tendWaterL, w: g.powerW, pen: S.DATA.scoring.lostSystemPenaltyPoints });
    },
    ingenuity: () => t('tip.inst.ingenuity.fx', { m: S.DATA.terrain.wreckVisibleWithoutDroneM, f: Math.round(S.DATA.terrain.sandPitSpeedFactor * 100) })
  };

  /** Alet etkisi: kütle/güç/veri + özel etki + veriden türeyen uyarı, kriz, kanıt ve deney listeleri */
  DS.instrumentEffect = function (s, d, inst) {
    const D = S.DATA;
    const id = inst.id;
    const names = (list, key) => list.map(key).join(', ');
    const parts = [t('tip.fx.inst', { kg: inst.massKg, w: inst.powerW, mbit: inst.dataMbit })];
    if (INST_FX[id]) parts.push(INST_FX[id](s, d));
    const warns = D.events.crises.filter((c) => c.warnInstrument === id);
    if (warns.length) parts.push(t('tip.inst_warn', { list: names(warns, (c) => t('crisis.' + c.id + '.short')) }));
    const better = D.events.crises.filter((c) =>
      c.options.some((o) => (o.requires && o.requires.instrument === id) || (o.alts || []).some((a) => a.when && a.when.instrument === id))
    );
    if (better.length) parts.push(t('tip.inst_crisis', { list: names(better, (c) => t('crisis.' + c.id + '.short')) }));
    const evidence = D.forensics.evidenceTypes.filter((e) => e.instrumentBonus === id);
    if (evidence.length) parts.push(t('tip.inst_evidence', { list: names(evidence, (e) => t('ev.' + e.id)) }));
    const exps = D.experimentsCfg.experiments.filter((e) => e.requiredInstrument === id);
    if (exps.length) parts.push(t('tip.inst_exp', { list: names(exps, (e) => t('exp.' + e.id + '.name')) }));
    return join(parts);
  };

  DS.instrumentTip = (s, d, inst) =>
    S.UI.tipHtml(t('inst.' + inst.id + '.name'), [
      [t('tip.lbl_what'), t('tip.inst.' + inst.id + '.what'), 'what'],
      [t('tip.lbl_why'), t('tip.inst.' + inst.id + '.why'), 'why'],
      [t('tip.lbl_fx'), DS.instrumentEffect(s, d, inst), 'fx']
    ]);

  /** Üst bütçe çubukları: sınırın anlamı ve bu tasarımdaki durumu */
  DS.budgetTip = function (d, tot, key) {
    const D = S.DATA;
    const fx = {
      money: () => join([t('tip.budget.money.fx', { used: tot.moneyUsed, max: tot.moneyMax }), moneyText(tot)]),
      mass: () => join([t('tip.budget.mass.fx', { used: tot.massUsed, max: tot.massMax, good: D.habitat.massMarginGoodPct, bonus: D.scoring.massMarginBonusPoints }), massText(tot)]),
      power: () => join([t('tip.budget.power.fx', { load: tot.nightLoadW, rtg: tot.rtgW, h: tot.nightHours }), nightText(tot, d)]),
      data: () =>
        join([
          dataText(tot),
          t(tot.reportDataMbit <= 0 ? 'tip.budget.data.fx_zero' : tot.reportDataMbit < tot.largestReportMbit ? 'tip.budget.data.fx' : 'tip.budget.data.fx_ok', { big: tot.largestReportMbit })
        ])
    }[key]();
    return S.UI.tipHtml(t('budget.' + key), [
      [t('tip.lbl_what'), t('tip.budget.' + key + '.what'), 'what'],
      [t('tip.lbl_matters'), t('tip.budget.' + key + '.why'), 'why'],
      [t('tip.lbl_now'), fx, 'fx']
    ]);
  };

  /* ---------- Shared parts ---------- */
  const chk = (on) => '<span class="dz-chk' + (on ? ' on' : '') + '" aria-hidden="true">' + (on ? I('check') : '') + '</span>';
  const money = (m) => '$' + m + 'M';
  /** Single-choice option (radio semantics). attrs = data-* string; k = stable focus key */
  /** Bilgi balonu: data-f/data-v taşıyan her seçenek "Nedir? · Neden seçilir? · Oyunda ne değişir?" gösterir */
  const TIP_FIELDS = ['objectiveFocus', 'rocketId', 'orbitType', 'landingSiteId', 'powerSource', 'insulation', 'commArchitecture', 'batteryKwh', 'repairKits', 'launchWindowCaught'];
  function optTip(attrs) {
    const m = /data-f="(\w+)" data-v="([^"]*)"/.exec(attrs);
    const s = S.getState();
    if (!m || !s || !TIP_FIELDS.includes(m[1])) return '';
    return S.UI.tipAttr(DS.optionTip(s, s.design, m[1], DS.parseValue(m[1], m[2]), null));
  }
  const radio = (k, attrs, sel, inner, cls) =>
    '<button type="button" role="radio" aria-checked="' + sel + '" class="' + cls + (sel ? ' sel' : '') + '" data-k="' + k + '" ' + attrs + optTip(attrs) + '>' + inner + '</button>';
  const seg = (field, label, items) =>
    '<div class="dz-seg" role="radiogroup" aria-label="' + label + '">' +
    items.map(([v, txt, sel]) => radio(field + '-' + v, 'data-f="' + field + '" data-v="' + v + '"', sel, '<span>' + txt + '</span>' + chk(sel), 'dz-sopt')).join('') +
    '</div>';
  const bar = (used, max) => {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 100;
    return '<span class="dz-bar' + (used > max ? ' over' : '') + '"><i style="width:' + pct + '%"></i></span>';
  };
  const kv = (label, value, extra, cls) => '<div class="dz-kv' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><b>' + value + '</b>' + (extra || '') + '</div>';
  const note = (k, cls) => '<p class="dz-note ' + (cls || 'warn') + '">' + I('alert') + '<span>' + t(k) + '</span></p>';

  function topHtml(s) {
    return (
      '<header class="dz-top"><div class="dz-brand">' + marsLogo() + '<div><b>SOL14</b><small>RED HORIZON</small></div></div>' +
      '<div class="dz-ttl">' + t('prep.title') + '</div><div class="dz-mode">' + t('prep.mode', { n: s.maxSols }) + '</div></header>'
    );
  }
  function stepsHtml(n) {
    return (
      '<nav class="dz-steps" aria-label="' + t('prep.steps_label') + '"><ol>' +
      [1, 2, 3, 4, 5]
        .map((i) => {
          const state = i === n ? 'cur' : i <= DS.maxStep ? 'done' : 'todo';
          return (
            '<li><button type="button" class="dz-step ' + state + '" data-k="step' + i + '" data-go="' + i + '"' +
            (i === n ? ' aria-current="step"' : '') + (i > DS.maxStep ? ' disabled' : '') + '><span>' + i + '</span> ' + t('prep.step' + i) + '</button></li>'
          );
        })
        .join('') +
      '</ol></nav>'
    );
  }

  /* ---------- Step 1: objective ---------- */
  function step1(s, d) {
    const D = S.DATA;
    const left =
      '<div class="dz-list" role="radiogroup" aria-label="' + t('prep.s1_title') + '">' +
      D.objectives
        .map((o) => {
          const sel = o.id === d.objectiveFocus;
          return radio(
            'obj-' + o.id, 'data-f="objectiveFocus" data-v="' + o.id + '"', sel,
            '<span class="dz-pic">' + objIcon(o.id) + '</span><span class="dz-txt"><b>' + t('obj.' + o.id + '.short_name') + '</b><small>' + t('obj.' + o.id + '.short') + '</small></span>' + chk(sel),
            'dz-row big'
          );
        })
        .join('') +
      '</div>';
    const o = D.objectives.find((x) => x.id === d.objectiveFocus) || D.objectives[0];
    const th = s.demoMode ? D.demoSuccess : o; // quick mode uses its own thresholds (existing rule)
    const right =
      '<h2>' + t('prep.goal_title') + '</h2>' +
      '<div class="dz-hl"><small>' + t('prep.goal_min') + '</small><b>' + t('prep.goal_rf', { f: th.minSuccess.forensicsSent, e: th.minSuccess.experimentsSent }) + '</b></div>' +
      kv(t('prep.goal_full'), t('prep.goal_rf', { f: th.fullSuccess.forensicsSent, e: th.fullSuccess.experimentsSent })) +
      '<p class="dz-p">' + t('prep.goal_return') + '</p>' +
      '<p class="dz-p dim">' + t('design.goal_mult', { f: o.forensicsMultiplier, e: o.experimentsMultiplier }) + '</p>' +
      '<div class="dz-learn">' + I('doc') + '<div><b>' + t('prep.goal_learn') + '</b><span>' + t('prep.learn.' + o.id) + '</span></div></div>';
    return { left, right };
  }

  /* ---------- Step 2: rocket + route ---------- */
  function step2(s, d, tot) {
    const D = S.DATA;
    const showWhen = DS.openWhen || !d.launchWindowCaught; // a missed window always stays visible
    const left =
      '<div class="dz-rockets" role="radiogroup" aria-label="' + t('prep.step2') + '">' +
      D.rockets
        .map((r) => {
          const sel = r.id === d.rocketId;
          return (
            '<div class="dz-rk' + (sel ? ' sel' : '') + '">' +
            radio('rk-' + r.id, 'data-f="rocketId" data-v="' + r.id + '"', sel,
              '<span class="dz-rk-art">' + rocketArt(r.id) + '</span><b>' + r.name + '</b><small>' + t('prep.rk_cap', { kg: r.payloadMarsKg }) + ' · ' + money(r.costM) + '</small>' + chk(sel),
              'dz-rk-pick') +
            '<button type="button" class="dz-link" data-k="tech-' + r.id + '" data-tech="' + r.id + '">' + t('prep.tech') + ' +</button></div>'
          );
        })
        .join('') +
      '</div>' +
      '<p class="dz-label">' + t('design.route') + '</p>' +
      '<div class="dz-routes" role="radiogroup" aria-label="' + t('design.route') + '">' +
      D.orbits
        .map((o) => {
          const sel = o.id === d.orbitType;
          const pen = o.payloadPenaltyKg || o.costPenaltyM ? t('prep.route_pen', { kg: o.payloadPenaltyKg, m: o.costPenaltyM }) : t('prep.route_free');
          return radio('orb-' + o.id, 'data-f="orbitType" data-v="' + o.id + '"', sel,
            '<span class="dz-route-ico">' + routeIcon(o.id === 'fast_transfer') + '</span><span class="dz-txt"><b>' + t('orbit.' + o.id + '.short') + '</b><small>' + pen + '</small></span>' + chk(sel),
            'dz-row slim');
        })
        .join('') +
      '</div>' +
      '<button type="button" class="dz-fold" data-k="fold" data-fold aria-expanded="' + showWhen + '">' + I('calendar') + '<span>' + t('design.when') + '</span><b>' + (showWhen ? '−' : '+') + '</b></button>' +
      (showWhen
        ? seg('launchWindowCaught', t('design.when'), [['true', t('window.caught'), d.launchWindowCaught], ['false', t('window.missed'), !d.launchWindowCaught]]) +
          '<p class="dz-p small">' + (d.launchWindowCaught ? t('window.caught_desc', { months: D.constants.synodicPeriod.months }) : t('window.missed_desc', { m: D.constants.synodicPeriod.missedWindowCostM })) + '</p>'
        : '');
    const r = S.Engineering.findById(D.rockets, d.rocketId);
    const o = S.Engineering.findById(D.orbits, d.orbitType);
    const launchCost = r.costM + o.costPenaltyM + (d.launchWindowCaught ? 0 : D.constants.synodicPeriod.missedWindowCostM);
    const right =
      '<h2>' + t('prep.impact') + '</h2>' +
      kv(t('prep.cap_load'), tot.massUsed + ' / ' + tot.massMax + ' kg', bar(tot.massUsed, tot.massMax), tot.massUsed > tot.massMax ? 'over' : '') +
      kv(t('prep.launch_cost'), money(launchCost)) +
      kv(t('prep.budget_used'), money(tot.moneyUsed) + ' / ' + money(tot.moneyMax), bar(tot.moneyUsed, tot.moneyMax), tot.moneyUsed > tot.moneyMax ? 'over' : '') +
      kv(t('prep.travel'), t('prep.travel_v', { days: tot.transitDays, dose: tot.transitDoseMsv })) +
      (tot.spof.includes('spof.low_mass_margin') ? note('spof.low_mass_margin') : '');
    return { left, right };
  }

  /* ---------- Step 3: habitat ---------- */
  function step3(s, d, tot) {
    const D = S.DATA;
    const frow = (icon, label, ctrl) => '<div class="dz-frow"><span class="dz-pic">' + iconRow(icon) + '</span><span class="dz-flabel">' + label + '</span><div class="dz-fctrl">' + ctrl + '</div></div>';
    const left =
      '<div class="dz-form">' +
      frow('crater', t('design.l_site'),
        '<select class="dz-select" data-k="site" data-sel="landingSiteId" aria-label="' + t('design.l_site') + '">' +
        D.landingSites.map((x) => '<option value="' + x.id + '"' + (x.id === d.landingSiteId ? ' selected' : '') + '>' + t('site.' + x.id + '.name') + '</option>').join('') + '</select>') +
      frow('panel', t('prep.l_power'), seg('powerSource', t('prep.l_power'), Object.keys(D.habitat.powerSource).map((p) => [p, t('pwr.' + p + '.short'), d.powerSource === p]))) +
      frow('battery', t('design.l_battery'), seg('batteryKwh', t('design.l_battery'), D.habitat.batteries.map((b) => [b.kwh, b.kwh + ' kWh', d.batteryKwh === b.kwh]))) +
      frow('layers', t('design.l_ins'), seg('insulation', t('design.l_ins'), Object.keys(D.habitat.insulation).map((k) => [k, t('ins.' + k + '.short'), d.insulation === k]))) +
      '</div>';
    const site = S.Engineering.findById(D.landingSites, d.landingSiteId);
    const warns = ['spof.small_battery', 'spof.thin_insulation_cold', 'spof.no_rtg'].filter((k) => tot.spof.includes(k));
    const right =
      '<h2>' + t('prep.night_title') + '</h2>' +
      kv(t('prep.night_need'), tot.nightNeedKwh + ' kWh') +
      kv(t('prep.night_batt'), d.batteryKwh + ' kWh', bar(tot.nightNeedKwh, d.batteryKwh), tot.batteryNightSafe ? '' : 'over') +
      kv(t('prep.night_load'), tot.nightLoadW + ' W' + (tot.rtgW ? ' · RTG ' + tot.rtgW + ' W' : '')) +
      '<p class="dz-p dim">' + t('site.' + site.id + '.name') + ' · ' + t('prep.site_temp', { max: site.dayMaxC, min: site.nightMinC }) + '</p>' +
      '<button type="button" class="dz-link more" data-k="energy" data-energy>' + I('power') + t('prep.energy_more') + ' +</button>' +
      // The most important warning only; the full list is on the final check (step 5)
      (warns.length ? note(warns[0]) : '<p class="dz-note ok">' + I('check') + '<span>' + t('prep.night_ok') + '</span></p>');
    return { left, right };
  }

  /* ---------- Step 4: instruments (all existing instruments, checkbox semantics) ---------- */
  function step4(s, d, tot) {
    const D = S.DATA;
    const left =
      '<div class="dz-insts" role="group" aria-label="' + t('prep.s4_title') + '">' +
      D.instruments
        .map((inst) => {
          const on = d.instruments.includes(inst.id);
          return (
            '<button type="button" role="checkbox" aria-checked="' + on + '" class="dz-inst' + (on ? ' sel' : '') + '" data-k="inst-' + inst.id + '" data-inst="' + inst.id + '"' + S.UI.tipAttr(DS.instrumentTip(s, d, inst)) + '>' +
            '<span class="dz-pic">' + iconInst(inst.id) + '</span><span class="dz-txt"><b>' + t('inst.' + inst.id + '.name') + '</b><small>' + t('inst.' + inst.id + '.what') + '</small>' +
            '<em>' + t('prep.inst_card', { kg: inst.massKg, m: inst.costM }) + '</em></span>' + chk(on) + '</button>'
          );
        })
        .join('') +
      '</div>';
    const insts = d.instruments.map((id) => D.instruments.find((i) => i.id === id)).filter(Boolean);
    const exps = (D.experimentsCfg && D.experimentsCfg.experiments) || [];
    const unlocked = exps.filter((e) => e.requiredInstrument && d.instruments.includes(e.requiredInstrument));
    const free = exps.filter((e) => !e.requiredInstrument).length;
    const right =
      '<h2>' + t('prep.inst_sel', { n: insts.length }) + '</h2>' +
      '<p class="dz-label">' + t('prep.inst_unlocks') + '</p>' +
      '<ul class="dz-ul">' + unlocked.map((e) => '<li>' + t('exp.' + e.id + '.name') + '</li>').join('') + '<li class="dim">' + t('prep.inst_free', { n: free }) + '</li></ul>' +
      kv(t('prep.inst_load'), t('prep.inst_load_v', {
        kg: Math.round(insts.reduce((a, i) => a + i.massKg, 0) * 10) / 10,
        m: insts.reduce((a, i) => a + i.costM, 0),
        w: tot.instrumentW
      })) +
      '<p class="dz-p dim">' + t('prep.inst_hint') + '</p>' +
      (tot.errors.includes('design.err_no_instrument') ? note('design.err_no_instrument', 'crit') : '') +
      (tot.spof.includes('spof.no_meda') ? note('spof.no_meda') : '') +
      '<button type="button" class="dz-link more" data-k="allinst" data-allinst>' + I('doc') + t('prep.inst_all') + ' +</button>';
    return { left, right };
  }

  /* ---------- Step 5: final check ---------- */
  function step5(s, d, tot) {
    const D = S.DATA;
    const kit = D.habitat.repairKit;
    const passes = (c) => D.habitat.relayPasses.filter((p) => !p.requires || p.requires === c).reduce((a, p) => a + p.capacityMbit, 0);
    const left =
      '<p class="dz-label">' + t('prep.comm') + '</p>' +
      '<div class="dz-list" role="radiogroup" aria-label="' + t('prep.comm') + '">' +
      Object.keys(D.habitat.comms)
        .map((c) => {
          const sel = c === d.commArchitecture;
          const cm = D.habitat.comms[c];
          return radio('comm-' + c, 'data-f="commArchitecture" data-v="' + c + '"', sel,
            '<span class="dz-pic">' + commIcon(c) + '</span><span class="dz-txt"><b>' + t('comm.' + c + '.short') + '</b><small>' + t('comm.' + c + '.sub') +
            ' · ' + t('prep.comm_v', { mbit: passes(c), kg: cm.massKg, m: cm.costM }) + '</small></span>' + chk(sel),
            'dz-row');
        })
        .join('') +
      '</div>' +
      '<div class="dz-kitrow"><span class="dz-pic">' + iconRow('kit') + '</span><span class="dz-txt"><b>' + t('design.l_kits') + '</b><small>' +
      t('prep.kits_v', { kg: kit.massKg, m: kit.costM, max: kit.max }) + '</small></span>' +
      '<span class="dz-stepper"><button type="button" data-k="kit-" data-kit="-1" aria-label="− ' + t('design.l_kits') + '"' + (d.repairKits <= 0 ? ' disabled' : '') + '>−</button>' +
      '<output aria-live="polite">' + d.repairKits + '</output>' +
      '<button type="button" data-k="kit+" data-kit="1" aria-label="+ ' + t('design.l_kits') + '"' + (d.repairKits >= kit.max ? ' disabled' : '') + '>+</button></span></div>' +
      summaryHtml(d);

    const iss = issuesOf(tot);
    const rows = [
      ['budget', 'weight', t('prep.c_budget'), money(tot.moneyUsed) + ' / ' + money(tot.moneyMax)],
      ['mass', 'rocket', t('prep.c_mass'), tot.massUsed + ' / ' + tot.massMax + ' kg'],
      ['energy', 'power', t('prep.c_energy'), tot.nightNeedKwh + ' / ' + d.batteryKwh + ' kWh'],
      ['inst', 'flask', t('prep.c_inst'), t('prep.c_inst_v', { n: d.instruments.length })],
      ['comm', 'signal', t('prep.c_comm'), tot.dataPerSolMbit + ' Mbit/sol']
    ];
    const crit = iss.filter((x) => x.crit).length;
    const right =
      '<h2>' + t('prep.ready') + '</h2><ul class="dz-checks">' +
      rows
        .map(([cat, ico, label, val]) => {
          const mine = iss.filter((x) => x.cat === cat);
          const st = mine.some((x) => x.crit) ? 'crit' : mine.length ? 'warn' : 'ok';
          const fixStep = mine.length ? (mine.find((x) => x.crit) || mine[0]).step : 5;
          return (
            '<li class="' + st + '"><div class="dz-crow">' + I(ico) + '<span>' + label + '</span><b>' + val + '</b>' +
            (fixStep !== 5 ? '<button type="button" class="dz-fix" data-k="fix-' + cat + '" data-go="' + fixStep + '">' + t('prep.fix') + ' →</button>' : '') +
            '<i class="dz-st" title="' + t(st === 'crit' ? 'prep.crit' : st === 'warn' ? 'prep.warn' : 'prep.ready') + '">' + I(st === 'ok' ? 'check' : 'alert') + '</i></div>' +
            mine.map((x) => '<p class="dz-iss ' + (x.crit ? 'crit' : 'warn') + '"><em>' + t(x.crit ? 'prep.crit' : 'prep.warn') + '</em> ' + t(x.k) + '</p>').join('') +
            '</li>'
          );
        })
        .join('') +
      '</ul>' +
      (crit ? note('prep.blocked_why', 'crit') : iss.length ? '<p class="dz-p dim">' + t('prep.warn_note') + '</p>' : '<p class="dz-note ok">' + I('check') + '<span>' + t('prep.all_ok') + '</span></p>');
    return { left, right };
  }
  function summaryHtml(d) {
    const D = S.DATA;
    const E = S.Engineering;
    const r = E.findById(D.rockets, d.rocketId);
    const line = (ico, txt) => '<li>' + I(ico) + '<span>' + txt + '</span></li>';
    return (
      '<div class="dz-sum"><b>' + t('prep.summary') + '</b><ul>' +
      line('target', t('obj.' + d.objectiveFocus + '.short_name')) +
      line('rocket', r.name + ' · ' + t('orbit.' + d.orbitType + '.short')) +
      line('map', t('site.' + d.landingSiteId + '.name') + ' · ' + t('pwr.' + d.powerSource + '.short')) +
      line('power', d.batteryKwh + ' kWh · ' + t('ins.' + d.insulation + '.name')) +
      line('flask', t('prep.sum_inst', { n: d.instruments.length }) + ': ' + d.instruments.map((id) => t('inst.' + id + '.short')).join(', ')) +
      '</ul></div>'
    );
  }

  /* ---------- Detail modals (details on demand) ---------- */
  const modalShell = (title, icon, body, extra) =>
    '<div class="panel action-modal dz-modal"><div class="modal-head"><h3>' + I(icon) + title + '</h3><button class="icon-btn" data-close aria-label="' + t('ui.close') + '">' + I('x') + '</button></div>' +
    body + '<div class="modal-actions">' + (extra || '') + '<button class="btn btn-primary" data-close>' + t('ui.close') + '</button></div></div>';

  function openResources(h) {
    const s = S.getState();
    const d = s.design;
    const D = S.DATA;
    const E = S.Engineering;
    const tot = E.calcDesignTotals(d);
    const hab = D.habitat;
    const r = E.findById(D.rockets, d.rocketId);
    const o = E.findById(D.orbits, d.orbitType);
    const pwr = hab.powerSource[d.powerSource] || hab.powerSource.solar_only;
    const bat = hab.batteries.find((b) => b.kwh === d.batteryKwh) || hab.batteries[1];
    const ins = hab.insulation[d.insulation] || hab.insulation.thick;
    const cm = hab.comms[d.commArchitecture] || hab.comms.relay_only;
    const insts = d.instruments.map((id) => D.instruments.find((i) => i.id === id)).filter(Boolean);
    const kits = Math.max(0, Math.min(hab.repairKit.max, d.repairKits || 0));
    const row = (label, cost, mass) => '<tr><td>' + label + '</td><td>' + money(cost) + '</td><td>' + (mass == null ? '—' : Math.round(mass * 10) / 10 + ' kg') + '</td></tr>';
    const body =
      '<table class="dz-table"><thead><tr><th>' + t('prep.r_item') + '</th><th>' + t('prep.r_cost') + '</th><th>' + t('prep.r_mass') + '</th></tr></thead><tbody>' +
      row(t('prep.r_rocket') + ' · ' + r.name, r.costM, null) +
      row(t('prep.r_route') + ' · ' + t('orbit.' + o.id + '.short'), o.costPenaltyM, null) +
      row(t('prep.r_window'), d.launchWindowCaught ? 0 : D.constants.synodicPeriod.missedWindowCostM, null) +
      row(t('prep.r_hab'), hab.base.costM, hab.base.massKg) +
      row(t('prep.r_power') + ' · ' + t('pwr.' + d.powerSource + '.short'), pwr.costM, pwr.massKg) +
      row(t('prep.r_battery') + ' · ' + bat.kwh + ' kWh', bat.costM, bat.massKg) +
      row(t('prep.r_ins') + ' · ' + t('ins.' + d.insulation + '.short'), ins.costM, ins.massKg) +
      row(t('prep.r_comm') + ' · ' + t('comm.' + d.commArchitecture + '.short'), cm.costM, cm.massKg) +
      row(t('prep.r_inst', { n: insts.length }), insts.reduce((a, i) => a + i.costM, 0), insts.reduce((a, i) => a + i.massKg, 0)) +
      row(t('prep.r_kits', { n: kits }), kits * hab.repairKit.costM, kits * hab.repairKit.massKg) +
      '</tbody><tfoot>' +
      '<tr class="' + (tot.moneyUsed > tot.moneyMax || tot.massUsed > tot.massMax ? 'over' : '') + '"><td>' + t('prep.r_total') + '</td><td class="' + (tot.moneyUsed > tot.moneyMax ? 'bad' : '') + '">' + money(tot.moneyUsed) +
      '</td><td class="' + (tot.massUsed > tot.massMax ? 'bad' : '') + '">' + tot.massUsed + ' kg</td></tr>' +
      '<tr><td>' + t('prep.r_limit') + '</td><td>' + money(tot.moneyMax) + '</td><td>' + tot.massMax + ' kg</td></tr></tfoot></table>' +
      '<p class="dz-mnote">' + t('prep.r_cap_note') + '</p>';
    const box = S.UI.openModal('prep-res', modalShell(t('prep.res'), 'weight', body, '<button class="btn btn-ghost" data-preset>' + t('design.preset') + '</button>'), {});
    box.querySelector('[data-preset]').addEventListener('click', () => {
      s.design = S.util.deepClone(S.State.DEFAULT_DESIGN);
      S.UI.closeModal('prep-res', true);
      DS.showDesign(h);
    });
  }

  function openEnergy() {
    const s = S.getState();
    const d = s.design;
    const D = S.DATA;
    const tot = S.Engineering.calcDesignTotals(d);
    const site = S.Engineering.findById(D.landingSites, d.landingSiteId);
    const ins = D.habitat.insulation[d.insulation] || D.habitat.insulation.thick;
    const pwr = D.habitat.powerSource[d.powerSource] || D.habitat.powerSource.solar_only;
    const row = (label, v, cls) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + label + '</td><td>' + v + '</td></tr>';
    const body =
      '<table class="dz-table"><thead><tr><th>' + t('prep.en_power') + '</th><th>W</th></tr></thead><tbody>' +
      row(t('prep.en_solar'), tot.solarNoonW + ' W') +
      row(t('prep.en_rtg'), tot.rtgW + ' W') +
      row(t('prep.en_life'), D.habitat.base.lifeSupportW + ' W') +
      row(t('prep.en_comms'), D.habitat.base.commsW + ' W') +
      row(t('prep.en_heat'), tot.heatingNightW + ' W') +
      row(t('prep.en_inst'), tot.instrumentW + ' W') +
      '</tbody><tfoot>' + row(t('prep.en_load'), tot.nightLoadW + ' W') + '</tfoot></table>' +
      '<table class="dz-table"><thead><tr><th>' + t('prep.en_energy') + '</th><th>kWh</th></tr></thead><tbody>' +
      row(t('prep.en_hours'), tot.nightHours + ' h') +
      row(t('prep.en_need'), tot.nightNeedKwh + ' kWh', tot.batteryNightSafe ? '' : 'over') +
      row(t('prep.en_batt'), d.batteryKwh + ' kWh') +
      '</tbody></table>' +
      '<p class="dz-mnote">' + t('prep.en_note', { ua: ins.uaWPerK, t: D.gameplay.habitatTargetC, c: site.nightMinC, w: pwr.rtgWasteHeatW }) + '</p>';
    S.UI.openModal('prep-energy', modalShell(t('prep.en_title'), 'power', body), {});
  }

  function openRocket(id) {
    const D = S.DATA;
    const r = S.Engineering.findById(D.rockets, id);
    const o = S.Engineering.findById(D.orbits, S.getState().design.orbitType);
    const body =
      '<div class="dz-mrk"><span class="dz-rk-art">' + rocketArt(r.id) + '</span><div>' +
      kv(t('prep.rk_payload'), r.payloadMarsKg + ' kg') + kv(t('prep.rk_cost'), money(r.costM)) +
      kv(t('orbit.' + o.id + '.short'), t('prep.route_pen', { kg: o.payloadPenaltyKg, m: o.costPenaltyM })) +
      kv(t('prep.cap_load'), r.payloadMarsKg - o.payloadPenaltyKg + ' kg') + '</div></div>' +
      '<p class="dz-mnote">' + t('prep.rk_note') + '</p>';
    S.UI.openModal('prep-tech', modalShell(r.name + ' · ' + t('prep.tech'), 'rocket', body), {});
  }

  function openInstruments() {
    const D = S.DATA;
    const d = S.getState().design;
    const body =
      '<div class="dz-mlist">' +
      D.instruments
        .map((i) =>
          '<div class="dz-mi' + (d.instruments.includes(i.id) ? ' sel' : '') + '"><span class="dz-pic">' + iconInst(i.id) + '</span><div><b>' + t('inst.' + i.id + '.name') + '</b>' +
          '<em>' + t('prep.inst_spec', { kg: i.massKg, w: i.powerW, mbit: i.dataMbit, m: i.costM }) + '</em><p>' + t('inst.' + i.id + '.desc') + '</p><p class="miss">' + t('inst.' + i.id + '.missing') + '</p></div></div>'
        )
        .join('') +
      '</div>';
    S.UI.openModal('prep-inst', modalShell(t('prep.inst_all'), 'flask', body), { cls: 'dz-wide' });
  }

  /* ---------- Screen ---------- */
  DS.showDesign = function (h) {
    const s = S.getState();
    const d = s.design;
    // New game → reset per-run UI memory (visited steps, launch guard)
    if (DS.stateRef !== s) {
      DS.stateRef = s;
      DS.maxStep = DS.step;
      DS.launching = false;
      DS.openWhen = false;
      DS.lastStep = 0;
    }
    DS.maxStep = Math.max(DS.maxStep || 1, DS.step);
    const n = DS.step;
    const tot = S.Engineering.calcDesignTotals(d);
    const parts = [step1, step2, step3, step4, step5][n - 1](s, d, tot);

    // Keep focus and scroll across re-renders (selection changes must not jump the layout)
    const layer = S.UI.screenLayer();
    const active = document.activeElement;
    const focusKey = active && layer.contains(active) && active.dataset ? active.dataset.k : null;
    const sameStep = DS.lastStep === n;
    const prevMain = layer.querySelector('.dz-main');
    const prevInfo = layer.querySelector('.dz-info');
    const scroll = sameStep && prevMain ? [prevMain.scrollTop, prevInfo ? prevInfo.scrollTop : 0] : [0, 0];

    const overMoney = tot.moneyUsed > tot.moneyMax;
    const overMass = tot.massUsed > tot.massMax;
    const crit = tot.errors.length;
    const nextBtn =
      n < 5
        ? '<button type="button" class="dz-next" data-k="next" data-next>' + t('prep.next' + (n + 1)) + I('arrowR') + '</button>'
        : '<button type="button" class="dz-next" data-k="launch" data-launch aria-describedby="dz-launch-note"' + (tot.canLaunch && !DS.launching ? '' : ' disabled') + '>' + t('prep.launch') + I('arrowR') + '</button>';
    const launchNote =
      n === 5
        ? '<span id="dz-launch-note" class="dz-gonote' + (crit ? ' crit' : '') + '">' + (crit ? I('alert') + t('prep.launch_blocked', { n: crit }) : t('prep.after_launch')) + '</span>'
        : '';
    const subVars = n === 4 ? { min: INST_MIN, max: INST_MAX } : undefined;
    const html =
      '<div class="screen dz' + (sameStep ? '' : ' enter') + '">' + topHtml(s) + stepsHtml(n) +
      '<div class="dz-head"><h1 tabindex="-1">' + t('prep.s' + n + '_title') + '</h1><p>' + t('prep.s' + n + '_sub', subVars) + '</p></div>' +
      '<section class="dz-main dz-s' + n + '">' + parts.left + '</section>' +
      '<aside class="dz-side dz-s' + n + (n === 5 && issuesOf(tot).length ? ' has-iss' : '') + '"><div class="dz-art">' + sceneFor(n, d) + '</div><div class="dz-info">' + parts.right + '</div></aside>' +
      '<footer class="dz-foot"><button type="button" class="dz-btn dz-back" data-k="back" data-back>' + I('arrowL') + t(n === 1 ? 'prep.to_menu' : 'ui.back') + '</button>' +
      '<button type="button" class="dz-btn dz-res' + (overMoney || overMass ? ' over' : '') + '" data-k="res" data-res aria-haspopup="dialog">' + I(overMoney || overMass ? 'alert' : 'weight') +
      '<span>' + t('prep.res') + '</span><small><b class="' + (overMoney ? 'bad' : '') + '">' + money(tot.moneyUsed) + ' / ' + money(tot.moneyMax) + '</b> · <b class="' + (overMass ? 'bad' : '') + '">' +
      tot.massUsed + ' / ' + tot.massMax + ' kg</b>' + (overMoney || overMass ? ' · ' + t('prep.res_over') : '') + '</small></button>' +
      '<div class="dz-go">' + launchNote + nextBtn + '</div></footer></div>';

    const root = S.UI.showScreen(html, 'scene-design');
    DS.lastStep = n;
    const main = root.querySelector('.dz-main');
    const info = root.querySelector('.dz-info');
    main.scrollTop = scroll[0];
    if (info) info.scrollTop = scroll[1];
    const again = focusKey && root.querySelector('[data-k="' + focusKey + '"]');
    if (again && !again.disabled) again.focus({ preventScroll: true });
    else if (!sameStep && focusKey) root.querySelector('.dz-head h1').focus({ preventScroll: true });

    const rerender = () => DS.showDesign(h);
    const go = (step) => {
      DS.step = Math.max(1, Math.min(5, step));
      rerender();
    };
    /** Apply a change; if it creates a new launch-blocking problem, say so instead of changing anything silently */
    const change = (fn) => {
      const before = S.Engineering.calcDesignTotals(s.design).errors;
      fn();
      const fresh = S.Engineering.calcDesignTotals(s.design).errors.filter((e) => !before.includes(e));
      rerender();
      if (fresh.length) S.UI.toast(I('alert') + t(fresh[0]), 'warn', 3600);
    };
    S.UI.bindClicks(root, {
      '[data-f]': (el) => {
        const f = el.dataset.f;
        let v = el.dataset.v;
        if (f === 'batteryKwh') v = Number(v);
        if (f === 'launchWindowCaught') v = v === 'true';
        if (s.design[f] === v) return;
        change(() => (s.design[f] = v));
      },
      '[data-inst]': (el) => {
        const id = el.dataset.inst;
        const list = s.design.instruments;
        if (list.includes(id)) change(() => (s.design.instruments = list.filter((x) => x !== id)));
        else if (list.length < INST_MAX) change(() => (s.design.instruments = list.concat(id)));
        else S.UI.toast(I('alert') + t('design.err_too_many'), 'warn');
      },
      '[data-kit]': (el) => {
        const max = S.DATA.habitat.repairKit.max;
        change(() => (s.design.repairKits = Math.max(0, Math.min(max, s.design.repairKits + Number(el.dataset.kit)))));
      },
      '[data-fold]': () => {
        DS.openWhen = !(DS.openWhen || !s.design.launchWindowCaught);
        rerender();
      },
      '[data-go]': (el) => go(Number(el.dataset.go)),
      '[data-back]': () => (n === 1 ? h.menu() : go(n - 1)),
      '[data-next]': () => go(n + 1),
      '[data-res]': () => openResources(h),
      '[data-energy]': () => openEnergy(),
      '[data-allinst]': () => openInstruments(),
      '[data-tech]': (el) => openRocket(el.dataset.tech),
      '[data-launch]': (el) => {
        // Exactly one launch: ignore repeat clicks / key repeats while the opening starts
        if (DS.launching || el.disabled) return;
        DS.launching = true;
        el.disabled = true;
        h.launch();
        if (S.getState().scene !== 'transit') {
          DS.launching = false; // launch refused (Sim.launch errors): stay here, show why
          rerender();
        }
      }
    });
    const sel = root.querySelector('[data-sel]');
    if (sel)
      sel.addEventListener('change', () => {
        S.bus.emit('audio:play', 'click');
        change(() => (s.design[sel.dataset.sel] = sel.value));
      });
    // Arrow keys move inside a radio group (selection follows focus); bound once on the shared layer
    if (!layer.dataset.dzKeys) {
      layer.dataset.dzKeys = '1';
      layer.addEventListener('keydown', (e) => {
        const el = e.target;
        if (!el.closest || !el.closest('.dz') || el.getAttribute('role') !== 'radio') return;
        const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!dir) return;
        const items = Array.from(el.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]'));
        const nx = items[(items.indexOf(el) + dir + items.length) % items.length];
        e.preventDefault();
        nx.focus();
        nx.click();
      });
    }
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
