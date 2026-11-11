import SwiftUI

/// A prominent fill through a press and keyboard focus: the Primary Buttons
/// tokens of the fill's emotion, at rest, pressed and focused, for the fill
/// and for what sits on it (decision 59; Olcay, 2026-10-07). The theme fill
/// presses to #0D44C2 and focuses to #1051E8; the danger fill, under a
/// destructive part, to #8C132B and #D41C42 in light; each emotion to its
/// own, as React and Compose draw them. Kept apart from the views so the
/// choice can be read without drawing a press, which nothing but a finger
/// can make.
enum KozmosFillStates {
    /// The fill. A press wins over focus, as it is the newer thing the person did.
    static func background(_ emotion: KozmosButtonEmotion, isPressed: Bool, isFocused: Bool) -> Color {
        switch emotion {
        case .themed:
            if isPressed { return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
        case .neutral:
            if isPressed { return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        case .success:
            if isPressed { return KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle
        case .danger:
            if isPressed { return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle
        case .informative:
            if isPressed { return KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundIdle
        case .alert:
            if isPressed { return KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundFocus }
            return KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle
        }
    }

    /// What sits on the fill in the same state.
    static func foreground(_ emotion: KozmosButtonEmotion, isPressed: Bool, isFocused: Bool) -> Color {
        switch emotion {
        case .themed:
            if isPressed { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        case .neutral:
            if isPressed { return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        case .success:
            if isPressed { return KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentIdle
        case .danger:
            if isPressed { return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        case .informative:
            if isPressed { return KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentIdle
        case .alert:
            if isPressed { return KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentFocus }
            return KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle
        }
    }

    /// The subtle Button's fill (GAP-200, decision 135): the Subtle Buttons
    /// tokens of its emotion, theme 0 at rest, 100 focused and 200 pressed for
    /// the theme, as React and Compose draw them. There is no hover here: a
    /// pointer's hover on an iPad or a Mac is the system's hover effect.
    static func subtleBackground(_ emotion: KozmosButtonEmotion, isPressed: Bool, isFocused: Bool) -> Color {
        switch emotion {
        case .themed:
            if isPressed { return KozmosColors.componentsSubtleButtonsThemedButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsThemedButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsThemedButtonBackgroundIdle
        case .neutral:
            if isPressed { return KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsNeutralButtonBackgroundIdle
        case .success:
            if isPressed { return KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsSuccessButtonBackgroundIdle
        case .danger:
            if isPressed { return KozmosColors.componentsSubtleButtonsDangerButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsDangerButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsDangerButtonBackgroundIdle
        case .informative:
            if isPressed { return KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsInformativeButtonBackgroundIdle
        case .alert:
            if isPressed { return KozmosColors.componentsSubtleButtonsAlertButtonBackgroundPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsAlertButtonBackgroundFocus }
            return KozmosColors.componentsSubtleButtonsAlertButtonBackgroundIdle
        }
    }

    /// The subtle Button's words, which step with its fill: theme 600 on
    /// theme 0, 700 focused and 800 pressed, as 600 on 100 reads 4.41:1.
    static func subtleForeground(_ emotion: KozmosButtonEmotion, isPressed: Bool, isFocused: Bool) -> Color {
        switch emotion {
        case .themed:
            if isPressed { return KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsThemedButtonForegroundContentIdle
        case .neutral:
            if isPressed { return KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsNeutralButtonForegroundContentIdle
        case .success:
            if isPressed { return KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsSuccessButtonForegroundContentIdle
        case .danger:
            if isPressed { return KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsDangerButtonForegroundContentIdle
        case .informative:
            if isPressed { return KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsInformativeButtonForegroundContentIdle
        case .alert:
            if isPressed { return KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentPressed }
            if isFocused { return KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentFocus }
            return KozmosColors.componentsSubtleButtonsAlertButtonForegroundContentIdle
        }
    }
}

private struct KozmosButtonIsPressedKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Whether the Kozmos button whose label this is is under a press: set by
    /// `KozmosFillButtonStyle`, read by `KozmosButtonInteractionReader`.
    /// The style adds its own press to whatever is already set, so a test can
    /// draw a pressed button by setting it around one.
    var kozmosButtonIsPressed: Bool {
        get { self[KozmosButtonIsPressedKey.self] }
        set { self[KozmosButtonIsPressedKey.self] = newValue }
    }
}

/// The button style of a part that is a prominent fill. While it is drawn as
/// the fill it draws nothing itself and hands its label the press, which the
/// label draws with the fill's pressed token: SwiftUI's own press, a
/// highlight over the fill, is gone. While it is not — a filled map control
/// that is off, on the page's surface — it dims the label under a press as
/// the plain style does, so one style serves the part in both states and a
/// toggle never swaps its button under the finger or VoiceOver's cursor.
///
/// Layout, the hit area (the label's own drawing), the button's traits and a
/// disabled part's 50% stay the part's. On an iPad with a pointer, and on a
/// Mac, the label keeps the pointer's hover effect, in `hoverShape`, which
/// SwiftUI gives its own styles and not a custom one.
struct KozmosFillButtonStyle<HoverShape: Shape>: ButtonStyle {
    /// What the plain style draws a pressed label at: measured on iPhone 17
    /// Pro, iOS 26.5, black on white read #404040 and white on black #BFBFBF.
    static var plainPressedOpacity: Double { 0.75 }

    /// Whether the part is drawn as its fill now.
    var drawsFill = true
    let hoverShape: HoverShape

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .transformEnvironment(\.kozmosButtonIsPressed) { $0 = $0 || drawsFill && configuration.isPressed }
            .opacity(!drawsFill && configuration.isPressed ? Self.plainPressedOpacity : 1)
            .kozmosPointerHover(hoverShape)
    }
}

/// The plain style's press and the pointer's hover, with no disabled look of
/// its own: for a part that draws its own disabled opacity. SwiftUI's plain
/// style draws a disabled button's label at half by itself (measured on
/// iPhone 17 Pro, iOS 26.5, and on a Mac), so under it a part that also
/// dims itself — a level at 0.4, an unavailable result at 0.6, a chip at
/// half round its remove button — was dimmed twice. The disabled button
/// stays disabled: it takes no touch and VoiceOver hears it dimmed.
struct KozmosPlainPressButtonStyle<HoverShape: Shape>: ButtonStyle {
    let hoverShape: HoverShape

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? KozmosFillButtonStyle<HoverShape>.plainPressedOpacity : 1)
            .kozmosPointerHover(hoverShape)
    }
}

extension View {
    /// The pointer's hover effect in `shape`, where there is a pointer to hover.
    @ViewBuilder
    func kozmosPointerHover<S: Shape>(_ shape: S) -> some View {
        #if os(iOS)
        contentShape(.hoverEffect, shape).hoverEffect(.automatic)
        #else
        self
        #endif
    }

    /// The fill's style when `fillEmotion` is set, and the button's own
    /// style otherwise. Callers decide it from what does not change while the
    /// part is on screen — its variant and emotion — so the button is never
    /// rebuilt under someone's finger or VoiceOver's cursor.
    @ViewBuilder
    func kozmosFillButtonStyle<S: Shape>(_ fillEmotion: KozmosButtonEmotion?, hoverShape: S) -> some View {
        if fillEmotion != nil {
            buttonStyle(KozmosFillButtonStyle(hoverShape: hoverShape))
        } else {
            self
        }
    }
}

/// A filled part's label, given its button's press and keyboard focus.
/// `isFocused` is read here, inside the label, where the nearest focusable
/// ancestor is the button: on an iPad with a keyboard, or a Mac.
struct KozmosButtonInteractionReader<Content: View>: View {
    @Environment(\.kozmosButtonIsPressed) private var isPressed
    @Environment(\.isFocused) private var isFocused
    let content: (_ isPressed: Bool, _ isFocused: Bool) -> Content

    init(@ViewBuilder content: @escaping (_ isPressed: Bool, _ isFocused: Bool) -> Content) {
        self.content = content
    }

    var body: some View {
        content(isPressed, isFocused)
    }
}
