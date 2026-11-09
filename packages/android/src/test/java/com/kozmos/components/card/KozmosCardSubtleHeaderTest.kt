package com.kozmos.components.card

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * CardHeader's subtle tone (CLOUD-UI-001; decisions 135 and 139) and
 * CardTitle's size (GAP-035, decision 132), as React and SwiftUI draw them:
 * the strip is as wide as the card, at least 52 tall, with a card's padding
 * under its tint before the content; a title in it is the strip's size unless
 * it says otherwise; and the three sizes step down. Its colour is read by
 * KozmosSubtleFillPixelsTest. Mirrors KozmosCardSubtleHeaderTests on SwiftUI.
 */
class KozmosCardSubtleHeaderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Every tagged node's frame, in dp, laid out 320dp wide. */
    private fun measure(content: @androidx.compose.runtime.Composable () -> Unit): Map<String, Rect> {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Column(Modifier.width(320.dp)) { content() }
            }
        }
        return tree.unmerged.filter { it.tag != null }.associate { node ->
            node.tag!! to node.frame.let { Rect(it.left / density, it.top / density, it.right / density, it.bottom / density) }
        }
    }

    private fun near(message: String, expected: Float, actual: Float) {
        assertTrue("$message: $actual, wanted $expected", abs(expected - actual) <= 0.5f)
    }

    @Test
    fun theStripIsTheCardsWidthFiftyTwoTallWithTheCardsPaddingUnderIt() {
        for (padding in KozmosCardPadding.values()) {
            val frames = measure {
                KozmosCard(Modifier.testTag("card"), padding = padding) {
                    KozmosCardHeader(Modifier.testTag("header"), tone = KozmosCardHeaderTone.Subtle) {
                        KozmosCardTitle(title = "Add beacon")
                    }
                    KozmosCardContent(Modifier.testTag("content")) { Text("Name") }
                }
            }
            val card = frames.getValue("card")
            val header = frames.getValue("header")
            val content = frames.getValue("content")
            val pad = padding.length.value
            // The header's frame is the strip and the card's padding under it.
            near("$padding: the strip is the card's width", card.width, header.width)
            near("$padding: the strip starts at the card's top", card.top, header.top)
            near("$padding: a lone title's strip is 52, and the padding under it", 52f + pad, header.height)
            near("$padding: the content starts under the padding", header.bottom, content.top)
        }
    }

    @Test
    fun theDefaultHeaderIsDrawnAsItWas() {
        val frames = measure {
            KozmosCard(Modifier.testTag("card")) {
                KozmosCardHeader(Modifier.testTag("header")) { KozmosCardTitle(title = "Add beacon", modifier = Modifier.testTag("title")) }
            }
        }
        val header = frames.getValue("header")
        val title = frames.getValue("title")
        near("the header pays the card's 24 above its title", header.top + 24f, title.top)
        near("and 24 below it", title.bottom + 24f, header.bottom)
    }

    @Test
    fun theTitleSizesStepDownAndTheStripsTitleIsTheSmallest() {
        val frames = measure {
            KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("unset"))
            KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("default"), size = KozmosCardTitleSize.Default)
            KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("sm"), size = KozmosCardTitleSize.Sm)
            KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("xs"), size = KozmosCardTitleSize.Xs)
            KozmosCard {
                KozmosCardHeader(tone = KozmosCardHeaderTone.Subtle) {
                    KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("strip"))
                    KozmosCardTitle(title = "Lunch nearby", modifier = Modifier.testTag("strip-sm"), size = KozmosCardTitleSize.Sm)
                }
            }
        }
        val height = { tag: String -> frames.getValue(tag).height }
        assertEquals("unset is the default size", height("default"), height("unset"), 0.5f)
        assertTrue("sm is smaller than the default: ${height("sm")} of ${height("default")}", height("sm") < height("default"))
        assertTrue("xs is smaller than sm: ${height("xs")} of ${height("sm")}", height("xs") < height("sm"))
        assertEquals("the strip's unset title is xs", height("xs"), height("strip"), 0.5f)
        assertEquals("a size given in the strip wins", height("sm"), height("strip-sm"), 0.5f)
    }
}
