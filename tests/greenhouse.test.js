/**
 * Kişi 6 — Sera büyüme evreleri: tohum → çimlenme → filiz → olgun → hasat (yeniden ekim).
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

test('Sera: bakımlı her sol bir evre ilerler; bakım atlanırsa büyüme durur', () => {
  const { S, s } = landed();
  const stages = S.DATA.habitat.greenhouse.growth.stages;
  assert.deepEqual([...stages], ['seed', 'germination', 'sprout', 'mature']);
  assert.equal(S.Sim.ghStage(s), 0, 'tohumla başlar');
  assert.equal(S.Sim.ghNeedsTending(s), true);
  endSol(S, s, true);
  assert.equal(S.Sim.ghStageKey(s), 'germination');
  endSol(S, s, false);
  assert.equal(S.Sim.ghStageKey(s), 'germination', 'bakım atlandı: durdu');
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
  const g = S.DATA.habitat.greenhouse.growth;
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
  assert.equal(S.Sim.ghStage(s), 0, 'yeniden ekildi');
  assert.equal(s.greenhouse.harvests, 1);
  assert.ok(s.totalMinutes - t0 >= g.harvestMinutes - 1e-6, 'hasat zaman alır');
  assert.equal(ev.foodKg, kg, 'Kişi 2 için olay yayınlandı');
});

test('Tohum deneyi verimi hasadı büyütür', () => {
  const { S, s } = landed();
  s.greenhouse.yieldPct = 130;
  for (let i = 0; i < 3; i++) endSol(S, s, true);
  S.Sim.doAction(s, 'harvest_greenhouse');
  assert.equal(s.res.foodKg, Math.round(S.DATA.habitat.greenhouse.growth.harvestFoodKg * 1.3 * 10) / 10);
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
