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
];

export const FORMULA_NAMES = FORMULA_LIBRARY.map((f) => f.name);

export function getFormula(name: string): FormulaDef | undefined {
  return FORMULA_LIBRARY.find((f) => f.name === name);
}
