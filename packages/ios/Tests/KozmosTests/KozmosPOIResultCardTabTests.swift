import SwiftUI
import XCTest
@testable import Kozmos

/// Olcay, 2026-09-29: quick access numbers its results as the map numbers
/// their pins, and the product turns numbering on per list. One tab per card:
/// Featured, then the number, then the badge. A number is quiet at rest and
/// filled with the primary colour when selected; a badge is quiet, with no
/// Featured star or colour (GAP-054).
final class KozmosPOIResultCardTabTests: XCTestCase {
    private let poi = KozmosPOIPresentation(id: "burger-king", name: "Burger King", floorLabel: "Level 1")

    private func result(
        featured: Bool = false,
        selected: Bool = false,
        badge: String? = nil
    ) -> KozmosPOIResultPresentation {
        KozmosPOIResultPresentation(
            poiId: "burger-king",
            resultIndex: 2,
            selected: selected,
            featured: featured,
            badge: badge.map { KozmosPOIResultBadgePresentation(label: $0) }
        )
    }

    private func card(
        numbered: Bool,
        featured: Bool = false,
        selected: Bool = false,
        badge: String? = nil,
        selectionLabel: String? = nil
    ) -> KozmosPOIResultCard {
        KozmosPOIResultCard(
            poi: poi,
            result: result(featured: featured, selected: selected, badge: badge),
            selectionLabel: selectionLabel,
            numbered: numbered,
            onSelect: { _ in }
        )
    }

    // MARK: Which tab

    func testANumberShowsOnlyWhenTheProductNumbersTheList() {
        // An upgrade changes nothing: without `numbered` there is no tab.
        XCTAssertNil(card(numbered: false).tab)
        XCTAssertEqual(card(numbered: true).tab, .number("2"))
        XCTAssertEqual(card(numbered: true).numberText, "2")
    }

    func testFeaturedWinsOverTheNumberAndTheNumberOverTheBadge() {
        // A featured result's pin shows its logo, so its card shows Featured.
        XCTAssertEqual(card(numbered: true, featured: true).tab, .featured)
        XCTAssertNil(card(numbered: true, featured: true).numberText)
        // The list's numbers match the pins, so the number takes the badge's place.
        XCTAssertEqual(card(numbered: true, badge: "Alternative").tab, .number("2"))
        XCTAssertEqual(card(numbered: false, badge: "Alternative").tab, .badge("Alternative"))
    }

    // MARK: What VoiceOver hears

    func testTheNumberLeadsWhatVoiceOverSaysAndASelectionLabelReplacesIt() {
        let numbered = card(numbered: true)
        XCTAssertTrue(
            numbered.accessibilityDescription.hasPrefix("2, Burger King"),
            numbered.accessibilityDescription
        )
        XCTAssertTrue(card(numbered: false).accessibilityDescription.hasPrefix("Burger King"))
        // Featured shows no number, so none is heard.
        XCTAssertTrue(
            card(numbered: true, featured: true).accessibilityDescription.hasPrefix("Featured, Burger King"),
            card(numbered: true, featured: true).accessibilityDescription
        )
        // The product's own words, number and all.
        XCTAssertEqual(
            card(numbered: true, selectionLabel: "Résultat 2 : Burger King").accessibilityDescription,
            "Résultat 2 : Burger King"
        )
    }

    // MARK: The list

    func testTheListNumbersEveryCardItDraws() {
        let item = KozmosPOIResultListItem(poi: poi, result: result())
        let off = KozmosPOIResultList(items: [item], resultCountLabel: "1 result", onSelect: { _ in })
        XCTAssertNil(off.card(for: item).tab)
        let on = KozmosPOIResultList(items: [item], resultCountLabel: "1 result", numbered: true, onSelect: { _ in })
        XCTAssertEqual(on.card(for: item).tab, .number("2"))
        XCTAssertTrue(on.card(for: item).numbered)
    }

    #if os(iOS)
    // MARK: How each tab is painted, light and dark

    private typealias RGBA = (r: CGFloat, g: CGFloat, b: CGFloat, a: CGFloat)

    private func resolved(_ color: Color, _ style: UIUserInterfaceStyle) -> RGBA {
        let ui = UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
        var c: RGBA = (0, 0, 0, 0)
        ui.getRed(&c.r, green: &c.g, blue: &c.b, alpha: &c.a)
        return c
    }

    private func same(_ one: Color?, _ two: Color?, _ style: UIUserInterfaceStyle) -> Bool {
        guard let one, let two else { return one == nil && two == nil }
        let (a, b) = (resolved(one, style), resolved(two, style))
        return abs(a.r - b.r) < 0.002 && abs(a.g - b.g) < 0.002 && abs(a.b - b.b) < 0.002 && abs(a.a - b.a) < 0.002
    }

