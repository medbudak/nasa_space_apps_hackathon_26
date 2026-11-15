/**
 * SOL 14: RED HORIZON — Mekik atölyesi ve envanter (K1 + K2; ux-plan #8, 2026-11-15)
 * Üs sistemleri kitler hâlinde iner. Astronot mekiğin içindeki atölyede kargodaki kitlerle ve enkazlardan sökülen
 * parçalarla mühendislik çözümleri üretir. Her tarifin bir mühendislik seçimi olabilir (ör. tam dizi / yarım dizi);
 * üretimden önce ve sonra aynı formüllerle "ne değişir?" satırları hesaplanır (öğle gücü, O₂ g/sa, röle Mbit ...).
 * DOM'a dokunmaz; tüm durum s.inventory.items ve s.base içinde (kalıcı). Sayılar data/nasa_data.json → workshop.
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const W = {};
  const cfg = () => D().workshop;
  const round1 = (v) => Math.round(v * 10) / 10;

  W.recipes = () => cfg().recipes;
  const stationBuilt = (s, r) => (s.station && s.station.built[r.module]) || null;
  W.recipe = (id) => W.recipes().find((r) => r.id === id);
  W.items = (s) => (s.inventory && s.inventory.items) || {};
  W.count = (s, item) => W.items(s)[item] || 0;

  /** İnişte kargodan çıkan kitler: her görevde aynı temel kitler + seçilen alete bağlı kitler */
  W.startItems = function (design) {
    const c = cfg();
    const items = Object.assign({}, c.startItems);
    for (const [inst, item] of Object.entries(c.instrumentKits)) if (design.instruments.includes(inst)) items[item] = (items[item] || 0) + 1;
    return items;
  };

  /** Tarifin durumu: built | ready | locked (+ neden ve eksik malzeme) */
  W.status = function (s, id) {
    const r = W.recipe(id);
    if (!r) return { state: 'locked', reasonKey: 'ws.err_unknown' };
    // İstasyon modülleri (D-014): göktaşından önce yok; aynı modülün diğer kaynağı kurulunca gizlenir
    if (r.module) {
      if (!S.Station || !S.Station.impacted(s)) return { state: 'hidden' };
      const done = stationBuilt(s, r);
      if (done) return { state: done === r.id ? 'built' : 'hidden' };
      if (r.requiresModule && !s.station.built[r.requiresModule]) return { state: 'locked', reasonKey: 'ws.err_needs_module', vars: { what: S.t('station.mod.' + r.requiresModule) } };
    }
    if (r.builds && S.Sim.deployed(s, r.builds)) return { state: 'built' };
    if (r.once && (s.workshop || {})[id]) return { state: 'built' };
    if (r.requiresBuilt && !S.Sim.deployed(s, r.requiresBuilt)) return { state: 'locked', reasonKey: 'ws.err_needs_built', vars: { what: S.t('ws.' + r.requiresBuilt + '.name') } };
    if (r.onlyIfPartial && (s.base.solarFrac || 1) >= 1) return { state: 'built' };
    if (r.instrument && !S.Sim.has(s, r.instrument)) return { state: 'locked', reasonKey: 'ws.err_needs_inst', vars: { inst: S.t('inst.' + r.instrument + '.short') } };
    const missing = Object.entries(r.needs || {}).filter(([item, n]) => W.count(s, item) < n).map(([item]) => item);
    if (missing.length) return { state: 'locked', reasonKey: 'ws.err_missing', vars: { list: missing.map((i) => S.t('item.' + i + '.name')).join(', ') }, missing };
    return { state: 'ready' };
  };

  const minutesOf = (r, opt) => (opt && opt.minutes) || r.minutes;
  W.option = (r, optId) => (r.options ? r.options.find((o) => o.id === optId) || r.options[0] : null);

  /* ---------------- Etki satırları: aynı formüllerle önce → sonra ---------------- */
  function noonSolarW(s, frac) {
    const site = S.Sim.site(s);
    return Math.round(S.Engineering.calcSolarPower({ cosZ: site.cosZNoon, dustFactor: s.res.panelDust }) * frac);
  }
  function relayMbit(s, extra) {
    const passes = D().habitat.relayPasses.filter((p) => !p.requires || p.requires === s.design.commArchitecture);
    return passes.reduce((a, p) => a + p.capacityMbit, 0) + (s.downlink.extraMbit || 0) + (extra || 0);
  }
  /** rows: [{ key, before, after }] — metin anahtarı ws.fx.<key> (birim metinde) */
  W.effects = function (s, id, optId) {
    const r = W.recipe(id);
    const opt = W.option(r, optId);
    const c = D().constants;
    const rows = [];
    const curFrac = S.Sim.deployed(s, 'solar') ? s.base.solarFrac || 1 : 0;
    if (r.builds === 'solar' || r.id === 'solar_extend') {
      const to = r.id === 'solar_extend' ? 1 : opt.solarFrac;
      rows.push({ key: 'noon_w', before: noonSolarW(s, curFrac), after: noonSolarW(s, to) });
      rows.push({ key: 'area_pct', before: Math.round(curFrac * 100), after: Math.round(to * 100) });
    } else if (r.builds === 'isru') {
      rows.push({ key: 'o2_day', before: 0, after: c.moxie.o2GramsPerHourDay });
      rows.push({ key: 'moxie_w', before: 0, after: D().instruments.find((x) => x.id === 'moxie').powerW });
      rows.push({ key: 'fuel_ready', before: S.Sim.isruReady(s) ? 1 : 0, after: S.Sim.deployed(s, 'mav') ? 1 : 0, bool: true });
    } else if (r.builds === 'mav') {
      rows.push({ key: 'fuel_batch', before: 0, after: c.sabatier.mavFuelPctPerBatch });
      rows.push({ key: 'return_ok', before: 0, after: 1, bool: true });
    } else if (r.builds === 'greenhouse') {
      const g = D().habitat.greenhouse;
      rows.push({ key: 'morale_sol', before: 0, after: g.moralePerSolHealthy });
      rows.push({ key: 'load_w', before: 0, after: g.powerW });
    } else if (r.extraMbit) {
      rows.push({ key: 'relay_mbit', before: relayMbit(s, 0), after: relayMbit(s, r.extraMbit) });
    } else if (r.module) {
      const n = S.Station.builtCount(s);
      rows.push({ key: 'station_modules', before: n, after: n + 1 });
    } else if (r.repairKits) {
      rows.push({ key: 'repair_kits', before: s.inventory.repairKits, after: s.inventory.repairKits + r.repairKits });
    }
    return rows;
  };

  /** Üret ve kur: malzeme düşer, oyun dakikası harcanır, sistem açılır; sonuç = gerçekleşen önce → sonra */
  W.build = function (s, id, optId) {
    const r = W.recipe(id);
    const st = W.status(s, id);
    if (st.state !== 'ready') return { ok: false, errKey: st.reasonKey || 'ws.err_built', vars: st.vars };
    if (!s.player.inside) return { ok: false, errKey: 'ws.err_inside' };
    const opt = W.option(r, optId);
    const rows = W.effects(s, id, opt && opt.id);
    for (const [item, n] of Object.entries(r.needs || {})) s.inventory.items[item] -= n;
    if (r.builds) {
      if (r.builds === 'solar') s.base.solarFrac = opt ? opt.solarFrac : 1;
      S.Sim.deploy(s, r.builds, 1, 0);
    }
    if (r.id === 'solar_extend') s.base.solarFrac = 1;
    if (r.extraMbit) s.downlink.extraMbit += r.extraMbit;
    if (r.repairKits) s.inventory.repairKits += r.repairKits;
    if (r.module) s.station.built[r.module] = r.id;
    s.workshop = s.workshop || {};
    s.workshop[id] = opt ? opt.id : true;
    S.Sim.advance(s, minutesOf(r, opt));
    S.logDecision(
      { category: 'engineering', titleKey: 'log.ws.title', choiceKey: 'ws.' + id + '.name', resultKey: opt ? 'ws.' + id + '.opt.' + opt.id : 'ws.' + id + '.result', vars: {}, score: 0 },
      s
    );
    S.bus.emit('workshop:built', { id, option: opt && opt.id });
    S.bus.emit('audio:play', 'success');
    return { ok: true, id, option: opt && opt.id, rows, minutes: minutesOf(r, opt) };
  };

  W.minutes = (id, optId) => {
    const r = W.recipe(id);
    return minutesOf(r, W.option(r, optId));
  };

  /** Envanter görünümü: kitler + enkaz parçaları + kalıntı/kargo aracı buluntuları (sayısı > 0 olanlar) */
  W.inventoryList = function (s) {
    const inv = s.inventory;
    const list = Object.entries(W.items(s))
      .filter(([, n]) => n > 0)
      .map(([id, n]) => ({ id, n, kind: 'item' }));
    if (inv.repairKits > 0) list.push({ id: 'repair_kit', n: inv.repairKits, kind: 'stock' });
    if (inv.rhuUnits > 0) list.push({ id: 'rhu', n: inv.rhuUnits, kind: 'stock' });
    for (const p of (s.salvage && s.salvage.found) || []) list.push({ id: 'find_' + p, n: 1, kind: 'find' });
    return list;
  };
  /** Bu malzemeyi kullanan tarifler */
  W.usedIn = (item) => W.recipes().filter((r) => r.needs && r.needs[item]).map((r) => r.id);

  S.Workshop = W;
})((window.SOL14 = window.SOL14 || {}));
