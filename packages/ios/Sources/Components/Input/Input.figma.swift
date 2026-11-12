import SwiftUI
import Figma

// One connect per Action (GAP-154): None, Copy, and the toggle at rest and
// pressed. Action Icon is an instance a native snippet cannot name, so the
// toggle shows the Featured star as SwiftUI draws it.
struct KozmosInputConnect: FigmaConnect {
    let component = KozmosInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558"
    var variant = ["Action": "None"]

    @FigmaString("Label Text")
    var label: String = "Email"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Placeholder"

    @FigmaString("Helper Text")
    var helperText: String = "Use a work email address."

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

    var body: some View {
        KozmosInput(
            text: .constant(""),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            mixed: self.state == "mixed",
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        )
    }
}

struct KozmosInputCopyConnect: FigmaConnect {
    let component = KozmosInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558"
    var variant = ["Action": "Copy"]

    @FigmaString("Label Text")
    var label: String = "Email"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Placeholder"

    @FigmaString("Helper Text")
    var helperText: String = "Use a work email address."

    @FigmaBoolean("Show Helper Text")
    var showHelperText: Bool = true

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly"
        ]
    )
    var state: String = "default"

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

    var body: some View {
        KozmosInput(
            text: .constant(""),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            action: .copy()
        )
    }
}

struct KozmosInputToggleConnect: FigmaConnect {
    let component = KozmosInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558"
    var variant = ["Action": "Toggle"]

    @FigmaString("Label Text")
    var label: String = "Email"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Placeholder"

    @FigmaString("Helper Text")
    var helperText: String = "Use a work email address."

    @FigmaBoolean("Show Helper Text")
    var showHelperText: Bool = true

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly"
        ]
    )
    var state: String = "default"

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

    var body: some View {
        KozmosInput(
            text: .constant(""),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            action: .toggle(label: "Featured", icon: Image(systemName: "star"), isPressed: .constant(false))
        )
    }
}

struct KozmosInputTogglePressedConnect: FigmaConnect {
    let component = KozmosInput.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558"
    var variant = ["Action": "TogglePressed"]

    @FigmaString("Label Text")
    var label: String = "Email"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Placeholder"

    @FigmaString("Helper Text")
    var helperText: String = "Use a work email address."

    @FigmaBoolean("Show Helper Text")
    var showHelperText: Bool = true

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly"
        ]
    )
    var state: String = "default"

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

    var body: some View {
        KozmosInput(
            text: .constant(""),
            label: self.label,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            helperText: self.showHelperText ? self.helperText : nil,
            action: .toggle(label: "Featured", icon: Image(systemName: "star"), isPressed: .constant(true))
        )
    }
}
