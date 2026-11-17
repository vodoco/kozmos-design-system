import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-170, decision 200: a chip takes Tag's six emotions, as React's
/// `emotion` does. At rest it is the emotion's surface, its words in the
/// emotion's ink (onSurface), edged in its text colour; selected it is filled
/// with the text colour, its words in the page's colour. Contrast is the
/// tokens' own: onSurface on surface and text on the page each clear 4.5:1.
/// Set, the emotion decides the colours whatever the variant.
final class KozmosChipEmotionTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)
    private static let emotions: [KozmosEmotion] = [.neutral, .themed, .success, .danger, .informative, .alert]

    @MainActor private func draw(_ chip: KozmosChip<EmptyView>, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(chip.fixedSize().background(KozmosColors.primitivesColorsBackground0)
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

    /// The fill, the words' ink and the edge a chip draws: the fill 6 in
    /// from its start on its centre line, the ink the furthest pixel from it
    /// over the words, and the edge its first pixel column.
    @MainActor private func colours(_ drawn: DrawnPixels) -> (fill: Ink, ink: Ink?, edge: Ink) {
        let midY = drawn.size.height / 2
        let fill = drawn.pixel(at: CGPoint(x: 6, y: midY))
        let words = ink(drawn, in: CGRect(x: 12, y: 4, width: drawn.size.width - 24, height: drawn.size.height - 8), against: fill)
        let edge = drawn.pixel(at: CGPoint(x: 0.2, y: midY))
        return (fill, words, edge)
    }

    @MainActor private func check(_ chip: KozmosChip<EmptyView>, _ scheme: ColorScheme, _ label: String,
                                  fill: Color, ink: Color, edge: Color, into wrong: inout [String]) throws {
        let drawn = try draw(chip, scheme)
        let got = colours(drawn)
        let want = (try DrawnPixels.resolved(fill, in: scheme), try DrawnPixels.resolved(ink, in: scheme),
                    try DrawnPixels.resolved(edge, in: scheme))
        if !close(got.fill, want.0, within: 3) { wrong.append("\(label): the fill is \(hex(got.fill)), not \(hex(want.0))") }
        if !close(got.ink, want.1) { wrong.append("\(label): the words are \(hex(got.ink)), not \(hex(want.1))") }
        if !close(got.edge, want.2, within: 20) { wrong.append("\(label): the edge is \(hex(got.edge)), not \(hex(want.2))") }
    }

    @MainActor func testAChipAtRestIsTheEmotionsSurfaceInkAndTextEdge() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for emotion in Self.emotions {
                try check(KozmosChip(text: "Changes Awaiting Publish", emotion: emotion, action: {}), scheme,
                          "\(scheme) \(emotion) at rest", fill: emotion.surface, ink: emotion.onSurface, edge: emotion.text,
                          into: &wrong)
            }
        }
        XCTAssertEqual(wrong, [])
    }

    @MainActor func testASelectedChipIsFilledWithTheEmotionsTextAndThePagesInk() throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for emotion in Self.emotions {
                try check(KozmosChip(text: "Changes Awaiting Publish", emotion: emotion, selected: true, action: {}), scheme,
                          "\(scheme) \(emotion) selected", fill: emotion.text,
                          ink: KozmosColors.primitivesColorsBackground0, edge: emotion.text, into: &wrong)
            }
        }
        XCTAssertEqual(wrong, [])
    }

    /// The emotion wins over the variant: a destructive chip told `.success`
    /// is drawn as success, at rest and selected.
    @MainActor func testTheEmotionDecidesTheColoursWhateverTheVariant() throws {
        var wrong: [String] = []
        for variant in [KozmosChipVariant.neutral, .brand, .destructive] {
            try check(KozmosChip(text: "New", variant: variant, emotion: .success, action: {}), .light,
                      "\(variant) as success", fill: KozmosEmotion.success.surface,
                      ink: KozmosEmotion.success.onSurface, edge: KozmosEmotion.success.text, into: &wrong)
            try check(KozmosChip(text: "New", variant: variant, emotion: .success, selected: true, action: {}), .light,
                      "\(variant) as success, selected", fill: KozmosEmotion.success.text,
                      ink: KozmosColors.primitivesColorsBackground0, edge: KozmosEmotion.success.text, into: &wrong)
        }
        XCTAssertEqual(wrong, [])
    }
}
