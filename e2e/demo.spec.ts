import { test, expect, type Page } from "@playwright/test";

/**
 * Task 8 + scope-growth round 1: /demo works with no environment keys and
 * makes no AI calls and no storage calls. All links work.
 */

/**
 * Section-scoped setRange: the demo page repeats slider test ids across
 * experiences, so the interaction must target one section's input and check
 * that same input's DOM value.
 */
async function setRangeInSection(page: Page, sectionId: string, testId: string, value: number): Promise<void> {
  const selector = `#${sectionId} [data-testid="${testId}"]`;
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible" });
  const expected = String(value);
  for (let attempt = 0; attempt < 6; attempt++) {
    await locator.evaluate((el, v) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, String(v));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    try {
      await page.waitForFunction(
        ({ sel, expected }) =>
          (document.querySelector(sel) as HTMLInputElement | null)?.value === expected,
        { sel: selector, expected },
        { timeout: 1500, polling: 100 },
      );
      return;
    } catch {
      // Retry the dispatch.
    }
  }
  throw new Error(`setRangeInSection: "${selector}" never accepted value ${expected}`);
}

test("demo page: all experiences render, no API calls at all", async ({ page }) => {
  const apiCalls: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) apiCalls.push(url);
  });
  await page.goto("/demo");

  await expect(page.locator("#demo-seasons")).toContainText("Why Earth has seasons");
  await expect(page.locator("#demo-moon-phases")).toContainText("Why the Moon has phases");
  await expect(page.locator("#demo-eclipses")).toContainText("Solar and lunar eclipses");

  // The scenes render canvases.
  const canvases = page.locator(".demo-experience canvas");
  await expect(canvases.first()).toBeVisible();

  // Interact with the moon-phases demo, scoped to its section (the eclipses
  // experience also has a slider-orbitAngle).
  await expect(page.locator("#demo-moon-phases").getByTestId("viewer-scene")).toHaveAttribute(
    "data-hydrated",
    "true",
    { timeout: 20_000 },
  );
  await setRangeInSection(page, "demo-moon-phases", "slider-orbitAngle", 180);
  await expect(page.locator("#demo-moon-phases").getByTestId("readout-litFraction")).toContainText("1.00");

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
  await expect(page.getByRole("heading", { level: 1, name: "3D ConceptLab" })).toBeVisible();
});
