import XCTest
@testable import KozmosPointrQA

final class MapInformationTests: XCTestCase {
    func testUsesActualVenueAndExplicitVersionLabels() {
        let content = SDKMapInformation.content(venue: "Terminal E", appVersion: "1.0", build: "7", sdkVersion: "10.3.0")
        XCTAssertTrue(content.introduction?.contains("Terminal E") == true)
        XCTAssertEqual(content.versions.map(\.label), ["QA app version", "Pointr SDK version"])
        XCTAssertEqual(content.versions.map(\.value), ["1.0 (7)", "10.3.0"])
        XCTAssertTrue(content.credits.isEmpty, "Do not invent approved legal/provider copy")
        XCTAssertTrue(content.links.isEmpty, "Do not invent approved support/legal destinations")
    }
    func testOmitsMissingVersionsAndKeepsContentExplicitlyQA() {
        let content = SDKMapInformation.content(venue: nil, appVersion: nil, build: nil, sdkVersion: nil)
        XCTAssertTrue(content.versions.isEmpty)
        XCTAssertEqual(content.title, "About this QA map")
        XCTAssertFalse(content.introduction?.contains("nil") == true)
        XCTAssertEqual(Set(content.faqs.map(\.id)).count, content.faqs.count)
    }
}
