import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("adaptive-host.tsx");
const browser = await launchFixtureBrowser();
let failures = 0;
const cases = [
  [
    "layout callback cannot mutate padding callback payload",
    async (page) => {
      await page.evaluate(() =>
        window.setAdaptiveOptions({
          collisionInsets: { top: 122 },
          onLayoutChange: (layout) => {
            layout.collisionInsets.top = -999;
          },
          onCollisionInsetsChange: (insets) => {
            window.paddingTestValue = insets.top;
          },
        }),
      );
      await settleLayout(page);
      assert((await page.evaluate(() => window.paddingTestValue)) >= 122);
    },
  ],
  [
    "invalid host inset cannot cancel a CSS safe area",
    async (page) => {
      await page
        .locator("[data-map-status] > [aria-hidden=true]")
        .evaluate((node) => (node.style.paddingTop = "24px"));
      await page.evaluate(() => {
        window.dispatchEvent(new Event("resize"));
        window.setAdaptiveOptions({ safeAreaInsets: { top: NaN } });
      });
      await settleLayout(page);
      // The map runs under the device's safe area and the chrome keeps it
      // (55981f6): the top bar, not the map, starts below it.
      assert.equal(
        await page.evaluate(() => window.adaptiveSnapshot.mapBounds.y),
        0,
        "the map runs under the safe area",
      );
      const barTop = async () => {
        const [bar, host] = await Promise.all([
          page.getByRole("button", { name: "Search this floor" }).boundingBox(),
          page.locator("#fixture").boundingBox(),
        ]);
        return bar.y - host.y;
      };
      assert((await barTop()) >= 24, "the top bar keeps the safe area");
      await page
        .locator("[data-map-status] > [aria-hidden=true]")
        .evaluate((node) => (node.style.paddingTop = "40px"));
      await settleLayout(page);
      assert(
        (await barTop()) >= 40,
        "safe-area changes must be observed without a window resize",
      );
    },
  ],
  [
    "zero-width host excludes interactive content",
    async (page) => {
      await page
        .locator("#fixture")
        .evaluate((node) => (node.style.width = "0px"));
      await settleLayout(page);
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Focus map" }).count(),
        0,
      );
      await page
        .locator("#fixture")
        .evaluate((node) => (node.style.width = "390px"));
      await settleLayout(page);
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).count(),
        1,
      );
    },
  ],
  [
    "a bottom sheet leaves the controls usable, or out of reach",
    async (page) => {
      // Half the shell: the band above the sheet holds the controls.
      await page.evaluate(() =>
        window.setAdaptiveOptions({ panelFraction: 0.5 }),
      );
      await settleLayout(page);
      const focusMap = page.getByRole("button", { name: "Focus map" });
      const controls = await focusMap.boundingBox();
      const panel = await page.locator("aside").boundingBox();
      assert(
        controls.y + controls.height <= panel.y + 1,
        `control ends at ${controls.y + controls.height}, panel starts at ${panel.y}`,
      );
      await focusMap.click({ timeout: 1000 });
      // 88 %: the sheet takes the band, as the shell keeps no height back for
      // the controls (d0ec0b0). They are hidden then, never drawn under the
      // sheet where a keyboard or a screen reader would still reach them.
      await page.evaluate(() =>
        window.setAdaptiveOptions({ panelFraction: 0.88 }),
      );
      await settleLayout(page);
      assert.equal(
        await focusMap.count(),
        0,
        "controls under the sheet must be out of reach",
      );
      assert(
        !(await page.evaluate(() =>
          window.adaptiveSnapshot.occlusions.some(
            (occlusion) => occlusion.kind === "controls",
          ),
        )),
        "hidden controls must not pad the camera",
      );
    },
  ],
  [
    "padding callback cannot mutate layout callback snapshot",
    async (page) => {
      await page.evaluate(() =>
        window.setAdaptiveOptions({
          collisionInsets: { top: 122 },
          onCollisionInsetsChange: (insets) => {
            insets.top = -999;
          },
        }),
      );
      await settleLayout(page);
      assert(
        (await page.evaluate(
          () => window.adaptiveSnapshot.collisionInsets.top,
        )) >= 122,
      );
    },
  ],
  [
    "geometry agrees with visible chrome after font enlargement",
    async (page) => {
      await page.addStyleTag({
        content:
          "button { font-size: 32px !important; line-height: 48px !important; height: auto !important; white-space: normal !important; }",
      });
      await settleLayout(page);
      const layout = await page.evaluate(() => window.adaptiveSnapshot);
      const controls = await page
        .getByRole("button", { name: "Focus map" })
        .boundingBox();
      const topBar = await page
        .getByRole("button", { name: "Search this floor" })
        .boundingBox();
      const measured = layout.occlusions.find(
        (occlusion) => occlusion.kind === "controls",
      ).bounds;
      assert(
        Math.abs(measured.height - controls.height) < 1,
        "controls were clipped by enlarged text",
      );
      assert(controls.y >= topBar.y + topBar.height - 1);
    },
  ],
  [
    "a panel header stays put while the content under it scrolls",
    async (page) => {
      // Row 73: the sheet scrolled as one piece, so the search field went up
      // and out of sight with the results it was searching. Reduced motion:
      // a sheet easing to its detent moves everything in it.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.setAdaptiveOptions({ panelDetent: "large" });
      });
      await settleLayout(page);
      const field = page.getByRole("textbox", { name: "Search this sheet" });
      // Counted first: a missing header would otherwise read null twice and
      // "stay put", or time out rather than fail.
      assert.equal(await field.count(), 1, "the panel header is drawn");
      assert(
        await page.evaluate(
          () => !!document.querySelector("[data-kozmos-panel-header]"),
        ),
        "the panel header has its own row",
      );
      const before = await field.boundingBox();
      const scrolled = await page.evaluate(() => {
        const header = document.querySelector("[data-kozmos-panel-header]");
        const content = header.nextElementSibling;
        content.scrollTop = 300;
        return content.scrollTop;
      });
      await settleLayout(page);
      assert(scrolled > 0, "the content under the header scrolls");
      assert.deepEqual(
        await field.boundingBox(),
        before,
        "the header stays put",
      );
    },
  ],
  [
    "a collapsed sheet rests on its panel header",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => {
        window.showPanelHeader();
        window.setAdaptiveOptions({ panelDetent: "collapsed" });
      });
      await settleLayout(page);
      const sortButton = page.getByRole("button", { name: "Sort" });
      assert.equal(await sortButton.count(), 1, "the panel header is drawn");
      const sort = await sortButton.boundingBox();
      const sheet = await page.locator("aside").boundingBox();
      assert(
        sort.y + sort.height <= sheet.y + sheet.height,
        `the header ends at ${sort.y + sort.height}, the sheet at ${sheet.y + sheet.height}`,
      );
    },
  ],
  [
    "a drag that starts on the panel header moves the sheet, however far its content has scrolled",
    async (page) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      // The detent follows the drag, as a product holding it would.
      await page.evaluate(() => {
        window.showPanelHeader();
        const hold = (detent) =>
          window.setAdaptiveOptions({
            panelDetent: detent,
            onPanelDetentChange: hold,
          });
        hold("large");
      });
      await settleLayout(page);
      const scrolled = await page.evaluate(() => {
        const content = document.querySelector(
          "[data-kozmos-panel-header]",
        )?.nextElementSibling;
        if (!content) return 0;
        content.scrollTop = 300;
        return content.scrollTop;
      });
      assert(
        scrolled > 0,
        "the panel header is drawn over content that has scrolled",
      );
      await settleLayout(page);
      const sheetBefore = await page.locator("aside").boundingBox();
      const filters = await page
        .getByRole("button", { name: "Filters" })
        .boundingBox();
      const x = filters.x + filters.width / 2;
      const y = filters.y + filters.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      for (let step = 1; step <= 10; step++)
        await page.mouse.move(x, y + step * 25);
      await page.mouse.up();
      await page.waitForTimeout(600);
      await settleLayout(page);
      const sheetAfter = await page.locator("aside").boundingBox();
      assert(
        sheetAfter.height < sheetBefore.height - 50,
        `the sheet stayed ${sheetBefore.height}px, now ${sheetAfter.height}px`,
      );
    },
  ],
];
try {
  for (const [name, test] of cases) {
    const page = await browser.newPage({
      viewport: { width: 1024, height: 768 },
    });
    try {
      await page.setContent(
        `<!doctype html><html><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture" style="width:390px;height:600px"></div></body></html>`,
      );
      await page.addScriptTag({ content: code });
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 390,
      );
      await settleLayout(page);
      await test(page);
      console.log(`PASS ${name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exitCode = failures ? 1 : 0;
