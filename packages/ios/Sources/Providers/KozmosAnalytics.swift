import SwiftUI

public typealias KozmosAnalyticsTracker = (KozmosAnalyticsEvent) -> Void

public struct KozmosAnalyticsKey: EnvironmentKey {
    /// With no tracker in the environment, an event goes to the console.
    public static let defaultValue: KozmosAnalyticsTracker = { event in
        print(logLine(for: event))
    }

    /// The line the default tracker prints for an event,
    /// `[Kozmos Analytics] <component> -> <eventName>`: the line Compose's
    /// `LocalKozmosAnalytics` default prints.
    static func logLine(for event: KozmosAnalyticsEvent) -> String {
        "[Kozmos Analytics] \(event.component) -> \(event.eventName)"
    }
}

public extension EnvironmentValues {
    var kozmosAnalytics: KozmosAnalyticsTracker {
        get { self[KozmosAnalyticsKey.self] }
        set { self[KozmosAnalyticsKey.self] = newValue }
    }
}
