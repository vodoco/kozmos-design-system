# SDK module coverage and implementation plan

This is the maintained plan for composing the Pointr SDK experience from Kozmos. It replaces
the September 5 inventory, which predates the shipped collapsible floor selector, control
states, metadata strip, itinerary and map-status component. It does **not** propose removing
the existing public Product / SDK components.

Baseline: release commit `152a31349db8832d8b87a9d5ea52e229fca245b5`, published 2026-10-02.
React 0.8.0, tokens 0.4.0 and product-contracts 0.7.0 are published on `latest`;
icons stays 0.5.0. Matching SwiftUI/Compose source is in the repository, not a native
registry release. See [release evidence](release-process.md#080).
P01–P04 below are all in that release.
React 0.9.0 (2026-10-06, `c7644af8`; tokens 0.5.0, icons 0.6.0, product-contracts 0.8.0) adds the
navigation completion (#193): RouteSetupPanel, RouteLocationField, ArrivalPanel, RouteSummary hosted in the
map shell's panel and RouteProgressRail's active leg. See [release evidence](release-process.md#090).
P01's three source slices merged in #185 at `13347cf5aea0e319570a7ff5ce95174c03b6c30d`, released in 0.8.0:
GAP-109 (named manoeuvre containers), GAP-056 (result-action targets), and GAP-101
(named shell controls). Exact-main CI, selected workflows and deployed docs were verified;
publication is not adoption in products.
P02 merged in #186 at `393cdc4430c84e8a3fdbd1383e6a99a987b3ef70`, released in 0.8.0:
shell-owned 16-unit header gaps and gripless top insets across React/SwiftUI/Compose,
with fitted-height and hosted-inset regressions. Exact-main CI and deployment passed;
live docs and navigation spacing were verified. External Figma/consumer adoption remains separate.
P03's staff-language slice merged in #187 at `b734587172714391d2046ddddf7d7b2b36da5ee8`,
released in 0.8.0: optional explicit `languageNotListed` evidence and localized card/list
disclosure across all three platforms. Unknown does not mean unlisted, and UI language
never implies staff availability. P03's structured-instruction slice merged in
[#188](https://github.com/vodoco/kozmos-design-system/pull/188) at
`b94423b6c89c2a1dec2cd059d81ff905885dcf52`, released in 0.8.0:
ordered text/secondary/language parts across the three navigation components, with legacy
String calls preserved. Inline language metadata survives the native accessibility bridge;
physical speech and external product/Figma acceptance remain separate. Exact-main CI,
selected workflows, deployment and affected live Storybook content were verified.
P04's numbered-result presentation (GAP-119) merged in #190 and #191, released in 0.8.0: the
SDK presentation is the default on all three platforms, with `presentationStyle="legacy"`
keeping the earlier Featured-first tab. GAP-120's marker appearance remains open.
For all 121 supplied product gaps (latest source intake 2026-10-01), their criteria and corrected statuses, read the
[product design gap register](product-design-gap-register.md). The site has a
[separate gap register](../apps/site/GAPS.md).

## Outcome and boundaries

### Navigation completion (#193)

The navigation completion adds the reusable presentation the product's navigation screens
ask for. This section supersedes older missing-API statements; it does not certify
publication, SDK wiring or external artwork adoption.

| Area              | Implementation                                                                                                                           | Remaining boundary                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Guidance          | Theme-filled ManoeuvreCard by default; explicit background/solid/glass option, expanded itinerary and optional per-step metrics          | Host supplies ordered localized instructions and current step                                             |
| Direction symbols | Shared 19-case vocabulary; Pointr Maps - Express wayfinding glyphs for 15 kinds, walking included, generated for web, native and Figma   | SDK renderer sprites are different assets                                                                 |
| Journey summary   | Hosted/standalone summary, optional estimates, stable waypoint rail, unknown progress, narrow/RTL layouts                                | SDK owns estimates, route replacement and progress; 100% does not imply arrival                           |
| Arrival           | ArrivalPanel with destination, optional actual distance/duration and controlled Done                                                     | Explicit confirmed-arrival event and actual metrics come from the host; no estimates relabeled as actuals |
| Setup             | Resolved RouteLocationField, readiness/pending RouteSetupPanel, map-point confirmation/list alternative                                  | Host supplies valid IDs/coordinates, search/cancellation, keyboard and sheet insets                       |
| Recovery          | Existing Dialog/EmptyState composed for unavailable route, unavailable step-free route, unusable position, offline and transient failure | No silent stairs fallback; host chooses safe retry and focus restoration                                  |

Runnable web reference: Storybook **Examples / Navigation journey**. The pure example
controller rejects stale request generations and outdated route events; its fixture buttons
simulate SDK results, not a map engine. Native public-component references live in the iOS
interaction host (`navigation-journey`) and Android `KozmosJourneyCompositionTest`.
Their passing simulator/semantic checks do not certify physical VoiceOver/TalkBack or native
modal focus isolation. See [navigation integration](navigation-integration.md) for the file map,
configuration, migration and reproducible checks. GAP-111's complete POI route-details slot and
P11 renderer styling are not implemented by these compositions.

Kozmos already has a substantial component foundation. The missing work is now a combination
of reusable presentation components, shared layout support, host-owned data/SDK integration,
and complete-screen verification. Component coverage alone is not a finished SDK experience.

Next work after the 0.8.0 library release:

1. Reuse the shipped level switcher, logical map-corner slots, attribution and Info components;
   use the web-only language switcher where the SDK host supports it.
2. Reuse merged PR #160 for the iOS host's floor ordering/default selection and lifecycle work;
   validate additional real-device/consumer scenarios instead of duplicating it.
3. Complete real web/Android SDK adapters, locale/provider ownership and full-screen acceptance.
4. Confirm exit-building state policy before composing that remaining action, and validate
   physical-device accessibility, Figma mapping and consuming-app adoption separately.

The user confirmed **React, iOS and Android enhancements in sync**, not React first with
native parity deferred. **Explicit exception: LanguageSwitcher is web-only.** The user confirmed
that iOS and Android follow device language and have no dedicated language button. Other shared
batches include native implementation and named tests; do not invent native buttons for parity.
Figma and consuming-app adoption must still be checked separately before claiming end-to-end parity.
No new version, merge or publication is authorized by this plan.

### Confirmed behavior and current implementation increment

- The entire collapsed floor tile opens the list. Arrows are non-interactive availability cues:
  both in the middle, up at the bottom, down at the top, neither for a single floor.
  Disabled choices do not imply an available direction; unknown selections promise neither.
- In RTL, mirror language to bottom-right and floor/zoom to bottom-left.
- Keep per-floor search-result badges, **off by default** through `showResultCounts = false`.
  Positive supplied counts appear only after opt-in, in expanded/vertical/horizontal lists.
  The closed tile and compact stepper never show a count. Hidden counts are not announced.
- The 0.7.0 release implements those cues, full-name hints and the count
  option across all three targets; logical MapOverlay start/end corners are also implemented.
  Web focus/hover, iOS hover/long press and Android focus/hover use existing tooltip components.
- Native physical left/right overlay names now stay physical in RTL; use start/end to mirror.
- The focused follow-up review fixes native stale-selection behavior: an absent ID is never
  substituted with the first floor, steppers cannot move from an invented index, and a fallback
  label is not a selectable floor. React already preserved the ID and now has a removal/recovery
  regression test. Android retains the 0.6.0 positional formatter call signature with counts off.
- Compact-stepper separators now use logical web borders, verified in real LTR/RTL browsers.
  This addresses that specific product GAP-086 subissue, not every RTL criterion in the register.
- AdaptiveMapShell now has measured `controlsBottomStart` / `controlsBottomEnd` slots on all
  three targets, with width-dependent wrapping, RTL mirroring and opt-in bottom camera padding.
  Native shells respect bounded hosts shorter than the former 448pt/dp minimum. Compose now
  reports measured panel/top-bar/safe-area insets rather than just echoing caller values.
- The released popup support bounds many-floor lists to the registered shell band on all three
  targets, with scrolling instead of smaller floor targets and dismissal when the region disappears.
  React reveals the selected floor after portal measurement; native lists scroll to selection.
- This is **not full closure of SDK-UI-001/002**: full keyboard/safe-area/device coverage,
  live SDK placement and Figma/consumer adoption remain open.
- The web-only LanguageSwitcher now provides controlled selection, pending/error/retry states
  and a shell-bounded menu. Native apps intentionally follow device/app language without a
  button. Real SDK locale application and persistence remain host integration work.
- MapAttribution now supplies provider-neutral branding/credit presentation on web, iOS and
  Android. SDK metadata selection and wording remain adapter-owned, not a prerequisite for
  building the design-system component. MapInfoPanel and its responsive MapInfo host now
  follow on all three platforms. The real iOS QA host now adopts Info; web/Android live-host
  adoption and the exit composition remain.

## What the references actually show

Reference images supplied September 29:

| Screenshot filename                   | Visible evidence                                                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshot 2026-09-29 at 15.34.46.png | GF tile at lower right above zoom; search/categories at upper left; Exit Main Mall and info trigger at upper right; logo and attribution bottom-center. |
| Screenshot 2026-09-29 at 15.34.50.png | LG selection and upward availability indicator.                                                                                                         |
| Screenshot 2026-09-29 at 15.34.54.png | 1F selection and downward availability indicator.                                                                                                       |
| Screenshot 2026-09-29 at 15.34.56.png | Visible full-name hint: First floor.                                                                                                                    |
| Screenshot 2026-09-29 at 15.34.58.png | Expanded top-first floor column: 1F, GF, LG; selected outline; Ground floor hint.                                                                       |
| Screenshot 2026-09-29 at 15.35.12.png | Right-side information panel: introduction, FAQ, close, copyrights, legal links and version. Search remains visible at left.                            |
| Screenshot 2026-09-29 at 15.35.25.png | Enlarged Pointr logo and provider attribution.                                                                                                          |

Original files were supplied from the user's Desktop/Screenshots folder; they are not bundled
as repository assets. These images document the reference SDK, not proof of the current
Kozmos app's behavior. The language switcher is **not visible in this batch**: bottom-left
placement is a separate explicit user requirement. Static images do not establish click
behavior, keyboard support, mobile layout or licensing permission.

Preserve reference hierarchy and behavior using approved Kozmos tokens. Do not copy arbitrary
pixel measurements from scaled screenshots, draw substitute brand logos, or reinstate circular
controls through local CSS. Respect the user's earlier 16px control-radius direction through
the appropriate component token; this does not make every nested surface or map marker the
same radius.

## Current coverage: reuse versus implement

| Area                          | Present in released source                                                                                                                                        | Remaining work                                                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Map control button            | Controlled pressed state, disabled/loading, accessible state words, labelled/icon-only presentation, reveal-on-change behavior.                                   | Map each host action/mode to the right semantics; not every button is an on/off toggle.                                                                                  |
| MapControlsGroup              | Zoom, compass, location modes and step-free callbacks/labels.                                                                                                     | Fixed composition, not an arbitrary-children cluster. Adding language/info is not solved by passing children to it.                                                      |
| FloorSelector                 | Four variants, availability cues, full-name hints, default-off list counts, stale-ID preservation and shell-bounded scrolling; native source counterparts.        | Real SDK floor ordering/default selection, device/keyboard acceptance and consuming-host adoption. Closed-tile counts are intentionally absent.                          |
| MapOverlay / AdaptiveMapShell | Logical bottom corners, measured attribution, content-fitting panels, collision-aware floor menus and safe-area/layout callbacks across the three targets.        | Full native rectangle snapshots, physical keyboard/IME tests, custom overlay/status coexistence and renderer camera application.                                         |
| MapStatusPill                 | Exported, tested in-map status surface, tones, icon override and live-region policy.                                                                              | SDK status/event mapping and placement; do not rebuild it as a Toast.                                                                                                    |
| Language switcher             | Published web LanguageSwitcher: native names, controlled selection, pending/error/retry and bounded menu. Native has no language button by design.                | Actual host locale persistence, fallback and SDK/app synchronization; native runtime locale handling.                                                                    |
| Branding / credits            | Published MapAttribution with bundled Pointr logo, replaceable/hidden branding, ordered credits and centered measured shell placement; native source equivalents. | Approved host assets/copy, provider resolution/deduplication, custom overlay coexistence and actual renderer integration remain.                                         |
| Info trigger / panel          | MapInfoPanel / MapInfo are published for React, with corresponding SwiftUI and Compose source. The iOS Pointr QA host now replaces the disabled SDK Info control. | iPhone modal isolation and iPad SDK resize/POI/query retention passed live simulator tests. Web/Android live hosts and physical-device/route-specific acceptance remain. |
| Exit building                 | Button primitives and host building state.                                                                                                                        | Product-owned exit behavior, label, visibility and state reset/retention policy.                                                                                         |
| POI details                   | POIDetailPanel/Content, taxonomy-driven property handling, media, tags and MetaStrip.                                                                             | Real-data/empty-state and whole-screen validation. Internal attribute sections are not proof of a public generic AttributeSection.                                       |
| Opening hours / handles       | OpeningHours Storybook composition; handles inside existing sheet/shell components.                                                                               | Decide if a public reusable part is actually needed before extracting another component.                                                                                 |
| Wayfinding                    | RouteProgressRail, Itinerary, DirectionStep and ManoeuvreCard.                                                                                                    | Structured instruction parts/languages, step metrics and endpoint actions remain product gaps.                                                                           |
| Search / browse               | SearchBar, CategoryTile, BrowseCategoriesPanel and POI result components.                                                                                         | Result footer, scope/original-language/area contracts and active product gaps remain; existing components do not close every filter/carousel need.                       |
| Design/agent consumption      | Generated component API cards, examples, Code Connect and checks exist.                                                                                           | External artifact freshness, public documentation accuracy and actual native/Figma parity must be proven separately.                                                     |

Public source entry points:
[React exports](../packages/react/src/index.ts),
[shared contracts](../packages/product-contracts/src/index.ts),
[MapControlButton](../packages/react/src/components/MapControlButton/MapControlButton.tsx),
[MapControlsGroup](../packages/react/src/components/MapControlsGroup/MapControlsGroup.tsx),
[FloorSelector](../packages/react/src/components/FloorSelector/FloorSelector.tsx),
[MapStatusPill](../packages/react/src/components/MapStatusPill/MapStatusPill.tsx),
[opening-hours example](../apps/docs/stories/examples/OpeningHours.stories.tsx).

## Ownership: no SDK-specific behavior hidden inside UI primitives

| Layer                              | Owns                                                                                                                                                          | Must not silently own                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Kozmos primitives and compositions | Appearance, accessible semantics, controlled inputs/callbacks, layout measurement, reusable empty/loading states.                                             | SDK credentials, network clients, venue selection, localization data fetching, legal policy or business logic. |
| Product presentation contracts     | Stable floor/locale/info/attribution data, identity, explicit capabilities and normalized states where genuinely shared.                                      | Raw SDK objects, browser-only nodes in cross-platform models, or unsupported claims of platform parity.        |
| Host adapter                       | Available buildings/floors/locales, selection, live SDK callbacks, language application, route retention, provider credit metadata and product configuration. | Local CSS fixes for missing component APIs or guessing permitted brand/credit removal.                         |
| App shell                          | Placement, panel coordination, keyboard/safe areas, renderer viewport/camera occlusion, lifecycle and focus restoration.                                      | A second independent truth for selected floor, locale or SDK state.                                            |
| Product/design owner               | Approved assets/copy, white-label policy, legal link destinations, ambiguous behavior and acceptance criteria.                                                | Assuming a screenshot grants permission to hide attribution or copying a version/date forever.                 |

Keep default Pointr controls disabled **only where the custom experience covers their
responsibilities**. Do not use private SDK view traversal, hide unknown subviews, or blanket CSS
to erase controls. Provider attribution is a separate capability/policy question.

## SDK-UI-001: finish the existing level switcher

### Already implemented

The collapsible variant is not missing. It uses the map-control surface, opens a level column,
selects a floor and closes, supports disabled choices, and restores focus appropriately.
The open column can show result markers and the visitor's floor; the closed tile can show the
visitor-floor dot. The full level name is available as an accessible label.

### Confirmed gaps and important distinctions

- Availability chevrons, full-name hints and optional counts ship in React 0.7.0 and the
  corresponding SwiftUI/Compose source. Product visual approval and host adoption remain.
- The closed tile deliberately omits counts, as now confirmed by the user. GAP-070's historic
  closed-tile acceptance wording is superseded: keep counts only in lists, off by default.
  Host opt-in/data wiring and design/board adoption still need verification.
- The component preserves supplied order. Its contract expects top-first levels.
  On current main, [SDKMapScreen](../apps/PointrPlayground/Sources/App/SDKMapScreen.swift)
  consumes the top-first levels from [SDKFloorPolicy](../apps/PointrPlayground/Sources/App/SDKFloorPolicy.swift).
  User-floor/result-count wiring and real-device acceptance remain separate host requirements.
- [PR #160](https://github.com/vodoco/kozmos-design-system/pull/160) merged at
  `5792335ef8056749573e37b2b400dbaf4dee2dc7`; ordering/default-level and lifecycle source fixes
  are complete on main, not part of a new npm publication. Do not repeat the old ascending-order finding.
- The React popover is portaled. In registered AdaptiveMapShell bottom corners it uses the
  shell's internal bounded region, including horizontal displacement beside a long panel;
  standalone selectors remain viewport-bounded. There is no separate public FloorSelector
  collision-boundary prop. Verify real host containment rather than assuming every arbitrary
  MapOverlay sibling participates. Site GAP-95 retains its own consumer acceptance criterion.
- The compact-stepper's physical border classes are corrected in 0.7.0
  (product GAP-086 subissue); its logical separators are covered by the built-package browser check.
- Stale IDs remain host-owned. Preserve their raw label until the host supplies a valid selection;
  disable stepping in both directions, emit no automatic selection, and do not mark the first
  supplied floor as selected. An expanded list can still offer real floors for an explicit choice.

### Acceptance

- Derive stable floor IDs, labels, short labels and order from SDK metadata, not string sorting
  or assumptions that all buildings use consecutive numbers.
- Support basements, mezzanines, default floor, user floor differing from selected floor,
  zero/missing floors, one floor, disabled floors and building changes. Define whether a
  one-floor switcher is hidden or disabled; no empty enabled popup.
- Put the reference selector lower-right above zoom; do not squeeze the two into an unrelated
  horizontal row. Verify the live renderer and selected UI update together.
- Show full names on hover **and keyboard focus** without covering adjacent controls.
  The same information must be available on touch/assistive technology.
- Confirmed: one disclosure control with availability cues, not separate stepping buttons.
  Keep this contract identical across platforms; do not create nested interactive buttons.
- Keep top/middle/bottom cues correct, selected state distinguishable without color alone,
  localized/pluralized result counts and user-floor announcements accurate.
- Many-floor lists stay within the available map area and scroll with accessible focus.
  Test Escape, outside pointer/focus interaction, keyboard traversal and focus return.
- Keep API/appearance consistent on promised targets; require named native tests, not source
  existence alone.

## SDK-UI-002: map controls placement and collision policy

The layout must support all required positions together, not as isolated stories:

- Upper-left: search/browse panel.
- Upper-right: exit building and info.
- Lower-right: floor selector above zoom; additional supported location/accessibility controls.
- Lower-left: language.
- Bottom-center: brand and attribution, with MapStatusPill in a non-overlapping position.

The confirmed RTL policy mirrors these corners: language goes to bottom-right and floor/zoom
to bottom-left. Existing physical left/right APIs remain physical; logical start/end APIs mirror.

### Shell foundation: released support and remaining boundaries

| Target  | Current shell behavior                                                                                                                           | Required before claiming shared placement parity                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| React   | Legacy controls plus registered bottom-start/end, measured panel/top bar, conservative corner-region occlusion and opt-in camera padding.        | Per-corner rather than combined-envelope occlusions, credits/status coordination and consuming-host wiring.                       |
| SwiftUI | Registered bottom corners, legacy top/bottom controls, measured edge insets, wrapping/RTL and bounded short hosts.                               | Full rectangle snapshot parity is not implemented; native keyboard/device/assistive-technology acceptance and host wiring remain. |
| Compose | Registered bottom corners with wrapping/RTL, measured top-bar/panel/safe-area camera insets and short bounded hosts. Legacy top controls remain. | Full rectangle snapshot parity, IME/device/assistive-technology acceptance and host wiring remain.                                |

Inspect the implementations under `packages/{react,ios,android}` before changing the API;
the [adaptive-layout guide](adaptive-map-layout.md) distinguishes the React geometry contract
from native support. Do not add duplicate corner slots or infer full parity from their existence.
Avoid app-specific offsets, full-screen invisible hit surfaces and renderer-padding feedback loops.

The corner slots retain the legacy controls slot and resolve their region against measured
panel/top-bar/safe-area bounds. Both share a bottom-aligned row when their widths fit; otherwise
start stacks above end with the standard gap. A region that cannot fit vertically stays mounted
but hidden/non-interactive. Slot children must adapt to the supplied width. The shell does not
silently shrink controls, add an invisible full-screen interaction surface, or make arbitrary
oversized children responsive. Camera padding is off by default; opting in reserves the complete
bottom envelope. React exposes that envelope as one controls occlusion, not two exact rectangles.
Native targets expose edge insets only. Never feed resolved callback insets back into input insets.

Long floor lists in registered shell corners now consume the shell's bounded available band.
The internal context is not a new public host API. Standalone web selectors use Radix's viewport;
standalone iOS selectors observe the live window safe bounds; standalone Compose uses window
configuration until an explicit shell region is present. Standalone macOS retains its previous
unbounded presentation. Do not claim real keyboard/IME or macOS parity from the embedded tests. Live detent changes, real IME/device exclusions, native screen-reader/focus behavior,
credits/status coexistence and SDK event wiring still require their full integration matrix.
Portaled/native-window popups have an independent visibility and focus lifecycle: hiding the
anchor region does not itself guarantee that an already-open popup closes. The popup slice now coordinates dismissal when that region disappears. Web Escape/selection
returns focus to the tile, and losing the region uses the map as a focus fallback rather than a
hidden anchor. Native automatic dismissal does not request focus on the hidden tile. Device
VoiceOver/TalkBack and keyboard acceptance remain required; geometry tests alone do not certify them.

The built map-controls fixture also reproduces an actual collision at 360px map width:
in RTL, a wider compact-stepper stack and the opposite-corner probe leave the zoom control
overlapping that probe. Logical anchoring alone does not negotiate space between stacks.
The built `shell-corners` regression registers the same widths with the new shell slots and
checks non-overlap, logical sides, short-height hiding, camera opt-in, preserved web control state
and blank-region gesture pass-through. Independent MapOverlay siblings still do not negotiate
space: migrate opposite corners into shell slots; do not shrink probes or add fixture-only offsets. Existing selector tests verify
their stated geometry/semantics, not global non-overlap of every control.

Prefer extending the existing shell/overlay contract to registering ad-hoc absolute offsets in
each app. Preserve existing callers and distinguish the fixed MapControlsGroup from a possible
general-purpose cluster. If existing Stack/MapOverlay can express a case through public APIs,
compose them; add a new primitive only where reusable behavior is genuinely missing.

Acceptance:

- Independent slots/regions can coexist at 320–430px phone widths, landscape, tablet and wide
  desktop, including an embedded map smaller than the browser viewport.
- Panels, info panel, floor/language popup, on-screen keyboard and dynamic safe areas do not
  cover focused controls, required credits or route instructions.
- Geometry is measured relative to the map shell. Reconcile overlay collision insets with
  renderer camera occlusion; do not blindly pad an entire camera edge for every small control
  or double-count device safe areas.
- Pointer/touch events reach the map through empty overlay space; actual controls intercept
  them. Wheel/keyboard actions inside popups do not unexpectedly zoom/pan the map.
- Define panel coexistence: screenshots show search plus info simultaneously on desktop.
  On phone, define whether info replaces or overlays the sheet; save and restore prior state.
- Handle header/content spacing (GAP-085), automatic keyboard avoidance (GAP-084), and
  appropriate named map-controls navigation (GAP-101) in shared layout APIs.
- Keep focus order coherent with the visible layout, portal ownership intact in nested hosts,
  and mode/loading state understandable without animation.
- Test dark/high-contrast themes, 200% text zoom, reduced motion and RTL. Use Kozmos
  component states/tokens rather than app-specific shadows, radii or hidden overflow patches.

## SDK-UI-003: bottom-left language selector

The released web `LanguageSwitcher` composes the supported Select pattern, not a second
localization framework. Native iOS/Android deliberately have no language button and follow the
effective device/app locale. Native runtime locale change handling still belongs to each host.

Implemented web API: `languages` (unique BCP 47 `id`, native-name `label`, optional label
`direction` and `disabled`), committed `selectedLocale`, `onLocaleRequest`, `pending`, `error`,
optional `onRetry`, and overridable control/status/placeholder/retry labels. Placement uses
`controlsBottomStart`, which mirrors in RTL. The component never changes app/SDK locale itself.
See [LanguageSwitcher documentation](../packages/react/src/components/LanguageSwitcher/LanguageSwitcher.mdx).

Zero options or an already-selected sole enabled choice leave a visible disabled control. An
unknown selected ID is displayed verbatim and can recover by choosing an available option.
Pending retains the committed name and blocks further requests. Retry is host-owned. No flags,
browser storage, global direction changes or assumed SDK restart behavior are introduced.

Integration acceptance still required (the library does not certify SDK application):

- Match locale choices to actual tenant/content/SDK capabilities; no invented language list.
  Native [SDKSession](../apps/PointrPlayground/Sources/App/SDKSession.swift) currently uses
  device preference at setup, not an end-user switch.
- Host applies a change to UI strings, content/SDK locale and text direction consistently.
  Define fallback order and selection persistence. If applying it requires SDK restart/reload,
  document the effect and preserve supported venue, floor, route and search state.
- A slow or failed change cannot leave the label claiming a language the SDK has not accepted;
  expose progress/error and retry or restore the previous committed choice. Avoid stale
  asynchronous responses reverting a newer choice.
- Use native language names with correct language/direction metadata; support mixed-script
  labels, long labels, selected-state announcement, keyboard/typeahead and focus return.
- Hide or simplify sensibly when only one language is available; define the no-language and
  no-translation fallback. Place its popup within the shell, away from attribution and sheets.
- Localized values should not turn default English labels into an accidental permanent API.
  Keep explicit caller overrides for accessible labels.

## SDK-UI-004: branding and provider attribution

Treat **branding visibility** and **required attribution** as independent settings.

Published for React, with SwiftUI and Compose source in the same release: MapAttribution with ordered credits
(unique id, plain-text label, optional absolute HTTP(S) href), optional approved brand content,
independent showBrand and a localized region label. Unsafe links remain plain text.
The official Pointr logo is bundled locally by default, with a replacement brand slot
and showBrand=false for hiding branding only. No provider copy, years or SDK fetches
are built into the component.
The default map appearance uses transparent backing with a tokenized grey text/white
halo pair on all three platforms. The surface appearance keeps the opaque themed
treatment. Credit underlines, single-line scrolling and accessible labels/actions are preserved.
See [component documentation](../packages/react/src/components/MapAttribution/MapAttribution.mdx).

The host/SDK supplies provider data and applicable visibility rules; Kozmos renders them.
The examined Web SDK uses metadata's pointr:mapProviderName to choose wording. Source variants
such as osm-2 are adapter details, not component API. This does not block design-system work.
Determine whether the renderer already owns/updates entries before introducing another source
of truth. AdaptiveMapShell now owns an optional measured attribution slot on all three
platforms. Credits are centered across the full map, independent of side panels, with
equal reservations for the larger bottom corner. Bottom sheets retain credits above them.
Corners retain equal 16-unit bottom/side insets; credits do not raise them. When the centered
slot is narrower than 128 units, only credits move above corners, preserving room for the
default brand. Tall side panels reserve
the footer band instead of covering attribution.
Credits use one horizontally scrollable line (10px scalable web; 11pt/sp scalable native),
and a capped sheet still scrolls. With less room than the whole attribution, the brand gives
way and the credits keep their full height, never clipped into a scroll region (GAP-135). Web reports attribution occlusions; native reports edge
insets. Custom overlays/status messages, actual SDK camera application, custom brand assets,
real SDK wiring and device acceptance remain integration work, not claimed complete here.

Acceptance:

- Non-white-label mode shows the approved Pointr logo, with credits legible beneath or beside
  it as the layout allows. Do not stretch, redraw or generate a substitute logo.
- White-label mode can suppress/replace branding only according to approved configuration.
  It must **not automatically suppress provider/data credits**. Obtain the owner's approved
  policy rather than interpreting screenshot text as licensing advice.
- Deduplicate provider entries when SDK and host both contribute credits; update them when
  venue/basemap changes. Do not hardcode “2026”, “10.11.0”, or the screenshot's provider list.
- Respect link safety, accessible names, keyboard focus and text contrast over changing maps.
  Any outline/backing needed for readability belongs to a supported tokenized presentation.
- On narrow screens, horizontal scrolling and keyboard focus must keep every credit reachable;
  do not hide it behind a sheet or rely only on the information panel as a substitute.
- Credits and brand remain reachable and readable while language/floor controls, status
  messages, route cards and panels are present. Confirm product policy for fullscreen,
  loading, offline and error states.
- Test branded and white-label configurations separately, including no optional brand asset.
  Missing required provider metadata is an explicit integration/configuration error, not an
  excuse to fabricate attribution.

## SDK-UI-005: information button and panel

**Released library implementation:** MapInfoPanel / KozmosMapInfoPanel and the MapInfo /
KozmosMapInfo responsive hosts now exist on React, SwiftUI and Compose. The web map-browse
example includes the Info trigger and retains its browse/POI state. The
[iOS Pointr QA app](../apps/PointrPlayground/README.md) now uses the same native host against
live Design-QA data. Simulator UI tests verify compact modal isolation, wide SDK renderer
width reduction by 384 points, FAQ disclosure, selected POI retention and retained search.
The wide running simulator was also visually checked. This is not web/Android SDK adoption:
their existing playgrounds are a mock-map demo and a task-list demo respectively.

Confirmed presentation: desktop logical-end, non-modal pane; compact/mobile full-screen,
not a right-side slide-in. The live Design-QA Web SDK was inspected at desktop and 390×844.
The library reserves a 384-unit pane at widths >=1104 to keep controls unobscured rather than
covering them. Smaller hosts use the full screen. The map remains mounted, and its existing
resize/layout adapter must respond to the new viewport. See
[MapInfoPanel documentation](../packages/react/src/components/MapInfoPanel/MapInfoPanel.mdx)
for content schemas, labels, placement ownership, native usage and tests.

Reuse MapControlButton with the existing info icon, then compose the panel from Kozmos parts.
Do not rebuild an icon-button or accordion locally.

Implemented presentation contract (platform-local types, not product-contracts exports):
tenant/product title and introduction; approved optional logo; FAQ items with stable IDs;
support/contact destination; copyright/provider entries; Terms/Privacy links; displayed product
and SDK versions with explicit labels. Prefer structured text/content over untrusted raw HTML.

Acceptance:

- One understandable localized trigger opens a labelled panel; expanded/controls semantics
  reflect actual state. Button visibility follows capability/configuration.
- Desktop can show the right-side panel without losing the left search state, as referenced.
  Mobile presentation follows the agreed panel-coordination policy, not arbitrary fixed width.
- Close, Escape and back behavior are intentional. Move focus into the panel appropriately,
  restore it to the trigger on close, and prevent focus from moving under covered content.
  A non-modal desktop panel must not trap the entire page; a modal mobile view must.
- FAQ disclosure is keyboard-operable, headings are structured and long content scrolls.
  Bottom legal/version content must stay reachable in short viewports and at large text sizes.
- Tenant copy, FAQs and legal URLs are configurable, localized and safely rendered. The
  screenshot's sales-demo copy and privacy claims are examples, not production defaults.
- Host determines valid link destinations and which version is shown; display real metadata
  rather than leaking diagnostics, credentials, installation identifiers or a stale constant.
- Verify pane opening/closing changes renderer layout/camera padding without reinitializing
  the map or losing route, selected POI, floor, query or language.
- Native custom info replacement is required before considering the currently disabled SDK
  info control's user-facing responsibility covered.

The QA presenter reads actual app/SDK bundle versions and the loaded building name, uses
explicitly internal English copy, and does not invent legal URLs or provider claims. Existing
SDK-owned map attribution stays untouched. Consumer-specific copy still needs approval and
localization. Integration also exposed and fixed keyboard height being counted twice as
SwiftUI shell bottom padding; the shell still avoids the keyboard.

Remaining acceptance is other consuming-app adoption, route/floor-specific preservation,
physical-device VoiceOver/TalkBack and design mapping. Library release approval is complete,
not an approval of each consuming product. Do not close this
requirement solely because the component stories render or the package compiles.

Wide search/POI panel follow-up: all three library shells now fit short content
and cap long content above the registered bottom-control band. Controls stay at
the outer map corners, mirrored in RTL, rather than shifting inward beside the
panel. Popups use a bounded region below short panels or beside long ones. The
iOS QA app uses equal 16-point top/side search padding. Bottom-sheet detents and
the separate Info pane retain their existing behavior.

## SDK-UI-006: exit building and other map actions

The screenshot also exposes Exit Main Mall. A styled button alone is not the feature.

- Host supplies the building-specific localized label, visibility and exit callback.
- Agree whether exiting clears the route/POI/search or retains them, and which camera and
  floor state are restored. Confirm a destructive/route-cancelling choice with product design.
- Keep indoor-only controls consistent when no building is selected; do not leave stale
  floors/POIs while the map shows outdoor context.
- Test exit during loading, route preview/navigation, an open selector and an info panel;
  settle focus and stale SDK callbacks after a transition.
- Reuse existing zoom/compass/location/step-free components and validate their SDK wiring.
  They are not “missing buttons” merely because they are absent in one screenshot.
- 2D/3D and Mark My Car appeared in the older inventory but are not established acceptance
  requirements by this screenshot batch. Confirm current product scope before adding them.

## Other gaps to keep visible while implementing the screen

Do not let the new chrome conceal already-recorded behavior gaps:

- **Product contracts:** GAP-021's optional language-not-listed field and localized disclosure
  are released in 0.8.0 (#187); real staff-query evidence and host grouping/ranking remain.
  Still-open contracts include GAP-028 result booking, GAP-044 authored
  name, GAP-046 area, GAP-047 travel breakdown and GAP-065 native/shared grouping. GAP-092's
  result-list footer is optional backlog: the current Search with AI design uses the header.
- **Wayfinding:** GAP-093/GAP-096 structured instruction parts and foreign-language landmarks
  are released in 0.8.0 (#188); SDK data adoption and physical speech acceptance remain.
  GAP-097 step metrics and GAP-104 endpoint actions remain open. React GAP-094/GAP-100 are already fixed.
- **Accessibility/layout:** P01, released in 0.8.0, raises result actions to a 44px/pt/dp minimum
  (GAP-056), retaining larger native targets and growth for large text. Actual
  keyboard/device acceptance remains. Wide shell content fitting and the
  iOS QA header's equal top/side padding are implemented, not missing components.
  Compact-stepper RTL separators are fixed in 0.7.0. Do not
  equate the 44px product target with every WCAG minimum-target rule.
- **Icons:** named chart/microphone/copy/star artwork exists, but named exports and the string
  registry are different APIs. GAP-105 requires registry availability, not new artwork.
- **POI regression requirements:** one metadata row with at most three populated items,
  adaptive one/two/three-item alignment, centered rating, horizontally scrollable actions,
  taxonomy-defined property/value icon-versus-text rules, correct empty/missing data, and
  consistent control shapes. Verify with real POIs; do not mark them closed from static cards.
- **Developer/agent adoption:** generated API cards and typed examples now exist; external
  artifact upload/default configuration and new-session use remain independent checks.
- **Platform claims:** React npm publication does not publish native packages or make the
  private Vue harness a full Vue design system. Publish supported-target guidance honestly.

## Product-gap implementation programme

This is a proposed execution plan for the reconciled 121-row product register, not permission
to implement every imported suggestion or to publish. The 63 source-backlog rows are assigned
exactly once below: 55 to work packages (some conditional or adoption-only), eight to explicit
dispositions. The 58 source-reported React closures stay in the register and in regression
coverage; they are not 58 new implementation tasks or proof of all-target completion.

### Scope and invariants

- Build on current main, not the published 0.8.0 source alone. First submit the documentation
  reconciliation through its own PR; preserve the existing local edits. Refresh each subsequent
  branch normally against main and inspect other actors' changes before writing.
- Preserve public behavior unless a change is explicitly reviewed. Prefer additive contracts
  and opt-in presentation variants; document migration when an approved default changes.
  Keep old string instructions, absent optional fields and existing native call sites working.
- Implement shared presentation behavior on React, SwiftUI and Compose in the same work package.
  Equivalent outcomes do not require identical DOM/native APIs. Missing native components need
  an implementation plan, not a checkbox saying an equivalent prop exists. Native language
  buttons remain intentionally absent: device/app language is the agreed policy.
- The host owns ranking, result indices, floor/venue data, routing state, clustering algorithms,
  provider attribution policy and SDK rendering. The DS owns presentation contracts, reusable
  components, semantics and layout. Do not move host behavior into a component to close a row.
- Preserve approved POI behavior: at most three populated metadata items, adaptive centering,
  horizontally scrolling actions, correct absent values and taxonomy-driven presentation.
  Preserve logical corner placement, full-map-centered attribution, safe-area handling and
  retained map/POI/query state while panels open and close.
- No CSS overrides against private component structure, blanket padding patches, arbitrary
  clipping, guessed SDK subview hiding, weakened assertions, tolerance increases or new
  baselines used merely to hide a regression.

### Work packages and order

Wave 1 is the recommended first milestone. Wave 2 is not a reason to hold proven Wave 1 fixes
indefinitely. Wave 3 contains conditional product/platform work, not an automatic commitment.
Each package may need several small PRs; contract and platform changes must reach a verified
integration candidate together before claiming that package complete.

| Package                                          | Primary gaps                                                                             | Implementation boundary                                                                                                                                                                                                                                                              | Dependencies and decisive checks                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P01 — accessible regions and SDK action targets  | GAP-101, GAP-109, GAP-056                                                                | Name the shell control region and keep the opened manoeuvre content discoverable; reconcile 44px result actions on all applicable platforms. Do not invent native ARIA roles.                                                                                                        | **Wave 1, first.** Reproduce arbitrary itinerary children, not only the already named Itinerary. Verify no duplicate names, keyboard scroll access, open/close focus restoration and disabled action behavior. Check rendered action targets; 40px is a product mismatch, not automatically a WCAG failure.                                                        |
| P02 — shell-owned spacing                        | GAP-085, GAP-114                                                                         | Specify header-to-content spacing and gripless-sheet top insets. Distinguish shell padding from hosted parts' own padding; update layout measurement and native inset propagation together.                                                                                          | **Wave 1, after P01 baseline.** Header/no-header × grip/no-grip × side/bottom × short/long content. Preserve a 16px content gap where requested, handle clearance, content-fitting height, detents and collision reporting; no doubled POI padding. P07 adopts the same contract for assistant headers.                                                            |
| P03 — critical language contracts                | GAP-093, GAP-096, GAP-021                                                                | Design backward-compatible instruction text parts with secondary emphasis/language and a separate staff-language match representation. Use two cohesive sub-PRs if needed; UI-language fallback must not imply staff language availability.                                          | **Wave 1.** Establish shared fixtures first. Preserve exact German/Japanese/Arabic ordering and legacy strings; do not flatten away part-language metadata in accessible output. Test native speech behavior and unknown versus explicitly unlisted language data.                                                                                                 |
| P04 — numbered result and marker enhancement     | GAP-119, GAP-120                                                                         | Add combined number/Featured presentation, approved tab geometry and an explicit SDK-style marker appearance; retain existing numbering and featured/logo support.                                                                                                                   | **Wave 1, after appearance decision below.** Test Featured in first/middle/last position, grouped rows, large indices, translated labels, RTL, themes, selected/off-floor states, keyboard activation and card-pin identity. No component-generated rank or hard-coded provider color.                                                                             |
| P05 — richer result data and actions             | GAP-028, GAP-031, GAP-044, GAP-046, GAP-047, GAP-065                                     | Independently specify result booking/custom capabilities, name wrapping, authored name/language, area identity, travel breakdown and cross-platform grouping. Do not force all six into one PR.                                                                                      | **Wave 2; build on P03/P04.** Fixtures cover missing/partial data and existing callers. Group identity and representative selection come from data, not localized labels. Only actionable capabilities produce enabled actions; validate time units/totals without fabricating values.                                                                             |
| P06 — route presentation                         | GAP-097, GAP-103, GAP-104, GAP-110, GAP-111, GAP-112, GAP-113                            | Three slices: approved direction glyphs/types; step metrics/rail waypoints/endpoint actions; hosted summary and route-preview composition without nested card chrome.                                                                                                                | **Wave 2; after P02/P03 and glyph approval.** Preserve current direction values, route focus and controlled host state. Test multi-floor transitions, enter/exit, long translated instructions, preview → details → back, start/end and previous/next. Coordinate P11 semantic map colors without making all route UI depend on a map-style migration.             |
| P07 — Notice and assistant family                | GAP-059, GAP-063, GAP-064, GAP-115, GAP-118, GAP-121                                     | First inventory missing native assistant primitives. Build native Notice and the minimal coherent assistant family alongside React improvements: icon omission/alignment, progress composition, actionable replies, latest-answer reading position and hosted header/banner spacing. | **Wave 2; after P02, P03 and relevant P05 result contracts.** This is a substantial parity track, not six padding edits. Test first-open focus, close return, streaming, user scroll preservation, long answers, reduced motion, download/error/retry, offline and timeout. Optional replies are actions, not toggle chips; progress must not flood announcements. |
| P08 — search, language and keyboard resilience   | GAP-010, GAP-053, GAP-084                                                                | Resolve CJK wrapping from real fixtures; add a supported recent-search composition and keyboard/list semantics; design web keyboard avoidance with explicit ownership and fallback.                                                                                                  | **Wave 2; after P02.** Do not break every long word or shrink text arbitrarily. Recent-search removal needs focus continuity, not nested interactive options. Test mobile Safari/Android browser IME, pinch zoom, rotation, embedded maps and already-resized viewports; avoid double subtraction of keyboard/safe-area insets.                                    |
| P09 — reusable layout and content utilities      | GAP-035, GAP-058, GAP-098, GAP-105, GAP-106, GAP-107, GAP-116                            | Add approved token-backed title sizing, child sizing and block insets; numeric units, existing icon registry entries, persona marks and below-name tree metadata. Keep each independent primitive reviewable.                                                                        | **Wave 3, only with an active consumer fixture.** Preserve existing Container inline inset semantics and native call compatibility. Validate narrow/RTL/large-text layouts, unit announcements and persona identification without color alone. Reuse Copy01/Star01 artwork. Source-listed Vue-only requests do not imply a public Vue package.                     |
| P10 — dashboard-specific density and composition | GAP-014, GAP-036, GAP-037, GAP-039, GAP-040, GAP-041, GAP-042, GAP-050, GAP-051, GAP-052 | Confirm the real Dashboard delivery target, then group active needs into form density, settings/page/publish compositions and table/navigation semantics. Reproduce the date-icon issue before choosing a fix.                                                                       | **Conditional Wave 3, gated by GAP-016/platform ownership.** Several source boards were removed. Do not build every dormant suggestion. Dense pointer styles must not shrink SDK touch defaults. Validate the actual supported Vue/React integration and do not claim native Vue support from a React wrapper.                                                     |
| P11 — map-specific visual vocabulary             | GAP-073, GAP-075, GAP-095                                                                | Agree DS versus renderer ownership for indoor/route/landmark tokens and cluster-marker presentation. Implement approved light/dark/themed states and an adapter example, not a second map engine.                                                                                    | **Conditional Wave 3.** Needs SDK/design owner input and P04 marker semantics. Verify default/current/destination differentiation and cluster count names. The host clusters, filters by floor and zooms; real SDK styles must adopt approved values before claiming visual parity.                                                                                |
| P12 — external design-system adoption            | GAP-089, GAP-090, GAP-091                                                                | Reuse the merged docs generator. Refresh the actual Claude Design bundle, validate fresh-session real-component use, and have an organization owner configure its default system.                                                                                                    | **Can start after baseline and repeat for changed APIs.** A compiled example is not a successful external install. Record artifact/version and named board evidence; no organization-setting changes without approval. Each affected Figma component is updated through its existing pipeline, not recreated with new identities.                                  |

### Explicit dispositions

Every source-backlog row below is accounted for, but is not an unconditional coding task.

| Gaps    | Disposition and recommendation                                                                                                                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-086 | React divider fix already shipped. Retain its RTL regression and record any remaining consumer/native acceptance; do not reimplement it.                                                                                                                  |
| GAP-016 | Owner/platform decision: whether to fund a public native Vue library, continue the private wrapper or use a different supported integration. No publication implied. Blocks P10 commitment, not Waves 1–2.                                                |
| GAP-038 | No active chart criterion. Defer until a real dashboard requirement defines chart types, accessible table fallback and target framework.                                                                                                                  |
| GAP-043 | Resolve search-microphone requirement versus the agreed keyboard-dictation policy. Preserve current SearchBar behavior meanwhile; assistant voice conversation is a different capability.                                                                 |
| GAP-045 | Prefer OS-owned device chrome. Close as not applicable only after product-owner confirmation; keep prototype framing separate from runtime components.                                                                                                    |
| GAP-092 | Current Search with AI uses a header Notice. Defer footer API until an active use case needs it; P07 handles the active Notice problem.                                                                                                                   |
| GAP-099 | Current route-update design uses MapStatusPill. Defer Toast placement extension until a consumer still needs it; test status/sheet coexistence in integration.                                                                                            |
| GAP-117 | Recommend preserving the existing button default and, if every location-mode change should reveal, adding an explicit mode-change trigger at the group level. Confirm this against decision 40; otherwise correct the wrapper's over-broad documentation. |

### Decisions before their affected packages

These do not block P01 or initial reproduction work in P02:

1. **Numbered cards:** the owner approved the SDK presentation as the new default, with
   migration notes and an explicit legacy appearance. This includes numbered Featured tabs,
   neutral selection, the approved hover adjustment and expandable native groups pulled
   forward from P05. Numbering still uses host-supplied indices and is explicitly enabled.
2. **Marker styling:** approve semantic selected/resting colors and geometry in both themes,
   including white-label behavior. Do not assume the screenshot's green is universal branding.
3. **Location-mode reveal:** confirm GAP-117's behavior choice above; same visible words can still
   describe a different mode, but the current test explicitly preserves collapsed behavior.
4. **Navigation artwork/map tokens:** identify approved glyphs and the renderer/style owner.
   Dedicated UI glyphs and SDK sprites are different delivery artifacts.
5. **Conditional Dashboard and host work:** confirm Vue direction, access to real web/Android
   SDK hosts, external artifact/Figma owners and exit-building route/selection policy.

### Test and self-review gate for every package

1. **Baseline:** pin current main and affected package/toolchain versions; identify component,
   shared contract/token, native and real consumer impacts. Record acceptance fixtures and
   supported states before implementation. Do not count a stale worktree or dist as current.
2. **Reproduce:** add the narrowest meaningful failing regression against unfixed behavior.
   For enhancements, the new-contract fixture should fail until implemented. Geometry needs a
   built-package browser or hosted native view, not a class-name assertion alone.
3. **Implement:** shared contracts/fixtures first, then all applicable platforms and adapters.
   Rebuild affected workspace packages before testing consumers. Preserve old signatures and
   defaults unless the migration decision explicitly changes them.
4. **Self-check:** run changed and dependent tests; inspect both themes, LTR/RTL, 320px/narrow
   embedded map, phone/tablet/desktop, long text, empty/loading/error and controlled-state
   transitions. Include large text, reduced motion, keyboard/focus and accessibility checks.
   Preserve platform-appropriate touch targets; a 44px web requirement must not shrink an
   existing larger native target. For native changes read back executed simulator/JUnit test
   names, not just exit codes.
5. **Review:** inspect the diff and real consuming composition. Web visual baselines use the
   pinned Docker renderer; native references use the established renderer. Never bless a
   screenshot difference before explaining it. Verify old result/floor/Info flows still work.
6. **Document:** update public JSDoc/MDX, Storybook states, native guidance, migration text,
   product-register reconciliation and Figma mapping requirements. Build React dependencies,
   regenerate API cards with `pnpm skills:build`, then run `pnpm skills:check` when APIs/docs
   change. Add a changeset for shipped output; no hand-edited generated artifacts.
7. **Merge readiness:** after hook formatting, verify all 19 required checks on the exact
   up-to-date PR head, plus selected Site/visual/bundle/browser workflows. No bypass or blind
   rerun. After merge verify exact-main CI and relevant deployment before continuing merges.
   Focused local suites keep iteration fast; they do not replace required gates.
8. **Accept:** record implemented, locally checked, CI-verified, released and consumer-adopted
   separately. Physical VoiceOver/TalkBack, real SDK adapters and external Figma/artifact use
   stay pending without their own evidence. Unexpected scope expansion pauses that package
   for a decision rather than spreading fixes into unrelated work.

### Findings to carry into implementation

- P01 replaces the prior open-card expectation with a named ManoeuvreCard region for arbitrary
  child content. SwiftUI and Compose keep their outer names too. Regression tests preserve
  independent child actions and focus/scroll behavior; physical screen-reader speech/order
  and real product boards remain separate acceptance.
- P01 names both the legacy shell controls and the newer bottom corners, with translated
  labels and hidden/out-of-room checks. FloorSelector's trigger stays in the corner landmark;
  its portaled popup is a separately named dialog connected by `aria-controls`, not a DOM
  child of that landmark. Custom consumer portals still own their accessibility lifecycle.
- P01 changes the native result components' own action implementations, not just the generic
  Button: SwiftUI minimum dimensions are inside the padded Button label, and Compose keeps
  the platform's larger interactive-target policy. Named tests measure targets, large text,
  disabled state and callbacks, including taps in the padded SwiftUI label. Preserve these
  checks through integration; source implementation is not device or external Figma adoption.
- Reconcile the implementation's adjacent semantics during each batch: P03 now uses logical
  `text-start` for the React manoeuvre instruction; the native shell handle's English strings
  remain a separate inspection lead, not newly allocated product GAP IDs
  or silently authorized broad rewrites. Reproduce and link them to existing RTL/localization
  requirements; coordinate additional scope rather than declaring every historical closure global.
- A work-package accounting check proves no source row was dropped. It does not prove all
  behaviors were audited. Keep source-confirmed limitations, runtime reproductions and actual
  consumer acceptance separate, including when an existing test codifies outdated behavior.

### First delivery and release boundaries

The documentation baseline and **P01–P03** source increments are merged. Complete the
acceptance gates below without repeating their implementation or calling them published.
P04 result-card appearance and the native grouping slice of P05 are now owner-approved for
implementation across React, SwiftUI and Compose. This does not authorize publication or
the remaining P05 data/action contracts. Marker sprites remain a separate asset handoff:
the owner manages their SDK style integration. Do not promise
a date for the larger native assistant or Dashboard tracks before inventory and failing
fixtures establish their actual size.

Implementation work and release preparation are separate approvals. No version number is
reserved by this plan. When a release is requested, aggregate reviewed changesets, prepare
the separate version PR and validate the exact version-merge main SHA, package artifacts and
native execution under [the release process](release-process.md). Publication remains behind
the owner's protected approval. Post-publish verification uses the actual installed artifacts,
plus deployed website/Storybook and updated product-board evidence; do not republish old bytes
or mark every target done because npm succeeded.

Full-suite reruns are not required after each prose edit or repeated review of an unchanged
artifact. Follow [the maintenance policy](design-system-maintenance.md) for affected local
tests, shared-dependency impact, required PR gates and complete release-candidate checks.

## P02/P03 acceptance checklist

Keep source completion, SDK adoption and human acceptance as separate gates. The source
increments are released in 0.8.0; neither a green structural check nor a demo is
evidence of adoption in every consuming app.

| Gate                          | Verified scope                                                                                                                                                                                                                               | Remaining evidence                                                                                                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared library behavior       | P02 #186 and P03 #187/#188 implement React, SwiftUI and Compose together; exact-main CI and selected deployments passed. Live structured-instruction stories preserve language markup and interaction behavior.                              | Released in npm 0.8.0 ([release evidence](release-process.md#080)); host, device and design acceptance remain.                                                                                                                                 |
| Real iOS shell spacing        | The QA app consumes `kozmosPanelInsetTop` and preserves `kozmosPanelClearanceTop`. `PanelTopPaddingTests.testCustomRowsConsumeShellInsetAndKeepHandleClearance` covers four inset cases in LTR and RTL; P02 recorded live phone/iPad checks. | Other hosts and product screens must remove obsolete spacing workarounds and verify their own geometry.                                                                                                                                        |
| Real iOS instruction data     | `SDKRoute.Step.message` remains a string; `SDKMapScreen` passes it to ManoeuvreCard and Itinerary. Legacy calls remain supported.                                                                                                            | Obtain authoritative ordered parts, secondary roles and name-language metadata from the SDK/content owner, then adapt and test them. Do not guess roles or language by splitting a localized sentence.                                         |
| Real iOS staff-language data  | The QA result initializers omit `languageNotListed`. This is unknown, not proof that a language is listed or unlisted.                                                                                                                       | A staff-language query and explicit match evidence must drive disclosure and any grouping/ranking. Device/UI locale is not that evidence.                                                                                                      |
| Real web/Android SDK hosts    | The web playground is a mock-map component demo; Android is a task-list demo.                                                                                                                                                                | Identify or build separately scoped live SDK hosts before claiming end-to-end parity.                                                                                                                                                          |
| Physical assistive technology | Automated tests cover inline language metadata, order and independent actions.                                                                                                                                                               | Human VoiceOver/TalkBack pronunciation, focus and large-text acceptance on actual devices; simulator metadata is not speech evidence.                                                                                                          |
| External design adoption      | The repository importer contains DirectionStep, Itinerary, ManoeuvreCard and shell painters, but their current examples do not demonstrate P03 inline qualifiers/language ranges or the P02 header/grip spacing matrix.                      | Read the current product boards/library and compare the criteria below. Local painter/contract checks do not prove the external file is current. Preserve stable node IDs through importer Update when a separately approved change is needed. |

### Physical-device procedure

1. Record the build/commit, device and OS, app locale, screen reader and installed voices.
   Use German, Japanese and Arabic examples containing English landmark/building names,
   plus a legacy plain-string instruction. Do not substitute synthetic structured fixtures
   for a claim about real SDK data; label which is under test.
2. Read DirectionStep, ManoeuvreCard and collapsed/expanded Itinerary. Confirm every part is
   spoken once in caller order, qualifier text is retained and marked names use the expected
   available voice. Record missing-voice fallback separately from lost language metadata.
3. Navigate by screen-reader gestures and external keyboard where supported. Check that
   controls remain independently actionable, expansion preserves focus, closing returns it,
   and RTL does not reverse sentence content or create duplicate announcements.
4. Enable larger text and exercise gripless/fitted, handled and header-bearing shells on
   phone and landscape tablet. Check content is reachable without clipping, shell-owned
   spacing is not doubled, and search/POI transitions preserve usable focus.
5. Exercise explicit true, false and absent staff-language evidence. Only true should show
   the localized disclosure; changing the UI locale alone must not change match evidence.
6. Record pass/fail and reproduction steps by named scenario. Do not mark this gate complete
   from an automated accessibility-tree assertion or a screenshot alone.

### Product-board and host procedure

- For GAP-085/114, compare fixed-header and gripless examples in compact/wide layouts,
  LTR/RTL and large text. Verify the 16-unit shell inset/gap and remove the board's obsolete
  `data-gap` spacer only after the consuming composition uses the new implementation.
- For GAP-093/096, compare secondary qualifiers at regular weight and the same font size,
  caller-owned word order/punctuation and readable surface-aware contrast. A Figma text node
  cannot by itself certify runtime language markup or speech.
- For GAP-021, compare the disclosure against real match data and the requested staff
  language, including unknown data. Keep product grouping/ranking separate from the card's flag.
- Record the external file/node revision and consuming build used for comparison. Do not
  infer that an external board changed just because repository code or API cards changed.

## SDK implementation batches and remaining acceptance

| Batch                            | Deliverable                                                                                                                                                                                       | Dependencies / acceptance                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 0 — decisions and inventory      | Target sync, RTL, floor cues and count policy confirmed above; settle branding/credit source, info content owner and exit behavior. Reuse merged PR #160; do not duplicate its native host fixes. | No speculative public API or duplicate component.                                                 |
| 1 — floor and shell foundation   | Library delivered in 0.7.0 with native source and map-browse stories. Adopt supported slots and verify each real host.                                                                            | SDK-UI-001 / SDK-UI-002; regression tests for existing shell/selector consumers.                  |
| 2 — language and credits         | Library delivered in 0.7.0 (language web-only). Real SDK locale/provider adapters and approved consumer content remain.                                                                           | Stable slots; approved assets and provider metadata policy; SDK-UI-003 / SDK-UI-004.              |
| 3 — info and exit                | Info presentation shipped; iOS QA Info integration verified in simulator. Exit policy/composition and other real hosts remain.                                                                    | SDK-UI-005 / SDK-UI-006; focus/occlusion tests.                                                   |
| 4 — real SDK integration         | Connect controls to real floor/language/venue/status data and lifecycle; replace corresponding default UI through documented configuration.                                                       | Mock stories are not the only proof; verify real SDK events, unavailable data and error recovery. |
| 5 — design and consumer adoption | Native parity belongs to every preceding batch; finish Figma via existing pipeline, Code Connect, generated cards and product-board adoption.                                                     | Named device tests and readback, consumer examples, visual checks, external artifact adoption.    |

Use reviewable PRs with explicit acceptance scope. Public runtime/contracts changes need
changesets and compatibility checks. Documentation-only reconciliation does not need a version
bump. No new package version, merge or publication is authorized by this planning document.
Keep unrelated security/release maintenance separate from UI implementation.

## Definition of done and validation matrix

### Prioritized follow-up and where to change it

| Priority | Work and entry point                                                                                                                                                                                | Completion evidence / remaining work                                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Newly reconciled product requirements: GAP-109/101 accessibility, GAP-085/114/121 spacing, GAP-093/096 instruction contracts, GAP-119/120 numbered cards/pins.                                      | Follow the [product register's queue](product-design-gap-register.md#implementation-queue-after-reconciliation). Reproduce first; implement shared enhancements in sync, with explicit native coverage and consumer acceptance. |
| 2        | Real web/Android SDK hosts; use `apps/docs/stories/examples/MapBrowseFlow.tsx` as a presentation recipe, not a real SDK adapter.                                                                    | Real floor/locale/provider/status events, persistence, race/failure handling and camera/layout changes; no duplicate default/custom controls or attribution.                                                                    |
| 3        | External documentation/design adoption: repo work in [#166](https://github.com/vodoco/kozmos-design-system/pull/166) and [#168](https://github.com/vodoco/kozmos-design-system/pull/168) is merged. | Generated full APIs, compiling examples and replacement introductions are present on main. Refresh the external Claude Design bundle; prove new-session use and Figma/feature-board adoption independently.                     |
| 4        | iOS host acceptance: [#160](https://github.com/vodoco/kozmos-design-system/pull/160), #164 and #180 are merged.                                                                                     | Reuse existing floor-policy, lifecycle and interaction fixes. Simulator evidence is recorded by maintenance; physical AT, all route/floor preservation combinations and other real SDK hosts remain open.                       |
| 5        | Exit-building composition and compatibility maintenance.                                                                                                                                            | Confirm exit route/selection policy. Firefox 146+ policy/tests/docs in #178 are merged but not newly published; whole-library minimum-engine and embedded-WebView certification remain separate.                                |

The source API cards are maintained at `docs/claude-design/components/`; change their source
MDX/JSDoc and run `pnpm skills:build`, never edit generated output. The former placeholder
introduction backlog was addressed by merged #166/#168; do not re-list it as untouched work.
That does not prove the external artifact was uploaded or adopted. Follow the complete target
matrix below before closing a product requirement.

Keep separate maintenance risks visible: the Storybook dev-server fix in #174 does not
resolve the private Vue playground advisories. Dependabot update jobs also failed on the
release commit; the failure cause and remediation need separate investigation. Neither is
a failed release/main CI run, and neither should be labelled fixed by this documentation pass.

### Implementation checks

| Dimension            | Minimum acceptance                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data                 | Zero/one/many floors and locales; invalid/stale selected IDs; long names; basements; mixed-script content; venue change; absent optional copy/assets; provider updates.                                                |
| State                | Initial loading, loaded, failed/retry, offline, no building, selected POI, route preview/navigation, switching language/floor, SDK stop/restart and late callbacks.                                                    |
| Layout               | Phone narrow/wide, landscape, tablet, desktop, short viewport, embedded shell; open keyboard; open floor/language menus; info/search panels; sheet at each detent; required credits visible.                           |
| Interaction          | Pointer, touch, wheel, keyboard, Escape/back, focus restoration, disabled controls, repeat/fast selection, map gestures outside controls, no map remount on panel change.                                              |
| Accessibility        | Useful control/group names, appropriate roles, current/expanded states, localization/language, live-region restraint, 200% text zoom, reduced motion, contrast and named VoiceOver/TalkBack checks for native targets. |
| Theme and isolation  | Light/dark, brand theme, white-label, nested ThemeProviders, portal containment; no host-page style or focus leakage.                                                                                                  |
| SDK correctness      | SDK-selected floor matches label/content; language changes do not race; route/search persistence follows policy; camera occlusion updates; no duplicate SDK/custom controls or credits.                                |
| Packaging and design | Public exports/types/contracts and native equivalents as promised; documented examples compile; Figma/Code Connect matches; consuming artifact and product board actually refreshed.                                   |

Suggested repository entry checks for implementation (run from a built, installed checkout;
the relevant scripts may require a running Storybook or native tooling—read their prerequisites):

```bash
pnpm --filter "@kozmos-ds/react..." build
pnpm --filter @kozmos-ds/react exec vitest run src/components/FloorSelector/FloorSelector.test.tsx src/components/MapStatusPill/MapStatusPill.test.tsx src/components/ManoeuvreCard/ManoeuvreCard.test.tsx
pnpm test:adaptive
pnpm test:overlays
pnpm test:map-sheet
pnpm test:search-sheet
pnpm test:map-controls
pnpm test:poi-details
pnpm contracts:parity:check
pnpm components:contract:check
pnpm skills:check
pnpm product:consumer:check
```

Add focused tests for each new API/state; prove them failing before the fix. Use the prescribed
Docker/amd64 visual-baseline workflow, never bare-Mac re-recording. Native verification must
name executed tests and inspect result artifacts; a successful macOS Swift build is not an iOS
UI pass. Follow [AGENTS.md](../AGENTS.md), [visual review](visual-review.md),
[adaptive layout](adaptive-map-layout.md), [embedding isolation](embedding-isolation.md),
and [release process](release-process.md).

The initial 0.6.0 baseline reconciliation ran the 49 focused React tests and 10 generated-documentation tests
listed in the companion register. For 0.7.0 and 0.8.0, exact main CI, publication and Pages deployment
are recorded in the [release evidence](release-process.md#080). The broader product/device matrix
above remains implementation acceptance work,
**not a claim that every screen, SDK integration or adoption check has already passed**.
