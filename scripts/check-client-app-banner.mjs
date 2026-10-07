import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

// GAP-127: ClientAppBanner in a real browser, on the built package, with and
// without every @scope rule. A host without @scope drops the utility layer,
// and the banner promises that its layout holds there too: it is owned CSS.
//
// At 320, 390 and 600 wide, text at 100% and 200%, left to right and right to
// left, the banner never makes the page scroll sideways; its icon is the 48
// square the natives draw, cropped, never stretched, with its corner and edge,
// whatever size the customer's image is; dismiss is the 44 target and the
// action at least 44; and it reads, and is laid out, in one order: the
// promotion, the name and the description, then the action, then dismiss.
// Where the action does not fit beside the words it goes under the icon and
// the words, so the words keep the width beside the icon.
const fixture = await buildReactFixture("client-app-banner.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const scopeFree = require("postcss").parse(fixture.css);
scopeFree.walkAtRules("scope", (rule) => rule.remove());

const READS = [
  "Northfield's own app",
  "Northfield Airport",
  "Live gate changes, step-free routes and your boarding pass, on your phone.",
  "button: Get the app",
];

const browser = await launchFixtureBrowser();
try {
  for (const [mode, stylesheet] of [
    ["full", fixture.css],
    ["without-scope", scopeFree.toString()],
  ])
    for (const dir of ["ltr", "rtl"]) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 900 },
        reducedMotion: "reduce",
      });
      await page.setContent(
        `<!doctype html><html dir="${dir}"><body style="margin:0"><div id="root"></div></body></html>`,
      );
      await page.addStyleTag({ content: stylesheet });
      await page.addScriptTag({ content: fixture.code });
      for (const width of [320, 390, 600])
        for (const fontSize of ["100%", "200%"])
          for (const [icon, dismiss] of [
            ["large", true],
            ["wide", true],
            ["none", true],
            ["large", false],
          ]) {
            const where = `${mode} ${dir} ${width}px text ${fontSize} icon=${icon}${dismiss ? "" : " no dismiss"}`;
            await page.setViewportSize({ width, height: 900 });
            await page.evaluate((value) => {
              document.documentElement.style.fontSize = value;
            }, fontSize);
            await page.evaluate(
              (config) => window.renderClientAppBanner(config),
              { dir, icon, dismiss },
            );
            if (icon !== "none")
              await page.waitForFunction(
                (natural) =>
                  document.querySelector(".kozmos-client-app-banner-icon img")
                    ?.naturalWidth === natural,
                icon === "large" ? 1024 : 200,
              );
            await settleLayout(page);
            const m = await page.evaluate(() => {
              const box = (node) =>
                node ? node.getBoundingClientRect().toJSON() : null;
              const banner = document.querySelector(
                ".kozmos-client-app-banner",
              );
              const icon = banner.querySelector(
                ".kozmos-client-app-banner-icon",
              );
              const image = icon.querySelector("img");
              const initial = image ? null : icon.firstElementChild;
              let glyph = null;
              if (initial?.firstChild) {
                const range = document.createRange();
                range.selectNodeContents(initial);
                glyph = range.getBoundingClientRect().toJSON();
              }
              const read = [];
              const walker = document.createTreeWalker(
                banner,
                NodeFilter.SHOW_ELEMENT,
              );
              for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                if (n.closest("[aria-hidden='true']")) continue;
                if (n.tagName === "BUTTON")
                  read.push(
                    `button: ${n.getAttribute("aria-label") ?? n.textContent}`,
                  );
                else if (n.tagName === "P") read.push(n.textContent);
              }
              const iconStyle = getComputedStyle(icon);
              const bannerStyle = getComputedStyle(banner);
              const root = banner.closest("[data-kozmos-root]");
              return {
                page: document.documentElement.scrollWidth,
                viewport: innerWidth,
                rem: parseFloat(
                  getComputedStyle(document.documentElement).fontSize,
                ),
                banner: box(banner),
                bannerScroll: banner.scrollWidth,
                bannerClient: banner.clientWidth,
                padStart: parseFloat(bannerStyle.paddingInlineStart),
                padEnd: parseFloat(bannerStyle.paddingInlineEnd),
                icon: box(icon),
                iconBorder: [
                  iconStyle.borderTopWidth,
                  iconStyle.borderTopStyle,
                ],
                iconRadius: iconStyle.borderStartStartRadius,
                iconOverflow: iconStyle.overflowX,
                controlRadius: `${parseFloat(
                  getComputedStyle(root).getPropertyValue(
                    "--semantics-radius-control",
                  ),
                )}px`,
                image: box(image),
                imageFit: image ? getComputedStyle(image).objectFit : null,
                initial: box(initial),
                glyph,
                words: box(
                  banner.querySelector(".kozmos-client-app-banner-text"),
                ),
                action: box(
                  banner.querySelector(".kozmos-client-app-banner-action"),
                ),
                dismiss: box(
                  banner.querySelector(".kozmos-client-app-banner-dismiss"),
                ),
                read,
              };
            });
            const say = `${where}: ${JSON.stringify(m)}`;
            // Logical positions: along the line the words are read in.
            const start = (r) => (dir === "ltr" ? r.left : -r.right);
            const end = (r) => (dir === "ltr" ? r.right : -r.left);
            const near = (a, b, by = 1) => Math.abs(a - b) <= by;

            // Nothing scrolls sideways: not the page, not the banner, and
            // every part sits inside the banner.
            assert.ok(
              m.page <= m.viewport,
              `the page scrolls sideways at ${say}`,
            );
            assert.ok(
              m.bannerScroll <= m.bannerClient + 1,
              `the banner overflows at ${say}`,
            );
            for (const part of ["icon", "words", "action", "dismiss"])
              if (m[part])
                assert.ok(
                  m[part].left >= m.banner.left - 0.5 &&
                    m[part].right <= m.banner.right + 0.5,
                  `the ${part} leaves the banner at ${say}`,
                );

            // The icon: the 48 square the natives draw at every text size,
            // the Control corner, the 1px edge, and what is inside it cropped.
            assert.ok(
              near(m.icon.width, 48, 0.5) && near(m.icon.height, 48, 0.5),
              `the icon is ${m.icon.width}x${m.icon.height}, not 48, at ${say}`,
            );
            assert.deepEqual(
              m.iconBorder,
              ["1px", "solid"],
              `the icon's edge at ${say}`,
            );
            assert.equal(
              m.iconRadius,
              m.controlRadius,
              `the icon's corner at ${say}`,
            );
            assert.equal(m.iconOverflow, "hidden", `the icon clips at ${say}`);
            if (icon === "none") {
              // Rendered after an icon had loaded: the initial comes back.
              assert.ok(
                m.initial &&
                  m.glyph &&
                  near(m.initial.width, 46, 0.5) &&
                  near(m.initial.height, 46, 0.5),
                `the initial does not fill the icon at ${say}`,
              );
              const centre = (r) => [
                (r.left + r.right) / 2,
                (r.top + r.bottom) / 2,
              ];
              const [gx, gy] = centre(m.glyph ?? m.icon);
              const [ix, iy] = centre(m.icon);
              assert.ok(
                near(gx, ix, 2) && near(gy, iy, 3),
                `the initial is not centred in the icon at ${say}`,
              );
            } else {
              assert.ok(
                near(m.image.width, 46, 0.5) && near(m.image.height, 46, 0.5),
                `the image is ${m.image.width}x${m.image.height} at ${say}`,
              );
              assert.equal(
                m.imageFit,
                "cover",
                `the image is stretched, not cropped, at ${say}`,
              );
            }

            // Targets: dismiss is the 44 square at every text size; the
            // action is at least 44, and its words wrap at most once.
            if (dismiss)
              assert.ok(
                near(m.dismiss.width, 44, 0.5) &&
                  near(m.dismiss.height, 44, 0.5),
                `dismiss is ${m.dismiss.width}x${m.dismiss.height}, not 44, at ${say}`,
              );
            else assert.equal(m.dismiss, null, `a dismiss button at ${say}`);
            assert.ok(
              m.action.width >= 43.5 && m.action.height >= 43.5,
              `the action is under 44 at ${say}`,
            );
            assert.ok(
              m.action.height <= 1.5 * Math.max(44, 2.75 * m.rem),
              `the action's words break over ${m.action.height}px at ${say}`,
            );

            // One order, read and seen: the words after the icon, the action
            // after the words, dismiss last, at the top end.
            assert.deepEqual(
              m.read,
              dismiss ? [...READS, "button: Dismiss"] : READS,
              `the reading order at ${say}`,
            );
            assert.ok(
              end(m.icon) <= start(m.words) + 0.5,
              `the words do not follow the icon at ${say}`,
            );
            const stacked = m.action.top >= m.words.bottom - 0.5;
            assert.equal(
              stacked,
              !(width === 600 && fontSize === "100%"),
              `the action is ${stacked ? "under" : "beside"} the words at ${say}`,
            );
            const inner = m.bannerClient - m.padStart - m.padEnd;
            // Beside the icon (48, 12 from the words) and dismiss (its 44
            // pulled 12 into the padding, 12 from the words), the rest is
            // the words', or the words' and the action's.
            const beside = inner - 48 - 12 - (dismiss ? 44 : 0);
            if (stacked) {
              assert.ok(
                m.action.top >= m.icon.bottom - 0.5,
                `the action is not under the icon at ${say}`,
              );
              assert.ok(
                near(start(m.action), start(m.icon)) &&
                  near(end(m.action), end(m.words)),
                `the action does not span the icon and the words at ${say}`,
              );
              assert.ok(
                m.words.width >= beside - 1,
                `the words get ${m.words.width} of ${beside}px at ${say}`,
              );
            } else {
              assert.ok(
                start(m.action) >= end(m.words) - 0.5 &&
                  m.action.top < m.words.bottom,
                `the action is not after the words at ${say}`,
              );
            }
            if (dismiss) {
              assert.ok(
                m.dismiss.top < m.words.top &&
                  start(m.dismiss) >= end(stacked ? m.words : m.action) - 0.5,
                `dismiss is not at the top end at ${say}`,
              );
              assert.ok(
                near(m.dismiss.top - m.banner.top, 4) &&
                  near(end(m.banner) - end(m.dismiss), 4),
                `dismiss is not 4 from the top and end at ${say}`,
              );
            }
            if (icon === "large" && dismiss)
              console.log(
                `ok ${mode} ${dir} ${width}px text ${fontSize}: ${
                  stacked ? "stacked" : "side by side"
                }, words ${Math.round(m.words.width)}px, action ${Math.round(
                  m.action.width,
                )}x${Math.round(m.action.height)}, banner ${Math.round(
                  m.banner.height,
                )}px tall`,
              );
          }
      await page.close();
    }
  console.log(
    "ok ClientAppBanner: 320/390/600px, text 100/200%, ltr/rtl, with and without @scope",
  );
} finally {
  await browser.close();
}
