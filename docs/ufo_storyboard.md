# UFO finale: storyboard (K5 → K4)

About 40 seconds, plays at the end of every run, after the report card's decision is made. **This scene is fiction** (D-006); the project page and the jury page say so. All on-screen text is in `content/story.json` under `ufo.*` (TR + EN). Do not write text into the art: use the keys.

Lesson of the scene: what we can see is decided by camera resolution and how much data we can send (Viking 1976 "Face on Mars" → Mars Global Surveyor showed an ordinary hill).

---

## Scene 1 · Launch (0–10 s)

| | |
|---|---|
| Picture (K4) | Cockpit view of the MAV (Mars Ascent Vehicle). Through the window the red surface and the habitat fall away. Slight camera shake that fades as it climbs. |
| Screen text | HUD, top left: `ufo.launch.hud` |
| Sound | Engine rumble, low and muffled, fading. Inside the cabin you hear the vehicle through its structure, not the thin air. |
| Note | Thin Martian air carries sound poorly, so keep outside noise low. |

## Scene 2 · The light (10–18 s)

| | |
|---|---|
| Picture (K4) | A small light rises on the horizon, parallel to the MAV. Then it stops at an angle that doesn't fit physics. Camera shutter flash. Optional: the light blinks 3 times before it goes out. |
| Screen text | `ufo.light.autoPhoto` then `ufo.light.delay` with `{min}` and `{sec}` |
| Variables | `{min}`, `{sec}`: one-way light delay for that day (K1/K2 compute it from distance ÷ c; must be between about 3 and 22 min). Example: 14 min 22 s. |
| Sound | Engine fades out. Silence. One soft camera-shutter click. |

## Scene 3 · Cut to Earth, Mission Control (18–30 s)

| | |
|---|---|
| Picture (K4) | Earth, a dark control room. The photo arrives line by line from top to bottom, like real rover images. |
| Screen text | `ufo.mc.location` · `ufo.downlink.progress` with `{pct}` · then one of the outcome lines below |
| Outcomes (K2 picks) | High-res camera + enough data budget → stops at about 80%, show `ufo.downlink.high` · Hand camera or no budget → about 30%, show `ufo.downlink.low` · Player followed the Sol 7 anomaly → also show `ufo.downlink.compare` with old photos side by side |
| Sound | Low-frequency ambience (drone), quiet radio static under the line-by-line arrival, soft data ticks. |

## Scene 4 · Close (30–40 s)

| | |
|---|---|
| Picture (K4) | The download freezes at its % value. Red banner. Then the analyst's note. Black screen. Button back to the Sol 0 design screen. |
| Screen text | Banner: `ufo.cut.relayLost` (recommended) or `ufo.cut.conjunction` · then `ufo.analyst` · black screen: `ufo.next` · small, bottom corner the whole scene: `ufo.fiction` |
| Optional fact card | `ufo.fact`, `ufo.pareidolia` (also good for the jury page) |
| Sound | Static cuts off hard. 2–3 s of silence. Low ambience returns under the black screen. |

### Science note on the banner (K1 decides)
The design document uses "solar conjunction" to cut the signal. A crew would not normally plan its launch home inside a conjunction blackout (about 2 weeks every ~26 months), so a jury member may question it. **"Relay pass ended"** is what really limits data on Mars: an orbiter is overhead only for a few minutes. Both texts are ready; `ufo.cut.relayLost` is my recommendation.

---

## Sounds (all CC0)

Search on freesound.org, then use the filter **License: Creative Commons 0**. Before downloading, open the sound's page and check that it really says CC0. Add every sound to `REFERENCES.md` → "External code, libraries and assets" (name, URL, CC0, where used).

| Need | Search terms |
|---|---|
| Rocket rumble | `rocket launch rumble`, `engine rumble low` |
| Low-frequency ambience | `drone ambient low`, `dark ambience sci-fi` |
| Radio static | `radio static`, `white noise radio` |
| Camera shutter | `camera shutter click` |
| Data ticks | `computer beep soft`, `data transfer` |

Mars treatment (in `audio.js` or before export): apply a low-pass filter and lower the volume. Perseverance's microphones showed that Martian air weakens sound strongly, high pitches most.
