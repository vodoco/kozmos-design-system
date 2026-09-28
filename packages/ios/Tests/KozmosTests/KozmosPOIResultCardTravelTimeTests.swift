import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 50 (Olcay, 2026-09-28; GAP-088): a result list shows the walk as
/// a band. Nearby is drawn in the success emotion's Text role, the other
/// bands in the card's text colour, and a result given no band keeps the
/// exact minutes, as the details card always does.
final class KozmosPOIResultCardTravelTimeTests: XCTestCase {
    private let poi = KozmosPOIPresentation(id: "gate-12", name: "Gate 12", floorLabel: "Level 1")

    private func result(_ band: KozmosTravelTimeBand?, selected: Bool = false) -> KozmosPOIResultPresentation {
        KozmosPOIResultPresentation(
            poiId: "gate-12",
            resultIndex: 0,
            selected: selected,
            travelEstimate: KozmosTravelEstimatePresentation(durationSeconds: 45, durationLabel: "1 min", band: band)
        )
    }

    private func card(
        _ band: KozmosTravelTimeBand?,
        labels: [KozmosTravelTimeBand: String] = [:],
        selected: Bool = false
    ) -> KozmosPOIResultCard {
        KozmosPOIResultCard(poi: poi, result: result(band, selected: selected), travelTimeBandLabels: labels, onSelect: { _ in })
    }

    // MARK: What the card says

    func testAWalkUnderAMinuteReadsNearbyAndVoiceOverHearsNearby() {
        let nearby = card(.nearby)
        XCTAssertEqual(nearby.travelTimeText, "Nearby")
        // The word is the signal, so the tone is never carried by colour alone.
        XCTAssertTrue(nearby.accessibilityDescription.contains("Nearby"), nearby.accessibilityDescription)
        XCTAssertFalse(nearby.accessibilityDescription.contains("1 min"), nearby.accessibilityDescription)
    }

    func testEachBandReadsItsEnglishWordsUntilTheProductGivesItsOwn() {
        XCTAssertEqual(
            KozmosTravelTimeBand.allCases.map { card($0).travelTimeText },
            ["Nearby", "1–2 min", "2–5 min", "5–10 min", "More than 10 min"]
        )
        XCTAssertEqual(card(.nearby, labels: [.nearby: "À proximité"]).travelTimeText, "À proximité")
        XCTAssertEqual(card(.twoToFiveMinutes, labels: [.nearby: "À proximité"]).travelTimeText, "2–5 min")
    }

    func testWithoutABandTheCardKeepsTheExactMinutes() {
        // The guard: every product that has not adopted bands draws as it did.
        XCTAssertEqual(card(nil).travelTimeText, "1 min")
        XCTAssertTrue(card(nil).accessibilityDescription.contains("1 min"))
    }

    func testTheListGivesEveryResultTheProductsWords() {
        // The card holds the words, so the list must hand them on, or a
        // translated product reads "Nearby" in English in every list.
        let item = KozmosPOIResultListItem(poi: poi, result: result(.nearby))
        let list = KozmosPOIResultList(
            items: [item],
            resultCountLabel: "1 result",
            travelTimeBandLabels: [.nearby: "À proximité"],
            onSelect: { _ in }
        )
        XCTAssertEqual(list.card(for: item).travelTimeText, "À proximité")
    }

    #if os(iOS)
    // MARK: What the card draws, light and dark

    private let size = CGSize(width: 390, height: 132)

