/**
 * Owned CSS for @kozmos-ds/vue, over every story of the built Vue Storybook
 * (Vue 3 Phase 0, P0.5), light and dark, touch and compact: Vue's
 * counterpart of check-owned-css.mjs, which holds React's parts to the owned
 * `.kozmos-*` rules (packages/styles/src/styles/*.css) on a built fixture.
 * Vue's parts draw with the same classes from the same stylesheet, so what
 * is held here is that each draws what the owned rules say, whatever else
 * the page does.
 *
 * - Every `.kozmos-*` class a story draws is named by a rule: a part that
 *   writes an owned class the stylesheet does not have draws nothing for it.
 * - Without @scope. Every @scope rule is removed from the page's
 *   stylesheets, as WebKit 26.0–26.3 drops them for a form field and as an
 *   engine without @scope drops them all: every property an owned rule
 *   declares for a drawn element, by longhand, computes as before, unless a
 *   rule inside @scope the element matches declares it too (a utility over
 *   the owned rule, which goes with @scope by design).
 * - Under a host's rules. React's owned-CSS host stylesheet, loaded before
 *   Kozmos's (its buttons and fields orange with a purple edge, its labels
 *   large, its own `.flex`), changes no property an owned rule declares.
 *
 * A value taken from the parent (inherit, currentColor, em) or resolved by
 * the layout (a percentage, auto, a viewport unit) is left out of both
 * comparisons: it computes as the page around the element is drawn, which
 * @scope's utilities and a host's rules move by design.
 *
 *   ADAPTIVE_BROWSER=chromium|firefox|webkit VUE_STORYBOOK_URL=… \
 *     node scripts/check-vue-owned-css.mjs
 */
import {
  finish,
  launch,
  newStoryPage,
  openStory,
  storiesFor,
} from "./vue/stories.mjs";

const SUITE = "owned-css";

/**
 * A host page's own rules, loaded before Kozmos's, as check-owned-css.mjs
 * draws React's parts under: its form controls orange with a purple edge,
 * its labels large, its paragraphs spaced, and its own `.flex` and
 * `.rounded-control`.
 */
const HOST_RULES = `
  html { font-size: 16px } body { margin: 13px }
  input, textarea, button { background: orange; border: 3px solid purple; border-radius: 3px }
  label { font-size: 30px } p { margin: 20px }
  .flex { display: block } .rounded-control { border-radius: 3px }
`;

/**
 * The `.kozmos-*` classes a part writes that no rule is meant to name, each
 * with what it is for. Any other unnamed one fails.
 */
const MARKERS = {
  // React's Text (drawn here through the bridge) marks every text with it;
  // what it draws is the size, weight and colour rules, .kozmos-text-*.
  "kozmos-text": "React's Text's mark; its rules are .kozmos-text-*",
  // React's ChipInput writes it on its field, beside data-slot="chip-input";
  // the field draws with utilities, and its input with
  // .kozmos-multiselect-input's rule.
  "kozmos-chip-input":
    "React's ChipInput's mark on its field; its input's rule is .kozmos-multiselect-input",
};

/**
 * Owned declarations a flex row sizes over, each with why: the owned value
 * is the element's size outside the row, and inside it the row (a utility
 * of its parent, which goes with @scope) gives it the room. Compared
 * without @scope, the row goes and the owned value comes back, by design.
 * An allowance no story draws fails, so none outlives its part.
 */
const FLEX_SIZED = [
  {
    selector: ".kozmos-multiselect-input",
    property: "width",
    reason:
      "MultiSelect's and ChipInput's input is flex-1 in its ChipGroup's flex row (`flex flex-wrap`, a utility), which gives it the room after the chips; its owned 6rem is its width outside a row, and drawn so once @scope and the row go",
  },
];
const flexSized = new Map(FLEX_SIZED.map((allowance) => [allowance, 0]));

/**
 * A flex or grid container's children are blockified: an owned
 * `display: inline-flex` computes `flex` inside a utility's flex row, and
 * `inline-flex` again when @scope (and the row) goes. The same declaration.
 */
const blockified = (property, value) =>
  property === "display"
    ? value.replace(/^inline-/, "").replace(/^inline$/, "block")
    : value;

const { base, covered } = await storiesFor(SUITE);
const browser = await launch();
const failures = [];
let compared = 0;
try {
  const { context, page, errors } = await newStoryPage(browser, base);
  try {
    for (const id of covered)
      for (const theme of ["light", "dark"])
        for (const density of ["touch", "compact"]) {
          const at = `${id} ${theme} ${density}`;
          const before = failures.length;
          try {
            await openStory(page, base, id, { theme, density });
            const reading = await page.evaluate((host) => {
              const vue = window.__kozmosVue;
              const unnamed = vue.unnamedOwnedClasses();
              vue.holdDrawn();
              const rest = vue.ownedDeclarations();
              vue.addHostRules(host);
              const hosted = vue.ownedDeclarations();
              vue.removeHostRules();
              const removed = vue.removeScopedRules();
              const unscoped = vue.ownedDeclarations();
              return { unnamed, rest, hosted, removed, unscoped };
            }, HOST_RULES);
            for (const { name, message } of reading.unnamed)
              if (!Object.hasOwn(MARKERS, name))
                failures.push(`${at}: ${message}`);
            if (!reading.removed)
              failures.push(`${at}: the page has no @scope rule to remove`);
            const keys = Object.keys(reading.rest);
            let held = 0;
            for (const key of keys) {
              const { value, selector, declared, contested } =
                reading.rest[key];
              const unscoped = reading.unscoped[key];
              const hosted = reading.hosted[key];
              if (!contested) held++;
              const property = key.slice(key.lastIndexOf(" ") + 1);
              const sizedByRow = FLEX_SIZED.find(
                (allowance) =>
                  allowance.selector === selector &&
                  allowance.property === property,
              );
              if (sizedByRow)
                flexSized.set(sizedByRow, flexSized.get(sizedByRow) + 1);
              else if (
                !contested &&
                unscoped &&
                blockified(property, unscoped.value) !==
                  blockified(property, value)
              )
                failures.push(
                  `${at}: ${key} is ${value}, and ${unscoped.value} without @scope (${selector} { ${declared} })`,
                );
              if (hosted && hosted.value !== value)
                failures.push(
                  `${at}: ${key} is ${value}, and ${hosted.value} under a host's rules (${selector} { ${declared} })`,
                );
            }
            compared += held;
            if (failures.length === before)
              console.log(
                `PASS ${at}: ${held} owned declaration(s) hold without @scope (${reading.removed} removed), and ${keys.length} under a host's rules`,
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
for (const [allowance, count] of flexSized)
  if (count)
    console.log(
      `${count} reading(s) of ${allowance.selector}'s ${allowance.property} left to its flex row: ${allowance.reason}`,
    );
  else
    failures.push(
      `no story drew ${allowance.selector}'s ${allowance.property}: remove its allowance from FLEX_SIZED`,
    );
if (!compared)
  failures.push("no story drew an owned rule: the suite compared nothing");
else console.log(`${compared} owned declaration readings compared`);
finish(SUITE, covered, failures);
