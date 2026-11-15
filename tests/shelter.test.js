/**
 * D-014 (proposed) — Ice cave: a walk-in shelter on the western route (no extra
 * cold or deep-cold heat loss, crises wait, suit O2 still drains) with clean ice that fills a 2 L bottle. The bottle is taken
 * by choice from the rack by the airlock, slows the walk while full (M4 notch included) and is poured
 * into the greenhouse.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load_core.js');

function landed() {
  const S = loadCore();
  const s = S.State.reset({});
  S.Sim.launch(s);
  S.Sim.land(s, null);
  for (const id of Object.keys(s.base)) if (S.Sim.deployAvailable(s, id)) s.base[id] = true;
  s.greenhouse.installed = true;
  s.greenhouse.frozen = false;
  return { S, s };
}

function standAt(S, s, m) {
  s.player.inside = false;
  s.player.zone = 'surface';
  s.player.x = m;
  S.Surface.syncFromState(s);
}

test('Shelter: inside the ice cave no extra cold, crises wait; O2 still drains', () => {
  const { S, s } = landed();
  const c = S.DATA.terrain.westRegion.shelterCave;
  const bz = S.DATA.terrain.westRegion.blizzard;
  const w = S.DATA.terrain.westRegion;
  assert.ok(c.toM < w.iceBarriers[0].atM, 'before the first ice block: reachable on an ordinary EVA');
  assert.ok(c.fromM > w.cold.deepColdFromM, 'in the deep cold, where the shelter matters');
  assert.ok(c.toM < bz.fromM, 'east of the blizzard');
  const mid = -(c.fromM + c.toM) / 2;
  // just outside the east mouth: blizzard and extra cold bite
  standAt(S, s, -(c.fromM - 5));
  assert.equal(S.Sim.inShelter(s), false);
  assert.ok(S.Sim.westCold(s).extraC < 0);
  assert.ok(S.Sim.westCold(s).bleedCPerMin > 0);
  // inside
  standAt(S, s, mid);
  assert.equal(S.Sim.inShelter(s), true);
  assert.equal(S.Surface.blizzard(s).k, 0);
  assert.equal(S.Sim.westCold(s).extraC, 0);
  assert.equal(S.Sim.westCold(s).bleedCPerMin, 0);
  assert.equal(S.Events.isCalm(s), true, 'crises wait in the shelter');
  const o2 = s.suit.o2;
  S.Sim.advance(s, 30);
  assert.ok(s.suit.o2 < o2, 'suit O2 keeps draining while hiding');
  // the shelter never applies in the habitat or the lava tube
  s.player.inside = true;
  assert.equal(S.Sim.inShelter(s), false);
});

test('Bottle: none at start, taken by choice at the rack, filled in the cave, 2 L', () => {
  const { S, s } = landed();
  const c = S.DATA.terrain.westRegion.shelterCave;
  assert.equal(S.Sim.bottle(s), null, 'the astronaut does not start with a bottle');
  assert.ok(S.Surface.INTERIOR.stations.some((st) => st.id === 'bottles' && st.action === 'bottle'), 'rack by the airlock');
  // no bottle: the ice vein says so and does nothing
  standAt(S, s, -c.veinM);
  let vein = S.Surface.interactables(s).find((it) => it.kind === 'ice_vein');
  assert.equal(vein.action, 'fill_bottle_none');
  assert.equal(S.Sim.fillBottle(s).errKey, 'bottle.err_none');
  // take one, fill it
  assert.equal(S.Sim.toggleBottle(s).taken, true);
  assert.equal(S.Sim.bottle(s), 'empty');
  vein = S.Surface.interactables(s).find((it) => it.kind === 'ice_vein');
  assert.equal(vein.action, 'fill_bottle');
  const t0 = s.totalMinutes;
  const r = S.Sim.fillBottle(s);
  assert.equal(r.ok, true);
  assert.equal(r.l, 2);
  assert.equal(S.Sim.bottle(s), 'full');
  assert.ok(Math.abs(s.totalMinutes - t0 - c.fillMinutes) < 1e-6, 'filling costs game minutes');
  assert.equal(S.Sim.fillBottle(s).errKey, 'bottle.err_full');
});

test('Carrying a full bottle slows the walk and raises the M4 notch', () => {
  const { S, s } = landed();
  const c = S.DATA.terrain.westRegion.shelterCave;
  standAt(S, s, -600);
  const v0 = S.Surface.speedFactor(s);
  const req0 = S.Sim.ponr(s).requiredO2;
  S.Sim.setBottle(s, 'empty');
  assert.equal(S.Surface.speedFactor(s), v0, 'an empty bottle weighs nothing');
  S.Sim.setBottle(s, 'full');
  assert.ok(Math.abs(S.Surface.speedFactor(s) - v0 * c.carrySpeedFactor) < 1e-9);
  assert.ok(S.Sim.ponr(s).requiredO2 > req0, 'slower walk home needs more O2');
});

test('Greenhouse: a full bottle turns the greenhouse into a watering spot; pouring tends it without habitat water', () => {
  const { S, s } = landed();
  S.Sim.setBottle(s, 'full');
  const gh = S.Surface.STRUCTURES.find((x) => x.id === 'greenhouse');
  standAt(S, s, S.Surface.pxToM(gh.px + gh.w / 2));
  const it = S.Surface.interactables(s).find((x) => x.id === 'greenhouse');
  assert.equal(it.action, 'water_gh');
  s.greenhouse.tendedSol = null;
  s.res.morale = 50;
  const water = s.res.waterL;
  const r = S.Sim.waterGreenhouse(s);
  assert.equal(r.ok, true);
  assert.equal(r.tended, true);
  assert.ok(s.res.morale > 50);
  assert.equal(s.res.waterL, water, 'habitat water untouched');
  assert.equal(s.greenhouse.tendedSol, s.sol);
  assert.equal(S.Sim.bottle(s), 'empty', 'the empty bottle stays in hand');
  // a second bottle on the same sol goes into the habitat tank
  S.Sim.setBottle(s, 'full');
  const r2 = S.Sim.waterGreenhouse(s);
  assert.equal(r2.tended, false);
  assert.equal(s.res.waterL, Math.round((water + 2) * 10) / 10);
  // frozen greenhouse: no pouring, bottle kept
  S.Sim.setBottle(s, 'full');
  s.greenhouse.frozen = true;
  assert.equal(S.Sim.waterGreenhouse(s).errKey, 'action.err_gh_frozen');
  assert.equal(S.Sim.bottle(s), 'full');
});

test('Rack: putting a full bottle back pours it into the habitat tank', () => {
  const { S, s } = landed();
  S.Sim.setBottle(s, 'full');
  const w = s.res.waterL;
  const r = S.Sim.toggleBottle(s);
  assert.equal(r.poured, true);
  assert.equal(S.Sim.bottle(s), null);
  assert.equal(s.res.waterL, Math.round((w + 2) * 10) / 10);
});
