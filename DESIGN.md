# DESIGN.md — Sanat Yönetimi, UI/UX Düzeni ve Oyun Tasarım Detayları

Bu belge, **SOL 14: RED HORIZON** oyununun 2D 16-bit Pixel Art görsel dilini, bilimsel renk paletini, ekran düzenlerini (UI/HUD) ve UFO Stinger sahnesinin storyboard akışını tanımlar.

---

## 1. Sanat Stili ve Bilimsel Renk Paleti (`K4`)

Oyun, 90'ların klasik bilimkurgu macera oyunlarından (*Another World, The Dig, Starflight*) ilham alan **2D 16-Bit Pixel Art** estetiğine sahiptir. Mars'ın gerçek atmosferik optiği renk paletine doğrudan yansıtılmıştır:

| Renk Adı | Hex Kodu | Kullanım Alanı ve Bilimsel Karşılığı |
| :--- | :---: | :--- |
| **Mars Pas Kırmızısı (Rust Red)** | `#B84A27` | Demir oksit ($\text{Fe}_2\text{O}_3$) açısından zengin yüzey regoliti ve kanyon kayalıkları |
| **Tozlu Kehribar (Dusty Amber)** | `#E08E55` | Gündüz atmosferde asılı kalan mikron boyutlu tozların oluşturduğu gökyüzü rengi |
| **Mars Gün Batımı Mavisi (Blue Sunset)** | `#5B9BD5` | Mars'ta güneş batarken ince tozun mavi ışığı ileri saçmasıyla oluşan gerçek mavi hale |
| **Kutup Gece Laciverti (Deep Martian Night)** | `#0B1021` | `~0.6 kPa` ince atmosferde gece gökyüzü, Phobos ve Deimos gözlemi |
| **Vizör Buz Camgöbeği (Cryo Cyan)** | `#8BE9FD` | `-80 °C` gece soğuğunda kask vizöründe ve serada oluşan buz kristalleri |
| **Telemetri Yeşili (Terminal Ok)** | `#3FB950` | Normal çalışan yaşam desteği, temiz güneş paneli ve sağlıklı sera göstergeleri |
| **SPOF / Uyarı Sarısı (Caution Amber)** | `#D29922` | Yedeksiz kritik sistem (`M8`), tozlanan panel veya orta seviye risk |
| **Kritik Alarm Kırmızısı (Alert Red)** | `#F85149` | Dönüşsüzlük noktası aşımı (`M4`), $\text{O}_2$ kritik seviyesi, radyatör/fırtına krizi |

* **Izgara ve Ölçek:** Tüm karakter ve enkaz sprite'ları `48×48` (veya katları) piksel ızgara oranına göre hizalanır ve `image-rendering: pixelated` ile keskin çizilir.

---

## 2. Ekran Tasarımları ve Kullanıcı Arayüzü (`K3`)

### 2.1. Sol 0: Görev Tasarım Konsolu (5 Adımlı Mühendislik Ekranı)
* **Üst Sabit Bar (4 Bütçe Çubuğu):**
  1. **Bütçe (`$M`):** Seçilen roket, modül ve aletlerin toplam maliyeti.
  2. **Kütle (`kg / Maks kg`):** Roket kapasitesine göre doluluk + `%10` Kütle Marjı güvenlik çizgisi.
  3. **Güç Dengesi (`Üretim W vs. Tüketim W`):** Gece batarya tükenme uyarısı (Örn: `MOXIE 300W + SEIS 8W` seçildiğinde küçük `20 kWh` batarya kırmızı uyarı verir).
  4. **Veri Kapasitesi (`Mbit/sol`):** Röle ve X-band seçimine göre günlük indirme limiti.
