package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.searchbar.KozmosSearchBar
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

/**
 * The panel header (row 73): drawn under the sheet's handle and above the
 * content, outside what the content scrolls, so a search field or a chosen
 * category stays put while the results under it scroll. Every detent counts
 * it. Each part is measured where the snapshot laid it out; the goldens are
 * what it drew.
 */
class KozmosAdaptiveMapShellPanelHeaderPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    /** Where each probed part was laid out, in pixels: unclipped, and as the sheet shows it. */
    private val placed = mutableMapOf<String, Rect>()
    private val shown = mutableMapOf<String, Rect>()
    private var density = 1f

    private fun Modifier.probe(name: String) = onGloballyPositioned {
        placed[name] = Rect(it.positionInRoot(), it.size.toSize())
        shown[name] = it.boundsInRoot()
    }

    private fun block(name: String, height: Int, color: Color) =
        Modifier.fillMaxWidth().height(height.dp).background(color).probe(name)

    private fun shell(
        detent: KozmosMapPanelDetent,
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        header: @Composable () -> Unit,
        panel: @Composable () -> Unit
    ) = @Composable {
        density = LocalDensity.current.density
        MaterialTheme {
            KozmosAdaptiveMapShell(
                map = { Box(modifier = Modifier.fillMaxSize().background(Color.Red).probe("map")) },
                panel = panel,
                panelHeader = header,
                panelDetents = detents,
                panelDetent = detent
            )
        }
    }

    /** In dp. */
    private fun dp(px: Float) = px / density
    private fun part(name: String): Rect {
        val rect = placed[name]
        assertNotNull("the $name is not drawn", rect)
        return rect!!
    }
    private val shellHeight get() = dp(part("map").height).dp
    private val shellBottom get() = dp(part("map").bottom)

    /**
     * At the largest detent, over a list that has scrolled: the header under
     * the handle's 16 and its 4 of clearance (decision 14), its own 72 tall,
     * and the list starting under it.
     */
    @Test
    fun theHeaderSitsUnderTheHandleAboveTheContent() {
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Large,
                header = { Box(modifier = block("header", 72, Color.Green)) },
                panel = {
                    LazyColumn(
                        state = rememberLazyListState(initialFirstVisibleItemIndex = 5),
                        modifier = Modifier.fillMaxSize().probe("content")
                    ) {
                        items(30) { index ->
                            Box(modifier = Modifier.fillMaxWidth().height(60.dp).background(if (index % 2 == 0) Color.Blue else Color.Yellow))
                        }
                    }
                }
            )
        )
        val header = part("header")
        val sheetTop = shellBottom - KozmosMapPanelDetent.Large.height(shellHeight).value
        assertEquals("the header is not under the handle's row", sheetTop + 16f + 4f, dp(header.top), 0.5f)
        assertEquals("the header is not its own height", 72f, dp(header.height), 0.5f)
        assertEquals("the content does not start under the header", dp(header.bottom), dp(part("content").top), 0.5f)
    }

    /**
     * No anchor, and a header taller than a fifth of the shell: the collapsed
     * sheet grows to the header's bottom edge and the peek margin, and shows
     * all of the header — where it used to stop at a fifth and cut it.
     */
    @Test
    fun aCollapsedSheetShowsTheWholeHeader() {
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Collapsed,
                header = { Box(modifier = block("header", 200, Color.Green)) },
                panel = { Box(modifier = block("content", 900, Color.Blue)) }
            )
        )
        val header = part("header")
        assertEquals("the margin under the header is not 16", shellBottom - 16f, dp(header.bottom), 0.5f)
        assertEquals("the collapsed sheet cuts the header", 200f, dp(shown.getValue("header").height), 0.5f)
    }

    /**
     * A header is not a peek anchor: a search row's 44 under the handle
     * leaves the collapsed sheet at a fifth of the shell, not at an anchored
     * peek's quarter.
     */
    @Test
    fun aSmallHeaderLeavesTheCollapsedDetentWhereItWas() {
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Collapsed,
                header = { Box(modifier = block("header", 44, Color.Green)) },
                panel = { Box(modifier = block("content", 900, Color.Blue)) }
            )
        )
        val fifth = KozmosMapPanelDetent.Collapsed.height(shellHeight).value
        assertEquals("the collapsed sheet is not a fifth of the shell", shellBottom - fifth + 16f + 4f, dp(part("header").top), 0.5f)
    }

    /**
     * An anchor marked in the header is honoured, and outranks one in the
     * content, as React's `measurePeekBottom` has it: the sheet rests on the
     * header's 60 first row — at a quarter of the shell — not on the
     * content's anchor nor on the header's bottom edge.
     */
    @Test
    fun anAnchorInTheHeaderIsHonoured() {
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Collapsed,
                header = {
                    Column {
                        Box(modifier = block("row", 60, Color.Green).kozmosPanelPeekAnchor())
                        Box(modifier = block("rest", 200, Color.Yellow))
                    }
                },
                panel = {
                    Column {
                        Box(modifier = block("content", 250, Color.Blue).kozmosPanelPeekAnchor())
                        Box(modifier = block("more", 900, Color.Red))
                    }
                }
            )
        )
        val anchored = KozmosMapPanelDetent.anchoredCollapsedHeight((16 + 4 + 60).dp, shellHeight).value
        assertEquals("the sheet does not rest on the header's anchor", shellBottom - anchored + 16f + 4f, dp(part("row").top), 0.5f)
    }

    /**
     * Fitted to its content, the sheet counts the handle and its 4 of
     * clearance, the 80 header and the 300 panel: 400. Offered with large
     * only: with a shorter detent on offer the sheet eases from its
     * unmeasured medium to the measured height after the first frame, and a
     * snapshot draws the start of that ease.
     */
    @Test
    fun theContentFittedSheetCountsTheHeader() {
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Content,
                detents = listOf(KozmosMapPanelDetent.Content, KozmosMapPanelDetent.Large),
                header = { Box(modifier = block("header", 80, Color.Green)) },
                panel = { Box(modifier = block("content", 300, Color.Blue)) }
            )
        )
        val header = part("header")
        assertEquals("the fitted sheet does not count the header", shellBottom - 400f + 16f + 4f, dp(header.top), 0.5f)
        assertEquals("the content does not follow the header", dp(header.bottom), dp(part("content").top), 0.5f)
        assertEquals("the content is cut", shellBottom, dp(part("content").bottom), 0.5f)
    }

    /** Beside the map the header is the panel's first row, and the content takes the rest. */
    @Test
    fun inASidePanelTheHeaderIsTheFirstRow() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        paparazzi.snapshot(
            composable = shell(
                KozmosMapPanelDetent.Medium,
                header = { Box(modifier = block("header", 72, Color.Green)) },
                panel = { Box(modifier = Modifier.fillMaxSize().background(Color.Blue).probe("content")) }
            )
        )
        val header = part("header")
        val content = part("content")
        // The panel floats 16 in from the map's edges.
        assertEquals("the header is not the panel's first row", 16f, dp(header.top), 0.5f)
        assertEquals("the content does not follow the header", dp(header.bottom), dp(content.top), 0.5f)
        assertEquals("the content does not fill the panel under the header", shellBottom - 16f, dp(content.bottom), 0.5f)
        assertEquals("the header is not as wide as the panel", dp(content.width), dp(header.width), 0.5f)
    }

    /**
     * The header on the sheet's surface in the dark theme: a search field and
     * a row of chips that scrolls sideways, over results, the sheet collapsed
     * on the header. Colour matters here, so dark is drawn explicitly.
     */
    @Test
    fun theHeaderOnTheSheetInTheDarkTheme() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                MaterialTheme(colorScheme = darkColorScheme()) {
                    KozmosAdaptiveMapShell(
                        map = { Box(modifier = Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground200)) },
                        panelDetent = KozmosMapPanelDetent.Medium,
                        panelHeader = {
                            Column(
                                modifier = Modifier.padding(horizontal = 16.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                KozmosSearchBar(value = "", onValueChange = {}, placeholder = "Search places")
                                Row(
                                    modifier = Modifier.horizontalScroll(rememberScrollState()).padding(bottom = 8.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    listOf("Cafés", "Gates", "Toilets", "Shops", "Lounges").forEach { KozmosChip(text = it) }
                                }
                            }
                        },
                        panel = {
                            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                                listOf("Gate B12", "Pret A Manger", "Boots", "WHSmith").forEach {
                                    Text(it, color = KozmosThemeTokens.primitivesColorsForeground100, modifier = Modifier.padding(vertical = 12.dp))
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}
