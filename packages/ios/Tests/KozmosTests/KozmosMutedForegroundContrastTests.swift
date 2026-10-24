import XCTest
import SwiftUI
@testable import Kozmos

/// The muted colour is the contract's: packages/tokens/src/contrast-contract.json
/// pairs muted foreground with foreground/400 at 4.5:1, on background/0 and on
/// background/100, and React draws it so (`text-muted-foreground`,
/// `.kozmos-muted-text`). Every muted default here was foreground/500 until
/// 2026-10-24: #747B8B, 4.24:1 on white, under AA. Foreground/400, #5D626F,
/// reads 6.10:1. In the dark both pass on black: 500 #8B8474 5.65:1, 400
/// #A29D90 7.76:1.
///
/// Each default is resolved in each theme and its WCAG ratio computed with each
/// of the contract's muted backgrounds, read from the contract itself.
final class KozmosMutedForegroundContrastTests: XCTestCase {
    #if canImport(UIKit)
    private struct RGB: CustomStringConvertible {
        let r: Double, g: Double, b: Double
        var description: String {
            String(format: "#%02X%02X%02X", Int((r * 255).rounded()), Int((g * 255).rounded()), Int((b * 255).rounded()))
        }
    }

    private func rgb(_ color: Color, _ style: UIUserInterfaceStyle) -> RGB {
        let resolved = UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        resolved.getRed(&r, green: &g, blue: &b, alpha: &a)
        return RGB(r: Double(r), g: Double(g), b: Double(b))
    }

    private static func luminance(_ c: RGB) -> Double {
        func channel(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    }

    private static func contrast(_ a: RGB, _ b: RGB) -> Double {
        let (la, lb) = (luminance(a), luminance(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /// The contract's tokens this test can resolve, by their CSS names.
    private let tokens: [String: Color] = [
        "primitives-colors-background-0": KozmosColors.primitivesColorsBackground0,
        "primitives-colors-background-100": KozmosColors.primitivesColorsBackground100,
        "primitives-colors-foreground-400": KozmosColors.primitivesColorsForeground400,
    ]

    private struct Pair { let name: String, background: String, foreground: String, minimum: Double }

    /// The contract's muted pairs: every pair whose name starts "muted foreground".
    private func mutedPairs() throws -> [Pair] {
        let source = try KozmosIconNamesTests.repositoryFile("packages/tokens/src/contrast-contract.json")
        let json = try XCTUnwrap(try JSONSerialization.jsonObject(with: Data(source.utf8)) as? [String: Any])
        let pairs = try XCTUnwrap(json["pairs"] as? [[String: Any]], "the contract has no pairs")
        let muted = pairs.compactMap { pair -> Pair? in
            guard let name = pair["name"] as? String, name.hasPrefix("muted foreground"),
                  let background = pair["background"] as? String,
                  let foreground = pair["foreground"] as? String,
                  let minimum = (pair["minimum"] as? NSNumber)?.doubleValue else { return nil }
            return Pair(name: name, background: background, foreground: foreground, minimum: minimum)
        }
        XCTAssertTrue(muted.contains { $0.background == "primitives-colors-background-0" },
                      "the contract has no muted pair on background/0: \(muted.map(\.name))")
        return muted
    }

    /// Every muted default: the surface-aware muted colour off glass, the
    /// modifier's default, and the muted tones of Text and Icon.
    private var mutedDefaults: [(String, Color)] {
        get throws {
            let modified = try XCTUnwrap(Text("x").kozmosMutedText() as? ModifiedContent<Text, KozmosMutedText>,
                                         "kozmosMutedText() is no longer KozmosMutedText")
            return [
                ("kozmosMutedForeground(on: nil)", kozmosMutedForeground(on: nil)),
                ("kozmosMutedForeground(on: .solid)", kozmosMutedForeground(on: .solid)),
                ("kozmosMutedText()", modified.modifier.muted),
                ("KozmosTextTone.muted", KozmosTextTone.muted.color),
                ("KozmosIconColor.muted", KozmosIconColor.muted.swiftUIColor),
            ]
        }
    }

    /// Each default is the contract's muted token, in both themes.
    func testEveryMutedDefaultIsTheContractsMutedForeground() throws {
        let foregrounds = Set(try mutedPairs().map(\.foreground))
        XCTAssertEqual(foregrounds.count, 1, "the contract's muted pairs name more than one foreground: \(foregrounds)")
        var wrong: [String] = []
        for foreground in foregrounds.sorted() {
            let token = try XCTUnwrap(tokens[foreground], "no colour for the contract's \(foreground)")
            for style in [UIUserInterfaceStyle.light, .dark] {
                let want = rgb(token, style)
                for (name, color) in try mutedDefaults {
                    let got = rgb(color, style)
                    print("Muted iOS, \(name), \(style == .dark ? "dark" : "light"): \(got), the contract's \(foreground) \(want)")
                    if abs(got.r - want.r) > 0.5 / 255 || abs(got.g - want.g) > 0.5 / 255 || abs(got.b - want.b) > 0.5 / 255 {
                        wrong.append("\(name), \(style == .dark ? "dark" : "light"): \(got), not \(foreground) \(want)")
                    }
                }
            }
        }
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    /// Each default reaches the contract's minimum on each muted background,
    /// light and dark, computed from the colours it resolves to.
    func testEveryMutedDefaultReadsAtTheContractsMinimum() throws {
        var low: [String] = []
        for pair in try mutedPairs() {
            let background = try XCTUnwrap(tokens[pair.background], "no colour for the contract's \(pair.background)")
            for style in [UIUserInterfaceStyle.light, .dark] {
                let surface = rgb(background, style)
                for (name, color) in try mutedDefaults {
                    let text = rgb(color, style)
                    let ratio = Self.contrast(text, surface)
                    let line = "\(name) on \(pair.background), \(style == .dark ? "dark" : "light"): \(text) on \(surface), \(String(format: "%.2f", ratio)):1"
                    print("Muted iOS, \(line)")
                    if ratio < pair.minimum { low.append("\(line), under \(pair.minimum) (\(pair.name))") }
                }
            }
        }
        XCTAssertTrue(low.isEmpty, low.joined(separator: "; "))
    }
    #endif
}
