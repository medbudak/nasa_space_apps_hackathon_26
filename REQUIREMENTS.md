# REQUIREMENTS.md — Fonksiyonel, Bilimsel ve Teslim Gereksinimleri

Bu belge, **SOL 14: RED HORIZON** oyununun karşılaması gereken tüm fonksiyonel mekanikleri, bilimsel simülasyon gereksinimlerini ve NASA Space Apps Challenge global/yerel jüri teslim kriterlerini tanımlar.

---

## 1. Sol 0: Görev Tasarım Ekranı Gereksinimleri (5 Ekran)

Oyuncu göreve başlamadan önce **Bütçe (`$`), Kütle (`kg`), Güç (`W`) ve Veri (`Mbit/sol`)** kısıtları altında 5 adımlı bir mühendislik tasarımı yapar. Herhangi bir limit aşılırsa **"Fırlat"** butonu kilitlenir (veya uyarı verir) ve yedeksiz kritik sistemler **Tek Nokta Arıza (`SPOF` - M8)** uyarısıyla sarı yanar.

| Ekran | Karar Noktası | Seçenekler | Mühendislik Takası (Trade-off) |
| :---: | :--- | :--- | :--- |
| **1** | **Görev Hedefi** | Adli Ağırlıklı / Deney Ağırlıklı / Dengeli | Puan çarpanlarını ve NASA tarzı **Asgari Başarı** / **Tam Başarı** kriterlerini belirler. |
| **2** | **Roket + Yörünge** | 3 Roket (`Falcon Heavy` / `Vulcan Centaur` / `SLS Block 1B` sınıfı) × 2 Yörünge (`Hohmann ~8 ay` / `Hızlı Transfer ~6 ay`) | Hızlı yörünge daha az radyasyon dozu ve sarf malzemesi harcar, ancak daha fazla $\Delta v$ yakıtı gerektirdiği için faydalı yük (`payload kg`) kapasitesini düşürür. |
| **2** | **Fırlatma Penceresi** | Pencereyi Yakala (26 ayda bir hizalanma) / Ertele | Pencereyi kaçırmak/ertelemek bekleme (tutma) maliyeti nedeniyle başlangıç bütçesini (`$`) eritir. |
| **3** | **İniş Bölgesi** | **Ekvator** (`Meridiani Planum`) / **Jezero Krateri** (`18°K`) / **Orta Enlem** (`Arcadia Planitia, ~40°K`) | *Ekvator:* Çok güneş, nispeten ılık, az buz. *Orta Enlem:* Bol yüzey altı buzu, çok soğuk, kısa gün. *Jezero:* Dengeli + Perseverance/Ingenuity enkazlarına yakın. |
| **3** | **Enerji, Batarya & Yalıtım** | **Güç:** Güneş Paneli / Panel + RTG (`~110 W, ~45 kg`)<br>**Batarya:** `20` / `40` / `60 kWh`<br>**Yalıtım:** İnce / Kalın | RTG fırtınadan ve tozdan etkilenmez ama çok pahalı ve ağırdır. Kalın yalıtım gece ısıtma gücünü yarıya indirir ama kütleyi artırır. |
| **4** | **Bilimsel Aletler** | 9 aletten **en fazla 5'i** seçilebilir | Kütle, bütçe ve güç sınırı oyuncuyu seçim yapmaya zorlar; alınmayan her aletin eksikliği yüzeyde hissedilir. |
| **5** | **İletişim & Yedeklilik** | **İletişim:** Sadece UHF Röle (`MRO/MAVEN`) / Röle + Doğrudan Dünya (`X-band`)<br>**Tamir Kiti:** `0` / `1` / `2`<br>**Kütle Marjı:** `%0–20` | X-band yedekliliği anten arızasında iletişimi korur. Her tamir kiti 1 krizi otomatik çözer. `%10+` kütle marjı karnede mühendislik bonusu verir. |

---

## 2. Bilimsel Aletler Kataloğu (9 Alet)

