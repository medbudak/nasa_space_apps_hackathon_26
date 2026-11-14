# TESTING.md — Test Stratejisi, Doğrulama Senaryoları ve QA Rehberi

Bu belge, **SOL 14: RED HORIZON** projesinin otomatik birim testlerini, oyun içi hata ayıklama (debug) araçlarını ve `K6` (QA) liderliğinde yürütülen uçtan uca oynanış doğrulama senaryolarını içerir.

---

## 1. Otomatik Birim Testleri (`node --test tests/`)

Node.js yerleşik test çalıştırıcısı (`node:test` ve `node:assert/strict`) kullanılarak tüm mühendislik formülleri, veri bütünlüğü ve puanlama kuralları otomatik olarak doğrulanır:

```bash
npm test
# = node tools/build.js data && node --test "tests/*.test.js"   (Node 22+ dizin değil glob ister)
```

Test dosyaları: `tests/engineering.test.js` (formüller), `tests/data_integrity.test.js` (src URL'leri + TR/EN bütünlüğü + anahtar kapsamı), `tests/qa_profiles.test.js` (§2'deki 3 profil + demo modu, `tests/helpers/bot.js` ile başsız oynanır).

### Test Kapsamı (`tests/engineering.test.js`):
1. **Güneş Gücü Hesabı (`calcSolarPower`):**
   - Temiz panel (`dustFactor = 0`) vs. fırtına sonrası tozlu panel (`dustFactor = 0.8`) güç üretimi doğrulaması.
   - Ekvator (`Meridiani`) vs. Orta Enlem (`Arcadia`) güneş açısı ($\cos Z$) farkı.
2. **Roket Denklemi (`calcDeltaV`):**
   - `m0 > mf` için pozitif $\Delta v$ hesabı ve sınır değer kontrolü.
3. **Işık Gecikmesi (`calcLightDelay`):**
   - En yakın ($5.5 \times 10^7\text{ km} \rightarrow \sim 3.05\text{ dk}$) ve en uzak ($4.0 \times 10^8\text{ km} \rightarrow \sim 22.2\text{ dk}$) Dünya-Mars mesafelerinde doğru gecikme hesabı.
4. **Sarkaç Periyodu (`calcPendulumPeriod`):**
   - $L = 1\text{ m}$ için Mars ($g = 3.73\text{ m/s}^2 \rightarrow T \approx 3.25\text{ sn}$) ve Dünya ($g = 9.81\text{ m/s}^2 \rightarrow T \approx 2.00\text{ sn}$) oranı ($\approx 1.62\times$).
5. **Dönüşsüzlük Noktası (`calcPointOfNoReturnO2` - `M4`):**
   - `900 m` mesafede normal hız vs. donmuş eklem (`%40` hız) durumunda gerekli $\text{O}_2$ çentiğinin yükselmesi ve kriz kartını tetiklemesi.
6. **NASA Veri Doğrulaması (`data/nasa_data.json`):**
   - Tüm aletlerin, roketlerin, iniş bölgelerinin ve kayıp araç vakalarının geçerli `src` URL alanına sahip olduğunun kontrolü.
7. **Çift Dilli Metin Bütünlüğü (`content/story.json`):**
   - `tr` ve `en` sözlüklerindeki tüm anahtarların birebir eşleştiğinin kontrolü.

---

## 2. Oyun İçi QA Senaryoları (3 Farklı Tasarım Profili)

`K6` (QA sorumlusu) oyunu aşağıdaki 3 zıt mühendislik profiliyle baştan sona test eder:

| Test Profili | Sol 0 Tasarım Seçimi | Beklenen Oyun İçi Sonuç ve Karne Çıktısı |
| :--- | :--- | :--- |
| **1. Altın Yol (Dengeli & Güvenli)** | `Jezero`, Panel + RTG, `40 kWh` batarya, Kalın yalıtım, `Mastcam-Z + MEDA + SEIS + MOXIE + Veggie`, `%12` kütle marjı | Fırtına 1 sol önceden bilinir (`MEDA`), gece sera donmaz, 4 adli rapor + 4 deney Dünya'ya ulaşır → **Tam Başarı + `%80` Net UFO Fotoğrafı**. |
| **2. Açgözlü Bilim (Kırılgan Tasarım)** | `Arcadia` (soğuk), Sadece Güneş Paneli, `20 kWh` batarya, İnce yalıtım, `%0` kütle marjı, 0 tamir kiti | `Sol 6–9` fırtınasında ve `-80 °C` gecede güç yükü çöker (`M3`), sera donar, karne **"20 kWh batarya + ince yalıtım → Sol 9 gecesi sera kaybı (-120 puan)"** neden-sonuç analizini gösterir. |
| **3. İletişim / Kamera Eksikliği** | `Mastcam-Z` alınmadı (sadece el kamerası), sadece UHF röle, düşük veri bütçesi | Fotoğraflar yarım puan verir, Downlink kuyruğu (`M1`) tıkanır, finaldeki UFO sahnesinde fotoğraf **`%30` bulanık** iner. |

---

## 3. Hızlı Görev / Jüri Demo Modu (`?demo=1`) ve Debug Kısayolları

* **Jüri Demo Modu (`?demo=1` veya Başlangıç Ekranındaki "Hızlı Görev (5 Sol)" Butonu):**
  - Hazır dengeli bir `Sol 0` tasarımı yükler (oyuncu isterse 1 tıkla değiştirebilir).
  - Süreyi `5 Sol`'a sıkıştırır: `Sol 1` (Sarkaç Deneyi + Opportunity Adli İnceleme) → `Sol 2` (Eklem Donması Dönüşsüzlük Noktası Kriz Kartı) → `Sol 3` (Kum Fırtınası + Güç Yük Kesintisi + Downlink) → `Sol 4` (Tohum Deneyi + InSight Enkazı) → `Sol 5` (MAV Kalkışı + 40 sn UFO Stinger + Neden-Sonuç Karnesi).
* **Geliştirici Debug Konsolu (`window.SOL14_DEBUG`):**
  - Tarayıcı konsolundan `SOL14_DEBUG.nextSol()`, `SOL14_DEBUG.triggerCrisis('joint_freeze')`, `SOL14_DEBUG.playUfoEnding()` çağrılarıyla her sahne saniyeler içinde test edilebilir.
