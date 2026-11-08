import "server-only";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Access-code check for creating experiences. Required in both Live and
 * Fixture mode. Comparison is timing-safe (hash then constant-time compare).
 */
export function checkAccessCode(
  provided: string | undefined | null,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const expected = env.LIVE_AI_ACCESS_CODE;
  if (!expected || !provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
