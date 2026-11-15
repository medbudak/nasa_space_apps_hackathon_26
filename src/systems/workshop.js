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
    // Seviye 1-2-3 (Kişi 6): yalnızca bir sonraki seviye açılır; bedel (enerji / dış çalışma) karşılanmalı
    if (r.upgrade) {
      const lv = S.Sim.upgradeLevel(s, r.upgrade);
      if (lv >= r.level) return { state: 'built' };
      if (lv < r.level - 1) return { state: 'locked', reasonKey: 'ws.err_needs_level', vars: { what: S.t('upg.' + r.upgrade), level: r.level - 1 } };
    }
    if (r.once && (s.workshop || {})[id]) return { state: 'built' };
    if (r.requiresBuilt && !S.Sim.deployed(s, r.requiresBuilt)) return { state: 'locked', reasonKey: 'ws.err_needs_built', vars: { what: S.t('ws.' + r.requiresBuilt + '.name') } };
    if (r.onlyIfPartial && (s.base.solarFrac || 1) >= 1) return { state: 'built' };
    if (r.instrument && !S.Sim.has(s, r.instrument)) return { state: 'locked', reasonKey: 'ws.err_needs_inst', vars: { inst: S.t('inst.' + r.instrument + '.short') } };
    const missing = Object.entries(r.needs || {}).filter(([item, n]) => W.count(s, item) < n).map(([item]) => item);
    if (missing.length) return { state: 'locked', reasonKey: 'ws.err_missing', vars: { list: missing.map((i) => S.t('item.' + i + '.name')).join(', ') }, missing };
    if (r.upgrade) {
      const cost = W.upgradeCost(s, r);
      if (cost.energyKwh && s.res.energyKwh < cost.energyKwh) return { state: 'locked', reasonKey: 'ws.err_energy', vars: { kwh: cost.energyKwh } };
      if (cost.suitO2Pct && s.suit.o2 < cost.suitO2Pct + 5) return { state: 'locked', reasonKey: 'ws.err_suit_o2', vars: { pct: Math.ceil(cost.suitO2Pct + 5) } };
    }
    return { state: 'ready' };
  };

  const minutesOf = (r, opt) => (opt && opt.minutes) || r.minutes;

  /**
   * Yükseltmenin malzeme dışı bedeli (Kişi 6): roket = habitat bataryasından tek seferlik enerji;
   * istasyon = gövdede dış çalışma, elbise O₂ ve bataryası EVA hızıyla harcanır.
   */
  W.upgradeCost = function (s, r) {
    const u = cfg().upgrades[r.upgrade];
    const eva = D().constants.eva;
    const cost = {};
    if (u.energyKwh) cost.energyKwh = u.energyKwh[r.level - 1];
    if (u.evaMinutes) {
      const m = u.evaMinutes[r.level - 1];
      cost.evaMinutes = m;
      cost.suitO2Pct = round1(eva.suitO2PctPerMin * m);
      cost.suitBatteryPct = round1(S.Engineering.calcSuitBatteryDrainPctPerMin({ ambientC: S.Sim.ambient(s), integrity: s.suit.integrity }) * m);
    }
    return cost;
  };

  /** Bir yükseltmenin önce → sonra satırları: kazanç ve bedel yan yana (seviye satırı + takas) */
  function upgradeRows(s, r) {
    const u = cfg().upgrades[r.upgrade];
    const from = r.level - 2;
    const to = r.level - 1;
    const rows = [{ key: 'level', before: from + 1, after: to + 1 }];
    if (r.upgrade === 'greenhouse') {
      const g = D().habitat.greenhouse;
      rows.push({ key: 'yield_pct', before: s.greenhouse.yieldPct + u.yieldBonusPct[from], after: s.greenhouse.yieldPct + u.yieldBonusPct[to] });
      rows.push({ key: 'load_w', before: g.powerW + u.extraPowerW[from], after: g.powerW + u.extraPowerW[to] });
    } else if (r.upgrade === 'station') {
      const ua = S.Sim.insulationCfg(s).uaWPerK;
      const night = S.Sim.site(s).nightMinC; // en soğuk gece saatindeki ısı kaybı
      const loss = (f) => Math.round(ua * f * (D().gameplay.habitatTargetC - night));
      rows.push({ key: 'heat_loss_w', before: loss(u.uaFactor[from]), after: loss(u.uaFactor[to]) });
      const c = W.upgradeCost(s, r);
      rows.push({ key: 'suit_o2', before: Math.round(s.suit.o2), after: Math.round(s.suit.o2 - c.suitO2Pct) });
    } else if (r.upgrade === 'rocket') {
      const base = D().constants.sabatier.mavFuelPctPerBatch;
      rows.push({ key: 'fuel_batch', before: base + u.fuelBonusPct[from], after: base + u.fuelBonusPct[to] });
      rows.push({ key: 'energy_kwh', before: round1(s.res.energyKwh), after: round1(s.res.energyKwh - u.energyKwh[to]) });
    }
    return rows;
  }
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
    if (r.upgrade) return upgradeRows(s, r);
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
    if (r.upgrade) {
      const cost = W.upgradeCost(s, r);
      if (cost.energyKwh) s.res.energyKwh = round1(s.res.energyKwh - cost.energyKwh);
      if (cost.suitO2Pct) {
        s.suit.o2 = Math.max(0, round1(s.suit.o2 - cost.suitO2Pct));
        s.suit.battery = Math.max(0, round1(s.suit.battery - cost.suitBatteryPct));
      }
      s.upgrades = s.upgrades || {};
      s.upgrades[r.upgrade] = r.level;
    }
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
