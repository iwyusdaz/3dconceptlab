import type { Binding, SceneSpec, Variable } from "@/lib/spec/schema";

/**
 * Pure binding evaluation: a slider value plus whitelisted ops produce
 * property values for parts. This is the only way sliders affect parts —
 * no generated code ever runs.
 */

export type VariableValues = Record<string, number>;

/**
 * Compute the value of one binding with the slider value:
 * - set: target = value
 * - multiply: target = value × param (default ×1)
 * - add: target = value + param (default +0)
 * - negate: target = −value
 * - sinDeg / cosDeg: target = sin/cos(value°) × param (param = radius)
 */
export function applyBinding(value: number, binding: Binding): number {
  switch (binding.op) {
    case "set":
      return value;
    case "multiply":
      return value * (binding.param ?? 1);
    case "add":
      return value + (binding.param ?? 0);
    case "negate":
      return -value;
    case "sinDeg":
      return Math.sin((value * Math.PI) / 180) * (binding.param ?? 1);
    case "cosDeg":
      return Math.cos((value * Math.PI) / 180) * (binding.param ?? 1);
  }
}

/** Part properties a binding may override, per part type. */
export type PartOverrides = {
  "position.x"?: number;
  "position.y"?: number;
  "position.z"?: number;
  "origin.x"?: number;
  "origin.y"?: number;
  "origin.z"?: number;
  radius?: number;
  rotationYDeg?: number;
  axialTiltDeg?: number;
  opacity?: number;
  intensity?: number;
  angleDeg?: number;
  length?: number;
};

/** Evaluate every binding in the spec against the current slider values. */
export function evaluateBindings(
  spec: SceneSpec,
  values: VariableValues,
): Map<string, number> {
  const overrides = new Map<string, number>();
  if (spec.mode !== "composed") return overrides;
  for (const variable of spec.variables as Variable[]) {
    const value = values[variable.id] ?? variable.default;
    for (const binding of variable.bindings) {
      overrides.set(binding.target, applyBinding(value, binding));
    }
  }
  return overrides;
}

/** Read one override, falling back to the base property value. */
export function readOverride(
  overrides: Map<string, number>,
  key: keyof PartOverrides,
  fallback: number,
): number {
  return overrides.get(key) ?? fallback;
}
