import SwiftUI

/// Where the marker's `externalLabel` sits relative to the marker.
public enum KozmosLocationPinLabelPlacement: String, CaseIterable, Sendable {
    case top
    case right
    case bottom
    case left
}

/// A map marker for a result or a place: the SDK's map result markers
/// (decisions 79–81, GAP-120).
///
/// It draws one of three markers:
///
/// - **Result**, the default: a 32pt pill, at least 32 wide, with the result's
///   `number` 8 in from each side, or an 8pt dot with no number, and a 12 × 7
///   pointer whose tip is 6 below the pill. At rest it is background/0 inside
///   a theme-600 border with the number in theme 600; `selected` fills it with
///   theme 600 and draws the number in foreground/1000. It fills; it does not
///   grow.
/// - **Featured** (`featured`): the place's logo, `markerContent`, scaled to
///   fit inside a 44pt tile (52 selected) with a 3pt foreground/0 rim, over a
///   6pt dot 4 below. No number, no accent colour; with no logo the tile is
///   empty.
/// - **Place** (`place`): a place on its own, its details open — a 40pt green
///   teardrop (emotional success 800) with a background/0 disc, over a 6pt dot
///   6 below. It is the only marker shown, and it wins over `featured` and
///   `number`; `selected` changes nothing.
///
/// Each casts the md shadow (`semanticsElevationFloating`) from its body —
/// the pill and its pointer, the tile, the teardrop — and never from its dot.
///
/// **Production markers come from the map style.** In a product the map
/// draws these markers itself, from the map style's sprite sheet, and a
/// featured tile with its logo from a featured sprite Pointr's back end
/// generates. Kozmos draws the same markers for prototypes and boards.
///
/// **Placing it.** The marker's anchor, the point it marks, is the pointer's
/// tip on a result and the dot's centre on a featured tile or a place. The
/// marker lays itself out with that anchor at the centre of its frame
/// (`KozmosLocationPin.anchor`), so `.position(point)` in a map canvas puts
/// the anchor on the point, and an annotation view that centres its content
/// on a coordinate needs no offset. The frame is therefore taller than what is
/// drawn: the space below the anchor balances the body above it.
/// `externalLabel` is drawn outside the frame and never moves the anchor.
///
/// **Naming it.** `label` is the marker's whole spoken name, as the product
/// writes it, its number included ("Result 3, Burger King"), and is never
/// drawn. Kozmos adds nothing to it but `featuredLabel` on a featured tile.
/// The words drawn beside the marker are `externalLabel`, at
/// `labelPlacement`.
///
/// **Pressing it.** It is a button when it can be pressed — with `onSelect`
/// or `onOpen`, and not disabled — and an image otherwise. Its target is at
/// least 44pt square, centred on the body. A tap selects (`onSelect`). With
/// `onOpen`, a second tap within the double-tap time opens the place's
/// details instead of selecting again (decision 71), as a result card's does
/// (`KozmosDoubleTapGate`), and VoiceOver offers an action named `openLabel`
/// that opens them; VoiceOver's own double tap is one activation, which
/// selects. A disabled marker is drawn at half and takes no touch.
public struct KozmosLocationPin: View {
    /// The point of the marker's frame that its anchor — the pointer's tip,
    /// or the dot's centre — sits on: the centre. `.position(point)` puts the
    /// anchor on `point`.
    public static let anchor: UnitPoint = .center

    private let label: String?
    private let number: Int?
    private let externalLabel: String?
    private let labelPlacement: KozmosLocationPinLabelPlacement
    private let selected: Bool
    private let featured: Bool
    private let place: Bool
    private let isDisabled: Bool
    private let onSelect: (() -> Void)?
    /// Said after the label on a featured tile (decision 67). Pass it
    /// translated.
    private let featuredLabel: String
    /// The featured tile's logo (decision 68), normally a resizable image. It
    /// is scaled to fit inside the rim, never cropped, and clipped to the
    /// rim's inner corners. A word or a template image takes foreground/0.
    /// Ignored on a result and a place.
    private let markerContent: AnyView?
    /// Opens the place's details: the second of two quick taps on the marker
    /// (decision 71), and VoiceOver's `openLabel` action.
    let onOpen: (() -> Void)?
    /// What VoiceOver calls the action that opens the place's details, as the
    /// result card calls its own.
    let openLabel: String
    /// Tells the second of two quick taps from a new one.
    @State private var doubleTap = KozmosDoubleTapGate()

