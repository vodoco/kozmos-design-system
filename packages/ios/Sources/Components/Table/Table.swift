import SwiftUI

public struct KozmosTable<Data: RandomAccessCollection, RowContent: View>: View where Data.Element: Identifiable {
    let data: Data
    let rowContent: (Data.Element) -> RowContent
    
    public init(_ data: Data, @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent) {
        self.data = data
        self.rowContent = rowContent
    }
    
    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            ForEach(data) { item in
                VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                    rowContent(item)
                    Divider().overlay(KozmosColors.semanticsBorderSubtle)
                }
            }
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.primitivesColorsBackground300, lineWidth: 1)
        )
    }
}

/// A row's highlight (GAP-276): `.new`, a row just added.
public enum KozmosTableRowHighlight: Hashable, Sendable {
    /// A row just added, so the eye finds it: the informative surface, held
    /// three deliberate durations and faded over a fourth.
    case new

    /// How long the tint holds, and how long it fades, in seconds: 3 × and
    /// 1 × `KozmosMotion`'s deliberate duration, 1.84 s in all. Under Reduce
    /// Motion it holds the whole 1.84 s and clears with no fade.
    func timing(reduceMotion: Bool) -> (hold: TimeInterval, fade: TimeInterval) {
        let deliberate = KozmosMotion.semanticsMotionDurationDeliberate
        return reduceMotion ? (deliberate * 4, 0) : (deliberate * 3, deliberate)
    }
}

public struct KozmosTableRow<Content: View>: View {
    let highlight: KozmosTableRowHighlight?
    let content: Content
    @State private var tinted = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(@ViewBuilder content: () -> Content) {
        self.init(highlight: nil, content: content)
    }

    /// - Parameter highlight: `.new` for a row just added (GAP-276): it tints
    ///   in the informative surface when it appears and fades back, so the
    ///   eye finds it. `nil`, the default, draws the row as before.
    public init(highlight: KozmosTableRowHighlight?, @ViewBuilder content: () -> Content) {
        self.highlight = highlight
        self.content = content()
    }

    /// The row's fill: the informative surface while a highlight is shown,
    /// else none.
    static func fill(highlight: KozmosTableRowHighlight?, shown: Bool) -> Color {
        highlight != nil && shown ? KozmosColors.semanticsEmotionInformativeSurface : Color.clear
    }

    public var body: some View {
        HStack {
            content
        }
        .padding()
        .background(Self.fill(highlight: highlight, shown: tinted))
        .task(id: highlight) { await run() }
    }

    /// Shows the tint, holds it, then fades it with the standard curve, or,
    /// under Reduce Motion, clears it at once.
    @MainActor private func run() async {
        guard let highlight else {
            tinted = false
            return
        }
        let timing = highlight.timing(reduceMotion: reduceMotion)
        tinted = true
        try? await Task.sleep(nanoseconds: UInt64(timing.hold * 1_000_000_000))
        guard !Task.isCancelled else { return }
        if timing.fade > 0 {
            withAnimation(KozmosMotion.semanticsMotionEasingStandard.animation(duration: timing.fade)) { tinted = false }
        } else {
            tinted = false
        }
    }
}

public struct KozmosTableCell: View {
    let text: String
    
    public init(_ text: String) {
        self.text = text
    }
    
    public var body: some View {
        Text(text)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
