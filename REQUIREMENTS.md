# REQUIREMENTS.md — Functional, Scientific and Submission Requirements

This document lists the gameplay mechanics, the scientific simulation requirements and the NASA Space Apps (global and local) submission criteria that **SOL 14: RED HORIZON** must meet.

---

## 1. Sol 0: mission design requirements (5 screens)

Before the mission the player makes a 5-step engineering design under **budget (`$`), mass (`kg`), power (`W`) and data (`Mbit/sol`)** limits. Going over a limit locks (or warns on) **"Launch"**, and critical systems without a backup light up amber as a **single point of failure (`SPOF`, M8)**.

| Screen | Decision | Options | Engineering trade-off |
| :---: | :--- | :--- | :--- |
| **1** | **Mission objective** | Forensics-heavy / experiment-heavy / balanced | Sets the score multipliers and NASA-style **minimum success** / **full success** criteria. |
| **2** | **Rocket + trajectory** | 3 rockets (`Falcon Heavy` / `Vulcan Centaur` / `SLS Block 1B` class) × 2 trajectories (`Hohmann ~8 months` / `fast transfer ~6 months`) | The fast trajectory means less radiation dose and fewer consumables, but needs more $\Delta v$ propellant, which lowers payload capacity (`kg`). |
| **2** | **Launch window** | Catch the window (alignment every 26 months) / delay | Missing or delaying the window eats into the starting budget (`$`) through holding costs. |
| **3** | **Landing site** | **Equator** (`Meridiani Planum`) / **Jezero Crater** (`18°N`) / **mid-latitude** (`Arcadia Planitia, ~40°N`) | *Equator:* lots of sun, relatively mild, little ice. *Mid-latitude:* plenty of subsurface ice, very cold, short days. *Jezero:* balanced. |
| **3** | **Power, battery & insulation** | **Power:** solar panels / panels + RTG (`~110 W, ~45 kg`)<br>**Battery:** `20` / `40` / `60 kWh`<br>**Insulation:** thin / thick | An RTG ignores storms and dust but is very expensive and heavy. Thick insulation halves night heating power but adds mass. |
| **4** | **Instruments** | **Up to 5** of 9 instruments | Mass, budget and power force a choice; every instrument left behind is missed on the surface. |
| **5** | **Comms & redundancy** | **Comms:** UHF relay only (`MRO/MAVEN`) / relay + direct-to-Earth (`X-band`)<br>**Repair kits:** `0` / `1` / `2`<br>**Mass margin:** `0–20%` | X-band redundancy keeps the link if an antenna fails. Each repair kit solves one crisis. A `10%+` mass margin gives an engineering bonus on the report card. |

---

## 2. Instrument catalogue (9 instruments)

