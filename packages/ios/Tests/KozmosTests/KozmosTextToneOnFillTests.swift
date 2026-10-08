import XCTest
import SwiftUI
@testable import Kozmos

/// The tones for text on a fill (Olcay, 2026-10-07): `onEmphasis` sits on the
/// theme fill and `onDanger` on the danger fill, and each reads at 4.5:1 or
/// more on its own fill in both appearances. `onEmphasis` was background/0,
/// black in the dark, which reads 3.74:1 on the theme fill (decision 59); no
/// one colour reads on both fills in the dark, so the tone is split.
final class KozmosTextToneOnFillTests: XCTestCase {
    private typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    /// White in both appearances, written out: a comparison with the token
    /// alone passed while the token itself was black in the dark.
    @MainActor func testOnEmphasisIsTheThemeForegroundAndReadsOnTheThemeFill() throws {
        for scheme in [ColorScheme.light, .dark] {
            let words = try DrawnPixels.resolved(KozmosTextTone.onEmphasis.color, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, in: scheme)
            let fill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: scheme)
            XCTAssertTrue(words == ink, "\(scheme): onEmphasis is \(words), not the theme foreground \(ink)")
            XCTAssertTrue(words == (0xFF, 0xFF, 0xFF, 0xFF), "\(scheme): onEmphasis is \(Self.hex(words)), not #FFFFFF")
            XCTAssertGreaterThanOrEqual(Self.contrast(words, fill), 4.5, "\(scheme): onEmphasis on the theme fill")
        }
    }

    /// The danger fills the parts draw: the Primary Buttons danger fill under
    /// a destructive Button, IconButton, Badge and Counter — #B01736 in light,
    /// #EE7E95 in the dark — and danger 600 under a checked Switch in error,
    /// #D41C42 and #E95A77. `onDanger` reads at 4.5:1 or more on each.
    @MainActor func testOnDangerReadsOnTheDangerFillsThePartsDraw() throws {
        let fills: [(String, Color)] = [
            ("the Primary Buttons danger fill", KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle),
            ("danger 600", KozmosColors.primitivesColorsEmotionalDanger600),
        ]
        for scheme in [ColorScheme.light, .dark] {
            let words = try DrawnPixels.resolved(KozmosTextTone.onDanger.color, in: scheme)
            for (name, colour) in fills {
                let fill = try DrawnPixels.resolved(colour, in: scheme)
                XCTAssertGreaterThanOrEqual(Self.contrast(words, fill), 4.5,
                                            "\(scheme): onDanger \(Self.hex(words)) on \(name) \(Self.hex(fill))")
            }
        }
    }

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
}
