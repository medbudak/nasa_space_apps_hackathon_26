# TESTING.md — Test Strategy, Verification Scenarios and QA Guide

This document covers the automated tests of **SOL 14: RED HORIZON**, the in-game debug tools and the end-to-end gameplay scenarios run under `K6` (QA).

---

## 1. Automated tests

All engineering formulas, data integrity and scoring rules are checked with Node's built-in test runner (`node:test` and `node:assert/strict`):

```bash
npm test
# = node tools/build.js data && node --test "tests/*.test.js"   (Node 22+ wants a glob, not a folder)
```

The core and systems scripts run headless in a `vm` context (`tests/helpers/load_core.js`); `tests/helpers/bot.js` plays whole missions without a browser.

| File | What it checks |
| :--- | :--- |
| `engineering.test.js` | The formulas (§1.1), landing and the sol loop |
| `data_integrity.test.js` | Every number has a `src`; EN/TR keys match; every text key used in code and data exists |
| `qa_profiles.test.js` | The 3 design profiles in §2 + demo mode, played by the bot |
| `design_choices.test.js` | Each Sol 0 choice changes the game the way its tooltip says |
| `rhythm.test.js` | One main goal and at most one optional goal at a time; goal priority |
| `explore.test.js`, `minerals.test.js`, `shelter.test.js` | Map, digging, ice, lava tube, minerals, the glacier ice cave |
| `station.test.js`, `rocket.test.js`, `upgrades.test.js` | Station side story, tools and MAV repair, level upgrades |
| `greenhouse.test.js`, `needs.test.js`, `interior.test.js` | Greenhouse growth and harvest, hunger/thirst/fatigue, the lander interior |

### 1.1 Formula coverage (`tests/engineering.test.js`)
1. **Solar power (`calcSolarPower`):** clean panel (`dustFactor = 0`) vs. dusty panel after a storm (`dustFactor = 0.8`); equator (`Meridiani`) vs. mid-latitude (`Arcadia`) zenith angle ($\cos Z$).
2. **Rocket equation (`calcDeltaV`):** positive $\Delta v$ for `m0 > mf` and edge values.
3. **Light delay (`calcLightDelay`):** closest ($5.5 \times 10^7\text{ km} \rightarrow \sim 3.05\text{ min}$) and farthest ($4.0 \times 10^8\text{ km} \rightarrow \sim 22.2\text{ min}$) Earth–Mars distances.
4. **Pendulum period (`calcPendulumPeriod`):** for $L = 1\text{ m}$, Mars ($g = 3.73\text{ m/s}^2 \rightarrow T \approx 3.25\text{ s}$) vs. Earth ($g = 9.81\text{ m/s}^2 \rightarrow T \approx 2.00\text{ s}$), ratio $\approx 1.62\times$.
5. **Point of no return (`calcPointOfNoReturnO2`, `M4`):** at `900 m`, frozen joints (`40%` speed) raise the $\text{O}_2$ notch and trigger the crisis card.
6. **NASA data (`data/nasa_data.json`):** every instrument, rocket, landing site and wreck case has a valid `src` URL.
7. **Bilingual text (`content/story.json`):** the `en` and `tr` dictionaries have exactly the same keys.

---

## 2. In-game QA scenarios (3 design profiles)

`K6` plays the game start to finish with these three opposite engineering profiles:

| Profile | Sol 0 design | Expected result and report card |
| :--- | :--- | :--- |
| **1. Golden path (balanced & safe)** | `Jezero`, panels + RTG, `40 kWh` battery, thick insulation, `Mastcam-Z + MEDA + SEIS + MOXIE + Veggie`, `12%` mass margin | The storm is known 1 sol ahead (`MEDA`), the greenhouse doesn't freeze, 4 forensic reports + 4 experiments reach Earth → **full success + an `80%` sharp UFO photo**. |
| **2. Greedy science (fragile design)** | `Arcadia` (cold), solar only, `20 kWh` battery, thin insulation, `0%` mass margin, 0 repair kits | The power load collapses in the `Sol 6–9` storm and the `-80 °C` night (`M3`), the greenhouse freezes; the report card shows **"20 kWh battery + thin insulation → greenhouse lost on the night of Sol 9"**. |
| **3. Comms / camera gap** | No `Mastcam-Z` (hand camera only), UHF relay only, low data budget | Photos score half, the downlink queue (`M1`) clogs, and the final UFO photo arrives **`30%` blurred**. |

---

## 3. Quick mission / judges' demo (`?demo=1`) and debug tools

* **Judges' demo (`?demo=1` or "Quick mission (5 sols)" in the main menu):**
  - Loads a ready, balanced `Sol 0` design (the player can still change it).
  - Compresses the mission to `5 sols`, so the core loop, a crisis, a storm, the MAV liftoff, the UFO stinger and the report card are all reached in a few minutes.
* **Developer debug console (`window.SOL14_DEBUG`):**
  - From the browser console: `SOL14_DEBUG.nextSol()`, `SOL14_DEBUG.triggerCrisis('joint_freeze')`, `SOL14_DEBUG.playUfoEnding()`, `SOL14_DEBUG.showReport()`, `SOL14_DEBUG.missingKeys()` and the playtest log (`playtestLog()`, `exportPlaytest()`).
* **Browser checks:** Edge headless screenshots (see CLAUDE.md → Commands); check every visual change at 1920×1080 and 1366×768 and over `file://`.
