# API.md — Mühendislik Formülleri, `gameState` Şeması ve Modül Arayüzleri

Bu belge, **SOL 14: RED HORIZON** içindeki çekirdek modüllerin (`engineering.js`, `state.js`, `minigames.js`, `forensics.js`, `experiments.js`) fonksiyon imzalarını, matematiksel denklemlerini ve JSON veri şemalarını tanımlar.

---

## 1. Mühendislik ve Fizik Formülleri (`src/core/engineering.js`)

Tüm formüller `data/nasa_data.json` içindeki doğrulanmış NASA sabitlerini kullanır ve `tests/engineering.test.js` ile birim testine tabi tutulur.

### 1.1. Güneş Paneli Güç Üretimi (`calcSolarPower`)
$$P = S \cdot A \cdot \eta \cdot \cos Z \cdot (1 - d_{\text{toz}})$$

* $S$: Mars yörüngesinde ortalama güneş ışınımı ($\approx 590\text{ W/m}^2$; günberi/günöte aralığı $490\text{–}715\text{ W/m}^2$).
* $A$: Aktif güneş paneli yüzey alanı ($\text{m}^2$).
* $\eta$: Fotovoltaik hücre dönüşüm verimi ($\approx 0.28$).
* $\cos Z$: Güneş zenit açısı kosinüsü (İniş bölgesi enlemine ve günün saatine bağlı: `Meridiani` > `Jezero` > `Arcadia`).
* $d_{\text{toz}}$: Panel üzerindeki toz birikim katsayısı ($0.0\text{–}0.90$; fırtınada artar, manuel temizlik veya toz şeytanı ile azalır).

```js
export function calcSolarPower({ irradiance = 590, area = 25, efficiency = 0.28, cosZ = 0.85, dustFactor = 0.1 })
// Döndürür: Watt cinsinden anlık güç (number)
```

### 1.2. Tsiolkovsky Roket Denklemi (`calcDeltaV`)
$$\Delta v = I_{\text{sp}} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$

* $I_{\text{sp}}$: Özgül itki ($\text{s}$).
* $g_0$: Standart yerçekimi ivmesi ($9.80665\text{ m/s}^2$).
* $m_0$: Toplam başlangıç (ıslak) kütlesi ($\text{kg}$).
* $m_f$: Yakıtsız (kuru) kütle ($\text{kg}$).

```js
export function calcDeltaV({ isp = 360, wetMass, dryMass })
// Döndürür: m/s cinsinden Δv (number)
```

### 1.3. Dünya–Mars Tek Yön Işık Gecikmesi (`calcLightDelay`)
$$t_{\text{gecikme}} = \frac{d_{\text{Dünya-Mars}}}{c}$$

* $d_{\text{Dünya-Mars}}$: O günkü Dünya-Mars mesafesi ($\text{km}$, JPL Horizons verisi: $5.5 \times 10^7\text{ km}$ ile $4.0 \times 10^8\text{ km}$ arası).
* $c$: Işık hızı ($299\,792.458\text{ km/s}$).
* Sonuç: Tek yön $\approx 3\text{–}22\text{ dakika}$ ($180\text{–}1320\text{ sn}$).

```js
export function calcLightDelay(distanceKm)
// Döndürür: { seconds: number, minutes: number, formatted: string }
```

### 1.4. Sarkaç Periyodu ve Yerçekimi Ölçümü (`calcPendulumPeriod`)
$$T = 2\pi \sqrt{\frac{L}{g_{\text{Mars}}}}$$

