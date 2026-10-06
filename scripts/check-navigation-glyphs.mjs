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
        // The same drawing can still be turned by CSS — on the svg, a box
        // around it, or a group or path inside it — which the markup
        // comparison cannot see. Each element's transform from the page down
        // (rotate, scale and transform, translations aside) must keep the
        // drawing's handedness, and right to left must equal left to right:
        // a mirror, a half turn or any turn made only in right to left
        // changes the direction drawn.
        const linear = (svgs) =>
          svgs.evaluateAll((nodes) => {
            const degrees = (text) => {
              const value = parseFloat(text);
              if (text.endsWith("turn")) return value * 360;
              if (text.endsWith("grad")) return value * 0.9;
              if (text.endsWith("rad")) return (value * 180) / Math.PI;
              return value;
            };
            const own = (element) => {
              const style = getComputedStyle(element);
              let matrix = new DOMMatrix();
              if (style.rotate && style.rotate !== "none") {
                const parts = style.rotate.trim().split(/\s+/);
                const axis = parts.slice(0, -1);
                const [x, y, z] =
                  axis.length === 0
                    ? [0, 0, 1]
                    : axis.length === 1
                      ? ["x", "y", "z"].map((name) =>
                          axis[0] === name ? 1 : 0,
                        )
                      : axis.map(Number);
                matrix = matrix.rotateAxisAngle(
                  x,
                  y,
                  z,
                  degrees(parts[parts.length - 1]),
                );
              }
              if (style.scale && style.scale !== "none") {
                const [x, y = x, z = 1] = style.scale
                  .trim()
                  .split(/\s+/)
                  .map(Number);
                matrix = matrix.scale(x, y, z);
              }
              if (style.transform && style.transform !== "none")
                matrix = matrix.multiply(new DOMMatrix(style.transform));
              return matrix;
            };
            const composite = (element) => {
              const chain = [];
              for (let n = element; n; n = n.parentElement) chain.unshift(n);
              return chain.reduce(
                (matrix, n) => matrix.multiply(own(n)),
                new DOMMatrix(),
              );
            };
            return nodes.map((node) =>
              [node, ...node.querySelectorAll("*")].map((element) => {
                const m = composite(element);
                return [m.m11, m.m12, m.m21, m.m22].map(
                  (v) => Math.round(v * 1e6) / 1e6 + 0,
                );
              }),
            );
          });
        const ltrLinear = await linear(row.locator("svg"));
        const rtlLinear = await linear(rtl.locator("svg"));
        assert.ok(
          [...ltrLinear, ...rtlLinear]
            .flat()
            .every(([a, b, c, d]) => a * d - b * c > 0),
          `${name} ${kind}: physical direction must not be mirrored by CSS`,
        );
        assert.deepEqual(
          rtlLinear,
          ltrLinear,
          `${name} ${kind}: right to left must not turn the drawing`,
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
    "Navigation glyph atlas: 19 default directions (15 in Express wayfinding artwork) and 8 more wayfinding icons by name × 3 sizes × LTR/RTL × 2 themes passed, none mirrored or turned by CSS",
  );
} finally {
  await browser.close();
}
