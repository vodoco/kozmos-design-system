# @kozmos-ds/react

## 0.4.0

### Minor Changes

- 3e3a6d3: Four things a product could only work around, and the gate that should have
  caught the first of them.

  **The three product-contract files are one contract, and now something checks
  that.** `pnpm contracts:parity:check` compares
  `@kozmos-ds/product-contracts`, `ProductContracts.swift` and
  `ProductContracts.kt` — the set of types, the fields of every shared struct,
  whether a field may be omitted, and the wire values of every enumeration.
  Nothing compared them before. What it found on its first run was ten drifts:
  `POIResultMatch`, `SearchEmptyKind`, `SearchResponsePresentation`,
  `unitLabel`, `nameLanguage` and optional `floorId`/`floorLabel` existed on the
  web alone, so a single-storey venue still had to invent a floor on iOS and
  Android — and `CategoryPresentation.iconUrl`, the taxonomy's own category
  artwork, was web-only too, leaving a native SDK no way to show a category's
  image at all. All ten are fixed here.

  **`Card` takes a `padding`.** It was 24 on every side with no option, so the
  only route to 16 was a caller passing `className="p-4"` — restyling the
  component from outside, and on the web alone, since both native cards
  hard-coded 24 as well (GAP-034). It is set on the card and reaches the header,
  content and footer through context, because a card padded 16 at the top and 24
  at the bottom is the bug, not the fix. On all three platforms.

  **`Alert` no longer interrupts by default.** `role="alert"` was hard-coded
  with no way out. That is an assertive live region, so a static page notice —
  "View only. Only Dashboard admins can change these settings." — was read out
  over whatever the visitor was doing, every time the page opened (GAP-006).
  `live` is `off` by default, which is what SwiftUI and Compose already do:
  neither native Alert announces anything. `live="polite"` is `role="status"`
  and `live="assertive"` is the old behaviour, for a notice that really has just
  appeared.

  **`AlertTitle` has a size, and stops being an `h5`.** It carried no size class
  at all, and the reset makes every heading `font-size: inherit`, so the title
  rendered at the same size as the `text-sm` description below it, separated
  only by weight (GAP-007). It is `text-base` now, which is what Compose already
  uses. It is also a `<p>` by default, as it is on both native platforms — an
  alert's title labels a notice, it does not open a section of the document, and
  a hard-coded `h5` after a page's `h2` sections is a skipped level. Pass
  `level={3}` where the alert really is a region of the page.

  **`EmptyState` takes a `size`, and a slot can ask for it.** Measured inside
  `POIResultList`: the same no-result content came to 258px, of which 48 was the
  slot's own padding and 64 this component's. The slot stopped padding a
  component last release; `size="compact"` takes the rest, bringing it to about
  128 (GAP-009). A product does not have to know — the empty slot draws the box,
  so it asks for compact itself, and an explicit `size` still wins. On all three
  platforms.

- c7d802f: Six places that read wrongly in another language.

  `Text` aligns from the **start**, not the left, and `align` gains `start` and
  `end` beside the physical `left`. The default is what matters: almost nothing
  passes `align`, so whatever it defaults to is what an Arabic interface gets.
  `left` stays for the rare thing that means LEFT in any direction.

  `POIResultCard`'s row aligns from the start too.

  `SearchBar` takes `clearLabel` — its clear button said "Clear search" in
  English whatever the interface language — and uses logical margins, so the
  search icon sits before the field rather than always to its left.

  `AdaptiveMapShell` takes `panelHandleLabel`. The sheet handle is a slider, and
  "Panel height" was all a screen reader had to go on.

  `NavigationItem` wraps a rail label over two lines instead of truncating it:
  "Overvi…" loses the word where two lines shorten nothing. A side row stays
  truncated, because it is wide enough that one line is the right compromise.

  `CategoryTile` no longer breaks a CJK name mid-word. `line-clamp` alone splits
  レストラン across two lines as two words that do not exist.

