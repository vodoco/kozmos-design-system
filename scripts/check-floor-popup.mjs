import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
// An open hint. A closed one can still be in the page while it fades out.
const OPEN_HINT =
  '[data-state="instant-open"] [role="tooltip"], [data-state="delayed-open"] [role="tooltip"]';
const fixture = await buildReactFixture("floor-popup.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>Floor popup</title></head><body><main id="root" style="margin:80px"></main></body></html>',
  );
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  await page.evaluate(() => window.renderFloorPopup({ height: 320, count: 3 }));
  await settleLayout(page);
  await page
    .getByRole("group", { name: "Floor selector" })
    .getByRole("button")
    .click();
  // Away from the column, which opens under the pointer: no hover hint.
  await page.mouse.move(1, 1);
  await settleLayout(page);
  assert.equal(
    await page.locator(OPEN_HINT).count(),
    0,
    "opening the list shows no hint on the level it focuses",
  );
  const describedFloor = page
    .getByRole("dialog")
    .getByRole("button", { name: "Level 1", exact: true });
  // A visitor arriving at a level by keyboard sees its full name. The bubble
  // is hidden from assistive technology, so find it by Radix's copy.
  await page.keyboard.press("Tab");
  assert.ok(
    await describedFloor.evaluate((node) => node === document.activeElement),
    "Tab moves to the next level",
  );
  const tooltip = page.locator('[role="tooltip"]', { hasText: /^Level 1$/ });
  await tooltip.waitFor();
  await settleLayout(page);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) => animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    ),
  );
  assert.equal(await tooltip.textContent(), "Level 1");
  assert.equal(
    await describedFloor.getAttribute("aria-describedby"),
    null,
    "the level already says its name: the hint does not describe it again",
  );
  assert.ok(
    await tooltip.evaluate((node) =>
      Boolean(node.closest('[aria-hidden="true"]')),
    ),
    "the hint is visual only",
  );
  assert.ok(
    await tooltip.evaluate((node) => Boolean(node.closest('[role="dialog"]'))),
    "the open floor dialog owns its tooltip description",
  );
  assert.ok(
    await tooltip.evaluate((node) => {
      const bubble = node.parentElement;
      const bounds = bubble.getBoundingClientRect();
      return bubble.contains(
        document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2,
        ),
      );
    }),
    "the visible hint is painted outside the floor list, not clipped by its viewport",
  );
  const accessibility = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    accessibility.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target),
    })),
    [],
    "open floor list and its focused tooltip remain accessible, including portaled content",
  );
  await page.keyboard.press("Escape");
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
    assert.equal(
      await tile.evaluate((el) =>
        el.closest('[role="region"]')?.getAttribute("aria-label"),
      ),
      "Map corner controls",
      "the popup trigger stays in its owning landmark",
    );
    assert.equal(
      await tile.getAttribute("aria-controls"),
      await popup.getAttribute("id"),
      "the independently named dialog remains connected to its trigger across the portal",
    );
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
      await popup
        .locator(".kozmos-floor-selector-scroll")
        .evaluate((el) => el.scrollHeight > el.clientHeight),
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
    // Deliver the scroll event before focusing the next tile. Radix correctly
    // dismisses a tooltip on scroll, which WebKit dispatches after the scroll
    // command has returned.
    await settleLayout(page);
    const lastFloor = popup.getByRole("button", {
      name: "Level 39",
      exact: true,
    });
    await lastFloor.focus();
    // Visual only, so found by Radix's copy rather than by role.
    const longListHint = popup.locator('[role="tooltip"]', {
      hasText: /^Level 39$/,
    });
    await longListHint.waitFor();
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter(
            (animation) =>
              animation.effect?.getTiming().iterations !== Infinity,
          )
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    assert.ok(
      await longListHint.evaluate((node) => {
        const bubble = node.parentElement;
        const bounds = bubble.getBoundingClientRect();
        return (
          !node.closest(".kozmos-floor-selector-scroll") &&
          bubble.contains(
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            ),
          )
        );
      }),
      "a long scrolling floor list must not clip its full-name hint",
    );
    await popup.getByRole("button", { name: "Level 39", exact: true }).click();
    await popup.waitFor({ state: "hidden" });
    assert.match(
      await tile.getAttribute("aria-label"),
      /Level 39/,
      "last floor can be selected",
    );
    await tile.click();
    await popup.waitFor();
    // Off the tile, so that only focus, not hover, can open its hint.
    await page.mouse.move(1, 1);
    await page.keyboard.press("Escape");
    await popup.waitFor({ state: "hidden" });
    await settleLayout(page);
    assert.ok(
      await tile.evaluate((el) => el === document.activeElement),
      "Escape returns to tile",
    );
    assert.equal(
      await page.locator(OPEN_HINT).count(),
      0,
      "focus handed back to the tile opens no hint",
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
