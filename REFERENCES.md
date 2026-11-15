# REFERENCES.md

Running log of everything external the project uses. The submission form asks for all of it, so add a line the moment you add the thing. Anyone may append here without asking.

## NASA data and resources

| Resource | URL | Used for |
|---|---|---|
| NASA Mars Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Mars gravity, solar irradiance, sol length, pressure, CO2 share, temperatures, Earth-Mars distance, synodic period (`src/data/nasa_data.json` → `mars`) |
| science.nasa.gov | https://science.nasa.gov/wp-content/uploads/2023/04/Mellon_Water_PPS_May2011___TAGGED.pdf | nasa_data.json: landingSites |
| iopscience.iop.org | https://iopscience.iop.org/article/10.3847/PSJ/ad9b24 | nasa_data.json: landingSites |
| link.springer.com | https://link.springer.com/content/pdf/10.1007/s11214-018-0574-6.pdf | nasa_data.json: instruments |
| assets.science.nasa.gov | https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/4/44739_MarsHelicopterIngenuity_FactSheet.pdf | nasa_data.json: instruments |
| descanso.jpl.nasa.gov | https://descanso.jpl.nasa.gov/monograph/series13/DeepCommo_Chapter7--141030.pdf | nasa_data.json: comms |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/what-sounds-captured-by-nasas-perseverance-rover-reveal-about-mars/ | nasa_data.json: science |
| nist.gov | https://www.nist.gov/si-redefinition/kelvin/kelvin-present-realization | nasa_data.json: science |
| ntrs.nasa.gov | https://ntrs.nasa.gov/citations/20120016793 | nasa_data.json: science |
| ntrs.nasa.gov | https://ntrs.nasa.gov/citations/20190028297 | nasa_data.json: science |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2015/10/pom_workshopbooklet.pdf | nasa_data.json: science |
| journals.plos.org | https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0103138 | nasa_data.json: science |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2020/10/2022-01-05_nasa-std-3001_vol.1_rev._b_final_draft_with_signature_010522.pdf | nasa_data.json: loss |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/phoenix-mission-status-report/ | nasa_data.json: wrecks |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-insight-still-hunting-marsquakes-as-power-levels-diminish/ | nasa_data.json: wrecks |
| science.nasa.gov | https://science.nasa.gov/blogs/insight/2022/12/12/nasa-insights-power-level-as-of-dec-12-2022/ | nasa_data.json: wrecks |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2025/05/nasa-std-3001-vol-2.pdf | nasa_data.json: thermal |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20170009505/downloads/20170009505.pdf | nasa_data.json: life |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2017/02/eva-exp-0042_xeva_system_con_ops_rev_b_final_dtd_10192020_ref_doc.pdf | nasa_data.json: life |
| ntrs.nasa.gov | https://ntrs.nasa.gov/citations/20150008865 | nasa_data.json: thermal |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20210022133/downloads/MAV_SRC_IEEE_2022.pdf | nasa_data.json: ascent |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20040191326/downloads/20040191326.pdf | nasa_data.json: powerSources |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/spirit-gets-energy-boost-from-cleaner-solar-panels/ | nasa_data.json: powerSources |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20100033102/downloads/20100033102.pdf | nasa_data.json: powerSources |
| descanso.jpl.nasa.gov | https://descanso.jpl.nasa.gov/DPSummary/Descanso14_MSL_Telecom.pdf | nasa_data.json: comms |
| discovery.larc.nasa.gov | https://discovery.larc.nasa.gov/PDF_FILES/30Electra-Lite_Description.pdf | nasa_data.json: comms |
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
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/press_kits/mars_2020/launch/mission/ | nasa_data.json: gameplay.transit (solar-powered cruise stage, TCMs during cruise) |
| science.nasa.gov | https://science.nasa.gov/photojournal/temperature-behavior-of-possible-cave-skylight-on-mars | explore_config.json: cave.skylight (THEMIS: skylight day-night swing ≈ 1/3 of the surrounding surface) — D-012 |
| science.nasa.gov | https://science.nasa.gov/solar-system/planets/mars/nasa-orbiter-finds-possible-cave-skylights-on-mars/ | Lava-tube fiction label: known skylights ("Seven Sisters", ~100–225 m) are on Arsia Mons — D-012 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/right-front-wheel-rotations/ | forensics_cases.json: Spirit salvageChoice (right-front wheel actuator failed March 2006) — D-012 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/ | forensics_cases.json: Spirit salvageChoice (dusty arrays, last winter) — D-012 |
| science.nasa.gov | https://science.nasa.gov/mission/phoenix/ | nasa_data.json: terrain.westRegion (Phoenix found water ice under the surface, frost and ice-rich polygons: basis of the glacier route, K2) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/steep-slopes-on-mars-reveal-structure-of-buried-ice/ | nasa_data.json: westRegion.iceCave, glacier (buried ice exposed at scarps) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasa-mars-lander-sees-falling-snow-soil-data-suggest-liquid-past/ | nasa_data.json: westRegion.blizzard (Phoenix lidar saw snow; the ground blizzard is labelled fiction) |
| science.nasa.gov | https://science.nasa.gov/missions/mars-polar-lander | nasa_data.json: westRegion.finalProbe (Deep Space 2 microprobes, lost 1999; placement fictional) |

