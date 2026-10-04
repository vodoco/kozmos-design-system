import assert from "node:assert/strict";
import fs from "node:fs";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const engine = process.env.ADAPTIVE_BROWSER ?? "chromium";
const output = `test-results/sdk-core-controls/${engine}`;
fs.mkdirSync(output, { recursive: true });
const cases = [
  ["components-searchbar--default", "Clear search"],
  ["product-sdk-categoryfield--default", "Clear category"],
  ["product-sdk-poiresultcard--selected-with-actions", "Go"],
  [
    "product-sdk-poiresultcard--long-action-labels",
    "Wegbeschreibung zum ausgewählten Ziel anzeigen",
  ],
  ["product-sdk-aiinputbar--default", "Send"],
  ["product-sdk-aicompanionpanel--conversation", "Close assistant"],
  ["components-wayfindingcard--default", "Swap origin and destination"],
];
const browser = await launchFixtureBrowser();
let count = 0;
try {
  for (const [id, name] of cases)
    for (const width of [320, 1280])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        try {
          await page.goto(
            `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
          );
          const control = page.getByRole("button", { name, exact: true });
          if (id.includes("searchbar"))
            await page.getByRole("searchbox").fill("Gates");
          await control.waitFor();
          if (id.includes("aiinputbar"))
            await page.getByRole("textbox").fill("Gates");
          // A layout box can exist while its animated ancestor is scaled or
          // clipped. Measure only after the authored finite reveal finishes.
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
              document
                .getAnimations()
                .filter(
                  (animation) =>
                    animation.effect?.getTiming().iterations !== Infinity,
                )
                .map((animation) => animation.finished.catch(() => {})),
            );
          });
          assert.equal(
            await control.evaluate((node) =>
              node.classList.contains("kozmos-button"),
            ),
            true,
            `${id}: Core control`,
          );
          if (id.includes("wayfindingcard"))
            assert.equal(await page.locator(".kozmos-field input").count(), 2);
          async function assertActionLabelsFit() {
            if (!id.includes("poiresultcard")) return;
            const sizes = await page
              .locator(".kozmos-poi-result-actions button")
              .evaluateAll((buttons) =>
                buttons.map((button) => {
                  const label = button.querySelector("span");
                  const box = button.getBoundingClientRect();
                  const row = button.closest("article").getBoundingClientRect();
                  const text = label.getBoundingClientRect();
                  return {
                    label: label.textContent,
                    unclipped:
                      label.scrollWidth <= label.clientWidth + 1 &&
                      label.scrollHeight <= label.clientHeight + 1,
                    inside:
                      box.left >= row.left - 1 &&
                      box.right <= row.right + 1 &&
                      text.top >= box.top &&
                      text.bottom <= box.bottom,
                  };
                }),
              );
            for (const size of sizes)
              assert.ok(
                size.unclipped && size.inside,
                `${id}: complete action label within card: ${JSON.stringify(size)}`,
              );
          }
          await assertActionLabelsFit();
          if (id.includes("searchbar")) {
            const target = await control.boundingBox();
            assert.equal(target.width, 44, "Core search clear width stays 44");
            assert.equal(
              target.height,
              44,
              "Core search clear height stays 44",
            );
            const circle = await control.locator("span").boundingBox();
            assert.equal(circle.width, 24, "search clear mark stays 24");
            assert.equal(circle.height, 24, "search clear mark stays 24");
          }
          if (id.includes("categoryfield")) {
            assert.equal(
              await page.locator('[data-slot="counter"]').count(),
              1,
            );
            const target = await control.boundingBox();
            assert.equal(target.width, 44, "Core clear target width stays 44");
            assert.equal(
              target.height,
              44,
              "Core clear target height stays 44",
            );
            const circle = await control.locator("span").boundingBox();
            assert.equal(
              circle.width,
              32,
              "clear mark stays 32 inside the target",
            );
          }
          assert.equal(
            await control.evaluate((node) => {
              const bounds = node.getBoundingClientRect();
              const target = document.elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
              );
              return target === node || node.contains(target);
            }),
            true,
            `${id}: control must not be clipped by a surrounding surface`,
          );
          await page.screenshot({
            path: `${output}/${id}-${theme}-${width}.png`,
            fullPage: true,
          });
          if (!(await control.isDisabled())) {
            await control.focus();
            assert.equal(
              await control.evaluate((node) => node === document.activeElement),
              true,
            );
            const shadow = await control.evaluate(
              (node) => getComputedStyle(node).boxShadow,
            );
            assert.notEqual(
              shadow,
              "none",
              `${id}: visible Core keyboard focus`,
            );
          }
          for (const direction of ["ltr", "rtl"]) {
            await page.evaluate((dir) => {
              document.documentElement.dir = dir;
              document.documentElement.style.fontSize = "200%";
            }, direction);
            await assertActionLabelsFit();
            const box = await control.boundingBox();
            assert.ok(
              box && box.width > 0 && box.height >= 44,
              `${id}: enlarged target`,
            );
            assert.ok(
              box.x >= -1 && box.x + box.width <= width + 1,
              `${id}: ${direction} control remains within viewport`,
            );
          }
          if (id.includes("searchbar")) {
            await control.click();
            const input = page.getByRole("searchbox");
            assert.equal(await input.inputValue(), "", "clear removes query");
            assert.equal(
              await input.evaluate((node) => document.activeElement === node),
              true,
              "clearing restores focus when the clear button disappears",
            );
            await page.keyboard.type("Gallery");
            assert.equal(
              await input.inputValue(),
              "Gallery",
              "typing continues after clear",
            );
          }
          count++;
          console.log(
            `PASS ${id} ${theme} ${width}: Core, focus, 200% LTR/RTL target`,
          );
        } finally {
          await context.close();
        }
      }
} finally {
  await browser.close();
}
console.log(
  `${count} SDK composition cases passed (${engine}); no baselines recorded.`,
);
