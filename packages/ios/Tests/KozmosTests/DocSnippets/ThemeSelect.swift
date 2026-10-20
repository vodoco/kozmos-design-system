// Select.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// KozmosSelect is the system menu around a trigger you draw; each item
// sets the selection and ticks itself when it is the one chosen.
struct ThemeSelect: View {
    @Binding var theme: String

    var body: some View {
        KozmosSelect {
            Text(label)
        } content: {
            KozmosSelectItem(value: "light", label: "Light", selection: $theme)
            KozmosSelectItem(value: "dark", label: "Dark", selection: $theme)
            KozmosSelectItem(value: "system", label: "System", selection: $theme)
        }
    }

    // The trigger shows the choice, or what is being chosen until there is one.
    private var label: String {
        switch theme {
        case "light": return "Light"
        case "dark": return "Dark"
        case "system": return "System"
        default: return "Theme"
        }
    }
}
