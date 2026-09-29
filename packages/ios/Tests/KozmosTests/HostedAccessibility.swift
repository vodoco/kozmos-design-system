import XCTest
import SwiftUI
@testable import Kozmos

#if os(iOS)
/// A view hosted in a window, read as VoiceOver is given it: the elements
/// SwiftUI builds for assistive technology, each with its label, its traits
/// and its activation — the double-tap.
///
/// SwiftUI builds that tree only while an assistive technology or
/// accessibility automation is on, and a unit test has neither: hosted
/// there, every `_UIHostingView` reported no elements at all (measured on
/// iOS 26.5, 2026-09-29). So the class turns automation on before its tests
/// and puts it back after them, through `_AXSSetAutomationEnabled` in
/// libAccessibility, looked up at run time. Were it ever missing, the tests
/// would find no element by name and fail; they cannot pass on an empty tree.
class HostedAccessibilityTestCase: XCTestCase {
    private typealias SetAutomation = @convention(c) (Int32) -> Void
    private typealias ReadAutomation = @convention(c) () -> Int32
    private static var automationBefore: Int32?

    private static func automation() -> (read: ReadAutomation?, set: SetAutomation?) {
        guard let library = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW) else { return (nil, nil) }
        return (
            dlsym(library, "_AXSAutomationEnabled").map { unsafeBitCast($0, to: ReadAutomation.self) },
            dlsym(library, "_AXSSetAutomationEnabled").map { unsafeBitCast($0, to: SetAutomation.self) }
        )
    }

    override class func setUp() {
        super.setUp()
        let (read, set) = automation()
        automationBefore = read?()
        set?(1)
    }

    override class func tearDown() {
        if let before = automationBefore { automation().set?(before) }
        automationBefore = nil
        super.tearDown()
    }

    /// No safe areas, as the snapshot strategy's own window has none.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    /// `view` at the top of a window of its own, laid out and settled.
    @MainActor func host<V: View>(_ view: V, size: CGSize = CGSize(width: 390, height: 640)) async -> UIWindow {
        let window = Window(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(
            rootView: view.frame(width: size.width, height: size.height, alignment: .top)
        )
        window.makeKeyAndVisible()
        await settle()
        return window
    }

    /// Lets layout, preferences and deferred work run.
    @MainActor func settle(_ passes: Int = 10) async {
        for _ in 0..<passes {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
    }

    /// Every element VoiceOver can land on, in the order the tree lists them.
    @MainActor func elements(in root: NSObject) -> [NSObject] {
        var seen = Set<ObjectIdentifier>()
        var found: [NSObject] = []
        func visit(_ node: NSObject) {
            guard seen.insert(ObjectIdentifier(node)).inserted else { return }
            if node.isAccessibilityElement { found.append(node) }
            children(of: node).forEach(visit)
        }
        visit(root)
        return found
    }

    /// The labels of the groups VoiceOver announces on the way into them —
    /// containers that are not elements themselves — each with the labels of
    /// the elements inside it.
    @MainActor func groups(in root: NSObject) -> [(label: String, members: [String])] {
        var seen = Set<ObjectIdentifier>()
        var found: [(label: String, members: [String])] = []
        func visit(_ node: NSObject) {
            guard seen.insert(ObjectIdentifier(node)).inserted else { return }
            if !node.isAccessibilityElement, !(node is UIView), let label = node.accessibilityLabel, !label.isEmpty {
                found.append((label, elements(in: node).compactMap(\.accessibilityLabel)))
            }
            children(of: node).forEach(visit)
        }
        visit(root)
        return found
    }

    /// A node's children as UIKit walks them: its accessibility elements, and
    /// a view's subviews.
    @MainActor private func children(of node: NSObject) -> [NSObject] {
        var children: [NSObject] = []
        if let elements = node.accessibilityElements as? [NSObject] {
            children += elements
        } else {
            let count = node.accessibilityElementCount()
            if count != NSNotFound, count > 0 {
                children += (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
            }
        }
        children += (node as? UIView)?.subviews ?? []
        return children
    }

    /// The labels VoiceOver reads, for a failure a person can act on.
    @MainActor func labels(in root: NSObject) -> [String] {
        elements(in: root).map { $0.accessibilityLabel ?? "(no label)" }
    }

    /// The one element named `label`; fails, listing the names there are, and
    /// throws if there is not exactly one. The failure is recorded before the
    /// throw: XCTest on iOS 26.5 reports an error thrown from an async test
    /// as an `InvalidTransition` of its own, and the reason would be lost.
    @MainActor func element(
        named label: String, in root: NSObject, file: StaticString = #filePath, line: UInt = #line
    ) throws -> NSObject {
        let named = elements(in: root).filter { $0.accessibilityLabel == label }
        guard named.count == 1 else {
            let reason = "expected one element named \"\(label)\", found \(named.count) among \(labels(in: root))"
            XCTFail(reason, file: file, line: line)
            throw MissingElement(errorDescription: reason)
        }
        return named[0]
    }

    struct MissingElement: LocalizedError {
        let errorDescription: String?
    }
}
#endif
