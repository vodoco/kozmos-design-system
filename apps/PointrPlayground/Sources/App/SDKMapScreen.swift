import SwiftUI
import UIKit
import PointrKit
import Kozmos

struct SDKMapScreen: View {
    @StateObject private var session = SDKSession()
    /// Where the sheet rests, and where it returns to as places open and
    /// close and routes begin and end (`SDKSheetDetents`). It rests collapsed
    /// on the search row and the first tile row, as the prototype's does; the
    /// field's focus opens it to large.
    @State private var sheet = SDKSheetDetents()
    @FocusState private var searchFocused: Bool
    /// Whether the manoeuvre card over the map is open into the itinerary.
    @State private var itineraryExpanded = false
    @State private var informationOpen = false
    /// The shell docks its panel as a sheet on compact widths and floats it
    /// beside the map on regular ones; the card has to match.
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    /// The places a query names, on every floor.
    private var matches: [PTRPoi] {
        let query = trimmedQuery
        guard !query.isEmpty else { return [] }
        return session.pois.filter { $0.name.localizedCaseInsensitiveContains(query) }
            .sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    var body: some View {
        Group {
            if let widget = session.widget {
                KozmosMapInfo(
                    isOpen: $informationOpen,
                    content: SDKMapInformation.current(venue: session.building?.name),
                    // A full browse sheet owns the compact screen. Do not put
                    // a floating map button over its search/close controls.
                    available: horizontalSizeClass == .regular || sheet.detent != .large,
                    triggerLabel: "Map information"
                ) {
                    KozmosAdaptiveMapShell(
                        mapLabel: "Design-QA indoor map", mapStatus: session.failure != nil ? .error : (session.status == "Ready" ? .ready : .loading),
                        panelLabel: panelLabel, panelPlacement: .start,
                        controlsPlacement: .bottom, panelDetent: $sheet.detent,
                        // Navigating, the sheet also fits its summary; browsing, the
                        // prototype's three stops.
                        panelDetents: session.phase == .directions ? [.collapsed, .content, .medium, .large] : [.collapsed, .medium, .large],
                        // The prototype's sheet is glass; the system's default is solid.
                        panelSurface: .glass,
                        onCollisionInsetsChange: session.setChromeInsets,
                        map: { SDKMapHost(widget: widget) },
                        mapStatusContent: {
                            VStack {
                                Text(session.failure ?? session.status)
                                if session.failure != nil { KozmosButton("Retry", action: session.retry) }
                            }.padding(16)
                        },
                        controls: {
                            // The shell proposes this slot only the height left
                            // between the top bar and the sheet. At a tall detent
                            // the whole cluster no longer fits, and drawn anyway it
                            // overflowed upward over the search bar. Zoom yields to
                            // pinch first; the levels stay while they fit.
                            ViewThatFits(in: .vertical) {
                                controls(widget, zoom: true)
                                controls(widget, zoom: false)
                                // Not `EmptyView`: it adds no child at all, and
                                // with nothing fitting `ViewThatFits` falls back to
                                // its last real child — the levels, over the search.
                                Color.clear.frame(width: 0, height: 0)
                            }
                        },
                        // The shell's top slot spans the map's width; the row and the
                        // card keep a margin from the edges, as the fixture playground does.
                        topBar: {
                            topBar
                                .padding(.trailing, 64) // 48-unit Info control + 16-unit separation.
                                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                        },
                        panel: { panel }
                    )
                }
            } else {
                VStack(spacing: 16) {
                    Text("Kozmos × Pointr QA").font(KozmosTypography.title2)
                    if session.failure == nil { ProgressView() }
                    Text(session.failure ?? session.status).multilineTextAlignment(.center)
                    if session.failure != nil { KozmosButton("Retry", action: session.retry) }
                }.padding(24)
            }
        }
        .task { session.start() }
        // Full-screen Info covers this screen; it is not leaving the SDK host.
        .onDisappear { if !informationOpen { session.stop() } }
        .onChange(of: informationOpen) { if $0 { searchFocused = false } }
        // The selection and the phase as one value: a place tapped on the map
        // mid-route changes both at once, and the sheet takes them together.
        .onChange(of: SDKSheetDetents.Input(selection: session.selected?.identifier, phase: session.phase)) { input in
            if input.phase != sheet.input.phase { itineraryExpanded = false }
            // A place opening drops the field's focus.
            if input.phase == .browse, input.selection != nil, input.selection != sheet.input.selection {
                searchFocused = false
            }
            sheet.update(input)
        }
        // Tapping the field opens the sheet to large, where the results have
        // the height; a drag that lands anywhere else drops the focus.
        .onChange(of: searchFocused) { focused in if focused { sheet.detent = .large } }
        .onChange(of: sheet.detent) { detent in if detent != .large { searchFocused = false } }
    }

    /// Browsing and choosing a starting point, the search bar; navigating, the
    /// current manoeuvre over the map, opening into the whole itinerary — the
    /// prototype's instruction card.
    @ViewBuilder private var topBar: some View {
        if session.phase == .directions, let step = currentStep {
            KozmosManoeuvreCard(
                type: SDKRoutePresenter.directionType(forMessageType: step.messageType, transitionSubType: step.transitionSubType),
                instruction: step.message,
                detail: [SDKRoutePresenter.distanceLabel(for: step), session.stepFloorLabel(step.id)]
                    .compactMap { $0 }.joined(separator: " · "),
                isExpanded: itineraryExpanded,
                onToggle: { withAnimation { itineraryExpanded.toggle() } },
                // The prototype's card and sheet are glass; the system's default is solid.
                surface: .glass
            ) {
                KozmosItinerary(
                    origin: session.origin?.name ?? "",
                    steps: (session.route?.steps ?? []).map { step in
                        KozmosItineraryStep(
                            id: String(step.id), instruction: step.message,
                            type: SDKRoutePresenter.directionType(forMessageType: step.messageType, transitionSubType: step.transitionSubType),
                            isCurrent: step.id == session.stepIndex)
                    },
                    destination: session.selected?.name ?? "")
            }
        }
        // Browsing, the top slot is empty: the search row is the sheet's
        // first row, as the prototype's is.
    }

    private var currentStep: SDKRoute.Step? {
        guard let steps = session.route?.steps, steps.indices.contains(session.stepIndex) else { return nil }
        return steps[session.stepIndex]
    }

    /// `.bottom` gives the slot the full width of the map and leaves the corner
    /// to the caller. Anchored to the trailing edge, where a thumb reaches,
    /// rather than centred over the places the map is showing. Levels sit
    /// outermost, as in the fixture playground.
    private func controls(_ widget: PTRMapWidgetViewController, zoom: Bool) -> some View {
        HStack(alignment: .bottom, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Spacer(minLength: 0)
            if zoom {
                KozmosMapControlsGroup(onZoomIn: { session.zoom(1) }, onZoomOut: { session.zoom(-1) },
                                       onCompassReset: { widget.mapViewController.resetNorth() })
            }
            // The SDK's level switcher (decision 38), top floor first. It
            // marks no level as the visitor's: this host has no visitor
            // position (location, motion and Bluetooth are declined), and the
            // switcher never guesses one.
            KozmosFloorSelector(
                floors: session.floors,
                selectedFloor: .init(get: { session.selectedFloorId }, set: session.selectFloor),
                variant: .collapsible)
        }
    }

    private var panelLabel: String {
        switch session.phase {
        case .browse: return session.selected?.name ?? "QA places"
        case .routeSetup: return "Starting point"
        case .directions: return "Directions"
        }
    }

    @ViewBuilder private var panel: some View {
        switch session.phase {
        case .browse: browsePanel
        case .routeSetup: routeSetupPanel
        case .directions: directionsPanel
        }
    }

    @ViewBuilder private var browsePanel: some View {
        if let poi = session.selected {
            KozmosPOIDetailPanel(
                poi: SDKPOIAdapter.presentation(poi),
                actionLabels: [.navigate: "Go", .favourite: "Favourite", .bookmark: "Save"],
                onAction: { action, id in
                    switch action {
                    case .navigate:
                        session.startRouteSetup()
                    case .favourite:
                        session.toggleFavourite(id)
                    case .bookmark:
                        session.toggleSaved(id)
                    default: break
                    }
                },
                actionStates: [
                    .favourite: .init(pressed: session.favourites.contains(poi.identifier)),
                    .bookmark: .init(pressed: session.saved.contains(poi.identifier))
                ],
                onClose: session.closeSelection,
                // The shell draws the container — background, corners, shadow
                // and grab handle. The card's own bordered card inside it was
                // a second container.
                presentation: horizontalSizeClass == .regular ? .panel : .sheet,
                details: session.selectedDetails?.presentation ?? .init(),
                supplementaryActionStates: session.actionStates,
                onSupplementaryAction: session.perform(action:poiId:))
        } else {
            searchSheet
        }
    }

    // MARK: - The search sheet

    /// The prototype's initial sheet: the search row pinned first, then what
    /// the row's state calls for — the quick-access tiles at rest, the recent
    /// places when the empty field is focused, the results for a query or a
    /// tile. Every part is a Kozmos component; the shell draws the surface.
    @ViewBuilder private var searchSheet: some View {
        VStack(spacing: 0) {
            // Consume the shell's top inset; keep only any remaining top-up
            // and handle clearance, not another size-class-specific margin.
            searchRow
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .modifier(SDKPanelTopPadding())
            // What follows the row crossfades as the row's state changes.
            Group {
                if let category = session.category {
                    resultsList(session.places(in: category), countLabel: "\(session.places(in: category).count) places in \(category.name)")
                        .id("category-\(category.id)")
                } else if !trimmedQuery.isEmpty {
                    resultsList(matches, countLabel: "\(matches.count) places")
                        .id("results")
                } else if searchFocused, !session.recents.isEmpty {
                    recentsList
                        .id("recents")
                } else {
                    tiles
                        .id("tiles")
                }
            }
            .transition(KozmosTransitions.crossfade)
            // The search row is the sheet's top, not what follows it: the
            // shell's inset and the grabber's clearance are for the part at
            // the top, and the tiles would top their 16 up to them and sit 4
            // under the row. Told the panel leaves nothing above them, they
            // keep their 16.
            .environment(\.kozmosPanelInsetTop, 0)
            .environment(\.kozmosPanelClearanceTop, 0)
        }
        .animation(KozmosMotion.standard, value: contentState)
        // One container for the sheet, so its identifier and value are its
        // own and not every child's. The value is for the flow test, which
        // picks its building by its place count: the building the map opens
        // on varies between launches.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("search-sheet")
        .accessibilityValue(session.poiDataReady ? "\(session.pois.count) POIs loaded" : "loading")
    }

    private var trimmedQuery: String { session.query.trimmingCharacters(in: .whitespacesAndNewlines) }

    /// The row's and the content's state as one value, so every change of
    /// form — idle, focused, a query, a category — animates on the same motion.
    private var contentState: String {
        [session.category?.id ?? "-", trimmedQuery.isEmpty ? "empty" : "query", searchFocused ? "focused" : "idle", session.recents.isEmpty ? "-" : "recents"].joined(separator: "/")
    }

    /// The row's three forms: the field with the AI search; focused and
    /// empty, a Cancel beside it; a tile chosen, its chip and count in the
    /// field's place. The prototype's Filters button is not here: Olcay
    /// removed it on the 21st — the AI companion is to take filtering. The
    /// AI search has no flow yet; it is here to be seen where the prototype
    /// puts it.
    @ViewBuilder private var searchRow: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            if let category = session.category {
                // The field's form with a category chosen: the prototype's
                // 48 field in the category's colour, its count inside.
                KozmosCategoryField(
                    label: category.name,
                    count: session.places(in: category).count,
                    countLabel: Self.placesLabel,
                    tint: tint(category),
                    onClear: session.clearCategory
                ) {
                    tileIcon(category, size: 28)
                }
                .accessibilityIdentifier("category-chip")
                .transition(KozmosTransitions.pop)
            } else {
                KozmosSearchBar(text: $session.query, placeholder: "Search", focused: $searchFocused, onClear: { searchFocused = false })
                    .accessibilityIdentifier("search-field")
                    .transition(KozmosTransitions.crossfade)
                if searchFocused, trimmedQuery.isEmpty {
                    KozmosButton("Cancel", variant: .ghost, action: cancelSearch)
                        .accessibilityIdentifier("search-cancel")
                        .transition(KozmosTransitions.reveal)
                }
            }
            KozmosAISearchButton(action: {})
        }
        // Every change of the row's form — the field narrowing for Cancel, the
        // chip taking the field's place — on the standard motion.
        .animation(KozmosMotion.standard, value: contentState)
    }

    private func cancelSearch() {
        searchFocused = false
        session.query = ""
    }

    /// The taxonomy's tiles (the two personal ones first), each with its
    /// count of places at its square's top-right, on the system's grid, in
    /// the sheet: no surface or rule of its own. Until the venue's places are
    /// counted every tile shows without a count; then a tile without a place
    /// leaves, on the standard motion.
    private var tiles: some View {
        KozmosBrowseCategoriesPanel(
            categories: session.visibleTiles.map { category in
                let count = session.count(of: category)
                return KozmosCategoryPresentation(id: category.id, label: category.name, resultCount: count, resultCountLabel: count.map(Self.placesLabel))
            },
            label: "Quick access",
            presentation: .sheet,
            onSelect: { id in
                guard let category = QuickAccess.category(id: id) else { return }
                searchFocused = false
                session.choose(category: category)
            },
            renderIcon: { presentation in
                if let category = QuickAccess.category(id: presentation.id) { tileIcon(category, size: 24) }
            },
            // Each tile in its category's colour, as the chosen category's
            // field and the map's pins wear it (Olcay, 21st).
            tint: { presentation in QuickAccess.category(id: presentation.id).map(tint) },
            emptyState: { Text("No quick access for this venue.") }
        )
        .animation(KozmosMotion.standard, value: session.visibleTiles.map(\.id))
    }

    /// The count's spoken form, on the tiles and the chip alike.
    static func placesLabel(_ count: Int) -> String { count == 1 ? "1 place" : "\(count) places" }

    /// The category's colours: the taxonomy's palette from the system's
    /// category tokens, the theme's for the personal tiles.
    private func tint(_ category: QuickAccessCategory) -> KozmosCategoryTint { category.tint.kozmos }

    /// The taxonomy's published icon, drawn in the theme's colour as the
    /// prototype draws its tiles; the personal tiles use a symbol.
    @ViewBuilder private func tileIcon(_ category: QuickAccessCategory, size: CGFloat) -> some View {
        switch category.icon {
        case .symbol(let name):
            Image(systemName: name).font(.system(size: size * 0.85, weight: .medium))
        case .bundled(let name):
            if let image = UIImage(named: name) {
                Image(uiImage: image).renderingMode(.template).resizable().scaledToFit().frame(width: size, height: size)
            } else {
                Image(systemName: "square.dashed").font(.system(size: size * 0.85))
            }
        }
    }

    private func resultsList(_ places: [PTRPoi], countLabel: String) -> some View {
        KozmosPanelScrollView {
            KozmosPOIResultList(
                items: places.enumerated().map { index, poi in
                    .init(poi: SDKPOIAdapter.presentation(poi),
                          result: .init(poiId: poi.identifier, resultIndex: index, floorId: SDKPOIAdapter.floorId(poi.position.level)))
                },
                resultCountLabel: countLabel,
                // A dot before the floor of a result on the floor the map shows.
                currentFloorId: session.selectedFloorId,
                onSelect: { id in if let poi = session.pois.first(where: { $0.identifier == id }) { session.select(poi) } },
                emptyState: { Text("No places match.") })
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    /// The places opened this session, under the prototype's header and count.
    private var recentsList: some View {
        KozmosPanelScrollView {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    Text("Recently visited").font(KozmosTypography.footnote).fontWeight(.semibold)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                        .accessibilityAddTraits(.isHeader)
                    KozmosCounter("\(session.recents.count)")
                }
                KozmosPOIResultList(
                    items: session.recents.enumerated().map { index, poi in
                        .init(poi: SDKPOIAdapter.presentation(poi),
                              result: .init(poiId: poi.identifier, resultIndex: index, floorId: SDKPOIAdapter.floorId(poi.position.level)))
                    },
                    resultCountLabel: "\(session.recents.count) recent places",
                    label: "Recently visited",
                    currentFloorId: session.selectedFloorId,
                    onSelect: { id in if let poi = session.pois.first(where: { $0.identifier == id }) { session.select(poi) } },
                    emptyState: { EmptyView() })
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
        .scrollDismissesKeyboard(.interactively)
    }
}

/// The two routing surfaces, composed from Kozmos parts as the fixture
/// playground composes them. The host adds only the starting-point picker,
/// which the playground does not need: it has an entrance to start from.
/// There is no preview step: the directions open as soon as a route exists.
extension SDKMapScreen {
    private var originItems: [KozmosPOIResultListItem] {
        session.originCandidates.enumerated().map { index, poi in
            .init(poi: SDKPOIAdapter.presentation(poi),
                  result: .init(poiId: poi.identifier, resultIndex: index, floorId: SDKPOIAdapter.floorId(poi.position.level)))
        }
    }

    var routeSetupPanel: some View {
        VStack(spacing: 0) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosIconButton(iconName: "chevron.backward", variant: .ghost, action: session.cancelRouteSetup)
                    .accessibilityLabel("Back to place details")
                VStack(alignment: .leading, spacing: 2) {
                    Text("Directions").font(KozmosTypography.headline).accessibilityAddTraits(.isHeader)
                    Text("to \(session.selected?.name ?? "")").font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing200)
            .modifier(SDKPanelTopPadding())
            KozmosSearchBar(text: $session.originQuery, placeholder: "Choose a starting point")
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            routeStatusRow
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.top, KozmosDimensions.primitivesLayoutSpacing150)
            // The shell's scroll view: the list scrolls at the largest detent,
            // and an upward drag grows the sheet first.
            KozmosPanelScrollView {
                KozmosPOIResultList(
                    items: originItems,
                    resultCountLabel: "\(session.originCandidates.count) places",
                    label: "Starting points",
                    onSelect: session.chooseOrigin,
                    emptyState: { Text("No places match.") })
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    /// What the calculation is doing, in the picker: the directions open by
    /// themselves once a route exists, so only waiting and failure show here.
    @ViewBuilder private var routeStatusRow: some View {
        switch session.routeStatus {
        case .calculating:
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                KozmosSpinner()
                Text("Working out the way from \(session.origin?.name ?? "there")…").font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .error, .noRoute:
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                Text(session.routeMessage ?? "").font(KozmosTypography.subheadline)
                    .fixedSize(horizontal: false, vertical: true)
                if SDKRoutePresenter.recovery(for: session.routeStatus) == .tryAgain {
                    KozmosButton("Try again", action: session.retryRouteCalculation)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        case .idle, .ready:
            EmptyView()
        }
    }

    /// The prototype's navigation sheet: the destination with End beside it,
    /// what is left and when it ends, the rail; then the step buttons. The
    /// steps themselves are in the card over the map.
    var directionsPanel: some View {
        let route = session.route
        let steps = route?.steps ?? []
        let remaining = route?.remaining(from: session.stepIndex) ?? (distanceMetres: 0, durationSeconds: 0)
        let total = route?.distanceMetres ?? 0
        return VStack(spacing: 0) {
            KozmosRouteSummary(
                destination: session.selected?.name ?? "Directions",
                durationText: RouteFormat.duration(remaining.durationSeconds),
                distanceText: RouteFormat.distance(remaining.distanceMetres),
                arrivalText: "Arrive \(RouteFormat.arrival(in: remaining.durationSeconds))",
                surface: .glass,
                onEndRoute: session.endRoute
            ) {
                KozmosRouteProgressRail(
                    // By ground covered, so a lift or a level change — no
                    // distance — does not move the disc; by step when the
                    // route covers no ground at all.
                    progress: total > 0 ? (total - remaining.distanceMetres) / total
                        : (steps.count > 1 ? Double(session.stepIndex) / Double(steps.count - 1) : 1),
                    type: currentStep.map { SDKRoutePresenter.directionType(forMessageType: $0.messageType, transitionSubType: $0.transitionSubType) } ?? .destination,
                    label: "Step \(session.stepIndex + 1) of \(steps.count)")
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing200)
            .modifier(SDKPanelTopPadding())
            .onChange(of: session.stepIndex) { index in
                // Next and Previous keep VoiceOver's focus on the button; the
                // step that changed under it is announced.
                if steps.indices.contains(index) {
                    let step = steps[index]
                    let parts = ["Step \(index + 1) of \(steps.count).", step.message,
                                 SDKRoutePresenter.distanceLabel(for: step), session.stepFloorLabel(step.id)]
                    UIAccessibility.post(notification: .announcement, argument: parts.compactMap { $0 }.joined(separator: ", "))
                }
            }
            KozmosSeparator()
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosIconButton(iconName: "chevron.backward", variant: .outline, isDisabled: session.stepIndex == 0,
                                 action: session.rewindStep)
                    .accessibilityLabel("Previous step")
                if session.stepIndex >= steps.count - 1 {
                    KozmosButton("Finish", action: session.endRoute).frame(maxWidth: .infinity)
                } else {
                    KozmosButton("Next step", action: session.advanceStep).frame(maxWidth: .infinity)
                }
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
    }
}

/// This host's custom first rows follow the shell's documented inset contract,
/// just like the library's hosted browse/details/route components. Read the
/// environment here, below the shell, rather than in SDKMapScreen above it.
struct SDKPanelTopPadding: ViewModifier {
    @Environment(\.kozmosPanelInsetTop) private var supplied
    @Environment(\.kozmosPanelClearanceTop) private var clearance

    func body(content: Content) -> some View {
        content.padding(.top, max(0, KozmosDimensions.primitivesLayoutSpacing200 - supplied) + clearance)
    }
}

/// Embed the supported map-only widget. Never traverse private UIKit subviews.
struct SDKMapHost: UIViewControllerRepresentable {
    let widget: PTRMapWidgetViewController
    func makeUIViewController(context: Context) -> PTRMapWidgetViewController { widget }
    func updateUIViewController(_ controller: PTRMapWidgetViewController, context: Context) {}
}

extension QuickAccessCategory.Tint {
    /// The category's colours from the system's category tokens — the
    /// taxonomy's own palette, so the tile, the chosen category's field and
    /// the map's markers share it — with the fill's ink chosen for contrast.
    /// The personal tiles wear the theme's, with the themed button's fill.
    var kozmos: KozmosCategoryTint {
        switch self {
        case .theme: return KozmosCategoryTint(accent: KozmosColors.primitivesColorsTheme600, fill: KozmosInkedFill(fill: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, ink: KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle))
        case .yellow: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentYellow, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillYellow, ink: KozmosColors.semanticsCategoryOnfillYellow))
        case .orange: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentOrange, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillOrange, ink: KozmosColors.semanticsCategoryOnfillOrange))
        case .turquoise: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentTurquoise, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillTurquoise, ink: KozmosColors.semanticsCategoryOnfillTurquoise))
        case .red: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentRed, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillRed, ink: KozmosColors.semanticsCategoryOnfillRed))
        case .blue: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentBlue, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillBlue, ink: KozmosColors.semanticsCategoryOnfillBlue))
        case .navy: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentNavy, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillNavy, ink: KozmosColors.semanticsCategoryOnfillNavy))
        case .green: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentGreen, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillGreen, ink: KozmosColors.semanticsCategoryOnfillGreen))
        case .pink: return KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentPink, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillPink, ink: KozmosColors.semanticsCategoryOnfillPink))
        }
    }
}
