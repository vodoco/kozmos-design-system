import assert from "node:assert/strict";
import { createRequire } from "node:module";
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

  // RouteSummary's actions (GAP-110, GAP-111): the host's two Buttons in the
  // slot's owned recipe. Run with the stylesheet as built and with its @scope
  // rules stripped, as a browser without @scope reads it: the recipe is the
  // slot's promise, so it must hold with the utility layer gone.
  const postcss = createRequire(`${process.cwd()}/packages/react/package.json`)(
    "postcss",
  );
  const unscoped = postcss.parse(fixture.css);
  unscoped.walkAtRules("scope", (rule) => rule.remove());
  for (const [mode, css] of [
    ["full", fixture.css],
    ["without-scope", unscoped.toString()],
  ])
    for (const action of ["summary-steps", "summary-preview"])
      for (const direction of ["ltr", "rtl"])
        for (const theme of ["light", "dark"]) {
          const label = `${action} ${mode} ${direction} ${theme}`;
          const page = await browser.newPage({
            viewport: { width: 320, height: 900 },
          });
          await page.setContent(
            `<!doctype html><html dir="${direction}"><head></head><body style="margin:16px"><div id="root" data-kozmos-root class="${theme}"></div></body></html>`,
          );
          await page.addStyleTag({ content: css });
          await page.evaluate((value) => {
            window.navigationAction = value;
          }, action);
          await page.addScriptTag({ content: fixture.code });
          const row = page.locator(".kozmos-route-summary-actions");
          await row.waitFor();
          const actions = row.getByRole("button");
          assert.equal(await actions.count(), 2, `${label}: two actions`);
          if (action === "summary-preview")
            assert.equal(
              await page.getByRole("button").count(),
              2,
              `${label}: the preview draws no End`,
            );
          for (const fontSize of ["100%", "200%"]) {
            await page.evaluate((value) => {
              document.documentElement.style.fontSize = value;
            }, fontSize);
            await settleLayout(page);
            const drawn = await row.evaluate((node) => ({
              page: document.documentElement.scrollWidth,
              viewport: innerWidth,
              row: node.getBoundingClientRect().width,
              actions: Array.from(node.children, (child) => {
                const box = child.getBoundingClientRect();
                return {
                  left: box.left,
                  width: box.width,
                  height: box.height,
                  scrollWidth: child.scrollWidth,
                  clientWidth: child.clientWidth,
                  opacity: getComputedStyle(child).opacity,
                  disabled: child.getAttribute("aria-disabled"),
                };
              }),
            }));
            const where = `${label} ${fontSize}: ${JSON.stringify(drawn)}`;
            const [first, second] = drawn.actions;
            assert.ok(drawn.page <= drawn.viewport + 1, `${where}: overflow`);
            for (const one of drawn.actions) {
              assert.ok(one.height >= 44 - 0.5, `${where}: under 44px`);
              assert.ok(
                one.scrollWidth <= one.clientWidth + 1,
                `${where}: a label overflows its button`,
              );
              // aria-disabled reads unavailable, at the disabled button's 50%.
              assert.equal(
                one.opacity,
                one.disabled === "true" ? "0.5" : "1",
                `${where}: opacity`,
              );
            }
            assert.ok(
              Math.abs(first.width - second.width) <= 1,
              `${where}: unequal columns`,
            );
            assert.ok(
              first.width + second.width > drawn.row * 0.9,
              `${where}: the actions do not fill the row`,
            );
            // Reading order: the first action at the inline start.
            assert.ok(
              direction === "rtl"
                ? first.left > second.left
                : first.left < second.left,
              `${where}: reading order`,
            );
          }
          if (action === "summary-steps") {
            // Previous from step 2 reaches step 1 and becomes unavailable:
            // the host's guarded aria-disabled keeps focus where it was.
            const previous = actions.first();
            await previous.focus();
            await page.keyboard.press("Enter");
            await settleLayout(page);
            assert.equal(
              await previous.getAttribute("aria-disabled"),
              "true",
              `${label}: Previous at the first step`,
            );
            assert.ok(
              await previous.evaluate(
                (node) => document.activeElement === node,
              ),
              `${label}: Previous lost focus at the first step`,
            );
            assert.deepEqual(
              await previous.evaluate((node) => {
                const style = getComputedStyle(node);
                return [style.opacity, style.cursor];
              }),
              ["0.5", "default"],
              `${label}: an aria-disabled action does not read unavailable`,
            );
            await page.keyboard.press("Enter");
            // Playwright waits for an aria-disabled control to be enabled; a
            // pointer press still reaches it, and the guard must refuse it.
            await previous.click({ force: true });
            assert.equal(
              await page.evaluate(() => window.navigationStep),
              0,
              `${label}: an unavailable Previous still moved`,
            );
            await actions.last().click();
            assert.equal(
              await page.evaluate(() => window.navigationStep),
              1,
              `${label}: Next did not move`,
            );
          } else {
            await actions.first().click();
            await actions.last().click();
            assert.equal(
              await page.evaluate(() => window.navigationDone),
              2,
              `${label}: Go and Details`,
            );
          }
          assert.equal(
            await page.evaluate(() => window.navigationSubmits),
            0,
            `${label}: an action submitted the host form`,
          );
          console.log(
            `ok ${label}: 320px, text 100/200%, 44px, equal columns, reading order, host form`,
          );
          await page.close();
        }
} finally {
  await browser.close();
}
