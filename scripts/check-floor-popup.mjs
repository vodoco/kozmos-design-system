import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("floor-popup.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  await page.setContent('<div id="root" style="margin:80px"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const dir of ["ltr", "rtl"]) {
    await page.evaluate(
      (dir) => window.renderFloorPopup({ height: 320, dir }),
      dir,
    );
    await settleLayout(page);
    const tile = page
      .getByRole("group", { name: "Floor selector" })
      .getByRole("button", { name: /Level/ });
    await tile.click();
    const popup = page.getByRole("dialog", { name: "Floor selector" });
    await popup.waitFor();
    await settleLayout(page);
    const bounds = await popup.boundingBox();
    const map = await page
      .getByRole("button", { name: "Map surface" })
      .boundingBox();
    const search = await page
      .getByRole("button", { name: "Search", exact: true })
      .boundingBox();
    assert.ok(
      bounds.y >= search.y + search.height &&
        bounds.y + bounds.height <= map.y + map.height,
      "long floor popup stays in its shell band",
    );
    assert.ok(
      bounds.x >= map.x && bounds.x + bounds.width <= map.x + map.width,
      "popup stays in embedded map horizontally",
    );
    assert.ok(
      await popup.evaluate((el) => el.scrollHeight > el.clientHeight),
      "long floors scroll instead of shrinking",
    );
    const selected = popup.getByRole("button", {
      name: "Level 20",
      exact: true,
    });
    const selectedBox = await selected.boundingBox();
    assert.ok(
      selectedBox.y >= bounds.y &&
        selectedBox.y + selectedBox.height <= bounds.y + bounds.height,
      "selected floor is visible on open",
    );
    await popup
      .getByRole("button", { name: "Level 39", exact: true })
      .scrollIntoViewIfNeeded();
    await popup.getByRole("button", { name: "Level 39", exact: true }).click();
    await popup.waitFor({ state: "hidden" });
    assert.match(
      await tile.getAttribute("aria-label"),
      /Level 39/,
      "last floor can be selected",
    );
    await tile.click();
    await popup.waitFor();
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
    assert.ok(
      await tile.evaluate((el) => el === document.activeElement),
      "Escape returns to tile",
    );
    await tile.click();
    await popup.waitFor();
    await page.evaluate(
      (dir) => window.renderFloorPopup({ height: 80, dir }),
      dir,
    );
    await popup.waitFor({ state: "hidden" });
    assert.ok(
      !(await page.evaluate(() =>
        document.activeElement?.closest('[style*="visibility: hidden"]'),
      )),
      "never focus hidden anchor",
    );
    await page.evaluate(
      (dir) => window.renderFloorPopup({ height: 320, dir }),
      dir,
    );
    await settleLayout(page);
    assert.equal(
      await popup.count(),
      0,
      "restoring space does not reopen dismissed popup",
    );
    await page.evaluate(
      (dir) => window.renderFloorPopup({ height: 320, dir, count: 0 }),
      dir,
    );
    await settleLayout(page);
    assert.ok(
      await page
        .getByRole("group", { name: "Floor selector" })
        .getByRole("button")
        .isDisabled(),
      "empty floors cannot open an enabled popup",
    );
    console.log("PASS bounded floor popup", dir);
    for (const panelHeight of [100, 1200]) {
      await page.evaluate((config) => window.renderFloorPopup(config), {
        height: 600,
        width: 820,
        dir,
        panelHeight,
      });
      await settleLayout(page);
      await tile.click();
      await popup.waitFor();
      await settleLayout(page);
      const menu = await popup.boundingBox();
      const panel = await page
        .locator('[data-slot="map-shell-panel"]')
        .boundingBox();
      assert.ok(
        menu.x + menu.width <= panel.x + 1 ||
          panel.x + panel.width <= menu.x + 1 ||
          menu.y + menu.height <= panel.y + 1 ||
          panel.y + panel.height <= menu.y + 1,
        `floor popup clears same-side panel: ${JSON.stringify({ menu, panel, dir, panelHeight })}`,
      );
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
    }
    console.log("PASS floor popup beside short/long same-side panel", dir);
  }
} finally {
  await browser.close();
}
