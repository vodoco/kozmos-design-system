import SwiftUI
import PointrKit
import Kozmos
import MapLibre
import os

struct QAConfiguration: Decodable {
    let baseUrl: String
    let clientIdentifier: String
    let licenseKey: String
    let siteId: String
    let buildingId: String

    static func load() throws -> Self {
        guard let url = Bundle.main.url(forResource: "QAConfig", withExtension: "json") else {
            throw ConfigurationError.missing
        }
        return try decode(Data(contentsOf: url))
    }
    static func decode(_ data: Data) throws -> Self {
        let result = try JSONDecoder().decode(Self.self, from: data)
        guard let url = URL(string: result.baseUrl), url.host == "design-qa-v10.pointr.cloud",
              url.scheme == "https", url.user == nil, url.password == nil,
              url.query == nil, url.fragment == nil, url.port == nil,
              ["", "/"].contains(url.path),
              !result.clientIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !result.licenseKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              UUID(uuidString: result.siteId) != nil,
              UUID(uuidString: result.buildingId) != nil else { throw ConfigurationError.invalid }
        return result
    }
    enum ConfigurationError: Error { case missing, invalid }
}

/// The language PointrKit is asked to answer in: the app's, in the
/// `language_region` form the reference says it supports. Left unset, the
/// SDK follows the device's first language — Arabic on the iPhone 17 Pro
/// simulator, which is how every direction of the first live route arrived.
enum SDKLanguage {
    static func preferred(_ locale: Locale = .current) -> String? {
        guard let language = locale.language.languageCode?.identifier else { return nil }
        if let region = locale.region?.identifier { return "\(language)_\(region)" }
        return language
    }
}

/// Owns SDK state at the app boundary. Kozmos never imports PointrKit.
@MainActor
final class SDKSession: NSObject, ObservableObject, PointrStateChangeListener, PTRMapEventsListener, PTRPoiManagerDelegate, PTRDataManagerDelegate, PTRPermissionManagerDelegate {
    @Published private(set) var status = "Connecting to Design-QA…"
    @Published private(set) var failure: String?
    @Published private(set) var widget: PTRMapWidgetViewController?
    @Published private(set) var building: PTRBuilding?
    /// Every assignment keeps the lookup by identifier and the map filter's
    /// places in step.
    @Published private(set) var pois: [PTRPoi] = [] {
        didSet {
            poisById = Dictionary(pois.map { ($0.identifier, $0) }, uniquingKeysWith: { first, _ in first })
            mapFilter.load(pois.map { .init(id: $0.identifier, name: $0.name, freeText: SDKPOIAdapter.freeText($0)) })
        }
    }
    private var poisById: [String: PTRPoi] = [:]
    @Published private(set) var selected: PTRPoi?
    /// The selected place mapped for the card, with the contact addresses the
    /// host keeps and the diagnostics it logs.
    @Published private(set) var selectedDetails: SDKPOIDetails?
    /// What the card shows on a contact action after it was tried.
    @Published private(set) var actionStates: [String: KozmosPOIActionState] = [:]
    /// Which opening of a place's card is showing: a contact action's outcome
    /// is written to the card it was tried on, not to one opened since.
    private(set) var card: SDKCardIdentity?
    private var cardSerial = 0
    @Published private(set) var selectedFloorId = ""
    @Published private(set) var poiDataReady = false
    @Published var query = ""
    /// The tile chosen, the places, the favourites and the bookmarks: what the
    /// results list and the map's filter are both read from.
    @Published private(set) var mapFilter = SDKMapFilter() {
        didSet { if mapFilter.shown != oldValue.shown { showFilteredPlaces() } }
    }
    var saved: Set<String> { mapFilter.saved }
    var favourites: Set<String> { mapFilter.favourites }
    /// The quick-access tile chosen, replacing the search field with its chip
    /// until cleared; nil while browsing or searching by text.
    var category: QuickAccessCategory? { mapFilter.category }
    /// Each taxonomy tile's places in the loaded venue, counted once per
    /// load; nil until the venue's places have arrived. The personal tiles
    /// count live from what this session has marked (`count(of:)`).
    @Published private(set) var tileCounts: [String: Int]?
    private var loggedPlaceCount = -1
    /// The places opened this session, most recent first, at most three: what
    /// the focused, empty field offers, as the prototype's "Recently visited".
    @Published private(set) var recents: [PTRPoi] = []

