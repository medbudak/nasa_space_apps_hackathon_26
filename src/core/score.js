/**
 * SOL 14: RED HORIZON — Görev Başarı Puanı (GBP) ve Neden-Sonuç Karnesi (M5) (K1)
 * GBP = Adli (downlink) + Deney (downlink) + Hayatta kalma + Kütle marjı bonusu − Sistem kaybı cezası
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const Score = {};

  Score.ufoDownloadPct = function (s) {
    const u = D().ufo;
    if (!S.Sim.has(s, 'mastcam_z')) return u.lowResPct;
    return s.design.commArchitecture === 'relay_xband' ? u.highResPct : u.highResRelayOnlyPct;
  };

  /**
   * D-012 — "Rapor" = Dünya'ya ulaşan her bulgu raporu: enkaz teşhisleri + buz kalıntıları + mağara araştırması.
   * Kayıtlar { queued, sent, score } biçimindedir; başarı eşikleri bu toplamı sayar.
   */
  Score.reportRecords = function (s) {
    return Object.entries(s.forensics).concat(Object.entries((s.explore && s.explore.reports) || {}));
  };

  /** Haritada yapılabilecek rapor sayısı (aktif enkazlar + kalıntılar + mağara) */
  Score.reportsAvailable = function (s) {
    const ids = D().forensics.activeCaseIds;
    const wrecks = ids ? ids.length : D().forensics.cases.length;
    return wrecks + Object.keys((s.explore && s.explore.reports) || {}).length;
  };

  Score.calc = function (s) {
    const d = D();
    const sc = d.scoring;
    const obj = S.Engineering.findById(d.objectives, s.design.objectiveFocus);
    const thresholds = s.demoMode ? d.demoSuccess : obj;

    const sentF = Score.reportRecords(s).filter(([, r]) => r.sent);
    const sentE = Object.entries(s.experiments).filter(([, r]) => r.sent);
    const photos = s.downlink.queue.filter((p) => p.kind === 'photo' && p.status === 'arrived');

    const forensicsScore = Math.round(sentF.reduce((a, [, r]) => a + r.score, 0) * obj.forensicsMultiplier);
    const experimentsScore = Math.round(
      sentE.reduce((a, [, r]) => a + r.score, 0) * obj.experimentsMultiplier + photos.reduce((a, p) => a + p.points, 0)
    );
    const safeReturn = Boolean(s.ending && s.ending.fuelOk && !s.gameOver);
    const survivalScore = Math.max(0, s.sol) * sc.survivalPerSolPoints + (safeReturn ? sc.safeReturnBonusPoints : 0);
    const margin = s.totals ? s.totals.massMarginPct : 0;
    const marginBonus = margin >= sc.massMarginBonusThresholdPct ? sc.massMarginBonusPoints : 0;
    let lost = 0;
    if (s.greenhouse.frozen) lost++;
    if (s.res.batteryKwh < s.design.batteryKwh) lost++;
    const penalties = lost * sc.lostSystemPenaltyPoints;
    const crisisScore = s.decisionLog.filter((l) => l.category === 'crisis').reduce((a, l) => a + l.score, 0);
    const total = Math.max(0, forensicsScore + experimentsScore + survivalScore + marginBonus + crisisScore - penalties);

    let tier = 'PARTIAL';
    if (s.gameOver) tier = 'FAILED';
    else if (
      sentF.length >= thresholds.fullSuccess.forensicsSent &&
      sentE.length >= thresholds.fullSuccess.experimentsSent &&
      safeReturn
    ) tier = 'FULL_SUCCESS';
    else if (sentF.length >= thresholds.minSuccess.forensicsSent && sentE.length >= thresholds.minSuccess.experimentsSent) tier = 'MIN_SUCCESS';

    return {
      total,
      forensicsScore,
      experimentsScore,
      survivalScore,
      marginBonus,
      crisisScore,
      penalties,
      sentForensics: sentF.length,
      sentExperiments: sentE.length,
      totalForensics: Score.reportsAvailable(s),
      totalExperiments: d.experimentsCfg.experiments.length,
      safeReturn,
      tier,
      ufoPct: Score.ufoDownloadPct(s),
      localOnly: s.downlink.queue.filter((p) => p.status === 'queued' || p.status === 'sending').length,
      arrived: s.downlink.queue.filter((p) => p.status === 'arrived').length
    };
  };

  /**
   * M5 — Neden-sonuç zincirleri. Her eleman: { type: 'good'|'bad'|'warn', causeKey, effectKey, vars }
   */
  Score.chains = function (s) {
    const d = s.design;
    const chains = [];
    const insName = S.t('ins.' + d.insulation + '.name');
    const pwrName = S.t('pwr.' + d.powerSource + '.name');

    // 1. Enerji + yalıtım -> sera
    if (s.greenhouse.installed && s.greenhouse.frozen) {
      chains.push({
        type: 'bad',
        causeKey: 'chain.gh_lost.cause',
        effectKey: 'chain.gh_lost.effect_' + s.greenhouse.cause,
        vars: { kwh: d.batteryKwh, ins: insName, pwr: pwrName, sol: s.greenhouse.frozenSol, penalty: D().scoring.lostSystemPenaltyPoints }
      });
    } else if (d.powerSource === 'solar_rtg' && d.insulation === 'thick') {
      chains.push({ type: 'good', causeKey: 'chain.rtg_thick.cause', effectKey: 'chain.rtg_thick.effect', vars: {} });
    } else if (s.greenhouse.installed) {
      chains.push({ type: 'good', causeKey: 'chain.gh_ok.cause', effectKey: 'chain.gh_ok.effect', vars: { kwh: d.batteryKwh, ins: insName } });
    }

    // 2. Kamera + iletişim -> veri ve UFO
    const ufo = Score.ufoDownloadPct(s);
    if (S.Sim.has(s, 'mastcam_z') && d.commArchitecture === 'relay_xband') {
      chains.push({ type: 'good', causeKey: 'chain.cam_xband.cause', effectKey: 'chain.cam_xband.effect', vars: { pct: ufo } });
    } else if (!S.Sim.has(s, 'mastcam_z')) {
      chains.push({ type: 'bad', causeKey: 'chain.no_cam.cause', effectKey: 'chain.no_cam.effect', vars: { pct: ufo } });
    } else {
      chains.push({ type: 'warn', causeKey: 'chain.uhf_only.cause', effectKey: 'chain.uhf_only.effect', vars: { pct: ufo } });
    }

    // 3. Kütle marjı
    if (s.totals) {
      const good = s.totals.massMarginPct >= D().scoring.massMarginBonusThresholdPct;
      chains.push({
        type: good ? 'good' : 'warn',
        causeKey: 'chain.margin.cause',
        effectKey: good ? 'chain.margin.effect_good' : 'chain.margin.effect_low',
        vars: { pct: s.totals.massMarginPct, bonus: D().scoring.massMarginBonusPoints }
      });
    }

    // 4. MAV yakıtı
    if (s.ending) {
      chains.push({
        type: s.ending.fuelOk ? 'good' : 'bad',
        causeKey: 'chain.fuel.cause',
        effectKey: s.ending.fuelOk ? 'chain.fuel.effect_ok' : 'chain.fuel.effect_low',
        vars: { fuel: Math.round(s.res.mavFuel) }
      });
    }

    // 5. Gönderilmeyen veri (M1)
    const unsent = s.downlink.queue.filter((p) => p.status === 'queued' || p.status === 'sending').length;
    if (unsent > 0) chains.push({ type: 'warn', causeKey: 'chain.unsent.cause', effectKey: 'chain.unsent.effect', vars: { n: unsent } });

    return chains;
  };

  /** Karar günlüğü satırlarını çevrilmiş metne dönüştürür */
  Score.formatLog = function (entry) {
    const v = entry.vars || {};
    return {
      sol: entry.sol,
      category: entry.category,
      title: S.t(entry.titleKey, v),
      choice: entry.choiceKey ? S.t(entry.choiceKey, v) : '',
      result: entry.resultKey ? S.t(entry.resultKey, v) : '',
      score: entry.score
    };
  };

  S.Score = Score;
})((window.SOL14 = window.SOL14 || {}));
