# ADR 0001: Vanilla ES Modules + HTML5 Canvas + a Single `gameState`

* **Status:** Accepted, amended by D-011 (see the note at the end)
* **Date:** 14 November 2026
* **Decided by:** K1 (lead/systems), K2 (simulation), K3 (UI), K4 (pixel art/VFX), K5 (science/story), K6 (forensics/experiments/QA)

---

## 1. Context and problem

**SOL 14: RED HORIZON** is a space mission design game built for the NASA Space Apps Challenge by a 6-person team in 30 hours. It contains heavy engineering calculations ($P, \Delta v, t_{\text{delay}}, T, O_{2,\text{needed}}$), a 5-step mission design screen (`Sol 0`), a 2D pixel-art surface simulation, forensics on 5 lost vehicles, 6 experiments, minigames and a cause-and-effect report card.

The team must be able to write code at the same time without conflicts, the unit tests (`node --test`) must run directly, and the judges must be able to open the game from a single GitHub Pages link.

---

## 2. Options considered

1. **Option A: a game engine (Godot / Unity WebGL)**
   - *Pros:* built-in scene editor.
   - *Cons:* in 30 hours, 6 people will hit merge conflicts in binary scene files; the WebGL output is heavy and clumsy for table- and formula-heavy engineering screens (`Sol 0`, downlink queue, power panel, report card).
2. **Option B: a heavy frontend framework + bundler (React/Vue + Phaser + Webpack)**
   - *Pros:* a rich ecosystem.
   - *Cons:* a fragile build step, and keeping state in sync between the canvas and a virtual DOM.
3. **Option C (chosen): vanilla JavaScript + HTML5 Canvas 2D + a modular DOM/CSS UI + a single `gameState`**
   - *Pros:* runs directly in the browser and on GitHub Pages; `engineering.js` and `state.js` can be tested directly with `node --test`; Canvas 2D gives full control over pixel art and white-background chroma keying; the rich engineering panels (`Sol 0`, decision cards, downlink, report card) are fast and accessible to build with CSS Grid/Flexbox.

---

## 3. Decisions

1. **Canvas + DOM hybrid:**
   - Surface exploration, the `0.38 g` astronaut, the wrecks and the atmospheric VFX layers (storm, visor frost, dust devil, UFO liftoff) are drawn on **HTML5 Canvas 2D**.
   - The `Sol 0` design screens, HUD bars, crisis cards (`M2`), downlink queue (`M1`), power panel (`M3`) and report card (`M5`) are sharp **retro sci-fi DOM/CSS** layers on top of the canvas.
2. **A single `gameState` and an event bus (`bus`):**
   - All game state lives in one JSON-serialisable object in `src/core/state.js`.
3. **Data and text kept apart (`data/nasa_data.json` & `content/story.json`):**
   - No scientific number or player text is embedded in code; numbers come with a `src` URL from the data files and text from the bilingual `story.json`.
4. **Flood-fill chroma key:**
   - Pixel-art sprites drawn on pure white (`#FFFFFF`) are made transparent with a flood fill that works inward from the edges, so the astronaut's white suit stays intact while the background is cleared.

---

## 4. Consequences

* **Positive:** `node --test` runs in milliseconds with no extra library; GitHub Pages hosting needs no configuration; the 6 owners (`K1–K6`) work without blocking each other.
* **Watch out:** opening images through `file://` blocks canvas `getImageData` (CORS).

---

## Amendment (D-011, v3)

The v3 game kept the decision (vanilla JS, Canvas + DOM, one `gameState`, data and text in JSON) but changed two details so the game also runs from `file://`:

* **Classic scripts instead of ES modules:** every file is an IIFE on `window.SOL14`; `index.html` loads them in order.
* **Chroma key at build time instead of runtime:** `node tools/build.js assets` does the flood fill and writes `assets/processed/`; the game never calls `getImageData`.

See [ARCHITECTURE.md](../../ARCHITECTURE.md).
