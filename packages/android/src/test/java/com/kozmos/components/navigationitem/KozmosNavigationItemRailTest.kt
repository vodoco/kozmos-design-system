package com.kozmos.components.navigationitem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarVariant
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 42: the rail takes the dashboard side menu's design. A rail item
 * fills its rail and grows with its label: 16dp by 8dp of padding, a 24dp icon
 * 6dp above a regular labelSmall label (11sp) on 14sp lines, up to two, its
 * content centred. At rest it is foreground/400, the muted foreground;
 * selected, theme/600 (on theme/0, with a bar: KozmosNavigationItemRailBarTest
 * reads those off the drawing). KozmosSidebar's rail is 96dp. Read from the
 * label's own text layout and the laid-out sizes, in dp.
 */
class KozmosNavigationItemRailTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private class Laid(
        val lines: Int,
        val lastLineEllipsized: Boolean,
        val fontSizeSp: Float,
        val fontWeight: FontWeight?,
        val color: Color,
        /** From the first line's baseline to the second's; null unless two lines. */
        val pitchDp: Float?,
        val labelHeightDp: Float,
        val tileDp: Pair<Float, Float>,
        /** The icon's top, from the item's top. */
        var iconTopDp: Float,
        val expectedColors: Map<String, Color>
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /**
     * A rail item holding [label] in a rail [railWidth] wide, laid out at
     * [fontScale] and, given [itemHeight], made that tall.
     */
    private fun laidOut(
        label: String,
        selected: Boolean = false,
        density: KozmosNavigationItemDensity = KozmosNavigationItemDensity.Default,
        fontScale: Float = 1f,
        railWidth: Dp = 96.dp,
        itemHeight: Dp? = null
    ): Laid {
        var laid: Laid? = null
        var iconTop = Float.NaN
        var itemTop = Float.NaN
        var px = 1f
        paparazzi.snapshot {
            val view = LocalView.current
            val device = LocalDensity.current
            CompositionLocalProvider(
                LocalDensity provides Density(device.density, fontScale),
                LocalKozmosUseDarkTokens provides false
            ) {
                MaterialTheme(typography = KozmosTypography.typography()) {
                    val expected = mapOf(
                        "muted" to KozmosThemeTokens.primitivesColorsForeground400,
                        "primary" to KozmosThemeTokens.primitivesColorsTheme600
                    )
                    // Paparazzi hands its content the whole screen; the outer Box
                    // lets the rail be [railWidth].
                    Box(Modifier.fillMaxSize()) { Box(
                        Modifier
                            .width(railWidth)
                            .onGloballyPositioned {
                                val nodes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                                val text = nodes.single { node ->
                                    node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == label } == true
                                }
                                val layouts = mutableListOf<TextLayoutResult>()
                                text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
                                val layout = layouts.single()
                                val item = nodes.single { it.config.contains(SemanticsActions.OnClick) }
                                px = device.density
                                itemTop = item.positionInRoot.y
                                laid = Laid(
                                    lines = layout.lineCount,
                                    lastLineEllipsized = layout.isLineEllipsized(layout.lineCount - 1),
                                    fontSizeSp = layout.layoutInput.style.fontSize.value,
                                    fontWeight = layout.layoutInput.style.fontWeight,
                                    color = layout.layoutInput.style.color,
                                    pitchDp = if (layout.lineCount != 2) null else
                                        (layout.lastBaseline - layout.firstBaseline) / px,
                                    labelHeightDp = layout.size.height / px,
                                    tileDp = item.size.width / px to item.size.height / px,
                                    iconTopDp = Float.NaN,
                                    expectedColors = expected
                                )
                            }
                    ) {
                        KozmosNavigationItem(
                            label = label,
                            modifier = if (itemHeight != null) Modifier.height(itemHeight) else Modifier,
                            placement = KozmosNavigationItemPlacement.Rail,
                            density = density,
                            content = KozmosNavigationItemContent.IconLabel,
                            selected = selected,
                            icon = {
                                Box(Modifier.size(24.dp).onGloballyPositioned { iconTop = it.positionInRoot().y })
                            }
                        )
                    } }
                }
            }
        }
        // Every callback has run once the snapshot is taken, whatever their order.
        return checkNotNull(laid) { "the item was never laid out" }.also { it.iconTopDp = (iconTop - itemTop) / px }
    }

    @Test
    fun aRailItemFillsItsRail() {
        // The 72dp and 64dp tiles are retired, and a compact rail item is
        // the default one.
        assertEquals("in a 96dp rail", 96f, laidOut("Home").tileDp.first, 0.5f)
        assertEquals("in a wider one", 120f, laidOut("Home", railWidth = 120.dp).tileDp.first, 0.5f)
        val compact = laidOut("Home", density = KozmosNavigationItemDensity.Compact).tileDp
        assertEquals("a compact rail item's width", 96f, compact.first, 0.5f)
        assertEquals("a compact rail item's height", laidOut("Home").tileDp.second, compact.second, 0.5f)
    }

    @Test
    fun aRailItemIsPadded16By8AndGrowsWithItsLabel() {
        // 16 + 24 + 6 + 14 a line + 16: 76, or 90 with two lines.
        val one = laidOut("Home")
        assertEquals("a one-line item's height", 76f, one.tileDp.second, 0.5f)
        assertEquals("the icon's top", 16f, one.iconTopDp, 0.5f)
        val two = laidOut("Accessible routes")
        assertEquals("\"Accessible routes\": its lines", 2, two.lines)
        assertEquals("a two-line item's height", 90f, two.tileDp.second, 0.5f)
    }

    @Test
    fun itsLabelIsRegular11spOn14spLinesUpToTwo() {
        val laid = laidOut("Accessible routes")
        assertEquals("the label's size", 11f, laid.fontSizeSp, 0.01f)
        assertEquals("the label's weight", FontWeight.Normal, laid.fontWeight)
        assertEquals("from one baseline to the next", 14f, checkNotNull(laid.pitchDp), 0.34f)
        assertEquals("the label's two lines", 28f, laid.labelHeightDp, 0.34f)
        assertEquals("\"Accessible routes\" is cut", false, laid.lastLineEllipsized)

        val long = laidOut("Saved places, recent routes and accessible entrances")
        assertEquals("a long label's lines", 2, long.lines)
        assertTrue("its second line has no ellipsis", long.lastLineEllipsized)
    }

    @Test
    fun itsContentIsCentredInATallerItem() {
        // Given 120dp, the 76dp of content sits in the middle: the icon's top
        // is 22 + 16 down, where it sat 16 down at the top before.
        assertEquals("the icon's top in a 120dp item", 38f, laidOut("Home", itemHeight = 120.dp).iconTopDp, 0.5f)
    }

    @Test
    fun atRestItIsTheMutedForegroundAndSelectedItIsPrimary() {
        val rest = laidOut("Home")
        assertEquals("at rest", rest.expectedColors.getValue("muted"), rest.color)
        val selected = laidOut("Search", selected = true)
        assertEquals("selected", selected.expectedColors.getValue("primary"), selected.color)
    }

    @Test
    fun theSidebarRailIs96AndItsItemsFillItsInside() {
        var sidebar = 0f
        var item = 0f
        paparazzi.snapshot {
            val px = LocalDensity.current.density
            MaterialTheme(typography = KozmosTypography.typography()) {
                // Paparazzi hands its content the whole screen; a Box lets
                // the sidebar be the width it chooses.
                Box(Modifier.fillMaxSize()) {
                    KozmosSidebar(
                        modifier = Modifier.onGloballyPositioned { sidebar = it.size.width / px },
                        variant = KozmosSidebarVariant.Rail,
                        navigation = {
                            KozmosNavigationItem(
                                label = "Home",
                                modifier = Modifier.onGloballyPositioned { item = it.size.width / px },
                                placement = KozmosNavigationItemPlacement.Rail,
                                content = KozmosNavigationItemContent.IconLabel,
                                icon = { Icon(Icons.Default.Home, contentDescription = null) }
                            )
                        }
                    )
                }
            }
        }
        assertEquals("the rail's width", 96f, sidebar, 0.5f)
        // Its 1dp edge is inside the 96, as a CSS border is.
        assertEquals("the item's width", 95f, item, 0.5f)
    }

    @Test
    fun theDocsRailExampleIsTheSidebarRail() {
        var width = 0f
        paparazzi.snapshot {
            val px = LocalDensity.current.density
            MaterialTheme(typography = KozmosTypography.typography()) {
                Box(
                    Modifier
                        .wrapContentSize(Alignment.TopStart)
                        .onGloballyPositioned { width = it.size.width / px }
                ) { RailNavigationExample() }
            }
        }
        assertEquals("the example's rail", 96f, width, 0.5f)
    }
}

// NavigationItem.mdx's Compose rail example, the same code, so that it
// compiles somewhere: the docs' native snippets are compiled nowhere else.
@Composable
fun RailNavigationExample() {
    KozmosSidebar(
        variant = KozmosSidebarVariant.Rail,
        navigation = {
            KozmosNavigationItem(
                label = "Home",
                placement = KozmosNavigationItemPlacement.Rail,
                content = KozmosNavigationItemContent.IconLabel,
                selected = true,
                icon = { Icon(Icons.Default.Home, contentDescription = null) }
            )
            KozmosNavigationItem(
                label = "Accessible routes",
                placement = KozmosNavigationItemPlacement.Rail,
                content = KozmosNavigationItemContent.IconLabel,
                icon = { Icon(Icons.Default.Place, contentDescription = null) }
            )
        }
    )
}

