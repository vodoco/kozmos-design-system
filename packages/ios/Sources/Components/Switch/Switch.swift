import SwiftUI

public struct KozmosSwitch: View {
    @Binding var checked: Bool
    let label: String?
    let disabled: Bool
    let error: Bool
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(
        checked: Binding<Bool>,
        label: String? = nil,
        disabled: Bool = false,
        error: Bool = false
    ) {
        self._checked = checked
        self.label = label
        self.disabled = disabled
        self.error = error
    }
    
    public var body: some View {
        Button(action: {
            let nextValue = !checked
            trackEvent(KozmosAnalyticsEvent(eventName: "switch_toggled", component: "Switch", properties: ["checked": nextValue]))
            checked = nextValue
        }) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
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

                if let label = label {
                    Text(label)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(labelColor)
                }
            }
            .frame(minHeight: 44, alignment: .center)
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(disabled)
    }

    /// Decision 59: checked, the track is a prominent fill, the theme fill.
    private var trackColor: Color {
        if error && checked { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if checked { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle }
        return KozmosColors.primitivesColorsForeground500
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
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100
    }
}
