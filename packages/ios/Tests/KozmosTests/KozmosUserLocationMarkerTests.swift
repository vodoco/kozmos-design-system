import XCTest
import SwiftUI
@testable import Kozmos

/// The marker's name, for a visitor who cannot see it.
///
/// It had none until row 67: VoiceOver passed over the visitor's own position
/// on the map. React called it "User location" in English whatever the
/// device's language; both platforms now take the product's word for it.
final class KozmosUserLocationMarkerTests: XCTestCase {
    func testTheProductNamesTheMarker() {
        XCTAssertEqual(KozmosUserLocationMarker(label: "Ihr Standort").label, "Ihr Standort")
    }

    func testTheNameDefaultsToEnglish() {
        XCTAssertEqual(KozmosUserLocationMarker().label, "User location")
        XCTAssertEqual(KozmosUserLocationMarker(heading: 90, showHeading: false).label, "User location")
    }
}
