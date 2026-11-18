#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-252: a drawer at an edge rounds only the two corners that face the
/// page, on logical sides, as Compose's and React's do; its corners at the
/// screen's edge are square. A floating inline side drawer keeps all four
/// round. The surface is the one white thing here, on a red region.
final class KozmosDrawerCornerTests: XCTestCase {
    private let region = CGSize(width: 800, height: 600)
    private static func isWhite(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 245 && g > 245 && b > 245 }

    private enum Corner: String, CaseIterable { case topLeft, topRight, bottomLeft, bottomRight }

    @MainActor private func roundCorners(side: KozmosDrawerSide, placement: KozmosDrawerPlacement,
                                         direction: LayoutDirection) async throws -> Set<Corner> {
        let view = ZStack {
            Color(red: 1, green: 0, blue: 0)
            KozmosDrawer(isPresented: .constant(true), side: side, placement: placement, title: "Filters") {
                Color.white.frame(height: 100)
            }
        }
        .environment(\.layoutDirection, direction)
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: region)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = "gap-252-\(side)-\(placement)-\(direction)"
        attachment.lifetime = .keepAlways
        add(attachment)
        let box = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: region), where: Self.isWhite),
                                "no drawer drawn")
        // 3 in from each corner along its diagonal: inside a square corner,
        // outside a 20 round one.
        let inset: CGFloat = 3
        let probes: [Corner: CGPoint] = [
            .topLeft: CGPoint(x: box.minX + inset, y: box.minY + inset),
            .topRight: CGPoint(x: box.maxX - inset, y: box.minY + inset),
            .bottomLeft: CGPoint(x: box.minX + inset, y: box.maxY - inset),
            .bottomRight: CGPoint(x: box.maxX - inset, y: box.maxY - inset),
        ]
        var round = Set<Corner>()
        for (corner, point) in probes {
            let c = pixels.color(at: point)
            if !Self.isWhite(c.r, c.g, c.b) { round.insert(corner) }
        }
        return round
    }

    /// Fixed, at every side, left to right and right to left: the page-facing
    /// pair only. A left drawer is at the leading edge, so right to left it is
    /// on the right and rounds its left corners.
    @MainActor func testAFixedDrawerRoundsOnlyThePageFacingCornersInBothDirections() async throws {
        let expected: [(KozmosDrawerSide, LayoutDirection, Set<Corner>)] = [
            (.left, .leftToRight, [.topRight, .bottomRight]),
            (.right, .leftToRight, [.topLeft, .bottomLeft]),
            (.left, .rightToLeft, [.topLeft, .bottomLeft]),
            (.right, .rightToLeft, [.topRight, .bottomRight]),
            (.top, .leftToRight, [.bottomLeft, .bottomRight]),
            (.bottom, .leftToRight, [.topLeft, .topRight]),
            (.top, .rightToLeft, [.bottomLeft, .bottomRight]),
            (.bottom, .rightToLeft, [.topLeft, .topRight]),
        ]
        for (side, direction, round) in expected {
            let drawn = try await roundCorners(side: side, placement: .fixed, direction: direction)
            XCTAssertEqual(drawn, round, "fixed \(side), \(direction): round corners \(drawn.map(\.rawValue).sorted())")
        }
    }

    /// Inline, a top or bottom drawer stays at its edge and rounds the pair
    /// facing the page; a side one floats and rounds all four.
    @MainActor func testAnInlineDrawerRoundsThePageFacingPairAtAnEdgeAndAllFourFloating() async throws {
        let bottom = try await roundCorners(side: .bottom, placement: .inline, direction: .leftToRight)
        XCTAssertEqual(bottom, [.topLeft, .topRight], "inline bottom: \(bottom.map(\.rawValue).sorted())")
        let top = try await roundCorners(side: .top, placement: .inline, direction: .rightToLeft)
        XCTAssertEqual(top, [.bottomLeft, .bottomRight], "inline top: \(top.map(\.rawValue).sorted())")
        let floating = try await roundCorners(side: .right, placement: .inline, direction: .leftToRight)
        XCTAssertEqual(floating, Set(Corner.allCases), "inline right: \(floating.map(\.rawValue).sorted())")
    }
}
#endif
