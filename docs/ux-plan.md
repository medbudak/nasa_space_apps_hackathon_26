# UX and gameplay rework plan (2026-11-15)

Player feedback after the first full playthrough of v3, turned into tasks. Goal: at every moment the player can answer **"What should I do now, and why?"** Rules from CLAUDE.md apply: numbers only in `data/*.json` (real values sourced; game values `simplified: true` + `simplifiedNote`), text only in `content/story.json` (tr + en), classic `<script>` IIFEs on `window.SOL14`, run `npm test` (rebuilds `src/data/*.js`). Update tests when behaviour changes on purpose; keep them meaningful.

## Done

| # | Item | Where |
|---|---|---|
| 0 | Cleanup: duplicate root PNGs, `_legacy/`, obsolete v2 prompts removed; design sources in `docs/design/` | commit `ef01d94` |
| 1 | Window fit: stage fills the viewport, canvas follows the window aspect, no letterbox bars | `116aa65` (`src/main.js` fitStage, `styles/main.css`) |
| 2 | Clock 4 → 2 game min per real s (demo stays 4); suit O2 0.5 → 0.2083 %/min (xEVA 8 h) | `116aa65` (`data/nasa_data.json` gameplay, constants.eva) |
| 7 | Suit temperature: battery/heater lasts ~8 h at −80 °C; dead-battery cooling 0.025 → 0.004 /min (~1 h to return) | `116aa65` |
| 5 | Sol 0 tooltips (What · Why · What changes) on every prep option and instrument; real effects for repair kits, MOXIE, Ingenuity, data volume, launch window | local-wip, merged 2026-11-15 |
| 9 | Missions by action: no automatic discovery; wrecks are dug out, the skylight is dug open, SCOUT-1 parts and evidence photos need FIELD CAM; goals follow what was done | D-013, merge 2026-11-15 |
| 6 | Transit: 4-task engineering chain (arrays `align`, O2 leak `wires`, TCM `qte`, thermal `converter`); bar moves only on completion; typewriter "GEZEGENE YAKLAŞILIYOR..."; outcomes feed landing (`gameplay.transit`, `Sim.transitOutcome`); skip asks twice and degrades | transit commit |

## To do (in this order)

### 5. Sol 0 choices: tooltips + real consequences
`src/ui/design_screens.js` `card()` builds option buttons; there is no tooltip system (only native `title`). Add a styled hover/focus tooltip (also keyboard focus; touch: tap-and-hold or an info icon) with three lines per option: **What is it? · Why choose it? · What changes in the game?** (story keys e.g. `design.tip.<field>.<value>.{what,why,effect}`). Make weak choices matter:
- `repairKits`: today only unlocks crisis option C; `repair_suit` never uses kits → use a kit for a full, faster repair; without kits partial and slower.
- `launchWindowCaught`: explain the 26-month window and its cost/morale effect.
- `ingenuity`: reveals wrecks but does not avoid the sand-pit slowdown in game (`surface.js:85-90`), although the test bot assumes it does (`bot.js:39`) → make the game match.
- instrument `dataMbit` is shown but unused → either use it in downlink or stop showing it.
- `moxie`: the ISRU sprite and `sabatier` action exist even without MOXIE (`effects.js:179-182`) → tie them to the choice.

### 3. Habitat interior: clear purpose and hierarchy
`src/ui/habitat_panel.js` (4×2 `.act-card` grid, DURUM column, ÖNİZLEME). Problems: tiny labels, no grouping, "O₂" bar is actually the suit O2, no "why".
- Group cards: **EVA hazırlığı** (O₂ doldur, Elbiseyi şarj et, Elbiseyi onar) · **Bilim ve iletişim** (Laboratuvar, İletişim) · **Üs yönetimi** (Güç paneli, Karar günlüğü) · **Gün** (Günü tamamla).
- Each card: readable name, one-line purpose, live consequence ("Elbise O₂ %11 → %100 · 20 dk · habitat O₂ −0.8 kg"), disabled state with the reason.
- Highlight the recommended next action from `src/core/objectives.js`.
- Preview: "Bu nedir? → Ne işe yarar? → Neden şimdi? → Ne değişir?".
- Label bars precisely (Elbise O₂ vs Habitat O₂).

### 4. HUD consistency
`src/ui/hud.js` + `UI.header()` (`ui_kit.js:72`): top-left brand/location and top-right SOL/clock/temperature pill look like two different designs. Make one continuous top bar in the game's retro panel style; same treatment for the vitals panel, goal card, minimap and quickbar (`.quickbar`). Do not add new widgets; tidy and align. The temperature in the pill should say whether it is outside or habitat.

### 8. Base systems are built by the player
`surface.js:18-24 STRUCTURES` (solar, isru/MOXIE, greenhouse, habitat, MAV) all exist from landing; no build mechanic. Land with crates/undeployed kits; the player goes outside and: inspects → carries/places → connects → activates → checks, via minigames (`align` for array pointing, `wires` for MOXIE/power hookup, `converter` for greenhouse setup). Until the solar array is deployed there is no solar generation (battery/RTG only) — this gives the first EVA a purpose. See `docs/design/prompt-panel-cleaning-and-watering.md` for the panel-cleaning and watering task spec.

### 9. Missions must be played, not walked into
`Forensics.updateDiscovery` (`forensics.js:34-43`) reveals wrecks automatically within `wreckVisibleWithoutDroneM 160` and goals update as you walk. Change to: signal on the minimap → walk there → **scan/identify with an action** (E + short task) → collect evidence → diagnose → send report → salvage. Chain dependencies so goals follow from what the player did (deploy power → comms → science), not from position. Update `objectives.js` priorities, `tests/rhythm.test.js` (first goal after landing is currently `wreck_signal`), and `tests/helpers/bot.js` (assumes structures and actions exist from the start).

## Final check (after all items)
Play from the menu to the report (also `?demo=1`) and answer: does the player know what to do and why at each step; are choices consequential and explained; is every UI piece consistent; do tasks require actions; are clock, O2 and temperature fair; does the layout fit at 1280×720, 1366×768, 1920×1080, 1920×1200, 2560×1080, 1024×768.
