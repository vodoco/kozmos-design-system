import SwiftUI

/// Layout of the spinner, mirroring the React `Spinner.size`.
public enum KozmosSpinnerSize: String, CaseIterable, Sendable {
    case sm
    case md
    case lg
    case xl

    /// The `Spinner/size` scale (small, medium, large, xlarge): 16, 24, 32 and 48, as React's classes and
    /// the Figma variables draw them. The natives have no generated token for
    /// these — the four live as Figma component variables — so the scale is
    /// written here and on Compose until they reach `packages/tokens`.
    var points: CGFloat {
        switch self {
        case .sm: return 16
        case .md: return 24
        case .lg: return 32
        case .xl: return 48
        }
    }

    /// Stroke 2 in the icons' own 24 box, so the weight scales with the mark
    /// exactly as every Kozmos icon's does: `KozmosDimensions
    /// .primitivesIconStrokeMd` at 24, proportionally above and below.
    var lineWidth: CGFloat {
        KozmosDimensions.primitivesIconStrokeMd * points / 24
    }
}

/// Indeterminate loading: the system's arc, turning.
///
/// Before 2026-09-22 this was `ProgressView().tint(.blue)` — a hard-coded
/// SwiftUI blue that ignored the theme, at a size the caller could not set,
/// drawn as iOS's twelve-spoke wheel while React drew lucide's arc, Compose
/// drew material3's and Figma drew a dashed ellipse. Four drawings, no two
/// alike.
///
/// This is the one drawing: three quarters of a circle, round caps, taking its
/// colour from the foreground it sits in, so a spinner on a themed surface
/// follows the theme without being told. It rests when the visitor has asked
/// for less motion; the label still says what is happening.
public struct KozmosSpinner: View {
    private let size: KozmosSpinnerSize
    private let color: Color
    private let label: String

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var angle: Double = 0

    /// One turn a second, linear — the same turn React's `kozmos-spin` takes.
    static let turnDuration: Double = 1

    /// The colour is the theme's own text colour, as React's `currentColor` and
    /// Compose's themed foreground resolve to — not SwiftUI's implicit
    /// `.primary`, which follows the system appearance rather than the theme a
    /// Kozmos surface is drawing in. A control that has a foreground of its own
    /// — a button, an icon button — passes it in.
    public init(
        size: KozmosSpinnerSize = .md,
        color: Color = KozmosColors.primitivesColorsForeground0,
        label: String = "Loading"
    ) {
        self.size = size
        self.color = color
        self.label = label
    }

    public var body: some View {
        Circle()
            // From the top, three quarters of the way round. The quarter that
            // is missing is what reads as motion; a full ring turning shows
            // nothing at all.
            // Inset to the path's own radius before trimming: SwiftUI strokes
            // centred on the path, so an uninset circle paints half its width
            // outside the frame — a 48 spinner drew 52, measured. The path is
            // radius 9 in the icons' 24 box, as React's `d` is and as Compose
            // insets to, which puts the ink 2 units inside the edge on all
            // three.
            .inset(by: size.points / 8)
            .trim(from: 0, to: 0.75)
            .stroke(color, style: StrokeStyle(lineWidth: size.lineWidth, lineCap: .round))
            .rotationEffect(.degrees(-90 + angle))
            .frame(width: size.points, height: size.points)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.linear(duration: Self.turnDuration).repeatForever(autoreverses: false)) {
                    angle = 360
                }
            }
            .accessibilityElement()
            .accessibilityLabel(label)
            .accessibilityAddTraits(.updatesFrequently)
    }
}
