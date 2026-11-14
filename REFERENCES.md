# REFERENCES.md

Running log of everything external the project uses. The submission form asks for all of it, so add a line the moment you add the thing. Anyone may append here without asking.

## NASA data and resources

| Resource | URL | Used for |
|---|---|---|
| NASA Mars Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Mars gravity, solar irradiance, sol length, pressure, CO2 share, temperatures, Earth-Mars distance, synodic period (`src/data/nasa_data.json` → `mars`) |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf | nasa_data.json: life, thermal |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/data-from-nasa-rovers-voyage-to-mars-aids-planning/ | nasa_data.json: radiation |
| nasa.gov | https://www.nasa.gov/news-release/nasa-rover-results-include-first-age-measurement-on-mars-and-help-for-human-exploration/ | nasa_data.json: radiation |
| science.nasa.gov | https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/ | nasa_data.json: telecom |
| discovery.larc.nasa.gov | https://discovery.larc.nasa.gov/PDF_FILES/21_Proposers_Guide_To_Mars_Orbiters_-_Discovery_2019_AO_-_Rev_190411b.pdf | nasa_data.json: telecom, comms |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20140011316/downloads/20140011316.pdf | nasa_data.json: ascent |
| nasa.gov | https://www.nasa.gov/pdf/373667main_NASA-SP-2009-566-ADD.pdf | nasa_data.json: rules |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2015/09/373665main_nasa-sp-2009-566.pdf | nasa_data.json: rules |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2024/01/mars-2020-final-eis.pdf | nasa_data.json: launchVehicles |
| nasa.gov | https://www.nasa.gov/news-release/nasa-awards-launch-services-contract-for-mars-2020-rover-mission/ | nasa_data.json: launchVehicles |
| public.ksc.nasa.gov | https://public.ksc.nasa.gov/lspeducation/spacex/ | nasa_data.json: launchVehicles |
| nasa.gov | https://www.nasa.gov/news-release/nasa-awards-launch-services-contract-for-europa-clipper-mission/ | nasa_data.json: launchVehicles |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2022/03/sls_reference_guide_2022_web.pdf | nasa_data.json: launchVehicles |
| oig.nasa.gov | https://oig.nasa.gov/wp-content/uploads/2024/02/IG-22-003.pdf | nasa_data.json: launchVehicles |
| trajbrowser.arc.nasa.gov | https://trajbrowser.arc.nasa.gov/traj_browser.php | nasa_data.json: trajectories |
| science.nasa.gov | https://science.nasa.gov/mission/mer-opportunity/ | nasa_data.json: landingSites |
| science.nasa.gov | https://science.nasa.gov/resource/steady-temperatures-at-mars-gale-crater/ | nasa_data.json: landingSites |
| giss.nasa.gov | https://www.giss.nasa.gov/tools/mars24/help/landers.html | nasa_data.json: landingSites |
| science.nasa.gov | https://science.nasa.gov/blog/daily-records-of-atmospheric-temperature-with-perseverance/ | nasa_data.json: landingSites |
| science.nasa.gov | https://science.nasa.gov/photojournal/sixty-one-martian-days-of-weather-monitoring | nasa_data.json: landingSites |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-treasure-map-for-water-ice-on-mars/ | nasa_data.json: landingSites |
| nasa.gov | https://www.nasa.gov/smallsat-institute/sst-soa/power-subsystems | nasa_data.json: powerSources, batteries |
| science.nasa.gov | https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf | nasa_data.json: powerSources |
| science.nasa.gov | https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/ | nasa_data.json: instruments |
| science.nasa.gov | https://science.nasa.gov/mission/insight/science-instruments/ | nasa_data.json: instruments |
| mars.nasa.gov | https://mars.nasa.gov/internal_resources/786 | nasa_data.json: instruments |
| srag.jsc.nasa.gov | https://srag.jsc.nasa.gov/Publications/Workshop_2006-04/RAD_RAFKIN_2006.pdf | nasa_data.json: instruments |
| nasa.gov | https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/ | nasa_data.json: instruments |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf | nasa_data.json: instruments |
| science.nasa.gov | https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/ | nasa_data.json: instruments |
| nasa.gov | https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/ | nasa_data.json: wrecks |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/ | nasa_data.json: wrecks |
| science.nasa.gov | https://science.nasa.gov/mission/mer-spirit/ | nasa_data.json: wrecks |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/mars-phoenix-lander-finishes-successful-work-on-red-planet/ | nasa_data.json: wrecks |
| science.nasa.gov | https://science.nasa.gov/photojournal/image-from-mars-orbit-indicates-solar-panels-on-phoenix-lander-may-have-collapsed/ | nasa_data.json: wrecks |
| nasa.gov | https://www.nasa.gov/press-release/nasa-retires-insight-mars-lander-mission-after-years-of-science | nasa_data.json: wrecks |
| science.nasa.gov | https://science.nasa.gov/resource/on-mars-light-is-energy/ | story.json: wrecks (Opportunity energy on sol 5111) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasa-to-begin-attempts-to-free-sand-trapped-mars-rover/ | story.json: wrecks (Spirit at Troy) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/phoenix-mars-lander-is-silent-new-image-shows-damage/ | story.json: wrecks (Phoenix listening passes, HiRISE image, end of operations) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-insight-still-hunting-marsquakes-as-power-levels-diminish | story.json: wrecks (InSight energy per sol) |
| hirise.lpl.arizona.edu (NASA MRO HiRISE) | https://hirise.lpl.arizona.edu/ESP_039308_1915 | story.json: wrecks (Beagle 2 image) |

