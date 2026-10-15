import SwiftUI
import Kozmos

/// The map camera.
///
/// A floor plan is taller than the strip of screen left uncovered by the top
/// bar and the panel, so the plan fills the visible width and pans to keep the
/// point of interest in view — the same thing a real map SDK does with the
/// collision insets the shell hands back.
private struct PlanLayout {
    let scale: CGFloat
    let origin: CGPoint

    init(size: CGSize, insets: KozmosMapCollisionInsets, focus: CGPoint, zoom: CGFloat, pan: CGSize) {
        // Physical edges throughout. The plan is drawn in absolute coordinates,
        // so a leading/trailing inset would put the reserved space on the wrong
        // side of a right-to-left layout.
        let left = CGFloat(insets.left)
        let right = CGFloat(insets.right)
        let top = CGFloat(insets.top)
        let bottom = CGFloat(insets.bottom)

        let visible = CGSize(
            width: max(size.width - left - right, 1),
            height: max(size.height - top - bottom, 1)
        )

        // Frame the whole floor when it fits the band, which is what a venue
        // map should open on. But a band gets short — an expanded sheet leaves
        // barely 90pt — and fitting a plan into that renders it unreadable, so
        // the scale never drops below a fraction of the width and the camera
        // pans instead.
        let fillingWidth = visible.width / PlanSpace.size.width
        let framingBoth = min(fillingWidth, visible.height / PlanSpace.size.height)
        scale = max(framingBoth, fillingWidth * 0.45) * zoom

        let planSize = CGSize(
            width: PlanSpace.size.width * scale,
            height: PlanSpace.size.height * scale
        )
        let centre = CGPoint(
            x: left + visible.width / 2,
            y: top + visible.height / 2
        )

        func axis(
            planLength: CGFloat,
            visibleLength: CGFloat,
            leadingInset: CGFloat,
            centred: CGFloat
        ) -> CGFloat {
            guard planLength > visibleLength else {
                return leadingInset + (visibleLength - planLength) / 2
            }
            let lowerBound = leadingInset + visibleLength - planLength
            return min(leadingInset, max(lowerBound, centred))
        }

        origin = CGPoint(
            x: axis(
                planLength: planSize.width,
                visibleLength: visible.width,
                leadingInset: left,
                centred: centre.x - focus.x * scale + pan.width
            ),
            y: axis(
                planLength: planSize.height,
                visibleLength: visible.height,
                leadingInset: top,
                centred: centre.y - focus.y * scale + pan.height
            )
        )
    }

    func point(_ value: CGPoint) -> CGPoint {
        CGPoint(x: origin.x + value.x * scale, y: origin.y + value.y * scale)
    }

    func rect(_ value: CGRect) -> CGRect {
        CGRect(
            x: origin.x + value.minX * scale,
            y: origin.y + value.minY * scale,
            width: value.width * scale,
            height: value.height * scale
        )
    }

    func length(_ value: CGFloat) -> CGFloat { value * scale }
}

/// The floor plan itself.
///
/// Kozmos ships the map *container* (`KozmosMapView`) and the map *furniture*
/// (`KozmosLocationPin`, `KozmosUserLocationMarker`) but not a renderer, so the
/// plan is drawn here — using only Kozmos colour and radius tokens, the way a
/// real SDK layer would be themed.
struct VenueMapCanvas: View {
    let floor: VenueFloor
    let pois: [VenuePOI]
    let selectedPOIId: String?
    let destinationPOIId: String?
    let highlightedPOIIds: Set<String>
    let routePoints: [CGPoint]
    let userPosition: CGPoint?
    let userHeading: Double
    let zoom: CGFloat
    /// Screen the map keeps clear of the top bar, the controls, and the panel,
    /// in physical edges as the shell reports them.
    let insets: KozmosMapCollisionInsets
    /// The plan point the camera keeps in view.
    let focus: CGPoint
    /// How far the visitor has dragged the map away from that point.
    let pan: CGSize
    let onSelect: (String) -> Void
    /// Committed at the end of a gesture, so the camera is not rewritten on
    /// every frame of one.
    let onZoomBy: (CGFloat) -> Void
    let onPanBy: (CGSize) -> Void

    @GestureState private var pinch: CGFloat = 1
    @GestureState private var drag: CGSize = .zero

