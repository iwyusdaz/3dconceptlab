import { test, expect } from "@playwright/test";
import { setRange } from "./helpers";

/**
 * Task 7 E2E (fixture mode): enter code → generate → edit title → save →
 * open the share link in a NEW browser context (as a student would).
 */
test("create → save → share link works end to end", async ({ browser }) => {
  const teacher = await browser.newContext();
  const page = await teacher.newPage();
  await page.goto("/create");

  await page.getByLabel("Concept").fill("why does the Moon have phases");
  await page.getByLabel("Access code").fill("e2e-secret-access-code");
  await page.getByRole("button", { name: "Generate" }).click();

  // Fixture mode generates instantly; the preview appears with the viewer.
  await expect(page.getByRole("heading", { name: "Preview and edit the text" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "Why the Moon has phases" })).toBeVisible();

  // Edit the title (plain text edit, re-validated).
  const title = page.getByLabel("Title");
  await title.fill("Moon phases (edited)");
  await expect(page.getByRole("heading", { name: "Moon phases (edited)" })).toBeVisible();

  // Save and get the share link.
  await page.getByRole("button", { name: "Save and get share link" }).click();
  await expect(page.getByRole("heading", { name: "Saved!" })).toBeVisible({ timeout: 30_000 });
  const shareValue = await page.getByTestId("share-link").inputValue();
  expect(shareValue).toMatch(/\/e\/[A-Za-z0-9_-]{12}$/);

  // Copy button.
  await page.getByTestId("copy-share-link").click();
  await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();

  // A student opens the link in a brand-new context: no account, no code.
  const student = await browser.newContext();
  const studentPage = await student.newPage();
  await studentPage.goto(shareValue);
  await expect(studentPage.getByRole("heading", { name: "Moon phases (edited)" })).toBeVisible();
  await expect(studentPage.getByTestId("viewer-scene").locator("canvas")).toBeVisible();

  // Sliders work on the share page too.
  await expect(studentPage.getByTestId("viewer-scene")).toHaveAttribute("data-hydrated", "true");
  await setRange(studentPage, "slider-orbitAngle", 180);
  await expect(studentPage.getByTestId("readout-litFraction")).toContainText("1.00");

  await teacher.close();
  await student.close();
});

test("unknown and badly formatted share IDs show the not-found page", async ({ page }) => {
  // Badly formatted ID.
  await page.goto("/e/not-a-valid-id!!");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  // Well-formed but unknown ID.
  await page.goto("/e/zzzzzzzzzzzz");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
