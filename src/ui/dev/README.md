# K3 dev page — Sol 0 mission design

A standalone page for building the Sol 0 screens before K1's core files exist. Not part of the game build.

Run from the repo root:

```
python3 -m http.server 8000
```

Open http://localhost:8000/src/ui/dev/design.html. TR/EN and reset are in the dev box at the bottom right.

Tests: `node --test` from the repo root. Note: `node --test tests/` (with a directory) fails on Node 22; use `node --test` or `node --test tests/*.test.mjs`.

## Hand-offs (D-003 names)

| Who | What | Placeholder here |
|---|---|---|
| K1 | `src/data/nasa_data.json` with the groups and fields in `stub_data.js` (every number `{value, src, verified}`) | `stub_data.js` (all `src: "PLACEHOLDER"`) |
| K1 | `evaluateDesign(design, data)` in `src/core/engineering.js`, same return shape | `stub_evaluate.js` |
| K1 | `main.js` calls `mountDesign(root, {data, t, evaluate, design, onChange, onLaunch})` and stores the result in `gameState.design` | `design.html` |
| K5 | Copy the keys in `design_texts.json` into `content/story.json` and review them | `design_texts.json` |

`gameState.design` written by this screen:
`{ objectiveId, rocketId, trajectoryId, siteId, powerId, batteryId, insulationId, instrumentIds[], commsId, spareKitsId }`

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
