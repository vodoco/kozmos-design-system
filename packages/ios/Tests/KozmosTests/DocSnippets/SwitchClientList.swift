// Listbox.mdx's SwiftUI snippet ("Embedded"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Inside a sheet, a popover or a card, the list draws no box of its own.
struct SwitchClientList: View {
    @State private var client = ["acme"]

    var body: some View {
        KozmosListbox(
            options: [
                KozmosListboxOption(value: "acme", label: "Acme"),
                KozmosListboxOption(value: "globex", label: "Globex"),
            ],
            selectedValues: $client,
            embedded: true
        )
    }
}
