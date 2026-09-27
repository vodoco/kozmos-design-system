package com.kozmos.contracts

/**
 * Platform-neutral, already-localized presentation models.
 *
 * These mirror the TypeScript contracts in `@kozmos-ds/product-contracts` so that
 * React, SwiftUI, and Compose Product / SDK components describe the same shape.
 *
 * API and map-SDK objects must be adapted into these contracts outside UI
 * components. Human-readable labels are included alongside machine values so
 * each platform renders the same meaning without embedding English formatters.
 */

/**
 * Whether a place is open, and how close that is to changing.
 *
 * OpeningSoon and ClosingSoon are their own states rather than a flag on the
 * other two: a visitor reads "closing soon" as a reason to hurry, and drawing
 * it as plain "open" is the difference between arriving and arriving too late.
 * Where the boundary sits is the product's, not this contract's.
 */
enum class KozmosPOIAvailability(val value: String) {
    Open("open"),
    OpeningSoon("openingSoon"),
    ClosingSoon("closingSoon"),
    Closed("closed"),
    Unknown("unknown")
}

enum class KozmosPOIAccessRestrictions(val value: String) {
    /** The POI is known to have no access restrictions. */
    None("none"),
    Present("present"),
    Unknown("unknown")
}

enum class KozmosPOIAction(val value: String) {
    Navigate("navigate"),
    Favourite("favourite"),
    Bookmark("bookmark"),
    Share("share"),
    Order("order")
}

/**
 * What a RESULT may offer: everything a POI offers, plus opening its own
 * details.
 *
 * Kept apart from [KozmosPOIAction] rather than folded into it, mirroring the
 * web contract. A detail panel cannot offer to open itself, and widening the
 * shared list would make every consumer of it handle a case that never
 * arrives.
 */
enum class KozmosPOIResultAction(val value: String) {
    Navigate("navigate"),
    Favourite("favourite"),
    Bookmark("bookmark"),
    Share("share"),
    Order("order"),
    Details("details")
}

/**
 * A short, already-localized tab above a result: "Alternative", "Similar",
 * "Close by".
 *
 * Deliberately not how [KozmosPOIResultPresentation.featured] is expressed.
 * Featured is a property of the POI in the CMS and is read by more than this
 * card - the map marker draws a featured POI with its logo - so it stays a
 * boolean with meaning, and this stays a label with none.
 */
data class KozmosPOIResultBadgePresentation(
    /** Already localized. Keep it to a word or two; it sits in a 24dp tab. */
    val label: String
)

/** What a result card offers on the selected result, in the order given. */
data class KozmosPOIResultActionPresentation(
    val action: KozmosPOIResultAction,
    /** Already localized. */
    val label: String,
    /** Drawn first and filled. Exactly one action should carry it. */
    val primary: Boolean = false,
    val disabled: Boolean = false
)

data class KozmosPOIMediaPresentation(
    val id: String,
    val src: String,
    val alt: String
)

/**
 * What sort of attribute a chip is.
 *
 * Access restrictions, dietary, accessibility and services are four meanings
 * and one shape - a short localized label with an optional icon - so they share
 * one list rather than gaining three more. The kind is what lets a card order
 * them, tone them, or show only some.
 */
enum class KozmosPOIAttributeKind(val value: String) {
    Service("service"),
    Dietary("dietary"),
    Accessibility("accessibility"),
    Restriction("restriction")
}

data class KozmosPOIServicePresentation(
    val id: String,
    val label: String,
    val iconName: String? = null,
    /** Optional decorative asset; the label stays visible. */
    val iconUrl: String? = null,
    /** Use the asset alpha as a current-colour mask (monochrome assets only). */
    val iconMonochrome: Boolean = false,
    /** Defaults to a plain service when absent. */
    val kind: KozmosPOIAttributeKind? = null
)

data class KozmosPOILogoPresentation(
    val src: String,
    val alt: String
)

data class KozmosPOIPresentation(
    val id: String,
    val name: String,
    /**
     * Optional: a venue need not have levels.
     *
     * Story 15's edge case is a single-storey venue, where every result
     * sitting on "Ground Floor" is noise rather than information. A product
     * with levels supplies these exactly as before; one without omits them,
     * and the card draws what is left rather than a floor nobody has.
     */
    val floorId: String? = null,
    val floorLabel: String? = null,
    val categoryId: String? = null,
    val categoryLabel: String? = null,
    val buildingId: String? = null,
    val buildingLabel: String? = null,
    val logo: KozmosPOILogoPresentation? = null,
    val media: List<KozmosPOIMediaPresentation> = emptyList(),
    val availability: KozmosPOIAvailability? = null,
    val availabilityLabel: String? = null,
    val description: String? = null,
    val accessRestrictions: KozmosPOIAccessRestrictions? = null,
    val accessRestrictionsLabel: String? = null,
    val services: List<KozmosPOIServicePresentation>? = null,
    val actions: List<KozmosPOIAction> = emptyList()
) {
    /** Floor and building joined the same way every platform renders it. */
    val locationLabel: String
        get() = listOfNotNull(floorLabel, buildingLabel)
            .filter { it.isNotEmpty() }
            .joinToString(" · ")

    /** Single-character fallback used when no logo artwork is supplied. */
    val logoFallbackInitial: String
        get() = name.take(1).uppercase()
}

data class KozmosTravelEstimatePresentation(
    val durationSeconds: Double,
    val durationLabel: String,
    val distanceMetres: Double? = null,
    val distanceLabel: String? = null,
    val mode: String? = null,
    val modeLabel: String? = null
)

/**
 * Why a result is in the list.
 *
 * So the further lists MAP-474 shows under their own headings come from data
 * rather than from the order a product happened to build. Absent means exact.
 */
