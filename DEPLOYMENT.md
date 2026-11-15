# DEPLOYMENT.md — Hosting and the Space Apps Submission Checklist

This document explains how to run **SOL 14: RED HORIZON** locally, how to publish it on GitHub Pages or any static server, and the NASA Space Apps submission checks.

---

## 1. Running locally and static hosting

The project is entirely client-side: classic scripts, HTML5, CSS3 and pre-built data files. The generated files (`src/data/*.js`, `assets/processed/**`) are committed, so a static server needs no build step. It also runs by double-clicking `index.html` (`file://`).

```bash
# Option 1: Node.js
npx serve . -l 8080

# Option 2: Python HTTP server
python -m http.server 8080
```

### GitHub Pages (`K1`)
1. Choose the root (`/ (root)`) of the `main` branch as the GitHub Pages source.
2. All paths are relative (`./assets/...`, `./src/...`), so it also works under a sub-path (`/<repo>/`).
3. Two direct links for the judges:
   - **Full game (14 sols):** `https://<user>.github.io/<repo>/`
   - **Judges' quick demo (5 sols):** `https://<user>.github.io/<repo>/?demo=1`

The game starts in English; `?lang=tr` opens it in Turkish.

---

## 2. NASA Space Apps submission checklist (`S27–S30`)

To enter global judging (`Impact, Creativity, Validity, Relevance, Presentation`), check all of these before submitting:

- [ ] **Project page language:** the Space Apps project page, summary and 7 slides are entirely **in English**.
- [ ] **30-second demo video (or 7 slides):**
  - `0–5 s`: team + the challenge.
  - `5–12 s`: the `Sol 0` design screens (budget, mass, instrument choice and red warnings).
  - `12–20 s`: dust storm + point-of-no-return crisis card + the Opportunity diagnosis.
  - `20–25 s`: the cause-and-effect report card (*"this engineering decision led to this result"*).
  - `25–30 s`: MAV liftoff and the UFO stinger (the line-by-line telemetry photo).
- [ ] **Public links:** the demo video link, the live game link (GitHub Pages) and the open-source repo link were opened in a private (incognito) window.
- [ ] **NASA data source matrix:** links to `NSSDCA Master Catalog`, `Planetary Fact Sheet`, `ELV Performance`, `Trajectory Browser`, `JPL Horizons` and `DSN Now` are on the project page and in `data/nasa_data.json`.
- [ ] **AI and copyright statement:** the image prompt library, AI tool use (from REFERENCES.md), CC0/Web Audio sound use and the absence of copyrighted material are stated; AI-generated images carry a visible watermark.
- [ ] **Fiction note:** *"The UFO scene at the end is fiction referring to the Viking 1976 pareidolia case; the player's camera and bandwidth choices decide what it shows."*
