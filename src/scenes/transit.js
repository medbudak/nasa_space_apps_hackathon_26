// Mars Transit (Mekik Ici Yolculuk) Sahnesi - Owner: K4
// A scene module exporting { enter(ctx), exit() }

export default {
  enter(ctx) {
    const { state, bus, goTo, canvas, ui } = ctx;
    const c2d = canvas.getContext('2d');

    // Gorselleri yukle
    const imgs = {
      interior: new Image(),
      cockpit: new Image(),
      o2: new Image(),
      reactor: new Image(),
      crew: new Image()
    };
    imgs.interior.src = 'assets/screens/scr_ship_interior.jpeg';
    imgs.cockpit.src  = 'assets/screens/scr_ship_cockpit.jpeg';
    imgs.o2.src       = 'assets/screens/scr_ship_o2_leak.jpeg';
    imgs.reactor.src  = 'assets/screens/scr_ship_reactor.jpeg';
    imgs.crew.src     = 'assets/sprites/astronaut_indoor.png';

    // 4 Mekik Ici Gorev Tanimi
    const tasks = [
      {
        id: 'nav',
        title: '1. Yörünge & Anten Hizalama',
        room: 'Kokpit',
        xRatio: 0.22,
        yRatio: 0.68,
        screenKey: 'cockpit',
        desc: 'Dünya iletişim çanağını ve güneş panellerini Mars rotasına kilitle.',
        actionLabel: 'Anteni Hizala & Kilitle',
        rewardText: '+15 Veri & +10 Enerji',
        done: false,
        applyReward: () => {
          if (state.resources) {
            state.resources.data = Math.min(100, (state.resources.data ?? 50) + 15);
            state.resources.energy = Math.min(100, (state.resources.energy ?? 80) + 10);
          }
        }
      },
      {
        id: 'o2',
        title: '2. Kabin Basıncı & O₂ Sızıntısı',
        room: 'Yaşam Koridoru',
        xRatio: 0.45,
        yRatio: 0.68,
        screenKey: 'o2',
        desc: 'Mikro-meteorit sonrası gevşeyen oksijen vanasını sık ve basıncı dengele.',
        actionLabel: 'Vanayı Sık & Sızıntıyı Kapat',
        rewardText: '+20 O₂ & +10 Isı',
        done: false,
        applyReward: () => {
          if (state.resources) {
            state.resources.o2 = Math.min(100, (state.resources.o2 ?? 70) + 20);
            state.resources.heat = Math.min(100, (state.resources.heat ?? 70) + 10);
          }
        }
      },
      {
        id: 'shield',
        title: '3. Güneş Fırtınası Radyasyon Kalkanı',
        room: 'Reaktör Bölmesi',
        xRatio: 0.56,
        yRatio: 0.68,
        screenKey: 'reactor',
        desc: 'Yaklaşan solar fırtınaya karşı reaktör gücünü manyetik kalkana yönlendir.',
        actionLabel: 'Kalkanları Devreye Al',
        rewardText: '-15 Radyasyon Yükü',
        done: false,
        applyReward: () => {
          if (state.resources) {
            state.resources.radiation = Math.max(0, (state.resources.radiation ?? 25) - 15);
          }
          if (bus && bus.emit) bus.emit('storm', { intensity: 0 });
        }
      },
      {
        id: 'cargo',
        title: '4. İniş Öncesi Kargo & Alet Kontrolü',
        room: 'Hava Kilidi & Kargo',
        xRatio: 0.78,
        yRatio: 0.68,
        screenKey: 'interior',
        desc: 'Jezero Krateri atmosfer girişi öncesi bilimsel aletleri ve paraşüt kilitlerini onayla.',
        actionLabel: 'İniş Sistemlerini Onayla',
        rewardText: 'Mars Atmosfer Girişine Hazır',
        done: false,
        applyReward: () => {}
      }
    ];

    // Murettebat konumu ve aktif gorev penceresi
    let crewX = 0.22;
    let targetX = 0.22;
    let activeTask = null;
    let rafId = null;

    // UI Katmani
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-family:monospace;color:#f1f5f9;';

    // Ust Bilgi ve Gorev Listesi Bari
    const topBar = document.createElement('div');
    topBar.style.cssText = 'position:absolute;top:14px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;background:rgba(20,27,45,0.88);border:1px solid #38bdf8;padding:10px 14px;border-radius:8px;pointer-events:auto;';

    const statusText = document.createElement('div');
    statusText.style.cssText = 'font-size:14px;font-weight:bold;color:#38bdf8;';

    const taskButtonsWrap = document.createElement('div');
    taskButtonsWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    const landBtn = document.createElement('button');
    landBtn.textContent = '🚀 Mars Yüzeyine İnişi Başlat';
    landBtn.className = 'btn';
    landBtn.style.cssText = 'background:#f97316;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:bold;opacity:0.45;';
    landBtn.disabled = true;
    landBtn.addEventListener('click', () => goTo('surface'));

    // Gorev Etkilesim Modali
    const modal = document.createElement('div');
    modal.style.cssText = 'display:none;position:absolute;inset:0;background:rgba(10,15,28,0.82);align-items:center;justify-content:center;pointer-events:auto;z-index:20;';

    const modalCard = document.createElement('div');
    modalCard.style.cssText = 'width:520px;max-width:92vw;background:#141b2d;border:2px solid #38bdf8;border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 32px rgba(0,0,0,0.7);';

    const modalTitle = document.createElement('h3');
    modalTitle.style.cssText = 'margin:0;color:#38bdf8;font-size:18px;';

    const modalImg = document.createElement('img');
    modalImg.style.cssText = 'width:100%;height:240px;object-fit:cover;border-radius:6px;border:1px solid #334155;';

    const modalDesc = document.createElement('p');
    modalDesc.style.cssText = 'margin:0;font-size:13px;color:#cbd5e1;line-height:1.4;';

    const modalBtns = document.createElement('div');
    modalBtns.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Kapat';
    closeBtn.style.cssText = 'background:#334155;color:#f1f5f9;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;';
    closeBtn.addEventListener('click', () => {
      activeTask = null;
      modal.style.display = 'none';
    });

    const completeBtn = document.createElement('button');
    completeBtn.style.cssText = 'background:#22c55e;color:#0f172a;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:bold;';
    completeBtn.addEventListener('click', () => {
      if (!activeTask) return;
      activeTask.done = true;
      activeTask.applyReward();
      activeTask = null;
      modal.style.display = 'none';
      refreshUI();
    });

    modalBtns.append(closeBtn, completeBtn);
    modalCard.append(modalTitle, modalImg, modalDesc, modalBtns);
    modal.append(modalCard);

    function openTask(task) {
      targetX = task.xRatio;
      activeTask = task;
      modalTitle.textContent = ` ()`;
      modalImg.src = imgs[task.screenKey].src;
      modalDesc.textContent = ` [Kazanç: ]`;
      completeBtn.textContent = task.done ? '✓ Tamamlandı' : task.actionLabel;
      completeBtn.disabled = task.done;
      modal.style.display = 'flex';
    }

    function refreshUI() {
      const doneCount = tasks.filter(t => t.done).length;
      statusText.textContent = `MARS YOLCULUĞU • Görevler: /`;
      taskButtonsWrap.innerHTML = '';

      tasks.forEach(task => {
        const b = document.createElement('button');
        b.textContent = ` `;
        b.style.cssText = `padding:6px 10px;border-radius:5px;border:1px solid ;background:;color:#f1f5f9;cursor:pointer;font-size:12px;`;
        b.addEventListener('click', () => openTask(task));
        taskButtonsWrap.append(b);
      });

      if (doneCount === tasks.length) {
        landBtn.disabled = false;
        landBtn.style.opacity = '1';
      }
    }

    topBar.append(statusText, taskButtonsWrap, landBtn);
    overlay.append(topBar, modal);
    ui.append(overlay);
    refreshUI();

    // Canvas tiklamasi ile istasyona yurume & acma
    const onCanvasClick = (e) => {
      if (activeTask) return;
      const rect = canvas.getBoundingClientRect();
      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;

      const hit = tasks.find(t => Math.abs(rx - t.xRatio) < 0.08 && Math.abs(ry - t.yRatio) < 0.22);
      if (hit) {
        openTask(hit);
      } else {
        targetX = Math.max(0.16, Math.min(0.84, rx));
      }
    };
    canvas.addEventListener('click', onCanvasClick);

    // Render Dongusu
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      c2d.clearRect(0, 0, w, h);

      if (imgs.interior.complete && imgs.interior.naturalWidth > 0) {
        c2d.drawImage(imgs.interior, 0, 0, w, h);
      }

      // Gorev isaretcileri (! / ✓)
      tasks.forEach(task => {
        const px = w * task.xRatio;
        const py = h * (task.yRatio - 0.16);
        c2d.fillStyle = task.done ? '#22c55e' : '#facc15';
        c2d.beginPath();
        c2d.arc(px, py, 14, 0, Math.PI * 2);
        c2d.fill();
        c2d.fillStyle = '#0f172a';
        c2d.font = 'bold 15px monospace';
        c2d.textAlign = 'center';
        c2d.fillText(task.done ? '✓' : '!', px, py + 5);
      });

      // Murettebat hareketi ve cizimi
      crewX += (targetX - crewX) * 0.08;
      if (imgs.crew.complete && imgs.crew.naturalWidth > 0) {
        const spriteH = h * 0.22;
        const spriteW = spriteH * (imgs.crew.naturalWidth / imgs.crew.naturalHeight);
        c2d.drawImage(imgs.crew, w * crewX - spriteW / 2, h * 0.76 - spriteH, spriteW, spriteH);
      }

      rafId = requestAnimationFrame(render);
    };
    render();

    this._cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('click', onCanvasClick);
      overlay.remove();
    };
  },

  exit() {
    if (this._cleanup) this._cleanup();
  }
};
