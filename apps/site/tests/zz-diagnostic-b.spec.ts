// DIAGNOSTIC, not for merging: the step the theme test failed on, timed in
// CI's engines, with the cover as this branch draws it, as main drew it (the
// backwards lap run in reverse again), without its masks, and paused.
import { test, type Page } from "@playwright/test";
import { measure, settle } from "./zz-diagnostic-lib";

const MAIN_LAP = `
  .site-cosmos-track-backwards > .site-cosmos-arm { animation-name: site-cosmos-lap !important; animation-direction: reverse !important; }
  .site-cosmos-track-backwards .site-cosmos-rider { animation-name: site-cosmos-lap-back !important; animation-direction: reverse !important; }`;
const variants: [string, string][] = [
  ["as this branch draws it", ""],
  ["as main drew it", MAIN_LAP],
  [
    "as main drew it, without masks",
    MAIN_LAP +
      " .site-cosmos * { mask: none !important; -webkit-mask: none !important; }",
  ],
  [
    "without masks",
    ".site-cosmos * { mask: none !important; -webkit-mask: none !important; }",
  ],
  [
    "loops paused",
    ".site-cosmos * { animation-play-state: paused !important; }",
  ],
];

async function flip(page: Page) {
  return page.evaluate(async () => {
    const item = [...document.querySelectorAll('[role="menuitemradio"]')].find(
      (el) => el.textContent?.includes("Dark"),
    ) as HTMLElement;
    const header = document.querySelector("header")!;
    const t0 = performance.now();
    item.click();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const t1 = performance.now();
    const gone = await new Promise<number>((resolve) => {
      const check = () =>
        document.querySelector('[role="menu"]') ||
        header.closest("[aria-hidden='true']") ||
        header.getAttribute("aria-hidden") === "true"
          ? setTimeout(check, 10)
          : resolve(performance.now());
      check();
    });
    return { click: Math.round(t1 - t0), back: Math.round(gone - t0) };
  });
}

for (const [label, css] of variants) {
  for (let run = 1; run <= 3; run++) {
    test(`[flip] ${label} ${run}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.emulateMedia({ colorScheme: "light" });
      await page.goto("/");
      await settle(page);
      if (css) await page.addStyleTag({ content: css });
      await page.waitForTimeout(800);
      if (run === 1) await measure(page, `[rest] ${label}`);
      await page.getByRole("button", { name: "Theme: System" }).click();
      await page.waitForTimeout(500);
      const t = await flip(page);
      console.log(
        `DIAG ${test.info().project.name} [flip] ${label}: click task ${t.click}ms, header back in the accessibility tree ${t.back}ms after the click`,
      );
    });
  }
}
