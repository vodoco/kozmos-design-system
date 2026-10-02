# @kozmos-ds/product-contracts

## 0.7.0

### Minor Changes

- b734587: Add optional `POIResultPresentation.languageNotListed` and localized result-card/list/group disclosure. Only explicit `true` renders a note; missing data, authored-name language and interface language never imply staff-language availability. Existing calls stay unchanged. Native source mirrors the contract, and Swift selection copies now preserve the existing summary as well as the new language evidence.
- b94423b: Accept ordered instruction parts in DirectionStep, ManoeuvreCard and Itinerary, preserving secondary emphasis, caller-supplied word order and per-part speech language alongside legacy strings. SwiftUI and Compose equivalents retain native string calls and itinerary source-copy compatibility. Hosts still own translated wording; physical assistive-technology and product adoption require separate acceptance.

### Patch Changes

- 0d6b764: Correct result-number and badge documentation to distinguish the default SDK presentation from explicit legacy behavior. Numbered SDK cards retain the supplied number alongside Featured or badge labels, including grouped rows. Marker sprites remain host-owned. Types and runtime behavior are unchanged.

## 0.6.0

### Minor Changes

- ccc6580: Add a measured attribution slot to AdaptiveMapShell, matching SwiftUI and Compose.
  Credits stay centered across the full map, independent of side panels, or above bottom sheets.
  Equal reservations for the larger corner keep unequal controls from shifting attribution.
  Tall side panels leave the footer band clear.
  Controls retain equal side/bottom insets; only attribution moves above oversized corners
  when their middle gap is too narrow. Credits use one horizontally scrollable, scalable
  line (10px default on web); large sheets preserve attribution room.
  Transparent attribution aligns the credit line itself with the 16-unit bottom inset,
  without adding inner padding beneath it.
  Web layout snapshots identify attribution occlusions and include their bottom camera
  inset independently of optional control padding. Omitting the slot preserves existing layout.

## 0.5.0

### Minor Changes

- 8f51ba1: `UserLocationState` gains `"heading-paused"` (decision 45): heading remembered while the map has been moved away from the visitor, the SDK's rotational Off. The next press goes straight back to `"heading"`, which is the product's to do. iOS has it as `KozmosUserLocationState.headingPaused` and Android as `KozmosUserLocationState.HeadingPaused`, with the same wire value.

  It releases with `@kozmos-ds/react`, which draws it: react pins its siblings exactly, so the react that knows `"heading-paused"` needs this version, and the two go out together.

  Migration: exhaustive TypeScript, Swift or Kotlin switches over the location-state type must add the new case. Existing state values are unchanged.

- a6f288d: A result list can show a walk as a band (decision 50, GAP-088). `TravelEstimatePresentation` gains `band`, a `TravelTimeBand`: `"nearby"`, `"oneToTwoMinutes"`, `"twoToFiveMinutes"`, `"fiveToTenMinutes"` or `"moreThanTenMinutes"`. The product passes the walking time it already has, and `travelTimeBand(durationSeconds)` gives its band, so every product draws the edges in the same place. `travelTimeTone(band)` says the colour it is drawn in: `"success"` for Nearby, `"neutral"` for the rest. These two functions are the package's first runtime code; everything else is still types.

  Nearby is under a minute. Every band after it keeps its upper edge, so a place exactly 2, 5 or 10 minutes away reads 1–2, 2–5 or 5–10 min, and one a second further reads the next band; past the first minute that is the walk rounded up to whole minutes. A length below zero, or one that is not finite, has no band. The estimate keeps `durationLabel`, the exact minutes, for the details card.

  iOS has the same rule as `KozmosTravelTimeBand(durationSeconds:)` and Android as `KozmosTravelTimeBand.forDuration`, with a band's `tone` and the same wire values; the three are tested against one table of cases. It releases with `@kozmos-ds/react`, which draws the band: react pins its siblings exactly, so the two go out together.

### Patch Changes

- a957142: `POIResultPresentation.resultIndex` is documented: the result's number, counted from 1, which is the number its map marker shows. A numbered `POIResultList` draws it in the result's tab, and analytics reports it as the result's position. In a numbered list, number the results that are not featured 1, 2, 3 in pin order: a featured result's marker shows its logo, so its number is never drawn. `badge` says it is ignored in a numbered list too, where the number takes its place. The types are unchanged.

