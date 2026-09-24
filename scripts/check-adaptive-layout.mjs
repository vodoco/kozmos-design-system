// Exercise the distributed component and CSS in a real browser. No source alias.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildReactFixture,
  launchFixtureBrowser,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("adaptive-host.tsx");
const browser = await launchFixtureBrowser();
let failures = 0;
// GAP-38 is only measurable where the panel is a sheet; count the scenarios
// that got there, so a run in which none did fails rather than passes empty.
let sheetsMeasured = 0;
try {
  for (const scenario of [
    {
      name: "narrow container on a wide page",
      viewport: { width: 1440, height: 900 },
      width: 360,
      height: 600,
      direction: "ltr",
    },
    {
      name: "short landscape",
      viewport: { width: 844, height: 390 },
      width: 844,
      height: 390,
      direction: "ltr",
    },
    {
      name: "logical end in RTL",
      viewport: { width: 1024, height: 768 },
      width: 1024,
      height: 768,
      direction: "rtl",
    },
    {
      name: "vertical hinge",
      viewport: { width: 800, height: 700 },
      width: 800,
      height: 700,
      direction: "ltr",
      options: {
        usableRegions: [
          { x: 0, y: 0, width: 390, height: 700 },
          { x: 410, y: 0, width: 390, height: 700 },
        ],
      },
      separated: true,
    },
    {
      name: "RTL vertical hinge",
      viewport: { width: 800, height: 700 },
      width: 800,
      height: 700,
      direction: "rtl",
      options: {
        usableRegions: [
          { x: 0, y: 0, width: 390, height: 700 },
          { x: 410, y: 0, width: 390, height: 700 },
        ],
      },
      separated: true,
    },
    {
      name: "tabletop",
      viewport: { width: 700, height: 720 },
      width: 700,
      height: 720,
      direction: "ltr",
      options: {
        usableRegions: [
          { x: 0, y: 0, width: 700, height: 300 },
          { x: 0, y: 320, width: 700, height: 400 },
        ],
      },
      separated: true,
    },
    {
      name: "keyboard exclusion",
      viewport: { width: 390, height: 600 },
      width: 390,
      height: 600,
      direction: "ltr",
      options: { safeAreaInsets: { bottom: 200 } },
    },
    {
      name: "short host on a wide page",
      viewport: { width: 1440, height: 900 },
      width: 844,
      height: 200,
      direction: "ltr",
    },
  ]) {
    const page = await browser.newPage({ viewport: scenario.viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.setContent(
        // The doctype is not decoration: without it the page is in quirks mode,
        // where a unitless number is accepted as a length. Every real page has
        // one, so a fixture without one passes CSS that a visitor's browser
        // drops (GAP-38 was invisible here for exactly that reason).
        `<!doctype html><html dir="${scenario.direction}"><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture" style="width:${scenario.width}px;height:${scenario.height}px"></div></body></html>`,
      );
      await page.addScriptTag({
        content: `window.adaptiveOptions = ${JSON.stringify(scenario.options ?? {})};`,
      });
      await page.addScriptTag({ content: code });
      await page.locator("aside").waitFor();
      // Give ResizeObserver and React their frames before checking geometry.
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const host = await page.locator("#fixture").boundingBox();
      const shell = await page.locator("[data-map-status]").boundingBox();
      const panel = await page.locator("aside").boundingBox();
      assert(
        shell.height <= host.height + 1,
        `shell ${shell.height} exceeds host ${host.height}`,
      );
      assert(
        panel.x >= host.x - 1 &&
          panel.x + panel.width <= host.x + host.width + 1,
        `panel ${JSON.stringify(panel)} exceeds host ${JSON.stringify(host)}`,
      );
      assert(
        panel.y >= host.y - 1 &&
          panel.y + panel.height <= host.y + host.height + 1,
        "panel exceeds available height",
      );
      if (scenario.direction === "rtl")
        assert(
          panel.x < host.x + host.width / 2,
          "end panel must be on the physical left in RTL",
        );
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width > 0,
        undefined,
        { timeout: 1500 },
      );
      const layout = await page.evaluate(() => window.adaptiveSnapshot);
      // GAP-38: the sheet's drag handle is a 16px row holding a 40 x 4 grip
      // 6px down, as iOS's grabber row and Android's SheetHandle are. Its three
      // declarations read layout tokens, and those are unitless numbers
      // (16, 6, 40): a unitless number is not a length, so without
      // `calc(… * 1px)` the browser drops all three and the handle collapses to
      // the grip's own 4px, with no width at all.
      if (layout.presentation === "bottom") {
        const handle = await page
          .getByRole("slider", { name: "Panel height" })
          .boundingBox();
        const grip = await page
          .locator(".kozmos-map-sheet-grip")
          .boundingBox();
        sheetsMeasured++;
        assert.deepEqual(
          [
            Math.round(handle.height),
            Math.round(grip.width),
            Math.round(grip.height),
            Math.round(grip.y - handle.y),
          ],
          [16, 40, 4, 6],
          "the handle is a 16px row and the grip a 40 x 4 capsule 6px down (GAP-38)",
        );
      }
      const map = await page
        .getByRole("region", { name: "Map", exact: true })
        .boundingBox();
      for (const key of ["width", "height"])
        assert(
          Math.abs(map[key] - layout.mapBounds[key]) < 1,
          `reported map ${key} differs from the renderer slot`,
        );
      assert(
        Math.abs(map.x - host.x - layout.mapBounds.x) < 1 &&
          Math.abs(map.y - host.y - layout.mapBounds.y) < 1,
        "reported map position differs from rendered bounds",
      );
      if (scenario.separated) {
        assert.equal(layout.presentation, "separated");
        assert.deepEqual(
          layout.mapBounds,
          scenario.options.usableRegions[scenario.direction === "rtl" ? 1 : 0],
        );
        assert.deepEqual(
          layout.panelBounds,
          scenario.options.usableRegions[scenario.direction === "rtl" ? 0 : 1],
        );
        assert.equal(
          layout.collisionInsets.bottom,
          0,
          "separated panel must not pad the map",
        );
      } else {
        const edge =
          layout.presentation === "bottom"
            ? "bottom"
            : scenario.direction === "rtl"
              ? "left"
              : "right";
        const expected =
          edge === "bottom"
            ? layout.mapBounds.height -
              layout.panelBounds.y +
              layout.mapBounds.y
            : edge === "right"
              ? layout.mapBounds.width -
                layout.panelBounds.x +
                layout.mapBounds.x
              : layout.panelBounds.x +
                layout.panelBounds.width -
                layout.mapBounds.x;
        assert(
          Math.abs(layout.collisionInsets[edge] - expected) < 1,
          "camera padding must include measured panel coverage",
        );
      }
      const bottomExclusion = scenario.options?.safeAreaInsets?.bottom ?? 0;
      assert(
        panel.y + panel.height <= host.y + host.height - bottomExclusion + 1,
        "panel intersects keyboard exclusion",
      );
      const topBar = await page
        .getByRole("button", { name: "Search this floor" })
        .boundingBox();
      const controls = await page
        .getByRole("button", { name: "Focus map" })
        .boundingBox();
      assert(
        controls.y >= topBar.y + topBar.height - 1,
        "controls overlap top bar",
      );
      assert(
        controls.y + controls.height <= panel.y + 1 ||
          controls.x + controls.width <= panel.x + 1 ||
          controls.x >= panel.x + panel.width - 1,
        "controls overlap panel",
      );
      assert(
        layout.collisionInsets.top >= topBar.y + topBar.height - map.y - 1,
        "top bar must contribute camera padding",
      );
      if (process.env.ADAPTIVE_SCREENSHOTS) {
        fs.mkdirSync(process.env.ADAPTIVE_SCREENSHOTS, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.ADAPTIVE_SCREENSHOTS,
            `${scenario.name.replaceAll(" ", "-")}.png`,
          ),
        });
      }
      // Exercise the POI's internal state across presentations.
      await page
        .getByRole("button", { name: "Favourite", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("button", { name: "Favourite", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("textbox", { name: "Search places" }).fill("Museum");
      // Host adapters supply fresh local regions when the window/hinge moves.
      await page.evaluate(() => window.setAdaptiveOptions({}));
      await page.locator("#fixture").evaluate((element) => {
        element.style.width = "340px";
        element.style.height = "320px";
      });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).inputValue(),
        "Museum",
        "resizing must preserve panel state",
      );
      assert.equal(
        await page
          .getByRole("textbox", { name: "Search places" })
          .evaluate((element) => element === document.activeElement),
        true,
        "resizing must preserve focus",
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Favourite", exact: true })
          .getAttribute("aria-pressed"),
        "true",
        "resizing must preserve POI state",
      );
      assert.deepEqual(
        await page.evaluate(() => [window.mapMounts, window.panelMounts]),
        [1, 1],
        "resizing must not remount the renderer or panel",
      );
      const resized = await page.locator("aside").boundingBox();
      const resizedHost = await page.locator("#fixture").boundingBox();
      assert(
        resized.x >= resizedHost.x - 1 &&
          resized.x + resized.width <= resizedHost.x + 341 &&
          resized.y + resized.height <= resizedHost.y + 321,
        "resized panel exceeds host",
      );
      const notifications = await page.evaluate(
        () => window.adaptiveNotifications,
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(
        await page.evaluate(() => window.adaptiveNotifications),
        notifications,
        "stable geometry must not cause a notification loop",
      );
      // A host locale switch must resolve direction without a window resize.
      await page.locator("#fixture").evaluate((element) => {
        element.style.width = "1024px";
        element.style.height = "600px";
      });
      await page.evaluate(() => (document.documentElement.dir = "rtl"));
      await page.waitForFunction(
        () =>
          window.adaptiveSnapshot?.presentation === "side" &&
          window.adaptiveSnapshot?.panelBounds?.x === 16,
      );
      await page.evaluate(() => (document.documentElement.dir = "ltr"));
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.panelBounds?.x === 592,
      );
      await page.evaluate(() =>
        window.setAdaptiveOptions({ usableRegions: [] }),
      );
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 0,
      );
      assert(
        await page.locator("aside").isHidden(),
        "no usable region must remove panel content from interaction",
      );
      assert.equal(
        await page.getByRole("textbox", { name: "Search places" }).count(),
        0,
        "clipped content must not remain in the accessibility tree",
      );
      await page.evaluate(() => window.setAdaptiveOptions({}));
      await page.waitForFunction(
        () => window.adaptiveSnapshot?.mapBounds.width === 1024,
      );
      assert.deepEqual(
        await page.evaluate(() => [window.mapMounts, window.panelMounts]),
        [1, 1],
        "empty-to-usable regions must preserve component instances",
      );
      assert.deepEqual(errors, [], "browser runtime errors");
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${scenario.name}: ${error.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (!sheetsMeasured) {
  failures++;
  console.error(
    "FAIL no scenario presented the panel as a sheet, so GAP-38's handle was never measured",
  );
}
process.exitCode = failures ? 1 : 0;
