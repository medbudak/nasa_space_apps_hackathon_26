# SOL 14: RED HORIZON

**NASA Space Apps Challenge 2026 (Sakarya) — Space Mission Design Game**

> **Tek Cümlelik Özet:** Oyuncu bir insanlı Mars görevini sınırlı bütçe, kütle, güç ve veri bant genişliğiyle kendisi tasarlar (`Sol 0`); sonra Mars'ta `14 Sol` boyunca o tasarımın sonuçlarını yaşar ve oyun sonunda her mühendislik kararının görevi nasıl etkilediğini gösteren gerçek NASA verileriyle kıyaslamalı bir **Neden-Sonuç Karnesi** alır.

---

## 🎯 Oyun Konsepti ve Üç Aşamalı Döngü

1. **TASARLA (`Sol 0` - 5 Ekran):**
   - **Görev Hedefi Seçimi:** Adli İnceleme Ağırlıklı, Deney Ağırlıklı veya Dengeli (Asgari ve Tam Başarı kriterlerini belirler).
   - **Roket, Yörünge ve Fırlatma Penceresi:** 3 roket seçeneği × 2 transfer yörüngesi (Hohmann ~8 ay / Hızlı ~6 ay) ve 26 aylık fırlatma penceresi takası.
   - **İniş Bölgesi ve Habitat Sistemleri:** Meridiani Planum (Ekvator), Jezero Krateri (18°K) veya Arcadia Planitia (~40°K) seçimi; Güneş Paneli / Panel + RTG, Batarya (20/40/60 kWh) ve Yalıtım (İnce/Kalın) kararları.
   - **Bilimsel Alet Seçimi (Payload Selection):** 9 gerçek NASA aletinden en fazla 5'inin seçimi (`Mastcam-Z`, `MEDA`, `SEIS`, `RAD`, `RIMFAX`, `SuperCam/PIXL`, `MOXIE`, `Veggie`, `Ingenuity`).
   - **İletişim Mimarisi ve Yedeklilik:** Sadece UHF Röle (`MRO`/`MAVEN`) veya Röle + Doğrudan Dünya (`X-band`), Tamir Kitleri (0/1/2) ve `%10+` Kütle Marjı.

2. **YÖNET (`Sol 1–14` - Mars Yüzey Operasyonu ve Uzay Yaklaşımı):**
   - **Ana Görev 1 — Kayıp Araçların Adli İncelemesi (Forensics):** `Opportunity`, `Spirit`, `Phoenix`, `InSight` ve bonus `Beagle 2` enkazlarını bulma, 3 tip kanıt toplama (fotoğraf, kara kutu telemetrisi, spektrometre/çevre ölçümü), 5 arıza kategorisinden (`Güç/Toz`, `Termal`, `Mekanik`, `Yazılım/Sensör`, `İletişim`) teşhis koyma, Dünya'ya rapor gönderme ve parça sökme.
   - **Ana Görev 2 — Mars Laboratuvarı (6 Bilimsel Deney):** Hipotez → Ortam Seçimi (Habitat İçi vs. Dış Ortam) → Kontrol Grubu → Ölçüm Mini-Oyunu → Sonuç Kartı döngüsüyle çalışan 6 deney (*Sarkaçla Yerçekimi Ölçümü, Serbest Düşüş/Zıplama, Tohum Çimlenmesi, Suyun Üçlü Noktada Kaynaması, Ses Hızı, MOXIE Gece/Gündüz Verimi*).
   - **Kriz Kartları ve Mühendislik Mekanikleri:**
     - **Veri Bütçesi / Downlink Kuyruğu (`Mbit/sol`):** Çekilen fotoğraf ve deney sonuçları Dünya'ya gönderilmedikçe puan sayılmaz.
     - **Güç Yük Önceliklendirme Paneli (Load Shedding):** Yaşam desteği, ısıtma, sera, MOXIE, deneyler ve iletişim sırasını belirleme.
     - **Dönüşsüzlük Noktası Göstergesi (Point of No Return):** EVA sırasında eklem donması ve mesafe bazlı anlık $O_{2,\text{gerekli}}$ çentiği.
     - **Gecikmeli Görev Kontrol:** Dünya-Mars tek yön ışık gecikmesi (~3–22 dk) nedeniyle acil kararların astronot tarafından verilmesi.

