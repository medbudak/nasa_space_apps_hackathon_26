/**
 * SOL 14: RED HORIZON — Dönüş roketi (MAV) hasarı ve tamiri (Kişi 4 görev kartı; D-015 önerisi)
 * Hasar kaynakları: inişte gevşeyen yakıt hattı (yolculuk) ve Sol 2 göktaşı (gövde paneli). Her parçanın tamiri
 * malzeme + alet + enerji + EVA süresi ister ve bir mini oyun açar; başarı parçayı onarır, başarısızlık yalnızca
 * zaman harcatır (yeniden denenebilir). Hasarlı roket güvenli kalkamaz. DOM'a dokunmaz; durum s.rocket.
 * Sayılar data/nasa_data.json → rocket (oyun değerleri, simplified).
 */
(function (S) {
  'use strict';
  const R = {};
  const cfg = () => S.DATA.rocket;

  R.parts = () => cfg().parts;
  R.part = (id) => R.parts().find((p) => p.id === id);
  R.state = (s) => s.rocket || (s.rocket = { damage: {} });
  R.damaged = (s) => R.parts().filter((p) => R.state(s).damage[p.id]).map((p) => p.id);
  R.isDamaged = (s) => R.damaged(s).length > 0;

  /** Hasar ver (kaynak: 'landing' | 'meteor'); kayıt karar günlüğüne düşer */
  R.damage = function (s, partId, source) {
    if (!R.part(partId) || R.state(s).damage[partId]) return;
    R.state(s).damage[partId] = source;
    S.bus.emit('rocket:damaged', { part: partId, source });
  };

  /** İnişte: yolculuğun bıraktığı hasar */
  R.applyLandingDamage = (s) => cfg().landingDamage.forEach((id) => R.damage(s, id, 'landing'));

  /**
   * Tamir edilebilir mi? { ok, missing: [item], errKey, vars } — alet, malzeme, enerji, eldeki alet sırasıyla.
   * held: oyuncunun elindeki eşya kimliği (hotbar); verilmezse (testler, bot) elde olduğu varsayılır.
   */
  R.check = function (s, partId, held) {
    const p = R.part(partId);
    if (!p || !R.state(s).damage[partId]) return { ok: false, errKey: 'rocket.err_ok' };
    if (!S.Workshop.hasTool(s, p.tool)) return { ok: false, errKey: 'tool.err_need', vars: { tool: S.t('tool.' + p.tool + '.name') } };
    const missing = Object.entries(p.needs).filter(([item, n]) => S.Workshop.count(s, item) < n).map(([item]) => item);
    if (missing.length) return { ok: false, missing, errKey: 'ws.err_missing', vars: { list: missing.map((i) => S.t('item.' + i + '.name')).join(', ') } };
    if (s.res.energyKwh < p.energyKwh) return { ok: false, errKey: 'rocket.err_energy', vars: { kwh: p.energyKwh } };
    if (held !== undefined && held !== p.tool) return { ok: false, hold: true, errKey: 'rocket.err_hold', vars: { tool: S.t('tool.' + p.tool + '.name') } };
    return { ok: true };
  };

  /** Mini oyun bittikten sonra çağrılır: başarıda malzeme ve enerji düşer, parça onarılır; her durumda EVA süresi geçer */
  /** Eldeki aletle tamir edilecek ilk hasarlı parça (F ile MAV'da) */
  R.partForTool = (s, tool) => R.damaged(s).find((id) => R.part(id).tool === tool) || null;

  R.repair = function (s, partId, success) {
    const c = R.check(s, partId);
    if (!c.ok) return c;
    const p = R.part(partId);
    S.Sim.advance(s, p.evaMinutes);
    if (!success) return { ok: true, repaired: false };
    for (const [item, n] of Object.entries(p.needs)) s.inventory.items[item] -= n;
    s.res.energyKwh -= p.energyKwh;
    delete R.state(s).damage[partId];
    S.logDecision({ category: 'engineering', titleKey: 'log.rocket.title', choiceKey: 'rocket.part.' + partId, resultKey: 'rocket.repaired', vars: {}, score: 0 }, s);
    S.bus.emit('audio:play', 'success');
    return { ok: true, repaired: true };
  };

  S.Rocket = R;
})((window.SOL14 = window.SOL14 || {}));
