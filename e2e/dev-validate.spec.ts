import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

test("pasting a broken spec into /dev/validate shows the errors", async ({ page }) => {
  await page.goto("/dev/validate");
  const broken = readFileSync(
    join(process.cwd(), "src/fixtures/broken/bad-binding-target.json"),
    "utf8",
  );
  const spec = JSON.parse(broken).spec;
  await page.getByLabel("Spec JSON").fill(JSON.stringify(spec, null, 2));
  await expect(page.getByText(/✗ \d+ error/)).toBeVisible();
  await expect(page.getByText(/does not exist/)).toBeVisible();
});

test("a valid spec shows a success message", async ({ page }) => {
  await page.goto("/dev/validate");
  const fixture = readFileSync(join(process.cwd(), "src/fixtures/moon-phases.json"), "utf8");
  const spec = JSON.parse(fixture).spec;
  await page.getByLabel("Spec JSON").fill(JSON.stringify(spec, null, 2));
  await expect(page.getByText("✓ Valid spec.")).toBeVisible();
});
