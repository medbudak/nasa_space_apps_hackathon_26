# REFERENCES.md

Running log of everything external the project uses. The submission form asks for all of it, so add a line the moment you add the thing. Anyone may append here without asking.

## NASA data and resources

| Resource | URL | Used for |
|---|---|---|
| NASA Mars Fact Sheet (NSSDCA) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Mars gravity, solar irradiance, sol length, pressure, CO2 share, temperatures, Earth-Mars distance, synodic period (`src/data/nasa_data.json` → `mars`) |
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
| | | | |

## Use of AI

Say which tool was used, and where and how. AI-generated images and videos need a visible watermark and must not contain NASA logos, flags or mission identifiers.

| Tool | Used for | Where in the project |
|---|---|---|
| Claude (Anthropic), via Claude Code | Wrote the first version of the code skeleton and tests; values were checked against the NASA and NIST pages listed above | `index.html`, `src/main.js`, `src/core/`, `src/scenes/ending.js`, `src/data/nasa_data.json`, `tests/` |

## Simplified values

Real-world values that were changed or rounded for gameplay.

| Value | Real figure and source | Value in game | Why |
|---|---|---|---|
| Length of a sol | 24.6597 h (NASA Mars Fact Sheet) | about 2 minutes of play | A full 14-sol run fits in half an hour |
