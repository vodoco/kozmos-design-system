import SwiftUI
import Figma

struct KozmosEmptyStateBasicConnect: FigmaConnect {
    let component = KozmosEmptyState<EmptyView, EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316"
    var variant = ["Content": "Basic"]

    @FigmaString("Title Text")
    var title: String = "No results found"

    @FigmaString("Description Text")
    var description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaBoolean("List")
    var showList: Bool = false

    @FigmaString("List Item 1 Text")
    var item1: String = "Check the building and level"

    @FigmaString("List Item 2 Text")
    var item2: String = "Clear the type filters"

    @FigmaString("List Item 3 Text")
    var item3: String = "Search by another name or an ID"

    var body: some View {
        KozmosEmptyState(
            title: self.title,
            description: self.description,
            list: self.showList ? [self.item1, self.item2, self.item3] : []
        )
    }
}

struct KozmosEmptyStateIconConnect: FigmaConnect {
    let component = KozmosEmptyState<Image, EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316"
    var variant = ["Content": "Icon"]

    @FigmaString("Title Text")
    var title: String = "No results found"

    @FigmaString("Description Text")
    var description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaBoolean("List")
    var showList: Bool = false

    @FigmaString("List Item 1 Text")
    var item1: String = "Check the building and level"

    @FigmaString("List Item 2 Text")
    var item2: String = "Clear the type filters"

    @FigmaString("List Item 3 Text")
    var item3: String = "Search by another name or an ID"

    var body: some View {
        KozmosEmptyState(
            title: self.title,
            description: self.description,
            list: self.showList ? [self.item1, self.item2, self.item3] : []
        ) {
            Image(systemName: "magnifyingglass")
        } action: {
            EmptyView()
        }
    }
}

struct KozmosEmptyStateActionConnect: FigmaConnect {
    let component = KozmosEmptyState<Image, KozmosButton>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=347-5316"
    var variant = ["Content": "Action"]

    @FigmaString("Title Text")
    var title: String = "No results found"

    @FigmaString("Description Text")
    var description: String = "Try adjusting your filters or search terms."

    // GAP-165: what to try, under the description.
    @FigmaBoolean("List")
    var showList: Bool = false

    @FigmaString("List Item 1 Text")
    var item1: String = "Check the building and level"

    @FigmaString("List Item 2 Text")
    var item2: String = "Clear the type filters"

    @FigmaString("List Item 3 Text")
    var item3: String = "Search by another name or an ID"

    var body: some View {
        KozmosEmptyState(
            title: self.title,
            description: self.description,
            list: self.showList ? [self.item1, self.item2, self.item3] : []
        ) {
            Image(systemName: "magnifyingglass")
        } action: {
            KozmosButton("Clear filters", variant: .outline, action: {})
        }
    }
}