* **Merkez Panel:** 5 sekme (*1. Hedef, 2. Roket & Yörünge, 3. İniş Bölgesi & Habitat, 4. Bilimsel Aletler [9'dan 5], 5. İletişim & Yedeklilik*).
* **Sağ Panel (Canlı Risk ve SPOF Analizi - `M8`):** Yedeksiz bırakılan kritik sistemleri sarı uyarı rozetiyle listeler.

### 2.2. Yüzey Operasyon HUD ve Sekmeleri (`Sol 1–14`)
* **Üst Durum Çubuğu (6 Canlı Gösterge + Dönüşsüzlük Çentiği):**
  - `SOL X / 14` ve Saat/Faz (`GÜNDÜZ` / `MAVİ GÜN BATIMI` / `GECE -80°C`).
  - **Oksijen (`O2 %`):** Üzerinde kırmızı **Dönüşsüzlük Noktası (`M4`)** çentiği bulunur.
  - **Enerji (`kWh %`):** Net üretim/tüketim (`+W / -W`) göstergeli.
  - **Elbise/Vücut Isısı (`°C`):** Eklem donması eşiği göstergeli.
  - **Radyasyon (`mSv`) & Akıl Sağlığı (`Sanity %`).**
  - **Veri Kuyruğu (`Mbit/sol`):** Gönderilmeyi bekleyen veri miktarı.
* **Merkez Görünüm (5 Geçişli Operasyon Sekmesi):**
  1. **01 Yüzey & EVA (Canvas):** Parallax Mars zemini, `0.38g` zıplayan/yürüyen astronot, Habitat, Sera, MAV, Güneş Panelleri, MOXIE ve aktif VFX katmanları (fırtına, vizör buzu, toz şeytanı, gölge silüeti).
  2. **02 Keşif Haritası (`scr_map_corridor.png`):** Jezero keşif koridoru üzerinde `Opportunity`, `Spirit`, `Phoenix`, `InSight` ve `Beagle 2` konumları, mesafe (`m`), tahmini $\text{O}_2$ maliyeti, `Ingenuity` drone uçuşu ve Adli İnceleme modalı.
  3. **03 Sera & Yaşam Desteği:** Sağlıklı/donmuş sera durumu, su elektrolizi ve Sabatier yakıt üretimi.
  4. **04 Deney Masası (`scr_lab_desk.png`):** 6 bilimsel deneyin hipotez, ortam, kontrol grubu ve ölçüm arayüzü.
  5. **05 Downlink Haberleşme Konsolu (`scr_downlink.png` - `M1`) & 06 Güç Yük Paneli (`scr_habitat_cutaway.png` - `M3`):** Toplanan fotoğrafları, adli raporları ve deneyleri `MRO`/`MAVEN` geçişlerinde Dünya'ya gönderme kuyruğu ve sistem öncelik sırasını değiştirme paneli.

---

## 3. Kriz Karar Kartı (`M2`) ve Gecikmeli Görev Kontrol (`M7`)

Bir kriz tetiklendiğinde ekranın ortasında retro-terminalli **Kriz Kartı** açılır:
* **Üst Kısım:** Kriz başlığı, bilimsel açıklaması ve mevcut kritik kaynak durumu.
* **Seçenekler (`A / B / C`):** Her seçeneğin altında **kesin sayısal bedeli** (`-15 kWh Enerji`, `-12% O2`, `+1 Sol gecikme`, `Sera kapanır` vb.) açıkça yazar.
* **"Görev Kontrol'e Danış" Butonu (`M7`):** O anki Dünya-Mars mesafesine göre gerçek tek yön ışık gecikmesini ($t_{\text{gecikme}} \approx 3\text{–}22\text{ dk}$) gösterir; danışıldığında çift yönlü gecikme süresi kadar oyun saati/kaynak harcanır ve önerilen mühendislik tavsiyesi açılır.

---

## 4. UFO Stinger Finali Storyboard Akışı (~40 Saniye)

Oyun bittiğinde (veya `Sol 14` MAV kalkışında) karne öncesinde/sonrasında ~40 saniyelik sinematik sahne oynar:

```carousel
### Sahne 1: Kalkış (0–10 sn)
* **Görsel:** `assets/ending/ufo_liftoff.png`
* **Aksiyon:** Mars Yükselme Aracı (MAV) motorlarını ateşler; kızıl toz bulutları arasında yüzey uzaklaşır.
<!-- slide -->
### Sahne 2: Ufuktaki Anomali (10–18 sn)
* **Görsel:** `assets/ending/ufo_sky.png`
* **Aksiyon:** Alacakaranlık gökyüzünde parlak bir ışık MAV'a paralel yükselir ve fiziğe aykırı keskin bir açıyla sabitlenir. Kokpit kamerası otomatik fotoğraf çeker.
* **HUD:** `"Görüntü Dünya'ya 14 dk 22 sn içinde ulaşacak (JPL Horizons Işık Gecikmesi)"`
<!-- slide -->
### Sahne 3: Satır Satır İndirme (18–30 sn)
* **Görsel:** `ufo_photo_clear.png` (`%80`) veya `ufo_photo_blur.png` (`%30`)
* **Aksiyon:** Dünya Görev Kontrol ekranında fotoğraf gerçek rover telemetrisi gibi yukarıdan aşağıya **satır satır (scanline)** iner:
  - `Mastcam-Z` + Yeterli Veri Bütçesi → **`%80` net** iner (üçgen-disk metalik silüet seçilir).
  - El Kamerası veya Düşük Veri Bütçesi → **`%30` bulanık** iner (pikselli ışık lekesi).
<!-- slide -->
### Sahne 4: Güneş Kavuşumu ve Kapanış (30–40 sn)
* **Aksiyon:** İndirme çubuğu `%X`'te aniden kırmızıya döner ve durur; ışık 3 kez yanıp söner.
* **Uyarı:** `"GÜNEŞ KAVUŞUMU (SOLAR CONJUNCTION) — SİNYAL KESİLDİ"`
* **Analist Notu:** *"Pareidolia olabilir (Viking 1976). Doğrulamak için daha yüksek bant genişlikli yeni bir görev gerekiyor."*
* **Buton:** `"Neden-Sonuç Karnesini Gör / Sonraki Görevi Sen Tasarla"`
````
