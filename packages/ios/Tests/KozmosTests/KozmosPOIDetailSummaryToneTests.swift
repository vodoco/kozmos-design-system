import XCTest
import SwiftUI
@testable import Kozmos

/// The details card's summary strip draws a fact's value, and its icon, in
/// the fact's tone. That is text, so each tone reads at 4.5:1 on the two
/// surfaces the strip sits on — the card's own white (background/0) in the
/// panel and inline presentations, and the sheet's grey (background/100)
/// under the sheet presentation — in light and in dark. The roles are the
/// web summary's: the emotion's text role for success, warning and danger,
/// the theme's 600 for brand.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator. Colours are read against the tokens as
/// they resolve, never against a copy of their hex.
final class KozmosPOIDetailSummaryToneTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let tones: [KozmosPOIDetailTone?] = [nil, .neutral, .success, .warning, .danger, .brand]
    private static let surfaces: [(name: String, color: Color)] = [
        ("card", KozmosColors.primitivesColorsBackground0),
        ("sheet", KozmosColors.primitivesColorsBackground100),
    ]

    private static func luminance(_ p: Pixel) -> Double {
        func channel(_ v: UInt8) -> Double {
            let c = Double(v) / 255
            return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(p.r) + 0.7152 * channel(p.g) + 0.0722 * channel(p.b)
    }

    private static func contrast(_ a: Pixel, _ b: Pixel) -> Double {
        let (la, lb) = (luminance(a), luminance(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    private static func describe(_ p: Pixel) -> String { "(\(p.r), \(p.g), \(p.b))" }

    private static func name(_ tone: KozmosPOIDetailTone?) -> String { tone?.rawValue ?? "none" }

    /// Each tone takes the role the web's summary names for it.
    @MainActor func testEachToneTakesTheWebSummarysTextRole() throws {
        let roles: [(KozmosPOIDetailTone?, Color)] = [
            (nil, KozmosColors.primitivesColorsForeground100),
            (.neutral, KozmosColors.primitivesColorsForeground100),
            (.success, KozmosColors.semanticsEmotionSuccessText),
            (.warning, KozmosColors.semanticsEmotionAlertText),
            (.danger, KozmosColors.semanticsEmotionDangerText),
            (.brand, KozmosColors.primitivesColorsTheme600),
        ]
        for (tone, role) in roles {
            for scheme in [ColorScheme.light, .dark] {
                let drawn = try DrawnPixels.resolved(POIDetailSummary.color(tone), in: scheme)
                let expected = try DrawnPixels.resolved(role, in: scheme)
                XCTAssertTrue(drawn == expected,
                              "\(scheme) \(Self.name(tone)): \(Self.describe(drawn)), not the web's role \(Self.describe(expected))")
            }
        }
    }

    /// Every tone, as its colour resolves, at 4.5:1 on the card and on the
    /// sheet, in light and in dark.
    @MainActor func testEachToneReadsAt4_5To1OnTheCardAndTheSheetInLightAndDark() throws {
        var measured: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for surface in Self.surfaces {
                let ground = try DrawnPixels.resolved(surface.color, in: scheme)
                for tone in Self.tones {
                    let ink = try DrawnPixels.resolved(POIDetailSummary.color(tone), in: scheme)
                    let ratio = Self.contrast(ink, ground)
                    measured.append("\(scheme) \(surface.name) \(Self.name(tone)): \(String(format: "%.2f", ratio))")
                    XCTAssertGreaterThanOrEqual(ratio, 4.5,
                        "\(scheme) \(Self.name(tone)) on the \(surface.name) reads at \(String(format: "%.2f", ratio)):1")
                }
            }
        }
        let attachment = XCTAttachment(string: measured.joined(separator: "\n"))
        attachment.name = "poi-summary-tone-contrast"
        attachment.lifetime = .keepAlways
        add(attachment)
        print("poi-summary tone contrast:\n" + measured.joined(separator: "\n"))
        XCTAssertEqual(measured.count, 24)
    }

    /// What the strip draws: a toned value's words, in its tone's colour, at
    /// 4.5:1 on the card and on the sheet, in light and in dark.
    @MainActor func testAToneDrawsItsValueAt4_5To1OnTheCardAndTheSheet() throws {
        for scheme in [ColorScheme.light, .dark] {
            for surface in Self.surfaces {
                let ground = try DrawnPixels.resolved(surface.color, in: scheme)
                for tone in Self.tones {
                    let label = "\(scheme) \(Self.name(tone)) on the \(surface.name)"
                    let drawn = try DrawnPixels.draw(
                        POIDetailSummary(items: [.init(id: "fact", label: "Fact", value: "HHHH", tone: tone)])
                            .frame(width: 160)
                            .background(surface.color)
                            .environment(\.colorScheme, scheme)
                            .environment(\.layoutDirection, .leftToRight),
                        scale: 4)
                    // The words' core: the pixel furthest in contrast from
                    // the surface, inside the strip's top and bottom rules.
                    var core: Pixel?
                    var best = 1.0
                    var y: CGFloat = 4
                    while y < drawn.size.height - 4 {
                        var x: CGFloat = 0
                        while x < drawn.size.width {
                            let p = drawn.pixel(at: CGPoint(x: x, y: y))
                            let ratio = Self.contrast(p, ground)
                            if p.a > 240, ratio > best { core = p; best = ratio }
                            x += 1 / drawn.scale
                        }
                        y += 1 / drawn.scale
                    }
                    let words = try XCTUnwrap(core, "\(label): no words were drawn")
                    let ink = try DrawnPixels.resolved(POIDetailSummary.color(tone), in: scheme)
                    XCTAssertTrue(DrawnPixels.matches(ink, tolerance: 28)(words.r, words.g, words.b, words.a),
                                  "\(label): the words drew \(Self.describe(words)), not \(Self.describe(ink))")
                    XCTAssertGreaterThanOrEqual(best, 4.5, "\(label): the words read at \(String(format: "%.2f", best)):1")
                }
            }
        }
    }
}
