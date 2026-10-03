import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const output = `test-results/navigation-journey/${process.env.ADAPTIVE_BROWSER ?? "chromium"}`;
fs.mkdirSync(output, { recursive: true });
const checkAxe = async (page) =>
  assert.deepEqual(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => v.id),
    [],
  );
try {
  for (const width of [320, 1280])
    for (const theme of ["light", "dark"]) {
      for (const story of [
        "unavailable-route",
        "unavailable-step-free",
        "offline-recovery",
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: 720 },
        });
        const page = await context.newPage();
        await page.goto(
          `${base}/iframe.html?id=examples-navigation-journey--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        await dialog.evaluate(async (node) => {
          await Promise.all(
            node
              .getAnimations({ subtree: true })
              .map((animation) => animation.finished),
          );
        });
        const close = dialog.getByRole("button", {
          name: "Close",
          exact: true,
        });
        const rect = await close.boundingBox();
        assert.ok(
          rect.width >= 44 && rect.height >= 44,
          `Recovery close target ${rect.width}×${rect.height}`,
        );
        assert.equal(
          await dialog
            .getByRole("button", { name: "Retry calculation" })
            .count(),
          story === "offline-recovery" ? 1 : 0,
        );
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        assert.deepEqual(
          await dialog.evaluate((node) => {
            // Flush layout so a text-size change has instantiated transitions.
            node.getBoundingClientRect();
            return node
              .getAnimations()
              .filter(
                (animation) =>
                  animation instanceof CSSTransition &&
                  /^(width|max-width|max-height|font-size|padding-|row-gap|column-gap)/.test(
                    animation.transitionProperty,
                  ),
              )
              .map((animation) => animation.transitionProperty);
          }),
          [],
          "Text resizing must not animate dialog geometry independently of its title and close control",
        );
        const bounds = await dialog.boundingBox();
        assert.ok(
          bounds.x >= 0 &&
            bounds.y >= 0 &&
            bounds.x + bounds.width <= width + 1 &&
            bounds.y + bounds.height <= 721,
          "Recovery must fit viewport and scroll its own content",
        );
        assert.ok(
          await dialog.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
          "Recovery horizontal overflow",
        );
        const title = await dialog.getByRole("heading").evaluate((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().toJSON();
        });
        const closeAtZoom = await close.boundingBox();
        await page.screenshot({
          path: `${output}/${story}-${theme}-${width}.png`,
          fullPage: true,
        });
        assert.ok(
          title.x + title.width <= closeAtZoom.x ||
            title.y >= closeAtZoom.y + closeAtZoom.height ||
            title.y + title.height <= closeAtZoom.y,
          `Recovery title overlaps Close: ${JSON.stringify({ story, theme, width, title, closeAtZoom })}`,
        );
        await checkAxe(page);
        await close.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        await page.waitForFunction(
          () => document.activeElement?.textContent === "Continue",
        );
        assert.equal(
          await page.getByText("North terminal lobby", { exact: true }).count(),
          1,
          "Failure dismissal must preserve origin",
        );
        console.log(`ok recovery ${story} ${theme} ${width}`);
        await context.close();
      }
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(
        `${base}/iframe.html?id=examples-navigation-journey--controlled-journey&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
      );
      const input = page.getByRole("combobox", { name: "From" });
      await input.fill("North");
      await page
        .getByRole("option", { name: /North terminal lobby/ })
        .waitFor();
      await input.press("ArrowDown");
      await input.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Clear origin",
        null,
        { timeout: 3000 },
      );
      await page
        .getByRole("button", { name: "Clear origin", exact: true })
        .press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "combobox",
        null,
        { timeout: 3000 },
      );
      assert.equal(
        await input.evaluate((node) => node === document.activeElement),
        true,
        "Clear origin restores its own field",
      );
      await input.fill("North");
      await page
        .getByRole("option", { name: /North terminal lobby/ })
        .waitFor();
      await input.press("ArrowDown");
      await input.press("Enter");
      await page
        .getByRole("button", { name: "Clear destination", exact: true })
        .focus();
      await page
        .getByRole("button", { name: "Clear destination", exact: true })
        .press("Enter");
      const destinationInput = page.getByRole("combobox", {
        name: "To",
        exact: true,
      });
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "combobox",
        null,
        { timeout: 3000 },
      );
      assert.equal(
        await destinationInput.evaluate(
          (node) => node === document.activeElement,
        ),
        true,
        "Clear destination must not focus origin",
      );
      await destinationInput.fill("Gallery");
      await destinationInput.press("ArrowDown");
      await destinationInput.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Clear destination",
        null,
        { timeout: 3000 },
      );
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByRole("button", { name: "Cancel calculation" }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Deliver calculated route" })
          .count(),
        0,
      );
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page
        .getByRole("button", { name: "Deliver calculated route" })
        .click();
      await page
        .getByRole("button", { name: "Start navigation", exact: true })
        .click();
      await page.getByRole("button", { name: "Report 100% progress" }).click();
      assert.equal(
        await page.getByText("You've arrived", { exact: true }).count(),
        0,
      );
      await page
        .getByRole("button", { name: /Take the elevator to Level 2/ })
        .click();
      await page.getByRole("button", { name: "Hide itinerary" }).click();
      await checkAxe(page);
      await page
        .getByRole("button", { name: "Confirm arrival without metrics" })
        .click();
      await page.getByText("You've arrived", { exact: true }).waitFor();
      assert.equal(
        await page.getByText("Journey time", { exact: true }).count(),
        0,
      );
      await page.getByRole("button", { name: "Done", exact: true }).click();
      const selected = page.getByRole("button", {
        name: "Directions to selected destination",
      });
      await selected.waitFor();
      assert.equal(
        await selected.evaluate((node) => node === document.activeElement),
        true,
      );
      await page
        .getByText("Selected destination: Gallery", { exact: true })
        .waitFor();
      await checkAxe(page);
      console.log(`ok controlled journey ${theme} ${width}`);
      await context.close();
    }
} finally {
  await browser.close();
}
