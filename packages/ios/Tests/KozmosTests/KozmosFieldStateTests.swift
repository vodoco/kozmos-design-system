import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-235: UIKit has no read-only trait, so a read-only field was said as
/// an editable one; GAP-236: a field's error was a text of its own after it,
/// heard only by moving past the field. Each field says "Read only", then its
/// error message, on the field itself, as its hint.
final class KozmosFieldStateTests: XCTestCase {
    func testTheHintSaysReadOnlyThenTheError() {
        XCTAssertEqual(KozmosFieldState.hint(readOnly: true, readOnlyLabel: "Read only", inError: true, errorMessage: "Enter a value."),
                       "Read only. Enter a value.")
        XCTAssertEqual(KozmosFieldState.hint(readOnly: false, readOnlyLabel: "Read only", inError: false, errorMessage: "Enter a value."), "")
        XCTAssertEqual(KozmosFieldState.hint(readOnly: true, readOnlyLabel: "Schreibgeschützt", inError: false, errorMessage: nil), "Schreibgeschützt")
    }

    func testOTPInputSaysItsDigitCountThenReadOnlyThenItsError() {
        let otp = KozmosOTPInput(value: .constant("12"), readOnly: true, error: true, errorMessage: "Wrong code.")
        XCTAssertEqual(otp.accessibilityHint, "6 digits. Read only. Wrong code.")
        XCTAssertEqual(KozmosOTPInput(value: .constant("")).accessibilityHint, "6 digits")
    }
}

#if os(iOS)
/// Read through the accessibility tree VoiceOver walks, on the simulator.
final class KozmosFieldStateHostedTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    @MainActor func testEachFieldSaysReadOnlyAndItsErrorOnTheField() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let options = [KozmosListboxOption(value: "a", label: "Alpha")]
        let fields: [(String, AnyView)] = [
            ("Input", AnyView(KozmosInput(text: .constant("x"), label: "Name", readOnly: true, error: true, errorMessage: "Enter a value."))),
            ("NumberInput", AnyView(KozmosNumberInput(value: .constant(1), label: "Floors", readOnly: true, error: true, errorMessage: "Enter a value."))),
            ("PasswordInput", AnyView(KozmosPasswordInput(text: .constant("x"), label: "Password", readOnly: true, error: true, errorMessage: "Enter a value."))),
            ("Combobox", AnyView(KozmosCombobox(options: options, label: "Type", readOnly: true, error: true, errorMessage: "Enter a value."))),
            ("MultiSelect", AnyView(KozmosMultiSelect(selectedValues: .constant([]), options: options, label: "Types", readOnly: true, error: true, errorMessage: "Enter a value."))),
        ]
        for (name, view) in fields {
            let window = try await show { view }
            // The field's own UIKit text field, the element VoiceOver focuses.
            var hints: [String] = []
            let deadline = Date().addingTimeInterval(10)
            while Date() <= deadline {
                hints = textFields(in: window).compactMap(\.accessibilityHint)
                if !hints.isEmpty { break }
                try await Task.sleep(nanoseconds: 50_000_000)
            }
            window.isHidden = true
            XCTAssertTrue(hints.contains("Read only. Enter a value."), "\(name) said \(hints)")
        }
    }

    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
        window.rootViewController = UIHostingController(rootView: content().environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 350_000_000)
        return window
    }

    @MainActor private func textFields(in view: UIView) -> [UITextField] {
        if let field = view as? UITextField { return [field] }
        return view.subviews.flatMap { textFields(in: $0) }
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
