import { BlobExperienceRepository, BlobUsageRepository } from "./blob";
import { LocalExperienceRepository, LocalUsageRepository } from "./local";
import { InMemoryExperienceRepository, InMemoryUsageRepository } from "./memory";
import { getStorageBackend, getBlobEnvPrefix } from "@/config/app-config";
import type { ExperienceRepository, UsageRepository } from "./types";

/**
 * Repository factory: Blob when credentials are present (on Vercel, or
 * locally after `vercel env pull`), local files otherwise, in-memory only
 * in tests. Environments never mix (path prefix from VERCEL_ENV).
 */

export function createExperienceRepository(
  env: Record<string, string | undefined> = process.env,
): ExperienceRepository {
  const backend = getStorageBackend(env);
  const envPrefix = getBlobEnvPrefix(env);
  if (backend === "blob") return new BlobExperienceRepository(envPrefix);
  return new LocalExperienceRepository(envPrefix);
}

export function createUsageRepository(
  env: Record<string, string | undefined> = process.env,
): UsageRepository {
  const backend = getStorageBackend(env);
  const envPrefix = getBlobEnvPrefix(env);
  if (backend === "blob") return new BlobUsageRepository(envPrefix);
  return new LocalUsageRepository(envPrefix);
}

export { InMemoryExperienceRepository, InMemoryUsageRepository };
export type { ExperienceRepository, UsageRepository } from "./types";
