package com.kozmos.components.itinerary

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-104: the Web SDK's route card has an action beside From and To. The
 * host passes a callback per endpoint; only a passed one draws, so
 * ManoeuvreCard's list, which passes none, is unchanged. Each action shows
 * RouteLocationField's verb, "Change", and TalkBack hears it named for its
 * endpoint with that verb first (WCAG 2.5.3). One read per test.
 */
class KozmosItineraryEndpointEditTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val steps = listOf(
        KozmosItineraryStep("1", "Take Elevator down to First Floor", DirectionType.LiftDown),
        KozmosItineraryStep("2", "Take Corridor to Garage B", DirectionType.Transition, isCurrent = true)
    )
    private val longName = "International arrivals reception and passenger assistance desk, North Terminal"

    private fun ReadSemantics.buttons(): List<ReadNode> = merged.filter { it.role == Role.Button }

    /** [content] in a 320dp column, as a narrow phone's panel holds it, and the screen density. */
    private fun read(direction: LayoutDirection = LayoutDirection.Ltr, content: @Composable () -> Unit): Pair<ReadSemantics, Float> {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    Box(Modifier.width(320.dp)) { content() }
                }
            }
        }
        return tree to density
    }

    @Test
    fun anActionIsDrawnOnlyWhenItsCallbackIsPassed() {
        val (tree, _) = read {
            Column {
                KozmosItinerary(origin = "Dunkin'", steps = steps, destination = "Gate 12")
                KozmosItinerary(origin = "Lobby", steps = steps, destination = "Gate 14", onEditDestination = {})
            }
        }
        assertNotNull("must read a real itinerary", tree.named("From, Dunkin'"))
        assertEquals(listOf("Change To"), tree.buttons().map { it.description })
        // The one action is the second itinerary's, straight after its To.
        val names = tree.names()
        assertEquals(names.indexOf("To, Gate 14") + 1, names.indexOf("Change To"))
    }

    @Test
    fun eachActionIsANamedButtonAfterItsEndpointThatCallsItsOwnCallback() {
        val calls = mutableListOf<String>()
        val (tree, density) = read {
            KozmosItinerary(
                origin = "Dunkin'", steps = steps, destination = "Gate 12",
                onEditOrigin = { calls += "origin" }, onEditDestination = { calls += "destination" }
            )
        }
        // The order TalkBack reads: each action straight after its endpoint.
        assertEquals(
            listOf("From, Dunkin'", "Change From", "Take Elevator down to First Floor",
                "Take Corridor to Garage B", "To, Gate 12", "Change To"),
            tree.names().filter { it != "Itinerary" }
        )
        for (name in listOf("Change From", "Change To")) {
            val button = tree.named(name)
            assertEquals(name, Role.Button, button.role)
            assertTrue(name, button.enabled)
            // The visible verb, which the name starts with.
            assertEquals(name, listOf("Change"), button.texts)
            // The drawn button is 44; Material's minimum interactive size
            // lays it out in 48, the touch target (KozmosButtonTouchTest).
            assertTrue("$name height ${button.bounds.height / density}", button.bounds.height / density >= 44f)
            assertTrue("$name width ${button.bounds.width / density}", button.bounds.width / density >= 48f)
        }
        // The From row is laid out at least 48 tall: from the list's top to
        // the first step, less the 8 between rows.
        val row = tree.named("Take Elevator down to First Floor").bounds.top - tree.named("Itinerary").bounds.top
        assertTrue("the From row ${row / density - 8f}", row / density - 8f >= 48f - 0.5f)
        // The action's words sit on the name's first baseline, not the
        // caption's: the two one-line boxes end within 1.5dp of each other
        // (their descents differ by 0.7). On the caption's baseline, the row's
        // own, the verb's box ended 3dp higher.
        val name = tree.unmerged.single { "Dunkin'" in it.texts }.bounds
        val verb = tree.unmerged.first { it.texts == listOf("Change") && it.role == null }.bounds
        assertEquals("the verb's line against the name's", 0f, (verb.bottom - name.bottom) / density, 1.5f)
        // Plain lists, not Compose state: a click outside a frame writes no snapshot.
        checkNotNull(tree.named("Change From").click).invoke()
        assertEquals(listOf("origin"), calls)
        checkNotNull(tree.named("Change To").click).invoke()
        assertEquals(listOf("origin", "destination"), calls)
    }

    /**
     * A translated verb and captions, and no names: each name is the visible
     * verb and the row's own caption, words the product translates, never a
     * built-in English word beside a translated one.
     */
    @Test
    fun theDefaultNamesAreTheVerbAndTheCaptionInOneLanguage() {
        val (tree, _) = read {
            KozmosItinerary(
                origin = "Dunkin'", steps = emptyList(), destination = "Gate 12",
                originLabel = "Von", destinationLabel = "Nach",
                onEditOrigin = {}, onEditDestination = {}, changeLabel = "Bearbeiten"
            )
        }
        assertEquals(listOf("Bearbeiten Von", "Bearbeiten Nach"), tree.buttons().map { it.description })
    }

    @Test
    fun theHostsWordsAndNamesThatFollowAChangedVerb() {
        val (tree, _) = read {
            Column {
                KozmosItinerary(
                    origin = "A", steps = emptyList(), destination = "B",
                    onEditOrigin = {}, onEditDestination = {}, changeLabel = "Ändern",
                    editOriginLabel = "Ändern: Startpunkt", editDestinationLabel = "Ändern: Ziel"
                )
                // The SDK's own verb, with no names given: the names follow the verb.
                KozmosItinerary(
                    origin = "C", steps = emptyList(), destination = "D",
                    onEditOrigin = {}, onEditDestination = {}, changeLabel = "Edit"
                )
            }
        }
        assertEquals(
            listOf("Ändern: Startpunkt", "Ändern: Ziel", "Edit From", "Edit To"),
            tree.buttons().map { it.description }
        )
        assertEquals(listOf("Ändern"), tree.named("Ändern: Ziel").texts)
        assertEquals(listOf("Edit"), tree.named("Edit To").texts)
    }

    /** A long name wraps beside the action and keeps at least half the row; the action sits at the row's end. */
    @Test
    fun aLongNameWrapsAndKeepsHalfTheRowWithTheActionAtItsEnd() {
        val (tree, density) = read {
            KozmosItinerary(origin = "Dunkin'", steps = emptyList(), destination = longName, onEditDestination = {})
        }
        val text = tree.named("To, $longName").bounds
        val button = tree.named("Change To").bounds
        assertEquals("the action ends the row", 320f, button.right / density, 1f)
        assertTrue("the name before it", text.right <= button.left)
        assertTrue("the name keeps half the row: ${text.width / density}", text.width / density >= 154f)
        val name = tree.unmerged.single { longName in it.texts }.bounds
        assertTrue("the name wraps: ${name.height / density}", name.height / density > 48f)
    }

    /** Logical: in a right-to-left layout, the row's end is its left. */
    @Test
    fun theActionSitsAtTheLeftInARightToLeftLayout() {
        val (tree, density) = read(LayoutDirection.Rtl) {
            KozmosItinerary(origin = "Dunkin'", steps = emptyList(), destination = longName, onEditDestination = {})
        }
        val text = tree.named("To, $longName").bounds
        val button = tree.named("Change To").bounds
        assertEquals("the action ends the row", 0f, button.left / density, 1f)
        assertTrue("the name before it", text.left >= button.right)
        assertEquals("the name starts the row", 320f, text.right / density, 1f)
    }

    /** A long localized verb wraps within half the row rather than squeezing the name. */
    @Test
    fun aLongVerbWrapsWithinHalfTheRow() {
        val verb = "Ausgangspunkt und Ziel noch einmal ändern"
        val (tree, density) = read {
            KozmosItinerary(
                origin = "Dunkin'", steps = emptyList(), destination = longName,
                onEditDestination = {}, changeLabel = verb, editDestinationLabel = verb
            )
        }
        val text = tree.named("To, $longName").bounds
        val button = tree.named(verb).bounds
        assertTrue("the action takes at most half: ${button.width / density}", button.width / density <= 160f)
        assertTrue("the name keeps half the row: ${text.width / density}", text.width / density >= 154f)
        val words = tree.unmerged.single { verb in it.texts }.bounds
        assertTrue("the verb wraps: ${words.height / density}", words.height / density > 30f)
    }
}
