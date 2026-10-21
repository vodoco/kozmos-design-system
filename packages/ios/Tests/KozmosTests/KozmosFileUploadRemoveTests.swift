#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-185: React's FileUpload calls `onFilesChange` when the visitor removes
/// a file; SwiftUI's took only `onFileSelected`, so a product never heard of
/// the removal. It takes `onFileRemoved`, told the file removed. GAP-182: the
/// drop area's "Tap to upload file" was fixed English; it is `browseLabel`,
/// as React's. The remove button had only its symbol's name, "Close", and
/// the file icon read as "Document": the button is `removeLabel`, "Remove"
/// as Compose's, and the icon is decoration. Read and pressed through the accessibility tree VoiceOver
/// walks, in a window on the simulator.
final class KozmosFileUploadRemoveTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    private let plan = URL(fileURLWithPath: "/private/tmp/Grundriss Ebene 2.pdf")

    @MainActor func testRemovingTheFileTellsTheProductWhichFile() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        var removed: [URL] = []
        let window = try await show { KozmosFileUpload(holding: plan, onFileRemoved: { removed.append($0) }) }
        defer { window.isHidden = true }
        let shown = elements(in: window)
        // The file's name, then the remove button: the icon is decoration.
        XCTAssertEqual(shown.compactMap(\.accessibilityLabel), ["Grundriss Ebene 2.pdf", "Remove"])
        let remove = try XCTUnwrap(shown.first { $0.accessibilityTraits.contains(.button) }, "no remove button among \(shown.compactMap(\.accessibilityLabel))")
        XCTAssertTrue(remove.accessibilityActivate(), "the remove button took no press")
        try await Task.sleep(nanoseconds: 350_000_000)
        XCTAssertEqual(removed, [plan])
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Tap to upload file"], "the drop area is not back")
    }

    /// A lone trailing closure is still the pick, as it was before there was
    /// a removal; with the two callbacks last, Swift 5's backward matching
    /// gave it to `onFileRemoved`. Two trailing closures are the pick, then
    /// the removal.
    @MainActor func testATrailingClosureIsStillOnFileSelected() {
        let alone = KozmosFileUpload { _ in }
        XCTAssertNotNil(alone.onFileSelected)
        XCTAssertNil(alone.onFileRemoved)
        let typed = KozmosFileUpload(allowedContentTypes: [.pdf]) { _ in }
        XCTAssertNotNil(typed.onFileSelected)
        XCTAssertNil(typed.onFileRemoved)
        let both = KozmosFileUpload { _ in } onFileRemoved: { _ in }
        XCTAssertNotNil(both.onFileSelected)
        XCTAssertNotNil(both.onFileRemoved)
    }

    @MainActor func testTheRemoveButtonSaysAProductsOwnWord() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(holding: plan, removeLabel: "Entfernen") }
        defer { window.isHidden = true }
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Grundriss Ebene 2.pdf", "Entfernen"])
    }

    @MainActor func testTheDropAreaSaysAProductsOwnWords() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(browseLabel: "Zum Hochladen tippen") }
        defer { window.isHidden = true }
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Zum Hochladen tippen"])
    }

    @MainActor func testTheDropAreaKeepsTheEnglishWhenLeftOut() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload() }
        defer { window.isHidden = true }
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["Tap to upload file"])
    }

    /// `content` in a phone-sized window, once it has been laid out.
    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
        window.rootViewController = UIHostingController(rootView: content().environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 350_000_000)
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
