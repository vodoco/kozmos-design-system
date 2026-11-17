import SwiftUI

/// A checkbox's three states, as React's `checked: boolean | "indeterminate"`
/// and Compose's `ToggleableState` have them. `indeterminate` is the mixed
/// state: a parent whose children disagree. It is a real answer, painted
/// exactly like `checked` with a dash for the tick, never a weaker look.
public enum KozmosCheckboxState: Hashable, Sendable {
    case unchecked
    case checked
    case indeterminate

    /// `checked` for true, `unchecked` for false.
    public init(_ checked: Bool) {
        self = checked ? .checked : .unchecked
    }

    /// The state a tap leads to: a mixed checkbox becomes checked, as
    /// Radix's does on the web; the other two swap.
    public var toggled: KozmosCheckboxState {
        self == .checked ? .unchecked : .checked
    }
}

public struct KozmosCheckbox: View {
    @Binding var state: KozmosCheckboxState
    let label: String?
    let description: String?
    let disabled: Bool
    let error: Bool
    let checkedLabel: String
    let uncheckedLabel: String
    let mixedLabel: String
    @Environment(\.kozmosAnalytics) var trackEvent

    /// A two-state checkbox, checked or not.
    public init(
        checked: Binding<Bool>,
        label: String? = nil,
        description: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        checkedLabel: String = "Checked",
        uncheckedLabel: String = "Unchecked"
    ) {
        self.init(
            state: Binding(
                get: { KozmosCheckboxState(checked.wrappedValue) },
                set: { checked.wrappedValue = $0 == .checked }
            ),
            label: label,
            description: description,
            disabled: disabled,
            error: error,
            checkedLabel: checkedLabel,
            uncheckedLabel: uncheckedLabel,
            mixedLabel: "Mixed"
        )
    }

    /// A checkbox that can also be mixed (`.indeterminate`): a parent whose
    /// children are partly checked. A tap on a mixed checkbox checks it.
    /// VoiceOver says its state as its value: `mixedLabel`, "Mixed" by
    /// default, the word VoiceOver uses for a mixed checkbox.
    public init(
        checked: Binding<KozmosCheckboxState>,
        label: String? = nil,
        description: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        checkedLabel: String = "Checked",
        uncheckedLabel: String = "Unchecked",
        mixedLabel: String = "Mixed"
    ) {
        self.init(
            state: checked,
            label: label,
            description: description,
            disabled: disabled,
            error: error,
            checkedLabel: checkedLabel,
            uncheckedLabel: uncheckedLabel,
            mixedLabel: mixedLabel
        )
    }

    private init(
        state: Binding<KozmosCheckboxState>,
        label: String?,
        description: String?,
        disabled: Bool,
        error: Bool,
        checkedLabel: String,
        uncheckedLabel: String,
        mixedLabel: String
    ) {
        self._state = state
        self.label = label
        self.description = description
        self.disabled = disabled
        self.error = error
        self.checkedLabel = checkedLabel
        self.uncheckedLabel = uncheckedLabel
        self.mixedLabel = mixedLabel
    }

    /// Checked or mixed: both are painted the same, the theme fill.
    private var filled: Bool { state != .unchecked }

    private var stateWords: String {
        switch state {
        case .checked: return checkedLabel
        case .unchecked: return uncheckedLabel
        case .indeterminate: return mixedLabel
        }
    }

    public var body: some View {
        Button(action: {
            let next = state.toggled
            // The new state as a Bool, as React reports Radix's: a mixed box
            // a tap checks is reported checked.
            trackEvent(KozmosAnalyticsEvent(eventName: "checkbox_toggled", component: "Checkbox", properties: ["checked": next == .checked]))
            state = next
        }) {
            // With a description the box sits on the label's first line, as
            // React's `items-start` puts it; without one it is centred.
            HStack(alignment: description == nil ? .center : .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ZStack {
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                        .stroke(borderColor, lineWidth: 1)
                        .background(filled ? fillColor : Color.clear)
                        .frame(width: 20, height: 20)
                        .cornerRadius(KozmosDimensions.semanticsRadiusMarker)
                    
                    // Drawn, never read: the state is the checkbox's value.
                    if state == .checked {
                        Image(systemName: "checkmark")
                            .font(KozmosTypography.caption)
                            .bold()
                            .foregroundColor(markColor)
                            .accessibilityHidden(true)
                    } else if state == .indeterminate {
                        KozmosMixedDash(color: markColor)
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
        // button, heard as a name and nothing of checked. Mixed is said as
        // its own word, as VoiceOver says a mixed checkbox's.
        .kozmosToggleState(stateWords)
        .disabled(disabled)
    }

    // Decision 59: checked or mixed, the box is a prominent fill — the theme
    // fill, edge and all, with the theme foreground for the mark, white in
    // both themes. Background/0 turned the check black on it in the dark
    // (3.74:1).
    private var borderColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if filled { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle }
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
        // Full ink, foreground/0, as React's text-foreground label is: every
        // control's label is the same colour on every platform (11 Nov).
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0
    }
}
