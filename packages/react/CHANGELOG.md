# @kozmos-ds/react

## 0.9.0

### Minor Changes

- fc16560: Add a reusable decorative ProgressTrack and compact UserLocationMarker. RouteProgressRail can now show a host-selected active leg in theme colour or a theme-to-success gradient, fixed transition landmarks and a separate position dot. Invalid or unavailable route positions do not claim zero progress. Existing step-disc consumers retain their presentation until they supply activeLeg.

  Explicit static mode colours only the selected section without a position dot; live mode grows its fill and gradient from journey start to the supplied position, including across transitions. Opt-in directional dash flow is independent of progress, stops at the next transition, honours reduced motion and background lifecycle, and can be disabled by the host without changing position.

  Web respects both OS and application reduced-motion settings, and uses system colours for visible filled distance in forced-colour mode.

- fc16560: Add host-confirmed ArrivalPanel with optional actual journey metrics, localized labels, destination media and a full-width Done action. Extend navigation RouteSummary with hosted presentation, optional estimates and destination media, preserving its estimate layout. Left unset, its presentation is hosted in AdaptiveMapShell's panel (decision 43) and stays standalone anywhere else; pass `presentation="standalone"` to keep its card in the shell. Hosts continue to own routing, arrival confirmation, announcements and dismissal.
- fc16560: Share the semantic DirectionKind vocabulary across platforms while retaining DirectionType as a source-compatible alias. Add walking, enter, exit and directional ramps. Draw directions with Pointr's own wayfinding artwork from the Pointr Maps - Express design, generated from one source for React, SwiftUI and Compose as solid shapes in the current colour: distinct lift, escalator, stairs and ramp glyphs up and down replace the generic arrows, and turns, turning back, the destination, walking, entrance and exit take Express's HardLeft, HardRight, TurnBack, Arriving, FollowTheLine, Entrance and Exit. Straight on, level changes and transitions keep their arrows. The rest of the Express set (no-direction variants, entrance/exit, custom transition, security, shuttle) is exported by name. Existing lift-up/lift-down spellings remain unchanged; update exhaustive switches for the new cases. Native source consumers should rebuild: type aliases preserve source calls, not binary enum identity. Unknown engine directions must be handled by the adapter rather than guessed as a turn.
- fc16560: Correct navigation foundations: join optional direction metrics without stray separators, scope route warning descriptions to each rendered instance, disable stale route options outside ready state, use the proper two-way swap symbol, and provide independent localized route field and action labels. **Analytics:** the wayfinding swap event (`wayfinding_route_swapped`) no longer carries the raw origin and destination strings; a product that needs location analytics must make its own explicit privacy decision. Native source mirrors metric, readiness and labeling corrections and normalizes non-finite progress safely; native source delivery is separate from npm publication.
- fc16560: Add optional per-step distance and duration labels to Itinerary, with matching SwiftUI and Compose source APIs. Missing values remain absent; metrics retain instruction language and current-step semantics. Kotlin copy/destructuring compatibility is preserved. These labels are step estimates, not actual journey totals.
- fc16560: Add an explicit host-filtered RouteLocationField mode for SDK-ranked, synonym and translated search results while preserving local filtering by default. Prevent arrival and routing actions from submitting host forms, and allow long arrival/summary action labels to wrap at narrow widths and enlarged text sizes. The controlled journey restores focus after resolving or clearing either endpoint. Native location fields support the same opt-in filtering mode; existing Compose Combobox overloads remain source compatible.
- fc16560: **Analytics: one press, one event.** Where a component reports a press with its
  own event, the Core Button inside it no longer also sends the generic
  `Button:button_clicked`. Affected presses: SearchBar's clear (`search_cleared`),
  POIResultCard's actions (`poi_result_action`), WayfindingCard's close and swap,
  RoutingInputGroup's add, remove and swap, FeedbackCard's submit, SaveLocationCard's
  save and route, SplitButton's main action, FloorSelector's levels and stepper
  (`floor_selected`), FileUpload's remove and Dialog's close (`dialog_closed`).
  Presses no component reports (a plain Button, SaveLocationCard's note edit,
  SplitButton's menu, the collapsible floor tile) still send `button_clicked`.
  Dashboards that counted `button_clicked` for those presses should count the
  component's own event instead. No props change.
- fc16560: POIDetailPanel's labelled actions are text-only, apart from Go/Directions, which
  keeps the canonical outlined navigation pointer. **What you'll see:** Share,
  Order and the supplementary actions (Book, Call and the rest) lose their icons;
  Go keeps its arrow. Icon-only header controls (close, favourite, save) and
  loading feedback are unchanged. No props change.
- fc16560: Add RouteLocationField for controlled origin/destination search with stable resolved identity, secondary place context, explicit clearing and a separate map-selection action. Loading, empty and error states do not offer stale suggestions. SwiftUI and Compose counterparts are provided from the repository; native Combobox fields retain their accessible labels and SwiftUI selection no longer writes its binding twice.

  Combobox disclosure/clear controls have 44 px/pt web/iOS and 48 dp Android targets and localizable labels. Initial uncontrolled search drafts no longer disappear on mount; subsequent selected-identity changes still update the display. SwiftUI option accessibility includes secondary location context.

  RouteLocationField omits location IDs from automatic selection analytics. Generic web Combobox retains its legacy value event by default and gains an explicit includeValueInAnalytics opt-out.

- fc16560: Add explicit Change and Cancel callbacks for host-controlled location editing. RouteLocationField uses text actions to distinguish clearing a search or changing a place from closing its containing panel; the map action uses a map-pin icon. Hosts without onEdit retain the original clearing callback. The React preview includes cancellable drafts and focus restoration; native parity remains pending design review.

  Move map selection into the dropdown and offer an opt-in host-resolved current position independently of search results. Combobox supports keyboard-accessible popup commands separate from its selectable values; these never write a command label into the query. Current-position validation and lifecycle remain host-owned.

- fc16560: Add optional route transition waypoints and a static completed-track treatment to RouteProgressRail. Markers follow logical reading direction, avoid visual collisions and retain all valid localized descriptions for assistive technology. Invalid positions and ambiguous waypoint IDs are omitted; the host owns route identity and progress basis. Existing rails keep their plain track unless showCompletedTrack is enabled. Matching SwiftUI and Compose source APIs are included separately from native registry delivery.
- fc16560: Add RouteSetupPanel in React, SwiftUI and Compose for hosted setup and map-point confirmation content. Continue requires explicit host readiness and is disabled during calculation; cancellation remains available. Document resolved point identity, request cancellation, map/list alternatives, recovery and sheet/focus ownership.
- fc16560: Compose POI result actions, category clear/count, assistant close/send and wayfinding
  inputs from Core Button, IconButton, Counter and Input. Preserve domain callbacks
  and explicit form behavior while using shared focus, disabled and theme treatments.
  Core Button's generic `button_clicked` is not sent for a press the component already reports with its own event (see the analytics changeset). Custom selection,
  voice/input and native counterparts remain tracked migration work.
  The category group names its count once; its visual Counter is decorative rather
  than carrying an unsupported accessible label on a generic span.

  Allow translated POI action labels to wrap within their card at enlarged text
  sizes. Keep a Combobox's keyboard-highlighted choice by identity across host
  rerenders, and respect composition/caller-handled Escape when dismissing its popup.

  Native source mirrors also reuse Core for Swift saved-location Save/Remove and
  Guide actions and legacy route End, and Compose saved-location Remove. Preserve
  domain callbacks and telemetry while inheriting the Core target sizes and styles.
  Compose Guide now uses Core success styling and the canonical navigation pointer.
  Native neutral note-edit icon actions remain tracked work, not completed migration.

- fc16560: Make ManoeuvreCard theme-filled by default with contrast-paired text and itinerary content. A caller that already sets `surface` keeps that surface (the background appearance), so existing `surface="glass"` cards stay glass; `appearance="background"` asks for the neutral solid/glass surfaces explicitly, and `appearance="theme"` stays opaque whatever the surface; enlarge the disclosure target while retaining focus and language behavior. SwiftUI and Compose expose equivalent appearance choices in their source distributions.
- fc16560: Allow explicit unknown route progress and localized accessible value text. Use logical RTL timeline placement without mirroring turn symbols, and keep rail geometry bounded in narrow containers. Numeric non-finite inputs retain their defensive zero fallback; progress never confirms arrival.

### Patch Changes

- fc16560: Register open Combobox suggestions with Core overlays' dismissable-layer stack.
  Escape closes suggestions first, returns focus to the field, and leaves enclosing
  Dialog, Popover or assistant surfaces open until a subsequent Escape. Host-prevented
  and IME-composing Escape events retain the popup and parent without cancelling the
  browser's IME behavior. Inline popups follow the same contract; an open popup with
  nothing to show is not drawn and takes no layer, so it never swallows a parent's Escape.

  The already-used Radix dismissable-layer 1.1.11 is now a direct dependency; no
  dependency versions are upgraded. Native platform behavior is unchanged.

- fc16560: Refine Dialog typography and spacing and compose its dismiss control from Core IconButton. Add an opt-in `DialogFooter layout="stacked"` for full-width, wrapping actions in DOM order; existing responsive footer ordering remains the default. Navigation recovery examples distinguish the recommended action from returning to the map and restore focus to the actual action destination.
- 7097e1a: UserLocationMarker draws as SwiftUI and Compose do: the heading cone is native's 64-unit wedge, fading out 32 from the dot; the dot casts no shadow; the full marker's ring is white in both themes (the compact dot's stays the surface's colour); and the dot, halo, pulse and cone use the marker's own fixed blue, `Semantics.Map marker.dot`, so the dot reads against its ring in dark mode too.
- fc16560: Allow localized itinerary endpoint captions and long place names to wrap without overflowing. Native endpoints adapt to large type; iOS no longer truncates place names after two lines.
- fc16560: Give routing swap, add, remove and close actions actual 44px targets rather than 32–40px bounds. Reserve enough input space for the enlarged swap control. Native equivalents use 44pt on iOS and 48dp on Android; iOS WayfindingCard also accepts a localized closeLabel.
- fc16560: Prevent ambiguous navigation snapshots from choosing a route or current step silently. RoutePreviewPanel requires unique non-empty IDs and exactly one selected available option before continuation; Itinerary omits current emphasis when several steps are marked current. The host remains responsible for validating and correcting its snapshot. Matching SwiftUI and Compose protections are included.
- 33c1c8d: **MapAttribution links no credit that carries credentials, whitespace or control characters.**
  A credit's destination now passes the same rule as MapInfoPanel's links, shared by both and
  matched on iOS and Android: an absolute HTTP(S) URL with a host, with no user name or password
  (`https://maps.example@evil.example` reads as one host and goes to another) and no whitespace or
  control characters. Such a credit used to be a live link; it now shows as plain text, as any
  other unsafe destination does. Credits with ordinary HTTP(S) links are unchanged.
- fc16560: Omit blank and duplicate Combobox popup command IDs rather than allowing ambiguous
  keyboard activation. Commands remain distinct from selectable values even when
  their string IDs match. Render matching empty-state/supporting messages once while
  retaining field descriptions and nested-overlay Escape ownership. The entry made
  active as the query changes is the first option that can be chosen, never a command,
  so Enter on text that matches nothing chooses nothing; a command runs only when the
  visitor moves to it. Enter ignores Safari's composition commit (keyCode 229).
- fc16560: Make the existing web dialog dismiss control a full touch target, allow its accessible name to be localized, reserve heading clearance and bound overflowing content to the viewport. Text resizing updates the layout immediately without animating geometry independently of the close control; entrance animations are retained. Recovery examples preserve confirmed route points and restore focus through the existing dialog instead of introducing a separate modal implementation.
- 1b483be: RouteProgressRail's route-mode waypoints draw their 1px edge on the web, as SwiftUI and Compose do. The rule that drew it had one class's weight and lost to the scoped preflight's border reset, so each waypoint was a white disc with no edge.
- fc16560: Compose SearchBar's clear action from Core IconButton. Disabled and read-only
  fields now also disable clearing, so the action cannot mutate a locked value.
  The clear label, 44px target, decorative circle, non-submit behavior and domain
  callbacks are retained. Enabled clearing also emits Core's normal Button event.

  Clearing returns focus to the input before host callbacks run and preserves
  forwarded refs. Host keyboard handlers compose with search initiation; prevented
  or IME-composing Enter events do not initiate search analytics.

- fc16560: Preserve SearchBar input styling in WebKit using component-owned CSS instead of native-control scoped utilities. Its input remains shrinkable and chrome-free, keeping the Core clear action inside narrow layouts at enlarged text sizes. The recipe uses a SearchBar-specific class so Core Search retains its independent bordered field styling. The existing callbacks and public API are unchanged; this does not introduce the separately planned Core decorated-field capability.
- fc16560: Reduce stylesheet size by sharing identical light/dark token declarations while retaining both selectors and their original specificity. Public token names, values, utility styles and component styles are unchanged. Include PostCSS helpers in the build cache inputs so compiler changes cannot restore stale stylesheets.
- Updated dependencies [7097e1a]
- Updated dependencies [fc16560]
  - @kozmos-ds/tokens@0.5.0
  - @kozmos-ds/product-contracts@0.8.0
  - @kozmos-ds/icons@0.6.0

## 0.8.1

### Patch Changes

- 55239e5: Accessibility fixes found in the 0.8.0 audit. No props change.
  - **LanguageSwitcher keeps focus while the host applies a language.** In the documented async flow the trigger was disabled while `pending`, which dropped keyboard focus to the page for the whole wait. It is now `aria-disabled` and stays focusable; opening and requesting are still refused. The pending status region stays mounted, so its text is announced. A test that expected the trigger to be `disabled` while pending should expect `aria-disabled="true"`.
  - **MapInfo beside the map ignores an Escape from the map.** It closed on any Escape and moved focus to its trigger, even while the visitor typed in the map's search. It now closes on Escape only with focus in the pane, and hands focus to the trigger only if it was there. Its dialog is named once, by the panel's visible heading (no hidden copy), and inside the dialog the panel is no longer a second landmark of the same name.
  - **FloorSelector reads each level once.** The full-name hint is visual: no longer each button's description, which read every name twice. It no longer pops up for the focus the selector moves itself as the column opens or closes; keyboard focus and hover still show it.
  - **MapAttribution's credit line is a tab stop only when it overflows**, as a group named by `label`, so a keyboard can scroll it. A line that fits is no longer an unnamed stop before its link.
  - **The default result look keeps its layout without native `@scope`.** POIResultCard's selection button and its SDK name are owned rules, so the SDK tab stays flush with the card's top and long names wrap in a browser without `@scope`. Nothing changes where `@scope` is supported.

## 0.8.0

### Minor Changes

- b734587: Add optional `POIResultPresentation.languageNotListed` and localized result-card/list/group disclosure. Only explicit `true` renders a note; missing data, authored-name language and interface language never imply staff-language availability. Existing calls stay unchanged. Native source mirrors the contract, and Swift selection copies now preserve the existing summary as well as the new language evidence.
- aa32bb7: Correct the declared Firefox minimum from 128 to 146. This is a breaking support-policy correction: the remaining scoped utility CSS requires native `@scope`, enabled by default in Firefox 146. Firefox 128 was incorrectly advertised as supported; Badge and Separator lose their styling there even though owned-CSS controls such as Button and Input still render correctly.

  Consumers must use Firefox 146 or newer, or defer adoption while their browser requirements are reviewed. There is no legacy-browser polyfill or CSS fallback in this change. Existing published packages are not modified. Other declared browser minimums are unchanged, and this prerequisite does not certify every component or a product's embedded WebView. Add a manifest regression guard and exercise built scoped utility styles with nested themes in Firefox CI.

- b94423b: Accept ordered instruction parts in DirectionStep, ManoeuvreCard and Itinerary, preserving secondary emphasis, caller-supplied word order and per-part speech language alongside legacy strings. SwiftUI and Compose equivalents retain native string calls and itinerary source-copy compatibility. Hosts still own translated wording; physical assistive-technology and product adoption require separate acceptance.
- d096d4f: Make the approved SDK result presentation the default: shared neutral selected/hover surfaces, combined numbered Featured and badge tabs, matching corner radii, wrapping names and an outlined navigation icon on Go actions. Grouped and standalone results share the treatment. `presentationStyle="legacy"` preserves the prior appearance for staged migration; numbering remains opt-in and product-supplied.

  Add themed result surface tokens. SwiftUI and Compose source implementations adopt the same default and add directly composable expandable result groups. Existing callbacks and positional native calls remain supported. Review changed card heights and accessible names; SDK sprite integration and physical accessibility acceptance are separate from this source change.

### Patch Changes

- 13347cf: Give AdaptiveMapShell's controls and registered bottom corners distinct named accessibility regions. New optional controlsLabel and bottomControlsLabel props default to "Map controls" and "Map corner controls" and accept translated names. Child controls stay independently accessible, and hidden or omitted regions do not introduce navigable empty landmarks. SwiftUI and Compose source implementations expose equivalent named containers while preserving existing native call signatures. Layout and keyboard behavior are unchanged.
- 13347cf: Keep ManoeuvreCard's accessible container name when expanded, including with custom itinerary content. The existing manoeuvreLabel now names both states, while itinerary content and the close control remain separately accessible. Matching SwiftUI and Compose source changes preserve the same behavior.
- 59ff7d4: Disable POI result-card actions when no `onAction` handler is supplied, matching iOS and Android. The actions remain visible but cannot produce analytics-only presses. Supply an `onAction` handler to make them actionable; an explicitly disabled action stays disabled.
- 393cdc4: Give AdaptiveMapShell a 16-unit gap below its fixed panel header and a 16-unit top inset in gripless sheets. Hosted surfaceless POI, browse and route components consume that supplied inset instead of doubling it. Content-fitted sheets include their border and do not retain empty height after the grip appears. SwiftUI and Compose source follow the same spacing contract.

  Remove product-owned 16-unit spacer workarounds directly below panelHeader, and redundant top padding on outer content wrappers in gripless sheets or side panels. For example, a navigation panel wrapper using `p-4` becomes `px-4 pb-4`: the shell supplies its top 16. Bordered cards retain padding inside their own border; do not remove that padding. Publication, Figma regeneration and consuming-app adoption are separate steps.

- 13347cf: Give POIResultCard actions a 44px-equivalent minimum target instead of a fixed 40px height, allowing growth with larger text. SwiftUI and Compose source implementations and the Figma importer now use the same minimum painted height; SwiftUI includes padding in the tappable label and Android retains its larger platform touch-target policy. Selected results may be taller than before; handlers and disabled behavior are unchanged.
- Updated dependencies [b734587]
- Updated dependencies [b94423b]
- Updated dependencies [d096d4f]
- Updated dependencies [0d6b764]
  - @kozmos-ds/product-contracts@0.7.0
  - @kozmos-ds/tokens@0.4.0

## 0.7.0

### Minor Changes

- ccc6580: Add MapAttribution: provider-neutral, single-line horizontally scrollable credits with safe links and independently optional branding. The host supplies approved content and owns SDK provider resolution and map placement. Matching SwiftUI and Compose components accompany the web presentation.

  Use compact text-height credit rows and 4-unit spacing across all three platforms, without map-button minimum heights.

  Bundle the official Pointr logo by default on all three platforms. Supply brand to replace it for white-label use, or showBrand=false to hide branding without hiding credits. Artwork loads locally with no network dependency.

  Encode the web artwork as a compact SVG data URL without changing the canonical image, and keep generated branding stable under repository formatting.

  Default to transparent map appearance with tokenized grey text and a thin white halo across all three platforms. The optional surface appearance retains the opaque themed treatment. Preserve underlines, a single accessible label per credit, one-line scrolling and independent branding.

- ccc6580: Add a controlled, web-only LanguageSwitcher for AdaptiveMapShell's bottom-start slot. Show native language names, retain the committed locale during pending/failed changes, expose localized status and retry, and bound the selection menu to the registered shell region. Empty and already-selected single-language lists remain visible but disabled. Native apps deliberately keep device/app-language behavior without a language button.

  Mirror Select item padding and selection indicators correctly in right-to-left interfaces.

- ccc6580: Add MapInfoPanel and MapInfo for host-supplied venue information, FAQs, credits,
  support/legal links and labelled versions. Reserve a logical-end pane on wide
  maps and use a full-screen modal on compact hosts, preserving map/browse state.
  SwiftUI and Compose counterparts ship in the repository alongside the React API.
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
- ccc6580: Refine the collapsible level switcher with floor-availability arrows and full-name hints. The whole tile opens the level list; arrows are non-interactive indicators. Preserve the 48px tile and close the list with one Escape even when a hint is open.

  Make per-floor result counts opt-in with `showResultCounts` (default `false`). Hosts upgrading from 0.6.0 must explicitly enable it to retain badges in the expanded, vertical or horizontal lists. Hidden badges are also omitted from accessible names. The collapsed tile and compact stepper never display counts.

  Add logical `top-start`, `top-end`, `bottom-start` and `bottom-end` MapOverlay positions that mirror in RTL while respecting physical collision insets. Existing web left/right positions remain physical. Corresponding SwiftUI and Compose source changes are included in the repository; native packages are not published to npm. Native left/right overlay positions now correctly stay physical in RTL—use start/end for mirroring.

  Correct compact-stepper separators in RTL. Native selectors preserve missing selected IDs instead of substituting the first floor or emitting fabricated selections; stepping stays disabled until the host selects a supplied floor. The Android source API retains existing positional count-formatter calls without implicitly enabling counts.

  Add independently measured logical `controlsBottomStart` and `controlsBottomEnd` slots to AdaptiveMapShell across React, SwiftUI and Compose. Opposite corners share a row when they fit and stack without shrinking controls when they do not. They clear the shell's panel and top controls, mirror in RTL, retain mounted state during resize, and become unavailable when the remaining vertical band cannot fit them. `bottomControlsPadCamera` is opt-in (false by default); React reports the region as a conservative controls occlusion regardless. The legacy controls slot remains supported.

  Native shells now respect a bounded host shorter than 448pt/dp. Give native shells a bounded parent; the shell no longer forces that old minimum. Compose now reports measured panel/top-bar/safe-area camera padding rather than echoing caller insets alone. These changes are source-only for native consumers and are not native registry releases.

  Bound expanded floor lists to the registered map-shell region, scroll long lists without shrinking targets, reveal the selected floor after measurement, and dismiss the popup when its region disappears. Preserve standalone viewport behavior and existing small-list geometry.

  Keep full-name tooltips inside the floor dialog's accessible ownership but outside its scrolling viewport, preserving keyboard descriptions and preventing clipped hints.

### Patch Changes

- ccc6580: Fit wide AdaptiveMapShell panels to short content and bound long content above
  the bottom control row. Keep bottom-start/end controls at the outer map edges
  in LTR and RTL, rather than pushing them beside the panel. Bound corner popups
  below short panels or in the clear map beside long panels.
  Permit a shell-bound floor menu to move horizontally away from its trigger when a
  same-side panel occupies that column, instead of overlapping the panel on web or
  refusing to open on native.

  SwiftUI and Compose mirror the layout policy. The iOS QA search header now uses
  equal top and side padding on wide screens.

- Updated dependencies [ccc6580]
- Updated dependencies [ccc6580]
  - @kozmos-ds/tokens@0.3.0
  - @kozmos-ds/product-contracts@0.6.0

## 0.6.0

### Minor Changes

- 58ca08d: `AICompanionPanel` gains an optional `open` prop. With `open` omitted, mounting the panel opens it and takes focus, as in 0.5.0; unmounting returns focus to its opener. Existing consumers that mount the panel to open it do not need to change that pattern.

  With `open` supplied, keep the panel mounted and turn it from `false` to `true` when the visitor opens it, usually from `AISearchButton`: that transition takes focus. A panel mounted with `open={true}` is already on screen and does not take focus or call `onOpenAutoFocus`. Closed, it draws nothing. Closing or unmounting returns focus to the opener unless the product has already moved focus outside the panel.

  `onOpenAutoFocus` and `onCloseAutoFocus` let the product prevent the default handoff and choose a focus target. Place the panel itself through its `className`, rather than a wrapper that would remain over the sheet after it closes.

- 7da92a8: `AIInputBar` draws a microphone that starts a spoken conversation with the assistant, which answers aloud, when the product passes `onVoiceStart`. Without it there is no microphone, so voice stays off unless the product has a voice model and turns it on: an App Clip leaves it out. The microphone sits between the field and send, 44px. The product keeps `voiceState` (`AIVoiceState`: `idle`, `connecting`, `listening`, `speaking`, `unavailable`, `error`) and ends the conversation in `onVoiceEnd`. Kozmos records and plays nothing: the voice model, its connection, the microphone permission and the audio are the product's.

  The control is named for what a press does, "Start voice conversation" or "End voice conversation", with no `aria-pressed`. A polite live region announces each change of state, and while the conversation is live the empty field shows it in place of its placeholder. `unavailable` is `aria-disabled`, so it stays focusable and a press does nothing. Offline, `disabled` shows a microphone that is not in use as unavailable, while a live one can still be ended. Every string is a prop with an English default (`voiceStartLabel`, `voiceEndLabel`, `voiceConnectingLabel`, `voiceListeningLabel`, `voiceSpeakingLabel`, `voiceEndedLabel`, `voiceUnavailableLabel`, `voiceErrorLabel`); an empty string leaves that announcement out.

- a67223c: `FloorSelector` gains `variant="collapsible"`, the SDK's level switcher for a control parked in a corner of a map (row 79, GAP-080), as iOS and Android have it. At rest it is one `MapControlButton` showing the current level's short label. Activated, it grows into a column of every level over itself in a `Popover`, in the supplied order: pass floors top-floor-first. The current level is outlined in the theme's primary and a closed level muted; the tile says `aria-expanded`. A choice, Escape or a press outside closes the column, and focus goes back to the tile, which is named by the level now shown, unless the press put focus on another control. The column's level counts sit at their bottom corner.

  It also gains `userFloor`, the level the visitor is on by the same id as `selectedFloor`, and `userFloorLabel` (default "your level"). The switcher marks that level with a dot: on the closed tile while it shows that level, and on that level in the open column. It is said with the level's name, "Level 1, your level". Only the switcher draws it; the other variants take the props and ignore them.

  Migration: exhaustive switches over React's floor-selector variant union or Android's `KozmosFloorSelectorVariant` must handle the added `collapsible`/`Collapsible` case. The existing variants remain supported.

- 00e857b: - **`MapControlsGroup` remembers heading** (decision 45). With `locationState="heading-paused"` the location control shows the SDK's rotational Off — the upright pointer in outline and "Focus / Off" in the off grey — and a screen reader hears `locationHeadingPausedDescription` after the words (default "press to turn the map with you again", for the product to translate). The next press should bring `heading` back, which is the product's to do. `"heading-paused"` is new in `@kozmos-ds/product-contracts`, released with this: react pins its siblings exactly, so the two go out together.
  - **`MapOverlay` passes presses in its room to the map** (decision 46). The room around what an overlay holds stays for the shadows, but while what it holds fits, only what it holds takes a press: a press or a drag in the room, or between the overlay's items, reaches the map beneath. While what it holds overflows, and only then, the room takes presses again, so that a wheel or a touch over what it holds scrolls the overlay in every engine (Linux WebKit scrolls a box from a wheel only if the box takes presses), and a scrollbar a platform draws there takes its drag; focus scrolls it either way. The overlay marks its stack `data-scrolls` while it overflows.

  Migration: consumers that switch exhaustively over `UserLocationState` must handle `heading-paused`. Existing values and callbacks remain available.

- 24c7530: LocationPin: a numbered pin is quiet at rest and filled when selected, so it pairs with the result card's number tab (decision 55). **The look of unselected numbered pins changes, by design; no prop changes.**
  - **At rest**, a pin with a `number` is the outlined marker on the background, with its ring and number in the pin's colour, as the SDK's map draws its unselected results. Before, every numbered pin was filled with a white number, selected or not.
  - **Selected**, it is filled as before, with the ink made for the fill on the number, and still grows.
  - **Unchanged:** a featured pin, a pin showing `markerContent` (a logo or an icon) and a pin with no number keep their fill.
  - **Off the floor**, the outlined marker's ring is now dashed, so it is never taken for a quiet pin at rest, in forced colours and for any colour vision. It still takes the number in the foreground and is never filled.
  - **Variants** keep their colours in the ring and number. `secondary`, whose own colour is a surface grey (1.6:1 on the background), takes the muted foreground as a ring and a number, off the floor too, where its ring had not shown.
  - **A tint** outlines a numbered pin at rest in the category's fill, with the number in the foreground: six of the eight fills fail 4.5:1 as text on the background.

  Measured in Chromium, Firefox and WebKit: the primary number reads 6.24:1 on the light background and 6.17:1 on the dark, and its ring at least 4.68:1 against Pointr's light map. On the dark map it reads 3.27:1 or more, except over food-and-drink rooms (2.76:1), where the filled pin is the same colour. iOS and Compose make the same change.

- 9070b0f: `ManoeuvreCard` shows the whole instruction, and the card grows with it (GAP-094). It cut the instruction at two lines, which lost ordinary words: "Take the escalator near Fountain Court up to…" lost the level, and German "Biegen Sie bei Marlow Apotheke auf der linke…" lost the turn itself, "rechts ab". This is a deliberate change of default, asked for by MAP-111 (US1-EC8): a card with a long instruction is now taller. A product that wants a limit passes the new `instructionLines`, the most lines drawn before an ellipsis (`instructionLines={2}` draws what 0.5 drew; under one line is no limit). Assistive technology hears the whole instruction either way, as it did. The itinerary keeps its own cap, `maxItineraryHeight`.

  Open, the itinerary that scrolls past the cap is a stop in the tab order (GAP-100): a group named after the itinerary it holds, by the new `itineraryLabel` ("Itinerary" until the product passes its own words, as `Itinerary`'s `label` is). It could not take focus, so a keyboard could not reach the steps past the cap (axe's `scrollable-region-focusable`, serious). It is a group, not a second landmark, and it draws the focus ring.

  Focus goes with the disclosure (review T4). Opening removed the instruction button that had focus, and focus fell to the page; closing from the grab bar left focus on the bar, hidden from assistive technology and out of the tab order. Now focus on the part that goes moves to the part in its place: from the instruction to the itinerary as the card opens, from Hide or from inside the itinerary to the instruction as it closes. Focus anywhere else is left where it is, whether a key, a pointer or the product changed `expanded`, and a pointer never puts focus on the closed, silent bar. Every existing prop and callback is unchanged.

  **Native (iOS and Android):** `KozmosManoeuvreCard` shows the whole instruction by default too, with `instructionLines` to cut it. On opening, iOS requests accessibility focus on the itinerary container and Android requests keyboard focus on Hide; closing requests focus back on the instruction when focus belonged to the removed part. Human VoiceOver and TalkBack behaviour still needs verification on a device with the product's actual itinerary; a focus request is not proof that assistive technology follows it. A ManoeuvreCard call written against 0.5.0 still compiles, on Android through an overload with 0.5.0's parameters.

- 36db8b6: The map controls take the SDK's current look (decision 40): the Tracking Indicator of Pointr's Location Tracking Buttons. Every map control wears it — `MapControlButton`, so the zoom pair, the compass, the location and step-free control and the floor tile.
  - **The surface.** A 48px square (above the 44px touch target), the Control corner (16), no border in any state, and the map controls' own elevation, three shadows, with the SDK's 32px backdrop blur. The zoom pair is one such surface, its buttons its segments. It is owned CSS now, so it holds in a host without `@scope`, and a caller's class still wins over it.
  - **The words.** Two equal lines, "Focus" over "Off" or "On", bold 16 on a 16 line. A toggle's state is its tone: off, the words and the mark are grey (foreground/400); on, the words are navy (theme/1000) and the mark the theme's blue (theme/600). "On" no longer draws a primary border or a lower shadow. A control that is not a toggle (`pressed` unset) keeps the ink. Marks are the SDK's 24px.
  - **`MapControlButton`** gains `stateDescription`, said after the state and never drawn, and `showLabel`, which draws a state alone while its name still starts the accessible name.
  - **`MapControlsGroup`**: with no position (`unavailable`, `permission-denied`) the location control reads its state alone, on one line — the SDK's "No Location". Heading reads "On", as following does; its mark tells them apart, and a screen reader hears `locationHeadingDescription` after the words (default "map turns with you", for the product to translate).
  - **`MapOverlay`**'s room is the reach of the map controls' shadow as well as the floating one's: 32px above and at the sides and 48px below, where it was 4, 8 and 12.

- e3cbdbf: `MapStatusPill`, one status on the map in five tones (decision 39). The SDK's PositionStatus, Downloading Content and Turn Back indicator are all this part, and so is the step-free route being calculated (GAP-102). The words, the tone and when it shows are the product's; place it in a `MapOverlay`, for example at the bottom centre.
  - **Tones.** `neutral` draws the words alone; `progress` turns the system's arc in the theme's blue; `success` draws a check and its words in the success colour; `danger` draws a warning triangle in the danger colour and keeps the words ink; `warning` fills the surface with the new `Emotion/alert/fill` under its `onFill`, the SDK's bright amber under black words in both themes (Turn Back), 10.56:1 light and 13.14:1 dark. The words read at 4.5:1 or more, and the marks at 3:1 or more, in both themes.
  - **The surface** is the map controls' own (decision 40), from the same owned rule: the page's surface, the Control corner, no border in either theme, the map controls' three shadows and the 32px blur, at least 48px tall, 8px above and below and 12px at the sides. The words are 13px on a 16px line in `foreground/300`; it wraps at 16rem rather than cutting them.
  - **`icon`** replaces the tone's own mark, drawn at 24px in the tone's colour; `icon={null}` draws none. The mark is never announced.
  - **Announced politely.** It is `role="status"` by default; `live` takes Alert's and Notice's `"off" | "polite" | "assertive"`. With no words it draws nothing and keeps its live region, so a product that keeps it rendered where it shows has its first words read too.
  - **`MapControlButton`'s surface rule** now dresses both parts; nothing about a map control changes.

- 31eb28d: `BottomNavigation` labels are now 11px on 14px lines, wrapping to at most two lines. It keeps its own items rather than reusing the rail's redesigned side-menu items: `compact` remains the default, with a 64px minimum item height and 6px padding; `default` uses a 72px minimum and 8px padding.

  This is a visible typography change for bottom navigation. Rail sizing and selection follow the separate side-menu change in this release; the intermediate 72px/64px rail-tile design does not ship.

- 9013c31: The rail takes the dashboard side menu's design. A `NavigationItem` with `placement="rail"` no longer draws a fixed 72px tile (64px compact): it fills the width of its rail, 96px, and grows with its label. It is padded 16px by 8px, with a 24px icon 6px above an 11px regular label on 14px lines that wraps to two lines, so an item is 76px tall, or 90px with two lines. At rest it is the muted foreground, with no fill. Selected, it is primary on the lightest theme tint (theme/0), with a 2px primary bar down its inline end (the right in LTR, the left in RTL), where it was primary on the grey muted fill. It is square, and its focus ring is drawn inside it. `density` still sizes top and side items; a rail item draws the same with `compact` as without it.

  `Sidebar`'s `rail` variant is that 96px rail: it was 80px with 8px of inline padding, and its items now fill it. Its background is the surface (`bg-surface-0`, the same colour as before), and its 1px edge is at its inline end (`border-e`) in both variants, so a right-to-left sidebar draws it on the left.

  `BottomNavigation` keeps its own items: it no longer renders `NavigationItem` rail tiles, so it does not take the rail's padding, width or selected bar. It preserves the icon-over-label layout, equal-width items and muted selected fill. Labels now use 11px text on 14px lines, as described in the separate typography change. Its items are no longer marked `data-placement="rail"`; they are `data-slot="bottom-navigation-item"`.

  This is a visible change: screenshot tests of a rail or a sidebar rail will see it, and a product that sized rail tiles itself (`className="w-24"`) no longer needs to.

- 6f9b048: `POIResultList`, `POIResultGroup` and `POIResultCard` take an optional `idPrefix`, and `getPOIResultDomId` an optional second argument, so a page can show the same place in two lists without drawing its ids twice. A card's id came from the place's id alone, and its action row's and unavailable note's from that, so a second list's `aria-controls` and `aria-describedby` resolved into the first list. With `idPrefix`, every id in the list becomes `getPOIResultDomId(poiId, idPrefix)` and its references stay inside it; a map pin names the intended card with the same call, through `LocationPin`'s `resultId`. Without it the ids are exactly what they were, and a card's own `id` still wins.

  Give each independent list a distinct, stable prefix when the same POI can appear more than once on a page. Keep that prefix consistent between server rendering and hydration, and use the matching prefix for a pin's result reference; do not change the POI's business identifier.

- 8eae92c: `POIResultList`, `POIResultGroup` and `POIResultCard` gain `numbered`, off unless the product turns it on. A numbered result shows its `result.resultIndex`, the number its pin shows on the map, in the card's tab (before its name in a group's row), for a list whose pins are numbered: quick access, where a category chosen in the browse grid lists that category's places. Kozmos draws the number it is given and never renumbers. One tab per card: Featured wins over the number, so a featured result keeps its Featured tab and no number, as its pin shows its logo; the number wins over a badge. At rest the number's tab is quiet, outlined on the card's grey edge; selected, it fills with the primary colour. The number leads the result's accessible name ("2, Burger King") and its tab is decorative; a `selectionLabel` replaces the whole name, as before.

  The badge tab is quiet, as the contract always said (GAP-054): a neutral tab with no star, on the card's grey edge. It drew the Featured star, colour and edge, so an "Alternative" read as featured. The tabs now sit inside the card's top-start corner, sharing its outer curve and edge, with only the inner corner rounded. They sit on the right in a right-to-left language, and their colours and corners are owned rules that hold without `@scope`.

  **A deliberate visual change to Featured:** the Featured tab is the SDK's bright amber under dark words, the alert fill pair (`--semantics-emotion-alert-fill` and `--semantics-emotion-alert-on-fill`), for its words and its star, and a featured card's edge takes the same amber, selected or not. It was the darker warning fill under white words, with a darker edge. The words read at 10.56:1 in the light theme and 13.14:1 in the dark.

