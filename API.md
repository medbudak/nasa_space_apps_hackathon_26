# API.md — Engineering Formulas, the `gameState` Shape and Module Interfaces

This document lists the function signatures, equations and data shapes of the core modules of **SOL 14: RED HORIZON**. All modules hang off one namespace, `window.SOL14` (`S` in code); there are no ES module exports (see [ARCHITECTURE.md](ARCHITECTURE.md)).

---

## 1. Engineering and physics formulas (`S.Engineering`, `src/core/engineering.js`)

Every formula reads its constants from `data/nasa_data.json` (built into `S.DATA`) and is unit-tested in `tests/engineering.test.js`. Formulas live only here; the UI shows values computed with the same functions the simulation uses.

### 1.1 Solar power (`calcSolarPower`)
$$P = S \cdot A \cdot \eta \cdot \cos Z \cdot (1 - d_{\text{dust}})$$

* $S$: mean solar irradiance at Mars ($\approx 590\text{ W/m}^2$; perihelion–aphelion range $490\text{–}715\text{ W/m}^2$).
* $A$: active panel area ($\text{m}^2$).
* $\eta$: photovoltaic conversion efficiency ($\approx 0.28$).
* $\cos Z$: cosine of the solar zenith angle (depends on the landing-site latitude and the time of day: `Meridiani` > `Jezero` > `Arcadia`).
* $d_{\text{dust}}$: dust factor on the panels ($0.0\text{–}0.90$; rises in storms, falls with cleaning or a passing dust devil).

```js
S.Engineering.calcSolarPower({ irradiance, area, efficiency, cosZ, dustFactor }) // → watts
```

### 1.2 Tsiolkovsky rocket equation (`calcDeltaV`)
$$\Delta v = I_{\text{sp}} \cdot g_0 \cdot \ln\left(\frac{m_0}{m_f}\right)$$

* $I_{\text{sp}}$: specific impulse (s); $g_0 = 9.80665\text{ m/s}^2$; $m_0$: wet mass (kg); $m_f$: dry mass (kg).

```js
S.Engineering.calcDeltaV({ isp, wetMass, dryMass }) // → m/s
```

### 1.3 One-way Earth–Mars light delay (`calcLightDelay`, `getHorizons`)
$$t_{\text{delay}} = \frac{d_{\text{Earth–Mars}}}{c}$$

* $d$: Earth–Mars distance that day (km, from a precomputed JPL Horizons table: $5.5 \times 10^7$ to $4.0 \times 10^8\text{ km}$).
* $c = 299\,792.458\text{ km/s}$. Result: about $3\text{–}22$ minutes one way.

```js
S.Engineering.calcLightDelay(distanceKm)   // → { seconds, minutes, formatted }
S.Engineering.getHorizons(sol, maxSols)     // → distance and delay for that sol
```

### 1.4 Pendulum period and free fall (`calcPendulumPeriod`, `calcFreeFallTime`)
$$T = 2\pi \sqrt{\frac{L}{g_{\text{Mars}}}}$$

