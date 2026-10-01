import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("language-switcher.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 900 },
    reducedMotion: "reduce",
  });
  await page.setContent('<div id="root" style="margin:80px"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const dir of ["ltr", "rtl"]) {
    await page.evaluate((dir) => {
      window.localeRequests = [];
      window.renderLanguage({ dir });
    }, dir);
    await settleLayout(page);
    const trigger = page.getByRole("combobox");
    const map = await page.locator("[data-map-surface]").boundingBox();
    const tile = await trigger.boundingBox();
    assert.ok(
      dir === "ltr"
        ? tile.x < map.x + map.width / 2
        : tile.x > map.x + map.width / 2,
      "logical bottom-start placement",
    );
    await trigger.focus();
    await page.keyboard.press("Space");
    const menu = page.getByRole("listbox");
    await menu.waitFor();
    await settleLayout(page);
    const bounds = await menu.boundingBox();
    assert.ok(
      bounds.x >= map.x && bounds.x + bounds.width <= map.x + map.width,
      "menu inside embedded map horizontally",
    );
    const top = await page.locator("[data-map-search]").boundingBox();
    assert.ok(
      bounds.y >= top.y + top.height &&
        bounds.y + bounds.height <= map.y + map.height,
      "menu clears search and map edge",
    );
    assert.equal(
      await menu
        .getByRole("option", { name: "Français" })
        .getAttribute("aria-disabled"),
      "true",
    );
    assert.equal(await menu.getByText("العربية").getAttribute("lang"), "ar");
    const current = menu.getByRole("option", { name: "English" });
    const marker = await current.locator(":scope > span").first().boundingBox();
    const row = await current.boundingBox();
    assert.ok(
      dir === "ltr"
        ? marker.x < row.x + row.width / 2
        : marker.x > row.x + row.width / 2,
      "selection mark mirrors",
    );
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "option",
    );
    await page.keyboard.press("d");
    await page.waitForFunction(
      () => document.activeElement?.textContent === "Deutsch",
    );
    await page.keyboard.press("Enter");
    await menu.waitFor({ state: "hidden" });
    assert.deepEqual(
      await page.evaluate(() => window.localeRequests),
      ["de"],
      "typeahead requests supported language",
    );
    assert.match(
      await trigger.textContent(),
      /English/,
      "request is not an optimistic commit",
    );
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, pending: true }),
      dir,
    );
    await settleLayout(page);
    assert.ok(await trigger.isDisabled(), "pending prevents another request");
    assert.match(await trigger.textContent(), /English/);
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, locale: "de" }),
      dir,
    );
    await settleLayout(page);
    assert.match(
      await trigger.textContent(),
      /Deutsch/,
      "host commits accepted choice",
    );
    await trigger.click();
    await menu.waitFor();
    await page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "combobox",
    );
    assert.ok(
      await trigger.evaluate((el) => el === document.activeElement),
      "Escape restores focus",
    );
    await trigger.click();
    await menu.waitFor();
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, locale: "de", height: 60 }),
      dir,
    );
    await menu.waitFor({ state: "hidden" });
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, locale: "de" }),
      dir,
    );
    await settleLayout(page);
    assert.equal(
      await menu.count(),
      0,
      "restoring region does not reopen menu",
    );
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, locale: "en-x-20", long: true }),
      dir,
    );
    await settleLayout(page);
    await trigger.click();
    await menu.waitFor();
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "option",
    );
    const longBounds = await menu.boundingBox();
    assert.ok(
      longBounds.x >= map.x &&
        longBounds.x + longBounds.width <= map.x + map.width &&
        longBounds.y >= top.y + top.height &&
        longBounds.y + longBounds.height <= map.y + map.height,
      "long language menu stays inside the registered band",
    );
    const selectedBounds = await menu
      .getByRole("option", { name: "Language 20", exact: true })
      .boundingBox();
    assert.ok(
      selectedBounds.y >= longBounds.y &&
        selectedBounds.y + selectedBounds.height <=
          longBounds.y + longBounds.height,
      "opening reveals the committed language in a long list",
    );
    await page.keyboard.press("End");
    await page.waitForFunction(
      () => document.activeElement?.textContent === "Language 39",
    );
    await page.keyboard.press("Enter");
    await menu.waitFor({ state: "hidden" });
    assert.equal(
      await page.evaluate(() => window.localeRequests.at(-1)),
      "en-x-39",
      "last language is reachable in long list",
    );
    console.log("PASS LanguageSwitcher", dir);
    for (const panelHeight of [100, 1200, 100]) {
      await page.evaluate(
        ({ dir, panelHeight }) =>
          window.renderLanguage({
            dir,
            width: 820,
            height: 600,
            panelHeight,
            locale: "en-x-20",
            long: true,
          }),
        { dir, panelHeight },
      );
      await settleLayout(page);
      await trigger.click();
      await menu.waitFor();
      await settleLayout(page);
      const side = await page
        .locator('[data-slot="map-shell-panel"]')
        .boundingBox();
      const popup = await menu.boundingBox();
      assert.ok(
        popup.y >= side.y + side.height ||
          popup.x >= side.x + side.width ||
          popup.x + popup.width <= side.x,
        "language popup clears the side panel " +
          JSON.stringify({ dir, panelHeight, side, popup }),
      );
      assert.ok(
        popup.height >= 44,
        "bounded language menu retains a usable option target",
      );
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      await menu.waitFor({ state: "hidden" });
      assert.equal(
        await page.evaluate(() => window.localeRequests.at(-1)),
        "en-x-39",
      );
    }
    console.log("PASS LanguageSwitcher with short/long fitted panel", dir);
  }
} finally {
  await browser.close();
}
