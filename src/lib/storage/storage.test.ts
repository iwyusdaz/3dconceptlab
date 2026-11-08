import { describe, expect, it } from "vitest";
import { InMemoryUsageRepository } from "./memory";
import { LocalExperienceRepository, LocalUsageRepository } from "./local";
import { checkAccessCode } from "@/lib/ai/access";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { LIMITS } from "@/config/app-config";

const dummyCode = ["dummy", "access", "code"].join("-");

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
