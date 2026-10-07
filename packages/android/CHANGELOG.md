# Changelog: Kozmos for Android (Jetpack Compose)

Kozmos is consumed from this repository's `packages/android` source as an Android library module in the `com.kozmos` namespace. It is not a published Maven/registry release. Pin a reviewed repository commit when adopting these changes; the version headings below follow the web release plan, not a separate native package publication.

## Unreleased

Recorded as changes land on `main`, ahead of the next release entry. This is not a complete list of the native changes since 0.6.0.

### Fixed

- **Result rows are heard once:** TalkBack read a `KozmosPOIResultCard` row's whole description and then every text drawn inside it again (name, category, level, availability, walk, the language disclosure and the unavailable reason), and with a `selectionLabel` it read the drawn texts after the product's label. The drawn texts are now left out of semantics, so the row says its words, or the product's label, once. The row keeps its click, enabled state and selection, and a logo keeps its alt text.

### Changed

- **A result row's words are its text:** `KozmosPOIResultCard` gives TalkBack the row's words as its semantics text, never as a content description, whether or not a phrase carries a language (GAP-125). The words are the same; a tagged phrase keeps its `LocaleSpan`.

### Migration notes

- A product UI test that finds a result row with `onNodeWithContentDescription(...)` no longer matches: use `onNodeWithText(...)` with the same words, `substring = true` for one phrase. One that finds the row by a single drawn word in the merged tree, `onNodeWithText("Pharmacy")`, needs `substring = true`, or `useUnmergedTree = true` to find the drawn text itself.

## 0.6.0 — repository snapshot

Native source changes since the repository snapshot tagged `@kozmos-ds/react@0.5.0`. This entry does not announce a 0.6.0 tag or completed release validation. The web package has its own [changelog](../react/CHANGELOG.md).

### Added and changed

- **Map status pill:** `KozmosMapStatusPill` provides Neutral, Progress, Success, Danger and Warning tones, optional custom marks, and Off/Polite/Assertive live-region policies. Warning uses the named alert fill/on-fill pair. Words wrap instead of being cut; the default minimum height is 48dp. The product supplies the status text and chooses when it changes.
- **Travel-time bands:** `KozmosTravelTimeBand.forDuration(durationSeconds)` classifies a non-negative finite duration as Nearby, 1–2, 2–5, 5–10 or more than 10 minutes. Result cards use a band only when it is supplied on the travel estimate, with Nearby in the success colour. Without a band they retain the exact duration label; details continue to show the exact duration.
- **Result-card numbering:** `numbered` opts a card or list into displaying the supplied `resultIndex` in an inside-card, top-start tab. The tab follows layout direction and leaves font-scaled clearance above the title. Featured takes precedence over a number, and a number over a badge. Numbers are quiet at rest and filled when selected; Featured uses amber with dark words and a star; badges use a quiet grey treatment. An unselected Featured card has an amber edge; the selected card's theme-colour edge takes precedence.
- **Numbered map pins:** a non-Featured numbered pin on the current floor is outlined at rest and filled when selected. Off-floor pins retain a dashed outline, including when selected. Selected pins also grow; their selection semantics remain separate from whether the pin is enabled or actionable.
- **Floor switcher:** `KozmosFloorSelectorVariant.Collapsible` adds the SDK-style tile and expanding level column. `userFloor` and `userFloorLabel` support a visitor-level marker and product-supplied wording. Floor IDs remain selection keys; display labels do not replace them.
- **Location state:** `KozmosUserLocationState.HeadingPaused` represents heading remembered while the map is away from the visitor. `KozmosMapControlsGroup` renders its distinct paused-heading mark and description. Map-state transitions remain the product's responsibility.
- **Map controls and navigation:** map controls use a 48dp base surface, no border in either theme, and the map-control elevation role. Rail labels use `labelSmall` (11sp in the default type scale), 14sp line height and a two-line limit. Bottom-navigation labels also use `labelSmall`; custom product typography still applies.
- **Hosted panels and glass text:** browse and route-preview components reuse the map shell panel's surface instead of painting another fill. Their first rows account for the panel's existing top inset and grip clearance. The public `LocalKozmosSurfaceStyle` signal lets participating muted text use foreground ink on glass. Standalone browse surfaces retain their own fill.
- **POI detail header:** favourite and bookmark actions are controlled icon toggles beside close, using the supplied action labels and states. Other actions remain below the header in caller order. The header omits the logo box when there is no logo, and uses the name's initial while supplied artwork loads or fails. Top spacing aligns with side spacing where possible without colliding with the grip target.
- **Manoeuvre disclosure:** `KozmosManoeuvreCard` now displays the full instruction by default; `instructionLines` opts into truncation. Focus requests follow the disappearing part: to Hide when opening, and back to the instruction when closing. The 0.5.0 positional signature is retained through an overload, and the itinerary can remain a trailing lambda.
- **Icons:** `KozmosIcon(name = "bluetooth-off")` maps to Material's BluetoothDisabled. Status-pill examples use an explicit walking mark for walking guidance; progress still defaults to the spinner.

