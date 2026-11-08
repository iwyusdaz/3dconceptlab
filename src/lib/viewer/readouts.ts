import type { Readout, SceneSpec } from "@/lib/spec/schema";
import { FORMULA_FNS } from "@/lib/formulas";
import { getFormula } from "@/lib/formulas/registry";
import type { VariableValues } from "./evaluate";

/**
 * Readout evaluation: named formulas from the library, with inputs drawn
 * from slider values or earlier readout results. No generated code runs.
 */

export interface ReadoutResult {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  /** True when the formula returned a non-finite value (shown as "—"). */
  infinite: boolean;
}

function resolveInput(
  ref: number | string,
  values: VariableValues,
  results: Map<string, number>,
): number {
  if (typeof ref === "number") return ref;
  const id = ref.slice(1);
  if (id in values) return values[id];
  if (results.has(id)) return results.get(id)!;
  return Number.NaN;
}

export function evaluateReadouts(spec: SceneSpec, values: VariableValues): ReadoutResult[] {
  const results = new Map<string, number>();
  const out: ReadoutResult[] = [];
  const readouts: Readout[] = spec.readouts as Readout[];
  for (const readout of readouts) {
    const fn = FORMULA_FNS[readout.formula];
    const def = getFormula(readout.formula);
    if (!fn || !def) {
      // Schema/semantic validation rejects unknown formulas; this guard is
      // for specs constructed in-memory that skipped validation.
      out.push({ id: readout.id, label: readout.label, value: null, unit: "", infinite: false });
      continue;
    }
    // Arguments are passed positionally in the order the registry declares
    // the formula's inputs, looked up by input name.
    const args = def.inputs.map((inputDef) => {
      const ref = readout.inputs[inputDef.name];
      if (ref === undefined) return Number.NaN;
      return resolveInput(ref, values, results);
    });
    const value = fn(...args);
    if (Number.isFinite(value)) results.set(readout.id, value);
    out.push({
      id: readout.id,
      label: readout.label,
      value,
      unit: def.outputUnit,
      infinite: !Number.isFinite(value),
    });
  }
  return out;
}
