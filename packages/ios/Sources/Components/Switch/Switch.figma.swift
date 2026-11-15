import SwiftUI
import Figma

struct KozmosSwitchConnect: FigmaConnect {
    let component = KozmosSwitch.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1465"

    @FigmaEnum(
        "Checked",
        mapping: [
            "Unchecked": false,
            "Checked": true
        ]
    )
    var checked: Bool = false

    @FigmaString("Label Text")
    var label: String = "Enable notifications"

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

    // GAP-162: the state in words beside the track; the words are the
    // onLabel and offLabel defaults, "On" and "Off".
    @FigmaBoolean("Show State Label")
    var showStateLabel: Bool = false

    var body: some View {
        KozmosSwitch(
            checked: .constant(self.checked),
            label: self.label,
            description: self.showDescription ? self.descriptionText : nil,
            disabled: self.state == "disabled",
            error: self.state == "error",
            showStateLabel: self.showStateLabel
        )
    }
}