## Space Agency Partner and other data

| Resource | URL | Used for |
|---|---|---|
| esa.int | https://www.esa.int/ESA_Multimedia/Images/2025/06/Arcadia_Planitia_as_seen_by_ESA_s_Mars_Express | nasa_data.json: landingSites |
| gao.gov | https://www.gao.gov/assets/690/688254.pdf | nasa_data.json: powerSources |
| esa.int | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/UK_and_ESA_announce_Beagle_2_inquiry | nasa_data.json: wrecks |
| esa.int | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Beagle-2_lander_found_on_Mars | nasa_data.json: wrecks |
| NIST CODATA: standard acceleration of gravity | https://physics.nist.gov/cgi-bin/cuu/Value?gn | g0 in the rocket equation |
| NIST CODATA: speed of light | https://physics.nist.gov/cgi-bin/cuu/Value?c | Light-delay formula |

## External code, libraries and assets

Include open-source and free items too. Note the license.

| Item | URL | License | Used for |
|---|---|---|---|
| awesome-gamedev-agent-skills (`workflows`, `disciplines` plugins) | https://github.com/gamedev-skills/awesome-gamedev-agent-skills | Apache-2.0 | Instructions for the team's AI coding agent (game-jam, UI/UX, game-feel checklists); not shipped in the game |
| Game artwork in `assets/` (backgrounds, sprites, screens, effects, ending) | this repository | Original work by the team (K4) | All in-game images |
| `assets/sprites/astronaut_walk_sheet.png` (6-frame walk cycle) | this repository | Supplied by the team as a GIF, converted to a sprite strip (origin to be confirmed) | Astronaut walking animation on the surface and inside the habitat |
| `docs/design/references/lava-tube-reference.png` | this repository | Supplied by the team as a mock-up (origin to be confirmed; has UI text baked in, so it is a design reference only and is not shipped in the game) | Palette and layout reference for the procedural lava-tube scene (`src/fx/effects.js` `renderCave`) — D-012 |
| `docs/design/references/lander-reference.png` | this repository | Supplied by the team as the crew-lander mock-up (origin to be confirmed; Mars background baked in, so it is a design reference only and is not shipped in the game) | Art reference for the opening landing cutscene lander — D-012 |
| Landing cutscene lander and lava-tube scene | this repository | Procedural pixel art drawn in code (`src/fx/lander.js`, `src/fx/effects.js`) | Opening landing sequence and the lava-tube sub-map — D-012 |
| `assets/ui/field_cam.png` (FIELD CAM camera body) | this repository | Supplied by K3 (Medine) with the world prototype (origin to be confirmed) | Photo-evidence minigame frame (`src/ui/field_cam.js`) |
| `assets/sprites/astronaut_indoor.png` (crew member inside the shuttle) | this repository | Supplied by K4 (Sedef) on branch `nursedef` (see the K4 AI-tool statement under Use of AI) | Shuttle deck walk during the transit tasks |
| Western ice field, eastern lava-plain scenery, dig mounds, SCOUT-1 parts | this repository | Procedural pixel art drawn in code by the team (K2 `src/fx/westlands.js`, K3 prototype ported to `src/fx/dig_fx.js`) | Glacier and lava-plain routes |
| | | | |

