import SwiftUI
import XCTest
import SnapshotTesting
@testable import Kozmos

final class KozmosMapInfoPanelTests: XCTestCase {
    func testSafeDestinations() {
        for href in ["https://example.com", "http://example.com", "mailto:support@example.com", "tel:+4412345678"] {
            XCTAssertNotNil(KozmosMapInfoEntry(id: "x", label: "Link", href: href).destination, href)
        }
        for href in ["javascript:bad()", "data:text/html,bad", "/relative", "https://user:secret@example.com", "mailto:", "tel:"] {
            XCTAssertNil(KozmosMapInfoEntry(id: "x", label: "Link", href: href).destination, href)
        }
    }
    func testCompactPresentationAndDesktopReservation() {
        XCTAssertFalse(KozmosMapInfoLayout.isWide(width: 390))
        XCTAssertFalse(KozmosMapInfoLayout.isWide(width: 1103))
        XCTAssertTrue(KozmosMapInfoLayout.isWide(width: 1104))
        XCTAssertEqual(KozmosMapInfoLayout.panelWidth, 384)
    }
    #if os(iOS)
    @MainActor func testInformationPanelRendering() {
        let content = KozmosMapInfoContent(title: "About this map", introduction: "Explore Terminal 2 and find the places and services you need.", faqs: [.init(id: "floors", question: "How do I change floors?", answer: "Open the floor selector and choose a level.")], credits: [.init(id: "owner", label: "Indoor map data © Example venue")], links: [.init(id: "support", label: "Contact support", href: "mailto:support@example.com")], versions: [.init(id: "demo", label: "Example content", value: "Not a live SDK")])
        let panel = GeometryReader { geometry in ScrollView { KozmosMapInfoPanel(content: content, minimumHeight: geometry.size.height, onClose: {}) } }
        assertSnapshot(of: UIHostingController(rootView: panel), as: .image(on: .iPhone13))
    }
    @MainActor func testContentCanGrowAtAccessibilitySizesWithoutClippingFooter() {
        let content = KozmosMapInfoContent(title: "Information", introduction: String(repeating: "An introduction. ", count: 15), credits: [.init(id: "owner", label: "Indoor map data")], versions: [.init(id: "sdk", label: "SDK version", value: "10.11.0")])
        let host = UIHostingController(rootView: KozmosMapInfoPanel(content: content, onClose: {}).fixedSize(horizontal: false, vertical: true).environment(\.dynamicTypeSize, .accessibility3))
        let size = host.sizeThatFits(in: CGSize(width: 390, height: 10000))
        XCTAssertGreaterThan(size.height, 844)
        XCTAssertLessThanOrEqual(size.width, 390)
    }
    #endif
}
