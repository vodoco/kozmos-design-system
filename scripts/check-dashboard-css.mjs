/**
 * The Dashboard modules' sheet in a browser (decision 183): what
 * @kozmos-ds/react/dashboard draws with dashboard.css loaded after style.css,
 * from the built package, as an app loads them. Run twice, as
 * check-owned-css.mjs runs, the second time with every @scope rule removed
 * from style.css: a module's promises live in owned rules, so they hold in a
 * browser that drops the utility layer. ADAPTIVE_BROWSER picks the engine.
 *
 * BrandLoader (CLOUD-UI-008): a 120 box; two rings in theme 500 (decision
 * 176), 6 and 4 thick, rippling; a 32 pin; the label heard, never seen. Under
 * reduced motion, still: one ring at rest, 108 round, the pin upright. As an
 * overlay, the window covered and the page under it inert.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("dashboard-host.tsx");
const dashboardCss = fs.readFileSync(
  path.join(process.cwd(), "packages/react/dist/dashboard.css"),
  "utf8",
);
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const postcss = require("postcss");
const unscoped = postcss.parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

const browser = await launchFixtureBrowser();
const passed = [];
try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ])
    for (const motion of ["no-preference", "reduce"]) {
      const page = await browser.newPage({
        viewport: { width: 800, height: 600 },
        reducedMotion: motion,
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setContent(
        '<!doctype html><html><head></head><body><div id="fixture"></div></body></html>',
      );
      await page.addStyleTag({ content: stylesheet });
      await page.addStyleTag({ content: dashboardCss });
      await page.addScriptTag({ content: code });
      await page.getByTestId("light").waitFor();
      await settleLayout(page);
      const read = (id) =>
        page.getByTestId(id).evaluate((root) => {
          const box = (node) => {
            const r = node.getBoundingClientRect();
            return { width: r.width, height: r.height };
          };
          const style = (node) => getComputedStyle(node);
          const theme500 = (() => {
            const probe = document.createElement("span");
            probe.style.color = "var(--primitives-colors-theme-500)";
            root.append(probe);
            const colour = style(probe).color;
            probe.remove();
            return colour;
          })();
          const [first, second] = root.querySelectorAll(
            ".kozmos-brand-loader-ring",
          );
          const pin = root.querySelector(".kozmos-brand-loader-pin");
          const label = root.querySelector(".kozmos-brand-loader-label");
          return {
            box: box(root),
            theme500,
            ring: {
              colour: style(first).borderTopColor,
              width: style(first).borderTopWidth,
              animation: style(first).animationName,
              opacity: style(first).opacity,
              box: box(first),
            },
            second: {
              width: style(second).borderTopWidth,
              display: style(second).display,
              delay: style(second).animationDelay,
            },
            // Its laid-out size: a wobbling pin's bounding box is turned.
            pin: {
              box: {
                width: parseFloat(style(pin).width),
                height: parseFloat(style(pin).height),
              },
              animation: style(pin).animationName,
            },
            label: { box: box(label), text: label.textContent },
          };
        });
      const where = `${mode}, ${motion}`;
      for (const id of ["light", "dark"]) {
        const drawn = await read(id);
        assert.deepEqual(
          drawn.box,
          { width: 120, height: 120 },
          `${where} ${id}: the box`,
        );
        assert.equal(
          drawn.ring.colour,
          drawn.theme500,
          `${where} ${id}: the ring is theme 500`,
        );
        assert.equal(drawn.ring.width, "6px", `${where} ${id}: the first ring`);
        assert.deepEqual(
          drawn.pin.box,
          { width: 32, height: 32 },
          `${where} ${id}: the pin`,
        );
        assert.equal(
          drawn.label.text,
          "Loading Pointr Cloud",
          `${where} ${id}: the label`,
        );
        assert.ok(
          drawn.label.box.width <= 1 && drawn.label.box.height <= 1,
          `${where} ${id}: the label is not seen`,
        );
        if (motion === "reduce") {
          assert.equal(
            drawn.ring.animation,
            "none",
            `${where} ${id}: the ring stands still`,
          );
          assert.equal(
            drawn.pin.animation,
            "none",
            `${where} ${id}: the pin stands still`,
          );
          assert.equal(
            drawn.ring.opacity,
            "1",
            `${where} ${id}: the still ring is seen`,
          );
          assert.deepEqual(
            drawn.ring.box,
            { width: 108, height: 108 },
            `${where} ${id}: the still ring at rest`,
          );
          assert.equal(
            drawn.second.display,
            "none",
            `${where} ${id}: one ring when still`,
          );
        } else {
          assert.equal(
            drawn.ring.animation,
            "kozmos-brand-loader-ripple",
            `${where} ${id}: the ring ripples`,
          );
          assert.equal(
            drawn.pin.animation,
            "kozmos-brand-loader-wobble",
            `${where} ${id}: the pin wobbles`,
          );
          assert.equal(
            drawn.second.width,
            "4px",
            `${where} ${id}: the second ring`,
          );
          assert.equal(
            drawn.second.delay,
            "-0.5s",
            `${where} ${id}: the second ring half a second ahead`,
          );
        }
      }
      // The overlay covers the window, the loader in its middle, and the
      // page under it is inert.
      const overlay = await page
        .locator(".kozmos-brand-loader-overlay")
        .evaluate((scrim) => {
          const r = scrim.getBoundingClientRect();
          const loader = scrim
            .querySelector(".kozmos-brand-loader")
            .getBoundingClientRect();
          return {
            covers: {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            },
            centre: [
              loader.left + loader.width / 2,
              loader.top + loader.height / 2,
            ],
            hit:
              document
                .elementFromPoint(5, 5)
                ?.closest(".kozmos-brand-loader-overlay") === scrim,
            cursor: getComputedStyle(scrim).cursor,
          };
        });
      assert.deepEqual(
        overlay.covers,
        { left: 0, top: 0, width: 800, height: 600 },
        `${where}: the overlay covers the window`,
      );
      assert.deepEqual(
        overlay.centre,
        [400, 300],
        `${where}: the loader in the middle`,
      );
      assert.ok(overlay.hit, `${where}: the overlay takes the pointer`);
      assert.equal(overlay.cursor, "wait", `${where}: the overlay's pointer`);
      assert.ok(
        await page
          .getByTestId("under")
          .evaluate((node) => node.closest("[inert]") !== null),
        `${where}: the page under the overlay is inert`,
      );
      assert.deepEqual(errors, [], `${where}: page errors`);
      passed.push(where);
      await page.close();
    }
} finally {
  await browser.close();
}
console.log(
  `PASS dashboard.css in ${process.env.ADAPTIVE_BROWSER ?? "chromium"}: BrandLoader's box, rings, pin, label, stillness and overlay (${passed.join("; ")})`,
);
