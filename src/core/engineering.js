// Every game formula lives here as a pure function: no state, no DOM, no real-world numbers.
// Callers pass values read from src/data/nasa_data.json. Tested in tests/engineering.test.mjs.
// The Sol 0 estimate (evaluateDesign) and K2's surface simulation use the same functions,
// so what the design screen promises is what the player lives through.

const DEG = Math.PI / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Sol fractions: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset (equinox model).
const SUNRISE = 0.25;
const NOON = 0.5;

/**
 * Cosine of the solar zenith angle, 0 when the Sun is down.
 * cos Z = sin φ sin δ + cos φ cos δ cos h, with hour angle h = 2π (solFraction − 0.5).
 * Defaults (equator, equinox) give sunrise 06:00 and sunset 18:00.
 */
export function sunCos(solFraction, latitudeDeg = 0, declinationDeg = 0) {
  const phi = latitudeDeg * DEG;
  const delta = declinationDeg * DEG;
  const h = 2 * Math.PI * (solFraction - NOON);
  return Math.max(0, Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h));
}

/** Solar array output in W. P = S · A · η · cos Z · (1 − dust). irradiance in W/m², area in m². */
export function solarPower({ irradiance, area, efficiency, cosZ, dust = 0 }) {
  return irradiance * area * efficiency * Math.max(0, cosZ) * (1 - clamp01(dust));
}

/**
 * Outside air temperature in °C over a sol. Simplified: coldest at sunrise, warmest at noon
 * (MEDA reports Jezero "–83 Celsius pre-dawn to 5 Celsius at noon"), smooth cosine in between.
 */
export function surfaceTemp({ minC, maxC, solFraction }) {
  const f = ((solFraction % 1) + 1) % 1;
  const warming = f >= SUNRISE && f < NOON;
  const progress = warming
    ? (f - SUNRISE) / (NOON - SUNRISE) // sunrise → noon
    : 1 - ((f < SUNRISE ? f + 1 : f) - NOON) / (1 + SUNRISE - NOON); // noon → next sunrise
  return minC + ((maxC - minC) * (1 - Math.cos(Math.PI * progress))) / 2;
}

/**
 * Habitat air temperature in °C after dtHours without heating (Newton's law of cooling):
 * the inside moves toward the outside with time constant coolingTimeH.
 * Heating is part of the habitat power load, so this only applies while that load is cut.
 */
export function habitatTemp({ insideC, outsideC, dtHours, coolingTimeH }) {
  return outsideC + (insideC - outsideC) * Math.exp(-dtHours / coolingTimeH);
}

/** Tsiolkovsky rocket equation in m/s. Δv = Isp · g0 · ln(m0 / mf) */
export function deltaV({ isp, g0, wetMass, dryMass }) {
  if (dryMass <= 0 || wetMass < dryMass) throw new RangeError('need wetMass >= dryMass > 0');
  return isp * g0 * Math.log(wetMass / dryMass);
}

/** One-way light time in s. t = d / c */
export function lightDelaySec(distanceKm, cKms) {
  return distanceKm / cKms;
}

/** Pendulum period in s. T = 2π √(L / g) */
export function pendulumPeriod(lengthM, g) {
  return 2 * Math.PI * Math.sqrt(lengthM / g);
}

/** Gravity measured with a pendulum, in m/s². g = 4π² L / T² */
export function gravityFromPendulum(lengthM, periodSec) {
  return (4 * Math.PI ** 2 * lengthM) / periodSec ** 2;
}

/** Free-fall time from rest in s. t = √(2h / g) */
export function fallTime(heightM, g) {
  return Math.sqrt((2 * heightM) / g);
}

/** Gravity measured by a drop, in m/s². g = 2h / t² */
export function gravityFromFall(heightM, timeSec) {
  return (2 * heightM) / timeSec ** 2;
}

/**
 * Point of no return: O2 needed to walk back to the habitat, in kg.
 * O2 = (distance / current speed) · consumption · safety factor
 */
export function oxygenToReturn({ distanceM, speedMs, o2KgPerSec, safetyFactor }) {
  if (speedMs <= 0) return Infinity;
  return (distanceM / speedMs) * o2KgPerSec * safetyFactor;
}

/** Share of launch capacity left unused, 0..1. Negative means too heavy to launch. */
export function massMargin(capacityKg, massKg) {
  return (capacityKg - massKg) / capacityKg;
}

/** True when a measurement is within ±tolerance (a fraction, e.g. 0.1) of the expected value. */
export function withinTolerance(measured, expected, tolerance) {
  return Math.abs(measured - expected) <= Math.abs(expected) * tolerance;
}

// --- Sol 0 design evaluation -------------------------------------------------

const SOL_STEPS = 96; // integration steps over one sol

const find = (list, id) => list?.find((x) => x.id === id);
const v = (rowObj, field) => rowObj?.[field]?.value ?? 0;

/**
 * Night energy in kWh for one sol at a site: habitat load − continuous power,
 * integrated over the hours the Sun is down. Uses the same functions as the surface simulation.
 */
