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
