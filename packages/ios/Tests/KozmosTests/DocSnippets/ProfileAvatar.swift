// Avatar.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The initials show while the image loads, if it fails, and with no URL.
// The avatar takes no alt text: the label is what VoiceOver says.
struct ProfileAvatar: View {
    var body: some View {
        KozmosAvatar(
            imageURL: URL(string: "https://github.com/shadcn.png"),
            fallbackText: "CN"
        )
        .accessibilityLabel("@shadcn")
    }
}
