(function() {
// --- MODULE: src/core/nasa_data.js ---
// Auto-synced from data/nasa_data.json
const nasaData = {
  "meta": {
    "project": "SOL 14: RED HORIZON",
    "version": "2.0.0",
    "verifiedBy": "K1 & K5",
    "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
  },
  "constants": {
    "marsGravityMs2": {
      "value": 3.71,
      "unit": "m/s^2",
      "earthValue": 9.80665,
      "ratioToEarth": 0.378,
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    "solarIrradianceMarsWm2": {
      "mean": 590,
      "perihelion": 715,
      "aphelion": 492,
      "earthMean": 1361,
      "unit": "W/m^2",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    "surfacePressureKpa": {
      "value": 0.636,
      "earthValue": 101.325,
      "triplePointWaterKpa": 0.61165,
      "co2FractionPct": 95.32,
      "unit": "kPa",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    "temperatureC": {
      "globalMean": -63,
      "equatorDayMax": 20,
      "equatorNightMin": -80,
      "midLatNightMin": -95,
      "diurnalSwingMin": 70,
      "diurnalSwingMax": 100,
      "suitCriticalMin": -15,
      "unit": "°C",
      "src": "https://mars.nasa.gov/all-about-mars/facts/"
    },
    "speedOfLightKms": {
      "value": 299792.458,
      "unit": "km/s",
      "src": "https://ssd.jpl.nasa.gov/horizons/"
    },
    "speedOfSoundMarsMs": {
      "lowFreq": 240,
      "highFreq": 250,
      "earthValue": 343,
      "unit": "m/s",
      "src": "https://mars.nasa.gov/news/9158/nasa-perseverance-microphone-captures-sounds-of-mars/"
    },
    "radiation": {
      "surfaceDailyMsv": 0.67,
      "transitDailyMsv": 1.84,
      "spePeakPerHourMsv": 15.0,
      "missionLimitMsv": 150.0,
      "unit": "mSv",
      "src": "https://mars.nasa.gov/msl/spacecraft/instruments/rad/"
    },
    "solDurationHours": {
      "value": 24.6597,
      "formatted": "24h 39m 35s",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    "synodicPeriodMonths": {
      "value": 26,
      "missedWindowCostM": 140,
      "src": "https://trajbrowser.arc.nasa.gov/"
    },
    "humanLifeSupport": {
      "o2KgPerSol": 0.84,
      "waterLitersPerSol": 4.5,
      "evaNormalSpeedMPerMin": 45,
      "evaFrozenSpeedFactor": 0.4,
      "evaBaseO2PctPer100m": 2.4,
      "pointOfNoReturnSafetyFactor": 1.2,
      "src": "https://www.nasa.gov/hrp/"
    }
  },
  "horizonsDistanceTable": {
    "src": "https://ssd.jpl.nasa.gov/horizons/",
    "bySol": [
      { "sol": 1, "distanceMillionKm": 195.4, "oneWayLightSec": 652 },
      { "sol": 2, "distanceMillionKm": 198.1, "oneWayLightSec": 661 },
      { "sol": 3, "distanceMillionKm": 201.0, "oneWayLightSec": 670 },
      { "sol": 4, "distanceMillionKm": 204.2, "oneWayLightSec": 681 },
      { "sol": 5, "distanceMillionKm": 207.8, "oneWayLightSec": 693 },
      { "sol": 6, "distanceMillionKm": 211.5, "oneWayLightSec": 705 },
      { "sol": 7, "distanceMillionKm": 215.4, "oneWayLightSec": 718 },
      { "sol": 8, "distanceMillionKm": 219.6, "oneWayLightSec": 732 },
      { "sol": 9, "distanceMillionKm": 224.0, "oneWayLightSec": 747 },
      { "sol": 10, "distanceMillionKm": 228.5, "oneWayLightSec": 762 },
      { "sol": 11, "distanceMillionKm": 233.2, "oneWayLightSec": 778 },
      { "sol": 12, "distanceMillionKm": 238.1, "oneWayLightSec": 794 },
      { "sol": 13, "distanceMillionKm": 248.4, "oneWayLightSec": 828, "conjunctionWarning": true },
      { "sol": 14, "distanceMillionKm": 258.4, "oneWayLightSec": 862, "solarConjunction": true }
    ]
  },
  "objectives": [
    {
      "id": "forensics",
      "forensicsMultiplier": 1.35,
      "experimentsMultiplier": 0.85,
      "minSuccess": { "forensicsSent": 3, "experimentsSent": 1 },
      "fullSuccess": { "forensicsSent": 4, "experimentsSent": 3 },
      "src": "https://nssdc.gsfc.nasa.gov/nmc/"
    },
    {
      "id": "experiments",
      "forensicsMultiplier": 0.85,
      "experimentsMultiplier": 1.35,
      "minSuccess": { "forensicsSent": 1, "experimentsSent": 3 },
      "fullSuccess": { "forensicsSent": 3, "experimentsSent": 5 },
      "src": "https://nssdc.gsfc.nasa.gov/nmc/"
    },
    {
      "id": "balanced",
      "forensicsMultiplier": 1.1,
      "experimentsMultiplier": 1.1,
      "minSuccess": { "forensicsSent": 2, "experimentsSent": 2 },
      "fullSuccess": { "forensicsSent": 4, "experimentsSent": 4 },
      "src": "https://nssdc.gsfc.nasa.gov/nmc/"
    }
  ],
  "rockets": [
    {
      "id": "atlas_v_551",
      "name": "Atlas V 551 / Medium Lift",
      "payloadMarsKg": 1150,
      "costM": 260,
      "ispSec": 348,
      "baseWetMassKg": 5800,
      "baseDryMassKg": 1450,
      "src": "https://elvperf.ksc.nasa.gov/"
    },
    {
      "id": "vulcan_centaur",
      "name": "Vulcan Centaur / Heavy Lift",
      "payloadMarsKg": 1450,
      "costM": 340,
      "ispSec": 365,
      "baseWetMassKg": 7400,
      "baseDryMassKg": 1750,
      "src": "https://elvperf.ksc.nasa.gov/"
    },
    {
      "id": "sls_block1b",
      "name": "Falcon Heavy / SLS Deep Space",
      "payloadMarsKg": 1800,
      "costM": 460,
      "ispSec": 380,
      "baseWetMassKg": 9600,
      "baseDryMassKg": 2150,
      "src": "https://elvperf.ksc.nasa.gov/"
    }
  ],
  "orbits": [
    {
      "id": "hohmann",
      "transitMonths": 8.2,
      "deltaVRequiredMs": 3950,
      "payloadPenaltyKg": 0,
      "costPenaltyM": 0,
      "transitRadiationMsv": 28,
      "initialSuppliesBonusPct": 0,
      "src": "https://trajbrowser.arc.nasa.gov/"
    },
    {
      "id": "fast_transfer",
      "transitMonths": 5.8,
      "deltaVRequiredMs": 5120,
      "payloadPenaltyKg": 180,
      "costPenaltyM": 75,
      "transitRadiationMsv": 14,
      "initialSuppliesBonusPct": 15,
      "src": "https://trajbrowser.arc.nasa.gov/"
    }
  ],
  "landingSites": [
    {
      "id": "meridiani",
      "coords": "2.0°S, 354.5°E",
      "cosZ": 0.94,
      "dayTempC": 18,
      "nightTempC": -76,
      "iceAccessibility": 0.35,
      "wreckDistanceMultiplier": 1.05,
      "bgAsset": "assets/backgrounds/bg_meridiani_day.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A"
    },
    {
      "id": "jezero",
      "coords": "18.38°N, 77.58°E",
      "cosZ": 0.85,
      "dayTempC": 8,
      "nightTempC": -82,
      "iceAccessibility": 0.65,
      "wreckDistanceMultiplier": 0.85,
      "bgAsset": "assets/backgrounds/bg_jezero_day.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052A"
    },
    {
      "id": "arcadia",
      "coords": "39.2°N, 188.0°E",
      "cosZ": 0.68,
      "dayTempC": -12,
      "nightTempC": -94,
      "iceAccessibility": 1.0,
      "wreckDistanceMultiplier": 1.15,
      "bgAsset": "assets/backgrounds/bg_arcadia_day.png",
      "src": "https://mars.nasa.gov/resources/22460/subsurface-water-ice-map-of-mars/"
    }
  ],
  "habitatOptions": {
    "baseHabitat": {
      "massKg": 760,
      "costM": 210,
      "basePowerConsW": 220,
      "solarAreaM2": 22,
      "solarEfficiency": 0.28,
      "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
    },
    "powerSource": {
      "solar_only": {
        "massKg": 65,
        "costM": 45,
        "rtgContinuousW": 0,
        "rtgThermalBonusC": 0,
        "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
      },
      "solar_rtg": {
        "massKg": 110,
        "costM": 135,
        "rtgContinuousW": 110,
        "rtgThermalBonusC": 6,
        "src": "https://mars.nasa.gov/msl/spacecraft/rover/power/"
      }
    },
    "batteries": [
      { "kwh": 20, "massKg": 85, "costM": 40, "src": "https://www.nasa.gov/smallsat-institute/sst-soa/" },
      { "kwh": 40, "massKg": 155, "costM": 80, "src": "https://www.nasa.gov/smallsat-institute/sst-soa/" },
      { "kwh": 60, "massKg": 225, "costM": 125, "src": "https://www.nasa.gov/smallsat-institute/sst-soa/" }
    ],
    "insulation": {
      "thin": {
        "massKg": 35,
        "costM": 25,
        "nightHeatingPowerW": 240,
        "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
      },
      "thick": {
        "massKg": 95,
        "costM": 65,
        "nightHeatingPowerW": 120,
        "src": "https://www.nasa.gov/smallsat-institute/sst-soa/"
      }
    },
    "commSystems": {
      "relay_only": {
        "massKg": 18,
        "costM": 30,
        "dataPerSolMbit": 45,
        "redundant": false,
        "src": "https://eyes.nasa.gov/apps/dsn-now/"
      },
      "relay_xband": {
        "massKg": 52,
        "costM": 85,
        "dataPerSolMbit": 80,
        "redundant": true,
        "src": "https://eyes.nasa.gov/apps/dsn-now/"
      }
    },
    "repairKit": {
      "massKgPerKit": 22,
      "costMPerKit": 30,
      "maxKits": 2,
      "src": "https://www.nasa.gov/hrp/"
    }
  },
  "instruments": [
    {
      "id": "mastcam_z",
      "realName": "Mastcam-Z (High-Res Stereo Camera + Mic)",
      "massKg": 4.0,
      "powerW": 17,
      "costM": 38,
      "dataMbit": 20,
      "dataMode": "per_photo",
      "unlocks": ["full_photo_score", "ufo_clear_80", "exp_sound_speed"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-01"
    },
    {
      "id": "meda",
      "realName": "MEDA (Mars Environmental Dynamics Analyzer)",
      "massKg": 5.5,
      "powerW": 17,
      "costM": 34,
      "dataMbit": 1,
      "dataMode": "per_sol",
      "unlocks": ["storm_early_warning", "cold_early_warning", "exp_water_boiling"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-02"
    },
    {
      "id": "seis",
      "realName": "SEIS (Seismic Experiment for Interior Structure)",
      "massKg": 30.0,
      "powerW": 8,
      "costM": 48,
      "dataMbit": 5,
      "dataMode": "per_sol",
      "unlocks": ["quake_early_warning"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2018-042A-01"
    },
    {
      "id": "rad",
      "realName": "RAD (Radiation Assessment Detector)",
      "massKg": 1.6,
      "powerW": 4,
      "costM": 28,
      "dataMbit": 1,
      "dataMode": "per_sol",
      "unlocks": ["spe_early_warning", "radiation_hud_visible"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2011-070A-07"
    },
    {
      "id": "rimfax",
      "realName": "RIMFAX (Radar Imager for Mars Subsurface)",
      "massKg": 3.0,
      "powerW": 10,
      "costM": 36,
      "dataMbit": 10,
      "dataMode": "per_scan",
      "unlocks": ["subsurface_ice_map"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-04"
    },
    {
      "id": "supercam",
      "realName": "SuperCam / PIXL (Laser & X-Ray Spectrometer)",
      "massKg": 11.0,
      "powerW": 18,
      "costM": 52,
      "dataMbit": 8,
      "dataMode": "per_scan",
      "unlocks": ["perchlorate_detection", "forensic_dust_thickness"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-06"
    },
    {
      "id": "moxie",
      "realName": "MOXIE (Mars Oxygen ISRU Experiment)",
      "massKg": 17.0,
      "powerW": 300,
      "costM": 68,
      "dataMbit": 2,
      "dataMode": "per_sol",
      "unlocks": ["co2_to_o2_isru", "exp_moxie_efficiency"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=2020-052A-07"
    },
    {
      "id": "veggie",
      "realName": "Veggie / Pressurized Plant Growth Chamber",
      "massKg": 8.0,
      "powerW": 100,
      "costM": 44,
      "dataMbit": 2,
      "dataMode": "per_sol",
      "unlocks": ["exp_seed_germination", "greenhouse_sanity_boost"],
      "src": "https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=1156"
    },
    {
      "id": "ingenuity",
      "realName": "Ingenuity (Coaxial Mars Reconnaissance Helicopter)",
      "massKg": 1.8,
      "powerW": 12,
      "costM": 42,
      "dataMbit": 15,
      "dataMode": "per_flight",
      "unlocks": ["drone_wreck_scout", "safe_rover_path"],
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2020-052B"
    }
  ],
  "forensicsCases": [
    {
      "id": "opportunity",
      "name": "MER-B Opportunity",
      "agency": "NASA / JPL",
      "lastContact": "2018-06-10 (Sol 5111)",
      "realCoords": "Meridiani Planum (2.05°S, 354.47°E)",
      "distanceMeters": 420,
      "correctCategory": "power_dust",
      "acceptedSecondary": "power_dust",
      "reportDataMbit": 18,
      "salvageReward": { "rhuUnits": 8, "powerThermalBonusW": 8 },
      "telemetryData": { "solarTau": 10.8, "panelWatt": 22, "coreTempC": -41 },
      "sprite": "assets/sprites/rover_opportunity.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A"
    },
    {
      "id": "spirit",
      "name": "MER-A Spirit",
      "agency": "NASA / JPL",
      "lastContact": "2010-03-22 (Sol 2210)",
      "realCoords": "Gusev Crater / Troy (14.57°S, 175.47°E)",
      "distanceMeters": 680,
      "correctCategory": "mechanical",
      "acceptedSecondary": "thermal",
      "reportDataMbit": 18,
      "salvageReward": { "rhuUnits": 8, "wheelPart": true },
      "telemetryData": { "wheelSlipPct": 98, "tiltDeg": -11.5, "heaterTempC": -55 },
      "sprite": "assets/sprites/rover_spirit.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-027A"
    },
    {
      "id": "phoenix",
      "name": "Phoenix Mars Lander",
      "agency": "NASA / UArizona",
      "lastContact": "2008-11-02 (Sol 157)",
      "realCoords": "Vastitas Borealis / Green Valley (68.22°N, 234.25°E)",
      "distanceMeters": 860,
      "correctCategory": "thermal",
      "acceptedSecondary": "mechanical",
      "reportDataMbit": 20,
      "salvageReward": { "roboticArmPart": true },
      "telemetryData": { "co2IceLoadKg": 140, "panelBusV": 0.0, "ambientTempC": -96 },
      "sprite": "assets/sprites/lander_phoenix.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2007-034A"
    },
    {
      "id": "insight",
      "name": "InSight Mars Lander",
      "agency": "NASA / JPL",
      "lastContact": "2022-12-15 (Sol 1440)",
      "realCoords": "Elysium Planitia (4.50°N, 135.62°E)",
      "distanceMeters": 540,
      "correctCategory": "power_dust",
      "acceptedSecondary": "power_dust",
      "reportDataMbit": 18,
      "salvageReward": { "seisUnlocked": true },
      "telemetryData": { "arrayDustCoveragePct": 92, "whPerSol": 285, "maxQuakeMag": 4.7 },
      "sprite": "assets/sprites/lander_insight.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2018-042A"
    },
    {
      "id": "beagle2",
      "name": "Beagle 2 Lander (Bonus)",
      "agency": "ESA / UK Open Univ.",
      "lastContact": "2003-12-25 (Found 2015 by MRO HiRISE)",
      "realCoords": "Isidis Planitia (11.53°N, 90.43°E)",
      "distanceMeters": 1050,
      "correctCategory": "comms",
      "acceptedSecondary": "mechanical",
      "reportDataMbit": 22,
      "salvageReward": { "spareAntenna": true },
      "telemetryData": { "petalsDeployed": "2 of 4", "uhfAntennaBlocked": true, "rfOutputDb": 0 },
      "sprite": "assets/sprites/lander_beagle2.png",
      "src": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-022C"
    }
  ],
  "experiments": [
    {
      "id": "pendulum_gravity",
      "order": 1,
      "tutorial": true,
      "requiredInstrument": null,
      "preferredEnv": "habitat",
      "energyCostKwh": 1.5,
      "dataMbit": 10,
      "basePoints": 80,
      "correctHypothesis": "slower_163",
      "expectedMarsValue": 3.26,
      "expectedEarthValue": 2.01,
      "unit": "s (T for L=1m)",
      "minigameType": "qte",
      "bonusId": " calibrated_jump_physics",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    {
      "id": "free_fall_jump",
      "order": 2,
      "tutorial": true,
      "requiredInstrument": null,
      "preferredEnv": "surface",
      "energyCostKwh": 1.5,
      "dataMbit": 10,
      "basePoints": 80,
      "correctHypothesis": "fall_104s",
      "expectedMarsValue": 1.04,
      "expectedEarthValue": 0.64,
      "unit": "s (h=2m drop)",
      "minigameType": "qte",
      "bonusId": "eva_jump_efficiency",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    {
      "id": "seed_germination",
      "order": 3,
      "tutorial": false,
      "requiredInstrument": "veggie",
      "secondaryInstrument": "supercam",
      "preferredEnv": "habitat",
      "energyCostKwh": 4.0,
      "dataMbit": 16,
      "basePoints": 120,
      "correctHypothesis": "washed_pressurized_only",
      "expectedMarsValue": 84,
      "expectedEarthValue": 95,
      "unit": "% germination (washed regolith)",
      "minigameType": "converter",
      "bonusId": "greenhouse_yield_30",
      "src": "https://mars.nasa.gov/news/8442/nasa-curiosity-mars-rover-finds-nitrogen-on-red-planet/"
    },
    {
      "id": "water_boiling",
      "order": 4,
      "tutorial": false,
      "requiredInstrument": "meda",
      "preferredEnv": "surface",
      "energyCostKwh": 2.5,
      "dataMbit": 14,
      "basePoints": 110,
      "correctHypothesis": "boil_and_freeze_triple",
      "expectedMarsValue": 0.61,
      "expectedEarthValue": 101.3,
      "unit": "kPa (Triple Point Sublimation)",
      "minigameType": "align",
      "bonusId": "closed_loop_water_save",
      "src": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html"
    },
    {
      "id": "sound_speed",
      "order": 5,
      "tutorial": false,
      "requiredInstrument": "mastcam_z",
      "preferredEnv": "surface",
      "energyCostKwh": 2.0,
      "dataMbit": 14,
      "basePoints": 110,
      "correctHypothesis": "slower_240ms",
      "expectedMarsValue": 240,
      "expectedEarthValue": 343,
      "unit": "m/s (50m acoustic delay ~0.208s)",
      "minigameType": "align",
      "bonusId": "acoustic_fault_detection",
      "src": "https://mars.nasa.gov/news/9158/nasa-perseverance-microphone-captures-sounds-of-mars/"
    },
    {
      "id": "moxie_efficiency",
      "order": 6,
      "tutorial": false,
      "requiredInstrument": "moxie",
      "preferredEnv": "surface",
      "energyCostKwh": 5.0,
      "dataMbit": 16,
      "basePoints": 120,
      "correctHypothesis": "denser_cold_air_variation",
      "expectedMarsValue": 9.8,
      "expectedEarthValue": 6.0,
      "unit": "g O2 / hour",
      "minigameType": "converter",
      "bonusId": "moxie_optimal_schedule",
      "src": "https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/"
    }
  ],
  "scoring": {
    "forensicCorrectPoints": 100,
    "forensicWrongWith3CluesPoints": 50,
    "forensicIncompleteCluesPoints": 20,
    "forensicUnsentPoints": 0,
    "controlGroupBonusMultiplier": 1.5,
    "massMarginBonusThresholdPct": 10.0,
    "massMarginBonusPoints": 120,
    "survivalPerSolPoints": 25,
    "safeReturnBonusPoints": 200,
    "lostSystemPenaltyPoints": 120,
    "src": "https://www.spaceappschallenge.org/"
  }
}
;

// --- MODULE: src/core/story_data.js ---
// Auto-synced from content/story.json
const storyData = {
  "tr": {
    "app.title": "SOL 14: RED HORIZON",
    "app.subtitle": "NASA Space Apps 2026 — İnsanlı Mars Görevi Tasarım ve Hayatta Kalma Simülasyonu",
    "app.btn_new_mission": "YENİ GÖREV TASARLA (SOL 0)",
    "app.btn_demo_mission": "⚡ JÜRİ HIZLI GÖREV (5 SOL DEMO)",
    "app.btn_continue": "KAYITLI GÖREVE DEVAM ET",
    "app.lang_toggle": "EN / TR",

    "budget.money": "BÜTÇE ($M)",
    "budget.mass": "KÜTLE & MARJ (kg)",
    "budget.power": "GÜÇ DENGESİ (W)",
    "budget.data": "VERİ BÜTÇESİ (Mbit/Sol)",
    "budget.margin_ok": "%10+ Marj Bonusu Aktif",
    "budget.margin_low": "Düşük Kütle Marjı (<%10)",
    "budget.over_limit": "LİMİT AŞILDI!",

    "design.step1_title": "1. GÖREV HEDEFİ & BAŞARI KRİTERLERİ",
    "design.step2_title": "2. ROKET, YÖRÜNGE & FIRLATMA PENCERESİ",
    "design.step3_title": "3. İNİŞ BÖLGESİ, GÜÇ & HABİTAT SİSTEMLERİ",
    "design.step4_title": "4. BİLİMSEL ALETLER (EN FAZLA 5 ALET SEÇİN)",
    "design.step5_title": "5. İLETİŞİM MİMARİSİ & YEDEKLİLİK",
    "design.btn_launch": "🚀 GÖREVİ BAŞLAT (SOL 0 FIRLATMA)",
    "design.btn_preset_balanced": "Dengeli NASA Tasarımı Yükle",
    "design.spof_header": "⚠️ TEK NOKTA ARIZA (SPOF) VE RİSK ANALİZİ",

    "obj.forensics.name": "Adli İnceleme Ağırlıklı (Kayıp Araç Dedektifi)",
    "obj.forensics.desc": "Kayıp NASA/ESA araçlarının neden sustuğunu çözmeye odaklanır. Adli rapor puanları x1.35 çarpan alır. Asgari Başarı: 3 Rapor + 1 Deney.",
    "obj.experiments.name": "Bilimsel Deney Ağırlıklı (Mars Laboratuvarı)",
    "obj.experiments.desc": "0.38g yerçekimi, atmosfer ve tohum deneylerine odaklanır. Deney puanları x1.35 çarpan alır. Asgari Başarı: 1 Rapor + 3 Deney.",
    "obj.balanced.name": "Dengeli Keşif & Bilim Görevi (Önerilen)",
    "obj.balanced.desc": "Hem kayıp araç adli incelemesi hem de 6 laboratuvar deneyine eşit ağırlık verir (x1.1 çarpan). Asgari Başarı: 2 Rapor + 2 Deney.",

    "orbit.hohmann.name": "Hohmann Minimum Enerji Transferi (~8.2 Ay)",
    "orbit.hohmann.desc": "En yüksek faydalı yük kapasitesi ve düşük maliyet; ancak 8 aylık yolculukta +28 mSv kozmik radyasyon birikir.",
    "orbit.fast_transfer.name": "Hızlı Hiperbolik Transfer (~5.8 Ay)",
    "orbit.fast_transfer.desc": "Yolculuk radyasyonunu yarıya indirir (+14 mSv) ve +%15 ekstra sarf malzemesi korur; ancak -180 kg yük ve +$75M ek yakıt bedeli vardır.",
    "window.caught": "26 Aylık Fırlatma Penceresini Yakala ($0 Ek Maliyet)",
    "window.missed": "Pencereyi Ertele / Geç Fırlat (-$140M Tutma ve Depolama Cezası)",

    "site.meridiani.name": "Meridiani Planum (Ekvator, 2°G)",
    "site.meridiani.desc": "Yüksek güneş açısı (cos Z=0.94), gündüz +18°C / gece -76°C. Güneş enerjisi bol ama yüzey altı su buzu çok derinde.",
    "site.jezero.name": "Jezero Krateri (18.4°K — Perseverance Bölgesi)",
    "site.jezero.desc": "Dengeli güneş (cos Z=0.85), gündüz +8°C / gece -82°C. Kayıp araç keşif koridoruna en yakın stratejik nokta.",
    "site.arcadia.name": "Arcadia Planitia (Orta Enlem, 39.2°K)",
    "site.arcadia.desc": "Yüzeyde bol su buzu var; ancak güneş eğik (cos Z=0.68) ve geceleri dondurucu (-94°C). Kalın yalıtım ve RTG şart!",

    "pwr.solar_only.name": "Sadece Üçlü Güneş Paneli Dizisi",
    "pwr.solar_only.desc": "Ucuz ve hafif (65 kg); ancak kum fırtınasında üretim %80 düşer ve gece 0 W üretir.",
    "pwr.solar_rtg.name": "Güneş Paneli + MMRTG Nükleer Güç Ünitesi (+110 W Kesintisiz)",
    "pwr.solar_rtg.desc": "Pu-238 radyoizotop ünitesi fırtınadan ve geceden etkilenmez, atık ısısıyla habitatı ısıtır (+45 kg, +$90M).",
    "ins.thin.name": "Standart İnce Aerojel Yalıtım (Gece Isıtma: 240 W)",
    "ins.thick.name": "Kalın Çok Katmanlı Kutup Yalıtımı (Gece Isıtma: 120 W, +60 kg)",
    "comm.relay_only.name": "Sadece UHF Yörünge Rölesi (MRO / MAVEN — 45 Mbit/Sol)",
    "comm.relay_xband.name": "UHF Röle + Doğrudan Dünya X-Band Çanak Anten (80 Mbit/Sol, Yedekli)",

    "spof.no_rtg": "RTG yok: Büyük kum fırtınasında güneş panelleri %80 güç kaybederse batarya hızla tükenir.",
    "spof.no_xband": "Yedek X-Band anten yok: Tek UHF anteni hasar görürse Dünya ile veri bağlantısı tamamen kopar.",
    "spof.no_repair_kit": "Tamir kiti (0): Mikrometeorit veya valf donmasında krizi otomatik çözemezsiniz.",
    "spof.small_battery": "Gece Enerji Riski: Seçtiğiniz aletlerin gece tüketimi batarya kapasitesini zorluyor!",
    "spof.thin_insulation_cold": "Arcadia (-94°C) için ince yalıtım seçildi: Gece sera ve motor donma riski çok yüksek.",
    "spof.no_meda": "MEDA Hava İstasyonu alınmadı: Kum fırtınası ve ani gece soğuğu habersiz vuracak.",
    "spof.low_mass_margin": "Kütle marjı %10'un altında: NASA standartlarına göre yedek kütle payı bırakılmadı.",

    "inst.mastcam_z.name": "Mastcam-Z Kamera + Mikrofon",
    "inst.mastcam_z.desc": "Enkaz fotoğraflarından tam puan, Ses Hızı deneyi ve finalde %80 net UFO görüntüsü sağlar.",
    "inst.meda.name": "MEDA Hava İstasyonu",
    "inst.meda.desc": "Kum fırtınasını ve -80°C ani soğuğu 1 Sol önceden bildirir; Suyun Kaynaması deneyini açar.",
    "inst.seis.name": "InSight SEIS Sismometresi",
    "inst.seis.desc": "M4.7 sarsıntı ve yakın meteor çarpmasını 30 sn önceden uyarır, raf devrilmesini önler.",
    "inst.rad.name": "RAD Radyasyon Dedektörü",
    "inst.rad.desc": "Güneş patlaması (SPE) erken uyarısı verir ve kümülatif mSv dozunu HUD'da gösterir.",
    "inst.rimfax.name": "RIMFAX Yeraltı Radarı",
    "inst.rimfax.desc": "Yüzey altı su buzu yataklarını haritada gösterir; kör kazıda O2 israfını önler.",
    "inst.supercam.name": "SuperCam / PIXL Spektrometre",
    "inst.supercam.desc": "Topraktaki zehirli perkloratı ve enkaz panellerindeki toz kalınlığını (adli kanıt) ölçer.",
    "inst.moxie.name": "MOXIE Oksijen Üretici (ISRU)",
    "inst.moxie.desc": "Mars CO2 atmosferinden düzenli O2 üretir (300 W güç çeker) ve Deney 6'yı açar.",
    "inst.veggie.name": "Veggie Bitki Büyütme Odası",
    "inst.veggie.desc": "Basınçlı ortamda Tohum Çimlenmesi deneyini, taze filiz besinini ve +Akıl Sağlığını açar.",
    "inst.ingenuity.name": "Ingenuity Keşif Helikopteri",
    "inst.ingenuity.desc": "Uzaktaki enkazları O2 harcamadan havadan keşfeder ve Spirit kum tuzaklarını tespit eder.",

    "hud.tab_surface": "01 YÜZEY & EVA",
    "hud.tab_map": "02 KEŞİF KORİDORU (ADLİ)",
    "hud.tab_lab": "03 BİLİM LABORATUVARI (6 DENEY)",
    "hud.tab_downlink": "04 DOWNLINK KUYRUĞU (M1)",
    "hud.tab_power": "05 GÜÇ YÜK PANELİ (M3)",
    "hud.btn_next_sol": "🌙 GÜNÜ TAMAMLA (SOL GEÇİŞİ)",
    "hud.btn_clean_panels": "🧹 Panelleri Temizle (-6% O2)",
    "hud.btn_sabatier": "⚗️ Sabatier Yakıt & O2 Üret (-5 kWh)",
    "hud.btn_greenhouse_care": "🌱 Sera Bakımı (+12% Akıl Sağlığı)",
    "hud.ponr_label": "Dönüşsüzlük Çentiği (Gerekli O2)",
    "hud.ponr_warning": "⚠️ DİKKAT: Mevcut O2 habitata dönüş çentiğinin sınırında!",

    "forensics.title": "ANA GÖREV 1: KAYIP ARAÇLARIN ADLİ İNCELEMESİ",
    "forensics.subtitle": "Kanıtları topla, aracın Dünya ile bağlantısının neden koptuğunu teşhis et ve raporu Downlink ile gönder.",
    "forensics.btn_drone": "🚁 Drone ile Keşfet (15 Mbit)",
    "forensics.btn_eva": "👨‍🚀 EVA Yürüyüşü ile Git",
    "forensics.ev_photo": "1. Görsel Kanıt (Fotoğraf)",
    "forensics.ev_telemetry": "2. Kara Kutu Telemetrisi (Kablo Mini-Oyunu)",
    "forensics.ev_env": "3. Çevre & Toz Ölçümü (Spektrometre)",
    "forensics.diag_power_dust": "Güç Kaybı / Güneş Paneli Tozlanması",
    "forensics.diag_thermal": "Termal Donma / CO2 Kuru Buz Yükü",
    "forensics.diag_mechanical": "Mekanik Sıkışma / Kum Tuzağı",
    "forensics.diag_software": "Yazılım / Flash Bellek Sıfırlanması",
    "forensics.diag_comms": "İletişim / Açılmayan Panelin Anteni Kapatması",
    "forensics.btn_submit": "📡 Teşhisi Kaydet & Downlink Kuyruğuna Ekle",
    "forensics.btn_salvage": "🔧 Parça Sök ve Ders Al",

    "case.opportunity.finding": "NASA Resmi Bulgusu: Haziran 2018 küresel toz fırtınasında atmosferik optik derinlik τ=10.8'e ulaştı. Güneş ışığı %99.99 kesildi ve düşük güç/saat hatasıyla uykuya geçti.",
    "case.opportunity.lesson": "Mühendislik Dersi: Fırtına başlamadan önce kritik olmayan güç yüklerini kapat (Load Shedding). 8 adet 1W RHU ısıtıcı söküldü!",
    "case.spirit.finding": "NASA Resmi Bulgusu: Mayıs 2009'da 'Troy' adlı yumuşak sülfat kumuna saplandı. Kış geldiğinde panellerini güneşe doğru eğemediği için iç ısıtıcıları -55°C altında dondu.",
    "case.spirit.lesson": "Mühendislik Dersi: Gece eğim açısını ve yumuşak regolit rotalarını önceden tarayın. 8 adet RHU ve yedek tekerlek parçası söküldü!",
    "case.phoenix.finding": "NASA Resmi Bulgusu: Kuzey kutup kışında karanlık çöktüğünde güneş panellerinin üzerinde biriken yüzlerce kiloluk katı CO2 (kuru buz) yükü panel kollarını kırdı.",
    "case.phoenix.lesson": "Mühendislik Dersi: Yüksek enlemlerde sabah CO2 kırağısını temizleyin ve yapısal buz yükünü hesaba katın. Robot kol parçası söküldü!",
    "case.insight.finding": "NASA Resmi Bulgusu: 4 yıllık görev sonunda sabit güneş panellerinin %92'si ince Mars tozuyla kaplandı; günlük enerji üretimi 285 Wh altına düşerek bataryalar tükendi.",
    "case.insight.lesson": "Mühendislik Dersi: Panel temizleme mekanizması veya RTG olmadan uzun süreli görevler toza yenilir. SEIS Sismometresi envantere katıldı!",
    "case.beagle2.finding": "ESA / MRO 2015 Bulgusu: Araç yüzeye sağlam indi ancak 4 yapraklı güneş panelinden yalnızca 2'si açıldı. Açılmayan paneller UHF radyo anteninin önünü kapattığı için tek bir sinyal bile gönderemedi.",
    "case.beagle2.lesson": "Mühendislik Dersi: Tek nokta arızasını (SPOF) önlemek için yedek iletişim anteni şarttır. Yedek UHF/X-band anten söküldü!",

    "exp.title": "ANA GÖREV 2: MARS BİLİM LABORATUVARI (0.38g & ATMOSFER DENEYLERİ)",
    "exp.subtitle": "Hipotez kur, ortamı ve kontrol grubunu seç, ölçüm mini-oyununu tamamla ve bulguları Dünya'ya gönder.",
    "exp.env_habitat": "Habitat İçi (101 kPa Dünya Basıncı, +20°C, 0.38g)",
    "exp.env_surface": "Mars Dış Yüzeyi (~0.6 kPa CO2, -80°C..+10°C, 0.38g)",
    "exp.control_group": "Dünya Kontrol Grubu Ekle (+%50 Bilim Puanı, +1.5 kWh Enerji)",
    "exp.btn_run": "🔬 Deneyi Çalıştır ve Ölçüm Yap",

    "exp.pendulum_gravity.name": "Deney 1: Sarkaçla Yerçekimi Ölçümü (Tutorial)",
    "exp.pendulum_gravity.question": "1 metre uzunluğundaki basit sarkaç Mars'ta Dünya'ya göre nasıl salınır?",
    "exp.pendulum_gravity.h1": "Daha yavaş salınır (T ≈ 3.26 sn, Dünya'nın ~1.63 katı)",
    "exp.pendulum_gravity.h2": "Daha hızlı salınır (T ≈ 1.25 sn)",
    "exp.pendulum_gravity.h3": "Kütleçekimi periyodu etkilemez (T ≈ 2.01 sn)",
    "exp.pendulum_gravity.result": "T = 2π√(L/g) formülüyle 10 salınım 32.6 sn sürdü → g = 3.71 m/s² doğrulandı! (Bonus: 0.38g yürüme kalibrasyonu)",

    "exp.free_fall_jump.name": "Deney 2: Serbest Düşüş ve 0.38g Zıplama (Tutorial)",
    "exp.free_fall_jump.question": "2 metre yükseklikten bırakılan bir cisim Mars'ta yere kaç saniyede düşer?",
    "exp.free_fall_jump.h1": "~1.04 saniyede düşer (Dünya'da ~0.64 sn); astronot ~2.6 kat yükseğe sıçrar",
    "exp.free_fall_jump.h2": "~0.64 saniyede düşer (İnce atmosfer hava direncini azaltır)",
    "exp.free_fall_jump.h3": "~2.60 saniyede süzülerek düşer",
    "exp.free_fall_jump.result": "t = √(2h/g) ile 1.04 sn ölçüldü. Düşük yerçekimi zıplama fiziğiyle birebir örtüştü! (Bonus: EVA O2 tasarrufu)",

    "exp.seed_germination.name": "Deney 3: Mars Regolitinde Tohum Çimlenmesi (3 Grup)",
    "exp.seed_germination.question": "Mars toprağında (regolit) tohumlar hangi koşulda sağlıklı çimlenir?",
    "exp.seed_germination.h1": "Sadece perkloratı yıkanmış + gübreli toprakta ve basınçlı serada çimlenir",
    "exp.seed_germination.h2": "Ham Mars toprağında doğrudan çimlenir",
    "exp.seed_germination.h3": "0.6 kPa açık Mars atmosferinde CO2 bol olduğu için hızla büyür",
    "exp.seed_germination.result": "Ham regolitteki perklorat (%0.5-1) hücrelere zarar verdi; açık havada su anında süblimleşti. Yıkanmış toprakta %84 çimlenme sağlandı! (Bonus: Sera verimi +%30)",

    "exp.water_boiling.name": "Deney 4: Suyun Üçlü Noktada Kaynaması ve Donması",
    "exp.water_boiling.question": "Mars dış yüzeyine (~0.63 kPa basınç) açık kapta sıvı su konursa ne olur?",
    "exp.water_boiling.h1": "Basınç suyun üçlü noktasına (0.61 kPa) yakın olduğu için aynı anda hem kaynar hem donar",
    "exp.water_boiling.h2": "Sadece yavaşça buharlaşır, sıvı halde kalır",
    "exp.water_boiling.h3": "CO2 ile birleşip anında asit oluşturur",
    "exp.water_boiling.result": "Düşük atmosfer basıncında su 0°C civarında fokurdayarak kaynarken ısı kaybedip buz kristaline dönüştü! (Bonus: Kapalı devre buz eritme koruması)",

    "exp.sound_speed.name": "Deney 5: Mars Atmosferinde Ses Hızı",
    "exp.sound_speed.question": "Soğuk ve %95 CO2 içeren Mars atmosferinde ses hızı Dünya'ya (343 m/s) göre nasıldır?",
    "exp.sound_speed.h1": "Daha yavaştır (~240 m/s) ve tiz sesler bas seslerden biraz daha hızlı yayılır",
    "exp.sound_speed.h2": "İnce havada sürtünme az olduğu için daha hızlıdır (~480 m/s)",
    "exp.sound_speed.h3": "Mars'ta ses hiç yayılmaz",
    "exp.sound_speed.result": "Perseverance mikrofonu gibi 50 metreden ses gecikmesi 0.208 sn ölçüldü → Ses hızı ~240 m/s! (Bonus: Akustik valf arıza tespiti)",

    "exp.moxie_efficiency.name": "Deney 6: MOXIE Gece vs. Gündüz O2 Üretim Verimi",
    "exp.moxie_efficiency.question": "MOXIE katı oksit elektroliz ünitesinin O2 üretim hızı gece ve gündüz nasıl değişir?",
    "exp.moxie_efficiency.h1": "Gece soğuğunda atmosfer yoğunluğu arttığı için birim hacimden daha yüksek O2 (9.8 g/saat) üretilir",
    "exp.moxie_efficiency.h2": "Sadece güneş varken çalışır, gece CO2 donar",
    "exp.moxie_efficiency.h3": "Sıcaklık ve basınç verimi hiç etkilemez",
    "exp.moxie_efficiency.result": "Soğuk gece havası daha yoğun olduğu için kompresör verimi arttı ve 9.8 g/saat O2 üretildi! (Bonus: MOXIE verimli çalışma modu)",

    "crisis.joint_freeze.title": "❄️ KRİZ: EVA SIRASINDA EKLEM YAĞI DONDU (-80°C)",
    "crisis.joint_freeze.desc": "Habitattan 900 m uzaktasın. Dondurucu soğukta elbise eklemleri sertleşti, yürüme hızın %40'a düştü! Dönüşsüzlük noktası çentiği O2 sınırına dayandı.",
    "crisis.joint_freeze.optA": "A) Yavaş Yürüyerek Dön (Bedel: -28% O2, -10°C Elbise Isısı — O2 yetiyorsa)",
    "crisis.joint_freeze.optB": "B) Elbise Isıtıcısını Tam Güce Aç (Bedel: -8 kWh Batarya, Hız %100'e döner, -12% O2)",
    "crisis.joint_freeze.optC": "C) Yakındaki Enkaza Sığın & RHU Isısıyla Çöz (Bedel: +1 Saat Süre, -8% O2, +1 RHU Kullanımı)",
    "crisis.joint_freeze.advice": "Görev Kontrol Analizi: Hız %40 iken 900m yürümek O2 rezervini tüketir. Batarya >15 kWh ise Seçenek B, RHU varsa Seçenek C en güvenlidir.",

    "crisis.dust_storm.title": "🌪️ KRİZ: BÜYÜK KUM FIRTINASI (OPTİK DERİNLİK τ = 8.5)",
    "crisis.dust_storm.desc": "Güneş paneli üretimi %80 düştü ve görüş mesafesi sıfırlandı! Güç Yük Paneli (M3) üzerinden kesinti yapılmazsa batarya bu gece tükenecek.",
    "crisis.dust_storm.optA": "A) Serayı Geçici Kapat & Bataryayı Koru (Bedel: -10% Akıl Sağlığı, Bitki büyümesi durur, +6 kWh tasarruf)",
    "crisis.dust_storm.optB": "B) Deneyleri ve İletişimi Durdur (Bedel: Bu Sol veri gönderilemez, -15 Mbit, Batarya korunur)",
    "crisis.dust_storm.optC": "C) MOXIE'yi Kapat & Yedek O2 Tüpüne Geç (Bedel: -18% O2 Rezervi, +9 kWh Enerji tasarrufu)",
    "crisis.dust_storm.advice": "Görev Kontrol Analizi: Opportunity 2018 fırtınasında yük kesemediği için kaybedildi. O2 >%60 ise MOXIE'yi veya iletişimi geçici kapatın.",

    "crisis.frozen_valve.title": "🥶 KRİZ: GECE -82°C SOĞUKTA MAV YAKIT VALFİ DONDU",
    "crisis.frozen_valve.desc": "Gece sıcaklığı -82°C'ye indi. Yükselme Aracı (MAV) metan valfi ve habitat su borusu donma noktasında!",
    "crisis.frozen_valve.optA": "A) Habitat Bataryasıyla Elektrikli Isıt (Bedel: -10 kWh Enerji, Sera ısıtması 1 gece kesilir)",
    "crisis.frozen_valve.optB": "B) Gece EVA'ya Çıkıp Manuel QTE ile Isıt (Bedel: -12% O2, +4 mSv Radyasyon, QTE Mini-Oyunu)",
    "crisis.frozen_valve.optC": "C) Tamir Kiti / RHU İzotop Isıtıcı Bağla (Bedel: -1 Tamir Kiti veya RHU, Sıfır enerji kaybı)",
    "crisis.frozen_valve.advice": "Görev Kontrol Analizi: Kalın yalıtım veya RHU varsa C seçeneği bedelsizdir; aksi halde QTE ile manuel ısıtma bataryayı korur.",

    "crisis.radiator_overheat.title": "🔥 KRİZ: İNCE ATMOSFERDE ISI ATMA (RADYATÖR) ARIZASI",
    "crisis.radiator_overheat.desc": "Mars atmosferi çok ince (~0.6 kPa) olduğu için konveksiyonla soğutma yapılamıyor; tozla tıkanan radyatör yüzünden MOXIE ve kabin elektroniği aşırı ısındı!",
    "crisis.radiator_overheat.optA": "A) EVA ile Radyatör Kanatlarını Temizle (Bedel: -10% O2, Kablo/Boru Mini-Oyunu)",
    "crisis.radiator_overheat.optB": "B) MOXIE ve Güç Yükünü %50 Kıs (Bedel: -14% O2 üretimi, -4 kWh, Aşırı ısınma durur)",
    "crisis.radiator_overheat.optC": "C) Yedek Soğutma Suyu Pompala (Bedel: -15 Litre Su, Sistem anında soğur)",
    "crisis.radiator_overheat.advice": "Görev Kontrol Analizi: Mars'ta dışarısı soğuk olsa bile vakuma yakın atmosferde ısı yalnız radyasyonla atılır. Radyatörü temizlemek en kalıcı çözümdür.",

    "crisis.marsquake_landslide.title": "🪨 KRİZ: YAKIN METEOR ÇARPMASI VE M4.7 SARSINTI",
    "crisis.marsquake_landslide.desc": "InSight verilerindeki en büyük Mars sarsıntısı (~M4.7) büyüklüğünde bir sarsıntı ve yamaç heyelanı habitatı sarstı! 0.38g'de laboratuvar rafları devriliyor!",
    "crisis.marsquake_landslide.optA": "A) Önce O2 Boru Sızıntısını Kapat (Bedel: Sera rafı düşer -8% Akıl Sağlığı, O2 korunur)",
    "crisis.marsquake_landslide.optB": "B) Önce Sera ve Deney Tüplerini Tut (Bedel: -14% O2 sızıntısı, Bilim verisi korunur)",
    "crisis.marsquake_landslide.optC": "C) SEIS Erken Uyarısı / Tamir Kiti ile Sabitle (Bedel: SEIS varsa 0 kayıp, yoksa -1 Tamir Kiti)",
    "crisis.marsquake_landslide.advice": "Görev Kontrol Analizi: SEIS sismometresi 30 sn önceden P-dalgasını yakalar. SEIS yoksa önce yaşam desteğini (O2) koruyun.",

    "crisis.solar_flare_spe.title": "☀️ KRİZ: GÜNEŞ PARÇACIK OLAYI (SPE RADYASYON FIRTINASI)",
    "crisis.solar_flare_spe.desc": "Güneş'ten kopan yüksek enerjili proton fırtınası Mars'ın manyetosfersiz yüzeyini dövüyor! Saatlik radyasyon dozu 15 mSv'e fırladı.",
    "crisis.solar_flare_spe.optA": "A) Su Tanklı Radyasyon Sığınağına Gir ve Bekle (Bedel: Bu Sol dış görev yapılamaz, +2 mSv minimal doz)",
    "crisis.solar_flare_spe.optB": "B) Dış Görevi Hızla Tamamla (Bedel: +38 mSv Ağır Radyasyon Dozu, -15% Akıl Sağlığı)",
    "crisis.solar_flare_spe.optC": "C) Yalnızca Otonom Sistemleri ve Drone'u Çalıştır (Bedel: -5 kWh Enerji, +4 mSv doz)",
    "crisis.solar_flare_spe.advice": "Görev Kontrol Analizi: 150 mSv görev limitini aşmak görevi sonlandırır. Su hidrojen açısından zengin olduğu için en iyi radyasyon kalkanıdır.",

    "crisis.data_congestion.title": "📡 KRİZ: DOWNLINK VERİ BÜTÇESİ DOLDU (MRO GEÇİŞİ KISITLI)",
    "crisis.data_congestion.desc": "Bu Sol'daki MRO röle geçiş penceresi dolmak üzere. Bekleyen bilimsel paketler ve Dünya'dan gelen aile video mesajı arasında seçim yapmalısın.",
    "crisis.data_congestion.optA": "A) Kayıp Araç Adli Raporlarına Öncelik Ver (Bedel: Aile mesajı silinir -8% Akıl Sağlığı, +Adli Puan)",
    "crisis.data_congestion.optB": "B) Laboratuvar Deney Sonuçlarını Gönder (Bedel: -4 kWh X-Band Gücü, +Deney Puanı)",
    "crisis.data_congestion.optC": "C) Aileden Gelen Video Mesajını İndir (Bedel: -18 Mbit Veri Bütçesi, +22% Akıl Sağlığı)",
    "crisis.data_congestion.advice": "Görev Kontrol Analizi: Akıl sağlığın %40'ın altındaysa halüsinasyonları önlemek için aile mesajını indir; aksi halde bilim verilerini gönder.",

    "crisis.perchlorate_dust.title": "☣️ KRİZ: HAVA KİLİDİNDE TOKSİK PERKLORAT TOZU",
    "crisis.perchlorate_dust.desc": "EVA dönüşünde elektrostatik yapışkan Mars tozu (ClO4⁻ perklorat tuzları) elbiseden kabin havasına karıştı!",
    "crisis.perchlorate_dust.optA": "A) Tam Su Yıkaması ve Elektrostatik Fırçalama (Bedel: -12 Litre Su, -2 kWh Enerji, Tam Temizlik)",
    "crisis.perchlorate_dust.optB": "B) Kabin Havasını Vakumla ve Yenile (Bedel: -16% O2 Rezervi, Su harcanmaz)",
    "crisis.perchlorate_dust.optC": "C) Filtreleri Zorla Çalıştır (Bedel: -5 kWh, -10% Akıl Sağlığı)",
    "crisis.perchlorate_dust.advice": "Görev Kontrol Analizi: Perklorat tiroid ve akciğer için toksiktir. Arcadia'da su bol ise A seçeneği, MOXIE varsa B seçeneği uygundur.",

    "crisis.dust_devil_bonus.title": "🌪️✨ OLUMLU OLAY: TOZ ŞEYTANI (DUST DEVIL) PANELLERİ TEMİZLEDİ!",
    "crisis.dust_devil_bonus.desc": "Tıpkı Spirit ve Opportunity görevlerinde olduğu gibi, sıcak yüzey konveksiyonuyla oluşan bir toz şeytanı güneş panellerinin üzerinden geçti ve biriken tozu süpürdü!",
    "crisis.dust_devil_bonus.optA": "A) Şarjı Maksimuma Al ve Kutla! (Ödül: Panel Tozu %0'a düşer, +12 kWh Enerji, +10% Akıl Sağlığı)",
    "crisis.dust_devil_bonus.optB": "B) Toz Şeytanının Fotoğrafını Çek & Şarj Ol (Ödül: Panel Temizlenir + 35 Bilim Puanlı Fotoğraf Downlink'e eklenir)",
    "crisis.dust_devil_bonus.advice": "Görev Kontrol Analizi: NASA'nın MER gezginleri bu doğal temizlik olayları sayesinde 90 Sol yerine yıllarca hayatta kaldı!",

    "downlink.title": "M1: VERİ BÜTÇESİ VE DOWNLINK HABERLEŞME KONSOLU",
    "downlink.subtitle": "Dünya'ya gönderilmeyen hiçbir fotoğraf, adli rapor veya deney sonucu görev puanına sayılmaz!",
    "downlink.btn_send": "📡 Gönder",
    "downlink.sent_badge": "✅ Dünya'ya Ulaştı (DSN)",
    "downlink.conjunction_alert": "☀️ GÜNEŞ KAVUŞUMU (SOLAR CONJUNCTION): Güneş, Dünya ile Mars arasında! Veri iletimi kesildi.",

    "power.title": "M3: GÜÇ YÜK ÖNCELİKLENDİRME PANELİ (LOAD SHEDDING)",
    "power.subtitle": "Üretim yetmediğinde listenin en altındaki sistemler otomatik kapanır. Yukarı/Aşağı oklarla öncelik sırasını değiştirin.",
    "power.life_support": "1. Kabin Yaşam Desteği & CO2 Tutucu (220 W)",
    "power.heating": "2. Habitat & Valf Termal Isıtma (Isı Kalkanı)",
    "power.greenhouse": "3. Basınçlı Sera & Hidroponik LED (100 W)",
    "power.moxie": "4. MOXIE Oksijen Üretim Reaktörü (300 W)",
    "power.experiments": "5. Bilim Laboratuvarı Cihazları (60 W)",
    "power.comms": "6. Yüksek Kazançlı İletişim Amplifikatörü (40 W)",

    "ufo.stage1": "SOL 14 — MAV MOTORLARI ATEŞLENDİ: Jezero Krateri kızıl toz bulutları arasında aşağıda kalıyor...",
    "ufo.stage2": "ANOMALİ TESPİT EDİLDİ! Ufukta parlak bir ışık MAV'a paralel yükseldi ve fiziğe aykırı bir açıyla sabitlendi! Kokpit kamerası otomatik kayıt aldı.",
    "ufo.stage3_high": "DÜNYA GÖREV KONTROL (DSN CANLI): Mastcam-Z yüksek çözünürlüklü telemetri görüntüsü satır satır iniyor... (%80 İndirildi)",
    "ufo.stage3_low": "DÜNYA GÖREV KONTROL (DSN CANLI): El kamerası / düşük bant genişliği nedeniyle görüntü pikselli ve bulanık iniyor... (%30 İndirildi)",
    "ufo.stage4_cut": "⚠️ UYARI: GÜNEŞ KAVUŞUMU (SOLAR CONJUNCTION) — SİNYAL KESİLDİ!",
    "ufo.analyst_note": "NASA Analist Notu: 'Viking 1976 görevindeki Mars'taki Yüz gibi optik bir yanılma (Pareidolia) veya atmosferik buz kristali yansıması olabilir. Kesin doğrulama için daha yüksek kamera çözünürlüklü ve geniş veri bantlı yeni bir görev tasarlamanız gerekiyor.' (Not: Bu sahne bilimsel şüpheciliği vurgulayan sanatsal bir kurgudur.)",
    "ufo.btn_to_report": "📊 NEDEN-SONUÇ KARNESİNİ GÖRÜNTÜLE",

    "report.title": "M5: GÖREV SONU NEDEN-SONUÇ KARNESİ & NASA KARŞILAŞTIRMASI",
    "report.subtitle": "Her mühendislik ve operasyon kararınızın görev başarısını nasıl şekillendirdiğinin analizi",
    "report.tier_FULL_SUCCESS": "🏆 TAM GÖREV BAŞARISI (FULL MISSION SUCCESS)",
    "report.tier_MIN_SUCCESS": "✅ ASGARİ GÖREV BAŞARISI (MINIMUM MISSION SUCCESS)",
    "report.tier_PARTIAL": "⚠️ KISMİ BAŞARI — KRİTİK VERİ EKSİKLİĞİ",
    "report.tier_FAILED": "🚨 GÖREV KAYBEDİLDİ — ÖĞRENİLEN MÜHENDİSLİK DERSLERİ",
    "report.btn_replay": "🔄 SONRAKİ GÖREVİ SEN TASARLA (SOL 0'A DÖN)"
  },
  "en": {
    "app.title": "SOL 14: RED HORIZON",
    "app.subtitle": "NASA Space Apps 2026 — Crewed Mars Mission Design & Survival Simulation",
    "app.btn_new_mission": "DESIGN NEW MISSION (SOL 0)",
    "app.btn_demo_mission": "⚡ JURY QUICK MISSION (5-SOL DEMO)",
    "app.btn_continue": "CONTINUE SAVED MISSION",
    "app.lang_toggle": "TR / EN",

    "budget.money": "BUDGET ($M)",
    "budget.mass": "MASS & MARGIN (kg)",
    "budget.power": "POWER BALANCE (W)",
    "budget.data": "DATA BUDGET (Mbit/Sol)",
    "budget.margin_ok": "10%+ Margin Bonus Active",
    "budget.margin_low": "Low Mass Margin (<10%)",
    "budget.over_limit": "LIMIT EXCEEDED!",

    "design.step1_title": "1. MISSION OBJECTIVES & SUCCESS CRITERIA",
    "design.step2_title": "2. LAUNCH VEHICLE, ORBIT & LAUNCH WINDOW",
    "design.step3_title": "3. LANDING SITE, POWER & HABITAT SYSTEMS",
    "design.step4_title": "4. SCIENTIFIC INSTRUMENTS (SELECT UP TO 5)",
    "design.step5_title": "5. COMMUNICATION ARCHITECTURE & REDUNDANCY",
    "design.btn_launch": "🚀 LAUNCH MISSION (SOL 0 LIFTOFF)",
    "design.btn_preset_balanced": "Load Balanced NASA Preset",
    "design.spof_header": "⚠️ SINGLE POINT OF FAILURE (SPOF) & RISK ANALYSIS",

    "obj.forensics.name": "Forensics Focused (Lost Spacecraft Detective)",
    "obj.forensics.desc": "Focuses on diagnosing why lost NASA/ESA spacecraft went silent. Forensic reports get x1.35 score multiplier. Min Success: 3 Reports + 1 Experiment.",
    "obj.experiments.name": "Science Lab Focused (Mars Laboratory)",
    "obj.experiments.desc": "Focuses on 0.38g gravity, atmospheric, and seed experiments. Experiments get x1.35 score multiplier. Min Success: 1 Report + 3 Experiments.",
    "obj.balanced.name": "Balanced Exploration & Science (Recommended)",
    "obj.balanced.desc": "Equal weight on spacecraft forensics and 6 lab experiments (x1.1 multiplier). Min Success: 2 Reports + 2 Experiments.",

    "orbit.hohmann.name": "Hohmann Minimum-Energy Transfer (~8.2 Months)",
    "orbit.hohmann.desc": "Maximum payload capacity and lowest cost; however, 8-month transit accumulates +28 mSv cosmic radiation.",
    "orbit.fast_transfer.name": "Fast Hyperbolic Transfer (~5.8 Months)",
    "orbit.fast_transfer.desc": "Halves transit radiation (+14 mSv) and saves +15% supplies; costs -180 kg payload capacity and +$75M fuel penalty.",
    "window.caught": "Catch 26-Month Synodic Launch Window ($0 Extra Cost)",
    "window.missed": "Delay / Miss Launch Window (-$140M Holding & Storage Penalty)",

    "site.meridiani.name": "Meridiani Planum (Equator, 2°S)",
    "site.meridiani.desc": "High sun angle (cos Z=0.94), day +18°C / night -76°C. Abundant solar power, but subsurface water ice is scarce.",
    "site.jezero.name": "Jezero Crater (18.4°N — Perseverance Site)",
    "site.jezero.desc": "Balanced sunlight (cos Z=0.85), day +8°C / night -82°C. Closest strategic hub to the exploration corridor.",
    "site.arcadia.name": "Arcadia Planitia (Mid-Latitude, 39.2°N)",
    "site.arcadia.desc": "Abundant shallow water ice; however, low sun angle (cos Z=0.68) and freezing nights (-94°C). Thick insulation & RTG vital!",

    "pwr.solar_only.name": "Triple Solar Panel Array Only",
    "pwr.solar_only.desc": "Lightweight and affordable (65 kg); drops by 80% in dust storms and produces 0 W at night.",
    "pwr.solar_rtg.name": "Solar Array + MMRTG Nuclear Power Unit (+110 W Continuous)",
    "pwr.solar_rtg.desc": "Pu-238 radioisotope unit is immune to storms and night, providing waste heat (+45 kg, +$90M).",
    "ins.thin.name": "Standard Thin Aerogel Insulation (Night Heating: 240 W)",
    "ins.thick.name": "Thick Multi-Layer Polar Insulation (Night Heating: 120 W, +60 kg)",
    "comm.relay_only.name": "UHF Orbiter Relay Only (MRO / MAVEN — 45 Mbit/Sol)",
    "comm.relay_xband.name": "UHF Relay + Direct-to-Earth X-Band Dish (80 Mbit/Sol, Redundant)",

    "spof.no_rtg": "No RTG: If a major dust storm cuts solar output by 80%, batteries will drain rapidly overnight.",
    "spof.no_xband": "No X-Band backup: If the single UHF antenna is damaged, Earth data downlink is severed.",
    "spof.no_repair_kit": "Repair Kits (0): You cannot auto-resolve micrometeorite or frozen valve emergencies.",
    "spof.small_battery": "Night Power Risk: Your selected instruments' night draw strains battery capacity!",
    "spof.thin_insulation_cold": "Thin insulation selected for Arcadia (-94°C): High risk of greenhouse and valve freezing.",
    "spof.no_meda": "No MEDA Weather Station: Dust storms and sudden -80°C drops will strike without warning.",
    "spof.low_mass_margin": "Mass margin below 10%: Violates NASA engineering reserve guidelines.",

    "inst.mastcam_z.name": "Mastcam-Z Camera + Microphone",
    "inst.mastcam_z.desc": "Full forensic photo points, Speed of Sound experiment, and 80% clear UFO telemetry image.",
    "inst.meda.name": "MEDA Weather Station",
    "inst.meda.desc": "Warns of dust storms and -80°C drops 1 Sol early; unlocks Water Triple-Point Boiling experiment.",
    "inst.seis.name": "InSight SEIS Seismometer",
    "inst.seis.desc": "Provides 30s early warning before M4.7 tremors/impacts, preventing shelf collapse.",
    "inst.rad.name": "RAD Radiation Detector",
    "inst.rad.desc": "Warns of Solar Particle Events (SPE) and displays cumulative mSv dose on HUD.",
    "inst.rimfax.name": "RIMFAX Ground-Penetrating Radar",
    "inst.rimfax.desc": "Maps subsurface water ice deposits, preventing blind excavation O2 waste.",
    "inst.supercam.name": "SuperCam / PIXL Spectrometer",
    "inst.supercam.desc": "Measures toxic soil perchlorates and solar panel dust thickness (forensic evidence).",
    "inst.moxie.name": "MOXIE Oxygen Generator (ISRU)",
    "inst.moxie.desc": "Produces O2 from Martian atmospheric CO2 (draws 300 W) and unlocks Experiment 6.",
    "inst.veggie.name": "Veggie Plant Growth Chamber",
    "inst.veggie.desc": "Unlocks pressurized Seed Germination experiment, fresh sprouts, and +Sanity.",
    "inst.ingenuity.name": "Ingenuity Reconnaissance Helicopter",
    "inst.ingenuity.desc": "Scouts distant wrecks from the air without spending EVA O2 and spots sand traps.",

    "hud.tab_surface": "01 SURFACE & EVA",
    "hud.tab_map": "02 EXPLORATION CORRIDOR (FORENSICS)",
    "hud.tab_lab": "03 SCIENCE LAB (6 EXPERIMENTS)",
    "hud.tab_downlink": "04 DOWNLINK QUEUE (M1)",
    "hud.tab_power": "05 POWER LOAD PANEL (M3)",
    "hud.btn_next_sol": "🌙 END SOL (ADVANCE TO NEXT SOL)",
    "hud.btn_clean_panels": "🧹 Clean Solar Panels (-6% O2)",
    "hud.btn_sabatier": "⚗️ Sabatier Fuel & O2 ISRU (-5 kWh)",
    "hud.btn_greenhouse_care": "🌱 Tend Greenhouse (+12% Sanity)",
    "hud.ponr_label": "Point of No Return (Required O2)",
    "hud.ponr_warning": "⚠️ WARNING: Current O2 is near the Point-of-No-Return notch!",

    "forensics.title": "PRIMARY OBJECTIVE 1: LOST SPACECRAFT FORENSIC INVESTIGATION",
    "forensics.subtitle": "Collect 3 evidence types, diagnose why contact with Earth was lost, and transmit the report via Downlink.",
    "forensics.btn_drone": "🚁 Scout with Drone (15 Mbit)",
    "forensics.btn_eva": "👨‍🚀 Hike via EVA",
    "forensics.ev_photo": "1. Visual Evidence (Photography)",
    "forensics.ev_telemetry": "2. Black-Box Telemetry (Wires Minigame)",
    "forensics.ev_env": "3. Environmental & Dust Scan (Spectrometer)",
    "forensics.diag_power_dust": "Power Depletion / Solar Array Dust Accumulation",
    "forensics.diag_thermal": "Thermal Freezing / CO2 Dry-Ice Structural Load",
    "forensics.diag_mechanical": "Mechanical Entrapment / Soft Sand Trap",
    "forensics.diag_software": "Software / Flash Memory Reboot Loop",
    "forensics.diag_comms": "Communication / Unopened Petal Blocking Antenna",
    "forensics.btn_submit": "📡 Log Diagnosis & Add to Downlink Queue",
    "forensics.btn_salvage": "🔧 Salvage Component & Learn Lesson",

    "case.opportunity.finding": "Official NASA Finding: During the June 2018 global dust storm, atmospheric optical depth reached τ=10.8, blocking 99.99% of sunlight and triggering low-power fault sleep.",
    "case.opportunity.lesson": "Engineering Lesson: Shed non-critical power loads before a storm hits. Salvaged 8x 1W RHU heater units!",
    "case.spirit.finding": "Official NASA Finding: Bogged down in soft sulfate sand ('Troy') in May 2009. Unable to tilt its panels toward the winter sun, internal heaters froze below -55°C.",
    "case.spirit.lesson": "Engineering Lesson: Scout soft regolith routes and winter tilt angles in advance. Salvaged 8x RHU units and wheel actuator!",
    "case.phoenix.finding": "Official NASA Finding: During polar winter darkness, hundreds of kilograms of solid CO2 (dry ice) built up on the solar panels and snapped the support arms.",
    "case.phoenix.lesson": "Engineering Lesson: Clear morning CO2 frost and account for polar ice mass loads. Salvaged Robotic Arm actuator!",
    "case.insight.finding": "Official NASA Finding: After 4 years on Elysium Planitia, 92% of its solar arrays were coated in fine Martian dust, dropping generation below 285 Wh/sol.",
    "case.insight.lesson": "Engineering Lesson: Without panel cleaning or an RTG, stationary missions succumb to dust. Salvaged SEIS Seismometer!",
    "case.beagle2.finding": "ESA / MRO 2015 Finding: Landed safely in 2003, but only 2 of 4 solar petals deployed; the unopened petals blocked the UHF antenna from ever transmitting.",
    "case.beagle2.lesson": "Engineering Lesson: Redundant communication antennas prevent single-point mechanism failures. Salvaged Backup Antenna!",

    "exp.title": "PRIMARY OBJECTIVE 2: MARS SCIENCE LAB (0.38g & ATMOSPHERE)",
    "exp.subtitle": "Formulate a hypothesis, choose environment & control group, run the measurement minigame, and downlink results.",
    "exp.env_habitat": "Inside Habitat (101 kPa Earth Pressure, +20°C, 0.38g)",
    "exp.env_surface": "Martian Surface (~0.6 kPa CO2, -80°C..+10°C, 0.38g)",
    "exp.control_group": "Include Earth Control Group (+50% Science Score, +1.5 kWh Energy)",
    "exp.btn_run": "🔬 Run Experiment & Measure",

    "exp.pendulum_gravity.name": "Experiment 1: Pendulum Gravity Measurement (Tutorial)",
    "exp.pendulum_gravity.question": "How does a 1-meter simple pendulum oscillate on Mars compared to Earth?",
    "exp.pendulum_gravity.h1": "Oscillates slower (T ≈ 3.26 s, ~1.63x Earth's period)",
    "exp.pendulum_gravity.h2": "Oscillates faster (T ≈ 1.25 s)",
    "exp.pendulum_gravity.h3": "Gravity does not affect pendulum period (T ≈ 2.01 s)",
    "exp.pendulum_gravity.result": "Using T = 2π√(L/g), 10 swings took 32.6 s → g = 3.71 m/s² verified! (Bonus: Calibrated 0.38g locomotion)",

    "exp.free_fall_jump.name": "Experiment 2: Free Fall & 0.38g Jump Kinematics (Tutorial)",
    "exp.free_fall_jump.question": "How long does an object dropped from 2 meters take to hit the Martian ground?",
    "exp.free_fall_jump.h1": "~1.04 seconds (vs ~0.64 s on Earth); astronauts jump ~2.6x higher",
    "exp.free_fall_jump.h2": "~0.64 seconds (Thin atmosphere reduces drag)",
    "exp.free_fall_jump.h3": "~2.60 seconds floating down",
    "exp.free_fall_jump.result": "Measured 1.04 s via t = √(2h/g), matching our 0.38g character jump physics! (Bonus: EVA O2 efficiency)",

    "exp.seed_germination.name": "Experiment 3: Seed Germination in Martian Regolith (3 Groups)",
    "exp.seed_germination.question": "Under what condition do seeds germinate in Martian regolith?",
    "exp.seed_germination.h1": "Only in perchlorate-washed, fertilized soil inside a pressurized greenhouse",
    "exp.seed_germination.h2": "Directly in raw untreated Martian soil",
    "exp.seed_germination.h3": "Outdoors in 0.6 kPa CO2 atmosphere",
    "exp.seed_germination.result": "Raw perchlorate (0.5–1%) was toxic and outdoor moisture sublimated instantly. Washed pressurized soil achieved 84% germination! (Bonus: Greenhouse +30%)",

    "exp.water_boiling.name": "Experiment 4: Water Boiling at the Triple Point",
    "exp.water_boiling.question": "What happens to liquid water placed outdoors on Mars (~0.63 kPa pressure)?",
    "exp.water_boiling.h1": "Near the triple point (0.61 kPa), it boils and freezes simultaneously",
    "exp.water_boiling.h2": "Remains calm liquid water before slowly evaporating",
    "exp.water_boiling.h3": "Reacts with CO2 to form dense liquid acid",
    "exp.water_boiling.result": "At ~0.61 kPa, water boiled vigorously at 0°C while latent heat loss froze the remainder into ice! (Bonus: Closed-loop ice melting protection)",

    "exp.sound_speed.name": "Experiment 5: Speed of Sound in Martian Atmosphere",
    "exp.sound_speed.question": "How fast does sound travel in Mars's cold CO2 atmosphere compared to Earth (343 m/s)?",
    "exp.sound_speed.h1": "Slower (~240 m/s), with high-pitched sounds traveling slightly faster than bass",
    "exp.sound_speed.h2": "Faster (~480 m/s) due to thin air",
    "exp.sound_speed.h3": "Sound cannot propagate on Mars at all",
    "exp.sound_speed.result": "Just like Perseverance's microphone, a 50m acoustic test measured a 0.208s delay → ~240 m/s! (Bonus: Acoustic valve diagnostics)",

    "exp.moxie_efficiency.name": "Experiment 6: MOXIE Day vs. Night O2 Efficiency",
    "exp.moxie_efficiency.question": "How does MOXIE's solid-oxide electrolysis O2 output vary between day and night?",
    "exp.moxie_efficiency.h1": "Denser cold night air increases intake mass flow, yielding higher O2 (9.8 g/hr)",
    "exp.moxie_efficiency.h2": "Only works in daylight; CO2 freezes solid at night",
    "exp.moxie_efficiency.h3": "Atmospheric density has zero effect on output",
    "exp.moxie_efficiency.result": "Cold night air is denser, boosting compressor efficiency to 9.8 g/hr O2! (Bonus: Optimal MOXIE scheduling)",

    "crisis.joint_freeze.title": "❄️ CRISIS: EVA SUIT JOINT LUBRICANT FROZE (-80°C)",
    "crisis.joint_freeze.desc": "You are 900 m from the habitat. Extreme cold stiffened suit joints, cutting walking speed to 40%! The Point-of-No-Return notch just jumped up.",
    "crisis.joint_freeze.optA": "A) Walk Back Slowly (Cost: -28% O2, -10°C Suit Temp — if O2 is sufficient)",
    "crisis.joint_freeze.optB": "B) Boost Suit Heaters to Max (Cost: -8 kWh Battery, Speed restored to 100%, -12% O2)",
    "crisis.joint_freeze.optC": "C) Shelter at Nearby Wreck & Thaw with RHU Heat (Cost: +1 Hr, -8% O2, Uses RHU warmth)",
    "crisis.joint_freeze.advice": "Mission Control Analysis: Walking 900m at 40% speed risks O2 depletion. Choose B if battery >15 kWh, or C if RHU units are salvaged.",

    "crisis.dust_storm.title": "🌪️ CRISIS: SEVERE DUST STORM (OPTICAL DEPTH τ = 8.5)",
    "crisis.dust_storm.desc": "Solar array output dropped by 80% and visibility is zero! Without load shedding on the Power Panel (M3), batteries will die tonight.",
    "crisis.dust_storm.optA": "A) Suspend Greenhouse & Save Battery (Cost: -10% Sanity, Plant growth paused, saves +6 kWh)",
    "crisis.dust_storm.optB": "B) Suspend Lab & Comms (Cost: No downlink this Sol, -15 Mbit, Battery protected)",
    "crisis.dust_storm.optC": "C) Shut Down MOXIE & Use Backup O2 Tank (Cost: -18% O2 Reserve, saves +9 kWh)",
    "crisis.dust_storm.advice": "Mission Control Analysis: Opportunity was lost in 2018 due to power starvation. If O2 >60%, temporarily shed MOXIE or comms.",

    "crisis.frozen_valve.title": "🥶 CRISIS: MAV FUEL VALVE FROZEN AT -82°C NIGHT",
    "crisis.frozen_valve.desc": "Night temperature plunged to -82°C. The Mars Ascent Vehicle methane valve and water line are freezing!",
    "crisis.frozen_valve.optA": "A) Heat Electrically via Habitat Battery (Cost: -10 kWh Energy, Greenhouse unheated tonight)",
    "crisis.frozen_valve.optB": "B) Perform Night EVA Manual QTE Heating (Cost: -12% O2, +4 mSv Radiation, QTE Minigame)",
    "crisis.frozen_valve.optC": "C) Attach Repair Kit / RHU Isotope Heater (Cost: -1 Repair Kit or RHU, Zero energy loss)",
    "crisis.frozen_valve.advice": "Mission Control Analysis: Thick insulation or salvaged RHU makes Option C free; otherwise manual QTE saves battery.",

    "crisis.radiator_overheat.title": "🔥 CRISIS: HEAT REJECTION (RADIATOR) FAILURE IN THIN AIR",
    "crisis.radiator_overheat.desc": "Because Mars's atmosphere is ~0.6 kPa, air convection cannot cool electronics. Dust clogged the radiator loops, overheating MOXIE and cabin avionics!",
    "crisis.radiator_overheat.optA": "A) EVA to Brush & Purge Radiator Fins (Cost: -10% O2, Wires/Pipes Minigame)",
    "crisis.radiator_overheat.optB": "B) Throttle MOXIE & Avionics to 50% (Cost: -14% O2 output, -4 kWh, stops overheating)",
    "crisis.radiator_overheat.optC": "C) Flush Emergency Coolant Water (Cost: -15 Liters Water, instant cooling)",
    "crisis.radiator_overheat.advice": "Mission Control Analysis: Even when Mars is cold outside, spacecraft overheat without radiative heat rejection. Cleaning the radiator is best.",

    "crisis.marsquake_landslide.title": "🪨 CRISIS: NEARBY METEORITE IMPACT & M4.7 TREMOR",
    "crisis.marsquake_landslide.desc": "A tremor matching InSight's largest recorded Marsquake (~M4.7) and a nearby crater landslide shook the base! Shelves are toppling in 0.38g!",
    "crisis.marsquake_landslide.optA": "A) Seal O2 Pipe Leak First (Cost: Greenhouse tray falls -8% Sanity, O2 saved)",
    "crisis.marsquake_landslide.optB": "B) Brace Greenhouse & Lab Samples First (Cost: -14% O2 leak, Science data saved)",
    "crisis.marsquake_landslide.optC": "C) SEIS Early Warning / Repair Kit Clamp (Cost: 0 loss with SEIS, or -1 Repair Kit)",
    "crisis.marsquake_landslide.advice": "Mission Control Analysis: SEIS detects P-waves 30s early. Without SEIS, always prioritize life support (O2).",

    "crisis.solar_flare_spe.title": "☀️ CRISIS: SOLAR PARTICLE EVENT (SPE RADIATION STORM)",
    "crisis.solar_flare_spe.desc": "High-energy solar protons are bombarding Mars's unshielded surface! Hourly radiation dose spiked to 15 mSv/hr.",
    "crisis.solar_flare_spe.optA": "A) Shelter Inside Water-Shielded Core (Cost: No EVA this Sol, minimal +2 mSv dose)",
    "crisis.solar_flare_spe.optB": "B) Push Through Outdoor Tasks (Cost: +38 mSv Heavy Radiation Dose, -15% Sanity)",
    "crisis.solar_flare_spe.optC": "C) Run Autonomous Drone & Rovers Only (Cost: -5 kWh Energy, +4 mSv dose)",
    "crisis.solar_flare_spe.advice": "Mission Control Analysis: Exceeding the 150 mSv limit aborts the mission. Water tanks provide optimal hydrogen shielding.",

    "crisis.data_congestion.title": "📡 CRISIS: DOWNLINK BANDWIDTH FULL (MRO PASS LIMITED)",
    "crisis.data_congestion.desc": "Today's MRO relay pass is nearly full. You must prioritize between pending science packets and a video message from family on Earth.",
    "crisis.data_congestion.optA": "A) Prioritize Forensic Reports (Cost: Family video deferred -8% Sanity, +Forensics Score)",
    "crisis.data_congestion.optB": "B) Transmit Lab Experiment Data (Cost: -4 kWh X-Band Power, +Experiment Score)",
    "crisis.data_congestion.optC": "C) Download Family Video Message (Cost: -18 Mbit Bandwidth, +22% Sanity)",
    "crisis.data_congestion.advice": "Mission Control Analysis: If Sanity is below 40%, download the family message to prevent hallucinations; otherwise transmit science.",

    "crisis.perchlorate_dust.title": "☣️ CRISIS: TOXIC PERCHLORATE DUST IN AIRLOCK",
    "crisis.perchlorate_dust.desc": "Electrostatic Martian dust containing perchlorate salts (ClO4⁻) entered the airlock after EVA!",
    "crisis.perchlorate_dust.optA": "A) Water Wash & Electrostatic Scrubbing (Cost: -12 Liters Water, -2 kWh, Full Decontamination)",
    "crisis.perchlorate_dust.optB": "B) Vent & Purge Airlock Atmosphere (Cost: -16% O2 Reserve, saves water)",
    "crisis.perchlorate_dust.optC": "C) Overdrive HEPA Filters (Cost: -5 kWh, -10% Sanity)",
    "crisis.perchlorate_dust.advice": "Mission Control Analysis: Perchlorates harm thyroid function. Use water wash in ice-rich Arcadia, or O2 purge if MOXIE is active.",

    "crisis.dust_devil_bonus.title": "🌪️✨ POSITIVE EVENT: DUST DEVIL CLEANED SOLAR PANELS!",
    "crisis.dust_devil_bonus.desc": "Just like NASA's Spirit and Opportunity rovers experienced, a passing Martian dust devil swept away accumulated dust from your solar arrays!",
    "crisis.dust_devil_bonus.optA": "A) Maximize Recharge & Celebrate! (Reward: Panel Dust reset to 0%, +12 kWh Energy, +10% Sanity)",
    "crisis.dust_devil_bonus.optB": "B) Photograph Dust Devil & Recharge (Reward: Panels Cleaned + 35-pt Science Photo queued)",
    "crisis.dust_devil_bonus.advice": "Mission Control Analysis: Natural dust-devil cleaning events extended NASA's MER rovers from 90 Sols to over a decade!",

    "downlink.title": "M1: DATA BUDGET & DOWNLINK COMMUNICATIONS CONSOLE",
    "downlink.subtitle": "No photograph, forensic report, or experiment counts toward your score until transmitted to Earth!",
    "downlink.btn_send": "📡 Transmit",
    "downlink.sent_badge": "✅ Received by Earth (DSN)",
    "downlink.conjunction_alert": "☀️ SOLAR CONJUNCTION: The Sun is between Earth and Mars! Data transmission blocked.",

    "power.title": "M3: POWER LOAD PRIORITIZATION PANEL (LOAD SHEDDING)",
    "power.subtitle": "When power generation drops, lowest-priority systems shut down automatically. Reorder with Up/Down.",
    "power.life_support": "1. Cabin Life Support & CO2 Scrubber (220 W)",
    "power.heating": "2. Habitat & Valve Thermal Heaters (Heat Shield)",
    "power.greenhouse": "3. Pressurized Greenhouse & LEDs (100 W)",
    "power.moxie": "4. MOXIE Oxygen ISRU Reactor (300 W)",
    "power.experiments": "5. Science Lab Instruments (60 W)",
    "power.comms": "6. High-Gain Comms Amplifier (40 W)",

    "ufo.stage1": "SOL 14 — MAV LIFTOFF: Jezero Crater recedes below in a billowing cloud of rust-red dust...",
    "ufo.stage2": "ANOMALY DETECTED! A bright orb rose parallel to the MAV on the horizon and halted at an impossible angle! Cockpit camera triggered.",
    "ufo.stage3_high": "EARTH MISSION CONTROL (DSN LIVE): High-res Mastcam-Z telemetry frame downloading scanline by scanline... (80% Downloaded)",
    "ufo.stage3_low": "EARTH MISSION CONTROL (DSN LIVE): Low-res hand camera / low bandwidth frame downloading with heavy pixelation... (30% Downloaded)",
    "ufo.stage4_cut": "⚠️ ALERT: SOLAR CONJUNCTION — SIGNAL LOST!",
    "ufo.analyst_note": "NASA Analyst Note: 'Like Viking 1976's Face on Mars, this could be pareidolia or an ice-crystal reflection—your camera resolution and remaining data bandwidth determined how closely we could look. Design a new mission to verify.' (Note: This stinger is a fictional tribute to scientific skepticism.)",
    "ufo.btn_to_report": "📊 VIEW CAUSE-AND-EFFECT REPORT CARD",

    "report.title": "M5: CAUSE-AND-EFFECT REPORT CARD & NASA BENCHMARK",
    "report.subtitle": "Evaluation of how each engineering and operational choice shaped mission success",
    "report.tier_FULL_SUCCESS": "🏆 FULL MISSION SUCCESS",
    "report.tier_MIN_SUCCESS": "✅ MINIMUM MISSION SUCCESS",
    "report.tier_PARTIAL": "⚠️ PARTIAL SUCCESS — INSUFFICIENT DOWNLINK DATA",
    "report.tier_FAILED": "🚨 MISSION LOST — ENGINEERING LESSONS LEARNED",
    "report.btn_replay": "🔄 DESIGN YOUR NEXT MISSION (RETURN TO SOL 0)"
  }
}
;

// --- MODULE: src/core/engineering.js ---
/**
 * SOL 14: RED HORIZON — Mühendislik ve Fizik Motoru (K1)
 * Tüm formüller data/nasa_data.json içindeki doğrulanmış NASA sabitlerini kullanır.
 */


const NASA_DATA = nasaData;

/**
 * 1. Güneş Paneli Anlık Güç Üretimi (Watt)
 * Formül: P = S * A * eta * cos(Z) * (1 - d_toz)
 */
function calcSolarPower({
  irradiance = nasaData.constants.solarIrradianceMarsWm2.mean,
  area = nasaData.habitatOptions.baseHabitat.solarAreaM2,
  efficiency = nasaData.habitatOptions.baseHabitat.solarEfficiency,
  cosZ = 0.85,
  dustFactor = 0.08
} = {}) {
  const clampedDust = Math.max(0, Math.min(0.95, dustFactor));
  const clampedCosZ = Math.max(0, Math.min(1, cosZ));
  const power = irradiance * area * efficiency * clampedCosZ * (1 - clampedDust);
  return Math.round(power * 10) / 10;
}

/**
 * 2. Tsiolkovsky Roket Denklemi (m/s)
 * Formül: Δv = I_sp * g_0 * ln(m_0 / m_f)
 */
function calcDeltaV({
  isp = 365,
  wetMass = 7400,
  dryMass = 1750,
  g0 = nasaData.constants.marsGravityMs2.earthValue
} = {}) {
  if (wetMass <= 0 || dryMass <= 0 || wetMass <= dryMass) {
    return 0;
  }
  const dv = isp * g0 * Math.log(wetMass / dryMass);
  return Math.round(dv);
}

/**
 * 3. Dünya-Mars Tek Yön Işık Gecikmesi
 * Formül: t_gecikme = d_{Dünya-Mars} / c
 */
function calcLightDelay(distanceKm) {
  const c = nasaData.constants.speedOfLightKms.value;
  const seconds = Math.max(0, Math.round(distanceKm / c));
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return {
    seconds,
    minutes: Math.round((seconds / 60) * 100) / 100,
    roundTripSeconds: seconds * 2,
    formatted: `${minutes} dk ${String(remSec).padStart(2, '0')} sn`,
    formattedEn: `${minutes}m ${String(remSec).padStart(2, '0')}s`
  };
}

/**
 * Sol numarasına göre JPL Horizons mesafe ve ışık gecikmesini döndürür
 */
function getHorizonsForSol(sol = 1) {
  const table = nasaData.horizonsDistanceTable.bySol;
  const entry = table.find((r) => r.sol === sol) || table[table.length - 1];
  const distanceKm = entry.distanceMillionKm * 1e6;
  const delay = calcLightDelay(distanceKm);
  return {
    ...entry,
    distanceKm,
    ...delay
  };
}

/**
 * 4. Sarkaç Periyodu (Yerçekimi Deneyi)
 * Formül: T = 2 * pi * sqrt(L / g)
 */
function calcPendulumPeriod(
  lengthMeters = 1.0,
  gravity = nasaData.constants.marsGravityMs2.value
) {
  if (lengthMeters <= 0 || gravity <= 0) return 0;
  const period = 2 * Math.PI * Math.sqrt(lengthMeters / gravity);
  return Math.round(period * 100) / 100;
}

/**
 * 5. Serbest Düşüş Süresi (t = sqrt(2h / g))
 */
function calcFreeFallTime(
  heightMeters = 2.0,
  gravity = nasaData.constants.marsGravityMs2.value
) {
  if (heightMeters <= 0 || gravity <= 0) return 0;
  const time = Math.sqrt((2 * heightMeters) / gravity);
  return Math.round(time * 100) / 100;
}

/**
 * 6. Dönüşsüzlük Noktası (Point of No Return) Oksijen Hesabı (M4)
 * Formül: O2_gerekli = (mesafe / hiz_guncel) * tuketim * 1.2
 */
function calcPointOfNoReturnO2({
  distanceMeters = 0,
  jointFrozen = false,
  normalSpeedMPerMin = nasaData.constants.humanLifeSupport.evaNormalSpeedMPerMin,
  frozenFactor = nasaData.constants.humanLifeSupport.evaFrozenSpeedFactor,
  o2PerMinute = 1.08,
  safetyFactor = nasaData.constants.humanLifeSupport.pointOfNoReturnSafetyFactor
} = {}) {
  if (distanceMeters <= 0) return 0;
  const currentSpeed = jointFrozen
    ? normalSpeedMPerMin * frozenFactor
    : normalSpeedMPerMin;
  const travelMinutes = distanceMeters / currentSpeed;
  const requiredO2 = travelMinutes * o2PerMinute * safetyFactor;
  return Math.min(100, Math.round(requiredO2 * 10) / 10);
}

/**
 * 7. Sol 0 Görev Tasarımı Kütle, Bütçe, Güç, Veri ve Δv Hesaplayıcı
 */
function calcDesignTotals(design) {
  const rocket =
    nasaData.rockets.find((r) => r.id === design.rocketId) || nasaData.rockets[1];
  const orbit =
    nasaData.orbits.find((o) => o.id === design.orbitType) || nasaData.orbits[0];
  const site =
    nasaData.landingSites.find((s) => s.id === design.landingSiteId) ||
    nasaData.landingSites[1];
  const hab = nasaData.habitatOptions.baseHabitat;
  const pwr =
    nasaData.habitatOptions.powerSource[design.powerSource] ||
    nasaData.habitatOptions.powerSource.solar_only;
  const bat =
    nasaData.habitatOptions.batteries.find((b) => b.kwh === design.batteryKwh) ||
    nasaData.habitatOptions.batteries[1];
  const ins =
    nasaData.habitatOptions.insulation[design.insulation] ||
    nasaData.habitatOptions.insulation.thin;
  const comm =
    nasaData.habitatOptions.commSystems[design.commArchitecture] ||
    nasaData.habitatOptions.commSystems.relay_only;
  const kitCfg = nasaData.habitatOptions.repairKit;

  const selectedInstruments = (design.instruments || [])
    .map((id) => nasaData.instruments.find((inst) => inst.id === id))
    .filter(Boolean);

  const instrumentsMassKg = selectedInstruments.reduce((acc, i) => acc + i.massKg, 0);
  const instrumentsCostM = selectedInstruments.reduce((acc, i) => acc + i.costM, 0);
  const instrumentsPowerW = selectedInstruments.reduce((acc, i) => acc + i.powerW, 0);

  const repairKitsCount = Math.max(0, Math.min(2, design.repairKits || 0));
  const kitsMassKg = repairKitsCount * kitCfg.massKgPerKit;
  const kitsCostM = repairKitsCount * kitCfg.costMPerKit;

  const windowMissedCostM = design.launchWindowCaught
    ? 0
    : nasaData.constants.synodicPeriodMonths.missedWindowCostM;

  const massUsed = Math.round(
    (hab.massKg +
      pwr.massKg +
      bat.massKg +
      ins.massKg +
      comm.massKg +
      instrumentsMassKg +
      kitsMassKg) *
      10
  ) / 10;

  const massMax = Math.max(400, rocket.payloadMarsKg - orbit.payloadPenaltyKg);
  const massMarginPct =
    Math.round(((massMax - massUsed) / massMax) * 1000) / 10;

  const moneyUsed = Math.round(
    rocket.costM +
      orbit.costPenaltyM +
      windowMissedCostM +
      hab.costM +
      pwr.costM +
      bat.costM +
      ins.costM +
      comm.costM +
      instrumentsCostM +
      kitsCostM
  );
  const moneyMax = 1000;

  const solarProdW = calcSolarPower({
    area: hab.solarAreaM2,
    efficiency: hab.solarEfficiency,
    cosZ: site.cosZ,
    dustFactor: 0.08
  });
  const powerProdW = Math.round(solarProdW + pwr.rtgContinuousW);
  const powerConsW = Math.round(
    hab.basePowerConsW + ins.nightHeatingPowerW + instrumentsPowerW
  );

  // Gece 12 saatlik net enerji ihtiyacı vs batarya kapasitesi (kWh)
  const nightNetDrainW = Math.max(0, powerConsW - pwr.rtgContinuousW);
  const nightEnergyNeededKwh = Math.round(((nightNetDrainW * 12) / 1000) * 10) / 10;
  const batteryNightSafe = bat.kwh >= nightEnergyNeededKwh;

  // Δv hesabı
  const deltaVAvailableMs = calcDeltaV({
    isp: rocket.ispSec,
    wetMass: rocket.baseWetMassKg,
    dryMass: rocket.baseDryMassKg + (massUsed - 1000) * 0.35
  });

  // Tek Nokta Arıza (SPOF - M8) Uyarıları
  const spofWarnings = [];
  if (design.powerSource === 'solar_only') {
    spofWarnings.push('spof.no_rtg');
  }
  if (design.commArchitecture === 'relay_only') {
    spofWarnings.push('spof.no_xband');
  }
  if (repairKitsCount === 0) {
    spofWarnings.push('spof.no_repair_kit');
  }
  if (!batteryNightSafe || design.batteryKwh === 20) {
    spofWarnings.push('spof.small_battery');
  }
  if (design.insulation === 'thin' && site.id === 'arcadia') {
    spofWarnings.push('spof.thin_insulation_cold');
  }
  if (!design.instruments.includes('meda')) {
    spofWarnings.push('spof.no_meda');
  }
  if (massMarginPct < 10 && massMarginPct >= 0) {
    spofWarnings.push('spof.low_mass_margin');
  }

  const canLaunch =
    massUsed <= massMax &&
    moneyUsed <= moneyMax &&
    selectedInstruments.length >= 1 &&
    selectedInstruments.length <= 5;

  return {
    massUsed,
    massMax,
    massMarginPct,
    moneyUsed,
    moneyMax,
    powerProdW,
    powerConsW,
    solarProdW,
    rtgProdW: pwr.rtgContinuousW,
    nightEnergyNeededKwh,
    batteryNightSafe,
    dataPerSolMax: comm.dataPerSolMbit,
    deltaVAvailableMs,
    deltaVRequiredMs: orbit.deltaVRequiredMs,
    spofWarnings,
    canLaunch
  };
}

// --- MODULE: src/core/state.js ---
/**
 * SOL 14: RED HORIZON — Merkezi Durum Yönetimi (gameState), Event Bus ve Çeviri (K1)
 */


const STORAGE_KEY = 'sol14_save_v2';

// Olay Veri Yolu (Event Bus)
const listeners = new Map();

const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => this.off(event, fn);
  },
  off(event, fn) {
    if (listeners.has(event)) listeners.get(event).delete(fn);
  },
  emit(event, payload) {
    if (listeners.has(event)) {
      for (const fn of listeners.get(event)) {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[bus error on ${event}]`, err);
        }
      }
    }
  }
};

function createInitialState({ lang = 'tr', demoMode = false } = {}) {
  const defaultDesign = {
    objectiveFocus: 'balanced',
    rocketId: 'vulcan_centaur',
    orbitType: 'hohmann',
    launchWindowCaught: true,
    landingSiteId: 'jezero',
    powerSource: 'solar_rtg',
    batteryKwh: 40,
    insulation: 'thick',
    instruments: ['mastcam_z', 'meda', 'seis', 'moxie', 'veggie'],
    commArchitecture: 'relay_xband',
    repairKits: 1
  };

  const totals = calcDesignTotals(defaultDesign);

  const forensics = {};
  for (const c of NASA_DATA.forensicsCases) {
    forensics[c.id] = {
      id: c.id,
      discovered: c.id === 'opportunity' || c.id === 'insight',
      evidence: { photo: false, telemetry: false, env: false },
      diagnosis: null,
      queued: false,
      sent: false,
      score: 0,
      salvaged: false
    };
  }

  const experiments = {};
  for (const exp of NASA_DATA.experiments) {
    experiments[exp.id] = {
      id: exp.id,
      hypothesis: exp.correctHypothesis,
      environment: exp.preferredEnv,
      controlGroup: true,
      completed: false,
      queued: false,
      sent: false,
      measuredValue: null,
      score: 0,
      bonusUnlocked: false
    };
  }

  return {
    lang,
    demoMode,
    sol: 0,
    maxSols: demoMode ? 5 : 14,
    phase: 'design', // 'design' | 'transit' | 'surface' | 'ufo' | 'report'
    activeTab: 'surface', // 'surface' | 'map' | 'lab' | 'downlink' | 'power'
    timeOfDay: 'day', // 'day' | 'sunset' | 'night'
    rngSeed: 20261114,
    gameOverReason: null,

    design: defaultDesign,
    budgets: {
      ...totals,
      dataUsedThisSol: 0
    },

    resources: {
      o2: 96,
      energyKwh: 38,
      suitTempC: 18,
      radiationMsv: 14,
      sanity: 95,
      waterLiters: 85,
      mavFuelPct: 90,
      panelDust: 0.08,
      evaDistanceM: 250,
      jointFrozen: false,
      greenhouseFrozen: false
    },

    powerPriorities: [
      { id: 'life_support', labelKey: 'power.life_support', powerW: 220, active: true },
      { id: 'heating', labelKey: 'power.heating', powerW: 120, active: true },
      { id: 'greenhouse', labelKey: 'power.greenhouse', powerW: 100, active: true },
      { id: 'moxie', labelKey: 'power.moxie', powerW: 300, active: true },
      { id: 'experiments', labelKey: 'power.experiments', powerW: 60, active: true },
      { id: 'comms', labelKey: 'power.comms', powerW: 40, active: true }
    ],

    downlinkQueue: [],
    forensics,
    experiments,

    inventory: {
      repairKits: 1,
      rhuUnits: 0,
      spareAntenna: false,
      roboticArmPart: false,
      wheelPart: false,
      perchlorateWashed: false,
      anomalyPhotos: 0
    },

    activeCrisis: null,
    decisionLog: [],

    ufoEnding: {
      triggered: false,
      stage: 1,
      cameraTier: 'high',
      downloadPct: 80
    }
  };
}

let gameState = createInitialState();

function getState() {
  return gameState;
}

function updateState(updater) {
  if (typeof updater === 'function') {
    updater(gameState);
  } else if (updater && typeof updater === 'object') {
    Object.assign(gameState, updater);
  }
  saveStateToStorage();
  bus.emit('state:changed', gameState);
  return gameState;
}

function resetState(options = {}) {
  gameState = createInitialState({
    lang: options.lang || gameState.lang || 'tr',
    demoMode: Boolean(options.demoMode)
  });
  saveStateToStorage();
  bus.emit('state:changed', gameState);
  return gameState;
}

/**
 * Çift dilli (TR / EN) metin çekici: t('anahtar.yolu')
 */
function t(key, vars = {}) {
  const lang = gameState?.lang || 'tr';
  const dict = storyData[lang] || storyData.tr;
  let raw = dict[key] ?? storyData.tr[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    raw = raw.replaceAll(`{${k}}`, String(v));
  }
  return raw;
}

function setLanguage(lang) {
  if (lang === 'tr' || lang === 'en') {
    gameState.lang = lang;
    saveStateToStorage();
    bus.emit('state:changed', gameState);
  }
}

function logDecision({
  sol = gameState.sol,
  category = 'crisis',
  title,
  choice,
  costText = '',
  consequence = '',
  scoreImpact = 0
}) {
  gameState.decisionLog.push({
    sol,
    category,
    title,
    choice,
    costText,
    consequence,
    scoreImpact
  });
}

function saveStateToStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  } catch {
    // localStorage mevcut değilse (Node test ortamı) sessizce geç
  }
}

function loadStateFromStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.sol === 'number' && parsed.design && parsed.resources) {
          gameState = parsed;
          bus.emit('state:changed', gameState);
          return true;
        }
      }
    }
  } catch {
    // Bozuk kayıt varsa sıfırla
  }
  return false;
}

// --- MODULE: src/core/score.js ---
/**
 * SOL 14: RED HORIZON — Görev Başarı Puanı (GBP) ve Neden-Sonuç Karnesi (M5 - K1)
 */


function calcMissionScore(state) {
  const objCfg =
    NASA_DATA.objectives.find((o) => o.id === state.design.objectiveFocus) ||
    NASA_DATA.objectives[2];
  const sc = NASA_DATA.scoring;

  // Sadece Dünya'ya gönderilmiş (Downlink = sent) adli raporlar ve deneyler puan sayılır!
  const sentForensics = Object.values(state.forensics || {}).filter((f) => f.sent);
  const sentExperiments = Object.values(state.experiments || {}).filter((e) => e.sent);
  const sentPhotos = (state.downlinkQueue || []).filter(
    (item) => item.type === 'photo' && item.sent
  );

  const rawForensicsScore = sentForensics.reduce((sum, f) => sum + (f.score || 0), 0);
  const rawExperimentsScore = sentExperiments.reduce((sum, e) => sum + (e.score || 0), 0);
  const photosScore = sentPhotos.reduce((sum, p) => sum + (p.points || 0), 0);

  const forensicsScore = Math.round(rawForensicsScore * objCfg.forensicsMultiplier);
  const experimentsScore = Math.round(
    rawExperimentsScore * objCfg.experimentsMultiplier + photosScore
  );

  const survivedAllSols = !state.gameOverReason && state.sol >= state.maxSols;
  const survivalScore =
    state.sol * sc.survivalPerSolPoints +
    (survivedAllSols ? sc.safeReturnBonusPoints : 0);

  const marginBonus =
    state.budgets.massMarginPct >= sc.massMarginBonusThresholdPct
      ? sc.massMarginBonusPoints
      : 0;

  let lostSystemsCount = 0;
  if (state.resources.greenhouseFrozen) lostSystemsCount += 1;
  if (state.resources.o2 <= 0) lostSystemsCount += 1;
  if (state.resources.energyKwh <= 0) lostSystemsCount += 1;

  const penalties = lostSystemsCount * sc.lostSystemPenaltyPoints;

  const total = Math.max(
    0,
    forensicsScore + experimentsScore + survivalScore + marginBonus - penalties
  );

  // Asgari Başarı vs Tam Başarı Eşikleri (Demo modda ölçekli)
  const minReqF = state.demoMode ? 1 : objCfg.minSuccess.forensicsSent;
  const minReqE = state.demoMode ? 1 : objCfg.minSuccess.experimentsSent;
  const fullReqF = state.demoMode ? 2 : objCfg.fullSuccess.forensicsSent;
  const fullReqE = state.demoMode ? 2 : objCfg.fullSuccess.experimentsSent;

  let tier = 'PARTIAL';
  if (state.gameOverReason) {
    tier = 'FAILED';
  } else if (
    sentForensics.length >= fullReqF &&
    sentExperiments.length >= fullReqE &&
    survivedAllSols
  ) {
    tier = 'FULL_SUCCESS';
  } else if (sentForensics.length >= minReqF && sentExperiments.length >= minReqE) {
    tier = 'MIN_SUCCESS';
  }

  // UFO Stinger kamera ve kalan veri bütçesi çözünürlük hesabı
  const hasHighResCam = state.design.instruments.includes('mastcam_z');
  const remainingDataMbit = Math.max(
    0,
    state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol
  );
  const ufoDownloadPct = hasHighResCam && remainingDataMbit >= 15 ? 80 : 30;

  return {
    total,
    forensicsScore,
    experimentsScore,
    survivalScore,
    marginBonus,
    penalties,
    sentForensicsCount: sentForensics.length,
    sentExperimentsCount: sentExperiments.length,
    tier,
    ufoDownloadPct,
    cameraTier: hasHighResCam ? 'high' : 'low'
  };
}

/**
 * M5: Neden-Sonuç Karnesi (Cause-and-Effect Chains) Üretici
 */
function buildCauseEffectChains(state) {
  const chains = [];
  const d = state.design;
  const lang = state.lang || 'tr';

  // 1. Enerji ve Gece Soğuğu Zinciri
  if (d.powerSource === 'solar_rtg' && d.insulation === 'thick') {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? 'Sol 0: MMRTG (+110 W) + Kalın Yalıtım seçildi'
          : 'Sol 0: Selected MMRTG (+110 W) + Thick Insulation',
      outcome:
        lang === 'tr'
          ? 'Kum fırtınasında ve -80°C gecelerde ısıtma kesilmedi; sera ve valfler korundu (+150 Puan Etkisi)'
          : 'Heating survived dust storms and -80°C nights; greenhouse and valves protected (+150 pt impact)'
    });
  } else if (d.batteryKwh === 20 || d.insulation === 'thin') {
    chains.push({
      type: 'negative',
      decision:
        lang === 'tr'
          ? `Sol 0: ${d.batteryKwh} kWh Batarya ve ${d.insulation === 'thin' ? 'İnce' : 'Kalın'} Yalıtım seçildi`
          : `Sol 0: Selected ${d.batteryKwh} kWh Battery & ${d.insulation} Insulation`,
      outcome:
        lang === 'tr'
          ? 'Gece -80°C soğuğunda ısıtma yükü bataryayı zorladı, güç kesintisi (Load Shedding) tetiklendi (-120 Puan Riski)'
          : 'Night -80°C heating load strained battery, forcing emergency Load Shedding (-120 pt risk)'
    });
  }

  // 2. Kamera ve Veri Bütçesi -> UFO ve Adli Kanıt Zinciri
  if (d.instruments.includes('mastcam_z') && d.commArchitecture === 'relay_xband') {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? 'Sol 0: Mastcam-Z Kamera + X-Band (80 Mbit/sol) İletişim seçildi'
          : 'Sol 0: Selected Mastcam-Z + X-Band (80 Mbit/sol) Comms',
      outcome:
        lang === 'tr'
          ? 'Enkaz fotoğrafları tam puan aldı, veri kuyruğu tıkanmadı ve Sol 14 UFO anomalisi %80 net indirildi'
          : 'Forensic photos scored 100%, downlink queue cleared, and Sol 14 UFO anomaly downloaded at 80% clarity'
    });
  } else {
    chains.push({
      type: 'warning',
      decision:
        lang === 'tr'
          ? 'Sol 0: Düşük Kamera veya Sınırlı UHF Röle (45 Mbit/sol) seçildi'
          : 'Sol 0: Hand Camera or Limited UHF Relay (45 Mbit/sol) selected',
      outcome:
        lang === 'tr'
          ? 'Veri darboğazı yaşandı; bazı bulgular Dünya’ya ulaşamadı ve UFO fotoğrafı %30 bulanık indi'
          : 'Bandwidth bottleneck delayed science packets and limited UFO telemetry image to 30% blurry scan'
    });
  }

  // 3. Kütle Marjı Zinciri
  if (state.budgets.massMarginPct >= 10) {
    chains.push({
      type: 'positive',
      decision:
        lang === 'tr'
          ? `Sol 0: %${state.budgets.massMarginPct} Kütle Marjı bırakıldı (NASA Standardı ≥%10)`
          : `Sol 0: Left ${state.budgets.massMarginPct}% Mass Margin (NASA Standard ≥10%)`,
      outcome:
        lang === 'tr'
          ? 'İniş ve MAV kalkış Δv dengesi güvende kaldı (+120 Mühendislik Marj Bonusu)'
          : 'Entry and MAV ascent Δv margin remained safe (+120 Engineering Margin Bonus)'
    });
  }

  // 4. Operasyonel Karar Günlüğü (decisionLog) Kayıtları
  for (const log of state.decisionLog.slice(-4)) {
    chains.push({
      type: log.scoreImpact >= 0 ? 'positive' : 'warning',
      decision: `Sol ${log.sol}: ${log.title} → ${log.choice}`,
      outcome: `${log.costText} ${log.consequence}`.trim()
    });
  }

  return chains;
}

// --- MODULE: src/core/events.js ---
/**
 * SOL 14: RED HORIZON — Olay Motoru, Kriz Kartları (M2) ve Gecikmeli Görev Kontrol (M7 - K2)
 */


const CRISIS_CATALOG = [
  {
    id: 'joint_freeze',
    fxType: 'frost',
    titleKey: 'crisis.joint_freeze.title',
    descKey: 'crisis.joint_freeze.desc',
    adviceKey: 'crisis.joint_freeze.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.joint_freeze.optA',
        costSummary: '-28% O2, -10°C Isı',
        apply(s) {
          s.resources.o2 = Math.max(0, s.resources.o2 - 28);
          s.resources.suitTempC -= 10;
          s.resources.evaDistanceM = 0;
          s.resources.jointFrozen = false;
          return { consequence: 'Yavaş yürüyüşle habitata dönüldü, O2 rezervi azaldı.', scoreImpact: -20 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.joint_freeze.optB',
        costSummary: '-8 kWh Batarya, -12% O2',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 8);
          s.resources.o2 = Math.max(0, s.resources.o2 - 12);
          s.resources.suitTempC = 16;
          s.resources.evaDistanceM = 0;
          s.resources.jointFrozen = false;
          return { consequence: 'Elbise ısıtıcısıyla eklemler çözüldü ve güvenle dönüldü.', scoreImpact: 25 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.joint_freeze.optC',
        costSummary: '-8% O2, RHU Atık Isısı',
        apply(s) {
          s.resources.o2 = Math.max(0, s.resources.o2 - 8);
          s.resources.suitTempC = 18;
          s.resources.evaDistanceM = 150;
          s.resources.jointFrozen = false;
          return { consequence: 'Enkazdaki RHU radyoizotop ısısıyla eklemler çözüldü!', scoreImpact: 40 };
        }
      }
    ]
  },
  {
    id: 'dust_storm',
    fxType: 'storm',
    titleKey: 'crisis.dust_storm.title',
    descKey: 'crisis.dust_storm.desc',
    adviceKey: 'crisis.dust_storm.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.dust_storm.optA',
        costSummary: '-10% Akıl Sağlığı, +6 kWh Koruma',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 10);
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 6);
          s.resources.panelDust = Math.min(0.85, s.resources.panelDust + 0.25);
          return { consequence: 'Sera geçici kapatılarak yaşam desteği bataryası korundu.', scoreImpact: 15 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.dust_storm.optB',
        costSummary: '-15 Mbit Veri Bütçesi, Batarya Korunur',
        apply(s) {
          s.budgets.dataUsedThisSol = Math.min(
            s.budgets.dataPerSolMax,
            s.budgets.dataUsedThisSol + 15
          );
          s.resources.panelDust = Math.min(0.85, s.resources.panelDust + 0.2);
          return { consequence: 'Laboratuvar ve iletişim yükü kesilerek fırtına atlatıldı.', scoreImpact: 20 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.dust_storm.optC',
        costSummary: '-18% O2 Rezervi, +9 kWh Koruma',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 18);
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 9);
          return { consequence: 'MOXIE(300W) kapatıldı, yedek O2 tüpüyle fırtına geçildi.', scoreImpact: 10 };
        }
      }
    ]
  },
  {
    id: 'frozen_valve',
    fxType: 'frost',
    titleKey: 'crisis.frozen_valve.title',
    descKey: 'crisis.frozen_valve.desc',
    adviceKey: 'crisis.frozen_valve.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.frozen_valve.optA',
        costSummary: '-10 kWh Enerji',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 10);
          return { consequence: 'MAV valfi batarya gücüyle ısıtıldı.', scoreImpact: 10 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.frozen_valve.optB',
        costSummary: '-12% O2, +4 mSv Radyasyon',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 12);
          s.resources.radiationMsv += 4;
          return { consequence: 'Gece EVA çıkışı ile donmuş valf manuel olarak çözüldü.', scoreImpact: 20 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.frozen_valve.optC',
        costSummary: 'Tamir Kiti / RHU Kullanımı',
        apply(s) {
          if (s.inventory.rhuUnits > 0) {
            return { consequence: 'Sökülen RHU ısıtıcı ünitesi valfi enerji harcamadan korudu!', scoreImpact: 45 };
          }
          if (s.inventory.repairKits > 0) {
            s.inventory.repairKits -= 1;
            return { consequence: 'Tamir kiti kullanılarak valf izole edildi.', scoreImpact: 35 };
          }
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 12);
          return { consequence: 'Yedek kit olmadığı için acil batarya gücü çekildi.', scoreImpact: -15 };
        }
      }
    ]
  },
  {
    id: 'radiator_overheat',
    fxType: 'clear',
    titleKey: 'crisis.radiator_overheat.title',
    descKey: 'crisis.radiator_overheat.desc',
    adviceKey: 'crisis.radiator_overheat.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.radiator_overheat.optA',
        costSummary: '-10% O2 (EVA Radyatör Temizliği)',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 10);
          return { consequence: 'Radyatör kanatlarındaki toz temizlendi, ısı atımı normale döndü.', scoreImpact: 30 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.radiator_overheat.optB',
        costSummary: '-14% O2, -4 kWh',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 14);
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 4);
          return { consequence: 'MOXIE gücü kısılarak kabin aşırı ısınması durduruldu.', scoreImpact: 10 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.radiator_overheat.optC',
        costSummary: '-15 Litre Su',
        apply(s) {
          s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 15);
          return { consequence: 'Yedek soğutma suyu pompalanarak sistem soğutuldu.', scoreImpact: 15 };
        }
      }
    ]
  },
  {
    id: 'marsquake_landslide',
    fxType: 'quake',
    titleKey: 'crisis.marsquake_landslide.title',
    descKey: 'crisis.marsquake_landslide.desc',
    adviceKey: 'crisis.marsquake_landslide.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.marsquake_landslide.optA',
        costSummary: '-8% Akıl Sağlığı, O2 Korunur',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 8);
          return { consequence: 'O2 hattı korundu, devrilen sera rafı yeniden toplandı.', scoreImpact: 15 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.marsquake_landslide.optB',
        costSummary: '-14% O2 Sızıntısı, Deneyler Korunur',
        apply(s) {
          s.resources.o2 = Math.max(5, s.resources.o2 - 14);
          return { consequence: 'Deney tüpleri kurtarıldı ancak hava kilidinden O2 sızdı.', scoreImpact: 10 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.marsquake_landslide.optC',
        costSummary: 'SEIS Sismometresi / Tamir Kiti',
        apply(s) {
          if (s.design.instruments.includes('seis')) {
            return { consequence: 'SEIS 30 sn önceden uyardı! Tüm raflar sıfır kayıpla kilitlendi.', scoreImpact: 50 };
          }
          if (s.inventory.repairKits > 0) {
            s.inventory.repairKits -= 1;
            return { consequence: 'Tamir kitiyle sarsıntı hasarı anında onarıldı.', scoreImpact: 30 };
          }
          s.resources.o2 = Math.max(5, s.resources.o2 - 16);
          return { consequence: 'SEIS olmadığı için sarsıntı hazırlıksız yakaladı (-16% O2).', scoreImpact: -20 };
        }
      }
    ]
  },
  {
    id: 'solar_flare_spe',
    fxType: 'hallucination',
    titleKey: 'crisis.solar_flare_spe.title',
    descKey: 'crisis.solar_flare_spe.desc',
    adviceKey: 'crisis.solar_flare_spe.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.solar_flare_spe.optA',
        costSummary: '+2 mSv Minimal Doz (Su Kalkanı)',
        apply(s) {
          s.resources.radiationMsv += 2;
          s.resources.evaDistanceM = 0;
          return { consequence: 'Su tanklı sığınakta güneş patlaması güvenle atlatıldı.', scoreImpact: 35 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.solar_flare_spe.optB',
        costSummary: '+38 mSv Radyasyon, -15% Akıl Sağlığı',
        apply(s) {
          s.resources.radiationMsv += 38;
          s.resources.sanity = Math.max(5, s.resources.sanity - 15);
          return { consequence: 'Açık yüzeyde yüksek enerjili proton dozuna maruz kalındı!', scoreImpact: -35 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.solar_flare_spe.optC',
        costSummary: '-5 kWh Enerji, +4 mSv Doz',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 5);
          s.resources.radiationMsv += 4;
          return { consequence: 'Sığınaktan çıkmadan otonom drone ile veri toplandı.', scoreImpact: 25 };
        }
      }
    ]
  },
  {
    id: 'data_congestion',
    fxType: 'clear',
    titleKey: 'crisis.data_congestion.title',
    descKey: 'crisis.data_congestion.desc',
    adviceKey: 'crisis.data_congestion.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.data_congestion.optA',
        costSummary: '-8% Akıl Sağlığı, Adli Rapor Gönderilir',
        apply(s) {
          s.resources.sanity = Math.max(5, s.resources.sanity - 8);
          const unsent = s.downlinkQueue.find((p) => !p.sent);
          if (unsent) {
            unsent.sent = true;
            if (unsent.type === 'forensic' && s.forensics[unsent.refId]) {
              s.forensics[unsent.refId].sent = true;
            }
          }
          return { consequence: 'MRO rölesinden bilimsel adli rapor öncelikli gönderildi.', scoreImpact: 30 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.data_congestion.optB',
        costSummary: '-4 kWh X-Band Gücü, Deney Gönderilir',
        apply(s) {
          s.resources.energyKwh = Math.max(0, s.resources.energyKwh - 4);
          const unsentExp = s.downlinkQueue.find((p) => p.type === 'experiment' && !p.sent);
          if (unsentExp) {
            unsentExp.sent = true;
            if (s.experiments[unsentExp.refId]) s.experiments[unsentExp.refId].sent = true;
          }
          return { consequence: 'Yüksek güçlü X-Band ile deney paketi Dünya’ya ulaştırıldı.', scoreImpact: 30 };
        }
      },
      {
        id: 'C',
        labelKey: 'crisis.data_congestion.optC',
        costSummary: '-18 Mbit Veri, +22% Akıl Sağlığı',
        apply(s) {
          s.budgets.dataUsedThisSol = Math.min(
            s.budgets.dataPerSolMax,
            s.budgets.dataUsedThisSol + 18
          );
          s.resources.sanity = Math.min(100, s.resources.sanity + 22);
          return { consequence: 'Aileden gelen video mesajı izlendi, moral ve odak yenilendi!', scoreImpact: 20 };
        }
      }
    ]
  },
  {
    id: 'dust_devil_bonus',
    fxType: 'dust_devil',
    titleKey: 'crisis.dust_devil_bonus.title',
    descKey: 'crisis.dust_devil_bonus.desc',
    adviceKey: 'crisis.dust_devil_bonus.advice',
    options: [
      {
        id: 'A',
        labelKey: 'crisis.dust_devil_bonus.optA',
        costSummary: 'ÖDÜL: Panel Tozu %0, +12 kWh, +10% Sanity',
        apply(s) {
          s.resources.panelDust = 0.0;
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 12);
          s.resources.sanity = Math.min(100, s.resources.sanity + 10);
          return { consequence: 'Toz şeytanı güneş panellerini tertemiz yaptı, bataryalar doldu!', scoreImpact: 45 };
        }
      },
      {
        id: 'B',
        labelKey: 'crisis.dust_devil_bonus.optB',
        costSummary: 'ÖDÜL: Panel Temizlenir + 35 Puanlık Fotoğraf',
        apply(s) {
          s.resources.panelDust = 0.0;
          s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 8);
          s.downlinkQueue.push({
            id: `photo_dd_${s.sol}`,
            type: 'photo',
            refId: 'dust_devil',
            title: 'Toz Şeytanı (Dust Devil) Meteoroloji Fotoğrafı',
            sizeMbit: 12,
            points: 35,
            sent: false
          });
          return { consequence: 'Paneller temizlendi ve nadir meteoroloji fotoğrafı kuyruğa eklendi!', scoreImpact: 55 };
        }
      }
    ]
  }
];

/**
 * Belirli bir krizi veya Sol numarasına göre sıradaki olayı tetikler
 */
function pickAndTriggerSolEvent(forcedId = null) {
  const state = getState();
  let chosen = null;

  if (forcedId) {
    chosen = CRISIS_CATALOG.find((c) => c.id === forcedId);
  } else {
    // Sol bazlı dengeli ve öğretici olay dizisi
    const order = state.demoMode
      ? ['joint_freeze', 'dust_storm', 'dust_devil_bonus', 'marsquake_landslide']
      : [
          'joint_freeze',
          'radiator_overheat',
          'dust_devil_bonus',
          'marsquake_landslide',
          'dust_storm',
          'frozen_valve',
          'solar_flare_spe',
          'data_congestion'
        ];
    const idx = (state.sol - 2 + order.length) % order.length;
    const id = order[idx];
    chosen = CRISIS_CATALOG.find((c) => c.id === id) || CRISIS_CATALOG[0];
  }

  if (!chosen) return;

  const horizons = getHorizonsForSol(state.sol);

  updateState((s) => {
    s.activeCrisis = {
      id: chosen.id,
      fxType: chosen.fxType,
      titleKey: chosen.titleKey,
      descKey: chosen.descKey,
      adviceKey: chosen.adviceKey,
      options: chosen.options.map((o) => ({
        id: o.id,
        labelKey: o.labelKey,
        costSummary: o.costSummary
      })),
      missionControlConsulted: false,
      lightDelayFormatted: horizons.formatted,
      roundTripMin: Math.round(horizons.minutes * 2 * 10) / 10
    };
  });

  bus.emit('fx:weather', { type: chosen.fxType });
  bus.emit('audio:play', chosen.id === 'dust_devil_bonus' ? 'scan' : 'alarm');
}

/**
 * M7: Gecikmeli Görev Kontrol'e Danış (2x Işık Gecikmesi bekletir ve tavsiyeyi açar)
 */
function consultMissionControl() {
  updateState((s) => {
    if (!s.activeCrisis || s.activeCrisis.missionControlConsulted) return;
    s.activeCrisis.missionControlConsulted = true;
    // Bekleme süresinde biraz O2/enerji harcanır (Işık gecikmesinin gerçek bedeli!)
    s.resources.o2 = Math.max(2, Math.round((s.resources.o2 - 3) * 10) / 10);
  });
  bus.emit('audio:play', 'downlink');
}

/**
 * Kriz Kartında Seçilen Seçeneği Uygular ve decisionLog[]'a Yazar (M2)
 */
function resolveCrisisOption(optionId) {
  const state = getState();
  if (!state.activeCrisis) return;

  const crisisDef = CRISIS_CATALOG.find((c) => c.id === state.activeCrisis.id);
  const optDef = crisisDef?.options.find((o) => o.id === optionId);
  if (!crisisDef || !optDef) return;

  updateState((s) => {
    const res = optDef.apply(s);
    logDecision({
      sol: s.sol,
      category: 'crisis',
      title: t(crisisDef.titleKey),
      choice: t(optDef.labelKey),
      costText: `[${optDef.costSummary}]`,
      consequence: res.consequence,
      scoreImpact: res.scoreImpact
    });
    s.activeCrisis = null;
  });

  bus.emit('fx:weather', { type: 'clear' });
  bus.emit('audio:play', 'click');
}

// --- MODULE: src/core/sim.js ---
/**
 * SOL 14: RED HORIZON — Simülasyon Motoru (K2)
 * Gündüz/Gece döngüsü, 0.38g yüzey hareketi, Güç Yükü (M3), Dönüşsüzlük Noktası (M4) ve Sol geçişleri.
 */


/**
 * Sol 0 tasarımını tamamlayıp görevi başlatır (Sol 1'e geçiş)
 */
function launchMissionFromDesign() {
  const state = getState();
  const totals = calcDesignTotals(state.design);
  if (!totals.canLaunch) {
    return { ok: false, reason: 'limits_exceeded' };
  }

  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];
  const orbit =
    NASA_DATA.orbits.find((o) => o.id === state.design.orbitType) ||
    NASA_DATA.orbits[0];
  const ins =
    NASA_DATA.habitatOptions.insulation[state.design.insulation] ||
    NASA_DATA.habitatOptions.insulation.thick;

  updateState((s) => {
    s.sol = 1;
    s.phase = 'surface';
    s.activeTab = 'surface';
    s.timeOfDay = 'day';
    s.gameOverReason = null;
    s.budgets = {
      ...totals,
      dataUsedThisSol: 0
    };

    s.resources.o2 = 100;
    s.resources.energyKwh = s.design.batteryKwh;
    s.resources.suitTempC = site.dayTempC;
    s.resources.radiationMsv = orbit.transitRadiationMsv;
    s.resources.sanity = s.design.launchWindowCaught ? 100 : 88;
    s.resources.waterLiters = Math.round(
      80 * (1 + orbit.initialSuppliesBonusPct / 100) * (0.7 + site.iceAccessibility * 0.5)
    );
    s.resources.mavFuelPct = s.design.orbitType === 'fast_transfer' ? 88 : 95;
    s.resources.panelDust = 0.06;
    s.resources.evaDistanceM = 200;
    s.resources.jointFrozen = false;
    s.resources.greenhouseFrozen = false;

    s.inventory.repairKits = s.design.repairKits;
    s.inventory.rhuUnits = s.design.powerSource === 'solar_rtg' ? 2 : 0;
    s.inventory.spareAntenna = s.design.commArchitecture === 'relay_xband';

    // Isıtma gücünü yalıtım seçimine göre güncelle
    const heatItem = s.powerPriorities.find((p) => p.id === 'heating');
    if (heatItem) heatItem.powerW = ins.nightHeatingPowerW;

    // MOXIE ve Veggie seçilmediyse güç listesinden pasifleştir
    const moxieItem = s.powerPriorities.find((p) => p.id === 'moxie');
    if (moxieItem) moxieItem.active = s.design.instruments.includes('moxie');

    const ghItem = s.powerPriorities.find((p) => p.id === 'greenhouse');
    if (ghItem) ghItem.active = s.design.instruments.includes('veggie');

    logDecision({
      sol: 0,
      category: 'design',
      title: 'Sol 0 Görev Tasarımı',
      choice: `${site.id.toUpperCase()} | ${s.design.batteryKwh}kWh | ${s.design.instruments.length} Alet`,
      costText: `${totals.massUsed}/${totals.massMax} kg (%${totals.massMarginPct} Marj), $${totals.moneyUsed}M`,
      consequence:
        totals.spofWarnings.length === 0
          ? 'Yedekli NASA standardı tasarım'
          : `${totals.spofWarnings.length} adet SPOF riski mevcut`,
      scoreImpact: totals.massMarginPct >= 10 ? 50 : 0
    });
  });

  bus.emit('audio:play', 'launch');
  bus.emit('fx:weather', { type: 'clear', timeOfDay: 'day' });
  return { ok: true };
}

/**
 * M4: Dönüşsüzlük Noktası (Point of No Return) canlı durumunu hesaplar
 */
function getPointOfNoReturnStatus(state = getState()) {
  const requiredO2 = calcPointOfNoReturnO2({
    distanceMeters: state.resources.evaDistanceM,
    jointFrozen: state.resources.jointFrozen
  });
  const currentO2 = state.resources.o2;
  const marginO2 = Math.round((currentO2 - requiredO2) * 10) / 10;
  const isCritical = currentO2 <= requiredO2 + 5;
  return {
    requiredO2,
    currentO2,
    marginO2,
    isCritical
  };
}

/**
 * M3: Güç Yük Önceliklendirme (Load Shedding) — Güç yetmediğinde en alttaki sistemleri otomatik kapatır
 */
function applyPowerLoadShedding(state = getState()) {
  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];
  const hab = NASA_DATA.habitatOptions.baseHabitat;
  const pwr =
    NASA_DATA.habitatOptions.powerSource[state.design.powerSource] ||
    NASA_DATA.habitatOptions.powerSource.solar_only;

  const isStorm = state.activeCrisis?.id === 'dust_storm';
  const effectiveDust = isStorm
    ? Math.max(0.8, state.resources.panelDust)
    : state.resources.panelDust;

  const solarW = calcSolarPower({
    area: hab.solarAreaM2,
    efficiency: hab.solarEfficiency,
    cosZ: state.timeOfDay === 'night' ? 0.15 : site.cosZ,
    dustFactor: effectiveDust
  });

  // Günlük ortalama kullanılabilir güç (Gündüz solar + 24 saat RTG + Batarya tamponu)
  const rtgW = pwr.rtgContinuousW + state.inventory.rhuUnits * 3;
  const batterySupportW = state.resources.energyKwh * 12;
  const availablePowerW = Math.round(solarW * 0.18 + rtgW + batterySupportW);

  let usedW = 0;
  const shedSystems = [];

  for (const item of state.powerPriorities) {
    // Eğer alet Sol 0'da hiç alınmadıysa kapalı kalır
    if (item.id === 'moxie' && !state.design.instruments.includes('moxie')) {
      item.active = false;
      continue;
    }
    if (usedW + item.powerW <= availablePowerW || item.id === 'life_support') {
      item.active = true;
      usedW += item.powerW;
    } else {
      item.active = false;
      shedSystems.push(item.id);
    }
  }

  state.budgets.powerProdW = availablePowerW;
  state.budgets.powerConsW = usedW;
  return { availablePowerW, usedW, shedSystems };
}

/**
 * Güç Yük Öncelik Sırasını Değiştirir (Yukarı / Aşağı)
 */
function movePowerPriority(index, direction) {
  updateState((s) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= s.powerPriorities.length) return;
    const temp = s.powerPriorities[index];
    s.powerPriorities[index] = s.powerPriorities[targetIdx];
    s.powerPriorities[targetIdx] = temp;
    applyPowerLoadShedding(s);
  });
  bus.emit('audio:play', 'click');
}

/**
 * Yüzeyde EVA Mesafesini Değiştirme / Yürüme ve 0.38g Zıplama
 */
function performEvaStep(deltaMeters = 150) {
  const state = getState();
  if (state.phase !== 'surface') return;

  updateState((s) => {
    const prevDist = s.resources.evaDistanceM;
    const nextDist = Math.max(0, Math.min(1150, prevDist + deltaMeters));
    const moved = Math.abs(nextDist - prevDist);
    s.resources.evaDistanceM = nextDist;

    // Deney 2 bonusu varsa %25 daha az O2 harcar
    const jumpBonus = s.experiments.free_fall_jump?.bonusUnlocked ? 0.75 : 1.0;
    const freezePenalty = s.resources.jointFrozen ? 1.6 : 1.0;
    const o2Cost = Math.round(((moved / 100) * 2.2 * jumpBonus * freezePenalty) * 10) / 10;
    s.resources.o2 = Math.max(0, Math.round((s.resources.o2 - o2Cost) * 10) / 10);

    // 800m ötesinde soğukta eklem donması riski
    if (nextDist >= 800 && !s.resources.jointFrozen && s.resources.suitTempC < 0) {
      s.resources.jointFrozen = true;
    } else if (nextDist === 0) {
      s.resources.jointFrozen = false;
    }
  });

  const ponr = getPointOfNoReturnStatus();
  if (ponr.isCritical && !getState().activeCrisis) {
    pickAndTriggerSolEvent('joint_freeze');
  }
}

/**
 * Güneş Panellerini Temizle (O2 harcar, panel tozunu sıfırlar)
 */
function cleanSolarPanels() {
  updateState((s) => {
    if (s.resources.o2 <= 8) return;
    s.resources.o2 = Math.max(0, Math.round((s.resources.o2 - 6) * 10) / 10);
    s.resources.panelDust = 0.02;
    s.resources.energyKwh = Math.min(s.design.batteryKwh, s.resources.energyKwh + 6);
    applyPowerLoadShedding(s);
  });
  bus.emit('audio:play', 'scan');
}

/**
 * Sabatier ISRU Reaktörü (CO2 + 4H2 -> CH4 + 2H2O) ve Elektroliz ile O2 + MAV Yakıtı Üretimi
 */
function runSabatierIsru() {
  updateState((s) => {
    if (s.resources.energyKwh < 5 || s.resources.waterLiters < 6) return;
    s.resources.energyKwh = Math.max(0, Math.round((s.resources.energyKwh - 5) * 10) / 10);
    s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 6);
    const moxieBonus = s.experiments.moxie_efficiency?.bonusUnlocked ? 18 : 14;
    s.resources.o2 = Math.min(100, Math.round((s.resources.o2 + moxieBonus) * 10) / 10);
    s.resources.mavFuelPct = Math.min(100, s.resources.mavFuelPct + 5);
  });
  bus.emit('audio:play', 'scan');
}

/**
 * Sera Bakımı ve Hasat Filizi (Akıl Sağlığı + O2 desteği)
 */
function tendGreenhouse() {
  updateState((s) => {
    if (s.resources.greenhouseFrozen || s.resources.waterLiters < 4) return;
    s.resources.waterLiters = Math.max(0, s.resources.waterLiters - 4);
    const yieldBonus = s.experiments.seed_germination?.bonusUnlocked ? 16 : 12;
    s.resources.sanity = Math.min(100, s.resources.sanity + yieldBonus);
    s.resources.o2 = Math.min(100, Math.round((s.resources.o2 + 5) * 10) / 10);
  });
  bus.emit('audio:play', 'click');
}

/**
 * M1: Downlink Kuyruğundaki Bir Veri Paketini Dünya'ya Gönderir
 */
function transmitDownlinkPacket(packetId) {
  const state = getState();
  const horizons = getHorizonsForSol(state.sol);

  // Güneş Kavuşumu (Solar Conjunction) kontrolü (Sol 14 öncesi veya iletişim kapalıysa)
  const commsActive =
    state.powerPriorities.find((p) => p.id === 'comms')?.active ?? true;
  if (!commsActive) {
    return { ok: false, reason: 'comms_powered_off' };
  }

  const pkt = state.downlinkQueue.find((p) => p.id === packetId);
  if (!pkt || pkt.sent) return { ok: false, reason: 'not_found' };

  const remainingMbit = state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol;
  if (pkt.sizeMbit > remainingMbit) {
    return { ok: false, reason: 'bandwidth_exceeded' };
  }

  updateState((s) => {
    const target = s.downlinkQueue.find((p) => p.id === packetId);
    if (!target) return;
    target.sent = true;
    target.lightDelayText = horizons.formatted;
    s.budgets.dataUsedThisSol += target.sizeMbit;

    if (target.type === 'forensic' && s.forensics[target.refId]) {
      s.forensics[target.refId].sent = true;
    }
    if (target.type === 'experiment' && s.experiments[target.refId]) {
      s.experiments[target.refId].sent = true;
    }
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true };
}

/**
 * Günü Tamamla (SOL X -> SOL X+1 Geçişi, Gece Soğuğu, Kaynak Dengesi ve Kriz Tetiklemesi)
 */
function advanceSol() {
  const state = getState();
  if (state.phase !== 'surface') return;

  const site =
    NASA_DATA.landingSites.find((s) => s.id === state.design.landingSiteId) ||
    NASA_DATA.landingSites[1];

  updateState((s) => {
    // 1. Günlük toz birikimi ve enerji/O2 döngüsü
    s.resources.panelDust = Math.min(0.85, Math.round((s.resources.panelDust + 0.05) * 100) / 100);
    s.budgets.dataUsedThisSol = 0;

    applyPowerLoadShedding(s);

    const moxieOn = s.powerPriorities.find((p) => p.id === 'moxie')?.active;
    const heatingOn = s.powerPriorities.find((p) => p.id === 'heating')?.active;
    const ghOn = s.powerPriorities.find((p) => p.id === 'greenhouse')?.active;

    // O2 tüketimi vs MOXIE üretimi
    const dailyO2Use = 9;
    const dailyMoxieGain = moxieOn
      ? s.experiments.moxie_efficiency?.bonusUnlocked
        ? 11
        : 8
      : 0;
    s.resources.o2 = Math.max(
      0,
      Math.min(100, Math.round((s.resources.o2 - dailyO2Use + dailyMoxieGain) * 10) / 10)
    );

    // Gece -80°C ısı ve batarya dengesi
    const netPowerDeltaKwh = Math.round(
      ((s.budgets.powerProdW - s.budgets.powerConsW) * 0.04) * 10
    ) / 10;
    s.resources.energyKwh = Math.max(
      2,
      Math.min(s.design.batteryKwh, Math.round((s.resources.energyKwh + netPowerDeltaKwh) * 10) / 10)
    );

    if (!heatingOn && s.design.insulation === 'thin') {
      s.resources.suitTempC = Math.max(-25, s.resources.suitTempC - 14);
      s.resources.greenhouseFrozen = true;
    } else {
      s.resources.suitTempC = site.dayTempC;
    }

    if (!ghOn && site.nightTempC < -85 && s.design.insulation === 'thin') {
      s.resources.greenhouseFrozen = true;
    }

    // Günlük radyasyon ve akıl sağlığı
    s.resources.radiationMsv = Math.round(
      (s.resources.radiationMsv + NASA_DATA.constants.radiation.surfaceDailyMsv) * 10
    ) / 10;
    const sanityDelta = ghOn && !s.resources.greenhouseFrozen ? -1 : -5;
    s.resources.sanity = Math.max(0, Math.min(100, s.resources.sanity + sanityDelta));

    // Kayıp koşullarını kontrol et (4 Kayıp Koşulu)
    if (s.resources.o2 <= 0) {
      s.gameOverReason = 'o2_depleted';
    } else if (s.resources.suitTempC <= NASA_DATA.constants.temperatureC.suitCriticalMin) {
      s.gameOverReason = 'hypothermia';
    } else if (s.resources.radiationMsv >= NASA_DATA.constants.radiation.missionLimitMsv) {
      s.gameOverReason = 'radiation_limit';
    } else if (s.resources.sanity <= 0) {
      s.gameOverReason = 'sanity_zero';
    }

    if (s.gameOverReason) {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
      return;
    }

    // Son Sol tamamlandıysa UFO Stinger sahnesine geç!
    if (s.sol >= s.maxSols) {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
      return;
    }

    s.sol += 1;
  });

  bus.emit('sol:advance', { sol: getState().sol });
  bus.emit('audio:play', 'scan');

  // Yeni Sol kriz veya olumlu olayını tetikle
  if (getState().phase === 'surface') {
    pickAndTriggerSolEvent();
  }
}

// --- MODULE: src/systems/forensics.js ---
/**
 * SOL 14: RED HORIZON — Ana Görev 1: Kayıp Araçların Adli İncelemesi (K6)
 * Döngü: 1. Bul (EVA / Ingenuity Drone) -> 2. Kanıt Topla (Foto, Kara Kutu, Çevre) ->
 *        3. 5 Kategoriden Teşhis Koy -> 4. Downlink Kuyruğuna Gönder -> 5. Parça Sök & NASA Bulgusu
 */


const DIAGNOSIS_CATEGORIES = [
  { id: 'power_dust', labelKey: 'forensics.diag_power_dust' },
  { id: 'thermal', labelKey: 'forensics.diag_thermal' },
  { id: 'mechanical', labelKey: 'forensics.diag_mechanical' },
  { id: 'software', labelKey: 'forensics.diag_software' },
  { id: 'comms', labelKey: 'forensics.diag_comms' }
];

/**
 * 1. Enkazı Haritada Keşfet (Ingenuity Drone ile O2 harcamadan veya EVA Yürüyüşü ile)
 */
function discoverWreck(caseId, mode = 'eva') {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;

    if (mode === 'drone' && s.design.instruments.includes('ingenuity')) {
      s.resources.energyKwh = Math.max(0, Math.round((s.resources.energyKwh - 2) * 10) / 10);
      rec.discovered = true;
    } else {
      const o2Cost = Math.round((caseCfg.distanceMeters / 100) * 1.8);
      s.resources.o2 = Math.max(2, s.resources.o2 - o2Cost);
      s.resources.evaDistanceM = caseCfg.distanceMeters;
      rec.discovered = true;
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true };
}

/**
 * 2. Kanıt Topla (photo | telemetry | env)
 */
function collectForensicEvidence(caseId, evidenceType, minigameScore = 1.0) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;
    rec.discovered = true;
    rec.evidence[evidenceType] = true;

    if (evidenceType === 'photo') {
      s.resources.o2 = Math.max(2, s.resources.o2 - 3);
    } else if (evidenceType === 'telemetry') {
      s.resources.energyKwh = Math.max(1, Math.round((s.resources.energyKwh - 1.5) * 10) / 10);
    } else if (evidenceType === 'env') {
      s.resources.o2 = Math.max(2, s.resources.o2 - 2);
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true, minigameScore };
}

/**
 * 3 & 4. Arıza Kategorisini Teşhis Et ve Raporu Downlink Kuyruğuna (M1) Ekle
 * Puanlama: Doğru teşhis = 100, Yanlış ama 3 kanıt = 50, Kanıt eksik = 20, Gönderilmemiş = 0
 */
function submitForensicDiagnosis(caseId, selectedCategory) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  let calculatedScore = 0;
  let isCorrect = false;

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec) return;

    rec.diagnosis = selectedCategory;
    const evCount =
      (rec.evidence.photo ? 1 : 0) +
      (rec.evidence.telemetry ? 1 : 0) +
      (rec.evidence.env ? 1 : 0);

    isCorrect =
      selectedCategory === caseCfg.correctCategory ||
      selectedCategory === caseCfg.acceptedSecondary;

    const camFactor = s.design.instruments.includes('mastcam_z') ? 1.0 : 0.75;

    if (isCorrect && evCount >= 2) {
      calculatedScore = Math.round(NASA_DATA.scoring.forensicCorrectPoints * camFactor);
    } else if (evCount === 3) {
      calculatedScore = NASA_DATA.scoring.forensicWrongWith3CluesPoints;
    } else {
      calculatedScore = NASA_DATA.scoring.forensicIncompleteCluesPoints;
    }

    rec.score = calculatedScore;
    rec.queued = true;

    const pktId = `forensic_${caseId}`;
    const existing = s.downlinkQueue.find((p) => p.id === pktId);
    if (!existing) {
      s.downlinkQueue.push({
        id: pktId,
        type: 'forensic',
        refId: caseId,
        title: `Adli Rapor: ${caseCfg.name} (${selectedCategory.toUpperCase()})`,
        sizeMbit: caseCfg.reportDataMbit,
        points: calculatedScore,
        sent: false
      });
    } else {
      existing.points = calculatedScore;
    }

    logDecision({
      sol: s.sol,
      category: 'science',
      title: `Adli İnceleme: ${caseCfg.name}`,
      choice: isCorrect ? `Doğru Teşhis (${selectedCategory})` : `Kısmi Teşhis (${selectedCategory})`,
      costText: `${caseCfg.reportDataMbit} Mbit Downlink`,
      consequence: t(`case.${caseId}.lesson`),
      scoreImpact: calculatedScore
    });
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true, isCorrect, score: calculatedScore };
}

/**
 * 5. Enkazdan Parça Sök (RHU Isıtıcı, SEIS, Yedek Anten, Robot Kol)
 */
function salvageWreckPart(caseId) {
  const caseCfg = NASA_DATA.forensicsCases.find((c) => c.id === caseId);
  if (!caseCfg) return { ok: false };

  updateState((s) => {
    const rec = s.forensics[caseId];
    if (!rec || rec.salvaged) return;
    rec.salvaged = true;

    const rw = caseCfg.salvageReward;
    if (rw.rhuUnits) {
      s.inventory.rhuUnits += rw.rhuUnits;
      s.resources.suitTempC = Math.min(22, s.resources.suitTempC + 6);
    }
    if (rw.seisUnlocked && !s.design.instruments.includes('seis')) {
      s.design.instruments.push('seis');
    }
    if (rw.spareAntenna) {
      s.inventory.spareAntenna = true;
    }
    if (rw.roboticArmPart) {
      s.inventory.roboticArmPart = true;
    }
    if (rw.wheelPart) {
      s.inventory.wheelPart = true;
    }
  });

  bus.emit('audio:play', 'scan');
  return { ok: true };
}

// --- MODULE: src/systems/experiments.js ---
/**
 * SOL 14: RED HORIZON — Ana Görev 2: Mars Laboratuvarı 6 Bilimsel Deney Sistemi (K6)
 * Döngü: 1. Hipotez Seç -> 2. Ortam Seç (Habitat vs Dış Yüzey) -> 3. Kontrol Grubu (+%50 Puan) ->
 *        4. Çalıştır & Ölç (Mini-Oyun) -> 5. Sonuç Kartı, Hayatta Kalma Ödülü & Downlink (M1)
 */


const EXPERIMENT_HYPOTHESES = {
  pendulum_gravity: [
    { id: 'slower_163', labelKey: 'exp.pendulum_gravity.h1' },
    { id: 'faster_125', labelKey: 'exp.pendulum_gravity.h2' },
    { id: 'same_201', labelKey: 'exp.pendulum_gravity.h3' }
  ],
  free_fall_jump: [
    { id: 'fall_104s', labelKey: 'exp.free_fall_jump.h1' },
    { id: 'fall_064s', labelKey: 'exp.free_fall_jump.h2' },
    { id: 'fall_260s', labelKey: 'exp.free_fall_jump.h3' }
  ],
  seed_germination: [
    { id: 'washed_pressurized_only', labelKey: 'exp.seed_germination.h1' },
    { id: 'raw_soil_direct', labelKey: 'exp.seed_germination.h2' },
    { id: 'open_mars_air', labelKey: 'exp.seed_germination.h3' }
  ],
  water_boiling: [
    { id: 'boil_and_freeze_triple', labelKey: 'exp.water_boiling.h1' },
    { id: 'stay_liquid', labelKey: 'exp.water_boiling.h2' },
    { id: 'turn_to_acid', labelKey: 'exp.water_boiling.h3' }
  ],
  sound_speed: [
    { id: 'slower_240ms', labelKey: 'exp.sound_speed.h1' },
    { id: 'faster_480ms', labelKey: 'exp.sound_speed.h2' },
    { id: 'no_sound', labelKey: 'exp.sound_speed.h3' }
  ],
  moxie_efficiency: [
    { id: 'denser_cold_air_variation', labelKey: 'exp.moxie_efficiency.h1' },
    { id: 'daylight_only', labelKey: 'exp.moxie_efficiency.h2' },
    { id: 'constant_output', labelKey: 'exp.moxie_efficiency.h3' }
  ]
};

/**
 * Deney ayarlarını (hipotez, ortam, kontrol grubu) günceller
 */
function configureExperiment(expId, { hypothesis, environment, controlGroup }) {
  updateState((s) => {
    const rec = s.experiments[expId];
    if (!rec) return;
    if (hypothesis !== undefined) rec.hypothesis = hypothesis;
    if (environment !== undefined) rec.environment = environment;
    if (controlGroup !== undefined) rec.controlGroup = Boolean(controlGroup);
  });
}

/**
 * Deneyi çalıştırır, ölçüm sonucunu hesaplar, hayatta kalma ödülünü açar ve Downlink kuyruğuna ekler
 */
function completeExperiment(expId, minigameQuality = 1.0) {
  const expCfg = NASA_DATA.experiments.find((e) => e.id === expId);
  if (!expCfg) return { ok: false };

  let earnedScore = 0;
  let hypothesisCorrect = false;
  let envCorrect = false;

  updateState((s) => {
    const rec = s.experiments[expId];
    if (!rec) return;

    const energyCost =
      expCfg.energyCostKwh + (rec.controlGroup ? 1.5 : 0);
    s.resources.energyKwh = Math.max(1, Math.round((s.resources.energyKwh - energyCost) * 10) / 10);

    hypothesisCorrect = rec.hypothesis === expCfg.correctHypothesis;
    envCorrect = rec.environment === expCfg.preferredEnv;
    const hasReqInst =
      !expCfg.requiredInstrument ||
      s.design.instruments.includes(expCfg.requiredInstrument);

    let factor = 0.6;
    if (hypothesisCorrect) factor += 0.3;
    if (envCorrect) factor += 0.1;
    if (!hasReqInst) factor *= 0.55; // Gerekli alet yoksa açık havada/el yordamıyla düşük puan

    const controlMult = rec.controlGroup
      ? NASA_DATA.scoring.controlGroupBonusMultiplier
      : 1.0;

    earnedScore = Math.round(expCfg.basePoints * factor * controlMult * Math.max(0.7, minigameQuality));

    rec.completed = true;
    rec.measuredValue = expCfg.expectedMarsValue;
    rec.score = earnedScore;
    rec.bonusUnlocked = true;
    rec.queued = true;

    // Bulgu ödüllerini anında uygula
    if (expId === 'seed_germination') {
      s.inventory.perchlorateWashed = true;
      s.resources.sanity = Math.min(100, s.resources.sanity + 10);
    } else if (expId === 'water_boiling') {
      s.resources.waterLiters += 10;
    } else if (expId === 'moxie_efficiency') {
      s.resources.o2 = Math.min(100, s.resources.o2 + 10);
    }

    const pktId = `exp_${expId}`;
    const existing = s.downlinkQueue.find((p) => p.id === pktId);
    if (!existing) {
      s.downlinkQueue.push({
        id: pktId,
        type: 'experiment',
        refId: expId,
        title: `${t(`exp.${expId}.name`)} (${expCfg.expectedMarsValue} ${expCfg.unit})`,
        sizeMbit: expCfg.dataMbit,
        points: earnedScore,
        sent: false
      });
    } else {
      existing.points = earnedScore;
    }

    logDecision({
      sol: s.sol,
      category: 'science',
      title: t(`exp.${expId}.name`),
      choice: `${hypothesisCorrect ? 'Hipotez Doğrulandı' : 'Hipotez Yanlışlandı'} ${rec.controlGroup ? '(+Kontrol Grubu)' : ''}`,
      costText: `-${energyCost} kWh, ${expCfg.dataMbit} Mbit`,
      consequence: t(`exp.${expId}.result`),
      scoreImpact: earnedScore
    });
  });

  bus.emit('audio:play', 'downlink');
  return { ok: true, earnedScore, hypothesisCorrect, envCorrect };
}

// --- MODULE: src/fx/sprites.js ---
/**
 * SOL 14: RED HORIZON — 16-Bit Pixel Art Varlık Yükleyici ve Flood-Fill Chroma-Key (K4)
 * #FFFFFF beyaz arka planlı sprite'ları kenarlardan içe doğru şeffaf yapar;
 * astronotun beyaz uzay kıyafetinin iç piksellerini korur.
 */

const ASSET_PATHS = {
  // Arka Planlar (16:9)
  bg_jezero_day: 'assets/backgrounds/bg_jezero_day.png',
  bg_jezero_sunset: 'assets/backgrounds/bg_jezero_sunset.png',
  bg_jezero_night: 'assets/backgrounds/bg_jezero_night.png',
  bg_storm: 'assets/backgrounds/bg_storm.png',
  bg_meridiani_day: 'assets/backgrounds/bg_meridiani_day.png',
  bg_arcadia_day: 'assets/backgrounds/bg_arcadia_day.png',

  // Astronot, Drone ve Enkaz Sprite'ları (1:1 - #FFFFFF Beyaz Zemin)
  astronaut_idle: 'assets/sprites/astronaut_idle.png',
  astronaut_walk: 'assets/sprites/astronaut_walk.png',
  astronaut_jump: 'assets/sprites/astronaut_jump.png',
  astronaut_frozen: 'assets/sprites/astronaut_frozen.png',
  astronaut_action: 'assets/sprites/astronaut_action.png',
  drone_ingenuity: 'assets/sprites/drone_ingenuity.png',
  rover_opportunity: 'assets/sprites/rover_opportunity.png',
  rover_spirit: 'assets/sprites/rover_spirit.png',
  lander_phoenix: 'assets/sprites/lander_phoenix.png',
  lander_insight: 'assets/sprites/lander_insight.png',
  lander_beagle2: 'assets/sprites/lander_beagle2.png',

  // Üs Yapıları (#FFFFFF Beyaz Zemin)
  habitat_main: 'assets/structures/habitat_main.png',
  mav_rocket: 'assets/structures/mav_rocket.png',
  greenhouse_ok: 'assets/structures/greenhouse_ok.png',
  greenhouse_frozen: 'assets/structures/greenhouse_frozen.png',
  solar_clean: 'assets/structures/solar_clean.png',
  solar_dusty: 'assets/structures/solar_dusty.png',
  moxie_unit: 'assets/structures/moxie_unit.png',

  // Tam Ekran Paneller
  scr_launch: 'assets/screens/scr_launch.png',
  scr_transit: 'assets/screens/scr_transit.png',
  scr_map_corridor: 'assets/screens/scr_map_corridor.png',
  scr_lab_desk: 'assets/screens/scr_lab_desk.png',
  scr_downlink: 'assets/screens/scr_downlink.png',
  scr_habitat_cutaway: 'assets/screens/scr_habitat_cutaway.png',
  scr_sol_transition: 'assets/screens/scr_sol_transition.png',

  // VFX Efektleri
  vfx_frost_1: 'assets/vfx/vfx_frost_1.png',
  vfx_frost_2: 'assets/vfx/vfx_frost_2.png',
  vfx_dust_storm: 'assets/vfx/vfx_dust_storm.png',
  vfx_dust_devil: 'assets/vfx/vfx_dust_devil.png',
  vfx_shadow_hallucination: 'assets/vfx/vfx_shadow_hallucination.png',

  // UFO Stinger Final Görselleri
  ufo_liftoff: 'assets/ending/ufo_liftoff.png',
  ufo_sky: 'assets/ending/ufo_sky.png',
  ufo_photo_clear: 'assets/ending/ufo_photo_clear.png',
  ufo_photo_blur: 'assets/ending/ufo_photo_blur.png',
  cover_thumbnail: 'assets/ending/cover_thumbnail.png'
};

// Beyaz arka planı şeffaf yapılacak varlık anahtarları
const CHROMA_KEY_ASSETS = new Set([
  'astronaut_idle',
  'astronaut_walk',
  'astronaut_jump',
  'astronaut_frozen',
  'astronaut_action',
  'drone_ingenuity',
  'rover_opportunity',
  'rover_spirit',
  'lander_phoenix',
  'lander_insight',
  'lander_beagle2',
  'habitat_main',
  'mav_rocket',
  'greenhouse_ok',
  'greenhouse_frozen',
  'solar_clean',
  'solar_dusty',
  'moxie_unit',
  'vfx_frost_1',
  'vfx_frost_2',
  'vfx_dust_storm',
  'vfx_dust_devil',
  'vfx_shadow_hallucination'
]);

const spriteCache = new Map();

/**
 * Kenarlardan (Border) başlayan Flood-Fill algoritmasıyla #FFFFFF beyaz arka planı şeffaf yapar.
 * Böylece astronotun iç beyaz EVA kıyafeti silinmez!
 */
function applyBorderFloodFillChromaKey(img, threshold = 236) {
  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return img;

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const isWhiteBg = (idx) => {
      const p = idx * 4;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      return r >= threshold && g >= threshold && b >= threshold;
    };

    const enqueueIfBg = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      if (visited[idx]) return;
      visited[idx] = 1;
      if (isWhiteBg(idx)) {
        queue[tail++] = idx;
      }
    };

    // 4 dış kenarı kuyruğa ekle
    for (let x = 0; x < w; x++) {
      enqueueIfBg(x, 0);
      enqueueIfBg(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      enqueueIfBg(0, y);
      enqueueIfBg(w - 1, y);
    }

    // Vizör buzlanması (frost) ve fırtına efektlerinde orta alan da beyaz olduğu için merkezi de ekle
    enqueueIfBg(Math.floor(w / 2), Math.floor(h / 2));

    while (head < tail) {
      const curr = queue[head++];
      const p = curr * 4;
      data[p + 3] = 0; // Alpha = 0 (Tam Şeffaf)

      const cx = curr % w;
      const cy = (curr - cx) / w;
      enqueueIfBg(cx + 1, cy);
      enqueueIfBg(cx - 1, cy);
      enqueueIfBg(cx, cy + 1);
      enqueueIfBg(cx, cy - 1);
    }

    ctx.putImageData(imgData, 0, 0);
    return off;
  } catch {
    // file:// protokolünde CORS kısıtı varsa doğrudan orijinal görseli döndür
    return img;
  }
}

function loadSprite(key) {
  if (spriteCache.has(key)) {
    return Promise.resolve(spriteCache.get(key));
  }
  const path = ASSET_PATHS[key];
  if (!path) return Promise.resolve(null);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const processed = CHROMA_KEY_ASSETS.has(key)
        ? applyBorderFloodFillChromaKey(img)
        : img;
      spriteCache.set(key, processed);
      resolve(processed);
    };
    img.onerror = () => {
      spriteCache.set(key, null);
      resolve(null);
    };
    img.src = path;
  });
}

function getCachedSprite(key) {
  return spriteCache.get(key) || null;
}

/**
 * Temel oyun görsellerini arka planda önbelleğe yükler
 */
async function preloadAllSprites() {
  const keys = Object.keys(ASSET_PATHS);
  await Promise.all(keys.map((k) => loadSprite(k)));
}

// --- MODULE: src/fx/effects.js ---
/**
 * SOL 14: RED HORIZON — 2D 16-Bit Pixel Art Yüzey Sahnesi, 0.38g Fizik ve UFO VFX Motoru (K4)
 */


let animFrameId = null;
let weatherFx = 'clear';
let shakeTimer = 0;
let particles = [];

// 0.38g (g = 3.71 m/s^2) Astronot Karakter Fiziği
const astronaut = {
  x: 340,
  y: 0, // yerden yükseklik (px)
  vy: 0,
  vx: 0,
  facingRight: true,
  pose: 'idle', // 'idle' | 'walk' | 'jump' | 'frozen' | 'action'
  actionTimer: 0
};

function initSurfaceFx() {
  particles = Array.from({ length: 48 }, () => ({
    x: Math.random() * 960,
    y: Math.random() * 440,
    speedX: 3 + Math.random() * 5,
    speedY: 0.5 + Math.random() * 1.5,
    size: 2 + Math.floor(Math.random() * 3)
  }));

  bus.on('fx:weather', (payload) => {
    if (payload?.type) {
      weatherFx = payload.type;
      if (payload.type === 'quake') {
        shakeTimer = 45;
      }
    }
  });
}

/**
 * 0.38g Düşük Yerçekimi Zıplaması (Dünya'nın ~2.6 katı yükseğe ve ~1.63x daha uzun havada kalır)
 */
function triggerAstronautJump() {
  if (astronaut.y <= 0) {
    astronaut.vy = 9.6; // 0.38g ivmeyle uzun parabolik sıçrama
    astronaut.pose = 'jump';
    bus.emit('audio:play', 'jump');
  }
}

function triggerAstronautMove(dir = 1) {
  astronaut.facingRight = dir >= 0;
  const isFrozen = getState().resources.jointFrozen;
  const speed = isFrozen ? 14 : 34;
  astronaut.x = Math.max(90, Math.min(860, astronaut.x + dir * speed));
  astronaut.pose = isFrozen ? 'frozen' : 'walk';
  astronaut.actionTimer = 18;
}

function triggerAstronautAction() {
  astronaut.pose = 'action';
  astronaut.actionTimer = 35;
}

/**
 * Yüzey Canvas sahnesini her karede (60 FPS) çizer
 */
function startSurfaceCanvasLoop(canvas) {
  if (!canvas) return;
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const render = () => {
    const state = getState();
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();

    // Sarsıntı (Marsquake ~M4.7) ekran titremesi
    if (shakeTimer > 0) {
      shakeTimer--;
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 6;
      ctx.translate(dx, dy);
    }

    // 1. Arka Plan Seçimi (İniş Bölgesi + Gece/Mavi Gün Batımı/Fırtına)
    let bgKey = 'bg_jezero_day';
    if (weatherFx === 'storm' || state.activeCrisis?.id === 'dust_storm') {
      bgKey = 'bg_storm';
    } else if (state.timeOfDay === 'sunset') {
      bgKey = 'bg_jezero_sunset';
    } else if (state.timeOfDay === 'night') {
      bgKey = 'bg_jezero_night';
    } else if (state.design.landingSiteId === 'meridiani') {
      bgKey = 'bg_meridiani_day';
    } else if (state.design.landingSiteId === 'arcadia') {
      bgKey = 'bg_arcadia_day';
    }

    const bgImg = getCachedSprite(bgKey);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, w, h);
    } else {
      loadSprite(bgKey);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, state.timeOfDay === 'night' ? '#0B1021' : '#C86D44');
      grad.addColorStop(1, '#6E2614');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    const groundY = h - 56;

    // 2. Üs Yapıları (Habitat, Sera, Güneş Paneli, MOXIE/RTG, MAV Roketi)
    drawSpriteSafe(ctx, 'mav_rocket', 68, groundY - 148, 128, 152);
    drawSpriteSafe(ctx, 'habitat_main', 185, groundY - 120, 155, 124);

    const ghKey = state.resources.greenhouseFrozen ? 'greenhouse_frozen' : 'greenhouse_ok';
    drawSpriteSafe(ctx, ghKey, 345, groundY - 104, 136, 108);

    const solarKey = state.resources.panelDust > 0.35 ? 'solar_dusty' : 'solar_clean';
    drawSpriteSafe(ctx, solarKey, 488, groundY - 88, 124, 92);

    if (
      state.design.powerSource === 'solar_rtg' ||
      state.design.instruments.includes('moxie')
    ) {
      drawSpriteSafe(ctx, 'moxie_unit', 618, groundY - 78, 86, 82);
    }

    // 3. Keşif Koridorundaki Enkaz Önizlemesi & Ingenuity Drone
    drawSpriteSafe(ctx, 'rover_opportunity', 755, groundY - 84, 102, 88);
    if (state.forensics.phoenix?.discovered) {
      drawSpriteSafe(ctx, 'lander_phoenix', 848, groundY - 82, 92, 84);
    }

    if (state.design.instruments.includes('ingenuity')) {
      const hoverOffset = Math.sin(Date.now() * 0.006) * 10;
      drawSpriteSafe(ctx, 'drone_ingenuity', 705, groundY - 185 + hoverOffset, 68, 68);
    }

    // 4. 0.38g Astronot Fizik Güncellemesi ve Çizimi
    if (astronaut.y > 0 || astronaut.vy > 0) {
      astronaut.y += astronaut.vy;
      astronaut.vy -= 0.28; // Mars 0.38g düşük yerçekimi ivmesi!
      if (astronaut.y <= 0) {
        astronaut.y = 0;
        astronaut.vy = 0;
        astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
      }
    } else if (astronaut.actionTimer > 0) {
      astronaut.actionTimer--;
      if (astronaut.actionTimer === 0) {
        astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
      }
    } else {
      astronaut.pose = state.resources.jointFrozen ? 'frozen' : 'idle';
    }

    const poseMap = {
      idle: 'astronaut_idle',
      walk: 'astronaut_walk',
      jump: 'astronaut_jump',
      frozen: 'astronaut_frozen',
      action: 'astronaut_action'
    };
    const astroKey = poseMap[astronaut.pose] || 'astronaut_idle';
    const astroY = groundY - 94 - astronaut.y;

    ctx.save();
    if (!astronaut.facingRight) {
      ctx.translate(astronaut.x + 92, 0);
      ctx.scale(-1, 1);
      drawSpriteSafe(ctx, astroKey, 0, astroY, 92, 96);
    } else {
      drawSpriteSafe(ctx, astroKey, astronaut.x, astroY, 92, 96);
    }
    ctx.restore();

    // 5. Atmosfer ve Akıl Sağlığı VFX Katmanları
    // 5a. Toz Şeytanı (Dust Devil)
    if (weatherFx === 'dust_devil' || state.activeCrisis?.id === 'dust_devil_bonus') {
      const ddX = 520 + Math.sin(Date.now() * 0.003) * 90;
      drawSpriteSafe(ctx, 'vfx_dust_devil', ddX, groundY - 165, 115, 165);
    }

    // 5b. Kum Fırtınası Parçacıkları
    if (weatherFx === 'storm' || state.resources.panelDust > 0.45) {
      ctx.fillStyle = 'rgba(218, 104, 52, 0.32)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#F4A261';
      for (const p of particles) {
        p.x += p.speedX * 1.8;
        p.y += p.speedY;
        if (p.x > w) p.x = 0;
        if (p.y > h) p.y = 0;
        ctx.fillRect(p.x, p.y, p.size * 3, p.size);
      }
    }

    // 5c. Akıl Sağlığı (Sanity < 45%) Gölge Halüsinasyonu
    if (state.resources.sanity < 45 || weatherFx === 'hallucination') {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(Date.now() * 0.015) * 0.25;
      drawSpriteSafe(ctx, 'vfx_shadow_hallucination', 825, groundY - 102, 88, 98);
      ctx.restore();
    }

    // 5d. Vizör Buzlanması (-80°C Eklem Donması / Soğuk)
    if (state.resources.jointFrozen || state.resources.suitTempC < 0 || weatherFx === 'frost') {
      const frostKey = state.resources.suitTempC < -10 ? 'vfx_frost_2' : 'vfx_frost_1';
      ctx.save();
      ctx.globalAlpha = 0.65;
      drawSpriteSafe(ctx, frostKey, 0, 0, w, h);
      ctx.restore();
    }

    // 6. Canvas Üst Bilgi Bandı (0.38g Fizik & EVA Mesafe Bilgisi)
    ctx.fillStyle = 'rgba(11, 16, 33, 0.78)';
    ctx.fillRect(12, 12, 410, 32);
    ctx.strokeStyle = '#5B9BD5';
    ctx.strokeRect(12, 12, 410, 32);
    ctx.fillStyle = '#E6EDF3';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(
      `MARS g = 3.71 m/s² (0.38g) | EVA: ${state.resources.evaDistanceM}m | T_dış: ${state.timeOfDay === 'night' ? '-82°C' : '+8°C'}`,
      22,
      32
    );

    ctx.restore();
    animFrameId = requestAnimationFrame(render);
  };

  render();
}

function stopSurfaceCanvasLoop() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

function drawSpriteSafe(ctx, key, x, y, w, h) {
  const sp = getCachedSprite(key);
  if (sp) {
    ctx.drawImage(sp, x, y, w, h);
  } else {
    loadSprite(key);
  }
}

/**
 * UFO Stinger Sahnesi İçin Satır-Satır (Scanline) Telemetri Fotoğrafı Çizici
 */
function renderUfoScanlineCanvas(canvas, { highRes = true, maxPct = 80, onComplete }) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const imgKey = highRes ? 'ufo_photo_clear' : 'ufo_photo_blur';
  let currentPct = 0;

  loadSprite(imgKey).then((img) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#070A14';
    ctx.fillRect(0, 0, w, h);

    const step = () => {
      currentPct = Math.min(maxPct, currentPct + 1.2);
      const drawHeight = Math.floor((h * currentPct) / 100);

      ctx.fillStyle = '#070A14';
      ctx.fillRect(0, 0, w, h);

      if (img) {
        const srcH = Math.floor(((img.height || 360) * currentPct) / 100);
        ctx.drawImage(img, 0, 0, img.width || 640, srcH, 0, 0, w, drawHeight);
      }

      // Aktif tarama çizgisi (Scanline)
      ctx.fillStyle = '#3FB950';
      ctx.fillRect(0, drawHeight, w, 3);

      // Alt kısımda henüz inmeyen statik karıncalanma
      for (let y = drawHeight + 4; y < h; y += 6) {
        ctx.fillStyle = y % 12 === 0 ? 'rgba(91, 155, 213, 0.12)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, y, w, 2);
      }

      // Telemetri damgası
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(10, 10, 360, 28);
      ctx.fillStyle = currentPct >= maxPct ? '#F85149' : '#8BE9FD';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `DSN TELEMETRY [${highRes ? 'MASTCAM-Z HI-RES' : 'LOW-RES CAM'}]: ${Math.floor(currentPct)}% / ${maxPct}%`,
        18,
        28
      );

      if (currentPct < maxPct) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    };

    requestAnimationFrame(step);
  });
}

// --- MODULE: src/fx/audio.js ---
/**
 * SOL 14: RED HORIZON — Web Audio API Prosedürel Ses Efekt Motoru (K5)
 * Telifsiz (CC0 / Sentezlenmiş) ses efektleri: Tıklama, Alarm, Radar, Downlink, Kalkış ve UFO Sinyali.
 */


let audioCtx = null;
let muted = false;

function getCtx() {
  if (muted) return null;
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function toggleMute() {
  muted = !muted;
  return muted;
}

function isMuted() {
  return muted;
}

function playSound(type = 'click') {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'click') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'alarm') {
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(640, now + i * 0.16);
      osc.frequency.setValueAtTime(440, now + i * 0.16 + 0.08);
      gain.gain.setValueAtTime(0.08, now + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.15);
    }
  } else if (type === 'scan' || type === 'downlink') {
    const freqs = type === 'downlink' ? [440, 554, 659, 880] : [587, 784];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      gain.gain.setValueAtTime(0.07, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.08);
    });
  } else if (type === 'jump') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'launch' || type === 'ufo_ping') {
    // Asal sayı darbeleri (2-3-5-7 "Wow!" sinyali selamı)
    const pulses = [740, 1110, 740, 1480];
    pulses.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.14);
      gain.gain.setValueAtTime(0.08, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.12);
    });
  }
}

function initAudioBus() {
  bus.on('audio:play', (type) => playSound(type));
}

// --- MODULE: src/minigames/minigames.js ---
/**
 * SOL 14: RED HORIZON — 4 Yeniden Kullanılabilir Mini-Oyun Şablonu (K3)
 * Şablonlar: 1. wires (Kablo/Boru) · 2. align (Açı/Frekans) · 3. qte (Zamanlama/Sarkaç) · 4. converter (Dönüştürücü)
 * Sözleşme: export async function runMinigame(type, config) -> { success, score, timeUsed }
 */


function runMinigame(type = 'qte', config = {}) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const modal = document.getElementById('minigame-modal');
    if (!modal) {
      resolve({ success: true, score: 1.0, timeUsed: 1.0 });
      return;
    }

    const title = config.title || 'Mühendislik Kalibrasyonu';
    const subtitle = config.subtitle || 'Ölçümü tamamlamak için hedefi yakalayın (ESC: Hızlı Geç)';

    let cleanup = () => {};
    const finish = (success, score) => {
      cleanup();
      modal.classList.add('hidden');
      modal.innerHTML = '';
      const timeUsed = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;
      bus.emit('audio:play', success ? 'scan' : 'alarm');
      resolve({ success, score, timeUsed });
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        finish(true, 0.85);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    if (type === 'wires') {
      // Şablon 1: Kara Kutu Telemetri / Radyatör Kablo Eşleştirme
      const colors = [
        { code: 'PWR-28V', color: '#F85149', matched: false },
        { code: 'TLM-BUS', color: '#58A6FF', matched: false },
        { code: 'GND-ISO', color: '#3FB950', matched: false }
      ];
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>🔌 [ŞABLON 1: KABLO & TELEMETRİ HATTI] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Bağla (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle}</p>
          <div class="mg-wires-grid">
            ${colors
              .map(
                (c, i) => `
              <button class="wire-node" data-idx="${i}" style="border-color:${c.color}; color:${c.color}">
                🔌 ${c.code} Hattını Birleştir [Tıkla]
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
      modal.classList.remove('hidden');

      let connected = 0;
      modal.querySelectorAll('.wire-node').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          btn.disabled = true;
          btn.textContent = '✅ HAT BAĞLANDI';
          btn.style.background = 'rgba(63, 185, 80, 0.25)';
          bus.emit('audio:play', 'click');
          connected++;
          if (connected >= colors.length) {
            setTimeout(() => finish(true, 1.0), 220);
          }
        });
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else if (type === 'align') {
      // Şablon 2: Anten / Spektrometre / Ses Hızı Frekans Hizalama
      const target = 68;
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>📡 [ŞABLON 2: FREKANS & AÇI HİZALAMA] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Hizala (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle} — Hedef Frekans: <strong>${target} Hz</strong></p>
          <div class="mg-slider-wrap">
            <input type="range" id="mg-align-slider" min="0" max="100" value="25" class="mg-slider" />
            <div class="mg-readout">Güncel: <span id="mg-align-val">25</span> Hz (Hedef: ${target}±8 Hz)</div>
          </div>
          <button class="btn-primary" id="mg-align-lock">🎯 SİNYALİ KİLİTLE</button>
        </div>
      `;
      modal.classList.remove('hidden');
      const slider = modal.querySelector('#mg-align-slider');
      const valSpan = modal.querySelector('#mg-align-val');
      slider?.addEventListener('input', () => {
        valSpan.textContent = slider.value;
      });
      modal.querySelector('#mg-align-lock')?.addEventListener('click', () => {
        const diff = Math.abs(Number(slider.value) - target);
        const score = diff <= 10 ? 1.0 : diff <= 25 ? 0.85 : 0.75;
        finish(true, score);
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else if (type === 'converter') {
      // Şablon 4: Regolit Perklorat Yıkama / MOXIE Akış Dönüştürücü
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>⚗️ [ŞABLON 4: KAYNAK & REAKTÖR DÖNÜŞTÜRÜCÜ] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Hızlı Tamamla (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle}</p>
          <div class="mg-conv-steps">
            <button class="btn-secondary conv-step" data-step="1">1. Basınç ve Valfleri Dengele (0.63 kPa -> 101 kPa)</button>
            <button class="btn-secondary conv-step" data-step="2">2. Perklorat (ClO4⁻) Filtrele / Elektroliz Başlat</button>
            <button class="btn-primary conv-step" data-step="3">3. Numune Çıktısını Kaydet</button>
          </div>
        </div>
      `;
      modal.classList.remove('hidden');
      let doneSteps = 0;
      modal.querySelectorAll('.conv-step').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          btn.disabled = true;
          btn.textContent = `✅ ${btn.textContent}`;
          bus.emit('audio:play', 'click');
          doneSteps++;
          if (doneSteps >= 3) {
            setTimeout(() => finish(true, 1.0), 200);
          }
        });
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.9));
      cleanup = () => window.removeEventListener('keydown', onKeyDown);
    } else {
      // Şablon 3: QTE / 0.38g Sarkaç & Serbest Düşüş Kronometre Zamanlama
      let pos = 10;
      let dir = 2.4;
      let anim = null;
      modal.innerHTML = `
        <div class="mg-box">
          <div class="mg-header">
            <h3>⏱️ [ŞABLON 3: 0.38g KRONOMETRE & QTE ZAMANLAMA] ${title}</h3>
            <button class="btn-sm" id="mg-skip">⚡ Otomatik Ölç (ESC)</button>
          </div>
          <p class="mg-sub">${subtitle} — Yeşil bölgede (40%–75%) durdurun!</p>
          <div class="qte-track">
            <div class="qte-zone"></div>
            <div class="qte-cursor" id="qte-cursor" style="left:10%"></div>
          </div>
          <button class="btn-primary" id="qte-hit">⏱️ KRONOMETREYİ DURDUR / YAKALA</button>
        </div>
      `;
      modal.classList.remove('hidden');
      const cursor = modal.querySelector('#qte-cursor');
      const step = () => {
        pos += dir;
        if (pos >= 94 || pos <= 4) dir = -dir;
        if (cursor) cursor.style.left = `${pos}%`;
        anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);

      modal.querySelector('#qte-hit')?.addEventListener('click', () => {
        const inZone = pos >= 38 && pos <= 78;
        finish(true, inZone ? 1.0 : 0.82);
      });
      modal.querySelector('#mg-skip')?.addEventListener('click', () => finish(true, 0.92));
      cleanup = () => {
        if (anim) cancelAnimationFrame(anim);
        window.removeEventListener('keydown', onKeyDown);
      };
    }
  });
}

// --- MODULE: src/ui/downlink.js ---
/**
 * SOL 14: RED HORIZON — M1: Veri Bütçesi ve Downlink Haberleşme Konsolu UI (K3)
 */


function renderDownlinkPanel(container) {
  const state = getState();
  const horizons = getHorizonsForSol(state.sol);
  const remainingMbit = Math.max(
    0,
    state.budgets.dataPerSolMax - state.budgets.dataUsedThisSol
  );
  const pctUsed = Math.min(
    100,
    Math.round((state.budgets.dataUsedThisSol / state.budgets.dataPerSolMax) * 100)
  );

  container.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.86), rgba(11,16,33,0.94)), url('assets/screens/scr_downlink.png');">
      <div class="panel-header-row">
        <div>
          <h2>📡 ${t('downlink.title')}</h2>
          <p class="muted">${t('downlink.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>🌍 Dünya–Mars Mesafe: <strong>${horizons.distanceMillionKm} Milyon km</strong></div>
          <div>⏱️ Tek Yön Işık Gecikmesi: <strong>${horizons.formatted}</strong> (JPL Horizons)</div>
          <div>📡 Mimari: <strong>${state.design.commArchitecture === 'relay_xband' ? 'MRO UHF + X-Band (80 Mbit/Sol)' : 'Sadece MRO UHF (45 Mbit/Sol)'}</strong></div>
        </div>
      </div>

      ${
        horizons.solarConjunction
          ? `<div class="alert-banner danger">${t('downlink.conjunction_alert')}</div>`
          : ''
      }

      <div class="bandwidth-meter">
        <div class="bw-label">
          <span>Sol ${state.sol} Kullanılan Veri Bant Genişliği: <strong>${state.budgets.dataUsedThisSol} / ${state.budgets.dataPerSolMax} Mbit</strong></span>
          <span>Kalan Kapasite: <strong>${remainingMbit} Mbit</strong></span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${pctUsed > 85 ? 'danger' : 'ok'}" style="width:${pctUsed}%"></div>
        </div>
      </div>

      <div class="queue-list">
        ${
          state.downlinkQueue.length === 0
            ? `<div class="empty-state">Henüz kuyrukta veri paketi yok. <strong>02 Keşif Koridoru</strong>'ndan adli inceleme yapın veya <strong>03 Bilim Laboratuvarı</strong>'nda deney çalıştırın.</div>`
            : state.downlinkQueue
                .map(
                  (pkt) => `
              <div class="queue-item ${pkt.sent ? 'sent' : ''}">
                <div class="q-info">
                  <span class="q-type-tag ${pkt.type}">${pkt.type.toUpperCase()}</span>
                  <strong>${pkt.title}</strong>
                  <span class="q-meta">${pkt.sizeMbit} Mbit | +${pkt.points} Bilim Puanı</span>
                </div>
                <div class="q-action">
                  ${
                    pkt.sent
                      ? `<span class="badge-sent">${t('downlink.sent_badge')} (${pkt.lightDelayText || horizons.formatted})</span>`
                      : `<button class="btn-primary btn-send-pkt" data-id="${pkt.id}" ${
                          pkt.sizeMbit > remainingMbit ? 'disabled' : ''
                        }>${t('downlink.btn_send')} (-${pkt.sizeMbit} Mbit)</button>`
                  }
                </div>
              </div>
            `
                )
                .join('')
        }
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-send-pkt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      transmitDownlinkPacket(id);
    });
  });
}

// --- MODULE: src/ui/power_panel.js ---
/**
 * SOL 14: RED HORIZON — M3: Güç Yük Önceliklendirme Paneli (Load Shedding) UI (K3)
 */


function renderPowerPanel(container) {
  const state = getState();
  const status = applyPowerLoadShedding(state);

  container.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.85), rgba(11,16,33,0.94)), url('assets/screens/scr_habitat_cutaway.png');">
      <div class="panel-header-row">
        <div>
          <h2>⚡ ${t('power.title')}</h2>
          <p class="muted">${t('power.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>☀️ Kullanılabilir Güç: <strong>${status.availablePowerW} W</strong></div>
          <div>🔌 Aktif Tüketim: <strong>${status.usedW} W</strong></div>
          <div>🔋 Batarya Rezervi: <strong>${state.resources.energyKwh} / ${state.design.batteryKwh} kWh</strong></div>
          <div>☢️ Sökülen RHU Isıtıcı: <strong>${state.inventory.rhuUnits} Adet</strong></div>
        </div>
      </div>

      <div class="power-priority-list">
        ${state.powerPriorities
          .map(
            (item, idx) => `
          <div class="power-item ${item.active ? 'active' : 'shed'}">
            <div class="p-rank">#${idx + 1}</div>
            <div class="p-details">
              <strong>${t(item.labelKey)}</strong>
              <span class="p-watt">${item.powerW} W</span>
            </div>
            <div class="p-status">
              ${
                item.active
                  ? `<span class="badge-ok">⚡ AKTİF (BESLENİYOR)</span>`
                  : `<span class="badge-shed">⚠️ YÜK KESİLDİ (LOAD SHED)</span>`
              }
            </div>
            <div class="p-controls">
              <button class="btn-sm btn-prio-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲ Yukarı</button>
              <button class="btn-sm btn-prio-down" data-idx="${idx}" ${
                idx === state.powerPriorities.length - 1 ? 'disabled' : ''
              }>▼ Aşağı</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('.btn-prio-up').forEach((btn) => {
    btn.addEventListener('click', () => {
      movePowerPriority(Number(btn.getAttribute('data-idx')), -1);
    });
  });

  container.querySelectorAll('.btn-prio-down').forEach((btn) => {
    btn.addEventListener('click', () => {
      movePowerPriority(Number(btn.getAttribute('data-idx')), 1);
    });
  });
}

// --- MODULE: src/ui/decision_card.js ---
/**
 * SOL 14: RED HORIZON — M2: Kriz Karar Kartı ve M7: Gecikmeli Görev Kontrol UI (K3)
 */


function renderDecisionCardModal() {
  const modal = document.getElementById('crisis-modal');
  if (!modal) return;

  const state = getState();
  const crisis = state.activeCrisis;
  if (!crisis) {
    modal.classList.add('hidden');
    modal.innerHTML = '';
    return;
  }

  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="crisis-card">
      <div class="crisis-header">
        <span class="crisis-sol-tag">SOL ${state.sol} MÜHENDİSLİK KRİZ KARTI (M2)</span>
        <span class="crisis-delay-tag">📡 Tek Yön Işık Gecikmesi: ${crisis.lightDelayFormatted}</span>
      </div>

      <h3>${t(crisis.titleKey)}</h3>
      <p class="crisis-desc">${t(crisis.descKey)}</p>

      <div class="crisis-telemetry-strip">
        <span>🫧 O₂: <strong>${state.resources.o2}%</strong></span>
        <span>🔋 Batarya: <strong>${state.resources.energyKwh}/${state.design.batteryKwh} kWh</strong></span>
        <span>🌡️ Elbise Isısı: <strong>${state.resources.suitTempC}°C</strong></span>
        <span>🧠 Akıl Sağlığı: <strong>${state.resources.sanity}%</strong></span>
        <span>🔧 Tamir Kiti: <strong>${state.inventory.repairKits}</strong> | RHU: <strong>${state.inventory.rhuUnits}</strong></span>
      </div>

      <div class="crisis-options">
        ${crisis.options
          .map(
            (opt) => `
          <button class="crisis-opt-btn" data-opt="${opt.id}">
            <div class="opt-title">${t(opt.labelKey)}</div>
            <div class="opt-cost">Sayısal Etki: ${opt.costSummary}</div>
          </button>
        `
          )
          .join('')}
      </div>

      <div class="mission-control-box">
        ${
          crisis.missionControlConsulted
            ? `<div class="mc-advice"><strong>🌍 HOUSTON / GÖREV KONTROL YANITI (${crisis.roundTripMin} dk çift yönlü ışık gecikmesi sonrası ulaştı):</strong><br/>${t(
                crisis.adviceKey
              )}</div>`
            : `<button class="btn-secondary" id="btn-consult-mc">
                📡 Görev Kontrol'e Danış (M7: 2× Işık Gecikmesi = ${crisis.roundTripMin} dk bekleme, -3% O₂)
              </button>`
        }
      </div>
    </div>
  `;

  modal.querySelectorAll('.crisis-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const optId = btn.getAttribute('data-opt');
      resolveCrisisOption(optId);
    });
  });

  modal.querySelector('#btn-consult-mc')?.addEventListener('click', () => {
    consultMissionControl();
  });
}

// --- MODULE: src/ui/design_screens.js ---
/**
 * SOL 14: RED HORIZON — Sol 0: 5 Aşamalı Görev Tasarım Konsolu ve SPOF Uyarısı (M8 - K3)
 */


function renderDesignScreen(container) {
  const state = getState();
  const d = state.design;
  const totals = calcDesignTotals(d);

  const moneyPct = Math.min(100, Math.round((totals.moneyUsed / totals.moneyMax) * 100));
  const massPct = Math.min(100, Math.round((totals.massUsed / totals.massMax) * 100));
  const powerPct = Math.min(
    100,
    Math.round((totals.powerConsW / Math.max(1, totals.powerProdW)) * 100)
  );

  container.innerHTML = `
    <div class="design-wrapper" style="background-image: linear-gradient(rgba(8,12,24,0.88), rgba(8,12,24,0.95)), url('assets/screens/scr_launch.png');">
      <!-- Üst 4 Mühendislik Bütçe Çubuğu -->
      <div class="budget-bars-grid">
        <div class="budget-card ${totals.moneyUsed > totals.moneyMax ? 'over' : ''}">
          <div class="b-head">
            <span>💰 ${t('budget.money')}</span>
            <strong>$${totals.moneyUsed}M / $${totals.moneyMax}M</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${totals.moneyUsed > totals.moneyMax ? 'danger' : 'ok'}" style="width:${moneyPct}%"></div>
          </div>
        </div>

        <div class="budget-card ${totals.massUsed > totals.massMax ? 'over' : ''}">
          <div class="b-head">
            <span>⚖️ ${t('budget.mass')}</span>
            <strong>${totals.massUsed} / ${totals.massMax} kg (${totals.massMarginPct}% Marj)</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${totals.massUsed > totals.massMax ? 'danger' : totals.massMarginPct >= 10 ? 'ok' : 'warn'}" style="width:${massPct}%"></div>
          </div>
          <small class="b-sub">${totals.massMarginPct >= 10 ? '✅ ' + t('budget.margin_ok') : '⚠️ ' + t('budget.margin_low')}</small>
        </div>

        <div class="budget-card ${!totals.batteryNightSafe ? 'over' : ''}">
          <div class="b-head">
            <span>⚡ ${t('budget.power')}</span>
            <strong>Üretim: ${totals.powerProdW}W | Yük: ${totals.powerConsW}W</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${!totals.batteryNightSafe ? 'danger' : 'ok'}" style="width:${powerPct}%"></div>
          </div>
          <small class="b-sub">Gece İhtiyacı: ${totals.nightEnergyNeededKwh} kWh vs Batarya: ${d.batteryKwh} kWh</small>
        </div>

        <div class="budget-card">
          <div class="b-head">
            <span>📡 ${t('budget.data')} & Δv</span>
            <strong>${totals.dataPerSolMax} Mbit/Sol | Δv: ${totals.deltaVAvailableMs} m/s</strong>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ok" style="width:${Math.min(100, (totals.dataPerSolMax / 80) * 100)}%"></div>
          </div>
          <small class="b-sub">Seçilen Bilimsel Alet: ${d.instruments.length} / 5</small>
        </div>
      </div>

      <div class="design-main-grid">
        <div class="design-steps-col">
          <!-- EKRAN 1: Görev Hedefi -->
          <section class="design-card">
            <h3>🎯 ${t('design.step1_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.objectives
                .map(
                  (obj) => `
                <button class="choice-card ${d.objectiveFocus === obj.id ? 'selected' : ''}" data-field="objectiveFocus" data-val="${obj.id}">
                  <strong>${t(`obj.${obj.id}.name`)}</strong>
                  <p>${t(`obj.${obj.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- EKRAN 2: Roket, Yörünge ve Fırlatma Penceresi -->
          <section class="design-card">
            <h3>🚀 ${t('design.step2_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.rockets
                .map(
                  (r) => `
                <button class="choice-card ${d.rocketId === r.id ? 'selected' : ''}" data-field="rocketId" data-val="${r.id}">
                  <strong>${r.name}</strong>
                  <p>Kapasite: <b>${r.payloadMarsKg} kg</b> | Maliyet: <b>$${r.costM}M</b> | Isp: ${r.ispSec}s</p>
                </button>
              `
                )
                .join('')}
            </div>
            <div class="choice-row mt-8">
              ${NASA_DATA.orbits
                .map(
                  (o) => `
                <button class="choice-card ${d.orbitType === o.id ? 'selected' : ''}" data-field="orbitType" data-val="${o.id}">
                  <strong>${t(`orbit.${o.id}.name`)}</strong>
                  <p>${t(`orbit.${o.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>
            <div class="choice-row mt-8">
              <button class="choice-card ${d.launchWindowCaught ? 'selected' : ''}" data-window="true">
                <strong>🗓️ ${t('window.caught')}</strong>
              </button>
              <button class="choice-card ${!d.launchWindowCaught ? 'selected' : ''}" data-window="false">
                <strong>⏳ ${t('window.missed')}</strong>
              </button>
            </div>
          </section>

          <!-- EKRAN 3: İniş Bölgesi, Güç, Batarya ve Yalıtım -->
          <section class="design-card">
            <h3>🌍 ${t('design.step3_title')}</h3>
            <div class="choice-row">
              ${NASA_DATA.landingSites
                .map(
                  (s) => `
                <button class="choice-card ${d.landingSiteId === s.id ? 'selected' : ''}" data-field="landingSiteId" data-val="${s.id}">
                  <strong>${t(`site.${s.id}.name`)}</strong>
                  <p>${t(`site.${s.id}.desc`)}</p>
                </button>
              `
                )
                .join('')}
            </div>

            <div class="choice-row mt-8">
              <button class="choice-card ${d.powerSource === 'solar_only' ? 'selected' : ''}" data-field="powerSource" data-val="solar_only">
                <strong>☀️ ${t('pwr.solar_only.name')}</strong>
                <p>${t('pwr.solar_only.desc')}</p>
              </button>
              <button class="choice-card ${d.powerSource === 'solar_rtg' ? 'selected' : ''}" data-field="powerSource" data-val="solar_rtg">
                <strong>☢️ ${t('pwr.solar_rtg.name')}</strong>
                <p>${t('pwr.solar_rtg.desc')}</p>
              </button>
            </div>

            <div class="choice-row mt-8">
              ${NASA_DATA.habitatOptions.batteries
                .map(
                  (b) => `
                <button class="choice-card ${d.batteryKwh === b.kwh ? 'selected' : ''}" data-battery="${b.kwh}">
                  <strong>🔋 Batarya: ${b.kwh} kWh</strong>
                  <p>Kütle: ${b.massKg} kg | Maliyet: $${b.costM}M</p>
                </button>
              `
                )
                .join('')}
              <button class="choice-card ${d.insulation === 'thin' ? 'selected' : ''}" data-field="insulation" data-val="thin">
                <strong>🧊 ${t('ins.thin.name')}</strong>
              </button>
              <button class="choice-card ${d.insulation === 'thick' ? 'selected' : ''}" data-field="insulation" data-val="thick">
                <strong>🛡️ ${t('ins.thick.name')}</strong>
              </button>
            </div>
          </section>

          <!-- EKRAN 4: 9 Bilimsel Aletten En Fazla 5 Seçim -->
          <section class="design-card">
            <h3>🔬 ${t('design.step4_title')} (${d.instruments.length} / 5)</h3>
            <div class="instruments-grid">
              ${NASA_DATA.instruments
                .map((inst) => {
                  const active = d.instruments.includes(inst.id);
                  return `
                  <button class="inst-card ${active ? 'selected' : ''}" data-inst="${inst.id}">
                    <div class="inst-top">
                      <strong>${active ? '✅' : '⬜'} ${t(`inst.${inst.id}.name`)}</strong>
                      <span class="inst-cost">$${inst.costM}M</span>
                    </div>
                    <div class="inst-specs">${inst.massKg} kg | ${inst.powerW} W | ${inst.dataMbit} Mbit</div>
                    <p>${t(`inst.${inst.id}.desc`)}</p>
                  </button>
                `;
                })
                .join('')}
            </div>
          </section>

          <!-- EKRAN 5: İletişim Mimarisi & Yedek Parça Kiti -->
          <section class="design-card">
            <h3>📡 ${t('design.step5_title')}</h3>
            <div class="choice-row">
              <button class="choice-card ${d.commArchitecture === 'relay_only' ? 'selected' : ''}" data-field="commArchitecture" data-val="relay_only">
                <strong>📡 ${t('comm.relay_only.name')}</strong>
              </button>
              <button class="choice-card ${d.commArchitecture === 'relay_xband' ? 'selected' : ''}" data-field="commArchitecture" data-val="relay_xband">
                <strong>📡 ${t('comm.relay_xband.name')}</strong>
              </button>
            </div>
            <div class="choice-row mt-8">
              ${[0, 1, 2]
                .map(
                  (k) => `
                <button class="choice-card ${d.repairKits === k ? 'selected' : ''}" data-kits="${k}">
                  <strong>🔧 Yedek Parça / Tamir Kiti: ${k} Adet</strong>
                  <p>+${k * 22} kg | +$${k * 30}M (Her kit 1 krizi bedelsiz çözer)</p>
                </button>
              `
                )
                .join('')}
            </div>
          </section>
        </div>

        <!-- Sağ Sütun: SPOF Uyarıları (M8) ve Fırlatma Butonları -->
        <aside class="design-sidebar">
          <div class="spof-box">
            <h3>${t('design.spof_header')} (M8)</h3>
            ${
              totals.spofWarnings.length === 0
                ? `<div class="spof-ok">✅ Kritik Tek Nokta Arıza (SPOF) riski tespit edilmedi! Tasarımınız NASA yedeklilik standartlarına uygun.</div>`
                : `<ul class="spof-list">
                    ${totals.spofWarnings.map((wKey) => `<li>⚠️ ${t(wKey)}</li>`).join('')}
                  </ul>`
            }
          </div>

          <div class="launch-actions">
            <button class="btn-launch ${!totals.canLaunch ? 'disabled' : ''}" id="btn-start-mission" ${
              !totals.canLaunch ? 'disabled' : ''
            }>
              ${t('design.btn_launch')} (${state.demoMode ? '5 SOL HIZLI MOD' : '14 SOL TAM GÖREV'})
            </button>

            <button class="btn-secondary full-w" id="btn-demo-mode-launch">
              ${t('app.btn_demo_mission')}
            </button>

            <button class="btn-sm full-w" id="btn-reset-preset">
              🔄 ${t('design.btn_preset_balanced')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `;

  // Olay Dinleyicileri
  container.querySelectorAll('[data-field]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-field');
      const val = btn.getAttribute('data-val');
      updateState((s) => {
        s.design[field] = val;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-window]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caught = btn.getAttribute('data-window') === 'true';
      updateState((s) => {
        s.design.launchWindowCaught = caught;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-battery]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kwh = Number(btn.getAttribute('data-battery'));
      updateState((s) => {
        s.design.batteryKwh = kwh;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-kits]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kits = Number(btn.getAttribute('data-kits'));
      updateState((s) => {
        s.design.repairKits = kits;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelectorAll('[data-inst]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const instId = btn.getAttribute('data-inst');
      updateState((s) => {
        const list = s.design.instruments;
        if (list.includes(instId)) {
          if (list.length > 1) {
            s.design.instruments = list.filter((x) => x !== instId);
          }
        } else if (list.length < 5) {
          s.design.instruments = [...list, instId];
        }
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelector('#btn-start-mission')?.addEventListener('click', () => {
    launchMissionFromDesign();
  });

  container.querySelector('#btn-demo-mode-launch')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: true });
    launchMissionFromDesign();
  });

  container.querySelector('#btn-reset-preset')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: state.demoMode });
    bus.emit('audio:play', 'click');
  });
}

// --- MODULE: src/ui/hud.js ---
/**
 * SOL 14: RED HORIZON — Yüzey Operasyon HUD, Dönüşsüzlük Noktası (M4), Keşif Haritası ve Laboratuvar UI (K3)
 */


function renderSurfaceHud(container) {
  const state = getState();
  const ponr = getPointOfNoReturnStatus(state);
  const hasRadDetector = state.design.instruments.includes('rad');

  container.innerHTML = `
    <div class="hud-layout">
      <!-- Üst Telemetri ve Dönüşsüzlük Noktası (M4) Çubuğu -->
      <div class="hud-top-bar">
        <div class="sol-badge">
          <strong>SOL ${state.sol} / ${state.maxSols}</strong>
          <span class="time-pill">${state.timeOfDay.toUpperCase()}</span>
        </div>

        <!-- M4: O2 Çubuğu + Kırmızı Dönüşsüzlük Noktası Çentiği -->
        <div class="hud-stat-box o2-box ${ponr.isCritical ? 'critical-pulse' : ''}">
          <div class="stat-head">
            <span>🫧 O₂: <strong>${state.resources.o2}%</strong></span>
            <span class="ponr-text" title="${t('hud.ponr_label')}">Çentik: ${ponr.requiredO2}%</span>
          </div>
          <div class="o2-bar-container">
            <div class="o2-bar-fill" style="width:${state.resources.o2}%"></div>
            <div class="ponr-notch" style="left:${Math.min(96, ponr.requiredO2)}%" title="Dönüşsüzlük Noktası: Habitata dönmek için gereken minimum O2 (${ponr.requiredO2}%)"></div>
          </div>
        </div>

        <div class="hud-stat-box">
          <span>🔋 Enerji: <strong>${state.resources.energyKwh} / ${state.design.batteryKwh} kWh</strong></span>
          <small>Panel Tozu: %${Math.round(state.resources.panelDust * 100)}</small>
        </div>

        <div class="hud-stat-box">
          <span>🌡️ Elbise: <strong>${state.resources.suitTempC}°C</strong></span>
          <small>${state.resources.jointFrozen ? '❄️ EKLEM DONDU (%40 Hız)' : 'Normal Hareket'}</small>
        </div>

        <div class="hud-stat-box">
          <span>☢️ Doz: <strong>${hasRadDetector ? `${state.resources.radiationMsv} / 150 mSv` : '??? (RAD Yok)'}</strong></span>
          <small>🧠 Akıl Sağlığı: <strong>${state.resources.sanity}%</strong></small>
        </div>

        <div class="hud-stat-box">
          <span>💧 Su: <strong>${state.resources.waterLiters}L</strong> | 🚀 MAV: <strong>${state.resources.mavFuelPct}%</strong></span>
          <small>📡 Veri: <strong>${state.budgets.dataUsedThisSol}/${state.budgets.dataPerSolMax} Mbit</strong></small>
        </div>
      </div>

      ${
        ponr.isCritical
          ? `<div class="ponr-banner">${t('hud.ponr_warning')} (Mesafe: ${state.resources.evaDistanceM}m, Gerekli O₂: %${ponr.requiredO2})</div>`
          : ''
      }

      <!-- 5 Operasyon Sekmesi -->
      <div class="hud-tabs-nav">
        <button class="tab-btn ${state.activeTab === 'surface' ? 'active' : ''}" data-tab="surface">${t('hud.tab_surface')}</button>
        <button class="tab-btn ${state.activeTab === 'map' ? 'active' : ''}" data-tab="map">${t('hud.tab_map')}</button>
        <button class="tab-btn ${state.activeTab === 'lab' ? 'active' : ''}" data-tab="lab">${t('hud.tab_lab')}</button>
        <button class="tab-btn ${state.activeTab === 'downlink' ? 'active' : ''}" data-tab="downlink">${t('hud.tab_downlink')} (${state.downlinkQueue.filter((p) => !p.sent).length})</button>
        <button class="tab-btn ${state.activeTab === 'power' ? 'active' : ''}" data-tab="power">${t('hud.tab_power')}</button>
        <button class="btn-next-sol" id="btn-advance-sol">${t('hud.btn_next_sol')}</button>
      </div>

      <!-- Sekme İçerik Alanı -->
      <div id="hud-tab-Viewport" class="hud-viewport"></div>
    </div>
  `;

  // Sekme Geçişleri
  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      stopSurfaceCanvasLoop();
      updateState((s) => {
        s.activeTab = tab;
      });
      bus.emit('audio:play', 'click');
    });
  });

  container.querySelector('#btn-advance-sol')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    advanceSol();
  });

  const viewport = container.querySelector('#hud-tab-Viewport');
  if (state.activeTab === 'surface') {
    renderSurfaceCanvasTab(viewport);
  } else if (state.activeTab === 'map') {
    stopSurfaceCanvasLoop();
    renderForensicsMapTab(viewport);
  } else if (state.activeTab === 'lab') {
    stopSurfaceCanvasLoop();
    renderScienceLabTab(viewport);
  } else if (state.activeTab === 'downlink') {
    stopSurfaceCanvasLoop();
    renderDownlinkPanel(viewport);
  } else if (state.activeTab === 'power') {
    stopSurfaceCanvasLoop();
    renderPowerPanel(viewport);
  }
}

/**
 * SEKME 1: 2D 16-Bit Pixel Art Yüzey Canvas Sahnesi & EVA Kontrolleri
 */
function renderSurfaceCanvasTab(viewport) {
  const state = getState();
  viewport.innerHTML = `
    <div class="surface-stage-grid">
      <div class="canvas-holder">
        <canvas id="surface-canvas" width="960" height="440"></canvas>
        <div class="canvas-controls-bar">
          <button class="btn-sm" id="btn-eva-left">◀ Habitata Dön (-200m)</button>
          <button class="btn-sm" id="btn-eva-jump">⏫ 0.38g Sıçra (Space)</button>
          <button class="btn-sm" id="btn-eva-right">▶ Keşfe Yürü (+200m)</button>
          <button class="btn-sm" id="btn-time-day">☀️ Gündüz</button>
          <button class="btn-sm" id="btn-time-sunset">🌅 Mavi Gün Batımı</button>
          <button class="btn-sm" id="btn-time-night">🌌 Gece (-80°C)</button>
        </div>
      </div>

      <div class="surface-actions-panel">
        <h3>🛠️ Yüzey & Üs Operasyonları</h3>
        <button class="action-card-btn" id="act-clean-panels">
          <strong>${t('hud.btn_clean_panels')}</strong>
          <small>Panel tozunu %2'ye indirir, güneş üretimini ve şarjı artırır.</small>
        </button>

        <button class="action-card-btn" id="act-sabatier">
          <strong>${t('hud.btn_sabatier')}</strong>
          <small>CO₂ + 4H₂ → CH₄ + 2H₂O reaksiyonuyla +O₂ ve +MAV yakıtı üretir.</small>
        </button>

        <button class="action-card-btn" id="act-greenhouse">
          <strong>${t('hud.btn_greenhouse_care')}</strong>
          <small>Basınçlı seradaki filizleri sular, moral ve O₂ sağlar.</small>
        </button>

        <button class="action-card-btn" id="act-trigger-crisis">
          <strong>⚡ Kriz Kartı Simüle Et (Test / M2)</strong>
          <small>Sıradaki mühendislik kriz kartını anında açar.</small>
        </button>

        <div class="mini-log-box">
          <h4>📋 Son Mühendislik Kararları</h4>
          <ul>
            ${
              state.decisionLog.length === 0
                ? `<li class="muted">Henüz kayıt yok.</li>`
                : state.decisionLog
                    .slice(-3)
                    .reverse()
                    .map((l) => `<li><b>Sol ${l.sol}:</b> ${l.title} → ${l.choice}</li>`)
                    .join('')
            }
          </ul>
        </div>
      </div>
    </div>
  `;

  const canvas = viewport.querySelector('#surface-canvas');
  startSurfaceCanvasLoop(canvas);

  viewport.querySelector('#btn-eva-left')?.addEventListener('click', () => {
    triggerAstronautMove(-1);
    performEvaStep(-200);
  });
  viewport.querySelector('#btn-eva-right')?.addEventListener('click', () => {
    triggerAstronautMove(1);
    performEvaStep(200);
  });
  viewport.querySelector('#btn-eva-jump')?.addEventListener('click', () => {
    triggerAstronautJump();
  });

  viewport.querySelector('#btn-time-day')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'day';
    });
  });
  viewport.querySelector('#btn-time-sunset')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'sunset';
    });
  });
  viewport.querySelector('#btn-time-night')?.addEventListener('click', () => {
    updateState((s) => {
      s.timeOfDay = 'night';
    });
  });

  viewport.querySelector('#act-clean-panels')?.addEventListener('click', () => {
    triggerAstronautAction();
    cleanSolarPanels();
  });
  viewport.querySelector('#act-sabatier')?.addEventListener('click', () => {
    triggerAstronautAction();
    runSabatierIsru();
  });
  viewport.querySelector('#act-greenhouse')?.addEventListener('click', () => {
    tendGreenhouse();
  });
  viewport.querySelector('#act-trigger-crisis')?.addEventListener('click', () => {
    pickAndTriggerSolEvent();
  });
}