- 4773abd: A thumbs scale, a character count, and the state `Rating` was actually in.

  **`Rating` takes a `variant`.** `thumbs` is the two-option form the Express
  Maps prompt asks on — "Are you enjoying this?" is a yes or a no, not a mark
  out of five. Stars are an ordinal scale, so choosing four fills four; thumbs
  are a choice between two, so exactly the one chosen fills. The value stays a
  number either way — **0 unanswered, 1 down, 2 up** — so a product stores one
  shape whichever scale it asks on, and choosing what is already chosen clears
  it. On all three platforms.

  **And four things that were wrong with it underneath.** Measured in a browser
  rather than read off the source:
  - `aria-checked` was taken from the _hover_ value, so a pointer passing over
    the fifth star made a screen reader announce five when the answer was three.
  - There were **five tab stops**. A radiogroup is one, with the arrows moving
    inside it. There were no arrow keys at all, so a keyboard visitor could
    reach the scale and not use it. Left and right now follow the writing
    direction, so the first option is still first in Arabic.
  - `readOnly` set `disabled` on every option, which drops the whole rating out
    of the tab order: a rating meant only to be read could not be reached. It is
    one `role="img"` with the rating as its label.
  - `"Rating"` and `"Rate 3 out of 5 stars"` were fixed English — and the second
    says "stars" whatever the scale is. `label`, `itemLabel` and `valueLabel`
    are the caller's now.

  On iOS every option was an `Image` with `.onTapGesture`: VoiceOver could not
  activate it and announced nothing, so the rating existed only for people using
  their eyes and a finger. On Compose every star carried
  `contentDescription = null` and a bare `clickable`, with the same result for
  TalkBack. Both are real controls now, with `Role.RadioButton` on Compose.

  **Android's star was a different colour.** `primitivesColorsEmotionalAlert600`
  — #f9a707 against iOS's and the web's #d97706, and #fbc459 against #fbbf24 in
  dark mode. It reads `semanticsDataYellow` now, like the other two.

  **`Input` and `Textarea` take a `count`.** `limit` is a **soft** maximum,
  deliberately not `maxLength`: a browser refuses the keystroke past
  `maxLength`, so someone pasting a long answer loses the end of it in silence
  instead of being told it is too long. `minimum` only applies once something
  has been typed — an empty field is unanswered, not wrong. The count is never
  in the `role="alert"` element while it is only a count, because it changes on
  every keystroke and a screen reader would read the number back after each
  letter; it joins the message there only when there is a reason to speak. It
  counts what a person sees rather than UTF-16 units, so an emoji is one
  character.

  **`FeedbackCard` passes both through**, and loses three things of its own: the
  success mark was `bg-green-100` / `dark:bg-green-900/30`, which compile to a
  fixed `rgb(220 252 231)` — a product that re-themed Kozmos got Tailwind green
  there and nowhere else — and the mark itself was the emoji 🎉, which a screen
  reader reads as "party popper". It takes the success role and a real icon.
  `submitLabel`, `submittingLabel` and `commentPlaceholder` were fixed English
  inside the component; the card's heading level is the caller's.

- f4dc59a: Show a result's attributes: access restrictions, dietary, accessibility and
  services.

  Four meanings and one shape — a short localized label with an optional icon —
  so they share `poi.services` rather than gaining three more lists.
  `POIAttributeKind` says which a chip is, so a card can order, tone or filter
  them:

  ```tsx
  services: [
    { id: "1", label: "Vegan", kind: "dietary" },
    { id: "2", label: "Step-free", kind: "accessibility" },
    { id: "3", label: "Takeaway" },
  ];
  ```

  A restriction is drawn apart from the rest. "Staff only" is not a feature like
  "Vegan": it is the reason a visitor cannot go, and a row of identical grey
  chips would bury it among the things they can have. It comes first, in the
  warning tone, and is folded in from `accessRestrictionsLabel` — which is its
  own field rather than a service.

  Android and iOS gain the same `kind`, and also `iconUrl` and
  `iconMonochrome`, which the web contract had and they did not.

