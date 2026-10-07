import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 59 (Olcay, 2026-10-07): a prominent fill is the theme fill —
/// theme 500, the client's base colour, #135BEC in both themes — and what
/// sits on it is the theme foreground, white in both. Theme-coloured text on
/// a surface is theme 600: #1051E8 in light, #5887F3 in dark.
///
/// Drawn and read back, in light and in dark. These are the default theme's
/// values, written out on purpose: the decision is about what is drawn. Until
/// the decision a checked box, a checked switch, a default tag and a filled
/// pin put background/0 or foreground/1000 on the theme's 500 — black in the
/// dark, 3.74:1 — and a link drew 500, 3.13:1 on a dark sheet.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosThemeFillTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let themeFill: Pixel = (0x13, 0x5B, 0xEC, 255)
    private static let white: Pixel = (0xFF, 0xFF, 0xFF, 255)
    private static let theme600: [ColorScheme: Pixel] = [
        .light: (0x10, 0x51, 0xE8, 255),
        .dark: (0x58, 0x87, 0xF3, 255),
    ]

    private static func describe(_ p: Pixel?) -> String {
        guard let p else { return "nothing" }
        return String(format: "#%02X%02X%02X", p.r, p.g, p.b)
    }

    /// The part on the page's own ground, white in light and black in dark,
    /// drawn at 3x so a stem of text covers whole pixels.
    @MainActor private func draw<V: View>(_ view: V, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view
                .padding(12)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The lightest opaque pixel in a region: on a fill, the colour of a
    /// light mark drawn on it, where a stroke covers a pixel whole.
    private static func lightest(_ pixels: DrawnPixels, in region: CGRect) -> Pixel? {
        var found: Pixel?
        var best = -1
        var y = region.minY
        while y < region.maxY {
            var x = region.minX
            while x < region.maxX {
                let p = pixels.pixel(at: CGPoint(x: x, y: y))
                let lightness = Int(p.r) + Int(p.g) + Int(p.b)
                if p.a > 240, lightness > best { best = lightness; found = p }
                x += 1 / pixels.scale
            }
            y += 1 / pixels.scale
        }
        return found
    }

    /// The part is filled with #135BEC, and what it draws on that fill is
    /// white: `markInset` keeps the read inside the fill, clear of its edge.
    @MainActor private func assertThemeFillWithWhiteMark<V: View>(
        _ name: String, _ view: V, markInset: CGFloat = 0.2,
        file: StaticString = #filePath, line: UInt = #line
    ) throws {
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(view, in: scheme)
            let isFill = DrawnPixels.matches(Self.themeFill, tolerance: 4)
            guard let fill = pixels.boundingBox(where: isFill) else {
                XCTFail("\(name), \(scheme): no #135BEC fill drawn", file: file, line: line)
                continue
            }
            let inside = fill.insetBy(dx: fill.width * markInset, dy: fill.height * markInset)
            let marks = pixels.count(in: inside, where: DrawnPixels.matches(Self.white, tolerance: 4))
            XCTAssertGreaterThan(
                marks, 8,
                "\(name), \(scheme): the mark on the #135BEC fill is not white; its lightest pixel is \(Self.describe(Self.lightest(pixels, in: inside)))",
                file: file, line: line
            )
        }
    }

    @MainActor func testACheckedCheckboxIsTheThemeFillWithAWhiteCheckInLightAndDark() throws {
        try assertThemeFillWithWhiteMark("checked checkbox", KozmosCheckbox(checked: .constant(true)))
    }

    @MainActor func testACheckedSwitchIsTheThemeFillWithAWhiteThumbInLightAndDark() throws {
        // The thumb is most of the track's height, so read close to the fill.
        try assertThemeFillWithWhiteMark("checked switch", KozmosSwitch(checked: .constant(true)), markInset: 0.15)
    }

    @MainActor func testADefaultTagIsTheThemeFillWithWhiteWordsInLightAndDark() throws {
        try assertThemeFillWithWhiteMark("default tag", KozmosTag("Open now"), markInset: 0.1)
    }

    /// A numbered pin is filled when selected (decision 55); its number is
    /// the fill's ink.
    @MainActor func testAFilledPrimaryPinIsTheThemeFillWithAWhiteNumberInLightAndDark() throws {
        try assertThemeFillWithWhiteMark(
            "filled primary pin",
            KozmosLocationPin(variant: .primary, number: 7, selected: true),
            markInset: 0.25
        )
    }

    /// The manoeuvre card's theme appearance is the brand card, a prominent
    /// fill: the theme fill, with its words, arrow and grab bar in the theme
    /// foreground. It was theme 600 under foreground/1000, black in the dark.
    /// Hosted on iOS, as the card's other drawn tests are.
    @MainActor func testAThemeManoeuvreCardIsTheThemeFillWithWhiteWordsInLightAndDark() async throws {
        let size = CGSize(width: 320, height: 160)
        for scheme in [ColorScheme.light, .dark] {
            let view = KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: false, onToggle: {},
                                           appearance: .theme) { Color.clear.frame(height: 1) }
                .padding(12)
                .frame(width: size.width, height: size.height, alignment: .top)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme)
            let drawing = try await Drawing.of(view, size: size)
            let whole = CGRect(origin: .zero, size: size)
            guard let fill = drawing.boundingBox(whole, Drawing.near(Self.themeFill)) else {
                XCTFail("\(scheme): no #135BEC card drawn")
                continue
            }
            XCTAssertGreaterThan(fill.width, 280, "\(scheme): the card's fill is \(fill)")
            let marks = drawing.count(fill.insetBy(dx: 8, dy: 8), Drawing.near(Self.white))
            XCTAssertGreaterThan(marks, 40, "\(scheme): the words on the #135BEC card are not white")
        }
    }

    #if os(iOS)
    /// A link is theme-coloured text on a surface: theme 600, #1051E8 in
    /// light and #5887F3 in dark. Hosted, since `ImageRenderer` draws a
    /// `Link` as a placeholder.
    @MainActor func testALinkIsTheme600InLightAndDark() async throws {
        let size = CGSize(width: 240, height: 60)
        for scheme in [ColorScheme.light, .dark] {
            let want = try XCTUnwrap(Self.theme600[scheme])
            let view = KozmosLink("Get directions", destination: URL(string: "https://example.com")!)
                .frame(width: size.width, height: size.height)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme)
            let pixels = try await RenderedPixels.render(view, size: size)
            func near(_ p: Pixel) -> (UInt8, UInt8, UInt8) -> Bool {
                { r, g, b in abs(Int(r) - Int(p.r)) <= 4 && abs(Int(g) - Int(p.g)) <= 4 && abs(Int(b) - Int(p.b)) <= 4 }
            }
            let whole = CGRect(origin: .zero, size: size)
            let ink = pixels.count(in: whole, where: near(want))
            let old = pixels.count(in: whole, where: near(Self.themeFill))
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "link-\(scheme)"
            attachment.lifetime = .keepAlways
            add(attachment)
            XCTAssertGreaterThan(ink, 20, "\(scheme): the link is not \(Self.describe(want)); \(old) pixels are the theme's 500")
        }
    }
    #endif
}

