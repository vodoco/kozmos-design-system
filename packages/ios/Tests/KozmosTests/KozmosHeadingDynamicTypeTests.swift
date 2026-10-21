import SwiftUI
import XCTest
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// React's heading is sized in rem, so it grows with the reader's text size,
/// and Compose's in sp. SwiftUI's was `.system(size:)` at a fixed point size,
/// which Dynamic Type never touches: at the largest text sizes the page's
/// body grew around headings that stayed as they were. Each level now grows
/// with Dynamic Type along the curve of the text style nearest its size,
/// and at the default text size it is exactly the size it was.
final class KozmosHeadingDynamicTypeTests: XCTestCase {
    #if os(iOS)
    /// The height a view needs on a 390pt-wide screen at a text size.
    @MainActor private func height<V: View>(_ view: V, at size: DynamicTypeSize) -> CGFloat {
        let host = UIHostingController(rootView: view.environment(\.dynamicTypeSize, size))
        return host.sizeThatFits(in: CGSize(width: 390, height: 10_000)).height
    }

    @MainActor func testEveryLevelGrowsWithTheReadersTextSize() {
        var unchanged: [String] = []
        for level in KozmosHeadingLevel.allCases {
            let heading = KozmosHeading("Gate", level: level)
            let normal = height(heading, at: .large)
            let large = height(heading, at: .accessibility3)
            if large < normal * 1.3 { unchanged.append("h\(level.rawValue): \(normal) → \(large)") }
        }
        XCTAssertEqual(unchanged, [], "levels that do not grow by a third from the default text size to accessibility 3")
    }

    /// At the default text size each level is the size React's is, as before.
    @MainActor func testAtTheDefaultTextSizeEachLevelKeepsItsSize() {
        for level in KozmosHeadingLevel.allCases {
            let reference = Text("Gate").font(.system(size: level.fontSize, weight: .bold))
            XCTAssertEqual(height(KozmosHeading("Gate", level: level), at: .large), height(reference, at: .large), accuracy: 0.5,
                           "h\(level.rawValue)")
        }
    }

    /// Each level grows as the text style nearest its size does: h1 as the
    /// large title, h2 the title, h3 title 2, h4 title 3, h5 the headline and
    /// h6 the callout, as UIKit scales them.
    @MainActor func testEachLevelGrowsAlongItsTextStyle() {
        let styles: [KozmosHeadingLevel: UIFont.TextStyle] = [
            .h1: .largeTitle, .h2: .title1, .h3: .title2, .h4: .title3, .h5: .headline, .h6: .callout
        ]
        let traits = UITraitCollection(preferredContentSizeCategory: .accessibilityExtraLarge)
        for level in KozmosHeadingLevel.allCases {
            let style = styles[level]!
            let size = UIFontMetrics(forTextStyle: style).scaledValue(for: level.fontSize, compatibleWith: traits)
            let reference = Text("Gate").font(.system(size: size, weight: .bold))
            XCTAssertEqual(height(KozmosHeading("Gate", level: level), at: .accessibility3), height(reference, at: .large), accuracy: 0.5,
                           "h\(level.rawValue) at accessibility 3, scaled as \(style.rawValue) to \(size)pt")
        }
    }

    /// The levels stay in order at every text size: a larger rank is never smaller.
    @MainActor func testTheLevelsKeepTheirOrderAtEveryTextSize() {
        for size in [DynamicTypeSize.xSmall, .large, .xxxLarge, .accessibility1, .accessibility5] {
            let heights = KozmosHeadingLevel.allCases.map { height(KozmosHeading("Gate", level: $0), at: size) }
            XCTAssertEqual(heights, heights.sorted(by: >), "\(size): \(heights)")
        }
    }
    #endif
}
