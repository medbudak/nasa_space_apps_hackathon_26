# SOL 14: RED HORIZON

**NASA Space Apps Challenge 2026 (Sakarya) — Space Mission Design Game**

> **In one sentence:** The player designs a crewed Mars mission under a limited budget, mass, power and data bandwidth (`Sol 0`), then lives with the consequences of that design for `14 sols` on Mars, and at the end receives a **cause-and-effect report card** that compares every engineering decision with real NASA data.

---

## 🎯 Game concept: a three-stage loop

1. **DESIGN (`Sol 0`, 5 screens):**
   - **Mission objective:** forensics-heavy, experiment-heavy or balanced (sets the minimum and full success criteria).
   - **Rocket, trajectory and launch window:** 3 rockets × 2 transfer trajectories (Hohmann ~8 months / fast ~6 months) and the 26-month launch window trade-off.
   - **Landing site and habitat systems:** Meridiani Planum (equator), Jezero Crater (18°N) or Arcadia Planitia (~40°N); solar panels or panels + RTG, battery (20/40/60 kWh) and insulation (thin/thick).
   - **Payload selection:** up to 5 of 9 real NASA instruments (`Mastcam-Z`, `MEDA`, `SEIS`, `RAD`, `RIMFAX`, `SuperCam/PIXL`, `MOXIE`, `Veggie`, `Ingenuity`).
   - **Communications and redundancy:** UHF relay only (`MRO`/`MAVEN`) or relay + direct-to-Earth (`X-band`), repair kits (0/1/2) and a `10%+` mass margin.

2. **MANAGE (`Sol 1–14`, surface operations and approach):**
   - **Main task 1 — forensics on lost vehicles:** find the `Opportunity`, `Spirit`, `Phoenix`, `InSight` and bonus `Beagle 2` wrecks, collect 3 kinds of evidence (photo, black-box telemetry, spectrometer/environment reading), diagnose one of 5 failure categories (`Power/Dust`, `Thermal`, `Mechanical`, `Software/Sensor`, `Communication`), send the report to Earth and salvage parts.
   - **Main task 2 — the Mars lab (6 experiments):** each runs hypothesis → environment (inside vs. outside) → control group → measurement minigame → result card (*pendulum gravity, free fall/jump, seed germination, water boiling at the triple point, speed of sound, MOXIE night/day output*).
   - **Crisis cards and engineering mechanics:**
     - **Data budget / downlink queue (`Mbit/sol`):** photos and results only score once they reach Earth.
     - **Power load prioritisation (load shedding):** order life support, heating, greenhouse, MOXIE, experiments and comms.
     - **Point of no return:** a live $O_{2,\text{needed}}$ notch during an EVA, based on distance and frozen joints.
     - **Delayed Mission Control:** the one-way Earth–Mars light delay (~3–22 min) means the astronaut makes urgent calls alone.

3. **EVALUATE (`Sol 14+`, report card and UFO stinger):**
   - **Cause-and-effect report card:** built from `decisionLog[]`, it shows the measured effect of each design and crisis decision and compares the run with real NASA missions.
   - **UFO finale (~40 s stinger):** an anomaly on the horizon during the MAV launch downloads `80%` sharp or `30%` blurred depending on the chosen camera (`Mastcam-Z` vs. hand camera) and the data budget left (`Mbit`), then the signal is cut by solar conjunction (*a nod to the Viking 1976 "Face on Mars"*).

---

## 📊 NASA Space Apps requirement matrix

