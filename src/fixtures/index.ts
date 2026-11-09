import moonPhasesJson from "@/fixtures/moon-phases.json";
import seasonsJson from "@/fixtures/seasons.json";
import eclipsesJson from "@/fixtures/eclipses.json";
import { validateSpec, type ValidationResult } from "@/lib/spec/validate";
import type { SceneSpec } from "@/lib/spec/schema";

/**
 * Hand-written reference fixtures. Each contains `"source": "hand-written"`
 * per the Agent Execution Rules (recorded DeepSeek output would instead use
 * `"source": "deepseek <model> <date>"`).
 */

export interface FixtureFile {
  source: string;
  name: string;
  description: string;
  spec: unknown;
}

export interface ExperienceFixture {
  /** Stable key used in URLs like /preview/fixture/moon-phases and /demo. */
  key: string;
  spec: SceneSpec;
  source: string;
}

function loadFixture(json: FixtureFile, key: string): ExperienceFixture {
  const result = validateSpec(json.spec);
  if (!result.ok) {
    throw new Error(`Fixture "${json.name}" is invalid: ${result.errors.join("; ")}`);
  }
  return { key, spec: result.spec, source: json.source };
}

export const FIXTURES: Record<string, ExperienceFixture> = {
  "moon-phases": loadFixture(moonPhasesJson, "moon-phases"),
  seasons: loadFixture(seasonsJson, "seasons"),
  eclipses: loadFixture(eclipsesJson, "eclipses"),
};

export function getFixture(key: string): ExperienceFixture | undefined {
  return FIXTURES[key];
}

/** Every valid spec passes validation - used by the Task 2 tests. */
export function allFixtureKeys(): string[] {
  return Object.keys(FIXTURES);
}

export type { ValidationResult };
