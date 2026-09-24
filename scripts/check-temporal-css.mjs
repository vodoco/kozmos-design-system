import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("temporal-fields-host.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const root = require("postcss").parse(css);
root.walkAtRules("scope", (rule) => rule.remove());
const browser = await launchFixtureBrowser();
try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", root.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 900 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      '<!doctype html><style>body{margin:0} input{padding:0;border-radius:2px;background:orange} label{font-size:30px} svg{width:70px;height:70px}</style><div id="fixture"></div>',
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await page.getByLabel("outer date", { exact: true }).waitFor();
    await settleLayout(page);
    for (const id of ["outer", "nested"]) {
      const rtl = id === "outer";
      for (const label of ["date", "time", "arrival", "departure"]) {
        const field = page.getByLabel(`${id} ${label}`, { exact: true });
        const styles = await field.evaluate((n, rtl) => {
          const s = getComputedStyle(n),
            icon = n.parentElement.querySelector("svg"),
            iconRect = icon.getBoundingClientRect(),
            r = n.getBoundingClientRect();
          return {
            height: r.height,
            // Native date segments may expose an internal LTR computed direction
            // even in an RTL field. Verify the physical edge beside our icon.
            padding: rtl ? s.paddingRight : s.paddingLeft,
            radius: s.borderRadius,
            iconWidth: iconRect.width,
            iconHeight: iconRect.height,
            left: iconRect.left - r.left,
            right: r.right - iconRect.right,
            centerOffset:
              iconRect.top + iconRect.height / 2 - (r.top + r.height / 2),
          };
        }, rtl);
        assert.equal(styles.height, 44, `${mode}/${id}/${label} height`);
        assert.equal(
          styles.padding,
          "36px",
          `${mode}/${id}/${label} leading padding`,
        );
        assert.equal(styles.radius, "16px");
        assert.equal(
          styles.iconWidth,
          16,
          "owned icon width overrides host SVG reset",
        );
        assert.equal(styles.iconHeight, 16);
        assert.equal(
          styles.centerOffset,
          0,
          `${mode}/${id}/${label} vertical icon center`,
        );
        assert.equal(
          rtl ? styles.right : styles.left,
          12,
          `${mode}/${id}/${label} logical icon inset`,
        );
        await page.keyboard.press("Tab");
        await field.focus();
        assert.notEqual(
          await field.evaluate((n) => getComputedStyle(n).boxShadow),
          "none",
          `${mode}/${id}/${label} keyboard focus indicator`,
        );
      }
      const arrival = page.getByLabel(`${id} arrival`),
        departure = page.getByLabel(`${id} departure`);
      const before = [
        await arrival.boundingBox(),
        await departure.boundingBox(),
      ];
      assert.equal(before[0].y, before[1].y, "wide container uses two columns");
      await page.getByTestId(id).evaluate((n) => (n.style.width = "220px"));
      await settleLayout(page);
      const after = [
        await arrival.boundingBox(),
        await departure.boundingBox(),
      ];
      assert(
        after[1].y > after[0].y,
        "narrow container stacks regardless of viewport width",
      );
      assert(
        await page
          .getByTestId(id)
          .evaluate((n) => n.scrollWidth <= n.clientWidth),
        "no clipped native fields",
      );
      assert(await page.getByLabel(`${id} disabled`).isDisabled());
      assert.equal(
        await page.getByLabel(`${id} readonly`).getAttribute("readonly"),
        "",
      );
      assert.equal(
        await page.getByLabel(`${id} error`).getAttribute("aria-invalid"),
        "true",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      `PASS temporal ${mode}: nested themes, native inputs, focus, logical icons and container reflow`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
