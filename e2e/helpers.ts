import type { Page, Locator } from "@playwright/test";

/**
 * Set a range input's value in a React-proof way: use the native value
 * setter then dispatch a bubbling input event, so React's value tracker
 * registers the change even if fill()'s synthetic events race hydration.
 */
export async function setRange(page: Page, testId: string, value: number): Promise<void> {
  const locator: Locator = page.getByTestId(testId);
  await locator.waitFor({ state: "visible" });
  await locator.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
