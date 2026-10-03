import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const browser = await launchFixtureBrowser();
const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const output = `test-results/navigation-glyphs/${process.env.ADAPTIVE_BROWSER ?? "chromium"}`;
fs.mkdirSync(output, { recursive: true });
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 900, height: 1100 },
    });
    const page = await context.newPage();
    await page.goto(
      `${base}/iframe.html?id=map-directionstep--glyph-atlas&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
    );
    await page.getByRole("heading", { name: "LTR", exact: true }).waitFor();
    const ltr = page
      .getByRole("heading", { name: "LTR", exact: true })
      .locator("..");
    const rtlColumn = page
      .getByRole("heading", { name: "RTL", exact: true })
      .locator("..");
    assert.equal(await ltr.locator("svg").count(), 19 * 3);
    assert.equal(await rtlColumn.locator("svg").count(), 19 * 3);
    const rows = ltr.locator(":scope > div");
    const shapes = new Set();
    for (const kind of [
      "lift-up",
      "lift-down",
      "stairs-up",
      "stairs-down",
      "escalator-up",
      "escalator-down",
    ]) {
      const row = rows.filter({ has: page.getByText(kind, { exact: true }) });
      const rtl = rtlColumn
        .locator(":scope > div")
        .filter({ has: page.getByText(kind, { exact: true }) });
      const paths = await row.locator("svg").first().innerHTML();
      shapes.add(paths);
      assert.equal(
        await rtl.locator("svg").first().innerHTML(),
        paths,
        "Physical direction must not mirror in RTL",
      );
      for (const [i, size] of [14, 24, 32].entries()) {
        const svg = row.locator("svg").nth(i);
        const box = await svg.boundingBox();
        assert.equal(box.width, size);
        assert.equal(box.height, size);
        assert.equal(await svg.getAttribute("aria-hidden"), "true");
      }
    }
    assert.equal(shapes.size, 6);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(axe.violations, []);
    await page.screenshot({ path: `${output}/${theme}.png`, fullPage: true });
    await context.close();
  }
  console.log(
    "Navigation glyph atlas: 19 directions × 3 sizes × LTR/RTL × 2 themes passed",
  );
} finally {
  await browser.close();
}
