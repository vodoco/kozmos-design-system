# Kozmos DS Foundations Importer

Development-only Figma plugin for importing the generated Kozmos foundations payload into `Kozmos DS - Core Library`.

## Use

1. Generate the payload:

   ```bash
   pnpm figma:foundations
   ```

2. In Figma desktop or browser, open `Kozmos DS - Core Library`.
3. Open **Plugins > Development > Import plugin from manifest...**.
4. Select `figma/foundations-importer/manifest.json`.
5. Run **◆ Kozmos DS Foundations Importer**.
6. Choose `docs/figma-foundations-payload.json` in the file picker.
7. Click **Import Foundations**.

The plugin creates the planned library pages and local variables with Light/Dark modes. It uses Figma's Plugin API inside the open file, so it does not need Figma Variables REST scopes.

After importing foundations, use the **Components** picker to select a builder, then click **Build** or **Update**. Build is for the first creation pass. Update patches an existing component in place so Code Connect node IDs stay stable. The status row above the log shows which selected action is running and whether it finished.

Typography primitives such as Text, Heading, and Label are published as local Figma text styles rather than component sets. Use **Apply Text Styles** after component updates to create or refresh those styles and attach them to generated component text layers. The React package still exposes `Text`, `Heading`, and `Label` primitives for semantic code composition.

Open **Examples** after the Core audit is green to generate composed templates on the `Examples` page. The starter set creates a dashboard table page, a settings form page, a mobile drawer flow, an operations console, an SDK route flow, and a kiosk handoff flow using live Core component instances when available, with placeholders for any missing component sets. Product and SDK context in these templates is intentional example content; it should not be promoted into Core component sets unless the underlying pattern is domain-neutral without maps, routing, venues, or Pointr-specific SDK behavior.

Select **Link** and click **Build** after text styles are available. It creates Default/Subtle visual variants with Default/Focus states, editable `Link Text`, and a `Focus Visible` ring binding using the accessible brand and muted foreground tokens from the Core v1 contrast pass.

Select **Separator** and click **Build** for the layout boundary primitive. It creates Horizontal and Vertical orientation variants with variable-bound length/thickness and the same foreground boundary color used by the contrast-safe Core v1 controls.

Select **Skeleton** and click **Build** for loading placeholders. It creates Line, Block, and Circle shapes with variable-bound dimensions; runtime animation stays in React and product code.

Select **Box** and click **Build** before heavier composition work. It creates Transparent, Surface, and Outlined examples with an editable `Content Slot`, sharing the same radius, padding, and boundary tokens used by Core surfaces.

Select **Stack** and click **Build** after Box. It creates canonical Row and Column layout examples across Gap 2, 4, and 6; broader alignment, justification, and wrapping remain product-code choices for now to avoid variant explosion.

Select **Grid** and click **Build** after Stack. It creates canonical one-, two-, three-, and four-column layout examples across Gap 2, 4, and 6 with row-major `Cell` slots for the visible preview cells. The updater consolidates each `Cell n Slot` into one shared slot property across variants, so Figma does not show conflicting property names. The slots fill flexible auto-layout rows so resizing the Grid redistributes the cells; responsive breakpoints, item spans, and dense placement stay in product code.

Select **Container** and click **Build** after Grid. It creates centered and fluid page-container examples with an editable `Content Slot`; responsive breakpoints and max-width behavior remain runtime CSS concerns.

Select **Breadcrumb** and click **Build** for navigation trails. It creates Basic and Ellipsis examples with editable item text while keeping separators and the ellipsis as composition primitives.

Select **Pagination** and click **Build** for paged lists, tables, and search results. It creates Basic, Ellipsis, and Compact content variants in Small and Default sizes with editable page labels; routing, totals, and disabled edge behavior stay in product code.

Select **Accordion** and click **Build** for disclosure groups. It creates Closed and Open examples with editable trigger/content text while leaving Radix interaction behavior, collapsibility, and animation in product code.

Select **Curated Icons** and click **Build** to create the curated Kozmos icon source set on the `Icons` page. The first pass imports the icons `packages/icons/src/registry.ts` names (57 today) from `docs/figma-pointr-icon-catalog.json` by Pointr component key — the plugin's `KOSMOS_ICON_DEFINITIONS` is the registry's twin, and `pnpm components:contract:check` holds both to the catalog — then applies them as preferred values for Button and IconButton `Icon` instance-swap slots.

Select **Curated Icons** and click **Update** when the curated registry or Pointr source components change. It updates icon source components in place, preserves their node IDs, and keeps each nested `Pointr Source` stretched to the 24px icon bounds so resized Button/IconButton slots do not clip or overflow the source artwork.

