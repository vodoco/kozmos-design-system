import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

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

/// Where a ring's label is drawn, React's `labelPlacement`: in the hole, or
/// beside the ring at the inline end, so on its left right to left.
public enum KozmosProgressLabelPlacement: String, CaseIterable, Sendable {
    case center
    case end
}

/// Where a bar sits, React's `placement` (GAP-159). A ring has one placement.
public enum KozmosProgressPlacement: String, CaseIterable, Sendable {
    /// In the flow: the bar as it is drawn anywhere else.
    case inline
    /// The screen's loading bar: edge to edge, 4 tall (layout spacing 50)
    /// and square. Where it sits is the caller's: put it at the top of the
    /// screen with `.overlay(alignment: .top) { KozmosProgress(placement:
    /// .top) }`, or `.safeAreaInset(edge: .top)` to push the content down.
    case top

    /// The bar's thickness: 8 in the flow, as React's `h-2`, and 4 at the
    /// top, as React's `.kozmos-progress-top` and Pointr Cloud's loading bar.
    public var height: CGFloat {
        switch self {
        case .inline: return KozmosDimensions.primitivesLayoutSpacing100
        case .top: return KozmosDimensions.primitivesLayoutSpacing50
        }
    }
}

/// The indeterminate bar's sweep (GAP-159), React's `kozmos-progress-sweep`:
/// a segment a quarter of the track wide goes from wholly before the inline
/// start to wholly past the inline end every 2 s, linear, for as long as the
/// wait lasts. Under Reduce Motion it stands still in the middle of the
/// track, where it reads as a wait and not as a value. Kept apart from the
/// view so the motion can be tested without drawing.
enum KozmosProgressSweep {
    /// A quarter of the track.
    static let width: Double = 0.25
    /// One sweep, start to end: Pointr Cloud's 2 s.
    static let period: Double = 2
    /// Where the segment's inline start stands under Reduce Motion: centred.
    static let still: Double = (1 - width) / 2

    /// Where the segment's inline start is, as a fraction of the track from
    /// its inline start, at `time` seconds: -0.25 as a sweep begins, 1 as it
    /// ends.
    static func start(at time: Double, reduceMotion: Bool) -> Double {
        guard !reduceMotion, time.isFinite else { return still }
        let phase = time.truncatingRemainder(dividingBy: period) / period
        let wrapped = phase < 0 ? phase + 1 : phase
        return -width + (1 + width) * wrapped
    }

    /// The segment's left edge in a track `trackWidth` across: right to left
    /// the inline start is the right edge, so the sweep runs from the right.
    static func x(start: Double, trackWidth: CGFloat, direction: LayoutDirection) -> CGFloat {
        let left = direction == .rightToLeft ? 1 - start - width : start
        return CGFloat(left) * trackWidth
    }
}

/// When an indeterminate bar speaks (GAP-159): once, as the wait starts.
/// The sweep changes nothing VoiceOver reads, so nothing more is said while
/// it moves; a value ends the wait, and the next wait is said again.
struct KozmosProgressAnnouncer: Equatable {
    private(set) var said = false

    /// What to announce now that the bar is, or is not, indeterminate.
    mutating func next(indeterminate: Bool, label: String) -> String? {
        guard indeterminate else {
            said = false
            return nil
        }
        guard !said, !label.isEmpty else { return nil }
        said = true
        return label
    }
}

public struct KozmosProgress: View {
    let value: Double
    let total: Double
    let shape: KozmosProgressShape
    let size: KozmosProgressSize
    let tone: KozmosEmotion
    let labelPlacement: KozmosProgressLabelPlacement
    let label: AnyView?
    let placement: KozmosProgressPlacement
    let indeterminate: Bool
    let spokenLabel: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var announcer = KozmosProgressAnnouncer()

    /// The indeterminate bar (GAP-159): a segment sweeping from the inline
    /// start to the inline end every 2 s, theme 600 on the bar's track, for
    /// as long as the wait lasts; still and centred under Reduce Motion.
    /// `placement: .top` is the screen's 4 tall loading bar.
    ///
    /// VoiceOver reads it as `label`, with no value, and it is announced
    /// once, politely, when it appears.
    public init(placement: KozmosProgressPlacement = .inline, label: String = "Loading") {
        self.value = 0
        self.total = 1.0
        self.shape = .linear
        self.size = .md
        self.tone = .themed
        self.labelPlacement = .center
        self.label = nil
        self.placement = placement
        self.indeterminate = true
        self.spokenLabel = label
    }

