# ADR 0001: Vanilla ES Modules + HTML5 Canvas + Tekil `gameState` Mimari Kararı

* **Durum:** Kabul Edildi (Accepted)
* **Tarih:** 14 Kasım 2026
* **Karar Vericiler:** K1 (Lider/Sistem), K2 (Simülasyon), K3 (UI), K4 (Pixel Art/VFX), K5 (Bilim/Senaryo), K6 (Adli/Deney/QA)

---

## 1. Bağlam ve Problem Tanımı

**SOL 14: RED HORIZON**, NASA Space Apps Challenge kapsamında 30 saat içinde 6 kişilik bir ekip tarafından geliştirilen, yoğun mühendislik hesaplamaları ($P, \Delta v, t_{\text{gecikme}}, T, O_{2,\text{gerekli}}$), 5 adımlı görev tasarım ekranı (`Sol 0`), 2D 16-bit Pixel Art yüzey simülasyonu, 5 kayıp araç adli incelemesi, 6 bilimsel deney, 4 mini-oyun ve Neden-Sonuç Karnesi içeren kapsamlı bir uzay görevi tasarım oyunudur.

Takımın aynı anda çakışmadan kod yazabilmesi, birim testlerinin (`node --test`) doğrudan çalışabilmesi ve jürinin tek bir GitHub Pages bağlantısıyla oyunu anında açabilmesi gerekmektedir.

---

## 2. Değerlendirilen Seçenekler

1. **Seçenek A: Oyun Motoru (Godot / Unity WebGL)**
   - *Artıları:* Yerleşik sahne editörü.
   - *Eksileri:* 30 saatlik sürede 6 kişinin binary sahne dosyalarında merge çakışması yaşaması kaçınılmaz; WebGL çıktısı ağır ve tablo/formül ağırlıklı mühendislik arayüzleri (`Sol 0`, Downlink kuyruğu, Güç Yük Paneli, Karne) için hantal.
2. **Seçenek B: Ağır Frontend Framework + Bundler (React/Vue + Phaser + Webpack)**
   - *Artıları:* Zengin ekosistem.
   - *Eksileri:* Build/derleme adımı kırılganlığı, Canvas ile sanal DOM arasında çift state senkronizasyonu karmaşası.
3. **Seçenek C (Seçilen): Vanilla JavaScript (ES Modules) + HTML5 Canvas 2D + Modüler DOM/CSS UI + Tekil `gameState`**
   - *Artıları:* Sıfır derleme (zero-build) ile tarayıcıda ve GitHub Pages'de doğrudan çalışır; `engineering.js` ve `state.js` doğrudan `node --test` ile test edilebilir; Canvas 2D üzerinde 16-bit Pixel Art ve `#FFFFFF` beyaz zemin şeffaflaştırma (Chroma-Key) tam kontrol sağlar; zengin mühendislik panelleri (`Sol 0`, Karar Kartları, Downlink, Karne) CSS Grid/Flexbox ile çok hızlı ve erişilebilir şekilde oluşturulur.

---

## 3. Alınan Mimari Kararlar

1. **Vanilla ES Modules + Canvas + DOM Hibrit Yapısı:**
   - Mars yüzey keşfi, `0.38g` astronot hareketi, enkazlar ve atmosferik VFX katmanları (fırtına, vizör buzu, toz şeytanı, UFO kalkışı) **HTML5 Canvas 2D** üzerinde çizilir.
   - `Sol 0` tasarım ekranları, HUD çubukları, Kriz Karar Kartları (`M2`), Downlink Kuyruğu (`M1`), Güç Yük Paneli (`M3`) ve Neden-Sonuç Karnesi (`M5`) Canvas üzerine oturan keskin **Retro Sci-Fi DOM/CSS** katmanlarıyla yönetilir.
2. **Tekil `gameState` ve Olay Veri Yolu (`bus`):**
   - Tüm oyun durumu `src/core/state.js` içinde tek bir JSON-serileştirilebilir nesnede tutulur.
3. **Veri ve Metin Ayrımı (`data/nasa_data.json` & `content/story.json`):**
   - Hiçbir bilimsel sayı veya kullanıcı metni kod içine gömülmez; tüm sayılar `src` kaynak URL'i ile `nasa_data.json` dosyasından, tüm metinler ise `TR/EN` destekli `story.json` dosyasından okunur.
4. **Otomatik Flood-Fill Chroma-Key (`src/fx/sprites.js`):**
   - Saf beyaz (`#FFFFFF`) zemin üzerine üretilmiş 16-bit Pixel Art sprite'lar, kenarlardan içe doğru çalışan Flood-Fill algoritmasıyla çalışma zamanında şeffaflaştırılır; böylece astronotun beyaz uzay giysisi bozulmadan arka plan temizlenir.

---

## 4. Sonuçlar ve Etkiler

* **Olumlu:** `node --test tests/` hiçbir ek kütüphane olmadan milisaniyeler içinde çalışır; GitHub Pages dağıtımı sıfır yapılandırmayla gerçekleşir; 6 kişilik dosya sahipliği (`K1–K6`) birbirini bloklamadan ilerler.
* **Dikkat Edilecek Nokta:** Görsel varlıklar (`PNG`) yerel bir HTTP sunucusu (`npx serve` veya `python -m http.server`) üzerinden açılmalıdır (Canvas `getImageData` CORS güvenliği için; `file://` protokolünde açılırsa otomatik fallback çizimi devreye girer).