    /// - Parameters:
    ///   - label: What VoiceOver calls the marker: its whole name, as the
    ///     product writes it, number included ("Result 3, Burger King").
    ///     Never drawn.
    ///   - number: The result's number, as its card's number tab shows it.
    ///     Without one a result draws a dot. Not spoken: put it in `label`.
    ///   - externalLabel: Words drawn beside the marker, at `labelPlacement`,
    ///     4pt from it. Not spoken: `label` names the marker.
    ///   - selected: Fills a result and grows a featured tile to 52.
    ///   - featured: Draws the featured tile, with `markerContent` as its logo.
    ///   - place: Draws the place's green pin, over `featured` and `number`.
    ///   - featuredLabel: Said after `label` on a featured tile; "Featured"
    ///     until the product passes its own words.
    ///   - markerContent: The featured tile's logo.
    ///   - onOpen: Opens the place's details, on a double tap or VoiceOver's
    ///     `openLabel` action. Without it every tap selects.
    ///   - openLabel: The name of VoiceOver's action that calls `onOpen`.
    public init(
        label: String? = nil,
        number: Int? = nil,
        externalLabel: String? = nil,
        labelPlacement: KozmosLocationPinLabelPlacement = .bottom,
        selected: Bool = false,
        featured: Bool = false,
        place: Bool = false,
        isDisabled: Bool = false,
        onSelect: (() -> Void)? = nil,
        featuredLabel: String = "Featured",
        markerContent: AnyView? = nil,
        onOpen: (() -> Void)? = nil,
        openLabel: String = "Open details"
    ) {
        self.label = label
        self.number = number
        self.externalLabel = externalLabel
        self.labelPlacement = labelPlacement
        self.selected = selected
        self.featured = featured
        self.place = place
        self.isDisabled = isDisabled
        self.onSelect = onSelect
        self.featuredLabel = featuredLabel
        self.markerContent = markerContent
        self.onOpen = onOpen
        self.openLabel = openLabel
    }

    /// Which of the three markers is drawn. A place wins over featured, and
    /// featured over a number.
    enum Kind: Equatable {
        case result
        case featured
        case place
    }

    var kind: Kind {
        if place { return .place }
        return featured ? .featured : .result
    }

    /// What VoiceOver says (Olcay, 15 Oct 2026): `label`, the product's whole
    /// name for the marker, with nothing added, except on a featured tile,
    /// which adds the product's word for Featured (decision 67). A place says
    /// its label alone.
    var accessibilityDescription: String {
        switch kind {
        case .result, .place:
            return label ?? ""
        case .featured:
            return [label, featuredLabel].compactMap { $0 }.joined(separator: ", ")
        }
    }

    /// Whether a tap or VoiceOver can press the marker.
    private var pressable: Bool { !isDisabled && (onSelect != nil || onOpen != nil) }

    /// A button when it can be pressed, otherwise an image; selected when
    /// selected, and a place always (its details are open).
    private var accessibilityTraits: AccessibilityTraits {
        let role: AccessibilityTraits = pressable ? .isButton : .isImage
        return selected || place ? [role, .isSelected] : role
    }

