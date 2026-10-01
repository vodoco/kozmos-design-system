import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("map-browse-flow.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const width of [390, 1200])
    for (const dir of ["ltr", "rtl"]) {
      await page.evaluate(({ width, dir }) => window.renderBrowse(width, dir), {
        width,
        dir,
      });
      await settleLayout(page);
      const panel = page.locator('[data-slot="map-shell-panel"]');
      const search = panel.getByRole("searchbox", {
        name: "Search this building",
      });
      await search.waitFor();
      assert.equal(
        await page.getByRole("searchbox").count(),
        1,
        "search is only inside the panel",
      );
      await panel
        .getByRole("button", { name: "Food & drink", exact: true })
        .click();
      await search.fill("Harbour");
      await panel.getByRole("button", { name: /Harbour Coffee Co/ }).click();
      const close = panel.getByRole("button", { name: "Close details" });
      await close.waitFor();
      assert.equal(
        await page.getByRole("searchbox").count(),
        0,
        "details replace browse",
      );
      assert.equal(await panel.count(), 1, "one panel owns both modes");
      assert.ok(
        await close.evaluate((node) => node === document.activeElement),
        "focus enters details",
      );
      await close.click();
      assert.equal(
        await search.inputValue(),
        "Harbour",
        "query survives closing details",
      );
      assert.equal(
        await panel
          .getByRole("button", { name: "Food & drink", exact: true })
          .getAttribute("aria-pressed"),
        "true",
        "category survives",
      );
      assert.ok(
        await search.evaluate((node) => node === document.activeElement),
        "focus returns to search",
      );
      const p = await panel.boundingBox();
      const shell = await page.getByTestId("shell").boundingBox();
      if (width === 1200) {
        assert.ok(p.y < shell.y + 32, "desktop panel starts at top");
        assert.ok(
          dir === "ltr"
            ? p.x < shell.x + 32
            : p.x + p.width > shell.x + shell.width - 32,
          "desktop panel uses logical start",
        );
      } else {
        assert.ok(p.y > shell.y + 100, "mobile uses bottom sheet");
      }
    }
  console.log(
    "PASS browse-to-details: desktop/mobile LTR/RTL, shared panel, retained filters and keyboard focus",
  );
} finally {
  await browser.close();
}
