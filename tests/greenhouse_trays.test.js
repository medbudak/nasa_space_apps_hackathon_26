/**
 * Sera saksıları (çoklu ekim): seviyeye göre saksı sayısı; her saksı ayrı sulanır (su yettiği kadar),
 * ayrı büyür; olgun saksılar birlikte hasat edilir. Saksı 0 eski tek bitki alanlarıdır (eski kayıtlar bozulmaz).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function withGreenhouse() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s);
  s.base.greenhouse = true;
  s.greenhouse.installed = true;
  return { S, s };
}

test('Saksı sayısı sera seviyesine bağlı (Seviye 1/2/3)', () => {
  const { S, s } = withGreenhouse();
  const per = S.DATA.habitat.greenhouse.growth.traysPerLevel;
  assert.equal(S.Sim.ghTrayCount(s), per[0]);
  s.upgrades = { greenhouse: 3 };
  assert.equal(S.Sim.ghTrayCount(s), per[2]);
  assert.ok(per[2] > per[0]);
});

test('Boş saksıya bitki ekilir; bakım her saksıya ayrı su harcar; ikisi de büyür ve birlikte hasat edilir', () => {
  const { S, s } = withGreenhouse();
  const Sim = S.Sim;
  const g = S.DATA.habitat.greenhouse;
  assert.equal(Sim.ghPlant(s, 1), null, 'saksı 1 boş');
  assert.ok(Sim.choosePlant(s, 'radish', 1));
  assert.deepEqual([...Sim.ghPlanted(s)], [0, 1]);
  const w0 = s.res.waterL;
  const r = Sim.doAction(s, 'tend_greenhouse');
  assert.ok(r.ok);
  assert.equal(Math.round((w0 - s.res.waterL) * 10) / 10 >= g.tendWaterL * 2, true, 'iki saksı = iki kat su');
  assert.equal(Sim.ghTray(s, 1).tendedSol, s.sol);
  Sim.growGreenhouse(s);
  assert.equal(Sim.ghProgress(s, 0), 1);
  assert.equal(Sim.ghProgress(s, 1), 1);
  // turp (2 bakımlı sol) olgunlaşınca hasat edilebilir; marul henüz değil
  Sim.ghTray(s, 1).progress = Sim.ghPlantCfg(s, 1).tendedSols;
  assert.equal(Sim.actions.harvest_greenhouse.can(s), null);
  const food0 = s.res.foodKg || 0;
  Sim.actions.harvest_greenhouse.run(s);
  assert.ok((s.res.foodKg || 0) > food0);
  assert.equal(Sim.ghProgress(s, 1), 0, 'hasattan sonra yeniden ekim');
  assert.equal(Sim.ghProgress(s, 0), 1, 'olgun olmayan saksı etkilenmez');
});

test('Su yetmezse yalnızca yettiği kadar saksı sulanır; hiç su yoksa bakım yapılamaz', () => {
  const { S, s } = withGreenhouse();
  const Sim = S.Sim;
  const g = S.DATA.habitat.greenhouse;
  s.upgrades = { greenhouse: 2 };
  Sim.choosePlant(s, 'lettuce', 1);
  Sim.choosePlant(s, 'zinnia', 2);
  s.res.waterL = g.tendWaterL * 2 + 0.1;
  Sim.actions.tend_greenhouse.run(s);
  assert.equal(Sim.ghToTend(s).length, 1, 'üç saksıdan biri susuz kaldı');
  s.res.waterL = 0;
  assert.equal(Sim.actions.tend_greenhouse.can(s), 'action.err_no_water');
});

test('Sera içi sahnesi: arka plan ve her bitkinin her evre görseli diskte (sprites.js listeyi veriden kurar)', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const S = loadCore();
  const dir = path.join(__dirname, '..', 'assets', 'processed');
  assert.ok(fs.existsSync(path.join(dir, 'screens', 'scr_greenhouse.png')), 'sera içi arka planı yok');
  for (const [id, p] of Object.entries(S.DATA.habitat.greenhouse.growth.plants)) {
    p.stages.forEach((_, i) => assert.ok(fs.existsSync(path.join(dir, 'sprites', 'plants', id + '_' + (i + 1) + '.png')), id + ' evre ' + (i + 1) + ' görseli yok'));
  }
});