## 0.4.0

### Minor Changes

- 415e486: The levels say where the results are.

  `FloorPresentation` gains `resultCount` (in the iOS and Android contracts too), and `FloorSelector`
  marks each level that holds results and says so in the level's name, worded by
  `resultCountLabel`. By default that is "1 result" or "3 results"; a count of zero or less is neither
  drawn nor said.

  ```tsx
  <FloorSelector
    floors={floors.map((floor) => ({
      ...floor,
      resultCount: counts[floor.id],
    }))}
    resultCountLabel={(count) => t("floors.results", { count })}
  />
  ```

- 415e486: A result says more of what it knows, and the search field stops fighting the product.

  **The result card draws the whole contract.** `unitLabel` and `nameLanguage` have been in the
  contract since 0.4.0, and `POIResultCard` drew neither. The unit now leads the location line
  (`Unit 214 · Level 2 · Building A`), and the name carries its own `lang`, so a screen reader reads an
  authored Japanese name in Japanese. `POIResultPresentation` gains `summary`: one generated line,
  already localised, clamped to two lines so a long one can't push the cards below it around.

  **The current result is current, not a button stuck unpressed.** The selected card says
  `aria-current="location"` — the word `LocationPin` uses for the same state — instead of
  `aria-pressed`: a second tap never released the selection, so "not pressed" described a toggle that
  was never there. A test that queries `{ pressed: true }` should query `{ current: "location" }`.

  **It moves between its states on owned rules.** Selecting a card transitions its border,
  background and shadow; its action row grows open and leaves when the selection does. It has no
  closing move on purpose: collapsed actions must not stay tabbable. Both honour reduced motion.

  **The list carries its notice, and speaks the product's words.** `POIResultList` gains a `header`
  slot inside its own region, so a notice that qualifies the results goes when they go. A grouped list
  now passes its two words on — `showMoreLabel` and `hideLabel`, set once on the list — and a group's
  `expanded` state can live in the product through `onGroupExpandedChange`, so it survives the panel
  closing.

  ```tsx
  <POIResultList
    header={allergenNotice}
    showMoreLabel={(hidden) => t("results.showMore", { count: hidden })}
    hideLabel={t("results.hide")}
    onGroupExpandedChange={(groupId, expanded) =>
      setExpanded(groupId, expanded)
    }
  />
  ```

  **The selected result comes into view.** `scrollSelectedIntoView` is on by default: a result
  selected from the map scrolls into the list, even at a sheet detent where a finger can't scroll. A
  product that scrolled the panel itself should pass `false`.

  **The browser's own clear is gone.** A `type="search"` field drew a second, unlabelled × in
  Chrome, Edge and Safari that emptied the field behind the product's back: the DOM cleared, the
  product's state didn't, and the next render put the text back. `SearchBar`, `Search` and the inputs
  built on `.kozmos-input` hide it; the component's own clear, which calls `onClear`, stays.

  **A search response says what it was limited to.** `SearchResponsePresentation` gains
  `appliedScope`, a `SearchScopePresentation` with `kind` (`SearchScopeKind`: `"building"` or
  `"area"`), `id`, `label` and an optional `queryWithoutScope`. Absent means the whole venue. The React
  parts draw nothing from it yet; the iOS and Android contracts carry the same fields.

## 0.3.0

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

## 0.2.0

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

## 0.1.0

### Minor Changes

- ddb2656: Align POI navigation typography/icon sizes and compact informational chips with
  the supplied SDK measurements. Reuse Pointr action glyphs and show controlled
  save selection with a themed fill and outline icon. Detail group items now
  accept the existing optional service iconName field; unknown icons preserve text.
- a06ca47: Add optional platform-neutral POI detail sections, summaries, opening hours,
  descriptions, tags and supplementary book/call capabilities. Keep the existing
  required POI action labels unchanged. Update the detail anatomy for wrapping
  titles, optional logos, controlled header save actions and reachable actions.
  Add labelled media-error fallback and remove forced smooth gallery movement.
- eb68e53: Support decorative POI asset icons, generic highlighted properties, semantic metadata tones and price scales. Demonstrate taxonomy-driven attribute labels/icons/order with a pinned Pointr 10.12.0 dictionary outside the public component runtime.
