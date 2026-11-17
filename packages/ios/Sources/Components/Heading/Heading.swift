import SwiftUI

/// Heading rank, mirroring the React `Heading.level` prop.
///
/// Rank drives both the type scale and the accessibility heading level, so
/// VoiceOver's rotor reflects the same document outline the web renders.
public enum KozmosHeadingLevel: Int, CaseIterable, Sendable {
    case h1 = 1
    case h2 = 2
    case h3 = 3
    case h4 = 4
    case h5 = 5
    case h6 = 6

    /// Matches the React type scale (text-4xl … text-base).
    var fontSize: CGFloat {
        switch self {
        case .h1: return 36
        case .h2: return 30
        case .h3: return 24
        case .h4: return 20
        case .h5: return 18
        case .h6: return 16
        }
    }

    /// The Dynamic Type style nearest the level's size, whose curve the
    /// level grows along with the reader's text size, as React's rem and
    /// Compose's sp grow with theirs.
    var textStyle: Font.TextStyle {
        switch self {
        case .h1: return .largeTitle
        case .h2: return .title
        case .h3: return .title2
        case .h4: return .title3
        case .h5: return .headline
        case .h6: return .callout
        }
    }

    var accessibilityHeadingLevel: AccessibilityHeadingLevel {
        switch self {
        case .h1: return .h1
        case .h2: return .h2
        case .h3: return .h3
        case .h4: return .h4
        case .h5: return .h5
        case .h6: return .h6
        }
    }
}

/// A size a heading takes apart from its rank, as React's `Heading size`.
public enum KozmosHeadingSize: String, CaseIterable, Sendable {
    /// The one display size, 48pt bold on 54pt lines (decision 203), for a
    /// marketing-style headline such as a sign-in hero. The level stays the
    /// heading's rank for VoiceOver; only its size changes.
    case display
}

/// A ranked heading.
///
/// Mirrors the React `Heading` API. Unlike `Text`, rank is not styling — it is
/// document structure, so it is expressed as a variant rather than left to the
/// platform type system.
public struct KozmosHeading: View {
    private let text: String
    private let level: KozmosHeadingLevel
    private let size: KozmosHeadingSize?
    /// The level's size at the reader's text size: React's at the default.
    /// It was a fixed `.system(size:)`, which Dynamic Type never touches,
    /// until 2026-10-21.
    @ScaledMetric private var fontSize: CGFloat

    /// - Parameter size: `.display` draws the heading at the display size,
    ///   keeping `level` as its rank. Left out, the level's own size.
    public init(_ text: String, level: KozmosHeadingLevel = .h1, size: KozmosHeadingSize? = nil) {
        self.text = text
        self.level = level
        self.size = size
        // The display size grows along the large title's curve, as h1 does.
        _fontSize = size == .display
            ? ScaledMetric(wrappedValue: KozmosTypography.displaySize, relativeTo: .largeTitle)
            : ScaledMetric(wrappedValue: level.fontSize, relativeTo: level.textStyle)
    }

    public var body: some View {
        Text(text)
            .font(.system(size: fontSize, weight: .bold))
            .transformEnvironment(\.lineSpacing) { spacing in
                // The display size's lines 54pt apart, as React's.
                if size == .display { spacing = KozmosTypography.displayOn54ptLineSpacing }
            }
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
            .accessibilityAddTraits(.isHeader)
            .accessibilityHeading(level.accessibilityHeadingLevel)
    }
}

@available(*, deprecated, renamed: "KozmosHeading")
public typealias Heading = KozmosHeading
