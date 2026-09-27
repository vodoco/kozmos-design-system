import Foundation

/// Platform-neutral, already-localized presentation models.
///
/// These mirror the TypeScript contracts in `@kozmos-ds/product-contracts` so that
/// React, SwiftUI, and Compose Product / SDK components describe the same shape.
///
/// API and map-SDK objects must be adapted into these contracts outside UI
/// components. Human-readable labels are included alongside machine values so
/// each platform renders the same meaning without embedding English formatters.

/// Whether a place is open, and how close that is to changing.
///
/// openingSoon and closingSoon are their own states rather than a flag on the
/// other two: a visitor reads "closing soon" as a reason to hurry, and drawing
/// it as plain "open" is the difference between arriving and arriving too late.
/// Where the boundary sits is the product's, not this contract's.
public enum KozmosPOIAvailability: String, Sendable, Hashable, CaseIterable, Codable {
    case open
    case openingSoon
    case closingSoon
    case closed
    case unknown
}

public enum KozmosPOIAccessRestrictions: String, Sendable, Hashable, CaseIterable, Codable {
    /// The POI is known to have no access restrictions.
    ///
    /// Reference this case fully qualified — `KozmosPOIAccessRestrictions.none` —
    /// wherever the value is optional, so it is never confused with `Optional.none`.
    case none
    case present
    case unknown
}

public enum KozmosPOIAction: String, Sendable, Hashable, CaseIterable, Codable {
    case navigate
    case favourite
    case bookmark
    case share
    case order
}

/// What a RESULT may offer: everything a POI offers, plus opening its own details.
///
/// Kept apart from ``KozmosPOIAction`` rather than folded into it, mirroring
/// the web contract. A detail panel cannot offer to open itself, and widening
/// the shared list would make every consumer handle a case that never arrives.
public enum KozmosPOIResultAction: String, Sendable, Hashable, CaseIterable, Codable {
    case navigate
    case favourite
    case bookmark
    case share
    case order
    case details
}

/// A short, already-localized tab above a result: "Alternative", "Similar", "Close by".
///
/// Deliberately not how ``KozmosPOIResultPresentation/featured`` is expressed.
/// Featured is a property of the POI in the CMS and is read by more than this
/// card - the map marker draws a featured POI with its logo - so it stays a
/// boolean with meaning, and this stays a label with none.
public struct KozmosPOIResultBadgePresentation: Sendable, Hashable, Codable {
    /// Already localized. Keep it to a word or two; it sits in a 24pt tab.
    public let label: String

    public init(label: String) {
        self.label = label
    }
}

/// What a result card offers on the selected result, in the order given.
public struct KozmosPOIResultActionPresentation: Sendable, Hashable, Identifiable, Codable {
    public var id: String { action.rawValue + "-" + label }
    public let action: KozmosPOIResultAction
    /// Already localized.
    public let label: String
    /// Drawn first and filled. Exactly one action should carry it.
    public let primary: Bool
    public let disabled: Bool

    public init(
        action: KozmosPOIResultAction,
        label: String,
        primary: Bool = false,
        disabled: Bool = false
    ) {
        self.action = action
        self.label = label
        self.primary = primary
        self.disabled = disabled
    }
}

public struct KozmosPOIMediaPresentation: Sendable, Hashable, Identifiable, Codable {
    public let id: String
    public let src: String
    public let alt: String

    public init(id: String, src: String, alt: String) {
        self.id = id
        self.src = src
        self.alt = alt
    }
}

/// What sort of attribute a chip is.
///
/// Access restrictions, dietary, accessibility and services are four meanings
/// and one shape - a short localized label with an optional icon - so they
/// share one list rather than gaining three more. The kind is what lets a card
/// order them, tone them, or show only some.
public enum KozmosPOIAttributeKind: String, Sendable, Hashable, CaseIterable, Codable {
    case service
    case dietary
    case accessibility
    case restriction
}

public struct KozmosPOIServicePresentation: Sendable, Hashable, Identifiable, Codable {
    public let id: String
    public let label: String
    public let iconName: String?
    /// Optional decorative asset; the label stays visible.
    public let iconUrl: String?
    /// Use the asset alpha as a current-colour mask (monochrome assets only).
    public let iconMonochrome: Bool
    /// Defaults to a plain service when absent.
    public let kind: KozmosPOIAttributeKind?

