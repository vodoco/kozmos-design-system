// Kbd.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A key is drawn as you write it and read by its name: VoiceOver reads this
// Esc as "Escape". KozmosKbd(keys: ["Ctrl", "K"]) draws a combination, read
// "Control+K"; label replaces what is read.
struct ClearSearchHint: View {
    var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            KozmosText("Press")
            KozmosKbd("Esc")
            KozmosText("to clear")
        }
    }
}
