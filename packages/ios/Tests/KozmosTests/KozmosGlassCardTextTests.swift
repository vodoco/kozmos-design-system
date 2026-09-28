#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 48 on every glass surface (2026-09-28): the cards that float
/// over the map with a surface of their own — the manoeuvre, its itinerary,
/// the route summary, the feedback card and the save-location card — draw
/// text that is muted elsewhere in the foreground colour on glass, so it
/// reads at 4.5:1 over any map. They read the surface they sit on,
/// `kozmosSurfaceStyle`, which their own `kozmosSurface` says.
///
/// Each card sits over the glass stories' two saturated rooms, the theme's
/// blue and the warning amber, in both orders. Each text is found by its
/// absence: the card drawn again with that text as spaces, which lay out as
/// it does and draw nothing, so the pixels that differ are its glyphs. The
/// text's colour is their core, the pixel furthest in luminance from what
/// lies behind it; the contrast is its WCAG ratio with the least contrasting
/// pixel behind its glyphs.
final class KozmosGlassCardTextTests: XCTestCase {
    private let size = CGSize(width: 390, height: 420)

    private enum Card: String, CaseIterable {
        case manoeuvre, manoeuvreOpen, routeSummary, feedback, saveLocation
    }

    /// Each card's text that is muted elsewhere.
    private func texts(_ card: Card) -> [String] {
        switch card {
        case .manoeuvre: return ["58 m · Level 2"]
        case .manoeuvreOpen: return ["From", "Harbour Coffee Co.", "To"]
        case .routeSummary: return ["201 m"]
        case .feedback: return ["Tell us how it went."]
        case .saveLocation: return ["Terminal 2, Level 1"]
        }
    }

    /// The card on `surface`, with the text `blank` drawn as spaces.
    @ViewBuilder private func card(_ card: Card, surface: KozmosSurfaceStyle, blank: String? = nil) -> some View {
        let text = { (s: String) in s == blank ? String(repeating: " ", count: s.count) : s }
        switch card {
        case .manoeuvre, .manoeuvreOpen:
            KozmosManoeuvreCard(
                type: .straight, instruction: "Take the lift down to Level 1", detail: text("58 m · Level 2"),
                isExpanded: card == .manoeuvreOpen, onToggle: {}, surface: surface
            ) {
                KozmosItinerary(
                    origin: text("Harbour Coffee Co."),
                    steps: [KozmosItineraryStep(id: "lift", instruction: "Take the lift down", type: .straight, isCurrent: true)],
                    destination: "Gate 12", originLabel: text("From"), destinationLabel: text("To")
                )
            }
        case .routeSummary:
            KozmosRouteSummary(etaText: "4 min", distanceText: text("201 m"), onEndRoute: {}, surface: surface)
        case .feedback:
            KozmosFeedbackCard(title: "How was your route?", description: text("Tell us how it went."), surface: surface)
        case .saveLocation:
            KozmosSaveLocationCard(title: "Gate 12", description: text("Terminal 2, Level 1"), surface: surface)
        }
    }

    /// The glass stories' two saturated rooms, as the backdrop's halves.
    private func rooms(amberFirst: Bool) -> some View {
        HStack(spacing: 0) {
            (amberFirst ? KozmosColors.primitivesColorsEmotionalAlert800 : KozmosColors.primitivesColorsTheme600)
            (amberFirst ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsEmotionalAlert800)
        }
    }

    private func scene<Content: View>(_ scheme: ColorScheme, amberFirst: Bool, @ViewBuilder content: () -> Content) -> some View {
        ZStack(alignment: .top) {
            rooms(amberFirst: amberFirst)
            content().padding(16)
        }
        .frame(width: size.width, height: size.height)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, scheme)
    }

    @MainActor private func render<V: View>(_ view: V, _ name: String, attach: Bool = true) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
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
    private typealias Glyphs = (ratio: Double, core: RGB, behind: RGB, pixels: Int)

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

    private func describe(_ c: RGB) -> String { "(\(c.r), \(c.g), \(c.b))" }

    /// The text drawn in `drawn` and not in `blanked`, read against what
    /// `blanked` draws behind it. Nil if nothing differs.
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

    /// Each of the card's muted texts, read one at a time.
    @MainActor private func reads(
        _ card: Card, surface: KozmosSurfaceStyle, _ scheme: ColorScheme, amberFirst: Bool
    ) async throws -> [(text: String, read: Glyphs?)] {
        let name = "decision-48-\(card.rawValue)-\(surface)-\(scheme)-\(amberFirst ? "amber" : "blue")"
        let drawn = try await render(scene(scheme, amberFirst: amberFirst) { self.card(card, surface: surface) }, name)
        var reads: [(text: String, read: Glyphs?)] = []
        for text in texts(card) {
            let blanked = try await render(
                scene(scheme, amberFirst: amberFirst) { self.card(card, surface: surface, blank: text) },
                "\(name)-without-\(text)", attach: false)
            reads.append((text, glyphs(drawn, blanked)))
        }
        return reads
    }

    // MARK: The cases

    /// On glass, each card's muted text reads at 4.5:1 or more over either
    /// room, light and dark.
    @MainActor func testOnGlassAFloatingCardsMutedTextReadsAtFourAndAHalfToOne() async throws {
        var low: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for amberFirst in [false, true] {
                let room = amberFirst ? "amber" : "blue"
                for card in Card.allCases {
                    for (text, read) in try await reads(card, surface: .glass, scheme, amberFirst: amberFirst) {
                        guard let at = read else {
                            low.append("\(card.rawValue) \"\(text)\", \(scheme), \(room): not drawn")
                            continue
                        }
                        let line = "\(card.rawValue) \"\(text)\", \(scheme), \(room): \(String(format: "%.2f", at.ratio)):1, text \(describe(at.core)) over \(describe(at.behind))"
                        print("Decision 48 iOS, on a glass card: \(line), \(at.pixels) pixels")
                        if at.ratio < 4.5 { low.append(line) }
                    }
                }
            }
        }
        XCTAssertTrue(low.isEmpty, "below 4.5:1 on glass: \(low.joined(separator: "; "))")
    }

    /// The guard: on a solid card each text keeps the theme's muted colour:
    /// its glyphs' core is nearer a swatch of the muted token than one of the
    /// foreground, light and dark.
    @MainActor func testOnASolidCardTheMutedTextKeepsItsMutedColour() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            let muted = try await render(
                KozmosColors.primitivesColorsForeground500.environment(\.colorScheme, scheme),
                "decision-48-card-muted-swatch-\(scheme)").color(at: centre)
            let ink = try await render(
                KozmosColors.primitivesColorsForeground100.environment(\.colorScheme, scheme),
                "decision-48-card-ink-swatch-\(scheme)").color(at: centre)
            for card in Card.allCases {
                for (text, read) in try await reads(card, surface: .solid, scheme, amberFirst: false) {
                    guard let at = read else {
                        wrong.append("\(card.rawValue) \"\(text)\", \(scheme): not drawn")
                        continue
                    }
                    let core = Self.luminance(at.core)
                    print("Decision 48 iOS, \(card.rawValue) \"\(text)\" on a solid card, \(scheme): \(describe(at.core)), muted \(describe(muted)), ink \(describe(ink))")
                    if abs(core - Self.luminance(muted)) >= abs(core - Self.luminance(ink)) {
                        wrong.append("\(card.rawValue) \"\(text)\", \(scheme): drew \(describe(at.core)), nearer the ink \(describe(ink)) than the muted \(describe(muted))")
                    }
                }
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }
}
#endif
