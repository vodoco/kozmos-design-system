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
 * Then the states (Olcay's rulings, 2026-10-07): a filled Button, and all
 * drawn as one, is the pressed token while the mouse holds it and the focus
 * token when the keyboard focuses it, as the hover token hovered; a hovered
 * fill is the hover token, not the fill made see-through; the default
 * Badge's counter inverts, as the selected level's count does; and a
 * keyboard focus on or inside a fill draws Button's offset ring, its inner
 * band reading 3:1 against the fill and its outer band 3:1 against the page.
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
// The themed Button's state tokens, the same in both themes (decision 59).
const THEME_HOVER = [16, 81, 232]; // #1051E8, hover and focus
const THEME_PRESSED = [13, 68, 194]; // #0D44C2
/** A selected destructive chip's fill: danger 600 in each theme. */
const DANGER_FILL = { light: [212, 28, 66], dark: [233, 90, 119] };
// The page, background/0, under the parts.
const PAGE = { light: [255, 255, 255], dark: [0, 0, 0] };
// The danger emotion's, which turn over with the theme: a default-variant
// Button given another emotion takes that emotion's states, never the
// themed ones the default variant's own rules name, and the destructive
// variant takes them too. Decision 60 (Olcay, 2026-10-08): hover one step
// and pressed two along the danger ramp, away from the page, focus the
// hover: danger 800 and 900 in each theme, where the ramp turns over. Until
// then the light hover was danger 600, lighter than the fill.
const DANGER_HOVER = { light: [140, 19, 43], dark: [243, 162, 179] };
const DANGER_PRESSED = { light: [103, 14, 32], dark: [248, 198, 208] };

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
  ["button-themed", "", "backgroundColor", "fill"],
  ["button-themed", "", "color", "ink"],
  ["icon-button", "", "backgroundColor", "fill"],
  ["icon-button", "", "color", "ink"],
  ["fab", "", "backgroundColor", "fill"],
  ["fab", "", "color", "ink"],
  ["map-control", "", "backgroundColor", "fill"],
  ["map-control", "", "color", "ink"],
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
  // On the default Badge, itself the fill, the counter inverts (Olcay,
  // 2026-10-07), as the selected level's count does; the destructive
  // Badge's keeps the surface it had.
  ["badge-counter", '[data-slot="badge-counter"]', "backgroundColor", "ink"],
  ["badge-counter", '[data-slot="badge-counter"]', "color", "fill"],
  [
    "badge-destructive-counter",
    '[data-slot="badge-counter"]',
    "backgroundColor",
    "page",
  ],
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

/**
 * What to read in a state: hovered, pressed (the mouse held down on it) or
 * focused from the keyboard (Tab). "hover", "pressed" and "focus" are the
 * themed Button's state tokens; "ring" is a focus indicator that reads on
 * the fill and on the page; "lift" a hover inside a fill that shows on it.
 */
const SPLIT_MAIN = "button:first-of-type";
const SPLIT_MENU = 'button[aria-label="More options"]';
const CHIP_REMOVE = 'button[aria-label^="Remove"]';
const STATE_READS = [
  // The filled Button and what is drawn as one: idle, hover, pressed, focus.
  ...[
    ["button", ""],
    ["button-themed", ""],
    ["icon-button", ""],
    ["fab", ""],
    ["split-button", SPLIT_MAIN],
    ["split-button", SPLIT_MENU],
    ["map-control", ""],
  ].flatMap(([part, selector]) => [
    [part, selector, "hover", "backgroundColor", "hover"],
    [part, selector, "pressed", "backgroundColor", "pressed"],
    [part, selector, "focus", "backgroundColor", "focus"],
    [part, selector, "focus", "boxShadow", "ring"],
  ]),
  ...["button-danger", "button-destructive"].flatMap((part) => [
    [part, "", "hover", "backgroundColor", "danger-hover"],
    [part, "", "pressed", "backgroundColor", "danger-pressed"],
    [part, "", "focus", "backgroundColor", "danger-focus"],
  ]),
  // Hovered fills: the hover token, opaque, in both themes.
  ["chip", '[data-slot="chip"]', "hover", "backgroundColor", "hover"],
  ["tag", "", "hover", "backgroundColor", "hover"],
  ["badge", "", "hover", "backgroundColor", "hover"],
  ["toggle", "", "hover", "backgroundColor", "hover"],
  // A keyboard focus on or inside a fill, and a hover inside one.
  ["toggle", "", "focus", "boxShadow", "ring"],
  ["chip-remove", CHIP_REMOVE, "focus", "boxShadow", "ring"],
  ["tag-remove", "button", "focus", "boxShadow", "ring"],
  ["chip-remove", CHIP_REMOVE, "hover", "backgroundColor", "lift"],
  ["tag-remove", "button", "hover", "backgroundColor", "lift"],
  // A selected destructive chip is the danger fill: its remove hover shows
  // on that fill, not the theme's.
  [
    "chip-danger-remove",
    CHIP_REMOVE,
    "hover",
    "backgroundColor",
    "lift-danger",
  ],
  // An unavailable filled Button keeps its rest colour.
  ["button-unavailable", "", "hover", "backgroundColor", "fill"],
  ["button-unavailable", "", "pressed", "backgroundColor", "fill"],
];

// Radix's menu trigger opens its menu on pointerdown and prevents that
// event's default; Gecko then never sets :active on it, and Linux WebKit
// often loses it at once, the menu taking the pointer as it opens (CI on
// 2026-10-08 entered it in one run and not the next; WebKit on a Mac
// always does). So in those engines the SplitButton's menu half may not be
// readable pressed. Skipped only while the state really cannot be entered,
// and said so; Chromium enters it every time and must pass it.
const UNREACHABLE = [
  {
    engines: ["firefox", "webkit"],
    part: "split-button",
    selector: SPLIT_MENU,
    state: "pressed",
  },
];
const ENGINE = process.env.ADAPTIVE_BROWSER ?? "chromium";
const skipped = [];

// A hover inside a fill must show on it: more than the 1.11:1 the theme 600
// read on the fill, and more than the 1.27:1 the system's own remove hover
// (ink at a tenth) reads on a light surface.
const LIFT_MIN = 1.3;
const RING_MIN = 3;

function expected(kind, theme) {
  if (kind === "fill") return THEME_FILL;
  if (kind === "ink") return THEME_FOREGROUND;
  if (kind === "600") return THEME_600[theme];
  if (kind === "tint") return THEME_0[theme];
  if (kind === "page") return PAGE[theme];
  if (kind === "hover" || kind === "focus") return THEME_HOVER;
  if (kind === "pressed") return THEME_PRESSED;
  if (kind === "danger-hover" || kind === "danger-focus")
    return DANGER_HOVER[theme];
  if (kind === "danger-pressed") return DANGER_PRESSED[theme];
  throw new Error(`unknown expectation ${kind}`);
}

const NAMES = {
  fill: "theme fill, theme 500 (#135BEC)",
  ink: "theme foreground, white",
  600: "theme 600",
  tint: "theme 0 tint",
  page: "page, background/0",
  hover: "hover token (#1051E8)",
  focus: "focus token (#1051E8)",
  pressed: "pressed token (#0D44C2)",
  "danger-hover": "danger emotion's hover token, danger 800",
  "danger-pressed": "danger emotion's pressed token, danger 900",
  "danger-focus": "danger emotion's focus token, its hover",
};

/** The WCAG contrast ratio of two opaque sRGB colours, 0–255 channels. */
function contrast(one, two) {
  const luminance = ([r, g, b]) => {
    const linear = (c) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  };
  const [light, dark] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const near = (want, rgba) =>
  rgba[3] === 255 &&
  want.every((channel, index) => Math.abs(channel - rgba[index]) <= 2);

/** Puts a part into a state: hovered, held down, or focused by Tab. */
async function enter(page, target, state) {
  await page.mouse.move(1, 1);
  if (state === "hover" || state === "pressed") await target.hover();
  if (state === "pressed") await page.mouse.down();
  if (state === "focus") {
    // Focus lands from the keyboard, so :focus-visible matches in every
    // engine: on the part, a Tab away and back.
    await target.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
  }
}

async function leave(page, state) {
  if (state === "pressed") await page.mouse.up();
  // The SplitButton's menu opens on the press, and can mount a frame or two
  // after the release (CI's Linux WebKit). While a Radix menu is open or
  // closing, the body takes no pointer events, so the next read could not
  // hover or press anything. Let it mount, close it, and wait until it has
  // gone and the page takes the pointer again.
  await page.evaluate(
    () =>
      new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      ),
  );
  if ((await page.locator('[role="menu"]').count()) > 0)
    await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      !document.querySelector('[role="menu"]') &&
      getComputedStyle(document.body).pointerEvents !== "none",
    null,
    { timeout: 5000 },
  );
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.mouse.move(1, 1);
}

