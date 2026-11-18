#if os(iOS)
import ImageIO
import SwiftUI
import UniformTypeIdentifiers
import XCTest
@testable import Kozmos

/// GAP-274: New Client's "Add logo". React's FileUpload takes
/// `variant="button"`, an outline Button-sized trigger in place of the drop
/// area that picks as the drop area does; decision 88 puts it on SwiftUI too,
/// as `variant: .button`. Read through the accessibility tree VoiceOver walks,
/// in a window on the simulator.
final class KozmosFileUploadButtonTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    private var logo: URL!

    override func setUpWithError() throws {
        logo = FileManager.default.temporaryDirectory.appendingPathComponent("acme-\(UUID().uuidString.prefix(6)).png")
        let context = try XCTUnwrap(CGContext(
            data: nil, width: 8, height: 8, bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.setFillColor(CGColor(red: 0.1, green: 0.2, blue: 0.4, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: 8, height: 8))
        let image = try XCTUnwrap(context.makeImage())
        let destination = try XCTUnwrap(CGImageDestinationCreateWithURL(logo as CFURL, UTType.png.identifier as CFString, 1, nil))
        CGImageDestinationAddImage(destination, image, nil)
        XCTAssertTrue(CGImageDestinationFinalize(destination))
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: logo)
    }

    /// The button's words: the product's, or "Choose file", as React's; the
    /// drop area keeps "Tap to upload file".
    func testTheButtonSaysChooseFileUnlessThePassesItsOwnWords() {
        XCTAssertEqual(KozmosFileUpload(variant: .button).browseLabel, "Choose file")
        XCTAssertEqual(KozmosFileUpload(browseLabel: "Add logo", variant: .button).browseLabel, "Add logo")
        XCTAssertEqual(KozmosFileUpload().browseLabel, "Tap to upload file")
        XCTAssertEqual(KozmosFileUpload().variant, .dropzone)
    }

    /// It picks as the drop area does: the same importer, of the same types.
    func testTheButtonOffersWhatTheDropAreaOffers() {
        XCTAssertEqual(KozmosFileUpload(preview: .image, variant: .button).importedTypes, [.image])
        XCTAssertEqual(KozmosFileUpload(allowedContentTypes: [.pdf], variant: .button).importedTypes, [.pdf])
    }

    /// One button, Button-sized and as wide as its words, named by them: not
    /// the 120-high drop area across the row.
    @MainActor func testTheButtonFormIsAButtonSizedTriggerNamedByItsWords() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(browseLabel: "Add logo", variant: .button) }
        defer { window.isHidden = true }
        let shown = elements(in: window)
        XCTAssertEqual(shown.compactMap(\.accessibilityLabel), ["Add logo"])
        let trigger = try XCTUnwrap(shown.first)
        XCTAssertTrue(trigger.accessibilityTraits.contains(.button), "the trigger is not a button to VoiceOver")
        let frame = trigger.accessibilityFrame
        XCTAssertLessThan(frame.height, 60, "the trigger is the drop area's height, not a Button's")
        XCTAssertGreaterThanOrEqual(frame.height, 40)
        XCTAssertLessThan(frame.width, 300, "the trigger spans the row, as the drop area does")
    }

    /// With the image preview, the chosen image takes the button's place, and
    /// removing it brings the button back.
    @MainActor func testTheChosenImageTakesTheButtonsPlaceAndRemovingItBringsItBack() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(holding: logo, preview: .image, previewAlt: "Acme logo", variant: .button) }
        defer { window.isHidden = true }
        let shown = elements(in: window)
        XCTAssertEqual(shown.compactMap(\.accessibilityLabel), ["Acme logo", logo.lastPathComponent, "Change", "Remove"])
        let remove = try XCTUnwrap(shown.first { $0.accessibilityLabel == "Remove" })
        XCTAssertTrue(remove.accessibilityActivate())
        try await Task.sleep(nanoseconds: 350_000_000)
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Choose file"], "the button is not back")
    }

    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
        window.rootViewController = UIHostingController(rootView: content().environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 500_000_000)
        return window
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
}
#endif
