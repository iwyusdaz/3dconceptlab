import type {
  ExperienceDocument,
  ExperienceRepository,
  UsageRepository,
} from "./types";

/**
 * In-memory implementations (automated tests only). The usage repository
 * simulates the same optimistic-concurrency loop as the Blob implementation
 * so tests exercise the conflict+retry path.
 */

export class InMemoryExperienceRepository implements ExperienceRepository {
  private docs = new Map<string, ExperienceDocument>();

  async save(doc: ExperienceDocument): Promise<"saved" | "conflict"> {
    if (this.docs.has(doc.shareId)) return "conflict";
    this.docs.set(doc.shareId, structuredClone(doc));
    return "saved";
  }

  async get(shareId: string): Promise<ExperienceDocument | null> {
    const doc = this.docs.get(shareId);
    return doc ? structuredClone(doc) : null;
  }
}

export class InMemoryUsageRepository implements UsageRepository {
  /** date → { doc, version } ; version plays the role of the Blob ETag. */
  private entries = new Map<string, { doc: UsageDoc; version: number }>();

  async getCallsFor(date: string): Promise<number> {
    return this.entries.get(date)?.doc.calls ?? 0;
  }

  async recordCall(
    date: string,
    tokens: { inputTokens: number; outputTokens: number },
  ): Promise<number> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const entry = this.entries.get(date);
      const current = entry?.doc ?? { date, calls: 0, inputTokens: 0, outputTokens: 0 };
      const next: UsageDoc = {
        date,
        calls: current.calls + 1,
        inputTokens: current.inputTokens + tokens.inputTokens,
        outputTokens: current.outputTokens + tokens.outputTokens,
      };
      const version = entry?.version ?? 0;
      // Optimistic write: only succeeds if nobody bumped the version first.
      if (this.tryWrite(date, next, version)) {
        return next.calls;
      }
      // Conflict: another concurrent write won; loop and retry.
    }
    throw new Error("InMemoryUsageRepository: too many conflicts");
  }

  private tryWrite(date: string, doc: UsageDoc, expectedVersion: number): boolean {
    const entry = this.entries.get(date);
    const currentVersion = entry?.version ?? 0;
    if (currentVersion !== expectedVersion) return false;
    this.entries.set(date, { doc, version: expectedVersion + 1 });
    return true;
  }
}

interface UsageDoc {
  date: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
}
