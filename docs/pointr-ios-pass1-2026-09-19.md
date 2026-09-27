# Pointr iOS — Pass 1: the native browse experience, 19 September 2026

The coding agent, continuing [Astra's handoff](handoff-2026-09-19.md). Branch
`claude/pointr-browse-repairs`, cut from `astra/browser-compatibility` at `663cde1` in the same
worktree, `/private/tmp/kozmos-browser-compat.uqPMBD`. Local commits only: nothing is merged,
pushed or published, and no Cloud content was touched.

Every "measured" below comes from the real QA app connected to Design-QA, with Dunkin' (Terminal
B, Second Floor) as the case the handoff reported: an iPhone 17 Pro simulator (iOS 26.5), and for
the wide layout an iPad Pro 11" (M5) simulator. Positions are window points read from 3× simulator
screenshots by the two tools in `apps/PointrPlayground/Tools/`, edge-exclusive: a run of pixels
`a..b` is reported as `a` to `(b+1)/3`.

The first pass fixed A–D. A second, adversarial pass over that work found three more defects and
fixed them, measured one claim the first pass had only asserted, and recorded what it could not
verify. Both are here.

## Commits

| Commit    | What                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| `21c7cbf` | Astra's handoff, committed verbatim so the branch carries it                              |
| `7e03485` | Native map shell saturates opposing insets at the map's size, as React does               |
| `4061d92` | QA host: controls anchored (A), selected pin kept in view (B), sheet presentation (D)     |
| `aa4a6c0` | QA host: a selected place stays framed when the sheet settles mid-flight (B)              |
| `7b4a868` | Native gallery: one index for strip, buttons and counter; real states (C)                 |
| `dc7b78d` | This report, first version                                                                |
| `214ca2f` | Audit: the shell lays its chrome out beside a floating panel, not under it (A on iPad)    |
| `10d3b65` | Audit: CI's simulator step runs the gallery and shell suites                              |
| `191c6b4` | Audit: the host refuses credentialled artwork addresses; gallery numbered after filtering |

## A. Map controls — fixed, on phones and on iPad

**Cause.** `.bottom` gives the controls slot the map's full width and leaves the corner to the
caller. The host passed an unanchored `HStack`, so the cluster sat centred over the map.

**Fix.** The cluster is anchored to the trailing edge above the sheet, with the levels outermost,
as in the fixture playground. At a tall detent the cluster no longer fits between the top bar and
the sheet, and it had overflowed upward over the search bar. The shell proposes the slot only the
height that is left, so a `ViewThatFits` drops zoom first, then everything. Its last child is a
zero-size view: `EmptyView` adds no child at all, and `ViewThatFits` then fell back to the floor
selector, which still covered the search bar.

**Found by the audit, and fixed in the shell (`214ca2f`).** In regular width the shell floats the
panel at the trailing edge, above everything, and laid the top bar and the controls out across the
whole width. So on an iPad the trailing-anchored cluster sat _under_ the panel, and the centred
search bar lost its trailing third under it. The fixture playground's floor selector had the same
fate. React's shell lays both out in the map area beside the panel; the native shell now does too
(`chromeWidth`), on the side the panel is not on, mirrored for right-to-left. Docked, the width is
the whole shell, so a phone is unchanged — re-measured after the change: the pin and the floor
pill are where they were.

**Measured.** Phone: trailing in left-to-right, on the left in right-to-left; at the large detent
nothing is drawn over the search bar; collapsed and medium show the full cluster. iPad (live, from
a `simctl` screenshot): the search bar spans the map area and the cluster sits at its bottom
trailing corner, beside the panel. The shell's new render test draws a trailing cluster and a
full-width bar in both directions and reads the pixels; on the old shell body it fails, with the
cluster visible only as a sliver through the panel's rounded corner.

**Computed, not driven — landscape.** No simulator rotation is available to the tools here. On a
compact-width phone in landscape the shell is about 350pt tall: the free band above the sheet is
110pt at medium and 134pt at collapsed, both shorter than the 141pt cluster, so the zoom buttons
never appear in landscape and the floor selector alone does (88pt with its padding). Pinch still
zooms. Whether that is acceptable is part of the zoom-button decision below.