## Use of AI

Say which tool was used, and where and how. AI-generated images and videos need a visible watermark and must not contain NASA logos, flags or mission identifiers.

| Tool | Used for | Where in the project |
|---|---|---|
| Claude (Anthropic), via Claude Code | Wrote the first version of the code skeleton and tests; values were checked against the NASA and NIST pages listed above | `index.html`, `src/main.js`, `src/core/`, `src/scenes/ending.js`, `src/data/nasa_data.json`, `tests/` |
| Gemini, Adobe Firefly (AI-assisted pixel-art tools) and custom pixel-drawing scripts | In-game pixel art and UI icons, adjusted to the SOL 14 palette (statement by K4 on branch `nursedef`, 2026-11-15) | `assets/` (incl. `assets/ui/*.png`, `assets/interior/*`, `assets/screens/scr_ship_*`) |
| Claude (Anthropic), via Claude Code | D-012 map, ice route, lava-tube sub-map, landing cutscene: code, procedural pixel drawing (lander, ice, boulders, cave), TR/EN texts and tests; sources checked against the NASA/JPL pages listed above | `src/systems/explore.js`, `src/fx/lander.js`, `src/fx/effects.js`, `data/explore_config.json`, `content/story.json`, `tests/explore.test.js` |
| Claude (Anthropic), via Claude Code | 2026-11-15 merge of the three archives and the git branches: conflict resolution, dig sites and hidden-wreck rules, porting the K3 prototype (FIELD CAM, SCOUT-1, scenery, Mars facts) and the K4 shuttle deck walk and tutorial into the modules, TR/EN texts and tests; real trail details checked against the NASA/JPL pages listed above | `src/systems/explore.js`, `src/fx/dig_fx.js`, `src/ui/field_cam.js`, `src/ui/cutscenes.js`, `src/core/objectives.js`, `content/story.json`, `tests/` |

## Simplified values

Real-world values that were changed or rounded for gameplay.

