import XCTest
import SwiftUI
@testable import Kozmos

/// Row 56 (GAP-057): Skeleton takes a shape and the space to hold, so a loading
/// row needs no frame of its own. React gained `shape`, `width` and `height` in
/// #93; the shapes are the Figma set's `Shape` axis.
///
/// Laid out and drawn without a window, so these run in `swift test` on a Mac
/// as well as on a simulator — except the Dynamic Type case, which macOS does
/// not scale.
final class KozmosSkeletonTests: XCTestCase {
    /// What a placeholder is offered: more than any of its defaults.
    private let offered = CGSize(width: 300, height: 200)

    @MainActor
    private func laidOut<V: View>(_ view: V) -> CGSize {
        #if canImport(UIKit)
        UIHostingController(rootView: view).sizeThatFits(in: offered)
        #else
        NSHostingController(rootView: view).sizeThatFits(in: offered)
        #endif
    }

    /// Unset, it draws as it always has: a square-cornered rectangle filling
    /// whatever it is given, so the callers that sized it with `.frame` keep the
    /// placeholder they had. This holds before the change and after it.
    @MainActor func testUnsetItFillsWhatItIsGivenAsItAlwaysHas() throws {
        XCTAssertEqual(laidOut(KozmosSkeleton()), offered)

        let drawn = try DrawnPixels.draw(KozmosSkeleton().frame(width: 96, height: 24))
        XCTAssertTrue(drawn.isDrawn(at: CGPoint(x: 0.25, y: 0.25)), "the unset placeholder lost its square corner")
    }

    /// A line stands in for text, so it is text-high and fills its row — React's
    /// `h-4 w-full`, the Figma line's 16.
    @MainActor func testALineIsTextHighAndFillsItsRow() {
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .line)), CGSize(width: 300, height: 16))
    }

    /// Told a size, it stops assuming one.
    @MainActor func testALineHoldsTheSpaceItIsGiven() {
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .line, width: 120, height: 12)), CGSize(width: 120, height: 12))
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .line, width: 120)), CGSize(width: 120, height: 16))
    }

    /// A block is whatever it replaces, and guessing would be worse than asking:
    /// no default of its own, so it fills what it is given until told a size.
    @MainActor func testABlockHasNoSizeOfItsOwn() {
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .block)), offered)
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .block, height: 80)), CGSize(width: 300, height: 80))
    }

    /// A circle is an avatar's 40 unless told otherwise, and one number is its
    /// diameter: a circle should not need telling twice.
    @MainActor func testACircleTakesOneNumberAsItsDiameter() {
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .circle)), CGSize(width: 40, height: 40))
        XCTAssertEqual(laidOut(KozmosSkeleton(shape: .circle, width: 64)), CGSize(width: 64, height: 64))
    }

    /// Drawn, not only laid out: a circle's corners are empty and a line's ends
    /// round, where the unset placeholder's corner is filled.
    @MainActor func testTheShapeIsDrawnAsWellAsSized() throws {
        let circle = try DrawnPixels.draw(KozmosSkeleton(shape: .circle))
        XCTAssertFalse(circle.isDrawn(at: CGPoint(x: 3, y: 3)), "the circle has a corner")
        XCTAssertTrue(circle.isDrawn(at: CGPoint(x: 20, y: 20)), "the circle has no middle")

        let line = try DrawnPixels.draw(KozmosSkeleton(shape: .line, width: 120))
        XCTAssertFalse(line.isDrawn(at: CGPoint(x: 0.25, y: 0.25)), "the line's end is square")
        XCTAssertTrue(line.isDrawn(at: CGPoint(x: 60, y: 8)), "the line is not drawn")

        let block = try DrawnPixels.draw(KozmosSkeleton(shape: .block, width: 120, height: 80))
        XCTAssertFalse(block.isDrawn(at: CGPoint(x: 0.25, y: 0.25)), "the block's corner is square")
        XCTAssertTrue(block.isDrawn(at: CGPoint(x: 60, y: 40)), "the block is not drawn")
    }

    /// One grey on every surface: Figma's `Colors/background/200`, in both
    /// themes, set or unset. iOS drew `background/300`, and React and Android
    /// `100`, until Olcay chose Figma's on 2026-09-27. The sheen starts off the
    /// placeholder, so what is drawn is the grey itself.
    @MainActor func testItIsFigmasGreyInBothThemes() throws {
        for scheme in [ColorScheme.light, .dark] {
            let grey = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground200, in: scheme)
            let placeholders: [(String, AnyView)] = [
                ("unset", AnyView(KozmosSkeleton().frame(width: 40, height: 40))),
                ("block", AnyView(KozmosSkeleton(shape: .block, width: 40, height: 40))),
            ]
            for (name, placeholder) in placeholders {
                let drawn = try DrawnPixels.draw(placeholder.environment(\.colorScheme, scheme))
                let centre = drawn.pixel(at: CGPoint(x: 20, y: 20))
                XCTAssertTrue(
                    DrawnPixels.matches(grey)(centre.r, centre.g, centre.b, centre.a),
                    "\(scheme) \(name): drew \(centre), not background/200 \(grey)"
                )
            }
        }
    }

    #if os(iOS)
    /// A line stands in for text, so it grows with the text size, as React's
    /// `h-4` — 1rem — follows the browser's. A height the product gives is
    /// kept. iOS only: Dynamic Type does not reach `@ScaledMetric` on a Mac.
    @MainActor func testALineGrowsWithTheTextItStandsIn() {
        let larger = laidOut(KozmosSkeleton(shape: .line).environment(\.dynamicTypeSize, .accessibility3))
        XCTAssertGreaterThan(larger.height, 16, "the line kept its height at the largest text")
        XCTAssertLessThan(larger.height, 16 * 3, "the line filled its row's height rather than a line's")

        let told = laidOut(KozmosSkeleton(shape: .line, height: 12).environment(\.dynamicTypeSize, .accessibility3))
        XCTAssertEqual(told.height, 12, "a height the product gave was scaled")
    }
    #endif
}
