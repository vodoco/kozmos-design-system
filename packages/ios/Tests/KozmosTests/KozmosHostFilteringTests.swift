import XCTest
import SwiftUI
@testable import Kozmos

final class KozmosHostFilteringTests: XCTestCase {
    func testHostFilteringPreservesSynonymsAndRankingWithoutChangingLocalDefault() {
        let options = [KozmosListboxOption(value: "e2", label: "Elevator B"), KozmosListboxOption(value: "e1", label: "Elevator A")]
        let local = KozmosCombobox(inputValue: .constant("lift"), options: options)
        XCTAssertTrue(local.filteredOptions.isEmpty)
        let host = KozmosCombobox(inputValue: .constant("lift"), options: options, filterLocally: false)
        XCTAssertEqual(host.filteredOptions.map(\.value), ["e2", "e1"])
    }
}
