import XCTest
import SwiftUI
@testable import Kozmos

/// A tooltip's tip points at its view from the side `side` names, and its
/// words keep the reading direction, in both reading directions.
/// `KozmosTooltipPlacementTests` puts the bubble on that side.
///
/// `top`, `right`, `bottom` and `left` are the view's own sides in every
/// language, as React's Radix `side` and Figma's Side are: right to left,
/// `.right` is still the view's right. `leading` and `trailing` follow the
/// reading direction. Until 2026-10-21 `.left` and `.right` did, so right to
/// left a `.right` tooltip opened on the view's left.
///
/// Drawn without a window, on black, so the white bubble is what is found.
/// Runs in `swift test` on a Mac too.
final class KozmosTooltipSideTests: XCTestCase {
    private static let directions: [LayoutDirection] = [.leftToRight, .rightToLeft]
    private static func name(_ direction: LayoutDirection) -> String { direction == .leftToRight ? "LTR" : "RTL" }

    /// The side of the view a tooltip should be drawn on, as drawn.
    private static func expected(_ side: KozmosTooltipSide, _ direction: LayoutDirection) -> String {
        switch side {
        case .top: return "top"
        case .bottom: return "bottom"
        case .right: return "right"
        case .left: return "left"
        case .leading: return direction == .leftToRight ? "left" : "right"
        case .trailing: return direction == .leftToRight ? "right" : "left"
        }
    }

    @MainActor private func draw<V: View>(_ view: V, _ direction: LayoutDirection) throws -> DrawnPixels {
        try DrawnPixels.draw(view.environment(\.layoutDirection, direction).environment(\.colorScheme, .light), scale: 3)
    }

    private let white = DrawnPixels.matches((255, 255, 255, 255), tolerance: 25)

    /// The edges of the bubble where its tip is, pointing out: just inside
    /// the edge the tip is its point, a pixel or two, and 3pt in it is its
    /// base, 6pt of an 8pt tip. The bubble's own rounded ends are wider there.
    @MainActor private func tips(_ side: KozmosTooltipSide, _ direction: LayoutDirection) throws -> [String] {
        let drawn = try draw(KozmosTooltipBubble(text: "Hours", side: side).fixedSize().background(Color.black), direction)
        let w = drawn.size.width, h = drawn.size.height, px = 1 / drawn.scale
        let edges: [(String, CGRect, CGRect)] = [
            ("left", CGRect(x: 0, y: 0, width: px, height: h), CGRect(x: 3, y: 0, width: px, height: h)),
            ("right", CGRect(x: w - px, y: 0, width: px, height: h), CGRect(x: w - 3 - px, y: 0, width: px, height: h)),
            ("top", CGRect(x: 0, y: 0, width: w, height: px), CGRect(x: 0, y: 3, width: w, height: px)),
            ("bottom", CGRect(x: 0, y: h - px, width: w, height: px), CGRect(x: 0, y: h - 3 - px, width: w, height: px)),
        ]
        return edges.compactMap { name, point, base in
            let atPoint = drawn.count(in: point, where: white), atBase = drawn.count(in: base, where: white)
            return atPoint < atBase && (12...24).contains(atBase) ? name : nil
        }
    }

    /// The tip is on the bubble's side facing the view: a bubble on the view's
    /// right has its tip on its left.
    private static func facing(_ side: String) -> String {
        ["right": "left", "left": "right", "top": "bottom", "bottom": "top"][side] ?? side
    }

    @MainActor private func faults(_ sides: [KozmosTooltipSide]) throws -> [String] {
        var wrong: [String] = []
        for side in sides {
            for direction in Self.directions {
                let want = Self.expected(side, direction)
                let pointed = try tips(side, direction)
                if pointed != [Self.facing(want)] {
                    wrong.append(".\(side) \(Self.name(direction)): its tip points out of its \(pointed), not its \(Self.facing(want))")
                }
            }
        }
        return wrong
    }

    /// React's Radix tooltip and Figma's Side: the view's own top, right,
    /// bottom and left, right to left as left to right, so a bubble on the
    /// view's right has its tip on its left.
    @MainActor func testTheTipFacesTheViewOnTheFourSidesInBothDirections() throws {
        XCTAssertEqual(try faults([.top, .right, .bottom, .left]), [])
    }

    /// The bubble is laid out left to right, but its words keep the reading
    /// direction: right to left, "Hours: 9–5" is laid out as a right-to-left
    /// line, its trailing figures and punctuation reordered, so the bubble's
    /// words are drawn differently from left to right's, as a `Text` alone is.
    @MainActor func testTheBubblesWordsKeepTheReadingDirection() throws {
        let bubble = KozmosTooltipBubble(text: "Hours: 9–5", side: .top).fixedSize().background(Color.white)
        let ltr = try draw(bubble, .leftToRight), rtl = try draw(bubble, .rightToLeft)
        let difference = try XCTUnwrap(rtl.largestDifference(from: ltr), "the two bubbles differ in size")
        XCTAssertGreaterThan(difference, 100, "right to left, the words are laid out as left to right")
    }

    /// Leading and trailing follow the reading direction.
    @MainActor func testLeadingAndTrailingTipsFollowTheReadingDirection() throws {
        XCTAssertEqual(try faults([.leading, .trailing]), [])
    }
}
