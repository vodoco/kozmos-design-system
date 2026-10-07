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

    @MainActor func testOnEmphasisIsTheThemeForegroundAndReadsOnTheThemeFill() throws {
        for scheme in [ColorScheme.light, .dark] {
            let words = try DrawnPixels.resolved(KozmosTextTone.onEmphasis.color, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, in: scheme)
            let fill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: scheme)
            XCTAssertTrue(words == ink, "\(scheme): onEmphasis is \(words), not the theme foreground \(ink)")
            XCTAssertGreaterThanOrEqual(Self.contrast(words, fill), 4.5, "\(scheme): onEmphasis on the theme fill")
        }
    }

    @MainActor func testOnDangerReadsOnTheDangerFill() throws {
        for scheme in [ColorScheme.light, .dark] {
            let words = try DrawnPixels.resolved(KozmosTextTone.onDanger.color, in: scheme)
            let fill = try DrawnPixels.resolved(KozmosColors.primitivesColorsEmotionalDanger600, in: scheme)
            XCTAssertGreaterThanOrEqual(Self.contrast(words, fill), 4.5, "\(scheme): onDanger on the danger fill")
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
