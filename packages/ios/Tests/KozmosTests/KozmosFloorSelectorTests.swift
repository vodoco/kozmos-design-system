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

    /// The defaults stay the words they were — React's read "Previous floor"
    /// and "Next floor", and a product that passes none hears nothing new here.
    func testTheStepperNamesDefaultToTheEnglishTheyWere() {
        let view = KozmosFloorSelector(floors: levels, selectedFloor: .constant("level-1"), variant: .compactStepper)
        XCTAssertEqual(view.stepperLabel(step: -1), "Floor up")
        XCTAssertEqual(view.stepperLabel(step: 1), "Floor down")
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
    #endif
}

