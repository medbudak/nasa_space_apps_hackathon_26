/**
 * SOL 14: RED HORIZON — Uygulama Denetleyicisi, Oyun Döngüsü, Girdi ve Sahne Yöneticisi (K1)
 * Sahneler: loading -> menu -> design (Sol 0) -> transit -> world (yüzey/habitat) -> ending -> report
 * ?demo=1 : Jüri hızlı görevi (5 Sol, hazır dengeli tasarımla doğrudan fırlatma)  (M9)
 * ?lang=en : İngilizce başlat
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const LANG_KEY = 'sol14_lang';

  /* ================================================================ */
  /* GİRDİ                                                             */
  /* ================================================================ */
  const Input = { keys: new Set(), touch: { left: false, right: false, jump: false }, jumpQueued: false };
  Input.dir = function () {
    const l = Input.keys.has('ArrowLeft') || Input.keys.has('KeyA') || Input.touch.left;
    const r = Input.keys.has('ArrowRight') || Input.keys.has('KeyD') || Input.touch.right;
    return (r ? 1 : 0) - (l ? 1 : 0);
  };
  Input.consumeJump = function () {
    const j = Input.jumpQueued || Input.touch.jump;
    Input.jumpQueued = false;
    Input.touch.jump = false;
    return j;
  };
  S.Input = Input;

  /* ================================================================ */
  /* OYUN                                                              */
  /* ================================================================ */
  const Game = {
    scene: 'loading',
    pendingSol: [],
    pendingImpact: false,
    resumeCb: null,
    lastHud: 0,
    lastHab: 0,
    lastSave: 0,
    canvas: null,
    ctx: null
  };
  S.Game = Game;

  /* ================================================================ */
  /* OYUNCU TESTİ OLAY KAYDI (Oyun Ritmi Planı §10 / RIT-13)            */
  /* Yalnızca yerel (localStorage); kişisel/biyometrik veri yok.         */
  /* Her kayıt: rastgele oturum kimliği, olay türü, Sol, aktif oyun      */
  /* süresi (dünya açık + duraklatılmamış) ve gerçek geçen süre.         */
  /* ================================================================ */
  const PLAYTEST_KEY = 'sol14_playtest_log';
  const PLAYTEST_MAX = 1500;
  const Playtest = {
    session: Math.random().toString(36).slice(2, 10),
    t0: performance.now(),
    activeSec: 0,
    ended: false
  };
  Playtest.track = function (type, data) {
    try {
      const s = S.getState();
      const entry = Object.assign(
        {
          session: Playtest.session,
          type,
          sol: s ? s.sol : null,
          activeSec: Math.round(Playtest.activeSec),
          realSec: Math.round((performance.now() - Playtest.t0) / 1000)
        },
        data || {}
      );
      const list = JSON.parse(localStorage.getItem(PLAYTEST_KEY) || '[]');
      list.push(entry);
      localStorage.setItem(PLAYTEST_KEY, JSON.stringify(list.slice(-PLAYTEST_MAX)));
    } catch (e) {
      /* kayıt opsiyoneldir; oyunu asla durdurmaz */
    }
  };
  Playtest.end = function (reason) {
    if (Playtest.ended) return;
    Playtest.ended = true;
    Playtest.track('session_end', { reason });
  };
  S.Playtest = Playtest;

  const handlers = {
    retry: () => Game.retryCheckpoint(),
    newGame: (demo) => Game.newGame(demo),
    continueGame: () => Game.continueGame(),
    toggleLang: () => Game.toggleLang(),
    menu: () => Game.toMenu(),
    launch: () => Game.launch(),
    report: () => Game.showReport()
  };

  Game.setScene = function (scene) {
    Game.scene = scene;
    document.body.dataset.scene = scene;
    const world = scene === 'world';
    Game.canvas.style.visibility = world ? 'visible' : 'hidden';
    if (!world) {
      S.HUD.hide();
      S.Audio.setAmbience('none');
    } else {
      S.UI.hideScreen();
    }
  };

  Game.toMenu = function () {
    S.UI.closeAll();
    if (S.getState() && S.getState().sol >= 1 && !S.getState().ending && !S.getState().gameOver) S.saveGame();
    Game.setScene('menu');
    S.DesignScreens.showMenu(handlers);
  };

  Game.newGame = function (demo) {
    S.clearCheckpoint();
    S.State.reset({ demoMode: demo, lang: S.lang });
    S.getState().scene = 'design';
    S.DesignScreens.step = demo ? 5 : 1;
    Game.pendingSol = [];
    Game.pendingImpact = false;
    Game.setScene('design');
    S.DesignScreens.showDesign(handlers);
  };

  /** Görev kaybı → son Sol sabahının güvenli kaydına dön (habitat içinde) */
  Game.retryCheckpoint = function () {
    const s = S.loadCheckpoint();
    if (!s) return Game.toMenu();
    s.lang = S.lang;
    Game.pendingSol = [];
    Game.pendingImpact = false;
    Game.resumeCb = null;
    S.UI.closeAll();
    S.saveGame();
    Playtest.track('checkpoint_loaded', { retries: s.checkpointRetries });
    Game.enterWorld();
    S.UI.toast(S.UI.icon('check') + t('toast.checkpoint', { sol: s.sol }), 'ok', 4200);
  };

  Game.continueGame = function () {
    const s = S.loadGame();
    if (!s) return Game.toMenu();
    S.lang = s.lang || S.lang;
    if (s.scene === 'transit' || s.scene === 'design') {
      S.DesignScreens.showDesign(handlers);
      return;
    }
    Game.enterWorld();
  };

  Game.launch = function () {
    // The opening plays once: a second launch request (double click, key repeat) is ignored
    if (Game.scene === 'transit') return;
    const s = S.getState();
    const r = S.Sim.launch(s);
    if (!r.ok) {
      S.UI.toast(r.errors.map((k) => t(k)).join(' · '), 'warn');
      return;
    }
    // K2 trial: the launch roar now plays at ignition, after the intro (src/fx/opening.js O.cues)
    Game.setScene('transit');
    // Açılış bir kez: kalkış + mekik güvertesi + uçuş → (kayıt: iniş tamamlanmış durum) → oyun dünyasında iniş sahnesi.
    // Sim.land kaydı sahneden ÖNCE yazar; sayfa yenilenir ya da kayıt yüklenirse açılış/iniş tekrar oynamaz.
    S.Cutscenes.playTransit((info) => {
      S.Sim.land(S.getState());
      S.saveGame();
      Game.enterWorld();
      if (info.skipped) Game.finishLanding(); // Esc: iniş tamamlanmış, astronot çıkış noktasında
      else Game.startLanding();
    });
  };

  /* ---------------- Açılış iniş sahnesi (D-012) ---------------- */
  Game.startLanding = function () {
    S.Lander.start();
    S.HUD.hide();
    // Kamera boş iniş alanına odaklanır; astronot kapaktan inene kadar görünmez
    S.FX.focusCamera(S.Lander.padPx());
    const stage = S.UI.hudLayer().parentElement;
    const hint = document.createElement('div');
    hint.className = 'landing-skip';
    hint.innerHTML = t('landing.skip');
    stage.appendChild(hint);
    Game.landingHint = hint;
    S.bus.emit('audio:play', 'launch');
  };

  Game.finishLanding = function () {
    if (Game.landingHint) {
      Game.landingHint.remove();
      Game.landingHint = null;
    }
    const s = S.getState();
    S.Surface.syncFromState(s);
    S.HUD.build('surface');
    S.UI.toast(t('toast.landed', { site: t('site.' + s.design.landingSiteId + '.name') }), 'ok', 4200);
    if (s.cargoBonus && s.sol === 1 && !s.cargoBonusShown) {
      s.cargoBonusShown = true;
      setTimeout(() => S.UI.toast(S.UI.icon('o2') + t('toast.cargo_bonus', s.cargoBonus), 'info', 5500), 900);
    }
    if (s.sol === 1 && !Game.tutorialShown) {
      Game.tutorialShown = true;
      setTimeout(() => S.UI.toast(t('toast.tutorial'), 'info', 7000), 1200);
    }
  };

  Game.skipLanding = function () {
    if (!S.Lander.active) return;
    S.Lander.skip();
    S.FX.focusCamera(S.Surface.body.px);
    Game.finishLanding();
  };

  Game.enterWorld = function () {
    const s = S.getState();
    s.scene = 'surface';
    S.ensureExploreState(s);
    Game.setScene('world');
    S.Surface.syncFromState(s);
    S.FX.focusCamera(S.Surface.playerPx(s));
    S.HUD.build(s.player.inside ? 'habitat' : 'surface');
    if (s.player.inside) S.HabitatPanel.show();
  };

  /* ---------------- D-012 keşif etkileşimleri ---------------- */
  const ICE_TOAST = { inspect: 'info', break: 'ok', photo: 'ok', collect: 'ok', sample: 'ok' };
  Game.iceAction = function (id) {
    const s = S.getState();
    const step = S.Explore.iceStep(s, id);
    const r = S.Explore.iceAction(s, id, step);
    if (!r.ok) return;
    S.Surface.body.actionT = step === 'break' ? 1.2 : 0.8;
    const px = S.Surface.mToPx(S.Explore.cluster(id).atM);
    let msg;
    if (step === 'inspect') msg = t('ice.inspect.' + (r.hint || 'none'));
    else if (step === 'break') {
      S.FX.shake = 0.35;
      S.bus.emit('fx:puff', { px, size: 2 });
      msg = r.relic ? t('ice.found', { item: t('relic.' + r.relic) }) : t('ice.no_relic');
    } else if (step === 'photo') msg = t(r.quality < 1 ? 'ice.photo_low' : 'ice.photo_ok');
    else if (step === 'collect') msg = t('ice.collected', { item: t('relic.' + r.relic), use: t('relic.' + r.relic + '.use') });
    else msg = t('ice.sampled', { l: r.waterL });
    S.bus.emit('fx:float', { px, text: t('ice.step.' + step), tone: 'ok' });
    S.UI.toast(S.UI.icon(step === 'photo' ? 'camera' : 'target') + msg, ICE_TOAST[step], 4200);
    Game.afterAction();
  };

  /** Lav tüneline iniş / yüzeye çıkış: kısa kararma geçişi */
  Game.caveTransition = function (down) {
    const s = S.getState();
    S.FX.fade = 1;
    S.FX.particles = []; // parçacıklar alt haritanın piksel uzayındadır
    if (down) S.Explore.descend(s);
    else S.Explore.ascend(s);
    S.Surface.syncFromState(s);
    S.FX.focusCamera(S.Surface.playerPx(s));
    S.HUD.build('surface');
    if (down && !s.explore.cave.toastShown) {
      s.explore.cave.toastShown = true;
      S.UI.toast(S.UI.icon('map') + t('toast.cave_enter'), 'info', 6500);
    }
  };

  /* ---------------- Kazı: gömülü araçlar ve tünel penceresi (eski otomatik keşfin yerine) ---------------- */
  Game.dig = function (id) {
    const s = S.getState();
    const r = S.Explore.dig(s, id);
    if (!r.ok) {
      if (r.errKey) S.UI.toast(S.UI.icon('alert') + t(r.errKey, r.vars), 'warn', 3800);
      return;
    }
    const st = S.Explore.site(id);
    const px = S.Surface.mToPx(S.Explore.siteAt(st));
    S.Surface.body.actionT = r.done ? 1 : 0.6;
    S.FX.shake = Math.max(S.FX.shake || 0, r.done ? 0.5 : 0.15);
    S.bus.emit('fx:puff', { px, size: r.done ? 2 : 1 });
    if (!r.done) S.bus.emit('fx:float', { px, text: t('dig.progress', { n: r.hits, total: r.total }), tone: 'ok' });
    else if (r.tube) S.UI.toast(S.UI.icon('map') + t('dig.tube_open'), 'ok', 6500);
    else if (r.item) S.UI.toast(S.UI.icon('check') + t('station.mound_item', { item: t('item.' + r.item + '.name') }), 'ok', 5000);
    else if (r.empty) S.UI.toast(S.UI.icon('target') + t('dig.empty.' + st.kind), 'info', 3800);
    // Araç çıktıysa forensics:discovered olayı duyurur
    Game.afterAction();
  };

  /** Kişi 5: maden noktasını kaz / tünel damarını del; son vuruşta mineral envantere girer (ilk buluşta bilgi kartı) */
  Game.digMineral = function (id) {
    const s = S.getState();
    const st = S.Explore.mineralSite(id);
    const px = st.zone === 'cave' ? S.Surface.caveMToPx(st.atM) : S.Surface.mToPx(st.atM);
    const r = S.Explore.digMineral(s, id);
    if (!r.ok) {
      if (r.errKey) S.bus.emit('fx:float', { px, text: t(r.errKey), tone: 'warn' });
      return;
    }
    S.Surface.body.actionT = r.done ? 1 : 0.6;
    S.FX.shake = Math.max(S.FX.shake || 0, r.done ? 0.3 : 0.12);
    S.bus.emit('fx:puff', { px, size: r.done ? 2 : 1 });
    if (!r.done) S.bus.emit('fx:float', { px, text: t('dig.progress', { n: r.hits, total: r.total }), tone: 'ok' });
    else if (r.first) S.WorkshopPanel.openMineralCard(r.mineral, r.amount);
    else S.UI.toast(S.UI.icon('check') + t('mineral.toast', { name: t('mineral.' + r.mineral + '.name'), n: r.amount }), 'ok', 4500);
    Game.afterAction();
  };

  /** D-014: S/↓ ile açık zeminde regolit torbası doldur (istasyonun radyasyon kalkanı) */
  Game.digRegolith = function () {
    const s = S.getState();
    const body = S.Surface.body;
    if (!body.onGround || body.actionT > 0) return;
    const r = S.Station.digRegolith(s);
    if (!r.ok) {
      if (r.errKey) S.bus.emit('fx:float', { px: body.px, text: t(r.errKey), tone: 'warn' });
      return;
    }
    body.actionT = 0.7;
    S.bus.emit('fx:puff', { px: body.px + s.player.facing * 6, size: 2 });
    S.bus.emit('audio:play', 'land');
    S.bus.emit('fx:float', { px: body.px, text: t('station.regolith', { n: r.bags }), tone: 'ok' });
    Game.afterAction();
  };

  /**
   * F: seçili eşyayı kullan. Aletler yakındaki işi yapar (kazı, regolit, tarama); roket parçaları MAV'ın yanında
   * tamir ekranını açar; diğer malzemeler mekikte atölyeyi açar. İşe yaramadığı yerde nerede kullanılacağını söyler.
   */
  Game.useItem = function () {
    const s = S.getState();
    const it = S.Hotbar.selected(s);
    const say = (key, vars, tone = 'info') => S.UI.toast(S.UI.icon('alert') + t(key, vars), tone, 4500);
    if (!S.Hotbar.open) return say('use.closed');
    if (!it) return say('use.empty');
    const prompt = !s.player.inside && S.HUD.prompt;
    const name = t(S.Hotbar.nameKey(it));
    // Eldeki aletle MAV tamiri (yakıt hattı: tarayıcı, gövde: matkap)
    if (it.kind === 'tool' && prompt && prompt.action === 'mav') {
      const part = S.Rocket.partForTool(s, it.id);
      if (part) return S.HabitatPanel.runRepair(part);
      return S.HabitatPanel.openMav();
    }
    if (it.id === 'pickaxe' || it.id === 'drill') {
      if (prompt && (prompt.kind === 'dig' || prompt.kind === 'mineral')) return Game.swingTool().then(() => Game.interact());
      if (S.Station.impacted(s) && !s.player.inside) return Game.swingTool().then(() => Game.digRegolith());
      return say('use.dig_where', { item: name });
    }
    if (it.id === 'scanner') {
      Game.swingTool();
      const ping = S.Explore.scannerPing(s);
      return ping ? say('use.scan_hit', { m: Math.round(ping.d) }, 'ok') : say('use.scan_none');
    }
    const forRocket = S.Rocket.parts().some((p) => p.needs[it.id]);
    if (forRocket && prompt && prompt.action === 'mav') return S.HabitatPanel.openMav();
    const recipes = S.Workshop.usedIn(it.id).filter((id) => S.Workshop.status(s, id).state !== 'hidden');
    if (s.player.inside && recipes.length) {
      S.WorkshopPanel.sel = recipes[0];
      return Game.openPanel('workshop');
    }
    if (forRocket) return say('use.at_mav', { item: name });
    if (recipes.length) return say('use.at_workshop', { item: name, list: recipes.map((id) => t('ws.' + id + '.name')).join(', ') });
    return say('use.passive', { item: name });
  };

  /**
   * Eldeki aleti çalıştır: kazma iner, matkap döner, tarayıcı tarar (S.Hotbar.swing, effects.js çizer).
   * Vuruş anında toz/kıvılcım ve ses; Promise vuruş bitince çözülür ve iş o zaman yapılır.
   */
  Game.swingTool = function () {
    const s = S.getState();
    const it = S.Hotbar.selected(s);
    if (!it || it.kind !== 'tool') return Promise.resolve();
    const SWING_MS = 420;
    S.Hotbar.swingStart = performance.now();
    S.Hotbar.swingMs = SWING_MS;
    return new Promise((done) =>
      setTimeout(() => {
        const body = S.Surface.body;
        const front = body.px + s.player.facing * 10;
        if (it.id === 'pickaxe') S.bus.emit('fx:puff', { px: front, size: 2 });
        if (it.id === 'drill') S.bus.emit('fx:puff', { px: front, size: 1 });
        S.bus.emit('audio:play', it.id === 'scanner' ? 'scan' : 'land');
        done();
      }, SWING_MS * 0.6)
    );
  };

  /** D-015: roket hasar alınca ne yapılacağını adım adım söyle */
  function explainRocketDamage(p) {
    const s = S.getState();
    const part = t('rocket.part.' + p.part);
    const steps = S.Sim.deployed(s, 'mav') ? t('rocket.help_built') : t('rocket.help_build');
    S.UI.toast(S.UI.icon('rocket') + t('rocket.help', { part }) + ' ' + steps, 'warn', 9000);
  }

  /** Kargo aracı parçasını al (batı buzulu) */
  Game.pickPart = function (partId) {
    const s = S.getState();
    const r = S.Surface.pickPart(s, partId);
    if (!r.ok) return;
    S.bus.emit('fx:float', { px: S.Surface.body.px, text: t('salvage.parts', { n: r.n, total: r.total }), tone: 'ok' });
    S.UI.toast(S.UI.icon('target') + t('salvage.found.' + partId), 'ok', 5000);
    Game.afterAction();
  };

  /* D-016 (proposed): the water bottle. Rack by the airlock -> ice cave -> greenhouse. */
  Game.bottleRack = function () {
    const s = S.getState();
    const r = S.Sim.toggleBottle(s);
    S.bus.emit('audio:play', r.taken ? 'scan' : 'close');
    S.UI.toast(S.UI.icon(r.taken ? 'check' : 'x') + t(r.taken ? 'bottle.taken' : r.poured ? 'bottle.returned_full' : 'bottle.returned'), r.taken ? 'ok' : 'info', 4000);
  };

  Game.fillBottle = function () {
    const s = S.getState();
    const r = S.Sim.fillBottle(s);
    if (!r.ok) {
      if (r.errKey) S.UI.toast(S.UI.icon('x') + t(r.errKey), 'warn', 5000);
      return Game.afterAction();
    }
    S.Surface.body.actionT = 0.8;
    S.bus.emit('ice:hit', { px: S.Surface.mToPx(-S.Sim.shelterCfg().veinM), hits: 1, total: 1 });
    S.bus.emit('audio:play', 'bonus');
    S.bus.emit('fx:float', { px: S.Surface.body.px, text: t('bottle.filled', { l: r.l }), tone: 'ok' });
    Game.afterAction();
  };

  Game.waterGreenhouse = function (px) {
    const s = S.getState();
    s.player.facing = px < S.Surface.body.px ? -1 : 1;
    const r = S.Sim.waterGreenhouse(s);
    if (!r.ok) {
      if (r.errKey) S.UI.toast(S.UI.icon('x') + t(r.errKey), 'warn', 5000);
      return;
    }
    S.Surface.body.actionT = 1.6;
    if (S.Westlands && S.Westlands.startPour) S.Westlands.startPour(px);
    S.bus.emit('audio:play', 'success');
    S.UI.toast(S.UI.icon('leaf') + t(r.tended ? 'bottle.watered' : 'bottle.watered_tank', { l: r.l, morale: r.morale }), 'ok', 5000);
    Game.afterAction();
  };

  /** Lav tünelindeki İZCİ-1 parçası: FIELD CAM ile fotoğrafla; beşi tamamlanınca aracın hikâyesi */
  Game.scoutPhoto = async function (id) {
    const s = S.getState();
    const shot = s.explore.cave.scout[id];
    if (shot !== null && shot !== undefined) return S.UI.toast(S.UI.icon('camera') + t('scout.' + id + '.caption'), 'info', 7000);
    const mg = await S.runMinigame('fieldcam', { scoutPart: id, titleKey: 'scout.' + id + '.name' });
    const r = S.Explore.photoScout(s, id, mg.skipped ? 0.5 : mg.score);
    if (!r.ok) return;
    S.Surface.body.actionT = 0.8;
    S.bus.emit('fx:float', { px: S.Surface.body.cpx, text: t('scout.found', { n: r.n, total: r.total }), tone: 'ok' });
    S.UI.toast(S.UI.icon('camera') + t('scout.' + id + '.caption'), 'info', 8000);
    if (r.complete && !s.explore.cave.storyShown) {
      s.explore.cave.storyShown = true;
      Game.afterAction(() => S.SciencePanels.openScoutStory());
      return;
    }
    Game.afterAction();
  };

  Game.relay = function () {
    const s = S.getState();
    if (s.explore.cave.temp.entrance === null) {
      const r = S.Explore.readEntranceTemp(s);
      S.UI.toast(S.UI.icon('temp') + t('cave.entrance_read', { c: r.c }), 'ok', 4200);
      return Game.afterAction();
    }
    const r = S.Explore.relayReport(s);
    if (!r.ok) return S.UI.toast(t(r.errKey), 'warn');
    S.UI.toast(S.UI.icon('signal') + t('toast.cave_reported', { n: r.done, total: r.total, pts: r.score }), 'ok', 5000);
    Game.afterAction();
  };

  Game.caveFind = function (id) {
    const s = S.getState();
    const first = !s.explore.cave.finds[id];
    if (first) {
      S.Explore.recordFind(s, id);
      S.Surface.body.actionT = 1;
      S.bus.emit('fx:float', { px: S.Surface.body.cpx, text: t('cave.logged'), tone: 'ok' });
    }
    S.UI.toast(S.UI.icon('camera') + t('cave.find.' + id + '.desc'), first ? 'ok' : 'info', 6000);
    Game.afterAction();
  };

  Game.caveStudy = function (id) {
    const s = S.getState();
    if (!S.Explore.studyDone(s, id)) {
      const r = S.Explore.runStudy(s, id);
      if (!r.ok) return S.UI.toast(t(r.errKey || 'cave.err_nothing'), 'warn', 4500);
      S.Surface.body.actionT = 1.2;
    }
    Game.afterAction(() => S.SciencePanels.openCaveStudy(id));
  };

  Game.exitHabitat = function () {
    const s = S.getState();
    S.Surface.exitHabitat(s);
    S.HUD.build('surface');
    S.FX.focusCamera(S.Surface.body.px);
  };

  Game.enterHabitat = function () {
    const s = S.getState();
    S.Surface.enterHabitat(s);
    Playtest.track('habitat_enter');
    S.HUD.build('habitat');
    S.HabitatPanel.show();
  };

  Game.sleep = function () {
    if (Game.sleepAnim) return;
    const run = () => {
      Game.sleepAnim = false;
      const s = S.getState();
      const r = S.Sim.sleep(s);
      if (r.interrupted) S.UI.toast(t('toast.sleep_interrupted'), 'warn');
      Game.afterAction();
    };
    // Mekik içinde önce uyku animasyonu (takımın GIF'i: uyku tulumu, ışıklar kısılır), sonra sabaha geçilir
    if (S.getState().player.inside && S.FX.playActivity && S.FX.playActivity('sleep', run)) {
      Game.sleepAnim = true;
      return;
    }
    run();
  };

  Game.launchMav = function () {
    S.Sim.launchMav(S.getState(), { auto: false });
  };

  Game.openPanel = function (name) {
    if (Game.scene !== 'world') return;
    if (name === 'downlink') S.DownlinkPanel.open();
    else if (name === 'power') S.PowerPanel.open();
    else if (name === 'log') S.SciencePanels.openLog();
    else if (name === 'lab') S.SciencePanels.openLab();
    else if (name === 'workshop') S.WorkshopPanel.open();
    else if (name === 'inventory') S.WorkshopPanel.openInventory();
    else if (name === 'pause') S.DesignScreens.openPause(handlers);
  };

  /** Eylem sonrası: kriz / sol geçişi / kayıp / final kuyruğu çözülünce cb çağrılır */
  Game.afterAction = function (cb) {
    Game.resumeCb = cb || null;
    if (S.HabitatPanel) S.HabitatPanel.lastHtml = '';
  };

  Game.interact = function () {
    if (Game.scene !== 'world' || S.UI.modalOpen() || S.isMinigameOpen()) return;
    const s = S.getState();
    if (s.player.inside) {
      const st = S.Surface.nearestStation();
      if (!st) return;
      if (st.action === 'exit') return Game.exitHabitat();
      if (st.action === 'bottle') return Game.bottleRack();
      const act = S.HabitatPanel.stationToAction(st.id);
      if (act) {
        S.HabitatPanel.selected = act;
        S.HabitatPanel.run(act);
      }
      return;
    }
    if (S.Lander.active) return;
    const it = S.HUD.prompt;
    if (!it) return;
    S.bus.emit('audio:play', 'click');
    if (it.kind === 'ice_cluster') return Game.iceAction(it.id);
    if (it.action === 'descend') return Game.caveTransition(true);
    if (it.action === 'ascend') return Game.caveTransition(false);
    if (it.action === 'relay') return Game.relay();
    if (it.kind === 'cave_find') return Game.caveFind(it.id);
    if (it.kind === 'cave_study') return Game.caveStudy(it.id);
    if (it.kind === 'scout') return Game.scoutPhoto(it.id);
    if (it.kind === 'dig') return Game.dig(it.id);
    if (it.kind === 'mineral') return Game.digMineral(it.id);
    if (it.action === 'pick_part') return Game.pickPart(it.partId);
    if (it.kind === 'ice_vein') return Game.fillBottle();
    if (it.action === 'water_gh') return Game.waterGreenhouse(it.px);
    if (it.action === 'door') return Game.enterHabitat();
    if (it.kind === 'wreck') return S.SciencePanels.openForensic(it.id);
    if (it.action === 'greenhouse') return S.HabitatPanel.openGreenhouse();
    if (it.action === 'mav') return S.HabitatPanel.openMav();
    if (it.action === 'break_ice') return S.Surface.breakIce(s);
    if (it.action === 'dig_probe') return S.Surface.digProbe(s);
    if (it.action === 'dig_barrier' || it.action === 'dig_barrier_again') return S.Surface.digBarrier(s, it.index);
    S.HabitatPanel.openActionModal(it.action);
  };

  Game.toggleLang = function () {
    S.lang = S.lang === 'tr' ? 'en' : 'tr';
    document.documentElement.lang = S.lang;
    try {
      localStorage.setItem(LANG_KEY, S.lang);
    } catch (e) {
      /* yok say */
    }
    const s = S.getState();
    if (s) s.lang = S.lang;
    if (Game.scene === 'menu') S.DesignScreens.showMenu(handlers);
    else if (Game.scene === 'design') S.DesignScreens.showDesign(handlers);
    else if (Game.scene === 'world') {
      S.HUD.build(s.player.inside ? 'habitat' : 'surface');
      if (s.player.inside) S.HabitatPanel.show();
    } else if (Game.scene === 'report') Game.showReport();
  };

  Game.showReport = function () {
    S.UI.closeAll();
    Game.setScene('report');
    S.ReportCard.show({
      replay: () => Game.playEnding(),
      newMission: () => Game.newGame(false),
      menu: () => Game.toMenu()
    });
  };

  Game.playEnding = function () {
    S.UI.closeAll();
    Game.setScene('ending');
    S.Cutscenes.playEnding((choice) => (choice === 'menu' ? Game.toMenu() : Game.showReport()));
  };

  Game.checkEnd = function () {
    const s = S.getState();
    if (!s || Game.scene !== 'world') return false;
    if (s.gameOver) {
      // K2 trial: dying in the ice field, the heavy frost first closes over the screen (~2.6 s)
      if (S.Westlands && S.Westlands.holdDeath(s)) return true;
      S.UI.closeAll();
      S.clearSave();
      Game.setScene('gameover');
      S.bus.emit('audio:play', 'fail');
      S.DesignScreens.showGameOver(handlers);
      return true;
    }
    if (s.ending) {
      Game.playEnding();
      return true;
    }
    return false;
  };

  /** Bekleyen olayları sırayla göster: Sol geçişi -> kriz kartı -> kayıp/final -> devam geri çağrısı */
  Game.processPending = function () {
    if (S.UI.modalOpen() || S.isMinigameOpen()) return true;
    const s = S.getState();
    if (Game.pendingSol.length) {
      const sum = Game.pendingSol.shift();
      S.Cutscenes.showSolTransition(sum);
      return true;
    }
    if (Game.pendingImpact) {
      Game.pendingImpact = false;
      S.StationCard.showImpact(s);
      return true;
    }
    if (Game.checkEnd()) return true;
    if (s.crisis.active) {
      S.DecisionCard.open();
      return true;
    }
    if (Game.resumeCb) {
      const cb = Game.resumeCb;
      Game.resumeCb = null;
      cb();
      return true;
    }
    return false;
  };

  /* ================================================================ */
  /* DÖNGÜ                                                             */
  /* ================================================================ */
  let lastT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const tSec = now / 1000;
    if (Game.scene === 'world') {
      const s = S.getState();
      if (S.Lander.active) {
        // Açılış iniş sahnesi: oyun saati ve girdi durur, yalnızca sahne ilerler
        S.Lander.update(dt);
        S.Surface.body.moving = false;
        if (!S.Lander.active) {
          S.Surface.syncFromState(s);
          Game.finishLanding();
        }
      }
      const busy = S.Lander.active || Game.processPending();
      if (!busy && Game.scene === 'world') {
        Playtest.activeSec += dt; // aktif oyun süresi: menü/kart açıkken sayılmaz
        const input = { dir: Input.dir(), jump: Input.consumeJump() };
        if (s.player.inside) S.Surface.updateInterior(s, dt, input);
        else S.Surface.update(s, dt, input);
        S.Sim.step(s, dt * S.Sim.gameMinutesPerRealSecond(s));
      } else {
        S.Surface.body.moving = false;
      }
      if (Game.scene === 'world') {
        S.FX.render(Game.ctx, s, dt, tSec);
        if (now - Game.lastHud > 100) {
          Game.lastHud = now;
          S.HUD.update(s);
        }
        // Dünyaya bağlı HUD işaretleri kamerayla aynı karede konumlanır (10 Hz'lik HUD.update takılma yapıyordu)
        S.HUD.syncWorld(s);
        if (s.player.inside && now - Game.lastHab > 300) {
          Game.lastHab = now;
          S.HabitatPanel.render(s);
        }
        S.Audio.setAmbience(s.player.inside ? 'habitat' : 'surface', s.weather.stormTau > 0 ? 1 : 0.25);
        if (now - Game.lastSave > 30000) {
          Game.lastSave = now;
          S.saveGame();
        }
      }
    }
    requestAnimationFrame(frame);
  }

  /* ================================================================ */
  /* KLAVYE                                                            */
  /* ================================================================ */
  function onKeyDown(e) {
    if (S.isMinigameOpen()) return; // mini-oyun kendi tuşlarını yönetir
    // İniş sahnesi: Space / Esc / Enter atlar (Esc burada duraklatma menüsünü açmaz); diğer tuşlar yok sayılır
    if (Game.scene === 'world' && S.Lander.active) {
      if (['Space', 'Escape', 'Enter'].includes(e.code)) Game.skipLanding();
      e.preventDefault();
      return;
    }
    const top = S.UI.topModal();
    if (e.key === 'Escape') {
      if (top) {
        if (top.opts.closable !== false) S.UI.closeModal(top.id);
      } else if (Game.scene === 'world') Game.openPanel('pause');
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && top) {
      const primary = top.el.querySelector('.btn-primary[data-close]');
      if (primary) {
        e.preventDefault();
        primary.click();
      }
      return;
    }
    if (Game.scene !== 'world' || top) return;
    Input.keys.add(e.code);
    if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
      if (!e.repeat) Input.jumpQueued = true;
      e.preventDefault();
    }
    if (['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'KeyE') Game.interact();
    // Veri / sistemler / günlük yalnızca mekiğin içinden (istasyonlar); dışarıda kısayol yok
    else if (e.code === 'KeyL' && S.getState().player.inside) Game.openPanel('downlink');
    else if (e.code === 'KeyP' && S.getState().player.inside) Game.openPanel('power');
    else if (e.code === 'KeyJ' && S.getState().player.inside) Game.openPanel('log');
    else if (e.code === 'KeyI') S.getState().player.inside ? Game.openPanel('inventory') : S.Hotbar.toggle();
    else if (/^Digit[1-9]$/.test(e.code)) S.Hotbar.select(Number(e.code.slice(5)) - 1);
    else if (e.code === 'KeyF') Game.useItem();
    else if ((e.code === 'KeyS' || e.code === 'ArrowDown') && S.Station.impacted(S.getState())) {
      e.preventDefault();
      Game.digRegolith();
    }
  }

  /**
   * Sahne her zaman pencerenin tamamını kaplar (CSS: .stage position:fixed; inset:0) — siyah bant yok.
   * Arayüz yazı ölçeği CSS'te: 1em = 16px · min(vw/960, vh/540). Burada yalnızca tuvalin iç çözünürlüğü
   * pencere oranına uyarlanır: 640×360 tasarım alanı her zaman tam görünür, artan eksen daha fazla dünya
   * gösterir (geniş pencere: yanlar, uzun pencere: gökyüzü). Pikseller kare kalır, sanat bozulmaz.
   */
  function fitStage() {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    const scale = Math.min(vw / S.FX.BASE_W, vh / S.FX.BASE_H);
    const w = Math.max(S.FX.BASE_W, Math.round(vw / scale));
    const h = Math.max(S.FX.BASE_H, Math.round(vh / scale));
    if (Game.canvas.width !== w || Game.canvas.height !== h) {
      Game.canvas.width = w;
      Game.canvas.height = h;
      Game.ctx.imageSmoothingEnabled = false;
    }
    S.FX.setView(w, h);
  }

  /* ================================================================ */
  /* AÇILIŞ                                                            */
  /* ================================================================ */
  function boot() {
    const params = new URLSearchParams(window.location.search);
    let lang = params.get('lang');
    if (lang !== 'tr' && lang !== 'en') {
      try {
        lang = localStorage.getItem(LANG_KEY);
      } catch (e) {
        lang = null;
      }
    }
    S.lang = lang === 'tr' ? 'tr' : 'en';
    document.documentElement.lang = S.lang;
    S.State.reset({ lang: S.lang });

    Game.canvas = document.getElementById('game');
    Game.ctx = Game.canvas.getContext('2d');
    Game.ctx.imageSmoothingEnabled = false;
    fitStage();
    window.addEventListener('resize', fitStage);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', (e) => Input.keys.delete(e.code));
    window.addEventListener('blur', () => Input.keys.clear());

    S.Audio.init();
    S.FX.init();
    S.bus.on('sol:advance', (sum) => Game.pendingSol.push(sum));
    S.bus.on('station:impact', () => (Game.pendingImpact = true));
    S.bus.on('rocket:damaged', (p) => setTimeout(() => explainRocketDamage(p), 1500));
    S.bus.on('station:pickup', (p) => S.bus.emit('fx:float', { px: S.Surface.body.px, text: t('station.pick', { item: t('item.' + p.item + '.name') }), tone: 'ok' }));
    // İlk zıplama (K3 Medine): aynı güçle Mars'ta ne kadar yükseğe ve ne kadar süre (Dünya'yla karşılaştırma)
    S.bus.on('surface:jump', () => {
      const s = S.getState();
      if (!s || !s.explore || s.explore.jumpFactShown) return;
      s.explore.jumpFactShown = true;
      const g = S.DATA.constants.marsGravity;
      const hE = S.DATA.gameplay.earthJumpHeightM;
      const v = Math.sqrt(2 * g.earthValue * hE);
      const r2 = (x) => Math.round(x * 100) / 100;
      S.UI.toast(S.UI.icon('rocket') + t('jump.fact', { r: g.ratioToEarth, h: r2((v * v) / (2 * g.value)), t: r2((2 * v) / g.value), he: hE, te: r2((2 * v) / g.earthValue) }), 'info', 7000);
    });
    // Araç kazılıp ortaya çıktı (S.Explore.dig → Forensics.uncover)
    S.bus.on('forensics:discovered', (p) => S.UI.toast(S.UI.icon('target') + t('toast.uncovered', { name: S.Forensics.get(p.id).name }), 'ok', 5000));
    S.bus.on('downlink:arrived', (p) => S.UI.toast(S.UI.icon('signal') + t('toast.arrived', { title: t(p.titleKey, p.vars) }), 'ok'));
    S.bus.on('explore:filed', (p) =>
      S.UI.toast(S.UI.icon('doc') + t('toast.relic_filed', { items: p.relics.map((r) => t('relic.' + r)).join(', ') }), 'ok', 5000)
    );
    Game.canvas.addEventListener('pointerdown', () => {
      if (Game.scene === 'world' && S.Lander.active) Game.skipLanding();
    });
    S.bus.on('greenhouse:frozen', () => S.UI.toast(S.UI.icon('leaf') + t('toast.gh_frozen'), 'danger', 5000));
    S.bus.on('eva:frozen', () => S.UI.toast(S.UI.icon('temp') + t('toast.frozen'), 'danger', 4000));
    S.bus.on('power:shed', (p) => {
      if (Game.scene === 'world') S.UI.toast(S.UI.icon('power') + t('toast.shed', { load: t('load.' + p.id) }), 'warn');
    });

    // Oyuncu testi olayları (§10 "en küçük olay kaydı")
    Playtest.track('session_start', { lang: S.lang, demo: params.get('demo') === '1' });
    S.bus.on('goal:changed', (p) => {
      if (p.from) Playtest.track('objective_completed', { objective: p.from });
      Playtest.track('objective_shown', { objective: p.to });
    });
    S.bus.on('goal:hint', (p) => Playtest.track('hint_requested', { objective: p.id }));
    S.bus.on('warning:shown', (p) => Playtest.track('warning_shown', { warning: p.id }));
    S.bus.on('crisis:trigger', (c) => Playtest.track('warning_shown', { warning: 'crisis_' + c.id }));
    S.bus.on('crisis:resolved', (p) => Playtest.track('optional_choice', { crisis: p.id, option: p.option }));
    S.bus.on('ui:modal', (p) => {
      if (Game.scene === 'world' && p.id !== 'minigame') Playtest.track(p.open ? 'menu_open' : 'menu_close', { menu: p.id });
    });
    S.bus.on('mission:gameover', (g) => {
      Playtest.track('failure', { reason: g.reason });
    });
    S.bus.on('mission:end', () => Playtest.end('completed'));

    // RIT-10: sekme gizlenince / pencere kapanırken ilerlemeyi kaydet (oturum dışında kaynak tüketimi yok)
    const persist = () => {
      const s = S.getState();
      if (s && Game.scene === 'world' && s.sol >= 1 && !s.ending && !s.gameOver) S.saveGame();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) persist();
    });
    window.addEventListener('beforeunload', () => {
      persist();
      Playtest.end('user_exit');
    });

    const bar = document.querySelector('#loading .ld-fill');
    S.Sprites.preload((f) => {
      if (bar) bar.style.width = Math.round(f * 100) + '%';
    }).then(() => {
      document.getElementById('loading').remove();
      if (params.get('demo') === '1' || params.get('demo') === 'true') {
        Game.newGame(true);
        Game.launch();
      } else {
        Game.toMenu();
      }
      requestAnimationFrame(frame);
    });

    // TESTING.md §3 — geliştirici / jüri hızlı test konsolu
    window.SOL14_DEBUG = {
      state: () => S.getState(),
      nextSol: () => {
        S.Sim.sleep(S.getState());
      },
      triggerCrisis: (id) => S.Events.trigger(S.getState(), id),
      playUfoEnding: () => {
        const s = S.getState();
        if (!s.totals) S.Sim.launch(s);
        if (s.sol < 1) S.Sim.land(s);
        S.Sim.launchMav(s, { auto: false });
        Game.playEnding();
      },
      showReport: () => Game.showReport(),
      missingKeys: () => Array.from(S.debugMissingKeys || []),
      /** Oyuncu testi kaydı: SOL14_DEBUG.playtestLog() / exportPlaytest() (JSON indirir) / clearPlaytest() */
      playtestLog: () => JSON.parse(localStorage.getItem(PLAYTEST_KEY) || '[]'),
      exportPlaytest: () => {
        const blob = new Blob([localStorage.getItem(PLAYTEST_KEY) || '[]'], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sol14_playtest_' + Playtest.session + '.json';
        a.click();
      },
      clearPlaytest: () => localStorage.removeItem(PLAYTEST_KEY)
    };
    S.debugMissingKeys = new Set();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})((window.SOL14 = window.SOL14 || {}));