/** Reads a colour, or a box-shadow's bands, of the node in its state. */
function readInPage(node, { property, fill }) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (colour, under) => {
    context.clearRect(0, 0, 1, 1);
    if (under) {
      context.fillStyle = `rgb(${under.join(",")})`;
      context.fillRect(0, 0, 1, 1);
    }
    context.fillStyle = colour;
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data];
  };
  const style = getComputedStyle(node);
  const state = {
    hover: node.matches(":hover"),
    active: node.matches(":active"),
    focusVisible: node.matches(":focus-visible"),
  };
  if (property !== "boxShadow")
    return {
      css: style[property],
      rgba: rgba(style[property]),
      over: rgba(style[property], fill),
      state,
    };
  // Each layer: its colour and its spread, in paint order, the first on top.
  const layers = [];
  let depth = 0;
  let start = 0;
  const value = style.boxShadow;
  for (let index = 0; index <= value.length; index += 1) {
    const char = value[index];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if ((char === "," && depth === 0) || index === value.length) {
      layers.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const drawn = layers
    .filter((layer) => layer && layer !== "none" && !/\binset\b/.test(layer))
    .map((layer) => {
      const colour = layer.match(/^[a-z-]+\([^)]*\)|^#\w+|^[a-z]+/i)?.[0] ?? "";
      const lengths = layer
        .slice(colour.length)
        .trim()
        .split(/\s+/)
        .map((length) => parseFloat(length));
      return { rgba: rgba(colour), spread: lengths[3] ?? 0 };
    })
    .filter((layer) => layer.spread > 0 && layer.rgba[3] > 0);
  // The band a point d out from the edge shows: the topmost layer reaching it.
  const at = (distance) =>
    drawn.find((layer) => layer.spread > distance)?.rgba ?? null;
  const width = Math.max(0, ...drawn.map((layer) => layer.spread));
  return {
    css: value,
    width,
    inner: width ? at(0.5) : null,
    outer: width ? at(width - 0.5) : null,
    state,
  };
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
          `${where}: ${actual.css}; expected the ${NAMES[kind]} rgb(${want.join(", ")})`,
        );
    }
  }
  // A press shows at once: the filled Button's colour transition is off
  // while it is held, so a quick tap still darkens it. Read before the
  // transitions are turned off below.
  for (const part of ["button", "map-control"]) {
    const target = page.getByTestId(`light-${part}`);
    await target.hover();
    await page.mouse.down();
    const duration = await target.evaluate(
      (node) => getComputedStyle(node).transitionDuration,
    );
    await page.mouse.up();
    await page.mouse.move(0, 0);
    read += 1;
    if (!duration.split(",").every((value) => parseFloat(value) === 0))
      failures.push(
        `light ${part} pressed transitionDuration: ${duration}; expected 0s, so a quick tap shows the pressed colour`,
      );
  }
  // The states. Transitions off, so a read is the state's colour and not a
  // frame on the way to it.
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; }",
  });
  for (const theme of ["light", "dark"]) {
    for (const [part, selector, state, property, kind] of STATE_READS) {
      const root = page.getByTestId(`${theme}-${part}`);
      const target = selector ? root.locator(selector).first() : root;
      const where = `${theme} ${part}${selector ? ` ${selector}` : ""} ${state} ${property}`;
      read += 1;
      if ((await target.count()) === 0) {
        failures.push(`${where}: nothing matched`);
        continue;
      }
      await enter(page, target, state);
      const actual = await target.evaluate(readInPage, {
        property,
        // What a hover inside a fill is laid over: the danger fill for a
        // selected destructive chip, the theme fill for every other.
        fill: kind === "lift-danger" ? DANGER_FILL[theme] : THEME_FILL,
      });
      await leave(page, state);
      const inState =
        state === "hover"
          ? actual.state.hover
          : state === "pressed"
            ? actual.state.active
            : actual.state.focusVisible;
      if (
        !inState &&
        UNREACHABLE.some(
          (entry) =>
            entry.engines.includes(ENGINE) &&
            entry.part === part &&
            entry.selector === selector &&
            entry.state === state,
        )
      ) {
        skipped.push(where);
        read -= 1;
        continue;
      }
      if (!inState) {
        failures.push(
          `${where}: could not put it in the state (${JSON.stringify(actual.state)})`,
        );
        continue;
      }
      if (kind === "ring") {
        const onFill = actual.inner ? contrast(actual.inner, THEME_FILL) : 0;
        const onPage = actual.outer ? contrast(actual.outer, PAGE[theme]) : 0;
        if (
          actual.width < 2 ||
          actual.inner?.[3] !== 255 ||
          actual.outer?.[3] !== 255 ||
          onFill < RING_MIN ||
          onPage < RING_MIN
        )
          failures.push(
            `${where}: ${actual.css}; a focus indicator ${actual.width}px wide, its inner band ${onFill.toFixed(2)}:1 on the fill and its outer ${onPage.toFixed(2)}:1 on the page; expected at least 2px, opaque, ${RING_MIN}:1 on both`,
          );
        continue;
      }
      if (kind === "lift" || kind === "lift-danger") {
        const base = kind === "lift" ? THEME_FILL : DANGER_FILL[theme];
        const lift = contrast(actual.over.slice(0, 3), base);
        if (lift < LIFT_MIN)
          failures.push(
            `${where}: ${actual.css}; over the fill rgb(${actual.over
              .slice(0, 3)
              .join(
                ", ",
              )}), ${lift.toFixed(2)}:1 against it; expected at least ${LIFT_MIN}:1`,
          );
        continue;
      }
      const want = expected(kind, theme);
      if (!near(want, actual.rgba))
        failures.push(
          `${where}: ${actual.css}; expected the ${NAMES[kind]} rgb(${want.join(", ")})`,
        );
    }
  }
} finally {
  await browser.close();
}

if (skipped.length)
  console.log(
    `Skipped, as ${ENGINE} cannot enter the state: ${skipped.join("; ")}`,
  );
if (failures.length) {
  console.error(
    `FAIL theme fill (decision 59): ${failures.length} of ${read} reads\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS theme fill (decision 59): ${read} reads, ${READS.length} at rest and ${STATE_READS.length} in a state per theme — every prominent fill is #135BEC under white in light and dark, and the theme on a surface is 600; the filled Button and its kin are the hover, pressed and focus tokens in those states, hovered fills the hover token, the default Badge's counter inverted, and focus on or inside a fill an offset ring reading ${RING_MIN}:1 on the fill and the page`,
);
