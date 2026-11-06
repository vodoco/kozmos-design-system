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
 *   dark than light swaps to another role.
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
 * draws fails too, so none outlives its part.
 */
const SIZED_OVER_DENSITY = [
  {
    selector: ".kozmos-input.kozmos-wayfinding-input",
    property: "height",
    px: 40,
    reason:
      "WayfindingInputRow's route fields are 40 tall in every density: its owned rule (packages/styles/src/styles/owned-native-fields.css) sets h-10 over the field's --density-field-height-md, inside the row's touch DensityScope (decision 89), and React's check-field-styles.mjs holds the same (wayfinding-input-row, height 40)",
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
                  ? window.__kozmosVue.colourProvenance().colours
                  : null,
              }),
              {
                selectors: SIZED_OVER_DENSITY.map(({ selector }) => selector),
                readColours: density === "touch",
              },
            );
            if (painted) colours[theme] = painted;
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
            ])
              if (Math.abs(read.drawn - allowance.px) > 0.5)
                failures.push(
                  `${what} is drawn ${read.drawn.toFixed(1)}px ${density}, not the ${allowance.px}px its allowance holds it to (${allowance.selector})`,
                );
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
          ].filter(([, read]) => !read.fromToken);
          if (written.length)
            for (const [theme, read] of written)
              failures.push(
                `${id}: ${key} is ${read.text} ${theme}, and stays so when every colour token changes: it is written in, not a token's`,
              );
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
      `${count} control reading(s) measured against an allowance of ${allowance.px}px (${allowance.selector} ${allowance.property}): ${allowance.reason}`,
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