/**
 * SEKME 2: Kayıp Araçların Adli İncelemesi (Opportunity, Spirit, Phoenix, InSight, Beagle 2)
 */
function renderForensicsMapTab(viewport) {
  const state = getState();
  const hasDrone = state.design.instruments.includes('ingenuity');
  const hasSpec = state.design.instruments.includes('supercam');

  viewport.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.84), rgba(11,16,33,0.94)), url('assets/screens/scr_map_corridor.png');">
      <div class="panel-header-row">
        <div>
          <h2>🔍 ${t('forensics.title')}</h2>
          <p class="muted">${t('forensics.subtitle')}</p>
        </div>
        <div class="dsn-telemetry-badge">
          <div>🚁 Ingenuity Drone: <strong>${hasDrone ? 'AKTİF' : 'ALINMADI'}</strong></div>
          <div>🔬 Spektrometre: <strong>${hasSpec ? 'AKTİF' : 'ALINMADI'}</strong></div>
        </div>
      </div>

      <div class="cases-grid">
        ${NASA_DATA.forensicsCases
          .map((c) => {
            const rec = state.forensics[c.id];
            const evCount =
              (rec.evidence.photo ? 1 : 0) +
              (rec.evidence.telemetry ? 1 : 0) +
              (rec.evidence.env ? 1 : 0);

            return `
            <div class="case-card ${rec.sent ? 'case-sent' : ''}">
              <div class="case-top">
                <img src="${c.sprite}" alt="${c.name}" class="case-sprite" />
                <div>
                  <h3>${c.name} <small>(${c.agency})</small></h3>
                  <div class="case-meta">Son Temas: ${c.lastContact} | Mesafe: <b>${c.distanceMeters} m</b></div>
                  <div class="case-coords">Gerçek Konum: ${c.realCoords}</div>
                </div>
              </div>

              ${
                !rec.discovered
                  ? `
                <div class="case-discover-row">
                  <button class="btn-secondary btn-disc-eva" data-case="${c.id}">${t('forensics.btn_eva')} (${c.distanceMeters}m)</button>
                  ${
                    hasDrone
                      ? `<button class="btn-primary btn-disc-drone" data-case="${c.id}">${t('forensics.btn_drone')}</button>`
                      : ''
                  }
                </div>
              `
                  : `
                <div class="evidence-row">
                  <button class="ev-btn ${rec.evidence.photo ? 'done' : ''}" data-case="${c.id}" data-ev="photo">
                    ${rec.evidence.photo ? '✅' : '📷'} ${t('forensics.ev_photo')}
                  </button>
                  <button class="ev-btn ${rec.evidence.telemetry ? 'done' : ''}" data-case="${c.id}" data-ev="telemetry">
                    ${rec.evidence.telemetry ? '✅' : '🔌'} ${t('forensics.ev_telemetry')}
                  </button>
                  <button class="ev-btn ${rec.evidence.env ? 'done' : ''}" data-case="${c.id}" data-ev="env">
                    ${rec.evidence.env ? '✅' : '🔬'} ${t('forensics.ev_env')}
                  </button>
                </div>

                <div class="telemetry-readout">
                  📊 Kara Kutu Verisi: <code>${
                    evCount > 0 ? JSON.stringify(c.telemetryData) : 'Kanıt toplayarak telemetriyi açın...'
                  }</code>
                </div>

                <div class="diag-row">
                  <select class="diag-select" id="diag-sel-${c.id}">
                    ${DIAGNOSIS_CATEGORIES.map(
                      (cat) => `
                      <option value="${cat.id}" ${(rec.diagnosis || c.correctCategory) === cat.id ? 'selected' : ''}>
                        ${t(cat.labelKey)}
                      </option>
                    `
                    ).join('')}
                  </select>
                  <button class="btn-primary btn-submit-diag" data-case="${c.id}">
                    ${rec.queued ? '✅ Kuyrukta (' + rec.score + 'p)' : t('forensics.btn_submit')}
                  </button>
                </div>

                ${
                  rec.diagnosis
                    ? `
                  <div class="finding-box">
                    <p><strong>📘 ${t(`case.${c.id}.finding`)}</strong></p>
                    <p class="lesson-text">💡 ${t(`case.${c.id}.lesson`)}</p>
                    ${
                      !rec.salvaged
                        ? `<button class="btn-sm btn-salvage" data-case="${c.id}">${t('forensics.btn_salvage')}</button>`
                        : `<span class="badge-ok">🔧 Parça Söküldü & Envantere Eklendi</span>`
                    }
                  </div>
                `
                    : ''
                }
              `
              }
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.btn-disc-eva').forEach((btn) => {
    btn.addEventListener('click', () => {
      discoverWreck(btn.getAttribute('data-case'), 'eva');
    });
  });

  viewport.querySelectorAll('.btn-disc-drone').forEach((btn) => {
    btn.addEventListener('click', () => {
      discoverWreck(btn.getAttribute('data-case'), 'drone');
    });
  });

  viewport.querySelectorAll('.ev-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const caseId = btn.getAttribute('data-case');
      const evType = btn.getAttribute('data-ev');
      const mgType = evType === 'telemetry' ? 'wires' : evType === 'env' ? 'align' : 'qte';
      const res = await runMinigame(mgType, {
        title: `${caseId.toUpperCase()} — ${evType.toUpperCase()} Kanıt Toplama`
      });
      collectForensicEvidence(caseId, evType, res.score);
    });
  });

  viewport.querySelectorAll('.btn-submit-diag').forEach((btn) => {
    btn.addEventListener('click', () => {
      const caseId = btn.getAttribute('data-case');
      const sel = viewport.querySelector(`#diag-sel-${caseId}`);
      if (sel) {
        submitForensicDiagnosis(caseId, sel.value);
      }
    });
  });

  viewport.querySelectorAll('.btn-salvage').forEach((btn) => {
    btn.addEventListener('click', () => {
      salvageWreckPart(btn.getAttribute('data-case'));
    });
  });
}

