# Changelog: Kozmos for iOS (SwiftUI)

Kozmos is consumed from this repository's `packages/ios` source as the `Kozmos` Swift package. It is not a published native registry release. Pin a reviewed repository commit when adopting these changes; the version headings below follow the web release plan, not a separate native package publication.

## Unreleased — repository source

Native source changes on `main` after the 0.6.0 snapshot above. Nothing here is tagged.

### Fixed

- **POI details summary tones:** a fact's value and icon use the emotion's text role for success, warning and danger (`semanticsEmotionSuccessText`, `semanticsEmotionAlertText`, `semanticsEmotionDangerText`) and `primitivesColorsTheme600` for brand, as the web's summary names them. Each now reads at 4.5:1 or more on the card's white and the sheet's grey in both appearances. The fill colours they used read as low as 1.57:1 (warning on the sheet), and brand read at 3.74:1 on black.

### Added and changed

- **Result summaries and their language:** `KozmosPOIResultPresentation.summaryLanguage` names the language of `summary` when it differs from the interface's (GAP-125). `KozmosPOIResultCard` now draws `summary`, muted and two lines at most, after the location, as the web card does, and VoiceOver hears it after the location. When `nameLanguage` or `summaryLanguage` is set, the select row is spoken through a UIKit element whose label carries each tagged phrase's speech language, with the same words, traits, action and `kozmosPOIResultIdentifier` as the untagged row.
- **Theme fill (decision 59):** prominent filled parts draw theme 500 (`#135BEC`), the client's base colour from the Pointr Cloud Dashboard, with white on it in both appearances. They are the primary Button and IconButton (through the themed button's tokens), FloatingActionButton, SplitButton, a checked Checkbox and its check, a checked Switch, Radio's dot, the default Tag, the filled primary LocationPin and its number, ToggleButton on, FloorSelector's selected tile and result count, POIResultCard's selected number tab, the Stepper's completed step and the guidance theme appearance (the ManoeuvreCard). In the dark appearance they drew black on the fill, which read 3.74:1. Theme-coloured text, icons, edges and rings that drew theme 500 now draw theme 600, as React does, since 500 read 3.13:1 on the dark background: Link, brand Text, Icon primary, the Toast action, BottomNavigation, Pagination, NavigationItem and its focus ring, Itinerary, DirectionStep, RouteSummary, RouteOptionCard, Timeline, POIResultCard's edge and dot, the AI search icon, the Listbox check, Tree, FileUpload, the OTPInput focus, CategoryField's and CategoryTile's accent and Radio's ring. Slider and RouteProgressRail move to 600 too. Outline, ghost and link Button and IconButton text take the Secondary Buttons token in place of theme 500, as React and Compose draw it.

### Migration notes

- Toned summary values are darker in light and lighter in dark. Review screenshot baselines for details cards that set `tone`.
- A result that already passes `summary` now draws it: its card is taller. Review screenshot baselines and any layout that assumes a fixed row height, or leave `summary` unset to keep the old card.
- **Theme colours change (decision 59).** Primary buttons and the filled parts above are brighter in the light appearance (`#135BEC` where the button was `#0D44C2`) and change most in the dark one, from `#7EA2F6` with black on it to `#135BEC` with white. Review screenshot baselines. A view of your own that draws `primitivesColorsTheme500` as text or an edge reads 3.13:1 on the dark background: use `primitivesColorsTheme600`.

## 0.6.0 — repository snapshot

Native source changes since the repository snapshot tagged `@kozmos-ds/react@0.5.0`. This entry does not announce a 0.6.0 tag or completed release validation. The web package has its own [changelog](../react/CHANGELOG.md).

### Added and changed

