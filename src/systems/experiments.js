/**
 * SOL 14: RED HORIZON — Ana Görev 2: 0.38g Laboratuvarı, 6 Bilimsel Deney (K6)
 * Döngü: Hipotez -> Ortam (habitat / yüzey) -> Kontrol grubu (+%50) -> Mini-oyun ölçümü
 *        -> Sonuç kartı + hayatta kalma ödülü -> Downlink (M1)
 */
(function (S) {
  'use strict';
  const D = () => S.DATA;
  const X = {};

  X.list = () => D().experimentsCfg.experiments.slice().sort((a, b) => a.order - b.order);
  X.get = (id) => D().experimentsCfg.experiments.find((e) => e.id === id);

  /** null = çalıştırılabilir; aksi halde engel anahtarı. 'warn' = düşük verimle çalışır */
  X.availability = function (s, id) {
    const e = X.get(id);
    if (!e.requiredInstrument || S.Sim.has(s, e.requiredInstrument)) return { ok: true };
    if (id === 'moxie_night' || id === 'sound_speed') return { ok: false, reasonKey: 'exp.blocked_' + e.requiredInstrument };
    return { ok: true, warnKey: 'exp.warn_missing', instrument: e.requiredInstrument };
  };

  X.cost = function (e, control) {
    const cfg = D().experimentsCfg;
    return {
      minutes: e.minutes + (control ? cfg.controlGroupExtraMinutes : 0),
      kwh: e.energyKwh + (control ? cfg.controlGroupExtraKwh : 0)
    };
  };

  /**
   * Deneyi çalıştırır. setup: { hypothesis, env, control }, minigame: { success, score }
   */
  X.run = function (s, id, setup, minigame) {
    const e = X.get(id);
    const av = X.availability(s, id);
    if (!av.ok) return { ok: false, errKey: av.reasonKey };
    const rec = s.experiments[id];
    const cost = X.cost(e, setup.control);
    if (s.res.energyKwh < cost.kwh) return { ok: false, errKey: 'action.err_no_energy' };

    s.res.energyKwh = Math.max(0, s.res.energyKwh - cost.kwh);
    S.Sim.advance(s, cost.minutes);

    const hypOk = setup.hypothesis === e.correctHypothesis;
    const envOk = setup.env === e.preferredEnv;
    const instOk = !e.requiredInstrument || S.Sim.has(s, e.requiredInstrument);
    const mgScore = minigame ? Math.max(0.5, minigame.score) : 1;
    let factor = (hypOk ? 1 : 0.45) * (envOk ? 1 : 0.75) * (instOk ? 1 : 0.5) * mgScore;
    if (e.bonusInstrument && S.Sim.has(s, e.bonusInstrument)) factor *= 1.1;
    const mult = setup.control ? D().scoring.controlGroupBonusMultiplier : 1;
    const score = Math.round(e.basePoints * factor * mult);
    // Tohum deneyi Veggie odası olmadan dış ortamda başarısız olur (bilimsel kural #5)
    const success = hypOk && envOk && instOk && (!minigame || minigame.success);

    Object.assign(rec, {
      done: true,
      hypothesis: setup.hypothesis,
      env: setup.env,
      control: setup.control,
      success,
      score,
      queued: true
    });

    let rewardKey = null;
    if (success && e.reward) {
      Object.assign(s.rewards, e.reward);
      if (e.reward.greenhouseYield) {
        s.greenhouse.yieldPct = 100 + D().habitat.greenhouse.germinationYieldBonusPct;
      }
      rewardKey = 'exp.' + id + '.reward';
    }

    S.Sim.queuePacket(s, {
      kind: 'experiment',
      refId: id,
      titleKey: 'exp.' + id + '.name',
      sizeMbit: e.dataMbit,
      points: score
    });

    S.logDecision(
      {
        category: 'science',
        titleKey: 'exp.' + id + '.name',
        choiceKey: hypOk ? (setup.control ? 'log.exp.confirmed_ctrl' : 'log.exp.confirmed') : (setup.control ? 'log.exp.refuted_ctrl' : 'log.exp.refuted'),
        resultKey: rewardKey || 'exp.' + id + '.result',
        vars: {},
        score
      },
      s
    );
    S.bus.emit('audio:play', success ? 'success' : 'fail');
    return { ok: true, success, score, hypOk, envOk, instOk, rewardKey, marsValue: e.marsValue, earthValue: e.earthValue, unit: e.unit };
  };

  S.Experiments = X;
})((window.SOL14 = window.SOL14 || {}));