3. **DEĞERLENDİR (`Sol 14+` - Karne ve UFO Stinger Finali):**
   - **Neden-Sonuç Karnesi:** `decisionLog[]` kayıtlarından her tasarım ve kriz kararının sayısal etkisini gösteren analiz + gerçek NASA görevleriyle kıyaslama.
   - **UFO Finali (~40 sn Stinger):** MAV kalkışı sırasında ufukta beliren anomalinin, oyuncunun seçtiği kamera çözünürlüğü (`Mastcam-Z` vs. el kamerası) ve kalan veri bütçesi (`Mbit`) doğrultusunda `%80` net veya `%30` bulanık indirilmesi ve Güneş Kavuşumu (`Solar Conjunction`) ile sinyalin kesilmesi (*Viking 1976 "Mars'taki Yüz" bilimsel göndermesi*).

---

## 📊 NASA Space Apps Challenge Gereksinim Matrisi

| Challenge Kavramı | Oyundaki Karşılığı | Göründüğü Ekran | NASA Veri Kaynağı |
| :--- | :--- | :--- | :--- |
| **Mission objectives** | Birincil (Adli İnceleme) + İkincil (Deneyler) hedef seçimi; Asgari ve Tam Başarı kriterleri | Sol 0 Ekran 1 | NSSDCA Master Catalog |
| **Spacecraft design** | Habitat, Yükselme Aracı (MAV), Rover, Sera, Yalıtım ve Güç modülü seçimi | Sol 0 Ekran 3 | NSSDCA, SST SoA |
| **Scientific instruments** | 9 aletten en fazla 5 seçim; her alet spesifik bir oynanış kilidi açar | Sol 0 Ekran 4 | NSSDCA (Perseverance / InSight) |
| **Launch vehicles** | 3 roket seçeneği: Kütle kapasitesi (kg), maliyet ($) ve $\Delta v$ sınırı | Sol 0 Ekran 2 | NASA ELV Performance |
| **Budgets** | `$` Bütçe, Kütle (`kg`), Güç (`W`) ve Veri (`Mbit/sol`) bütçe çubukları | Tüm Sol 0 + HUD | Gerçek görev maliyetleriyle kalibre |
| **Power** | $P = S \cdot A \cdot \eta \cdot \cos Z \cdot (1 - d_{\text{toz}})$; Batarya (20/40/60 kWh); RTG/RHU | HUD Enerji Çubuğu + Güç Paneli | Planetary Fact Sheet, SST SoA |
| **Mass** | Roket kapasitesine karşı canlı kütle çubuğu + `%10` kütle marjı bonusu | Sol 0 Tüm Ekranlar | NASA ELV Performance |
| **Communication** | Veri bütçesi (`Mbit/sol`), MRO/MAVEN röle geçişleri, ışık gecikmesi, kavuşum karartması | HUD Downlink Sekmesi | DSN Now, JPL Horizons |
| **Orbit constraints** | Fırlatma penceresi (26 ay), Hohmann (~8 ay) vs. Hızlı (~6 ay) transfer, MAV yörünge kenetlenmesi | Sol 0 Ekran 2 + Sol 14 | Trajectory Browser, JPL Horizons |
| **Concept → Operation** | Sol 0 tasarım kararlarının Sol 1–14 yüzey operasyonunu doğrudan şekillendirmesi | Tüm Oyun Akışı | — |
| **Evaluate how choices shape success** | `decisionLog[]` tabanlı Neden-Sonuç Karnesi + Gerçek NASA görevleriyle karşılaştırma | Final Karne Ekranı | NSSDCA Görev Arşivleri |

