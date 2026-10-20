import Foundation
import SwiftUI

/// A type-erased wrapper to cleanly support encoding mixed property dictionaries to JSON
public enum KozmosAnyCodable: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null
    
    public init(_ value: Any?) {
        switch value {
        case let string as String: self = .string(string)
        case let int as Int: self = .int(int)
        case let double as Double: self = .double(double)
        case let bool as Bool: self = .bool(bool)
        default: self = .null
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let s): try container.encode(s)
        case .int(let i): try container.encode(i)
        case .double(let d): try container.encode(d)
        case .bool(let b): try container.encode(b)
        case .null: try container.encodeNil()
        }
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let b = try? container.decode(Bool.self) { self = .bool(b) }
        else if let i = try? container.decode(Int.self) { self = .int(i) }
        else if let d = try? container.decode(Double.self) { self = .double(d) }
        else if let s = try? container.decode(String.self) { self = .string(s) }
        else { self = .null }
    }
}

/// Defines the shape of our analytics events in iOS
public struct KozmosAnalyticsEvent: Codable, Identifiable {
    public let id: UUID
    public let eventName: String
    public let component: String
    public let timestamp: TimeInterval
    public let properties: [String: KozmosAnyCodable]?
    
    public init(eventName: String, component: String, properties: [String: Any]? = nil) {
        self.id = UUID()
        self.eventName = eventName
        self.component = component
        self.timestamp = Date().timeIntervalSince1970
        self.properties = properties?.mapValues { KozmosAnyCodable($0) }
    }
}

/// SwiftUI's `AnalyticsProvider`: an engine that collects the parts' events and
/// hands them to `onDispatch` in batches. `.kozmosAnalytics(batchDelayMs:onDispatch:)`
/// makes one for a view and sends that view's parts' events to it.
///
/// It batches as React's `AnalyticsProvider` does:
///
/// - The first event, when no batch is open, opens one, and the batch is
///   flushed `batchDelayMs` after it (2000 by default) with every event
///   tracked meanwhile, in the order tracked. A later event does not move the
///   flush, so a steady stream arrives every `batchDelayMs`, not when it stops.
///   An event after the flush opens the next batch.
/// - When the engine goes away (for the modifier's, when its view leaves the
///   hierarchy), whatever it still holds is delivered then, as React's
///   provider flushes when it unmounts.
/// - With no `onDispatch`, a batch goes to the console, each event as the
///   default `\.kozmosAnalytics` tracker prints it.
///
/// Its queue belongs to the main thread, and `onDispatch` is called there.
/// `trackEvent` and `flushQueue()` act at once on the main thread; from
/// another thread they are put on the main queue. Like React, it does not
/// flush when the app moves to the background.
public final class KozmosAnalytics: ObservableObject {
    /// Runs `fire` after `delay` seconds and returns a way to call it off. The
    /// main queue in an app; a test passes a clock it moves by hand.
    typealias Schedule = (_ delay: TimeInterval, _ fire: @escaping () -> Void) -> () -> Void

    /// The events of the open batch, in the order tracked.
    private(set) var queue: [KozmosAnalyticsEvent] = []
    /// Read when a batch is flushed, so the modifier hands it the newest
    /// closure, as React's provider reads its newest `onDispatch`.
    var onDispatch: (([KozmosAnalyticsEvent]) -> Void)?
    /// The wait from a batch's first event to its flush. A change applies
    /// from the next batch: an open one keeps the wait it opened with.
    var batchDelay: TimeInterval

    private let schedule: Schedule
    private var cancelFlush: (() -> Void)?

    public convenience init(batchDelayMs: Int = 2000, onDispatch: (([KozmosAnalyticsEvent]) -> Void)? = nil) {
        self.init(batchDelayMs: batchDelayMs, schedule: KozmosAnalytics.onMainQueue, onDispatch: onDispatch)
    }

    init(batchDelayMs: Int = 2000, schedule: @escaping Schedule, onDispatch: (([KozmosAnalyticsEvent]) -> Void)?) {
        self.batchDelay = Self.seconds(batchDelayMs)
        self.schedule = schedule
        self.onDispatch = onDispatch
    }

    /// Tracks an event of the product's own, with the parts' events.
    public func trackEvent(component: String, eventName: String, properties: [String: Any]? = nil) {
        track(KozmosAnalyticsEvent(eventName: eventName, component: component, properties: properties))
    }

