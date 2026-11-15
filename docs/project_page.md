# SOL 14: Red Horizon

**NASA Space Apps Challenge 2026 · Challenge: Space Mission Design Game · Local event: Sakarya**

> Fields marked `TODO` are filled in at the end (links, team names, screenshots).

---

## Summary

SOL 14: Red Horizon is a browser game in which students design a crewed Mars mission and then live with its consequences. On Sol 0 the player chooses the mission objective, launch vehicle and trajectory, landing site, power source, battery, insulation, up to 5 of 9 science instruments, communications architecture and spare parts, all against a mass limit and a budget. For the next 14 sols they keep the crew alive, investigate the real wrecks of lost Mars landers, run science experiments and send their data home over a limited link. A cause-and-effect report card at the end shows which choices shaped the mission and compares it with real missions.

## How it addresses the challenge

The challenge asks for a game where players design, manage and simulate a complete mission and see how each engineering choice shapes success. Every concept in the challenge has a screen or a number the player can see:

| Challenge concept | In the game | Where the player sees it | NASA data source |
|---|---|---|---|
| Mission objectives | Primary (forensics) and secondary (experiments) objective, with NASA-style minimum and full success criteria | Sol 0, screen 1 | NSSDCA Master Catalog |
| Spacecraft design | Habitat, Mars Ascent Vehicle (MAV), rover and module choices | Sol 0, screen 3 | NSSDCA, NASA Small Spacecraft Technology State of the Art |
| Science instruments | Pick up to 5 of 9 real-world instruments; each one unlocks gameplay, and a missing one is felt | Sol 0, screen 4 | NSSDCA (Perseverance and InSight instruments) |
| Launch vehicles | 3 launch vehicles with capacity and cost | Sol 0, screen 2 | NASA launch vehicle documents |
| Budget | Budget bar that shrinks with every choice | All of Sol 0 | Game design, calibrated to real mission costs (labelled simplified) |
| Power | Panel area × efficiency × dust × sun angle; battery; RTG/RHU | Energy bar and telemetry graph | NASA Mars Fact Sheet, Small Spacecraft Technology State of the Art |
| Mass | Mass bar against launch-vehicle capacity, with a 10% margin bonus | Sol 0 | NASA launch vehicle documents |
| Communications | Data budget (Mbit per sol), relay passes, light delay, solar conjunction blackout | Downlink tab | NASA relay documents, JPL Horizons |
| Orbit constraints | Launch window (every ~26 months), transfer time vs. Δv, MAV to an orbiting return vehicle | Sol 0, screen 2 and Sol 14 | NASA Trajectory Browser, JPL Horizons |
| Concept → operations | Sol 0 design → Sols 1–14 operations | Whole game | — |
| How choices shape success | Decision log and cause-and-effect report card | Final screen | Comparison with real missions |

## What the player does

1. **Design (Sol 0):** every option has a visible cost in mass, power, data and money. Example: taking MOXIE and the seismometer adds about 47 kg and 308 W, which can drain a small battery overnight, and the design screen shows it in red.
2. **Operate (Sols 1–14):** crisis cards (dust storm, night freeze, frozen suit joints, marsquake, solar particle event, perchlorate dust, solar conjunction and more) offer 2–3 options, each with a visible numeric cost. Every choice goes into the decision log.
3. **Investigate:** the player finds the wrecks of Opportunity, Spirit, Phoenix, InSight and (bonus) Beagle 2, collects three kinds of evidence (photo, last telemetry, environment reading), picks one of five failure categories and sends a report to Earth. Then the real investigation's finding opens as a card, so the player can compare their diagnosis with what engineers concluded.
4. **Experiment:** six experiments follow the scientific method (hypothesis → measurement → result): pendulum and free-fall gravity, seed germination in Martian soil, water at Martian pressure, the speed of sound, and MOXIE oxygen production.
5. **Send it home:** only data that reaches Earth scores. The link is limited, so the player decides what to send first.
6. **Report card:** the 3–5 choices with the biggest effect, for example "Battery: 20 kWh → Sol 9 greenhouse froze → −120 points", plus a comparison with real missions.

## NASA data used

Every gameplay number lives in `src/data/nasa_data.json` with a `src` field pointing to its source. The full list with links is in `REFERENCES.md`. Main sources:

- NASA Mars Fact Sheet (NSSDCA): gravity, solar irradiance, sol length, pressure, temperatures, Earth–Mars distance, synodic period
- NASA Baseline Values and Assumptions Document (BVAD): life support and thermal values
- NASA/JPL: radiation measured by Curiosity's RAD
- NASA: Perseverance and InSight instrument pages; MMRTG fact sheet; MOXIE mission results; Veggie fact sheet; Ingenuity
- NASA relay documents: Mars orbiter relay capacity (Mbit per sol)
- NASA launch vehicle documents and the NASA Trajectory Browser
- NASA/JPL mission pages and news releases for the five wreck cases (last contact, cause, end of mission)
- NASA MRO HiRISE images (Phoenix after winter, Beagle 2 found in 2015)
- Perseverance microphone results (speed of sound on Mars)