    public init(
        id: String,
        label: String,
        iconName: String? = nil,
        iconUrl: String? = nil,
        iconMonochrome: Bool = false,
        kind: KozmosPOIAttributeKind? = nil
    ) {
        self.id = id
        self.label = label
        self.iconName = iconName
        self.iconUrl = iconUrl
        self.iconMonochrome = iconMonochrome
        self.kind = kind
    }
}

public struct KozmosPOILogoPresentation: Sendable, Hashable, Codable {
    public let src: String
    public let alt: String

    public init(src: String, alt: String) {
        self.src = src
        self.alt = alt
    }
}

public struct KozmosPOIPresentation: Sendable, Hashable, Identifiable, Codable {
    public let id: String
    public let name: String
    public let categoryId: String?
    public let categoryLabel: String?
    /// Optional: a venue need not have levels.
    ///
    /// Story 15's edge case is a single-storey venue, where every result
    /// sitting on "Ground Floor" is noise rather than information. A product
    /// with levels supplies these exactly as before; one without omits them,
    /// and the card draws what is left rather than a floor nobody has.
    public let floorId: String?
    public let floorLabel: String?
    public let buildingId: String?
    public let buildingLabel: String?
    public let logo: KozmosPOILogoPresentation?
    public let media: [KozmosPOIMediaPresentation]
    public let availability: KozmosPOIAvailability?
    public let availabilityLabel: String?
    public let description: String?
    public let accessRestrictions: KozmosPOIAccessRestrictions?
    public let accessRestrictionsLabel: String?
    public let services: [KozmosPOIServicePresentation]?
    public let actions: [KozmosPOIAction]

    public init(
        id: String,
        name: String,
        categoryId: String? = nil,
        categoryLabel: String? = nil,
        floorId: String? = nil,
        floorLabel: String? = nil,
        buildingId: String? = nil,
        buildingLabel: String? = nil,
        logo: KozmosPOILogoPresentation? = nil,
        media: [KozmosPOIMediaPresentation] = [],
        availability: KozmosPOIAvailability? = nil,
        availabilityLabel: String? = nil,
        description: String? = nil,
        accessRestrictions: KozmosPOIAccessRestrictions? = nil,
        accessRestrictionsLabel: String? = nil,
        services: [KozmosPOIServicePresentation]? = nil,
        actions: [KozmosPOIAction] = []
    ) {
        self.id = id
        self.name = name
        self.categoryId = categoryId
        self.categoryLabel = categoryLabel
        self.floorId = floorId
        self.floorLabel = floorLabel
        self.buildingId = buildingId
        self.buildingLabel = buildingLabel
        self.logo = logo
        self.media = media
        self.availability = availability
        self.availabilityLabel = availabilityLabel
        self.description = description
        self.accessRestrictions = accessRestrictions
        self.accessRestrictionsLabel = accessRestrictionsLabel
        self.services = services
        self.actions = actions
    }

    /// Floor and building joined the same way every platform renders it.
    public var locationLabel: String {
        [floorLabel, buildingLabel]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " · ")
    }

    /// Single-character fallback used when no logo artwork is supplied.
    public var logoFallbackInitial: String {
        name.prefix(1).uppercased()
    }
}

public struct KozmosTravelEstimatePresentation: Sendable, Hashable, Codable {
    public let durationSeconds: Double
    public let durationLabel: String
    public let distanceMetres: Double?
    public let distanceLabel: String?
    public let mode: String?
    public let modeLabel: String?

    public init(
        durationSeconds: Double,
        durationLabel: String,
        distanceMetres: Double? = nil,
        distanceLabel: String? = nil,
        mode: String? = nil,
        modeLabel: String? = nil
    ) {
        self.durationSeconds = durationSeconds
        self.durationLabel = durationLabel
        self.distanceMetres = distanceMetres
        self.distanceLabel = distanceLabel
        self.mode = mode
        self.modeLabel = modeLabel
    }
}

/// Why a result is in the list.
///
/// So the further lists MAP-474 shows under their own headings come from data
/// rather than from the order a product happened to build. Absent means exact.
public enum KozmosPOIResultMatch: String, Sendable, Hashable, CaseIterable, Codable {
    case exact
    case alternative
    case unconfirmed
}

