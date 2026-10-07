/**
 * GAP-23, on the built React package in a real browser: the token
 * stylesheets write a token whose source value is an alias as a reference to
 * the token it names (`var(--primitives-colors-theme-500)`), not as the hex
 * it resolves to, so a product that re-brands a module through
 * ThemeProvider's `tokens` reaches the component layer too.
 *
 * Two halves.
 *
 * Equality. Every token, in a light and a dark ThemeProvider root and a
 * light and a dark DesignConfigProvider root, computes the literal the build
 * wrote before references (bar the variables a DesignConfigProvider sets on
 * its root itself, its legacy --shadow-* aliases among them): the value Style
 * Dictionary resolves for the CSS platform, read here from the token sources
 * through Style Dictionary itself with references resolved — not from any CSS
 * file, so how the stylesheet is written cannot hide a change. Colours compare
 * after a canvas has parsed both sides; anything else as text, with the
 * minifier's spelling (`.25rem`, `rgba(0,0,0,.1)`) taken out.
 *
 * Re-brand. Under `tokens={{ "--primitives-colors-theme-500": "#AA1155" }}`
 * every prominent fill below computes #AA1155, light and dark; and with the
 * steps the filled Button's states name overridden (600 and 700 light, 400
 * and 300 dark, where the ramp turns over), its hover, focus and pressed
 * tokens follow. Until GAP-23 was fixed the Button and every part drawn as
 * one kept #135BEC, because its token was the hex. And with every step of
 * the ramp re-pointed, every component or semantic colour whose value is a
 * step of the ramp in that theme computes that step's override — the 28
 * themed button tokens the sources once held as copied hex among them — and
 * the outline, ghost and link Buttons draw it.
 *
 *   pnpm --filter "@kozmos-ds/react..." build
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit node scripts/check-token-references.mjs
 */
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  buildReactFixture,
  launchFixtureBrowser,
  settleLayout,
} from "./lib/built-react-fixture.mjs";

const BRAND_FILL = "#AA1155";
const BRAND_HOVER = "#118855";
const BRAND_PRESSED = "#553311";

/** The prominent fills (decision 59): a part, what draws it inside its test id. */
const FILLS = [
  ["button", ""],
  ["icon-button", ""],
  ["fab", ""],
  ["split-button", "button"],
  ["map-control", ""],
  ["floors", 'button[aria-pressed="true"]'],
  ["category", '[data-slot="counter"]'],
  ["checkbox", ""],
  ["tag", ""],
  ["chip", '[data-slot="chip"]'],
];

const BUTTON = "--components-primary-buttons-themed-button-background";
/** The filled Button's tokens and what each must compute on each root. */
const STATE_READS = [
  ["light-brand", `${BUTTON}-idle`, BRAND_FILL],
  ["dark-brand", `${BUTTON}-idle`, BRAND_FILL],
  ["light-states", `${BUTTON}-hover`, BRAND_HOVER],
  ["light-states", `${BUTTON}-focus`, BRAND_HOVER],
  ["light-states", `${BUTTON}-pressed`, BRAND_PRESSED],
  ["dark-states", `${BUTTON}-hover`, BRAND_HOVER],
  ["dark-states", `${BUTTON}-focus`, BRAND_HOVER],
  ["dark-states", `${BUTTON}-pressed`, BRAND_PRESSED],
];

/** The values the build wrote before references, per theme, from the sources. */
async function resolvedTokens() {
  const tokensDir = path.join(process.cwd(), "packages/tokens");
  const require = createRequire(path.join(tokensDir, "package.json"));
  const load = async (name) =>
    import(pathToFileURL(require.resolve(name)).href);
  const { default: StyleDictionary } = await load("style-dictionary");
  const { register } = await load("@tokens-studio/sd-transforms");
  register(StyleDictionary); // as packages/tokens/build.mjs does
  const themes = {};
  for (const theme of ["light", "dark"]) {
    const sd = new StyleDictionary({
      source: [path.join(tokensDir, `src/tokens-${theme}.json`)],
      // The CSS platform's transforms, as build.mjs configures it.
      platforms: { css: { transformGroup: "css" } },
      log: { verbosity: "silent", warnings: "disabled" },
    });
    const { allTokens } = await sd.getPlatformTokens("css");
    themes[theme] = allTokens.map((token) => ({
      name: `--${token.name}`,
      value: String(token.$value ?? token.value),
      colour: (token.$type ?? token.type) === "color",
      alias: /^\{[^{}]+\}$/.test(
        String(token.original.$value ?? token.original.value),
      ),
    }));
  }
  return themes;
}

