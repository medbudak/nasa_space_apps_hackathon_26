# K3 dev page — Sol 0 mission design

A standalone page for building the Sol 0 screens with stub data in K1's nasa_data.json format. Not part of the game build.

Run from the repo root:

```
python -m http.server 8000
```

Open http://localhost:8000/src/ui/dev/design.html. TR/EN and reset are in the dev box at the bottom right.

Tests: `node --test` from the repo root. Note: `node --test tests/` (with a directory) fails on Node 22; use `node --test` or `node --test tests/*.test.mjs`.

## Hand-offs (D-003 names)

K1's `main.js` mounts the screen with `mountDesign(ui, {data, t, evaluate: evaluateDesign, design, locale, onChange, onLaunch})`
and stores the picks in `gameState.design`:
`{ objectiveId, rocketId, trajectoryId, siteId, powerId, batteryId, insulationId, instrumentIds[], commsId, spareKitsId }`

`nasa_data.json` values that are still unresearched are `null`. The screen shows them as "?" with a dashed outline, counts them in
the header (from `evaluateDesign().unresearched`), and does not block the launch on a `null` budget or capacity.
A data group missing from `nasa_data.json` shows "No option data yet".

| Who | What | Placeholder here |
|---|---|---|
| K5 | Copy the keys in `design_texts.json` into `content/story.json` and review them | `design_texts.json` |

The dev page still uses `stub_data.js` / `stub_evaluate.js` (same shape, all `src: "PLACEHOLDER"`); the game uses K1's real files.

# K3 dev page — decision cards + mini-games

Open http://localhost:8000/src/ui/dev/play.html. Buttons fire sample events on a stub bus; the log shows what goes over the bus.

## Hand-offs

| Who | What | Placeholder here |
|---|---|---|
| K1 | `src/core/bus.js` with `on(name, fn)`, `off(name, fn)`, `emit(name, payload)` | `stub_bus.js` |
| K1 | `main.js` calls `mountDecisionCards(document.body, {bus, t, locale})` and `mountMinigames(document.body, {bus, t, locale})` once. `locale` may be a function so a TR/EN switch takes effect. | `play.html` |
| K2 | Optional `resultKey` per option, for the short result line after a choice. Send the final stat names when K1's state is settled; only `STATS` in `decisionCard.js` needs updating. | `sampleEngineFreeze`, `sampleNoReturn` in `stub_samples.js` |
| K1 | Converter numbers (ratios, Wh/kg, minutes/kg) in `nasa_data.json` with `src` | `stub_samples.js` (all `src: "PLACEHOLDER"`) |
| K2, K6 | Open the converter with `bus.emit('minigame:open', {template: 'converter', config, onDone})`; config format is at the top of `src/minigames/converter.js` | `sampleConverters` |
| K5 | Copy the keys in `ui_texts.json` into `content/story.json` and review them. `event.*` keys are samples only. | `ui_texts.json` |

The card follows K2's `decision:open` format (top of src/systems/events.js):
```
{ eventId, sol, titleKey, bodyKey, vars?,
  options: [{ id, labelKey, resultKey?, effects: [...] }],
  unavailable?: [{ id, labelKey, disabledKey }],
  choose(choiceId) }
```
- Texts are read with `t(key, vars)`; numbers in `vars` are formatted for the language (0,42 / 0.42).
- Effects: `resource` → a chip with icon and unit · `estimate` → dashed "≈" chips, applies nothing · `wait` → `+N h` when
  `hours` is given, else `+N sol`, plus "≈" estimates · `flag` and `eva` → not shown.
- Known stats: `energy_kWh`, `oxygen_kg`, `suitO2Kg`, `water_kg`, `food_kg`, `radiation_mSv`, `sanity` %, `dataMbit`, `score`
  (and the older `batteryWh`, `o2Kg`, `radiationMSv`). Negative values are red, positive green; for radiation the other way round.
- `unavailable` options are greyed out with `t(disabledKey)` and cannot be chosen (not by click, not by number key).
- The card calls `choose(id)`; K2 applies the effects, writes the decision log and emits `decision:made`. If `choose()` throws,
  the card stays open with a short message.

Align (`template: 'align'`): turn a dial until the signal peaks, hold it above `successPct` for `holdSeconds`. Config format at the
top of `src/minigames/align.js`; samples in `sampleAligns` (panel, antenna, photo). `response: 'cos'` is the real panel law
(power ∝ cos of the angle error); `'beam'` is a simplified Gaussian beam and says so on screen. Callers roll `targetDeg` with the
seeded RNG. Tuning values (`alignRows`) are placeholders for K1 to move into `nasa_data.json`.

QTE (`template: 'qte'`), two modes; config format at the top of `src/minigames/qte.js`, samples in `sampleQtes`:
- `mode: 'catch'`: a tool falls in real Mars gravity; press Space when it reaches the hand. The caller passes the fall time from
  `engineering.fallTime(height, mars.gravity)` and the Earth time for comparison.
