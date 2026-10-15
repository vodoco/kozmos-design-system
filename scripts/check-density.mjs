/**
 * ThemeProvider's density (decision 82), on the built React package in a real
 * browser: every control that follows it, measured in a touch root, a compact
 * root, a touch root inside a compact one, and a compact root's portal.
 *
 * - Touch keeps today's sizes: buttons and fields 44, icon buttons 44 and 48.
 * - Compact: buttons 32, 40 and 48; icon buttons 28, 32 and 40; fields 40,
 *   and the square actions inside a field (clear, open, steppers, show
 *   password) as tall as the field.
 *
 * SDK parts (SearchBar, AIInputBar) keep the SDK's touch geometry inside a
 * compact provider: their roots are marked touch, which resets the sizes.
 *
 * Without @scope only the owned rules survive (the Button's sizes, the text
 * field, the field actions), so that pass measures those; the utilities'
 * sizes are measured with the full stylesheet.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-density.mjs
 */
import { createRequire } from "node:module";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const { code, css } = await buildReactFixture("density.fixture.tsx");
const require = createRequire(`${process.cwd()}/packages/react/package.json`);
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
  "password-input action": { owned: true, height: [44, 40], width: [44, 40] },
};
const BOARDS = {
  touch: 0,
  compact: 1,
  "touch-in-compact": 0,
  "compact-portal": 1,
};

const browser = await launchFixtureBrowser();
const failures = [];
let reads = 0;

try {
  for (const [mode, stylesheet] of [
    ["full", css],
    ["without-scope", unscoped.toString()],
  ]) {
    const page = await browser.newPage({
      viewport: { width: 1800, height: 1000 },
    });
    await page.setContent('<!doctype html><div id="fixture"></div>');
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
        return { height: box.height, width: box.width };
      };
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
    for (const [board, column] of Object.entries(BOARDS)) {
      const result = measured[board];
      if (!result) {
        failures.push(`${mode} ${board}: the board did not render`);
        continue;
      }
      reads += 1;
      const density = column ? "compact" : "touch";
      if (result.density !== density)
        failures.push(
          `${mode} ${board}: its root says ${result.density}, expected ${density}`,
        );
      for (const [part, expected] of Object.entries(EXPECTED)) {
        if (mode === "without-scope" && !expected.owned) continue;
        const box = result.parts[part];
        if (!box) {
          failures.push(`${mode} ${board} ${part}: not found`);
          continue;
        }
        for (const axis of ["height", "width"]) {
          if (!expected[axis]) continue;
          reads += 1;
          const want = expected[axis][column];
          if (Math.abs(box[axis] - want) > 0.5)
            failures.push(
              `${mode} ${board} ${part} ${axis}: ${box[axis].toFixed(2)}, expected ${want}`,
            );
        }
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
  `PASS density: ${reads} reads, touch keeps 44 and compact reads 28 to 48, in roots, a nested touch root and a portal, with and without @scope; SDK parts stay 44 in compact, and only their touch mark holds them`,
);
