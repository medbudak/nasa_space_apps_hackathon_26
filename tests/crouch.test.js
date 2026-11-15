/**
 * Çömelme (K2): oyuncu S / ↓ basılı tutunca çömelir (zıplama W / ↑ gibi); ← / → ile çömelik pozda sürünerek ilerler.
 * Çömelince yavaş yürür ve zıplayamaz. Açılmış buz bloğu tüneline ayakta girilmez (↓ ile eğil ipucu); içeride kalkılmaz.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function outside(m) {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  s.player.inside = false;
  s.player.zone = 'surface';
  s.player.x = m;
  S.Surface.syncFromState(s);
  return { S, s };
}
const step = (S, s, input, n = 20) => {
  for (let i = 0; i < n; i++) S.Surface.update(s, 0.05, Object.assign({ dir: 0, jump: false, crouch: false }, input));
};

test('Çömelme: aşağı tuşu basılıyken çömelir, bırakınca kalkar; çömelince yavaş ve zıplayamaz', () => {
  const { S, s } = outside(-300);
  const body = S.Surface.body;
  const v0 = S.Surface.speedFactor(s);
  step(S, s, { crouch: true });
  assert.equal(body.crouchK, 1);
  assert.equal(S.Surface.pose(s), 'crouch');
  assert.ok(S.Surface.speedFactor(s) < v0, 'çömelince daha yavaş');
  step(S, s, { crouch: true, jump: true }, 1);
  assert.equal(body.onGround, true, 'çömelikken zıplanmaz');
  step(S, s, {});
  assert.equal(body.crouchK, 0);
  assert.notEqual(S.Surface.pose(s), 'crouch');
});

test('Çömelerek yürüme: aşağı + sol ile sola, yarı hızda ilerler', () => {
  const { S, s } = outside(-300);
  step(S, s, { crouch: true }, 10); // tam çömel
  const x0 = s.player.x;
  step(S, s, { crouch: true, dir: -1 }, 10);
  const crouchDist = x0 - s.player.x;
  assert.ok(crouchDist > 0, 'sola gitti');
  assert.equal(S.Surface.pose(s), 'crouch');
  step(S, s, {}, 10); // kalk
  const x1 = s.player.x;
  step(S, s, { dir: -1 }, 10);
  const walkDist = x1 - s.player.x;
  assert.ok(Math.abs(crouchDist / walkDist - S.DATA.gameplay.crouch.speedFactor) < 0.05, 'çömelerek yarı hızda');
});

test('Buz tüneli: ayakta girilmez, eğilince sürünerek geçilir, içeride ayağa kalkılmaz', () => {
  const W = loadCore().DATA.terrain.westRegion;
  const b = W.iceBarriers[0];
  const { S, s } = outside(-(b.atM - 40)); // tünelin doğusunda, ayakta
  S.Surface.salvage(s).barriersOpen = [0];
  const body = S.Surface.body;
  step(S, s, { dir: -1 }, 60); // batıya yürü
  assert.equal(S.Surface.inTunnel(s, body.px), false, 'ayakta tünele girmedi');
  assert.equal(body.blockHint, 'hint.crouch', '↓ ile eğil ipucu');
  step(S, s, { crouch: true }, 10); // eğil
  step(S, s, { crouch: true, dir: -1 }, 15); // sürünerek gir
  assert.equal(S.Surface.inTunnel(s, body.px), true, 'çömelince girdi');
  step(S, s, {}, 10); // tuşu bırak
  assert.equal(body.crouchK, 1, 'tünelin içinde ayağa kalkılmaz');
  step(S, s, { dir: -1 }, 200); // çömelik sürünerek çık
  assert.ok(-s.player.x > b.atM + 18, 'tünelin batısına geçti');
  step(S, s, {}, 10);
  assert.equal(body.crouchK, 0, 'dışarıda kalktı');
});

test('Kapalı blok tünel değildir; mağara ağzı serbest giriş', () => {
  const W = loadCore().DATA.terrain.westRegion;
  const { S, s } = outside(-W.iceBarriers[0].atM);
  assert.equal(S.Surface.inTunnel(s, S.Surface.body.px), false, 'blok kazılmadan tünel yok');
  s.player.x = -(W.shelterCave.fromM + 2);
  S.Surface.syncFromState(s);
  step(S, s, {});
  assert.equal(S.Surface.body.crouchK, 0, 'mağara ağzında ayakta');
});
