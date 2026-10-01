import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const fixture = await buildReactFixture("map-controls-parity.fixture.tsx");
const browser = await launchFixtureBrowser();
const output = path.resolve(
  "test-results/map-controls-parity",
  process.env.ADAPTIVE_BROWSER ?? "chromium",
);
fs.mkdirSync(output, { recursive: true });
try {
  for (const dir of ["ltr", "rtl"]) {
    const page = await browser.newPage({
      viewport: { width: 440, height: 540 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<html><head></head><body><div id="root" style="margin:32px"></div></body></html>',
    );
    await page.addStyleTag({ content: fixture.css });
    await page.addScriptTag({ content: fixture.code });
    await page.evaluate(
      (direction) => window.renderMapControlsFixture(direction),
      dir,
    );
    const tile = page
      .getByRole("group", { name: "Floor selector" })
      .getByRole("button", { name: "First floor", exact: true });
    await tile.waitFor();
    await settleLayout(page);
    const box = await tile.boundingBox();
    const start = await page
      .getByRole("button", { name: "Start-side layout probe" })
      .boundingBox();
    const map = await page
      .getByRole("button", { name: "Map surface" })
      .boundingBox();
    assert.ok(
      Math.abs(box.width - 48) < 1 && Math.abs(box.height - 48) < 1,
      "floor tile remains 48 square",
    );
    assert.ok(
      dir === "ltr" ? box.x > start.x : box.x < start.x,
      "start/end placement mirrors",
    );
    const clearance =
      dir === "ltr" ? map.x + map.width - box.x - box.width : box.x - map.x;
    assert.ok(
      Math.abs(clearance - (16 + (dir === "ltr" ? 28 : 12))) < 2,
      "logical end uses its physical collision inset",
    );
    assert.equal(await tile.locator("[data-floor-direction]").count(), 2);
    const zoom = await page
      .getByRole("button", { name: "Zoom in", exact: true })
      .boundingBox();
    assert.ok(box.y + box.height <= zoom.y, "floor selector is above zoom");
    await tile.focus();
    await page.getByRole("tooltip").waitFor();
    await tile.click();
    const list = page.getByRole("dialog", { name: "Floor selector" });
    await list.waitFor();
    assert.equal(
      await list.locator("[data-floor-selector-result-count]").count(),
      0,
      "supplied counts stay off by default",
    );
    await page.keyboard.press("Escape");
    await list.waitFor({ state: "hidden" });
    assert.equal(
      await tile.evaluate((node) => node === document.activeElement),
      true,
      "Escape restores focus",
    );
    await tile.click();
    await list
      .getByRole("button", { name: "Ground floor", exact: true })
      .click();
    await list.waitFor({ state: "hidden" });
    const ground = page
      .getByRole("group", { name: "Floor selector" })
      .getByRole("button", { name: "Ground floor", exact: true });
    assert.equal(
      await ground.locator('[data-floor-direction="up"]').count(),
      1,
    );
    assert.equal(
      await ground.locator('[data-floor-direction="down"]').count(),
      0,
    );
    // Empty chrome space must not become a full-screen hit target.
    await page.mouse.click(map.x + map.width / 2, map.y + 35);
    assert.match(
      await page.getByRole("button", { name: "Map surface" }).textContent(),
      /Map presses: 1/,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, dir + ".png") });
    console.log(
      "PASS",
      dir,
      "floor cues, size, hints, Escape, selection, placement, physical insets and map hit testing",
    );
    await page.evaluate(
      (direction) => window.renderMapControlsFixture(direction, true),
      dir,
    );
    await ground.click();
    await list.waitFor();
    assert.equal(
      await list.locator("[data-floor-selector-result-count]").textContent(),
      "3",
    );
    assert.equal(
      await list
        .getByRole("button", { name: "Second floor, 3 results", exact: true })
        .count(),
      1,
    );
    await page.evaluate(
      (direction) => window.renderMapControlsFixture(direction, false),
      dir,
    );
    await settleLayout(page);
    assert.equal(
      await list.locator("[data-floor-selector-result-count]").count(),
      0,
      "turning the option off removes existing badges",
    );
    console.log(
      "PASS",
      dir,
      "counts default off, explicit opt-in and live disable",
    );
    await page.evaluate(
      (direction) =>
        window.renderMapControlsFixture(direction, false, "compact-stepper"),
      dir,
    );
    const up = page.getByRole("button", { name: "Floor up", exact: true });
    await up.waitFor();
    await settleLayout(page);
    const borders = await up.evaluate((button) => {
      const pair = getComputedStyle(button.parentElement);
      const first = getComputedStyle(button);
      return {
        pairStart: parseFloat(pair.borderInlineStartWidth),
        pairEnd: parseFloat(pair.borderInlineEndWidth),
        firstStart: parseFloat(first.borderInlineStartWidth),
        firstEnd: parseFloat(first.borderInlineEndWidth),
      };
    });
    assert.deepEqual(
      borders,
      { pairStart: 1, pairEnd: 0, firstStart: 0, firstEnd: 1 },
      "stepper separates label and both buttons on logical edges",
    );
    console.log("PASS", dir, "compact stepper logical separators");
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, dir + "-stepper.png") });
    await page.close();
  }
} finally {
  await browser.close();
}
