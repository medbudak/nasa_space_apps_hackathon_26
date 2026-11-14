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
