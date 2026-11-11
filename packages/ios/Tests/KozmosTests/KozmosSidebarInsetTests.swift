import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-199, decision 134: `inset: .flush` drops the 24 above the sidebar's
/// first slot, so a rail's first item sits flush under a fixed header, as
/// React's `inset="flush"` does; the bottom keeps its 24. React drops its
/// navigation's own 16 on a flush rail too; SwiftUI's navigation has none, so
/// its first item goes from 24 to 0. Read as drawn in a 300 tall column, in
/// points: hosted, on the simulator, because ImageRenderer draws nothing a
/// ScrollView holds, and the navigation is in one.
final class KozmosSidebarInsetTests: XCTestCase {
    #if os(iOS)
    private func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 60 && b < 60 }
    private func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { b > 200 && r < 60 && g < 60 }
    private func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 200 && r < 60 && b < 60 }
    private let whole = CGRect(x: 0, y: 0, width: 400, height: 300)

    private var item: some View { Color(red: 1, green: 0, blue: 0).frame(width: 24, height: 24) }

    @MainActor private func draw<V: View>(_ sidebar: V) async throws -> RenderedPixels {
        try await RenderedPixels.render(sidebar, size: CGSize(width: 400, height: 300))
    }

    @MainActor func testAFlushRailsFirstItemIsAtTheTopEdge() async throws {
        let flush = try await draw(KozmosSidebar(variant: .rail, inset: .flush) { item })
        XCTAssertEqual(try XCTUnwrap(flush.boundingBox(in: whole, where: isRed), "no item drawn").minY, 0, accuracy: 0.5)
    }

    @MainActor func testByDefaultTheTopIsPaddedAsBefore() async throws {
        let plain = try await draw(KozmosSidebar(variant: .rail) { item })
        let explicit = try await draw(KozmosSidebar(variant: .rail, inset: .default) { item })
        XCTAssertEqual(try XCTUnwrap(plain.boundingBox(in: whole, where: isRed)).minY, 24, accuracy: 0.5, "with no inset given")
        XCTAssertEqual(try XCTUnwrap(explicit.boundingBox(in: whole, where: isRed)).minY, 24, accuracy: 0.5)
    }

    /// With a header, flush starts the header at the edge, keeps the 16
    /// between it and the navigation, and the footer keeps the 24 below it.
    @MainActor func testFlushMovesTheTopAloneInAnExpandedSidebarWithSlots() async throws {
        func sidebar(_ inset: KozmosSidebarInset) -> some View {
            KozmosSidebar(
                variant: .expanded,
                inset: inset,
                header: { Color(red: 0, green: 0, blue: 1).frame(width: 24, height: 24) },
                navigation: { item },
                tools: { EmptyView() },
                footer: { Color(red: 0, green: 1, blue: 0).frame(width: 24, height: 24) }
            )
        }
        for (inset, top) in [(KozmosSidebarInset.flush, CGFloat(0)), (.default, 24)] {
            let drawn = try await draw(sidebar(inset))
            let header = try XCTUnwrap(drawn.boundingBox(in: whole, where: isBlue), "no header drawn")
            let first = try XCTUnwrap(drawn.boundingBox(in: whole, where: isRed), "no item drawn")
            let footer = try XCTUnwrap(drawn.boundingBox(in: whole, where: isGreen), "no footer drawn")
            XCTAssertEqual(header.minY, top, accuracy: 0.5, "\(inset): the header's top")
            XCTAssertEqual(first.minY - header.maxY, 16, accuracy: 0.5, "\(inset): header to navigation")
            XCTAssertEqual(300 - footer.maxY, 24, accuracy: 0.5, "\(inset): the bottom keeps its room")
        }
    }
    #endif
}
