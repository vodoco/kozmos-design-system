import CoreLocation
import MapLibre
import PointrKit
import Kozmos
import UIKit

/// Routing on the QA host: Go starts wayfinding at once when the visitor has a
/// position, and asks for a starting point first when they do not.
///
/// There is no visitor position in this milestone — location, motion and
/// Bluetooth permissions are declined — so every route starts where the
/// visitor says it does, and "directions" are stepped through by hand. There
/// are no wayfinding modes yet: one calculation, in the SDK's normal mode,
/// and the directions open as soon as it returns. Nothing here is live
/// navigation, and nothing calls itself that. The SDK calculates and draws
/// the route; the host owns the flow and the framing.
extension SDKSession {
    // MARK: - Setup

    /// Go on the card.
    func startRouteSetup() {
        guard selected != nil else { return }
        calculationTask?.cancel()
        originQuery = ""
        origin = nil
        routeStatus = .idle
        routeMessage = nil
        phase = .routeSetup
    }

    /// Where a route can start: this building's places, except the destination.
    var originCandidates: [PTRPoi] {
        let needle = originQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        return pois
            .filter { $0.identifier != selected?.identifier && (needle.isEmpty || $0.name.localizedCaseInsensitiveContains(needle)) }
            .sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    func chooseOrigin(_ id: String) {
        guard let poi = pois.first(where: { $0.identifier == id }), let destination = selected else { return }
        origin = poi
        calculateRoute(from: poi, to: destination)
    }

    func cancelRouteSetup() {
        calculationTask?.cancel()
        phase = .browse
    }

    // MARK: - Calculation

    /// One calculation, in the SDK's normal mode. The SDK calculates
    /// synchronously; a failure keeps the picker, with its reason and — for
    /// data that is a moment late — a retry.
    func calculateRoute(from origin: PTRPoi, to destination: PTRPoi) {
        calculationTask?.cancel()
        routeStatus = .calculating
        routeMessage = nil
        route = nil
        sdkRoute = nil
        calculationTask = Task { @MainActor [weak self] in
            guard let self else { return }
            guard let manager = Pointr.shared.wayfindingManager,
                  let site = destination.position.site ?? building?.site,
                  manager.isReady(for: site) else {
                routeStatus = .error
                routeMessage = "Routing data for this site hasn't finished loading. Try again in a moment."
                return
            }
            let started = Date()
            manager.setCurrentMode(.normal)
            let calculated = manager.calculateRoute(fromPosition: origin, toNearestPositionIn: [destination])
            guard !Task.isCancelled else { return }
            let elapsed = Int(Date().timeIntervalSince(started) * 1000)
            log.notice("route \(origin.name, privacy: .public) → \(destination.name, privacy: .public): \(calculated.map { "\(Int($0.walkingDistance)) m, \(Int($0.travelTime)) s, \($0.directions.count) steps" } ?? "none", privacy: .public); \(elapsed, privacy: .public) ms")
            // Every step, for whoever is checking the venue's routing data.
            for (index, direction) in (calculated?.directions ?? []).enumerated() {
                let accessible = direction.transitionInfo.map { String($0.isAccessible) } ?? "-"
                let transition = direction.transitionInfo.map { "\($0.mainType)/\($0.subType) icon \($0.iconId)" } ?? "-"
                log.debug("step \(index, privacy: .public): type \(direction.messageType.rawValue, privacy: .public) \(direction.message, privacy: .public) · \(Int(direction.distance), privacy: .public) m \(Int(direction.duration), privacy: .public) s · \(direction.position.level?.name ?? "-", privacy: .public) · transition \(direction.isTransition, privacy: .public) \(transition, privacy: .public) accessible \(accessible, privacy: .public)")
            }
            guard let calculated else {
                routeStatus = .noRoute
                routeMessage = "No route was found from here. Choose another starting point."
                return
            }
            sdkRoute = calculated
            route = SDKRoute(calculated)
            routeStatus = .ready
            showDirections()
        }
    }

    /// The not-ready state's recovery: the same request again.
    func retryRouteCalculation() {
        guard let origin, let destination = selected else { return }
        calculateRoute(from: origin, to: destination)
    }

    // MARK: - Directions, stepped by hand

    /// The SDK draws the route; the map follows the first step.
    func showDirections() {
        guard routeStatus == .ready, let map = widget?.mapViewController, let sdkRoute else { return }
        framesSelection = false
        map.currentRoute = sdkRoute
        stepIndex = 0
        phase = .directions
        applyCameraPadding(animated: false)
        showStep()
    }

    func advanceStep() {
        guard let route, stepIndex < route.steps.count - 1 else { return }
        stepIndex += 1
        showStep()
    }

    func rewindStep() {
        guard stepIndex > 0 else { return }
        stepIndex -= 1
        showStep()
    }

    /// The level a step happens on, from the SDK's route.
    func stepFloorLabel(_ index: Int) -> String? {
        let directions = sdkRoute?.directions ?? []
        guard directions.indices.contains(index) else { return nil }
        return directions[index].position.level?.name
    }

    /// The map follows the step: its level, then its position at a reading zoom.
    private func showStep() {
        guard let route, route.steps.indices.contains(stepIndex), let map = widget?.mapViewController else { return }
        let directions = sdkRoute?.directions ?? []
        if directions.indices.contains(stepIndex), let level = directions[stepIndex].position.level,
           SDKPOIAdapter.floorId(level) != selectedFloorId {
            updateLevel(level)
            map.showLevel(level, shouldZoomToLevel: false)
        }
        map.mapLibreView.setCenter(route.steps[stepIndex].coordinate, zoomLevel: 19, animated: true)
    }

    // MARK: - Ending

    /// End route, Finish: the route comes off the map and the card returns,
    /// framed as it was.
    func endRoute() {
        resetRouting()
        phase = .browse
        if let selected { frame(selected) }
    }

    /// Route state to nothing, without touching the selection. Called when
    /// the selection itself changes or closes.
    func resetRouting() {
        calculationTask?.cancel()
        calculationTask = nil
        widget?.mapViewController.currentRoute = nil
        sdkRoute = nil
        route = nil
        routeStatus = .idle
        routeMessage = nil
        stepIndex = 0
        origin = nil
        originQuery = ""
        phase = .browse
    }
}

extension SDKSession: PTRWayfindingManagerDelegate {
    @objc(onWayfindingManagerReadyForSite:)
    nonisolated func onWayfindingManagerReady(for site: PTRSite) {
        onMain { session in
            session.wayfindingReady = true
            session.log.notice("wayfinding ready for \(site.name, privacy: .public), \(session.millisecondsSinceStart, privacy: .public) ms after start")
            if SDKRoutePresenter.retriesOnReadiness(phase: session.phase, status: session.routeStatus) { session.retryRouteCalculation() }
        }
    }
}
