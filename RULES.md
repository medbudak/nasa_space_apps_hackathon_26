# RULES.md — Proje Kuralları, Bilimsel Doğruluk ve Kod Standartları

Bu belge, **SOL 14: RED HORIZON** geliştirilirken uyulması zorunlu olan bilimsel doğruluk düzeltmelerini, teknik kuralları, görsel/sanat standartlarını ve takım işleyiş ilkelerini içerir.

---

## 1. Bilimsel Doğruluk Kuralları (Jüri "Validity" Kriteri)

NASA Space Apps jürisinin **Validity (Bilimsel Geçerlilik)** puanını en üst düzeye çıkarmak için aşağıdaki 6 bilimsel kural ve düzeltme kesinlikle uygulanır:

1. **Mars Gece Sıcaklığı (`-80 °C`):**
   - `-60 °C` Mars'ın küresel ortalama sıcaklığıdır; ekvator ve orta enlemlerde gece sıcaklığı **`-80 °C` ve altına** iner, gündüz ise ekvator yakınında **`+20 °C`**'ye kadar çıkabilir. Gece-gündüz sıcaklık farkı `70–100 °C` olarak modellenir.
2. **"Sıcak Hava" Yerine "Isı Atma (Radyatör) Arızası":**
   - Mars'ta bunaltıcı "sıcak hava dalgası" olamaz çünkü atmosfer çok incedir (`~0.6 kPa`, Dünya'nın `%1`'inden az). Bunun yerine ince atmosferde konveksiyonla soğutma yapılamadığı için **"Radyatör Tıkanması / Elektronik ve Habitat Isı Atma Arızası"** kurgulanır.
3. **"Şiddetli Deprem ve Boşlukta Savrulma" Yerine "Orta Şiddette Sarsıntı + Heyelan":**
   - InSight'ın kaydettiği en büyük Mars depremi (Marsquake) **`~M4.7`** büyüklüğündedir ve Mars'ta **`0.38g` (`3.71 m/s²`)** yerçekimi vardır; astronot boşlukta savrulmaz. Olay **"Yakın Meteor Çarpması + M4.7 Sarsıntı / Rafların Devrilmesi ve Denge Kaybı"** olarak kurgulanır.
4. **"Radyoaktif İzotoptan Yakıt Sentezi" Yerine "RHU Isısı + Sabatier Reaktörü (ISRU)":**
   - Radyoaktif izotop (`Pu-238`) kimyasal yakıt üretmez; yalnızca **RTG** (elektrik + ısı) veya **RHU** (`1 W` radyoizotop ısıtıcı ünite) olarak kullanılır. Dönüş yakıtı üretimi (ISRU), **Sabatier Reaksiyonu** ($\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$) ve su elektrolizi ile modellenir.
5. **14 Sol'da "Sebze Hasadı" Yerine "Tohum Çimlenme ve Büyüme Oranı Deneyi":**
   - Patates ve domates 14 Sol içinde hasat vermez (aylar sürer). Sera modülünde tam hasat yerine **Tohum Çimlenme Oranı, Kök Yönelimi (0.38g) ve Perklorat Yıkama Deneyi** yapılır; başarılı deney seradaki mevcut hidroponik filizlerden besin desteği ve akıl sağlığı (`+Sanity`) bonusu sağlar.
6. **Gerçek İletişim ve Yörünge Kısıtları:**
   - Dünya-Mars tek yön ışık gecikmesi yörünge konumuna göre **`~3 ile 22 dakika`** arasındadır.
   - Güneş Kavuşumu (**Solar Conjunction**) sırasında Güneş, Dünya ile Mars arasına girer ve veri iletişimi tamamen kesilir.
   - Mars'ta gün batımı Rayleigh/toz saçılımı nedeniyle **mavidir**, gündüz gökyüzü ise pas/kehribar rengindedir.

---

## 2. Kod ve Mimari Kuralları