| # | Instrument (real NASA counterpart) | Mass (`kg`) | Power (`W`) | Data (`Mbit`) | Unlocks in the game | Without it |
| :-: | :--- | :---: | :---: | :---: | :--- | :--- |
| **1** | **High-resolution camera (`Mastcam-Z`)** | ~4.0 | ~17 | 20 Mbit / photo | Full-score wreck photos, zoom, the `80%` sharp UFO photo, microphone for the sound-speed experiment | A hand camera: half-score photos, a `30%` blurred UFO |
| **2** | **Weather station (`MEDA`)** | ~5.5 | ~17 | 1 Mbit / sol | Warns of storms and sudden cold 1 sol ahead; the water-boiling experiment | Storms and extreme cold arrive unannounced |
| **3** | **Seismometer (`InSight SEIS`)** | ~30.0 | ~8 | 5 Mbit / sol | Early warning of quakes / meteorite impacts (`30 s` to prepare) | The quake hits at once, shelves tip over |
| **4** | **Radiation detector (`RAD`)** | ~1.6 | ~4 | 1 Mbit / sol | Early warning of solar particle events (`SPE`) + a live dose gauge | The dose stays hidden; the shelter is reached too late |
| **5** | **Ground-penetrating radar (`RIMFAX`)** | ~3.0 | ~10 | 10 Mbit / scan | Shows subsurface water-ice deposits on the map | Ice is found by blind digging (more $O_2$ and time) |
| **6** | **Spectrometer (`SuperCam / PIXL`)** | ~11.0 | ~18 | 8 Mbit / reading | Measures perchlorate in the soil and dust thickness on wreck panels (forensic evidence) | Seeds may die in unwashed toxic soil; the 3rd forensic clue is missing |
| **7** | **Oxygen generator (`MOXIE`)** | ~17.0 | ~300 | — | Makes $\text{O}_2$ from atmospheric $\text{CO}_2$; unlocks experiment 6 | Only water electrolysis and a limited spare tank |
| **8** | **Plant chamber (`Veggie`)** | ~8.0 | ~100 | 2 Mbit / day | Controlled germination experiments + food + morale | The seed experiment can only run outside (and fails) |
| **9** | **Scout drone (`Ingenuity`)** | ~1.8 | rechargeable | 15 Mbit / flight | Scouts distant wrecks and a safe route from the air, avoids getting stuck in sand | Every wreck must be walked to ($O_2$ and frozen-joint risk) |

---

## 3. The two main tasks

### 3.1 Main task 1: forensics on lost vehicles (`systems/forensics.js`)
For each wreck the player completes a 5-step detective loop:
1. **Find:** dig it out at its site (the suit scanner reacts nearby; `Ingenuity` and RIMFAX help).
2. **Collect evidence (3 kinds):**
   - *Visual:* photos of the panels, wheels and antenna.
   - *Black-box telemetry:* read the last telemetry with the cable minigame (power, temperature, optical depth $\tau$).
   - *Environment:* measure dust thickness and tilt with the spectrometer/sensors.
3. **Diagnose:** pick one of 5 failure categories (`Power/Dust`, `Thermal`, `Mechanical`, `Software/Sensor`, `Communication`).
4. **Send the report:** through the downlink queue (costs `Mbit`; an unsent report scores `0`).
5. **Learn and salvage:** the real NASA/ESA finding card opens with an operational lesson, and a salvageable part goes into the inventory.

* **Cases (4 required + 1 bonus):**
  1. **Opportunity** (*June 2018* — global dust storm $\tau \approx 10.8$ → `Power/Dust` → salvage: `8 RHUs`).
  2. **Spirit** (*March 2010* — stuck in soft sand, could not tilt toward the winter Sun → `Mechanical + Thermal` → salvage: `8 RHUs, a wheel`).
  3. **Phoenix** (*November 2008* — polar-winter $\text{CO}_2$ ice broke a solar panel → `Thermal` → salvage: `robotic arm part`).
  4. **InSight** (*December 2022* — panels covered in dust, power ran out → `Power/Dust` → salvage: `SEIS seismometer`, solar panel).
  5. **Bonus: Beagle 2** (*2003 / found by MRO in 2015* — panels did not fully open and covered the antenna → `Communication + Mechanical` → salvage: `spare antenna`).