## Space Agency Partner and other data

| Resource | URL | Used for |
|---|---|---|
| esa.int | https://www.esa.int/ESA_Multimedia/Images/2025/06/Arcadia_Planitia_as_seen_by_ESA_s_Mars_Express | nasa_data.json: landingSites |
| gao.gov | https://www.gao.gov/assets/690/688254.pdf | nasa_data.json: powerSources |
| esa.int | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/UK_and_ESA_announce_Beagle_2_inquiry | nasa_data.json: wrecks |
| esa.int | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Beagle-2_lander_found_on_Mars | nasa_data.json: wrecks · story.json: wrecks |
| The Planetary Society: MER update, June 2018 | https://www.planetary.org/articles/06-mer-update-opportunity-dust-storm-sleep | story.json: wrecks (Opportunity 645 Wh → 22 Wh; earlier tau record 5–5.5) |
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
| Claude (Anthropic), via Claude Code | Merged the team's TR/EN wreck-case texts into story.json and checked their claims against the sources in "Wreck cases: sources and corrections" | `content/story.json` → `tr.wrecks`, `en.wrecks` |

## Simplified values

Real-world values that were changed or rounded for gameplay.

| Value | Real figure and source | Value in game | Why |
|---|---|---|---|
| Length of a sol | 24.6597 h (NASA Mars Fact Sheet) | about 2 minutes of play | A full 14-sol run fits in half an hour |

## Wreck cases: sources and corrections

This is the task card's `docs/sources.md` (see D-004: REFERENCES.md is the single source log). It covers the wreck-case texts in `content/story.json` → `tr.wrecks` and `en.wrecks`. Numbers used by the game are proposed for `nasa_data.json` with a `src` field (K1). The project page's "Scientific corrections" section can be filled in from here.

Each link below was opened and checked against the claim it supports. "Corrections" lists what was wrong in the first draft of the wreck texts and why it was changed.

### 1. Opportunity (NASA, MER-B)

