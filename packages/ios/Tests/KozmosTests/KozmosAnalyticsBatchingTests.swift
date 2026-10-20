import Darwin
import SwiftUI
import XCTest

@testable import Kozmos

/// The `KozmosAnalytics` engine delivers events as React's `AnalyticsProvider`
/// does (packages/react/src/utils/analytics.tsx), on a clock the test moves by
/// hand:
///
/// - a batch is flushed `batchDelayMs` after its first event, with every event
///   tracked meanwhile, in the order tracked; a later event does not move the
///   flush, so a steady stream is delivered every `batchDelayMs`;
/// - when the engine goes away, what it still holds is delivered at once;
/// - with no `onDispatch`, a batch goes to the console;
/// - `onDispatch` runs on the main thread.
///
/// Until 17 Oct (PR #288's finding) the engine restarted its timer on every
/// event, which made it a debounce: one event a second for five seconds was
/// delivered once, at six. Its `deinit` flush captured `[weak self]`, already
/// nil there, so what it held was dropped. With no `onDispatch` a batch went
/// nowhere. `KozmosAnalyticsProviderTests` drives the modifier with real parts.
final class KozmosAnalyticsBatchingTests: XCTestCase {
    private var clock: ManualClock!
    /// Each batch `onDispatch` received: `"<ms on the clock>ms: <event names>"`.
    private var batches: [String] = []
    private var dispatchedOnMain: [Bool] = []

    override func setUp() {
        super.setUp()
        clock = ManualClock()
        batches = []
        dispatchedOnMain = []
    }

    /// An engine on the test's clock; with no `batchDelayMs`, the default.
    private func engine(batchDelayMs: Int? = nil) -> KozmosAnalytics {
        let record: ([KozmosAnalyticsEvent]) -> Void = { [unowned self] events in
            self.batches.append("\(self.clock.now)ms: \(events.map(\.eventName).joined(separator: ", "))")
            self.dispatchedOnMain.append(Thread.isMainThread)
        }
        guard let batchDelayMs else { return KozmosAnalytics(schedule: clock.schedule(after:_:), onDispatch: record) }
        return KozmosAnalytics(batchDelayMs: batchDelayMs, schedule: clock.schedule(after:_:), onDispatch: record)
    }

    /// Moves the clock to `ms` in steps of 500, letting the main queue run
    /// after each: the engine before 17 Oct queued and flushed through it.
    private func advance(to ms: Int) {
        while clock.now < ms {
            clock.advance(milliseconds: min(500, ms - clock.now))
            drainMainQueue()
        }
    }

