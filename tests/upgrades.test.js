/**
 * Kişi 6 — Seviye 1-2-3: sera, istasyon, roket. Her seviye bir takas: kazanç + bedel aynı anda.
 * Sera: verim ↑, güç yükü ↑ · İstasyon: ısı kaybı ↓, mineral + dış çalışma (elbise O₂) · Roket: parti yakıtı ↑, mineral + enerji.
 * Seviye sırayla açılır (3 için önce 2). Mineral maliyetleri Kişi 5'in adları gelene kadar yer tutucu (regolit torbası).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function ready() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  for (const id of Object.keys(s.base)) s.base[id] = true;
  s.greenhouse.installed = true;
  s.player.inside = true;
  s.inventory.items = { regolith_bag: 30, cable_spool: 10 };
  s.res.energyKwh = 30;
  s.suit.o2 = 100;
  s.suit.battery = 100;
  return { S, s };
}

test('Seviyeler sırayla açılır; hepsi Seviye 1 başlar', () => {
  const { S, s } = ready();
  for (const t of ['greenhouse', 'station', 'rocket']) assert.equal(S.Sim.upgradeLevel(s, t), 1);
  assert.equal(S.Workshop.status(s, 'greenhouse_l3').state, 'locked');
  assert.equal(S.Workshop.status(s, 'greenhouse_l3').reasonKey, 'ws.err_needs_level');
  assert.equal(S.Workshop.status(s, 'greenhouse_l2').state, 'ready');
  assert.equal(S.Workshop.build(s, 'greenhouse_l2').ok, true);
  assert.equal(S.Sim.upgradeLevel(s, 'greenhouse'), 2);
  assert.equal(S.Workshop.status(s, 'greenhouse_l2').state, 'built');
  assert.equal(S.Workshop.status(s, 'greenhouse_l3').state, 'ready');
});

test('Sera 2: daha çok verim ama daha çok güç (gece de)', () => {
  const { S, s } = ready();
  const y0 = S.Sim.ghYieldPct(s);
  const w0 = S.Sim.loadDemandW(s, 'greenhouse', -80);
  const bags = s.inventory.items.regolith_bag;
  S.Workshop.build(s, 'greenhouse_l2');
  assert.ok(S.Sim.ghYieldPct(s) > y0, 'verim arttı');
  assert.ok(S.Sim.loadDemandW(s, 'greenhouse', -80) > w0, 'güç yükü arttı');
  assert.ok(s.inventory.items.regolith_bag < bags, 'mineral harcandı');
  // tohum deneyi ödülü seviye bonusunu silmez
  s.greenhouse.yieldPct = 130;
  assert.equal(S.Sim.ghYieldPct(s), 130 + S.DATA.workshop.upgrades.greenhouse.yieldBonusPct[1]);
});

test('İstasyon 2: gece ısıtma ihtiyacı düşer; bedeli mineral + dış çalışma (elbise O₂ ve bataryası)', () => {
  const { S, s } = ready();
  const ua0 = S.Sim.habitatUA(s);
  const heat0 = S.Sim.loadDemandW(s, 'heating', -120);
  const o2 = s.suit.o2;
  const res = S.Workshop.build(s, 'station_l2');
  assert.equal(res.ok, true);
  assert.ok(S.Sim.habitatUA(s) < ua0, 'ısı kaybı katsayısı düştü');
  // RTG atık ısısı ısıtmayı sıfırlayabilir; yük asla artmaz, ihtiyaç varsa azalır
  assert.ok(S.Sim.loadDemandW(s, 'heating', -120) <= heat0, 'ısıtma yükü azaldı');
  assert.ok(s.suit.o2 < o2, 'dış çalışma elbise O₂ harcadı');
  // O₂ yetmezse kurulamaz
  s.suit.o2 = 5;
  assert.equal(S.Workshop.status(s, 'station_l3').reasonKey, 'ws.err_suit_o2');
});

test('Roket 2: Sabatier partisi başına daha çok MAV yakıtı; bedeli mineral + habitat enerjisi', () => {
  const { S, s } = ready();
  const f0 = S.Sim.sabatierFuelPct(s);
  const e0 = s.res.energyKwh;
  assert.equal(S.Workshop.build(s, 'rocket_l2').ok, true);
  assert.ok(S.Sim.sabatierFuelPct(s) > f0);
  assert.ok(s.res.energyKwh < e0, 'enerji harcandı');
  s.res.energyKwh = 1;
  assert.equal(S.Workshop.status(s, 'rocket_l3').reasonKey, 'ws.err_energy');
});

test('Her yükseltmenin önizlemesi kazancı ve bedeli birlikte gösterir; metinler TR/EN tanımlı', () => {
  const { S, s } = ready();
  for (const r of S.Workshop.recipes().filter((x) => x.upgrade)) {
    const rows = S.Workshop.effects(s, r.id);
    assert.ok(rows.length >= 3, r.id + ': seviye + kazanç + bedel');
    for (const k of ['name', 'what', 'why', 'result']) {
      assert.notEqual(S.t('ws.' + r.id + '.' + k), 'ws.' + r.id + '.' + k, r.id + '.' + k);
    }
    for (const row of rows) assert.notEqual(S.t('ws.fx.' + row.key), 'ws.fx.' + row.key);
  }
});
