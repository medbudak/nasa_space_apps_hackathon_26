/**
 * Kişi 6 — Sera büyüme evreleri: marul, turp, zinya; tohum → … → hasat (yeniden ekim).
 * Her bakımlı sol bir evre ilerler, bakım atlanırsa büyüme durur, donarsa tohuma döner.
 * Hasat yiyecek stoğuna (s.res.foodKg) gider ve moral verir. Süre sıkıştırılmıştır (simplified).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function landed() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  s.greenhouse.installed = true;
  s.greenhouse.frozen = false;
  s.res.waterL = 100;
  return { S, s };
}

/** O solu bakımla ya da bakımsız bitir */
function endSol(S, s, tend) {
  if (tend) assert.equal(S.Sim.doAction(s, 'tend_greenhouse').ok, true);
  S.Sim.rollover(s);
}

test('Sera: her bitki çimlenme → filiz → olgun; bakımlı sol büyütür, bakım atlanırsa büyüme durur', () => {
  const { S, s } = landed();
  assert.equal(S.Sim.ghPlant(s), 'lettuce', 'varsayılan bitki marul');
  for (const id of ['lettuce', 'radish', 'zinnia']) assert.deepEqual([...S.DATA.habitat.greenhouse.growth.plants[id].stages], ['germination', 'sprout', 'mature']);
  assert.equal(S.Sim.ghStageKey(s), 'germination', 'ekim çimlenmeyle başlar');
  assert.equal(S.Sim.ghSolsLeft(s), 3, 'marul: 3 bakımlı sol');
  endSol(S, s, true);
  assert.equal(S.Sim.ghSolsLeft(s), 2);
  endSol(S, s, false);
  assert.equal(S.Sim.ghSolsLeft(s), 2, 'bakım atlandı: durdu');
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'sprout');
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'mature');
  assert.equal(S.Sim.ghNeedsTending(s), false, 'olgun: hasat bekler');
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'mature', 'olgun evrede kalır');
});

test('Hasat: olgun değilken yapılamaz; olgunken yiyecek + moral verir ve yeniden ekilir', () => {
  const { S, s } = landed();
  const g = Object.assign({}, S.DATA.habitat.greenhouse.growth, S.DATA.habitat.greenhouse.growth.plants.lettuce);
  assert.equal(S.Sim.actions.harvest_greenhouse.can(s), 'action.err_gh_not_ripe');
  for (let i = 0; i < 3; i++) endSol(S, s, true);
  assert.equal(S.Sim.ghMature(s), true);
  s.res.morale = 50;
  let ev = null;
  S.bus.on('greenhouse:harvest', (p) => (ev = p));
  const t0 = s.totalMinutes;
  assert.equal(S.Sim.doAction(s, 'harvest_greenhouse').ok, true);
  const kg = Math.round(g.harvestFoodKg * (s.greenhouse.yieldPct / 100) * 10) / 10;
  assert.equal(s.res.foodKg, kg);
  assert.ok(s.res.morale >= 50 + g.harvestMorale - 1, 'moral arttı');
  assert.equal(S.Sim.ghStageKey(s), 'germination', 'yeniden ekildi');
  assert.equal(s.greenhouse.harvests, 1);
  assert.ok(s.totalMinutes - t0 >= g.harvestMinutes - 1e-6, 'hasat zaman alır');
  assert.equal(ev.foodKg, kg, 'Kişi 2 için olay yayınlandı');
});

test('Tohum deneyi verimi hasadı büyütür', () => {
  const { S, s } = landed();
  s.greenhouse.yieldPct = 130;
  for (let i = 0; i < 3; i++) endSol(S, s, true);
  S.Sim.doAction(s, 'harvest_greenhouse');
  assert.equal(s.res.foodKg, Math.round(S.DATA.habitat.greenhouse.growth.plants.lettuce.harvestFoodKg * 1.3 * 10) / 10);
});

test('Donma: güç kesilip bitki donarsa büyüme tohuma döner ve sera büyümez', () => {
  const { S, s } = landed();
  endSol(S, s, true);
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'sprout');
  // seranın yükünü kapat, geceyi bekle: güçsüz kalan bitki donar
  s.loads.find((l) => l.id === 'greenhouse').on = false;
  s.minute = S.DATA.gameplay.nightStartMinute;
  S.Sim.advance(s, 300);
  assert.equal(s.greenhouse.frozen, true, 'güçsüz gece seranın donmasına yol açtı');
  assert.equal(S.Sim.ghStage(s), 0);
  assert.equal(S.Sim.growGreenhouse(s), false);
  assert.equal(S.Sim.actions.harvest_greenhouse.can(s), 'action.err_gh_frozen');
});

test('Bitkiler: turp en hızlı, zinya en yavaş (gerçek sıra: 27 < 33 < 60 gün); zinya yiyecek değil moral verir', () => {
  const P = loadCore().DATA.habitat.greenhouse.growth.plants;
  const sols = (id) => P[id].tendedSols;
  assert.ok(sols('radish') < sols('lettuce') && sols('lettuce') < sols('zinnia'));
  assert.equal(P.zinnia.harvestFoodKg, 0);
  assert.ok(P.zinnia.harvestMorale > P.lettuce.harvestMorale);
  for (const id of Object.keys(P)) assert.match(P[id].src, /^https:\/\/(www\.)?nasa\.gov\//, id + ' kaynaklı');
});

test('Bitki seçimi yalnızca tohum evresinde; turp 2 bakımlı solda olur, zinya çiçeği moral verir', () => {
  const { S, s } = landed();
  assert.equal(S.Sim.choosePlant(s, 'radish'), true);
  endSol(S, s, true);
  assert.equal(S.Sim.choosePlant(s, 'zinnia'), false, 'büyümeye başlayınca bitki değişmez');
  endSol(S, s, true);
  assert.equal(S.Sim.ghMature(s), true, 'turp 2 bakımlı solda olgun');
  assert.equal(S.Sim.doAction(s, 'harvest_greenhouse').ok, true);
  assert.ok(s.res.foodKg > 0);
  assert.equal(S.Sim.ghPlant(s), 'radish', 'aynı bitki yeniden ekilir');
  // hasattan sonra tohum evresinde bitki değiştirilebilir: zinya
  assert.equal(S.Sim.choosePlant(s, 'zinnia'), true);
  endSol(S, s, true);
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'sprout', 'zinya: 2 bakımlı solda filiz');
  endSol(S, s, true);
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'mature', 'zinya: 4 bakımlı solda olgun (çiçek)');
  const food = s.res.foodKg;
  s.res.morale = 40;
  S.Sim.doAction(s, 'harvest_greenhouse');
  assert.equal(s.res.foodKg, food, 'çiçek yiyecek değil');
  assert.ok(s.res.morale > 40);
  assert.equal(S.Sim.choosePlant(s, 'banana'), false, 'bilinmeyen bitki yok');
});