### Migration notes

- Add `KozmosUserLocationState.HeadingPaused` and `KozmosFloorSelectorVariant.Collapsible` to exhaustive `when` expressions over those enums. The paused-heading wire value is `"heading-paused"`. Handle the location button's existing callback in the product to resume heading; Kozmos does not perform that SDK transition itself.
- Pass floors in the desired display order. The selector **does not sort** them. Supply highest-to-lowest order if the up chevron should mean a higher physical level; `userFloor` marks a level without selecting it.
- Set `numbered = true` only when the list should match numbered map markers. Supply matching, one-based `resultIndex` values yourself; cards do not assign or renumber them. A custom `selectionLabel` replaces the generated accessible description, so include the number in that label if needed.
- Set `travelEstimate.band` explicitly to opt into banded result text. Supply translated `travelTimeBandLabels`; the helper classifies seconds, not already-rounded labels. Exactly 2, 5 and 10 minutes remain in the lower band; negative or non-finite durations produce `null`.
- Pass `instructionLines = 2` to retain the old manoeuvre instruction limit. Without it, allow the surrounding layout to grow. A limit under one also means no limit.
- Review screenshot baselines for tabs, pins, control surfaces, labels, hosted fills and detail headers. Native selected-card edges are not the web's separate selection ring.
- Rebuild consuming apps against the exact source revision and review positional calls to other composables. The compatibility overload above is specific to `KozmosManoeuvreCard`; it is **not** a guarantee that all 0.5.0 native call sites remain source-compatible. The broader compatibility follow-up is not included.

### Limits and validation scope

- This source review does not establish human TalkBack behaviour. Compose focus requests and semantics tests are not proof that TalkBack will follow the intended target; verify disclosure and focus recovery with the product's actual itinerary on a device.
- With empty text and no host size constraint, the status pill's remaining live-region box has no minimum size. The first empty-to-populated announcement remains a validation gap; do not rely on it as the sole way to communicate a critical status.
- Glass currently supplies tint and edge, not backdrop blur. Compose's elevation uses the platform shadow model, not the web/iOS three-layer shadow. These are intentional platform limitations, not exact visual parity claims.
- Dedicated Turn Back U-turn and Wayfinding Unavailable marks are not supplied here. Use an appropriate custom icon, or `icon = null`; do not treat the default warning triangle as those dedicated marks.
- Held follow-ups [#160](https://github.com/vodoco/kozmos-design-system/pull/160), [#164](https://github.com/vodoco/kozmos-design-system/pull/164), [#166](https://github.com/vodoco/kozmos-design-system/pull/166) and [#168](https://github.com/vodoco/kozmos-design-system/pull/168) are outside this candidate. Their proposed fixes are not claimed here.