- **Map status pill:** `KozmosMapStatusPill` provides neutral, progress, success, danger and warning tones, optional custom marks, and off/polite/assertive announcement policies. Warning uses the named alert fill/on-fill pair. Words wrap instead of being cut; the default minimum height is 48pt. The product supplies the status text and chooses when it changes.
- **Travel-time bands:** `KozmosTravelTimeBand(durationSeconds:)` classifies a non-negative finite duration as Nearby, 1–2, 2–5, 5–10 or more than 10 minutes. Result cards use a band only when it is supplied on the travel estimate, with Nearby in the success colour. Without a band they retain the exact duration label; details continue to show the exact duration.
- **Result-card numbering:** `numbered` opts a card or list into displaying `resultIndex` in an inside-card, top-leading tab. The tab follows layout direction and leaves clearance above the title. Featured takes precedence over a number, and a number over a badge. Numbers are quiet at rest and filled when selected; Featured uses amber with dark words and a star; badges use a quiet grey treatment. An unselected Featured card has an amber edge; the selected card's theme-colour edge takes precedence.
- **Numbered map pins:** a non-Featured numbered pin on the current floor is outlined at rest and filled when selected. Off-floor pins retain a dashed outline, including when selected. Selected pins also grow. Selection is exposed in accessibility traits even when the pin is disabled or has no selection callback; this does not make it actionable.
- **Floor switcher:** the existing `.collapsible` variant now uses the SDK-style tile and expanding level column. `userFloor`, `userFloorLabel` and `expandHint` support a visitor-level marker and product-supplied wording. Floor IDs remain selection keys; display labels do not replace them.
- **Location state:** `KozmosUserLocationState.headingPaused` represents heading remembered while the map is away from the visitor. `KozmosMapControlsGroup` renders its distinct paused-heading mark and description. Map-state transitions remain the product's responsibility.
- **Map controls and navigation:** map controls use a 48pt base surface, no border in either theme, and the map-control elevation role. Rail labels use scalable `caption2` text on nominal 14pt lines, with a two-line limit, and the rail adopts the side-menu treatment.
- **Hosted panels:** browse and route-preview components reuse the map shell panel's surface instead of painting another fill. Their first rows account for the panel's existing top inset and grip clearance. Detail-header buttons align to the side inset where space permits, retaining extra clearance when they would collide with the grip target.
- **Glass text:** the public `EnvironmentValues.kozmosSurfaceStyle` signal describes the surrounding Kozmos surface. Participating muted text switches to foreground ink on glass. Standalone browse surfaces retain their own fill.
- **Manoeuvre disclosure:** `KozmosManoeuvreCard` now displays the full instruction by default; `instructionLines` opts into truncation. Disclosure changes request accessibility focus on the replacement part only when focus belonged to the part being removed.
- **Icons:** `KozmosIcon("bluetooth-off")` uses the Pointr outline. Status-pill examples use an explicit walking mark for walking guidance; progress still defaults to the spinner.

### Migration notes

- Add `.headingPaused` to exhaustive switches over `KozmosUserLocationState`; its raw value is `"heading-paused"`. Handle the location button's existing callback in the product to resume heading. Kozmos does not perform that SDK transition itself.
- Pass floors in the desired display order. The selector **does not sort** them. Supply highest-to-lowest order if the up chevron should mean a higher physical level; `userFloor` marks a level without selecting it.
- Set `numbered: true` only when the list should match numbered map markers. Supply matching, one-based `resultIndex` values yourself; cards do not assign or renumber them. A custom `selectionLabel` replaces the generated accessible description, so include the number in that label if needed.
- Set `travelEstimate.band` explicitly to opt into banded result text. Supply translated `travelTimeBandLabels`; the helper classifies seconds, not already-rounded labels. Exactly 2, 5 and 10 minutes remain in the lower band; negative or non-finite durations produce `nil`.
- Pass `instructionLines: 2` to retain the old manoeuvre instruction limit. Without it, allow the surrounding layout to grow. A limit under one also means no limit.
- Review screenshot baselines for tabs, pins, control surfaces, rail labels, hosted fills and header spacing. Native selected-card edges are not the web's separate selection ring.
- Rebuild consuming apps against the exact source revision and review their initializer calls. This candidate does **not** guarantee all 0.5.0 native call sites remain source-compatible; the broader native compatibility follow-up is not included.

### Limits and validation scope

- This source review does not establish human VoiceOver behaviour. The manoeuvre disclosure requests focus on the itinerary container when opening and the instruction when closing; verify the resulting experience with the product's actual itinerary and VoiceOver on a device.
- Glass uses the system material plus Kozmos tint and edge. Its blur and saturation are system-defined, not pixel-identical to the web. Reduce Transparency uses a solid surface; the stronger glass-text treatment remains.
- Dedicated Turn Back U-turn and Wayfinding Unavailable marks are not supplied here. Use an appropriate custom icon, or `showsIcon: false`; do not treat the default warning triangle as those dedicated marks.
- The iOS harness is configured to run the complete test target on a pinned simulator. A macOS `swift test` result alone does not validate iOS-only tests, and this changelog is not proof that the final candidate passed that simulator run.
- Held follow-ups [#160](https://github.com/vodoco/kozmos-design-system/pull/160), [#164](https://github.com/vodoco/kozmos-design-system/pull/164), [#166](https://github.com/vodoco/kozmos-design-system/pull/166) and [#168](https://github.com/vodoco/kozmos-design-system/pull/168) are outside this candidate. Their proposed fixes are not claimed here.
