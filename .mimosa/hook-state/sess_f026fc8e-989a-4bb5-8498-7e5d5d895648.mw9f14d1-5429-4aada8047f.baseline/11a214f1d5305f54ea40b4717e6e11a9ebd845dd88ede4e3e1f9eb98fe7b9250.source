import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Task 9: axe checks on every page. No serious or critical violations.
 */

const PAGES = [
  "/",
  "/demo",
  "/create",
  "/dev/validate",
  "/preview/fixture/moon-phases",
  "/preview/template/seasons",
];

for (const path of PAGES) {
  test(`axe: ${path} has no serious or critical violations`, async ({ page }) => {
    await page.goto(path);
    // Give scenes time to mount.
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    if (serious.length > 0) {
      const summary = serious
        .map(
          (v) =>
            `${v.id} (${v.impact}): ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(" "))
              .join("; ")}`,
        )
        .join("\n");
      throw new Error(`axe violations on ${path}:\n${summary}`);
    }
    expect(serious).toHaveLength(0);
  });
}

test("axe: a share page has no serious or critical violations", async ({ request, page }) => {
  // Save an experience via the API (fixture mode, local-file storage in E2E).
  const res = await request.post("/api/experiences", {
    data: {
      concept: "why does the moon have phases",
      accessCode: "e2e-secret-access-code",
      spec: {
        mode: "composed",
        parts: [
          { id: "sun", type: "lightSource", position: [12, 0, 0], intensity: 3, color: "#fff4d6", radius: 1.6 },
          { id: "earth", type: "sphere", position: [0, 0, 0], radius: 1, color: "#2b6cb0" },
          { id: "moon", type: "sphere", position: [3, 0, 0], radius: 0.27, color: "#cfcfcf", showPhase: true },
          { id: "moonOrbit", type: "orbitPath", center: [0, 0, 0], radius: 3, color: "#5a6b8c" },
        ],
        variables: [
          {
            id: "orbitAngle",
            label: "Moon's position in its orbit",
            min: 0,
            max: 360,
            step: 1,
            default: 45,
            unit: "°",
            bindings: [
              { target: "moon.position.x", op: "cosDeg", param: 3 },
              { target: "moon.position.z", op: "sinDeg", param: 3 },
            ],
          },
        ],
        readouts: [
          { id: "litFraction", label: "Illuminated fraction", formula: "illuminatedFraction", inputs: { elongation: "$orbitAngle" } },
        ],
        content: {
          title: "Why the Moon has phases",
          explanation: "The lit half we see changes as the Moon orbits.",
          tryThis: ["Drag the slider to full moon."],
          keyIdea: "Phases come from viewing angles, not shadow.",
        },
      },
    },
  });
  expect(res.status()).toBe(200);
  const { path } = await res.json();

  await page.goto(path);
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) =>
    ["serious", "critical"].includes(v.impact ?? ""),
  );
  if (serious.length > 0) {
    const summary = serious
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("; ")}`)
      .join("\n");
    throw new Error(`axe violations on ${path}:\n${summary}`);
  }
  expect(serious).toHaveLength(0);
});
