import { put, head } from "@vercel/blob";
import type {
  ExperienceDocument,
  ExperienceRepository,
  UsageRepository,
} from "./types";
import { LIMITS } from "@/config/app-config";

/**
 * Vercel Blob implementations (private store). Used whenever Blob
 * credentials are present. Blob paths: <env>/experiences/<shareId>.json and
 * <env>/usage/<YYYY-MM-DD>.json with <env> from VERCEL_ENV.
 */

function blobPath(env: string, kind: "experiences" | "usage", name: string): string {
  return `${env}/${kind}/${name}.json`;
}

export class BlobExperienceRepository implements ExperienceRepository {
  constructor(private env: string) {}

  async save(doc: ExperienceDocument): Promise<"saved" | "conflict"> {
    try {
      await put(blobPath(this.env, "experiences", doc.shareId), JSON.stringify(doc), {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      });
      return "saved";
    } catch (err) {
      // Blob signals an existing object by refusing overwrite.
      if ((err as Error).name === "BlobPreconditionFailedError" || /exists/i.test((err as Error).message)) {
        return "conflict";
      }
      throw err;
    }
  }

  async get(shareId: string): Promise<ExperienceDocument | null> {
    try {
      const info = await head(blobPath(this.env, "experiences", shareId));
      const res = await fetch(info.url);
      if (!res.ok) return null;
      return (await res.json()) as ExperienceDocument;
    } catch {
      return null; // not found
    }
  }
}

export class BlobUsageRepository implements UsageRepository {
  constructor(private env: string) {}

  async getCallsFor(date: string): Promise<number> {
    try {
      const info = await head(blobPath(this.env, "usage", date));
      const res = await fetch(info.url);
      if (!res.ok) return 0;
      const doc = (await res.json()) as { calls?: number };
      return doc.calls ?? 0;
    } catch {
      return 0; // no document for this day yet
    }
  }

  async recordCall(
    date: string,
    tokens: { inputTokens: number; outputTokens: number },
  ): Promise<number> {
    // Read-modify-write with ETag precondition, per the Storage Design:
    // read with useCache: false, write with ifMatch, retry on conflict.
    for (let attempt = 0; attempt < LIMITS.COUNTER_WRITE_RETRIES; attempt++) {
      let etag: string | undefined;
      let current: { date: string; calls: number; inputTokens: number; outputTokens: number };
      try {
        const info = await head(blobPath(this.env, "usage", date));
        etag = info.etag;
        const res = await fetch(info.url);
        current = res.ok
          ? ((await res.json()) as typeof current)
          : { date, calls: 0, inputTokens: 0, outputTokens: 0 };
      } catch {
        current = { date, calls: 0, inputTokens: 0, outputTokens: 0 };
        etag = undefined;
      }
      const next = {
        date,
        calls: current.calls + 1,
        inputTokens: current.inputTokens + tokens.inputTokens,
        outputTokens: current.outputTokens + tokens.outputTokens,
      };
      try {
        await put(blobPath(this.env, "usage", date), JSON.stringify(next), {
          access: "private",
          allowOverwrite: true,
          contentType: "application/json",
          ifMatch: etag, // undefined on first write of the day
        });
        return next.calls;
      } catch (err) {
        if ((err as Error).name === "BlobPreconditionFailedError") {
          continue; // concurrent write won; retry up to the cap
        }
        throw err;
      }
    }
    throw new Error("BlobUsageRepository: counter write conflicts exceeded retry limit");
  }
}
