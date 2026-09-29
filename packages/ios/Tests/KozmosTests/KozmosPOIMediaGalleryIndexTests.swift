import XCTest
import SwiftUI
@testable import Kozmos

#if os(iOS)
/// The gallery's one index, as a product hears of it: `onActiveIndexChange`
/// is called for a change the visitor asked for, once, and never for the
/// gallery lining its strip up with an index it was given.
///
/// Opened on its third photo, the gallery used to report 0 and then 2: its
/// strip was measured before it had been scrolled to the photo, the first
/// photo was taken for a visitor's scroll, and the scroll that followed was
/// taken for another.
final class KozmosPOIMediaGalleryIndexTests: HostedAccessibilityTestCase {
    /// Three photos whose addresses are refused, so each tile shows its
    /// unavailable state at once and nothing waits on a network.
    private let photos = (1...3).map {
        KozmosPOIMediaPresentation(id: "photo-\($0)", src: "http://example.com/\($0).jpg", alt: "Photo \($0)")
    }

    private func position(_ current: Int, _ total: Int) -> String { "Image \(current) of \(total)" }

    /// A parent that holds the index and takes every change it is told of.
    private struct Controlled: View {
        let media: [KozmosPOIMediaPresentation]
        @State var index: Int
        let reported: (Int) -> Void

        var body: some View {
            KozmosPOIMediaGallery(
                media: media, label: "Photos", positionLabel: { "Image \($0) of \($1)" },
                activeIndex: index,
                onActiveIndexChange: { next in
                    reported(next)
                    index = next
                }
            )
        }
    }

    /// A parent whose photos change under the gallery, as a new place's do.
    private struct Replaced: View {
        @State var media: [KozmosPOIMediaPresentation]
        let replacement: [KozmosPOIMediaPresentation]
        let reported: (Int) -> Void

        var body: some View {
            VStack {
                KozmosPOIMediaGallery(
                    media: media, label: "Photos", positionLabel: { "Image \($0) of \($1)" },
                    defaultActiveIndex: 2, onActiveIndexChange: reported
                )
                Button("Replace the photos") { media = replacement }
            }
        }
    }

    @MainActor func testOpeningOnTheLastPhotoReportsNoChange() async throws {
        var reported: [Int] = []
        let window = await host(
            KozmosPOIMediaGallery(media: photos, label: "Photos", positionLabel: position,
                                  defaultActiveIndex: 2, onActiveIndexChange: { reported.append($0) })
                .padding(16)
        )
        defer { window.isHidden = true }
        await settle(20)

        XCTAssertEqual(reported, [], "opening on the third photo reported changes nobody asked for")
        XCTAssertNoThrow(try element(named: position(3, 3), in: window), "the gallery did not stay on the third photo")
        XCTAssertTrue(try element(named: "Next image", in: window).accessibilityTraits.contains(.notEnabled))
    }

    /// Opened on its second photo, a controlled gallery reports nothing; Next
    /// is then one change, reported once — the strip that follows it is the
    /// gallery's own doing.
    @MainActor func testAControlledGalleryReportsOnlyTheChangeTheVisitorAskedFor() async throws {
        var reported: [Int] = []
        let window = await host(Controlled(media: photos, index: 1, reported: { reported.append($0) }).padding(16))
        defer { window.isHidden = true }
        await settle(20)

        XCTAssertEqual(reported, [], "opening on the second photo reported changes nobody asked for")
        XCTAssertNoThrow(try element(named: position(2, 3), in: window))

        XCTAssertTrue(try element(named: "Next image", in: window).accessibilityActivate())
        await settle(20)
        XCTAssertEqual(reported, [2], "Next was not reported once")
        XCTAssertNoThrow(try element(named: position(3, 3), in: window))
    }

    /// New photos keep the index where it can stay, and bring it in where it
    /// cannot, without telling the product of a change it did not ask for —
    /// as the web gallery does.
    @MainActor func testReplacingThePhotosReportsNoChange() async throws {
        var reported: [Int] = []
        let two = [
            KozmosPOIMediaPresentation(id: "front", src: "http://example.com/front.jpg", alt: "Front"),
            KozmosPOIMediaPresentation(id: "counter", src: "http://example.com/counter.jpg", alt: "Counter")
        ]
        let window = await host(Replaced(media: photos, replacement: two, reported: { reported.append($0) }).padding(16))
        defer { window.isHidden = true }
        await settle(20)
        XCTAssertNoThrow(try element(named: position(3, 3), in: window))

        XCTAssertTrue(try element(named: "Replace the photos", in: window).accessibilityActivate())
        await settle(20)
        XCTAssertEqual(reported, [], "new photos reported changes nobody asked for")
        XCTAssertNoThrow(try element(named: position(2, 2), in: window), "the index did not come in to the last photo")
    }
}
#endif