| # | Alet (Gerçek NASA Karşılığı) | Kütle (`kg`) | Güç (`W`) | Veri (`Mbit`) | Oyunda Açtığı Kilit | Alınmazsa Ne Olur? |
| :-: | :--- | :---: | :---: | :---: | :--- | :--- |
| **1** | **Yüksek Çözünürlüklü Kamera (`Mastcam-Z`)** | ~4.0 | ~17 | 20 Mbit / foto | Enkaz fotoğrafları tam puan, yakınlaştırma, UFO `%80` net foto, Ses hızı deneyi mikrofonu | El kamerası kullanılır: fotoğraflar yarım puan, UFO `%30` bulanık |
| **2** | **Hava İstasyonu (`MEDA`)** | ~5.5 | ~17 | 1 Mbit / sol | Fırtına ve ani soğuk düşüşünü 1 sol önceden uyarır, Su kaynama deneyi | Fırtına ve aşırı soğuk habersiz gelir |
| **3** | **Sismometre (`InSight SEIS`)** | ~30.0 | ~8 | 5 Mbit / sol | Sarsıntı/meteor çarpması erken uyarısı (`30 sn` QTE hazırlık süresi) | Sarsıntı anında vurur, raflar devrilir |
| **4** | **Radyasyon Dedektörü (`RAD`)** | ~1.6 | ~4 | 1 Mbit / sol | Güneş patlaması (`SPE`) erken uyarısı + canlı radyasyon doz göstergesi | Radyasyon dozu gizli kalır; sığınağa geç kalınır |
| **5** | **Yeraltı Radarı (`RIMFAX`)** | ~3.0 | ~10 | 10 Mbit / tarama | Haritada yüzey altı su buzu yataklarını doğrudan gösterir | Buz kör kazıyla aranır (fazla $O_2$ ve süre harcar) |
| **6** | **Spektrometre (`SuperCam / PIXL`)** | ~11.0 | ~18 | 8 Mbit / ölçüm | Toprakta perklorat ölçer, enkaz panelindeki toz kalınlığını ölçer (adli kanıt) | Tohumlar yıkanmamış zehirli toprakta ölebilir, 3. adli kanıt eksik kalır |
| **7** | **Oksijen Üretici (`MOXIE`)** | ~17.0 | ~300 | — | Mars atmosferindeki $\text{CO}_2$'den düzenli $\text{O}_2$ üretir, Deney 6'yı açar | Sadece su elektrolizi + sınırlı yedek tüp kullanılır |
| **8** | **Bitki Büyütme Odası (`Veggie`)** | ~8.0 | ~100 | 2 Mbit / gün | Kontrollü tohum çimlenme deneyleri + besin desteği + akıl sağlığı (`+Sanity`) | Tohum deneyi sadece dış ortamda yapılabilir (başarısız olur) |
| **9** | **Keşif Drone'u (`Ingenuity`)** | ~1.8 | Şarjlı | 15 Mbit / uçuş | Uzaktaki enkazları ve güvenli rotayı havadan keşfeder, kuma saplanmayı önler | Her enkaza yürünmek gerekir ($O_2$ ve eklem donması riski) |

---

## 3. İki Ana Görev Gereksinimleri

### 3.1. Ana Görev 1: Kayıp Araçların Adli İncelemesi (`systems/forensics.js`)
Oyuncu her enkaz için 5 adımlı dedektif döngüsünü tamamlar:
1. **Bul:** Haritada sinyal izi veya `Ingenuity` drone keşfiyle enkaza ulaş.
2. **Kanıt Topla (3 Tip):**
   - *Görsel Kanıt:* Fotoğraf çekimi (panel, tekerlek, anten durumu).
   - *Kara Kutu Telemetrisi:* Kablo mini-oyunuyla son telemetri kaydını okuma (güç, sıcaklık, optik derinlik $\tau$).
   - *Çevre Ölçümü:* Spektrometre/sensör ile toz kalınlığı ve eğim açısı ölçümü.
