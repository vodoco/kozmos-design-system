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
        try assertFill(Self.themeFill, withMark: Self.white, name, view, markInset: markInset, file: file, line: line)
    }

    /// The part is filled with `fillColour`, and what it draws on that fill
    /// is `markColour`, in light and dark.
    @MainActor private func assertFill<V: View>(
        _ fillColour: Pixel, withMark markColour: Pixel, _ name: String, _ view: V, markInset: CGFloat = 0.2,
        file: StaticString = #filePath, line: UInt = #line
    ) throws {
        try assertFill([.light: fillColour, .dark: fillColour], withMark: [.light: markColour, .dark: markColour],
                       name, view, markInset: markInset, file: file, line: line)
    }

    /// The same, for a fill and a mark that turn over with the theme: each
    /// scheme's own pair.
    @MainActor private func assertFill<V: View>(
        _ fills: [ColorScheme: Pixel], withMark marks: [ColorScheme: Pixel], _ name: String, _ view: V, markInset: CGFloat = 0.2,
        file: StaticString = #filePath, line: UInt = #line
    ) throws {
        for scheme in [ColorScheme.light, .dark] {
            let fillColour = try XCTUnwrap(fills[scheme], file: file, line: line)
            let markColour = try XCTUnwrap(marks[scheme], file: file, line: line)
            let pixels = try draw(view, in: scheme)
            let isFill = DrawnPixels.matches(fillColour, tolerance: 4)
            guard let fill = pixels.boundingBox(where: isFill) else {
                XCTFail("\(name), \(scheme): no \(Self.describe(fillColour)) fill drawn", file: file, line: line)
                continue
            }
            let inside = fill.insetBy(dx: fill.width * markInset, dy: fill.height * markInset)
            let marks = pixels.count(in: inside, where: DrawnPixels.matches(markColour, tolerance: 4))
            XCTAssertGreaterThan(
                marks, 8,
                "\(name), \(scheme): the mark on the \(Self.describe(fillColour)) fill is not \(Self.describe(markColour)); its lightest pixel is \(Self.describe(Self.lightest(pixels, in: inside))), its darkest \(Self.describe(pixels.darkest(in: inside)))",
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

    /// The accent pin's fill is theme variant 1's 500, #4135F1 in both
    /// themes since decision 63 (it was #4134F1, 2.99:1 on the dark page),
    /// and its number the theme foreground, white, 6.99:1 on it, as Compose
    /// draws it. Foreground/1000 was black on it in the dark, 3.00:1.
    @MainActor func testAFilledAccentPinsNumberIsWhiteInLightAndDark() throws {
        try assertFill((0x41, 0x35, 0xF1, 255), withMark: Self.white, "filled accent pin",
                       KozmosLocationPin(variant: .accent, number: 7, selected: true), markInset: 0.25)
    }

    /// Decision 68 (Olcay, 2026-10-08): a featured pin is the accent, #FAB735
    /// in both themes by default, whatever its variant, tint or selection, and
    /// it never shows its number (decision 55: a featured result's pin shows
    /// its logo). Without a logo it shows a star where the number would be,
    /// in the accent's ink, black, 11.89:1 on it, as Compose draws it.
    ///
    /// The intent changed with decision 68. This test said a featured pin's
    /// number was the alert's on-fill on alert 500, which is the same #FAB735
    /// the accent defaults to, so the fill alone cannot tell the two apart;
    /// the star and the missing number do. Against the code before it, it
    /// fails in both themes: the numbered pin's mark is the 7, narrower than
    /// it is tall, not a star, and the pin with no number draws no mark.
    @MainActor func testAFeaturedPinIsTheAccentWithABlackStarAndNoNumberInLightAndDark() throws {
        let accent: Pixel = (0xFA, 0xB7, 0x35, 255)
        let black: Pixel = (0, 0, 0, 255)
        let navy = KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentNavy,
                                      fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillNavy, ink: KozmosColors.semanticsCategoryOnfillNavy))
        let pins: [(String, KozmosLocationPin)] = [
            ("featured pin numbered 7", KozmosLocationPin(variant: .primary, size: .lg, number: 7, featured: true)),
            ("featured pin with no number", KozmosLocationPin(size: .lg, featured: true)),
            ("featured pin with a navy tint", KozmosLocationPin(size: .lg, number: 7, featured: true, tint: navy)),
            ("selected featured pin", KozmosLocationPin(size: .lg, number: 7, selected: true, featured: true)),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (name, pin) in pins {
                let pixels = try draw(pin, in: scheme)
                guard let fill = pixels.boundingBox(where: DrawnPixels.matches(accent, tolerance: 4)) else {
                    XCTFail("\(name), \(scheme): no #FAB735 fill drawn")
                    continue
                }
                // Inside the fill, clear of its ring: where the number was.
                let inside = fill.insetBy(dx: fill.width * 0.15, dy: fill.height * 0.15)
                let inked = pixels.count(in: inside, where: DrawnPixels.matches(black, tolerance: 24))
                let pale = pixels.count(in: inside, where: DrawnPixels.matches(Self.white, tolerance: 24))
                let mark = pixels.boundingBox(in: inside, where: DrawnPixels.matches(black, tolerance: 4))
                print("Decision 68 iOS, \(scheme): \(name) has a \(mark.map { "\($0.width) x \($0.height)" } ?? "no") black mark (\(inked) pixels) and \(pale) white pixels in its middle")
                XCTAssertGreaterThan(inked, 8, "\(name), \(scheme): no black mark on the accent; its darkest pixel is \(Self.describe(pixels.darkest(in: inside)))")
                // A star is about as wide as it is tall; a bold 7 is about
                // two-thirds as wide.
                if let mark {
                    XCTAssertGreaterThanOrEqual(mark.width, mark.height * 0.85,
                                                "\(name), \(scheme): the mark is \(mark.width) x \(mark.height), a number's shape, not a star's")
                }
                XCTAssertLessThanOrEqual(pale * 100, inked, "\(name), \(scheme): \(pale) white pixels in the middle")
            }
            // The numbered pin draws exactly what the unnumbered one does.
            let numbered = try draw(KozmosLocationPin(size: .lg, number: 7, featured: true), in: scheme)
            let plain = try draw(KozmosLocationPin(size: .lg, featured: true), in: scheme)
            let difference = try XCTUnwrap(numbered.largestDifference(from: plain), "\(scheme): the two pins differ in size")
            print("Decision 68 iOS, \(scheme): a featured pin numbered 7 differs from one with no number by \(difference) at most")
            XCTAssertLessThanOrEqual(difference, 8, "\(scheme): a featured pin shows its number")
        }
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

    /// A toggle button that is on is a prominent fill. Its words were
    /// background/0 on theme 500: black in the dark.
    @MainActor func testAToggleButtonThatIsOnIsTheThemeFillWithWhiteWordsInLightAndDark() throws {
        try assertThemeFillWithWhiteMark("toggle button on", KozmosToggleButton(isOn: .constant(true), label: "Step-free"), markInset: 0.1)
    }

    /// Its mark was background/0 on theme 500: black in the dark.
    @MainActor func testTheFloatingActionButtonIsTheThemeFillWithAWhiteMarkInLightAndDark() throws {
        try assertThemeFillWithWhiteMark("floating action button", KozmosFloatingActionButton(action: {}), markInset: 0.25)
    }

    /// Its words and chevron were background/0 on theme 500: black in the dark.
    @MainActor func testTheSplitButtonIsTheThemeFillWithWhiteWordsInLightAndDark() throws {
        try assertThemeFillWithWhiteMark("split button", KozmosSplitButton(label: "Directions", mainAction: {}), markInset: 0.1)
    }

    /// Radio's dot is a fill, the theme fill; its ring is an edge on the
    /// surface, theme 600, as React's. Both were theme 500, so the ring read
    /// 3.13:1 on the dark background.
    @MainActor func testARadiosDotIsTheThemeFillAndItsRingTheme600InLightAndDark() throws {
        for scheme in [ColorScheme.light, .dark] {
            let ringColour = try XCTUnwrap(Self.theme600[scheme])
            let pixels = try draw(KozmosRadioGroupItem(value: "a", selection: .constant("a")), in: scheme)
            guard let dot = pixels.boundingBox(where: DrawnPixels.matches(Self.themeFill, tolerance: 4)) else {
                XCTFail("\(scheme): no #135BEC dot drawn")
                continue
            }
            XCTAssertEqual(dot.width, 10, accuracy: 1, "\(scheme): the #135BEC drawn is \(dot), not the 10pt dot")
            guard let ring = pixels.boundingBox(where: DrawnPixels.matches(ringColour, tolerance: 4)) else {
                XCTFail("\(scheme): no ring in theme 600, \(Self.describe(ringColour))")
                continue
            }
            XCTAssertEqual(ring.width, 20, accuracy: 1.5, "\(scheme): the theme 600 drawn is \(ring), not the 20pt ring")
            XCTAssertEqual(ring.midX, dot.midX, accuracy: 1, "\(scheme): the dot is not inside the ring")
            XCTAssertEqual(ring.midY, dot.midY, accuracy: 1, "\(scheme): the dot is not inside the ring")
        }
    }

    /// Decision 61 (Olcay, 2026-10-08): the secondary Button and IconButton
    /// are the neutral Primary Buttons fill with the neutral ink on it, at
    /// rest and under a press, as React and Compose draw them: black on
    /// #C7CAD1 (pressed #9095A2) in light, white on #464A53 (pressed
    /// #17191C) in dark. Their words and mark were foreground/100, #17191C in
    /// light and #E8E6E3 in dark.
    @MainActor func testASecondaryButtonDrawsTheNeutralInkAtRestAndPressedInLightAndDark() throws {
        let fill: [ColorScheme: Pixel] = [.light: (0xC7, 0xCA, 0xD1, 255), .dark: (0x46, 0x4A, 0x53, 255)]
        let pressedFill: [ColorScheme: Pixel] = [.light: (0x90, 0x95, 0xA2, 255), .dark: (0x17, 0x19, 0x1C, 255)]
        let ink: [ColorScheme: Pixel] = [.light: (0x00, 0x00, 0x00, 255), .dark: (0xFF, 0xFF, 0xFF, 255)]
        let parts: [(name: String, view: AnyView, markInset: CGFloat)] = [
            ("secondary Button", AnyView(KozmosButton("Later", variant: .secondary, action: {})), 0.1),
            ("secondary IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .secondary, action: {})), 0.25),
        ]
        for part in parts {
            try assertFill(fill, withMark: ink, part.name, part.view, markInset: part.markInset)
            try assertFill(pressedFill, withMark: ink, "\(part.name) pressed",
                           part.view.environment(\.kozmosButtonIsPressed, true), markInset: part.markInset)
        }
    }

    /// Outline, ghost and link Button and IconButton draw their words and
    /// marks in the Secondary Buttons token, as React and Compose do — #0D44C2
    /// in light, #7EA2F6 in dark — where they drew theme 500.
    @MainActor func testOutlineGhostAndLinkButtonsDrawTheSecondaryButtonsTokenInLightAndDark() throws {
        for scheme in [ColorScheme.light, .dark] {
            let ink = try DrawnPixels.resolved(KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle, in: scheme)
            XCTAssertFalse(DrawnPixels.matches(Self.themeFill, tolerance: 4)(ink.r, ink.g, ink.b, ink.a),
                           "\(scheme): the Secondary Buttons token is theme 500, so this reads nothing")
            let parts: [(String, AnyView)] = [
                ("outline Button", AnyView(KozmosButton("Directions", variant: .outline, action: {}))),
                ("ghost Button", AnyView(KozmosButton("Directions", variant: .ghost, action: {}))),
                ("link Button", AnyView(KozmosButton("Directions", variant: .link, action: {}))),
                ("outline IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .outline, action: {}))),
                ("ghost IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .ghost, action: {}))),
                ("link IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .link, action: {}))),
            ]
            for (name, part) in parts {
                let pixels = try draw(part, in: scheme)
                let whole = CGRect(origin: .zero, size: pixels.size)
                let inked = pixels.count(in: whole, where: DrawnPixels.matches(ink, tolerance: 4))
                let old = pixels.count(in: whole, where: DrawnPixels.matches(Self.themeFill, tolerance: 4))
                XCTAssertGreaterThan(inked, 20, "\(name), \(scheme): not drawn in the Secondary Buttons token \(Self.describe(ink)); \(old) pixels are theme 500")
                XCTAssertEqual(old, 0, "\(name), \(scheme): theme 500 drawn")
            }
        }
    }

    /// The counter on a default Badge inverts (Olcay, 2026-10-07), as
    /// FloorSelector's count does on its selected level: the theme
    /// foreground, white, with its number in the theme fill, in light and
    /// dark. It was background/0 with foreground/100 on it — a black pill on
    /// the fill in the dark, and a near-black number in light. A destructive
    /// Badge keeps its counter: background/0.
    @MainActor func testADefaultBadgesCounterIsWhiteWithItsNumberInTheThemeFillInLightAndDark() throws {
        /// The counter's 20pt pill: the badge's last part, inside its 16pt
        /// trailing padding, on its middle line.
        func counter(in badge: CGRect) -> CGRect {
            CGRect(x: badge.maxX - KozmosDimensions.primitivesLayoutSpacing200 - 20, y: badge.midY - 10, width: 20, height: 20)
        }
        for scheme in [ColorScheme.light, .dark] {
            let pixels = try draw(KozmosBadge("Results", counter: "3", showCounter: true), in: scheme)
            guard let badge = pixels.boundingBox(where: DrawnPixels.matches(Self.themeFill, tolerance: 4)) else {
                XCTFail("\(scheme): no #135BEC badge drawn")
                continue
            }
            let pill = counter(in: badge)
            let area = Int(pill.width * pixels.scale) * Int(pill.height * pixels.scale)
            let white = pixels.count(in: pill, where: DrawnPixels.matches(Self.white, tolerance: 4))
            XCTAssertGreaterThan(white, area / 2,
                                 "\(scheme): the counter is not white; its lightest pixel is \(Self.describe(Self.lightest(pixels, in: pill)))")
            // Inside the pill's circle, clear of the badge's fill round it.
            let number = pixels.count(in: pill.insetBy(dx: 5, dy: 4), where: DrawnPixels.matches(Self.themeFill, tolerance: 4))
            XCTAssertGreaterThan(number, 4, "\(scheme): the counter's number is not the theme fill")

            let surface = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let dangerFill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle, in: scheme)
            let destructive = try draw(KozmosBadge("Closed", variant: .destructive, counter: "3", showCounter: true), in: scheme)
            guard let danger = destructive.boundingBox(where: DrawnPixels.matches(dangerFill, tolerance: 4)) else {
                XCTFail("\(scheme): no destructive badge drawn")
                continue
            }
            XCTAssertGreaterThan(destructive.count(in: counter(in: danger), where: DrawnPixels.matches(surface, tolerance: 4)), area / 2,
                                 "\(scheme): the destructive badge's counter is no longer background/0")
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
