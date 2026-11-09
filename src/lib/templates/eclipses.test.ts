import { describe, expect, it } from "vitest";
import { getTemplate } from "./registry";
import { validateSpec } from "@/lib/spec/validate";
import { evaluateReadouts } from "@/lib/viewer/readouts";
import { FIXTURES } from "@/fixtures";
import type { SceneSpec } from "@/lib/spec/schema";

describe("eclipses template registry", () => {
  it("is registered", () => {
    expect(getTemplate("eclipses")).toBeDefined();
  });

  it("registry entry passes the scene spec schema", () => {
    const t = getTemplate("eclipses")!;
    const spec = {
      mode: "template",
      templateId: t.id,
      variables: t.variables.map((v) => ({ ...v, bindings: [] })),
      readouts: t.readouts,
      content: {
        title: t.title,
        explanation: t.description,
        tryThis: ["Scrub the Moon around its orbit."],
        keyIdea: "Eclipses need node alignment.",
      },
    };
    const result = validateSpec(spec);
    if (!result.ok) {
      throw new Error(`Eclipses template spec invalid: ${result.errors.join("; ")}`);
    }
    expect(result.ok).toBe(true);
  });
});

describe("eclipses template readouts", () => {
  const spec = FIXTURES.eclipses.spec;

  function readoutValue(values: Record<string, number>, id: string): number {
    const results = evaluateReadouts(spec, values);
    const value = results.find((r) => r.id === id)!.value;
    if (value === null) throw new Error(`readout ${id} is null`);
    return value;
  }

  it("the Moon sits on the ecliptic at the nodes (0° and 180°) — eclipse seasons", () => {
    expect(readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 384400 }, "eclipticLat")).toBeCloseTo(0, 6);
    expect(readoutValue({ orbitAngle: 180, inclination: 5.1, moonDistance: 384400 }, "eclipticLat")).toBeCloseTo(0, 6);
  });

  it("the Moon is highest above the ecliptic at ±90° from the node line", () => {
    expect(readoutValue({ orbitAngle: 90, inclination: 5.1, moonDistance: 384400 }, "eclipticLat")).toBeCloseTo(5.1, 6);
    expect(readoutValue({ orbitAngle: 270, inclination: 5.1, moonDistance: 384400 }, "eclipticLat")).toBeCloseTo(-5.1, 6);
  });

  it("with inclination 0 the Moon is always on the ecliptic — alignment every month", () => {
    for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
      expect(readoutValue({ orbitAngle: angle, inclination: 0, moonDistance: 384400 }, "eclipticLat")).toBeCloseTo(0, 8);
    }
  });

  it("the Moon looks bigger at perigee than at apogee", () => {
    const perigee = readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 356000 }, "moonAngularSize");
    const apogee = readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 406000 }, "moonAngularSize");
    expect(perigee).toBeGreaterThan(apogee);
  });

  it("the size ratio crosses 1: >1 at perigee (total possible), <1 at apogee (annular)", () => {
    const perigee = readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 356000 }, "sizeRatio");
    const apogee = readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 406000 }, "sizeRatio");
    expect(perigee).toBeGreaterThan(1);
    expect(apogee).toBeLessThan(1);
  });

  it("the Sun's apparent size is constant (~0.53°)", () => {
    expect(readoutValue({ orbitAngle: 0, inclination: 5.1, moonDistance: 384400 }, "sunAngularSize")).toBeCloseTo(0.533, 2);
  });

  it("spec is a template mode spec (viewer contract)", () => {
    expect(spec.mode).toBe("template");
    expect((spec as Extract<SceneSpec, { mode: "template" }>).templateId).toBe("eclipses");
  });
});
