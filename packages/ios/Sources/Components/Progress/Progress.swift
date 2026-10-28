import SwiftUI

public struct KozmosProgressRange: Hashable, Sendable {
    public let start: Double
    public let end: Double
    public init(start: Double, end: Double) { self.start = start; self.end = end }
    public var isValid: Bool { start.isFinite && end.isFinite && start >= 0 && end <= 1 && start < end }
    public func position(_ value: Double?) -> Double? {
        guard isValid, let value, value.isFinite, value >= start, value <= end else { return nil }
        return value
    }
    public func fill(_ value: Double?, mode: KozmosProgressPositionMode) -> KozmosProgressRange? {
        guard isValid else { return nil }
        if mode == .static { return self }
        guard let value = position(value), value > 0 else { return nil }
        return .init(start: 0, end: value)
    }
    public func flow(_ value: Double?, mode: KozmosProgressPositionMode) -> KozmosProgressRange? {
        guard isValid else { return nil }
        if mode == .static { return self }
        guard let value = position(value), value < end else { return nil }
        return .init(start: value, end: end)
    }
}
public enum KozmosProgressTrackAppearance: Sendable { case theme, gradient }
public enum KozmosProgressPositionMode: Sendable { case `static`, live }
public enum KozmosProgressMotion: Sendable {
    case none, directional
    func isEnabled(reduceMotion: Bool, isActive: Bool, hasRange: Bool) -> Bool {
        self == .directional && !reduceMotion && isActive && hasRange
    }
}

/// Decorative Core track. Its owning control supplies the accessibility semantics.
public struct KozmosProgressTrack: View {
    let activeRange: KozmosProgressRange?
    let value: Double?
    let appearance: KozmosProgressTrackAppearance
    let positionMode: KozmosProgressPositionMode
    let motion: KozmosProgressMotion
    @Environment(\.layoutDirection) private var direction
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    public init(activeRange: KozmosProgressRange?, value: Double?, appearance: KozmosProgressTrackAppearance = .theme,
                positionMode: KozmosProgressPositionMode = .live, motion: KozmosProgressMotion = .none) {
        self.activeRange = activeRange; self.value = value; self.appearance = appearance
        self.positionMode = positionMode; self.motion = motion
    }
    public var body: some View {
        Group {
            if motion.isEnabled(reduceMotion: reduceMotion, isActive: scenePhase == .active, hasRange: activeRange?.flow(value, mode: positionMode) != nil) {
                TimelineView(.animation(minimumInterval: 1 / 30)) { timeline in
                    drawing(phase: timeline.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 1) * 20)
                }
            } else { drawing(phase: 0) }
        }.frame(height: 10).accessibilityHidden(true)
    }
    private func drawing(phase: Double) -> some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let x: (Double) -> CGFloat = { CGFloat(self.direction == .rightToLeft ? 1 - $0 : $0) * width }
            let line: (Double, Double) -> KozmosProgressTrackLine = { start, end in
                KozmosProgressTrackLine(start: x(start), end: x(end))
            }
            ZStack {
                line(0, 1).stroke(KozmosColors.primitivesColorsBackground300, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                if let range = activeRange?.fill(value, mode: positionMode) {
                    let gradient = LinearGradient(colors: [KozmosColors.primitivesColorsTheme600,
                        appearance == .gradient ? KozmosColors.primitivesColorsEmotionalSuccess600 : KozmosColors.primitivesColorsTheme600],
                        startPoint: UnitPoint(x: direction == .rightToLeft ? 1 - range.start : range.start, y: 0.5),
                        endPoint: UnitPoint(x: direction == .rightToLeft ? 1 - range.end : range.end, y: 0.5))
                    gradient.mask(line(range.start, range.end).stroke(style: StrokeStyle(lineWidth: 6, lineCap: .round)))
                }
                if motion == .directional, let range = activeRange?.flow(value, mode: positionMode) {
                    line(range.start, range.end)
                        .stroke(positionMode == .static ? Color.white.opacity(0.65) : KozmosColors.primitivesColorsBackground600,
                                style: StrokeStyle(lineWidth: 3, lineCap: .round, dash: [5, 15], dashPhase: -phase))
                        .mask(line(range.start, range.end).stroke(style: StrokeStyle(lineWidth: 6, lineCap: .butt)))
                }
            }
        }
    }
}

/// A stretch of the track's line, between two points already placed for the
/// layout direction: the track mirrors them itself, so SwiftUI must not
/// mirror the line again. A `Path` mirrors itself in a right-to-left layout
/// in an app that deploys to iOS 17 or later and not in one that deploys to
/// iOS 16, so in the first the fill was drawn from the end, in the gradient's
/// last colour.
private struct KozmosProgressTrackLine: Shape {
    let start: CGFloat
    let end: CGFloat

    func path(in rect: CGRect) -> Path {
        Path { path in path.move(to: CGPoint(x: start, y: 5)); path.addLine(to: CGPoint(x: end, y: 5)) }
    }

