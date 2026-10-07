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
    @State private var fieldAccessibilityReport = "not inspected"
    @State private var manoeuvreExpanded = true
    @State private var groupedSelection: String?
    @State private var locationQuery = "Lobby"
    @State private var routeLocation: KozmosListboxOption?
    @State private var routeLocationEditing = false
    @State private var pickerExpanded = true

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
        accessibleNodes().compactMap(\.accessibilityLabel)
    }

    /// What VoiceOver can land on that is named `name`, each by its value:
    /// a field says what it holds, a caption nothing.
    private func accessibleValues(named name: String) -> [String] {
        accessibleNodes().filter { $0.isAccessibilityElement && $0.accessibilityLabel == name }
            .map { $0.accessibilityValue ?? "" }
    }

    private func accessibleNodes() -> [NSObject] {
        var seen: Set<ObjectIdentifier> = []
        func visit(_ node: NSObject) -> [NSObject] {
            guard seen.insert(ObjectIdentifier(node)).inserted,
                  !node.accessibilityElementsHidden else { return [] }
            if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
            let labelled = node.accessibilityLabel == nil ? [] : [node]
            let children: [NSObject]
            if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
            else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
                children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
            } else if let view = node as? UIView { children = view.subviews }
            else { children = [] }
            return labelled + children.flatMap { visit($0) }
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
        case "save-location-unsaved", "save-location-saved", "save-location-large-rtl":
            KozmosSaveLocationCard(isSaved: scenario != "save-location-unsaved",
                onSaveToggle: { events.append("toggle") },
                onRouteToLocation: { events.append("route") },
                onEditNote: { events.append("edit") })
                .frame(width: 320)
                .environment(\.layoutDirection, scenario == "save-location-large-rtl" ? .rightToLeft : .leftToRight)
                .environment(\.dynamicTypeSize, scenario == "save-location-large-rtl" ? .accessibility3 : .large)
                .environment(\.kozmosAnalytics, { event in
                    if event.component == "SaveLocationCard" {
                        let saved: String?
                        if case .string(let value)? = event.properties?["isSaved"] { saved = value }
                        else { saved = nil }
                        events.append("\(event.eventName)\(saved.map { " \($0)" } ?? "")")
                    }
                })
        case "legacy-route-active", "legacy-route-preview":
            KozmosRouteSummary(etaText: "4 min", distanceText: "201 m",
                state: scenario == "legacy-route-active" ? .active : .preview,
                onEndRoute: { events.append("end") },
                onStartNavigation: { events.append("start") })
        case "navigation-journey":
            NavigationJourneyFixture()
        case "press-feedback":
            PressFeedbackFixture()
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
        case "combobox-action", "combobox-action-updates-query":
            KozmosCombobox(value: Binding(get: { "kept" }, set: { events.append("value \($0)") }),
                inputValue: Binding(get: { scenario == "combobox-action" ? "unmatched" : locationQuery },
                    set: { locationQuery = $0; events.append("query \($0)") }), options: [], label: "From",
                popupActions: [.init(id: "map", label: "Map") {
                    if scenario == "combobox-action-updates-query" { locationQuery = "Host draft" }
                    events.append("map \(pickerExpanded)")
                }],
                expanded: Binding(get: { pickerExpanded }, set: { pickerExpanded = $0; events.append("open \($0)") }))
        case "combobox-caption":
            KozmosCombobox(inputValue: $locationQuery, options: [], label: "From")
            Button("Inspect field accessibility") {
                let values = accessibleValues(named: "From")
                fieldAccessibilityReport = values.isEmpty ? "none" : values.map { $0.isEmpty ? "caption" : $0 }.joined(separator: "|")
            }
            Text(fieldAccessibilityReport).accessibilityIdentifier("field-accessibility-report")
        case "combobox-action-closed":
            KozmosCombobox(inputValue: $locationQuery, options: [], label: "From",
                popupActions: [.init(id: "map", label: "Map") { events.append("map") }])
        case "picker-action-disabled":
            KozmosListbox(options: [], selectedValues: .constant(["map"]),
                actions: [.init(id: "map", label: "Map", disabled: true) { events.append("map") }], emptyText: "No matches")
        case "picker-long":
            KozmosListbox(options: replaced ? [] : (0..<30).map { .init(value: "\($0)", label: "Place \($0)") },
                actions: [.init(id: "map", label: "Map") { replaced = true; events.append("map") }], emptyText: "No matches")
        case "combobox-locked-readonly", "combobox-locked-disabled":
            KozmosCombobox(options: [.init(value: "lobby", label: "Lobby")], label: "From",
                disabled: scenario == "combobox-locked-disabled", readOnly: scenario == "combobox-locked-readonly",
                popupActions: [.init(id: "map", label: "Map") { events.append("map") }], expanded: .constant(true))
        case "route-current", "route-current-missing", "route-current-disabled", "route-current-blank", "route-current-large-rtl":
            KozmosRouteLocationField(label: "From", location: routeLocation, query: "unmatched", options: [], status: .error,
                currentPosition: scenario == "route-current-missing" ? nil : .init(
                    value: scenario == "route-current-blank" ? " " : "blue-dot", label: "Host position",
                    disabled: scenario == "route-current-disabled"),
                onQueryChange: { events.append("query \($0)") },
                onSelect: { routeLocation = $0; events.append("select \($0.value)") }, onClear: {})
                .frame(width: 320)
                .environment(\.layoutDirection, scenario == "route-current-large-rtl" ? .rightToLeft : .leftToRight)
                .environment(\.dynamicTypeSize, scenario == "route-current-large-rtl" ? .accessibility3 : .large)
        case "route-location-edit", "route-location-edit-rtl", "route-location-edit-large", "route-location-edit-disabled":
            KozmosRouteLocationField(label: "From",
                location: routeLocationEditing ? nil : .init(value: "lobby", label: "Lobby", description: "North Terminal · Ground floor"),
                query: "", options: [], disabled: scenario == "route-location-edit-disabled",
                onQueryChange: { _ in }, onSelect: { _ in events.append("select") }, onClear: { events.append("clear") },
                onEdit: { routeLocationEditing = true; events.append("edit") }, changeLabel: "Ändern",
                onCancelEdit: { routeLocationEditing = false; events.append("cancel") }, cancelEditLabel: "Abbrechen")
                .frame(width: 320)
                .environment(\.layoutDirection, scenario == "route-location-edit-rtl" ? .rightToLeft : .leftToRight)
                .environment(\.dynamicTypeSize, scenario == "route-location-edit-large" ? .accessibility3 : .large)
        case "route-synonym-local", "route-synonym-host", "route-synonym-loading":
            KozmosRouteLocationField(label: "From", location: routeLocation, query: "lift",
                options: [.init(value: "e1", label: "Elevator", description: "Ground floor")],
                status: scenario == "route-synonym-loading" ? .loading : .ready,
                filterMode: scenario == "route-synonym-local" ? .local : .host,
                onQueryChange: { _ in },
                onSelect: { routeLocation = $0; events.append("select \($0.value)") },
                onClear: { routeLocation = nil })
        case "route-location", "route-location-loading":
            KozmosRouteLocationField(label: "From", location: routeLocation, query: locationQuery,
                options: [.init(value: "lobby", label: "Lobby", description: "North Terminal · Ground floor")],
                status: scenario == "route-location-loading" ? .loading : .ready,
                clearLabel: "Clear origin", mapLabel: "Choose on map",
                onQueryChange: { locationQuery = $0 },
                onSelect: { routeLocation = $0; events.append("select \($0.value)") },
                onClear: { routeLocation = nil; locationQuery = ""; events.append("clear") }) { events.append("map") }
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
                controlsBottomStart: { KozmosButton("Language", variant: .ghost) { events.append("language") } },
                controlsBottomEnd: { KozmosButton("Zoom", variant: .ghost) { events.append("zoom") } },
                map: { Color.clear }, mapStatusContent: { EmptyView() },
                controls: { KozmosButton("Locate", variant: .ghost) { events.append("locate") } },
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

/// Real presses, read off the screen. Each part's colour at one point — inside
/// its fill, clear of its words, or on a map control's mark — is read from the
/// window twenty times a second, so what a press draws is told without a hook
/// into the component: the colour at rest, and the one furthest from it while
/// a finger was down. The map controls sit on black, and draw a solid square
/// for a mark, so a part that dims under a press shows it.
private struct PressFeedbackFixture: View {
    private struct Part {
        let id: String
        let view: AnyView
        /// Where to read, from the part's frame.
        let probe: (CGRect) -> CGPoint
    }

    private struct FramesKey: PreferenceKey {
        static var defaultValue: [String: CGRect] = [:]
        static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
            value.merge(nextValue()) { $1 }
        }
    }

    @StateObject private var sampler = PressSampler()

    /// Inside a fill, clear of the words: just in from the leading edge.
    private static let leading: (CGRect) -> CGPoint = { CGPoint(x: $0.minX + 5, y: $0.midY) }
    /// Inside a round fill, clear of its mark: just below the top.
    private static let top: (CGRect) -> CGPoint = { CGPoint(x: $0.midX, y: $0.minY + 5) }
    /// A map control's mark, a solid square at its middle.
    private static let mark: (CGRect) -> CGPoint = { CGPoint(x: $0.midX, y: $0.midY) }

    private var buttons: [[Part]] {
        [
            [Part(id: "themed", view: AnyView(KozmosButton("Themed") {}), probe: Self.leading),
             Part(id: "danger", view: AnyView(KozmosButton("Danger", variant: .destructive) {}), probe: Self.leading)],
            [Part(id: "success", view: AnyView(KozmosButton("Success", emotion: .success) {}), probe: Self.leading),
             Part(id: "neutral", view: AnyView(KozmosButton("Neutral", variant: .secondary) {}), probe: Self.leading)],
            [Part(id: "informative", view: AnyView(KozmosButton("Informative", emotion: .informative) {}), probe: Self.leading),
             Part(id: "alert", view: AnyView(KozmosButton("Alert", emotion: .alert) {}), probe: Self.leading)],
            [Part(id: "icon", view: AnyView(KozmosIconButton(iconName: "plus", variant: .default) {}), probe: Self.top),
             Part(id: "icon-danger", view: AnyView(KozmosIconButton(iconName: "trash", variant: .destructive) {}), probe: Self.top),
             Part(id: "fab", view: AnyView(KozmosFloatingActionButton {}), probe: Self.top)],
        ]
    }

    private var mapControls: [Part] {
        [Part(id: "map-tinted-off", view: AnyView(KozmosMapControlButton(label: "Tinted", systemImage: "square.fill", pressed: false) {}),
              probe: Self.mark),
         Part(id: "map-filled-off", view: AnyView(KozmosMapControlButton(label: "Filled off", systemImage: "square.fill",
                                                                          emphasis: .filled, pressed: false) {}),
              probe: Self.mark),
         Part(id: "map-filled-on", view: AnyView(KozmosMapControlButton(label: "Filled on", systemImage: "square.fill",
                                                                         emphasis: .filled, pressed: true) {}),
              probe: Self.leading)]
    }

    private func placed(_ part: Part) -> some View {
        part.view
            .accessibilityIdentifier("part-\(part.id)")
            .background(GeometryReader { proxy in
                Color.clear.preference(key: FramesKey.self, value: [part.id: proxy.frame(in: .global)])
            })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(buttons.indices, id: \.self) { row in
                HStack(spacing: 8) { ForEach(buttons[row], id: \.id) { placed($0) } }
            }
            HStack(spacing: 24) { ForEach(mapControls, id: \.id) { placed($0) } }
                .padding(16)
                .background(Color.black)
            ForEach(sampler.reports.keys.sorted(), id: \.self) { id in
                Text(sampler.reports[id] ?? "")
                    .font(.system(size: 7))
                    .accessibilityIdentifier("sample-\(id)")
            }
        }
        // Pinned to the leading edge, so the reports' widths never move a part.
        .frame(maxWidth: .infinity, alignment: .leading)
        .preferredColorScheme(.light)
        .onPreferenceChange(FramesKey.self) { frames in
            let probes = (buttons.flatMap { $0 } + mapControls).reduce(into: [String: (CGRect) -> CGPoint]()) { $0[$1.id] = $1.probe }
            sampler.points = frames.reduce(into: [:]) { result, entry in
                if let probe = probes[entry.key] { result[entry.key] = probe(entry.value) }
            }
        }
        .onAppear { sampler.start() }
    }
}

