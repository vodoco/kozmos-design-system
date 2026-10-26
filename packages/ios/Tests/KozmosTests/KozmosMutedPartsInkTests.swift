import XCTest
import SwiftUI
@testable import Kozmos

/// Parts that drew their muted text or icon in foreground/500 themselves, not
/// through `kozmosMutedText`, draw the muted colour, foreground/400, as React
/// draws the same part with `text-muted-foreground`: a field's helper text, a
/// timeline's time, a segmented control's idle segment (on background/100, the
/// contract's other muted pair), the save-location card's edit pencil and a
/// breadcrumb's earlier crumb.
///
/// Each part is drawn in light on white at three times, so its strokes cover
/// whole pixels; the colour it draws is the darkest pixel in the region where
/// only that text or icon is, held to a swatch of the token within 10 a
/// channel. Foreground/500 is 23 to 28 a channel away. Drawn without a window,
/// so these run in `swift test` on a Mac too.
final class KozmosMutedPartsInkTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    @MainActor private func darkest<V: View>(_ view: V, width: CGFloat, in region: CGRect) throws -> Ink? {
        try DrawnPixels.draw(
            view.frame(width: width).background(Color.white).environment(\.colorScheme, .light),
            scale: 3
        ).darkest(in: region)
    }

    private func close(_ a: Ink?, _ b: Ink, within tolerance: Int = 10) -> Bool {
        guard let a else { return false }
        return abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func hex(_ c: Ink?) -> String { c.map { String(format: "#%02X%02X%02X", $0.r, $0.g, $0.b) } ?? "nothing" }

    @MainActor func testAPartsMutedTextOrIconIsTheMutedColour() throws {
        let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: .light)
        let parts: [(String, AnyView, CGFloat, CGRect)] = [
            // Only the helper is drawn: no label, and a field of nothing.
            ("FieldWrapper's helper text",
             AnyView(KozmosFieldWrapper(helperText: "Helper text") { Color.clear.frame(height: 1) }),
             240, CGRect(x: 0, y: 0, width: 240, height: 60)),
            ("KozmosTimelineTime", AnyView(KozmosTimelineTime("09:00")), 120, CGRect(x: 0, y: 0, width: 120, height: 40)),
            // The idle segment is the end half; the selected one's ink is
            // foreground/0 at the start.
            ("SegmentedControl's idle segment",
             AnyView(KozmosSegmentedControl(selection: .constant(0), items: ["Walk", "Lift"], fullWidth: true)
                .environment(\.layoutDirection, .leftToRight)),
             240, CGRect(x: 124, y: 0, width: 112, height: 60)),
            // The pencil, its 44pt target at the end of the first row, inside
            // the card's 24 of padding; the title is at the start.
            ("SaveLocationCard's edit pencil",
             AnyView(KozmosSaveLocationCard(title: "Gate 12", description: "Terminal 2", isSaved: true, onEditNote: {})
                .environment(\.layoutDirection, .leftToRight)),
             390, CGRect(x: 390 - 72, y: 16, width: 56, height: 64)),
            // The first crumb, before its separator and the current page.
            ("Breadcrumb's earlier crumb",
             AnyView(KozmosBreadcrumb(items: ["Home", "Gate 12"], onSelect: { _ in }).trail
                .frame(maxWidth: .infinity, alignment: .leading)
                .environment(\.layoutDirection, .leftToRight)),
             240, CGRect(x: 0, y: 0, width: 30, height: 40)),
        ]
        var wrong: [String] = []
        for (name, view, width, region) in parts {
            let ink = try darkest(view, width: width, in: region)
            print("Muted iOS, \(name): \(hex(ink)), foreground/400 \(hex(muted))")
            if !close(ink, muted) { wrong.append("\(name): drew \(hex(ink)), not foreground/400 \(hex(muted))") }
        }
        XCTAssertEqual(wrong, [])
    }

    /// The colour of the text that `blank` draws as spaces: of the pixels where
    /// the two drawings differ, which are only its glyphs, the opaque one
    /// furthest from the page, where a stroke covers it whole.
    @MainActor private func glyphInk<A: View, B: View>(_ drawn: A, blank: B, width: CGFloat, _ scheme: ColorScheme) throws -> Ink? {
        func draw<V: View>(_ view: V) throws -> DrawnPixels {
            try DrawnPixels.draw(
                view.frame(width: width).background(KozmosColors.primitivesColorsBackground0).environment(\.colorScheme, scheme),
                scale: 3)
        }
        let a = try draw(drawn), b = try draw(blank)
        XCTAssertEqual(a.size, b.size, "the text as spaces moved the drawing")
        guard a.size == b.size else { return nil }
        var found: Ink?
        var furthest = -1
        for y in 0..<a.height {
            for x in 0..<a.width {
                let point = CGPoint(x: (CGFloat(x) + 0.5) / a.scale, y: (CGFloat(y) + 0.5) / a.scale)
                let c = a.pixel(at: point), d = b.pixel(at: point)
                guard c.a > 240, abs(Int(c.r) - Int(d.r)) > 8 || abs(Int(c.g) - Int(d.g)) > 8 || abs(Int(c.b) - Int(d.b)) > 8 else { continue }
                let sum = Int(c.r) + Int(c.g) + Int(c.b)
                let depth = scheme == .dark ? sum : 765 - sum
                if depth > furthest { furthest = depth; found = c }
            }
        }
        return found
    }

    /// The date and time pickers' helper text, in the Kozmos field around the
    /// system picker, is the muted colour too, as React's pickers draw their
    /// helper in `FieldWrapper` and `KozmosFieldWrapper` draws its own. The
    /// system picker is not SwiftUI's to draw, so ImageRenderer draws a
    /// placeholder for it; the helper is told from it by drawing the field
    /// again with the helper as spaces. Light and dark, each on its page.
    @MainActor func testAPickersHelperTextIsTheMutedColour() throws {
        let day = Date(timeIntervalSince1970: 1_769_299_200)
        let helper = "Weekdays only", spaces = String(repeating: " ", count: 13)
        let pickers: [(String, (String) -> AnyView)] = [
            ("KozmosDatePicker", { AnyView(KozmosDatePicker(selection: .constant(day), label: "Visit date", helperText: $0)) }),
            ("KozmosTimePicker", { AnyView(KozmosTimePicker(selection: .constant(day), label: "Arrival time", helperText: $0)) }),
        ]
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: scheme)
            for (name, picker) in pickers {
                let ink = try glyphInk(picker(helper), blank: picker(spaces), width: 320, scheme)
                print("Muted iOS, \(name)'s helper text, \(scheme): \(hex(ink)), foreground/400 \(hex(muted))")
                if !close(ink, muted) { wrong.append("\(name)'s helper text, \(scheme): drew \(hex(ink)), not foreground/400 \(hex(muted))") }
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