Other data: ESA (Beagle 2, Mars Express), The Planetary Society (Opportunity's last power readings), NIST CODATA (constants).

## Engineering trade-offs

- **Solar vs. RTG:** an RTG (MMRTG, about 110 W, about 45 kg) ignores dust and night but is heavy and very expensive; solar is light but loses most of its output in a dust storm.
- **Battery size:** bigger batteries keep life support and the greenhouse warm at night, but cost mass you then can't spend on instruments.
- **Landing site:** the equator has more sunlight and warmth but little ice; mid-latitudes have plenty of ice but are colder with shorter days.
- **Trajectory:** a faster transfer means less radiation and fewer consumables, but needs more propellant and leaves less payload.
- **Communications:** relay only (UHF to orbiters) is light and cheap; relay plus direct-to-Earth X-band costs more but keeps you in contact if one link fails.
- **Instruments:** 9 instruments, room for 5. Each one leaves a gap you will feel later (no weather station means storms arrive without warning).
- **Mass margin:** NASA designs keep margin; leaving 10% or more earns a bonus on the report card.

## Scientific corrections

Mistakes we found in our first design and fixed, so the game teaches the right science:

1. **Light delay** between Earth and Mars is about 3 to 22 minutes one way, depending on where the planets are. Help from Mission Control arrives after the round trip, so the crew has to make its own decisions.
2. **Power sources:** an RTG produces electricity from plutonium decay heat; RHUs only produce heat. Neither is "nuclear fuel" for a rocket. The game uses RHU heat and a Sabatier reactor instead of "fuel from isotopes".
3. **Return architecture:** a crew can't fly straight home from the surface. An ascent vehicle (MAV) reaches Mars orbit and meets a return vehicle.
4. **Night temperature:** −60 °C is roughly Mars's average surface temperature; nights at the equator drop to about −80 °C.
5. **"Hot air" → heat rejection:** Mars daytime air reaches only about +20 °C at most. The real problem is that the thin air can't carry heat away from electronics, so the game models a clogged radiator, not a heat wave.
6. **Marsquakes:** InSight recorded moderate quakes, not violent ones. The game uses moderate shaking, a nearby impact and a landslide. `TODO (K1): add the largest InSight magnitude with its NASA source.`
7. **No floating in your sleep:** Mars has 0.38 g, so nothing drifts; falling shelves and equipment replace it.
8. **Wreck cases:** Spirit got stuck (May 2009) about 11 months before its last contact (March 2010); Phoenix's broken solar panel was seen in 2010 and is not the proven cause of its 2008 silence; Beagle 2 was a UK-led lander carried by ESA's Mars Express, not a NASA mission.
9. **Water on Mars:** water does not "boil at 30 °C". At about 0.6 kPa Mars is close to water's triple point, so water left outside boils off and freezes at once.
10. **Hardware names:** Electra-Lite is a UHF relay radio and SDST is the Small Deep Space Transponder (X-band); our first draft had both wrong.

Some values are simplified for gameplay (for example, one sol lasts about 2 minutes of play). Each one is labelled in `REFERENCES.md` under "Simplified values".

## Fiction note

The final UFO scene is **fiction**, and the game labels it as such. It teaches a real lesson: in 1976 Viking 1 photographed a hill that looked like a face; Mars Global Surveyor's much sharper camera later showed an ordinary hill. In our scene, how much of the mysterious image reaches Earth depends on the player's camera and remaining data budget, and the analyst's note reads "Could be pareidolia. Confirming it needs a new mission."

## Team

`TODO: names on the Space Apps team page`

- K1 · Lead / Systems: `TODO`
- K2 · Gameplay / Simulation: `TODO`
- K3 · UI / Mini-games: `TODO`
- K4 · Pixel art / VFX: `TODO`
- K5 · Story / Science validation / Audio / Presentation: `TODO`
- K6 · Science gameplay / QA: `TODO`

## Use of AI

- **Claude (Anthropic):** first version of the code skeleton and tests; drafting and checking the TR/EN game texts (wreck cases, crisis cards, experiments, report card, UFO scene); checking science claims against the NASA and partner sources in `REFERENCES.md`. Every number in the game was checked by a team member against its source.
- `TODO: any image or video tools (AI images and videos carry a visible watermark and contain no NASA logos, flags or mission identifiers).`

## Links

- Play the game: `TODO (GitHub Pages)`
- Source code: `TODO (GitHub repository)`
- 30-second demo video (English subtitles): `TODO`
