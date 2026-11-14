# REFERENCES.md

Running log of everything external the project uses. The submission form asks for all of it, so add a line the moment you add the thing. Anyone may append here without asking.

## NASA data and resources

| Resource | URL | Used for |
|---|---|---|
| NASA Mars Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Mars gravity, solar irradiance, sol length, pressure, CO2 share, temperatures, Earth-Mars distance, synodic period (`src/data/nasa_data.json` → `mars`) |

## Space Agency Partner and other data

| Resource | URL | Used for |
|---|---|---|
| NIST CODATA: standard acceleration of gravity | https://physics.nist.gov/cgi-bin/cuu/Value?gn | g0 in the rocket equation |
| NIST CODATA: speed of light | https://physics.nist.gov/cgi-bin/cuu/Value?c | Light-delay formula |

## External code, libraries and assets

Include open-source and free items too. Note the license.

| Item | URL | License | Used for |
|---|---|---|---|
| | | | |

## Use of AI

Say which tool was used, and where and how. AI-generated images and videos need a visible watermark and must not contain NASA logos, flags or mission identifiers.

| Tool | Used for | Where in the project |
|---|---|---|
| Claude (Anthropic), via Claude Code | Wrote the first version of the code skeleton and tests; values were checked against the NASA and NIST pages listed above | `index.html`, `src/main.js`, `src/core/`, `src/scenes/ending.js`, `src/data/nasa_data.json`, `tests/` |

## Simplified values

Real-world values that were changed or rounded for gameplay.

| Value | Real figure and source | Value in game | Why |
|---|---|---|---|
| Length of a sol | 24.6597 h (NASA Mars Fact Sheet) | about 2 minutes of play | A full 14-sol run fits in half an hour |
