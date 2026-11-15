/**
 * Kişi 5 — Keşif ve mineraller: tarayıcı sinyali -> kazı -> envanter (inventory.minerals{ad: adet}).
 * Yüzeyde 3-4, lav tünelinde 2-3 maden noktası; tüneldekiler matkap ister. Aynı yerden iki kez alınmaz,
 * sahte tümsekler boş kalır, bulunan mineral kayıtta (JSON gidiş-dönüş) korunur.
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
  return { S, s };
}

/** Bir noktayı bitene kadar kaz; son sonucu döndür */
function digOut(S, s, id) {
  let r;
  for (let i = 0; i < 20; i++) {
    r = S.Explore.digMineral(s, id);
    if (!r.ok || r.done) break;
  }
  return r;
}

test('Mineral verisi: 4-5 tür, her türün gerçek kaynağı var; yüzeyde 3-4, tünelde 2-3 nokta; tüneldekiler matkap ister', () => {
  const { S } = landed();
  const X = S.Explore;
  const types = X.mineralTypes();
  assert.ok(types.length >= 4 && types.length <= 5);
  for (const m of types) {
    assert.match(m.id, /^[a-z]+$/, 'ad İngilizce, küçük harf, tek kelime');
    assert.match(m.src, /^https:\/\/(www\.)?(jpl\.nasa\.gov|ntrs\.nasa\.gov|science\.nasa\.gov)\//, m.id + ' kaynağı NASA');
    for (const k of ['name', 'fact', 'from']) assert.notEqual(S.t('mineral.' + m.id + '.' + k), 'mineral.' + m.id + '.' + k);
    assert.notEqual(S.t('mineral.use.' + m.use), 'mineral.use.' + m.use);
  }
  const surf = X.mineralSites('surface');
  const cave = X.mineralSites('cave');
  assert.ok(surf.length >= 3 && surf.length <= 4);
  assert.ok(cave.length >= 2 && cave.length <= 3);
  for (const st of cave) assert.equal(st.tool, 'drill');
  for (const st of X.mineralSites()) assert.ok(X.mineralType(st.mineral), st.id + ' bilinen bir mineral');
  assert.ok(cave.every((st) => st.atM > 0 && st.atM < S.DATA.explore.cave.lengthM));
});

test('Yüzey: tarayıcı maden noktasının yanında öter, E ile kazılır, her vuruş oyun dakikası harcar, mineral envantere girer', () => {
  const { S, s } = landed();
  const X = S.Explore;
  const st = X.mineralSites('surface')[0];
  s.player.x = st.atM - 40;
  assert.ok(!(X.scannerPing(s) && X.scannerPing(s).mineral === st.mineral && X.scannerPing(s).close), 'uzakta sinyal yok');
  s.player.x = st.atM - 3;
  const ping = X.scannerPing(s);
  assert.ok(ping && ping.close && ping.site.id === st.id, 'yanında tarayıcı öter');
  S.Surface.syncFromState(s);
  assert.ok(S.Surface.interactables(s).some((it) => it.kind === 'mineral' && it.id === st.id), 'E ile etkileşim');
  const m0 = S.Sim.clockMinute(s) + s.sol * 24 * 60;
  const r1 = X.digMineral(s, st.id);
  assert.ok(r1.ok && !r1.done);
  assert.ok(S.Sim.clockMinute(s) + s.sol * 24 * 60 > m0, 'vuruş oyun dakikası harcar');
  assert.equal(X.mineralCount(s, st.mineral), 0, 'bitmeden envantere girmez');
  const r = digOut(S, s, st.id);
  assert.ok(r.done && r.first);
  assert.equal(s.inventory.minerals[st.mineral], st.amount);
  assert.ok(s.explore.mineralsSeen[st.mineral], 'bilgi kartı bir kez gösterilir');
});

test('Aynı yerden iki kez alınmaz; bitince nokta listeden ve tarayıcıdan çıkar', () => {
  const { S, s } = landed();
  const X = S.Explore;
  const st = X.mineralSites('surface')[0];
  digOut(S, s, st.id);
  const n = X.mineralCount(s, st.mineral);
  assert.equal(X.digMineral(s, st.id).ok, false);
  assert.equal(X.mineralCount(s, st.mineral), n);
  s.player.x = st.atM;
  S.Surface.syncFromState(s);
  assert.ok(!S.Surface.interactables(s).some((it) => it.id === st.id));
  const ping = X.scannerPing(s);
  assert.ok(!ping || ping.site.id !== st.id);
});

test('Tuzak (boş) tümsekler hâlâ boş: mineral eklemek sahte tümsekleri değiştirmez', () => {
  const { S, s } = landed();
  const X = S.Explore;
  const decoys = X.digSites().filter((st) => !X.siteReal(st));
  assert.ok(decoys.length >= 1);
  for (const st of decoys) {
    s.player.x = X.siteAt(st);
    const ping = X.scannerPing(s);
    assert.ok(!ping || ping.site.id !== st.id, 'sahte tümsek tarayıcıyı öttürmez');
  }
  const before = JSON.stringify(s.inventory.minerals);
  const d = decoys[0];
  let r;
  for (let i = 0; i < d.hits; i++) r = X.dig(s, d.id);
  assert.ok(r.done && !r.caseId);
  assert.equal(JSON.stringify(s.inventory.minerals), before, 'sahte tümsekten mineral çıkmaz');
});

test('Lav tüneli: damar matkapla delinir; matkap yoksa delinmez (Kişi 4 aleti), varsa mineral envantere girer', () => {
  const { S, s } = landed();
  const X = S.Explore;
  const st = X.mineralSites('cave')[0];
  s.explore.tubeOpen = true;
  X.descend(s);
  s.player.cx = st.atM;
  S.Surface.syncFromState(s);
  assert.ok(S.Surface.interactables(s).some((it) => it.kind === 'mineral' && it.id === st.id), 'tünelde damar etkileşimi');
  const cfg = S.DATA.explore.minerals;
  const ph = cfg.toolPlaceholder;
  cfg.toolPlaceholder = false;
  try {
    const no = X.digMineral(s, st.id);
    assert.equal(no.ok, false);
    assert.equal(no.errKey, 'mineral.need_drill');
    assert.notEqual(S.t(no.errKey), no.errKey);
    s.inventory.items.drill = 1;
    const r = digOut(S, s, st.id);
    assert.ok(r.done);
    assert.equal(X.mineralCount(s, st.mineral), st.amount);
  } finally {
    cfg.toolPlaceholder = ph;
  }
});

test('Harcama (tamir / yükseltme): yetmezse hiçbir şeye dokunmaz; yeterse düşer', () => {
  const { S, s } = landed();
  const X = S.Explore;
  s.inventory.minerals = { meteorite: 1, hematite: 2 };
  assert.equal(X.spendMinerals(s, { meteorite: 2 }), false);
  assert.equal(s.inventory.minerals.meteorite, 1);
  assert.equal(X.spendMinerals(s, { meteorite: 1, hematite: 1 }), true);
  assert.equal(s.inventory.minerals.meteorite, 0);
  assert.equal(s.inventory.minerals.hematite, 1);
});

test('Kayıt: bulunan mineral ve kazılmış nokta sayfa yenilenince (JSON gidiş-dönüş) kalır; eski kayıtlara alan eklenir', () => {
  const { S, s } = landed();
  const X = S.Explore;
  const st = X.mineralSites('surface')[1];
  digOut(S, s, st.id);
  const back = S.ensureExploreState(JSON.parse(JSON.stringify(s)));
  assert.equal(back.inventory.minerals[st.mineral], st.amount);
  assert.ok(X.mineralDone(back, st), 'aynı yer yenilemeden sonra da bitmiş');
  const old = JSON.parse(JSON.stringify(s));
  delete old.inventory.minerals;
  delete old.explore.minerals;
  delete old.explore.mineralsSeen;
  S.ensureExploreState(old);
  assert.equal(Object.keys(old.inventory.minerals).length, 0);
  assert.equal(X.mineralHits(old, st), 0);
});

test('Maden noktasında S ile regolit torbası doldurulmaz (mineral E ile kazılır); nokta bitince açık zemin olur', () => {
  const { S, s } = landed();
  const X = S.Explore;
  s.station.impact = true;
  const st = X.mineralSites('surface')[0];
  s.player.x = st.atM;
  const r = S.Station.digRegolith(s);
  assert.equal(r.ok, false);
  assert.equal(r.errKey, 'mineral.err_regolith');
  assert.notEqual(S.t(r.errKey), r.errKey);
  digOut(S, s, st.id);
  assert.equal(S.Station.digRegolith(s).ok, true, 'kazılmış noktada artık regolit alınabilir');
  assert.notEqual(S.t('mineral.hint'), 'mineral.hint');
});
