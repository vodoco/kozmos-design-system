package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Review finding N3: the details card's actions are one strip that scrolls
 * sideways, as on iOS and the web, however many there are and however long
 * their words. They sat in a FlowRow, which wrapped them onto a second row
 * and grew the card.
 *
 * On a 320dp card, in German, at twice the text size: one row, every action
 * whole, 44dp or more, the card no wider than it was given, and every
 * enabled action reachable by scrolling and pressable.
 */
class KozmosPOIDetailPanelActionStripTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee",
        name = "Harbour Coffee Co.",
        floorId = "2",
        floorLabel = "Ebene 2",
        actions = listOf(
            KozmosPOIAction.Navigate,
            KozmosPOIAction.Favourite,
            KozmosPOIAction.Share,
            KozmosPOIAction.Order
        )
    )

    private val german = mapOf(
        KozmosPOIAction.Navigate to "Wegbeschreibung starten",
        KozmosPOIAction.Favourite to "Zu Favoriten hinzufügen",
        KozmosPOIAction.Share to "Mit Freunden teilen",
        KozmosPOIAction.Order to "Online vorbestellen"
    )

    private val strip = listOf("Wegbeschreibung starten", "Mit Freunden teilen", "Online vorbestellen")

    @Composable
    private fun Panel(
        fontScale: Float = 1f,
        states: Map<KozmosPOIAction, KozmosPOIActionState> = emptyMap(),
        place: KozmosPOIPresentation = poi,
        onAction: (KozmosPOIAction, String) -> Unit = { _, _ -> }
    ) {
        val density = LocalDensity.current
        CompositionLocalProvider(LocalDensity provides Density(density.density, fontScale)) {
            MaterialTheme {
                Box(Modifier.padding(20.dp).width(320.dp)) {
                    KozmosPOIDetailPanel(
                        poi = place,
                        actionLabels = german,
                        onAction = onAction,
                        actionStates = states,
                        onClose = {}
                    )
                }
            }
        }
    }

    /** The one control whose text is [text]. */
    private fun ReadSemantics.showing(text: String): ReadNode {
        val found = merged.filter { text in it.texts }
        check(found.size == 1) { "expected one node showing \"$text\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    private fun ReadSemantics.card(): ReadNode = named("Harbour Coffee Co.")

    private fun dp(pixels: Float, density: Float) = pixels / density

    /**
     * Laid out, unclipped: a button scrolled out of the strip is clipped to
     * nothing, and still there to scroll to.
     */
    private fun assertOneWholeStrip(tree: ReadSemantics, density: Float) {
        val buttons = strip.map { tree.showing(it) }
        val tops = buttons.map { it.frame.top }
        assertTrue("the actions wrapped onto more than one row: tops $tops", tops.all { abs(it - tops.first()) < 1f })
        for (button in buttons) {
            assertEquals("${button.texts} is not a button", Role.Button, button.role)
            assertTrue("${button.texts} is shorter than 44dp: ${button.frame}", dp(button.frame.height, density) >= 44f - 0.5f)
            assertTrue("${button.texts} is narrower than 44dp: ${button.frame}", dp(button.frame.width, density) >= 44f - 0.5f)
        }
        val card = tree.card().bounds
        assertEquals("the card grew wider than it was given", 320f, dp(card.width, density), 0.5f)
        val scroller = tree.merged.single { it.horizontalScroll != null }
        assertTrue("the strip does not scroll: ${scroller.horizontalScroll}", scroller.horizontalScroll!!.second > 0f)
        assertTrue("the strip is drawn outside the card: ${scroller.bounds} in $card",
            scroller.bounds.left >= card.left - 0.5f && scroller.bounds.right <= card.right + 0.5f)
    }

    @Test
    fun longWordsStayOneStripThatScrolls() {
        val tree = paparazzi.readSemantics { Panel() }
        assertOneWholeStrip(tree, paparazzi.context.resources.displayMetrics.density)
    }

    @Test
    fun twiceTheTextSizeStaysOneStripThatScrolls() {
        val tree = paparazzi.readSemantics { Panel(fontScale = 2f) }
        assertOneWholeStrip(tree, paparazzi.context.resources.displayMetrics.density)
    }

    /**
     * Every enabled action can be scrolled to, as TalkBack scrolls, and
     * pressed, once each; a loading one and a disabled one keep their state
     * and their name.
     */
    @Test
    fun everyEnabledActionIsReachableAndPressable() {
        val pressed = mutableListOf<String>()
        paparazzi.live(content = {
            Panel(fontScale = 2f, onAction = { action, id -> pressed += "${action.value} $id" })
        }) {
            val density = view.resources.displayMetrics.density
            val card = read().card().bounds
            val last = read().showing("Online vorbestellen")
            assertTrue("the last action already fits, so nothing here needs a scroll: ${last.frame}", last.frame.right > card.right)

            val scroller = read().merged.single { it.horizontalScroll != null }
            scroller.scrollBy!!.invoke(10_000f, 0f)
            frames(10)
            val reached = read().showing("Online vorbestellen")
            assertTrue("the last action cannot be scrolled into the card: ${reached.frame} in $card",
                reached.frame.right <= card.right + 0.5f && reached.frame.left >= card.left - 0.5f)
            assertTrue(dp(reached.frame.width, density) >= 44f - 0.5f)

            for (label in strip) read().showing(label).click!!.invoke()
            assertEquals(listOf("navigate harbour-coffee", "share harbour-coffee", "order harbour-coffee"), pressed)
        }
    }

    /**
     * A new place's strip starts at its first action, as iOS's and the web's
     * do, wherever the last place's was scrolled to: it kept its scroll.
     */
    @Test
    fun aNewPlacesStripStartsAtItsFirstAction() {
        var place by mutableStateOf(poi)
        paparazzi.live(content = { Panel(fontScale = 2f, place = place) }) {
            read().merged.single { it.horizontalScroll != null }.scrollBy!!.invoke(10_000f, 0f)
            frames(10)
            val scrolled = read().merged.single { it.horizontalScroll != null }.horizontalScroll!!.first
            assertTrue("the strip did not scroll: $scrolled", scrolled > 0f)

            place = poi.copy(id = "harbour-tea", name = "Harbour Tea")
            frames(5)
            assertEquals("the new place's strip kept the last one's scroll",
                0f, read().merged.single { it.horizontalScroll != null }.horizontalScroll!!.first)
        }
    }

    @Test
    fun aLoadingActionAndADisabledOneKeepTheirStateInTheStrip() {
        val tree = paparazzi.readSemantics {
            Panel(
                states = mapOf(
                    KozmosPOIAction.Share to KozmosPOIActionState(loading = true),
                    KozmosPOIAction.Order to KozmosPOIActionState(disabled = true)
                )
            )
        }
        assertFalse("a loading action can be pressed", tree.showing("Mit Freunden teilen").enabled)
        assertFalse("a disabled action can be pressed", tree.showing("Online vorbestellen").enabled)
        assertTrue(tree.showing("Wegbeschreibung starten").enabled)
        assertOneWholeStrip(tree, paparazzi.context.resources.displayMetrics.density)
    }
}
