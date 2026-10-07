/**
 * Decision 59 (Olcay, 2026-10-07), on the built React package in a real
 * browser: every prominent fill computes theme 500, the client's base colour
 * (#135BEC), with the theme foreground on it, white, in a light AND a dark
 * root; and the theme as text, a border or a ring on a surface stays theme
 * 600, #1051E8 in the light and #5887F3 in the dark.
 *
 * Until then the fills were theme 600 or the Button's 700 token, and the ink
 * on them foreground/1000, black in the dark (3.74:1 on 500). Reads computed
 * colours, normalised through a canvas so every engine's notation compares.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-theme-fill.mjs
 */
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const THEME_FILL = [19, 91, 236]; // #135BEC, both themes
const THEME_FOREGROUND = [255, 255, 255]; // white, both themes
const THEME_600 = { light: [16, 81, 232], dark: [88, 135, 243] };
const THEME_0 = { light: [241, 245, 254], dark: [5, 28, 79] };

/**
 * What to read: a part, the element inside its test id that draws it (a CSS
 * selector, or "" for the element itself), the property, and what it must
 * be. "fill" and "ink" are the theme fill and foreground; "600" and "tint"
 * the theme's 600 and 0 steps, which turn over with the theme.
 */
const READS = [
  // Prominent fills (decision 59: move to 500, white on them).
  ["button", "", "backgroundColor", "fill"],
  ["button", "", "color", "ink"],
  ["icon-button", "", "backgroundColor", "fill"],
  ["icon-button", "", "color", "ink"],
  ["fab", "", "backgroundColor", "fill"],
  ["fab", "", "color", "ink"],
  ["split-button", "button", "backgroundColor", "fill"],
  ["split-button", "button", "color", "ink"],
  ["checkbox", "", "backgroundColor", "fill"],
  ["checkbox", "", "borderTopColor", "fill"],
  ["checkbox", "svg", "color", "ink"],
  ["checkbox-mixed", "", "backgroundColor", "fill"],
  ["checkbox-mixed", "svg", "color", "ink"],
  ["switch", "", "backgroundColor", "fill"],
  ["switch", "span", "backgroundColor", "ink"],
  ["radio", "svg", "fill", "fill"],
  ["chip", '[data-slot="chip"]', "backgroundColor", "fill"],
  ["chip", '[data-slot="chip"]', "color", "ink"],
  ["tag", "", "backgroundColor", "fill"],
  ["tag", "", "color", "ink"],
  ["counter", "", "backgroundColor", "fill"],
  ["counter", "", "color", "ink"],
  ["badge", "", "backgroundColor", "fill"],
  ["badge", "", "color", "ink"],
  ["floors", 'button[aria-pressed="true"]', "backgroundColor", "fill"],
  ["floors", 'button[aria-pressed="true"]', "color", "ink"],
  [
    "floors",
    'button[aria-pressed="false"] [data-floor-selector-result-count]',
    "backgroundColor",
    "fill",
  ],
  [
    "floors",
    'button[aria-pressed="false"] [data-floor-selector-result-count]',
    "color",
    "ink",
  ],
  // On the selected tile, itself the theme fill, the count inverts (Olcay,
  // 2026-10-07): the theme foreground with the fill's number.
  [
    "floors",
    'button[aria-pressed="true"] [data-floor-selector-result-count]',
    "backgroundColor",
    "ink",
  ],
  [
    "floors",
    'button[aria-pressed="true"] [data-floor-selector-result-count]',
    "color",
    "fill",
  ],
  ["pin", '[role="img"] svg', "color", "fill"],
  ["pin", '[role="img"] span[aria-hidden="true"]', "color", "ink"],
  ["save", ".h-12.w-12", "backgroundColor", "fill"],
  ["save", ".h-12.w-12", "color", "ink"],
  ["category", '[data-slot="counter"]', "backgroundColor", "fill"],
  ["category", '[data-slot="counter"]', "color", "ink"],
  ["stepper", ".h-8.w-8", "backgroundColor", "fill"],
  ["stepper", ".h-8.w-8", "color", "ink"],
  ["toggle", "", "backgroundColor", "fill"],
  ["toggle", "", "color", "ink"],
  ["manoeuvre", ".kozmos-manoeuvre-card", "backgroundColor", "fill"],
  ["manoeuvre", ".kozmos-manoeuvre-instruction", "color", "ink"],
  ["user-message", ".rounded-container", "backgroundColor", "fill"],
  ["user-message", ".rounded-container", "color", "ink"],
  [
    "result",
    '.kozmos-poi-result-tab[data-tab="number"][data-selected]',
    "backgroundColor",
    "fill",
  ],
  [
    "result",
    '.kozmos-poi-result-tab[data-tab="number"][data-selected]',
    "color",
    "ink",
  ],
  // The theme on a surface stays 600 (decision 59: text, icons, borders).
  ["link", "", "color", "600"],
  ["text", "", "color", "600"],
  ["radio", "", "borderTopColor", "600"],
  ["category", '[aria-hidden="true"][style]', "color", "600"],
  ["stepper", ".h-\\[1px\\]", "backgroundColor", "600"],
  [
    "rating",
    '[role="radio"][aria-checked="true"] > span',
    "borderTopColor",
    "600",
  ],
  ["rating", '[role="radio"][aria-checked="true"] > span', "color", "600"],
  [
    "rating",
    '[role="radio"][aria-checked="true"] > span',
    "backgroundColor",
    "tint",
  ],
];

function expected(kind, theme) {
  if (kind === "fill") return THEME_FILL;
  if (kind === "ink") return THEME_FOREGROUND;
  if (kind === "600") return THEME_600[theme];
  if (kind === "tint") return THEME_0[theme];
  throw new Error(`unknown expectation ${kind}`);
}

const { code, css } = await buildReactFixture("theme-fill-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
let read = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  await page.setContent('<!doctype html><div id="fixture"></div>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("dark-rating").waitFor();
  await settleLayout(page);
  for (const theme of ["light", "dark"]) {
    for (const [part, selector, property, kind] of READS) {
      const testId = `${theme}-${part}`;
      const actual = await page.getByTestId(testId).evaluate(
        (root, { selector, property }) => {
          const node = selector ? root.querySelector(selector) : root;
          if (!node) return { missing: true };
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const context = canvas.getContext("2d");
          context.fillStyle = getComputedStyle(node)[property];
          context.fillRect(0, 0, 1, 1);
          return {
            css: getComputedStyle(node)[property],
            rgba: [...context.getImageData(0, 0, 1, 1).data],
          };
        },
        { selector, property },
      );
      read += 1;
      const want = expected(kind, theme);
      const where = `${theme} ${part}${selector ? ` ${selector}` : ""} ${property}`;
      if (actual.missing) {
        failures.push(`${where}: nothing matched`);
        continue;
      }
      const off =
        actual.rgba[3] !== 255 ||
        want.some(
          (channel, index) => Math.abs(channel - actual.rgba[index]) > 2,
        );
      if (off)
        failures.push(
          `${where}: ${actual.css}; expected the ${
            kind === "fill"
              ? "theme fill, theme 500 (#135BEC)"
              : kind === "ink"
                ? "theme foreground, white"
                : kind === "600"
                  ? "theme 600"
                  : "theme 0 tint"
          } rgb(${want.join(", ")})`,
        );
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(
    `FAIL theme fill (decision 59): ${failures.length} of ${read} reads\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS theme fill (decision 59): ${read} reads, ${READS.length} per theme — every prominent fill is #135BEC under white in light and dark, and the theme on a surface is 600`,
);