The same pass draws the 23 wayfinding glyphs from Pointr Maps - Express (`Icon / elevator-up`, `Icon / shuttle` and the rest) from the SVGs the plugin carries in `KOZMOS_WAYFINDING_ICONS`, a block `pnpm icons:navigation:generate` writes from `packages/icons/src/owned/navigation-glyphs.json`, the source the code draws them from on every platform. Each is a `Wayfinding Source` frame of solid shapes, kept while its artwork is unchanged so the tints laid through it survive. They are offered to no Button, IconButton or Badge slot, which tint a stroke; DirectionStep's turns, turn-back, destination, walking, lift, escalator, stairs, ramp, entry and exit types draw them, tinted through their fills, and Itinerary and ManoeuvreCard reuse DirectionStep's marks. Run **Curated Icons → Update**, then **Update** DirectionStep, Itinerary and ManoeuvreCard.

Select **Button** and click **Build** to create the first code-aligned component set on the `Components` page. The result log includes both the internal Figma node ID and URL-safe node ID for Code Connect.

Select **Button** and click **Update** after token changes or safe Button polish. It updates the existing `Button` component set in place so the Code Connect node ID stays stable.

Component updates also ensure component-level float variables for fixed geometry that is not present in the foundations payload yet: widths, heights, padding, gap, radius, stroke width, icon size, spinner size, and text size/line-height where applicable. Interactive component bounds are kept at 44px minimum across all generated sizes so Figma, React, Vue, iOS, and Android share the same touch-target contract. The repo-level source for this contract is `packages/tokens/src/component-contracts.json`; run `pnpm components:contract:check` after platform or generator changes to catch drift. Where an existing primitive/layout token has the same value, the component token aliases to it instead of duplicating a raw number. The updater applies geometry variables to generated component roots and child icon/spinner layers where the Figma runtime supports numeric variable bindings. Generated text uses the plugin Typography config (`Inter` Regular/Medium/Bold by default, with same-family, Inter, and Arial fallbacks — Inter stands in for the System family role, since Figma takes one family and the role is a stack) across components, examples, docs, and local text styles, while font size and line height still bind to component variables. The library audit checks that local text styles and generated component text match the active Typography config; after changing font settings, run **Apply Text Styles** and update any component sets that still report stale generated text. Figma does not expose font family and weight as normal variable bindings, so the resolved family and styles remain token-aligned direct typography values.

Click **Reorganize Components** after creating or updating multiple component sets if the `Components` page starts to overlap. It moves existing top-level component-set nodes into one generous measured column, using visible child bounds plus extra safety gaps for dense or wide variant sets. It does not delete, duplicate, detach, or recreate nodes, so Figma node IDs and Code Connect anchors remain intact.

Button icon-size variants expose a single `Icon` instance-swap slot. If the curated icon set exists, the slot defaults to `Icon / search-md` and prefers all local `Icon / ...` source components. If the icon set has not been built yet, the slot falls back to `Icon / Slot Default` on the `Utilities` page. Button and IconButton now recolor icon instances through direct Figma fill/stroke overrides, so the slot stays a normal swappable icon instance instead of a mask wrapper.

Select **IconButton** and click **Build** after Button is stable. It creates `IconButton` with `Variant`, `Size`, and `State` axes plus the same `Icon` instance-swap slot. Use **Update** after token or slot changes to preserve the Code Connect node ID.

Select **Counter** and click **Build** before refreshing Badge. It creates a standalone count primitive with `Tone`, `Size`, and editable `Counter Text`, so counts can be reused without being baked into Badge anatomy.

Select **Badge** and click **Build** after Counter and the Button/IconButton icon slots are stable. It creates `Badge` with `Variant` and `Size` axes from the React Badge API. Use **Update** after token or visual changes to preserve the Code Connect node ID. Badge exposes `Label Text`, an `Icon` instance-swap slot for icon-sized badges, and an opt-in `Show Counter` property that toggles a hidden live `Counter` nested instance.

Select **Card** and click **Build** after the core content/status primitives are stable. It creates `Card` with `Content` variants for Basic, Header, and Full card anatomy plus editable title, description, and body text. Full cards compose live `Button` instances for footer actions instead of hand-drawn button frames. Use **Update** after token or documentation changes to preserve the Code Connect node ID.

Select **Tabs** and click **Build** after Card is stable. It creates `Tabs` with `Count`, `Active`, and `State` axes plus editable trigger labels. Use **Update** after token, copy, or focus-state changes to preserve the Code Connect node ID.

