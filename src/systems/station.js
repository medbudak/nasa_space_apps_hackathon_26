/**
 * SOL 14: RED HORIZON — İstasyon hikâyesi (K3 Medine'nin prototipinden; D-014 önerisi)
 * Sol 2'de üssün doğusuna bir göktaşı düşer (kurgu) ve kargoyu etrafa saçar. MAV sağlam kalır, dönüş değişmez.
 * Saçılan malzeme yerde ve kayaların üstünde (zıpla) durur; iki sahte tümsekte gömülü kit vardır; açık zeminde
 * S/↓ ile regolit torbası doldurulur. Beş istasyon modülü mekikteki atölyede üretilir (workshop.recipes, module).
 * Sondaki istasyon, sonraki ekibe ne bırakıldığını söyler (endingId). Başarı ve karne kuralları değişmez.
 * DOM'a dokunmaz; durum s.station + s.inventory.items. Sayılar data/nasa_data.json → station.
 */
(function (S) {
  'use strict';
  const ST = {};
  const cfg = () => S.DATA.station;

  ST.blank = () => ({ impact: false, impactSol: null, picked: {}, built: {} });
  ST.state = (s) => s.station || (s.station = ST.blank());
  ST.impacted = (s) => Boolean(s.station && s.station.impact);
  ST.builtCount = (s) => cfg().modules.filter((m) => ST.state(s).built[m]).length;

  const addItem = (s, item, n = 1) => {
    const items = (s.inventory.items = s.inventory.items || {});
    items[item] = (items[item] || 0) + n;
  };

  /** Sol başında çağrılır: çarpma günü geldiyse kargo saçılır (bir kez) */
  ST.checkImpact = function (s) {
    const st = ST.state(s);
    if (st.impact || s.sol < cfg().impactSol) return false;
    st.impact = true;
    st.impactSol = s.sol;
    S.bus.emit('station:impact', { sol: s.sol });
    return true;
  };

  /** Saçılmış parçanın yerden yüksekliği (sprite px): kayanın üstündekiler zıplayarak alınır */
  ST.liftPx = function (p) {
    if (p.place !== 'boulder') return 0;
    const b = (S.DATA.terrain.boulders || []).find((x) => Math.abs(x.atM - p.m) < 1);
    return b ? b.heightPx : 0;
  };
  ST.pickupsLeft = (s) => (ST.impacted(s) ? cfg().pickups.filter((p) => !ST.state(s).picked[p.id]) : []);

  /** Üstünden geçilen parça alınır; heightPx = astronotun yerden yüksekliği. Dönüş: alınan parça | null */
  ST.collect = function (s, heightPx) {
    if (s.player.inside || s.player.zone === 'cave') return null;
    for (const p of ST.pickupsLeft(s)) {
      if (Math.abs(s.player.x - p.m) > cfg().pickupRangeM) continue;
      const lift = ST.liftPx(p);
      if (lift ? heightPx < lift - 4 : heightPx > 10) continue;
      ST.state(s).picked[p.id] = true;
      addItem(s, p.item);
      S.bus.emit('audio:play', 'click');
      S.bus.emit('station:pickup', { id: p.id, item: p.item });
      return p;
    }
    return null;
  };

  /** Sahte tümsek çarpmadan sonra gömülü bir kit saklar (kazılana kadar) */
  ST.moundItem = (s, siteId) => (ST.impacted(s) && !ST.state(s).picked[siteId] ? cfg().moundItems[siteId] || null : null);
  ST.takeMoundItem = function (s, siteId) {
    const item = ST.moundItem(s, siteId);
    if (!item) return null;
    ST.state(s).picked[siteId] = true;
    addItem(s, item);
    return item;
  };

  /**
   * S/↓: açık zeminde regolit torbası doldur (radyasyon kalkanı için). Kazı noktasının, mekiğin ve istasyon
   * alanının yanında olmaz. Oyun dakikası harcar (elbise O₂ ve bataryası sürer).
   */
  ST.digRegolith = function (s) {
    const c = cfg();
    if (!ST.impacted(s) || s.player.inside || s.player.zone === 'cave') return { ok: false };
    const near = (m) => Math.abs(s.player.x - m) < c.noDigNearM;
    if (near(S.DATA.terrain.map.landingPadM) || near(c.siteM)) return { ok: false, errKey: 'station.err_dig_here' };
    if (S.Explore && S.Explore.digSites().some((st) => near(S.Explore.siteAt(st)))) return { ok: false, errKey: 'station.err_dig_here' };
    addItem(s, 'regolith_bag');
    S.Sim.advance(s, c.regolithDigMinutes);
    return { ok: true, bags: s.inventory.items.regolith_bag };
  };

  /** Sonda istasyonun hâli: kabuk yoksa yarım iskelet; sonra ilk eksik hayati modül; hepsi varsa tam istasyon */
  ST.endingId = function (s) {
    const b = ST.state(s).built;
    if (!b.shell) return 'lost';
    if (!b.heat) return 'night';
    if (!b.power) return 'dark';
    if (!b.shield) return 'rad';
    if (!b.comms) return 'silent';
    return 'pioneer';
  };

  S.Station = ST;
})((window.SOL14 = window.SOL14 || {}));
