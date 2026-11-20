// SpriteIcon.mdx's SwiftUI snippet ("Implementation"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A type's icon beside its name: decorative, since the name is beside it.
struct DeskType: View {
    let sprite = "https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite"

    var body: some View {
        HStack(spacing: 8) {
            KozmosSpriteIcon(sprite: sprite, name: "desk", size: .s20)
            Text("Office desk")
        }
    }
}
