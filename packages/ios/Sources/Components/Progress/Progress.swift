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
            let line: (Double, Double) -> Path = { start, end in
                Path { path in path.move(to: CGPoint(x: x(start), y: 5)); path.addLine(to: CGPoint(x: x(end), y: 5)) }
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

public struct KozmosProgress: View {
    let value: Double
    let total: Double
    
    public init(value: Double, total: Double = 1.0) {
        self.value = value
        self.total = total
    }
    
    public var body: some View {
        ProgressView(value: value, total: total)
            .progressViewStyle(LinearProgressViewStyle(tint: .blue))
    }
}
