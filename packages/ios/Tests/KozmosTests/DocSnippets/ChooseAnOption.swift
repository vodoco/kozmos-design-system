// Radio.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each option draws its own label, and every option shares your selection:
// the group only stacks them, and takes no name (React's aria-label has no
// counterpart). VoiceOver is not told which option is selected.
struct ChooseAnOption: View {
    @State private var selection = "option-one"

    var body: some View {
        KozmosRadioGroup {
            KozmosRadioGroupItem(value: "option-one", label: "Option One", selection: $selection)
            KozmosRadioGroupItem(value: "option-two", label: "Option Two", selection: $selection)
        }
    }
}
