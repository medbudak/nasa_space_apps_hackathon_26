/**
 * SOL 14: RED HORIZON — Bilim panelleri: Adli İnceleme, 0.38g Laboratuvarı, Karar Günlüğü (K3)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const esc = (x) => S.util.escape(x);
  const SP = { selCategory: {}, expSel: null, expSetup: {} };

  /* ================================================================ */
  /* ADLİ İNCELEME                                                     */
  /* ================================================================ */
  const EV_ICON = { photo: 'camera', telemetry: 'power', env: 'target' };

  SP.forensicHtml = function (s, id) {
    const c = S.Forensics.get(id);
    const rec = s.forensics[id];
    const n = S.Forensics.evidenceCount(rec);
    const ponr = S.Sim.ponr(s);
    const evCards = S.DATA.forensics.evidenceTypes
      .map((ev) => {
        const q = rec.evidence[ev.id];
        const missing = ev.instrumentBonus && !S.Sim.has(s, ev.instrumentBonus);
        return (
          '<div class="ev-card ' + (q !== null ? 'done' : '') + '">' +
          '<div class="ev-head">' + I(EV_ICON[ev.id]) + '<b>' + t('ev.' + ev.id) + '</b></div>' +
          '<p>' + t('ev.' + ev.id + '.desc') + '</p>' +
          (missing ? '<p class="ev-warn">' + I('alert') + t('ev.missing_' + ev.id, { inst: t('inst.' + ev.instrumentBonus + '.short') }) + '</p>' : '') +
          (q !== null
            ? '<div class="ev-q">' + t('ev.quality') + ' <b>%' + Math.round(q * 100) + '</b></div>' + (ev.id === 'telemetry' ? '<pre class="ev-tlm">' + esc(JSON.stringify(c.telemetry)) + '</pre>' : '') + '<p class="ev-clue">' + I('check') + t('clue.' + id + '.' + ev.id) + '</p>'
            : '<button class="btn btn-ghost btn-block" data-ev="' + ev.id + '" ' + (rec.diagnosis ? 'disabled' : '') + '>' + I('play') + t('ev.collect', { min: ev.minutes }) + '</button>') +
          '</div>'
        );
      })
      .join('');

    const sel = SP.selCategory[id] || rec.diagnosis || null;
    const cats = S.DATA.forensics.categories
      .map((cat) => '<button class="cat-btn' + (sel === cat ? ' sel' : '') + '" data-cat="' + cat + '" ' + (rec.diagnosis ? 'disabled' : '') + '>' + t('cat.' + cat) + '</button>')
      .join('');

    let diag;
    if (!rec.diagnosis) {
      diag =
        '<div class="diag"><h4>' + t('fr.diagnose_title') + '</h4><div class="cats">' + cats + '</div>' +
        (n < S.DATA.forensics.minEvidenceForDiagnosis ? '<p class="pv-note">' + I('alert') + t('fr.need_evidence', { n: S.DATA.forensics.minEvidenceForDiagnosis }) + '</p>' : '') +
        '<button class="btn btn-primary btn-block" data-diag ' + (n < S.DATA.forensics.minEvidenceForDiagnosis || !sel ? 'disabled' : '') + '>' + I('doc') + t('fr.submit') + '</button></div>';
    } else {
      diag =
        '<div class="finding ' + (rec.correct ? 'ok' : 'bad') + '">' +
        '<div class="finding-head">' + I(rec.correct ? 'check' : 'x') + '<b>' + t(rec.correct ? 'fr.correct' : 'fr.wrong', { cat: t('cat.' + rec.diagnosis), pts: rec.score }) + '</b></div>' +
        '<h4>' + t('fr.nasa_finding') + '</h4><p>' + t('case.' + id + '.finding') + '</p>' +
        '<h4>' + t('fr.lesson') + '</h4><p>' + t('case.' + id + '.lesson') + '</p>' +
        '<p class="pv-note">' + I('signal') + t('fr.queued', { mbit: c.reportMbit }) + '</p>' +
        SP.salvageHtml(c, rec) +
        '<a class="src-link" href="' + c.src + '" target="_blank" rel="noopener">' + t('fr.source') + '</a></div>';
    }

    return (
      '<div class="panel big-panel fr-panel">' +
      '<div class="bp-head"><span class="bp-num">' + I('target') + '</span><h2>' + t('fr.title') + ' — ' + esc(c.name) + '</h2>' +
      (c.bonus ? '<span class="pass-chip on">BONUS</span>' : '') +
      '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="fr-meta"><span>' + esc(c.agency) + '</span><span>' + I('calendar') + esc(c.lastContact) + '</span><span>' + I('map') + esc(c.realCoords) + '</span>' +
      '<span class="' + (ponr.critical ? 'danger' : '') + '">' + I('o2') + t('fr.o2_now', { o2: Math.round(s.suit.o2), req: ponr.requiredO2 }) + '</span></div>' +
      '<p class="fr-brief">' + t('case.' + id + '.brief') + '</p>' +
      '<div class="fr-grid"><div class="ev-cards">' + evCards + '</div>' + diag + '</div></div>'
    );
  };

  /** Parça sökme; Enkaz Sahası vakasında (salvageChoice) önce "hangi parça sağlam?" mühendislik kararı (D-012) */
  SP.salvageHtml = function (c, rec) {
    const id = c.id;
    if (rec.salvaged) {
      if (c.salvageChoice && rec.salvagePick) {
        const opt = c.salvageChoice.options.find((o) => o.id === rec.salvagePick);
        return '<p class="pv-note ' + (opt.reusable ? 'ok' : '') + '">' + I(opt.reusable ? 'wrench' : 'alert') + t(opt.reusable ? 'salvage.' + id : 'part.' + id + '.' + opt.id + '.why') + '</p>';
      }
      return '<p class="pv-note ok">' + I('wrench') + t('salvage.' + id) + '</p>';
    }
    if (!c.salvageChoice) return '<button class="btn btn-primary btn-block" data-salvage>' + I('wrench') + t('fr.salvage', { min: S.DATA.gameplay.actions.salvageMin }) + '</button>';
    return (
      '<h4>' + t('fr.salvage_choose') + '</h4><p class="pv-note">' + t('fr.salvage_choose_hint') + '</p><div class="cats">' +
      c.salvageChoice.options.map((o) => '<button class="cat-btn" data-part="' + o.id + '">' + I('wrench') + t('part.' + id + '.' + o.id) + '</button>').join('') +
      '</div>'
    );
  };

  SP.openForensic = function (id) {
    const s = S.getState();
    s.forensics[id].discovered = true;
    const mount = (box) => {
      box.querySelectorAll('[data-ev]').forEach((b) =>
        b.addEventListener('click', async () => {
          const ev = S.Forensics.evidenceCfg(b.dataset.ev);
          S.UI.closeModal('forensic', true);
          const mg = await S.runMinigame(ev.minigame, { titleKey: 'ev.' + ev.id + '.mg_title', descKey: 'ev.' + ev.id + '.mg_desc' });
          S.Surface.body.actionT = 1;
          S.Forensics.collectEvidence(S.getState(), id, ev.id, mg);
          S.Game.afterAction(() => SP.openForensic(id));
        })
      );
      box.querySelectorAll('[data-cat]').forEach((b) =>
        b.addEventListener('click', () => {
          SP.selCategory[id] = b.dataset.cat;
          S.bus.emit('audio:play', 'click');
          S.UI.updateModal('forensic', SP.forensicHtml(S.getState(), id), mount);
        })
      );
      const d = box.querySelector('[data-diag]');
      if (d)
        d.addEventListener('click', () => {
          const r = S.Forensics.diagnose(S.getState(), id, SP.selCategory[id]);
          if (!r.ok) return S.UI.toast(t(r.errKey), 'warn');
          S.UI.closeModal('forensic', true);
          S.Game.afterAction(() => SP.openForensic(id));
        });
      const sv = box.querySelector('[data-salvage]');
      if (sv)
        sv.addEventListener('click', () => {
          S.Surface.body.actionT = 1.2;
          S.Forensics.salvage(S.getState(), id);
          S.UI.closeModal('forensic', true);
          S.UI.toast(I('wrench') + t('salvage.' + id), 'ok', 4000);
          S.Game.afterAction(() => SP.openForensic(id));
        });
      box.querySelectorAll('[data-part]').forEach((b) =>
        b.addEventListener('click', () => {
          S.Surface.body.actionT = 1.2;
          const r = S.Forensics.salvage(S.getState(), id, b.dataset.part);
          if (!r.ok) return;
          S.UI.closeModal('forensic', true);
          S.UI.toast(I(r.correct ? 'wrench' : 'alert') + t(r.rewardKey), r.correct ? 'ok' : 'warn', 5500);
          S.Game.afterAction(() => SP.openForensic(id));
        })
      );
    };
    S.UI.openModal('forensic', SP.forensicHtml(s, id), { cls: 'modal-wide', onMount: mount });
  };

  /* ================================================================ */
  /* LAV TÜNELİ — SON KAYA ODASI ÇALIŞMALARI (D-012)                    */
  /* ================================================================ */
  SP.caveStudyHtml = function (s, id) {
    const res = S.Explore.studyResult(s, id);
    const c = s.explore.cave;
    let data = '';
    if (id === 'temp') {
      data =
        '<div class="exp-compare"><div><span>' + t('cave.temp_entrance') + '</span><b>' + c.temp.entrance + ' °C</b></div>' +
        '<div><span>' + t('cave.temp_deep') + '</span><b>' + c.temp.deep + ' °C</b></div></div>';
    } else if (id === 'distance') {
      data = '<div class="exp-compare"><div><span>' + t('cave.study.distance') + '</span><b>' + c.distance + ' m</b></div></div>';
    } else if (c.vibration) {
      data = c.vibration
        .map((v) => '<div class="pv-row">' + I('signal') + '<span>' + t('cave.vp.' + v.id) + '</span><b>' + '▮'.repeat(Math.round(v.amplitude * 10)) + ' ' + v.amplitude.toFixed(2) + '</b></div>')
        .join('');
    }
    const p = S.Explore.caveProgress(s);
    return (
      '<div class="panel big-panel">' +
      '<div class="bp-head"><span class="bp-num">' + I('flask') + '</span><h2>' + t('cave.study.' + id) + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="exp-result ok">' + data +
      (res ? '<p>' + esc(t(res.key, res.vars)) + '</p>' : '') +
      '<p class="pv-note">' + I('alert') + t('cave.note.' + id) + '</p>' +
      '<p class="pv-note">' + I('signal') + t('cave.progress', { n: p.done, total: p.total }) + '</p>' +
      (id === 'temp' ? '<a class="src-link" href="' + S.DATA.explore.cave.skylight.src + '" target="_blank" rel="noopener">' + t('fr.source') + '</a>' : '') +
      '<p class="pv-note">' + t('hud.cave_fiction') + '</p>' +
      '<button class="btn btn-primary btn-block" data-close>' + t('ui.continue') + '</button></div></div>'
    );
  };

  SP.openCaveStudy = function (id) {
    S.UI.openModal('cave_study', SP.caveStudyHtml(S.getState(), id), { cls: 'modal-wide' });
  };

  /* ================================================================ */
  /* 0.38g LABORATUVARI                                                */
  /* ================================================================ */
  SP.labHtml = function (s) {
    const list = S.Experiments.list();
    if (!SP.expSel) SP.expSel = (list.find((e) => !s.experiments[e.id].done) || list[0]).id;
    const e = S.Experiments.get(SP.expSel);
    const rec = s.experiments[e.id];
    const setup = SP.expSetup[e.id] || (SP.expSetup[e.id] = { hypothesis: null, env: 'habitat', control: true });
    const av = S.Experiments.availability(s, e.id);
    const cost = S.Experiments.cost(e, setup.control);

    const left = list
      .map(
        (x) =>
          '<button class="exp-item' + (x.id === e.id ? ' sel' : '') + (s.experiments[x.id].done ? ' done' : '') + '" data-exp="' + x.id + '">' +
          '<span class="exp-n">' + x.order + '</span><span>' + t('exp.' + x.id + '.name') + '</span>' +
          (s.experiments[x.id].done ? I(s.experiments[x.id].success ? 'check' : 'x') : '') + '</button>'
      )
      .join('');

    let right;
    if (rec.done) {
      right =
        '<div class="exp-result ' + (rec.success ? 'ok' : 'bad') + '">' +
        '<h3>' + t('exp.' + e.id + '.name') + '</h3>' +
        '<div class="exp-compare"><div><span>' + t('lab.mars') + '</span><b>' + e.marsValue + ' ' + e.unit + '</b></div><div><span>' + t('lab.earth') + '</span><b>' + e.earthValue + ' ' + e.unit + '</b></div></div>' +
        '<p>' + t('exp.' + e.id + '.result') + '</p>' +
        (rec.success ? '<p class="pv-note ok">' + I('check') + t('exp.' + e.id + '.reward') + '</p>' : '<p class="pv-note">' + I('alert') + t('lab.failed_note') + '</p>') +
        '<div class="pv-row">' + I('signal') + '<span>' + t('lab.score') + '</span><b>' + rec.score + ' · ' + t(rec.sent ? 'dl.st_arrived' : 'dl.st_ready') + '</b></div>' +
        '<a class="src-link" href="' + e.src + '" target="_blank" rel="noopener">' + t('fr.source') + '</a></div>';
    } else {
      right =
        '<div class="exp-setup"><h3>' + t('exp.' + e.id + '.name') + '</h3>' +
        '<p class="exp-q">' + I('target') + t('exp.' + e.id + '.question') + '</p>' +
        (av.ok ? '' : '<div class="alert danger">' + I('x') + '<span>' + t(av.reasonKey) + '</span></div>') +
        (av.warnKey ? '<div class="alert warn">' + I('alert') + '<span>' + t(av.warnKey, { inst: t('inst.' + av.instrument + '.short') }) + '</span></div>' : '') +
        '<h4>1 · ' + t('lab.hypothesis') + '</h4><div class="hyps">' +
        e.hypotheses.map((h) => '<button class="hyp' + (setup.hypothesis === h ? ' sel' : '') + '" data-hyp="' + h + '">' + t('exp.' + e.id + '.h.' + h) + '</button>').join('') +
        '</div><h4>2 · ' + t('lab.environment') + '</h4><div class="seg">' +
        ['habitat', 'surface'].map((v) => '<button class="' + (setup.env === v ? 'sel' : '') + '" data-env="' + v + '">' + t('lab.env_' + v) + '</button>').join('') +
        '</div><h4>3 · ' + t('lab.control') + '</h4>' +
        '<button class="check ' + (setup.control ? 'on' : '') + '" data-ctrl><i></i>' + t('lab.control_desc', { pct: Math.round((S.DATA.scoring.controlGroupBonusMultiplier - 1) * 100) }) + '</button>' +
        '<div class="exp-cost"><span>' + I('clock') + S.util.duration(cost.minutes) + '</span><span>' + I('power') + cost.kwh + ' kWh</span><span>' + I('signal') + e.dataMbit + ' Mbit</span><span>' + I('target') + t('cc.minigame.' + e.minigame) + '</span></div>' +
        '<button class="btn btn-primary btn-block btn-lg" data-run ' + (!av.ok || !setup.hypothesis ? 'disabled' : '') + '>' + I('play') + t('lab.run') + '</button></div>';
    }
    return (
      '<div class="panel big-panel lab-panel" style="--bg:url(\'' + S.Sprites.screen('scr_lab_desk') + '\')">' +
      '<div class="bp-head"><span class="bp-num">' + I('flask') + '</span><h2>' + t('lab.title') + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="lab-grid"><div class="exp-list">' + left + '</div>' + right + '</div></div>'
    );
  };

  SP.openLab = function () {
    const mount = (box) => {
      const re = () => S.UI.updateModal('lab', SP.labHtml(S.getState()), mount);
      box.querySelectorAll('[data-exp]').forEach((b) => b.addEventListener('click', () => { SP.expSel = b.dataset.exp; S.bus.emit('audio:play', 'click'); re(); }));
      box.querySelectorAll('[data-hyp]').forEach((b) => b.addEventListener('click', () => { SP.expSetup[SP.expSel].hypothesis = b.dataset.hyp; S.bus.emit('audio:play', 'click'); re(); }));
      box.querySelectorAll('[data-env]').forEach((b) => b.addEventListener('click', () => { SP.expSetup[SP.expSel].env = b.dataset.env; S.bus.emit('audio:play', 'click'); re(); }));
      const ctrl = box.querySelector('[data-ctrl]');
      if (ctrl) ctrl.addEventListener('click', () => { SP.expSetup[SP.expSel].control = !SP.expSetup[SP.expSel].control; S.bus.emit('audio:play', 'click'); re(); });
      const run = box.querySelector('[data-run]');
      if (run)
        run.addEventListener('click', async () => {
          const id = SP.expSel;
          const e = S.Experiments.get(id);
          S.UI.closeModal('lab', true);
          const mg = await S.runMinigame(e.minigame, { titleKey: 'exp.' + id + '.mg_title', descKey: 'exp.' + id + '.mg_desc', theme: e.minigameTheme });
          const r = S.Experiments.run(S.getState(), id, SP.expSetup[id], mg);
          if (!r.ok) S.UI.toast(t(r.errKey), 'warn');
          S.Game.afterAction(() => SP.openLab());
        });
    };
    S.UI.openModal('lab', SP.labHtml(S.getState()), { cls: 'modal-wide', onMount: mount });
  };

  /* ================================================================ */
  /* KARAR GÜNLÜĞÜ                                                     */
  /* ================================================================ */
  SP.logHtml = function (s) {
    const rows = s.decisionLog
      .slice()
      .reverse()
      .map((l) => {
        const f = S.Score.formatLog(l);
        return (
          '<div class="log-row ' + l.category + '"><span class="log-sol">SOL ' + l.sol + '</span>' +
          '<div class="log-main"><b>' + esc(f.title) + '</b>' + (f.choice ? '<span>' + esc(f.choice) + '</span>' : '') +
          (f.result ? '<p>' + esc(f.result) + '</p>' : '') + (l.cost ? '<div class="cc-chips">' + S.UI.costChips(l.cost) + '</div>' : '') + '</div>' +
          '<span class="log-score ' + (l.score >= 0 ? 'pos' : 'neg') + '">' + (l.score > 0 ? '+' : '') + l.score + '</span></div>'
        );
      })
      .join('');
    return (
      '<div class="panel big-panel log-panel"><div class="bp-head"><span class="bp-num">' + I('log') + '</span><h2>' + t('log.panel_title') + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="log-list">' + (rows || '<p class="empty">' + t('log.empty') + '</p>') + '</div></div>'
    );
  };

  SP.openLog = function () {
    S.UI.openModal('log', SP.logHtml(S.getState()), { cls: 'modal-wide' });
  };

  S.SciencePanels = SP;
})((window.SOL14 = window.SOL14 || {}));
