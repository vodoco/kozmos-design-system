import SwiftUI
import Kozmos

/// Everything the wayfinding screen shows is derived from this one object.
///
/// Kozmos components report intent and re-render from presentation contracts —
/// they never hold selection themselves — so the whole flow lives here.
@MainActor
final class WayfindingStore: ObservableObject {

    enum Phase {
        case browse
        case results
        case detail
        case routePreview
        case navigating
    }

    let venue: Venue

    @Published private(set) var phase: Phase = .browse {
        didSet {
            refreshRouting()
            revealPanel()
            // A new surface re-frames the map, so a pan the visitor made
            // against the old one should not survive it.
            panOffset = .zero
        }
    }
    @Published var selectedFloorId: String
    @Published var query: String = "" {
        didSet {
            guard query != oldValue else { return }
            if isSearching {
                selectedCategoryId = nil
                showsSavedOnly = false
                if phase == .browse || phase == .results { phase = .results }
            } else if phase == .results, selectedCategoryId == nil {
                phase = .browse
            }
        }
    }
    @Published private(set) var selectedCategoryId: String?
    @Published private(set) var selectedPOIId: String? { didSet { refreshRouting() } }
    @Published private(set) var routeStatus: KozmosRouteReadiness = .idle
    @Published private(set) var selectedRouteOptionId: String = RouteOptionID.quickest {
        didSet { refreshRouting() }
    }
    @Published private(set) var stepIndex: Int = 0
    @Published private(set) var savedPOIIds: Set<String> = []
    @Published private(set) var showsSavedOnly = false
    @Published private(set) var announcement: String = ""
    @Published private(set) var actionMessage: DetailActionMessage?
    @Published private(set) var zoom: CGFloat = 1

    /// How far the visitor has dragged the map away from what it was framing.
    @Published private(set) var panOffset: CGSize = .zero

    /// How much of the screen the sheet is taking. The shell drives this while
    /// the visitor drags the handle; the flow raises it when a new surface
    /// needs reading.
    @Published var panelDetent: KozmosMapPanelDetent = .medium

    /// The route being previewed or walked. Held rather than derived: building
    /// it costs real work, and the map reads it on every frame of a drag.
    @Published private(set) var activeRoute: VenueRoute?
    @Published private(set) var routeOptions: [KozmosRouteOptionPresentation] = []

    /// Walking cost from the entrance to every POI. The origin never moves, so
    /// this is resolved once instead of on every list rebuild.
    private let travelEstimates: [String: TravelEstimate]

    private var calculationTask: Task<Void, Never>?

    struct TravelEstimate {
        let distanceMetres: Double
        let durationSeconds: Double
    }

    enum RouteOptionID {
        static let quickest = "quickest"
        static let stepFree = "step-free"
    }

    /// Feedback from a POI action, shown by the design system beneath the
    /// button that produced it.
    struct DetailActionMessage {
        let action: KozmosPOIAction
        let text: String
    }

    init(venue: Venue = .kozmosHQ) {
        self.venue = venue
        self.selectedFloorId = venue.originFloorId
        self.travelEstimates = Dictionary(
            uniqueKeysWithValues: venue.pois.map { poi in
                let route = VenueRouter.route(
                    in: venue,
                    from: venue.originPosition,
                    onFloor: venue.originFloorId,
                    originLabel: venue.originLabel,
                    to: poi,
                    preference: .quickest
                )
                return (poi.id, TravelEstimate(
                    distanceMetres: route.distanceMetres,
                    durationSeconds: route.durationSeconds
                ))
            }
        )
    }

    // MARK: - Derived venue data

    var floorPresentations: [KozmosFloorPresentation] { venue.floors.map(\.presentation) }

    var currentFloor: VenueFloor? { venue.floor(selectedFloorId) }

    var selectedPOI: VenuePOI? { selectedPOIId.flatMap(venue.poi) }

    var isSearching: Bool { !query.trimmingCharacters(in: .whitespaces).isEmpty }

    /// POIs matching the current filter, ordered by walking time.
    var results: [VenuePOI] {
        let needle = query.trimmingCharacters(in: .whitespaces).lowercased()
        return venue.pois
            .filter { poi in
                guard !showsSavedOnly || savedPOIIds.contains(poi.id) else { return false }
                let matchesCategory = selectedCategoryId.map { $0 == poi.categoryId } ?? true
                guard matchesCategory else { return false }
                guard !needle.isEmpty else { return true }
                return poi.presentation.name.lowercased().contains(needle)
                    || (poi.presentation.categoryLabel?.lowercased().contains(needle) ?? false)
                    || poi.presentation.floorLabel.lowercased().contains(needle)
            }
            .sorted { estimate(for: $0).durationSeconds < estimate(for: $1).durationSeconds }
    }

