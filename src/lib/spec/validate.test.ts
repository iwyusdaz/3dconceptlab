import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { validateSpec } from "./validate";

function loadJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(process.cwd(), "src", rel), "utf8"));
}

describe("validateSpec: valid fixtures pass", () => {
  it("moon-phases (composed) passes", () => {
    const json = loadJson("fixtures/moon-phases.json");
    const result = validateSpec((json as { spec: unknown }).spec);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.spec.mode).toBe("composed");
  });

  it("seasons (template) passes", () => {
    const json = loadJson("fixtures/seasons.json");
    const result = validateSpec((json as { spec: unknown }).spec);
    expect(result.ok).toBe(true);
    if (result.ok && result.spec.mode === "template") {
      expect(result.spec.templateId).toBe("seasons");
    } else {
      expect.unreachable("seasons fixture must validate as a template spec");
    }
  });
});

describe("validateSpec: shadowCone part type", () => {
  const baseSpec = {
    mode: "composed",
    parts: [
      {
        id: "sun",
        type: "lightSource",
        position: [0, 0, 0],
        intensity: 2,
      },
      {
        id: "moon",
        type: "sphere",
        position: [3, 0, 0],
        radius: 0.4,
      },
      {
        id: "shadow",
        type: "shadowCone",
        origin: [3, 0, 0],
        angleDeg: 0,
        length: 2,
        apexAngleDeg: 5,
        opacity: 0.5,
      },
    ],
    variables: [
      {
        id: "orbitAngle",
        label: "Moon's position",
        min: 0,
        max: 360,
        step: 1,
        default: 0,
        unit: "°",
        bindings: [
          { target: "moon.position.x", op: "cosDeg", param: 3 },
          { target: "moon.position.z", op: "sinDeg", param: 3 },
          { target: "shadow.origin.x", op: "cosDeg", param: 3 },
          { target: "shadow.origin.z", op: "sinDeg", param: 3 },
        ],
      },
      {
        id: "coneLength",
        label: "Shadow length",
        min: 0.5,
        max: 5,
        step: 0.1,
        default: 2,
        unit: "units",
        bindings: [
          { target: "shadow.length", op: "set" },
          { target: "shadow.apexAngleDeg", op: "multiply", param: 2 },
        ],
      },
    ],
    readouts: [],
    content: {
      title: "Shadow cone test",
      explanation: "A shadow cone cast by the Moon.",
      tryThis: ["Move the Moon around Earth and watch the shadow."],
      keyIdea: "Shadows point away from the light source.",
    },
  };

  it("a composed spec with a shadowCone and bindings to length/apexAngleDeg passes", () => {
    const result = validateSpec(baseSpec);
    expect(result.ok).toBe(true);
  });

  it("binding to a non-bindable shadowCone property fails", () => {
    const bad = {
      ...baseSpec,
      variables: [
        {
          ...baseSpec.variables[1],
          bindings: [{ target: "shadow.radius", op: "set" }],
        },
      ],
    };
    const result = validateSpec(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join("\n")).toContain('"radius" is not a bindable property of shadowCone');
    }
  });

  it("apexAngleDeg above 180 fails the schema", () => {
    const bad = {
      ...baseSpec,
      parts: [
        ...baseSpec.parts.slice(0, 2),
        { ...baseSpec.parts[2], apexAngleDeg: 200 },
      ],
    };
    const result = validateSpec(bad);
    expect(result.ok).toBe(false);
  });
});

describe("validateSpec: broken fixtures fail with readable errors", () => {
  const brokenFixtures = [
    "unknown-part-type",
    "bad-binding-target",
    "bad-binding-property",
    "bad-formula",
    "bad-slider-range",
    "text-too-long",
    "unknown-template",
    "duplicate-part-id",
  ];

  for (const name of brokenFixtures) {
    it(`${name} fails and names the problem`, () => {
      const json = loadJson(`fixtures/broken/${name}.json`) as {
        spec: unknown;
        expectErrorContains: string;
      };
      const result = validateSpec(json.spec);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.join("\n")).toContain(json.expectErrorContains);
        // Readable error path: at least one error includes a path segment.
        expect(result.errors.some((e) => /^(parts|variables|readouts|content|templateId)/.test(e))).toBe(
          true,
        );
      }
    });
  }

  it("too-many-parts fails once padded beyond the cap of 40", () => {
    const json = loadJson("fixtures/broken/too-many-parts.json") as { spec: Record<string, unknown> };
    const parts = (json.spec.parts as unknown[]) ?? [];
    const padded = Array.from({ length: 41 }, (_, i) => ({
      id: `blob${i}`,
      type: "label",
      position: [i, 0, 0],
      text: `part ${i}`,
    }));
    const result = validateSpec({ ...json.spec, parts: [...parts, ...padded] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join("\n")).toMatch(/(40|parts)/);
    }
  });
});

describe("validateSpec: schema basics", () => {
  it("rejects non-object input", () => {
    expect(validateSpec("nope").ok).toBe(false);
    expect(validateSpec(null).ok).toBe(false);
  });

  it("rejects a spec with no mode", () => {
    expect(validateSpec({ parts: [] }).ok).toBe(false);
  });

  it("rejects a composed spec with zero parts", () => {
    const result = validateSpec({
      mode: "composed",
      parts: [],
      variables: [],
      readouts: [],
      content: { title: "t", explanation: "e", tryThis: ["x"], keyIdea: "k" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/parts/);
  });

  it("rejects a readout referencing a missing variable", () => {
    const result = validateSpec({
      mode: "composed",
      parts: [{ id: "earth", type: "sphere", position: [0, 0, 0], radius: 1, color: "#00f" }],
      variables: [],
      readouts: [
        { id: "r1", label: "r", formula: "earthSunDistance", inputs: { dayOfYear: "$nope" } },
      ],
      content: { title: "t", "explanation": "e", tryThis: ["x"], keyIdea: "k" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("does not match any variable");
  });
});
