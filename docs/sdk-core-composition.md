# SDK composition and Core ownership

SDK modules must compose Kozmos Core for reusable controls. Sharing colors or
copying a class recipe is not component reuse. This document is the migration
map, not a statement that the existing implementation already meets that rule.

## Boundary

SearchBar's existing raw search input has an owned CSS compatibility recipe for
WebKit native-control styling and enlarged-text shrinkage. This fixes rendering,
not composition ownership: migration still requires the decorated Core field
contract below. The clear action already uses Core IconButton.

- Core owns buttons, icon buttons, fields, counters, generic selectable surfaces,
  disclosure mechanics, loading indicators, focus treatment and overlay mechanics.
- SDK modules own place/route data, domain wording, route/marker geometry,
  floor transitions, layout composition and host callbacks. They may compose
  other SDK modules. They must not copy Core controls to obtain different styling.
- Native layout, text, images and drawing are legitimate implementation tools.
  A `div`, SwiftUI stack or noninteractive Compose `Surface` is not automatically
  a violation. A clickable surface recreating a button is a review candidate.
- Map rendering, location acquisition, route calculation and arrival detection
  remain host responsibilities. Composing Core does not make a fixture a real SDK.

## Scope and reproducible discovery

Run from the repository root:

```sh
node scripts/audit-sdk-composition.mjs
node scripts/audit-sdk-composition.mjs --json
node scripts/audit-sdk-composition.mjs --examples
node --test scripts/ci/sdk-composition.test.mjs
```

The audit reads `scripts/storybook/catalogue.json`: `auditSdkComponents` preserves
the previous 43-family scope independently of sidebar moves, and newly classified
SDK entries join that scope. The current report covers 44 component families;
use its JSON output for the current implementation/helper file inventory.
React follows relative
imports/re-exports (including `.ts` helpers and index files), and reports where it
stops at another component's ownership boundary. It includes secondary files
such as `MapInfo.tsx` and `POIDetailContent.swift`, not just namesake entry files.

React discovery parses JSX/imports rather than matching prose, including literal
intrinsic aliases, React element factories and implicit `summary` controls.
The JSON report contains component dependency edges and unresolved relative imports.
This is not full symbol resolution: computed tags, shadowed aliases, nonrelative
path aliases and native helpers still require review. Native discovery
is a candidate scan, not a Swift/Kotlin parser or a proof of compliance. Review
aliases, helper functions, styles and imported dependencies as well. Absence of
a raw-control finding is not proof that every reusable visual is composed.
This tool reports; it does not turn unresolved findings into a passing gate.

### Example and fixture coverage

`--examples` audits all catalogue SDK stories, the preserved SDK/shared families'
stories, contextual Examples and retained design-gap guides (currently 51 entries).
It follows relative helpers and reports component boundaries for the implementation
audit above. A clean direct story does not certify the SDK components it consumes.
Native interaction-host and journey-composition fixtures were also reviewed manually;
they are not parsed by this web AST check. Private playgrounds/prototypes outside
these entry points require their own audit before reuse as SDK examples.

