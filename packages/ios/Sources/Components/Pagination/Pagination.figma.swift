import SwiftUI
import Figma

struct KozmosPaginationBasicConnect: FigmaConnect {
    let component = KozmosPagination<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157"
    var variant = ["Content": "Basic"]

    @FigmaString("Page 1 Text")
    var page1: String = "1"

    @FigmaString("Page 2 Text")
    var page2: String = "2"

    @FigmaString("Page 3 Text")
    var page3: String = "3"

    @FigmaString("Previous Text")
    var previousText: String = "Previous"

    @FigmaString("Next Text")
    var nextText: String = "Next"

    var body: some View {
        KozmosPagination {
            KozmosPaginationPrevious(label: self.previousText, action: {})
            KozmosPaginationLink(text: self.page1, action: {})
            KozmosPaginationLink(text: self.page2, isActive: true, action: {})
            KozmosPaginationLink(text: self.page3, action: {})
            KozmosPaginationNext(label: self.nextText, action: {})
        }
    }
}

struct KozmosPaginationEllipsisConnect: FigmaConnect {
    let component = KozmosPagination<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157"
    var variant = ["Content": "Ellipsis"]

    @FigmaString("Page 1 Text")
    var page1: String = "1"

    @FigmaString("Page 2 Text")
    var page2: String = "2"

    @FigmaString("Page 3 Text")
    var page3: String = "3"

    @FigmaString("Last Page Text")
    var lastPage: String = "10"

    @FigmaString("Previous Text")
    var previousText: String = "Previous"

    @FigmaString("Next Text")
    var nextText: String = "Next"

    var body: some View {
        KozmosPagination {
            KozmosPaginationPrevious(label: self.previousText, action: {})
            KozmosPaginationLink(text: self.page1, action: {})
            KozmosPaginationLink(text: self.page2, isActive: true, action: {})
            KozmosPaginationLink(text: self.page3, action: {})
            KozmosPaginationEllipsis()
            KozmosPaginationLink(text: self.lastPage, action: {})
            KozmosPaginationNext(label: self.nextText, action: {})
        }
    }
}

struct KozmosPaginationCompactConnect: FigmaConnect {
    let component = KozmosPagination<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=280-1157"
    var variant = ["Content": "Compact"]

    @FigmaString("Compact Text")
    var compactText: String = "2 / 10"

    @FigmaString("Previous Text")
    var previousText: String = "Previous"

    @FigmaString("Next Text")
    var nextText: String = "Next"

    var body: some View {
        KozmosPagination {
            KozmosPaginationPrevious(label: self.previousText, action: {})
            Text(self.compactText)
                .font(KozmosTypography.subheadline)
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
            KozmosPaginationNext(label: self.nextText, action: {})
        }
    }
}