* $L$: Sarkaç ip uzunluğu ($\text{m}$).
* $g_{\text{Mars}} = 3.71\text{ m/s}^2$ (Dünya'da $9.81\text{ m/s}^2$; Mars'ta periyot Dünya'dakinin $\approx 1.63$ katıdır).

```js
export function calcPendulumPeriod(lengthMeters = 1.0, gravity = 3.71)
// Döndürür: 1 tam salınım süresi (saniye)
```

### 1.5. Dönüşsüzlük Noktası Oksijen Hesabı (`calcPointOfNoReturnO2` - `M4`)
$$O_{2,\text{gerekli}} = \frac{\text{mesafe}}{v_{\text{güncel}}} \cdot \dot{c}_{O_2} \cdot 1.2$$

* $\text{mesafe}$: Astronotun habitata olan uzaklığı ($\text{m}$).
* $v_{\text{güncel}}$: Güncel yürüme hızı ($\text{m/dk}$; eklemler donduğunda hız `%40`'a düşer).
* $\dot{c}_{O_2}$: Dakika/birim başına $\text{O}_2$ tüketim hızı.
* $1.2$: `%20` NASA güvenlik marjı çarpanı.

```js
export function calcPointOfNoReturnO2({ distanceMeters, currentSpeed, o2RatePerMeter, safetyFactor = 1.2 })
// Döndürür: Habitata güvenli dönüş için gereken minimum O2 yüzdesi (0..100)
```

### 1.6. Görev Başarı Puanı (`calcMissionScore` - `GBP`)
$$\text{GBP} = \text{AdliPuan}_{\text{downlink}} + \text{DeneyPuan}_{\text{downlink}} + \text{HayattaKalma} + \text{KütleMarjıBonusu} - \text{SistemKayıpCezası}$$

```js
export function calcMissionScore(state)
// Döndürür: { total, forensicsScore, experimentsScore, survivalScore, marginBonus, penalties, tier: 'FULL_SUCCESS' | 'MIN_SUCCESS' | 'PARTIAL' | 'FAILED' }
```

---

## 2. Merkezi `gameState` Şeması (`src/core/state.js`)

```js
{
  lang: 'tr', // 'tr' | 'en'
  demoMode: false, // ?demo=1 ise true (5 Sol Hızlı Görev)
  sol: 0, // 0 = Tasarım, 1..14 = Operasyon
  maxSols: 14,
  phase: 'design', // 'design' | 'transit' | 'surface' | 'ending' | 'report'
  timeOfDay: 'day', // 'day' | 'sunset' | 'night'
  rngSeed: 20261114,

  // Sol 0 Tasarım Seçimleri
  design: {
    objectiveFocus: 'balanced', // 'forensics' | 'experiments' | 'balanced'
    rocketId: 'vulcan_centaur',
    orbitType: 'hohmann', // 'hohmann' (~8 ay) | 'fast' (~6 ay)
    launchWindowCaught: true,
    landingSiteId: 'jezero', // 'meridiani' | 'jezero' | 'arcadia'
    powerSource: 'solar_rtg', // 'solar_only' | 'solar_rtg'
    batteryKwh: 40, // 20 | 40 | 60
    insulation: 'thick', // 'thin' | 'thick'
    instruments: ['mastcam_z', 'meda', 'seis', 'moxie', 'veggie'], // maks 5
    commArchitecture: 'relay_xband', // 'relay_only' | 'relay_xband'
    repairKits: 1, // 0 | 1 | 2
    massMarginPct: 12.5
  },

  // Bütçe ve Limitler
  budgets: {
    moneyUsed: 840, moneyMax: 1000, // M$
    massUsed: 1320, massMax: 1500,  // kg
    powerProdW: 920, powerConsW: 680,
    dataPerSolMax: 60, dataUsedThisSol: 0 // Mbit/sol
  },

  // Canlı Kaynaklar (HUD)
  resources: {
    o2: 100,          // % (0..100)
    energyKwh: 36,    // kWh (0..batteryKwh)
    suitTempC: 18,    // °C (kritik eşik: -15°C iç elbise / -80°C dış)
    radiationMsv: 12, // mSv (limit: 150 mSv)
    sanity: 100,      // % (0..100)
    waterLiters: 80,
    mavFuelPct: 100,
    panelDust: 0.08,  // 0..0.90
    evaDistanceM: 0,  // Habitattan uzaklık (0..1200 m)
    jointFrozen: false
  },

  // M3: Güç Yük Önceliklendirme Sırası (Üstten alta öncelik)
  powerPriorities: [
    { id: 'life_support', powerW: 220, active: true },
    { id: 'heating',      powerW: 180, active: true },
    { id: 'greenhouse',   powerW: 100, active: true },
    { id: 'moxie',        powerW: 300, active: true },
    { id: 'experiments',  powerW: 60,  active: true },
    { id: 'comms',        powerW: 40,  active: true }
  ],

  // M1: Downlink Veri Kuyruğu
  downlinkQueue: [
    // { id, type: 'forensic'|'experiment'|'photo'|'family_msg', titleKey, sizeMbit, points, sent: false }
  ],

  // Ana Görev 1: Kayıp Araç Adli İnceleme Durumu
  forensics: {
    // caseId: { discovered, evidence: { photo, telemetry, env }, diagnosis, sent, score, partSalvaged }
  },

  // Ana Görev 2: 6 Deney Durumu
  experiments: {
    // expId: { hypothesis, environment, controlGroup, measuredValue, completed, sent, score, bonusUnlocked }
  },

  // Envanter ve Sökülen Parçalar
  inventory: {
    repairKits: 1,
    rhuUnits: 0,
    spareAntenna: false,
    roboticArmPart: false,
    perchlorateWashed: false,
    anomalyPhotos: 0
  },

  // M2 & M5: Karar Günlüğü (Karne için)
  decisionLog: [
    // { sol, category: 'design'|'crisis'|'science', titleKey, choiceKey, costText, consequenceKey, scoreImpact }
  ],

  // UFO Finali Bayrakları
  ufoEnding: {
    triggered: false,
    cameraTier: 'high', // 'high' (Mastcam-Z -> %80) | 'low' (El kamerası -> %30)
    downloadPct: 80
  }
}
```

---

## 3. Mini-Oyun Arayüz Sözleşmesi (`src/minigames/minigames.js`)

Tüm 4 mini-oyun şablonu (`wires`, `align`, `qte`, `converter`) aynı asenkron fonksiyon imzasını kullanır:

```js
/**
 * @param {'wires'|'align'|'qte'|'converter'} type - Mini-oyun şablon tipi
 * @param {Object} config - { titleKey, descKey, timeLimitSec, targetValue, theme }
 * @returns {Promise<{ success: boolean, score: number, timeUsed: number }>}
 */
export async function runMinigame(type, config)
```

---

## 4. Olay Veri Yolu (`Event Bus`) Kanalları

* `state:changed` — `gameState` güncellendiğinde UI bileşenlerini yeniler.
* `crisis:trigger` — Yeni bir kriz kartı (`M2`) açar.
* `fx:weather` — Canvas üzerinde fırtına, buzlanma (`frost`), toz şeytanı veya sarsıntı efektini tetikler.
* `audio:play` — Ses motorunda (`click`, `alarm`, `wind`, `scan`, `downlink`, `ufo_ping`) sesini çalar.
* `sol:advance` — Gün geçiş ekranını (`SOL X → SOL X+1`) ve mavi gün batımı animasyonunu başlatır.
