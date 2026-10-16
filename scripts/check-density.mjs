/**
 * ThemeProvider's density (decision 82), on the built React package in a real
 * browser: every control that follows it, measured in a touch root, a compact
 * root, a touch root inside a compact one, a compact root's portal, a compact
 * right-to-left root, outside any provider (touch, from the owned rules'
 * fallbacks), in a compact DensityScope on a touch root and its popover, and
 * inside an SDK part in a compact root, where a provider of its own and the
 * part's popover stay touch.
 *
 * - Touch keeps today's sizes: buttons and fields 44, icon buttons 44 and 48.
 * - Compact: buttons 32, 40 and 48; icon buttons 28, 32 and 40; fields 40,
 *   and the square actions inside a field (clear, open, steppers, show
 *   password) as tall as the field.
 * - The fields drawn on Input's recipe (DatePicker, DateRangePicker,
 *   TimePicker, Search, ColorPicker) are the field's height, and Pagination's
 *   Previous and Next are as tall as its page links.
 * - A caller's px-* sets a field's start; Combobox and PasswordInput keep the
 *   room for their actions at the end.
 *
 * SDK parts (SearchBar, AIInputBar) keep the SDK's touch geometry inside a
 * compact provider: their roots are marked touch, which resets the sizes.
 *
 * A stacked dialog footer's buttons are each their size's height, and a
 * dialog's and a drawer's close sit on their title as touch places them,
 * and every var(--density-…) in the stylesheet falls back to its touch size.
 *
 * Without @scope only the owned rules survive (the Button's sizes, the text
 * field, the field actions), so that pass measures those; the utilities'
 * sizes are measured with the full stylesheet.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-density.mjs
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("density.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
const failures = [];
let reads = 0;

// Outside a provider no density token is set, so every use of one falls back
// to its touch size, as the tokens' own touch block gives it.
const tokenCss = fs.readFileSync(
  "packages/tokens/dist/css/variables-density.css",
  "utf8",
);
const touchBlock = tokenCss.slice(0, tokenCss.indexOf("}"));
const touchSizes = new Map(
  [...touchBlock.matchAll(/(--density-[a-z0-9-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => [name, value.trim()],
  ),
);
if (touchSizes.size === 0) failures.push("no touch density tokens found");
for (const [, name, fallback] of css.matchAll(
  /var\(\s*(--density-[a-z0-9-]+)\s*(?:,\s*([^)]+?))?\s*\)/g,
)) {
  reads += 1;
  const want = touchSizes.get(name);
  if (!want) failures.push(`var(${name}): no such density token`);
  else if (fallback !== want)
    failures.push(
      `var(${name}${fallback ? `, ${fallback}` : ""}): falls back to ${fallback ?? "nothing"}, expected the touch size ${want}`,
    );
}
const postcss = require("postcss");
const unscoped = postcss.parse(css);
unscoped.walkAtRules("scope", (rule) => rule.remove());

// [touch, compact] for each measured part: height, and width where square.
const EXPECTED = {
  "button-sm": { owned: true, height: [44, 32] },
  button: { owned: true, height: [44, 40] },
  "button-lg": { owned: true, height: [44, 48] },
  "button-icon": { owned: true, height: [44, 32], width: [44, 32] },
  "icon-button-sm": { height: [44, 28], width: [44, 28] },
  "icon-button": { height: [44, 32], width: [44, 32] },
  "icon-button-lg": { height: [48, 40], width: [48, 40] },
  input: { owned: true, height: [44, 40] },
  select: { height: [44, 40] },
  "combobox field": { owned: true, height: [44, 40] },
  "combobox action": { height: [44, 40], width: [44, 40] },
  "multi-select field": { height: [44, 40] },
  "number-input field": { owned: true, height: [44, 40] },
  "number-input action": { owned: true, height: [44, 40], width: [44, 40] },
  "password-input field": { owned: true, height: [44, 40] },
  // The fields drawn on Input's recipe.
  "date-picker field": { owned: true, height: [44, 40] },
  "date-range-picker field": { owned: true, height: [44, 40] },
  "time-picker field": { owned: true, height: [44, 40] },
  "search field": { owned: true, height: [44, 40] },
  "color-picker field": { owned: true, height: [44, 40] },
  // Previous and Next are the small Button, as tall as the page links.
  "pagination previous": { owned: true, height: [44, 32] },
  "pagination page": { owned: true, height: [44, 32], width: [44, 32] },
  "pagination next": { owned: true, height: [44, 32] },
  // and keep the default size's 16 beside their 10 by the arrow.
  "pagination previous padding": { padStart: [10, 10], padEnd: [16, 16] },
  "pagination next padding": { padStart: [16, 16], padEnd: [10, 10] },
  "password-input action": { owned: true, height: [44, 40], width: [44, 40] },
  // The room a field leaves for its actions follows them: 48 or 96, then 44
  // or 88; a drawer's close is the icon button's size.
  "combobox padding": { owned: true, padEnd: [96, 88] },
  "combobox-plain padding": { owned: true, padEnd: [48, 44] },
  "password-input padding": { owned: true, padEnd: [48, 44] },
  // A caller's px-4 sets both sides of a plain field, and the start of a field
  // with actions, whose end keeps the room for them: the room is a utility
  // too, after px-4. A caller's class is a utility, so not without @scope;
  // and WebKit applies no @scope rule to an <input> (GAP-20), so there the
  // caller's px-4 never lands and the field keeps its own 12, while the owned
  // room still holds. Should WebKit start to apply it, these fail there.
  "input px padding": {
    padStart: [16, 16],
    padEnd: [16, 16],
    webkit: { padStart: [12, 12], padEnd: [12, 12] },
  },
  "combobox px padding": {
    padStart: [16, 16],
    padEnd: [96, 88],
    webkit: { padStart: [12, 12] },
  },
  "combobox-plain px padding": {
    padStart: [16, 16],
    padEnd: [48, 44],
    webkit: { padStart: [12, 12] },
  },
  "password-input px padding": {
    padStart: [16, 16],
    padEnd: [48, 44],
    webkit: { padStart: [12, 12] },
  },
  // MultiSelect's input is the field less its padding and border.
  "multi-select input": { owned: true, height: [32, 28] },
  "dialog close": { height: [44, 32], width: [44, 32], overlay: "dialog" },
  "dialog title": { padEnd: [56, 44], overlay: "dialog" },
  "dialog footer button": { owned: true, height: [44, 40], overlay: "dialog" },
  "dialog footer button-sm": {
    owned: true,
    height: [44, 32],
    overlay: "dialog",
  },
  "dialog footer button-lg": {
    owned: true,
    height: [44, 48],
    overlay: "dialog",
  },
  "dialog footer button-icon": {
    owned: true,
    height: [44, 32],
    overlay: "dialog",
  },
  "drawer close": { height: [44, 32], width: [44, 32], overlay: "drawer" },
  "drawer header": { padEnd: [48, 36], overlay: "drawer" },
};
// Each board: its column in EXPECTED, and the overlays it opens. Outside a
// provider only the owned rules apply, and nothing marks a density.
const BOARDS = {
  touch: { column: 0, overlays: ["dialog", "drawer"] },
  compact: { column: 1, overlays: ["dialog", "drawer"] },
  "touch-in-compact": { column: 0, overlays: ["dialog", "drawer"] },
  "compact-portal": { column: 1, overlays: [] },
  "compact-rtl": { column: 1, overlays: ["dialog"] },
  outside: { column: 0, overlays: [], outside: true },
  "compact-scope": { column: 1, overlays: ["dialog", "drawer"] },
  "compact-scope-portal": { column: 1, overlays: [] },
  "provider-in-sdk": { column: 0, overlays: [] },
  "sdk-portal": { column: 0, overlays: [] },
};
// A close sits on its title as touch places it: the same distance between
// their centres in every board.
const ALIGNED = ["dialog close offset", "drawer close offset"];

const browser = await launchFixtureBrowser();
const engine = browser.browserType().name();

try {
  // The sizes are in rem, so they follow the reader's font size: at a 20px
  // root every one of them is a quarter larger, as h-11 was before density.
  for (const [mode, stylesheet, rootSize] of [
    ["full", css, 16],
    ["without-scope", unscoped.toString(), 16],
    ["full at a 20px root", css, 20],
  ]) {
    const scale = rootSize / 16;
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1000 },
    });
    await page.setContent(
      `<!doctype html><html style="font-size:${rootSize}px"><div id="fixture"></div></html>`,
    );
    await page.addStyleTag({ content: stylesheet });
    await page.addScriptTag({ content: code });
    await page.locator('[data-board="compact-portal"]').waitFor();
    await settleLayout(page);
    // The popover opens with a zoom; measure the sizes it settles at. An
    // endless animation can't finish and throws, which leaves it running.
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        try {
          animation.finish();
        } catch {
          // An infinite animation: nothing to settle.
        }
      }
    });
    await settleLayout(page);
    const measured = await page.evaluate(() => {
      const size = (element) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return {
          height: box.height,
          width: box.width,
          padStart: Number.parseFloat(
            getComputedStyle(element).paddingInlineStart,
          ),
          padEnd: Number.parseFloat(getComputedStyle(element).paddingInlineEnd),
        };
      };
      const centre = (element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      };
      const offset = (close, title) =>
        close && title ? { offset: centre(close) - centre(title) } : null;
      const out = {};
      for (const board of document.querySelectorAll("[data-board]")) {
        const name = board.getAttribute("data-board");
        const parts = {};
        for (const element of board.querySelectorAll("[data-measure]"))
          parts[element.getAttribute("data-measure")] = size(element);
        const within = (key) =>
          board.querySelector(`[data-measure-within="${key}"]`);
        parts["combobox field"] = size(
          within("combobox")?.querySelector(".kozmos-input"),
        );
        parts["combobox action"] = size(
          within("combobox")?.querySelector("button[aria-label]"),
        );
        parts["multi-select field"] = size(
          within("multi-select")?.querySelector(".rounded-control.border"),
        );
        parts["number-input field"] = size(
          within("number-input")?.querySelector(".kozmos-input"),
        );
        parts["number-input action"] = size(
          within("number-input")?.querySelector(".kozmos-field-action"),
        );
        parts["password-input field"] = size(
          within("password-input")?.querySelector(".kozmos-input"),
        );
        parts["password-input action"] = size(
          within("password-input")?.querySelector(".kozmos-field-action"),
        );
        for (const key of [
          "date-picker",
          "date-range-picker",
          "time-picker",
          "search",
          "color-picker",
        ])
          parts[`${key} field`] = size(
            within(key)?.querySelector(".kozmos-input"),
          );
        parts["pagination previous padding"] = parts["pagination previous"];
        parts["pagination next padding"] = parts["pagination next"];
        parts["combobox padding"] = parts["combobox field"];
        parts["combobox-plain padding"] = size(
          within("combobox-plain")?.querySelector(".kozmos-input"),
        );
        parts["password-input padding"] = parts["password-input field"];
        for (const key of [
          "combobox-px",
          "combobox-plain-px",
          "password-input-px",
        ])
          parts[`${key.replace(/-px$/, "")} px padding`] = size(
            within(key)?.querySelector(".kozmos-input"),
          );
        parts["multi-select input"] = size(
          within("multi-select")?.querySelector(".kozmos-multiselect-input"),
        );
        const dialog = document.querySelector(`[data-dialog="${name}"]`);
        const dialogClose = dialog?.querySelector('button[aria-label="Close"]');
        parts["dialog close"] = size(dialogClose);
        parts["dialog title"] = size(dialog?.querySelector("h2"));
        parts["dialog footer button"] = size(
          dialog?.querySelector(".kozmos-dialog-footer button"),
        );
        for (const footer of ["sm", "lg", "icon"])
          parts[`dialog footer button-${footer}`] = size(
            dialog?.querySelector(
              `.kozmos-dialog-footer [data-footer="${footer}"]`,
            ),
          );
        parts["dialog close offset"] = offset(
          dialogClose,
          dialog?.querySelector("h2"),
        );
        const drawer = document.querySelector(`[data-drawer="${name}"]`);
        const drawerClose = [
          ...(drawer?.querySelectorAll("button") ?? []),
        ].find((button) => button.textContent?.includes("Close drawer"));
        parts["drawer close"] = size(drawerClose);
        parts["drawer header"] = size(
          drawer?.querySelector("h2")?.parentElement,
        );
        parts["drawer close offset"] = offset(
          drawerClose,
          drawer?.querySelector("h2"),
        );
        parts["search clear"] = size(
          board.querySelector('button[aria-label="Clear search"]'),
        );
        parts["assistant send"] = size(
          board.querySelector('button[aria-label="Send"]'),
        );
        out[name] = {
          parts,
          density: board
            .closest("[data-kozmos-density]")
            ?.getAttribute("data-kozmos-density"),
        };
      }
      return out;
    });

    // SDK parts (SearchBar, AIInputBar) keep the SDK's touch geometry
    // inside a compact provider: their icon buttons stay 44.
    if (mode === "full") {
      const sdk = measured["sdk-in-compact"]?.parts ?? {};
      for (const part of ["search clear", "assistant send"]) {
        for (const axis of ["height", "width"]) {
          reads += 1;
          const value = sdk[part]?.[axis];
          if (value === undefined || Math.abs(value - 44) > 0.5)
            failures.push(
              `${mode} sdk-in-compact ${part} ${axis}: ${value?.toFixed(2) ?? "not found"}, expected 44`,
            );
        }
      }
    }
    // The control: strip the SDK parts' touch mark and the same buttons take
    // the compact icon size, 32, so the mark is what holds them at 44.
    if (mode === "full") {
      const unmarked = await page.evaluate(() => {
        const board = document.querySelector('[data-board="sdk-in-compact"]');
        for (const element of board.querySelectorAll(
          '[data-kozmos-density="touch"]',
        ))
          element.removeAttribute("data-kozmos-density");
        return ["Clear search", "Send"].map(
          (name) =>
            board
              .querySelector(`button[aria-label="${name}"]`)
              ?.getBoundingClientRect().height,
        );
      });
      for (const [index, value] of unmarked.entries()) {
        reads += 1;
        if (value === undefined || Math.abs(value - 32) > 0.5)
          failures.push(
            `${mode} sdk-in-compact unmarked ${index ? "assistant send" : "search clear"}: ${value?.toFixed(2) ?? "not found"}, expected 32 without the touch mark`,
          );
      }
    }
    for (const [board, { column, overlays, outside }] of Object.entries(
      BOARDS,
    )) {
      const result = measured[board];
      if (!result) {
        failures.push(`${mode} ${board}: the board did not render`);
        continue;
      }
      const density = column ? "compact" : "touch";
      if (!outside) {
        reads += 1;
        if (result.density !== density)
          failures.push(
            `${mode} ${board}: its root says ${result.density}, expected ${density}`,
          );
      }
      for (const [part, expected] of Object.entries(EXPECTED)) {
        if ((mode === "without-scope" || outside) && !expected.owned) continue;
        if (expected.overlay && !overlays.includes(expected.overlay)) continue;
        const box = result.parts[part];
        if (!box) {
          failures.push(`${mode} ${board} ${part}: not found`);
          continue;
        }
        for (const axis of ["height", "width", "padStart", "padEnd"]) {
          if (!expected[axis]) continue;
          reads += 1;
          const want =
            (engine === "webkit" && expected.webkit?.[axis]
              ? expected.webkit[axis]
              : expected[axis])[column] * scale;
          if (Math.abs(box[axis] - want) > 0.5)
            failures.push(
              `${mode} ${board} ${part} ${axis}: ${box[axis].toFixed(2)}, expected ${want}`,
            );
        }
      }
      // The utilities place the closes, so only the full stylesheet can.
      if (mode === "without-scope") continue;
      for (const part of ALIGNED) {
        if (!overlays.includes(part.split(" ")[0])) continue;
        reads += 1;
        const want = measured.touch.parts[part]?.offset;
        const got = result.parts[part]?.offset;
        if (want === undefined || got === undefined)
          failures.push(`${mode} ${board} ${part}: not found`);
        else if (Math.abs(got - want) > 0.5)
          failures.push(
            `${mode} ${board} ${part}: the close's centre is ${got.toFixed(2)} from the title's, ${want.toFixed(2)} in touch`,
          );
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(
    `FAIL density: ${failures.length} of ${reads} reads\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS density: ${reads} reads, touch keeps 44 and compact reads 28 to 48, in roots, a nested touch root, a portal, right-to-left and a compact DensityScope with its popover, with and without @scope and at a 20px root; outside a provider every density size falls back to touch; the fields on Input's recipe (DatePicker, DateRangePicker, TimePicker, Search, ColorPicker) take the field's height and Pagination's Previous and Next its links'; a caller's px-4 sets a field's start and Combobox and PasswordInput keep the room for their actions (in WebKit, which applies no @scope rule to an <input>, the field keeps its own start and the owned room holds); a stacked dialog footer's buttons keep their sizes' heights; dialog and drawer closes sit on their titles as in touch; SDK parts stay 44 in compact, with a provider of their own inside and in their popovers, and only their touch mark holds them`,
);