/// A drawing read back in points: hosted on iOS, where a card's UIKit-backed
/// parts need a host, and drawn by `ImageRenderer` on a Mac.
private struct Drawing {
    let boundingBox: (CGRect, (UInt8, UInt8, UInt8) -> Bool) -> CGRect?
    let count: (CGRect, (UInt8, UInt8, UInt8) -> Bool) -> Int

    static func near(_ p: KozmosThemeFillTests.Pixel, tolerance: Int = 4) -> (UInt8, UInt8, UInt8) -> Bool {
        { r, g, b in
            abs(Int(r) - Int(p.r)) <= tolerance && abs(Int(g) - Int(p.g)) <= tolerance && abs(Int(b) - Int(p.b)) <= tolerance
        }
    }

    @MainActor static func of<V: View>(_ view: V, size: CGSize) async throws -> Drawing {
        #if os(iOS)
        let pixels = try await RenderedPixels.render(view, size: size)
        return Drawing(boundingBox: { pixels.boundingBox(in: $0, where: $1) }, count: { pixels.count(in: $0, where: $1) })
        #else
        let pixels = try DrawnPixels.draw(view.frame(width: size.width, height: size.height), scale: 3)
        return Drawing(
            boundingBox: { region, matches in pixels.boundingBox(in: region) { r, g, b, a in a > 240 && matches(r, g, b) } },
            count: { region, matches in pixels.count(in: region) { r, g, b, a in a > 240 && matches(r, g, b) } }
        )
        #endif
    }
}
