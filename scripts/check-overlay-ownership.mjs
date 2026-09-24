import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("overlay-host.tsx");
const browser = await launchFixtureBrowser();
let failures = 0;
try {
  for (const { name, owned, provider } of [
    "popover",
    "dialog",
    "drawer",
    "bottomsheet",
    "menu",
    "select",
    "tooltip",
  ].flatMap((name) => [
    { name, owned: true },
    { name, owned: false },
    { name, owned: false, provider: true },
  ])) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 800 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.setContent(
        `<!doctype html><html data-theme="light"><head><style>${css}</style></head><body data-kozmos-root data-theme="light"><div id="fixture"></div><div id="owned-portal" data-theme="dark" dir="rtl" style="--primitives-colors-background-0:rgb(12, 34, 56)"></div></body></html>`,
      );
      await page.addScriptTag({
        content: `window.overlayUseDefault = ${!owned}; window.overlayUseProvider = ${!!provider};`,
      });
      await page.addScriptTag({ content: code });
      const trigger = page.getByRole(
        name === "select" ? "combobox" : "button",
        { name: `Open ${name}`, exact: true },
      );
      if (name === "tooltip") await trigger.hover();
      else await trigger.click();
      const content = page.getByTestId(name);
      await content.waitFor();
      await settleLayout(page);
      assert.equal(
        await content.evaluate((node) =>
          document.getElementById("owned-portal").contains(node),
        ),
        owned,
        `${name} did not use the intended container`,
      );
      if (provider) {
        assert.equal(
          await content.evaluate(
            (node) =>
              !!node.closest(
                '[data-kozmos-portal][data-theme="dark"][dir="rtl"]',
              ),
          ),
          true,
          "provider did not own the overlay",
        );
        if (name === "select" || name === "menu")
          assert.equal(
            await content.getAttribute("dir"),
            "rtl",
            "Radix direction did not follow provider",
          );
      }
      if (!owned && !provider)
        assert.equal(
          await content.evaluate((node) =>
            document.getElementById("fixture").contains(node),
          ),
          name === "tooltip",
          "default inline/body placement changed",
        );
      assert.equal(
        await content.evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
        owned || provider ? "rgb(12, 34, 56)" : "rgb(255, 255, 255)",
        "portal content did not inherit expected tokens",
      );
      // Radix directional navigation is configured on Root separately; CSS ownership alone
      // is not a claim that a portal automatically configures Radix's logical navigation.
      assert.equal(
        await content.getAttribute("portalContainer"),
        null,
        "portal prop leaked to DOM",
      );
      await page.keyboard.press("Escape");
      await content.waitFor({ state: "hidden" });
      if (name !== "tooltip")
        await page.waitForFunction(
          (node) => node === document.activeElement,
          await trigger.elementHandle(),
          { timeout: 1500 },
        );
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${name} ${provider ? "provider" : owned ? "owned" : "default"} container, tokens and dismissal`,
      );
    } catch (error) {
      failures++;
      console.error(
        `FAIL ${name} ${provider ? "provider" : owned ? "owned" : "default"}: ${error.message}`,
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exitCode = failures ? 1 : 0;
