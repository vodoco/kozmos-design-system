import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 222 (GAP-235): a read-only field is drawn read only, not
/// disabled: its value at full strength, selectable, and VoiceOver says its
/// name, its value and "Read only", never "dimmed". SwiftUI drew every
/// read-only field `.disabled`, so it was dimmed and its value could not be
/// selected or copied.
final class KozmosReadOnlyFieldTests: XCTestCase {
    func testASecureValueIsDotsAndNeverSaid() {
        let secure = KozmosReadOnlyValue(text: "hunter2", placeholder: "Password", textColor: .black,
                                         placeholderColor: .gray, alignment: .leading,
                                         accessibilityName: "Password", hint: "Read only", secure: true)
        XCTAssertEqual(secure.shown, String(repeating: "\u{2022}", count: 7))
        XCTAssertEqual(secure.spokenValue, "")
        let plain = KozmosReadOnlyValue(text: "", placeholder: "None", textColor: .black,
                                        placeholderColor: .gray, alignment: .leading,
                                        accessibilityName: "Name", hint: "Read only")
        XCTAssertEqual(plain.shown, "None")
    }
}

#if os(iOS)
/// Read through the accessibility tree VoiceOver walks, on the simulator.
final class KozmosReadOnlyFieldHostedTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    @MainActor func testEachReadOnlyFieldIsSaidReadOnlyAndNotDimmed() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let options = [KozmosListboxOption(value: "a", label: "Alpha")]
        let day = Date(timeIntervalSince1970: 1_800_000_000)
        let fields: [(String, String, AnyView)] = [
            ("Input", "Name", AnyView(KozmosInput(text: .constant("Gate A12"), label: "Name", readOnly: true))),
            ("NumberInput", "Floors", AnyView(KozmosNumberInput(value: .constant(4), label: "Floors", readOnly: true))),
            ("PasswordInput", "Password", AnyView(KozmosPasswordInput(text: .constant("hunter2"), label: "Password", readOnly: true))),
            ("Combobox", "Type", AnyView(KozmosCombobox(inputValue: .constant("Alpha"), options: options, label: "Type", readOnly: true))),
            ("MultiSelect", "Types", AnyView(KozmosMultiSelect(options: options, label: "Types", readOnly: true))),
            ("DatePicker", "Opening day", AnyView(KozmosDatePicker(selection: .constant(day), label: "Opening day", readOnly: true))),
            ("TimePicker", "Opens at", AnyView(KozmosTimePicker(selection: .constant(day), label: "Opens at", readOnly: true))),
            ("ColorPicker", "Brand", AnyView(KozmosColorPicker(value: .constant("#135BEC"), label: "Brand", readOnly: true))),
        ]
        for (name, label, view) in fields {
            let window = try await show { view }
            var found: NSObject?
            let deadline = Date().addingTimeInterval(10)
            while Date() <= deadline {
                // The field, after any drawn label of the same words.
                found = elements(in: window).last { $0.accessibilityLabel == label }
                if found?.accessibilityHint != nil { break }
                try await Task.sleep(nanoseconds: 50_000_000)
            }
            let all = elements(in: window).map { "\($0.accessibilityLabel ?? "-")|\($0.accessibilityHint ?? "-")" }
            let editable = textFields(in: window).count
            window.isHidden = true
            let field = try XCTUnwrap(found, "\(name): no element named \(label) in \(all)")
            XCTAssertTrue((field.accessibilityHint ?? "").contains("Read only"), "\(name) hint: \(field.accessibilityHint ?? "-")")
            XCTAssertFalse(field.accessibilityTraits.contains(.notEnabled), "\(name) is said dimmed")
            XCTAssertEqual(editable, 0, "\(name) still draws a text field")
            if name == "Input" { XCTAssertEqual(field.accessibilityValue, "Gate A12") }
            if name == "PasswordInput" { XCTAssertNotEqual(field.accessibilityValue, "hunter2", "the password is said") }
        }
    }

    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 400))
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
