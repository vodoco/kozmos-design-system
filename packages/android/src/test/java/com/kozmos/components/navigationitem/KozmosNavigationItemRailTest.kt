package com.kozmos.components.navigationitem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 36 (row 25 / GAP-013): a rail tile's label is labelSmall, 11sp, on
 * 14sp lines and up to two of them, as React's is 11px on 14px, and a two-line
 * tile stays 72dp tall. It was one line of labelSmall's own 16sp, so a two-word
 * label lost its second word to an ellipsis. Read from the label's own text
 * layout and the tile's laid-out size, in dp.
 */
class KozmosNavigationItemRailTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(
        val lines: Int,
        val lastLineEllipsized: Boolean,
        val fontSizeSp: Float,
        /** From the first line's baseline to the second's; null unless two lines. */
        val pitchDp: Float?,
        val labelHeightDp: Float,
        val tileDp: Pair<Float, Float>
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /** A rail tile holding [label], laid out at [fontScale], as its text layout and size read it. */
    private fun laidOut(
        label: String,
        density: KozmosNavigationItemDensity = KozmosNavigationItemDensity.Default,
        fontScale: Float = 1f,
        tile: @Composable () -> Unit = {
            KozmosNavigationItem(
                label = label,
                placement = KozmosNavigationItemPlacement.Rail,
                density = density,
                content = KozmosNavigationItemContent.IconLabel,
                icon = { Box(Modifier.size(24.dp)) }
            )
        }
    ): Laid {
        var laid: Laid? = null
        paparazzi.snapshot {
            val view = LocalView.current
            val device = LocalDensity.current
            CompositionLocalProvider(
                LocalDensity provides Density(device.density, fontScale),
                LocalKozmosUseDarkTokens provides false
            ) {
                MaterialTheme(typography = KozmosTypography.typography()) {
                    Box(
                        Modifier.onGloballyPositioned {
                            val nodes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                            val text = nodes.single { node ->
                                node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == label } == true
                            }
                            val layouts = mutableListOf<TextLayoutResult>()
                            text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
                            val layout = layouts.single()
                            val button = nodes.single { it.config.contains(SemanticsActions.OnClick) }
                            val px = device.density
                            laid = Laid(
                                lines = layout.lineCount,
                                lastLineEllipsized = layout.isLineEllipsized(layout.lineCount - 1),
                                fontSizeSp = layout.layoutInput.style.fontSize.value,
                                pitchDp = if (layout.lineCount != 2) null else
                                    (layout.lastBaseline - layout.firstBaseline) / px,
                                labelHeightDp = layout.size.height / px,
                                tileDp = button.size.width / px to button.size.height / px
                            )
                        }
                    ) {
                        tile()
                    }
                }
            }
        }
        return checkNotNull(laid) { "the tile was never laid out" }
    }

    @Test
    fun aTwoWordLabelTakesTwoLinesOf14spAndTheTileStays72() {
        val laid = laidOut("System Settings")

        assertEquals("\"System Settings\": its lines", 2, laid.lines)
        assertEquals("\"System Settings\" is cut", false, laid.lastLineEllipsized)
        assertEquals("the label's size", 11f, laid.fontSizeSp, 0.01f)
        assertEquals("from one baseline to the next", 14f, checkNotNull(laid.pitchDp), 0.34f)
        assertEquals("the label's two lines", 28f, laid.labelHeightDp, 0.34f)
        assertEquals("the tile's width", 72f, laid.tileDp.first, 0.5f)
        assertEquals("the tile's height", 72f, laid.tileDp.second, 0.5f)
    }

    @Test
    fun aLabelThatNeedsAThirdLineIsCutAtTheEndOfItsSecond() {
        val laid = laidOut("Saved places and recent routes")

        assertEquals("its lines", 2, laid.lines)
        assertTrue("the second line has no ellipsis", laid.lastLineEllipsized)
        assertEquals("the tile's height", 72f, laid.tileDp.second, 0.5f)
    }

    @Test
    fun theCompactTileKeepsItsWidth() {
        // Holds before the change and after it.
        assertEquals(64f, laidOut("Settings", density = KozmosNavigationItemDensity.Compact).tileDp.first, 0.5f)
    }

    @Test
    fun theLabelAndItsLineGrowWithTheFontScale() {
        val atDefault = laidOut("System Settings")
        val larger = laidOut("System Settings", fontScale = 1.3f)

        assertEquals("its lines at 1.3", 2, larger.lines)
        assertTrue(
            "the line did not grow: ${atDefault.pitchDp} to ${larger.pitchDp}",
            checkNotNull(larger.pitchDp) > checkNotNull(atDefault.pitchDp) + 3f
        )
        assertTrue("the tile did not grow to hold it: ${larger.tileDp}", larger.tileDp.second > 72.5f)
    }

    @Test
    fun theDocsRailExampleIsARailTile() {
        // Holds before the change and after it: it is here so that the example
        // compiles somewhere.
        val laid = laidOut("Nearby places") { RailNavigationItemExample() }

        assertEquals(72f, laid.tileDp.first, 0.5f)
        assertEquals(72f, laid.tileDp.second, 0.5f)
    }
}

// NavigationItem.mdx's Compose rail example, the same code, so that it compiles
// somewhere: the docs' native snippets are compiled nowhere else.
@Composable
fun RailNavigationItemExample() {
    KozmosNavigationItem(
        label = "Nearby places",
        placement = KozmosNavigationItemPlacement.Rail,
        content = KozmosNavigationItemContent.IconLabel,
        icon = { Icon(Icons.Default.Place, contentDescription = null) }
    )
}
