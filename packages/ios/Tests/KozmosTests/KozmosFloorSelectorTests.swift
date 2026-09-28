import XCTest
import SwiftUI
@testable import Kozmos

/// Property assertions on the FloorSelector's API.
///
/// The component used to take `[String]` only, which forced a venue to make its
/// canonical floor IDs double as the visible labels. These cover the
/// presentation-based API and the stepper's handling of closed levels.
final class KozmosFloorSelectorTests: XCTestCase {
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

    func testUnknownSelectionFallsBackToTheFirstFloor() {
        let view = KozmosFloorSelector(floors: levels, selectedFloor: .constant("mezzanine"))
        XCTAssertEqual(view.selectedIndex, 0)
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

    /// The count joins the level's own label, in the product's words, on every
    /// layout that lists the levels. Zero is not "unknown", and neither is
    /// marked: a level with no results reads as itself.
    func testTheListsSayWhereTheResultsAre() {
        for variant in [KozmosFloorSelectorVariant.verticalList, .horizontalList, .collapsible] {
            let view = KozmosFloorSelector(
                floors: resultLevels,
                selectedFloor: .constant("1"),
                variant: variant,
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
        let view = KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .compactStepper)
        XCTAssertNil(view.markedResultCount(resultLevels[1]))
        XCTAssertEqual(view.spokenLabel(resultLevels[1]), "Level 2")
    }

    /// A product that passes no words hears English, singular for one.
    func testTheCountIsSaidInEnglishUntilTheProductSaysOtherwise() {
        let one = KozmosFloorPresentation(id: "4", label: "Level 4", shortLabel: "4", resultCount: 1)
        let view = KozmosFloorSelector(floors: resultLevels + [one], selectedFloor: .constant("1"))
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
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"), variant: variant)
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
            let unmarked = try DrawnPixels.draw(KozmosFloorSelector(floors: plain, selectedFloor: .constant("none"), variant: variant))
            XCTAssertEqual(marked.size, unmarked.size, "\(variant)")
        }
    }

    /// The stepper draws what it drew before there were counts, even on the
    /// level that holds them.
    @MainActor func testTheStepperDrawsNoMarker() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let plain = resultLevels.map { KozmosFloorPresentation(id: $0.id, label: $0.label, shortLabel: $0.shortLabel) }
        let marked = try DrawnPixels.draw(KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .compactStepper))
        let unmarked = try DrawnPixels.draw(KozmosFloorSelector(floors: plain, selectedFloor: .constant("2"), variant: .compactStepper))
        XCTAssertNil(marked.boundingBox(where: DrawnPixels.matches(primary)), "the stepper drew a marker")
        let difference = try XCTUnwrap(marked.largestDifference(from: unmarked), "the stepper changed size")
        XCTAssertLessThanOrEqual(difference, 2, "the stepper draws something new")
    }

    /// The collapsible's open list is a list of every level, which is where a
    /// visitor chooses one: it marks them as the lists do. Its closed pill is
    /// the level in view and marks nothing, as the stepper does not.
    @MainActor func testTheOpenCollapsibleListMarksItsLevels() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let size = CGSize(width: 320, height: 240)
        let view = VStack {
            Spacer()
            HStack {
                Spacer()
                KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"), variant: .collapsible, expanded: true)
            }
        }
        .padding(16)
        .frame(width: size.width, height: size.height)
        let drawn = try DrawnPixels.draw(view)
        let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "the open list marks no level")
        XCTAssertEqual(marker.height, 16, accuracy: 1)
        let pillTop = size.height - 16 - KozmosDimensions.primitivesLayoutSizing500 - 12
        XCTAssertLessThan(marker.maxY, pillTop, "the marker is on the closed pill, not in the open list")

        let closed = try DrawnPixels.draw(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("2"), variant: .collapsible)
        )
        XCTAssertNil(closed.boundingBox(where: DrawnPixels.matches(primary)), "the closed pill drew a marker")
    }

    #if os(iOS)
    /// The open list names every level: "L2" alone told a visitor nothing the
    /// closed pill did not. Rendered: the list is wider than the pill, and
    /// its rows are wider than a square.
    @MainActor func testTheOpenCollapsibleListNamesEveryLevel() async throws {
        let floors = [
            KozmosFloorPresentation(id: "b:1", label: "First Floor", shortLabel: "L1"),
            KozmosFloorPresentation(id: "b:2", label: "Second Floor", shortLabel: "L2"),
        ]
        let size = CGSize(width: 320, height: 240)
        let view = VStack {
            Spacer()
            HStack {
                Spacer()
                KozmosFloorSelector(floors: floors, selectedFloor: .constant("b:2"), variant: .collapsible, expanded: true)
            }
        }
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: size)
        let control = KozmosDimensions.primitivesLayoutSizing500
        // The pill itself is hidden while the list is open; what is drawn above
        // the pill's row is the list.
        let list = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: size.width, height: size.height - 16 - control - 12),
                                                    where: RenderedPixels.isInk), "no open list drawn")
        XCTAssertGreaterThan(list.width, control * 2.5, "the open list is no wider than a column of squares: it carries no names")
        XCTAssertGreaterThan(list.maxX, size.width - 16 - control - 24, "the list is not anchored to the pill's trailing edge")
    }

    /// Row 69: the marker grows with the text, as the square it sits in does —
    /// at the largest sizes a 16pt marker would be a speck on a square more
    /// than twice as big. iOS only: Dynamic Type does not reach
    /// `@ScaledMetric` on a Mac.
    @MainActor func testTheMarkerGrowsWithTheText() throws {
        let primary = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let drawn = try DrawnPixels.draw(
            KozmosFloorSelector(floors: resultLevels, selectedFloor: .constant("none"))
                .environment(\.dynamicTypeSize, .accessibility3)
        )
        let marker = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(primary)), "no marker drawn")
        XCTAssertGreaterThan(marker.height, 20, "the marker kept its size at the largest text")
        XCTAssertLessThanOrEqual(marker.maxX, drawn.size.width - KozmosDimensions.primitivesLayoutSpacing75,
                                 "the marker grew out of its button")
    }
    #endif
}

