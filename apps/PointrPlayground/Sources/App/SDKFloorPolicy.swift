import Kozmos
import PointrKit

/// The floor rules this host applies to PointrKit's levels. They are the
/// product's, not the design system's: `KozmosFloorSelector` lists the levels
/// in the order it is handed and stays controlled (decision 30), so the order
/// and the level the map starts on are decided here, on plain values, and
/// tested without the SDK.
enum SDKFloorPolicy {
    /// A level as the rules need it.
    struct Level: Equatable {
        /// The canonical floor id, the building and the level's index
        /// (`SDKPOIAdapter.floorId`); never a display name.
        let id: String
        /// PointrKit's level index.
        let index: Int
        let name: String
        let shortName: String
    }

    /// The levels in the order the selector lists them.
    static func ordered(_ levels: [Level]) -> [Level] {
        levels.sorted { $0.index < $1.index }
    }

    /// The selector's floors, in the list order, keyed by the canonical id.
    static func presentations(_ levels: [Level]) -> [KozmosFloorPresentation] {
        ordered(levels).map { .init(id: $0.id, label: $0.name, shortLabel: $0.shortName) }
    }

    /// The level the map starts on.
    static func startLevel(_ levels: [Level], sdkDefault: Level?) -> Level? {
        sdkDefault ?? levels.first
    }
}

extension SDKFloorPolicy.Level {
    init(_ level: PTRLevel) {
        self.init(id: SDKPOIAdapter.floorId(level), index: Int(level.index), name: level.name, shortName: level.shortName)
    }
}