| Consumer                                                   | Remaining non-Core implementation / dependency                                                                              | Follow-up                                                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdaptiveMapShell.stories.tsx`, content-aware card fixture | Go now composes Core Button with the navigation pointer; title/body remain ordinary layout                                  | Keep `card-go` measurements and peek-anchor regression. This sizing fixture does not implement navigation; real host navigation belongs in the journey examples.                       |
| `NavigationExamples.stories.tsx`                           | Uses SDK ManoeuvreCard, whose disclosure buttons remain custom                                                              | Build generic Core disclosure mechanics, then migrate SDK. Rail fill/flow already use Core ProgressTrack; the blue dot reuses UserLocationMarker. New fixture toggles use Core Button. |
| `POIDetailExamples.stories.tsx`                            | Inherits opening-hours `summary` and custom focus/reopen coordination                                                       | Core disclosure and shared overlay/focus-return capability first. Ordinary flex/grid host sizing is layout, not a copied control.                                                      |
| `MapBrowseFlow`, `MapSearch`                               | Inherit SearchBar, POICard selection and adaptive-sheet gaps                                                                | Migrate those SDK dependencies; map coordinates and renderer slots stay host/domain responsibilities. Empty copy/heading styling can use existing Core Text/Heading/EmptyState.        |
| `NavigationJourney`                                        | Composes SDK route/picker/recovery modules; fixture actions use Core                                                        | Follow existing native picker/recovery acceptance gaps. Do not infer full Core compliance from the composed outer panel.                                                               |
| `OpeningHours`                                             | Composes Accordion/Tag rather than native disclosure controls                                                               | No direct standard-control replacement identified; retain semantic/keyboard checks.                                                                                                    |
| `Guides/Design gap references/POI details`                 | Historical demo contains explicit missing-feature notices and illustrative media                                            | Keep as a reference, not production coverage. Its logo shape/scroll/route-details gaps need current API reconciliation before promoting it.                                            |
| Swift `UITestHost/App/InteractionHost.swift`               | Language/Zoom/Locate map slots compose Core ghost Buttons; raw map-size/inspection/photo-replacement fixture Buttons remain | Preserve named callbacks, region accessibility and hidden-control tests. Remaining test scaffolding is distinct from reusable product UI and still requires its own migration.         |
| Android `KozmosJourneyCompositionTest.kt`                  | Journey fixture actions already use KozmosButton; inherits SDK internals                                                    | No direct ordinary-control duplication identified in this fixture. Does not certify all Compose SDK controls.                                                                          |

### Missing Core capabilities to build before further migration

**React popup-layer correction:** Core Combobox now registers its
open suggestions with the same dismissable-layer stack as Dialog and Popover.
The field owns bubble-phase Escape after its host handler: dismiss suggestions
first, keep the enclosing surface open and return input focus. IME and prevented
Escape retain both layers. Inline popups share this behavior. An open popup with nothing to show is not drawn
and takes no layer, so a parent's Escape is never swallowed. This is
a Core correction inherited by SDK consumers, not a navigation-specific DOM
exception. See `Combobox.layers.test.tsx` and `scripts/check-combobox-layers.mjs`;
the latter is included in the three-engine `test:overlays` gate. It does not close
the remaining generic adaptive-sheet gaps below.

| Core capability                                                         | Consumers waiting for it                                                      | Status / boundary                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decorative progress fill and directional flow                           | RouteProgressRail                                                             | Implemented locally as ProgressTrack on React/Swift/Compose: explicit static/live ranges, opt-in motion, reduced-motion/lifecycle handling. SDK supplies route data; Core never advances a route. Delivery/visual checks remain separate. |
| Unstyled/decorated field composition with shared clear/focus/validation | SearchBar, AIInputBar, native RoutingInputGroup/WayfindingCard                | Missing reusable contract; do not copy Input styles or wrap duplicate fields/IDs.                                                                                                                                                         |
| Selectable/pressable surface supporting sibling actions                 | CategoryTile, RouteOptionCard, POICard/POIResultCard, interactive LocationPin | Missing shared interaction foundation; preserve selection vs action semantics and avoid nested buttons.                                                                                                                                   |
| Chrome-independent disclosure mechanics                                 | ManoeuvreCard, Notice, POIResultGroup, POI opening hours/read-more            | Missing shared capability; Accordion chrome is not a universal substitute.                                                                                                                                                                |
| Adaptive sheet/overlay and focus restoration                            | AdaptiveMapShell, MapInfoPanel, contextual POI examples                       | Extract reusable gesture, scrolling, detent and focus mechanics before replacing SDK bypasses.                                                                                                                                            |
| Icon-button decoration and native label/secondary-content parity        | AISearchButton, native map controls, route actions                            | Existing leading icons/growing labels partly implemented; gradient-ring decoration and secondary content need explicit API review.                                                                                                        |
| Compact metadata/corner badge and message/loading presentation          | POIResultCard attributes/tabs, AIMessage, streaming/loading native helpers    | Review semantic primitives before extraction. Ordinary text/images/layout and map geometry do not require a Core component for every element.                                                                                             |

Use existing Core Button/IconButton/Counter/Link where they already express the
behaviour. The missing-capability list is not permission to keep reimplementing
those controls. Conversely, renaming a raw control or moving it into a Core folder
without defining/testing its reusable contract does not complete a migration.

Two concrete native CategoryField prerequisites remain: Counter currently offers
20/18-point sizes, not the field's 22-point pill, and IconButton's ghost foreground
is themed rather than the category clear's contrast-safe neutral foreground.
Define compatible shared size/colour capabilities and verify them before replacing
these controls; outer frames or SDK-owned colour overrides do not establish parity.
AIInputBar's voice control also needs a focusable-but-inert unavailable policy and
cancellable connecting presentation. Core's normal loading flag disables the button
and is not appropriate for a conversation the visitor must still be able to end.

Native Combobox now accepts separate `KozmosPickerAction` commands, implemented in
Core Listbox with Core Button. RouteLocationField composes these for map selection
and opt-in usable current position. Commands have stable unique IDs, remain unfiltered,
respect disabled/read-only state, request closure before the callback, and never
write action IDs or labels into the selected value/query. Swift's optional `expanded`
binding and Compose's existing controlled expansion require the host to honour closure.
Empty/error suggestions do not hide usable commands. Source-compatible existing calls
now expose map selection inside the open unresolved picker, not below the selected card.
React likewise rejects blank/ambiguous command IDs and renders identical supporting
and empty-state text once, retaining popup Escape ownership without empty chrome.
Compose Core Listbox uses selectable option semantics; command Buttons remain
unselected. Native platform snippets still require actual compiler checks: the
React tarball recipe gate does not validate Swift/Kotlin documentation strings.
Physical VoiceOver/TalkBack, keyboard and focus transfer to the real host map remain
integration acceptance work; native popup geometry is not React's overlay-layer API.

The status inventory and Storybook taxonomy are not yet a single authority.
Previously omitted families include the AI modules, Notice, CategoryField,
POIResultGroup, ManoeuvreCard, Itinerary and RouteProgressRail. Reconcile the
generator inputs before introducing a universal layer-enforcement rule; do not
edit generated inventories by hand or silently classify domain components as Core.

## Migration map

### Acceptance contracts for the missing foundations

These are implementation requirements, **not APIs that already ship**. Build and
test the generic capability before moving its consumers. An SDK-specific wrapper
around the same raw controls does not satisfy these requirements.

- **Decorated field composition:** one actual input, one stable ID, and one owner
  for label, description, validation and disabled/read-only state. Leading/trailing
  decorations must not create duplicate fields or nested controls. Clear must respect
  locked state, fire the domain change once and have an explicit focus-return policy.
  Preserve input refs, IME composition, caller-handled keyboard events and form
  submission. SearchBar and AIInputBar still own their field recipes until this exists.
- **Selectable surface with sibling actions:** distinguish selection from activation
  and expansion. Preserve the appropriate button/link/radio semantics rather than
  making every card a generic `role="button"`. A card's Go/Details/favourite actions
  must be separate reachable controls and must not also select the card. Cover keyboard,
  pointer, disabled state, focus rings, controlled selection and long translated labels.
  Map-marker coordinates remain outside this primitive.
- **Chrome-independent disclosure:** a named trigger with stable expanded state and
  content association; no mandatory Accordion borders or padding. Support controlled
  state without duplicating the trigger in collapsed/expanded compositions. Define
  whether collapsed content unmounts or stays hidden; neither may leave focus inside
  invisible content. ManoeuvreCard, Notice, POI groups and hours/read-more need the
  same mechanics but different domain content and visual presentation.
- **Adaptive overlay/focus:** modal and nonmodal are explicit behaviours, not aliases
  for compact and wide CSS. Define initial focus, Escape, outside interaction,
  scroll locking, inert siblings, nested overlays and return focus when the original
  trigger disappears. Detents, drag-to-scroll handoff, safe areas, virtual keyboard
  resizing and content-aware peek measurements must survive extraction. Use existing
  Dialog/Popover internals where appropriate; do not introduce a second focus manager.
- **Native action presentation:** retain existing initializer/positional call
  compatibility. Shared neutral/emotional icon-button content, category counter size
  and labelled secondary content need real Core capabilities. Connecting voice is
  cancellable, so loading decoration and activation blocking cannot be conflated.
  Where unavailable controls remain focusable, both pointer and keyboard activation
  must be inert and must not emit action telemetry. Core must own these policies.
- **Metadata, messages and loading:** determine semantics before extracting visuals.
  A result count is not a selectable chip; a typing decoration is not an independently
  announced progress indicator; a speaker-labelled chat log is not a row of alerts.
  Avoid repeated live-region announcements and retain unknown/empty states. Ordinary
  text, layout and decorative drawing need not become new components merely to reduce
  the audit's finding count.

Every extraction needs isolated Core tests plus a real SDK consumer regression,
including narrow/large-text layouts, both themes, RTL, keyboard/focus behaviour and
native execution where supported. Record platform exceptions explicitly. Only then
remove the consumer's duplicate behaviour/styles and update its inventory row.

“Composed” below describes the reviewed control path, not platform/device acceptance.
“Drawing/layout” means no standard-control substitution was identified there.

| Family                 | React                                                                                                | Native / remaining work                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AICompanionPanel       | Close now composes IconButton; Escape handling remains domain behavior.                              | No native implementation. Audit shared overlay lifecycle separately.                                                                                                                                                            |
| AIInputBar             | Send now composes IconButton.                                                                        | React voice control and unadorned input still custom; no native implementation.                                                                                                                                                 |
| AIMessage              | Bubble, speaker wording and streaming dots.                                                          | Review a shared message/typing primitive; no native implementation.                                                                                                                                                             |
| AIMessageList          | Log, ordering and scroll behavior.                                                                   | No native implementation.                                                                                                                                                                                                       |
| AISearchButton         | Custom gradient-ring button.                                                                         | Custom Swift Button / Compose clickable; needs shared icon-button decoration support.                                                                                                                                           |
| ActionCard             | Layout/content slot, not another action implementation.                                              | No native implementation.                                                                                                                                                                                                       |
| AdaptiveMapShell       | Surface composed; sheet gesture/slider mechanics custom.                                             | Shared sheet mechanics need extraction, preserving scroll handoff, bounds and detents.                                                                                                                                          |
| ArrivalPanel           | Button and Surface composed.                                                                         | Composed controls; host supplies completion metrics and Done behavior.                                                                                                                                                          |
| BrowseCategoriesPanel  | Composes CategoryTile.                                                                               | Inherits CategoryTile work; noninteractive Surface is not a copied button.                                                                                                                                                      |
| CategoryField          | Clear now IconButton; count now Counter.                                                             | Clear/count remain custom in Swift/Compose. Preserve tint contrast and target geometry.                                                                                                                                         |
| CategoryTile           | Counter composed; selectable tile custom.                                                            | Custom selectable surface on all platforms.                                                                                                                                                                                     |
| DirectionStep          | Domain glyph and instruction drawing.                                                                | Keep common vocabulary/glyph parity, not a Button replacement.                                                                                                                                                                  |
| FloorSelector          | Button/IconButton/Popover/Tooltip composed.                                                          | Custom floor/stepper controls and popup/keyboard dismissal. Preserve floor policy, counts and focus.                                                                                                                            |
| Itinerary              | Composes DirectionStep.                                                                              | Route list/metrics; no ordinary-control duplication identified.                                                                                                                                                                 |
| LanguageSwitcher       | Select/Button composed.                                                                              | Native implementation absent; existing web-only exception is not parity.                                                                                                                                                        |
| LocationPin            | Interactive marker uses custom div keyboard behavior.                                                | Marker interaction needs a shared pressable foundation; preserve renderer coordinates and ref compatibility.                                                                                                                    |
| ManoeuvreCard          | Two custom disclosure buttons.                                                                       | Same custom disclosure in Swift/Compose; retain one accessible trigger when collapsed and focus transfer.                                                                                                                       |
| MapAttribution         | Core Link composed.                                                                                  | Android uses clickable text container. Core Link needs a compatible typography/content presentation contract before migration can preserve neutral 11sp/14sp credit text and one semantic action over decorative halo copies.   |
| MapControlButton       | Core Button composed.                                                                                | Native variants still implement Button/Surface themselves. Core must support their labelled/loading appearance.                                                                                                                 |
| MapControlsGroup       | Composes MapControlButton.                                                                           | Some native helper controls remain raw Button/IconButton.                                                                                                                                                                       |
| MapInfoPanel / MapInfo | Content uses Accordion/Button/Link; wrapper imports Radix Dialog directly.                           | Extract adaptive overlay mechanics into Core before removing the bypass; preserve side-panel/nonmodal versus compact/modal behavior.                                                                                            |
| MapOverlay             | Positioning/layout.                                                                                  | Positioning/layout, not a control.                                                                                                                                                                                              |
| MapStatusPill          | Spinner composed.                                                                                    | State presentation; no ordinary-control substitution identified.                                                                                                                                                                |
| MapView                | Renderer/content slot.                                                                               | Host-renderer boundary, not an application map implementation.                                                                                                                                                                  |
| NavigationAnnouncer    | Domain accessibility announcement adapter; no ordinary-control copy identified.                      | UIKit announcement and Compose live-region integration are platform boundaries, not missing Button/Surface composition. Verify delivery with real assistive technology.                                                         |
| Notice                 | Custom disclosure button and notice surface.                                                         | No native implementation. Generic disclosure primitive needed, not an Accordion with unwanted chrome.                                                                                                                           |
| POICard                | Card/Text/Heading composed; selection button custom.                                                 | Native close controls raw. Preserve sibling actions; never nest buttons.                                                                                                                                                        |
| POIDetailPanel         | Core actions composed; opening-hours details/summary still bypasses a Core disclosure.               | Swift custom action helper, read-more button and ProgressView; native action/metadata slots need shared foundations.                                                                                                            |
| POIMediaGallery        | Core IconButton plus list keyboard navigation.                                                       | Swift retry tap gesture and ProgressView; preserve media retry semantics and loading accessibility.                                                                                                                             |
| POIResultCard          | Footer actions now Button; selection surface, corner tabs and attribute chips custom.                | Swift/Compose footer actions now compose Core Button; narrow/large-text actions stack or wrap. Selection/tabs remain separate work.                                                                                             |
| POIResultGroup         | Custom expand/collapse footer; child results reused.                                                 | Custom native disclosure surface.                                                                                                                                                                                               |
| POIResultList          | EmptyState and result components composed.                                                           | Inherits result/group migrations; noninteractive list surface is legitimate.                                                                                                                                                    |
| RouteLocationField     | Button and Combobox composed.                                                                        | Native selected Change/Cancel actions use Core Button; map/current-position commands now compose Core Combobox/Listbox actions. Host map focus, live fix validity and physical assistive-technology acceptance remain separate. |
| RouteOptionCard        | Custom selectable card.                                                                              | Same on Swift/Compose; generic selectable surface required.                                                                                                                                                                     |
| RoutePreviewPanel      | Buttons and RouteOptionCard composed.                                                                | Inherits option work; keep actions separate from selection.                                                                                                                                                                     |
| RouteProgressRail      | Domain geometry composes Core ProgressTrack, shared UserLocationMarker and DirectionIcon.            | Active-leg track and compact marker implemented on Swift/Compose too; final canonical visual/device acceptance remains separate.                                                                                                |
| RouteSetupPanel        | Button/IconButton/Surface composed.                                                                  | Native controls composed; hosts own picker/map/current-position availability.                                                                                                                                                   |
| RouteSummary           | Core buttons and Surface composed.                                                                   | Swift legacy End uses Core destructive IconButton (44pt). Android legacy End remains raw: its red ghost treatment needs a Core danger-ghost contract before replacement.                                                        |
| RoutingInputGroup      | Button/Input composed.                                                                               | Native endpoint actions use custom Button/clickable helpers.                                                                                                                                                                    |
| SaveLocationCard       | Button/Surface composed.                                                                             | Compose and Swift save/remove/guide use Core Button, including success Guide styling and the canonical navigation pointer. Native note-edit remains raw pending a neutral Core icon-action contract.                            |
| SearchBar              | Clear now composes Core IconButton and cannot clear disabled/read-only fields; input remains custom. | Shared decorated/unadorned input foundation needed; native input and clear also custom.                                                                                                                                         |
| UserLocationMarker     | Location/heading/accuracy drawing; compact mode reused by the rail.                                  | Shared compact dot implemented on Swift/Compose, without heading halo or continuous animation.                                                                                                                                  |
| UserMessage            | Speaker semantics and message bubble.                                                                | Review shared message surface; no native implementation.                                                                                                                                                                        |
| WayfindingCard         | Core Card/buttons; input row now full Input components.                                              | Native close/swap and decorated text fields remain custom.                                                                                                                                                                      |

## Work order and acceptance

1. **Standard control migration (started).** POI action buttons,
   category clear/count, assistant close/send and wayfinding inputs now reuse
   Core. New regressions were observed failing before replacement. Keep public
   callbacks, IDs, names, disabled behavior and explicit form button types.
   Core Button analytics now accompany the existing domain events; domain events
   must still occur exactly once and must not gain sensitive input values.
   POI action rows now constrain their grid child and allow full translated
   labels to wrap; checking only a button's height would miss off-card content.
   Combobox keeps its highlighted value/action by stable identity across host
   rerenders, resets after query changes and respects IME/caller-handled Escape.
   Native POI footer actions now also use Core Button. Swift falls back from a
   horizontal row to a vertical group; Compose wraps actions to new rows, so a
   long first label cannot collapse the next action to zero width.
2. **Core capability gaps, before more substitutions.** Add compatible
   secondary-content support to SwiftUI Button. Optional leading-icon support
   and native label growth are implemented. Android labelled buttons now have
   a 48dp minimum surface/target and grow with content; this intentionally
   changes the former 44dp layout and needs reviewed visual references.
   Compact icon-only sizing is unchanged and remains a separate target-policy
   review. Define a generic selectable/pressable surface and
   disclosure primitive. Define decorated field composition without duplicating
   field IDs, validation, focus or clear actions. Do not implement these by
   adding opaque SDK-only exceptions to Core.
3. **Migrate native and custom interaction consumers.** Use the table to cover
   legacy paths as well as newer hosted paths. Test keyboard/assistive-technology
   activation, focus restoration, selection versus toggle semantics, disabled
   state, localized labels, long text, RTL and callback telemetry. Include real
   iOS simulator execution and Android JUnit names/counts, not only compilation.
4. **Overlay and repeated visual foundations.** Adaptive sheet behavior,
   MapInfo's direct Dialog primitive, notices, POI attributes/tabs, message
   surfaces and loading indicators require semantic review. Not every rounded
   region should become Card, and not every spinner should become Progress.
5. **Journey presentation (released in React 0.9.0; delivery gates remain).** The desktop and phone
   Navigation stories now use hosted RouteSummary inside the shell; fixture
   step buttons live outside product chrome. A common horizontal coordinate
   system places start, finish, supplied progress and fixed transition points.
   Static mode colours only the selected section; live mode colours journey start
   to the blue dot. Optional theme-to-success gradient grows with live progress
   without resetting at transitions; future legs remain neutral. Core-owned,
   opt-in directional dashes indicate the current section without simulating
   progress, and honour reduced motion/background state. A compact dot in the map marker's blue is
   distinct from the transition row. Invalid/unknown position is not zero;
   hosts reject stale route revisions, update ranges atomically and confirm
   transitions/arrival explicitly. `activeWaypointId` resolves coincident next
   transitions. Hosts can disable motion independently. Legacy rail calls are preserved.
   See [navigation integration](navigation-integration.md) for contracts and checks.
6. **Enforcement and delivery.** Establish one classification source, add
   import/AST boundaries with narrowly documented platform-integration
   exceptions, and reject new standard-control copies. Validate real consuming
   examples as well as isolated components. Regenerate docs after builds,
   measure unchanged bundle budgets, review pinned Linux visual diffs, run the
   exact-head required CI and retain design/device acceptance as separate gates.

The first migration does not close this table or complete native parity. The journey
rail is released in React 0.9.0; host, device and design acceptance remain. Existing React picker and recovery-overlay preview
changes also retain their separately documented native acceptance work.

### Native action API and migration

Swift's `leadingIconName` is an optional Core `KozmosIcon` name. Existing label-only calls remain
valid. The icon is decorative: the text supplies the accessible name, and the
loading spinner replaces the icon rather than adding a second leading symbol.
Labels wrap and retain Dynamic Type; disabled/loading behavior stays in Core.

```swift
KozmosButton("Go", leadingIconName: "navigation-pointer-01") { navigate() }
KozmosButton("Details", variant: .outline, emotion: .neutral) { showDetails() }
```

Compose already accepts icon/text content through its `RowScope` slot. Let the
content inherit Core's colors and typography; do not recreate a styled Surface
or supply a fixed height that prevents text growth.

```kotlin
KozmosButton(onClick = ::navigate) {
    KozmosIcon("navigation-pointer-01")
    Text("Go")
}
```

Only Go/Directions carries the decorative navigation pointer. Other labelled
POI actions (Details, Share, Order, Book and Call where supported) are text-only.
Icon-only close/favourite/bookmark controls and loading indicators are unchanged.
Native pointer paths are generated from the canonical Pointr React artwork by
`pnpm icons:navigation:generate`; do not substitute platform navigation arrows.

Android draws labelled buttons (Default, Sm and Lg) 44dp tall, as the web,
iOS and Figma do, and they grow with a larger label instead of clipping it.
Material's minimum interactive size gives each a 48dp touch target, the 44dp
surface centred in it. The Icon size keeps its fixed 44dp square. Parent
clipping/overlapping targets and physical TalkBack/VoiceOver acceptance still
require host review. Swift keeps its 44pt minimum.

Native checks from the repository root:

```sh
(cd packages/ios && swift test)
node scripts/check-ios-poi.mjs
# Supply your installed Android SDK path, without changing the toolchain:
(cd packages/android && ./gradlew verifyPaparazziDebug)
node --test scripts/ci/sdk-composition.test.mjs
```

Read named iOS results from the printed xcresult paths and Android JUnit XML
under `packages/android/build/test-results/testDebugUnitTest`. The Core growth
and pointer tests, POI list action tests and native adapter composition guard
are distinct checks: source composition alone does not prove runtime behavior.
Do not accept changed Android goldens on macOS just to make verification green;
review the changed geometry and record on the canonical Linux renderer.

## Editing and checking

Component source lives under `packages/react/src/components/<Name>/`,
`packages/ios/Sources/Components/<Name>/` and
`packages/android/src/main/java/com/kozmos/components/<Name>/`. The audit prints
exact file/line locations; these are preferable to copying stale line numbers.
Shared React interaction tests are in `SDKComposition.test.tsx`.

### Where to make the next changes

| Change                           | Implementation owner                                                        | Verification                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Core native icon/text capability | Swift `Button/Button.swift`, Android `Button/Button.kt`                     | Compatible existing calls, icon/label spacing, enlarged/wrapped text, disabled/loading activation, actual native execution                    |
| Result action composition        | `POIResultCard` on each platform                                            | Separate selection/action callbacks; no nested controls; complete translated labels at 320 px and 200% text                                   |
| Picker behavior                  | Core `Combobox`; SDK `RouteLocationField`                                   | Stable highlighted identity on rerender/reorder, disabled/removed choices, IME, Cancel, current-position availability, host focus restoration |
| Nested journey surface           | `ManoeuvreCard/NavigationExamples.stories.tsx`; `RouteSummary`              | Hosted summary has no independent surface; standalone still does; fixture controls outside panel                                              |
| Journey rail                     | `RouteProgressRail`, shared progress/location primitives, host example      | Shared endpoint coordinates, supplied within-step progress, unknown/stale state, reroutes, transition collisions, RTL and reduced motion      |
| Remaining custom controls        | Exact findings from `audit-sdk-composition.mjs`, plus migration table above | Fix missing generic Core capability first; then substitute and prove behavior/visual parity                                                   |

SDK layout constraints such as available width and wrapping do not transfer
button behavior back to the SDK. Keep focus, disabled/loading behavior, theme
treatment and activation in Core. Conversely, importing Core somewhere in a
module does not prove that its other controls use it.

```sh
node --test scripts/ci/sdk-composition.test.mjs
pnpm --filter "@kozmos-ds/react..." build
pnpm --filter @kozmos-ds/react exec vitest run
pnpm --filter @kozmos-ds/react exec tsc --noEmit
pnpm --filter @kozmos-ds/docs build-storybook
pnpm ci:local --workflow bundle-size.yml --job analyze-bundle
# Finish builds (including the bundle analyzer) before browser consumers run.
pnpm skills:build
pnpm skills:check
# Against the freshly built Storybook served on 6230 (or set STORYBOOK_URL):
STORYBOOK_URL=http://127.0.0.1:6230 node scripts/check-sdk-core-controls.mjs
STORYBOOK_URL=http://127.0.0.1:6230 ADAPTIVE_BROWSER=firefox node scripts/check-sdk-core-controls.mjs
STORYBOOK_URL=http://127.0.0.1:6230 ADAPTIVE_BROWSER=webkit node scripts/check-sdk-core-controls.mjs
```

The SDK browser checks are also part of `test:navigation`, so the existing CI
navigation shards execute them in all three engines. Their screenshots are
retained with browser evidence. They test full action-label containment, not
just target dimensions. This wiring does not itself prove that CI has run the
current uncommitted changes.

Use `docs/design-system-maintenance.md` for the full candidate checks and
`docs/visual-review.md` for approved golden recording. Do not change thresholds,
overwrite native references with another renderer, or describe skipped tests as
executed. Manual VoiceOver/TalkBack and host SDK acceptance remain necessary.
