// Menu.mdx's SwiftUI snippet ("An item that leaves the app"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// external draws Pointr's new-tab icon at the item's end and gives VoiceOver
// the hint "Opens in your browser"; externalLabel takes your words. Opening
// the page is still yours, in onItemSelect.
struct HelpMenu: View {
    @Environment(\.openURL) private var openURL

    var body: some View {
        KozmosMenu(
            title: "Help",
            content: KozmosMenuContent(items: [
                KozmosMenuItem(text: "Keyboard shortcuts"),
                KozmosMenuItem(text: "Help centre", external: true),
            ]),
            onItemSelect: { item in
                if item.external, let url = URL(string: "https://help.example.com") {
                    openURL(url)
                }
            }
        )
    }
}
