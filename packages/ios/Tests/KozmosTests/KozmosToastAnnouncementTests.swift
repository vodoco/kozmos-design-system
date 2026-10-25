import SwiftUI
import XCTest
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// React's toast is Radix's, which announces each toast it shows through a
/// live region: `aria-live="assertive"` for the default, foreground toast,
/// with the toast's words. SwiftUI's posted nothing, so VoiceOver said
/// nothing when one appeared and was gone again in three seconds. It now
/// tells VoiceOver its title and description when it appears, said over what
/// VoiceOver is saying, as an assertive region is: not queued behind it.
final class KozmosToastAnnouncementTests: XCTestCase {
    #if os(iOS)
    private struct Presenter: View {
        @State var shown = false
        let description: String?
        var body: some View {
            ZStack {
                Button("Save") { shown = true }
                KozmosToast(isPresented: $shown, title: "Saved", description: description, autoDismissAfter: nil)
            }
        }
    }

    /// What the toasts in `view` post to VoiceOver once it is shown and while `act` runs.
    @MainActor private func announcements<V: View>(_ view: V, act: (UIWindow) async throws -> Void) async throws -> [KozmosToastAnnouncement] {
        var posted: [KozmosToastAnnouncement] = []
        let original = KozmosToast.post
        KozmosToast.post = { posted.append($0) }
        defer { KozmosToast.post = original }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        try await act(window)
        return posted
    }

    @MainActor func testAToastSaysItsWordsWhenItAppearsAndNotBefore() async throws {
        let hidden = try await announcements(Presenter(shown: false, description: "Your route is in Favourites")) { _ in }
        XCTAssertEqual(hidden, [], "a toast that is not shown said something")
        let shown = try await announcements(Presenter(shown: true, description: "Your route is in Favourites")) { _ in }
        XCTAssertEqual(shown, [KozmosToastAnnouncement(message: "Saved\nYour route is in Favourites", queued: false)])
    }

    @MainActor func testAToastWithNoDescriptionSaysItsTitle() async throws {
        let shown = try await announcements(Presenter(shown: true, description: nil)) { _ in }
        XCTAssertEqual(shown, [KozmosToastAnnouncement(message: "Saved", queued: false)])
    }
    #endif
}