**Open.** The fixture playground has no zoom buttons on phones ("the map is pinched and dragged").
The QA host keeps zoom and compass because the handoff asked for anchoring, not removal.

## B. Selected marker under the search bar — fixed

**Measured first.** MapLibre's `automaticallyAdjustsContentInset` is off, so nothing was overwriting
the host's padding. `focusPoi` centres the place's anchor exactly in the inset viewport: the window
point was (201, 213.78), the viewport's centre. The highlighted pin is drawn upward from that anchor:
a 72pt disc whose top sits 95.7pt above it. At the medium detent the free band above the anchor was
79.8pt — a 778pt map, less a 72pt top bar, a 373.4pt sheet and a 173pt controls band, leaves 159.6pt
— so the pin's head went 16pt under the search bar.

**Fix.** The session owns camera padding. While a place is selected it adds the pin's height to the
top padding, which centres the pin rather than its anchor (`SDKCameraPadding`). A band shorter than
the pin rests the anchor on the band's lower edge. The pin height, 96pt, is measured, not read from
an API: PointrKit exposes no marker geometry. Re-measure it with `measure-selected-pin.py` after a
PointrKit or style update.

The native shell also reported more inset than the map had height at the large detent: 72pt top and
857.6pt bottom on a 778pt map. React's `resolveMapInsets` saturates opposing edges, and the native
shell now does too (`7e03485`, two tests that fail on the old shell).

**Found while testing, and fixed (`aa4a6c0`).** Select a place from a fresh launch, then move the
sheet before the camera lands, and the place ended off-centre at a lower zoom. Logged: the sheet's
inset change arrived after `focusPoi` and before it landed, the flight ended at zoom 15.07 (its
start), and the padding change re-centred there. MapLibre's `contentInset` setter re-centres on the
current centre, which cancels a flight. Until the visitor moves the map, a padding change now focuses
the selected place again. PointrKit's own events say when they move it, measured: a pan reports
`mapDidReceivePan`, a pinch `didZoom`, and a `focusPoi` flight neither. The zoom buttons end the
framing too.

