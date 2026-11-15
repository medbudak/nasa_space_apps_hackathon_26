/*
 * Sera içi (K3 Medine, 2026-11-15). Seranın önünde E: kapı açılır, astronot kubbeye girer.
 * A/D saksılar arasında yürür; E en yakın saksıda bağlama göre ekim / sulama / hasat yapar, 1-2-3 bitki seçer,
 * Esc ya da kapıda E dışarı çıkarır. Kurallar ve sayılar S.Sim'de (ghTray, choosePlant, tend_greenhouse,
 * harvest_greenhouse); burada yalnız görünüş var:
 *  - susuz bitki soluk ve çökük, sulanınca damlalar düşer, toprak ıslanır, bitki canlanıp dikleşir;
 *  - evre görseli Sim.ghStage'den (gece büyür), yatak kenarındaki ışıklar bakımlı solları sayar;
 *  - yeni ekilen tohum ve hasattan sonraki fide topraktan çıkarak belirir.
 * Arka plan: assets/processed/screens/scr_greenhouse.png (640×360, içine çizili bitkiler silindi; REFERENCES.md).
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const W = 640;
  const H = 360;
  const SCALE = 2; // astronot ve bitkiler tam sayı ölçekte (pikseller kare kalır)
  // Yerler arka plan görselinden (640×360)
  const SOIL_Y = 261; // yatakların toprak çizgisi
  const FOOT_Y = 318; // ızgara yürüme yolu
  const DOOR = { x0: 22, x1: 98, y0: 182, y1: 297 };
  const DOOR_CX = 60;
  const WALK = { min: 70, max: 545, pxPerS: 85, inX: 129 };
  const LAMPS = [[122, 205], [267, 370], [437, 521]];
  const LAMP_Y = 110;
  const TANK = { x: 567, y: 191, w: 46, h: 19 };
  const SCREEN = { x: 591, y: 222, w: 29, h: 18 };
  // Saksı yerleri: seviyeye göre 3 / 4 / 6 saksı üç yatağa dağılır
  const SLOTS = { 3: [173, 286, 440], 4: [173, 286, 398, 482], 6: [146, 201, 258, 314, 398, 482] };
  const slotXs = (n) => SLOTS[n] || [...Array(n).keys()].map((i) => 130 + ((i + 0.5) * 400) / n);
  const REACH_PX = 44; // astronot saksının yanında durur ve yüzünü döndüğü saksıyla çalışır (bitkiyi örtmez)
  const NEAR_PX = 26;
  // Bitki görsellerinde saksı ağzının satırı (48 px kare, evre 1..3): saksı yatağın toprağına gömülür, bitki görünür
  const POT_TOP = { lettuce: [22, 34, 34], radish: [25, 30, 34], zinnia: [24, 36, 34] };
  const DROP_S = 0.55; // sulama: saksı başına süre
  const SCENE_ID = 'greenhouse-scene';

  const GS = (S.GreenhouseScene = {});
  let G = null; // açıkken sahne durumu

  const lerp = (a, b, k) => a + (b - a) * Math.min(1, k);
  const rnd = (k) => {
    const x = Math.sin(k * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  GS.isOpen = () => Boolean(G);

  GS.open = function () {
    const s = S.getState();
    const box = S.UI.openModal(
      SCENE_ID,
      '<div class="imp-scene scn"><canvas width="' + W + '" height="' + H + '"></canvas>' +
        '<p class="scn-note">' + t('gh.scene.note') + '</p><div class="scn-top"></div><div class="scn-bar"></div></div>',
      { closable: false, cls: 'modal-scene' }
    );
    const n = S.Sim.ghTrayCount(s);
    G = {
      s,
      box,
      c: box.querySelector('canvas').getContext('2d'),
      x: DOOR_CX,
      dir: 1,
      held: new Set(),
      phase: { kind: 'enter', t: 0 },
      perk: [...Array(n).keys()].map((i) => (watered(s, i) ? 1 : 0)),
      rise: Array(n).fill(1),
      wet: [...Array(n).keys()].map((i) => (watered(s, i) ? 0.6 : 0)),
      hold: new Set(), // sulanacak ama damlası henüz düşmemiş saksılar
      parts: [],
      msg: null,
      barHtml: '',
      last: performance.now()
    };
    G.c.imageSmoothingEnabled = false;
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    box.querySelector('.scn-bar').addEventListener('click', onBarClick);
    S.bus.emit('audio:play', 'door');
    requestAnimationFrame(frame);
  };

  function close() {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    G = null;
    S.UI.closeModal(SCENE_ID, true);
  }

  /* ---------------- durum okuma (hepsi Sim'den) ---------------- */
  const watered = (s, i) => Boolean(S.Sim.ghPlant(s, i)) && S.Sim.ghTray(s, i).tendedSol === s.sol;
  const thirsty = (s, i) => Boolean(S.Sim.ghPlant(s, i)) && !S.Sim.ghMature(s, i) && !watered(s, i);
  const alive = (s) => !s.greenhouse.frozen;
  const lit = (s) => alive(s) && S.Sim.loadSupplied(s, 'greenhouse');

  function nearSlot() {
    const xs = slotXs(S.Sim.ghTrayCount(G.s));
    const hand = G.x + G.dir * REACH_PX;
    let best = -1;
    xs.forEach((x, i) => {
      if (Math.abs(x - hand) <= NEAR_PX && (best < 0 || Math.abs(x - hand) < Math.abs(xs[best] - hand))) best = i;
    });
    return best;
  }
  const nearDoor = () => G.x < DOOR_CX + 34;
  /** Bekleyen sol geçişi, kriz ya da final varsa sahne kapanır ki oyun sırayı göstersin */
  const mustLeave = (s) => S.Game.pendingSol.length > 0 || S.Game.pendingImpact || s.crisis.active || Boolean(s.ending);

  /* ---------------- eylemler ---------------- */
  function say(key, vars, tone) {
    G.msg = { text: t(key, vars), tone: tone || 'warn', until: performance.now() + 3200 };
  }
  function floatText(text, x, tone) {
    G.parts.push({ kind: 'text', text, x, y: SOIL_Y - 70, t: 0, life: 1.8, tone });
  }

  function primary() {
    const s = G.s;
    if (nearDoor()) return leave();
    if (!alive(s)) return say('gh.frozen_info', { sol: s.greenhouse.frozenSol, cause: t('gh.cause_' + s.greenhouse.cause) }, 'danger');
    const i = nearSlot();
    if (i < 0) return say('gh.scene.walk_to');
    if (!S.Sim.ghPlant(s, i)) return say('gh.scene.empty_hint', null, 'info');
    if (S.Sim.ghPlanted(s).some((k) => S.Sim.ghMature(s, k))) return harvest();
    return water();
  }

  function water() {
    const s = G.s;
    const g = S.DATA.habitat.greenhouse;
    const err = S.Sim.actions.tend_greenhouse.can(s);
    if (err) return say(err);
    // tend_greenhouse saksıları sırayla, su yettiği kadar sular: animasyon aynı sırayı gösterir
    const trays = S.Sim.ghToTend(s).slice(0, Math.floor(s.res.waterL / g.tendWaterL));
    const res = S.Sim.doAction(s, 'tend_greenhouse');
    if (!res.ok) return say(res.errKey);
    G.hold = new Set(trays);
    G.phase = { kind: 'water', t: 0, trays, dropped: 0 };
    S.bus.emit('audio:play', 'leak');
  }

  function harvest() {
    const s = G.s;
    const ripe = S.Sim.ghPlanted(s).filter((i) => S.Sim.ghMature(s, i));
    const popped = ripe.map((i) => ({ i, key: plantKey(s, i) }));
    const res = S.Sim.doAction(s, 'harvest_greenhouse');
    if (!res.ok) return say(res.errKey);
    const xs = slotXs(S.Sim.ghTrayCount(s));
    popped.forEach((p) => {
      G.parts.push({ kind: 'pop', key: p.key, plant: S.Sim.ghPlant(s, p.i), x: xs[p.i], t: 0, life: 0.9 });
      G.rise[p.i] = 0; // aynı bitki yeniden ekilir: fide topraktan çıkar
      G.perk[p.i] = 0;
    });
    G.phase = { kind: 'harvest', t: 0 };
    floatText(t('fb.harvest', { kg: s.res.foodKg }), G.x, 'ok');
    S.bus.emit('audio:play', 'bonus');
  }

  function sow(plantId) {
    const s = G.s;
    const i = nearSlot();
    if (i < 0) return say('gh.scene.walk_to');
    if (!S.Sim.choosePlant(s, plantId, i)) return say(S.Sim.ghPlant(s, i) ? 'gh.scene.sow_locked' : 'gh.scene.walk_to');
    const x = slotXs(S.Sim.ghTrayCount(s))[i];
    G.parts.push({ kind: 'seed', x0: G.x + G.dir * 12, y0: FOOT_Y - 50, x, t: 0, life: 0.4 });
    G.rise[i] = 0;
    G.perk[i] = 0;
    G.phase = { kind: 'sow', t: 0 };
    floatText(t('gh.scene.sowed', { plant: t('plant.' + plantId) }), x, 'ok');
    S.bus.emit('audio:play', 'land');
  }

  function leave() {
    if (G.phase && G.phase.kind === 'exit') return;
    G.phase = { kind: 'exit', t: 0, out: 0 };
  }

  /* ---------------- girdi ---------------- */
  const PLANT_KEYS = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
  function onKey(e) {
    if (!G) return;
    e.stopPropagation();
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (G.phase && G.phase.kind === 'enter' && ['Escape', 'Space', 'Enter'].includes(e.code)) G.phase.t = 99; // girişi atla
    G.held.add(e.code);
    if (e.repeat || G.phase) return;
    if (e.code === 'Escape') leave();
    else if (e.code === 'KeyE' || e.code === 'Enter') primary();
    else if (e.code in PLANT_KEYS) {
      const id = Object.keys(S.DATA.habitat.greenhouse.growth.plants)[PLANT_KEYS[e.code]];
      if (id) sow(id);
    }
  }
  function onKeyUp(e) {
    if (G) G.held.delete(e.code); // yayılım sürer: main.js'in tuş takibi de bıraksın
  }
  function onBarClick(e) {
    const b = e.target.closest('button');
    if (!b || !G || G.phase) return;
    S.bus.emit('audio:play', 'click');
    if (b.dataset.act === 'water') water();
    else if (b.dataset.act === 'harvest') harvest();
    else if (b.dataset.act === 'leave') leave();
    else if (b.dataset.plant) sow(b.dataset.plant);
  }

  /* ---------------- güncelleme ---------------- */
  function update(dt) {
    const s = G.s;
    const ph = G.phase;
    let moving = 0;
    if (!ph) {
      const dir = (G.held.has('KeyD') || G.held.has('ArrowRight') ? 1 : 0) - (G.held.has('KeyA') || G.held.has('ArrowLeft') ? 1 : 0);
      if (dir) {
        G.dir = dir;
        G.x = Math.max(WALK.min, Math.min(WALK.max, G.x + dir * WALK.pxPerS * dt));
        moving = 1;
      }
    } else {
      ph.t += dt;
      if (ph.kind === 'enter') {
        const k = Math.max(0, Math.min(1, (ph.t - 0.45) / 0.7));
        G.x = lerp(DOOR_CX, WALK.inX, k);
        moving = k > 0 && k < 1 ? 1 : 0;
        if (ph.t > 1.6) G.phase = null;
      } else if (ph.kind === 'exit') {
        if (Math.abs(G.x - DOOR_CX) > 1) {
          G.dir = G.x > DOOR_CX ? -1 : 1;
          G.x += G.dir * Math.min(Math.abs(G.x - DOOR_CX), WALK.pxPerS * 3 * dt);
          moving = 1;
          ph.t = 0;
        } else {
          if (!ph.out) S.bus.emit('audio:play', 'door');
          ph.out = 1;
          if (ph.t > 0.9) return close();
        }
      } else if (ph.kind === 'water') {
        // her saksıya sırayla damla; damla düşünce toprak ıslanır, bitki canlanır
        const xs = slotXs(S.Sim.ghTrayCount(s));
        ph.trays.forEach((i, k) => {
          const t0 = k * DROP_S;
          if (ph.t > t0 && ph.t < t0 + 0.35 && Math.random() < dt * 40) {
            G.parts.push({ kind: 'drop', x: xs[i] + (Math.random() - 0.5) * 30, y: LAMP_Y + 14, vy: 60 + Math.random() * 40 });
          }
          if (ph.t > t0 + 0.4 && G.hold.has(i)) {
            G.hold.delete(i);
            G.wet[i] = 1;
            for (let j = 0; j < 6; j++) G.parts.push({ kind: 'spark', x: xs[i] + (Math.random() - 0.5) * 28, y: SOIL_Y - 10 - Math.random() * 30, t: 0, life: 0.7 });
          }
        });
        if (ph.t > ph.trays.length * DROP_S + 0.5) {
          G.phase = null;
          floatText(t('fb.tend_greenhouse', { pct: s.greenhouse.yieldPct }), G.x, 'ok');
          if (mustLeave(s)) leave();
        }
      } else if (ph.t > 0.9) {
        G.phase = null;
        if (mustLeave(s)) leave();
      }
    }
    G.walking = moving;
    const n = S.Sim.ghTrayCount(s);
    for (let i = 0; i < n; i++) {
      const perkTo = !thirsty(s, i) && !G.hold.has(i) ? 1 : 0;
      G.perk[i] = lerp(G.perk[i] || 0, perkTo, dt * 3);
      G.rise[i] = lerp(G.rise[i] === undefined ? 1 : G.rise[i], 1, dt * 1.4);
      G.wet[i] = Math.max(watered(s, i) && !G.hold.has(i) ? 0.6 : 0, (G.wet[i] || 0) - dt * 0.25);
    }
    const splashes = [];
    G.parts = G.parts.filter((p) => {
      if (p.kind === 'drop') {
        p.vy += 260 * dt;
        p.y += p.vy * dt;
        if (p.y < SOIL_Y) return true;
        splashes.push({ kind: 'splash', x: p.x, t: 0, life: 0.25 });
        return false;
      }
      p.t += dt;
      return p.t < p.life;
    }).concat(splashes);
  }

  /* ---------------- çizim ---------------- */
  const plantKey = (s, i) => 'plant_' + S.Sim.ghPlant(s, i) + '_' + (S.Sim.ghStage(s, i) + 1);

  function drawDoor(c, bg, open) {
    if (open <= 0) return;
    const { x0, x1, y0, y1 } = DOOR;
    const half = DOOR_CX - x0;
    const d = Math.round(open * half);
    c.save();
    c.beginPath();
    c.rect(x0, y0, x1 - x0, y1 - y0);
    c.clip();
    c.fillStyle = '#1b1622';
    c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.fillStyle = 'rgba(255, 214, 170, 0.22)'; // hava kilidinin ışığı
    c.fillRect(DOOR_CX - d + 3, y0 + 3, Math.max(0, 2 * d - 6), y1 - y0 - 6);
    c.drawImage(bg, x0, y0, half, y1 - y0, x0 - d, y0, half, y1 - y0);
    c.drawImage(bg, DOOR_CX, y0, x1 - DOOR_CX, y1 - y0, DOOR_CX + d, y0, x1 - DOOR_CX, y1 - y0);
    c.restore();
  }

  function doorOpen(ph) {
    if (!ph) return 0;
    if (ph.kind === 'enter') return Math.max(0, Math.min(1, (ph.t - 0.1) / 0.3, (1.5 - ph.t) / 0.3));
    if (ph.kind === 'exit' && ph.out) return Math.min(1, ph.t / 0.3);
    return 0;
  }

  function drawLights(c, s, time) {
    if (!lit(s)) {
      // güç yok ya da sera dondu: büyüme lambaları sönük
      c.fillStyle = 'rgba(24, 18, 32, 0.8)';
      LAMPS.forEach(([a, b]) => c.fillRect(a + 4, LAMP_Y - 6, b - a - 8, 6));
      return;
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pulse = 0.9 + 0.1 * Math.sin(time * 1.3);
    LAMPS.forEach(([a, b]) => {
      const gr = c.createLinearGradient(0, LAMP_Y, 0, SOIL_Y);
      gr.addColorStop(0, 'rgba(255, 90, 190, ' + (0.26 * pulse).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255, 90, 190, 0)');
      c.fillStyle = gr;
      c.beginPath();
      c.moveTo(a + 6, LAMP_Y);
      c.lineTo(b - 6, LAMP_Y);
      c.lineTo(b + 22, SOIL_Y);
      c.lineTo(a - 22, SOIL_Y);
      c.closePath();
      c.fill();
    });
    // ışık huzmesinde süzülen toz
    c.fillStyle = 'rgba(255, 225, 245, 0.55)';
    for (let k = 0; k < 26; k++) {
      const [a, b] = LAMPS[k % 3];
      const y = LAMP_Y + ((rnd(k) * 150 + time * (5 + rnd(k + 9) * 6)) % 150);
      const x = a + rnd(k + 3) * (b - a) + Math.sin(time * 0.7 + k) * 4;
      c.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
    c.restore();
  }

  function drawTank(c, s, time) {
    // deponun kabarcıkları ve ekranında habitat suyu (sulama aynı depodan)
    c.fillStyle = 'rgba(230, 248, 255, 0.8)';
    for (let k = 0; k < 5; k++) {
      const y = TANK.y + TANK.h - ((time * (8 + k * 3) + rnd(k) * TANK.h) % TANK.h);
      c.fillRect(Math.round(TANK.x + 4 + rnd(k + 2) * (TANK.w - 8)), Math.round(y), 1, 1);
    }
    c.fillStyle = '#1f2633';
    c.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
    c.fillStyle = '#5fd1d6';
    c.font = '11px VT323, monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(Math.round(s.res.waterL) + ' L', SCREEN.x + SCREEN.w / 2, SCREEN.y + SCREEN.h / 2 + 1);
  }

  function drawPlant(c, s, i, x, time) {
    const plant = S.Sim.ghPlant(s, i);
    if (!plant) return;
    const img = S.Sprites.get(plantKey(s, i));
    if (!img) return;
    const st = S.Sim.ghStage(s, i);
    const rim = (POT_TOP[plant] || [24, 34, 34])[st];
    const perk = G.perk[i];
    const sink = Math.round((1 - G.rise[i]) * 24 + (1 - perk) * 3);
    const sway = alive(s) ? Math.round(Math.sin(time * 1.6 + i * 1.7) * 0.6 * perk) : 0;
    const left = Math.round(x - 24 * SCALE) + sway;
    const top = SOIL_Y + 2 + sink - rim * SCALE;
    c.save();
    c.beginPath();
    c.rect(left - 4, 0, 48 * SCALE + 8, SOIL_Y + 2);
    c.clip();
    if (!alive(s)) c.filter = 'grayscale(1) brightness(0.75)';
    else if (perk < 0.98) c.filter = 'saturate(' + (0.5 + 0.5 * perk).toFixed(2) + ') brightness(' + (0.85 + 0.15 * perk).toFixed(2) + ')';
    c.drawImage(img, left, top, 48 * SCALE, 48 * SCALE);
    c.restore();
    // olgun: ara sıra parıltı
    if (alive(s) && S.Sim.ghMature(s, i) && Math.sin(time * 3 + i) > 0.92) {
      c.fillStyle = '#fff3b0';
      c.fillRect(Math.round(x + Math.sin(i * 5) * 14), SOIL_Y - 40 - (i % 3) * 8, 2, 2);
    }
  }

  /** Yatak kenarında bakımlı sol ışıkları: yeşil = büyüdü, mavi = bugün sulandı (gece büyür), sarı = hasada hazır */
  function drawPips(c, s, i, x, time) {
    const cfg = S.Sim.ghPlantCfg(s, i);
    if (!cfg) return;
    const n = cfg.tendedSols;
    const done = S.Sim.ghProgress(s, i);
    const ripe = S.Sim.ghMature(s, i);
    const x0 = Math.round(x - (n * 6 - 2) / 2);
    for (let k = 0; k < n; k++) {
      let col = '#2b2f36';
      if (ripe) col = '#ffc233';
      else if (k < done) col = '#5fd17a';
      else if (k === done && watered(s, i) && !G.hold.has(i)) col = Math.sin(time * 4) > -0.3 ? '#5fd1d6' : '#2b2f36';
      c.fillStyle = '#1d2128';
      c.fillRect(x0 + k * 6 - 1, SOIL_Y + 5, 6, 6);
      c.fillStyle = col;
      c.fillRect(x0 + k * 6, SOIL_Y + 6, 4, 4);
    }
  }

  function drawSlots(c, s, time) {
    const xs = slotXs(S.Sim.ghTrayCount(s));
    const near = G.phase ? -1 : nearSlot();
    xs.forEach((x, i) => {
      // ıslak toprak
      if (G.wet[i] > 0.02) {
        c.fillStyle = 'rgba(28, 16, 12, ' + (0.45 * G.wet[i]).toFixed(3) + ')';
        c.fillRect(Math.round(x - 22), SOIL_Y - 1, 44, 4);
      }
      drawPlant(c, s, i, x, time);
      drawPips(c, s, i, x, time);
      if (!S.Sim.ghPlant(s, i)) {
        // boş saksı: toprakta ekim çukuru ve boş etiket çubuğu
        c.fillStyle = '#2a1812';
        c.fillRect(Math.round(x - 6), SOIL_Y - 1, 12, 3);
        c.fillStyle = '#7a5a3a';
        c.fillRect(Math.round(x + 9), SOIL_Y - 14, 2, 14);
        c.fillStyle = '#1d2128';
        c.fillRect(Math.round(x + 5), SOIL_Y - 21, 11, 8);
        c.fillStyle = '#e3d8c4';
        c.fillRect(Math.round(x + 6), SOIL_Y - 20, 9, 6);
        c.fillStyle = '#d9752e';
        c.fillRect(Math.round(x + 7), SOIL_Y - 18, 7, 1);
      }
      if (i === near) {
        const a = 0.55 + 0.35 * Math.sin(time * 5);
        c.fillStyle = 'rgba(95, 209, 214, ' + a.toFixed(3) + ')';
        c.fillRect(Math.round(x - 20), SOIL_Y + 13, 40, 2);
        c.beginPath(); // seçili saksı imleci
        c.moveTo(x - 5, SOIL_Y - 104);
        c.lineTo(x + 5, SOIL_Y - 104);
        c.lineTo(x, SOIL_Y - 98);
        c.fill();
      }
    });
  }

  function drawParts(c, back) {
    for (const p of G.parts) {
      if ((p.kind === 'pop') !== back) continue;
      if (p.kind === 'drop') {
        c.fillStyle = '#2a6f9e';
        c.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 4, 6);
        c.fillStyle = '#8fdcff';
        c.fillRect(Math.round(p.x), Math.round(p.y), 2, 4);
      } else if (p.kind === 'splash') {
        const r = 2 + Math.round((p.t / p.life) * 4);
        c.fillStyle = 'rgba(143, 220, 255, ' + (1 - p.t / p.life).toFixed(3) + ')';
        c.fillRect(Math.round(p.x) - r, SOIL_Y - 2, 2, 1);
        c.fillRect(Math.round(p.x) + r - 1, SOIL_Y - 2, 2, 1);
        c.fillRect(Math.round(p.x) - 1, SOIL_Y - 3 - r, 1, 1);
      } else if (p.kind === 'spark') {
        c.fillStyle = 'rgba(170, 255, 170, ' + (1 - p.t / p.life).toFixed(3) + ')';
        c.fillRect(Math.round(p.x), Math.round(p.y - p.t * 18), 2, 2);
      } else if (p.kind === 'seed') {
        const k = p.t / p.life;
        c.fillStyle = '#c9a23a';
        c.fillRect(Math.round(lerp(p.x0, p.x, k)), Math.round(lerp(p.y0, SOIL_Y, k) - Math.sin(k * Math.PI) * 18), 2, 2);
      } else if (p.kind === 'pop') {
        // hasat: olgun bitki yükselip söner
        const img = S.Sprites.get(p.key);
        if (!img) continue;
        const k = p.t / p.life;
        const rim = (POT_TOP[p.plant] || [24, 34, 34])[2];
        c.save();
        c.globalAlpha = 1 - k;
        c.beginPath();
        c.rect(0, 0, W, SOIL_Y + 2);
        c.clip();
        c.drawImage(img, Math.round(p.x - 24 * SCALE), Math.round(SOIL_Y + 2 - rim * SCALE - k * 40), 48 * SCALE, 48 * SCALE);
        c.restore();
      } else if (p.kind === 'text') {
        const k = p.t / p.life;
        c.globalAlpha = Math.min(1, (1 - k) * 2);
        c.font = '14px VT323, monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#1d2128';
        c.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y - k * 22) + 1);
        c.fillStyle = p.tone === 'ok' ? '#9dffb0' : '#ffd27a';
        c.fillText(p.text, Math.round(p.x), Math.round(p.y - k * 22));
        c.globalAlpha = 1;
      }
    }
  }

  function render(time) {
    const c = G.c;
    const s = G.s;
    const bg = S.Sprites.get('gh_interior');
    c.clearRect(0, 0, W, H);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    // dış ışık: gece kubbe kararır, büyüme lambaları içeriyi aydınlatır
    const dark = S.Art.lighting(s.minute).dark;
    if (dark > 0) {
      c.fillStyle = 'rgba(12, 10, 32, ' + (0.5 * dark).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
    if (!alive(s)) {
      c.fillStyle = 'rgba(150, 195, 240, 0.22)';
      c.fillRect(0, 0, W, H);
    }
    if (bg) drawDoor(c, bg, doorOpen(G.phase));
    drawLights(c, s, time);
    drawTank(c, s, time);
    drawSlots(c, s, time);
    // astronot: kasklı (elbise üstünde; dışarıdan girildi), sulamada diz çöker
    const ph = G.phase;
    const pose = ph && ph.kind === 'water' ? 'kneel' : G.walking ? 'walk' : 'idle';
    const fading = ph && ph.kind === 'exit' && ph.out ? Math.max(0, 1 - ph.t / 0.5) : ph && ph.kind === 'enter' ? Math.min(1, (ph.t - 0.25) / 0.25) : 1;
    drawParts(c, true);
    if (fading > 0) {
      c.globalAlpha = Math.max(0, fading);
      S.FX.drawSuit(c, pose, G.x, FOOT_Y, G.dir, time, SCALE);
      c.globalAlpha = 1;
    }
    drawParts(c, false);
    // giriş / çıkış kararması
    const black = ph && ph.kind === 'enter' ? 1 - Math.min(1, ph.t / 0.4) : ph && ph.kind === 'exit' && ph.out ? Math.max(0, (ph.t - 0.45) / 0.45) : 0;
    if (black > 0) {
      c.fillStyle = 'rgba(0, 0, 0, ' + Math.min(1, black).toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
  }

  /* ---------------- alt çubuk (DOM) ---------------- */
  const I = (n) => S.UI.icon(n);
  function barHtml() {
    const s = G.s;
    const Sim = S.Sim;
    const i = nearSlot();
    const msg = G.msg && G.msg.until > performance.now() ? '<p class="scn-msg ' + G.msg.tone + '">' + G.msg.text + '</p>' : '';
    let info;
    let picker = '';
    if (!alive(s)) info = '<p class="scn-msg danger">' + I('temp') + t('gh.frozen_info', { sol: s.greenhouse.frozenSol, cause: t('gh.cause_' + s.greenhouse.cause) }) + '</p>';
    else if (nearDoor()) info = '<b>' + t('gh.scene.door') + '</b>';
    else if (i < 0) info = '<b>' + t('gh.scene.walk_to') + '</b>';
    else {
      const plant = Sim.ghPlant(s, i);
      const head = '<b>' + t('gh.scene.tray', { n: i + 1 }) + ' · ' + (plant ? t('plant.' + plant) : t('gh.tray_empty')) + '</b>';
      let line = '<small>' + t('gh.scene.empty_hint') + '</small>';
      if (plant) {
        const stage = t('gh.stage.' + Sim.ghStageKey(s, i));
        if (Sim.ghMature(s, i)) line = '<small class="ok">' + t('gh.ready.' + plant) + '</small>';
        else if (watered(s, i)) line = '<small class="ok">' + stage + ' · ' + t('gh.tended_today', { sols: Sim.ghSolsLeft(s, i) - 1 }) + '</small>';
        else line = '<small class="warn">' + stage + ' · ' + t('gh.needs_tending', { sols: Sim.ghSolsLeft(s, i) }) + '</small>';
      }
      info = head + line;
      if (Sim.ghCanChoose(s, i)) {
        const sci = plant ? '' : '<p class="scn-sci">' + t('gh.science') + '</p>';
        picker =
          '<div class="scn-pick"><span>' + t('gh.pick_title') + '</span>' +
          Object.keys(S.DATA.habitat.greenhouse.growth.plants)
            .map((id, k) => '<button type="button" class="scn-btn' + (id === plant ? ' sel' : '') + '" data-plant="' + id + '" title="' + S.util.escape(t('plant.' + id + '.desc')) + '"><kbd>' + (k + 1) + '</kbd>' + t('plant.' + id) + '</button>')
            .join('') +
          '</div>' + sci;
      }
    }
    const tend = Sim.actions.tend_greenhouse;
    const reap = Sim.actions.harvest_greenhouse;
    const tendErr = tend.can(s);
    const reapOk = !reap.can(s);
    const btns =
      (reapOk ? '<button type="button" class="scn-btn go" data-act="harvest">' + I('leaf') + t('gh.scene.harvest', { time: S.util.duration(reap.minutes(s)) }) + '</button>' : '') +
      (alive(s) && Sim.ghPlanted(s).length
        ? '<button type="button" class="scn-btn' + (tendErr ? '' : ' go') + '" data-act="water" ' + (tendErr ? 'disabled title="' + S.util.escape(t(tendErr)) + '"' : '') + '>' + I('drop') +
          t('gh.scene.water', { l: tend.preview(s).costVars.l, time: S.util.duration(tend.minutes(s)) }) + '</button>'
        : '') +
      '<button type="button" class="scn-btn" data-act="leave"><kbd>Esc</kbd>' + t('gh.scene.exit') + '</button>';
    return '<div class="scn-info">' + info + msg + '</div>' + picker + '<div class="scn-acts">' + btns + '</div>';
  }

  function topHtml() {
    const s = G.s;
    const trays = t('gh.trays_info', { lv: S.Sim.upgradeLevel(s, 'greenhouse'), n: S.Sim.ghTrayCount(s), l: S.DATA.habitat.greenhouse.tendWaterL });
    const yieldTip = trays + (s.greenhouse.yieldPct > 100 ? ' ' + t('gh.boosted') : '');
    return (
      '<span>SOL ' + s.sol + ' · ' + S.util.clock(s.minute) + '</span>' +
      '<span>' + I('drop') + t('pv.water') + ' ' + Math.round(s.res.waterL) + ' L</span>' +
      '<span title="' + S.util.escape(yieldTip) + '">' + I('leaf') + t('gh.yield') + ' %' + S.Sim.ghYieldPct(s) + '</span>' +
      '<span class="scn-keys">' + t('gh.scene.keys') + '</span>'
    );
  }

  function syncDom() {
    const bar = barHtml();
    if (bar !== G.barHtml) {
      G.barHtml = bar;
      G.box.querySelector('.scn-bar').innerHTML = bar;
    }
    const top = topHtml();
    if (top !== G.topHtml) {
      G.topHtml = top;
      G.box.querySelector('.scn-top').innerHTML = top;
    }
  }

  function frame(now) {
    if (!G) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    update(dt);
    if (!G) return; // çıkış tamamlandı
    render(now / 1000);
    syncDom();
    requestAnimationFrame(frame);
  }
})((window.SOL14 = window.SOL14 || {}));