    var body: some View {
        GeometryReader { geometry in
            let layout = PlanLayout(
                size: geometry.size,
                insets: insets,
                focus: focus,
                zoom: zoom * pinch,
                pan: CGSize(width: pan.width + drag.width, height: pan.height + drag.height)
            )

            ZStack(alignment: .topLeading) {
                slab(layout)
                corridors(layout)
                rooms(layout)
                core(layout)

                if routePoints.count > 1 {
                    routeLine(layout)
                }

                pins(layout)

                if let userPosition {
                    KozmosUserLocationMarker(heading: userHeading)
                        .position(layout.point(userPosition))
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
            .contentShape(Rectangle())
            // Pinch and drag are how a map is handled; the buttons that used to
            // do this were spending map to say so. A minimum distance keeps a
            // tap on a marker a tap.
            .gesture(
                MagnificationGesture()
                    .updating($pinch) { value, state, _ in state = value }
                    .onEnded { onZoomBy($0) }
            )
            .simultaneousGesture(
                DragGesture(minimumDistance: 8)
                    .updating($drag) { value, state, _ in state = value.translation }
                    .onEnded { onPanBy($0.translation) }
            )
            .animation(.easeInOut(duration: 0.25), value: zoom)
            .animation(.easeInOut(duration: 0.25), value: focus)
            .animation(.easeInOut(duration: 0.3), value: floor.id)
        }
        .background(KozmosColors.primitivesColorsBackground200)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(floor.presentation.label) floor plan")
        // Pinching is not available to everyone, so zoom stays reachable as an
        // action now that it is no longer a button.
        .accessibilityAction(named: "Zoom in") { onZoomBy(1.3) }
        .accessibilityAction(named: "Zoom out") { onZoomBy(1 / 1.3) }
    }

    // MARK: - Plan layers

    private func slab(_ layout: PlanLayout) -> some View {
        let rect = layout.rect(CGRect(x: 2, y: 2, width: 96, height: 166))
        return RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous)
            .fill(KozmosColors.semanticsSurface100)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous)
                    .stroke(KozmosColors.primitivesColorsBackground400, lineWidth: 1)
            )
            .frame(width: rect.width, height: rect.height)
            .position(x: rect.midX, y: rect.midY)
    }

    private func corridors(_ layout: PlanLayout) -> some View {
        ForEach(PlanSpace.corridors.indices, id: \.self) { index in
            let rect = layout.rect(PlanSpace.corridors[index])
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker, style: .continuous)
                .fill(KozmosColors.semanticsSurface0)
                .frame(width: rect.width, height: rect.height)
                .position(x: rect.midX, y: rect.midY)
        }
    }

    private func rooms(_ layout: PlanLayout) -> some View {
        ForEach(floor.rooms) { room in
            let rect = layout.rect(room.rect)
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                .fill(KozmosColors.primitivesColorsBackground0)
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                        .stroke(KozmosColors.primitivesColorsBackground400, lineWidth: 1)
                )
                .overlay(
                    Group {
                        // A wrapped label would run over the marker beneath it,
                        // and below this width it is unreadable anyway.
                        if rect.width >= 56 {
                            KozmosText(room.label, style: .caption2, tone: .muted, lineLimit: 1)
                                .minimumScaleFactor(0.6)
                                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing50)
                                .frame(width: rect.width)
                                .offset(y: -rect.height / 2 + KozmosDimensions.primitivesLayoutSpacing100)
                        }
                    }
                )
                .frame(width: rect.width, height: rect.height)
                .position(x: rect.midX, y: rect.midY)
                .accessibilityHidden(true)
        }
    }

    private func core(_ layout: PlanLayout) -> some View {
        let rect = layout.rect(PlanSpace.coreRect)
        return RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker, style: .continuous)
            .fill(KozmosColors.primitivesColorsTheme100)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker, style: .continuous)
                    .stroke(KozmosColors.primitivesColorsTheme300, lineWidth: 1)
            )
            .overlay(
                KozmosIcon("building-01", size: .sm, color: .primary)
            )
            .frame(width: rect.width, height: rect.height)
            .position(x: rect.midX, y: rect.midY)
            .accessibilityHidden(true)
    }

    private func routeLine(_ layout: PlanLayout) -> some View {
        let path = Path { path in
            let points = routePoints.map(layout.point)
            path.move(to: points[0])
            points.dropFirst().forEach { path.addLine(to: $0) }
        }

        return ZStack {
            path.stroke(
                KozmosColors.primitivesColorsTheme500.opacity(0.18),
                style: StrokeStyle(lineWidth: layout.length(7), lineCap: .round, lineJoin: .round)
            )
            path.stroke(
                KozmosColors.primitivesColorsTheme500,
                style: StrokeStyle(lineWidth: layout.length(2.6), lineCap: .round, lineJoin: .round)
            )
        }
        .accessibilityHidden(true)
    }

    /// Every place on the floor, as the SDK's map marks its results: the
    /// destination is the place on its own (the green pin), the others result
    /// markers, filled when selected. Each marker's anchor, the pointer's tip
    /// or the dot, is at the centre of its frame, so `.position` puts it on
    /// the place.
    private func pins(_ layout: PlanLayout) -> some View {
        let labelled = labelledPins
        return ForEach(pois) { poi in
            KozmosLocationPin(
                label: poi.presentation.name,
                externalLabel: labelled.contains(poi.id) ? poi.presentation.name : nil,
                labelPlacement: poi.position.y > PlanSpace.size.height * 0.75 ? .top : .bottom,
                selected: poi.id == selectedPOIId,
                featured: poi.featured,
                place: poi.id == destinationPOIId,
                isDisabled: poi.presentation.availability == .closed,
                onSelect: { onSelect(poi.id) }
            )
            .position(layout.point(poi.position))
        }
    }

    private var labelledPins: Set<String> {
        var labelled = highlightedPOIIds
        if let selectedPOIId { labelled.insert(selectedPOIId) }
        if let destinationPOIId { labelled.insert(destinationPOIId) }
        return labelled
    }
}
