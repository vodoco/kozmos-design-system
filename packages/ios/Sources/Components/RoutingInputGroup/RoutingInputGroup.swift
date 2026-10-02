import SwiftUI

public struct KozmosRoutePoint: Identifiable, Equatable {
    public let id: String
    public let value: String
    public let placeholder: String?
    public let label: String?

    public init(id: String, value: String, placeholder: String? = nil, label: String? = nil) {
        self.id = id
        self.value = value
        self.placeholder = placeholder
        self.label = label
    }
}

public struct KozmosRoutingInputGroup: View {
    @Environment(\.kozmosAnalytics) private var trackEvent

    private let points: [KozmosRoutePoint]
    private let surface: KozmosSurfaceStyle
    private let onPointChange: (String, String) -> Void
    private let onSwap: (() -> Void)?
    private let onAddPoint: (() -> Void)?
    private let onRemovePoint: ((String) -> Void)?
    private let swapLabel: String
    private let addPointLabel: String
    private let removePointLabel: (KozmosRoutePoint) -> String

    /// `surface` is what the group is made of, as React's `surface` prop: `.solid`
    /// (the default) or `.glass`, for a card over the map. Until 2026-09-22
    /// SwiftUI drew it solid only.
    public init(
        points: [KozmosRoutePoint],
        surface: KozmosSurfaceStyle = .solid,
        swapLabel: String = "Swap route points",
        addPointLabel: String = "Add route point",
        removePointLabel: @escaping (KozmosRoutePoint) -> String = { "Remove \($0.label ?? $0.placeholder ?? ($0.value.isEmpty ? "route point" : $0.value))" },
        onPointChange: @escaping (String, String) -> Void,
        onSwap: (() -> Void)? = nil,
        onAddPoint: (() -> Void)? = nil,
        onRemovePoint: ((String) -> Void)? = nil
    ) {
        self.points = points
        self.surface = surface
        self.onPointChange = onPointChange
        self.onSwap = onSwap
        self.onAddPoint = onAddPoint
        self.onRemovePoint = onRemovePoint
        self.swapLabel = swapLabel
        self.addPointLabel = addPointLabel
        self.removePointLabel = removePointLabel
    }

    public var body: some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            routeTimeline

            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                ForEach(Array(points.enumerated()), id: \.element.id) { index, point in
                    HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        KozmosWashedField(
                            text: Binding(
                                get: { point.value },
                                set: { onPointChange(point.id, $0) }
                            ),
                            placeholder: point.placeholder ?? defaultPlaceholder(for: index),
                            label: point.label ?? (index == 0 ? "Origin" : index == points.count - 1 ? "Destination" : "Stop \(index)")
                        )

                        if canRemove(index: index), let onRemovePoint {
                            iconAction(
                                systemName: "xmark",
                                label: removePointLabel(point),
                                filled: false
                            ) {
                                trackEvent(KozmosAnalyticsEvent(eventName: "point_removed", component: "RoutingInputGroup", properties: ["pointId": point.id]))
                                onRemovePoint(point.id)
                            }
                        }
                    }
                }
            }

            // React's action column: with two points the swap sits 24 down,
            // between the fields, in the secondary fill, and the add 20 below
            // it (8 apart and its own 20); with more, the add is at the top.
            // They were 40 circles washed at 5 % in foreground/900 until
            // 2026-09-22, the swap 28 down.
            VStack(spacing: 0) {
                let swaps = points.count == 2 && onSwap != nil
                if swaps, let onSwap {
                    iconAction(systemName: "arrow.up.arrow.down", label: swapLabel, filled: true) {
                        trackEvent(KozmosAnalyticsEvent(eventName: "points_swapped", component: "RoutingInputGroup"))
                        onSwap()
                    }
                    .padding(.top, 24)
                }

                if let onAddPoint {
                    iconAction(systemName: "plus", label: addPointLabel, filled: false) {
                        trackEvent(KozmosAnalyticsEvent(eventName: "point_added", component: "RoutingInputGroup"))
                        onAddPoint()
                    }
                    .padding(.top, points.count == 2 ? (swaps ? 28 : 20) : 0)
                }
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing200)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous))
        // The solid surface React's card sits on by default: the background
        // with the subtle border. It was the background at 90 % under a
        // near-black hairline at 8 % until 2026-09-22.
        .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }

    /// React's rail: 12 down, a 14 ring for each point but the last — the
    /// start's in the accent over a fifth of it, a waypoint's in the muted
    /// foreground — a 2 × 36 connector in the border role between each, and a
    /// 16 pin for the end, 8 apart. It was theme/500, 6 apart, its connectors
    /// foreground/300, until 2026-09-22.
    private var routeTimeline: some View {
        VStack(spacing: 8) {
            ForEach(Array(points.enumerated()), id: \.element.id) { index, _ in
                if index == points.count - 1 {
                    Image(systemName: "mappin")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(KozmosColors.primitivesColorsTheme600)
                        .frame(width: 16, height: 16)
                } else {
                    Circle()
                        .strokeBorder(index == 0 ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground400, lineWidth: 2)
                        .background(
                            Circle()
                                .fill(index == 0 ? KozmosColors.primitivesColorsTheme600.opacity(0.2) : Color.clear)
                        )
                        .frame(width: 14, height: 14)
                    Capsule()
                        .fill(KozmosColors.semanticsBorderSubtle)
                        .frame(width: 2, height: 36)
                }
            }
        }
        .padding(.top, 12)
        .accessibilityHidden(true)
    }

    /// One of the group's 40 icon actions, with the control radius. `filled`
    /// is the swap's secondary fill with the page ink; the others are ghost in
    /// the muted foreground, as React's are.
    private func iconAction(systemName: String, label: String, filled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 13, weight: .semibold))
                .frame(width: 16, height: 16)
                .foregroundColor(filled ? KozmosColors.primitivesColorsForeground0 : KozmosColors.primitivesColorsForeground400)
                .frame(width: 40, height: 40)
                .background(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                        .fill(filled ? KozmosColors.primitivesColorsBackground200 : Color.clear)
                )
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }

    private func defaultPlaceholder(for index: Int) -> String {
        index == 0 ? "Choose Starting Point" : "Choose Destination"
    }

    private func canRemove(index: Int) -> Bool {
        points.count > 2 && index > 0 && index < points.count - 1
    }
}