| Value | Real figure and source | Value in game | Why |
|---|---|---|---|
| Length of a sol | 24.6597 h (NASA Mars Fact Sheet) | about 2 minutes of play | A full 14-sol run fits in half an hour |
| `life.o2StartKg` | K1 decision: 14 sols of BVAD O2 (0.895 kg/day × 14 × 24.6597/24 = 12.9 kg) + 20% reserve | 15.4 kg | Not published for this case; set by K1 for gameplay |
| `powerSources[solar].panelAreaM2` | K1 decision: ~17% above the ~214 m² a 12 kWe habitat needs at the equator on a clear sol | 250 m² | Not published for this case; set by K1 for gameplay |
| `powerSources[solarRtg].panelAreaM2` | K1 decision: ~17% above the ~214 m² a 12 kWe habitat needs at the equator on a clear sol | 250 m² | Not published for this case; set by K1 for gameplay |
| `batteries[b150].capacityKWh` | K1 decision: options sized around the ~147 kWh night need of the DRA 5.0 habitat | 150 kWh | Not published for this case; set by K1 for gameplay |
| `batteries[b200].capacityKWh` | K1 decision: options sized around the ~147 kWh night need of the DRA 5.0 habitat | 200 kWh | Not published for this case; set by K1 for gameplay |
| `batteries[b300].capacityKWh` | K1 decision: options sized around the ~147 kWh night need of the DRA 5.0 habitat | 300 kWh | Not published for this case; set by K1 for gameplay |
| `insulation[thin].coolingTimeH` | K1 decision: heating is part of the 12 kWe habitat load; with power cut the habitat cools toward outside air with this time constant (simplified) | 10 h | Not published for this case; set by K1 for gameplay |
| `insulation[thick].coolingTimeH` | K1 decision: thick insulation doubles the cooling time (design doc v2: thick halves heat loss) (simplified) | 20 h | Not published for this case; set by K1 for gameplay |
| `rules.massMarginBonus` | K1 balance, tune in the balance session | 50 points | Not published for this case; set by K1 for gameplay |
| `rules.budgetMUSD` | K1 balance: a solar design fits, a fission design must drop instruments; reference costs Mars 2020 $2.4B, InSight $813.8M | 500 M$ | Not published for this case; set by K1 for gameplay |
| `rules.baseMassKg` | K1 decision D-009: not published, game value: DRA 5.0 pre-deploys the habitat and ascent vehicle on separate 40 t landers, so the player designs one lander payload | 0 kg | Not published for this case; set by K1 for gameplay |
| `events.engineFreeze.batteryHeatKWh` | K1 decision D-009: not published, game value (K2 proposal) | 3 kWh | Not published for this case; set by K1 for gameplay |
| `trajectories[fast].massKg` | K1 decision D-009: not published, game value (K3 proposal): extra propellant for the faster transfer | 2200 kg | Not published for this case; set by K1 for gameplay |
| `trajectories[fast].costMUSD` | K1 balance: extra propellant and stage | 60 M$ | Not published for this case; set by K1 for gameplay |
| `powerSources[solar].costMUSD` | K1 balance (no public unit cost) | 60 M$ | Not published for this case; set by K1 for gameplay |
| `powerSources[solarRtg].costMUSD` | K1 balance: panels only; the RTG cost is rtgCostMUSD | 60 M$ | Not published for this case; set by K1 for gameplay |
| `batteries[b150].costMUSD` | K1 balance (no public unit cost) | 30 M$ | Not published for this case; set by K1 for gameplay |
| `batteries[b200].costMUSD` | K1 balance (no public unit cost) | 40 M$ | Not published for this case; set by K1 for gameplay |
| `batteries[b300].costMUSD` | K1 balance (no public unit cost) | 60 M$ | Not published for this case; set by K1 for gameplay |
| `insulation[thin].massKg` | K1 decision D-009: not published, game value (K3 proposal) | 100 kg | Not published for this case; set by K1 for gameplay |
| `insulation[thin].costMUSD` | K1 balance (no public unit cost) | 5 M$ | Not published for this case; set by K1 for gameplay |
| `insulation[thick].massKg` | K1 decision D-009: not published, game value (K3 proposal) | 450 kg | Not published for this case; set by K1 for gameplay |
| `insulation[thick].costMUSD` | K1 balance (no public unit cost) | 15 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[camera].costMUSD` | K1 balance (instrument costs are not published per unit) | 20 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[meda].mbitPerUse` | K1 decision D-009: not published, game value (design doc v2): NASA gives "Approximately 11 megabytes" without a time unit | 1 Mbit | Not published for this case; set by K1 for gameplay |
| `instruments[meda].costMUSD` | K1 balance (instrument costs are not published per unit) | 10 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[seis].costMUSD` | K1 balance (instrument costs are not published per unit) | 30 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[rad].costMUSD` | K1 balance (instrument costs are not published per unit) | 5 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[rimfax].costMUSD` | K1 balance (instrument costs are not published per unit) | 10 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[spectrometer].costMUSD` | K1 balance (instrument costs are not published per unit) | 25 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[moxie].costMUSD` | K1 balance (instrument costs are not published per unit) | 35 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[plantChamber].mbitPerUse` | K1 decision D-009: not published, game value (design doc v2) | 2 Mbit | Not published for this case; set by K1 for gameplay |
| `instruments[plantChamber].costMUSD` | K1 balance (instrument costs are not published per unit) | 15 M$ | Not published for this case; set by K1 for gameplay |
| `instruments[drone].mbitPerUse` | K1 decision D-009: not published, game value (design doc v2) | 15 Mbit | Not published for this case; set by K1 for gameplay |
| `instruments[drone].costMUSD` | K1 balance (instrument costs are not published per unit) | 40 M$ | Not published for this case; set by K1 for gameplay |
| `comms[relay].costMUSD` | K1 balance (no public unit cost) | 10 M$ | Not published for this case; set by K1 for gameplay |
| `comms[relayX].massKg` | K1 decision D-009: not published, game value: X-band radio and high-gain antenna on top of the 3 kg relay radio | 25 kg | Not published for this case; set by K1 for gameplay |
| `comms[relayX].costMUSD` | K1 balance (no public unit cost) | 35 M$ | Not published for this case; set by K1 for gameplay |
| `spareKits[k1].massKg` | K1 decision D-009: not published, game value (K3 proposal) | 150 kg | Not published for this case; set by K1 for gameplay |
| `spareKits[k1].costMUSD` | K1 balance | 10 M$ | Not published for this case; set by K1 for gameplay |
| `spareKits[k2].massKg` | K1 decision D-009: not published, game value (K3 proposal) | 300 kg | Not published for this case; set by K1 for gameplay |
| `spareKits[k2].costMUSD` | K1 balance | 20 M$ | Not published for this case; set by K1 for gameplay |
| `terrain.map` (−450 m … base … +600 m, zones, landing pad) | D-012 team map; compressed, fictional layout | ice route −450 m, lava-tube skylight +600 m | Walking time and suit O₂ pacing for the first playable version |
| `explore.cave` (fictional lava tube, 190 m long, chamber span 34 m) | Real Mars skylights are on Arsia Mons, ~100–225 m across (NASA Mars Odyssey) | fictional tube at the map's east end | Short sub-map; labelled fictional in the game |
| `explore.cave.skylight.tempSwingFraction` | THEMIS: skylight day-night change ≈ 1/3 of the surroundings (NASA photojournal PIA09930) | deep reading = diurnal mean + (surface − mean) × 0.333 | Simplified one-line model of a real observation |
| `explore.cave.vibrationPoints` | No real data; synthetic relative amplitudes | 0.42 / 0.47 / 0.71 | Interpretation exercise; never shown as a measurement or as a safety verdict |
| `explore.ice` (4 clusters, relic rewards, report points, minutes) | Game values (D-012) | see `data/explore_config.json` | Pacing and rewards |
| `terrain.map` widened (west to −5350 m, east to +1400 m, zones) | 2026-11-15 merge; compressed, fictional layout | glacier route west, lava-plain route east | Walking time and suit O₂ pacing |
| `terrain.westRegion` (ice field, cold, blizzard, ice barriers, cave, probe) | K2 trial values, labelled fiction in the data | see `data/nasa_data.json` | Cold-route challenge |
| `explore.dig` (dig sites, hits, minutes per hit, scanner and RIMFAX ranges) | Game values | see `data/explore_config.json` | Wrecks are found by digging, not by walking past |
| `explore.cave.scout` (SCOUT-1 rover, fictional) and `explore.westFinds` | Game values; SCOUT-1 and the cargo lander are fictional | see `data/explore_config.json` | Vehicle finds in the tube and on the glacier |
| `explore.fieldCam` | Game values | 40 s, focus tolerance 0.04 | FIELD CAM photo minigame |
| `gameplay.cargoBonus` | K4 (Sedef) rule; game values | margin > 15% → +4 kg O₂, +10 L water at landing | Free payload mass carries consumables |
