# SOL 14 — Panel Temizleme ve Bitki Sulama Mini Görevleri

Mevcut SOL 14: RED HORIZON projesine iki kısa, etkileşimli bakım mini görevi ekle: mouse ile güneş paneli temizleme ve kök bölgesine elle sulama. Önce mevcut projeyi incele, sonra mevcut mimariyi kullanarak uygula. Kullanıcıdan rutin uygulama kararları için tekrar onay isteme.

## 1. Önce projeyi incele

- AGENTS.md ve mevcut proje kurallarını oku.
- Framework, render motoru, sahne yönetimi, envanter/kaynak sistemi, kayıt sistemi, menüler ve duraklatma mantığını bul.
- Asset klasörünü tara; aşağıdaki dosyaları mevcutsa kullan. Gerçekte bulunmayan dosyaların var olduğunu varsayma.
- Var olan oyun döngüsünü veya UI mimarisini yeniden yazma. Mevcut bileşenleri genişlet.
- Projede farklı asset dizini kullanılıyorsa yolları ona uyarla ve eşlemeyi bildir.

## 2. Deneyim hedefi

Oyuncu kısa bir fiziksel eylem yapmalı, sonucunu anında görmeli ve oyunun sisteminde anlamlı bir iyileşme yaşamalı. Bu bir biyolojik dopamin ölçümü değildir. Süreler test edilecek tasarım hedefleridir.

- Temizleme: yaklaşık 8–15 saniye aktif etkileşim.
- Sulama: yaklaşık 5–10 saniye aktif etkileşim.
- Normal bakımda geri sayım veya başarısızlık baskısı yok.
- Menü açıkken dünya zamanı, kaynak tüketimi ve dış tehditler durur. Mini görev input'u ve görsel animasyonları çalışmaya devam eder.
- Tekrar açıp kapamak fazladan ödül veya ücretsiz kaynak üretmez.
- Her habitat ziyaretinde zorunlu bakım üretme. Bakım ihtiyacı gerçek sistem durumuna bağlı olsun.

## 3. Görsel dosyaları

Aşağıdaki isimler hedef sözleşmedir; varlıkları önce doğrula. Arka plan hariç PNG dosyaları gerçek alpha transparan olmalı. Beyaz/yeşil fon veya çizilmiş dama deseni kabul edilmez.

```text
assets/minigames/
  solar/
    solar_clean_base.png
    solar_dust_overlay.png
    brush_cursor.png
  greenhouse/
    planter_base.png
    soil_dry.png
    soil_wet.png
    lettuce_plant.png
    watering_can.png
  shared/
    maintenance_bg.png
```

### Zorunlu asset teknik sözleşmesi

| Dosya | Boyut | İçerik |
|---|---|---|
| solar_clean_base.png | 1024×640 | Önden görülen temiz dikdörtgen panel, ince metal çerçeve; dışı transparan |
| solar_dust_overlay.png | 1024×640 | Yalnızca panelin hücre alanına oturan turuncu toz; çerçeve ve dışı transparan |
| brush_cursor.png | 128×128 | Tek fırça; kıllar alt tarafta, temas noktası yaklaşık (64,104); transparan |
| planter_base.png | 512×512 | Beyaz-gri, turuncu detaylı yetiştirme kabı; bitki ve toprak yok; transparan |
| soil_dry.png | 512×512 | Kabın üst açıklığına oturan kuru yetiştirme ortamı; başka nesne yok |
| soil_wet.png | 512×512 | Kuru katmanla aynı geometri ve konumda, daha koyu ıslak ortam |
| lettuce_plant.png | 512×512 | Yalnızca marul; kök başlangıcı kabın üst açıklığına hizalı; saksısız, transparan |
| watering_can.png | 256×256 | Tek sulama kabı; ağzı sol alta bakıyor; transparan |
| maintenance_bg.png | 1600×900 | Sade karanlık habitat bakım alanı; merkez boş, yazısız; opak |

Görsellerde UI yazıları, ilerleme çubukları veya butonlar bulunmaz. Bunları kodla çiz. Su akışı, damlalar, toz parçacıkları ve göstergeler kodla oluşturulabilir; ayrı görsel zorunlu değildir.

### Katman ve koordinat kuralları

