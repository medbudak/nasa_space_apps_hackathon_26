/**
 * SOL 14: RED HORIZON — M1 Downlink Kuyruğu (mockup 06 "05 / DOWNLINK") (K3)
 * Gönderilmeyen veri puan sayılmaz. Röle geçişleri (MRO / DTE X-band / MAVEN) sınırlı Mbit taşır.
 */
(function (S) {
  'use strict';
  const t = (k, v) => S.t(k, v);
  const I = (n) => S.UI.icon(n);
  const DL = {};
  const KIND_ICON = { forensic: 'doc', experiment: 'flask', photo: 'image', family: 'heart' };

  function statusChip(p) {
    const map = { queued: ['ready', 'dl.st_ready'], sending: ['sending', 'dl.st_sending'], sent: ['flight', 'dl.st_flight'], arrived: ['arrived', 'dl.st_arrived'] };
    const [cls, key] = map[p.status];
    const extra = p.status === 'sending' ? ' ' + Math.round((p.progressMbit / p.sizeMbit) * 100) + '%' : '';
    return '<span class="st-chip ' + cls + '">' + (p.status === 'arrived' ? I('check') : '') + t(key) + extra + '</span>';
  }

  DL.html = function (s) {
    const h = S.Sim.horizons(s);
    const cap = S.Sim.todayCapacity(s);
    const pass = S.Sim.activePass(s);
    const next = S.Sim.nextPass(s);
    const commsOk = S.Sim.loadSupplied(s, 'comms');
    let passChip;
    if (h.conjunction) passChip = '<span class="pass-chip off">' + I('x') + t('dl.conjunction') + '</span>';
    else if (pass && commsOk && !s.downlink.paused) passChip = '<span class="pass-chip on">' + I('sat') + t('dl.pass_open', { id: pass.id }) + '</span>';
    else passChip = '<span class="pass-chip">' + I('sat') + t('dl.pass_closed') + '</span>';

    const rows = s.downlink.queue
      .map(
        (p, i) =>
          '<div class="q-row ' + p.status + '"><span class="q-grip">' + I('grip') + '</span><span class="q-num">' + (i + 1) + '</span>' +
          '<span class="q-ico">' + I(KIND_ICON[p.kind] || 'doc') + '</span>' +
          '<span class="q-title">' + S.util.escape(t(p.titleKey, p.vars)) + ' <em>— ' + p.sizeMbit + ' Mbit · +' + p.points + ' ' + t('dl.pts') + '</em></span>' +
          statusChip(p) +
          '<span class="q-move"><button class="icon-btn" data-up="' + p.id + '" ' + (p.status !== 'queued' ? 'disabled' : '') + '>' + I('up') + '</button>' +
          '<button class="icon-btn" data-down="' + p.id + '" ' + (p.status !== 'queued' ? 'disabled' : '') + '>' + I('down') + '</button></span></div>'
      )
      .join('');

    return (
      '<div class="panel big-panel dl-panel" style="--bg:url(\'' + S.Sprites.screen('scr_downlink') + '\')">' +
      '<div class="bp-head"><span class="bp-num">05</span><h2>DOWNLINK</h2>' + passChip + '<button class="icon-btn" data-close>' + I('x') + '</button></div>' +
      '<div class="dl-top"><div class="dl-cap"><div class="dl-cap-head"><span>' + t('dl.capacity') + '</span><b>' + cap.used + ' / ' + cap.total + ' Mbit</b></div>' +
      S.UI.segBar((cap.used / Math.max(1, cap.total)) * 100, 24) +
      // Aletlerin günlük rutin verisi raporlardan önce gider (Sol 0 seçimi: alet sayısı ve veri hacmi)
      '<small class="dl-routine">' + I('sat') + t('dl.routine', { left: Math.round(s.downlink.routineMbit || 0), total: S.Sim.instrumentDataMbit(s) }) + '</small></div>' +
      '<div class="dl-delay"><span>' + t('dl.light_delay') + '</span><b>' + t('unit.mmss', { m: h.mm, s: h.ss }) + '</b><small>' + h.distanceMillionKm + ' M km · JPL Horizons</small></div></div>' +
      (!commsOk ? '<div class="alert warn">' + I('power') + '<span>' + t('dl.comms_shed') + '</span></div>' : '') +
      '<div class="dl-queue"><div class="dl-qhead">' + t('dl.queue_title') + '</div>' +
      (rows || '<p class="empty">' + t('dl.empty') + '</p>') + '</div>' +
      '<div class="dl-foot"><span>' + I('clock') + (h.conjunction ? t('dl.no_more_passes') : t('dl.next_pass', { id: next.pass.id, t: S.util.duration(next.inMin), cap: next.pass.capacityMbit })) + '</span>' +
      '<button class="btn btn-ghost" data-family ' + (s.downlink.familySol === s.sol ? 'disabled' : '') + '>' + I('heart') + t('dl.add_family') + '</button>' +
      '<button class="btn btn-primary" data-toggle>' + I(s.downlink.paused ? 'play' : 'pause') + t(s.downlink.paused ? 'dl.start' : 'dl.pause') + '</button></div></div>'
    );
  };

  DL.open = function () {
    const mount = (box) => {
      box.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { S.Sim.movePacket(S.getState(), b.dataset.up, -1); DL.refresh(); }));
      box.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => { S.Sim.movePacket(S.getState(), b.dataset.down, 1); DL.refresh(); }));
      box.querySelector('[data-toggle]').addEventListener('click', () => {
        const s = S.getState();
        s.downlink.paused = !s.downlink.paused;
        S.bus.emit('audio:play', 'click');
        DL.refresh();
      });
      box.querySelector('[data-family]').addEventListener('click', () => {
        const s = S.getState();
        s.downlink.familySol = s.sol;
        S.Sim.queuePacket(s, { kind: 'family', refId: 'family_' + s.sol, titleKey: 'packet.family', sizeMbit: 6, points: 0 });
        DL.refresh();
      });
    };
    S.UI.openModal('downlink', DL.html(S.getState()), { cls: 'modal-wide', onMount: mount });
    DL._mount = mount;
  };

  DL.refresh = function () {
    if (!S.UI.isOpen('downlink')) return;
    S.UI.updateModal('downlink', DL.html(S.getState()), DL._mount);
  };

  S.DownlinkPanel = DL;
})((window.SOL14 = window.SOL14 || {}));
