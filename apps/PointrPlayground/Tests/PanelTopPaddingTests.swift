import SwiftUI
import UIKit
import XCTest
import Kozmos
@testable import KozmosPointrQA

private struct RowTopKey: PreferenceKey {
    static var defaultValue: CGFloat = -1
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = nextValue() }
}

final class PanelTopPaddingTests: XCTestCase {
    @MainActor func testCustomRowsConsumeShellInsetAndKeepHandleClearance() async {
        // Unhosted, gripless/side/header, under a handle, and a larger inset.
        for (supplied, clearance, expected): (CGFloat, CGFloat, CGFloat) in [
            (0, 0, 16), (16, 0, 0), (16, 4, 4), (24, 0, 0),
        ] {
            for direction in [LayoutDirection.leftToRight, .rightToLeft] {
                let measured = expectation(description: "Row measured \(supplied)/\(clearance)/\(direction)")
                var captured = false
                var top: CGFloat = -1
                let view = Color.red.frame(height: 44)
                    .background(GeometryReader { proxy in
                        Color.clear.preference(key: RowTopKey.self, value: proxy.frame(in: .named("panel-row")).minY)
                    })
                    .modifier(SDKPanelTopPadding())
                    .coordinateSpace(name: "panel-row")
                    .environment(\.kozmosPanelInsetTop, supplied)
                    .environment(\.kozmosPanelClearanceTop, clearance)
                    .environment(\.layoutDirection, direction)
                    .onPreferenceChange(RowTopKey.self) { value in
                        guard !captured, value >= 0 else { return }
                        captured = true
                        top = value
                        measured.fulfill()
                    }
                let host = UIHostingController(rootView: view)
                let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
                window.rootViewController = host
                window.makeKeyAndVisible()
                host.view.layoutIfNeeded()
                await fulfillment(of: [measured], timeout: 5)
                XCTAssertEqual(top, expected, accuracy: 0.5)
                window.isHidden = true
                window.rootViewController = nil
            }
        }
    }
}
