import { test, expect } from "@playwright/test";
import { setRange } from "./helpers";

/**
 * Task 4: moving the Moon phases slider changes the readouts, and the
 * explanation/prompts are visible without covering the scene.
 */
test("moon-phases fixture: slider moves readouts and content is visible", async ({ page }) => {
  await page.goto("/preview/fixture/moon-phases");

  await expect(page.getByTestId("badge-not-to-scale")).toHaveText("Not to scale");
  await expect(page.getByTestId("badge-time-lapse")).toHaveText("Time-lapse");

  const slider = page.getByTestId("slider-orbitAngle");
  await expect(slider).toBeVisible();

  // Wait for hydration: range fills before it hit no React listener.
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");

  const litFraction = page.getByTestId("readout-litFraction");
  await expect(litFraction).toContainText("Illuminated fraction");

  const before = await litFraction.textContent();
  expect(before).toBeTruthy();

  // Move the slider to the far side (full moon).
  await setRange(page, "slider-orbitAngle", 180);
  await expect(litFraction).toContainText("1.00");
  const after = await litFraction.textContent();
  expect(after).not.toBe(before);

  // Content sections are present.
  await expect(page.getByRole("heading", { name: "Why the Moon has phases" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Try this" })).toBeVisible();
  await expect(page.getByText(/Phases come from seeing different parts/)).toBeVisible();

  // Scene canvas renders.
  await expect(page.getByTestId("viewer-scene").locator("canvas")).toBeVisible();
});

test("moon-phases fixture: slider has aria-valuetext with units", async ({ page }) => {
  await page.goto("/preview/fixture/moon-phases");
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");
  const slider = page.getByTestId("slider-orbitAngle");
  await expect(slider).toHaveAttribute("aria-valuetext", /°/);
});

test("moon-phases fixture: bindings move the moon mesh in the scene", async ({ page }) => {
  await page.goto("/preview/fixture/moon-phases");
  await expect(page.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");
  await setRange(page, "slider-orbitAngle", 180);
  await expect
    .poll(async () => JSON.parse((await page.getByTestId("viewer-scene").getAttribute("data-overrides")) ?? "{}")["moon.position.x"])
    .toBeCloseTo(-3, 5);
  const overrides = JSON.parse(
    (await page.getByTestId("viewer-scene").getAttribute("data-overrides")) ?? "{}",
  );
  // 180° = opposite the Sun: x = cos(180°)·3 = -3, z = sin(180°)·3 = 0.
  expect(overrides["moon.position.x"]).toBeCloseTo(-3, 5);
  expect(overrides["moon.position.z"]).toBeCloseTo(0, 5);
});
