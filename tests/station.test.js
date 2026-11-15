/**
 * D-014 (önerildi) — İstasyon hikâyesi: Sol 2'de göktaşı kargoyu saçar (MAV sağlam), parçalar toplanır,
 * tümseklerden kit çıkar, regolit kazılır, beş modül atölyede kurulur ve sonu istasyonun hâli belirler.
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

function impacted() {
  const { S, s } = landed();
  s.sol = S.DATA.station.impactSol;
  assert.equal(S.Station.checkImpact(s), true);
  return { S, s };
}

test('Göktaşı çarpma Sol\'ünde bir kez düşer; öncesinde istasyon tarifleri görünmez', () => {
  const { S, s } = landed();
  assert.equal(S.Station.checkImpact(s), false, 'Sol 1: henüz yok');
  assert.equal(S.Workshop.status(s, 'station_shell').state, 'hidden');
  const events = [];
  S.bus.on('station:impact', (p) => events.push(p));
  s.sol = S.DATA.station.impactSol;
  assert.equal(S.Station.checkImpact(s), true);
  assert.equal(S.Station.checkImpact(s), false, 'ikinci kez düşmez');
  assert.equal(events.length, 1);
  assert.equal(s.station.impactSol, S.DATA.station.impactSol);
  assert.equal(s.base.mav, false, 'MAV\'a dokunulmaz: hâlâ atölyede kurulmayı bekliyor');
});

test('Saçılan parça yerdeyse yürüyerek, kayanın üstündeyse yalnızca zıplayınca alınır', () => {
  const { S, s } = impacted();
  const ground = S.DATA.station.pickups.find((p) => p.place === 'ground');
  const top = S.DATA.station.pickups.find((p) => p.place === 'boulder');
  s.player.x = ground.m;
  assert.equal(S.Station.collect(s, 0).id, ground.id);
  assert.equal(S.Station.collect(s, 0), null, 'aynı parça iki kez alınmaz');
  s.player.x = top.m;
  assert.equal(S.Station.collect(s, 0), null, 'yerden kayanın üstüne uzanılmaz');
  assert.equal(S.Station.collect(s, S.Station.liftPx(top)).id, top.id);
  assert.equal(s.inventory.items[ground.item] >= 1, true);
});

test('Sahte tümsek çarpmadan önce boş, sonra gömülü kit verir (önceden kazılmışsa yeniden kazılır)', () => {
  const { S, s } = landed();
  const [moundId, item] = Object.entries(S.DATA.station.moundItems)[0];
  const st = S.Explore.site(moundId);
  let r;
  for (let i = 0; i < st.hits; i++) r = S.Explore.dig(s, moundId);
  assert.equal(r.empty, true);
  s.sol = S.DATA.station.impactSol;
  S.Station.checkImpact(s);
  assert.equal(S.Explore.siteDone(s, st), false, 'gömülü kit varken tümsek yeniden kazılabilir');
  for (let i = 0; i < st.hits; i++) r = S.Explore.dig(s, moundId);
  assert.equal(r.item, item);
  assert.equal(s.inventory.items[item], 1);
  assert.equal(S.Explore.siteDone(s, st), true);
});

test('Regolit torbası açık zeminde kazılır; mekiğin yanında kazılmaz ve oyun dakikası harcar', () => {
  const { S, s } = impacted();
  s.player.x = S.DATA.terrain.map.landingPadM;
  assert.equal(S.Station.digRegolith(s).ok, false);
  s.player.x = -250;
  const before = s.minute;
  const r = S.Station.digRegolith(s);
  assert.equal(r.ok, true);
  assert.equal(r.bags, 1);
  assert.ok(s.minute > before, 'kazı zaman alır');
});

test('Modüller atölyede kurulur: kabuk önce, alternatif kaynaklardan biri seçilince diğeri gizlenir; son buna göre', () => {
  const { S, s } = impacted();
  const W = S.Workshop;
  const items = s.inventory.items;
  s.player.inside = true;
  assert.equal(S.Station.endingId(s), 'lost');
  Object.assign(items, { cargo_crate: 3, cable_spool: 4, regolith_bag: 4, rhu_pack: 1, heater_kit: 1, insight_panel: 1, relay_kit: 1 });
  assert.equal(W.status(s, 'station_shield').state, 'locked', 'kabuk olmadan kalkan yok');
  assert.equal(JSON.stringify(W.effects(s, 'station_shell').map((r) => [r.before, r.after])), '[[0,1]]');
  assert.equal(W.build(s, 'station_shell').ok, true);
  assert.equal(W.build(s, 'station_heat_rhu').ok, true);
  assert.equal(W.status(s, 'station_heat_rhu').state, 'built');
  assert.equal(W.status(s, 'station_heat_heater').state, 'hidden', 'aynı modülün diğer kaynağı gizlenir');
  assert.equal(items.heater_kit, 1, 'seçilmeyen kit envanterde kalır');
  assert.equal(S.Station.endingId(s), 'dark');
  W.build(s, 'station_power_panel');
  assert.equal(S.Station.endingId(s), 'rad');
  W.build(s, 'station_shield');
  assert.equal(S.Station.endingId(s), 'silent');
  W.build(s, 'station_comms_relay');
  assert.equal(S.Station.endingId(s), 'pioneer');
  assert.equal(S.Station.builtCount(s), 5);
});

test('Enkazdan sökülen parçalar istasyon malzemesi olur (Opportunity RHU, InSight paneli)', () => {
  const { S, s } = landed();
  for (const id of ['opportunity', 'insight']) {
    s.forensics[id].diagnosis = 'x';
    const c = S.Forensics.get(id);
    const part = c.salvageChoice ? c.salvageChoice.options.find((o) => o.reusable).id : undefined;
    assert.equal(S.Forensics.salvage(s, id, part).ok, true);
  }
  assert.equal(s.inventory.items.rhu_pack, 1);
  assert.equal(s.inventory.items.insight_panel, 1);
});