export function nightEnergyKWh({ latitudeDeg, loadW, continuousW, solHours }) {
  const dtHours = solHours / SOL_STEPS;
  let wh = 0;
  for (let i = 0; i < SOL_STEPS; i++) {
    const f = (i + 0.5) / SOL_STEPS;
    if (sunCos(f, latitudeDeg) > 0) continue;
    wh += Math.max(0, loadW - continuousW) * dtHours;
  }
  return wh / 1000;
}

/** Solar energy in kWh over one clear sol at a site (no dust). */
export function solarEnergyKWh({ latitudeDeg, irradiance, area, efficiency, solHours, dust = 0 }) {
  const dtHours = solHours / SOL_STEPS;
  let wh = 0;
  for (let i = 0; i < SOL_STEPS; i++) {
    const cosZ = sunCos((i + 0.5) / SOL_STEPS, latitudeDeg);
    wh += solarPower({ irradiance, area, efficiency, cosZ, dust }) * dtHours;
  }
  return wh / 1000;
}

/**
 * Totals for a Sol 0 design (shape read by K3's design screen).
 * design: { objectiveId, rocketId, trajectoryId, siteId, powerId, batteryId, insulationId,
 *           instrumentIds: [], commsId, spareKitsId }
 * unresearched lists every PLACEHOLDER value the totals depend on, so the screen can flag them.
 */
export function evaluateDesign(design, data) {
  const rocket = find(data.launchVehicles, design.rocketId);
  const traj = find(data.trajectories, design.trajectoryId);
  const site = find(data.landingSites, design.siteId);
  const power = find(data.powerSources, design.powerId);
  const battery = find(data.batteries, design.batteryId);
  const insulation = find(data.insulation, design.insulationId);
  const comms = find(data.comms, design.commsId);
  const kits = find(data.spareKits, design.spareKitsId);
  const instruments = (design.instrumentIds ?? []).map((id) => find(data.instruments, id)).filter(Boolean);

  const parts = [traj, power, battery, insulation, comms, kits, ...instruments];
  const unresearched = [];
  const track = (rowObj, field, label) => {
    if (rowObj?.[field]?.src === 'PLACEHOLDER') unresearched.push(`${label}.${field}`);
  };
  for (const p of [rocket, ...parts]) {
    if (!p) continue;
    track(p, 'costMUSD', p.id);
    track(p, 'massKg', p.id);
  }
  track(rocket, 'capacityKg', rocket?.id);
  track(data.rules, 'budgetMUSD', 'rules');
  track(data.rules, 'baseMassKg', 'rules');

  // A power source with an RTG lists the RTG's own mass and cost next to the panels'.
  const cost = v(rocket, 'costMUSD') + parts.reduce((sum, p) => sum + v(p, 'costMUSD') + v(p, 'rtgCostMUSD'), 0);
  const mass = v(data.rules, 'baseMassKg') + parts.reduce((sum, p) => sum + v(p, 'massKg') + v(p, 'rtgMassKg'), 0);
  const instrumentDayW = instruments.reduce((sum, p) => sum + v(p, 'powerW'), 0);

  const solHours = v(data.mars, 'solHours');
  const latitudeDeg = v(site, 'latitudeDeg');
  const habitatW = v(data.rules, 'habitatPowerW');
  const continuousW = v(power, 'continuousW');
  const nightNeedKWh = site
    ? nightEnergyKWh({
        latitudeDeg,
        loadW: habitatW + (data.rules.instrumentsAtNight?.value ? instrumentDayW : 0),
        continuousW,
        solHours,
      })
    : 0;
  // A whole clear sol: what the panels and continuous sources make versus what the habitat uses.
  // Negative means the battery runs down a little more every sol, even without dust.
  const solarKWhPerSol = site
    ? solarEnergyKWh({
        latitudeDeg,
        irradiance: v(data.mars, 'solarIrradianceWm2'),
        area: v(power, 'panelAreaM2'),
        efficiency: v(power, 'panelEfficiency'),
        solHours,
      })
    : 0;
  // Instruments run in daylight only (half a sol at equinox) unless rules.instrumentsAtNight.
  const instrumentHours = data.rules.instrumentsAtNight?.value ? solHours : solHours / 2;
  const netKWhPerSol = site
    ? solarKWhPerSol + ((continuousW - habitatW) * solHours - instrumentDayW * instrumentHours) / 1000
    : 0;

  return {
    cost,
    budget: v(data.rules, 'budgetMUSD'),
    mass,
    capacity: v(rocket, 'capacityKg'),
    nightNeedKWh,
    solarKWhPerSol,
    netKWhPerSol,
    coolingTimeH: v(insulation, 'coolingTimeH'),
    batteryKWh: v(battery, 'capacityKWh'),
    instrumentDayW,
    transitDays: v(traj, 'transitDays'),
    downlinkMbitPerSol: v(comms, 'mbitPerSol'),
    unresearched,
  };
}