Select **Stepper** and click **Build** after Tabs is stable. It creates `Stepper` with `Count` and `Current` axes plus editable step labels, using completed, current, and upcoming indicator states for short ordered flows.

Select **Tooltip** and click **Build** after Tabs is stable. It creates `Tooltip` with `Side` variants, editable `Content Text`, and a side-aware triangular `Tip` layer that points toward the trigger, matching the React `TooltipContent` surface, radius, border, padding, shadow, arrow, and side offset contract. Use **Update** after token or copy changes to preserve the Code Connect node ID.

Select **Dialog**, **Popover**, then **Menu** for the next overlay pass. Dialog exposes Basic, Form, and Footer content variants with editable title, description, and body text; Form composes live `Input` instances and footer actions compose live `Button` instances. Popover exposes `Side` variants plus editable title and description text. Menu exposes Basic, Checkbox, Radio, and Submenu content variants with editable label, item, and shortcut text. Use **Update** after token, copy, or composition changes to preserve each Code Connect node ID.

After the core controls are stable, build the next field/control batch one component at a time: **PasswordInput**, **NumberInput**, **Textarea**, **Search**, **Select**, **Slider**, then **Rating**. PasswordInput mirrors the Input field contract with `State` and `Status` axes, adds a `Visibility` axis, and keeps the reveal control as a 44px target. NumberInput mirrors the Input field contract with `State` and `Status` axes, adds a `Steppers` axis, and exposes editable label, value, placeholder, and helper text. Textarea and Search mirror the Input field contract with `State` and `Status` axes plus editable label and placeholder text. Select maps to the React `SelectTrigger` API, so its Figma component exposes `Placeholder Text` but not a standalone label. Slider exposes `Label Text`, `State`, and `Status`, with focus visible shown on the thumb to match the React focus ring. Rating exposes `Value` and `State` axes for editable ratings and readonly score display.

After that batch is green, build the display/feedback primitives: **Progress**, **Spinner**, **Avatar**, **Alert**, then **Toast**. Progress exposes a `Value` axis for common determinate examples. Spinner exposes `Size`. Avatar exposes `Content` plus editable `Image URL`, `Alt Text`, and `Fallback` strings for Code Connect. Alert exposes `Variant`, `Title`, and `Description` and composes the React `AlertTitle` and `AlertDescription` subcomponents. Toast exposes Basic and Action content variants with editable title, description, and action text.

## Product / SDK Lane

The **Product / SDK** group in the Components picker builds the map, wayfinding,
and venue compositions. These are deliberately _not_ Core: POI cards, wayfinding
cards, floor selectors, map controls, and markers stay out of the domain-neutral
Core library. They still need canonical Figma nodes so
Code Connect can link React, SwiftUI, and Compose, so they live in their own
`Product / SDK` section on the `Components` page.

Build Core first. `POICard` composes a live `Button` instance and
`WayfindingCard` composes a live `IconButton` instance, so both report a
placeholder and a warning until those Core sets exist.

Each set uses a single variant axis, matching the Core layout and data-display
convention that avoids variant explosion:

- **AISearchButton** — `State` of Default and Disabled: the search row's AI
  search, a 48 circle whose ring is a 2.5 band of the six data colours around a
  43 disc, with a 16 stars-01 icon. Run Curated Icons first.
- **CategoryField** — `Tint` of Theme and the taxonomy's eight category colours:
  the search field's form once a category is chosen, 48 tall with a 28 icon, a
  15/20 label, a 22 count pill (`Show Count`) and a 32 clear. Run Curated Icons
  first.
- **DirectionStep** — `Type` of the nineteen cases: Straight, Left, Right,
  Destination, the lift, escalator and stairs up and down, LevelUp, LevelDown,
  Transition, TurnBack, Walking, Enter, Exit, RampUp and RampDown, plus
  editable instruction, distance, and duration
  text. Each is a 24 icon from the Icons page: Pointr Maps - Express's solid
  wayfinding glyphs, but for straight on, the level changes and the transition,
  which keep the Pointr arrows; an instance does not mirror, so a left turn
  stays a physical left turn in RTL. Run Curated Icons first.
- **FloorSelector** — `Variant` of VerticalList, HorizontalList, CompactStepper.
  Every floor target stays 44px so it satisfies the shared touch-target contract.
  Floor identity and ordering remain product data, not Figma variants.
- **Itinerary** — `Content` of Default, NoCurrentStep and StepMetrics: a route's
  From and To captions and the steps between them, each with DirectionStep's mark
  from the Icons page, the current one semibold in the theme's 600. No surface of
  its own. Run Curated Icons first.
