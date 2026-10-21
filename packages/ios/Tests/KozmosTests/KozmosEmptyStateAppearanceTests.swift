import XCTest
import SwiftUI
@testable import Kozmos

/// An empty state draws as React's and Figma's do: its icon in foreground 400
/// on a muted circle, background 100, 64 across (40 compact), and its
/// description in foreground 400. React's are `text-muted-foreground` and
/// `w-16 h-16 rounded-pill bg-muted` (`h-10 w-10` compact). SwiftUI drew the
/// icon and the description in foreground 300, with no circle.
///
/// Drawn without a window, on the page's own surface, in both themes, so
/// these run in `swift test` on a Mac too.
final class KozmosEmptyStateAppearanceTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    @MainActor private func draw(_ size: KozmosEmptyStateSize, _ scheme: ColorScheme) throws -> DrawnPixels {
        let empty = KozmosEmptyState(title: "No results", description: "Try another word", size: size) {
            KozmosIcon("search-md", size: .lg)
        } action: {
            EmptyView()
        }
        return try DrawnPixels.draw(empty.frame(width: 300).background(KozmosColors.primitivesColorsBackground0)
            .environment(\.colorScheme, scheme), scale: 3)
    }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 12) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    /// Of the opaque pixels in `region`, the one furthest from `fill`.
    private func ink(_ drawn: DrawnPixels, in region: CGRect, against fill: Ink) -> Ink? {
        var found: Ink?, furthest = -1
        for y in stride(from: region.minY, to: region.maxY, by: 1 / drawn.scale) {
            for x in stride(from: region.minX, to: region.maxX, by: 1 / drawn.scale) {
                let p = drawn.pixel(at: CGPoint(x: x, y: y))
                guard p.a > 240 else { continue }
                let d = abs(Int(p.r) - Int(fill.r)) + abs(Int(p.g) - Int(fill.g)) + abs(Int(p.b) - Int(fill.b))
                if d > furthest { furthest = d; found = p }
            }
        }
        return found
    }

    private static func name(_ scheme: ColorScheme) -> String { scheme == .dark ? "dark" : "light" }

    @MainActor func testTheIconSitsOnAMutedCircle64AcrossOr40Compact() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: scheme)
            for (size, across, top) in [(KozmosEmptyStateSize.default, CGFloat(64), CGFloat(24)), (.compact, 40, 16)] {
                let drawn = try draw(size, scheme)
                guard let circle = drawn.boundingBox(in: CGRect(x: 0, y: 0, width: 300, height: top + across + 8),
                                                     where: DrawnPixels.matches(muted, tolerance: 3)) else {
                    wrong.append("\(Self.name(scheme)) \(size): no background/100 circle"); continue
                }
                if abs(circle.width - across) > 1 || abs(circle.height - across) > 1 || abs(circle.midX - 150) > 1 || abs(circle.minY - top) > 1 {
                    wrong.append("\(Self.name(scheme)) \(size): the circle is \(circle), not \(across) across, centred, \(top) down")
                }
                // A circle, not a square: its corners are the page's.
                let corner = drawn.pixel(at: CGPoint(x: circle.minX + 2, y: circle.minY + 2))
                if close(corner, muted, within: 3) { wrong.append("\(Self.name(scheme)) \(size): its corner is filled") }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testTheIconAndTheDescriptionAreForeground400() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: scheme)
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let expected = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: scheme)
            let drawn = try draw(.default, scheme)
            // The 24pt icon, centred in the 64pt circle 24pt down: 44 to 68.
            let icon = ink(drawn, in: CGRect(x: 136, y: 42, width: 28, height: 28), against: muted)
            if !close(icon, expected) { wrong.append("\(Self.name(scheme)): the icon is \(hex(icon)), not foreground/400 \(hex(expected))") }
            // The description: the last line of what is drawn on the page.
            let lines = drawn.bands { r, g, b, a in
                a > 240 && abs(Int(r) - Int(page.r)) + abs(Int(g) - Int(page.g)) + abs(Int(b) - Int(page.b)) > 30
            }
            guard let description = lines.last, lines.count >= 3 else { wrong.append("\(Self.name(scheme)): lines \(lines)"); continue }
            let words = ink(drawn, in: description, against: page)
            if !close(words, expected) { wrong.append("\(Self.name(scheme)): the description is \(hex(words)), not foreground/400 \(hex(expected))") }
        }
        XCTAssertEqual(wrong, [])
    }
}
