/**
 * D-015 (önerildi) — Kişi 4: aletler ve MAV tamiri. Hasar inişte (yakıt hattı) ve göktaşında (gövde) gelir;
 * tamir malzeme + alet + enerji + EVA süresi ister; başarısız mini oyun yalnızca zaman harcatır; hasarlı roket
 * güvenli kalkamaz; her oynayışta tamir mümkündür.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function landed() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s);
  S.ensureExploreState(s);
  return { S, s };
}

test('İnişte yakıt hattı, göktaşında gövde paneli hasar alır', () => {
  const { S, s } = landed();
  assert.equal(S.Rocket.damaged(s).join(), 'fuel_line');
  s.sol = S.DATA.station.impactSol;
  S.Station.checkImpact(s);
  assert.equal(S.Rocket.damaged(s).join(), 'fuel_line,hull');
});

test('Aletler: başlangıçta kazma ve tarayıcı var, matkap atölyede kurulur; kazma yoksa kazı iki kat sürer', () => {
  const { S, s } = landed();
  const W = S.Workshop;
  assert.equal(W.hasTool(s, 'pickaxe'), true);
  assert.equal(W.hasTool(s, 'drill'), false);
  s.player.inside = true;
  assert.equal(W.build(s, 'tool_drill').ok, true);
  assert.equal(W.hasTool(s, 'drill'), true);
  assert.equal(W.status(s, 'tool_drill').state, 'built');
  assert.ok(W.inventoryList(s).some((it) => it.kind === 'tool' && it.id === 'drill'));
  const site = S.Explore.site('mound_e1');
  let t0 = s.minute;
  S.Explore.dig(s, 'mound_e1');
  const withPick = s.minute - t0;
  s.inventory.tools.pickaxe = false;
  t0 = s.minute;
  S.Explore.dig(s, 'mound_e1');
  assert.equal(s.minute - t0, withPick * S.DATA.tools.noPickaxeDigFactor);
  assert.equal(withPick, site.minutesPerHit);
});

test('Tamir: eksik alet / malzeme / enerji / eldeki alet nedenini söyler; başarısız deneme yalnızca zaman harcatır', () => {
  const { S, s } = landed();
  const R = S.Rocket;
  const W = S.Workshop;
  s.inventory.tools.scanner = false;
  assert.equal(R.check(s, 'fuel_line').errKey, 'tool.err_need');
  s.inventory.tools.scanner = true;
  // Tamir parçası atölyede üretilir: yedek parça + göktaşı (demir-nikel)
  assert.equal(R.check(s, 'fuel_line').errKey, 'ws.err_missing');
  s.player.inside = true;
  assert.equal(W.status(s, 'rk_fitting').state, 'locked', 'göktaşı yokken');
  s.inventory.minerals = { meteorite: 1 };
  const spare = W.count(s, 'spare_parts');
  assert.equal(W.build(s, 'rk_fitting').ok, true);
  assert.equal(W.count(s, 'fuel_fitting'), 1);
  assert.equal(W.count(s, 'spare_parts'), spare - 1);
  assert.equal(W.mineralCount(s, 'meteorite'), 0);
  s.res.energyKwh = 0;
  assert.equal(R.check(s, 'fuel_line').errKey, 'rocket.err_energy');
  s.res.energyKwh = 30;
  // MAV'da doğru alet elde olmalı (hotbar); elde bir şey verilmezse (bot) var sayılır
  assert.equal(R.check(s, 'fuel_line', 'drill').errKey, 'rocket.err_hold');
  assert.equal(R.check(s, 'fuel_line', 'scanner').ok, true);
  const t0 = s.minute;
  assert.equal(R.repair(s, 'fuel_line', false).repaired, false);
  assert.ok(s.minute > t0, 'EVA süresi geçti');
  assert.equal(W.count(s, 'fuel_fitting'), 1, 'parça duruyor');
  assert.equal(R.repair(s, 'fuel_line', true).repaired, true);
  assert.equal(W.count(s, 'fuel_fitting'), 0);
  assert.equal(R.isDamaged(s), false);
});

test('Yükseltmeler MAV tamirine ayrılan minerali harcayamaz; tamir parçası üretilince serbest kalır', () => {
  const { S, s } = landed();
  const W = S.Workshop;
  s.base.mav = true;
  s.player.inside = true;
  s.res.energyKwh = 30;
  s.inventory.items.cable_spool = 5;
  s.inventory.minerals = { meteorite: 1, hematite: 1 };
  // Yakıt hattı hasarlı (rakor = göktaşı), göktaşı darbesi gelecek (yama = hematit): ikisi de ayrılmış
  assert.deepEqual(Object.assign({}, W.repairReserve(s)), { meteorite: 1, hematite: 1 });
  const st = W.status(s, 'rocket_l2');
  assert.equal(st.state, 'locked');
  assert.equal(st.reasonKey, 'ws.err_reserved');
  assert.notEqual(S.t('ws.err_reserved'), 'ws.err_reserved');
  // Rakoru üret → göktaşı ayrılmaktan çıkar; ikinci göktaşı yükseltmeye gidebilir
  assert.equal(W.build(s, 'rk_fitting').ok, true);
  assert.equal(W.repairReserve(s).meteorite, undefined);
  s.inventory.minerals.meteorite = 1;
  assert.equal(W.status(s, 'rocket_l2').state, 'ready');
});

test('Hasarlı roket güvenli kalkamaz; her oynayışta gerekli malzeme bulunur', () => {
  const { S, s } = landed();
  s.base.mav = true;
  s.res.mavFuel = 100;
  S.Sim.launchMav(s);
  assert.equal(s.ending.fuelOk, false);
  assert.equal(s.ending.damaged, true);
  // Kaynak garantisi: her parçanın tamir parçasını üreten tarifin kiti, sandığı ve minerali haritada/kargoda var
  const D = S.DATA;
  const makers = D.rocket.parts.map((p) => Object.keys(p.needs).map((item) => D.workshop.recipes.find((r) => r.makes === item))).flat();
  assert.ok(makers.every(Boolean), 'her tamir parçasının atölye tarifi var');
  const need = (field, item) => makers.reduce((a, r) => a + ((r[field] || {})[item] || 0), 0);
  assert.ok(D.workshop.startItems.spare_parts >= need('needs', 'spare_parts'));
  const crates = D.station.pickups.filter((p) => p.item === 'cargo_crate').length;
  const shell = D.workshop.recipes.find((r) => r.id === 'station_shell').needs.cargo_crate;
  assert.ok(crates >= shell + need('needs', 'cargo_crate'));
  const found = {};
  for (const site of D.explore.minerals.sites) if (site.zone === 'surface') found[site.mineral] = (found[site.mineral] || 0) + site.amount;
  for (const r of makers) for (const m of Object.keys(r.minerals || {})) assert.ok((found[m] || 0) >= need('minerals', m), m + ' yüzeyde yeterli');
});
