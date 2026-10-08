import SwiftUI

/// A host-owned transition positioned on the same basis as route progress.
public struct KozmosRouteProgressWaypoint: Identifiable, Hashable, Sendable {
    public let id: String
    public let position: Double
    public let type: DirectionType
    public let label: String
    public init(id: String, position: Double, type: DirectionType, label: String) {
        self.id = id; self.position = position; self.type = type; self.label = label
    }
}

/// How far along the route the visitor is, as a rail: a dot where it starts,
/// a disc carrying the current manoeuvre's arrow that travels the track, a dot
/// where it ends. Mirrors the product prototype's rail — 10-point dots, a
/// 34-point theme disc, a 6-point track.
///
/// VoiceOver hears the label the caller gives ("Step 2 of 4") and the
/// progress as a percentage; the rail updates as the route is walked.
public struct KozmosRouteProgressRail: View {
    let progress: Double?
    let type: DirectionType
    let label: String
    let valueText: String?
    let waypoints: [KozmosRouteProgressWaypoint]
    let showCompletedTrack: Bool
    let activeLeg: KozmosProgressRange?
    let activeWaypointId: String?
    let appearance: KozmosProgressTrackAppearance
    let positionMode: KozmosProgressPositionMode
    let motion: KozmosProgressMotion
    @Environment(\.locale) private var locale

    public init(progress: Double?, type: DirectionType, label: String, valueText: String? = nil,
                waypoints: [KozmosRouteProgressWaypoint] = [], showCompletedTrack: Bool = false,
                activeLeg: KozmosProgressRange? = nil, appearance: KozmosProgressTrackAppearance = .theme,
                activeWaypointId: String? = nil, positionMode: KozmosProgressPositionMode = .live,
                motion: KozmosProgressMotion = .none) {
        self.progress = progress
        self.type = type
        self.label = label
        self.valueText = valueText
        self.waypoints = waypoints
        self.showCompletedTrack = showCompletedTrack
        self.activeLeg = activeLeg
        self.activeWaypointId = activeWaypointId
        self.appearance = appearance
        self.positionMode = positionMode
        self.motion = motion
    }

    static let dot: CGFloat = 10
    static let disc: CGFloat = 34
    static let track: CGFloat = 6

    static func validWaypoints(_ points: [KozmosRouteProgressWaypoint]) -> [KozmosRouteProgressWaypoint] {
        let counts = Dictionary(grouping: points, by: \.id).mapValues(\.count)
        return points.enumerated().filter { _, p in
            !p.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            !p.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && counts[p.id] == 1 &&
            p.position.isFinite && p.position >= 0 && p.position <= 1
        }.sorted { a, b in a.element.position == b.element.position ? a.offset < b.offset : a.element.position < b.element.position }
            .map(\.element)
    }

    static func visibleWaypoints(_ points: [KozmosRouteProgressWaypoint], width: CGFloat, progress: Double?) -> [KozmosRouteProgressWaypoint] {
        guard width >= 54 else { return [] }
        let travel = width - 54
        var last = -CGFloat.infinity
        return validWaypoints(points).filter { point in
            let x = 27 + travel * point.position
            if let progress, abs(27 + travel * progress - x) < 33 { return false }
            if x - last < 28 { return false }
            last = x
            return true
        }
    }

    static func visibleRouteWaypoints(_ points: [KozmosRouteProgressWaypoint], width: CGFloat, activeEnd: Double?, activeWaypointId: String? = nil) -> [KozmosRouteProgressWaypoint] {
        guard width >= 24 else { return [] }
        let ordered = validWaypoints(points)
        let selectedEnd = ordered.first { $0.position == activeEnd && $0.id == activeWaypointId }
        let priority = (selectedEnd.map { [$0] } ?? []) + ordered.filter { $0.position == activeEnd && $0.id != selectedEnd?.id } + ordered.filter { $0.position != activeEnd }
        var selected: [KozmosRouteProgressWaypoint] = []
        for point in priority where selected.allSatisfy({ abs($0.position - point.position) * max(0, width - 24) >= 28 }) { selected.append(point) }
        return selected.sorted { $0.position < $1.position }
    }

    /// Where the disc's leading edge sits for a progress, in a rail `width`
    /// wide: from just after the start dot to just before the end dot.
    static func discLeading(progress: Double, width: CGFloat) -> CGFloat {
        let clamped = CGFloat(normalizedProgress(progress))
        let inset = min(dot, max(width, 0) * 0.2)
        let diameter = min(disc, max(width, 0) * 0.6)
        let travel = max(width - inset * 2 - diameter, 0)
        return inset + travel * clamped
    }

    static func normalizedProgress(_ progress: Double) -> Double {
        progress.isFinite ? min(max(progress, 0), 1) : 0
    }

    private var clamped: Double { Self.normalizedProgress(progress ?? 0) }
    private var knownPosition: Double? { activeLeg == nil ? (progress == nil ? nil : clamped) : positionMode == .static ? nil : activeLeg?.position(progress) }

