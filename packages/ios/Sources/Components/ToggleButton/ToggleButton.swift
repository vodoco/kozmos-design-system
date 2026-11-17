import SwiftUI

/// A button that holds a pressed state. With several features selected that
/// differ it can be `mixed` (decisions 188, 190), as React's
/// `aria-pressed="mixed"` toggle: a dashed theme edge on the muted fill and a
/// dash before its label, said with `mixedLabel`, "Multiple values", as its
/// value and never as selected (iOS has no mixed state for a button). A tap
/// turns it on, the edit the product clears `mixed` on: hold `isOn` false
/// while mixed, so the tap changes it. `onResetMixed` offers
/// `resetMixedLabel` under the toggle once it is no longer mixed; pressed,
/// VoiceOver moves to the toggle and the product sets `mixed` again.
public struct KozmosToggleButton: View {
    @Binding var isOn: Bool
    let label: String
    let iconName: String?
    let variant: Variant
    let size: Size
    let mixed: Bool
    let mixedLabel: String
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String
    @Environment(\.kozmosAnalytics) var trackEvent
    @AccessibilityFocusState private var toggleFocused: Bool
    
    public enum Variant {
        case `default`, outline
    }
    
    public enum Size {
        case sm, `default`, lg
    }

    public init(
        isOn: Binding<Bool>,
        label: String,
        iconName: String? = nil,
        variant: Variant = .default,
        size: Size = .default,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel
    ) {
        self._isOn = isOn
        self.label = label
        self.iconName = iconName
        self.variant = variant
        self.size = size
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }

    /// The reset is drawn under the toggle only when it is offered: a stack
    /// of the toggle alone draws it as it always was, and the toggle keeps
    /// its identity as the reset comes and goes.
    var showsReset: Bool {
        KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: false)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            control
            if showsReset {
                KozmosMixedReset(label: resetMixedLabel) {
                    toggleFocused = true
                    onResetMixed?()
                }
            }
        }
    }

    @ViewBuilder
    private var control: some View {
        if mixed {
            mixedControl
        } else {
            plainControl
        }
    }

    private var plainControl: some View {
        Button(action: {
            isOn.toggle()
            trackEvent(KozmosAnalyticsEvent(eventName: "toggle_pressed", component: "ToggleButton", properties: ["pressed": isOn]))
        }) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                if let iconName = iconName {
                    Image(systemName: iconName)
                }
                Text(label)
            }
            .font(size == .sm ? .caption : (size == .lg ? .headline : .subheadline))
            .padding(.horizontal, size == .sm ? KozmosDimensions.primitivesLayoutSpacing150 : (size == .lg ? KozmosDimensions.primitivesLayoutSpacing400 : KozmosDimensions.primitivesLayoutSpacing200))
            .padding(.vertical, size == .sm ? KozmosDimensions.primitivesLayoutSpacing100 : (size == .lg ? KozmosDimensions.primitivesLayoutSpacing200 : KozmosDimensions.primitivesLayoutSpacing150))
            // Decision 59: on, the default variant is a prominent fill — the
            // theme fill, with the theme foreground on it, white in both
            // themes (background/0 turned black on it in the dark).
            .background(
                Group {
                    if isOn {
                        variant == .outline ? KozmosColors.primitivesColorsBackground200 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
                    } else {
                        variant == .outline ? Color.clear : KozmosColors.primitivesColorsBackground100
                    }
                }
            )
            .foregroundColor(
                isOn ? (variant == .outline ? KozmosColors.primitivesColorsForeground100 : KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle) : KozmosColors.primitivesColorsForeground100
            )
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(variant == .outline ? KozmosColors.primitivesColorsBackground400 : Color.clear, lineWidth: variant == .outline ? 1 : 0)
            )
            .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        }
        // On, the toggle is selected, as React's `aria-pressed` and the chip's
        // own state: VoiceOver heard only the name, and the state only the
        // fill showed.
        .accessibilityAddTraits(isOn ? .isSelected : [])
        .kozmosResetFocus($toggleFocused, offered: onResetMixed != nil)
    }

    /// Mixed (decision 190): the muted fill under the page's ink, a dashed
    /// edge in the theme fill, and Checkbox's dash before the label. A tap
    /// turns it on.
    private var mixedControl: some View {
        Button(action: {
            isOn = true
            trackEvent(KozmosAnalyticsEvent(eventName: "toggle_pressed", component: "ToggleButton", properties: ["pressed": true]))
        }) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                KozmosMixedDash(color: KozmosColors.primitivesColorsForeground0)
                if let iconName = iconName {
                    Image(systemName: iconName)
                }
                Text(label)
            }
            .font(size == .sm ? .caption : (size == .lg ? .headline : .subheadline))
            .padding(.horizontal, size == .sm ? KozmosDimensions.primitivesLayoutSpacing150 : (size == .lg ? KozmosDimensions.primitivesLayoutSpacing400 : KozmosDimensions.primitivesLayoutSpacing200))
            .padding(.vertical, size == .sm ? KozmosDimensions.primitivesLayoutSpacing100 : (size == .lg ? KozmosDimensions.primitivesLayoutSpacing200 : KozmosDimensions.primitivesLayoutSpacing150))
            .background(KozmosColors.primitivesColorsBackground100)
            .foregroundColor(KozmosColors.primitivesColorsForeground0)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .strokeBorder(
                        KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle,
                        style: StrokeStyle(lineWidth: 1, dash: KozmosToggleButton.mixedEdgeDash)
                    )
            )
            .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        }
        // Never selected: said as "Multiple values", its value.
        .accessibilityValue(Text(mixedLabel))
        .kozmosResetFocus($toggleFocused, offered: onResetMixed != nil)
    }

    /// The mixed edge's dashes and gaps, 3 and 3, as a 1px CSS dashed border
    /// draws them.
    static let mixedEdgeDash: [CGFloat] = [3, 3]
}
