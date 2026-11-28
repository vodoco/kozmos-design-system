# @kozmos-ds/vue

## 0.17.3-next.0

Wave V2 of the Vue port: the form controls and overlays are native Vue, so 59 of Kozmos's 88 core
parts now render without React. It is built on `@kozmos-ds/styles` and `@kozmos-ds/react` 0.17.3 and
pins both exactly: `npm install @kozmos-ds/vue@next vue`.

- **New native parts in `@kozmos-ds/vue`**, each drawing the element its React counterpart draws from the
  same recipes, held to React's by the API contract and DOM parity checks, with visual baselines that
  match React's byte for byte:
  - controls and fields: `KozmosCounter`, `KozmosIconButton`, `KozmosCheckbox`, `KozmosRating`,
    `KozmosFieldWrapper`, `KozmosInput`, `KozmosTextarea`, `KozmosPasswordInput`, `KozmosNumberInput`
    and `KozmosOTPInput` (#625);
  - the design config: `KozmosDesignConfigProvider` with `useDesignConfig` (GAP-291, #626);
  - choices: `KozmosSwitch`, `KozmosRadioGroup` with `KozmosRadioGroupItem`, `KozmosSegmentedControl`
    and `KozmosSlider`; selects: `KozmosListbox`, `KozmosSelect` (with its trigger, value, content,
    group, label, item, separator and scroll buttons), `KozmosCombobox`, `KozmosMultiSelect` and
    `KozmosChipInput`; chips: `KozmosChip` and `KozmosChipGroup`; overlays: `KozmosDialog`,
    `KozmosDrawer` and `KozmosBottomSheet` (each with its trigger, content, header, title,
    description, footer and close), `KozmosPopover` (with trigger, anchor, content and arrow),
    `KozmosAnchoredPopover` and `KozmosTooltip` (with provider, trigger and content) (#628).

  The native overlays share one layering system, as Radix's do in React: a native Select, Popover or
  Tooltip opened inside a native Dialog stays inside its modal, and Escape and an outside press close
  the topmost layer only. Each part's prop types are exported beside it.

- **Breaking for `0.17.2-next.0`: 51 bridge exports left `@kozmos-ds/vue/react-bridge`.** Import them
  from `@kozmos-ds/vue` instead: `KozmosAnchoredPopover`, `KozmosBottomSheet`, `KozmosCheckbox`,
  `KozmosChip`, `KozmosChipInput`, `KozmosCombobox`, `KozmosCounter`, `KozmosDialog` (with
  `KozmosDialogTrigger`, `KozmosDialogContent`, `KozmosDialogHeader`, `KozmosDialogTitle`,
  `KozmosDialogDescription`, `KozmosDialogFooter` and `KozmosDialogClose`), `KozmosDrawer` (with the
  same seven parts), `KozmosFieldWrapper`, `KozmosIconButton`, `KozmosInput`, `KozmosListbox`,
  `KozmosMultiSelect`, `KozmosNumberInput`, `KozmosOTPInput`, `KozmosPasswordInput`, `KozmosPopover`,
  `KozmosRadioGroup`, `KozmosRadioGroupItem`, `KozmosRating`, `KozmosSegmentedControl`, `KozmosSelect`
  (with `KozmosSelectTrigger`, `KozmosSelectValue`, `KozmosSelectContent`, `KozmosSelectGroup`,
  `KozmosSelectLabel`, `KozmosSelectItem` and `KozmosSelectSeparator`), `KozmosSlider`, `KozmosSwitch`,
  `KozmosTextarea` and `KozmosTooltip` (with `KozmosTooltipProvider`, `KozmosTooltipTrigger` and
  `KozmosTooltipContent`).
- **Breaking: the models follow React's controlled pairs** (`PORTING.md` §4). The bridge handed a
  listener such as `@open-change` to React's callback; a native part emits `update:<prop>` instead, and
  nothing named `…-change`:
  - `KozmosCheckbox` and `KozmosSwitch`: `v-model` is now `v-model:checked`;
  - `KozmosDialog`, `KozmosDrawer`, `KozmosBottomSheet`, `KozmosPopover`, `KozmosTooltip` and
    `KozmosSelect`'s open state: `:open` with `@open-change` is now `v-model:open`;
  - `KozmosCombobox`, `KozmosChipInput`, `KozmosListbox`, `KozmosMultiSelect`, `KozmosNumberInput` and
    `KozmosChip`: `:value` with `@value-change` is now `v-model`;
  - `KozmosCombobox`'s and `KozmosChipInput`'s typed text is `v-model:inputValue`,
    `KozmosMultiSelect`'s search `v-model:searchValue`, `KozmosListbox`'s active option
    `v-model:activeValue` and `KozmosPasswordInput`'s reveal `v-model:visible`.

  Callbacks that are not a controlled pair stay events of the same name (`@reset-mixed`, `@remove`,
  `@action`).

## 0.17.2-next.0

The V1 parts on `@kozmos-ds/styles` and `@kozmos-ds/react` 0.17.2, which it pins exactly:
`npm install @kozmos-ds/vue@next vue`. No Vue API changes; what the parts draw follows the four
fixes the Vue suites found in React's recipes and the stylesheet:

- `KozmosAlert`'s destructive, success, warning and info borders are the emotion at 50% in dark as
  in light (decision 230, GAP-289).
- `KozmosListItemStatus`'s check and dot keep their size where `@scope` is dropped (GAP-288).
- `KozmosTimeline`'s marker takes every colour from a token (GAP-287).
- A focus ring drawn with an offset gives its gap the canvas's colour, where dark drew it white:
  `KozmosLink`, `KozmosTag` and `KozmosNotice` among the native parts, and the bridged parts that
  use it (GAP-290).

## 0.17.1-next.0

Wave V1 of the Vue port: 29 more parts are native Vue, so 35 of Kozmos's 88 core parts now render
without React. It is built on `@kozmos-ds/styles` and `@kozmos-ds/react` 0.17.1 and pins both exactly:
`npm install @kozmos-ds/vue@next vue`.

- **New native parts in `@kozmos-ds/vue`**, each drawing the element its React counterpart draws from the
  same recipes, held to React's by the API contract and DOM parity checks, with visual baselines that
  match React's:
  - type: `KozmosText`, `KozmosHeading`, `KozmosLabel`, `KozmosIcon`, `KozmosKbd`, `KozmosCodeBlock` and
    `KozmosSpriteIcon` (#610);
  - layout: `KozmosBox`, `KozmosStack`, `KozmosGrid`, `KozmosContainer` and `KozmosSurface` (#611);
  - status: `KozmosTag`, `KozmosAvatar`, `KozmosSpinner`, `KozmosSkeleton`, `KozmosProgress` and
    `KozmosPersonaMark` (#612);
  - cards: `KozmosCard`, `KozmosBreadcrumb`, `KozmosPageHeader`, `KozmosLink` and `KozmosEmptyState`
    (#613);
  - records: `KozmosList`, `KozmosDescriptionList`, `KozmosMetaStrip`, `KozmosTimeline`, `KozmosAlert` and
    `KozmosNotice` (#615).

  Compound parts ship as their own components (`KozmosCardHeader`, `KozmosBreadcrumbItem`,
  `KozmosAvatarImage`, `KozmosTimelineItem` and the rest), and each part's prop types are exported
  beside it.

- **Breaking for `0.17.0-next.0`: these parts left `@kozmos-ds/vue/react-bridge`.** Import them from
  `@kozmos-ds/vue` instead; the bridge keeps only the parts not ported yet. 36 bridge exports moved:
  `KozmosAlert`, `KozmosAvatar`, `KozmosBox`, `KozmosBreadcrumb`, `KozmosCard` (with `KozmosCardContent`,
  `KozmosCardDescription`, `KozmosCardFooter`, `KozmosCardHeader` and `KozmosCardTitle`),
  `KozmosCodeBlock`, `KozmosContainer`, `KozmosDescriptionList`, `KozmosDescriptionListItem`,
  `KozmosEmptyState`, `KozmosGrid`, `KozmosHeading`, `KozmosIcon`, `KozmosKbd`, `KozmosLabel`, `KozmosLink`,
  `KozmosList`, `KozmosListItem`, `KozmosListItemStatus`, `KozmosNotice`, `KozmosPageHeader`,
  `KozmosPersonaMark`, `KozmosPersonaMarkGroup`, `KozmosProgress`, `KozmosSkeleton`, `KozmosSpinner`,
  `KozmosSpriteIcon`, `KozmosStack`, `KozmosTag`, `KozmosText` and `KozmosTimeline`.

## 0.17.0-next.0

The first `@kozmos-ds/vue` on npm, a prerelease on the `next` tag (decisions 162 and 209):
`npm install @kozmos-ds/vue@next vue`. It is built on `@kozmos-ds/styles` and `@kozmos-ds/react`
0.17.0 and pins both exactly; React is needed only for `@kozmos-ds/vue/react-bridge`.

- **`@kozmos-ds/vue`**, native Vue 3 on Reka UI, with no React, rendering on the server:
  `KozmosThemeProvider` (with `useTheme`), `KozmosDensityScope`, `KozmosAnalyticsProvider` (with
  `useKozmosAnalytics`), `KozmosButton`, `KozmosBadge` and `KozmosSeparator`, each drawing the element its
  React counterpart draws from the same recipes, held to React's by the API contract and DOM parity checks
  (GAP-148).
- **`@kozmos-ds/vue/react-bridge`**, a Vue wrapper for every React part not ported yet. A compound's
  parts share one React tree, so a part in another's slot finds its context (GAP-230), and the Vue
  providers reach the React parts (decision 172). `v-model` goes through the models each wrapper names, and
  a listener reaches the React part when the part takes it (decision 168).

## 0.0.5

### Patch Changes

- Updated dependencies [3e3a6d3]
- Updated dependencies [c7d802f]
- Updated dependencies [4773abd]
- Updated dependencies [f4dc59a]
- Updated dependencies [942d7cd]
- Updated dependencies [b9467b1]
  - @kozmos-ds/react@0.4.0

## 0.0.4

### Patch Changes

- Updated dependencies [cc3dc32]
- Updated dependencies [558344b]
  - @kozmos-ds/react@0.3.0

## 0.0.3

### Patch Changes

- Updated dependencies
  - @kozmos-ds/react@0.2.0

## 0.0.2

### Patch Changes

- Updated dependencies [0cf155f]
- Updated dependencies [7775c73]
- Updated dependencies [71e31bd]
- Updated dependencies [1edef7b]
- Updated dependencies [42fbe70]
- Updated dependencies [de7a409]
- Updated dependencies [3bedd72]
- Updated dependencies [1d4e323]
- Updated dependencies [c7c35d6]
- Updated dependencies [ddb2656]
- Updated dependencies [a06ca47]
- Updated dependencies [ad1a23b]
- Updated dependencies [a9e9cb3]
- Updated dependencies [eb68e53]
- Updated dependencies [95ccf34]
- Updated dependencies [a03d3fd]
- Updated dependencies [550b561]
- Updated dependencies [b9dd0d6]
- Updated dependencies [81812c4]
- Updated dependencies [4ef471f]
  - @kozmos-ds/react@0.1.0
