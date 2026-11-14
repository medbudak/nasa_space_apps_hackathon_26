# CLAUDE_PROMPTS.md — Claude İçin Geliştirme, Cilalama ve Teslim Rehberi

> **Kullanım İpucu:** Claude'a doğrudan şu tek cümleyi yazabilirsin:
> **`"CLAUDE_PROMPTS.md dosyasını oku. Önce Adım 1'deki bağlam kurallarını incele, ardından Adım 2, 3, 4 ve 5'teki görevleri sırasıyla uygula."`**
> Veya aşağıdaki kutulardan istediğin adımı kopyalayıp tek tek verebilirsin.

---

## ADIM 1: Bağlam ve Mimari Onboarding Promptu (İlk Mesaj)

```text
Bu klasörde NASA Space Apps Challenge 2026 ("Space Mission Design Game") için geliştirdiğimiz "SOL 14: RED HORIZON" adlı 2D 16-bit Pixel Art insanlı Mars görevi tasarım ve hayatta kalma oyunu bulunuyor.

Herhangi bir kod değişikliği yapmadan önce lütfen şu dosyaları oku ve kurallarını eksiksiz uygula:
1. AGENTS.md — K1–K6 ekip rolleri, tekil dosya sahipliği ve 5 modül sözleşmesi.
2. RULES.md — 6 bilimsel doğruluk kuralı (-80°C gece, ince atmosferde radyatör ısı atma arızası, ~M4.7 sarsıntı + 0.38g, Sabatier ISRU, tohum çimlenme deneyi, ışık gecikmesi ve Güneş Kavuşumu).
3. ARCHITECTURE.md ve API.md — Merkezi `gameState`, Event Bus (`bus.on`/`bus.emit`), Flood-Fill `#FFFFFF` beyaz arka plan şeffaflaştırma ve klasör yapısı.
4. REQUIREMENTS.md — Sol 0 5 tasarım ekranı, 9 bilimsel alet, 5 kayıp araç adli incelemesi, 6 deney, M1–M9 mekanikleri ve ~40 sn UFO Stinger finali.

Kritik Teknik Kurallar:
- Sabit Sayı Yasağı: Hiçbir bilimsel sayıyı (kütle, güç, sıcaklık, radyasyon, mesafe) koda sabit yazma; `data/nasa_data.json` (ve onun ES modül yansıması olan `src/core/nasa_data.js`) içinden resmi `src` URL kaynağıyla oku.
- Düz Metin Yasağı: Hiçbir arayüz metnini koda doğrudan Türkçe/İngilizce dizge olarak gömme; `content/story.json` (ve `src/core/story_data.js`) içinden `t('anahtar')` fonksiyonuyla hem `tr` hem `en` destekli oku.
- Çift Çalışma Modu (`http://` ve `file://`): Oyun hem HTTP sunucusunda (`src/main.js` ES Modules) hem de doğrudan `index.html`'e çift tıklanarak (`file://` protokolünde `dist/app.bundle.js`) çalışmaktadır. `src/`, `data/` veya `content/` altında yaptığın her değişiklikten sonra bu dosyanın sonundaki senkronizasyon betiğini çalıştırarak `dist/app.bundle.js` dosyasını güncelle.
```

---

## ADIM 2: Görsel Motor, Ara Sahneler ve Mini-Oyun Cilalama (`K3` & `K4`)

```text
Şimdi K3 (UI / Mini-Oyunlar) ve K4 (Pixel Art / VFX) rolleriyle aşağıdaki görsel ve etkileşim geliştirmelerini yap:

1. Uzay Yolculuğu (Sol 0 -> Sol 1) ve Gün Geçişi (Sol X -> Sol X+1) Ara Sahneleri:
   - `assets/screens/scr_transit.png` görselini kullanarak Sol 0'da "Görevi Başlat" butonuna basıldığında 15 saniyelik (veya tek tıkla geçilebilir) bir uzay yaklaşma + mikrometeorit kablo tamir mini-oyunu ara sahnesi göster.
   - `assets/screens/scr_sol_transition.png` görselini kullanarak her gün sonunda ("Günü Tamamla" butonuna basıldığında) mavi Mars gün batımı eşliğinde `SOL X → SOL X+1` geçiş ekranı ve o günün enerji/O2/veri telemetri özetini göster.

2. Yüzey Canvas Sahnesi (`src/fx/effects.js` & `src/fx/sprites.js`):
   - Astronot yüzeyde yürürken (`A/D` veya Sol/Sağ ok tuşları) keşfedilen enkazların (`Opportunity`, `Spirit`, `Phoenix`, `InSight`, `Beagle 2`) hizasına geldiğinde Canvas üzerinde etkileşimli `[E] Adli İnceleme Aç` etiketi göster.
   - `src/fx/sprites.js` içindeki Kenar Flood-Fill Chroma-Key (`#FFFFFF` beyaz arka plan şeffaflaştırma) algoritmasının astronotun beyaz uzay giysisini ve beyaz habitat kubbesini %100 koruduğundan emin ol.