/**
 * SEKME 3: Mars Bilim Laboratuvarı (6 Bilimsel Deney Döngüsü)
 */
function renderScienceLabTab(viewport) {
  const state = getState();

  viewport.innerHTML = `
    <div class="panel-screen" style="background-image: linear-gradient(rgba(11,16,33,0.85), rgba(11,16,33,0.94)), url('assets/screens/scr_lab_desk.png');">
      <div class="panel-header-row">
        <div>
          <h2>🧪 ${t('exp.title')}</h2>
          <p class="muted">${t('exp.subtitle')}</p>
        </div>
      </div>

      <div class="cases-grid">
        ${NASA_DATA.experiments
          .map((exp) => {
            const rec = state.experiments[exp.id];
            const hyps = EXPERIMENT_HYPOTHESES[exp.id] || [];
            const hasInst =
              !exp.requiredInstrument ||
              state.design.instruments.includes(exp.requiredInstrument);

            return `
            <div class="case-card ${rec.sent ? 'case-sent' : ''}">
              <h3>${t(`exp.${exp.id}.name`)}</h3>
              <p class="exp-question">❓ <strong>${t(`exp.${exp.id}.question`)}</strong></p>
              <div class="case-meta">
                Gerekli Alet: <b>${exp.requiredInstrument ? exp.requiredInstrument.toUpperCase() : 'Yok (Temel Fizik)'}</b>
                ${hasInst ? '✅' : '⚠️ (Eksik — Düşük Verim)'} | Enerji: <b>${exp.energyCostKwh} kWh</b> | Veri: <b>${exp.dataMbit} Mbit</b>
              </div>

              <div class="exp-form">
                <label>1. Hipotez Seçimi:</label>
                <select class="diag-select exp-hyp-sel" data-exp="${exp.id}">
                  ${hyps
                    .map(
                      (h) => `
                    <option value="${h.id}" ${rec.hypothesis === h.id ? 'selected' : ''}>
                      ${t(h.labelKey)}
                    </option>
                  `
                    )
                    .join('')}
                </select>

                <div class="exp-env-row">
                  <label>2. Ortam:</label>
                  <select class="diag-select exp-env-sel" data-exp="${exp.id}">
                    <option value="habitat" ${rec.environment === 'habitat' ? 'selected' : ''}>${t('exp.env_habitat')}</option>
                    <option value="surface" ${rec.environment === 'surface' ? 'selected' : ''}>${t('exp.env_surface')}</option>
                  </select>
                </div>

                <label class="ctrl-check">
                  <input type="checkbox" class="exp-ctrl-chk" data-exp="${exp.id}" ${rec.controlGroup ? 'checked' : ''} />
                  3. ${t('exp.control_group')}
                </label>

                <button class="btn-primary btn-run-exp" data-exp="${exp.id}" data-mg="${exp.minigameType}">
                  ${rec.completed ? `✅ Tamamlandı (${rec.score} Puan — Tekrar Ölç)` : t('exp.btn_run')}
                </button>
              </div>

              ${
                rec.completed
                  ? `
                <div class="finding-box">
                  <div>📏 <strong>Mars Ölçümü:</strong> ${exp.expectedMarsValue} ${exp.unit} vs <strong>Dünya Kontrolü:</strong> ${exp.expectedEarthValue} ${exp.unit}</div>
                  <p class="lesson-text">🔬 ${t(`exp.${exp.id}.result`)}</p>
                </div>
              `
                  : ''
              }
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;

  viewport.querySelectorAll('.exp-hyp-sel').forEach((sel) => {
    sel.addEventListener('change', () => {
      configureExperiment(sel.getAttribute('data-exp'), { hypothesis: sel.value });
    });
  });

  viewport.querySelectorAll('.exp-env-sel').forEach((sel) => {
    sel.addEventListener('change', () => {
      configureExperiment(sel.getAttribute('data-exp'), { environment: sel.value });
    });
  });

  viewport.querySelectorAll('.exp-ctrl-chk').forEach((chk) => {
    chk.addEventListener('change', () => {
      configureExperiment(chk.getAttribute('data-exp'), { controlGroup: chk.checked });
    });
  });

  viewport.querySelectorAll('.btn-run-exp').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const expId = btn.getAttribute('data-exp');
      const mgType = btn.getAttribute('data-mg') || 'qte';
      const res = await runMinigame(mgType, {
        title: t(`exp.${expId}.name`)
      });
      completeExperiment(expId, res.score);
    });
  });
}

