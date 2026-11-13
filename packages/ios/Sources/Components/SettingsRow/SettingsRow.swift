import SwiftUI

/// Where a setting's value comes from (GAP-040, decision 135): the system's,
/// which the site has not changed, or the site's own, which Reset to default
/// gives back to the system's.
public enum KozmosSettingsRowState: Equatable {
    case inherited, overridden
}

/// A settings row (GAP-040, decision 135), as React's SettingsRow: a name and
/// a description, one control at the end, the value's state (inherited from
/// the system, or overridden by the site, with Reset to default) and a reason
/// when it is disabled. It is a `KozmosListItem` filled in, for a
/// `KozmosList`.
///
/// The control is read by the row's name, with the description, the state
/// and the disabled reason as its hint: give it no label of its own. While
/// the row is `disabled` the control is disabled. Reset, pressed, moves
/// VoiceOver to the control, then calls `onReset`, where the product sets the
/// system's value and `state: .inherited`.
public struct KozmosSettingsRow<Control: View>: View {
    let label: String
    let description: String?
    let state: KozmosSettingsRowState?
    let inheritedLabel: String
    let overriddenLabel: String
    let resetLabel: String
    let disabled: Bool
    let disabledReason: String?
    let onReset: (() -> Void)?
    let control: Control

    @AccessibilityFocusState private var controlFocused: Bool

    public init(
        _ label: String,
        description: String? = nil,
        state: KozmosSettingsRowState? = nil,
        inheritedLabel: String = "Inherited",
        overriddenLabel: String = "Overridden",
        resetLabel: String = "Reset to default",
        disabled: Bool = false,
        disabledReason: String? = nil,
        onReset: (() -> Void)? = nil,
        @ViewBuilder control: () -> Control
    ) {
        self.label = label
        self.description = description
        self.state = state
        self.inheritedLabel = inheritedLabel
        self.overriddenLabel = overriddenLabel
        self.resetLabel = resetLabel
        self.disabled = disabled
        self.disabledReason = disabledReason
        self.onReset = onReset
        self.control = control()
    }

    /// The state's words: the tag's, and part of the control's hint.
    var stateLabel: String? {
        switch state {
        case .inherited: return inheritedLabel
        case .overridden: return overriddenLabel
        case nil: return nil
        }
    }

    /// Reset is offered while the row is overridden and usable.
    var showsReset: Bool { state == .overridden && onReset != nil && !disabled }

    /// Shown, and read with the control, only while the row is disabled.
    var shownReason: String? { disabled ? disabledReason : nil }

    /// What VoiceOver reads after the control: the description, the state and
    /// the disabled reason, as React's aria-describedby joins them.
    var controlHint: String {
        [description, stateLabel, shownReason].compactMap { $0 }.joined(separator: ", ")
    }

    public var body: some View {
        var row = KozmosListItem(label, description: description)
        if let stateLabel {
            row = row.titleAddon {
                KozmosTag(stateLabel, variant: state == .overridden ? .secondary : .outline)
            }
        }
        if shownReason != nil || showsReset {
            row = row.metaContent {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    if let shownReason {
                        Text(shownReason)
                    }
                    if showsReset {
                        KozmosMixedReset(label: resetLabel) {
                            controlFocused = true
                            onReset?()
                        }
                    }
                }
            }
        }
        return row.trailing {
            control
                .disabled(disabled)
                .accessibilityLabel(Text(label))
                .accessibilityHint(Text(controlHint))
                .accessibilityFocused($controlFocused)
        }
    }
}
