import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 59, pressed (Olcay, 2026-10-07): a part filled with the theme
/// fill draws the themed button's pressed token, #0D44C2, while a finger is
/// down on it, and its focus token, #1051E8, while a keyboard has focus on it;
/// the theme foreground, white, stays on the fill. Until then none of these
/// parts set a button style of its own: a press drew SwiftUI's highlight over
/// the idle fill, and the pressed token was never drawn.
///
/// Nothing can press a button without a finger, so the parts are drawn with
/// the press their style hands their label (`kozmosButtonIsPressed`), set
/// around them. Focus cannot be set from outside — `isFocused` is the
/// system's — so it is read through the colour choice alone.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosThemeFillPressTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// The default theme's values, written out: the ruling is about what is drawn.
    private static let idle: Pixel = (0x13, 0x5B, 0xEC, 255)
    private static let pressed: Pixel = (0x0D, 0x44, 0xC2, 255)
    private static let focused: Pixel = (0x10, 0x51, 0xE8, 255)
    private static let white: Pixel = (0xFF, 0xFF, 0xFF, 255)

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    private static func near(_ a: Pixel, _ b: Pixel, within tolerance: Int = 2) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance
            && abs(Int(a.b) - Int(b.b)) <= tolerance && a.a == b.a
    }

    /// The fill and its ink at rest, pressed, focused, and pressed while
    /// focused — the press wins — each from its own token and each the
    /// default theme's value, in light and dark.
    @MainActor func testTheFillIsThePressedTokenUnderAPressAndTheFocusTokenUnderFocus() throws {
        let cases: [(isPressed: Bool, isFocused: Bool, fill: Color, ink: Color, want: Pixel, name: String)] = [
            (false, false, KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle,
             KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, Self.idle, "at rest"),
            (true, false, KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed,
             KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed, Self.pressed, "pressed"),
            (false, true, KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundFocus,
             KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentFocus, Self.focused, "focused"),
            (true, true, KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed,
             KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed, Self.pressed, "pressed while focused"),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for state in cases {
                let fill = try DrawnPixels.resolved(KozmosThemeFill.background(isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                let token = try DrawnPixels.resolved(state.fill, in: scheme)
                XCTAssertTrue(Self.near(fill, token, within: 0), "\(scheme), \(state.name): the fill is \(Self.hex(fill)), not its token's \(Self.hex(token))")
                XCTAssertTrue(Self.near(fill, state.want), "\(scheme), \(state.name): the fill is \(Self.hex(fill)), not \(Self.hex(state.want))")

                let ink = try DrawnPixels.resolved(KozmosThemeFill.foreground(isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                let inkToken = try DrawnPixels.resolved(state.ink, in: scheme)
                XCTAssertTrue(Self.near(ink, inkToken, within: 0), "\(scheme), \(state.name): the ink is \(Self.hex(ink)), not its token's \(Self.hex(inkToken))")
                XCTAssertTrue(Self.near(ink, Self.white), "\(scheme), \(state.name): the ink is \(Self.hex(ink)), not white")
            }
        }
    }

    /// The parts whose fill is the theme fill: the filled Button (the default
    /// variant, and the themed emotion), IconButton's default, the
    /// FloatingActionButton, SplitButton's action and a filled map control
    /// that is on.
    private static var parts: [(name: String, view: AnyView)] {
        [
            ("Button", AnyView(KozmosButton("Continue", action: {}))),
            ("themed Button", AnyView(KozmosButton("Continue", emotion: .themed, action: {}))),
            ("IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .default, action: {}))),
            ("FloatingActionButton", AnyView(KozmosFloatingActionButton(action: {}))),
            ("SplitButton", AnyView(KozmosSplitButton(label: "Directions", mainAction: {}))),
            ("filled map control", AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location",
                                                                  emphasis: .filled, pressed: true, action: {}))),
        ]
    }

    @MainActor private func draw(_ part: AnyView, pressed: Bool, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            part
                .environment(\.kozmosButtonIsPressed, pressed)
                .padding(12)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    private static func count(_ drawn: DrawnPixels, _ colour: Pixel) -> Int {
        drawn.count(in: CGRect(origin: .zero, size: drawn.size), where: DrawnPixels.matches(colour, tolerance: 3))
    }

    /// Each part, drawn as its style draws it under a press, is the pressed
    /// token where it was the idle fill, in light and dark; at rest it is the
    /// idle fill and no pixel is the pressed token. SplitButton's menu half is
    /// a `Menu`, whose press SwiftUI keeps, so only its action is read there.
    @MainActor func testEveryThemeFilledPartDrawsThePressedTokenUnderAPress() throws {
        for scheme in [ColorScheme.light, .dark] {
            for part in Self.parts {
                let atRest = try draw(part.view, pressed: false, in: scheme)
                let underAPress = try draw(part.view, pressed: true, in: scheme)
                let restIdle = Self.count(atRest, Self.idle)
                XCTAssertGreaterThan(restIdle, 200, "\(part.name), \(scheme): no #135BEC fill at rest")
                XCTAssertEqual(Self.count(atRest, Self.pressed), 0, "\(part.name), \(scheme): #0D44C2 drawn at rest")
                XCTAssertGreaterThan(Self.count(underAPress, Self.pressed), 200,
                                     "\(part.name), \(scheme): a press does not draw the pressed token #0D44C2")
                if part.name == "SplitButton" {
                    XCTAssertLessThan(Self.count(underAPress, Self.idle), restIdle / 2,
                                      "\(part.name), \(scheme): the action still draws #135BEC under a press")
                } else {
                    XCTAssertEqual(Self.count(underAPress, Self.idle), 0,
                                   "\(part.name), \(scheme): #135BEC still drawn under a press")
                }
            }
        }
    }

    /// The other parts keep what they drew: a destructive Button and a
    /// tinted map control that is on take no theme press, since their fill is
    /// not the theme fill and SwiftUI's own press still shows on them.
    @MainActor func testPartsNotFilledWithTheThemeIgnoreThePress() throws {
        let others: [(String, AnyView)] = [
            ("destructive Button", AnyView(KozmosButton("Delete", variant: .destructive, action: {}))),
            ("outline Button", AnyView(KozmosButton("Directions", variant: .outline, action: {}))),
            ("tinted map control", AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location", pressed: true, action: {}))),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (name, view) in others {
                // Compared whole, not by colour: in light the outline's words
                // are #0D44C2 too, the Secondary Buttons token.
                let atRest = try draw(view, pressed: false, in: scheme)
                let underAPress = try draw(view, pressed: true, in: scheme)
                XCTAssertEqual(atRest.size, underAPress.size, "\(name), \(scheme)")
                XCTAssertLessThanOrEqual(try XCTUnwrap(atRest.largestDifference(from: underAPress)), 2,
                                         "\(name), \(scheme): the drawing changed under the theme's press")
            }
        }
    }
}
