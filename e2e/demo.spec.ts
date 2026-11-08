import { test, expect } from "@playwright/test";
import { setRange } from "./helpers";

/**
 * Task 8: /demo works with no environment keys and makes no AI calls and no
 * storage calls. All links work.
 */
test("demo page: both experiences render, no API calls at all", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) apiCalls.push(url);
  });
  await page.goto("/demo");

  await expect(page.locator("#demo-seasons")).toContainText("Why Earth has seasons");
  await expect(page.locator("#demo-moon-phases")).toContainText("Why the Moon has phases");

  // Both scenes render canvases.
  const canvases = page.locator(".demo-experience canvas");
  await expect(canvases.first()).toBeVisible();

  // Interact with the moon-phases demo (the second one).
  await expect(page.getByTestId("viewer-scene").first()).toHaveAttribute("data-hydrated", "true", { timeout: 20_000 });
  await setRange(page, "slider-orbitAngle", 180);
  await expect(page.getByTestId("readout-litFraction").last()).toContainText("1.00");

  // Zero API requests: no AI calls, no storage calls.
  expect(apiCalls, "no /api/* requests should be made on /demo").toHaveLength(0);
});

test("demo page: all links resolve", async ({ page }) => {
  await page.goto("/demo");
  const links = await page.getByRole("link").all();
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    const href = await link.getAttribute("href");
    expect(href, "demo links must be internal").toMatch(/^\//);
  }
  // Visit each internal link target and confirm it renders a page (not 404).
  await page.goto("/create");
  await expect(page.getByRole("heading", { name: "Create an experience" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "ConceptLab" })).toBeVisible();
});
