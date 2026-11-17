import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-213, decision 194: `tone` makes the empty state an emotion's card, as
/// React's `tone` does: the emotion's surface, a 1pt edge in its text colour,
/// the title, description and list in its ink (onSurface), and the icon in
/// its text colour on a disc of the page's colour. Every emotion, light and
/// dark. Unset, the empty state is drawn as before
/// (`KozmosEmptyStateAppearanceTests`).
final class KozmosEmptyStateToneTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)
    private static let emotions: [KozmosEmotion] = [.neutral, .themed, .success, .danger, .informative, .alert]
    private static let width: CGFloat = 300

    @MainActor private func draw(_ tone: KozmosEmotion, _ scheme: ColorScheme, list: [String] = []) throws -> DrawnPixels {
        let empty = KozmosEmptyState(title: "No Map Content Found", description: "Nothing here", list: list, tone: tone) {
            KozmosIcon("search-md", size: .lg)
        } action: {
            EmptyView()
        }
        return try DrawnPixels.draw(empty.frame(width: Self.width).background(KozmosColors.primitivesColorsBackground0)
            .environment(\.colorScheme, scheme), scale: 3)
    }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 14) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

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

    private static func name(_ scheme: ColorScheme, _ tone: KozmosEmotion) -> String {
        "\(scheme == .dark ? "dark" : "light") \(tone)"
    }

    @MainActor func testTheCardIsTheEmotionsSurfaceEdgedInItsTextColour() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for tone in Self.emotions {
                let surface = try DrawnPixels.resolved(tone.surface, in: scheme)
                let edge = try DrawnPixels.resolved(tone.text, in: scheme)
                let drawn = try draw(tone, scheme)
                let midY = drawn.size.height / 2
                let fill = drawn.pixel(at: CGPoint(x: 10, y: midY))
                if !close(fill, surface, within: 3) { wrong.append("\(Self.name(scheme, tone)): the fill is \(hex(fill)), not \(hex(surface))") }
                let border = drawn.pixel(at: CGPoint(x: 0.5, y: midY))
                if !close(border, edge, within: 6) { wrong.append("\(Self.name(scheme, tone)): the edge is \(hex(border)), not \(hex(edge))") }
                let end = drawn.pixel(at: CGPoint(x: Self.width - 0.5, y: midY))
                if !close(end, edge, within: 6) { wrong.append("\(Self.name(scheme, tone)): the end edge is \(hex(end)), not \(hex(edge))") }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testTheWordsAreTheEmotionsInk() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for tone in Self.emotions {
                let surface = try DrawnPixels.resolved(tone.surface, in: scheme)
                let expected = try DrawnPixels.resolved(tone.onSurface, in: scheme)
                let drawn = try draw(tone, scheme, list: ["Clear the type filters"])
                // Inside the edge and clear of its rounded corners: the disc,
                // the title, the description, the list.
                let inset = KozmosDimensions.semanticsRadiusContainer + 4
                let inner = drawn.cropped(to: CGRect(x: inset, y: 4, width: Self.width - 2 * inset, height: drawn.size.height - 8))
                let lines = inner.bands { r, g, b, a in
                    a > 240 && abs(Int(r) - Int(surface.r)) + abs(Int(g) - Int(surface.g)) + abs(Int(b) - Int(surface.b)) > 30
                }
                guard lines.count >= 4 else { wrong.append("\(Self.name(scheme, tone)): lines \(lines)"); continue }
                for (index, what) in [(lines.count - 3, "title"), (lines.count - 2, "description"), (lines.count - 1, "list")] {
                    let words = ink(inner, in: lines[index], against: surface)
                    if !close(words, expected) { wrong.append("\(Self.name(scheme, tone)): the \(what) is \(hex(words)), not \(hex(expected))") }
                }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testTheIconIsTheEmotionsTextOnThePagesColour() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            for tone in Self.emotions {
                let expected = try DrawnPixels.resolved(tone.text, in: scheme)
                let drawn = try draw(tone, scheme)
                // The 64 disc, 32 down: its top, inside the circle, is the page.
                let disc = drawn.pixel(at: CGPoint(x: 150, y: 36))
                if !close(disc, page, within: 3) { wrong.append("\(Self.name(scheme, tone)): the disc is \(hex(disc)), not the page \(hex(page))") }
                let icon = ink(drawn, in: CGRect(x: 136, y: 50, width: 28, height: 28), against: page)
                if !close(icon, expected) { wrong.append("\(Self.name(scheme, tone)): the icon is \(hex(icon)), not \(hex(expected))") }
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
