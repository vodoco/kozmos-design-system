import SwiftUI

public struct KozmosSwitch: View {
    @Binding var checked: Bool
    let label: String?
    let description: String?
    let disabled: Bool
    let showStateLabel: Bool
    let onLabel: String
    let offLabel: String
    let error: Bool
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(
        checked: Binding<Bool>,
        label: String? = nil,
        description: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        showStateLabel: Bool = false,
        onLabel: String = "On",
        offLabel: String = "Off"
    ) {
        self._checked = checked
        self.label = label
        self.description = description
        self.showStateLabel = showStateLabel
        self.onLabel = onLabel
        self.offLabel = offLabel
        self.disabled = disabled
        self.error = error
    }
    
    public var body: some View {
        Button(action: {
            let nextValue = !checked
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

                    Circle()
                        .fill(thumbColor)
                        .frame(width: 20, height: 20)
                        .offset(x: checked ? 10 : -10)
                }

                // The state in words, after the track (GAP-162): drawn for
                // the eye only and kept out of the name, as React's are
                // aria-hidden. VoiceOver reads the same words as the
                // switch's value (kozmosToggleState), once.
                if showStateLabel {
                    Text(checked ? onLabel : offLabel)
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
        .kozmosToggleState(checked ? onLabel : offLabel)
        .disabled(disabled)
    }

    /// Decision 59: checked, the track is a prominent fill, the theme fill.
    /// Unchecked, it is the muted colour, foreground/400, as React's
    /// `border-muted-foreground bg-muted-foreground` is (owner, 24 Oct); it was
    /// foreground/500, which a disabled switch keeps.
    private var trackColor: Color {
        if error && checked { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if checked { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400
    }

    /// Whether the track is the theme fill, which the thumb then sits on.
    private var isThemeFilled: Bool { checked && !error && !disabled }

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
