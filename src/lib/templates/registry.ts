/**
 * Template registry: hand-built templates DeepSeek can match a concept to.
 * Task 5 builds the Seasons template itself; this registry entry is what
 * DeepSeek receives for matching and what the validator checks against.
 */

export interface TemplateVariableDef {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
  description: string;
}

export interface TemplateReadoutDef {
  id: string;
  label: string;
  formula: string;
  inputs: Record<string, number | string>;
}

export interface TemplateDef {
  id: string;
  title: string;
  /** One-paragraph description used in the AI matching prompt. */
  description: string;
  /** Keywords that hint at a match (also shown to the teacher). */
  keywords: string[];
  variables: TemplateVariableDef[];
  readouts: TemplateReadoutDef[];
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "seasons",
    title: "Why Earth has seasons",
    description:
      "Earth orbiting the tilted Sun with a city ground view: students scrub through the orbit, change Earth's axial tilt and the observer's latitude, and see sunlight angle, beam spread, day length and the Earth-Sun distance change together. Shows that seasons come from tilt, not distance.",
    keywords: [
      "season",
      "seasons",
      "summer",
      "winter",
      "spring",
      "autumn",
      "fall",
      "axial tilt",
      "solstice",
      "equinox",
      "tilt of the earth",
      "why do we have seasons",
      "day length",
      "sun angle",
      "hemisphere",
    ],
    variables: [
      {
        id: "dayOfYear",
        label: "Position in orbit (day of year)",
        min: 1,
        max: 365,
        step: 1,
        default: 172,
        unit: "day",
        description: "Where Earth is in its orbit, day 1 = 1 January.",
      },
      {
        id: "tilt",
        label: "Earth's axial tilt",
        min: 0,
        max: 45,
        step: 0.5,
        default: 23.44,
        unit: "°",
        description: "Earth's axial tilt in degrees. 0° removes the seasons.",
      },
      {
        id: "latitude",
        label: "Observer latitude",
        min: -90,
        max: 90,
        step: 0.5,
        default: 51.5,
        unit: "°",
        description: "Latitude of the ground-view observer, north positive.",
      },
    ],
    readouts: [
      {
        id: "declination",
        label: "Sun's declination",
        formula: "solarDeclination",
        inputs: { dayOfYear: "$dayOfYear", tilt: "$tilt" },
      },
      {
        id: "noonAltitude",
        label: "Noon sun altitude",
        formula: "noonSunAltitude",
        inputs: { latitude: "$latitude", declination: "$declination" },
      },
      {
        id: "beamSpread",
        label: "Beam spread (vs overhead sun)",
        formula: "beamSpread",
        inputs: { altitude: "$noonAltitude" },
      },
      {
        id: "daylight",
        label: "Daylight hours (geometric)",
        formula: "daylightHours",
        inputs: { latitude: "$latitude", declination: "$declination" },
      },
      {
        id: "distance",
        label: "Earth-Sun distance",
        formula: "earthSunDistance",
        inputs: { dayOfYear: "$dayOfYear" },
      },
    ],
  },
  {
    id: "eclipses",
    title: "Solar and lunar eclipses",
    description:
      "Earth, the Moon and shadow cones: students scrub the Moon around its tilted orbit, change the orbit's inclination and the Moon's distance, and see when the Moon's shadow reaches Earth (solar eclipse) and when the Moon enters Earth's shadow (lunar eclipse). Shows that eclipses need node alignment, so they do not happen every month.",
    keywords: [
      "eclipse",
      "eclipses",
      "solar eclipse",
      "lunar eclipse",
      "annular eclipse",
      "total eclipse",
      "umbra",
      "penumbra",
      "shadow of the moon",
      "earth's shadow",
      "node",
      "nodes of the moon's orbit",
      "alignment",
      "moon's orbit tilt",
      "eclipse season",
    ],
    variables: [
      {
        id: "orbitAngle",
        label: "Moon's position in its orbit",
        min: 0,
        max: 360,
        step: 1,
        default: 0,
        unit: "°",
        description:
          "Where the Moon is in its orbit, measured from the node that points toward the Sun (0° = new moon at a node).",
      },
      {
        id: "inclination",
        label: "Moon's orbital tilt",
        min: 0,
        max: 10,
        step: 0.1,
        default: 5.1,
        unit: "°",
        description:
          "Tilt of the Moon's orbit relative to the ecliptic plane. The real value is about 5.1°.",
      },
      {
        id: "moonDistance",
        label: "Earth-Moon distance",
        min: 356000,
        max: 406000,
        step: 100,
        default: 384400,
        unit: "km",
        description:
          "Distance from Earth to the Moon. Near perigee the Moon looks bigger than the Sun; near apogee smaller.",
      },
    ],
    readouts: [
      {
        id: "eclipticLat",
        label: "Moon's height above the ecliptic",
        formula: "moonEclipticLatitude",
        inputs: { orbitAngle: "$orbitAngle", inclination: "$inclination" },
      },
      {
        id: "moonAngularSize",
        label: "Moon's apparent size",
        formula: "angularSize",
        inputs: { diameterKm: 3475, distanceKm: "$moonDistance" },
      },
      {
        id: "sunAngularSize",
        label: "Sun's apparent size",
        formula: "angularSize",
        inputs: { diameterKm: 1391000, distanceKm: 149600000 },
      },
      {
        id: "sizeRatio",
        label: "Moon vs Sun apparent size",
        formula: "angularSizeRatio",
        inputs: {
          moonDiameterKm: 3475,
          moonDistanceKm: "$moonDistance",
          sunDiameterKm: 1391000,
          sunDistanceKm: 149600000,
        },
      },
    ],
  },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
