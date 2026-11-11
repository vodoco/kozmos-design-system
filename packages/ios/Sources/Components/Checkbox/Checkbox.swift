import SwiftUI

public struct KozmosCheckbox: View {
    @Binding var checked: Bool
    let label: String?
    let description: String?
    let disabled: Bool
    let error: Bool
    let checkedLabel: String
    let uncheckedLabel: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(
        checked: Binding<Bool>,
        label: String? = nil,
        description: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        checkedLabel: String = "Checked",
        uncheckedLabel: String = "Unchecked"
    ) {
        self.checkedLabel = checkedLabel
        self.uncheckedLabel = uncheckedLabel
        self._checked = checked
        self.label = label
        self.description = description
        self.disabled = disabled
        self.error = error
    }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "checkbox_toggled", component: "Checkbox", properties: ["checked": !checked]))
            checked.toggle()
        }) {
            // With a description the box sits on the label's first line, as
            // React's `items-start` puts it; without one it is centred.
            HStack(alignment: description == nil ? .center : .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ZStack {
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                        .stroke(borderColor, lineWidth: 1)
                        .background(checked ? fillColor : Color.clear)
                        .frame(width: 20, height: 20)
                        .cornerRadius(KozmosDimensions.semanticsRadiusMarker)
                    
                    if checked {
                        Image(systemName: "checkmark")
                            .font(KozmosTypography.caption)
                            .bold()
                            .foregroundColor(markColor)
                    }
                }
                
                KozmosControlText(label: label, description: description, labelColor: labelColor, disabled: disabled)
            }
            // A 44pt target, all of it hittable, with a label or without
            // one: a plain button's frame adds nothing without a content
            // shape, and the checkbox took a tap only on its box and its
            // label's words. Without a label the mark stays at the leading
            // edge of its 44pt square.
            .frame(minWidth: 44, minHeight: 44, alignment: .leading)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        .kozmosControlDescription(label: label, description: description)
        // Its state, read by VoiceOver in the caller's words: it was a plain
        // button, heard as a name and nothing of checked. SwiftUI's checkbox
        // takes a Bool, so it has no mixed state to say.
        .kozmosToggleState(checked ? checkedLabel : uncheckedLabel)
        .disabled(disabled)
    }

    // Decision 59: checked, the box is a prominent fill — the theme fill,
    // edge and all, with the theme foreground for the check, white in both
    // themes. Background/0 turned the check black on it in the dark (3.74:1).
    private var borderColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if checked { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle }
        return KozmosColors.primitivesColorsForeground500
    }

    private var fillColor: Color {
        disabled ? KozmosColors.primitivesColorsBackground200 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }

    private var markColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    }

    private var labelColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100
    }
}
