import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const fixture = await buildReactFixture("panel-spacing.fixture.tsx");
const browser = await launchFixtureBrowser();
const near = (value, expected, name) =>
  assert.ok(
    Math.abs(value - expected) <= 1,
    `${name}: ${value}, expected ${expected}`,
  );
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent('<div id="root"></div>');
  await page.addStyleTag({ content: fixture.css });
  await page.addScriptTag({ content: fixture.code });
  for (const side of [false, true])
    for (const header of [false, true])
      for (const grip of [false, true])
        for (const long of [false, true])
          for (const rtl of [false, true])
            for (const details of [false, true]) {
              if (details && long) continue;
              const config = { side, header, grip, long, rtl, details };
              await page.evaluate(
                (config) => window.renderPanelSpacing(config),
                config,
              );
              await page.getByRole("complementary").waitFor();
              await settleLayout(page);
              const boxes = await page.evaluate(() => {
                const panel = document.querySelector("aside");
                const scroller = panel.querySelector("[data-kozmos-scroller]");
                const header = panel.querySelector("[data-spacing-header]");
                const first =
                  panel.querySelector("[data-spacing-content]") ??
                  panel.querySelector('button[aria-label="Close details"]');
                if (!first) throw new Error("Missing first content target");
                return {
                  first: first.getBoundingClientRect().top,
                  top: panel.getBoundingClientRect().top + panel.clientTop,
                  headerBottom: header?.getBoundingClientRect().bottom,
                  height: panel.getBoundingClientRect().height,
                  scrollHeight: scroller.scrollHeight,
                  clientHeight: scroller.clientHeight,
                };
              });
              near(
                boxes.first - (boxes.headerBottom ?? boxes.top),
                16,
                JSON.stringify(config),
              );
              if (!details && !long) {
                const top = 16;
                const headerHeight = header
                  ? 44 + 16 + (grip && !side ? 4 : 0)
                  : 0;
                near(
                  boxes.height,
                  300 + top + headerHeight + 2,
                  "content-fit includes shell spacing",
                );
                near(
                  boxes.scrollHeight,
                  boxes.clientHeight,
                  "fitted content is neither clipped nor padded twice",
                );
              }
              if (long) {
                assert.ok(
                  boxes.scrollHeight > boxes.clientHeight,
                  "long content remains scrollable",
                );
                await page
                  .locator("[data-kozmos-scroller]")
                  .evaluate((node) => {
                    node.scrollTop = 100;
                  });
                await settleLayout(page);
                assert.ok(
                  await page
                    .locator("[data-kozmos-scroller]")
                    .evaluate((node) => node.scrollTop > 0),
                );
                if (header)
                  near(
                    await page
                      .locator("[data-spacing-header]")
                      .evaluate((node) => node.getBoundingClientRect().bottom),
                    boxes.headerBottom,
                    "header remains fixed during content scrolling",
                  );
              }
              console.log("PASS P02 spacing", JSON.stringify(config));
            }
  // Keep the same shell mounted: changing content must shrink the fitted
  // panel again, not retain the previous scroller's allocated height.
  for (const header of [false, true]) {
    const config = {
      instance: `resize-${header}`,
      side: false,
      header,
      grip: true,
      long: true,
      rtl: false,
      details: false,
    };
    await page.evaluate((config) => window.renderPanelSpacing(config), config);
    await settleLayout(page);
    await page.evaluate(
      (config) => window.renderPanelSpacing({ ...config, long: false }),
      config,
    );
    await settleLayout(page);
    near(
      await page
        .locator("aside")
        .evaluate((node) => node.getBoundingClientRect().height),
      header ? 382 : 318,
      "mounted fitted panel shrinks when content changes",
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
