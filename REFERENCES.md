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
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/press_kits/mars_2020/launch/mission/ | nasa_data.json: gameplay.transit (solar-powered cruise stage; `landingChargeFrac`) |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2015/09/373665main_nasa-sp-2009-566.pdf | nasa_data.json: rocket (Mars DRA 5.0: most of the ascent propellant, the oxygen, is made on Mars) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/images/pia12215-new-impact-craters-on-mars/ | nasa_data.json: station (new impact craters do form on Mars; the impact next to the base is fiction) |
| science.nasa.gov | https://science.nasa.gov/photojournal/temperature-behavior-of-possible-cave-skylight-on-mars | explore_config.json: cave.skylight (THEMIS: skylight day-night swing ≈ 1/3 of the surrounding surface) — D-012 |
| science.nasa.gov | https://science.nasa.gov/solar-system/planets/mars/nasa-orbiter-finds-possible-cave-skylights-on-mars/ | Lava-tube fiction label: known skylights ("Seven Sisters", ~100–225 m) are on Arsia Mons — D-012 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/right-front-wheel-rotations/ | forensics_cases.json: Spirit salvageChoice (right-front wheel actuator failed March 2006) — D-012 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/ | forensics_cases.json: Spirit salvageChoice (dusty arrays, last winter) — D-012 |
| science.nasa.gov | https://science.nasa.gov/mission/phoenix/ | nasa_data.json: terrain.westRegion (Phoenix found water ice under the surface, frost and ice-rich polygons: basis of the glacier route, K2) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/steep-slopes-on-mars-reveal-structure-of-buried-ice/ | nasa_data.json: westRegion.iceCave, shelterCave, glacier (buried ice exposed at scarps; the walk-in shelter cave is fiction, D-016) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasa-mars-lander-sees-falling-snow-soil-data-suggest-liquid-past/ | nasa_data.json: westRegion.blizzard (Phoenix lidar saw snow; the ground blizzard is labelled fiction) |
| science.nasa.gov | https://science.nasa.gov/missions/mars-polar-lander | nasa_data.json: westRegion.finalProbe (Deep Space 2 microprobes, lost 1999; placement fictional) |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/mineral-in-mars-berries-adds-to-water-story/ | explore_config.json: minerals.types hematite (Opportunity's hematite 'blueberries' at Meridiani, a sign of past water) — Kişi 5 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/opportunity-rover-finds-an-iron-meteorite-on-mars/ | explore_config.json: minerals.types meteorite ('Heat Shield Rock', iron-nickel, first meteorite identified on another planet) — Kişi 5 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasas-curiosity-eyes-prominent-mineral-veins-on-mars/ | explore_config.json: minerals.types gypsum (Curiosity's calcium sulfate veins, Yellowknife Bay, Gale crater) — Kişi 5 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasa-mars-rover-finds-mineral-vein-deposited-by-water/ | content/story.json: mineral.gypsum.fact (Opportunity's 'Homestake' vein, probably gypsum, Endeavour crater rim, 2011) — Kişi 5 |
| science.nasa.gov | https://science.nasa.gov/resource/martian-pit-feature-found-by-seventh-graders-2/ | content/story.json: mineral.cave_note (candidate lava-tube skylight on Pavonis Mons; not every pit opens into a tube) — Kişi 5 |
| jpl.nasa.gov | https://www.jpl.nasa.gov/news/nasa-mars-rovers-first-soil-analysis-yields-surprises/ | explore_config.json: minerals.types olivine (Spirit's first soil analysis found olivine, which weathers easily) — Kişi 5 |
| ntrs.nasa.gov | https://ntrs.nasa.gov/citations/20080026098 | explore_config.json: minerals.types basalt (olivine-rich 'Adirondack' basalts of the Gusev plains) — Kişi 5 |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2023/03/water-technical-brief-ochmo.pdf | nasa_data.json: constants.lifeSupport (NASA-STD-3001 water: ≥ 2.5 L per crew member per day for drinking + food rehydration, +0.24 L per EVA hour) — needs system |
| nasa.gov | https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-002-eclss.pdf | nasa_data.json: constants.lifeSupport.foodKcalPerSol (average 3,035 kcal per crew member per day) — needs system |
| ntrs.nasa.gov | https://ntrs.nasa.gov/citations/20190027563 | gameplay.needs (BVAD: packaged food per crew member per day; food is planned as individual meals) |
| ntrs.nasa.gov | https://ntrs.nasa.gov/api/citations/20240010442/downloads/Behavioral%20Challenges%20of%20a%20Mars%20Mission.pdf | gameplay.needs morale effects (NASA HRP Human Factors and Behavioral Performance: isolation, confinement, sleep loss; ISS, Mars-500 and HI-SEAS analogs) |

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
| awesome-gamedev-agent-skills (14 skills copied into `.claude/skills/`, see CLAUDE.md "Project skills") | https://github.com/gamedev-skills/awesome-gamedev-agent-skills | Apache-2.0 (`LICENSE`, `NOTICE` in each folder) | Instructions for the team's AI coding agent (game-jam, UI/UX, game-feel, level design, performance ...); not shipped in the game |
| claude-code-prompt-improver (`prompt-improver` skill only, in `.claude/skills/`) | https://github.com/severity1/claude-code-prompt-improver | MIT (`LICENSE` in the folder) | Lets the AI coding agent clarify vague requests before acting; not shipped in the game |
| i-have-adhd (skill in `.claude/skills/`) | https://github.com/ayghri/i-have-adhd | MIT (`LICENSE` in the folder) | Optional action-first reply style for the AI coding agent; not shipped in the game |
| Game artwork in `assets/` (backgrounds, sprites, screens, effects, ending) | this repository | Original work by the team (K4) | All in-game images |
| `assets/sprites/astronaut_crouch_sheet.png` (4-frame crouch) | this repository | Supplied by the team as a GIF (Sude), frames aligned on the boots and joined into a strip (origin to be confirmed: if AI-generated, list under Use of AI and add a visible watermark) | Crouching with S / ↓ (crouch-walk with ← / →) |
| `assets/sprites/astronaut_walk_sheet.png` (6-frame walk cycle) | this repository | Supplied by the team as a GIF, converted to a sprite strip (origin to be confirmed) | Astronaut walking animation on the surface and inside the habitat |
| `assets/sprites/plants/{lettuce,radish,zinnia}_{1,2,3}.png` (greenhouse growth stages) | this repository | Drawn by Kişi 7 (nursedefyildiz); sources scaled from 2048 px to 256 px, the build makes 48×48 (origin to be confirmed: if AI-generated, list under Use of AI and add a visible watermark) | Greenhouse panel: germination, sprout and mature for lettuce, radish and zinnia (Kişi 6) |
| `docs/design/references/lava-tube-reference.png` | this repository | Supplied by the team as a mock-up (origin to be confirmed; has UI text baked in, so it is a design reference only and is not shipped in the game) | Palette and layout reference for the procedural lava-tube scene (`src/fx/effects.js` `renderCave`) — D-012 |
| `docs/design/references/lander-reference.png` | this repository | Supplied by the team as the crew-lander mock-up (origin to be confirmed; Mars background baked in, so it is a design reference only and is not shipped in the game) | Art reference for the opening landing cutscene lander — D-012 |
| Landing cutscene lander and lava-tube scene | this repository | Procedural pixel art drawn in code (`src/fx/lander.js`, `src/fx/effects.js`) | Opening landing sequence and the lava-tube sub-map — D-012 |
| "Monologue Wind.wav" by dlgebert (Freesound) | https://freesound.org/people/dlgebert/sounds/527281/ | CC0 | `assets/audio/wind_loop` (.mp3) · surface wind |
| Storm sound by Vrymaa (Freesound) | https://freesound.org/people/Vrymaa/sounds/825860/ | CC0 | `assets/audio/storm_loop` (.mp3) · dust storm |
| "Alarm.wav" by DylanTheFish (Freesound) | https://freesound.org/people/DylanTheFish/sounds/440307/ | CC0 | `assets/audio/alarm` (.mp3) · crisis card alert |
| "FX - Earthquake" by bolkmar (Freesound) | https://freesound.org/people/bolkmar/sounds/529244/ | CC0 | `assets/audio/quake_rumble` (.mp3) · marsquake |
| "Footsteps_Mountain_Boots_Gravel_Mono.wav" by Nox_Sound (Freesound) | https://freesound.org/people/Nox_Sound/sounds/556002/ | CC0 | `assets/audio/footsteps` (.mp3) · walking |
| Radio static by giddster (Freesound) | https://freesound.org/people/giddster/sounds/805685/ | CC0 | `assets/audio/radio_static` (.mp3) · Mission Control, UFO scene |
| "shuttlelaunch.wav" by klangfabrik (Freesound) | https://freesound.org/people/klangfabrik/sounds/220127/ | CC0 | `assets/audio/rocket_rumble` (.mp3) · MAV launch, UFO scene |
| "Dark Voice Drone 01 - Loop" by kkenny101 (Freesound) | https://freesound.org/people/kkenny101/sounds/871594/ | CC0 | `assets/audio/drone_ambience` (.mp3) · UFO scene |
| "Camera Shutter Click" by Kodack (Freesound) | https://freesound.org/people/Kodack/sounds/271010/ | CC0 | `assets/audio/camera_shutter` (.mp3) · automatic photo, evidence photo |
| "Crowd Cheer" by FoolBoyMedia (Freesound) | https://freesound.org/people/FoolBoyMedia/sounds/397434/ | CC0 | `assets/audio/crowd_cheer` (.mp3, Freesound HQ preview) · crowd applause and cheers after the opening launch |
| Data tick (60 ms, 1.2 kHz beep) | Made by the team with ffmpeg (sine generator), no external source | Own work | `assets/audio/data_tick` (.mp3) · downlink ticks. The Freesound pick (661435, a 7-minute track) did not fit and was not used |
| VT323 font (`assets/fonts/VT323-Regular.ttf`, embedded in `styles/fonts.css`) | https://github.com/google/fonts/tree/main/ofl/vt323 | SIL Open Font License 1.1 (`assets/fonts/OFL-VT323.txt`) | The single retro UI font for every panel, card, HUD and canvas label |
| `assets/ui/field_cam.png` (FIELD CAM camera body) | this repository | Supplied by K3 (Medine) with the world prototype (origin to be confirmed) | Photo-evidence minigame frame (`src/ui/field_cam.js`) |
| `assets/sprites/astronaut_indoor.png` (crew member inside the shuttle) | this repository | Supplied by K4 (Sedef) on branch `nursedef` (see the K4 AI-tool statement under Use of AI) | Shuttle deck walk during transit |
| Western ice field, eastern lava-plain scenery, dig mounds, SCOUT-1 parts | this repository | Procedural pixel art drawn in code by the team (K2 `src/fx/westlands.js`, K3 prototype ported to `src/fx/dig_fx.js`) | Glacier and lava-plain routes |
| Mineral icons `assets/sprites/mineral_*.png` (24×24, stored at 48×48) and the ground / tube-vein glints | this repository | Pixel art generated by a small script written with Claude Code (pixel maps, no image model), matched to the flat style and palette of the UI icons in `assets/ui/`; dig spots and veins drawn in code in `src/fx/dig_fx.js` with the dig-mound style (site palette, night shading, same glint) | Inventory, mineral info card, dig spots (Kişi 5) |
| `assets/sprites/astro/astro_{surface_idle,surface_walk,float,eat,drink,sleep}.png` (4-frame strips) | this repository | Six GIFs supplied by the team (`01_bekleme` … `06_uyku`), converted to transparent strips: navy background removed, the sleep GIF's baked-in "z" dropped (drawn in code instead), scaled to the existing sprite heights (58 px surface, 132 px interior). Origin to be confirmed: if AI-generated, list under Use of AI and add a visible watermark | Astronaut idle/walk on the surface and in the tube, zero-g float on the transit deck, eat / drink / sleep in the lander |
| `assets/sprites/astro/astro_{indoor_idle,indoor_walk,indoor_float,surface_kneel,legacy_*}.png` | this repository | Derived from the same team GIFs by script (Claude Code): the helmet is removed and the bare head from `04_yemek.gif` is placed instead (inside the lander and the shuttle); the kneel/crouch is the idle frame with the legs folded and the knees forward; `legacy_*` are single frames used under the old sprite keys so the old astronaut no longer appears anywhere | Bare-headed crew indoors and on the transit deck, kneeling while scanning or digging |
| `assets/structures/greenhouse_ok.png` (geodesic greenhouse dome, updated) | this repository | Drawn by Kişi 7 (nursedefyildiz, branch `nursedef`); origin to be confirmed as above | Greenhouse on the surface |
| `assets/sprites/minerals/{hematite,meteorite,gypsum,olivine}_{1,2,3}.png` (mineral art: 1 in the ground, 2 raw sample, 3 processed) | this repository | Drawn by Kişi 7 (nursedefyildiz, branch `nursedef`); the 2048 px originals were cropped and scaled to 512 px sources, the build makes 36 px ground sprites and 96 px card images. `gold_silver_*` was left out: gold and silver are not a Mars finding and the game has no such mineral. Origin to be confirmed (if AI-generated: Use of AI + visible watermark). The processed stage (iron ingot etc.) is labelled game fiction in the card | Mineral dig spots (surface, tube olivine), inventory and the mineral info card |
| Space junk and satellite remains east of the lava tube (panel fragments, parachute, backshell, tank, truss, dish, satellite body) | this repository | Procedural pixel art drawn in code (`src/fx/dig_fx.js`, Claude Code). Fictional scenery on a compressed map: real Mars does hold landing hardware (parachutes, backshells, heat shields), but no satellite has crashed at these sites | East route scenery 1480–2960 m |
| | | | |

