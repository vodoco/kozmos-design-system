// Tag.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The words are a String: a tag holds nothing else. variant and emotion
// colour it, and an onRemove adds a remove button named by removeLabel.
struct OpenNowTag: View {
    var body: some View {
        KozmosTag("Open now")
    }
}
