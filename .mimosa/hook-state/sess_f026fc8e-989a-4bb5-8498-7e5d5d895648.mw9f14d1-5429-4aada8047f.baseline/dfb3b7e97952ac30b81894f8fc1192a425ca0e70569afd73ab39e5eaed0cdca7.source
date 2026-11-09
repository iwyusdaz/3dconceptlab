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
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
