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

  /** Vakaya özgü metin (NASA/ESA'nın o araç için yaptığı inceleme), yoksa genel kanıt metni */
  const evText = (id, ev, part) => {
    const k = 'ev.' + id + '.' + ev + '.' + part;
    return S.STORY && S.STORY[S.lang] && S.STORY[S.lang][k] ? k : part === 'title' ? 'ev.' + ev : 'ev.' + ev + '.' + part;
  };
  SP.evText = evText;
  /** Kara kutu görevi: aracın gerçek son telemetri kanalları → ait oldukları alt sistem (wires eşleme modu) */
  SP.telemetryMatch = function (c) {
    const map = c.telemetryMap || {};
    return Object.keys(map).map((k) => ({ left: t('tlm.' + k, { v: c.telemetry[k] }), right: t('sub.' + map[k]) }));
  };

  SP.forensicHtml = function (s, id) {
    const c = S.Forensics.get(id);
    const rec = s.forensics[id];
    const n = S.Forensics.evidenceCount(rec);
    const types = S.DATA.forensics.evidenceTypes;
    const ponr = S.Sim.ponr(s);
    const steps = types
      .map((ev, i) => {
        const q = rec.evidence[ev.id];
        const missing = ev.instrumentBonus && !S.Sim.has(s, ev.instrumentBonus);
        const pct = q !== null ? Math.round(q * 100) : 0;
        return (
          '<div class="fr2-step' + (q !== null ? ' done' : '') + '">' +
          '<div class="fr2-step-head"><span class="fr2-num">' + (i + 1) + '</span>' + I(EV_ICON[ev.id]) +
          '<em class="fr2-state">' + t(q !== null ? 'fr.done' : 'fr.waiting') + '</em></div>' +
          '<h4>' + t(evText(id, ev.id, 'title')) + '</h4>' +
          '<p class="fr2-desc">' + t(evText(id, ev.id, 'desc')) + '</p>' +
          (missing ? '<p class="fr2-warn">' + I('alert') + t('ev.missing_' + ev.id, { inst: t('inst.' + ev.instrumentBonus + '.short') }) + '</p>' : '') +
          (q !== null
            ? '<div class="fr2-q"><span>' + t('ev.quality') + '</span><i><b style="width:' + pct + '%"></b></i><strong>%' + pct + '</strong></div>' +
              '<p class="fr2-clue">' + I('check') + t('clue.' + id + '.' + ev.id) + '</p>'
            : '<button class="btn btn-primary btn-block fr2-go" data-ev="' + ev.id + '" ' + (rec.diagnosis ? 'disabled' : '') + '>' + I('play') + t('fr.start', { min: ev.minutes }) + '</button>') +
          '</div>'
        );
      })
      .join('');

    const sel = SP.selCategory[id] || rec.diagnosis || null;
    const cats = S.DATA.forensics.categories
      .map(
        (cat) =>
          '<button class="cat-btn' + (sel === cat ? ' sel' : '') + '" data-cat="' + cat + '" ' + (rec.diagnosis ? 'disabled' : '') + '><span>' + t('cat.' + cat) + '</span>' +
          '<small>' + t('catd.' + cat) + '</small></button>'
      )
      .join('');
    // Teşhis hikâyesi (K3 Medine): yeterli kanıt toplanınca ipuçlarının anlattığı olay; öncesinde kilitli
    const need = S.DATA.forensics.minEvidenceForDiagnosis;
    const story =
      n >= need
        ? '<div class="wr-story"><h5>' + t('wreckstory.title') + '</h5><p>' + t('wreckstory.' + id) + '</p><p class="wr-ask">' + t('wreckstory.ask') + '</p></div>'
        : '<div class="wr-story locked"><h5>' + t('wreckstory.title') + '</h5><p>' + t('wreckstory.locked', { n: need }) + '</p></div>';

    let diag;
    if (!rec.diagnosis) {
      diag =
        '<div class="fr2-diag"><div class="fr2-diag-l">' + story + '</div><div class="fr2-diag-r"><h4>' + t('fr.diagnose_title') + '</h4><div class="cats fr2-cats">' + cats + '</div>' +
        (n < need ? '<p class="pv-note">' + I('alert') + t('fr.need_evidence', { n: need }) + '</p>' : '') +
        '<button class="btn btn-primary btn-block" data-diag ' + (n < need || !sel ? 'disabled' : '') + '>' + I('doc') + t('fr.submit') + '</button></div></div>';
    } else {
      diag =
        '<div class="fr2-diag"><div class="finding ' + (rec.correct ? 'ok' : 'bad') + '">' +
        '<div class="finding-head">' + I(rec.correct ? 'check' : 'x') + '<b>' + t(rec.correct ? 'fr.correct' : 'fr.wrong', { cat: t('cat.' + rec.diagnosis), pts: rec.score }) + '</b></div>' +
        '<h4>' + t('fr.nasa_finding') + '</h4><p>' + t('case.' + id + '.finding') + '</p>' +
        '<h4>' + t('fr.lesson') + '</h4><p>' + t('case.' + id + '.lesson') + '</p>' +
        '<p class="pv-note">' + I('signal') + t('fr.queued', { mbit: c.reportMbit }) + '</p>' +
        '<a class="src-link" href="' + c.src + '" target="_blank" rel="noopener">' + t('fr.source') + '</a></div>' +
        '<div class="fr2-diag-r">' + SP.salvageHtml(c, rec) + '</div></div>';
    }

    return (
      '<div class="panel big-panel fr-panel fr2">' +
      '<div class="fr2-head"><span class="fr2-tag">' + I('target') + t('fr.title') + '</span><h2>' + esc(c.name) + '</h2>' +
      (c.bonus ? '<span class="pass-chip on">BONUS</span>' : '') +
      '<span class="fr2-count">' + t('fr.progress', { n, total: types.length }) + '</span>' +
      '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="fr2-meta"><span>' + esc(c.agency) + '</span><span>' + I('calendar') + esc(c.lastContact) + '</span><span>' + I('map') + esc(c.realCoords) + '</span>' +
      '<span class="' + (ponr.critical ? 'danger' : '') + '">' + I('o2') + t('fr.o2_now', { o2: Math.round(s.suit.o2), req: ponr.requiredO2 }) + '</span></div>' +
      '<p class="fr2-brief"><b>' + t('fr.mission') + ':</b> ' + t('case.' + id + '.brief') + '</p>' +
      '<div class="fr2-steps">' + steps + '</div>' + diag + '</div>'
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
          // Fotoğraf kanıtı FIELD CAM ile çekilir (vizörde bu enkaz); caseId vizör sahnesini seçer
          const c = S.Forensics.get(id);
          const cfg = { titleKey: evText(id, ev.id, 'mg_title'), descKey: evText(id, ev.id, 'mg_desc'), caseId: id };
          // Kara kutu: gerçek telemetri kanallarını alt sistemlerine bağla
          if (ev.id === 'telemetry' && c.telemetryMap) Object.assign(cfg, { match: SP.telemetryMatch(c), pairs: Object.keys(c.telemetryMap).length });
          // Çevre kanıtı her araçta o aracın kendi ölçümü (forensics_cases.json envMinigame)
          const mg = await S.runMinigame(ev.id === 'env' ? c.envMinigame : ev.minigame, cfg);
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

  /** Kurgusal İZCİ-1: beş parça fotoğraflanınca aracın son yolculuğu ve dersi */
  SP.openScoutStory = function () {
    const html =
      '<div class="panel big-panel">' +
      '<div class="bp-head"><span class="bp-num">' + I('camera') + '</span><h2>' + t('scout.story_title') + '</h2><button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="wr-story"><p>' + t('scout.story_body') + '</p><p class="wr-ask">' + t('scout.story_lesson') + '</p></div>' +
      '<p class="pv-note">' + t('scout.story_fiction') + '</p>' +
      '<button class="btn btn-primary btn-block" data-close>' + t('ui.continue') + '</button></div>';
    S.UI.openModal('scout_story', html, { cls: 'modal-wide' });
    S.bus.emit('audio:play', 'success');
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
          const mg = await S.runMinigame(e.minigame, { titleKey: 'exp.' + id + '.mg_title', descKey: 'exp.' + id + '.mg_desc' });
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
