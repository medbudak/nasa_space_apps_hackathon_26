# CHANGELOG.md — Sürüm ve Tasarım Geçmişi

Bu dosya, **SOL 14: RED HORIZON** projesinin ilk GDD taslağından (`v1`) NASA Space Apps Challenge gereksinimlerini eksiksiz karşılayan **Oyun Tasarımı v2** mimarisine geçişini ve geliştirme adımlarını kayıt altına alır.

---

## [v2.0.0] — 2026-11-14 (Oyun Tasarımı v2 & Tam Uygulama)

### ✨ Eklenenler (Added)
- **Sol 0 Görev Tasarım Konsolu (5 Ekran):** Görev hedefi seçimi, 3 roket × 2 yörünge (`Hohmann ~8 ay` vs. `Hızlı ~6 ay`), 26 aylık fırlatma penceresi, 3 iniş bölgesi (`Meridiani`, `Jezero`, `Arcadia`), 9 gerçek NASA bilimsel aletinden en fazla 5'inin seçimi, iletişim mimarisi (`UHF Röle` vs. `X-band`) ve Tek Nokta Arıza (`SPOF` - `M8`) uyarı sistemi eklendi.
- **M1 — Veri Bütçesi ve Downlink Kuyruğu (`Mbit/sol`):** Çekilen enkaz fotoğraflarının, adli raporların ve deney sonuçlarının puana dönüşmesi için `MRO`/`MAVEN` röle geçişlerinde Dünya'ya gönderilmesi mekaniği eklendi.
- **M2 — Kriz Karar Kartları ve `decisionLog[]`:** Her krizde 2–3 seçenek ve kesin sayısal bedelleri gösteren karar kartı sistemi eklendi.
- **M3 — Güç Yük Önceliklendirme Paneli (Load Shedding):** Yaşam desteği, ısıtma, sera, MOXIE, deneyler ve iletişim sırasını dinamik değiştirme ve otomatik yük kesme mekaniği eklendi.
- **M4 — Dönüşsüzlük Noktası Göstergesi (Point of No Return):** EVA sırasında $\text{O}_2$ çubuğu üzerinde anlık $O_{2,\text{gerekli}}$ kırmızı çentiği ve eklem donması (`%40` hız) entegrasyonu eklendi.
- **M5 — Neden-Sonuç Karnesi (Cause-and-Effect Report Card):** Oyun sonunda her tasarım ve operasyon kararının görev başarısını nasıl şekillendirdiğini gösteren karne ve gerçek NASA görevleriyle karşılaştırma tablosu eklendi.
- **M7 & M9 — Gecikmeli Görev Kontrol ve `?demo` Hızlı Görev Modu:** Gerçek ışık gecikmesi ($3\text{–}22\text{ dk}$) simülasyonu ve jüri için `5 Sol` hızlı oynanış modu eklendi.
- **Ana Görev 1 (5 Kayıp Araç Adli İncelemesi):** `Opportunity`, `Spirit`, `Phoenix`, `InSight` ve bonus `Beagle 2` için 3 kanıt toplama, 5 arıza kategorisinden teşhis koyma, parça sökme ve NASA bulgu kartları eklendi.
- **Ana Görev 2 (6 Bilimsel Deney):** Hipotez → Ortam → Kontrol Grubu → Ölçüm → Sonuç döngüsüyle çalışan 6 deney (*Sarkaç, Serbest Düşüş, Tohum Çimlenmesi, Suyun Kaynaması, Ses Hızı, MOXIE Verimi*) eklendi.
- **UFO Stinger Finali (~40 sn):** Kamera çözünürlüğü (`Mastcam-Z` vs. el kamerası) ve kalan veri bütçesine göre `%80` net veya `%30` bulanık satır-satır inen telemetri fotoğrafı ve Güneş Kavuşumu (`Solar Conjunction`) kapanışı eklendi.
- **Görsel Kütüphane:** 32 adet 16-bit Pixel Art görsel varlığı `assets/` klasörlerine eşlendi ve `#FFFFFF` beyaz arka planlar için Flood-Fill Chroma-Key şeffaflaştırma eklendi.

### 🔬 Bilimsel Düzeltmeler (Scientific Validity Fixes)
- Mars gece sıcaklığı `-60 °C` ortalamadan gerçek ekvator/orta enlem gece değeri olan **`-80 °C`**'ye güncellendi.
- Bilimsel olarak hatalı olan *"Mars'ta sıcak hava dalgası"* ifadesi, ince atmosferde (`~0.6 kPa`) **"Isı Atma / Radyatör Tıkanması Arızası"** olarak düzeltildi.
- *"Şiddetli depremde boşlukta savrulma"* ifadesi, InSight verilerine uygun olarak **`~M4.7` sarsıntı + yakın meteor çarpması ve rafların devrilmesi (`0.38g`)** olarak düzeltildi.
- *"Radyoaktif izotoptan yakıt sentezi"* ifadesi, **RHU ısısı + Sabatier Reaktörü ($\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$)** olarak düzeltildi.
- *"14 Sol'da patates/domates hasadı"* ifadesi, **Tohum Çimlenme Oranı ve Perklorat Yıkama Deneyi** olarak düzeltildi.
