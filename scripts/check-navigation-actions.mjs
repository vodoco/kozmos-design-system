import assert from "node:assert/strict";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const fixture = await buildReactFixture("navigation-actions-host.tsx");
const browser = await launchFixtureBrowser();
try {
  for (const action of ["arrival", "summary"])
    for (const direction of ["ltr", "rtl"])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width: 320, height: 900 },
        });
        await page.setContent(
          `<html dir="${direction}"><head></head><body style="margin:16px"><div id="root" data-kozmos-root class="${theme}"></div></body></html>`,
        );
        await page.addStyleTag({ content: fixture.css });
        await page.evaluate((value) => {
          window.navigationAction = value;
        }, action);
        await page.addScriptTag({ content: fixture.code });
        const button = page.getByRole("button");
        await button.waitFor();
        for (const fontSize of ["100%", "200%"]) {
          await page.evaluate((value) => {
            document.documentElement.style.fontSize = value;
          }, fontSize);
          await settleLayout(page);
          const bounds = await button.evaluate((node) => ({
            width: node.clientWidth,
            scrollWidth: node.scrollWidth,
            height: node.clientHeight,
            scrollHeight: node.scrollHeight,
            page: document.documentElement.scrollWidth,
            viewport: innerWidth,
          }));
          assert.ok(
            bounds.page <= bounds.viewport + 1 &&
              bounds.scrollWidth <= bounds.width + 1 &&
              bounds.scrollHeight <= bounds.height + 1,
            `${action} ${direction} ${theme} ${fontSize}: ${JSON.stringify(bounds)}`,
          );
        }
        await button.click();
        assert.deepEqual(
          await page.evaluate(() => [
            window.navigationDone,
            window.navigationSubmits,
          ]),
          [1, 0],
        );
        console.log(
          `ok ${action} ${direction} ${theme}: 320px, text 100/200%, host form`,
        );
        await page.close();
      }
} finally {
  await browser.close();
}
