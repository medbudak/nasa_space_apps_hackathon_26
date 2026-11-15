/**
 * Oyuncu İlgisi ve Oyun Ritmi Planı — çekirdek davranış testleri
 * RIT-02 tek hedef · RIT-06 deney sonucunun kullanımı · RIT-07 ön işaret · RIT-08 krizsiz habitat penceresi
 * RIT-09 kontrol listesi · RIT-10 güvenli geri dönüş noktası
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadCore, readJson, ROOT } = require('./helpers/load_core.js');
const { play } = require('./helpers/bot.js');

function landed(opts = {}) {
  const S = loadCore();
  const s = S.State.reset(opts);
  S.Sim.launch(s);
  S.Sim.land(s);
  baseReady(S, s);
  return { S, s };
}

/** Üs sistemleri kurulmuş say (bu testler kurulum akışını değil sonrasını sınar; kurulum: explore.test.js) */
function baseReady(S, s) {
  for (const id of Object.keys(s.base)) if (S.Sim.deployAvailable(s, id)) s.base[id] = true;
  s.greenhouse.installed = S.Sim.has(s, 'veggie');
}

/** Sol 1 içeriden uyuyarak Sol n sabahına gel (krizleri A ile geç) */
function toSol(S, s, n) {
  s.player.inside = true;
  let guard = 0;
  while (s.sol < n && !s.gameOver && guard++ < 60) {
    S.Sim.sleep(s);
    if (s.crisis.active) S.Events.resolve(s, 'A');
  }
}

