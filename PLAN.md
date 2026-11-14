# PLAN.md — 30 Saatlik Görev Planı ve Adım Adım Uygulama Yol Haritası

Bu belge, **SOL 14: RED HORIZON** projesinin 30 saatlik (`S0–S30`) geliştirme takvimini, kilometre taşlarını, onaylanan kapsam/kesim kararlarını ve yazılımı inşa ederken izleyeceğimiz adım adım uygulama sırasını içerir.

---

## 1. Ortak Kilometre Taşları (Milestones)

| Hedef | Saat | Kilometre Taşı | Başarı / Çıkış Kriteri |
| :---: | :---: | :--- | :--- |
| 🎯 **S6** | `Cmt 19:30` | **Dikey Dilim (Vertical Slice)** | `Sol 0` tasarım → Mars iniş → 1 enkazın adli döngüsü (`Opportunity`) → Sarkaç deneyi → Gece donma kriz kartı uçtan uca oynanabilir durumda. |
| 🎯 **S14** | `Paz 03:30` | **Alfa Sürümü (Alpha)** | Tüm temel sistemler (`M1–M5`, 4 enkaz, 6 deney, olay motoru, karne) uçtan uca çökmeden çalışıyor. |
| 🎯 **S20** | `Paz 09:30` | **İçerik Kilidi (Content Lock)** | UFO Stinger finali bağlandı, `story.json` (TR/EN) tamamlandı. Yeni metin veya yeni özellik eklenmez. |
| 🎯 **S24** | `Paz 13:30` | **Özellik Dondurma (Feature Freeze)** | `?demo` / Hızlı Görev modu, dil anahtarı ve klavye erişilebilirliği tamamlandı. Bu saatten sonra yalnızca hata düzeltmesi yapılır. |
| 🎯 **S28** | `Paz 17:30` | **Yayında + Video Hazır** | GitHub Pages canlı sürümü güncellendi, 30 saniyelik İngilizce altyazılı demo videosu ve 7 slayt hazır. |
| 🎯 **S30** | `Paz 19:30` | **Resmi Teslim** | Space Apps portalına tüm bağlantılar, NASA kaynak matrisi ve yedek paket yüklendi. |

---

## 2. Saat Saat Görev Dağılımı (`K1–K6`)