// --- MODULE: src/ui/report_card.js ---
/**
 * SOL 14: RED HORIZON — UFO Stinger Final Sahnesi (~40 sn) ve M5: Neden-Sonuç Karnesi UI (K1, K3, K4)
 */


/**
 * 1. UFO Stinger Sahnesi (Kalkış -> Ufuktaki Işık -> Satır Satır İnen Foto -> Güneş Kavuşumu Kesintisi)
 */
function renderUfoStingerScreen(container) {
  const state = getState();
  const scoreData = calcMissionScore(state);
  const horizons = getHorizonsForSol(14);
  const isHighRes = scoreData.cameraTier === 'high';
  const maxPct = scoreData.ufoDownloadPct;

  container.innerHTML = `
    <div class="ufo-screen">
      <div class="ufo-stage-grid">
        <div class="ufo-visual-col">
          <div class="ufo-story-slides">
            <img src="assets/ending/ufo_liftoff.png" alt="MAV Liftoff" class="ufo-slide-img" />
            <img src="assets/ending/ufo_sky.png" alt="UFO Sky Anomaly" class="ufo-slide-img" />
          </div>
          <div class="ufo-scanline-box">
            <canvas id="ufo-scanline-canvas" width="640" height="340"></canvas>
            <div id="ufo-conjunction-banner" class="conjunction-overlay hidden">
              <div class="blink-three">✦ ✦ ✦</div>
              <h3>${t('ufo.stage4_cut')}</h3>
              <p>İndirme %${maxPct} seviyesinde kesildi (JPL Horizons Güneş Kavuşumu)</p>
            </div>
          </div>
        </div>

        <div class="ufo-telemetry-col">
          <span class="badge-ufo">SOL 14 — SON TELEMETRİ KAYDI</span>
          <h2>🛸 BİLİNMEYEN OPTİK ANOMALİ (STINGER)</h2>
          <p class="ufo-step-text">1️⃣ ${t('ufo.stage1')}</p>
          <p class="ufo-step-text">2️⃣ ${t('ufo.stage2')} <strong>(Işık Gecikmesi: ${horizons.formatted})</strong></p>
          <p class="ufo-step-text highlight">3️⃣ ${isHighRes ? t('ufo.stage3_high') : t('ufo.stage3_low')}</p>

          <div class="analyst-note-card">
            <p>${t('ufo.analyst_note')}</p>
          </div>

          <button class="btn-launch full-w" id="btn-go-report">
            ${t('ufo.btn_to_report')}
          </button>
        </div>
      </div>
    </div>
  `;

  bus.emit('audio:play', 'ufo_ping');

  const scanCanvas = container.querySelector('#ufo-scanline-canvas');
  const conjBanner = container.querySelector('#ufo-conjunction-banner');
  renderUfoScanlineCanvas(scanCanvas, {
    highRes: isHighRes,
    maxPct,
    onComplete: () => {
      conjBanner?.classList.remove('hidden');
      bus.emit('audio:play', 'alarm');
    }
  });

  container.querySelector('#btn-go-report')?.addEventListener('click', () => {
    updateState((s) => {
      s.phase = 'report';
    });
    bus.emit('audio:play', 'click');
  });
}

