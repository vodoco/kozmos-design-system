/**
 * Themes and densities for @kozmos-ds/vue, over every story of the built Vue
 * Storybook (Vue 3 Phase 0, P0.5), each drawn light and dark, touch and
 * compact through the toolbar's globals: Vue's counterpart of
 * check-theme-isolation.mjs and check-density.mjs, which hold React's
 * ThemeProvider and DensityScope to the same on a built fixture.
 *
 * - Everything a story draws sits in a Kozmos root: Kozmos's classes and
 *   tokens apply nowhere else. Everything drawn in <body> is read but
 *   Storybook's own chrome (scripts/vue/in-page.mjs names it exactly), so a
 *   Teleport to <body>, or a bridged React part's portal that found no
 *   Kozmos root, fails here.
 * - Every KozmosThemeProvider's root and its portal carry the theme asked
 *   for, and one portal is drawn for each provider.
 * - The theme reaches what is drawn: each colour every drawn element paints
 *   in the light theme and in the dark comes from the same token (the same
 *   role, each theme's value). Each is read again with every colour token of
 *   the theme set to a sentinel colour of its own (in-page.mjs,
 *   colourProvenance): a colour that does not move was written in, whatever
 *   token happens to hold its value, and one that reads another sentinel
 *   dark than light swaps to another role. No colour is allowed without a
 *   token: a glass surface's 1px edge, allowed by name until then (decision
 *   167), reads the glass edge's colour token since decision 208 (GAP-229).
 *   A colour that moves with a part's product-data property instead (a
 *   persona's own colour, in-page.mjs DATA_COLOURS) is the product's, the
 *   same in both themes.
 * - Each root carries the density asked for, or the one above it when it is
 *   nested (a provider inherits its density, and a DensityScope sets its
 *   own); each portal carries a provider's.
 * - Every drawn control whose size reads a density token (Button's height,
 *   a field's, an icon control's side) reads the value the token build gives
 *   its nearest density mark, and is drawn at that size in both densities:
 *   compact draws buttons 32, 40 and 48 and fields 40, touch keeps 44. One
 *   drawn at another size in either density fails, unless SIZED_OVER_DENSITY
 *   names it, with the size a rule of its part gives it instead and why;
 *   that one is held to that size in both.
 *
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit VUE_STORYBOOK_URL=… \
 *     node scripts/check-vue-themes.mjs
 */
import {
  densityTokens,
  finish,
  launch,
  newStoryPage,
  openStory,
  storiesFor,
} from "./vue/stories.mjs";

const SUITE = "themes";

/**
 * Controls that read a density token for their size but are drawn at a size
 * a rule of their part sets over it, each matched by a selector, held to
 * that size in both densities, with the reason. Any other control drawn at
 * neither its density's size nor this fails, and an allowance no story
 * draws fails too, so none outlives its part. `px` is one size for both
 * densities, or a size for each, for a rule that follows the density less
 * a fixed amount.
 */
const SIZED_OVER_DENSITY = [
  {
    selector: ".kozmos-input.kozmos-wayfinding-input",
    property: "height",
    px: 40,
    reason:
      "WayfindingInputRow's route fields are 40 tall in every density: its owned rule (packages/styles/src/styles/owned-native-fields.css) sets h-10 over the field's --density-field-height-md, inside the row's touch DensityScope (decision 89), and React's check-field-styles.mjs holds the same (wayfinding-input-row, height 40)",
  },
  {
    selector: ".kozmos-input.kozmos-otp-cell",
    property: "height",
    px: 44,
    reason:
      "OTPInput's cells are a 44 square in every density: its owned rule (packages/styles/src/styles/owned-native-fields.css, `.kozmos-input.kozmos-otp-cell`) sets h-11 w-11 over the field's --density-field-height-md, as React's OTPInput draws them",
  },
  {
    selector: ".kozmos-multiselect-input",
    property: "height",
    px: { touch: 32, compact: 28 },
    reason:
      "MultiSelect's and ChipInput's input is the field less its padding and border, 12 under --density-field-height-md, so the field keeps its density's height with the input in it: its owned rule (packages/styles/src/styles/owned-selection.css, `.kozmos-multiselect-input`) sets calc(var(--density-field-height-md) - 0.75rem), and React's check-density.mjs reads the same (multi-select input)",
  },
];

