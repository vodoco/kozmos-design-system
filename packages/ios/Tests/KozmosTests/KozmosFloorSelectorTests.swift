import XCTest
import SwiftUI
#if os(macOS)
import AppKit
#endif
@testable import Kozmos

/// Property assertions on the FloorSelector's API.
///
/// The component used to take `[String]` only, which forced a venue to make its
/// canonical floor IDs double as the visible labels. These cover the
/// presentation-based API and the stepper's handling of closed levels.
final class KozmosFloorSelectorTests: XCTestCase {
    func testPopupMovesBesideSameSidePanelInsteadOfRefusingToOpen() throws {
        let bounds = CGRect(x: 100, y: 100, width: 400, height: 400)
        for (x, rtl) in [(CGFloat(700), false), (CGFloat(20), true)] {
            let anchor = CGRect(x: x, y: 440, width: 48, height: 48)
            let popup = try XCTUnwrap(kozmosFloorPopupFrame(
                anchor: anchor, bounds: bounds, desiredHeight: 900, inset: 4, rtl: rtl, allowHorizontalShift: true
            ))
            XCTAssertTrue(bounds.contains(popup))
            XCTAssertEqual(popup.width, 56)
            XCTAssertGreaterThan(popup.height, 48)
        }
        XCTAssertNil(kozmosFloorPopupFrame(
            anchor: CGRect(x: 700, y: 550, width: 48, height: 48),
            bounds: bounds, desiredHeight: 900, inset: 4, rtl: false, allowHorizontalShift: true
        ), "A vertically excluded control must still stay unavailable")
    }

    func testCollapsedAvailabilityTracksTopMiddleBottomAndUnknownFloors() {
        let floors = ["2", "1", "G"]
        for (selected, up, down) in [("2", false, true), ("1", true, true), ("G", true, false), ("missing", false, false)] {
            let view = KozmosFloorSelector(floors: floors, selectedFloor: .constant(selected), variant: .collapsible)
            XCTAssertEqual(view.availableAbove, up)
            XCTAssertEqual(view.availableBelow, down)
        }
        let single = KozmosFloorSelector(floors: ["G"], selectedFloor: .constant("G"), variant: .collapsible)
        XCTAssertFalse(single.availableAbove)
        XCTAssertFalse(single.availableBelow)
    }

    func testCollapsedAvailabilityDoesNotPromiseDisabledFloors() {
        let view = KozmosFloorSelector(floors: [
            KozmosFloorPresentation(id: "1", label: "First floor", shortLabel: "1F", disabled: true),
            KozmosFloorPresentation(id: "G", label: "Ground floor", shortLabel: "GF")
        ], selectedFloor: .constant("G"), variant: .collapsible)
        XCTAssertFalse(view.availableAbove)
        XCTAssertFalse(view.availableBelow)
    }
    private let levels = [
        KozmosFloorPresentation(id: "level-3", label: "Level 3", shortLabel: "L3"),
        KozmosFloorPresentation(id: "level-2", label: "Level 2", shortLabel: "L2", disabled: true),
        KozmosFloorPresentation(id: "level-1", label: "Level 1", shortLabel: "L1"),
        KozmosFloorPresentation(id: "basement-1", label: "Basement 1", shortLabel: "B1")
    ]

    func testPresentationInitKeepsIdSeparateFromLabel() {
        let view = KozmosFloorSelector(floors: levels, selectedFloor: .constant("level-1"))

        XCTAssertEqual(view.floors.map(\.id), ["level-3", "level-2", "level-1", "basement-1"])
        XCTAssertEqual(view.floors.map(\.shortLabel), ["L3", "L2", "L1", "B1"])
        XCTAssertEqual(view.selectedFloor, "level-1")
        XCTAssertEqual(view.variant, .verticalList)
    }

    /// The string API is for venues whose IDs already read as labels, so each
    /// entry stands in for all three fields.
    func testStringInitMirrorsIdIntoBothLabels() {
        let view = KozmosFloorSelector(floors: ["L2", "L1", "G"], selectedFloor: .constant("L1"))

        XCTAssertEqual(view.floors.map(\.id), ["L2", "L1", "G"])
        XCTAssertEqual(view.floors.map(\.label), ["L2", "L1", "G"])
        XCTAssertEqual(view.floors.map(\.shortLabel), ["L2", "L1", "G"])
        XCTAssertFalse(view.floors.contains { $0.disabled })
    }

    func testSelectedIndexTracksTheCanonicalId() {
        let view = KozmosFloorSelector(floors: levels, selectedFloor: .constant("basement-1"))
        XCTAssertEqual(view.selectedIndex, 3)
    }

    func testUnknownSelectionIsNotSubstitutedWithTheFirstFloor() {
        let view = KozmosFloorSelector(
            floors: levels, selectedFloor: .constant("mezzanine"),
            variant: .collapsible, userFloor: "level-3"
        )
        XCTAssertNil(view.selectedIndex)
        XCTAssertEqual(view.tileLabel, "mezzanine")
        XCTAssertFalse(view.tileShowsUserFloor)
        XCTAssertNil(view.reachableIndex(step: -1))
        XCTAssertNil(view.reachableIndex(step: 1))
    }

    func testRemovingTheSelectedFloorDisablesSteppingUntilTheHostSelectsAgain() {
        let selected = "level-1"
        let before = KozmosFloorSelector(floors: levels, selectedFloor: .constant(selected))
        XCTAssertEqual(before.reachableIndex(step: 1), 3)
        let after = KozmosFloorSelector(
            floors: levels.filter { $0.id != selected }, selectedFloor: .constant(selected)
        )
        XCTAssertEqual(after.tileLabel, selected)
        XCTAssertNil(after.reachableIndex(step: -1))
        XCTAssertNil(after.reachableIndex(step: 1))
        XCTAssertEqual(after.selectedFloor, selected)
    }

    /// Level 2 is closed, so stepping down from Level 3 lands on Level 1.
    func testStepperSkipsDisabledFloors() {
        let view = KozmosFloorSelector(
            floors: levels,
            selectedFloor: .constant("level-3"),
            variant: .compactStepper
        )
        XCTAssertEqual(view.reachableIndex(step: 1), 2)
    }

    func testStepperStopsAtTheEndsOfTheList() {
        let top = KozmosFloorSelector(floors: levels, selectedFloor: .constant("level-3"))
        XCTAssertNil(top.reachableIndex(step: -1))

        let bottom = KozmosFloorSelector(floors: levels, selectedFloor: .constant("basement-1"))
        XCTAssertNil(bottom.reachableIndex(step: 1))
    }

