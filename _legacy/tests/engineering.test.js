import test from 'node:test';
import assert from 'node:assert/strict';
import storyData from '../src/core/story_data.js';
import {
  NASA_DATA,
  calcSolarPower,
  calcDeltaV,
  calcLightDelay,
  calcPendulumPeriod,
  calcFreeFallTime,
  calcPointOfNoReturnO2,
  calcDesignTotals
} from '../src/core/engineering.js';
import { createInitialState } from '../src/core/state.js';
import { calcMissionScore, buildCauseEffectChains } from '../src/core/score.js';

test('1. NASA Veri Bütünlüğü: Her veri kategorisinde resmi src URL alanı bulunmalı', () => {
  assert.ok(NASA_DATA.meta.src.startsWith('https://'));
  for (const [key, item] of Object.entries(NASA_DATA.constants)) {
    assert.ok(item.src && item.src.startsWith('https://'), `Missing src on constant ${key}`);
  }
  for (const rocket of NASA_DATA.rockets) {
    assert.ok(rocket.src.startsWith('https://'), `Missing src on rocket ${rocket.id}`);
  }
  for (const inst of NASA_DATA.instruments) {
    assert.ok(inst.src.startsWith('https://'), `Missing src on instrument ${inst.id}`);
  }
  for (const c of NASA_DATA.forensicsCases) {
    assert.ok(c.src.startsWith('https://'), `Missing src on forensic case ${c.id}`);
  }
  for (const exp of NASA_DATA.experiments) {
    assert.ok(exp.src.startsWith('https://'), `Missing src on experiment ${exp.id}`);
  }
});

test('2. Çift Dilli Metin (story.json): TR ve EN anahtarları birebir eşleşmeli', () => {
  const trKeys = Object.keys(storyData.tr);
  const enKeys = Object.keys(storyData.en);
  assert.equal(trKeys.length, enKeys.length, 'TR ve EN anahtar sayıları eşit olmalı');
  for (const k of trKeys) {
    assert.ok(storyData.en[k], `EN sözlüğünde eksik anahtar: ${k}`);
  }
});

test('3. Güneş Gücü Formülü (calcSolarPower): Toz ve güneş açısı etkisi', () => {
  const cleanJezero = calcSolarPower({
    irradiance: 590,
    area: 22,
    efficiency: 0.28,
    cosZ: 0.85,
    dustFactor: 0.0
  });
  const stormJezero = calcSolarPower({
    irradiance: 590,
    area: 22,
    efficiency: 0.28,
    cosZ: 0.85,
    dustFactor: 0.8
  });
  assert.ok(cleanJezero > 3000, `Temiz panel gücü beklenenden düşük: ${cleanJezero}`);
  assert.ok(
    Math.abs(stormJezero - cleanJezero * 0.2) < 1.0,
    '%80 tozlanmada güç üretimi %20 seviyesine düşmeli'
  );
});

test('4. Roket Denklemi (calcDeltaV) ve Işık Gecikmesi (calcLightDelay)', () => {
  const dv = calcDeltaV({ isp: 365, wetMass: 7400, dryMass: 1750 });
  assert.ok(dv > 5000 && dv < 5300, `Beklenen Δv ~5158 m/s, hesaplanan: ${dv}`);

  const delayNear = calcLightDelay(55_000_000); // 55 milyon km (~3 dk)
  const delayFar = calcLightDelay(399_000_000); // 399 milyon km (~22 dk)
  assert.ok(delayNear.minutes >= 3 && delayNear.minutes <= 3.5);
  assert.ok(delayFar.minutes >= 22 && delayFar.minutes <= 22.5);
});

test('5. Sarkaç (calcPendulumPeriod) ve Serbest Düşüş (calcFreeFallTime) 0.38g Doğrulaması', () => {
  const tMars = calcPendulumPeriod(1.0, 3.71);
  const tEarth = calcPendulumPeriod(1.0, 9.80665);
  assert.equal(tMars, 3.26);
  assert.equal(tEarth, 2.01);
  assert.ok(tMars / tEarth > 1.6);

  const dropMars = calcFreeFallTime(2.0, 3.71);
  const dropEarth = calcFreeFallTime(2.0, 9.80665);
  assert.equal(dropMars, 1.04);
  assert.equal(dropEarth, 0.64);
});

test('6. Dönüşsüzlük Noktası O2 Hesabı (M4): Eklem donması hızı %40 yapınca gerekli O2 artmalı', () => {
  const normalO2 = calcPointOfNoReturnO2({ distanceMeters: 900, jointFrozen: false });
  const frozenO2 = calcPointOfNoReturnO2({ distanceMeters: 900, jointFrozen: true });
  assert.ok(frozenO2 > normalO2 * 2, `Donmuş eklemde gerekli O2 (${frozenO2}) normalin (${normalO2}) 2.5 katı olmalı`);
  assert.ok(frozenO2 > 31, '900m mesafede donmuş eklemle %31 O2 habitata yetmemeli (Kriz Kartı tetiklenir)');
});

test('7. Görev Başarı Puanı (GBP) ve Downlink Kuralı (M1): Gönderilmeyen rapor puan sayılmaz', () => {
  const state = createInitialState({ lang: 'tr', demoMode: false });
  state.sol = 14;
  state.forensics.opportunity.score = 100;
  state.forensics.opportunity.sent = false;

  const scoreUnsent = calcMissionScore(state);
  assert.equal(scoreUnsent.forensicsScore, 0, 'Downlink ile gönderilmeyen rapor 0 puan olmalı');

  state.forensics.opportunity.sent = true;
  const scoreSent = calcMissionScore(state);
  assert.ok(scoreSent.forensicsScore >= 100, 'Downlink ile gönderilen rapor puana eklenmeli');

  const chains = buildCauseEffectChains(state);
  assert.ok(chains.length >= 2);
});
