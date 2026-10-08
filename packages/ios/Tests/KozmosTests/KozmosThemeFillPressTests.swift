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
                let fill = try DrawnPixels.resolved(KozmosFillStates.background(.themed, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                let token = try DrawnPixels.resolved(state.fill, in: scheme)
                XCTAssertTrue(Self.near(fill, token, within: 0), "\(scheme), \(state.name): the fill is \(Self.hex(fill)), not its token's \(Self.hex(token))")
                XCTAssertTrue(Self.near(fill, state.want), "\(scheme), \(state.name): the fill is \(Self.hex(fill)), not \(Self.hex(state.want))")

                let ink = try DrawnPixels.resolved(KozmosFillStates.foreground(.themed, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                let inkToken = try DrawnPixels.resolved(state.ink, in: scheme)
                XCTAssertTrue(Self.near(ink, inkToken, within: 0), "\(scheme), \(state.name): the ink is \(Self.hex(ink)), not its token's \(Self.hex(inkToken))")
                XCTAssertTrue(Self.near(ink, Self.white), "\(scheme), \(state.name): the ink is \(Self.hex(ink)), not white")
            }
        }
    }

    /// Every filled emotion's tokens at rest, pressed and focused, for its
    /// fill and for what sits on it, as React and Compose draw them: each
    /// emotion its own, never the theme's.
    private static let emotionTokens: [(KozmosButtonEmotion, fill: [Color], ink: [Color])] = [
        (.themed,
         [KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentFocus]),
        (.neutral,
         [KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentFocus]),
        (.success,
         [KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentFocus]),
        (.danger,
         [KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentFocus]),
        (.informative,
         [KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentFocus]),
        (.alert,
         [KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle, KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundPressed,
          KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundFocus],
         [KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle, KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentPressed,
          KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentFocus]),
    ]

    @MainActor func testEachEmotionsFillIsItsOwnTokenAtRestPressedAndFocused() throws {
        let states: [(isPressed: Bool, isFocused: Bool, index: Int, name: String)] = [
            (false, false, 0, "at rest"), (true, false, 1, "pressed"), (false, true, 2, "focused"), (true, true, 1, "pressed while focused"),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (emotion, fills, inks) in Self.emotionTokens {
                for state in states {
                    let fill = try DrawnPixels.resolved(KozmosFillStates.background(emotion, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                    let want = try DrawnPixels.resolved(fills[state.index], in: scheme)
                    XCTAssertTrue(Self.near(fill, want, within: 0), "\(emotion), \(scheme), \(state.name): the fill is \(Self.hex(fill)), not its token's \(Self.hex(want))")
                    let ink = try DrawnPixels.resolved(KozmosFillStates.foreground(emotion, isPressed: state.isPressed, isFocused: state.isFocused), in: scheme)
                    let wantInk = try DrawnPixels.resolved(inks[state.index], in: scheme)
                    XCTAssertTrue(Self.near(ink, wantInk, within: 0), "\(emotion), \(scheme), \(state.name): the ink is \(Self.hex(ink)), not its token's \(Self.hex(wantInk))")
                }
            }
        }
    }

    /// The filled parts of every other emotion, and the emotion whose tokens
    /// fill them: a destructive variant is the danger fill and a secondary
    /// one the neutral, as on the web and in Compose; an emotion set on a
    /// filled variant wins. Each is read in a patch of its fill clear of its
    /// words and its mark: a Button's leading padding, an IconButton's top.
    private static var emotionParts: [(name: String, emotion: KozmosButtonEmotion, view: AnyView, patch: (CGRect) -> CGRect)] {
        let leading: (CGRect) -> CGRect = { CGRect(x: $0.minX + 4, y: $0.midY - 6, width: 8, height: 12) }
        let top: (CGRect) -> CGRect = { CGRect(x: $0.midX - 5, y: $0.minY + 4, width: 10, height: 6) }
        return [
            ("destructive Button", .danger, AnyView(KozmosButton("Delete", variant: .destructive, action: {})), leading),
            ("secondary Button", .neutral, AnyView(KozmosButton("Later", variant: .secondary, action: {})), leading),
            ("success Button", .success, AnyView(KozmosButton("Done", emotion: .success, action: {})), leading),
            ("danger Button", .danger, AnyView(KozmosButton("Delete", emotion: .danger, action: {})), leading),
            ("informative Button", .informative, AnyView(KozmosButton("Details", emotion: .informative, action: {})), leading),
            ("alert Button", .alert, AnyView(KozmosButton("Check", emotion: .alert, action: {})), leading),
            ("neutral Button", .neutral, AnyView(KozmosButton("Later", emotion: .neutral, action: {})), leading),
            ("destructive Button with a success emotion", .success,
             AnyView(KozmosButton("Done", variant: .destructive, emotion: .success, action: {})), leading),
            ("destructive IconButton", .danger, AnyView(KozmosIconButton(iconName: "trash", variant: .destructive, action: {})), top),
            ("secondary IconButton", .neutral, AnyView(KozmosIconButton(iconName: "plus", variant: .secondary, action: {})), top),
        ]
    }

    /// Each, drawn under a press, is its emotion's pressed token where it was
    /// its idle fill, in light and dark.
    @MainActor func testEveryFilledEmotionDrawsItsOwnPressedTokenUnderAPress() throws {
        for scheme in [ColorScheme.light, .dark] {
            for part in Self.emotionParts {
                let tokens = try XCTUnwrap(Self.emotionTokens.first { $0.0 == part.emotion })
                let idle = try DrawnPixels.resolved(tokens.fill[0], in: scheme)
                let pressed = try DrawnPixels.resolved(tokens.fill[1], in: scheme)
                let atRest = try draw(part.view, pressed: false, in: scheme)
                let underAPress = try draw(part.view, pressed: true, in: scheme)
                guard let box = atRest.boundingBox(where: DrawnPixels.matches(idle, tolerance: 3)) else {
                    XCTFail("\(part.name), \(scheme): no \(Self.hex(idle)) fill at rest")
                    continue
                }
                let patch = part.patch(box)
                let area = Int(patch.width * atRest.scale) * Int(patch.height * atRest.scale)
                XCTAssertEqual(atRest.count(in: patch, where: DrawnPixels.matches(idle, tolerance: 3)), area,
                               "\(part.name), \(scheme): the patch at rest is not all \(Self.hex(idle))")
                XCTAssertEqual(underAPress.count(in: patch, where: DrawnPixels.matches(pressed, tolerance: 3)), area,
                               "\(part.name), \(scheme): a press does not draw its pressed token \(Self.hex(pressed)); the patch reads \(Self.hex(underAPress.pixel(at: CGPoint(x: patch.midX, y: patch.midY))))")
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
    /// idle fill and no pixel is the pressed token. SplitButton's menu half
    /// is a `Menu`, which keeps SwiftUI's press and which `ImageRenderer`
    /// draws as a placeholder, so the action half is what is read there.
    @MainActor func testEveryThemeFilledPartDrawsThePressedTokenUnderAPress() throws {
        for scheme in [ColorScheme.light, .dark] {
            for part in Self.parts {
                let atRest = try draw(part.view, pressed: false, in: scheme)
                let underAPress = try draw(part.view, pressed: true, in: scheme)
                XCTAssertGreaterThan(Self.count(atRest, Self.idle), 200, "\(part.name), \(scheme): no #135BEC fill at rest")
                XCTAssertEqual(Self.count(atRest, Self.pressed), 0, "\(part.name), \(scheme): #0D44C2 drawn at rest")
                XCTAssertGreaterThan(Self.count(underAPress, Self.pressed), 200,
                                     "\(part.name), \(scheme): a press does not draw the pressed token #0D44C2")
                XCTAssertEqual(Self.count(underAPress, Self.idle), 0,
                               "\(part.name), \(scheme): #135BEC still drawn under a press")
            }
        }
    }

    /// The parts that are not fills keep what they drew: an outline Button, a
    /// ghost IconButton and a tinted map control that is on take no press of
    /// a fill, since SwiftUI's own press still shows on them.
    @MainActor func testPartsThatAreNotFillsIgnoreThePress() throws {
        let others: [(String, AnyView)] = [
            ("outline Button", AnyView(KozmosButton("Directions", variant: .outline, action: {}))),
            ("ghost IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .ghost, action: {}))),
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

    /// Loading, a part is disabled, and drawn at half as a disabled one is:
    /// React's disabled:opacity-50, and Compose since decision 59. Button,
    /// IconButton and MapControlButton drew a loading part at full strength.
    /// Each is drawn on mid grey, so half of anything shows: a loading part
    /// draws as the same part disabled and loading, and its fill (a Button's
    /// leading padding, an IconButton's top, a map control's leading edge)
    /// is not the fill at rest.
    @MainActor func testALoadingPartIsDrawnAtHalfAsADisabledOneIs() throws {
        let leading: (CGRect) -> CGPoint = { CGPoint(x: $0.minX + 6, y: $0.midY) }
        let top: (CGRect) -> CGPoint = { CGPoint(x: $0.midX, y: $0.minY + 6) }
        let parts: [(name: String, rest: AnyView, loading: AnyView, disabledLoading: AnyView, probe: (CGRect) -> CGPoint)] = [
            ("Button", AnyView(KozmosButton("Go", action: {})), AnyView(KozmosButton("Go", isLoading: true, action: {})),
             AnyView(KozmosButton("Go", isDisabled: true, isLoading: true, action: {})), leading),
            ("IconButton", AnyView(KozmosIconButton(iconName: "plus", variant: .default, action: {})),
             AnyView(KozmosIconButton(iconName: "plus", variant: .default, isLoading: true, action: {})),
             AnyView(KozmosIconButton(iconName: "plus", variant: .default, isDisabled: true, isLoading: true, action: {})), top),
            ("map control", AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location", action: {})),
             AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location", isLoading: true, action: {})),
             AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location", isDisabled: true, isLoading: true, action: {})), leading),
        ]
        func onGrey(_ view: AnyView, _ scheme: ColorScheme) throws -> DrawnPixels {
            try DrawnPixels.draw(view.padding(12).background(Color(red: 0.5, green: 0.5, blue: 0.5)).environment(\.colorScheme, scheme), scale: 3)
        }
        /// The part itself, inside the 12pt padding round it.
        func part(_ drawn: DrawnPixels) -> CGRect { CGRect(origin: .zero, size: drawn.size).insetBy(dx: 12, dy: 12) }
        for scheme in [ColorScheme.light, .dark] {
            for item in parts {
                let rest = try onGrey(item.rest, scheme)
                let loading = try onGrey(item.loading, scheme)
                let disabledLoading = try onGrey(item.disabledLoading, scheme)
                XCTAssertLessThanOrEqual(try XCTUnwrap(loading.largestDifference(from: disabledLoading)), 2,
                                         "\(item.name), \(scheme): loading is not drawn as the part disabled and loading is")
                let atRest = rest.pixel(at: item.probe(part(rest)))
                let whileLoading = loading.pixel(at: item.probe(part(loading)))
                let moved = abs(Int(atRest.r) - Int(whileLoading.r)) + abs(Int(atRest.g) - Int(whileLoading.g)) + abs(Int(atRest.b) - Int(whileLoading.b))
                XCTAssertGreaterThan(moved, 6, "\(item.name), \(scheme): loading draws its fill \(Self.hex(whileLoading)) as at rest, \(Self.hex(atRest))")
            }
        }
    }
}
