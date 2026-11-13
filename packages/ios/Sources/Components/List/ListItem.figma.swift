import SwiftUI
import Figma

// GAP-195, decision 135: the ListItem set is a new Figma set. Its node id is
// a placeholder until the plugin's Build gives it one; this file stays out of
// figma.linked.config.json until then.
struct KozmosListItemConnect: FigmaConnect {
    let component = KozmosListItem.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"

    @FigmaEnum("Selected", mapping: ["False": false, "True": true])
    var selected: Bool = false

    @FigmaString("Title Text")
    var title: String = "Explore the map"

    @FigmaString("Addon Text")
    var addon: String = "Viewer"

    @FigmaString("Description Text")
    var description: String = "Pan, zoom and change levels."

    @FigmaString("Meta Text")
    var meta: String = "2 min"

    @FigmaString("Action Text")
    var action: String = "Replay"

    var body: some View {
        KozmosListItem(self.title, description: self.description, meta: self.meta, selected: self.selected)
            .leading { KozmosListItemStatus(.done) }
            .titleAddon { KozmosTag(self.addon, variant: .secondary) }
            .trailing { KozmosButton(self.action, variant: .outline, size: .sm) {} }
    }
}
