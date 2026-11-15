# CONTRIBUTING.md — Contribution Guide and Team Rules

To avoid conflicts at hackathon pace and to keep **SOL 14: RED HORIZON** scientifically accurate, contributors follow these rules. CLAUDE.md has the full Git workflow.

---

## 1. Golden rules

1. **Edit only your own files:** every file has one owner according to the roles in `AGENTS.md` (`K1–K6`). If another module needs a change, tell its owner or communicate through `bus.emit('event:name', data)`.
2. **No invented numbers (`data/nasa_data.json`):** every mass, power, temperature, pressure and orbit parameter used in the game sits in `data/*.json` with an official NASA/ESA `src` link, or is labelled `simplified: true` as a game value.
3. **No text in code (`content/story.json`):** all text shown to the player is defined in `content/story.json` in both English (`en`) and Turkish (`tr`) and read with `t('key')`.
4. **`main` always works:** never push broken code or code that throws in the console to `main`.

---

## 2. Git flow and commit messages

* **Sync:** before you carry on, every hour:
  ```bash
  git fetch --all --prune
  git merge origin/main
  ```
* **Commit format:** short, English, imperative. A role prefix (`[K1]`..`[K6]`) and a type are welcome:
  ```text
  [K1] feat: Add the solar power and point-of-no-return formulas
  [K2] feat: Wire the storm and frozen-joint crisis-card triggers
  [K3] ui: Finish the Sol 0 budget bars and SPOF warning
  [K4] art: Add visor frost and the line-by-line UFO photo
  [K5] content: Check the 5 lost-vehicle cases against NSSDCA, EN/TR texts
  [K6] feat: Add the 6 experiment loops and their unit tests
  ```

---

## 3. Definition of Done

A task or feature is **done** only when all five boxes can be ticked:

- [ ] No runtime errors (`ReferenceError`, `TypeError`) in the browser console (`F12`).
- [ ] `npm test` passes `100%`.
- [ ] Every new scientific or engineering number is in `data/*.json` with a `src` field.
- [ ] Every new player-facing text is in `content/story.json` in both `en` and `tr`.
- [ ] The feature was tried in the game from the start (or in `?demo=1` mode).
