package com.kozmos.contracts

enum class KozmosInstructionPartRole(val value: String) {
    Secondary("secondary")
}

/** Ordered localized words, including their own whitespace/punctuation. */
data class KozmosInstructionPart(
    val text: String,
    val role: KozmosInstructionPartRole? = null,
    /** BCP 47 speech language; null inherits the surrounding language. */
    val lang: String? = null
)

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

    /**
     * The name's first letter, which the details card shows in a supplied
     * logo's place while its artwork loads or if it fails to, as iOS does. A
     * POI with no logo shows none, on every platform.
     */
    val logoFallbackInitial: String
        get() = name.take(1).uppercase()
}

data class KozmosTravelEstimatePresentation(
    val durationSeconds: Double,
    /** The exact time, already localized: "3 min". The details card shows it. */
    val durationLabel: String,
    val distanceMetres: Double? = null,
    val distanceLabel: String? = null,
    val mode: String? = null,
    val modeLabel: String? = null,
    /**
     * Set when a result list shows this walk as a band rather than the exact
     * minutes (decision 50): [KozmosTravelTimeBand.forDuration] gives it.
     *
     * `KozmosPOIResultCard` then draws the band's words, and Nearby in the
     * success colour. The details card keeps [durationLabel], the exact
     * minutes, so one estimate serves the list and the details card alike.
     * Null, a result shows [durationLabel], as before.
     */
    val band: KozmosTravelTimeBand? = null
)

/**
 * A walk as a result list shows it (decision 50): a band, not the exact
 * minutes. Nearby is under a minute; then 1–2, 2–5 and 5–10 minutes, and
 * more than 10.
 *
 * The product passes the walking time it already has and Kozmos's rule,
 * [forDuration], turns it into one of these, so every product draws the edges
 * in the same place. The words are the card's, and translatable. Mirrors
 * `TravelTimeBand` on the web and `KozmosTravelTimeBand` on SwiftUI.
 */
enum class KozmosTravelTimeBand(val value: String) {
    Nearby("nearby"),
    OneToTwoMinutes("oneToTwoMinutes"),
    TwoToFiveMinutes("twoToFiveMinutes"),
    FiveToTenMinutes("fiveToTenMinutes"),
    MoreThanTenMinutes("moreThanTenMinutes");

    /** The tone this band is drawn in: Nearby's is success, every other neutral. */
    val tone: KozmosTravelTimeTone
        get() = if (this == Nearby) KozmosTravelTimeTone.Success else KozmosTravelTimeTone.Neutral

    companion object {
        /**
         * The band a walk falls in, from its length in seconds: Kozmos's rule
         * (decision 50), the web's `travelTimeBand`.
         *
         * Nearby is under a minute. Every band after it keeps its upper edge,
         * so a place exactly 2, 5 or 10 minutes away reads "1–2 min",
         * "2–5 min" or "5–10 min", and one a second further reads the next
         * band. Past the first minute that is the walk rounded up to whole
         * minutes: 1 or 2, 3 to 5, 6 to 10, then 11 and more. No walk falls
         * in two bands; a length below zero, or one that is not finite, falls
         * in none (null), and a card given no band shows the exact minutes.
         * Tested against the table the web and SwiftUI read,
         * packages/product-contracts/tests/travel-time-bands.txt.
         */
        fun forDuration(durationSeconds: Double): KozmosTravelTimeBand? = when {
            !durationSeconds.isFinite() || durationSeconds < 0 -> null
            durationSeconds < 60 -> Nearby
            durationSeconds <= 120 -> OneToTwoMinutes
            durationSeconds <= 300 -> TwoToFiveMinutes
            durationSeconds <= 600 -> FiveToTenMinutes
            else -> MoreThanTenMinutes
        }
    }
}

/**
 * The colour a band is drawn in: Nearby in the success colour, the others in
 * the card's normal text colour. A band's [KozmosTravelTimeBand.tone] says
 * which.
 */
