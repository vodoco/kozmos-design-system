import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const fixture = await buildReactFixture("shell-corners.fixture.tsx");
const browser = await launchFixtureBrowser();
const overlaps = (a, b) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;
try {
  const context = await browser.newContext({
    viewport: { width: 900, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<div id="root" style="margin:32px"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  let presses = 0;
  for (const config of [
    { dir: "rtl", width: 360, height: 420 },
    { dir: "ltr", width: 360, height: 420 },
    { dir: "rtl", width: 700, height: 420 },
    { dir: "rtl", width: 820, height: 420, panel: true },
    { dir: "ltr", width: 820, height: 420, panel: true },
    { dir: "ltr", width: 820, height: 420, panel: true, contentHeight: 1200 },
    { dir: "rtl", width: 820, height: 420, panel: true, contentHeight: 1200 },
    { dir: "ltr", width: 820, height: 420, panel: true },
    {
      dir: "ltr",
      width: 360,
      height: 680,
      panel: true,
      keyboard: 180,
      legacy: true,
    },
  ]) {
    await page.evaluate((config) => window.renderShellCorners(config), config);
    await page.getByRole("button", { name: "Zoom in", exact: true }).waitFor();
    await settleLayout(page);
    const corners = page.getByRole("region", {
      name: "Map corner controls",
      exact: true,
    });
    assert.equal(
      await corners
        .getByRole("button", { name: "Zoom in", exact: true })
        .count(),
      1,
    );
    assert.equal(
      await page
        .getByRole("region", { name: "Map controls", exact: true })
        .count(),
      config.legacy ? 1 : 0,
    );
    const start = await page
      .getByRole("button", { name: /Start-side probe/ })
      .boundingBox();
    const zoom = await page
      .getByRole("button", { name: "Zoom out", exact: true })
      .boundingBox();
    const up = await page
      .getByRole("button", { name: "Floor up", exact: true })
      .boundingBox();
    const map = await page
      .getByRole("button", { name: "Map surface" })
      .boundingBox();
    const top = await page
      .getByRole("button", { name: "Top bar" })
      .boundingBox();
    assert.ok(
      config.dir === "rtl" ? start.x > zoom.x : start.x < zoom.x,
      "logical corners mirror",
    );
    for (const a of [zoom, up])
      assert.ok(
        !overlaps(start, a),
        "opposite-corner controls must not overlap",
      );
    for (const a of [start, zoom, up]) {
      assert.ok(!overlaps(top, a), "corners must clear top bar");
      assert.ok(
        a.x >= map.x &&
          a.y >= map.y &&
          a.x + a.width <= map.x + map.width + 1 &&
          a.y + a.height <= map.y + map.height + 1,
        "controls stay in map bounds",
      );
    }
    if (config.panel) {
      const panel = await page
        .getByRole("complementary", { name: "Map details" })
        .boundingBox();
      assert.ok(!overlaps(zoom, panel), "zoom stays clear of the panel");
      if (config.width >= 720) {
        if (!config.contentHeight)
          assert.ok(panel.height <= 140, "short side panel hugs content");
        assert.ok(
          panel.y + panel.height + 16 <= Math.min(start.y, up.y),
          "long panel leaves the bottom row clear",
        );
        assert.ok(
          !overlaps(start, panel),
          "start control stays below the panel",
        );
        const startInset =
          config.dir === "rtl"
            ? map.x + map.width - start.x - start.width
            : start.x - map.x;
        assert.ok(
          Math.abs(startInset - 16) <= 1,
          "start control stays at the map edge, not beside the panel",
        );
      }
    }
    const layout = await page.evaluate(() => window.shellLayout);
    assert.ok(
      layout.occlusions.some(
        (item) => item.kind === "controls" && item.bounds.height > 0,
      ),
      "registered region is reported",
    );
    await page.getByRole("button", { name: /Start-side probe/ }).click();
    const count = await page
      .getByRole("button", { name: /Start-side probe/ })
      .textContent();
    assert.equal(
      count,
      "Start-side probe: " + ++presses,
      "control state survives resize and direction changes",
    );
    const notifications = await page.evaluate(() => window.shellNotifications);
    await settleLayout(page);
    assert.equal(
      await page.evaluate(() => window.shellNotifications),
      notifications,
      "settled layout must not loop",
    );
    console.log("PASS shell corners", JSON.stringify(config));
  }
  // The shell must not leave clipped controls focusable behind a full-height sheet.
  await page.evaluate(() =>
    window.renderShellCorners({ dir: "ltr", width: 360, height: 120 }),
  );
  await settleLayout(page);
  assert.equal(
    await page.getByRole("button", { name: /Start-side probe/ }).count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("region", { name: "Map corner controls", exact: true })
      .count(),
    0,
    "hidden corners must not leave an empty landmark",
  );
  assert.equal(
    await page.getByRole("button", { name: "Zoom out", exact: true }).count(),
    0,
  );
  assert.ok(
    !(await page.evaluate(() => window.shellLayout)).occlusions.some(
      (o) => o.kind === "controls",
    ),
  );
  await page.evaluate(() =>
    window.renderShellCorners({ dir: "ltr", width: 700, height: 420 }),
  );
  await settleLayout(page);
  assert.equal(
    await page.getByRole("button", { name: /Start-side probe/ }).textContent(),
    "Start-side probe: " + presses,
    "hidden controls keep state",
  );
  const unpadded = await page.evaluate(() => window.shellLayout);
  await page.evaluate(() =>
    window.renderShellCorners({
      dir: "ltr",
      width: 700,
      height: 420,
      padCamera: true,
    }),
  );
  await settleLayout(page);
  const padded = await page.evaluate(() => window.shellLayout);
  assert.ok(
    padded.collisionInsets.bottom > unpadded.collisionInsets.bottom,
    "camera padding is explicitly opt-in",
  );
  const hit = await page.evaluate(() => {
    const dock = document
      .querySelector("[data-kozmos-bottom-controls]")
      .getBoundingClientRect();
    return document
      .elementFromPoint(dock.x + dock.width / 2, dock.bottom - 4)
      ?.getAttribute("aria-label");
  });
  assert.equal(
    hit,
    "Map surface",
    "blank dock space remains available to map gestures",
  );
  console.log(
    "PASS shell corner hiding, state retention, camera padding and gesture pass-through",
  );
  await page.evaluate(() =>
    window.renderShellCorners({
      dir: "ltr",
      width: 360,
      height: 420,
      hideStart: true,
    }),
  );
  await settleLayout(page);
  assert.equal(
    await page.locator("[data-kozmos-bottom-controls] > div > div").count(),
    1,
    "a conditional false slot contributes no empty flex item or gap",
  );
  assert.deepEqual(errors, []);
  await page.evaluate(() =>
    window.renderShellCorners({
      dir: "rtl",
      width: 700,
      height: 420,
      legacy: true,
      controlsLabel: "Kartensteuerung",
      bottomControlsLabel: "Weitere Kartensteuerung",
    }),
  );
  await settleLayout(page);
  assert.equal(
    await page
      .getByRole("region", { name: "Kartensteuerung", exact: true })
      .getByRole("button", { name: "Legacy controls" })
      .count(),
    1,
  );
  assert.equal(
    await page
      .getByRole("region", { name: "Weitere Kartensteuerung", exact: true })
      .getByRole("button", { name: "Zoom in", exact: true })
      .count(),
    1,
  );
  const regions = await new AxeBuilder({ page })
    .withRules(["region"])
    .analyze();
  assert.deepEqual(
    regions.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
    [],
    "legacy and corner controls pass axe's region rule together",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS GAP-101 named, localized control landmarks preserve child controls and hidden state",
  );
  fs.mkdirSync("test-results/shell-corners", { recursive: true });
  await page.screenshot({
    path:
      "test-results/shell-corners/" +
      (process.env.ADAPTIVE_BROWSER ?? "chromium") +
      ".png",
  });
} finally {
  await browser.close();
}