/**
 * 2. M5: Neden-Sonuç Karnesi (Cause-and-Effect Report Card) ve NASA Karşılaştırma Tablosu
 */
function renderReportCardScreen(container) {
  const state = getState();
  const score = calcMissionScore(state);
  const chains = buildCauseEffectChains(state);

  container.innerHTML = `
    <div class="report-screen">
      <div class="report-header">
        <div>
          <span class="tier-badge ${score.tier}">${t(`report.tier_${score.tier}`)}</span>
          <h1>📊 ${t('report.title')}</h1>
          <p class="muted">${t('report.subtitle')}</p>
        </div>
        <div class="total-score-box">
          <span>GÖREV BAŞARI PUANI (GBP)</span>
          <strong>${score.total}</strong>
          <small>Adli: ${score.sentForensicsCount}/5 | Deney: ${score.sentExperimentsCount}/6 Gönderildi</small>
        </div>
      </div>

      <!-- Puan Kırılım Kartları -->
      <div class="score-breakdown-grid">
        <div class="sb-card">
          <span>🔍 Adli İnceleme (Downlink)</span>
          <strong>+${score.forensicsScore} Puan</strong>
          <small>${score.sentForensicsCount} Rapor Dünya'ya Ulaştı</small>
        </div>
        <div class="sb-card">
          <span>🧪 Bilimsel Deneyler (Downlink)</span>
          <strong>+${score.experimentsScore} Puan</strong>
          <small>${score.sentExperimentsCount} Deney Dünya'ya Ulaştı</small>
        </div>
        <div class="sb-card">
          <span>🛡️ Hayatta Kalma & Sağ Dönüş</span>
          <strong>+${score.survivalScore} Puan</strong>
          <small>Sol ${state.sol} / ${state.maxSols}</small>
        </div>
        <div class="sb-card">
          <span>⚖️ Kütle Marjı Bonusu (%${state.budgets.massMarginPct})</span>
          <strong>+${score.marginBonus} Puan</strong>
          <small>Sistem Kaybı Cezası: -${score.penalties}</small>
        </div>
      </div>

      <!-- Neden-Sonuç Zincirleri (Her seçim başarıyı nasıl şekillendirdi?) -->
      <section class="report-section">
        <h3>🔗 Karar Analizi: "Her Mühendislik Seçimi Görev Başarısını Nasıl Şekillendirdi?"</h3>
        <div class="chains-list">
          ${chains
            .map(
              (c) => `
            <div class="chain-row ${c.type}">
              <div class="chain-decision">🛠️ <strong>${c.decision}</strong></div>
              <div class="chain-arrow">➔</div>
              <div class="chain-outcome">${c.outcome}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- Gerçek NASA Görevleriyle Kıyaslama Tablosu -->
      <section class="report-section">
        <h3>🚀 Gerçek NASA / ESA Mars Görevleriyle Mühendislik Karşılaştırması</h3>
        <table class="nasa-comp-table">
          <thead>
            <tr>
              <th>Parametre</th>
              <th>Sizin Tasarımınız (SOL 14)</th>
              <th>NASA Perseverance (2020)</th>
              <th>NASA Opportunity (2004–2018)</th>
              <th>NASA InSight (2018–2022)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>İniş Bölgesi</strong></td>
              <td>${state.design.landingSiteId.toUpperCase()}</td>
              <td>Jezero Krateri (18.4°K)</td>
              <td>Meridiani Planum (2°G)</td>
              <td>Elysium Planitia (4.5°K)</td>
            </tr>
            <tr>
              <td><strong>Güç Kaynağı</strong></td>
              <td>${state.design.powerSource === 'solar_rtg' ? 'Güneş Paneli + MMRTG (110W)' : 'Sadece Güneş Paneli'}</td>
              <td>MMRTG (110 W Nükleer)</td>
              <td>Güneş Paneli + 8× RHU</td>
              <td>Çift Yuvarlak Güneş Paneli</td>
            </tr>
            <tr>
              <td><strong>İletişim & Veri</strong></td>
              <td>${state.budgets.dataPerSolMax} Mbit/Sol (${state.design.commArchitecture})</td>
              <td>UHF Röle + X-Band Doğrudan</td>
              <td>UHF Röle + X-Band</td>
              <td>UHF Röle + X-Band</td>
            </tr>
            <tr>
              <td><strong>Kritik Ders / Sonuç</strong></td>
              <td><strong>${t(`report.tier_${score.tier}`)} (${score.total} GBP)</strong></td>
              <td>MOXIE, MEDA, RIMFAX ve Ingenuity ile aktif</td>
              <td>Sol 5111 küresel toz fırtınasında (τ=10.8) güç kaybı</td>
              <td>Sol 1440 panel tozlanmasıyla (%92) güç tükenmesi</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="report-footer">
        <button class="btn-launch" id="btn-replay-sol0">${t('report.btn_replay')}</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-replay-sol0')?.addEventListener('click', () => {
    resetState({ lang: state.lang, demoMode: false });
    bus.emit('audio:play', 'click');
  });
}

