import SwiftUI
#if os(iOS)
import UIKit
#endif
import XCTest
@testable import Kozmos

/// Decision 151 (CLOUD-UI-009): the map's level control is a borderless
/// Select. React's SelectTrigger takes `variant="ghost"`; decision 88 puts it
/// on SwiftUI too, as `variant: .ghost` on KozmosSelectField and the
/// field-drawing KozmosSelect.
final class KozmosSelectGhostTests: XCTestCase {
    private func field(_ variant: KozmosSelectVariant, error: Bool = false) -> KozmosSelectField {
        KozmosSelectField(value: "Level 1", placeholder: "Level", error: error, variant: variant)
    }

    #if os(iOS)
    /// A colour as drawn in light and in dark, its components to 1/255:
    /// two Colors made from one token compare unequal as values.
    private func drawn(_ color: Color) -> [[Int]] {
        [UIUserInterfaceStyle.light, .dark].map { style in
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
            UIColor(color).resolvedColor(with: UITraitCollection(userInterfaceStyle: style))
                .getRed(&r, green: &g, blue: &b, alpha: &a)
            return [r, g, b, a].map { Int(($0 * 255).rounded()) }
        }
    }

    func testAGhostDrawsNoEdgeAndNoFillAtRest() {
        XCTAssertEqual(drawn(field(.ghost).fillColor).map { $0[3] }, [0, 0], "the ghost has a fill")
        XCTAssertEqual(drawn(field(.ghost).edgeColor).map { $0[3] }, [0, 0], "the ghost has an edge")
    }

    func testAGhostInErrorKeepsTheRedEdge() {
        XCTAssertEqual(drawn(field(.ghost, error: true).edgeColor), drawn(KozmosColors.primitivesColorsEmotionalDanger600))
    }

    func testTheFieldIsUnchangedByDefault() {
        XCTAssertEqual(KozmosSelectField(value: "Level 1", placeholder: "Level").variant, .default)
        XCTAssertEqual(drawn(field(.default).fillColor), drawn(KozmosColors.primitivesColorsBackground0))
        XCTAssertEqual(drawn(field(.default).edgeColor), drawn(KozmosColors.semanticsBorderInput))
        XCTAssertEqual(drawn(field(.default, error: true).edgeColor), drawn(KozmosColors.primitivesColorsEmotionalDanger600))
    }
    #endif

    #if os(iOS)
    /// A ghost is as wide as its value and chevron; the field takes the row.
    @MainActor func testAGhostHugsItsValueWhereTheFieldTakesTheRow() {
        func fieldWidth(_ variant: KozmosSelectVariant) -> CGFloat {
            let host = UIHostingController(rootView: field(variant))
            return host.sizeThatFits(in: CGSize(width: 390, height: 200)).width
        }
        XCTAssertEqual(fieldWidth(.default), 390, accuracy: 0.5, "the field no longer takes the row")
        XCTAssertLessThan(fieldWidth(.ghost), 150, "the ghost spans the row")
        XCTAssertGreaterThan(fieldWidth(.ghost), 40)
    }
    #endif

    /// The field-drawing Select hands the form to its field, and its Menu
    /// draws the hover fill while a ghost is pressed.
    func testTheSelectHandsTheFormToItsField() {
        let ghost = KozmosSelect(value: "Level 1", placeholder: "Level", variant: .ghost) { EmptyView() }
        XCTAssertTrue(ghost.ghost)
        XCTAssertEqual(ghost.trigger.variant, .ghost)
        let plain = KozmosSelect(value: "Level 1", placeholder: "Level") { EmptyView() }
        XCTAssertFalse(plain.ghost)
        XCTAssertEqual(plain.trigger.variant, .default)
    }
}
