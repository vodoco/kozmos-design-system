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
        /// PointrKit's level index. Its reference: "0 is ground level".
        let index: Int
        let name: String
        let shortName: String
    }

    /// Top floor first (decision 29): by PointrKit's numeric index, highest
    /// first, so the basements' negative indices come last. Never by name:
    /// as text, "L10" sorts before "L2".
    static func ordered(_ levels: [Level]) -> [Level] {
        levels.sorted { $0.index != $1.index ? $0.index > $1.index : $0.id < $1.id }
    }

    /// The selector's floors, in the list order, keyed by the canonical id.
    static func presentations(_ levels: [Level]) -> [KozmosFloorPresentation] {
        ordered(levels).map { .init(id: $0.id, label: $0.name, shortLabel: $0.shortName) }
    }

    /// The level the map starts on (decision 30): Pointr's default level,
    /// else the ground level.
    ///
    /// - Pointr's default level is the SDK's `PTRBuilding.defaultLevel`.
    ///   PointrKit 10.3.0 documents it as the level marked default on Pointr
    ///   Cloud, else the level with index 0, else index 1, else the lowest
    ///   level, so it names one whenever the building has a level. Its type
    ///   is optional all the same, and this is what the host does without it.
    /// - Ground is the level with index 0, as `PTRLevel.index` documents.
    ///   Names ("G", "L0", "Ground") are never read.
    /// - With neither, the host carries on down the order PointrKit documents
    ///   for its own default: index 1, else the lowest level. That keeps the
    ///   selector on the level PointrKit would pick itself.
    static func startLevel(_ levels: [Level], sdkDefault: Level?) -> Level? {
        sdkDefault
            ?? levels.first { $0.index == 0 }
            ?? levels.first { $0.index == 1 }
            ?? levels.min { $0.index < $1.index }
    }
}

extension SDKFloorPolicy.Level {
    init(_ level: PTRLevel) {
        self.init(id: SDKPOIAdapter.floorId(level), index: Int(level.index), name: level.name, shortName: level.shortName)
    }
}
