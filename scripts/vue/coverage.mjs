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
  "vue-core-actions-button--subtle-emotions": {
    interaction: "buttons-in-order",
  },
  "vue-core-actions-button--loading": { interaction: "button-loading" },
  "vue-core-actions-button--disabled": { interaction: "button-disabled" },
  "vue-core-actions-button--emotions": { interaction: "buttons-in-order" },
  "vue-core-data-display-badge--default": {
    interaction: null,
    exempt: {
      interactions:
        "Badge is a status, not a control (decision 93): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-badge--outline": {
    interaction: null,
    exempt: {
      interactions:
        "Badge is a status, not a control (decision 93): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-badge--with-counter": {
    interaction: null,
    exempt: {
      interactions:
        "Badge is a status, not a control (decision 93): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-badge--default-with-counter": {
    interaction: null,
    exempt: {
      interactions:
        "Badge is a status, not a control (decision 93): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-badge--icon": {
    interaction: null,
    exempt: {
      interactions:
        "Badge is a status, not a control (decision 93): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-separator--default": {
    interaction: null,
    exempt: {
      interactions:
        "Separator is a line between groups: nothing to focus or press, so there is no interaction; axe scans it",
    },
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
  "vue-foundations-theming-themeprovider--default": {
    interaction: "theme-switch",
    exempt: {
      themes:
        "The story's own KozmosThemeProvider is the demo: it follows the theme its buttons set (system until one is pressed), not the toolbar's, as React's story draws it; the interaction checks each button's theme",
    },
  },
  "vue-foundations-theming-themeprovider--density": {
    interaction: null,
    exempt: {
      interactions:
        "Decision 82's controls at both densities, each one's interaction its own story's (Button, IconButton, Input, Select, Combobox, MultiSelect, NumberInput, PasswordInput); the themes suite measures each at its density, and axe scans them",
    },
  },
  "vue-foundations-typography-text--default": {
    interaction: null,
    exempt: {
      interactions:
        "Text is words on the page, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-typography-text--muted": {
    interaction: null,
    exempt: {
      interactions:
        "Text is words on the page, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-typography-text--large-bold": {
    interaction: null,
    exempt: {
      interactions:
        "Text is words on the page, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-typography-heading--default": {
    interaction: null,
    exempt: {
      interactions:
        "Heading is words on the page, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-typography-heading--all-levels": {
    interaction: null,
    exempt: {
      interactions:
        "Heading is words on the page, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-label--default": {
    interaction: null,
    exempt: {
      interactions:
        "A Label alone names nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-label--with-input": { interaction: "label-focuses-field" },
  "vue-foundations-icons-icon--default": {
    interaction: null,
    exempt: {
      interactions:
        "Icon is a glyph, decoration unless named: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-icons-icon--sizes": {
    interaction: null,
    exempt: {
      interactions:
        "Icon is a glyph, decoration unless named: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-icons-icon--colors": {
    interaction: null,
    exempt: {
      interactions:
        "Icon is a glyph, decoration unless named: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-foundations-icons-icon--registry": {
    interaction: null,
    exempt: {
      interactions:
        "Icon is a glyph, decoration unless named: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-kbd--default": {
    interaction: null,
    exempt: {
      interactions:
        "Kbd draws a key, it is not one: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-kbd--combination": {
    interaction: null,
    exempt: {
      interactions:
        "Kbd draws a key, it is not one: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-kbd--in-a-hint": {
    interaction: null,
    exempt: {
      interactions:
        "Kbd draws a key, it is not one: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-codeblock--default": { interaction: "button" },
  "vue-core-data-display-codeblock--scroll": {
    interaction: null,
    exempt: {
      interactions:
        "A read-only scroller: no interaction in the table drives scrolling; its tabindex keeps it a keyboard stop, and axe scans it (scrollable-region-focusable)",
    },
  },
  "vue-core-media-spriteicon--default": {
    interaction: null,
    exempt: {
      interactions:
        "SpriteIcon is an image of a map type, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-box--default": {
    interaction: null,
    exempt: {
      interactions:
        "Box is a plain block with nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-box--as-child": {
    interaction: null,
    exempt: {
      interactions:
        "Box is a plain block with nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-stack--default": {
    interaction: null,
    exempt: {
      interactions:
        "Stack lays its items out and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-stack--horizontal": {
    interaction: null,
    exempt: {
      interactions:
        "Stack lays its items out and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-grid--default": {
    interaction: null,
    exempt: {
      interactions:
        "Grid lays its items out and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-grid--virtualized": { interaction: "virtual-grid" },
  "vue-core-layout-container--in-a-panel": {
    interaction: null,
    exempt: {
      interactions:
        "Container pads a region and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-container--block-inset": {
    interaction: null,
    exempt: {
      interactions:
        "Container pads a region and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-container--default": {
    interaction: null,
    exempt: {
      interactions:
        "Container pads a region and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-container--fluid": {
    interaction: null,
    exempt: {
      interactions:
        "Container pads a region and has nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-surface--solid": {
    interaction: null,
    exempt: {
      interactions:
        "Surface is a material under its content, with nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-surface--glass": {
    interaction: null,
    exempt: {
      interactions:
        "Surface is a material under its content, with nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-surface--glass-panel": {
    interaction: null,
    exempt: {
      interactions:
        "Surface is a material under its content, with nothing of its own to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-tag--default": {
    interaction: null,
    exempt: {
      interactions:
        "A Tag with no remove listener is a label: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-tag--emotions": {
    interaction: null,
    exempt: {
      interactions:
        "A Tag with no remove listener is a label: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-tag--removable": { interaction: "button" },
  "vue-core-data-display-avatar--default": {
    interaction: null,
    exempt: {
      interactions:
        "Avatar is a picture or its initials: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-avatar--fallback": {
    interaction: null,
    exempt: {
      interactions:
        "Avatar is a picture or its initials: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-spinner--default": {
    interaction: null,
    exempt: {
      interactions:
        "Spinner is a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-spinner--small": {
    interaction: null,
    exempt: {
      interactions:
        "Spinner is a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-spinner--large": {
    interaction: null,
    exempt: {
      interactions:
        "Spinner is a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-spinner--every-size": {
    interaction: null,
    exempt: {
      interactions:
        "Spinner is a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-spinner--in-a-button": { interaction: "button-loading" },
  "vue-core-feedback-skeleton--default": {
    interaction: null,
    exempt: {
      interactions:
        "Skeleton is a placeholder: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--default": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--indeterminate": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--circular": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--top-of-page": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--circular-sizes": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--circular-complete": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--levels-added": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--tones": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--animated-update": {
    interaction: null,
    exempt: {
      interactions:
        "Progress is a progressbar, a status: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--selected-section": {
    interaction: null,
    exempt: {
      interactions:
        "ProgressTrack is decorative, in a box that says what it means: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-progress--live-position": {
    interaction: null,
    exempt: {
      interactions:
        "ProgressTrack is decorative, in a box that says what it means: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-personamark--default": {
    interaction: null,
    exempt: {
      interactions:
        "PersonaMark is a mark, or an image named by the persona: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-personamark--named": {
    interaction: null,
    exempt: {
      interactions:
        "PersonaMark is a mark, or an image named by the persona: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-personamark--group": {
    interaction: null,
    exempt: {
      interactions:
        "PersonaMark is a mark, or an image named by the persona: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-personamark--in-a-persona-list": {
    interaction: null,
    exempt: {
      interactions:
        "PersonaMark takes no input; the list's checkboxes are KozmosCheckbox, whose own stories press them (the checkbox interaction), so there is no interaction here; axe scans it",
    },
  },
  "vue-core-layout-card--default": { interaction: "controls-in-order" },
  "vue-core-layout-card--title-level": {
    interaction: null,
    exempt: {
      interactions:
        "A card is a surface, not a control: this story draws no link, button or field, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-card--padding": {
    interaction: null,
    exempt: {
      interactions:
        "A card is a surface, not a control: this story draws no link, button or field, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-card--without-header": { interaction: "buttons-in-order" },
  "vue-core-layout-card--header-actions": { interaction: "button" },
  "vue-core-layout-card--subtle-header": { interaction: "buttons-in-order" },
  "vue-core-layout-card--title-size": {
    interaction: null,
    exempt: {
      interactions:
        "A card is a surface, not a control: this story draws no link, button or field, so there is no interaction; axe scans it",
    },
  },
  "vue-core-layout-pageheader--plain": { interaction: "controls-in-order" },
  "vue-core-layout-pageheader--default": { interaction: "controls-in-order" },
  "vue-core-layout-pageheader--landing": { interaction: "button" },
  "vue-core-layout-pageheader--with-info": { interaction: "controls-in-order" },
  "vue-core-layout-breadcrumb--default": { interaction: "controls-in-order" },
  "vue-core-actions-link--default": { interaction: "controls-in-order" },
  "vue-core-actions-link--subtle": { interaction: "controls-in-order" },
  "vue-core-actions-link--external": { interaction: "controls-in-order" },
  "vue-core-actions-link--external-in-text": {
    interaction: "controls-in-order",
  },
  "vue-core-actions-link--external-right-to-left": {
    interaction: "controls-in-order",
  },
  "vue-core-feedback-emptystate--default": { interaction: "button" },
  "vue-core-feedback-emptystate--compact": {
    interaction: null,
    exempt: {
      interactions:
        "An empty state with no action draws no link, button or field, so there is no interaction; axe scans it",
    },
  },
  "vue-core-feedback-emptystate--download-progress": { interaction: "button" },
  "vue-core-feedback-emptystate--with-list": { interaction: "button" },
  "vue-core-data-display-list--default": {
    interaction: null,
    exempt: {
      interactions:
        "A list of rows of words: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-list--compact": {
    interaction: null,
    exempt: {
      interactions:
        "A list of rows of words: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-data-display-list--checklist": {
    interaction: "buttons-in-order",
  },
  "vue-core-data-display-list--persona-visibility": {
    interaction: "persona-visibility",
  },
  "vue-core-data-display-descriptionlist--default": {
    interaction: null,
    exempt: {
      interactions:
        "A read-only record (decision 199): values under labels, nothing to focus or press; axe scans it",
    },
  },
  "vue-core-data-display-metastrip--default": {
    interaction: "meta-strip-focus",
  },
  "vue-core-data-display-metastrip--with-visible-labels": {
    interaction: "meta-strip-focus",
  },
  "vue-core-data-display-metastrip--overflowing": {
    interaction: "meta-strip-scroll",
  },
  "vue-core-data-display-timeline--detailed": {
    interaction: null,
    exempt: {
      interactions:
        "A timeline of events is read, not operated: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-data-display-timeline--basic": {
    interaction: null,
    exempt: {
      interactions:
        "A timeline of events is read, not operated: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-data-display-timeline--compact": {
    interaction: null,
    exempt: {
      interactions:
        "A timeline of events is read, not operated: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-data-display-timeline--default": {
    interaction: null,
    exempt: {
      interactions:
        "A timeline of events is read, not operated: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--default": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--destructive": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--success": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--warning": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--info": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--without-title": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-alert--liveness-and-title": {
    interaction: null,
    exempt: {
      interactions:
        "An Alert is a notice with no control of its own: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-notice--collapsed": {
    interaction: "notice-disclosure",
  },
  "vue-core-feedback-notice--expanded": {
    interaction: "notice-disclosure",
  },
  "vue-core-feedback-notice--single-line": {
    interaction: null,
    exempt: {
      interactions:
        "A notice with no detail offers no disclosure and holds no control: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-notice--success": {
    interaction: null,
    exempt: {
      interactions:
        "A notice with no detail offers no disclosure and holds no control: nothing to focus or press; axe scans it",
    },
  },
  "vue-core-feedback-notice--success-progress-and-done": {
    interaction: "button",
  },
  "vue-core-feedback-notice--emergency": {
    interaction: "button",
  },
  "vue-core-feedback-notice--search-with-ai": {
    interaction: "button",
  },
  "vue-core-inputs-counter--default": {
    interaction: null,
    exempt: {
      interactions:
        "Counter is a count, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-counter--brand": {
    interaction: null,
    exempt: {
      interactions:
        "Counter is a count, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-counter--small": {
    interaction: null,
    exempt: {
      interactions:
        "Counter is a count, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-counter--destructive": {
    interaction: null,
    exempt: {
      interactions:
        "Counter is a count, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-counter--emotions": {
    interaction: null,
    exempt: {
      interactions:
        "Counter is a count, not a control: nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-actions-iconbutton--variants": { interaction: "buttons-in-order" },
  "vue-core-actions-iconbutton--sizes": { interaction: "buttons-in-order" },
  "vue-core-actions-iconbutton--counter": { interaction: "buttons-in-order" },
  "vue-core-actions-iconbutton--default": { interaction: "button" },
  "vue-core-inputs-checkbox--default": { interaction: "checkbox" },
  "vue-core-inputs-checkbox--checked": { interaction: "checkbox-held" },
  "vue-core-inputs-checkbox--disabled": { interaction: "checkbox-disabled" },
  "vue-core-inputs-checkbox--error": { interaction: "checkbox" },
  "vue-core-inputs-checkbox--with-description": { interaction: "checkbox" },
  "vue-core-inputs-rating--default": { interaction: "rating-held" },
  "vue-core-inputs-rating--thumbs": { interaction: "rating-thumbs" },
  "vue-core-inputs-rating--read-only": {
    interaction: null,
    exempt: {
      interactions:
        "a read-only Rating is one image, not a control (React's Rating): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-rating--read-only-halves": {
    interaction: null,
    exempt: {
      interactions:
        "a read-only Rating is one image, not a control (React's Rating): nothing to focus or press, so there is no interaction; axe scans it",
    },
  },
  "vue-core-inputs-fieldwrapper--default": { interaction: "controls-in-order" },
  "vue-core-inputs-fieldwrapper--validation-states": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-input--default": { interaction: "controls-in-order" },
  "vue-core-inputs-input--with-helper-text": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-input--with-error": { interaction: "controls-in-order" },
  "vue-core-inputs-input--validation-states": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-input--actions": { interaction: "field-actions" },
  "vue-core-inputs-input--edit-action": { interaction: "field-actions" },
  "vue-core-inputs-input--mixed-value": { interaction: "mixed-field" },
  "vue-core-inputs-textarea--default": { interaction: "controls-in-order" },
  "vue-core-inputs-textarea--with-error": { interaction: "controls-in-order" },
  "vue-core-inputs-textarea--character-count": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-passwordinput--default": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-passwordinput--visible": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-passwordinput--error": { interaction: "controls-in-order" },
  "vue-core-inputs-passwordinput--without-toggle": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-passwordinput--right-to-left": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--read-only": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--default": { interaction: "controls-in-order" },
  "vue-core-inputs-numberinput--with-helper-text": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--validation-states": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--without-steppers": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--with-unit": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--with-unit-right-to-left": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--right-to-left": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-numberinput--mixed-value": { interaction: "mixed-field" },
  "vue-core-inputs-otpinput--default": { interaction: "controls-in-order" },
  "vue-core-inputs-otpinput--with-error": { interaction: "controls-in-order" },
  "vue-core-inputs-otpinput--with-default-value": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-otpinput--validation-states": {
    interaction: "controls-in-order",
  },
  "vue-core-inputs-switch--default": { interaction: "switch" },
  "vue-core-inputs-switch--checked": { interaction: "switch" },
  "vue-core-inputs-switch--disabled": { interaction: "switch-disabled" },
  "vue-core-inputs-switch--error": { interaction: "switch" },
  "vue-core-inputs-switch--with-description": { interaction: "switch" },
  "vue-core-inputs-switch--state-label": { interaction: "switch" },
  "vue-core-inputs-radiogroup--default": { interaction: "radio-choice" },
  "vue-core-inputs-radiogroup--disabled": { interaction: "radio-disabled" },
  "vue-core-inputs-radiogroup--error": { interaction: "radio-choice" },
  "vue-core-inputs-radiogroup--with-description": {
    interaction: "radio-choice",
  },
  "vue-core-inputs-radiogroup--cards": { interaction: "radio-choice" },
  "vue-core-inputs-radiogroup--tiles": { interaction: "radio-choice" },
  "vue-core-inputs-segmentedcontrol--default": { interaction: "segmented" },
  "vue-core-inputs-segmentedcontrol--full-width": { interaction: "segmented" },
  "vue-core-inputs-segmentedcontrol--error": {
    interaction: "segmented-held",
  },
  "vue-core-inputs-segmentedcontrol--disabled": {
    interaction: "segmented-disabled",
  },
  "vue-core-inputs-slider--default": { interaction: "slider" },
  "vue-core-inputs-slider--range": { interaction: "slider" },
  "vue-core-inputs-slider--with-readout": { interaction: "slider" },
  "vue-core-inputs-listbox--grouped-and-ungrouped": { interaction: "listbox" },
  "vue-core-inputs-listbox--single": { interaction: "listbox" },
  "vue-core-inputs-listbox--multiple": { interaction: "listbox" },
  "vue-core-inputs-listbox--grouped": { interaction: "listbox" },
  "vue-core-inputs-select--default": { interaction: "select" },
  "vue-core-inputs-select--with-scroll": { interaction: "select" },
  "vue-core-inputs-select--disabled": { interaction: "select-disabled" },
  "vue-core-inputs-select--with-error": { interaction: "select" },
  "vue-core-inputs-select--option-counts": { interaction: "select" },
  "vue-core-inputs-select--option-counts-open": { interaction: "select-open" },
  "vue-core-inputs-select--mixed-value": { interaction: "select-mixed" },
  "vue-core-inputs-combobox--default": { interaction: "combobox" },
  "vue-core-inputs-combobox--with-validation": { interaction: "combobox" },
  "vue-core-inputs-combobox--grouped": { interaction: "combobox" },
  "vue-core-inputs-combobox--mixed-value": { interaction: "combobox-mixed" },
  "vue-core-data-display-chip--default": { interaction: "chip-toggles" },
  "vue-core-data-display-chip--sizes": {
    interaction: null,
    exempt: {
      interactions:
        "Plain chips show a size or a variant: nothing to focus or press, so there is no interaction; axe scans them",
    },
  },
  "vue-core-data-display-chip--variants": {
    interaction: null,
    exempt: {
      interactions:
        "Plain chips show a size or a variant: nothing to focus or press, so there is no interaction; axe scans them",
    },
  },
  "vue-core-data-display-chip--one-choice": { interaction: "radio-choice" },
  "vue-core-inputs-multiselect--default": { interaction: "multiselect" },
  "vue-core-inputs-multiselect--with-selected-values": {
    interaction: "multiselect",
  },
  "vue-core-inputs-multiselect--grouped": { interaction: "multiselect" },
  "vue-core-inputs-chipinput--default": { interaction: "chip-input" },
  "vue-core-overlays-dialog--default": { interaction: "dialog" },
  "vue-core-overlays-drawer--default": { interaction: "drawer" },
  "vue-core-overlays-drawer--inline": { interaction: "drawer-inline" },
  "vue-core-overlays-bottomsheet--default": { interaction: "bottom-sheet" },
  "vue-core-overlays-popover--default": { interaction: "popover" },
  "vue-core-overlays-popover--anchored-to-a-control": {
    interaction: "popover-anchored",
  },
  "vue-core-overlays-popover--anchored-to-a-rect": {
    interaction: "popover-rect",
  },
  "vue-core-overlays-tooltip--default": { interaction: "tooltip" },
  "vue-core-overlays-layering--select-in-dialog": {
    interaction: "layers-select",
  },
  "vue-core-overlays-layering--combobox-in-dialog": {
    interaction: "layers-combobox",
  },
  "vue-core-overlays-layering--tooltip-in-dialog": {
    interaction: "layers-tooltip",
  },
  "vue-core-overlays-layering--select-in-drawer": {
    interaction: "layers-select",
  },
  "vue-core-overlays-layering--combobox-in-drawer": {
    interaction: "layers-combobox",
  },
  "vue-core-overlays-layering--select-in-bottom-sheet": {
    interaction: "layers-select",
  },
  "vue-core-overlays-layering--select-in-popover": {
    interaction: "layers-select",
  },
  "vue-core-overlays-layering--combobox-in-popover": {
    interaction: "layers-combobox",
  },
  "vue-core-layout-menu--default": { interaction: "menu" },
  "vue-core-layout-menu--external-item": { interaction: "menu" },
  "vue-core-layout-menu--external-item-open": { interaction: "menu-open" },
  "vue-core-layout-contextmenu--default": { interaction: "context-menu" },
  "vue-core-layout-contextmenu--open": { interaction: "context-menu-open" },
  "vue-core-actions-splitbutton--default": { interaction: "split-button" },
  "vue-core-inputs-search--default": { interaction: "search-typing" },
  "vue-core-inputs-search--clearable": { interaction: "search-clear" },
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
