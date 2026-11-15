/**
 * SOL 14: RED HORIZON — FIELD CAM fotoğraf mini oyunu (K3; Medine'nin dünya prototipinden taşındı)
 * Astronot kamerayı tutar (assets/ui/field_cam.png), vizörde konu bulanık durur. ←/→ (ya da fare tekerleği /
 * vizörde sürükleme) odak halkasını çevirir; bulanıklık yaklaştıkça yavaşça kaybolur; net kalınca Space ile çekilir.
 * Konu: config.caseId (enkaz fotoğraf kanıtı) ya da config.scoutPart (lav tünelindeki İZCİ-1 parçası).
 * Sözleşme #5: run(config) -> Promise<{ success, score, timeUsed, skipped }>; Esc her zaman çıkış verir.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const esc = (x) => S.util.escape(x);
  const FC = { open: false };
  const VF = { w: 426, h: 264 }; // görseldeki vizör deliği (px)
  const VIEW_W = 213; // sahne yarım çözünürlükte çizilip piksel piksel büyütülür
  const VIEW_H = 132;
  const album = []; // bu oturumda çekilenler (file:// altında data URL değil, tuval)
  const cfg = () => S.DATA.explore.fieldCam;
  const rnd = (n) => (S.DigFx ? S.DigFx.rnd(n) : 0.5);
  const mix = (a, b, k) => (S.DigFx ? S.DigFx.hexMix(a, b, k) : a);
  let photoLayer = null;

  /** Kum ya da toz yığını: tekerleklerin çevresinde, düzensiz üst kenarlı */
  function drift(c, W, gy, half, rise, body, light) {
    for (let dx = -half; dx <= half; dx += 2) {
      const lens = 1 - (Math.abs(dx) / half) ** 2;
      const top = Math.round(gy + 14 - rise * Math.pow(lens, 0.7) - (Math.sin(dx * 0.37) * 1.5 + rnd(dx) * 2) * lens);
      const bottom = gy + 14 + Math.round(5 * lens);
      c.fillStyle = body;
      c.fillRect(W / 2 + dx, top, 2, Math.max(0, bottom - top));
      c.fillStyle = light;
      c.fillRect(W / 2 + dx, top, 2, 1);
    }
  }
  // Her enkazın fotoğraftaki hâli, ipucu metniyle uyumlu (clue.<id>.photo): Opportunity kalın toz altında,
  // Spirit eğik ve tekerlekleri kuma gömülü, InSight panelleri tozlu, Phoenix poligon zeminde CO₂ kırağısında.
  const PHOTO_LOOK = {
    opportunity: {
      coat: ['rgba(170, 78, 36, 0.62)', 'rgba(150, 70, 34, 0.38)'],
      haze: 'rgba(190, 112, 60, 0.20)',
      front: (c, W, gy) => drift(c, W, gy, 74, 8, '#a5532f', '#c4724a')
    },
    spirit: {
      tiltDeg: -11.5,
      sink: 9,
      front: (c, W, gy) => {
        drift(c, W, gy, 82, 15, '#cfae7c', '#e8d2a2');
        c.fillStyle = 'rgba(90, 60, 36, 0.5)';
        c.fillRect(W / 2 - 54, gy + 6, 30, 2);
        c.fillRect(W / 2 + 20, gy + 8, 34, 2);
      }
    },
    insight: {
      coat: ['rgba(196, 122, 74, 0.42)', 'rgba(196, 122, 74, 0.12)'],
      ground: (c, W, gy) => {
        c.fillStyle = 'rgba(60, 30, 22, 0.45)'; // ovada toz şeytanı izleri, aracın üstünde yok
        for (let x = -10; x < W; x += 2) c.fillRect(x, Math.round(gy + 18 + Math.sin(x * 0.05) * 5), 2, 2);
      }
    },
    phoenix: {
      coat: ['rgba(236, 242, 252, 0.22)', 'rgba(236, 242, 252, 0.05)'],
      ground: (c, W, gy) => {
        c.fillStyle = 'rgba(70, 44, 36, 0.55)'; // kutup ovasının poligon zemini
        for (let row = 0; row < 4; row++) {
          const y = gy + 6 + row * 9;
          c.fillRect(0, y, W, 1);
          for (let x = (row * 11) % 22; x < W; x += 22) c.fillRect(x, y - 8, 1, 9);
        }
        c.fillStyle = 'rgba(240, 244, 250, 0.75)'; // CO₂ kırağısı
        for (let i = 0; i < 14; i++) c.fillRect((i * 37) % W, gy + 4 + ((i * 7) % 36), 6 + (i % 3) * 3, 2);
      },
      front: () => {}
    },
    beagle2: {}
  };

  /** Vizördeki enkaz sahnesi: bulunduğu yerin renkleri (batı buzulda soğuk tonlar), öğle ışığı, eller titrer */
  function drawCaseScene(c, caseObj, minute, tt) {
    const noon = S.Art.palette(S.getState().design.landingSiteId, 720);
    const icy = caseObj.distanceM < 0 && S.Surface && S.Surface.iciness ? S.Surface.iciness(caseObj.distanceM) : 0;
    const gl = mix(noon.groundLight, '#e6eef6', icy * 0.7);
    const gd = mix(noon.groundDark, '#8ea4ba', icy * 0.6);
    const W = VIEW_W;
    const H = VIEW_H;
    c.save();
    c.translate(Math.sin(tt * 1.3) * 1.6 + Math.sin(tt * 3.7) * 0.5, Math.cos(tt * 1.1) * 1.1 + Math.sin(tt * 2.9) * 0.4);
    const sky = c.createLinearGradient(0, -4, 0, H * 0.62);
    sky.addColorStop(0, noon.skyTop);
    sky.addColorStop(1, noon.skyLow);
    c.fillStyle = sky;
    c.fillRect(-6, -6, W + 12, H + 12);
    c.fillStyle = mix(gd, noon.skyLow, 0.45);
    for (let x = -6; x < W + 6; x += 2) {
      const hgt = 10 + Math.sin(x * 0.045 + 1) * 6 + Math.sin(x * 0.13) * 3;
      c.fillRect(x, H * 0.6 - hgt, 2, hgt + 2);
    }
    const gy = Math.round(H * 0.6);
    c.fillStyle = gl;
    c.fillRect(-6, gy, W + 12, H);
    c.fillStyle = gd;
    for (let y = gy + 5; y < H + 6; y += 7) for (let x = ((y * 13) % 17) - 6; x < W + 6; x += 17) c.fillRect(x, y, 6, 1);
    const look = PHOTO_LOOK[caseObj.id] || {};
    if (look.ground) look.ground(c, W, gy);
    const img = S.Sprites && S.Sprites.get(caseObj.sprite);
    if (img) {
      const scale = Math.min(1.3, 120 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      if (!photoLayer) photoLayer = document.createElement('canvas');
      photoLayer.width = w;
      photoLayer.height = h;
      const p = photoLayer.getContext('2d');
      p.imageSmoothingEnabled = false;
      p.drawImage(img, 0, 0, w, h);
      if (look.coat) {
        p.globalCompositeOperation = 'source-atop'; // toz/kırağı yalnızca aracın piksellerine
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
    }
    if (look.front) look.front(c, W, gy);
    else {
      c.fillStyle = 'rgba(40,20,14,0.35)';
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

  /** Vizörde lav tünelindeki İZCİ-1 parçası: kaya duvar, zemin, kask lambasının ışık havuzu */
  function drawScoutScene(c, partId, tt) {
    const W = VIEW_W;
    const H = VIEW_H;
    const gy = Math.round(H * 0.68);
    c.save();
    c.translate(Math.sin(tt * 1.3) * 1.6, Math.cos(tt * 1.1) * 1.1);
    c.fillStyle = '#1a0f10';
    c.fillRect(-6, -6, W + 12, H + 12);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = i % 3 ? '#241616' : '#2e1c1b';
      c.fillRect(Math.round(rnd(i * 3.1) * W), Math.round(rnd(i * 5.7) * (gy - 10)), 8 + Math.round(rnd(i) * 18), 3 + Math.round(rnd(i * 2) * 5));
    }
    c.fillStyle = '#211617';
    c.fillRect(-6, gy, W + 12, H);
    c.fillStyle = '#3b2724';
    c.fillRect(-6, gy, W + 12, 2);
    if (S.DigFx) S.DigFx.drawPart(c, partId, W / 2, gy + 6, partId === 'body' ? 2.2 : 4, false);
    c.restore();
    const g = c.createRadialGradient(W / 2, gy - 10, 12, W / 2, gy - 10, W * 0.62);
    g.addColorStop(0, 'rgba(255, 236, 200, 0.10)');
    g.addColorStop(0.45, 'rgba(4, 2, 6, 0.15)');
    g.addColorStop(1, 'rgba(4, 2, 6, 0.85)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  function subjectOf(config) {
    if (config.scoutPart) return { id: 'scout_' + config.scoutPart, name: t('scout.' + config.scoutPart + '.name'), draw: (g, minute, tt) => drawScoutScene(g, config.scoutPart, tt) };
    const c = S.Forensics.get(config.caseId) || S.Forensics.cases()[0];
    return { id: c.id, name: c.name, draw: (g, minute, tt) => drawCaseScene(g, c, minute, tt) };
  }

  FC.run = function (config = {}) {
    return new Promise((resolve) => {
      const P = cfg();
      const s = S.getState();
      const subject = subjectOf(config);
      const rng = S.makeRng(((s.minute | 0) * 31 + (S.DigFx ? S.DigFx.seedOf(subject.id) : 7)) >>> 0);
      const base = 0.25 + rng() * 0.5; // konunun net olduğu odak (gizli)
      let focus = Math.max(0, Math.min(1, base + (rng() < 0.5 ? -1 : 1) * (0.32 + rng() * 0.12)));
      // net nokta yavaşça kayar (astronot hafifçe sallanır): odak küçük düzeltmeler ister
      const target = (tt) => base + 0.028 * Math.sin(tt * 0.5) + 0.01 * Math.sin(tt * 1.3 + 1);
      let blurShown = 9;
      let sharpFor = 0;
      let ready = false;
      let saved = false;
      let misses = 0;
      let holdL = 0;
      let holdR = 0;
      let msgUntil = 0;
      let done = false;
      let raf = 0;
      const start = performance.now();
      const html =
        '<div class="pcam" role="dialog" aria-label="FIELD CAM">' +
        '<div class="pcam-stage">' +
        '<canvas class="pcam-view" width="' + VIEW_W + '" height="' + VIEW_H + '"></canvas>' +
        '<img class="pcam-body" alt="" src="assets/ui/field_cam.png">' +
        '<div class="pcam-hud"><canvas class="pcam-br" width="' + VF.w + '" height="' + VF.h + '" style="position:absolute;inset:0;width:100%;height:100%"></canvas>' +
        '<span class="pcam-help"><b>' + esc(subject.name) + '</b><br>' + esc(t('cam.help')) + '</span>' +
        '<span class="pcam-count"></span><span class="pcam-status"></span>' +
        // odak çubuğu: odak halkasının nerede olduğu ve hangi yöne çevrildiği (←/→); netleştikçe işaret yeşillenir
        '<div class="pcam-focus" aria-hidden="true"><i class="pf-ticks"></i><b class="pf-mark"><i class="pf-dir"></i></b></div></div>' +
        '<div class="pcam-album" hidden></div><div class="pcam-flash"></div></div>' +
        '<div class="pcam-bar"><button type="button" data-pcam-close><kbd>Esc</kbd>' + esc(t('cam.close')) + '</button>' +
        '<button type="button" class="pcam-shoot" data-pcam-shoot></button><button type="button" data-pcam-album></button></div></div>';
      FC.open = true;
      const box = S.UI.openModal('minigame', html, { closable: false, cls: 'modal-minigame modal-pcam' });
      const view = box.querySelector('.pcam-view');
      const vctx = view.getContext('2d');
      const bctx = box.querySelector('.pcam-br').getContext('2d');
      const countEl = box.querySelector('.pcam-count');
      const statusEl = box.querySelector('.pcam-status');
      const markEl = box.querySelector('.pf-mark');
      const dirEl = box.querySelector('.pf-dir');
      let lastFocus = null;
      let dirShown = 0;
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
        countEl.textContent = String(Math.min(album.length + 1, P.albumSize)).padStart(2, '0') + ' / ' + P.albumSize;
        albumBtn.textContent = t('cam.album') + ' ' + album.length;
        shootBtn.className = 'pcam-shoot' + (saved ? ' saved' : ready ? ' ready' : '');
        shootBtn.innerHTML = saved ? esc(t('cam.btn_saved')) : ready ? '<kbd>Space</kbd>' + esc(t('cam.btn_shoot')) : esc(t('cam.btn_focusing'));
      };
      const finish = (success, score, skipped) => {
        if (done) return;
        done = true;
        if (!success || skipped) cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKey, true);
        window.removeEventListener('keyup', onKeyUp, true);
        const timeUsed = Math.round(((performance.now() - start) / 1000) * 10) / 10;
        setTimeout(() => {
          cancelAnimationFrame(raf);
          S.UI.closeModal('minigame', true);
          FC.open = false;
          resolve({ success, score: Math.round(Math.max(0, Math.min(1, score)) * 100) / 100, timeUsed, skipped: Boolean(skipped) });
        }, skipped ? 150 : 1100);
      };
      const shoot = () => {
        if (saved || done) return;
        if (!ready) {
          misses++;
          msgUntil = performance.now() + 1200;
          setStatus('cam.blurry');
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
        const shot = document.createElement('canvas');
        shot.width = VIEW_W;
        shot.height = VIEW_H;
        shot.getContext('2d').drawImage(view, 0, 0);
        album.push(shot);
        if (album.length > P.albumSize) album.shift();
        setStatus('cam.saved', 'saved');
        refreshBar();
        const err = Math.abs(focus - target((performance.now() - start) / 1000));
        S.bus.emit('audio:play', 'shutter');
        finish(true, Math.max(0.5, 0.72 + 0.28 * (1 - err / P.tolerance) - 0.05 * misses), false);
      };
      const toggleAlbum = () => {
        if (!albumEl.hidden) {
          albumEl.hidden = true;
          return;
        }
        albumEl.innerHTML = album.length ? '' : '<p>' + esc(t('cam.album_empty')) + '</p>';
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
      let dragX = null; // vizörde sürüklemek = odak halkasını çevirmek
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
      const frame = (now) => {
        if ((done && !saved) || !view.isConnected) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const tt = (now - start) / 1000;
        if (!saved) {
          // basılı tut: önce ince adımlar, uzun tutunca hızlanır
          for (const [h, dir] of [[holdL, -1], [holdR, 1]]) {
            if (h) focus = Math.max(0, Math.min(1, focus + dir * P.focusSpeed * Math.min(1, 0.25 + h * 1.3) * dt));
          }
          if (holdL) holdL += dt;
          if (holdR) holdR += dt;
          const err = Math.abs(focus - target(tt));
          const blurGoal = Math.min(9, Math.max(0, err - P.tolerance * 0.5) * 42);
          blurShown += (blurGoal - blurShown) * (1 - Math.exp(-P.blurEase * dt));
          sharpFor = err < P.tolerance && blurShown < 1.2 ? sharpFor + dt : 0;
          if (!ready && sharpFor >= P.holdSeconds) {
            ready = true;
            S.bus.emit('audio:play', 'scan');
            refreshBar();
          } else if (ready && err > P.tolerance * 1.4) {
            ready = false;
            refreshBar();
          }
          if (now > msgUntil) setStatus(ready ? 'cam.sharp' : 'cam.focusing', ready ? 'ok' : '');
          // odak çubuğu: işaret = halkanın konumu; ok = son çevirme yönü; renk = netliğe yakınlık
          const moved = lastFocus === null ? 0 : focus - lastFocus;
          lastFocus = focus;
          if (Math.abs(moved) > 1e-4) dirShown = Math.sign(moved) * 0.6;
          else dirShown = Math.sign(dirShown) * Math.max(0, Math.abs(dirShown) - dt);
          markEl.style.left = (focus * 100).toFixed(2) + '%';
          markEl.className = 'pf-mark ' + (err < P.tolerance * 1.4 ? 'sharp' : err < 0.15 ? 'near' : '');
          dirEl.className = 'pf-dir' + (dirShown > 0 ? ' r' : dirShown < 0 ? ' l' : '');
          if (tt > P.seconds) {
            finish(false, 0.3, false);
            return;
          }
        }
        sctx.clearRect(0, 0, VIEW_W, VIEW_H);
        subject.draw(sctx, S.getState().minute, saved ? 0 : tt);
        vctx.clearRect(0, 0, VIEW_W, VIEW_H);
        const b = saved ? 0 : blurShown;
        if (b < 0.25) vctx.drawImage(scene, 0, 0);
        else if (hasFilter) {
          vctx.filter = 'blur(' + b.toFixed(2) + 'px)';
          vctx.drawImage(scene, 0, 0);
          vctx.filter = 'none';
        } else {
          const f = 1 + b * 0.8; // tuval filtresi yoksa küçültüp geri büyüt
          small.width = Math.max(8, Math.round(VIEW_W / f));
          small.height = Math.max(5, Math.round(VIEW_H / f));
          smctx.imageSmoothingEnabled = true;
          smctx.drawImage(scene, 0, 0, small.width, small.height);
          vctx.imageSmoothingEnabled = true;
          vctx.drawImage(small, 0, 0, VIEW_W, VIEW_H);
        }
        // odak köşebentleri: bulanıkken geniş, netleştikçe konuya kapanır
        bctx.clearRect(0, 0, VF.w, VF.h);
        const k = Math.min(1, b / 6);
        const bw = 70 + 90 * k;
        const bh = 62 + 70 * k;
        const cx = VF.w / 2;
        const cy = VF.h / 2 + 4;
        bctx.strokeStyle = ready || saved ? '#ff5a43' : '#e8574a';
        bctx.globalAlpha = ready && !saved ? 0.75 + 0.25 * Math.sin(now / 120) : 0.9;
        bctx.lineWidth = 3;
        bctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const x = cx + (sx * bw) / 2;
          const y = cy + (sy * bh) / 2;
          bctx.moveTo(x, y - sy * 14);
          bctx.lineTo(x, y);
          bctx.lineTo(x - sx * 14, y);
        }
        bctx.stroke();
        raf = requestAnimationFrame(frame);
      };
      refreshBar();
      setStatus('cam.focusing');
      raf = requestAnimationFrame(frame);
      // başsız tarayıcı denetimi için: SOL14.FieldCam.debug.snap() odağı hedefe getirir
      FC.debug = { snap: () => (focus = target((performance.now() - start) / 1000)), info: () => ({ focus, ready, saved, blur: blurShown }) };
    });
  };

  S.FieldCam = FC;
})((window.SOL14 = window.SOL14 || {}));
