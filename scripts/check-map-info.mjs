import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("map-info.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const width of [390, 1050, 1200])
    for (const dir of ["ltr", "rtl"]) {
      await page.setViewportSize({
        width: width < 1104 ? width : 1280,
        height: 800,
      });
      await page.evaluate(({ width, dir }) => window.renderInfo(width, dir), {
        width,
        dir,
      });
      await settleLayout(page);
      const search = page.getByRole("searchbox", {
        name: "Search this building",
      });
      await search.fill("Harbour");
      const shell = await page.getByTestId("shell").elementHandle();
      const trigger = page
        .getByRole("button", { name: "Information", exact: true })
        .and(page.locator('[aria-haspopup="dialog"]'));
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "About this map" });
      await dialog.waitFor();
      await settleLayout(page);
      const bounds = await dialog.boundingBox();
      assert.ok(
        await page
          .getByRole("button", { name: "Close information" })
          .evaluate((node) => node === document.activeElement),
        "focus enters information",
      );
      const faq = dialog.getByRole("button", {
        name: "How do I change floors?",
      });
      await faq.click();
      assert.equal(await faq.getAttribute("aria-expanded"), "true");
      if (width < 1104) {
        assert.equal(await dialog.getAttribute("aria-modal"), "true");
        assert.equal(bounds.x, 0);
        assert.equal(bounds.y, 0);
        assert.equal(bounds.width, width);
        assert.equal(bounds.height, 800);
        assert.equal(
          await page.getByRole("searchbox").count(),
          0,
          "background hidden from AT",
        );
        await dialog.getByRole("link", { name: "Contact support" }).focus();
        await page.keyboard.press("Tab");
        assert.ok(
          await dialog.evaluate((node) =>
            node.contains(document.activeElement),
          ),
          "mobile focus stays in full-screen panel",
        );
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
        await settleLayout(page);
        assert.ok(
          await dialog.evaluate(
            (node) => node.scrollWidth <= node.clientWidth + 1,
          ),
          "large text wraps without horizontal clipping",
        );
        // Exercise real keyboard traversal: direct automation focus can use
        // preventScroll and is not a test of reaching content by keyboard.
        await dialog.getByRole("button", { name: "Close information" }).focus();
        for (let step = 0; step < 20; step++) {
          // WebKit's default keyboard policy skips links with plain Tab;
          // Option/Alt-Tab includes them, matching Safari keyboard navigation.
          await page.keyboard.press(
            browser.browserType().name() === "webkit" ? "Alt+Tab" : "Tab",
          );
          if (
            await dialog
              .getByRole("link", { name: "Contact support" })
              .evaluate((node) => node === document.activeElement)
          )
            break;
        }
        await settleLayout(page);
        await page
          .waitForFunction(
            () => {
              const link = document.querySelector(
                '[role="dialog"] a[href="mailto:support@example.com"]',
              );
              const bounds = link?.getBoundingClientRect();
              return (
                link === document.activeElement &&
                bounds &&
                bounds.top >= 0 &&
                bounds.bottom <= window.innerHeight
              );
            },
            undefined,
            { timeout: 2000 },
          )
          .catch(async (error) => {
            console.error(
              await dialog.evaluate((node) => ({
                height: node.clientHeight,
                scrollHeight: node.scrollHeight,
                scrollTop: node.scrollTop,
                rect: node.getBoundingClientRect().toJSON(),
                overflow: getComputedStyle(node).overflowY,
                active: document.activeElement?.outerHTML,
                link: node
                  .querySelector('a[href="mailto:support@example.com"]')
                  ?.getBoundingClientRect()
                  .toJSON(),
              })),
            );
            await page.screenshot({
              path: ".notes/map-info-overflow-failure.png",
            });
            throw error;
          });
        assert.ok(
          await dialog
            .getByRole("link", { name: "Contact support" })
            .evaluate((node) => {
              const bounds = node.getBoundingClientRect();
              return bounds.top >= 0 && bounds.bottom <= window.innerHeight;
            }),
          `footer remains reachable at 200% text size (${width}/${dir}): ${JSON.stringify(await dialog.getByRole("link", { name: "Contact support" }).boundingBox())}`,
        );
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "";
        });
        await settleLayout(page);
      } else {
        assert.notEqual(await dialog.getAttribute("aria-modal"), "true");
        assert.equal(Math.round(bounds.width), 384);
        const mapBounds = await page.getByTestId("shell").boundingBox();
        assert.ok(
          dir === "ltr"
            ? mapBounds.x + mapBounds.width <= bounds.x + 1
            : bounds.x + bounds.width <= mapBounds.x + 1,
          "information never covers map controls",
        );
        await search.click();
        assert.ok(
          await dialog.isVisible(),
          "desktop info remains open while browsing",
        );
        await faq.focus();
      }
      if (process.env.INFO_SCREENSHOTS)
        await page.screenshot({ path: `.notes/map-info-${width}-${dir}.png` });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await settleLayout(page);
      assert.equal(await search.inputValue(), "Harbour", "query is preserved");
      assert.ok(
        await trigger.evaluate((node) => node === document.activeElement),
        `focus returns to trigger (${width}/${dir}): ${await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 500))}`,
      );
      assert.ok(
        await shell.evaluate((node) => node.isConnected),
        "map shell remains mounted",
      );
      await trigger.click();
      await page.getByRole("button", { name: "Close information" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      if (width === 1200) {
        await trigger.click();
        // The FAQ was retained in host state, not reset by closing the panel.
        assert.equal(await faq.getAttribute("aria-expanded"), "true");
        await page.setViewportSize({ width: 390, height: 800 });
        await settleLayout(page);
        assert.equal(await dialog.getAttribute("aria-modal"), "true");
        assert.equal(await faq.getAttribute("aria-expanded"), "true");
        await page.setViewportSize({ width: 1280, height: 800 });
        await settleLayout(page);
        assert.notEqual(await dialog.getAttribute("aria-modal"), "true");
        assert.ok(
          await shell.evaluate((node) => node.isConnected),
          "resizing never replaces the map shell",
        );
        await page.getByRole("button", { name: "Close information" }).click();
      }
      await page.getByRole("button", { name: /Harbour Coffee Co/ }).click();
      await trigger.click();
      await page.getByRole("button", { name: "Close information" }).click();
      assert.ok(
        await page.getByRole("button", { name: "Close details" }).isVisible(),
        "selected POI remains after closing Info",
      );
    }
  console.log(
    "PASS MapInfo: desktop/mobile LTR/RTL, full viewport, FAQ, focus isolation/return, Escape/close, preserved query and map instance",
  );
} finally {
  await browser.close();
}
