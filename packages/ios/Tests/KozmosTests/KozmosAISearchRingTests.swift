import XCTest
import SwiftUI
@testable import Kozmos

/// The AI search button's ring turns clockwise in every language, as React's
/// `rotate(360deg)` does. Right to left, SwiftUI turns a rotation the other
/// way, and the ring turned anticlockwise.
///
/// The turn is an animation, so this draws the ring at two points of it, at
/// rest and a quarter of the way round, and reads which way the colours
/// moved: turned clockwise by a quarter, the colour at each hour is the one
/// three hours before it. Drawn without a window, so this runs in `swift
/// test` on a Mac too.
final class KozmosAISearchRingTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// The ring's colour at each hour, 12 first, just inside its edge.
    @MainActor private func hours(_ angle: Double, _ direction: LayoutDirection) throws -> [Ink] {
        let drawn = try DrawnPixels.draw(KozmosAISearchRing(angle: angle).environment(\.layoutDirection, direction), scale: 3)
        let centre = drawn.size.width / 2, radius = centre - 1.5
        return (0..<12).map { hour in
            let a = Double(hour) / 12 * 2 * .pi
            return drawn.pixel(at: CGPoint(x: centre + radius * sin(a), y: centre - radius * cos(a)))
        }
    }

    private func close(_ a: Ink, _ b: Ink) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= 12 && abs(Int(a.g) - Int(b.g)) <= 12 && abs(Int(a.b) - Int(b.b)) <= 12
    }

    @MainActor func testTheRingTurnsClockwiseInBothDirections() throws {
        var wrong: [String] = []
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let rest = try hours(0, direction), quarter = try hours(90, direction)
            let name = direction == .leftToRight ? "LTR" : "RTL"
            let moved = (0..<12).filter { !close(quarter[$0], rest[($0 + 9) % 12]) }
            if !moved.isEmpty {
                let back = (0..<12).allSatisfy { close(quarter[$0], rest[($0 + 3) % 12]) }
                wrong.append("\(name): a quarter turn did not move the colours clockwise at hours \(moved)\(back ? "; it turned them anticlockwise" : "")")
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