3. 4 Mini-Oyun Şablonu (`src/minigames/minigames.js`):
   - `wires` (Kara kutu / Radyatör kablo birleştirme),
   - `align` (Anten / Spektrometre / Ses hızı frekans hizalama),
   - `qte` (0.38g Sarkaç & Serbest düşüş kronometre zamanlama),
   - `converter` (Regolit perklorat yıkama & Sabatier/MOXIE akış dönüştürücü)
   şablonlarının görsel animasyonlarını, ses geri bildirimlerini (`src/fx/audio.js`) ve mobil/klavye kontrollerini cilala.
```

---

## ADIM 3: Simülasyon, Sera, Kriz Kartları ve Bilim Derinleştirme (`K2` & `K6`)

```text
Şimdi K2 (Gameplay / Simülasyon) ve K6 (Adli İnceleme & Deneyler) rolleriyle oynanış derinliğini artır:

1. Dönüşsüzlük Noktası (`M4`) ve Eklem Donması Gerilimi (`src/core/sim.js` & `src/ui/hud.js`):
   - EVA sırasında habitattan uzaklaştıkça ve sıcaklık `-80°C`'ye düştükçe $O_{2,\text{gerekli}} = \frac{\text{mesafe}}{\text{hız}} \cdot \text{tüketim} \cdot 1.2$ kırmızı çentiğinin O2 çubuğu üzerinde nasıl kaydığını ve eklem donduğunda hız `%40`'a düşünce çentiğin nasıl sıçradığını görsel olarak vurgula.

2. Sera ve Sabatier ISRU Bağlantısı:
   - Deney 3 (Tohum Çimlenmesi) başarıyla tamamlandığında seranın verimini `+%30` artır ve HUD üzerinde sağlıklı sera durumunu göster.
   - Güç Yük Panelinde (`M3`) gece ısıtması (`heating`) veya sera (`greenhouse`) yük kesintisine (Load Shedding) uğrarsa seranın donmasını (`greenhouse_frozen.png`) ve bunun `decisionLog[]` üzerinden Neden-Sonuç Karnesine (`M5`) tam olarak hangi Sol'da neden yaşandığının yazılmasını sağla.

3. Ek Kriz Kartları (`src/core/events.js`):
   - Zorluklar kataloğundaki şu olayları da `CRISIS_CATALOG` ve `content/story.json` (`tr` + `en`) içine ekle:
     a) `perchlorate_dust`: Hava kilidinde toksik perklorat tozu (Su yıkaması vs. O2 vakumlama vs. Filtre zorlama).
     b) `suit_leak`: Aşındırıcı toz nedeniyle elbise contası sızıntısı (2 kat O2 tüketimi — Yama mini-oyunu).
     c) `software_amnesia`: Spirit Sol 18 benzeri flash bellek yazılım sıfırlanması (Kablo/Kurtarma mini-oyunu).
```

---

## ADIM 4: QA Testi, Hata Avı ve Bundle Senkronizasyonu (`K1` & `K6`)

```text
Lütfen K1 ve K6 (QA) rolüyle projede kapsamlı bir doğrulama ve paket senkronizasyon turu yap:

1. Veri ve Dil Bütünlüğü:
   - `data/nasa_data.json` içindeki tüm kayıtların geçerli bir `src` (resmi NASA/ESA URL) alanına sahip olduğunu doğrula.
   - `content/story.json` içindeki `tr` ve `en` sözlüklerinin birebir aynı anahtarlara sahip olduğunu kontrol et (eksik çeviri kalmasın).

2. 3 QA Tasarım Profili Testi (`TESTING.md`):
   - Profil 1 (Altın Yol): Dengeli tasarım (`Jezero`, Panel+RTG, 40 kWh, Kalın yalıtım, Mastcam-Z + MEDA + SEIS + MOXIE + Veggie) -> Tam Başarı ve `%80` Net UFO fotoğrafı.
   - Profil 2 (Kırılgan Tasarım): `Arcadia`, Sadece Güneş Paneli, 20 kWh batarya, İnce yalıtım -> Gece güç çöküşü, sera donması ve karnede neden-sonuç uyarısı.
   - Profil 3 (Düşük Kamera / Bant Genişliği): `Mastcam-Z` yok, sadece UHF röle -> Downlink darboğazı ve `%30` Bulanık UFO fotoğrafı.