    @available(iOS 17.0, macOS 14.0, *)
    var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
}

/// The two forms of `KozmosProgress`, React's `shape`: `linear`, the bar,
/// and `circular`, a ring with a label in its centre for a count out of a
/// total (decision 131, GAP-038).
public enum KozmosProgressShape: String, CaseIterable, Sendable {
    case linear
    case circular
}

/// A ring's size, React's `size`: the layout spacing tokens 600, 900 and
/// 1000 across (48, 96 and 128) and 50, 100 and 150 thick (4, 8 and 12). A
/// bar has one size.
public enum KozmosProgressSize: String, CaseIterable, Sendable {
    case sm
    case md
    case lg

    public var diameter: CGFloat {
        switch self {
        case .sm: return KozmosDimensions.primitivesLayoutSpacing600
        case .md: return KozmosDimensions.primitivesLayoutSpacing900
        case .lg: return KozmosDimensions.primitivesLayoutSpacing1000
        }
    }

    public var stroke: CGFloat {
        switch self {
        case .sm: return KozmosDimensions.primitivesLayoutSpacing50
        case .md: return KozmosDimensions.primitivesLayoutSpacing100
        case .lg: return KozmosDimensions.primitivesLayoutSpacing150
        }
    }
}

public struct KozmosProgress: View {
    let value: Double
    let total: Double
    let shape: KozmosProgressShape
    let size: KozmosProgressSize
    let label: AnyView?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(
        value: Double,
        total: Double = 1.0,
        shape: KozmosProgressShape = .linear,
        size: KozmosProgressSize = .md
    ) {
        self.value = value
        self.total = total
        self.shape = shape
        self.size = size
        self.label = nil
    }

    /// A ring with `label` in its centre: "11 Levels Added", or a
    /// percentage. The label's words name the ring for VoiceOver, with its
    /// value; an `accessibilityLabel` of the caller's replaces them. A bar
    /// has no centre and draws no label.
    public init<Label: View>(
        value: Double,
        total: Double = 1.0,
        shape: KozmosProgressShape,
        size: KozmosProgressSize = .md,
        @ViewBuilder label: () -> Label
    ) {
        self.value = value
        self.total = total
        self.shape = shape
        self.size = size
        self.label = AnyView(label())
    }

    /// How much of the turn is done, from 0 to 1, as `ProgressView` clamps
    /// it; a value that is not a number, or a total of none, is none done.
    var fraction: Double {
        guard total > 0, value.isFinite, total.isFinite else { return 0 }
        return min(max(value / total, 0), 1)
    }

    /// What VoiceOver says for a ring's value: its percentage, as the bar's.
    var spokenValue: String { "\(Int((fraction * 100).rounded()))%" }

    /// A new value sweeps the arc round, over the standard duration; under
    /// Reduce Motion it is drawn there at once.
    static func sweep(reduceMotion: Bool) -> Animation? {
        reduceMotion ? nil : KozmosMotion.standard
    }

    public var body: some View {
        if shape == .circular {
            ring
        } else {
            ProgressView(value: value, total: total)
                // The theme's primary, as React's bg-primary (theme 600, light and
                // dark) and Compose's bar are: SwiftUI's .blue ignored the theme a
                // Kozmos surface draws in. .tint, as LinearProgressViewStyle(tint:)
                // is deprecated.
                .progressViewStyle(.linear)
                .tint(KozmosColors.primitivesColorsTheme600)
        }
    }

    /// The track and the arc are one circle's strokes, drawn inside the
    /// ring's frame: the arc is the theme fill (decision 59) on background
    /// 100, 4.42:1 light and 3.13:1 dark, and it starts at 12 o'clock and
    /// runs clockwise. A progress ring does not mirror, so it is drawn in a
    /// left-to-right environment: right to left SwiftUI turns a rotation, and
    /// a shape, the other way.
    private var ring: some View {
        ZStack {
            ZStack {
                Circle()
                    .strokeBorder(KozmosColors.primitivesColorsBackground100, lineWidth: size.stroke)
                Circle()
                    .inset(by: size.stroke / 2)
                    .trim(from: 0, to: fraction)
                    .stroke(
                        KozmosColors.primitivesColorsTheme500,
                        style: StrokeStyle(lineWidth: size.stroke, lineCap: .butt)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(Self.sweep(reduceMotion: reduceMotion), value: fraction)
            }
            .environment(\.layoutDirection, .leftToRight)
            if let label {
                // Inside the square the hole holds, centred, in the reading
                // direction's own order.
                label
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: (size.diameter - 2 * size.stroke) * 0.7071)
            }
        }
        .frame(width: size.diameter, height: size.diameter)
        // One element: the label's words, and how far it has got.
        .accessibilityElement(children: .combine)
        .accessibilityValue(spokenValue)
        .accessibilityAddTraits(.updatesFrequently)
    }
}
