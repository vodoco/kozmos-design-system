import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 131 (GAP-038): Progress's ring, a count out of a total, as
/// React's `shape="circular"` draws it. The drawing is read back from what
/// SwiftUI paints, without a window, so all but the VoiceOver test run in
/// `swift test` on a Mac too.
final class KozmosProgressRingTests: XCTestCase {
    private typealias Ink = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    func testTheSizesAreTheSpacingTokens() {
        XCTAssertEqual(KozmosProgressSize.allCases.map(\.rawValue), ["sm", "md", "lg"])
        XCTAssertEqual(KozmosProgressSize.allCases.map(\.diameter), [48, 96, 128])
        XCTAssertEqual(KozmosProgressSize.allCases.map(\.stroke), [4, 8, 12])
        XCTAssertEqual(KozmosProgressShape.allCases.map(\.rawValue), ["linear", "circular"])
    }

    func testTheValueIsItsShareOfTheTotalAndSaidAsAPercentage() {
        let levels = KozmosProgress(value: 11, total: 15, shape: .circular, size: .lg) { Text("11") }
        XCTAssertEqual(levels.fraction, 11.0 / 15, accuracy: 1e-9)
        XCTAssertEqual(levels.spokenValue, "73%")
        XCTAssertEqual(KozmosProgress(value: 20, total: 15, shape: .circular).fraction, 1)
        XCTAssertEqual(KozmosProgress(value: -1, shape: .circular).fraction, 0)
        XCTAssertEqual(KozmosProgress(value: .nan, shape: .circular).fraction, 0)
        XCTAssertEqual(KozmosProgress(value: 3, total: 0, shape: .circular).fraction, 0)
    }

    func testReduceMotionDrawsANewValueAtOnce() {
        XCTAssertNil(KozmosProgress.sweep(reduceMotion: true))
        XCTAssertNotNil(KozmosProgress.sweep(reduceMotion: false))
    }

    /// The theme fill, #135BEC in both themes, or not.
    private func isArc(_ ink: Ink) -> Bool {
        ink.a > 200 && abs(Int(ink.r) - 0x13) <= 24 && abs(Int(ink.g) - 0x5B) <= 24 && abs(Int(ink.b) - 0xEC) <= 24
    }

