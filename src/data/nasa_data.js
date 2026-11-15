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
  "solStartMinute": 360,
  "sunriseMinute": 360,
  "sunsetStartMinute": 1080,
  "nightStartMinute": 1140,
  "metersPerPixel": 1.2,
  "spritePxPerMeter": 30,
  "earthJumpHeightM": 0.5,
  "interiorWalkPxPerSecond": 105,
  "maxEvaRangeM": 600,
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
   "cleanPanelsMin": 30,
   "salvageMin": 30,
   "diagnoseMin": 10,
   "sleepMorale": 6
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
  "map": {
   "simplified": true,
   "simplifiedNote": "Compressed, fictional map (D-012): base at 0 m, ice route to the left (-450 m), wreck route to the right ending at a lava-tube skylight (+600 m). Distances are game values chosen for walking time and suit O2, not a real site survey. Inside the base area (-120 m .. 0 m) structures are drawn at sprite scale: -120 m maps to baseLeftPx.",
   "leftLimitM": -450,
   "baseLeftM": -120,
   "baseLeftPx": -700,
   "baseRightM": 100,
   "landingPadM": 85,
   "landingExitM": 40,
   "tubeMouthM": 600,
   "zones": [
    {
     "id": "glacier_edge",
     "fromM": -450,
     "toM": -300
    },
    {
     "id": "icy_plain",
     "fromM": -300,
     "toM": -120
    },
    {
     "id": "base",
     "fromM": -120,
     "toM": 100
    },
    {
     "id": "first_wreck",
     "fromM": 100,
     "toM": 250
    },
    {
     "id": "wreck_field",
     "fromM": 250,
     "toM": 450
    },
    {
     "id": "rocky_approach",
     "fromM": 450,
     "toM": 590
    },
    {
     "id": "tube_mouth",
     "fromM": 590,
     "toM": 610
    }
   ],
   "src": "https://www.spaceappschallenge.org/"
  },
  "iceDepositM": -140,
  "sandPits": [
   {
    "fromM": 470,
    "toM": 510
   }
  ],
  "boulders": [
   {
    "atM": 530,
    "heightPx": 18,
    "widthPx": 16
   },
   {
    "atM": 565,
    "heightPx": 24,
    "widthPx": 20
   }
  ],
  "sandPitSpeedFactor": 0.5,
  "droneRevealAllWrecks": true,
  "wreckVisibleWithoutDroneM": 160,
  "iceDigMinutes": 40,
  "iceDigWaterL": 6,
  "src": "https://science.nasa.gov/mission/mer-spirit/"
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
    "minigame": "align",
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
   "spirit"
  ],
  "activeCaseNote": "D-012: the compressed map shows two wrecks on the right route (First Wreck, Wreck Field). The other cases stay in the data but are not placed on the map.",
  "src": "https://nssdc.gsfc.nasa.gov/nmc/",
  "cases": [
   {
    "id": "opportunity",
    "name": "MER-B Opportunity",
    "agency": "NASA / JPL",
    "lastContact": "2018-06-10 (Sol 5111)",
    "realCoords": "Meridiani Planum 2.05°S 354.47°E",
    "distanceM": 230,
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
    "distanceM": 640,
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
    "distanceM": 360,
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
    "distanceM": 1160,
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
    "distanceM": 1450,
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
  "simplifiedNote": "D-012 exploration content (left ice route, lava-tube sub-map). Positions, minutes, points and rewards are game values for pacing, not measurements. The lava tube is fictional: known Mars skylights/possible caves are on Arsia Mons (Tharsis), not at the landing sites in this game.",
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
     "atM": -170,
     "size": 1,
     "hint": "none",
     "relic": null
    },
    {
     "id": "ice_2",
     "atM": -255,
     "size": 2,
     "hint": "glint",
     "relic": "cable"
    },
    {
     "id": "ice_3",
     "atM": -345,
     "size": 2,
     "hint": "none",
     "relic": null
    },
    {
     "id": "ice_4",
     "atM": -420,
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
   "lengthM": 720,
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
   "vibrationNote": "Synthetic, relative amplitudes (no unit) for an interpretation exercise: one point rings differently, which needs more data; it never proves the chamber is safe."
  }
 }
};
