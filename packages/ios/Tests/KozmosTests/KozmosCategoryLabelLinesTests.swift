import XCTest
@testable import Kozmos

/// Decision 78 (GAP-010): a category name in Han, kana or Hangul gets a third
/// line, so a long word shows whole; other scripts keep two.
final class KozmosCategoryLabelLinesTests: XCTestCase {
    func testACjkNameGetsThreeLines() {
        for label in ["カスタマーサービス", "ヴィーガン・ベジタリアン", "고객 서비스", "客户服务"] {
            XCTAssertEqual(kozmosCategoryLabelLineLimit(label), 3, label)
        }
    }

    func testOtherScriptsKeepTwo() {
        for label in ["Customer service", "خدمة العملاء", "Сервис"] {
            XCTAssertEqual(kozmosCategoryLabelLineLimit(label), 2, label)
        }
    }
}
