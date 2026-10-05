import XCTest
@testable import Kozmos

/// One link rule for every link Kozmos draws, as on the web and Android
/// (audit H4, 2026-10-04): the credits checked only scheme and host, so a
/// credit hiding its host behind credentials was a live link.
final class KozmosSafeLinkTests: XCTestCase {
    func testLinksHttpAndHttpsWithAHost() {
        for href in ["https://example.com", "http://example.com/a?b=c#d"] {
            XCTAssertEqual(KozmosSafeLink.destination(href)?.absoluteString, href)
        }
    }

    func testLinksMailtoAndTelOnlyWhereAContactLinkBelongs() {
        for href in ["mailto:support@example.com", "tel:+4412345678"] {
            XCTAssertNotNil(KozmosSafeLink.destination(href, contact: true), href)
            XCTAssertNil(KozmosSafeLink.destination(href), href)
        }
    }

    func testRefusesCredentialsWhitespaceControlCharactersAndOtherSchemes() {
        let refused: [String?] = [
            nil, "", "/relative", "javascript:alert(1)", "data:text/html,bad",
            "https://user:secret@example.com", "https://maps.example@evil.example",
            "https://example.com/a b", " https://example.com", "https://example.com/\ttab",
            "https://exa\u{0}mple.com", "mailto:", "tel:",
        ]
        for contact in [false, true] {
            for href in refused {
                XCTAssertNil(KozmosSafeLink.destination(href, contact: contact), String(describing: href))
            }
        }
    }

    func testACreditHidingItsHostBehindCredentialsIsNotALink() {
        XCTAssertNil(KozmosMapAttributionCredit(id: "c", label: "Credit", href: "https://maps.example@evil.example").destination)
        XCTAssertNil(KozmosMapAttributionCredit(id: "s", label: "Credit", href: "https://example.com/credits page").destination)
        XCTAssertNotNil(KozmosMapAttributionCredit(id: "ok", label: "Credit", href: "https://example.com/credits").destination)
        XCTAssertNil(KozmosMapAttributionCredit(id: "mail", label: "Credit", href: "mailto:maps@example.com").destination)
    }

    func testAMapInfoEntryStillTakesContactLinks() {
        XCTAssertNotNil(KozmosMapInfoEntry(id: "m", label: "Mail", href: "mailto:support@example.com").destination)
        XCTAssertNil(KozmosMapInfoEntry(id: "c", label: "Bad", href: "https://user:secret@example.com").destination)
    }
}
