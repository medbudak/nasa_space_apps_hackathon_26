(function (S) {
  'use strict';

  const STATIONS = [
    { id: 'tcm',     labelTr: 'KOKPİT',       labelEn: 'COCKPIT',     x: 22, bg: 'assets/processed/interior/shuttle_cockpit_interior.jpeg' },
    { id: 'leak',    labelTr: 'O₂ HATTI',     labelEn: 'O₂ LINE',     x: 46, bg: 'assets/processed/screens/scr_ship_o2_leak.jpeg' },
    { id: 'arrays',  labelTr: 'MÜHENDİSLİK',  labelEn: 'ENGINEERING', x: 61, bg: 'assets/processed/interior/shuttle_engineering_bay.jpeg' },
    { id: 'thermal', labelTr: 'REAKTÖR',      labelEn: 'REACTOR',     x: 71, bg: 'assets/processed/screens/scr_ship_reactor.jpeg' }
  ];

  const INTERIOR_BG = 'assets/processed/screens/scr_ship_interior.jpeg';
  const CREW_IMG = 'assets/processed/sprites/astronaut_indoor.png';

  function applyBg(root, relPath) {
    const absUrl = new URL(relPath, document.baseURI).href;
    root.style.setProperty('--bg', 'url("' + absUrl + '")');
    const bgDiv = root.querySelector('.cs-bg');
    if (bgDiv) {
      bgDiv.style.backgroundImage = 'url("' + absUrl + '")';
      bgDiv.style.backgroundSize = 'cover';
      bgDiv.style.backgroundPosition = 'center';
    }
  }

  function enhanceTransitScene(root) {
    if (!root || root.dataset.shuttleEnhanced === '1') return;
    root.dataset.shuttleEnhanced = '1';

    const card = root.querySelector('.tk-card');
    const side = root.querySelector('.tk-side');
    if (side) {
      side.style.transform = 'scale(0.84)';
      side.style.transformOrigin = 'top right';
    }

    let lastCardSig = '';
    let crewX = 24;
    let moveDir = 0;

    // Sadece mekik kesiti ekranindayken gorunen piksel katman
    const layer = document.createElement('div');
    layer.id = 'shuttle-walk-layer';
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3;';

    const markers = {};
    STATIONS.forEach((st) => {
      const m = document.createElement('div');
      m.style.cssText =
        'position:absolute;left:' + st.x + '%;bottom:43%;transform:translateX(-50%);pointer-events:auto;cursor:pointer;' +
        'display:flex;flex-direction:column;align-items:center;gap:2px;font-family:inherit;';
      m.innerHTML =
        '<span data-tag style="background:rgba(15,16,21,0.92);border:1px solid #3fe0e6;color:#3fe0e6;' +
        'padding:2px 6px;font-size:0.68em;letter-spacing:0.06em;text-transform:uppercase;">' +
        (S.lang === 'en' ? st.labelEn : st.labelTr) + '</span>' +
        '<span data-arr style="color:#3fe0e6;font-size:0.75em;line-height:1;">▼</span>';
      m.addEventListener('click', (e) => {
        e.stopPropagation();
        crewX = st.x;
        crewEl.style.left = crewX + '%';
        const activeId = getActiveTaskId();
        if (st.id === activeId && card) {
          card.hidden = false;
          applyBg(root, st.bg);
        }
      });
      layer.appendChild(m);
      markers[st.id] = m;
    });

    // Oyunun kendi .world-prompt sinifini kullanan [E] etkilesim balonu
    const promptBtn = document.createElement('button');
    promptBtn.type = 'button';
    promptBtn.className = 'world-prompt';
    promptBtn.hidden = true;
    promptBtn.style.cssText = 'position:absolute;bottom:48%;top:auto;pointer-events:auto;z-index:5;';
    promptBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const activeId = getActiveTaskId();
      const st = STATIONS.find((x) => x.id === activeId);
      if (st && card) {
        card.hidden = false;
        applyBg(root, st.bg);
      }
    });
    layer.appendChild(promptBtn);

    const crewEl = document.createElement('img');
    crewEl.src = CREW_IMG;
    crewEl.alt = '';
    crewEl.style.cssText =
      'position:absolute;left:24%;bottom:24.5%;height:20%;transform:translateX(-50%);' +
      'image-rendering:pixelated;pointer-events:none;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.9));';
    layer.appendChild(crewEl);

    root.appendChild(layer);
    applyBg(root, INTERIOR_BG);

    function getActiveTaskId() {
      const h2 = card ? card.querySelector('h2') : null;
      if (!h2) return null;
      const txt = h2.textContent.toLowerCase();
      if (txt.includes('güneş') || txt.includes('solar') || txt.includes('panel')) return 'arrays';
      if (txt.includes('sızıntı') || txt.includes('leak') || txt.includes('o₂')) return 'leak';
      if (txt.includes('yörünge') || txt.includes('tcm') || txt.includes('trajectory')) return 'tcm';
      if (txt.includes('ısı') || txt.includes('thermal') || txt.includes('kabin')) return 'thermal';
      return null;
    }

    const onKeyDown = (e) => {
      if (!document.body.contains(root) || layer.style.display === 'none') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveDir = -1;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveDir = 1;
      else if (e.code === 'KeyE') {
        const activeId = getActiveTaskId();
        const st = STATIONS.find((x) => x.id === activeId);
        if (st && Math.abs(crewX - st.x) < 12 && card) {
          card.hidden = false;
          applyBg(root, st.bg);
        }
      }
    };
    const onKeyUp = (e) => {
      if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && moveDir === -1) moveDir = 0;
      if ((e.code === 'ArrowRight' || e.code === 'KeyD') && moveDir === 1) moveDir = 0;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastT = performance.now();
    function tick(now) {
      if (!document.body.contains(root)) {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        return;
      }
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      const typeBox = root.querySelector('[data-r="type"]');
      const edlBox = root.querySelector('[data-r="edl"]');
      const isApproaching = (typeBox && !typeBox.hidden) || (edlBox && !edlBox.hidden) || root.classList.contains('edl-on');

      if (card) {
        const sig = card.innerHTML;
        const hasStartBtn = !!card.querySelector('[data-start]');
        if (sig !== lastCardSig) {
          lastCardSig = sig;
          if (hasStartBtn) {
            card.hidden = true;
            applyBg(root, INTERIOR_BG);
            if (!card.querySelector('[data-hide-walk]')) {
              const hideBtn = document.createElement('button');
              hideBtn.type = 'button';
              hideBtn.dataset.hideWalk = '1';
              hideBtn.className = 'btn btn-ghost btn-sm';
              hideBtn.style.cssText = 'margin-top:6px;width:100%;';
              hideBtn.textContent = S.lang === 'en' ? 'Back to Shuttle Deck' : 'Mekik Güvertesine Dön';
              hideBtn.addEventListener('click', () => {
                card.hidden = true;
                applyBg(root, INTERIOR_BG);
              });
              card.appendChild(hideBtn);
            }
          } else {
            card.hidden = false;
          }
        }
        card.style.maxWidth = '26em';
        card.style.fontSize = '0.86em';
        card.style.zIndex = '10';
      }

      // Sadece mekik kesitindeyken ve gorev karti kapaliyken astronot/etiket katmanini goster
      const showDeck = !isApproaching && (!card || card.hidden);
      layer.style.display = showDeck ? 'block' : 'none';

      if (showDeck) {
        if (moveDir !== 0) {
          crewX = Math.max(15, Math.min(73, crewX + moveDir * 28 * dt));
          crewEl.style.left = crewX + '%';
          crewEl.style.transform = 'translateX(-50%) scaleX(' + moveDir + ')';
        }

        const activeId = getActiveTaskId();
        STATIONS.forEach((st) => {
          const m = markers[st.id];
          // Sadece siradaki aktif gorevin isaretcisini goster, digerlerini gizle
          m.style.display = st.id === activeId ? 'flex' : 'none';
        });

        const activeSt = STATIONS.find((x) => x.id === activeId);
        if (activeSt && Math.abs(crewX - activeSt.x) < 12) {
          promptBtn.hidden = false;
          promptBtn.style.left = activeSt.x + '%';
          const h2 = card ? card.querySelector('h2') : null;
          promptBtn.innerHTML = '<kbd>E</kbd><span>' + (h2 ? h2.textContent : activeSt.labelTr) + '</span>';
        } else {
          promptBtn.hidden = true;
        }
      }

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const obs = new MutationObserver(() => {
    const tr = document.querySelector('.cutscene.transit');
    if (tr) enhanceTransitScene(tr);
  });
  if (document.body) obs.observe(document.body, { childList: true, subtree: true });
  else window.addEventListener('DOMContentLoaded', () => obs.observe(document.body, { childList: true, subtree: true }));
})((window.SOL14 = window.SOL14 || {}));

