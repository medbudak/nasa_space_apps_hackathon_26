/* OTOMATİK ÜRETİLDİ — elle düzenlemeyin. Kaynak: data/nasa_data.json  (node tools/build.js data) */
window.SOL14 = window.SOL14 || {};
window.SOL14.DATA = {
 "meta": {
  "project": "SOL 14: RED HORIZON",
  "version": "3.0.0",
  "note": "Bilimsel sabitler resmi NASA/ESA kaynaklarından; 'gameplay' bloğu oyun dengesi ayarlarıdır.",
  "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
 },
 "constants": {
  "marsGravity": {
   "value": 3.73,
   "earthValue": 9.80665,
   "ratioToEarth": 0.38,
   "note": "Mean surface gravity on the NASA Mars Fact Sheet (3.71 in older documents is out of date).",
   "unit": "m/s^2",
   "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
  },
  "solarIrradiance": {
   "mean": 586.2,
   "perihelion": 715,
   "aphelion": 492,
   "earthMean": 1361,
   "unit": "W/m^2",
   "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
  },
  "atmosphere": {
   "surfacePressureKpa": 0.636,
   "earthPressureKpa": 101.325,
   "triplePointWaterKpa": 0.61165,
   "co2FractionPct": 95.32,
   "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
  },
  "temperature": {
   "globalMeanC": -63,
   "equatorDayMaxC": 20,
   "equatorNightMinC": -80,
   "unit": "C",
   "src": "https://science.nasa.gov/mars/facts/"
  },
  "speedOfLight": {
   "kms": 299792.458,
   "src": "https://ssd.jpl.nasa.gov/horizons/"
  },
  "speedOfSound": {
   "marsMs": 240,
   "marsHighFreqMs": 250,
   "earthMs": 343,
   "src": "https://science.nasa.gov/resource/nasas-perseverance-rover-captures-sounds-of-mars/"
  },
  "radiation": {
   "transitDailyMsv": 1.84,
   "surfaceDailyMsv": 0.67,
   "speUnshieldedMsv": 45,
   "speShelteredMsv": 3,
   "careerLimitMsv": 600,
   "src": "https://mars.nasa.gov/msl/spacecraft/instruments/rad/"
  },
  "sol": {
   "hours": 24.6597,
   "minutes": 1479.58,
   "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
  },
  "synodicPeriod": {
   "months": 26,
   "missedWindowCostM": 140,
   "src": "https://trajbrowser.arc.nasa.gov/"
  },
  "marsquake": {
   "largestRecordedMagnitude": 4.7,
   "seisWarningSeconds": 30,
   "src": "https://science.nasa.gov/mission/insight/"
  },
  "dustStorm": {
   "opportunityTau": 10.8,
   "gameTau": 8.5,
   "solarTransmissionK": 0.17,
   "panelDustAddPerSol": 0.08,
   "src": "https://science.nasa.gov/mission/mer-opportunity/"
  },
  "panelDust": {
   "dailyAccumulation": 0.02,
   "maxDust": 0.9,
   "src": "https://science.nasa.gov/mission/insight/"
  },
  "lifeSupport": {
   "o2KgPerSol": 0.92,
   "waterLPerSol": 2,
   "suitO2CapacityKg": 0.9,
   "src": "https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf",
   "note": "o2KgPerSol: BVAD Rev 2 Table 3-31, 0.895 kg per crew member per Earth day x 24.66/24 h. waterLPerSol: BVAD drinking water 2.00 kg per day.",
   "simplified": true,
   "simplifiedNote": "suitO2CapacityKg is a game value; the Advanced EMU stores about 0.77 kg (1.7 lbm) of usable O2 (ntrs.nasa.gov/citations/20170009505)."
  },
  "eva": {
   "simplified": true,
   "simplifiedNote": "Real: NASA's Artemis xEVA suit supports EVAs of up to 8 h (6 ± 2 h) plus 1 h of backup O2, and traverses are planned at about 2 km/h (33 m/min) (xEVA System ConOps EVA-EXP-0042 Rev B). suitO2PctPerMin = 100 % / 480 min, so a full suit lasts the 8 h EVA; use is constant here (real use depends on workload) and the 1 h backup is not modelled. BVAD gives 0.086 kg O2 per EVA hour. Game values: speedMPerMin 45 m/min (faster than the 2 km/h planning pace); suit battery drain base 0.04 %/min + heater 0.21 %/min per 100 °C below 0 °C, chosen so a full battery heats the suit for the 8 h EVA at −80 °C (no Mars-suit heater power is published); suitCoolingFracPerMin 0.004 (time constant ≈ 250 min) so that with an empty battery at −80 °C the joints freeze after about 55 min and the suit reaches −15 °C after about 1.9 h; warming rates, the low-integrity penalty and all thresholds.",
   "speedMPerMin": 45,
   "frozenSpeedFactor": 0.4,
   "suitO2PctPerMin": 0.2083,
   "pointOfNoReturnSafetyFactor": 1.2,
   "suitLeakO2Multiplier": 2,
   "suitBatteryBasePctPerMin": 0.04,
   "suitHeaterPctPerMinPer100C": 0.21,
   "suitLowIntegrityPct": 50,
   "suitLowIntegrityBatteryFactor": 1.5,
   "suitBatteryLowWarnMinutes": 60,
   "suitHeaterWarmCPerMin": 0.4,
   "suitHabitatWarmCPerMin": 2,
   "suitNominalC": 22,
   "suitCoolingFracPerMin": 0.004,
   "jointFreezeSuitC": 2,
   "hypothermiaSuitC": -15,
   "hypothermiaMinutes": 120,
   "src": "https://www.nasa.gov/wp-content/uploads/2017/02/eva-exp-0042_xeva_system_con_ops_rev_b_final_dtd_10192020_ref_doc.pdf"
  },
  "moxie": {
   "o2GramsPerHourDay": 6,
   "o2GramsPerHourNight": 10,
   "src": "https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/"
  },
  "sabatier": {
   "equation": "CO2 + 4H2 -> CH4 + 2H2O",
   "batchMinutes": 90,
   "energyKwh": 4,
   "waterL": 2,
   "mavFuelPctPerBatch": 9,
   "o2ByproductKg": 0.15,
   "src": "https://ntrs.nasa.gov/"
  },
  "rhu": {
   "thermalW": 1,
   "src": "https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/"
  }
 },
 "gameplay": {
  "simplified": true,
  "simplifiedNote": "Game balance block. Time is compressed: a sol is 24.66 h (constants.sol, NASA Mars Fact Sheet); at gameMinutesPerRealSecond 2 it lasts about 12.3 real minutes (12 h of daylight ≈ 6 min) and in the jury quick mode (?demo, demoGameMinutesPerRealSecond 4) about 6.2 min. The on-screen walking speed is not a separate value: it is eva.speedMPerMin × game minutes per real second ÷ metersPerPixel, so metres walked per game minute always equal eva.speedMPerMin.",
  "gameMinutesPerRealSecond": 2,
  "demoGameMinutesPerRealSecond": 4,
  "cargoBonus": {
   "minMarginPct": 15,
   "o2Kg": 4,
   "waterL": 10,
   "note": "K4 Sedef (nursedef design advisor): free payload mass carries extra consumables. Game values; 4 kg O2 + 10 L water is 14 kg, well inside a 15% margin of any rocket's Mars payload in this game."
  },
  "solStartMinute": 360,
  "sunriseMinute": 360,
  "sunsetStartMinute": 1080,
  "nightStartMinute": 1140,
  "metersPerPixel": 1.2,
  "spritePxPerMeter": 30,
  "earthJumpHeightM": 0.5,
  "interiorWalkPxPerSecond": 105,
  "maxEvaRangeM": 1400,
  "habitatTargetC": 20,
  "habitatHeatCapacityJPerK": 81000,
  "habitatComfortMinC": 10,
  "moralePerSol": -3,
  "lowHabitatTempMoralePerHour": -2,
  "jumpVelocityPxPerS": 150,
  "wreckInteractRangeM": 40,
  "structureInteractRangeM": 30,
  "suitBatteryKwh": 1.2,
  "batteryReserveFrac": 0.2,
  "protectedLoadCount": 2,
  "habitatCalmMinutes": 180,
  "threatPreSignalMinutes": 90,
  "actions": {
   "refillSuitMin": 20,
   "chargeSuitMin": 30,
   "repairSuitMin": 40,
   "repairSuitIntegrity": 50,
   "repairSuitKitMin": 20,
   "cleanPanelsMin": 30,
   "salvageMin": 30,
   "diagnoseMin": 10,
   "sleepMorale": 6
  },
  "launchWindow": {
   "simplified": true,
   "simplifiedNote": "Game values: crew morale at landing when the launch window is caught (90) or missed (80). Real: Earth-Mars launch windows open about every 26 months (constants.synodicPeriod, NASA Trajectory Browser); a missed window means a long wait on the ground, modelled here as extra cost and lower starting morale.",
   "moraleStartCaught": 90,
   "moraleStartMissed": 80,
   "src": "https://trajbrowser.arc.nasa.gov/"
  },
  "instrumentData": {
   "simplified": true,
   "simplifiedNote": "Game rule: each instrument dataMbit (instruments list) is its routine science and housekeeping volume per sol. It is downlinked automatically before the player report packets on every relay pass, so data-heavy instruments leave less room for reports. The per-instrument volumes are game values scaled to the game relay pass capacities (habitat.relayPasses), not measured instrument data volumes.",
   "routineSentFirst": true,
   "src": "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/"
  },
  "transit": {
   "simplified": true,
   "simplifiedNote": "Transit task chain (Earth -> Mars cruise). Real: the Mars 2020 cruise stage was solar-powered, and the spacecraft flew trajectory correction manoeuvres (TCMs) during cruise and approach (JPL Mars 2020 launch press kit). Everything below is a game value: okScore is the minigame quality needed for a nominal result; a degraded task costs, at landing, battery charge (okChargeFrac 0.9 vs degradedChargeFrac 0.6 of capacity), habitat O2 lost to the micrometeoroid leak (leakO2LossKg 3 ≈ 3 sols of habitat use at constants.lifeSupport.o2KgPerSol 0.92), MAV fuel spent on extra correction burns (tcmMavFuelLossPct 8; in reality TCM propellant comes from the cruise stage's own tanks, not from the ascent vehicle) and morale after a cold cruise (thermalMoraleLoss 10). scorePerTask and the time limits are game values; day and dose advance in equal chunks per task up to the orbit's transitDays.",
   "okScore": 0.75,
   "scorePerTask": 5,
   "tasks": [
    {
     "id": "arrays",
     "minigame": "align",
     "timeLimitSec": 20
    },
    {
     "id": "leak",
     "minigame": "wires",
     "timeLimitSec": 25
    },
    {
     "id": "tcm",
     "minigame": "qte",
     "timeLimitSec": 25
    },
    {
     "id": "thermal",
     "minigame": "converter",
     "timeLimitSec": 30
    }
   ],
   "effects": {
    "okChargeFrac": 0.9,
    "degradedChargeFrac": 0.6,
    "leakO2LossKg": 3,
    "tcmMavFuelLossPct": 8,
    "thermalMoraleLoss": 10
   },
   "src": "https://www.jpl.nasa.gov/news/press_kits/mars_2020/launch/mission/"
  },
  "src": "https://www.spaceappschallenge.org/"
 },
 "horizons": {
  "conjunctionOnFinalSol": true,
  "src": "https://ssd.jpl.nasa.gov/horizons/",
  "bySol": [
   {
    "sol": 1,
    "distanceMillionKm": 195.4
   },
   {
    "sol": 2,
    "distanceMillionKm": 198.1
   },
   {
    "sol": 3,
    "distanceMillionKm": 201
   },
   {
    "sol": 4,
    "distanceMillionKm": 204.2
   },
   {
    "sol": 5,
    "distanceMillionKm": 207.8
   },
   {
    "sol": 6,
    "distanceMillionKm": 211.5
   },
   {
    "sol": 7,
    "distanceMillionKm": 215.4
   },
   {
    "sol": 8,
    "distanceMillionKm": 219.6
   },
   {
    "sol": 9,
    "distanceMillionKm": 224
   },
   {
    "sol": 10,
    "distanceMillionKm": 228.5
   },
   {
    "sol": 11,
    "distanceMillionKm": 233.2
   },
   {
    "sol": 12,
    "distanceMillionKm": 238.1
   },
   {
    "sol": 13,
    "distanceMillionKm": 248.4
   },
   {
    "sol": 14,
    "distanceMillionKm": 258.4
   }
  ]
 },
 "objectives": [
  {
   "id": "forensics",
   "forensicsMultiplier": 1.35,
   "experimentsMultiplier": 0.85,
   "minSuccess": {
    "forensicsSent": 3,
    "experimentsSent": 1
   },
   "fullSuccess": {
    "forensicsSent": 4,
    "experimentsSent": 3
   },
   "src": "https://science.nasa.gov/planetary-science/"
  },
  {
   "id": "experiments",
   "forensicsMultiplier": 0.85,
   "experimentsMultiplier": 1.35,
   "minSuccess": {
    "forensicsSent": 1,
    "experimentsSent": 3
   },
   "fullSuccess": {
    "forensicsSent": 3,
    "experimentsSent": 5
   },
   "src": "https://science.nasa.gov/planetary-science/"
  },
  {
   "id": "balanced",
   "forensicsMultiplier": 1.1,
   "experimentsMultiplier": 1.1,
   "minSuccess": {
    "forensicsSent": 2,
    "experimentsSent": 2
   },
   "fullSuccess": {
    "forensicsSent": 4,
    "experimentsSent": 4
   },
   "src": "https://science.nasa.gov/planetary-science/"
  }
 ],
 "demoSuccess": {
  "minSuccess": {
   "forensicsSent": 1,
   "experimentsSent": 1
  },
  "fullSuccess": {
   "forensicsSent": 2,
   "experimentsSent": 2
  },
  "src": "https://www.spaceappschallenge.org/"
 },
 "rockets": [
  {
   "id": "falcon_heavy",
   "name": "Falcon Heavy",
   "payloadMarsKg": 1300,
   "costM": 210,
   "src": "https://public.ksc.nasa.gov/lspeducation/spacex/",
   "simplified": true,
   "simplifiedNote": "Game values scaled to the game's lander. Real: up to 16,800 kg to Mars (NASA LSP); NASA's Europa Clipper launch contract was about $178 M."
  },
  {
   "id": "vulcan_centaur",
   "name": "Vulcan Centaur",
   "payloadMarsKg": 1450,
   "costM": 260,
   "src": "https://elvperf.ksc.nasa.gov/",
   "simplified": true,
   "simplifiedNote": "Game values scaled to the game's lander; a Mars payload figure for Vulcan Centaur was not found on an official page."
  },
  {
   "id": "sls_block1b",
   "name": "SLS Block 1B",
   "payloadMarsKg": 2000,
   "costM": 470,
   "src": "https://www.nasa.gov/wp-content/uploads/2022/03/sls_reference_guide_2022_web.pdf",
   "simplified": true,
   "simplifiedNote": "Game values scaled to the game's lander. Real: Block 1B carries more than 27 t to TLI and Block 2 cargo more than 80,000 lb (36 t) to Mars (SLS Reference Guide); NASA OIG IG-22-003 puts one SLS at $2.2 B."
  }
 ],
 "orbits": [
  {
   "id": "hohmann",
   "transitDays": 259,
   "payloadPenaltyKg": 0,
   "costPenaltyM": 0,
   "mavFuelStartPct": 70,
   "src": "https://trajbrowser.arc.nasa.gov/"
  },
  {
   "id": "fast_transfer",
   "transitDays": 180,
   "payloadPenaltyKg": 180,
   "costPenaltyM": 60,
   "mavFuelStartPct": 64,
   "src": "https://trajbrowser.arc.nasa.gov/"
  }
 ],
 "landingSites": [
  {
   "id": "meridiani",
   "coords": "2.0°S, 354.5°E",
   "cosZNoon": 0.97,
   "dayMaxC": 20,
   "nightMinC": -78,
   "waterStartL": 40,
   "bg": "bg_meridiani_day",
   "palette": "amber",
   "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A"
  },
  {
   "id": "jezero",
   "coords": "18.4°N, 77.6°E",
   "cosZNoon": 0.9,
   "dayMaxC": 8,
   "nightMinC": -82,
   "waterStartL": 60,
   "bg": "bg_jezero_day",
   "palette": "rust",
   "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A"
  },
  {
   "id": "arcadia",
   "coords": "39.2°N, 188.0°E",
   "cosZNoon": 0.7,
   "dayMaxC": -12,
   "nightMinC": -95,
   "waterStartL": 90,
   "bg": "bg_arcadia_day",
   "palette": "frost",
   "src": "https://science.nasa.gov/resource/subsurface-water-ice-mapping-swim/"
  }
 ],
 "habitat": {
  "src": "https://www.nasa.gov/reference/systems-engineering-handbook/",
  "base": {
   "simplified": true,
   "simplifiedNote": "Habitat mass, cost and power loads are game values for a one-astronaut base. NASA DRA 5.0 Addendum estimates 12 kWe day and night for a crew-of-four habitat (www.nasa.gov/pdf/373667main_NASA-SP-2009-566-ADD.pdf).",
   "massKg": 760,
   "costM": 150,
   "lifeSupportW": 180,
   "commsW": 40,
   "experimentsW": 60,
   "solarAreaM2": 22,
   "solarEfficiency": 0.28,
   "o2ReserveStartKg": 14,
   "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
  },
  "powerSource": {
   "solar_only": {
    "massKg": 65,
    "costM": 45,
    "rtgW": 0,
    "rtgWasteHeatW": 0,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   },
   "solar_rtg": {
    "massKg": 110,
    "costM": 135,
    "rtgW": 110,
    "rtgWasteHeatW": 150,
    "src": "https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/"
   }
  },
  "batteries": [
   {
    "kwh": 20,
    "massKg": 85,
    "costM": 40,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   },
   {
    "kwh": 40,
    "massKg": 155,
    "costM": 80,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   },
   {
    "kwh": 60,
    "massKg": 225,
    "costM": 125,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   }
  ],
  "insulation": {
   "thin": {
    "massKg": 35,
    "costM": 25,
    "uaWPerK": 3,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   },
   "thick": {
    "massKg": 95,
    "costM": 65,
    "uaWPerK": 1.5,
    "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
   }
  },
  "comms": {
   "relay_only": {
    "massKg": 18,
    "costM": 30,
    "src": "https://eyes.nasa.gov/apps/dsn-now/"
   },
   "relay_xband": {
    "massKg": 52,
    "costM": 85,
    "src": "https://eyes.nasa.gov/apps/dsn-now/"
   }
  },
  "relayPasses": [
   {
    "id": "MRO",
    "startMinute": 620,
    "durationMin": 20,
    "capacityMbit": 24,
    "requires": null,
    "src": "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/"
   },
   {
    "id": "DTE",
    "startMinute": 750,
    "durationMin": 45,
    "capacityMbit": 35,
    "requires": "relay_xband",
    "src": "https://eyes.nasa.gov/apps/dsn-now/"
   },
   {
    "id": "MAVEN",
    "startMinute": 1000,
    "durationMin": 20,
    "capacityMbit": 21,
    "requires": null,
    "src": "https://science.nasa.gov/mission/maven/"
   }
  ],
  "repairKit": {
   "massKg": 22,
   "costM": 30,
   "max": 2,
   "src": "https://www.nasa.gov/hrp/"
  },
  "budgetMaxM": 1100,
  "massMarginGoodPct": 10,
  "greenhouse": {
   "powerW": 100,
   "freezeAmbientC": -20,
   "freezeMinutesUnpowered": 60,
   "freezeHabitatC": 2,
   "moralePerSolHealthy": 2,
   "tendMorale": 8,
   "tendWaterL": 2,
   "tendMinutes": 20,
   "germinationYieldBonusPct": 30,
   "src": "https://www.nasa.gov/missions/station/iss-research/growing-plants-in-space/"
  }
 },
 "instruments": [
  {
   "id": "mastcam_z",
   "massKg": 4,
   "powerW": 17,
   "costM": 38,
   "dataMbit": 20,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-01"
  },
  {
   "id": "meda",
   "massKg": 5.5,
   "powerW": 17,
   "costM": 34,
   "dataMbit": 1,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-02"
  },
  {
   "id": "seis",
   "massKg": 30,
   "powerW": 8,
   "costM": 48,
   "dataMbit": 5,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2018-042A-01"
  },
  {
   "id": "rad",
   "massKg": 1.6,
   "powerW": 4,
   "costM": 28,
   "dataMbit": 1,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2011-070A-07"
  },
  {
   "id": "rimfax",
   "massKg": 3,
   "powerW": 10,
   "costM": 36,
   "dataMbit": 10,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-04"
  },
  {
   "id": "supercam",
   "massKg": 11,
   "powerW": 18,
   "costM": 52,
   "dataMbit": 8,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-06"
  },
  {
   "id": "moxie",
   "massKg": 17,
   "powerW": 300,
   "costM": 68,
   "dataMbit": 2,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-07"
  },
  {
   "id": "veggie",
   "massKg": 8,
   "powerW": 100,
   "costM": 44,
   "dataMbit": 2,
   "src": "https://www.nasa.gov/missions/station/iss-research/growing-plants-in-space/"
  },
  {
   "id": "ingenuity",
   "massKg": 1.8,
   "powerW": 12,
   "costM": 42,
   "dataMbit": 15,
   "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052B"
  }
 ],
 "terrain": {
  "simplified": true,
  "simplifiedNote": "Route layout, sand pit positions, the slowdown factor, ice dig values and the drone rule (Ingenuity scouts the route around sand pits) are game values. Wrecks are not shown until the player uncovers them by digging (explore.dig). Real lesson behind the sand pits: Spirit was stuck in soft sand at Troy (NASA Spirit mission page).",
  "map": {
   "simplified": true,
   "simplifiedNote": "Compressed, fictional map (D-012, widened in the 2026-11-15 merge): base at 0 m; west, the glacier route to the ice wall (-5000 m, map edge -5350 m, terrain.westRegion); east, the lava-plain route through a dried lake bed, dunes and a crater field to a rubble-sealed lava-tube skylight (+1400 m). Distances are game values chosen for walking time and suit O2, not a real site survey. Inside the base area (-120 m .. 0 m) structures are drawn at sprite scale: -120 m maps to baseLeftPx.",
   "leftLimitM": -5350,
   "baseLeftM": -120,
   "baseLeftPx": -700,
   "baseRightM": 100,
   "landingPadM": 85,
   "landingExitM": 40,
   "tubeMouthM": 1400,
   "zones": [
    {
     "id": "ice_wall",
     "fromM": -5350,
     "toM": -5000
    },
    {
     "id": "glacier",
     "fromM": -5000,
     "toM": -2120
    },
    {
     "id": "glacier_edge",
     "fromM": -2120,
     "toM": -1300
    },
    {
     "id": "icy_plain",
     "fromM": -1300,
     "toM": -120
    },
    {
     "id": "base",
     "fromM": -120,
     "toM": 100
    },
    {
     "id": "lakebed",
     "fromM": 100,
     "toM": 500
    },
    {
     "id": "dunes",
     "fromM": 500,
     "toM": 850
    },
    {
     "id": "rocky_approach",
     "fromM": 850,
     "toM": 1150
    },
    {
     "id": "lava_plain",
     "fromM": 1150,
     "toM": 1390
    },
    {
     "id": "tube_mouth",
     "fromM": 1390,
     "toM": 1430
    }
   ],
   "src": "https://www.spaceappschallenge.org/"
  },
  "iceDepositM": -140,
  "sandPits": [
   {
    "fromM": 600,
    "toM": 680
   }
  ],
  "boulders": [
   {
    "atM": 930,
    "heightPx": 18,
    "widthPx": 16
   },
   {
    "atM": 985,
    "heightPx": 24,
    "widthPx": 20
   },
   {
    "atM": 1060,
    "heightPx": 20,
    "widthPx": 18
   }
  ],
  "sandPitSpeedFactor": 0.5,
  "droneRoutesAroundSandPits": true,
  "iceDigMinutes": 40,
  "iceDigWaterL": 6,
  "src": "https://science.nasa.gov/mission/mer-spirit/",
  "westRegion": {
   "src": "https://science.nasa.gov/mission/phoenix/",
   "note": "Phoenix found water ice just under the surface and saw frost form on the ground: the basis for an icy area.",
   "simplified": true,
   "simplifiedNote": "The western ice field, its lost cargo lander, the ice wall and every distance here are FICTIONAL game values on a compressed map, to be labelled as fiction in the game and on the project page. Distances are metres west of the airlock. The ice blocks across the glacier path, the hits needed to dig through them and the game minutes per hit are game values too. The trail signs follow what was really seen: Spirit dragged its broken right-front wheel from 2006 and left a furrow; HiRISE imaged Phoenix's parachute, backshell and heat-shield mark; Beagle 2 landed on airbags.",
   "baseEdgeM": 120,
   "endM": 5350,
   "frostStartM": 280,
   "iceFullM": 1500,
   "screenFrostFromM": 700,
   "screenFrostFullM": 2300,
   "screenFrostHeavyFromM": 2000,
   "iceWallFromM": 5000,
   "spiritTrack": {
    "fromM": 420,
    "toM": 1138,
    "dragFromM": 620
   },
   "craters": [
    {
     "atM": 1240,
     "widthPx": 34
    },
    {
     "atM": 1275,
     "widthPx": 26
    },
    {
     "atM": 1305,
     "widthPx": 44
    }
   ],
   "debrisFromM": 1320,
   "vehicleAtM": 1460,
   "iceCave": {
    "atM": 1460,
    "hitsToBreak": 6,
    "minutesPerHit": 3,
    "breakRangeM": 34,
    "src": "https://www.jpl.nasa.gov/news/steep-slopes-on-mars-reveal-structure-of-buried-ice/",
    "note": "Thick ice lies under a thin cover of rock and dust and is exposed where slopes erode.",
    "simplified": true,
    "simplifiedNote": "FICTIONAL: a walk-in cave in an ice bank has not been observed on Mars; it stands in for the buried ice exposed at scarps. The lost lander sealed inside it, the 6 hits needed to break the ice and 3 game minutes per hit are game values."
   },
   "iceVoids": [
    1560,
    2060
   ],
   "polygons": {
    "fromM": 1600,
    "toM": 2000,
    "src": "https://science.nasa.gov/mission/phoenix/",
    "note": "Phoenix landed among ice-rich polygons: patterned ground made by ice expanding and contracting."
   },
   "glacier": {
    "fromM": 2120,
    "toM": 5000,
    "src": "https://www.jpl.nasa.gov/news/steep-slopes-on-mars-reveal-structure-of-buried-ice/",
    "note": "Ice capped by a layer of ice-cemented rock and dust, exposed as blue ice at a steep scarp at its edge."
   },
   "parts": [
    {
     "id": "engine",
     "atM": 1478,
     "hiddenIn": "cave"
    },
    {
     "id": "panel",
     "atM": 2060,
     "hiddenIn": "void"
    },
    {
     "id": "wheel",
     "atM": 2200,
     "hiddenIn": "overhang"
    }
   ],
   "partRevealM": 70,
   "phoenixSigns": {
    "heatShieldAtM": 1730,
    "chuteAtM": 1765
   },
   "beagleBounces": [
    2250,
    2295,
    2330,
    2355
   ],
   "beagleOverhangM": 2380,
   "iceBarriers": [
    {
     "atM": 2150,
     "hits": 4
    },
    {
     "atM": 2560,
     "hits": 6
    },
    {
     "atM": 2950,
     "hits": 8
    }
   ],
   "blizzard": {
    "fromM": 2700,
    "fullM": 3500,
    "headwindSpeedFactor": 0.45,
    "tailwindSpeedFactor": 0.85,
    "src": "https://www.jpl.nasa.gov/news/nasa-mars-lander-sees-falling-snow-soil-data-suggest-liquid-past/",
    "note": "Phoenix's lidar saw snow falling from clouds about 4 km above its site; the snow evaporated before reaching the ground.",
    "simplified": true,
    "simplifiedNote": "FICTIONAL: a ground blizzard that slows a walker has not been observed on Mars, and the thin air could not push a person this hard. Walking west into it drops to 45% speed, east with it to 85%, both at full strength from 3500 m. Game values, to be labelled as fiction."
   },
   "finalProbe": {
    "atM": 4955,
    "hits": 5,
    "revealM": 160,
    "rangeM": 26,
    "src": "https://science.nasa.gov/missions/mars-polar-lander",
    "note": "Deep Space 2 (Amundsen and Scott): two microprobes carried by Mars Polar Lander in 1999, built to bury their forebody about 1 m into the south polar ground and look for water ice, while the aftbody stayed on the surface to relay data. All three were lost on arrival.",
    "simplified": true,
    "simplifiedNote": "FICTIONAL placement: the probes were never found; putting one here, its 5 hits to dig out and its glint are game choices."
   },
   "barrierMinutesPerHit": 3,
   "barrierRangeM": 30,
   "pickupRangeM": 14,
   "eastTrailM": 170,
   "cold": {
    "extraColdC": -35,
    "deepColdFromM": 1900,
    "deepColdBleedCPerMin": 1.2,
    "src": "https://science.nasa.gov/mission/phoenix/",
    "simplified": true,
    "simplifiedNote": "FICTIONAL game values. The ice field is up to 35 C colder than the landing site, and from 1900 m the cold pulls heat out of the suit faster than its heaters can replace (up to 1.2 C per game minute at the ice wall). Phoenix, at a high northern latitude, measured the colder conditions that inspire this, but these numbers are not its measurements."
   }
  }
 },
 "scoring": {
  "forensicCorrectPoints": 100,
  "forensicWrongWith3CluesPoints": 50,
  "forensicIncompleteCluesPoints": 20,
  "handCameraPhotoFactor": 0.5,
  "controlGroupBonusMultiplier": 1.5,
  "massMarginBonusThresholdPct": 10,
  "massMarginBonusPoints": 120,
  "survivalPerSolPoints": 25,
  "safeReturnBonusPoints": 200,
  "lostSystemPenaltyPoints": 120,
  "familyMessageMorale": 10,
  "src": "https://www.spaceappschallenge.org/"
 },
 "ufo": {
  "highResPct": 80,
  "highResRelayOnlyPct": 65,
  "lowResPct": 30,
  "note": "Viking 1 Cydonia 'Face on Mars' (1976) pareidolia olayına saygı duruşu olan kurgusal sahne.",
  "src": "https://science.nasa.gov/resource/the-face-on-mars/"
 },
 "forensics": {
  "categories": [
   "power_dust",
   "thermal",
   "mechanical",
   "software",
   "comms"
  ],
  "evidenceTypes": [
   {
    "id": "photo",
    "minigame": "fieldcam",
    "minutes": 10,
    "instrumentBonus": "mastcam_z"
   },
   {
    "id": "telemetry",
    "minigame": "wires",
    "minutes": 20,
    "instrumentBonus": null
   },
   {
    "id": "env",
    "minigame": "qte",
    "minutes": 15,
    "instrumentBonus": "supercam"
   }
  ],
  "minEvidenceForDiagnosis": 2,
  "activeCaseIds": [
   "opportunity",
   "insight",
   "spirit",
   "phoenix",
   "beagle2"
  ],
  "activeCaseNote": "All five cases are on the map and buried: east (lava-plain route) Opportunity under dust and InSight under dust; west (glacier route) Spirit in frozen soft sand, Phoenix under CO2 ice, Beagle 2 under an ice overhang. A wreck appears only after its dig site is dug out (explore.dig). Positions and burial are game fiction; the trail signs follow what NASA reported for each mission.",
  "src": "https://nssdc.gsfc.nasa.gov/nmc/",
  "cases": [
   {
    "id": "opportunity",
    "name": "MER-B Opportunity",
    "agency": "NASA / JPL",
    "lastContact": "2018-06-10 (Sol 5111)",
    "realCoords": "Meridiani Planum 2.05°S 354.47°E",
    "distanceM": 330,
    "sprite": "rover_opportunity",
    "correctCategory": "power_dust",
    "acceptedSecondary": null,
    "reportMbit": 18,
    "salvage": {
     "rhuUnits": 8
    },
    "telemetry": {
     "tau": 10.8,
     "panelW": 22,
     "coreTempC": -41
    },
    "src": "https://science.nasa.gov/mission/mer-opportunity/"
   },
   {
    "id": "insight",
    "name": "InSight Lander",
    "agency": "NASA / JPL",
    "lastContact": "2022-12-15 (Sol 1440)",
    "realCoords": "Elysium Planitia 4.50°N 135.62°E",
    "distanceM": 760,
    "sprite": "lander_insight",
    "correctCategory": "power_dust",
    "acceptedSecondary": null,
    "reportMbit": 18,
    "salvage": {
     "seis": true
    },
    "telemetry": {
     "dustCoverPct": 92,
     "whPerSol": 285,
     "maxQuakeM": 4.7
    },
    "src": "https://science.nasa.gov/mission/insight/"
   },
   {
    "id": "spirit",
    "name": "MER-A Spirit",
    "agency": "NASA / JPL",
    "lastContact": "2010-03-22 (Sol 2210)",
    "realCoords": "Gusev / Troy 14.57°S 175.47°E",
    "distanceM": -1150,
    "sprite": "rover_spirit",
    "correctCategory": "mechanical",
    "acceptedSecondary": "thermal",
    "reportMbit": 18,
    "salvage": {
     "rhuUnits": 8
    },
    "salvageChoice": {
     "note": "Engineering decision: which part is still reusable? RHUs keep giving heat for decades (Pu-238 half-life 87.7 years, constants.rhu); the right-front wheel drive actuator failed in March 2006 and was dragged for the rest of the mission; the solar arrays were dust-covered and could not keep the rover warm in its last winter.",
     "options": [
      {
       "id": "rhu",
       "reusable": true,
       "src": "https://science.nasa.gov/mission/mer-spirit/"
      },
      {
       "id": "wheel",
       "reusable": false,
       "src": "https://www.jpl.nasa.gov/news/right-front-wheel-rotations/"
      },
      {
       "id": "solar",
       "reusable": false,
       "src": "https://www.jpl.nasa.gov/news/nasas-spirit-rover-completes-mission-on-mars/"
      }
     ],
     "wrongPickMinutes": 20
    },
    "telemetry": {
     "wheelSlipPct": 98,
     "tiltDeg": -11.5,
     "heaterTempC": -55
    },
    "src": "https://science.nasa.gov/mission/mer-spirit/"
   },
   {
    "id": "phoenix",
    "name": "Phoenix Lander",
    "agency": "NASA / UArizona",
    "lastContact": "2008-11-02 (Sol 157)",
    "realCoords": "Vastitas Borealis 68.22°N 234.25°E",
    "distanceM": -1800,
    "sprite": "lander_phoenix",
    "correctCategory": "thermal",
    "acceptedSecondary": "mechanical",
    "reportMbit": 20,
    "salvage": {
     "roboticArmPart": true
    },
    "telemetry": {
     "co2IceKg": 140,
     "panelBusV": 0,
     "ambientC": -96
    },
    "src": "https://science.nasa.gov/mission/phoenix/"
   },
   {
    "id": "beagle2",
    "name": "Beagle 2 (Bonus)",
    "agency": "ESA / UK",
    "lastContact": "2003-12-25 (MRO HiRISE 2015)",
    "realCoords": "Isidis Planitia 11.53°N 90.43°E",
    "distanceM": -2380,
    "sprite": "lander_beagle2",
    "correctCategory": "comms",
    "acceptedSecondary": "mechanical",
    "reportMbit": 22,
    "bonus": true,
    "salvage": {
     "spareAntenna": true
    },
    "telemetry": {
     "petalsDeployed": "2/4",
     "uhfBlocked": true,
     "rfDb": 0
    },
    "src": "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Beagle-2_lander_found_on_Mars"
   }
  ]
 },
 "experimentsCfg": {
  "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  "controlGroupExtraMinutes": 15,
  "controlGroupExtraKwh": 1,
  "experiments": [
   {
    "id": "pendulum_gravity",
    "order": 1,
    "requiredInstrument": null,
    "preferredEnv": "habitat",
    "minutes": 30,
    "energyKwh": 0.5,
    "dataMbit": 8,
    "basePoints": 80,
    "hypotheses": [
     "slower_163",
     "faster",
     "same"
    ],
    "correctHypothesis": "slower_163",
    "marsValue": 3.25,
    "earthValue": 2.01,
    "unit": "s",
    "minigame": "qte",
    "reward": {
     "sandPitSpeedFactor": 0.8
    },
    "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
   },
   {
    "id": "free_fall",
    "order": 2,
    "requiredInstrument": null,
    "preferredEnv": "surface",
    "minutes": 25,
    "energyKwh": 0.5,
    "dataMbit": 8,
    "basePoints": 80,
    "hypotheses": [
     "fall_104",
     "fall_064",
     "fall_260"
    ],
    "correctHypothesis": "fall_104",
    "marsValue": 1.04,
    "earthValue": 0.64,
    "unit": "s",
    "minigame": "qte",
    "reward": {
     "evaO2Factor": 0.9
    },
    "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
   },
   {
    "id": "seed_germination",
    "order": 3,
    "requiredInstrument": "veggie",
    "bonusInstrument": "supercam",
    "preferredEnv": "habitat",
    "minutes": 60,
    "energyKwh": 2,
    "dataMbit": 14,
    "basePoints": 120,
    "hypotheses": [
     "washed_pressurized",
     "raw_regolith",
     "open_air"
    ],
    "correctHypothesis": "washed_pressurized",
    "marsValue": 84,
    "earthValue": 95,
    "unit": "%",
    "minigame": "converter",
    "minigameTheme": "perchlorate",
    "reward": {
     "greenhouseYield": true
    },
    "src": "https://science.nasa.gov/resource/phoenix-finds-perchlorate/"
   },
   {
    "id": "water_boiling",
    "order": 4,
    "requiredInstrument": "meda",
    "preferredEnv": "surface",
    "minutes": 30,
    "energyKwh": 1,
    "dataMbit": 12,
    "basePoints": 110,
    "hypotheses": [
     "boil_and_freeze",
     "stays_liquid",
     "turns_acid"
    ],
    "correctHypothesis": "boil_and_freeze",
    "marsValue": 0.61,
    "earthValue": 101.3,
    "unit": "kPa",
    "minigame": "align",
    "reward": {
     "waterSaver": true
    },
    "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
   },
   {
    "id": "sound_speed",
    "order": 5,
    "requiredInstrument": "supercam",
    "preferredEnv": "surface",
    "minutes": 25,
    "energyKwh": 0.5,
    "dataMbit": 12,
    "basePoints": 110,
    "hypotheses": [
     "slower_240",
     "faster_480",
     "no_sound"
    ],
    "correctHypothesis": "slower_240",
    "marsValue": 240,
    "earthValue": 343,
    "unit": "m/s",
    "minigame": "align",
    "reward": {
     "acousticDiagnostics": true
    },
    "src": "https://science.nasa.gov/resource/nasas-perseverance-rover-captures-sounds-of-mars/"
   },
   {
    "id": "moxie_night",
    "order": 6,
    "requiredInstrument": "moxie",
    "preferredEnv": "surface",
    "minutes": 60,
    "energyKwh": 3,
    "dataMbit": 14,
    "basePoints": 120,
    "hypotheses": [
     "night_better",
     "day_only",
     "constant"
    ],
    "correctHypothesis": "night_better",
    "marsValue": 10,
    "earthValue": 6,
    "unit": "g/h",
    "minigame": "converter",
    "minigameTheme": "moxie",
    "reward": {
     "moxieBoostPct": 20
    },
    "src": "https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/"
   }
  ]
 },
 "events": {
  "src": "https://science.nasa.gov/mars/",
  "schedule": {
   "full": [
    {
     "sol": 2,
     "minute": 720,
     "id": "radiator_fault"
    },
    {
     "sol": 3,
     "minute": 660,
     "id": "dust_devil"
    },
    {
     "sol": 4,
     "minute": 900,
     "id": "perchlorate_dust"
    },
    {
     "sol": 5,
     "minute": 630,
     "id": "suit_leak"
    },
    {
     "sol": 6,
     "minute": 540,
     "id": "dust_storm"
    },
    {
     "sol": 7,
     "minute": 780,
     "id": "marsquake"
    },
    {
     "sol": 8,
     "minute": 1260,
     "id": "battery_cell_fault"
    },
    {
     "sol": 9,
     "minute": 600,
     "id": "software_amnesia"
    },
    {
     "sol": 10,
     "minute": 720,
     "id": "solar_flare"
    },
    {
     "sol": 11,
     "minute": 420,
     "id": "frozen_valve"
    },
    {
     "sol": 12,
     "minute": 840,
     "id": "data_congestion"
    },
    {
     "sol": 13,
     "minute": 660,
     "id": "dust_devil"
    }
   ],
   "demo": [
    {
     "sol": 2,
     "minute": 600,
     "id": "joint_freeze"
    },
    {
     "sol": 3,
     "minute": 540,
     "id": "dust_storm"
    },
    {
     "sol": 4,
     "minute": 840,
     "id": "perchlorate_dust"
    }
   ]
  },
  "stormDurationSols": {
   "full": 3,
   "demo": 1
  },
  "crises": [
   {
    "id": "joint_freeze",
    "fx": "frost",
    "icon": "❄",
    "outsideOnly": true,
    "onTrigger": {
     "forceFreeze": true
    },
    "options": [
     {
      "id": "A",
      "icon": "🚶",
      "effects": {},
      "score": -10
     },
     {
      "id": "B",
      "icon": "♨",
      "effects": {
       "suitBattery": -30,
       "unfreeze": true
      },
      "score": 20
     },
     {
      "id": "C",
      "icon": "☢",
      "requires": {
       "inventory": "rhuUnits"
      },
      "effects": {
       "rhuUnits": -1,
       "unfreeze": true
      },
      "score": 35
     }
    ]
   },
   {
    "id": "dust_storm",
    "fx": "storm",
    "icon": "🌪",
    "warnInstrument": "meda",
    "preSignalKey": "hud.alert_storm_soon",
    "onTrigger": {
     "startStorm": true
    },
    "options": [
     {
      "id": "A",
      "icon": "⚡",
      "effects": {
       "disableLoad": "moxie"
      },
      "score": 20
     },
     {
      "id": "B",
      "icon": "📡",
      "effects": {
       "disableLoad": "experiments",
       "dataLossMbit": 15
      },
      "score": 15
     },
     {
      "id": "C",
      "icon": "🧹",
      "effects": {
       "panelDust": -0.3,
       "minutes": 40,
       "morale": -5
      },
      "score": 10,
      "alts": [
       {
        "when": {
         "instrument": "meda"
        },
        "effects": {
         "panelDust": -0.3,
         "energyKwh": 6,
         "minutes": 40
        },
        "score": 30,
        "resultKey": "crisis.dust_storm.C.res_meda"
       }
      ]
     }
    ]
   },
   {
    "id": "radiator_fault",
    "fx": "heat",
    "icon": "🌡",
    "options": [
     {
      "id": "A",
      "icon": "🧑‍🚀",
      "effects": {
       "minutes": 45,
       "suitO2": -10
      },
      "score": 25
     },
     {
      "id": "B",
      "icon": "⚙",
      "effects": {
       "disableLoad": "moxie",
       "energyKwh": -2
      },
      "score": 10
     },
     {
      "id": "C",
      "icon": "🎙",
      "effects": {
       "minutes": 90,
       "morale": -6
      },
      "score": 5,
      "alts": [
       {
        "when": {
         "reward": "acousticDiagnostics"
        },
        "effects": {
         "minutes": 15
        },
        "score": 40,
        "resultKey": "crisis.radiator_fault.C.res_acoustic"
       }
      ]
     }
    ]
   },
   {
    "id": "marsquake",
    "fx": "quake",
    "icon": "〰",
    "warnInstrument": "seis",
    "options": [
     {
      "id": "A",
      "icon": "📦",
      "effects": {
       "morale": -6
      },
      "score": 10
     },
     {
      "id": "B",
      "icon": "🧪",
      "effects": {
       "o2ReserveKg": -0.6
      },
      "score": 5
     },
     {
      "id": "C",
      "icon": "📈",
      "effects": {
       "o2ReserveKg": -0.8,
       "morale": -8
      },
      "score": -20,
      "alts": [
       {
        "when": {
         "instrument": "seis"
        },
        "effects": {},
        "score": 45,
        "resultKey": "crisis.marsquake.C.res_seis"
       },
       {
        "when": {
         "inventory": "repairKits"
        },
        "effects": {
         "repairKits": -1
        },
        "score": 25,
        "resultKey": "crisis.marsquake.C.res_kit"
       }
      ]
     }
    ]
   },
   {
    "id": "frozen_valve",
    "fx": "frost",
    "icon": "🧊",
    "options": [
     {
      "id": "A",
      "icon": "🔋",
      "effects": {
       "energyKwh": -6
      },
      "score": 10
     },
     {
      "id": "B",
      "icon": "🌙",
      "effects": {
       "minutes": 50,
       "suitO2": -15,
       "radiationMsv": 0.5
      },
      "score": 15
     },
     {
      "id": "C",
      "icon": "🔧",
      "effects": {
       "energyKwh": -10,
       "mavFuel": -4
      },
      "score": -15,
      "alts": [
       {
        "when": {
         "inventory": "rhuUnits"
        },
        "effects": {
         "rhuUnits": -1
        },
        "score": 40,
        "resultKey": "crisis.frozen_valve.C.res_rhu"
       },
       {
        "when": {
         "inventory": "repairKits"
        },
        "effects": {
         "repairKits": -1
        },
        "score": 30,
        "resultKey": "crisis.frozen_valve.C.res_kit"
       }
      ]
     }
    ]
   },
   {
    "id": "solar_flare",
    "fx": "flare",
    "icon": "☀",
    "warnInstrument": "rad",
    "options": [
     {
      "id": "A",
      "icon": "🛡",
      "effects": {
       "minutes": 180,
       "radiationMsv": 3
      },
      "score": 30
     },
     {
      "id": "B",
      "icon": "⚠",
      "effects": {
       "radiationMsv": 45,
       "morale": -10
      },
      "score": -30
     },
     {
      "id": "C",
      "icon": "🚁",
      "effects": {
       "minutes": 120,
       "radiationMsv": 12,
       "energyKwh": -3
      },
      "score": 10,
      "alts": [
       {
        "when": {
         "instrument": "rad"
        },
        "effects": {
         "minutes": 60,
         "radiationMsv": 1
        },
        "score": 40,
        "resultKey": "crisis.solar_flare.C.res_rad"
       }
      ]
     }
    ]
   },
   {
    "id": "data_congestion",
    "fx": "none",
    "icon": "📶",
    "options": [
     {
      "id": "A",
      "icon": "📄",
      "effects": {
       "morale": -5,
       "prioritize": "forensic"
      },
      "score": 20
     },
     {
      "id": "B",
      "icon": "📡",
      "requires": {
       "comm": "relay_xband"
      },
      "effects": {
       "energyKwh": -4,
       "extraBandwidthMbit": 20
      },
      "score": 30
     },
     {
      "id": "C",
      "icon": "💌",
      "effects": {
       "morale": 20,
       "dataLossMbit": 15
      },
      "score": 10
     }
    ]
   },
   {
    "id": "dust_devil",
    "fx": "dust_devil",
    "icon": "🌀",
    "bonus": true,
    "options": [
     {
      "id": "A",
      "icon": "☀",
      "effects": {
       "panelDust": -1,
       "energyKwh": 8,
       "morale": 6
      },
      "score": 40
     },
     {
      "id": "B",
      "icon": "📷",
      "effects": {
       "panelDust": -0.5,
       "bonusPhoto": true
      },
      "score": 30
     }
    ]
   },
   {
    "id": "perchlorate_dust",
    "fx": "toxic",
    "icon": "☣",
    "options": [
     {
      "id": "A",
      "icon": "💧",
      "effects": {
       "waterL": -6,
       "energyKwh": -2
      },
      "score": 25,
      "alts": [
       {
        "when": {
         "instrument": "supercam"
        },
        "effects": {
         "waterL": -3,
         "energyKwh": -1
        },
        "score": 35,
        "resultKey": "crisis.perchlorate_dust.A.res_supercam"
       }
      ]
     },
     {
      "id": "B",
      "icon": "🌬",
      "effects": {
       "o2ReserveKg": -0.5
      },
      "score": 10,
      "alts": [
       {
        "when": {
         "instrument": "moxie"
        },
        "effects": {
         "o2ReserveKg": -0.5,
         "morale": 2
        },
        "score": 20,
        "resultKey": "crisis.perchlorate_dust.B.res_moxie"
       }
      ]
     },
     {
      "id": "C",
      "icon": "🌀",
      "effects": {
       "energyKwh": -5,
       "morale": -10
      },
      "score": 5
     }
    ]
   },
   {
    "id": "suit_leak",
    "fx": "leak",
    "icon": "💨",
    "outsideOnly": true,
    "onTrigger": {
     "suitLeak": true,
     "suitIntegrity": -35
    },
    "options": [
     {
      "id": "A",
      "icon": "🩹",
      "minigame": "qte",
      "effects": {
       "suitO2": -8,
       "suitLeak": false
      },
      "score": 15,
      "alts": [
       {
        "when": {
         "minigameMin": 0.9
        },
        "effects": {
         "suitO2": -3,
         "suitLeak": false
        },
        "score": 35,
        "resultKey": "crisis.suit_leak.A.res_good"
       }
      ]
     },
     {
      "id": "B",
      "icon": "🏠",
      "effects": {},
      "score": 0
     },
     {
      "id": "C",
      "icon": "🔧",
      "requires": {
       "inventory": "repairKits"
      },
      "effects": {
       "repairKits": -1,
       "suitLeak": false,
       "suitIntegrity": 25
      },
      "score": 30
     }
    ]
   },
   {
    "id": "software_amnesia",
    "fx": "glitch",
    "icon": "💾",
    "options": [
     {
      "id": "A",
      "icon": "🔌",
      "minigame": "wires",
      "effects": {
       "energyKwh": -3,
       "dataLossMbit": 10
      },
      "score": 15,
      "alts": [
       {
        "when": {
         "minigameMin": 0.9
        },
        "effects": {
         "energyKwh": -1
        },
        "score": 40,
        "resultKey": "crisis.software_amnesia.A.res_good"
       }
      ]
     },
     {
      "id": "B",
      "icon": "🌍",
      "effects": {
       "morale": -6,
       "dataLossMbit": 999,
       "minutes": 60
      },
      "score": 10
     },
     {
      "id": "C",
      "icon": "🗑",
      "effects": {
       "wipeQueue": true
      },
      "score": -10
     }
    ]
   },
   {
    "id": "battery_cell_fault",
    "fx": "none",
    "icon": "🔋",
    "options": [
     {
      "id": "A",
      "icon": "✂",
      "effects": {
       "batteryCapacityPct": -15
      },
      "score": 5
     },
     {
      "id": "B",
      "icon": "♨",
      "effects": {
       "energyKwh": -4
      },
      "score": 15
     },
     {
      "id": "C",
      "icon": "🔧",
      "requires": {
       "inventory": "repairKits"
      },
      "effects": {
       "repairKits": -1
      },
      "score": 30
     }
    ]
   }
  ]
 },
 "explore": {
  "simplified": true,
  "simplifiedNote": "Exploration content (D-012, extended in the 2026-11-15 merge): the west glacier route (ice clusters, frozen wrecks, the cargo lander and the Deep Space 2 probe) and the east lava-plain route (dig sites, the sealed skylight, the lava-tube sub-map). Positions, minutes, hit counts, points and rewards are game values for pacing, not measurements. The lava tube, the cargo lander and the SCOUT-1 rover are fictional: known Mars skylights/possible caves are on Arsia Mons (Tharsis), not at the landing sites in this game.",
  "src": "https://www.spaceappschallenge.org/",
  "ice": {
   "interactRangeM": 18,
   "inspectMin": 5,
   "breakMin": 10,
   "photoMin": 5,
   "collectMin": 10,
   "sampleMin": 10,
   "sampleWaterL": 4,
   "photoNoCameraFactor": 0.5,
   "clusters": [
    {
     "id": "ice_1",
     "atM": -520,
     "size": 1,
     "hint": "none",
     "relic": null
    },
    {
     "id": "ice_2",
     "atM": -980,
     "size": 2,
     "hint": "glint",
     "relic": "cable"
    },
    {
     "id": "ice_3",
     "atM": -2470,
     "size": 2,
     "hint": "none",
     "relic": null
    },
    {
     "id": "ice_4",
     "atM": -3300,
     "size": 3,
     "hint": "silhouette",
     "relic": "datalog"
    }
   ],
   "relics": [
    {
     "id": "cable",
     "reportMbit": 8,
     "points": 70,
     "reward": {
      "repairKits": 1
     }
    },
    {
     "id": "datalog",
     "reportMbit": 12,
     "points": 90,
     "reward": {
      "extraMbit": 10
     }
    }
   ]
  },
  "cave": {
   "scaleNote": "The tube uses the surface scale (gameplay.metersPerPixel), so walking speed, jumping and the metres-per-game-minute rule are identical inside and outside.",
   "lengthM": 820,
   "ladderM": 12,
   "relayM": 44,
   "interactRangeM": 22,
   "reportMbit": 24,
   "pointsPerItem": 25,
   "pointsBase": 30,
   "finds": [
    {
     "id": "crack",
     "atM": 170,
     "minutes": 10
    },
    {
     "id": "basalt",
     "atM": 320,
     "minutes": 15
    },
    {
     "id": "room",
     "atM": 470,
     "minutes": 5
    }
   ],
   "studies": [
    {
     "id": "temp",
     "atM": 530,
     "minutes": 10
    },
    {
     "id": "distance",
     "atM": 590,
     "minutes": 10
    },
    {
     "id": "vibration",
     "atM": 650,
     "minutes": 15
    }
   ],
   "roomSpanM": 34,
   "roomSpanNote": "Fictional chamber width (game value). Real Arsia Mons skylight openings are about 100-225 m across.",
   "skylight": {
    "tempSwingFraction": 0.333,
    "note": "Mars Odyssey THEMIS: from day to night the Arsia Mons skylight's temperature changes only about one third as much as the surrounding surface. Game model (simplified): deep reading = diurnal mean + (current surface - mean) x this fraction.",
    "src": "https://science.nasa.gov/photojournal/temperature-behavior-of-possible-cave-skylight-on-mars"
   },
   "vibrationPoints": [
    {
     "id": "wall",
     "amplitude": 0.42
    },
    {
     "id": "floor",
     "amplitude": 0.47
    },
    {
     "id": "ceiling",
     "amplitude": 0.71
    }
   ],
   "vibrationNote": "Synthetic, relative amplitudes (no unit) for an interpretation exercise: one point rings differently, which needs more data; it never proves the chamber is safe.",
   "scout": {
    "fiction": true,
    "note": "SCOUT-1 (TR: IZCI-1) is a fictional rover, not one of the real missions (K3 Medine prototype). Its five parts tell why a rover sent into a cave fails: rock blocks the radio link and no sunlight reaches the solar panel.",
    "minutes": 5,
    "parts": [
     {
      "id": "wheel",
      "atM": 95
     },
     {
      "id": "panel",
      "atM": 245
     },
     {
      "id": "mast",
      "atM": 395
     },
     {
      "id": "antenna",
      "atM": 705
     },
     {
      "id": "body",
      "atM": 770
     }
    ]
   }
  },
  "dig": {
   "note": "Buried wrecks and the sealed skylight. A site with \"case\" sits at that case's distanceM; mounds without a reward are decoys that teach the suit scanner (it only reacts near something real). Every hit costs game minutes, so suit O2, battery and cold keep running while digging.",
   "interactRangeM": 16,
   "reactRangeM": 30,
   "rimfaxRangeM": 140,
   "sites": [
    {
     "id": "mound_e1",
     "atM": 205,
     "kind": "dust",
     "hits": 2,
     "minutesPerHit": 4
    },
    {
     "id": "opportunity",
     "case": "opportunity",
     "kind": "dust",
     "hits": 4,
     "minutesPerHit": 4
    },
    {
     "id": "mound_e2",
     "atM": 545,
     "kind": "sand",
     "hits": 2,
     "minutesPerHit": 4
    },
    {
     "id": "insight",
     "case": "insight",
     "kind": "dust",
     "hits": 4,
     "minutesPerHit": 4
    },
    {
     "id": "skylight",
     "atM": 1400,
     "kind": "rubble",
     "hits": 6,
     "minutesPerHit": 5,
     "opens": "tube"
    },
    {
     "id": "spirit",
     "case": "spirit",
     "kind": "frost",
     "hits": 4,
     "minutesPerHit": 4
    },
    {
     "id": "phoenix",
     "case": "phoenix",
     "kind": "ice",
     "hits": 5,
     "minutesPerHit": 4
    },
    {
     "id": "beagle2",
     "case": "beagle2",
     "kind": "overhang",
     "hits": 5,
     "minutesPerHit": 4
    }
   ]
  },
  "westFinds": {
   "note": "Reports for the fictional cargo lander (its three parts) and the Deep Space 2 probe, filed on entering the habitat like the ice relics.",
   "landerReportMbit": 14,
   "landerPointsPerPart": 30,
   "probeReportMbit": 10,
   "probePoints": 80,
   "pickMinutes": 5
  },
  "fieldCam": {
   "note": "FIELD CAM photo minigame (K3 Medine): turn the focus ring until the subject is sharp, hold it, then shoot. Game values.",
   "seconds": 40,
   "tolerance": 0.04,
   "holdSeconds": 0.35,
   "focusSpeed": 0.45,
   "blurEase": 2.2,
   "albumSize": 12
  }
 }
};
