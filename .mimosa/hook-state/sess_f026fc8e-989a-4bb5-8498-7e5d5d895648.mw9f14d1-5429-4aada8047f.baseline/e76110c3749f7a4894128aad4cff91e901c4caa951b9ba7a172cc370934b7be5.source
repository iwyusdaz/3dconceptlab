/**
 * Central config helper.
 *
 * All non-secret defaults live here as constants. Secrets and provider
 * settings are read from environment variables on the server only — this
 * module never puts secret values into objects reachable from client
 * bundles (it only reports booleans like whether a key is present).
 */

/** Default limits, per the implementation plan's Default Values table. */
export const LIMITS = {
  /** Max DeepSeek API calls per day (one generation uses 2-4 calls). */
  AI_DAILY_CAP_DEFAULT: 150,
  /** Concept text limit, characters. */
  CONCEPT_TEXT: 500,
  /** Editable text limit per field, characters. */
  EDITABLE_TEXT: 500,
  /** Generation timeout per DeepSeek call, ms. */
  GENERATION_TIMEOUT_MS: 60_000,
  /** Generation retries after the first validation failure. */
  GENERATION_RETRIES: 2,
  /** Max parts per scene spec. */
  SCENE_PART_CAP: 40,
  /** Share ID length (URL-safe random). */
  SHARE_ID_LENGTH: 12,
  /** Daily counter write retries on ETag conflict. */
  COUNTER_WRITE_RETRIES: 5,
} as const;

export type Mode = "live" | "fixture";

/** Loose env map type; `process.env` is cast to this at call sites. */
type EnvMap = Record<string, string | undefined>;

/**
 * Which generation mode applies:
 * - Live: `FIXTURE_MODE` is not "true" and `DEEPSEEK_API_KEY` is set.
 * - Fixture: `FIXTURE_MODE=true` or `DEEPSEEK_API_KEY` missing.
 */
export function getMode(env: EnvMap = process.env): Mode {
  if (env.FIXTURE_MODE === "true") return "fixture";
  if (!env.DEEPSEEK_API_KEY) return "fixture";
  return "live";
}

/** Daily cap, overridable by `AI_DAILY_CAP` env var. */
export function getDailyCap(env: EnvMap = process.env): number {
  const parsed = Number.parseInt(env.AI_DAILY_CAP ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : LIMITS.AI_DAILY_CAP_DEFAULT;
}

/** The DeepSeek model name comes from the environment, never hardcoded. */
export function getDeepSeekModel(env: EnvMap = process.env): string {
  return env.DEEPSEEK_MODEL ?? "";
}

/**
 * Server-only view of the environment. Returns booleans about secret
 * presence, never the values themselves, so this is safe to describe to
 * the client (the values themselves are only read in server code).
 */
export function getServerStatus(env: EnvMap = process.env): {
  mode: Mode;
  deepSeekKeyPresent: boolean;
  accessCodePresent: boolean;
  blobCredentialsPresent: boolean;
} {
  return {
    mode: getMode(env),
    deepSeekKeyPresent: Boolean(env.DEEPSEEK_API_KEY),
    accessCodePresent: Boolean(env.LIVE_AI_ACCESS_CODE),
    blobCredentialsPresent: hasBlobCredentials(env),
  };
}

/** True when Vercel Blob credentials are present in the environment. */
export function hasBlobCredentials(env: EnvMap = process.env): boolean {
  return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Which storage backend the experience/usage repositories should use:
 * - "blob" when Blob credentials are present.
 * - "local" otherwise (local dev uses .data/ files).
 */
export function getStorageBackend(
  env: EnvMap = process.env,
): "blob" | "local" {
  return hasBlobCredentials(env) ? "blob" : "local";
}

/**
 * Blob path prefix for the current environment. `VERCEL_ENV` is set on
 * Vercel; anything else is treated as development, so environments never mix.
 */
export function getBlobEnvPrefix(env: { VERCEL_ENV?: string } = (process.env as EnvMap)): string {
  const v = env.VERCEL_ENV;
  if (v === "production" || v === "preview") return v;
  return "development";
}
