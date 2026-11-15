# CLAUDE.md — SOL 14: RED HORIZON

Shared instructions for the whole team and for Claude. Team decisions live in DECISIONS.md; roles, file ownership and the five module contracts live in AGENTS.md. Both are loaded here:

@DECISIONS.md
@AGENTS.md

## Project context

- Event: NASA Space Apps Challenge 2026, a 48-hour hackathon on Nov 14–15, 2026.
- Challenge: Space Mission Design Game.
- Goal: an interactive game where players design, manage and simulate a complete space mission, from concept to operations. Players make engineering decisions, manage limited resources, and see how each choice shapes mission success.
- Competing demands named in the challenge: mission objectives, spacecraft design, science instruments, launch vehicles, budget, power, mass, communications and orbit constraints.
- Audience: students who rarely get to attempt a whole mission. The game should make these trade-offs concrete instead of abstract.

The game is version 3.0.0: a 2D pixel-art side-scroller. `Sol 0` design → `Sol 1–14` surface operations → cause-and-effect report card + UFO epilogue (D-011). Anything beyond this (platform, stack, mechanics, scope) is decided by the team and recorded in DECISIONS.md. If it is not recorded there, it has not been decided.

## Commands

```sh
npm test                       # = node tools/build.js data && node --test "tests/*.test.js"
node tools/build.js data       # data/*.json + content/story.json -> src/data/nasa_data.js, story.js
node tools/build.js assets     # assets/** -> assets/processed/** (chroma-key, crop, downscale)
npm start                      # npx serve . -l 8080   (or: python -m http.server 8080)
```

- `http://localhost:8080/?demo=1` is the judges' quick mode (5 sols); `?lang=en` starts in English.
- The game must also run by double-clicking `index.html` (`file://`).
- `node --test` on Node 22+ wants a **glob, not a folder**: `node --test "tests/*.test.js"`.
- No Node on a machine? VS Code's Electron can run as Node: set `ELECTRON_RUN_AS_NODE=1` and call `Code.exe tools/build.js data`. In PowerShell pipe the output through `| Out-String` or it is lost.
- Browser check: Edge headless (`msedge --headless=new --allow-file-access-from-files --virtual-time-budget=5000 --screenshot=...`). Modal and toast entry animations come out half transparent in screenshots; inject `*{animation:none!important}` when checking.
  - To reach a screen, write a temporary copy of `index.html` with an extra `<script>` that drives `window.SOL14` (for example `S.Game.newGame(false); S.Sim.launch(s); S.Sim.land(s, null); S.Game.enterWorld()`), screenshot it, then delete the copy.
  - `--dump-dom` does not wait for the virtual-time budget, and headless `requestAnimationFrame` runs only a few frames. For frame-accurate checks, step the loop by hand (`S.Surface.update` → `S.FX.render` → `S.HUD.syncWorld` with a fixed `dt`) and print the result into the page before taking the screenshot.

## Real architecture (where it differs from the design docs)