    /// A bar, or with `shape: .circular` a ring of `size` whose arc is
    /// `tone`'s colour: Tag's and Button's emotions, `.themed` (the bar's
    /// own theme 600) by default.
    /// A bar takes `placement: .top` to be the screen's 4 tall loading bar
    /// (GAP-159); a ring ignores it.
    public init(
        value: Double,
        total: Double = 1.0,
        shape: KozmosProgressShape = .linear,
        size: KozmosProgressSize = .md,
        tone: KozmosEmotion = .themed,
        placement: KozmosProgressPlacement = .inline
    ) {
        self.value = value
        self.total = total
        self.shape = shape
        self.size = size
        self.tone = tone
        self.labelPlacement = .center
        self.label = nil
        self.placement = placement
        self.indeterminate = false
        self.spokenLabel = ""
    }

    /// A ring with `label` in its centre, or beside it with
    /// `labelPlacement: .end`: "11 Levels Added in total", or a percentage.
    /// It is the caption step, 12 on 16, unless its content says otherwise.
    /// The label's words name the ring for VoiceOver, with its value; an
    /// `accessibilityLabel` of the caller's replaces them. A bar draws no
    /// label.
    public init<Label: View>(
        value: Double,
        total: Double = 1.0,
        shape: KozmosProgressShape,
        size: KozmosProgressSize = .md,
        tone: KozmosEmotion = .themed,
        labelPlacement: KozmosProgressLabelPlacement = .center,
        @ViewBuilder label: () -> Label
    ) {
        self.value = value
        self.total = total
        self.shape = shape
        self.size = size
        self.tone = tone
        self.labelPlacement = labelPlacement
        self.label = AnyView(label())
        self.placement = .inline
        self.indeterminate = false
        self.spokenLabel = ""
    }

    /// How much of the turn is done, from 0 to 1, as `ProgressView` clamps
    /// it; a value that is not a number, or a total of none, is none done.
    var fraction: Double {
        guard total > 0, value.isFinite, total.isFinite else { return 0 }
        return min(max(value / total, 0), 1)
    }

    /// What VoiceOver says for a ring's value: its percentage, as the bar's.
    var spokenValue: String { "\(Int((fraction * 100).rounded()))%" }

    /// "100%" is 31.8 wide at 12, in the 28.28 square an `.sm` hole holds
    /// (owner, 2 Nov), so a whole `.sm` ring with no label of the product's
    /// draws a check. Over the total is whole too, as `fraction` clamps it.
    var drawsCheck: Bool { size == .sm && label == nil && fraction >= 1 }

    /// A new value sweeps the arc round, over the standard duration; under
    /// Reduce Motion it is drawn there at once.
    static func sweep(reduceMotion: Bool) -> Animation? {
        reduceMotion ? nil : KozmosMotion.standard
    }

    /// Where a bar sits: a ring is always in the flow.
    var resolvedPlacement: KozmosProgressPlacement {
        shape == .circular ? .inline : placement
    }

    public var body: some View {
        if shape == .circular {
            ring
        } else if indeterminate {
            KozmosIndeterminateBar(placement: resolvedPlacement)
                .accessibilityElement()
                .accessibilityLabel(spokenLabel)
                .onAppear { say(indeterminate: true) }
                .onDisappear { announcer = KozmosProgressAnnouncer() }
        } else if resolvedPlacement == .top {
            KozmosTopBar(fraction: fraction)
                .accessibilityElement()
                .accessibilityValue(spokenValue)
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

    /// The dial, and its label beside it at the inline end when asked: an
    /// HStack, so right to left the label is on its left. One element: the
    /// label's words, and how far it has got. The label is the caption step
    /// on either path, 12 on 16 as React's ring sets it, until its content
    /// says otherwise: at body's 17, "75%" broke over two lines in an `.sm`
    /// ring. Its colour is `.primary`, foreground 0's black and white.
    private var ring: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            dial
            if labelPlacement == .end, let label {
                label.multilineTextAlignment(.leading)
            }
        }
        .font(KozmosTypography.caption)
        .accessibilityElement(children: .combine)
        .accessibilityValue(spokenValue)
        .accessibilityAddTraits(.updatesFrequently)
    }