/// Reads one pixel per part from the key window on a timer that runs while a
/// touch is tracked, and reports each part's colour at rest and the one
/// furthest from it, as hex.
@MainActor
private final class PressSampler: ObservableObject {
    typealias RGB = (r: Int, g: Int, b: Int)
    var points: [String: CGPoint] = [:]
    @Published private(set) var reports: [String: String] = [:]
    private var rest: [String: RGB] = [:]
    private var extreme: [String: RGB] = [:]
    private var timer: Timer?

    func start() {
        guard timer == nil else { return }
        let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.sample() }
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    private static func hex(_ c: RGB) -> String { String(format: "#%02X%02X%02X", c.r, c.g, c.b) }
    private static func distance(_ a: RGB, _ b: RGB) -> Int { abs(a.r - b.r) + abs(a.g - b.g) + abs(a.b - b.b) }

    private func sample() {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ ($0 as? UIWindowScene)?.keyWindow }).first else { return }
        for (id, point) in points {
            guard let colour = Self.colour(at: point, in: window) else { continue }
            guard let base = rest[id] else {
                rest[id] = colour
                extreme[id] = colour
                reports[id] = "\(id) rest=\(Self.hex(colour)) press=\(Self.hex(colour))"
                continue
            }
            if Self.distance(colour, base) > Self.distance(extreme[id] ?? base, base) {
                extreme[id] = colour
                reports[id] = "\(id) rest=\(Self.hex(base)) press=\(Self.hex(colour))"
            }
        }
    }

    private static func colour(at point: CGPoint, in window: UIWindow) -> RGB? {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.preferredRange = .standard
        let image = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1), format: format).image { context in
            context.cgContext.translateBy(x: -point.x, y: -point.y)
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: false)
        }
        guard let cgImage = image.cgImage else { return nil }
        var pixel = [UInt8](repeating: 0, count: 4)
        guard let context = CGContext(data: &pixel, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
                                      space: CGColorSpace(name: CGColorSpace.sRGB)!,
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: 1, height: 1))
        return (Int(pixel[0]), Int(pixel[1]), Int(pixel[2]))
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
