import SwiftUI
import Kozmos

struct WayfindingScreen: View {
    @StateObject private var store = WayfindingStore()

    /// What the shell reports its own chrome is covering. The map pads its
    /// camera by this instead of measuring the layout itself.
    @State private var collisionInsets: KozmosMapCollisionInsets = .zero
    /// Whether the manoeuvre card over the map is open into the itinerary.
    @State private var itineraryExpanded = false

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        KozmosAdaptiveMapShell(
            mapLabel: "\(store.venue.name) indoor map",
            mapStatus: .ready,
            panelLabel: panelLabel,
            panelPlacement: .end,
            controlsPlacement: .bottom,
            panelDetent: $store.panelDetent,
            panelDetents: [.collapsed, .medium, .large],
            onCollisionInsetsChange: { collisionInsets = $0 },
            map: { mapLayer },
            mapStatusContent: { EmptyView() },
            controls: { controlsLayer },
            topBar: { topBarLayer },
            panel: { panelLayer }
        )
    }

    private var isRegularWidth: Bool {
        horizontalSizeClass == .regular
    }

    private var panelLabel: String {
        switch store.phase {
        case .browse: return "Browse \(store.venue.name)"
        case .results: return store.resultsTitle
        case .detail: return store.selectedPOI?.presentation.name ?? "Place details"
        case .routePreview: return "Route preview"
        case .navigating: return "Directions"
        }
    }

    // MARK: - Map

    /// The shell's insets are the exact bounds of its chrome; the plan keeps a
    /// little air beyond them.
    private var mapInsets: KozmosMapCollisionInsets {
        let gap = Double(KozmosDimensions.primitivesLayoutSpacing200)
        return KozmosMapCollisionInsets(
            top: collisionInsets.top + gap,
            right: collisionInsets.right + gap,
            bottom: collisionInsets.bottom + gap,
            left: collisionInsets.left + gap
        )
    }



    /// The plan point the camera holds in view: the current manoeuvre while
    /// navigating, otherwise the selected place, otherwise the visitor.
    private var mapFocus: CGPoint {
        if store.phase == .navigating,
           let step = store.currentStep,
           step.floorId == store.selectedFloorId {
            return step.position
        }
        if let poi = store.selectedPOI, poi.floorId == store.selectedFloorId {
            return poi.position
        }
        if let user = store.userPosition {
            return user
        }
        return CGPoint(x: PlanSpace.size.width / 2, y: PlanSpace.size.height / 2)
    }

    private var mapLayer: some View {
        ZStack {
            if let floor = store.currentFloor {
                VenueMapCanvas(
                    floor: floor,
                    pois: store.venue.pois(onFloor: floor.id),
                    selectedPOIId: store.selectedPOIId,
                    destinationPOIId: store.phase == .routePreview || store.phase == .navigating
                        ? store.selectedPOIId
                        : nil,
                    highlightedPOIIds: store.phase == .results
                        ? Set(store.results.map(\.id))
                        : [],
                    routePoints: store.activeRoute?.leg(onFloor: floor.id) ?? [],
                    userPosition: store.userPosition,
                    userHeading: store.userHeading,
                    zoom: store.zoom,
                    insets: mapInsets,
                    focus: mapFocus,
                    pan: store.panOffset,
                    onSelect: { store.selectPOI($0) },
                    onZoomBy: { store.zoom(by: $0) },
                    onPanBy: { store.pan(by: $0) }
                )
                // A floor plan is geography, not text: it must not mirror in a
                // right-to-left layout, or north-east ends up on the wrong side
                // of the building. Pinning the canvas keeps its coordinates
                // physical, which is also what the shell's insets are.
                .environment(\.layoutDirection, .leftToRight)
                // Labels painted into the plan are part of the drawing, like a
                // printed map's. They still scale, but not past the point where
                // a room name no longer fits its room — the pins carry the
                // accessible names, and the rooms themselves are hidden from
                // assistive technology.
                .dynamicTypeSize(...DynamicTypeSize.xxLarge)
            }

            KozmosNavigationAnnouncer(message: store.announcement)
        }
    }

    // MARK: - Controls

    /// Thumb-reachable corners: tracking on the leading side, levels on the
    /// trailing side. No zoom buttons — the map is pinched and dragged, and
    /// zoom stays reachable as an accessibility action on the plan itself.
    private var controlsLayer: some View {
        HStack(alignment: .bottom, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            KozmosMapControlButton(
                label: "Centre on my location",
                systemImage: "location.fill",
                stateLabel: store.locationStateLabel,
                pressed: store.isTrackingUser
            ) {
                store.recentre()
            }

            Spacer(minLength: 0)

            KozmosFloorSelector(
                floors: store.floorPresentations,
                selectedFloor: $store.selectedFloorId,
                variant: .collapsible,
                label: "Floor selector, \(store.venue.buildingLabel)"
            )
        }
    }

    // MARK: - Top bar

    /// While a route is being walked the map carries the manoeuvre banner; the
    /// sheet keeps the arrival time and the way out.
    @ViewBuilder
    private var topBarLayer: some View {
        if store.phase == .navigating, let step = store.currentStep {
            // The current manoeuvre over the map, opening into the whole
            // itinerary — the same composition as the Pointr QA app.
            KozmosManoeuvreCard(
                type: step.type,
                instruction: step.instruction,
                detail: [step.distanceMetres.map(VenueFormat.distance), store.venue.floor(step.floorId)?.presentation.label]
                    .compactMap { $0 }.joined(separator: " · "),
                isExpanded: itineraryExpanded,
                onToggle: { withAnimation { itineraryExpanded.toggle() } },
                surface: .glass
            ) {
                KozmosItinerary(
                    origin: store.venue.originLabel,
                    steps: store.steps.map { step in
                        KozmosItineraryStep(id: String(step.id), instruction: step.instruction, type: step.type,
                                            isCurrent: step.id == store.stepIndex)
                    },
                    destination: store.selectedPOI?.presentation.name ?? "")
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .onChange(of: store.phase) { _ in itineraryExpanded = false }
        }
    }

    // MARK: - Sheet

    private var panelLayer: some View {
        VStack(spacing: 0) {
            sheetHeader
            phaseContent
        }
    }

    /// The row that survives every phase change, so search never moves and the
    /// sheet stays useful when it is collapsed to a peek.
    @ViewBuilder
    private var sheetHeader: some View {
        switch store.phase {
        case .browse, .results:
            KozmosSearchBar(
                text: $store.query,
                placeholder: "Search \(store.venue.name)",
                onClear: { store.clearSearch() }
            )
            .submitLabel(.search)
            .onSubmit { store.submitSearch() }
            // Reaching for the field means reading results, so the sheet opens
            // out of the way of the keyboard.
            .simultaneousGesture(TapGesture().onEnded { store.expandPanel() })
            // No top padding: the shell's handle strip is already exactly one
            // margin deep, so the field sits the same distance from the top of
            // the sheet as it does from its sides.
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing200)

        case .navigating:
            // The prototype's navigation sheet: the destination with End, what
            // is left and when it ends, the rail by ground covered.
            let remaining = store.remainingRoute
            let total = store.activeRoute?.distanceMetres ?? 0
            KozmosRouteSummary(
                destination: store.selectedPOI?.presentation.name ?? "Directions",
                durationText: VenueFormat.duration(remaining.durationSeconds),
                distanceText: VenueFormat.distance(remaining.distanceMetres),
                arrivalText: "Arrive \(VenueFormat.arrival(in: remaining.durationSeconds))",
                surface: .glass,
                onEndRoute: { store.endRoute() }
            ) {
                KozmosRouteProgressRail(
                    progress: total > 0 ? (total - remaining.distanceMetres) / total
                        : (store.steps.count > 1 ? Double(store.stepIndex) / Double(store.steps.count - 1) : 1),
                    type: store.currentStep?.type ?? .destination,
                    label: "Step \(store.stepIndex + 1) of \(store.steps.count)")
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing200)

        case .detail, .routePreview:
            EmptyView()
        }
    }

    @ViewBuilder
    private var phaseContent: some View {
        switch store.phase {
        case .browse:
            browsePanel
        case .results:
            resultsPanel
        case .detail:
            detailPanel
        case .routePreview:
            routePreviewPanel
        case .navigating:
            navigationPanel
        }
    }

    private var browsePanel: some View {
        KozmosBrowseCategoriesPanel(
            categories: store.categoryPresentations,
            label: "Browse \(store.venue.name)",
            onSelect: { store.selectCategory($0) },
            renderIcon: { category in
                KozmosIcon(category.iconName ?? "marker-pin-01", size: .lg, color: .primary)
            },
            search: {
                Stack(alignment: .start, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                    KozmosHeading(store.venue.name, level: .h4)
                    KozmosText(
                        "\(store.venue.buildingLabel) · \(store.venue.pois.count) places",
                        style: .subheadline,
                        tone: .muted
                    )
                    // Wrap rather than truncate when the chip beside it claims
                    // the width at large type sizes.
                    .fixedSize(horizontal: false, vertical: true)
                }
            },
            actions: {
                // A badge here only counted; there was no way to reach the
                // places it counted. A chip is the design system's filter.
                KozmosChip(
                    text: store.savedChipLabel,
                    variant: .brand,
                    selected: store.showsSavedOnly,
                    disabled: store.savedPOIIds.isEmpty,
                    action: { store.showSaved() }
                )
            },
            emptyState: {
                KozmosEmptyState(
                    title: "Nothing to browse",
                    description: "This venue has no published categories yet."
                )
            }
        )
    }

    private var resultsPanel: some View {
        VStack(spacing: 0) {
            PanelHeader(
                title: store.resultsTitle,
                subtitle: store.resultCountLabel,
                onBack: { store.backToBrowse() },
                backLabel: "Back to categories"
            )

            KozmosSeparator()

            ScrollView {
                KozmosPOIResultList(
                    items: store.resultItems,
                    resultCountLabel: store.resultCountLabel,
                    label: store.resultsTitle,
                    selectedPoiId: store.selectedPOIId,
                    featuredLabel: "Featured",
                    onSelect: { store.selectPOI($0) },
                    emptyState: {
                        KozmosEmptyState(
                            title: "No places found",
                            description: "Try a different name, or browse by category."
                        )
                    }
                )
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
            }
            // Scrolling the results is how you get the keyboard out of the way.
            .scrollDismissesKeyboard(.interactively)
        }
    }

    @ViewBuilder
    private var detailPanel: some View {
        if let poi = store.selectedPOI {
            KozmosPOIDetailPanel(
                poi: poi.presentation,
                actionLabels: store.detailActionLabels,
                onAction: { action, poiId in store.handleDetailAction(action, poiId: poiId) },
                actionStates: store.detailActionStates,
                onClose: { store.closeDetail() },
                closeLabel: "Close place details",
                accessRestrictionsHeading: "Access",
                servicesHeading: "What's here",
                // Docked to the sheet's edge on a phone, floating beside the
                // map on a wide layout.
                presentation: isRegularWidth ? .panel : .sheet,
                titleLevel: .h2,
                details: store.selectedDetails
            )
        }
    }

    @ViewBuilder
    private var routePreviewPanel: some View {
        if let poi = store.selectedPOI {
            KozmosRoutePreviewPanel(
                destinationName: poi.presentation.name,
                options: store.routeOptions,
                status: store.routeStatus,
                backLabel: "Back to place details",
                continueLabel: "Start navigation",
                destinationLabel: "To",
                optionsLabel: "Route options",
                optionsCountLabel: "\(store.routeOptions.count) routes from \(store.venue.originLabel)",
                selectedRouteAnnouncement: store.selectedRouteAnnouncement,
                onOptionSelect: { store.selectRouteOption($0) },
                onBack: { store.backFromRoutePreview() },
                onContinue: { _ in store.beginNavigation() },
                statusContent: {
                    VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        KozmosSpinner()
                        KozmosText(
                            "Working out the best way there…",
                            style: .subheadline,
                            tone: .muted
                        )
                    }
                }
            )
        }
    }

    /// The steps themselves are in the card over the map; the sheet keeps the
    /// summary above and the buttons that move between them.
    private var navigationPanel: some View {
        VStack(spacing: 0) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosIconButton(
                    iconName: "chevron.backward",
                    variant: .outline,
                    isDisabled: store.stepIndex == 0,
                    action: { store.rewindStep() }
                )
                .accessibilityLabel("Previous step")

                if store.stepIndex >= store.steps.count - 1 {
                    KozmosButton("Finish", action: { store.endRoute() })
                        .frame(maxWidth: .infinity)
                } else {
                    KozmosButton("Next step", action: { store.advanceStep() })
                        .frame(maxWidth: .infinity)
                }
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
    }
}

/// The header the app's own panels share: a back affordance, a title, and a
/// supporting line.
private struct PanelHeader: View {
    let title: String
    let subtitle: String
    let onBack: (() -> Void)?
    let backLabel: String

    var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            if let onBack {
                KozmosIconButton(iconName: "chevron.backward", variant: .ghost, action: onBack)
                    .accessibilityLabel(backLabel)
            }

            Stack(alignment: .start, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                KozmosText(title, style: .headline, lineLimit: 1)
                    .accessibilityAddTraits(.isHeader)

                KozmosText(subtitle, style: .subheadline, tone: .muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing200)
    }
}