| Saat Dilimi | K1 (Lider / Sistem) | K2 (Simülasyon / Olay) | K3 (UI / Mini-Oyun) | K4 (Pixel Art / VFX) | K5 (Senaryo / Bilim / Ses) | K6 (Adli / Deney / QA) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **S0–S1** | Repo, mimari kurulum, dokümanlar | Mimari ve state şemasını incele | UI bileşen şemasını hazırla | Renk paleti + `48 px` ızgara rehberi | Proje sayfası iskeleti (EN) | Adli ve deney şemalarını incele |
| **S1–S4** | `nasa_data.json` + `engineering.js` formülleri | 0.38g yürüme/zıplama, gece-gündüz, enerji simülasyonu | `Sol 0`: 5 tasarım ekranı iskeleti + SPOF (`M8`) | Astronot sprite'ları (dur, yürü, zıpla, donmuş, aksiyon) | 5 enkaz vakasını NSSDCA'dan doğrula, metinleri yaz | `forensics.js`: kanıt toplama + 5 kategori teşhis + puan |
| **S4–S6** | `decisionLog[]` + GBP puan modeli (asgari/tam başarı) | Olay motoru + Kriz Kartı mantığı (`M2`) | Karar Kartı UI + `Converter` ve `Wires` mini-oyunları | Habitat, Sera, MAV, Güneş Paneli + 5 enkaz sprite'ı | 12+ kriz kartı metni (`TR` + `EN`) | Deney 1–2 (Sarkaç, Serbest Düşüş) + kronometre ölçümü |
| **S6–S10** | Neden-Sonuç Karnesi (`M5`) + NASA karşılaştırma | Dönüşsüzlük Noktası (`M4`) + Güç Yükü mantığı (`M3`) | Downlink Kuyruğu (`M1`) + `Align` / `QTE` mini-oyunları | Mars arka planları (`Jezero`, `Meridiani`, `Arcadia`, Gece, Mavi Gün Batımı) | Deney 3–6 metinleri; `story.json` İngilizce çevirisi | 4 zorunlu enkazın tam adli döngüsü + NASA bulgu kartları |
| **S10–S14** | Yörünge, fırlatma penceresi ve iniş bölgesi etkileri; birim testler | Olaylar: Fırtına, sarsıntı, SPE, kavuşum, toz şeytanı, perklorat | Güç Yük Paneli UI (`M3`) + Telemetri ve HUD çubukları | Fırtına parçacıkları, vizör buzu (`frost 1-2`), toz şeytanı, halüsinasyon | Uyku vardiyası (`S11–S14`) | Deney 3 (Tohum) başlangıcı + Uyku vardiyası (`S11–S14`) |
| **S14–S18** | Uyku vardiyası (`S15–S18`) | Sera yönetimi + Gecikmeli Görev Kontrol (`M7`) + `ufoStinger` tetikleyici | Uyku vardiyası (`S15–S18`) | UFO sahnesi animasyonu (MAV kalkışı, ışık, satır satır inen net/bulanık foto) | UFO storyboard + analist notu + Web Audio / CC0 ses efektleri | Deney 3–6 tamamlama (Tohum, Su kaynaması, Ses hızı, MOXIE) |
| **S18–S20** | Denge oturumu + UFO finalini 3 sonuca bağlama | Uyku vardiyası (`S18–S21`) | UFO downlink ilerleme çubuğu + Akıl sağlığı (`Sanity`) UI | Uyku vardiyası (`S18–S21`) | Proje sayfası (EN): NASA kaynakları, gereksinim matrisi, bilimsel düzeltmeler | `Beagle 2` bonus vakası + `K1` ile ilk tam oyun denge testi |
| **S20–S24** | Hızlı Görev / `?demo` modu (`M9`) + `localStorage` kayıt testi | `Sol 14` son sekans (anten → donmuş valf → MAV kalkış) | `TR/EN` dil anahtarı + klavye kısayolları ve erişilebilirlik | Kalkış + gün geçişi (`SOL X → X+1`) animasyonu ve görsel cilalama | 7 slaytlık sunum (EN) | QA: 3 farklı tasarımla tam oynayış, hata raporu ve doğrulama |
| **S24–S30** | Son deploy, teslim kontrol listesi ve Space Apps gönderimi | Hata avı + "Altın Yol" (Golden Path) oynayışı | UI hata avı + ekran görüntüleri | Kapak görseli (`cover_thumbnail.png`) + video kurgu desteği | 30 sn demo video çekimi, EN altyazı ve yerel sunum provası | Son QA: canlı linkte sıfırdan test |

---

## 3. Kapsam ve Kesim Kararları (`C1–C7`)

6 kişilik plan doğrultusunda zaman/etki verimliliği için aşağıdaki kapsam kararları uygulanır:

* **Kesilen / Sadeleştirilenler (`C1, C4, C7`):**
  - **C1 (Uzay Yolculuğu Sol 1–3):** Uzun oynanabilir uzay bölümü yerine **15 saniyelik sinematik yaklaşma ekranı + 1 mikrometeorit kablo tamir mini-oyunu** olarak sadeleştirildi.
  - **C4 (Sabah 4 Slotlu Taktik Planlama Ekranı - M6):** Ayrı bir sabah slot ekranı yerine doğrudan yüzey HUD'u üzerinden aksiyon seçimi ve gün sonu özeti kullanıldı.
  - **C7 (Canlı JPL Horizons API İsteği):** Ağ hatası riskini önlemek için `data/nasa_data.json` içinde **önceden hesaplanmış gerçek JPL Horizons mesafe ve ışık gecikmesi tablosu** kullanıldı.
