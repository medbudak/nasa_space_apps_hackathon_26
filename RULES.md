# RULES.md — Project Rules, Scientific Accuracy and Code Standards

This document lists the scientific corrections, technical rules, art standards and team practices that are mandatory while building **SOL 14: RED HORIZON**.

---

## 1. Scientific accuracy rules (judging criterion "Validity")

To score as high as possible on the NASA Space Apps **Validity** criterion, these 6 scientific rules and corrections are always applied:

1. **Mars night temperature (`-80 °C`):**
   - `-60 °C` is Mars' global average; at the equator and mid-latitudes nights drop to **`-80 °C` and below**, while days near the equator can reach **`+20 °C`**. The day–night swing is modelled as `70–100 °C`.
2. **"Heat rejection (radiator) failure" instead of "hot weather":**
   - Mars cannot have a stifling "heat wave" because the atmosphere is very thin (`~0.6 kPa`, under `1%` of Earth's). Instead, convective cooling barely works in the thin air, so the game uses a **"clogged radiator / electronics and habitat heat-rejection failure"**.
3. **"Moderate quake + rockslide" instead of "violent quake and being thrown into the air":**
   - The largest marsquake InSight recorded was **`~M4.7`**, and Mars has **`0.38 g` (`3.73 m/s²`)** gravity; the astronaut is not thrown around. The event is a **"nearby meteorite impact + M4.7 shaking / shelves tipping over and loss of balance"**.
4. **"RHU heat + Sabatier reactor (ISRU)" instead of "fuel made from a radioactive isotope":**
   - A radioactive isotope (`Pu-238`) does not make chemical fuel; it is used only as an **RTG** (electricity + heat) or an **RHU** (`1 W` radioisotope heater unit). Return-fuel production (ISRU) is modelled with the **Sabatier reaction** ($\text{CO}_2 + 4\text{H}_2 \rightarrow \text{CH}_4 + 2\text{H}_2\text{O}$) and water electrolysis.
5. **Greenhouse harvest on a compressed, clearly labelled timescale (D-017):**
   - Potatoes and tomatoes do not give a harvest within 14 sols (it takes months). The game only has fast crops that were really grown on a space station: radish (27 days), lettuce (~33 days), zinnia (~60 days to flower). In the same order these are **compressed to 2–4 tended sols**; the greenhouse panel shows the real times and the compression (`simplified`). The **seed germination experiment** (perchlorate-rinsed regolith) runs separately and raises greenhouse output.
6. **Real communication and orbit constraints:**
   - The one-way Earth–Mars light delay is **`~3 to 22 minutes`**, depending on the planets' positions.
   - During **solar conjunction** the Sun sits between Earth and Mars and data links are cut completely.
   - Sunsets on Mars are **blue** because of dust scattering, while the daytime sky is rust/butterscotch.

---

## 2. Code and architecture rules

1. **One owner per file:** each developer or agent edits only the files assigned to them in `AGENTS.md`.
2. **Central `gameState`:** game state lives only in `src/core/state.js`; `localStorage` save/load happens in one place.
3. **Every number has a source (`src` field):** each numeric value in `data/nasa_data.json` carries a `src` field naming the official NASA/ESA source it was checked against (e.g. `"src": "https://nssdc.gsfc.nasa.gov/..."`).
4. **Bilingual text (`EN` / `TR`):** no English or Turkish player-facing string is hard-coded. All text sits in `content/story.json` under both `en` and `tr` keys and is read with `t('key')`. The game starts in English.
5. **Unit tests are required:** every physics and engineering formula in `src/core/engineering.js` (`calcSolarPower`, `calcDeltaV`, `calcLightDelay`, `calcPendulumPeriod`, `calcPointOfNoReturnO2`) is tested automatically with `node --test "tests/*.test.js"`.
6. **Fail-safe:** a missing sound file (`404`) or an unfinished minigame never locks the main game loop. Every minigame has an escape/cancel path (`ESC`).

---

## 3. Art rules (`K4`)

1. **Pixel-art style:** all images are drawn with sharp pixels through `image-rendering: pixelated` in CSS/Canvas; blurry (bilinear) scaling is off.
2. **No text or HUD inside assets:** background and screen images (`assets/backgrounds/`, `assets/screens/`) contain no baked-in text or HUD bars; all UI is layered on top by `K3` as HTML/CSS or Canvas.
3. **White-background transparency (`#FFFFFF` chroma key):** the pure white (`#FFFFFF`) backgrounds of isolated sprites and structures (`assets/sprites/`, `assets/structures/`) are made transparent (`alpha = 0`) by the asset build.
4. **Copyright and originality:** no commercial film or game character and no official NASA logo (meatball/worm) is copied without permission. The UFO scene uses a scientific sensor anomaly (a bright light + an angular trail) instead of a classic movie flying saucer.

---

## 4. Process, Git and scope rules

1. **Hourly sync:** pull from `main` every hour during team work; make small, meaningful commits (`[K2] feat: Add the point-of-no-return O2 check`).
2. **Stuck rule (15–20 minutes):** anyone stuck on a problem for more than 20 minutes reports it as a blocker and switches to an alternative.
3. **Content and feature lock:**
   - **S20 (content lock):** no new text or new mechanics.
   - **S24 (feature freeze):** bug fixes only.
4. **UFO scene statement:** the project page and the end of the game state clearly that the UFO scene is fiction inspired by the *Viking 1976 pareidolia* case.
