/**
 * SOL 14: RED HORIZON — WORLD PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * Tries out a longer, harder exploration corridor without editing anyone's file: everything is patched
 * in at runtime from this one file, loaded just before src/main.js. Remove the <script> tag and the game
 * is exactly as before; add ?proto=0 to the URL to compare with the original.
 *
 *  1. Zones: long stretches, landing site (0–1100 m) -> Jezero plain (1100–2300 m: flat, pale,
 *     dried lake bed with mud cracks) -> dark dune field (2300–3600 m: basaltic sand dunes, ripples)
 *     -> lava plain (3600–4800 m: dark basalt flows, lava-tube entrance at 3750 m) -> crater field
 *     (4800–6000 m: old crater rims, ejecta blocks). Past ~4.5 km a full suit cannot walk back.
 *     Lava tube: ↑/W/E at its mouth; the screen goes black, then the tube (dark, helmet lamp, a
 *     skylight at the far end); the same keys at the mouth climb back out. Its placement is fictional.
 *     Inside lie the parts of a FICTIONAL scout rover (SCOUT-1 / İZCİ-1, no real mission): its tracks lead
 *     in from the plain; wheel, panel, camera head, antenna and finally the rover itself wedged in the
 *     rubble. E next to a part opens FIELD CAM; each photo tells a piece of the story (rock cuts the radio
 *     link, no sunlight for the panels), and all five give the full story with its lesson.
 *     A new zone does not switch the whole screen at once: it is tied to the ground, so it slides in
 *     from the right edge as the astronaut walks, through a soft band. Drawn with the game's own
 *     procedural art (S.Art), so it follows day and night. Entering a zone for the first time brings a
 *     dark dust gust (visual only) that builds up and dies down slowly, plus the zone's name.
 *  3. Photo evidence = FIELD CAM: the astronaut holds the camera (src/proto/field_cam.png), the wreck
 *     shows in the viewfinder, out of focus. ←/→ (or the mouse wheel) turn the focus; the blur fades
 *     gradually as the focus gets closer, then Space (or "Take photo") saves the shot and the next
 *     evidence task starts by itself.
 *  5. Mars facts: during the cruise-and-landing cutscene a card shows short facts (radiation, sunlight,
 *     air, temperature, sol, sound), and the gravity card at the landing. Every number comes from
 *     nasa_data.json with its NASA source shown. Gravity: the jump already used Mars gravity; the dust kicked
 *     up now falls under it too, and the first jump shows the height and air time against Earth's.
 *  4. Diagnosis: the panel tells the story of what happened (field notes from the collected clues plus
 *     a short account) and explains each fault category, so the player can reason out the answer.
 *  2. Hidden wrecks, no hints: no pulsing beacon, no faint wreck, no "?" on the minimap, no prompt,
 *     no name or distance on the objective card. Wrecks are buried. The player finds debris on the way,
 *     follows rover tyre tracks (rovers only; landers leave parachute, backshell, heat-shield or airbag
 *     pieces instead) and digs (↓, S or E) where the trail ends. Near a buried wreck the astronaut kneels, the
 *     suit scanner pings and a "!" shows over the helmet; fake mounds get no reaction. At the first buried
 *     wreck only, a card (top right) says how to dig; later wrecks get no hint. No 100 m flags or labels.
 *     Each dig costs game time, so suit O2 and battery go down while digging.
 *
 * Owners to move this into, if the team adopts it: world length and zones -> K1 (nasa_data.json) and
 * K2 (surface.js); wreck positions -> K6 (forensics_cases.json); backgrounds and debris art -> K4
 * (effects.js / sprites); texts -> K5 (story.json); objective card -> K3 (hud.js).
 * All numbers below are prototype game values (D-009 style), not sourced measurements.
 */
