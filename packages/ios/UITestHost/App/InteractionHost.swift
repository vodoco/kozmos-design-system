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
    @State private var controlAccessibilityReport = "not inspected"
    @State private var manoeuvreExpanded = true
    @State private var groupedSelection: String?
    @State private var locationQuery = "Lobby"
    @State private var routeLocation: KozmosListboxOption?

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

    // XCUI's `exists` also includes visually present but accessibility-hidden
    // views. Read the public UIKit accessibility tree while XCUI activates it;
    // the test checks the same labels before hiding, while hidden, and restored.
    private func accessibleLabels() -> [String] {
        var seen: Set<ObjectIdentifier> = []
        func visit(_ node: NSObject) -> [String] {
            guard seen.insert(ObjectIdentifier(node)).inserted,
                  !node.accessibilityElementsHidden else { return [] }
            if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
            let labels = node.accessibilityLabel.map { [$0] } ?? []
            let children: [NSObject]
            if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
            else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
                children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
            } else if let view = node as? UIView { children = view.subviews }
            else { children = [] }
            return labels + children.flatMap { visit($0) }
        }
        return UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows).flatMap { visit($0) }
    }

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
        case "navigation-journey":
            NavigationJourneyFixture()
        case "route-setup-ready", "route-setup-pending", "route-setup-unresolved":
            KozmosRouteSetupPanel(ready: scenario != "route-setup-unresolved", pending: scenario == "route-setup-pending",
                title: "Route planen", continueLabel: "Weiter", closeLabel: "Schließen",
                onContinue: { events.append("continue") }, onClose: { events.append("close") }) {
                    Text("Lobby → Gallery")
                }
        case "combobox-location":
            KozmosCombobox(value: Binding(get: { "" }, set: { events.append("select \($0)") }),
                inputValue: $locationQuery,
                options: [.init(value: "lobby", label: "Lobby", description: "North Terminal · Ground floor")],
                label: "From", defaultOpen: true)
        case "route-location", "route-location-loading":
            KozmosRouteLocationField(label: "From", location: routeLocation, query: locationQuery,
                options: [.init(value: "lobby", label: "Lobby", description: "North Terminal · Ground floor")],
                status: scenario == "route-location-loading" ? .loading : .ready,
                clearLabel: "Clear origin", mapLabel: "Choose on map",
                onQueryChange: { locationQuery = $0 },
                onSelect: { routeLocation = $0; events.append("select \($0.value)") },
                onClear: { routeLocation = nil; locationQuery = ""; events.append("clear") },
                onChooseMap: { events.append("map") })
        case "result-group":
            KozmosPOIResultGroup(items: items([go, .init(action: .details, label: "Details")]),
                label: "Coffee branches", onExpandedChange: { events.append("expanded \($0)") },
                selectedPoiId: groupedSelection, numbered: true,
                onSelect: { groupedSelection = $0; select($0) }, onAction: action)
                .accessibilityIdentifier("result-group-container")
        case "map-control-regions", "map-control-regions-localized":
            KozmosAdaptiveMapShell(
                attribution: AnyView(Text("Attribution")),
                controlsLabel: scenario == "map-control-regions-localized" ? "Kartensteuerung" : "Map controls",
                bottomControlsLabel: scenario == "map-control-regions-localized" ? "Weitere Kartensteuerung" : "Map corner controls",
                controlsBottomStart: { Button("Language") { events.append("language") } },
                controlsBottomEnd: { Button("Zoom") { events.append("zoom") } },
                map: { Color.clear }, mapStatusContent: { EmptyView() },
                controls: { Button("Locate") { events.append("locate") } },
                panel: { EmptyView() })
                .frame(height: selected ? 40 : 500)
            Button("Toggle map size") { selected.toggle() }
            Button("Inspect control accessibility") {
                let names = ["Map controls", "Map corner controls", "Locate", "Language", "Zoom"]
                let labels = Set(accessibleLabels()).intersection(names).sorted()
                controlAccessibilityReport = labels.isEmpty ? "no controls" : labels.joined(separator: "|")
            }
            Text(controlAccessibilityReport).accessibilityIdentifier("control-accessibility-report")
        case "map-control-regions-empty":
            KozmosAdaptiveMapShell(map: { Color.clear }, panel: { EmptyView() }).frame(height: 500)
        case "result-action-targets", "result-action-targets-large":
            KozmosPOIResultList(items: items([go, .init(action: .details, label: "Details"),
                .init(action: .order, label: "Order ahead", disabled: true)]),
                resultCountLabel: "2 results", selectedPoiId: "cafe", onSelect: select, onAction: action)
                .environment(\.dynamicTypeSize, scenario == "result-action-targets-large" ? .accessibility3 : .large)
        case "manoeuvre-custom":
            KozmosManoeuvreCard(type: .right, instruction: "Turn right", isExpanded: manoeuvreExpanded,
                                onToggle: { manoeuvreExpanded.toggle(); events.append("toggle") },
                                collapseLabel: "Masquer le trajet", manoeuvreLabel: "Navigation en cours") {
                Text("Continue to the gate")
            }
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

