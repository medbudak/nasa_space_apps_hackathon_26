/**
 * SOL 14: RED HORIZON — STATION PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * What is left of the K3 world prototype after the 2026-11-15 merge. Main already has its own version of
 * the rest (buried wrecks and digging, the lava tube with SCOUT-1, FIELD CAM, Mars facts, diagnosis
 * stories, the lava-plain scenery); this file keeps only the two parts main does not have yet. Everything
 * is patched in at runtime from this one file, loaded just before src/main.js. Remove the <script> tag
 * and the game is exactly main; add ?proto=0 to the URL to compare.
 *
 *  1. Station story (changes the rules and the ending: needs a team decision before it goes to main):
 *     on Sol 2 a meteorite lands by the base (fictional), the MAV is holed and the crew must stay. The
 *     impact scatters cargo: on the ground, on top of the boulders of the rocky approach (jump) and in the
 *     two decoy mounds (dig with S or ↓); open ground gives regolith bags. Salvaging a wreck tells which
 *     parts suit the station (✓/✗ with the reason). Five modules (shell, shield, heating, power, comms),
 *     some with either-or sources. A budget bar fills with data that reaches Earth and buys replacements.
 *     The ending depends on what was built and how: six endings (Red Pioneer, Silent Shelter, Irradiated
 *     Wait, Dark Base, Long Night, Lost Signal). ?impactSol=1 makes the meteorite fall on landing day.
 *  2. Cable panel: the black-box telemetry task drawn as a real electrical panel (hanging cables with
 *     weight, terminals, sockets with LEDs, sparks on a wrong socket). Same rules and the same channel →
 *     subsystem matching as main's wires task (config.match), only the look changes.
 *
 * Owners to move this into, if the team adopts it: rules and ending -> K1/K2 (sim.js, cutscenes ending),
 * numbers -> K1 (nasa_data.json), texts -> K5 (story.json), panel and HUD -> K3 (ui/), art -> K4.
 * All numbers below are prototype game values (D-009 style), not sourced measurements.
 */
