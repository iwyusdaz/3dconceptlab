import { describe, expect, it } from "vitest";
import { applyBinding, evaluateBindings } from "./evaluate";
import { evaluateReadouts } from "./readouts";
import { FIXTURES } from "@/fixtures";
import type { SceneSpec } from "@/lib/spec/schema";

const moonPhases = FIXTURES["moon-phases"].spec as Extract<SceneSpec, { mode: "composed" }>;
const seasons = FIXTURES.seasons.spec;

describe("applyBinding", () => {
  const base = { target: "x.y", op: "set" as const };

  it("set passes the value through", () => {
    expect(applyBinding(5, { ...base })).toBe(5);
  });

  it("multiply and add use their params", () => {
    expect(applyBinding(5, { ...base, op: "multiply", param: 3 })).toBe(15);
    expect(applyBinding(5, { ...base, op: "add", param: 2 })).toBe(7);
    expect(applyBinding(5, { ...base, op: "add" })).toBe(5);
  });

  it("negate flips the sign", () => {
    expect(applyBinding(5, { ...base, op: "negate" })).toBe(-5);
  });

  it("sinDeg/cosDeg scale by param (orbit radius)", () => {
    const cos = applyBinding(0, { ...base, op: "cosDeg", param: 3 });
    const sin = applyBinding(90, { ...base, op: "sinDeg", param: 3 });
    expect(cos).toBeCloseTo(3, 10);
    expect(sin).toBeCloseTo(3, 10);
    expect(applyBinding(90, { ...base, op: "cosDeg", param: 3 })).toBeCloseTo(0, 10);
  });
});

describe("evaluateBindings (moon-phases fixture)", () => {
  it("moves the moon on its orbit and its label with it", () => {
    const overrides0 = evaluateBindings(moonPhases, { orbitAngle: 0 });
    const overrides180 = evaluateBindings(moonPhases, { orbitAngle: 180 });
    // 0° = between Earth and the Sun (+x): x=3, z=0.
    expect(overrides0.get("moon.position.x")).toBeCloseTo(3, 6);
    expect(overrides0.get("moon.position.z")).toBeCloseTo(0, 6);
    // 180° = opposite the Sun: x=-3, z≈0.
    expect(overrides180.get("moon.position.x")).toBeCloseTo(-3, 6);
    // The label follows the moon.
    expect(overrides180.get("labelMoon.position.x")).toBeCloseTo(-3, 6);
  });
});

describe("evaluateReadouts", () => {
  it("moon-phases: elongation and lit fraction follow the slider", () => {
    const results = evaluateReadouts(moonPhases, { orbitAngle: 90 });
    expect(results).toHaveLength(2);
    const elong = results.find((r) => r.id === "elongation")!;
    const lit = results.find((r) => r.id === "litFraction")!;
    expect(elong.value).toBeCloseTo(90, 6);
    expect(lit.value).toBeCloseTo(0.5, 6);
  });

  it("moon-phases: lit fraction is 1 at full moon", () => {
    const results = evaluateReadouts(moonPhases, { orbitAngle: 180 });
    const lit = results.find((r) => r.id === "litFraction")!;
    expect(lit.value).toBeCloseTo(1, 6);
  });

  it("seasons template: readouts resolve via chained readouts", () => {
    const results = evaluateReadouts(seasons, { dayOfYear: 172, tilt: 23.44, latitude: 51.5 });
    const alt = results.find((r) => r.id === "noonAltitude")!;
    const spread = results.find((r) => r.id === "beamSpread")!;
    expect(alt.value).toBeCloseTo(61.94, 1);
    expect(spread.value).toBeCloseTo(1 / Math.sin((61.94 * Math.PI) / 180), 2);
  });

  it("unknown formula yields a null value instead of throwing", () => {
    const spec = {
      ...moonPhases,
      readouts: [
        { id: "bad", label: "Bad", formula: "notAFormula", inputs: { orbitAngle: 1 } },
      ],
    } as unknown as SceneSpec;
    const results = evaluateReadouts(spec, {});
    expect(results[0].value).toBeNull();
  });
});
