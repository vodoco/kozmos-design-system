// Input.mdx's SwiftUI snippet ("An edit action"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Map Personas: a persona's Map Style, read only, with a pencil at the
// field's end. What editing means is the product's: here, a sheet.
struct PersonaMapStyle: View {
    @Binding var mapStyle: String
    @State private var editing = false

    var body: some View {
        KozmosInput(
            text: $mapStyle,
            label: "Map Style",
            readOnly: true,
            action: .edit(label: "Edit Map Style", onEdit: { editing = true })
        )
        .sheet(isPresented: $editing) {
            KozmosInput(text: $mapStyle, label: "Map Style")
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
    }
}
