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
  DS.showMenu = function (h) {
    const html =
      '<div class="screen menu" style="--bg:url(\'' + S.Sprites.screen('cover_thumbnail') + '\')"><div class="menu-dim"></div>' +
      '<div class="menu-box"><div class="menu-logo">' + S.UI.brand() + '</div>' +
      '<p class="menu-tag">' + t('menu.tagline') + '</p>' +
      '<div class="menu-btns">' +
      (S.hasSave() ? '<button class="btn btn-primary btn-lg" data-m="continue">' + I('play') + t('menu.continue') + '</button>' : '') +
      '<button class="btn ' + (S.hasSave() ? 'btn-ghost' : 'btn-primary') + ' btn-lg" data-m="new">' + I('rocket') + t('menu.new') + '</button>' +
      '<button class="btn btn-ghost btn-lg" data-m="demo">' + I('clock') + t('menu.demo') + '</button>' +
      '<div class="menu-row"><button class="btn btn-ghost" data-m="lang">' + I('globe') + t('menu.lang') + '</button>' +
      '<button class="btn btn-ghost" data-m="sound">' + I(S.Audio.isMuted() ? 'mute' : 'sound') + t(S.Audio.isMuted() ? 'menu.sound_off' : 'menu.sound_on') + '</button>' +
      '<button class="btn btn-ghost" data-m="help">' + I('doc') + t('menu.help') + '</button></div></div>' +
      '<p class="menu-foot">' + t('menu.footer') + '</p></div>' +
      '<p class="lt-fiction">' + t('lt.fiction') + '</p></div>';
    const root = S.UI.showScreen(html, 'scene-menu');
    S.UI.bindClicks(root, {
      '[data-m="continue"]': () => h.continueGame(),
      '[data-m="new"]': () => h.newGame(false),
      '[data-m="demo"]': () => h.newGame(true),
      '[data-m="lang"]': () => h.toggleLang(),
      '[data-m="sound"]': () => {
        S.Audio.toggleMute();
        DS.showMenu(h);
      },
      '[data-m="help"]': () => DS.openHelp()
    });
  };

  DS.openHelp = function () {
    const keys = [
      ['A / D · ← →', 'help.move'],
      ['W · Space · ↑', 'help.jump'],
      ['E', 'help.interact'],
      ['L', 'help.downlink'],
      ['P', 'help.power'],
      ['J', 'help.log'],
      ['Esc', 'help.pause']
    ];
    const html =
      '<div class="panel action-modal help-modal"><div class="modal-head"><h3>' + I('doc') + t('menu.help') + '</h3><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="help-keys">' + keys.map(([k, d]) => '<div><kbd>' + k + '</kbd><span>' + t(d) + '</span></div>').join('') + '</div>' +
      '<div class="help-loop">' + ['help.loop1', 'help.loop2', 'help.loop3'].map((k, i) => '<div><b>' + (i + 1) + '</b><span>' + t(k) + '</span></div>').join('') + '</div>' +
      '<p class="pv-desc">' + t('help.ponr') + '</p>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-close>' + t('ui.close') + '</button></div></div>';
    S.UI.openModal('help', html, {});
  };

  /* ================================================================ */
  /* SOL 0 TASARIM KONSOLU                                              */
  /* ================================================================ */
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
    if (f === 'rocketId') return join([t('tip.fx.rocket', { max: tot.massMax, m: findById(D.rockets, v).costM }), massText(tot), moneyText(tot)]);
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

  /** Seçimden sonra sağ panelde kısa "Bu seçim" özeti: neyin değiştiği (önce → sonra) */
  function changeSummary(before, after, title, effect) {
    const deltas = [];
    if (before.moneyUsed !== after.moneyUsed) deltas.push(t('design.chg_money', { a: before.moneyUsed, b: after.moneyUsed }));
    if (before.massMarginPct !== after.massMarginPct) deltas.push(t('design.chg_margin', { a: before.massMarginPct, b: after.massMarginPct }));
    if (before.nightNeedKwh !== after.nightNeedKwh) deltas.push(t('design.chg_night', { a: before.nightNeedKwh, b: after.nightNeedKwh }));
    if (before.reportDataMbit !== after.reportDataMbit) deltas.push(t('design.chg_data', { a: before.reportDataMbit, b: after.reportDataMbit }));
    if (before.spof.length !== after.spof.length) deltas.push(t('design.chg_spof', { a: before.spof.length, b: after.spof.length }));
    return { title, effect, deltas };
  }

  function changeHtml(c) {
    if (!c) return '';
    return (
      '<div class="d-change" role="status"><div class="d-change-head">' + I('check') + '<span>' + t('design.change_title') + '</span><b>' + c.title + '</b></div>' +
      (c.deltas.length ? '<ul>' + c.deltas.map((x) => '<li>' + x + '</li>').join('') + '</ul>' : '') +
      '<p>' + c.effect + '</p></div>'
    );
  }

  function card(field, value, selected, title, body, extra = '') {
    const s = S.getState();
    const tip = DS.optionTip(s, s.design, field, DS.parseValue(field, value), title);
    return (
      '<button class="d-card' + (selected ? ' sel' : '') + '" data-f="' + field + '" data-v="' + value + '"' + S.UI.tipAttr(tip) + '>' +
      '<span class="d-radio"></span>' + S.UI.tipBadge() + '<b>' + title + '</b>' + (body ? '<p>' + body + '</p>' : '') + extra + '</button>'
    );
  }

  function budgetBar(icon, label, valueText, pct, tone, sub, tip) {
    return (
      '<div class="budget ' + tone + '" tabindex="0"' + S.UI.tipAttr(tip) + '><div class="b-head">' + I(icon) + '<span>' + label + '</span>' + S.UI.tipBadge() + '<b>' + valueText + '</b></div>' +
      S.UI.bar(pct, tone === 'over' ? 'red' : tone === 'warn' ? 'amber' : 'cyan') + '<small>' + sub + '</small></div>'
    );
  }

  DS.stepHtml = function (d, tot) {
    const D = S.DATA;
    if (DS.step === 1) {
      return (
        '<h3>' + t('design.s1') + '</h3><p class="d-help">' + t('design.s1_help') + '</p><div class="d-cards">' +
        D.objectives.map((o) =>
          card('objectiveFocus', o.id, d.objectiveFocus === o.id, t('obj.' + o.id + '.name'), t('obj.' + o.id + '.desc'),
            '<div class="d-crit"><span>' + t('design.min_success', { f: o.minSuccess.forensicsSent, e: o.minSuccess.experimentsSent }) + '</span><span>' + t('design.full_success', { f: o.fullSuccess.forensicsSent, e: o.fullSuccess.experimentsSent }) + '</span></div>')
        ).join('') + '</div>'
      );
    }
    if (DS.step === 2) {
      return (
        '<h3>' + t('design.s2') + '</h3><p class="d-help">' + t('design.s2_help') + '</p>' +
        '<h4>' + t('design.rocket') + '</h4><div class="d-cards c3">' +
        D.rockets.map((r) => card('rocketId', r.id, d.rocketId === r.id, r.name, t('design.rocket_spec', { kg: r.payloadMarsKg, m: r.costM }))).join('') +
        '</div><h4>' + t('design.orbit') + '</h4><div class="d-cards c2">' +
        D.orbits.map((o) => card('orbitType', o.id, d.orbitType === o.id, t('orbit.' + o.id + '.name'),
          t('design.orbit_spec', { days: o.transitDays, dose: Math.round(o.transitDays * D.constants.radiation.transitDailyMsv), kg: o.payloadPenaltyKg, m: o.costPenaltyM }))).join('') +
        '</div><h4>' + t('design.window') + '</h4><div class="d-cards c2">' +
        card('launchWindowCaught', 'true', d.launchWindowCaught, t('window.caught'), t('window.caught_desc', { months: D.constants.synodicPeriod.months })) +
        card('launchWindowCaught', 'false', !d.launchWindowCaught, t('window.missed'), t('window.missed_desc', { m: D.constants.synodicPeriod.missedWindowCostM })) +
        '</div>'
      );
    }
    if (DS.step === 3) {
      return (
        '<h3>' + t('design.s3') + '</h3><p class="d-help">' + t('design.s3_help') + '</p>' +
        '<h4>' + t('design.site') + '</h4><div class="d-cards c3">' +
        D.landingSites.map((x) => card('landingSiteId', x.id, d.landingSiteId === x.id, t('site.' + x.id + '.name'),
          t('site.' + x.id + '.desc'), '<div class="d-spec">' + x.coords + ' · ' + x.dayMaxC + '/' + x.nightMinC + ' °C · cosZ ' + x.cosZNoon + '</div>')).join('') +
        '</div><h4>' + t('design.power') + '</h4><div class="d-cards c2">' +
        ['solar_only', 'solar_rtg'].map((p) => card('powerSource', p, d.powerSource === p, t('pwr.' + p + '.name'), t('pwr.' + p + '.desc'))).join('') +
        '</div><div class="d-split"><div><h4>' + t('design.battery') + '</h4><div class="d-cards c3">' +
        D.habitat.batteries.map((b) => card('batteryKwh', b.kwh, d.batteryKwh === b.kwh, b.kwh + ' kWh', b.massKg + ' kg · $' + b.costM + 'M')).join('') +
        '</div></div><div><h4>' + t('design.insulation') + '</h4><div class="d-cards c2">' +
        ['thin', 'thick'].map((k) => card('insulation', k, d.insulation === k, t('ins.' + k + '.name'), t('ins.' + k + '.desc', { ua: D.habitat.insulation[k].uaWPerK }))).join('') +
        '</div></div></div>'
      );
    }
    if (DS.step === 4) {
      return (
        '<h3>' + t('design.s4', { n: d.instruments.length }) + '</h3><p class="d-help">' + t('design.s4_help') + '</p><div class="inst-grid">' +
        D.instruments.map((inst) => {
          const on = d.instruments.includes(inst.id);
          return (
            '<button class="inst' + (on ? ' sel' : '') + '" data-inst="' + inst.id + '"' + S.UI.tipAttr(DS.instrumentTip(S.getState(), d, inst)) + '><span class="d-check">' + (on ? I('check') : '') + '</span>' + S.UI.tipBadge() +
            '<b>' + t('inst.' + inst.id + '.name') + '</b><span class="inst-spec">' + inst.massKg + ' kg · ' + inst.powerW + ' W · ' + inst.dataMbit + ' Mbit/sol · $' + inst.costM + 'M</span>' +
            '<p>' + t('inst.' + inst.id + '.desc') + '</p><p class="inst-miss">' + I('alert') + t('inst.' + inst.id + '.missing') + '</p></button>'
          );
        }).join('') + '</div>'
      );
    }
    return (
      '<h3>' + t('design.s5') + '</h3><p class="d-help">' + t('design.s5_help') + '</p>' +
      '<h4>' + t('design.comms') + '</h4><div class="d-cards c2">' +
      ['relay_only', 'relay_xband'].map((c) => {
        const cap = D.habitat.relayPasses.filter((p) => !p.requires || p.requires === c).reduce((a, p) => a + p.capacityMbit, 0);
        return card('commArchitecture', c, d.commArchitecture === c, t('comm.' + c + '.name'), t('comm.' + c + '.desc', { mbit: cap }));
      }).join('') +
      '</div><h4>' + t('design.kits') + '</h4><div class="d-cards c3">' +
      Array.from({ length: D.habitat.repairKit.max + 1 }, (_, k) => k).map((k) => card('repairKits', k, d.repairKits === k, t('design.kit_n', { n: k }), '+' + k * D.habitat.repairKit.massKg + ' kg · $' + k * D.habitat.repairKit.costM + 'M')).join('') +
      '</div><div class="d-summary">' + I('doc') + t('design.summary', { margin: tot.massMarginPct, dose: tot.transitDoseMsv, days: tot.transitDays }) + '</div>'
    );
  };

  DS.showDesign = function (h) {
    const s = S.getState();
    const d = s.design;
    const tot = S.Engineering.calcDesignTotals(d);
    const moneyPct = (tot.moneyUsed / tot.moneyMax) * 100;
    const massPct = (tot.massUsed / tot.massMax) * 100;
    const nightPct = (tot.nightNeedKwh / d.batteryKwh) * 100;
    const dataPct = (tot.instrumentDataMbit / Math.max(1, tot.dataPerSolMbit)) * 100;
    // Aynı adımda yeniden çizimde içerik kaydırması korunur (uzun listede seçim yapınca başa atlamasın)
    const prevContent = S.UI.screenLayer().querySelector('.d-content');
    const keepScroll = prevContent && DS.renderedStep === DS.step ? prevContent.scrollTop : 0;
    if (DS.renderedStep !== DS.step) DS.change = null;
    const steps = [1, 2, 3, 4, 5]
      .map((n) => '<button class="d-step' + (DS.step === n ? ' sel' : '') + (n < DS.step ? ' done' : '') + '" data-step="' + n + '"><b>' + String(n).padStart(2, '0') + '</b><span>' + t('design.tab' + n) + '</span></button>')
      .join('');
    const spof = tot.spof.length
      ? '<ul class="spof-list">' + tot.spof.map((k) => '<li>' + I('alert') + '<span>' + t(k) + '</span></li>').join('') + '</ul>'
      : '<p class="spof-ok">' + I('check') + t('design.spof_ok') + '</p>';
    const errs = tot.errors.map((k) => '<li>' + I('x') + '<span>' + t(k) + '</span></li>').join('');

    const html =
      '<div class="screen design" style="--bg:url(\'' + S.Sprites.screen('scr_launch') + '\')"><div class="design-dim"></div>' +
      S.UI.header('<span class="bp-num">00</span><span>' + t('design.section') + '</span>', '<span class="status-pill"><span>' + I('calendar') + '<b>SOL 0</b></span><i></i><span>' + I('target') + '<b>' + (s.demoMode ? t('design.mode_demo') : t('design.mode_full')) + '</b></span></span>') +
      '<div class="budgets">' +
      budgetBar('target', t('budget.money'), '$' + tot.moneyUsed + 'M / $' + tot.moneyMax + 'M', moneyPct, tot.moneyUsed > tot.moneyMax ? 'over' : moneyPct > 92 ? 'warn' : 'ok', t('budget.money_sub'), DS.budgetTip(d, tot, 'money')) +
      budgetBar('weight', t('budget.mass'), tot.massUsed + ' / ' + tot.massMax + ' kg', massPct, tot.massUsed > tot.massMax ? 'over' : tot.massMarginPct < S.DATA.habitat.massMarginGoodPct ? 'warn' : 'ok', t('budget.margin', { pct: tot.massMarginPct }), DS.budgetTip(d, tot, 'mass')) +
      budgetBar('power', t('budget.power'), tot.nightNeedKwh + ' / ' + d.batteryKwh + ' kWh', nightPct, tot.batteryNightSafe ? 'ok' : 'over', t('budget.power_sub', { w: Math.round(tot.solarNoonW), rtg: tot.rtgW }), DS.budgetTip(d, tot, 'power')) +
      // Veri: aletlerin günlük rutin verisi röle kapasitesinin ne kadarını kaplıyor; kalanı raporlara gider
      budgetBar('signal', t('budget.data'), tot.instrumentDataMbit + ' / ' + tot.dataPerSolMbit + ' Mbit/sol', dataPct,
        tot.reportDataMbit < tot.largestReportMbit ? 'over' : tot.reportDataMbit < 2 * tot.largestReportMbit ? 'warn' : 'ok',
        t('budget.data_sub', { left: tot.reportDataMbit }), DS.budgetTip(d, tot, 'data')) +
      '</div>' +
      '<div class="design-main"><nav class="d-steps">' + steps + '</nav>' +
      '<section class="panel d-content">' + DS.stepHtml(d, tot) + '</section>' +
      '<aside class="panel d-side">' + changeHtml(DS.change) + '<h4>' + I('alert') + t('design.spof_title') + '</h4>' + spof +
      (errs ? '<ul class="err-list">' + errs + '</ul>' : '') +
      '<div class="d-actions">' +
      (DS.step > 1 ? '<button class="btn btn-ghost" data-nav="-1">' + I('arrowL') + t('ui.back') + '</button>' : '<button class="btn btn-ghost" data-menu>' + I('home') + t('ui.menu') + '</button>') +
      (DS.step < 5 ? '<button class="btn btn-primary" data-nav="1">' + t('ui.next') + I('arrowR') + '</button>' : '') +
      '</div><button class="btn btn-launch btn-lg btn-block" data-launch ' + (tot.canLaunch ? '' : 'disabled') + '>' + I('rocket') + t('design.launch') + '</button>' +
      '<button class="btn btn-ghost btn-block btn-sm" data-preset>' + t('design.preset') + '</button></aside></div></div>';

    const root = S.UI.showScreen(html, 'scene-design');
    DS.renderedStep = DS.step;
    const content = root.querySelector('.d-content');
    if (content && keepScroll) content.scrollTop = keepScroll;
    // Klavyeyle seçim yapan oyuncu odağını kaybetmesin (yeniden çizim DOM'u değiştirir)
    if (DS.focusSel) {
      const el = root.querySelector(DS.focusSel);
      if (el) el.focus({ preventScroll: true });
      DS.focusSel = null;
    }
    const rerender = () => DS.showDesign(h);
    root.querySelectorAll('[data-f]').forEach((b) =>
      b.addEventListener('click', () => {
        const f = b.dataset.f;
        const v = DS.parseValue(f, b.dataset.v);
        if (s.design[f] !== v) {
          s.design[f] = v;
          DS.change = changeSummary(tot, S.Engineering.calcDesignTotals(s.design), b.querySelector('b').innerHTML, DS.optionEffect(s, s.design, f, v));
        }
        DS.focusSel = '[data-f="' + f + '"][data-v="' + b.dataset.v + '"]';
        S.bus.emit('audio:play', 'click');
        rerender();
      })
    );
    root.querySelectorAll('[data-inst]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.dataset.inst;
        const list = s.design.instruments;
        let title = null;
        if (list.includes(id)) {
          s.design.instruments = list.filter((x) => x !== id);
          title = t('design.change_removed', { name: t('inst.' + id + '.name') });
        } else if (list.length < 5) {
          s.design.instruments = list.concat(id);
          title = t('inst.' + id + '.name');
        } else S.UI.toast(t('design.err_too_many'), 'warn');
        if (title) {
          const inst = S.DATA.instruments.find((x) => x.id === id);
          DS.change = changeSummary(tot, S.Engineering.calcDesignTotals(s.design), title, DS.instrumentEffect(s, s.design, inst));
        }
        DS.focusSel = '[data-inst="' + id + '"]';
        S.bus.emit('audio:play', 'click');
        rerender();
      })
    );
    root.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { DS.step = Number(b.dataset.step); DS.focusSel = '[data-step="' + DS.step + '"]'; S.bus.emit('audio:play', 'click'); rerender(); }));
    root.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => { DS.step = Math.max(1, Math.min(5, DS.step + Number(b.dataset.nav))); DS.focusSel = '[data-nav="' + b.dataset.nav + '"]'; S.bus.emit('audio:play', 'click'); rerender(); }));
    const menuBtn = root.querySelector('[data-menu]');
    if (menuBtn) menuBtn.addEventListener('click', () => h.menu());
    root.querySelector('[data-preset]').addEventListener('click', () => {
      s.design = S.util.deepClone(S.State.DEFAULT_DESIGN);
      DS.change = null;
      S.bus.emit('audio:play', 'click');
      rerender();
    });
    root.querySelector('[data-launch]').addEventListener('click', () => h.launch());
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
