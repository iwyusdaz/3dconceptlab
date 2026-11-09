import { test, expect } from "@playwright/test";

/**
 * /api/generate in fixture mode: access code required, fixture routing per
 * the plan's Modes table.
 */
test("generate API refuses a missing or wrong access code", async ({ request }) => {
  const noCode = await request.post("/api/generate", {
    data: { concept: "why do we have seasons" },
  });
  expect(noCode.status()).toBe(401);

  const wrongCode = await request.post("/api/generate", {
    data: { concept: "why do we have seasons", accessCode: "not-the-code" },
  });
  expect(wrongCode.status()).toBe(401);
});

test("generate API returns the seasons fixture with the correct code", async ({ request }) => {
  // The webServer config runs the app with the fixed test access code.
  const res = await request.post("/api/generate", {
    data: { concept: "why do we have seasons", accessCode: "e2e-secret-access-code" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("success");
  expect(body.spec.mode).toBe("template");
  expect(body.source).toBe("hand-written");
});

test("generate API rejects an over-long concept", async ({ request }) => {
  const res = await request.post("/api/generate", {
    data: { concept: "x".repeat(501), accessCode: "e2e-secret-access-code" },
  });
  expect(res.status()).toBe(400);
});