| Challenge concept | In the game | Screen | NASA data source |
| :--- | :--- | :--- | :--- |
| **Mission objectives** | Primary (forensics) + secondary (experiments) objective; minimum and full success criteria | Sol 0 screen 1 | NSSDCA Master Catalog |
| **Spacecraft design** | Habitat, ascent vehicle (MAV), rover, greenhouse, insulation and power module | Sol 0 screen 3 | NSSDCA, SST SoA |
| **Scientific instruments** | Up to 5 of 9 instruments; each unlocks specific gameplay | Sol 0 screen 4 | NSSDCA (Perseverance / InSight) |
| **Launch vehicles** | 3 rockets: mass capacity (kg), cost ($) and $\Delta v$ limit | Sol 0 screen 2 | NASA ELV Performance |
| **Budgets** | `$` budget, mass (`kg`), power (`W`) and data (`Mbit/sol`) bars | All of Sol 0 + HUD | Calibrated against real mission costs |
| **Power** | $P = S \cdot A \cdot \eta \cdot \cos Z \cdot (1 - d_{\text{dust}})$; battery (20/40/60 kWh); RTG/RHU | HUD energy bar + power panel | Planetary Fact Sheet, SST SoA |
| **Mass** | Live mass bar against rocket capacity + `10%` mass-margin bonus | All Sol 0 screens | NASA ELV Performance |
| **Communication** | Data budget (`Mbit/sol`), MRO/MAVEN relay passes, light delay, conjunction blackout | HUD downlink tab | DSN Now, JPL Horizons |
| **Orbit constraints** | Launch window (26 months), Hohmann (~8 months) vs. fast (~6 months) transfer, MAV orbital rendezvous | Sol 0 screen 2 + Sol 14 | Trajectory Browser, JPL Horizons |
| **Concept → operation** | Sol 0 design decisions shape the Sol 1–14 surface operations directly | Whole game | — |
| **Evaluate how choices shape success** | Cause-and-effect report card from `decisionLog[]` + comparison with real NASA missions | Final report screen | NSSDCA mission archives |

---

## 🚀 Quick start

The project runs straight in the browser with no setup:

```bash
# Start a local development server:
npx serve .
# or with Python:
python -m http.server 8080

# Build the data bundle and run all tests:
npm test
```

* **Normal game:** `http://localhost:8080/`
* **Judges' quick mission / demo (5 sols, about 3 minutes):** `http://localhost:8080/?demo=1`
* **Language:** the game starts in English; switch between **EN / TR** from the main menu (or add `?lang=tr`).
* The game also runs by double-clicking `index.html` (`file://`).

---

## 📁 Documentation map

* [AGENTS.md](AGENTS.md) — team roles (`K1–K6`), file ownership and the AI agent working protocol
* [RULES.md](RULES.md) — scientific accuracy rules, code standards, art/audio constraints and Git rules
* [REQUIREMENTS.md](REQUIREMENTS.md) — functional (M1–M9), scientific and NASA Space Apps submission requirements
* [PLAN.md](PLAN.md) — the 30-hour (`S0–S30`) schedule, milestones, cut decisions and build order
* [ARCHITECTURE.md](ARCHITECTURE.md) — technical architecture, central `gameState`, event bus, folder layout and asset mapping
* [DESIGN.md](DESIGN.md) — pixel-art visual design, colour palette, UI/HUD layout, audio and scene flow
* [API.md](API.md) — `engineering.js` formulas, `gameState` schema, minigame contract and JSON data schemas
* [TESTING.md](TESTING.md) — `node --test` checks, QA scenarios, debug console and Definition of Done
* [DEPLOYMENT.md](DEPLOYMENT.md) — GitHub Pages hosting, `?demo` mode and the Space Apps submission checklist
* [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guide, commit message templates and module boundaries
* [SECURITY.md](SECURITY.md) — security, copyright/licence (`CC0`) compliance and client-side data safety
* [CHANGELOG.md](CHANGELOG.md) — design v1 → v2 and version history
* [docs/decisions/0001-technical-decision.md](docs/decisions/0001-technical-decision.md) — ADR 0001: vanilla JS + HTML5 Canvas + DOM/CSS UI and a single `gameState`

---

## ⚖️ Licence and statements

* **Art and audio:** the pixel art was made for this project (AI tool use is disclosed in [REFERENCES.md](REFERENCES.md)); sound effects are `CC0` (public domain) or synthesised with the Web Audio API. No copyrighted film or game material and no official NASA logos are used without permission.
* **Fiction note:** the ~40 s *UFO stinger* at the end is an artistic fiction that refers to the Viking 1976 *"Face on Mars"* (pareidolia) and highlights the role of camera resolution and data bandwidth in scientific discovery.
