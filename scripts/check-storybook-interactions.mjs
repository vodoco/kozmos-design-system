import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const failures = [];

/**
 * Every rail tile in the story, measured where it is drawn: the label's type,
 * the lines it takes (a clamped line still counts: it is cut), the widest
 * reach of each line, and the tile's content box. A line is the characters
 * that share a top; whitespace is skipped, so a space hanging at a wrap does
 * not widen a line.
 */
function measureRailTiles() {
  return [
    ...document.querySelectorAll(
      '.kozmos-story-surface [data-placement="rail"]',
    ),
  ].map((tile) => {
    const label = [...tile.children].find(
      (child) => child.tagName === "SPAN" && !child.hasAttribute("aria-hidden"),
    );
    const style = getComputedStyle(tile);
    const box = tile.getBoundingClientRect();
    const contentLeft =
      box.left + tile.clientLeft + parseFloat(style.paddingLeft);
    const contentRight =
      box.left +
      tile.clientLeft +
      tile.clientWidth -
      parseFloat(style.paddingRight);
    const lines = [];
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text.data[i])) continue;
        const range = document.createRange();
        range.setStart(text, i);
        range.setEnd(text, i + 1);
        for (const rect of range.getClientRects()) {
          if (!rect.width) continue;
          let line = lines.find((l) => Math.abs(l.top - rect.top) < 4);
          if (!line) {
            line = { top: rect.top, left: rect.left, right: rect.right };
            lines.push(line);
          }
          line.left = Math.min(line.left, rect.left);
          line.right = Math.max(line.right, rect.right);
        }
      }
    }
    const labelStyle = getComputedStyle(label);
    return {
      label: label.textContent,
      fontSize: labelStyle.fontSize,
      lineHeight: labelStyle.lineHeight,
      lines: lines
        .sort((a, b) => a.top - b.top)
        .map((l) => ({ left: l.left, right: l.right })),
      contentLeft,
      contentRight,
      width: box.width,
      height: box.height,
    };
  });
}

/**
 * Decision 36 (row 25 / GAP-013): every rail label is 11px on a 14px line and
 * takes at most two lines, none wider than its tile's content box, and every
 * tile stays 72px tall, a two-line one too (the 16px line made it 76).
 */
function railProblems(id, tiles) {
  const problems = [];
  for (const tile of tiles) {
    const name = `${id} "${tile.label}"`;
    if (tile.fontSize !== "11px" || tile.lineHeight !== "14px")
      problems.push(
        `${name}: the label is ${tile.fontSize} on ${tile.lineHeight}, not 11px on 14px`,
      );
    if (tile.lines.length < 1 || tile.lines.length > 2)
      problems.push(`${name}: the label takes ${tile.lines.length} lines`);
    tile.lines.forEach((line, index) => {
      if (
        line.left < tile.contentLeft - 0.5 ||
        line.right > tile.contentRight + 0.5
      )
        problems.push(
          `${name}: line ${index + 1} is ${(line.right - line.left).toFixed(1)}px wide in a ${(tile.contentRight - tile.contentLeft).toFixed(1)}px content box`,
        );
    });
    if (Math.abs(tile.height - 72) > 0.5)
      problems.push(
        `${name}: a ${tile.lines.length}-line tile is ${tile.height.toFixed(1)}px tall, not 72`,
      );
  }
  return problems;
}
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
        // The standard rail, whose "Nearby places" takes two lines, and a web
        // dashboard's, whose nine labels are the Cloud Dashboard's in 96px
        // tiles (className "w-24"). Both are measured before either is
        // judged, so a failure lists every tile that is wrong.
        const rails = [];
        for (const [id, count, width] of [
          ["navigation-navigationitem--rail", 4, 72],
          ["navigation-navigationitem--dashboard-rail", 9, 96],
        ]) {
          await visit(id);
          await page.evaluate(() => document.fonts.ready);
          const tiles = await page.evaluate(measureRailTiles);
          const widths = tiles.map((tile) => Math.round(tile.width));
          if (widths.join() !== Array(count).fill(width).join())
            rails.push(`${id}: tiles ${widths} wide, not ${count} of ${width}`);
          if (!tiles.some((tile) => tile.lines.length === 2))
            rails.push(`${id}: no tile takes two lines`);
          rails.push(...railProblems(id, tiles));
          await audit();
        }
        assert.deepEqual(rails, []);
        console.log(`PASS rail labels ${theme} ${viewport.width}`);
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