    // MARK: Routing — the flow lives in SDKRouting.swift; the state lives here.

    enum Phase { case browse, routeSetup, directions }
    @Published var phase: Phase = .browse
    @Published var originQuery = ""
    @Published var origin: PTRPoi?
    @Published var routeStatus: KozmosRouteReadiness = .idle
    @Published var routeMessage: String?
    @Published var route: SDKRoute?
    @Published var stepIndex = 0
    @Published var wayfindingReady = false
    /// The SDK's route behind the directions: the map draws this.
    var sdkRoute: PTRRoute?
    var calculationTask: Task<Void, Never>?

    private var configuration: QAConfiguration?
    let log = Logger(subsystem: "com.kozmos.pointrqa", category: "poi")
    /// What the shell's chrome covers, as it last reported it.
    var chromeInsets = KozmosMapCollisionInsets.zero
    /// Whether the selected place is still framed the way `focusPoi` leaves
    /// it. Moving the map — a pan, a pinch, a rotation, the zoom buttons —
    /// hands the camera to the visitor.
    var framesSelection = false
    private var started = false
    /// When `start()` ran, for the readiness timings in the log.
    var startedAt = Date()
    private var loadingBuilding = false
    /// Whether a building is being loaded: read by the lifecycle tests.
    var isLoadingBuilding: Bool { loadingBuilding }
    private var buildingTask: Task<Void, Never>?
    /// The session the SDK's callbacks belong to: `start()` begins one and
    /// `stop()` ends it.
    nonisolated let generation = SDKSessionGeneration()

    /// Starts the SDK with the QA configuration `loadConfiguration` reads:
    /// the bundled file, or, in the lifecycle tests, one that fails, so they
    /// never reach the SDK.
    func start(loadConfiguration: () throws -> QAConfiguration = QAConfiguration.load) {
        guard !started else { return }
        started = true
        startedAt = Date()
        let token = generation.begin()
        do { configuration = try loadConfiguration() } catch {
            failure = "QA configuration is missing or invalid. Run the local setup script."
            return
        }
        guard let configuration else { return }
        // Browse-only milestone: do not request location/motion permissions.
        Pointr.shared.permissionManager?.delegate = self
        Pointr.shared.addListener(self)
        let params = PTRParams()
        params.baseUrl = configuration.baseUrl
        params.clientIdentifier = configuration.clientIdentifier
        params.licenseKey = configuration.licenseKey
        params.mode = PointrDebugMode()
        params.loggerLevel = .error
        params.preferredLanguage = SDKLanguage.preferred()
        log.notice("SDK asked for language \(params.preferredLanguage ?? "none", privacy: .public); app locale \(Locale.current.identifier, privacy: .public); device languages \(Locale.preferredLanguages.prefix(3).joined(separator: ","), privacy: .public)")
        Pointr.shared.start(with: params) { [weak self] state in
            Task { @MainActor in
                guard self?.generation.current == token else { return }
                self?.handle(state)
            }
        }
    }

    func stop() {
        generation.end()
        buildingTask?.cancel()
        buildingTask = nil
        widget?.removeListener(self)
        Pointr.shared.poiManager?.removeListener(self)
        Pointr.shared.wayfindingManager?.removeListener(self)
        Pointr.shared.dataManager?.removeListener(self)
        Pointr.shared.removeListener(self)
        Pointr.shared.permissionManager?.delegate = nil
        Pointr.shared.stop()
        widget = nil
        building = nil
        selected = nil
        card = nil
        mapFilter.open(nil)
        selectedDetails = nil
        actionStates = [:]
        framesSelection = false
        resetRouting()
        wayfindingReady = false
        pois = []
        poiDataReady = false
        loadingBuilding = false
        started = false
    }