    private func contrast(_ one: Color, _ two: Color, _ style: UIUserInterfaceStyle) -> Double {
        func luminance(_ c: RGBA) -> Double {
            func channel(_ v: CGFloat) -> Double {
                let v = Double(v)
                return v <= 0.04045 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4)
            }
            return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
        }
        let (a, b) = (luminance(resolved(one, style)), luminance(resolved(two, style)))
        return (max(a, b) + 0.05) / (min(a, b) + 0.05)
    }

    func testEachTabIsPaintedForWhatItSaysAndReadsAtFourAndAHalfToOne() {
        let cases: [(String, KozmosPOIResultCard, Color, Color, Color?)] = [
            ("featured", card(numbered: true, featured: true),
             KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle,
             KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle, nil),
            ("number at rest", card(numbered: true),
             KozmosColors.primitivesColorsBackground0, KozmosColors.primitivesColorsForeground400,
             KozmosColors.semanticsBorderSubtle),
            ("number selected", card(numbered: true, selected: true),
             KozmosColors.primitivesColorsTheme600, KozmosColors.primitivesColorsForeground1000, nil),
            // Quiet: not the alert pair Featured is painted in.
            ("badge", card(numbered: false, badge: "Alternative"),
             KozmosColors.primitivesColorsBackground100, KozmosColors.primitivesColorsForeground400, nil),
        ]
        var wrong: [String] = []
        for style in [UIUserInterfaceStyle.light, .dark] {
            for (name, card, fill, ink, edge) in cases {
                guard let paint = card.tabPaint else {
                    wrong.append("\(name), \(style.rawValue): no tab")
                    continue
                }
                if !same(paint.fill, fill, style) { wrong.append("\(name), \(style.rawValue): the fill") }
                if !same(paint.ink, ink, style) { wrong.append("\(name), \(style.rawValue): the words") }
                if !same(paint.edge, edge, style) { wrong.append("\(name), \(style.rawValue): the edge") }
                let ratio = contrast(paint.ink, paint.fill, style)
                print("GAP-054 iOS: \(name), \(style == .dark ? "dark" : "light"): \(String(format: "%.2f", ratio)):1")
                if ratio < 4.5 { wrong.append("\(name), \(style.rawValue): \(ratio):1, under 4.5:1") }
            }
            // The badge is never painted as Featured is.
            if let badge = card(numbered: false, badge: "Alternative").tabPaint,
               same(badge.fill, KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle, style) {
                wrong.append("badge, \(style.rawValue): drawn in Featured's colour")
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    /// GAP-054, as drawn, through the card's released API only: a badge's tab
    /// fills with the muted colour, not Featured's alert colour, light and
    /// dark. The card that painted a badge as Featured fails it.
    @MainActor func testABadgesTabIsDrawnInTheMutedFillNotFeaturedsColour() async throws {
        let size = CGSize(width: 390, height: 140)
        func distance(_ a: (UInt8, UInt8, UInt8), _ b: (UInt8, UInt8, UInt8)) -> Int {
            abs(Int(a.0) - Int(b.0)) + abs(Int(a.1) - Int(b.1)) + abs(Int(a.2) - Int(b.2))
        }
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let view = KozmosPOIResultCard(poi: poi, result: result(badge: "Alternative"), onSelect: { _ in })
                .frame(width: size.width, height: size.height, alignment: .top)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.layoutDirection, .leftToRight)
                .environment(\.colorScheme, scheme)
            let drawn = try await RenderedPixels.render(view, size: size)
            let attachment = XCTAttachment(image: drawn.image)
            attachment.name = "gap-054-badge-\(scheme)"
            attachment.lifetime = .keepAlways
            add(attachment)
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            let muted = try await RenderedPixels.render(
                KozmosColors.primitivesColorsBackground100.environment(\.colorScheme, scheme), size: size
            ).color(at: centre)
            let alert = try await RenderedPixels.render(
                KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle.environment(\.colorScheme, scheme), size: size
            ).color(at: centre)
            // Inside the tab's leading padding, level with its words: its fill.
            let fill = drawn.color(at: CGPoint(x: 16 + 3, y: 12))
            let line = "\(scheme): the badge's tab is (\(fill.0), \(fill.1), \(fill.2)); muted (\(muted.0), \(muted.1), \(muted.2)), Featured's (\(alert.0), \(alert.1), \(alert.2))"
            print("GAP-054 iOS: \(line)")
            if distance(fill, muted) > 12 || distance(fill, muted) >= distance(fill, alert) {
                wrong.append(line)
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    func testTheListsOneSelectionFillsThatResultsNumber() {
        let item = KozmosPOIResultListItem(poi: poi, result: result())
        let list = KozmosPOIResultList(
            items: [item], resultCountLabel: "1 result", selectedPoiId: "burger-king", numbered: true, onSelect: { _ in }
        )
        XCTAssertTrue(same(list.card(for: item).tabPaint?.fill, KozmosColors.primitivesColorsTheme600, .light))
        XCTAssertTrue(same(list.card(for: item).tabPaint?.edge, nil, .light))
    }
    #endif
}