3. Otomatik Bundle Senkronizasyonu:
   - Aşağıdaki PowerShell senkronizasyon komutunu çalıştırarak `src/core/nasa_data.js`, `src/core/story_data.js` ve `dist/app.bundle.js` dosyalarını güncelle.
```

---

## ADIM 5: NASA Space Apps Teslim Sayfası ve Sunum Paketi (`K1` & `K5`)

```text
NASA Space Apps Challenge global jüri kriterlerine (Impact, Creativity, Validity, Relevance, Presentation) göre `DEPLOYMENT.md` ve `docs/submission/PRESENTATION_AND_VIDEO_SCRIPT.md` dosyalarını baz alarak:

Space Apps proje gönderim sayfasına doğrudan kopyalayıp yapıştırabileceğimiz İngilizce metinleri `docs/submission/SPACE_APPS_PROJECT_PAGE_EN.md` dosyasında oluştur:
1. High-Level Project Summary (Tek cümlelik özet + 3 aşamalı oyun döngüsü: Design -> Operate -> Evaluate)
2. How We Addressed the Challenge (Challenge metnindeki her kavramın oyundaki ekran ve formül karşılığı tablosu)
3. Scientific Validity & 6 Engineering Corrections (-80°C gece, 0.6 kPa radyatör ısı atımı, ~M4.7 sarsıntı + 0.38g, Sabatier ISRU, tohum çimlenmesi, ışık gecikmesi & kavuşum)
4. Official NASA Data Sources Used (NSSDCA Master Catalog, Planetary Fact Sheet, ELV Performance, Trajectory Browser, JPL Horizons, DSN Now doğrudan URL'leri)
5. AI & Asset Transparency Disclosure (16-bit Pixel Art görsel üretim kütüphanesi, Web Audio API telifsiz sesler ve "UFO Stinger sahnesi Viking 1976 Pareidolia olayına atıfta bulunan bir kurgudur" beyanı).
```

---

## 🛠️ Claude İçin Hızlı Senkronizasyon Komutu (PowerShell)

Claude `data/nasa_data.json`, `content/story.json` veya `src/**/*.js` dosyalarında değişiklik yaptığında hem ES Modüllerinin hem de `file://` çift tıklama paketinin (`dist/app.bundle.js`) güncel kalması için şu PowerShell komutunu çalıştırmalıdır:

```powershell
# 1. JSON dosyalarını ES modüllerine senkronize et
$nasa = Get-Content -Raw -Encoding UTF8 "data/nasa_data.json"
Set-Content -Path "src/core/nasa_data.js" -Encoding UTF8 -Value ("// Auto-synced from data/nasa_data.json`nexport default " + $nasa + ";")
$story = Get-Content -Raw -Encoding UTF8 "content/story.json"
Set-Content -Path "src/core/story_data.js" -Encoding UTF8 -Value ("// Auto-synced from content/story.json`nexport default " + $story + ";")

# 2. Tüm ES modüllerini dist/app.bundle.js içine (file:// protokolü için) paketle
$order = @(
  "src/core/nasa_data.js",
  "src/core/story_data.js",
  "src/core/engineering.js",
  "src/core/state.js",
  "src/core/score.js",
  "src/core/events.js",
  "src/core/sim.js",
  "src/systems/forensics.js",
  "src/systems/experiments.js",
  "src/fx/sprites.js",
  "src/fx/effects.js",
  "src/fx/audio.js",
  "src/minigames/minigames.js",
  "src/ui/downlink.js",
  "src/ui/power_panel.js",
  "src/ui/decision_card.js",
  "src/ui/design_screens.js",
  "src/ui/hud.js",
  "src/ui/report_card.js",
  "src/main.js"
)
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("(function() {")
foreach ($file in $order) {
  $content = Get-Content -Raw -Encoding UTF8 $file
  if ($file -eq "src/core/nasa_data.js") {
    $content = $content -replace "export default", "const nasaData ="
  } elseif ($file -eq "src/core/story_data.js") {
    $content = $content -replace "export default", "const storyData ="
  } else {
    $content = [regex]::Replace($content, "(?m)^import\s+[\s\S]*?from\s+['""].*?['""];?\r?\n?", "")
    $content = $content -replace "(?m)^export\s+default\s+", ""
    $content = $content -replace "(?m)^export\s+(async\s+function|function|const|let|var)\s+", '$1 '
  }
  [void]$sb.AppendLine("// --- MODULE: $file ---")
  [void]$sb.AppendLine($content)
}
[void]$sb.AppendLine("})();")
Set-Content -Path "dist/app.bundle.js" -Encoding UTF8 -Value $sb.ToString()
Write-Output "Synced and bundled successfully!"
```
