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
    // The defaults every direction draws: turns, turning back, the
    // destination, walking, lifts, escalators, stairs, ramps, entry and exit
    // in Pointr Maps - Express's wayfinding artwork (Olcay, 2026-10-04/05), each its own
    // solid shape; the rest of that set below them, by name. Like every
    // physical direction, none mirrors in right to left.
    const set = (column, name) =>
      column.locator(`:scope > [data-glyph-set="${name}"]`);
    assert.equal(await set(ltr, "default").count(), 19);
    assert.equal(await set(rtlColumn, "default").count(), 19);
    assert.equal(await set(ltr, "by-name").count(), 8);
    assert.equal(await set(rtlColumn, "by-name").count(), 8);
    const wayfinding = [
      "walking",
      "left",
      "right",
      "turn-back",
      "destination",
      "lift-up",
      "lift-down",
      "stairs-up",
      "stairs-down",
      "escalator-up",
      "escalator-down",
      "ramp-up",
      "ramp-down",
      "enter",
      "exit",
    ];
    const byName = [
      "ElevatorUpAndDown",
      "EscalatorNoDirection",
      "StairsNoDirection",
      "RampNoDirection",
      "RouteEntranceExit",
      "CustomTransition",
      "SecurityControl",
      "Shuttle",
    ];
    for (const [name, kinds] of [
      ["default", wayfinding],
      ["by-name", byName],
    ]) {
      const shapes = new Set();
      for (const kind of kinds) {
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
          // Solid shapes in the text colour: the artwork is filled, not
          // outlined, and must follow the theme like any text.
          assert.equal(await svg.getAttribute("fill"), "currentColor");
          assert.equal(await svg.getAttribute("stroke"), null);
        }
      }
      assert.equal(shapes.size, kinds.length, `${name}: distinct glyphs`);
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(axe.violations, []);
    await page.screenshot({ path: `${output}/${theme}.png`, fullPage: true });
    await context.close();
  }
  console.log(
    "Navigation glyph atlas: 19 default directions (15 in Express wayfinding artwork) and 8 more wayfinding icons by name × 3 sizes × LTR/RTL × 2 themes passed",
  );
} finally {
  await browser.close();
}