- **Not ES modules.** `ARCHITECTURE.md`, `API.md` and ADR 0001 say ES modules, but the code uses classic `<script>` files and the `window.SOL14` namespace (`S` for short). Every file is an IIFE: `(function (S) { ... })(window.SOL14 = window.SOL14 || {})`. Do not use `import`/`export`, `fetch` or runtime `getImageData`: they fail under `file://`.
- **Script order matters.** Keep the order in `index.html` and the `CORE_SCRIPTS` array in `tests/helpers/load_core.js` in sync. Update both when adding a file. Core and systems files must not touch the DOM: the tests run them DOM-less in a `vm` context.
- **Shared core `src/core/base.js`:** `S.bus` (on/emit), `S.t(key, vars)` (`{name}` placeholders; a missing key shows the key), `S.util`, `S.makeRng(seed)` (deterministic RNG: use it instead of `Math.random` for QA).
- **Generated files, never edit by hand:** `src/data/*.js` (build data) and `assets/processed/**` + `manifest.json` (build assets). Change the source JSON or PNG and rerun the build.
- Data: `data/nasa_data.json` + `forensics_cases.json` + `experiments_config.json` + `events_catalog.json` merge at build time into one `S.DATA` object (`DATA.forensics`, `DATA.experimentsCfg`, `DATA.events`).
- DOM backgrounds use the `--bg:url(...)` CSS variable, so `S.Sprites.screen()` returns an **absolute URL** (relative `url()` resolved against `styles/` and 404'd).
- The audio engine (`src/fx/audio.js`) opens no AudioContext before the first click or key press (avoids autoplay warnings).
- Internal resolution is a **640×360** canvas; sprite sizes are set in the `ASSETS` manifest in `tools/build.js`. Full-screen scenes are 960×540.
- Scene flow (`src/main.js`): `loading → menu → design → transit → world → ending → report`.

## Folders

- `assets/`: original images (build input) and `assets/processed/` (what the game loads). The old root copies and the v2 `_legacy/` folder were removed; both are in git history.
- `docs/design/`: design sources: PDFs (design doc v2, roadmap, K4 task card), `menu-references/` (menu UI reference images), `ai-image-prompts.md` (image prompt library), `prompt-panel-cleaning-and-watering.md` (panel-cleaning and watering task spec).

## How decisions are made

Planning is a team activity. Nobody, human or Claude, sets the direction alone.

Needs a team decision (record it in DECISIONS.md before building on it):
- Tech stack, engine or framework, platform, hosting
- Game rules, scoring, win/lose conditions, progression
- Which mission constraints are modeled and how (formulas, level of detail)
- Shared data formats, folder structure, interfaces between parts
- Adding a major dependency, or removing/renaming something other people use
- Scope changes: adding a feature to the demo or dropping one

Decide it yourself (no need to ask):
- Implementation details inside your own task: names, internal structure, helper functions
- Styling and text inside your own screen or component, unless a decision says otherwise
- Small libraries that only your part uses (mention them in your PR)

If you can't tell which list something belongs to, ask in the team chat. A two-minute question costs less than a two-hour rework.

## Git workflow

- `main` is the shared version and must always work. Never commit or push directly to `main`.
- Everyone works on a branch named after themselves: first name in lowercase ASCII letters (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u). Example: `enes`. If two members share a first name, add the surname initial (`enes-s`).
- For a second branch for parallel work, use `name-topic` with a hyphen, for example `enes-orbit-ui`. Don't use `name/topic`: git can't hold `enes` and `enes/...` at the same time.
- Push only to your own branches. Never commit to, rebase or force-push someone else's branch. Never force-push `main`.
- Sync often: run `git pull origin main` on your branch every few hours and always before opening a PR. Resolve conflicts on your branch, not on `main`.
- **Sync before you start (humans and agents).** Before starting any task, and again before committing, run `git fetch --all --prune` and check for new pushes on `main` and on your own remote branch (`git log --oneline HEAD..origin/main`, `git log --oneline HEAD..origin/<your-branch>`). If there are new commits, bring them in without losing either side's work:
  1. Never discard or overwrite local work: no `git reset --hard`, `git checkout -- .`, `git clean`, `git push --force` or "take theirs/ours for the whole file" to get past a conflict.
  2. With uncommitted changes, first commit them (or `git stash push -u`), then `git merge origin/main` (and `origin/<your-branch>` if it moved). Re-apply a stash with `git stash pop`.
  3. Resolve conflicts hunk by hunk so both changes survive. If two changes really contradict each other, stop and ask the user (or the file's owner, AGENTS.md §1) instead of choosing one.
  4. Generated files (`src/data/*.js`, `assets/processed/**`): don't hand-merge them; take either side, then rebuild (`node tools/build.js data` / `assets`).
  5. Run `npm test` after the merge and before continuing.
- Changes reach `main` through pull requests. Small, frequent PRs beat one big PR at the end.
- Merge with "Create a merge commit", not "Squash and merge". Personal branches keep living after a merge, and squashing makes later PRs show old changes and conflicts.
- A PR that touches shared files (listed below) or the shared game model needs a quick OK from one teammate. A PR that only touches your own area can be merged by you once the project runs.
- Before merging, check that the project starts and the main game flow still works.
- If `main` breaks, fixing it comes first. Whoever merged the breaking change fixes it or reverts it.
- Commit messages: short, English, imperative ("Add launch vehicle picker"). A role prefix and type from `CONTRIBUTING.md` (`[K2] feat: ...`) or plain `feat:`, `fix:`, `docs:` are welcome but optional.
- Shared files: `package.json`, the entry point (`index.html`, `src/main.js`), `src/core/base.js`, `src/core/state.js`, `tools/build.js`, `tests/helpers/load_core.js`, global config, CLAUDE.md, AGENTS.md and DECISIONS.md. REFERENCES.md is shared too, but anyone may append a line to it without asking. For the others, tell the team before you edit one, keep the change small, and commit it on its own.
- Never commit secrets (API keys, tokens, `.env`). Personal notes go in `CLAUDE.local.md`, which is gitignored.

## Working rules

- Numbers live in data, not in code: `data/nasa_data.json` (and the other `data/*.json`), each with a `src` URL. Values scaled for gameplay are flagged `simplified: true` with a note giving the real figure; their `src` then points to where that real figure is published (D-009). Never present a game value as a measured one. A value without a source does not go into the game.
- Stub first, then the real thing. Hand over a correctly shaped placeholder early so nobody waits on you. Placeholder numbers are marked as placeholders, and none may remain at content lock.
- Edit only the files your role owns (AGENTS.md §1). If you need a change in someone else's area, ask the owner or emit a bus event.
- Player-facing text is not hard-coded in code. It lives in `content/story.json`, in both `tr` and `en`, read with `S.t('key')`. `tests/data_integrity.test.js` checks every key used in code and data.
- State lives only in `gameState` (`src/core/state.js`); modules trigger each other with `S.bus.emit(...)`.
- Mini-games are called as `await runMinigame(type, config)` → `{ success, score, timeUsed }`, and each needs an ESC/cancel path.
- Scientific accuracy: night about −80 °C, thin atmosphere (~0.6 kPa, no "hot air" → radiator failure instead), quakes up to ~M4.7, 0.38 g, Pu-238 does not make fuel (RHU + Sabatier), no harvest within 14 sols (germination experiment only), light delay 3–22 min, blue sunset.
- Pixel art: `image-rendering: pixelated`, no blurry scaling, no text or HUD baked into images.
- Anything fictional or compressed for gameplay (a compressed map, a fictional scene) is labeled as such in the game and on the project page.
- REFERENCES.md is the single log for sources, licenses and AI use. Don't start a separate licenses file.
- A feature is done only when `npm test` passes, it works on `main` and on the live deploy (also via `file://`), at least one other person has tried it, and the data/validation owner has checked its numbers and texts.
- Stuck for more than 15 minutes? Ask in the team chat.
- After content lock, no new features or text: new ideas go to a "next version" list. After feature freeze, only game-breaking bugs are fixed.

## Language

- Code, comments, commit messages, PRs, issues and repo docs are in English.
- Team chat and conversations with Claude can be in any language. Claude replies in the language it is addressed in.
- The v3 design docs (`README.md`, `ARCHITECTURE.md`, `API.md`, `DESIGN.md`, `PLAN.md`, ...) are in Turkish. The submission texts in `docs/submission/` are in English.

## Rules for Claude

- Build on the accepted decisions in DECISIONS.md and never contradict them.
- If a task needs something from the "Needs a team decision" list that isn't in DECISIONS.md, stop and say so. Offer 2–3 options with short trade-offs. Add them as a `Proposed` entry only if the user asks. Never mark an entry `Accepted` unless the user says the team agreed.
- Stay inside the current task and the user's own area. No drive-by refactors in files other people are working on.
- At the start of every session and before every commit, do the "Sync before you start" check from the Git workflow. Fetching and merging remote work into the current branch is allowed without asking; pushing still needs the user's request.
- Don't commit, push, merge or open PRs unless the user asks. When you do, follow the Git workflow above.
- Don't add AI attribution (co-author trailers, "Generated with" lines) to commits or PRs.
- Real-world values (launch vehicle capacity, mass, power, cost, data rates, orbital parameters) need a source. Cite it in a code comment and in REFERENCES.md. If a value is simplified for gameplay, label it as simplified. Never invent figures and present them as real.
- Keep the game understandable for students: every trade-off should be visible to the player through clear feedback, not hidden in the code.
- Before saying a task is done, run the project and check that the change works.

- When you add an external resource (data, code, library, image, sound, 3D model) or produce AI-generated content, add a line to REFERENCES.md in the same change.

## How the project is judged

Judges score five criteria. Use them to settle "is this worth building?" questions.

- Influence: how much positive impact the project can have, and for how many people.
- Creativity: how novel the approach is.
- Validity: scientifically sound, does what it claims, could work in the real world.
- Relevance: answers the challenge, is complete, technically feasible and usable.
- Presentation: tells the story clearly (the challenge, the solution, why it matters).

For this challenge that means: real trade-offs backed by sourced numbers (Validity), a full concept-to-operations loop that a student can actually play (Relevance), and a demo that explains itself (Presentation).

## Submission requirements

Taken from the Space Apps Judging & Awards Guide and Project Submission Guide. The demo format and deadline below come from last year's submission guide: confirm them in the 2026 guide on day one.

- Team size is 1 to 6 registered members. Everyone must be on the team page.
- The submission page and everything linked from it must be in English. A video demo may be in another language only with English subtitles.
- Project Demo: a video of up to 30 seconds, or a slide deck of up to 7 slides, hosted on a public link.
- Deadline: Sunday 23:59 in the Local Event's time zone. Late submissions are not judged. Submit early and edit afterwards.
- Required form fields include: summary, demo link, final project link, detailed description, NASA data used, other data used, and use of AI.
- Every external resource, including open-source code and free assets, must be listed in the References field. No copyrighted music, images or text without permission.
- AI tools are allowed but must be disclosed: where and how they were used. AI-generated images and videos need a visible watermark. AI-generated content must not contain or modify NASA logos, flags or mission identifiers.

REFERENCES.md is the running log for all of this. Keep it current so the submission form can be filled in from it in minutes.

## Things to watch

- Time: the hackathon lasts 48 hours. A simple demo that works beats an ambitious one that's unfinished. Keep time free at the end for the demo and the submission form.
- Depth over breadth: one mission that plays well from start to finish beats five half-built ones.
- Check the Space Apps brand guidelines before using NASA or Space Apps logos.
- Keep the README's run instructions up to date so any teammate, or a judge, can start the project.
- The final project link must open for a judge without setup problems. Test it from a clean machine or a private browser window before submitting.

## Game dev skills (team plugins)

`.claude/settings.json` adds the `awesome-gamedev-agent-skills` marketplace (github.com/gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0) and enables its `workflows` and `disciplines` plugins. Claude Code offers to install them when you open the repo; accept, or run `/plugin` to review. Useful ones: `game-jam`, `game-ui-ux`, `game-feel`, `level-design`, `save-systems`, `performance-optimization`. They are plain instruction files with no hooks or scripts. Use them for UX, feel and pacing; real-world numbers still come only from sourced data (D-009).

## Optional: i-have-adhd skill

`.claude/skills/i-have-adhd/` makes Claude answer action-first: the next step first, numbered steps, no filler. It is off by default. Turn it on with `/i-have-adhd` and off with "stop adhd mode". Source: github.com/ayghri/i-have-adhd (MIT License).

## Environment notes

- The project path can contain spaces and Turkish characters (e.g. `Masaüstü`): always quote paths.
- On Windows, both PowerShell and Git Bash are used; `npm test` works in either.

## Status snapshot (2026-11-15)

Carried over from the v3 source:
- `content/story.json`: TR/EN with matching placeholders. When adding text, add both languages; `tests/data_integrity.test.js` checks every key in code and data catalogues.
- `tests/`: `engineering`, `data_integrity`, `qa_profiles` (3 TESTING.md profiles + demo, headless via `tests/helpers/bot.js`), `rhythm`, `explore`, `design_choices` → 82/82 pass (2026-11-15, after the workshop).
- Test gotcha: objects created inside the `vm` context have a different `Object.prototype`, so `assert.deepStrictEqual(x, {})` fails on an empty object from the core. Compare keys or values instead.
- Shuttle workshop and inventory (ux-plan #8 follow-up, 2026-11-15): the astronaut lives in the lander (door = its ladder at 0 m, `landingPadM` 0; no separate habitat building; interior uses `scr_ship_interior` + `astronaut_indoor`). Base systems land as kits (`workshop.startItems` + `instrumentKits`) and are built at the `workshop` station inside (`S.Workshop`, `src/systems/workshop.js`; UI `src/ui/workshop_panel.js`; `I` opens the inventory). Recipes in `data/nasa_data.json` → `workshop.recipes`: full/half solar array (`s.base.solarFrac` scales solar power) + extend, ISRU (MOXIE), MAV line, greenhouse (Veggie), salvaged antenna → +relay Mbit, robotic arm + cable → repair kit. Each recipe shows before → after rows from the same formulas. The outdoor E "deploy" crate action was removed; built structures appear outside. Salvage now adds `inventory.items` (`robotic_arm`, `spare_antenna`) instead of applying the antenna bonus directly.
- 2026-11-15 merge of the three archives (ana, sude, medine) and the branches (local-wip, nursedef): see `docs/merge-2026-11-15.md` and D-013. Vehicles are found by digging (`S.Explore.dig`); there is no automatic discovery. East = lava plain + sealed skylight + tube (SCOUT-1). West = K2 glacier (`src/fx/westlands.js`). Runtime-patch prototypes live in `docs/design/prototypes/` and are not loaded. The sections below describe the archive states before the merge.
- `docs/submission/SPACE_APPS_PROJECT_PAGE_EN.md` is written (GitHub Pages links are `<…>` placeholders).
- Scientific fix: the speed-of-sound experiment needs `supercam` (the microphone is on SuperCam, not Mastcam-Z).
- Player interest and game rhythm plan (RIT-01…13): `src/core/objectives.js` (`S.Objectives`) gives one main objective + at most one optional one + the MAV checklist, with a HUD objective card and a `?` hint; entering the habitat postpones crises for `gameplay.habitatCalmMinutes` (`Events.isCalm`); crises with a `preSignalKey` (dust storm) show on the HUD `threatPreSignalMinutes` ahead even without the instrument; a checkpoint every sol morning (`S.saveCheckpoint` / `loadCheckpoint`) with "retry from SOL X morning" on loss; local playtest log `SOL14_DEBUG.playtestLog()` / `exportPlaytest()`; the pendulum reward works (`rewards.sandPitSpeedFactor`). Not done: cutting to 2 wrecks / 3 experiments, lettuce/radish/zinnia greenhouse art, new tutorial flow.

UI redesign "calm screens" (2026-11-15, branch `integrate`, not yet committed; K3/K5 areas + small shared-file edits). Goal: less text on screen, one decision per area, details on demand.
- Main menu (`DS.showMenu`, `.mm-*` CSS): left dark panel with pixel Mars logo (`marsLogo()`), New Mission / Continue (disabled with "no saved mission" when there is no save) / Quick Mission (5 sols, preset design) / Settings; TR/EN switch and sound icon at the bottom left, slogan at the bottom right. Settings modal (`DS.openSettings`) holds language, sound, How to Play, the project footer and the UFO fiction note (`lt.fiction` also stays on the report and the ending).
- Sol 0 mission prep (`DS.showDesign`, `.dz-*` CSS; replaced the `.cz-*` console on 2026-11-15): one layout for all five steps — header (logo · "Mission prep" · sol count), named step indicator (Goal → Rocket → Habitat → Instruments → Check; visited steps clickable, `DS.maxStep`), ~65 % choices left / ~35 % preview + live results right (step 2 `scr_transit`, 4 `scr_lab_desk`, 5 `scr_launch`, 1/3 SVG scenes), fixed footer Back · "Budget and mass" (opens a cost/mass breakdown modal with the recommended-design preset; turns red when over) · one primary action. Step 5 readiness check groups `calcDesignTotals` errors (critical, block launch) and SPOF warnings (never block) per category with "Fix →" links (`ISSUE` map). Radios/checkboxes have ARIA roles, arrow keys move inside radio groups, focus/scroll survive re-renders; a change that creates a new error shows a toast. Launch is guarded against double start (`DS.launching`, `Game.launch` ignores a second call in `transit`; the opening ignores Enter key-repeat). Texts: `prep.*`, `inst.*.what`. `calcDesignTotals` now also returns `heatingNightW`, `instrumentW`, `nightHours` (breakdown only, no formula change).
- Surface HUD (`src/ui/hud.js` rewritten, `.hz-*` CSS): top left O₂ + suit battery (the M4 point-of-no-return notch stays on the O₂ bar) and "Habitat ← N m"; top centre one-line objective + distance (`goal.short.*` keys, target from `HUD.goalTargetM`), click for hint, optional goal and progress; at most 2 alert bands; top right "SOL n / 14 · hh:mm" + site/temperature; world markers above the habitat and the target; bottom bar with logo, A/D hint, home→target line with the O₂ return-reach band, and L Data / J Log / P Systems / Esc Menu. Inside the habitat the vitals card shows habitat battery and the shortcuts move under the clock. Removed from the HUD: suit temperature, speed and greenhouse rows, habitat battery on the surface (they surface as alerts, in P, or in the habitat panel). Kept API: `build`, `update`, `hide`, `prompt`, `greenhouseStatus`, `suitHeat`, `duration`.
- World-anchored markers: `HUD.syncWorld(s)` runs every frame right after `S.FX.render` (`src/main.js`), not in the 10 Hz `HUD.update`. It positions the habitat/target markers, the [E] prompt and the track dot with `FX.worldToScreen` (same rounding as the canvas) × the canvas CSS scale, with no CSS transition. `FX.shakeX/shakeY` are stored so markers shake with the canvas. Measured 0 px drift while walking, stopping, turning and shaking; the old 10 Hz positioning lagged by up to 16 px.
- Walk animation: `assets/sprites/astronaut_walk_sheet.png` is a 6-frame strip (cells aligned to one box, 151×266) made from a team-supplied GIF; `tools/build.js` builds it with `noCrop` to 198×58 (33 px per frame). `effects.js` `drawWalk` plays it at 140 ms per frame on the surface and in the habitat (half speed in sand pits) and falls back to the old single frame. REFERENCES.md lists it with "origin to be confirmed": confirm who made it and whether it is AI-generated (then add it under "Use of AI").
- Gotcha: `<button>` does not inherit `font-size`/`font-weight`, and `font: inherit` resets the weight. Give every new button an explicit `font-size: 1em` (or its own size) and use `font-family: inherit`, not `font: inherit`. Several "tiny text" bugs came from this.
- Unused after the redesign: old design-console CSS (`.design-main`, `.d-card`, `.d-step`, `.budgets` …) and story keys such as `design.s*_help`, `budget.*_sub`, `goal.label_main`. They are harmless; clean them up after the freeze if wanted.
- Not done yet: the habitat panel (Status / actions / Preview) is still in the old style and its action-card labels are tiny (same `<button>` font bug); decision cards, downlink, power panel and the report card are not restyled.

D-012 map (2026-11-15, team-approved, built on branch `integrate`, not yet committed): base-centred two-way map, lava-tube sub-map and opening landing cutscene. See the D-012 entry for the rules.
- Coordinates: `Surface.mToPx/pxToM` are piecewise (`terrain.map`): x ≥ 0 at `metersPerPixel`, base area −120…0 m squeezed into −700…0 px (structures keep their old px), x < −120 m at `metersPerPixel` again. Bounds −450 / +600 m. The cave is a separate space: `s.player.zone === 'cave'`, position `s.player.cx` (tube metres, 0…720 m), `Sim.distanceFromHab` = 600 + cx, so the O₂ point of no return still works. The tube uses the SAME scale (`gameplay.metersPerPixel`) and the SAME movement code as the surface (`Surface.update` handles both zones: walk speed, 0.38 g jump, landing, step dust, frozen-joint slowdown); only the position field (`body.cpx`) and the bounds differ. Do not give the cave its own scale or movement function again (it made walking ~5× faster on screen and removed jumping).
- Code: `src/systems/explore.js` (`S.Explore`: ice loop, relic filing on habitat entry, cave finds/studies, relay report, `nextCaveTask`), `src/fx/lander.js` (`S.Lander`: DOM-free timeline + procedural drawing; `main.js` `Game.startLanding/skipLanding/finishLanding`, Space/Esc/Enter/click skip). State: `s.explore`, `s.lander`; `S.ensureExploreState` fills old saves (called in `loadGame`, `loadCheckpoint`, `enterWorld`, `Sim.land`). Reports: `S.Score.reportRecords(s)` = wreck records + `s.explore.reports`; packets of kind `report`.
- Goals carry a target (`{m}` surface or `{cx}` tube); the HUD reads `g.main.target` (`HUD.goalTarget`). Bottom strip is two-sided (−450…+600) with the home icon in the middle.
- Tests: `tests/explore.test.js` (11 tests, incl. opening order and landing→gameplay handover); the QA bot now plays the ice route (Sol 3) and the cave (Sol 4). 66/66 pass (2026-11-15).
- Lander art reference (team, 2026-11-15): `docs/design/references/lander-reference.png`. It is the crew lander for the opening landing cutscene, a different vehicle from the MAV (`assets/structures/mav_rocket.png`). Design: black rounded nose cone with a thin orange ring, small blue windows and a dark front panel; two small dish antennas and a whip antenna on the shoulders; white modular hull with grey riveted panels, grey and copper pipes on the front, orange side pods with vents and side thrusters (small grey nozzles) on both flanks; black-and-yellow hazard stripes above the hatch and on the skirt; a central hatch with green/yellow status lights and a long ladder down the middle to the ground; wide orange skirt; 3 bell nozzles underneath (centre one larger) with white vapour; 4 hydraulic landing legs in grey/orange (front pair wide and bright, rear pair darker for depth) with round footpads. Scale: the vehicle is very large; the astronaut beside the ladder is about 1/18 of its height. The image has a Mars background baked in, so it is a reference only. The in-game lander (`src/fx/lander.js`, redrawn 2026-11-15 to match it) is procedural, ~270 px tall ≈ 5× the astronaut (user asked for 9–10×, chose ~5× so it fits the 640×360 view). It lands hard: at `T.touch` it sinks `SINK` px into the soil (soil mounds over the feet, scorched ground, scattered rocks), the left front leg buckles and the hull leans left (`TILT`), and damage appears (torn left panel with sparks, snapped right dish, cracked window, dent/cracks, smoke from the left side pod). The ship is drawn to an offscreen canvas, then blitted in row bands with a shear for the lean and clipped at the ground line. The astronaut climbs down the central ladder (`T.walkStart`→`T.climbEnd`), then walks to `landingExitM`. To fit its ~145 px footprint, `landingPadM` moved 60→85 m (`landingExitM` 40) and the Opportunity wreck 180→230 m (still in `first_wreck`). Origin of the image to be confirmed (REFERENCES.md).
- Opening (2026-11-15): after "launch", `Cutscenes.playTransit` draws `src/fx/opening.js` (`S.Opening`) on a 640×360 canvas: Earth liftoff (booster + the same lander drawing via `Lander.drawShip`) → Earth–Mars cruise (the meteor wire-repair minigame stays here) → Mars approach that fades to the landing site's sky colour. The old text-only EDL panel was removed so the landing is shown once, in the world (`S.Lander`). Esc/Enter/"Geç" skips the whole opening: `onDone(repair, { skipped: true })` → `Sim.land` + `enterWorld` + `finishLanding` (landed, astronaut at `landingExitM`). `Sim.land` saves before the landing scene, so loading a save never replays it. Handover has no visual jump: `Lander.drawParams(T.end)` equals the post-scene decor, steam dies before `T.end`, and the astronaut stops `HOLD` s before the end. Checked with a pixel diff of the last landing frame against the first gameplay frame (0 px) plus tests in `tests/explore.test.js`. The `.edl` CSS and `transit.edl*` story keys are now unused.
- `docs/design/references/lava-tube-reference.png` origin to be confirmed (REFERENCES.md).
- Headless check gotcha: with the game loop stopped, Edge headless never presents the canvas (it comes out black). Keep `requestAnimationFrame` running and freeze the state instead (stub `Sim.step`, `Surface.update`, `Lander.update`).

Update this section as things change.

## Document map

`README.md` (concept) · `REQUIREMENTS.md` (M1–M9) · `PLAN.md` (30-hour plan) · `ARCHITECTURE.md` · `API.md` · `DESIGN.md` · `TESTING.md` · `DEPLOYMENT.md` · `RULES.md` · `CONTRIBUTING.md` · `SECURITY.md` · `CHANGELOG.md` · `docs/design/` (design sources, image prompt library) · `docs/decisions/` · `docs/submission/`
