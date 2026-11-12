// Input.mdx's SwiftUI snippet ("A mixed value"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct NameAcrossSelection: View {
    let names: [String]
    @State private var edit: String?

    var body: some View {
        let differs = Set(names).count > 1
        KozmosInput(
            text: Binding(get: { edit ?? (differs ? "" : names[0]) }, set: { edit = $0 }),
            label: "Name",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
