import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 156: containers are 20 everywhere. Alert and Drawer took the
/// control's 16; they take the container's 20, as React's rounded-container
/// draws them, and as Card already did.
///
/// A corner is read by how far in its curve is 2 below the top, against the
/// straight side further down. The edge is a 1 stroke centred on the shape's
/// outline, so its outer edge is a circle of r + 0.5 and its inner one r −
/// 0.5: 2 down, the outer edge is 10.69 in for 20 and 7.77 for 16, and the
/// inner one 12.0 for 20 and 8.85 for 16.
final class KozmosContainerCornerTests: XCTestCase {
    /// How far in, 2 below the top, the stroke's outer edge is from the side's.
    private func outer(_ r: CGFloat, at y: CGFloat = 2) -> CGFloat {
        r - ((r + 0.5) * (r + 0.5) - (r - y) * (r - y)).squareRoot() + 0.5
    }

    /// The same for the stroke's inner edge, where the fill shows.
    private func inner(_ r: CGFloat, at y: CGFloat = 2) -> CGFloat {
        r - ((r - 0.5) * (r - 0.5) - (r - y) * (r - y)).squareRoot() - 0.5
    }

    /// Where the first pixel that matches is, along a row from `x`, in points.
    private func edge(_ drawn: DrawnPixels, row y: CGFloat, from x: CGFloat, step: CGFloat,
                      where matches: (UInt8, UInt8, UInt8, UInt8) -> Bool) -> CGFloat? {
        var at = x
        while at >= 0, at < drawn.size.width {
            let p = drawn.pixel(at: CGPoint(x: at, y: y))
            if matches(p.r, p.g, p.b, p.a) { return at }
            at += step
        }
        return nil
    }

    @MainActor func testAnAlertsCornerIsTheContainers() throws {
        let alert = KozmosAlert<AnyView>(variant: .info) { AnyView(Color.clear.frame(height: 60)) }
            .frame(width: 320)
            .environment(\.colorScheme, .light)
        let drawn = try DrawnPixels.draw(alert, scale: 4)
        let covered: (UInt8, UInt8, UInt8, UInt8) -> Bool = { _, _, _, a in a > 128 }
        let top = try XCTUnwrap(edge(drawn, row: 2, from: 0, step: 0.25, where: covered), "nothing on the second row")
        let side = try XCTUnwrap(edge(drawn, row: 40, from: 0, step: 0.25, where: covered), "no edge")
        XCTAssertEqual(top - side, outer(20), accuracy: 1, "a 16 corner is \(outer(16)) in")
    }

    @MainActor func testADrawersCornerIsTheContainers() throws {
        let surface = try DrawnPixels.resolved(KozmosColors.semanticsSurface0, in: .light)
        let drawer = KozmosDrawer(isPresented: .constant(true), side: .right, showsCloseButton: false) {
            Color.clear.frame(width: 10, height: 10)
        }
        .frame(width: 600, height: 400)
        .environment(\.colorScheme, .light)
        let drawn = try DrawnPixels.draw(drawer, scale: 4)
        // A right drawer's corners at its leading side face the page.
        let isSurface = DrawnPixels.matches(surface, tolerance: 10)
        let top = try XCTUnwrap(edge(drawn, row: 2, from: 150, step: 0.25, where: isSurface), "no surface on the second row")
        let side = try XCTUnwrap(edge(drawn, row: 200, from: 150, step: 0.25, where: isSurface), "no surface")
        XCTAssertEqual(top - side, inner(20), accuracy: 1, "a 16 corner is \(inner(16)) in")
    }
}
