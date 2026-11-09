import type { Page, Locator } from "@playwright/test";

/**
 * Set a range input's value in a React-proof way: use the native value
 * setter then dispatch a bubbling input event, so React's value tracker
 * registers the change. Because the input is React-controlled, a dispatch
 * that lands before React is ready gets reset to the old state value — so
 * we confirm the DOM value stuck, retrying briefly if it did not.
 */
export async function setRange(page: Page, testId: string, value: number): Promise<void> {
  const locator: Locator = page.getByTestId(testId);
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
      // React reflects the new state onto the controlled input within a
      // frame or two; if the dispatch was lost, the value reverts.
      await locator
        .page()
        .waitForFunction(
          ({ id, expected }) =>
            (document.querySelector(`[data-testid="${id}"]`) as HTMLInputElement | null)
              ?.value === expected,
          { id: testId, expected },
          { timeout: 1500, polling: 100 },
        );
      return;
    } catch {
      // Retry the dispatch.
    }
  }
  throw new Error(
    `setRange: slider "${testId}" never accepted value ${expected} (React state did not register the change)`,
  );
}