/// Why a search came back empty.
///
/// An empty list is not one situation, and "nothing found" leaves the visitor
/// to guess what to undo.
public enum KozmosSearchEmptyKind: String, Sendable, Hashable, CaseIterable, Codable {
    /// The query matched nothing anywhere in the venue.
    case noMatch
    /// Matches exist, but every one was excluded by a filter.
    case filteredOut
    /// The venue has no data for this at all - a category nobody has mapped.
    case unavailable
}

public struct KozmosPOIResultPresentation: Sendable, Hashable {
    public let poiId: String
    public let resultIndex: Int
    public let selected: Bool
    public let featured: Bool
    /// Optional for the same reason as `KozmosPOIPresentation.floorId`:
    /// no levels, no floor.
    public let floorId: String?
    public let travelEstimate: KozmosTravelEstimatePresentation?
    public let available: Bool?
    public let unavailableReason: String?
    /// A quiet tab: why this result is in this list. Ignored when `featured`.
    public let badge: KozmosPOIResultBadgePresentation?
    /// Whether this result answers the query exactly, stands in for one that
    /// would, or has not been confirmed. Absent means exact.
    public let match: KozmosPOIResultMatch?
    /// The unit or suite, where a venue has them: "Unit 214", "Suite 3B".
    /// Separate from `floorLabel` because a visitor is told both.
    public let unitLabel: String?
    /// BCP 47 tag for the language `poi.name` is authored in, when it differs
    /// from the interface language. MAP-474 Story 2 requires an authored name
    /// to be shown exactly as authored, and VoiceOver needs the tag to say it
    /// correctly.
    public let nameLanguage: String?
    /// Revealed when the result is selected. The product decides what a POI
    /// offers - a restaurant may book where a shop does not - so the card draws
    /// what it is given and never assumes a fixed pair.
    public let actions: [KozmosPOIResultActionPresentation]

    public init(
        poiId: String,
        resultIndex: Int,
        selected: Bool = false,
        featured: Bool = false,
        floorId: String? = nil,
        travelEstimate: KozmosTravelEstimatePresentation? = nil,
        available: Bool? = nil,
        unavailableReason: String? = nil,
        badge: KozmosPOIResultBadgePresentation? = nil,
        match: KozmosPOIResultMatch? = nil,
        unitLabel: String? = nil,
        nameLanguage: String? = nil,
        actions: [KozmosPOIResultActionPresentation] = []
    ) {
        self.poiId = poiId
        self.resultIndex = resultIndex
        self.selected = selected
        self.featured = featured
        self.floorId = floorId
        self.travelEstimate = travelEstimate
        self.available = available
        self.unavailableReason = unavailableReason
        self.badge = badge
        self.match = match
        self.unitLabel = unitLabel
        self.nameLanguage = nameLanguage
        self.actions = actions
    }

    /// Mirrors the web rule: only an explicit `false` marks a result unavailable.
    public var isAvailable: Bool {
        available != false
    }

    /// Returns a copy with `selected` driven by the single canonical selection ID.
    public func selecting(_ selectedPoiId: String?) -> KozmosPOIResultPresentation {
        guard let selectedPoiId else { return self }
        return KozmosPOIResultPresentation(
            poiId: poiId,
            resultIndex: resultIndex,
            selected: selectedPoiId == poiId,
            featured: featured,
            floorId: floorId,
            travelEstimate: travelEstimate,
            available: available,
            unavailableReason: unavailableReason,
            // Every stored property must be carried. Swift rebuilds the struct
            // by hand here rather than copying it, so a new field that is not
            // listed is silently dropped on every selection change -- which is
            // exactly what badge and actions did until a test asked.
            badge: badge,
            match: match,
            unitLabel: unitLabel,
            nameLanguage: nameLanguage,
            actions: actions
        )
    }
}

public struct KozmosFloorPresentation: Sendable, Hashable, Identifiable {
    public let id: String
    public let label: String
    public let shortLabel: String
    public let disabled: Bool

    public init(id: String, label: String, shortLabel: String, disabled: Bool = false) {
        self.id = id
        self.label = label
        self.shortLabel = shortLabel
        self.disabled = disabled
    }
}

