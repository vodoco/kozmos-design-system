package com.kozmos.components.alert

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-269: an alert's words have as much space below them as above.
 *
 * React lifted a title-less description 3 with a transform, which left its
 * box behind, so the words had 13 above and 19 below. Compose's alert put the
 * icon and the words at the top of a row as tall as the icon, 24, and a line
 * of the description is 19, so a title-less description had 16 above it and
 * 21 below. One line of words is now centred on the icon, as React's is; a
 * title and its description, or a longer description, stay at the top, as
 * before.
 *
 * Measured from each tagged part's frame to the alert's edges.
 */
class KozmosAlertSpacingTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun aTitlelessDescriptionHasAsMuchSpaceBelowAsAbove() {
        for (status in AlertStatus.values()) {
            val read = measure {
                KozmosAlert(Modifier.testTag("alert"), status = status) {
                    KozmosAlertIcon(modifier = Modifier.testTag("icon"))
                    KozmosAlertDescription("The merge is saved as a draft.", Modifier.testTag("words"))
                }
            }
            val (above, below) = read.inset("words")
            assertNear("$status: $above above the words, $below below", above, below)
            assertNear("$status: the icon is centred on the words", read["words"].center.y, read["icon"].center.y)
        }
    }

    @Test
    fun aTitlelessDescriptionInContentHasAsMuchSpaceBelowAsAbove() {
        val read = measure {
            KozmosAlert(Modifier.testTag("alert")) {
                KozmosAlertIcon()
                KozmosAlertContent(Modifier.testTag("words")) {
                    KozmosAlertDescription("The merge is saved as a draft.")
                }
            }
        }
        val (above, below) = read.inset("words")
        assertNear("$above above the words, $below below", above, below)
    }

    @Test
    fun aTitledAlertIsDrawnAsBefore() {
        val read = measure {
            KozmosAlert(Modifier.testTag("alert")) {
                KozmosAlertIcon(modifier = Modifier.testTag("icon"))
                KozmosAlertContent(Modifier.testTag("words")) {
                    KozmosAlertTitle("Units merged")
                    KozmosAlertDescription("The merge is saved as a draft.")
                }
            }
        }
        assertNear("the words' top", 16f, read.inset("words").first)
        assertNear("the words' bottom", 16f, read.inset("words").second)
        assertNear("the icon's top", 16f, read.inset("icon").first)
    }

    @Test
    fun aLongerDescriptionStartsAtTheTop() {
        val read = measure {
            KozmosAlert(Modifier.testTag("alert")) {
                KozmosAlertIcon(modifier = Modifier.testTag("icon"))
                KozmosAlertDescription(
                    "The merged unit keeps the first unit's name, its category and its opening hours; the others are kept in the merge history.",
                    Modifier.testTag("words")
                )
            }
        }
        assertTrue("the description is not longer than the icon", read["words"].height > read["icon"].height)
        assertNear("the words' top", 16f, read.inset("words").first)
        assertNear("the words' bottom", 16f, read.inset("words").second)
        assertNear("the icon's top", 16f, read.inset("icon").first)
    }

    /** A caller's own smaller icon is centred on a line of words, too. */
    @Test
    fun aSmallerIconIsCentredOnALineOfWords() {
        val read = measure {
            KozmosAlert(Modifier.testTag("alert")) {
                Icon(Icons.Default.Info, contentDescription = null, modifier = Modifier.size(16.dp).testTag("icon"))
                KozmosAlertDescription("The merge is saved as a draft.", Modifier.testTag("words"))
            }
        }
        val (above, below) = read.inset("words")
        assertNear("$above above the words, $below below", above, below)
        assertNear("the icon is centred on the words", read["words"].center.y, read["icon"].center.y)
    }

    // Measuring.

    private class Frames(private val frames: Map<String, Rect>) {
        operator fun get(name: String): Rect = checkNotNull(frames[name]) { "no node tagged $name among ${frames.keys}" }

        /** The space above a part and below it, inside the alert. */
        fun inset(name: String): Pair<Float, Float> {
            val alert = this["alert"]
            val part = this[name]
            return (part.top - alert.top) to (alert.bottom - part.bottom)
        }
    }

    /** Every tagged node's frame, in dp, laid out 320dp wide. */
    private fun measure(content: @Composable () -> Unit): Frames {
        var density = 1f
        val tree: ReadSemantics = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Column(Modifier.width(320.dp)) { content() }
            }
        }
        val frames = tree.unmerged.filter { it.tag != null }.associate { node ->
            node.tag!! to node.frame.let { Rect(it.left / density, it.top / density, it.right / density, it.bottom / density) }
        }
        return Frames(frames)
    }

    private fun assertNear(message: String, expected: Float, actual: Float) {
        assertTrue("$message: $actual, wanted $expected", abs(expected - actual) <= 0.5f)
    }
}