    public var body: some View {
        Group {
        if let activeLeg {
            KozmosRouteTrack(activeLeg: activeLeg, progress: knownPosition, appearance: appearance, waypoints: waypoints, activeWaypointId: activeWaypointId, positionMode: positionMode, motion: motion)
        } else {
        GeometryReader { geometry in
            let width = geometry.size.width
            let dot = min(Self.dot, max(width, 0) * 0.2)
            let disc = min(Self.disc, max(width, 0) * 0.6)
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(KozmosColors.primitivesColorsBackground300)
                    .frame(width: max(width - dot * 2, 0), height: Self.track)
                    .offset(x: dot)
                // The travelled part, its start dot and the disc are theme
                // 600, as Progress and React's are (decision 59); the disc's
                // glyph stays background/0, the ink 600 takes.
                if showCompletedTrack && progress != nil && clamped > 0 {
                    Capsule().fill(KozmosColors.primitivesColorsTheme600)
                        .frame(width: disc / 2 + max(width - dot * 2 - disc, 0) * clamped, height: Self.track)
                        .offset(x: dot)
                }
                Circle()
                    .fill(progress == nil ? KozmosColors.primitivesColorsBackground300 : KozmosColors.primitivesColorsTheme600)
                    .frame(width: dot, height: dot)
                Circle()
                    .fill(KozmosColors.primitivesColorsBackground300)
                    .frame(width: dot, height: dot)
                    .offset(x: max(width - dot, 0))
                ForEach(Self.visibleWaypoints(waypoints, width: width, progress: progress == nil ? nil : clamped)) { point in
                    Circle().fill(KozmosColors.primitivesColorsBackground300)
                        .overlay(Circle().stroke(KozmosColors.primitivesColorsBackground400, lineWidth: 1))
                        .frame(width: 24, height: 24)
                        .overlay(KozmosDirectionGlyph(type: point.type, size: 14)
                            .foregroundColor(KozmosColors.primitivesColorsForeground100))
                        .offset(x: 15 + max(width - 54, 0) * point.position)
                }
                if progress != nil { Circle()
                    .fill(KozmosColors.primitivesColorsTheme600)
                    .frame(width: disc, height: disc)
                    .overlay(
                        KozmosDirectionGlyph(type: type, size: min(15, disc * 0.47))
                            .foregroundColor(KozmosColors.primitivesColorsBackground0)
                    )
                    .offset(x: Self.discLeading(progress: clamped, width: width))
                }
            }
            // Leading, not centred: the stack is only as wide as its widest
            // child, the track, and centring it would shift the rail by a dot.
            .frame(width: width, height: Self.disc, alignment: .leading)
        }
        .frame(height: Self.disc)
        }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(([label] + Self.validWaypoints(waypoints).map(\.label)).joined(separator: "; "))
        .accessibilityValue(valueText ?? (knownPosition.map { $0.formatted(.percent.precision(.fractionLength(0)).locale(locale)) } ?? ""))
        .accessibilityAddTraits(activeLeg != nil && positionMode == .static ? [] : .updatesFrequently)
    }
}

/// SDK placement only. Core owns the track; shared UserLocationMarker owns the dot.
private struct KozmosRouteTrack: View {
    let activeLeg: KozmosProgressRange
    let progress: Double?
    let appearance: KozmosProgressTrackAppearance
    let waypoints: [KozmosRouteProgressWaypoint]
    let activeWaypointId: String?
    let positionMode: KozmosProgressPositionMode
    let motion: KozmosProgressMotion
    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let inset = min(12, width / 2)
            let travel = max(0, width - inset * 2)
            // Leading-based: SwiftUI mirrors `.position` in right-to-left itself.
            // Only the track's own path, which nothing mirrors, flips by hand.
            let x: (Double) -> CGFloat = { inset + travel * $0 }
            ZStack(alignment: .topLeading) {
                KozmosProgressTrack(activeRange: activeLeg, value: progress, appearance: appearance, positionMode: positionMode, motion: motion)
                    .frame(width: travel).position(x: width / 2, y: 38)
                ForEach([0.0, 1.0], id: \.self) { position in
                    Circle().fill(KozmosColors.primitivesColorsBackground500).frame(width: 10, height: 10)
                        .position(x: x(position), y: 38)
                }
                ForEach(KozmosRouteProgressRail.visibleRouteWaypoints(waypoints, width: width, activeEnd: activeLeg.isValid ? activeLeg.end : nil, activeWaypointId: activeWaypointId)) { point in
                    Rectangle().fill(KozmosColors.primitivesColorsBackground500).frame(width: 1, height: 11).position(x: x(point.position), y: 29.5)
                    Circle().fill(KozmosColors.primitivesColorsBackground0)
                        .overlay(Circle().strokeBorder(KozmosColors.primitivesColorsBackground400, lineWidth: 1))
                        .overlay(KozmosDirectionGlyph(type: point.type, size: 16).foregroundColor(KozmosColors.primitivesColorsForeground100))
                        .frame(width: 24, height: 24).position(x: x(point.position), y: 12)
                }
                if let progress {
                    KozmosUserLocationMarker(compact: true).position(x: x(progress), y: 38)
                }
            }
        }.frame(height: 48).accessibilityHidden(true)
    }
}