(function (S) {
  'use strict';
  if (!S.Surface || !S.FX || !S.Art || !S.Forensics) return; // tests load only the core scripts
  const params = new URLSearchParams(window.location.search);
  if (params.get('proto') === '0') return;

  /* ---------------- Prototype settings (game values, to tune) ---------------- */
  const P = {
    // At 45 m/min and 0.5 % O2 per minute a full suit lasts ~9 km of walking: past ~4.5 km there is no way
    // back (the point-of-no-return marker warns), and at the far end the suit runs out. The land goes on.
    worldEndM: 9000,
    blendM: 300, // width of the soft band where the next zone slides in (m on the ground)
    // Each zone is drawn with the game's own procedural art (no illustration images: K4's bg_* are full scenes
    // with an astronaut and a NASA logo, not background layers). site = which palette the ridges and ground use.
    zones: [
      // scenery: 'ridges' (the game's own hills), 'dunes' or 'buttes' (drawn here). ground: extra ground layer.
      { id: 'landing', fromM: -1e9, toM: 1100, site: null, scenery: 'ridges', flatten: 1, tint: null, ground: null },
      // Jezero: an ancient lake bed, flat and pale, with dried mud cracks.
      { id: 'jezero', fromM: 1100, toM: 2300, site: 'meridiani', scenery: 'ridges', flatten: 0.45, tint: 'rgba(255, 214, 160, 0.10)', ground: 'lakebed' },
      // Dark dune field: basaltic sand shaped by the wind (like the Bagnold dunes Curiosity crossed in Gale crater).
      { id: 'dunes', fromM: 2300, toM: 3600, site: null, scenery: 'dunes', flatten: 1, tint: 'rgba(70, 40, 34, 0.18)', ground: 'sand' },
      // Lava plain: dark basalt flows with ropy (pahoehoe) surfaces and a low shield volcano far off.
      // The lava-tube entrance is here: tubes form inside basalt flows like these.
      { id: 'lava', fromM: 3600, toM: 4800, site: null, scenery: 'lava', flatten: 1, tint: 'rgba(30, 24, 30, 0.14)', ground: 'basalt' },
      // Crater field: old impact craters with raised rims, ejecta blocks thrown out around them.
      { id: 'craters', fromM: 4800, toM: 6200, site: null, scenery: 'craters', flatten: 1, tint: 'rgba(40, 30, 50, 0.12)', ground: 'blocky' },
      // Yardangs: long, low ridges carved by the wind (like the Medusae Fossae Formation), blunt upwind end,
      // tapering tail downwind, on pale, finely layered soft rock.
      { id: 'yardangs', fromM: 6200, toM: 7600, site: null, scenery: 'yardangs', flatten: 1, tint: 'rgba(255, 220, 180, 0.08)', ground: 'layered' },
      // Layered buttes: flat-topped hills of stacked sedimentary rock (like the lower slopes of Mount Sharp).
      { id: 'buttes', fromM: 7600, toM: 1e9, site: 'meridiani', scenery: 'buttes', flatten: 1, tint: 'rgba(255, 230, 200, 0.08)', ground: 'bedrock' }
    ],
    // Buried wreck positions (m east of the airlock).
    // Dig spots (real + fake) are at least ~270 m apart: 560 900 1250 1600 2050 2400 2750 3020 3300.
    wreckM: { opportunity: 900, spirit: 1600, insight: 2050, phoenix: 2750, beagle2: 3300 },
    fakeMoundsM: [560, 1250, 2400, 3020, 4050, 4450, 5150, 5700, 6500, 7200, 7950, 8600],
    // Lava tube: a cave mouth in a low basalt rise. ↑, W or E at the mouth goes in (screen goes black, then the
    // tube); the tube runs tubeLengthM further east underground, a collapsed skylight lets light in at its end.
    // ~3750 m out and back is ~7.5 km of walking; at 45 m/min and 0.5 % O2 per minute that is ~83 % of a full suit.
    tubeEntranceM: 3750,
    tubeLengthM: 520,
    tubeEnterRangeM: 18,
    tubeFadeMs: 650,
    // Inside the tube: parts of a FICTIONAL scout rover (not one of the five real missions) that drove in,
    // lost its radio link under the rock and got wedged in the rubble. m = metres past the tube mouth.
    tubeParts: [
      { id: 'wheel', m: 80 },
      { id: 'panel', m: 170 },
      { id: 'mast', m: 260 },
      { id: 'antenna', m: 350 },
      { id: 'body', m: 480 }
    ],
    // Ground around the tube (m from the mouth): collapse pits (where the roof of a lava tube sagged in) and
    // tumuli (low basalt swellings with a cracked top). Before the mouth on the way in, after it on the way on.
    // Kept ≥45 m from the fake mound at +300. w = width in px, h = depth or height in px.
    tubeTerrain: [
      { m: -290, kind: 'tumulus', w: 64, h: 13 },
      { m: -205, kind: 'pit', w: 46, h: 9 },
      { m: -135, kind: 'tumulus', w: 40, h: 8 },
      { m: -70, kind: 'pit', w: 30, h: 6 },
      { m: 85, kind: 'pit', w: 40, h: 8 },
      { m: 160, kind: 'tumulus', w: 72, h: 15 },
      { m: 230, kind: 'pit', w: 52, h: 10 },
      { m: 380, kind: 'tumulus', w: 48, h: 10 },
      { m: 455, kind: 'pit', w: 60, h: 12 }, // right above the skylight seen from inside the tube
      { m: 560, kind: 'tumulus', w: 56, h: 11 }
    ],
    tubePartRangeM: 16, // E photographs a part from this close
    tubePhotoMinutes: 5, // game time per photo (suit O2 keeps going down)
    reactRangeM: 24, // the astronaut kneels and the suit scanner pings near a buried wreck
    digTipSeconds: 9, // the one-time "how to dig" card, top right
    digRangeM: 16,
    digsNeeded: 4,
    digGameMinutes: 4,
    gustSeconds: 18, // the dust gust when entering a zone for the first time
    gustFadeSeconds: 6, // it builds up over this long and dies down over this long
    stormFadeSeconds: 10, // the game's own dust storm event: slow build-up and slow clearing
    // FIELD CAM (photo evidence)
    camSeconds: 40, // time limit, then the shot counts as poor
    camTolerance: 0.04, // |focus - target| below this = sharp
    camHoldSeconds: 0.35, // must stay sharp this long before "ready"
    camFocusSpeed: 0.45, // focus change per second while ←/→ is held
    camBlurEase: 2.2, // how fast the shown blur follows the focus (lower = slower, smoother)
    autoNextEvidence: true, // after the photo, the next evidence task starts by itself
    factSeconds: 2.2, // each Mars fact card during the cruise (the landing keeps the gravity card)
    dustKick: 3.5, // boot and dig dust leaves the ground faster, then falls under Mars gravity (no fake float)
    droneRevealsWrecks: false // true = Ingenuity on Sol 0 still shows every wreck (old behaviour)
  };
  S.WorldProto = P;

  /* ---------------- Texts (prototype; would move to content/story.json) ---------------- */
  const TEXT = {
    tr: {
      'proto.zone.landing': 'İniş bölgesi',
      'proto.zone.jezero': 'Jezero ovası · eski göl yatağı',
      'proto.zone.dunes': 'Karanlık kum tepeleri · bazaltik kum',
      'proto.zone.buttes': 'Katmanlı tepeler · eski tortul kayalar',
      'proto.zone.craters': 'Krater alanı · çarpmalarla saçılmış kaya blokları',
      'proto.zone.lava': 'Lav ovası · eski bazalt akıntıları',
      'proto.zone.yardangs': 'Yardang sırtları · rüzgârın oyduğu kayalar',
      'proto.fact.head': 'MARS · BİLMEN GEREKENLER',
      'proto.fact.head_edl': 'İNİŞ · MARS YERÇEKİMİ',
      'proto.fact.src': 'Kaynak: {src}',
      'proto.fact.gravity': 'Yerçekimi {g} m/s², Dünya\'dakinin yüzde {pct} kadarı. Aynı güçle {x} kat yükseğe zıplar, havada daha uzun kalırsın.',
      'proto.fact.air': 'Atmosfer çok ince: yüzey basıncı {kpa} kPa, Dünya\'dakinin yaklaşık yüzde {pct} kadarı. Havanın yüzde {co2} kadarı karbondioksit.',
      'proto.fact.temp': 'Ortalama sıcaklık {mean} °C. Ekvatorda gündüz {max} °C\'ye çıkar, gece {min} °C\'ye iner.',
      'proto.fact.sol': 'Bir Mars günü (sol) {h} saat {m} dakika sürer.',
      'proto.fact.sun': 'Güneş ışığı Dünya\'dakinin yaklaşık yüzde {pct} kadarı: ortalama {w} W/m².',
      'proto.fact.rad': 'Yüzeyde günlük radyasyon dozu yaklaşık {d} mSv, yolculukta günde {t} mSv.',
      'proto.fact.sound': 'Ses daha yavaş yayılır: Mars\'ta yaklaşık {m} m/s, Dünya\'da {e} m/s.',
      'proto.jump': '{r} g: {h} m yükseğe zıpladın, havada {t} s kaldın. Dünya\'da aynı güçle {he} m ve {te} s olurdu.',
      'proto.tube.tip_title': 'Lav tüneli',
      'proto.tube.tip_body': 'Girmek için ↑ ya da E.',
      'proto.tube.inside': 'Lav tüneli · tavan radyasyona ve gece soğuğuna karşı kalkan olur; gelecekteki üsler için aday yerlerdir. (Konumu kurgusal: Jezero\'da bilinen bir lav tüneli yok.)',
      'proto.tube.exit_tip': 'Çıkmak için girişte ↑ ya da E.',
      'proto.tube.photo_tip_title': 'Fotoğrafla',
      'proto.tube.photo_tip_body': 'Bir parça bulduğunda yanında E ile fotoğrafını çek.',
      'proto.tube.part.wheel.name': 'Tekerlek',
      'proto.tube.part.wheel.caption': 'Tırnakları keskin kayalara sürtünerek aşınmış bir tekerlek. Bir araç bu molozun üstünden geçmeye çalışmış.',
      'proto.tube.part.panel.name': 'Güneş paneli parçası',
      'proto.tube.part.panel.caption': 'Kırık bir güneş paneli. Tünelin içine Güneş ışığı girmez: bu panel burada hiç enerji üretemezdi.',
      'proto.tube.part.mast.name': 'Kamera başlığı',
      'proto.tube.part.mast.caption': 'Gezgin kameranın başlığı. Araç yolunu kendi görüp kendi seçerek, yani otonom sürüşle ilerliyormuş.',
      'proto.tube.part.antenna.name': 'Kırık anten çanağı',
      'proto.tube.part.antenna.caption': 'Kırık anten. Kaya telsiz sinyalini geçirmez: araç tünele girdiği anda Dünya ile bağlantısı kopmuştu.',
      'proto.tube.part.body.name': 'İZCİ-1 keşif rover\'ı',
      'proto.tube.part.body.caption': 'Aracın kendisi: tavandan düşmüş iki bloğun arasına sıkışmış, panelleri karanlıkta.',
      'proto.tube.story_title': 'İZCİ-1\'in son yolculuğu',
      'proto.tube.story_body': 'Bir toz fırtınasından korunmak için lav tüneline yönlendirildi. İçeri girdiği an kaya telsiz sinyalini kesti; Dünya\'dan gelen "dur" komutu hiç ulaşmadı. Otonom sürüşle ilerlemeye devam etti, moloz bloklarına çarptıkça tekerleği, paneli, kamerası ve anteni koptu. Sonunda iki bloğun arasına sıkıştı. Güneş ışığı olmadan bataryası tükendi ve sustu.',
      'proto.tube.story_lesson': 'Ders: Yer altında hem iletişim hem güneş enerjisi kesilir. Bir aracı mağaraya göndermek, ona bağlantısız ve enerjisiz çalışabileceği bir plan vermeyi gerektirir.',
      'proto.tube.story_fiction': 'İZCİ-1 ve bu hikâye kurgusaldır; gerçek bir göreve ait değildir.',
      'proto.tube.found': 'Fotoğraflandı {n}/{total}',
      'proto.search': 'Kayıp araçları ara',
      'proto.search_hint': 'Enkazlar kuma gömülü olabilir. Yerdeki izlere ve parçalara dikkat et.',
      'proto.dig.sand': 'Sadece kum',
      'proto.dig.metal': 'Metal! Bir şey gömülü',
      'proto.dig.more': 'Kazmaya devam ({n}/{total})',
      'proto.dig.found': '{name} ortaya çıktı!',
      'proto.tip.title': 'Kazı',
      'proto.tip.body': 'Gömülü bir şey bulduğunu düşünüyorsan ↓ ya da S ile kaz.',
      'proto.cam.focusing': 'NETLENİYOR',
      'proto.cam.sharp': 'NET • Çekime hazır',
      'proto.cam.saved': 'KAYDEDİLDİ',
      'proto.cam.blurry': 'BULANIK • Önce netleştir',
      'proto.cam.btn_focusing': 'Netleniyor...',
      'proto.cam.btn_shoot': 'Çek',
      'proto.cam.btn_saved': 'Fotoğraf kaydedildi',
      'proto.cam.close': 'Kapat',
      'proto.cam.album': 'Albüm',
      'proto.cam.album_empty': 'Albüm boş',
      'proto.cam.help': '← → odak halkasını çevir',
      'proto.cam.next': 'Sıradaki görev: {ev}',
      'proto.diag.story_title': 'Ne olmuş olabilir?',
      'proto.diag.locked': 'En az {n} kanıt topladığında, ipuçlarından çıkan olay burada anlatılacak.',
      'proto.diag.ask': 'Zinciri ilk halkasından düşün: sorunu başlatan ne oldu? Ondan sonra ne geldi?',
      'proto.story.opportunity': 'Haziran 2018\'de gökyüzü günlerce karardı; Güneş ışığı yüzeye neredeyse hiç ulaşmadı. Opportunity enerjisini yalnızca güneş panellerinden alıyordu. Enerji azaldıkça kendini korumak için uykuya geçti ve uyanacak kadar güç bir daha toplayamadı. Fırtına dindiğinde paneller hâlâ toz altındaydı.',
      'proto.story.insight': 'InSight hiç yer değiştirmeyen bir iniş aracıydı; enerjisini iki yuvarlak güneş panelinden alıyordu. Yıllar içinde panellere ince toz birikti ve rüzgâr onları hiç temizlemedi. Ekip enerji kazanmak için aletleri tek tek kapattı; sonunda araç Dünya ile konuşacak kadar güç bile üretemedi.',
      'proto.story.spirit': 'Spirit\'in bir ön tekerleği 2006\'dan beri dönmüyordu. Troy\'da ince kabuklu zeminin altındaki yumuşak kuma girdi; tekerlekler döndükçe daha da gömüldü ve aylarca süren kurtarma denemeleri sonuç vermedi. Saplandığı yerde panellerini kış Güneş\'ine çeviremedi; enerji düştü, ısıtıcılar yetmedi ve araç soğukta sustu.',
      'proto.story.phoenix': 'Phoenix kutup ovasına tek bir kısa yaz çalışması için indi. Sonbaharda Güneş ufka yaklaştı, panellerin enerjisi azaldı ve hava çok hızlı soğudu. Kışın aracın üzerinde kalın CO₂ buzu birikti. 2010\'da yörüngeden çekilen görüntüler, panellerin bu yükün altında kırıldığına işaret etti.',
      'proto.story.beagle2': 'Beagle 2 Noel günü yüzeye indi; yani iniş başarılıydı. Ama çiçek yaprağı gibi açılması gereken güneş panellerinin hepsi açılmadı. Telsiz anteni açılmayan panellerin altında kaldı: araç çalışıyor olsa bile sinyali dışarı çıkamadı. Yıllarca kayıp sanıldı.',
      'proto.catd.power_dust': 'Enerji kaynağı yetmedi: toz panelleri örttü ya da fırtına Güneş\'i kesti.',
      'proto.catd.thermal': 'Soğuğa dayanamadı: ısıtıcılar yetmedi, donanım dondu ya da buz yükü bindi.',
      'proto.catd.mechanical': 'Bir parça kırıldı, sıkıştı ya da araç hareket edemez hâle geldi.',
      'proto.catd.software': 'Donanım sağlamdı ama bilgisayar ya da bir sensör yanlış karar verdi.',
      'proto.catd.comms': 'Araç belki çalışıyordu ama sinyali Dünya\'ya ulaşamadı.'
    },
    en: {
      'proto.zone.landing': 'Landing site',
      'proto.zone.jezero': 'Jezero plain · an ancient lake bed',
      'proto.zone.dunes': 'Dark dune field · basaltic sand',
      'proto.zone.buttes': 'Layered buttes · old sedimentary rock',
      'proto.zone.craters': 'Crater field · rock blocks thrown out by impacts',
      'proto.zone.lava': 'Lava plain · old basalt flows',
      'proto.zone.yardangs': 'Yardang ridges · rock carved by the wind',
      'proto.fact.head': 'MARS · WHAT TO KNOW',
      'proto.fact.head_edl': 'LANDING · MARS GRAVITY',
      'proto.fact.src': 'Source: {src}',
      'proto.fact.gravity': 'Gravity is {g} m/s², {pct}% of Earth\'s. With the same push you jump {x} times higher and stay up longer.',
      'proto.fact.air': 'The air is very thin: surface pressure {kpa} kPa, about {pct}% of Earth\'s. {co2}% of it is carbon dioxide.',
      'proto.fact.temp': 'Average temperature {mean} °C. At the equator it reaches {max} °C by day and drops to {min} °C at night.',
      'proto.fact.sol': 'A Mars day (sol) lasts {h} hours {m} minutes.',
      'proto.fact.sun': 'Sunlight is about {pct}% of Earth\'s: {w} W/m² on average.',
      'proto.fact.rad': 'Radiation dose on the surface is about {d} mSv a day, and {t} mSv a day during the journey.',
      'proto.fact.sound': 'Sound travels slower: about {m} m/s on Mars, {e} m/s on Earth.',
      'proto.jump': '{r} g: you jumped {h} m high and stayed up {t} s. With the same push on Earth: {he} m and {te} s.',
      'proto.tube.tip_title': 'Lava tube',
      'proto.tube.tip_body': 'Press ↑ or E to go in.',
      'proto.tube.inside': 'Lava tube · the roof shields from radiation and the night cold, which makes tubes candidate sites for future bases. (Placement is fictional: no lava tube is known at Jezero.)',
      'proto.tube.exit_tip': 'At the entrance, ↑ or E to climb out.',
      'proto.tube.photo_tip_title': 'Take a photo',
      'proto.tube.photo_tip_body': 'When you find a part, press E next to it to photograph it.',
      'proto.tube.part.wheel.name': 'Wheel',
      'proto.tube.part.wheel.caption': 'A wheel with its grousers worn down on sharp rock. A vehicle tried to drive over this rubble.',
      'proto.tube.part.panel.name': 'Solar panel piece',
      'proto.tube.part.panel.caption': 'A broken solar panel. No sunlight gets into the tube: this panel could never make energy down here.',
      'proto.tube.part.mast.name': 'Camera head',
      'proto.tube.part.mast.caption': 'The navigation camera head. The vehicle was finding and choosing its own way: driving autonomously.',
      'proto.tube.part.antenna.name': 'Broken antenna dish',
      'proto.tube.part.antenna.caption': 'A broken antenna. Rock blocks radio signals: the moment the vehicle drove in, its link to Earth was gone.',
      'proto.tube.part.body.name': 'SCOUT-1 rover',
      'proto.tube.part.body.caption': 'The vehicle itself: wedged between two blocks that fell from the roof, its panels in the dark.',
      'proto.tube.story_title': 'SCOUT-1\'s last drive',
      'proto.tube.story_body': 'It was sent into the lava tube to shelter from a dust storm. The moment it went in, the rock cut its radio link; the "stop" command from Earth never arrived. It kept driving on its own, and as it hit the rubble it lost a wheel, a panel, its camera and its antenna. In the end it got wedged between two blocks. Without sunlight its battery ran out and it fell silent.',
      'proto.tube.story_lesson': 'Lesson: underground, both the radio link and solar power are cut. Sending a vehicle into a cave means giving it a plan it can carry out with no link and no sunlight.',
      'proto.tube.story_fiction': 'SCOUT-1 and this story are fictional; they belong to no real mission.',
      'proto.tube.found': 'Photographed {n}/{total}',
      'proto.search': 'Search for the lost spacecraft',
      'proto.search_hint': 'Wrecks may be buried in the sand. Watch the ground for tracks and debris.',
      'proto.dig.sand': 'Just sand',
      'proto.dig.metal': 'Metal! Something is buried',
      'proto.dig.more': 'Keep digging ({n}/{total})',
      'proto.dig.found': '{name} uncovered!',
      'proto.tip.title': 'Digging',
      'proto.tip.body': 'If you think something is buried here, dig with ↓ or S.',
      'proto.cam.focusing': 'FOCUSING',
      'proto.cam.sharp': 'SHARP • Ready to shoot',
      'proto.cam.saved': 'SAVED',
      'proto.cam.blurry': 'BLURRY • Focus first',
      'proto.cam.btn_focusing': 'Focusing...',
      'proto.cam.btn_shoot': 'Shoot',
      'proto.cam.btn_saved': 'Photo saved',
      'proto.cam.close': 'Close',
      'proto.cam.album': 'Album',
      'proto.cam.album_empty': 'Album is empty',
      'proto.cam.help': '← → turn the focus ring',
      'proto.cam.next': 'Next task: {ev}',
      'proto.diag.story_title': 'What could have happened?',
      'proto.diag.locked': 'Once you have at least {n} pieces of evidence, the story they tell will appear here.',
      'proto.diag.ask': 'Follow the chain from its first link: what started the trouble? What came after?',
      'proto.story.opportunity': 'In June 2018 the sky went dark for weeks; almost no sunlight reached the ground. Opportunity got its energy only from its solar panels. As the energy ran low it went to sleep to protect itself and never gathered enough power to wake up again. When the storm cleared, the panels were still under dust.',
      'proto.story.insight': 'InSight was a lander that never moved; its energy came from two round solar panels. Over the years fine dust settled on them and the wind never blew them clean. The team switched instruments off one by one to save energy; in the end it could not make enough power even to talk to Earth.',
      'proto.story.spirit': 'One of Spirit\'s front wheels had stopped turning in 2006. At Troy it broke through a thin crust into soft sand; every turn of the wheels dug it deeper, and months of rescue attempts failed. Stuck where it was, it could not tilt its panels towards the winter Sun; energy dropped, the heaters were not enough and it fell silent in the cold.',
      'proto.story.phoenix': 'Phoenix landed on the polar plain for a single short summer of work. In autumn the Sun sank towards the horizon, the panels gave less energy and the air cooled fast. In winter thick CO₂ ice built up on the lander. Images from orbit in 2010 suggested the panels had broken under that load.',
      'proto.story.beagle2': 'Beagle 2 reached the surface on Christmas Day, so the landing worked. But not all of its solar panels, meant to open like petals, unfolded. The radio antenna stayed under the closed panels: even if the lander worked, its signal could not get out. For years it was thought lost.',
      'proto.catd.power_dust': 'The energy source was not enough: dust covered the panels or a storm blocked the Sun.',
      'proto.catd.thermal': 'It could not survive the cold: heaters fell short, hardware froze or ice weighed it down.',
      'proto.catd.mechanical': 'A part broke or jammed, or the vehicle could no longer move.',
      'proto.catd.software': 'The hardware was fine but the computer or a sensor made a wrong call.',
      'proto.catd.comms': 'The vehicle may have been working, but its signal never reached Earth.'
    }
  };
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }
  const t = (k, v) => S.t(k, v);
  // numbers in the player's language (decimal comma in Turkish)
  const num = (x, d) => Number(x).toLocaleString(S.lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: d });
  const host = (u) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch (e) {
      return String(u);
    }
  };

  /* ---------------- World length and wreck positions ---------------- */
  S.DATA.gameplay.maxEvaRangeM = P.worldEndM;
  for (const c of S.DATA.forensics.cases) if (P.wreckM[c.id] !== undefined) c.distanceM = P.wreckM[c.id];

  const Surf = S.Surface;
  const F = S.Forensics;
  const proto = (s) => (s.proto = s.proto || { dig: {}, zonesSeen: { landing: true } });
  const isRover = (c) => /^rover_/.test(c.sprite);

  /* ---------------- No hints: wrecks exist only once dug out ---------------- */
  const discovered = (s, c) => Boolean(s.forensics[c.id] && s.forensics[c.id].discovered);
  F.updateDiscovery = function () {}; // no more automatic discovery by walking near
  const origIdentified = F.identified;
  F.identified = (s, c) => (P.droneRevealsWrecks ? origIdentified(s, c) : discovered(s, c));

  // While drawing the world and building the interaction list, undiscovered wrecks do not exist.
  const origCases = F.cases;
  let hiding = 0;
  F.cases = function () {
    const all = origCases();
    if (!hiding) return all;
    const s = S.getState();
    return all.filter((c) => F.identified(s, c));
  };
  const hideDuring = (obj, name) => {
    const fn = obj[name];
    obj[name] = function () {
      hiding++;
      try {
        return fn.apply(this, arguments);
      } finally {
        hiding--;
      }
    };
  };
  hideDuring(S.FX, 'render');
  hideDuring(Surf, 'interactables');

  // Objective card: no name or distance for a wreck that has not been found.
  if (S.Objectives) {
    const origMain = S.Objectives.mainGoal;
    S.Objectives.mainGoal = function (s) {
      const g = origMain.apply(this, arguments);
      if (g && (g.id === 'wreck_signal' || g.id === 'wreck_go')) {
        const target = origCases().find((c) => c.name === (g.vars && g.vars.name));
        if (g.id === 'wreck_signal' || !target || !F.identified(s, target)) {
          return { id: 'proto_search', key: 'proto.search', vars: {}, hintKey: 'proto.search_hint' };
        }
      }
      return g;
    };
  }

  // Minimap: unknown wrecks are not marked.
  const css = document.createElement('style');
  css.textContent = '.mm-mark.unknown { display: none !important; }';
  document.head.appendChild(css);

  /* ---------------- Zones ---------------- */
  const tube = { active: false, busy: false }; // inside the lava tube? (not saved: a reload starts outside)
  const sat = (x) => Math.max(0, Math.min(1, x));
  const smooth =(x) => x * x * (3 - 2 * x);
  const zoneAt = (m) => P.zones.find((z) => m >= z.fromM && m < z.toM) || P.zones[0];
  const isWorldCall = () => {
    const s = S.getState && S.getState();
    return s && !s.player.inside && s.scene === 'surface';
  };

  // Zones are tied to the ground: zone z covers screen x where the ground under x lies between its
  // fromM and toM, with a soft band of blendM around each border. So the next zone slides in from the
  // right edge as the camera moves, instead of the whole screen changing at once.
  // Each zone is drawn into an offscreen layer and cut with a horizontal gradient mask.
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');
  function zoneCover(z, camX, w) {
    const band = Surf.mToPx(P.blendM) - Surf.mToPx(0);
    const a = Surf.mToPx(z.fromM) - camX; // screen x of the zone's west border
    const b = Surf.mToPx(z.toM) - camX; // and of its east border
    if (b + band / 2 <= 0 || a - band / 2 >= w) return null; // not on screen
    return { a, b, band, full: a + band / 2 <= 0 && b - band / 2 >= w };
  }
  function drawZoneLayers(ctx, camX, w, h, drawFn) {
    for (const z of P.zones) {
      const cov = zoneCover(z, camX, w);
      if (!cov) continue;
      if (cov.full) {
        ctx.save();
        drawFn(ctx, z);
        ctx.restore();
        continue;
      }
      if (layer.width !== w || layer.height !== h) {
        layer.width = w;
        layer.height = h;
      }
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = 'source-over';
      lctx.globalAlpha = 1;
      lctx.clearRect(0, 0, w, h);
      lctx.save();
      drawFn(lctx, z);
      lctx.restore();
      // mask: alpha(x) = in(x) * out(x), smooth ramps across each border band
      const g = lctx.createLinearGradient(0, 0, w, 0);
      const alphaAt = (x) => smooth(sat((x - cov.a) / cov.band + 0.5)) * smooth(sat((cov.b - x) / cov.band + 0.5));
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        g.addColorStop(i / steps, 'rgba(0,0,0,' + alphaAt(x).toFixed(3) + ')');
      }
      lctx.globalCompositeOperation = 'destination-in';
      lctx.fillStyle = g;
      lctx.fillRect(0, 0, w, h);
      lctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, 0, 0);
    }
  }

  // Sky: a light tint per zone (warm haze over the old lake bed, darker over the dunes).
  const origSky = S.Art.drawSky;
  S.Art.drawSky = function (ctx, siteId, minute, w, h, opts) {
    if (tube.active && !opts && isWorldCall()) return drawCaveBack(ctx, siteId, minute, S.FX.camX, w, h);
    origSky.apply(this, arguments);
    if (opts || !isWorldCall()) return;
    drawZoneLayers(ctx, S.FX.camX, w, h, (c, z) => {
      if (!z.tint) return;
      c.globalAlpha = 1 - S.Art.lighting(minute).dark * 0.7;
      c.fillStyle = z.tint;
      c.fillRect(0, 0, w, h);
    });
  };

  // Ridges: each zone's own scenery; the Jezero plain flattens the hills towards the ground line.
  const GY = () => Surf.GROUND_Y;
  const origRidges = S.Art.drawRidges;
  S.Art.drawRidges = function (ctx, siteId, minute, camX, w) {
    if (!isWorldCall()) return origRidges.apply(this, arguments);
    if (tube.active) return; // the cave walls are drawn with the sky
    drawZoneLayers(ctx, camX, w, 360, (ctx, z) => {
      if (z.scenery === 'dunes') drawDunes(ctx, minute, camX, w);
      else if (z.scenery === 'buttes') drawButtes(ctx, minute, camX, w);
      else if (z.scenery === 'craters') drawCraterRims(ctx, minute, camX, w);
      else if (z.scenery === 'lava') drawLavaPlain(ctx, minute, camX, w);
      else if (z.scenery === 'yardangs') drawYardangs(ctx, minute, camX, w);
      else {
        if (z.flatten !== 1) {
          ctx.translate(0, GY());
          ctx.scale(1, z.flatten);
          ctx.translate(0, -GY());
        }
        origRidges.call(S.Art, ctx, z.site || siteId, minute, camX, w);
      }
    });
  };

  // Ground: the zone's palette blended in, lake-bed mud cracks on the Jezero plain, then the clues.
  const origGround = S.Art.drawGround;
  S.Art.drawGround = function (ctx, siteId, minute, camX, w, h, groundY, opts) {
    if (!opts || !opts.markers || !isWorldCall()) return origGround.apply(this, arguments);
    if (tube.active) return drawCaveFloor(ctx, minute, camX, w, h, groundY);
    opts = Object.assign({}, opts, { markers: [] }); // no 100 m flags or labels on the ground
    origGround.call(this, ctx, siteId, minute, camX, w, h, groundY, opts);
    drawZoneLayers(ctx, camX, w, h, (c, z) => {
      if (z.site) origGround.call(S.Art, c, z.site, minute, camX, w, h, groundY, opts);
      if (z.ground === 'lakebed') drawMudCracks(c, minute, camX, w, groundY);
      else if (z.ground === 'sand') drawSandGround(c, minute, camX, w, h, groundY);
      else if (z.ground === 'bedrock') drawBedrock(c, minute, camX, w, h, groundY);
      else if (z.ground === 'blocky') drawBlockyGround(c, minute, camX, w, h, groundY);
      else if (z.ground === 'basalt') drawBasaltGround(c, minute, camX, w, h, groundY);
      else if (z.ground === 'layered') drawLayeredGround(c, minute, camX, w, h, groundY);
    });
    drawClues(ctx, S.getState(), minute, camX, w, groundY);
  };

  /* ---------- colours that follow day and night ---------- */
  function hexMix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
    return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  const atNight = (col, minute) => hexMix(col, '#120c10', S.Art.lighting(minute).dark * 0.85);

  // Dark dunes: three layers of asymmetric dunes (long gentle windward slope, short steep lee face)
  // with a lighter crest line, moving at different speeds for depth.
  function drawDunes(ctx, minute, camX, w) {
    const layers = [
      { par: 0.1, base: 262, amp: 30, len: 210, col: '#6e4c40' },
      { par: 0.25, base: 282, amp: 20, len: 130, col: '#57392f' },
      { par: 0.5, base: 300, amp: 11, len: 74, col: '#442c26' }
    ];
    for (const L of layers) {
      const body = atNight(L.col, minute);
      const crest = atNight(hexMix(L.col, '#e9b98c', 0.4), minute);
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        const ph = (((wx / L.len) % 1) + 1) % 1;
        const shape = ph < 0.75 ? Math.sin((ph / 0.75) * Math.PI / 2) : Math.cos(((ph - 0.75) / 0.25) * Math.PI / 2);
        const n = 0.75 + 0.25 * Math.sin(Math.floor(wx / L.len) * 1.7);
        const top = Math.round(L.base - L.amp * shape * n);
        ctx.fillStyle = body;
        ctx.fillRect(x, top, 2, 370 - top);
        if (ph > 0.6 && ph < 0.78) {
          ctx.fillStyle = crest;
          ctx.fillRect(x, top, 2, 1);
        }
      }
    }
  }

  // Layered buttes: flat-topped stepped hills with light and dark rock bands, a far row and a nearer row.
  function drawButtes(ctx, minute, camX, w) {
    const rows = [
      { par: 0.1, base: 286, spacing: 230, minW: 90, maxW: 170, minH: 40, maxH: 78, light: '#c79a74', dark: '#9c6a4c', seed: 3 },
      { par: 0.3, base: 300, spacing: 170, minW: 50, maxW: 110, minH: 20, maxH: 44, light: '#b5835f', dark: '#875538', seed: 11 }
    ];
    for (const R of rows) {
      const light = atNight(R.light, minute);
      const dark = atNight(R.dark, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const bw = R.minW + Math.round(rnd(i * 3.1 + R.seed) * (R.maxW - R.minW));
        const bh = R.minH + Math.round(rnd(i * 5.7 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.3 + R.seed) * 60);
        const top = R.base - bh;
        for (let y = top; y < R.base; y += 3) {
          const band = Math.floor((y - top) / 3);
          const inset = Math.max(0, 8 - band * 2) + (band % 4 === 3 ? 2 : 0); // stepped edges
          ctx.fillStyle = band % 2 ? dark : light;
          ctx.fillRect(x0 + inset, y, bw - inset * 2, 3);
        }
        ctx.fillStyle = dark; // talus apron at the foot
        ctx.fillRect(x0 - 10, R.base - 3, bw + 20, 3);
      }
    }
  }

  // Ground colours of the zones drawn here, used by the mounds, craters and stones lying on them.
  const GROUND_PAL = {
    sand: { groundLight: '#7a5444', groundDark: '#3a251f', rock: '#2c1d19' },
    bedrock: { groundLight: '#d4ab84', groundDark: '#946a4a', rock: '#6e4c36' },
    blocky: { groundLight: '#a8705a', groundDark: '#5e3a30', rock: '#3e2a28' },
    basalt: { groundLight: '#6a5048', groundDark: '#2e2224', rock: '#1f1719' },
    layered: { groundLight: '#d9b08a', groundDark: '#a07658', rock: '#7c5640' }
  };

  // Yardangs: rows of long, streamlined ridges. Each has a steep blunt head facing the wind (west here)
  // and a long tail tapering downwind; fine horizontal layers show on their flanks.
  function drawYardangs(ctx, minute, camX, w) {
    const rows = [
      { par: 0.1, base: 284, spacing: 300, minL: 160, maxL: 260, minH: 18, maxH: 34, body: '#b98a68', band: '#a27454', lit: '#e3bc96', seed: 23 },
      { par: 0.28, base: 300, spacing: 240, minL: 120, maxL: 200, minH: 12, maxH: 24, body: '#a87a5a', band: '#8f6347', lit: '#d8ad86', seed: 41 }
    ];
    for (const R of rows) {
      const body = atNight(R.body, minute);
      const band = atNight(R.band, minute);
      const lit = atNight(R.lit, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const L = R.minL + Math.round(rnd(i * 3.3 + R.seed) * (R.maxL - R.minL));
        const H = R.minH + Math.round(rnd(i * 6.1 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.7 + R.seed) * 80);
        for (let x = 0; x < L; x += 2) {
          const u = x / L;
          // blunt head: rises fast over the first 12 %, then a long, slowly falling tail
          const prof = u < 0.12 ? Math.sin((u / 0.12) * Math.PI / 2) : Math.pow(1 - (u - 0.12) / 0.88, 1.6);
          const hh = Math.round(H * prof);
          if (hh <= 0) continue;
          const top = R.base - hh;
          ctx.fillStyle = body;
          ctx.fillRect(x0 + x, top, 2, hh + 2);
          ctx.fillStyle = band;
          for (let y = top + 3; y < R.base; y += 4) ctx.fillRect(x0 + x, y, 2, 1);
          ctx.fillStyle = lit;
          ctx.fillRect(x0 + x, top, 2, 1);
        }
      }
    }
  }

  // Pale, finely layered soft rock with wind-scoured grooves running along the wind.
  function drawLayeredGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#c49a76', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#e1bb95', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#a87e5e', minute);
    for (let y = gy + 5; y < h; y += 5) {
      const off = Math.round(((camX + y * 31) % 90 + 90) % 90);
      for (let x = -off; x < w; x += 90) ctx.fillRect(x, y, 60 + Math.round(rnd(y + x) * 20), 1);
    }
  }

  // Lava plain: a broad, low shield volcano on the horizon and nearer lobed flow fronts (lava tongues
  // that cooled where they stopped), dark basalt with a dusty reddish top.
  function drawLavaPlain(ctx, minute, camX, w) {
    const far = atNight('#7a5650', minute);
    for (let x = 0; x < w; x += 2) {
      const wx = x + camX * 0.06;
      const u = ((wx % 1400) + 1400) % 1400 / 1400; // one shield every 1400 px
      const shield = Math.max(0, Math.cos((u - 0.5) * Math.PI)) ** 1.6;
      const top = Math.round(270 - 34 * shield);
      ctx.fillStyle = far;
      ctx.fillRect(x, top, 2, 310 - top);
    }
    const lobes = [
      { par: 0.22, base: 290, h: 9, len: 150, body: '#4a3438', top: '#86584a' },
      { par: 0.45, base: 300, h: 7, len: 96, body: '#3a2a2e', top: '#73493f' }
    ];
    for (const L of lobes) {
      const body = atNight(L.body, minute);
      const top = atNight(L.top, minute);
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX * L.par;
        const i = Math.floor(wx / L.len);
        const u = (wx / L.len) - i;
        const hh = L.h * (0.6 + rnd(i * 2.7) * 0.6) * Math.min(1, Math.sin(u * Math.PI) * 2.2); // flat-topped lobe
        const y = Math.round(L.base - hh);
        ctx.fillStyle = body;
        ctx.fillRect(x, y, 2, 362 - y);
        ctx.fillStyle = top;
        ctx.fillRect(x, y, 2, 1);
      }
    }
  }

  // Basalt ground: dark rock with ropy ripples (pahoehoe) and thin dust in the hollows.
  function drawBasaltGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#3e2e30', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#7a5248', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#57403e', minute);
    for (let row = 0; row < 6; row++) {
      const y0 = gy + 6 + row * 9;
      for (let x = 0; x < w; x += 2) {
        const wx = x + camX;
        const rope = Math.sin(wx * 0.11 + row * 1.7) * 2 + Math.sin(wx * 0.031 + row) * 2; // folded, rope-like crust
        ctx.fillRect(x, Math.round(y0 + rope), 2, 1);
      }
    }
    ctx.fillStyle = atNight('#8a5a46', minute); // dust caught in hollows
    const cell = 40;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      if (rnd(i * 4.4) < 0.5) continue;
      ctx.fillRect(Math.round(i * cell - camX + rnd(i) * 20), gy + 10 + Math.round(rnd(i * 2) * 30), 10, 2);
    }
  }

  // Crater field: two rows of old craters seen from the side (a raised rim with a dark bowl showing between
  // the lips) and blocky ejecta on the far plain. The nearer row moves faster for depth.
  function drawCraterRims(ctx, minute, camX, w) {
    const plain = atNight('#9a6450', minute);
    ctx.fillStyle = plain; // far plain
    ctx.fillRect(0, 276, w, 30);
    const rows = [
      { par: 0.12, base: 282, spacing: 260, minW: 120, maxW: 220, minH: 10, maxH: 22, rim: '#b98066', bowl: '#5a3530', seed: 5 },
      { par: 0.32, base: 298, spacing: 340, minW: 160, maxW: 280, minH: 12, maxH: 26, rim: '#a46e57', bowl: '#4a2b27', seed: 17 }
    ];
    for (const R of rows) {
      const rim = atNight(R.rim, minute);
      const rimLight = atNight(hexMix(R.rim, '#f0c9a6', 0.35), minute);
      const bowl = atNight(R.bowl, minute);
      const shift = camX * R.par;
      const first = Math.floor(shift / R.spacing) - 1;
      for (let i = first; i < first + w / R.spacing + 3; i++) {
        const cw = R.minW + Math.round(rnd(i * 2.3 + R.seed) * (R.maxW - R.minW));
        const chh = R.minH + Math.round(rnd(i * 4.1 + R.seed) * (R.maxH - R.minH));
        const x0 = Math.round(i * R.spacing - shift + rnd(i * 1.9 + R.seed) * 70);
        // rim: rises from the plain to the lip on each side, a dark bowl in the middle
        for (let x = 0; x < cw; x += 2) {
          const u = x / cw; // 0..1 across the crater
          const lip = Math.sin(u * Math.PI); // overall hill
          const edge = Math.pow(Math.abs(u - 0.5) * 2, 3); // high at the two lips
          const top = Math.round(R.base - chh * (0.35 * lip + 0.65 * edge));
          ctx.fillStyle = rim;
          ctx.fillRect(x0 + x, top, 2, R.base - top + 2);
          if (Math.abs(u - 0.5) < 0.36) {
            ctx.fillStyle = bowl; // the far wall of the bowl, seen over the near lip
            ctx.fillRect(x0 + x, top, 2, Math.max(1, Math.round(chh * 0.25 * (1 - edge))));
          }
          if (edge > 0.6) {
            ctx.fillStyle = rimLight; // sunlit lip
            ctx.fillRect(x0 + x, top, 2, 1);
          }
        }
        ctx.fillStyle = bowl; // ejecta blocks around the rim
        for (let k = 0; k < 5; k++) {
          const bx = x0 - 20 + Math.round(rnd(i * 7 + k + R.seed) * (cw + 40));
          const bs = 2 + Math.round(rnd(i * 11 + k) * 4);
          ctx.fillRect(bx, R.base - bs + 1, bs + 2, bs);
        }
      }
    }
  }

  // Ejecta ground: darker regolith strewn with angular blocks.
  function drawBlockyGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#7e4e3e', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#a8705a', minute);
    ctx.fillRect(0, gy, w, 2);
    const cell = 26;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 4; row++) {
        const r = rnd(i * 3.7 + row * 13);
        if (r < 0.45) continue;
        const sz = 2 + Math.round(r * 4);
        const y = gy + 4 + row * 12 + Math.round(rnd(i + row) * 6);
        ctx.fillStyle = atNight('#4a2e28', minute);
        ctx.fillRect(x + Math.round(rnd(i * 5 + row) * 16), y, sz + 2, sz);
        ctx.fillStyle = atNight('#b07a62', minute);
        ctx.fillRect(x + Math.round(rnd(i * 5 + row) * 16), y, sz + 2, 1);
      }
    }
  }

  // Dark sand ground with wind ripples.
  function drawSandGround(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#4f342b', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#7a5444', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#6a4638', minute);
    for (let y = gy + 6; y < h; y += 6) {
      const off = Math.round(((camX * 0.9 + y * 7) % 14 + 14) % 14);
      for (let x = -off; x < w; x += 14) ctx.fillRect(x, y + Math.round(Math.sin((x + camX + y) * 0.08)), 8, 1);
    }
  }

  // Pale layered bedrock with cracks between slabs.
  function drawBedrock(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = atNight('#b48a64', minute);
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = atNight('#d4ab84', minute);
    ctx.fillRect(0, gy, w, 2);
    ctx.fillStyle = atNight('#946a4a', minute);
    for (let y = gy + 8; y < h; y += 9) ctx.fillRect(0, y, w, 1);
    const cell = 34;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 4; row++) ctx.fillRect(x + Math.round(rnd(i * 2 + row) * 12), gy + 4 + row * 9, 1, 8);
    }
  }

  // Dried lake bed: pale sediment layers and polygon mud cracks (Jezero was a lake ~3.5 billion years ago).
  function drawMudCracks(ctx, minute, camX, w, gy) {
    const pal = S.Art.palette('meridiani', minute);
    ctx.fillStyle = pal.groundLight;
    ctx.globalAlpha *= 0.55;
    for (let y = gy + 10; y < gy + 60; y += 13) ctx.fillRect(0, y, w, 1);
    ctx.fillStyle = pal.groundDark;
    const cell = 22;
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const x = Math.round(i * cell - camX);
      for (let row = 0; row < 3; row++) {
        const y = gy + 6 + row * 17 + Math.round(rnd(i * 3 + row) * 5);
        ctx.fillRect(x + Math.round(rnd(i + row * 7) * 6), y, cell - 4, 1);
        ctx.fillRect(x + Math.round(rnd(i * 5 + row) * 10), y - 5, 1, 6);
      }
    }
  }

  /* ---------------- Clues drawn in the world (pixel art, no UI) ---------------- */
  function rnd(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  const seedOf = (str) => [...str].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 10007;

  function debrisFor(c) {
    const kinds = isRover(c) ? ['wheel', 'panel', 'cable'] : c.id === 'beagle2' ? ['airbag', 'parachute', 'panel'] : ['parachute', 'backshell', 'heatshield'];
    const base = seedOf(c.id);
    return kinds.map((kind, i) => ({ kind, m: c.distanceM - (300 - i * 105) - Math.round(rnd(base + i) * 40), seed: base + i }));
  }

  function drawDebris(ctx, kind, x, gy, seed, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const flip = rnd(seed) < 0.5 ? -1 : 1;
    if (kind === 'wheel') {
      ctx.fillStyle = '#3b3430';
      ctx.fillRect(x - 4, gy - 5, 8, 6);
      ctx.fillStyle = '#7a706a';
      ctx.fillRect(x - 3, gy - 4, 6, 1);
      ctx.fillRect(x - 1, gy - 5, 2, 5);
    } else if (kind === 'panel') {
      ctx.fillStyle = '#2c3e6b';
      ctx.fillRect(x - 6, gy - 2, 12, 3);
      ctx.fillStyle = '#9fb3d9';
      for (let i = -5; i < 6; i += 3) ctx.fillRect(x + i, gy - 2, 1, 1);
    } else if (kind === 'cable') {
      ctx.fillStyle = '#c9a23a';
      for (let i = 0; i < 10; i++) ctx.fillRect(x - 5 + i, gy - 1 - ((i * flip) % 3 === 0 ? 1 : 0), 1, 1);
    } else if (kind === 'parachute') {
      ctx.fillStyle = '#e8e2d8';
      ctx.fillRect(x - 8, gy - 2, 16, 3);
      ctx.fillStyle = '#d0603a';
      ctx.fillRect(x - 8 + (flip > 0 ? 0 : 10), gy - 2, 6, 3);
      ctx.fillStyle = 'rgba(232,226,216,0.7)';
      for (let i = 0; i < 4; i++) ctx.fillRect(x + flip * (8 + i * 2), gy - 1 + (i % 2), 2, 1);
    } else if (kind === 'backshell') {
      ctx.fillStyle = '#b8b3ab';
      ctx.fillRect(x - 5, gy - 4, 10, 4);
      ctx.fillRect(x - 3, gy - 6, 6, 2);
      ctx.fillStyle = '#6e6a64';
      ctx.fillRect(x - 5, gy - 1, 10, 1);
    } else if (kind === 'heatshield') {
      ctx.fillStyle = '#4a2c22';
      ctx.fillRect(x - 7, gy - 2, 14, 3);
      ctx.fillStyle = '#6d4334';
      ctx.fillRect(x - 5, gy - 3, 10, 1);
    } else if (kind === 'airbag') {
      ctx.fillStyle = '#d9c9a3';
      for (let i = 0; i < 3; i++) ctx.fillRect(x - 7 + i * 5, gy - 3 - (i % 2), 4, 4);
    }
    ctx.restore();
  }

  // A mound of disturbed soil. Real ones (something buried) are bigger, with clods and stones around,
  // and now and then a metal glint catches the Sun. Fake ones are plain soil, so the player still searches.
  function drawMound(ctx, x, gy, pal, dug, seed, real, light) {
    const wid = real ? 26 : 13;
    const steps = real ? 4 : 2; // real mounds stand ~8 px high, fake ones ~4 px
    for (let i = 0; i < steps; i++) {
      ctx.fillStyle = i % 2 ? pal.groundLight : '#d9925f'; // fresh, lighter soil than the ground around
      ctx.fillRect(x - wid + i * 5, gy - 2 - i * 2, (wid - i * 5) * 2, 2);
    }
    ctx.fillStyle = pal.groundDark;
    for (let i = 0; i < (real ? 9 : 3); i++) {
      const cx = x - wid + Math.round(rnd(seed + i) * wid * 2);
      ctx.fillRect(cx, gy - 1 - Math.round(rnd(seed + i * 3) * 4), 2, 2); // clods
    }
    if (real) {
      ctx.fillStyle = pal.rock;
      ctx.fillRect(x - wid - 5, gy - 3, 5, 4);
      ctx.fillRect(x + wid + 1, gy - 2, 4, 3);
      if (dug < 2) {
        // a corner of metal sticking out of the sand
        ctx.fillStyle = '#8f949c';
        ctx.fillRect(x + 4, gy - 12, 5, 4);
        ctx.fillRect(x + 7, gy - 14, 2, 2);
        ctx.fillStyle = '#4a4f57';
        ctx.fillRect(x + 4, gy - 9, 5, 1);
      }
    }
    if (dug > 0) {
      ctx.fillStyle = '#2a140d';
      ctx.fillRect(x - 3 - dug * 2, gy - 1, 6 + dug * 4, 4);
      ctx.fillStyle = '#9a9690';
      if (dug >= 2 && real) ctx.fillRect(x - 2, gy - 5, 7, 4); // more metal shows through
    }
    if (real && light.dark < 0.6) {
      const phase = (performance.now() / 1000 + rnd(seed) * 2) % 1.8;
      if (phase < 0.35) {
        ctx.save();
        ctx.globalAlpha = (1 - phase / 0.35) * (1 - light.dark);
        ctx.fillStyle = '#fff6d8';
        const gx = x + 7;
        const gyy = gy - 15;
        ctx.fillRect(gx, gyy - 4, 1, 9);
        ctx.fillRect(gx - 4, gyy, 9, 1);
        ctx.fillRect(gx - 1, gyy - 1, 3, 3);
        ctx.restore();
      }
    }
  }



  // Uneven ground: small impact craters (raised rim, dark floor), stones and the odd boulder.
  // Placed by world position, so they stay put while the camera moves; kept clear of the clues.
  const clueSpotsM = () => origCases().flatMap((c) => [c.distanceM, ...debrisFor(c).map((d) => d.m)]).concat(P.fakeMoundsM, [P.tubeEntranceM, P.tubeEntranceM + 40], P.tubeTerrain.map((f) => P.tubeEntranceM + f.m));
  function drawRoughGround(ctx, s, palAt, camX, w, gy, alpha) {
    const cell = 150;
    const spots = clueSpotsM();
    const first = Math.floor(camX / cell) - 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = first; i < first + w / cell + 3; i++) {
      if (i < 1) continue; // keep the base area clean
      const px = i * cell + Math.round(rnd(i * 13.7) * 90);
      const m = Surf.pxToM(px);
      if (m > P.worldEndM || spots.some((sm) => Math.abs(sm - m) < 45)) continue;
      const pal = palAt(m);
      const x = Math.round(px - camX);
      const r = rnd(i * 7.1);
      if (r < 0.55) {
        const half = 9 + Math.round(rnd(i * 3.3) * 18);
        const depth = 3 + Math.round(rnd(i * 5.9) * 4);
        ctx.fillStyle = pal.groundLight; // raised rim
        ctx.fillRect(x - half - 3, gy - 2, 4, 2);
        ctx.fillRect(x + half - 1, gy - 2, 4, 2);
        ctx.fillStyle = pal.groundDark; // the dip
        ctx.fillRect(x - half, gy, half * 2, depth);
        ctx.fillRect(x - half + 3, gy + depth, half * 2 - 6, 2);
        ctx.fillStyle = pal.rock;
        ctx.fillRect(x - half, gy, half * 2, 1);
      } else if (r < 0.8) {
        ctx.fillStyle = pal.rock; // a boulder
        ctx.fillRect(x - 6, gy - 7, 12, 7);
        ctx.fillRect(x - 4, gy - 9, 7, 2);
        ctx.fillStyle = pal.groundLight;
        ctx.fillRect(x - 4, gy - 9, 3, 1);
      }
      ctx.fillStyle = pal.rock; // pebbles
      for (let k = 0; k < 3; k++) ctx.fillRect(x + 30 + Math.round(rnd(i + k * 9.1) * 60), gy - 1, 2 + (k % 2), 2);
    }
    ctx.restore();
  }

  function drawClues(ctx, s, minute, camX, w, gy) {
    // Colours of the zone each clue lies in, so a mound never stands out from the ground around it.
    const palAt = (m) => {
      const z = zoneAt(m);
      const own = GROUND_PAL[z.ground];
      if (!own) return S.Art.palette(z.site || s.design.landingSiteId, minute);
      return { groundLight: atNight(own.groundLight, minute), groundDark: atNight(own.groundDark, minute), rock: atNight(own.rock, minute) };
    };
    const light = S.Art.lighting(minute);
    const dark = light.dark;
    const alpha = 1 - dark * 0.55;
    drawRoughGround(ctx, s, palAt, camX, w, gy, alpha);
    const toX = (m) => Math.round(Surf.mToPx(m) - camX);
    const st = proto(s);

    for (const c of origCases()) {
      const found = discovered(s, c);
      // Rover tyre tracks: two broken, wind-worn lines ending at the wreck.
      if (isRover(c)) {
        const x0 = toX(c.distanceM - 230);
        const x1 = toX(c.distanceM - (found ? 30 : 6));
        if (x1 > -10 && x0 < w + 10) {
          ctx.save();
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillStyle = palAt(c.distanceM).groundDark;
          const seed = seedOf(c.id);
          for (let x = Math.max(x0, -4); x < Math.min(x1, w + 4); x += 3) {
            const worldX = x + Math.round(camX);
            if (rnd(seed + worldX * 0.37) < 0.22) continue; // gaps the wind has filled in
            const wob = Math.round(Math.sin(worldX * 0.03 + seed) * 1);
            ctx.fillRect(x, gy + 3 + wob, 2, 1);
            ctx.fillRect(x, gy + 7 + wob, 2, 1);
          }
          ctx.restore();
        }
      }
      for (const d of debrisFor(c)) {
        const x = toX(d.m);
        if (x > -20 && x < w + 20) drawDebris(ctx, d.kind, x, gy + 1, d.seed, alpha);
      }
      if (!found) {
        const x = toX(c.distanceM);
        if (x > -30 && x < w + 30) drawMound(ctx, x, gy, palAt(c.distanceM), st.dig[c.id] || 0, seedOf(c.id), true, light);
      }
    }
    P.fakeMoundsM.forEach((m, i) => {
      const x = toX(m);
      if (x > -30 && x < w + 30) drawMound(ctx, x, gy, palAt(m), st.dig['fake' + i] || 0, 900 + i, false, light);
    });
    for (const f of P.tubeTerrain) {
      const fx = toX(P.tubeEntranceM + f.m);
      if (fx > -f.w && fx < w + f.w) drawLavaFeature(ctx, f, fx, gy, minute, alpha);
    }
    const tx = toX(P.tubeEntranceM);
    if (tx > -90 && tx < w + 90) drawTubeMouth(ctx, tx, gy, minute);
    // the scout rover's tracks on the lava plain lead into the tube mouth
    drawTracks(ctx, P.tubeEntranceM - 240, P.tubeEntranceM - 6, camX, w, gy, palAt(P.tubeEntranceM).groundDark, alpha * 0.85, 77);
  }

  /* ---------------- Digging (↓ or S) ---------------- */
  function dig() {
    const G = S.Game;
    if (!G || G.scene !== 'world' || S.UI.topModal() || (S.isMinigameOpen && S.isMinigameOpen())) return;
    const s = S.getState();
    const body = Surf.body;
    if (tube.active || tube.busy || s.player.inside || !body.onGround || body.actionT > 0 || s.gameOver) return;
    hideDigTip();
    body.actionT = 0.7;
    S.bus.emit('fx:puff', { px: body.px + s.player.facing * 6, size: 2 });
    S.bus.emit('audio:play', 'land');
    S.Sim.step(s, P.digGameMinutes); // digging takes time: suit O2 and battery go down
    const st = proto(s);
    const near = origCases().find((c) => !discovered(s, c) && Math.abs(s.player.x - c.distanceM) <= P.digRangeM);
    if (near) {
      const n = (st.dig[near.id] = (st.dig[near.id] || 0) + 1);
      if (n >= P.digsNeeded) {
        s.forensics[near.id].discovered = true;
        S.FX.shake = 0.4;
        S.bus.emit('fx:float', { px: body.px, text: t('proto.dig.found', { name: near.name }), tone: 'ok' });
        S.bus.emit('forensics:discovered', { id: near.id });
      } else {
        const key = n === 2 ? 'proto.dig.metal' : 'proto.dig.more';
        S.bus.emit('fx:float', { px: body.px, text: t(key, { n, total: P.digsNeeded }), tone: n === 2 ? 'warn' : 'ok' });
      }
      return;
    }
    const fi = P.fakeMoundsM.findIndex((m) => Math.abs(s.player.x - m) <= P.digRangeM);
    if (fi >= 0) st.dig['fake' + fi] = Math.min(2, (st.dig['fake' + fi] || 0) + 1);
    S.bus.emit('fx:float', { px: body.px, text: t('proto.dig.sand'), tone: 'warn' });
  }
  // No on-screen prompt over mounds. E digs when the astronaut stands on one and nothing else is in reach.
  const onMound = (s) =>
    !tube.active &&
    origCases().some((c) => !discovered(s, c) && Math.abs(s.player.x - c.distanceM) <= P.digRangeM) ||
    P.fakeMoundsM.some((m) => Math.abs(s.player.x - m) <= P.digRangeM);
  // S.Game is created by main.js, which loads after this file: patch E once the page has loaded.
  window.addEventListener('load', () => {
    if (!S.Game) return;
    const origInteract = S.Game.interact;
    S.Game.interact = function () {
      const s = S.getState();
      if (!S.UI.topModal() && !s.player.inside && atTubeMouth(s)) return toggleTube();
      if (tube.active && !tube.busy && !S.UI.topModal()) {
        const part = partAt(s);
        if (part) photoPart(part);
        return;
      }
      if (tube.busy) return;
      if (!(S.HUD && S.HUD.prompt) && !S.UI.topModal() && !s.player.inside && onMound(s)) return dig();
      return origInteract.apply(this, arguments);
    };
  });

  // ↑ or W at the tube mouth goes in or out (captured before the game's jump).
  window.addEventListener(
    'keydown',
    (e) => {
      if ((e.code !== 'ArrowUp' && e.code !== 'KeyW') || e.repeat) return;
      const s = S.getState && S.getState();
      if (!s || !S.Game || S.Game.scene !== 'world' || S.UI.topModal() || s.player.inside || !atTubeMouth(s)) return;
      e.preventDefault();
      e.stopPropagation();
      toggleTube();
    },
    true
  );

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'KeyS' || e.code === 'ArrowDown') && !e.repeat) {
      dig();
      e.preventDefault();
    }
  });

  /* ---------------- Entering a zone: name + short dust gust (visual only) ---------------- */
  let gustUntil = 0;
  let reactNear = null;
  let tubeNear = null; // a scout-rover part in reach, not photographed yet
  const origUpdate = Surf.update;
  Surf.update = function (s) {
    const wasOnGround = Surf.body.onGround;
    const r = origUpdate.apply(this, arguments);
    const st = proto(s);
    if (wasOnGround && !Surf.body.onGround && !st.jumpFact) {
      st.jumpFact = true; // first jump: show what Mars gravity did, computed from the same data the physics uses
      const C = S.DATA.constants.marsGravity;
      const v = Surf.jumpVelocityPx() / S.DATA.gameplay.spritePxPerMeter; // take-off speed, m/s
      S.UI.toast(
        t('proto.jump', {
          r: num(C.ratioToEarth, 2),
          h: num((v * v) / (2 * C.value), 1),
          t: num((2 * v) / C.value, 1),
          he: num((v * v) / (2 * C.earthValue), 1),
          te: num((2 * v) / C.earthValue, 1)
        }),
        'info',
        8000
      );
    }
    if (tube.active) {
      // underground: the tube runs from its mouth eastwards; solid rock at both ends
      const lo = P.tubeEntranceM - 6;
      const hi = P.tubeEntranceM + P.tubeLengthM;
      if (s.player.x < lo || s.player.x > hi) {
        s.player.x = Math.max(lo, Math.min(hi, s.player.x));
        Surf.body.px = Surf.mToPx(s.player.x);
      }
      reactNear = null;
      // next to a part not photographed yet: kneel, scanner ping, "!" (same as at a buried wreck)
      st.tubeFinds = st.tubeFinds || {};
      const part = partAt(s);
      tubeNear = part && !st.tubeFinds[part.id] ? part : null;
      if (tubeNear && st.reactId !== 'tube_' + tubeNear.id) {
        st.reactId = 'tube_' + tubeNear.id;
        Surf.body.actionT = Math.max(Surf.body.actionT, 0.8);
        S.bus.emit('audio:play', 'scan');
        if (!st.tubePhotoTip) {
          st.tubePhotoTip = true;
          showTip('proto.tube.photo_tip_title', 'proto.tube.photo_tip_body', '📷');
        }
      }
      if (!tubeNear && st.reactId && String(st.reactId).startsWith('tube_')) st.reactId = null;
      return r;
    }
    tubeNear = null;
    if (!st.tubeTip && Math.abs(s.player.x - P.tubeEntranceM) <= P.tubeEnterRangeM * 2) {
      st.tubeTip = true;
      showTip('proto.tube.tip_title', 'proto.tube.tip_body', '◐');
    }
    const z = zoneAt(s.player.x);
    if (!st.zonesSeen[z.id]) {
      st.zonesSeen[z.id] = true;
      gustUntil = performance.now() + P.gustSeconds * 1000;
      S.UI.toast(t('proto.zone.' + z.id), 'info', 4500);
    }
    // Near a buried wreck (not a fake mound): kneel, scanner ping, "!" over the helmet.
    const near = origCases().find((c) => !discovered(s, c) && Math.abs(s.player.x - c.distanceM) <= P.reactRangeM);
    reactNear = near || null;
    if (near && st.reactId !== near.id) {
      st.reactId = near.id;
      Surf.body.actionT = Math.max(Surf.body.actionT, 0.8);
      S.bus.emit('audio:play', 'scan');
      if (!st.digTip) {
        st.digTip = true; // the "how to dig" card: only at the first buried wreck, so the player learns it there
        showDigTip();
      }
    }
    if (!near) st.reactId = null;
    return r;
  };

  // One-time card under the objective card (top right): how to dig. Gone after a few seconds or the first dig.
  let tipEl = null;
  const tipCss = document.createElement('style');
  tipCss.textContent =
    '.proto-tip{position:absolute;right:2.2%;top:35%;z-index:30;max-width:31%;display:grid;gap:4px;' +
    'background:rgba(22,20,24,.94);border-left:3px solid #3fe0e6;border-radius:10px;' +
    'padding:calc(10px * var(--k,1)) calc(14px * var(--k,1));color:#f2ebe2;' +
    'font:calc(15px * var(--k,1))/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .5s}' +
    '.proto-tip b{color:#3fe0e6;letter-spacing:.08em;text-transform:uppercase;font-size:calc(14px * var(--k,1))}' +
    '.proto-tip kbd{display:inline-block;min-width:1.4em;padding:0 .3em;border:1px solid #6b7280;border-radius:4px;text-align:center;font:inherit}' +
    '.proto-tip.out{opacity:0}';
  document.head.appendChild(tipCss);
  const showDigTip = () => showTip('proto.tip.title', 'proto.tip.body', '⛏');
  function showTip(titleKey, bodyKey, icon) {
    const stage = document.getElementById('stage');
    if (!stage) return;
    if (tipEl) tipEl.remove();
    tipEl = document.createElement('div');
    tipEl.className = 'proto-tip';
    tipEl.setAttribute('role', 'status');
    const body = S.util.escape(t(bodyKey)).replace(/(↑|↓)|\b([SEW])\b/g, (m) => '<kbd>' + m + '</kbd>'); // keys as key caps
    tipEl.innerHTML = '<b>' + icon + ' ' + S.util.escape(t(titleKey)) + '</b><span>' + body + '</span>';
    stage.appendChild(tipEl);
    const el = tipEl;
    setTimeout(() => tipEl === el && hideDigTip(), P.digTipSeconds * 1000);
  }
  function hideDigTip() {
    if (!tipEl) return;
    const el = tipEl;
    tipEl = null;
    el.classList.add('out');
    setTimeout(() => el.remove(), 600);
  }
  /* ================================================================ */
  /* LAVA TUBE                                                         */
  /* ================================================================ */
  const atTubeMouth = (s) => !tube.busy && Math.abs(s.player.x - P.tubeEntranceM) <= P.tubeEnterRangeM;

  // Going in or out: the screen fades to black, the scene changes while it is black, then it fades back.
  let blackEl = null;
  function toggleTube() {
    const stage = document.getElementById('stage');
    if (tube.busy || !stage) return;
    tube.busy = true;
    hideDigTip();
    if (!blackEl) {
      blackEl = document.createElement('div');
      blackEl.style.cssText = 'position:absolute;inset:0;z-index:35;background:#000;opacity:0;pointer-events:none;transition:opacity ' + P.tubeFadeMs + 'ms ease';
      stage.appendChild(blackEl);
    }
    S.bus.emit('audio:play', 'land');
    requestAnimationFrame(() => (blackEl.style.opacity = '1'));
    setTimeout(() => {
      const s = S.getState();
      const entering = !tube.active;
      tube.active = entering;
      s.player.x = entering ? P.tubeEntranceM + 4 : P.tubeEntranceM - 4;
      Surf.body.px = Surf.mToPx(s.player.x);
      S.FX.camX = Surf.body.px - 640 * 0.42;
      setTimeout(() => {
        blackEl.style.opacity = '0';
        setTimeout(() => (tube.busy = false), P.tubeFadeMs);
        const st = proto(s);
        if (entering && !st.tubeSeen) {
          st.tubeSeen = true;
          S.UI.toast(t('proto.tube.inside'), 'info', 8000);
          setTimeout(() => showTip('proto.tube.tip_title', 'proto.tube.exit_tip', '◐'), 1500);
        }
      }, 450); // a moment of full black
    }, P.tubeFadeMs);
  }

  // Ground features around the tube. Pit: the ground sags into a bowl with crumbled edges, loose blocks on
  // its floor. Tumulus: a low dome of basalt with a crack along its top and a lit upper edge.
  function drawLavaFeature(ctx, f, x, gy, minute, alpha) {
    const half = Math.round(f.w / 2);
    const seed = f.m * 1.37;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (f.kind === 'pit') {
      const rim = atNight('#6a5048', minute);
      const wall = atNight('#2e2224', minute);
      const floor = atNight('#1c1416', minute);
      for (let dx = -half; dx <= half; dx += 2) {
        const u = dx / half;
        const d = Math.round(f.h * Math.sqrt(Math.max(0, 1 - u * u)) + (rnd(seed + dx) - 0.5) * 2);
        ctx.fillStyle = wall; // the far wall of the bowl
        ctx.fillRect(x + dx, gy - 1, 2, Math.max(1, d));
        ctx.fillStyle = floor;
        ctx.fillRect(x + dx, gy - 1 + Math.max(1, d) - 2, 2, 3);
      }
      ctx.fillStyle = rim; // crumbled, slightly raised lips
      ctx.fillRect(x - half - 6, gy - 2, 7, 2);
      ctx.fillRect(x + half - 1, gy - 2, 7, 2);
      ctx.fillRect(x - half - 3, gy - 3, 3, 1);
      ctx.fillStyle = atNight('#3e2e30', minute); // loose blocks fallen in
      for (let k = 0; k < 3; k++) {
        const bx = x - half / 2 + Math.round(rnd(seed + k * 5) * half);
        ctx.fillRect(bx, gy + Math.round(f.h * 0.5), 3 + k, 2 + (k % 2));
      }
    } else {
      const body = atNight('#3e2e30', minute);
      const lit = atNight('#86584a', minute);
      const crack = atNight('#160f11', minute);
      for (let dx = -half; dx <= half; dx += 2) {
        const u = dx / half;
        const hh = Math.round(f.h * Math.pow(Math.max(0, 1 - u * u), 0.6) + (rnd(seed + dx) - 0.5) * 1.5);
        if (hh <= 0) continue;
        ctx.fillStyle = body;
        ctx.fillRect(x + dx, gy - hh, 2, hh + 1);
        ctx.fillStyle = lit;
        ctx.fillRect(x + dx, gy - hh, 2, 1);
        if (Math.abs(u) < 0.22) {
          ctx.fillStyle = crack; // the crack along the top where the crust split as it swelled
          ctx.fillRect(x + dx, gy - hh, 2, Math.max(2, Math.round(hh * 0.45)));
        }
      }
      ctx.fillStyle = atNight('#2e2224', minute); // broken slabs at the foot
      ctx.fillRect(x - half - 5, gy - 3, 6, 3);
      ctx.fillRect(x + half + 1, gy - 2, 5, 2);
    }
    ctx.restore();
  }

  // On the surface: a low basalt rise with the dark, arched mouth of the tube at ground level.
  function drawTubeMouth(ctx, x, gy, minute) {
    const body = atNight('#3a2a2e', minute);
    const lit = atNight('#7a5248', minute);
    for (let dx = -78; dx <= 78; dx += 2) {
      const u = dx / 78;
      const hgt = Math.round(40 * Math.pow(Math.max(0, 1 - u * u), 0.8) + Math.sin(dx * 0.3) * 1.5);
      ctx.fillStyle = body;
      ctx.fillRect(x + dx, gy - hgt, 2, hgt + 2);
      ctx.fillStyle = lit;
      ctx.fillRect(x + dx, gy - hgt, 2, 1);
    }
    // the arch: black inside, a lighter rim, a few lava drips hanging from the lip
    for (let dx = -22; dx <= 22; dx += 1) {
      const archH = Math.round(30 * Math.sqrt(Math.max(0, 1 - (dx / 22) * (dx / 22))));
      ctx.fillStyle = '#07040a';
      ctx.fillRect(x + dx, gy - archH, 1, archH + 1);
      ctx.fillStyle = atNight('#5a3c38', minute);
      ctx.fillRect(x + dx, gy - archH - 2, 1, 2);
    }
    ctx.fillStyle = '#150c10'; // depth: the floor sloping down into the dark
    ctx.fillRect(x - 14, gy - 6, 28, 7);
    ctx.fillStyle = atNight('#2a1c1e', minute);
    [[-28, 6], [24, 5], [-34, 3], [30, 4]].forEach(([dx, s]) => ctx.fillRect(x + dx, gy - s, s + 3, s)); // fallen blocks
  }

  // Underground: the tube's back wall and roof. Lava tubes keep "bathtub rings" on the walls (levels where
  // the lava stood), lava drips hanging from the roof, and a skylight where part of the roof fell in.
  const tubeX = (m) => Math.round(Surf.mToPx(m) - S.FX.camX);
  const skylightM = () => P.tubeEntranceM + P.tubeLengthM - 70;
  function roofY(wx) {
    return 64 + Math.round(Math.sin(wx * 0.006) * 14 + Math.sin(wx * 0.021) * 5);
  }
  function drawCaveBack(ctx, siteId, minute, camX, w, h) {
    ctx.fillStyle = '#130b0c';
    ctx.fillRect(0, 0, w, h);
    // back wall texture (moves a bit slower than the floor: depth)
    const par = camX * 0.6;
    for (let i = Math.floor(par / 30) - 1; i < Math.floor(par / 30) + w / 30 + 2; i++) {
      for (let row = 0; row < 7; row++) {
        const r = rnd(i * 5.3 + row * 17);
        if (r < 0.35) continue;
        ctx.fillStyle = r < 0.7 ? '#1d1213' : '#251718';
        ctx.fillRect(Math.round(i * 30 - par + rnd(i + row) * 14), 90 + row * 28 + Math.round(rnd(i * 2 + row) * 10), 8 + Math.round(r * 16), 4 + Math.round(r * 6));
      }
    }
    ctx.fillStyle = '#3a2321'; // bathtub rings: old lava levels along the wall
    for (const y0 of [196, 228, 258]) {
      for (let x = 0; x < w; x += 2) ctx.fillRect(x, Math.round(y0 + Math.sin((x + par) * 0.02 + y0) * 2), 2, 1);
    }
    // the roof, with lava drips
    const sky = tubeX(skylightM());
    const pal = S.Art.palette(siteId, minute);
    for (let x = 0; x < w; x += 2) {
      const wx = x + camX;
      const y = roofY(wx);
      const open = Math.abs(x - sky) < 34; // skylight: the roof fell in here
      if (open) {
        const g = ctx.createLinearGradient(0, 0, 0, y + 10);
        g.addColorStop(0, pal.skyTop);
        g.addColorStop(1, pal.skyLow);
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 2, y + 6);
        continue;
      }
      ctx.fillStyle = '#0a0607';
      ctx.fillRect(x, 0, 2, y);
      ctx.fillStyle = '#2a1a19';
      ctx.fillRect(x, y, 2, 1);
      if (rnd(Math.floor(wx / 2) * 0.73) < 0.09) {
        const len = 3 + Math.round(rnd(wx * 0.37) * 7);
        ctx.fillStyle = '#1f1314';
        ctx.fillRect(x, y, 2, len);
        ctx.fillRect(x, y + len, 1, 2);
      }
    }
    // rock at both ends of the tube: the wall around the way out (ragged edge), and the end wall
    const mouth = tubeX(P.tubeEntranceM);
    const GYc = Surf.GROUND_Y;
    ctx.fillStyle = '#0a0607';
    for (let y = 0; y < h; y += 3) {
      const edge = mouth - 40 + Math.round(Math.sin(y * 0.08) * 6 + rnd(y * 0.71) * 6);
      if (edge > 0) ctx.fillRect(0, y, edge, 3);
    }
    // the way out: an arched opening at the top of the rubble slope, daylight and sky beyond it
    const ox = mouth - 34;
    const oy = GYc - 28;
    for (let dx = -16; dx <= 16; dx++) {
      const hh = Math.round(26 * Math.sqrt(Math.max(0, 1 - (dx / 16) * (dx / 16))));
      ctx.fillStyle = pal.skyLow; // sky
      ctx.fillRect(ox + dx, oy - hh, 1, hh);
      ctx.fillStyle = pal.groundDark; // the far horizon, seen through the opening
      ctx.fillRect(ox + dx, oy - 9 + Math.round(Math.sin(dx * 0.4)), 1, 3);
      ctx.fillStyle = pal.groundLight;
      ctx.fillRect(ox + dx, oy - 6, 1, 6);
      ctx.fillStyle = '#1a0f0f'; // thick rock lip around the opening
      ctx.fillRect(ox + dx, oy - hh - 4, 1, 4);
    }
    ctx.fillRect(ox - 20, oy - 14, 4, 16);
    ctx.fillRect(ox + 17, oy - 14, 4, 16);
    // daylight spilling down the rubble slope below the opening
    const spill = ctx.createLinearGradient(ox, oy, ox + 40, GYc);
    spill.addColorStop(0, 'rgba(255, 190, 140, 0.35)');
    spill.addColorStop(1, 'rgba(255, 190, 140, 0)');
    ctx.fillStyle = spill;
    ctx.beginPath();
    ctx.moveTo(ox - 14, oy);
    ctx.lineTo(ox + 14, oy);
    ctx.lineTo(ox + 60, GYc + 4);
    ctx.lineTo(ox + 4, GYc + 4);
    ctx.closePath();
    ctx.fill();
    const end = tubeX(P.tubeEntranceM + P.tubeLengthM + 12);
    ctx.fillStyle = '#0a0607';
    ctx.fillRect(end, 0, Math.max(0, w - end), h);
  }
  function drawCaveFloor(ctx, minute, camX, w, h, gy) {
    ctx.fillStyle = '#1d1314';
    ctx.fillRect(0, gy, w, h - gy);
    ctx.fillStyle = '#3b2724';
    ctx.fillRect(0, gy, w, 2);
    const cell = 34; // breakdown: blocks that fell from the roof
    const start = Math.floor(camX / cell) - 1;
    for (let i = start; i < start + w / cell + 2; i++) {
      const r = rnd(i * 6.1);
      if (r < 0.5) continue;
      const x = Math.round(i * cell - camX + rnd(i * 2.2) * 14);
      const s = 3 + Math.round(r * 7);
      ctx.fillStyle = '#2c1d1c';
      ctx.fillRect(x, gy - s + 1, s + 4, s);
      ctx.fillStyle = '#4a302b';
      ctx.fillRect(x, gy - s + 1, s + 4, 1);
    }
    const sky = tubeX(skylightM()); // sand and dust blown in under the skylight
    ctx.fillStyle = '#7a4632';
    for (let dx = -60; dx < 60; dx += 2) ctx.fillRect(sky + dx, gy - Math.round(6 * Math.cos((dx / 60) * Math.PI / 2)), 2, 7);
    const mouth = tubeX(P.tubeEntranceM); // rubble slope up to the mouth
    ctx.fillStyle = '#2c1d1c';
    for (let dx = -40; dx < 0; dx += 2) ctx.fillRect(mouth + dx, gy - Math.round((-dx / 40) * 26), 2, 30);
    // dips and raised humps on the tube floor too, kept clear of the rover parts
    for (const f of TUBE_FLOOR) {
      const fx = tubeX(P.tubeEntranceM + f.m);
      if (fx > -f.w && fx < w + f.w) drawLavaFeature(ctx, f, fx, gy, minute, 1);
    }
    // the scout rover's tracks along the floor, up to where it got stuck
    drawTracks(ctx, P.tubeEntranceM, P.tubeEntranceM + tubePart('body').m - 22, camX, w, gy, '#3a2826', 0.9, 77);
    const st = proto(S.getState());
    for (const p of P.tubeParts) {
      const x = tubeX(P.tubeEntranceM + p.m);
      if (x > -60 && x < w + 60) drawPart(ctx, p.id, x, gy + 1, 1, st.tubeFinds && st.tubeFinds[p.id]);
    }
  }

  const TUBE_FLOOR = [
    { m: 40, kind: 'pit', w: 34, h: 7 },
    { m: 125, kind: 'pit', w: 40, h: 8 },
    { m: 215, kind: 'tumulus', w: 50, h: 11 },
    { m: 305, kind: 'pit', w: 44, h: 9 },
    { m: 415, kind: 'tumulus', w: 40, h: 9 }
  ];
  const tubePart = (id) => P.tubeParts.find((p) => p.id === id);
  const partAt = (s) =>
    P.tubeParts.find((p) => Math.abs(s.player.x - (P.tubeEntranceM + p.m)) <= P.tubePartRangeM) || null;

  // Two broken wheel-track lines from world metre a to b (dust has filled some gaps).
  function drawTracks(ctx, aM, bM, camX, w, gy, col, alpha, seed) {
    const x0 = Math.round(Surf.mToPx(aM) - camX);
    const x1 = Math.round(Surf.mToPx(bM) - camX);
    if (x1 < -10 || x0 > w + 10) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = col;
    for (let x = Math.max(x0, -4); x < Math.min(x1, w + 4); x += 3) {
      const worldX = x + Math.round(camX);
      if (rnd(seed + worldX * 0.37) < 0.22) continue;
      const wob = Math.round(Math.sin(worldX * 0.03 + seed));
      ctx.fillRect(x, gy + 3 + wob, 2, 1);
      ctx.fillRect(x, gy + 7 + wob, 2, 1);
    }
    ctx.restore();
  }

  // Parts of the fictional scout rover, pixel art at scale k (1 in the world, bigger in the camera).
  // Photographed parts get a small yellow tag, like evidence markers.
  function drawPart(c, kind, x, gy, k, tagged) {
    const R = (dx, dy, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(Math.round(x + dx * k), Math.round(gy + dy * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
    };
    const metal = '#8d939b';
    const light = '#c3c8cf';
    const dark = '#3a3d42';
    if (kind === 'wheel') {
      R(-6, -11, 12, 10, metal); // the wheel, lying on its side, seen edge-on and a bit from above
      R(-5, -12, 10, 1, light);
      R(-7, -10, 1, 8, dark);
      R(6, -10, 1, 8, dark);
      for (let i = 0; i < 4; i++) R(-6 + i * 4, -11, 1, 10, '#6c727a'); // grousers (cleats)
      R(-2, -8, 4, 4, dark);
      R(-1, -7, 2, 2, '#c9a23a');
      R(5, -3, 6, 2, '#6c727a'); // a bent bit of the suspension still attached
    } else if (kind === 'panel') {
      R(-13, -4, 26, 4, '#22335c');
      for (let i = 0; i < 6; i++) R(-12 + i * 4, -4, 3, 1, '#5b77b3');
      R(-13, 0, 26, 1, light);
      R(10, -6, 5, 2, '#22335c'); // a cracked corner sticking up
      R(4, -4, 1, 4, '#9fb3d9'); // the crack
    } else if (kind === 'mast') {
      R(-1, -2, 14, 2, metal); // the mast, snapped, lying on the floor
      R(-8, -8, 9, 7, '#d6cfc2'); // camera head
      R(-7, -6, 2, 2, '#14161a'); // two lenses
      R(-3, -6, 2, 2, '#14161a');
      R(-8, -8, 9, 1, '#efe9de');
      R(12, -3, 2, 3, dark);
    } else if (kind === 'antenna') {
      R(-9, -4, 18, 2, '#d8d4cc'); // dish, tipped over
      R(-7, -6, 14, 2, '#cfcac0');
      R(-4, -7, 8, 1, '#bdb8ae');
      R(0, -11, 1, 5, metal); // feed horn
      R(-1, -12, 3, 1, metal);
      R(2, -6, 1, 4, dark); // crack through the dish
      R(9, -2, 6, 2, metal); // torn-off gimbal arm
    } else if (kind === 'body') {
      R(-34, -12, 12, 12, '#2c1d1c'); // fallen block behind
      R(-24, -16, 48, 3, '#22335c'); // solar deck, tilted a little by the blocks
      R(-22, -13, 44, 8, '#b9b2a6'); // body
      R(-22, -13, 44, 1, '#d8d2c6');
      R(-20, -5, 8, 5, dark); // wheels (one is missing: we found it at the mouth)
      R(12, -5, 8, 5, dark);
      R(-3, -4, 6, 3, '#6c727a'); // empty wheel mount (the lost wheel lies near the tube mouth)
      R(14, -20, 2, 4, metal); // stub of the snapped mast
      R(-8, -34, 30, 18, '#2c1d1c'); // block that fell from the roof, pinning it
      R(-8, -34, 30, 1, '#4a302b');
      R(22, -14, 12, 14, '#2c1d1c'); // block in front
    }
    if (tagged) {
      R(8, -16, 4, 6, '#ffcc33'); // evidence tag
      R(9, -15, 2, 1, '#1a1a1a');
    }
  }

  // Darkness with the helmet lamp, the light from the skylight and from the mouth.
  const darkC = document.createElement('canvas');
  darkC.width = 640;
  darkC.height = 360;
  const dctx = darkC.getContext('2d');
  const motes = Array.from({ length: 26 }, (_, i) => ({ x: rnd(i * 3.3), y: rnd(i * 7.7), v: 4 + rnd(i * 1.1) * 8 }));
  function drawCaveLight(ctx, s, now) {
    const minute = s.minute;
    const day = 1 - S.Art.lighting(minute).dark;
    const body = Surf.body;
    const ax = Math.round(body.px - S.FX.camX);
    const ay = Surf.GROUND_Y - 40 - Math.round(body.y);
    const face = s.player.facing || 1;
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, 640, 360);
    dctx.fillStyle = 'rgba(2, 1, 4, 0.93)';
    dctx.fillRect(0, 0, 640, 360);
    dctx.globalCompositeOperation = 'destination-out';
    const glow = dctx.createRadialGradient(ax, ay, 4, ax, ay, 90);
    glow.addColorStop(0, 'rgba(0,0,0,0.95)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = glow;
    dctx.fillRect(ax - 90, ay - 90, 180, 180);
    const beam = dctx.createLinearGradient(ax, 0, ax + face * 300, 0); // helmet lamp beam
    beam.addColorStop(0, 'rgba(0,0,0,0.9)');
    beam.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = beam;
    dctx.beginPath();
    dctx.moveTo(ax + face * 6, ay - 6);
    dctx.lineTo(ax + face * 300, ay - 80);
    dctx.lineTo(ax + face * 300, ay + 90);
    dctx.closePath();
    dctx.fill();
    const sky = tubeX(skylightM());
    if (sky > -120 && sky < 760) {
      const shaft = dctx.createLinearGradient(0, 0, 0, Surf.GROUND_Y);
      shaft.addColorStop(0, 'rgba(0,0,0,' + (0.95 * (0.25 + 0.75 * day)).toFixed(3) + ')');
      shaft.addColorStop(1, 'rgba(0,0,0,' + (0.75 * (0.25 + 0.75 * day)).toFixed(3) + ')');
      dctx.fillStyle = shaft;
      dctx.beginPath();
      dctx.moveTo(sky - 34, 0);
      dctx.lineTo(sky + 34, 0);
      dctx.lineTo(sky + 70, Surf.GROUND_Y + 8);
      dctx.lineTo(sky - 40, Surf.GROUND_Y + 8);
      dctx.closePath();
      dctx.fill();
    }
    const mouth = tubeX(P.tubeEntranceM);
    if (mouth > -100 && mouth < 740) {
      const ml = dctx.createRadialGradient(mouth - 34, Surf.GROUND_Y - 42, 6, mouth - 34, Surf.GROUND_Y - 42, 110);
      ml.addColorStop(0, 'rgba(0,0,0,' + (0.85 * (0.3 + 0.7 * day)).toFixed(3) + ')');
      ml.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = ml;
      dctx.fillRect(mouth - 140, Surf.GROUND_Y - 160, 240, 240);
    }
    ctx.drawImage(darkC, 0, 0);
    // metal parts glint when the helmet lamp sweeps over them (ahead of the astronaut, within the beam)
    const st = proto(s);
    for (const p of P.tubeParts) {
      if (st.tubeFinds && st.tubeFinds[p.id]) continue;
      const px = tubeX(P.tubeEntranceM + p.m);
      const ahead = (px - ax) * face;
      if (ahead < -20 || ahead > 290) continue;
      const phase = (now / 1000 + rnd(p.m) * 3) % 1.6;
      if (phase > 0.3) continue;
      ctx.save();
      ctx.globalAlpha = (1 - phase / 0.3) * 0.9;
      ctx.fillStyle = '#fff6d8';
      const gx = px + 2;
      const gyy = Surf.GROUND_Y - 10;
      ctx.fillRect(gx, gyy - 3, 1, 7);
      ctx.fillRect(gx - 3, gyy, 7, 1);
      ctx.restore();
    }
    // dust drifting in the skylight's light
    if (sky > -60 && sky < 700) {
      ctx.fillStyle = 'rgba(255, 214, 170, ' + (0.55 * day).toFixed(3) + ')';
      for (const d of motes) {
        const y = ((d.y * 300 + (now / 1000) * d.v) % 300) + 2;
        const x = sky - 30 + d.x * 70 + (y / 300) * 30 + Math.sin(now / 900 + d.x * 9) * 3;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
  }

  // Zone gust: drawn here as moving dust streaks over an orange haze. No image, so no seam
  // (the game's own storm tiles vfx_dust_storm twice and the join shows as a vertical line).
  const streaks = Array.from({ length: 150 }, (_, i) => ({ x: rnd(i * 1.7) * 640, y: 40 + rnd(i * 2.9) * 310, v: 260 + rnd(i * 4.3) * 360, len: 6 + Math.round(rnd(i * 6.1) * 26) }));
  let lastGustT = 0;
  const origRender = S.FX.render;
  // The game's own dust storm (K2 event, drawn by K4's effects.js) eases with a fast exponential, so it seems
  // to switch off at once. Here its level ramps evenly over stormFadeSeconds (smoothstepped), and the value
  // is fed through effects.js's own easing step (rate 0.8/s), so effects.js ends up drawing exactly this level.
  let stormRamp = 0;
  function steerStorm(s, dt) {
    if (!(dt > 0) || !s.weather) return;
    const target = s.weather.stormTau > 0 && !tube.active ? 1 : 0; // no storm inside the tube
    const diff = target - stormRamp;
    stormRamp += Math.sign(diff) * Math.min(Math.abs(diff), dt / P.stormFadeSeconds);
    const want = smooth(sat(stormRamp));
    const r = Math.min(1, dt * 0.8);
    if (r < 1) S.FX.stormVis = (want - target * r) / (1 - r);
  }
  // Dust particles: effects.js pulls them down at 6 px/s², so kicked-up dust floats. Here they fall under
  // real Mars gravity (3.73 m/s² × 30 px/m at sprite scale, both from nasa_data.json) and stop on the ground.
  // Suit-leak gas ('leak') is not sand and keeps its own drift.
  const dustG = () => S.DATA.constants.marsGravity.value * S.DATA.gameplay.spritePxPerMeter;
  // Registered on the first frame, after FX.init (main.js) has added its own fx:puff listener, so this one
  // runs second and finds the particles effects.js just made at the end of the list.
  let puffHooked = false;
  function hookPuff() {
    puffHooked = true;
    S.bus.on('fx:puff', (p) => {
      const n = p.size === 2 ? 10 : p.size === 1 ? 6 : 2;
      const list = S.FX.particles || [];
      for (let i = Math.max(0, list.length - n); i < list.length; i++) if (list[i].c !== 'leak') list[i].vy *= P.dustKick;
    });
  }
  function marsDust(dt, after) {
    if (!puffHooked) hookPuff();
    const list = S.FX.particles || [];
    for (const p of list) {
      if (p.c === 'leak') continue;
      if (!after) p.vy += (dustG() - 6) * dt;
      else if (p.y > Surf.GROUND_Y - 1) {
        p.y = Surf.GROUND_Y - 1;
        p.vy = 0;
        p.vx *= 0.3;
      }
    }
  }
  S.FX.render = function (ctx, s, dt) {
    steerStorm(s, dt);
    if (dt > 0) marsDust(dt, false);
    const under = tube.active && !s.player.inside && s.scene === 'surface';
    const tau = s.weather ? s.weather.stormTau : 0;
    if (under && s.weather) s.weather.stormTau = 0; // only while drawing: the simulation keeps its storm
    let r;
    try {
      r = origRender.apply(this, arguments);
    } finally {
      if (under && s.weather) s.weather.stormTau = tau;
    }
    marsDust(0, true);
    const now = performance.now();
    if (under) {
      drawCaveLight(ctx, s, now);
      if (tubeNear) drawReaction(ctx, now);
      lastGustT = now;
      return r;
    }
    const left = (gustUntil - now) / 1000;
    if (left > 0 && !s.player.inside) {
      const dt = Math.min(0.05, (now - (lastGustT || now)) / 1000);
      // builds up and dies down slowly (smoothstep over gustFadeSeconds at each end)
      const k = smooth(sat(Math.min(P.gustSeconds - left, left) / P.gustFadeSeconds));
      ctx.save();
      ctx.globalAlpha = 0.62 * k; // thick, dark dust: the light drops
      ctx.fillStyle = '#6a2c14';
      ctx.fillRect(0, 0, 640, 360);
      ctx.globalAlpha = 0.25 * k;
      ctx.fillStyle = '#2a120a';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#d0905e';
      const shown = Math.round(streaks.length * (0.15 + 0.85 * k)); // fewer streaks at the edges of the gust
      const speed = 0.45 + 0.55 * k; // the wind picks up and calms down
      for (let i = 0; i < streaks.length; i++) {
        const d = streaks[i];
        d.x += d.v * speed * dt;
        if (d.x > 660) d.x = -40;
        if (i >= shown) continue;
        const y = Math.round(d.y + Math.sin((d.x + d.y) * 0.02) * 6);
        ctx.globalAlpha = 0.7 * k;
        ctx.fillRect(Math.round(d.x), y, d.len, 1);
      }
      ctx.restore();
    }
    lastGustT = now;
    if (reactNear && !s.player.inside && !discovered(s, reactNear)) drawReaction(ctx, now);
    return r;
  };

  function drawReaction(ctx, now) {
    const body = Surf.body;
    const img = S.Sprites.get('astronaut_idle');
    const head = Surf.GROUND_Y - (img ? img.height : 48) - Math.round(body.y) - 6;
    const x = Math.round(body.px - S.FX.camX);
    const bob = Math.round(Math.sin(now / 160) * 1.5);
    const y = head - 14 + bob;
    ctx.save();
    ctx.fillStyle = 'rgba(20,18,22,0.9)';
    ctx.fillRect(x - 6, y - 8, 12, 13);
    ctx.fillRect(x - 2, y + 5, 4, 2); // little tail
    ctx.fillStyle = '#ffcc33';
    ctx.fillRect(x - 1, y - 6, 2, 6);
    ctx.fillRect(x - 1, y + 2, 2, 2);
    ctx.restore();
  }

  /* ================================================================ */
  /* FIELD CAM: photo evidence by focusing a handheld camera           */
  /* ================================================================ */
  // Camera body art: src/proto/field_cam.png (team-supplied mock-up, green screen keyed out offline, the
  // viewfinder cut out so the game draws inside it). Loading with <img>/drawImage works under file://.
  const CAM_IMG_W = 1008;
  const CAM_IMG_H = 511;
  const VF = { x: 265, y: 165, w: 426, h: 264 }; // viewfinder hole in the image (px)
  const VIEW_W = 213; // the scene is drawn at half resolution, scaled up pixelated
  const VIEW_H = 132;
  const ALBUM_SIZE = 12;
  const album = []; // canvases of the shots taken this session (canvases, not data URLs: file:// taints them)
  let camOpen = false;
  let curCase = null;
  let autoNext = null;

  const camCss = document.createElement('style');
  camCss.textContent =
    '.modal-pcam .modal-box > *{max-height:none;overflow:visible}' +
    '.pcam{width:calc(880px * var(--k,1));display:flex;flex-direction:column;user-select:none}' +
    '.pcam-stage{position:relative;width:100%;aspect-ratio:' + CAM_IMG_W + '/' + CAM_IMG_H + '}' +
    '.pcam-stage>*{position:absolute}' +
    '.pcam-body{inset:0;width:100%;height:100%;z-index:2;pointer-events:none;image-rendering:auto}' +
    '.pcam-view,.pcam-hud,.pcam-album{left:' + (VF.x / CAM_IMG_W) * 100 + '%;top:' + (VF.y / CAM_IMG_H) * 100 + '%;width:' + (VF.w / CAM_IMG_W) * 100 + '%;height:' + (VF.h / CAM_IMG_H) * 100 + '%}' +
    '.pcam-view{z-index:1;image-rendering:pixelated;background:#000;cursor:ew-resize}' +
    '.pcam-hud{z-index:3;pointer-events:none}' +
    '.pcam-count{position:absolute;right:3%;top:5%;background:rgba(10,12,16,.9);color:#e9eef2;border-radius:3px;' +
    'font:600 calc(15px * var(--k,1))/1.5 ui-monospace,Consolas,monospace;padding:0 .9em;letter-spacing:.06em}' +
    '.pcam-status{position:absolute;left:50%;bottom:4%;transform:translateX(-50%);min-width:52%;text-align:center;' +
    'background:rgba(10,30,26,.9);color:#e8574a;border-radius:2px;font:600 calc(12px * var(--k,1))/1.8 ui-monospace,Consolas,monospace;letter-spacing:.06em}' +
    '.pcam-status.ok{color:#ff6a4f}.pcam-status.saved{color:#7be0a4}' +
    '.pcam-help{position:absolute;left:3%;top:5%;color:rgba(255,255,255,.75);font:calc(11px * var(--k,1))/1.4 system-ui,sans-serif;text-shadow:0 1px 2px #000}' +
    '.pcam-help b{color:#fff;font:600 calc(12px * var(--k,1))/1.5 ui-monospace,Consolas,monospace;letter-spacing:.05em;text-transform:uppercase}' +
    '.pcam-album{z-index:4;display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:6px;background:rgba(8,9,12,.94);align-content:start;overflow:auto}' +
    '.pcam-album canvas{width:100%;image-rendering:pixelated;border:1px solid #3a3d44}' +
    '.pcam-album p{grid-column:1/-1;color:#c9ccd2;text-align:center;font:calc(13px * var(--k,1)) system-ui,sans-serif}' +
    '.pcam-bar{display:flex;align-items:center;justify-content:space-between;gap:1em;background:#15161c;' +
    'padding:calc(7px * var(--k,1)) calc(18px * var(--k,1));border-radius:0 0 8px 8px}' +
    '.pcam-bar button{font:calc(15px * var(--k,1))/1.2 system-ui,sans-serif;color:#e9eef2;background:none;border:0;cursor:pointer;padding:.4em .2em}' +
    '.pcam-bar kbd{font:inherit;color:#9aa3ad;margin-right:.35em}' +
    '.pcam-shoot{min-width:30%;border-radius:4px;padding:.45em 1.2em!important;background:#2c333d!important;color:#cfd6dd!important}' +
    '.pcam-shoot.ready{background:#e8742e!important;color:#fff!important;box-shadow:0 0 0 2px rgba(255,160,90,.35)}' +
    '.pcam-shoot.ready kbd{color:#fff;border:1px solid rgba(255,255,255,.7);border-radius:3px;padding:0 .3em;background:rgba(0,0,0,.15)}' +
    '.pcam-shoot.saved{background:#28473a!important;color:#d8f5e4!important}' +
    '.pcam-flash{position:absolute;inset:0;z-index:5;background:#fff;opacity:0;pointer-events:none;transition:opacity .35s}' +
    '.proto-next{animation:protoPulse .5s ease-in-out infinite alternate}' +
    '@keyframes protoPulse{from{box-shadow:0 0 0 0 rgba(63,224,230,.0)}to{box-shadow:0 0 0 3px rgba(63,224,230,.8)}}' +
    // diagnosis story
    '.proto-story{border-left:3px solid var(--amber,#f0a43a);background:rgba(240,164,58,.07);padding:.5em .7em;border-radius:.3em}' +
    '.proto-story h5{margin:0 0 .3em;font-size:.78em;letter-spacing:.06em;text-transform:uppercase;color:var(--amber,#f0a43a)}' +
    '.proto-story p{margin:0;font-size:.74em;line-height:1.45;color:#e2ddd5}' +
    '.proto-story .proto-ask{margin-top:.45em;color:#3fe0e6;font-style:italic}' +
    '.proto-story.locked p{color:#a9a39b}' +
    '.cat-btn small{display:block;font-weight:400;font-size:.86em;line-height:1.35;opacity:.78;margin-top:.15em;white-space:normal}';
  document.head.appendChild(camCss);

  const camImg = new Image();
  camImg.src = 'src/proto/field_cam.png';

  // What each wreck looks like in the photo, matching its clue text (clue.<id>.photo in story.json):
  // Opportunity under thick red dust, Spirit tilted with its wheels sunk in pale sulphate sand, InSight's
  // panels dusted over with dust-devil tracks nearby, Phoenix in CO2 frost on polygon ground, Beagle 2 as found.
  // (Spirit and Opportunity share one sprite: they were twin rovers, so their state tells them apart.)
  const photoLayer = document.createElement('canvas');
  // A lumpy drift of sand or dust around the wheels: rises from the ground to `rise` px, ragged top, specks.
  function drift(c, W, H, gy, half, rise, body, light) {
    for (let dx = -half; dx <= half; dx += 2) {
      const u = Math.abs(dx) / half;
      const lens = 1 - u * u;
      const top = Math.round(gy + 14 - rise * Math.pow(lens, 0.7) - (Math.sin(dx * 0.37) * 1.5 + rnd(dx) * 2) * lens);
      const bottom = gy + 14 + Math.round(5 * lens); // a lens of sand that thins out into the ground at both ends
      c.fillStyle = body;
      c.fillRect(W / 2 + dx, top, 2, Math.max(0, bottom - top));
      c.fillStyle = light;
      c.fillRect(W / 2 + dx, top, 2, 1);
      if (rnd(dx * 1.7) < 0.25) c.fillRect(W / 2 + dx, top + 3 + Math.round(rnd(dx * 3) * 6), 2, 1);
    }
  }
  const PHOTO_LOOK = {
    opportunity: {
      coat: ['rgba(170, 78, 36, 0.62)', 'rgba(150, 70, 34, 0.38)'],
      haze: 'rgba(190, 112, 60, 0.20)',
      front: (c, W, H, gy) => drift(c, W, H, gy, 74, 8, '#a5532f', '#c4724a') // dust drifted against the wheels
    },
    spirit: {
      tiltDeg: -11.5,
      sink: 9,
      front: (c, W, H, gy) => {
        drift(c, W, H, gy, 82, 15, '#cfae7c', '#e8d2a2'); // bright, loose sulphate-rich sand the wheels broke into
        c.fillStyle = 'rgba(90, 60, 36, 0.5)'; // dug-in ruts
        c.fillRect(W / 2 - 54, gy + 6, 30, 2);
        c.fillRect(W / 2 + 20, gy + 8, 34, 2);
      }
    },
    insight: {
      coat: ['rgba(196, 122, 74, 0.42)', 'rgba(196, 122, 74, 0.12)'],
      ground: (c, W, H, gy) => {
        c.fillStyle = 'rgba(60, 30, 22, 0.45)'; // dark dust-devil tracks across the plain, none over the lander
        for (let x = -10; x < W; x += 2) {
          c.fillRect(x, Math.round(gy + 18 + Math.sin(x * 0.05) * 5), 2, 2);
          if (x < W * 0.28 || x > W * 0.72) c.fillRect(x, Math.round(gy + 30 + Math.sin(x * 0.04 + 2) * 6), 2, 2);
        }
      }
    },
    phoenix: {
      coat: ['rgba(236, 242, 252, 0.22)', 'rgba(236, 242, 252, 0.05)'],
      ground: (c, W, H, gy) => {
        c.fillStyle = 'rgba(70, 44, 36, 0.55)'; // polygon patterned ground of the polar plain
        for (let row = 0; row < 4; row++) {
          const y = gy + 6 + row * 9;
          c.fillRect(0, y, W, 1);
          for (let x = (row * 11) % 22; x < W; x += 22) c.fillRect(x, y - 8, 1, 9);
        }
        c.fillStyle = 'rgba(240, 244, 250, 0.75)'; // CO2 frost patches
        for (let i = 0; i < 14; i++) c.fillRect((i * 37) % W, gy + 4 + ((i * 7) % 36), 6 + (i % 3) * 3, 2);
      },
      front: () => {} // frost patches only, no drift
    },
    beagle2: {}
  };

  // The scene in the viewfinder: the wreck where it was found, in its zone's colours, at noon light
  // softened towards the real time of day (the camera's exposure helps a little at dusk).
  function drawCamScene(c, caseObj, minute, t) {
    const z = zoneAt(caseObj.distanceM);
    const noon = S.Art.palette(z.site || S.getState().design.landingSiteId, 720);
    const own = GROUND_PAL[z.ground];
    const gl = own ? own.groundLight : noon.groundLight;
    const gd = own ? own.groundDark : noon.groundDark;
    const rock = own ? own.rock : noon.rock || gd;
    const W = VIEW_W;
    const H = VIEW_H;
    const ox = Math.sin(t * 1.3) * 1.6 + Math.sin(t * 3.7) * 0.5; // the hands are never perfectly still
    const oy = Math.cos(t * 1.1) * 1.1 + Math.sin(t * 2.9) * 0.4;
    c.save();
    c.translate(ox, oy);
    const sky = c.createLinearGradient(0, -4, 0, H * 0.62);
    sky.addColorStop(0, noon.skyTop);
    sky.addColorStop(1, noon.skyLow);
    c.fillStyle = sky;
    c.fillRect(-6, -6, W + 12, H + 12);
    c.fillStyle = hexMix(gd, noon.skyLow, 0.45); // far hills
    for (let x = -6; x < W + 6; x += 2) {
      const hgt = 10 + Math.sin(x * 0.045 + 1) * 6 + Math.sin(x * 0.13) * 3;
      c.fillRect(x, H * 0.6 - hgt, 2, hgt + 2);
    }
    const gy = Math.round(H * 0.6);
    c.fillStyle = gl;
    c.fillRect(-6, gy, W + 12, H);
    c.fillStyle = gd;
    for (let y = gy + 5; y < H + 6; y += 7) for (let x = ((y * 13) % 17) - 6; x < W + 6; x += 17) c.fillRect(x, y, 6, 1);
    c.fillStyle = rock;
    [[22, 4], [52, 2], [160, 3], [186, 5], [128, 2]].forEach(([x, r], i) => c.fillRect(x, gy + 8 + i * 5, r * 2, r));
    const look = PHOTO_LOOK[caseObj.id] || {};
    if (look.ground) look.ground(c, W, H, gy);
    const img = S.Sprites && S.Sprites.get(caseObj.sprite);
    if (img) {
      const scale = Math.min(1.3, 120 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      // the vehicle on its own layer, so dust or frost can be laid over its pixels only
      photoLayer.width = w;
      photoLayer.height = h;
      const p = photoLayer.getContext('2d');
      p.imageSmoothingEnabled = false;
      p.drawImage(img, 0, 0, w, h);
      if (look.coat) {
        p.globalCompositeOperation = 'source-atop';
        const g = p.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, look.coat[0]);
        g.addColorStop(1, look.coat[1]);
        p.fillStyle = g;
        p.fillRect(0, 0, w, h);
        p.globalCompositeOperation = 'source-over';
      }
      c.save();
      c.imageSmoothingEnabled = false;
      c.translate(Math.round(W / 2), gy + 14 + (look.sink || 0));
      if (look.tiltDeg) c.rotate((look.tiltDeg * Math.PI) / 180);
      c.drawImage(photoLayer, -Math.round(w / 2), -h);
      c.restore();
    } else {
      c.fillStyle = '#8f949c';
      c.fillRect(W / 2 - 22, gy - 14, 44, 20);
    }
    if (look.front) look.front(c, W, H, gy);
    else {
      c.fillStyle = 'rgba(40,20,14,0.35)'; // half buried: sand around the base
      c.fillRect(W / 2 - 70, gy + 10, 140, 6);
    }
    c.restore();
    if (look.haze) {
      c.fillStyle = look.haze;
      c.fillRect(0, 0, W, H);
    }
    const dark = S.Art.lighting(minute).dark;
    if (dark > 0) {
      c.fillStyle = 'rgba(12,10,22,' + (dark * 0.5).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
  }

  // Viewfinder scene for a scout-rover part in the lava tube: rock wall, floor, the part, lit by the lamp.
  function drawCaveCam(c, part, t) {
    const W = VIEW_W;
    const H = VIEW_H;
    const gy = Math.round(H * 0.68);
    const ox = Math.sin(t * 1.3) * 1.6 + Math.sin(t * 3.7) * 0.5;
    const oy = Math.cos(t * 1.1) * 1.1 + Math.sin(t * 2.9) * 0.4;
    c.save();
    c.translate(ox, oy);
    c.fillStyle = '#1a0f10';
    c.fillRect(-6, -6, W + 12, H + 12);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = i % 3 ? '#241616' : '#2e1c1b';
      c.fillRect(Math.round(rnd(i * 3.1) * W), Math.round(rnd(i * 5.7) * (gy - 10)), 8 + Math.round(rnd(i) * 18), 3 + Math.round(rnd(i * 2) * 5));
    }
    c.fillStyle = '#3a2321'; // bathtub ring on the wall
    for (let x = -6; x < W + 6; x += 2) c.fillRect(x, Math.round(gy - 26 + Math.sin(x * 0.05) * 2), 2, 1);
    c.fillStyle = '#211617';
    c.fillRect(-6, gy, W + 12, H);
    c.fillStyle = '#3b2724';
    c.fillRect(-6, gy, W + 12, 2);
    c.fillStyle = '#2c1d1c';
    [[14, 6], [44, 4], [150, 7], [188, 5]].forEach(([x, s]) => c.fillRect(x, gy - s + 1, s + 4, s));
    const k = part.id === 'body' ? 2.2 : 4;
    drawPart(c, part.id, W / 2, gy + 6, k, false);
    c.restore();
    // the helmet lamp: a pool of light on the part, darkness around it
    const g = c.createRadialGradient(W / 2, gy - 10, 12, W / 2, gy - 10, W * 0.62);
    g.addColorStop(0, 'rgba(255, 236, 200, 0.10)');
    g.addColorStop(0.45, 'rgba(4, 2, 6, 0.15)');
    g.addColorStop(1, 'rgba(4, 2, 6, 0.85)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  const partSubject = (part) => ({ id: 'tube_' + part.id, name: t('proto.tube.part.' + part.id + '.name'), draw: (g, minute, tt) => drawCaveCam(g, part, tt) });

  async function photoPart(part) {
    if (camOpen || tube.busy) return;
    const mg = await S.runMinigame('fieldcam', { subject: partSubject(part) });
    const s = S.getState();
    S.Sim.step(s, P.tubePhotoMinutes); // taking the photo takes time underground too
    if (!mg.success || mg.skipped) return;
    const st = proto(s);
    st.tubeFinds = st.tubeFinds || {};
    st.tubeFinds[part.id] = true;
    const n = P.tubeParts.filter((p) => st.tubeFinds[p.id]).length;
    S.UI.toast(t('proto.tube.found', { n, total: P.tubeParts.length }) + ' · ' + t('proto.tube.part.' + part.id + '.caption'), 'info', 9000);
    if (n === P.tubeParts.length && !st.tubeStoryShown) {
      st.tubeStoryShown = true;
      setTimeout(showTubeStory, 1800);
    }
  }

  // All parts photographed: the whole story of the fictional scout rover, plus the lesson.
  function showTubeStory() {
    const html =
      '<div class="panel big-panel" style="max-width:40em">' +
      '<div class="bp-head"><span class="bp-num">' + S.UI.icon('camera') + '</span><h2>' + S.util.escape(t('proto.tube.story_title')) + '</h2>' +
      '<button class="icon-btn" data-close>' + S.UI.icon('x') + '</button></div>' +
      '<div class="proto-story" style="margin:.6em 0"><p>' + S.util.escape(t('proto.tube.story_body')) + '</p>' +
      '<p class="proto-ask">' + S.util.escape(t('proto.tube.story_lesson')) + '</p></div>' +
      '<p class="pv-note">' + S.util.escape(t('proto.tube.story_fiction')) + '</p></div>';
    S.UI.openModal('proto-tube-story', html, { cls: 'modal-wide' });
    S.bus.emit('audio:play', 'success');
  }

  function caseSubject(id) {
    const c = origCases().find((x) => x.id === id) || origCases()[0];
    return { id: c.id, name: c.name, draw: (g, minute, tt) => drawCamScene(g, c, minute, tt) };
  }

  function runFieldCam(config) {
    return new Promise((resolve) => {
      const s = S.getState();
      // what is in the viewfinder: a wreck (forensic evidence) or anything else passed as config.subject
      const subject = config.subject || caseSubject(curCase);
      const rng = S.makeRng((s.minute | 0) * 31 + seedOf(subject.id));
      const base = 0.25 + rng() * 0.5; // where the wreck is sharp (hidden)
      let focus = Math.max(0, Math.min(1, base + (rng() < 0.5 ? -1 : 1) * (0.32 + rng() * 0.12)));
      // the sharp point drifts slowly (the astronaut sways a little), so the focus needs small corrections
      const target = (tt) => base + 0.028 * Math.sin(tt * 0.5) + 0.01 * Math.sin(tt * 1.3 + 1);
      let blurShown = 9; // starts fully out of focus and eases towards the real value
      let sharpFor = 0;
      let ready = false;
      let saved = false;
      let misses = 0;
      let holdL = 0;
      let holdR = 0;
      let msgUntil = 0;
      let done = false;
      const start = performance.now();

      const html =
        '<div class="pcam" role="dialog" aria-label="FIELD CAM">' +
        '<div class="pcam-stage">' +
        '<canvas class="pcam-view" width="' + VIEW_W + '" height="' + VIEW_H + '"></canvas>' +
        '<img class="pcam-body" alt="" src="' + camImg.src + '">' +
        '<div class="pcam-hud"><canvas class="pcam-br" width="' + VF.w + '" height="' + VF.h + '" style="position:absolute;inset:0;width:100%;height:100%"></canvas>' +
        '<span class="pcam-help"><b>' + S.util.escape(subject.name) + '</b><br>' + S.util.escape(t('proto.cam.help')) + '</span>' +
        '<span class="pcam-count"></span><span class="pcam-status"></span></div>' +
        '<div class="pcam-album" hidden></div>' +
        '<div class="pcam-flash"></div>' +
        '</div>' +
        '<div class="pcam-bar">' +
        '<button data-pcam-close><kbd>Esc</kbd>' + S.util.escape(t('proto.cam.close')) + '</button>' +
        '<button class="pcam-shoot" data-pcam-shoot></button>' +
        '<button data-pcam-album></button>' +
        '</div></div>';
      camOpen = true;
      const box = S.UI.openModal('minigame', html, { closable: false, cls: 'modal-minigame modal-pcam' });
      const view = box.querySelector('.pcam-view');
      const vctx = view.getContext('2d');
      const br = box.querySelector('.pcam-br');
      const bctx = br.getContext('2d');
      const countEl = box.querySelector('.pcam-count');
      const statusEl = box.querySelector('.pcam-status');
      const shootBtn = box.querySelector('[data-pcam-shoot]');
      const albumBtn = box.querySelector('[data-pcam-album]');
      const albumEl = box.querySelector('.pcam-album');
      const flash = box.querySelector('.pcam-flash');
      const scene = document.createElement('canvas');
      scene.width = VIEW_W;
      scene.height = VIEW_H;
      const sctx = scene.getContext('2d');
      const small = document.createElement('canvas');
      const smctx = small.getContext('2d');
      const hasFilter = typeof vctx.filter === 'string';

      const setStatus = (key, cls) => {
        statusEl.textContent = t(key);
        statusEl.className = 'pcam-status ' + (cls || '');
      };
      const refreshBar = () => {
        countEl.textContent = String(Math.min(album.length + 1, ALBUM_SIZE)).padStart(2, '0') + ' / ' + ALBUM_SIZE;
        albumBtn.textContent = t('proto.cam.album') + ' ' + album.length;
        shootBtn.className = 'pcam-shoot' + (saved ? ' saved' : ready ? ' ready' : '');
        shootBtn.innerHTML = saved
          ? S.util.escape(t('proto.cam.btn_saved'))
          : ready
            ? '<kbd>Space</kbd>' + S.util.escape(t('proto.cam.btn_shoot'))
            : S.util.escape(t('proto.cam.btn_focusing'));
      };

      const finish = (success, score, skipped) => {
        if (done) return;
        done = true;
        if (!success || skipped) cancelAnimationFrame(raf); // after a good shot the frame stays live until the close
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('keyup', onKeyUp, true);
        const timeUsed = Math.round(((performance.now() - start) / 1000) * 10) / 10;
        setTimeout(
          () => {
            S.UI.closeModal('minigame', true);
            camOpen = false;
            resolve({ success, score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100, timeUsed, skipped: Boolean(skipped) });
          },
          skipped ? 150 : 1100
        );
      };

      const shoot = () => {
        if (saved || done) return;
        if (!ready) {
          misses++;
          msgUntil = performance.now() + 1200;
          setStatus('proto.cam.blurry');
          S.bus.emit('audio:play', 'fail');
          return;
        }
        saved = true;
        flash.style.transition = 'none';
        flash.style.opacity = '0.9';
        requestAnimationFrame(() => {
          flash.style.transition = '';
          flash.style.opacity = '0';
        });
        S.bus.emit('audio:play', 'click');
        const shot = document.createElement('canvas');
        shot.width = VIEW_W;
        shot.height = VIEW_H;
        shot.getContext('2d').drawImage(view, 0, 0);
        album.push(shot);
        setStatus('proto.cam.saved', 'saved');
        refreshBar();
        const err = Math.abs(focus - target((performance.now() - start) / 1000));
        const score = 0.72 + 0.28 * (1 - err / P.camTolerance) - 0.05 * misses;
        S.bus.emit('audio:play', 'success');
        if (P.autoNextEvidence && !config.subject) autoNext = curCase;
        finish(true, Math.max(0.5, score), false);
      };

      const toggleAlbum = () => {
        if (!albumEl.hidden) {
          albumEl.hidden = true;
          return;
        }
        albumEl.innerHTML = '';
        if (!album.length) albumEl.innerHTML = '<p>' + S.util.escape(t('proto.cam.album_empty')) + '</p>';
        album.slice(-9).reverse().forEach((c) => {
          const copy = document.createElement('canvas');
          copy.width = c.width;
          copy.height = c.height;
          copy.getContext('2d').drawImage(c, 0, 0);
          albumEl.appendChild(copy);
        });
        albumEl.hidden = false;
        S.bus.emit('audio:play', 'click');
      };

      const onKey = (e) => {
        if (done) return;
        const k = e.code;
        let used = true;
        if (k === 'Escape') finish(true, 0.6, true);
        else if (k === 'ArrowLeft' || k === 'KeyA') holdL = holdL || 0.0001;
        else if (k === 'ArrowRight' || k === 'KeyD') holdR = holdR || 0.0001;
        else if ((k === 'Space' || k === 'Enter') && !e.repeat) shoot();
        else used = false;
        if (used) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      const onKeyUp = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') holdL = 0;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') holdR = 0;
      };
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', onKeyUp, true);
      box.querySelector('[data-pcam-close]').addEventListener('click', () => finish(true, 0.6, true));
      shootBtn.addEventListener('click', shoot);
      albumBtn.addEventListener('click', toggleAlbum);
      view.addEventListener('wheel', (e) => {
        e.preventDefault();
        focus = Math.max(0, Math.min(1, focus + Math.sign(e.deltaY) * 0.012));
      });
      let dragX = null; // drag across the viewfinder = turn the focus ring
      view.addEventListener('pointerdown', (e) => {
        dragX = e.clientX;
        view.setPointerCapture(e.pointerId);
      });
      view.addEventListener('pointermove', (e) => {
        if (dragX === null) return;
        focus = Math.max(0, Math.min(1, focus + (e.clientX - dragX) / (view.clientWidth * 1.6)));
        dragX = e.clientX;
      });
      view.addEventListener('pointerup', () => (dragX = null));

      let last = performance.now();
      let raf = 0;
      const frame = (now) => {
        if ((done && !saved) || !view.isConnected) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tt = (now - start) / 1000;
        if (!saved) {
          // hold to turn: slow at first for fine steps, faster the longer the key is held
          for (const [h, dir] of [[holdL, -1], [holdR, 1]]) {
            if (!h) continue;
            focus = Math.max(0, Math.min(1, focus + dir * P.camFocusSpeed * Math.min(1, 0.25 + h * 1.3) * dt));
          }
          if (holdL) holdL += dt;
          if (holdR) holdR += dt;
          const err = Math.abs(focus - target(tt));
          const blurGoal = Math.min(9, Math.max(0, err - P.camTolerance * 0.5) * 42);
          blurShown += (blurGoal - blurShown) * (1 - Math.exp(-P.camBlurEase * dt)); // the blur fades gradually
          sharpFor = err < P.camTolerance && blurShown < 1.2 ? sharpFor + dt : 0;
          if (!ready && sharpFor >= P.camHoldSeconds) {
            ready = true;
            S.bus.emit('audio:play', 'scan');
            refreshBar();
          } else if (ready && err > P.camTolerance * 1.4) {
            ready = false;
            refreshBar();
          }
          if (now > msgUntil) setStatus(ready ? 'proto.cam.sharp' : 'proto.cam.focusing', ready ? 'ok' : '');
          if (tt > P.camSeconds) {
            finish(false, 0.3, false);
            return;
          }
        }
        // the scene, then the blur
        sctx.clearRect(0, 0, VIEW_W, VIEW_H);
        subject.draw(sctx, S.getState().minute, saved ? 0 : tt);
        vctx.clearRect(0, 0, VIEW_W, VIEW_H);
        const b = saved ? 0 : blurShown;
        if (b < 0.25) {
          vctx.drawImage(scene, 0, 0);
        } else if (hasFilter) {
          vctx.filter = 'blur(' + b.toFixed(2) + 'px)';
          vctx.drawImage(scene, 0, 0);
          vctx.filter = 'none';
        } else {
          const f = 1 + b * 0.8; // no canvas filter (older Safari): shrink and stretch back
          small.width = Math.max(8, Math.round(VIEW_W / f));
          small.height = Math.max(5, Math.round(VIEW_H / f));
          smctx.imageSmoothingEnabled = true;
          smctx.drawImage(scene, 0, 0, small.width, small.height);
          vctx.imageSmoothingEnabled = true;
          vctx.drawImage(small, 0, 0, VIEW_W, VIEW_H);
        }
        // focus brackets: wide while blurry, closing in on the wreck as it sharpens
        bctx.clearRect(0, 0, VF.w, VF.h);
        const k = Math.min(1, b / 6);
        const bw = 70 + 90 * k;
        const bh = 62 + 70 * k;
        const cx = VF.w / 2;
        const cy = VF.h / 2 + 4;
        const arm = 14;
        bctx.strokeStyle = ready || saved ? '#ff5a43' : '#e8574a';
        bctx.globalAlpha = ready && !saved ? 0.75 + 0.25 * Math.sin(now / 120) : 0.9;
        bctx.lineWidth = 3;
        bctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const x = cx + (sx * bw) / 2;
          const y = cy + (sy * bh) / 2;
          bctx.moveTo(x, y - sy * arm);
          bctx.lineTo(x, y);
          bctx.lineTo(x - sx * arm, y);
        }
        bctx.stroke();
        raf = requestAnimationFrame(frame);
      };
      refreshBar();
      setStatus('proto.cam.focusing');
      raf = requestAnimationFrame(frame);
      // debugging aid for headless checks: SOL14.WorldProto.camDebug.snap() puts the focus on the target
      P.camDebug = {
        snap: () => (focus = target((performance.now() - start) / 1000)),
        info: () => ({ focus, target: target((performance.now() - start) / 1000), blur: blurShown, ready, saved })
      };
    });
  }

  /* ================================================================ */
  /* MARS FACTS during the cruise and the landing                      */
  /* ================================================================ */
  // Short facts, every number read from nasa_data.json together with its NASA source (shown on the card).
  function marsFacts() {
    const C = S.DATA.constants;
    const g = C.marsGravity;
    const a = C.atmosphere;
    const T = C.temperature;
    const sol = C.sol;
    const sun = C.solarIrradiance;
    const r = C.radiation;
    const snd = C.speedOfSound;
    const solH = Math.floor(sol.hours);
    return [
      { key: 'proto.fact.rad', vars: { d: num(r.surfaceDailyMsv, 2), t: num(r.transitDailyMsv, 2) }, src: r.src },
      { key: 'proto.fact.sun', vars: { pct: num((sun.mean / sun.earthMean) * 100, 0), w: num(sun.mean, 0) }, src: sun.src },
      { key: 'proto.fact.air', vars: { kpa: num(a.surfacePressureKpa, 3), pct: num((a.surfacePressureKpa / a.earthPressureKpa) * 100, 1), co2: num(a.co2FractionPct, 0) }, src: a.src },
      { key: 'proto.fact.temp', vars: { mean: num(T.globalMeanC, 0), max: num(T.equatorDayMaxC, 0), min: num(T.equatorNightMinC, 0) }, src: T.src },
      { key: 'proto.fact.sol', vars: { h: solH, m: Math.floor((sol.hours - solH) * 60) }, src: sol.src },
      { key: 'proto.fact.sound', vars: { m: num(snd.marsMs, 0), e: num(snd.earthMs, 0) }, src: snd.src },
      { key: 'proto.fact.gravity', edl: true, vars: { g: num(g.value, 2), pct: num((g.value / g.earthValue) * 100, 0), x: num(g.earthValue / g.value, 1) }, src: g.src }
    ];
  }

  const factCss = document.createElement('style');
  factCss.textContent =
    '.proto-facts{position:absolute;right:3%;bottom:13%;width:38%;z-index:6;display:grid;gap:.25em;background:rgba(14,14,20,.9);' +
    'border-left:3px solid #ff7a2e;border-radius:8px;padding:.75em .95em;color:#f2ebe2;' +
    'font:calc(15px * var(--k,1))/1.45 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);transition:opacity .35s}' +
    '.proto-facts b{color:#ff9a5a;letter-spacing:.08em;font-size:.78em}' +
    '.proto-facts small{opacity:.6;font-size:.74em}' +
    // landing card: own class name (the game's altitude box already uses .edl) and moved up, clear of that box
    '.proto-facts.pf-edl{border-left-color:#3fe0e6;bottom:auto;top:24%}.proto-facts.pf-edl b{color:#3fe0e6}' +
    '.proto-facts.fade{opacity:0}';
  document.head.appendChild(factCss);

  // During the cruise the cards change every factSeconds; when the landing (EDL) starts, the gravity card
  // stays up until touchdown. The cards wait while the repair minigame is open.
  function startFacts(root) {
    const facts = marsFacts();
    const cruise = facts.filter((f) => !f.edl);
    const gravity = facts.find((f) => f.edl);
    const el = document.createElement('div');
    el.className = 'proto-facts fade';
    el.setAttribute('role', 'status');
    root.appendChild(el);
    let i = -1;
    let nextAt = 0;
    let edl = false;
    const show = (f, headKey, cls) => {
      el.classList.add('fade');
      setTimeout(() => {
        el.className = 'proto-facts ' + (cls || '');
        el.innerHTML =
          '<b>' + S.util.escape(t(headKey)) + '</b><span>' + S.util.escape(t(f.key, f.vars)) + '</span>' +
          '<small>' + S.util.escape(t('proto.fact.src', { src: host(f.src) })) + '</small>';
      }, i < 0 ? 0 : 350);
    };
    const iv = setInterval(() => {
      if (!root.isConnected) return clearInterval(iv);
      const now = performance.now();
      if (S.isMinigameOpen && S.isMinigameOpen()) {
        nextAt = now + P.factSeconds * 1000;
        return;
      }
      if (document.querySelector('.edl-on')) { // cutscenes.js marks the screen wrapper when EDL starts
        if (!edl) {
          edl = true;
          show(gravity, 'proto.fact.head_edl', 'pf-edl');
        }
        return;
      }
      if (now >= nextAt) {
        show(cruise[(i + 1) % cruise.length], 'proto.fact.head');
        i++;
        nextAt = now + P.factSeconds * 1000;
      }
    }, 200);
  }

  /* ---------------- Hooks into the minigame host and the forensic panel ---------------- */
  const photoEv = S.DATA.forensics.evidenceTypes.find((e) => e.id === 'photo');
  if (photoEv) photoEv.minigame = 'fieldcam';

  // science_panels.js and minigames.js load before this file; patch at load time anyway to be safe.
  window.addEventListener('load', () => {
    const origRun = S.runMinigame;
    S.runMinigame = function (type, config) {
      if (type === 'fieldcam') return runFieldCam(config || {});
      return origRun.apply(this, arguments);
    };
    const origIsOpen = S.isMinigameOpen;
    S.isMinigameOpen = () => camOpen || Boolean(origIsOpen && origIsOpen());

    // Mars facts over the cruise-and-landing cutscene
    if (S.Cutscenes && S.Cutscenes.playTransit) {
      const origTransit = S.Cutscenes.playTransit;
      S.Cutscenes.playTransit = function () {
        const r = origTransit.apply(this, arguments);
        const root = document.querySelector('.cutscene.transit');
        if (root) startFacts(root);
        return r;
      };
    }

    const SP = S.SciencePanels;
    if (!SP) return;
    const origOpen = SP.openForensic;
    SP.openForensic = function (id) {
      curCase = id;
      const r = origOpen.apply(this, arguments);
      if (autoNext === id) {
        autoNext = null;
        const rec = S.getState().forensics[id];
        const next = !rec.diagnosis && S.DATA.forensics.evidenceTypes.find((ev) => rec.evidence[ev.id] === null);
        const top = S.UI.topModal();
        const btn = next && top && top.id === 'forensic' && top.el.querySelector('[data-ev="' + next.id + '"]');
        if (btn && !btn.disabled) {
          btn.classList.add('proto-next');
          S.UI.toast(t('proto.cam.next', { ev: t('ev.' + next.id) }), 'info', 2500);
          setTimeout(() => {
            const still = S.UI.topModal();
            if (still && still.id === 'forensic' && btn.isConnected && !btn.disabled) btn.click();
          }, 1400);
        }
      }
      return r;
    };

    // Diagnosis: once there is enough evidence, tell the story the clues add up to, and explain each category.
    const origHtml = SP.forensicHtml;
    SP.forensicHtml = function (s, id) {
      let html = origHtml.apply(this, arguments);
      const rec = s.forensics[id];
      if (rec.diagnosis) return html;
      const need = S.DATA.forensics.minEvidenceForDiagnosis;
      const enough = S.Forensics.evidenceCount(rec) >= need;
      const story = enough
        ? '<div class="proto-story"><h5>' + t('proto.diag.story_title') + '</h5><p>' + t('proto.story.' + id) + '</p>' +
          '<p class="proto-ask">' + t('proto.diag.ask') + '</p></div>'
        : '<div class="proto-story locked"><h5>' + t('proto.diag.story_title') + '</h5><p>' + t('proto.diag.locked', { n: need }) + '</p></div>';
      html = html.replace('<div class="cats">', story + '<div class="cats">');
      html = html.replace(/(<button class="cat-btn[^"]*" data-cat="(\w+)"[^>]*>)([^<]*)<\/button>/g, (m, open, cat, label) =>
        open + '<span>' + label + '</span><small>' + t('proto.catd.' + cat) + '</small></button>'
      );
      return html;
    };
  });
})((window.SOL14 = window.SOL14 || {}));
