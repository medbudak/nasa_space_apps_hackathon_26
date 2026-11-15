(function (S) {
  'use strict';

  const SEEN_KEY = 'sol14_tutorial_seen_v1';

  const TABS = {
    tr: [
      {
        title: '01 · Kontroller',
        html:
          '<div class="help-keys">' +
          '<div><kbd>A / D · ← →</kbd><span>Yürü (mekik içi ve Mars yüzeyi)</span></div>' +
          '<div><kbd>W · Space · ↑</kbd><span>Zıpla (0.38g: Dünya\'dakinin ~2.6× yüksekliği)</span></div>' +
          '<div><kbd>E</kbd><span>Etkileşim / incele / istasyon aç</span></div>' +
          '<div><kbd>L</kbd><span>Downlink veri gönderim kuyruğu</span></div>' +
          '<div><kbd>P</kbd><span>Güç yük önceliklendirme paneli</span></div>' +
          '<div><kbd>J</kbd><span>Karar günlüğü</span></div>' +
          '</div>' +
          '<div class="help-loop">' +
          '<div><b>1</b><span><b>TASARLA (Sol 0):</b> Roket, yörünge, iniş bölgesi ve en fazla 5 bilimsel aleti bütçe/kütle sınırında seç.</span></div>' +
          '<div><b>2</b><span><b>YÖNET (Sol 1–14):</b> Enkazları incele, deney yap, krizlere karar ver ve veriyi Dünya\'ya gönder.</span></div>' +
          '<div><b>3</b><span><b>DEĞERLENDİR:</b> Neden-Sonuç Karnesi her kararının görevi nasıl etkilediğini gösterir.</span></div>' +
          '</div>' +
          '<p class="pv-desc"><b>Dönüşsüzlük Noktası:</b> O₂ çubuğundaki kırmızı çentik, habitata dönmek için gereken minimum oksijendir. Eklemlerin donarsa hızın %40\'a düşer ve çentik ileri sıçrar.</p>'
      },
      {
        title: '02 · Roket & Aletler',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr 1fr;">' +
          '<div><b>🚀</b><span><b>Roket & Yörünge:</b> Büyük roket daha fazla kütle (alet/batarya) taşır. Hızlı transfer (~6 ay) radyasyon dozunu düşürür ama ek yakıt/kütle bedeli vardır.</span></div>' +
          '<div><b>🌍</b><span><b>İniş Bölgesi:</b> Meridiani sıcak ve güneşli; Jezero dengeli; Arcadia bol su buzlu ama dondurucu gecelere sahiptir.</span></div>' +
          '</div>' +
          '<div class="help-keys" style="margin-top:8px;">' +
          '<div><kbd>Mastcam-Z</kbd><span>Net fotoğraf ve final karesi (yoksa bulanık).</span></div>' +
          '<div><kbd>MEDA / SEIS / RAD</kbd><span>Toz fırtınası, Mars depremi ve güneş patlaması erken uyarısı.</span></div>' +
          '<div><kbd>RIMFAX</kbd><span>Yer altı su buzu yatağını bulur; kazarak su elde edersin.</span></div>' +
          '<div><kbd>MOXIE / Veggie</kbd><span>CO₂\'den O₂ üretir; Veggie sera kurar ve morali korur.</span></div>' +
          '</div>'
      },
      {
        title: '03 · Yakıt, Buz & Sera',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr;">' +
          '<div><b>⚗️</b><span><b>Mekik Yakıt Sentezi (ISRU · Sabatier):</b> MAV\'ın yanındaki ISRU ünitesinde atmosferdeki <b>CO₂</b> ile sudan elde edilen <b>H₂</b> birleştirilir: <code>CO₂ + 4H₂ → CH₄ + 2H₂O</code>. Her parti enerji ve su harcar, MAV dönüş yakıtını artırır.</span></div>' +
          '<div><b>❄️</b><span><b>Buz Erimesi & Su:</b> RIMFAX radarıyla tespit edilen buz yatağını kazıp eriterek su stoğunu yenilersin; hem yaşam desteği hem yakıt sentezi için kritik kaynaktır.</span></div>' +
          '<div><b>🌱</b><span><b>Sera (Veggie):</b> Sıcaklık ve güç kesilmezse bitkiler büyür, mürettebat moralini yükseltir. Gece ısıtma kesilirse sera donar!</span></div>' +
          '</div>'
      },
      {
        title: '04 · Enkaz & Bütçe',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr;">' +
          '<div><b>🛰️</b><span><b>Enkaz Parçası Toplama (Salvage):</b> Yüzeydeki tarihi araçlardan (Opportunity, InSight, Spirit, Phoenix, Beagle 2) kanıt toplayıp teşhis koyduktan sonra <b>Parça Sök</b> ile RHU ısıtıcı, sismometre ve yedek anten kazanırsın.</span></div>' +
          '<div><b>📡</b><span><b>Downlink & Bütçe Yansıması:</b> Toplanan raporlar ve fotoğraflar yerel kalırsa puan sayılmaz. <b>L</b> panelinden röle geçişi açıkken Dünya\'ya gönderilen her veri hem görev başarısını hem de bütçe/fon puanını artırır.</span></div>' +
          '<div><b>🏁</b><span><b>Güvenli Dönüş:</b> Son Sol\'de MAV yakıtını %100\'e tamamlayıp rampadan kalkış yap.</span></div>' +
          '</div>'
      }
    ],
    en: [
      {
        title: '01 · Controls',
        html:
          '<div class="help-keys">' +
          '<div><kbd>A / D · ← →</kbd><span>Walk (shuttle interior & Mars surface)</span></div>' +
          '<div><kbd>W · Space · ↑</kbd><span>Jump (0.38g: ~2.6× higher than Earth)</span></div>' +
          '<div><kbd>E</kbd><span>Interact / inspect / open station</span></div>' +
          '<div><kbd>L</kbd><span>Downlink transmission queue</span></div>' +
          '<div><kbd>P</kbd><span>Power load priority panel</span></div>' +
          '<div><kbd>J</kbd><span>Decision log</span></div>' +
          '</div>' +
          '<div class="help-loop">' +
          '<div><b>1</b><span><b>DESIGN (Sol 0):</b> Choose rocket, trajectory, landing site and up to 5 instruments within mass/budget limits.</span></div>' +
          '<div><b>2</b><span><b>OPERATE (Sols 1–14):</b> Investigate wrecks, run experiments, resolve crises and transmit data to Earth.</span></div>' +
          '<div><b>3</b><span><b>EVALUATE:</b> The Cause-and-Effect Report Card shows how every decision shaped your mission.</span></div>' +
          '</div>' +
          '<p class="pv-desc"><b>Point of No Return:</b> The red notch on the O₂ bar shows the oxygen needed to return. If joints freeze, speed drops to 40% and the notch jumps ahead.</p>'
      },
      {
        title: '02 · Rocket & Tools',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr 1fr;">' +
          '<div><b>🚀</b><span><b>Rocket & Orbit:</b> Heavier rockets carry more payload mass. Fast transfer (~6 mo) lowers radiation dose at the cost of mass and budget.</span></div>' +
          '<div><b>🌍</b><span><b>Landing Site:</b> Meridiani is warm and sunny; Jezero is balanced; Arcadia has rich water ice but freezing nights.</span></div>' +
          '</div>' +
          '<div class="help-keys" style="margin-top:8px;">' +
          '<div><kbd>Mastcam-Z</kbd><span>Sharp wreck photos and final frame (blurry without it).</span></div>' +
          '<div><kbd>MEDA / SEIS / RAD</kbd><span>Early warnings for dust storms, marsquakes, and solar flares.</span></div>' +
          '<div><kbd>RIMFAX</kbd><span>Maps underground water-ice deposits you can dig and melt.</span></div>' +
          '<div><kbd>MOXIE / Veggie</kbd><span>Produces O₂ from CO₂; Veggie runs the greenhouse and boosts morale.</span></div>' +
          '</div>'
      },
      {
        title: '03 · Fuel, Ice & Farm',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr;">' +
          '<div><b>⚗️</b><span><b>MAV Fuel Synthesis (ISRU · Sabatier):</b> Combines atmospheric <b>CO₂</b> with <b>H₂</b> from water: <code>CO₂ + 4H₂ → CH₄ + 2H₂O</code>. Uses power and water to generate return propellant.</span></div>' +
          '<div><b>❄️</b><span><b>Melting Ice for Water:</b> Use RIMFAX to locate subsurface ice, dig and melt it to replenish water for crew and fuel synthesis.</span></div>' +
          '<div><b>🌱</b><span><b>Greenhouse (Veggie):</b> Keeps plants growing and boosts crew morale—keep heating powered at night so it never freezes.</span></div>' +
          '</div>'
      },
      {
        title: '04 · Salvage & Score',
        html:
          '<div class="help-loop" style="grid-template-columns:1fr;">' +
          '<div><b>🛰️</b><span><b>Wreck Salvage:</b> After diagnosing lost spacecraft (Opportunity, InSight, Spirit, Phoenix, Beagle 2), salvage RHU heaters, sensors, and antennas.</span></div>' +
          '<div><b>📡</b><span><b>Downlink & Budget Impact:</b> Unsent data scores nothing. Queue reports and photos in <b>L</b> during orbiter passes to earn mission budget and score.</span></div>' +
          '<div><b>🏁</b><span><b>Safe Return:</b> Top MAV fuel up to 100% by the final sol and launch from the pad.</span></div>' +
          '</div>'
      }
    ]
  };

  function openInteractiveTutorial(startStep) {
    if (!S.UI || !S.UI.openModal) return;
    let step = startStep || 0;
    const lang = S.lang === 'en' ? 'en' : 'tr';
    const tabs = TABS[lang];

    const renderHtml = () => {
      const nav = tabs
        .map(
          (tb, i) =>
            '<button type="button" class="btn btn-sm ' + (i === step ? 'btn-primary' : 'btn-ghost') + '" data-tut-tab="' + i + '">' +
            tb.title +
            '</button>'
        )
        .join('');

      return (
        '<div class="panel action-modal help-modal" style="max-width:44em;">' +
        '<div class="modal-head"><h3>' + S.UI.icon('doc') + (lang === 'en' ? 'MISSION TRAINING & GUIDE' : 'GÖREV EĞİTİMİ & NASIL OYNANIR') + '</h3>' +
        '<button class="icon-btn" data-close>' + S.UI.icon('x') + '</button></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' + nav + '</div>' +
        '<div class="tut-body">' + tabs[step].html + '</div>' +
        '<div class="modal-actions" style="justify-content:space-between;margin-top:14px;">' +
        '<button type="button" class="btn btn-ghost" data-tut-prev ' + (step === 0 ? 'disabled' : '') + '>' + (lang === 'en' ? '← Previous' : '← Geri') + '</button>' +
        '<span style="opacity:0.7;font-size:0.85em;">' + (step + 1) + ' / ' + tabs.length + '</span>' +
        (step < tabs.length - 1
          ? '<button type="button" class="btn btn-primary" data-tut-next>' + (lang === 'en' ? 'Next →' : 'İleri →') + '</button>'
          : '<button type="button" class="btn btn-primary" data-close>' + (lang === 'en' ? 'Start Mission' : 'Anladım, Başla') + '</button>') +
        '</div></div>'
      );
    };

    const mount = (box) => {
      box.querySelectorAll('[data-tut-tab]').forEach((b) =>
        b.addEventListener('click', () => {
          step = Number(b.dataset.tutTab);
          S.UI.updateModal('help', renderHtml(), mount);
        })
      );
      const prev = box.querySelector('[data-tut-prev]');
      if (prev)
        prev.addEventListener('click', () => {
          if (step > 0) {
            step--;
            S.UI.updateModal('help', renderHtml(), mount);
          }
        });
      const next = box.querySelector('[data-tut-next]');
      if (next)
        next.addEventListener('click', () => {
          if (step < tabs.length - 1) {
            step++;
            S.UI.updateModal('help', renderHtml(), mount);
          }
        });
    };

    S.UI.openModal('help', renderHtml(), { onMount: mount });
  }

  // Mevcut "Nasıl Oynanır" butonunu bu 4 sekmeli egitime bagla
  function hookHelp() {
    if (S.DesignScreens && S.DesignScreens.openHelp) {
      S.DesignScreens.openHelp = () => openInteractiveTutorial(0);
    }
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        localStorage.setItem(SEEN_KEY, '1');
        setTimeout(() => {
          if (S.Game && S.Game.scene === 'menu') openInteractiveTutorial(0);
        }, 500);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(hookHelp, 200));
  else setTimeout(hookHelp, 200);
})((window.SOL14 = window.SOL14 || {}));
