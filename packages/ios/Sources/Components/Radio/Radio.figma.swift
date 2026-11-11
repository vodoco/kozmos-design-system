import SwiftUI
import Figma

// One mapping per Variant (GAP-158): the ring and its label, a card, a tile.
// A card's or tile's media is the product's image or icon; the examples draw
// an SF Symbol in its place.

struct KozmosRadioConnect: FigmaConnect {
    let component = KozmosRadioGroupItem<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436"
    var variant = ["Variant": "Default"]

    @FigmaEnum(
        "Checked",
        mapping: [
            "Unchecked": false,
            "Checked": true
        ]
    )
    var checked: Bool = false

    @FigmaString("Label Text")
    var label: String = "Option"

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
        KozmosRadioGroup {
            KozmosRadioGroupItem(
                value: "option",
                label: self.label,
                description: self.showDescription ? self.descriptionText : nil,
                selection: .constant(self.checked ? "option" : ""),
                disabled: self.state == "disabled",
                error: self.state == "error"
            )
        }
    }
}

struct KozmosRadioCardConnect: FigmaConnect {
    let component = KozmosRadioGroupItem<Image>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436"
    var variant = ["Variant": "Card"]

    @FigmaEnum(
        "Checked",
        mapping: [
            "Unchecked": false,
            "Checked": true
        ]
    )
    var checked: Bool = false

    @FigmaString("Label Text")
    var label: String = "Satellite"

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
    var showDescription: Bool = true

    @FigmaString("Description Text")
    var descriptionText: String = "Aerial imagery under the map"

    var body: some View {
        KozmosRadioGroup {
            KozmosRadioGroupItem(
                value: "option",
                label: self.label,
                description: self.showDescription ? self.descriptionText : nil,
                variant: .card,
                selection: .constant(self.checked ? "option" : ""),
                disabled: self.state == "disabled",
                error: self.state == "error"
            ) {
                Image(systemName: "globe")
            }
        }
    }
}

struct KozmosRadioTileConnect: FigmaConnect {
    let component = KozmosRadioGroupItem<Image>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1436"
    var variant = ["Variant": "Tile"]

    @FigmaEnum(
        "Checked",
        mapping: [
            "Unchecked": false,
            "Checked": true
        ]
    )
    var checked: Bool = false

    @FigmaString("Label Text")
    var label: String = "Fade"

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
        KozmosRadioGroup {
            KozmosRadioGroupItem(
                value: "option",
                label: self.label,
                description: self.showDescription ? self.descriptionText : nil,
                variant: .tile,
                selection: .constant(self.checked ? "option" : ""),
                disabled: self.state == "disabled",
                error: self.state == "error"
            ) {
                Image(systemName: "circle.lefthalf.filled")
            }
        }
    }
}
