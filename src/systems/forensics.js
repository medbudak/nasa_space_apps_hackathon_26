/**
 * SOL 14: RED HORIZON — Ana Görev 1: Kayıp Araçların Adli İncelemesi (K6)
 * Döngü: Bul (yürü / Ingenuity) -> 3 kanıt (foto, kara kutu, çevre) -> 5 kategoriden teşhis
 *        -> Downlink kuyruğu (M1) -> NASA bulgu kartı + ders -> parça sök.
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const F = {};

  F.cases = () => D().forensics.cases;
  F.get = (id) => F.cases().find((c) => c.id === id);

  /** Haritada/ekranda tanımlı mı? (Ingenuity hepsini gösterir; yoksa yaklaşınca tanınır) */
  F.identified = function (s, c) {
    const rec = s.forensics[c.id];
    if (rec.discovered) return true;
    if (S.Sim.has(s, 'ingenuity') && D().terrain.droneRevealAllWrecks) return true;
    return false;
  };

  /** Oyuncu konumuna göre yakındaki enkaz (etkileşim mesafesi içinde) */
  F.nearby = function (s) {
    const range = D().gameplay.wreckInteractRangeM;
    let best = null;
    for (const c of F.cases()) {
      const d = Math.abs(s.player.x - c.distanceM);
      if (d <= range && (!best || d < best.d)) best = { c, d };
    }
    return best ? best.c : null;
  };

  /** Yürüyerek yaklaşınca keşif (sinyal izi -> tanımlı enkaz) */
  F.updateDiscovery = function (s) {
    const vis = D().terrain.wreckVisibleWithoutDroneM;
    for (const c of F.cases()) {
      const rec = s.forensics[c.id];
      if (!rec.discovered && Math.abs(s.player.x - c.distanceM) <= vis) {
        rec.discovered = true;
        S.bus.emit('forensics:discovered', { id: c.id });
      }
    }
  };

  F.evidenceCount = (rec) => ['photo', 'telemetry', 'env'].filter((k) => rec.evidence[k] !== null).length;

  F.evidenceCfg = (type) => D().forensics.evidenceTypes.find((e) => e.id === type);

  /** Kanıt kalitesi: mini-oyun skoru × alet çarpanı (Mastcam-Z yoksa foto yarım puan) */
  F.collectEvidence = function (s, caseId, type, minigame) {
    const c = F.get(caseId);
    const rec = s.forensics[caseId];
    const cfg = F.evidenceCfg(type);
    if (!c || !rec || !cfg) return null;
    let quality = Math.max(0.3, minigame ? minigame.score : 1);
    if (cfg.instrumentBonus && !S.Sim.has(s, cfg.instrumentBonus)) {
      quality *= type === 'photo' ? D().scoring.handCameraPhotoFactor : 0.7;
    }
    rec.discovered = true;
    rec.evidence[type] = Math.round(quality * 100) / 100;
    S.Sim.advance(s, cfg.minutes);
    S.bus.emit('audio:play', 'scan');
    return { quality: rec.evidence[type], instrumentMissing: Boolean(cfg.instrumentBonus && !S.Sim.has(s, cfg.instrumentBonus)) };
  };

  /** Teşhis + rapor kuyruğa (M1). Puan: doğru = 100 × ort. kalite, yanlış+3 kanıt = 50, eksik = 20 */
  F.diagnose = function (s, caseId, category) {
    const c = F.get(caseId);
    const rec = s.forensics[caseId];
    const sc = D().scoring;
    const n = F.evidenceCount(rec);
    if (n < D().forensics.minEvidenceForDiagnosis) return { ok: false, errKey: 'forensics.err_need_evidence' };
    const correct = category === c.correctCategory || category === c.acceptedSecondary;
    const vals = ['photo', 'telemetry', 'env'].map((k) => rec.evidence[k]).filter((v) => v !== null);
    const avgQ = vals.reduce((a, b) => a + b, 0) / vals.length;
    let score;
    if (correct) score = Math.round(sc.forensicCorrectPoints * Math.max(0.5, avgQ) * (n === 3 ? 1 : 0.85));
    else if (n === 3) score = sc.forensicWrongWith3CluesPoints;
    else score = sc.forensicIncompleteCluesPoints;
    rec.diagnosis = category;
    rec.correct = correct;
    rec.score = score;
    rec.queued = true;
    S.Sim.advance(s, D().gameplay.actions.diagnoseMin);
    S.Sim.queuePacket(s, {
      kind: 'forensic',
      refId: caseId,
      titleKey: 'packet.forensic',
      vars: { name: c.name },
      sizeMbit: c.reportMbit,
      points: score
    });
    S.logDecision(
      {
        category: 'science',
        titleKey: 'log.forensic.title',
        choiceKey: correct ? 'log.forensic.correct' : 'log.forensic.wrong',
        resultKey: 'case.' + caseId + '.lesson',
        vars: { name: c.name, cat: S.t('cat.' + category) },
        score
      },
      s
    );
    S.bus.emit('audio:play', correct ? 'success' : 'fail');
    return { ok: true, correct, score };
  };

  /** Parça sök: RHU ısıtıcılar habitat ısısına eklenir, SEIS sensörü, yedek anten vb. */
  F.salvage = function (s, caseId) {
    const c = F.get(caseId);
    const rec = s.forensics[caseId];
    if (!c || !rec || rec.salvaged || !rec.diagnosis) return { ok: false };
    rec.salvaged = true;
    const r = c.salvage || {};
    if (r.rhuUnits) s.inventory.rhuUnits += r.rhuUnits;
    if (r.wheelPart) s.inventory.wheelPart = true;
    if (r.roboticArmPart) s.inventory.roboticArmPart = true;
    if (r.spareAntenna) {
      s.inventory.spareAntenna = true;
      s.downlink.extraMbit += 10;
    }
    if (r.seis && !S.Sim.has(s, 'seis')) {
      s.design.instruments.push('seis');
      s.inventory.seisSalvaged = true;
    }
    S.Sim.advance(s, D().gameplay.actions.salvageMin);
    S.bus.emit('audio:play', 'success');
    return { ok: true, rewardKey: 'salvage.' + caseId };
  };

  S.Forensics = F;
})((window.SOL14 = window.SOL14 || {}));
