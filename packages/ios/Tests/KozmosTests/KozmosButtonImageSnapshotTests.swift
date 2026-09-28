// Snapshots render on a simulator, so they only build for iOS. `swift test`
// runs on the host, where this file compiles to nothing and the property tests
// in KozmosButtonAPITests still run — see that file's note.
#if os(iOS)
import SnapshotTesting
import SwiftUI
import XCTest

@testable import Kozmos

/// The first test in this package that actually renders anything.
///
/// `KozmosButtonAPITests` — until now called `KozmosButtonSnapshotTests`, and
/// containing no snapshot — asserts `view.label`, `view.variant`,
/// `view.isDisabled`. Useful, but it cannot see a corner radius, a colour or a
/// layout, which is how the radius change from 8pt to 16pt swept the whole
/// library with nothing on iOS able to notice.
///
/// Recording is deliberate and manual, on the device
/// `scripts/check-ios-poi.mjs` pins for every simulator run, CI's included:
///
///     xcodebuild test -scheme Kozmos \
///       -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.5' \
///       -only-testing:KozmosTests/KozmosButtonImageSnapshotTests
///
/// Delete `__Snapshots__` to re-record. The references are tied to the
/// simulator's iOS version, so pin the same device and OS everywhere they run —
/// baselines taken on one iOS version will not match another, and a gate that
/// is red for that reason gets switched off, which is how the previous one
/// ended up verifying nothing. Until 2026-09-28 this class ran nowhere: CI's
/// simulator step listed its classes and this one was not on the list, so the
/// loading reference kept the system spinner for a week after the button's
/// own arc replaced it. They were recorded again then, on iPhone 17 Pro and
/// iOS 26.5.
final class KozmosButtonImageSnapshotTests: XCTestCase {
    private func assertRendered(
        _ view: some View,
        named name: String,
        file: StaticString = #file,
        testName: String = #function,
        line: UInt = #line
    ) {
        assertSnapshot(
            of: UIHostingController(rootView: view.padding(24)),
            as: .image(on: .iPhone13),
            named: name,
            file: file,
            testName: testName,
            line: line
        )
    }

    func testVariants() {
        assertRendered(KozmosButton("Continue", action: {}), named: "default")
        assertRendered(
            KozmosButton("Delete Item", variant: .destructive, action: {}),
            named: "destructive"
        )
    }

    func testStates() {
        assertRendered(
            KozmosButton("Cannot Execute", isDisabled: true, action: {}),
            named: "disabled"
        )
        assertRendered(
            KozmosButton("Processing", isLoading: true, action: {}),
            named: "loading"
        )
    }
}
#endif