    /// Walking the ring's middle clockwise from 12 o'clock, half a degree at
    /// a time: whether each step is the arc.
    @MainActor private func walk(_ value: Double, _ total: Double, _ direction: LayoutDirection) throws -> [Bool] {
        let drawn = try DrawnPixels.draw(
            KozmosProgress(value: value, total: total, shape: .circular, size: .lg)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light),
            scale: 2)
        XCTAssertEqual(drawn.size.width, 128, accuracy: 0.5)
        let centre = drawn.size.width / 2, radius = (128.0 - 12) / 2
        return (0..<720).map { step in
            let a = Double(step) / 2 * .pi / 180
            return isArc(drawn.pixel(at: CGPoint(x: centre + radius * sin(a), y: centre - radius * cos(a))))
        }
    }

    /// The arc is one run from 12 o'clock, clockwise, as long as the value's
    /// share of the turn, left to right and right to left: a progress ring
    /// does not mirror. Right to left, SwiftUI turns a rotation the other
    /// way, which would have started it at 6 o'clock and run it anticlockwise.
    @MainActor func testTheArcRunsClockwiseFromTwelveInBothDirections() throws {
        var wrong: [String] = []
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            for (value, total) in [(0.0, 1.0), (0.25, 1.0), (11.0, 15.0), (0.5, 1.0), (0.75, 1.0), (1.0, 1.0)] {
                let arc = try walk(value, total, direction)
                let expected = value / total * 360
                let drawn = Double(arc.filter { $0 }.count) / 2
                let run = Double(arc.firstIndex(of: false) ?? 720) / 2
                let name = "\(direction == .leftToRight ? "LTR" : "RTL") \(value)/\(total)"
                if abs(drawn - expected) > 2 { wrong.append("\(name): \(drawn)° of arc, not \(expected)°") }
                if abs(run - expected) > 2 { wrong.append("\(name): a run of \(run)° clockwise from 12, not \(expected)°") }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    /// At a full ring the painted band is the size's stroke all the way
    /// round, and inside the frame: nothing inset, nothing off centre.
    @MainActor func testTheBandIsTheStrokeAllTheWayRound() throws {
        var wrong: [String] = []
        for size in KozmosProgressSize.allCases {
            let scale: CGFloat = 4
            // With a clear margin, so a ray read past the ring's edge reads
            // nothing rather than the edge's pixel again.
            let drawn = try DrawnPixels.draw(
                KozmosProgress(value: 1, shape: .circular, size: size)
                    .padding(4)
                    .environment(\.colorScheme, .light),
                scale: scale)
            XCTAssertEqual(drawn.size.width, size.diameter + 8, accuracy: 0.5)
            let centre = size.diameter / 2 + 4
            var bands: [Double] = []
            for degrees in stride(from: 0.0, to: 360, by: 10) {
                let a = degrees * .pi / 180
                var covered = 0
                var r = size.diameter / 2 - size.stroke - 2
                while r < size.diameter / 2 + 2 {
                    if isArc(drawn.pixel(at: CGPoint(x: centre + r * sin(a), y: centre - r * cos(a)))) { covered += 1 }
                    r += 1 / scale
                }
                bands.append(Double(covered) / scale)
            }
            if let low = bands.min(), let high = bands.max(),
               low < size.stroke - 0.75 || high > size.stroke + 0.75 {
                wrong.append("\(size): the band is \(low)–\(high), not \(size.stroke)")
            }
        }
        XCTAssertEqual(wrong, [])
    }

    /// The label sits in the hole, centred, inside the square it holds.
    @MainActor func testTheLabelIsCentredInTheHole() throws {
        let drawn = try DrawnPixels.draw(
            KozmosProgress(value: 0, shape: .circular, size: .lg) {
                Text("11").font(.system(size: 30, weight: .semibold)).foregroundColor(.black)
            }
            .environment(\.colorScheme, .light),
            scale: 2)
        let ink = try XCTUnwrap(drawn.boundingBox { r, g, b, a in a > 200 && r < 80 && g < 80 && b < 80 })
        XCTAssertEqual(ink.midX, 64, accuracy: 1.5)
        XCTAssertEqual(ink.midY, 64, accuracy: 3)
        let hole = (128.0 - 24) / 2
        for corner in [CGPoint(x: ink.minX, y: ink.minY), CGPoint(x: ink.maxX, y: ink.maxY)] {
            XCTAssertLessThan(hypot(corner.x - 64, corner.y - 64), hole)
        }
    }

    #if os(iOS)
    /// One element: the label's words with the value, said once; a value
    /// or a name of the caller's replaces Kozmos's.
    @MainActor func testTheRingIsOneElementNamedByItsLabelWithItsValue() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let levels = { (named: Bool) -> AnyView in
            let ring = KozmosProgress(value: 11, total: 15, shape: .circular, size: .lg) {
                VStack(spacing: 0) {
                    Text("11")
                    Text("Levels Added in total")
                }
            }
            return named
                ? AnyView(ring.accessibilityLabel("Levels").accessibilityValue("11 of 15"))
                : AnyView(ring)
        }
        for named in [false, true] {
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
            window.rootViewController = UIHostingController(rootView: levels(named))
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let found = elements(in: window)
            let labels = found.compactMap(\.accessibilityLabel)
            XCTAssertEqual(found.count, 1, "\(labels)")
            guard let ring = found.first else { continue }
            if named {
                XCTAssertEqual(ring.accessibilityLabel, "Levels")
                XCTAssertEqual(ring.accessibilityValue, "11 of 15")
            } else {
                let label = ring.accessibilityLabel ?? ""
                XCTAssertTrue(label.contains("11") && label.contains("Levels Added in total"), label)
                XCTAssertEqual(label.components(separatedBy: "Levels Added in total").count, 2, label)
                XCTAssertEqual(ring.accessibilityValue, "73%")
            }
            XCTAssertTrue(ring.accessibilityTraits.contains(.updatesFrequently))
        }
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView { children = view.subviews }
        else { children = [] }
        return children.flatMap { elements(in: $0) }
    }

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let old = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return old
    }
    #endif
}
