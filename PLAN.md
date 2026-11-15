# PLAN.md — The 30-Hour Mission Plan and Build Order

This document holds the 30-hour (`S0–S30`) schedule of **SOL 14: RED HORIZON**, its milestones, the agreed scope and cut decisions, and the order in which the software was built. It is the original hackathon plan; [DECISIONS.md](DECISIONS.md) records what changed since.

---

## 1. Shared milestones

| Target | Time | Milestone | Exit criterion |
| :---: | :---: | :--- | :--- |
| 🎯 **S6** | `Sat 19:30` | **Vertical slice** | `Sol 0` design → Mars landing → one wreck's forensics loop (`Opportunity`) → pendulum experiment → night-freeze crisis card, playable end to end. |
| 🎯 **S14** | `Sun 03:30` | **Alpha** | All core systems (`M1–M5`, 4 wrecks, 6 experiments, event engine, report card) run end to end without crashing. |
| 🎯 **S20** | `Sun 09:30` | **Content lock** | UFO stinger connected, `story.json` (EN/TR) complete. No new text or features after this. |
| 🎯 **S24** | `Sun 13:30` | **Feature freeze** | `?demo` / quick mission, language switch and keyboard access done. Bug fixes only after this. |
| 🎯 **S28** | `Sun 17:30` | **Live + video ready** | GitHub Pages build updated; 30-second demo video with English subtitles and 7 slides ready. |
| 🎯 **S30** | `Sun 19:30` | **Submission** | All links, the NASA source matrix and a backup package uploaded to the Space Apps portal. |

---

## 2. Hour-by-hour roles (`K1–K6`)

| Slot | K1 (Lead / Systems) | K2 (Simulation / Events) | K3 (UI / Minigames) | K4 (Pixel art / VFX) | K5 (Story / Science / Audio) | K6 (Forensics / Experiments / QA) |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **S0–S1** | Repo, architecture, docs | Review architecture and state shape | Prepare the UI component plan | Colour palette + `48 px` grid guide | Project page skeleton (EN) | Review forensics and experiment shapes |
| **S1–S4** | `nasa_data.json` + `engineering.js` formulas | 0.38 g walk/jump, day–night, energy simulation | `Sol 0`: 5 design screens + SPOF (`M8`) | Astronaut sprites (idle, walk, jump, frozen, action) | Check the 5 wreck cases against NSSDCA, write the texts | `forensics.js`: evidence + 5-category diagnosis + score |
| **S4–S6** | `decisionLog[]` + score model (minimum/full success) | Event engine + crisis-card logic (`M2`) | Decision-card UI + first minigames | Habitat, greenhouse, MAV, solar panels + 5 wreck sprites | 12+ crisis-card texts (`EN` + `TR`) | Experiments 1–2 (pendulum, free fall) + stopwatch measurement |
| **S6–S10** | Cause-and-effect report card (`M5`) + NASA comparison | Point of no return (`M4`) + power-load logic (`M3`) | Downlink queue (`M1`) + more minigames | Mars backgrounds (`Jezero`, `Meridiani`, `Arcadia`, night, blue sunset) | Experiment 3–6 texts; English pass on `story.json` | Full forensics loop for the 4 required wrecks + NASA finding cards |
| **S10–S14** | Trajectory, launch window and landing-site effects; unit tests | Events: storm, quake, SPE, conjunction, dust devil, perchlorate | Power-panel UI (`M3`) + telemetry and HUD bars | Storm particles, visor frost (`frost 1-2`), dust devil, hallucination | Sleep shift (`S11–S14`) | Experiment 3 (seeds) start + sleep shift (`S11–S14`) |
| **S14–S18** | Sleep shift (`S15–S18`) | Greenhouse + delayed Mission Control (`M7`) + `ufoStinger` trigger | Sleep shift (`S15–S18`) | UFO scene animation (MAV liftoff, light, line-by-line sharp/blurred photo) | UFO storyboard + analyst note + Web Audio / CC0 sounds | Finish experiments 3–6 (seeds, boiling water, speed of sound, MOXIE) |
| **S18–S20** | Balance session + wire the UFO finale to its 3 outcomes | Sleep shift (`S18–S21`) | UFO download progress bar + morale UI | Sleep shift (`S18–S21`) | Project page (EN): NASA sources, requirement matrix, scientific corrections | `Beagle 2` bonus case + first full balance test with `K1` |
| **S20–S24** | Quick mission / `?demo` mode (`M9`) + `localStorage` save test | `Sol 14` final sequence (antenna → frozen valve → MAV liftoff) | `EN/TR` switch + keyboard shortcuts and accessibility | Liftoff + sol transition (`SOL X → X+1`) animation and polish | 7-slide presentation (EN) | QA: full runs with 3 designs, bug reports and checks |
| **S24–S30** | Final deploy, submission checklist, Space Apps submission | Bug hunt + "golden path" playthrough | UI bug hunt + screenshots | Cover image (`cover_thumbnail.png`) + video editing help | Record the 30 s demo video, EN subtitles, local presentation rehearsal | Final QA: test the live link from scratch |

