# SOL 14: RED HORIZON — Space Apps Project Page (copy-paste text)

> Challenge: **Space Mission Design Game** · NASA Space Apps Challenge 2026
> Each section below matches a field on the Space Apps project submission page. Replace the two `<…>` links before submitting.
>
> - **Play (full mission, 14 sols):** `<GitHub Pages URL>/`
> - **Jury quick mission (5 sols, ~3 min):** `<GitHub Pages URL>/?demo=1`

---

## 1. High-Level Project Summary

**SOL 14: RED HORIZON is a 16-bit pixel-art game in which you design a crewed Mars mission under real NASA constraints, live with the consequences of that design for 14 sols on the surface, and finish with a Cause-and-Effect Report Card that shows how each engineering decision shaped mission success.**

The game follows the three phases of a real mission:

1. **DESIGN (Sol 0).** In five console screens the player sets mission objectives, picks one of 3 launch vehicles and 2 transfer trajectories, catches or misses the 26-month launch window, chooses one of 3 landing sites, a power source (solar or solar + RTG), battery (20/40/60 kWh) and insulation, selects up to 5 of 9 real NASA instruments, and decides on communications (UHF relay only, or relay + X-band direct-to-Earth) and spare repair kits. Live budget, mass, night-energy and data bars react to every choice, and a Single-Point-of-Failure analyzer flags fragile designs before launch.
2. **OPERATE (Sols 1–14).** The crew walks a 1.6 km side-scrolling corridor in 0.38 g. Their two main objectives are a forensic investigation of 5 lost spacecraft (Opportunity, Spirit, Phoenix, InSight and the bonus Beagle 2) and 6 lab experiments. Around these run 12 types of crisis card (dust storm, marsquake, solar particle event, frozen fuel valve, suit leak, flash-memory amnesia and more), a power load-shedding panel, a downlink queue limited by relay passes and light delay, and a Point-of-No-Return oxygen notch on every EVA. Science only scores once it reaches Earth.
3. **EVALUATE (end of mission).** The Mars Ascent Vehicle launches, an anomaly appears on the horizon, and the last image downloads line by line until solar conjunction cuts the signal. How much of it you see depends on the camera and bandwidth you chose on Sol 0. A Cause-and-Effect Report Card then traces decisions to outcomes (for example *"Solar only + 20 kWh battery + thin insulation → greenhouse froze on Sol 7 night (−120 pts)"*) and compares your architecture with Perseverance, Opportunity and InSight.

The game is fully bilingual (English / Turkish), runs in any browser with no installation (it even works by double-clicking `index.html` offline), and needs no account, server or tracking.

---

## 2. How We Addressed the Challenge

Every concept named in the challenge maps to a screen the player uses and a calculation driven by NASA data:

| Challenge concept | Where it appears in the game | Model / formula and data |
| :--- | :--- | :--- |
| **Mission objectives** | Sol 0 screen 1: Forensics-focused, Experiment-focused or Balanced. Each sets score multipliers and *Minimum* vs. *Full Success* criteria. | Success = forensic reports + experiments **delivered to Earth** + safe return |
| **Spacecraft design** | Sol 0 screen 3: habitat, power source, battery, insulation, greenhouse (Veggie), MAV | Night heating load `P_heat = UA·(T_in − T_out) − RTG/RHU waste heat`, UA = 3.0 or 1.5 W/K |
| **Scientific instruments** | Sol 0 screen 4: up to 5 of 9 (Mastcam-Z, MEDA, SEIS, RAD, RIMFAX, SuperCam/PIXL, MOXIE, Veggie, Ingenuity). Each unlocks gameplay, e.g. MEDA forecasts storms 1 sol ahead and SEIS gives quake warnings. | Mass, power, cost and data rate per instrument from NSSDCA records |
| **Launch vehicles** | Sol 0 screen 2: Falcon Heavy, Vulcan Centaur, SLS Block 1B | Mass delivered to the Mars surface vs. cost (NASA ELV Performance) |
| **Budgets** | Live bars on every Sol 0 screen: $ budget ($1.1 B cap), mass, night energy, data (Mbit/sol) | Over-budget or over-mass designs cannot launch |
| **Power** | Surface HUD, battery bar, Power Load Prioritization panel (M3) | `P = S·A·η·cos Z·(1 − d_dust)·e^(−k·τ)` with S ≈ 586.2 W/m², A = 22 m², η = 0.28. When power runs short, the lowest-priority loads are shed automatically. |
| **Mass** | Mass bar vs. rocket capacity; ≥ 10% margin earns a bonus | `margin = (capacity − mass) / capacity`; the fast transfer costs 180 kg of capacity |
| **Communication** | Downlink queue (M1), relay pass timeline, light-delay readout, *Consult Mission Control* in crisis cards (M7) | MRO / MAVEN UHF passes + optional X-band DTE (45 vs. 80 Mbit/sol). One-way delay `t = d / c` from JPL Horizons distances; asking Earth costs 2 × delay of mission time. Solar conjunction blacks out the final sol. |
| **Orbit constraints** | Sol 0 screen 2: Hohmann (~8.5 months, 259 days) vs. fast transfer (~6 months, 180 days); 26-month synodic window; MAV ascent at the end | Transit radiation dose = days × 1.84 mSv/day (MSL RAD cruise data) |
| **From concept to operation** | Every Sol 0 choice changes surface play: battery size decides whether the greenhouse survives the night, the camera decides photo quality, the comms choice decides how much data gets home | Single shared mission state; all numbers read from `data/nasa_data.json` |
| **Evaluate how choices shape success** | Cause-and-Effect Report Card (M5) + Decision Log | Each decision and crisis choice is recorded with its sol, cost and score, then turned into cause → effect chains and a comparison table with Perseverance, Opportunity and InSight |