/// Offline composition acceptance; real routing, request cancellation and arrival detection remain in the host adapter.
private struct NavigationJourneyFixture: View {
    @State private var phase = "setup"
    @State private var progress: Double? = nil
    @State private var doneCount = 0
    @State private var expanded = false
    private let origin = KozmosListboxOption(value: "lobby", label: "Lobby", description: "Ground floor")
    private let destination = KozmosListboxOption(value: "gallery", label: "Gallery", description: "Level 2")
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if phase == "setup" || phase == "calculating" {
                    KozmosRouteSetupPanel(ready: true, pending: phase == "calculating", continueLabel: phase == "calculating" ? "Calculating" : "Continue",
                        onContinue: { phase = "calculating" }, onClose: { phase = "setup" }) {
                        KozmosRouteLocationField(label: "From", location: origin, query: "", options: [], disabled: true, onQueryChange: { _ in }, onSelect: { _ in }, onClear: {})
                        KozmosRouteLocationField(label: "To", location: destination, query: "", options: [], disabled: true, onQueryChange: { _ in }, onSelect: { _ in }, onClear: {})
                    }
                    if phase == "calculating" {
                        KozmosButton("Deliver calculated route") { phase = "preview" }
                        KozmosButton("Deliver no route") { phase = "recovery" }
                    }
                } else if phase == "recovery" {
                    KozmosEmptyState(title: "Route unavailable", description: "Choose another starting point. Step-free preference has not changed.")
                    KozmosButton("Back to route setup") { phase = "setup" }
                } else if phase == "preview" {
                    KozmosRoutePreviewPanel(destinationName: destination.label,
                        options: [.init(id: "route-1", label: "Step-free", durationSeconds: 360, durationLabel: "6 min", distanceMetres: 220, distanceLabel: "220 m", preference: .stepFree, selected: true)],
                        status: .ready, backLabel: "Back", continueLabel: "Start navigation", onOptionSelect: { _ in }, onBack: { phase = "setup" }, onContinue: { _ in phase = "navigating" })
                } else if phase == "navigating" {
                    KozmosManoeuvreCard(type: .liftUp, instruction: "Take the elevator to Level 2", isExpanded: expanded, onToggle: { expanded.toggle() }) { Text("Elevator to Level 2") }
                    KozmosRouteProgressRail(progress: progress, type: .liftUp, label: "Journey progress")
                    KozmosButton("Report 100 percent") { progress = 1 }
                    KozmosButton("Confirm arrival") { phase = "arrived" }
                    KozmosButton("End navigation") { phase = "browse" }
                } else if phase == "arrived" {
                    KozmosArrivalPanel(destination: destination.label, locationText: destination.description) {
                        guard phase == "arrived" else { return }; doneCount += 1; phase = "browse"
                    }
                } else {
                    Text("Selected destination: Gallery")
                    Text("Done handled: \(doneCount)")
                }
            }
        }
    }
}
