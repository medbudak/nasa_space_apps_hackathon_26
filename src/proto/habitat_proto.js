/**
 * SOL 14: RED HORIZON — SHELTER INTERIOR PROTOTYPE (local only, K3 / Medine). NOT part of the team build.
 *
 * Runtime patches, loaded before src/main.js; ?proto=0 turns them off.
 *  - The interior is redrawn as the crew lander's cabin (the shelter in this version, base_proto.js). Every
 *    station is drawn centred on its own x in Surface.INTERIOR.stations, so the thing you stand in front of is
 *    the thing the panel shows: the O₂ cylinders are the "Refill O₂" station (main drew its O₂ tank next to
 *    the power station, so standing at the tank selected "Power panel").
 *  - The station you stand at glows; the panel below follows it.
 *  - New bottom panel: vitals on the left, one strip of stations in the same left-to-right order as the room,
 *    the selected station's preview with its button on the right. Readable text (main's action cards came out
 *    tiny: <button> does not inherit font-size), styled like the cable panel.
 */
(function (S) {
  'use strict';
  if (!S.Surface || !S.Art || !S.HabitatPanel) return;
  if (new URLSearchParams(window.location.search).get('proto') === '0') return;

  const Surf = S.Surface;
  const HP = S.HabitatPanel;
  const t = (k, v) => S.t(k, v);
  const esc = (x) => S.util.escape(String(x));
  const I = (n) => S.UI.icon(n);

  const TEXT = {
    tr: {
      'proto.hp.stations': 'İstasyonlar',
      'proto.hp.go_station': 'Bir istasyonun önüne yürü (A/D) ya da aşağıdan seç.',
      'proto.hp.here': 'Buradasın',
      'proto.hp.exit_title': 'Hava kilidi',
      'proto.hp.exit_desc': 'Elbiseni kontrol et ve dışarı çık. Dönüş yolunu O₂ çubuğundaki kırmızı çentikle karşılaştır.',
      'proto.hp.exit_btn': 'Dışarı çık',
      'proto.hp.log': 'Karar günlüğü',
      'proto.hp.short.bunk': 'Ranza',
      'proto.hp.short.locker': 'O₂',
      'proto.hp.short.charger': 'Şarj',
      'proto.hp.short.workbench': 'Tezgâh',
      'proto.hp.short.power': 'Güç',
      'proto.hp.short.lab': 'Lab',
      'proto.hp.short.comms': 'Telsiz',
      'proto.hp.short.airlock': 'Kilit'
    },
    en: {
      'proto.hp.stations': 'Stations',
      'proto.hp.go_station': 'Walk up to a station (A/D) or pick one below.',
      'proto.hp.here': 'You are here',
      'proto.hp.exit_title': 'Airlock',
      'proto.hp.exit_desc': 'Check your suit and step outside. Compare the way back with the red notch on the O₂ bar.',
      'proto.hp.exit_btn': 'Go outside',
      'proto.hp.log': 'Decision log',
      'proto.hp.short.bunk': 'Bunk',
      'proto.hp.short.locker': 'O₂',
      'proto.hp.short.charger': 'Charge',
      'proto.hp.short.workbench': 'Bench',
      'proto.hp.short.power': 'Power',
      'proto.hp.short.lab': 'Lab',
      'proto.hp.short.comms': 'Radio',
      'proto.hp.short.airlock': 'Airlock'
    }
  };
  if (S.STORY) {
    Object.assign(S.STORY.tr, TEXT.tr);
    Object.assign(S.STORY.en, TEXT.en);
  }

  /* ================================================================ */
  /* Interior: the lander cabin                                         */
  /* ================================================================ */
  const ST = {}; // station id -> x (design px)
  for (const st of Surf.INTERIOR.stations) ST[st.id] = st.x;
  const R = (c, x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  // bounding box of each station's drawing (for the glow when you stand there)
  const BOX = {
    bunk: [-32, 58, 64, 128],
    locker: [-24, 74, 48, 112],
    charger: [-20, 98, 40, 88],
    workbench: [-24, 70, 48, 116],
    power: [-17, 66, 34, 120],
    lab: [-36, 52, 72, 134],
    comms: [-22, 84, 44, 102],
    airlock: [-20, 70, 40, 116]
  };

  function drawCabin(c, state, highlightId, tt) {
    const Ii = Surf.INTERIOR;
    const minute = state.minute;
    const { dark } = S.Art.lighting(minute);
    const lifeShed = (state.loads.find((l) => l.id === 'life_support') || {}).shed;
    const cold = state.res.habTempC < S.DATA.gameplay.habitatComfortMinC;
    const fy = Ii.floorY;
    const x0 = 44;
    const x1 = 600;
    const y0 = 24;

    // hull: white panels with an orange band, rounded top corners (the lander's colours)
    R(c, x0 + 12, y0, x1 - x0 - 24, 4, '#cbc6bd');
    R(c, x0 + 4, y0 + 4, x1 - x0 - 8, 4, '#cbc6bd');
    R(c, x0, y0 + 8, x1 - x0, fy - y0 + 18, '#b9b3a9');
    R(c, x0, y0 + 8, 4, fy - y0 + 18, '#ece9e2');
    R(c, x1 - 4, y0 + 8, 4, fy - y0 + 18, '#9d978e');
    R(c, x0, fy + 14, x1 - x0, 6, '#e8692a');
    R(c, x0, fy + 20, x1 - x0, 3, '#7a3010');
    // inner wall: grey panels with seams and rivets, a little blue when it is cold
    const wall = cold ? '#2f3846' : '#30353e';
    const panel = cold ? '#36404f' : '#383e48';
    R(c, x0 + 8, y0 + 10, x1 - x0 - 16, fy - y0 - 10, wall);
    for (let x = x0 + 12; x < x1 - 40; x += 44) {
      R(c, x, y0 + 30, 40, 52, panel);
      R(c, x, y0 + 86, 40, fy - y0 - 92, panel);
      R(c, x, y0 + 30, 40, 1, '#4a515d');
      R(c, x, y0 + 86, 40, 1, '#4a515d');
      R(c, x + 2, y0 + 33, 2, 2, '#4f5764');
      R(c, x + 36, y0 + 33, 2, 2, '#4f5764');
    }
    // ceiling: cable tray, ducts, lamps
    R(c, x0 + 8, y0 + 10, x1 - x0 - 16, 16, '#1f232a');
    R(c, x0 + 8, y0 + 18, x1 - x0 - 16, 3, '#4b4f57');
    R(c, x0 + 8, y0 + 22, x1 - x0 - 16, 1, '#e8692a');
    R(c, x0 + 8, y0 + 24, x1 - x0 - 16, 2, '#3b82c4');
    for (let lx = 90; lx < 580; lx += 96) {
      R(c, lx, y0 + 26, 30, 4, '#17181c');
      R(c, lx + 2, y0 + 28, 26, 2, lifeShed ? '#e8423b' : '#fff1c9');
      c.globalAlpha = lifeShed ? 0.06 + 0.05 * (Math.floor(tt * 2) % 2) : 0.06;
      c.fillStyle = lifeShed ? '#ff3b2f' : '#ffe3a0';
      c.beginPath();
      c.moveTo(lx + 2, y0 + 30);
      c.lineTo(lx + 28, y0 + 30);
      c.lineTo(lx + 52, fy);
      c.lineTo(lx - 22, fy);
      c.fill();
      c.globalAlpha = 1;
    }
    // floor: metal grating, a hazard stripe in front of the airlock
    R(c, x0 + 8, fy, x1 - x0 - 16, 14, '#22262d');
    R(c, x0 + 8, fy, x1 - x0 - 16, 2, '#4a505a');
    c.fillStyle = '#2f343c';
    for (let x = x0 + 10; x < x1 - 10; x += 5) c.fillRect(x, fy + 4, 3, 1);
    for (let x = x0 + 10; x < x1 - 10; x += 5) c.fillRect(x + 2, fy + 8, 3, 1);
    for (let i = 0; i < 8; i++) R(c, ST.airlock - 22 + i * 6, fy + 1, 3, 2, i % 2 ? '#26272d' : '#f2c230');

    const ok = (k) => (k ? '#3fe08a' : '#2a3a2f');
    const blink = Math.floor(tt * 2) % 2 === 0;

    // 1) bunks (sleep)
    {
      const x = ST.bunk;
      R(c, x - 30, 58, 3, 128, '#5c6370');
      R(c, x + 27, 58, 3, 128, '#5c6370');
      for (const by of [92, 140]) {
        R(c, x - 30, by + 8, 60, 4, '#6b7380');
        R(c, x - 27, by, 54, 8, '#3f6fb0');
        R(c, x - 27, by, 54, 2, '#5b8bd0');
        R(c, x - 26, by - 4, 13, 5, '#e9e3da');
      }
      R(c, x - 27, 172, 54, 14, '#2b2f36'); // drawer
      R(c, x - 4, 177, 8, 2, '#8a919c');
      R(c, x - 30, 58, 60, 3, '#5c6370');
    }
    // 2) O₂ cylinders + suit hookup (refill suit O₂ from the cabin reserve)
    {
      const x = ST.locker;
      R(c, x - 24, 182, 48, 4, '#4b4f57'); // rack base
      for (const dx of [-20, -2]) {
        R(c, x + dx, 92, 16, 90, '#e7e4dc');
        R(c, x + dx + 12, 92, 4, 90, '#bdb8ae');
        R(c, x + dx + 3, 86, 10, 6, '#cfcac1');
        R(c, x + dx + 5, 80, 6, 6, '#5c5e66'); // valve
        R(c, x + dx, 140, 16, 7, '#3b82c4'); // blue band (O₂)
      }
      R(c, x - 24, 112, 42, 3, '#5c6370'); // strap
      // reserve gauge: a column that follows the cabin O₂ reserve
      const frac = Math.min(1, state.res.o2ReserveKg / S.DATA.habitat.base.o2ReserveStartKg);
      R(c, x + 18, 96, 6, 80, '#17181c');
      R(c, x + 19, 97 + 78 * (1 - frac), 4, 78 * frac, frac < 0.25 ? '#e8423b' : '#3fe0e6');
      // hose to the suit connector on the wall
      c.strokeStyle = '#2a2d33';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x - 12, 80);
      c.bezierCurveTo(x - 12, 60, x + 10, 60, x + 10, 72);
      c.stroke();
      R(c, x + 6, 70, 9, 6, '#f2c230');
    }
    // 3) suit battery charger (charge suit): cabinet with a pack plugged in, LEDs = cabin battery level
    {
      const x = ST.charger;
      R(c, x - 20, 108, 40, 78, '#5a5f68');
      R(c, x - 18, 110, 36, 74, '#40454e');
      R(c, x - 12, 118, 24, 26, '#1d2026');
      c.fillStyle = '#ffc233';
      c.fillRect(x - 1, 121, 5, 7);
      c.fillRect(x - 4, 127, 8, 3);
      c.fillRect(x - 2, 130, 5, 8);
      const charge = state.res.energyKwh / Math.max(1, state.res.batteryKwh);
      for (let i = 0; i < 5; i++) R(c, x - 14 + i * 6, 152, 4, 4, i / 5 < charge ? '#3fe08a' : '#2a3a2f');
      R(c, x - 10, 162, 20, 18, '#2a2d33'); // the pack on its dock
      R(c, x - 8, 164, 16, 3, '#e8692a');
      c.strokeStyle = '#17181c';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 10, 170);
      c.bezierCurveTo(x + 22, 170, x + 22, 150, x + 18, 140);
      c.stroke();
    }
    // 4) workbench (repair suit): pegboard with tools, a helmet and a patch kit on the bench
    {
      const x = ST.workbench;
      R(c, x - 24, 70, 48, 40, '#2a2e35'); // pegboard
      c.fillStyle = '#3b414b';
      for (let yy = 74; yy < 108; yy += 6) for (let xx = x - 21; xx < x + 22; xx += 6) c.fillRect(xx, yy, 1, 1);
      R(c, x - 18, 76, 3, 22, '#9aa0a8'); // screwdriver
      R(c, x - 18, 76, 3, 6, '#e8692a');
      R(c, x - 8, 78, 10, 3, '#b4b6bc'); // wrench
      R(c, x - 8, 78, 3, 18, '#b4b6bc');
      R(c, x + 8, 76, 10, 8, '#f2c230'); // tape roll
      R(c, x + 11, 79, 4, 2, '#2a2e35');
      R(c, x - 24, 140, 48, 5, '#8a7a6c'); // bench top
      R(c, x - 22, 145, 4, 41, '#5c6370');
      R(c, x + 18, 145, 4, 41, '#5c6370');
      R(c, x - 18, 126, 18, 14, '#e7e4dc'); // helmet
      R(c, x - 14, 129, 12, 7, '#2a4f7a');
      R(c, x - 12, 130, 4, 2, '#7fb4e6');
      R(c, x + 4, 132, 14, 8, '#c94a2b'); // patch kit
      R(c, x + 9, 134, 4, 4, '#f2ebe2');
    }
    // 5) power panel: one LED per load, red when shed (the panel decides who gets energy first)
    {
      const x = ST.power;
      R(c, x - 17, 66, 34, 66, '#1f232a');
      R(c, x - 15, 68, 30, 62, '#2c3139');
      state.loads.forEach((L, i) => {
        R(c, x - 11, 72 + i * 8, 5, 5, L.shed ? '#e8423b' : L.on ? '#3fe08a' : '#4a4a4a');
        R(c, x - 3, 73 + i * 8, 14, 3, '#4a505a');
      });
      R(c, x - 2, 134, 4, 52, '#2a2d33'); // cable duct to the floor
      R(c, x - 6, 140, 12, 6, '#f2c230');
      R(c, x - 4, 142, 8, 2, '#26272d');
    }
    // 6) lab: window to Mars, bench with a pendulum, a microscope, beakers and a scope screen
    {
      const x = ST.lab;
      R(c, x - 30, 50, 60, 38, '#1d2026');
      R(c, x - 28, 52, 56, 34, dark > 0.5 ? '#1a1830' : '#d38d62');
      R(c, x - 28, 74, 56, 12, dark > 0.5 ? '#2a1c22' : '#9b4a35');
      R(c, x - 28, 70, 20, 4, dark > 0.5 ? '#2a1c22' : '#b5654a');
      if (cold) {
        c.globalAlpha = 0.45;
        R(c, x - 28, 52, 56, 34, '#bfe6f5');
        c.globalAlpha = 1;
      }
      R(c, x - 36, 148, 72, 5, '#8a7a6c');
      R(c, x - 34, 153, 4, 33, '#5c6370');
      R(c, x + 30, 153, 4, 33, '#5c6370');
      // pendulum stand
      R(c, x - 30, 112, 2, 36, '#9aa0a8');
      R(c, x - 12, 112, 2, 36, '#9aa0a8');
      R(c, x - 30, 112, 20, 2, '#9aa0a8');
      const sw = Math.sin((tt * 2 * Math.PI) / S.Engineering.calcPendulumPeriod(1)) * 6;
      c.strokeStyle = '#c9c2b8';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x - 20, 114);
      c.lineTo(x - 20 + sw, 136);
      c.stroke();
      R(c, x - 22 + sw, 136, 5, 5, '#f2c230');
      // microscope
      R(c, x - 2, 134, 10, 3, '#2a2e35');
      R(c, x + 2, 118, 4, 16, '#b4b6bc');
      R(c, x, 116, 8, 4, '#2a2e35');
      R(c, x - 2, 141, 12, 7, '#2a2e35');
      // beakers
      R(c, x + 14, 134, 6, 14, '#9fd8ff');
      R(c, x + 14, 140, 6, 8, '#3fe08a');
      R(c, x + 22, 138, 6, 10, '#9fd8ff');
      R(c, x + 22, 142, 6, 6, '#e8692a');
      // scope screen on the wall
      R(c, x + 8, 96, 26, 18, '#17181c');
      c.strokeStyle = '#3fe08a';
      c.beginPath();
      for (let i = 0; i <= 22; i++) {
        const yy = 105 + Math.sin(i * 0.8 + tt * 4) * 4;
        if (i === 0) c.moveTo(x + 10 + i, yy);
        else c.lineTo(x + 10 + i, yy);
      }
      c.stroke();
    }
    // 7) comms: radio console, screen with a link light, a headset; cables up to the antenna
    {
      const x = ST.comms;
      R(c, x - 2, y0 + 26, 3, 58, '#2a2d33');
      R(c, x + 4, y0 + 26, 2, 58, '#3b82c4');
      R(c, x - 22, 112, 44, 74, '#5a5f68');
      R(c, x - 20, 114, 40, 30, '#17181c');
      c.fillStyle = '#3fe08a';
      for (let i = 0; i < 4; i++) c.fillRect(x - 16, 118 + i * 6, 10 + ((i * 7 + Math.floor(tt * 3)) % 18), 2);
      const comms = state.loads.find((l) => l.id === 'comms');
      R(c, x + 12, 118, 4, 4, comms && comms.on && !comms.shed ? (blink ? '#3fe08a' : '#1f6f45') : '#e8423b');
      for (let i = 0; i < 6; i++) R(c, x - 16 + i * 6, 150, 4, 4, i % 3 ? '#9aa0a8' : '#e8692a'); // knobs
      R(c, x - 18, 160, 36, 2, '#2a2d33');
      R(c, x - 14, 88, 18, 4, '#26272d'); // headset on a hook
      R(c, x - 16, 90, 4, 10, '#26272d');
      R(c, x + 2, 90, 4, 10, '#26272d');
      R(c, x - 8, 84, 8, 4, '#4a505a');
    }
    // 8) airlock: round hatch with a wheel and a light (green = pressure OK)
    {
      const x = ST.airlock;
      R(c, x - 20, 70, 40, 116, '#4a505a');
      R(c, x - 17, 74, 34, 110, '#5c6370');
      c.fillStyle = '#3a3f48';
      c.beginPath();
      c.arc(x, 128, 14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#b4b6bc';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, 128, 9, 0, Math.PI * 2);
      c.moveTo(x - 9, 128);
      c.lineTo(x + 9, 128);
      c.moveTo(x, 119);
      c.lineTo(x, 137);
      c.stroke();
      R(c, x - 5, 78, 10, 5, '#17181c');
      R(c, x - 3, 79, 6, 3, lifeShed ? '#e8423b' : '#3fe08a');
      R(c, x - 8, 100, 16, 3, '#26272d');
      for (let i = 0; i < 4; i++) R(c, x - 16 + i * 8, 172, 4, 10, i % 2 ? '#26272d' : '#f2c230');
    }

    // the station you stand at: a pulsing cyan outline and a marker on the floor
    if (highlightId && BOX[highlightId] && ST[highlightId] !== undefined) {
      const [dx, by, bw, bh] = BOX[highlightId];
      const x = ST[highlightId] + dx;
      const a = 0.55 + 0.35 * Math.sin(tt * 5);
      c.save();
      c.globalAlpha = a;
      c.strokeStyle = '#3fe0e6';
      c.lineWidth = 1;
      c.strokeRect(Math.round(x - 3) + 0.5, Math.round(by - 3) + 0.5, bw + 6, bh + 3);
      c.globalAlpha = 0.12 * a;
      c.fillStyle = '#3fe0e6';
      c.fillRect(Math.round(x - 3), Math.round(by - 3), bw + 6, bh + 3);
      c.restore();
      R(c, ST[highlightId] - 4, fy + 3, 9, 2, '#3fe0e6');
      R(c, ST[highlightId] - 2, fy + 5, 5, 2, '#3fe0e6');
    }
    // night: the cabin dims a little, the lamps keep it lit
    if (dark > 0.3) {
      c.fillStyle = 'rgba(6,8,22,' + (dark * 0.18).toFixed(3) + ')';
      c.fillRect(x0, y0, x1 - x0, fy - y0 + 24);
    }
  }

  S.Art.drawInterior = function (ctx, state, highlightId, tt, view = { w: 640, h: 360, ox: 0, oy: 0 }) {
    const { w, h, ox, oy } = view;
    const site = state.design.landingSiteId;
    const minute = state.minute;
    // outside, behind the cabin cut-away: sky, hills and ground of the landing site
    S.Art.drawSky(ctx, site, minute, w, 240 + oy, { horizonY: 170 + oy });
    ctx.save();
    ctx.translate(0, oy - 70);
    S.Art.drawRidges(ctx, site, minute, 200 - ox, w);
    ctx.restore();
    S.Art.drawGround(ctx, site, minute, -ox, w, h, 210 + oy, {});
    ctx.save();
    ctx.translate(ox, oy);
    drawCabin(ctx, state, highlightId, tt || 0);
    ctx.restore();
  };

  /* ================================================================ */
  /* Panel                                                             */
  /* ================================================================ */
  const STRIP = ['bunk', 'locker', 'charger', 'workbench', 'power', 'lab', 'comms', 'airlock'];
  const ICON = { bunk: 'bed', locker: 'tank', charger: 'battery', workbench: 'wrench', power: 'power', lab: 'flask', comms: 'signal', airlock: 'arrowL' };
  const css = document.createElement('style');
  css.textContent =
    '.habitat-panel.php{height:auto;max-width:62em;grid-template-columns:13.5em 1fr 16.5em;align-items:stretch;gap:.6em;font-family:var(--font,ui-monospace,Consolas,monospace)}' +
    '.php > .panel{background:repeating-linear-gradient(0deg,rgba(63,224,230,.035) 0 1px,transparent 1px 3px),#111318;border:2px solid #2f8f93;border-radius:0;box-shadow:4px 4px 0 #0a3436;padding:.6em .75em;overflow:hidden}' +
    '.php h4{margin:0 0 .45em;font-size:.72em;letter-spacing:.16em;text-transform:uppercase;color:#3fe0e6}' +
    '.php-vit{display:grid;gap:.35em}' +
    '.php-row{display:grid;grid-template-columns:1.2em 1fr auto;gap:.4em;align-items:center;font-size:.78em}' +
    '.php-row .ico{width:1em;height:1em;color:#9fd9db}.php-row b{color:#fff;font-size:.95em}' +
    '.php-bar{grid-column:2/4;height:.42em;background:#1b1e24;border:1px solid #2f3a3c;margin-top:-.15em}.php-bar i{display:block;height:100%}' +
    '.php-res{display:flex;flex-wrap:wrap;gap:.2em .7em;margin-top:.2em;font-size:.68em;color:#9aa3ad}' +
    '.php-strip{display:grid;grid-template-columns:repeat(8,1fr);gap:.35em}' +
    '.php-st{font-family:inherit;font-size:.72em;color:#cfd6dc;background:#1a1d23;border:2px solid #2b2f36;border-radius:0;padding:.45em .1em .35em;cursor:pointer;' +
    'display:flex;flex-direction:column;align-items:center;gap:.3em;box-shadow:2px 2px 0 #000;position:relative}' +
    '.php-st .ico{width:1.5em;height:1.5em;color:#9aa3ad}' +
    '.php-st:hover{border-color:#4a7f83}.php-st.sel{border-color:#3fe0e6;color:#fff;background:#0d2427;box-shadow:2px 2px 0 #000,0 0 .8em rgba(63,224,230,.35)}' +
    '.php-st.sel .ico{color:#3fe0e6}.php-st.near::after{content:"";position:absolute;top:-.55em;left:50%;margin-left:-.35em;border:.35em solid transparent;border-top-color:#ffc233}' +
    '.php-hint{margin:.55em 0 0;font-size:.72em;color:#9aa3ad;display:flex;justify-content:space-between;gap:1em}' +
    '.php-hint button{font-family:inherit;font-size:1em;color:#cfd6dc;background:#1a1d23;border:2px solid #2b2f36;padding:.15em .5em;cursor:pointer;box-shadow:2px 2px 0 #000}' +
    '.php-pv{display:flex;flex-direction:column;gap:.35em}' +
    '.php-pv .pv-title{font-size:.9em;letter-spacing:.04em;text-transform:uppercase;border-bottom:2px dotted #2b4f52}' +
    '.php-pv .pv-row,.php-pv .pv-desc{font-size:.76em}.php-pv .pv-cost,.php-pv .pv-note,.php-pv .pv-err{font-size:.7em}' +
    '.php-go{margin-top:auto;font-family:inherit;font-size:.9em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#06222a;background:#3fe0e6;' +
    'border:0;padding:.55em .8em;cursor:pointer;box-shadow:3px 3px 0 #0a3436;display:flex;align-items:center;justify-content:center;gap:.6em}' +
    '.php-go:disabled{background:#2b2f36;color:#6b7280;cursor:not-allowed}' +
    '.php-go kbd{font:inherit;font-size:.85em;background:#06222a;color:#3fe0e6;padding:0 .35em}';
  document.head.appendChild(css);

  function vitRow(icon, label, pct, col, val) {
    return (
      '<div class="php-row">' + I(icon) + '<span>' + esc(label) + '</span><b>' + esc(val || '%' + Math.round(pct)) + '</b>' +
      '<div class="php-bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%;background:' + col + '"></i></div></div>'
    );
  }

  HP.render = function (s) {
    const host = document.getElementById('habitat-panel');
    if (!host) return;
    host.classList.add('php');
    const near = Surf.nearestStation();
    if (near && HP.lastStation !== near.id) {
      HP.lastStation = near.id;
      HP.selStation = near.id;
    }
    if (!HP.selStation) HP.selStation = 'locker';
    const sel = HP.selStation;
    const act = sel === 'airlock' ? 'exit' : HP.stationToAction(sel) || 'log';
    HP.selected = act;
    let pv;
    if (act === 'exit') pv = { title: t('proto.hp.exit_title'), lines: ['<p class="pv-desc">' + esc(t('proto.hp.exit_desc')) + '</p>'], button: t('proto.hp.exit_btn'), can: null };
    else pv = HP.preview(s, act) || { title: '', lines: [], button: '', can: null };
    const lowCol = (v) => (v < 25 ? '#e8423b' : v < 50 ? '#ffc233' : '#3fe08a');
    const html =
      '<section class="panel php-vit"><h4>' + esc(t('hp.status')) + '</h4>' +
      vitRow('o2', 'O₂', s.suit.o2, lowCol(s.suit.o2)) +
      vitRow('battery', t('hp.suit_battery'), s.suit.battery, '#ffc233') +
      vitRow('suit', t('hp.suit'), s.suit.integrity, s.suit.leak ? '#e8423b' : '#3fe0e6') +
      vitRow('morale', t('hp.morale'), s.res.morale, '#3fe0e6') +
      '<div class="php-res"><span>' + I('tank') + ' ' + s.res.o2ReserveKg.toFixed(1) + ' kg</span><span>' + I('power') + ' ' + s.res.energyKwh.toFixed(1) + ' kWh</span><span>💧 ' + Math.round(s.res.waterL) + ' L</span></div></section>' +
      '<section class="panel"><h4>' + esc(t('proto.hp.stations')) + '</h4><div class="php-strip">' +
      STRIP.map(
        (id) =>
          '<button class="php-st' + (sel === id ? ' sel' : '') + (near && near.id === id ? ' near' : '') + '" data-st="' + id + '" title="' + esc(id === 'airlock' ? t('proto.hp.exit_title') : t('action.' + HP.stationToAction(id))) + '">' +
          I(ICON[id]) + '<span>' + esc(t('proto.hp.short.' + id)) + '</span></button>'
      ).join('') +
      '</div><p class="php-hint"><span>' + esc(near ? t('proto.hp.here') + ': ' + (near.id === 'airlock' ? t('proto.hp.exit_title') : t('action.' + HP.stationToAction(near.id))) : t('proto.hp.go_station')) + '</span>' +
      '<button data-log>' + I('log') + ' ' + esc(t('proto.hp.log')) + '</button></p></section>' +
      '<section class="panel php-pv"><div class="pv-title">' + I(ICON[sel] || 'target') + '<span>' + esc(pv.title) + '</span></div>' +
      pv.lines.join('') +
      (pv.can ? '<p class="pv-err">' + I('x') + esc(t(pv.can)) + '</p>' : '') +
      '<button class="php-go" data-run ' + (pv.can ? 'disabled' : '') + '>' + esc(pv.button) + (near && near.id === sel ? ' <kbd>E</kbd>' : '') + '</button></section>' +
      '<button class="btn btn-exit" data-exit>' + I('arrowL') + t('hp.exit') + '</button>';
    if (html === HP.lastHtml) return;
    HP.lastHtml = html;
    host.innerHTML = html;
    host.querySelectorAll('[data-st]').forEach((b) =>
      b.addEventListener('click', () => {
        HP.selStation = b.dataset.st;
        HP.lastHtml = '';
        S.bus.emit('audio:play', 'click');
        HP.render(S.getState());
      })
    );
    host.querySelector('[data-run]').addEventListener('click', () => (act === 'exit' ? S.Game.exitHabitat() : HP.run(act)));
    host.querySelector('[data-log]').addEventListener('click', () => HP.run('log'));
    host.querySelector('[data-exit]').addEventListener('click', () => S.Game.exitHabitat());
  };
  const origShow = HP.show;
  HP.show = function () {
    HP.selStation = null;
    return origShow.apply(this, arguments);
  };
})((window.SOL14 = window.SOL14 || {}));
