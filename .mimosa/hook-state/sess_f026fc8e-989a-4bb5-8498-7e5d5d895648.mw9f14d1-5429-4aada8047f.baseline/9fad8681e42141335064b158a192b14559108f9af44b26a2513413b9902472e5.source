import { test, expect } from "@playwright/test";

/**
 * Task 1 smoke tests: the home page loads and the canvas renders.
 * The dummy secret values passed to the webServer must never appear in the
 * page HTML — a bundle-leak check for the config helper.
 */
test("home page loads with hero, canvas and mode badge", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "ConceptLab" })).toBeVisible();
  await expect(page.locator("#mode-badge")).toHaveAttribute("data-mode", "fixture");
  await expect(page.getByRole("link", { name: "Try the demo" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an experience" })).toBeVisible();

  // The canvas renders (R3F injects a canvas element).
  const canvas = page.locator(".hero-scene canvas");
  await expect(canvas).toBeVisible();
});

test("secrets passed via env never appear in the page", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  // The test access code is a secret-shaped value fed through the webServer
  // env; it must never leak into the page HTML.
  expect(html).not.toContain("e2e-secret-access-code");
});
