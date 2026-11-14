# CONTRIBUTING.md — Katkı Rehberi ve Ekip Çalışma Kuralları

**SOL 14: RED HORIZON** projesine katkıda bulunurken 30 saatlik hackathon temposunda çakışmaları önlemek ve bilimsel doğruluğu korumak için aşağıdaki kurallara uyulmalıdır.

---

## 1. Altın Kurallar (Özet)

1. **Sadece Kendi Dosyanı Düzenle:** `AGENTS.md` içindeki rol dağılımına (`K1–K6`) göre her dosyanın tek bir sahibi vardır. Başka bir modülde değişiklik gerekiyorsa dosya sahibine bildir veya `bus.emit('olay:adi', veri)` üzerinden haberleş.
2. **Sayı Uydurma (`data/nasa_data.json`):** Oyun içinde kullanılan her kütle, güç, sıcaklık, basınç ve yörünge parametresi `data/nasa_data.json` içinde resmi NASA/ESA `src` bağlantısıyla yer almalıdır.
3. **Koda Düz Metin Yazma (`content/story.json`):** Oyuncuya gösterilen tüm metinler `content/story.json` içinde hem Türkçe (`tr`) hem İngilizce (`en`) olarak tanımlanmalı ve `t('anahtar')` ile çağrılmalıdır.
4. **Main Dalı Her Zaman Çalışır Olmalı:** Kırık veya konsolda hata veren kodu `main` dalına gönderme.

---

## 2. Git Akışı ve Commit Mesaj Standardı

* **Senkronizasyon:** Her saat başı çalışmaya devam etmeden önce:
  ```bash
  git pull --rebase origin main
  ```
* **Commit Biçimi:** Commit mesajlarının başında rol kodu (`[K1]`..`[K6]`) yer almalıdır:
  ```text
  [K1] feat: engineering.js güneş gücü ve dönüşsüzlük noktası formülleri eklendi
  [K2] feat: fırtına ve eklem donması kriz kartı tetikleyicileri bağlandı
  [K3] ui: Sol 0 tasarım ekranı bütçe çubukları ve SPOF uyarısı tamamlandı
  [K4] art: vizör buzlanması ve UFO satır satır foto inme efekti eklendi
  [K5] content: 5 kayıp araç NSSDCA verileri ve TR/EN metinleri doğrulandı
  [K6] feat: 6 bilimsel deney döngüsü ve birim testleri eklendi
  ```

---

## 3. "Bitti" Tanımı (Definition of Done - DoD)

Bir görevin veya özelliğin **Tamamlandı (Done)** sayılması için aşağıdaki 5 kutunun tamamı işaretlenebilmelidir:

- [ ] Tarayıcı geliştirici konsolunda (`F12`) çalışma zamanı hatası (`ReferenceError`, `TypeError`) yok.
- [ ] `node --test tests/` komutu `%100` başarıyla geçiyor.
- [ ] Eklenen tüm bilimsel/mühendislik sayıları `data/nasa_data.json` içinde `src` alanıyla mevcut.
- [ ] Eklenen tüm kullanıcı metinleri `content/story.json` içinde hem `tr` hem `en` karşılığıyla mevcut.
- [ ] Özellik oyun içinden baştan başlayarak (veya `?demo=1` modunda) bizzat test edildi.