// --- MODULE: src/main.js ---
/**
 * SOL 14: RED HORIZON — Ana Uygulama Başlatıcı, Ekran Yönlendirici ve ?demo Modu (K1)
 */


function renderApp() {
  const state = getState();
  const root = document.getElementById('app-root');
  if (!root) return;

  // Üst bar başlıklarını dile göre güncelle
  const subEl = document.getElementById('nav-subtitle');
  if (subEl) subEl.textContent = t('app.subtitle');

  if (state.phase === 'design') {
    stopSurfaceCanvasLoop();
    renderDesignScreen(root);
  } else if (state.phase === 'surface') {
    renderSurfaceHud(root);
  } else if (state.phase === 'ufo') {
    stopSurfaceCanvasLoop();
    renderUfoStingerScreen(root);
  } else if (state.phase === 'report') {
    stopSurfaceCanvasLoop();
    renderReportCardScreen(root);
  }

  renderDecisionCardModal();
}

function setupTopBarActions() {
  document.getElementById('btn-nav-sol0')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    resetState({ lang: getState().lang, demoMode: false });
  });

  document.getElementById('btn-nav-demo')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    resetState({ lang: getState().lang, demoMode: true });
    launchMissionFromDesign();
  });

  document.getElementById('btn-nav-ufo')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    updateState((s) => {
      s.phase = 'ufo';
      s.ufoEnding.triggered = true;
    });
  });

  document.getElementById('btn-nav-report')?.addEventListener('click', () => {
    stopSurfaceCanvasLoop();
    updateState((s) => {
      s.phase = 'report';
    });
  });

  document.getElementById('btn-nav-lang')?.addEventListener('click', () => {
    const nextLang = getState().lang === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
  });

  const muteBtn = document.getElementById('btn-nav-mute');
  muteBtn?.addEventListener('click', () => {
    const m = toggleMute();
    muteBtn.textContent = m ? '🔇 Ses Kapalı' : '🔊 Ses Açık';
  });
}

