#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-198, decisions 139 and 148: `placement: .inline` draws the drawer in
/// its parent's region with no scrim, a panel beside the page, as React's
/// `placement="inline"` has since 0.15.0 (#433). A left or right one floats:
/// 16 from every edge it reaches, 420 wide or the region less 16 each side, as
/// tall as its content up to the region less 16 above and below. The panel's
/// surface is the one white thing here, on a red region.
final class KozmosDrawerInlineTests: XCTestCase {
    private let region = CGSize(width: 800, height: 600)
    private static let magenta = Color(red: 1, green: 0, blue: 1)
    private static func isWhite(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 245 && g > 245 && b > 245 }
    private static func isMagenta(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 60 && b > 200 }
    private static func isPureRed(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 245 && g < 10 && b < 10 }

    @MainActor private func render<V: View>(_ view: V, size: CGSize, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    private func stage(side: KozmosDrawerSide = .right, placement: KozmosDrawerPlacement = .inline,
                       contentHeight: CGFloat = 100, direction: LayoutDirection = .leftToRight) -> some View {
        ZStack {
            Color(red: 1, green: 0, blue: 0)
            KozmosDrawer(isPresented: .constant(true), side: side, placement: placement, title: "Get started") {
                Self.magenta.frame(height: contentHeight)
            }
        }
        .environment(\.layoutDirection, direction)
        .environment(\.colorScheme, .light)
    }

    private func panel(_ pixels: RenderedPixels, _ size: CGSize) throws -> CGRect {
        try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: Self.isWhite), "no panel drawn")
    }

    /// Right: 16 from the region's right and top, 420 wide, and as tall as
    /// its content, which ends 24 above the panel's bottom edge.
    @MainActor func testARightInlineDrawerFloatsSixteenFromItsEdgesAsTallAsItsContent() async throws {
        let pixels = try await render(stage(), size: region, "gap-198-right")
        let box = try panel(pixels, region)
        let content = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: region), where: Self.isMagenta))
        XCTAssertEqual(region.width - box.maxX, 16, accuracy: 1.5, "not 16 from the right: \(box)")
        XCTAssertEqual(box.minY, 16, accuracy: 1.5, "not 16 from the top: \(box)")
        XCTAssertEqual(box.width, 420, accuracy: 2, "not 420 wide: \(box)")
        XCTAssertEqual(box.maxY - content.maxY, 24, accuracy: 1.5, "not as tall as its content: \(box) \(content)")
    }

    /// No scrim: the region beside the panel is drawn as it is.
    @MainActor func testItDrawsNoScrim() async throws {
        let pixels = try await render(stage(), size: region, "gap-198-no-scrim")
        let beside = pixels.color(at: CGPoint(x: 100, y: 300))
        XCTAssertTrue(Self.isPureRed(beside.r, beside.g, beside.b), "the region is dimmed: \(beside)")
        let fixed = try await render(stage(placement: .fixed), size: region, "gap-198-fixed-scrim")
        let dimmed = fixed.color(at: CGPoint(x: 100, y: 300))
        XCTAssertFalse(Self.isPureRed(dimmed.r, dimmed.g, dimmed.b), "the fixed drawer lost its scrim: \(dimmed)")
    }

    /// Left, it floats 16 from the left; right to left, the sides mirror,
    /// as the fixed drawer's do on SwiftUI.
    @MainActor func testALeftOneFloatsAtTheStartAndMirrorsRightToLeft() async throws {
        let left = try panel(try await render(stage(side: .left), size: region, "gap-198-left"), region)
        XCTAssertEqual(left.minX, 16, accuracy: 1.5, "not 16 from the left: \(left)")
        let mirrored = try panel(try await render(stage(direction: .rightToLeft), size: region, "gap-198-rtl"), region)
        XCTAssertEqual(mirrored.minX, 16, accuracy: 1.5, "right to left, the right drawer is not at the left: \(mirrored)")
    }

    /// In a narrow region it is the region less 16 each side.
    @MainActor func testInANarrowRegionItIsTheRegionLessSixteenEachSide() async throws {
        let narrow = CGSize(width: 360, height: 600)
        let box = try panel(try await render(stage(), size: narrow, "gap-198-narrow"), narrow)
        XCTAssertEqual(box.width, 360 - 32, accuracy: 2, "not the region less 32: \(box)")
        XCTAssertEqual(KozmosDrawer<EmptyView>.inlineWidth(inRegionWidth: 360), 328)
        XCTAssertEqual(KozmosDrawer<EmptyView>.inlineWidth(inRegionWidth: 1200), 420)
    }

    /// Taller content stops at the region less 16 above and below, and
    /// scrolls.
    @MainActor func testTallContentStopsSixteenAboveTheRegionsBottom() async throws {
        let box = try panel(try await render(stage(contentHeight: 2000), size: region, "gap-198-tall"), region)
        XCTAssertEqual(box.minY, 16, accuracy: 1.5, "not 16 from the top: \(box)")
        XCTAssertEqual(region.height - box.maxY, 16, accuracy: 1.5, "not 16 from the bottom: \(box)")
    }

    /// A panel, named by its title, its close still there; not a modal.
    @MainActor func testItIsANamedPanelWithItsClose() async throws {
        try await inspectAccessibility(stage(), size: region) { window in
            let labels = accessibilityNodes(window).compactMap(\.accessibilityLabel)
            XCTAssertTrue(labels.contains("Get started"), "the panel is not named:\n\(describeAccessibility(window))")
            let close = try accessibilityElement(named: "Close drawer", in: window)
            XCTAssertTrue(close.accessibilityTraits.contains(.button))
            XCTAssertFalse(accessibilityNodes(window).contains { $0.accessibilityViewIsModal }, "an inline drawer is modal")
        }
    }
}
#endif
