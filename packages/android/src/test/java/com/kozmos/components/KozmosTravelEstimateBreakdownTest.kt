package com.kozmos.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelEstimatePartKind
import com.kozmos.contracts.KozmosTravelEstimatePartPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-047 (decision 209): a travel time says what it includes, "Includes
 * security (about 8 min)" on an after-security board, from the estimate's
 * breakdown. The result card draws it under the time and TalkBack hears it
 * after the time; the details card draws it under its strip and Go says it
 * with its estimate. With no breakdown both draw and say what they did
 * before. The same cases as the web's and SwiftUI's.
 */
class KozmosTravelEstimateBreakdownTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val security = KozmosTravelEstimatePartPresentation(
        kind = KozmosTravelEstimatePartKind.SecurityQueue,
        durationSeconds = 480.0,
        label = "Includes security (about 8 min)"
    )

    private fun estimate(breakdown: List<KozmosTravelEstimatePartPresentation> = emptyList()) =
        KozmosTravelEstimatePresentation(
            durationSeconds = 720.0,
            durationLabel = "12 min",
            distanceLabel = "400 m",
            breakdown = breakdown
        )

    // region the contract's rule

    @Test
    fun theBreakdownLabelJoinsThePartsInOrderLeavingOutEmptyOnes() {
        assertNull(estimate().breakdownLabel)
        assertNull(
            estimate(listOf(KozmosTravelEstimatePartPresentation(KozmosTravelEstimatePartKind.Other, 60.0, "")))
                .breakdownLabel
        )
        assertEquals(
            "4 min walk · Includes security (about 8 min)",
            estimate(
                listOf(
                    KozmosTravelEstimatePartPresentation(KozmosTravelEstimatePartKind.Walking, 240.0, "4 min walk"),
                    KozmosTravelEstimatePartPresentation(KozmosTravelEstimatePartKind.LiftWait, 60.0, ""),
                    security
                )
            ).breakdownLabel
        )
    }

    @Test
    fun theKindsAreTheWebsWireValues() {
        assertEquals(
            listOf("walking", "securityQueue", "liftWait", "other"),
            KozmosTravelEstimatePartKind.entries.map { it.value }
        )
    }

    // endregion

    // region the result card

    @Composable
    private fun Card(breakdown: List<KozmosTravelEstimatePartPresentation>) {
        KozmosMaterialTheme {
            KozmosPOIResultCard(
                poi = KozmosPOIPresentation(id = "pret", name = "Pret", floorLabel = "Level 1"),
                result = KozmosPOIResultPresentation(
                    poiId = "pret", resultIndex = 0, selected = false, travelEstimate = estimate(breakdown)
                ),
                onSelect = {}
            )
        }
    }

    /** The texts the card lays out, and the words TalkBack is given for its row. */
    private fun readCard(breakdown: List<KozmosTravelEstimatePartPresentation>): Pair<List<String>, String> {
        val semantics = paparazzi.readSemantics { Card(breakdown) }
        val texts = semantics.unmerged.filter { it.click == null }.flatMap { it.texts }
        val name = semantics.merged.mapNotNull { it.words }.first { "Pret" in it }
        return texts to name
    }

    @Test
    fun theResultCardDrawsTheBreakdownAndSaysItAfterTheTime() {
        val (texts, name) = readCard(listOf(security))
        assertTrue(texts.toString(), "Includes security (about 8 min)" in texts)
        assertTrue(name, name.endsWith("12 min, Includes security (about 8 min)"))
    }

    @Test
    fun withoutABreakdownTheResultCardDrawsAndSaysWhatItDidBefore() {
        val (texts, name) = readCard(emptyList())
        assertFalse(texts.toString(), texts.any { "security" in it })
        assertTrue(name, name.endsWith("12 min"))
    }

    // endregion

    // region the details card

    @Composable
    private fun Panel(
        breakdown: List<KozmosTravelEstimatePartPresentation>,
        actions: List<KozmosPOIAction> = listOf(KozmosPOIAction.Navigate, KozmosPOIAction.Share)
    ) {
        KozmosMaterialTheme {
            Box(Modifier.width(360.dp)) {
                KozmosPOIDetailPanel(
                    poi = KozmosPOIPresentation(id = "pret", name = "Pret", actions = actions),
                    actionLabels = mapOf(KozmosPOIAction.Navigate to "Go", KozmosPOIAction.Share to "Share"),
                    onAction = { _, _ -> },
                    details = KozmosPOIDetailsPresentation(travelEstimate = estimate(breakdown))
                )
            }
        }
    }

    @Test
    fun theDetailsCardDrawsTheBreakdownUnderTheStripAndGoSaysIt() {
        val tree = paparazzi.readSemantics { Panel(listOf(security)) }
        val go = tree.merged.single { "Go" in it.texts }
        assertEquals("12 min, 400 m, Includes security (about 8 min)", go.stateDescription)
        // Drawn once, under the strip, and left to Go to say.
        assertTrue(tree.unmerged.flatMap { it.texts }.toString(), tree.unmerged.any { "Includes security (about 8 min)" in it.texts })
        assertFalse("the breakdown is heard twice", tree.merged.any { "Includes security (about 8 min)" in it.texts })
    }

    @Test
    fun withoutGoOrABreakdownTheDetailsCardIsAsBefore() {
        val bare = paparazzi.readSemantics { Panel(emptyList()) }
        assertEquals("12 min, 400 m", bare.merged.single { "Go" in it.texts }.stateDescription)
        assertFalse(bare.unmerged.any { node -> node.texts.any { "security" in it } })
        val noGo = paparazzi.readSemantics { Panel(listOf(security), actions = listOf(KozmosPOIAction.Share)) }
        assertFalse(noGo.unmerged.any { node -> node.texts.any { "security" in it } })
    }

    // endregion
}
