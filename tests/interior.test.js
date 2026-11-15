/**
 * Mekik içi: istasyon adları (yeni bir istasyon eklendiğinde, ör. D-016 şişe rafı, adı TR + EN metinde olmalı) ve
 * Sude'nin lander kesitindeki hareket: yürüyüş sınırları, yumuşak hız, ağırlıksız itiş (tavan sınırı, yere süzülme).
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

test('Mekik içi: her istasyonun TR ve EN adı var (station.<id>)', () => {
  for (const lang of ['tr', 'en']) {
    const S = loadCore({ lang });
    for (const st of S.Surface.INTERIOR.stations) {
      assert.notEqual(S.t('station.' + st.id), 'station.' + st.id, lang + ': station.' + st.id + ' metni eksik');
    }
  }
});

function inside() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s);
  S.Surface.enterHabitat(s);
  return { S, s };
}

const step = (S, s, input, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 60) S.Surface.updateInterior(s, 1 / 60, { dir: 0, jump: false, ...input });
};

test('lander Mars üstünde: içeride zıplama 0.38g ile yay çizer, tavanı geçmez ve yere geri düşer (süzülme yok)', () => {
  const { S, s } = inside();
  const body = S.Surface.body;
  const I = S.Surface.INTERIOR;
  assert.equal(body.onGround, true);
  S.Surface.updateInterior(s, 1 / 60, { dir: 0, jump: true });
  assert.equal(body.onGround, false);
  let peak = 0;
  let airTime = 0;
  for (let t = 0; t < 10 && !body.onGround; t += 1 / 60) {
    airTime = t;
    S.Surface.updateInterior(s, 1 / 60, { dir: 0, jump: false });
    peak = Math.max(peak, body.y);
  }
  assert.ok(peak > I.maxJumpPx / 2, `zıplama çok alçak: ${peak}`);
  assert.ok(peak <= I.maxJumpPx, `tavan sınırı aşıldı: ${peak}`);
  assert.ok(airTime < 1.6, `havada çok uzun kaldı (ağırlıksız gibi): ${airTime.toFixed(2)} sn`);
  assert.equal(body.onGround, true);
  assert.equal(body.y, 0);
});

test('lander içinde yürüyüş kesitin duvarları arasında kalır', () => {
  const { S, s } = inside();
  const I = S.Surface.INTERIOR;
  step(S, s, { dir: 1 }, 5);
  assert.equal(S.Surface.body.ix, I.right);
  step(S, s, { dir: -1 }, 30);
  assert.equal(S.Surface.body.ix, I.left);
});

test('lander içinde yürüyüş: kısa kalkış ve duruş (Mars yerçekimi var, süzülerek kaymaz)', () => {
  const { S, s } = inside();
  const body = S.Surface.body;
  const top = S.DATA.gameplay.interiorWalkPxPerSecond;
  const settle = 3 * S.Surface.WALK_ACCEL_TAU;
  body.ix = S.Surface.INTERIOR.left + 10;
  step(S, s, { dir: 1 }, settle);
  assert.ok(Math.abs(body.im.v - top) < top * 0.05, `hız yürüyüş hızına oturmadı: ${body.im.v}`);
  step(S, s, { dir: 0 }, settle);
  assert.ok(Math.abs(body.im.v) < top * 0.05, `tuş bırakılınca durmadı: ${body.im.v}`);
  assert.ok(S.Surface.WALK_ACCEL_TAU < S.Surface.DRIFT_ACCEL_TAU, 'yürüyüş, uzaydaki süzülmeden çabuk oturur');
});

test('S.util.easeVelocity: S eğrisi (ivme önce artar sonra azalır) ve hedefi aşmaz', () => {
  const S = loadCore();
  const m = { v: 0, vMid: 0 };
  const speeds = [];
  for (let i = 0; i < 120; i++) speeds.push(S.util.easeVelocity(m, 1, 1 / 60, 0.6));
  const accel = speeds.map((v, i) => v - (speeds[i - 1] || 0));
  const peak = accel.indexOf(Math.max(...accel));
  assert.ok(peak > 0, 'ivme ilk karede en yüksek olmamalı (ease-in)');
  assert.ok(accel[accel.length - 1] < accel[peak], 'ivme sonda azalmalı (ease-out)');
  assert.ok(speeds.every((v, i) => v <= 1 && (i === 0 || v >= speeds[i - 1])), 'hız tekdüze artmalı ve hedefi aşmamalı');
});

test('lander içine her giriş aynı hareket durumunu verir (kapı, kayıttan devam, sonraki sol)', () => {
  const { S, s } = inside();
  const body = S.Surface.body;
  const snapshot = () => ({ y: body.y, vy: body.vy, onGround: body.onGround, v: body.im.v, vMid: body.im.vMid });
  const atDoor = snapshot();
  // Hareketin ortasında bırakılmış durum: havada ve kayarken kayıt alınır, sonra kayıttan devam edilir
  step(S, s, { dir: -1 }, 0.5);
  S.Surface.updateInterior(s, 1 / 60, { dir: 0, jump: true });
  body.y = 17; // dış yüzeyden kalmış yükseklik gibi
  s.sol = 5;
  S.Surface.syncFromState(s);
  assert.deepEqual(Object.values(snapshot()), Object.values(atDoor));
  assert.equal(body.ix, s.player.ix);
});

test('spor bölmesi: istasyon duvarlar arasında; spor moral verir, yorgunluk ekler, süresi veriden', () => {
  const { S, s } = inside();
  const I = S.Surface.INTERIOR;
  const gym = I.stations.find((st) => st.id === 'gym');
  assert.ok(gym && gym.x > I.gym.atX && gym.x < I.gym.atX + I.gym.w, 'istasyon spor bölmesinde');
  assert.ok(I.right <= I.width, 'sağ duvar kesitin içinde');
  const e = S.DATA.gameplay.exercise;
  s.res.morale = 50;
  const fatigue = S.Sim.needs(s).fatigue;
  const t0 = s.minute;
  assert.equal(S.Sim.doAction(s, 'exercise').ok, true);
  assert.equal(s.res.morale >= 50 + e.morale - 1, true, 'moral arttı (zaman geçerken az düşebilir)');
  assert.ok(S.Sim.needs(s).fatigue >= fatigue + e.fatigue - 1, 'yorgunluk arttı');
  assert.ok(s.minute - t0 >= e.minutes, 'süre geçti');
});

// Spor odası sahnesi (src/ui/gym_scene.js): DOM'a yalnız açılınca dokunur; zaman çizelgesi ve ödül burada denenir
function withGymScene() {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const { S, s } = inside();
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'gym_scene.js'), 'utf8');
  vm.runInNewContext(code, { window: { SOL14: S }, Math });
  return { S, s };
}

test('spor bölmesi sağdan ikinci bölmede: sağında yalnız ranza-mutfak-hava kilidi bölmesi var', () => {
  const { S } = inside();
  const I = S.Surface.INTERIOR;
  const right = I.stations.filter((st) => st.x > I.gym.atX + I.gym.w).map((st) => st.id);
  assert.deepEqual([...right], ['bunk', 'bottles', 'airlock']);
  const gym = I.stations.find((st) => st.id === 'gym');
  assert.ok(gym.x > I.gym.atX && gym.x < I.gym.atX + I.gym.w);
});

test('spor odası: dinlenme → kavra → (çek, tut, kontrollü bırak) × tekrar → dinlenme; tutarken tam çekili', () => {
  const { S } = withGymScene();
  const GS = S.GymScene;
  assert.equal(GS.pose(0).rest, 1, 'başta dinlenme pozu');
  const seen = [];
  let lastRelease = 2;
  for (let t = 0; t <= GS.totalS() + 0.2; t += 0.01) {
    const p = GS.pose(t);
    if (seen[seen.length - 1] !== p.phase + p.rep) seen.push(p.phase + p.rep);
    if (p.phase === 'hold') assert.equal(p.pull, 1);
    if (p.phase === 'release') {
      assert.ok(p.pull <= lastRelease + 1e-9, 'bırakma geri sıçramaz');
      lastRelease = p.pull;
    } else lastRelease = 2;
  }
  const reps = GS.PLAN.reps;
  const expect = ['grip0'];
  for (let r = 1; r <= reps; r++) expect.push('pull' + r, 'hold' + r, 'release' + r);
  expect.push('end' + reps, 'done' + reps);
  assert.deepEqual(seen, expect);
  assert.equal(GS.pose(GS.totalS() + 1).rest, 1, 'sonda dinlenme pozu');
});

test('spor odası: egzersizin etkisi bir kez uygulanır; aynı egzersiz ikinci kez ödül vermez', () => {
  const { S, s } = withGymScene();
  const e = S.DATA.gameplay.exercise;
  s.res.morale = 50;
  const t0 = s.minute;
  const run = { rewarded: false };
  assert.equal(S.GymScene.finish(s, run).ok, true);
  const after = { morale: s.res.morale, minute: s.minute, fatigue: S.Sim.needs(s).fatigue };
  assert.ok(after.minute - t0 >= e.minutes);
  const again = S.GymScene.finish(s, run);
  assert.equal(again.ok, false);
  assert.equal(s.res.morale, after.morale);
  assert.equal(s.minute, after.minute);
  assert.equal(S.Sim.needs(s).fatigue, after.fatigue);
});