- **LocationPin** — `State` of Default, Selected, Featured, OffFloor, Disabled
  crossed with `Size` of Sm, Md, Lg and `Tint` of Theme and the taxonomy's eight
  category colours (135 variants); a tint's fill is the marker and its ink the
  number, and a featured pin keeps the alert colour. Selected pins grow as well as
  recolor and off-floor pins use a dashed outline, so state is never carried by
  color alone. `variant` (colour role) and `labelPlacement` are deliberately not
  variant axes: colour is a token override and label placement is renderer
  layout. This is the one Product / SDK set that uses the two-axis matrix
  builder rather than the single-axis one.
- **ManoeuvreCard** — `State` Closed and Open by `Appearance` Theme and Background:
  the current manoeuvre (DirectionStep's mark from the Icons page, the
  instruction and the detail) or, open, the itinerary's rows, over the grab bar.
  Theme is the theme's 600 with everything on it in foreground/1000; Background
  the solid surface. Glass is not drawn yet. Two axes, through the single-axis
  builder's second axis, as POIResultCard's. Run Curated Icons first.
- **MapView** — `Content` of Empty and Overlay, plus editable attribution text.
  Figma models only the surface, its insets, and the overlay slot; the map canvas
  is renderer output and must not be drawn in Figma.
- **POICard** — `Content` of Basic, Media, Full. Omit the Media variant when no
  licensed venue imagery exists rather than substituting stock photography.
- **RouteProgressRail** — `Content` of the step disc's Start, Midway, Arriving,
  Unknown and Waypoints, and the route mode's ActiveLeg (static),
  WalkingWithinLeg, AfterTransition, RoutePositionUnknown, ThemeRoute and
  GuidancePaused: the track, the active leg (theme or the theme-to-success
  gradient), the still flow, the transitions with DirectionStep's marks from
  the Icons page and the compact location dot in `Map marker/dot`. Run Import
  Foundations (a payload with `Map marker`) and Curated Icons first.
- **WayfindingCard** — `Content` of Basic and Titled. Compose route content into
  the slot instead of extending this set.

Use **Update** rather than **Build** after the first pass so the Code Connect node
IDs stay stable, exactly as with Core sets.

Click **Document Components** after the component audit is green. This creates a generated `Docs` page with a side-by-side documentation grid for every generated component set, adds title, category, usage, properties, Code Connect, accessibility notes, and a small live preview, and refreshes each component set's Figma description field from the same documentation source. The docs preview uses representative examples instead of blindly sampling the first variants, so Badge previews avoid icon-size label clipping. The source component sets stay on the `Components` page so existing node IDs and Code Connect links remain stable. If an older run created split `Docs / ...` pages, the next documentation run removes those generated pages.

Click **Build Surface QA** after the component audit is green and before closing Core v1. It creates or refreshes the generated `QA / Transparent Surfaces` page with Light/Dark `Surface/0` panels and representative product-map panels labeled `fill-extrusion` and `symbol_label`. The page uses live instances from the canonical component sets so Button, IconButton, Badge, fields, selection controls, Progress, and Spinner can be reviewed on the surfaces that produced the audit advisories without changing component node IDs. `Audit Library` also checks those live QA instances against their host surface fills, so dark-on-dark transparent or glass regressions are reported as `surface-contrast` issues.

Use **Audit Library** after designer edits or component builds. It produces a JSON report in the plugin log with:

- Page counts
- Top-level page node samples and unexpected top-level nodes on the `Components` page
- Variable collection summaries
- Component set summaries
- Variant axes
- Component property keys
- Variable binding counts
- Bound variable field coverage for color, layout, sizing, spacing, radius, and typography fields
- Accessibility warnings
- Light/Dark contrast checks for text and icon/control layers
- Icon source count and icon slot integrity
- Icon source sizing and constraint issues
- Transparent surface QA page coverage when the generated QA page exists
- Composition integrity warnings for composite components that still contain cloned Button/Input frames instead of live nested instances

Use **Copy Log** to copy that JSON for review. If the Figma iframe blocks the Clipboard API, the plugin falls back to legacy copy and then selects the log text so `Cmd+C` still works.

## Expected Payload

The payload is generated by `scripts/figma-build-foundations-payload.mjs` and contains:

- Target file metadata
- Planned pages
- Variable collections and modes
- Figma variable candidates with CSS, iOS, and Android syntax metadata
- Style/documentation-only token records

Run the plugin again after regenerating the payload to update existing variables in-place.
