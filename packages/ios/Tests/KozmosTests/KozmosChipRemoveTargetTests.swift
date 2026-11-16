#if os(macOS)
import AppKit
import SwiftUI
import XCTest
@testable import Kozmos

/// A chip's remove takes a click 44 square, Apple's minimum target and the one
/// Kozmos's other SwiftUI clears and icon buttons take, while its mark is
/// drawn 20 and the chip is no taller. It took a click only on the 20.
///
/// Clicked for real, in a window on a Mac, so `swift test` runs it: the
/// interaction host's `testAChipsRemoveTakesATap44SquareWhileTheChipKeepsItsHeight`
/// taps the same target on the simulator.
final class KozmosChipRemoveTargetTests: XCTestCase {
    private static let windowSize = CGSize(width: 320, height: 200)
    /// Where the chip's top leading corner is laid out in the window.
    private static let chipOrigin = CGPoint(x: 20, y: 70)

    @MainActor func testTheRemoveTakesAClick44SquareAtEverySizeWithTheChipNoTaller() async throws {
        for (size, height) in [(KozmosChipSize.sm, 28.0), (.default, 32.0), (.lg, 36.0)] {
            var events: [String] = []
            var laidOut: CGFloat = 0
            let chip = KozmosChip(text: "Coffee", size: size,
                                  onRemove: { events.append("remove") }, action: { events.append("chip") })
                .background(GeometryReader { geometry in
                    Color.clear.onAppear { laidOut = geometry.size.height }
                })
            let window = try await host(chip)
            defer { window.close() }
            XCTAssertEqual(laidOut, height, "\(size): the remove's target made the chip taller")

            func click(_ x: CGFloat, _ y: CGFloat) -> String {
                events = []
                for type in [NSEvent.EventType.leftMouseDown, .leftMouseUp] {
                    // AppKit's window coordinates start at the bottom.
                    let event = try? XCTUnwrap(NSEvent.mouseEvent(
                        with: type, location: CGPoint(x: x, y: Self.windowSize.height - y), modifierFlags: [],
                        timestamp: ProcessInfo.processInfo.systemUptime, windowNumber: window.windowNumber,
                        context: nil, eventNumber: 0, clickCount: 1, pressure: 1))
                    if let event { window.sendEvent(event) }
                }
                return events.last ?? "none"
            }

            let middle = Self.chipOrigin.y + height / 2
            let across = stride(from: 0, through: Self.windowSize.width, by: 1).filter { click($0, middle) == "remove" }
            let first = try XCTUnwrap(across.first, "\(size): no click removed the chip")
            let last = try XCTUnwrap(across.last)
            XCTAssertEqual(across.count, Int(last - first) + 1, "\(size): the remove's target has a gap")
            XCTAssertGreaterThanOrEqual(last - first + 1, 44, "\(size): the remove takes a click \(last - first + 1) wide")
            // The words' end is the chip's, right up to the remove's target.
            XCTAssertEqual(click(first - 1, middle), "chip", "\(size): the remove's target took the chip's words")

            let centre = (first + last) / 2
            let down = stride(from: 0, through: Self.windowSize.height, by: 1).filter { click(centre, $0) == "remove" }
            let top = try XCTUnwrap(down.first)
            let bottom = try XCTUnwrap(down.last)
            XCTAssertGreaterThanOrEqual(bottom - top + 1, 44, "\(size): the remove takes a click \(bottom - top + 1) tall")
            // Centred on the chip, top to bottom.
            XCTAssertEqual((top + bottom + 1) / 2, middle, accuracy: 1, "\(size): the target is not centred on the chip")
        }
    }

    @MainActor private func host<V: View>(_ chip: V) async throws -> NSWindow {
        let view = VStack(alignment: .leading, spacing: 0) {
            chip
            Spacer(minLength: 0)
        }
        .padding(.leading, Self.chipOrigin.x)
        .padding(.top, Self.chipOrigin.y)
        .frame(width: Self.windowSize.width, height: Self.windowSize.height, alignment: .topLeading)
        .environment(\.colorScheme, .light)
        let hosting = NSHostingView(rootView: view)
        let window = NSWindow(contentRect: CGRect(origin: .zero, size: Self.windowSize),
                              styleMask: [.borderless], backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = hosting
        window.orderFront(nil)
        for _ in 0..<5 {
            hosting.layoutSubtreeIfNeeded()
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        return window
    }
}
#endif
