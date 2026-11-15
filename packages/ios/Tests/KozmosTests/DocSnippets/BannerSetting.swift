// SettingsRow.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The switch is read by the row's name, with the description and the state
// as its hint. Changed, the setting is overridden; Reset to default gives it
// back to the system's value.
struct BannerSetting: View {
    @State private var on = false
    @State private var state: KozmosSettingsRowState = .inherited

    var body: some View {
        KozmosList {
            KozmosSettingsRow(
                "Show the banner",
                description: "A message above the map.",
                state: state,
                onReset: {
                    on = false
                    state = .inherited
                }
            ) {
                KozmosSwitch(checked: Binding(get: { on }, set: { on = $0; state = .overridden }))
            }
        }
    }
}
