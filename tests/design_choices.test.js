/**
 * Sol 0 seçimlerinin oyundaki gerçek etkileri + bilgi balonlarının (tooltip) veriyle tutarlılığı (UX planı madde 5)
 * Tamir kiti · MOXIE/ISRU · Ingenuity kum tuzağı · alet verisi (dataMbit) downlink'te · fırlatma penceresi morali
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadCore, ROOT } = require('./helpers/load_core.js');

function landed(patch = {}, opts = {}) {
  const S = loadCore(opts);
  const design = Object.assign({}, S.State.DEFAULT_DESIGN, patch);
  const s = S.State.reset({ design });
  S.Sim.launch(s);
  S.Sim.land(s, null);
  s.player.inside = true;
  return { S, s };
}

const NO_MOXIE = ['mastcam_z', 'meda', 'seis', 'supercam', 'veggie'];

test('Tamir kiti: kitle onarım tam ve daha kısa, bir kit harcanır; kitsiz yama +kısmi ve daha uzun', () => {
  const { S, s } = landed({ repairKits: 1 });
  const A = S.DATA.gameplay.actions;
  assert.ok(A.repairSuitKitMin < A.repairSuitMin, 'kitli onarım daha kısa sürmeli');
  assert.equal(s.inventory.repairKits, 1);

  s.suit.integrity = 30;
  s.suit.leak = true;
  const pv = S.Sim.actions.repair_suit.preview(s);
  assert.equal(pv.costKey, 'action.cost_repair_kit');
  assert.equal(pv.to, 100);
  assert.equal(S.Sim.actions.repair_suit.minutes(s), A.repairSuitKitMin);
  const t0 = s.totalMinutes;
  assert.equal(S.Sim.doAction(s, 'repair_suit').ok, true);
  assert.equal(s.suit.integrity, 100);
  assert.equal(s.suit.leak, false);
  assert.equal(s.inventory.repairKits, 0, 'kit harcanmalı');
  assert.ok(Math.abs(s.totalMinutes - t0 - A.repairSuitKitMin) < 1e-6, 'süre kit harcanmadan önceki değer olmalı');

  // Kit bitti: yama yalnızca +repairSuitIntegrity, sızıntıyı yine kapatır, daha uzun sürer ve arayüz bunu söyler
  s.suit.integrity = 30;
  s.suit.leak = true;
  const pv2 = S.Sim.actions.repair_suit.preview(s);
  assert.equal(pv2.costKey, 'action.cost_repair_nokit');
  assert.equal(pv2.to, 30 + A.repairSuitIntegrity);
  const t1 = s.totalMinutes;
  S.Sim.doAction(s, 'repair_suit');
  assert.equal(s.suit.integrity, 30 + A.repairSuitIntegrity);
  assert.equal(s.suit.leak, false);
  assert.equal(s.inventory.repairKits, 0);
  assert.ok(Math.abs(s.totalMinutes - t1 - A.repairSuitMin) < 1e-6);
});

test('MOXIE yoksa ISRU ünitesi, Sabatier eylemi ve yakıt hedefleri yok; MOXIE varsa var', () => {
  const finishAllScience = (S, s) => {
    Object.values(s.forensics).forEach((r) => (r.queued = true));
    Object.values(s.experiments).forEach((r) => (r.done = true));
    s.greenhouse.tendedSol = s.sol;
    s.res.panelDust = 0;
  };
  const without = landed({ instruments: NO_MOXIE });
  {
    const { S, s } = without;
    assert.ok(!S.Surface.interactables(s).some((it) => it.id === 'isru'), 'ISRU ünitesi kurulmamalı');
    const fuel = s.res.mavFuel;
    const res = S.Sim.doAction(s, 'sabatier');
    assert.equal(res.ok, false);
    assert.equal(res.errKey, 'action.err_no_isru');
    assert.equal(s.res.mavFuel, fuel);
    finishAllScience(S, s);
    const g = S.Objectives.compute(s);
    assert.notEqual(g.main.id, 'isru');
    assert.equal(g.optional, null, 'Sabatier isteğe bağlı hedefi gösterilmemeli');
    assert.equal(S.Objectives.checklist(s).find((c) => c.key.startsWith('status.fuel')).key, 'status.fuel_no_isru');
    s.sol = s.maxSols;
    assert.equal(S.Objectives.compute(s).main.id, 'mav_launch', 'son Sol yakıt hedefi istenmemeli');
  }
  const withMoxie = landed();
  {
    const { S, s } = withMoxie;
    assert.ok(S.Surface.interactables(s).some((it) => it.id === 'isru'));
    finishAllScience(S, s);
    assert.equal(S.Objectives.compute(s).main.id, 'isru');
    const before = s.res.mavFuel;
    assert.equal(S.Sim.doAction(s, 'sabatier').ok, true);
    assert.equal(s.res.mavFuel, before + S.DATA.constants.sabatier.mavFuelPctPerBatch);
  }
});

test('Ingenuity kum tuzağını önceden işaretler ve yürüyüşü yavaşlatmaz (test botu varsayımıyla aynı)', () => {
  const plain = landed();
  const drone = landed({ instruments: ['mastcam_z', 'meda', 'seis', 'moxie', 'ingenuity'] });
  const pit = plain.S.DATA.terrain.sandPits[0];
  for (const run of [plain, drone]) {
    run.s.player.inside = false;
    run.s.player.x = (pit.fromM + pit.toM) / 2;
  }
  assert.equal(plain.S.Surface.speedFactor(plain.s), plain.S.DATA.terrain.sandPitSpeedFactor);
  assert.equal(drone.S.Surface.speedFactor(drone.s), 1);
  assert.equal(drone.S.Surface.sandPitAvoided(drone.s), true);
});

test('Alet verisi (dataMbit) her röle geçişinde raporlardan önce gider; Sol 0 bütçesi aynı sayıyı gösterir', () => {
  const { S, s } = landed();
  const inst = s.design.instruments.reduce((a, id) => a + S.DATA.instruments.find((i) => i.id === id).dataMbit, 0);
  const tot = S.Engineering.calcDesignTotals(s.design);
  assert.equal(s.downlink.routineMbit, inst);
  assert.equal(tot.instrumentDataMbit, inst);
  assert.equal(tot.reportDataMbit, tot.dataPerSolMbit - inst);

  const pkt = S.Sim.queuePacket(s, { kind: 'family', refId: 'test', titleKey: 'packet.family', sizeMbit: 6, points: 0 });
  const passes = S.Sim.passes(s).slice().sort((a, b) => a.startMinute - b.startMinute);
  const first = passes[0];
  S.Sim.advance(s, first.startMinute + first.durationMin + 1 - S.Sim.clockMinute(s));
  const routineLeft = Math.max(0, inst - first.capacityMbit);
  assert.ok(Math.abs(s.downlink.routineMbit - routineLeft) < 0.01, `rutin veri ${s.downlink.routineMbit} ≈ ${routineLeft}`);
  if (routineLeft > 0) assert.equal(pkt.progressMbit, 0, 'rutin veri bitmeden rapor gitmez');
  const second = passes[1];
  S.Sim.advance(s, second.startMinute + second.durationMin + 1 - S.Sim.clockMinute(s));
  assert.ok(s.downlink.routineMbit < 1e-6);
  assert.notEqual(pkt.status, 'queued');
  assert.equal(pkt.progressMbit, 6);

  // Bant genişliğini dolduran alet seti SPOF uyarısı alır
  const heavy = S.Engineering.calcDesignTotals(
    Object.assign({}, s.design, { commArchitecture: 'relay_only', instruments: ['mastcam_z', 'ingenuity', 'rimfax', 'supercam', 'seis'] })
  );
  assert.equal(heavy.reportDataMbit, 0);
  assert.ok(heavy.spof.includes('spof.data_full'));
});

test('Fırlatma penceresi: kaçırmak bütçeye ve iniş moraline veri kadar yansır', () => {
  const caught = landed();
  const missed = landed({ launchWindowCaught: false });
  const lw = caught.S.DATA.gameplay.launchWindow;
  assert.equal(caught.s.res.morale, lw.moraleStartCaught);
  assert.equal(missed.s.res.morale, lw.moraleStartMissed);
  const money = (r) => r.S.Engineering.calcDesignTotals(r.s.design).moneyUsed;
  assert.equal(money(missed) - money(caught), caught.S.DATA.constants.synodicPeriod.missedWindowCostM);
});

/* ---------------- Bilgi balonları: üç satır, iki dil, veriyle aynı sayılar ---------------- */
function loadDesignUi(lang) {
  const S = loadCore({ lang });
  const g = { console, Math, JSON, Date, SOL14: S };
  g.window = g;
  vm.createContext(g);
  for (const f of ['src/ui/ui_kit.js', 'src/ui/design_screens.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), g, { filename: f });
  return S;
}
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const rows = (html) => (html.match(/<p class="tip-row[^"]*"><b>[^<]+<\/b><span>([^<]+)<\/span><\/p>/g) || []).length;

test('Sol 0 bilgi balonları: her seçenek, alet ve bütçe çubuğu için üç dolu satır (TR + EN), eksik anahtar yok', () => {
  for (const lang of ['tr', 'en']) {
    const S = loadDesignUi(lang);
    const D = S.DATA;
    const s = S.State.reset({});
    S.debugMissingKeys = new Set();
    const opts = [
      ...D.objectives.map((o) => ['objectiveFocus', o.id]),
      ...D.rockets.map((r) => ['rocketId', r.id]),
      ...D.orbits.map((o) => ['orbitType', o.id]),
      ['launchWindowCaught', true],
      ['launchWindowCaught', false],
      ...D.landingSites.map((x) => ['landingSiteId', x.id]),
      ...Object.keys(D.habitat.powerSource).map((p) => ['powerSource', p]),
      ...D.habitat.batteries.map((b) => ['batteryKwh', b.kwh]),
      ...Object.keys(D.habitat.insulation).map((i) => ['insulation', i]),
      ...Object.keys(D.habitat.comms).map((c) => ['commArchitecture', c]),
      ...Array.from({ length: D.habitat.repairKit.max + 1 }, (_, n) => ['repairKits', n])
    ];
    for (const [f, v] of opts) assert.equal(rows(S.DesignScreens.optionTip(s, s.design, f, v, 'x')), 3, `${lang} ${f}=${v}`);
    for (const inst of D.instruments) assert.equal(rows(S.DesignScreens.instrumentTip(s, s.design, inst)), 3, `${lang} ${inst.id}`);
    const tot = S.Engineering.calcDesignTotals(s.design);
    for (const k of ['money', 'mass', 'power', 'data']) assert.equal(rows(S.DesignScreens.budgetTip(s.design, tot, k)), 3, `${lang} budget.${k}`);
    assert.deepEqual([...S.debugMissingKeys], [], lang + ' eksik anahtar');
  }
});

test('Sol 0 bilgi balonları: "Oyunda ne değişir?" sayıları tasarım toplamları ve oyun verisiyle aynı', () => {
  const S = loadDesignUi('en');
  const D = S.DATA;
  const s = S.State.reset({});
  const DS = S.DesignScreens;
  const A = D.gameplay.actions;
  for (const b of D.habitat.batteries) {
    const tot = S.Engineering.calcDesignTotals(Object.assign({}, s.design, { batteryKwh: b.kwh }));
    const fx = text(DS.optionEffect(s, s.design, 'batteryKwh', b.kwh));
    assert.ok(fx.includes(String(tot.nightNeedKwh)) && fx.includes(b.kwh + ' kWh'), fx);
  }
  for (const o of D.orbits) assert.ok(text(DS.optionEffect(s, s.design, 'orbitType', o.id)).includes(o.mavFuelStartPct + '%'), o.id);
  for (const c of Object.keys(D.habitat.comms)) {
    const tot = S.Engineering.calcDesignTotals(Object.assign({}, s.design, { commArchitecture: c }));
    assert.ok(text(DS.optionEffect(s, s.design, 'commArchitecture', c)).includes('= ' + tot.reportDataMbit + ' Mbit/sol'), c);
  }
  const kit = text(DS.optionEffect(s, s.design, 'repairKits', 1));
  assert.ok(kit.includes(A.repairSuitKitMin + ' min') && kit.includes(A.repairSuitMin + ' min') && kit.includes('+' + A.repairSuitIntegrity), kit);
  const missed = text(DS.optionEffect(s, s.design, 'launchWindowCaught', false));
  assert.ok(missed.includes('$' + D.constants.synodicPeriod.missedWindowCostM + 'M') && missed.includes('morale ' + D.gameplay.launchWindow.moraleStartMissed), missed);
  const moxie = text(DS.instrumentEffect(s, s.design, D.instruments.find((i) => i.id === 'moxie')));
  assert.ok(moxie.includes(D.constants.sabatier.mavFuelPctPerBatch + '% MAV fuel'), moxie);
  const ing = text(DS.instrumentEffect(s, s.design, D.instruments.find((i) => i.id === 'ingenuity')));
  assert.ok(ing.includes(Math.round(D.terrain.sandPitSpeedFactor * 100) + '% speed'), ing);
});
