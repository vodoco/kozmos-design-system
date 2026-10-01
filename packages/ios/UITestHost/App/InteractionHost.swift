import SwiftUI
import Kozmos

/// Offline fixtures exercise the public component API. No SDK, credentials or
/// private accessibility switch is needed: XCTest launches this real app.
@main
struct InteractionHost: App {
    var body: some Scene {
        WindowGroup { InteractionFixture() }
    }
}

private struct InteractionFixture: View {
    private let scenario = ProcessInfo.processInfo.arguments.dropFirst().first ?? "traits"
    @State private var events: [String] = []
    @State private var selected = false
    @State private var category = "all"
    @State private var openNow = true
    @State private var galleryIndex = 1
    @State private var replaced = false

    private let cafe = KozmosPOIPresentation(id: "cafe", name: "Harbour Coffee", floorLabel: "Level 2")
    private let gate = KozmosPOIPresentation(id: "gate/12", name: "Gate 12", floorLabel: "Level 1")
    private let go = KozmosPOIResultActionPresentation(action: .navigate, label: "Go", primary: true)

    private var photos: [KozmosPOIMediaPresentation] {
        // HTTP is rejected by the component's URL policy; these never need a network.
        (1...(replaced ? 2 : 3)).map {
            .init(id: "\(replaced ? "replacement" : "photo")-\($0)", src: "http://example.com/\($0).jpg", alt: "Photo \($0)")
        }
    }

    private func items(_ actions: [KozmosPOIResultActionPresentation], unavailable: Bool = false) -> [KozmosPOIResultListItem] {
        [
            .init(poi: cafe, result: .init(poiId: "cafe", resultIndex: 0, actions: actions)),
            .init(poi: gate, result: .init(poiId: "gate/12", resultIndex: 1,
                                         available: unavailable ? false : nil,
                                         unavailableReason: unavailable ? "Closed until 06:00" : nil,
                                         actions: actions))
        ]
    }

    private func action(_ action: KozmosPOIResultAction, _ id: String) { events.append("\(action.rawValue) \(id)") }
    private func select(_ id: String) { events.append("select \(id)") }

    var body: some View {
        VStack(spacing: 16) {
            fixture
            // Observable callback evidence, not a second implementation of the control.
            Text(events.isEmpty ? "none" : events.joined(separator: "|"))
                .accessibilityIdentifier("received-events")
            Spacer(minLength: 0)
        }
        .padding(16)
    }

    @ViewBuilder private var fixture: some View {
        switch scenario {
        case "result-action-targets", "result-action-targets-large":
            KozmosPOIResultList(items: items([go, .init(action: .details, label: "Details"),
                .init(action: .order, label: "Order ahead", disabled: true)]),
                resultCountLabel: "2 results", selectedPoiId: "cafe", onSelect: select, onAction: action)
                .environment(\.dynamicTypeSize, scenario == "result-action-targets-large" ? .accessibility3 : .large)
        case "traits":
            KozmosChip(text: "Vegan", selected: true, action: {})
            KozmosChip(text: "Halal", action: {})
            KozmosChip(text: "Step-free", selected: true)
        case "toggle":
            KozmosChip(text: "Vegan", selected: selected, action: {
                selected.toggle()
                events.append("Vegan")
            })
        case "remove":
            KozmosChip(text: "Coffee", selected: true, onRemove: { events.append("remove Coffee") },
                       action: { events.append("Coffee") })
            KozmosChip(text: "Open now", onRemove: { events.append("remove Open now") })
        case "localized-remove":
            KozmosChip(text: "Kaffee", removeLabel: "Kaffee entfernen",
                       onRemove: { events.append("remove Kaffee") }, action: { events.append("Kaffee") })
            KozmosChip(text: "Tee", removeLabel: "Tee entfernen", onRemove: { events.append("remove Tee") },
                       icon: { Image(systemName: "cup.and.saucer") })
            KozmosChip(text: "Milch", disabled: true, removeLabel: "Milch entfernen",
                       onRemove: { events.append("disabled remove") })
        case "disabled-chip":
            KozmosChip(text: "Vegan", selected: true, disabled: true, onRemove: { events.append("remove") },
                       action: { events.append("Vegan") })
            KozmosChip(text: "Halal", disabled: true, action: { events.append("Halal") })
        case "chip-docs":
            CategoryFilters(category: $category, openNow: $openNow)
        case "pin-traits":
            KozmosLocationPin(label: "Selected static", number: 2, selected: true)
            KozmosLocationPin(label: "Selected disabled", number: 2, selected: true, isDisabled: true, onSelect: {})
            KozmosLocationPin(label: "Selected action", number: 2, selected: true, onSelect: {})
            KozmosLocationPin(label: "Rest action", number: 2, onSelect: {})
            KozmosLocationPin(label: "Rest static", number: 2)
        case "list-full":
            KozmosPOIResultList(items: items([go, .init(action: .details, label: "Details")]),
                               resultCountLabel: "2 results", selectedPoiId: "gate/12",
                               onSelect: select, onAction: action) { Text("No places match.") }
        case "list-short":
            KozmosPOIResultList(items: items([go]), resultCountLabel: "2 results", selectedPoiId: "cafe",
                               onSelect: select, onAction: action)
        case "list-docs":
            ResultsWithActions(items: items([go]), selectedPoiId: "gate/12", onSelect: select, onAction: action)
        case "list-localized":
            KozmosPOIResultList(items: items([.init(action: .navigate, label: "Los", primary: true),
                                             .init(action: .details, label: "Einzelheiten")]),
                               resultCountLabel: "2 Ergebnisse", selectedPoiId: "gate/12",
                               actionsLabel: "Aktionen für dieses Ergebnis", onSelect: select, onAction: action)
        case "list-disabled":
            KozmosPOIResultList(items: items([go, .init(action: .share, label: "Share", disabled: true)]),
                               resultCountLabel: "2 results", selectedPoiId: "cafe", onSelect: select, onAction: action)
        case "list-unavailable":
            KozmosPOIResultList(items: items([go], unavailable: true), resultCountLabel: "2 results",
                               selectedPoiId: "gate/12", onSelect: select, onAction: action)
        case "no-handler":
            KozmosPOIResultList(items: items([go]), resultCountLabel: "2 results", selectedPoiId: "gate/12", onSelect: select)
            KozmosPOIResultCard(poi: cafe,
                               result: .init(poiId: "cafe", resultIndex: 0, selected: true,
                                             actions: [.init(action: .details, label: "Details")]), onSelect: select)
        case "gallery-controlled":
            KozmosPOIMediaGallery(media: photos, label: "Photos", positionLabel: { "Image \($0) of \($1)" },
                                 activeIndex: galleryIndex, onActiveIndexChange: {
                                     events.append("index \($0)")
                                     galleryIndex = $0
                                 })
            Button("Choose first photo") { galleryIndex = 0 }
        case "gallery-refused":
            KozmosPOIMediaGallery(media: photos, label: "Photos", positionLabel: { "Image \($0) of \($1)" },
                                 activeIndex: 0, onActiveIndexChange: { events.append("index \($0)") })
        case "gallery-last", "gallery-replace":
            KozmosPOIMediaGallery(media: photos, label: "Photos", positionLabel: { "Image \($0) of \($1)" },
                                 defaultActiveIndex: 2, onActiveIndexChange: { events.append("index \($0)") })
            if scenario == "gallery-replace" {
                Button("Replace the photos") { replaced = true }
            }
        default:
            Text("Unknown fixture: \(scenario)")
        }
    }
}
