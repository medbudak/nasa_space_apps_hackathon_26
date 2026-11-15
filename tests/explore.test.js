/**
 * D-012 + 2026-11-15 birleştirmesi — Üs merkezli iki yönlü harita: batıda buzul (soğuk, buz blokları, buzdaki araçlar,
 * kalıntılı buz kümeleri), doğuda lav ovası (izler, kazı, gizli araçlar, molozla kapalı tünel penceresi), lav tüneli
 * alt haritası (İZCİ-1 parçaları) ve açılış iniş sahnesi. Araçlar hazır görünmez; otomatik keşif yoktur.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function landed(opts = {}) {
  const S = loadCore();
  const s = S.State.reset(opts);
  S.Sim.launch(s);
  S.Sim.land(s, null);
  return { S, s };
}

test('Harita: parçalı koordinat gidiş-dönüş, sınırlarda süreklilik; batı buzul sınırı ve doğu tünel penceresi', () => {
  const { S } = landed();
  const Surf = S.Surface;
  const map = S.DATA.terrain.map;
  assert.equal(map.leftLimitM, -S.DATA.terrain.westRegion.endM, 'harita batıda buzulun sonuna kadar');
  for (const m of [-5350, -2400, -450, -300, -121, -120, -60, -1, 0, 1, 180, 360, 760, 1400]) {
    assert.ok(Math.abs(Surf.pxToM(Surf.mToPx(m)) - m) < 1e-9, 'gidiş-dönüş ' + m);
  }
  assert.ok(Math.abs(Surf.mToPx(map.baseLeftM) - map.baseLeftPx) < 1e-9);
  assert.ok(Math.abs(Surf.mToPx(map.baseLeftM - 0.001) - Surf.mToPx(map.baseLeftM)) < 0.01, '−120 m sınırında sıçrama yok');
  assert.ok(Math.abs(Surf.pxToM(Surf.worldLeftPx()) - map.leftLimitM) < 1e-9);
  assert.ok(Surf.pxToM(Surf.worldRightPx()) > map.tubeMouthM && Surf.pxToM(Surf.worldRightPx()) < map.tubeMouthM + 40);
  // Üs yapıları eski piksel konumlarında kalır (habitat kapısı −10 px)
  assert.equal(Surf.STRUCTURES.find((x) => x.id === 'habitat').interactPx, -10);
});

test('Rotalar: doğuda gömülü Opportunity + InSight ve tünel penceresi, batıda buzulda Spirit, Phoenix, Beagle 2; araçlar baştan görünmez', () => {
  const { S, s } = landed();
  const zones = Object.fromEntries(S.DATA.terrain.map.zones.map((z) => [z.id, z]));
  const inZone = (m, z) => m >= zones[z].fromM && m < zones[z].toM;
  const cases = S.Forensics.cases();
  assert.deepEqual(cases.map((c) => c.id).sort(), ['beagle2', 'insight', 'opportunity', 'phoenix', 'spirit']);
  assert.ok(inZone(S.Forensics.get('opportunity').distanceM, 'lakebed'));
  assert.ok(inZone(S.Forensics.get('insight').distanceM, 'dunes'));
  for (const id of ['spirit', 'phoenix', 'beagle2']) assert.ok(S.Forensics.get(id).distanceM < -1000, id + ' batı buzul rotasında');
  // Her araç bir kazı noktasının altında; doğunun sonunda tünel penceresi molozla kapalı
  for (const c of cases) assert.ok(S.Explore.digSites().some((st) => st.case === c.id), c.id + ' kazı noktası');
  const sky = S.Explore.site('skylight');
  assert.equal(S.Explore.siteAt(sky), S.DATA.terrain.map.tubeMouthM);
  assert.equal(S.Explore.tubeOpen(s), false);
  // İnişte hiçbir araç tanımlı değil, enkaz etkileşimi yok, tünel ağzına inilmez
  assert.ok(cases.every((c) => !S.Forensics.identified(s, c)));
  const its = S.Surface.interactables(s);
  assert.ok(!its.some((it) => it.kind === 'wreck' || it.kind === 'tube'));
  assert.ok(its.some((it) => it.kind === 'dig' && it.id === 'skylight'));
  const ice = S.Explore.clusters();
  assert.equal(ice.length, 4);
  assert.equal(ice.filter((c) => c.relic).length, 2);
  for (const c of ice) assert.ok(c.atM < -120 && c.atM >= S.DATA.terrain.map.leftLimitM, c.id + ' batı rotasında');
  // Uzaklaştıkça büyür; ilk küme kalıntısız (öğretici)
  assert.equal(ice[0].relic, null);
  assert.ok(ice[ice.length - 1].size > ice[0].size);
});

test('Buz döngüsü: incele → kır → fotoğrafla → topla; sıra dışı adım reddedilir; ödül işlevseldir', () => {
  const { S, s } = landed();
  const c = S.Explore.clusters().find((x) => x.relic === 'cable');
  s.player.x = c.atM;
  assert.equal(S.Explore.iceAction(s, c.id, 'break').ok, false, 'incelemeden kırılmaz');
  const kits = s.inventory.repairKits;
  for (const step of ['inspect', 'break', 'photo', 'collect']) {
    assert.equal(S.Explore.iceStep(s, c.id), step);
    assert.equal(S.Explore.iceAction(s, c.id, step).ok, true, step);
  }
  assert.equal(S.Explore.iceStep(s, c.id), 'done');
  assert.equal(s.inventory.repairKits, kits + 1);
  // Kalıntısız buz: örnek → su
  const plain = S.Explore.clusters().find((x) => !x.relic);
  const w = s.res.waterL;
  for (const step of ['inspect', 'break', 'sample']) S.Explore.iceAction(s, plain.id, step);
  assert.ok(s.res.waterL > w);
  // Tamamlanan küme etkileşim listesinden çıkar
  assert.ok(!S.Surface.interactables(s).some((it) => it.id === c.id));
});

test('Kalıcılık: kırılan buz kaydet/yükle sonrası kırık kalır; eski kayıt (explore alanı yok) güvenle yüklenir', () => {
  const { S, s } = landed();
  const c = S.Explore.clusters()[1];
  S.Explore.iceAction(s, c.id, 'inspect');
  S.Explore.iceAction(s, c.id, 'break');
  const copy = S.ensureExploreState(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.explore.ice[c.id].broken, true);
  const old = JSON.parse(JSON.stringify(s));
  delete old.explore;
  delete old.player.zone;
  old.player.x = 1450; // D-012 öncesi koridor
  S.ensureExploreState(old);
  assert.equal(old.player.zone, 'surface');
  assert.equal(old.explore.ice[c.id].broken, false);
  S.State.set(old);
  S.Surface.syncFromState(old);
  assert.ok(old.player.x <= S.DATA.terrain.map.tubeMouthM + 40, 'eski konum yeni sınıra kırpılır');
});

test('Kalıntı habitata girince rapor olur ve Dünya\'ya ulaşınca rapor sayılır', () => {
  const { S, s } = landed();
  const c = S.Explore.clusters().find((x) => x.relic === 'datalog');
  for (const step of ['inspect', 'break', 'photo', 'collect']) S.Explore.iceAction(s, c.id, step);
  assert.equal(S.Objectives.compute(s).main.id, 'relic_file');
  S.Surface.enterHabitat(s);
  const rep = s.explore.reports['relic_' + c.id];
  assert.equal(rep.queued, true);
  const pkt = s.downlink.queue.find((p) => p.kind === 'report' && p.refId === 'relic_' + c.id);
  assert.ok(pkt);
  const before = S.Objectives.progress(s).forensicsSent;
  S.Sim.markArrived(s, pkt);
  assert.equal(S.Objectives.progress(s).forensicsSent, before + 1);
  assert.equal(S.Score.calc(s).sentForensics, before + 1);
});

test('Lav tüneli: pencere açılmadan inilmez; mesafe = tünel ağzı + tünel içi; 3 bulgu + İZCİ-1 parçaları + 3 çalışma; rapor yalnızca röleden; duvar geçilmez', () => {
  const { S, s } = landed();
  const cc = S.DATA.explore.cave;
  s.player.x = S.DATA.terrain.map.tubeMouthM;
  assert.equal(S.Explore.descend(s).ok, false, 'pencere kazılmadan inilmez');
  s.explore.tubeOpen = true;
  S.Explore.descend(s);
  S.Surface.syncFromState(s);
  assert.equal(S.Sim.inCave(s), true);
  s.player.cx = 100;
  assert.equal(S.Sim.distanceFromHab(s), S.DATA.terrain.map.tubeMouthM + 100);
  assert.ok(S.Sim.ponr(s).requiredO2 > 0);

  // Derin sıcaklık giriş ölçümü olmadan yapılamaz
  s.player.cx = cc.studies[0].atM;
  assert.equal(S.Explore.runStudy(s, 'temp').ok, false);
  // Rapor merdiven tabanı dışında reddedilir
  assert.equal(S.Explore.relayReport(s).ok, false);

  s.player.cx = cc.relayM;
  S.Explore.readEntranceTemp(s);
  for (const f of cc.finds) assert.equal(S.Explore.recordFind(s, f.id).ok, true);
  for (const st of cc.studies) assert.equal(S.Explore.runStudy(s, st.id).ok, true, st.id);
  // Kurgusal İZCİ-1: beş parça fotoğraflanır (tekrar fotoğraf sayılmaz), son parça hikâyeyi tamamlar
  let last = null;
  for (const pt of cc.scout.parts) last = S.Explore.photoScout(s, pt.id, 0.9);
  assert.equal(last.complete, true);
  assert.equal(S.Explore.photoScout(s, cc.scout.parts[0].id, 1).ok, false);
  // Sıcaklık modeli: derin bölüm ortalamaya daha yakın (salınım ~1/3)
  const site = S.Sim.site(s);
  const mean = (site.nightMinC + site.dayMaxC) / 2;
  assert.ok(Math.abs(s.explore.cave.temp.deep - mean) <= Math.abs(s.explore.cave.temp.entrance - mean) + 0.11);
  // Titreşim sonucu "güvenli" kararı vermez: yoruma açık, daha fazla ölçüm ister
  for (const lang of ['tr', 'en']) {
    S.lang = lang;
    const vib = S.Explore.studyResult(s, 'vibration');
    assert.equal(vib.key, 'cave.res.vibration');
    const txt = S.t(vib.key, vib.vars);
    assert.match(txt, lang === 'tr' ? /daha fazla ölçüm gerekir/ : /more measurements are needed/);
    assert.doesNotMatch(txt, lang === 'tr' ? /tamamen güvenli|güvenlidir/i : /completely safe|structure is safe\./i);
  }
  S.lang = 'tr';
  const p = S.Explore.caveProgress(s);
  assert.equal(p.done, p.total);
  const r = S.Explore.relayReport(s);
  assert.equal(r.ok, true);
  assert.equal(S.Explore.relayReport(s).ok, false, 'ikinci kez raporlanmaz');
  assert.ok(s.downlink.queue.some((q) => q.kind === 'report' && q.refId === 'cave_survey'));

  // Geçilemeyen son duvar: tünel lengthM'de biter
  S.Surface.syncFromState(s);
  for (let i = 0; i < 600; i++) S.Surface.update(s, 1 / 30, { dir: 1, jump: false });
  assert.ok(s.player.cx <= cc.lengthM + 1e-9);
  S.Explore.ascend(s);
  assert.equal(s.player.zone, 'surface');
  assert.ok(Math.abs(s.player.x - S.DATA.terrain.map.tubeMouthM) < 10);
});

test('Lav tüneli yürüyüşü yüzeyle aynı: aynı ekran hızı (px/s), aynı metre/oyun dk, 0.38g zıplama, aynı pozlar', () => {
  const { S, s } = landed();
  const Surf = S.Surface;
  const dt = 1 / 60;
  // Yüzey: 1 gerçek saniye yürü
  s.player.inside = false;
  s.player.x = 20;
  Surf.syncFromState(s);
  const px0 = Surf.body.px;
  const m0 = s.player.x;
  for (let i = 0; i < 60; i++) Surf.update(s, dt, { dir: 1, jump: false });
  const surfPx = Surf.body.px - px0;
  const surfM = s.player.x - m0;
  // Tünel: aynı süre
  s.player.x = S.DATA.terrain.map.tubeMouthM;
  s.explore.tubeOpen = true;
  S.Explore.descend(s);
  s.player.cx = 100;
  Surf.syncFromState(s);
  const cpx0 = Surf.body.cpx;
  for (let i = 0; i < 60; i++) Surf.update(s, dt, { dir: 1, jump: false });
  assert.ok(Math.abs(Surf.body.cpx - cpx0 - surfPx) < 1e-6, `ekran hızı yüzey ${surfPx} px, tünel ${Surf.body.cpx - cpx0} px`);
  assert.ok(Math.abs(s.player.cx - 100 - surfM) < 1e-6, 'metre / oyun dakikası aynı');
  assert.equal(Surf.pose(s), 'walk');
  // Zıplama: tünelde de 0.38g ile havalanır ve geri iner
  Surf.update(s, dt, { dir: 0, jump: true });
  assert.equal(Surf.body.onGround, false);
  assert.equal(Surf.pose(s), 'jump');
  let peak = 0;
  for (let i = 0; i < 300 && !Surf.body.onGround; i++) {
    Surf.update(s, dt, { dir: 0, jump: false });
    peak = Math.max(peak, Surf.body.y);
  }
  assert.equal(Surf.body.onGround, true);
  const hMarsPx = S.DATA.gameplay.earthJumpHeightM * (S.DATA.constants.marsGravity.earthValue / S.DATA.constants.marsGravity.value) * S.DATA.gameplay.spritePxPerMeter;
  assert.ok(Math.abs(peak - hMarsPx) < 3, `zirve ${peak.toFixed(1)} px ≈ ${hMarsPx.toFixed(1)} px`);
  // Eklem donunca yüzeydeki gibi yavaşlar
  s.suit.frozen = true;
  const c1 = Surf.body.cpx;
  for (let i = 0; i < 60; i++) Surf.update(s, dt, { dir: 1, jump: false });
  assert.ok(Math.abs(Surf.body.cpx - c1 - surfPx * S.DATA.constants.eva.frozenSpeedFactor) < 1e-6);
});

test('Kayalık yaklaşım: yüksek kayaya yürüyerek geçilmez, 0.38g zıplamasıyla aşılır', () => {
  const { S, s } = landed();
  const b = S.DATA.terrain.boulders[1];
  const Surf = S.Surface;
  s.player.inside = false;
  // Kayanın sol kenarının biraz solundan başla (kaya genişliği px cinsinden veride)
  s.player.x = Surf.pxToM(Surf.mToPx(b.atM) - b.widthPx / 2 - 4);
  Surf.syncFromState(s);
  assert.equal(Surf.body.y, 0, 'başlangıçta yerde');
  for (let i = 0; i < 240; i++) Surf.update(s, 1 / 60, { dir: 1, jump: false });
  assert.ok(s.player.x < b.atM, 'kayaya takılmalı');
  let jumped = false;
  for (let i = 0; i < 400 && s.player.x < b.atM + 20; i++) {
    Surf.update(s, 1 / 60, { dir: 1, jump: !jumped });
    jumped = true;
    if (Surf.body.onGround) jumped = false;
  }
  assert.ok(s.player.x > b.atM, 'zıplayarak geçmeli');
});

test('Hedef: bulunmamış aracın yeri söylenmez (keşif hedefi); kazılınca araca; doğu bitince tünel penceresi; mağarada sıradaki iş', () => {
  const { S, s } = landed();
  assert.equal(s.player.x, S.DATA.terrain.map.landingPadM + S.DATA.terrain.map.landingExitM);
  const g = S.Objectives.compute(s).main;
  assert.equal(g.id, 'explore_east');
  assert.equal(g.target.m, S.DATA.terrain.map.tubeMouthM, 'hedef rotanın sonu, aracın yeri değil');
  assert.ok(S.Forensics.cases().every((c) => g.target.m !== c.distanceM));
  // Kazılıp ortaya çıkan araç hedef olur
  s.player.x = S.Forensics.get('opportunity').distanceM;
  while (!S.Forensics.identified(s, S.Forensics.get('opportunity'))) S.Explore.dig(s, 'opportunity');
  const g2 = S.Objectives.compute(s).main;
  assert.equal(g2.id, 'wreck_go');
  assert.equal(g2.target.m, S.Forensics.get('opportunity').distanceM);
  // Doğudaki araçlar raporlanınca sıra molozla kapalı tünel penceresinde
  for (const id of ['opportunity', 'insight']) {
    s.forensics[id].discovered = true;
    s.forensics[id].queued = true;
    s.explore.dig[id] = S.Explore.site(id).hits;
  }
  s.player.x = 900;
  assert.equal(S.Objectives.compute(s).main.id, 'tube_dig');
  // Batıya dönünce buzul keşfi
  s.player.x = -100;
  assert.equal(S.Objectives.compute(s).main.id, 'explore_west');
  s.explore.tubeOpen = true;
  s.player.x = S.DATA.terrain.map.tubeMouthM;
  assert.equal(S.Objectives.compute(s).main.id, 'cave_go');
  S.Explore.descend(s);
  const cg = S.Objectives.compute(s).main;
  assert.equal(cg.id, 'cave_entrance');
  assert.ok(cg.target.cx !== undefined);
});

test('İniş sahnesi: fazlar sırayla, temas sarsıntısı, atlanınca son kare; Sim.land astronotu iniş alanına koyar', () => {
  const { S, s } = landed();
  assert.equal(s.lander.landed, true);
  const L = S.Lander;
  L.start();
  const phases = [];
  let guard = 0;
  while (L.active && guard++ < 1000) {
    const p = L.phase();
    if (phases[phases.length - 1] !== p) phases.push(p);
    L.update(1 / 60);
  }
  assert.deepEqual(phases, ['descent', 'touchdown', 'shutdown', 'disembark']);
  assert.equal(L.done(), true);
  assert.equal(L.altitude(L.T.end), 0);
  assert.equal(L.legDeploy(0) < 1 && L.legDeploy(L.T.touch) === 1, true, 'ayaklar inmeden açılır');
  assert.equal(L.thrust(L.T.shutdown + 0.1), 0, 'motor kapanır');
  const end = L.astronaut(L.T.end);
  assert.ok(Math.abs(end.px - L.exitPx()) < 1e-6 && end.y === 0);
  // Atla
  L.start();
  L.update(0.5);
  L.skip();
  assert.equal(L.active, false);
  assert.equal(L.hatchOpen(), 1);
});

test('Açılış: kalkış → yolculuk → varış sırası; meteor yolculukta; iniş açılışta oynamaz', () => {
  const { S } = landed();
  const O = S.Opening;
  const phases = [];
  for (let t = 0; t <= O.T.end + 0.05; t += 0.05) {
    const p = O.phase(t);
    if (phases[phases.length - 1] !== p) phases.push(p);
  }
  assert.deepEqual(phases, ['liftoff', 'cruise', 'arrive', 'done']);
  assert.equal(O.phase(O.T.meteor), 'cruise');
  assert.equal(O.travel(0), 0);
  assert.equal(O.travel(O.T.arrive), 1);
  assert.equal(O.rise(O.T.rise - 0.01), 0, 'ateşlemede roket rampada');
  assert.ok(O.rise(O.T.cruise) > 360, 'kalkış bitmeden roket ekrandan çıkar');
  assert.ok(!('altitude' in O) && !('touch' in O.T), 'açılışta ikinci bir iniş yok');
});

test('İniş → oyun devri: son kare ile kalıcı dekor ve oyuncu konumu aynı (görsel sıçrama yok)', () => {
  const { S, s } = landed();
  const L = S.Lander;
  // Mekik: sahnenin son karesi (aktifken t = T.end) ile sahne sonrası çizim (FINAL_T) aynı parametreler
  assert.deepEqual(L.drawParams(L.T.end), L.drawParams(L.FINAL_T));
  // Atlanınca da aynı son kare
  L.start();
  L.update(1.0);
  L.skip();
  assert.deepEqual(L.drawParams(L.t), L.drawParams(L.FINAL_T));
  // Astronot: sahnenin son karesindeki konum = oyunun başladığı oyuncu konumu, yerde, yürümüyor
  const end = L.astronaut(L.T.end);
  assert.equal(end.y, 0);
  assert.equal(end.walking, false);
  assert.ok(Math.abs(end.px - S.Surface.mToPx(s.player.x)) < 1e-6);
  // Son aktif kare (bir kare önce) de aynı: astronot durmuş, çıkış noktasında
  assert.deepEqual(L.astronaut(L.T.end - 1 / 60), end);
  // Merdivenden inişin sonu ile yürüyüşün başı arasında da sıçrama yok
  const a = L.astronaut(L.T.climbEnd - 1e-6);
  const b = L.astronaut(L.T.climbEnd);
  assert.ok(Math.abs(a.px - b.px) <= 1 && a.y === 0 && b.y === 0);
  // Toz, kapak açılmadan yatışır: temas anındaki en uzun ömürlü toz parçacığı kapaktan önce söner
  L.start();
  while (L.t < L.T.touch + 0.01) L.update(1 / 60);
  const dustEnd = Math.max(...L.particles.filter((p) => p.kind === 'dust').map((p) => L.t + p.life));
  assert.ok(dustEnd <= L.T.hatch + 0.05, 'toz ' + dustEnd.toFixed(2) + ' sn, kapak ' + L.T.hatch);
  // Sahne bittiğinde ekranda parçacık kalmaz (sahne sonrası parçacıklar çizilmez: bir anda kaybolurlardı)
  let lastLive = 0;
  while (L.active) {
    L.update(1 / 60);
    if (L.active) for (const p of L.particles) lastLive = Math.max(lastLive, L.t + p.life);
  }
  assert.ok(lastLive <= L.T.end + 1 / 60, 'son parçacık ' + lastLive.toFixed(2) + ' sn, sahne sonu ' + L.T.end);
});

test('Kazı: yürürken otomatik keşif yok; sahte tümsek boş çıkar; tarayıcı yalnızca gerçeğin yanında öter; her vuruş oyun dakikası harcar', () => {
  const { S, s } = landed();
  const Surf = S.Surface;
  const opp = S.Forensics.get('opportunity');
  // Doğuya gerçekten yürü (Surface.update): aracın yanından geçmek onu ortaya çıkarmaz
  s.player.inside = false;
  s.player.x = 120;
  Surf.syncFromState(s);
  for (let i = 0; i < 400 && s.player.x < opp.distanceM + 60; i++) Surf.update(s, 1 / 30, { dir: 1, jump: false });
  assert.ok(s.player.x > opp.distanceM);
  assert.equal(S.Forensics.identified(s, opp), false, 'yaklaşınca kendiliğinden tanınmaz');
  // Sahte tümsek: tarayıcı sessiz, kazınca boş
  const fake = S.Explore.site('mound_e1');
  s.player.x = fake.atM;
  assert.equal(S.Explore.scannerPing(s), null);
  let r;
  do r = S.Explore.dig(s, 'mound_e1');
  while (!r.done);
  assert.equal(r.empty, true);
  // Gerçek tümsek: tarayıcı öter, astronot diz çöker; her vuruş dakika harcar, son vuruşta araç çıkar
  s.player.x = opp.distanceM - 5;
  Surf.syncFromState(s);
  Surf.update(s, 1 / 30, { dir: 0, jump: false }); // dur
  const ping = S.Explore.scannerPing(s);
  assert.ok(ping && ping.close && ping.site.case === 'opportunity');
  assert.equal(Surf.pose(s), 'action');
  const events = [];
  S.bus.on('forensics:discovered', (p) => events.push(p.id));
  const st = S.Explore.site('opportunity');
  const t0 = s.totalMinutes;
  for (let i = 0; i < st.hits; i++) r = S.Explore.dig(s, 'opportunity');
  assert.ok(Math.abs(s.totalMinutes - t0 - st.hits * st.minutesPerHit) < 1e-6);
  assert.equal(r.caseId, 'opportunity');
  assert.deepEqual(events, ['opportunity']);
  assert.ok(Surf.interactables(s).some((it) => it.kind === 'wreck' && it.id === 'opportunity'));
  assert.equal(S.Explore.dig(s, 'opportunity').ok, false, 'kazılmış nokta tekrar kazılmaz');
  // RIMFAX (yer radarı) gerçek noktayı uzaktan sezer; tarayıcı tek başına sezmez
  const insight = S.Explore.site('insight');
  s.player.x = S.Explore.siteAt(insight) - 100;
  assert.equal(S.Explore.scannerPing(s), null);
  s.design.instruments = s.design.instruments.concat('rimfax');
  const far = S.Explore.scannerPing(s);
  assert.ok(far && !far.close && far.site.id === 'insight');
});

test('Tünel penceresi: moloz kazılınca açılır, merdiven etkileşimi o zaman görünür', () => {
  const { S, s } = landed();
  const sky = S.Explore.site('skylight');
  s.player.inside = false;
  s.player.x = S.Explore.siteAt(sky);
  const opened = [];
  S.bus.on('explore:tube_open', () => opened.push(1));
  for (let i = 0; i < sky.hits; i++) S.Explore.dig(s, 'skylight');
  assert.equal(S.Explore.tubeOpen(s), true);
  assert.equal(opened.length, 1);
  const its = S.Surface.interactables(s);
  assert.ok(its.some((it) => it.kind === 'tube'));
  assert.ok(!its.some((it) => it.kind === 'dig' && it.id === 'skylight'));
  assert.equal(S.Explore.descend(s).ok, true);
  // Kayıt/yükleme sonrası açık kalır; kazı öncesi kayıtta tünele inilmişse açık sayılır
  const copy = S.ensureExploreState(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.explore.tubeOpen, true);
  const old = JSON.parse(JSON.stringify(s));
  delete old.explore.tubeOpen;
  delete old.explore.dig;
  S.ensureExploreState(old);
  assert.equal(old.explore.tubeOpen, true);
  assert.equal(old.explore.dig.skylight, 0);
});

test('Batı buzulu: buz bloğu yolu keser ve kazılınca açılır; soğuk ısıtıcıyı zorlar; kargo aracı parçaları E ile alınır ve raporlanır', () => {
  const { S, s } = landed();
  const Surf = S.Surface;
  const w = S.DATA.terrain.westRegion;
  s.player.inside = false;
  // Buz bloğunun doğusundan batıya yürü: bloğun yüzünde durur
  const b0 = w.iceBarriers[0];
  s.player.x = -b0.atM + 60;
  Surf.syncFromState(s);
  for (let i = 0; i < 200; i++) Surf.update(s, 1 / 30, { dir: -1, jump: false });
  assert.ok(s.player.x > -b0.atM, 'kazılmamış buz bloğu geçilmez');
  for (let i = 0; i < b0.hits; i++) Surf.digBarrier(s, 0);
  for (let i = 0; i < 200; i++) Surf.update(s, 1 / 30, { dir: -1, jump: false });
  assert.ok(s.player.x < -b0.atM, 'açılan bloktan geçilir');
  // Derin soğuk: ek soğuk ve ısı kaybı (kurgusal oyun değerleri, veride etiketli)
  s.player.x = -w.cold.deepColdFromM - 200;
  const wc = S.Sim.westCold(s);
  assert.ok(wc.extraC < 0 && wc.bleedCPerMin > 0);
  // Parçalar yürürken kendiliğinden toplanmaz
  const sv = Surf.salvage(s);
  for (const part of w.parts) {
    s.player.x = -part.atM;
    Surf.updateWest(s, 1);
  }
  assert.equal(sv.found.filter((id) => w.parts.some((pt) => pt.id === id)).length, 0);
  sv.iceBroken = true; // buz mağarası kırıldı
  for (const part of w.parts) assert.equal(Surf.pickPart(s, part.id).ok, true);
  Surf.enterHabitat(s);
  assert.equal(s.explore.reports.west_lander.queued, true);
  assert.ok(s.downlink.queue.some((q) => q.refId === 'west_lander'));
});

test('Metinler: yeni rota, kazı, İZCİ-1, FIELD CAM, teşhis hikâyesi ve Mars bilgi kartı anahtarları TR + EN', () => {
  const { S } = landed();
  const keys = ['toast.uncovered', 'dig.progress', 'dig.tube_open', 'prompt.dig_more', 'prompt.dig_rubble', 'prompt.scout', 'prompt.scout_done', 'prompt.pick_part',
    'scout.found', 'scout.story_title', 'scout.story_body', 'scout.story_lesson', 'scout.story_fiction', 'wreckstory.title', 'wreckstory.ask', 'wreckstory.locked',
    'fact.head', 'fact.head_arrive', 'fact.src', 'jump.fact', 'salvage.parts', 'relic.west_lander', 'relic.west_probe', 'packet.west_lander', 'packet.west_probe',
    'cam.help', 'cam.close', 'cam.album', 'cam.album_empty', 'cam.btn_focusing', 'cam.btn_shoot', 'cam.btn_saved', 'cam.focusing', 'cam.sharp', 'cam.saved', 'cam.blurry'];
  for (const k of ['explore_east', 'explore_west', 'tube_dig']) keys.push('goal.' + k, 'goal.short.' + k, 'goal.hint.' + k);
  for (const c of S.Forensics.cases()) keys.push('wreckstory.' + c.id);
  for (const cat of S.DATA.forensics.categories) keys.push('catd.' + cat);
  for (const pt of S.DATA.explore.cave.scout.parts) keys.push('scout.' + pt.id + '.name', 'scout.' + pt.id + '.caption');
  for (const st of S.Explore.digSites()) {
    if (st.kind !== 'rubble') keys.push('prompt.dig.' + st.kind);
    if (!S.Explore.siteReal(st)) keys.push('dig.empty.' + st.kind);
  }
  for (const z of S.DATA.terrain.map.zones) keys.push('zone.' + z.id);
  for (const part of S.DATA.terrain.westRegion.parts) keys.push('salvage.part.' + part.id, 'salvage.found.' + part.id);
  for (const f of S.Cutscenes ? [] : ['rad', 'sun', 'air', 'temp', 'sol', 'sound', 'gravity']) keys.push('fact.' + f);
  for (const lang of ['tr', 'en']) for (const k of keys) assert.ok(S.STORY[lang][k], lang + ' ' + k);
  // Fotoğraf kanıtı FIELD CAM ile çekilir
  assert.equal(S.DATA.forensics.evidenceTypes.find((e) => e.id === 'photo').minigame, 'fieldcam');
});
