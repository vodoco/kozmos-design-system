#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// A disabled part's muted sub-text is never darker than its own disabled
/// text. Disabled text is foreground/500; the muted colour became
/// foreground/400, one step darker, so a disabled listbox option's
/// description, a disabled label's optional text and a disabled date range's
/// "to" stood out from the dimmed words beside them. React keeps a disabled
/// row's words one colour: owned-selection.css draws a disabled option
/// `text-muted-foreground opacity-60`, the colour its description already has.
///
/// Hosted, since the listbox scrolls and the date range holds the system's
/// date picker, in light and dark. Where a text can be blanked, it is drawn
/// again as spaces: the pixels that differ are its glyphs, and what is left is
/// the disabled text. The date range's "to" is fixed, so its preview's words
/// are told apart by the gaps between them. Each text's colour is its pixel
/// furthest from the page; the sub-text may be no nearer the ink than the
/// disabled text, within 3 a channel.
final class KozmosDisabledMutedTextTests: XCTestCase {
    private typealias RGB = (r: UInt8, g: UInt8, b: UInt8)
    private let size = CGSize(width: 390, height: 260)

    @MainActor private func render<V: View>(_ view: V, _ scheme: ColorScheme) async throws -> RenderedPixels {
        try await RenderedPixels.render(
            view.padding(16)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme)
                .environment(\.layoutDirection, .leftToRight),
            size: size)
    }

    private func depth(_ c: RGB, _ scheme: ColorScheme) -> Int {
        let sum = Int(c.r) + Int(c.g) + Int(c.b)
        return scheme == .dark ? sum : 765 - sum
    }

    private func hex(_ c: RGB) -> String { String(format: "#%02X%02X%02X", c.r, c.g, c.b) }

    private func pixel(_ p: RenderedPixels, _ x: Int, _ y: Int) -> RGB {
        p.color(at: CGPoint(x: (CGFloat(x) + 0.5) / p.scale, y: (CGFloat(y) + 0.5) / p.scale))
    }

    /// The pixel furthest from the page among those `include` admits.
    private func ink(_ p: RenderedPixels, _ scheme: ColorScheme, xs: Range<Int>? = nil, ys: Range<Int>? = nil,
                     include: (Int, Int) -> Bool = { _, _ in true }) -> RGB? {
        var found: RGB?
        var furthest = -1
        for y in ys ?? 0..<p.height {
            for x in xs ?? 0..<p.width where include(x, y) {
                let c = pixel(p, x, y)
                let d = depth(c, scheme)
                if d > furthest { furthest = d; found = c }
            }
        }
        return found
    }

    /// The disabled text and the sub-text of a part whose sub-text can be
    /// blanked: `drawn` with it, `blank` with it as spaces.
    private func blanked(_ drawn: RenderedPixels, _ blank: RenderedPixels, _ scheme: ColorScheme) -> (RGB?, RGB?) {
        let disabled = ink(blank, scheme)
        let sub = ink(drawn, scheme) { x, y in
            let a = self.pixel(drawn, x, y), b = self.pixel(blank, x, y)
            return abs(Int(a.r) - Int(b.r)) > 8 || abs(Int(a.g) - Int(b.g)) > 8 || abs(Int(a.b) - Int(b.b)) > 8
        }
        return (disabled, sub)
    }

    /// The date range's preview: the start date and the "to" after it,
    /// found between the preview box's bottom and top edges and told apart by
    /// the gaps between the words.
    private func preview(_ p: RenderedPixels, _ scheme: ColorScheme) throws -> (RGB?, RGB?) {
        let s = p.scale
        let xs = Int((16 + 8) * s)..<Int((size.width - 16 - 8) * s)
        func isInk(_ x: Int, _ y: Int) -> Bool { depth(pixel(p, x, y), scheme) > 60 }
        func isEdge(_ y: Int) -> Bool { xs.filter { isInk($0, y) }.count * 10 >= xs.count * 9 }
        // The preview box's bottom edge, then its top edge above the words.
        var y = p.height - 1
        while y > 0 && !isEdge(y) { y -= 1 }
        while y > 0 && isEdge(y) { y -= 1 }
        let bottom = y
        while y > 0 && !isEdge(y) { y -= 1 }
        let top = y + 1
        XCTAssertGreaterThan(bottom - top, Int(8 * s), "no preview box found")
        let rows = top..<(bottom + 1)
        // Columns holding ink, grouped into words: a gap under 6pt is inside a
        // word ("Jan 25, 2026"), the preview's 8pt spacing is between them.
        var words: [Range<Int>] = []
        var start: Int?, last = -1_000
        for x in xs where rows.contains(where: { isInk(x, $0) }) {
            if let s0 = start, x - last >= Int(6 * s) { words.append(s0..<(last + 1)); start = x } else if start == nil { start = x }
            last = x
        }
        if let s0 = start { words.append(s0..<(last + 1)) }
        print("Disabled muted iOS, the date range's preview words, \(scheme): \(words.map { "\(Int(CGFloat($0.lowerBound) / s))–\(Int(CGFloat($0.upperBound) / s))" })")
        guard words.count >= 3 else {
            XCTFail("the preview's words: \(words)")
            return (nil, nil)
        }
        return (ink(p, scheme, xs: words[0], ys: rows), ink(p, scheme, xs: words[1], ys: rows))
    }

    @MainActor func testADisabledPartsMutedSubTextIsNeverDarkerThanItsDisabledText() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            var reads: [(String, RGB?, RGB?)] = []

            func listbox(_ description: String) -> AnyView {
                AnyView(KozmosListbox(options: [KozmosListboxOption(value: "gate", label: "Gate 12", description: description, disabled: true)]))
            }
            let (listDisabled, listSub) = blanked(
                try await render(listbox("Terminal 2"), scheme), try await render(listbox("          "), scheme), scheme)
            reads.append(("Listbox's disabled option and its description", listDisabled, listSub))

            let (labelDisabled, labelSub) = blanked(
                try await render(KozmosLabel("Name", optionalText: "Optional", disabled: true), scheme),
                try await render(KozmosLabel("Name", optionalText: "        ", disabled: true), scheme), scheme)
            reads.append(("Label disabled, and its optional text", labelDisabled, labelSub))

            let range = try await render(KozmosDateRangePicker(disabled: true, showsCalendarPreview: true), scheme)
            let (rangeDisabled, rangeSub) = try preview(range, scheme)
            reads.append(("DateRangePicker disabled: its preview's start date and its \"to\"", rangeDisabled, rangeSub))

            for (name, disabled, sub) in reads {
                guard let disabled, let sub else {
                    wrong.append("\(name), \(scheme): nothing drawn")
                    continue
                }
                print("Disabled muted iOS, \(name), \(scheme): disabled text \(hex(disabled)), sub-text \(hex(sub))")
                if depth(sub, scheme) > depth(disabled, scheme) + 9 {
                    wrong.append("\(name), \(scheme): the sub-text \(hex(sub)) stands out more than the disabled text \(hex(disabled))")
                }
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
#endif
