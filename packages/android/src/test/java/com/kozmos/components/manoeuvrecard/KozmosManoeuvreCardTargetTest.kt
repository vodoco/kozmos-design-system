package com.kozmos.components.manoeuvrecard

import android.os.SystemClock
import android.view.MotionEvent
import androidx.compose.foundation.Indication
import androidx.compose.foundation.IndicationInstance
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 74, tightened on 14 Oct: under the content — the instruction row
 * closed, the itinerary open — the card keeps its 12, the 5dp grip and 4 to
 * its bottom edge, 21 in all; it kept a 52dp row there, the grip at its foot.
 * The grab bar's target is still 48 tall, reaching up from the card's bottom
 * edge over the grip, the gap and the content's foot, and a touch there finds
 * the bar first. Open, the itinerary keeps that overlap clear at its end, so
 * scrolled to the end its last row is not under the target. Laid out as a
 * device lays it out; touches are a finger's, dispatched to the view.
 */
class KozmosManoeuvreCardTargetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    @Composable
    private fun Card(
        appearance: KozmosManoeuvreAppearance,
        expanded: Boolean,
        onToggle: () -> Unit = {},
        itinerary: @Composable () -> Unit = { Box(Modifier.fillMaxWidth().height(40.dp)) }
    ) {
        density = LocalDensity.current.density
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                Box(Modifier.padding(24.dp).width(320.dp)) {
                    KozmosManoeuvreCard(DirectionType.Straight, "Continue ahead", expanded, onToggle, appearance) { itinerary() }
                }
            }
        }
    }

    /**
     * An indication that draws nothing: Material's ripple is a RippleDrawable
     * the host's renderer cannot draw once a press lands (a native "fatal
     * error", as KozmosManoeuvreCardTest found for a key press). What is
     * tested is where a touch goes, which the indication only paints.
     */
    @Suppress("DEPRECATION")
    private object UnpaintedIndication : Indication {
        @Composable
        override fun rememberUpdatedInstance(interactionSource: InteractionSource): IndicationInstance =
            remember {
                object : IndicationInstance {
                    override fun ContentDrawScope.drawIndication() = drawContent()
                }
            }
    }

    /** Twelve 40dp steps, each its own button, taller than the open card's 320 cap. */
    @Composable
    private fun Steps(tapped: MutableList<Int>) {
        Column {
            (1..12).forEach { step ->
                Box(
                    Modifier.fillMaxWidth().height(40.dp)
                        .clickable { tapped += step }
                        .semantics { contentDescription = "Step $step" }
                )
            }
        }
    }

    /** A finger's tap at ([x], [y]) in the view's pixels. */
    private suspend fun LiveSemantics.tap(x: Float, y: Float) {
        val down = SystemClock.uptimeMillis()
        view.dispatchTouchEvent(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, x, y, 0))
        frames(2)
        view.dispatchTouchEvent(MotionEvent.obtain(down, down + 50, MotionEvent.ACTION_UP, x, y, 0))
        frames(3)
    }

    @Test
    fun theContentEndsTwentyOneAboveTheCardsBottomEdge() {
        for (appearance in KozmosManoeuvreAppearance.values()) for (expanded in listOf(false, true)) {
            val tree = paparazzi.readSemantics { Card(appearance, expanded) }
            val card = tree.named("Current manoeuvre").frame
            // Closed, the instruction row; open, the itinerary's scroller.
            val content = if (expanded) tree.merged.single { it.scrollBy != null }.frame else tree.named("Continue ahead").frame
            val gap = (card.bottom - content.bottom) / density
            val case = "$appearance, ${if (expanded) "open" else "closed"}"
            println("Decision 74 Android, $case: the content ends ${"%.2f".format(gap)}dp above the card's bottom edge")
            assertEquals("$case: the content ends ${gap}dp above the card's bottom edge", 21f, gap, 1f)
        }
    }

    @Test
    fun aTapFortyAboveTheBottomEdgeOpensTheClosedCard() {
        for (appearance in KozmosManoeuvreAppearance.values()) {
            val expanded = mutableStateOf(false)
            paparazzi.live(content = { Card(appearance, expanded.value, onToggle = { expanded.value = !expanded.value }) }) {
                frames(2)
                val card = read().named("Current manoeuvre").frame
                tap(card.center.x, card.bottom - 40 * density)
                assertTrue("$appearance: a tap 40 above the closed card's bottom edge did not open it", expanded.value)
            }
        }
    }

    /** Open, the itinerary is under the target's top: the bar takes the tap, not the step drawn there. */
    @Test
    fun aTapFortyAboveTheBottomEdgeClosesTheOpenCardNotTheStepUnderIt() {
        for (appearance in KozmosManoeuvreAppearance.values()) {
            val expanded = mutableStateOf(true)
            val tapped = mutableListOf<Int>()
            paparazzi.live(content = {
                Card(appearance, expanded.value, onToggle = { expanded.value = !expanded.value }) { Steps(tapped) }
            }) {
                frames(2)
                val card = read().named("Current manoeuvre").frame
                tap(card.center.x, card.bottom - 40 * density)
                assertEquals("$appearance: a step under the target took the tap", emptyList<Int>(), tapped)
                assertEquals("$appearance: a tap 40 above the open card's bottom edge did not close it", false, expanded.value)
            }
        }
    }

    @Test
    fun scrolledToItsEndTheItinerarysLastRowClearsTheBarsTarget() {
        for (appearance in KozmosManoeuvreAppearance.values()) {
            val tapped = mutableListOf<Int>()
            paparazzi.live(content = { Card(appearance, expanded = true) { Steps(tapped) } }) {
                frames(2)
                repeat(4) {
                    read().merged.single { it.scrollBy != null }.scrollBy!!.invoke(0f, 10_000f)
                    frames(2)
                }
                val tree = read()
                val card = tree.named("Current manoeuvre").frame
                val target = tree.named("Hide itinerary").frame
                val last = tree.named("Step 12").frame
                println(
                    "Decision 74 Android, $appearance open: the target ${target.height / density}dp tall, ending " +
                        "${(card.bottom - target.bottom) / density} above the card's edge; the last step ends " +
                        "${(target.top - last.bottom) / density} above the target's top"
                )
                assertTrue("$appearance: the target is ${target.height / density}dp tall", target.height / density >= 48f - 0.01f)
                assertEquals("$appearance: the target does not end at the card's bottom edge", card.bottom, target.bottom, 0.5f * density)
                assertTrue(
                    "$appearance: scrolled to its end, the last step ends ${(last.bottom - target.top) / density}dp inside the bar's target",
                    last.bottom <= target.top + 0.5f * density
                )
            }
        }
    }
}
