// Select.mdx's SwiftUI snippet ("A ghost trigger"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct LevelControl: View {
    @State private var level = "Level 1"

    var body: some View {
        KozmosSelect(value: level, placeholder: "Level", variant: .ghost) {
            KozmosSelectItem(value: "Level 1", label: "Level 1", selection: $level)
            KozmosSelectItem(value: "Level 2", label: "Level 2", selection: $level)
        }
    }
}
