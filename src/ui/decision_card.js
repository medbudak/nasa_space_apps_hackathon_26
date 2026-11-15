/**
 * SOL 14: RED HORIZON — M2 Kriz Karar Kartı + M7 Gecikmeli Görev Kontrol (mockup 07) (K3)
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const DC = {};

  DC.open = function () {
    const s = S.getState();
    const c = s.crisis.active;
    if (!c) return;
    const def = S.Events.def(c.id);
    const ponr = S.Sim.ponr(s);
    const consultMin = c.roundTripMin;

    const stats =
      '<div class="cc-stats">' +
      '<div><span>' + (S.Sim.isOutside(s) ? t('cc.suit_o2') : t('cc.reserve_o2')) + '</span><b>' + (S.Sim.isOutside(s) ? '%' + Math.round(s.suit.o2) : s.res.o2ReserveKg.toFixed(1) + ' kg') + '</b></div>' +
      '<div><span>' + t('cc.habitat') + '</span><b>' + (S.Sim.isOutside(s) ? ponr.distanceM + ' m' : t('cc.inside')) + '</b></div>' +
      '<div><span>' + t('cc.speed') + '</span><b class="' + (s.suit.frozen ? 'danger' : '') + '">%' + ponr.speedPct + '</b></div>' +
      '<div><span>' + t('cc.battery') + '</span><b>' + s.res.energyKwh.toFixed(1) + ' kWh</b></div></div>';

    const risk = ponr.beyond || (S.Sim.isOutside(s) && s.suit.frozen && ponr.critical)
      ? '<p class="cc-risk">' + t('cc.risk_return') + '</p>'
      : '';

    const opts = def.options
      .map((o) => {
        const avail = S.Events.optionAvailable(s, o);
        const variant = S.Events.resolveVariant(s, c.id, o, { minigame: { score: 1, success: true } });
        const costs = S.Events.describeEffects(o.minigame ? o.effects : variant.effects);
        const req = !avail && o.requires ? '<span class="cc-req">' + t('cc.requires.' + Object.keys(o.requires)[0], { what: t('req.' + Object.values(o.requires)[0]) }) + '</span>' : '';
        const altNote = variant.resultKey && variant.resultKey !== 'crisis.' + c.id + '.' + o.id + '.res' && !o.minigame ? '<span class="cc-bonus">' + I('check') + t('cc.bonus_available') + '</span>' : '';
        return (
          '<button class="cc-opt" data-opt="' + o.id + '" ' + (avail ? '' : 'disabled') + '>' +
          '<span class="cc-ico">' + S.UI.dataIcon(o.icon || o.id) + '</span>' +
          '<span class="cc-body"><b>' + t('crisis.' + c.id + '.' + o.id + '.label') + '</b>' +
          '<span class="cc-sub">' + t('crisis.' + c.id + '.' + o.id + '.sub') + '</span>' +
          '<span class="cc-chips">' + S.UI.costChips(costs) + (o.minigame ? '<span class="chip mg">' + I('target') + t('cc.minigame.' + o.minigame) + '</span>' : '') + '</span>' +
          altNote + req + '</span>' +
          '<span class="cc-chev">' + I('arrowR') + '</span></button>'
        );
      })
      .join('');

    const mc = c.consulted
      ? '<div class="cc-advice">' + I('globe') + '<div><b>' + t('cc.mc_reply', { min: consultMin }) + '</b><p>' + t('crisis.' + c.id + '.advice') + '</p></div></div>'
      : '<button class="btn btn-ghost btn-block cc-consult" data-consult>' + I('sat') + t('cc.consult', { min: consultMin }) + '</button>';

    const html =
      '<div class="crisis-card' + (def.bonus ? ' bonus' : '') + '">' +
      '<div class="cc-head">' + I(def.bonus ? 'check' : 'alert') + '<h3>' + t('crisis.' + c.id + '.title') + '</h3>' +
      '<span class="cc-sol">SOL ' + s.sol + ' · ' + S.util.clock(c.minute) + '</span></div>' +
      stats +
      '<p class="cc-desc">' + t('crisis.' + c.id + '.desc') + '</p>' + risk +
      '<div class="cc-opts">' + opts + '</div>' + mc +
      '<p class="cc-foot">' + I('doc') + t('cc.logged') + ' · ' + t('cc.delay', { d: t('unit.mmss', { m: Math.floor(c.lightDelaySec / 60), s: c.lightDelaySec % 60 }) }) + '</p></div>';

    S.UI.openModal('crisis', html, {
      closable: false,
      cls: 'modal-crisis',
      onMount: (box) => {
        box.querySelectorAll('[data-opt]').forEach((b) =>
          b.addEventListener('click', () => DC.choose(b.dataset.opt))
        );
        const cb = box.querySelector('[data-consult]');
        if (cb)
          cb.addEventListener('click', () => {
            cb.disabled = true;
            cb.innerHTML = I('sat') + t('cc.waiting', { min: consultMin });
            S.bus.emit('audio:play', 'downlink');
            // Işık gecikmesini hissettir: kısa animasyon, ardından simülasyonda zaman ilerler
            setTimeout(() => {
              S.Events.consult(S.getState());
              if (S.getState().gameOver) {
                S.UI.closeModal('crisis', true);
                S.Game.checkEnd();
                return;
              }
              DC.open();
            }, 1600);
          });
      }
    });
  };

  DC.choose = async function (optId) {
    const s = S.getState();
    const c = s.crisis.active;
    if (!c) return;
    const def = S.Events.def(c.id);
    const opt = def.options.find((o) => o.id === optId);
    S.bus.emit('audio:play', 'click');
    let ctx = {};
    if (opt.minigame) {
      S.UI.closeModal('crisis', true);
      const mg = await S.runMinigame(opt.minigame, { titleKey: 'crisis.' + c.id + '.mg_title', descKey: 'crisis.' + c.id + '.mg_desc' });
      ctx = { minigame: mg };
    }
    const res = S.Events.resolve(S.getState(), optId, ctx);
    S.UI.closeModal('crisis', true);
    if (!res) return;
    const html =
      '<div class="crisis-card result">' +
      '<div class="cc-head ' + (res.score >= 0 ? 'ok' : '') + '">' + I(res.score >= 0 ? 'check' : 'alert') + '<h3>' + t('crisis.' + c.id + '.title') + '</h3></div>' +
      '<p class="cc-result">' + t(res.resultKey, res.vars) + '</p>' +
      '<div class="cc-score ' + (res.score >= 0 ? 'pos' : 'neg') + '">' + t('cc.score', { v: (res.score > 0 ? '+' : '') + res.score }) + '</div>' +
      '<p class="cc-foot">' + I('doc') + t('cc.logged_done') + '</p>' +
      '<button class="btn btn-primary btn-block" data-close>' + t('ui.continue') + '</button></div>';
    S.UI.openModal('crisis-result', html, { cls: 'modal-crisis', onClose: () => S.Game.afterAction() });
  };

  S.DecisionCard = DC;
})((window.SOL14 = window.SOL14 || {}));
