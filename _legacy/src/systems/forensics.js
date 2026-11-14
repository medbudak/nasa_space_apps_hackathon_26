/**
 * SOL 14: RED HORIZON — Ana Görev 1: Kayıp Araçların Adli İncelemesi (K6)
 * Döngü: 1. Bul (EVA / Ingenuity Drone) -> 2. Kanıt Topla (Foto, Kara Kutu, Çevre) ->
 *        3. 5 Kategoriden Teşhis Koy -> 4. Downlink Kuyruğuna Gönder -> 5. Parça Sök & NASA Bulgusu
 */

import { NASA_DATA } from '../core/engineering.js';
import { getState, updateState, bus, logDecision, t } from '../core/state.js';

export const DIAGNOSIS_CATEGORIES = [
  { id: 'power_dust', labelKey: 'forensics.diag_power_dust' },
  { id: 'thermal', labelKey: 'forensics.diag_thermal' },
  { id: 'mechanical', labelKey: 'forensics.diag_mechanical' },
  { id: 'software', labelKey: 'forensics.diag_software' },
  { id: 'comms', labelKey: 'forensics.diag_comms' }
];

/**
 * 1. Enkazı Haritada Keşfet (Ingenuity Drone ile O2 harcamadan veya EVA Yürüyüşü ile)
 */
export function discoverWreck(caseId, mode = 'eva') {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;

    if (mode === 'drone' && s.design.instruments.includes('ingenuity')) {
      s.resources.energyKwh = Math.max(0, Math.round((s.resources.energyKwh - 2) * 10) / 10);
      rec.discovered = true;
    } else {
      const o2Cost = Math.round((caseCfg.distanceMeters / 100) * 1.8);
      s.resources.o2 = Math.max(2, s.resources.o2 - o2Cost);
      s.resources.evaDistanceM = caseCfg.distanceMeters;
      rec.discovered = true;
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true };
}

/**
 * 2. Kanıt Topla (photo | telemetry | env)
 */
export function collectForensicEvidence(caseId, evidenceType, minigameScore = 1.0) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;
    rec.discovered = true;
    rec.evidence[evidenceType] = true;

    if (evidenceType === 'photo') {
      s.resources.o2 = Math.max(2, s.resources.o2 - 3);
    } else if (evidenceType === 'telemetry') {
      s.resources.energyKwh = Math.max(1, Math.round((s.resources.energyKwh - 1.5) * 10) / 10);
    } else if (evidenceType === 'env') {
      s.resources.o2 = Math.max(2, s.resources.o2 - 2);
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true, minigameScore };
}

/**
 * 3 & 4. Arıza Kategorisini Teşhis Et ve Raporu Downlink Kuyruğuna (M1) Ekle
 * Puanlama: Doğru teşhis = 100, Yanlış ama 3 kanıt = 50, Kanıt eksik = 20, Gönderilmemiş = 0
 */
export function submitForensicDiagnosis(caseId, selectedCategory) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  let calculatedScore = 0;
  let isCorrect = false;

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;

    rec.diagnosis = selectedCategory;
    const evCount =
      (rec.evidence.photo ? 1 : 0) +
      (rec.evidence.telemetry ? 1 : 0) +
      (rec.evidence.env ? 1 : 0);

    isCorrect =
      selectedCategory === caseCfg.correctCategory ||
      selectedCategory === caseCfg.acceptedSecondary;

    const camFactor = s.design.instruments.includes('mastcam_z') ? 1.0 : 0.75;

    if (isCorrect && evCount >= 2) {
      calculatedScore = Math.round(NASA_DATA.scoring.forensicCorrectPoints * camFactor);
    } else if (evCount === 3) {
      calculatedScore = NASA_DATA.scoring.forensicWrongWith3CluesPoints;
    } else {
      calculatedScore = NASA_DATA.scoring.forensicIncompleteCluesPoints;
    }

    rec.score = calculatedScore;
    rec.queued = true;

    const pktId = `forensic_${caseId}`;
    const existing = s.downlinkQueue.find((p) => p.id === pktId);
    if (!existing) {
      s.downlinkQueue.push({
        id: pktId,
        type: 'forensic',
        refId: caseId,
        title: `Adli Rapor: ${caseCfg.name} (${selectedCategory.toUpperCase()})`,
        sizeMbit: caseCfg.reportDataMbit,
        points: calculatedScore,
        sent: false
      });
    } else {
      existing.points = calculatedScore;
    }

    logDecision({
      sol: s.sol,
      category: 'science',
      title: `Adli İnceleme: ${caseCfg.name}`,
      choice: isCorrect ? `Doğru Teşhis (${selectedCategory})` : `Kısmi Teşhis (${selectedCategory})`,
      costText: `${caseCfg.reportDataMbit} Mbit Downlink`,
      consequence: t(`case.${caseId}.lesson`),
      scoreImpact: calculatedScore
    });
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true, isCorrect, score: calculatedScore };
}

/**
 * 5. Enkazdan Parça Sök (RHU Isıtıcı, SEIS, Yedek Anten, Robot Kol)
 */
export function salvageWreckPart(caseId) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec || rec.salvaged) return;
    rec.salvaged = true;

    const rw = caseCfg.salvageReward;
    if (rw.rhuUnits) {
      s.inventory.rhuUnits += rw.rhuUnits;
      s.resources.suitTempC = Math.min(22, s.resources.suitTempC + 6);
    }
    if (rw.seisUnlocked && !s.design.instruments.includes('seis')) {
      s.design.instruments.push('seis');
    }
    if (rw.spareAntenna) {
      s.inventory.spareAntenna = true;
    }
    if (rw.roboticArmPart) {
      s.inventory.roboticArmPart = true;
    }
    if (rw.wheelPart) {
      s.inventory.wheelPart = true;
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true };
}
