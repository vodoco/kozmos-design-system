import SwiftUI

/// What the placeholder stands in for, which is all that decides its shape.
///
/// `line` is a row of text; `block` a card, a media tile, a panel; `circle` an
/// avatar or a round icon button. The three are React's `shape` and the Figma
/// set's `Shape` axis, so a loading state drawn in one place reads the same in
/// the others (row 56, GAP-057).
public enum KozmosSkeletonShape: String, CaseIterable, Sendable {
    case line
    case block
    case circle
}

/// A placeholder while content loads: the surface's grey, with a sheen passing
/// across it — held still when the visitor has asked for less motion (GAP-50,
/// where the shimmer ran whatever the preference said, as React's pulse did).
///
/// Give it a `shape` and the space it holds, and a loading row needs no frame
/// of its own — which was the whole of row 56 (GAP-057): each loading state
/// wrote its own `.frame`, and each one guessed.
///
/// - A `line` stands in for text, so it is text-high and fills its row unless
///   told otherwise. Its height follows Dynamic Type, as React's `h-4` — 1rem —
///   follows the browser's text size; a `height` given is kept as given.
/// - A `block` has no size of its own. It is whatever it replaces, and
///   guessing would be worse than asking, so it fills what it is offered until
///   given a `width` or `height`.
/// - A `circle` is an avatar's 40 unless told otherwise, and takes `width` as
///   its diameter: a circle should not need telling twice.
///
/// Unset, `shape` draws as it always has — a square-cornered rectangle filling
/// whatever frame it is given, or the `width` and `height` it is told — so the
/// callers that sized it with `.frame` keep the placeholder they had. React's
/// default is `line`; here a line is asked for by name.
public struct KozmosSkeleton: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: CGFloat = 0

    let shape: KozmosSkeletonShape?
    let width: CGFloat?
    let height: CGFloat?

    /// A line's height when it is given none: React's 16 at the default text
    /// size, growing with the text a line stands in for.
    @ScaledMetric(relativeTo: .body)
    private var lineHeight: CGFloat = KozmosDimensions.primitivesLayoutSizing200

    public init(shape: KozmosSkeletonShape? = nil, width: CGFloat? = nil, height: CGFloat? = nil) {
        self.shape = shape
        self.width = width
        self.height = height
    }

    public var body: some View {
        switch shape {
        case nil:
            surface(Rectangle())
                .frame(width: width, height: height)
        // The Control radius, circular as CSS and Figma draw it: on a line
        // lower than twice the radius the corners meet in round ends, where
        // continuous corners would flatten them.
        case .line?:
            surface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .circular))
                .frame(width: width, height: height ?? lineHeight)
        case .block?:
            surface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .circular))
                .frame(width: width, height: height)
        case .circle?:
            // A capsule is a circle in a square frame, and stays round-ended
            // when the product asks for a height of its own, as React's pill
            // radius does.
            let diameter = width ?? KozmosDimensions.primitivesLayoutSizing500
            surface(Capsule())
                .frame(width: diameter, height: height ?? diameter)
        }
    }

    /// The grey and its sheen, cut to the placeholder's outline. The unset
    /// placeholder is cut to a plain rectangle, as it always was.
    private func surface<Outline: Shape>(_ outline: Outline) -> some View {
        Rectangle()
            // Figma's `Colors/background/200`, as React and Android draw it.
            // iOS drew 300 until 2026-09-27, React and Android 100.
            .fill(KozmosColors.primitivesColorsBackground200)
            .overlay(
                GeometryReader { geometry in
                    Rectangle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [.clear, .white.opacity(0.4), .clear]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .offset(x: -geometry.size.width + (geometry.size.width * 2 * phase))
                        .animation(
                            reduceMotion
                                ? nil
                                : Animation.linear(duration: 1.5)
                                    .repeatForever(autoreverses: false),
                            value: phase
                        )
                }
            )
            .mask(outline)
            .onAppear {
                guard !reduceMotion else { return }
                phase = 1
            }
    }
}
