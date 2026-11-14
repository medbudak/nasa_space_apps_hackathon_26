# SOL 14: RED HORIZON — 7-Slide Global Jury Deck & 30-Second Video Script (K5)

**Competition:** NASA Space Apps Challenge 2026 (Sakarya) — *Space Mission Design Game*

---

## 🎬 30-Second Global Demo Video Script (English Subtitles)

| Timecode | Visual on Screen | English Voiceover / Subtitle |
| :---: | :--- | :--- |
| **00:00 – 00:05** | Title Card (`cover_thumbnail.png`) + Astronaut in Jezero Crater | *"SOL 14: RED HORIZON — Design a crewed Mars mission under real NASA constraints, then survive your own engineering choices."* |
| **00:05 – 00:12** | **Sol 0 Design Console:** Selecting `Vulcan Centaur`, `Jezero`, and `MOXIE + SEIS` (Power & Mass bars turn red, SPOF warning flashes) | *"On Sol 0, every instrument, orbit, and battery choice trades off mass, power, budget, and data bandwidth."* |
| **00:12 – 00:20** | **Surface HUD & Crisis Card:** Dust storm hits ($\tau = 8.5$), Point-of-No-Return $\text{O}_2$ notch pulses red, diagnosing *Opportunity*'s wreck | *"On Mars, investigate 5 lost spacecraft, run 0.38g lab experiments, shed power loads during storms, and manage your downlink queue."* |
| **00:20 – 00:25** | **Cause-and-Effect Report Card (`M5`):** Showing how `MMRTG + Thick Insulation` saved the greenhouse & NASA mission comparison | *"At the end, a Cause-and-Effect Report Card evaluates how every decision shaped mission success against real NASA missions."* |
| **00:25 – 00:30** | **UFO Stinger Ending:** MAV liftoff, bright anomaly on horizon, scanline telemetry photo downloading to `80%` before `SOLAR CONJUNCTION` cuts signal | *"Even the final mystery depends on the camera and bandwidth you designed. Design your next mission in SOL 14!"* |

---

## 📊 7-Slide Presentation Deck (English — Global Judging Criteria)

### Slide 1: Title & Core Hook (*Impact & Relevance*)
* **Project:** SOL 14: RED HORIZON
* **One-Sentence Pitch:** Players design a crewed Mars mission under strict budget, mass, power, orbit, and data bandwidth constraints (`Sol 0`), live the operational consequences for `14 Sols`, and receive a Cause-and-Effect Report Card benchmarked against real NASA missions.

### Slide 2: The Problem & NASA Challenge Alignment (*Relevance*)
* Real space mission design is the art of engineering trade-offs: taking `MOXIE` (`300 W, 17 kg`) + `SEIS` (`30 kg`) drains night batteries unless paired with an `MMRTG` or `60 kWh` battery, which eats into your `10%` mass margin.
* Every keyword from the NASA Challenge prompt (*Mission objectives, Spacecraft design, Scientific instruments, Launch vehicles, Budgets, Power, Mass, Communication, Orbit constraints, Evaluate how choices shape success*) maps to a live interactive screen.

### Slide 3: Sol 0 Engineering Console & Single Point of Failure (`SPOF` - *Validity*)
* **5-Screen Mission Architecture:**
  1. Primary/Secondary Objectives (Minimum vs. Full Success criteria)
  2. 3 Launch Vehicles × 2 Transfer Orbits (`Hohmann ~8.2 mo` vs. `Fast ~5.8 mo`) & 26-Month Synodic Window
  3. 3 Landing Sites (`Meridiani 2°S`, `Jezero 18°N`, `Arcadia 39°N`) + Solar/RTG + Insulation
  4. Payload Selection: Choose up to **5 out of 9 real NASA instruments** (`Mastcam-Z, MEDA, SEIS, RAD, RIMFAX, SuperCam, MOXIE, Veggie, Ingenuity`)
  5. UHF Relay vs. Direct X-Band + Live `SPOF` risk analyzer

### Slide 4: Dual Science Loops — Forensics & 0.38g Lab (*Creativity & Validity*)
* **Objective 1 — Lost Spacecraft Forensics:** Investigate *Opportunity, Spirit, Phoenix, InSight,* and *Beagle 2*. Collect 3 evidence types, diagnose the real failure mode, salvage `RHU` heaters or `SEIS`, and compare against official NSSDCA findings.
* **Objective 2 — 6 Lab Experiments:** Hypothesis → Environment → Earth Control Group (`+50%` score) → Measurement Minigame ($T = 2\pi\sqrt{L/g} \rightarrow g = 3.71\text{ m/s}^2$, triple-point water boiling at `0.61 kPa`, perchlorate soil washing, `240 m/s` acoustic speed, `MOXIE` night density).

### Slide 5: Survival Mechanics — Data Downlink, Load Shedding & Point of No Return
* **Data Budget (`M1`):** Unsent photos, forensic reports, and experiments score `0` points until transmitted via `MRO`/`MAVEN` passes.
* **Power Load Prioritization (`M3`):** Automatic load shedding when dust storms ($\tau > 8$) drop solar output by `80%`.
* **Point-of-No-Return $\text{O}_2$ Notch (`M4`):** Live HUD calculation ($O_{2,\text{req}} = \frac{d}{v} \cdot \dot{c} \cdot 1.2$) that spikes when `-80 °C` cold freezes suit joints to `40%` speed.

### Slide 6: Cause-and-Effect Report Card & Scientific Corrections (*Validity*)
* **Scientific Rigor:** Corrected common Mars misconceptions (`-80 °C` equatorial nights, radiative heat-rejection failure in `0.6 kPa` air instead of "hot weather", `~M4.7` tremors in `0.38g`, Sabatier ISRU $\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$).
* **Report Card (`M5`):** Traces every `Sol 0` and crisis decision (`decisionLog[]`) to its exact operational outcome and compares the player's architecture with *Perseverance, Opportunity,* and *InSight*.

### Slide 7: The UFO Stinger — A Tribute to Viking 1976 & Scientific Skepticism (*Presentation*)
* During `Sol 14` MAV liftoff, an optical anomaly appears on the horizon.
* The image downloads scanline-by-scanline at Earth Mission Control: **`80%` clear** if the player brought `Mastcam-Z` + high bandwidth, or **`30%` blurry** with a hand camera, before **Solar Conjunction** cuts the signal.
* *Moral (Viking 1976 "Face on Mars"):* In space exploration, what you can prove is determined by the resolution of your instruments and the bandwidth of your downlink.
