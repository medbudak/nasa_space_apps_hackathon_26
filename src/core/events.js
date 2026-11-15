/**
 * SOL 14: RED HORIZON — Olay Motoru, Kriz Kartları (M2) ve Gecikmeli Görev Kontrol (M7) (K2)
 * Kriz tanımları ve sayısal bedeller data/events_catalog.json içindedir (bildirimsel "effects").
 * Bu modül yalnızca uygular; UI'a 'crisis:trigger' / 'crisis:resolved' olaylarıyla haber verir.
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const { clamp, round1, round2 } = S.util;

  const Ev = {};

  Ev.def = (id) => D().events.crises.find((c) => c.id === id);
  Ev.schedule = (s) => D().events.schedule[s.demoMode ? 'demo' : 'full'];

  /** Zamanı gelen planlı krizleri tetikler (dışarıda olmayı gerektirenler ertelenir) */
  Ev.checkSchedule = function (s) {
    if (s.crisis.active || s.gameOver || s.ending) return;
    if (Ev.isCalm(s)) return; // RIT-08: habitata dönüşten sonraki krizsiz pencere (krizler ertelenir, kaybolmaz)
    const m = S.Sim.clockMinute(s);
    for (const ev of Ev.schedule(s)) {
      const key = ev.sol + ':' + ev.id;
      if (ev.sol !== s.sol || s.crisis.fired[key]) continue;
      if (m < ev.minute) continue;
      const def = Ev.def(ev.id);
      if (!def) continue;
      if (def.outsideOnly && !S.Sim.isOutside(s)) continue; // EVA'ya çıkınca tetiklenir
      s.crisis.fired[key] = true;
      Ev.trigger(s, ev.id, {});
      return;
    }
  };

  // D-014 (proposed): inside the glacier ice cave crises wait too, for as long as the astronaut stays
  Ev.isCalm = (s) => Boolean((s.calmUntil && s.totalMinutes < s.calmUntil && s.player.inside) || (S.Sim.inShelter && S.Sim.inShelter(s)));

  /**
   * RIT-07 — Bugün yaklaşan (henüz tetiklenmemiş) planlı krizler. Uyarı aleti olmasa bile görsel ön işareti
   * olan olaylar (ör. ufukta yükselen toz duvarı: preSignalKey) kısa süre önceden HUD'da gösterilir.
   */
  Ev.upcoming = function (s, withinMin) {
    const m = S.Sim.clockMinute(s);
    return Ev.schedule(s)
      .filter((ev) => ev.sol === s.sol && !s.crisis.fired[ev.sol + ':' + ev.id] && ev.minute >= m && ev.minute - m <= withinMin)
      .map((ev) => ({ ev, def: Ev.def(ev.id), inMin: ev.minute - m }));
  };

  /** Bir seçeneğin kullanılabilir olup olmadığı */
  Ev.optionAvailable = function (s, opt) {
    const r = opt.requires;
    if (!r) return true;
    if (r.inventory) return (s.inventory[r.inventory] || 0) > 0;
    if (r.instrument) return S.Sim.has(s, r.instrument);
    if (r.comm) return s.design.commArchitecture === r.comm;
    return true;
  };

  /** Koşullu alternatif (alts) seçimi */
  Ev.resolveVariant = function (s, crisisId, opt, ctx) {
    for (const alt of opt.alts || []) {
      const w = alt.when || {};
      if (w.instrument && !S.Sim.has(s, w.instrument)) continue;
      if (w.inventory && !((s.inventory[w.inventory] || 0) > 0)) continue;
      if (w.reward && !s.rewards[w.reward]) continue;
      if (w.minigameMin !== undefined && !(ctx && ctx.minigame && ctx.minigame.score >= w.minigameMin)) continue;
      return { effects: alt.effects, score: alt.score, resultKey: alt.resultKey };
    }
    return {
      effects: opt.effects,
      score: opt.score,
      resultKey: 'crisis.' + crisisId + '.' + opt.id + '.res'
    };
  };

  Ev.trigger = function (s, id, { dynamic = false } = {}) {
    const def = Ev.def(id);
    if (!def || s.crisis.active) return null;
    if (def.onTrigger) Ev.applyEffects(s, def.onTrigger);
    const h = S.Sim.horizons(s);
    s.crisis.active = {
      id,
      dynamic,
      sol: s.sol,
      minute: Math.round(S.Sim.clockMinute(s)),
      consulted: false,
      lightDelaySec: h.seconds,
      roundTripMin: round1((h.seconds * 2) / 60),
      distanceM: Math.round(S.Sim.distanceFromHab(s)),
      outside: S.Sim.isOutside(s)
    };
    if (s.solStart) s.solStart.events.push(id);
    S.bus.emit('crisis:trigger', s.crisis.active);
    if (def.fx && def.fx !== 'none') S.bus.emit('fx:weather', { type: def.fx });
    S.bus.emit('audio:play', def.bonus ? 'bonus' : 'alarm');
    return s.crisis.active;
  };

  /** M7 — Görev Kontrol'e danış: cevap 2× ışık gecikmesi sonra gelir; bu sürede kaynaklar akar */
  Ev.consult = function (s) {
    const c = s.crisis.active;
    if (!c || c.consulted) return;
    const active = c;
    s.crisis.active = null; // bekleme sırasında yeni kriz tetiklenmesin diye geçici kaldır
    S.Sim.advance(s, active.roundTripMin);
    s.crisis.active = active;
    active.consulted = true;
    S.bus.emit('audio:play', 'downlink');
  };

  Ev.resolve = function (s, optionId, ctx = {}) {
    const c = s.crisis.active;
    if (!c) return null;
    const def = Ev.def(c.id);
    const opt = def.options.find((o) => o.id === optionId);
    if (!opt || !Ev.optionAvailable(s, opt)) return null;
    const variant = Ev.resolveVariant(s, c.id, opt, ctx);
    s.crisis.active = null;
    const extra = Ev.applyEffects(s, variant.effects);
    S.logDecision(
      {
        category: 'crisis',
        titleKey: 'crisis.' + c.id + '.title',
        choiceKey: 'crisis.' + c.id + '.' + opt.id + '.label',
        resultKey: variant.resultKey,
        vars: extra.vars || {},
        cost: Ev.describeEffects(variant.effects),
        score: variant.score,
        consulted: c.consulted
      },
      s
    );
    S.bus.emit('crisis:resolved', { id: c.id, option: opt.id, score: variant.score });
    S.bus.emit('audio:play', variant.score >= 0 ? 'success' : 'fail');
    return { resultKey: variant.resultKey, vars: extra.vars || {}, score: variant.score };
  };

  /** Bildirimsel etkileri durum üzerinde uygular */
  Ev.applyEffects = function (s, fx) {
    const d = D();
    const out = { vars: {} };
    if (!fx) return out;
    const r = s.res;
    const suit = s.suit;
    if (fx.energyKwh) r.energyKwh = clamp(r.energyKwh + fx.energyKwh, 0, r.batteryKwh);
    if (fx.o2ReserveKg) r.o2ReserveKg = Math.max(0, round2(r.o2ReserveKg + fx.o2ReserveKg));
    if (fx.waterL) r.waterL = Math.max(0, r.waterL + fx.waterL);
    if (fx.morale) r.morale = clamp(r.morale + fx.morale, 0, 100);
    if (fx.radiationMsv) r.radiationMsv = round1(r.radiationMsv + fx.radiationMsv);
    if (fx.mavFuel) r.mavFuel = clamp(r.mavFuel + fx.mavFuel, 0, 100);
    if (fx.panelDust) r.panelDust = clamp(r.panelDust + fx.panelDust, 0, d.constants.panelDust.maxDust);
    if (fx.suitO2) suit.o2 = clamp(suit.o2 + fx.suitO2, 0, 100);
    if (fx.suitBattery) suit.battery = clamp(suit.battery + fx.suitBattery, 0, 100);
    if (fx.suitIntegrity) suit.integrity = clamp(suit.integrity + fx.suitIntegrity, 0, 100);
    if (fx.suitLeak !== undefined) suit.leak = Boolean(fx.suitLeak);
    if (fx.repairKits) s.inventory.repairKits = Math.max(0, s.inventory.repairKits + fx.repairKits);
    if (fx.rhuUnits) s.inventory.rhuUnits = Math.max(0, s.inventory.rhuUnits + fx.rhuUnits);
    if (fx.forceFreeze) {
      suit.battery = 0;
      suit.tempC = d.constants.eva.jointFreezeSuitC - 1;
      suit.frozen = true;
      S.bus.emit('eva:frozen', { forced: true });
    }
    if (fx.unfreeze) {
      suit.tempC = d.constants.eva.jointFreezeSuitC + 12;
      suit.frozen = false;
      if (suit.battery <= 0) suit.battery = 10;
      S.bus.emit('eva:unfrozen', {});
    }
    if (fx.startStorm) {
      s.weather.stormTau = d.constants.dustStorm.gameTau;
      s.weather.stormSolsLeft = d.events.stormDurationSols[s.demoMode ? 'demo' : 'full'];
      S.bus.emit('fx:weather', { type: 'storm', tau: s.weather.stormTau });
    }
    if (fx.disableLoad) {
      const until = s.weather.stormSolsLeft > 0 ? s.sol + s.weather.stormSolsLeft - 1 : s.sol;
      s.disabledLoads[fx.disableLoad] = until;
    }
    if (fx.dataLossMbit) s.downlink.lossMbit += fx.dataLossMbit;
    if (fx.extraBandwidthMbit) s.downlink.extraMbit += fx.extraBandwidthMbit;
    if (fx.prioritize) {
      s.downlink.queue.sort((a, b) => (a.kind === fx.prioritize ? 0 : 1) - (b.kind === fx.prioritize ? 0 : 1));
    }
    if (fx.batteryCapacityPct) {
      r.batteryKwh = round1(r.batteryKwh * (1 + fx.batteryCapacityPct / 100));
      r.energyKwh = Math.min(r.energyKwh, r.batteryKwh);
    }
    if (fx.bonusPhoto) {
      const full = S.Sim.has(s, 'mastcam_z');
      const pts = Math.round(35 * (full ? 1 : d.scoring.handCameraPhotoFactor));
      S.Sim.queuePacket(s, {
        kind: 'photo',
        refId: 'dust_devil_' + s.sol,
        titleKey: 'packet.photo_dust_devil',
        sizeMbit: 12,
        points: pts
      });
      out.vars.pts = pts;
    }
    if (fx.wipeQueue) {
      let n = 0;
      s.downlink.queue = s.downlink.queue.filter((p) => {
        if (p.status === 'queued' || p.status === 'sending') {
          n++;
          if (p.kind === 'forensic' && s.forensics[p.refId]) s.forensics[p.refId].queued = false;
          if (p.kind === 'experiment' && s.experiments[p.refId]) s.experiments[p.refId].queued = false;
          if (p.kind === 'report' && s.explore && s.explore.reports[p.refId]) s.explore.reports[p.refId].queued = false;
          return false;
        }
        return true;
      });
      out.vars.n = n;
    }
    if (fx.minutes) S.Sim.advance(s, fx.minutes);
    return out;
  };

  /** Etkileri kullanıcıya gösterilecek kısa bedel satırlarına çevirir (çevrilebilir anahtarlar) */
  Ev.describeEffects = function (fx) {
    const list = [];
    if (!fx) return list;
    const num = (v) => (v > 0 ? '+' + v : String(v));
    const simple = [
      'energyKwh', 'o2ReserveKg', 'waterL', 'morale', 'radiationMsv', 'mavFuel', 'suitO2',
      'suitBattery', 'suitIntegrity', 'repairKits', 'rhuUnits', 'minutes', 'dataLossMbit',
      'extraBandwidthMbit', 'batteryCapacityPct'
    ];
    // Pozitif değeri maliyet olan etkiler (zaman, veri kaybı, radyasyon) ve ham sayı gösterilenler
    const costlyWhenPositive = new Set(['minutes', 'dataLossMbit', 'radiationMsv']);
    const rawNumber = new Set(['minutes', 'dataLossMbit', 'extraBandwidthMbit']);
    for (const k of simple) {
      if (!fx[k]) continue;
      const v = k === 'dataLossMbit' && fx[k] >= 999 ? '∞' : rawNumber.has(k) ? String(fx[k]) : num(fx[k]);
      const bad = costlyWhenPositive.has(k) ? fx[k] > 0 : fx[k] < 0;
      list.push({ key: 'fx.' + k, vars: { v }, bad });
    }
    if (fx.panelDust) list.push({ key: 'fx.panelDust', vars: { v: num(Math.round(fx.panelDust * 100)) }, bad: fx.panelDust > 0 });
    const flags = { unfreeze: false, startStorm: true, bonusPhoto: false, wipeQueue: true, forceFreeze: true };
    for (const flag of Object.keys(flags)) {
      if (fx[flag]) list.push({ key: 'fx.' + flag, vars: {}, bad: flags[flag] });
    }
    if (fx.suitLeak === false) list.push({ key: 'fx.fixLeak', vars: {}, bad: false });
    if (fx.disableLoad) list.push({ key: 'fx.disableLoad', vars: { load: fx.disableLoad }, bad: true });
    if (fx.prioritize) list.push({ key: 'fx.prioritize', vars: {}, bad: false });
    if (list.length === 0) list.push({ key: 'fx.none', vars: {}, bad: false });
    return list;
  };

  S.Events = Ev;
})((window.SOL14 = window.SOL14 || {}));
