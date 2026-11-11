import SwiftUI
import Figma

// GAP-155: the set's panel and properties are Menu's; what differs is how it
// opens, `.kozmosContextMenu` on the view a long press or a secondary click
// opens it on. External draws the new-tab icon on Item 2, which only Basic and
// Submenu paint. ContextMenu is a view modifier, not a type: `component` names
// KozmosMenu, whose rows and KozmosMenuContent it draws, so Dev Mode labels the
// snippet with a real type rather than "undefined".

struct KozmosContextMenuBasicConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998"
    var variant = ["Content": "Basic"]

    @FigmaString("Label Text")
    var label: String = "Feature actions"

    @FigmaString("Item 1 Text")
    var item1: String = "Copy"

    @FigmaString("Item 2 Text")
    var item2: String = "Open guide"

    @FigmaString("Item 3 Text")
    var item3: String = "Report a problem"

    @FigmaString("Shortcut Text")
    var shortcut: String = "⌘C"

    @FigmaBoolean("External")
    var external: Bool = false

    var body: some View {
        Text("Gate A12")
            .kozmosContextMenu(
                KozmosMenuContent(
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

struct KozmosContextMenuCheckboxConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998"
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
        Text("Level 2")
            .kozmosContextMenu(
                KozmosMenuContent(
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

struct KozmosContextMenuRadioConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998"
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
        Text("Route to Gate A12")
            .kozmosContextMenu(
                KozmosMenuContent(
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

struct KozmosContextMenuSubmenuConnect: FigmaConnect {
    let component = KozmosMenu.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11998"
    var variant = ["Content": "Submenu"]

    @FigmaString("Label Text")
    var label: String = "Feature actions"

    @FigmaString("Item 1 Text")
    var item1: String = "Copy"

    @FigmaString("Item 2 Text")
    var item2: String = "Open guide"

    @FigmaString("Item 3 Text")
    var item3: String = "Move to level"

    @FigmaBoolean("External")
    var external: Bool = false

    var body: some View {
        Text("Gate A12")
            .kozmosContextMenu(
                KozmosMenuContent(
                    label: self.label,
                    items: [
                        KozmosMenuItem(text: self.item1),
                        KozmosMenuItem(text: self.item2, external: self.external),
                        KozmosMenuItem(
                            text: self.item3,
                            submenuItems: ["Level 1", "Level 2"]
                        )
                    ],
                    contentType: .submenu
                )
            )
    }
}
