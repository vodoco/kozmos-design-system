import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-280: React's FileUpload takes `maxSize`, `maxFiles` and `multiple`,
/// and says why it refused a file; SwiftUI's took one file
/// (`allowsMultipleSelection: false`) and no limit, so an app checked them
/// itself, after the importer. It takes all three, refuses in React's words
/// by default, or the product's, and lists each file held.
final class KozmosFileUploadLimitsTests: XCTestCase {
    private let plan = URL(fileURLWithPath: "/private/tmp/plan.pdf")
    private let site = URL(fileURLWithPath: "/private/tmp/site.pdf")
    private let notes = URL(fileURLWithPath: "/private/tmp/notes.txt")

    func testAPickPastMaxFilesIsRefusedInReactsWords() {
        let upload = KozmosFileUpload(maxFiles: 2)
        XCTAssertEqual(upload.refusal(for: [plan, site, notes], sizeOf: { _ in 1 }), "Select up to 2 files.")
        XCTAssertNil(upload.refusal(for: [plan, site], sizeOf: { _ in 1 }))
        XCTAssertEqual(KozmosFileUpload(maxFiles: 1).refusal(for: [plan, site], sizeOf: { _ in 1 }), "Select up to 1 file.")
    }

    func testAFileOverMaxSizeIsRefusedByItsNameAndTheLimit() {
        let upload = KozmosFileUpload(maxSize: 2048, maxFiles: 3)
        let sizes = [plan: Int64(100), site: Int64(4096), notes: Int64(9000)]
        XCTAssertEqual(upload.refusal(for: [plan, site, notes], sizeOf: { sizes[$0] }), "site.pdf exceeds 2.0 KB.")
        XCTAssertNil(upload.refusal(for: [plan], sizeOf: { sizes[$0] }))
        // A size that cannot be read refuses nothing.
        XCTAssertNil(upload.refusal(for: [site], sizeOf: { _ in nil }))
    }

    func testTheRefusalsAreAProductsOwnWords() {
        let upload = KozmosFileUpload(
            tooManyFilesLabel: { "Höchstens \($0) Datei." },
            tooLargeLabel: { "\($0) ist größer als \($1)." },
            maxSize: 1024,
            maxFiles: 1
        )
        XCTAssertEqual(upload.refusal(for: [plan, site], sizeOf: { _ in 1 }), "Höchstens 1 Datei.")
        XCTAssertEqual(upload.refusal(for: [plan], sizeOf: { _ in 5000 }), "plan.pdf ist größer als 1.0 KB.")
    }

    func testTheImporterTakesSeveralFilesAsReactsPickerDoes() {
        XCTAssertFalse(KozmosFileUpload().allowsMultipleSelection)
        XCTAssertTrue(KozmosFileUpload(multiple: true).allowsMultipleSelection)
        XCTAssertTrue(KozmosFileUpload(maxFiles: 3).allowsMultipleSelection)
        XCTAssertFalse(KozmosFileUpload(maxFiles: 3, multiple: false).allowsMultipleSelection)
        XCTAssertFalse(KozmosFileUpload(preview: .image, multiple: true).allowsMultipleSelection)
        // With `multiple` and no count, any number is taken.
        XCTAssertNil(KozmosFileUpload(multiple: true).refusal(for: [plan, site, notes], sizeOf: { _ in 1 }))
    }

    func testSizesAreWrittenAsReactWritesThem() {
        XCTAssertEqual(KozmosFileUpload.formatBytes(0), "0 B")
        XCTAssertEqual(KozmosFileUpload.formatBytes(512), "512 B")
        XCTAssertEqual(KozmosFileUpload.formatBytes(1536), "1.5 KB")
        XCTAssertEqual(KozmosFileUpload.formatBytes(2 * 1024 * 1024), "2.0 MB")
        XCTAssertEqual(KozmosFileUpload.formatBytes(10 * 1024 * 1024), "10 MB")
    }

    func testAFilesSizeIsReadFromTheFile() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("kozmos-size-\(UUID().uuidString).bin")
        try Data(count: 3000).write(to: url)
        defer { try? FileManager.default.removeItem(at: url) }
        XCTAssertEqual(KozmosFileUpload.fileSize(of: url), 3000)
    }
}

#if os(iOS)
/// The files held and a refusal, read and pressed through the accessibility
/// tree VoiceOver walks, in a window on the simulator.
final class KozmosFileUploadLimitsHostedTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    private let plan = URL(fileURLWithPath: "/private/tmp/plan.pdf")
    private let site = URL(fileURLWithPath: "/private/tmp/site.pdf")

    @MainActor func testEachFileHeldIsListedWithItsOwnRemove() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        var held: [[URL]] = []
        var removed: [URL] = []
        let window = try await show {
            KozmosFileUpload(holding: [plan, site], onFileRemoved: { removed.append($0) }, onFilesChange: { held.append($0) })
        }
        defer { window.isHidden = true }
        let shown = elements(in: window)
        XCTAssertEqual(shown.compactMap(\.accessibilityLabel), ["plan.pdf", "Remove", "site.pdf", "Remove"])
        let removes = shown.filter { $0.accessibilityTraits.contains(.button) }
        XCTAssertEqual(removes.count, 2)
        XCTAssertTrue(removes[1].accessibilityActivate(), "the second remove button took no press")
        try await Task.sleep(nanoseconds: 350_000_000)
        XCTAssertEqual(removed, [site])
        XCTAssertEqual(held, [[plan]], "onFilesChange is told the files left")
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["plan.pdf", "Remove"])
    }

    @MainActor func testARefusalIsSaidUnderThePart() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = try await show { KozmosFileUpload(holding: [plan], refusal: "Select up to 1 file.") }
        defer { window.isHidden = true }
        XCTAssertEqual(elements(in: window).compactMap(\.accessibilityLabel), ["plan.pdf", "Remove", "Select up to 1 file."])
    }

    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 400))
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
