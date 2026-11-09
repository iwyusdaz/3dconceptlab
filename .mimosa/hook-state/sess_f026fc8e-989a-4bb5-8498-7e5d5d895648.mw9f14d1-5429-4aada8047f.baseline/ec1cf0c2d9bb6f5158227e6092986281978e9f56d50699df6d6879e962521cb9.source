/**
 * Repository interfaces for experiences and usage. Three implementations
 * each: Vercel Blob, local files (.data/), and in-memory (tests).
 */

import { randomBytes } from "crypto";
import { LIMITS } from "@/config/app-config";
import type { SceneSpec } from "@/lib/spec/schema";

/** Blob path prefix per environment (never mix environments). */
export type EnvPrefix = "production" | "preview" | "development";

export interface ExperienceDocument {
  shareId: string;
  concept: string;
  spec: SceneSpec
  createdAt: string;
}

export interface UsageDocument {
  date: string; // UTC date, YYYY-MM-DD
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Experience repository: written once when saved, then only read.
 * Implementations must never overwrite an existing share ID.
 */
export interface ExperienceRepository {
  save(doc: ExperienceDocument): Promise<"saved" | "conflict">;
  get(shareId: string): Promise<ExperienceDocument | null>;
}

export interface UsageRepository {
  /** Total calls recorded for the UTC date. */
  getCallsFor(date: string): Promise<number>;
  /**
   * Add one call to the day's counter with optimistic concurrency
   * (read with ETag, write with ifMatch, retry up to the configured
   * counter-write retry limit on conflict). Returns the new total.
   */
  recordCall(date: string, tokens: { inputTokens: number; outputTokens: number }): Promise<number>;
}

/** UTC date (YYYY-MM-DD) used for the daily counter. */
export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** URL-safe alphabet without visually ambiguous characters. */
const SHARE_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789-_";
/** 12-character URL-safe random share ID. */
export function makeShareId(): string {
  const bytes = randomBytes(LIMITS.SHARE_ID_LENGTH);
  let out = "";
  for (let i = 0; i < LIMITS.SHARE_ID_LENGTH; i++) {
    out += SHARE_ID_ALPHABET[bytes[i] % SHARE_ID_ALPHABET.length];
  }
  return out;
}

/** Share IDs the server accepts: exactly 12 characters from the alphabet. */
export function isValidShareId(id: string): boolean {
  // The dash is written first so it is a literal, not a range operator.
  return /^[A-HJ-NP-Za-km-z2-9_-]{12}$/.test(id);
}
