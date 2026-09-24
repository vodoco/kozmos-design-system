import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("poi-gallery-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const root = require("postcss").parse(css);
root.walkAtRules("scope", (rule) => rule.remove());
const browser = await launchFixtureBrowser();
const results = [];
try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", root.toString()],
  ]) {
    for (const direction of ["ltr", "rtl"]) {
      for (const width of [320, 568, 1280]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
          reducedMotion: "reduce",
        });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        try {
          await page.setContent(
            '<!doctype html><html><body style="margin:0"><div id="fixture"></div></body></html>',
          );
          await page.addStyleTag({ content: stylesheet });
          await page.addScriptTag({ content: code });
          if (direction === "rtl")
            await page.getByRole("button", { name: "Use RTL" }).click();
          const controlled = page.getByRole("list", {
            name: "Controlled photos",
            exact: true,
          });
          const uncontrolled = page.getByRole("list", {
            name: "Uncontrolled photos",
            exact: true,
          });
          async function visibleIndex(list, expected) {
            await list.evaluate((e) => e.scrollLeft); // Resolve before polling geometry.
            try {
              await page.waitForFunction(
                ({ label, expected }) => {
                  const list = document.querySelector(
                    `ul[aria-label="${label}"]`,
                  );
                  if (!list?.children[expected]) return false;
                  const items = Array.from(list.children);
                  const active = items[expected];
                  const bounds = list.getBoundingClientRect();
                  const item = active.getBoundingClientRect();
                  return (
                    active.getAttribute("data-active") === "true" &&
                    item.left >= bounds.left - 1 &&
                    item.right <= bounds.right + 1
                  );
                },
                { label: await list.getAttribute("aria-label"), expected },
                { timeout: 5000 },
              );
            } catch (error) {
              console.error(
                "Gallery geometry",
                JSON.stringify(
                  await list.evaluate((element) => ({
                    scroll: element.scrollLeft,
                    width: element.clientWidth,
                    total: element.scrollWidth,
                    active: element.querySelector("[data-active]")?.textContent,
                    announcement:
                      element.parentElement.querySelector("[aria-live]")
                        ?.textContent,
                    rect: element.getBoundingClientRect().toJSON(),
                    items: Array.from(element.children).map((item) => ({
                      active: item.getAttribute("data-active"),
                      rect: item.getBoundingClientRect().toJSON(),
                    })),
                  })),
                ),
              );
              throw error;
            }
          }
          await visibleIndex(uncontrolled, 1);
          // A controlled prop change must move the image, but not a containing
          // panel/document. This fails with the old prop-only counter behaviour.
          const host = page.locator("#scrolling-host");
          const before = await host.evaluate((e) => e.scrollTop);
          await page.getByRole("button", { name: "Select third" }).click();
          await visibleIndex(controlled, 2);
          assert.equal(
            await host.evaluate((e) => e.scrollTop),
            before,
            "gallery alignment must not scroll its host",
          );
          await uncontrolled.focus();
          await page.keyboard.press("End");
          await visibleIndex(uncontrolled, 2);
          await page.keyboard.press("Home");
          await visibleIndex(uncontrolled, 0);
          await page.keyboard.press(
            direction === "rtl" ? "ArrowLeft" : "ArrowRight",
          );
          await visibleIndex(uncontrolled, 1);
          // Exercise the same native scroll event path used by touch/trackpads,
          // independently of our keyboard and previous/next handlers.
          for (let attempt = 0; attempt < 4; attempt += 1) {
            await page.keyboard.press("Home");
            await visibleIndex(uncontrolled, 0);
            await page.keyboard.press(
              direction === "rtl" ? "ArrowLeft" : "ArrowRight",
            );
            await visibleIndex(uncontrolled, 1);
            await uncontrolled.evaluate((e) =>
              e.scrollTo({
                left:
                  getComputedStyle(e).direction === "rtl"
                    ? -e.scrollWidth
                    : e.scrollWidth,
              }),
            );
            await visibleIndex(uncontrolled, 2);
          }
          assert.equal(
            await page
              .getByText("Uncontrolled image 3 of 3", { exact: true })
              .count(),
            1,
          );
          await page.setViewportSize({
            width: width === 320 ? 568 : 320,
            height: 800,
          });
          await visibleIndex(uncontrolled, 2);
          await visibleIndex(controlled, 2);
          await page.getByRole("button", { name: "Select first" }).click();
          await visibleIndex(controlled, 0);
          await page.getByRole("button", { name: "Reject changes" }).click();
          await controlled.focus();
          await page.keyboard.press("End");
          await visibleIndex(controlled, 0);
          for (let attempt = 0; attempt < 2; attempt += 1) {
            await controlled.evaluate((e) =>
              e.scrollTo({
                left:
                  getComputedStyle(e).direction === "rtl"
                    ? -e.scrollWidth
                    : e.scrollWidth,
              }),
            );
            await visibleIndex(controlled, 0);
          }
          await page.getByRole("button", { name: "Shrink media" }).click();
          await visibleIndex(uncontrolled, 0);
          await page.getByRole("button", { name: "Restore media" }).click();
          await visibleIndex(uncontrolled, 0);
          await page.getByRole("button", { name: "Clear media" }).click();
          assert.equal(await page.getByRole("list").count(), 0);
          await page.getByRole("button", { name: "Restore media" }).click();
          await visibleIndex(uncontrolled, 0);
          assert.deepEqual(errors, [], "runtime errors");
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            true,
          );
          results.push({ mode, direction, width, status: "passed" });
          console.log(`PASS gallery ${mode} ${direction} ${width}`);
        } finally {
          await page.close();
        }
      }
    }
  }
} finally {
  await browser.close();
  fs.mkdirSync("test-results/poi-gallery", { recursive: true });
  fs.writeFileSync(
    `test-results/poi-gallery/${process.env.ADAPTIVE_BROWSER ?? "chromium"}.json`,
    JSON.stringify(results, null, 2),
  );
}
assert.equal(results.length, 12);
