import SwiftUI
import XCTest
@testable import Kozmos

/// Back points to the start edge: left, left to right, and right, right to
/// left, as React's mirrored arrow and Compose's AutoMirrored ArrowBack do.
/// SF Symbols' `arrow.left` points left in either direction; the layout
/// mirrors where the button is, not what it draws.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator.
final class KozmosRoutePreviewPanelTests: XCTestCase {
    private let size = CGSize(width: 360, height: 420)

    /// No options, so the footer's start holds nothing in the theme's colour
    /// but the back button's arrow.
    private func panel(_ direction: LayoutDirection) -> some View {
        KozmosRoutePreviewPanel(
            destinationName: "Gate 12", options: [], status: .idle,
            backLabel: "Back", continueLabel: "Start",
            onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in }
        )
        .frame(width: size.width, height: size.height)
        .environment(\.layoutDirection, direction)
        .environment(\.colorScheme, .light)
    }

    /// Which way the back button's arrow points. An arrow is tallest at the
    /// end it points to, where its head spans it; only the shaft reaches the
    /// other end.
    @MainActor private func backArrowPointsLeft(_ direction: LayoutDirection) throws -> Bool {
        let drawn = try DrawnPixels.draw(panel(direction))
        // The outline button's ink: the secondary tier's themed words, as
        // React's (decision 59; it was theme 500 on iOS alone).
        let ink = DrawnPixels.matches(try DrawnPixels.resolved(KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle, in: .light))
        // The footer's start: the back button, 44 wide, 16 in from the edge,
        // and short of the continue button 12 beyond it.
        let start = CGRect(x: direction == .leftToRight ? 0 : size.width - 66, y: size.height - 90, width: 66, height: 90)
        let arrow = try XCTUnwrap(drawn.boundingBox(in: start, where: ink), "no arrow at the footer's start, \(direction)")
        let quarter = arrow.width / 4
        func height(from x: CGFloat) -> CGFloat {
            drawn.boundingBox(in: CGRect(x: x, y: arrow.minY, width: quarter, height: arrow.height), where: ink)?.height ?? 0
        }
        let left = height(from: arrow.minX), right = height(from: arrow.maxX - quarter)
        XCTAssertGreaterThan(abs(left - right), 2, "the arrow is as tall at both ends, \(direction)")
        return left > right
    }

    @MainActor func testBackPointsToTheStartEdgeInEitherDirection() throws {
        XCTAssertTrue(try backArrowPointsLeft(.leftToRight), "left to right, Back points right")
        XCTAssertFalse(try backArrowPointsLeft(.rightToLeft), "right to left, Back points left, away from the start edge")
    }
}