**Measured after** (tool convention; the first report's figures were 0.3pt lower, edge-inclusive).

| Case                                 | Pin top         | Anchor                   | Below the search bar               |
| ------------------------------------ | --------------- | ------------------------ | ---------------------------------- |
| Before, medium                       | 118 (computed)  | 213.7                    | 16pt under it                      |
| Medium                               | 166.0           | 261.7 (predicted 261.78) | 32.0 clear                         |
| Collapsed                            | 282.7           | 378.3                    | 148.7 clear                        |
| Medium → large → collapsed           | 282.7           | 378.3                    | same as undisturbed                |
| Sheet moved mid-flight, fresh launch | 282.7           | 378.3                    | same as undisturbed                |
| Panned, then detent changed          | follows the pan | 188.0 (predicted 187.6)  | partly under it — by design, below |

The last row is the visitor's framing: after a pan the map is theirs, and a detent change shifts it
by the inset delta without re-framing, so a place they dragged near the bar can end under it. The
alternative — re-framing after every detent change — would undo their pan. Right-to-left frames the
same way (screenshot; not measured with the tool).

**Refinement not made.** With the flight landed, a detent change is handled by MapLibre's own
centre-preservation, and the re-focus that follows is a flight to the camera the map already has.
Checking "is the anchor already at the padded centre?" before focusing would skip those; the
benefit is invisible in the runs above, so it was left out rather than added untested.

## C. Native gallery — fixed

Every gap in the handoff is closed. The contract is React's, not its implementation.

- **One index.** Scrolling moves it, from the tile nearest the leading edge (the web's rule). That
  rule stays right at the end of the strip, where the last tile cannot reach the edge. Buttons, a
  controlled value, a width change and new media move the strip. A non-zero starting index is
  scrolled to.
- **Paged.** View-aligned snapping on iOS 17 and later. iOS 16 scrolls freely and still tracks the
  index.
- **States.** Loading, loaded and unavailable are distinct. A failed load retries on tap and by
  accessibility action. Media addresses follow the property-icon rule; anything else is unavailable
  at once — and, after the audit, the host applies that rule first (`191c6b4`), so a credentialled
  address never reaches the card, and "image 2 of 2" is the second image a visitor can see.
- **Layout.** Tiles are 85% of the width so the next shows, 4:3, with the 16pt control radius and
  outline arrows that mirror with the strip. A fill-scaled image used to widen its own tile to 370pt;
  the tile's surface now takes the tile size and the image is an overlay.
- **Labels.** `KozmosPOIDetailPanel` passes the gallery the same labels React's panel does.

**Measured.** The first pass asserted the radius; the audit measured it with
`measure-gallery-tile.py` on the render test's attachment: the first tile is 314.7 × 236.0pt
(width/height 1.333) with a fitted top-left radius of 16.0pt (fit error 0.18). Live, left-to-right
and right-to-left: forward and back update the counter, the strip and the arrows' disabled states;
a finger swipe updates the counter — the defect the handoff could only confirm in source; a 130pt
swipe snaps to the next tile; a vertical drag that starts on the gallery scrolls the card, not the
gallery; neither gesture moves the map.

**Tests.** Ten new. Eight are geometry and address rules, run on macOS and iOS. One measures that a
right-to-left strip reports physical coordinates: the nearest-tile rule rests on this, and the live
app cannot show it because both readings agree at rest. One renders refused media in both
directions.

**Not verified.** The controlled-parent refusal path: it defers one run-loop turn to see whether
the parent kept the index, and no caller in either app controls the gallery. Retry after a real
network failure: the Dunkin' images load, and only refused addresses are rendered, in a test
snapshot. VoiceOver, including reaching tiles `LazyHStack` has not built yet. The iOS 16 path: it
compiles, but no iOS 16 runtime is installed. `scrollTo` a far-off starting index in a lazy strip.

**Policy question, not patched.** The Dunkin' brand image arrives in `imageUrls`, not `logoUrl`, so
it is photography by contract and is cropped to fill. The web crops it the same way. Showing brand
artwork whole is a decision for both platforms: `contain` for every image, or a role in the data.

**Android.** `packages/android/.../POIMediaGallery.kt` still has the defects this pass removed from
iOS: a fixed 260 × 195dp tile cropped to fill, an index that moves only through the arrows, a
`LazyRow` with no snapping, the panel radius, and one image state. Out of this handoff's scope, but
it is the next parity item and it is not fixed.

## D. Card inside the sheet — fixed on phones; a cross-platform decision on iPad

The host now passes `.sheet` when the panel is docked and `.panel` when it floats, the rule the
React handoff documents and the fixture playground already uses. On a phone the inner bordered card
is gone (measured on screen).

In regular width a hosted render shows the card's 1pt `.panel` border drawn inside the shell's
floating container, breaking within about 19pt of each corner, where the card's 16pt corners fall
outside the shell's 24pt clip. The audit checked the web: React's shell gives its side `aside` its
own background, shadow and 20px container radius, and the card inside keeps `border border-border`
at 16px. The composition is the same on both platforms, so whether `.panel` should drop its border
as `.sheet` does is a design-system decision, not a native patch. The iPad simulator could be
screenshot but not driven, so the live iPad card was not opened.

## Also found

- **The building shown at launch depends on the map.** The QA configuration names Central Parking.
  On the iPad the list opened on Central Parking, 210 POIs; on the iPhone it opened on Terminal B,
  306 POIs, because the map's first `didChangeLevel` callback named that building and the session
  follows level callbacks. Evidence for G in the handoff, not changed here.
- **Safe areas.** Neither app extends the map under the status bar or the sheet to the screen's
  bottom edge; the shell lays out inside the safe area. Product polish, not a defect of this pass.
- **SpringBoard crashes on iOS 18.4 simulators.** Three reports (17 Sep 12:45, 19 Sep 12:27 and
  19:11) show the same `dispatch_assert_queue` trap in `SBRecentAppLayoutsPersister` during
  SpringBoard start-up on iOS 18.4 devices booted headless by `xcodebuild`, no app frames. A
  simulator runtime issue on this Xcode/macOS, not a QA app crash. Click Ignore, not Report.
- **CI never ran the iOS-only tests.** `scripts/check-ios-poi.mjs` ran two suites on the simulator;
  `swift test` on macOS skips everything under `#if os(iOS)`. The gallery's render tests and the
  shell's pixel test would have been skipped silently. Fixed (`10d3b65`): 51 tests on the simulator,
  from 25.
- **Astra's dated reports were not indexed.** `docs/README.md` claimed to map every document and
  listed none of the eleven from 18–19 September; it does now, and `ds-handoff.md` §10 has the two
  days.
- The native POI fixtures carry no media ("No invented logos or photos were added"). So apart from
  the live SDK, the gallery's only evidence is its tests.

## Verification

Every new test was first run against the code it was written for and failed there: the two shell
inset tests, the shell pixel test (on the old body, with the sliver numbers above), the three
credential assertions (on the old rule), and the gallery geometry tests (against the old
gallery, which had none of the functions they call, so they do not compile there).

| Suite                                                    | Result                        |
| -------------------------------------------------------- | ----------------------------- |
| `swift test`, macOS                                      | 76 tests, 0 failures          |
| Kozmos package, iOS 18.4, iPhone 16, button baselines on | 84 tests, 0 failures          |
| Kozmos package, iOS 26.5, iPhone 17 Pro, baselines off   | 82 tests, 0 failures          |
| `node scripts/check-ios-poi.mjs` (CI's simulator step)   | 51 tests, 0 failures          |
| `KozmosPointrQA` unit tests                              | 13 tests, 0 failures          |
| `apps/Playground.swiftpm` build                          | succeeded                     |
| `tokens:raw:check`, `components:contract:check`          | ok                            |
| `tokens:radius:check`, `docs:snippets:check`             | ok (327 identifiers checked)  |
| `figma:parse:ios:linked`                                 | parsed                        |
| `sync-ios-poi-examples.mjs` freshness                    | fixtures match                |
| Live, iPhone 17 Pro, LTR and RTL                         | as measured above             |
| Live, iPad Pro 11", browse state                         | screenshot, as measured above |

Not run: Chromatic, the web browser suites (no React source changed), Android.

## Not started

F (search and selection lifecycle), G (floor certification), and Passes 3–4. E was done next, as
[Pass 2](pointr-ios-pass2-2026-09-19.md) records.
The keyboard was not exercised: the simulator uses a hardware keyboard. Landscape was computed,
not driven.

## Change it yourself

Everything is in `/private/tmp/kozmos-browser-compat.uqPMBD` on `claude/pointr-browse-repairs`.
The worktree is under `/private/tmp`, which macOS clears; the branch protects the source, not the
ignored SDK frameworks in `apps/PointrPlayground/.local/` or `QAConfig.json`.

**Where each behaviour lives.**

| Behaviour                                               | File                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Camera padding for a selected place; the 96pt           | `apps/PointrPlayground/Sources/App/SDKCameraPadding.swift`                     |
| Re-focus after a padding change; what ends framing      | `SDKSession.swift`: `setChromeInsets`, `framesSelection`, the map callbacks    |
| Controls placement and what drops when space runs out   | `SDKMapScreen.swift`: `controls(_:zoom:)` and its `ViewThatFits`               |
| Sheet vs panel card                                     | `SDKMapScreen.swift`: `presentation:` on `KozmosPOIDetailPanel`                |
| Artwork address rule, gallery numbering                 | `SDKPOIAdapter.swift`: `https`, `media`                                        |
| Shell: inset saturation, chrome beside a floating panel | `packages/ios/Sources/Components/AdaptiveMapShell/AdaptiveMapShell.swift`      |
| Gallery: 85% tiles, 4:3, nearest-tile rule, states      | `packages/ios/Sources/Components/POIMediaGallery/POIMediaGallery.swift`        |
| Gallery labels the card passes                          | `packages/ios/Sources/Components/POIDetailPanel/POIDetailPanel.swift`          |
| Tests for the above                                     | `apps/PointrPlayground/Tests/SDKIntegrationTests.swift`, `packages/ios/Tests/` |

**Constants worth knowing.** `SDKCameraPadding.selectedPinHeight = 96` (measured 95.7).
`POIMediaGalleryGeometry.tileWidthFraction = 0.85`, `tileAspectRatio = 4/3`, spacing
`primitivesLayoutSpacing150` (12pt). The shell's floating panel is `min(416, 42%)` wide with 16pt
gutters; detents are 18% (never under 112pt), 48% and 88% of the shell.

**Build, test, run.** Simulator ids: iPhone 17 Pro `51937B59-CEAE-4BC7-BC34-FEB17E28FAE7`, iPad Pro
11" `1CB35135-48B2-407B-8515-C8C6EFC1D963`; re-discover with `xcrun simctl list devices available`.

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD/apps/PointrPlayground
xcodegen generate                                  # after adding or removing a source file
xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA \
  -destination 'platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7' \
  -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO test   # 13 tests
xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA \
  -destination 'platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7' \
  -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO build
xcrun simctl install 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 \
  /private/tmp/kozmos-pointr-qa-xcode/Build/Products/Debug-iphonesimulator/KozmosPointrQA.app
# Console attached: print() reaches the file line by line (plain --stdout buffers until exit).
xcrun simctl launch --console-pty --terminate-running-process \
  51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 com.kozmos.pointrqa > /tmp/qa-console.log 2>&1 &
# Right-to-left:
xcrun simctl launch --terminate-running-process 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 \
  com.kozmos.pointrqa -AppleTextDirection YES -NSForceRightToLeftWritingDirection YES

cd /private/tmp/kozmos-browser-compat.uqPMBD/packages/ios
swift test                                         # macOS, 76; skips #if os(iOS)
xcodebuild -scheme Kozmos -destination 'platform=iOS Simulator,name=iPhone 16,OS=18.4' \
  CODE_SIGNING_ALLOWED=NO test                     # 84, with the button baselines
cd /private/tmp/kozmos-browser-compat.uqPMBD && node scripts/check-ios-poi.mjs   # CI's step, 51
```

**Measure, don't eyeball.** Screenshots via `xcrun simctl io <udid> screenshot out.png` work on any
booted simulator, granted to the tooling or not; driving a device needs it granted from the
simulator panel ("Let the coding agent use it"). Then:

```sh
python3 apps/PointrPlayground/Tools/measure-selected-pin.py out.png            # pin top, anchor, clearance
python3 apps/PointrPlayground/Tools/measure-gallery-tile.py out.png \
  --width 402 --region 8 335 74 330                                             # tile size, aspect, radius
```

Both need Pillow (`python3 -m pip install pillow`; Homebrew's python3 with Pillow 12.1 was used).
The pin tool reports the _visible_ top: a pin under the search bar reads as cut at 134pt.

**To change a decision.** Zoom buttons: remove `KozmosMapControlsGroup` from `controls(_:zoom:)`
and collapse the `ViewThatFits` to the floor selector. Gallery crop: `scaledToFill()` in
`POIMediaTile` (and `object-fit: cover` in `owned-poi-gallery.css`) — or give the data a role.
`.panel` border: `KozmosPOIDetailPanel.panelShape`'s stroke condition (and the `sheet` rule in
`owned-poi-detail.css`). Pin reserve: `selectedPinHeight`, after re-measuring.

## Decisions for Olcay

1. Gallery crop policy: brand artwork in `imageUrls` is cropped to fill, on both platforms.
2. Zoom buttons on phones: the fixture has none; the QA host kept them, and in landscape they
   never fit.
3. Floating-panel chrome: should `.panel` drop the card's border, as `.sheet` does, on both
   platforms?
4. The 320pt / accessibility-5 metadata stacking exception from the handoff's §10: unchanged and
   unapproved.
5. Pushing the branches, and moving the SDK frameworks and `QAConfig.json` out of `/private/tmp`.