- Pixel art görünümünü koru; uygun yerlerde image-rendering: pixelated ve filtre kapatma kullan.
- Eşleşen katmanları bağımsız kırpma veya farklı oranlarda ölçekleme.
- Panel tabanı ile toz katmanı aynı tuval, perspektif ve hücre sınırlarını paylaşmalı.
- Önerilen panel aktif alanı kaynak görsel koordinatlarında x=64, y=64, genişlik=896, yükseklik=512. Görsel farklıysa gerçek alanı inceleyip yapılandırmayı değiştir.
- Sera katmanları aynı 512×512 kaynak tuvalini paylaşmalı. Önerilen kabın üst açıklığı x=96–416, y=310–380; bitki kök başlangıcı yaklaşık (256,350).
- Sera çizim sırası: kap → kuru ortam → ıslak ortam → bitki → sulama aracı → su efekti. Görselin ön kenarı için gerekirse maske kullan.
- Mouse noktalarını ekran pikselinden sahne ve kaynak görsel koordinatlarına dönüştür; CSS ölçeği ve devicePixelRatio etkisini dikkate al.

## 4. Panel temizleme uygulaması

1. Görev ekranında gerçek panel durumunu yükle: mevcut kir oranı, üretim ve önceki temizlik ilerlemesi.
2. Temiz panel tabanı üzerine silinebilir toz katmanı koy.
3. Sol tuşa basılı sürükleme, fırça temas alanındaki tozu silsin. Canvas, render texture veya mevcut motorun maske sistemini kullan.
4. Hızlı hareketlerde noktalar arasını örnekle; çizgide boşluk kalmasın.
5. Temizlenen alanı benzersiz alan olarak hesapla. Aynı noktayı tekrar temizlemek ilerlemeyi artırmasın.
6. İlerleme, görev başında temizlenebilir kir alanına göre hesaplanır. Arka plan ve çerçeve üzerinden puan kazanılmaz. Kullanılan maske ile ilerleme ölçümü tutarlı olsun.
7. Yaklaşık %90 temizlikte tamamla; kalan çok küçük lekeleri otomatik temizle. Eşik yapılandırılabilir olsun.
8. Panel üretimini mevcut enerji modelinin kir–verim ilişkisiyle güncelle. Oyunda olmayan sabit enerji ödülü uydurma.
9. Tamamlama etkisi bir kez çalışır: kısa ses/animasyon ve gerçek önce/sonra üretim bilgisi.
10. Tamamlandıktan sonra sonuç görünür kalsın; otomatik kapanma oyuncunun kontrolünü elinden almasın.

Önerilen durumlar: ready → cleaning → completed. Yarıda kapatma, cleaning durumunun ilerlemesini kaydeder. Yeniden açılış bunu geri yükler. Zaten temiz panel için tekrar ödül üretilmez.

## 5. Elle sulama uygulaması

1. Seçilen bitkinin mevcut nemi, hedef nem aralığı ve kullanılabilir suyu yükle.
2. Sulama kabı mouse'u takip etsin. Basılı tutunca ağızdan kök bölgesine su akışı çiz.
3. Su akışının yetiştirme ortamına ulaştığı durumda nem artsın; yaprağa veya boşluğa yapılan hareket ilerleme sayılmasın.
4. İlk sürümde hedef dışındayken akışı ve tüketimi durdur; hedef bölgesini yumuşak vurguyla göster. Gizli su cezası uygulama.
5. Akış zamanı boyunca su tüketimini delta-time ile hesapla. Tüketim ve nem kazanımı aynı işlemde uygulanmalı; ikisi farklı güncellemelerde ayrışmamalı.
6. Kuru ortam üzerine ıslak ortam katmanını kademeli göster. Bitki anında büyümesin veya hasada dönüşmesin.
7. Hedef nem aralığına ulaşınca akışı otomatik durdur. İlk sürümde taşırma cezası yok.
8. Su biterse işlemi durdur ve açıklama göster; nem ve su negatife düşmesin.
9. Ekran yarıda kapatılırsa tüketilmiş su ve mevcut nem korunur. Yeniden açmak suyu geri vermez.
10. Uygun nemdeki bitki için “Sulama gerekmiyor” durumu göster; tekrar ödül verme.

Besin ekleme, hasat, bitki ölümü veya yeni moral sistemi bu iki mini görevin kapsamına dahil değildir. Sulama ve besleme terimlerini birbirinin yerine kullanma.

## 6. Input, erişilebilirlik ve duraklatma

