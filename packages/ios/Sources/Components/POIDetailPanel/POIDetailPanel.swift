import SwiftUI

/// Controlled state for a single POI action button.
public struct KozmosPOIActionState: Sendable, Hashable {
    public enum MessageTone: Sendable, Hashable {
        case status
        case error
    }

    public let disabled: Bool
    public let loading: Bool
    public let pressed: Bool
    public let message: String?
    public let messageTone: MessageTone

    public init(
        disabled: Bool = false,
        loading: Bool = false,
        pressed: Bool = false,
        message: String? = nil,
        messageTone: MessageTone = .status
    ) {
        self.disabled = disabled
        self.loading = loading
        self.pressed = pressed
        self.message = message
        self.messageTone = messageTone
    }
}

/// Native POI card. Presentation is controlled by the product; no SDK objects or
/// taxonomy lookups are embedded in this view. Existing basic callers still work.
///
/// In its sheet presentation, which paints no surface of its own, the card is
/// the top of the map shell's panel: its header tops its top padding up to
/// what the panel already leaves above it (`kozmosPanelInsetTop`) rather than
/// adding to it, so its close button sits as far from the panel's top as from
/// its side (GAP-083), 16 and 16 under a grabber. Where its quick buttons
/// would then meet the grabber's target — three of them on a card under 338
/// points wide — its first row keeps the grabber's clearance
/// (`kozmosPanelClearanceTop`) too, 20 and 16 (decision 51). The panel and
/// inline presentations draw their own bordered card and keep their padding
/// inside it.
public struct KozmosPOIDetailPanel: View {
    public enum Presentation { case inline, sheet, panel }
    public enum TitleLevel {
        case h2, h3
        var accessibilityHeadingLevel: AccessibilityHeadingLevel { self == .h2 ? .h2 : .h3 }
    }

    private let poi: KozmosPOIPresentation
    private let details: KozmosPOIDetailsPresentation
    private let actionLabels: [KozmosPOIAction: String]
    private let actionStates: [KozmosPOIAction: KozmosPOIActionState]
    private let supplementaryActionStates: [String: KozmosPOIActionState]
    private let closeLabel: String
    private let mediaLabel: String
    private let mediaPositionLabel: (Int, Int) -> String
    private let mediaPreviousLabel: String
    private let mediaNextLabel: String
    private let mediaUnavailableLabel: String
    private let mediaControlsLabel: String?
    private let mediaRetryHint: String
    private let accessRestrictionsHeading: String
    private let servicesHeading: String
    private let readMoreLabel: String
    private let readLessLabel: String
    private let tagsLabel: String
    private let loadingLabel: String
    private let presentation: Presentation
    private let titleLevel: TitleLevel
    private let onAction: (KozmosPOIAction, String) -> Void
    private let onSupplementaryAction: ((String, String) -> Void)?
    private let onClose: (() -> Void)?
    @Environment(\.kozmosPanelInsetTop) private var panelInsetTop
    @Environment(\.kozmosPanelClearanceTop) private var panelClearanceTop
    @Environment(\.kozmosSurfaceStyle) private var surfaceStyle

    /// The surface the card's text sits on: in the sheet presentation the
    /// one under the card, the panel's, and in the panel and inline
    /// presentations the card's own, a solid one (decision 48).
    private var textSurface: KozmosSurfaceStyle? { presentation == .sheet ? surfaceStyle : .solid }

