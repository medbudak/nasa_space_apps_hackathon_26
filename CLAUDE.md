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

- **Not ES modules.** ADR 0001 originally said ES modules (amended there; ARCHITECTURE.md and API.md describe the real setup): the code uses classic `<script>` files and the `window.SOL14` namespace (`S` for short). Every file is an IIFE: `(function (S) { ... })(window.SOL14 = window.SOL14 || {})`. Do not use `import`/`export`, `fetch` or runtime `getImageData`: they fail under `file://`.
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
- `docs/design/`: design sources: PDFs (design doc v2, roadmap, K4 task card), `menu-references/` (menu UI reference images), `ai-image-prompts.md` (image prompt library), `prompt-panel-cleaning-and-watering.md` (panel-cleaning and watering task spec), `design-rules.md` (shared design and interaction rules: tokens, HUD densities, mission prep, interiors).

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

- `main` is the shared version and must always work. Pushing directly to `main` is allowed: first do the "Sync before you start" check below (fetch, merge `origin/main` safely, `npm test` passes), then push. Never force-push `main`.
- Everyone works on a branch named after themselves: first name in lowercase ASCII letters (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u). Example: `enes`. If two members share a first name, add the surname initial (`enes-s`).
- For a second branch for parallel work, use `name-topic` with a hyphen, for example `enes-orbit-ui`. Don't use `name/topic`: git can't hold `enes` and `enes/...` at the same time.
- Push only to your own branches or to `main`. Never commit to, rebase or force-push someone else's branch. Never force-push `main`.
- Sync often: run `git pull origin main` on your branch every few hours and always before pushing or opening a PR. Resolve conflicts locally, never by overwriting `main`.
- **Sync before you start (humans and agents).** Before starting any task, and again before committing, run `git fetch --all --prune` and check for new pushes on `main` and on your own remote branch (`git log --oneline HEAD..origin/main`, `git log --oneline HEAD..origin/<your-branch>`). If there are new commits, bring them in without losing either side's work:
  1. Never discard or overwrite local work: no `git reset --hard`, `git checkout -- .`, `git clean`, `git push --force` or "take theirs/ours for the whole file" to get past a conflict.
  2. With uncommitted changes, first commit them (or `git stash push -u`), then `git merge origin/main` (and `origin/<your-branch>` if it moved). Re-apply a stash with `git stash pop`.
  3. Resolve conflicts hunk by hunk so both changes survive. If two changes really contradict each other, stop and ask the user (or the file's owner, AGENTS.md §1) instead of choosing one.
  4. Generated files (`src/data/*.js`, `assets/processed/**`): don't hand-merge them; take either side, then rebuild (`node tools/build.js data` / `assets`).
  5. Run `npm test` after the merge and before continuing.
- Changes reach `main` either by a direct push (after the sync check) or through a pull request. Small, frequent pushes/PRs beat one big one at the end.
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
- Scientific accuracy: night about −80 °C, thin atmosphere (~0.6 kPa, no "hot air" → radiator failure instead), quakes up to ~M4.7, 0.38 g, Pu-238 does not make fuel (RHU + Sabatier), crops take weeks (ISS: radish 27 d, lettuce ~33 d, zinnia ~60 d to flower), so the greenhouse harvest is compressed to 2–4 tended sols and labelled simplified in the game (D-017), light delay 3–22 min, blue sunset.
- Pixel art: `image-rendering: pixelated`, no blurry scaling, no text or HUD baked into images.
- Anything fictional or compressed for gameplay (a compressed map, a fictional scene) is labeled as such in the game and on the project page.
- REFERENCES.md is the single log for sources, licenses and AI use. Don't start a separate licenses file.
- A feature is done only when `npm test` passes, it works on `main` and on the live deploy (also via `file://`), at least one other person has tried it, and the data/validation owner has checked its numbers and texts.
- Stuck for more than 15 minutes? Ask in the team chat.
- After content lock, no new features or text: new ideas go to a "next version" list. After feature freeze, only game-breaking bugs are fixed.

## Clean code (humans and AI agents)

Write the smallest clear change that solves the task. Readable code beats clever code.

- **Do only what was asked.** No speculative features, options, flags or "might need it later" helpers. No drive-by refactors or reformatting of lines you did not need to touch.
- **Reuse before you write.** Search for an existing helper (`S.util`, `S.UI`, `S.Engineering`, `S.Sim`, `S.Explore`, `S.Workshop`, ...) before adding a new one. Never copy-paste a block; extract a function when the same logic appears twice.
- **Names say what a thing is.** Full words (`suitO2Pct`, not `so`), verbs for functions (`calcSolarPower`, `fileRelicReports`), units in names when it matters (`minutes`, `Kg`, `Px`, `M`).
- **Small, single-purpose functions.** One level of abstraction per function; return early instead of nesting. If a function needs a long comment to explain what it does, split it.
- **One source of truth.** Numbers in `data/*.json`, text in `content/story.json`, state in `gameState`, formulas in `engineering.js`. Never duplicate a value or a formula in the UI; compute what the player sees with the same function the simulation uses.
- **Comments explain why, not what.** Keep the file's existing comment language and density. Delete commented-out code and stale TODOs instead of leaving them.
- **Delete dead code.** When you replace a system, remove the old code, CSS and story keys it used (and their tests) in the same change. Old saves are handled in `S.ensureExploreState`, not with parallel code paths.
- **Fail visibly, not silently.** No empty `catch` unless a comment says why the failure is harmless (audio, storage). Validate at the edges (data load, user input), trust the core.
- **No new dependencies** for what a few lines of plain JS can do. The game must keep running from `file://` with classic scripts.
- **Match the surrounding style:** two-space indent, single quotes, semicolons, `const`/`let`, arrow functions for callbacks, `'use strict'` IIFEs. Generated files are never edited by hand.
- **Leave it tested.** A behaviour change comes with a test change in `tests/`; a bug fix comes with a test that would have caught it. `npm test` passes before every commit.

## Language

- Code, comments, commit messages, PRs, issues and repo docs are in English.
- Team chat and conversations with Claude can be in any language. Claude replies in the language it is addressed in.
- Everything on GitHub is in English, including the design docs (`README.md`, `ARCHITECTURE.md`, `API.md`, `DESIGN.md`, `PLAN.md`, `docs/`) and the submission texts in `docs/submission/`. Code comments written in Turkish may stay until the file is next touched.
- The game starts in English; Turkish stays a language option (`content/story.json` keeps both `en` and `tr`).

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
- Follow the "Clean code" section above; prefer deleting and simplifying over adding.
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

## Project skills (`.claude/skills/`)

The repo ships Claude Code skills in `.claude/skills/`, so everyone who opens the project gets them without installing anything. Claude loads a skill on its own when the task matches the skill's description; you can also call one by name (`/game-feel`). Sources and licenses are in each folder (`LICENSE`, `NOTICE`) and in REFERENCES.md.

- **Game dev** (github.com/gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0): `game-jam`, `prototype-fast`, `game-docs`, `game-feel`, `game-ui-ux`, `level-design`, `save-systems`, `audio-design`, `camera-systems`, `input-systems`, `performance-optimization`, `physics-tuning`, `procedural-gen`, `create-game-assets`. Engine-specific (Godot/Unity/Unreal) and store-publishing skills were left out; the full catalogue stays available as a marketplace (`/plugin`, `.claude/settings.json`). Use them for UX, feel and pacing; real-world numbers still come only from sourced data (D-009).
- **`prompt-improver`** (github.com/severity1/claude-code-prompt-improver, MIT): when a request is vague, Claude researches the codebase and asks a few targeted questions before acting. Only the skill is included, not the plugin's Python prompt hooks.
- **`i-have-adhd`** (github.com/ayghri/i-have-adhd, MIT): action-first answers with numbered steps and no filler. It changes the reply style, so it only runs on request: `/i-have-adhd` to turn on, "stop adhd mode" to turn off.

To add a skill: put `SKILL.md` (with `name` and `description` frontmatter) and its references in `.claude/skills/<name>/`, keep the upstream license file, and add a line to REFERENCES.md.

## Environment notes

- The project path can contain spaces and Turkish characters (e.g. `Masaüstü`): always quote paths.
- On Windows, both PowerShell and Git Bash are used; `npm test` works in either.

## Status snapshot (2026-11-15, late)

Most of the planned work is done and on `main`. Details live in DECISIONS.md (D-012, D-013, D-014), `docs/merge-2026-11-15.md` and `docs/ux-plan.md`.

- **Flow:** menu → Sol 0 mission prep (five steps, tooltips with real effects) → launch intro (K2: crowds, news, countdown, no text) → task-free shuttle deck (walk to the cockpit seat; K4 interior art, Medine's version; landing resources from `Sim.landingStart`) → landing cutscene → surface → ending → report.
- **Home is the lander.** No separate habitat building: the door is the lander's ladder at 0 m (`landingPadM` 0). The interior is the K4 shuttle cross-section (`scr_ship_interior`, `astronaut_indoor`) with stations for comms, power, suit charge, O₂, lab, workshop, suit repair, bunk and airlock. Many code names and story keys still say "habitat"; the player-facing text says "lander".
- **Workshop and inventory** (`S.Workshop`, `src/systems/workshop.js`; UI `src/ui/workshop_panel.js`; `I` opens the inventory): base systems land as kits and are built inside. Recipes in `data/nasa_data.json` → `workshop.recipes`: full or half solar array (`s.base.solarFrac`), ISRU/MOXIE, MAV fuel line, greenhouse, salvaged antenna, salvaged repair kit. Each shows before → after rows from the same formulas. No solar power before the array, no fuel before ISRU + MAV, no safe return without the MAV.
- **Lander panel:** a station strip in room order (Medine's layout); the selected station follows the astronaut, E runs it, the airlock exits.
- **Minigames:** every experiment, wreck environment check and the suit-leak crisis has its own game (`src/minigames/task_games.js`, `S.TaskGames`); `minigames.js` only routes. The black-box task is a cable panel.
- **Station side story** (D-014, `S.Station`): a Sol 2 meteorite scatters cargo (MAV intact). Pickups on the ground and boulders, kits in the two decoy mounds, regolith bags with S/↓. Five modules are `station_*` workshop recipes with either-or sources; an ending slide shows what stays for the next crew. Score unchanged.
- **Exploration** (D-013): vehicles are found by digging (`S.Explore.dig`); there is no automatic discovery.
  - East: lava plain to +1400 m, with a rubble-sealed skylight and the lava tube (fictional SCOUT-1 rover, FIELD CAM photos); past it dunes, yardangs and layered buttes to +3000 m (`terrain.map.eastEndM`).
  - West: K2 glacier to the ice wall at −5000 m (`src/fx/westlands.js`).
  - Wreck tasks follow what NASA/ESA did for each vehicle; the black-box task matches real telemetry channels to subsystems.
  - Minerals (Kişi 5, `explore.minerals`): `hematite`, `meteorite`, `gypsum` on the surface (scanner pings, E digs), `olivine`, `basalt` as drilled tube veins. Found minerals go to `inventory.minerals{id: n}`; workshop recipes list them in a separate `minerals` field (not in `needs`), read with `S.Workshop.mineralCount` and spent with `S.Explore.spendMinerals(s, {id: n})`. The drill comes from Kişi 4's tool check (`S.Workshop.hasTool`); the old placeholder is gone.
  - MAV repair (D-015): the repair part is made in the workshop (`rk_fitting` → `fuel_fitting` with a meteorite, `rk_patch` → `hull_patch` with hematite) and the right tool must be in hand (hotbar) at the MAV; F or "Repair" runs it. Minerals are scarce on purpose (Sude: not every upgrade fits), so `Workshop.repairReserve` locks upgrades (`ws.err_reserved`) from spending minerals still needed for a repair part that is not made yet (including the hull damage the Sol 2 meteorite will cause). This keeps a safe return possible in every run.
- **Look and sound:**
  - One retro UI font, VT323 (embedded in `styles/fonts.css`). No metre labels on the ground.
  - K5's CC0 recordings (`assets/audio`) play through `src/fx/audio.js`, with a synthesised fallback.
  - Astronaut art comes from the team's six GIFs (`assets/sprites/astro/astro_*.png`, 4-frame strips; `FX.drawAstro` on the surface and in the tube, held-tool glove points per frame in `ASTRO`). Transit deck: zero-g float (A/D + W/S). Lander: `FX.playActivity('eat' | 'drink' | 'sleep')` plays the GIF at 66 px (sleep at the bunk, lights dim, then `Sim.sleep`). Toilet has no animation.
  - One character everywhere: helmeted outside (surface, tube, landing), bare-headed inside (lander: `astro_indoor_idle/walk`, transit deck: `astro_indoor_float`). Kneel/dig uses `astro_surface_kneel`. The old sprite keys (`astronaut_idle`, `astronaut_action`, `astronaut_indoor` …) point to `astro_legacy_*` frames of the new character.
  - One font: VT323 only, `font-synthesis: none` (no fake bold); canvas text has no `bold`. No emoji in the UI: `S.UI.dataIcon` maps data emoji (crisis option icons) to line icons, and the needs/HUD/power/report icons are line icons (`drop`, `food`, `wc`, `sun`, `moon`, `wind`, `snow`, `pick`).
  - East of the tube: procedural space junk and satellite remains (`JUNK` in `src/fx/dig_fx.js`, fictional scenery).
  - Mineral art (Kişi 7): `assets/sprites/minerals/<id>_{1,2,3}.png` (512 px sources; 1 = ground sprite `min_<id>_ground` at dig spots, 2 = card/inventory, 3 = small "processed in the workshop" image). Basalt has no art and keeps its pixel icon.
  - The JPEG scenes in `assets/processed/{screens,interior}/` are not made by `tools/build.js` (it has no JPEG decoder): they are 1600 px copies of the originals in `assets/` (resized once, 18.5 MB → 1.8 MB). Re-export by hand if an original changes.
  - Lander panel: the needs buttons (Kişi 2) sit as an icon row inside the Status card (name and cost in the tooltip) so they no longer cover the interior; any unknown interior station falls back to its name instead of crashing the panel.
- **Tests:** `engineering`, `data_integrity`, `qa_profiles` (3 TESTING.md profiles + demo, headless via `tests/helpers/bot.js`), `rhythm`, `explore`, `design_choices`, `station`, `rocket`, `upgrades` … → 125/125 pass (2026-11-15).
- **Coordinates:** `Surface.mToPx/pxToM` are piecewise (`terrain.map`); the base area −120…0 m is drawn at sprite scale. The cave is a separate space: `s.player.zone === 'cave'`, position `s.player.cx`. It uses the same scale and the same movement code as the surface; do not give it its own.
- **Old saves:** fields added later are filled by `S.ensureExploreState` (called on load, checkpoint, `enterWorld`, `Sim.land`).
- **Still open:**
  - The team must confirm D-011 and D-013.
  - Origins of `astronaut_walk_sheet.png`, `field_cam.png`, `astronaut_indoor.png` and the design references need confirming (REFERENCES.md).
  - AI-generated art needs a visible watermark (Space Apps rule) per K4's AI statement.
  - Unused old CSS and story keys from the redesigns can be removed after the freeze.

Gotchas:
- `<button>` does not inherit `font-size`/`font-weight`, and `font: inherit` resets the weight. Give new buttons `font-size: 1em` and `font-family: inherit`.
- Objects created inside the test `vm` context have a different `Object.prototype`, so `assert.deepStrictEqual(x, {})` fails on an empty core object. Compare keys or values instead.
- Edge headless never presents a stopped canvas (it comes out black). Keep `requestAnimationFrame` running and freeze the state instead; headless rAF runs only a few frames.
- `HUD.syncWorld(s)` positions world-anchored markers every frame after `S.FX.render`; do not move that work back into the 10 Hz `HUD.update`.

Update this section as things change.

## Document map

`README.md` (concept) · `REQUIREMENTS.md` (M1–M9) · `PLAN.md` (30-hour plan) · `ARCHITECTURE.md` · `API.md` · `DESIGN.md` · `TESTING.md` · `DEPLOYMENT.md` · `RULES.md` · `CONTRIBUTING.md` · `SECURITY.md` · `CHANGELOG.md` · `docs/design/` (design sources, image prompt library) · `docs/decisions/` · `docs/submission/`
