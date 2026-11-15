#if os(iOS)
import ImageIO
import SwiftUI
import UniformTypeIdentifiers
import XCTest
@testable import Kozmos

/// GAP-270: New Client's logo. React's FileUpload takes `preview="image"`
/// and shows the chosen image as an avatar-sized thumbnail with Change and
/// Remove; SwiftUI's showed a picked image only as its name. It takes
/// `preview: .image`. Read and pressed through the accessibility tree
/// VoiceOver walks, in a window on the simulator, with a real PNG on disk.
final class KozmosFileUploadPreviewTests: XCTestCase {
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

    @MainActor func testTheChosenImageShowsWithChangeAndRemove() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        var removed: [URL] = []
        let window = try await show {
            KozmosFileUpload(holding: logo, onFileRemoved: { removed.append($0) }, preview: .image, previewAlt: "Acme logo")
        }
        defer { window.isHidden = true }
        let shown = elements(in: window)
        // The thumbnail by its alt, the file's name, then Change and Remove.
        XCTAssertEqual(shown.compactMap(\.accessibilityLabel), ["Acme logo", logo.lastPathComponent, "Change", "Remove"])
        let thumbnail = try XCTUnwrap(shown.first { $0.accessibilityLabel == "Acme logo" })
        XCTAssertTrue(thumbnail.accessibilityTraits.contains(.image), "the thumbnail is not an image to VoiceOver")
        let buttons = shown.filter { $0.accessibilityTraits.contains(.button) }.compactMap(\.accessibilityLabel)
        XCTAssertEqual(buttons, ["Change", "Remove"])
        let remove = try XCTUnwrap(shown.first { $0.accessibilityLabel == "Remove" })
        XCTAssertTrue(remove.accessibilityActivate(), "the remove button took no press")
        try await Task.sleep(nanoseconds: 350_000_000)
        XCTAssertEqual(removed, [logo])
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Tap to upload file"], "the drop area is not back")
    }

    @MainActor func testTheImageIsNamedByItsFileWithoutAnAlt() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show {
            KozmosFileUpload(holding: logo, removeLabel: "Entfernen", preview: .image, changeLabel: "Ändern")
        }
        defer { window.isHidden = true }
        XCTAssertEqual(
            elements(in: window).compactMap(\.accessibilityLabel),
            [logo.lastPathComponent, logo.lastPathComponent, "Ändern", "Entfernen"])
    }

    /// Without a preview the part is as it was: the name and Remove.
    @MainActor func testWithoutAPreviewTheFileIsItsName() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(holding: logo) }
        defer { window.isHidden = true }
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), [logo.lastPathComponent, "Remove"])
    }

    /// The importer offers images for a preview whose caller named no
    /// types, as React's `accept` falls back to `image/*`.
    func testAnImagePreviewOffersImages() {
        XCTAssertEqual(KozmosFileUpload(preview: .image).importedTypes, [.image])
        XCTAssertEqual(KozmosFileUpload(allowedContentTypes: [.png], preview: .image).importedTypes, [.png])
        XCTAssertEqual(KozmosFileUpload().importedTypes, [.content])
    }

    func testAFileThatIsNotAnImageReadsAsNone() throws {
        let text = FileManager.default.temporaryDirectory.appendingPathComponent("notes-\(UUID().uuidString.prefix(6)).txt")
        try Data("not a picture".utf8).write(to: text)
        defer { try? FileManager.default.removeItem(at: text) }
        XCTAssertNil(KozmosFileUpload.loadImage(at: text))
        XCTAssertNotNil(KozmosFileUpload.loadImage(at: logo))
    }

    /// `content` in a phone-sized window, once it has been laid out.
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

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    // This test-only hook is never linked into the library.
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
