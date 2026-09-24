import XCTest
import SwiftUI
@testable import Kozmos

/// Every step is a 32 circle, as Figma and React draw it, its ring inside the
/// circle: 2 for the current and completed steps, 1 for a pending one, as the
/// plugin paints them. Until 2026-09-22 SwiftUI drew 24 circles with a 2 ring
/// centred on the edge on every step.
final class KozmosStepperTests: XCTestCase {
    #if os(iOS)
    @MainActor func testStepsAre32CirclesWithThePluginsRings() async throws {
        let size = CGSize(width: 320, height: 90)
        let view = ZStack(alignment: .topLeading) {
            Color.white
            KozmosStepper(steps: ["Search", "Route", "Go"], currentStep: 1)
                .frame(width: 300)
                .padding(10)
        }
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: size)
        let near = { (r: UInt8, g: UInt8, b: UInt8, to: (Int, Int, Int), by: Int) -> Bool in
            abs(Int(r) - to.0) <= by && abs(Int(g) - to.1) <= by && abs(Int(b) - to.2) <= by
        }
        let theme = { (r: UInt8, g: UInt8, b: UInt8) in near(r, g, b, (0x13, 0x5B, 0xEC), 24) }
        let pending = { (r: UInt8, g: UInt8, b: UInt8) in near(r, g, b, (0x74, 0x7B, 0x8B), 24) }

        // Each circle, read down its own centre: the connectors run across
        // the circles' middles, so a horizontal read would take them in.
        struct Circle { let height: CGFloat; let ring: CGFloat }
        func circle(in region: CGRect, _ match: @escaping (UInt8, UInt8, UInt8) -> Bool) throws -> Circle {
            let all = try XCTUnwrap(pixels.boundingBox(in: region, where: match), "nothing in \(region)")
            // The top arc alone gives the centre.
            let arc = try XCTUnwrap(pixels.boundingBox(
                in: CGRect(x: region.minX, y: all.minY, width: region.width, height: 3), where: match))
            let x = arc.midX
            let step = 1 / pixels.scale
            var y = all.minY, ring: CGFloat = 0, inRing = true, bottom = all.minY
            while y < all.minY + 40 {
                let c = pixels.color(at: CGPoint(x: x, y: y))
                if match(c.r, c.g, c.b) {
                    if inRing { ring += step }
                    bottom = y
                } else if ring > 0 {
                    inRing = false
                }
                y += step
            }
            return Circle(height: bottom - all.minY + step, ring: ring)
        }
        let completed = try circle(in: CGRect(x: 0, y: 0, width: 80, height: 60), theme)
        let current = try circle(in: CGRect(x: 110, y: 0, width: 100, height: 60), theme)
        let pendingStep = try circle(in: CGRect(x: 250, y: 0, width: 70, height: 60), pending)
        XCTAssertEqual(completed.height, 32, accuracy: 1, "the completed step is \(completed.height) high")
        XCTAssertEqual(current.height, 32, accuracy: 1, "the current step is \(current.height) high")
        XCTAssertEqual(pendingStep.height, 32, accuracy: 1, "the pending step is \(pendingStep.height) high")
        XCTAssertEqual(current.ring, 2, accuracy: 0.75, "the current step's ring is \(current.ring)")
        XCTAssertEqual(pendingStep.ring, 1, accuracy: 0.75, "the pending step's ring is \(pendingStep.ring)")
    }

    /// The accent is React's primary pair: theme/600 — #1051E8 on light,
    /// #5887F3 on dark — with foreground/1000 on it. It was theme/500, the same
    /// #135BEC in both themes, with background/0 on it: black on the saturated
    /// blue in the dark.
    @MainActor func testTheAccentIsReactsPrimaryPairInBothThemes() async throws {
        for (scheme, want) in [(ColorScheme.light, (0x10, 0x51, 0xE8)), (.dark, (0x58, 0x87, 0xF3))] {
            let size = CGSize(width: 320, height: 90)
            let view = ZStack(alignment: .topLeading) {
                KozmosColors.semanticsSurface0
                KozmosStepper(steps: ["Search", "Route", "Go"], currentStep: 1)
                    .frame(width: 300)
                    .padding(10)
            }
            .environment(\.colorScheme, scheme)
            let pixels = try await RenderedPixels.render(view, size: size)
            let blue = { (r: UInt8, g: UInt8, b: UInt8) in Int(b) > Int(r) + 60 && Int(b) > 150 }
            let circle = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 70, height: 60), where: blue))
            // Inside the completed step's fill, clear of its check.
            let fill = pixels.color(at: CGPoint(x: circle.minX + 6, y: circle.midY))
            for (channel, got, expected) in [("r", Int(fill.r), want.0), ("g", Int(fill.g), want.1), ("b", Int(fill.b), want.2)] {
                XCTAssertEqual(got, expected, accuracy: 3, "\(scheme): the completed step is \(fill) (\(channel))")
            }
        }
    }

    /// The labels are React's: the current step's in the foreground, black on
    /// light, every other in the muted foreground, foreground/400 #5D626F. They
    /// were foreground/100 #17191C and /500 #747B8B until 2026-09-22. An
    /// anti-aliased glyph's darkest pixel is its colour: a stem covers whole
    /// pixels at this scale.
    @MainActor func testTheLabelsAreReactsForegroundAndMutedForeground() async throws {
        let size = CGSize(width: 320, height: 90)
        let view = ZStack(alignment: .topLeading) {
            KozmosColors.semanticsSurface0
            KozmosStepper(steps: ["Search", "Route", "Go"], currentStep: 1)
                .frame(width: 300)
                .padding(10)
        }
        .environment(\.colorScheme, .light)
        let pixels = try await RenderedPixels.render(view, size: size)
        func darkest(in region: CGRect) -> (r: Int, g: Int, b: Int) {
            var best = (r: 255, g: 255, b: 255)
            var y = region.minY
            while y < region.maxY {
                var x = region.minX
                while x < region.maxX {
                    let c = pixels.color(at: CGPoint(x: x, y: y))
                    if Int(c.r) + Int(c.g) + Int(c.b) < best.r + best.g + best.b { best = (Int(c.r), Int(c.g), Int(c.b)) }
                    x += 1 / pixels.scale
                }
                y += 1 / pixels.scale
            }
            return best
        }
        // Below the 32 circles and their connectors: the labels' band only.
        let current = darkest(in: CGRect(x: 110, y: 44, width: 100, height: 26))
        let pending = darkest(in: CGRect(x: 250, y: 44, width: 70, height: 26))
        XCTAssertLessThanOrEqual(max(current.r, current.g, current.b), 12, "the current label is \(current)")
        for (channel, got, want) in [("r", pending.r, 0x5D), ("g", pending.g, 0x62), ("b", pending.b, 0x6F)] {
            XCTAssertEqual(got, want, accuracy: 10, "the pending label is \(pending) (\(channel))")
        }
    }
    #endif
}
