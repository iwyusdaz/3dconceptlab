import { put, head, get } from "@vercel/blob";
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
 *
 * Reads use get(path, { access: "private", useCache: false }) — private
 * blobs are not readable via their raw URL. head() supplies the ETag for
 * the usage counter's optimistic write.
 */

function blobPath(env: string, kind: "experiences" | "usage", name: string): string {
  return `${env}/${kind}/${name}.json`;
}

interface UsageJson {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

const EMPTY_USAGE: (date: string) => UsageJson = (date) => ({
  date,
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
});

async function readPrivateJson(path: string): Promise<unknown | null> {
  const result = await get(path, { access: "private", useCache: false });
  if (!result) return null;
  // GetBlobResult streams the content; normalize to text.
  const text = await new Response(result.stream as unknown as ReadableStream).text();
  return JSON.parse(text);
}

export class BlobExperienceRepository implements ExperienceRepository {
  constructor(
    private env: string,
    /** Extra path prefix, used by contract tests (e.g. "test"). */
    private pathPrefix = "",
  ) {}

  private full(kind: "experiences" | "usage", name: string): string {
    const p = blobPath(this.env, kind, name);
    return this.pathPrefix ? `${this.pathPrefix}/${p}` : p;
  }

  async save(doc: ExperienceDocument): Promise<"saved" | "conflict"> {
    try {
      await put(this.full("experiences", doc.shareId), JSON.stringify(doc), {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      });
      return "saved";
    } catch (err) {
      if ((err as Error).name === "BlobPreconditionFailedError" || /exists/i.test((err as Error).message)) {
        return "conflict";
      }
      throw err;
    }
  }

  async get(shareId: string): Promise<ExperienceDocument | null> {
    try {
      const json = await readPrivateJson(this.full("experiences", shareId));
      return (json as ExperienceDocument) ?? null;
    } catch {
      return null; // not found
    }
  }
}

export class BlobUsageRepository implements UsageRepository {
  constructor(
    private env: string,
    private pathPrefix = "",
  ) {}

  private full(kind: "experiences" | "usage", name: string): string {
    const p = blobPath(this.env, kind, name);
    return this.pathPrefix ? `${this.pathPrefix}/${p}` : p;
  }

  async getCallsFor(date: string): Promise<number> {
    try {
      const json = (await readPrivateJson(this.full("usage", date))) as UsageJson | null;
      return json?.calls ?? 0;
    } catch {
      return 0; // no document for this day yet
    }
  }

  async recordCall(
    date: string,
    tokens: { inputTokens: number; outputTokens: number },
  ): Promise<number> {
    // Read-modify-write with ETag precondition, per the Storage Design:
    // read the current ETag with head(), write with ifMatch, retry on
    // conflict up to the configured retry limit.
    const path = this.full("usage", date);
    for (let attempt = 0; attempt < LIMITS.COUNTER_WRITE_RETRIES; attempt++) {
      let etag: string | undefined;
      let current: UsageJson = EMPTY_USAGE(date);
      try {
        const info = await head(path);
        etag = info.etag;
        const json = (await readPrivateJson(path)) as UsageJson | null;
        if (json) current = json;
      } catch {
        current = EMPTY_USAGE(date);
        etag = undefined;
      }
      const next: UsageJson = {
        date,
        calls: current.calls + 1,
        inputTokens: current.inputTokens + tokens.inputTokens,
        outputTokens: current.outputTokens + tokens.outputTokens,
      };
      try {
        await put(path, JSON.stringify(next), {
          access: "private",
          allowOverwrite: true,
          contentType: "application/json",
          ifMatch: etag,
        });
        return next.calls;
      } catch (err) {
        if ((err as Error).name === "BlobPreconditionFailedError") {
          continue; // concurrent write won; retry
        }
        throw err;
      }
    }
    throw new Error("BlobUsageRepository: counter write conflicts exceeded retry limit");
  }
}
