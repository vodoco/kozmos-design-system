// CodeBlock.mdx's SwiftUI snippet ("Implementation"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// MAP-619's merged unit: a custom field's JSON, read only, with a copy.
struct MergedUnitJSON: View {
    let json: String

    var body: some View {
        KozmosCodeBlock(json, label: "mergedUnit JSON", copyable: true, copyLabel: "Copy JSON")
    }
}
