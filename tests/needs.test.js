/**
 * İhtiyaç sistemi (Kişi 2): açlık, susuzluk, yorgunluk (0 = iyi, 100 = kritik), eat/drink/sleep/toilet eylemleri.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function landed() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s);
  s.player.inside = true;
  return { S, s };
}

test('İhtiyaçlar: başlangıç değerleri ve erzak stoğu veriden gelir', () => {
  const { S, s } = landed();
  const N = S.DATA.gameplay.needs;
  assert.deepEqual({ ...s.needs }, { ...N.start });
  assert.equal(s.res.foodRations, N.mealsPerSol * s.maxSols + N.spareMeals);
  assert.equal(N.simplified, true);
});

test('İhtiyaçlar: zamanla artar, EVA\'da daha hızlı artar', () => {
  const inside = landed();
  const outside = landed();
  outside.s.player.inside = false;
  inside.S.Sim.stepNeeds(inside.s, 60, false, false);
  outside.S.Sim.stepNeeds(outside.s, 60, true, false);
  for (const k of ['hunger', 'thirst', 'fatigue']) {
    assert.ok(inside.s.needs[k] > 10, k + ' artmalı');
    assert.ok(outside.s.needs[k] > inside.s.needs[k], k + ' EVA\'da daha hızlı artmalı');
  }
});

test('İhtiyaçlar: eşikte uyarı olayı, kritikte yavaşlama ve moral kaybı', () => {
  const { S, s } = landed();
  const N = S.DATA.gameplay.needs;
  const seen = [];
  S.bus.on('needs:warn', (e) => seen.push(e.id + ':' + e.level));
  s.needs.thirst = N.warnAt - 0.1;
  S.Sim.stepNeeds(s, 10, false, false);
  assert.ok(seen.includes('thirst:warn'));
  assert.equal(S.Sim.needsSpeedFactor(s), 1);
  s.needs.hunger = N.criticalAt;
  const m0 = s.res.morale;
  S.Sim.stepNeeds(s, 60, false, false);
  assert.equal(S.Sim.needsSpeedFactor(s), N.criticalSpeedFactor);
  assert.ok(s.res.morale < m0, 'moral düşmeli');
});

test('Yemek ye: bir erzak harcar, açlığı düşürür; erzak yoksa hata', () => {
  const { S, s } = landed();
  s.needs.hunger = 70;
  const r0 = s.res.foodRations;
  assert.equal(S.Sim.actions.eat.preview(s).costVars.to, r0 - 1);
  assert.equal(S.Sim.doAction(s, 'eat').ok, true);
  assert.equal(s.res.foodRations, r0 - 1);
  assert.ok(s.needs.hunger < 70);
  s.res.foodRations = 0;
  assert.equal(S.Sim.doAction(s, 'eat').errKey, 'needs.err_no_food');
});

test('Su iç: içme suyu Sabatier ile aynı depodan düşer; su yoksa hata', () => {
  const { S, s } = landed();
  s.needs.thirst = 70;
  const w0 = s.res.waterL;
  const pv = S.Sim.actions.drink.preview(s);
  assert.equal(pv.costVars.sab, S.DATA.constants.sabatier.waterL);
  assert.equal(S.Sim.doAction(s, 'drink').ok, true);
  assert.ok(s.needs.thirst < 70);
  assert.ok(s.res.waterL < w0);
  s.res.waterL = 0;
  assert.equal(S.Sim.doAction(s, 'drink').errKey, 'needs.err_no_water');
});

test('Uyu: Sim.sleep yorgunluğu sıfırlar, başla/bitti olaylarını yayınlar', () => {
  const { S, s } = landed();
  s.needs.fatigue = 80;
  const ev = [];
  S.bus.on('action:start', (e) => ev.push('start:' + e.id));
  S.bus.on('action:done', (e) => ev.push('done:' + e.id));
  S.Sim.sleep(s);
  assert.equal(s.needs.fatigue, 0);
  assert.equal(s.sleeping, false);
  assert.deepEqual(ev.filter((x) => x.endsWith('sleep')), ['start:sleep', 'done:sleep']);
});

test('Hasat (K6): greenhouse:harvest olayı açlığı azaltır', () => {
  const { S, s } = landed();
  s.needs.hunger = 50;
  S.bus.emit('greenhouse:harvest', { s, kg: 1 });
  assert.equal(s.needs.hunger, 50 - S.DATA.gameplay.needs.harvestHungerRelief);
});

test('Yemek ye: önce seradan gelen taze ürün (s.res.foodKg) yenir, erzak korunur', () => {
  const { S, s } = landed();
  const N = S.DATA.gameplay.needs;
  s.res.foodKg = N.mealKg * 1.5;
  const r0 = s.res.foodRations;
  assert.equal(S.Sim.actions.eat.preview(s).costKey, 'needs.cost_fresh');
  assert.equal(S.Sim.doAction(s, 'eat').ok, true);
  assert.equal(s.res.foodRations, r0);
  assert.ok(Math.abs(s.res.foodKg - N.mealKg * 0.5) < 0.01);
  assert.equal(S.Sim.actions.eat.preview(s).costKey, 'needs.cost_food', 'yarım öğün kalınca erzağa döner');
  s.res.foodRations = 0;
  assert.equal(S.Sim.doAction(s, 'eat').errKey, 'needs.err_no_food');
});