---

## 3. Scope and cut decisions (`C1–C7`)

With 6 people, these scope decisions keep the time-to-impact ratio high:

* **Cut / simplified (`C1, C4, C7`):**
  - **C1 (space transit, Sol 1–3):** instead of a long playable space section, a short cinematic approach (later a walkable shuttle deck with no tasks, D-014).
  - **C4 (morning 4-slot planning screen, M6):** no separate morning slot screen; actions are chosen on the surface HUD with an end-of-sol summary.
  - **C7 (live JPL Horizons API call):** to avoid network failures, a **precomputed table of real JPL Horizons distances and light delays** in `data/nasa_data.json`.
* **Kept (`C2, C3, C5, C6`):**
  - **C5:** experiment 5 (speed of sound) and experiment 6 (MOXIE output) are fully in.
  - **C6:** `Beagle 2` is the 5th, bonus forensics case.
  - **C2 & C3:** Sabatier ISRU fuel support and the morale false-alarm + shadow-hallucination effects are in the game.

---

## 4. Build order

The project was built in 6 phases:

1. **Phase 1 — Assets and infrastructure:** move the generated images into `assets/backgrounds/`, `assets/sprites/`, `assets/structures/`, `assets/screens/`, `assets/vfx/` and `assets/ending/` under standard names; create `package.json` and the folder layout (`src/core/`, `src/systems/`, `src/ui/`, `src/minigames/`, `src/fx/`, `data/`, `content/`, `styles/`, `tests/`).
2. **Phase 2 — Data, text and the engineering core (`K1` + `K5`):** `data/nasa_data.json` (NASA constants, 3 rockets, 3 landing sites, 9 instruments, 5 wreck cases, 6 experiments, source URLs); `content/story.json` (full EN and TR); `src/core/engineering.js` (solar power, $\Delta v$, light delay, pendulum, point-of-no-return $O_2$) and `src/core/state.js` (`gameState`, save/load); unit tests in `tests/engineering.test.js`.
3. **Phase 3 — Simulation, events, forensics and experiments (`K2` + `K6`):** `src/core/sim.js` and `src/core/events.js` (daily resource use, load shedding, the event catalogue, crisis cards, delayed Mission Control); `src/systems/forensics.js` and `src/systems/experiments.js`.
4. **Phase 4 — Visual engine and audio (`K4` + `K5`):** `src/fx/sprites.js` (sprite loader; the white background is removed by the asset build), `src/fx/effects.js` (dust storm, visor frost, shaking, dust devil, shadow hallucination, line-by-line UFO photo) and `src/fx/audio.js` (wind, alarm, click, radar and UFO signal sounds).
5. **Phase 5 — UI screens and minigames (`K3`):** `src/ui/design_screens.js` (`Sol 0` with live budget/mass/power/data bars and SPOF warnings), the HUD, downlink, power, decision-card and report-card panels, and `src/minigames/`.
6. **Phase 6 — Integration, `?demo` mode and checks:** wire the whole flow through `index.html`, `styles/main.css` and `src/main.js`, run the tests and check in the browser.
