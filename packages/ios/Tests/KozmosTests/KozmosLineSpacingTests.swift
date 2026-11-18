import SwiftUI
import XCTest
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// Every line spacing Kozmos gives SwiftUI is one SwiftUI draws.
///
/// SwiftUI sets no line tighter than the font's own: a negative
/// `lineSpacing` can take away a text style's leading, and nothing more. Past
/// that it is ignored without a word, and the lines fall at the platform's
/// limit, as a wrapped display headline's do (decision 203, #575: 57.3pt
/// apart at 48pt bold where the web's are 54). So each spacing below is
/// checked twice at the default text size: it takes away no more than its
/// style's leading, and drawn, it moves two lines apart by all of it.
///
/// `pnpm ios:line-spacing:check` fails when a `.lineSpacing` in the package
/// passes anything but one of KozmosTypography's spacings, or when one of
/// them is missing from `spacings` here, so a new one is checked as it lands.
final class KozmosLineSpacingTests: XCTestCase {
    #if os(iOS)
    private struct Spacing {
        let name: String
        let style: UIFont.TextStyle
        let font: Font
        let value: CGFloat
    }

    private static let spacings: [Spacing] = [
        Spacing(
            name: "caption2On14ptLineSpacing",
            style: .caption2,
            font: KozmosTypography.caption2,
            value: KozmosTypography.caption2On14ptLineSpacing
        ),
        Spacing(
            name: "footnoteOn16ptLineSpacing",
            style: .footnote,
            font: KozmosTypography.footnote,
            value: KozmosTypography.footnoteOn16ptLineSpacing
        ),
    ]

    private func preferred(_ style: UIFont.TextStyle) -> UIFont {
        UIFont.preferredFont(
            forTextStyle: style,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
    }

    /// The height a view needs on a 390pt-wide screen at the default text size.
    @MainActor private func height<V: View>(_ view: V) -> CGFloat {
        let host = UIHostingController(rootView: view.environment(\.dynamicTypeSize, .large))
        return host.sizeThatFits(in: CGSize(width: 390, height: 10_000)).height
    }

    /// The distance between two lines of a style, at a spacing.
    @MainActor private func pitch(_ font: Font, spacing: CGFloat) -> CGFloat {
        let one = height(Text("Gate").font(font).lineSpacing(spacing))
        let two = height(Text("Gate\nGate").font(font).lineSpacing(spacing))
        return two - one
    }

    /// No spacing takes away more than its style's own leading.
    func testNoSpacingIsTighterThanItsStylesOwnLine() {
        for spacing in Self.spacings {
            // caption2's leading is negative (-0.13pt): there is nothing to take away.
            let leading = max(0, preferred(spacing.style).leading)
            XCTAssertGreaterThanOrEqual(
                spacing.value,
                -leading - 0.01,
                "\(spacing.name) is \(spacing.value), past \(spacing.style.rawValue)'s own leading of \(leading): SwiftUI cannot set its lines that close"
            )
        }
    }

    /// Drawn, each spacing moves two lines apart by all of itself: SwiftUI
    /// ignored none of it.
    @MainActor func testSwiftUIDrawsEverySpacing() {
        for spacing in Self.spacings {
            let natural = pitch(spacing.font, spacing: 0)
            let drawn = pitch(spacing.font, spacing: spacing.value)
            XCTAssertEqual(
                drawn - natural,
                spacing.value,
                accuracy: 0.5,
                "\(spacing.name): lines \(natural) apart, \(drawn) at a spacing of \(spacing.value)"
            )
        }
    }
    #endif
}
