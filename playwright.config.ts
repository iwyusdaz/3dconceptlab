import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright runs the app itself through `webServer` (see Agent Execution
 * Rules: never leave a dev server running in the foreground). Fixture mode is
 * forced for E2E so no AI calls or Blob credentials are needed.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "sh scripts/e2e-server.sh",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      FIXTURE_MODE: "true",
      LIVE_AI_ACCESS_CODE: "e2e-secret-access-code",
      BLOB_READ_WRITE_TOKEN: "e2e-secret-blob-token",
    },
  },
});