3. **Teşhis Et:** 5 arıza kategorisinden birini seç (`Güç/Toz`, `Termal`, `Mekanik`, `Yazılım/Sensör`, `İletişim`).
4. **Rapor Gönder:** Downlink kuyruğundan Dünya'ya gönder (`Mbit` harcar; gönderilmeyen rapor `0` puandır).
5. **Ders Al & Parça Sök:** Gerçek NASA/ESA bulgu kartı açılır, oyuncuya operasyonel ders verir ve sökülebilir parça envantere eklenir.

* **Vaka Listesi (4 Zorunlu + 1 Bonus):**
  1. **Opportunity** (*Haziran 2018* — Küresel toz fırtınası $\tau \approx 10.8$ → `Güç/Toz` → Sökülebilir: `8 adet RHU`).
  2. **Spirit** (*Mart 2010* — Yumuşak kuma saplandı, kış güneşine dönemedi → `Mekanik + Termal` → Sökülebilir: `8 adet RHU, Tekerlek`).
  3. **Phoenix** (*Kasım 2008* — Kutup kışı $\text{CO}_2$ buzu güneş panelini kırdı → `Termal` → Sökülebilir: `Robot Kol Parçası`).
  4. **InSight** (*Aralık 2022* — Paneller tozla kaplandı, güç tükendi → `Güç/Toz` → Sökülebilir: `SEIS Sismometresi`).
  5. **Bonus: Beagle 2** (*2003 / 2015 MRO* — Paneller tam açılmadı, anteni kapattı → `İletişim + Mekanik` → Sökülebilir: `Yedek Anten`).

