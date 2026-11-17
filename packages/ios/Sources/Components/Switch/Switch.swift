import SwiftUI

/// A switch, on or off. With several features selected whose settings
/// differ it can be `mixed` (decisions 188, 189), as React's and Compose's
/// can: drawn neither on nor off, the track filled as when on with a dash
/// in place of the thumb, and said with `mixedLabel`, "Multiple values", as
/// its value, where VoiceOver says on or off: iOS has no mixed state for a
/// switch. A tap turns it on, which is the edit the product clears `mixed`
/// on: hold `checked` false while mixed, so the tap changes it.
/// `onResetMixed` offers `resetMixedLabel` under the switch once it is no
/// longer mixed, never while it is disabled; pressed, VoiceOver moves to the
/// switch and the product sets `mixed` again.
public struct KozmosSwitch: View {
    @Binding var checked: Bool
    let label: String?
    let description: String?
    let disabled: Bool
    let showStateLabel: Bool
    let onLabel: String
    let offLabel: String
    let error: Bool
    let mixed: Bool
    let mixedLabel: String
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String
    @Environment(\.kozmosAnalytics) var trackEvent
    @AccessibilityFocusState private var switchFocused: Bool

    public init(
        checked: Binding<Bool>,
        label: String? = nil,
        description: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        showStateLabel: Bool = false,
        onLabel: String = "On",
        offLabel: String = "Off",
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel
    ) {
        self._checked = checked
        self.label = label
        self.description = description
        self.showStateLabel = showStateLabel
        self.onLabel = onLabel
        self.offLabel = offLabel
        self.disabled = disabled
        self.error = error
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }

    /// The reset is drawn under the switch only when it is offered: a stack
    /// of the switch alone draws it as it always was, and the switch keeps
    /// its identity as the reset comes and goes, so VoiceOver's focus can
    /// return to it.
    var showsReset: Bool {
        KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled)
    }

    /// What VoiceOver says as the switch's value, and the state label draws.
    var stateWords: String {
        mixed ? mixedLabel : (checked ? onLabel : offLabel)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            control
            if showsReset {
                KozmosMixedReset(label: resetMixedLabel) {
                    // The reset goes as the switch turns mixed again:
                    // VoiceOver moves to the switch, which then says its
                    // several values.
                    switchFocused = true
                    onResetMixed?()
                }
            }
        }
    }

    private var control: some View {
        Button(action: {
            // Mixed, a tap turns it on, as Checkbox's mixed state is checked.
            let nextValue = mixed ? true : !checked
            trackEvent(KozmosAnalyticsEvent(eventName: "switch_toggled", component: "Switch", properties: ["checked": nextValue]))
            checked = nextValue
        }) {
            // With a description the track sits on the label's first line;
            // without one it is centred.
            HStack(alignment: description == nil ? .center : .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ZStack {
                    Capsule()
                        .fill(trackColor)
                        .overlay(
                            Capsule().stroke(trackStrokeColor, lineWidth: 2)
                        )
                        .frame(width: 44, height: 24)

                    if mixed {
                        // No thumb: Checkbox's dash, in the thumb's colour,
                        // in the middle of the track (decision 189).
                        KozmosMixedDash(color: thumbColor)
                    } else {
                        Circle()
                            .fill(thumbColor)
                            .frame(width: 20, height: 20)
                            .offset(x: checked ? 10 : -10)
                    }
                }

                // The state in words, after the track (GAP-162): drawn for
                // the eye only and kept out of the name, as React's are
                // aria-hidden. VoiceOver reads the same words as the
                // switch's value (kozmosToggleState), once.
                if showStateLabel {
                    Text(stateWords)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
                        .frame(minHeight: 24)
                        .accessibilityHidden(true)
                }

                KozmosControlText(label: label, description: description, labelColor: labelColor, disabled: disabled)
                    .padding(.top, description == nil ? 0 : 2)
            }
            // A 44pt target, all of it hittable, with a label or without
            // one: a plain button's frame adds nothing without a content
            // shape, and the switch took a tap only on its track, 26pt tall
            // with its edge, and its label's words. Without a label it is as
            // wide as its track.
            .frame(minWidth: 44, minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        .kozmosControlDescription(label: label, description: description, nameFromLabel: showStateLabel)
        // Its state, read by VoiceOver in the caller's words (GAP-162): it
        // was a plain button, heard as a name and nothing of on or off.
        // Mixed, it is said as "Multiple values" in place of on or off.
        .kozmosToggleState(stateWords)
        .disabled(disabled)
        .kozmosResetFocus($switchFocused, offered: onResetMixed != nil)
    }

    /// Filled as when on: on, or mixed.
    private var filled: Bool { checked || mixed }

    /// Decision 59: checked, the track is a prominent fill, the theme fill.
    /// Unchecked, it is the muted colour, foreground/400, as React's
    /// `border-muted-foreground bg-muted-foreground` is (owner, 24 Oct); it was
    /// foreground/500, which a disabled switch keeps.
    private var trackColor: Color {
        if error && filled { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if filled { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400
    }

    /// Whether the track is the theme fill, which the thumb then sits on.
    private var isThemeFilled: Bool { filled && !error && !disabled }

    private var trackStrokeColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return trackColor
    }

    /// On the theme fill the thumb is a mark on it: the theme foreground,
    /// white in both themes, as React's (background/0 is black in the dark,
    /// 3.74:1 on the fill). Elsewhere it is the surface, as it was.
    private var thumbColor: Color {
        isThemeFilled ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle : KozmosColors.primitivesColorsBackground0
    }

    private var labelColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        // Full ink, foreground/0, as React's text-foreground label is: every
        // control's label is the same colour on every platform (11 Nov).
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0
    }
}
