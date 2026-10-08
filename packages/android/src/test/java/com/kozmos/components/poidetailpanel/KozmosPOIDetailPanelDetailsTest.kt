package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIAvailability
import com.kozmos.contracts.KozmosPOIDetailAttributeGroup
import com.kozmos.contracts.KozmosPOIDetailDescription
import com.kozmos.contracts.KozmosPOIDetailSummary
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import com.kozmos.contracts.KozmosPOIDetailTone
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIOpeningHoursPresentation
import com.kozmos.contracts.KozmosPOIOpeningHoursRow
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIServicePresentation
import com.kozmos.contracts.KozmosPOISupplementaryAction
import com.kozmos.contracts.KozmosPOISupplementaryActionPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The details model on Compose (`details`), as SwiftUI's
 * `KozmosPOIDetailsPresentation` and the web's `POIDetailsPresentation` draw
 * it: the same parts, in the same order, read the same way by TalkBack.
 * Before it, Compose's panel took no details at all.
 */
class KozmosPOIDetailPanelDetailsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun service(id: String, label: String, iconName: String? = null) =
        KozmosPOIServicePresentation(id = id, label = label, iconName = iconName)

    private val restaurant = KozmosPOIPresentation(
        id = "il-forno",
        name = "Il Forno",
        floorId = "1",
        floorLabel = "Current floor",
        buildingLabel = "Building A",
        availability = KozmosPOIAvailability.Open,
        availabilityLabel = "Open",
        description = "Wood-fired pizza in a lively open kitchen.",
        services = listOf(service("dine-in", "Dine-in")),
        actions = listOf(KozmosPOIAction.Navigate, KozmosPOIAction.Share, KozmosPOIAction.Favourite)
    )

    private val labels = mapOf(
        KozmosPOIAction.Navigate to "Go",
        KozmosPOIAction.Share to "Share",
        KozmosPOIAction.Favourite to "Favourite"
    )

    private val hours = KozmosPOIOpeningHoursPresentation(
        label = "Opening hours",
        summary = "Open · Closes 12:30 pm",
        rows = listOf(
            KozmosPOIOpeningHoursRow(id = "weekdays", day = "Monday–Friday", hours = "8:00 am–12:30 pm"),
            KozmosPOIOpeningHoursRow(id = "sunday", day = "Sunday", hours = "Closed")
        ),
        note = "Venue-local hours."
    )

    private val details = KozmosPOIDetailsPresentation(
        travelEstimate = KozmosTravelEstimatePresentation(
            durationSeconds = 120.0,
            durationLabel = "2 min",
            distanceMetres = 120.0,
            distanceLabel = "120 m"
        ),
        summary = listOf(
            KozmosPOIDetailSummary(id = "rating", kind = KozmosPOIDetailSummaryKind.Rating, label = "Rating", value = "4.7 / 5", detail = "32 reviews"),
            KozmosPOIDetailSummary(id = "price", kind = KozmosPOIDetailSummaryKind.Price, label = "Price", value = "Moderately expensive", priceLevel = 3),
            KozmosPOIDetailSummary(id = "access", kind = KozmosPOIDetailSummaryKind.Accessibility, label = "Accessibility", value = "Step-free", tone = KozmosPOIDetailTone.Success),
            // A fourth: the row shows three.
            KozmosPOIDetailSummary(id = "crowd", kind = KozmosPOIDetailSummaryKind.Crowd, label = "Busyness", value = "Quiet")
        ),
        groups = listOf(
            KozmosPOIDetailAttributeGroup(id = "cuisines", heading = "Cuisines", items = listOf(service("italian", "Italian"), service("pizza", "Pizza"))),
            KozmosPOIDetailAttributeGroup(id = "empty", heading = "Amenities", items = emptyList()),
            KozmosPOIDetailAttributeGroup(id = "dietary", heading = "Dietary options", items = listOf(service("vegetarian", "Vegetarian"), service("vegan", "Vegan")))
        ),
        openingHours = hours,
        description = KozmosPOIDetailDescription(
            preview = "Family-run since 1998.",
            full = "Family-run since 1998. The terrace overlooks the atrium."
        ),
        tags = listOf(service("patio", "#patio")),
        supplementaryActions = listOf(
            KozmosPOISupplementaryActionPresentation(KozmosPOISupplementaryAction.Book, "Book"),
            KozmosPOISupplementaryActionPresentation(KozmosPOISupplementaryAction.Call, "Call")
        )
    )

    @Composable
    private fun Panel(
        place: KozmosPOIPresentation = restaurant,
        model: KozmosPOIDetailsPresentation = details,
        actionStates: Map<KozmosPOIAction, KozmosPOIActionState> = emptyMap(),
        supplementaryStates: Map<KozmosPOISupplementaryAction, KozmosPOIActionState> = emptyMap(),
        onSupplementaryAction: ((KozmosPOISupplementaryAction, String) -> Unit)? = { _, _ -> },
        loadingLabel: String = "Loading",
        direction: LayoutDirection = LayoutDirection.Ltr
    ) {
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            KozmosMaterialTheme {
                Box(Modifier.width(360.dp)) {
                    KozmosPOIDetailPanel(
                        poi = place,
                        actionLabels = labels,
                        onAction = { _, _ -> },
                        actionStates = actionStates,
                        onClose = {},
                        details = model,
                        supplementaryActionStates = supplementaryStates,
                        onSupplementaryAction = onSupplementaryAction,
                        loadingLabel = loadingLabel
                    )
                }
            }
        }
    }

    private val density get() = paparazzi.context.resources.displayMetrics.density

    /** The one node whose own text is [text]; fails, listing the texts there are, if not exactly one. */
    private fun ReadSemantics.showing(text: String): ReadNode {
        val found = merged.filter { text in it.texts }
        check(found.size == 1) { "expected one node showing \"$text\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    private fun ReadSemantics.shows(text: String) = merged.any { text in it.texts }

    @Test
    fun theDetailsDrawInSwiftUIsOrder() {
        val tree = paparazzi.readSemantics { Panel() }
        val order = listOf(
            tree.showing("Il Forno"),
            tree.showing("Wood-fired pizza in a lively open kitchen."),
            tree.showing("Go"),
            tree.named("Rating, 4.7 / 5, 32 reviews"),
            tree.showing("Service options"),
            tree.showing("Cuisines"),
            tree.showing("Dietary options"),
            tree.showing("Opening hours"),
            tree.showing("Open · Closes 12:30 pm"),
            tree.showing("Family-run since 1998."),
            tree.showing("Read more"),
            tree.showing("#patio")
        )
        val tops = order.map { it.frame.top }
        assertEquals(
            "the parts are out of SwiftUI's order: ${order.map { it.texts.ifEmpty { listOf(it.description) } }} at $tops",
            tops.sorted(), tops
        )
        assertTrue("two parts share a line: $tops", tops.zipWithNext().all { (a, b) -> b > a })
        // In the strip, after the POI's own actions.
        val strip = listOf("Go", "Share", "Book", "Call").map { tree.showing(it).frame.left }
        assertEquals("the strip is out of order: $strip", strip.sorted(), strip)
    }

    @Test
    fun everyHeadingIsAHeadingAndEverySectionAGroup() {
        val tree = paparazzi.readSemantics { Panel() }
        for (heading in listOf("Il Forno", "Service options", "Cuisines", "Dietary options", "Opening hours")) {
            assertTrue("\"$heading\" is not a heading", tree.showing(heading).heading)
        }
        for (text in listOf("Family-run since 1998.", "Italian", "#patio", "Open · Closes 12:30 pm")) {
            assertFalse("\"$text\" is a heading", tree.showing(text).heading)
        }
        // Each section is one group, named as the web's <section> is.
        for (section in listOf("Service options", "Cuisines", "Dietary options", "Opening hours", "Tags")) {
            assertTrue("\"$section\" is not read as one group", tree.named(section).traversalGroup)
        }
        // And each set of chips is a list, as the web's <ul>: services, the
        // two groups with items, and the tags.
        assertEquals(listOf(1, 2, 2, 1), tree.merged.mapNotNull { it.collectionRows })
        assertEquals(1, tree.named("Tags").collectionRows)
        // A chip is information, not a button.
        assertNull(tree.showing("Italian").role)
        assertNull(tree.showing("Italian").click)
        // A group with no items is left out, as on iOS and the web.
        assertFalse(tree.shows("Amenities"))
        assertFalse(tree.names().contains("Amenities"))
    }

    @Test
    fun theSummaryShowsTheFirstThreeFactsInEqualColumnsEachReadAsOne() {
        val tree = paparazzi.readSemantics { Panel() }
        val facts = listOf(
            tree.named("Rating, 4.7 / 5, 32 reviews"),
            // The price is said in words; its "$" marks are never read.
            tree.named("Price, Moderately expensive"),
            tree.named("Accessibility, Step-free")
        )
        assertFalse("a fourth fact is shown", tree.names().any { "Busyness" in it } || tree.shows("Quiet"))
        assertFalse("the price's marks are read", tree.merged.any { node -> node.texts.any { "$" in it } })
        val widths = facts.map { it.frame.width }
        assertTrue("the columns are not equal: $widths", widths.all { kotlin.math.abs(it - widths.first()) <= 1f })
        val heights = facts.map { it.frame.height }
        assertTrue("the columns do not share a height: $heights", heights.all { kotlin.math.abs(it - heights.first()) <= 1f })
        val tops = facts.map { it.frame.top }
        assertTrue("the facts are not one row: $tops", tops.all { kotlin.math.abs(it - tops.first()) <= 1f })
        // The row runs the card's whole width, as iOS's does.
        val card = tree.named("Il Forno").frame
        assertEquals(card.width / density, (facts.last().frame.right - facts.first().frame.left) / density, 1f)
    }

    @Test
    fun goCarriesTheTravelEstimateAsItsState() {
        val tree = paparazzi.readSemantics { Panel() }
        val go = tree.showing("Go")
        assertEquals(Role.Button, go.role)
        assertEquals("the estimate is not said", "2 min, 120 m", go.stateDescription)
        assertEquals("the estimate is read twice, or with its dot", listOf("Go"), go.texts)
        assertTrue("Go with an estimate is under 56dp: ${go.frame}", go.frame.height / density >= 56f - 0.5f)
        // Only Go carries it.
        assertNull(tree.showing("Share").stateDescription)
    }

    @Test
    fun aLoadingGoSaysItsLoadingLabelInsteadOfItsEstimate() {
        val tree = paparazzi.readSemantics {
            Panel(
                actionStates = mapOf(KozmosPOIAction.Navigate to KozmosPOIActionState(loading = true)),
                loadingLabel = "Wird geladen"
            )
        }
        val go = tree.showing("Go")
        assertEquals("Wird geladen", go.stateDescription)
        assertFalse("a loading action can be pressed", go.enabled)
    }

    @Test
    fun supplementaryActionsFollowThePOIsOwnAndReachTheirCallback() {
        val pressed = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            Panel(onSupplementaryAction = { action, id -> pressed += "${action.value} $id" })
        }
        for (label in listOf("Book", "Call")) {
            val button = tree.showing(label)
            assertEquals("$label is not a button", Role.Button, button.role)
            assertTrue("$label cannot be pressed", button.enabled)
            assertTrue("$label is drawn under 44dp: ${button.frame}", button.frame.height / density >= 44f - 0.5f)
            assertTrue("$label is narrower than 48dp: ${button.frame}", button.frame.width / density >= 48f - 0.5f)
            assertNull("$label says a state it is not in", button.stateDescription)
            assertNull("$label says it is selected", button.selected)
            button.click!!.invoke()
        }
        assertEquals(listOf("book il-forno", "call il-forno"), pressed)
    }

    /**
     * Each supplementary action keeps Android's 48dp target round its 44dp
     * surface, as every KozmosButton does: with no Go, which is taller, the
     * strip is exactly as tall as that target, and the surface sits in its
     * middle.
     */
    @Test
    fun supplementaryActionsKeepA48dpTarget() {
        val tree = paparazzi.readSemantics {
            Panel(place = restaurant.copy(actions = listOf(KozmosPOIAction.Favourite)))
        }
        val strip = tree.merged.single { it.horizontalScroll != null }.frame
        assertEquals("the strip does not reserve a 48dp target", 48f, strip.height / density, 0.5f)
        for (label in listOf("Book", "Call")) {
            val button = tree.showing(label).frame
            assertEquals("$label is not drawn 44dp tall", 44f, button.height / density, 0.5f)
            assertEquals("$label is not in the middle of its target",
                (button.top - strip.top) / density, (strip.bottom - button.bottom) / density, 0.5f)
        }
    }

    @Test
    fun withoutACallbackSupplementaryActionsAreDisabled() {
        val tree = paparazzi.readSemantics {
            Panel(
                onSupplementaryAction = null,
                // A state that does not disable them does not enable them either.
                supplementaryStates = mapOf(KozmosPOISupplementaryAction.Book to KozmosPOIActionState())
            )
        }
        assertFalse("Book can be pressed with nothing to book", tree.showing("Book").enabled)
        assertFalse("Call can be pressed with nothing to call", tree.showing("Call").enabled)
        assertTrue(tree.showing("Go").enabled)
    }

    @Test
    fun supplementaryActionsTakeTheirStatesAsOnSwiftUI() {
        val tree = paparazzi.readSemantics {
            Panel(
                supplementaryStates = mapOf(
                    KozmosPOISupplementaryAction.Book to KozmosPOIActionState(loading = true),
                    KozmosPOISupplementaryAction.Call to KozmosPOIActionState(pressed = true)
                ),
                loadingLabel = "Wird geladen"
            )
        }
        val book = tree.showing("Book")
        assertFalse("a pending action can be pressed", book.enabled)
        assertEquals("a pending action does not say so", "Wird geladen", book.stateDescription)
        val call = tree.showing("Call")
        assertEquals("a pressed action is not selected", true, call.selected)
        assertTrue(call.enabled)
    }

    @Test
    fun aDisabledSupplementaryActionCannotBePressed() {
        val tree = paparazzi.readSemantics {
            Panel(supplementaryStates = mapOf(KozmosPOISupplementaryAction.Call to KozmosPOIActionState(disabled = true)))
        }
        assertFalse(tree.showing("Call").enabled)
        assertTrue(tree.showing("Book").enabled)
    }

    @Test
    fun supplementaryMessagesFollowThePOIsOwn() {
        val tree = paparazzi.readSemantics {
            Panel(
                actionStates = mapOf(KozmosPOIAction.Share to KozmosPOIActionState(message = "Link copied")),
                supplementaryStates = mapOf(
                    KozmosPOISupplementaryAction.Book to KozmosPOIActionState(
                        message = "Could not book.",
                        messageTone = KozmosPOIActionState.MessageTone.Error
                    )
                )
            )
        }
        val shared = tree.showing("Link copied")
        val booking = tree.showing("Could not book.")
        assertTrue("the supplementary message comes first", booking.frame.top > shared.frame.top)
        assertEquals(LiveRegionMode.Polite, booking.liveRegion)
        // Both between the strip and the summary.
        assertTrue(shared.frame.top > tree.showing("Go").frame.bottom)
        assertTrue(booking.frame.bottom < tree.named("Rating, 4.7 / 5, 32 reviews").frame.top)
    }

    @Test
    fun readMoreSaysCollapsedThenExpandedAndShowsTheFullText() {
        paparazzi.live(content = { Panel() }) {
            val more = read().showing("Read more")
            assertEquals(Role.Button, more.role)
            assertTrue("Read more is not said to be collapsed", more.expand != null && more.collapse == null)
            assertTrue(read().shows("Family-run since 1998."))
            // A KozmosButton: drawn 44dp, as iOS's minimum, in Android's 48dp target.
            assertTrue("Read more is drawn under 44dp", more.frame.height / view.resources.displayMetrics.density >= 44f - 0.5f)

            more.click!!.invoke()
            frames(3)
            val less = read().showing("Read less")
            assertTrue("Read less is not said to be expanded", less.collapse != null && less.expand == null)
            assertTrue(read().shows("Family-run since 1998. The terrace overlooks the atrium."))
            assertFalse(read().shows("Read more"))

            // TalkBack's own collapse action closes it too.
            less.collapse!!.invoke()
            frames(3)
            assertTrue(read().shows("Read more"))
            assertTrue(read().shows("Family-run since 1998."))
        }
    }

    @Test
    fun theOpeningHoursOpenOntoTheirRowsAndSayWhetherTheyAre() {
        paparazzi.live(content = { Panel() }) {
            val toggle = read().showing("Open · Closes 12:30 pm")
            assertEquals(Role.Button, toggle.role)
            assertTrue("the hours are not said to be collapsed", toggle.expand != null && toggle.collapse == null)
            assertTrue("the hours' toggle is shorter than 48dp", toggle.frame.height / view.resources.displayMetrics.density >= 48f - 0.5f)
            assertFalse("the rows show while closed", read().shows("Monday–Friday"))

            toggle.click!!.invoke()
            frames(3)
            val open = read().showing("Open · Closes 12:30 pm")
            assertTrue("the hours are not said to be expanded", open.collapse != null && open.expand == null)
            // A row is one stop: its day and its hours.
            assertEquals(listOf("Monday–Friday", "8:00 am–12:30 pm"), read().showing("Monday–Friday").texts)
            assertEquals(listOf("Sunday", "Closed"), read().showing("Sunday").texts)
            assertTrue(read().shows("Venue-local hours."))
        }
    }

    @Test
    fun hoursWithNoRowsAreOneLineThatDoesNotOpen() {
        val tree = paparazzi.readSemantics {
            Panel(model = details.copy(openingHours = hours.copy(summary = "Ask at reception", rows = emptyList(), note = "Hours vary")))
        }
        assertTrue(tree.showing("Opening hours").heading)
        val line = tree.showing("Ask at reception — Hours vary")
        assertNull("the line is a button", line.role)
        assertTrue("something opens", tree.merged.none { it.expand != null && "Ask at reception — Hours vary" in it.texts })
    }

    @Test
    fun withNothingMoreToReadThereIsNoReadMore() {
        val none = paparazzi.readSemantics {
            Panel(model = details.copy(description = KozmosPOIDetailDescription(preview = "Family-run since 1998.")))
        }
        assertTrue(none.shows("Family-run since 1998."))
        assertFalse(none.shows("Read more"))
    }

    @Test
    fun theSameTextTwiceHasNoReadMore() {
        val same = paparazzi.readSemantics {
            Panel(model = details.copy(description = KozmosPOIDetailDescription(preview = "Family-run.", full = "Family-run.")))
        }
        assertTrue(same.shows("Family-run."))
        assertFalse(same.shows("Read more"))
    }

    /** As iOS's `.id(poi.id)` and the web's key: a different place starts closed. */
    @Test
    fun aDifferentPlaceStartsWithItsDescriptionAndHoursClosed() {
        var place by mutableStateOf(restaurant)
        paparazzi.live(content = { Panel(place = place) }) {
            read().showing("Read more").click!!.invoke()
            read().showing("Open · Closes 12:30 pm").click!!.invoke()
            frames(3)
            assertTrue(read().shows("Read less"))
            assertTrue(read().shows("Monday–Friday"))

            place = restaurant.copy(id = "il-forno-2", name = "Il Forno Due")
            frames(3)
            assertTrue("the new place's description is open", read().shows("Read more"))
            assertFalse("the new place's hours are open", read().shows("Monday–Friday"))
        }
    }

    @Test
    fun theDetailsFollowTheReadingDirection() {
        val tree = paparazzi.readSemantics { Panel(direction = LayoutDirection.Rtl) }
        val rating = tree.named("Rating, 4.7 / 5, 32 reviews").frame
        val price = tree.named("Price, Moderately expensive").frame
        assertTrue("the first fact is not at the start in RTL: $rating, $price", rating.left > price.left)
        assertTrue("Book is not after Go in RTL", tree.showing("Book").frame.left < tree.showing("Go").frame.left)
        val card = tree.named("Il Forno").frame
        val heading = tree.showing("Cuisines").frame
        assertTrue("the heading is not at the start in RTL: $heading in $card", card.right - heading.right < card.width / 4)
    }

    /**
     * An icon the registry does not know draws nothing, as on the web, where
     * the panel's own [com.kozmos.components.icon.KozmosIcon] would stand an
     * info glyph in; a known one draws, before the label.
     */
    @Test
    fun anUnknownIconDrawsNoStandIn() {
        val tree = paparazzi.readSemantics {
            Panel(
                model = KozmosPOIDetailsPresentation(
                    groups = listOf(
                        KozmosPOIDetailAttributeGroup("plain", "Plain", listOf(service("plain", "Vegan"))),
                        KozmosPOIDetailAttributeGroup("unknown", "Unknown", listOf(service("unknown", "Vegan", iconName = "not-a-kozmos-icon"))),
                        KozmosPOIDetailAttributeGroup("known", "Known", listOf(service("known", "Vegan", iconName = "check")))
                    )
                )
            )
        }
        val (plain, unknown, known) = tree.merged.filter { "Vegan" in it.texts }.sortedBy { it.frame.top }.map { it.frame.width / density }
        assertEquals("an unknown icon drew something", plain, unknown, 0.5f)
        assertEquals("a known icon did not draw: 16 and 4 apart", plain + 20f, known, 0.5f)
    }
}
