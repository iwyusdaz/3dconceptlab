import { test, expect } from "@playwright/test";
import { setRange } from "./helpers";

/**
 * Scope-growth round 1: the eclipses template on /preview/fixture/eclipses.
 * Readouts are the ground truth the scene geometry mirrors (moon on the
 * inclined orbit, shadow cones pointing away from the Sun).
 */
test("eclipses template: Moon height above the ecliptic follows the orbit slider", async ({ page }) => {
  await page.goto("/preview/fixture/eclipses");

  const lat = page.getByTestId("readout-eclipticLat");
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");

  // Default orbitAngle 0 = new moon exactly on the node: latitude 0.
  await expect(lat).toContainText("0.00");

  // 90° from the node line: at the full inclination (5.1°).
  await setRange(page, "slider-orbitAngle", 90);
  await expect(lat).toContainText("5.10");

  // Behind Earth (180°, full moon on the opposite node): back to 0.
  await setRange(page, "slider-orbitAngle", 180);
  await expect(lat).toContainText("0.00");

  // Inclination 0: always aligned, every month would be an eclipse month.
  await setRange(page, "slider-inclination", 0);
  await setRange(page, "slider-orbitAngle", 90);
  await expect(lat).toContainText("0.00");
});

test("eclipses template: distance slider changes the Moon's apparent size and the size ratio", async ({ page }) => {
  await page.goto("/preview/fixture/eclipses");
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");

  // Mean distance: Moon slightly smaller than the Sun (ratio ~0.97).
  await expect(page.getByTestId("readout-moonAngularSize")).toContainText("0.52");
  await expect(page.getByTestId("readout-sizeRatio")).toContainText("0.97");

  // Apogee (slider max 406,000 km): Moon clearly smaller than the Sun.
  await setRange(page, "slider-moonDistance", 406000);
  await expect(page.getByTestId("readout-moonAngularSize")).toContainText("0.49");
  await expect(page.getByTestId("readout-sizeRatio")).toContainText("0.92");

  // Perigee (slider min 356,000 km): Moon bigger than the Sun — total possible.
  await setRange(page, "slider-moonDistance", 356000);
  await expect(page.getByTestId("readout-moonAngularSize")).toContainText("0.56");
  await expect(page.getByTestId("readout-sizeRatio")).toContainText("1.05");

  // The Sun's apparent size never changes.
  await expect(page.getByTestId("readout-sunAngularSize")).toContainText("0.53");
});

test("eclipses template: badges, canvas and content are present", async ({ page }) => {
  await page.goto("/preview/fixture/eclipses");
  await expect(page.getByTestId("badge-not-to-scale")).toHaveText("Not to scale");
  await expect(page.getByTestId("badge-time-lapse")).toHaveText("Time-lapse");
  await expect(page.getByTestId("viewer-scene").locator("canvas").first()).toBeVisible();
  // No inset panel registered for this template.
  await expect(page.getByTestId("scene-inset")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Solar and lunar eclipses" })).toBeVisible();
  // The misconception-testing "Try this" prompt is present.
  await expect(page.locator(".content ol")).toContainText("tilt to 0°");
});