**Additional mechanics grounded in real operations**

- **Point of No Return (M4):** on EVA, a red notch on the O₂ bar shows the oxygen needed to get back: `O₂_req = (distance / speed) · consumption · 1.2`. When the −80 °C night freezes suit joints, speed drops to 40% and the notch jumps 2.5× further.
- **Forensics loop:** the player collects 3 evidence types (photo, black-box telemetry, environment measurement), diagnoses one of 5 failure categories (power/dust, thermal, mechanical, software/sensor, comms), queues the report for downlink, then reads the real NASA/ESA finding and its design lesson. Salvaged parts (RHU heaters, SEIS, a spare UHF antenna) change later crises.
- **0.38 g laboratory:** 6 experiments follow hypothesis → environment → optional control group → measurement mini-game → result compared with Earth: pendulum period, free fall, seed germination in perchlorate-washed regolith, water at the triple point, speed of sound and MOXIE night/day output. Successful results unlock survival rewards. For example, the germination result raises greenhouse yield by 30%.
- **Quality assurance:** 37 automated tests check the formulas, data provenance, translation completeness, and three opposite design profiles played end to end by a headless bot.

---

## 3. Scientific Validity & 6 Engineering Corrections

Our first design draft repeated six common Mars misconceptions. We corrected each one against NASA sources, and each correction is now a game mechanic:

