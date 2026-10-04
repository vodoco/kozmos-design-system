import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";
const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const output = `test-results/navigation-journey/${process.env.ADAPTIVE_BROWSER ?? "chromium"}`;
fs.mkdirSync(output, { recursive: true });
const checkCenteredChange = async (page) => {
  for (const name of ["Change From", "Change To"]) {
    const offset = await page
      .getByRole("button", { name, exact: true })
      .evaluate((button) => {
        const card = button.closest(".border");
        const a = button.getBoundingClientRect();
        const b = card.getBoundingClientRect();
        return Math.abs(a.y + a.height / 2 - b.y - b.height / 2);
      });
    assert.ok(
      offset <= 1,
      `${name} must be vertically centered in its card (offset ${offset}px)`,
    );
  }
};
const checkAxe = async (page) => {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    report.violations.map((v) => v.id),
    [],
  );
  assert.deepEqual(
    report.incomplete.filter((item) => item.id === "aria-prohibited-attr"),
    [],
    "Journey labels must name a supported semantic role, not a generic container",
  );
};
try {
  for (const width of [320, 1280])
    for (const theme of ["light", "dark"]) {
      for (const story of [
        "unavailable-route",
        "unavailable-step-free",
        "offline-recovery",
        "unavailable-position",
        "interrupted-calculation",
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
        const primary = dialog.getByRole("button", {
          name: ["offline-recovery", "interrupted-calculation"].includes(story)
            ? "Retry calculation"
            : "Choose another starting point",
          exact: true,
        });
        assert.equal(
          await primary.evaluate((node) => node === document.activeElement),
          true,
          "Recovery must initially focus the recommended action, not abandon the route",
        );
        assert.equal(
          await dialog.locator(".kozmos-button-default").count(),
          1,
          "Recovery must have exactly one primary action",
        );
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
          ["offline-recovery", "interrupted-calculation"].includes(story)
            ? 1
            : 0,
        );
        const primaryBox = await primary.boundingBox();
        const exitBox = await dialog
          .getByRole("button", { name: "Explore map" })
          .boundingBox();
        assert.ok(
          primaryBox.y < exitBox.y,
          "Primary action must precede map exit visually",
        );
        await primary.press("Shift+Tab");
        assert.equal(
          await close.evaluate((node) => node === document.activeElement),
          true,
          "Focus is trapped backwards within the dialog",
        );
        await close.press("Tab");
        assert.equal(
          await primary.evaluate((node) => node === document.activeElement),
          true,
          "Focus wraps to the recommended action",
        );
        await page.screenshot({
          path: `${output}/${story}-${theme}-${width}-default.png`,
          fullPage: true,
        });
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
        // DialogContent accepts native dir/style props: stress the same mounted
        // composition in RTL with enlarged text and expanded letter spacing.
        await dialog.evaluate((node) => {
          node.dir = "rtl";
          node.style.letterSpacing = "0.12em";
        });
        assert.equal(
          await dialog.evaluate((node) => getComputedStyle(node).direction),
          "rtl",
        );
        const rtlTitle = await dialog.getByRole("heading").evaluate((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().toJSON();
        });
        const rtlClose = await close.boundingBox();
        assert.ok(
          rtlTitle.x >= rtlClose.x + rtlClose.width ||
            rtlTitle.x + rtlTitle.width <= rtlClose.x ||
            rtlTitle.y >= rtlClose.y + rtlClose.height ||
            rtlTitle.y + rtlTitle.height <= rtlClose.y,
          "Enlarged RTL title must not overlap its dismiss control",
        );
        assert.ok(
          await dialog.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
          "Enlarged RTL recovery must wrap without horizontal overflow",
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
        // Exercise actual exit routes as well as Escape; each must focus the screen it reveals.
        for (const action of [
          "Choose another starting point",
          "Explore map",
          ...(["offline-recovery", "interrupted-calculation"].includes(story)
            ? ["Retry calculation"]
            : []),
        ]) {
          await page.goto(
            `${base}/iframe.html?id=examples-navigation-journey--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
          );
          await page
            .getByRole("dialog")
            .getByRole("button", { name: action, exact: true })
            .click();
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          const target =
            action === "Explore map"
              ? page.getByRole("button", {
                  name: "Directions to selected destination",
                })
              : action === "Choose another starting point"
                ? page.getByRole("combobox", { name: "From", exact: true })
                : page.getByRole("button", { name: "Cancel calculation" });
          await target.waitFor();
          await page.waitForFunction(
            (element) => element === document.activeElement,
            await target.elementHandle(),
          );
          if (action === "Explore map")
            await page
              .getByText("Selected destination: Gallery", { exact: true })
              .waitFor();
          else
            assert.equal(
              await page
                .getByRole("button", { name: "Change To", exact: true })
                .locator("../..")
                .getByText("Gallery", { exact: true })
                .count(),
              1,
              "Recovery retains the destination",
            );
          if (action === "Choose another starting point") {
            // The confirmed origin is kept while it is being changed:
            // cancelling restores it.
            await page
              .getByRole("button", { name: "Cancel From", exact: true })
              .click();
            await page
              .getByText("North terminal lobby", { exact: true })
              .waitFor();
          }
        }
        console.log(
          `ok recovery action destinations ${story} ${theme} ${width}`,
        );
        await context.close();
      }
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(
        `${base}/iframe.html?id=examples-navigation-journey--blue-dot-available&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
      );
      const positionInput = page.getByRole("combobox", { name: "From" });
      await positionInput.click();
      await page
        .getByRole("option", { name: /North terminal lobby/ })
        .waitFor();
      await page.waitForFunction(() => {
        const choice = [...document.querySelectorAll('[role="option"]')].find(
          (n) => n.textContent === "Select from the map",
        );
        if (!choice) return false;
        const r = choice.getBoundingClientRect();
        return choice.contains(
          document.elementFromPoint(r.x + r.width / 2, r.bottom - 2),
        );
      });
      await checkAxe(page);
      await page
        .getByRole("option", { name: "Current position", exact: true })
        .click();
      await page.getByText("Current position", { exact: true }).waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .isEnabled(),
        true,
      );
      console.log(`ok blue-dot dropdown unclipped ${theme} ${width}`);
      await page.goto(
        `${base}/iframe.html?id=examples-navigation-journey--controlled-journey&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
      );
      const input = page.getByRole("combobox", { name: "From" });
      await input.fill("North terminal lobby");
      await page
        .getByRole("option", { name: /North terminal lobby/ })
        .waitFor();
      await input.press("ArrowDown");
      await input.press("Home");
      await input.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Change From",
        null,
        { timeout: 3000 },
      );
      await checkCenteredChange(page);
      await page
        .getByRole("button", { name: "Change From", exact: true })
        .press("Enter");
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("role") === "combobox",
        null,
        { timeout: 3000 },
      );
      assert.equal(
        await input.evaluate((node) => node === document.activeElement),
        true,
        "Change origin focuses its own draft field",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .isDisabled(),
        true,
      );
      await input.fill("Uncommitted replacement");
      await page
        .getByRole("button", { name: "Clear search", exact: true })
        .click();
      assert.equal(await input.inputValue(), "");
      await page
        .getByRole("button", { name: "Cancel From", exact: true })
        .click();
      assert.equal(
        await page.getByText("North terminal lobby", { exact: true }).count(),
        1,
        "Cancel preserves the original place after clearing a draft",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .isEnabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Change From", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await page
        .getByRole("button", { name: "Change From", exact: true })
        .press("Enter");
      await input.fill("North terminal lobby");
      await page
        .getByRole("option", { name: /North terminal lobby/ })
        .waitFor();
      await input.press("ArrowDown");
      await input.press("Home");
      await input.press("Enter");
      await page
        .getByRole("button", { name: "Change To", exact: true })
        .focus();
      await page
        .getByRole("button", { name: "Change To", exact: true })
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
        "Change destination must not focus origin",
      );
      await destinationInput.fill("Uncommitted destination");
      await page
        .getByRole("button", { name: "Cancel To", exact: true })
        .click();
      assert.equal(
        await page.getByText("Gallery", { exact: true }).count(),
        1,
        "Cancel preserves the destination too",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Change To", exact: true })
          .evaluate((n) => n === document.activeElement),
        true,
      );
      await page
        .getByRole("button", { name: "Change To", exact: true })
        .press("Enter");
      await destinationInput.fill("Gallery");
      await destinationInput.press("ArrowDown");
      await destinationInput.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Change To",
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
