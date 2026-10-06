import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-134: React's Container pads the sides only, by `inset`; SwiftUI's padded every side.
final class KozmosContainerInsetTests: XCTestCase {
    func testWindowInsetStepsWithTheWidthAndPanelKeepsSixteen() {
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 390), 16)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 639), 16)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 640), 24)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 1023), 24)
        XCTAssertEqual(KozmosContainerInset.padding(.window, width: 1024), 32)
        for width in [CGFloat(390), 800, 1280] {
            XCTAssertEqual(KozmosContainerInset.padding(.panel, width: width), 16)
        }
    }

    #if os(iOS)
    @MainActor func testInsetPadsTheSidesOnlyAndTheDefaultStillPadsEverySide() async throws {
        for (inset, width, side, top): (KozmosContainerInset?, CGFloat, CGFloat, Bool) in [
            (.panel, 1100, 16, false), (.window, 390, 16, false), (.window, 800, 24, false),
            (.window, 1100, 32, false), (nil, 390, 16, true),
        ] {
            var frame = CGRect.zero
            let probe = Color.blue.frame(height: 40).background(GeometryReader { proxy in
                Color.clear.preference(key: ProbeFrame.self, value: proxy.frame(in: .global))
            })
            let container: AnyView = inset.map { AnyView(KozmosContainer(inset: $0) { probe }) }
                ?? AnyView(KozmosContainer { probe })
            let view = VStack(spacing: 0) { container; Spacer(minLength: 0) }
                .frame(width: width, height: 300)
                .onPreferenceChange(ProbeFrame.self) { frame = $0 }
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: width, height: 300))
            window.rootViewController = UIHostingController(rootView: view.ignoresSafeArea())
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let state = "\(String(describing: inset)) at \(width)"
            XCTAssertEqual(frame.minX, side, accuracy: 1, state)
            XCTAssertEqual(width - frame.maxX, side, accuracy: 1, state)
            if top { XCTAssertGreaterThan(frame.minY, 0, state) } else { XCTAssertEqual(frame.minY, 0, accuracy: 1, state) }
        }
    }

    private struct ProbeFrame: PreferenceKey {
        static var defaultValue = CGRect.zero
        static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
            let next = nextValue()
            if !next.isEmpty { value = next }
        }
    }
    #endif
}