const { base, covered } = await storiesFor(SUITE);
const tokens = densityTokens();
const toPx = (value, rootFontSize) =>
  value.endsWith("rem")
    ? parseFloat(value) * rootFontSize
    : value.endsWith("px")
      ? parseFloat(value)
      : NaN;
const browser = await launch();
const failures = [];
const allowed = new Map(SIZED_OVER_DENSITY.map((allowance) => [allowance, 0]));
let followed = 0;
let themed = 0;
try {
  const { context, page, errors } = await newStoryPage(browser, base);
  try {
    for (const id of covered) {
      const colours = {};
      for (const theme of ["light", "dark"]) {
        const measured = { touch: new Map(), compact: new Map() };
        for (const density of ["touch", "compact"]) {
          const at = `${id} ${theme} ${density}`;
          const before = failures.length;
          try {
            await openStory(page, base, id, { theme, density });
            // Colours are read at touch: the density changes sizes alone.
            const { roots, outside, sized, painted } = await page.evaluate(
              ({ selectors, readColours }) => ({
                roots: window.__kozmosVue.roots(),
                outside: window.__kozmosVue.outsideRoots(),
                sized: window.__kozmosVue.densityControls(selectors),
                painted: readColours
                  ? window.__kozmosVue.colourProvenance()
                  : null,
              }),
              {
                selectors: SIZED_OVER_DENSITY.map(({ selector }) => selector),
                readColours: density === "touch",
              },
            );
            if (painted) colours[theme] = painted.colours;
            for (const element of outside)
              failures.push(
                `${at}: ${element} is drawn outside every Kozmos root`,
              );
            const providers = roots.filter((root) => !root.portal);
            const portals = roots.filter((root) => root.portal);
            if (!providers.length)
              failures.push(
                `${at}: the story draws no KozmosThemeProvider root`,
              );
            if (portals.length !== providers.length)
              failures.push(
                `${at}: ${providers.length} provider root(s) and ${portals.length} portal(s)`,
              );
            for (const root of roots) {
              const what = `${at}: ${root.portal ? "a portal" : "a root"} (${root.describe})`;
              if (root.theme !== theme)
                failures.push(
                  `${what} is data-theme="${root.theme}", not ${theme}`,
                );
              const expected = root.portal
                ? density
                : (root.inherited ?? density);
              if (root.density !== expected)
                failures.push(
                  `${what} is data-kozmos-density="${root.density}", not the ${expected} it inherits`,
                );
            }
            for (const control of sized) {
              const wanted = tokens[control.density]?.[control.token];
              const what = `${at}: ${control.element}'s ${control.property} (${control.selector})`;
              if (control.value !== wanted) {
                failures.push(
                  `${what} reads ${control.token} as "${control.value}", not ${control.density}'s ${wanted}`,
                );
                continue;
              }
              const px = toPx(wanted, control.rootFontSize);
              const atSize = control.minimum
                ? control.drawn >= px - 0.5
                : Math.abs(control.drawn - px) <= 0.5;
              measured[density].set(`${control.key} ${control.token}`, {
                ...control,
                px,
                atSize,
              });
            }
            if (failures.length === before)
              console.log(
                `PASS ${at}: ${providers.length} root(s) and ${portals.length} portal(s) marked; ${sized.length} density-sized control(s) read their token`,
              );
          } catch (error) {
            failures.push(`${at}: ${error.message}`);
          }
          for (const message of errors.splice(0))
            failures.push(`${at}: the page threw ${message}`);
        }
        // Two rules that size one property of one element with density
        // tokens (Button's `.kozmos-button-size-sm` and IconButton's
        // `h-icon-control-sm` over it) are one size: the cascade draws one of
        // them. When one is drawn at its token's size in both densities, the
        // other is the rule it overrides, and is not held to its own.
        const winners = new Set(
          [...measured.touch.values()]
            .filter(
              (touch) =>
                touch.atSize &&
                measured.compact.get(`${touch.key} ${touch.token}`)?.atSize,
            )
            .map((touch) => touch.key),
        );
        for (const read of Object.values(measured))
          for (const [key, control] of read)
            if (
              winners.has(control.key) &&
              !(
                control.atSize &&
                (read === measured.touch
                  ? measured.compact
                  : measured.touch
                ).get(key)?.atSize
              )
            )
              read.delete(key);
        // Each control, in both densities: at its token's size in both, or
        // at the size its allowance names in both.
        for (const [key, compact] of measured.compact)
          if (!measured.touch.has(key))
            failures.push(
              `${id} ${theme}: ${compact.element}'s ${compact.property} (${compact.selector}) is drawn compact and not touch`,
            );
        for (const [key, touch] of measured.touch) {
          const compact = measured.compact.get(key);
          const what = `${id} ${theme}: ${touch.element}'s ${touch.property} (${touch.selector})`;
          if (!compact) {
            failures.push(`${what} is drawn touch and not compact`);
            continue;
          }
          const allowance = SIZED_OVER_DENSITY.find(
            ({ selector, property }) =>
              property === touch.property && touch.matches.includes(selector),
          );
          if (allowance) {
            allowed.set(allowance, allowed.get(allowance) + 1);
            for (const [density, read] of [
              ["touch", touch],
              ["compact", compact],
            ]) {
              const px =
                typeof allowance.px === "number"
                  ? allowance.px
                  : allowance.px[density];
              if (Math.abs(read.drawn - px) > 0.5)
                failures.push(
                  `${what} is drawn ${read.drawn.toFixed(1)}px ${density}, not the ${px}px its allowance holds it to (${allowance.selector})`,
                );
            }
            continue;
          }
          if (touch.atSize && compact.atSize) {
            followed++;
            continue;
          }
          for (const [density, read] of [
            ["touch", touch],
            ["compact", compact],
          ])
            if (!read.atSize)
              failures.push(
                `${what} is drawn ${read.drawn.toFixed(1)}px ${density}, not ${read.minimum ? "at least " : ""}${read.px}px (${read.density} ${read.token}): it does not follow the density`,
              );
        }
      }
      // The same colours, light and dark, from the same tokens: each taken
      // from a token in both, and reading the same sentinel in both.
      if (colours.light && colours.dark) {
        const keys = Object.keys(colours.light);
        if (!keys.length) failures.push(`${id}: painted no colour to theme`);
        for (const key of keys) {
          const light = colours.light[key];
          const dark = colours.dark[key];
          if (!dark) {
            failures.push(
              `${id}: ${key} paints ${light.text} light and nothing dark`,
            );
            continue;
          }
          const written = [
            ["light", light],
            ["dark", dark],
          ].filter(([, read]) => !read.fromToken && !read.fromData);
          if (written.length)
            for (const [theme, read] of written)
              failures.push(
                `${id}: ${key} is ${read.text} ${theme}, and stays so when every colour token changes: it is written in, not a token's`,
              );
          // A product's data colour (a persona's) is the same in both
          // themes by design, and moves with no token.
          else if (light.fromData && dark.fromData) continue;
          else if (light.sentinel !== dark.sentinel)
            failures.push(
              `${id}: ${key} is ${light.text} light and ${dark.text} dark from different tokens: with each token set to a sentinel of its own it reads ${light.sentinel} light and ${dark.sentinel} dark`,
            );
          else themed++;
        }
      }
    }
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
for (const [allowance, count] of allowed)
  if (count)
    console.log(
      `${count} control reading(s) measured against an allowance of ${typeof allowance.px === "number" ? `${allowance.px}px` : `${allowance.px.touch}px touch and ${allowance.px.compact}px compact`} (${allowance.selector} ${allowance.property}): ${allowance.reason}`,
    );
  else
    failures.push(
      `no story drew ${allowance.selector}'s ${allowance.property}: remove its allowance from SIZED_OVER_DENSITY`,
    );
console.log(
  `${themed} colour(s) drawn light and dark from the same token, each moving with it`,
);
if (!followed)
  failures.push(
    "no story drew a control that follows the density: the density check measured nothing",
  );
else
  console.log(
    `${followed} control reading(s) followed the density, touch and compact`,
  );
finish(SUITE, covered, failures);
