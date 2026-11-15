# SECURITY.md — Security, Data Integrity and Copyright/Licence Policy

This document describes the client-side security measures of **SOL 14: RED HORIZON**, its third-party dependency policy and its copyright/licence compliance for the NASA Space Apps Challenge.

---

## 1. Client-side security

1. **No runtime dependencies and no API keys:**
   - The app runs entirely on static HTML5, CSS3, vanilla classic scripts and pre-built local data (`src/data/*.js`, built from `data/*.json` and `content/story.json`).
   - The code holds no secret API keys or credentials and no tracker that sends data to an outside server. The optional playtest log stays in the browser and is only exported when the player asks.
2. **XSS protection:**
   - In-game text is read only from the trusted local `content/story.json` dictionary; values inserted into HTML go through `S.util.escape`.
   - URL parameters (`?demo=1`, `?lang=en`) are never written into the DOM; they are matched against a fixed whitelist of mode keys.
3. **Safe `localStorage` use:**
   - Save data is parsed with `JSON.parse` inside `try / catch` and filled in by `S.ensureExploreState`; a broken or incompatible save falls back to a clean state instead of crashing the game.

---

## 2. Copyright, NASA visual guidelines and AI transparency

1. **NASA logos and identity:**
   - Under the Space Apps rules, the official NASA "meatball" and "worm" logos are not used in the interface in any way that suggests endorsement; open data sources (`NSSDCA`, `JPL Horizons`, `Planetary Fact Sheet`) are credited in text instead.
2. **Original pixel art:**
   - The backgrounds, astronaut, wrecks (`Opportunity`, `Spirit`, `Phoenix`, `InSight`, `Beagle 2`), structures and VFX were made for this project (including with AI tools from the project's own prompt library); no sprite is copied from a commercial game or film. AI use is listed in [REFERENCES.md](REFERENCES.md), and AI-generated images need a visible watermark.
3. **Sound licence (`CC0` / Web Audio API):**
   - Sound effects are `CC0` recordings (`assets/audio/`, listed in REFERENCES.md) or are synthesised in real time with the browser's built-in **Web Audio API**; no copyrighted MP3/WAV is included.
