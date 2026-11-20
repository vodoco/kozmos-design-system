#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-131: the details card takes the product's own content, a place's QR
/// code on desktop and kiosk, drawn at the end of its body, inside the
/// card's padding and scroll, after everything Kozmos draws. The content is
/// the one magenta thing here.
final class KozmosPOIDetailContentSlotTests: XCTestCase {
    private let size = CGSize(width: 360, height: 700)
    private static func isMagenta(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 60 && b > 200 }

    private var poi: KozmosPOIPresentation {
        KozmosPOIPresentation(id: "cafe", name: "Cafe", floorId: "2", floorLabel: "Level 2",
                              services: [.init(id: "call", label: "Call ahead")])
    }

    @MainActor func testTheProductsContentIsDrawnInsideTheCardAfterItsBody() async throws {
        let panel = KozmosPOIDetailPanel(poi: poi, actionLabels: [:], onAction: { _, _ in }) {
            Color(red: 1, green: 0, blue: 1).frame(width: 120, height: 120)
        }
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(panel, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = "gap-131-slot"
        attachment.lifetime = .keepAlways
        add(attachment)
        let content = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isMagenta),
                                    "the product's content was not drawn")
        // Inside the body's 16 padding, at its leading edge.
        XCTAssertEqual(content.minX, 16, accuracy: 1.5, "not inside the card's padding: \(content)")
        XCTAssertEqual(content.width, 120, accuracy: 1.5)
        // After the services, the last thing Kozmos draws here.
        let services = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: size.width, height: content.minY),
                                                        where: RenderedPixels.isDarkText), "nothing above the content")
        XCTAssertGreaterThan(content.minY, services.maxY, "the content is not after the body")
    }

    /// No content, no change: a card without it draws as it did.
    @MainActor func testACardWithoutContentDrawsAsBefore() async throws {
        let plain = try await RenderedPixels.render(
            KozmosPOIDetailPanel(poi: poi, actionLabels: [:], onAction: { _, _ in }).environment(\.colorScheme, .light), size: size)
        let empty = try await RenderedPixels.render(
            KozmosPOIDetailPanel(poi: poi, actionLabels: [:], onAction: { _, _ in }) { EmptyView() }
                .environment(\.colorScheme, .light), size: size)
        XCTAssertEqual(plain.differingPixels(from: empty), 0)
    }
}
#endif