    func retry() { retry(loadConfiguration: QAConfiguration.load) }

    func retry(loadConfiguration: () throws -> QAConfiguration) {
        stop()
        failure = nil
        status = "Connecting to Design-QA…"
        start(loadConfiguration: loadConfiguration)
    }

    /// Queues an SDK callback's work onto the main actor under the session
    /// token current when the SDK called. The work runs only if `generation`
    /// still accepts that token when its turn comes.
    nonisolated func onMain(_ work: @escaping @MainActor (SDKSession) -> Void) {
        let token = generation.current
        Task { @MainActor [weak self] in
            guard let self, self.generation.accepts(token) else { return }
            work(self)
        }
    }

    nonisolated func pointrStateDidChange(to state: PointrState) {
        onMain { $0.handle(state) }
    }

    private func handle(_ state: PointrState) {
        Pointr.shared.permissionManager?.delegate = self
        status = PTRPointrStateToString(state)
        switch state {
        case .running:
            guard !loadingBuilding, widget == nil else { return }
            loadingBuilding = true
            buildingTask = Task { await loadBuilding() }
        case .failedNoInternet: failure = "The SDK could not connect. Check network access."
        case .failedRegistration, .failedValidation: failure = "Design-QA rejected native SDK registration or license validation."
        default: break
        }
    }

    private func loadBuilding() async {
        guard let config = configuration, let manager = Pointr.shared.siteManager else { return }
        let result = await manager.buildings(forSiteId: config.siteId)
        guard !Task.isCancelled else { return }
        guard let target = result.0.first(where: { $0.identifier == config.buildingId }) else {
            failure = "The selected QA building is unavailable to this SDK client."
            loadingBuilding = false
            return
        }
        building = target
        let start = SDKFloorPolicy.startLevel(
            target.levels.map(SDKFloorPolicy.Level.init), sdkDefault: target.defaultLevel.map(SDKFloorPolicy.Level.init))
        selectedFloorId = start?.id ?? ""
        let policy = SDKMapPolicy.make()
        let controller = PTRMapWidgetViewController(location: target.mapWidgetLocation, configuration: policy)
        controller.addListener(self)
        widget = controller
        Pointr.shared.poiManager?.addListener(self)
        Pointr.shared.dataManager?.addListener(self)
        Pointr.shared.wayfindingManager?.addListener(self)
        wayfindingReady = Pointr.shared.wayfindingManager?.isReady(for: target.site) ?? false
        log.notice("wayfinding \(self.wayfindingReady ? "ready" : "not ready", privacy: .public) for \(target.site.name, privacy: .public) when the building loaded, \(self.millisecondsSinceStart, privacy: .public) ms after start")
        Pointr.shared.dataManager?.loadData(forSite: config.siteId)
        refreshPOIs()
        status = "Loading map…"
    }

    var millisecondsSinceStart: Int { Int(Date().timeIntervalSince(startedAt) * 1000) }

    func refreshPOIs() {
        guard let building else { return }
        // The whole site's places — every building and level — not the loaded
        // building's (Olcay, 21st: search and quick access are site-wide);
        // each row and pin says where its place is.
        pois = Pointr.shared.poiManager?.pois(for: building.site)?.getPoiList() ?? []
        poiDataReady = Pointr.shared.dataManager?.isContentReady(forSite: building.site.identifier) ?? false
        countTiles()
    }

    /// The venue's places against every taxonomy tile, in one pass, once the
    /// places have arrived; and, once per load, what the content says about
    /// its places besides their names — the words a companion could filter on.
    private func countTiles() {
        guard !pois.isEmpty else { tileCounts = nil; return }
        let places = mapFilter.places.map { (name: $0.name, freeText: $0.freeText) }
        tileCounts = QuickAccess.counts(of: QuickAccess.categories, places: places)
        guard places.count != loggedPlaceCount else { return }
        loggedPlaceCount = places.count
        let words = Set(places.flatMap(\.freeText).map { $0.lowercased() }).sorted()
        log.notice("QA-DATA \(places.count, privacy: .public) places, \(words.count, privacy: .public) distinct tags and keywords")
        for start in stride(from: 0, to: words.count, by: 40) {
            log.notice("QA-DATA words \(start, privacy: .public): \(words[start..<min(start + 40, words.count)].joined(separator: " | "), privacy: .public)")
        }
    }

