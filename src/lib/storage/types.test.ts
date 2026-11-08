import { describe, expect, it } from "vitest";
import { makeShareId, isValidShareId, utcToday } from "./types";

describe("makeShareId", () => {
  it("returns 12 URL-safe characters with no undefined segments", () => {
    for (let i = 0; i < 200; i++) {
      const id = makeShareId();
      expect(id).toHaveLength(12);
      expect(id).not.toContain("undefined");
      expect(isValidShareId(id)).toBe(true);
    }
  });
});

describe("isValidShareId", () => {
  it("accepts valid 12-char IDs and rejects everything else", () => {
    expect(isValidShareId(makeShareId())).toBe(true);
    expect(isValidShareId("short")).toBe(false);
    expect(isValidShareId("way-too-long-for-a-share-id")).toBe(false);
    expect(isValidShareId("has!special")).toBe(false);
  });
});

describe("utcToday", () => {
  it("formats a UTC date", () => {
    expect(utcToday(new Date("2026-11-09T01:00:00Z"))).toBe("2026-11-09");
    expect(utcToday(new Date("2026-11-09T23:59:59Z"))).toBe("2026-11-09");
  });
});
