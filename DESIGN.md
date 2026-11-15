# DESIGN.md — Art Direction, UI/UX Layout and Game Design Details

This document describes the 2D pixel-art visual language of **SOL 14: RED HORIZON**, its science-based colour palette, the screen layouts (UI/HUD) and the storyboard of the UFO stinger. It records design intent; where the shipped game differs, the code and [ARCHITECTURE.md](ARCHITECTURE.md) win.

---

## 1. Art style and science-based palette (`K4`)

The game uses a **2D pixel-art** look inspired by classic 1990s sci-fi adventures (*Another World, The Dig, Starflight*). Mars' real atmospheric optics are built into the palette:

| Colour | Hex | Use and the science behind it |
| :--- | :---: | :--- |
| **Rust red** | `#B84A27` | Iron oxide ($\text{Fe}_2\text{O}_3$)-rich surface regolith and canyon rock |
| **Dusty amber** | `#E08E55` | The daytime sky coloured by micron-sized dust in the air |
| **Blue sunset** | `#5B9BD5` | The real blue glow around the setting Sun, from fine dust scattering blue light forwards |
| **Deep Martian night** | `#0B1021` | The night sky through a `~0.6 kPa` atmosphere; Phobos and Deimos |
| **Cryo cyan** | `#8BE9FD` | Ice crystals on the helmet visor and in the greenhouse at `-80 °C` |
| **Terminal green** | `#3FB950` | Healthy life support, clean solar panels and a healthy greenhouse |
| **Caution amber** | `#D29922` | A critical system without a backup (`M8`), dusty panels or medium risk |
| **Alert red** | `#F85149` | Past the point of no return (`M4`), critical $\text{O}_2$, radiator or storm crises |

* **Grid and scale:** character and wreck sprites align to a `48×48` pixel grid (or multiples) and are drawn sharp with `image-rendering: pixelated`.

---

## 2. Screens and user interface (`K3`)

### 2.1 Sol 0: mission design console (5 steps)
* **Fixed top bar (4 budget bars):**
  1. **Budget (`$M`):** the total cost of the chosen rocket, modules and instruments.
  2. **Mass (`kg / max kg`):** fill against rocket capacity + a `10%` mass-margin safety line.
  3. **Power balance (`production W vs. use W`):** a night battery warning (e.g. choosing `MOXIE 300 W + SEIS 8 W` with a small `20 kWh` battery turns red).
  4. **Data capacity (`Mbit/sol`):** the daily downlink limit from the relay and X-band choice.
* **Centre panel:** 5 steps (*1. Objective, 2. Rocket & trajectory, 3. Landing site & habitat, 4. Instruments [5 of 9], 5. Comms & redundancy*).
* **Right panel:** a 2.2:1 preview illustration per step and the live result of the choice; the final check lists critical systems left without a backup with an amber badge (`M8`).

### 2.2 Surface operations HUD (`Sol 1–14`)
* **Top status (live gauges + the point-of-no-return notch):**
  - `SOL X / 14` and the time/phase (`DAY` / `BLUE SUNSET` / `NIGHT -80 °C`).
  - **Oxygen (`O2 %`)** with the red **point of no return (`M4`)** notch.
  - **Energy (`kWh %`)** with net production/use (`+W / -W`).
  - **Suit/body temperature (`°C`)** with the frozen-joint threshold.
  - **Radiation (`mSv`) and morale.**
  - **Data queue (`Mbit/sol`):** data waiting to be sent.
* **Views:**
  1. **Surface & EVA (canvas):** parallax Mars ground, the astronaut walking and jumping at `0.38 g`, the lander, greenhouse, MAV, solar panels, MOXIE and the VFX layers (storm, visor frost, dust devil, shadow figure).
  2. **Exploration:** the east and west routes with buried wrecks, the lava tube and the glacier; distances (`m`), O₂ cost, `Ingenuity` scouting and the forensics panel.
  3. **Greenhouse & life support:** healthy/frozen greenhouse, water electrolysis and Sabatier fuel production.
  4. **Lab desk:** hypothesis, environment, control group and measurement for the 6 experiments.
  5. **Downlink console (`M1`) and power panel (`M3`):** queue photos, forensic reports and experiments for the `MRO`/`MAVEN` passes and change the system priority order.

---

## 3. Crisis card (`M2`) and delayed Mission Control (`M7`)

When a crisis triggers, a retro-terminal **crisis card** opens in the centre of the screen:
* **Top:** the crisis title, its scientific explanation and the current critical resources.
* **Options (`A / B / C`):** each shows its **exact cost** (`-15 kWh energy`, `-12% O2`, `+1 sol delay`, `greenhouse shuts down`, …).
* **"Ask Mission Control" (`M7`):** shows the real one-way light delay for today's Earth–Mars distance ($t_{\text{delay}} \approx 3\text{–}22$ min); asking costs the two-way delay in game time and resources and then reveals the recommended option.

---

## 4. UFO stinger storyboard (~40 seconds)

At the end of the game (the `Sol 14` MAV launch) a ~40 s cinematic plays before the report card:

### Scene 1: liftoff (0–10 s)
* **Image:** `assets/ending/ufo_liftoff.png`
* **Action:** the Mars Ascent Vehicle (MAV) fires its engines; the surface falls away through red dust.

### Scene 2: the anomaly on the horizon (10–18 s)
* **Image:** `assets/ending/ufo_sky.png`
* **Action:** a bright light rises parallel to the MAV and holds at an impossibly sharp angle. The cockpit camera takes a photo automatically.
* **HUD:** `"The image will reach Earth in 14 min 22 s (JPL Horizons light delay)"`

### Scene 3: line-by-line download (18–30 s)
* **Image:** `ufo_photo_clear.png` (`80%`) or `ufo_photo_blur.png` (`30%`)
* **Action:** on Mission Control's screen the photo arrives top to bottom, **scanline by scanline**, like real rover telemetry:
  - `Mastcam-Z` + enough data budget → arrives **`80%` sharp** (a metallic triangular disc is visible).
  - Hand camera or a low data budget → arrives **`30%` blurred** (a pixelated light blob).

### Scene 4: solar conjunction and close (30–40 s)
* **Action:** the download bar suddenly turns red and stops at `X%`; the light blinks three times.
* **Alert:** `"SOLAR CONJUNCTION — SIGNAL LOST"`
* **Analyst note:** *"Could be pareidolia (Viking 1976). Confirming it needs a new mission with more bandwidth."*
* **Button:** `"See the cause-and-effect report card / Design the next mission yourself"`
