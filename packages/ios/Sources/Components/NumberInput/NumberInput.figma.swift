import SwiftUI
import Figma

struct KozmosNumberInputConnect: FigmaConnect {
    let component = KozmosNumberInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=338-1796"

    @FigmaString("Label Text")
    var label: String = "Number"

    @FigmaString("Value Text")
    var valueText: String = "12"

    @FigmaString("Placeholder Text")
    var placeholder: String = "0"

    @FigmaString("Helper Text")
    var helperText: String = "Use a whole number."

    @FigmaBoolean("Show Helper Text")
    var showHelperText: Bool = true

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly",
            "Mixed": "mixed"
        ]
    )
    var state: String = "default"

    // GAP-153: its way back to the several values, once edited.
    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    @FigmaEnum(
        "Status",
        mapping: [
            "Default": KozmosInputStatus.`default`,
            "Error": KozmosInputStatus.error,
            "Warning": KozmosInputStatus.warning,
            "Success": KozmosInputStatus.success
        ]
    )
    var status: KozmosInputStatus = .default

    @FigmaEnum(
        "Steppers",
        mapping: [
            "True": true,
            "False": false
        ]
    )
    var showSteppers: Bool = true

    var body: some View {
        KozmosNumberInput(
            value: .constant(Double(self.valueText)),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            showSteppers: self.showSteppers,
            mixed: self.state == "mixed",
            onResetMixed: self.resetMixed ? {} : nil
        )
    }
}
