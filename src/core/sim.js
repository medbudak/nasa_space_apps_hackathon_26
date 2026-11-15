/**
 * SOL 14: RED HORIZON — Simülasyon Motoru (K2)
 * Zaman akışı, güç üretimi + yük önceliklendirme (M3), habitat ısıl modeli, sera, yaşam desteği,
 * elbise/EVA (eklem donması, sızıntı), dönüşsüzlük noktası (M4), downlink röle geçişleri (M1),
 * Sol geçişi (M6) ve kayıp koşulları. DOM'a dokunmaz: Node testlerinde başsız çalışır.
 */
(function (S) {
  'use strict';
  const E = () => S.Engineering;
  const D = () => S.DATA;
  const { clamp, round1, round2 } = S.util;

  const Sim = {};
  const MAX_STEP_MIN = 5;
  const LOAD_ORDER_DEFAULT = ['life_support', 'heating', 'comms', 'greenhouse', 'experiments', 'moxie'];

  /* ------------------------------------------------------------------ */
  /* Yardımcı okuyucular                                                 */
  /* ------------------------------------------------------------------ */
  Sim.site = (s) => E().findById(D().landingSites, s.design.landingSiteId);
  Sim.powerCfg = (s) => D().habitat.powerSource[s.design.powerSource];
  Sim.insulationCfg = (s) => D().habitat.insulation[s.design.insulation];
  Sim.has = (s, instrumentId) => s.design.instruments.includes(instrumentId);
  /** ISRU ünitesi (Sabatier yakıt partisi) yalnızca MOXIE seçildiyse kurulur: yoksa MAV yakıtı artmaz */
  Sim.hasIsru = (s) => Sim.has(s, 'moxie');
  /** Üs sistemi kuruldu mu? (eski kayıtta base alanı yoksa kurulu sayılır) */
  Sim.deployed = (s, id) => !s.base || s.base[id] !== false;
  /** Bu tasarımda kurulabilecek mi? ISRU ünitesi MOXIE, sera Veggie ister */
  /* ---- Sera büyüme evreleri (Kişi 6): 0 tohum → 1 çimlenme → 2 filiz → 3 olgun → hasat ---- */
  const GROWTH = () => D().habitat.greenhouse.growth;
  Sim.ghStage = (s) => s.greenhouse.stage || 0;
  Sim.ghStageKey = (s) => GROWTH().stages[Sim.ghStage(s)];
  Sim.ghMature = (s) => Sim.ghStage(s) >= GROWTH().stages.length - 1;
  /** Bitkinin bu sol bir evre ilerlemesi için bakım gerekiyor mu (olgunsa büyüme durur, hasat beklenir) */
  Sim.ghNeedsTending = (s) => s.greenhouse.installed && !s.greenhouse.frozen && !Sim.ghMature(s) && s.greenhouse.tendedSol !== s.sol;
  /** Sol sonu: o sol bakım yapıldıysa bir evre ilerler; yapılmadıysa büyüme durur (sıkıştırılmış süre, simplified) */
  Sim.growGreenhouse = function (s) {
    const gh = s.greenhouse;
    if (!gh.installed || gh.frozen || Sim.ghMature(s)) return false;
    if (gh.tendedSol !== s.sol) return false;
    gh.stage = Sim.ghStage(s) + 1;
    S.bus.emit('greenhouse:grew', { stage: gh.stage, key: Sim.ghStageKey(s) });
    return true;
  };
  Sim.deployAvailable = (s, id) => (id === 'isru' ? Sim.hasIsru(s) : id === 'greenhouse' ? Sim.has(s, 'veggie') : true);
  /** Yakıt üretimi: ISRU ünitesi ve MAV kurulu olmalı */
  Sim.isruReady = (s) => Sim.hasIsru(s) && Sim.deployed(s, 'isru') && Sim.deployed(s, 'mav');
  /** Kargo sandığından üs sistemini kur (kalite: mini oyun skoru) */
  Sim.deploy = function (s, id, quality = 1, minutes) {
    const cfg = D().gameplay.deploy[id];
    if (!cfg || !s.base || s.base[id] || !Sim.deployAvailable(s, id)) return { ok: false };
    s.base[id] = true;
    if (id === 'greenhouse') s.greenhouse.installed = true;
    Sim.advance(s, minutes === undefined ? cfg.minutes : minutes);
    S.logDecision({ category: 'engineering', titleKey: 'log.deploy.title', choiceKey: 'deploy.' + id + '.name', resultKey: 'deploy.' + id + '.done', vars: {}, score: 0 }, s);
    S.bus.emit('base:deployed', { id, quality });
    return { ok: true, id };
  };
  /** Seçili aletlerin günlük rutin verisi (gameplay.instrumentData): her röle geçişinde raporlardan önce gider */
  Sim.instrumentDataMbit = (s) =>
    s.design.instruments.reduce((a, id) => a + ((D().instruments.find((x) => x.id === id) || {}).dataMbit || 0), 0);
  Sim.clockMinute = (s) => s.minute % 1480;
  Sim.ambient = (s) => E().ambientTempAt(Sim.site(s), Sim.clockMinute(s));

  /**
   * Extra cold in the western ice field (FICTIONAL game values, data terrain.westRegion.cold).
   * extraC: added to the ambient temperature, growing with the ice (same ramp as the visuals).
   * bleedCPerMin: suit heat lost beyond what the heaters can replace, from deepColdFromM to the wall.
   */
  Sim.westCold = function (s) {
    const w = D().terrain.westRegion;
    const none = { extraC: 0, bleedCPerMin: 0 };
    if (!w || !w.cold || s.player.inside) return none;
    const d = -s.player.x;
    if (d <= w.frostStartM) return none;
    const ramp = (a, b) => {
      const x = Math.min(1, Math.max(0, (d - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };
    return {
      extraC: w.cold.extraColdC * ramp(w.frostStartM, w.iceFullM),
      bleedCPerMin: w.cold.deepColdBleedCPerMin * Math.max(0, Math.min(1, (d - w.cold.deepColdFromM) / (w.iceWallFromM - w.cold.deepColdFromM)))
    };
  };
  Sim.tod = (s) => E().timeOfDay(Sim.clockMinute(s));
  Sim.airlockX = 0;
  /** Habitata yürüme mesafesi; lav tünelindeyken (D-012) tünel ağzı + tünel içi mesafe */
  Sim.inCave = (s) => s.player.zone === 'cave';
  Sim.distanceFromHab = (s) =>
    Sim.inCave(s) ? Math.abs(D().terrain.map.tubeMouthM - Sim.airlockX) + Math.max(0, s.player.cx || 0) : Math.abs(s.player.x - Sim.airlockX);
  Sim.isOutside = (s) => s.scene === 'surface' && !s.player.inside;
  Sim.horizons = (s) => E().getHorizons(s.sol, s.maxSols);

  /** Oyun saatinin hızı [oyun dakikası / gerçek saniye]: normal oyun keşfe zaman tanır, jüri hızlı modu (?demo) daha çabuktur */
  Sim.gameMinutesPerRealSecond = (s) => (s && s.demoMode ? D().gameplay.demoGameMinutesPerRealSecond : D().gameplay.gameMinutesPerRealSecond);

  /**
   * Elbise ısıl durumu (HUD + hedef kartı): ısıtıcı bataryadan mı çalışıyor, bu sıcaklıkta kaç dakika kalır,
   * batarya bittiyse eklem donmasına / hipotermiye ne kadar var. Tahminler o anki dış sıcaklıkla yapılır.
   * state: 'heater' | 'low' (ısıtıcı yakında durur) | 'cooling' (batarya bitti) | 'frozen'
   */
  Sim.suitThermal = function (s, ambientC = Sim.ambient(s)) {
    const eva = D().constants.eva;
    const suit = s.suit;
    const drain = E().calcSuitBatteryDrainPctPerMin({ ambientC, integrity: suit.integrity });
    const batteryMinutes = suit.battery > 0 ? suit.battery / drain : 0;
    const cooling = suit.battery <= 0;
    const freezeMinutes = cooling ? E().calcSuitCoolingMinutes({ fromC: suit.tempC, toC: eva.jointFreezeSuitC, ambientC }) : Infinity;
    const toHypothermia = cooling ? E().calcSuitCoolingMinutes({ fromC: suit.tempC, toC: eva.hypothermiaSuitC, ambientC }) : Infinity;
    let state = 'heater';
    if (suit.frozen) state = 'frozen';
    else if (cooling) state = 'cooling';
    else if (batteryMinutes <= eva.suitBatteryLowWarnMinutes) state = 'low';
    return {
      state,
      drainPctPerMin: drain,
      batteryMinutes,
      freezeMinutes,
      hypothermiaMinutes: toHypothermia + Math.max(0, eva.hypothermiaMinutes - suit.coldMinutes)
    };
  };

  /** M4 — Dönüşsüzlük noktası durumu (normal hız vs. donmuş eklem hızı) */
  Sim.ponr = function (s) {
    const dist = Sim.distanceFromHab(s);
    // the way home runs east, with the (FICTIONAL) blizzard behind you: a little slower there
    const bz = D().terrain.westRegion && D().terrain.westRegion.blizzard;
    let sandFactor = 1;
    if (bz && !s.player.inside) {
      const x = Math.min(1, Math.max(0, (-s.player.x - bz.fromM) / (bz.fullM - bz.fromM)));
      sandFactor = 1 - (1 - bz.tailwindSpeedFactor) * x * x * (3 - 2 * x);
    }
    const normal = E().calcPointOfNoReturnO2({ distanceM: dist, jointFrozen: false, leak: s.suit.leak, speedFactor: sandFactor });
    const required = E().calcPointOfNoReturnO2({ distanceM: dist, jointFrozen: s.suit.frozen, leak: s.suit.leak, speedFactor: sandFactor });
    return {
      distanceM: Math.round(dist),
      requiredO2: required,
      requiredNormal: normal,
      jumpFactor: normal > 0 ? round1(required / normal) : 1,
      speedPct: Math.round((s.suit.frozen ? D().constants.eva.frozenSpeedFactor : 1) * 100),
      margin: round1(s.suit.o2 - required),
      critical: Sim.isOutside(s) && s.suit.o2 <= required + 5,
      beyond: Sim.isOutside(s) && s.suit.o2 < required
    };
  };

  /* ------------------------------------------------------------------ */
  /* Görev başlatma: Sol 0 tasarımı -> transit                           */
  /* ------------------------------------------------------------------ */
  Sim.launch = function (s) {
    const totals = E().calcDesignTotals(s.design);
    if (!totals.canLaunch) return { ok: false, errors: totals.errors };
    s.totals = totals;
    s.scene = 'transit';
    S.logDecision(
      {
        sol: 0,
        category: 'design',
        titleKey: 'log.design.title',
        choiceKey: 'log.design.choice',
        resultKey: totals.spof.length ? 'log.design.res_spof' : 'log.design.res_ok',
        vars: {
          site: S.t('site.' + s.design.landingSiteId + '.name'),
          kwh: s.design.batteryKwh,
          n: s.design.instruments.length,
          mass: totals.massUsed,
          massMax: totals.massMax,
          margin: totals.massMarginPct,
          money: totals.moneyUsed,
          spof: totals.spof.length
        },
        score: totals.massMarginPct >= D().scoring.massMarginBonusThresholdPct ? D().scoring.massMarginBonusPoints : 0
      },
      s
    );
    return { ok: true };
  };

  /** İnişte başlangıç kaynakları (Sim.land ve Sol 0 bilgi balonları aynı sayıları kullanır) */
  Sim.landingStart = function (s) {
    const d = D();
    const orbit = E().findById(d.orbits, s.design.orbitType);
    const lw = d.gameplay.launchWindow;
    return {
      chargeFrac: d.gameplay.transit.landingChargeFrac,
      o2: d.habitat.base.o2ReserveStartKg,
      fuel: s.demoMode ? 92 : orbit.mavFuelStartPct,
      morale: s.design.launchWindowCaught ? lw.moraleStartCaught : lw.moraleStartMissed
    };
  };

  /** Transit bitti: iniş, Sol 1 başlangıç kaynakları */
  Sim.land = function (s) {
    const d = D();
    const site = Sim.site(s);
    const orbit = E().findById(d.orbits, s.design.orbitType);
    const pwr = Sim.powerCfg(s);
    const v = Sim.landingStart(s);
    s.scene = 'surface';
    s.sol = 1;
    s.minute = d.gameplay.solStartMinute;
    s.totalMinutes = 0;
    s.res.batteryKwh = s.design.batteryKwh;
    s.res.energyKwh = round1(s.design.batteryKwh * v.chargeFrac);
    s.res.o2ReserveKg = v.o2;
    s.res.waterL = site.waterStartL;
    s.res.mavFuel = v.fuel;
    s.res.morale = v.morale;
    s.res.radiationMsv = round1(orbit.transitDays * d.constants.radiation.transitDailyMsv);
    s.res.panelDust = 0.04;
    // Yük marjı ek ikmali (K4 Sedef): tasarımda yeterince boş kütle kaldıysa iniş aracı ek O₂ ve su getirir
    const cb = d.gameplay.cargoBonus;
    const margin = S.Engineering.calcDesignTotals(s.design).massMarginPct;
    s.cargoBonus = null;
    if (cb && margin > cb.minMarginPct) {
      s.res.o2ReserveKg = round1(s.res.o2ReserveKg + cb.o2Kg);
      s.res.waterL = round1(s.res.waterL + cb.waterL);
      s.cargoBonus = { pct: margin, o2: cb.o2Kg, w: cb.waterL };
      S.logDecision({ category: 'engineering', titleKey: 'log.cargo.title', choiceKey: 'log.cargo.choice', resultKey: 'log.cargo.result', vars: { min: cb.minMarginPct, o2: cb.o2Kg, w: cb.waterL }, score: 0 }, s);
    }
    s.res.habTempC = d.gameplay.habitatTargetC;
    s.inventory.repairKits = s.design.repairKits;
    s.inventory.rhuUnits = 0;
    // Atölye malzemeleri: kargodaki kitler (seçilen alete göre)
    s.inventory.items = S.Workshop ? S.Workshop.startItems(s.design) : {};
    s.inventory.spareAntenna = false;
    // Sera kargo sandığında iner: oyuncu kurunca çalışır (Sim.deploy)
    s.greenhouse.installed = Sim.has(s, 'veggie') && Sim.deployed(s, 'greenhouse');
    s.downlink.routineMbit = Sim.instrumentDataMbit(s);
    // D-012: mekik üssün iniş alanına (landingPadM) iner; astronot kapaktan iner
    s.player = { x: d.terrain.map.landingPadM + d.terrain.map.landingExitM, inside: false, facing: 1, zone: 'surface', cx: 0 };
    s.lander = { landed: true };
    if (S.ensureExploreState) S.ensureExploreState(s);
    s.power.rtgW = pwr.rtgW;
    if (s.demoMode) {
      s.forensics.opportunity.discovered = true;
    }
    Sim.snapshotSolStart(s);
    Sim.prepareWarnings(s);
    S.saveCheckpoint(s);
    S.bus.emit('mission:landed', s);
  };

  Sim.snapshotSolStart = function (s) {
    s.solStart = {
      energyKwh: s.res.energyKwh,
      o2ReserveKg: s.res.o2ReserveKg,
      waterL: s.res.waterL,
      morale: s.res.morale,
      mavFuel: s.res.mavFuel,
      radiationMsv: s.res.radiationMsv,
      sentMbit: 0,
      shed: {},
      events: []
    };
  };

  /** MEDA / SEIS / RAD erken uyarıları: ertesi günün krizini bir gün önceden göster */
  Sim.prepareWarnings = function (s) {
    s.weather.warnings = [];
    const schedule = D().events.schedule[s.demoMode ? 'demo' : 'full'];
    for (const ev of schedule) {
      if (ev.sol !== s.sol && ev.sol !== s.sol + 1) continue;
      const cfg = D().events.crises.find((c) => c.id === ev.id);
      if (cfg && cfg.warnInstrument && Sim.has(s, cfg.warnInstrument)) {
        s.weather.warnings.push({ id: ev.id, sol: ev.sol, instrument: cfg.warnInstrument, minute: ev.minute });
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Güç (M3) — her adımda öncelik sırasına göre arz ve yük kesme         */
  /* ------------------------------------------------------------------ */
  Sim.loadDemandW = function (s, id, ambientC) {
    const d = D();
    const base = d.habitat.base;
    if (id === 'life_support') return base.lifeSupportW;
    if (id === 'comms') return base.commsW;
    if (id === 'heating') {
      return E().calcHeatingW({
        uaWPerK: Sim.insulationCfg(s).uaWPerK,
        targetC: d.gameplay.habitatTargetC,
        ambientC,
        wasteHeatW: Sim.powerCfg(s).rtgWasteHeatW + s.inventory.rhuUnits * d.constants.rhu.thermalW
      });
    }
    if (id === 'greenhouse') return s.greenhouse.installed && !s.greenhouse.frozen ? d.habitat.greenhouse.powerW : 0;
    if (id === 'experiments') {
      const instW = s.design.instruments
        .filter((i) => i !== 'moxie' && i !== 'veggie')
        .reduce((a, i) => a + (d.instruments.find((x) => x.id === i) || { powerW: 0 }).powerW, 0);
      return base.experimentsW + instW;
    }
    if (id === 'moxie') {
      if (!Sim.has(s, 'moxie') || !Sim.deployed(s, 'isru')) return 0;
      if (s.disabledLoads.moxie !== undefined && s.disabledLoads.moxie >= s.sol) return 0;
      return d.instruments.find((x) => x.id === 'moxie').powerW;
    }
    return 0;
  };

  Sim.stepPower = function (s, dt, ambientC) {
    const site = Sim.site(s);
    const cosZ = E().solarCosZAt(site, Sim.clockMinute(s));
    // Güneş paneli kurulmadan üretim yok: üs bataryayla (ve seçildiyse RTG ile) yaşar
    const solarW = Sim.deployed(s, 'solar') ? E().calcSolarPower({ cosZ, dustFactor: s.res.panelDust, tau: s.weather.stormTau }) * ((s.base && s.base.solarFrac) || 1) : 0;
    const rtgW = Sim.powerCfg(s).rtgW;
    let genKwh = ((solarW + rtgW) * dt) / 60 / 1000;
    let demandW = 0;
    let suppliedW = 0;
    const reserveKwh = s.res.batteryKwh * D().gameplay.batteryReserveFrac;
    s.loads.forEach((load, idx) => {
      load.protected = idx < D().gameplay.protectedLoadCount;
    });
    for (const load of s.loads) {
      const w = load.on ? Sim.loadDemandW(s, load.id, ambientC) : 0;
      if (load.id === 'experiments' && s.disabledLoads.experiments !== undefined && s.disabledLoads.experiments >= s.sol) {
        load.shed = false;
        load.supplied = false;
        load.demandW = 0;
        continue;
      }
      load.demandW = w;
      demandW += w;
      if (w === 0) {
        load.shed = false;
        load.supplied = load.on;
        continue;
      }
      const need = (w * dt) / 60 / 1000;
      // Öncelikli (üstteki) yükler bataryanın tamamını, diğerleri yalnızca rezerv üstünü kullanabilir
      const usableBattery = load.protected ? s.res.energyKwh : Math.max(0, s.res.energyKwh - reserveKwh);
      if (genKwh >= need) {
        genKwh -= need;
        load.shed = false;
        load.supplied = true;
        suppliedW += w;
      } else if (genKwh + usableBattery >= need) {
        s.res.energyKwh -= need - genKwh;
        genKwh = 0;
        load.shed = false;
        load.supplied = true;
        suppliedW += w;
      } else {
        if (!load.shed) {
          S.bus.emit('power:shed', { id: load.id });
          if (s.solStart) s.solStart.shed[load.id] = true;
        }
        load.shed = true;
        load.supplied = false;
      }
    }
    // Artan üretim bataryayı şarj eder
    s.res.energyKwh = clamp(s.res.energyKwh + genKwh, 0, s.res.batteryKwh);
    s.power = {
      solarW: Math.round(solarW),
      rtgW,
      demandW: Math.round(demandW),
      suppliedW: Math.round(suppliedW),
      deficitW: Math.max(0, Math.round(demandW - solarW - rtgW))
    };
  };

  Sim.loadSupplied = (s, id) => {
    const l = s.loads.find((x) => x.id === id);
    return Boolean(l && l.supplied);
  };

  /* ------------------------------------------------------------------ */
  /* Habitat ısıl modeli + sera                                           */
  /* ------------------------------------------------------------------ */
  Sim.stepThermal = function (s, dt, ambientC) {
    const d = D();
    const target = d.gameplay.habitatTargetC;
    // Sıcaklıklar tam hassasiyetle saklanır (yalnızca ekranda yuvarlanır): gerçek zamanlı oyunda bir karede
    // oyun saati ~0.03 dk ilerler; her adımda yuvarlamak küçük değişimleri sıfırlar ve soğumayı durdururdu.
    if (Sim.loadSupplied(s, 'heating')) {
      s.res.habTempC = Math.min(target, s.res.habTempC + dt * 0.5);
    } else {
      const waste = Sim.powerCfg(s).rtgWasteHeatW + s.inventory.rhuUnits * d.constants.rhu.thermalW;
      const lossW = Sim.insulationCfg(s).uaWPerK * (s.res.habTempC - ambientC);
      const dT = ((waste - lossW) * dt * 60) / d.gameplay.habitatHeatCapacityJPerK;
      s.res.habTempC = Math.min(target, s.res.habTempC + dT);
    }

    const gh = s.greenhouse;
    if (!gh.installed || gh.frozen) return;
    const cfg = d.habitat.greenhouse;
    const ghLoad = s.loads.find((l) => l.id === 'greenhouse');
    const unpowered = !ghLoad.supplied;
    if (unpowered && ambientC < cfg.freezeAmbientC) gh.unpoweredMinutes += dt;
    else gh.unpoweredMinutes = Math.max(0, gh.unpoweredMinutes - dt * 2);

    let cause = null;
    if (s.res.habTempC <= cfg.freezeHabitatC) cause = 'heating';
    else if (gh.unpoweredMinutes >= cfg.freezeMinutesUnpowered) cause = ghLoad.on ? 'greenhouse_shed' : 'greenhouse_off';
    if (cause) {
      gh.frozen = true;
      gh.frozenSol = s.sol;
      gh.stage = 0; // donan bitki ölür; donma kalıcıdır, sera bu görevde bir daha büyümez
      gh.cause = cause;
      gh.frozenMinute = Math.round(Sim.clockMinute(s));
      s.res.morale = clamp(s.res.morale - 8, 0, 100);
      S.logDecision(
        {
          category: 'system',
          titleKey: 'log.greenhouse_frozen.title',
          choiceKey: 'log.greenhouse_frozen.cause_' + cause,
          resultKey: 'log.greenhouse_frozen.res',
          vars: {
            sol: s.sol,
            time: S.util.clock(gh.frozenMinute),
            kwh: s.design.batteryKwh,
            ins: S.t('ins.' + s.design.insulation + '.name'),
            temp: Math.round(ambientC),
            penalty: d.scoring.lostSystemPenaltyPoints
          },
          score: -d.scoring.lostSystemPenaltyPoints
        },
        s
      );
      if (s.solStart) s.solStart.events.push('greenhouse_frozen');
      S.bus.emit('greenhouse:frozen', { sol: s.sol, cause });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Yaşam desteği, elbise, radyasyon, moral, toz                        */
  /* ------------------------------------------------------------------ */
  Sim.stepLife = function (s, dt, ambientC) {
    const d = D();
    const c = d.constants;
    const perMin = dt / c.sol.minutes;
    const outside = Sim.isOutside(s);

    // Habitat O2 rezervi: içerideyken mürettebat tüketir, MOXIE üretir
    if (!outside) s.res.o2ReserveKg -= c.lifeSupport.o2KgPerSol * perMin;
    if (Sim.loadSupplied(s, 'moxie') && Sim.has(s, 'moxie') && Sim.deployed(s, 'isru')) {
      const night = Sim.tod(s) === 'night';
      const boost = 1 + (s.rewards.moxieBoostPct || 0) / 100;
      const gph = (night ? c.moxie.o2GramsPerHourNight : c.moxie.o2GramsPerHourDay) * (night ? boost : 1);
      s.res.o2ReserveKg += (gph / 1000) * (dt / 60);
    }
    s.res.o2ReserveKg = Math.max(0, s.res.o2ReserveKg);
    s.res.waterL = Math.max(0, s.res.waterL - c.lifeSupport.waterLPerSol * perMin * (s.rewards.waterSaver ? 0.8 : 1));

    // Radyasyon ve moral
    s.res.radiationMsv += c.radiation.surfaceDailyMsv * perMin;
    let morale = d.gameplay.moralePerSol * perMin;
    if (s.res.habTempC < d.gameplay.habitatComfortMinC) morale += (d.gameplay.lowHabitatTempMoralePerHour * dt) / 60;
    if (s.res.waterL <= 0) morale += (d.gameplay.lowHabitatTempMoralePerHour * dt) / 60;
    if (s.greenhouse.installed && !s.greenhouse.frozen && Sim.loadSupplied(s, 'greenhouse')) {
      morale += d.habitat.greenhouse.moralePerSolHealthy * perMin * (s.greenhouse.yieldPct / 100);
    }
    s.res.morale = clamp(s.res.morale + morale, 0, 100);

    // Panel tozu (günlük birikim + fırtına)
    const dustAdd = c.panelDust.dailyAccumulation + (s.weather.stormTau > 0 ? c.dustStorm.panelDustAddPerSol : 0);
    s.res.panelDust = clamp(s.res.panelDust + dustAdd * perMin, 0, c.panelDust.maxDust);

    // Elbise
    const eva = c.eva;
    const suit = s.suit;
    if (outside) {
      const o2Factor = (suit.leak ? eva.suitLeakO2Multiplier : 1) * (s.rewards.evaO2Factor || 1);
      suit.o2 = Math.max(0, suit.o2 - eva.suitO2PctPerMin * o2Factor * dt);
      // Batı buz alanı (K2 Sude): daha soğuk; ısıtıcılar daha çok çalışır, derinde ısı kaybını karşılayamaz
      const wc = Sim.westCold(s);
      const localC = ambientC + wc.extraC;
      suit.battery = Math.max(0, suit.battery - E().calcSuitBatteryDrainPctPerMin({ ambientC: localC, integrity: suit.integrity }) * dt);
      if (suit.battery > 0) {
        suit.tempC = Math.min(eva.suitNominalC, suit.tempC + eva.suitHeaterWarmCPerMin * dt - wc.bleedCPerMin * dt);
      } else {
        // Isıtıcı durdu: elbise dış sıcaklığa üstel yaklaşır (adım boyundan bağımsız; HUD geri sayımıyla aynı formül)
        suit.tempC = localC + (suit.tempC - localC) * Math.exp(-eva.suitCoolingFracPerMin * dt) - wc.bleedCPerMin * dt;
      }
      s.stats.minutesOutside += dt;
      s.stats.maxDistanceM = Math.max(s.stats.maxDistanceM, Sim.distanceFromHab(s));
    } else {
      suit.tempC = Math.min(eva.suitNominalC, suit.tempC + eva.suitHabitatWarmCPerMin * dt);
      suit.frozen = false;
      suit.coldMinutes = 0;
    }

    // Eklem donması (M4 çentiği sıçrar)
    if (outside && !suit.frozen && suit.tempC <= eva.jointFreezeSuitC) {
      suit.frozen = true;
      S.bus.emit('eva:frozen', { distanceM: Sim.distanceFromHab(s) });
      // Frozen by the deep cold of the ice field: the joints stiffen (slower walk, higher M4 notch)
      // but the heaters still work, so no heater-failure card that would also empty the battery.
      if (!s.crisis.active && Sim.westCold(s).bleedCPerMin <= 0) S.Events.trigger(s, 'joint_freeze', { dynamic: true });
    } else if (suit.frozen && suit.tempC > eva.jointFreezeSuitC + 6) {
      suit.frozen = false;
      S.bus.emit('eva:unfrozen', {});
    }
    if (outside && suit.tempC <= eva.hypothermiaSuitC) suit.coldMinutes += dt;
    else suit.coldMinutes = 0;
  };

  /* ------------------------------------------------------------------ */
  /* Downlink (M1) — röle geçişleri ve ışık gecikmesi                     */
  /* ------------------------------------------------------------------ */
  Sim.passes = function (s) {
    return D().habitat.relayPasses.filter((p) => !p.requires || p.requires === s.design.commArchitecture);
  };

  Sim.activePass = function (s) {
    const m = Sim.clockMinute(s);
    return Sim.passes(s).find((p) => m >= p.startMinute && m < p.startMinute + p.durationMin) || null;
  };

  Sim.nextPass = function (s) {
    const m = Sim.clockMinute(s);
    const list = Sim.passes(s);
    const today = list.filter((p) => p.startMinute + p.durationMin > m).sort((a, b) => a.startMinute - b.startMinute);
    if (today.length) return { pass: today[0], inMin: Math.max(0, today[0].startMinute - m) };
    const first = list.slice().sort((a, b) => a.startMinute - b.startMinute)[0];
    return { pass: first, inMin: 1480 - m + first.startMinute };
  };

  Sim.passCapacityLeft = function (s, pass) {
    const used = s.downlink.passUsedMbit[pass.id] || 0;
    return Math.max(0, pass.capacityMbit - used);
  };

  Sim.todayCapacity = function (s) {
    const total = Sim.passes(s).reduce((a, p) => a + p.capacityMbit, 0) + s.downlink.extraMbit;
    const used = Object.values(s.downlink.passUsedMbit).reduce((a, b) => a + b, 0);
    return { total, used: round1(used), left: round1(Math.max(0, total - used)) };
  };

  Sim.stepDownlink = function (s, dt) {
    const dl = s.downlink;
    const h = Sim.horizons(s);
    // Uçuştaki paketler ışık gecikmesi sonunda Dünya'ya ulaşır
    for (const p of dl.queue) {
      if (p.status === 'sent' && s.totalMinutes >= p.arriveAt) Sim.markArrived(s, p);
    }
    if (h.conjunction || dl.paused) return;
    const pass = Sim.activePass(s);
    if (!pass || !Sim.loadSupplied(s, 'comms')) return;

    // Kriz kaynaklı kayıp kapasite önce tüketilir
    let cap = Sim.passCapacityLeft(s, pass) + (dl.extraMbit > 0 ? dl.extraMbit : 0);
    if (dl.lossMbit > 0) {
      const burn = Math.min(cap, dl.lossMbit);
      dl.lossMbit -= burn;
      dl.passUsedMbit[pass.id] = (dl.passUsedMbit[pass.id] || 0) + burn;
      cap -= burn;
    }
    // Aletlerin günlük rutin verisi (gameplay.instrumentData) raporlardan önce, geçişin kendi hızıyla gider
    let rate = (pass.capacityMbit / pass.durationMin) * dt;
    if (dl.routineMbit > 0) {
      const burn = Math.min(Sim.passCapacityLeft(s, pass), dl.routineMbit, rate);
      dl.routineMbit = Math.max(0, dl.routineMbit - burn);
      dl.passUsedMbit[pass.id] = round2((dl.passUsedMbit[pass.id] || 0) + burn);
      cap -= burn;
      rate -= burn;
    }
    let budget = Math.min(cap, rate * (dl.extraMbit > 0 ? 1.6 : 1));
    for (const p of dl.queue) {
      if (budget <= 0) break;
      if (p.status !== 'queued' && p.status !== 'sending') continue;
      const need = p.sizeMbit - p.progressMbit;
      const send = Math.min(need, budget);
      p.progressMbit = round2(p.progressMbit + send);
      p.status = 'sending';
      budget -= send;
      const fromExtra = Math.min(dl.extraMbit, send);
      dl.extraMbit = round2(dl.extraMbit - fromExtra);
      dl.passUsedMbit[pass.id] = round2((dl.passUsedMbit[pass.id] || 0) + (send - fromExtra));
      if (s.solStart) s.solStart.sentMbit += send;
      if (p.progressMbit >= p.sizeMbit - 1e-6) {
        p.status = 'sent';
        p.arriveAt = s.totalMinutes + h.seconds / 60;
        S.bus.emit('downlink:sent', p);
      }
    }
  };

  Sim.markArrived = function (s, p) {
    p.status = 'arrived';
    if (p.kind === 'forensic' && s.forensics[p.refId]) s.forensics[p.refId].sent = true;
    if (p.kind === 'experiment' && s.experiments[p.refId]) s.experiments[p.refId].sent = true;
    if (p.kind === 'report' && s.explore && s.explore.reports[p.refId]) s.explore.reports[p.refId].sent = true;
    if (p.kind === 'family') s.res.morale = clamp(s.res.morale + D().scoring.familyMessageMorale, 0, 100);
    S.bus.emit('downlink:arrived', p);
  };

  /** Kuyruğa paket ekle (aynı refId varsa günceller) */
  Sim.queuePacket = function (s, pkt) {
    const dl = s.downlink;
    const existing = dl.queue.find((p) => p.kind === pkt.kind && p.refId === pkt.refId && p.status === 'queued');
    if (existing) {
      Object.assign(existing, pkt);
      return existing;
    }
    const p = Object.assign({ id: 'pkt' + dl.nextId++, progressMbit: 0, status: 'queued', vars: {} }, pkt);
    dl.queue.push(p);
    S.bus.emit('downlink:queued', p);
    return p;
  };

  Sim.movePacket = function (s, id, dir) {
    const q = s.downlink.queue;
    const i = q.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= q.length) return;
    const tmp = q[i];
    q[i] = q[j];
    q[j] = tmp;
  };

  /* ------------------------------------------------------------------ */
  /* Ana adım ve zaman ilerletme                                          */
  /* ------------------------------------------------------------------ */
  Sim.step = function (s, dtMinutes) {
    if (s.gameOver || s.ending || s.scene === 'transit') return;
    let left = dtMinutes;
    while (left > 1e-6 && !s.gameOver && !s.ending) {
      const dt = Math.min(MAX_STEP_MIN, left);
      left -= dt;
      const amb = Sim.ambient(s);
      Sim.stepPower(s, dt, amb);
      Sim.stepThermal(s, dt, amb);
      Sim.stepLife(s, dt, amb);
      Sim.stepDownlink(s, dt);
      s.minute += dt;
      s.totalMinutes += dt;
      if (S.Events) S.Events.checkSchedule(s);
      Sim.checkGameOver(s);
      if (s.minute >= D().gameplay.solStartMinute + D().constants.sol.minutes) Sim.rollover(s);
    }
  };

  /**
   * Eylemlerin zaman maliyetini işler. stopOnCrisis: uyurken kriz gelirse uyanılır.
   * Dönüş: gerçekten ilerletilen dakika.
   */
  Sim.advance = function (s, minutes, { stopOnCrisis = false } = {}) {
    let done = 0;
    while (done < minutes - 1e-6 && !s.gameOver && !s.ending) {
      const dt = Math.min(MAX_STEP_MIN, minutes - done);
      Sim.step(s, dt);
      done += dt;
      if (stopOnCrisis && s.crisis.active) break;
    }
    return done;
  };

  Sim.checkGameOver = function (s) {
    if (s.gameOver) return;
    const c = D().constants;
    let reason = null;
    if (Sim.isOutside(s) && s.suit.o2 <= 0) reason = 'suit_o2';
    else if (!Sim.isOutside(s) && s.res.o2ReserveKg <= 0) reason = 'o2_reserve';
    else if (s.suit.coldMinutes >= c.eva.hypothermiaMinutes) reason = 'hypothermia';
    else if (s.res.radiationMsv >= c.radiation.careerLimitMsv) reason = 'radiation';
    else if (s.res.morale <= 0) reason = 'morale';
    if (reason) {
      s.gameOver = { reason, sol: s.sol, time: S.util.clock(Sim.clockMinute(s)) };
      S.logDecision({ category: 'system', titleKey: 'log.gameover.title', choiceKey: 'gameover.' + reason, resultKey: 'log.gameover.res', score: 0 }, s);
      S.bus.emit('mission:gameover', s.gameOver);
    }
  };

  /** M6 — Sol X -> Sol X+1 */
  Sim.rollover = function (s) {
    const d = D();
    const st = s.solStart || {};
    const summary = {
      from: s.sol,
      to: s.sol + 1,
      energy: [round1(st.energyKwh || 0), round1(s.res.energyKwh)],
      o2: [round2(st.o2ReserveKg || 0), round2(s.res.o2ReserveKg)],
      water: [round1(st.waterL || 0), round1(s.res.waterL)],
      morale: [Math.round(st.morale || 0), Math.round(s.res.morale)],
      fuel: [Math.round(st.mavFuel || 0), Math.round(s.res.mavFuel)],
      sentMbit: round1(st.sentMbit || 0),
      shed: Object.keys(st.shed || {}),
      events: (st.events || []).slice(),
      greenhouseFrozen: s.greenhouse.frozen && s.greenhouse.frozenSol === s.sol,
      final: s.sol >= s.maxSols
    };
    s.solHistory.push(summary);
    summary.greenhouseGrew = Sim.growGreenhouse(s);

    if (s.sol >= s.maxSols) {
      // Son Sol bitti: MAV otomatik kalkar
      s.minute -= d.constants.sol.minutes;
      Sim.launchMav(s, { auto: true });
      return;
    }
    s.sol += 1;
    s.minute -= d.constants.sol.minutes;
    s.downlink.passUsedMbit = {};
    s.downlink.lossMbit = 0;
    s.downlink.extraMbit = 0;
    s.downlink.routineMbit = Sim.instrumentDataMbit(s);
    if (s.weather.stormSolsLeft > 0) {
      s.weather.stormSolsLeft -= 1;
      if (s.weather.stormSolsLeft <= 0) {
        s.weather.stormTau = 0;
        S.bus.emit('fx:weather', { type: 'clear' });
      }
    }
    if (S.Station) S.Station.checkImpact(s); // D-014: Sol 2'de göktaşı kargoyu saçar
    Sim.snapshotSolStart(s);
    Sim.prepareWarnings(s);
    S.saveGame();
    S.saveCheckpoint(s);
    S.bus.emit('sol:advance', summary);
  };

  /* ------------------------------------------------------------------ */
  /* MAV kalkışı ve görev sonu                                            */
  /* ------------------------------------------------------------------ */
  Sim.canLaunchMav = (s) => s.sol >= s.maxSols;

  Sim.launchMav = function (s, { auto = false } = {}) {
    if (s.ending) return;
    for (const p of s.downlink.queue) if (p.status === 'sent') Sim.markArrived(s, p);
    // MAV kurulmadıysa güvenli dönüş yok
    const fuelOk = s.res.mavFuel >= 100 && Sim.deployed(s, 'mav');
    s.ending = {
      auto,
      fuelOk,
      sol: s.sol,
      ufoPct: S.Score.ufoDownloadPct(s),
      cameraTier: Sim.has(s, 'mastcam_z') ? 'high' : 'low'
    };
    s.scene = 'ending';
    S.logDecision(
      {
        category: 'system',
        titleKey: 'log.mav.title',
        choiceKey: auto ? 'log.mav.auto' : 'log.mav.manual',
        resultKey: fuelOk ? 'log.mav.res_ok' : 'log.mav.res_lowfuel',
        vars: { fuel: Math.round(s.res.mavFuel) },
        score: fuelOk ? 0 : -D().scoring.safeReturnBonusPoints
      },
      s
    );
    S.clearSave();
    S.bus.emit('mission:end', s.ending);
  };

  /* ------------------------------------------------------------------ */
  /* Oyuncu eylemleri (habitat paneli ve yüzey etkileşimleri)             */
  /* ------------------------------------------------------------------ */
  const A = () => D().gameplay.actions;

  Sim.actions = {
    refill_suit: {
      minutes: () => A().refillSuitMin,
      preview(s) {
        const missing = 100 - s.suit.o2;
        const kg = round2((missing / 100) * D().constants.lifeSupport.suitO2CapacityKg);
        return { from: Math.round(s.suit.o2), to: 100, costKey: 'action.cost_o2reserve', costVars: { kg } };
      },
      can: (s) => (s.res.o2ReserveKg > 0.2 ? null : 'action.err_no_o2'),
      run(s) {
        const kg = ((100 - s.suit.o2) / 100) * D().constants.lifeSupport.suitO2CapacityKg;
        s.res.o2ReserveKg = Math.max(0, s.res.o2ReserveKg - kg);
        s.suit.o2 = 100;
      }
    },
    charge_suit: {
      minutes: () => A().chargeSuitMin,
      preview(s) {
        const kwh = round2(((100 - s.suit.battery) / 100) * D().gameplay.suitBatteryKwh);
        return { from: Math.round(s.suit.battery), to: 100, costKey: 'action.cost_kwh', costVars: { kwh } };
      },
      can: (s) => (s.res.energyKwh > 0.5 ? null : 'action.err_no_energy'),
      run(s) {
        const kwh = ((100 - s.suit.battery) / 100) * D().gameplay.suitBatteryKwh;
        s.res.energyKwh = Math.max(0, s.res.energyKwh - kwh);
        s.suit.battery = 100;
      }
    },
    // Tamir kiti varsa: tam onarım, daha kısa sürer, bir kit harcanır. Kit yoksa: yama ile kısmi onarım, daha uzun.
    // Her iki durumda da sızıntı kapanır. (Süre ve miktarlar: gameplay.actions)
    repair_suit: {
      minutes: (s) => ((s.inventory.repairKits || 0) > 0 ? A().repairSuitKitMin : A().repairSuitMin),
      preview(s) {
        const kits = s.inventory.repairKits || 0;
        return {
          from: Math.round(s.suit.integrity),
          to: kits > 0 ? 100 : Math.min(100, Math.round(s.suit.integrity + A().repairSuitIntegrity)),
          costKey: kits > 0 ? 'action.cost_repair_kit' : 'action.cost_repair_nokit',
          costVars: { left: Math.max(0, kits - 1), pct: A().repairSuitIntegrity, kitMin: A().repairSuitKitMin }
        };
      },
      can: (s) => (s.suit.integrity >= 100 && !s.suit.leak ? 'action.err_suit_ok' : null),
      run(s) {
        if ((s.inventory.repairKits || 0) > 0) {
          s.inventory.repairKits -= 1;
          s.suit.integrity = 100;
        } else {
          s.suit.integrity = Math.min(100, s.suit.integrity + A().repairSuitIntegrity);
        }
        s.suit.leak = false;
      }
    },
    tend_greenhouse: {
      minutes: () => D().habitat.greenhouse.tendMinutes,
      preview(s) {
        const g = D().habitat.greenhouse;
        return {
          from: Math.round(s.res.morale),
          to: Math.min(100, Math.round(s.res.morale + g.tendMorale * (s.greenhouse.yieldPct / 100))),
          costKey: 'action.cost_water',
          costVars: { l: g.tendWaterL }
        };
      },
      can(s) {
        if (!s.greenhouse.installed) return 'action.err_no_veggie';
        if (s.greenhouse.frozen) return 'action.err_gh_frozen';
        if (s.res.waterL < D().habitat.greenhouse.tendWaterL) return 'action.err_no_water';
        if (s.greenhouse.tendedSol === s.sol) return 'action.err_gh_done';
        return null;
      },
      run(s) {
        const g = D().habitat.greenhouse;
        s.res.waterL -= g.tendWaterL;
        s.res.morale = clamp(s.res.morale + g.tendMorale * (s.greenhouse.yieldPct / 100), 0, 100);
        s.greenhouse.tendedSol = s.sol;
      }
    },
    harvest_greenhouse: {
      minutes: () => GROWTH().harvestMinutes,
      preview(s) {
        const g = GROWTH();
        return {
          from: Math.round(s.res.morale),
          to: Math.min(100, Math.round(s.res.morale + g.harvestMorale)),
          costKey: 'action.cost_harvest',
          costVars: { kg: round1(g.harvestFoodKg * (s.greenhouse.yieldPct / 100)) }
        };
      },
      can(s) {
        if (!s.greenhouse.installed) return 'action.err_no_veggie';
        if (s.greenhouse.frozen) return 'action.err_gh_frozen';
        if (!Sim.ghMature(s)) return 'action.err_gh_not_ripe';
        return null;
      },
      run(s) {
        const g = GROWTH();
        const kg = round1(g.harvestFoodKg * (s.greenhouse.yieldPct / 100));
        // Hasat yiyecek stoğuna gider (Kişi 2'nin açlık göstergesi buradan okur) ve yeniden ekilir
        s.res.foodKg = round1((s.res.foodKg || 0) + kg);
        s.res.morale = clamp(s.res.morale + g.harvestMorale, 0, 100);
        s.greenhouse.stage = 0;
        s.greenhouse.harvests = (s.greenhouse.harvests || 0) + 1;
        S.bus.emit('greenhouse:harvest', { foodKg: kg, total: s.res.foodKg, harvests: s.greenhouse.harvests });
      }
    },
    clean_panels: {
      minutes: () => A().cleanPanelsMin,
      preview(s) {
        return { from: Math.round(s.res.panelDust * 100), to: 0, costKey: 'action.cost_eva_time', costVars: {} };
      },
      can: (s) => (s.res.panelDust < 0.02 ? 'action.err_panels_clean' : null),
      run(s) {
        s.res.panelDust = 0;
      }
    },
    sabatier: {
      minutes: () => D().constants.sabatier.batchMinutes,
      preview(s) {
        const c = D().constants.sabatier;
        return {
          from: Math.round(s.res.mavFuel),
          to: Math.min(100, Math.round(s.res.mavFuel + c.mavFuelPctPerBatch)),
          costKey: 'action.cost_sabatier',
          costVars: { kwh: c.energyKwh, l: c.waterL }
        };
      },
      can(s) {
        const c = D().constants.sabatier;
        if (!Sim.hasIsru(s)) return 'action.err_no_isru';
        if (!Sim.deployed(s, 'isru')) return 'action.err_isru_packed';
        if (!Sim.deployed(s, 'mav')) return 'action.err_mav_packed';
        if (s.res.mavFuel >= 100) return 'action.err_fuel_full';
        if (s.res.energyKwh < c.energyKwh) return 'action.err_no_energy';
        if (s.res.waterL < c.waterL) return 'action.err_no_water';
        return null;
      },
      run(s) {
        const c = D().constants.sabatier;
        s.res.energyKwh -= c.energyKwh;
        s.res.waterL -= c.waterL;
        s.res.mavFuel = Math.min(100, s.res.mavFuel + c.mavFuelPctPerBatch);
        s.res.o2ReserveKg += c.o2ByproductKg;
      }
    },
    dig_ice: {
      minutes: () => D().terrain.iceDigMinutes,
      preview(s) {
        return { from: Math.round(s.res.waterL), to: Math.round(s.res.waterL + D().terrain.iceDigWaterL), costKey: 'action.cost_eva_time', costVars: {} };
      },
      can: (s) => (s.iceDugSol === s.sol ? 'action.err_ice_done' : null),
      run(s) {
        s.res.waterL += D().terrain.iceDigWaterL;
        s.iceDugSol = s.sol;
      }
    }
  };

  /** Bir eylemi çalıştırır: koşul -> zaman maliyeti -> etki */
  Sim.doAction = function (s, id) {
    const act = Sim.actions[id];
    if (!act) return { ok: false, errKey: 'action.err_unknown' };
    const err = act.can(s);
    if (err) return { ok: false, errKey: err };
    const minutes = act.minutes(s); // süre eylemden önce okunur (tamir kiti harcanınca değişir)
    act.run(s);
    Sim.advance(s, minutes);
    S.bus.emit('action:done', { id });
    return { ok: true };
  };

  /** Dinlen: ertesi sabaha kadar uyu (kriz gelirse uyan) */
  Sim.sleep = function (s) {
    const d = D();
    const target = d.gameplay.solStartMinute + d.constants.sol.minutes;
    const startSol = s.sol;
    const minutes = target - s.minute + 0.01;
    Sim.advance(s, minutes, { stopOnCrisis: true });
    if (s.sol !== startSol || s.ending) {
      s.res.morale = clamp(s.res.morale + A().sleepMorale, 0, 100);
      s.suit.battery = Math.max(s.suit.battery, 100);
      return { ok: true, interrupted: false };
    }
    return { ok: true, interrupted: Boolean(s.crisis.active) };
  };

  /* ------------------------------------------------------------------ */
  /* Güç paneli kontrolleri                                               */
  /* ------------------------------------------------------------------ */
  Sim.moveLoad = function (s, id, dir) {
    const i = s.loads.findIndex((l) => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.loads.length) return;
    const tmp = s.loads[i];
    s.loads[i] = s.loads[j];
    s.loads[j] = tmp;
  };

  Sim.toggleLoad = function (s, id) {
    const l = s.loads.find((x) => x.id === id);
    if (!l || id === 'life_support') return;
    l.on = !l.on;
  };

  Sim.LOAD_ORDER_DEFAULT = LOAD_ORDER_DEFAULT;
  S.Sim = Sim;
})((window.SOL14 = window.SOL14 || {}));