- 942d7cd: Four result contracts MAP-474 needs, on all three platforms.

  **Opening and closing soon.** `POIAvailability` gains `openingSoon` and
  `closingSoon`, drawn in a third tone rather than folded into open or closed:
  "closing soon" is a reason to hurry or pick somewhere else, and drawing it as
  plain open is the difference between arriving and arriving too late. Where the
  boundary sits is the product's call.

  **Why a result is in the list.** `POIResultMatch` is `exact`, `alternative` or
  `unconfirmed`, so the further lists MAP-474 shows under their own headings come
  from data rather than from the order a product happened to build. A result also
  carries `unitLabel` for venues with units, and `nameLanguage` so an authored
  name can be announced in the language it was written in.

  **What an empty search means.** `SearchResponsePresentation` carries an
  `emptyKind` — no match, filtered out, or nothing mapped — plus `emptiedBy`,
  the filter that emptied the list, and `languageFallback` when results came back
  in another language. An empty list is not one situation, and "nothing found"
  leaves the visitor to guess what to undo.

  **Venues without levels.** `floorId` and `floorLabel` are optional on both
  `POIPresentation` and `POIResultPresentation`. A single-storey venue where
  every result reads "Ground Floor" is noise; the card now draws what is left.

  Android and iOS carry all four. They did not at first: when this was written
  only the availability change had crossed over, and `POIResultMatch`,
  `SearchResponsePresentation`, `SearchEmptyKind`, `unitLabel`, `nameLanguage`
  and the optional `floorId`/`floorLabel` existed on the web alone — so a
  single-storey venue still had to invent a floor on iOS and Android, which is
  the exact noise this was meant to remove. `pnpm contracts:parity:check` now
  compares the three files field by field, and it is what found this.

- b9467b1: Six pieces of search polish, four of them defects a product would have had to
  work around.

  **A search row is the component's, not the caller's.** `CategoryField` gains a
  `trailing` slot, the one `SearchBar` already has, because the field takes the
  search bar's place when a category is chosen and the row around it does not
  change. Without it the field shrinks to its content in a caller's flex row and
  will not grow: Storybook's own example knew to pass `flex-1` through
  `className`, and an integrator composing the same pair had no way to know. The
  slot draws a gapped row, so the assistant button beside Filters keeps the row's
  spacing rather than touching it — which is what both components did before.

  **One separator for a place.** `poiLocationLabel` joins floor and building the
  way Kotlin and Swift already join them on the model, with `·`. The web had no
  shared derivation, so `POIResultCard` and `POIDetailPanel` each built it by
  hand and the panel had drifted to `/`: the same place, described two ways, in
  one product. It is exported, so a product composing its own row joins them
  identically instead of inventing a third separator.

  **The empty slot pads a string and never a component.** `POIResultList` added
  `p-6` whatever it held. A string needs it. A component pads itself, and an
  `EmptyState` adds `p-8` on top, which turned a one-line "no results" into a
  222px box. The slot decides on what it is given rather than on a flag, because
  nothing was passing a flag and nothing would have.

  **`EmptyState` centres its own text.** `Text` aligns from the start now, so a
  block that centres itself does not centre the text inside it; a description
  that wrapped to two lines had its second line against the leading edge.

  **`Container` takes an `inset`.** `lg:px-8` reads the window, so a 390px side
  panel in a 1280px window took the widest step — the same content with 32px of
  padding each side on a desktop and 16px on a phone. `inset="panel"` holds 16
  whatever the window is doing. `window` stays the default.

  **A side panel gets the space the sheet's grip makes.** A sheet's content
  starts below its grip; a side panel has no grip and nothing stood in for one,
  so the search field sat a pixel under the panel's top edge.

### Patch Changes

- Updated dependencies [3e3a6d3]
- Updated dependencies [f4dc59a]
- Updated dependencies [942d7cd]
  - @kozmos-ds/product-contracts@0.3.0

## 0.3.0

### Minor Changes

