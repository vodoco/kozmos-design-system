import SwiftUI

/// A horizontally paged gallery of POI photography.
///
/// Mirrors the React `POIMediaGallery` contract. Pass `activeIndex` to control
/// it, otherwise it tracks its own position from `defaultActiveIndex`. The
/// buttons, the position label and the strip agree on one index: scrolling
/// the strip moves the index, and moving the index — a button, a new
/// controlled value, a narrower window, different media — moves the strip. A
/// controlled parent that refuses an index gets the strip back where it was.
/// Renders nothing when `media` is empty, so venues without licensed imagery
/// simply show no gallery.
///
/// Media is photography. Each item fills a 4:3 tile 85% of the gallery's width
/// — so the next one shows — and is cropped to fill it, as `object-fit: cover`
/// does on the web. Brand artwork belongs in the POI's `logo`, which is never
/// cropped; nothing here guesses an image's role from its content or name.
public struct KozmosPOIMediaGallery: View {
    /// The tile's own surface behind an image or its placeholder.
    private let surface: Color
    private let media: [KozmosPOIMediaPresentation]
    private let label: String
    private let activeIndex: Int?
    private let previousLabel: String
    private let nextLabel: String
    private let controlsLabel: String?
    private let unavailableLabel: String
    private let loadingLabel: String
    private let retryHint: String
    private let positionLabel: (Int, Int) -> String
    private let onActiveIndexChange: ((Int) -> Void)?

    @Environment(\.layoutDirection) private var layoutDirection
    /// On the shell's glass panel the position takes the foreground colour
    /// (decision 48); a details card says which surface it sits on.
    @Environment(\.kozmosPanelSurface) private var panelSurface
    @State private var internalIndex: Int
    /// The tile nearest the strip's leading edge, as last measured. When the
    /// index moves to it, the strip is already there and must not be moved.
    @State private var observedIndex: Int?
    /// The index as last rendered. Deferred work reads this, because a
    /// controlled `activeIndex` captured in a closure is stale by then.
    @State private var renderedIndex = 0
    @State private var stripWidth: CGFloat = 0

    public init(
        surface: Color = KozmosColors.primitivesColorsBackground100,
        media: [KozmosPOIMediaPresentation],
        label: String,
        positionLabel: @escaping (Int, Int) -> String,
        activeIndex: Int? = nil,
        defaultActiveIndex: Int = 0,
        previousLabel: String = "Previous image",
        nextLabel: String = "Next image",
        controlsLabel: String? = nil,
        unavailableLabel: String = "Image unavailable",
        loadingLabel: String = "Loading",
        retryHint: String = "Double-tap to try again",
        onActiveIndexChange: ((Int) -> Void)? = nil
    ) {
        self.media = media
        self.surface = surface
        self.label = label
        self.positionLabel = positionLabel
        self.activeIndex = activeIndex
        self.previousLabel = previousLabel
        self.nextLabel = nextLabel
        self.controlsLabel = controlsLabel
        self.unavailableLabel = unavailableLabel
        self.loadingLabel = loadingLabel
        self.retryHint = retryHint
        self.onActiveIndexChange = onActiveIndexChange
        self._internalIndex = State(initialValue: defaultActiveIndex)
    }

    private var isControlled: Bool { activeIndex != nil }

    private var currentIndex: Int {
        POIMediaGalleryGeometry.boundedIndex(activeIndex ?? internalIndex, count: media.count)
    }

    private static let stripSpace = "kozmos-poi-media-strip"

    public var body: some View {
        if media.isEmpty {
            EmptyView()
        } else {
            ScrollViewReader { proxy in
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    toolbar(proxy)
                    strip(proxy)
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(label)
                .onAppear {
                    renderedIndex = currentIndex
                    // A non-zero starting index has to be scrolled to once the
                    // strip has been laid out.
                    align(currentIndex, proxy, afterLayout: true)
                }
                .onChange(of: currentIndex) { index in
                    renderedIndex = index
                    // Scrolling already shows the observed tile. Anything else
                    // — a button, a controlled change — has to move the strip.
                    if index != observedIndex { align(index, proxy) }
                }
                .onChange(of: media.map(\.id)) { _ in
                    // Fewer items can leave the index past the end.
                    if !isControlled, internalIndex != currentIndex { internalIndex = currentIndex }
                    observedIndex = nil
                    align(currentIndex, proxy, afterLayout: true)
                }
                .onChange(of: stripWidth) { _ in align(currentIndex, proxy) }
            }
        }
    }

    // MARK: - Toolbar

