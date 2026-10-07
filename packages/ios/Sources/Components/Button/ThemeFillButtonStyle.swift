import SwiftUI

/// The theme fill through a press and keyboard focus (decision 59; Olcay,
/// 2026-10-07): the themed button's tokens, which a prominent fill draws at
/// rest, pressed and focused. Kept apart from the views so the choice can be
/// read without drawing a press, which nothing but a finger can make.
enum KozmosThemeFill {
    /// The fill: pressed under a finger (#0D44C2), focused under a keyboard
    /// (#1051E8), the theme fill otherwise (#135BEC). A press wins over focus,
    /// as it is the newer thing the person did.
    static func background(isPressed: Bool, isFocused: Bool) -> Color {
        if isPressed { return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed }
        if isFocused { return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundFocus }
        return KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }

    /// What sits on the fill in the same state: the theme foreground, white.
    static func foreground(isPressed: Bool, isFocused: Bool) -> Color {
        if isPressed { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed }
        if isFocused { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentFocus }
        return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    }
}

private struct KozmosButtonIsPressedKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// Whether the Kozmos button whose label this is is under a press: set by
    /// `KozmosThemeFillButtonStyle`, read by `KozmosButtonInteractionReader`.
    /// The style adds its own press to whatever is already set, so a test can
    /// draw a pressed button by setting it around one.
    var kozmosButtonIsPressed: Bool {
        get { self[KozmosButtonIsPressedKey.self] }
        set { self[KozmosButtonIsPressedKey.self] = newValue }
    }
}

/// The button style of a part filled with the theme fill: it draws nothing
/// itself, and hands its label the press, which the label draws with the
/// pressed token. SwiftUI's own press — a highlight over the fill — is gone,
/// and the layout, the hit area (the label's own drawing), the button's
/// traits and a disabled part's 50% are the part's, as they were.
struct KozmosThemeFillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .transformEnvironment(\.kozmosButtonIsPressed) { $0 = $0 || configuration.isPressed }
    }
}

/// A theme-filled part's label, given its button's press and keyboard focus.
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

extension View {
    /// The theme fill's style when `fillsWithTheme`, and the button's style
    /// unchanged otherwise. Callers decide it from what does not change while
    /// the part is on screen — its variant, its emphasis — so the button is
    /// never rebuilt under someone's finger or VoiceOver's cursor.
    @ViewBuilder
    func kozmosThemeFillButtonStyle(_ fillsWithTheme: Bool) -> some View {
        if fillsWithTheme {
            buttonStyle(KozmosThemeFillButtonStyle())
        } else {
            self
        }
    }

    /// The theme fill's style when `fillsWithTheme`, and `style` otherwise.
    @ViewBuilder
    func kozmosThemeFillButtonStyle<S: PrimitiveButtonStyle>(_ fillsWithTheme: Bool, otherwise style: S) -> some View {
        if fillsWithTheme {
            buttonStyle(KozmosThemeFillButtonStyle())
        } else {
            buttonStyle(style)
        }
    }
}
