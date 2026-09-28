#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 48 (2026-09-28): on glass, text that is muted elsewhere takes
/// the foreground colour, so it reads at 4.5:1 over any map; the glass
/// itself is as it was. Muted over the glass stories' saturated rooms, the
/// theme's blue and the warning amber, the route preview's "To" and the
/// details card's level line read about 3.7:1 on the web.
///
/// Each case is drawn twice: with the part, and with the panel hosting
/// nothing. The part paints no fill of its own (decision 43), so where the
/// two differ is its text, and the empty panel is exactly what lies behind
/// it. The text's colour is its glyphs' core, the pixel furthest in
/// luminance from the glass behind it; the contrast is its WCAG ratio with
/// the least contrasting pixel of the glass under its glyphs. The details
/// card's body holds more than lines at its edge, so each of its texts is
/// found by its absence instead: the card drawn again with that text as
/// spaces, which lay out as it does and draw nothing.
final class KozmosMapShellGlassTextTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)

    private let options = [
        KozmosRouteOptionPresentation(
            id: "quickest", label: "Quickest", durationSeconds: 240, durationLabel: "4 min",
            distanceMetres: 150, distanceLabel: "150 m", preference: .quickest, selected: true
        ),
        KozmosRouteOptionPresentation(
            id: "step-free", label: "Step-free", durationSeconds: 360, durationLabel: "6 min",
            distanceMetres: 173, distanceLabel: "173 m", preference: .stepFree
        ),
    ]

    private func route() -> some View {
        KozmosRoutePreviewPanel(
            destinationName: "Harbour Coffee Co.", options: options, status: .ready,
            backLabel: "Back", continueLabel: "Start", optionsCountLabel: "2 route options",
            onOptionSelect: { _ in }, onBack: {}, onContinue: { _ in }
        )
    }

    /// The details card in its sheet presentation, with a short name on one
    /// line and only its close button, so its level line is its second line.
    private func details() -> some View {
        KozmosPOIDetailPanel(
            poi: KozmosPOIPresentation(id: "cafe", name: "Cafe", floorId: "2", floorLabel: "Level 2"),
            actionLabels: [:], onAction: { _, _ in }, onClose: {}, presentation: .sheet
        )
    }

    /// The texts of the details card's body that are muted elsewhere.
    private let bodyTexts = ["Quiet now", "Image 1 of 1", "Service options", "Dietary options", "Hours vary on holidays"]

    /// The details card with a body, in `presentation`: a summary with only
    /// a note, a photo whose address is refused, so its tile is unavailable
    /// at once, a service, a group of attributes, and opening hours with a
    /// note, shown open. The text `blank` is drawn as as many spaces, which
    /// lay out as it does and draw nothing, so where the two renders differ
    /// is exactly its glyphs.
    private func detailsWithBody(_ presentation: KozmosPOIDetailPanel.Presentation = .sheet, blank: String? = nil) -> some View {
        func text(_ s: String) -> String { s == blank ? String(repeating: " ", count: s.count) : s }
        return KozmosPOIDetailPanel(
            poi: KozmosPOIPresentation(
                id: "cafe", name: "Cafe", floorId: "2", floorLabel: "Level 2",
                media: [KozmosPOIMediaPresentation(id: "front", src: "file:///front.jpg", alt: "The front")],
                services: [KozmosPOIServicePresentation(id: "wifi", label: "Wi-Fi")]
            ),
            actionLabels: [:], onAction: { _, _ in }, onClose: {},
            mediaPositionLabel: { _, _ in text("Image 1 of 1") },
            servicesHeading: text("Service options"), presentation: presentation,
            details: KozmosPOIDetailsPresentation(
                summary: [KozmosPOIDetailSummary(id: "crowd", label: "Crowd", value: "", detail: text("Quiet now"))],
                groups: [KozmosPOIDetailAttributeGroup(id: "dietary", heading: text("Dietary options"),
                                                       items: [KozmosPOIDetailTag(id: "vegan", label: "Vegan")])],
                openingHours: KozmosPOIOpeningHours(
                    label: "Opening hours", summary: "Open until 18:00",
                    rows: [.init(id: "monday", day: "Monday", hours: "8:00 to 18:00")],
                    note: text("Hours vary on holidays"))
            )
        )
        .disclosureGroupStyle(ContentShown())
    }

    /// A disclosure group drawn open, so the opening hours' note is drawn.
    private struct ContentShown: DisclosureGroupStyle {
        func makeBody(configuration: Configuration) -> some View {
            VStack(alignment: .leading, spacing: 0) { configuration.label; configuration.content }
        }
    }

    /// The glass stories' two saturated rooms, as the map's halves: every
    /// line at the panel's start edge sits over the first of them.
    private func rooms(amberFirst: Bool) -> some View {
        HStack(spacing: 0) {
            (amberFirst ? KozmosColors.primitivesColorsEmotionalAlert800 : KozmosColors.primitivesColorsTheme600)
            (amberFirst ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsEmotionalAlert800)
        }
    }

    /// The shell on a phone, its sheet resting at medium over the rooms
    /// unless said otherwise, glass unless said otherwise, with `panel` as
    /// its panel's content.
    private func shell<Panel: View>(
        _ scheme: ColorScheme, amberFirst: Bool, surface: KozmosSurfaceStyle = .glass,
        detent: KozmosMapPanelDetent = .medium, @ViewBuilder panel: () -> Panel
    ) -> some View {
        KozmosAdaptiveMapShell(
            panelDetent: .constant(detent), panelSurface: surface,
            map: { rooms(amberFirst: amberFirst) }, panel: panel
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, scheme)
    }

    @MainActor private func render<V: View>(
        _ view: V, _ name: String, size: CGSize? = nil, attach: Bool = true
    ) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size ?? phone)
        if attach {
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = name
            attachment.lifetime = .keepAlways
            add(attachment)
        }
        return pixels
    }

    // MARK: Colour

    private typealias RGB = (r: UInt8, g: UInt8, b: UInt8)

    private static func luminance(_ c: RGB) -> Double {
        func channel(_ v: UInt8) -> Double {
            let c = Double(v) / 255
            return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    }

    private static func contrast(_ a: RGB, _ b: RGB) -> Double {
        let (la, lb) = (luminance(a), luminance(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    private static func differs(_ a: RGB, _ b: RGB) -> Bool {
        max(abs(Int(a.r) - Int(b.r)), abs(Int(a.g) - Int(b.g)), abs(Int(a.b) - Int(b.b))) > 24
    }

    // MARK: Finding a line of text

    /// The sheet's top edge: where the glass starts, down a column clear of
    /// its rounded corners, in the render with nothing hosted.
    private func sheetTop(in empty: RenderedPixels) -> CGFloat {
        let map = empty.color(at: CGPoint(x: 40, y: 20))
        var y: CGFloat = 40
        while y < phone.height, !Self.differs(empty.color(at: CGPoint(x: 40, y: y)), map) { y += 1.0 / empty.scale }
        return y
    }

    /// The lines of the part's text in a band at the panel's start edge,
    /// from `top` down: the rows where the part and the empty panel differ,
    /// grouped where they touch.
    private func lines(_ drawn: RenderedPixels, _ empty: RenderedPixels, x: ClosedRange<CGFloat>,
                       from top: CGFloat, to bottom: CGFloat) -> [ClosedRange<CGFloat>] {
        let step = 1.0 / drawn.scale
        var found: [ClosedRange<CGFloat>] = []
        var start: CGFloat?
        var y = top
        while y < bottom {
            var any = false
            var px = x.lowerBound
            while px < x.upperBound {
                if Self.differs(drawn.color(at: CGPoint(x: px, y: y)), empty.color(at: CGPoint(x: px, y: y))) { any = true; break }
                px += step
            }
            if any, start == nil { start = y }
            if !any, let s = start { found.append(s...y); start = nil }
            y += step
        }
        if let s = start { found.append(s...bottom) }
        return found
    }

    /// The contrast of the line's text with the glass behind it, as read in
    /// the band `x` over the rows `rows`.
    private func contrast(_ drawn: RenderedPixels, _ empty: RenderedPixels, x: ClosedRange<CGFloat>,
                          rows: ClosedRange<CGFloat>) -> (ratio: Double, core: RGB, behind: RGB) {
        let step = 1.0 / drawn.scale
        var glyphs: [(CGPoint, RGB, RGB)] = []
        var y = rows.lowerBound
        while y <= rows.upperBound {
            var px = x.lowerBound
            while px < x.upperBound {
                let point = CGPoint(x: px, y: y)
                let (a, b) = (drawn.color(at: point), empty.color(at: point))
                if Self.differs(a, b) { glyphs.append((point, a, b)) }
                px += step
            }
            y += step
        }
        guard let core = glyphs.max(by: { abs(Self.luminance($0.1) - Self.luminance($0.2)) < abs(Self.luminance($1.1) - Self.luminance($1.2)) }) else {
            return (0, (0, 0, 0), (0, 0, 0))
        }
        let worst = glyphs.min(by: { Self.contrast(core.1, $0.2) < Self.contrast(core.1, $1.2) })!
        return (Self.contrast(core.1, worst.2), core.1, worst.2)
    }

    private func describe(_ c: RGB) -> String { "(\(c.r), \(c.g), \(c.b))" }

    // MARK: Finding one text by its absence

    private typealias Glyphs = (ratio: Double, core: RGB, behind: RGB, pixels: Int)

    /// The text drawn in `drawn` and not in `blanked`, read against what
    /// `blanked` draws behind it: its glyphs are the pixels where the two
    /// differ, its colour their core, the pixel furthest in luminance from
    /// what lies behind it, and its contrast the core's WCAG ratio with the
    /// least contrasting pixel behind its glyphs. Nil if nothing differs.
    private func glyphs(_ drawn: RenderedPixels, _ blanked: RenderedPixels) -> Glyphs? {
        var found: [(RGB, RGB)] = []
        for py in 0..<drawn.height {
            for px in 0..<drawn.width {
                let point = CGPoint(x: (CGFloat(px) + 0.5) / drawn.scale, y: (CGFloat(py) + 0.5) / drawn.scale)
                let (a, b) = (drawn.color(at: point), blanked.color(at: point))
                if Self.differs(a, b) { found.append((a, b)) }
            }
        }
        guard let core = found.max(by: {
            abs(Self.luminance($0.0) - Self.luminance($0.1)) < abs(Self.luminance($1.0) - Self.luminance($1.1))
        }) else { return nil }
        let worst = found.min(by: { Self.contrast(core.0, $0.1) < Self.contrast(core.0, $1.1) })!
        return (Self.contrast(core.0, worst.1), core.0, worst.1, found.count)
    }

    /// A phone tall enough that the details card's whole body shows with the
    /// sheet at its largest detent.
    private let tall = CGSize(width: 390, height: 1200)

    /// Each of the body's texts read one at a time: the card drawn whole,
    /// then drawn again with that text blanked.
    @MainActor private func bodyReads(
        _ scheme: ColorScheme, amberFirst: Bool, surface: KozmosSurfaceStyle,
        presentation: KozmosPOIDetailPanel.Presentation, name: String
    ) async throws -> [(text: String, read: Glyphs?)] {
        let drawn = try await render(
            shell(scheme, amberFirst: amberFirst, surface: surface, detent: .large) { detailsWithBody(presentation) },
            "decision-48-body-\(name)", size: tall)
        var reads: [(text: String, read: Glyphs?)] = []
        for text in bodyTexts {
            let blanked = try await render(
                shell(scheme, amberFirst: amberFirst, surface: surface, detent: .large) {
                    detailsWithBody(presentation, blank: text)
                },
                "decision-48-body-\(name)-without-\(text)", size: tall, attach: false)
            reads.append((text, glyphs(drawn, blanked)))
        }
        return reads
    }

    // MARK: The cases

    /// The route preview's "To", the first line under the grabber, and the
    /// details card's level line, the second under its one-line title: at
    /// 4.5:1 or more over either room, light and dark.
    @MainActor func testOnAGlassSheetTheHostedPartsMutedTextReadsAtFourAndAHalfToOne() async throws {
        var low: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for amberFirst in [false, true] {
                let room = amberFirst ? "amber" : "blue"
                let empty = try await render(shell(scheme, amberFirst: amberFirst) { Color.clear }, "decision-48-empty-\(scheme)-\(room)")
                let top = sheetTop(in: empty)
                let band: ClosedRange<CGFloat> = 12...150
                for (name, index, part) in [
                    ("To", 0, AnyView(route())),
                    ("the level line", 1, AnyView(details())),
                ] {
                    let drawn = try await render(shell(scheme, amberFirst: amberFirst) { part }, "decision-48-\(name)-\(scheme)-\(room)")
                    let found = lines(drawn, empty, x: band, from: top + 16, to: top + 120)
                    guard found.count > index else {
                        low.append("\(name), \(scheme), \(room): only \(found.count) lines of text found")
                        continue
                    }
                    let at = contrast(drawn, empty, x: band, rows: found[index])
                    print("Decision 48 iOS, \(name) on glass over \(room), \(scheme): \(String(format: "%.2f", at.ratio)):1, text \(describe(at.core)) over \(describe(at.behind))")
                    if at.ratio < 4.5 {
                        low.append("\(name), \(scheme), \(room): \(String(format: "%.2f", at.ratio)):1, text \(describe(at.core)) over \(describe(at.behind))")
                    }
                }
            }
        }
        XCTAssertTrue(low.isEmpty, "below 4.5:1 on glass: \(low.joined(separator: "; "))")
    }

    /// The guard: only glass turns muted text to ink. On a solid sheet "To"
    /// keeps the theme's muted colour: its glyphs' core is the colour a
    /// swatch of the muted token draws, light and dark.
    @MainActor func testOnASolidSheetTheMutedTextKeepsItsMutedColour() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let swatch = try await render(
                KozmosColors.primitivesColorsForeground500.environment(\.colorScheme, scheme), "decision-48-muted-swatch-\(scheme)")
                .color(at: CGPoint(x: phone.width / 2, y: phone.height / 2))
            let empty = try await render(shell(scheme, amberFirst: false, surface: .solid) { Color.clear }, "decision-48-empty-solid-\(scheme)")
            let drawn = try await render(shell(scheme, amberFirst: false, surface: .solid) { route() }, "decision-48-To-solid-\(scheme)")
            let band: ClosedRange<CGFloat> = 12...150
            let top = sheetTop(in: empty)
            guard let first = lines(drawn, empty, x: band, from: top + 16, to: top + 120).first else {
                wrong.append("\(scheme): no text found under the grabber")
                continue
            }
            let core = contrast(drawn, empty, x: band, rows: first).core
            print("Decision 48 iOS, To on a solid sheet, \(scheme): \(describe(core)), the muted swatch \(describe(swatch))")
            let near = abs(Int(core.r) - Int(swatch.r)) <= 8 && abs(Int(core.g) - Int(swatch.g)) <= 8 && abs(Int(core.b) - Int(swatch.b)) <= 8
            if !near { wrong.append("\(scheme): \"To\" drew \(describe(core)), not the muted \(describe(swatch))") }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    /// The details card's body in its sheet presentation: its summary's
    /// note, its gallery's position, the headings of its services and of a
    /// group of attributes, and its opening hours' note, each muted
    /// elsewhere, at 4.5:1 or more over either room, light and dark.
    @MainActor func testOnAGlassSheetTheDetailsCardsBodyReadsAtFourAndAHalfToOne() async throws {
        var low: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for amberFirst in [false, true] {
                let room = amberFirst ? "amber" : "blue"
                let reads = try await bodyReads(
                    scheme, amberFirst: amberFirst, surface: .glass, presentation: .sheet, name: "\(scheme)-\(room)")
                for (text, read) in reads {
                    guard let at = read else {
                        low.append("\"\(text)\", \(scheme), \(room): not drawn")
                        continue
                    }
                    let line = "\"\(text)\", \(scheme), \(room): \(String(format: "%.2f", at.ratio)):1, text \(describe(at.core)) over \(describe(at.behind))"
                    print("Decision 48 iOS, on glass: \(line), \(at.pixels) pixels")
                    if at.ratio < 4.5 { low.append(line) }
                }
            }
        }
        XCTAssertTrue(low.isEmpty, "below 4.5:1 on glass: \(low.joined(separator: "; "))")
    }

    /// The guard for the body: only the panel's glass turns its muted text
    /// to ink. On a solid sheet, and in the bordered panel presentation on a
    /// glass sheet, a card of its own that its text sits on, each text's
    /// core is nearer a swatch of the muted token than one of the
    /// foreground, light and dark.
    @MainActor func testOffTheGlassTheDetailsCardsBodyKeepsItsMutedColour() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let centre = CGPoint(x: phone.width / 2, y: phone.height / 2)
            let muted = try await render(
                KozmosColors.primitivesColorsForeground500.environment(\.colorScheme, scheme),
                "decision-48-body-muted-swatch-\(scheme)").color(at: centre)
            let ink = try await render(
                KozmosColors.primitivesColorsForeground100.environment(\.colorScheme, scheme),
                "decision-48-body-ink-swatch-\(scheme)").color(at: centre)
            for (surface, presentation, place) in [
                (KozmosSurfaceStyle.solid, KozmosPOIDetailPanel.Presentation.sheet, "on a solid sheet"),
                (.glass, .panel, "in the bordered card on a glass sheet"),
            ] {
                let reads = try await bodyReads(
                    scheme, amberFirst: false, surface: surface, presentation: presentation,
                    name: "\(surface)-\(presentation)-\(scheme)")
                for (text, read) in reads {
                    guard let at = read else {
                        wrong.append("\"\(text)\" \(place), \(scheme): not drawn")
                        continue
                    }
                    let core = Self.luminance(at.core)
                    let nearer = abs(core - Self.luminance(muted)) < abs(core - Self.luminance(ink))
                    print("Decision 48 iOS, \"\(text)\" \(place), \(scheme): \(describe(at.core)), muted \(describe(muted)), ink \(describe(ink))")
                    if !nearer {
                        wrong.append("\"\(text)\" \(place), \(scheme): drew \(describe(at.core)), nearer the ink \(describe(ink)) than the muted \(describe(muted))")
                    }
                }
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }
}
#endif
