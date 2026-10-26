package com.kozmos.providers

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.kozmos.components.LiveSemantics
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Compose's KozmosAnalyticsProvider, as React's AnalyticsProvider and
 * SwiftUI's `.kozmosAnalytics(batchDelayMs:onDispatch:)` are: the events of
 * the parts inside reach onDispatch in batches, each batchDelayMs after its
 * first event; what is left is delivered when the provider leaves the
 * composition; a nested provider takes its own subtree's events; and
 * LocalKozmosAnalytics inside it feeds the batches, the parts' and the
 * product's own. The batching runs on a clock the test moves by hand, through
 * the provider's internal schedule, as SwiftUI's tests pass theirs.
 */
class KozmosAnalyticsProviderTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun LiveSemantics.press(tag: String) = read().merged.single { it.tag == tag }.click!!.invoke()

    /** A switch that turns itself, so each press toggles it. */
    @Composable
    private fun TaggedSwitch(tag: String) {
        var on by remember { mutableStateOf(false) }
        KozmosSwitch(checked = on, onCheckedChange = { on = it }, modifier = Modifier.testTag(tag))
    }

    @Composable
    private fun TaggedCheckbox(tag: String) {
        var on by remember { mutableStateOf(false) }
        KozmosCheckbox(checked = on, onCheckedChange = { on = it }, modifier = Modifier.testTag(tag))
    }

    @Test fun aPartsEventsReachOnDispatchInOneBatchBatchDelayAfterTheFirst() {
        val clock = KozmosAnalyticsBatcherTest.ManualClock()
        val batches = mutableListOf<String>()
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosAnalyticsProvider(
                    onDispatch = { batch -> batches += "${clock.now}ms: ${batch.joinToString { "${it.component}.${it.eventName}" }}" },
                    batchDelayMs = 2000,
                    schedule = clock
                ) { TaggedSwitch("switch") }
            }
        }) {
            frames(2)
            press("switch")
            frames(2)
            clock.advanceTo(800)
            press("switch")
            frames(2)
            clock.advanceTo(1999)
            assertEquals("delivered before its delay", emptyList<String>(), batches)
            clock.advanceTo(2000)
            assertEquals(listOf("2000ms: Switch.switch_toggled, Switch.switch_toggled"), batches)
        }
    }

    @Test fun whatIsQueuedIsDeliveredWhenTheProviderLeaves() {
        val clock = KozmosAnalyticsBatcherTest.ManualClock()
        val batches = mutableListOf<List<String>>()
        var shown by mutableStateOf(true)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                if (shown) {
                    KozmosAnalyticsProvider(onDispatch = { batches += it.map { e -> e.eventName } }, schedule = clock) {
                        TaggedCheckbox("checkbox")
                    }
                }
            }
        }) {
            frames(2)
            press("checkbox")
            frames(2)
            assertEquals("delivered before its delay", emptyList<List<String>>(), batches)
            shown = false
            frames(3)
            assertEquals(listOf(listOf("checkbox_toggled")), batches)
            // Its delivery is called off with it: nothing arrives at 2000.
            clock.advanceTo(5000)
            assertEquals(1, batches.size)
        }
    }

    @Test fun aNestedProviderTakesItsOwnSubtreesEvents() {
        val clock = KozmosAnalyticsBatcherTest.ManualClock()
        val outer = mutableListOf<String>()
        val inner = mutableListOf<String>()
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosAnalyticsProvider(onDispatch = { outer += it.map { e -> e.eventName } }, schedule = clock) {
                    Column {
                        TaggedCheckbox("checkbox")
                        KozmosAnalyticsProvider(onDispatch = { inner += it.map { e -> e.eventName } }, schedule = clock) {
                            TaggedSwitch("switch")
                        }
                    }
                }
            }
        }) {
            frames(2)
            press("checkbox")
            press("switch")
            frames(2)
            clock.advanceTo(2000)
            assertEquals("outer, inner", listOf("checkbox_toggled") to listOf("switch_toggled"), outer to inner)
        }
    }

    @Test fun aProductsOwnEventGoesInTheSameBatch() {
        val clock = KozmosAnalyticsBatcherTest.ManualClock()
        val batches = mutableListOf<List<String>>()
        var product: KozmosAnalyticsTracker? = null
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosAnalyticsProvider(onDispatch = { batches += it.map { e -> "${e.component}.${e.eventName}" } }, schedule = clock) {
                    product = LocalKozmosAnalytics.current
                    TaggedSwitch("switch")
                }
            }
        }) {
            frames(2)
            press("switch")
            checkNotNull(product)(KozmosAnalyticsEvent(component = "VenueScreen", eventName = "venue_opened"))
            frames(2)
            clock.advanceTo(2000)
            assertEquals(listOf(listOf("Switch.switch_toggled", "VenueScreen.venue_opened")), batches)
        }
    }

    @Test fun aRecompositionAboveKeepsTheBatch() {
        val clock = KozmosAnalyticsBatcherTest.ManualClock()
        val batches = mutableListOf<List<String>>()
        var redraws by mutableStateOf(0)
        paparazzi.live(content = {
            KozmosMaterialTheme {
                // Read here, so a change recomposes the provider's caller.
                val drawn = redraws
                KozmosAnalyticsProvider(onDispatch = { batches += it.map { e -> "$drawn:${e.eventName}" } }, schedule = clock) {
                    TaggedSwitch("switch")
                }
            }
        }) {
            frames(2)
            press("switch")
            frames(2)
            redraws = 1
            frames(3)
            press("switch")
            frames(2)
            clock.advanceTo(2000)
            // One batch, both events, delivered to the newest onDispatch.
            assertEquals(listOf(listOf("1:switch_toggled", "1:switch_toggled")), batches)
        }
    }

    @Test fun onTheMainLooperABatchArrivesAfterItsDelay() {
        // The public provider, on the main looper's own clock, which
        // Paparazzi moves 33ms a frame.
        val batches = mutableListOf<List<String>>()
        paparazzi.live(durationMillis = 3000, content = {
            KozmosMaterialTheme {
                KozmosAnalyticsProvider(onDispatch = { batches += it.map { e -> e.eventName } }, batchDelayMs = 300) {
                    TaggedSwitch("switch")
                }
            }
        }) {
            frames(2)
            press("switch")
            frames(3)
            assertEquals("delivered before its delay", emptyList<List<String>>(), batches)
            frames(30)
            assertEquals(listOf(listOf("switch_toggled")), batches)
        }
    }

    @Test fun eachEventHasTheTimeItWasMadeAndEqualityIgnoresIt() {
        val before = System.currentTimeMillis()
        val event = KozmosAnalyticsEvent(component = "Switch", eventName = "switch_toggled")
        val after = System.currentTimeMillis()
        assertTrue("timestamp ${event.timestamp} in [$before, $after]", event.timestamp in before..after)
        Thread.sleep(5)
        // Two events of the same part, name and properties are equal, as before.
        assertEquals(event, KozmosAnalyticsEvent(component = "Switch", eventName = "switch_toggled"))
    }
}