    var resultItems: [KozmosPOIResultListItem] {
        results.enumerated().map { index, poi in
            let estimate = estimate(for: poi)
            return KozmosPOIResultListItem(
                poi: poi.presentation,
                result: KozmosPOIResultPresentation(
                    poiId: poi.id,
                    resultIndex: index + 1,
                    selected: poi.id == selectedPOIId,
                    featured: poi.featured,
                    floorId: poi.floorId,
                    travelEstimate: KozmosTravelEstimatePresentation(
                        durationSeconds: estimate.durationSeconds,
                        durationLabel: VenueFormat.duration(estimate.durationSeconds),
                        distanceMetres: estimate.distanceMetres,
                        distanceLabel: VenueFormat.distance(estimate.distanceMetres),
                        mode: "walking",
                        modeLabel: "Walking"
                    ),
                    available: poi.presentation.availability != .closed,
                    unavailableReason: poi.presentation.availability == .closed
                        ? poi.presentation.availabilityLabel
                        : nil
                )
            )
        }
    }

    var categoryPresentations: [KozmosCategoryPresentation] {
        venue.categories.map { category in
            let count = venue.pois.filter { $0.categoryId == category.id }.count
            return KozmosCategoryPresentation(
                id: category.id,
                label: category.label,
                iconName: category.iconName,
                selected: category.id == selectedCategoryId,
                disabled: count == 0,
                resultCount: count,
                resultCountLabel: VenueFormat.results(count)
            )
        }
    }

    var resultCountLabel: String { VenueFormat.results(results.count) }

    var resultsTitle: String {
        if showsSavedOnly { return "Saved places" }
        if let id = selectedCategoryId, let category = venue.categories.first(where: { $0.id == id }) {
            return category.label
        }
        return isSearching ? "Results for “\(query)”" : "All places"
    }

    // MARK: - Route

    var routePreference: KozmosRoutePreference {
        selectedRouteOptionId == RouteOptionID.stepFree ? .stepFree : .quickest
    }

    private func route(to destination: VenuePOI, preference: KozmosRoutePreference) -> VenueRoute {
        VenueRouter.route(
            in: venue,
            from: venue.originPosition,
            onFloor: venue.originFloorId,
            originLabel: venue.originLabel,
            to: destination,
            preference: preference
        )
    }

    /// Rebuilds the route and its alternatives after anything that changes
    /// them: the destination, the chosen option, or leaving the routing flow.
    private func refreshRouting() {
        guard let destination = selectedPOI else {
            activeRoute = nil
            routeOptions = []
            return
        }

        routeOptions = [KozmosRoutePreference.quickest, .stepFree].map { preference in
            let route = route(to: destination, preference: preference)
            let id = preference == .stepFree ? RouteOptionID.stepFree : RouteOptionID.quickest
            return KozmosRouteOptionPresentation(
                id: id,
                label: preference == .stepFree ? "Step-free" : "Quickest",
                durationSeconds: route.durationSeconds,
                durationLabel: VenueFormat.duration(route.durationSeconds),
                distanceMetres: route.distanceMetres,
                distanceLabel: VenueFormat.distance(route.distanceMetres),
                preference: preference,
                selected: id == selectedRouteOptionId,
                available: true,
                warning: preference == .quickest && route.floorChanges > 0
                    ? "Uses stairs between floors"
                    : nil
            )
        }

        activeRoute = (phase == .routePreview || phase == .navigating)
            ? route(to: destination, preference: routePreference)
            : nil
    }

    var steps: [RouteStep] { activeRoute?.steps ?? [] }

    var currentStep: RouteStep? {
        guard steps.indices.contains(stepIndex) else { return nil }
        return steps[stepIndex]
    }

    var remainingRoute: (distanceMetres: Double, durationSeconds: Double) {
        let remaining = steps.dropFirst(stepIndex)
        return (
            remaining.compactMap(\.distanceMetres).reduce(0, +),
            remaining.map(\.durationSeconds).reduce(0, +)
        )
    }

