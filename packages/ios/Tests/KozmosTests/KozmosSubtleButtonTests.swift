import SwiftUI
import XCTest
@testable import Kozmos

/// The subtle Button (GAP-200, decision 135): a pale fill of its own token
/// tier, theme 0 under the theme's words, theme 600, as React and Compose draw
/// it. Its words step with its fill, theme 100 under 700 focused and theme 200
/// under 800 pressed, because theme 600 on theme 100 reads 4.41:1. With
/// `emotion: .danger` it is the destructive tone of Pointr Cloud's Delete
/// Feature (decision 139): danger 0 under the danger text.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosSubtleButtonTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    private static func near(_ a: Pixel, _ b: Pixel, within tolerance: Int = 2) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance
            && abs(Int(a.b) - Int(b.b)) <= tolerance && a.a == b.a
    }

    /// The default theme's values, written out: the ruling is about what is
    /// drawn. Each state's fill and words, in light and in dark, where the
    /// ramp turns over.
    private static let themed: [(isPressed: Bool, isFocused: Bool, name: String,
                                 light: (fill: Pixel, ink: Pixel), dark: (fill: Pixel, ink: Pixel))] = [
        (false, false, "at rest",
         ((0xF1, 0xF5, 0xFE, 255), (0x10, 0x51, 0xE8, 255)), ((0x05, 0x1C, 0x4F, 255), (0x58, 0x87, 0xF3, 255))),
        (false, true, "focused",
         ((0xCA, 0xD9, 0xFC, 255), (0x0D, 0x44, 0xC2, 255)), ((0x08, 0x29, 0x75, 255), (0x7E, 0xA2, 0xF6, 255))),
        (true, false, "pressed",
         ((0xA4, 0xBE, 0xF9, 255), (0x0B, 0x36, 0x9C, 255)), ((0x0B, 0x36, 0x9C, 255), (0xA4, 0xBE, 0xF9, 255))),
        (true, true, "pressed while focused",
         ((0xA4, 0xBE, 0xF9, 255), (0x0B, 0x36, 0x9C, 255)), ((0x0B, 0x36, 0x9C, 255), (0xA4, 0xBE, 0xF9, 255))),
    ]

    @MainActor func testTheThemedSubtleFillAndWordsAreThemeStepsInEveryState() throws {
        for scheme in [ColorScheme.light, .dark] {
            for state in Self.themed {
                let want = scheme == .light ? state.light : state.dark
                let fill = try DrawnPixels.resolved(
                    KozmosFillStates.subtleBackground(.themed, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                let ink = try DrawnPixels.resolved(
                    KozmosFillStates.subtleForeground(.themed, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                XCTAssertTrue(Self.near(fill, want.fill), "\(scheme), \(state.name): the fill is \(Self.hex(fill)), not \(Self.hex(want.fill))")
                XCTAssertTrue(Self.near(ink, want.ink), "\(scheme), \(state.name): the words are \(Self.hex(ink)), not \(Self.hex(want.ink))")
            }
        }
    }

    /// Every emotion's subtle fill and words are its own Subtle Buttons tokens,
    /// at rest, pressed and focused, never the Primary tier's.
    private static let tokens: [(KozmosButtonEmotion, fill: [Color], ink: [Color])] = [
        (.themed,
         [KozmosColors.componentsSubtleButtonsThemedButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsThemedButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsThemedButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentFocus]),
        (.neutral,
         [KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentFocus]),
        (.success,
         [KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentFocus]),
        (.danger,
         [KozmosColors.componentsSubtleButtonsDangerButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsDangerButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsDangerButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentFocus]),
        (.informative,
         [KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentFocus]),
        (.alert,
         [KozmosColors.componentsSubtleButtonsAlertButtonBackgroundIdle, KozmosColors.componentsSubtleButtonsAlertButtonBackgroundPressed,
          KozmosColors.componentsSubtleButtonsAlertButtonBackgroundFocus],
         [KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentIdle, KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentPressed,
          KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentFocus]),
    ]

    @MainActor func testEachEmotionsSubtleFillIsItsOwnSubtleToken() throws {
        let states: [(isPressed: Bool, isFocused: Bool, index: Int, name: String)] = [
            (false, false, 0, "at rest"), (true, false, 1, "pressed"), (false, true, 2, "focused"), (true, true, 1, "pressed while focused"),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (emotion, fills, inks) in Self.tokens {
                for state in states {
                    let fill = try DrawnPixels.resolved(
                        KozmosFillStates.subtleBackground(emotion, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                    let want = try DrawnPixels.resolved(fills[state.index], in: scheme)
                    XCTAssertTrue(Self.near(fill, want, within: 0), "\(emotion), \(scheme), \(state.name): the fill is \(Self.hex(fill)), not its token's \(Self.hex(want))")
                    let ink = try DrawnPixels.resolved(
                        KozmosFillStates.subtleForeground(emotion, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                    let wantInk = try DrawnPixels.resolved(inks[state.index], in: scheme)
                    XCTAssertTrue(Self.near(ink, wantInk, within: 0), "\(emotion), \(scheme), \(state.name): the words are \(Self.hex(ink)), not its token's \(Self.hex(wantInk))")
                }
            }
        }
    }

    @MainActor private func draw(_ part: some View, pressed: Bool, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            part
                .environment(\.kozmosButtonIsPressed, pressed)
                .padding(12)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The Button itself: at rest the pale fill, under a press its pressed
    /// token, read in a patch of its leading padding clear of its words; the
    /// themed one, and the destructive tone's rose.
    @MainActor func testTheSubtleButtonDrawsItsFillAtRestAndItsPressedTokenUnderAPress() throws {
        let parts: [(name: String, emotion: KozmosButtonEmotion, view: AnyView)] = [
            ("subtle Button", .themed, AnyView(KozmosButton("Add additional field", variant: .subtle, action: {}))),
            ("subtle Button, danger", .danger, AnyView(KozmosButton("Delete feature", variant: .subtle, emotion: .danger, action: {}))),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for part in parts {
                let idle = try DrawnPixels.resolved(KozmosFillStates.subtleBackground(part.emotion, isPressed: false, isFocused: false), in: scheme)
                let pressed = try DrawnPixels.resolved(KozmosFillStates.subtleBackground(part.emotion, isPressed: true, isFocused: false), in: scheme)
                let atRest = try draw(part.view, pressed: false, in: scheme)
                let underAPress = try draw(part.view, pressed: true, in: scheme)
                guard let box = atRest.boundingBox(where: DrawnPixels.matches(idle, tolerance: 3)) else {
                    XCTFail("\(part.name), \(scheme): no \(Self.hex(idle)) fill at rest")
                    continue
                }
                XCTAssertGreaterThanOrEqual(box.height, 43.5, "\(part.name), \(scheme): the fill is \(box.height) tall, not the 44 a button is")
                let patch = CGRect(x: box.minX + 4, y: box.midY - 6, width: 8, height: 12)
                let area = Int(patch.width * atRest.scale) * Int(patch.height * atRest.scale)
                XCTAssertEqual(atRest.count(in: patch, where: DrawnPixels.matches(idle, tolerance: 3)), area,
                               "\(part.name), \(scheme): the patch at rest is not all \(Self.hex(idle))")
                XCTAssertEqual(underAPress.count(in: patch, where: DrawnPixels.matches(pressed, tolerance: 3)), area,
                               "\(part.name), \(scheme): a press does not draw its pressed token \(Self.hex(pressed))")
            }
        }
        // The destructive tone is the rose, danger 0, not the danger fill.
        let rose = try DrawnPixels.resolved(KozmosFillStates.subtleBackground(.danger, isPressed: false, isFocused: false), in: .light)
        XCTAssertTrue(Self.near(rose, (0xFC, 0xEA, 0xEE, 255)), "the destructive subtle fill is \(Self.hex(rose)), not danger 0, #FCEAEE")
        let red = try DrawnPixels.resolved(KozmosFillStates.subtleForeground(.danger, isPressed: false, isFocused: false), in: .light)
        XCTAssertTrue(Self.near(red, (0xB0, 0x17, 0x36, 255)), "the destructive subtle words are \(Self.hex(red)), not danger 700, #B01736")
    }
}
