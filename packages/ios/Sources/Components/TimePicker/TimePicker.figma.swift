import SwiftUI
import Figma

struct KozmosTimePickerConnect: FigmaConnect {
    let component = KozmosTimePicker.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12011"

    @FigmaString("Label Text")
    var label: String = "Time"

    // GAP-255: State=Mixed, the field of a multi-selection whose values
    // differ; Reset Mixed, its way back once edited.
    @FigmaEnum(
        "State",
        mapping: [
            "Default": false,
            "Focus": false,
            "Disabled": false,
            "Readonly": false,
            "Mixed": true
        ]
    )
    var mixed: Bool = false

    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    @FigmaString("Mixed Text")
    var mixedLabel: String = "Multiple values"

    @FigmaString("Reset Mixed Text")
    var resetMixedLabel: String = "Reset to multiple values"

    var body: some View {
        KozmosTimePicker(
            selection: .constant(Date()),
            label: self.label,
            mixed: self.mixed,
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        )
    }
}