Sources:
- NASA mission page: https://science.nasa.gov/mission/mer-opportunity/
- NASA, mission end: https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/ (last signal June 10, 2018; more than a thousand recovery commands; designed for 90 sols, worked more than 15 years; release dated Feb 13, 2019). The JPL copy of this page (`jpl.nasa.gov/news/nasas-opportunity-rover-mission-comes-to-end/`) now returns 404.
- JPL, six things about the recovery: https://www.jpl.nasa.gov/news/six-things-about-opportunitys-recovery-efforts/ (last tau 10.8 on June 10; "an average tau for its location on Mars is usually 0.5"; low-power fault assumed)
- JPL, storm: https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/ (storm first detected May 30, 2018)
- NASA, "On Mars, Light Is Energy": https://science.nasa.gov/resource/on-mars-light-is-energy/ (21 Wh on sol 5111, the lowest ever measured)
- NASA Photojournal PIA22930, last images: https://science.nasa.gov/photojournal/last-images-opportunity-took (sol 5111, tau about 10.8; the last image actually sent was a partial frame of a dark sky)
- The Planetary Society: https://www.planetary.org/articles/06-mer-update-opportunity-dust-storm-sleep (about 645 Wh on June 1 → about 22 Wh)

Corrections:
- "Tau exceeded 8.5" → **about 10.8**, against a usual 0.5 at the site.
- "Zero light transmission" and "heaters shut down" → removed. Light was greatly reduced, not zero. NASA only *assumed* a low-power fault, so the text says "most likely".
- NASA gives 21 Wh (graphic) and the team 22 Wh for the same low point. The text uses "about 21–22 Wh".

### 2. Spirit (NASA, MER-A)

Sources:
- NASA mission page: https://science.nasa.gov/mission/mer-spirit/ (a front wheel failed in 2006; stuck May 1, 2009; right rear wheel stalled Nov 28, 2009; stationary platform from January 2010; desired north tilt not achieved; last contact March 22, 2010; recovery ended May 25, 2011; most probable cause: excessive cold that made the survival heaters ineffective)
- JPL, NASA concludes attempts to contact Spirit: https://www.jpl.nasa.gov/news/nasa-concludes-attempts-to-contact-mars-rover-spirit/ (last communication March 22, 2010; final attempt May 25, 2011; too little energy for the survival heaters)
- JPL, trapped rover finds evidence of subsurface water: https://www.jpl.nasa.gov/news/nasa-trapped-mars-rover-finds-evidence-of-subsurface-water/ ("Spirit could not obtain a position slanting its solar panels toward the sun for the winter, as it had for previous winters"; ferric sulfates at Troy)
- JPL, rover yielding new clues while lodged: https://www.jpl.nasa.gov/news/mars-rover-yielding-new-clues-while-lodged-in-martian-soil/ (sulfate-rich soil layers at Troy under a crust)
- JPL, attempts to free the rover: https://www.jpl.nasa.gov/news/nasa-to-begin-attempts-to-free-sand-trapped-mars-rover/ (site called "Troy"; crust over slippery sand)
- NASA Photojournal, Spirit close to Troy: https://science.nasa.gov/photojournal/spirit-close-to-troy-sol-1871/ (Troy next to Home Plate)

Corrections:
- Getting stuck (May 1, 2009) and the last contact (March 22, 2010) are separate events, about 11 months apart.
- "Middle-left wheel buried" → **the right front wheel failed in 2006**.
- "Overcurrent protection triggered" → removed, not in any source.
- "Panel tilt -14.5 degrees" → removed. The number has no source. 14.5° is close to Gusev's *latitude*, which is probably where it came from.
- The stuck date differs between sources: the JPL Troy article says "since April 23" and the mission page says May 1, 2009. The text follows the mission page.
- Not confirmed by any source: "flour-fine" for the soil. Sulfate-rich soil at Troy is sourced.

### 3. Phoenix (NASA)

