import XCTest
import SwiftUI
@testable import Kozmos

/// What VoiceOver gets from the routing parts: one element per step, the
/// instruction first, the arrow silent; the summary's icon silent too.
final class KozmosDirectionStepTests: XCTestCase {
    func testAStepReadsAsInstructionThenDistanceThenDuration() {
        XCTAssertEqual(
            KozmosDirectionStep.accessibilityDescription(
                instruction: "Take Elevator down to First Floor", distance: "58 m", duration: "Second Floor"),
            "Take Elevator down to First Floor, 58 m, Second Floor")
    }

    func testAbsentAndEmptyPartsAreNotRead() {
        XCTAssertEqual(KozmosDirectionStep.accessibilityDescription(instruction: "Destination", distance: nil, duration: nil),
                       "Destination")
        XCTAssertEqual(KozmosDirectionStep.accessibilityDescription(instruction: "Turn Left", distance: "", duration: "First Floor"),
                       "Turn Left, First Floor")
    }


    #if os(iOS)
    @MainActor func testTransportAndTravelDirectionsHaveSixDistinctDrawings() async throws {
        var signatures = Set<String>()
        for type in [DirectionType.liftUp, .liftDown, .stairsUp, .stairsDown, .escalatorUp, .escalatorDown] {
            let pixels = try await RenderedPixels.render(KozmosDirectionStep(type: type, instruction: "").environment(\.colorScheme, .light), size: CGSize(width: 120, height: 80))
            let signature = (0..<80).flatMap { y in (0..<80).map { x -> String in
                let color = pixels.color(at: CGPoint(x: x, y: y))
                return RenderedPixels.isTheme(color.r, color.g, color.b) ? "1" : "0"
            } }.joined()
            signatures.insert(signature)
        }
        XCTAssertEqual(signatures.count, 6, "Transport and up/down must be visible, not only spoken")
    }

    @MainActor func testDurationOnlyIsDrawnAndAbsentMetricsLeaveNoText() async throws {
        for duration in [String?.none, "0 min"] {
            // An empty instruction isolates the metric pixels from antialiased
            // instruction text; spoken ordering is covered separately above.
            let view = KozmosDirectionStep(type: .left, instruction: "", duration: duration)
                .environment(\.colorScheme, .light)
                .background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 240, height: 80))
            // Inside the text column, excluding the border and the blue glyph:
            // only the optional metrics use this medium foreground shade.
            let metrics = pixels.count(in: CGRect(x: 70, y: 12, width: 150, height: 56)) { r, g, b in
                r > 90 && r < 180 && g > 90 && g < 180 && b > 90 && b < 180
                    && abs(Int(r) - Int(g)) < 20 && abs(Int(g) - Int(b)) < 20
            }
            if duration == nil {
                XCTAssertLessThan(metrics, 20)
            } else {
                XCTAssertGreaterThan(metrics, 40, "duration-only metric is not drawn")
            }
        }
    }

    /// Every direction has a glyph the platform can draw: rendered in the
    /// theme colour, each one leaves theme pixels behind.
    @MainActor func testEveryDirectionDrawsAnArrow() async throws {
        for type in DirectionType.allCases {
            let view = KozmosDirectionStep(type: type, instruction: "Go").padding(8).background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 240, height: 80))
            XCTAssertNotNil(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 80, height: 80), where: RenderedPixels.isTheme),
                            "\(type) draws no arrow: no such symbol")
        }
    }
    #endif
}