public struct KozmosCategoryPresentation: Sendable, Hashable, Identifiable {
    public let id: String
    public let label: String
    public let iconName: String?
    /// The venue's own category artwork, as the taxonomy publishes it.
    ///
    /// A quick-access category carries an `iconUrl` in the taxonomy's
    /// published JSON. That artwork belongs to the venue and is versioned on
    /// Pointr's cadence, not this package's, so it arrives as a URL rather
    /// than a bundled asset - the eight that were bundled went stale the
    /// moment a taxonomy release landed, and were removed.
    public let iconUrl: String?
    public let selected: Bool
    public let disabled: Bool
    public let resultCount: Int?
    public let resultCountLabel: String?

    public init(
        id: String,
        label: String,
        iconName: String? = nil,
        iconUrl: String? = nil,
        selected: Bool = false,
        disabled: Bool = false,
        resultCount: Int? = nil,
        resultCountLabel: String? = nil
    ) {
        self.id = id
        self.label = label
        self.iconName = iconName
        self.iconUrl = iconUrl
        self.selected = selected
        self.disabled = disabled
        self.resultCount = resultCount
        self.resultCountLabel = resultCountLabel
    }
}

public enum KozmosRoutePreference: String, Sendable, Hashable, CaseIterable {
    case quickest
    case stepFree = "step-free"
    case custom
}

public struct KozmosRouteOptionPresentation: Sendable, Hashable, Identifiable {
    public let id: String
    public let label: String
    public let durationSeconds: Double
    public let durationLabel: String
    public let distanceMetres: Double
    public let distanceLabel: String
    public let preference: KozmosRoutePreference
    public let selected: Bool
    public let available: Bool
    public let warning: String?

    public init(
        id: String,
        label: String,
        durationSeconds: Double,
        durationLabel: String,
        distanceMetres: Double,
        distanceLabel: String,
        preference: KozmosRoutePreference,
        selected: Bool = false,
        available: Bool = true,
        warning: String? = nil
    ) {
        self.id = id
        self.label = label
        self.durationSeconds = durationSeconds
        self.durationLabel = durationLabel
        self.distanceMetres = distanceMetres
        self.distanceLabel = distanceLabel
        self.preference = preference
        self.selected = selected
        self.available = available
        self.warning = warning
    }
}

public enum KozmosRouteReadiness: String, Sendable, Hashable, CaseIterable {
    case idle
    case calculating
    case ready
    case noRoute = "no-route"
    case error
}

public enum KozmosMapReadiness: String, Sendable, Hashable, CaseIterable {
    case loading
    case ready
    case error
    case offline
    case unsupported
}

public enum KozmosUserLocationState: String, Sendable, Hashable, CaseIterable {
    case off
    case locating
    case following
    case heading
    case permissionDenied = "permission-denied"
    case stale
    case unavailable
}

public struct KozmosMapCollisionInsets: Sendable, Hashable {
    public let top: Double
    public let right: Double
    public let bottom: Double
    public let left: Double

    public static let zero = KozmosMapCollisionInsets()

    public init(top: Double = 0, right: Double = 0, bottom: Double = 0, left: Double = 0) {
        self.top = top
        self.right = right
        self.bottom = bottom
        self.left = left
    }
}

/// A search's results and what to say when there are none.
///
/// Mirrors `SearchResponsePresentation` on the web and
/// `KozmosSearchResponsePresentation` on Compose.
public struct KozmosSearchResponsePresentation: Sendable, Hashable {
    public let results: [KozmosPOIResultPresentation]
    /// Present only when `results` is empty.
    public let emptyKind: KozmosSearchEmptyKind?
    /// The filter that emptied the list, already localized - "HQ Building",
    /// "Gluten-free". Story 15 AC6: name what to undo.
    public let emptiedBy: String?
    /// Set when results were found in a language other than the one asked for,
    /// carrying the BCP 47 tag actually used. Story 2's unhappy path: a visitor
    /// reading Japanese who gets English names should be told, not left to
    /// wonder.
    public let languageFallback: String?

    public init(
        results: [KozmosPOIResultPresentation] = [],
        emptyKind: KozmosSearchEmptyKind? = nil,
        emptiedBy: String? = nil,
        languageFallback: String? = nil
    ) {
        self.results = results
        self.emptyKind = emptyKind
        self.emptiedBy = emptiedBy
        self.languageFallback = languageFallback
    }
}