    public init(
        poi: KozmosPOIPresentation,
        actionLabels: [KozmosPOIAction: String],
        onAction: @escaping (KozmosPOIAction, String) -> Void,
        actionStates: [KozmosPOIAction: KozmosPOIActionState] = [:],
        onClose: (() -> Void)? = nil,
        closeLabel: String = "Close details",
        mediaLabel: String? = nil,
        mediaPositionLabel: @escaping (Int, Int) -> String = { "Image \($0) of \($1)" },
        mediaPreviousLabel: String = "Previous image",
        mediaNextLabel: String = "Next image",
        mediaUnavailableLabel: String = "Image unavailable",
        mediaControlsLabel: String? = nil,
        mediaRetryHint: String = "Double-tap to try again",
        accessRestrictionsHeading: String = "Access restrictions",
        servicesHeading: String = "Service options",
        presentation: Presentation = .inline,
        titleLevel: TitleLevel = .h2,
        details: KozmosPOIDetailsPresentation = .init(),
        supplementaryActionStates: [String: KozmosPOIActionState] = [:],
        onSupplementaryAction: ((String, String) -> Void)? = nil,
        readMoreLabel: String = "Read more",
        readLessLabel: String = "Read less",
        tagsLabel: String = "Tags",
        loadingLabel: String = "Loading"
    ) {
        self.poi = poi; self.details = details; self.actionLabels = actionLabels
        self.onAction = onAction; self.actionStates = actionStates; self.onClose = onClose
        self.closeLabel = closeLabel; self.mediaLabel = mediaLabel ?? "\(poi.name) photos"
        self.mediaPositionLabel = mediaPositionLabel
        self.mediaPreviousLabel = mediaPreviousLabel; self.mediaNextLabel = mediaNextLabel
        self.mediaUnavailableLabel = mediaUnavailableLabel; self.mediaControlsLabel = mediaControlsLabel
        self.mediaRetryHint = mediaRetryHint
        self.accessRestrictionsHeading = accessRestrictionsHeading; self.servicesHeading = servicesHeading
        self.presentation = presentation; self.titleLevel = titleLevel
        self.supplementaryActionStates = supplementaryActionStates
        self.onSupplementaryAction = onSupplementaryAction
        self.readMoreLabel = readMoreLabel; self.readLessLabel = readLessLabel; self.tagsLabel = tagsLabel
        self.loadingLabel = loadingLabel
    }

    private var quickActions: [KozmosPOIAction] {
        poi.actions.filter { $0 == .favourite || $0 == .bookmark }
    }
    private var stripActions: [KozmosPOIAction] {
        poi.actions.filter { $0 != .favourite && $0 != .bookmark }
    }

    private static func systemImage(for action: KozmosPOIAction) -> String {
        switch action {
        case .navigate: return "location"
        case .favourite: return "heart"
        case .bookmark: return "bookmark"
        case .share: return "square.and.arrow.up"
        case .order: return "bag"
        }
    }

