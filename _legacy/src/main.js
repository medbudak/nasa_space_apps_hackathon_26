/**
 * SOL 14: RED HORIZON — Ana Uygulama Başlatıcı, Ekran Yönlendirici ve ?demo Modu (K1)
 */

import {
  getState,
  updateState,
  resetState,
  setLanguage,
  loadStateFromStorage,
  bus,
  t
} from './core/state.js';
import { launchMissionFromDesign, advanceSol, performEvaStep } from './core/sim.js';
import { pickAndTriggerSolEvent } from './core/events.js';
import { preloadAllSprites } from './fx/sprites.js';
import {
  initSurfaceFx,
  stopSurfaceCanvasLoop,
  triggerAstronautJump,
  triggerAstronautMove
} from './fx/effects.js';
import { initAudioBus, toggleMute, isMuted } from './fx/audio.js';
import { renderDesignScreen } from './ui/design_screens.js';
import { renderSurfaceHud } from './ui/hud.js';
import { renderDecisionCardModal } from './ui/decision_card.js';
import { renderUfoStingerScreen, renderReportCardScreen } from './ui/report_card.js';

function renderApp() {
  const state = getState();
  const root = document.getElementById('app-root');
  if (!root) return;

  // Üst bar başlıklarını dile göre güncelle
  const subEl = document.getElementById('nav-subtitle');
  if (subEl) subEl.textContent = t('app.subtitle');

  if (state.phase === 'design') {
    stopSurfaceCanvasLoop();
    renderDesignScreen(root);
  } else if (state.phase === 'surface') {
    renderSurfaceHud(root);
  } else if (state.phase === 'ufo') {
    stopSurfaceCanvasLoop();
    renderUfoStingerScreen(root);
  } else if (state.phase === 'report') {
    stopSurfaceCanvasLoop();
    renderReportCardScreen(root);
  }

  renderDecisionCardModal();
}

function setupTopBarActions() {
  document.getElementById('btn-nav-sol0')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    resetState({ lang: getState().lang, demoMode: false });
  });

  document.getElementById('btn-nav-demo')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    resetState({ lang: getState().lang, demoMode: true });
    launchMissionFromDesign();
  });

  document.getElementById('btn-nav-ufo')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    updateState((s) => {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
    });
  });

  document.getElementById('btn-nav-report')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    updateState((s) => {
      s.phase = 'report';
    });
  });

  document.getElementById('btn-nav-lang')?.addEventListener('click', () => {
    const nextLang = getState().lang === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
  });

  const muteBtn = document.getElementById('btn-nav-mute');
  muteBtn?.addEventListener('click', () => {
    const m = toggleMute();
    muteBtn.textContent = m ? '🔇 Ses Kapalı' : '🔊 Ses Açık';
  });
}

function setupKeyboardControls() {
  window.addEventListener('keydown', (e) => {
    const state = getState();
    if (state.phase !== 'surface' || state.activeTab !== 'surface' || state.activeCrisis) {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      triggerAstronautJump();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      triggerAstronautMove(1);
      performEvaStep(100);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      triggerAstronautMove(-1);
      performEvaStep(-100);
    }
  });
}

// TESTING.md kapsamında geliştirici ve jüri hızlı test konsolu
if (typeof window !== 'undefined') {
  window.SOL14_DEBUG = {
    getState,
    nextSol: () => advanceSol(),
    triggerCrisis: (id) => pickAndTriggerSolEvent(id),
    playUfoEnding: () =>
      updateState((s) => {
        s.phase = 'ufo';
      }),
    showReport: () =>
      updateState((s) => {
        s.phase = 'report';
      })
  };
}

function bootApp() {
  initAudioBus();
  initSurfaceFx();
  preloadAllSprites();

  const params = new URLSearchParams(window.location.search);
  const isDemo = params.get('demo') === '1' || params.get('demo') === 'true';
  const urlLang = params.get('lang');

  const loaded = loadStateFromStorage();
  if (urlLang === 'en' || urlLang === 'tr') {
    setLanguage(urlLang);
  }

  if (isDemo) {
    resetState({ lang: getState().lang, demoMode: true });
    launchMissionFromDesign();
  } else if (!loaded) {
    resetState({ lang: urlLang || 'tr', demoMode: false });
  }

  bus.on('state:changed', () => renderApp());
  setupTopBarActions();
  setupKeyboardControls();
  renderApp();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
