import XCTest
import Kozmos
@testable import KozmosPointrQA

/// Decisions 29 and 30 on PointrKit's levels. The selector lists the levels in
/// the order it is handed and stays controlled, so these are the host's rules.
final class FloorPolicyTests: XCTestCase {
    private func level(_ index: Int, _ name: String, short: String? = nil) -> SDKFloorPolicy.Level {
        .init(id: "terminal-b:\(index)", index: index, name: name, shortName: short ?? name)
    }

    /// PointrKit's array in no particular order, with two basements.
    private var terminal: [SDKFloorPolicy.Level] {
        [level(1, "Departures", short: "L1"), level(-2, "Parking 2", short: "P2"), level(0, "Arrivals", short: "G"),
         level(3, "Lounges", short: "L3"), level(-1, "Parking 1", short: "P1")]
    }

    func testLevelsAreListedTopFloorFirstWithBasementsLast() {
        XCTAssertEqual(SDKFloorPolicy.ordered(terminal).map(\.index), [3, 1, 0, -1, -2])
    }

    /// As text "L10" comes before "L2" and "B1" before both; the index decides.
    func testTheIndexDecidesTheOrderNotTheName() {
        let levels = [level(2, "L2"), level(10, "L10"), level(1, "L1"), level(-1, "B1")]
        XCTAssertEqual(SDKFloorPolicy.ordered(levels).map(\.name), ["L10", "L2", "L1", "B1"])
    }

    /// The selector gets the canonical ids, building and index, in the list's
    /// order: the full name for VoiceOver, the short one on the tile.
    func testTheSelectorGetsCanonicalIdsInTheListOrder() {
        let floors = SDKFloorPolicy.presentations(terminal)
        XCTAssertEqual(floors.map(\.id), ["terminal-b:3", "terminal-b:1", "terminal-b:0", "terminal-b:-1", "terminal-b:-2"])
        XCTAssertEqual(floors.map(\.shortLabel), ["L3", "L1", "G", "P1", "P2"])
        XCTAssertEqual(floors.first?.label, "Lounges")
    }

    /// Pointr's default level wins, even a basement.
    func testPointrsDefaultLevelWins() {
        let parking = level(-1, "Parking 1", short: "P1")
        XCTAssertEqual(SDKFloorPolicy.startLevel(terminal, sdkDefault: parking), parking)
    }

    /// With no default from the SDK, the ground level: index 0, not whatever
    /// the SDK happened to list first.
    func testWithoutADefaultTheGroundLevelIsChosen() {
        XCTAssertEqual(SDKFloorPolicy.startLevel(terminal, sdkDefault: nil)?.index, 0)
    }

    /// With neither, the order PointrKit documents for its own default
    /// continues: index 1, else the lowest level.
    func testWithoutAGroundLevelTheSDKsDocumentedOrderContinues() {
        let fromOne = [level(3, "L3"), level(1, "L1"), level(2, "L2")]
        XCTAssertEqual(SDKFloorPolicy.startLevel(fromOne, sdkDefault: nil)?.index, 1)
        let fromTwo = [level(4, "L4"), level(2, "L2"), level(3, "L3")]
        XCTAssertEqual(SDKFloorPolicy.startLevel(fromTwo, sdkDefault: nil)?.index, 2)
        let underground = [level(-1, "B1"), level(-3, "B3"), level(-2, "B2")]
        XCTAssertEqual(SDKFloorPolicy.startLevel(underground, sdkDefault: nil)?.index, -3)
    }

    func testABuildingWithoutLevelsHasNoStartLevel() {
        XCTAssertNil(SDKFloorPolicy.startLevel([], sdkDefault: nil))
        XCTAssertEqual(SDKFloorPolicy.presentations([]), [])
    }
}
