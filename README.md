# SOL 14: Red Horizon

Design a crewed Mars mission under real budget, mass, power and data limits, then live with your engineering choices for 14 sols. NASA Space Apps Challenge 2026, "Space Mission Design Game".

## Run it

No install, no build. Serve the folder and open it in a browser:

```sh
python -m http.server 8000     # Windows
python3 -m http.server 8000    # macOS / Linux
```

Then open http://localhost:8000. Opening `index.html` directly from disk does not work, because the game loads its data with `fetch`.

URL options for testing: `?scene=surface` jumps to a scene, `?seed=123` replays the same run. In the browser console, `sol14.state` shows the game state and `sol14.goTo('ending')` switches scenes.

## Test

```sh
node --test
```

Runs every `*.test.mjs` file. Needs Node 18 or newer. The test list also reports how many values in `src/data/nasa_data.json` still lack a real source.

## Layout

| Path | What | Owner |
|---|---|---|
| `index.html`, `src/main.js` | Entry point and scene router | K1 |
| `src/core/` | State, event bus, formulas, data loader, text, seeded RNG | K1 |
| `src/data/nasa_data.json` | Every real-world number, each with its source | K1 |
| `src/scenes/` | Design (K3), surface (K2), ending (K1) | see file |
| `src/systems/`, `src/ui/`, `src/minigames/`, `src/fx/` | Gameplay, UI, mini-games, effects | K2, K3, K4, K6 |
| `content/story.json` | All player-facing text, TR and EN | K5 |
| `tests/` | `node --test` suites | K1, K6 |

Roles and the shared contracts are in [DECISIONS.md](DECISIONS.md) (D-003, D-004). Team rules are in [CLAUDE.md](CLAUDE.md). Sources are in [REFERENCES.md](REFERENCES.md).
