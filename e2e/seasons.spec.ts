import { test, expect } from "@playwright/test";
import { setRange } from "./helpers";

/**
 * Task 5 result: on /preview/template/seasons, setting tilt to 0° removes
 * the seasons (daylight stays at 12 h all year at 51.5°N).
 */
test("seasons template: tilt 0 removes the seasons", async ({ page }) => {
  await page.goto("/preview/template/seasons");

  const daylight = page.getByTestId("readout-daylight");

  // Wait for hydration: range fills before it hit no React listener.
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");

  // Tilt 0: daylight must be ~12 h at both the June solstice and December.
  await setRange(page, "slider-tilt", 0);
  await expect(daylight).toContainText(/12\.0/); // settles at day=172, tilt=0
  await setRange(page, "slider-dayOfYear", 355);
  await expect(daylight).toContainText(/12\.0/);

  // Restoring tilt 23.5° at day 355: December is short (~7.6 h).
  await setRange(page, "slider-tilt", 23.5);
  await expect(daylight).toContainText(/7\.\d/);

  // June (day 172) at tilt 23.5°: long days (~16.4 h).
  await setRange(page, "slider-dayOfYear", 172);
  await expect(daylight).toContainText(/16\.\d/);
});

test("seasons template: badges and ground view are present", async ({ page }) => {
  await page.goto("/preview/template/seasons");
  await expect(page.getByTestId("badge-not-to-scale")).toHaveText("Not to scale");
  await expect(page.getByTestId("badge-time-lapse")).toHaveText("Time-lapse");
  await expect(page.getByTestId("viewer-scene").locator("canvas")).toBeVisible();
  await expect(page.getByTestId("readout-distance")).toBeVisible();
});
