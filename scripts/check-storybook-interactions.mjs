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
 * Every rail item in the story, measured where it is drawn: its box against
 * the rail it sits in, its padding and gap, its icon, its label's type, the
 * lines the label takes (a clamped line still counts: it is cut) and the line
 * each word sits on, its colours, and the selected item's bar. A line is the
 * characters that share a top; whitespace is skipped, so a space hanging at a
 * wrap does not widen a line. The tokens it is held to are resolved in the
 * same Kozmos root, in the theme the story is drawn in.
 */
function measureRailTiles() {
  // A token as it resolves inside `root`, as a computed colour.
  const resolve = (root, token, property = "color") => {
    const probe = document.createElement("span");
    probe.style[property] = `var(${token})`;
    root.append(probe);
    const value = getComputedStyle(probe)[property];
    probe.remove();
    return value;
  };
  return [
    ...document.querySelectorAll(
      '.kozmos-story-surface [data-placement="rail"]',
    ),
  ].map((tile) => {
    const root = tile.closest("[data-kozmos-root]");
    const children = [...tile.children];
    const label = children.find(
      (child) => child.tagName === "SPAN" && !child.hasAttribute("aria-hidden"),
    );
    const icon = children.find(
      (child) => child.hasAttribute("aria-hidden") && !child.dataset.slot,
    );
    const bar = tile.querySelector('[data-slot="navigation-item-indicator"]');
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
    const words = [];
    let word = null;
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text.data[i])) {
          word = null;
          continue;
        }
        if (!word) {
          word = { text: "", lines: new Set() };
          words.push(word);
        }
        word.text += text.data[i];
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
          word.lines.add(line);
        }
      }
    }
    const labelStyle = getComputedStyle(label);
    const barBox = bar?.getBoundingClientRect();
    return {
      label: label.textContent,
      dir: style.direction,
      selected: tile.hasAttribute("data-selected"),
      width: box.width,
      height: box.height,
      top: box.top,
      left: box.left,
      right: box.right,
      // The rail: Sidebar's, or the story's own <nav>. It is 96px with its
      // 1px edge, as the Cloud Dashboard's is, so an item fills the 95 inside.
      rail: (() => {
        const rail =
          tile.closest('[data-slot="sidebar"]') ?? tile.closest("nav");
        const railStyle = getComputedStyle(rail);
        return {
          width: rail.getBoundingClientRect().width,
          inside:
            rail.clientWidth -
            parseFloat(railStyle.paddingLeft) -
            parseFloat(railStyle.paddingRight),
        };
      })(),
      padding: [
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
      ].join(" "),
      gap: style.rowGap,
      iconHeight: icon ? icon.getBoundingClientRect().height : null,
      fontSize: labelStyle.fontSize,
      lineHeight: labelStyle.lineHeight,
      fontWeight: labelStyle.fontWeight,
      lines: lines
        .sort((a, b) => a.top - b.top)
        .map((l) => ({ left: l.left, right: l.right })),
      splitWords: words.filter((w) => w.lines.size > 1).map((w) => w.text),
      contentLeft,
      contentRight,
      color: style.color,
      background: style.backgroundColor,
      bar: bar
        ? {
            top: barBox.top,
            left: barBox.left,
            right: barBox.right,
            width: barBox.width,
            height: barBox.height,
            background: getComputedStyle(bar).backgroundColor,
          }
        : null,
      tokens: {
        tint: resolve(root, "--primitives-colors-theme-0", "backgroundColor"),
        primary: resolve(root, "--primitives-colors-theme-600"),
        muted: resolve(root, "--primitives-colors-foreground-400"),
      },
    };
  });
}

/**
 * Decision 42: a rail is 96px, its 1px edge included, and an item fills it;
 * it is padded 16px by 8px, its 24px icon sits 6px above an 11px label on 14px
 * lines at regular weight, and it grows with its label, up to two lines (62px
 * and 14 a line: 76, or 90 with two). No label is cut and no word splits
 * across lines. At rest it is the muted foreground; selected, it is primary on
 * theme/0's tint with a 2px primary bar along its inline-end edge, right in
 * LTR and left in RTL.
 */
