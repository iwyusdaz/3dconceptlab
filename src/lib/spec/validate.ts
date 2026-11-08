import {
  SceneSpecSchema,
  BINDABLE_PROPERTIES,
  type SceneSpec,
  type Variable,
  type Readout,
} from "./schema";
import { FORMULA_NAMES } from "@/lib/formulas/registry";
import { TEMPLATE_IDS } from "@/lib/templates/registry";

export type ValidationResult =
  | { ok: true; spec: SceneSpec }
  | { ok: false; errors: string[] };

/**
 * Full validation: Zod schema first, then semantic checks. Errors are
 * readable strings with paths like `parts[2].bindings[0].target`.
 */
export function validateSpec(json: unknown): ValidationResult {
  const parsed = SceneSpecSchema.safeParse(json);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }
  const semantic = validateSemantics(parsed.data);
  if (!semantic.ok) return semantic;
  return { ok: true, spec: parsed.data };
}

function validateSemantics(spec: SceneSpec): ValidationResult {
  const errors: string[] = [];

  // Template ID must exist.
  if (spec.mode === "template") {
    if (!TEMPLATE_IDS.includes(spec.templateId as (typeof TEMPLATE_IDS)[number])) {
      errors.push(
        `templateId: unknown template "${spec.templateId}". Known templates: ${TEMPLATE_IDS.join(", ")}`,
      );
    }
  }

  errors.push(...checkVariables(spec.variables));
  errors.push(...checkReadouts(spec.readouts, spec.variables));

  // Composed specs must reference real parts and bindable properties.
  if (spec.mode === "composed") {
    errors.push(...checkComposed(spec));
  }

  return errors.length ? { ok: false, errors } : { ok: true, spec };
}

function checkVariables(variables: Variable[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const [i, v] of variables.entries()) {
    const at = `variables[${i}] (${v.id})`;
    if (seen.has(v.id)) {
      errors.push(`${at}: duplicate variable id`);
    }
    seen.add(v.id);
    if (!Number.isFinite(v.min) || !Number.isFinite(v.max) || !Number.isFinite(v.step)) {
      errors.push(`${at}.min/max/step: must be finite numbers`);
      continue;
    }
    if (v.min >= v.max) {
      errors.push(`${at}: min (${v.min}) must be less than max (${v.max})`);
    }
    if (v.default < v.min || v.default > v.max) {
      errors.push(`${at}.default (${v.default}) is outside the slider range [${v.min}, ${v.max}]`);
    }
    const span = v.max - v.min;
    if (v.step > span) {
      errors.push(`${at}.step (${v.step}) is larger than the slider range (${span})`);
    }
    // Sanity bound on slider endpoints to catch nonsense ranges.
    if (Math.abs(v.min) > 1e6 || Math.abs(v.max) > 1e6) {
      errors.push(`${at}: slider endpoints beyond ±1,000,000 are not sane`);
    }
  }
  return errors;
}

function checkReadouts(readouts: Readout[], variables: Variable[]): string[] {
  const errors: string[] = [];
  const varIds = new Set(variables.map((v) => v.id));
  const readoutIds = new Set<string>();
  for (const [i, r] of readouts.entries()) {
    const at = `readouts[${i}] (${r.id})`;
    if (readoutIds.has(r.id)) {
      errors.push(`${at}: duplicate readout id`);
    }
    readoutIds.add(r.id);
    if (!FORMULA_NAMES.includes(r.formula)) {
      errors.push(
        `${at}.formula: unknown formula "${r.formula}". Known formulas: ${FORMULA_NAMES.join(", ")}`,
      );
    }
    for (const [inputName, ref] of Object.entries(r.inputs)) {
      if (typeof ref === "string") {
        const refId = ref.slice(1);
        if (!varIds.has(refId) && !readoutIds.has(refId)) {
          errors.push(
            `${at}.inputs.${inputName}: reference "${ref}" does not match any variable or earlier readout`,
          );
        }
      }
    }
  }
  return errors;
}

function checkComposed(spec: Extract<SceneSpec, { mode: "composed" }>): string[] {
  const errors: string[] = [];
  const partIds = new Set<string>();
  for (const [i, part] of spec.parts.entries()) {
    const at = `parts[${i}] (${part.id})`;
    if (partIds.has(part.id)) {
      errors.push(`${at}: duplicate part id`);
    }
    partIds.add(part.id);
  }

  // Bindings must point to existing parts and whitelisted properties.
  for (const [vi, v] of spec.variables.entries()) {
    for (const [bi, b] of v.bindings.entries()) {
      const at = `variables[${vi}] (${v.id}).bindings[${bi}]`;
      const [partId, ...rest] = b.target.split(".");
      const property = rest.join(".");
      if (!partIds.has(partId)) {
        errors.push(`${at}.target: part "${partId}" does not exist`);
        continue;
      }
      const part = spec.parts.find((p) => p.id === partId)!;
      const allowed = BINDABLE_PROPERTIES[part.type];
      if (!allowed.includes(property)) {
        errors.push(
          `${at}.target: "${property}" is not a bindable property of ${part.type}. Allowed: ${allowed.join(", ")}`,
        );
      }
    }
  }
  return errors;
}
