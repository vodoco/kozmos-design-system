import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-147, decision 93: Badge is a status badge on Chip's scale, 28, 32 and
/// 36pt, where it was 44 like a button; an icon Badge is 32 square.
final class KozmosBadgeScaleTests: XCTestCase {
    func testEachSizeIsChipsHeight() {
        XCTAssertEqual(KozmosBadge("New", size: .sm).minHeight, 28)
        XCTAssertEqual(KozmosBadge("New").minHeight, 32)
        XCTAssertEqual(KozmosBadge("New", size: .lg).minHeight, 36)
        XCTAssertEqual(KozmosBadge("N", size: .icon).minHeight, 32)
    }

    #if os(iOS)
    @MainActor func testEachSizeIsDrawnAtChipsHeight() {
        for (size, height) in [(KozmosBadge.KozmosBadgeSize.sm, 28.0), (.default, 32), (.lg, 36), (.icon, 32)] {
            let host = UIHostingController(rootView: KozmosBadge(size == .icon ? "N" : "New", size: size).fixedSize())
            let drawn = host.sizeThatFits(in: CGSize(width: 400, height: 400))
            XCTAssertEqual(drawn.height, height, accuracy: 0.5, "\(size)")
            if size == .icon { XCTAssertEqual(drawn.width, 32, accuracy: 0.5, "icon width") }
        }
    }
    #endif
}
