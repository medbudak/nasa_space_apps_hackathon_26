# DEPLOYMENT.md — Yayınlama (Deploy) ve Space Apps Teslim Kontrol Listesi

Bu belge, **SOL 14: RED HORIZON** projesinin yerel ortamda çalıştırılmasını, GitHub Pages / statik sunucu üzerinden yayınlanmasını ve NASA Space Apps global jüri teslim standartlarını açıklar.

---

## 1. Yerel Çalıştırma ve Statik Dağıtım

Proje tamamen istemci taraflı (client-side) standart ES Modülleri, HTML5, CSS3 ve JSON dosyalarından oluşur; derleme (build) adımı gerektirmez ve herhangi bir statik dosya sunucusunda doğrudan çalışır.

```bash
# Seçenek 1: Node.js npx serve ile
npx serve . -l 8080

# Seçenek 2: Python HTTP sunucusu ile
python -m http.server 8080
```

### GitHub Pages Yayını (`K1`)
1. Repo `main` dalı kök dizini (`/ (root)`) GitHub Pages kaynağı olarak seçilir.
2. Tüm dosya yolları göreli (`./assets/...`, `./src/...`, `./data/...`) olarak tanımlandığı için alt dizinlerde (`/sol14-red-horizon/`) sorunsuz çalışır.
3. Jüri için iki doğrudan bağlantı sunulur:
   - **Tam Oyun (14 Sol):** `https://<kullanici>.github.io/<repo>/`
   - **Jüri Hızlı Demo Modu (5 Sol):** `https://<kullanici>.github.io/<repo>/?demo=1`

---

## 2. NASA Space Apps Teslim Kontrol Listesi (`S27–S30`)

Global jüri değerlendirmesine (`Impact, Creativity, Validity, Relevance, Presentation`) girmek için aşağıdaki maddelerin tamamı teslim öncesi doğrulanır:

- [x] **Proje Sayfası Dili:** Space Apps proje sayfası, özet ve 7 slayt tamamen **İngilizce** hazırlandı.
- [x] **30 Saniyelik Demo Videosu (veya 7 Slayt):**
  - `0–5 sn`: Takım + Challenge tanımı.
  - `5–12 sn`: `Sol 0` tasarım ekranı (bütçe, kütle, alet seçimi ve kırmızı uyarılar).
  - `12–20 sn`: Kum fırtınası + Dönüşsüzlük noktası Kriz Kartı + Opportunity adli teşhisi.
  - `20–25 sn`: Neden-Sonuç Karnesi (*"Bu mühendislik kararı şu sonucu doğurdu"*).
  - `25–30 sn`: MAV kalkışı ve UFO Stinger sahnesi (satır satır inen telemetri fotoğrafı).
- [x] **Herkese Açık Bağlantılar:** Demo video linki, canlı oyun linki (GitHub Pages) ve açık kaynak repo linki gizli sekmede (incognito) test edildi.
- [x] **NASA Veri Kaynakları Matrisi:** `NSSDCA Master Catalog`, `Planetary Fact Sheet`, `ELV Performance`, `Trajectory Browser`, `JPL Horizons` ve `DSN Now` bağlantıları proje sayfasına ve `data/nasa_data.json` içine eklendi.
- [x] **Yapay Zekâ ve Telif Beyanı:** Görsel üretim prompt kütüphanesi (`16-bit Pixel Art`), CC0/Web Audio ses kullanımı ve telifli materyal bulunmadığı beyan edildi.
- [x] **Bilimsel Kurgu Notu:** *"Oyun sonundaki UFO sahnesi Viking 1976 Pareidolia olayına atıfta bulunan bir kurgudur; cevabı oyuncunun kamera ve veri bant genişliği seçimi belirler"* notu eklendi.
