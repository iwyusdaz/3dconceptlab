import { describe, expect, it } from "vitest";
import { TEMPLATES, getTemplate } from "./registry";
import { validateSpec } from "@/lib/spec/validate";
import { evaluateReadouts } from "@/lib/viewer/readouts";
import { FIXTURES } from "@/fixtures";
import type { SceneSpec } from "@/lib/spec/schema";

describe("template registry", () => {
  it("contains the seasons template", () => {
    expect(getTemplate("seasons")).toBeDefined();
  });

  it("registry entry passes the scene spec schema", () => {
    for (const t of TEMPLATES) {
      const spec = {
        mode: "template",
        templateId: t.id,
        variables: t.variables.map((v) => ({ ...v, bindings: [] })),
        readouts: t.readouts,
        content: {
          title: t.title,
          explanation: t.description,
          tryThis: ["Scrub the orbit."],
          keyIdea: "Tilt, not distance.",
        },
      };
      const result = validateSpec(spec);
      if (!result.ok) {
        throw new Error(`Template ${t.id} spec invalid: ${result.errors.join("; ")}`);
      }
      expect(result.ok).toBe(true);
    }
  });
});

describe("seasons template readouts", () => {
  const spec = FIXTURES.seasons.spec;

  function readoutsFor(values: Record<string, number>) {
    const results = evaluateReadouts(spec, values);
    return {
      daylight: results.find((r) => r.id === "daylight")!.value!,
      distance: results.find((r) => r.id === "distance")!.value!,
      declination: results.find((r) => r.id === "declination")!.value!,
    };
  }

  it("at tilt 0, daylight hours stay constant across the orbit", () => {
    for (const day of [1, 80, 172, 266, 365]) {
      const r = readoutsFor({ dayOfYear: day, tilt: 0, latitude: 51.5 });
      expect(r.daylight).toBeCloseTo(12, 5);
    }
  });

  it("the distance readout is smallest in January (perihelion)", () => {
    const january = readoutsFor({ dayOfYear: 3, tilt: 23.44, latitude: 51.5 });
    const july = readoutsFor({ dayOfYear: 185, tilt: 23.44, latitude: 51.5 });
    expect(january.distance).toBeLessThan(july.distance);
  });

  it("at the June solstice, daylight is long at 51.5°N and short at 51.5°S", () => {
    const north = evaluateReadouts(spec, { dayOfYear: 172, tilt: 23.44, latitude: 51.5 });
    const south = evaluateReadouts(spec, { dayOfYear: 172, tilt: 23.44, latitude: -51.5 });
    const northDaylight = north.find((r) => r.id === "daylight")!.value!;
    const southDaylight = south.find((r) => r.id === "daylight")!.value!;
    expect(northDaylight).toBeGreaterThan(southDaylight);
  });

  it("spec is a template mode spec (viewer contract)", () => {
    expect(spec.mode).toBe("template");
    expect((spec as Extract<SceneSpec, { mode: "template" }>).templateId).toBe("seasons");
  });
});
