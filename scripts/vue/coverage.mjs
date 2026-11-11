/**
 * Every story the Vue Storybook builds (apps/docs/.storybook-vue, from
 * packages/vue/src/**\/*.stories.ts), and what checks it in a browser. The
 * four suites are Vue's counterparts of React's browser suites (Vue 3 Phase
 * 0, P0.5), each run over the built Vue Storybook in Chromium, Firefox and
 * WebKit:
 *
 * - `themes`: every story in light and dark, touch and compact: everything
 *   it draws in <body> sits in a Kozmos root, every root and portal carries
 *   the toolbar's theme and its density, every control that reads a density
 *   token is its density's size, and every colour comes from the same token
 *   light and dark (scripts/check-vue-themes.mjs);
 * - `owned-css`: every `.kozmos-*` class a story draws is a rule of the
 *   stylesheet, and what the owned rules declare holds with every `@scope`
 *   rule removed, as WebKit draws a field (scripts/check-vue-owned-css.mjs);
 * - `token-references`: no `var()` a drawn element reads is unresolved, and
 *   every colour it paints moves with the theme's colour tokens: it is taken
 *   from one, not written in (scripts/check-vue-token-references.mjs);
 * - `interactions`: the story's interaction, with real keyboard and pointer
 *   input, and an axe scan at WCAG 2.2 AA of every story, light and dark,
 *   as it draws and after its interaction (scripts/check-vue-interactions.mjs).
 *
 * The three generic suites run over every story unless `exempt` names the
 * suite with the reason. The interaction suite runs the interaction a story
 * names, from its own table; `exempt.interactions` says why a story has
 * none, and spares it the interaction only: axe scans it all the same. Each
 * suite starts by holding this register to the built index
 * (`coverageProblems`): a story that is not here fails all four, so a new
 * Vue story cannot go unchecked, and an entry whose story is gone fails them
 * too.
 *
 * Every Vue story's id starts `vue-` and no React story's does
 * (`storyIdProblems`): the visual review's baselines of both Storybooks
 * share one folder, named by story id, so the prefix is all that keeps a
 * Vue story's drawing from overwriting a React story's. The register's own
 * ids are held to it in `pnpm test:ci` (scripts/ci/vue-story-coverage.test.mjs),
 * the built Vue index by every Vue suite, and React's built index by the
 * visual review and its baseline pruning (tests/visual/capture.ts,
 * scripts/visual/prune-baselines.mjs).
 */
export const VUE_SUITES = [
  "themes",
  "owned-css",
  "token-references",
  "interactions",
];

/**
 * @type {Record<string, { interaction: string | null, exempt?: Record<string, string> }>}
 */
export const VUE_STORIES = {
  "vue-backdrop--target": { interaction: "backdrop-target" },
  "vue-core-actions-button--default": { interaction: "button" },
  "vue-core-actions-button--destructive": { interaction: "button" },
  "vue-core-actions-button--outline": { interaction: "button" },
  "vue-core-actions-button--secondary": { interaction: "button" },
  "vue-core-actions-button--ghost": { interaction: "button" },
  "vue-core-actions-button--link": { interaction: "button" },
  "vue-core-actions-button--glass": { interaction: "button" },
  "vue-core-actions-button--subtle": { interaction: "button" },
  "vue-core-actions-button--subtle-destructive": { interaction: "button" },
  "vue-core-actions-button--loading": { interaction: "button-loading" },
  "vue-core-actions-button--disabled": { interaction: "button-disabled" },
  "vue-core-actions-button--emotions": { interaction: "buttons-in-order" },
  "vue-core-actions-button--compact-scope": {
    interaction: "buttons-in-order",
  },
  "vue-poicard--default": { interaction: "buttons-in-order" },
  "vue-poicard--inside-map-overlay": { interaction: "buttons-in-order" },
  "vue-searchbar--floating-overlay": { interaction: "search-typing" },
  "vue-searchbar--inline": { interaction: "search-typing" },
  "vue-stepper--dots": {
    interaction: null,
    exempt: {
      // Drawn by every other suite, and scanned by axe in this one. Its
      // dots are a status: a list with the current step marked, nothing a
      // visitor can focus or press. Choosing a step is GAP-173 (#427), not
      // on main; it gets an interaction when it lands.
      interactions:
        "Stepper's dots take no input: a list with the current step marked, nothing to focus or press",
    },
  },
  "vue-wayfindingcard--wayfinding-flow": { interaction: "wayfinding-swap" },
  "vue-wayfindingcard--inside-map-overlay": {
    interaction: "wayfinding-swap",
  },
};

/** What every Vue story's id starts with, and no React story's. */
export const VUE_ID_PREFIX = "vue-";

/**
 * Story ids on the wrong side of the prefix: a Vue story whose id does not
 * start `vue-`, a React story whose id does. Empty when both sides keep to
 * it; either list may be left out.
 */
export function storyIdProblems({ vue = [], react = [] }) {
  return [
    ...vue
      .filter((id) => !id.startsWith(VUE_ID_PREFIX))
      .map(
        (id) =>
          `${id} is a Vue story whose id does not start "${VUE_ID_PREFIX}": give its title a "Vue/" first part, as every Vue story's has, or its baselines take React's names`,
      ),
    ...react
      .filter((id) => id.startsWith(VUE_ID_PREFIX))
      .map(
        (id) =>
          `${id} is a React story whose id starts "${VUE_ID_PREFIX}", which only Vue's stories' do: rename it, or its baselines share names with Vue's`,
      ),
  ];
}

/**
 * What is wrong with the register against the stories the build indexed:
 * a story id without the Vue prefix, a story with no entry, an entry with
 * no story, an exemption without a reason or for a suite that does not
 * exist, and a story with neither an interaction nor the reason it has
 * none. Empty when the two agree.
 */
export function coverageProblems(
  storyIds,
  register = VUE_STORIES,
  suites = VUE_SUITES,
) {
  const problems = storyIdProblems({
    vue: [...new Set([...storyIds, ...Object.keys(register)])],
  });
  const built = new Set(storyIds);
  for (const id of storyIds)
    if (!Object.hasOwn(register, id))
      problems.push(
        `${id} is a Vue story with no entry in scripts/vue/coverage.mjs: name its interaction, or why a suite cannot draw it`,
      );
  for (const [id, entry] of Object.entries(register)) {
    if (!built.has(id))
      problems.push(
        `${id} is in scripts/vue/coverage.mjs but not in the built Vue Storybook: remove it, or rebuild the Storybook`,
      );
    for (const [suite, reason] of Object.entries(entry.exempt ?? {})) {
      if (!suites.includes(suite))
        problems.push(`${id} is exempt from "${suite}", which is no suite`);
      if (typeof reason !== "string" || reason.trim().length < 20)
        problems.push(`${id} is exempt from ${suite} without a reason`);
    }
    if (!entry.interaction && !entry.exempt?.interactions)
      problems.push(
        `${id} has no interaction and no reason for having none (exempt.interactions)`,
      );
    if (entry.interaction && entry.exempt?.interactions)
      problems.push(`${id} names an interaction and is exempt from them`);
  }
  return problems;
}
