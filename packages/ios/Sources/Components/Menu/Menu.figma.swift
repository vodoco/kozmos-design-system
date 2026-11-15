import SwiftUI
import Figma

struct KozmosMenuBasicConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170"
    var variant = ["Content": "Basic"]

    @FigmaString("Label Text")
    var label: String = "Actions"

    @FigmaString("Item 1 Text")
    var item1: String = "Rename"

    @FigmaString("Item 2 Text")
    var item2: String = "Duplicate"

    @FigmaString("Item 3 Text")
    var item3: String = "Archive"

    // Decision 152: External shows the new-tab icon on the second item.
    @FigmaBoolean("External")
    var external: Bool = false

    @FigmaString("Shortcut Text")
    var shortcut: String = "R"

    var body: some View {
        KozmosMenu(
            title: "Open menu",
            content: KozmosMenuContent(
                label: self.label,
                items: [
                    KozmosMenuItem(text: self.item1, shortcut: self.shortcut),
                    KozmosMenuItem(text: self.item2, external: self.external),
                    KozmosMenuItem(text: self.item3)
                ],
                contentType: .basic
            )
        )
    }
}

struct KozmosMenuCheckboxConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170"
    var variant = ["Content": "Checkbox"]

    @FigmaString("Label Text")
    var label: String = "Map layers"

    @FigmaString("Item 1 Text")
    var item1: String = "Transit"

    @FigmaString("Item 2 Text")
    var item2: String = "Amenities"

    @FigmaString("Item 3 Text")
    var item3: String = "Accessibility"

    var body: some View {
        KozmosMenu(
            title: "Map layers",
            content: KozmosMenuContent(
                label: self.label,
                items: [
                    KozmosMenuItem(text: self.item1, isChecked: true),
                    KozmosMenuItem(text: self.item2),
                    KozmosMenuItem(text: self.item3, isChecked: true)
                ],
                contentType: .checkbox
            )
        )
    }
}

struct KozmosMenuRadioConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170"
    var variant = ["Content": "Radio"]

    @FigmaString("Label Text")
    var label: String = "Route preference"

    @FigmaString("Item 1 Text")
    var item1: String = "Fastest"

    @FigmaString("Item 2 Text")
    var item2: String = "Accessible"

    @FigmaString("Item 3 Text")
    var item3: String = "Fewest transfers"

    var body: some View {
        KozmosMenu(
            title: "Route preference",
            content: KozmosMenuContent(
                label: self.label,
                items: [
                    KozmosMenuItem(text: self.item1, isSelected: true),
                    KozmosMenuItem(text: self.item2),
                    KozmosMenuItem(text: self.item3)
                ],
                contentType: .radio
            )
        )
    }
}

struct KozmosMenuSubmenuConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=101-8170"
    var variant = ["Content": "Submenu"]

    @FigmaString("Label Text")
    var label: String = "Workspace"

    @FigmaString("Item 1 Text")
    var item1: String = "Members"

    @FigmaString("Item 2 Text")
    var item2: String = "Settings"

    @FigmaString("Item 3 Text")
    var item3: String = "Share"

    // Decision 152: External shows the new-tab icon on the second item.
    @FigmaBoolean("External")
    var external: Bool = false

    var body: some View {
        KozmosMenu(
            title: "Workspace",
            content: KozmosMenuContent(
                label: self.label,
                items: [
                    KozmosMenuItem(text: self.item1),
                    KozmosMenuItem(text: self.item2, external: self.external),
                    KozmosMenuItem(
                        text: self.item3,
                        submenuItems: ["Invite people", "Export"]
                    )
                ],
                contentType: .submenu
            )
        )
    }
}
