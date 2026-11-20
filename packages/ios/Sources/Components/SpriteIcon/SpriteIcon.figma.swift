import SwiftUI
import Figma

// GAP-150, decisions 86 and 219: one cell of a published MapLibre sprite
// atlas. Sprite is the atlas's version-pinned base URL, Cell Name the cell.
struct KozmosSpriteIconConnect: FigmaConnect {
    let component = KozmosSpriteIcon.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68551"

    @FigmaString("Sprite")
    var sprite: String = "https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite"

    @FigmaString("Cell Name")
    var name: String = "desk"

    @FigmaEnum(
        "Size",
        mapping: [
            "16": KozmosSpriteIconSize.s16,
            "20": KozmosSpriteIconSize.s20,
            "24": KozmosSpriteIconSize.s24
        ]
    )
    var size: KozmosSpriteIconSize = .s24

    var body: some View {
        KozmosSpriteIcon(sprite: self.sprite, name: self.name, size: self.size)
    }
}
