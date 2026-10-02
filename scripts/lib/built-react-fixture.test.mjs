import assert from "node:assert/strict";
import test from "node:test";
import { launchFixtureBrowser } from "./built-react-fixture.mjs";

test("an unknown pointer cannot silently select an input profile", async () => {
  await assert.rejects(
    launchFixtureBrowser({ pointer: "trackpadd" }),
    /Unsupported fixture pointer/,
  );
});

test("Firefox explicitly models mouse hover and coarse no-hover input", async () => {
  const previous = process.env.ADAPTIVE_BROWSER;
  process.env.ADAPTIVE_BROWSER = "firefox";
  try {
    for (const pointer of ["mouse", "touch"]) {
      const browser = await launchFixtureBrowser({ pointer });
      try {
        const page = await browser.newPage({ hasTouch: pointer === "touch" });
        assert.deepEqual(
          await page.evaluate(() => ({
            fineHover: matchMedia("(hover: hover) and (pointer: fine)").matches,
            coarseNoHover: matchMedia("(hover: none) and (pointer: coarse)")
              .matches,
          })),
          {
            fineHover: pointer === "mouse",
            coarseNoHover: pointer === "touch",
          },
        );
      } finally {
        await browser.close();
      }
    }
  } finally {
    if (previous === undefined) delete process.env.ADAPTIVE_BROWSER;
    else process.env.ADAPTIVE_BROWSER = previous;
  }
});

test("an explicit Firefox request actually launches Firefox", async () => {
  const previous = process.env.ADAPTIVE_BROWSER;
  process.env.ADAPTIVE_BROWSER = "firefox";
  let browser;
  try {
    browser = await launchFixtureBrowser();
    assert.equal(browser.browserType().name(), "firefox");
  } finally {
    await browser?.close();
    if (previous === undefined) delete process.env.ADAPTIVE_BROWSER;
    else process.env.ADAPTIVE_BROWSER = previous;
  }
});

test("an unknown browser name cannot silently run Chromium", async () => {
  const previous = process.env.ADAPTIVE_BROWSER;
  process.env.ADAPTIVE_BROWSER = "firfox";
  let browser;
  try {
    await assert.rejects(async () => {
      browser = await launchFixtureBrowser();
    }, /Unsupported ADAPTIVE_BROWSER/);
  } finally {
    await browser?.close();
    if (previous === undefined) delete process.env.ADAPTIVE_BROWSER;
    else process.env.ADAPTIVE_BROWSER = previous;
  }
});