    /// A tile's places in the loaded venue, or nil before they are counted.
    func count(of category: QuickAccessCategory) -> Int? {
        switch category.id {
        case QuickAccess.favouritesId, QuickAccess.bookmarksId: return places(in: category).count
        default: return tileCounts?[category.id]
        }
    }

    /// The tiles the sheet shows: every tile until the venue's places are
    /// counted, then those with at least one place — the personal tiles too,
    /// so an empty Favourites or Bookmarks is not offered.
    var visibleTiles: [QuickAccessCategory] {
        guard var counts = tileCounts else { return QuickAccess.tiles }
        for id in [QuickAccess.favouritesId, QuickAccess.bookmarksId] {
            if let tile = QuickAccess.category(id: id) { counts[id] = count(of: tile) ?? 0 }
        }
        return QuickAccess.visibleTiles(counts: counts)
    }

    func select(_ poi: PTRPoi) {
        selected = poi
        cardSerial += 1
        card = SDKCardIdentity(poiId: poi.identifier, serial: cardSerial)
        mapFilter.open(poi.identifier)
        recents = [poi] + recents.filter { $0.identifier != poi.identifier }
        if recents.count > 3 { recents.removeLast(recents.count - 3) }
        let details = SDKPOIAdapter.details(poi)
        selectedDetails = details
        actionStates = [:]
        // What the data did not let the card show, for whoever is testing
        // the venue's content. Place content, never configuration.
        for issue in details.issues { log.notice("\(poi.name, privacy: .public): \(issue, privacy: .public)") }
        resetRouting()
        if let level = poi.position.level { updateLevel(level) }
        widget?.mapViewController.highlightPoi(poi)
        frame(poi)
    }

    /// Bring the camera to a place. Padding first: `focusPoi` centres the
    /// place in whatever viewport the map has when it is called.
    func frame(_ poi: PTRPoi) {
        applyCameraPadding(animated: false)
        framesSelection = true
        widget?.mapViewController.focusPoi(poi, shouldZoom: true)
    }
    func closeSelection() { clearSelection(animated: true) }

    /// A tile: its places by the stand-in word match (`QuickAccess.matches`),
    /// or the personal tiles by what this session has marked.
    func choose(category: QuickAccessCategory) {
        query = ""
        // The prototype fades the map's other pins to 22 %; the SDK offers to
        // show a set of places, so the map shows the category's alone.
        // The map shows the category's places alone, as the SDK's own icon
        // markers — nothing else is touched. A per-place style was tried for
        // a rounder marker and repainted every room's fill black (Olcay,
        // 21st: "no need to alter fill layers"); the SDK draws no view of
        // ours (`PTRMapMarker`), so the markers are the SDK's, in its palette.
        mapFilter.choose(category)
        let shown = places(in: category)
        // The map follows the category: the places are site-wide, so when
        // none is on the level shown, the level of the first — zoomed to it —
        // as opening a place does.
        if !shown.contains(where: { SDKPOIAdapter.floorId($0.position.level) == selectedFloorId }),
           let level = shown.first?.position.level {
            updateLevel(level)
            widget?.mapViewController.showLevel(level, shouldZoomToLevel: true)
        }
    }
    func clearCategory() { mapFilter.clearCategory() }
    func toggleFavourite(_ id: String) { mapFilter.toggleFavourite(id) }
    func toggleSaved(_ id: String) { mapFilter.toggleSaved(id) }

    /// Gives the map the filter's places; nil shows every place.
    private func showFilteredPlaces() {
        widget?.mapViewController.poisToShow = mapFilter.shown.map { ids in Set(ids.compactMap { poisById[$0] }) }
    }

