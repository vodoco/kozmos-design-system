import assert from "node:assert/strict";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
try {
  for (const width of [320, 1280]) {
    for (const theme of ["light", "dark"]) {
      const itineraryPage = await browser.newPage({
        viewport: { width, height: 800 },
      });
      await itineraryPage.goto(
        `${base}/iframe.html?id=map-itinerary--long-endpoints&viewMode=story&globals=theme:${theme}`,
      );
      await itineraryPage.getByRole("region", { name: "Itinerary" }).waitFor();
      for (const direction of ["ltr", "rtl"]) {
        await itineraryPage.evaluate((dir) => {
          document.documentElement.dir = dir;
          document.documentElement.style.fontSize = "200%";
        }, direction);
        for (const span of await itineraryPage
          .locator(".kozmos-itinerary li > span")
          .all()) {
          const geometry = await span.evaluate((node) => ({
            width: node.clientWidth,
            scroll: node.scrollWidth,
          }));
          assert.ok(
            geometry.scroll <= geometry.width + 1,
            `endpoint overflow ${JSON.stringify(geometry)}`,
          );
        }
      }
      await itineraryPage.close();
      for (const story of [
        "map-routinginputgroup--default",
        "map-routinginputgroup--with-stop",
        "components-wayfindingcard--default",
        "components-combobox--default",
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 },
        });
        await page.goto(
          `${base}/iframe.html?id=${story}&viewMode=story&globals=theme:${theme}`,
        );
        await page.locator("input").first().waitFor();
        const buttons = page.getByRole("button");
        assert.ok((await buttons.count()) > 0);
        for (const button of await buttons.all()) {
          const bounds = await button.boundingBox();
          const name = await button.getAttribute("aria-label");
          assert.ok(
            bounds.width >= 44 && bounds.height >= 44,
            `${story} ${name}: ${bounds.width}×${bounds.height}`,
          );
        }
        console.log(`ok ${story} ${theme} ${width}`);
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