* **Planda Tutulanlar (`C2, C3, C5, C6`):**
  - **C5:** Deney 5 (Ses Hızı) ve Deney 6 (MOXIE Verimi) tam olarak içerikte yer alır.
  - **C6:** `Beagle 2` 5. bonus adli inceleme vakası olarak yer alır.
  - **C2 & C3:** Sabatier ISRU yakıt desteği ve Akıl Sağlığı (`Sanity`) sahte alarm + gölge halüsinasyonu efektleri oyunda yer alır.

---

## 4. Yazılım İnşa Adımları (Adım Adım Uygulama Sırası)

Bu dokümantasyon tamamlandıktan hemen sonra projeyi aşağıdaki 6 fazda kodlayarak tamamlayacağız:

1. **Faz 1 — Varlık (Asset) Organizasyonu ve Altyapı:**
   - Kök dizindeki 32 adet PNG görselini `assets/backgrounds/`, `assets/sprites/`, `assets/structures/`, `assets/screens/`, `assets/vfx/` ve `assets/ending/` klasörlerine standart isimleriyle kopyalama.
   - `package.json` ve proje klasör yapısını (`src/core/`, `src/systems/`, `src/ui/`, `src/minigames/`, `src/fx/`, `data/`, `content/`, `styles/`, `tests/`) oluşturma.
2. **Faz 2 — Bilimsel Veri, Çeviri ve Mühendislik Çekirdeği (`K1` + `K5`):**
   - `data/nasa_data.json` (tüm NASA sabitleri, 3 roket, 3 iniş bölgesi, 9 alet, 5 enkaz vakası, 6 deney verisi ve kaynak URL'leri).
   - `content/story.json` (tam TR ve EN dil paketi).
   - `src/core/engineering.js` (güneş gücü, $\Delta v$, ışık gecikmesi, sarkaç periyodu, dönüşsüzlük noktası $O_2$, GBP puan hesaplamaları) ve `src/core/state.js` (`gameState` + Event Bus + `localStorage`).
   - `tests/engineering.test.js` birim testlerinin yazılıp çalıştırılması.
3. **Faz 3 — Simülasyon, Olaylar, Adli İnceleme ve Deney Sistemleri (`K2` + `K6`):**
   - `src/core/sim.js` ve `src/core/events.js` (günlük kaynak tüketimi, güç yükü kesintisi, 15 zorluk/olay kataloğu, kriz kartları, gecikmeli görev kontrol).
   - `src/systems/forensics.js` (5 kayıp araç dedektif sistemi) ve `src/systems/experiments.js` (6 deney bilimsel yöntem döngüsü).
4. **Faz 4 — Görsel Motor (Canvas + Chroma-Key VFX) ve Ses (`K4` + `K5`):**
   - `src/fx/sprites.js` (`#FFFFFF` beyaz arka planı şeffaf yapan pixel-art sprite yükleyici ve 0.38g karakter/yüzey sahnesi çizici).
   - `src/fx/effects.js` (toz fırtınası, vizör buzlanması, sarsıntı, toz şeytanı, gölge halüsinasyonu ve UFO satır-satır foto inme animasyonu).
   - `src/fx/audio.js` (Web Audio API ile rüzgâr, alarm, tıklama, radar ve UFO sinyal sesleri).
5. **Faz 5 — Arayüz Ekranları ve 4 Mini-Oyun (`K3`):**
   - `src/ui/design_screens.js` (`Sol 0` 5 tasarım ekranı, canlı bütçe/kütle/güç/veri çubukları, SPOF uyarıları).
   - `src/ui/hud.js`, `src/ui/downlink.js`, `src/ui/power_panel.js`, `src/ui/decision_card.js` ve `src/ui/report_card.js`.
   - `src/minigames/` (`wires.js`, `align.js`, `qte.js`, `converter.js`).
6. **Faz 6 — Entegrasyon, `?demo` Modu ve Doğrulama:**
   - `index.html`, `styles/main.css` ve `src/main.js` ile tüm akışın birleştirilmesi, testlerin çalıştırılması ve tarayıcı doğrulaması.
