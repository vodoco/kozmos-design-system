import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const failures = [];
try {
  for (const theme of ["light", "dark"]) {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 568, height: 320 },
      { width: 1280, height: 800 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      async function visit(id) {
        await page.goto(
          `${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        await page.locator(".kozmos-story-surface > *").first().waitFor();
      }
      async function audit() {
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            document
              .getAnimations()
              .filter((a) => a.effect?.getTiming().iterations !== Infinity)
              .map((a) => a.finished.catch(() => {})),
          );
        });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "page overflows horizontally",
        );
        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.failureSummary),
          })),
          [],
        );
        assert.deepEqual(pageErrors, []);
        return incomplete;
      }
      try {
        await visit("components-select--default");
        await page.getByRole("combobox", { name: "Fruit" }).click();
        const popup = page.getByRole("listbox");
        await popup.waitFor();
        assert.deepEqual(
          await popup.evaluate((node) => ({
            owned: !!node.closest("[data-kozmos-portal]"),
            theme: node.closest("[data-theme]")?.getAttribute("data-theme"),
            styled: !["rgba(0, 0, 0, 0)", "transparent"].includes(
              getComputedStyle(node).backgroundColor,
            ),
          })),
          { owned: true, theme, styled: true },
          "source stories and public-import decorators must share a themed portal context",
        );
        await audit();
        await page.keyboard.press("Escape");
        console.log(
          `PASS owned themed Select portal ${theme} ${viewport.width}`,
        );
        for (const [id, trigger, role] of [
          ["components-dialog--default", "Edit Profile", "dialog"],
          ["overlay-popover--default", "Open popover", "dialog"],
        ]) {
          await visit(id);
          await page
            .getByRole("button", { name: trigger, exact: true })
            .click();
          const content = page.getByRole(role);
          await content.waitFor();
          assert.equal(
            await content.evaluate((n) =>
              n.closest("[data-kozmos-portal]")?.getAttribute("data-theme"),
            ),
            theme,
            `${id}: shared themed portal`,
          );
          await audit();
          await page.keyboard.press("Escape");
          console.log(`PASS owned themed ${id} ${theme} ${viewport.width}`);
        }
        for (const [id, selector] of [
          [
            "components-scrollarea--horizontal-quick-access",
            ".overflow-x-auto",
          ],
          ["data-display-metastrip--default", "[data-slot=meta-strip]"],
          ["data-display-table--default", ".overflow-auto"],
          ["product-sdk-poimediagallery--default", "ul"],
        ]) {
          await visit(id);
          const scroller = page
            .locator(`.kozmos-story-surface ${selector}`)
            .first();
          assert.equal(
            await scroller.getAttribute("tabindex"),
            "0",
            `${id}: keyboard entry point`,
          );
          await scroller.focus();
          assert(
            await scroller.evaluate((n) => n === document.activeElement),
            `${id}: focusable viewport`,
          );
          if (
            await scroller.evaluate((n) => n.scrollWidth > n.clientWidth + 1)
          ) {
            await page.keyboard.press("ArrowRight");
            await page.waitForFunction(
              (el) => el.scrollLeft > 0,
              await scroller.elementHandle(),
            );
          }
          await audit();
          console.log(`PASS keyboard scroll ${id} ${theme} ${viewport.width}`);
        }
        await visit("selection-segmentedcontrol--default");
        const segments = page.getByRole("radio");
        // Radix single-selection ToggleGroup uses radio semantics.
        await segments.first().focus();
        await page.keyboard.press("End");
        await page.waitForFunction(
          (n) => n === document.activeElement,
          await segments.last().elementHandle(),
        );
        assert(
          await segments.last().evaluate((n) => n === document.activeElement),
          "End reaches the final segment",
        );
        await page.waitForFunction(
          (n) => {
            const r = n.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth;
          },
          await segments.last().elementHandle(),
        );
        await audit();
        console.log(`PASS segmented keyboard ${theme} ${viewport.width}`);

        await visit("components-colorpicker--default");
        await page.getByRole("button", { name: "Show color picker" }).click();
        await page.getByRole("slider", { name: "Hue", exact: true }).waitFor();
        await audit();
        await page.getByRole("button", { name: "Hide color picker" }).click();
        assert.equal(
          await page.getByRole("textbox").first().getAttribute("aria-expanded"),
          null,
        );
        console.log(`PASS expanded ColorPicker ${theme} ${viewport.width}`);

        // Decision 16: the assistant takes focus when the visitor opens it,
        // and not when it is on screen from the start. Opened from the
        // keyboard: WebKit on macOS does not focus a button that is clicked,
        // so a click would leave the page, not the button, to hand back to.
        await visit("product-sdk-aicompanionpanel--conversation");
        await page.getByRole("region", { name: "Assistant" }).waitFor();
        await settleLayout(page);
        assert.equal(
          await page.evaluate(() => document.activeElement?.tagName),
          "BODY",
          "a panel on screen from the start leaves focus where it was",
        );
        await visit("product-sdk-aicompanionpanel--open-and-close");
        const ask = page.getByRole("button", { name: "AI search" });
        const assistant = page.getByRole("region", { name: "Assistant" });
        await ask.focus();
        await page.keyboard.press("Enter");
        await assistant.waitFor();
        await settleLayout(page);
        assert(
          await assistant.evaluate((n) => n === document.activeElement),
          "opening the panel moves focus into it",
        );
        await audit();
        await page.keyboard.press("Escape");
        await assistant.waitFor({ state: "detached" });
        await settleLayout(page);
        assert(
          await ask.evaluate((n) => n === document.activeElement),
          "closing the panel hands focus back to the button that opened it",
        );
        console.log(`PASS AICompanionPanel focus ${theme} ${viewport.width}`);
        for (const id of [
          "product-sdk-routepreviewpanel--ready",
          "system-themeprovider--default",
        ]) {
          await visit(id);
          assert.deepEqual(
            (await audit()).filter(
              (finding) => finding.id === "color-contrast",
            ),
            [],
            `${id}: no unmeasurable/invisible text may hide in axe incomplete results`,
          );
          console.log(
            `PASS explicit contrast completeness ${id} ${theme} ${viewport.width}`,
          );
        }
        if (viewport.width === 1280) {
          await visit("data-display-chip--variants");
          const chips = page.locator(
            '[data-slot="chip"]:not([aria-disabled="true"])',
          );
          assert.equal(await chips.count(), 5);
          for (const chip of await chips.all()) {
            await chip.hover();
            await audit();
          }
          console.log(`PASS all five enabled Chip hover treatments ${theme}`);
          await visit("components-button--emotions");
          const buttons = page.getByRole("button");
          assert.equal(await buttons.count(), 18);
          for (const button of await buttons.all()) {
            await button.hover();
            await audit();
          }
          console.log(`PASS all 18 emotion hover treatments ${theme}`);
        }
      } catch (error) {
        failures.push(
          `${theme} ${viewport.width}x${viewport.height}: ${error.stack}`,
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, []);
console.log("Storybook interaction regressions passed");
