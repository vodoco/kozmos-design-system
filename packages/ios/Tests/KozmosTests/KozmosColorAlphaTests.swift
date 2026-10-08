import XCTest
import SwiftUI
@testable import Kozmos

/// The colour tokens that carry an alpha resolve with it. Their values are CSS
/// — #RRGGBBAA or rgba() — and until 2026-09-22 the palette handed them to a
/// parser that reads eight digits alpha first and cannot read rgba(): the scrim
/// resolved to nothing, and #17191C80, ink at half, to a faint blue at 9 %.
final class KozmosColorAlphaTests: XCTestCase {
    #if canImport(UIKit)
    private func rgba(_ color: Color, _ style: UIUserInterfaceStyle = .light) -> [Int] {
        let resolved = UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        resolved.getRed(&r, green: &g, blue: &b, alpha: &a)
        return [r, g, b, a].map { Int(($0 * 255).rounded()) }
    }

    func testTheAlphaTokensResolveWithTheirAlpha() {
        let expected: [(String, Color, [Int])] = [
            ("semanticsOverlayScrim", KozmosColors.semanticsOverlayScrim, [0, 0, 0, 128]),
            ("semanticsOverlayDim", KozmosColors.semanticsOverlayDim, [0, 0, 0, 51]),
            ("primitivesColorsTransparent50", KozmosColors.primitivesColorsTransparent50, [0x17, 0x19, 0x1C, 0x80]),
            ("primitivesColorsTransparent3", KozmosColors.primitivesColorsTransparent3, [0x17, 0x19, 0x1C, 0x08]),
            ("primitivesColorsTransparentInverted25", KozmosColors.primitivesColorsTransparentInverted25, [0xFC, 0xFC, 0xFD, 0x40]),
            ("primitivesBorderBevelTop", KozmosColors.primitivesBorderBevelTop, [0xFF, 0xFF, 0xFF, 0x80]),
            ("primitivesBorderBevelBottom", KozmosColors.primitivesBorderBevelBottom, [0, 0, 0, 0x33]),
        ]
        for (name, color, want) in expected {
            for style in [UIUserInterfaceStyle.light, .dark] {
                let got = rgba(color, style)
                for (channel, pair) in zip(["r", "g", "b", "a"], zip(got, want)) {
                    XCTAssertEqual(pair.0, pair.1, accuracy: 1, "\(name) \(style == .dark ? "dark" : "light") \(channel): \(got), not \(want)")
                }
            }
        }
    }

    /// An opaque token is untouched by the conversion: the theme fill, theme
    /// 500 in both themes since decision 59, and theme 600, which turns over
    /// with the theme.
    func testAnOpaqueTokenIsUnchanged() {
        XCTAssertEqual(rgba(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle), [0x13, 0x5B, 0xEC, 255])
        XCTAssertEqual(rgba(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, .dark), [0x13, 0x5B, 0xEC, 255])
        XCTAssertEqual(rgba(KozmosColors.primitivesColorsTheme600), [0x10, 0x51, 0xE8, 255])
        XCTAssertEqual(rgba(KozmosColors.primitivesColorsTheme600, .dark), [0x58, 0x87, 0xF3, 255])
    }
    #endif
}
