import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type {
  ExperienceDocument,
  ExperienceRepository,
  UsageRepository,
} from "./types";
import { LIMITS } from "@/config/app-config";

/**
 * Local-file implementations for local development without Blob credentials.
 * Files live in .data/<env>/… which is git-ignored. Note: no ETag support —
 * the usage update is a plain read-modify-write, safe for single-process dev.
 */

function dataDir(): string {
  return join(process.cwd(), ".data");
}

function usagePath(env: string, date: string): string {
  return join(dataDir(), env, "usage", `${date}.json`);
}

function experiencePath(env: string, shareId: string): string {
  return join(dataDir(), env, "experiences", `${shareId}.json`);
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null; // missing file
  }
}

async function writeJsonNew(path: string, value: unknown): Promise<boolean> {
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, JSON.stringify(value, null, 2), { flag: "wx" });
    return true;
  } catch {
    return false; // already exists
  }
}

export class LocalExperienceRepository implements ExperienceRepository {
  constructor(private env: string) {}

  async save(doc: ExperienceDocument): Promise<"saved" | "conflict"> {
    const ok = await writeJsonNew(experiencePath(this.env, doc.shareId), doc);
    return ok ? "saved" : "conflict";
  }

  async get(shareId: string): Promise<ExperienceDocument | null> {
    const json = await readJson(experiencePath(this.env, shareId));
    return (json as ExperienceDocument) ?? null;
  }
}

export class LocalUsageRepository implements UsageRepository {
  constructor(private env: string) {}

  async getCallsFor(date: string): Promise<number> {
    const json = (await readJson(usagePath(this.env, date))) as
      | { calls?: number }
      | null;
    return json?.calls ?? 0;
  }

  async recordCall(
    date: string,
    tokens: { inputTokens: number; outputTokens: number },
  ): Promise<number> {
    // Local dev is single-process; plain read-modify-write.
    const json = (await readJson(usagePath(this.env, date))) as
      | { date?: string; calls?: number; inputTokens?: number; outputTokens?: number }
      | null;
    const next = {
      date,
      calls: (json?.calls ?? 0) + 1,
      inputTokens: (json?.inputTokens ?? 0) + tokens.inputTokens,
      outputTokens: (json?.outputTokens ?? 0) + tokens.outputTokens,
    };
    await mkdir(dirname(usagePath(this.env, date)), { recursive: true });
    await writeFile(usagePath(this.env, date), JSON.stringify(next, null, 2), "utf8");
    return next.calls;
  }
}

/** Retry helper shared with the Blob implementation (kept for parity). */
export const COUNTER_RETRIES = LIMITS.COUNTER_WRITE_RETRIES;