    func testStepperReturnsNilWhenEveryRemainingFloorIsDisabled() {
        let view = KozmosFloorSelector(
            floors: [
                KozmosFloorPresentation(id: "level-1", label: "Level 1", shortLabel: "L1"),
                KozmosFloorPresentation(id: "basement-1", label: "Basement 1", shortLabel: "B1", disabled: true)
            ],
            selectedFloor: .constant("level-1")
        )
        XCTAssertNil(view.reachableIndex(step: 1))
    }

    func testEmptyFloorListHasNothingToStepTo() {
        let view = KozmosFloorSelector(floors: [KozmosFloorPresentation](), selectedFloor: .constant("level-1"))
        XCTAssertNil(view.reachableIndex(step: 1))
        XCTAssertNil(view.reachableIndex(step: -1))
    }

    /// Row 67: the stepper's two buttons carry the product's names, the
    /// previous level in list order on the up chevron and the next on the down.
    /// Hard-coded English until then. Only the stepper draws them; the lists
    /// name each level by its own label.
    func testTheStepperTakesTheProductsNames() {
        let view = KozmosFloorSelector(
            floors: levels,
            selectedFloor: .constant("level-1"),
            variant: .compactStepper,
            previousFloorLabel: "Vorherige Etage",
            nextFloorLabel: "Nächste Etage"
        )
        XCTAssertEqual(view.stepperLabel(step: -1), "Vorherige Etage")
        XCTAssertEqual(view.stepperLabel(step: 1), "Nächste Etage")

        let strings = KozmosFloorSelector(
            floors: ["2", "1", "G"],
            selectedFloor: .constant("1"),
            variant: .compactStepper,
            previousFloorLabel: "前の階",
            nextFloorLabel: "次の階"
        )
        XCTAssertEqual(strings.stepperLabel(step: -1), "前の階")
        XCTAssertEqual(strings.stepperLabel(step: 1), "次の階")
    }

    /// The defaults stay the words they were, which React and Compose say too,
    /// and a product that passes none hears nothing new here.
    func testTheStepperNamesDefaultToTheEnglishTheyWere() {
        let view = KozmosFloorSelector(floors: levels, selectedFloor: .constant("level-1"), variant: .compactStepper)
        XCTAssertEqual(view.stepperLabel(step: -1), "Floor up")
        XCTAssertEqual(view.stepperLabel(step: 1), "Floor down")
    }

    // MARK: - Row 69 (GAP-070): the levels that hold results

    /// Level 2 holds three results, Level 3 a real zero, Level 1 no count at
    /// all. Level 3's short label is "3", which is the collision a marker on a
    /// numbered control invites, as React's test found.
    private let resultLevels = [
        KozmosFloorPresentation(id: "1", label: "Level 1", shortLabel: "1"),
        KozmosFloorPresentation(id: "2", label: "Level 2", shortLabel: "2", resultCount: 3),
        KozmosFloorPresentation(id: "3", label: "Level 3", shortLabel: "3", resultCount: 0)
    ]