    public var body: some View {
        let plan = Plan(kind: kind, selected: selected)
        return drawing
            .frame(height: plan.height, alignment: .top)
            .modifier(PlacedLabel(label: externalLabel, placement: labelPlacement, plan: plan))
            // The target: at least 44 square, centred on the body. The
            // drawing overflows it below, to its dot.
            .offset(y: -plan.targetTop)
            .frame(minWidth: Metrics.target)
            .frame(height: plan.targetHeight, alignment: .top)
            .contentShape(Rectangle())
            // Dimmed once, as a whole, not part by part.
            .compositingGroup()
            .opacity(isDisabled ? 0.5 : 1)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityDescription)
            .accessibilityAddTraits(accessibilityTraits)
            .modifier(Actions(pressable: pressable, tap: handleTap, select: select,
                              open: onOpen == nil ? nil : open, openLabel: openLabel))
            // The anchor at the centre of the frame.
            .padding(.top, plan.paddingTop)
            .padding(.bottom, plan.paddingBottom)
    }

    // MARK: Pressing

    /// A tap. Without `onOpen` it selects, every time. With it, the first tap
    /// selects at once and a second within the double-tap time opens the
    /// place's details instead of selecting again; a third quick tap does
    /// nothing (`KozmosDoubleTapGate`).
    private func handleTap() {
        guard pressable else { return }
        guard onOpen != nil else { return select() }
        switch doubleTap.press("pin", at: ProcessInfo.processInfo.systemUptime) {
        case .select: select()
        case .open: open()
        case .ignore: break
        }
    }

    private func select() {
        guard pressable else { return }
        onSelect?()
    }

    private func open() {
        guard pressable else { return }
        onOpen?()
    }

    // MARK: Drawing

    @ViewBuilder
    private var drawing: some View {
        switch kind {
        case .result: resultMarker
        case .featured: featuredMarker
        case .place: placeMarker
        }
    }

    /// The number, or the dot standing for it: theme 600 at rest,
    /// foreground/1000 on the selected fill.
    private var ink: Color {
        selected ? KozmosColors.primitivesColorsForeground1000 : KozmosColors.primitivesColorsTheme600
    }

    private var resultMarker: some View {
        ZStack(alignment: .top) {
            pill
            // Its top 1 inside the pill's bottom border, its tip 6 below it.
            Pointer()
                .fill(KozmosColors.primitivesColorsTheme600)
                .frame(width: Metrics.pointerWidth, height: Metrics.pointerHeight)
                .offset(y: Metrics.pointerTop)
        }
        .frame(height: Metrics.pointerTop + Metrics.pointerHeight, alignment: .top)
        .compositingGroup()
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
    }

    private var pill: some View {
        Group {
            if let number {
                // Written as the result card's tab writes it, so the two match.
                Text(verbatim: "\(number)")
                    .font(.system(size: Metrics.numberSize, weight: .semibold))
                    .monospacedDigit()
                    .foregroundStyle(ink)
                    .lineLimit(1)
                    .fixedSize()
            } else {
                Circle()
                    .fill(ink)
                    .frame(width: Metrics.resultDot, height: Metrics.resultDot)
            }
        }
        .padding(.horizontal, Metrics.pillPadding)
        .frame(minWidth: Metrics.pillHeight, minHeight: Metrics.pillHeight, maxHeight: Metrics.pillHeight)
        .background(
            Capsule().fill(selected ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsBackground0)
        )
        .overlay(Capsule().strokeBorder(KozmosColors.primitivesColorsTheme600, lineWidth: Metrics.pillBorder))
    }

    private var featuredMarker: some View {
        let side = Metrics.tile(selected: selected)
        let inner = side - 2 * Metrics.rim
        return VStack(spacing: Metrics.featuredDotGap) {
            ZStack {
                RoundedRectangle(cornerRadius: Metrics.tileRadius)
                    .fill(KozmosColors.primitivesColorsBackground0)
                if let markerContent {
                    markerContent
                        .font(.system(size: Metrics.numberSize, weight: .semibold))
                        .foregroundStyle(KozmosColors.primitivesColorsForeground0)
                        .scaledToFit()
                        .frame(width: inner, height: inner)
                        .clipShape(RoundedRectangle(cornerRadius: Metrics.tileRadius - Metrics.rim))
                        .accessibilityHidden(true)
                }
                RoundedRectangle(cornerRadius: Metrics.tileRadius)
                    .strokeBorder(KozmosColors.primitivesColorsForeground0, lineWidth: Metrics.rim)
            }
            .frame(width: side, height: side)
            .compositingGroup()
            .kozmosElevation(KozmosShadows.semanticsElevationFloating)
            Circle()
                .fill(KozmosColors.primitivesColorsForeground0)
                .frame(width: Metrics.anchorDot, height: Metrics.anchorDot)
        }
    }

    private var placeMarker: some View {
        let green = KozmosColors.primitivesColorsEmotionalSuccess800
        return ZStack(alignment: .top) {
            ZStack(alignment: .top) {
                Teardrop().fill(green)
                Circle()
                    .fill(KozmosColors.primitivesColorsBackground0)
                    .frame(width: Metrics.placeDisc, height: Metrics.placeDisc)
                    .offset(y: (Metrics.placeCircle - Metrics.placeDisc) / 2)
            }
            .frame(width: Metrics.placeCircle, height: Metrics.placeTip, alignment: .top)
            .compositingGroup()
            .kozmosElevation(KozmosShadows.semanticsElevationFloating)
            Circle()
                .fill(green)
                .frame(width: Metrics.anchorDot, height: Metrics.anchorDot)
                .offset(y: Metrics.placeCircle + Metrics.placeDotGap)
        }
        .frame(width: Metrics.placeCircle, alignment: .top)
    }

    // MARK: The label

    /// `externalLabel` beside the drawing, 4 from it: below the dot or the
    /// tip, above the body, or level with the pill's, tile's or circle's
    /// middle.
    private struct PlacedLabel: ViewModifier {
        let label: String?
        let placement: KozmosLocationPinLabelPlacement
        let plan: Plan

        private var alignment: Alignment {
            switch placement {
            case .top: return .top
            case .bottom: return .bottom
            case .left: return .leading
            case .right: return .trailing
            }
        }

        func body(content: Content) -> some View {
            if let label {
                let gap = KozmosDimensions.primitivesLayoutSpacing50
                let beside = placement == .left || placement == .right
                // Every guide set, each for its own placement: an alignment
                // guide set inside a conditional view is lost.
                content.overlay(alignment: alignment) {
                    Text(label)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(KozmosColors.primitivesColorsForeground100)
                        .lineLimit(1)
                        .fixedSize()
                        .alignmentGuide(.top) { placement == .top ? $0[.bottom] + gap : $0[.top] }
                        .alignmentGuide(.bottom) { placement == .bottom ? $0[.top] - gap : $0[.bottom] }
                        .alignmentGuide(.leading) { placement == .left ? $0[.trailing] + gap : $0[.leading] }
                        .alignmentGuide(.trailing) { placement == .right ? $0[.leading] - gap : $0[.trailing] }
                        .offset(y: beside ? plan.shapeMiddle - plan.height / 2 : 0)
                }
            } else {
                content
            }
        }
    }
}

