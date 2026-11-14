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
| K2 | Add an optional `resultKey` to each option, for the short result line after a choice. Optional: `sol` on the card for the header. | `sampleEngineFreeze` in `stub_samples.js` |
| K1 | Converter numbers (ratios, Wh/kg, minutes/kg) in `nasa_data.json` with `src` | `stub_samples.js` (all `src: "PLACEHOLDER"`) |
| K2, K6 | Open the converter with `bus.emit('minigame:open', {template: 'converter', config, onDone})`; config format is at the top of `src/minigames/converter.js` | `sampleConverters` |
| K5 | Copy the keys in `ui_texts.json` into `content/story.json` and review them. `event.*` keys are samples only. | `ui_texts.json` |

The card follows K2's `decision:open` format (src/systems/events.js):
```
{ eventId, titleKey, bodyKey, sol?,
  options: [{ id, labelKey, resultKey?, effects: [
    { type: 'resource', stat, delta } | { type: 'wait', sols, estimate } | { type: 'flag', key, value } ] }],
  choose(choiceId) }
```
The card calls `choose(id)`; K2 applies the effects, writes the decision log and emits `decision:made`. The card never emits it.
Shown stats: `batteryWh` (as kWh) · `o2Kg` · `waterKg` · `foodKg` · `radiationMSv` · `sanity` % · `dataMbit` · `score`. `wait` shows the sols and
the estimate. `flag` effects are not shown. Negative values are red, positive green (for `radiationMSv` the other way round).

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
