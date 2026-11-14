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

Decide these together at the start. When one is agreed, move it to the log below.

- Platform (web, desktop, mobile) and tech stack
- Game format: turn-based or real-time, single-player or multiplayer, length of a session
- Target player and difficulty level
- Mission destinations and the mission types players can choose
- Which constraints the game models (budget, mass, power, communications, orbit, ...) and how simple each model is
- Data sources for real-world values
- Where game data lives (parts, launch vehicles, costs, scenarios) and in what format, so values can be tuned without touching logic
- How success is measured for the player (score, science return, mission outcome) and how the game explains why a mission failed
- What the final demo must show (minimum scope)
- Feature freeze time: when we stop adding features and switch to polish, demo and submission
- Demo format (30-second video or 7 slides) and who prepares it
- Who owns the submission page and REFERENCES.md at the end
- Who owns which part of the project

## Decision log

Source for D-001 to D-006: the design document "SOL 14: Red Horizon v2 — Design and Role Split". All entries below are `Proposed` until the team agrees.

### D-001: Game concept "SOL 14: Red Horizon"
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: The player designs a crewed Mars mission on Sol 0 (objective, launch vehicle and trajectory, landing site, power, battery, insulation, up to 5 of 9 instruments, comms architecture, spare kits, mass margin), then lives with its consequences for 14 sols. Two main tasks: forensic investigation of lost landers (Opportunity, Spirit, Phoenix, InSight, Beagle 2 bonus) and a science experiment loop. Ends with a cause-and-effect report card compared to real missions.
- Why: Covers every concept the challenge names (objectives, spacecraft, instruments, launch vehicles, budget, power, mass, comms, orbit) with a visible screen or number, and shows how each choice shapes success.
- Affects: whole game

### D-002: Tech stack and hosting
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Vanilla JavaScript + HTML5 Canvas, no framework, hosted on GitHub Pages. Seeded RNG so the same seed gives the same run.
- Why: Judges open it from one link in a browser with no setup. Rejected: React/Phaser (extra build and dependencies), Godot web export (heavier, fewer people can work on it).
- Affects: repo structure, deploy

### D-003: Shared contracts
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: One central `gameState` (schema written by K2). All numbers in `nasa_data.json`, each with a `src` field (schema written by K5). Formulas in `engineering.js`. Text in `story.json` (TR/EN). Mini-game interface `run(cfg) → {success, score, timeUsed}` (K4 and K2). Every crisis choice is appended to `decisionLog[]`.
- Why: Lets six people work in parallel, and keeps every number traceable to a source.
- Affects: all code

### D-004: Roles and file ownership
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: K1 Lead/integration/submission (no code area) · K2 Simulation core (`state.js`, `events.js`) · K3 UI/HUD (`src/ui/`) · K4 Art/VFX/mini-games (`assets/`, `src/minigames/`) · K5 NASA data/engineering/validation (`nasa_data.json`, formula content of `engineering.js`) · K6 Science gameplay/story/QA (`systems/forensics.js`, `systems/experiments.js`, `story.json`). Names to be filled in.
- Why: Clear file areas avoid merge conflicts. The critical path is K5 → K2 → K3.
- Affects: everyone

### D-005: Minimum scope and cut order
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Required mechanics M1–M5: downlink data budget, decision cards + log, power load prioritization, point-of-no-return indicator, cause-and-effect report card. M6–M9 only if time allows. Already cut: playable space transit (C1), sol planning screen (C4), live Horizons calls (C7, use a precomputed table). Cut next if behind: extension mode (C2), extra sanity effects (C3). Checkpoints: vertical slice → alpha → content lock → feature freeze.
- Why: 48 hours. One mission that plays well from start to finish beats a wide unfinished one.
- Affects: scope, schedule

### D-006: Scoring and loss conditions
- Status: Proposed
- Date: 2026-11-14
- Agreed by: (pending)
- Decision: Mission Success Score = forensic reports + experiment results (only those that reached Earth) + survival + mass-margin bonus − lost systems. Minimum success: 2 reports + 2 experiments sent. Full success: 4 reports + 4 experiments + safe return. Loss: O2 at zero, body temperature below the critical threshold for 2 game-hours, cumulative radiation dose over the mission limit, or sanity at zero. The report card is shown on loss too. The UFO scene is a labeled fictional epilogue resolved by camera tier and remaining data budget.
- Why: NASA-style minimum/full success thresholds, and only data that reached Earth counts, which makes the comms trade-off matter.
- Affects: K2, K3, K6
