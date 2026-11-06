/**
 * Token references for @kozmos-ds/vue, over every story of the built Vue
 * Storybook (Vue 3 Phase 0, P0.5), in a light and a dark root: Vue's
 * counterpart of check-token-references.mjs, which holds React's parts to
 * their tokens on a built fixture.
 *
 * - No unresolved var(). Every var() a drawn element reads, from a rule it
 *   matches or its own style attribute, names a property set where the
 *   element is, or gives a fallback that does. A part drawn outside a Kozmos
 *   root reads every token unset, and draws as the browser's defaults.
 * - No raw colour. Every colour a drawn element paints (its text, fill,
 *   borders, outline, shadows, an SVG's fill and stroke, its ::before and
 *   ::after) is taken from a colour token of the theme: read again with
 *   every such token set to a sentinel colour of its own, it moves
 *   (scripts/vue/in-page.mjs, colourProvenance). A token at a lower alpha,
 *   mixed by color-mix(), or reached through currentColor moves with it; a
 *   colour written in stays put, even one a token happens to hold, as black
 *   and white are held in both themes. A story's own scaffolding is held
 *   to it too: examples use only Kozmos. Everything drawn in <body> is read
 *   but Storybook's own chrome.
 *
 * scripts/vue/coverage.mjs says which stories are drawn; one it does not
 * name fails here before any is.
 *
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit VUE_STORYBOOK_URL=… \
 *     node scripts/check-vue-token-references.mjs
 */
import {
  finish,
  launch,
  newStoryPage,
  openStory,
  storiesFor,
} from "./vue/stories.mjs";

const SUITE = "token-references";

/**
 * Properties a drawn element may read unset, each with why it draws right
 * without them. Any other name read unset fails.
 */
const UNSET_BY_DESIGN = {
  // The glass spotlight's position, which React's DesignConfigProvider sets
  // and moves with the pointer. Vue has no design config yet (its MotionKey
  // is the key one will provide), and without one the spotlight's opacity
  // falls back to 0 (`var(--glass-spotlight-opacity, 0)`), so the glass
  // Button's ::after draws nothing either way.
  "--spotlight-x":
    "the design config's glass spotlight, transparent without one",
  "--spotlight-y":
    "the design config's glass spotlight, transparent without one",
};
const { base, covered } = await storiesFor(SUITE);
const browser = await launch();
const failures = [];
try {
  const { context, page, errors } = await newStoryPage(browser, base);
  try {
    for (const id of covered)
      for (const theme of ["light", "dark"]) {
        const at = `${id} ${theme}`;
        try {
          await openStory(page, base, id, { theme });
          const { references, colours } = await page.evaluate(() => ({
            references: window.__kozmosVue.unresolvedReferences(),
            colours: window.__kozmosVue.hardCodedColours(),
          }));
          const unset = references.problems.filter(
            ({ name }) => !Object.hasOwn(UNSET_BY_DESIGN, name),
          );
          for (const { message } of unset) failures.push(`${at}: ${message}`);
          for (const problem of colours.problems)
            failures.push(`${at}: ${problem}`);
          if (!references.reads || !colours.colours)
            failures.push(
              `${at}: read ${references.reads} var() and ${colours.colours} colours: the story drew nothing to check`,
            );
          else if (!unset.length && !colours.problems.length)
            console.log(
              `PASS ${at}: ${references.reads} var() reads over ${references.elements} elements resolve; ${colours.colours} colours move with the theme's ${colours.tokens} colour tokens`,
            );
        } catch (error) {
          failures.push(`${at}: ${error.message}`);
        }
        for (const message of errors.splice(0))
          failures.push(`${at}: the page threw ${message}`);
      }
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
finish(SUITE, covered, failures);