function setupKeyboardControls() {
  window.addEventListener('keydown', (e) => {
    const state = getState();
    if (state.phase !== 'surface' || state.activeTab !== 'surface' || state.activeCrisis) {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      triggerAstronautJump();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      triggerAstronautMove(1);
      performEvaStep(100);
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      triggerAstronautMove(-1);
      performEvaStep(-100);
    }
  });
}

// TESTING.md kapsamında geliştirici ve jüri hızlı test konsolu
if (typeof window !== 'undefined') {
  window.SOL14_DEBUG = {
    getState,
    nextSol: () => advanceSol(),
    triggerCrisis: (id) => pickAndTriggerSolEvent(id),
    playUfoEnding: () =>
      updateState((s) => {
        s.phase = 'ufo';
      }),
    showReport: () =>
      updateState((s) => {
        s.phase = 'report';
      })
  };
}

function bootApp() {
  initAudioBus();
  initSurfaceFx();
  preloadAllSprites();

  const params = new URLSearchParams(window.location.search);
  const isDemo = params.get('demo') === '1' || params.get('demo') === 'true';
  const urlLang = params.get('lang');

  const loaded = loadStateFromStorage();
  if (urlLang === 'en' || urlLang === 'tr') {
    setLanguage(urlLang);
  }

  if (isDemo) {
    resetState({ lang: getState().lang, demoMode: true });
    launchMissionFromDesign();
  } else if (!loaded) {
    resetState({ lang: urlLang || 'tr', demoMode: false });
  }

  bus.on('state:changed', () => renderApp());
  setupTopBarActions();
  setupKeyboardControls();
  renderApp();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

})();

