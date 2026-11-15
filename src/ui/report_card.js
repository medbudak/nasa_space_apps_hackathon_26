/**
 * SOL 14: RED HORIZON — M5 Neden-Sonuç Karnesi (mockup 08 "08 / GÖREV KARNESİ") (K1 + K3)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const RC = {};

  RC.show = function (handlers) {
    const s = S.getState();
    const sc = S.Score.calc(s);
    const chains = S.Score.chains(s);
    const reqF = (s.demoMode ? S.DATA.demoSuccess : S.Engineering.findById(S.DATA.objectives, s.design.objectiveFocus)).fullSuccess;
    const tile = (icon, label, value, ok) =>
      '<div class="rc-tile ' + (ok === true ? 'ok' : ok === false ? 'bad' : '') + '">' + I(icon) + '<div><span>' + label + '</span><b>' + value + '</b></div></div>';

    const chainRows = chains
      .map(
        (c) =>
          '<div class="rc-chain ' + c.type + '"><span class="rc-cause">' + t(c.causeKey, c.vars) + '</span>' +
          '<span class="rc-arrow">' + I('arrowR') + '</span>' +
          '<span class="rc-effect">' + I(c.type === 'good' ? 'check' : c.type === 'bad' ? 'x' : 'alert') + t(c.effectKey, c.vars) + '</span></div>'
      )
      .join('');

    const topDecisions = s.decisionLog
      .filter((l) => l.category === 'crisis' || l.category === 'system')
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
      .slice(0, 4)
      .map((l) => {
        const f = S.Score.formatLog(l);
        return '<div class="rc-chain ' + (l.score >= 0 ? 'good' : 'bad') + '"><span class="rc-cause">SOL ' + l.sol + ' · ' + S.util.escape(f.title) + (f.choice ? ' — ' + S.util.escape(f.choice) : '') + '</span><span class="rc-arrow">' + I('arrowR') + '</span><span class="rc-effect">' + S.util.escape(f.result) + ' <em>(' + (l.score > 0 ? '+' : '') + l.score + ')</em></span></div>';
      })
      .join('');

    const d = s.design;
    const compare =
      '<table class="rc-table"><thead><tr><th></th><th>' + t('rc.yours') + '</th><th>Perseverance (2021–)</th><th>Opportunity (2004–2018)</th><th>InSight (2018–2022)</th></tr></thead><tbody>' +
      '<tr><td>' + t('rc.row_site') + '</td><td>' + t('site.' + d.landingSiteId + '.name') + '</td><td>Jezero 18.4°N</td><td>Meridiani 2°S</td><td>Elysium 4.5°N</td></tr>' +
      '<tr><td>' + t('rc.row_power') + '</td><td>' + t('pwr.' + d.powerSource + '.name') + ' · ' + d.batteryKwh + ' kWh</td><td>MMRTG ~110 W</td><td>' + t('rc.solar_rhu') + '</td><td>' + t('rc.solar_round') + '</td></tr>' +
      '<tr><td>' + t('rc.row_comm') + '</td><td>' + t('comm.' + d.commArchitecture + '.name') + '</td><td>UHF + X-band</td><td>UHF + X-band</td><td>UHF + X-band</td></tr>' +
      '<tr><td>' + t('rc.row_end') + '</td><td>' + t('tier.' + sc.tier) + '</td><td>' + t('rc.persev_end') + '</td><td>' + t('rc.oppy_end') + '</td><td>' + t('rc.insight_end') + '</td></tr>' +
      '</tbody></table>';

    const html =
      '<div class="screen report" style="--bg:url(\'' + S.Sprites.screen('bg_jezero_sunset') + '\')"><div class="rp-dim"></div>' +
      S.UI.header('<span class="bp-num">08</span><span>' + t('rc.section') + '</span>') +
      '<div class="rc-hero"><h1 class="tier-' + sc.tier + '">' + t('tier.' + sc.tier) + '</h1><span class="rc-sep"></span><div class="rc-gbp">GBP <b>' + sc.total + '</b></div></div>' +
      (s.gameOver ? '<div class="alert danger rc-go">' + I('alert') + '<span>' + t('gameover.' + s.gameOver.reason) + ' — SOL ' + s.gameOver.sol + ' ' + s.gameOver.time + '</span></div>' : '') +
      '<div class="rc-tiles">' +
      tile('doc', t('rc.reports'), sc.sentForensics + '/' + reqF.forensicsSent + (sc.sentForensics > reqF.forensicsSent ? '+' : ''), sc.sentForensics >= reqF.forensicsSent) +
      tile('flask', t('rc.experiments'), sc.sentExperiments + '/' + reqF.experimentsSent + (sc.sentExperiments > reqF.experimentsSent ? '+' : ''), sc.sentExperiments >= reqF.experimentsSent) +
      tile('shield', t('rc.return'), sc.safeReturn ? I('check') : I('x'), sc.safeReturn) +
      tile('weight', t('rc.margin'), '%' + (s.totals ? s.totals.massMarginPct : 0), s.totals && s.totals.massMarginPct >= S.DATA.scoring.massMarginBonusThresholdPct) +
      '</div>' +
      '<div class="rc-cols"><section class="panel rc-chains"><h3>' + t('rc.chains') + '</h3>' + chainRows + (topDecisions ? '<h4>' + t('rc.key_decisions') + '</h4>' + topDecisions : '') + '</section>' +
      '<section class="panel rc-break"><h3>' + t('rc.breakdown') + '</h3>' +
      '<div class="pv-row">' + I('doc') + '<span>' + t('rc.b_forensics') + '</span><b>+' + sc.forensicsScore + '</b></div>' +
      '<div class="pv-row">' + I('flask') + '<span>' + t('rc.b_experiments') + '</span><b>+' + sc.experimentsScore + '</b></div>' +
      '<div class="pv-row">' + I('shield') + '<span>' + t('rc.b_survival') + '</span><b>+' + sc.survivalScore + '</b></div>' +
      '<div class="pv-row">' + I('weight') + '<span>' + t('rc.b_margin') + '</span><b>+' + sc.marginBonus + '</b></div>' +
      '<div class="pv-row">' + I('alert') + '<span>' + t('rc.b_crisis') + '</span><b>' + (sc.crisisScore >= 0 ? '+' : '') + sc.crisisScore + '</b></div>' +
      '<div class="pv-row neg">' + I('x') + '<span>' + t('rc.b_penalty') + '</span><b>−' + sc.penalties + '</b></div>' +
      '<div class="pv-row">' + I('camera') + '<span>' + t('rc.ufo') + '</span><b>%' + sc.ufoPct + '</b></div></section></div>' +
      '<section class="panel rc-compare"><h3>' + t('rc.compare') + '</h3>' + compare + '</section>' +
      '<footer class="rc-foot"><span>' + I('log') + t('rc.local', { n: sc.localOnly }) + ' • ' + t('rc.arrived', { n: sc.arrived }) + '</span>' +
      '<div><button class="btn btn-primary" data-replay>' + I('play') + t('rc.replay') + '</button>' +
      '<button class="btn btn-ghost" data-log>' + I('log') + t('rc.log') + '</button>' +
      '<button class="btn btn-ghost" data-new>' + I('rocket') + t('rc.new') + '</button>' +
      '<button class="btn btn-ghost" data-menu>' + I('home') + t('lt.main_menu') + '</button></div></footer>' +
      '<p class="lt-fiction">' + t('lt.fiction') + '</p></div>';
    const root = S.UI.showScreen(html, 'scene-report');
    const b = (sel, fn) => {
      const el = root.querySelector(sel);
      if (el) el.addEventListener('click', () => { S.bus.emit('audio:play', 'click'); fn(); });
    };
    b('[data-replay]', handlers.replay);
    b('[data-log]', () => S.SciencePanels.openLog());
    b('[data-new]', handlers.newMission);
    b('[data-menu]', handlers.menu);
    if (!s.ending) root.querySelector('[data-replay]').hidden = true;
  };

  S.ReportCard = RC;
})((window.SOL14 = window.SOL14 || {}));
