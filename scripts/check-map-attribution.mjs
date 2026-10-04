import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";
const fixture = await buildReactFixture("map-attribution.fixture.tsx");
const browser = await launchFixtureBrowser();
try {
  for (const dir of ["ltr", "rtl"]) {
    const page = await browser.newPage({
      viewport: { width: 600, height: 1600 },
    });
    await page.setContent('<div id="root"></div>');
    await page.addStyleTag({ content: fixture.css });
    await page.addScriptTag({ content: fixture.code });
    await page.evaluate((dir) => window.renderAttribution(dir), dir);
    await settleLayout(page);
    const region = page.getByRole("region", { name: "Map attribution" });
    const mapPaint = await region.evaluate((node) => ({
      background: getComputedStyle(node).backgroundColor,
      shadow: getComputedStyle(node.querySelector("li")).textShadow,
      color: getComputedStyle(node.querySelector("a")).color,
      underline: getComputedStyle(node.querySelector("a")).textDecorationLine,
    }));
    assert.equal(mapPaint.background, "rgba(0, 0, 0, 0)");
    assert.notEqual(mapPaint.shadow, "none");
    assert.equal(mapPaint.color, "rgb(70, 74, 83)");
    assert.ok(mapPaint.underline.includes("underline"));
    assert.equal(
      await region
        .locator("li")
        .first()
        .evaluate((node) => getComputedStyle(node).fontSize),
      "10px",
      "credits use the compact web type scale",
    );
    await page.evaluate(
      (dir) => window.renderAttribution(dir, true, false, true, "surface"),
      dir,
    );
    await settleLayout(page);
    assert.equal(
      await region
        .locator("li")
        .first()
        .evaluate((node) => getComputedStyle(node).textShadow),
      "none",
    );
    assert.notEqual(
      await region.evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgba(0, 0, 0, 0)",
    );
    await page.evaluate((dir) => window.renderAttribution(dir), dir);
    await settleLayout(page);
    await page.evaluate(
      (dir) => window.renderAttribution(dir, true, false, false),
      dir,
    );
    await settleLayout(page);
    const logo = region.getByRole("img", { name: "Pointr" });
    await logo.evaluate((image) => image.decode());
    assert.ok(
      await logo.evaluate(
        (image) =>
          image.currentSrc.startsWith("data:image/svg+xml,") &&
          image.naturalWidth === 98 &&
          image.naturalHeight === 34,
      ),
      "default artwork is bundled and decodes offline",
    );
    const logoBox = await logo.boundingBox();
    const creditsBox = await region.locator("ul").boundingBox();
    assert.ok(
      Math.abs(creditsBox.y - logoBox.y - logoBox.height - 6) < 1,
      "logo-to-credit gap stays compact",
    );
    await page.evaluate((dir) => window.renderAttribution(dir), dir);
    await settleLayout(page);
    assert.equal(await region.getByRole("img", { name: "Pointr" }).count(), 0);
    assert.equal(await region.getByText("Example venue").count(), 1);
    for (const row of await region.locator("li").all()) {
      assert.ok(
        (await row.boundingBox()).height <= 24,
        "credits use text-height rows, not 48px button rows",
      );
    }
    // WebKit's default keyboard preference skips links on Tab; Option-Tab
    // is its native navigation gesture for all interactive elements.
    const tab = browser.browserType().name() === "webkit" ? "Alt+Tab" : "Tab";
    const scroll = region.locator(".kozmos-map-attribution-scroll");
    assert.equal(
      await scroll.getAttribute("tabindex"),
      "-1",
      "a credit line that fits is out of the tab order",
    );
    const link = page.getByRole("link");
    // From the link, back one stop: nothing in the attribution before it.
    await link.focus();
    await page.keyboard.press(`Shift+${tab}`);
    assert.ok(
      await scroll.evaluate((node) => node !== document.activeElement),
      "the credit line is not a stop before its link",
    );
    await link.focus();
    assert.ok(
      await link.evaluate((node) => node === document.activeElement),
      "credit link is keyboard reachable",
    );
    assert.equal(await link.getAttribute("href"), "https://example.com");
    await page.evaluate(
      (dir) => window.renderAttribution(dir, false, true),
      dir,
    );
    await page.addStyleTag({ content: "html { font-size: 32px; }" });
    await settleLayout(page);
    assert.equal(await region.getByText("Example venue").count(), 0);
    assert.equal(await region.getByText("© Indoor data").count(), 1);
    const fits = await region.evaluate((node) => {
      const scroll = node.querySelector(".kozmos-map-attribution-scroll");
      const heights = [...node.querySelectorAll("li")].map(
        (child) => child.getBoundingClientRect().height,
      );
      return (
        node.scrollWidth <= node.clientWidth + 1 &&
        scroll.scrollWidth > scroll.clientWidth &&
        getComputedStyle(scroll).overflowX === "auto" &&
        heights.every((height) => height > 0 && height <= 24)
      );
    });
    assert.ok(
      fits,
      "long credit at 200% text stays on one scalable, horizontally scrollable line",
    );
    await link.focus();
    await page.keyboard.press(`Shift+${tab}`);
    assert.ok(
      await region
        .getByRole("group", { name: "Map attribution" })
        .evaluate((node) => node === document.activeElement),
      "an overflowing credit line is a named stop a keyboard can scroll",
    );
    await link.focus();
    assert.ok(
      await link.evaluate((node) => node === document.activeElement),
      "overflowing credit remains keyboard reachable",
    );
    if (browser.browserType().name() === "chromium") {
      await page.emulateMedia({ forcedColors: "active" });
      assert.equal(
        await region
          .locator("li")
          .first()
          .evaluate((node) => getComputedStyle(node).textShadow),
        "none",
      );
      assert.notEqual(
        await region.evaluate((node) => getComputedStyle(node).backgroundColor),
        "rgba(0, 0, 0, 0)",
      );
      assert.equal(await region.getByRole("link").count(), 1);
    }
    await page.close();
    console.log(
      "PASS MapAttribution branding, links and single-line scrolling",
      dir,
    );
  }
} finally {
  await browser.close();
}
