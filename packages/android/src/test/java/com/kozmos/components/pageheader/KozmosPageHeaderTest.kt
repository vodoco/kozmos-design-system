package com.kozmos.components.pageheader

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.ReadSemantics
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * PageHeader (GAP-036, decision 135), as React draws it: its content in a
 * Container with the block inset (GAP-116) 32 above and 24 below, the title
 * a heading at Heading 3's 24/32 or Heading 2's 30/36, the info button and
 * the actions centred on the title's first line, and nothing drawn for a
 * slot left out. The band's colour is read by KozmosPageHeaderBandPixelsTest.
 */
class KozmosPageHeaderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private fun read(width: Int = 360, content: @Composable () -> Unit): ReadSemantics =
        paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Column(Modifier.requiredWidth(width.dp)) { content() }
            }
        }

    private fun ReadSemantics.frame(words: String): Rect =
        unmerged.single { it.texts.contains(words) || it.description == words }.frame.let {
            Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
        }

    private fun ReadSemantics.tagged(tag: String): Rect =
        unmerged.single { it.tag == tag }.frame.let {
            Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
        }

    @Test
    fun theTitleIsAHeadingAndTheDescriptionIsNot() {
        val tree = read {
            KozmosPageHeader(title = "Settings", description = "Manage the site's map.")
        }
        assertTrue("the title is a heading", tree.saying("Settings").heading)
        assertFalse("the description is not", tree.saying("Manage the site's map.").heading)
    }

    @Test
    fun theContentSitsThirtyTwoBelowTheTopAndTwentyFourAboveTheEnd() {
        for (tone in KozmosPageHeaderTone.values()) {
            val tree = read {
                KozmosPageHeader(title = "Settings", modifier = Modifier.testTag("header"), tone = tone)
            }
            val header = tree.tagged("header")
            val title = tree.frame("Settings")
            assertEquals("$tone: 32 above the title", 32f, title.top - header.top, 0.5f)
            assertEquals("$tone: 24 below it", 24f, header.bottom - title.bottom, 0.5f)
            assertEquals("$tone: the window inset's 16 at its start, 360 wide", 16f, title.left - header.left, 0.5f)
            assertEquals("$tone: the band spans the width", 360f, header.width, 0.5f)
        }
    }

    @Test
    fun theInsetIsTheContainers() {
        val tree = read(width = 800) {
            KozmosPageHeader(title = "Settings", modifier = Modifier.testTag("header"), inset = KozmosContainerInsetPanel)
        }
        assertEquals("a panel's 16 at 800 wide", 16f, tree.frame("Settings").left - tree.tagged("header").left, 0.5f)
        val window = read(width = 800) { KozmosPageHeader(title = "Settings", modifier = Modifier.testTag("header")) }
        assertEquals("the window's 24 at 800 wide", 24f, window.frame("Settings").left - window.tagged("header").left, 0.5f)
    }

    @Test
    fun theTitleIsHeadingThreesLineAtMdAndHeadingTwosAtLg() {
        val md = read { KozmosPageHeader(title = "Settings") }.frame("Settings")
        val lg = read { KozmosPageHeader(title = "Settings", size = KozmosPageHeaderSize.Lg) }.frame("Settings")
        assertEquals("md is a 32 line", 32f, md.height, 0.5f)
        assertEquals("lg is a 36 line", 36f, lg.height, 0.5f)
    }

    @Test
    fun aSlotLeftOutDrawsNothing() {
        val tree = read { KozmosPageHeader(title = "Settings", modifier = Modifier.testTag("header")) }
        assertEquals("only the title is read", listOf("Settings"), tree.unmerged.flatMap { it.texts })
        assertEquals("32 above, the 32 line, 24 below", 88f, tree.tagged("header").height, 0.5f)
    }

    @Test
    fun theSlotsAreReadInOrderAndTheActionsSitAtTheEnd() {
        // 600 wide: 568 inside holds a 256 text, the 16 gap and an 80 action.
        val tree = read(width = 600) {
            KozmosPageHeader(
                title = "Settings",
                modifier = Modifier.testTag("header"),
                description = "Manage the site's map.",
                breadcrumb = { Box(Modifier.size(120.dp, 20.dp).semantics { contentDescription = "crumbs" }) },
                info = { Box(Modifier.size(28.dp).semantics { contentDescription = "About" }) },
                actions = { Box(Modifier.size(80.dp, 44.dp).semantics { contentDescription = "Save" }) }
            )
        }
        val order = tree.merged.mapNotNull { it.words }.filter { it in listOf("crumbs", "Settings", "About", "Manage the site's map.", "Save") }
        assertEquals(listOf("crumbs", "Settings", "About", "Manage the site's map.", "Save"), order)
        val header = tree.tagged("header")
        val crumbs = tree.frame("crumbs")
        val title = tree.frame("Settings")
        val info = tree.frame("About")
        val description = tree.frame("Manage the site's map.")
        val save = tree.frame("Save")
        assertEquals("the breadcrumb 32 below the top", 32f, crumbs.top - header.top, 0.5f)
        assertEquals("the title 8 under the breadcrumb", 8f, title.top - crumbs.bottom, 0.5f)
        assertEquals("the info button 8 after the title", 8f, info.left - title.right, 0.5f)
        assertEquals("the info button centred on the title's line", title.center.y, info.center.y, 0.5f)
        assertEquals("the description 4 under the title", 4f, description.top - title.bottom, 0.5f)
        assertEquals("the actions at the end, 16 in", 16f, header.right - save.right, 0.5f)
        assertEquals("the actions centred on the title's line", title.center.y, save.center.y, 0.5f)
        assertEquals("24 under the description: a 44 action makes it no taller", 24f, header.bottom - description.bottom, 0.5f)
    }

    // React's row wraps (flex-wrap, gap 16, the text's basis 256): the
    // actions stay on the title's line where 256 + 16 + their width fits,
    // and go under the text, at its start, where it does not.
    private fun ReadSemantics.text(words: String): Rect =
        unmerged.first { it.texts.contains(words) }.frame.let {
            Rect(it.left / density, it.top / density, it.right / density, it.bottom / density)
        }

    private val longTitle = "Map content and every feature on every level of the site"

    // Each button in a tagged box: the box is the button's layout box, its
    // 48 touch target, which the row places; the 44 surface is 2 inside it.
    @Composable
    private fun twoActions() {
        Box(Modifier.testTag("import")) { KozmosButton(onClick = {}) { Text("Import") } }
        Box(Modifier.testTag("publish")) { KozmosButton(onClick = {}) { Text("Publish") } }
    }

    @Test
    fun aLongTitleAndTwoActionsWrapUnderTheTextAtPhoneWidth() {
        val tree = read(width = 320) {
            KozmosPageHeader(
                title = longTitle,
                modifier = Modifier.testTag("header"),
                description = "Manage the site's map.",
                actions = { twoActions() }
            )
        }
        val title = tree.text(longTitle)
        val description = tree.frame("Manage the site's map.")
        val import = tree.tagged("import")
        val publish = tree.tagged("publish")
        assertEquals("the text takes the 288 inside", 288f, description.right.coerceAtLeast(title.right) - title.left, 24f)
        assertEquals("the actions 16 under the text", 16f, import.top - description.bottom, 0.5f)
        assertEquals("at the text's start", title.left, import.left, 0.5f)
        assertEquals("8 apart on their own line", 8f, publish.left - import.right, 0.5f)
        assertEquals("on one line", import.top, publish.top, 0.5f)
        assertEquals("the header grows by them, 24 below", 24f, tree.tagged("header").bottom - import.bottom, 0.5f)
        assertEquals("their own height, the 48 touch target", 48f, import.height, 0.5f)
    }

    @Test
    fun wrappedActionsSitAtTheTextsStartRightToLeft() {
        val tree = read(width = 320) {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                KozmosPageHeader(title = longTitle, modifier = Modifier.testTag("header"), actions = { twoActions() })
            }
        }
        val header = tree.tagged("header")
        val import = tree.tagged("import")
        assertEquals("the first action at the right, the text's start, 16 in", 16f, header.right - import.right, 0.5f)
        assertEquals("under the title", 16f, import.top - tree.text(longTitle).bottom, 0.5f)
    }

    @Test
    fun aShortTitleAndOneActionStayOnTheTitlesLineWhereTheyFit() {
        val bare = read(width = 600) { KozmosPageHeader(title = "Settings", modifier = Modifier.testTag("header")) }
        val tree = read(width = 600) {
            KozmosPageHeader(
                title = "Settings",
                modifier = Modifier.testTag("header"),
                actions = { Box(Modifier.testTag("save")) { KozmosButton(onClick = {}) { Text("Save changes") } } }
            )
        }
        val header = tree.tagged("header")
        val title = tree.frame("Settings")
        val save = tree.tagged("save")
        assertEquals("at the end, the window's 16 in", 16f, header.right - save.right, 0.5f)
        assertEquals("centred on the title's line", title.center.y, save.center.y, 0.5f)
        assertEquals("the header no taller than with no actions", bare.tagged("header").height, header.height, 0.5f)
    }

    @Test
    fun anActionsSlotThatDrawsNothingReservesNoGap() {
        // A word with no break, broken by character: it fills what it is given.
        val word = "i".repeat(160)
        val without = read(width = 600) { KozmosPageHeader(title = word) }.text(word)
        val nothing = read(width = 600) {
            KozmosPageHeader(title = word, actions = { if (word.isEmpty()) Text("Save") })
        }.text(word)
        assertEquals("the title is as wide as with no actions", without.right, nothing.right, 0.5f)
        assertEquals("and as tall", without.height, nothing.height, 0.5f)
    }
}

