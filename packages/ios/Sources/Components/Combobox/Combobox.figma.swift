import SwiftUI
import Figma

struct KozmosComboboxConnect: FigmaConnect {
    let component = KozmosCombobox.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=398-8298"

    @FigmaString("Label Text")
    var label: String = "Facility"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Search or select"

    @FigmaString("Helper Text")
    var helperText: String = "Choose one option."

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
            "Closed": false,
            "Open": true
        ]
    )
    var defaultOpen: Bool = false

    @FigmaString("Option 1 Text")
    var option1: String = "Metro Station"

    @FigmaString("Option 2 Text")
    var option2: String = "Bus Stop"

    @FigmaString("Option 3 Text")
    var option3: String = "Bike Parking"

    // Decision 215, GAP-282: Show Media is each option's Sm Avatar, its
    // initials the label's. GAP-260: Show Trailing is each option's muted
    // words at its end, before the check.
    @FigmaBoolean("Show Media", mapping: [true: KozmosOptionMedia(), false: nil])
    var media: KozmosOptionMedia? = nil

    @FigmaBoolean("Show Trailing")
    var showTrailing: Bool = false

    @FigmaString("Option 1 Trailing")
    var option1Trailing: String = "Text"

    @FigmaString("Option 2 Trailing")
    var option2Trailing: String = "Number"

    @FigmaString("Option 3 Trailing")
    var option3Trailing: String = "Image"

    var body: some View {
        KozmosCombobox(
            value: .constant("metro-station"),
            inputValue: .constant(self.defaultOpen ? self.option1 : ""),
            options: [
                KozmosListboxOption(value: "metro-station", label: self.option1, media: self.media, trailing: self.showTrailing ? self.option1Trailing : nil),
                KozmosListboxOption(value: "bus-stop", label: self.option2, media: self.media, trailing: self.showTrailing ? self.option2Trailing : nil),
                KozmosListboxOption(value: "bike-parking", label: self.option3, media: self.media, trailing: self.showTrailing ? self.option3Trailing : nil)
            ],
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            defaultOpen: self.defaultOpen,
            mixed: self.state == "mixed",
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        )
    }
}