enum class KozmosPOIResultMatch(val value: String) {
    Exact("exact"),
    Alternative("alternative"),
    Unconfirmed("unconfirmed")
}

/**
 * Why a search came back empty.
 *
 * An empty list is not one situation, and "nothing found" leaves the visitor
 * to guess what to undo.
 */
enum class KozmosSearchEmptyKind(val value: String) {
    /** The query matched nothing anywhere in the venue. */
    NoMatch("noMatch"),
    /** Matches exist, but every one was excluded by a filter. */
    FilteredOut("filteredOut"),
    /** The venue has no data for this at all - a category nobody has mapped. */
    Unavailable("unavailable")
}

data class KozmosPOIResultPresentation(
    val poiId: String,
    val resultIndex: Int,
    /**
     * Optional for the same reason as [KozmosPOIPresentation.floorId]: no
     * levels, no floor.
     */
    val floorId: String? = null,
    val selected: Boolean = false,
    val featured: Boolean = false,
    val travelEstimate: KozmosTravelEstimatePresentation? = null,
    val available: Boolean? = null,
    val unavailableReason: String? = null,
    /** A quiet tab: why this result is in this list. Ignored when [featured]. */
    val badge: KozmosPOIResultBadgePresentation? = null,
    /**
     * Whether this result answers the query exactly, stands in for one that
     * would, or has not been confirmed. Absent means exact.
     */
    val match: KozmosPOIResultMatch? = null,
    /**
     * The unit or suite, where a venue has them: "Unit 214", "Suite 3B".
     * Separate from [KozmosPOIPresentation.floorLabel] because a visitor is
     * told both.
     */
    val unitLabel: String? = null,
    /**
     * BCP 47 tag for the language [KozmosPOIPresentation.name] is authored in,
     * when it differs from the interface language. MAP-474 Story 2 requires an
     * authored name to be shown exactly as authored, and TalkBack needs the tag
     * to say it correctly.
     */
    val nameLanguage: String? = null,
    /**
     * Revealed when the result is selected. The product decides what a POI
     * offers - a restaurant may book where a shop does not - so the card draws
     * what it is given and never assumes a fixed pair.
     */
    val actions: List<KozmosPOIResultActionPresentation> = emptyList()
) {
    /** Mirrors the web rule: only an explicit `false` marks a result unavailable. */
    val isAvailable: Boolean
        get() = available != false

    /** Returns a copy with `selected` driven by the single canonical selection ID. */
    fun selecting(selectedPoiId: String?): KozmosPOIResultPresentation =
        if (selectedPoiId == null) this else copy(selected = selectedPoiId == poiId)
}

data class KozmosFloorPresentation(
    val id: String,
    val label: String,
    val shortLabel: String,
    val disabled: Boolean = false
)

data class KozmosCategoryPresentation(
    val id: String,
    val label: String,
    val iconName: String? = null,
    /**
     * The venue's own category artwork, as the taxonomy publishes it.
     *
     * A quick-access category carries an `iconUrl` in the taxonomy's
     * published JSON. That artwork belongs to the venue and is versioned on
     * Pointr's cadence, not this package's, so it arrives as a URL rather
     * than a bundled asset - the eight that were bundled went stale the
     * moment a taxonomy release landed, and were removed.
     */
    val iconUrl: String? = null,
    val selected: Boolean = false,
    val disabled: Boolean = false,
    val resultCount: Int? = null,
    val resultCountLabel: String? = null
)

enum class KozmosRoutePreference(val value: String) {
    Quickest("quickest"),
    StepFree("step-free"),
    Custom("custom")
}

data class KozmosRouteOptionPresentation(
    val id: String,
    val label: String,
    val durationSeconds: Double,
    val durationLabel: String,
    val distanceMetres: Double,
    val distanceLabel: String,
    val preference: KozmosRoutePreference,
    val selected: Boolean = false,
    val available: Boolean = true,
    val warning: String? = null
)

enum class KozmosRouteReadiness(val value: String) {
    Idle("idle"),
    Calculating("calculating"),
    Ready("ready"),
    NoRoute("no-route"),
    Error("error")
}

enum class KozmosMapReadiness(val value: String) {
    Loading("loading"),
    Ready("ready"),
    Error("error"),
    Offline("offline"),
    Unsupported("unsupported")
}

enum class KozmosUserLocationState(val value: String) {
    Off("off"),
    Locating("locating"),
    Following("following"),
    Heading("heading"),
    PermissionDenied("permission-denied"),
    Stale("stale"),
    Unavailable("unavailable")
}

data class KozmosMapCollisionInsets(
    val top: Double = 0.0,
    val right: Double = 0.0,
    val bottom: Double = 0.0,
    val left: Double = 0.0
) {
    companion object {
        val Zero = KozmosMapCollisionInsets()
    }
}

/**
 * A search's results and what to say when there are none.
 *
 * Mirrors `SearchResponsePresentation` on the web and
 * `KozmosSearchResponsePresentation` on SwiftUI.
 */
data class KozmosSearchResponsePresentation(
    val results: List<KozmosPOIResultPresentation> = emptyList(),
    /** Present only when [results] is empty. */
    val emptyKind: KozmosSearchEmptyKind? = null,
    /**
     * The filter that emptied the list, already localized - "HQ Building",
     * "Gluten-free". Story 15 AC6: name what to undo.
     */
    val emptiedBy: String? = null,
    /**
     * Set when results were found in a language other than the one asked for,
     * carrying the BCP 47 tag actually used. Story 2's unhappy path: a visitor
     * reading Japanese who gets English names should be told, not left to
     * wonder.
     */
    val languageFallback: String? = null
)
