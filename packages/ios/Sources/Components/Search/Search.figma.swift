import SwiftUI
import Figma

struct KozmosSearchConnect: FigmaConnect {
    let component = KozmosSearch.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-391"

    @FigmaString("Placeholder Text")
    var placeholder: String = "Search"

    @FigmaBoolean("Show Clear")
    var clearable: Bool = false

    var body: some View {
        KozmosSearch(
            text: .constant(""),
            placeholder: self.placeholder,
            clearable: self.clearable
        )
    }
}
