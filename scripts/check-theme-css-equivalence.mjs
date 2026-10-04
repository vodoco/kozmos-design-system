// Diagnostic before/after check for the token factoring optimisation. Keep the
// pre-change built CSS as an artifact; never manufacture a baseline from output.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
const require = createRequire(
  new URL("../packages/react/package.json", import.meta.url),
);
const postcss = require("postcss");
assert.ok(process.argv[2], "Supply the pre-change built stylesheet path");
const before = fs.readFileSync(process.argv[2], "utf8");
const after = fs.readFileSync("packages/react/dist/style.css", "utf8");
const names = new Set();
function separate(css) {
  const root = postcss.parse(css);
  const tokens = {};
  for (const rule of [...root.nodes]) {
    if (
      rule.type !== "rule" ||
      !rule.selectors.every((s) =>
        /^\[data-kozmos-root\](?:\[data-theme=(?:"dark"|dark)\])?$/.test(s),
      ) ||
      !rule.nodes.every((d) => d.type === "decl" && d.prop.startsWith("--"))
    )
      continue;
    for (const selector of rule.selectors) {
      const key = selector.replaceAll('"', "");
      tokens[key] ??= {};
      for (const decl of rule.nodes) {
        assert.ok(
          !Object.hasOwn(tokens[key], decl.prop),
          "Expected unique canonical token declarations",
        );
        tokens[key][decl.prop] = [decl.value, Boolean(decl.important)];
        names.add(decl.prop);
      }
    }
    rule.remove();
  }
  return { tokens, rest: root.toString() };
}
assert.deepEqual(
  separate(after),
  separate(before),
  "Every token retains its value, importance and selector specificity; all other CSS is identical",
);

const browser = await launchFixtureBrowser();
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 800, height: 600 },
  });
  const captures = [];
  for (const css of [before, after]) {
    const page = await context.newPage();
    await page.setContent(`<style>${css}</style>
      <style>[data-kozmos-root]{--primitives-radius-sm:19px} [data-kozmos-root][data-theme="dark"]{--primitives-radius-md:23px}</style>
      <main data-kozmos-root data-theme="light" id="outer">
        <button class="kozmos-reset kozmos-button kozmos-button-default kozmos-button-size-default">Go</button>
        <section data-kozmos-root data-theme="dark" id="dark">
          <input class="kozmos-reset kozmos-input" value="Destination" aria-label="Destination">
          <section data-kozmos-root data-theme="light" id="nested" style="--primitives-radius-sm:31px">
            <button class="kozmos-reset kozmos-button kozmos-button-outline kozmos-button-size-default">Details</button>
          </section>
        </section>
      </main>`);
    const states = [];
    for (const theme of ["light", "dark"]) {
      await page
        .locator("#outer")
        .evaluate((el, value) => el.setAttribute("data-theme", value), theme);
      await page.getByRole("textbox").focus();
      // Theme changes start the existing button colour transitions. Compare
      // their completed state, not two different points on the same timeline.
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        await Promise.all(
          document
            .getAnimations()
            .filter(
              (animation) =>
                animation.effect?.getTiming().iterations !== Infinity,
            )
            .map((animation) => animation.finished),
        );
      });
      states.push(
        await page.locator("main,section,button,input").evaluateAll(
          (elements, properties) =>
            elements.map((el) => {
              const style = getComputedStyle(el);
              return Object.fromEntries(
                [...properties, ...Array.from(style)].map((key) => [
                  key,
                  style.getPropertyValue(key),
                ]),
              );
            }),
          [...names],
        ),
      );
      // Same local renderer on both sides; this is equivalence evidence, not
      // a replacement for the repository's canonical Linux visual baselines.
      states.push(await page.screenshot());
    }
    captures.push(states);
    await page.close();
  }
  assert.deepEqual(
    captures[1],
    captures[0],
    "Computed styles and pixels match, including nested themes, host/inline overrides, focus and live theme switching",
  );
  console.log(
    `Token equivalence passed: ${names.size} variables, all non-token CSS unchanged, nested-theme/cascade computed styles and pixels identical.`,
  );
  await context.close();
} finally {
  await browser.close();
}
