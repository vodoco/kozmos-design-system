import SwiftUI
import Figma

struct KozmosCheckboxConnect: FigmaConnect {
    let component = KozmosCheckbox.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1410"

    @FigmaEnum(
        "Checked",
        mapping: [
            "Unchecked": false,
            "Checked": true
        ]
    )
    var checked: Bool = false

    @FigmaString("Label Text")
    var label: String = "Accept terms"

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Disabled": "disabled",
            "Error": "error"
        ]
    )
    var state: String = "default"

    // GAP-162: the description, shown or not.
    @FigmaBoolean("Show Description")
    var showDescription: Bool = false

    @FigmaString("Description Text")
    var descriptionText: String = "Description"

    var body: some View {
        KozmosCheckbox(
            checked: .constant(self.checked),
            label: self.label,
            description: self.showDescription ? self.descriptionText : nil,
            disabled: self.state == "disabled",
            error: self.state == "error"
        )
    }
}
