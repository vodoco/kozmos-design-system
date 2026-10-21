// DIAGNOSTIC, not for merging: what makes the home page slow in WebKit on
// CI. Prints numbers; asserts nothing. Trace off.
import { test } from "@playwright/test";
import { cases, measure, settle } from "./zz-diagnostic-lib";

test.use({ trace: "off" });

for (const [path, label, css] of cases) {
  test(`[trace off] ${label}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(path);
    await settle(page);
    await measure(page, `[trace off] ${label}`, css);
  });
}

test.describe("one device pixel", () => {
  test.use({ deviceScaleFactor: 1 });
  for (const [path, label, css] of cases.slice(0, 3)) {
    test(`[dpr 1] ${label}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(path);
      await settle(page);
      await measure(page, `[dpr 1] ${label}`, css);
    });
  }
});

test("diagnostic, the theme flip on the home page", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await settle(page);
  await page.getByRole("button", { name: "Theme: System" }).click();
  await page.waitForTimeout(500);
  const timing = await page.evaluate(async () => {
    const item = [...document.querySelectorAll('[role="menuitemradio"]')].find(
      (el) => el.textContent?.includes("Dark"),
    ) as HTMLElement;
    const t0 = performance.now();
    item.click();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    const t1 = performance.now();
    const firstFrame = await new Promise<number>((resolve) =>
      requestAnimationFrame(() => resolve(performance.now())),
    );
    const secondFrame = await new Promise<number>((resolve) =>
      requestAnimationFrame(() => resolve(performance.now())),
    );
    const gone = await new Promise<number>((resolve) => {
      const check = () =>
        document.querySelector('[role="menu"]')
          ? setTimeout(check, 10)
          : resolve(performance.now());
      check();
    });
    return {
      click: Math.round(t1 - t0),
      firstFrame: Math.round(firstFrame - t1),
      secondFrame: Math.round(secondFrame - firstFrame),
      menuGone: Math.round(gone - t0),
    };
  });
  console.log(
    `DIAG ${test.info().project.name} theme flip: click task ${timing.click}ms, next frame +${timing.firstFrame}ms, then +${timing.secondFrame}ms, menu gone ${timing.menuGone}ms after the click`,
  );
});