Sounds were trimmed, mixed to mono, loudness-normalised and converted to 96 kbps MP3 with ffmpeg so the game loads fast. Played by `src/fx/audio.js` (HTMLAudioElement, works over `file://`); the alarm, quake, launch, radio static, camera shutter, wind and storm sounds are wired, the others are kept for later use.
| `assets/screens/scr_prep_{objective,rocket,habitat,instruments}.jpg` (mission prep previews: astronaut and rover, spacecraft between Earth and Mars, habitat with battery and solar panels, lab bench) | this repository | Supplied by the team lead on 2026-11-15 (origin and AI use to be confirmed; AI-generated art needs a visible watermark) | Mission prep preview panels (`src/ui/design_screens.js`) |
| `assets/interior/lander_interior.png` (lander cutaway: cockpit, storage, lab, bunks, galley, airlock) | this repository | From Sude's (K2) project copy "16.09 SON HAL" (not pushed to a branch); origin and AI use to be confirmed (AI-generated art needs a visible watermark) | Lander interior and the transit deck (`src/fx/effects.js`, `src/ui/cutscenes.js`) |

## Use of AI

Say which tool was used, and where and how. AI-generated images and videos need a visible watermark and must not contain NASA logos, flags or mission identifiers.

| Tool | Used for | Where in the project |
|---|---|---|
| Claude (Anthropic), via Claude Code | Wrote the first version of the code skeleton and tests; values were checked against the NASA and NIST pages listed above | `index.html`, `src/main.js`, `src/core/`, `src/scenes/ending.js`, `src/data/nasa_data.json`, `tests/` |
| Gemini, Adobe Firefly (AI-assisted pixel-art tools) and custom pixel-drawing scripts | In-game pixel art and UI icons, adjusted to the SOL 14 palette (statement by K4 on branch `nursedef`, 2026-11-15) | `assets/` (incl. `assets/ui/*.png`, `assets/interior/*`, `assets/screens/scr_ship_*`) |
| Claude (Anthropic), via Claude Code | D-012 map, ice route, lava-tube sub-map, landing cutscene: code, procedural pixel drawing (lander, ice, boulders, cave), TR/EN texts and tests; sources checked against the NASA/JPL pages listed above | `src/systems/explore.js`, `src/fx/lander.js`, `src/fx/effects.js`, `data/explore_config.json`, `content/story.json`, `tests/explore.test.js` |
| Claude (Anthropic), via Claude Code | 2026-11-15 merge of the three archives and the git branches: conflict resolution, dig sites and hidden-wreck rules, porting the K3 prototype (FIELD CAM, SCOUT-1, scenery, Mars facts) and the K4 shuttle deck walk and tutorial into the modules, TR/EN texts and tests; real trail details checked against the NASA/JPL pages listed above | `src/systems/explore.js`, `src/fx/dig_fx.js`, `src/ui/field_cam.js`, `src/ui/cutscenes.js`, `src/core/objectives.js`, `content/story.json`, `tests/` |
| Claude (Anthropic), via Claude Code | Ported K3 (Medine)'s world prototype from branch `medine-world-proto` into the game modules: task-free transit deck, per-task minigames and cable panel, dust storm, longer east route, station-strip lander panel, station side story (impact card, scattered cargo, station drawing, workshop modules, ending slide), TR/EN texts and tests | `src/ui/cutscenes.js`, `src/minigames/task_games.js`, `src/fx/effects.js`, `src/fx/dig_fx.js`, `src/ui/habitat_panel.js`, `src/systems/station.js`, `src/fx/station_fx.js`, `src/ui/station_card.js`, `tests/station.test.js` |
| Claude (Anthropic), via Claude Code | Kişi 4 task card: tools (pickaxe, drill, scanner), MAV damage and repair screen, grouped inventory grid, TR/EN texts and tests | `src/systems/rocket.js`, `src/systems/workshop.js`, `src/ui/habitat_panel.js`, `src/ui/workshop_panel.js`, `tests/rocket.test.js` |
| Claude (Anthropic), via Claude Code | Kişi 5 exploration and minerals: mineral dig spots and drilled tube veins, inventory and info card, TR/EN texts, the pixel-map script for the five mineral icons and tests; each mineral fact checked against the NASA/JPL pages listed above | `src/systems/explore.js`, `data/explore_config.json` (`minerals`), `src/fx/dig_fx.js`, `src/ui/workshop_panel.js`, `assets/sprites/mineral_*.png`, `content/story.json`, `tests/minerals.test.js` |
| Claude (Anthropic), via Claude Code | Needs system (Kişi 2): hunger, thirst and fatigue logic, eat/drink/sleep/toilet actions, HUD bars, habitat panel buttons with cost preview, TR/EN texts and tests; water and food values checked against the NASA pages listed above | `src/core/sim.js`, `src/core/state.js`, `src/core/surface.js`, `src/ui/hud.js`, `src/ui/habitat_panel.js`, `styles/main.css`, `data/nasa_data.json`, `content/story.json`, `tests/needs.test.js`, `tests/helpers/bot.js` |
| Claude (Anthropic), via Claude Code | Integrating the team's six astronaut GIFs (background removal script, sprite strips, surface/tube drawing with the held-tool glove points, transit zero-g float with W/S, lander eat/drink/sleep animations), the east space-junk scenery, the bottle-rack panel fix and the needs row inside the lander panel; TR/EN texts | `src/fx/effects.js`, `src/fx/dig_fx.js`, `src/ui/cutscenes.js`, `src/ui/habitat_panel.js`, `src/main.js`, `styles/main.css`, `assets/sprites/astro/` |
| Claude (Anthropic), via Claude Code | Playtest fixes (2026-11-15 evening): greenhouse trays (several plants, water per tray), solar and ISRU levels 1-3 and level pips on built structures, lab-device redraw of the six experiment minigames, FIELD CAM focus scale, bottle-rack redraw, gentler sleep fade, toast queue, trimmed HUD; TR/EN texts and tests | `src/core/sim.js`, `src/systems/workshop.js`, `src/ui/habitat_panel.js`, `src/minigames/task_games.js`, `src/ui/field_cam.js`, `src/fx/westlands.js`, `src/fx/effects.js`, `src/ui/ui_kit.js`, `src/ui/hud.js`, `tests/greenhouse_trays.test.js` |
| AI image generation tool (statement by Kişi 7 on branch `nursedef`) | UFO finale and cover visuals, watermark preserved: `ufo_liftoff.png`, `ufo_sky.png`, `scr_mission_control.png`, `ufo_photo_clear.png`, `ufo_photo_blur.png`, `cover_thumbnail.png` | `assets/ending/`, `assets/screens/` (ending sequence and the 30 s video cover) |

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
| `terrain.westRegion.shelterCave` (position −1920…−2020 m, 2 L bottle, 15 min to fill, 80% walking speed while carrying) | game values, fiction (D-016, proposed) | see `data/nasa_data.json` | Shelter and water-carrying trade-off |
| `explore.dig` (dig sites, hits, minutes per hit, scanner and RIMFAX ranges) | Game values | see `data/explore_config.json` | Wrecks are found by digging, not by walking past |
| `explore.cave.scout` (SCOUT-1 rover, fictional) and `explore.westFinds` | Game values; SCOUT-1 and the cargo lander are fictional | see `data/explore_config.json` | Vehicle finds in the tube and on the glacier |
| `explore.fieldCam` | Game values | 40 s, focus tolerance 0.04 | FIELD CAM photo minigame |
| `gameplay.cargoBonus` | K4 (Sedef) rule; game values | margin > 15% → +4 kg O₂, +10 L water at landing | Free payload mass carries consumables |
| `gameplay.deploy` (minutes and minigame per base system) | Game values (ux-plan #8) | solar 30 min, ISRU 40, greenhouse 30, MAV 45 | Base systems land in crates and are set up by the player |
| `gameplay.transit` (`deckSeconds`, `landingChargeFrac`) | Game values (D-014) | 45 s on the deck, battery at 90% on landing | Transit has no tasks; landing resources are fixed |
| `station` (impact Sol, pad and crater positions, scattered cargo, mound kits, regolith dig minutes) and the `station_*` workshop recipes | Game values; the meteorite impact is fiction (D-014) | impact on Sol 2, pad +125 m, 9 pickups, 4 min per regolith bag | Station side story built from scattered cargo |
| `tools` (start tools, no-pickaxe dig factor) and `rocket` (damaged parts, materials, energy, EVA minutes) | Game values (D-015); the landing damage and meteorite are fiction | pickaxe + scanner at start, ×2 dig time without pickaxe; fuel line 1 spare part, 1 kWh, 40 min; hull 1 spare part + 1 crate, 2 kWh, 60 min | Repairs compete for the same materials, energy and EVA time |
| `habitat.greenhouse.growth.traysPerLevel`, `workshop.upgrades.solar` / `isru` (`panelFactor`, `o2Factor`, `extraPowerW`, `evaMinutes`) and the `solar_l*` / `isru_l*` recipes | Game values (playtest request: everything built has levels 1-3) | 3 / 4 / 6 trays; solar ×1 / 1.2 / 1.4 with 0 / 45 / 60 min outside work; MOXIE O2 ×1 / 1.25 / 1.5 with +0 / 60 / 120 W | Every level is a trade-off; more plants need more water |
| `explore.minerals` (spot positions, hits, minutes per hit, amounts, in-game use; tube veins need Kişi 4's drill) | Game values (Kişi 5); the mineral types and facts are real (NASA/JPL pages above), the lava-tube veins are fictional like the tube | 4 surface spots, 3 tube veins, 3–4 hits of 4–5 min, 1–3 pieces each (14 pieces in all, was 9; hematite stays short of every upgrade, so the player still chooses) | Exploration feeds repairs and upgrades |
| `gameplay.needs` (rise rates, thresholds, relief per meal/drink) | NASA-STD-3001: 2.5 L water and ~3,035 kcal per crew member per day; no published "hunger per hour" figure | about 3 meals, 4 drinks and one sleep per sol | Turns real daily needs into a playable loop; tune only in nasa_data.json |
| `habitat.greenhouse.growth.plants` | ISS crops: radish harvested on day 27 (https://www.nasa.gov/missions/station/astronauts-harvest-radish-crop-on-international-space-station/), Veggie lettuce about 33 days (https://www.nasa.gov/missions/station/iss-research/growing-plants-in-space/), zinnias flowered after about 60 days (https://www.nasa.gov/image-article/first-flower-grown-space-stations-veggie-facility-2/) | every plant shows germination → sprout → mature; tended sols to mature: radish 2, lettuce 3, zinnia 4 (same order as the real times); harvest radish 0.6 kg / lettuce 1 kg × yield, zinnia flowers morale only; 30 min | Growth has to fit the 14-sol mission (Kişi 6) |
| `workshop.upgrades` + `*_l2` / `*_l3` recipes | no published figure; game trade-offs | greenhouse yield +25/+50 %, load +40/+90 W; station UA ×0.8/×0.65, 60/90 min outside work; rocket +2/+4 % fuel per Sabatier batch, 4/6 kWh; paid with Kişi 5's minerals (basalt, hematite, olivine, meteorite), fewer on the map than all upgrades need | Level 1-2-3 upgrades, each with a cost (Kişi 6) |
