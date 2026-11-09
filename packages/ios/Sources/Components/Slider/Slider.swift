import SwiftUI

/// A slider, and — `showValue` — its value as text at its trailing end, on
/// the slider's row, at rest as well as while it moves (GAP-163, decision
/// 132), as React's `showValue`.
///
/// `formatValue` writes the value ("60 %"); left out, the number, whole
/// numbers with no decimal point, as React shows a number. The readout is
/// hidden from VoiceOver, which hears the slider's own value: with a
/// `formatValue`, that formatted text in place of the number, so the two say
/// the same once. Disabled, the readout is dimmed with the slider.
public struct KozmosSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let showValue: Bool
    let formatValue: ((Double) -> String)?
    @Environment(\.kozmosAnalytics) var trackEvent
    @Environment(\.isEnabled) private var isEnabled

    public init(
        value: Binding<Double>,
        range: ClosedRange<Double> = 0...1,
        showValue: Bool = false,
        formatValue: ((Double) -> String)? = nil
    ) {
        self._value = value
        self.range = range
        self.showValue = showValue
        self.formatValue = formatValue
    }

    /// The value as the readout draws it.
    var readout: String {
        if let formatValue { return formatValue(value) }
        if value.truncatingRemainder(dividingBy: 1) == 0, abs(value) < 1e15 {
            return String(Int(value))
        }
        return String(value)
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Slider(value: $value, in: range, onEditingChanged: { editing in
                if !editing {
                    trackEvent(KozmosAnalyticsEvent(eventName: "slider_value_changed", component: "Slider", properties: ["value": value]))
                }
            })
                // Theme 600, as React's and Figma's: at 500 the range read under
                // 3:1 against its track (decision 59).
                .accentColor(KozmosColors.primitivesColorsTheme600)
                .modifier(KozmosSliderSpokenValue(text: formatValue.map { $0(value) }))

            if showValue {
                Text(readout)
                    .font(KozmosTypography.subheadline)
                    .monospacedDigit()
                    // Dimmed with the slider when it is disabled, as
                    // NumberInput's unit and React's readout are.
                    .foregroundColor(isEnabled ? KozmosColors.primitivesColorsForeground400
                                               : KozmosColors.primitivesColorsForeground500)
                    .lineLimit(1)
                    .fixedSize()
                    // The slider says its value: heard here too, it is said twice.
                    .accessibilityHidden(true)
            }
        }
    }
}

/// The slider's spoken value, the formatted text, when a product formats it.
/// Keyed on whether there is a formatter, never on the value, so the slider
/// stays one view while it is dragged.
private struct KozmosSliderSpokenValue: ViewModifier {
    let text: String?

    func body(content: Content) -> some View {
        if let text {
            content.accessibilityValue(Text(text))
        } else {
            content
        }
    }
}
