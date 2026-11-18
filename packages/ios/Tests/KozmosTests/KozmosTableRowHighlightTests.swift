import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-276 (decision 186): a just-added row tints in the informative
/// surface, holds it three deliberate durations and fades over a fourth,
/// with the standard easing; under Reduce Motion it shows and clears, with
/// no animation, at the same 4 × deliberate mark. A row with no highlight
/// is drawn as before.
/// Two colours as drawn in one environment: a theme colour is a new
/// dynamic colour each time it is read, so two reads are never `==`.
func kozmosSameColour(_ a: Color, _ b: Color, file: StaticString = #filePath, line: UInt = #line) {
    if #available(iOS 17, macOS 14, macCatalyst 17, *) {
        for scheme in [ColorScheme.light, .dark] {
            var environment = EnvironmentValues()
            environment.colorScheme = scheme
            XCTAssertEqual(a.resolve(in: environment), b.resolve(in: environment), "\(scheme)", file: file, line: line)
        }
    }
}

final class KozmosTableRowHighlightTests: XCTestCase {
    func testTheTintHoldsThenFadesOverADeliberateDuration() {
        let deliberate = KozmosMotion.semanticsMotionDurationDeliberate
        let timing = KozmosTableRowHighlight.new.timing(reduceMotion: false)
        XCTAssertEqual(timing.hold, deliberate * 3, accuracy: 0.0001)
        XCTAssertEqual(timing.fade, deliberate, accuracy: 0.0001)
        XCTAssertEqual(timing.hold + timing.fade, 1.84, accuracy: 0.0001)
    }

    func testReduceMotionShowsAndClearsWithNoFade() {
        let timing = KozmosTableRowHighlight.new.timing(reduceMotion: true)
        XCTAssertEqual(timing.hold, KozmosMotion.semanticsMotionDurationDeliberate * 4, accuracy: 0.0001)
        XCTAssertEqual(timing.fade, 0)
    }

    func testTheTintIsTheInformativeSurfaceAndAPlainRowHasNone() {
        kozmosSameColour(KozmosTableRow<EmptyView>.fill(highlight: .new, shown: true), KozmosColors.semanticsEmotionInformativeSurface)
        kozmosSameColour(KozmosTableRow<EmptyView>.fill(highlight: .new, shown: false), Color.clear)
        kozmosSameColour(KozmosTableRow<EmptyView>.fill(highlight: nil, shown: true), Color.clear)
        // Both calls compile: the released one and the highlighted one.
        _ = KozmosTableRow { KozmosTableCell("Gate A12") }
        _ = KozmosTableRow(highlight: .new) { KozmosTableCell("Gate A12") }
    }
}