    /// Where the visitor is standing right now — the entrance until they start
    /// walking, then the end of the last completed step.
    var userPosition: CGPoint? {
        guard phase == .navigating else {
            return selectedFloorId == venue.originFloorId ? venue.originPosition : nil
        }
        let position = stepIndex == 0
            ? venue.originPosition
            : steps[stepIndex - 1].position
        let floorId = stepIndex == 0 ? venue.originFloorId : steps[stepIndex - 1].floorId
        return floorId == selectedFloorId ? position : nil
    }

    var userHeading: Double {
        guard phase == .navigating, let step = currentStep else { return 0 }
        switch step.type {
        case .left: return -90
        case .right: return 90
        case .turnBack: return 180
        case .straight, .destination, .liftUp, .liftDown, .escalatorUp, .escalatorDown,
             .stairsUp, .stairsDown, .levelUp, .levelDown, .transition:
            return 0
        }
    }

    private func estimate(for poi: VenuePOI) -> TravelEstimate {
        travelEstimates[poi.id] ?? TravelEstimate(distanceMetres: 0, durationSeconds: 0)
    }

    // MARK: - Detail contracts

    var selectedDetails: KozmosPOIDetailsPresentation {
        guard let poi = selectedPOI else { return .init() }
        let travel = estimate(for: poi)
        return .init(travelEstimate: .init(
            durationSeconds: travel.durationSeconds,
            durationLabel: VenueFormat.duration(travel.durationSeconds),
            distanceMetres: travel.distanceMetres,
            distanceLabel: VenueFormat.distance(travel.distanceMetres)
        ))
    }

    var detailActionLabels: [KozmosPOIAction: String] {
        let saved = selectedPOIId.map(savedPOIIds.contains) ?? false
        return [
            .navigate: "Go",
            .favourite: saved ? "Saved" : "Save",
            .share: "Share"
        ]
    }

    var detailActionStates: [KozmosPOIAction: KozmosPOIActionState] {
        guard let poi = selectedPOI else { return [:] }
        let saved = savedPOIIds.contains(poi.id)
        var states: [KozmosPOIAction: KozmosPOIActionState] = [
            .favourite: KozmosPOIActionState(pressed: saved)
        ]
        if let message = actionMessage {
            states[message.action] = KozmosPOIActionState(
                pressed: message.action == .favourite ? saved : false,
                message: message.text
            )
        }
        return states
    }

    var selectedRouteAnnouncement: String? {
        guard routeStatus == .ready,
              let option = routeOptions.first(where: { $0.id == selectedRouteOptionId })
        else { return nil }
        return "\(option.label) route selected. \(option.durationLabel), \(option.distanceLabel)."
    }

    // MARK: - Intents

    func submitSearch() {
        guard isSearching else { return }
        selectedCategoryId = nil
        phase = .results
        announce("\(resultCountLabel) for \(query)")
    }

    func clearSearch() {
        query = ""
        if selectedCategoryId == nil { phase = .browse }
    }

    func selectCategory(_ id: String) {
        selectedCategoryId = id
        showsSavedOnly = false
        query = ""
        phase = .results
        announce("\(resultsTitle), \(resultCountLabel)")
    }

    func backToBrowse() {
        selectedCategoryId = nil
        showsSavedOnly = false
        query = ""
        selectedPOIId = nil
        phase = .browse
    }

    func selectPOI(_ id: String) {
        guard let poi = venue.poi(id) else { return }
        selectedPOIId = id
        selectedFloorId = poi.floorId
        actionMessage = nil
        phase = .detail
        announce("\(poi.presentation.name), \(poi.presentation.locationLabel)")
    }

    func closeDetail() {
        selectedPOIId = nil
        actionMessage = nil
        phase = (selectedCategoryId != nil || isSearching) ? .results : .browse
    }

    func handleDetailAction(_ action: KozmosPOIAction, poiId: String) {
        guard let poi = venue.poi(poiId) else { return }
        switch action {
        case .navigate:
            startRoutePreview()
        case .favourite, .bookmark:
            if savedPOIIds.contains(poiId) {
                savedPOIIds.remove(poiId)
                actionMessage = DetailActionMessage(action: .favourite, text: "Removed \(poi.presentation.name) from saved places.")
            } else {
                savedPOIIds.insert(poiId)
                actionMessage = DetailActionMessage(action: .favourite, text: "Saved \(poi.presentation.name) to your places.")
            }
        case .share:
            actionMessage = DetailActionMessage(action: .share, text: "Share requested for \(poi.presentation.name) (demo only; no link copied).")
        case .order:
            actionMessage = DetailActionMessage(action: .order, text: "Ordering is not available at \(poi.presentation.name).")
        }
    }

