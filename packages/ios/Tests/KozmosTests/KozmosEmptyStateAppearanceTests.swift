import XCTest
import SwiftUI
@testable import Kozmos

/// An empty state draws as React's and Figma's do: its icon in foreground 400
/// on a muted circle, background 100, 64 across (40 compact), its title in
/// foreground 0 and its description in foreground 400. React's are
/// `text-muted-foreground`, `w-16 h-16 rounded-pill bg-muted` (`h-10 w-10`
/// compact) and `text-foreground`, and Figma's painter paints the same
/// variables. A progress line says what is in progress in foreground 0 and
/// how far in foreground 400, as React's does (Figma draws no progress).
/// SwiftUI drew the icon, the description and the value in foreground 300,
/// with no circle, and the title and the label in foreground 100. And it is
/// padded 32 round its content, 16 compact, as React's `p-8`/`p-4` and
/// Figma's are: SwiftUI padded 24.
///
/// Drawn without a window, on the page's own surface, in both themes, so
/// these run in `swift test` on a Mac too.
final class KozmosEmptyStateAppearanceTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    @MainActor private func draw(_ size: KozmosEmptyStateSize, _ scheme: ColorScheme,
                                 progress: KozmosEmptyStateProgress? = nil) throws -> DrawnPixels {
        let empty = KozmosEmptyState(title: "No results", description: progress == nil ? "Try another word" : nil,
                                     size: size, progress: progress) {
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
            for (size, across, top) in [(KozmosEmptyStateSize.default, CGFloat(64), CGFloat(32)), (.compact, 40, 16)] {
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
            // The 24pt icon, centred in the 64pt circle 32pt down: 52 to 76.
            let icon = ink(drawn, in: CGRect(x: 136, y: 50, width: 28, height: 28), against: muted)
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

    /// React's `p-8` and Figma's 32 round the content, `p-4` and 16 compact:
    /// the first line drawn starts that far down and the last ends that far
    /// up, and a long description wraps within the width less both sides.
    @MainActor func testItIsPadded32RoundItsContentOr16Compact() throws {
        var wrong: [String] = []
        let words = Array(repeating: "Try another word", count: 6).joined(separator: " ")
        for (size, pad) in [(KozmosEmptyStateSize.default, CGFloat(32)), (.compact, 16)] {
            let empty = KozmosEmptyState(title: "No results", description: words, size: size)
            let drawn = try DrawnPixels.draw(empty.frame(width: 300).background(Color.white).environment(\.colorScheme, .light), scale: 3)
            let found = lines(drawn, on: (255, 255, 255, 255))
            guard let first = found.first, let last = found.last else { wrong.append("\(size): nothing drawn"); continue }
            // Text's own line box sits a point or two outside its ink.
            if first.minY < pad || first.minY > pad + 4 { wrong.append("\(size): the title's ink starts \(first.minY) down, not \(pad)") }
            let bottom = drawn.size.height - last.maxY
            if bottom < pad || bottom > pad + 6 { wrong.append("\(size): the last line's ink ends \(bottom) up, not \(pad)") }
            let widest = found.map(\.width).max() ?? 0
            if widest > 300 - 2 * pad { wrong.append("\(size): a line is \(widest) wide, wider than \(300 - 2 * pad)") }
            if widest < 300 - 2 * pad - 40 { wrong.append("\(size): the widest line is \(widest), far inside \(300 - 2 * pad)") }
        }
        XCTAssertEqual(wrong, [])
    }

    /// The lines of text drawn on the page, top to bottom: what differs from it.
    private func lines(_ drawn: DrawnPixels, on page: Ink) -> [CGRect] {
        drawn.bands { r, g, b, a in
            a > 240 && abs(Int(r) - Int(page.r)) + abs(Int(g) - Int(page.g)) + abs(Int(b) - Int(page.b)) > 30
        }
    }

    @MainActor func testTheTitleIsForeground0() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let expected = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground0, in: scheme)
            let drawn = try draw(.default, scheme)
            // The circle, the title, the description: the title is the second.
            let found = lines(drawn, on: page)
            guard found.count >= 3 else { wrong.append("\(Self.name(scheme)): lines \(found)"); continue }
            let title = ink(drawn, in: found[found.count - 2], against: page)
            if !close(title, expected) { wrong.append("\(Self.name(scheme)): the title is \(hex(title)), not foreground/0 \(hex(expected))") }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testTheProgressSaysWhatInForeground0AndHowFarIn400() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let strong = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground0, in: scheme)
            let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: scheme)
            let drawn = try draw(.default, scheme, progress: KozmosEmptyStateProgress(value: 0.4, label: "Downloading", valueText: "40%"))
            // The progress line's words run the bar's 280 width, from 10 to
            // 290: the label at its start, the value at its end.
            guard let row = lines(drawn, on: page).first(where: { $0.width > 200 && $0.height > 8 }) else {
                wrong.append("\(Self.name(scheme)): no progress line"); continue
            }
            let label = ink(drawn, in: CGRect(x: row.minX, y: row.minY, width: 90, height: row.height), against: page)
            let value = ink(drawn, in: CGRect(x: row.maxX - 30, y: row.minY, width: 30, height: row.height), against: page)
            if !close(label, strong) { wrong.append("\(Self.name(scheme)): the label is \(hex(label)), not foreground/0 \(hex(strong))") }
            if !close(value, muted) { wrong.append("\(Self.name(scheme)): the value is \(hex(value)), not foreground/400 \(hex(muted))") }
        }
        XCTAssertEqual(wrong, [])
    }
}
