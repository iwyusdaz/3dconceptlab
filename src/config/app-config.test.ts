import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  getMode,
  getDailyCap,
  getDeepSeekModel,
  getServerStatus,
  getStorageBackend,
  getBlobEnvPrefix,
  hasBlobCredentials,
  LIMITS,
} from "./app-config";

// Dummy values for tests, constructed at runtime so no credential-looking
// literal ever appears in the source.
const dummyKey = ["dummy", "key", "value"].join("-");
const dummySecret = ["dummy", "secret", "value"].join("-");

describe("getMode", () => {
  it("is fixture when FIXTURE_MODE is true, even with a key present", () => {
    expect(getMode({ FIXTURE_MODE: "true", DEEPSEEK_API_KEY: dummyKey })).toBe("fixture");
  });

  it("is live when FIXTURE_MODE is not true and a key is set", () => {
    expect(getMode({ FIXTURE_MODE: "false", DEEPSEEK_API_KEY: dummyKey })).toBe("live");
    expect(getMode({ DEEPSEEK_API_KEY: dummyKey })).toBe("live");
  });

  it("is fixture when the key is missing", () => {
    expect(getMode({ FIXTURE_MODE: "false" })).toBe("fixture");
    expect(getMode({})).toBe("fixture");
  });
});

describe("getDailyCap", () => {
  it("defaults to 150", () => {
    expect(getDailyCap({})).toBe(150);
    expect(getDailyCap({ AI_DAILY_CAP: "not-a-number" })).toBe(150);
    expect(getDailyCap({ AI_DAILY_CAP: "0" })).toBe(150);
    expect(getDailyCap({ AI_DAILY_CAP: "-5" })).toBe(150);
  });

  it("uses the env override when valid", () => {
    expect(getDailyCap({ AI_DAILY_CAP: "42" })).toBe(42);
  });
});

describe("getDeepSeekModel", () => {
  it("reads DEEPSEEK_MODEL and is empty when unset", () => {
    expect(getDeepSeekModel({ DEEPSEEK_MODEL: "deepseek-chat" })).toBe("deepseek-chat");
    expect(getDeepSeekModel({})).toBe("");
  });

  it("has no hardcoded model name", () => {
    // The module must not embed a model name as a fallback default.
    const source = readFileSync(join(process.cwd(), "src", "config", "app-config.ts"), "utf8");
    expect(source).not.toMatch(/deepseek-(chat|reasoner)/);
  });
});

describe("getServerStatus", () => {
  it("reports booleans about secrets, never their values", () => {
    const status = getServerStatus({
      DEEPSEEK_API_KEY: dummyKey,
      LIVE_AI_ACCESS_CODE: dummySecret,
      BLOB_READ_WRITE_TOKEN: dummyKey,
      FIXTURE_MODE: "true",
    });
    expect(status.mode).toBe("fixture");
    expect(status.deepSeekKeyPresent).toBe(true);
    expect(status.accessCodePresent).toBe(true);
    expect(status.blobCredentialsPresent).toBe(true);
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain(dummyKey);
    expect(serialized).not.toContain(dummySecret);
  });
});

describe("hasBlobCredentials / getStorageBackend", () => {
  it("uses blob only when the token is present", () => {
    expect(hasBlobCredentials({})).toBe(false);
    expect(hasBlobCredentials({ BLOB_READ_WRITE_TOKEN: dummyKey })).toBe(true);
    expect(getStorageBackend({})).toBe("local");
    expect(getStorageBackend({ BLOB_READ_WRITE_TOKEN: dummyKey })).toBe("blob");
  });
});

describe("getBlobEnvPrefix", () => {
  it("maps VERCEL_ENV to a safe prefix and defaults to development", () => {
    expect(getBlobEnvPrefix({ VERCEL_ENV: "production" })).toBe("production");
    expect(getBlobEnvPrefix({ VERCEL_ENV: "preview" })).toBe("preview");
    expect(getBlobEnvPrefix({ VERCEL_ENV: "development" })).toBe("development");
    expect(getBlobEnvPrefix({})).toBe("development");
    expect(getBlobEnvPrefix({ VERCEL_ENV: "weird" })).toBe("development");
  });
});

describe("LIMITS", () => {
  it("matches the plan's Default Values table", () => {
    expect(LIMITS.AI_DAILY_CAP_DEFAULT).toBe(150);
    expect(LIMITS.CONCEPT_TEXT).toBe(500);
    expect(LIMITS.EDITABLE_TEXT).toBe(500);
    expect(LIMITS.GENERATION_TIMEOUT_MS).toBe(60_000);
    expect(LIMITS.GENERATION_RETRIES).toBe(2);
    expect(LIMITS.SCENE_PART_CAP).toBe(40);
    expect(LIMITS.SHARE_ID_LENGTH).toBe(12);
    expect(LIMITS.COUNTER_WRITE_RETRIES).toBe(5);
  });
});
