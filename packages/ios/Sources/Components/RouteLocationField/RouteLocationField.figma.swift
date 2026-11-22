import SwiftUI
import Figma

// GAP-206: State is location and status. Search, Loading, Empty and Error
// are the search with no place (status idle, loading, empty, error);
// Resolved is the place chosen, Location Text and Description Text its label
// and description (Show Description). Label Text is label.
struct KozmosRouteLocationFieldConnect: FigmaConnect {
    let component = KozmosRouteLocationField.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648"
    var variant = ["State": "Resolved"]

    @FigmaString("Label Text")
    var label: String = "Destination"

    @FigmaString("Location Text")
    var locationLabel: String = "Main Lobby"

    @FigmaString("Description Text")
    var locationDescription: String = "Ground Floor"

    @FigmaBoolean("Show Description")
    var showDescription: Bool = true

    var body: some View {
        KozmosRouteLocationField(
            label: self.label,
            location: KozmosListboxOption(
                value: "main-lobby",
                label: self.locationLabel,
                description: self.showDescription ? self.locationDescription : nil
            ),
            query: "",
            options: [],
            onQueryChange: { _ in },
            onSelect: { _ in },
            onClear: {}
        )
    }
}

struct KozmosRouteLocationFieldSearchConnect: FigmaConnect {
    let component = KozmosRouteLocationField.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648"
    var variant = ["State": "Search"]

    @FigmaString("Label Text")
    var label: String = "Destination"

    var body: some View {
        KozmosRouteLocationField(
            label: self.label,
            location: nil,
            query: "",
            options: [],
            onQueryChange: { _ in },
            onSelect: { _ in },
            onClear: {}
        )
    }
}

struct KozmosRouteLocationFieldLoadingConnect: FigmaConnect {
    let component = KozmosRouteLocationField.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648"
    var variant = ["State": "Loading"]

    @FigmaString("Label Text")
    var label: String = "Destination"

    var body: some View {
        KozmosRouteLocationField(
            label: self.label,
            location: nil,
            query: "",
            options: [],
            status: .loading,
            onQueryChange: { _ in },
            onSelect: { _ in },
            onClear: {}
        )
    }
}

struct KozmosRouteLocationFieldEmptyConnect: FigmaConnect {
    let component = KozmosRouteLocationField.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648"
    var variant = ["State": "Empty"]

    @FigmaString("Label Text")
    var label: String = "Destination"

    var body: some View {
        KozmosRouteLocationField(
            label: self.label,
            location: nil,
            query: "",
            options: [],
            status: .empty,
            onQueryChange: { _ in },
            onSelect: { _ in },
            onClear: {}
        )
    }
}

struct KozmosRouteLocationFieldErrorConnect: FigmaConnect {
    let component = KozmosRouteLocationField.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17648"
    var variant = ["State": "Error"]

    @FigmaString("Label Text")
    var label: String = "Destination"

    var body: some View {
        KozmosRouteLocationField(
            label: self.label,
            location: nil,
            query: "",
            options: [],
            status: .error,
            onQueryChange: { _ in },
            onSelect: { _ in },
            onClear: {}
        )
    }
}