function railProblems(id, tiles) {
  const problems = [];
  for (const tile of tiles) {
    const fail = (what) => problems.push(`${id} "${tile.label}": ${what}`);
    if (Math.abs(tile.rail.width - 96) > 0.5)
      fail(`its rail is ${tile.rail.width.toFixed(1)}px wide, not 96`);
    if (Math.abs(tile.width - tile.rail.inside) > 0.5)
      fail(
        `the item is ${tile.width.toFixed(1)}px wide, not filling the ${tile.rail.inside.toFixed(1)}px inside its rail`,
      );
    if (tile.padding !== "16px 8px 16px 8px")
      fail(`the padding is ${tile.padding}, not 16px 8px`);
    if (tile.gap !== "6px")
      fail(`the icon is ${tile.gap} above the label, not 6px`);
    if (tile.iconHeight !== 24)
      fail(`the icon is ${tile.iconHeight}px, not 24`);
    if (
      tile.fontSize !== "11px" ||
      tile.lineHeight !== "14px" ||
      tile.fontWeight !== "400"
    )
      fail(
        `the label is ${tile.fontSize} on ${tile.lineHeight} at weight ${tile.fontWeight}, not 11px on 14px regular`,
      );
    if (tile.lines.length < 1 || tile.lines.length > 2)
      fail(`the label takes ${tile.lines.length} lines`);
    tile.lines.forEach((line, index) => {
      if (
        line.left < tile.contentLeft - 0.5 ||
        line.right > tile.contentRight + 0.5
      )
        fail(
          `line ${index + 1} is ${(line.right - line.left).toFixed(1)}px wide in a ${(tile.contentRight - tile.contentLeft).toFixed(1)}px content box`,
        );
    });
    if (tile.splitWords.length)
      fail(`splits ${tile.splitWords.map((w) => `"${w}"`).join(", ")}`);
    const height = 16 + 24 + 6 + 14 * tile.lines.length + 16;
    if (Math.abs(tile.height - height) > 0.5)
      fail(
        `a ${tile.lines.length}-line item is ${tile.height.toFixed(1)}px tall, not ${height}`,
      );
    if (tile.selected) {
      if (tile.background !== tile.tokens.tint)
        fail(
          `the selected fill is ${tile.background}, not theme/0 ${tile.tokens.tint}`,
        );
      if (tile.color !== tile.tokens.primary)
        fail(
          `the selected label is ${tile.color}, not primary ${tile.tokens.primary}`,
        );
      const side = tile.dir === "rtl" ? "left" : "right";
      if (!tile.bar) fail(`the selected item has no bar on its ${side}`);
      else {
        const offEdge =
          side === "left"
            ? Math.abs(tile.bar.left - tile.left)
            : Math.abs(tile.bar.right - tile.right);
        if (
          Math.abs(tile.bar.width - 2) > 0.1 ||
          Math.abs(tile.bar.height - tile.height) > 0.5 ||
          Math.abs(tile.bar.top - tile.top) > 0.5 ||
          offEdge > 0.5
        )
          fail(
            `the bar is ${tile.bar.width.toFixed(1)} by ${tile.bar.height.toFixed(1)}px at ${tile.bar.left.toFixed(1)}–${tile.bar.right.toFixed(1)}, not 2px down the ${side} edge of ${tile.left.toFixed(1)}–${tile.right.toFixed(1)}`,
          );
        if (tile.bar.background !== tile.tokens.primary)
          fail(
            `the bar is ${tile.bar.background}, not primary ${tile.tokens.primary}`,
          );
      }
    } else {
      if (tile.color !== tile.tokens.muted)
        fail(
          `at rest the label is ${tile.color}, not the muted foreground ${tile.tokens.muted}`,
        );
      if (tile.background !== "rgba(0, 0, 0, 0)")
        fail(`at rest it has a ${tile.background} fill`);
      if (tile.bar) fail("an item at rest has a bar");
    }
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
        // Decision 38's board, on the open column's levels: at rest a level
        // is the page's ink with no outline; hovered, a light primary
        // outline (the theme's primary at 40%) and primary words; pressed,
        // the full primary outline; the current level is outlined in the
        // primary at rest. Nothing measured these states (the night audit's
        // X5): a level that lost its hover outline, or drew the pressed one
        // on hover, passed. Read once each transition has finished, the
        // tokens resolved in the column's own themed portal.
        const column = page.getByRole("dialog", { name: "Floor selector" });
        const levelLook = (name) =>
          column
            .getByRole("button", { name, exact: true })
            .evaluate(async (level) => {
              await Promise.all(level.getAnimations().map((a) => a.finished));
              const host =
                level.closest("[data-kozmos-portal]") ??
                level.closest("[data-kozmos-root]");
              const resolve = (token) => {
                const probe = document.createElement("span");
                probe.style.color = `var(${token})`;
                host.append(probe);
                const value = getComputedStyle(probe).color;
                probe.remove();
                return value;
              };
              const s = getComputedStyle(level);
              return {
                outline: s.borderTopColor,
                width: s.borderTopWidth,
                words: s.color,
                primary: resolve("--primitives-colors-theme-600"),
                ink: resolve("--primitives-colors-foreground-0"),
              };
            });
        // rgb()/rgba() or color(srgb …), as each engine writes a computed
        // colour, in 0–255 channels and an alpha.
        const channelsOf = (css) => {
          const srgb = css.match(
            /^color\(srgb ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)(?: \/ ([\d.e+-]+))?\)$/,
          );
          if (srgb)
            return [
              ...srgb.slice(1, 4).map((v) => Number(v) * 255),
              srgb[4] === undefined ? 1 : Number(srgb[4]),
            ];
          const rgb = css.match(
            /^rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)$/,
          );
          assert(rgb, `a colour this check cannot read: ${css}`);
          return [
            ...rgb.slice(1, 4).map(Number),
            rgb[4] === undefined ? 1 : Number(rgb[4]),
          ];
        };
        const sameColour = (css, want, alpha = 1) => {
          const [r, g, b, a] = channelsOf(css);
          const [wr, wg, wb] = channelsOf(want);
          return (
            Math.max(Math.abs(r - wr), Math.abs(g - wg), Math.abs(b - wb)) <=
              2 && Math.abs(a - alpha) <= 0.02
          );
        };
        const level = column.getByRole("button", {
          name: "Third floor",
          exact: true,
        });
        await page.mouse.move(1, 1);
        const atRest = await levelLook("Third floor");
        await level.hover();
        const hovered = await levelLook("Third floor");
        await page.mouse.down();
        const pressed = await levelLook("Third floor");
        // Let go on the column's own inset, off every level, so no level is
        // chosen and the column stays open.
        const columnBox = await column.boundingBox();
        await page.mouse.move(columnBox.x + 1, columnBox.y + 1);
        await page.mouse.up();
        await page.mouse.move(1, 1);
        const current = await levelLook("First floor");
        const looks = { atRest, hovered, pressed, current };
        assert.equal(
          await column.count(),
          1,
          `pressing a level and letting go off it closed the column: ${JSON.stringify(looks)}`,
        );
        assert(
          atRest.width === "1px" &&
            channelsOf(atRest.outline)[3] === 0 &&
            sameColour(atRest.words, atRest.ink),
          `a level at rest is not the ink with no outline: ${JSON.stringify(atRest)}`,
        );
        assert(
          sameColour(hovered.outline, hovered.primary, 0.4) &&
            sameColour(hovered.words, hovered.primary),
          `a hovered level is not outlined in the primary at 40% with primary words: ${JSON.stringify(hovered)}`,
        );
        assert(
          sameColour(pressed.outline, pressed.primary) &&
            sameColour(pressed.words, pressed.primary),
          `a pressed level is not outlined in the full primary with primary words: ${JSON.stringify(pressed)}`,
        );
        assert(
          sameColour(current.outline, current.primary) &&
            sameColour(current.words, current.primary),
          `the current level is not outlined in the primary: ${JSON.stringify(current)}`,
        );
        console.log(
          `PASS floor switcher levels ${theme} ${viewport.width}: at rest ${atRest.outline} on ${atRest.words}, hovered ${hovered.outline}, pressed ${pressed.outline}, current ${current.outline}`,
        );
        // Decision 40: the tile is the map's own control, so it draws the
        // map-control surface as the compass beside the zoom pair does — at
        // rest, hovered and pressed, nothing restyled. The open column wears
        // the same surface: the page's own, the map controls' elevation and
        // blur, no edge, and the tile's corner grown by the column's inset,
        // so the levels' corners stay concentric with it.
        const surfaceKeys = [
          "backgroundColor",
          "color",
          "boxShadow",
          "borderTopWidth",
          "borderTopLeftRadius",
          "backdropFilter",
          "width",
          "height",
          "transform",
        ];
        const surfaceOf = (locator) =>
          locator.evaluate(async (node, keys) => {
            await Promise.all(node.getAnimations().map((a) => a.finished));
            const s = getComputedStyle(node);
            return Object.fromEntries(
              [...keys, "paddingTop"].map((key) => [key, s[key]]),
            );
          }, surfaceKeys);
        const surfaceStates = async (locator) => {
          await page.mouse.move(1, 1);
          const rest = await surfaceOf(locator);
          await locator.hover();
          const hover = await surfaceOf(locator);
          await page.mouse.down();
          const pressed = await surfaceOf(locator);
          await page.mouse.up();
          await page.mouse.move(1, 1);
          return { rest, hover, pressed };
        };
        await visit("map-mapcontrolsgroup--default");
        const compass = await surfaceStates(
          page.getByRole("button", { name: "Reset bearing" }),
        );
        await visit("product-sdk-floorselector--collapsible");
        const surfaceTile = page
          .getByRole("group", { name: "Floor selector" })
          .getByRole("button", { name: "First floor" });
        // Pressing the tile, then letting go, opens its column.
        const tileSurface = await surfaceStates(surfaceTile);
        assert.deepEqual(
          tileSurface,
          compass,
          "the floor tile is not drawn as a map control is, at rest, hovered and pressed",
        );
        const surfaceColumn = page.getByRole("dialog", {
          name: "Floor selector",
        });
        await surfaceColumn.waitFor();
        const columnSurface = await surfaceOf(surfaceColumn);
        for (const key of ["backgroundColor", "boxShadow", "backdropFilter"]) {
          assert.equal(
            columnSurface[key],
            tileSurface.rest[key],
            `the floor column's ${key} is not the map control's`,
          );
        }
        assert.equal(
          columnSurface.borderTopWidth,
          "0px",
          "the floor column draws an edge",
        );
        assert.equal(
          parseFloat(columnSurface.borderTopLeftRadius),
          parseFloat(tileSurface.rest.borderTopLeftRadius) +
            parseFloat(columnSurface.paddingTop),
          "the floor column's corner is not the map control's grown by its inset",
        );
        await page.keyboard.press("Escape");
        await surfaceColumn.waitFor({ state: "detached" });
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
        // The rails (decision 42): the standard one, whose "Accessible routes"
        // takes two lines; the same right to left, whose bar is on the left;
        // the Cloud Dashboard's nine labels; and Sidebar's rail, Kozmos's own
        // rail container. Every story is measured before any is judged, so a
        // failure lists every item that is wrong.
        const rails = [];
        for (const [id, count, dir, twoLines] of [
          ["navigation-navigationitem--rail", 5, "ltr", true],
          ["navigation-navigationitem--rail-right-to-left", 5, "rtl", true],
          ["navigation-navigationitem--dashboard-rail", 9, "ltr", true],
          ["navigation-sidebar--rail", 5, "ltr", false],
        ]) {
          await visit(id);
          await page.evaluate(() => document.fonts.ready);
          const tiles = await page.evaluate(measureRailTiles);
          if (tiles.length !== count)
            rails.push(`${id}: ${tiles.length} rail items, not ${count}`);
          if (tiles.some((tile) => tile.dir !== dir))
            rails.push(`${id}: not all ${dir}`);
          if (twoLines && !tiles.some((tile) => tile.lines.length === 2))
            rails.push(`${id}: no item takes two lines`);
          if (tiles.filter((tile) => tile.selected).length !== 1)
            rails.push(`${id}: not one selected item`);
          rails.push(...railProblems(id, tiles));
          if (id === "navigation-sidebar--rail")
            rails.push(
              ...(await page.evaluate(() => {
                // The rail itself: 96px, on the surface, with a 1px edge in
                // the border role at its inline end and none at its start.
                const aside = document.querySelector(
                  '.kozmos-story-surface [data-slot="sidebar"]',
                );
                const root = aside.closest("[data-kozmos-root]");
                const resolve = (token, property) => {
                  const probe = document.createElement("span");
                  probe.style[property] = `var(${token})`;
                  root.append(probe);
                  const value = getComputedStyle(probe)[property];
                  probe.remove();
                  return value;
                };
                const s = getComputedStyle(aside);
                const found = [];
                const width = aside.getBoundingClientRect().width;
                if (Math.abs(width - 96) > 0.5)
                  found.push(`the Sidebar rail is ${width}px wide, not 96`);
                const surface = resolve(
                  "--semantics-surface-0",
                  "backgroundColor",
                );
                if (s.backgroundColor !== surface)
                  found.push(
                    `the Sidebar rail is ${s.backgroundColor}, not the surface ${surface}`,
                  );
                const edge = resolve("--semantics-border-subtle", "color");
                if (
                  s.borderRightWidth !== "1px" ||
                  s.borderRightStyle !== "solid" ||
                  s.borderRightColor !== edge ||
                  s.borderLeftWidth !== "0px"
                )
                  found.push(
                    `the Sidebar rail's edges are ${s.borderLeftWidth} left and ${s.borderRightWidth} ${s.borderRightStyle} ${s.borderRightColor} right, not 1px of the border role ${edge} at its inline end`,
                  );
                return found;
              })),
            );
          await audit();
        }
        // BottomNavigation keeps its own items (decision 42): they share the
        // bar, 6px in from their edges, and a selected one is the muted fill
        // with no bar. Their labels stay 11px on 14px lines.
        await visit("navigation-bottomnavigation--default");
        rails.push(
          ...(await page.evaluate(() => {
            const nav = document.querySelector(
              '.kozmos-story-surface [data-slot="bottom-navigation"]',
            );
            const root = nav.closest("[data-kozmos-root]");
            const probe = document.createElement("span");
            probe.style.backgroundColor =
              "var(--primitives-colors-background-100)";
            root.append(probe);
            const mutedFill = getComputedStyle(probe).backgroundColor;
            probe.remove();
            const found = [];
            const items = [...nav.children];
            const widths = items.map(
              (item) => item.getBoundingClientRect().width,
            );
            if (
              items.length !== 3 ||
              Math.max(...widths) - Math.min(...widths) > 1 ||
              widths.some((width) => Math.abs(width - 96) < 1)
            )
              found.push(
                `BottomNavigation's items are ${widths.map((w) => w.toFixed(1))} wide, not three equal shares of the bar`,
              );
            for (const item of items) {
              const s = getComputedStyle(item);
              const label = [...item.children].find(
                (child) =>
                  child.tagName === "SPAN" &&
                  !child.hasAttribute("aria-hidden"),
              );
              const l = getComputedStyle(label);
              const name = `BottomNavigation "${label.textContent}"`;
              const padding = [
                s.paddingTop,
                s.paddingRight,
                s.paddingBottom,
                s.paddingLeft,
              ].join(" ");
              if (padding !== "6px 6px 6px 6px")
                found.push(`${name}: the padding is ${padding}, not 6px`);
              if (item.hasAttribute("data-placement"))
                found.push(`${name}: it is a ${item.dataset.placement} item`);
              if (item.querySelector('[data-slot="navigation-item-indicator"]'))
                found.push(`${name}: it has the rail's bar`);
              if (l.fontSize !== "11px" || l.lineHeight !== "14px")
                found.push(
                  `${name}: the label is ${l.fontSize} on ${l.lineHeight}, not 11px on 14px`,
                );
              if (
                item.getAttribute("aria-current") === "page" &&
                s.backgroundColor !== mutedFill
              )
                found.push(
                  `${name}: selected, it is ${s.backgroundColor}, not the muted fill ${mutedFill}`,
                );
            }
            return found;
          })),
        );
        await audit();
        // Every problem, in full: an assertion's message is cut short.
        for (const problem of rails)
          console.error(`FAIL rails ${theme} ${viewport.width}: ${problem}`);
        assert.deepEqual(rails, []);
        console.log(`PASS rails ${theme} ${viewport.width}`);
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
