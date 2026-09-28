import { test } from "@playwright/test";

/**
 * Full-page pictures of the main pages, light and dark, desktop and phone, for
 * a person to look at. Not assertions: run with SCREENSHOTS=1, Chromium only.
 *   SCREENSHOTS=1 pnpm test:e2e --project=chromium tests/screenshots.spec.ts
 */
const paths = [
  ["home", "/"],
  ["get-started", "/get-started"],
  ["examples", "/examples"],
  ["account-settings", "/examples/account-settings"],
  ["venue-explorer", "/examples/venue-explorer"],
  ["wayfinding", "/examples/wayfinding"],
  ["phone-search", "/examples/phone-search"],
  ["kiosk-directory", "/examples/kiosk-directory"],
  ["sign-in", "/examples/sign-in"],
  ["dashboard", "/examples/dashboard"],
  ["booking", "/examples/booking"],
  ["notifications", "/examples/notifications"],
  ["onboarding", "/examples/onboarding"],
  ["states", "/examples/states"],
  ["feedback-survey", "/examples/feedback-survey"],
  ["saved-places", "/examples/saved-places"],
  ["foundations-colour", "/foundations/colour"],
  ["components", "/components"],
  ["component-button", "/components/button"],
  ["component-adaptive-map-shell", "/components/adaptive-map-shell"],
  ["component-poi-detail-panel", "/components/poi-detail-panel"],
  ["component-tree", "/components/tree"],
  ["not-found", "/no-such-page"],
] as const;

const sizes = [
  ["desktop", { width: 1280, height: 800 }],
  ["phone", { width: 375, height: 812 }],
] as const;

for (const colorScheme of ["light", "dark"] as const) {
  for (const [sizeName, viewport] of sizes) {
    for (const [name, path] of paths) {
      test(`${name} ${colorScheme} ${sizeName}`, async ({
        page,
        browserName,
      }) => {
        test.skip(browserName !== "chromium", "pictures come from Chromium");
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        await page.waitForFunction(() =>
          Boolean(document.documentElement.dataset.theme),
        );
        // Lazy examples mount as they scroll into view; walk the page first.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 500) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          window.scrollTo(0, 0);
        });
        // The location marker's pulse never ends; wait for the finite ones.
        await page.waitForFunction(() =>
          document
            .getAnimations()
            .every(
              (animation) =>
                animation.playState !== "running" ||
                animation.effect?.getTiming().iterations === Infinity,
            ),
        );
        await page.screenshot({
          path: `screenshots/${name}-${colorScheme}-${sizeName}.png`,
          fullPage: true,
        });
      });
    }
  }
}