    public var body: some View {
        // Yields to the shell's sheet: scrolls only at its largest detent, and
        // hands a downward drag back to the sheet once at its top.
        KozmosPanelScrollView {
            VStack(alignment: .leading, spacing: 0) {
                header
                    .padding([.horizontal, .bottom], KozmosDimensions.primitivesLayoutSpacing200)
                    .padding(.top, headerTopPadding)
                if let description = poi.description, !description.isEmpty {
                    Text(description)
                        .font(KozmosTypography.subheadline)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 16).padding(.bottom, 16)
                }
                if !stripActions.isEmpty || !details.supplementaryActions.isEmpty {
                    // The sheet's smallest detent rests on this row: the
                    // prototype's place card peeks at its header and Go.
                    actionButtons.padding(.bottom, 16).kozmosPanelPeekAnchor()
                }
                messages
                if !details.visibleSummary.isEmpty {
                    POIDetailSummary(items: details.visibleSummary)
                }
                VStack(alignment: .leading, spacing: 20) {
                    if let restriction = poi.accessRestrictions,
                       restriction != KozmosPOIAccessRestrictions.none,
                       let label = poi.accessRestrictionsLabel {
                        Text(label).font(KozmosTypography.subheadline)
                            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                            .background(insetSurface)
                            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                            .accessibilityLabel("\(accessRestrictionsHeading), \(label)")
                    }
                    KozmosPOIMediaGallery(
                        surface: insetSurface,
                        media: poi.media, label: mediaLabel, positionLabel: mediaPositionLabel,
                        previousLabel: mediaPreviousLabel, nextLabel: mediaNextLabel,
                        controlsLabel: mediaControlsLabel, unavailableLabel: mediaUnavailableLabel,
                        loadingLabel: loadingLabel, retryHint: mediaRetryHint)
                    if let services = poi.services, !services.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(servicesHeading).font(KozmosTypography.footnote)
                                .foregroundColor(kozmosMutedForeground(on: textSurface))
                                .accessibilityAddTraits(.isHeader)
                            POIDetailTags(items: services.map(KozmosPOIDetailTag.init(service:)))
                        }
                    }
                    POIDetailExtendedContent(details: details, readMoreLabel: readMoreLabel,
                                             readLessLabel: readLessLabel, tagsLabel: tagsLabel)
                }
                .padding(16)
            }
        }
        // Reset scroll/disclosure state only when selecting a different place.
        .id(poi.id)
        // What the card holds is on the panel's surface in the sheet
        // presentation, and on the card's own in the others: its summaries,
        // sections and gallery draw their muted text for it (decision 48).
        .environment(\.kozmosSurfaceStyle, textSurface)
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        // In a sheet the panel paints no surface of its own: it sits on the
        // sheet's, as the browse panel does, with no border and no card.
        .background(presentation == .sheet ? Color.clear : KozmosColors.primitivesColorsBackground0)
        .clipShape(panelShape)
        .overlay(panelShape.stroke(presentation == .sheet ? Color.clear : KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(poi.name)
    }

    /// The header's top padding. In the sheet presentation the card paints no
    /// surface of its own, so the space the shell's panel leaves above it is
    /// the card's own top: the header tops it up to 16 rather than adding 16
    /// to it, and under a grabber sits flush under the grabber's row — the
    /// close button as far from the sheet's top as from its side, 16 and 16.
    /// It sat 32 and 16 (GAP-083), then 20 and 16; where its buttons would
    /// meet the grabber's target, its first row still keeps the grabber's
    /// clearance (`grabberReach`, decision 51). The panel and inline
    /// presentations draw their own bordered card, and that space lies
    /// outside the border: they keep their 16 inside it, or the header meets
    /// the card's own top edge.
    private var headerTopPadding: CGFloat {
        let padding = KozmosDimensions.primitivesLayoutSpacing200
        guard presentation == .sheet else { return padding }
        return max(0, padding - panelInsetTop)
    }

    /// How far from the middle of the header's first row its quick buttons
    /// must start to stay out of the grabber's target, flush under its row
    /// (decision 51); 0 with no grabber. The grabber's row is an undersized
    /// target, and WCAG 2.5.8 keeps a 24-point circle on its centre clear of
    /// every other target. The shell's clearance is how far below the row
    /// that circle reaches, so its radius is half the row and the clearance;
    /// flush, the buttons' top edge is half the row under its centre, and
    /// the button nearest the middle must start √(12² − 8²) ≈ 8.9 past it,
    /// rounded up to 9 as the web rounds it. The row is centred under the
    /// grabber, as the card spans the sheet.
    private var grabberReach: CGFloat {
        guard presentation == .sheet, panelClearanceTop > 0 else { return 0 }
        let radius = panelInsetTop / 2 + panelClearanceTop
        let depth = panelInsetTop / 2 + headerTopPadding
        guard depth < radius else { return 0 }
        return (radius * radius - depth * depth).squareRoot().rounded(.up)
    }

    /// An inset block's surface: the muted grey on the panel's own white, and
    /// white on a sheet, whose surface is that grey.
    private var insetSurface: Color {
        presentation == .sheet ? KozmosColors.primitivesColorsBackground0 : KozmosColors.primitivesColorsBackground100
    }

    private var panelShape: KozmosPanelShape {
        KozmosPanelShape(radius: KozmosDimensions.semanticsRadiusControl, roundsBottom: presentation != .sheet)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            // The name and the quick buttons share one row whatever the name's
            // length: a long name wraps beside them, three lines at most, and
            // never pushes them under it. Under a grabber the row keeps the
            // grabber's clearance only where its buttons need it.
            POIDetailHeaderRow(spacing: 8, clearance: grabberReach > 0 ? panelClearanceTop : 0, reach: grabberReach) {
                identity
                quickButtons
            }
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    location; Spacer(minLength: 4); availability
                }
                VStack(alignment: .leading, spacing: 4) { location; availability }
            }
        }
    }

    private var identity: some View {
        HStack(alignment: .top, spacing: 8) {
            if let logo = poi.logo {
                AsyncImage(url: POIDetailIcon.remoteURL(logo.src)) { phase in
                    if let image = phase.image {
                        image.resizable().scaledToFit()
                    } else {
                        Text(poi.logoFallbackInitial).font(KozmosTypography.headline)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(insetSurface)
                    }
                }
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                .accessibilityLabel(logo.alt)
            }
            Text(poi.name).font(KozmosTypography.title3.weight(.semibold))
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
                .accessibilityHeading(titleLevel.accessibilityHeadingLevel)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var location: some View {
        Text(poi.locationLabel).font(KozmosTypography.subheadline)
            .foregroundColor(kozmosMutedForeground(on: textSurface))
            .fixedSize(horizontal: false, vertical: true)
    }

    @ViewBuilder private var availability: some View {
        if let label = poi.availabilityLabel {
            Text(label).font(KozmosTypography.caption.weight(.semibold))
                .foregroundColor(poi.availability == .open
                    ? KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle
                    : kozmosMutedForeground(on: textSurface))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var quickButtons: some View {
        HStack(spacing: 6) {
            ForEach(quickActions, id: \.self) { action in
                POIDetailActionButton(label: actionLabels[action] ?? action.rawValue,
                                     systemImage: Self.systemImage(for: action), iconOnly: true,
                                     loadingLabel: loadingLabel,
                                     state: actionStates[action] ?? .init()) { onAction(action, poi.id) }
                    .accessibilityIdentifier("poi-action-\(action.rawValue)")
            }
            if let onClose {
                POIDetailActionButton(label: closeLabel, systemImage: "xmark", iconOnly: true, action: onClose)
                    .accessibilityIdentifier("poi-close")
            }
        }
    }

    private var actionButtons: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 8) {
                ForEach(stripActions, id: \.self) { action in
                    POIDetailActionButton(
                        label: actionLabels[action] ?? action.rawValue,
                        systemImage: nil,
                        iconName: action == .navigate ? "navigation-pointer-01" : nil,
                        estimate: action == .navigate ? details.travelEstimate.map {
                            [$0.durationLabel, $0.distanceLabel].compactMap { $0 }.joined(separator: " · ")
                        } : nil,
                        primary: action == .navigate,
                        loadingLabel: loadingLabel,
                        state: actionStates[action] ?? .init()
                    ) { onAction(action, poi.id) }
                    .accessibilityIdentifier("poi-action-\(action.rawValue)")
                }
                ForEach(details.supplementaryActions) { item in
                    POIDetailActionButton(label: item.label, systemImage: nil,
                                         loadingLabel: loadingLabel,
                                         state: supplementaryActionStates[item.action] ?? .init(disabled: onSupplementaryAction == nil)) {
                        onSupplementaryAction?(item.action, poi.id)
                    }
                    .disabled(onSupplementaryAction == nil)
                    .accessibilityIdentifier("poi-action-\(item.action)")
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 2)
        }
        .accessibilityIdentifier("poi-actions")
    }

    private var allMessages: [(String, KozmosPOIActionState)] {
        poi.actions.compactMap { action in actionStates[action].map { ("core:\(action.rawValue)", $0) } }
        + details.supplementaryActions.compactMap { item in supplementaryActionStates[item.action].map { ("supplementary:\(item.action)", $0) } }
    }

    private var messages: some View {
        ForEach(allMessages.filter { $0.1.message != nil }, id: \.0) { _, state in
            if let message = state.message {
                Text(message).font(KozmosTypography.subheadline)
                    .foregroundColor(state.messageTone == .error
                        ? KozmosColors.primitivesColorsEmotionalDanger600
                        : KozmosColors.primitivesColorsForeground100)
                    .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(insetSurface)
                    .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    .padding(.horizontal, 16).padding(.bottom, 12)
                    .accessibilityAddTraits(.updatesFrequently)
            }
        }
    }
}

struct POIDetailActionButton: View {
    let label: String
    let systemImage: String?
    var iconName: String? = nil
    var estimate: String? = nil
    var primary = false
    var iconOnly = false
    var loadingLabel = "Loading"
    var state = KozmosPOIActionState()
    let action: () -> Void

    private var filled: Bool { primary || state.pressed }
    private var foreground: Color {
        filled ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
               : KozmosColors.primitivesColorsForeground100
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if state.loading {
                    ProgressView().controlSize(.small).tint(foreground)
                } else if let iconName {
                    KozmosIcon(iconName, size: .lg)
                        .environment(\.kozmosIconHostInk, foreground)
                } else if let systemImage {
                    Image(systemName: systemImage)
                        .font(primary ? .title3 : .body)
                        .accessibilityHidden(true)
                }
                if !iconOnly {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(label).font(primary ? KozmosTypography.font(.callout).weight(.semibold) : KozmosTypography.subheadline)
                        if let estimate { Text(estimate).font(KozmosTypography.caption2) }
                    }
                }
            }
            .foregroundColor(foreground)
            .padding(.horizontal, iconOnly ? 0 : 16).padding(.vertical, 8)
            .frame(minWidth: 44, minHeight: primary && estimate != nil ? 56 : 44)
            .background(filled ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            // Inside the frame, as the web's border and Compose's BorderStroke
            // are: a stroke on the frame's edge put half of it outside, and
            // under a grabber, with the header flush under its row (decision
            // 51), the sheet's scroll view cut that half off the top edge.
            .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .strokeBorder(filled ? Color.clear : KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        }
        // The plain style draws a disabled or loading action at half; a
        // second opacity here dimmed a disabled one twice, to a quarter.
        .buttonStyle(.plain)
        .disabled(state.disabled || state.loading)
        .accessibilityLabel(label)
        .accessibilityValue(state.loading ? Text(loadingLabel) : Text(estimate ?? ""))
        .accessibilityAddTraits(state.pressed ? [.isSelected] : [])
    }
}

