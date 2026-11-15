# DECISIONS.md

The team's decision log. CLAUDE.md loads this file, so Claude sees it in every session.
If something is not recorded here, it has not been decided.

## How to use this file

- Add a decision only after the team has agreed on it, and write down who agreed.
- Statuses: `Proposed` (open for discussion), `Accepted` (agreed, build on it), `Superseded by D-XXX` (replaced by a newer decision).
- Never delete or rewrite an accepted decision. To change one, add a new entry and mark the old one `Superseded by D-XXX`.
- Keep entries short, a few lines each. Link to details (an issue, a doc, a sketch) when needed.
- Number entries in order: D-001, D-002, ... If two PRs use the same number, the one merged later renumbers.
- Change this file in its own commit, through a PR, and tell the team.
- Claude may draft `Proposed` entries when asked. Only the team marks an entry `Accepted`.

## Template

```
### D-XXX: <short title>
- Status: Proposed | Accepted | Superseded by D-XXX
- Date: YYYY-MM-DD
- Agreed by: <names>
- Decision: <what we chose, in one or two sentences>
- Why: <main reason, and the options we rejected>
- Affects: <files, parts of the game, or people>
```

## Open questions

Still open:

- Member names for K1–K6.
- The real submission deadline at the Sakarya local event. K1 confirms it with the local organizer.

Covered by a proposal below. Each one closes when the team accepts that entry:

- Platform and tech stack → D-002
- Game format, session length, target player, mission type → D-001
- Which constraints the game models and how → D-001, D-003
- Data sources and where game data lives → D-003
- How success is measured and how the game explains a failure → D-006
- Minimum scope, checkpoints and feature freeze → D-005
- Demo format, who prepares it, who owns the submission page and REFERENCES.md → D-004, D-007
- Who owns which part of the project → D-004

## Decision log

Sources: the design document "SOL 14: Red Horizon v2" and the K1–K6 task cards (2026-11-14). All entries below are `Proposed` until the team agrees.

### D-001: Game concept "SOL 14: Red Horizon"
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: The player designs a crewed Mars mission on Sol 0 (objective, launch vehicle and trajectory, landing site, power, battery, insulation, up to 5 of 9 instruments, comms architecture, spare kits, mass margin), then lives with its consequences for 14 sols. Two main tasks: forensic investigation of lost landers (Opportunity, Spirit, Phoenix, InSight, Beagle 2 bonus) and a science experiment loop. Ends with a cause-and-effect report card compared to real missions.
- Format: single-player, for students. The surface runs in real time (1 sol ≈ 2 minutes), so a full run takes about half an hour; `?demo` reaches the finale in 5 minutes.
- Why: Covers every concept the challenge names (objectives, spacecraft, instruments, launch vehicles, budget, power, mass, comms, orbit) with a visible screen or number, and shows how each choice shapes success.
- Affects: whole game

### D-002: Tech stack and hosting
- Status: Superseded by D-011
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Vanilla JavaScript + HTML5 Canvas, no framework, hosted on GitHub Pages. Runs locally with `python -m http.server 8000` (`python3` on macOS/Linux). Tests run with `node --test` (Node 22+ rejects a folder argument, so no `tests/`). Seeded RNG so the same seed gives the same run. Progress is saved to `localStorage` so a page reload continues the run.
- Why: Judges open it from one link in a browser with no setup. Rejected: React/Phaser (extra build and dependencies), Godot web export (heavier, fewer people can work on it).
- Affects: repo structure, deploy