    func startRoutePreview() {
        guard let destination = selectedPOI else { return }
        phase = .routePreview
        stepIndex = 0
        selectedFloorId = venue.originFloorId
        routeStatus = .calculating

        calculationTask?.cancel()
        calculationTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 600_000_000)
            guard !Task.isCancelled, let self else { return }
            self.routeStatus = .ready
            self.announce("Route to \(destination.presentation.name) ready")
        }
    }

    func selectRouteOption(_ id: String) {
        selectedRouteOptionId = id
        if let option = routeOptions.first(where: { $0.id == id }) {
            announce("\(option.label) route selected, \(option.durationLabel)")
        }
    }

    func backFromRoutePreview() {
        calculationTask?.cancel()
        routeStatus = .idle
        phase = selectedPOIId == nil ? .browse : .detail
    }

    func beginNavigation() {
        guard routeStatus == .ready, let destination = selectedPOI else { return }
        phase = .navigating
        stepIndex = 0
        selectedFloorId = venue.originFloorId
        announce("Starting route to \(destination.presentation.name). \(steps.first?.instruction ?? "")")
    }

    func advanceStep() {
        guard stepIndex < steps.count - 1 else { return }
        stepIndex += 1
        panOffset = .zero
        if let step = currentStep {
            selectedFloorId = step.floorId
            announce(step.instruction)
        }
    }

    func rewindStep() {
        guard stepIndex > 0 else { return }
        stepIndex -= 1
        panOffset = .zero
        if let step = currentStep {
            selectedFloorId = step.floorId
            announce(step.instruction)
        }
    }

    func endRoute() {
        calculationTask?.cancel()
        routeStatus = .idle
        stepIndex = 0
        selectedFloorId = venue.originFloorId
        phase = selectedPOIId == nil ? .browse : .detail
        announce("Route ended")
    }

    /// The saved filter, labelled with its own count.
    var savedChipLabel: String {
        savedPOIIds.isEmpty ? "Saved" : "Saved · \(savedPOIIds.count)"
    }

    /// Saving a place used to be a dead end — the count was shown and the
    /// places behind it were unreachable. This is the way in, and out.
    func showSaved() {
        guard !savedPOIIds.isEmpty else { return }
        if showsSavedOnly {
            backToBrowse()
            return
        }
        query = ""
        selectedCategoryId = nil
        showsSavedOnly = true
        phase = .results
        announce("Saved places, \(resultCountLabel)")
    }

    // MARK: - Sheet

    /// Search belongs to browsing and results; the other surfaces carry their
    /// own headers.
    var showsSearch: Bool {
        phase == .browse || phase == .results
    }

    /// A new surface has arrived in the sheet, so make sure it can be read
    /// without the visitor having to drag it open first.
    private func revealPanel() {
        guard panelDetent == .collapsed else { return }
        withAnimation(.spring(response: 0.34, dampingFraction: 0.88)) {
            panelDetent = .medium
        }
    }

    /// Typing wants the room a full sheet gives.
    func expandPanel() {
        guard panelDetent != .large else { return }
        withAnimation(.spring(response: 0.34, dampingFraction: 0.88)) {
            panelDetent = .large
        }
    }

    // MARK: - Map controls

    /// Multiplicative, because that is what a pinch reports.
    func zoom(by factor: CGFloat) {
        zoom = min(max(zoom * factor, 0.6), 2.6)
    }

    func pan(by translation: CGSize) {
        panOffset = CGSize(
            width: panOffset.width + translation.width,
            height: panOffset.height + translation.height
        )
    }

    func recentre() {
        zoom = 1
        panOffset = .zero
        selectedFloorId = phase == .navigating
            ? (currentStep?.floorId ?? venue.originFloorId)
            : venue.originFloorId
        announce("Centred on your location, \(venue.originLabel)")
    }

    /// The map is framing the visitor when it is on their floor and has not
    /// been dragged away from them.
    var isTrackingUser: Bool {
        panOffset == .zero && userPosition != nil
    }

    var locationStateLabel: String {
        isTrackingUser ? "Following your location" : "Not centred on you"
    }

    private func announce(_ message: String) {
        announcement = message
    }
}