- `mode: 'stopwatch'` (K6's experiments): `scene: 'pendulum' | 'drop' | 'sound'`. Space starts and stops the stopwatch; several
  trials are averaged and compared with the expected time within `tolerance`. The caller passes the event time
  (`pendulumPeriod`, `fallTime`, distance / speed of sound). `detail.measuredSeconds` goes back to K6, who turns it into g or a speed.

`onDone` result: `{ success, score, timeUsed, detail }`. `timeUsed` is real seconds. `detail` is template-specific
(converter: `{input, outputs, energyWh, gameMinutes}`); it is an addition to the D-003 shape. Esc closes a mini-game
with `success: false`. Decision cards cannot be closed with Esc; the player has to choose.

# K3 dev page — downlink queue (M1)

Open http://localhost:8000/src/ui/dev/downlink.html. Add packets, reorder them, then jump to the next relay pass.

| Who | What | Placeholder here |
|---|---|---|
| K1 | `main.js` calls `connectDownlink(bus, getState)` once, so `downlink:queue` packets land in `gameState.dataBudget.queue` even while the panel is closed. | `downlink.html` |
| K1 | In `nasa_data.json`: pass times for MRO and MAVEN (game schedule), MAVEN's Mbit per pass, and the Earth–Mars distance for the light delay (precomputed table in `scripts/`). `telecom.mroMbitPerPass` already exists. | `downlinkRows` in `stub_samples.js` |
| K2 | In the surface loop, call `runDuePasses(state, passes, prevT, nowT, bus)` each step (`T = sol + solFraction`). | `downlink.html` "next pass" button |
| K6, K2 | Send `bus.emit('downlink:queue', { type, id, mbit, points, labelKey? })`. Add score on `downlink:sent` (payload: the packet + `sol`, `passId`), never earlier. `type`: `photo`, `report`, `experiment`, `family`. | `samplePackets` |
| K5 | Texts under `downlink.*` in `ui_texts.json`. | `ui_texts.json` |

Rules: a pass sends the queue in the player's order up to its capacity. A packet that does not fit goes out in part and finishes on a
later pass. `downlink:sent` fires only for finished packets. The panel shows, before anything is sent, on which pass each packet will
go or that it will not go this sol. The queue packet keeps an internal `sentMbit`; the `downlink:sent` payload does not carry it.

# K3 dev page — power panel (M3) + telemetry

Open http://localhost:8000/src/ui/dev/power.html. A fake simulation (dev values only) drives both panels: press "run", add a dust
storm, and watch loads switch off from the bottom when the battery empties.

| Who | What | Placeholder here |
|---|---|---|
| K2 | Mount the panel in the surface scene: `mountPowerPanel(el, { t, locale, bus, getStatus: () => getPowerStatus(state, ctx), setOrder: (ids) => setOrder(state, ids), refreshMs: 500 })`. Keep emitting `power:shed`. | fake sim in `power.html` |
| K2 | `shedPreview()` in `powerPanel.js` mirrors the rule in `power.updateShedding` to show "switched off if the battery runs out" before it happens. If the rule changes, tell K3, or export the rule as a pure function so the panel can call it. | — |
| K2 | Create one `createTelemetry({ maxSols: 3 })` per run and call `telemetry.sample(state)` every surface step; mount the charts with `mountTelemetry(el, { telemetry, t, locale, refreshMs: 1000 })`. | fake sim in `power.html` |
| K1 | Δv left for the return has no state field yet, so its chart says "No data yet". When one exists, pass `readDeltaV: (state) => …` to `createTelemetry`. | — |
| K5 | Texts under `power.*` and `telemetry.*` in `ui_texts.json`. | `ui_texts.json` |

Telemetry history lives in memory (no new gameState field), so it starts empty after a page reload. Chart colours are the dataviz
reference dark steps (`#3987e5` blue, `#d95926` orange), checked with the palette validator on the `#141b2d` surface.

# K3 dev page — HUD

Open http://localhost:8000/src/ui/dev/hud.html. Limits come from the real `src/data/nasa_data.json`; the state is a fake simulation.
Try "EVA: go outside" and "walk +100 m" to see the point-of-no-return notch (M4) move.

| Who | What |
|---|---|
| K2 | Mount once in the surface scene: `mountHud(el, { state, data, t, locale, bus, telemetry, downlink: { passes, lightDelaySec }, power: { getStatus, setOrder }, refreshMs: 500 })`. `hud.openTab('telemetry')` opens a tab from code (alarms). |
| K2 | The EVA bar reads `life.eva.{outside, suitO2Kg, requiredO2Kg, distanceM, noReturn}`; the red notch sits at `requiredO2Kg`. The HUD remembers the suit O2 at the start of each EVA as the full bar. |
| K2 | Sanity reads `life.sanity` (0..100) once `sanity.js` sets it; until then the bar shows "—". |
| K1 | Limits read from `nasa_data.json`: `life.o2StartKg`, `rules.radiationLimitMSv`, `rules.coldLossHours`, `thermal.bodyColdBelowC`. Missing ones show "?" and a striped bar instead of an invented number. Oxygen also shows days left from `life.o2KgPerCrewPerDay × life.crew`. |
| K5 | Texts under `hud.*` in `ui_texts.json`. |

Bar colours use display thresholds in `hud.js` (30 % / 15 % left): they colour the bar and change no game rule.
