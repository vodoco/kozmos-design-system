package com.kozmos.components.tabs

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.LayoutDirection
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-152: a tab can carry an icon over its label, for the type picker's
 * five tabs. As React's and SwiftUI's, the icon is 20dp, 4dp above the label,
 * both centred across the tab; the segment keeps its padding, so the track
 * grows by the icon and its gap; the icon takes the label's colour; and it is
 * decorative, so TalkBack still reads one tab by its title, selected or not.
 *
 * Where things sit is read off the laid-out tree, left to right and right to
 * left: the titles from the semantics, the icons from where they were placed.
 * Two tabs, the second selected, so the selected one is not the first.
 */
class KozmosTabsIconTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val titles = listOf("Hours", "Access")

    private class Drawn(
        val tree: ReadSemantics,
        val icons: Map<String, Rect>,
        val inks: Map<String, Color>,
        val px: Float,
        val tokens: Pair<Color, Color>
    )

    private fun draw(withIcons: Boolean, rtl: Boolean = false, describedIcon: Boolean = false): Drawn {
        val icons = mutableMapOf<String, Rect>()
        val inks = mutableMapOf<String, Color>()
        var px = 0f
        var tokens = Color.Unspecified to Color.Unspecified
        val tree = paparazzi.readSemantics {
            px = LocalDensity.current.density
            tokens = KozmosThemeTokens.primitivesColorsForeground0 to KozmosThemeTokens.primitivesColorsForeground400
            CompositionLocalProvider(LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr) {
                KozmosMaterialTheme {
                    KozmosTabs {
                        KozmosTabsList {
                            for (title in titles) {
                                val icon: (@Composable () -> Unit)? = if (!withIcons) null else {
                                    {
                                        inks[title] = LocalContentColor.current
                                        if (describedIcon) {
                                            Icon(Icons.Default.Home, contentDescription = "$title icon")
                                        } else {
                                            Box(Modifier.fillMaxSize().onGloballyPositioned { icons[title] = it.boundsInRoot() })
                                        }
                                    }
                                }
                                KozmosTabsTrigger(
                                    value = title.lowercase(),
                                    title = title,
                                    selectedValue = "access",
                                    onValueChange = {},
                                    icon = icon
                                )
                            }
                        }
                    }
                }
            }
        }
        return Drawn(tree, icons, inks, px, tokens)
    }

    /** The laid-out box of [title]'s own words. */
    private fun ReadSemantics.titleBox(title: String): Rect = unmerged.single { it.texts == listOf(title) }.bounds

    // Within a pixel: weighted tabs and centred children are placed on whole
    // pixels, so a centre can round either way.
    private fun assertNear(what: String, expected: Float, actual: Float) =
        assertTrue("$what: expected $expected px, was $actual px", abs(expected - actual) <= 1f)

    @Test
    fun anIconSitsOverItsTitleCentredWithItEitherWay() {
        for (rtl in listOf(false, true)) {
            val drawn = draw(withIcons = true, rtl = rtl)
            val way = if (rtl) "right to left" else "left to right"
            for (title in titles) {
                val icon = drawn.icons[title]
                assertTrue("$title has no icon drawn, $way", icon != null)
                val words = drawn.tree.titleBox(title)
                val tab = drawn.tree.saying(title).bounds
                assertNear("$title's icon width, $way", 20 * drawn.px, icon!!.width)
                assertNear("$title's icon height, $way", 20 * drawn.px, icon.height)
                assertNear("$title's gap from icon to title, $way", 4 * drawn.px, words.top - icon.bottom)
                assertNear("$title's icon centre against its title's, $way", words.center.x, icon.center.x)
                assertNear("$title's icon centre against its tab's, $way", tab.center.x, icon.center.x)
            }
            // Right to left, the first tab is the one at the right.
            val first = drawn.icons.getValue(titles[0]).center.x
            val second = drawn.icons.getValue(titles[1]).center.x
            assertEquals("the tabs' order, $way", rtl, first > second)
        }
    }

    @Test
    fun theIconTakesItsTitlesColour() {
        val drawn = draw(withIcons = true)
        assertEquals("the selected tab's icon, foreground/0", drawn.tokens.first, drawn.inks["Access"])
        assertEquals("the other tab's icon, foreground/400", drawn.tokens.second, drawn.inks["Hours"])
    }

    /** A described icon adds nothing: the tab is still one tab, read by its title, saying whether it is selected. */
    @Test
    fun aTabWithAnIconIsReadByItsTitleAlone() {
        val drawn = draw(withIcons = true, describedIcon = true)
        assertEquals("the icons were never composed", titles.toSet(), drawn.inks.keys)
        val tabs = drawn.tree.merged.filter { it.role == Role.Tab }
        assertEquals(
            "what TalkBack reads of each tab",
            listOf("Hours texts=[Hours] description=null selected=false", "Access texts=[Access] description=null selected=true"),
            tabs.map { "${it.words} texts=${it.texts} description=${it.description} selected=${it.selected}" }
        )
        assertTrue("an icon's description is read on its own", drawn.tree.merged.none { it.description?.contains("icon") == true })
    }

    /**
     * Without an icon a tab is as it was: its title centred in a 36dp segment
     * 4dp inside the 44dp track. With one, the segment keeps its 6dp padding
     * inside the track's 4dp, top and bottom, and the track grows to hold the
     * icon, its gap and the title.
     */
    @Test
    fun theSegmentKeepsItsPaddingAndTheTrackGrowsToHoldTheIcon() {
        val plain = draw(withIcons = false)
        val iconed = draw(withIcons = true)
        val px = plain.px
        for (title in titles) {
            val tab = plain.tree.saying(title).bounds
            assertNear("$title's plain tab height", 44 * px, tab.height)
            assertNear("$title's plain title, centred down the tab", tab.center.y, plain.tree.titleBox(title).center.y)
            assertNear("$title's plain title, centred across the tab", tab.center.x, plain.tree.titleBox(title).center.x)

            val grown = iconed.tree.saying(title).bounds
            val icon = iconed.icons[title]
            assertTrue("$title has no icon drawn", icon != null)
            val words = iconed.tree.titleBox(title)
            assertNear("$title's icon from the track's top", 10 * px, icon!!.top - grown.top)
            assertNear("$title's title from the track's bottom", 10 * px, grown.bottom - words.bottom)
            assertTrue("$title's track did not grow: ${grown.height} against ${tab.height}", grown.height > tab.height)
        }
        assertTrue("a plain tab composed an icon", plain.inks.isEmpty())
        assertNull(plain.icons["Hours"])
    }
}
