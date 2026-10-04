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
    // The defaults every direction draws: approved marks only (Olcay,
    // 2026-10-04), so lifts, escalators and stairs share the up and down
    // arrows. The proposed navigation artwork is shown below them for design
    // review; it must stay distinct and, like every physical direction, never
    // mirror in right to left.
    const set = (column, name) =>
      column.locator(`:scope > [data-glyph-set="${name}"]`);
    assert.equal(await set(ltr, "default").count(), 19);
    assert.equal(await set(rtlColumn, "default").count(), 19);
    assert.equal(await set(ltr, "proposed").count(), 10);
    for (const [name, distinct] of [
      ["default", 2],
      ["proposed", 6],
    ]) {
      const shapes = new Set();
      for (const kind of [
        "lift-up",
        "lift-down",
        "stairs-up",
        "stairs-down",
        "escalator-up",
        "escalator-down",
      ]) {
        const row = set(ltr, name).filter({
          has: page.getByText(kind, { exact: true }),
        });
        const rtl = set(rtlColumn, name).filter({
          has: page.getByText(kind, { exact: true }),
        });
        const paths = await row.locator("svg").first().innerHTML();
        shapes.add(paths);
        assert.equal(
          await rtl.locator("svg").first().innerHTML(),
          paths,
          `${name} ${kind}: physical direction must not mirror in RTL`,
        );
        for (const [i, size] of [14, 24, 32].entries()) {
          const svg = row.locator("svg").nth(i);
          const box = await svg.boundingBox();
          assert.equal(box.width, size);
          assert.equal(box.height, size);
          assert.equal(await svg.getAttribute("aria-hidden"), "true");
        }
      }
      assert.equal(shapes.size, distinct, `${name}: distinct glyphs`);
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(axe.violations, []);
    await page.screenshot({ path: `${output}/${theme}.png`, fullPage: true });
    await context.close();
  }
  console.log(
    "Navigation glyph atlas: 19 default directions (approved marks) and 10 proposed glyphs × 3 sizes × LTR/RTL × 2 themes passed",
  );
} finally {
  await browser.close();
}
