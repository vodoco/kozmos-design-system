import assert from "node:assert/strict";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { launchFixtureBrowser } from "./lib/built-react-fixture.mjs";

const base = process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006";
const browser = await launchFixtureBrowser();
const output = `test-results/route-setup/${process.env.ADAPTIVE_BROWSER ?? "chromium"}`;
fs.mkdirSync(output, { recursive: true });
try {
  for (const width of [320, 1280])
    for (const theme of ["light", "dark"]) {
      for (const story of [
        "locations",
        "pending",
        "map-confirmation",
        "invalid-map-point",
        "standalone",
        "long-labels",
      ]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        await page.goto(
          `${base}/iframe.html?id=map-routesetuppanel--${story}&viewMode=story&globals=theme:${theme};a11y.manual:!true`,
        );
        const panel = page.locator("section[data-presentation]");
        await panel.waitFor();
        const proceed = panel.getByRole("button").last();
        assert.equal(
          await proceed.isDisabled(),
          ["pending", "invalid-map-point", "long-labels"].includes(story),
        );
        assert.equal(
          await panel.getByRole("button").first().isEnabled(),
          true,
          "Cancel must remain available",
        );
        if (story === "locations") {
          await page.getByRole("button", { name: "Clear origin" }).click();
          assert.equal(await proceed.isDisabled(), true);
          const input = page.getByRole("combobox", { name: "From" });
          await input.fill("North");
          assert.equal(
            await proceed.isDisabled(),
            true,
            "typed query is not a resolved origin",
          );
          await input.press("ArrowDown");
          await input.press("Enter");
          assert.equal(await proceed.isEnabled(), true);
        }
        for (const dir of ["ltr", "rtl"]) {
          await page.evaluate((direction) => {
            document.documentElement.dir = direction;
            document.documentElement.style.fontSize = "200%";
          }, dir);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            `${story}: overflow`,
          );
          for (const button of await panel.getByRole("button").all()) {
            const rect = await button.boundingBox();
            assert.ok(
              rect.width >= 44 && rect.height >= 44,
              `${story}: target ${rect.width}×${rect.height}`,
            );
          }
          assert.ok(
            await proceed.evaluate((node) => {
              const range = document.createRange();
              range.selectNodeContents(node);
              const content = range.getBoundingClientRect();
              const button = node.getBoundingClientRect();
              return (
                content.top >= button.top && content.bottom <= button.bottom
              );
            }),
            "Continue label must fit inside its hit area at enlarged text",
          );
          assert.ok(
            await proceed.evaluate((node) => {
              const parent = node.parentElement;
              const style = getComputedStyle(parent);
              return (
                node.getBoundingClientRect().width >=
                parent.clientWidth -
                  parseFloat(style.paddingLeft) -
                  parseFloat(style.paddingRight) -
                  1
              );
            }),
            "Continue must use the available width",
          );
        }
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
          `${story}: axe`,
        );
        await page.screenshot({
          path: `${output}/${story}-${theme}-${width}.png`,
          fullPage: true,
        });
        console.log(`ok RouteSetupPanel ${story} ${theme} ${width}`);
        await context.close();
      }
    }
} finally {
  await browser.close();
}
