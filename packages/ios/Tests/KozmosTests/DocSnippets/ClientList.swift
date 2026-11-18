// Listbox.mdx's SwiftUI snippet ("Media, trailing words and an active option
// the product moves"), word for word below this comment: compiled here, so a
// renamed or removed parameter fails in this target rather than in a
// reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each client by its logo, or its initials, and how many sites it has.
struct ClientList: View {
    @State private var client = ["acme"]

    var body: some View {
        KozmosListbox(
            options: [
                KozmosListboxOption(
                    value: "acme",
                    label: "Acme Airport",
                    media: KozmosOptionMedia(imageURL: URL(string: "https://example.com/acme.png")),
                    trailing: "12 sites"
                ),
                KozmosListboxOption(value: "globex", label: "Globex", media: KozmosOptionMedia(), trailing: "3 sites"),
            ],
            selectedValues: $client,
            embedded: true
        )
    }
}