    /// The places a tile shows, on every floor, by name: the filter's, as the
    /// SDK's places.
    func places(in category: QuickAccessCategory) -> [PTRPoi] {
        mapFilter.places(in: category).compactMap { poisById[$0.id] }
    }

    /// The building's levels as the selector lists them (`SDKFloorPolicy`).
    var floors: [KozmosFloorPresentation] {
        SDKFloorPolicy.presentations((building?.levels ?? []).map(SDKFloorPolicy.Level.init))
    }
    func selectFloor(_ id: String) {
        guard let level = building?.levels.first(where: { SDKPOIAdapter.floorId($0) == id }) else { return }
        updateLevel(level)
        // Not animated: the level's own camera move follows immediately.
        clearSelection(animated: false)
        widget?.mapViewController.showLevel(level, shouldZoomToLevel: true)
    }
    /// A contact action from the card. The address was validated when the
    /// place was mapped; the device decides whether it can open it — a
    /// simulator has no phone — and the card is told either way.
    func perform(action: String, poiId: String) {
        guard selected?.identifier == poiId, let card, let contact = selectedDetails?.contacts[action] else { return }
        let url = contact.url
        guard UIApplication.shared.canOpenURL(url) else {
            let what: String
            switch contact {
            case .website: what = "Websites can't be opened on this device."
            case .call: what = "Calling isn't available on this device."
            case .email: what = "Email isn't set up on this device."
            }
            actionStates[action] = .init(message: what, messageTone: .status)
            return
        }
        actionStates[action] = .init(loading: true)
        UIApplication.shared.open(url) { [weak self] opened in
            guard let self else { return }
            self.actionStates = SDKContactOutcome.completing(
                self.actionStates, action: action, opened: opened, triedOn: card, showing: self.card)
        }
    }

    func clearSelection(animated: Bool) {
        selected = nil
        card = nil
        mapFilter.open(nil)
        selectedDetails = nil
        actionStates = [:]
        framesSelection = false
        resetRouting()
        widget?.mapViewController.unhighlightPoi()
        applyCameraPadding(animated: animated)
    }

    /// The shell reports its chrome after every settled layout change: the
    /// sheet, the keyboard, the window.
    ///
    /// A padding change re-centres the map on whatever is at its centre, and
    /// cancels a camera move in flight. Measured: the sheet settling while
    /// `focusPoi` was flying ended the flight at its starting zoom, and the
    /// place was left off-centre. Until the visitor moves the map, a selected
    /// place is focused again in the new viewport instead. The visitor can only
    /// change the zoom by pinching or with the buttons, and either ends the
    /// framing, so focusing with zoom never undoes their zoom.
    func setChromeInsets(_ insets: KozmosMapCollisionInsets) {
        chromeInsets = insets
        guard applyCameraPadding(animated: false) else { return }
        if framesSelection, let selected {
            widget?.mapViewController.focusPoi(selected, shouldZoom: true)
        }
    }
    /// Returns whether the padding changed. The pin's reserve applies to a
    /// framed place, not to a route, which is fitted to the chrome alone.
    @discardableResult
    func applyCameraPadding(animated: Bool) -> Bool {
        guard let map = widget?.mapViewController.mapLibreView else { return false }
        let inset = SDKCameraPadding.contentInset(
            chrome: chromeInsets, mapHeight: map.bounds.height, hasSelection: selected != nil && phase == .browse)
        guard inset != map.contentInset else { return false }
        if animated {
            map.setContentInset(inset, animated: true, completionHandler: nil)
        } else {
            map.contentInset = inset
        }
        return true
    }
    func updateLevel(_ level: PTRLevel) {
        let changedBuilding = building?.identifier != level.building.identifier
        building = level.building
        selectedFloorId = SDKPOIAdapter.floorId(level)
        if changedBuilding { refreshPOIs() }
    }
    func zoom(_ delta: Double) {
        framesSelection = false
        guard let map = widget?.mapViewController else { return }
        map.setZoomLevel(min(map.maximumZoomLevel, max(map.minimumZoomLevel, map.zoomLevel + delta)), animated: true)
    }