test('RIT-02: her an tek ana hedef + en fazla bir isteğe bağlı hedef; tüm hedef metinleri ve ipuçları TR/EN tanımlı', () => {
  const story = readJson('content', 'story.json');
  const src = fs.readFileSync(path.join(ROOT, 'src', 'core', 'objectives.js'), 'utf8');
  const ids = [...new Set([...src.matchAll(/goal\('([a-z_]+)'/g)].map((m) => m[1]))];
  assert.ok(ids.length >= 15, 'hedef kimlikleri bulunamadı');
  for (const id of ids) {
    for (const lang of ['tr', 'en']) {
      assert.ok(story[lang]['goal.' + id], `${lang}: goal.${id} eksik`);
      if (!id.startsWith('opt_')) assert.ok(story[lang]['goal.hint.' + id], `${lang}: goal.hint.${id} eksik`);
    }
  }

  // Görev bitince hedef kartı gizlenir
  const run = play(loadCore().State.DEFAULT_DESIGN);
  assert.ok(run.s.ending || run.s.gameOver);
  assert.equal(run.S.Objectives.compute(run.s), null);

  const { S, s } = landed();
  const g = S.Objectives.compute(s);
  assert.ok(g.main && typeof g.main.key === 'string');
  assert.ok(g.optional === null || typeof g.optional.key === 'string');
  S.debugMissingKeys = new Set();
  S.t(g.main.key, g.main.vars);
  S.t(g.main.hintKey, g.main.vars);
  assert.equal(S.debugMissingKeys.size, 0);
});

test('RIT-02/03: inişten hemen sonra hedef doğu keşfine yönlendirir (araç adı yok); araç kazılınca isimle ona (demoda da)', () => {
  for (const opts of [{}, { demoMode: true }]) {
    const ctx = landed(opts);
    assert.equal(S_main(ctx), 'explore_east');
    const { S, s } = ctx;
    s.player.x = S.Forensics.get('opportunity').distanceM;
    while (!S.Forensics.identified(s, S.Forensics.get('opportunity'))) S.Explore.dig(s, 'opportunity');
    const g = S.Objectives.compute(s).main;
    assert.equal(g.id, 'wreck_go');
    assert.equal(g.vars.name, 'MER-B Opportunity');
  }
});

function S_main({ S, s }) {
  return S.Objectives.compute(s).main.id;
}

test('RIT-02: hedef önceliği — hayati tehlike > son Sol > yarım inceleme > gece dönüşü', () => {
  const ctx = landed();
  const { S, s } = ctx;
  // Yarım kalan inceleme
  s.forensics.opportunity.evidence.photo = 0.9;
  assert.equal(S_main(ctx), 'wreck_finish');
  s.forensics.opportunity.evidence.telemetry = 0.9;
  assert.equal(S_main(ctx), 'wreck_diagnose');
  // Hayati tehlike her şeyin önünde
  s.player.x = 1400;
  s.suit.o2 = 10; // 1400 m'den dönüş %7.8 O₂ ister: +%5 güvenlik payının içinde → kritik
  assert.equal(S_main(ctx), 'return');
  // Elbise bataryası bitince (O₂ yeterli olsa da) ısıtıcı durur: önce eve dönüş
  s.suit.o2 = 100;
  s.suit.battery = 0;
  assert.equal(S_main(ctx), 'return_cold');
  assert.equal(S.Objectives.compute(s).optional, null, 'kritik hedefte isteğe bağlı hedef gösterilmez');
  s.suit.battery = 100;
  // İçeride sızıntı
  s.suit.o2 = 100;
  s.player.inside = true;
  s.suit.leak = true;
  assert.equal(S_main(ctx), 'repair_suit');
  s.suit.leak = false;
  // Gece dışarıda
  s.forensics.opportunity.evidence = { photo: null, telemetry: null, env: null };
  s.player.inside = false;
  s.player.x = 200;
  s.minute = S.DATA.gameplay.sunsetStartMinute + 10;
  assert.equal(S_main(ctx), 'return_night');
  // Son Sol
  s.sol = s.maxSols;
  s.res.mavFuel = 80;
  assert.equal(S_main(ctx), 'mav_repair', 'D-015: hasarlı roket önce tamir edilir');
  s.rocket.damage = {};
  assert.equal(S_main(ctx), 'mav_fuel');
  s.res.mavFuel = 100;
  assert.equal(S_main(ctx), 'mav_launch');
  assert.equal(S.Objectives.compute(s).optional, null, 'kritik hedefte isteğe bağlı hedef gösterilmez');
});

test('RIT-06: sarkaç deneyi ödülü sonraki kararı değiştirir (kum tuzağında daha az yavaşlama)', () => {
  const { S, s } = landed();
  const pit = S.DATA.terrain.sandPits[0];
  s.player.x = (pit.fromM + pit.toM) / 2;
  const before = S.Surface.speedFactor(s);
  const r = S.Experiments.run(s, 'pendulum_gravity', { hypothesis: 'slower_163', env: 'habitat', control: false }, { success: true, score: 1 });
  assert.equal(r.success, true);
  const after = S.Surface.speedFactor(s);
  assert.ok(after > before, `kum tuzağı hızı ${before} → ${after}`);
});

test('Tempo: normal oyunda 12 saatlik gündüz ~6 gerçek dk sürer, jüri hızlı modu daha çabuk; dolu elbise birkaç gerçek dakika keşif verir', () => {
  const full = landed();
  const demo = landed({ demoMode: true });
  const rate = full.S.Sim.gameMinutesPerRealSecond(full.s);
  const demoRate = demo.S.Sim.gameMinutesPerRealSecond(demo.s);
  const dayRealMin = (12 * 60) / rate / 60;
  assert.ok(dayRealMin >= 5 && dayRealMin <= 7, `12 sa gündüz ${dayRealMin.toFixed(1)} gerçek dk`);
  assert.ok(demoRate > rate, 'hızlı mod daha hızlı akmalı');
  const eva = full.S.DATA.constants.eva;
  const suitRealMin = 100 / eva.suitO2PctPerMin / rate / 60;
  assert.ok(suitRealMin >= 3, `dolu elbise ${suitRealMin.toFixed(1)} gerçek dk`);
});

test('Tempo: ekranda yürüme hızı oyun saatinden türer — yürünen metre / oyun dakikası her modda eva.speedMPerMin', () => {
  for (const demoMode of [false, true]) {
    const { S, s } = landed({ demoMode });
    s.player.inside = false;
    s.player.x = 20;
    S.Surface.syncFromState(s);
    const x0 = s.player.x;
    for (let i = 0; i < 60; i++) S.Surface.update(s, 1 / 60, { dir: 1, jump: false }); // 1 gerçek saniye
    const metres = s.player.x - x0;
    const gameMin = 1 * S.Sim.gameMinutesPerRealSecond(s);
    assert.ok(Math.abs(metres / gameMin - S.DATA.constants.eva.speedMPerMin) < 0.01, `${demoMode ? 'demo' : 'normal'}: ${(metres / gameMin).toFixed(2)} m/oyun dk`);
  }
});

test('RIT-07: uyarı aleti olmasa da toz fırtınası kısa süre önceden görünür ön işaret verir', () => {
  const { S, s } = landed({ design: Object.assign({}, loadCore().State.DEFAULT_DESIGN, { instruments: ['mastcam_z', 'seis', 'moxie', 'veggie'] }) });
  const storm = S.DATA.events.schedule.full.find((e) => e.id === 'dust_storm');
  toSol(S, s, storm.sol);
  s.minute = storm.minute - 60;
  const up = S.Events.upcoming(s, S.DATA.gameplay.threatPreSignalMinutes);
  const hit = up.find((u) => u.ev.id === 'dust_storm');
  assert.ok(hit, 'fırtına yaklaşan olaylarda görünmeli');
  assert.equal(hit.def.preSignalKey, 'hud.alert_storm_soon');
  assert.equal(S.Sim.has(s, 'meda'), false);
});

test('RIT-08: habitata dönüşten sonra krizsiz pencere — kriz ertelenir ama kaybolmaz', () => {
  const { S, s } = landed();
  const ev = S.DATA.events.schedule.full.find((e) => e.sol === 2);
  toSol(S, s, 2);
  S.Sim.advance(s, ev.minute - 30 - s.minute);
  S.Surface.enterHabitat(s);
  assert.ok(S.Events.isCalm(s));
  S.Sim.advance(s, 90); // planlı kriz zamanı geçti ama pencere sürüyor
  assert.equal(s.crisis.active, null, 'krizsiz pencerede kriz başlamamalı');
  S.Sim.advance(s, S.DATA.gameplay.habitatCalmMinutes); // pencere bitti
  assert.ok(s.crisis.active, 'ertelenen kriz pencere bitince gelmeli');
  assert.equal(s.crisis.active.id, ev.id);
});

test('RIT-09: MAV kontrol listesi finalden önce tüm koşulları gösterir', () => {
  const { S, s } = landed();
  const list = S.Objectives.checklist(s);
  assert.equal(list.map((c) => c.key).join(','), 'status.reports,status.experiments,status.fuel,status.sol');
  assert.equal(list[3].done, false);
  s.sol = s.maxSols;
  s.res.mavFuel = 100;
  const done = S.Objectives.checklist(s);
  assert.equal(done[2].done, true);
  assert.equal(done[3].done, true);
});

test('RIT-10: görev kaybında son Sol sabahının güvenli kaydına (habitat içi) dönülür', () => {
  const { S, s } = landed();
  toSol(S, s, 2);
  assert.equal(S.checkpointInfo().sol, 2);
  // Ölümcül EVA: dışarıda O₂ biter
  s.player.inside = false;
  s.player.x = 900;
  s.suit.o2 = 1;
  S.Sim.advance(s, 30);
  assert.ok(s.gameOver, 'görev kaybı bekleniyordu');
  const back = S.loadCheckpoint();
  assert.equal(back.sol, 2);
  assert.equal(back.gameOver, null);
  assert.equal(back.player.inside, true);
  assert.equal(back.checkpointRetries, 1);
  assert.equal(S.getState(), back);
});