| # | Common misconception | What we model instead | Where you meet it |
| :-: | :--- | :--- | :--- |
| 1 | Mars nights are about −60 °C | −60 °C is roughly the **global average**. At equatorial and mid latitudes nights fall to **about −80 °C** (down to −95 °C at Arcadia), and day–night swings are 70–100 °C. | Night heating load, suit cooling, joint freeze, greenhouse freeze |
| 2 | "Heat waves" threaten the crew | The atmosphere is only **~0.6 kPa** (under 1% of Earth's), so convective cooling barely works. The real failure is a **clogged radiator / heat-rejection fault**. | *Clogged Radiator* crisis |
| 3 | A violent quake throws astronauts around | The largest marsquake InSight recorded was **~M4.7** (2022), and gravity is **0.38 g (3.73 m/s²)**. We model a nearby meteor impact plus a moderate quake: toppling racks, strained seals, no flying crew. | *Meteor Impact + M4.7 Quake* crisis, SEIS early warning |
| 4 | Radioisotopes can be turned into rocket fuel | Pu-238 only provides **electricity and heat (RTG / 1 W RHU)**. Return propellant comes from **ISRU: the Sabatier reaction `CO₂ + 4H₂ → CH₄ + 2H₂O`** plus electrolysis. | Sabatier fuel batches for the MAV, salvaged RHU heaters |
| 5 | Crops are harvested within 14 sols | Potatoes and tomatoes take months. We grow only fast crops that were really grown on the ISS: **radish (27 days), lettuce (~33 days), zinnia (~60 days to flower)**. The game **compresses** these to 2–4 tended sols in the same order and says so on screen. A **seed germination experiment** in perchlorate-washed regolith (Phoenix found 0.4–0.6% perchlorate in 2008) raises the greenhouse yield. | Greenhouse growth stages and harvest, Seed Germination experiment |
| 6 | Talking to Earth is instant | One-way light delay is **~3 to 22 minutes**, depending on orbital positions. During **solar conjunction** the Sun blocks the link entirely. Martian sunsets are **blue**, while the daytime sky is butterscotch. | Downlink queue, *Consult Mission Control* delay, final-sol blackout, blue sol-transition sunsets |

Other values we checked against sources: surface gravity 3.73 m/s², mean solar irradiance ≈ 586.2 W/m², surface pressure ≈ 0.636 kPa, water triple point 0.611 kPa, speed of sound ≈ 240 m/s (SuperCam microphone), MOXIE output ≈ 6 g/h by day and ≈ 10 g/h at night, Opportunity's 2018 storm optical depth τ ≈ 10.8, and transit radiation ≈ 1.84 mSv/day. Every number in the game lives in `data/nasa_data.json` next to a `src` URL, and an automated test fails the build if any numeric record lacks an official source. Values scaled for gameplay (rocket payloads, habitat loads, suit figures) are flagged `simplified` with the real figure and its source beside them.

---

## 4. Official NASA Data Sources Used

| Source | What we used it for | URL |
| :--- | :--- | :--- |
| **NSSDCA Master Catalog** | Instrument mass, power and data rate; spacecraft records for Opportunity, Spirit, Phoenix, InSight, Perseverance and Ingenuity; landing-site coordinates | https://nssdc.gsfc.nasa.gov/nmc/ |
| **NSSDCA Mars Fact Sheet** | Gravity, solar irradiance, surface pressure, atmospheric composition, sol length | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html |
| **NASA ELV Performance (KSC)** | Launch-vehicle payload capability vs. cost | https://elvperf.ksc.nasa.gov/ |
| **NASA Trajectory Browser (Ames)** | Hohmann vs. fast transfer durations, 26-month synodic launch windows | https://trajbrowser.arc.nasa.gov/ |
| **JPL Horizons** | Earth–Mars distance per sol → one-way light delay; solar conjunction | https://ssd.jpl.nasa.gov/horizons/ |
| **DSN Now** | Relay vs. direct-to-Earth (X-band) link architecture and pass scheduling | https://eyes.nasa.gov/apps/dsn-now/ |
| MSL RAD instrument | Cruise and surface radiation dose rates | https://mars.nasa.gov/msl/spacecraft/instruments/rad/ |
| Mission pages: MER Opportunity, MER Spirit, Phoenix, InSight, Perseverance (MOXIE, SuperCam microphone), MRO, MAVEN | Failure findings for the forensics cases, MOXIE output, speed of sound, relay orbiters | https://science.nasa.gov/mission/mer-opportunity/ · https://science.nasa.gov/mission/mer-spirit/ · https://science.nasa.gov/mission/phoenix/ · https://science.nasa.gov/mission/insight/ · https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/ · https://science.nasa.gov/mission/mars-reconnaissance-orbiter/ · https://science.nasa.gov/mission/maven/ |
| Radioisotope Power Systems | RTG / RHU power and heat | https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/ |
| Phoenix perchlorate finding | Seed germination experiment, perchlorate dust crisis | https://science.nasa.gov/resource/phoenix-finds-perchlorate/ |
| ESA: Beagle 2 found on Mars | Bonus forensics case (partial solar-panel deployment blocking the antenna) | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Beagle-2_lander_found_on_Mars |
| The Face on Mars (Viking 1, 1976) | Inspiration for the fictional final scene | https://science.nasa.gov/resource/the-face-on-mars/ |

---

## 5. AI & Asset Transparency Disclosure

- **Visual assets:** All 16-bit pixel-art backgrounds, sprites, structures, effects and ending images were generated for this project with AI image tools, using our own prompt library (`docs/design/ai-image-prompts.md` in the repository). No sprites or art were copied from commercial games or films, and no official NASA insignia (the "meatball" or "worm") is used as an endorsement. Spacecraft are referenced by name only, with links to their official records.
- **Audio:** Every sound effect (wind, alarms, UI clicks, radio pings, the final signal) is synthesized live in the browser with the Web Audio API. The project contains no recorded or copyrighted audio files.
- **Code and text:** AI coding assistants were used to help write and test code and bilingual text. Scientific values come from the NASA sources listed above, are stored with their source URLs, and are checked by automated tests.
- **Fiction notice:** **The UFO scene at the end of the game is fiction. It is a tribute to the Viking 1 "Face on Mars" pareidolia episode of 1976.** What the player can "prove" in the final image depends on the camera resolution and downlink bandwidth they designed on Sol 0: about 80% of a sharp frame with Mastcam-Z and X-band, 65% with Mastcam-Z on UHF relay only, or 30% of a blurry frame with a hand camera. The same notice is shown in-game on the main menu, the final transmission screen and the report card.