    /// The track and the arc are one circle's strokes, drawn inside the
    /// dial's frame: the arc is the tone's emotion text colour, `.themed`'s
    /// theme 600 by default, as the bar's fill, on background 100: 4.8:1 or
    /// more for every tone, light and dark. It starts at 12 o'clock and runs
    /// clockwise. A progress ring does not mirror, so it is drawn in a
    /// left-to-right environment: right to left SwiftUI turns a rotation, and
    /// a shape, the other way. The check is `check`'s symbol in the arc's
    /// colour, 17.5 across as React's, inside the 28.28 square the hole
    /// holds. It says the percentage rather than its own name, so a ring with
    /// no other name says 100%, and a name of the caller's replaces that.
    private var dial: some View {
        ZStack {
            ZStack {
                Circle()
                    .strokeBorder(KozmosColors.primitivesColorsBackground100, lineWidth: size.stroke)
                Circle()
                    .inset(by: size.stroke / 2)
                    .trim(from: 0, to: fraction)
                    .stroke(
                        tone.text,
                        style: StrokeStyle(lineWidth: size.stroke, lineCap: .butt)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(Self.sweep(reduceMotion: reduceMotion), value: fraction)
            }
            .environment(\.layoutDirection, .leftToRight)
            if labelPlacement == .center, let label {
                // Inside the square the hole holds, centred, in the reading
                // direction's own order.
                label
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: (size.diameter - 2 * size.stroke) * 0.7071)
            }
            if drawsCheck {
                Image(systemName: KozmosIcon.symbolName(for: "check"))
                    .font(.system(size: KozmosIconSize.md.pointSize, weight: .semibold))
                    .foregroundColor(tone.text)
                    .accessibilityLabel(spokenValue)
            }
        }
        .frame(width: size.diameter, height: size.diameter)
    }
}

extension KozmosProgress {
    /// Posts the bar's words once per wait, politely, queued behind what
    /// VoiceOver is already saying, as React's `role="status"` is.
    fileprivate func say(indeterminate: Bool) {
        guard let message = announcer.next(indeterminate: indeterminate, label: spokenLabel) else { return }
        #if canImport(UIKit)
        UIAccessibility.post(
            notification: .announcement,
            argument: NSAttributedString(
                string: message,
                attributes: [.accessibilitySpeechQueueAnnouncement: true]
            )
        )
        #endif
    }
}

/// The indeterminate bar's drawing: the track, the bar's own background 200
/// (React's `bg-secondary`), and the theme 600 segment, clipped to it. In the
/// flow its ends are round; at the top it is square. The clock runs only
/// while the scene is active and motion is allowed.
struct KozmosIndeterminateBar: View {
    let placement: KozmosProgressPlacement
    @Environment(\.layoutDirection) private var direction
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        Group {
            if reduceMotion {
                drawing(start: KozmosProgressSweep.still)
            } else {
                TimelineView(.animation(minimumInterval: 1 / 60, paused: scenePhase != .active)) { timeline in
                    drawing(start: KozmosProgressSweep.start(
                        at: timeline.date.timeIntervalSinceReferenceDate, reduceMotion: false))
                }
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: placement.height)
    }

    private func drawing(start: Double) -> some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            ZStack(alignment: .topLeading) {
                Rectangle().fill(KozmosColors.primitivesColorsBackground200)
                Rectangle()
                    .fill(KozmosColors.primitivesColorsTheme600)
                    .frame(width: width * CGFloat(KozmosProgressSweep.width), height: geometry.size.height)
                    .offset(x: KozmosProgressSweep.x(start: start, trackWidth: width, direction: direction))
            }
            // Placed in physical points already: SwiftUI must not mirror it again.
            .environment(\.layoutDirection, .leftToRight)
            .clipShape(KozmosProgressBarShape(placement: placement))
        }
    }
}

/// A determinate bar at the top (GAP-159): 4 tall and square, filled from
/// the inline start as far as the value, theme 600 on background 200.
struct KozmosTopBar: View {
    let fraction: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle().fill(KozmosColors.primitivesColorsBackground200)
                Rectangle()
                    .fill(KozmosColors.primitivesColorsTheme600)
                    .frame(width: geometry.size.width * CGFloat(fraction))
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: KozmosProgressPlacement.top.height)
    }
}

/// The bar's outline: a capsule in the flow, a rectangle at the top.
struct KozmosProgressBarShape: Shape {
    let placement: KozmosProgressPlacement
    func path(in rect: CGRect) -> Path {
        placement == .top ? Rectangle().path(in: rect) : Capsule().path(in: rect)
    }
}
