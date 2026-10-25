import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("language-switcher.fixture.tsx");
const browser = await launchFixtureBrowser();
// Decision 77 (GAP-122): the menu opens straight above its trigger, from its
// start edge, over a side panel and anything else, as the Web SDK's does.
// While the select is open, Radix hides everything outside it from the
// accessibility tree, the trigger included: reach it by its role attribute.
const openTrigger = (page) => page.locator('[role="combobox"]').first();
function assertAbove(menu, trigger, dir, label) {
  const json = JSON.stringify({ menu, trigger });
  assert.ok(
    Math.abs(menu.y + menu.height + 4 - trigger.y) <= 2,
    `${label}: the menu opens straight above its trigger ${json}`,
  );
  assert.ok(
    dir === "ltr"
      ? Math.abs(menu.x - trigger.x) <= 2
      : Math.abs(menu.x + menu.width - (trigger.x + trigger.width)) <= 2,
    `${label}: the menu starts at its trigger's start edge ${json}`,
  );
  assert.ok(menu.y >= 0, `${label}: the menu stays in the window ${json}`);
}
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
    // The positioned box, not the menu inside it, which may still be
    // mid-way through its opening zoom.
    const placed = page.locator("[data-radix-popper-content-wrapper]");
    // Against the trigger as it is with the menu open: opening the select
    // locks the page's scroll, which can move it.
    assertAbove(
      await placed.boundingBox(),
      await openTrigger(page).boundingBox(),
      dir,
      "short list",
    );
    assert.equal(
      await menu
        .getByRole("option", { name: "Français" })
        .getAttribute("aria-disabled"),
      "true",
    );
    assert.equal(await menu.getByText("العربية").getAttribute("lang"), "ar");
    // The check ends the chosen row, as every Kozmos list row's does (the
    // owner's 21 Oct ruling on Figma's rows), and mirrors right to left.
    const current = menu.getByRole("option", { name: "English" });
    const marker = await current.locator("svg").first().boundingBox();
    const row = await current.boundingBox();
    assert.ok(
      dir === "ltr"
        ? marker.x > row.x + row.width / 2
        : marker.x < row.x + row.width / 2,
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
    // The host marks the request pending at once, then commits it. The
    // trigger keeps focus throughout, and refuses another request meanwhile.
    await page.evaluate(
      (dir) => window.renderLanguage({ dir, pendOnRequest: true }),
      dir,
    );
    await settleLayout(page);
    await trigger.focus();
    await page.keyboard.press("Space");
    await menu.waitFor();
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "option",
    );
    await page.keyboard.press("d");
    await page.waitForFunction(
      () => document.activeElement?.textContent === "Deutsch",
    );
    await page.keyboard.press("Enter");
    await menu.waitFor({ state: "hidden" });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("role") === "combobox",
    );
    assert.equal(await trigger.getAttribute("aria-disabled"), "true");
    assert.equal(
      await trigger.evaluate((node) => getComputedStyle(node).opacity),
      "0.5",
      "pending looks unavailable, as disabled did",
    );
    assert.match(await trigger.textContent(), /English/);
    assert.match(
      await page.getByRole("status").textContent(),
      /Changing language/,
    );
    await page.keyboard.press("Space");
    await page.keyboard.press("a");
    await settleLayout(page);
    assert.equal(await menu.count(), 0, "pending does not open the list");
    assert.deepEqual(
      (await page.evaluate(() => window.localeRequests)).slice(-1),
      ["de"],
      "pending prevents another request",
    );
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
    assert.ok(
      await trigger.evaluate((el) => el === document.activeElement),
      "focus stays on the trigger through the commit",
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
    assertAbove(
      await placed.boundingBox(),
      await openTrigger(page).boundingBox(),
      dir,
      "long list",
    );
    const longBounds = await menu.boundingBox();
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
      const popup = await menu.boundingBox();
      assertAbove(
        await placed.boundingBox(),
        await openTrigger(page).boundingBox(),
        dir,
        `beside a ${panelHeight}px side panel`,
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
