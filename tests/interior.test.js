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

test('lander içinde zıplama ağırlıksız bir itiştir: tavan sınırını geçmez, yavaşça yere geri süzülür', () => {
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
  assert.ok(peak > 0, 'mürettebat yükselmedi');
  assert.ok(peak <= I.maxJumpPx, `tavan sınırı aşıldı: ${peak}`);
  assert.ok(peak > I.maxJumpPx / 2, `itiş tavana doğru yükselmedi: ${peak}`);
  assert.ok(airTime > 1.5, `süzülme çok kısa (ağırlıksız değil): ${airTime.toFixed(2)} sn`);
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

test('lander içinde hız yumuşakça değişir: yavaş kalkış, hedefe oturma, tuş bırakılınca kısa süzülme', () => {
  const { S, s } = inside();
  const body = S.Surface.body;
  const top = S.DATA.gameplay.interiorWalkPxPerSecond;
  const settle = 3 * S.Surface.DRIFT_ACCEL_TAU; // iki kademeli yumuşatma bu sürede hedefin %2'sine iner
  body.ix = S.Surface.INTERIOR.left + 10; // sağa süzülmek için yer olsun
  S.Surface.updateInterior(s, 1 / 60, { dir: 1, jump: false });
  assert.ok(body.im.v > 0 && body.im.v < top * 0.1, `ilk karede hız çok yüksek: ${body.im.v}`);
  step(S, s, { dir: 1 }, settle);
  assert.ok(Math.abs(body.im.v - top) < top * 0.02, `hız hedefe oturmadı: ${body.im.v}`);
  const before = body.ix;
  S.Surface.updateInterior(s, 1 / 60, { dir: 0, jump: false });
  assert.ok(body.ix > before && body.im.v > top * 0.9, 'tuş bırakılınca hemen durmamalı');
  step(S, s, { dir: 0 }, settle);
  assert.ok(Math.abs(body.im.v) < top * 0.02, `süzülme sönmedi: ${body.im.v}`);
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
