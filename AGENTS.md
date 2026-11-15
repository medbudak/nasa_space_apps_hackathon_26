# AGENTS.md — Team Roles, File Ownership and the Agent Working Protocol

This document sets the responsibility boundaries, the file ownership matrix and the contracts between modules that the developers (`K1–K6`) and AI agents working on **SOL 14: RED HORIZON** must follow.

---

## 1. Roles and file ownership (`K1–K6`)

To keep merge conflicts at zero, **every file has one owner**. A developer or sub-agent edits only the files in their own area; when a change is needed in another module, it connects through the event bus (`bus.emit`) or the shared interface contracts.

| Role | Title | Files and folders owned | Main responsibilities |
| :--- | :--- | :--- | :--- |
| **K1** | **Lead / Systems & Engineering** | `src/core/engineering.js`<br>`src/core/state.js`<br>`src/core/score.js`<br>`src/systems/rocket.js`<br>`data/nasa_data.json`<br>`index.html`, `main.js` | Engineering formulas ($P, \Delta v, t_{\text{delay}}, T, O_{2,\text{needed}}$), the central `gameState`, `decisionLog[]`, the cause-and-effect report card (`M5`), quick mission / `?demo` mode (`M9`), tools and MAV repair, integration and deploy. |
| **K2** | **Gameplay / Simulation engine** | `src/core/sim.js`<br>`src/core/events.js`<br>`src/core/surface.js`<br>`src/systems/workshop.js`<br>`src/fx/westlands.js` | 0.38 g surface movement and jump physics, day/night and the energy/heat/O2 simulation, event engine, crisis-card triggers (`M2`), power-load logic (`M3`), point of no return (`M4`), greenhouse, delayed Mission Control (`M7`) and the `ufoStinger` flags. |
| **K3** | **UI / HUD & minigames** | `src/ui/design_screens.js`<br>`src/ui/hud.js`<br>`src/ui/hotbar.js`<br>`src/ui/decision_card.js`<br>`src/ui/downlink.js`<br>`src/ui/power_panel.js`<br>`src/minigames/*.js`<br>`src/ui/workshop_panel.js`<br>`src/ui/field_cam.js`<br>`styles/*.css` | The 5 `Sol 0` design screens, SPOF warning (`M8`), surface HUD bars and inventory hotbar, downlink queue UI (`M1`), decision-card UI (`M2`), power-priority UI (`M3`), the per-task minigames and cable panel (`S.TaskGames`), EN/TR language switch. |
| **K4** | **Pixel art / VFX** | `assets/backgrounds/*`<br>`assets/sprites/*`<br>`assets/structures/*`<br>`assets/screens/*`<br>`assets/vfx/*`<br>`assets/ending/*`<br>`src/fx/sprites.js`<br>`src/fx/effects.js`<br>`src/fx/dig_fx.js`<br>`src/fx/lander.js`<br>`src/fx/opening.js` | Managing the pixel-art images, 48×48 grid alignment, the parallax Mars background, night and blue-sunset transitions, storm particles, visor frost (`frost`), screen shake, hallucination and the UFO liftoff / line-by-line photo download animation. |
| **K5** | **Story / Science validation / Audio** | `content/story.json`<br>`data/events_catalog.json`<br>`src/fx/audio.js`<br>`assets/audio/*`<br>`docs/submission/*` | Bilingual (`EN` + `TR`) game text (`t(key)`), NSSDCA/ELV/Horizons data checks, 12+ crisis-card texts, the scientific explanations of cases and experiments, CC0/procedural sound effects, presentation slides and the 30 s demo video. |
| **K6** | **Science gameplay (forensics & experiments) / QA** | `src/systems/forensics.js`<br>`src/systems/experiments.js`<br>`data/forensics_cases.json`<br>`data/experiments_config.json`<br>`src/systems/explore.js`<br>`data/explore_config.json`<br>`tests/*.test.js` | The forensics loop for the 5 lost vehicles (`Opportunity`, `Spirit`, `Phoenix`, `InSight`, `Beagle 2`: evidence + 5-category diagnosis + NASA finding card), the 6 experiment loops (hypothesis → control group → measurement → finding reward) and end-to-end QA tests. |

---

## 2. Data and communication contracts between modules

Agents and developers follow these 5 contracts when writing code:

1. **One central state (`gameState`):**
   - All game state lives in the single `gameState` object in `src/core/state.js`.
   - No UI component or minigame keeps hidden game state; it reads state with `getState()` and changes it through `updateState(patch)` or defined action functions.

2. **No hard-coded numbers (`data/nasa_data.json`):**
   - Mass (`kg`), power (`W`), data (`Mbit`), the solar constant ($S \approx 586.2\text{ W/m}^2$), gravity ($g = 3.73\text{ m/s}^2$), rocket capacities and temperature thresholds are never hard-coded.
   - Every scientific constant is read from `data/nasa_data.json` together with its `src` (NASA source URL).

3. **No hard-coded text (`content/story.json`):**
   - No title, description, crisis card or report text shown to the player is embedded in JS/HTML as an English or Turkish string.
   - All text comes from `content/story.json` (`EN` and `TR`) through `t('key.path')`.

4. **Event bus (`bus.emit` / `bus.on`):**
   - When `K2` (simulation) starts a storm, quake or frost, it does not call `K4`'s `effects.js` directly; it emits `bus.emit('fx:storm', { intensity: 0.8 })` or `bus.emit('crisis:trigger', crisisObj)`.

5. **Minigame call interface:**
   - Every minigame is called as `await runMinigame(type, config)` and returns `{ success: boolean, score: number, timeUsed: number }`.

---

## 3. AI agent working protocol

The game runs end to end; every task now builds on the existing code. For each task the agent follows this order:

1. **Sync:** `git fetch --all --prune`, then merge new commits on `main` and on your own branch without losing either side (CLAUDE.md → "Sync before you start").
2. **Read first:** read the module you will change and its callers; do not rewrite an existing helper (`S.util`, `S.UI`, `S.Engineering`, `S.Sim`, `S.Explore`, `S.Workshop`, `S.Rocket` …).
3. **Make the smallest clear change:** CLAUDE.md → "Clean code". Numbers go to `data/*.json`, text to `content/story.json` (EN + TR), state to `gameState`. Delete the old code, CSS and text keys it replaces in the same change.
4. **Test:** when behaviour changes, `tests/` changes too; no commit until `npm test` passes. Check visual changes in the browser (including `file://`).
5. **Keep records:** a new source, asset or AI use → REFERENCES.md; anything that needs a team decision → a `Proposed` entry in DECISIONS.md.

Where they fit, the skills in `.claude/skills/` (game design, UX, game feel, performance, `prompt-improver` for vague requests) are used automatically; the list is in CLAUDE.md → "Project skills".
