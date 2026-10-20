import XCTest
import SwiftUI
import SnapshotTesting
@testable import Kozmos

final class KozmosPOIDetailTests: XCTestCase {
    func testSparseJSONUsesTheSameDefaultsAsSwiftInitializers() throws {
        let decoded = try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: Data("{}".utf8))
        XCTAssertEqual(decoded, .init())
        let partial = try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: Data(##"{"tags":[{"id":"pizza","label":"#pizza"}]}"##.utf8))
        XCTAssertEqual(partial.tags.count, 1)
        XCTAssertEqual(partial.summary, [])
        XCTAssertThrowsError(try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: Data(#"{"summary":"not an array"}"#.utf8)))
    }

    /// A service's tag keeps its Kozmos name, which `KozmosIcon` draws
    /// (KozmosPOIDetailTagIconTests), rather than an SF Symbol name.
    func testLegacyServiceIconsUseTheKozmosResolver() {
        let tag = KozmosPOIDetailTag(service: .init(id: "alert", label: "Access notice", iconName: "alert-circle"))
        XCTAssertEqual(tag.iconName, "alert-circle")
        XCTAssertNil(tag.systemImage)
        let text = KozmosPOIDetailTag(service: .init(id: "text", label: "Text only"))
        XCTAssertNil(text.iconName)
        XCTAssertNil(text.systemImage)
    }

    func testLoadingLabelCanBeLocalizedWithoutChangingActionIdentity() {
        let button = POIDetailActionButton(label: "Reservar", systemImage: "calendar", loadingLabel: "Cargando", state: .init(loading: true), action: {})
        XCTAssertEqual(button.loadingLabel, "Cargando")
        XCTAssertEqual(button.label, "Reservar")
        XCTAssertTrue(button.state.loading)
    }

    func testMetadataCapPreservesPriorityAndAdaptsToMissingItems() {
        let items = (0..<5).map { KozmosPOIDetailSummary(id: "\($0)", label: "Fact", value: "\($0)") }
        XCTAssertEqual(KozmosPOIDetailsPresentation(summary: items).visibleSummary.map(\.id), ["0", "1", "2"])
        for count in 0...2 {
            XCTAssertEqual(KozmosPOIDetailsPresentation(summary: Array(items.prefix(count))).visibleSummary.count, count)
        }
    }

    func testTagArtworkIsOptionalAndNeverInferredFromText() {
        let text = KozmosPOIDetailTag(id: "italian", label: "Italian")
        XCTAssertNil(text.iconName)
        XCTAssertNil(text.systemImage)
        XCTAssertNil(text.iconUrl)
        let icon = KozmosPOIDetailTag(id: "wifi", label: "WiFi", iconUrl: "https://example.com/wifi.png", iconMonochrome: true)
        XCTAssertEqual(icon.iconMonochrome, true)
        XCTAssertEqual(icon.label, "WiFi")
    }

    /// A service's tag keeps the service's own artwork, as React's chip and
    /// Compose's draw a service's `iconUrl` before its `iconName`. Until
    /// 20 Oct `KozmosPOIDetailTag(service:)` kept only the name, so on iOS a
    /// service with an asset drew its Kozmos name, or nothing, and a
    /// monochrome asset lost its tint.
    func testAServiceTagKeepsTheServicesArtwork() {
        let asset = KozmosPOIDetailTag(service: .init(
            id: "wifi", label: "WiFi", iconName: "phone",
            iconUrl: "https://example.com/wifi.svg", iconMonochrome: true))
        XCTAssertEqual(asset.iconUrl, "https://example.com/wifi.svg")
        XCTAssertEqual(asset.iconMonochrome, true)
        XCTAssertEqual(asset.iconName, "phone")
        XCTAssertEqual(asset.label, "WiFi")
        let colour = KozmosPOIDetailTag(service: .init(id: "logo", label: "Logo", iconUrl: "https://example.com/logo.png"))
        XCTAssertEqual(colour.iconUrl, "https://example.com/logo.png")
        XCTAssertNotEqual(colour.iconMonochrome, true)
        let plain = KozmosPOIDetailTag(service: .init(id: "italian", label: "Italian"))
        XCTAssertNil(plain.iconUrl)
        XCTAssertNotEqual(plain.iconMonochrome, true)
    }

    func testRemoteIconsRejectUnsafeAndCredentialledURLs() {
        XCTAssertNotNil(POIDetailIcon.remoteURL("https://example.com/icon.png"))
        for url in ["http://example.com/icon.png", "file:///tmp/icon.png", "data:image/png;base64,abc", "https://user:pass@example.com/icon.png", "javascript:alert(1)", "not a URL"] {
            XCTAssertNil(POIDetailIcon.remoteURL(url), url)
        }
    }

    func testDetailsRoundTripWithoutLosingZeroWaitOrIconOwnership() throws {
        let details = KozmosPOIDetailsPresentation(
            summary: [.init(id: "wait", label: "Wait", value: "Empty", detail: "0 min wait")],
            groups: [.init(id: "cuisine", heading: "Cuisines", items: [.init(id: "it", label: "Italian")])],
            supplementaryActions: [.init(action: "book", label: "Book", systemImage: "calendar")]
        )
        XCTAssertEqual(try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: JSONEncoder().encode(details)), details)
    }

    func testGeneratedStorybookFixturesDecodeUsingNativeContracts() throws {
        // This test deliberately reads the checked-in generated fixture, so
        // accidental model drift is caught rather than swallowed by demo UI.
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
        let source = try String(contentsOf: root.appendingPathComponent("apps/Playground.swiftpm/Sources/App/Model/POIExampleData.swift"))
        let json = try XCTUnwrap(source.components(separatedBy: "#\"\"\"\n").last?.components(separatedBy: "\n\"\"\"#").first)
        struct Example: Decodable { let id: String; let poi: KozmosPOIPresentation; let details: KozmosPOIDetailsPresentation }
        let examples = try JSONDecoder().decode([Example].self, from: Data(json.utf8))
        XCTAssertEqual(examples.count, 7)
        for example in examples {
            XCTAssertFalse(example.poi.name.isEmpty)
            XCTAssertLessThanOrEqual(example.details.visibleSummary.count, 3)
        }
        // The long-content example carries the name that wraps, on every platform.
        let longContent = try XCTUnwrap(examples.first { $0.id == "long-content" })
        XCTAssertGreaterThan(longContent.poi.name.count, 60)
        let restaurant = try XCTUnwrap(examples.first { $0.id == "restaurant" })
        XCTAssertEqual(restaurant.details.summary.first?.value, "4.7 / 5")
        XCTAssertNil(restaurant.details.groups.first?.items.first?.iconUrl)
        XCTAssertNotNil(restaurant.details.groups.first { $0.heading == "Amenities" }?.items.first?.iconUrl)
    }

    #if os(iOS)
    private func pixel(_ image: UIImage, x: CGFloat, y: CGFloat) throws -> [UInt8] {
        let source = try XCTUnwrap(image.cgImage?.cropping(to: CGRect(x: x * image.scale, y: y * image.scale, width: 1, height: 1)))
        var rgba = [UInt8](repeating: 0, count: 4)
        let context = try XCTUnwrap(CGContext(data: &rgba, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
        context.draw(source, in: CGRect(x: 0, y: 0, width: 1, height: 1))
        return rgba
    }

    @MainActor func testLayoutsReverseRenderedOrderExactlyOnce() throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let summary = ImageRenderer(content: POISummaryLayout {
                Color.red.frame(height: 20)
                Color.blue.frame(height: 20)
            }.frame(width: 200).environment(\.layoutDirection, direction))
            let fact = ImageRenderer(content: POIFactLayout {
                Color.red.frame(width: 20, height: 20)
                Color.blue.frame(width: 40, height: 20)
            }.frame(width: 66).environment(\.layoutDirection, direction))
            let flow = ImageRenderer(content: FlowLayout(spacing: 8) {
                Color.red.frame(width: 40, height: 20)
                Color.blue.frame(width: 40, height: 20)
            }.frame(width: 88).environment(\.layoutDirection, direction))
            for (name, image, x) in [("summary", summary.uiImage, 25.0), ("fact", fact.uiImage, 10.0), ("tags", flow.uiImage, 10.0)] {
                let rgba = try pixel(XCTUnwrap(image), x: x, y: 10)
                if direction == .leftToRight {
                    XCTAssertGreaterThan(rgba[0], rgba[2], "\(name): first item must be on the left in LTR")
                } else {
                    XCTAssertGreaterThan(rgba[2], rgba[0], "\(name): first item must move to the right in RTL")
                }
            }
        }
    }

    @MainActor func testMetadataRendersAcrossWidthsCountsAndLargeType() throws {
        let items: [KozmosPOIDetailSummary] = [
            .init(id: "rating", label: "Rating", value: "4.7 / 5", detail: "32 reviews", systemImage: "star"),
            .init(id: "price", label: "Price range", value: "3 of 4", priceLevel: 3),
            .init(id: "access", label: "Accessibility", value: "Wheelchair Friendly", systemImage: "figure.roll")
        ]
        for width in [320.0, 375, 430, 768] {
            for count in 1...3 {
                let content = POIDetailSummary(items: Array(items.prefix(count)))
                    .frame(width: width).background(Color.white)
                let renderer = ImageRenderer(content: content)
                let image = try XCTUnwrap(renderer.uiImage)
                XCTAssertEqual(image.size.width, width, accuracy: 1)
                XCTAssertGreaterThanOrEqual(image.size.height, 64)
                XCTAssertLessThan(image.size.height, 200)
                let attachment = XCTAttachment(image: image)
                attachment.name = "metadata-\(Int(width))-\(count)-items"
                attachment.lifetime = .keepAlways
                add(attachment)
            }
        }
        let large = ImageRenderer(content: POIDetailSummary(items: items)
            .environment(\.dynamicTypeSize, .accessibility5)
            .environment(\.layoutDirection, .rightToLeft)
            .frame(width: 320))
        let largeImage = try XCTUnwrap(large.uiImage)
        let largeAttachment = XCTAttachment(image: largeImage)
        largeAttachment.name = "metadata-320-accessibility5-rtl"
        largeAttachment.lifetime = .keepAlways
        add(largeAttachment)
    }

    @MainActor func testCardRenderMatrix() async throws {
        let poi = KozmosPOIPresentation(id: "native-review", name: "Peak Performance", floorId: "1",
            floorLabel: "Current floor", buildingLabel: "Building A", availability: .open,
            availabilityLabel: "Open", description: "A high-intensity fitness studio offering group classes and open gym access.",
            actions: [.navigate, .share, .favourite, .bookmark])
        let details = KozmosPOIDetailsPresentation(
            summary: [
                .init(id: "rating", label: "Rating", value: "4.7 / 5", detail: "32 reviews", systemImage: "star"),
                .init(id: "price", label: "Price", value: "3 of 4", priceLevel: 3),
                .init(id: "access", label: "Accessibility", value: "Wheelchair Friendly", systemImage: "figure.roll")
            ],
            groups: [.init(id: "sports", heading: "Sport types", items: [.init(id: "a", label: "Aerobics"), .init(id: "b", label: "Athletics")]),
                     .init(id: "amenities", heading: "Amenities", items: [.init(id: "wifi", label: "WiFi", systemImage: "wifi"), .init(id: "long", label: "Assistance available for visitors with accessibility requirements")])],
            tags: [.init(id: "fitness", label: "#fitness")],
            supplementaryActions: [.init(action: "book", label: "Book", systemImage: "calendar")],
            travelEstimate: .init(durationSeconds: 120, durationLabel: "2 min", distanceLabel: "120 m")
        )
        for (name, width, type, direction, scheme) in [
            ("phone", 375.0, DynamicTypeSize.large, LayoutDirection.leftToRight, ColorScheme.light),
            ("small", 320.0, .large, .leftToRight, .light),
            ("dark", 430.0, .large, .leftToRight, .dark),
            ("large-text-rtl", 320.0, .accessibility5, .rightToLeft, .light),
            ("tablet", 768.0, .large, .leftToRight, .light)
        ] {
            let controller = UIHostingController(rootView: KozmosPOIDetailPanel(
                poi: poi, actionLabels: [.navigate: "Go", .share: "Share", .favourite: "Favourite", .bookmark: "Bookmark"],
                onAction: { _, _ in }, actionStates: [.favourite: .init(pressed: true)], onClose: {},
                details: details, onSupplementaryAction: { _, _ in }
            ).environment(\.dynamicTypeSize, type).environment(\.layoutDirection, direction)
                .environment(\.colorScheme, scheme).frame(width: width, height: 812))
            // ImageRenderer cannot capture ScrollView's UIKit-backed content;
            // use a hosted view snapshot, not a passing but blank bitmap.
            let strategy = Snapshotting<UIViewController, UIImage>.image(size: CGSize(width: width, height: 812))
            let image = await withCheckedContinuation { continuation in
                strategy.snapshot(controller).run { continuation.resume(returning: $0) }
            }
            let attachment = XCTAttachment(image: image)
            attachment.name = "poi-card-\(name)"
            attachment.lifetime = .keepAlways
            add(attachment)
        }
    }

    /// The name and the quick buttons share one row: a long name wraps beside
    /// them, three lines at most, and never pushes them under it. The
    /// favourite button is pressed, so its theme fill marks where the buttons
    /// are; the name is the only dark text left of them. Four names — one,
    /// two, three and far too many lines — so the lines are counted by the
    /// height each extra line adds, not guessed from a font size. Measured at
    /// 320pt: 14.5, 39.5 and 64.5 points, 25 a line; the title column beside
    /// three 44pt buttons is 136pt wide, about eleven characters.
    @MainActor func testALongNameWrapsBesideTheQuickButtonsAndStopsAtThreeLines() async throws {
        let width: CGFloat = 320
        var buttonTop: [String: CGFloat] = [:]
        var titleHeight: [String: CGFloat] = [:]
        for (name, poiName) in [
            ("one", "Il Forno"),
            ("two", "Il Forno Pizzeria"),
            ("three", "Il Forno — Neapolitan restaurant and handmade pasta kitchen on the upper concourse"),
            ("endless", String(repeating: "Il Forno Neapolitan restaurant ", count: 8)),
        ] {
            let poi = KozmosPOIPresentation(id: "long-name", name: poiName, floorId: "1", floorLabel: "Upper concourse",
                                            buildingLabel: "Terminal 1", actions: [.navigate, .favourite, .bookmark])
            let pixels = try await RenderedPixels.render(KozmosPOIDetailPanel(
                poi: poi, actionLabels: [.navigate: "Go", .favourite: "Favourite", .bookmark: "Bookmark"],
                onAction: { _, _ in }, actionStates: [.favourite: .init(pressed: true)], onClose: {},
                details: .init(), onSupplementaryAction: { _, _ in }), size: CGSize(width: width, height: 600))
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "poi-card-name-\(name)"
            attachment.lifetime = .keepAlways
            add(attachment)
            // The quick buttons: the leftmost is the pressed favourite, right of centre, near the top.
            let favourite = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: width / 2, y: 0, width: width / 2, height: 200),
                                                             where: RenderedPixels.isTheme), "\(name): no pressed favourite button")
            buttonTop[name] = favourite.minY
            // The name: dark text left of the buttons.
            let title = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 12, y: 0, width: favourite.minX - 16, height: 200),
                                                         where: RenderedPixels.isDarkText), "\(name): no title")
            titleHeight[name] = title.height
        }
        let heights = titleHeight.sorted { $0.key < $1.key }.map { "\($0.key) \($0.value)" }.joined(separator: ", ")
        print("poi-card name heights in points: \(heights); button top \(buttonTop.sorted { $0.key < $1.key })")
        let top = try XCTUnwrap(buttonTop["one"])
        for name in ["two", "three", "endless"] {
            XCTAssertEqual(try XCTUnwrap(buttonTop[name]), top, accuracy: 1, "the \(name)-line name moved the buttons")
        }
        let one = try XCTUnwrap(titleHeight["one"])
        let two = try XCTUnwrap(titleHeight["two"])
        let three = try XCTUnwrap(titleHeight["three"])
        let endless = try XCTUnwrap(titleHeight["endless"])
        // Each further line adds about a line height; the second and the third
        // add the same amount, and nothing is added past the third.
        let secondLine = two - one
        let thirdLine = three - two
        XCTAssertGreaterThan(secondLine, 12, "the two-line name did not wrap (\(heights))")
        XCTAssertEqual(thirdLine, secondLine, accuracy: 4, "the third line is not one more line (\(heights))")
        XCTAssertEqual(endless, three, accuracy: 1.5, "an endless name is not capped at three lines (\(heights))")
    }

    /// In the sheet presentation the panel paints no surface of its own: it
    /// sits on the sheet's, as the browse panel does (Olcay, 21st: the card
    /// looked like a card within a card). Inline keeps its own.
    @MainActor func testTheSheetPresentationPaintsNoSurfaceOfItsOwn() async throws {
        let poi = KozmosPOIPresentation(id: "lounge", name: "British Airways Lounge", floorId: "e:4", floorLabel: "Fourth Floor", buildingLabel: "Terminal E")
        func panel(_ presentation: KozmosPOIDetailPanel.Presentation) -> some View {
            KozmosPOIDetailPanel(
                poi: poi, actionLabels: [.navigate: "Go"], onAction: { _, _ in }, onClose: {},
                presentation: presentation, details: .init(), onSupplementaryAction: { _, _ in }
            )
            .padding(8)
            .background(KozmosColors.primitivesColorsBackground100)
        }
        let size = CGSize(width: 320, height: 240)
        let isWhite: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r > 252 && g > 252 && b > 252 }
        // The panel's top edge, mid-width: inside the panel, above its header's text.
        let probe = CGRect(x: 150, y: 10, width: 12, height: 6)
        let sheet = try await RenderedPixels.render(panel(.sheet), size: size)
        XCTAssertNil(sheet.boundingBox(in: probe, where: isWhite), "the sheet presentation paints its own white surface")
        let inline = try await RenderedPixels.render(panel(.inline), size: size)
        XCTAssertNotNil(inline.boundingBox(in: probe, where: isWhite), "the inline presentation lost its own surface")
    }
    #endif

}
