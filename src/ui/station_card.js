/**
 * SOL 14: RED HORIZON — Göktaşı kartı (K3 Medine'nin prototipinden; D-014 önerisi)
 * Alarm şeridi, durum tablosu (MAV sağlam, kargo saçıldı), yeni iş üç adımda: topla → kaz → atölyede kur.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const SC = {};
  const CARD_DELAY_MS = 1300; // önce sarsıntı ve ses, sonra kart

  SC.showImpact = function (s) {
    S.bus.emit('audio:play', 'quake');
    S.FX.shake = 0.9;
    if (S.StationFx && !s.player.inside) S.StationFx.playImpact();
    setTimeout(() => SC.openCard(s), CARD_DELAY_MS);
  };

  SC.openCard = function (s) {
    const row = (k, cls) => '<div class="imp-row"><span>' + t('station.imp.' + k) + '</span><b class="' + cls + '">' + t('station.imp.' + k + '_v') + '</b></div>';
    const step = (n) => '<div class="imp-step"><b><i>0' + n + '</i>' + t('station.imp.s' + n + '_t') + '</b>' + t('station.imp.s' + n) + '</div>';
    const html =
      '<div class="imp-card" role="alertdialog">' +
      '<div class="imp-head"><span class="imp-led"></span><div><small>' + t('station.imp.alarm', { sol: s.sol }) + '</small><h2>' + t('station.imp.title') + '</h2></div></div>' +
      '<div class="imp-rows">' + row('mav', 'warn') + row('lander', 'ok') + row('cargo', 'warn') + '</div>' +
      '<p class="imp-text">' + t('station.imp.text') + '</p>' +
      '<div class="imp-mission">▶ ' + t('station.imp.mission') + '</div>' +
      '<div class="imp-steps">' + step(1) + step(2) + step(3) + '</div>' +
      '<div class="imp-foot"><small>' + t('station.imp.fiction') + '</small><button class="btn btn-primary" data-close>' + t('station.imp.go') + '</button></div></div>';
    S.UI.openModal('station-impact', html, { cls: 'modal-wide', onClose: () => S.Game.afterAction() });
    S.bus.emit('audio:play', 'alarm');
  };

  S.StationCard = SC;
})((window.SOL14 = window.SOL14 || {}));
