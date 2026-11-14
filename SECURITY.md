# SECURITY.md — Güvenlik, Veri Bütünlüğü ve Telif/Lisans Politikası

Bu belge, **SOL 14: RED HORIZON** projesinin istemci tarafı güvenlik önlemlerini, üçüncü taraf bağımlılık politikasını ve NASA Space Apps Challenge telif/lisans uyumluluğunu tanımlar.

---

## 1. İstemci Tarafı Güvenlik (Client-Side Security)

1. **Sıfır Harici Çalışma Zamanı Bağımlılığı ve API Anahtarı Yokluğu:**
   - Uygulama tamamen statik HTML5, CSS3, Vanilla ES Modules ve yerel JSON (`data/nasa_data.json`, `content/story.json`) dosyalarıyla çalışır.
   - Kod içinde hiçbir gizli API anahtarı, kimlik bilgisi veya dış sunucuya veri gönderen izleyici (tracker) bulunmaz.
2. **XSS (Cross-Site Scripting) Koruması:**
   - Oyun içi metinler yalnızca güvenilir yerel `content/story.json` sözlüğünden okunur.
   - Kullanıcı veya URL parametrelerinden (`?demo=1`, `?lang=en`) gelen girdiler doğrudan DOM `innerHTML` içine yazılmaz; yalnızca beyaz listedeki (`whitelist`) sabit mod anahtarlarıyla eşleştirilir.
3. **Güvenli `localStorage` Kullanımı:**
   - Oyun kayıt verileri (`sol14_save_v2`) `JSON.parse` edilirken `try / catch` bloğu içinde şema doğrulamasından geçirilir; bozuk veya uyumsuz bir kayıt tespit edildiğinde oyun çökmeden varsayılan temiz duruma (`resetState()`) döner.

---

## 2. Telif Hakkı, NASA Görsel Yönergesi ve Yapay Zekâ Şeffaflığı

1. **NASA Logosu ve Kurumsal Kimlik Kuralları:**
   - NASA Space Apps kuralları gereği resmi NASA "Meatball" veya "Worm" logoları oyun arayüzünde kurumsal onay izlenimi verecek şekilde kullanılmaz; bunun yerine açık veri kaynaklarına (`NSSDCA`, `JPL Horizons`, `Planetary Fact Sheet`) metinsel atıf yapılır.
2. **Özgün 16-Bit Pixel Art Görseller:**
   - Oyundaki tüm arka plan, astronot, enkaz (`Opportunity`, `Spirit`, `Phoenix`, `InSight`, `Beagle 2`), yapı ve VFX görselleri projeye özel hazırlanan prompt kütüphanesiyle üretilmiştir; hiçbir ticari oyundan veya filmden sprite kopyalanmamıştır.
3. **Ses ve Müzik Lisansı (`CC0` / Web Audio API):**
   - Tüm ses efektleri (rüzgâr ambiyansı, kask alarmı, arayüz tıklamaları, radar taraması ve UFO sinyal darbeleri) tarayıcı yerleşik **Web Audio API** sentezleyicisi ile gerçek zamanlı üretilir; telif hakkı sorunu yaratacak hiçbir MP3/WAV örneği içermez.