1. **Tek Dosya Sahipliği:** Her geliştirici/ajan yalnızca `AGENTS.md` içinde kendisine atanan dosyaları düzenler.
2. **Merkezi `gameState`:** Oyun durumu yalnızca `src/core/state.js` içinde tutulur; `localStorage` kayıt/yükleme işlemleri tek noktadan yapılır.
3. **Veri Kaynağı Zorunluluğu (`src` Alanı):** `data/nasa_data.json` içindeki her sayısal değerin yanında mutlaka doğrulandığı resmi NASA/ESA kaynağını belirten bir `src` alanı bulunmalıdır (Örn: `"src": "https://nssdc.gsfc.nasa.gov/..."`).
4. **Çift Dilli Metin (`TR` / `EN`):** Kod içinde sabit Türkçe veya İngilizce kullanıcı metni bulunamaz. Tüm metinler `content/story.json` içinde hem `tr` hem `en` anahtarlarıyla yer almalı ve `t('key')` fonksiyonuyla çağrılmalıdır.
5. **Birim Test Zorunluluğu:** `src/core/engineering.js` içindeki tüm fizik ve mühendislik formülleri (`calcSolarPower`, `calcDeltaV`, `calcLightDelay`, `calcPendulumPeriod`, `calcPointOfNoReturnO2`) `node --test tests/` ile otomatik test edilmelidir.
6. **Hata Toleransı (Fail-Safe):** Eksik bir ses dosyası (`404`) veya tamamlanmamış bir mini-oyun asla ana oyun döngüsünü kilitlememelidir. Her mini-oyunda bir kaçış/iptal (`ESC`) yolu bulunmalıdır.

---

## 3. Görsel ve Sanat Kuralları (`K4`)

1. **16-Bit Pixel Art Stili:** Tüm görseller `image-rendering: pixelated` CSS/Canvas ayarıyla keskin piksellerle çizilir; bulanık (bilinear) ölçekleme kapalıdır.
2. **HUD ve Metin Yasağı (Asset İçi):** Arka plan ve ekran görsellerinin (`assets/backgrounds/`, `assets/screens/`) içinde çizilmiş sabit yazı veya HUD çubuğu bulunmaz; tüm arayüz `K3` tarafından HTML/CSS veya Canvas katmanı olarak dinamik bindirilir.
3. **Beyaz Zemin Şeffaflığı (`#FFFFFF` Chroma-Key):** İzole üretilen sprite ve yapı görsellerinin (`assets/sprites/`, `assets/structures/`) saf beyaz (`#FFFFFF`) arka planları yükleme anında otomatik olarak şeffaf (`alpha = 0`) hale getirilir.
4. **Telif ve Özgünlük:** Hiçbir ticari film/oyun karakteri veya resmi NASA etüd logosu (Meatball/Worm) izinsiz kopyalanmaz. UFO sahnesinde klasik film uçan dairesi yerine bilimsel sensör anomalisi (parlak ışık + açısal iz) kullanılır.

---

## 4. Süreç, Git ve Kapsam Kuralları

1. **Saatlik Senkronizasyon:** Ekip çalışmasında her saat başı `git pull --rebase` yapılır; küçük ve anlamlı commit'ler atılır (`[K2] feat: dönüşsüzlük noktası O2 hesabı eklendi`).
2. **Takılma Kuralı (15–20 Dakika):** Bir soruna 20 dakikadan fazla tek başına takılan kişi/ajan sorunu blokaj olarak bildirir ve alternatif çözüme geçer.
3. **İçerik ve Özellik Kilidi:**
   - **S20 (İçerik Kilidi):** Yeni metin veya yeni mekanik eklenmez.
   - **S24 (Özellik Dondurma / Feature Freeze):** Yalnızca hata düzeltmesi (bug fix) yapılır.
4. **UFO Sahnesi Beyanı:** Proje sayfasında ve oyun sonunda UFO sahnesinin *Viking 1976 Pareidolia* olayından esinlenen bir kurgu olduğu açıkça belirtilir.
