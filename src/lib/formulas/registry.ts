/**
 * The formula name list (Task 2). Task 3 implements the functions behind
 * these names in `formulas/index.ts`.
 *
 * Every formula declares its input names and units so the AI prompt and the
 * validator share one source of truth.
 */

export interface FormulaInputDef {
  name: string;
  unit: string;
  description: string;
}

export interface FormulaDef {
  name: string;
  description: string;
  inputs: FormulaInputDef[];
  /** Output unit shown next to the readout value. */
  outputUnit: string;
  /** Human example of a valid input set, used for /dev/validate samples. */
  example?: Record<string, number>;
}

export const FORMULA_LIBRARY: FormulaDef[] = [
  {
    name: "solarDeclination",
    description:
      "The Sun's declination angle for a day of the year, given Earth's axial tilt. +23.44° at the June solstice, -23.44° at the December solstice, 0° at the equinoxes.",
    inputs: [
      { name: "dayOfYear", unit: "day", description: "1-366, day number in the year" },
      { name: "tilt", unit: "°", description: "Earth's axial tilt in degrees" },
    ],
    outputUnit: "°",
    example: { dayOfYear: 172, tilt: 23.44 },
  },
  {
    name: "noonSunAltitude",
    description:
      "The Sun's altitude above the horizon at solar noon for a latitude and solar declination.",
    inputs: [
      { name: "latitude", unit: "°", description: "Latitude, north positive" },
      { name: "declination", unit: "°", description: "The Sun's declination angle" },
    ],
    outputUnit: "°",
    example: { latitude: 51.5, declination: 23.44 },
  },
  {
    name: "daylightHours",
    description:
      "Geometric day length: hours the Sun's centre is above the horizon, clamped to 0-24 for polar night and polar day. The UI labels it 'geometric'.",
    inputs: [
      { name: "latitude", unit: "°", description: "Latitude, north positive" },
      { name: "declination", unit: "°", description: "The Sun's declination angle" },
    ],
    outputUnit: "h",
    example: { latitude: 51.5, declination: 0 },
  },
  {
    name: "beamSpread",
    description:
      "How many times larger the sunlit patch is than with the Sun directly overhead: 1/sin(altitude). Larger spread means the same energy is spread thinner.",
    inputs: [
      { name: "altitude", unit: "°", description: "The Sun's altitude above the horizon" },
    ],
    outputUnit: "×",
    example: { altitude: 62 },
  },
  {
    name: "earthSunDistance",
    description:
      "Earth-Sun distance along the elliptical orbit, with perihelion (closest) in early January and aphelion (farthest) in early July.",
    inputs: [
      { name: "dayOfYear", unit: "day", description: "1-366, day number in the year" },
    ],
    outputUnit: "million km",
    example: { dayOfYear: 3 },
  },
  {
    name: "moonElongation",
    description:
      "The Sun-Moon angle E seen from Earth: 0° at new moon, 90° at quarters, 180° at full moon.",
    inputs: [
      { name: "orbitAngle", unit: "°", description: "The Moon's orbital position around Earth" },
    ],
    outputUnit: "°",
    example: { orbitAngle: 90 },
  },
  {
    name: "illuminatedFraction",
    description:
      "The fraction of the Moon's Earth-facing disc that is lit: (1 − cos E) / 2. 0 at new moon, 0.5 at quarters, 1 at full moon.",
    inputs: [
      { name: "elongation", unit: "°", description: "The Sun-Moon elongation angle" },
    ],
    outputUnit: "fraction",
    example: { elongation: 180 },
  },
  {
    name: "moonEclipticLatitude",
    description:
      "How far the Moon sits above or below the ecliptic plane at its current orbital position, given the tilt of its orbit. Max at ±90° from the node line, 0° at the nodes — which is why eclipses only happen near eclipse seasons, not every month.",
    inputs: [
      { name: "orbitAngle", unit: "°", description: "The Moon's orbital position around Earth, measured from a node" },
      { name: "inclination", unit: "°", description: "The tilt of the Moon's orbit relative to the ecliptic (real value ≈ 5.1°)" },
    ],
    outputUnit: "°",
    example: { orbitAngle: 90, inclination: 5.1 },
  },
  {
    name: "angularSize",
    description:
      "The apparent angular diameter of a body seen from a distance: 2·atan(diameter / (2·distance)). Compare the Sun's and Moon's apparent sizes to explain total vs annular eclipses.",
    inputs: [
      { name: "diameterKm", unit: "km", description: "The body's physical diameter" },
      { name: "distanceKm", unit: "km", description: "Distance from the observer to the body" },
    ],
    outputUnit: "°",
    example: { diameterKm: 3475, distanceKm: 384400 },
  },
  {
    name: "angularSizeRatio",
    description:
      "The Moon's angular size divided by the Sun's. Above 1 the Moon fully covers the Sun (total eclipse possible); below 1 it cannot (annular eclipse).",
    inputs: [
      { name: "moonDiameterKm", unit: "km", description: "The Moon's diameter (≈3475)" },
      { name: "moonDistanceKm", unit: "km", description: "Earth-Moon distance" },
      { name: "sunDiameterKm", unit: "km", description: "The Sun's diameter (≈1,391,000)" },
      { name: "sunDistanceKm", unit: "km", description: "Earth-Sun distance" },
    ],
    outputUnit: "×",
    example: { moonDiameterKm: 3475, moonDistanceKm: 384400, sunDiameterKm: 1391000, sunDistanceKm: 149600000 },
  },
];

export const FORMULA_NAMES = FORMULA_LIBRARY.map((f) => f.name);

export function getFormula(name: string): FormulaDef | undefined {
  return FORMULA_LIBRARY.find((f) => f.name === name);
}
