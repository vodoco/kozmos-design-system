import SwiftUI
import Figma

// GAP-222, decision 216: Content=Filled is the set's two entries, coffee and
// wifi, as chips; Empty is the placeholder alone. Focus is the keyboard's
// ring, not a parameter. Error is `error`, its message Error Text.
struct KozmosChipInputConnect: FigmaConnect {
    let component = KozmosChipInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68659"

    @FigmaString("Label Text")
    var label: String = "Keywords"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Add a keyword"

    @FigmaString("Helper Text")
    var helperText: String = "Press Enter or type a comma to add one."

    @FigmaString("Error Text")
    var errorText: String = "Add at least one keyword"

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly",
            "Error": "error"
        ]
    )
    var state: String = "default"

    @FigmaEnum(
        "Content",
        mapping: [
            "Filled": ["coffee", "wifi"],
            "Empty": []
        ]
    )
    var values: [String] = ["coffee", "wifi"]

    var body: some View {
        KozmosChipInput(
            values: .constant(self.values),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            error: self.state == "error",
            helperText: self.helperText,
            errorMessage: self.state == "error" ? self.errorText : nil
        )
    }
}