Sources:
- JPL, end of mission: https://www.jpl.nasa.gov/news/mars-phoenix-lander-finishes-successful-work-on-red-planet/ (last signal Nov 2, 2008; cause: seasonal loss of sunlight; worked past its planned three months)
- JPL, silent, new image shows damage: https://www.jpl.nasa.gov/news/phoenix-mars-lander-is-silent-new-image-shows-damage/ (150 + 61 Odyssey listening passes in 2010; the western panel casts no shadow in 2010; "hundreds of pounds of ice probably coated the lander"; damage "consistent with predictions"; operations ended, release dated May 24, 2010)
- NASA Photojournal, Phoenix in winter: https://science.nasa.gov/photojournal/phoenix-in-winter/
- NASA Photojournal, solar panels may have collapsed: https://science.nasa.gov/photojournal/image-from-mars-orbit-indicates-solar-panels-on-phoenix-lander-may-have-collapsed/
- NASA History, Phoenix mission summary: https://www.nasa.gov/history/15-years-ago-phoenix-mars-lander-launches-to-the-red-planet/

Corrections:
- Cause "CO2 ice fractured the panels" → **the Arctic autumn left too little sunlight**. The broken panel was seen in 2010 and probably happened during the winter, after the lander fell silent. It is not presented as the proven cause of the November 2, 2008 loss of contact.
- "Power management module low-temperature fault" and "-120 °C" → removed, no source.

### 4. InSight (NASA)

Sources:
- NASA, InSight retired: https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/ (last contact Dec 15, 2022; batteries out of energy; the robotic arm's scoop helped remove dust from the panels)
- JPL, power levels diminish: https://www.jpl.nasa.gov/news/nasas-insight-still-hunting-marsquakes-as-power-levels-diminish (about 5,000 → about 500 Wh per sol)
- NASA Photojournal PIA25284, power after landing vs. spring 2022: https://science.nasa.gov/photojournal/insights-power-generation-after-landing-and-spring-2022
- NASA Photojournal PIA25286, InSight's dusty solar panel: https://science.nasa.gov/resource/insights-dusty-solar-panel/ (April 24, 2022, sol 1211)
- JPL, InSight enters safe mode during regional dust storm: https://www.jpl.nasa.gov/news/nasas-insight-enters-safe-mode-during-regional-mars-dust-storm/ (safe mode on January 7, 2022). The APPEL link (`appel.nasa.gov/2022/06/27/as-insight-winds-down-discoveries-continue`) now redirects to the APPEL home page.

Corrections:
- "Below 50 Wh per day" → **about 5,000 → about 500 Wh per sol**.
- "Power output zero" → **dust steadily reduced power; NASA concluded the batteries ran out of energy, and the exact event behind the final drop is unknown**.

### 5. Beagle 2 (UK-led, carried by ESA Mars Express, not NASA)

Sources:
- ESA, Beagle 2 lander found on Mars: https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Beagle-2_lander_found_on_Mars (released Dec 19, 2003, due to land six days later; found by NASA MRO's camera, announced Jan 16, 2015; about 5 km from the target centre; all panels needed to expose the antenna)
- ESA Science: https://sci.esa.int/web/mars-express/-/55263-beagle-2-lander-found-on-mars ("one, two or at most three of the four solar panels open"; parachute and rear cover close by)
- ESA, Mars Express releases Beagle 2: https://www.esa.int/Newsroom/Press_Releases/Mars_Express_releases_Beagle_2
- ESA, Beagle 2 inquiry: https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/UK_and_ESA_announce_Beagle_2_inquiry
- HiRISE (University of Arizona), finding Beagle 2: https://hirise.lpl.arizona.edu/ESP_039308_1915

Corrections:
- **The agency is ESA / UK, not NASA.** NASA's role was the MRO HiRISE images that found the lander, so the in-game card is labelled "Finding: ESA / United Kingdom" (`finding_esa`), not "NASA finding".
- "RF signal -120 dBm, undetectable for 13 years" → removed, invented. No signal was ever received.
- The number of open panels is uncertain: ESA says "one, two or at most three" and HiRISE says two or three. The text says "at most three", which fits both.

### Design notes

- The task card's "black box" evidence is shown in the game as **"Last telemetry"**. Mars landers have no flight recorders; their last downlinked data is the real equivalent. Beagle 2 sent nothing, so its card says "No record".
- Inner-voice lines are fiction written for the game. They contain no facts beyond those in the finding card.