/**
 * Text a minifier may respell, spelled one way: `0.25rem` and `.25rem` agree,
 * and so do `150ms` and `.15s`.
 */
const plain = (value) =>
  value
    .trim()
    .replace(/(\d*\.?\d+)ms\b/g, (_, number) => `${Number(number) / 1000}s`)
    .replace(/\s+/g, " ")
    .replace(/\s*([,()/])\s*/g, "$1")
    .replace(/(^|[^\d.])0+(\.\d)/g, "$1$2")
    .toLowerCase();

const expected = await resolvedTokens();
const { code, css } = await buildReactFixture("token-references-host.tsx");
const browser = await launchFixtureBrowser();
const failures = [];
const counts = {
  tokens: 0,
  aliases: 0,
  skipped: 0,
  fills: 0,
  states: 0,
  ramp: 0,
  inks: 0,
};
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1200 },
  });
  await page.setContent('<!doctype html><div id="fixture"></div>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: code });
  await page.getByTestId("dark-brand-chip").waitFor();
  await settleLayout(page);
  // A colour as the canvas parses it, so every engine's notation compares;
  // null where the text is not a colour (the canvas keeps its last fill).
  await page.evaluate(() => {
    const context = document.createElement("canvas").getContext("2d");
    window.kozmosColourOf = (value) => {
      context.fillStyle = "rgba(4, 5, 6, 0.5)";
      const sentinel = context.fillStyle;
      context.fillStyle = value;
      return context.fillStyle === sentinel ? null : context.fillStyle;
    };
  });
  const colourOf = (value) =>
    page.evaluate((value) => window.kozmosColourOf(value), value);

  // Equality: every token on a plain ThemeProvider root and on a
  // DesignConfigProvider's, light and dark. A DesignConfigProvider sets
  // variables of its own on its root, legacy aliases among them
  // (--shadow-sm, -md, -lg, which its `shadow` option drives): those it sets
  // are its, and are skipped; every other token must compute what the build
  // wrote, so a reference to one of them shows here.
  for (const [root, theme] of [
    ["light", "light"],
    ["dark", "dark"],
    ["config-light", "light"],
    ["config-dark", "dark"],
  ]) {
    const reads = await page
      .getByTestId(`${root}-probe`)
      .evaluate((probe, list) => {
        const element = probe.closest("[data-kozmos-root]");
        const style = getComputedStyle(element);
        return list.map(({ name, value, colour }) => {
          if (element.style.getPropertyValue(name) !== "")
            return { ownedByProvider: true };
          const actual = style.getPropertyValue(name).trim();
          return colour
            ? {
                actual,
                want: window.kozmosColourOf(value),
                got: window.kozmosColourOf(actual),
              }
            : { actual };
        });
      }, expected[theme]);
    reads.forEach((read, index) => {
      if (read.ownedByProvider) {
        counts.skipped += 1;
        return;
      }
      const token = expected[theme][index];
      counts.tokens += 1;
      if (token.alias) counts.aliases += 1;
      const same = token.colour
        ? read.got !== null && read.got === read.want
        : plain(read.actual) === plain(token.value);
      if (!same)
        failures.push(
          `${root} ${token.name}: computes "${read.actual}", the build wrote "${token.value}"`,
        );
    });
  }

  // Re-brand: the fills under an override of theme 500 alone.
  const want = {
    [BRAND_FILL]: await colourOf(BRAND_FILL),
    [BRAND_HOVER]: await colourOf(BRAND_HOVER),
    [BRAND_PRESSED]: await colourOf(BRAND_PRESSED),
  };
  for (const theme of ["light", "dark"]) {
    for (const [part, selector] of FILLS) {
      const read = await page
        .getByTestId(`${theme}-brand-${part}`)
        .evaluate((root, selector) => {
          const node = selector ? root.querySelector(selector) : root;
          if (!node) return { missing: true };
          const value = getComputedStyle(node).backgroundColor;
          return { value, colour: window.kozmosColourOf(value) };
        }, selector);
      counts.fills += 1;
      const where = `${theme} ${part}${selector ? ` ${selector}` : ""} background`;
      if (read.missing) failures.push(`${where}: nothing matched`);
      else if (read.colour !== want[BRAND_FILL])
        failures.push(
          `${where}: ${read.value} under theme 500 = ${BRAND_FILL}; expected ${BRAND_FILL}`,
        );
    }
  }

  // Re-brand: the Button's state tokens, read on the provider's root.
  for (const [root, name, value] of STATE_READS) {
    const read = await page
      .getByTestId(`${root}-probe`)
      .evaluate((probe, name) => {
        const style = getComputedStyle(probe.closest("[data-kozmos-root]"));
        const actual = style.getPropertyValue(name).trim();
        return { actual, colour: window.kozmosColourOf(actual) };
      }, name);
    counts.states += 1;
    if (read.colour !== want[value])
      failures.push(
        `${root} ${name}: "${read.actual}"; expected ${value}, the step it names, overridden`,
      );
  }

  // Re-brand: the whole ramp re-pointed, each step a colour of its own. Every
  // component or semantic colour whose value, in that theme, is a step of
  // the theme ramp must compute that step's override: one override reaches
  // everything on the ramp, a value copied from it included. And the
  // outline, ghost and link Buttons, whose ink is such a token, draw it.
  const RAMP = /^--primitives-colors-theme-\d+$/;
  for (const theme of ["light", "dark"]) {
    const root = `${theme}-ramp`;
    const steps = new Map(
      expected[theme]
        .filter((token) => RAMP.test(token.name))
        .map((token) => [token.value.toLowerCase(), token.name]),
    );
    const onRamp = expected[theme].filter(
      (token) =>
        token.colour &&
        /^--(components|semantics)-/.test(token.name) &&
        steps.has(token.value.toLowerCase()),
    );
    const reads = await page.getByTestId(`${root}-probe`).evaluate(
      (probe, { onRamp, steps }) => {
        const element = probe.closest("[data-kozmos-root]");
        const style = getComputedStyle(element);
        return onRamp.map(({ name, value }) => {
          const step = steps[value.toLowerCase()];
          const actual = style.getPropertyValue(name).trim();
          const override = element.style.getPropertyValue(step).trim();
          return {
            name,
            step,
            actual,
            got: window.kozmosColourOf(actual),
            want: window.kozmosColourOf(override),
          };
        });
      },
      { onRamp, steps: Object.fromEntries(steps) },
    );
    for (const read of reads) {
      counts.ramp += 1;
      if (read.want === null || read.got !== read.want)
        failures.push(
          `${root} ${read.name}: "${read.actual}"; expected ${read.step}'s override, the step its value is on`,
        );
    }
    const ink = reads.find(
      (read) =>
        read.name ===
        "--components-secondary-buttons-themed-button-foreground-content-idle",
    );
    for (const [part, property] of [
      ["outline", "color"],
      ["outline", "borderTopColor"],
      ["ghost", "color"],
      ["link", "color"],
    ]) {
      const read = await page
        .getByTestId(`${root}-${part}`)
        .evaluate((node, property) => {
          const value = getComputedStyle(node)[property];
          return { value, colour: window.kozmosColourOf(value) };
        }, property);
      counts.inks += 1;
      if (!ink || read.colour !== ink.want)
        failures.push(
          `${root} ${part} ${property}: ${read.value}; expected ${ink?.step ?? "its step"}'s override`,
        );
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(
    `FAIL token references (GAP-23): ${failures.length} failure(s)\n- ${failures.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `PASS token references (GAP-23): ${counts.tokens} token reads (${counts.aliases} of them aliases in the sources) compute what the build wrote before references, in a light and a dark ThemeProvider and DesignConfigProvider root (${counts.skipped} the DesignConfigProvider sets itself, skipped); ${counts.fills} fills compute ${BRAND_FILL} under one override of theme 500; ${counts.states} reads of the filled Button's idle, hover, focus and pressed tokens follow the steps they name; with the whole ramp re-pointed, ${counts.ramp} reads of component and semantic colours on it follow their steps, and ${counts.inks} reads of the outline, ghost and link Buttons' ink`,
);