### D-003: Shared contracts
- Status: Superseded by D-011
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: K1 publishes these names before the vertical slice, and everyone builds against them:
  - State: one `gameState` in `src/core/state.js`. New fields: `design{}`, `decisionLog[]`, `dataBudget{perSol, used, queue[]}`, `forensics{}`, `experiments{}`, `flags{anomalyPhotos, cameraTier}`, `score{}`.
  - Event bus (`src/core/bus.js`): `decision:open`, `decision:made`, `downlink:queue`, `downlink:sent`, `forensics:diagnosed`, `experiment:result`, `power:shed`, `ufo:start`, `minigame:open`. Effect events, emitted by K2 and drawn by K4: `storm`, `quake`, `frost`, `hallucination`, `ufo`.
  - Numbers: `src/data/nasa_data.json`. Every number is an entry `{value, unit, src, verified}` (tables are arrays of rows whose numeric fields are entries; group names follow K3's design screen: `rules`, `launchVehicles`, `trajectories`, `landingSites`, `powerSources`, `batteries`, `insulation`, `instruments`, `comms`, `spareKits`). `src` is the source URL, `game: ...` for a game rule, or `PLACEHOLDER` while unresearched, and then `value` is `null`: no estimates (enforced by `tests/nasa_data.test.mjs`). Design: `state.design = {objectiveId, rocketId, trajectoryId, siteId, powerId, batteryId, insulationId, instrumentIds[], commsId, spareKitsId}` (K3); `evaluateDesign(design, data)` in `engineering.js`. Surface simulation sub-objects `time`, `power`, `env`, `life`, `events` follow K2's `survival.js`. Balance is tuned only through its `rules` group. Experiment settings live in `src/data/experiments_config.json` and refer to `nasa_data.json` keys.
  - Formulas: only in `src/core/engineering.js`, as pure functions tested in `tests/engineering.test.mjs`.
  - Text: all player-facing text in `content/story.json`, shaped `{ "en": {"key": "text"}, "tr": {...} }`, read with `t('key', vars)` from `src/core/i18n.js`. `{name}` in a text is filled from `vars`. A missing key shows the key itself.
  - Scenes: a scene module's default export is `{ enter(ctx), exit?() }` with `ctx = {state, data, bus, t, goTo, canvas, ui}`. Flow: `title → design → surface → ending`; `src/main.js` shows a placeholder while a scene file is missing. `?scene=<name>` and `?seed=<n>` for testing.
  - Data access: `value('mars.gravity')`, `rows('instruments')`, `row('instruments', 'moxie')` from `src/core/nasaData.js`. Random numbers: `createRng(state.seed)` from `src/core/rng.js`, never `Math.random()` for gameplay.
  - Records: decision log entry `{sol, eventId, choice, effects: [...]}` · score via `addScore(category, points, reason, cause?)`, where `category` is `forensics | experiments | survival | massMargin | lostSystems`, `reason` is a story key and `cause` is the choice behind it (`'design.power.battery_kWh'` or `'decision.<eventId>'`), so the report card can link choice → consequence → points · run totals in `state.stats {energyUsed_kWh, oxygenProduced_kg, dataSent_Mbit, solsSurvived}` · final outcome in `state.outcome` (`hero | colonist | explorer | lost`), set by K2 · downlink packet `{type, id, mbit, points}` · event `{id, trigger(state), effect(state), decision?}`.
  - Mini-games: `bus.emit('minigame:open', {template, config, onDone})` with templates `align`, `wiring`, `qte`, `converter`. `onDone` receives `{success, score, timeUsed}`.
  - Sprites: 48×48 grid. K4 publishes file names and frame counts.
- Why: Six people can build in parallel against fixed names, and every number stays traceable to a source.
- Affects: all code

### D-004: Roles and file ownership
- Status: Superseded by D-011
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Only the owner edits a role's files. If you need a change in someone else's file, ask the owner or ask for a bus event.
  - **K1 Lead / System architect:** `index.html`, `src/main.js`, `src/core/` (`engineering.js`, `state.js`, `nasaData.js`, `bus.js`), `src/data/nasa_data.json`, `src/scenes/ending.js`, `tests/engineering.test.mjs`, `scripts/`. Repo and Pages, integration, cause-and-effect report card, `?demo` mode and save, balance, portal submission. Has the final say on scope and priority.
  - **K2 Gameplay / Survival simulation:** `src/systems/survival.js`, `events.js`, `sanity.js`, `power.js`, `src/scenes/surface.js`. Movement, day/night, energy, heat, O2, greenhouse, crisis events, decision-card logic, load shedding, point of no return, delayed Mission Control, UFO trigger, Sol 14 final sequence. Plays the live demo.
  - **K3 UI / Mini-games:** `css/style.css`, `src/scenes/design.js`, `src/ui/` (`hud.js`, `alarms.js`, `decisionCard.js`, `downlink.js`, `powerPanel.js`), `src/minigames/`. Sol 0's five screens, HUD and telemetry, decision cards, downlink queue, power panel, mini-game templates, TR/EN switch.
  - **K4 Pixel art / VFX:** `assets/sprites/`, `src/fx/` (`effects.js`, `sprites.js`). Style guide, astronaut, habitat, five wrecks, MAV, background, effects, UFO scene, cover image.
  - **K5 Story / Science validation / Audio / Presentation:** `content/story.json`, `src/systems/audio.js`, `assets/audio/`, `docs/`. All texts in TR and EN, checks the wreck cases and experiments against NASA sources, CC0 sounds, project page, slides, video. Keeps REFERENCES.md, the single source log (the task card calls it `docs/sources.md`).
  - **K6 Science gameplay / QA:** `src/systems/forensics.js`, `src/systems/experiments.js`, `src/data/experiments_config.json`, `tests/science.test.mjs`, GitHub Issues. Forensics loop, six experiments, Beagle 2 bonus, full-run testing. Files every bug and assigns it to its owner.
  - Step-by-step tasks for each role are on the K1–K6 task cards. Member names are still to be filled in.
- Why: Follows the task cards handed to the team; separate file areas keep six people from colliding. Critical path: K1's state, bus and data → K2 and K6 → K3. Replaces the earlier draft in which K5 owned the data and K1 had no code area.
- Affects: everyone

### D-005: Minimum scope and cut order
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Required: M1 downlink data budget, M2 decision cards + log, M3 power load prioritization, M4 point-of-no-return indicator, M5 cause-and-effect report card. Also planned: M7 delayed Mission Control (K2) and M9 `?demo` quick mode (K1). Only if time allows: M8 single-point-of-failure warning. Already cut: playable space transit (C1), sol planning screen (M6 / C4), live Horizons calls (C7, a precomputed table in `scripts/` instead). Cut next if behind: extension mode (C2), extra sanity effects (C3).
- Checkpoints, in order: vertical slice (Sol 0 → landing → one wreck's forensics loop → pendulum experiment → night-freeze card) → alpha (everything runs end to end, no crashes) → content lock (no new text or features) → feature freeze (bug fixes only) → live build + video → submission. Times are on the task cards.
- Why: 48 hours. One mission that plays well from start to finish beats a wide unfinished one.
- Affects: scope, schedule

### D-006: Scoring and loss conditions
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Mission Success Score = forensic reports + experiment results (only those that reached Earth) + survival + mass-margin bonus − lost systems. Minimum success: 2 reports + 2 experiments sent. Full success: 4 reports + 4 experiments + safe return. Forensics: correct diagnosis 100, wrong but all 3 clues collected 50, clues missing 20, report not sent 0; Spirit accepts Mechanical or Thermal. An experiment succeeds when the measured value is within ±10%. Loss: O2 at zero, body temperature below the critical threshold for 2 game-hours, cumulative radiation dose over the mission limit, or sanity at zero. The report card is shown on loss too. The UFO scene is a labeled fictional epilogue resolved by camera tier and remaining data budget.
- Why: NASA-style minimum/full success thresholds, and only data that reached Earth counts, which makes the comms trade-off matter.
- Affects: K1, K2, K3, K6

### D-007: Demo and submission
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: The Project Demo is a 30-second video with English subtitles, made by K5 with K4: 0–5 s team and challenge · 5–12 s Sol 0 with the mass bar turning red · 12–20 s storm, decision card and wreck diagnosis · 20–25 s report card · 25–30 s UFO scene. K5 also writes the English project page (Summary · How it addresses the challenge · NASA data used · Engineering trade-offs · Scientific corrections · Team · AI disclosure, plus a note that the UFO scene is fiction) and 7 English slides. K1 submits on the portal and opens every link in a private window first. At the local event, K2 plays the live demo with `?demo` and K5 presents from a Turkish script.
- Why: The submission guide limits the demo to a 30-second video or 7 slides and requires English. A video shows the trade-offs moving, which slides can't.
- Affects: K1, K2, K4, K5

### D-008: Game time runs slower during an EVA
- Status: Accepted
- Date: 2026-11-14
- Agreed by: team (reported by Sude, K2)
- Decision: Inside the habitat, 1 sol stays about 2 minutes of real time (D-001). While the astronaut is outside, game time runs slower: 1 real second = 1 game minute (`time.evaGameSecondsPerRealSecond` = 60 in `nasa_data.json`, tuned there, flagged simplified). Every system (Sun, temperature, battery, O2) keeps running on the one game clock; only its rate against real time changes. Walking speed and suit O2 use stay real-world values in game time. Actions measured in game hours (experiments, waits on cards) cost the same inside or outside. The game and the project page say that time is compressed.
- Why: At the inside rate a 900 m walk lasts about 1 real second, so the point of no return (M4) never comes into play. Rejected: making the map distances kilometres long (still about 1 s on screen, and it changes the map), and leaving it as it is (M4 and the "can I still make it back?" scene would not work).
- Affects: K2 (`survival.js`, `surface.js`), K1 (`nasa_data.json`, session length, `?demo`), K3 (HUD can show the slower clock)

### D-009: Game values where no source exists
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending; K1 decided)
- Decision: Real-world numbers are researched first; when no official value is published, K1 sets a game value and labels it in `nasa_data.json` with `src: "game: K1 decision D-009 ..."` and `simplified: true`. Set this way: costs without a public unit price (budget 500 M$), panel area 250 m², battery options 150/200/300 kWh, O2 reserve 15.4 kg (14 sols of BVAD use + 20%), habitat cooling time 10/20 h, base mass 0 (DRA 5.0 pre-deploys habitat and ascent vehicle), insulation and spare-kit masses, fast-transfer propellant, some instrument data volumes, X-band hardware mass, engine-heating energy. Every such value is listed under "Simplified values" in REFERENCES.md. No estimate is ever presented as a measured value.
- Why: The game needs a number to run, the team rule forbids passing estimates off as real data, and the judges score Validity.
- Affects: `src/data/nasa_data.json`, REFERENCES.md, project page

### D-011: The v3 game ("new") replaces the earlier code
- Status: Proposed (applied to `main` on K1's instruction; team to confirm)
- Date: 2026-11-14
- Agreed by: (pending; K1 decided)
- Decision: The complete v3.0.0 game from the `new` folder (2D pixel-art side-scroller, classic `<script>` + `window.SOL14`, `tools/build.js` data and asset build, 45 tests) is the source of truth for game design and behaviour and replaces the earlier code on `main`. Everything in the folder is kept in the repo, including `_legacy/`, the original root PNGs, PDFs and menu reference images. Roles, file ownership and module contracts now follow `AGENTS.md`; architecture follows `CLAUDE.md` ("Real architecture") and `ARCHITECTURE.md`. Unmerged team work built on the earlier code (K2, K3, K4 branches) is not merged; the team continues on v3.
- Follow-up: v3 numbers that conflict with their stated sources are labelled honestly under D-009 (fixed where gameplay allows, otherwise marked as game values) without changing game balance.
- Supersedes: D-002, D-003, D-004. D-001, D-005, D-006 and D-007 still describe the goals; where v3 differs (e.g. 20/40/60 kWh batteries, scoring details, EVA timing in D-008), v3 wins.
- Why: K1 chose the v3 game as the stronger, complete version to submit.
- Affects: everyone; all game code, data, assets and docs

### D-012: Base-centred two-way map, lava-tube sub-map and landing cutscene
- Status: Accepted
- Date: 2026-11-15
- Agreed by: team (reported by Bedirhan)
- Decision: The surface map is centred on the base (0 m) with two routes. Left (−120 → −450 m): Icy Plain and Glacier Edge with 4 breakable ice clusters, 2 of them hiding a relic (inspect → break → photograph → collect; plain ice gives a science sample); broken ice and collected items persist in the save. Right: First Wreck (Opportunity, +180 m, photo tutorial), Wreck Field (Spirit, +360 m, "which part is still reusable?" engineering decision), Rocky Approach (sand pit + boulders to jump), lava-tube skylight at +600 m with ladder, beacon and comms relay. The tube is a separate sub-map (ladder base + relay, first-passage crack, layered basalt, last rock chamber with 3 short studies: temperature comparison, chamber span, vibration test whose result is open to interpretation and never a "safe" verdict); there is no second exit, finds are reported via the relay at the ladder base. A report is any find report that reaches Earth: 2 wreck reports + 2 relic reports (filed on entering the habitat) + 1 lava-tube survey; success thresholds are unchanged. InSight, Phoenix and Beagle 2 stay in the data but are not on the map. The game opens with a skippable (Space/Esc) lander touchdown at the base landing pad, then hands control to the player. The HUD shows only the active target's direction and distance plus the way home.
- Why: A small, complete exploration loop that teaches one mechanic per area without empty walking. The lava tube is fictional (known Mars skylights are on Arsia Mons); this is labelled in the game. Rejected: lowering the report thresholds to 2 wrecks (ice and cave finds would not count).
- Affects: `data/nasa_data.json` (terrain.map, boulders), `data/explore_config.json` (new), `data/forensics_cases.json` (activeCaseIds, Spirit salvageChoice), `src/systems/explore.js` (new), `src/fx/lander.js` (new), `src/core/surface.js`, `sim.js`, `state.js`, `objectives.js`, `score.js`, `src/ui/hud.js`, `science_panels.js`, `src/fx/effects.js`, `art.js`, `src/main.js`, `content/story.json`, tests

### D-013: Vehicles are found by exploring: east lava plain with digging and a lava tube, west glacier
- Status: Proposed (applied on K1's instruction, 2026-11-15; team to confirm)
- Date: 2026-11-15
- Agreed by: (pending; K1 decided)
- Decision: Vehicles no longer appear when the player walks near them. There is no automatic discovery: wrecks are not revealed within 160 m, and Ingenuity no longer reveals them.
  - Every wreck is buried and appears only when its dig site is dug out with E. Each swing costs game minutes.
  - The suit scanner pings and the astronaut kneels only next to something real; decoy mounds come up empty. RIMFAX senses buried sites from farther away. Ingenuity keeps the sand-trap routing.
  - East, lava plain to +1400 m: dried lake bed, dunes, crater field and lava plain.
    - Opportunity and InSight are buried at the end of their trails.
    - A rubble-sealed skylight must be dug open before the lava tube can be entered.
    - The tube holds the fictional SCOUT-1 rover's five parts, photographed with FIELD CAM.
  - West, glacier to the ice wall at −5000 m (K2's western ice field): cold, a blizzard and ice barriers.
    - Spirit, Phoenix and Beagle 2 are frozen in.
    - A fictional cargo lander and the Deep Space 2 probe are on this route.
    - D-012's four ice clusters move onto the ice field.
  - All five cases are on the map.
  - Goals never name an undiscovered vehicle.
  - Free payload mass above 15% adds +4 kg O₂ and +10 L water at landing (K4's cargo bonus, game values).
- Why: The player asked for exploration, decisions and interaction instead of ready-made vehicles, with two routes that play differently. It builds on the three archives (K2 glacier, K3 buried wrecks and tube rover, D-012 map and UI). Rejected: keeping D-012's visible wrecks on the right route.
- Changes D-012: the wreck positions, "InSight, Phoenix and Beagle 2 are not on the map" and the −450 / +600 m bounds. D-012's base-centred map, lava-tube sub-map, ice loop and landing cutscene stay.
- Affects: `data/nasa_data.json` (terrain.map, westRegion, gameplay.cargoBonus), `data/explore_config.json` (dig, cave.scout, westFinds, fieldCam), `data/forensics_cases.json`, `src/systems/explore.js`, `src/systems/forensics.js`, `src/core/surface.js`, `objectives.js`, `sim.js`, `state.js`, `src/fx/dig_fx.js`, `westlands.js`, `effects.js`, `src/ui/field_cam.js`, `cutscenes.js`, `hud.js`, `science_panels.js`, `design_screens.js`, `content/story.json`, tests

### D-014: Glacier ice cave: shelter and a water bottle carried to the greenhouse
- Status: Proposed
- Date: 2026-11-15
- Agreed by: (pending; proposed by Sude, K2)
- Decision: A walk-in ice cave deep on the western glacier, past the existing sealed cave (−1460 m) and the Phoenix site, before the glacier and its ice blocks (−1920 … −2020 m, game value; moved closer so a round trip fits an ordinary EVA).
  - Shelter: the ice-field path runs through it, so the player simply walks in. Inside, the west's extra cold and deep-cold suit heat loss stop (the blizzard starts further west, at −2700 m), and crises wait. Suit O₂ keeps draining, so the player cannot stay forever.
  - Bottle: the astronaut does not start with one. Taking an empty bottle from the wall rack by the airlock inside the habitat (E) is the player's own choice; E there again puts it back. It is a one-slot inventory item, drawn in the astronaut's hand while carried.
  - Water: inside the cave, the player chips ice into the bottle: 2 L (game value).
  - Carrying cost: a full bottle slows walking (suggested 80% speed, game value, team to tune). Suit O2 keeps draining with game time, so the slower walk home costs more O2, and the M4 point-of-no-return calculation includes the slowdown.
  - Delivery: at the greenhouse, E plays a short watering animation (kneel, tip the bottle). If the greenhouse was not tended that sol, this tends it (same morale as tending) without using habitat water; otherwise the 2 L go to the habitat tank. The empty bottle stays in hand.
- Why: The player asked for a place on the ice route to hide and survive, with a reward worth the risky walk back. Real basis: Phoenix found water ice just under the surface, and buried ice is exposed at scarps (JPL). A walk-in Mars ice cave is FICTIONAL and labelled as such in the game. Options considered: reuse the sealed cave at −1460 m as the shelter (smaller job, but too close to base); a simple ice-overhang shelter (no "hiding" feel).
- Open: the exact slowdown value. A checkpoint retry returns the bottle to its state that morning (built that way, team to confirm).
- Affects: `data/nasa_data.json` (terrain.westRegion.shelterCave), `src/core/sim.js`, `events.js`, `surface.js`, `src/main.js` (E actions), `src/fx/westlands.js` (cave, bottle, rack, watering), `effects.js` (three draw hooks), `content/story.json`, `tests/shelter.test.js`