### 3.2 Main task 2: experiments (`systems/experiments.js`)
Each experiment follows a 6-step scientific-method loop: **choose a hypothesis (3 options) → choose the environment (inside vs. outside) → add a control group (+50% score) → run → measure (minigame) → result card & downlink**.
1. **Pendulum gravity (tutorial):** time 10 swings → $T = 2\pi\sqrt{L/g} \rightarrow g \approx 3.73\text{ m/s}^2$ (the period is `~1.62` times Earth's).
2. **Free fall / jump (tutorial):** a 2 m drop takes $t = \sqrt{2h/g} \approx 1.04\text{ s}$ (`~0.64 s` on Earth); a `0.38 g` jump is `~2.6` times higher.
3. **Seed germination (3 groups):** unwashed regolith (toxic perchlorate) vs. washed + fertilised regolith (sprouts in the habitat) vs. outside (dies at `~0.6 kPa`). *Reward: greenhouse output `+30%`.*
4. **Boiling water (triple point):** water put outside boils and freezes at the same time near the triple point because of the low pressure (`~0.6 kPa`). *Reward: you won't try to melt ice outside.*
5. **Speed of sound:** a clap + a microphone 50 m away → `~240 m/s` in the $\text{CO}_2$ atmosphere (`~343 m/s` on Earth).
6. **MOXIE night vs. day output:** the difference in $\text{O}_2$ output in the cold, denser night air (`~6–12 g/hour`). *Reward: run MOXIE at the efficient hours.*

---

## 4. Required and extra mechanics (`M1–M9`)

| Code | Mechanic | Priority | Description |
| :-: | :--- | :---: | :--- |
| **M1** | **Data budget / downlink queue** | **Required (P1)** | 2 relay passes per sol (`MRO`, `MAVEN`) and a limited `Mbit`. Photos, experiments, forensic reports and family messages queue up; unsent data does not score. |
| **M2** | **Decision card + decision log** | **Required (P1)** | Each crisis opens as a 2–3 option card; every option shows its cost, and the choice is saved to `decisionLog[]`. |
| **M3** | **Power load priority panel** | **Required (P1)** | An ordered list: *life support, heating, greenhouse, MOXIE, experiments, comms*. When power runs short the lowest switch off automatically (*load shedding*). |
| **M4** | **Point-of-no-return gauge** | **Required (P1)** | During an EVA a red notch on the $\text{O}_2$ bar marks the $O_{2,\text{needed}}$ to get home; frozen joints slow you and move the notch right. |
| **M5** | **Cause-and-effect report card** | **Required (P1)** | At the end, the most important decisions and their chains of consequences from `decisionLog[]`, compared with real NASA missions. |
| **M6** | **Sol planning summary** | Optional | A blue-sunset energy/telemetry summary between sols (`SOL X → SOL X+1`). |
| **M7** | **Delayed Mission Control** | **Required (P1)** | An answer from Earth comes $2 \times t_{\text{delay}}$ later, so the astronaut has to decide alone. |
| **M8** | **Single-point-of-failure (SPOF) warning** | **Required (P1)** | Critical systems without a backup show an amber warning in the `Sol 0` design screens. |
| **M9** | **Quick mission / `?demo` mode** | **Required (P1)** | A `5-sol` mode in which judges see the whole core loop and the UFO finale in 2–3 minutes. |

---

## 5. Scoring, success thresholds and loss conditions

* **Mission score:**
  $$\text{score} = \text{forensic reports (arrived)} + \text{experiment results (arrived)} + \text{survival} + \text{mass-margin bonus} - \text{lost systems}$$
* **Minimum mission success:** at least **2 forensic reports + 2 experiment results** reached Earth.
* **Full mission success:** at least **4 forensic reports + 4 experiment results** reached Earth **and** a safe return on the MAV at the end of `Sol 14`.
* **4 loss conditions (game over — the report card is still shown):**
  1. Oxygen ($\text{O}_2$) at zero.
  2. Body/suit temperature below the critical threshold for 2 game hours (hypothermia).
  3. Cumulative radiation dose over the mission limit.
  4. Morale at zero (Mission Control aborts the mission).

---

## 6. NASA Space Apps submission requirements

* **Language:** the game starts in English with a full in-game `EN / TR` switch; the project page, the 7 slides and the demo video subtitles are entirely **in English**.
* **Global demo format:** a video of at most **30 seconds** (English subtitles) or at most **7 slides**.
* **Open source and live link:** a link that runs directly on GitHub Pages + an open-source GitHub repository.
* **Transparency statements:** links to every NASA data source used (`NSSDCA`, `Planetary Fact Sheet`, `ELV`, `Horizons`, `DSN`), the AI image-generation statement and the note *"the UFO scene is fiction"*.
