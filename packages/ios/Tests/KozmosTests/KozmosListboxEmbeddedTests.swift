import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-271 (decision 186): an embedded Listbox, inside a Dialog, Popover or
/// Card, draws no box of its own: no surface, no edge, no corners and no
/// padding round its rows. Not embedded, it is drawn as before.
final class KozmosListboxEmbeddedTests: XCTestCase {
    private let options = [KozmosListboxOption(value: "acme", label: "Acme")]

    func testAnEmbeddedListDrawsNoBoxOfItsOwn() {
        let list = KozmosListbox(options: options, embedded: true)
        kozmosSameColour(list.surface, Color.clear)
        XCTAssertEqual(list.edgeWidth, 0)
        XCTAssertEqual(list.cornerRadius, 0)
        XCTAssertEqual(list.contentPadding, 0)
    }

    func testAListNotEmbeddedKeepsItsPanel() {
        let list = KozmosListbox(options: options)
        kozmosSameColour(list.surface, KozmosColors.primitivesColorsBackground0)
        XCTAssertEqual(list.edgeWidth, 1)
        XCTAssertEqual(list.cornerRadius, KozmosDimensions.semanticsRadiusControl)
        XCTAssertEqual(list.contentPadding, KozmosDimensions.primitivesLayoutSpacing50)
        // A released call with a trailing closure still compiles.
        _ = KozmosListbox(options: options) { _, _ in }
    }
}