// MARK: - Geometry

extension KozmosLocationPin {
    /// The markers' measurements, from the boards' references (MAP-474).
    enum Metrics {
        /// The smallest target, each way.
        static let target: CGFloat = 44

        static let pillHeight: CGFloat = 32
        static let pillPadding: CGFloat = 8
        static let pillBorder: CGFloat = 2
        static let pointerWidth: CGFloat = 12
        static let pointerHeight: CGFloat = 7
        /// The pointer's top: 1 inside the pill's 2 bottom border.
        static let pointerTop: CGFloat = 31
        static let numberSize: CGFloat = 14
        static let resultDot: CGFloat = 8

        static func tile(selected: Bool) -> CGFloat { selected ? 52 : 44 }
        static let tileRadius: CGFloat = 16
        static let rim: CGFloat = 3
        static let featuredDotGap: CGFloat = 4

        static let placeCircle: CGFloat = 40
        static let placeDisc: CGFloat = 20
        static let placeDotGap: CGFloat = 6
        /// The teardrop's point below the circle's top: the corner of a
        /// square drawn round the circle, turned 45°, r × (1 + √2).
        static let placeTip: CGFloat = placeCircle / 2 * (1 + 2.squareRoot())

        /// A featured tile's or a place's dot, whose centre is the anchor.
        static let anchorDot: CGFloat = 6
    }