    func testSuppliedResultCountsAreOffByDefault() {
        for variant in KozmosFloorSelectorVariant.allCases {
            let view = KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("1"), variant: variant)
            XCTAssertNil(view.markedResultCount(resultLevels[1]), "\(variant)")
            XCTAssertEqual(view.spokenLabel(resultLevels[1]), "Level 2", "\(variant)")
        }
    }

    /// The count joins the level's own label, in the product's words, on every
    /// layout that lists the levels. Zero is not "unknown", and neither is
    /// marked: a level with no results reads as itself.
    func testTheListsSayWhereTheResultsAre() {
        for variant in [KozmosFloorSelectorVariant.verticalList, .horizontalList, .collapsible] {
            let view = KozmosFloorSelector(
                floors: resultLevels,
                selectedFloor: .constant("1"),
                variant: variant, showResultCounts: true,
                resultCountLabel: { "\($0) Ergebnisse" }
            )
            XCTAssertEqual(view.spokenLabel(resultLevels[1]), "Level 2, 3 Ergebnisse", "\(variant)")
            XCTAssertEqual(view.markedResultCount(resultLevels[1]), 3, "\(variant)")
            XCTAssertEqual(view.spokenLabel(resultLevels[2]), "Level 3", "\(variant): a zero was said")
            XCTAssertNil(view.markedResultCount(resultLevels[2]), "\(variant): a zero was marked")
            XCTAssertEqual(view.spokenLabel(resultLevels[0]), "Level 1", "\(variant): an unknown count was said")
            XCTAssertNil(view.markedResultCount(resultLevels[0]), "\(variant): an unknown count was marked")
        }
    }

    /// The stepper shows one level at a time, so a marker on the level already
    /// in view says nothing — and what is not drawn is not said.
    func testTheStepperMarksNoLevel() {
        let view = KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .compactStepper, showResultCounts: true)
        XCTAssertNil(view.markedResultCount(resultLevels[1]))
        XCTAssertEqual(view.spokenLabel(resultLevels[1]), "Level 2")
    }

    /// A product that passes no words hears English, singular for one.
    func testTheCountIsSaidInEnglishUntilTheProductSaysOtherwise() {
        let one = KozmosFloorPresentation(id: "4", label: "Level 4", shortLabel: "4", resultCount: 1)
        let view = KozmosFloorSelector(floors: resultLevels + [one], selectedFloor: .constant("1"), showResultCounts: true)
        XCTAssertEqual(view.spokenLabel(resultLevels[1]), "Level 2, 3 results")
        XCTAssertEqual(view.spokenLabel(one), "Level 4, 1 result")
    }

    /// Where Level 2's square is in a list drawn with nothing selected: the
    /// control's 6pt padding, then 40pt squares 8pt apart.
    private func secondSquare(_ variant: KozmosFloorSelectorVariant) -> CGRect {
        let inset = KozmosDimensions.primitivesLayoutSpacing75
        let side = KozmosDimensions.primitivesLayoutSizing500
        let step = side + KozmosDimensions.primitivesLayoutSpacing100
        return variant == .verticalList
            ? CGRect(x: inset, y: inset + step, width: side, height: side)
            : CGRect(x: inset + step, y: inset, width: side, height: side)
    }

    /// Nothing selected, so the only theme blue drawn is the marker's.
    @MainActor
    private func drawList(
        _ variant: KozmosFloorSelectorVariant,
        scheme: ColorScheme = .light,
        direction: LayoutDirection = .leftToRight
    ) throws -> DrawnPixels {
        try DrawnPixels.draw(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"), variant: variant, showResultCounts: true)
                .environment(\.colorScheme, scheme)
                .environment(\.layoutDirection, direction)
        )
    }

    /// Drawn on Level 2 alone — not on the zero, not on the unknown — inside its
    /// button, flush in its trailing top corner: inside rather than proud of
    /// it, as React's is since c36a970d.
    @MainActor func testTheMarkerSitsInsideItsLevelsButtonAtTheTrailingTop() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for variant in [KozmosFloorSelectorVariant.verticalList, .horizontalList] {
            let drawn = try drawList(variant)
            let square = secondSquare(variant)
            let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "\(variant): no marker drawn")
            XCTAssertTrue(square.contains(marker), "\(variant): the marker \(marker) is not inside Level 2's square \(square)")
            XCTAssertEqual(marker.maxX, square.maxX, accuracy: 1, "\(variant): the marker is not at the trailing edge")
            XCTAssertEqual(marker.minY, square.minY, accuracy: 1, "\(variant): the marker is not at the top")
            XCTAssertEqual(marker.height, 16, accuracy: 1, "\(variant): the marker is not React's 16")
        }
    }

    /// Trailing is the left in Arabic: the marker mirrors with the layout.
    @MainActor func testTheMarkerMirrorsRightToLeft() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let drawn = try drawList(.verticalList, direction: .rightToLeft)
        let square = secondSquare(.verticalList)
        let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "no marker drawn")
        XCTAssertTrue(square.contains(marker), "the marker \(marker) is not inside Level 2's square \(square)")
        XCTAssertEqual(marker.minX, square.minX, accuracy: 1, "the marker did not move to the leading edge in Arabic")
        XCTAssertEqual(marker.minY, square.minY, accuracy: 1, "the marker is not at the top")
    }

    /// Dark takes the dark theme's primary for the fill and its ink for the
    /// count, from the tokens rather than a colour of the component's own.
    @MainActor func testTheMarkerTakesTheDarkThemesColours() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .dark)
        let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground1000, in: .dark)
        let drawn = try drawList(.verticalList, scheme: .dark)
        let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "no marker in the dark theme's primary")
        XCTAssertTrue(secondSquare(.verticalList).contains(marker))
        let middle = marker.insetBy(dx: marker.width / 4, dy: marker.height / 4)
        XCTAssertGreaterThan(drawn.count(in: middle, where: DrawnPixels.matches(ink, tolerance: 40)), 0,
                             "the count is not drawn in the dark theme's ink")
    }

    /// The marker is laid over its button: the levels do not move for it.
    @MainActor func testTheMarkerMovesNothing() throws {
        let plain = resultLevels.map { KozmosFloorPresentation(id: $0.id, label: $0.label, shortLabel: $0.shortLabel) }
        for variant in [KozmosFloorSelectorVariant.verticalList, .horizontalList] {
            let marked = try drawList(variant)
            let unmarked = try DrawnPixels.draw(KozmosFloorSelector(floors: plain, selectedFloor: .constant("none"), variant: variant, showResultCounts: true))
            XCTAssertEqual(marked.size, unmarked.size, "\(variant)")
        }
    }

    /// The stepper draws what it drew before there were counts, even on the
    /// level that holds them.
    @MainActor func testTheStepperDrawsNoMarker() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let plain = resultLevels.map { KozmosFloorPresentation(id: $0.id, label: $0.label, shortLabel: $0.shortLabel) }
        let marked = try DrawnPixels.draw(KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .compactStepper, showResultCounts: true))
        let unmarked = try DrawnPixels.draw(KozmosFloorSelector(floors: plain, selectedFloor: .constant("2"), variant: .compactStepper, showResultCounts: true))
        XCTAssertNil(marked.boundingBox(where: DrawnPixels.matches(primary)), "the stepper drew a marker")
        let difference = try XCTUnwrap(marked.largestDifference(from: unmarked), "the stepper changed size")
        XCTAssertLessThanOrEqual(difference, 2, "the stepper draws something new")
    }

    /// The switcher's open column is where a visitor chooses a level: it marks
    /// the levels that hold results, as the lists do — at a level's bottom
    /// trailing corner, because its top one is the visitor's dot's (decision
    /// 38). Its closed tile is the level in view and marks nothing, as the
    /// stepper does not.
    @MainActor func testTheOpenCollapsibleListMarksItsLevels() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        // No level is current, so the only primary drawn is the marker's; the
        // level with three results is the column's middle one.
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"), variant: .collapsible, showResultCounts: true, expanded: true)
        )
        let marker = try XCTUnwrap(drawn.boundingBox(whole, primary), "the open column marks no level")
        XCTAssertEqual(marker.height, 16, accuracy: 1)
        let level2 = slot(1, of: 3)
        XCTAssertTrue(level2.insetBy(dx: -1, dy: -1).contains(marker), "the marker \(marker) is not on Level 2 \(level2)")
        XCTAssertEqual(marker.maxX, level2.maxX, accuracy: 1, "the marker is not at the trailing edge")
        XCTAssertEqual(marker.maxY, level2.maxY, accuracy: 1, "the marker is not at the bottom")

        let closed = try await drawSwitcher(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .collapsible, showResultCounts: true)
        )
        XCTAssertNil(closed.boundingBox(whole, primary), "the closed tile drew a marker")
    }

    // MARK: - Row 79 (GAP-080): the SDK's level switcher (decision 38)

    /// Top floor first (decision 29).
    private let switcherLevels = [
        KozmosFloorPresentation(id: "2", label: "Second floor", shortLabel: "2F"),
        KozmosFloorPresentation(id: "1", label: "First floor", shortLabel: "1F"),
        KozmosFloorPresentation(id: "g", label: "Ground floor", shortLabel: "GF"),
    ]

    /// The frame the switcher is drawn in, parked in its bottom-trailing
    /// corner 16 in, as a map parks it.
    private let corner = CGSize(width: 320, height: 300)
    private var whole: CGRect { CGRect(origin: .zero, size: corner) }

    /// The map control's square (decision 40): the tile is one, and each of
    /// the column's levels takes its size.
    private let tileSide = KozmosDimensions.primitivesLayoutSizing600

    /// The closed tile: a map control's square, in that corner.
    private var tileRect: CGRect {
        CGRect(x: corner.width - 16 - tileSide, y: corner.height - 16 - tileSide, width: tileSide, height: tileSide)
    }

    /// Where the open column puts level `index` of `count`: a tile's size, 4
    /// apart, the last one over the tile itself.
    private func slot(_ index: Int, of count: Int) -> CGRect {
        tileRect.offsetBy(dx: 0, dy: -CGFloat(count - 1 - index) * (tileSide + 4))
    }

    /// The open column over the tile in that corner, as it is laid out: a
    /// tile wide and a tile per level, 4 apart and 4 around them.
    private func columnRect(levels count: Int, over tile: CGRect) -> CGRect {
        let height = CGFloat(count) * tileSide + CGFloat(count + 1) * 4
        return CGRect(x: tile.minX - 4, y: tile.maxY + 4 - height, width: tileSide + 8, height: height)
    }

    /// A drawing of the switcher, read back in points.
    private struct SwitcherDrawing {
        let color: (CGPoint) -> (r: UInt8, g: UInt8, b: UInt8)
        let boundingBox: (CGRect, (UInt8, UInt8, UInt8) -> Bool) -> CGRect?
        let count: (CGRect, (UInt8, UInt8, UInt8) -> Bool) -> Int
    }

    /// The switcher parked in the corner, drawn as a device draws it. On iOS
    /// its tile carries a UIKit element for VoiceOver, which `ImageRenderer`
    /// cannot draw — it puts SwiftUI's yellow placeholder in its place. The
    /// bounded popup also needs a settled geometry-preference pass and a real
    /// scroll view, so both platforms host the switcher before snapshotting.
    /// On white both ways
    /// unless a test asks for another backdrop: the map-control surface is
    /// the page's own and has no edge, so on white only its shadow shows, and
    /// a test that measures the surface draws it on black.
    @MainActor private func drawSwitcher<V: View>(
        _ view: V,
        direction: LayoutDirection = .leftToRight,
        backdrop: Color = .white
    ) async throws -> SwitcherDrawing {
        let content = VStack {
            Spacer()
            HStack {
                Spacer()
                view
            }
        }
        .padding(16)
        .frame(width: corner.width, height: corner.height)
        .background(backdrop)
        .environment(\.layoutDirection, direction)
        #if os(iOS)
        // The popup is measured against its live window, so settle layout before
        // reading pixels (an immediate detached snapshot has no window bounds).
        let window = Window(frame: CGRect(origin: .zero, size: corner))
        let controller = UIHostingController(rootView: content)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.frame = window.bounds
        await settle()
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { window.layer.render(in: $0.cgContext) }
        let pixels = try RenderedPixels(image, pointWidth: corner.width)
        window.isHidden = true
        return SwitcherDrawing(
            color: { pixels.color(at: $0) },
            boundingBox: { pixels.boundingBox(in: $0, where: $1) },
            count: { pixels.count(in: $0, where: $1) }
        )
        #else
        let host = NSHostingView(rootView: content)
        let window = NSWindow(contentRect: CGRect(origin: .zero, size: corner),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = host
        window.orderFront(nil)
        defer { window.close() }
        // Allow preferences, scrolling to the selected level, and rendering
        // to settle in the same host the macOS control actually uses.
        for _ in 0..<4 {
            host.layoutSubtreeIfNeeded()
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        // Pin 2x like ImageRenderer and the iOS snapshots, independent of the
        // runner's attached display (CI may be 1x). Keep the logical size.
        let bitmap = try XCTUnwrap(NSBitmapImageRep(
            bitmapDataPlanes: nil, pixelsWide: Int(corner.width * 2), pixelsHigh: Int(corner.height * 2),
            bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
            colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0))
        bitmap.size = corner
        host.cacheDisplay(in: host.bounds, to: bitmap)
        let image = try XCTUnwrap(bitmap.cgImage)
        let pixels = try DrawnPixels(image, scale: CGFloat(image.width) / corner.width)
        return SwitcherDrawing(
            color: { let p = pixels.pixel(at: $0); return (p.r, p.g, p.b) },
            boundingBox: { region, matches in pixels.boundingBox(in: region) { r, g, b, _ in matches(r, g, b) } },
            count: { region, matches in pixels.count(in: region) { r, g, b, _ in matches(r, g, b) } }
        )
        #endif
    }

    /// Close to a token as the light theme draws it: within 6 a level, so the
    /// old list's theme-500 fill, up to 10 levels from the theme's primary, is
    /// not taken for it, and a snapshot's colour conversion still is.
    @MainActor private func near(_ color: Color, tolerance: Int = 6) throws -> (UInt8, UInt8, UInt8) -> Bool {
        let token = try DrawnPixels.resolved(color, in: .light)
        return { r, g, b in
            abs(Int(r) - Int(token.r)) <= tolerance
                && abs(Int(g) - Int(token.g)) <= tolerance
                && abs(Int(b) - Int(token.b)) <= tolerance
        }
    }

    /// At rest the switcher is one map control — the SDK's level switcher's
    /// tile — not a panel around a filled square. It is drawn by the map
    /// control itself, so it follows the shared map-control surface wherever
    /// that goes: drawn in the same place as a `KozmosMapControlButton`, every
    /// point of it and of its shadow is the map control's but its mark, on
    /// white, where the shadow shows, and on black, where the surface does.
    @MainActor func testTheClosedSwitcherIsOneMapControlTile() async throws {
        // The level and its new availability cues occupy a 24 by 32 mark.
        // Everything outside that mark, including the entire surface edge
        // and shadow, must still match the shared map control exactly.
        let mark = CGRect(x: tileRect.midX - 12, y: tileRect.midY - 16, width: 24, height: 32)
        let around = tileRect.insetBy(dx: -40, dy: -40).intersection(whole)
        for backdrop in [Color.white, Color.black] {
            let tile = try await drawSwitcher(
                KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible),
                backdrop: backdrop
            )
            let control = try await drawSwitcher(KozmosMapControlButton(label: "Zoom in", systemImage: "plus") {},
                                                 backdrop: backdrop)
            var largest = 0, at = CGPoint.zero
            for y in stride(from: around.minY + 0.25, to: around.maxY, by: 0.5) {
                for x in stride(from: around.minX + 0.25, to: around.maxX, by: 0.5) {
                    let point = CGPoint(x: x, y: y)
                    guard !mark.contains(point) else { continue }
                    let a = tile.color(point), b = control.color(point)
                    let difference = max(abs(Int(a.r) - Int(b.r)), abs(Int(a.g) - Int(b.g)), abs(Int(a.b) - Int(b.b)))
                    if difference > largest { largest = difference; at = point }
                }
            }
            XCTAssertLessThanOrEqual(largest, 2, "on \(backdrop) the switcher is not drawn as a map control is: \(largest) at \(at)")
            XCTAssertNil(tile.boundingBox(whole, try near(KozmosColors.primitivesColorsTheme500)),
                         "the closed switcher is filled with the theme")
        }
    }

    @MainActor func testAvailabilityCuesAreDrawnWithoutGrowingTheTile() async throws {
        let upper = CGRect(x: tileRect.midX - 9, y: tileRect.midY - 16, width: 18, height: 7)
        let lower = CGRect(x: tileRect.midX - 9, y: tileRect.midY + 9, width: 18, height: 7)
        let ink: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in max(r, g, b) < 140 }
        for (selected, up, down) in [("2", false, true), ("1", true, true), ("g", true, false)] {
            let drawn = try await drawSwitcher(
                KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant(selected), variant: .collapsible)
            )
            XCTAssertEqual(drawn.count(upper, ink) > 0, up, "up cue for \(selected)")
            XCTAssertEqual(drawn.count(lower, ink) > 0, down, "down cue for \(selected)")
        }
    }

    /// The open column wears the map-control surface its tile does (decision
    /// 40): no edge — at the middle of its sides and its top the surface runs
    /// to its rim — and the map controls' elevation: at the same distances
    /// above their top edges, the column's shadow is a map control's. Above
    /// it, where the tile's own shadow does not reach.
    @MainActor func testTheColumnWearsTheMapControlsSurface() async throws {
        let column = columnRect(levels: 3, over: tileRect)
        let onBlack = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible, expanded: true),
            backdrop: .black
        )
        let surface = try near(KozmosColors.primitivesColorsBackground0)
        for rim in [
            CGPoint(x: column.minX + 0.25, y: column.midY),
            CGPoint(x: column.maxX - 0.25, y: column.midY),
            CGPoint(x: column.midX, y: column.minY + 0.25),
        ] {
            let drawn = onBlack.color(rim)
            XCTAssertTrue(surface(drawn.r, drawn.g, drawn.b), "the column draws an edge at \(rim): \(drawn)")
        }
        let open = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible, expanded: true)
        )
        let control = try await drawSwitcher(KozmosMapControlButton(label: "Zoom in", systemImage: "plus") {})
        for above in [CGFloat(3), 6, 10] {
            let a = open.color(CGPoint(x: column.midX, y: column.minY - above))
            let b = control.color(CGPoint(x: tileRect.midX, y: tileRect.minY - above))
            let difference = max(abs(Int(a.r) - Int(b.r)), abs(Int(a.g) - Int(b.g)), abs(Int(a.b) - Int(b.b)))
            XCTAssertLessThanOrEqual(difference, 3,
                                     "\(above) above it the column's shadow is \(a), a map control's \(b)")
        }
    }

    /// Opened, the tile grows into a column of every level over itself: the
    /// column's bottom level lies where the tile was, the column reaching past
    /// it by its 4pt inset, one tile wide — each level its short label, as the
    /// tile shows it, and no name beside it. Measured by its surface, drawn on
    /// black: it has no edge.
    @MainActor func testTheTileGrowsIntoAColumnOverItself() async throws {
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible, expanded: true),
            backdrop: .black
        )
        let column = try XCTUnwrap(drawn.boundingBox(whole, try near(KozmosColors.primitivesColorsBackground0)),
                                   "no column drawn")
        XCTAssertEqual(column.maxX, tileRect.maxX + 4, accuracy: 1, "the column's trailing edge: \(column)")
        XCTAssertEqual(column.maxY, tileRect.maxY + 4, accuracy: 1, "the column's bottom edge: \(column)")
        XCTAssertEqual(column.width, tileSide + 8, accuracy: 1.5, "the column is not one tile wide: \(column)")
        XCTAssertEqual(column.height, 3 * tileSide + 2 * 4 + 8, accuracy: 1.5,
                       "the column does not hold three tiles: \(column)")
    }

    /// The current level is outlined in the theme's primary — the board's
    /// active floor — where the old list filled its square; no other level is.
    @MainActor func testTheColumnOutlinesTheCurrentLevel() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible, expanded: true)
        )
        func outlined(_ level: CGRect) -> Bool {
            // The middles of its four sides, just inside.
            [
                CGRect(x: level.midX - 6, y: level.minY, width: 12, height: 1.5),
                CGRect(x: level.midX - 6, y: level.maxY - 1.5, width: 12, height: 1.5),
                CGRect(x: level.minX, y: level.midY - 6, width: 1.5, height: 12),
                CGRect(x: level.maxX - 1.5, y: level.midY - 6, width: 1.5, height: 12),
            ].allSatisfy { drawn.count($0, primary) > 0 }
        }
        XCTAssertTrue(outlined(slot(1, of: 3)), "the current level is not outlined")
        XCTAssertFalse(outlined(slot(0, of: 3)), "the second floor is outlined")
        XCTAssertFalse(outlined(slot(2, of: 3)), "the ground floor is outlined")
        // Not filled: inside each level, between its edge and its label, where
        // the old list's fill was — not anywhere, since an outline's softened
        // edge comes within a few levels of the theme's lighter step.
        let fill = try near(KozmosColors.primitivesColorsTheme500)
        for index in 0..<3 {
            let level = slot(index, of: 3)
            let inside = CGRect(x: level.minX + 3, y: level.midY - 3, width: 6, height: 6)
            XCTAssertEqual(drawn.count(inside, fill), 0, "level \(index) is filled with the theme")
        }
    }

    /// Right to left the column keeps to the tile's trailing edge — its left —
    /// and the visitor's dot moves to each level's left top corner with it.
    @MainActor func testTheColumnMirrorsRightToLeft() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible,
                                userFloor: "2", expanded: true),
            direction: .rightToLeft,
            backdrop: .black
        )
        let tile = CGRect(x: 16, y: corner.height - 16 - tileSide, width: tileSide, height: tileSide)
        let column = try XCTUnwrap(drawn.boundingBox(whole, try near(KozmosColors.primitivesColorsBackground0)),
                                   "no column drawn")
        XCTAssertEqual(column.minX, tile.minX - 4, accuracy: 1, "the column is not on the tile's trailing edge: \(column)")
        XCTAssertEqual(column.maxY, tile.maxY + 4, accuracy: 1, "the column's bottom edge: \(column)")
        let top = tile.offsetBy(dx: 0, dy: -2 * (tileSide + 4))
        XCTAssertGreaterThan(drawn.count(CGRect(x: top.minX, y: top.minY, width: 16, height: 16), primary), 0,
                             "the dot is not at the level's left top corner")
        XCTAssertEqual(drawn.count(CGRect(x: top.maxX - 16, y: top.minY, width: 16, height: 16), primary), 0,
                       "the dot stayed on the right")
    }

    /// The level the visitor is on (decision 38): the closed tile carries the
    /// dot only while it shows that level, and never without one.
    @MainActor func testTheTileMarksTheVisitorsLevelOnlyWhileItShowsIt() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        let dotCorner = CGRect(x: tileRect.maxX - 16, y: tileRect.minY, width: 16, height: 16)
        func dotted(selected: String, userFloor: String?) async throws -> Bool {
            let drawn = try await drawSwitcher(
                KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant(selected), variant: .collapsible,
                                    userFloor: userFloor)
            )
            return drawn.count(dotCorner, primary) > 0
        }
        let onTheirLevel = try await dotted(selected: "g", userFloor: "g")
        XCTAssertTrue(onTheirLevel, "the tile on the visitor's level has no dot")
        let elsewhere = try await dotted(selected: "1", userFloor: "g")
        XCTAssertFalse(elsewhere, "the tile marks the visitor's level while showing another")
        let unknown = try await dotted(selected: "g", userFloor: nil)
        XCTAssertFalse(unknown, "the tile draws a dot with no visitor's level")
    }

    /// In the open column the dot is on the visitor's level, whichever level
    /// is shown, and on no other.
    @MainActor func testTheColumnMarksTheVisitorsLevelWhicheverIsShown() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible,
                                userFloor: "2", expanded: true)
        )
        func dotCorner(_ level: CGRect) -> CGRect { CGRect(x: level.maxX - 16, y: level.minY, width: 16, height: 16) }
        XCTAssertGreaterThan(drawn.count(dotCorner(slot(0, of: 3)), primary), 0, "the visitor's level has no dot")
        XCTAssertEqual(drawn.count(dotCorner(slot(2, of: 3)), primary), 0, "the ground floor has a dot")
    }

    /// A result count and the dot on one level keep apart: the dot at the top
    /// trailing corner, the count at the bottom, a clear band between them.
    @MainActor func testTheDotAndTheCountKeepApart() async throws {
        let primary = try near(KozmosColors.primitivesColorsTheme600)
        let levels = [KozmosFloorPresentation(id: "2", label: "Second floor", shortLabel: "2F", resultCount: 3)]
            + switcherLevels.dropFirst()
        let drawn = try await drawSwitcher(
            KozmosFloorSelector(floors: levels, selectedFloor: .constant("1"), variant: .collapsible, showResultCounts: true,
                                userFloor: "2", expanded: true)
        )
        let level = slot(0, of: 3)
        let trailing = level.maxX - 16
        XCTAssertGreaterThan(drawn.count(CGRect(x: trailing, y: level.minY, width: 16, height: 15), primary), 0,
                             "no dot at the top")
        XCTAssertGreaterThan(drawn.count(CGRect(x: trailing, y: level.maxY - 16, width: 16, height: 16), primary), 0,
                             "no count at the bottom")
        XCTAssertEqual(drawn.count(CGRect(x: trailing, y: level.minY + 15, width: 16, height: 12), primary), 0,
                       "the dot and the count run into each other")
    }

    /// What VoiceOver hears for a level in the column: its name, the visitor's
    /// level in the product's words, then its count. Only the switcher marks
    /// the visitor's level, so only it says so.
    func testTheVisitorsLevelIsSaidWithItsName() {
        let levels = [KozmosFloorPresentation(id: "2", label: "Second floor", shortLabel: "2F", resultCount: 3)]
            + switcherLevels.dropFirst()
        let switcher = KozmosFloorSelector(floors: levels, selectedFloor: .constant("1"), variant: .collapsible, showResultCounts: true, userFloor: "2")
        XCTAssertEqual(switcher.spokenLabel(levels[0]), "Second floor, your level, 3 results")
        XCTAssertEqual(switcher.spokenLabel(levels[1]), "First floor")
        let german = KozmosFloorSelector(floors: levels, selectedFloor: .constant("1"), variant: .collapsible, showResultCounts: true,
                                         userFloor: "g", userFloorLabel: "Ihre Ebene")
        XCTAssertEqual(german.spokenLabel(levels[2]), "Ground floor, Ihre Ebene")
        let list = KozmosFloorSelector(floors: levels, selectedFloor: .constant("1"), variant: .verticalList, showResultCounts: true, userFloor: "2")
        XCTAssertEqual(list.spokenLabel(levels[0]), "Second floor, 3 results", "a list says a dot it does not draw")
    }

    /// Both public initialisers take the closed tile's hint in the product's
    /// words, and keep the English it was until the product passes its own.
    func testBothInitialisersTakeTheTilesHint() {
        let presented = KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible,
                                            expandHint: "Zeigt alle Ebenen")
        XCTAssertEqual(presented.expandHint, "Zeigt alle Ebenen")
        let named = KozmosFloorSelector(floors: ["2", "1"], selectedFloor: .constant("1"), variant: .collapsible,
                                        expandHint: "Zeigt alle Ebenen")
        XCTAssertEqual(named.expandHint, "Zeigt alle Ebenen")
        XCTAssertEqual(KozmosFloorSelector(floors: ["2", "1"], selectedFloor: .constant("1")).expandHint, "Shows every level")
    }

    /// The switcher example in FloorSelector.mdx, compiled here as it is
    /// written there: the docs' native snippets are compiled nowhere else.
    func testTheDocsSwitcherExampleIsTheSwitcher() {
        let view =
            KozmosFloorSelector(
                floors: [
                    KozmosFloorPresentation(id: "L2", label: "Level 2", shortLabel: "L2"),
                    KozmosFloorPresentation(id: "L1", label: "Level 1", shortLabel: "L1"),
                    KozmosFloorPresentation(id: "G", label: "Ground", shortLabel: "G")
                ],
                selectedFloor: .constant("L1"),
                variant: .collapsible, showResultCounts: true,
                userFloor: "G",
                userFloorLabel: String(localized: "your level"),
                expandHint: String(localized: "Shows every level")
            )
        XCTAssertEqual(view.variant, .collapsible)
        XCTAssertEqual(view.spokenLabel(view.floors[2]), "Ground, your level")
        XCTAssertEqual(view.tileLabel, "Level 1")
        XCTAssertEqual(view.expandHint, "Shows every level")
    }

    #if os(iOS)
    // MARK: Hosted in a window, where VoiceOver finds it

    /// No safe areas, as the snapshot strategy's own window has none.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    /// The switcher in a window of its own, parked 16 in from the bottom
    /// trailing corner, as a map parks it — or from the top trailing one.
    @MainActor private func host<V: View>(_ view: V, parkedAtTop: Bool = false, backdrop: Color = .clear) async -> UIWindow {
        let window = Window(frame: CGRect(origin: .zero, size: corner))
        window.rootViewController = UIHostingController(
            rootView: VStack {
                if !parkedAtTop { Spacer() }
                HStack {
                    Spacer()
                    view
                }
                if parkedAtTop { Spacer() }
            }
            .padding(16)
            .frame(width: corner.width, height: corner.height)
            .background(backdrop)
        )
        window.makeKeyAndVisible()
        await settle()
        return window
    }

    @MainActor private final class PopupRegionModel: ObservableObject {
        @Published var available = true
    }

    private struct RegionSwitcher: View {
        @ObservedObject var model: PopupRegionModel
        var body: some View {
            KozmosFloorSelector(floors: ["2", "1", "G"], selectedFloor: .constant("1"), variant: .collapsible)
                .environment(\.kozmosMapPopupRegion, KozmosMapPopupRegion(
                    bounds: CGRect(x: 0, y: 0, width: 320, height: 300), available: model.available
                ))
        }
    }

    @MainActor func testPopupDismissesWhenItsShellRegionDisappearsAndDoesNotReopen() async throws {
        let model = PopupRegionModel()
        let window = await host(RegionSwitcher(model: model))
        defer { window.isHidden = true }
        let tile = try XCTUnwrap(accessibleView(named: "1", in: window) as? KozmosFloorSwitcherElement.ElementView)
        XCTAssertTrue(tile.accessibilityActivate())
        await settle()
        XCTAssertTrue(tile.isExpanded)
        model.available = false
        await settle()
        XCTAssertFalse(tile.isExpanded)
        XCTAssertEqual(tile.columnFrame, .zero)
        model.available = true
        await settle()
        XCTAssertFalse(tile.isExpanded)
    }

    @MainActor private func settle() async {
        for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
    }

    /// The view assistive technology is given for a name, found as UIKit
    /// finds it — a SwiftUI element is not a view of its own.
    private func accessibleView(named name: String, in view: UIView) -> UIView? {
        if view.isAccessibilityElement, view.accessibilityLabel == name { return view }
        for subview in view.subviews {
            if let found = accessibleView(named: name, in: subview) { return found }
        }
        return nil
    }

    /// VoiceOver hears the tile as a button named by its level, and whether
    /// its column is open — `accessibilityExpandedStatus`, which SwiftUI has
    /// no modifier for: its own `DisclosureGroup` reports none on iOS 26.5
    /// (measured, 2026-09-28). Activating the tile opens the column and the
    /// escape gesture closes it; closed, the tile leaves the gesture alone.
    @MainActor func testTheTileSaysWhetherItsListIsOpen() async throws {
        let window = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible))
        defer { window.isHidden = true }
        let tile = try XCTUnwrap(accessibleView(named: "First floor", in: window), "VoiceOver finds no tile named by its level")
        XCTAssertTrue(tile.accessibilityTraits.contains(.button))
        if #available(iOS 18.0, *) {
            XCTAssertEqual(tile.accessibilityExpandedStatus, .collapsed, "the closed tile does not say it is closed")
        }
        XCTAssertFalse(tile.accessibilityPerformEscape(), "a closed tile took the escape gesture")

        XCTAssertTrue(tile.accessibilityActivate(), "activating the tile did nothing")
        await settle()
        if #available(iOS 18.0, *) {
            XCTAssertEqual(tile.accessibilityExpandedStatus, .expanded, "the tile does not say its column is open")
        }
        XCTAssertTrue(tile.accessibilityPerformEscape(), "the escape gesture did not close the column")
        await settle()
        if #available(iOS 18.0, *) {
            XCTAssertEqual(tile.accessibilityExpandedStatus, .collapsed, "the column did not close")
        }
    }

    @MainActor func testManyFloorsStayInsideTheHostWindow() async throws {
        let floors = (0..<40).map { KozmosFloorPresentation(id: String($0), label: "Level \($0)", shortLabel: String($0)) }
        let window = await host(KozmosFloorSelector(floors: floors, selectedFloor: .constant("20"), variant: .collapsible))
        defer { window.isHidden = true }
        let tile = try XCTUnwrap(accessibleView(named: "Level 20", in: window) as? KozmosFloorSwitcherElement.ElementView)
        XCTAssertTrue(tile.accessibilityActivate())
        await settle()
        let frame = tile.convert(tile.columnFrame, to: window)
        XCTAssertGreaterThanOrEqual(frame.minY, 0)
        XCTAssertLessThanOrEqual(frame.maxY, corner.height)
        XCTAssertGreaterThan(frame.height, tile.bounds.height)
    }

    /// The hint VoiceOver hears on the closed tile — what activating it does —
    /// is the product's words, `expandHint`, and "Shows every level" until it
    /// passes its own. On iOS 16 and 17, which report no expanded state, it
    /// is the only sign that the tile opens a column. None while it is open.
    @MainActor func testTheTilesHintIsTheProductsWords() async throws {
        let english = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible))
        defer { english.isHidden = true }
        let tile = try XCTUnwrap(accessibleView(named: "First floor", in: english), "VoiceOver finds no tile named by its level")
        XCTAssertEqual(tile.accessibilityHint, "Shows every level", "the tile's hint is not the English it was")

        let german = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible,
                                                    expandHint: "Zeigt alle Ebenen"))
        defer { german.isHidden = true }
        let translated = try XCTUnwrap(accessibleView(named: "First floor", in: german), "VoiceOver finds no tile named by its level")
        XCTAssertEqual(translated.accessibilityHint, "Zeigt alle Ebenen", "the tile's hint is not the product's words")
        XCTAssertTrue(translated.accessibilityActivate())
        await settle()
        XCTAssertNil(translated.accessibilityHint, "the open tile still says it shows every level")
    }

    /// The tile says the visitor's level with its own while it shows it, in
    /// the product's words, and says nothing of it while it shows another.
    @MainActor func testTheTileSaysWhenItShowsTheVisitorsLevel() async throws {
        let theirs = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("g"), variant: .collapsible,
                                                    userFloor: "g", userFloorLabel: "Ihre Ebene"))
        defer { theirs.isHidden = true }
        XCTAssertNotNil(accessibleView(named: "Ground floor, Ihre Ebene", in: theirs),
                        "the tile on the visitor's level does not say so")
        let another = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible,
                                                     userFloor: "g"))
        defer { another.isHidden = true }
        XCTAssertNotNil(accessibleView(named: "First floor", in: another),
                        "the tile says the visitor's level while showing another")
    }

    /// A tap anywhere outside the open column closes it. The switcher watches
    /// the window for one only while its column is open, and lets the tap go
    /// on to whatever it landed on — a tap on the map still reaches the map.
    @MainActor func testATapOutsideIsWatchedForOnlyWhileTheListIsOpen() async throws {
        let window = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible))
        defer { window.isHidden = true }
        let before = window.gestureRecognizers ?? []
        let tile = try XCTUnwrap(accessibleView(named: "First floor", in: window), "VoiceOver finds no tile named by its level")
        XCTAssertTrue(tile.accessibilityActivate())
        await settle()
        let added = (window.gestureRecognizers ?? []).filter { recognizer in !before.contains { $0 === recognizer } }
        XCTAssertEqual(added.count, 1, "the open column does not watch for a tap outside")
        let watcher = try XCTUnwrap(added.first as? UITapGestureRecognizer)
        XCTAssertFalse(watcher.cancelsTouchesInView, "a tap outside is taken from what it landed on")
        XCTAssertTrue(tile.accessibilityPerformEscape())
        await settle()
        XCTAssertFalse((window.gestureRecognizers ?? []).contains { $0 === watcher }, "still watching after the column closed")
    }

    /// What the watch takes for a tap outside, in the tile's own coordinates —
    /// not the tile, not the column over it, but the map beside them — and
    /// that such a tap closes the column. No UIKit touch can be made in a
    /// test, so the watch's decision and its action are called as UIKit
    /// would call them.
    @MainActor func testATapOutsideTheColumnClosesIt() async throws {
        let window = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible))
        defer { window.isHidden = true }
        let element = try XCTUnwrap(
            accessibleView(named: "First floor", in: window) as? KozmosFloorSwitcherElement.ElementView,
            "VoiceOver finds no tile named by its level"
        )
        XCTAssertTrue(element.accessibilityActivate())
        await settle()
        // The column reaches from 4 beyond the tile's sides to 108 above it.
        XCTAssertFalse(element.isOutside(CGPoint(x: 22, y: 22)), "a tap on the tile is taken for one outside")
        XCTAssertFalse(element.isOutside(CGPoint(x: 22, y: -60)), "a tap on the column is taken for one outside")
        XCTAssertTrue(element.isOutside(CGPoint(x: -100, y: 22)), "a tap on the map beside it is not taken for one outside")
        element.tapped()
        await settle()
        if #available(iOS 18.0, *) {
            XCTAssertEqual(element.accessibilityExpandedStatus, .collapsed, "a tap outside left the column open")
        }
    }

    /// A hardware keyboard's Escape closes the open column: while it is open
    /// the window offers Escape as a key command, and not while it is closed.
    @MainActor func testEscapeOnAKeyboardIsOfferedWhileTheColumnIsOpen() async throws {
        let window = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible))
        defer { window.isHidden = true }
        func offered() -> Bool {
            var responder: UIResponder? = window.rootViewController
            var commands: [UIKeyCommand] = []
            while let current = responder {
                commands += current.keyCommands ?? []
                responder = current.next
            }
            return commands.contains { $0.input == UIKeyCommand.inputEscape }
        }
        XCTAssertFalse(offered(), "Escape is taken while the column is closed")
        let tile = try XCTUnwrap(accessibleView(named: "First floor", in: window), "VoiceOver finds no tile named by its level")
        XCTAssertTrue(tile.accessibilityActivate())
        await settle()
        XCTAssertTrue(offered(), "Escape is not offered while the column is open")
    }

    /// The column's levels take the tile's measured size, not the map
    /// control's usual square: at the largest text the tile grows taller, and
    /// the column opened from it grows with it, its bottom level still on the
    /// tile. Hosted, so the tile is measured before the column opens, as a
    /// visitor opens it.
    @MainActor func testTheColumnTakesTheTilesMeasuredSize() async throws {
        let window = await host(
            KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible)
                .environment(\.dynamicTypeSize, .accessibility3),
            backdrop: .black
        )
        defer { window.isHidden = true }
        let element = try XCTUnwrap(
            accessibleView(named: "First floor", in: window) as? KozmosFloorSwitcherElement.ElementView,
            "VoiceOver finds no tile named by its level"
        )
        let tile = element.convert(element.bounds, to: window)
        XCTAssertGreaterThan(tile.height, tileSide + 2, "the tile did not grow with the text: \(tile)")
        XCTAssertTrue(element.accessibilityActivate())
        for _ in 0..<4 { await settle() }
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { window.layer.render(in: $0.cgContext) }
        let drawn = try RenderedPixels(image, pointWidth: corner.width)
        let column = try XCTUnwrap(drawn.boundingBox(in: whole, where: try near(KozmosColors.primitivesColorsBackground0)),
                                   "no column drawn")
        XCTAssertEqual(column.height, 3 * tile.height + 2 * 4 + 8, accuracy: 1.5,
                       "the column's levels are not the tile's size: \(column) over \(tile)")
        XCTAssertEqual(column.maxY, tile.maxY + 4, accuracy: 1, "the column's bottom level is not on the tile: \(column)")
    }

    /// Parked at the top of the map, where the column has no room to grow up,
    /// it grows down over the tile instead — its top level on the tile — as
    /// React's and Compose's do, and the watch for a tap outside follows it.
    /// Drawn from the window itself once the column has sprung open.
    @MainActor func testWithNoRoomAboveTheColumnGrowsDownOverTheTile() async throws {
        let window = await host(KozmosFloorSelector(floors: switcherLevels, selectedFloor: .constant("1"), variant: .collapsible),
                                parkedAtTop: true, backdrop: .black)
        defer { window.isHidden = true }
        let element = try XCTUnwrap(
            accessibleView(named: "First floor", in: window) as? KozmosFloorSwitcherElement.ElementView,
            "VoiceOver finds no tile named by its level"
        )
        XCTAssertTrue(element.accessibilityActivate())
        for _ in 0..<4 { await settle() }
        let image = UIGraphicsImageRenderer(bounds: window.bounds).image { window.layer.render(in: $0.cgContext) }
        let drawn = try RenderedPixels(image, pointWidth: corner.width)
        let tile = CGRect(x: corner.width - 16 - tileSide, y: 16, width: tileSide, height: tileSide)
        // By its surface, on black: it has no edge.
        let column = try XCTUnwrap(drawn.boundingBox(in: whole, where: try near(KozmosColors.primitivesColorsBackground0)),
                                   "no column drawn")
        XCTAssertEqual(column.minY, tile.minY - 4, accuracy: 1, "the column does not reach down from the tile: \(column)")
        XCTAssertEqual(column.height, 3 * tileSide + 2 * 4 + 8, accuracy: 1.5, "the column is cut short: \(column)")
        XCTAssertEqual(column.maxX, tile.maxX + 4, accuracy: 1, "the column's trailing edge: \(column)")
        // Below the tile is the column now; above it, the map.
        XCTAssertFalse(element.isOutside(CGPoint(x: 22, y: 100)), "a tap on the column is taken for one outside")
        XCTAssertTrue(element.isOutside(CGPoint(x: 22, y: -60)), "a tap on the map above is not taken for one outside")
    }
    #endif

    #if os(iOS)
    /// Row 69: the marker grows with the text, as the square it sits in does —
    /// at the largest sizes a 16pt marker would be a speck on a square more
    /// than twice as big. iOS only: Dynamic Type does not reach
    /// `@ScaledMetric` on a Mac.
    @MainActor func testTheMarkerGrowsWithTheText() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let drawn = try DrawnPixels.draw(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"), showResultCounts: true)
                .environment(\.dynamicTypeSize, .accessibility3)
        )
        let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "no marker drawn")
        XCTAssertGreaterThan(marker.height, 20, "the marker kept its size at the largest text")
        XCTAssertLessThanOrEqual(marker.maxX, drawn.size.width - KozmosDimensions.primitivesLayoutSpacing75,
                                 "the marker grew out of its button")
    }
    #endif
}