    /// The card, 16 in, in `scheme`; with `blank`, its travel time drawn as
    /// spaces, which lay out as the words do and draw nothing.
    private func scene(_ band: KozmosTravelTimeBand, _ scheme: ColorScheme, selected: Bool, blank: Bool = false) -> some View {
        let words = KozmosPOIResultCard.englishLabel(band)
        return card(band, labels: blank ? [band: String(repeating: " ", count: words.count)] : [:], selected: selected)
            .padding(16)
            .frame(width: size.width, height: size.height, alignment: .top)
            .background(KozmosColors.primitivesColorsBackground0)
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

    private static func distance(_ a: RGB, _ b: RGB) -> Int {
        abs(Int(a.r) - Int(b.r)) + abs(Int(a.g) - Int(b.g)) + abs(Int(a.b) - Int(b.b))
    }

    private func describe(_ c: RGB) -> String { "(\(c.r), \(c.g), \(c.b))" }

    /// The travel time's glyphs: the pixels the words draw and the spaces do
    /// not. Their core is the pixel furthest in luminance from what lies
    /// behind it, and their contrast its WCAG ratio with the least
    /// contrasting pixel behind them. Nil if nothing was drawn.
    private func glyphs(_ drawn: RenderedPixels, _ blanked: RenderedPixels) -> (ratio: Double, core: RGB, behind: RGB, pixels: Int)? {
        var found: [(RGB, RGB)] = []
        for py in 0..<drawn.height {
            for px in 0..<drawn.width {
                let point = CGPoint(x: (CGFloat(px) + 0.5) / drawn.scale, y: (CGFloat(py) + 0.5) / drawn.scale)
                let (a, b) = (drawn.color(at: point), blanked.color(at: point))
                if Self.distance(a, b) > 24 { found.append((a, b)) }
            }
        }
        guard let core = found.max(by: {
            abs(Self.luminance($0.0) - Self.luminance($0.1)) < abs(Self.luminance($1.0) - Self.luminance($1.1))
        }) else { return nil }
        let worst = found.min(by: { Self.contrast(core.0, $0.1) < Self.contrast(core.0, $1.1) })!
        return (Self.contrast(core.0, worst.1), core.0, worst.1, found.count)
    }

    /// Nearby draws in the success colour and reads at 4.5:1 or more on the
    /// card, at rest and selected, light and dark; 5–10 min draws in the
    /// card's text colour. A drawn colour is the swatch it is nearer to.
    @MainActor func testNearbyDrawsInTheSuccessColourAtFourAndAHalfToOneAndTheOtherBandsInTheTextColour() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            let success = try await render(
                KozmosColors.semanticsEmotionSuccessText.environment(\.colorScheme, scheme),
                "decision-50-success-swatch-\(scheme)", attach: false).color(at: centre)
            let ink = try await render(
                KozmosColors.primitivesColorsForeground100.environment(\.colorScheme, scheme),
                "decision-50-ink-swatch-\(scheme)", attach: false).color(at: centre)
            for (band, selected) in [(KozmosTravelTimeBand.nearby, false), (.nearby, true), (.fiveToTenMinutes, false)] {
                let name = "decision-50-\(band.rawValue)-\(selected ? "selected" : "rest")-\(scheme)"
                let drawn = try await render(scene(band, scheme, selected: selected), name)
                let blanked = try await render(scene(band, scheme, selected: selected, blank: true), "\(name)-blank", attach: false)
                guard let at = glyphs(drawn, blanked) else {
                    wrong.append("\(name): the travel time was not drawn")
                    continue
                }
                let nearer = Self.distance(at.core, success) < Self.distance(at.core, ink) ? "success" : "ink"
                let line = "\(name): \(String(format: "%.2f", at.ratio)):1, text \(describe(at.core)) over \(describe(at.behind)), nearer the \(nearer) \(describe(nearer == "success" ? success : ink)), \(at.pixels) pixels"
                print("Decision 50 iOS: \(line)")
                if at.ratio < 4.5 { wrong.append("\(line): under 4.5:1") }
                if nearer != (band.tone == .success ? "success" : "ink") { wrong.append("\(line): the wrong colour") }
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    /// The details card keeps the exact minutes: given the same estimate with
    /// its band and without, it draws the same pixels. That it would show a
    /// change there is proved by the same card with other minutes, which it
    /// draws differently.
    @MainActor func testTheDetailsPanelDrawsTheSameWithTheBandAsWithout() async throws {
        let size = CGSize(width: 390, height: 420)
        let place = KozmosPOIPresentation(id: "gate-12", name: "Gate 12", floorLabel: "Level 1", actions: [.navigate])
        func panel(_ band: KozmosTravelTimeBand?, minutes: String) -> some View {
            KozmosPOIDetailPanel(
                poi: place,
                actionLabels: [.navigate: "Go"],
                onAction: { _, _ in },
                details: KozmosPOIDetailsPresentation(
                    travelEstimate: KozmosTravelEstimatePresentation(
                        durationSeconds: 45, durationLabel: minutes, distanceLabel: "40 m", band: band
                    )
                )
            )
            .frame(width: size.width, height: size.height, alignment: .top)
            .environment(\.colorScheme, .light)
        }
        func differing(_ one: RenderedPixels, _ two: RenderedPixels) -> Int {
            var count = 0
            for py in 0..<one.height {
                for px in 0..<one.width {
                    let point = CGPoint(x: (CGFloat(px) + 0.5) / one.scale, y: (CGFloat(py) + 0.5) / one.scale)
                    if Self.distance(one.color(at: point), two.color(at: point)) > 0 { count += 1 }
                }
            }
            return count
        }
        let exact = try await RenderedPixels.render(panel(nil, minutes: "1 min"), size: size)
        let banded = try await RenderedPixels.render(panel(.nearby, minutes: "1 min"), size: size)
        let other = try await RenderedPixels.render(panel(nil, minutes: "9 min"), size: size)
        let attachment = XCTAttachment(image: banded.image)
        attachment.name = "decision-50-details-with-band"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCTAssertGreaterThan(differing(exact, other), 0, "the details card draws no estimate this test could see change")
        XCTAssertEqual(differing(exact, banded), 0, "the details card draws the band: it should keep the exact minutes")
    }
    #endif
}