- cc3dc32: Add the AI Companion parts, and let a selected result offer actions.

  **The assistant surface.** `AICompanionPanel`, `AIMessageList`, `AIMessage`,
  `UserMessage`, `ActionCard` and `AIInputBar` — the six parts MAP-474 Story 5
  needs. Built to the behaviours rather than to a screen:

  ```tsx
  <AICompanionPanel onClose={close}>
    <AIMessageList>
      <AIMessage>What are you looking for?</AIMessage>
      <UserMessage>Somewhere quiet to work.</UserMessage>
      <AIMessage status="streaming">Looking through this building…</AIMessage>
      <AIMessage actionCard={<ActionCard title="2 results">{rows}</ActionCard>}>
        The closest one is on the second floor.
      </AIMessage>
    </AIMessageList>
    <AIInputBar value={value} onValueChange={setValue} onSubmit={ask} />
  </AICompanionPanel>
  ```

  `AIMessageList` is a polite `role="log"` that follows a reply as it grows, not
  only as turns arrive. `AIMessage` streams its acknowledgement beside the dots,
  because Story 10 counts that as the first visible response, and draws a
  timed-out turn rather than falling silent. `AIInputBar` never emits an empty or
  whitespace-only question and hands over trimmed text. `AICompanionPanel` closes
  on Escape and works with no close button at all, which Story 18 allows.

  No new icon was needed: `Stars01` and `Send01` were already in the package.

  **A notice that is one line until asked.** `Notice` carries the Story 14
  dietary warning above AI-assisted results, where the full legal wording ran to
  four lines — 114px above the results that are the answer.

  ```tsx
  <Notice summary="AI results may be incomplete. Check allergens with the venue.">
    These results are AI-assisted and may be incomplete or out of date…
  </Notice>
  ```

  It is not `Alert` with a flag: an Accordion inside an Alert drew its own
  divider through the middle and barely shrank. Collapsed detail is hidden by the
  `hidden` attribute rather than a class, so it stays hidden when the stylesheet
  does not load and stays out of the accessibility tree either way. A `critical`
  tone with `collapsible={false}` and an `action` slot carries the emergency
  notice — help first, not a result list, so nothing is behind a "More" link.

  **A selected result offers what the product gave it.** `POIResultPresentation`
  gains `actions` and `badge`; `POIResultCard` gains `onAction`, and
  `POIResultList` forwards it.

  ```tsx
  result={{
    selected: true,
    actions: [
      { action: "navigate", label: "Go", primary: true },
      { action: "details", label: "Details" },
      { action: "bookmark", label: "Book" },
    ],
  }}
  ```

  The action row is a sibling of the select button, never inside it: a button
  within a button is invalid, and the browser closes the outer one. `featured`
  stays a boolean — it is set in the CMS and the map marker draws a featured POI
  with its logo — while `badge` carries "Alternative", "Similar", "Close by" in
  the same amber tab, since the label distinguishes them rather than the colour.

  `POIResultAction` is `POIAction | "details"`, kept separate so a detail panel's
  exhaustive maps never have to handle opening themselves.

  **One venue, many branches.** `POIResultGroup` shows one representative and
  folds the rest behind a count of what is HIDDEN — an airport has five Starbucks
  and a visitor asking for coffee wants one row, not five.

  ```tsx
  <POIResultGroup
    items={branches}
    onSelect={select}
    label="Starbucks, 9 results"
  />
  // collapsed: one row + "Show 8 more"   expanded: nine rows + "Hide"
  ```

  Which branch represents the group is the product's choice — nearest by walking
  distance when there is a blue dot, otherwise the current level — so the group
  takes them in the order it should show them and never reorders.

  `POIResultCard` gains `appearance="card" | "row"` for this: a member draws no
  border of its own, because nine bordered cards inside one bordered box reads as
  a mistake, and the container separates them with dividers instead. Nothing in
  the group is specific to a brand; a group is a representative and a remainder,
  as true of "other floors" as of Starbucks.

- 558344b: Take the taxonomy's eight quick-access symbols out of the icon set.

  `TaxonomyAmenitySpaceDesk`, `TaxonomyEntranceExit`, `TaxonomyFoodBeverageSpace`,
  `TaxonomyParkingSpace`, `TaxonomyRetailSpace`, `TaxonomySecuritySpace`,
  `TaxonomyServiceSpaceOffice` and `TaxonomyTransportationSpaceBoardingGate` are
  gone, with their `taxonomy-*` registry names and their Code Connect
  connections. 1183 icons become 1175.

  They were never the design system's to ship. A category symbol belongs to the
  venue's taxonomy, which Pointr publishes and versions on its own cadence;
  an icon here is drawn once and versioned with the components. Carrying both
  meant eight PNGs that went stale the moment a taxonomy release landed.

  Read the artwork from the taxonomy instead. Every quick-access category carries
  its own `iconUrl`, and the panel's `renderIcon` takes whatever you give it:

  ```tsx
  <BrowseCategoriesPanel
    renderIcon={(category) => <img src={category.iconUrl} alt="" aria-hidden />}
  />
  ```

  `CategoryPresentation` now carries `iconUrl` for exactly this - the venue's own
  artwork, beside `iconName` for a design system glyph. `BrowseCategoriesPanel`'s
  `AviationQuickAccess` story reads `quick-access/aviation_customer.json` at
  10.12.0.

  The `Accessibility` and `Utensils` glyphs added in 0.2.0 are unaffected: they
  are drawn here and stay.