- Mouse ve mümkünse touch için ortak pointer input kullan.
- Pointer capture, pointerup, pointercancel, pencere odağı kaybı ve ekran kapanışında temizleme/sulama eylemini güvenli biçimde durdur.
- Basılı tutmaya alternatif tıkla-başlat/tıkla-durdur modu sun.
- Klavye için hedefler arasında geçiş ve eylem başlat/durdur alternatifi ekle; mevcut erişilebilirlik düzeniyle uyumlu tut.
- ESC kapatır; kısmi ilerleme korunur.
- Menü için tek bool yerine mevcut pause sistemi destekliyorsa pause token/reference-count kullan; başka menü açıkken dünyayı yanlışlıkla devam ettirme.
- UI efektleri için gerçek UI zamanı, dünya simülasyonu için durdurulabilir dünya zamanı kullan. Menü kapanışında birikmiş süreyi tüketim olarak uygulama.
- Renk yanında metin veya simgeyle durum bildir; ses kapalıyken de sonuç anlaşılır olsun.
- Hareket azaltma seçeneğinde parçacıkları ve ekran sallanmasını azalt.

## 7. Kayıt ve sistem bağlantıları

- Temizlik maskesini veya yeterli çözünürlükte hücre durumunu mevcut kayıt sistemine ekle. Yalnız yüzde kaydetmek görsel maskeyi geri kurmaya yetmez.
- Bitki nemi ve su rezervini mevcut veri kaynağında güncelle; ayrı çelişen state oluşturma.
- Kayıt şeması değişiyorsa eski kayıtlar için güvenli varsayılan/migrasyon ekle.
- Kaynak güncelleme ve tamamlanma event'i tekrar çağrılmaya dayanıklı olsun.
- Temizlenme ve yeniden kirlenme, mevcut dünya simülasyonuna bağlı olsun. Ekranı yeniden açınca kir rastgele sıfırlanmasın.
- Genel günlükte tamamlanan ilk bakım öğretimi hatırlansın; her açılışta eğitim tekrarlanmasın.

## 8. UI metinleri

Panel: “PANEL BAKIMI”, “Fırçayı tozlu alanlarda gezdir”, “Temizlik”, “Panel temizlendi”, “Enerji üretimi”, “GERİ”.

Sera: “BİTKİ SULAMA”, “Suyu kök bölgesine ver”, “Nem”, “Su rezervi”, “Nem uygun”, “Su yetersiz”, “Sulama gerekmiyor”, “GERİ”.

Durum değerlerini gerçek sistemden al. Mockup değerlerini çalışan sisteme sabit gömme.

## 9. Test ve kabul kriterleri

- Panelin aynı yeri tekrar tekrar ovulduğunda ilerleme artmıyor.
- Çerçeve ve boş alanda temizlik kazanılmıyor.
- Farklı ekran boyutu/DPR'da fırçanın görsel temas noktası silinen yerle eşleşiyor.
- Hızlı sürüklemede boşluk bırakmıyor.
- %90 eşiğinde tamamlanma ve sistem iyileşmesi yalnız bir kez uygulanıyor.
- Kapat/aç ve kaydet/yükle, temizlik maskesini geri getiriyor.
- Hedef dışında veya tuş bırakıldığında su tüketilmiyor.
- Aynı akış süresinde farklı FPS'ler yaklaşık aynı tüketim ve nem kazanımı üretiyor.
- Su sıfırın altına, nem izin verilen sınırın üstüne çıkmıyor.
- Pointercancel ve odak kaybı akışı durduruyor.
- Menüde 60 saniye beklemek dünya kaynaklarını veya tehditleri ilerletmiyor; mini görev animasyonu ise çalışıyor.
- İç içe menü kapatılması oyunu erken devam ettirmiyor.
- İşlem iptali ve tekrar açma ücretsiz su veya tekrar ödül sağlamıyor.
- Temiz veya yeterince sulanmış nesneler doğru tamamlanmış durumu gösteriyor.
- Gerçek oyuncu testinde süre ve anlaşılabilirlik gözleniyor; hedef süre tutmuyor diye yapay bekleme eklenmiyor.

Mevcut test araçlarıyla mantık testleri ve en az bir gerçek etkileşim kontrolü yap. Test edemediğin koşulları açıkça belirt.

## 10. Teslim

Çalışan uygulamayı tamamla. Sonuçta:
1. Eklenen davranışları kısa anlat.
2. Değiştirilen dosyaları ve asset eşlemesini belirt.
3. Yapılan testleri ve sonuçlarını paylaş.
4. Eksik/uyumsuz asset varsa açık dosya adı ve gereken düzeltmeyi yaz.
5. Sonradan ayarlanabilir süre, fırça çapı, hedef nem ve akış değerlerinin yerini göster.

Eksik görseller varsa geri kalan uygulamayı tamamla; geçici görselleri açıkça işaretle. Geçici asset'leri nihai sanat olarak sunma. Projenin mevcut kapsamını aşan yeni ekonomi, ödül sistemi veya bağımlılık kurma.
