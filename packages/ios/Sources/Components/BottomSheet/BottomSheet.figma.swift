import SwiftUI
import Figma

struct KozmosBottomSheetBasicConnect: FigmaConnect {
    let component = KozmosBottomSheet<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=624-4362"
    var variant = ["Content": "Basic"]

    @FigmaString("Title Text")
    var title: String = "Sheet title"

    @FigmaString("Description Text")
    var description: String = "Sheet supporting content."

    var body: some View {
        KozmosBottomSheet(isPresented: .constant(true)) {
            AnyView(
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                    Text(self.title)
                        .font(KozmosTypography.headline)
                    Text(self.description)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing400)
            )
        }
    }
}

struct KozmosBottomSheetFormConnect: FigmaConnect {
    let component = KozmosBottomSheet<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=624-4362"
    var variant = ["Content": "Form"]

    @FigmaString("Title Text")
    var title: String = "Route details"

    @FigmaString("Description Text")
    var description: String = "Review nearby stops and choose what to do next."

    var body: some View {
        KozmosBottomSheet(isPresented: .constant(true)) {
            AnyView(
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
                    Text(self.title)
                        .font(KozmosTypography.headline)
                    Text(self.description)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    TextField("Search places", text: .constant(""))
                    TextField("Optional context", text: .constant(""))
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing400)
            )
        }
    }
}

struct KozmosBottomSheetFooterConnect: FigmaConnect {
    let component = KozmosBottomSheet<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=624-4362"
    var variant = ["Content": "Footer"]

    @FigmaString("Title Text")
    var title: String = "Route details"

    @FigmaString("Description Text")
    var description: String = "Review nearby stops and choose what to do next."

    var body: some View {
        KozmosBottomSheet(isPresented: .constant(true)) {
            AnyView(
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
                    Text(self.title)
                        .font(KozmosTypography.headline)
                    Text(self.description)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    HStack {
                        Button("Cancel") {}
                        Button("Apply") {}
                    }
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing400)
            )
        }
    }
}
