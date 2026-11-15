import SwiftUI
import Figma

// GAP-040, decision 135: the SettingsRow set, built by the plugin.
struct KozmosSettingsRowConnect: FigmaConnect {
    let component = KozmosSettingsRow<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23163"

    @FigmaString("Label Text")
    var label: String = "Show the banner"

    @FigmaString("Description Text")
    var description: String = "A message above the map."

    @FigmaEnum("State", mapping: ["None": nil, "Inherited": .inherited, "Overridden": .overridden])
    var state: KozmosSettingsRowState? = .inherited

    @FigmaEnum("Disabled", mapping: ["False": false, "True": true])
    var disabled: Bool = false

    @FigmaString("Reason Text")
    var reason: String = "Turn on Positioning first."

    var body: some View {
        KozmosSettingsRow(
            self.label,
            description: self.description,
            state: self.state,
            disabled: self.disabled,
            disabledReason: self.reason,
            onReset: {}
        ) {
            AnyView(KozmosSwitch(checked: .constant(true)))
        }
    }
}
