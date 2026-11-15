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

test('Tamir: eksik alet / malzeme / enerji nedenini söyler; başarısız deneme yalnızca zaman harcatır', () => {
  const { S, s } = landed();
  const R = S.Rocket;
  s.inventory.tools.scanner = false;
  assert.equal(R.check(s, 'fuel_line').errKey, 'tool.err_need');
  s.inventory.tools.scanner = true;
  s.res.energyKwh = 0;
  assert.equal(R.check(s, 'fuel_line').errKey, 'rocket.err_energy');
  s.res.energyKwh = 30;
  const spare = s.inventory.items.spare_parts;
  const t0 = s.minute;
  assert.equal(R.repair(s, 'fuel_line', false).repaired, false);
  assert.ok(s.minute > t0, 'EVA süresi geçti');
  assert.equal(s.inventory.items.spare_parts, spare, 'malzeme duruyor');
  assert.equal(R.repair(s, 'fuel_line', true).repaired, true);
  assert.equal(s.inventory.items.spare_parts, spare - 1);
  assert.equal(R.isDamaged(s), false);
});

test('Hasarlı roket güvenli kalkamaz; her oynayışta gerekli malzeme bulunur', () => {
  const { S, s } = landed();
  s.base.mav = true;
  s.res.mavFuel = 100;
  S.Sim.launchMav(s);
  assert.equal(s.ending.fuelOk, false);
  assert.equal(s.ending.damaged, true);
  // Kaynak garantisi: yedek parçalar iki parçaya yeter; sandık sayısı istasyon kabuğu + gövde paneline yeter
  const D = S.DATA;
  const need = (item) => D.rocket.parts.reduce((a, p) => a + (p.needs[item] || 0), 0);
  assert.ok(D.workshop.startItems.spare_parts >= need('spare_parts'));
  const crates = D.station.pickups.filter((p) => p.item === 'cargo_crate').length;
  const shell = D.workshop.recipes.find((r) => r.id === 'station_shell').needs.cargo_crate;
  assert.ok(crates >= shell + need('cargo_crate'));
});
