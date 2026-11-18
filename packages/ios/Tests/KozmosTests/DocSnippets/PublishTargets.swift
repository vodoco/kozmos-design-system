// SplitButton.mdx's SwiftUI snippet ("Menu items"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each item is an action, with an icon or disabled, or a separator; what the
// view builder draws follows them, inside the system's Menu.
struct PublishTargets: View {
    let publish: (String) -> Void

    var body: some View {
        KozmosSplitButton(
            label: "Publish",
            mainAction: { publish("draft") },
            items: [
                .action("Publish to staging", icon: Image(systemName: "arrow.down.circle"), action: { publish("staging") }),
                .separator,
                .action("Publish to production", disabled: true, action: {}),
            ]
        ) {
            Button("Publish tonight") { publish("tonight") }
        }
    }
}