    /// Runs what is already on the main queue, and what that puts on it.
    private func drainMainQueue() {
        for _ in 0..<2 {
            var reached = false
            DispatchQueue.main.async { reached = true }
            while !reached { RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: 0.01)) }
        }
    }

    /// React's timer starts with a batch's first event and is not reset by
    /// the next. Five events, at 0, 1, 2.5, 3 and 4 seconds, with the default
    /// delay, React's 2000ms, are two batches: the first two at 2 seconds,
    /// the other three at 4.5.
    func testABatchIsFlushedBatchDelayAfterItsFirstEventAndALaterEventDoesNotMoveIt() {
        let analytics = engine()
        func track(_ name: String, at ms: Int) {
            advance(to: ms)
            analytics.trackEvent(component: "Test", eventName: name)
            drainMainQueue()
        }
        track("a", at: 0)
        track("b", at: 1000)
        advance(to: 1999)
        XCTAssertEqual(batches, [], "a batch was delivered before 2 seconds")
        track("c", at: 2500)
        track("d", at: 3000)
        track("e", at: 4000)
        advance(to: 10_000)
        XCTAssertEqual(batches, ["2000ms: a, b", "4500ms: c, d, e"])
        withExtendedLifetime(analytics) {}
    }

    /// React flushes on unmount. The engine flushes when it goes away, so a
    /// batch still waiting for its delay is delivered, at once.
    func testWhenTheEngineGoesAwayItDeliversWhatItHolds() {
        var analytics: KozmosAnalytics? = engine(batchDelayMs: 60_000)
        analytics?.trackEvent(component: "Test", eventName: "first")
        analytics?.trackEvent(component: "Test", eventName: "second")
        drainMainQueue()
        XCTAssertEqual(batches, [])
        analytics = nil
        drainMainQueue()
        XCTAssertEqual(batches, ["0ms: first, second"])
        XCTAssertEqual(dispatchedOnMain, [true])
        advance(to: 61_000)
        XCTAssertEqual(batches.count, 1, "its cancelled flush ran after it went away")
    }

    /// Released on another thread, the engine still delivers, on the main thread.
    func testReleasedOffTheMainThreadItDeliversOnTheMainThread() {
        var analytics: KozmosAnalytics? = engine(batchDelayMs: 60_000)
        analytics?.trackEvent(component: "Test", eventName: "queued")
        drainMainQueue()
        var last = analytics
        analytics = nil
        var releasedOnMain = true
        let released = expectation(description: "released on a background queue")
        DispatchQueue.global().async {
            releasedOnMain = Thread.isMainThread
            last = nil
            released.fulfill()
        }
        wait(for: [released], timeout: 5)
        XCTAssertFalse(releasedOnMain)
        XCTAssertNil(last)
        drainMainQueue()
        XCTAssertEqual(batches, ["0ms: queued"])
        XCTAssertEqual(dispatchedOnMain, [true])
    }

    /// `flushQueue()` on the main thread delivers what is queued before it
    /// returns, and the next event starts a new batch.
    func testFlushQueueDeliversAtOnceAndTheNextEventStartsANewBatch() {
        let analytics = engine()
        analytics.trackEvent(component: "Test", eventName: "a")
        analytics.trackEvent(component: "Test", eventName: "b")
        drainMainQueue()
        advance(to: 500)
        analytics.flushQueue()
        XCTAssertEqual(batches, ["500ms: a, b"])
        analytics.trackEvent(component: "Test", eventName: "c")
        drainMainQueue()
        advance(to: 2499)
        XCTAssertEqual(batches, ["500ms: a, b"])
        advance(to: 2500)
        XCTAssertEqual(batches, ["500ms: a, b", "2500ms: c"])
        withExtendedLifetime(analytics) {}
    }

    /// React logs a batch it has nowhere to send. With no `onDispatch`, each
    /// event goes to the console as the default tracker prints it.
    func testWithNoOnDispatchABatchGoesToTheConsole() throws {
        let analytics = KozmosAnalytics(batchDelayMs: 0, schedule: clock.schedule(after:_:), onDispatch: nil)
        let printed = try standardOutput {
            analytics.trackEvent(component: "Switch", eventName: "switch_toggled")
            analytics.trackEvent(component: "Checkbox", eventName: "checkbox_toggled")
            drainMainQueue()
            advance(to: 500)
        }
        XCTAssertTrue(
            printed.contains(
                "[Kozmos Analytics] Switch -> switch_toggled\n[Kozmos Analytics] Checkbox -> checkbox_toggled\n"),
            "printed \(printed.debugDescription)")
        withExtendedLifetime(analytics) {}
    }

    /// What `body` writes to standard output while it runs.
    private func standardOutput(_ body: () -> Void) throws -> String {
        let pipe = Pipe()
        fflush(stdout)
        let saved = dup(STDOUT_FILENO)
        guard saved >= 0, dup2(pipe.fileHandleForWriting.fileDescriptor, STDOUT_FILENO) >= 0 else {
            XCTFail("standard output could not be redirected")
            return ""
        }
        body()
        fflush(stdout)
        dup2(saved, STDOUT_FILENO)
        close(saved)
        try pipe.fileHandleForWriting.close()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(decoding: data, as: UTF8.self)
    }
}

