import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-167: SwiftUI's toast takes the tones React's and Compose's do,
/// Notice's with success, and neutral, the default, which draws no mark. A
/// tone is its mark at the start, in the tone's text colour, 16 from the
/// words; the surface stays the background whatever the tone.
final class KozmosToastToneTests: XCTestCase {
    @MainActor private func drawn(_ tone: KozmosToastTone?, scheme: ColorScheme = .light) throws -> DrawnPixels {
        let toast: KozmosToast = tone.map {
            KozmosToast(isPresented: .constant(true), title: "Saved", showsCloseButton: false,
                        autoDismissAfter: nil, tone: $0)
        } ?? KozmosToast(isPresented: .constant(true), title: "Saved", showsCloseButton: false, autoDismissAfter: nil)
        return try DrawnPixels.draw(toast.frame(width: 400, height: 200).environment(\.colorScheme, scheme))
    }

    private static let ink: [KozmosToastTone: Color] = [
        .success: KozmosColors.semanticsEmotionSuccessText,
        .info: KozmosColors.semanticsEmotionInformativeText,
        .warning: KozmosColors.semanticsEmotionAlertText,
        .critical: KozmosColors.semanticsEmotionDangerText,
    ]

    @MainActor func testEachToneDrawsItsMarkInItsTextColourBeforeTheWords() throws {
        for scheme in [ColorScheme.light, .dark] {
            for tone in KozmosToastTone.allCases where tone != .neutral {
                let pixels = try drawn(tone, scheme: scheme)
                let colour = try DrawnPixels.resolved(try XCTUnwrap(Self.ink[tone]), in: scheme)
                let mark = try XCTUnwrap(pixels.boundingBox(where: DrawnPixels.matches(colour, tolerance: 12)),
                                         "\(tone), \(scheme): no mark in its colour")
                XCTAssertLessThanOrEqual(mark.width, 16.5, "\(tone), \(scheme): the mark is 16 at most: \(mark)")
                XCTAssertGreaterThan(mark.width, 8, "\(tone), \(scheme): the mark: \(mark)")
                // Before the words: the title, with the mark, is 32 further in.
                let words = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: mark.maxX + 4, y: 0, width: 400, height: 200),
                                                             where: { r, g, b, a in a > 200 && (scheme == .light ? r < 90 : r > 200) && abs(Int(r) - Int(g)) < 20 }),
                                          "\(tone): no words after the mark")
                XCTAssertGreaterThan(words.minX, mark.maxX + 12, "\(tone): the words are 16 after the mark")
            }
        }
    }

    @MainActor func testNeutralTheDefaultDrawsNoMark() throws {
        let plain = try drawn(nil)
        let neutral = try drawn(.neutral)
        XCTAssertEqual(plain.largestDifference(from: neutral), 0, "neutral is the toast as it was")
        for colour in Self.ink.values {
            let resolved = try DrawnPixels.resolved(colour, in: .light)
            XCTAssertNil(plain.boundingBox(where: DrawnPixels.matches(resolved, tolerance: 12)), "a mark with no tone")
        }
    }
}
