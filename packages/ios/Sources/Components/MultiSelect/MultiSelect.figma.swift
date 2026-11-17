import SwiftUI
import Figma

struct KozmosMultiSelectConnect: FigmaConnect {
    let component = KozmosMultiSelect.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9365"

    @FigmaString("Label Text")
    var label: String = "Facilities"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Select options"

    @FigmaString("Helper Text")
    var helperText: String = "Choose one or more options."

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

    // GAP-255: its way back to the several values, once edited.
    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    @FigmaString("Mixed Text")
    var mixedLabel: String = "Multiple values"

    @FigmaString("Reset Mixed Text")
    var resetMixedLabel: String = "Reset to multiple values"

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
        "Content",
        mapping: [
            "Empty": [],
            "Selected": ["metro-station", "bus-stop"],
            "Open": ["metro-station", "bus-stop"]
        ]
    )
    var selectedValues: [String] = []

    @FigmaString("Option 1 Text")
    var option1: String = "Metro Station"

    @FigmaString("Option 2 Text")
    var option2: String = "Bus Stop"

    @FigmaString("Option 3 Text")
    var option3: String = "Bike Parking"

    var body: some View {
        KozmosMultiSelect(
            selectedValues: .constant(self.selectedValues),
            searchValue: .constant(""),
            options: [
                KozmosListboxOption(value: "metro-station", label: self.option1),
                KozmosListboxOption(value: "bus-stop", label: self.option2),
                KozmosListboxOption(value: "bike-parking", label: self.option3)
            ],
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            defaultOpen: self.selectedValues.count > 1,
            mixed: self.state == "mixed",
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        )
    }
}
