/*
 * Spor odası (K3 Medine, 2026-11-15). Mekik kesitinde sağdan ikinci bölmenin kapısında E: yakın çekim, yandan görünüş.
 * Mürettebat ayak sabitleme plakasında dinlenme pozunda bekler; "Egzersize başla" ile direnç tutacaklarını kavrar ve
 * uzan → çek → kısa tut → kontrollü bırak tekrarlarını yapar, sonra dinlenme pozuna döner. Oda sabittir: yalnız kollar,
 * tutacaklar ve kablolar hareket eder. Süre, moral ve yorgunluk Sim'in "exercise" eyleminden gelir ve tekrarlar bitince
 * bir kez uygulanır (GS.finish); Esc ile yarıda bırakılan egzersiz sayılmaz.
 * Arka plan: assets/processed/screens/scr_gym_room.png (referans GIF'in odası, astronot ve kablolar silindi).
 * Gövde: astro_indoor_gym (iç mekân karakterinin kolsuz karesi); kollar piksel piksel çizilir.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const W = 640;
  const H = 360;
  const SCENE_ID = 'gym-scene';
  // Odanın yerleri (arka plan görselinden, 640×360)
  const PLATE = { cx: 286, top: 310 }; // ayak sabitleme plakası
  const PULLEY = { far: [520, 142], near: [520, 189] }; // kablo makarası (üst / alt)
  const SCALE = 2; // gövde karesi (73×133) tam sayı ölçekte
  // Kol (gövde karesinin pikselinde): omuz, kol boyları, kalınlık
  const ARM = { near: [22, 63], far: [31, 60], upper: 15, fore: 13, rUpper: 5, rFore: 4.5, rHand: 4.5 };
  // El hedefleri omuza göre: dinlenme (tutacaklar elde, kollar aşağıda), uzanma, çekme (göğüse)
  const HAND = { rest: [2, 28], reach: [27, 1], pull: [10, 6] };
  const C = { out: '#1c1a1f', suit: '#ece1d3', shade: '#c9bba9', orange: '#d0622a', glove: '#d8d0c4', farSuit: '#b9ad9f', farShade: '#9a8e81', handle: '#d9752e', cable: '#2a2a30', cableHi: '#5a5a66', strap: '#8a8f99' };

  // Egzersiz zaman çizelgesi (gerçek saniye): kavra, tekrarlar (çek / tut / bırak), bırak ve dinlen
  const PLAN = { grip: 0.6, pull: 0.7, hold: 0.45, release: 1.0, reps: 3, end: 0.6 };
  const REP_S = PLAN.pull + PLAN.hold + PLAN.release;

  const GS = (S.GymScene = {});
  GS.PLAN = PLAN;
  GS.totalS = () => PLAN.grip + PLAN.reps * REP_S + PLAN.end;
  let G = null;

  const ease = (k) => k * k * (3 - 2 * k);
  const clamp01 = (k) => Math.max(0, Math.min(1, k));
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  /**
   * Egzersizin t saniyedeki pozu. rest: dinlenme pozunun ağırlığı (1 = kollar aşağıda), pull: çekme miktarı
   * (0 = kollar uzanmış, 1 = tutacaklar göğüste), rep: kaçıncı tekrar (1..reps), phase: grip|pull|hold|release|end|done.
   */
  GS.pose = function (sec) {
    if (sec < PLAN.grip) return { phase: 'grip', rep: 0, rest: 1 - ease(sec / PLAN.grip), pull: 0 };
    let x = sec - PLAN.grip;
    if (x < PLAN.reps * REP_S) {
      const rep = Math.floor(x / REP_S) + 1;
      x -= (rep - 1) * REP_S;
      if (x < PLAN.pull) return { phase: 'pull', rep, rest: 0, pull: ease(x / PLAN.pull) };
      if (x < PLAN.pull + PLAN.hold) return { phase: 'hold', rep, rest: 0, pull: 1 };
      return { phase: 'release', rep, rest: 0, pull: 1 - ease((x - PLAN.pull - PLAN.hold) / PLAN.release) };
    }
    x -= PLAN.reps * REP_S;
    if (x < PLAN.end) return { phase: 'end', rep: PLAN.reps, rest: ease(x / PLAN.end), pull: 0 };
    return { phase: 'done', rep: PLAN.reps, rest: 1, pull: 0 };
  };

  /** Tekrarlar bitti: eylemin etkileri bir kez uygulanır (aynı egzersiz için ikinci çağrı hiçbir şey yapmaz) */
  GS.finish = function (s, run) {
    if (run.rewarded) return { ok: false, repeat: true };
    run.rewarded = true;
    return S.Sim.doAction(s, 'exercise');
  };

  GS.isOpen = () => Boolean(G);

  GS.open = function () {
    const s = S.getState();
    const box = S.UI.openModal(SCENE_ID, '<div class="imp-scene scn"><canvas width="' + W + '" height="' + H + '"></canvas><div class="scn-bar"></div></div>', {
      closable: false,
      cls: 'modal-scene'
    });
    const body = document.createElement('canvas'); // gövde + kollar, karenin kendi pikselinde (sonra ölçeklenir)
    body.width = 90;
    body.height = 133;
    G = {
      s,
      box,
      c: box.querySelector('canvas').getContext('2d'),
      body,
      b: body.getContext('2d'),
      reduced: S.FX.motionAmp() < 1,
      t: 0, // sahnede geçen süre (giriş / çıkış kararması)
      run: null, // { t, rewarded } egzersiz sürerken
      leaving: null,
      msg: null,
      barHtml: '',
      last: performance.now()
    };
    G.c.imageSmoothingEnabled = false;
    window.addEventListener('keydown', onKey, true);
    box.querySelector('.scn-bar').addEventListener('click', onBarClick);
    S.bus.emit('audio:play', 'door');
    requestAnimationFrame(frame);
  };

  function close() {
    window.removeEventListener('keydown', onKey, true);
    G = null;
    S.UI.closeModal(SCENE_ID, true);
    if (S.HabitatPanel) S.HabitatPanel.lastHtml = '';
  }

  /* ---------------- eylemler ---------------- */
  const mustLeave = (s) => S.Game.pendingSol.length > 0 || S.Game.pendingImpact || s.crisis.active || Boolean(s.ending);

  function start() {
    if (G.run || G.leaving) return;
    G.run = { t: 0, rewarded: false };
    G.msg = null;
    S.bus.emit('audio:play', 'click');
  }

  function complete() {
    const s = G.s;
    const before = { morale: Math.round(s.res.morale), fatigue: Math.round(S.Sim.needs(s).fatigue) };
    const res = GS.finish(s, G.run);
    G.run = null;
    if (!res.ok) return;
    G.msg = { text: t('gym.scene.done', { m1: before.morale, m2: Math.round(s.res.morale), f1: before.fatigue, f2: Math.round(S.Sim.needs(s).fatigue) }), tone: 'ok' };
    S.bus.emit('audio:play', 'success');
    if (mustLeave(s)) leave();
  }

  function leave() {
    if (G.leaving) return;
    if (G.run) G.msg = null; // yarıda bırakılan egzersiz sayılmaz: etkisi uygulanmaz
    G.run = null;
    G.leaving = { t: 0 };
    S.bus.emit('audio:play', 'door');
  }

  /* ---------------- girdi ---------------- */
  function onKey(e) {
    if (!G) return;
    e.stopPropagation();
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Escape') leave();
    else if (e.code === 'KeyE' || e.code === 'Enter') start();
  }
  function onBarClick(e) {
    const btn = e.target.closest('button');
    if (!btn || !G) return;
    if (btn.dataset.act === 'start') start();
    else if (btn.dataset.act === 'leave') leave();
  }

  /* ---------------- çizim: kollar ---------------- */
  // Kalın çizgi parçası, piksel piksel (ölçeklenince bulanıklaşmasın)
  function capsule(c, a, b, r, col) {
    c.fillStyle = col;
    const vx = b[0] - a[0];
    const vy = b[1] - a[1];
    const len2 = vx * vx + vy * vy || 1;
    for (let y = Math.floor(Math.min(a[1], b[1]) - r); y <= Math.ceil(Math.max(a[1], b[1]) + r); y++) {
      for (let x = Math.floor(Math.min(a[0], b[0]) - r); x <= Math.ceil(Math.max(a[0], b[0]) + r); x++) {
        const k = Math.max(0, Math.min(1, ((x + 0.5 - a[0]) * vx + (y + 0.5 - a[1]) * vy) / len2));
        const dx = x + 0.5 - (a[0] + k * vx);
        const dy = y + 0.5 - (a[1] + k * vy);
        if (dx * dx + dy * dy <= r * r) c.fillRect(x, y, 1, 1);
      }
    }
  }
  /** İki kemikli kol: dirsek aşağıda kalır (çekerken geriye-aşağıya gider) */
  function elbowOf(sh, hand) {
    const dx = hand[0] - sh[0];
    const dy = hand[1] - sh[1];
    const d = Math.max(Math.abs(ARM.upper - ARM.fore) + 0.5, Math.min(ARM.upper + ARM.fore - 0.5, Math.hypot(dx, dy)));
    const a = Math.atan2(dy, dx);
    const b = Math.acos((ARM.upper * ARM.upper + d * d - ARM.fore * ARM.fore) / (2 * ARM.upper * d));
    const e1 = [sh[0] + ARM.upper * Math.cos(a + b), sh[1] + ARM.upper * Math.sin(a + b)];
    const e2 = [sh[0] + ARM.upper * Math.cos(a - b), sh[1] + ARM.upper * Math.sin(a - b)];
    return e1[1] >= e2[1] ? e1 : e2;
  }
  /** Kolun çizimi; elin tuttuğu tutacağın kablo bağlantı noktasını (karenin pikselinde) döndürür */
  function drawArm(c, sh, hand, far) {
    const el = elbowOf(sh, hand);
    const suit = far ? C.farSuit : C.suit;
    const shade = far ? C.farShade : C.shade;
    capsule(c, sh, el, ARM.rUpper + 1, C.out);
    capsule(c, el, hand, ARM.rFore + 1, C.out);
    capsule(c, sh, el, ARM.rUpper, suit);
    capsule(c, el, hand, ARM.rFore, suit);
    capsule(c, mix(el, hand, 0.55), mix(el, hand, 0.7), ARM.rFore, far ? C.farShade : C.orange); // bilek bandı
    capsule(c, [sh[0] - 1, sh[1] + 1], [sh[0] + 1, sh[1] + 2], 2, far ? shade : C.orange); // omuz yaması
    // tutacak (D halkası) ve eldiven
    const hx = Math.round(hand[0]);
    const hy = Math.round(hand[1]);
    c.fillStyle = C.out;
    c.fillRect(hx - 1, hy - 5, 7, 10);
    c.fillStyle = far ? C.farShade : C.handle;
    c.fillRect(hx, hy - 4, 5, 8);
    c.fillStyle = C.out;
    c.fillRect(hx + 1, hy - 3, 3, 6);
    capsule(c, [hand[0], hand[1]], [hand[0] + 0.5, hand[1]], ARM.rHand + 1, C.out);
    capsule(c, [hand[0], hand[1]], [hand[0] + 0.5, hand[1]], ARM.rHand, far ? C.farSuit : C.glove);
    return [hx + 5, hy];
  }

  /** Gövde ve kollar; iki tutacağın kablo noktaları ekran pikselinde */
  function drawCrew(p) {
    const b = G.b;
    const img = S.Sprites.get('astro_indoor_gym');
    b.clearRect(0, 0, G.body.width, G.body.height);
    const pullK = G.reduced ? p.pull * 0.5 : p.pull;
    const target = (key) => {
      const r = mix(HAND.reach, HAND.pull, pullK);
      const o = mix(r, HAND.rest, p.rest);
      return [ARM[key][0] + o[0], ARM[key][1] + o[1]];
    };
    const farGrip = drawArm(b, ARM.far, target('far'), true);
    if (img) b.drawImage(img, 0, 0);
    const nearGrip = drawArm(b, ARM.near, target('near'), false);
    const left = PLATE.cx - Math.round((73 * SCALE) / 2);
    const top = PLATE.top - 133 * SCALE;
    const toScreen = (q) => [left + q[0] * SCALE, top + q[1] * SCALE];
    return { left, top, grips: { far: toScreen(farGrip), near: toScreen(nearGrip) } };
  }

  /** Kablo: tutacaktan makaraya; dinlenirken gevşek (sarkar), çekerken gergin */
  function drawCable(c, from, to, slack) {
    const mx = (from[0] + to[0]) / 2;
    const my = (from[1] + to[1]) / 2 + slack * 26;
    const seg = 24;
    let prev = from;
    for (let i = 1; i <= seg; i++) {
      const k = i / seg;
      const x = (1 - k) * (1 - k) * from[0] + 2 * (1 - k) * k * mx + k * k * to[0];
      const y = (1 - k) * (1 - k) * from[1] + 2 * (1 - k) * k * my + k * k * to[1];
      c.strokeStyle = C.cable;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(prev[0], prev[1]);
      c.lineTo(x, y);
      c.stroke();
      c.strokeStyle = C.cableHi;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(prev[0], prev[1] - 1);
      c.lineTo(x, y - 1);
      c.stroke();
      prev = [x, y];
    }
  }

  /** Ayak sabitleme kayışları: botlar plakaya bağlı (zeminde serbest koşmaz) */
  function drawStraps(c, left) {
    for (const [x0, x1] of [[19, 35], [35, 51]]) {
      const x = left + x0 * SCALE;
      const w = (x1 - x0) * SCALE;
      c.fillStyle = C.out;
      c.fillRect(x - 2, PLATE.top - 18, w + 4, 8);
      c.fillRect(x - 2, PLATE.top - 18, 5, 18);
      c.fillRect(x + w - 3, PLATE.top - 18, 5, 18);
      c.fillStyle = C.strap;
      c.fillRect(x, PLATE.top - 16, w, 4);
      c.fillRect(x, PLATE.top - 16, 2, 16);
      c.fillRect(x + w - 2, PLATE.top - 16, 2, 16);
    }
  }

  function render() {
    const c = G.c;
    const room = S.Sprites.get('gym_room');
    const run = G.run;
    const p = run ? GS.pose(run.t) : GS.pose(0);
    c.save();
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    // girişte hafif yakınlaşma (hareketi azalt açıkken yok)
    const zoom = G.reduced ? 1 : 1.06 - 0.06 * ease(clamp01(G.t / 0.7));
    c.translate(W / 2, H / 2);
    c.scale(zoom, zoom);
    c.translate(-W / 2, -H / 2);
    if (room) c.drawImage(room, 0, 0, W, H);
    const crew = drawCrew(p);
    const slack = p.rest;
    drawCable(c, crew.grips.far, PULLEY.far, slack);
    drawCable(c, crew.grips.near, PULLEY.near, slack);
    c.drawImage(G.body, 0, 0, G.body.width, G.body.height, crew.left, crew.top, G.body.width * SCALE, G.body.height * SCALE);
    drawStraps(c, crew.left);
    c.restore();
    // giriş / çıkış kararması
    const black = G.leaving ? clamp01(G.leaving.t / 0.35) : 1 - clamp01(G.t / 0.35);
    if (black > 0) {
      c.fillStyle = 'rgba(0, 0, 0, ' + black.toFixed(3) + ')';
      c.fillRect(0, 0, W, H);
    }
  }

  /* ---------------- alt çubuk ---------------- */
  const I = (n) => S.UI.icon(n);
  function barHtml() {
    const s = G.s;
    const act = S.Sim.actions.exercise;
    const pv = act.preview(s);
    let status;
    if (G.run) {
      const p = GS.pose(G.run.t);
      status = '<small class="ok">' + t('gym.scene.rep', { n: Math.max(1, p.rep), of: PLAN.reps }) + ' · ' + t('gym.scene.phase.' + p.phase) + '</small><small>' + t('gym.scene.esc_cancel') + '</small>';
    } else status = '<small>' + t(pv.costKey, pv.costVars) + '</small>';
    const msg = G.msg ? '<p class="scn-msg ' + G.msg.tone + '">' + G.msg.text + '</p>' : '';
    const info = '<div class="scn-info"><b>' + t('station.gym') + ' · ' + t('pv.morale') + ' ' + pv.from + ' → ' + pv.to + ' · ' + S.util.duration(act.minutes(s)) + '</b>' + status + msg + '</div>';
    const btns =
      '<button type="button" class="scn-btn go" data-act="start" ' + (G.run ? 'disabled' : '') + '><kbd>E</kbd>' + t('gym.scene.start') + '</button>' +
      '<button type="button" class="scn-btn" data-act="leave"><kbd>Esc</kbd>' + t('gym.scene.exit') + '</button>';
    return info + '<div class="scn-acts">' + btns + '</div>';
  }
  function syncBar() {
    const html = barHtml();
    if (html === G.barHtml) return;
    G.barHtml = html;
    G.box.querySelector('.scn-bar').innerHTML = html;
  }

  function frame(now) {
    if (!G) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    G.t += dt;
    if (G.leaving) {
      G.leaving.t += dt;
      if (G.leaving.t > 0.4) return close();
    } else if (G.run) {
      G.run.t += dt;
      if (GS.pose(G.run.t).phase === 'done') complete();
    }
    render();
    syncBar();
    requestAnimationFrame(frame);
  }
})((window.SOL14 = window.SOL14 || {}));
