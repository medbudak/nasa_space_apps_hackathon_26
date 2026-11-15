# CHANGELOG.md — Version and Design History

This file records how **SOL 14: RED HORIZON** moved from the first design draft (`v1`) to **game design v2**, which covers the NASA Space Apps Challenge requirements, and the steps after it. Later decisions (v3 and on) are in [DECISIONS.md](DECISIONS.md).

---

## [v2.0.0] — 2026-11-14 (game design v2 & full implementation)

### ✨ Added
- **Sol 0 mission design console (5 screens):** mission objective, 3 rockets × 2 trajectories (`Hohmann ~8 months` vs. `fast ~6 months`), the 26-month launch window, 3 landing sites (`Meridiani`, `Jezero`, `Arcadia`), up to 5 of 9 real NASA instruments, comms architecture (`UHF relay` vs. `X-band`) and the single-point-of-failure (`SPOF`, `M8`) warning.
- **M1 — data budget and downlink queue (`Mbit/sol`):** wreck photos, forensic reports and experiment results only score once sent to Earth during `MRO`/`MAVEN` relay passes.
- **M2 — crisis decision cards and `decisionLog[]`:** every crisis offers 2–3 options with their exact costs.
- **M3 — power load priority panel (load shedding):** reorder life support, heating, greenhouse, MOXIE, experiments and comms, with automatic load shedding.
- **M4 — point-of-no-return gauge:** a live $O_{2,\text{needed}}$ red notch on the $\text{O}_2$ bar during an EVA, including frozen joints (`40%` speed).
- **M5 — cause-and-effect report card:** shows how each design and operations decision shaped mission success, compared with real NASA missions.
- **M7 & M9 — delayed Mission Control and the `?demo` quick mission:** the real light delay ($3\text{–}22$ min) and a `5-sol` mode for judges.
- **Main task 1 (forensics on 5 lost vehicles):** 3 kinds of evidence, a diagnosis from 5 failure categories, part salvage and NASA finding cards for `Opportunity`, `Spirit`, `Phoenix`, `InSight` and bonus `Beagle 2`.
- **Main task 2 (6 experiments):** hypothesis → environment → control group → measurement → result (*pendulum, free fall, seed germination, boiling water, speed of sound, MOXIE output*).
- **UFO stinger (~40 s):** a line-by-line telemetry photo that arrives `80%` sharp or `30%` blurred depending on the camera (`Mastcam-Z` vs. hand camera) and the data budget left, closed by solar conjunction.
- **Image library:** 32 pixel-art assets mapped into the `assets/` folders, with flood-fill chroma keying of the `#FFFFFF` backgrounds.

### 🔬 Scientific validity fixes
- Mars night temperature updated from the `-60 °C` global average to the real equatorial/mid-latitude night value of **`-80 °C`**.
- The scientifically wrong *"heat wave on Mars"* became a **"heat rejection / clogged radiator failure"** in the thin (`~0.6 kPa`) atmosphere.
- *"Thrown through the air in a violent quake"* became, in line with InSight data, an **`~M4.7` quake + a nearby meteorite impact and tipping shelves (`0.38 g`)**.
- *"Fuel synthesised from a radioactive isotope"* became **RHU heat + a Sabatier reactor ($\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$)**.
- *"Potato/tomato harvest within 14 sols"* became a **seed germination and perchlorate-washing experiment** (later a compressed, labelled harvest of fast space-station crops, D-017).