### 3.2. Ana Görev 2: Deney Sistemi (`systems/experiments.js`)
Her deney 6 adımlı bilimsel yöntem döngüsünü izler: **Hipotez Seç (3 şıklı) → Ortam Seç (Habitat İçi vs. Dış Ortam) → Kontrol Grubu Ekle (+%50 puan) → Çalıştır → Ölç (Mini-Oyun) → Sonuç Kartı & Downlink**.
1. **Sarkaçla Yerçekimi Ölçümü (Tutorial):** 10 salınım süresi → $T = 2\pi\sqrt{L/g} \rightarrow g \approx 3.71\text{ m/s}^2$ (Dünya periyodunun `~1.63` katı).
2. **Serbest Düşüş / Zıplama (Tutorial):** 2 m'den düşüş süresi $t = \sqrt{2h/g} \approx 1.04\text{ s}$ (Dünya'da `~0.64 s`); `0.38g` zıplama yüksekliği `~2.6` kat.
3. **Tohum Çimlenmesi (3 Grup):** Yıkanmamış regolit (perklorat toksik) vs. yıkanmış + gübreli regolit (habitatta çimlenir) vs. dış ortam (`~0.6 kPa` basınçta ölür). *Ödül: Sera verimi `+%30`.*
4. **Suyun Kaynaması (Üçlü Nokta):** Dış ortama konan su düşük basınç (`~0.6 kPa`) nedeniyle üçlü noktada aynı anda kaynar ve donar. *Ödül: Buzu dışarıda eritme hatasından korunma.*
5. **Ses Hızı:** El çırpma + 50 m mikrofon gecikmesi → $\text{CO}_2$ atmosferinde `~240 m/s` (Dünya'da `~343 m/s`).
6. **MOXIE Gece vs. Gündüz Verimi:** Soğuk ve yoğun gece atmosferinde $\text{O}_2$ üretim verimi farkı (`~6–12 g/saat`). *Ödül: MOXIE'yi verimli saatte çalıştırma.*

---

## 4. Zorunlu ve Ek Oyun Mekanikleri (`M1–M9`)

| Kod | Mekanik Adı | Öncelik | Açıklama |
| :-: | :--- | :---: | :--- |
| **M1** | **Veri Bütçesi / Downlink Kuyruğu** | **Zorunlu (P1)** | Her solda 2 röle geçişi (`MRO`, `MAVEN`) ve sınırlı `Mbit`. Fotoğraf, deney, adli rapor ve aile mesajı kuyruğa dizilir; gönderilmeyen veri puan sayılmaz. |
| **M2** | **Karar Kartı + Karar Günlüğü** | **Zorunlu (P1)** | Her kriz 2–3 seçenekli kart olarak açılır; her seçeneğin sayısal bedeli görünür ve seçim `decisionLog[]` dizisine kaydedilir. |
| **M3** | **Güç Yük Önceliklendirme Paneli** | **Zorunlu (P1)** | *Yaşam Desteği, Isıtma, Sera, MOXIE, Deneyler, İletişim* sıralı listesi. Güç yetmediğinde en alttakiler otomatik kapanır (*load shedding*). |
| **M4** | **Dönüşsüzlük Noktası Göstergesi** | **Zorunlu (P1)** | EVA sırasında $\text{O}_2$ çubuğunda habitata dönmek için gereken $O_{2,\text{gerekli}}$ kırmızı çentiği; eklem donunca hız düşer ve çentik sağa kayar. |
| **M5** | **Neden-Sonuç Karnesi** | **Zorunlu (P1)** | Oyun sonunda `decisionLog[]` üzerinden en etkili kararların sonuç zincirini ve gerçek NASA görevleriyle karşılaştırmasını gösterir. |
| **M6** | **Sol Planlama Özeti** | İsteğe Bağlı | Gün geçişlerinde (`SOL X → SOL X+1`) mavi gün batımı ve enerji/telemetri özeti. |
| **M7** | **Gecikmeli Görev Kontrol** | **Zorunlu (P1)** | Dünya'ya yardım sorulduğunda yanıt $2 \times t_{\text{gecikme}}$ sonra gelir; astronotun otonom karar verme zorunluluğunu yaşatır. |
| **M8** | **Tek Nokta Arıza (SPOF) Uyarısı** | **Zorunlu (P1)** | `Sol 0` tasarım ekranında yedeksiz bırakılan kritik sistemler sarı uyarı verir. |
| **M9** | **Hızlı Görev / `?demo` Modu** | **Zorunlu (P1)** | Jürinin 2–3 dakikada tüm temel döngüyü ve UFO finalini görebileceği `5 Sol` hızlı mod. |

---

## 5. Puanlama, Başarı Eşikleri ve Kayıp Koşulları

* **Görev Başarı Puanı (GBP) Formülü:**
  $$\text{GBP} = \text{Adli Raporlar (Downlink)} + \text{Deney Sonuçları (Downlink)} + \text{Hayatta Kalma Puanı} + \text{Kütle Marjı Bonusu} - \text{Kaybedilen Sistem Cezası}$$
* **Asgari Başarı Eşiği (Minimum Mission Success):** En az **2 Adli Rapor + 2 Deney Sonucu** Dünya'ya gönderildi.
* **Tam Başarı Eşiği (Full Mission Success):** En az **4 Adli Rapor + 4 Deney Sonucu** Dünya'ya gönderildi **ve** `Sol 14` sonunda MAV ile sağ dönüş gerçekleştirildi.
* **4 Kayıp Koşulu (Game Over — Karne Yine Gösterilir):**
  1. Oksijen ($\text{O}_2$) seviyesinin sıfırlanması.
  2. Vücut/elbise ısısının kritik eşiğin altında 2 oyun saati kalması (hipotermi).
  3. Kümülatif radyasyon dozunun görev limitini aşması.
  4. Akıl sağlığının (`Sanity`) sıfırlanması (Görev Kontrol görevi iptal eder).

---

## 6. NASA Space Apps Teslim Gereksinimleri

* **Dil Desteği:** Oyun içi tam `TR / EN` dil geçişi; proje sayfası, 7 slayt ve demo videosu altyazıları tamamen **İngilizce**.
* **Global Demo Formatı:** En fazla **30 saniyelik video** (İngilizce altyazılı) veya en fazla **7 slayt**.
* **Açık Kaynak ve Canlı Link:** GitHub Pages üzerinde doğrudan çalışan link + açık kaynak GitHub deposu.
* **Şeffaflık Beyanları:** Kullanılan tüm NASA veri kaynaklarının (`NSSDCA`, `Planetary Fact Sheet`, `ELV`, `Horizons`, `DSN`) linkleri, AI görsel üretim beyanı ve *"UFO sahnesi kurgudur"* notu.
