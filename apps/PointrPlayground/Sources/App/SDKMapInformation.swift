import Foundation
import PointrKit
import Kozmos

/// App-owned QA copy. Provider credits remain the SDK's responsibility; approved
/// tenant legal/support content can be supplied here without changing Kozmos.
enum SDKMapInformation {
    static func current(venue: String?) -> KozmosMapInfoContent {
        content(
            venue: venue,
            appVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
            build: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String,
            sdkVersion: Bundle(for: PTRMapWidgetViewController.self).object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        )
    }

    static func content(venue: String?, appVersion: String?, build: String?, sdkVersion: String?) -> KozmosMapInfoContent {
        var versions: [KozmosMapInfoVersion] = []
        if let appVersion, !appVersion.isEmpty {
            let suffix = build.flatMap { $0.isEmpty ? nil : " (\($0))" } ?? ""
            versions.append(.init(id: "app", label: "QA app version", value: appVersion + suffix))
        }
        if let sdkVersion, !sdkVersion.isEmpty {
            versions.append(.init(id: "sdk", label: "Pointr SDK version", value: sdkVersion))
        }
        let place = venue.flatMap { $0.isEmpty ? nil : " for \($0)" } ?? ""
        return .init(
            title: "About this QA map",
            introduction: "Internal playground using live Design-QA data\(place). Map rendering and routing use Pointr SDK; the controls use Kozmos.",
            faqs: [
                .init(id: "places", question: "How do I find a place?", answer: "Search by name or choose a quick-access category. Select a result to open its place card."),
                .init(id: "floors", question: "How do I change floors?", answer: "Open the floor selector and choose an available level."),
                .init(id: "state", question: "Will closing information reset the map?", answer: "No. Your selected place, search, floor and route remain in this session.")
            ],
            versions: versions
        )
    }
}
