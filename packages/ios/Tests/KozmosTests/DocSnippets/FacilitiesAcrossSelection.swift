// MultiSelect.mdx's SwiftUI snippet ("Mixed"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct FacilitiesAcrossSelection: View {
    let facilities: [[String]]
    let options: [KozmosListboxOption]
    @State private var edit: [String]?
    @State private var query = ""

    var body: some View {
        let differs = Set(facilities).count > 1
        KozmosMultiSelect(
            selectedValues: Binding(get: { edit ?? (differs ? [] : facilities[0]) }, set: { edit = $0 }),
            searchValue: $query,
            options: options,
            label: "Facilities",
            mixed: differs && edit == nil,
            onResetMixed: differs ? { edit = nil } : nil
        )
    }
}