    private func toolbar(_ proxy: ScrollViewProxy) -> some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Text(positionLabel(currentIndex + 1, media.count))
                .font(KozmosTypography.caption)
                .foregroundColor(kozmosMutedForeground(on: panelSurface))
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.updatesFrequently)

            Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing150)

            if media.count > 1 {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    // Backward and forward, not left and right: the symbols
                    // mirror with the reading direction, as the strip does.
                    KozmosIconButton(iconName: "chevron.backward", variant: .outline, isDisabled: currentIndex == 0) {
                        select(currentIndex - 1, proxy, native: false)
                    }
                    .accessibilityLabel(previousLabel)

                    KozmosIconButton(iconName: "chevron.forward", variant: .outline,
                                     isDisabled: currentIndex == media.count - 1) {
                        select(currentIndex + 1, proxy, native: false)
                    }
                    .accessibilityLabel(nextLabel)
                }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(controlsLabel ?? "\(label) controls")
            }
        }
    }

    // MARK: - Strip

    private func strip(_ proxy: ScrollViewProxy) -> some View {
        // The strip's height follows its width: a tile is 85% of the width,
        // and 4:3.
        Color.clear
            .aspectRatio(POIMediaGalleryGeometry.stripAspectRatio, contentMode: .fit)
            .frame(maxWidth: .infinity)
            .overlay(
                GeometryReader { geometry in
                    let tileWidth = geometry.size.width * POIMediaGalleryGeometry.tileWidthFraction
                    ScrollView(.horizontal, showsIndicators: false) {
                        LazyHStack(spacing: POIMediaGalleryGeometry.spacing) {
                            ForEach(Array(media.enumerated()), id: \.element.id) { index, item in
                                POIMediaTile(surface: surface, 
                                    item: item,
                                    unavailableLabel: unavailableLabel,
                                    loadingLabel: loadingLabel,
                                    retryHint: retryHint
                                )
                                .frame(width: tileWidth, height: tileWidth / POIMediaGalleryGeometry.tileAspectRatio)
                                .background(
                                    GeometryReader { tile in
                                        Color.clear.preference(
                                            key: POIMediaTileFramesKey.self,
                                            value: [index: tile.frame(in: .named(Self.stripSpace))]
                                        )
                                    }
                                )
                                .id(item.id)
                            }
                        }
                        .kozmosScrollTargetLayout()
                    }
                    .kozmosViewAlignedScrolling()
                    .coordinateSpace(name: Self.stripSpace)
                    .onPreferenceChange(POIMediaTileFramesKey.self) { frames in
                        observe(frames, stripWidth: geometry.size.width, proxy)
                    }
                    .onAppear { stripWidth = geometry.size.width }
                    .onChange(of: geometry.size.width) { stripWidth = $0 }
                }
            )
    }

    // MARK: - Index

    private func select(_ index: Int, _ proxy: ScrollViewProxy, native: Bool) {
        let next = POIMediaGalleryGeometry.boundedIndex(index, count: media.count)
        guard next != currentIndex else { return }
        if !isControlled { internalIndex = next }
        onActiveIndexChange?(next)
        guard native, isControlled else { return }
        // A controlled parent may refuse the index the strip was scrolled to.
        // Once it has had its turn, put the strip back on the index it kept.
        DispatchQueue.main.async {
            if observedIndex == next, renderedIndex != next { align(renderedIndex, proxy) }
        }
    }

    private func observe(_ frames: [Int: CGRect], stripWidth: CGFloat, _ proxy: ScrollViewProxy) {
        guard let nearest = POIMediaGalleryGeometry.nearestIndex(
            tileFrames: frames, stripWidth: stripWidth, layoutDirection: layoutDirection
        ), nearest != observedIndex else { return }
        observedIndex = nearest
        if nearest != currentIndex { select(nearest, proxy, native: true) }
    }

    /// Scroll only the strip, never the panel around it, and without animation:
    /// no forced motion, as on the web. At the last item the scroll view clamps
    /// to its range, which the nearest-tile measure still reads as that item.
    private func align(_ index: Int, _ proxy: ScrollViewProxy, afterLayout: Bool = false) {
        guard media.indices.contains(index) else { return }
        let id = media[index].id
        if afterLayout {
            DispatchQueue.main.async { proxy.scrollTo(id, anchor: .leading) }
        } else {
            proxy.scrollTo(id, anchor: .leading)
        }
    }
}

/// Geometry the gallery and its tests share.
enum POIMediaGalleryGeometry {
    /// Each tile's share of the strip's width, so the next tile shows.
    static let tileWidthFraction: CGFloat = 0.85
    static let tileAspectRatio: CGFloat = 4.0 / 3.0
    static var spacing: CGFloat { KozmosDimensions.primitivesLayoutSpacing150 }
    /// Width over height of the whole strip.
    static var stripAspectRatio: CGFloat { tileAspectRatio / tileWidthFraction }

