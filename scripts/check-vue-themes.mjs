/**
 * Themes and densities for @kozmos-ds/vue, over every story of the built Vue
 * Storybook (Vue 3 Phase 0, P0.5), each drawn light and dark, touch and
 * compact through the toolbar's globals: Vue's counterpart of
 * check-theme-isolation.mjs and check-density.mjs, which hold React's
 * ThemeProvider and DensityScope to the same on a built fixture.
 *
 * - Everything a story draws sits in a Kozmos root: Kozmos's classes and
 *   tokens apply nowhere else.
 * - Every KozmosThemeProvider's root and its portal carry the theme asked
 *   for, and one portal is drawn for each provider.
 * - The theme reaches what is drawn: each colour every drawn element paints
 *   in the light theme and in the dark comes from a token the two share (the
 *   same role, each theme's value). A colour that stays one theme's value in
 *   the other, or swaps to another role, fails.
 * - Each root carries the density asked for, or the one above it when it is
 *   nested (a provider inherits its density, and a DensityScope sets its
 *   own); each portal carries a provider's.
 * - Every drawn control whose size reads a density token (Button's height,
 *   a field's, an icon control's side) reads the value the token build gives
 *   its nearest density mark, and is drawn at that size in both densities:
 *   compact draws buttons 32, 40 and 48 and fields 40, touch keeps 44. One
 *   drawn at its token in one density and not the other did not follow the
 *   density. One drawn at neither is sized by a rule that wins over the
 *   density's (WayfindingCard's fields are 40 in both), and is reported, not
 *   failed: which declaration wins is the cascade's, not the part's.
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
const notes = new Set();
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
            const { roots, outside, sized, painted } = await page.evaluate(
              () => ({
                roots: window.__kozmosVue.roots(),
                outside: window.__kozmosVue.outsideRoots(),
                sized: window.__kozmosVue.densityControls(),
                painted: window.__kozmosVue.colourTokens(),
              }),
            );
            if (density === "touch") colours[theme] = painted;
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
        // in neither (another rule sizes it).
        for (const [key, touch] of measured.touch) {
          const compact = measured.compact.get(key);
          const what = `${id} ${theme}: ${touch.element}'s ${touch.property} (${touch.selector})`;
          if (!compact) {
            failures.push(`${what} is drawn touch and not compact`);
            continue;
          }
          if (touch.atSize && compact.atSize) followed++;
          else if (!touch.atSize && !compact.atSize)
            notes.add(
              `${id}: ${touch.element}'s ${touch.property} is ${touch.drawn.toFixed(1)}px touch and ${compact.drawn.toFixed(1)}px compact, sized by a rule over ${touch.token} (${touch.selector})`,
            );
          else
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
      // The same colours, light and dark, from the same tokens.
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
          if (!light.tokens.some((token) => dark.tokens.includes(token)))
            failures.push(
              `${id}: ${key} is ${light.text} light (${light.tokens.slice(0, 3).join(", ") || "no token"}) and ${dark.text} dark (${dark.tokens.slice(0, 3).join(", ") || "no token"}): no token draws it in both themes`,
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
for (const note of notes) console.log(`NOTE ${note}`);
console.log(`${themed} colour(s) drawn light and dark from a shared token`);
if (!followed)
  failures.push(
    "no story drew a control that follows the density: the density check measured nothing",
  );
else
  console.log(
    `${followed} control reading(s) followed the density, touch and compact`,
  );
finish(SUITE, covered, failures);
