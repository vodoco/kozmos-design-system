// Select.mdx's SwiftUI snippet ("A mixed value"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct TypeAcrossSelection: View {
    @State private var edit: String?

    var body: some View {
        KozmosSelect(
            value: edit,
            placeholder: "Choose a type",
            mixed: edit == nil,
            onResetMixed: { edit = nil }
        ) {
            KozmosSelectItem(value: "POI", label: "POI", selection: Binding(get: { edit ?? "" }, set: { edit = $0 }))
        }
    }
}
