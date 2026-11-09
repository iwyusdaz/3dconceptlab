import { describe, expect, it } from "vitest";
import { InMemoryUsageRepository } from "./memory";
import { LocalExperienceRepository, LocalUsageRepository } from "./local";
import {
  BlobExperienceRepository,
  BlobUsageRepository,
} from "./blob";
import { del } from "@vercel/blob";
import { checkAccessCode } from "@/lib/ai/access";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { LIMITS } from "@/config/app-config";
import { FIXTURES } from "@/fixtures";
import { makeShareId } from "./types";

const dummyCode = ["dummy", "access", "code"].join("-");

/** Blob contract tests run only when credentials are present in the env. */
const hasBlobCredentials = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

describe("InMemoryUsageRepository (ETag-style conflict + retry)", () => {
  it("two concurrent counter updates both count", async () => {
    const repo = new InMemoryUsageRepository();
    const date = "2026-11-09";
    const results = await Promise.all([
      repo.recordCall(date, { inputTokens: 10, outputTokens: 5 }),
      repo.recordCall(date, { inputTokens: 20, outputTokens: 7 }),
    ]);
    const total = await repo.getCallsFor(date);
    expect(total).toBe(2);
    expect(results.sort()).toEqual([1, 2]);
    const doc = (await repo.getCallsFor(date)) as number;
    void doc;
    const state = repo["entries"].get(date)!.doc;
    expect(state.inputTokens).toBe(30);
    expect(state.outputTokens).toBe(12);
  });

  it("many concurrent updates all land (stress the retry loop)", async () => {
    const repo = new InMemoryUsageRepository();
    const date = "2026-11-09";
    await Promise.all(
      Array.from({ length: 20 }, () => repo.recordCall(date, { inputTokens: 1, outputTokens: 1 })),
    );
    expect(await repo.getCallsFor(date)).toBe(20);
  });

  it("a fresh day starts at zero", async () => {
    const repo = new InMemoryUsageRepository();
    expect(await repo.getCallsFor("2099-01-01")).toBe(0);
  });
});

describe("Local-file repositories", () => {
  it("experience save/get round-trips and refuses overwrite", async () => {
    const dir = mkdtempSync(join(tmpdir(), "conceptlab-test-"));
    const origCwd = process.cwd;
    process.cwd = () => dir; // redirect .data/ into the temp dir
    try {
      const repo = new LocalExperienceRepository("development");
      const doc = {
        shareId: "abc123def456",
        concept: "test",
        spec: { mode: "template", templateId: "seasons" } as never,
        createdAt: "2026-11-09T00:00:00Z",
      };
      expect(await repo.save(doc)).toBe("saved");
      expect(await repo.save(doc)).toBe("conflict");
      const loaded = await repo.get("abc123def456");
      expect(loaded?.concept).toBe("test");
      expect(await repo.get("missing12badid_")).toBe(null);
    } finally {
      process.cwd = origCwd;
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("usage counter increments across separate calls", async () => {
    const dir = mkdtempSync(join(tmpdir(), "conceptlab-test-"));
    const origCwd = process.cwd;
    process.cwd = () => dir;
    try {
      const repo = new LocalUsageRepository("development");
      const date = "2026-11-09";
      expect(await repo.getCallsFor(date)).toBe(0);
      await repo.recordCall(date, { inputTokens: 5, outputTokens: 6 });
      await repo.recordCall(date, { inputTokens: 5, outputTokens: 6 });
      expect(await repo.getCallsFor(date)).toBe(2);
    } finally {
      process.cwd = origCwd;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("checkAccessCode", () => {
  it("accepts the configured code and rejects wrong or missing ones", () => {
    expect(checkAccessCode(dummyCode, { LIVE_AI_ACCESS_CODE: dummyCode })).toBe(true);
    expect(checkAccessCode("wrong", { LIVE_AI_ACCESS_CODE: dummyCode })).toBe(false);
    expect(checkAccessCode(undefined, { LIVE_AI_ACCESS_CODE: dummyCode })).toBe(false);
    expect(checkAccessCode(dummyCode, {})).toBe(false);
  });

  it("is timing-safe (hash then constant-time compare)", () => {
    // Functional check only: both inputs of different lengths must not throw.
    expect(checkAccessCode("a", { LIVE_AI_ACCESS_CODE: dummyCode })).toBe(false);
    expect(checkAccessCode(dummyCode + "extra", { LIVE_AI_ACCESS_CODE: dummyCode })).toBe(false);
  });
});

describe("counter retry limit", () => {
  it("matches the plan's default of 5", () => {
    expect(LIMITS.COUNTER_WRITE_RETRIES).toBe(5);
  });
});

/**
 * Blob contract tests: the same contract as memory/local, against the real
 * private Blob store, under a test/ path prefix, cleaning up afterwards.
 * Skipped (and reported as skipped) when Blob credentials are absent.
 */
describe.skipIf(!hasBlobCredentials)("Blob repositories (live, test/ prefix)", () => {
  const envPrefix = "development";
  const pathPrefix = "test";
  const createdPaths: string[] = [];

  async function cleanup(): Promise<void> {
    for (const p of createdPaths.splice(0)) {
      try {
        await del(p);
      } catch {
        // best-effort cleanup
      }
    }
  }

  it(
    "experience save/get round-trips and refuses overwrite",
    async () => {
      const repo = new BlobExperienceRepository(envPrefix, pathPrefix);
      const shareId = makeShareId();
      const doc = {
        shareId,
        concept: "blob contract test",
        spec: FIXTURES.seasons.spec,
        createdAt: new Date().toISOString(),
      };
      createdPaths.push(`${pathPrefix}/${envPrefix}/experiences/${shareId}.json`);
      try {
        expect(await repo.save(doc)).toBe("saved");
        expect(await repo.save(doc)).toBe("conflict");
        const loaded = await repo.get(shareId);
        expect(loaded?.concept).toBe("blob contract test");
        expect(await repo.get("noSuchId0000_")).toBe(null);
      } finally {
        await cleanup();
      }
    },
    30_000,
  );

  it(
    "usage counter increments and survives a re-read",
    async () => {
      const repo = new BlobUsageRepository(envPrefix, pathPrefix);
      const date = `test-${Date.now()}`;
      createdPaths.push(`${pathPrefix}/${envPrefix}/usage/${date}.json`);
      try {
        expect(await repo.getCallsFor(date)).toBe(0);
        const first = await repo.recordCall(date, { inputTokens: 11, outputTokens: 3 });
        const second = await repo.recordCall(date, { inputTokens: 4, outputTokens: 2 });
        expect(second).toBe(first + 1);
        expect(await repo.getCallsFor(date)).toBe(2);
      } finally {
        await cleanup();
      }
    },
    30_000,
  );
});

if (!hasBlobCredentials) {
  describe("Blob repositories (skipped)", () => {
    it("is skipped because no Blob credentials are in the environment", () => {
      expect(hasBlobCredentials).toBe(false);
    });
  });
}