enum class KozmosTravelTimeTone(val value: String) {
    Success("success"),
    Neutral("neutral")
}

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
    /**
     * The result's number, counted from 1: the number its map marker shows,
     * so the row and its pin share one number. A numbered list
     * (KozmosPOIResultList's `numbered`) draws it in the result's tab, and
     * analytics reports it as the result's position. Kozmos draws and reports
     * it as given and never renumbers, so number the results the way the map
     * numbers their pins. With numbering enabled, SDK presentation keeps the
     * number alongside Featured or badge labels, including grouped rows.
     * Only explicit legacy presentation hides a Featured number and lets a
     * number replace a badge. Marker sprites and logos are host-owned; a logo
     * does not suppress the SDK card's supplied number.
     */
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
    /**
     * A quiet tab: why this result is in this list. Ignored when [featured].
     * SDK presentation keeps it beside the supplied number when numbering
     * is enabled; only legacy presentation replaces it with a number.
     */
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
     * A short generated line about this result, already in the device's
     * language: why it answers the query, or what marks it out from the
     * results around it. One sentence, not a description — POIDetailPanel
     * owns the long form.
     *
     * Optional because most results do not have one. A card that is given
     * nothing draws nothing.
     */
    val summary: String? = null,
    /**
     * Revealed when the result is selected. The product decides what a POI
     * offers - a restaurant may book where a shop does not - so the card draws
     * what it is given and never assumes a fixed pair.
     */
    val actions: List<KozmosPOIResultActionPresentation> = emptyList(),
    /** Explicit host evidence that the requested staff language is not listed.
     * null is unknown; false hides the note, not a guarantee of staff availability.
     * Independent of query match, authored-name language and device/UI locale.
     */
    val languageNotListed: Boolean? = null
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
    val disabled: Boolean = false,
    /**
     * How many results sit on this level. Drawn as a small marker on the
     * floor's button, so a visitor can see that the answer is upstairs
     * without changing level to find out.
     *
     * `null` means unknown, which is not the same as zero: a selector given
     * no counts marks nothing, rather than marking every level as empty.
     */
    val resultCount: Int? = null
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

/** Semantic manoeuvre. Unrecognized engine values must not be guessed as a turn. */
enum class KozmosDirectionKind(val value: String) {
    Straight("straight"),
    Left("left"),
    Right("right"),
    Destination("destination"),
    LiftUp("lift-up"),
    LiftDown("lift-down"),
    EscalatorUp("escalator-up"),
    EscalatorDown("escalator-down"),
    StairsUp("stairs-up"),
    StairsDown("stairs-down"),
    LevelUp("level-up"),
    LevelDown("level-down"),
    Transition("transition"),
    TurnBack("turn-back"),
    Walking("walking"),
    Enter("enter"),
    Exit("exit"),
    RampUp("ramp-up"),
    RampDown("ramp-down");

    companion object { fun fromValue(value: String): KozmosDirectionKind? = entries.firstOrNull { it.value == value } }
}

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

/**
 * What the map is doing with the visitor's position, as the location control
 * shows it. [HeadingPaused] is heading remembered while the map has been moved
 * away from them (decision 45): the SDK's rotational Off. The next press goes
 * straight back to [Heading], which is the product's to do.
 */
enum class KozmosUserLocationState(val value: String) {
    Off("off"),
    Locating("locating"),
    Following("following"),
    Heading("heading"),
    HeadingPaused("heading-paused"),
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

/** What part of the venue a search was held to. */
enum class KozmosSearchScopeKind(val value: String) {
    Building("building"),
    Area("area")
}

/**
 * The part of the venue a search was held to.
 *
 * NH-D: a visitor types "coffee in this terminal" or "coffee after security",
 * and the list is limited to Terminal 2, or to the airside area. One chip says
 * which, and its x searches the whole venue again. Without this the chip was
 * hand-written (GAP-023).
 *
 * Mirrors `SearchScopePresentation` on the web and
 * `KozmosSearchScopePresentation` on SwiftUI.
 */
data class KozmosSearchScopePresentation(
    val kind: KozmosSearchScopeKind,
    /** The building's or the area's id, as the venue's data names it. */
    val id: String,
    /** Already localized: "Terminal 2", "After security". The chip's text. */
    val label: String,
    /**
     * The query without the words that set the scope - "coffee" for "coffee
     * in this terminal" - for the chip's x to search the whole venue with.
     * Null when nothing in the query set the scope, as when the host app
     * chose it.
     */
    val queryWithoutScope: String? = null
)

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
    val languageFallback: String? = null,
    /**
     * The part of the venue the results were limited to. Null means the whole
     * venue, which is the default (US9-AC1): a scope is something a query or
     * the host app asked for, never something the list assumes.
     */
    val appliedScope: KozmosSearchScopePresentation? = null
)