### Patch Changes

- Updated dependencies [cc3dc32]
- Updated dependencies [558344b]
  - @kozmos-ds/product-contracts@0.2.0
  - @kozmos-ds/icons@0.3.0

## 0.2.0

### Minor Changes

- Every icon name now draws the Pointr Icon Library's own outline.

  `@kozmos-ds/icons` carries all 1,175 of them and no longer depends on
  lucide-react, which 43 of the 64 names still resolved to: the same concept in a
  different hand from the one Figma shows. Nothing maps onto a near-miss any
  more, and a consumer installs this package and React alone.

  Two glyphs the Pointr library does not have are drawn from elsewhere and
  carried here. `Accessibility` is the Accessible Icon Project's mark, which its
  makers put in the public domain. `Utensils` is lucide's outline under ISC, the
  artwork alone rather than a dependency.

  `@kozmos-ds/react` no longer depends on lucide-react either. The names it uses
  are unchanged, so no import needs editing; what changes is which outline each
  one draws.

### Patch Changes

- Updated dependencies
  - @kozmos-ds/icons@0.2.0

## 0.1.0

### Minor Changes

- a06ca47: Add optional platform-neutral POI detail sections, summaries, opening hours,
  descriptions, tags and supplementary book/call capabilities. Keep the existing
  required POI action labels unchanged. Update the detail anatomy for wrapping
  titles, optional logos, controlled header save actions and reachable actions.
  Add labelled media-error fallback and remove forced smooth gallery movement.
- eb68e53: Support decorative POI asset icons, generic highlighted properties, semantic metadata tones and price scales. Demonstrate taxonomy-driven attribute labels/icons/order with a pinned Pointr 10.12.0 dictionary outside the public component runtime.

### Patch Changes

- 0cf155f: `AISearchButton`'s gradient ring is a band two and a half wide all the way
  round. It was drawn as a 43 disc stacked inside a 48 circle, and Chromium
  painted the disc's rounded rect about 0.44px right and down of the ring's — at
  every device pixel ratio, animated or frozen — so the band ran 1.9 on one side
  and 3.1 on the other. WebKit and Firefox drew it evenly, which is why it looked
  like nothing, and the only check on it read `offsetWidth` and `offsetLeft` and
  called the difference the band.

  The band is cut out of the ring itself now, by a radial mask, so nothing else
  decides where it ends; the disc behind it moves to inset 2, inside the band, and
  is painted first. Measured in the paint on 36 rays at eight device pixels to the
  CSS pixel: a spread of 0.24 in Chromium and Firefox and 0.21 in WebKit, against
  1.33 before.

  No API change: the button is the same 48 circle with the same gradient and the
  same turn.

- 7775c73: Button keeps 8px between its icon and its label, as Figma's Button and iOS's
  always have (GAP-56). `.kozmos-button` takes the spacing scale's 100 as a gap,
  and the loading spinner loses its own `mr-2`, which spaced it on one side only:
  in right-to-left the spinner touched the label. An icon passed to a Button no
  longer needs `mr-2`; one that keeps it sits 16px away, so remove it.
- 71e31bd: Keep scoped preflight at zero specificity so it does not override consumer
  heading styles. Move Text and Heading to component-owned typography recipes,
  preserving their public type scale and props without requiring native CSS scope.
- 1edef7b: The package declares the browsers it actually works in: Chrome and Edge 118,
  Safari and iOS 17.4, Firefox 128, Android WebView 118. It declared nothing
  before, which promised everything.

  The floor is `@scope`, which fences the component styles off from a host page.
  A browser below those versions discards the whole block rather than ignoring
  the rule, and 955 of the stylesheet's 1,227 rules live inside one. What that
  costs is not all or nothing: measured across 43 elements, 30 render identically
  without `@scope` and 13 do not — the 31 components carrying their own CSS are
  unaffected, the 73 styled by utilities lose their layout and colour.

  Declaring it also narrows what autoprefixer emits: `-moz-user-select` and
  `-moz-column-gap` go, both unprefixed in Firefox long before 128. Nothing else
  in the stylesheet changes, and it is 1,189 bytes smaller.

  Lowering the floor is the work of moving the remaining components to owned CSS.
  Raising one would be a breaking change, so it starts where the code is.