    static func boundedIndex(_ index: Int, count: Int) -> Int {
        min(max(index, 0), max(count - 1, 0))
    }

    /// The tile whose leading edge is nearest the strip's leading edge — the
    /// web's rule. It stays correct at the end of the strip, where the last
    /// tile cannot reach the leading edge and the one before it still shows.
    ///
    /// Frames are in the scroll view's coordinate space, which keeps physical
    /// left-to-right x in a right-to-left layout; the leading edges are then
    /// the right-hand ones.
    static func nearestIndex(
        tileFrames: [Int: CGRect],
        stripWidth: CGFloat,
        layoutDirection: LayoutDirection
    ) -> Int? {
        tileFrames.min { lhs, rhs in
            distance(lhs.value, stripWidth, layoutDirection) < distance(rhs.value, stripWidth, layoutDirection)
                || (distance(lhs.value, stripWidth, layoutDirection) == distance(rhs.value, stripWidth, layoutDirection)
                    && lhs.key < rhs.key)
        }?.key
    }

    private static func distance(_ frame: CGRect, _ stripWidth: CGFloat, _ direction: LayoutDirection) -> CGFloat {
        direction == .rightToLeft ? abs(stripWidth - frame.maxX) : abs(frame.minX)
    }
}

struct POIMediaTileFramesKey: PreferenceKey {
    static var defaultValue: [Int: CGRect] = [:]
    static func reduce(value: inout [Int: CGRect], nextValue: () -> [Int: CGRect]) {
        value.merge(nextValue()) { $1 }
    }
}

/// One tile: loading, loaded, or unavailable — three states the old
/// placeholder showed as one grey box.
struct POIMediaTile: View {
    /// The tile's own surface behind an image or its placeholder.
    var surface: Color = KozmosColors.primitivesColorsBackground100
    let item: KozmosPOIMediaPresentation
    let unavailableLabel: String
    let loadingLabel: String
    let retryHint: String

    /// Bumped to retry: a new identity makes `AsyncImage` load again.
    @State private var attempt = 0

    enum Source: Equatable {
        case remote(URL)
        /// Not HTTPS, no host, or credentials in the address.
        case refused
    }

    /// The same rule as property icons. A refused address is shown as
    /// unavailable at once; it is never attempted, so never retried.
    static func source(for src: String) -> Source {
        POIDetailIcon.remoteURL(src).map(Source.remote) ?? .refused
    }

    var body: some View {
        // The surface takes the tile's size; the content is an overlay, so a
        // filled image larger than the tile cannot resize it. A flexible
        // frame around the image did: it grows to max(child, proposal), and
        // the tile became as wide as the scaled image.
        surface
            .overlay(content)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous))
    }

    @ViewBuilder private var content: some View {
        if case .remote(let url) = Self.source(for: item.src) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                        .accessibilityLabel(item.alt)
                        .accessibilityHidden(item.alt.isEmpty)
                case .failure:
                    unavailable(retryable: true)
                case .empty:
                    loading
                @unknown default:
                    loading
                }
            }
            .id(attempt)
        } else {
            unavailable(retryable: false)
        }
    }

    private var loading: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityElement()
            .accessibilityLabel(item.alt)
            .accessibilityValue(loadingLabel)
    }

    @ViewBuilder
    private func unavailable(retryable: Bool) -> some View {
        let content = Text(unavailableLabel)
            .font(KozmosTypography.subheadline)
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
            .multilineTextAlignment(.center)
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
            .accessibilityElement()
            .accessibilityLabel(item.alt.isEmpty ? unavailableLabel : "\(item.alt): \(unavailableLabel)")
        if retryable {
            content
                .onTapGesture { attempt += 1 }
                .accessibilityAddTraits(.isButton)
                .accessibilityHint(retryHint)
                .accessibilityAction { attempt += 1 }
        } else {
            content.accessibilityAddTraits(.isImage)
        }
    }
}

private extension View {
    /// Snaps the strip to a tile where the OS can. iOS 16 scrolls freely and
    /// still tracks the nearest tile; snapping arrived with iOS 17.
    @ViewBuilder func kozmosViewAlignedScrolling() -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            self.scrollTargetBehavior(.viewAligned)
        } else {
            self
        }
    }

    @ViewBuilder func kozmosScrollTargetLayout() -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            self.scrollTargetLayout()
        } else {
            self
        }
    }
}