---

## 🚀 Hızlı Başlangıç ve Çalıştırma

Proje sıfır kurulum karmaşasıyla tarayıcıda doğrudan çalışacak şekilde tasarlanmıştır:

```bash
# Yerel geliştirme sunucusunu başlatmak için:
npx serve .
# veya Python ile:
python -m http.server 8080

# Veri paketini derleyip tüm testleri çalıştırmak için:
npm test
```

* **Normal Oyun Modu:** `http://localhost:8080/`
* **Jüri Hızlı Görev / Demo Modu (5 Sol / 3 Dakika):** `http://localhost:8080/?demo=1`
* **Dil Seçeneği:** Oyun içi sağ üst köşeden **TR / EN** anlık dil geçişi desteklenir.

---

## 📁 Dokümantasyon Haritası

* [AGENTS.md](AGENTS.md) — 6 Kişilik (`K1–K6`) ekip rolleri, dosya sahipliği ve AI ajan çalışma protokolleri
* [RULES.md](RULES.md) — Bilimsel doğruluk kuralları, kod standartları, görsel/ses kısıtları ve Git kuralları
* [REQUIREMENTS.md](REQUIREMENTS.md) — Fonksiyonel (M1–M9), bilimsel ve NASA Space Apps teslim gereksinimleri
* [PLAN.md](PLAN.md) — 30 saatlik (`S0–S30`) geliştirme takvimi, kilometre taşları, kesim kararları ve adım adım uygulama sırası
* [ARCHITECTURE.md](ARCHITECTURE.md) — Teknik mimari, merkezi `gameState`, olay veri yolu (`bus`), klasör yapısı ve varlık eşlemesi
* [DESIGN.md](DESIGN.md) — 16-bit Pixel Art görsel tasarım, renk paleti, UI/HUD düzeni, ses ve sahne akışları
* [API.md](API.md) — `engineering.js` formülleri, `gameState` şeması, mini-oyun sözleşmesi ve JSON veri şemaları
* [TESTING.md](TESTING.md) — `node --test` doğrulama testleri, QA senaryoları, debug konsolu ve Bitti Tanımı (DoD)
* [DEPLOYMENT.md](DEPLOYMENT.md) — GitHub Pages yayını, `?demo` modu ve Space Apps global teslim kontrol listesi
* [CONTRIBUTING.md](CONTRIBUTING.md) — Katkı rehberi, commit mesaj şablonları ve modül sınırları
* [SECURITY.md](SECURITY.md) — Güvenlik, telif/lisans (`CC0`) uyumluluğu ve istemci tarafı veri güvenliği
* [CHANGELOG.md](CHANGELOG.md) — Tasarım v1'den v2'ye geçiş ve sürüm geçmişi
* [docs/decisions/0001-teknik-karar.md](docs/decisions/0001-teknik-karar.md) — ADR 0001: Vanilla ES Modules + HTML5 Canvas + DOM/CSS UI ve Tekil `gameState` Mimari Kararı

---

## ⚖️ Lisans ve Beyanlar

* **Görsel ve Ses Varlıkları:** Tüm 16-bit pixel art görseller projeye özel üretilmiştir; ses efektleri `CC0` (kamu malı) lisanslıdır veya Web Audio API ile prosedürel sentezlenir. Hiçbir telifli film/oyun materyali veya resmi NASA logosu izinsiz kullanılmamıştır.
* **Bilimsel Kurgu Notu:** Oyun sonundaki ~40 saniyelik *UFO Stinger* sahnesi, Viking 1976 *"Mars'taki Yüz"* (Pareidolia) olayına atıfta bulunan ve kamera çözünürlüğü ile veri bant genişliğinin bilimsel keşifteki rolünü vurgulayan sanatsal bir kurgudur.
