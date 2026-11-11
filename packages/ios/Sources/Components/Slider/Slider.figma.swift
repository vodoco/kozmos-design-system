import SwiftUI
import Figma

struct KozmosSliderConnect: FigmaConnect {
    let component = KozmosSlider.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-473"

    @FigmaString("Label Text")
    var label: String = "Value"

    @FigmaBoolean("Show Value")
    var showValue: Bool = false

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled"
        ]
    )
    var state: String = "default"

    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            Text(self.label)
            KozmosSlider(value: .constant(0.5), showValue: self.showValue)
                .disabled(self.state == "disabled")
        }
    }
}
