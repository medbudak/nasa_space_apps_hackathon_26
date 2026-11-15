# AGENTS.md — Ekip Rolleri, Dosya Sahipliği ve Ajan Çalışma Protokolü

Bu belge, **SOL 14: RED HORIZON** projesinde çalışan geliştiricilerin (`K1–K6`) ve yapay zekâ ajanlarının uyması gereken sorumluluk sınırlarını, dosya sahipliği matrisini ve modüller arası iletişim sözleşmelerini tanımlar.

---

## 1. Rol ve Dosya Sahipliği Matrisi (`K1–K6`)

Birleştirme çakışmalarını (merge conflicts) sıfıra indirmek için **her dosyanın tek bir sahibi vardır**. Bir geliştirici veya alt ajan yalnızca kendi sorumluluk alanındaki dosyaları doğrudan düzenler; başka bir modülde değişiklik gerekiyorsa olay veri yolu (`bus.emit`) veya ortak arayüz sözleşmeleri üzerinden bağlanır.

| Rol Kodu | Unvan | Sahip Olduğu Dosyalar ve Klasörler | Temel Sorumluluklar |
| :--- | :--- | :--- | :--- |
| **K1** | **Lider / Sistem & Mühendislik** | `src/core/engineering.js`<br>`src/core/state.js`<br>`src/core/score.js`<br>`data/nasa_data.json`<br>`index.html`, `main.js` | Mühendislik formülleri ($P, \Delta v, t_{\text{gecikme}}, T, O_{2,\text{gerekli}}$), merkezi `gameState`, `decisionLog[]`, Neden-Sonuç Karnesi (`M5`), Hızlı Görev / `?demo` modu (`M9`), entegrasyon ve deploy. |
| **K2** | **Gameplay / Simülasyon Motoru** | `src/core/sim.js`<br>`src/core/events.js`<br>`src/core/surface.js`<br>`src/systems/workshop.js`<br>`src/fx/westlands.js` | 0.38g yüzey hareket ve zıplama fiziği, gece-gündüz ve enerji/ısı/O2 simülasyonu, olay motoru, Kriz Kartı tetikleyicileri (`M2`), Güç Yükü mantığı (`M3`), Dönüşsüzlük Noktası (`M4`), Sera, Gecikmeli Görev Kontrol (`M7`) ve `ufoStinger` bayrakları. |
| **K3** | **UI / HUD & Mini-Oyunlar** | `src/ui/design_screens.js`<br>`src/ui/hud.js`<br>`src/ui/decision_card.js`<br>`src/ui/downlink.js`<br>`src/ui/power_panel.js`<br>`src/minigames/*.js`<br>`src/ui/workshop_panel.js`<br>`src/ui/field_cam.js`<br>`styles/*.css` | `Sol 0` 5 tasarım ekranı, SPOF uyarısı (`M8`), Yüzey HUD çubukları, Downlink Kuyruğu UI (`M1`), Karar Kartı UI (`M2`), Güç Yük Önceliklendirme UI (`M3`), 4 mini-oyun şablonu (`wires`, `align`, `qte`, `converter`), TR/EN dil anahtarı. |
| **K4** | **Pixel Art / Görsel Efektler (VFX)** | `assets/backgrounds/*`<br>`assets/sprites/*`<br>`assets/structures/*`<br>`assets/screens/*`<br>`assets/vfx/*`<br>`assets/ending/*`<br>`src/fx/sprites.js`<br>`src/fx/effects.js`<br>`src/fx/dig_fx.js`<br>`src/fx/lander.js`<br>`src/fx/opening.js` | 16-bit Pixel Art görsellerin yönetimi, 48×48 ızgara hizalaması, parallax Mars arka planı, gece/mavi gün batımı geçişleri, fırtına parçacıkları, vizör buzlanması (`frost`), ekran sarsıntısı, halüsinasyon ve UFO kalkış/satır-satır foto inme animasyonu. |
| **K5** | **Senaryo / Bilim Doğrulama / Ses** | `content/story.json`<br>`data/events_catalog.json`<br>`src/fx/audio.js`<br>`assets/audio/*`<br>`docs/submission/*` | İki dilli (`TR` + `EN`) oyun metinleri (`t(key)`), NSSDCA/ELV/Horizons veri doğrulaması, 12+ kriz kartı metni, vaka ve deney bilimsel açıklamaları, CC0/prosedürel ses efektleri, sunum slaytları ve 30 sn demo video kurgusu. |
| **K6** | **Bilim Oynanışı (Adli & Deney) / QA** | `src/systems/forensics.js`<br>`src/systems/experiments.js`<br>`data/forensics_cases.json`<br>`data/experiments_config.json`<br>`src/systems/explore.js`<br>`data/explore_config.json`<br>`tests/*.test.js` | 5 kayıp araç (`Opportunity`, `Spirit`, `Phoenix`, `InSight`, `Beagle 2`) adli inceleme döngüsü (kanıt toplama + 5 kategori teşhis + NASA bulgu kartı), 6 bilimsel deney döngüsü (hipotez → kontrol grubu → ölçüm → bulgu ödülü) ve uçtan uca QA testleri. |

