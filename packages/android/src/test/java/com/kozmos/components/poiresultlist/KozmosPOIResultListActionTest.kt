package com.kozmos.components.poiresultlist

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultAction
import com.kozmos.contracts.KozmosPOIResultActionPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.docsnippets.ResultsWithActions
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Review finding N1: an action pressed on a result in the list reaches the
 * product, as React's list hands its `onAction` to every card. The list built
 * its cards without their handler, so Go and Details drew on the selected
 * result and did nothing when pressed. Pressed here through the list a
 * product uses, as TalkBack presses them, rather than on a card alone.
 */
class KozmosPOIResultListActionTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun longActionsRemainInsideANarrowCardAtLargeTextInBothDirections() {
        val labels = listOf("Wegbeschreibung zu diesem Ziel anzeigen", "Weitere Informationen zu diesem Ort")
        for (direction in LayoutDirection.values()) {
            var width = 0f
            val tree = paparazzi.readSemantics {
                val density = LocalDensity.current.density
                width = 320 * density
                CompositionLocalProvider(LocalDensity provides Density(density, fontScale = 2f),
                    LocalLayoutDirection provides direction) {
                    MaterialTheme {
                        Box(Modifier.width(320.dp)) {
                            KozmosPOIResultCard(poi = cafe,
                                result = KozmosPOIResultPresentation(poiId = cafe.id, resultIndex = 0, selected = true,
                                    actions = listOf(go.copy(label = labels[0]), details.copy(label = labels[1]))),
                                onSelect = {}, onAction = { _, _ -> })
                        }
                    }
                }
            }
            for (label in labels) {
                val frame = tree.showing(label).frame
                assertTrue("$direction action collapsed or overflowed: $label $frame / $width",
                    frame.width > 0 && frame.left >= 0 && frame.right <= width)
            }
        }
    }

    @Test
    fun resultActionsHaveAtLeast44DpTargets() {
        var minimum = 0f
        val tree = paparazzi.readSemantics {
            minimum = with(LocalDensity.current) { 44.dp.toPx() }
            MaterialTheme {
                KozmosPOIResultList(items = items(listOf(go, details,
                    KozmosPOIResultActionPresentation(KozmosPOIResultAction.Order, "Order ahead", disabled = true))),
                    resultCountLabel = "2 results", selectedPoiId = "cafe", onSelect = {}, onAction = { _, _ -> })
            }
        }
        for (label in listOf("Go", "Details", "Order ahead")) {
            val target = tree.showing(label)
            assertTrue("$label height ${target.frame.height}, expected at least $minimum", target.frame.height >= minimum)
            assertTrue("$label width ${target.frame.width}, expected at least $minimum", target.frame.width >= minimum)
        }
        assertFalse(tree.showing("Order ahead").enabled)
    }

    @Test
    fun resultActionTargetsGrowForLargeText() {
        var minimum = 0f
        val tree = paparazzi.readSemantics {
            val density = LocalDensity.current.density
            minimum = 44 * density
            CompositionLocalProvider(LocalDensity provides Density(density, fontScale = 2f)) {
                MaterialTheme {
                    KozmosPOIResultList(items = items(listOf(go, details,
                        KozmosPOIResultActionPresentation(KozmosPOIResultAction.Order, "Order ahead", disabled = true))), resultCountLabel = "2 results",
                        selectedPoiId = "cafe", onSelect = {}, onAction = { _, _ -> })
                }
            }
        }
        for (label in listOf("Go", "Details", "Order ahead")) {
            val target = tree.showing(label)
            assertTrue("$label is capped at 44dp for large text", target.frame.height > minimum)
            assertTrue("$label shrinks below 44dp for large text", target.frame.width >= minimum)
        }
    }

    private val cafe = KozmosPOIPresentation(id = "cafe", name = "Harbour Coffee", floorLabel = "Level 2")

    /** An ID a DOM identifier would escape: what reaches the product is the POI's own ID. */
    private val gate = KozmosPOIPresentation(id = "gate/12", name = "Gate 12", floorLabel = "Level 1")
    private val go = KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Go", primary = true)
    private val details = KozmosPOIResultActionPresentation(KozmosPOIResultAction.Details, "Details")

    /** Two results; the product's actions ride on both, and the list shows them on the selected one only. */
    private fun items(
        actions: List<KozmosPOIResultActionPresentation>,
        gateAvailable: Boolean? = null
    ) = listOf(
        KozmosPOIResultListItem(cafe, KozmosPOIResultPresentation(poiId = "cafe", resultIndex = 0, actions = actions)),
        KozmosPOIResultListItem(
            gate,
            KozmosPOIResultPresentation(
                poiId = "gate/12",
                resultIndex = 1,
                available = gateAvailable,
                unavailableReason = if (gateAvailable == false) "Closed until 06:00" else null,
                actions = actions
            )
        )
    )

    /** The one control whose text is [text]. */
    private fun ReadSemantics.showing(text: String): ReadNode {
        val found = merged.filter { text in it.texts }
        check(found.size == 1) { "expected one node showing \"$text\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    /** What reached the product, in order. */
    private class Received {
        val actions = mutableListOf<String>()
        val selections = mutableListOf<String>()
        fun action(action: KozmosPOIResultAction, poiId: String) {
            actions += "${action.value} $poiId"
        }
        fun select(poiId: String) {
            selections += poiId
        }
    }

    @Test
    fun anActionPressedInTheListReachesTheApp() {
        val received = Received()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    items = items(listOf(go, details)),
                    resultCountLabel = "2 results",
                    onSelect = received::select,
                    selectedPoiId = "gate/12",
                    onAction = received::action
                )
            }
        }

        tree.showing("Go").click!!.invoke()
        assertEquals("Go did not reach the app once, with the POI's own ID", listOf("navigate gate/12"), received.actions)
        tree.showing("Details").click!!.invoke()
        assertEquals(listOf("navigate gate/12", "details gate/12"), received.actions)
        assertEquals("pressing an action selected its result", emptyList<String>(), received.selections)
    }

    /** The docs' example, as POIResultList.mdx writes it (docsnippets): Go reaches the app. */
    @Test
    fun theDocsExampleReachesTheApp() {
        val received = Received()
        val tree = paparazzi.readSemantics {
            MaterialTheme { ResultsWithActions(items(listOf(go)), "gate/12", received::select, received::action) }
        }
        tree.showing("Go").click!!.invoke()
        assertEquals(listOf("navigate gate/12"), received.actions)
        assertEquals(emptyList<String>(), received.selections)
    }

    /**
     * The product's words reach the card: each action's own label, and the
     * row's name — its own node, which TalkBack reads before the actions,
     * not words added to the result's name.
     */
    @Test
    fun theActionsKeepTheProductsWords() {
        val received = Received()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    items = items(
                        listOf(
                            KozmosPOIResultActionPresentation(KozmosPOIResultAction.Navigate, "Los", primary = true),
                            KozmosPOIResultActionPresentation(KozmosPOIResultAction.Details, "Einzelheiten")
                        )
                    ),
                    resultCountLabel = "2 Ergebnisse",
                    onSelect = received::select,
                    selectedPoiId = "gate/12",
                    actionsLabel = "Aktionen für dieses Ergebnis",
                    onAction = received::action
                )
            }
        }

        val row = tree.named("Aktionen für dieses Ergebnis")
        val los = tree.showing("Los")
        val einzelheiten = tree.showing("Einzelheiten")
        assertTrue("the row's name does not hold its actions", row.bounds.contains(los.bounds.center) && row.bounds.contains(einzelheiten.bounds.center))
        val gateRow = tree.merged.single { it.words?.startsWith("Gate 12") == true }
        assertFalse("the row's name was added to the result's: ${gateRow.words}", "Aktionen" in gateRow.words!!)
        einzelheiten.click!!.invoke()
        assertEquals(listOf("details gate/12"), received.actions)
    }

    /**
     * With a handler given, only what can run runs: beside Go, a disabled
     * action is read as disabled and runs nothing, however it is pressed, and
     * an unavailable result shows no actions and cannot be selected.
     */
    @Test
    fun aDisabledActionAndAnUnavailableResultStayInert() {
        val received = Received()
        val share = KozmosPOIResultActionPresentation(KozmosPOIResultAction.Share, "Share", disabled = true)
        val open = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    items = items(listOf(go, share)),
                    resultCountLabel = "2 results",
                    onSelect = received::select,
                    selectedPoiId = "cafe",
                    onAction = received::action
                )
            }
        }
        open.showing("Go").click!!.invoke()
        val dimmed = open.showing("Share")
        assertFalse("a disabled action is not read as disabled", dimmed.enabled)
        dimmed.click?.invoke()
        assertEquals("Go did not run once, or a disabled action ran", listOf("navigate cafe"), received.actions)

        val closed = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    items = items(listOf(go, share), gateAvailable = false),
                    resultCountLabel = "2 results",
                    onSelect = received::select,
                    selectedPoiId = "gate/12",
                    onAction = received::action
                )
            }
        }
        assertTrue("an unavailable result offers actions", closed.merged.none { "Go" in it.texts })
        val gateRow = closed.merged.single { it.words?.startsWith("Gate 12") == true }
        assertFalse("an unavailable result is not read as disabled", gateRow.enabled)
        gateRow.click?.invoke()
        assertEquals(listOf("navigate cafe"), received.actions)
        assertEquals("an unavailable result was selected", emptyList<String>(), received.selections)
    }

    /**
     * No handler, nothing to press. An action the product offers but gives
     * the list no way to run is drawn disabled — the rule POIDetailPanel's
     * supplementary actions follow on the web and iOS — never an enabled
     * button that does nothing. The card on its own keeps the same rule.
     */
    @Test
    fun withoutAHandlerTheActionsAreDrawnDisabled() {
        val selected = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    KozmosPOIResultList(
                        items = items(listOf(go)),
                        resultCountLabel = "2 results",
                        onSelect = { selected += it },
                        selectedPoiId = "gate/12"
                    )
                    KozmosPOIResultCard(
                        poi = cafe,
                        result = KozmosPOIResultPresentation(poiId = "cafe", resultIndex = 0, selected = true, actions = listOf(details)),
                        onSelect = { selected += it }
                    )
                }
            }
        }

        for (label in listOf("Go", "Details")) {
            val action = tree.showing(label)
            assertFalse("$label has no handler and is still an enabled button", action.enabled)
            action.click?.invoke()
        }
        assertEquals("pressing an action selected its result", emptyList<String>(), selected)
    }
}