- 42fbe70: Emotion text reads on every neutral surface. `Semantics.Emotion.*.Text` was
  measured on white alone, and four of six failed 4.5:1 on the greys a panel,
  card or sheet paints (background/50 and /100): success and alert move from 800
  to 900, informative from 700 to 800, danger from 600 to 700; themed and neutral
  already passed. The contrast contract now holds every emotion's text on
  background/0, /50 and /100 in both themes.

  React draws status text and glyphs with the new Tailwind `*-text` roles
  (`text-success-text`, `text-warning-text`, `text-info-text`,
  `text-destructive-text`), which read those tokens; `success`, `warning`, `info`
  and `destructive` stay the fills, edges and rings they were.

- de7a409: The map sheet's drag handle is a 16px row again, with a 40 × 4 grip (GAP-38).
  Its three declarations read layout tokens straight — `height:
var(--primitives-layout-spacing-200)` — and those tokens are bare numbers
  (`16`, `6`, `40`). A bare number is not a length, so every browser dropped all
  three: the handle rendered 4px tall, the grip 0px wide, in every engine since
  `AdaptiveMapShell` shipped. Each now converts with `calc(var(…) * 1px)`, the
  conversion the owned blur and slide rules already make, and iOS's grabber row
  and Android's `SheetHandle` already matched.

  `pnpm tokens:unitless:check` is new and fails on any owned length that reads a
  bare-number token without converting it.

- 3bedd72: AdaptiveMapShell's bottom sheet eases only between detents — after a new
  detent or a drag's release — and takes its first placement and a change of
  the host's size at once; it no longer flies in from the shell's top when it
  mounts. A panel with no room is hidden again (its flex display had outranked
  the `hidden` attribute), and map controls a bottom sheet leaves no band for
  are hidden rather than drawn under the sheet, where a keyboard or a screen
  reader still reached them; they no longer pad the camera then.
- 1d4e323: Use the shared 16px control radius throughout POI detail surfaces, chips and
  gallery media. IconButton now inherits Button's control radius instead of
  forcing a circular pill. Edge-attached POI sheets retain square bottom corners.
- c7c35d6: Synchronize the media gallery's controlled/default index, keyboard and native
  scroll position without scrolling ancestor panels. Preserve selection through
  resize and RTL changes, clamp stale indices, localize the controls group, and
  give the gallery component-owned CSS. Reset detail scroll when the POI changes
  and omit failed logos until their source changes.
  Reflow detail summary cells before normal words fragment on narrow hosts.
- ddb2656: Align POI navigation typography/icon sizes and compact informational chips with
  the supplied SDK measurements. Reuse Pointr action glyphs and show controlled
  save selection with a themed fill and outline icon. Detail group items now
  accept the existing optional service iconName field; unknown icons preserve text.
- ad1a23b: Keep POI action buttons on one horizontally scrollable row. Add a localizable action-group name, keyboard scrolling and visible focus, while preserving native button tab navigation and resetting scroll on POI changes.
- a9e9cb3: Compose POI summary facts with the shared MetaStrip instead of a wrapping
  duplicate. Keep facts on one keyboard-scrollable row and align icon/text groups
  and primary-action text. MetaStrip now owns its CSS and allows its minimum 64px
  height to grow with content instead of clipping enlarged text.
- 95ccf34: Cap POI highlighted metadata at three priority-ordered items and share the available width equally. Reflow labels/details within cells instead of scrolling the strip; keep the generic MetaStrip behavior unchanged.
- a03d3fd: The ES build ships one file per module, so an app's bundler keeps only what it
  imports. Importing `Button` alone cost an app 48.7 KB gzip of Kozmos code,
  nearly the whole library, because the build was one file its bundler could not
  trim; it now costs 1.1 KB, and the heaviest single component, POIDetailPanel,
  6.2 KB. Import paths do not change, and `require()` still gets one UMD file.
