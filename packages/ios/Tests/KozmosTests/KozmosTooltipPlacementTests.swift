import XCTest
import SwiftUI
@testable import Kozmos

/// A shown tooltip sits beside its view, 4 from it, on its side, and never
/// over it, as React's Radix tooltip sits beside its trigger.
///
/// The guides that put it there were set inside a `switch`, on a bubble
/// inside `if isPresented`, and SwiftUI drops a guide set inside a
/// conditional view. So until 2026-10-21 every tooltip was drawn against its
/// view's edge, over the view, on every side.
///
/// `.top`, `.right`, `.bottom` and `.left` are the view's own sides in every
/// language, as React's Radix `side` and Figma's Side are, and `.leading`
/// and `.trailing` follow the reading direction. A 40pt grey view centred in 320 by 160 on black, so the white bubble is
/// what is found. Drawn without a window, so the first runs in `swift test`
/// on a Mac too; the second is hosted in UIKit, as an app hosts it.
final class KozmosTooltipPlacementTests: XCTestCase {
    private static let sides: [KozmosTooltipSide] = [.top, .right, .bottom, .left, .leading, .trailing]
    private static let directions: [LayoutDirection] = [.leftToRight, .rightToLeft]
    private static func name(_ direction: LayoutDirection) -> String { direction == .leftToRight ? "LTR" : "RTL" }

    /// The side of the view, as drawn, the bubble belongs on.
    static func expected(_ side: KozmosTooltipSide, _ direction: LayoutDirection) -> String {
        let rightToLeft = direction == .rightToLeft
        switch side {
        case .top: return "top"
        case .bottom: return "bottom"
        case .right: return "right"
        case .left: return "left"
        case .leading: return rightToLeft ? "right" : "left"
        case .trailing: return rightToLeft ? "left" : "right"
        }
    }

    private static func shown(_ side: KozmosTooltipSide, _ direction: LayoutDirection) -> some View {
        Color.gray.frame(width: 40, height: 40)
            .modifier(KozmosTooltip(text: "Hours", side: side, isAccessibilityHint: false, isPresented: true))
            .frame(width: 320, height: 160)
            .background(Color.black)
            .environment(\.layoutDirection, direction)
            .environment(\.colorScheme, .light)
    }

    /// Where the bubble's box is, against the view's 140...180 by 60...100.
    private static func placed(_ bubble: CGRect?) -> String {
        guard let bubble else { return "nothing drawn" }
        if bubble.minX >= 180 { return "right" }
        if bubble.maxX <= 140 { return "left" }
        if bubble.maxY <= 60 { return "top" }
        if bubble.minY >= 100 { return "bottom" }
        return "over the view, at \(bubble)"
    }

    @MainActor func testTheBubbleSitsBesideTheViewOnItsSideInBothDirections() throws {
        var wrong: [String] = []
        for side in Self.sides {
            for direction in Self.directions {
                let drawn = try DrawnPixels.draw(Self.shown(side, direction), scale: 3)
                let placed = Self.placed(drawn.boundingBox(where: DrawnPixels.matches((255, 255, 255, 255), tolerance: 25)))
                let want = Self.expected(side, direction)
                if placed != want { wrong.append(".\(side) \(Self.name(direction)): the bubble is \(placed), not on the view's \(want)") }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    #if os(iOS)
    @MainActor func testHostedTheBubbleSitsBesideTheViewNotOverIt() async throws {
        var wrong: [String] = []
        for side in Self.sides {
            for direction in Self.directions {
                let drawn = try await RenderedPixels.render(Self.shown(side, direction), size: CGSize(width: 320, height: 160))
                let bubble = drawn.boundingBox(in: CGRect(x: 0, y: 0, width: 320, height: 160)) { r, g, b in r > 230 && g > 230 && b > 230 }
                let placed = Self.placed(bubble)
                let want = Self.expected(side, direction)
                if placed != want { wrong.append(".\(side) \(Self.name(direction)): the bubble is \(placed), not on the view's \(want)") }
            }
        }
        XCTAssertEqual(wrong, [])
    }
    #endif
}