#if os(iOS)
  import UIKit

  /// `.kozmosAnalytics(batchDelayMs:onDispatch:)` with real parts, hosted and
  /// pressed as VoiceOver presses them: what a part sends inside it reaches
  /// `onDispatch`, in batches; it is delivered when the modified view leaves
  /// the hierarchy, as React's provider flushes on unmount; and a nested
  /// modifier takes its own subtree's events, as React's nearest provider does.
  /// Until 17 Oct the modifier put its engine in the environment as an
  /// `environmentObject` no part reads, and `onDispatch` was never called.
  final class KozmosAnalyticsProviderTests: XCTestCase {
    @MainActor private func withAutomation(_ body: @MainActor () async throws -> Void) async throws {
      typealias Get = @convention(c) () -> Int32
      typealias Set = @convention(c) (Int32) -> Void
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      try await body()
    }

    @MainActor private func host<V: View>(_ content: V) async -> UIWindow {
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      window.rootViewController = UIHostingController(rootView: content.frame(width: 390, height: 844))
      window.makeKeyAndVisible()
      await settle()
      return window
    }

    /// Lets SwiftUI and the main queue catch up.
    @MainActor private func settle() async {
      for _ in 0..<10 {
        try? await Task.sleep(nanoseconds: 30_000_000)
      }
    }

    /// Waits up to 3 seconds for `done`, then settles: a loaded runner can
    /// take longer than `settle()` to redraw.
    @MainActor private func settle(until done: () -> Bool) async {
      for _ in 0..<150 where !done() {
        try? await Task.sleep(nanoseconds: 20_000_000)
      }
      await settle()
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
      if node.accessibilityElementsHidden { return [] }
      if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
      if node.isAccessibilityElement { return [node] }
      let children: [NSObject]
      if let values = node.accessibilityElements as? [NSObject], !values.isEmpty {
        children = values
      } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
        children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
      } else {
        children = (node as? UIView)?.subviews ?? []
      }
      return children.flatMap { elements($0) }
    }

    /// Presses the part VoiceOver reads as `label`.
    @MainActor private func press(_ label: String, in window: UIWindow) throws {
      let element = try XCTUnwrap(elements(window).first { $0.accessibilityLabel == label }, "no \(label)")
      XCTAssertTrue(element.accessibilityActivate(), "\(label) took no press")
    }

    /// A checkbox pressed twice inside the modifier: both events reach
    /// `onDispatch`, together, with the part's name and properties.
    @MainActor func testAPartsEventsReachOnDispatchInOneBatch() async throws {
      try await withAutomation {
        var batches: [[KozmosAnalyticsEvent]] = []
        let window = await host(
          KozmosCheckbox(checked: .constant(false), label: "Accept terms")
            .kozmosAnalytics(batchDelayMs: 0) { batches.append($0) })
        defer { window.isHidden = true }
        try press("Accept terms", in: window)
        try press("Accept terms", in: window)
        await settle { !batches.isEmpty }
        XCTAssertEqual(batches.map { $0.map(\.eventName) }, [["checkbox_toggled", "checkbox_toggled"]])
        XCTAssertEqual(batches.first?.map(\.component), ["Checkbox", "Checkbox"])
        guard case .bool(true)? = batches.first?.first?.properties?["checked"] else {
          return XCTFail("the event's properties are \(String(describing: batches.first?.first?.properties))")
        }
      }
    }

    /// On a clock the test moves: two presses 1.5 seconds apart are one
    /// batch, delivered 2 seconds after the first.
    @MainActor func testTheBatchIsDeliveredBatchDelayAfterTheFirstPress() async throws {
      try await withAutomation {
        let clock = ManualClock()
        var batches: [String] = []
        let window = await host(
          KozmosSwitch(checked: .constant(false), label: "Notifications")
            .modifier(KozmosAnalyticsModifier(batchDelayMs: 2000, schedule: clock.schedule(after:_:)) { events in
              batches.append("\(clock.now)ms: \(events.map(\.eventName).joined(separator: ", "))")
            }))
        defer { window.isHidden = true }
        try press("Notifications", in: window)
        clock.advance(milliseconds: 1500)
        try press("Notifications", in: window)
        clock.advance(milliseconds: 499)
        await settle()
        XCTAssertEqual(batches, [])
        clock.advance(milliseconds: 1)
        await settle()
        XCTAssertEqual(batches, ["2000ms: switch_toggled, switch_toggled"])
        clock.advance(milliseconds: 10_000)
        await settle()
        XCTAssertEqual(batches.count, 1)
      }
    }

    /// The view above the modifier redraws between two presses: they are still
    /// one batch, delivered 2 seconds after the first. React's provider keeps
    /// its queue across renders; until 17 Oct the modifier made a new engine,
    /// with an empty queue, each time the view above redrew.
    @MainActor func testARedrawOfTheViewAboveKeepsTheBatch() async throws {
      try await withAutomation {
        let clock = ManualClock()
        let redraws = Redraws()
        var batches: [String] = []
        let window = await host(
          RedrawingSwitch(redraws: redraws, schedule: clock.schedule(after:_:)) { events in
            batches.append("\(clock.now)ms: \(events.map(\.eventName).joined(separator: ", "))")
          })
        defer { window.isHidden = true }
        try press("Notifications", in: window)
        let drawn = redraws.drawn
        redraws.count += 1
        await settle { redraws.drawn > drawn }
        XCTAssertGreaterThan(redraws.drawn, drawn, "the view above did not redraw")
        try press("Notifications", in: window)
        clock.advance(milliseconds: 1999)
        await settle()
        XCTAssertEqual(batches, [])
        clock.advance(milliseconds: 1)
        await settle()
        XCTAssertEqual(batches, ["2000ms: switch_toggled, switch_toggled"])
      }
    }

    /// The modified view leaves the hierarchy with a batch waiting a minute:
    /// the batch is delivered then, as React's provider flushes on unmount.
    @MainActor func testWhatIsQueuedIsDeliveredWhenTheViewLeaves() async throws {
      try await withAutomation {
        let shown = Shown()
        var batches: [[String]] = []
        let window = await host(RemovableCheckbox(shown: shown) { batches.append($0.map(\.eventName)) })
        defer { window.isHidden = true }
        try press("Remember me", in: window)
        await settle()
        XCTAssertEqual(batches, [], "delivered before its delay")
        shown.isShown = false
        await settle { !batches.isEmpty }
        XCTAssertEqual(batches, [["checkbox_toggled"]])
      }
    }

    /// React's nearest provider takes its subtree's events, and the one above
    /// it gets none of them. So does the nearest modifier.
    @MainActor func testANestedModifierTakesItsOwnSubtreesEvents() async throws {
      try await withAutomation {
        var outer: [String] = []
        var inner: [String] = []
        let window = await host(
          VStack {
            KozmosCheckbox(checked: .constant(false), label: "Outside")
            KozmosSwitch(checked: .constant(false), label: "Inside")
              .kozmosAnalytics(batchDelayMs: 0) { inner += $0.map(\.eventName) }
          }
          .kozmosAnalytics(batchDelayMs: 0) { outer += $0.map(\.eventName) })
        defer { window.isHidden = true }
        try press("Outside", in: window)
        try press("Inside", in: window)
        await settle { !outer.isEmpty && !inner.isEmpty }
        XCTAssertEqual(outer, ["checkbox_toggled"])
        XCTAssertEqual(inner, ["switch_toggled"])
      }
    }
  }

  private final class Shown: ObservableObject {
    @Published var isShown = true
  }

  private final class Redraws: ObservableObject {
    @Published var count = 0
    /// How many times `RedrawingSwitch` has drawn.
    var drawn = 0
  }

  /// A switch inside the modifier, under a view that redraws when `redraws`
  /// changes and builds the modifier again each time.
  private struct RedrawingSwitch: View {
    @ObservedObject var redraws: Redraws
    let schedule: KozmosAnalytics.Schedule
    let onDispatch: ([KozmosAnalyticsEvent]) -> Void

    var body: some View {
      redraws.drawn += 1
      return VStack {
        Text("Drawn for \(redraws.count)")
        KozmosSwitch(checked: .constant(false), label: "Notifications")
          .modifier(KozmosAnalyticsModifier(batchDelayMs: 2000, schedule: schedule, onDispatch: onDispatch))
      }
    }
  }

  private struct RemovableCheckbox: View {
    @ObservedObject var shown: Shown
    let onDispatch: ([KozmosAnalyticsEvent]) -> Void

    var body: some View {
      VStack {
        if shown.isShown {
          KozmosCheckbox(checked: .constant(false), label: "Remember me")
            .kozmosAnalytics(batchDelayMs: 60_000, onDispatch: onDispatch)
        }
      }
    }
  }
#endif