private val KozmosContainerInsetPanel = com.kozmos.components.container.KozmosContainerInset.Panel

/** The band, read off what is drawn: theme 0 for Subtle, in the light and the dark, and nothing for Default. */
class KozmosPageHeaderBandPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val grey = 0xFF808080.toInt()
    private fun theme0(dark: Boolean) = if (dark) 0xFF051C4F.toInt() else 0xFFF1F5FE.toInt()

    private fun countTheme0(dark: Boolean, tone: KozmosPageHeaderTone): Int {
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(LocalDensity.current.density, 1f)
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(grey)).padding(8.dp)) {
                        KozmosPageHeader(title = "Settings", tone = tone)
                    }
                }
            }
        }
        var found = 0
        for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
            if (DrawnPixels.matches(drawn.argb(x, y), theme0(dark))) found++
        }
        return found
    }

    @Test
    fun theSubtleBandIsThemeZeroAndTheDefaultPaintsNone() {
        for (dark in listOf(false, true)) {
            val subtle = countTheme0(dark, KozmosPageHeaderTone.Subtle)
            val plain = countTheme0(dark, KozmosPageHeaderTone.Default)
            println("GAP-036 Android, ${if (dark) "dark" else "light"}: Subtle $subtle, Default $plain pixels of theme 0")
            assertTrue("dark=$dark: the subtle band draws theme 0 ($subtle pixels)", subtle > 1000)
            assertEquals("dark=$dark: the default tone draws no theme 0", 0, plain)
        }
    }
}