/// The details header's first row: the name, taking what the quick buttons
/// leave, and the quick buttons at its end, both from its top — as
/// `HStack(alignment: .top, spacing:)` lays them out. Under a grabber
/// (decision 51) it also keeps the buttons out of the grabber's target: where
/// their start edge would come within `reach` of the row's middle, which is
/// under the grabber's centre, the whole row starts `clearance` lower. It
/// measures its buttons, which grow with the text size, rather than counting
/// them: at the largest sizes they reach the circle on wider phones too.
struct POIDetailHeaderRow: Layout {
    var spacing: CGFloat
    var clearance: CGFloat = 0
    var reach: CGFloat = 0

    private func arrange(width proposed: CGFloat?, subviews: Subviews)
        -> (width: CGFloat, name: CGSize, buttons: CGSize, drop: CGFloat) {
        let buttons = subviews[1].sizeThatFits(.unspecified)
        let width: CGFloat
        if let proposed, proposed.isFinite {
            width = proposed
        } else {
            width = subviews[0].sizeThatFits(.unspecified).width + spacing + buttons.width
        }
        let name = subviews[0].sizeThatFits(ProposedViewSize(width: max(0, width - spacing - buttons.width), height: nil))
        let meets = clearance > 0 && buttons.width > 0 && width / 2 - buttons.width < reach
        return (width, name, buttons, meets ? clearance : 0)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let row = arrange(width: proposal.width, subviews: subviews)
        return CGSize(width: row.width, height: row.drop + max(row.name.height, row.buttons.height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let row = arrange(width: bounds.width, subviews: subviews)
        subviews[0].place(at: CGPoint(x: bounds.minX, y: bounds.minY + row.drop), anchor: .topLeading,
                          proposal: ProposedViewSize(width: max(0, bounds.width - spacing - row.buttons.width), height: nil))
        subviews[1].place(at: CGPoint(x: bounds.maxX, y: bounds.minY + row.drop), anchor: .topTrailing,
                          proposal: .unspecified)
    }
}

/// Panel outline that can drop its bottom corners for sheet presentation.
///
/// `UnevenRoundedRectangle` would express this directly but is iOS 17+, and the
/// package deploys to iOS 16.
struct KozmosPanelShape: InsettableShape {
    var radius: CGFloat
    var roundsBottom: Bool
    var insetAmount: CGFloat = 0

    func inset(by amount: CGFloat) -> KozmosPanelShape {
        var shape = self
        shape.insetAmount += amount
        return shape
    }

    func path(in outer: CGRect) -> Path {
        let rect = outer.insetBy(dx: insetAmount, dy: insetAmount)
        let r = min(radius, min(rect.width, rect.height) / 2)
        let bottomR = roundsBottom ? r : 0

        var path = Path()
        path.move(to: CGPoint(x: rect.minX, y: rect.minY + r))
        path.addArc(
            center: CGPoint(x: rect.minX + r, y: rect.minY + r),
            radius: r,
            startAngle: .degrees(180),
            endAngle: .degrees(270),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: rect.maxX - r, y: rect.minY))
        path.addArc(
            center: CGPoint(x: rect.maxX - r, y: rect.minY + r),
            radius: r,
            startAngle: .degrees(270),
            endAngle: .degrees(0),
            clockwise: false
        )
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomR))

