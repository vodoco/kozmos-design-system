import SwiftUI

public struct KozmosSlider: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: Binding<Double>, range: ClosedRange<Double> = 0...1) {
        self._value = value
        self.range = range
    }
    
    public var body: some View {
        Slider(value: $value, in: range, onEditingChanged: { editing in
            if !editing {
                trackEvent(KozmosAnalyticsEvent(eventName: "slider_value_changed", component: "Slider", properties: ["value": value]))
            }
        })
            // Theme 600, as React's and Figma's: at 500 the range read under
            // 3:1 against its track (decision 59).
            .accentColor(KozmosColors.primitivesColorsTheme600)
    }
}
