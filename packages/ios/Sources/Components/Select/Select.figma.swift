import SwiftUI
import Figma

struct KozmosSelectConnect: FigmaConnect {
    let component = KozmosSelect<KozmosSelectField, KozmosSelectItem>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Select option"

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Mixed": "mixed"
        ]
    )
    var state: String = "default"

    @FigmaEnum(
        "Status",
        mapping: [
            "Default": false,
            "Error": true
        ]
    )
    var error: Bool = false

    // GAP-153: its way back to the several values, once chosen.
    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    var body: some View {
        KozmosSelect(
            value: nil,
            placeholder: self.placeholder,
            disabled: self.state == "disabled",
            error: self.error,
            mixed: self.state == "mixed",
            onResetMixed: self.resetMixed ? {} : nil
        ) {
            KozmosSelectItem(
                value: "option",
                label: "Option",
                selection: .constant("")
            )
        }
    }
}