- 550b561: Every animation that loops now rests when the visitor has asked for less
  motion, and by either route (GAP-50). `Skeleton`'s pulse read neither the
  preference nor the design config; the spinner and the assistant's ring read the
  preference only. One owned rule governs all three, last in the owned block
  because they are all a single class and source order is what decides.

  The design config's `motion: reduced` reaches them too. It scales
  `--semantics-motion-duration-scale` to 0.001, which turns a transition into a
  cut — and a one-second spin into a strobe, so an animation that loops has to be
  told to stop rather than scaled. `DesignConfigProvider` marks its scope
  `data-kozmos-motion="reduced"` and the rules read the mark.

  On the natives the same: SwiftUI's skeleton holds its sheen still under
  `accessibilityReduceMotion`, and Compose's under the system's animation scale,
  as the spinner and the ring already did on both.

  `ToggleButton` keeps 8 between an icon and its label, and `Tag` 4 (GAP-75).
  `ToggleButton` is a Radix Toggle styled on its own, so `Button`'s fix left it at
  zero while SwiftUI and Compose had been drawing 8 all along; `Tag` takes
  arbitrary children on React alone, where an icon beside its text touched, and 4
  is the spacing SwiftUI's `Tag` uses. `Chip` is unchanged: its 6 is `Chip/gap`,
  bound to `Layout/spacing/75` in Figma.

- b9dd0d6: Keep Navbar context, navigation and actions available in narrow containers using
  content-driven wrapping. Navbar now has a minimum rather than fixed 64px height;
  hosts must allow it to grow. Add an optional navigation landmark label.

  Allow SearchBar inputs to shrink beside their controls. Make UserLocationMarker
  SVG gradient IDs instance-local and respect reduced-motion preferences for rings.

- 81812c4: `SearchBar` takes a `trailing` slot, and owns the row it makes. The field is as
  wide as its container and always has been, so a caller composing the assistant's
  button beside it got the field on one line and the button on the next, unless
  they happened to know to pass `flex-1` through `containerClassName`. Storybook's
  example knew; the reference site's did not, and neither would an integrator's.

  ```tsx
  <SearchBar placeholder="Search this building" trailing={<AISearchButton />} />
  ```

  The row's rules are owned CSS — `.kozmos-search-row` — not utilities, because
  the utility layer does not reach a browser without `@scope`, and a promise that
  holds only where Tailwind's layer applies is not one. `rowClassName` styles the
  row; `containerClassName` still styles the field inside it.

  The same slot on SwiftUI (`KozmosSearchBar(text:placeholder:) { … }`) and on
  Compose (`trailing = { … }`), where a row never wraps but the one-call form
  should be the same shape on every platform. Vue needs nothing: the adapter
  already bridges a named slot to the React prop of the same name, so
  `<template #trailing>` works.

- 4ef471f: The spinner is one drawing on every platform. It was four: lucide's `Loader2`
  in React, `ProgressView().tint(.blue)` on iOS — a hard-coded blue that ignored
  the theme, at a size the caller could not set — material3's
  `CircularProgressIndicator` on Android, and in Figma an ellipse with
  `dashPattern: [8, 4]`, a dashed ring standing in for motion a static node
  cannot show. No two matched.

  `Spinner` now draws the system's arc: three quarters of a circle of radius 9 in
  the icons' own 24 box, round caps, stroke 2, so its weight scales with its size
  as every Kozmos icon's does, in `currentColor` so it follows the text around it.
  `size` reaches iOS and Android for the first time — 16, 24, 32, 48 — and
  `label` names the wait for assistive technology. `Button`'s loading state draws
  the same arc, as do `KozmosButton` on SwiftUI and Compose.

  The turn now rests under `prefers-reduced-motion` (part of GAP-50), on one
  owned rule, so `Spinner` and a loading `Button` cannot drift apart; the status
  role keeps announcing the wait when the turn stops.

- Updated dependencies [42fbe70]
- Updated dependencies [c5ec97c]
- Updated dependencies [ddb2656]
- Updated dependencies [a06ca47]
- Updated dependencies [eb68e53]
  - @kozmos-ds/tokens@0.1.0
  - @kozmos-ds/icons@0.1.0
  - @kozmos-ds/product-contracts@0.1.0