        if bottomR > 0 {
            path.addArc(
                center: CGPoint(x: rect.maxX - bottomR, y: rect.maxY - bottomR),
                radius: bottomR,
                startAngle: .degrees(0),
                endAngle: .degrees(90),
                clockwise: false
            )
        }

        path.addLine(to: CGPoint(x: rect.minX + bottomR, y: rect.maxY))

        if bottomR > 0 {
            path.addArc(
                center: CGPoint(x: rect.minX + bottomR, y: rect.maxY - bottomR),
                radius: bottomR,
                startAngle: .degrees(90),
                endAngle: .degrees(180),
                clockwise: false
            )
        }

        path.closeSubpath()
        return path
    }
}

/// Wrapping layout for property/service chips (actions scroll horizontally).
///
/// SwiftUI has no built-in flow container, and these rows must wrap rather than
/// clip when localized labels or Dynamic Type make them wide.
struct FlowLayout: Layout {
    var spacing: CGFloat

    init(spacing: CGFloat = 8) {
        self.spacing = spacing
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        let rows = layoutRows(maxWidth: maxWidth, subviews: subviews)
        let height = rows.reduce(into: CGFloat.zero) { total, row in
            total += row.height
        } + spacing * CGFloat(max(rows.count - 1, 0))
        let width = rows.map(\.width).max() ?? 0
        return CGSize(width: min(width, maxWidth), height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = layoutRows(maxWidth: bounds.width, subviews: subviews)
        var y = bounds.minY

        for row in rows {
            var x = bounds.minX
            for index in row.indices {
                let size = subviews[index].sizeThatFits(.init(width: bounds.width, height: nil))
                subviews[index].place(
                    at: CGPoint(x: x, y: y),
                    proposal: ProposedViewSize(size)
                )
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row {
        var indices: [Int] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    private func layoutRows(maxWidth: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = []
        var current = Row()

        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(.init(width: maxWidth.isFinite ? maxWidth : nil, height: nil))
            let projected = current.indices.isEmpty ? size.width : current.width + spacing + size.width

            if projected > maxWidth, !current.indices.isEmpty {
                rows.append(current)
                current = Row()
                current.indices = [index]
                current.width = size.width
                current.height = size.height
            } else {
                current.indices.append(index)
                current.width = projected
                current.height = max(current.height, size.height)
            }
        }

        if !current.indices.isEmpty { rows.append(current) }
        return rows
    }
}
