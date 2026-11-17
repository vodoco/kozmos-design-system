import SwiftUI
import XCTest
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// Decision 203 (GAP-272) on SwiftUI: one display size, 48pt bold on 54pt
/// lines from the display type tokens, as `KozmosText(style: .display)` and
/// `KozmosHeading(size: .display)`, which keeps its level as its rank. It
/// grows with Dynamic Type along the large title's curve, as Heading 1 does.
final class KozmosDisplaySizeTests: XCTestCase {
    func testTheDisplaySizeComesFromTheTokens() {
        XCTAssertEqual(KozmosTypography.displaySize, 48)
        XCTAssertEqual(KozmosTypography.displayLineHeight, 54)
        XCTAssertEqual(KozmosDimensions.semanticsTypographyDisplaySize, 48)
        XCTAssertEqual(KozmosDimensions.semanticsTypographyDisplayLineheight, 54)
        XCTAssertEqual(KozmosDimensions.semanticsTypographyDisplayLetterspacing, 0)
        XCTAssertTrue(KozmosTextStyle.allCases.contains(.display))
        XCTAssertEqual(KozmosHeadingSize.allCases, [.display])
    }

    #if os(iOS)
    /// The height a view needs on a 390pt-wide screen at a text size.
    @MainActor private func height<V: View>(_ view: V, at size: DynamicTypeSize = .large) -> CGFloat {
        let host = UIHostingController(rootView: view.environment(\.dynamicTypeSize, size))
        return host.sizeThatFits(in: CGSize(width: 390, height: 10_000)).height
    }

    /// At the default text size, one line is 48pt bold, as React's; Text and
    /// Heading draw it alike, and Heading 1 is smaller.
    @MainActor func testTextAndHeadingDrawTheDisplaySizeAt48ptBold() {
        let reference = height(Text("Gate").font(.system(size: 48, weight: .bold)))
        XCTAssertEqual(height(KozmosText("Gate", style: .display)), reference, accuracy: 0.5)
        XCTAssertEqual(height(KozmosHeading("Gate", level: .h2, size: .display)), reference, accuracy: 0.5)
        XCTAssertLessThan(height(KozmosHeading("Gate", level: .h1)), reference - 8)
    }

    /// Its lines are 54pt apart, as React's 48px headline sits on 54px lines.
    @MainActor func testTheDisplaySizesLinesAre54ptApart() {
        let one = height(KozmosText("Gate", style: .display))
        let two = height(KozmosText("Gate\nGate", style: .display))
        XCTAssertEqual(two - one, 54, accuracy: 0.5, "one line \(one), two \(two)")
        let headingOne = height(KozmosHeading("Gate", size: .display))
        let headingTwo = height(KozmosHeading("Gate\nGate", size: .display))
        XCTAssertEqual(headingTwo - headingOne, 54, accuracy: 0.5, "heading: one line \(headingOne), two \(headingTwo)")
    }

    /// It grows with the reader's text size, as Heading 1 does.
    @MainActor func testTheDisplaySizeGrowsWithTheReadersTextSize() {
        for view in [AnyView(KozmosText("Gate", style: .display)), AnyView(KozmosHeading("Gate", size: .display))] {
            let normal = height(view)
            let large = height(view, at: .accessibility3)
            XCTAssertGreaterThan(large, normal * 1.3, "from \(normal) to \(large)")
        }
    }
    #endif
}