    // The visitor moving the map. Measured on Design-QA: a pan reports
    // `mapDidReceivePan`, a pinch `didZoom`, and a `focusPoi` flight neither.
    nonisolated func mapDidReceivePan(_ map: PTRMapViewController) {
        onMain { $0.framesSelection = false }
    }
    nonisolated func map(_ map: PTRMapViewController, didZoom zoomValue: Double) {
        onMain { $0.framesSelection = false }
    }
    nonisolated func mapDidReceiveSignificantRotationGesture(_ map: PTRMapViewController) {
        onMain { $0.framesSelection = false }
    }

    nonisolated func map(_ map: PTRMapViewController, didReceiveTapOnFeature feature: PTRFeature) {
        onMain { session in
            if let poi = feature as? PTRPoi { session.select(poi) }
            else if let poi = session.pois.first(where: { $0.identifier == feature.identifier }) { session.select(poi) }
        }
    }
    nonisolated func map(_ map: PTRMapViewController, didChangeLevel level: PTRLevel) {
        onMain { $0.updateLevel(level) }
    }
    nonisolated func mapDidEndLoading(_ map: PTRMapViewController) {
        onMain { session in
            session.status = "Ready"
            session.refreshPOIs()
        }
    }
    nonisolated func map(_ map: PTRMapViewController, didFailToLoadWith error: Error) {
        onMain { $0.failure = "The map could not load. Check QA availability and try again." }
    }
    @objc(onPoiManagerChangedPoisForSite:)
    nonisolated func onPoiManagerChangedPois(for site: PTRSite) {
        onMain { $0.refreshPOIs() }
    }
    @objc(onDataManagerReadyForSite:)
    nonisolated func onDataManagerReady(for site: PTRSite) {
        onMain { $0.refreshPOIs() }
    }
    nonisolated func permissionManagerShouldRequestLocationAuthorizationPermissionForWhenInUse(_ permissionManager: any PTRPermissionManagerInterface) -> Bool { false }
    nonisolated func permissionManagerShouldRequestLocationAuthorizationPermissionForAlways(_ permissionManager: any PTRPermissionManagerInterface) -> Bool { false }
    nonisolated func permissionManagerShouldRequestCoreMotionAuthorizationPermission(_ permissionManager: any PTRPermissionManagerInterface) -> Bool { false }
    nonisolated func permissionManagerShouldRequestBluetoothServicesPermission(_ permissionManager: any PTRPermissionManagerInterface) -> Bool { false }
    nonisolated func permissionManagerShouldRequestBluetoothAuthorizationPermission(_ permissionManager: any PTRPermissionManagerInterface) -> Bool { false }
}

enum SDKMapPolicy {
    static func make() -> PTRMapWidgetConfiguration {
        let policy = PTRMapWidgetConfiguration.mapOnlyConfiguration()
        // Explicit ownership of every non-map control, even if preset defaults change.
        policy.isSearchEnabled = false
        policy.isPoiDetailViewEnabled = false
        policy.isRouteSummaryEnabled = false
        policy.isWayfindingHeaderViewEnabled = false
        policy.isWayfindingFooterViewEnabled = false
        policy.isLevelSelectorEnabled = false
        policy.isMapTrackingModeButtonEnabled = false
        policy.isExitButtonEnabled = false
        policy.isSplashScreenEnabled = false
        policy.isOnboardingEnabled = false
        policy.isJoystickEnabled = false
        policy.isToastMessagesEnabled = false
        policy.isInfoButtonEnabled = false
        policy.isLocationIndicatorEnabled = false
        policy.isQuickAccessEnabled = false
        policy.isAppBannerEnabled = false
        policy.isMarkMyCarEnabled = false
        policy.isLoadingViewEnabled = false
        policy.shouldFocusOnFirstUserPosition = false
        return policy
    }
}
