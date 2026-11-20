import SwiftUI
import Figma

// Decision 209, GAP-168: the menu's items are the ones Menu Open shows, an
// item with an icon, a separator and a disabled item. Menu Open itself is
// not mapped: it draws the menu open, which the user does. Variant, Size
// and State are not mapped: KozmosSplitButton takes none of them.
struct KozmosSplitButtonConnect: FigmaConnect {
    let component = KozmosSplitButton.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=383-2332"

    @FigmaString("Label Text")
    var label: String = "Action"

    var body: some View {
        KozmosSplitButton(
            label: self.label,
            mainAction: {},
            items: [
                .action("Publish to staging", icon: Image(systemName: "arrow.down.to.line"), action: {}),
                .separator,
                .action("Publish to production", disabled: true, action: {})
            ]
        )
    }
}