    /// Tracks an event a part sent, as it sent it: what the tracker the
    /// modifier puts in `\.kozmosAnalytics` calls.
    func track(_ event: KozmosAnalyticsEvent) {
        onMain {
            self.queue.append(event)
            guard self.cancelFlush == nil else { return }
            self.cancelFlush = self.schedule(self.batchDelay) { [weak self] in
                guard let self else { return }
                self.cancelFlush = nil
                self.flush()
            }
        }
    }

    /// Delivers the open batch now. The next event opens a new one.
    public func flushQueue() {
        onMain { self.flush() }
    }

    private func flush() {
        cancelFlush?()
        cancelFlush = nil
        guard !queue.isEmpty else { return }
        let batch = queue
        queue.removeAll()
        Self.deliver(batch, to: onDispatch)
    }

    deinit {
        cancelFlush?()
        guard !queue.isEmpty else { return }
        // Not through `self`, which is going: until 17 Oct this flush captured
        // `[weak self]`, already nil here, and the batch was dropped.
        let batch = queue
        let dispatch = onDispatch
        if Thread.isMainThread {
            Self.deliver(batch, to: dispatch)
        } else {
            DispatchQueue.main.async { Self.deliver(batch, to: dispatch) }
        }
    }

    private static func deliver(_ batch: [KozmosAnalyticsEvent], to dispatch: (([KozmosAnalyticsEvent]) -> Void)?) {
        if let dispatch {
            dispatch(batch)
        } else {
            for event in batch { print(KozmosAnalyticsKey.logLine(for: event)) }
        }
    }

    /// Runs `body` now on the main thread, else on the main queue. It holds
    /// the engine until it has run, so an event tracked as the engine is
    /// released is still delivered.
    private func onMain(_ body: @escaping () -> Void) {
        if Thread.isMainThread { body() } else { DispatchQueue.main.async(execute: body) }
    }

    static func seconds(_ milliseconds: Int) -> TimeInterval {
        TimeInterval(max(0, milliseconds)) / 1000
    }

    static let onMainQueue: Schedule = { delay, fire in
        let work = DispatchWorkItem(block: fire)
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
        return { work.cancel() }
    }
}

/// What `.kozmosAnalytics(batchDelayMs:onDispatch:)` does: it keeps one engine
/// for as long as its view is in the hierarchy, and puts a tracker that feeds
/// it in `\.kozmosAnalytics`, so every part inside sends to it.
///
/// As a nested React `AnalyticsProvider` takes its own subtree's events, a
/// nested modifier takes the events of the parts inside it, and the one above
/// gets none of them. A tracker set inside it with `.environment(\.kozmosAnalytics, …)`
/// takes its own subtree's events in the same way.
struct KozmosAnalyticsModifier: ViewModifier {
    let batchDelayMs: Int
    let onDispatch: ([KozmosAnalyticsEvent]) -> Void
    @StateObject private var engine: KozmosAnalytics

    init(
        batchDelayMs: Int,
        schedule: @escaping KozmosAnalytics.Schedule = KozmosAnalytics.onMainQueue,
        onDispatch: @escaping ([KozmosAnalyticsEvent]) -> Void
    ) {
        self.batchDelayMs = batchDelayMs
        self.onDispatch = onDispatch
        _engine = StateObject(
            wrappedValue: KozmosAnalytics(batchDelayMs: batchDelayMs, schedule: schedule, onDispatch: onDispatch))
    }

    func body(content: Content) -> some View {
        // The newest closure and delay, as React's provider reads its newest
        // props. Plain properties of the engine, not view state.
        engine.onDispatch = onDispatch
        engine.batchDelay = KozmosAnalytics.seconds(batchDelayMs)
        return content
            // Weak, so a part that outlives the view cannot keep the engine,
            // and its flush, from going with it.
            .environment(\.kozmosAnalytics) { [weak engine] event in engine?.track(event) }
            .environmentObject(engine)
    }
}

public extension View {
    /// Sends the events of the Kozmos parts inside this view to `onDispatch`,
    /// in batches, as React's `AnalyticsProvider` does: each batch
    /// `batchDelayMs` after its first event (2000 by default), and what is
    /// left when this view leaves the hierarchy. `onDispatch` is called on the
    /// main thread.
    ///
    /// The engine is also in the environment, as an `@EnvironmentObject var
    /// analytics: KozmosAnalytics`, whose `trackEvent` adds a product's own
    /// events to the same batches.
    func kozmosAnalytics(batchDelayMs: Int = 2000, onDispatch: @escaping ([KozmosAnalyticsEvent]) -> Void) -> some View {
        modifier(KozmosAnalyticsModifier(batchDelayMs: batchDelayMs, onDispatch: onDispatch))
    }
}