- 15b5524: `POIResultCard` draws a walk as a band when the product sets `result.travelEstimate.band` (decision 50, GAP-088): **Nearby**, **1–2 min**, **2–5 min**, **5–10 min** or **More than 10 min**, in place of the exact minutes. Nearby is drawn in the success colour, the success emotion's Text role, which reads at 7.1:1 on the card in the light theme and 17.7:1 in the dark; the other bands keep the card's text colour. The word itself says Nearby, so the tone is never carried by colour alone. The colour is an owned rule, so it holds in a browser without `@scope`.

  The words are English until the product passes its own as `travelTimeBandLabels`, for one band or all five; `POIResultList` and `POIResultGroup` take the same prop and hand it to every result. A result with no band shows `durationLabel` as before, and `POIDetailPanel` keeps the exact minutes from the same estimate.

### Patch Changes

- 5a7f5da: `AICompanionPanel` keeps what it covers out of reach while it is open (the site's GAP-93, WCAG 2.2 2.4.11). It covers the frame and moves focus in, but Shift+Tab from the panel landed on the search's tiles beneath it, where nobody could see them. While open, a panel laid over the box it fills, `absolute inset-0` in its positioned container as its docs place it, now makes the rest of that box inert, and nothing beyond it; fixed over the whole viewport, it covers the page. It measures what it covers as it opens and again whenever it or that box changes size while it is open, so a layout that moves it from covering its frame to half of it gives the other half back, and the other way takes what it now covers, moving focus into the panel from a control it has just covered. Live regions beneath still speak, whether they are marked with `aria-live` or live by their role (`status`, `alert`, `log`, `marquee` or `timer`, or an `output`), as `MapStatusPill`, `Alert`, `Notice` and `Spinner` are; an open `Select` now leaves those role-only regions out of what it makes inert too. Popups a part inside the panel opens in the page's portal stay in reach. It gives everything back as it closes, before it hands focus back, so focus returns to the button it covered and `onCloseAutoFocus` can focus anything under it. A panel in flow, or over only part of its box, makes no background content inert. Initial focus follows the documented mount/controlled-open policy; responsive focus recovery applies only when the previously focused control becomes newly inert. A product's own `inert` on the covered box is left to it.
- 836257b: `AICompanionPanel` composes Escape with the product's own key handler. A product's `onKeyDown` replaced the panel's handler, so adding analytics or a shortcut stopped Escape from closing the panel; and an Escape a part inside had already handled, and marked with `preventDefault()`, closed the panel anyway. The product's `onKeyDown` now runs first, and Escape closes the panel after it unless the event has been default-prevented, by the product's handler or by a part inside. It still closes this panel only, and other keys never close it.
- 9e8d657: Keep focus on assistant inputs and other intentionally reachable controls when a responsive assistant panel grows to cover its frame. Move focus into the panel only when the previously focused control becomes inert.
- 641be45: `BottomNavigation`'s `density` says what it does for the bar: `compact`, the default, is an item at least 64px tall and 6px in from its edges; `default` is at least 72px tall and 8px in. It was typed as `NavigationItemProps["density"]`, whose docs describe the rail's item and say the compact tile is retired; it is now `"default" | "compact" | null`, the same values.
- dd06e4a: `POIDetailPanel`'s `sheet` presentation, hosted in `AdaptiveMapShell`'s sheet under a grip, now sits its close button as far from the panel's top as from its side: 17px and 17px, where it sat 21px and 17px (decision 51, row 82 / GAP-083).
  - The header tops its 16px up to the grip's row and no longer adds the grip's 4px clearance, wherever its buttons stay clear of the grip's target anyway. The grip is a 16px row, an undersized target, and WCAG 2.5.8 keeps a 24px circle on its centre clear of every other target.
  - Where they would not, on a narrow panel, the header keeps the clearance, 21px and 17px, as every other part at the panel's top does (decision 14). With favourite, save and close that is a panel under 340px wide, such as a 320px phone; with one toggle and close, under 240px; with close alone, under 140px.
  - The header reads the card's width from a container query. Hosted in `AdaptiveMapShell`'s panel, the details card is a size container of its own, inline size only, and fills the panel's content box; on its own, in a box that shrinks to fit, it is no container and keeps its width. The panel itself is not a container, so a product's own container queries in content it hosts, unnamed ones and `cqi` or `cqw` units among them, read the product's own containers. Fixed and absolutely positioned parts inside the card place as they did.

  In the `sheet` presentation the header's buttons now draw their keyboard focus ring inside their edge, as the actions strip draws its own. Flush against the card's top, in a side panel since the header first topped up and now under a grip, a ring drawn outside lost its top edge to the card's and the panel's scrolling boxes.

  A side panel, a single-detent sheet, a sheet with a `panelHeader`, and the `panel` and `inline` presentations keep their insets.

- ddfcc5a: Decision 48 on every glass surface: text that is muted elsewhere takes the foreground colour on glass, so it reads at 4.5:1 over any map.
  - The cards that take `surface` draw their muted text through `kozmos-muted-text`, which reads the glass surface's `--kozmos-surface-muted-foreground`. That covers `ManoeuvreCard`'s detail, `Itinerary`'s captions and origin (inside a glass manoeuvre card), `RouteSummary`'s distance, and the descriptions of `FeedbackCard` and `SaveLocationCard`. Muted over a saturated map they read 3.6:1 to 4.2:1; on glass they now read 9.7:1 or more. On a solid card they look as they did.
  - `POIMediaGallery`'s position follows wherever the gallery sits, hosted on its own too.
  - `POIDetailPanel`'s muted lines read the property directly. Its `panel` and `inline` presentations say they are a card of their own, so their text stays muted even on a glass sheet.
  - In `AdaptiveMapShell`'s panel, `POIDetailPanel`'s summary strip paints no fill of its own (decision 43): across a glass sheet it was an opaque band. On its own it keeps its fill.

- 04ed458: Every part at the top of `AdaptiveMapShell`'s panel now keeps the grip's clearance, not only the panel header and the details card (decision 14).
  - `BrowseCategoriesPanel`: as the panel's content, its first row (the search row, or the tiles when there is none) tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Its search field sat 33px from the panel's top and 17px from its side; it now sits 21px down under a sheet's grip and 17px down in a side panel or a single-detent sheet. The tiles under a search row keep their 16px, and on its own it is unchanged.
  - `POIResultList`: under a grip it keeps the grip's 4px above its first result, which sat inside the grip's 24px target circle (WCAG 2.5.8). It adds nothing anywhere else.

  The two custom properties describe the panel's top: a part placed under a row of your own should have both set to `0px`, or its row belongs in `panelHeader`.

- b51f1be: In `AdaptiveMapShell`'s panel, sheet or side, a hosted part paints no fill of its own: the panel's surface, solid or glass, is the one surface (decision 43).
  - The panel sets `--kozmos-panel-part-fill` to `transparent` on its content and its header, in a sheet and a side panel alike.
  - `BrowseCategoriesPanel` and `RoutePreviewPanel` paint nothing there. They filled their box with the background colour wherever they were, so on a glass panel each was an opaque block from under the grip's row down; the glass now shows through them. On a solid panel they look as they did, its fill being the same colour, and their text keeps the theme's foreground. On their own they keep the background colour.
  - Their fill moves from `bg-background` to owned CSS (`kozmos-browse-categories`, `kozmos-route-preview`), which reads the property. A background class passed in `className` still outranks it.

  On a glass surface, text that is muted elsewhere takes the foreground colour, so it reads at 4.5:1 over any map; the glass itself is unchanged (decision 48).
  - `.kozmos-surface-glass` sets `--kozmos-surface-muted-foreground` to the foreground colour, and `.kozmos-surface-solid` resets it. Owned CSS reads it, falling back to the muted colour: the `kozmos-muted-text` class, and `POIDetailPanel`'s `sheet` presentation.
  - The muted text a hosted part draws straight on the panel reads it: `RoutePreviewPanel`'s "To", its count of options and its status text; the empty states of `BrowseCategoriesPanel` and `POIResultList`; and, in `POIDetailPanel`'s `sheet` presentation, the level and hours line, the prices, the summaries' notes, the section headings and the gallery's position. Muted over a saturated map, they read as low as 3.6:1; they now read 9.7:1 or more, in light and dark.
  - Muted text on a card of its own keeps its colour: a result, a route option, and a `panel` or `inline` details card.

- 1213847: `MapControlsGroup` passes the presses in the gaps between its controls to the map (decision 46). Its box took every press in the 8px between the zoom pair, the compass and the location control; now only the controls take presses, so a press or a drag in a gap reaches the map beneath, as one in a `MapOverlay`'s room does. While the overlay holding the group overflows, a press in a gap is the overlay's, whose scroll box takes its room then, so a wheel there still scrolls it in every engine. The group keeps its role, its name and its controls' tab order. Its box is the owned `kozmos-map-controls-group` rule, and no longer carries `pointer-events-auto`.
- ddfcc5a: `AdaptiveMapShell`'s panel carries `data-slot="map-shell-panel"`, a short, stable name for a check that reads the panel's markup. Axe cuts every attribute value in a node's snippet to 20 characters once its opening tag passes 300, and the website's exclusion for the known nested-landmark finding (GAP-17), which read the panel's class, stopped matching when the panel's style grew. It now reads this attribute.
- b46112a: `@kozmos-ds/icons` gains `Walking`, the walking figure the SDK's position status draws beside "Walking improves accuracy", sourced from Pointr's Figma. It is a solid mark squared on the icon grid, 20 of 24 tall, in `currentColor`. `bluetooth-off`, the pill's No Bluetooth mark, joins the icon name list, so `getIconComponent("bluetooth-off")` and `<Icon name="bluetooth-off" />` reach Pointr's outline. React 0.6.0 requires icons 0.5.0; they are released together.

  ```tsx
  import { MapStatusPill } from "@kozmos-ds/react";
  import { BluetoothOff, Walking } from "@kozmos-ds/icons";

  <MapStatusPill tone="progress" icon={<Walking />}>
    Walking improves accuracy
  </MapStatusPill>;
  <MapStatusPill tone="danger" icon={<BluetoothOff />}>
    No Bluetooth
  </MapStatusPill>;
  ```

  Dedicated Turn Back and Wayfinding Unavailable marks are not included. Their examples explicitly pass `icon={null}` to omit a mark. A `warning` or `danger` pill without an `icon` prop still draws its default warning triangle; pass `icon={null}` when no fallback mark is appropriate.

- df63812: `MultiSelect` hands focus to its field when every choice is cleared. The clear button goes with the choices it clears, and a keyboard that pressed it lost focus to the page. The field now takes focus, with its list closed, since the visitor cleared the choice and did not ask for options; typing or an arrow key opens it, as before. Removing one chip still hands focus to the field, and a disabled or read-only field still offers nothing to clear.
- e141c57: `POIResultList` brings the selected result into view when its results arrive after the selection. A pin's tap that came before the search answered, or a batch of results without the selected place, used to mark the selection as shown with nothing to show, and the result then stayed out of sight when it arrived. Each selection is now brought in once, when its result is in `items`; a new array of the same results still moves nothing, and a result that leaves the list and comes back is brought in again. A selection made while `scrollSelectedIntoView` is off is brought in when it is turned back on.
- ddfcc5a: `RouteOptionCard`: the chosen option's 5% tint of the theme now sits on the option's own background colour (the owned `kozmos-route-option` class). It was `bg-primary/5` over nothing, so on a glass sheet the map showed through the chosen option while the others stood opaque; it now reads like them. On a solid sheet it looks as it did, the tint over the sheet's background colour being the same mix.
- 9c955d1: `RoutePreviewPanel` keeps the grip's clearance at the top of `AdaptiveMapShell`'s panel, as the category browser and the details card do (decision 14). As the panel's content, its destination row tops its 16px up to what the panel leaves above it (`max(--kozmos-panel-clearance-top, 16px − --kozmos-panel-inset-top)`) rather than adding 16px to it. Under a sheet's grip and in a side panel, "To" sat 33px from the panel's top and 17px from its side; it now sits 21px down under a grip and 17px down in a side panel, as it already did in a single-detent sheet. The options under the row keep their 16px, and on its own it is unchanged.

  Placed under a row of your own inside the panel, the preview is not at the panel's top: set both custom properties to `0px` on it, or move that row into `panelHeader`.

- d6df00f: `SegmentedControl` can hold an empty choice: `value={null}` is nothing chosen. `onValueChange` still reports a choice taken back as `undefined`, so a product that holds the choice passes `value={choice ?? null}`; the segment it took back is no longer left pressed, and Radix no longer warns about the control switching between controlled and uncontrolled. `value={undefined}`, or no `value` at all, leaves the choice to the control, exactly as in 0.5.0, so a wrapper that forwards its own optional `value` keeps working when it is used without one.
- Updated dependencies [0956f93]
- Updated dependencies [8f51ba1]
- Updated dependencies [f028338]
- Updated dependencies [6ce1001]
- Updated dependencies [b46112a]
- Updated dependencies [a957142]
- Updated dependencies [a6f288d]
  - @kozmos-ds/tokens@0.2.0
  - @kozmos-ds/product-contracts@0.5.0
  - @kozmos-ds/icons@0.5.0

## 0.5.0

### Minor Changes

- 415e486: The assistant's parts can be found, named and told apart.

  **`AICompanionPanel` is a region named by its title**, and the title is a heading: an `h2` by
  default, set with `titleLevel` (2 to 6) to fit the page's outline. It was a `p`. The panel moves
  focus into itself when it mounts and hands it back when it closes; `onOpenAutoFocus` and
  `onCloseAutoFocus` let a product send focus elsewhere, or keep it where it is with
  `event.preventDefault()`.

  **`AIMessage` and `UserMessage` say who spoke.** Each begins with a visually hidden "Assistant said"
  or "You said", so a screen reader reading the log can tell the turns apart. The defaults are
  English; pass a translated `speakerLabel`.

  **`AIInputBar`** draws its focus ring around the whole bar while the field has focus, draws a
  disabled field as disabled, takes `inputRef` to reach the field, and its send button is 44px.

- 415e486: A one-of-several choice is a radio group, two small marks become targets you can hit, a notice can
  interrupt, and Skeleton holds a shape.

  **`ChipGroup selectionMode="single"`** is a radio group: one Tab stop, and the arrow keys move the
  choice, mirrored right to left (`dir`). It takes `value`, `defaultValue` and `onValueChange`, and
  each `Chip` a `value`. `"multiple"` stays the default and behaves as before.

  ```tsx
  <ChipGroup
    selectionMode="single"
    value={sort}
    onValueChange={setSort}
    aria-label={t("sort.label")}
  >
    <Chip value="distance">{t("sort.nearest")}</Chip>
    <Chip value="name">{t("sort.name")}</Chip>
  </ChipGroup>
  ```

  **Chip's remove mark is 24px.** It was 20px at every chip size, under WCAG 2.5.8's minimum. Its
  44px-tall target is laid on by owned CSS, so the chip itself doesn't grow.

  **`Notice` can interrupt.** It gains `live`: `"off"`, `"polite"` (the default) or `"assertive"`, the
  same words `Alert` takes, so an emergency notice can cut in while a dietary one waits its turn. A
  caller's own `role` still wins.

  **`Skeleton` holds a shape and a size.** `shape` is `"line"` (text-high, filling its row),
  `"block"` (no default height: it is as tall as what it stands in for) or `"circle"` (`width` is its
  diameter), with `width` and `height`. Its grey is Figma's `background/200`, one step darker than the
  `background/100` it was, and the same on iOS and Android.

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

- 415e486: The map's controls take the product's words, the location control shows its mode, and step-free
  has a control of its own.

  **Every label is the product's.** `MapControlsGroup` gains `zoomInLabel`, `zoomOutLabel` and
  `compassResetLabel` (`locationLabel` already existed), `UserLocationMarker` gains `label`, and
  `FloorSelector` gains `previousFloorLabel` and `nextFloorLabel`. The defaults stay English: a design
  system has no locale of its own, and the product now has somewhere to put one.

  **The location control draws each mode.** A mark per `locationState` — `off`, `locating`,
  `following`, `heading`, `permission-denied`, `stale`, `unavailable` — replaceable with
  `locationIcons`. `locationRevealOnChange` shows the mode's label when it changes, and
  `locationLabelPlacement` puts that label `inline` or `stacked`. `@kozmos-ds/icons` gains
  `LocationFollowing` and `LocationHeading`, which the control draws, so this react needs this icons.

  ```tsx
  <MapControlsGroup
    locationState={locationState}
    locationRevealOnChange
    zoomInLabel={t("map.zoomIn")}
    zoomOutLabel={t("map.zoomOut")}
    onStepFreeChange={onRoute ? setStepFree : undefined}
    stepFree={stepFree}
    stepFreeLabel={t("map.stepFree")}
  />
  ```

  **Step-free takes the location control's place on a route.** With `onStepFreeChange` the control
  is a step-free toggle (`stepFree`, `stepFreeLabel`, `stepFreeOnLabel`, `stepFreeOffLabel`,
  `stepFreeIcon`). It is keyed apart from the location control, so assistive technology meets a new
  control rather than the old one changing its name.

  **The marker admits it is elsewhere.** `UserLocationMarker` gains `offFloor` and `offFloorLabel`.
  Off the level in view it is hollow, without its halo, ping or heading cone — shape carries the
  state, not colour alone — where the map page used to hide it and the visitor lost their position.

  **Pins sit on their place right to left.** `LocationPin` anchors to a physical origin, to match its
  physical translate. In Arabic every pin drew one pin-width to the left of the place it marks.

  **The map fills its shell.** `MapView` gains `variant="fill"`: no border, radius or 400px minimum,
  and `role="group"` rather than a second landmark inside `AdaptiveMapShell`'s map region. The
  default, `"framed"`, draws what it always drew. The labels beside map controls keep their gap right
  to left.

- 415e486: `AdaptiveMapShell` learns the chrome it cannot see, stops padding the camera for its controls, and
  gains a header that stays put.

  **`deviceSafeAreaInsets`.** The device's safe areas as a prop, merged with CSS `env()` so the larger
  wins: passing them can only add room. `env()` isn't always the truth — inside a device frame on a
  canvas, or a web view whose host paints its own bar — and the controls ended up under the status bar.

  **`controlsPadCamera`, off by default.** Collision insets are edge bands, so a 44px column of
  controls handed the camera the whole edge it sat on, at every height (120px, measured), and a map
  following the visitor centred itself off to one side. The controls stay in the snapshot's
  `occlusions` with their true bounds, so a product that wants to fit around them still can;
  `controlsPadCamera` brings the old padding back.

  **The controls sit where map apps put them on a sheet.** They were placed opposite the panel — right
  for a docked side panel, wrong for a bottom sheet, which spans the width. On a sheet they now sit at
  the inline end, mirrored right to left.

  **`panelHeader` stays put while the content scrolls.** It is drawn under the grip and above the
  scrolling content, and counted in the detent heights (`PanelDetentMeasures.headerBottom`). Its first
  control keeps 4px under the grip, so the grip's 16px target keeps the spacing WCAG 2.5.8 asks for. A
  sheet fitted to its content now counts its grip as well: it is 16px taller when `content` is offered
  with another detent.

- 61b121d: `AdaptiveMapShell` now tells its panel content how much space it leaves above it, through two custom properties on that content (GAP-083):
  - `--kozmos-panel-inset-top`: the grip's row on a sheet, `1rem` in a side panel, `0px` with no grip or under a `panelHeader`;
  - `--kozmos-panel-clearance-top`: how far the first control must still sit below that — 4px under a grip, which keeps the grip's target clear (WCAG 2.5.8); `0px` otherwise.

  A `POIDetailPanel` hosted there with `presentation="sheet"` pads its header's top to `max(clearance, 16px − inset)` instead of adding 16px to what the panel leaves. Its close button used to sit 33px from the panel's top and 17px from its side; it now sits 17px down in a side panel and 21px down under a sheet's grip. The bordered `panel` and `inline` presentations keep their own padding. Host the card with `presentation="sheet"` in the shell.

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

### Patch Changes

- 273e562: `FloorSelector`'s compact stepper now calls its two buttons "Floor up" and "Floor down", as iOS and Android do. They were "Previous floor" and "Next floor". "Floor up" is the up chevron, which steps to the previous level in `floors`, so list the levels top first and up goes up.

  This is a behaviour change products may match on in their own tests: a query such as `getByRole("button", { name: "Previous floor" })` no longer finds the button, so use the new names. A product that passes `previousFloorLabel` and `nextFloorLabel` keeps its own words.

- ded56bc: `MapOverlay` no longer cuts what floats in it (GAP-082). Its content scrolls when it is taller than the map leaves room for, and that scroll box clipped at the content's own edges, so a `MapControlButton`'s or `FloorSelector`'s floating shadow was cut off on every side, and with it the 1px ring that draws a map control's edge. The scroll box now keeps the floating elevation's reach clear around its content (4px above, 8px at each side, 12px below, read from `--semantics-elevation-floating` when the package is built) and takes the same space back with negative margins, so nothing moves: content sits where it did, and controls in an overlay draw as the same controls placed by hand, focus rings included. The only pixels left out are a shadow tail one level (of 255) deep, which Chromium and Firefox draw a little past the blur distance on Linux. While the content scrolls, it shows through that room too, and a press on the room, as on the space between the overlay's items, does not reach the map.
- Updated dependencies [415e486]
- Updated dependencies [415e486]
- Updated dependencies [415e486]
  - @kozmos-ds/product-contracts@0.4.0
  - @kozmos-ds/icons@0.4.0

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
