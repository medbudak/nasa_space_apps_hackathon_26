// Every game formula lives here as a pure function: no state, no DOM, no real-world numbers.
// Callers pass values read from src/data/nasa_data.json. Tested in tests/engineering.test.mjs.

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Solar array output in W. P = S · A · η · cos Z · (1 − dust) */
export function solarPower_W({ irradiance_Wm2, area_m2, efficiency, cosZenith, dustLoss = 0 }) {
  return irradiance_Wm2 * area_m2 * efficiency * Math.max(0, cosZenith) * (1 - clamp01(dustLoss));
}

/** Tsiolkovsky rocket equation in m/s. Δv = Isp · g0 · ln(m0 / mf) */
export function deltaV_ms({ isp_s, g0_ms2, wetMass_kg, dryMass_kg }) {
  if (dryMass_kg <= 0 || wetMass_kg < dryMass_kg) throw new RangeError('need wetMass_kg >= dryMass_kg > 0');
  return isp_s * g0_ms2 * Math.log(wetMass_kg / dryMass_kg);
}

/** One-way light time in s. t = d / c */
export function lightDelay_s(distance_km, c_kms) {
  return distance_km / c_kms;
}

/** Pendulum period in s. T = 2π √(L / g) */
export function pendulumPeriod_s(length_m, g_ms2) {
  return 2 * Math.PI * Math.sqrt(length_m / g_ms2);
}

/** Gravity measured with a pendulum, in m/s². g = 4π² L / T² */
export function gravityFromPendulum_ms2(length_m, period_s) {
  return (4 * Math.PI ** 2 * length_m) / period_s ** 2;
}

/** Free-fall time from rest in s. t = √(2h / g) */
export function fallTime_s(height_m, g_ms2) {
  return Math.sqrt((2 * height_m) / g_ms2);
}

/** Gravity measured by a drop, in m/s². g = 2h / t² */
export function gravityFromFall_ms2(height_m, time_s) {
  return (2 * height_m) / time_s ** 2;
}

/**
 * Point of no return: O2 needed to walk back to the habitat, in kg.
 * O2 = (distance / current speed) · consumption · safety factor
 */
export function oxygenToReturn_kg({ distance_m, speed_ms, consumption_kgPerS, safetyFactor }) {
  if (speed_ms <= 0) return Infinity;
  return (distance_m / speed_ms) * consumption_kgPerS * safetyFactor;
}

/** Share of launch capacity left unused, 0..1. Negative means the design is too heavy to launch. */
export function massMargin(capacity_kg, totalMass_kg) {
  return (capacity_kg - totalMass_kg) / capacity_kg;
}

/** True when a measurement is within ±tolerance (a fraction, e.g. 0.1) of the expected value. */
export function withinTolerance(measured, expected, tolerance) {
  return Math.abs(measured - expected) <= Math.abs(expected) * tolerance;
}