* $L$: string length (m); $g_{\text{Mars}} = 3.73\text{ m/s}^2$ (the period on Mars is $\approx 1.62$ times Earth's).

```js
S.Engineering.calcPendulumPeriod(lengthMeters, gravity) // → seconds per full swing
```

### 1.5 Point-of-no-return oxygen (`calcPointOfNoReturnO2`, `M4`)
$$O_{2,\text{needed}} = \frac{\text{distance}}{v_{\text{now}}} \cdot \dot{c}_{O_2} \cdot 1.2$$

* distance to the lander (m); $v_{\text{now}}$: current walking speed (frozen joints drop it to `40%`); $\dot{c}_{O_2}$: O₂ use rate; $1.2$: a `20%` safety margin.

```js
S.Engineering.calcPointOfNoReturnO2({ distanceMeters, currentSpeed, o2RatePerMeter, safetyFactor }) // → % suit O2 needed
```

### 1.6 Other helpers
`calcSuitBatteryDrainPctPerMin`, `calcSuitCoolingMinutes`, `calcHeatingW`, `calcCaveTempC`, `ambientTempAt`, `solarCosZAt`, `timeOfDay`, `findById` and `calcDesignTotals` (Sol 0 budget, mass and power totals, plus the launch-blocking errors).

### 1.7 Mission score (`S.Score`, `src/core/score.js`)
$$\text{score} = \text{forensics}_{\text{arrived}} + \text{experiments}_{\text{arrived}} + \text{survival} + \text{mass-margin bonus} - \text{lost systems}$$

`S.Score.calc(state)` returns the totals and a tier (`FULL_SUCCESS` | `MIN_SUCCESS` | `PARTIAL` | `FAILED`); `S.Score.chains(state)` builds the cause → effect chains shown on the report card. Only reports that reached Earth count.

---

## 2. The central `gameState` (`src/core/state.js`)

One object, created by `S.State.reset(opts)` and read with `S.getState()`. Top-level fields:

| Field | Contents |
| :--- | :--- |
| `version`, `lang`, `demoMode`, `seed` | Save version, `'en'` / `'tr'`, `?demo=1` quick mission, RNG seed |
| `scene`, `sol`, `maxSols`, `minute`, `totalMinutes` | Where the player is and the game clock |
| `design` | Sol 0 choices: `objectiveFocus`, `rocketId`, `orbitType`, `launchWindowCaught`, `landingSiteId`, `powerSource`, `batteryKwh`, `insulation`, `instruments[]`, `commArchitecture`, `repairKits` |
| `totals` | Results of `calcDesignTotals`: mass, money, margins, power and night energy |
| `res` | Base resources: energy, battery, O₂ reserve, water, MAV fuel, food, morale, radiation, panel dust, habitat temperature |
| `needs`, `suit`, `player` | Hunger/thirst/fatigue; suit O₂, battery, temperature, integrity, leak, frozen joints; position, zone (`surface` / `cave`), inside/outside |
| `base`, `lander`, `loads`, `power`, `disabledLoads` | Which base systems are built, the power loads and their priority (`M3`) |
| `greenhouse`, `weather` | Greenhouse growth and frost; dust storms and warnings |
| `downlink` | The data queue (`M1`): packets, relay pass use, extra capacity |
| `forensics`, `experiments`, `rewards` | Per-wreck evidence and diagnosis; per-experiment progress |
| `explore` | Ice clusters, dig sites, minerals, the lava tube, zones seen |
| `inventory` | `items{}` (kits and parts), `minerals{}`, `tools{}` (pickaxe, drill, scanner), `repairKits`, `rhuUnits`, salvage flags |
| `station`, `rocket` | Station side story (impact, pickups, modules built); MAV damage per part |
| `crisis`, `decisionLog[]`, `solHistory[]`, `solStart`, `stats` | Crisis cards (`M2`), the decision log for the report card (`M5`), per-sol summaries |
| `ending`, `gameOver`, `cargoBonus` | End of mission: launch result, loss cause, landing bonus |

Fields added after a release are filled for old saves in `S.ensureExploreState`; there is no parallel save format.

---

## 3. Minigame contract (`src/minigames/minigames.js`)

`minigames.js` is a small router; the games themselves are in `src/minigames/task_games.js` (`S.TaskGames`) and `src/ui/field_cam.js` (`S.FieldCam`). Each experiment, wreck check, crisis and repair names its game in the data.

```js
/**
 * @param {string} type   e.g. 'pendulum', 'wires', 'patch', 'fieldcam' (see S.TaskGames)
 * @param {Object} config game settings from the data
 * @returns {Promise<{ success: boolean, score: number, timeUsed: number, skipped?: boolean }>}
 */
await S.runMinigame(type, config);
```

Every game has an Esc / cancel path. Without a DOM (headless tests) the call resolves at once as skipped.

---

## 4. Event bus channels (`S.bus`)

* `state:changed` — refresh UI after a state change.
* `crisis:trigger` / `crisis:resolved` — open and close a crisis card (`M2`).
* `fx:weather`, `fx:float`, `fx:puff` — storm/frost effects, floating text, dust puffs.
* `audio:play` — play a sound (`click`, `alarm`, `scan`, `quake`, `launch`, …).
* `sol:advance` — sol transition screen.
* `station:impact`, `station:pickup`, `rocket:damaged` — station side story and MAV damage.
* `mission:landed`, `mission:end`, `mission:gameover` — mission milestones.
