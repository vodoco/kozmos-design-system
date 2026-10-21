// DIAGNOSTIC, not for merging: the same with the suite's own tracing.
import { test } from "@playwright/test";
import { cases, measure, settle } from "./zz-diagnostic-lib";

for (const [path, label, css] of cases.slice(0, 4)) {
  test(`[trace as configured] ${label}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(path);
    await settle(page);
    await measure(page, `[trace as configured] ${label}`, css);
  });
}
