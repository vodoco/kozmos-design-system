# Native Pointr QA playground

Internal iOS/iPadOS host for live Design-QA data and the local Kozmos package.
This is not a distributable customer application. Local SDK binaries and QA
configuration are ignored by Git; never attach the built app bundle to a public
report or publish its configuration.

## Local setup

Supply the approved PointrKit 10.3.0 and Pointr MapLibre archives and the authorized
Design-QA bootstrap page to `scripts/prepare-pointr-ios.mjs`, as described by that
script's usage message. It validates the artifacts and writes the local resources
without printing credentials. Existing local artifacts can be reused; do not
overwrite them blindly. Then, from this directory:

```sh
xcodegen generate
xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.5' \
  CODE_SIGNING_ALLOWED=NO test
```

## Information integration

`SDKMapScreen` wraps its existing map shell in `KozmosMapInfo`. It owns the open
state without replacing `SDKSession`, the map controller, the query, or the POI.
The SDK's own Info control stays disabled through `SDKMapPolicy`.

- Compact: full-screen Info, with the map/POI isolated beneath it.
- Wide iPad: logical-end Info alongside the resized SDK renderer. Browse/POI
  occupies the logical start. Closing restores the available map width.
- Wide browse/POI panels fit short content and cap long scrolling content.
  Search uses equal 16-point top and side padding. The shell supplies the top
  inset; custom search and route rows consume `kozmosPanelInsetTop` and retain
  `kozmosPanelClearanceTop` instead of adding a second outer margin. Registered bottom controls
  retain the map's outer corner positions, with a reserved band below the panel.
- The compact Info trigger yields while the browse sheet fills the screen.
  Directions leave space beside their top banner for the Info control.
- Opening a full-screen cover is not treated as leaving the SDK session.
- Existing shell collision insets still drive the SDK camera. Do not add the
  reserved Info width to those insets again.

`SDKMapInformation` contains clearly identified English QA copy, the loaded
building name, and runtime app/SDK bundle versions. It intentionally does not
invent tenant legal claims, provider credit strings, privacy URLs, or support
destinations. Supply approved localized content there for a consumer-specific
integration. The SDK-rendered map attribution remains untouched.

## Live interaction checks

`KozmosPointrQA` runs offline unit tests. The separate `KozmosPointrQAUI` scheme
uses real Design-QA data and is not an offline CI substitute. It needs network
access and the local QA configuration.

```sh
xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQAUI \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.5' \
  -only-testing:KozmosPointrQAUITests/InformationUITests \
  -only-testing:KozmosPointrQAUITests/BrowseSheetUITests \
  -resultBundlePath /tmp/kozmos-qa-phone-check.xcresult \
  CODE_SIGNING_ALLOWED=NO test
```

Run `InformationUITests` on `iPad Pro 13-inch (M5),OS=26.5` as well. The test
uses landscape on iPad and verifies the real map view shrinks by the reserved
384 points, while the selected POI stays interactive. The test measures the SDK's
`map-widget-map-view` UIView boundary, not the transient accessibility child
for map features. It waits for usable geometry through map transitions, without
fixed delays. It also checks the initial browse panel's height and equal search
padding. On iPhone it checks modal
isolation. Both exercise a live POI, FAQ expansion, dismissal and retained search.
Use a fresh result-bundle path for each run and read back the actual test names
with `xcrun xcresulttool get test-results tests --path <result-bundle>`.

This app does not establish web or Android SDK integration: the existing web
playground is a mock-map component demo and the Android playground is a task-list
demo. Their platform components exist in the design system, but a live SDK host
must be identified or implemented separately.

## Verified scope (30 September 2026)

- 50 app unit tests, including the two QA information-content tests, passed.
- 65 affected native-library tests passed (shell, detents, controls, attribution,
  information layout/content and related safe-area behavior).
- Live iPhone Info and browse-sheet UI tests passed; live iPad Info UI test passed.
  The iPad test asserts the actual SDK renderer width, not only the SwiftUI wrapper.
- The running landscape iPad was visually inspected with search, map controls and
  the information panel visible together. Some automated iPad captures had an
  inconsistent orientation/composited image; they were not accepted as visual proof.
- The iPad search test exposed keyboard height being applied twice: once by
  SwiftUI keyboard avoidance and again as shell bottom padding. The shell now
  measures container safe areas separately without disabling keyboard avoidance.

Still required before production adoption: approved localized FAQ/legal/support
content, explicit active-route and floor-change preservation checks, physical-device
VoiceOver acceptance, other-platform live SDK hosts and normal merge/release gates.
These checks do not constitute a full release CI run or production publication.
