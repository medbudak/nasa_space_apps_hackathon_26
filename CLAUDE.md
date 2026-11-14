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
- `node --test` on Node 22+ wants a **glob, not a folder**: `node --test "tests/*.test.js"`. A bare `node --test` also collects `_legacy/tests`.
- No Node on a machine? VS Code's Electron can run as Node: set `ELECTRON_RUN_AS_NODE=1` and call `Code.exe tools/build.js data`. In PowerShell pipe the output through `| Out-String` or it is lost.
- Browser check: Edge headless (`msedge --headless=new --allow-file-access-from-files --virtual-time-budget=5000 --screenshot=...`). Modal and toast entry animations come out half transparent in screenshots; inject `*{animation:none!important}` when checking.
- **Do not run the PowerShell "sync" script in `CLAUDE_PROMPTS.md`.** It belongs to v2 (ES modules + `dist/app.bundle.js`); v3 has no `src/core/nasa_data.js`, `story_data.js` or `dist/`. Use `node tools/build.js data` instead.

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

- `_legacy/`: the old v2 (ES modules) version. **Reference only: do not run or edit.** `_legacy/content/story.json` has full TR/EN texts that can feed the new `content/story.json`.
- The Turkish-named `*.png` files in the root are the original images; the game uses the mapped copies under `assets/` (mapping: `ARCHITECTURE.md` §3).
- `menü tasarım örnekleri/`: reference images for the menu UI. PDFs: design doc v2, roadmap, K4 task card (design sources).

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

## Status snapshot (2026-11-14)

Carried over from the v3 source:
- `content/story.json`: TR/EN with matching placeholders. When adding text, add both languages; `tests/data_integrity.test.js` checks every key in code and data catalogues.
- `tests/`: `engineering`, `data_integrity`, `qa_profiles` (3 TESTING.md profiles + demo, headless via `tests/helpers/bot.js`) and `rhythm` → 45/45 pass.
- `docs/submission/SPACE_APPS_PROJECT_PAGE_EN.md` is written (GitHub Pages links are `<…>` placeholders).
- Scientific fix: the speed-of-sound experiment needs `supercam` (the microphone is on SuperCam, not Mastcam-Z).
- Player interest and game rhythm plan (RIT-01…13): `src/core/objectives.js` (`S.Objectives`) gives one main objective + at most one optional one + the MAV checklist, with a HUD objective card and a `?` hint; entering the habitat postpones crises for `gameplay.habitatCalmMinutes` (`Events.isCalm`); crises with a `preSignalKey` (dust storm) show on the HUD `threatPreSignalMinutes` ahead even without the instrument; a checkpoint every sol morning (`S.saveCheckpoint` / `loadCheckpoint`) with "retry from SOL X morning" on loss; local playtest log `SOL14_DEBUG.playtestLog()` / `exportPlaytest()`; the pendulum reward works (`rewards.sandPitSpeedFactor`). Not done: cutting to 2 wrecks / 3 experiments, lettuce/radish/zinnia greenhouse art, new tutorial flow.

Update this section as things change.

## Document map

`README.md` (concept) · `REQUIREMENTS.md` (M1–M9) · `PLAN.md` (30-hour plan) · `ARCHITECTURE.md` · `API.md` · `DESIGN.md` · `TESTING.md` · `DEPLOYMENT.md` · `RULES.md` · `CONTRIBUTING.md` · `SECURITY.md` · `CHANGELOG.md` · `CLAUDE_PROMPTS.md` · `sol_14_red_horizon_t_m_g_rseller_i_in_ai_prompt_k_t_phanesi.md` (image prompt library) · `docs/decisions/` · `docs/submission/`
