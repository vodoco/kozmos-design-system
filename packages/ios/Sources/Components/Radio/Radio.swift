import SwiftUI

public struct KozmosRadioGroup<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            content
        }
    }
}

public struct KozmosRadioGroupItem: View {
    let value: String
    let label: String?
    let disabled: Bool
    let error: Bool
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(
        value: String,
        label: String? = nil,
        selection: Binding<String>,
        disabled: Bool = false,
        error: Bool = false
    ) {
        self.value = value
        self.label = label
        self._selection = selection
        self.disabled = disabled
        self.error = error
    }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "radio_selection_changed", component: "RadioGroup", properties: ["value": value]))
            selection = value
        }) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ZStack {
                    Circle()
                        .stroke(controlColor, lineWidth: 1)
                        .frame(width: 20, height: 20)
                    
                    if selection == value {
                        Circle()
                            .fill(dotColor)
                            .frame(width: 10, height: 10)
                    }
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

    private var isSelected: Bool {
        selection == value
    }

    /// Decision 59: the ring is a border on the surface, theme 600, as
    /// React's; the dot is a fill, the theme fill, theme 500 in both themes.
    private var controlColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        if isSelected { return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsTheme600 }
        return KozmosColors.primitivesColorsForeground500
    }

    private var dotColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
    }

    private var labelColor: Color {
        if error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100
    }
}
