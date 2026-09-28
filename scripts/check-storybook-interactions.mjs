import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

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

        // Decision 22: the AI chat's spoken conversation, from the keyboard.
        // The name says what a press does, one polite region says what
        // changed, and focus stays on the microphone throughout. The story
        // plays the product: connected 1.5s after the press. Everything the
        // region comes to hold is recorded as it happens, so the check reads
        // the whole sequence, not whatever is there when it looks.
        await visit("product-sdk-aiinputbar--voice-conversation");
        const voiceRegion = page.locator(
          '.kozmos-story-surface [role="status"]',
        );
        const voiceSaid = () =>
          voiceRegion.evaluate((n) => n.kozmosSaid ?? null);
        const startVoice = page.getByRole("button", {
          name: "Start voice conversation",
        });
        const endVoice = page.getByRole("button", {
          name: "End voice conversation",
        });
        assert.equal(
          await startVoice.count(),
          1,
          "a product that can start a conversation gets a microphone",
        );
        assert.equal(await voiceRegion.count(), 1, "one region speaks for it");
        assert.equal(await voiceRegion.getAttribute("aria-live"), "polite");
        assert.equal(
          await voiceRegion.evaluate((n) => n.textContent),
          "",
          "nothing is said as it first draws",
        );
        await voiceRegion.evaluate((n) => {
          n.kozmosSaid = [];
          new MutationObserver(() => n.kozmosSaid.push(n.textContent)).observe(
            n,
            { characterData: true, childList: true, subtree: true },
          );
        });
        await startVoice.focus();
        await page.keyboard.press("Enter");
        await endVoice.waitFor();
        await page.waitForFunction(
          () =>
            document.querySelector('.kozmos-story-surface [role="status"]')
              ?.textContent === "Listening…",
        );
        assert.deepEqual(
          await voiceSaid(),
          ["Connecting…", "Listening…"],
          "each state is said once, as it comes",
        );
        assert(
          await endVoice.evaluate((n) => n === document.activeElement),
          "focus stays on the microphone as the conversation starts",
        );
        assert.equal(
          await endVoice.getAttribute("aria-pressed"),
          null,
          "a name that says the action carries no pressed state",
        );
        assert.equal(
          await page
            .getByRole("textbox", { name: "Ask the assistant" })
            .getAttribute("placeholder"),
          "Listening…",
        );
        await audit();
        await page.keyboard.press("Space");
        await startVoice.waitFor();
        await page.waitForFunction(
          () =>
            document.querySelector('.kozmos-story-surface [role="status"]')
              ?.textContent === "Voice conversation ended",
        );
        assert.deepEqual(await voiceSaid(), [
          "Connecting…",
          "Listening…",
          "Voice conversation ended",
        ]);
        assert(
          await startVoice.evaluate((n) => n === document.activeElement),
          "focus stays on the microphone as the conversation ends",
        );
        await audit();
        console.log(`PASS AIInputBar voice ${theme} ${viewport.width}`);

        await visit("product-sdk-aiinputbar--voice-unavailable");
        const unavailableVoice = page.getByRole("button", {
          name: "Voice conversation unavailable",
        });
        assert.equal(
          await unavailableVoice.count(),
          1,
          "an unavailable microphone is still there to be found",
        );
        assert.equal(
          await unavailableVoice.getAttribute("aria-disabled"),
          "true",
        );
        await unavailableVoice.focus();
        assert(
          await unavailableVoice.evaluate((n) => n === document.activeElement),
          "an unavailable microphone keeps its place in the tab order",
        );
        await audit();
        console.log(
          `PASS AIInputBar voice unavailable ${theme} ${viewport.width}`,
        );

        // Row 79: the floor switcher grows from a map-control tile into a
        // column of levels, says so, and hands focus back to the tile on
        // Escape and on a tap outside — checked in each engine, because
        // clicking is where they differ on focus (WebKit does not focus a
        // button it clicks).
        await visit("product-sdk-floorselector--collapsible");
        // Scoped to its group: open, the column has a "First floor" too.
        const floorTile = page
          .getByRole("group", { name: "Floor selector" })
          .getByRole("button", { name: "First floor" });
        for (const close of ["Escape", "a tap outside"]) {
          await floorTile.click();
          const floorList = page.getByRole("dialog", {
            name: "Floor selector",
          });
          await floorList.waitFor();
          assert.equal(
            await floorTile.getAttribute("aria-expanded"),
            "true",
            "the floor tile says its column is open",
          );
          await page.waitForFunction(
            () =>
              document.activeElement?.getAttribute("aria-pressed") === "true",
          );
          assert.deepEqual(
            await floorList.evaluate((n) => ({
              theme: n
                .closest("[data-kozmos-portal]")
                ?.getAttribute("data-theme"),
              focused: document.activeElement?.getAttribute("aria-label"),
            })),
            { theme, focused: "First floor" },
            "the floor column opens in the themed portal, on the current level",
          );
          // The tile grows into the column: its bottom level lies exactly
          // over the tile — measured once the popover has finished zooming
          // in from 95%.
          await floorList.evaluate((n) =>
            Promise.all(n.getAnimations().map((a) => a.finished)),
          );
          const tileBox = await floorTile.boundingBox();
          const bottomBox = await floorList
            .getByRole("button")
            .last()
            .boundingBox();
          for (const edge of ["x", "y", "width", "height"]) {
            assert(
              Math.abs(bottomBox[edge] - tileBox[edge]) <= 1,
              `the column's bottom level is not over the tile (${edge}: ${bottomBox[edge]} against ${tileBox[edge]})`,
            );
          }
          // Also gives Radix the moment it takes to listen for Escape and for
          // a press outside after the column opens.
          await audit();
          if (close === "Escape") await page.keyboard.press("Escape");
          else await page.mouse.click(2, 2);
          await floorList.waitFor({ state: "detached" });
          await page.waitForFunction(
            (n) => n === document.activeElement,
            await floorTile.elementHandle(),
          );
          assert.equal(await floorTile.getAttribute("aria-expanded"), "false");
        }
        // Parked at the top of the map, with no room above the tile, the
        // column grows down instead: its top level lies over the tile, as on
        // iOS and Android.
        await floorTile.evaluate((n) => {
          const group = n.closest('[role="group"]');
          group.style.position = "fixed";
          group.style.top = "16px";
          group.style.right = "16px";
        });
        await floorTile.click();
        const downList = page.getByRole("dialog", { name: "Floor selector" });
        await downList.waitFor();
        await downList.evaluate((n) =>
          Promise.all(n.getAnimations().map((a) => a.finished)),
        );
        const highTile = await floorTile.boundingBox();
        const topBox = await downList.getByRole("button").first().boundingBox();
        for (const edge of ["x", "y", "width", "height"]) {
          assert(
            Math.abs(topBox[edge] - highTile[edge]) <= 1,
            `parked at the top, the column's top level is not over the tile (${edge}: ${topBox[edge]} against ${highTile[edge]})`,
          );
        }
        // The visitor's dot and a result count on one level (decision 38):
        // one at the top trailing corner, one at the bottom, neither over the
        // other, in the level's own box.
        await visit("product-sdk-floorselector--collapsible-open");
        const theirLevel = page.getByRole("dialog").getByRole("button", {
          name: "Second floor, your level, 3 results",
        });
        await theirLevel.waitFor();
        await theirLevel.evaluate((n) =>
          Promise.all(
            n
              .closest("[role=dialog]")
              .getAnimations()
              .map((a) => a.finished),
          ),
        );
        const marks = await theirLevel.evaluate((n) => {
          const box = (el) => {
            const r = el.getBoundingClientRect();
            return { l: r.left, t: r.top, r: r.right, b: r.bottom };
          };
          return {
            level: box(n),
            dot: box(n.querySelector("[data-floor-selector-user-level]")),
            count: box(n.querySelector("[data-floor-selector-result-count]")),
          };
        });
        const inside = (a, b) =>
          a.l >= b.l - 0.5 &&
          a.r <= b.r + 0.5 &&
          a.t >= b.t - 0.5 &&
          a.b <= b.b + 0.5;
        assert(inside(marks.dot, marks.level), "the dot is outside its level");
        assert(
          inside(marks.count, marks.level),
          "the count is outside its level",
        );
        assert(
          marks.dot.b <= marks.count.t || marks.count.b <= marks.dot.t,
          `the dot and the count overlap: ${JSON.stringify(marks)}`,
        );
        await audit();
        console.log(`PASS floor switcher ${theme} ${viewport.width}`);
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
