// src/systems/forensics.js
import { gameState, logDecision } from '../core/state.js';

export const WRECK_CASES = {
  opportunity: {
    id: 'opportunity',
    correctCategories: ['power_dust'],
    salvagePart: '8x_RHU',
    lessonKey: 'lesson.opportunity.storm_load_shed',
    isHidden: false
  },
  spirit: {
    id: 'spirit',
    correctCategories: ['mechanical', 'thermal'],
    salvagePart: '8x_RHU_wheels',
    lessonKey: 'lesson.spirit.winter_tilt',
    isHidden: false
  },
  phoenix: {
    id: 'phoenix',
    correctCategories: ['thermal'],
    salvagePart: 'robotic_arm',
    lessonKey: 'lesson.phoenix.frost_clean',
    isHidden: false
  },
  insight: {
    id: 'insight',
    correctCategories: ['power_dust'],
    salvagePart: 'SEIS_seismometer',
    lessonKey: 'lesson.insight.dust_clean',
    isHidden: false
  },
  beagle2: {
    id: 'beagle2',
    correctCategories: ['comms', 'mechanical'],
    salvagePart: 'high_gain_antenna',
    lessonKey: 'lesson.beagle2.redundant_antenna',
    isHidden: true
  }
};

export function initForensicsState() {
  if (!gameState.forensics) {
    gameState.forensics = {};
    for (const id of Object.keys(WRECK_CASES)) {
      gameState.forensics[id] = {
        found: false,
        evidence: { photo: null, blackbox: false, env: false },
        diagnosis: null,
        sent: false,
        salvaged: false
      };
    }
  }
}

export function discoverWreck(wreckId) {
  initForensicsState();
  const wreck = gameState.forensics[wreckId];
  if (!wreck) return false;
  wreck.found = true;
  return true;
}

export function collectEvidence(wreckId, evidenceType) {
  initForensicsState();
  const wreck = gameState.forensics[wreckId];
  if (!wreck || !wreck.found) return { ok: false, reason: 'not_found' };

  const instruments = gameState.design.selectedInstruments || [];

  if (evidenceType === 'photo') {
    wreck.evidence.photo = instruments.includes('mastcam') ? 'hd' : 'hand';
  } else if (evidenceType === 'blackbox') {
    wreck.evidence.blackbox = true;
  } else if (evidenceType === 'env') {
    if (!instruments.includes('supercam')) {
      return { ok: false, reason: 'missing_spectrometer' };
    }
    wreck.evidence.env = true;
  }
  return { ok: true, evidence: wreck.evidence };
}

export function submitDiagnosisToQueue(wreckId, chosenCategory) {
  initForensicsState();
  const wreck = gameState.forensics[wreckId];
  const spec = WRECK_CASES[wreckId];
  if (!wreck || !spec || !wreck.found) return { ok: false };

  wreck.diagnosis = chosenCategory;

  const hasPhoto = wreck.evidence.photo !== null;
  const evidenceCount = [hasPhoto, wreck.evidence.blackbox, wreck.evidence.env].filter(Boolean).length;
  const isCorrect = spec.correctCategories.includes(chosenCategory);

  let points = 0;
  if (isCorrect && evidenceCount === 3) {
    points = wreck.evidence.photo === 'hd' ? 100 : 85;
  } else if (!isCorrect && evidenceCount === 3) {
    points = 50;
  } else if (evidenceCount > 0) {
    points = 20;
  }

  const packet = {
    type: 'forensics',
    id: `forensics_${wreckId}`,
    wreckId,
    mbit: 12,
    points,
    isCorrect
  };
  gameState.resources.downlinkQueue.push(packet);

  logDecision(
    gameState.sol,
    `forensics:${wreckId}`,
    chosenCategory,
    isCorrect ? `Doğru teşhis (+${points} puan)` : `Yanlış teşhis (+${points} puan)`
  );

  return { ok: true, packet };
}

export function onForensicsDownlinkComplete(wreckId) {
  initForensicsState();
  const wreck = gameState.forensics[wreckId];
  const spec = WRECK_CASES[wreckId];
  if (!wreck || !spec || wreck.sent) return;

  wreck.sent = true;
  wreck.salvaged = true;

  if (wreckId === 'insight' && !gameState.design.selectedInstruments.includes('seis')) {
    gameState.design.selectedInstruments.push('seis');
  }
}