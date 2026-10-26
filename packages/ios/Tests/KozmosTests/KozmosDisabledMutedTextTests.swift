#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// A disabled part's muted sub-text is never darker than its own disabled
/// text. Disabled text is foreground/500; the muted colour became
/// foreground/400, one step darker, so a disabled listbox option's
/// description, a disabled label's optional text and a disabled date
/// picker's helper would stand out from the dimmed words beside them. React
/// keeps a disabled row's words one colour: owned-selection.css draws a
/// disabled option `text-muted-foreground opacity-60`, the colour its
/// description already has.
///
/// Hosted, since the listbox scrolls and the date picker holds the system's
/// picker, in light and dark. Each text is drawn again as spaces: the pixels
/// that differ are its glyphs, and what is left is the disabled text. The date
/// picker's label and helper are each blanked in turn, so the system picker
/// between them is in neither read. Each text's colour is its pixel furthest
/// from the page; the sub-text may be no nearer the ink than the disabled
/// text, within 3 a channel. The date range's preview, which this held to its
/// start date with a fixed "to" between them, is now the locale's interval in
/// one text, the disabled colour, with no muted word in it.
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

            func datePicker(_ label: String, _ helper: String) -> AnyView {
                AnyView(KozmosDatePicker(selection: .constant(Date(timeIntervalSince1970: 1_769_299_200)),
                                         label: label, helperText: helper, disabled: true))
            }
            let picker = try await render(datePicker("Visit date", "Weekdays only"), scheme)
            let (_, pickerLabel) = blanked(picker, try await render(datePicker("          ", "Weekdays only"), scheme), scheme)
            let (_, pickerHelper) = blanked(picker, try await render(datePicker("Visit date", "             "), scheme), scheme)
            reads.append(("DatePicker disabled: its label and its helper", pickerLabel, pickerHelper))

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

    /// The date range's preview is the locale's interval in one text, in the
    /// dates' colour: foreground/0, and disabled foreground/500, as its
    /// disabled dates were. The muted "to" that stood between the dates is
    /// gone, so no word in it is muted. The range is drawn with and without
    /// its preview: the pixels that differ are the preview's box, and its
    /// words are the pixels 8pt or more inside that box, clear of its rounded
    /// border. Their colour is the pixel furthest from the page, held to the
    /// token within 10 a channel; foreground/400 is 23 to 28 from 500.
    @MainActor func testADateRangesSummaryIsTheDatesColourEnabledAndDisabled() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for disabled in [false, true] {
                let step = disabled ? "foreground/500" : "foreground/0"
                let swatch = try DrawnPixels.resolved(
                    disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0, in: scheme)
                let token: RGB = (swatch.r, swatch.g, swatch.b)
                let name = "DateRangePicker\(disabled ? " disabled" : "")'s summary, \(scheme)"
                let with = try await render(KozmosDateRangePicker(disabled: disabled, showsCalendarPreview: true), scheme)
                let without = try await render(KozmosDateRangePicker(disabled: disabled, showsCalendarPreview: false), scheme)
                var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1
                for y in 0..<with.height {
                    for x in 0..<with.width {
                        let a = pixel(with, x, y), b = pixel(without, x, y)
                        guard abs(Int(a.r) - Int(b.r)) > 8 || abs(Int(a.g) - Int(b.g)) > 8 || abs(Int(a.b) - Int(b.b)) > 8 else { continue }
                        minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                    }
                }
                let inset = Int(8 * with.scale)
                guard maxX >= 0, maxX - minX > 2 * inset, maxY - minY > 2 * inset else {
                    wrong.append("\(name): no preview box drawn")
                    continue
                }
                let s = with.scale
                print("Disabled muted iOS, \(name): the preview's box \(Int(CGFloat(minX) / s)),\(Int(CGFloat(minY) / s)) to \(Int(CGFloat(maxX) / s)),\(Int(CGFloat(maxY) / s))")
                guard let words = ink(with, scheme, xs: (minX + inset)..<(maxX - inset), ys: (minY + inset)..<(maxY - inset)) else {
                    wrong.append("\(name): nothing drawn")
                    continue
                }
                print("Disabled muted iOS, \(name): \(hex(words)), \(step) \(hex(token))")
                if abs(Int(words.r) - Int(token.r)) > 10 || abs(Int(words.g) - Int(token.g)) > 10 || abs(Int(words.b) - Int(token.b)) > 10 {
                    wrong.append("\(name): drew \(hex(words)), not \(step) \(hex(token))")
                }
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
#endif
