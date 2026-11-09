/**
 * Formula library (Task 3): pure functions implementing the names declared
 * in `registry.ts`, each with its units. All trig in/out is degrees.
 *
 * Accuracy over spectacle: these are real astronomy approximations.
 */

const DEG = Math.PI / 180;

function sinDeg(deg: number): number {
  return Math.sin(deg * DEG);
}

function cosDeg(deg: number): number {
  return Math.cos(deg * DEG);
}

/**
 * The Sun's declination for a day of the year, given Earth's axial tilt.
 * Approximation δ = -tilt · cos(360°/365 · (N + 10)), good to ~1°.
 * +tilt at the June solstice, -tilt at the December solstice, 0 at equinoxes.
 */
export function solarDeclination(dayOfYear: number, tilt: number): number {
  return -tilt * cosDeg((360 / 365) * (dayOfYear + 10));
}

/** The Sun's altitude above the horizon at solar noon, in degrees. */
export function noonSunAltitude(latitude: number, declination: number): number {
  return 90 - Math.abs(latitude - declination);
}

/**
 * Geometric day length: hours the Sun's *centre* is above the horizon,
 * clamped to 0-24 for polar night and polar day. The UI labels this
 * "geometric" (it ignores atmospheric refraction and the solar disc).
 */
export function daylightHours(latitude: number, declination: number): number {
  const cosH = -Math.tan(latitude * DEG) * Math.tan(declination * DEG);
  const clamped = Math.min(1, Math.max(-1, cosH));
  const H = Math.acos(clamped); // 0..π, half the daylight arc
  return (24 * H) / Math.PI;
}

/**
 * How many times larger the sunlit patch is than with the Sun overhead:
 * 1/sin(altitude). Returns Infinity when the Sun is on or below the horizon.
 */
export function beamSpread(altitude: number): number {
  if (altitude <= 0) return Number.POSITIVE_INFINITY;
  return 1 / sinDeg(altitude);
}

/**
 * Earth-Sun distance in millions of km along the elliptical orbit
 * (e = 0.0167, a = 149.6), with perihelion in early January (day ~3).
 */
export function earthSunDistance(dayOfYear: number): number {
  const a = 149.6; // million km, semi-major axis
  const e = 0.0167;
  const perihelionDay = 3; // early January
  const M = ((360 / 365.25) * (dayOfYear - perihelionDay) * DEG) % (2 * Math.PI);
  // Equation of centre to first order in e.
  const nu = M + 2 * e * Math.sin(M);
  return (a * (1 - e * e)) / (1 + e * Math.cos(nu));
}

/**
 * The Sun-Moon elongation angle E seen from Earth: 0° at new moon, 180° at
 * full moon. For this circular orbit model E is the orbit angle measured
 * from the Sun's direction, normalised to [0, 360).
 */
export function moonElongation(orbitAngle: number): number {
  return ((orbitAngle % 360) + 360) % 360;
}

/** The lit fraction of the Moon's Earth-facing disc: (1 − cos E) / 2. */
export function illuminatedFraction(elongation: number): number {
  return (1 - cosDeg(elongation)) / 2;
}

/** Registry name → implementation, used by the readout evaluator. */
export const FORMULA_FNS: Record<string, (...args: number[]) => number> = {
  solarDeclination,
  noonSunAltitude,
  daylightHours,
  beamSpread,
  earthSunDistance,
  moonElongation,
  illuminatedFraction,
};

/** Input order per formula name, matching the registry definitions. */
const FORMULA_ARG_ORDER: Record<string, string[]> = {
  solarDeclination: ["dayOfYear", "tilt"],
  noonSunAltitude: ["latitude", "declination"],
  daylightHours: ["latitude", "declination"],
  beamSpread: ["altitude"],
  earthSunDistance: ["dayOfYear"],
  moonElongation: ["orbitAngle"],
  illuminatedFraction: ["elongation"],
};

export interface FormulaSample {
  formula: string;
  inputsText: string;
  value: string;
  unit: string;
}

/** Sample outputs for the /dev/validate page. */
export function samples(): FormulaSample[] {
  const units: Record<string, string> = {
    solarDeclination: "°",
    noonSunAltitude: "°",
    daylightHours: "h",
    beamSpread: "×",
    earthSunDistance: "million km",
    moonElongation: "°",
    illuminatedFraction: "fraction",
  };
  const results: FormulaSample[] = [];
  for (const [name, fn] of Object.entries(FORMULA_FNS)) {
    const argOrder = FORMULA_ARG_ORDER[name];
    // Known-good literal examples per formula.
    const examples: Record<string, Record<string, number>> = {
      solarDeclination: { dayOfYear: 172, tilt: 23.44 },
      noonSunAltitude: { latitude: 51.5, declination: 23.44 },
      daylightHours: { latitude: 51.5, declination: 0 },
      beamSpread: { altitude: 62 },
      earthSunDistance: { dayOfYear: 3 },
      moonElongation: { orbitAngle: 90 },
      illuminatedFraction: { elongation: 180 },
    };
    const inputValues = examples[name];
    const args = argOrder.map((k) => inputValues[k]);
    const value = fn(...args);
    const inputsText = argOrder.map((k) => `${k}=${inputValues[k]}`).join(", ");
    results.push({
      formula: name,
      inputsText,
      value: Number.isFinite(value) ? value.toFixed(3) : "∞ (Sun below horizon)",
      unit: units[name] ?? "",
    });
  }
  return results;
}
