/**
 * TESTING.md §1 — Mühendislik formülleri (src/core/engineering.js)
 * Gerçek oyun kodu tarayıcıdaki script sırasıyla vm içinde yüklenir (tests/helpers/load_core.js).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

const S = loadCore();
const E = S.Engineering;
const D = S.DATA;

test('calcSolarPower: temiz panel > tozlu panel (d_toz = 0.8)', () => {
  const clean = E.calcSolarPower({ cosZ: 1, dustFactor: 0 });
  const dusty = E.calcSolarPower({ cosZ: 1, dustFactor: 0.8 });
  // P = S·A·η·cosZ → 586.2 · 22 · 0.28 ≈ 3611 W
  const expected = D.constants.solarIrradiance.mean * D.habitat.base.solarAreaM2 * D.habitat.base.solarEfficiency;
  assert.ok(Math.abs(clean - expected) < 1, `temiz panel ${clean} W ≈ ${expected} W olmalı`);
  assert.ok(Math.abs(dusty - expected * 0.2) < 1, `%80 toz → %20 üretim (${dusty} W)`);
});

test('calcSolarPower: Meridiani (ekvator) öğle üretimi Arcadia (~40°K) üretiminden yüksek', () => {
  const site = (id) => D.landingSites.find((x) => x.id === id);
  const meridiani = E.calcSolarPower({ cosZ: site('meridiani').cosZNoon });
  const arcadia = E.calcSolarPower({ cosZ: site('arcadia').cosZNoon });
  assert.ok(meridiani > arcadia);
  assert.ok(Math.abs(meridiani / arcadia - site('meridiani').cosZNoon / site('arcadia').cosZNoon) < 0.01);
});

test('calcSolarPower: toz fırtınası (τ) üretimi üstel olarak düşürür', () => {
  const clear = E.calcSolarPower({ cosZ: 1, tau: 0 });
  const storm = E.calcSolarPower({ cosZ: 1, tau: D.constants.dustStorm.opportunityTau });
  assert.ok(storm < clear * 0.2, `τ=10.8 fırtınasında üretim ${storm} W, temizin %20'sinden az olmalı`);
});

test('calcDeltaV: m0 > mf için pozitif Δv, sınır değerlerde 0', () => {
  const dv = E.calcDeltaV({ isp: 360, wetMass: 3000, dryMass: 1000 });
  // 360 · 9.80665 · ln 3 ≈ 3879 m/s
  assert.ok(Math.abs(dv - 3879) <= 1, `Δv = ${dv}`);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 1000, dryMass: 1000 }), 0);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 500, dryMass: 1000 }), 0);
  assert.equal(E.calcDeltaV({ isp: 360, wetMass: 500, dryMass: 0 }), 0);
});

test('calcLightDelay: en yakın ~3 dk, en uzak ~22 dk', () => {
  const near = E.calcLightDelay(5.5e7);
  const far = E.calcLightDelay(4.0e8);
  assert.ok(near.minutes > 3 && near.minutes < 3.2, `yakın: ${near.minutes} dk`);
  assert.ok(far.minutes > 22 && far.minutes < 22.5, `uzak: ${far.minutes} dk`);
  assert.equal(near.mm * 60 + near.ss, near.seconds);
});

test('getHorizons: son Sol Güneş Kavuşumu (iletişim kesintisi)', () => {
  assert.equal(E.getHorizons(14, 14).conjunction, true);
  assert.equal(E.getHorizons(5, 14).conjunction, false);
  const d = E.getHorizons(1, 14);
  assert.ok(d.minutes >= 3 && d.minutes <= 22.5, 'tek yön gecikme 3–22 dk aralığında');
});

test('calcPendulumPeriod: 1 m sarkaç Mars ≈ 3.25 s, Dünya ≈ 2.01 s, oran ≈ 1.62', () => {
  const mars = E.calcPendulumPeriod(1);
  const earth = E.calcPendulumPeriod(1, D.constants.marsGravity.earthValue);
  assert.equal(mars, 3.25);
  assert.equal(earth, 2.01);
  assert.ok(Math.abs(mars / earth - 1.62) < 0.01);
});

test('calcFreeFallTime: 2 m düşüş Mars ≈ 1.04 s, Dünya ≈ 0.64 s', () => {
  assert.equal(E.calcFreeFallTime(2), 1.04);
  assert.equal(E.calcFreeFallTime(2, D.constants.marsGravity.earthValue), 0.64);
});

test('calcPointOfNoReturnO2 (M4): 900 m mesafede donmuş eklem çentiği 2.5× sıçrar', () => {
  const normal = E.calcPointOfNoReturnO2({ distanceM: 900 });
  const frozen = E.calcPointOfNoReturnO2({ distanceM: 900, jointFrozen: true });
  // (900 / 45) · 0.2083 · 1.2 = 5.0 %   (0.2083 %/dk = %100 / 480 dk, xEVA 8 sa)
  assert.equal(normal, 5);
  assert.equal(frozen, 12.5);
  assert.ok(Math.abs(frozen / normal - 1 / D.constants.eva.frozenSpeedFactor) < 0.01);
  const leak = E.calcPointOfNoReturnO2({ distanceM: 900, leak: true });
  assert.equal(leak, 10, 'sızıntı O₂ tüketimini 2× yapar');
  assert.equal(E.calcPointOfNoReturnO2({ distanceM: 0 }), 0);
  assert.equal(E.calcPointOfNoReturnO2({ distanceM: 1e6 }), 100, 'çentik %100 ile sınırlı');
});

test('M4: donmuş eklemle uzakta dönüşsüzlük noktası aşılır ve HUD durumu "beyond" olur', () => {
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  s.player.inside = false;
  s.player.x = 1200;
  s.suit.o2 = 12; // normal hızla gereken %6.7, donmuş eklemle %16.7
  s.suit.frozen = false;
  assert.equal(S.Sim.ponr(s).beyond, false);
  s.suit.frozen = true;
  const p = S.Sim.ponr(s);
  assert.equal(p.beyond, true);
  assert.equal(p.speedPct, 40);
  assert.ok(p.jumpFactor >= 2.4);
});

test('Elbise O₂: dolu elbise xEVA\'nın 8 saatlik çıkışı kadar dayanır (%100 / 480 dk)', () => {
  const minutes = 100 / D.constants.eva.suitO2PctPerMin;
  assert.ok(Math.abs(minutes - 480) <= 1, `dolu elbise ${minutes.toFixed(1)} dk dayanmalı (8 sa)`);
  assert.match(D.constants.eva.src, /xeva/, 'kaynak xEVA System ConOps olmalı (D-009)');
  assert.equal(D.constants.eva.simplified, true);
});

test('Elbise bataryası: −80 °C\'de dolu batarya ısıtıcıyı ~8 sa çalıştırır; soğukta daha hızlı biter', () => {
  const at = (c) => 100 / E.calcSuitBatteryDrainPctPerMin({ ambientC: c });
  assert.ok(at(-80) >= 450 && at(-80) <= 510, `−80 °C: ${at(-80).toFixed(0)} dk`);
  assert.ok(at(-95) < at(-80) && at(-80) < at(0), 'ısıtıcı yükü dış sıcaklıkla artar');
  const worn = 100 / E.calcSuitBatteryDrainPctPerMin({ ambientC: -80, integrity: 30 });
  assert.ok(worn < at(-80), 'hasarlı elbise bataryayı daha hızlı tüketir');
});

test('Batarya bitince: eklem donmasına −80 °C\'de 45–60 dk uyarılı pencere, hipotermi eşiği çok daha sonra', () => {
  const eva = D.constants.eva;
  for (const site of D.landingSites) {
    const freeze = E.calcSuitCoolingMinutes({ fromC: eva.suitNominalC, toC: eva.jointFreezeSuitC, ambientC: site.nightMinC });
    assert.ok(freeze >= 45 && freeze <= 60, `${site.id} (${site.nightMinC} °C): eklem donması ${freeze.toFixed(1)} dk`);
    const hypo = E.calcSuitCoolingMinutes({ fromC: eva.suitNominalC, toC: eva.hypothermiaSuitC, ambientC: site.nightMinC });
    assert.ok(hypo > freeze * 1.8, `${site.id}: hipotermi eşiği ${hypo.toFixed(0)} dk`);
  }
  assert.equal(E.calcSuitCoolingMinutes({ fromC: 22, toC: 2, ambientC: 5 }), Infinity, 'dış hava eşikten sıcaksa donma yok');
  assert.equal(E.calcSuitCoolingMinutes({ fromC: 0, toC: 2, ambientC: -80 }), 0);
});

test('Elbise ısıl modeli: simülasyon formülle aynı sürede donar ve kare hızından bağımsızdır', () => {
  const eva = D.constants.eva;
  const run = (stepMin) => {
    const s = S.State.reset({});
    S.Sim.launch(s);
    S.Sim.land(s, null);
    s.player.inside = false;
    s.player.x = 300;
    s.minute = 1480 + 200; // gece, en soğuk saate yakın
    s.suit.battery = 0;
    const amb = S.Sim.ambient(s);
    const expected = E.calcSuitCoolingMinutes({ fromC: s.suit.tempC, toC: eva.jointFreezeSuitC, ambientC: amb });
    const th = S.Sim.suitThermal(s);
    assert.equal(th.state, 'cooling');
    assert.ok(Math.abs(th.freezeMinutes - expected) < 0.01, 'HUD geri sayımı formülle aynı');
    let t = 0;
    while (!s.suit.frozen && t < 240 && !s.gameOver) {
      S.Sim.step(s, stepMin);
      t += stepMin;
    }
    return { t, expected };
  };
  const coarse = run(1);
  const frame = run(2 / 60); // 60 fps'de bir kare (normal oyun saati 2 oyun dk / s)
  assert.ok(Math.abs(coarse.t - coarse.expected) < 3, `1 dk adım: ${coarse.t} dk ≈ ${coarse.expected.toFixed(1)} dk`);
  assert.ok(Math.abs(frame.t - coarse.t) < 1, `kare adımı ${frame.t.toFixed(1)} dk ≈ 1 dk adımı ${coarse.t} dk`);
  assert.ok(frame.t >= 45 && frame.t <= 60, `uyarılı pencere ${frame.t.toFixed(1)} dk`);
});

test('Habitat ısıl modeli: ısıtma kesilince kare boyutunda adımlarla da soğur (yuvarlama soğumayı durdurmaz)', () => {
  // RTG'siz + kalın yalıtım: ısı kaybı ~150 W → bir karede ~0.004 °C; eskiden her adımda yuvarlanınca sıfırlanıyordu
  const s = S.State.reset({ design: Object.assign({}, S.State.DEFAULT_DESIGN, { powerSource: 'solar_only', insulation: 'thick' }) });
  assert.equal(S.Sim.launch(s).ok, true);
  S.Sim.land(s, null);
  s.player.inside = true;
  s.minute = 1480 + 200;
  s.loads.find((l) => l.id === 'heating').on = false;
  const start = s.res.habTempC;
  for (let i = 0; i < 60 * 30; i++) S.Sim.step(s, 2 / 60); // 30 gerçek saniye, 60 fps
  const coarse = S.State.reset({ design: Object.assign({}, S.State.DEFAULT_DESIGN, { powerSource: 'solar_only', insulation: 'thick' }) });
  S.Sim.launch(coarse);
  S.Sim.land(coarse, null);
  coarse.player.inside = true;
  coarse.minute = 1480 + 200;
  coarse.loads.find((l) => l.id === 'heating').on = false;
  S.Sim.advance(coarse, 60); // aynı 60 oyun dakikası, 5 dk'lık adımlarla
  assert.ok(s.res.habTempC < start - 3, `habitat ${start} → ${s.res.habTempC.toFixed(2)} °C`);
  assert.ok(Math.abs(s.res.habTempC - coarse.res.habTempC) < 0.3, `kare adımı ${s.res.habTempC.toFixed(2)} ≈ 5 dk adımı ${coarse.res.habTempC.toFixed(2)} °C`);
});

test('ambientTempAt: gece en düşük ≈ nightMinC (−80 °C civarı), gündüz-gece farkı 70–100 °C', () => {
  for (const site of D.landingSites) {
    const night = E.ambientTempAt(site, 330);
    const day = E.ambientTempAt(site, 840);
    assert.equal(night, site.nightMinC);
    assert.equal(day, site.dayMaxC);
    const swing = day - night;
    assert.ok(swing >= 70 && swing <= 100, `${site.id}: fark ${swing} °C`);
  }
  assert.ok(D.landingSites.every((x) => x.nightMinC <= -78), 'gece sıcaklığı −80 °C bandında (RULES §1.1)');
});

test('calcDesignTotals: varsayılan tasarım fırlatılabilir ve SPOF içermez', () => {
  const tot = E.calcDesignTotals(S.State.DEFAULT_DESIGN);
  assert.equal(tot.canLaunch, true);
  assert.equal(tot.spof.length, 0, 'SPOF: ' + tot.spof.join(', '));
  assert.ok(tot.massMarginPct >= D.habitat.massMarginGoodPct);
});

test('calcDesignTotals: kütle aşımı ve 5\'ten fazla alet hata verir', () => {
  const heavy = Object.assign({}, S.State.DEFAULT_DESIGN, {
    rocketId: 'falcon_heavy',
    orbitType: 'fast_transfer',
    batteryKwh: 60,
    instruments: ['seis', 'moxie', 'supercam', 'veggie', 'mastcam_z', 'meda'],
    repairKits: 2
  });
  const tot = E.calcDesignTotals(heavy);
  assert.ok(tot.errors.includes('design.err_too_many'));
  assert.ok(tot.errors.includes('design.err_mass'));
  assert.equal(tot.canLaunch, false);
});

test('Transit görev zinciri: sonuçlar iniş kaynaklarına eşlenir, geçilen görev BOZUK sayılır (ux-plan #6)', () => {
  const tr = D.gameplay.transit;
  const fx = tr.effects;
  const good = { success: true, score: 0.95, skipped: false };
  const skipped = { success: true, score: 0.6, skipped: true }; // runMinigame ESC sonucu
  const all = (r) => Object.fromEntries(tr.tasks.map((tk) => [tk.id, r]));
  // Bekleyen görev cezasızdır (kart önizlemesi); nominal görevler puan verir
  const none = S.Sim.transitOutcome(null);
  assert.equal(none.okCount, 0);
  assert.equal(none.chargeFrac, fx.okChargeFrac);
  const ok = S.Sim.transitOutcome(all(good));
  assert.deepEqual([ok.chargeFrac, ok.o2LossKg, ok.mavFuelLossPct, ok.moraleLoss], [fx.okChargeFrac, 0, 0, 0]);
  assert.equal(ok.score, tr.tasks.length * tr.scorePerTask);
  // Düşük kalite, başarısızlık ve geçme ayrı ayrı BOZUK; her görev yalnızca kendi kaynağını etkiler
  const mixed = S.Sim.transitOutcome({
    arrays: { success: true, score: tr.okScore - 0.01, skipped: false },
    leak: skipped,
    tcm: { success: false, score: 0.9, skipped: false },
    thermal: good
  });
  assert.deepEqual(Object.assign({}, mixed.status), { arrays: 'degraded', leak: 'degraded', tcm: 'degraded', thermal: 'ok' });
  assert.deepEqual([mixed.chargeFrac, mixed.o2LossKg, mixed.mavFuelLossPct, mixed.moraleLoss], [fx.degradedChargeFrac, fx.leakO2LossKg, fx.tcmMavFuelLossPct, 0]);

  // Sim.land: hepsi geçilirse başlangıç kaynakları düşer ve her görev günlüğe puansız yazılır
  const land = (transit) => {
    const s = S.State.reset({});
    S.Sim.launch(s);
    S.Sim.land(s, transit);
    return s;
  };
  const a = land(all(good));
  const b = land(all(skipped));
  assert.equal(a.res.energyKwh, Math.round(a.design.batteryKwh * fx.okChargeFrac * 10) / 10);
  assert.equal(b.res.energyKwh, Math.round(b.design.batteryKwh * fx.degradedChargeFrac * 10) / 10);
  assert.equal(Math.round((a.res.o2ReserveKg - b.res.o2ReserveKg) * 100) / 100, fx.leakO2LossKg);
  assert.equal(a.res.mavFuel - b.res.mavFuel, fx.tcmMavFuelLossPct);
  assert.equal(a.res.morale - b.res.morale, fx.thermalMoraleLoss);
  const logs = (s) => s.decisionLog.filter((l) => l.titleKey.startsWith('transit.'));
  assert.equal(logs(a).length, tr.tasks.length);
  assert.equal(logs(a).reduce((n, l) => n + l.score, 0), tr.tasks.length * tr.scorePerTask);
  assert.ok(logs(b).every((l) => l.score === 0 && l.choiceKey === 'log.transit.auto' && l.resultKey.endsWith('.degraded')));
  // Kart/günlük metinleri Sim.land ile aynı sayıları gösterir
  const v = S.Sim.transitVars(b, S.Sim.transitOutcome(all(skipped)));
  assert.deepEqual([v.o2, v.fuel, v.morale], [b.res.o2ReserveKg, b.res.mavFuel, b.res.morale]);
});

test('calcDesignTotals: night-load breakdown shown in the design console adds up (no new formula)', () => {
  for (const design of [S.State.DEFAULT_DESIGN, Object.assign({}, S.State.DEFAULT_DESIGN, { powerSource: 'solar_only', insulation: 'thin', landingSiteId: 'arcadia', instruments: ['rad'] })]) {
    const tot = E.calcDesignTotals(design);
    const base = D.habitat.base;
    assert.equal(tot.nightLoadW, base.lifeSupportW + base.commsW + tot.heatingNightW + tot.instrumentW);
    const expectKwh = Math.round(((Math.max(0, tot.nightLoadW - tot.rtgW) * tot.nightHours) / 1000) * 10) / 10;
    // nightHours is rounded to 0.1 h for display, so allow that rounding (≤ 0.05 h × load) plus 0.1 kWh
    const tol = 0.1 + (Math.max(0, tot.nightLoadW - tot.rtgW) * 0.05) / 1000;
    assert.ok(Math.abs(tot.nightNeedKwh - expectKwh) <= tol,`night need ${tot.nightNeedKwh} ≈ ${expectKwh} kWh`);
  }
});