---

## 2. Modüller Arası Veri ve İletişim Sözleşmeleri

Ajanlar ve geliştiriciler kod yazarken aşağıdaki 5 temel sözleşmeye sadık kalmalıdır:

1. **Tek Merkezi Durum (`gameState`):**
   - Oyun içindeki tüm durum bilgisi `src/core/state.js` içindeki tekil `gameState` nesnesinde tutulur.
   - Hiçbir UI bileşeni veya mini-oyun kendi içinde gizli oyun durumu saklamaz; durumu `getState()` ile okur ve `updateState(patch)` veya tanımlı eylem fonksiyonları ile günceller.

2. **Sabit Sayı Yasağı (`data/nasa_data.json`):**
   - Kütle (`kg`), güç (`W`), veri (`Mbit`), güneş sabiti ($S \approx 586.2\text{ W/m}^2$), yerçekimi ($g = 3.73\text{ m/s}^2$), roket kapasiteleri ve sıcaklık eşikleri kod içine sabit (hardcoded) yazılamaz.
   - Tüm bilimsel sabitler `data/nasa_data.json` dosyasından `src` (NASA kaynak URL'i) alanıyla birlikte okunur.

3. **Düz Metin Yasağı (`content/story.json`):**
   - Kullanıcı arayüzünde görünen hiçbir başlık, açıklama, kriz kartı veya karne metni JS/HTML içine doğrudan Türkçe veya İngilizce dizge olarak gömülmez.
   - Tüm metinler `t('anahtar.yolu')` yardımcı fonksiyonu üzerinden `content/story.json` (`TR` ve `EN` destekli) dosyasından çekilir.

4. **Olay Veri Yolu (`bus.emit` / `bus.on`):**
   - `K2` (Simülasyon) bir fırtına, sarsıntı veya buzlanma başlattığında `K4`'ün `effects.js` dosyasını doğrudan çağırmak yerine `bus.emit('fx:storm', { intensity: 0.8 })` veya `bus.emit('crisis:trigger', crisisObj)` olayını yayınlar.

5. **Mini-Oyun Çağrı Arayüzü:**
   - Tüm mini-oyunlar `await runMinigame(type, config)` Promise yapısıyla çağrılır ve `{ success: boolean, score: number, timeUsed: number }` döndürür.

---

## 3. Yapay Zekâ Ajanı Çalışma Akışı (Execution Protocol)

Oyun uçtan uca çalışıyor; artık her görev mevcut kodun üzerine yapılır. Ajan her görevde şu sırayı izler:

1. **Senkronize ol:** `git fetch --all --prune`, ardından `main` ve kendi dalındaki yeni commit'leri hiçbir tarafı kaybetmeden birleştir (CLAUDE.md → "Sync before you start").
2. **Önce oku:** Değişecek modülü ve onu çağıranları oku; var olan yardımcıyı (`S.util`, `S.UI`, `S.Engineering`, `S.Sim`, `S.Explore`, `S.Workshop` …) yeniden yazma.
3. **En küçük net değişikliği yap:** CLAUDE.md → "Clean code". Sayılar `data/*.json`'a, metinler `content/story.json`'a (TR + EN), durum `gameState`'e. Yerine geçen eski kodu, CSS'i ve metin anahtarlarını aynı değişiklikte sil.
4. **Test et:** Davranış değiştiyse `tests/` güncellenir; `npm test` geçmeden commit yok. Görsel değişiklikleri tarayıcıda (`file://` dahil) kontrol et.
5. **Kayıt tut:** Yeni kaynak, varlık ya da yapay zekâ kullanımı → REFERENCES.md; ekip kararı gerektiren konu → DECISIONS.md'ye `Proposed`.

Uygun durumlarda `.claude/skills/` altındaki skill'ler (oyun tasarımı, UX, game feel, performans, belirsiz istekler için `prompt-improver`) kendiliğinden devreye girer; liste CLAUDE.md → "Project skills".