    /// One marker's layout top to bottom, in points from the top of its body.
    struct Plan: Equatable {
        /// The drawing's height, its dot included.
        let height: CGFloat
        /// The body's height: the pill and its pointer, the tile, the teardrop.
        let bodyHeight: CGFloat
        /// The anchor's depth: the pointer's tip, or the dot's centre.
        let anchor: CGFloat
        /// The middle of the pill, the tile or the circle, which a label
        /// beside the marker is level with.
        let shapeMiddle: CGFloat

        init(kind: Kind, selected: Bool) {
            switch kind {
            case .result:
                bodyHeight = Metrics.pointerTop + Metrics.pointerHeight
                height = bodyHeight
                anchor = bodyHeight
                shapeMiddle = Metrics.pillHeight / 2
            case .featured:
                let side = Metrics.tile(selected: selected)
                bodyHeight = side
                height = side + Metrics.featuredDotGap + Metrics.anchorDot
                anchor = side + Metrics.featuredDotGap + Metrics.anchorDot / 2
                shapeMiddle = side / 2
            case .place:
                bodyHeight = Metrics.placeTip
                height = Metrics.placeCircle + Metrics.placeDotGap + Metrics.anchorDot
                anchor = Metrics.placeCircle + Metrics.placeDotGap + Metrics.anchorDot / 2
                shapeMiddle = Metrics.placeCircle / 2
            }
        }

        /// The target's height: the body's, and at least 44.
        var targetHeight: CGFloat { max(Metrics.target, bodyHeight) }
        /// The target's top, centred on the body: above the body's top when
        /// the body is shorter than 44.
        var targetTop: CGFloat { (bodyHeight - targetHeight) / 2 }

        /// Half the frame's height: as far as the farther of the target's top
        /// and the drawing's or the target's bottom lies from the anchor.
        private var half: CGFloat {
            max(anchor - targetTop, max(height, targetTop + targetHeight) - anchor)
        }

        /// Space above the target and below it that puts the anchor at the
        /// centre of the frame.
        var paddingTop: CGFloat { half - (anchor - targetTop) }
        var paddingBottom: CGFloat { 2 * half - paddingTop - targetHeight }
    }

    /// The result's pointer: a triangle pointing down.
    private struct Pointer: Shape {
        func path(in rect: CGRect) -> Path {
            var path = Path()
            path.move(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
            path.closeSubpath()
            return path
        }
    }

    /// The place's teardrop: a circle as wide as the rect, coming to a point
    /// below it where two tangents meet, as the reference's three quarter-arcs
    /// and square corner turned −45° draw it.
    private struct Teardrop: Shape {
        func path(in rect: CGRect) -> Path {
            let radius = rect.width / 2
            let centre = CGPoint(x: rect.midX, y: rect.minY + radius)
            let reach = radius / 2.squareRoot()
            var path = Path()
            path.move(to: CGPoint(x: centre.x, y: centre.y + radius * 2.squareRoot()))
            path.addLine(to: CGPoint(x: centre.x - reach, y: centre.y + reach))
            // From lower left, over the top, to lower right.
            path.addRelativeArc(center: centre, radius: radius, startAngle: .degrees(135), delta: .degrees(270))
            path.closeSubpath()
            return path
        }
    }

    /// What pressing does, only when the marker can be pressed: a static or
    /// disabled marker takes no touch, so a map's gestures under it still
    /// run, and VoiceOver is offered no action.
    private struct Actions: ViewModifier {
        let pressable: Bool
        let tap: () -> Void
        let select: () -> Void
        let open: (() -> Void)?
        let openLabel: String

        func body(content: Content) -> some View {
            if pressable {
                content
                    .onTapGesture(perform: tap)
                    // VoiceOver's double tap is one activation: it selects.
                    .accessibilityAction { select() }
                    .accessibilityActions {
                        if let open {
                            Button(openLabel, action: open)
                        }
                    }
            } else {
                content.allowsHitTesting(false)
            }
        }
    }
}