(function (S) {
  'use strict';
  if (!S.Surface || !S.FX || !S.Art || !S.Forensics) return; // tests load only the core scripts
  const params = new URLSearchParams(window.location.search);
  if (params.get('proto') === '0') return;

  /* ---------------- Prototype settings (game values, to tune) ---------------- */
  const P = {
    // On this sol a meteorite lands near the base (FICTIONAL: new impact craters do form on Mars every year,
    // but one landing next to a base is very unlikely), the MAV is holed and the crew must stay and build.
    impactSol: Number(params.get('impactSol')) || 2, // ?impactSol=1 makes it fall on landing day (for trying it out)
    // The station foundation: the base area west of the lander, empty now that main's habitat and crates are
    // gone (base_proto.js). The base area is drawn at sprite scale (−120..0 m = −700..0 px): −57 m ≈ −330 px.
    stationSiteM: -57,
    stationSiteRangeM: 12,
    buildGameMinutes: 30, // each module takes this much game time to put together
    digGameMinutes: 4, // one S/↓ dig for regolith or buried cargo
    digsForBuried: 2, // digs at a decoy mound until the buried cargo comes out
    // Materials the impact scattered (m from the airlock; east is +, the glacier route west is −). 'boulder'
    // items sit on top of main's boulders on the rocky approach (terrain.boulders): jump up to reach them.
    // Kept clear of the dig sites (205, 330, 545, 760, 1400 m) and the sand pit (600–680 m).
    pickups: [
      { id: 'c1', m: 150, item: 'cargo', place: 'ground' },
      { id: 'k1', m: 270, item: 'cable', place: 'ground' },
      { id: 'c2', m: 450, item: 'cargo', place: 'ground' },
      { id: 'c3', m: 930, item: 'cargo', place: 'boulder' },
      { id: 'k2', m: 985, item: 'cable', place: 'boulder' },
      { id: 'c4', m: -380, item: 'cargo', place: 'ground' },
      { id: 'k3', m: -700, item: 'cable', place: 'ground' },
      // past the lava-tube skylight, on the new east route (base_proto.js)
      { id: 'c5', m: 2080, item: 'cargo', place: 'ground' },
      { id: 'k4', m: 2720, item: 'cable', place: 'ground' }
    ],
    // main's decoy mounds (explore.dig sites with no wreck) hide this after the impact
    buriedInMounds: { mound_e1: 'cargo', mound_e2: 'cable' },
    // Station modules: what each needs. `alt` = either-or sources (salvaged part or bought replacement).
    modules: [
      { id: 'shell', needs: { cargo: 3, cable: 1 } },
      { id: 'shield', needs: { regolith: 4 }, after: 'shell' },
      { id: 'heat', alt: [{ use: 'rhu', needs: { rhu: 1 } }, { use: 'heater', needs: { heater: 1 } }], after: 'shell' },
      { id: 'power', alt: [{ use: 'panel', needs: { panel: 1, cable: 1 } }, { use: 'solarkit', needs: { solarkit: 1, cable: 1 } }], after: 'shell' },
      { id: 'comms', alt: [{ use: 'antenna', needs: { antenna: 1, cable: 1 } }, { use: 'relay', needs: { relay: 1 } }], after: 'shell' }
    ],
    // What salvaging each wreck gives, and whether it suits the station (✓/✗ with the reason shown).
    salvageParts: {
      opportunity: [{ part: 'rhu', ok: true, item: 'rhu' }, { part: 'battery', ok: false }],
      spirit: [{ part: 'rhu', ok: true, item: 'rhu' }, { part: 'wheel', ok: false }],
      insight: [{ part: 'insight_panel', ok: true, item: 'panel' }, { part: 'seis', ok: false }],
      phoenix: [{ part: 'phoenix_panel', ok: false }, { part: 'arm', ok: false }],
      beagle2: [{ part: 'antenna', ok: true, item: 'antenna' }]
    },
    // Budget: fictional research funding, game values (no real conversion exists): M$ per Mbit that reaches Earth.
    budgetStart: 20,
    budgetPerMbit: 1,
    budgetBarMax: 150,
    shop: [
      { id: 'supply', cost: 40, gives: { cargo: 2, cable: 1 } },
      { id: 'heater', cost: 30, gives: { heater: 1 } },
      { id: 'solarkit', cost: 35, gives: { solarkit: 1 } },
      { id: 'relay', cost: 25, gives: { relay: 1 } }
    ],
    tipSeconds: 9 // the one-time tip card, top right
  };
  S.WorldProto = P;

  /* ---------------- Texts (prototype; would move to content/story.json) ---------------- */
  const TEXT = {
    tr: {
      'proto.st.impact_title': 'GÖKTAŞI ÇARPTI',
      'proto.st.impact_body': 'Üssün yakınına bir göktaşı düştü. Fırlayan kayalar Mars Yükselme Aracı\'nın (MAV) yakıt tankını deldi ve yakıt sızdı: Dünya\'ya dönüş şimdilik imkânsız. Kurtarma görevi bir sonraki fırlatma penceresinde, yaklaşık {months} ay sonra gelebilir. O zamana kadar hayatta kalmak için bir istasyon kurman gerekiyor. Çarpma kargo konteynerlerini de etrafa saçtı.',
      'proto.st.impact_how': 'Malzemeler yerde, kayaların üstünde (zıpla) ve gömülü (kaz). Enkazlardan sökeceğin parçalar da işe yarayabilir. Dünya\'ya gönderdiğin veriler bütçe kazandırır.',
      'proto.st.impact_fiction': 'Kurgu: Mars\'ta her yıl yeni çarpma kraterleri oluşur, ama birinin tam bir üssün yanına düşme olasılığı çok düşüktür.',
      'proto.st.ok': 'Anladım',
      'proto.st.imp.alarm': 'ALARM · SOL {sol}',
      'proto.st.imp.tank': 'MAV yakıt tankı',
      'proto.st.imp.tank_v': 'DELİNDİ',
      'proto.st.imp.home': 'Dünya\'ya dönüş',
      'proto.st.imp.home_v': 'İMKÂNSIZ',
      'proto.st.imp.rescue': 'Kurtarma görevi',
      'proto.st.imp.rescue_v': '~{months} ay',
      'proto.st.imp.hab': 'Habitat',
      'proto.st.imp.hab_v': 'SAĞLAM',
      'proto.st.imp.text': 'Üssün yakınına bir göktaşı düştü. Fırlayan kayalar Mars Yükselme Aracı\'nın (MAV) yakıt tankını deldi, yakıt sızdı. Kurtarma ancak bir sonraki fırlatma penceresinde gelebilir. O zamana kadar hayatta kalman gerekiyor.',
      'proto.st.imp.mission': 'YENİ GÖREV · İSTASYON KUR',
      'proto.st.imp.s1_t': 'Topla',
      'proto.st.imp.s1': 'Çarpma kargoyu saçtı: yerde, kayaların üstünde (zıpla), gömülü (kaz).',
      'proto.st.imp.s2_t': 'Sök',
      'proto.st.imp.s2': 'Kayıp araçların parçaları işe yarayabilir. Ama hepsi değil.',
      'proto.st.imp.s3_t': 'Kur',
      'proto.st.imp.s3': 'Üssün batısındaki istasyon alanında E ile 5 modülü kur.',
      'proto.st.imp.budget': 'Dünya\'ya gönderdiğin veri bütçe getirir. B: istasyon paneli.',
      'proto.st.imp.go': 'Anladım, işe koyul',
      'proto.st.goal': 'İstasyonu kur ({n}/{total} modül)',
      'proto.st.goal_hint': 'Malzeme topla, enkazlardan parça sök, üsteki istasyon alanında E ile kur. B: istasyon paneli.',
      'proto.st.title': 'İSTASYON',
      'proto.st.budget': 'Bütçe',
      'proto.st.budget_note': 'Dünya\'ya ulaşan her veri paketi araştırma fonu getirir (oyun değeri, gerçek bir karşılığı yok).',
      'proto.st.budget_hint': 'Dünya\'ya gönderdiğin her veri bütçeyi artırır.',
      'proto.st.inv': 'Malzemeler',
      'proto.st.modules': 'Modüller',
      'proto.st.shop': 'Bütçeyle satın al',
      'proto.st.build': 'Kur',
      'proto.st.build_with': '{item} ile kur',
      'proto.st.built': 'Kuruldu: {item}',
      'proto.st.need_site': 'Kurmak için istasyon alanına git (üssün hemen batısı, buzlu düzlüğün başı).',
      'proto.st.need_shell': 'Önce basınçlı gövde',
      'proto.st.missing': 'Eksik: {list}',
      'proto.st.no_money': 'Bütçe yetmiyor',
      'proto.st.bought': '{item} alındı, ikmal kapsülüyle indi.',
      'proto.st.built_toast': '{mod} kuruldu!',
      'proto.st.mav_broken': 'MAV hasarlı: yakıt tankı delinmiş, kalkış yapılamaz.',
      'proto.st.site_tip_title': 'İstasyon alanı',
      'proto.st.site_tip_body': 'Malzemeleri burada E ile birleştir. Açık zeminde S ile kazarsan toprak torbası çıkar. Durumu her yerden B ile gör.',
      'proto.st.pick': '+1 {item}',
      'proto.st.regolith': 'Toprak torbası +1 ({n})',
      'proto.st.buried': 'Gömülü kargo: {item}!',
      'proto.st.empty': 'Burada başka bir şey yok',
      'proto.st.salvage_title': 'Söktüğün parçalar istasyona uygun mu?',
      'proto.st.mod.shell': 'Basınçlı gövde',
      'proto.st.mod.shell.desc': 'İçinde nefes alınabilen kabuk. Her şey bunun üstüne kurulur.',
      'proto.st.mod.shield': 'Radyasyon kalkanı',
      'proto.st.mod.shield.desc': 'Gövdenin üstüne yığılan Mars toprağı, ince atmosferin durdurmadığı radyasyonu azaltır.',
      'proto.st.mod.heat': 'Isıtma',
      'proto.st.mod.heat.desc': 'Gece −80 °C\'ye inen soğukta istasyonu sıcak tutar.',
      'proto.st.mod.power': 'Güç',
      'proto.st.mod.power.desc': 'Yaşam desteği, MOXIE ve ısıtıcılar için elektrik.',
      'proto.st.mod.comms': 'İletişim',
      'proto.st.mod.comms.desc': 'Dünya ile bağlantı: kurtarma ekibi seni ancak böyle bulur.',
      'proto.st.item.cargo': 'Kargo paneli',
      'proto.st.item.cable': 'Kablo',
      'proto.st.item.regolith': 'Toprak torbası',
      'proto.st.item.rhu': 'RHU ısıtıcı',
      'proto.st.item.panel': 'InSight paneli',
      'proto.st.item.antenna': 'Beagle 2 anteni',
      'proto.st.item.heater': 'Elektrikli ısıtıcı',
      'proto.st.item.solarkit': 'Güneş paneli kiti',
      'proto.st.item.relay': 'Röle uydu kiralama',
      'proto.st.shop.supply': 'İkmal kapsülü: 2 kargo paneli + 1 kablo',
      'proto.st.shop.heater': 'Elektrikli ısıtıcı (Isıtma için, RHU yerine)',
      'proto.st.shop.solarkit': 'Güneş paneli kiti (Güç için, InSight paneli yerine)',
      'proto.st.shop.relay': 'Röle uydu kiralama (İletişim için, anten yerine)',
      'proto.st.sv.rhu': 'RHU ısıtıcılar ✓ Plütonyum-238\'in yarı ömrü 87,7 yıl: yıllar sonra bile ısı verirler. Isıtma modülüne uygun.',
      'proto.st.sv.battery': 'Eski piller ✗ Yıllarca −80 °C gecelerde kaldılar; büyük ihtimalle ölüler.',
      'proto.st.sv.wheel': 'Tekerlek ✗ Alüminyum ama basınçlı gövde yapılamaz; istasyona katkısı yok.',
      'proto.st.sv.insight_panel': 'InSight güneş paneli ✓ 2,2 m çapında; tozdan temizlenince yeniden enerji üretir. Güç modülüne uygun.',
      'proto.st.sv.seis': 'Sismometre ✗ Değerli bir bilim aleti, ama istasyonun hayatta kalmasına katkısı yok.',
      'proto.st.sv.phoenix_panel': 'Phoenix panelleri ✗ CO₂ buzunun ağırlığıyla kırılmışlar; enerji üretemezler.',
      'proto.st.sv.arm': 'Robot kol ✗ İstasyon modüllerinin hiçbirine uymuyor.',
      'proto.st.sv.antenna': 'Beagle 2 anteni ✓ İletişim modülüne takılabilir.',
      'proto.end.choices': 'Seçimlerin',
      'proto.end.report': 'Karneyi gör',
      'proto.end.fiction': 'Göktaşı olayı ve istasyon hikâyesi kurgudur.',
      'proto.end.c.built': 'Kurulan modüller: {list}',
      'proto.end.c.none': 'Hiç modül kurulmadı',
      'proto.end.c.heat_rhu': 'Isıyı eski rover\'ların RHU\'larından aldın: geçmiş görevler seni ısıttı.',
      'proto.end.c.heat_heater': 'Elektrikli ısıtıcı aldın: ısınmak artık güce bağlı.',
      'proto.end.c.power_panel': 'InSight\'ın panelini temizleyip kullandın.',
      'proto.end.c.power_solarkit': 'Dünya\'dan güneş paneli kiti istedin.',
      'proto.end.c.comms_antenna': 'Beagle 2\'nin antenini kullandın: 2003\'te sessiz kalan anten bu kez konuştu.',
      'proto.end.c.comms_relay': 'Bütçeyle röle uydu zamanı kiraladın.',
      'proto.end.c.money': 'Dünya\'ya giden veri: {mbit} Mbit · kalan bütçe: {m} M$',
      'proto.end.pioneer.title': 'KIZIL ÖNCÜ',
      'proto.end.pioneer.body': 'İstasyon ayakta: gövde, kalkan, ısı, güç ve iletişim çalışıyor. Dünya seni duyuyor. Kurtarma görevi yaklaşık {months} ay sonra gelecek; o zamana kadar Mars\'taki ilk kalıcı üssün sakini sensin.',
      'proto.end.silent.title': 'SESSİZ SIĞINAK',
      'proto.end.silent.body': 'İstasyon seni hayatta tutuyor ama iletişim modülü yok. Dünya\'dan bakınca sinyalin kesildi: tıpkı incelediğin kayıp araçlar gibi. Kurtarma ekibi seni bulabilecek mi?',
      'proto.end.rad.title': 'IŞINLI BEKLEYİŞ',
      'proto.end.rad.body': 'İstasyon çalışıyor ama üstünde toprak kalkanı yok. Kurtarmayı beklediğin yaklaşık {months} ayda yüzeyde ~{dose} mSv alırsın; yolculuktaki dozla birlikte {limit} mSv kariyer sınırını aşıyorsun.',
      'proto.end.dark.title': 'KARANLIK ÜS',
      'proto.end.dark.body': 'Gövde var ama güç yok. Yaşam desteği ve MOXIE elektriksiz çalışamaz; istasyon yavaş yavaş sustu.',
      'proto.end.night.title': 'UZUN GECE',
      'proto.end.night.body': 'Gövde var ama ısıtma yok. Mars gecesi −80 °C\'ye iner; ince atmosfer ısıyı tutmaz. İlk kış istasyonu dondurdu.',
      'proto.end.lost.title': 'KAYIP İŞARET',
      'proto.end.lost.body': 'Basınçlı gövde kurulamadı. Mekik hasarlıyken habitat tek başına kurtarma görevini bekleyemezdi. Görev, incelediğin araçlar gibi bir hikâyeye dönüştü.',
      'proto.dig.metal': 'Metal! Bir şey gömülü',
      'proto.cb.tag': 'KABLO PANOSU',
      'proto.cb.hint': 'Kablonun ucunu sürükleyip aynı koddaki sokete tak · Klavye: 1–{n}, sonra A–{last}',
      'proto.cb.hint_match': 'Kablonun ucunu ait olduğu alt sistemin soketine sürükle · Klavye: 1–{n}, sonra A–{last}',
      'proto.cb.skip': 'Atla',
      'proto.cb.ok': 'BAĞLANTI TAMAM',
      'proto.cb.fail': 'SÜRE DOLDU',
    },
    en: {
      'proto.st.impact_title': 'METEORITE IMPACT',
      'proto.st.impact_body': 'A meteorite hit near the base. Flying rock holed the Mars Ascent Vehicle\'s (MAV) fuel tank and the fuel leaked out: going home is impossible for now. A rescue mission can come at the next launch window, about {months} months away. Until then you need to build a station to survive. The impact also scattered the cargo containers.',
      'proto.st.impact_how': 'Materials lie on the ground, on top of rocks (jump) and buried (dig). Parts you salvage from the wrecks may help too. Data you send to Earth earns budget.',
      'proto.st.impact_fiction': 'Fiction: new impact craters form on Mars every year, but one landing right next to a base is very unlikely.',
      'proto.st.ok': 'Got it',
      'proto.st.imp.alarm': 'ALARM · SOL {sol}',
      'proto.st.imp.tank': 'MAV fuel tank',
      'proto.st.imp.tank_v': 'HOLED',
      'proto.st.imp.home': 'Return to Earth',
      'proto.st.imp.home_v': 'IMPOSSIBLE',
      'proto.st.imp.rescue': 'Rescue mission',
      'proto.st.imp.rescue_v': '~{months} months',
      'proto.st.imp.hab': 'Habitat',
      'proto.st.imp.hab_v': 'INTACT',
      'proto.st.imp.text': 'A meteorite hit near the base. Flying rock holed the Mars Ascent Vehicle\'s (MAV) fuel tank and the fuel leaked out. A rescue can only come at the next launch window. Until then you have to survive.',
      'proto.st.imp.mission': 'NEW MISSION · BUILD A STATION',
      'proto.st.imp.s1_t': 'Collect',
      'proto.st.imp.s1': 'The impact scattered the cargo: on the ground, on rock tops (jump), buried (dig).',
      'proto.st.imp.s2_t': 'Salvage',
      'proto.st.imp.s2': 'Parts of the lost vehicles may help. Not all of them.',
      'proto.st.imp.s3_t': 'Build',
      'proto.st.imp.s3': 'Build the 5 modules with E at the station site west of the base.',
      'proto.st.imp.budget': 'Data you send to Earth earns budget. B: station panel.',
      'proto.st.imp.go': 'Got it, get to work',
      'proto.st.goal': 'Build the station ({n}/{total} modules)',
      'proto.st.goal_hint': 'Collect materials, salvage parts from wrecks, build with E at the station site by the base. B: station panel.',
      'proto.st.title': 'STATION',
      'proto.st.budget': 'Budget',
      'proto.st.budget_note': 'Every data packet that reaches Earth brings research funding (a game value with no real-world equivalent).',
      'proto.st.budget_hint': 'Every bit of data you send to Earth adds to the budget.',
      'proto.st.inv': 'Materials',
      'proto.st.modules': 'Modules',
      'proto.st.shop': 'Buy with budget',
      'proto.st.build': 'Build',
      'proto.st.build_with': 'Build with {item}',
      'proto.st.built': 'Built: {item}',
      'proto.st.need_site': 'Go to the station site to build (just west of the base, where the icy plain starts).',
      'proto.st.need_shell': 'Pressure shell first',
      'proto.st.missing': 'Missing: {list}',
      'proto.st.no_money': 'Not enough budget',
      'proto.st.bought': '{item} bought, landed by supply capsule.',
      'proto.st.built_toast': '{mod} built!',
      'proto.st.mav_broken': 'The MAV is damaged: its fuel tank is holed, it cannot lift off.',
      'proto.st.site_tip_title': 'Station site',
      'proto.st.site_tip_body': 'Put the materials together here with E. Dig open ground with S for regolith bags. See the status anywhere with B.',
      'proto.st.pick': '+1 {item}',
      'proto.st.regolith': 'Regolith bag +1 ({n})',
      'proto.st.buried': 'Buried cargo: {item}!',
      'proto.st.empty': 'Nothing else here',
      'proto.st.salvage_title': 'Do the parts you salvaged suit the station?',
      'proto.st.mod.shell': 'Pressure shell',
      'proto.st.mod.shell.desc': 'A shell you can breathe in. Everything else is built onto it.',
      'proto.st.mod.shield': 'Radiation shield',
      'proto.st.mod.shield.desc': 'Martian soil heaped over the shell cuts the radiation the thin air does not stop.',
      'proto.st.mod.heat': 'Heating',
      'proto.st.mod.heat.desc': 'Keeps the station warm when nights drop to −80 °C.',
      'proto.st.mod.power': 'Power',
      'proto.st.mod.power.desc': 'Electricity for life support, MOXIE and heaters.',
      'proto.st.mod.comms': 'Comms',
      'proto.st.mod.comms.desc': 'A link to Earth: the only way a rescue crew can find you.',
      'proto.st.item.cargo': 'Cargo panel',
      'proto.st.item.cable': 'Cable',
      'proto.st.item.regolith': 'Regolith bag',
      'proto.st.item.rhu': 'RHU heaters',
      'proto.st.item.panel': 'InSight panel',
      'proto.st.item.antenna': 'Beagle 2 antenna',
      'proto.st.item.heater': 'Electric heater',
      'proto.st.item.solarkit': 'Solar panel kit',
      'proto.st.item.relay': 'Relay satellite time',
      'proto.st.shop.supply': 'Supply capsule: 2 cargo panels + 1 cable',
      'proto.st.shop.heater': 'Electric heater (for Heating, instead of RHUs)',
      'proto.st.shop.solarkit': 'Solar panel kit (for Power, instead of the InSight panel)',
      'proto.st.shop.relay': 'Relay satellite time (for Comms, instead of an antenna)',
      'proto.st.sv.rhu': 'RHU heaters ✓ Plutonium-238 has a half-life of 87.7 years: they still give heat years later. Good for Heating.',
      'proto.st.sv.battery': 'Old batteries ✗ Years of −80 °C nights; most likely dead.',
      'proto.st.sv.wheel': 'Wheel ✗ Aluminium, but it cannot make a pressure shell; no use to the station.',
      'proto.st.sv.insight_panel': 'InSight solar panel ✓ 2.2 m across; cleaned of dust it makes energy again. Good for Power.',
      'proto.st.sv.seis': 'Seismometer ✗ A valuable science instrument, but no help in keeping you alive.',
      'proto.st.sv.phoenix_panel': 'Phoenix panels ✗ Broken by the weight of CO₂ ice; they cannot make energy.',
      'proto.st.sv.arm': 'Robotic arm ✗ Fits none of the station modules.',
      'proto.st.sv.antenna': 'Beagle 2 antenna ✓ Can be fitted to the Comms module.',
      'proto.end.choices': 'Your choices',
      'proto.end.report': 'See the report card',
      'proto.end.fiction': 'The meteorite event and the station story are fiction.',
      'proto.end.c.built': 'Modules built: {list}',
      'proto.end.c.none': 'No modules built',
      'proto.end.c.heat_rhu': 'Your heat came from the old rovers\' RHUs: past missions kept you warm.',
      'proto.end.c.heat_heater': 'You bought an electric heater: staying warm now depends on power.',
      'proto.end.c.power_panel': 'You cleaned InSight\'s panel and put it to work.',
      'proto.end.c.power_solarkit': 'You asked Earth for a solar panel kit.',
      'proto.end.c.comms_antenna': 'You used Beagle 2\'s antenna: silent since 2003, this time it spoke.',
      'proto.end.c.comms_relay': 'You rented relay satellite time with your budget.',
      'proto.end.c.money': 'Data sent to Earth: {mbit} Mbit · budget left: {m} M$',
      'proto.end.pioneer.title': 'RED PIONEER',
      'proto.end.pioneer.body': 'The station stands: shell, shield, heat, power and comms all work. Earth can hear you. The rescue mission arrives in about {months} months; until then you live in the first permanent base on Mars.',
      'proto.end.silent.title': 'SILENT SHELTER',
      'proto.end.silent.body': 'The station keeps you alive, but there is no comms module. Seen from Earth, your signal stopped: just like the lost vehicles you studied. Will the rescue crew find you?',
      'proto.end.rad.title': 'IRRADIATED WAIT',
      'proto.end.rad.body': 'The station works, but there is no soil shield over it. In the ~{months} months until rescue you would take ~{dose} mSv on the surface; with the journey\'s dose you pass the {limit} mSv career limit.',
      'proto.end.dark.title': 'DARK BASE',
      'proto.end.dark.body': 'There is a shell but no power. Life support and MOXIE cannot run without electricity; the station slowly fell silent.',
      'proto.end.night.title': 'LONG NIGHT',
      'proto.end.night.body': 'There is a shell but no heating. Mars nights drop to −80 °C and the thin air holds no heat. The first winter froze the station.',
      'proto.end.lost.title': 'LOST SIGNAL',
      'proto.end.lost.body': 'The pressure shell was never built. With the MAV damaged, the habitat alone could not wait for a rescue. The mission became a story, like the vehicles you studied.',
      'proto.dig.metal': 'Metal! Something is buried',
      'proto.cb.tag': 'CABLE PANEL',
      'proto.cb.hint': 'Drag a cable end into the socket with the same code · Keyboard: 1–{n}, then A–{last}',
      'proto.cb.hint_match': 'Drag each cable end to the socket of the subsystem it belongs to · Keyboard: 1–{n}, then A–{last}',
      'proto.cb.skip': 'Skip',
      'proto.cb.ok': 'ALL CONNECTED',
      'proto.cb.fail': 'TIME UP',
    }
  };
  // This version has no MAV and no ready-made habitat (base_proto.js): the meteorite hits the crew lander,
  // whose cabin is the shelter. These replace the MAV wording above.
  Object.assign(TEXT.tr, {
    'proto.st.impact_body': 'İniş aracının yanına bir göktaşı düştü. Fırlayan kayalar yakıt tanklarını deldi ve yakıt sızdı: Dünya\'ya dönüş şimdilik imkânsız. Kurtarma görevi bir sonraki fırlatma penceresinde, yaklaşık {months} ay sonra gelebilir. O zamana kadar hayatta kalmak için bir istasyon kurman gerekiyor. Çarpma kargo konteynerlerini de etrafa saçtı.',
    'proto.st.imp.tank': 'İniş aracı yakıt tankları',
    'proto.st.imp.hab': 'Sığınak (iniş aracı kabini)',
    'proto.st.imp.text': 'İniş aracının yanına bir göktaşı düştü. Fırlayan kayalar yakıt tanklarını deldi, yakıt sızdı. Kabin sağlam, şimdilik sığınağın orası. Kurtarma ancak bir sonraki fırlatma penceresinde gelebilir.',
    'proto.st.imp.s3': 'İniş aracının batısındaki istasyon alanında E ile 5 modülü kur.',
    'proto.st.goal_hint': 'Malzeme topla, enkazlardan parça sök, iniş aracının batısındaki istasyon alanında E ile kur. B: istasyon paneli.',
    'proto.st.need_site': 'Kurmak için istasyon alanına git (iniş aracının batısı, turuncu direkler).',
    'proto.st.mav_broken': 'İniş aracının yakıt tankları delindi: kalkış yapılamaz.',
    [`goal.short.proto_station`]: 'İstasyonu kur ({n}/{total})',
    'proto.end.lost.body': 'Basınçlı gövde kurulamadı. Hasarlı iniş aracının kabini tek başına kurtarma görevini bekleyemezdi. Görev, incelediğin araçlar gibi bir hikâyeye dönüştü.'
  });
  Object.assign(TEXT.en, {
    'proto.st.impact_body': 'A meteorite hit next to the crew lander. Flying rock holed its fuel tanks and the fuel leaked out: going home is impossible for now. A rescue mission can come at the next launch window, about {months} months away. Until then you need to build a station to survive. The impact also scattered the cargo containers.',
    'proto.st.imp.tank': 'Lander fuel tanks',
    'proto.st.imp.hab': 'Shelter (lander cabin)',
    'proto.st.imp.text': 'A meteorite hit next to the crew lander. Flying rock holed its fuel tanks and the fuel leaked out. The cabin is intact: that is your shelter for now. A rescue can only come at the next launch window.',
    'proto.st.imp.s3': 'Build the 5 modules with E at the station site west of the lander.',
    'proto.st.goal_hint': 'Collect materials, salvage parts from wrecks, build with E at the station site west of the lander. B: station panel.',
    'proto.st.need_site': 'Go to the station site to build (west of the lander, the orange posts).',
    'proto.st.mav_broken': 'The lander\'s fuel tanks are holed: it cannot lift off.',
    [`goal.short.proto_station`]: 'Build the station ({n}/{total})',
    'proto.end.lost.body': 'The pressure shell was never built. The damaged lander\'s cabin alone could not wait for a rescue. The mission became a story, like the vehicles you studied.'
  });
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }

  const t = (k, v) => S.t(k, v);
  // numbers in the player's language (decimal comma in Turkish)
  const num = (x, d) => Number(x).toLocaleString(S.lang === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: d });

  const Surf = S.Surface;
  const F = S.Forensics;
  const proto = (s) => (s.proto = s.proto || {});
  const outsideOnSurface = (s) => !s.player.inside && !(Surf.inCave && Surf.inCave(s));

  /* ---------- colours that follow day and night ---------- */
  function hexMix(a, b, k) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k);
    return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
  }
  const atNight = (col, minute) => hexMix(col, '#120c10', S.Art.lighting(minute).dark * 0.85);

  /* ---------- one-time tip card under the objective card (top right) ---------- */
  let tipEl = null;
  const tipCss = document.createElement('style');
  tipCss.textContent =
    '.proto-tip{position:absolute;right:2.2%;top:35%;z-index:30;max-width:31%;display:grid;gap:4px;' +
    'background:rgba(22,20,24,.94);border-left:3px solid #3fe0e6;border-radius:10px;' +
    'padding:calc(10px * var(--k,1)) calc(14px * var(--k,1));color:#f2ebe2;' +
    'font:calc(15px * var(--k,1))/1.4 var(--font,system-ui,sans-serif);box-shadow:0 8px 24px rgba(0,0,0,.4);transition:opacity .5s}' +
    '.proto-tip b{color:#3fe0e6;letter-spacing:.08em;text-transform:uppercase;font-size:calc(14px * var(--k,1))}' +
    '.proto-tip kbd{display:inline-block;min-width:1.4em;padding:0 .3em;border:1px solid #6b7280;border-radius:4px;text-align:center;font:inherit}' +
    '.proto-tip.out{opacity:0}';
  document.head.appendChild(tipCss);
  function showTip(titleKey, bodyKey, icon) {
    const stage = document.getElementById('stage');
    if (!stage) return;
    if (tipEl) tipEl.remove();
    tipEl = document.createElement('div');
    tipEl.className = 'proto-tip';
    tipEl.setAttribute('role', 'status');
    const body = S.util.escape(t(bodyKey)).replace(/(↑|↓)|\b([SEWB])\b/g, (m) => '<kbd>' + m + '</kbd>'); // keys as key caps
    tipEl.innerHTML = '<b>' + icon + ' ' + S.util.escape(t(titleKey)) + '</b><span>' + body + '</span>';
    stage.appendChild(tipEl);
    const el = tipEl;
    setTimeout(() => tipEl === el && hideTip(), P.tipSeconds * 1000);
  }
  function hideTip() {
    if (!tipEl) return;
    const el = tipEl;
    tipEl = null;
    el.classList.add('out');
    setTimeout(() => el.remove(), 600);
  }
  /* ================================================================ */
  /* STATION STORY: impact on Sol 2, materials, salvage, budget, ends   */
  /* ================================================================ */
  const ITEMS = ['cargo', 'cable', 'regolith', 'rhu', 'panel', 'antenna', 'heater', 'solarkit', 'relay'];
  const esc = (x) => S.util.escape(x);
  const I = (n) => S.UI.icon(n);
  function station(s) {
    const st = proto(s);
    if (!st.station) st.station = { impact: false, inv: {}, built: {}, used: {}, picked: {}, dug: {}, budget: P.budgetStart, sentMbit: 0 };
    if (!st.station.dug) st.station.dug = {};
    for (const k of ITEMS) if (st.station.inv[k] === undefined) st.station.inv[k] = 0;
    return st.station;
  }
  const itemName = (k) => t('proto.st.item.' + k);
  const inSite = (s) => !s.player.inside && Math.abs(s.player.x - P.stationSiteM) <= P.stationSiteRangeM;
  const builtCount = (stn) => P.modules.filter((m) => stn.built[m.id]).length;
  const missingFor = (stn, needs) =>
    Object.keys(needs)
      .filter((k) => stn.inv[k] < needs[k])
      .map((k) => itemName(k) + ' ' + stn.inv[k] + '/' + needs[k]);

  // Budget: every packet that reaches Earth brings (fictional) research funding.
  S.bus.on('downlink:sent', (p) => {
    const s = S.getState && S.getState();
    if (!s) return;
    const stn = station(s);
    const mbit = (p && (p.sizeMbit || p.mbit)) || 0;
    stn.sentMbit += mbit;
    stn.budget += mbit * P.budgetPerMbit;
  });

  // ---- the impact ----
  let impactFx = 0;
  setInterval(() => {
    const s = S.getState && S.getState();
    if (!s || !S.Game || S.Game.scene !== 'world' || s.sol < P.impactSol || s.ending || s.gameOver) return;
    if (station(s).impact || impactFx || S.UI.modalOpen() || (S.isMinigameOpen && S.isMinigameOpen())) return;
    if (document.querySelector('.toast-layer .toast')) return; // wait until the game's own notices are gone
    impactFx = performance.now();
    S.bus.emit('audio:play', 'meteor');
    setTimeout(() => {
      S.FX.shake = 0.9;
      S.bus.emit('audio:play', 'quake');
    }, 1200);
    setTimeout(() => {
      const s2 = S.getState();
      const stn = station(s2);
      stn.impact = true;
      stn.impactSol = s2.sol;
      if (S.saveGame) S.saveGame();
      showImpactCard();
    }, 2600);
  }, 400);

  // The impact card: an alarm strip, a small live scene of the holed MAV, a status table, then the new
  // mission in three steps. Numbers (rescue window) come from nasa_data.json.
  const impCss = document.createElement('style');
  impCss.textContent =
    '.modal-pimp .modal-box > *{max-height:none;overflow:visible}' +
    '.pimp{width:calc(720px * var(--k,1));max-width:94%;background:#121318;border:2px solid #e8453c;border-radius:12px;overflow:hidden;color:#f2ebe2;' +
    'font:calc(13px * var(--k,1))/1.4 var(--font,system-ui,sans-serif);box-shadow:0 0 0 5px rgba(232,69,60,.16),0 24px 60px rgba(0,0,0,.65);animation:pimpIn .45s cubic-bezier(.2,1.4,.4,1)}' +
    '@keyframes pimpIn{from{transform:scale(.92) translateY(10px);opacity:0}to{transform:none;opacity:1}}' +
    '.pimp-head{display:flex;align-items:center;gap:.8em;padding:.55em 1.1em;background:repeating-linear-gradient(135deg,#6e1510 0 16px,#86201a 16px 32px);border-bottom:2px solid #e8453c}' +
    '.pimp-led{width:.8em;height:.8em;border-radius:50%;background:#ff3b2f;box-shadow:0 0 10px #ff3b2f;animation:pimpBlink .8s steps(2) infinite}' +
    '@keyframes pimpBlink{50%{opacity:.15}}' +
    '.pimp-head small{display:block;font:700 .78em/1.2 var(--font,ui-monospace,Consolas,monospace);letter-spacing:.16em;color:#ffb3a8}' +
    '.pimp-head h2{margin:0;font-size:1.65em;letter-spacing:.06em;line-height:1.1}' +
    '.pimp-top{display:grid;grid-template-columns:38% 1fr;gap:1em;padding:.8em 1.1em .4em}' +
    '.pimp-scene{width:100%;aspect-ratio:16/9;image-rendering:pixelated;border-radius:8px;border:1px solid #3a2a2a;background:#000}' +
    '.pimp-rows{display:grid;gap:.35em;align-content:start}' +
    '.pimp-row{display:flex;justify-content:space-between;align-items:center;gap:.8em;padding:.3em .65em;border-radius:6px;background:rgba(255,255,255,.04);font-size:.92em}' +
    '.pimp-row b{font:700 .9em/1 var(--font,ui-monospace,Consolas,monospace);letter-spacing:.08em;padding:.3em .55em;border-radius:4px}' +
    '.pimp-row .bad{color:#ff6b5e;background:rgba(232,69,60,.14)}.pimp-row .warn{color:#ffc24a;background:rgba(255,194,74,.12)}.pimp-row .ok{color:#3fe08a;background:rgba(63,224,138,.12)}' +
    '.pimp-text{margin:.1em 1.1em .55em;color:#d9d3ca;font-size:.95em}' +
    // retro block: terminal type, square pixel frames with a hard shadow, faint CRT scanlines
    '.pimp-mission{margin:0 1.1em;padding-top:.55em;border-top:2px dotted #2b4f52;font:700 .82em/1.2 var(--font,ui-monospace,Consolas,monospace);letter-spacing:.16em;color:#3fe0e6;text-shadow:0 0 6px rgba(63,224,230,.45)}' +
    '.pimp-cur{display:inline-block;width:.6em;height:1em;margin-left:.3em;vertical-align:-.12em;background:#3fe0e6;animation:pimpBlink 1s steps(2) infinite}' +
    '.pimp-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:.8em;padding:.55em 1.1em .65em}' +
    '.pimp-step{position:relative;border-radius:0;border:2px solid #2f8f93;padding:.5em .65em .55em;' +
    'background:repeating-linear-gradient(0deg,rgba(63,224,230,.05) 0 1px,transparent 1px 3px),#0b1517;' +
    'box-shadow:4px 4px 0 #0a3436;font:.84em/1.45 var(--font,ui-monospace,Consolas,monospace);color:#9fd9db}' +
    '.pimp-step b{display:flex;align-items:center;gap:.55em;margin-bottom:.3em;color:#fff;font:700 1.05em/1 var(--font,ui-monospace,Consolas,monospace);letter-spacing:.14em;text-transform:uppercase}' +
    '.pimp-step i{display:inline-grid;place-items:center;min-width:2.1em;height:1.55em;padding:0 .2em;border-radius:0;background:#3fe0e6;color:#06222a;' +
    'font:700 .9em/1 var(--font,ui-monospace,Consolas,monospace);font-style:normal;letter-spacing:.05em;box-shadow:2px 2px 0 #0a3436}' +
    '.pimp-foot{display:flex;align-items:center;justify-content:space-between;gap:1em;padding:.55em 1.1em .8em}' +
    '.pimp-note{display:grid;gap:.15em;max-width:62%}' +
    '.pimp-budget{margin:0;font:.84em/1.5 var(--font,ui-monospace,Consolas,monospace);color:#c9ccd2}.pimp-budget::before{content:"> ";color:#3fe0e6;font-weight:700}' +
    '.pimp-budget kbd{font:700 1em/1 var(--font,ui-monospace,Consolas,monospace);border:2px solid #9aa3ad;border-radius:0;padding:.05em .4em;color:#fff;background:#1b1e24;box-shadow:2px 2px 0 #000}' +
    '.pimp-foot small{color:#8a8f96;font-size:.8em}' +
    '.pimp-foot .btn{padding:.65em 1.3em;white-space:nowrap}';
  document.head.appendChild(impCss);

  function showImpactCard() {
    const s = S.getState();
    const months = S.DATA.constants.synodicPeriod.months;
    const row = (k, v, cls, vars) => '<div class="pimp-row"><span>' + esc(t('proto.st.imp.' + k)) + '</span><b class="' + cls + '">' + esc(t('proto.st.imp.' + v, vars)) + '</b></div>';
    const step = (n) => '<div class="pimp-step"><b><i>' + String(n).padStart(2, '0') + '</i>' + esc(t('proto.st.imp.s' + n + '_t')) + '</b>' + esc(t('proto.st.imp.s' + n)) + '</div>';
    const html =
      '<div class="pimp" role="alertdialog" aria-label="' + esc(t('proto.st.impact_title')) + '">' +
      '<div class="pimp-head"><span class="pimp-led"></span><div><small>' + esc(t('proto.st.imp.alarm', { sol: s.sol })) + '</small>' +
      '<h2>' + esc(t('proto.st.impact_title')) + '</h2></div></div>' +
      '<div class="pimp-top"><canvas class="pimp-scene" width="160" height="100"></canvas><div class="pimp-rows">' +
      row('tank', 'tank_v', 'bad') + row('home', 'home_v', 'bad') + row('rescue', 'rescue_v', 'warn', { months }) + row('hab', 'hab_v', 'ok') +
      '</div></div>' +
      '<p class="pimp-text">' + esc(t('proto.st.imp.text')) + '</p>' +
      '<div class="pimp-mission">▶ ' + esc(t('proto.st.imp.mission')) + '<span class="pimp-cur"></span></div>' +
      '<div class="pimp-steps">' + step(1) + step(2) + step(3) + '</div>' +
      '<div class="pimp-foot"><div class="pimp-note"><p class="pimp-budget">' + esc(t('proto.st.imp.budget')).replace(/\bB\b/, '<kbd>B</kbd>') + '</p>' +
      '<small>' + esc(t('proto.st.impact_fiction')) + '</small></div>' +
      '<button class="btn btn-primary" data-close>' + esc(t('proto.st.imp.go')) + '</button></div></div>';
    S.UI.openModal('proto-impact', html, {
      cls: 'modal-wide modal-pimp',
      onMount: (box) => animateImpactScene(box.querySelector('.pimp-scene')),
      onClose: () => setTimeout(() => showTip('proto.st.site_tip_title', 'proto.st.site_tip_body', '🛠'), 600)
    });
    S.bus.emit('audio:play', 'alarm');
  }

  // Small live scene for the card: dusk sky, the MAV with a hole in its tank and smoke, a fresh crater
  // with ejecta and a few rocks still falling.
  function animateImpactScene(cv) {
    if (!cv) return;
    const c = cv.getContext('2d');
    const W = cv.width;
    const H = cv.height;
    const gy = 84;
    const start = performance.now();
    const frame = (now) => {
      if (!cv.isConnected) return;
      const tt = (now - start) / 1000;
      const sky = c.createLinearGradient(0, 0, 0, gy);
      sky.addColorStop(0, '#3a1f22');
      sky.addColorStop(1, '#a8573a');
      c.fillStyle = sky;
      c.fillRect(0, 0, W, gy);
      c.fillStyle = '#5a3328';
      for (let x = 0; x < W; x += 2) c.fillRect(x, gy - 8 - Math.round(Math.sin(x * 0.07) * 3 + Math.sin(x * 0.19) * 2), 2, 10);
      c.fillStyle = '#7a3f2a';
      c.fillRect(0, gy, W, H - gy);
      c.fillStyle = '#5e3022';
      for (let x = 0; x < W; x += 9) c.fillRect(x + ((x * 7) % 5), gy + 4 + ((x * 3) % 9), 4, 1);
      // fresh crater with a raised rim and ejecta, to the right
      const cx = 122;
      c.fillStyle = '#2a1410';
      c.fillRect(cx - 18, gy, 36, 4);
      c.fillRect(cx - 12, gy + 4, 24, 2);
      c.fillStyle = '#b06a48';
      c.fillRect(cx - 24, gy - 2, 8, 2);
      c.fillRect(cx + 16, gy - 2, 8, 2);
      c.fillStyle = '#3a1d16';
      [[-34, 3], [-29, 2], [30, 3], [37, 2], [44, 2]].forEach(([dx, s]) => c.fillRect(cx + dx, gy - s + 1, s + 1, s));
      // glow in the crater fading
      c.fillStyle = 'rgba(255,140,60,' + Math.max(0, 0.6 - tt * 0.05).toFixed(2) + ')';
      c.fillRect(cx - 8, gy + 1, 16, 2);
      // the crew lander (simple pixel silhouette: black nose, white hull, orange skirt, legs)
      const mx = 48;
      const topY = gy - 62;
      c.fillStyle = '#5c5e66';
      [[-22, 14], [18, 14]].forEach(([dx]) => c.fillRect(mx + dx, gy - 14, 3, 14));
      c.fillRect(mx - 26, gy - 2, 8, 2);
      c.fillRect(mx + 18, gy - 2, 8, 2);
      c.fillStyle = '#e8692a';
      c.fillRect(mx - 20, gy - 22, 40, 9);
      c.fillStyle = '#ece9e2';
      c.fillRect(mx - 16, gy - 50, 32, 28);
      c.fillStyle = '#cbc6bd';
      c.fillRect(mx + 8, gy - 50, 8, 28);
      c.fillStyle = '#26272d';
      c.fillRect(mx - 12, topY, 24, 12);
      c.fillRect(mx - 8, topY - 4, 16, 4);
      c.fillStyle = '#3f8ff5';
      c.fillRect(mx - 8, gy - 46, 4, 3);
      c.fillRect(mx + 2, gy - 46, 4, 3);
      c.fillStyle = '#f2c230';
      for (let i = 0; i < 8; i++) if (i % 2) c.fillRect(mx - 16 + i * 4, gy - 25, 4, 2);
      c.fillStyle = '#140c0c'; // the hole
      c.fillRect(mx + 2, topY + 30, 4, 4);
      c.fillStyle = '#ff9a3c';
      if (Math.floor(now / 180) % 2) c.fillRect(mx + 3, topY + 31, 2, 2);
      // leaking fuel vapour and smoke
      for (let i = 0; i < 7; i++) {
        const ph = (tt * 0.45 + i / 7) % 1;
        c.globalAlpha = 0.55 * (1 - ph);
        c.fillStyle = i % 2 ? '#3a3436' : '#55504f';
        c.beginPath();
        c.arc(mx + 5 + ph * 30 + Math.sin(ph * 7 + i) * 3, topY + 30 - ph * 40, 2 + ph * 7, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      // rocks still falling from the impact
      for (let i = 0; i < 4; i++) {
        const ph = (tt * 0.6 + i * 0.27) % 1;
        const x = cx - 10 - i * 16 + ph * 6;
        const y = 10 + ph * (gy - 12);
        c.fillStyle = '#2a1712';
        c.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // fireball, flash and dust plume by the crew lander; afterwards its holed tanks keep smoking
  const landerPx = () => (S.Lander && S.Lander.padPx ? S.Lander.padPx() : Surf.mToPx(85));
  function drawImpact(ctx, s, now) {
    const gy = Surf.GROUND_Y;
    const tx = Math.round(landerPx() - S.FX.camX + 70);
    if (impactFx) {
      const e = (now - impactFx) / 1000;
      if (e < 1.2) {
        const x0 = tx + 560;
        const y0 = -30;
        const k = e / 1.2;
        ctx.save();
        for (let i = 0; i < 16; i++) {
          const kk = Math.max(0, k - i * 0.016);
          const xx = x0 + (tx - x0) * kk;
          const yy = y0 + (gy - 8 - y0) * kk;
          ctx.globalAlpha = (1 - i / 16) * 0.9;
          ctx.fillStyle = i < 3 ? '#fff6d8' : i < 8 ? '#ffb347' : '#a0522d';
          const sz = i < 8 ? 5 : 3;
          ctx.fillRect(Math.round(xx) - 2, Math.round(yy) - 2, sz, sz);
        }
        ctx.restore();
      } else if (e < 3.4) {
        const k = (e - 1.2) / 2.2;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 0.85 * (1 - k * 2));
        ctx.fillStyle = '#fff1d6';
        const v = S.FX.view || { w: 640, h: 360, offY: 0 };
        ctx.fillRect(0, -v.offY, v.w, v.h);
        ctx.globalAlpha = Math.max(0, 0.75 * (1 - k));
        ctx.fillStyle = '#b0643a';
        const r = 20 + k * 90;
        ctx.beginPath();
        ctx.ellipse(tx, gy - r * 0.4, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    const stn = s.proto && s.proto.station;
    if (!stn || !stn.impact || s.player.inside) return;
    const mx = Math.round(landerPx() - S.FX.camX + 22); // the right flank of the lander's lower hull
    if (mx < -120 || mx > ((S.FX.view && S.FX.view.w) || 640) + 120) return;
    const upright = true;
    const baseY = gy - 96;
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const ph = ((now / 1000) * 0.35 + i / 8) % 1;
      ctx.globalAlpha = 0.5 * (1 - ph);
      ctx.fillStyle = i % 2 ? '#3a3436' : '#4a4446';
      const r = 3 + ph * 11;
      ctx.beginPath();
      ctx.arc(mx + 10 + Math.sin(ph * 6 + i) * 6 + ph * 26, baseY - ph * 90, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (upright) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#1e1a1a'; // the hole in the tank
      ctx.fillRect(mx + 4, baseY + 4, 7, 6);
      if (Math.floor(now / 160) % 3 === 0) {
        ctx.fillStyle = '#ff9a3c';
        ctx.fillRect(mx + 6, baseY + 6, 2, 2);
      }
    }
    ctx.restore();
  }

  // ---- materials in the world ----
  // height (sprite px) of the main boulder an item sits on; 0 = on the ground
  const liftOf = (p) => {
    if (p.place !== 'boulder') return 0;
    const b = (S.DATA.terrain.boulders || []).find((x) => Math.abs(x.atM - p.m) < 1);
    return b ? b.heightPx : 0;
  };
  function drawStationWorld(ctx, s, minute, camX, w, gy, light) {
    const stn = station(s);
    if (!stn.impact) return;
    for (const p of P.pickups) {
      const x = Math.round(Surf.mToPx(p.m) - camX);
      if (x < -40 || x > w + 40) continue;
      if (!stn.picked[p.id]) drawItem(ctx, p.item, x, gy - liftOf(p), light);
    }
    drawStationSite(ctx, stn, Math.round(Surf.mToPx(P.stationSiteM) - camX), gy, minute, w);
  }
  function drawItem(ctx, item, x, y, light) {
    if (item === 'cargo') {
      ctx.fillStyle = '#c9ccd2';
      ctx.fillRect(x - 7, y - 5, 14, 5);
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(x - 7, y - 5, 14, 1);
      ctx.fillStyle = '#8d939b';
      ctx.fillRect(x - 7, y - 1, 14, 1);
      ctx.fillRect(x - 2, y - 4, 4, 2);
    } else if (item === 'cable') {
      ctx.fillStyle = '#3a3d42';
      ctx.fillRect(x - 5, y - 4, 10, 4);
      ctx.fillStyle = '#e8742e';
      ctx.fillRect(x - 4, y - 3, 8, 1);
      ctx.fillRect(x - 4, y - 1, 8, 1);
      ctx.fillStyle = '#c9a23a';
      ctx.fillRect(x + 5, y - 2, 3, 1);
    }
    if (light.dark < 0.7) {
      const ph = (performance.now() / 1000 + x * 0.013) % 2;
      if (ph < 0.3) {
        ctx.save();
        ctx.globalAlpha = (1 - ph / 0.3) * 0.9;
        ctx.fillStyle = '#fff6d8';
        ctx.fillRect(x + 3, y - 11, 1, 7);
        ctx.fillRect(x, y - 8, 7, 1);
        ctx.restore();
      }
    }
  }
  // The station grows on its pad as modules are built.
  function drawStationSite(ctx, stn, x, gy, minute, w) {
    if (x < -140 || x > w + 140) return;
    const B = stn.built;
    const N = (c) => atNight(c, minute);
    ctx.fillStyle = N('#8a8f96');
    ctx.fillRect(x - 48, gy - 3, 96, 3); // pad
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(x - 48, gy - 10, 2, 7);
    ctx.fillRect(x + 46, gy - 10, 2, 7);
    const shellH = (dx) => Math.round(30 * Math.sqrt(Math.max(0, 1 - (dx / 40) * (dx / 40))));
    if (B.shell) {
      for (let dx = -40; dx <= 40; dx += 2) {
        const hh = shellH(dx);
        ctx.fillStyle = N('#d6d9de');
        ctx.fillRect(x + dx, gy - 3 - hh, 2, hh);
        if (dx % 12 === 0) {
          ctx.fillStyle = N('#9aa0a8'); // panel seams
          ctx.fillRect(x + dx, gy - 3 - hh, 1, hh);
        }
      }
      ctx.fillStyle = N('#2a3a52');
      ctx.fillRect(x - 4, gy - 15, 8, 12); // hatch
    } else {
      ctx.fillStyle = N('#9aa0a8'); // empty frame
      ctx.fillRect(x - 40, gy - 24, 2, 21);
      ctx.fillRect(x + 38, gy - 24, 2, 21);
      ctx.fillRect(x - 40, gy - 24, 80, 2);
    }
    if (B.shield) {
      for (let dx = -44; dx <= 44; dx += 2) {
        const hh = Math.round(34 * Math.sqrt(Math.max(0, 1 - (dx / 44) * (dx / 44))));
        const inner = Math.abs(dx) <= 40 ? shellH(dx) : 0;
        ctx.fillStyle = N('#a4603e'); // a layer of regolith heaped over the shell (the hatch below stays clear)
        ctx.fillRect(x + dx, gy - 3 - hh, 2, Math.max(2, hh - inner));
      }
    }
    if (B.heat) {
      ctx.fillStyle = N('#5a5f66');
      ctx.fillRect(x - 36, gy - 9, 9, 6);
      const on = Math.floor(performance.now() / 600) % 2;
      ctx.fillStyle = on ? '#ff9a3c' : '#c4682a';
      ctx.fillRect(x - 34, gy - 7, 2, 2);
    }
    if (B.power) {
      ctx.fillStyle = N('#6c727a');
      ctx.fillRect(x + 56, gy - 14, 2, 11);
      ctx.fillRect(x + 80, gy - 14, 2, 11);
      ctx.fillStyle = N('#22335c');
      ctx.fillRect(x + 50, gy - 20, 38, 6);
      ctx.fillStyle = N('#5b77b3');
      for (let i = 0; i < 9; i++) ctx.fillRect(x + 51 + i * 4, gy - 19, 3, 1);
    }
    if (B.comms) {
      ctx.fillStyle = N('#9aa0a8');
      ctx.fillRect(x + 24, gy - 52, 2, 22);
      ctx.fillStyle = N('#e3e0d8');
      ctx.fillRect(x + 18, gy - 58, 14, 3);
      ctx.fillRect(x + 21, gy - 60, 8, 2);
      if (Math.floor(performance.now() / 500) % 3 === 0) {
        ctx.fillStyle = '#3fe0e6';
        ctx.fillRect(x + 24, gy - 63, 2, 2);
      }
    }
  }
  function collectPickups(s) {
    const stn = station(s);
    if (!stn.impact) return;
    for (const p of P.pickups) {
      if (stn.picked[p.id] || Math.abs(s.player.x - p.m) > 8) continue;
      const y = Surf.body.y; // height above the ground in sprite px (standing on a boulder = its height)
      const lift = liftOf(p);
      if (lift ? y < lift - 4 : y > 10) continue; // a boulder top needs a jump
      stn.picked[p.id] = true;
      stn.inv[p.item] += 1;
      S.bus.emit('audio:play', 'click');
      S.bus.emit('fx:float', { px: Surf.body.px, text: t('proto.st.pick', { item: itemName(p.item) }), tone: 'ok' });
    }
  }

  // ---- the station panel (E at the site to build, B anywhere to see it and to spend the budget) ----
  const stCss = document.createElement('style');
  stCss.textContent =
    '.proto-st h4{margin:.7em 0 .35em;font-size:.78em;letter-spacing:.08em;text-transform:uppercase;color:#9aa3ad}' +
    '.pst-budget{display:grid;grid-template-columns:auto 1fr auto;gap:.6em;align-items:center;font-size:.85em}' +
    '.pst-bar,.ph-bar{height:.6em;border-radius:.3em;background:rgba(255,255,255,.08);overflow:hidden}' +
    '.pst-bar i,.ph-bar i{display:block;height:100%;background:linear-gradient(90deg,#3fe08a,#3fe0e6)}' +
    '.pst-mod{display:grid;grid-template-columns:1fr auto;gap:.8em;align-items:center;padding:.5em .7em;border:1px solid var(--line,#333);border-radius:.4em;margin-bottom:.35em;font-size:.82em}' +
    '.pst-mod p{margin:.15em 0 0;opacity:.75;font-size:.92em}.pst-mod.done{border-color:#3fe08a;background:rgba(63,224,138,.06)}' +
    '.pst-ctl{display:flex;flex-direction:column;gap:.25em;align-items:flex-end;max-width:17em}' +
    '.pst-ctl small{opacity:.7;font-size:.85em;text-align:right}.pst-ok{color:#3fe08a;font-weight:700}.pst-dim{opacity:.6}' +
    '.pst-inv{display:flex;flex-wrap:wrap;gap:.35em}.pst-chip{padding:.2em .55em;border-radius:1em;background:rgba(255,255,255,.07);font-size:.8em}' +
    '.pst-shop{display:grid;grid-template-columns:1fr 1fr;gap:.35em}.pst-buy{display:flex;justify-content:space-between;gap:.6em;text-align:left}' +
    '.proto-hud{position:absolute;left:1.6%;top:64%;width:25%;z-index:6;background:rgba(22,20,24,.92);border-radius:10px;' +
    'padding:calc(8px * var(--k,1)) calc(12px * var(--k,1));color:#f2ebe2;font:calc(13px * var(--k,1))/1.45 var(--font,system-ui,sans-serif);display:grid;gap:.25em}' +
    '.proto-hud .ph-row{display:flex;justify-content:space-between}.proto-hud b{letter-spacing:.06em;text-transform:uppercase;font-size:.85em;color:#9aa3ad}' +
    '.proto-hud .ph-inv{opacity:.8;font-size:.9em}.proto-hud kbd{font:inherit;border:1px solid #6b7280;border-radius:4px;padding:0 .35em}' +
    '.proto-end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#3a1d16,#0b0709 70%)}' +
    '.proto-end.good{background:radial-gradient(circle at 50% 30%,#1d2f3a,#07090b 70%)}' +
    '.pe-box{max-width:min(46em,86%);color:#f2ebe2;font:calc(16px * var(--k,1))/1.5 var(--font,system-ui,sans-serif);display:grid;gap:.5em}' +
    '.pe-box h1{margin:0;font-size:2.2em;letter-spacing:.06em}.pe-tag{color:#ff9a5a;letter-spacing:.12em;font-size:.8em}' +
    '.pe-box h4{margin:.4em 0 0;color:#9aa3ad;letter-spacing:.08em;text-transform:uppercase;font-size:.8em}.pe-box ul{margin:0;padding-left:1.2em}' +
    '.pe-box small{opacity:.6}.pe-box .btn{justify-self:start}';
  document.head.appendChild(stCss);

  function stationHtml(s) {
    const stn = station(s);
    const here = inSite(s);
    const pct = Math.min(100, (stn.budget / P.budgetBarMax) * 100);
    const mods = P.modules
      .map((m) => {
        const done = stn.built[m.id];
        let ctl;
        if (done) ctl = '<span class="pst-ok">' + I('check') + ' ' + esc(stn.used[m.id] ? t('proto.st.built', { item: itemName(stn.used[m.id]) }) : t('proto.st.mod.' + m.id)) + '</span>';
        else if (m.after && !stn.built[m.after]) ctl = '<span class="pst-dim">' + esc(t('proto.st.need_shell')) + '</span>';
        else
          ctl = (m.alt || [{ use: null, needs: m.needs }])
            .map((o, i) => {
              const miss = missingFor(stn, o.needs);
              const label = o.use ? t('proto.st.build_with', { item: itemName(o.use) }) : t('proto.st.build');
              const can = !miss.length && here;
              return (
                '<button class="btn btn-sm ' + (can ? 'btn-primary' : 'btn-ghost') + '" data-build="' + m.id + '" data-alt="' + i + '" ' + (can ? '' : 'disabled') + '>' + esc(label) + '</button>' +
                (miss.length ? '<small>' + esc(t('proto.st.missing', { list: miss.join(', ') })) + '</small>' : '')
              );
            })
            .join('');
        return (
          '<div class="pst-mod ' + (done ? 'done' : '') + '"><div><b>' + esc(t('proto.st.mod.' + m.id)) + '</b><p>' + esc(t('proto.st.mod.' + m.id + '.desc')) + '</p></div>' +
          '<div class="pst-ctl">' + ctl + '</div></div>'
        );
      })
      .join('');
    const inv = ITEMS.filter((k) => stn.inv[k] > 0)
      .map((k) => '<span class="pst-chip">' + esc(itemName(k)) + ' <b>' + stn.inv[k] + '</b></span>')
      .join('') || '<span class="pst-chip">—</span>';
    const shop = P.shop
      .map((o) => '<button class="btn btn-ghost btn-sm pst-buy" data-buy="' + o.id + '" ' + (stn.budget < o.cost ? 'disabled' : '') + '><span>' + esc(t('proto.st.shop.' + o.id)) + '</span><b>' + o.cost + ' M$</b></button>')
      .join('');
    return (
      '<div class="panel big-panel proto-st" style="max-width:52em">' +
      '<div class="bp-head"><span class="bp-num">' + I('wrench') + '</span><h2>' + esc(t('proto.st.title')) + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="pst-budget"><b>' + esc(t('proto.st.budget')) + '</b><div class="pst-bar"><i style="width:' + pct + '%"></i></div><b>' + Math.round(stn.budget) + ' M$</b></div>' +
      '<p class="pv-note" style="margin:.3em 0 0">' + esc(t('proto.st.budget_note')) + '</p>' +
      (here ? '' : '<p class="pv-note">' + I('map') + ' ' + esc(t('proto.st.need_site')) + '</p>') +
      '<h4>' + esc(t('proto.st.modules')) + ' ' + builtCount(stn) + '/' + P.modules.length + '</h4>' + mods +
      '<h4>' + esc(t('proto.st.inv')) + '</h4><div class="pst-inv">' + inv + '</div>' +
      '<h4>' + esc(t('proto.st.shop')) + '</h4><div class="pst-shop">' + shop + '</div></div>'
    );
  }
  function openStation() {
    const mount = (box) => {
      box.querySelectorAll('[data-build]').forEach((b) =>
        b.addEventListener('click', () => {
          buildModule(b.dataset.build, Number(b.dataset.alt));
          S.UI.updateModal('proto-station', stationHtml(S.getState()), mount);
        })
      );
      box.querySelectorAll('[data-buy]').forEach((b) =>
        b.addEventListener('click', () => {
          buyItem(b.dataset.buy);
          S.UI.updateModal('proto-station', stationHtml(S.getState()), mount);
        })
      );
    };
    S.UI.openModal('proto-station', stationHtml(S.getState()), { cls: 'modal-wide', onMount: mount });
  }
  function buildModule(id, alt) {
    const s = S.getState();
    const stn = station(s);
    const m = P.modules.find((x) => x.id === id);
    if (!m || stn.built[id] || !inSite(s) || (m.after && !stn.built[m.after])) return;
    const o = m.alt ? m.alt[alt] : { use: null, needs: m.needs };
    if (!o || missingFor(stn, o.needs).length) return;
    for (const k of Object.keys(o.needs)) stn.inv[k] -= o.needs[k];
    stn.built[id] = true;
    if (o.use) stn.used[id] = o.use;
    S.Sim.advance(s, P.buildGameMinutes); // building takes time: suit O2 keeps going down
    S.FX.shake = 0.2;
    S.bus.emit('audio:play', 'success');
    S.UI.toast(t('proto.st.built_toast', { mod: t('proto.st.mod.' + id) }), 'ok', 3500);
  }
  function buyItem(id) {
    const stn = station(S.getState());
    const o = P.shop.find((x) => x.id === id);
    if (!o || stn.budget < o.cost) return S.UI.toast(t('proto.st.no_money'), 'warn');
    stn.budget -= o.cost;
    for (const k of Object.keys(o.gives)) stn.inv[k] += o.gives[k];
    S.bus.emit('audio:play', 'click');
    S.UI.toast(t('proto.st.bought', { item: t('proto.st.shop.' + id) }), 'ok', 3500);
  }

  // B opens or closes the station panel (after the impact)
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyB' || e.repeat) return;
    const s = S.getState && S.getState();
    if (!s || !S.Game || S.Game.scene !== 'world' || !station(s).impact || (S.isMinigameOpen && S.isMinigameOpen())) return;
    const top = S.UI.topModal();
    if (top && top.id === 'proto-station') S.UI.closeModal('proto-station');
    else if (!top) openStation();
  });

  // Budget on the HUD from the start (it fills with every packet that reaches Earth); after the impact the
  // panel also shows the modules and the materials collected.
  let hudEl = null;
  setInterval(() => {
    const s = S.getState && S.getState();
    const show = s && s.sol >= 1 && S.Game && S.Game.scene === 'world' && !s.player.inside; // not over the shelter panels
    if (!show) {
      if (hudEl) hudEl.hidden = true;
      return;
    }
    const stn = station(s);
    const stage = document.getElementById('stage');
    if (!stage) return;
    if (!hudEl || !hudEl.isConnected) {
      hudEl = document.createElement('div');
      hudEl.className = 'proto-hud';
      stage.appendChild(hudEl);
    }
    hudEl.hidden = false;
    const pct = Math.min(100, (stn.budget / P.budgetBarMax) * 100);
    hudEl.innerHTML =
      '<div class="ph-row"><b>' + esc(t('proto.st.budget')) + '</b><span>' + Math.round(stn.budget) + ' M$</span></div>' +
      '<div class="ph-bar"><i style="width:' + pct + '%"></i></div>' +
      (stn.impact
        ? '<div class="ph-row"><b>' + esc(t('proto.st.modules')) + '</b><span>' + builtCount(stn) + '/' + P.modules.length + ' <kbd>B</kbd></span></div>' +
          '<div class="ph-inv">' + ['cargo', 'cable', 'regolith'].map((k) => esc(itemName(k)) + ' ' + (stn.inv[k] || 0)).join(' · ') + '</div>'
        : '<div class="ph-inv">' + esc(t('proto.st.budget_hint')) + '</div>');
  }, 400);

  // Salvaging a wreck: what it gives the station, and whether each part suits it (✓ / ✗ and why).
  const origSalvage = F.salvage;
  F.salvage = function (s, caseId) {
    const before = s.forensics[caseId] && s.forensics[caseId].salvaged;
    const r = origSalvage.apply(this, arguments);
    if (before || !s.forensics[caseId] || !s.forensics[caseId].salvaged) return r;
    const parts = P.salvageParts[caseId] || [];
    const stn = station(s);
    for (const p of parts) if (p.ok && p.item) stn.inv[p.item] += 1;
    if (stn.impact && parts.length) {
      setTimeout(() => {
        const html =
          '<div class="panel big-panel" style="max-width:40em"><div class="bp-head"><span class="bp-num">' + I('wrench') + '</span><h2>' + esc(t('proto.st.salvage_title')) + '</h2>' +
          '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
          parts.map((p) => '<p class="pv-note ' + (p.ok ? 'ok' : '') + '" style="font-size:.85em">' + esc(t('proto.st.sv.' + p.part)) + '</p>').join('') + '</div>';
        S.UI.openModal('proto-salvage', html, { cls: 'modal-wide' });
      }, 60);
    }
    return r;
  };

  // ---- the endings: which modules stand, and how they were built ----
  function stationEndingId(stn) {
    const B = stn.built;
    if (!B.shell) return 'lost';
    if (!B.heat) return 'night';
    if (!B.power) return 'dark';
    if (!B.shield) return 'rad';
    if (!B.comms) return 'silent';
    return 'pioneer';
  }
  function playStationEnding(onDone) {
    const s = S.getState();
    const stn = station(s);
    const id = stationEndingId(stn);
    const C = S.DATA.constants;
    const months = C.synodicPeriod.months;
    const dose = C.radiation.surfaceDailyMsv * months * 30.44; // surface dose while waiting (days in a month: 30.44)
    const vars = { months, dose: num(dose, 0), limit: C.radiation.careerLimitMsv };
    const built = P.modules.filter((m) => stn.built[m.id]).map((m) => t('proto.st.mod.' + m.id));
    const lines = [built.length ? t('proto.end.c.built', { list: built.join(', ') }) : t('proto.end.c.none')];
    for (const k of ['heat', 'power', 'comms']) if (stn.used[k]) lines.push(t('proto.end.c.' + k + '_' + stn.used[k]));
    lines.push(t('proto.end.c.money', { mbit: num(stn.sentMbit, 0), m: Math.round(stn.budget) }));
    const good = id === 'pioneer' || id === 'silent';
    const html =
      '<div class="proto-end ' + (good ? 'good' : 'bad') + '" data-end="' + id + '"><div class="pe-box">' +
      '<span class="pe-tag">SOL ' + s.sol + '</span><h1>' + esc(t('proto.end.' + id + '.title')) + '</h1>' +
      '<p>' + esc(t('proto.end.' + id + '.body', vars)) + '</p>' +
      '<h4>' + esc(t('proto.end.choices')) + '</h4><ul>' + lines.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul>' +
      '<small>' + esc(t('proto.end.fiction')) + '</small>' +
      '<button class="btn btn-primary" data-pe-report>' + esc(t('proto.end.report')) + '</button></div></div>';
    const root = S.UI.showScreen(html, 'scene-end');
    S.bus.emit('audio:play', good ? 'success' : 'fail');
    const btn = (root || document).querySelector('[data-pe-report]');
    if (btn) btn.addEventListener('click', () => onDone('report'));
  }

  // After the impact the station replaces the MAV and the open-ended exploring goals on the objective card.
  // Urgent goals (O2, cold, suit, night, solar array) and unfinished wreck work stay first.
  const STATION_OVER = ['deploy_mav', 'mav_fuel', 'mav_launch', 'isru', 'explore_east', 'explore_west', 'tube_dig', 'cave_go'];
  if (S.Objectives) {
    const prevGoal = S.Objectives.mainGoal;
    S.Objectives.mainGoal = function (s) {
      const g = prevGoal.apply(this, arguments);
      const stn = s && s.proto && s.proto.station;
      if (stn && stn.impact && builtCount(stn) < P.modules.length && g && STATION_OVER.includes(g.id)) {
        return { id: 'proto_station', key: 'proto.st.goal', vars: { n: builtCount(stn), total: P.modules.length }, hintKey: 'proto.st.goal_hint', target: { m: P.stationSiteM } };
      }
      return g;
    };
  }

  /* ================================================================ */
  /* CABLE PANEL: the black-box telemetry task with real-looking cables */
  /* ================================================================ */
  // Same rules as the wires template in minigames.js (match each code on the left to its socket on the
  // right, mistakes and time lower the score, 1–4 then A–D on the keyboard, Esc skips), drawn as a real
  // panel: hanging cables with weight, a dim bundle behind, terminals, sockets and LEDs.
  const CB_CODES = [
    { code: 'PWR 28V', color: '#e8423b' },
    { code: 'TLM BUS', color: '#3f8ff5' },
    { code: 'GND ISO', color: '#3fd07a' },
    { code: 'RS-422', color: '#ffc233' },
    { code: 'HTR LOOP', color: '#d25bd8' }
  ];
  const CB_W = 320;
  const CB_H = 176;
  let cableOpen = false;

  const cbCss = document.createElement('style');
  cbCss.textContent =
    '.modal-cb .modal-box > *{max-height:none;overflow:visible}' +
    '.pcb{width:calc(700px * var(--k,1));max-width:94%;background:#121318;border:2px solid #3fe0e6;border-radius:0;color:#f2ebe2;' +
    'box-shadow:6px 6px 0 #0a3436,0 20px 50px rgba(0,0,0,.6);font:calc(13px * var(--k,1))/1.4 var(--font,ui-monospace,Consolas,monospace)}' +
    '.pcb-head{display:flex;align-items:center;gap:.8em;padding:.55em .9em;border-bottom:2px solid #1f6f73;background:repeating-linear-gradient(0deg,rgba(63,224,230,.05) 0 1px,transparent 1px 3px),#0d1a1c}' +
    '.pcb-tag{background:#3fe0e6;color:#06222a;font-weight:700;padding:.15em .5em;letter-spacing:.12em;box-shadow:2px 2px 0 #0a3436}' +
    '.pcb-head h3{margin:0;flex:1;font:700 1.1em/1.2 var(--font,ui-monospace,Consolas,monospace);letter-spacing:.08em;text-transform:uppercase}' +
    '.pcb-head button{font:inherit;color:#e9eef2;background:#1b1e24;border:2px solid #6b7280;padding:.15em .6em;cursor:pointer;box-shadow:2px 2px 0 #000}' +
    '.pcb-desc{margin:.5em .9em 0;color:#9fd9db;font-size:.92em}' +
    '.pcb-timer{height:6px;margin:.5em .9em 0;background:#1b1e24;border:1px solid #2f3a3c}.pcb-timer i{display:block;height:100%;background:#3fe0e6}' +
    '.pcb-timer i.low{background:#e8453c}' +
    '.pcb-stage{position:relative;margin:.6em .9em 0;border:2px solid #2b2f36;box-shadow:4px 4px 0 #000}' +
    '.pcb-stage canvas{display:block;width:100%;aspect-ratio:' + CB_W + '/' + CB_H + ';image-rendering:pixelated;cursor:grab;touch-action:none}' +
    '.pcb-stage canvas.drag{cursor:grabbing}' +
    '.pcb-lbl{position:absolute;transform:translateY(-50%);font:700 calc(11px * var(--k,1))/1 var(--font,ui-monospace,Consolas,monospace);color:#e9eef2;' +
    'background:rgba(10,11,14,.85);padding:.2em .4em;border-left:3px solid var(--c);pointer-events:none;white-space:nowrap}' +
    '.pcb-lbl kbd{font:inherit;color:#06222a;background:var(--c);padding:0 .3em;margin-right:.35em}' +
    '.pcb-lbl.r{border-left:0;border-right:3px solid var(--c);transform:translate(-100%,-50%)}.pcb-lbl.r kbd{margin:0 0 0 .35em}' +
    '.pcb-lbl.done{opacity:.45}' +
    '.pcb-foot{display:flex;justify-content:space-between;gap:1em;padding:.55em .9em .7em;font-size:.88em;color:#9aa3ad}' +
    '.pcb-status b{color:#e9eef2}.pcb-status.ok b{color:#3fe08a}.pcb-status.bad b{color:#ff6b5e}';
  document.head.appendChild(cbCss);

  function runCableBox(config) {
    return new Promise((resolve) => {
      // config.match = [{ left, right }] (main's black-box task): a telemetry channel on the left goes to the
      // subsystem it belongs to on the right. Sockets then give no colour hint: the link is made by reasoning.
      const match = Array.isArray(config.match) && config.match.length ? config.match : null;
      const codes = match
        ? match.map((m, i) => ({ code: m.left, right: m.right, color: CB_CODES[i % CB_CODES.length].color }))
        : CB_CODES.slice(0, Math.min(CB_CODES.length, config.pairs || 4));
      const N = codes.length;
      const sockColor = (cd) => (match ? '#8a8f9a' : cd.color);
      const rng = S.makeRng((S.getState().minute | 0) * 17 + 5);
      const right = codes.map((c, i) => i);
      for (let i = right.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [right[i], right[j]] = [right[j], right[i]];
      }
      if (right.every((v, i) => v === i)) right.reverse();
      const limit = config.timeLimitSec || 25;
      const top = 30;
      const gap = Math.min(34, (CB_H - 50) / Math.max(1, N - 1));
      const L = codes.map((c, i) => ({ x: 26, y: top + i * gap }));
      const R = right.map((ci, k) => ({ x: CB_W - 26, y: top + k * gap, ci }));
      const sockOf = (ci) => R.findIndex((r) => r.ci === ci);

      const title = config.titleKey ? t(config.titleKey) : t('mg.wires.title');
      const desc = config.descKey ? t(config.descKey) : t('mg.wires.desc');
      const lbl = (side, i) => {
        const c = side === 'L' ? codes[i] : codes[R[i].ci];
        const p = side === 'L' ? L[i] : R[i];
        const key = side === 'L' ? String(i + 1) : String.fromCharCode(65 + i);
        const x = side === 'L' ? ((p.x + 12) / CB_W) * 100 : ((p.x - 12) / CB_W) * 100;
        const col = side === 'L' ? c.color : sockColor(c);
        const name = esc(side === 'L' ? c.code : c.right || c.code);
        return (
          '<span class="pcb-lbl ' + (side === 'R' ? 'r' : '') + '" data-l="' + side + i + '" style="--c:' + col + ';left:' + x + '%;top:' + ((p.y - 10) / CB_H) * 100 + '%">' +
          (side === 'L' ? '<kbd>' + key + '</kbd>' + name : name + '<kbd>' + key + '</kbd>') + '</span>'
        );
      };
      const html =
        '<div class="pcb" role="dialog" aria-label="' + esc(title) + '">' +
        '<div class="pcb-head"><span class="pcb-tag">' + esc(t('proto.cb.tag')) + '</span><h3>' + esc(title) + '</h3>' +
        '<button data-cb-skip>Esc ' + esc(t('proto.cb.skip')) + '</button></div>' +
        '<p class="pcb-desc">' + esc(desc) + '</p><div class="pcb-timer"><i></i></div>' +
        '<div class="pcb-stage"><canvas width="' + CB_W + '" height="' + CB_H + '"></canvas>' +
        codes.map((c, i) => lbl('L', i)).join('') + R.map((r, k) => lbl('R', k)).join('') + '</div>' +
        '<div class="pcb-foot"><span class="pcb-status"></span><span>' + esc(t(match ? 'proto.cb.hint_match' : 'proto.cb.hint', { n: N, last: String.fromCharCode(64 + N) })) + '</span></div></div>';
      cableOpen = true;
      const box = S.UI.openModal('minigame', html, { closable: false, cls: 'modal-minigame modal-cb' });
      const cv = box.querySelector('canvas');
      const c = cv.getContext('2d');
      const statusEl = box.querySelector('.pcb-status');
      const timerEl = box.querySelector('.pcb-timer i');
      const start = performance.now();
      const done = new Set();
      let sel = null; // left index being carried
      let mouse = null; // internal coords while dragging
      let mistakes = 0;
      let finished = false;
      const sparks = [];

      const setStatus = (cls, text) => {
        statusEl.className = 'pcb-status ' + (cls || '');
        statusEl.innerHTML = text || '<b>' + esc(t('mg.wires.status', { n: done.size, total: N, err: mistakes })) + '</b>';
      };
      setStatus();

      const finish = (success, score, skipped) => {
        if (finished) return;
        finished = true;
        window.removeEventListener('keydown', onKey, true);
        const timeUsed = Math.round(((performance.now() - start) / 1000) * 10) / 10;
        if (!skipped) setStatus(success ? 'ok' : 'bad', '<b>' + esc(t(success ? 'proto.cb.ok' : 'proto.cb.fail')) + '</b>');
        S.bus.emit('audio:play', skipped ? 'click' : success ? 'success' : 'fail');
        setTimeout(
          () => {
            S.UI.closeModal('minigame', true);
            cableOpen = false;
            resolve({ success, score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100, timeUsed, skipped: Boolean(skipped) });
          },
          skipped ? 150 : 900
        );
      };

      const tryConnect = (li, k) => {
        if (finished || li === null || done.has(li)) return;
        if (R[k].ci === li) {
          done.add(li);
          S.bus.emit('audio:play', 'wire');
          box.querySelector('[data-l="L' + li + '"]').classList.add('done');
          box.querySelector('[data-l="R' + k + '"]').classList.add('done');
          sel = null;
          setStatus();
          if (done.size === N) {
            const timePen = ((performance.now() - start) / 1000 / limit) * 0.25;
            setTimeout(() => finish(true, 1 - mistakes * 0.12 - timePen, false), 300);
          }
        } else {
          mistakes++;
          for (let i = 0; i < 14; i++) sparks.push({ x: R[k].x - 6, y: R[k].y, vx: (Math.random() - 0.7) * 90, vy: (Math.random() - 0.8) * 90, life: 0.35 + Math.random() * 0.25 });
          S.bus.emit('audio:play', 'fail');
          setStatus();
        }
      };

      // pointer: grab a cable end at its terminal (or where it hangs), drop it on a socket
      const toInternal = (e) => {
        const r = cv.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * CB_W, y: ((e.clientY - r.top) / r.height) * CB_H };
      };
      const near = (pts, p, rad) => {
        let best = -1;
        let bd = rad * rad;
        pts.forEach((q, i) => {
          const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
          if (d < bd) {
            bd = d;
            best = i;
          }
        });
        return best;
      };
      const looseEnd = (i, tt) => ({ x: L[i].x + 30 + i * 3 + Math.sin(tt * 1.6 + i) * 1.5, y: L[i].y + 24 + Math.cos(tt * 1.3 + i) * 1 });
      cv.addEventListener('pointerdown', (e) => {
        if (finished) return;
        const p = toInternal(e);
        const tt = (performance.now() - start) / 1000;
        let i = near(L, p, 14);
        if (i < 0) i = near(L.map((q, j) => looseEnd(j, tt)), p, 12);
        if (i >= 0 && !done.has(i)) {
          sel = i;
          mouse = p;
          cv.classList.add('drag');
          cv.setPointerCapture(e.pointerId);
          S.bus.emit('audio:play', 'click');
          return;
        }
        const k = near(R, p, 16); // click-click: a cable is already picked
        if (k >= 0 && sel !== null) tryConnect(sel, k);
      });
      cv.addEventListener('pointermove', (e) => {
        if (sel !== null && mouse) mouse = toInternal(e);
      });
      cv.addEventListener('pointerup', (e) => {
        cv.classList.remove('drag');
        if (sel === null || !mouse) return;
        const k = near(R, toInternal(e), 18);
        mouse = null;
        if (k >= 0) tryConnect(sel, k);
      });
      const onKey = (e) => {
        if (finished) return;
        let used = true;
        if (e.key === 'Escape') finish(true, 0.6, true);
        else if (/^[1-9]$/.test(e.key) && Number(e.key) <= N) {
          sel = Number(e.key) - 1;
          if (done.has(sel)) sel = null;
          else S.bus.emit('audio:play', 'click');
        } else if (e.key.length === 1 && e.key.toUpperCase().charCodeAt(0) - 65 >= 0 && e.key.toUpperCase().charCodeAt(0) - 65 < N) {
          tryConnect(sel, e.key.toUpperCase().charCodeAt(0) - 65);
        } else used = false;
        if (used) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      window.addEventListener('keydown', onKey, true);
      box.querySelector('[data-cb-skip]').addEventListener('click', () => finish(true, 0.6, true));

      // the dim cable bundle behind (fixed shapes)
      const bundle = [
        { x0: 120, x1: 150, col: '#4b4530', w: 6 },
        { x0: 138, x1: 128, col: '#3b3e44', w: 5 },
        { x0: 160, x1: 196, col: '#4a2b29', w: 6 },
        { x0: 176, x1: 166, col: '#2c3a52', w: 5 },
        { x0: 196, x1: 214, col: '#4b4530', w: 5 },
        { x0: 214, x1: 186, col: '#3b3e44', w: 4 },
        { x0: 104, x1: 92, col: '#2f3a30', w: 4 }
      ];
      // a cable with weight: outline, body, highlight; sag grows with the distance between its ends
      const cable = (a, b, col, slackExtra) => {
        const dx = Math.abs(b.x - a.x);
        const sag = 10 + dx * 0.12 + (slackExtra || 0);
        const p = () => {
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.bezierCurveTo(a.x + Math.max(18, dx * 0.35), a.y + sag, b.x - Math.max(18, dx * 0.35), b.y + sag, b.x, b.y);
        };
        c.lineCap = 'round';
        p();
        c.strokeStyle = '#08080a';
        c.lineWidth = 7;
        c.stroke();
        p();
        c.strokeStyle = col;
        c.lineWidth = 5;
        c.stroke();
        c.save();
        c.translate(0, -1.5);
        p();
        c.strokeStyle = hexMix(col, '#ffffff', 0.45);
        c.globalAlpha = 0.55;
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();
      };
      const plug = (p, dirX) => {
        c.fillStyle = '#9aa0a8';
        c.fillRect(Math.round(p.x - (dirX > 0 ? 0 : 6)), Math.round(p.y - 2.5), 6, 5);
        c.fillStyle = '#c9a23a';
        c.fillRect(Math.round(p.x + (dirX > 0 ? 6 : -8)), Math.round(p.y - 1), 2, 2);
      };

      let last = performance.now();
      const frame = (now) => {
        if (!cv.isConnected) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tt = (now - start) / 1000;
        const frac = Math.max(0, 1 - tt / limit);
        timerEl.style.width = frac * 100 + '%';
        timerEl.classList.toggle('low', frac < 0.25);
        if (!finished && tt >= limit) finish(done.size >= N - 1, 0.25 + (done.size / N) * 0.4, false);
        // panel
        c.fillStyle = '#16181c';
        c.fillRect(0, 0, CB_W, CB_H);
        c.fillStyle = '#101215';
        c.fillRect(44, 8, CB_W - 88, CB_H - 16);
        for (let y = 10; y < CB_H - 8; y += 3) {
          c.fillStyle = 'rgba(255,255,255,0.015)';
          c.fillRect(44, y, CB_W - 88, 1);
        }
        c.fillStyle = '#2a2d33'; // DIN rails
        c.fillRect(44, 16, CB_W - 88, 3);
        c.fillRect(44, CB_H - 20, CB_W - 88, 3);
        // bundle behind, with ties
        for (const b of bundle) {
          c.lineCap = 'butt';
          c.beginPath();
          c.moveTo(b.x0, 0);
          c.bezierCurveTo(b.x0, 60, b.x1, 110, b.x1, CB_H);
          c.strokeStyle = '#060607';
          c.lineWidth = b.w + 2;
          c.stroke();
          c.strokeStyle = b.col;
          c.lineWidth = b.w;
          c.stroke();
        }
        c.fillStyle = '#5a5f66';
        [[112, 46], [156, 62], [196, 52], [130, 120], [182, 128]].forEach(([x, y]) => c.fillRect(x, y, 12, 3));
        // terminal strips
        c.fillStyle = '#23262c';
        c.fillRect(8, 8, 30, CB_H - 16);
        c.fillRect(CB_W - 38, 8, 30, CB_H - 16);
        // rivets
        c.fillStyle = '#4a4f57';
        [[4, 4], [CB_W - 8, 4], [4, CB_H - 8], [CB_W - 8, CB_H - 8]].forEach(([x, y]) => c.fillRect(x, y, 4, 4));
        // sockets on the right, LED above each
        R.forEach((r, k) => {
          const col = sockColor(codes[r.ci]);
          const on = done.has(r.ci);
          c.fillStyle = col;
          c.fillRect(r.x - 8, r.y - 6, 14, 12);
          c.fillStyle = '#0b0c0e';
          c.fillRect(r.x - 6, r.y - 4, 10, 8);
          c.fillStyle = on ? '#3fe08a' : '#2a3a2f';
          c.fillRect(r.x + 2, r.y - 10, 3, 3);
          if (on) {
            c.fillStyle = 'rgba(63,224,138,0.35)';
            c.fillRect(r.x + 1, r.y - 11, 5, 5);
          }
        });
        // terminals on the left
        L.forEach((p, i) => {
          c.fillStyle = codes[i].color;
          c.fillRect(p.x - 10, p.y - 6, 14, 12);
          c.fillStyle = '#c9a23a';
          c.fillRect(p.x - 6, p.y - 2, 4, 4);
          c.fillStyle = '#7a5e1a';
          c.fillRect(p.x - 5, p.y - 1, 2, 1);
        });
        // cables: connected ones first, then hanging ones, the carried one on top
        const order = codes.map((x, i) => i).sort((a, b) => (done.has(b) ? 1 : 0) - (done.has(a) ? 1 : 0) || (a === sel) - (b === sel));
        for (const i of order) {
          const a = { x: L[i].x + 4, y: L[i].y };
          if (done.has(i)) {
            const r = R[sockOf(i)];
            cable(a, { x: r.x - 8, y: r.y }, codes[i].color, 0);
            plug({ x: r.x - 8, y: r.y }, -1);
          } else {
            let e;
            if (i === sel && mouse) e = mouse;
            else if (i === sel) e = { x: CB_W / 2 + Math.sin(tt * 3) * 4, y: L[i].y + 4 }; // picked with the keyboard
            else e = looseEnd(i, tt);
            cable(a, e, codes[i].color, i === sel ? 4 : 2);
            plug(e, e.x > a.x ? 1 : -1);
          }
        }
        // sparks from a wrong socket
        for (const s of sparks) {
          s.life -= dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 220 * dt;
          if (s.life <= 0) continue;
          c.fillStyle = s.life > 0.2 ? '#fff6d8' : '#ffb347';
          c.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
        }
        for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  /* ================================================================ */
  /* Hooks into main                                                   */
  /* ================================================================ */
  const tlmEv = S.DATA.forensics.evidenceTypes.find((e) => e.id === 'telemetry');
  if (tlmEv) tlmEv.minigame = 'cablebox'; // only the black-box task; other wiring games keep the old look

  // Station items, the pad and the station are drawn on the ground layer of the surface (not in the habitat,
  // not in the lava tube); the impact flash and the smoke from the holed MAV go on top of the frame.
  let worldFrame = false;
  const origGround = S.Art.drawGround;
  S.Art.drawGround = function (ctx, siteId, minute, camX, w, h, groundY) {
    const r = origGround.apply(this, arguments);
    const s = worldFrame && S.getState && S.getState();
    if (s && outsideOnSurface(s)) drawStationWorld(ctx, s, minute, camX, w, groundY, S.Art.lighting(minute));
    return r;
  };
  const origRender = S.FX.render;
  S.FX.render = function (ctx, s) {
    worldFrame = true;
    let r;
    try {
      r = origRender.apply(this, arguments);
    } finally {
      worldFrame = false;
    }
    if (s && outsideOnSurface(s)) {
      ctx.save();
      ctx.translate(0, (S.FX.view && S.FX.view.offY) || 0);
      drawImpact(ctx, s, performance.now());
      ctx.restore();
    }
    return r;
  };

  // Walking over an item picks it up (a boulder top needs a jump)
  const origUpdate = Surf.update;
  Surf.update = function (s) {
    const r = origUpdate.apply(this, arguments);
    if (s && outsideOnSurface(s)) collectPickups(s);
    return r;
  };

  // S or ↓: dig with the shovel (after the impact). A decoy mound hides scattered cargo, open ground gives
  // regolith bags for the radiation shield. Real dig sites stay main's (E).
  function digStation() {
    const G = S.Game;
    if (!G || G.scene !== 'world' || S.UI.topModal() || (S.isMinigameOpen && S.isMinigameOpen())) return;
    const s = S.getState();
    const body = Surf.body;
    if (!outsideOnSurface(s) || !body.onGround || body.actionT > 0 || s.gameOver || s.ending) return;
    const stn = station(s);
    if (!stn.impact) return;
    const X = S.Explore;
    const range = (X && X.digCfg && X.digCfg().interactRangeM) || 16;
    const siteHere = X && X.digSites ? X.digSites().find((st) => Math.abs(X.siteAt(st) - s.player.x) <= range) : null;
    if (siteHere && X.siteReal(siteHere) && !X.siteDone(s, siteHere)) return; // a real buried site: dig it with E
    if (Math.abs(s.player.x - P.stationSiteM) <= P.stationSiteRangeM || Math.abs(s.player.x - (S.BaseProto ? S.BaseProto.shelterM() : 85)) < 20) return; // not on the pad or by the lander
    hideTip();
    body.actionT = 0.7;
    S.bus.emit('fx:puff', { px: body.px + s.player.facing * 6, size: 2 });
    S.bus.emit('audio:play', 'land');
    S.Sim.advance(s, P.digGameMinutes); // digging takes time: suit O2 and battery go down
    const hidden = siteHere && !X.siteReal(siteHere) ? P.buriedInMounds[siteHere.id] : null;
    if (hidden) {
      const key = 'mound_' + siteHere.id;
      if (stn.picked[key]) return S.bus.emit('fx:float', { px: body.px, text: t('proto.st.empty'), tone: 'warn' });
      stn.dug[key] = (stn.dug[key] || 0) + 1;
      if (stn.dug[key] >= P.digsForBuried) {
        stn.picked[key] = true;
        stn.inv[hidden] += 1;
        S.bus.emit('fx:float', { px: body.px, text: t('proto.st.buried', { item: itemName(hidden) }), tone: 'ok' });
      } else S.bus.emit('fx:float', { px: body.px, text: t('proto.dig.metal'), tone: 'warn' });
      return;
    }
    stn.inv.regolith += 1;
    S.bus.emit('fx:float', { px: body.px, text: t('proto.st.regolith', { n: stn.inv.regolith }), tone: 'ok' });
  }
  window.addEventListener('keydown', (e) => {
    if ((e.code === 'KeyS' || e.code === 'ArrowDown') && !e.repeat) {
      const s = S.getState && S.getState();
      if (!s || !S.Game || S.Game.scene !== 'world') return;
      digStation();
      e.preventDefault();
    }
  });

  // main.js and the UI modules load before this file, but S.Game is created by main.js: patch on load.
  window.addEventListener('load', () => {
    const origRun = S.runMinigame;
    S.runMinigame = function (type, config) {
      if (type === 'cablebox') return runCableBox(config || {});
      return origRun.apply(this, arguments);
    };
    const origIsOpen = S.isMinigameOpen;
    S.isMinigameOpen = () => cableOpen || Boolean(origIsOpen && origIsOpen());

    // E on the station pad (after the impact) opens the station panel, unless something else is in reach
    if (S.Game && S.Game.interact) {
      const origInteract = S.Game.interact;
      S.Game.interact = function () {
        const s = S.getState();
        if (s && !S.UI.topModal() && station(s).impact && inSite(s) && !(S.HUD && S.HUD.prompt)) return openStation();
        return origInteract.apply(this, arguments);
      };
    }

    // After the impact: the station decides the ending, and the holed MAV cannot be used.
    if (S.Cutscenes && S.Cutscenes.playEnding) {
      const origEnding = S.Cutscenes.playEnding;
      S.Cutscenes.playEnding = function (onDone) {
        const s = S.getState();
        if (s && s.proto && s.proto.station && s.proto.station.impact) return playStationEnding(onDone);
        return origEnding.apply(this, arguments);
      };
    }
    if (S.HabitatPanel && S.HabitatPanel.openMav) {
      const origMav = S.HabitatPanel.openMav;
      S.HabitatPanel.openMav = function () {
        const s = S.getState();
        if (s && s.proto && s.proto.station && s.proto.station.impact) return S.UI.toast(t('proto.st.mav_broken'), 'warn', 4000);
        return origMav.apply(this, arguments);
      };
    }
  });
})((window.SOL14 = window.SOL14 || {}));
